# 007-SpringBoot多数据源配置
## 1-何时用到多数据源？

在一个单体应用中，通常只会操作一个数据库，也只会配置一个数据源，但有时也会遇到需要在项目中操作多个数据库的情况，通常的应用场景如下：

- 分库分表：当数据量增大，单个数据库无法满足需求时，可以将数据分散存储到多个数据库中，每个数据库称为一个数据源。这样可以提高数据库的读写性能。
- 主从复制：在一些高并发的场景下，可以通过主从复制的方式实现读写分离。主数据库负责写操作，从数据库负责读操作。主从数据库可以配置为不同的数据源。
- 跨数据源的业务需求：有些业务场景可能需要访问不同的数据源，例如多个部门独立管理的系统、多个租户独立的SaaS系统等。这时需要在应用程序中配置多个数据源。

## 2-单一数据源的整合

这里以阿里的 druid 连接池为例，需要的依赖坐标如下：

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.2.16</version>
</dependency>
```

阿里的 druid 数据库连接池的功能是十分强大的，如：数据监控、数据库加密等功能，这里仅仅演示与 SpringBoot 整合的过程。

通常情况下，我们会在 SpringBoot 的全局配置文件（application.yml）中使用如下配置来整合单一数据源：

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/db
    username: root
    password: root
    type: com.alibaba.druid.pool.DruidDataSource
```

在配置文件中进行配置数据源比较简单。下面介绍配置数据源的另一种方式：

在 `druid-spring-boot-starter` 自动配置类中 `DruidDataSourceAutoConfigure` 中有如下一段代码：

```java
@Bean(initMethod = "init")
@ConditionalOnMissingBean
public DataSource dataSource() {
    LOGGER.info("Init DruidDataSource");
    return new DruidDataSourceWrapper();
}
```

`@ConditionalOnMissingBean` 和 `@Bean` 这两个注解的结合，意味着我们可以在 Spring 容器中注入一个 DataSource 类型的 Bean 就可以实现数据源的配置。

```java
@Configuration
public class DataSourceConfig {
    @Bean
    public DataSource dataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setUrl("jdbc:mysql://localhost:3306/db");
        dataSource.setUsername("root");
        dataSource.setPassword("root");
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        return dataSource;
    }
}
```

## 3-AbstractRoutingDataSource

`AbstractRoutingDataSource` 在 `org.springframework.jdbc.datasource.lookup` 包下，通过这个类可以实现动态数据源切换，下面是该类的部分源码：

```java
public abstract class AbstractRoutingDataSource 
    extends AbstractDataSource 
    implements InitializingBean {

    // 用于存储要动态切换的datasource
	@Nullable
	private Map<Object, Object> targetDataSources;

    // 默认数据源对象
	@Nullable
	private Object defaultTargetDataSource;

    // 通过JNDI查找数据源，如果数据源不存在是否回滚到默认数据源，默认：true
	private boolean lenientFallback = true;

    // 通过JNDI查找多数据源对象默认实现类
	private DataSourceLookup dataSourceLookup = new JndiDataSourceLookup();

    // 数据源集合的解析后的key-value对象
	@Nullable
	private Map<Object, DataSource> resolvedDataSources;

    // 数据源集合的解析后的key-value对象
	@Nullable
	private DataSource resolvedDefaultDataSource;
}
```

### 3.1 determineTargetDataSource()

`AbstractRoutingDataSource` 中的 `determineTargetDataSource()` 方法用于获取当前线程中对应的数据源，其源码如下：

```java
protected DataSource determineTargetDataSource() {
    Assert.notNull(this.resolvedDataSources, "DataSource router not initialized");
    // 获取当前线程对应数据源的标识key
    // 该方法为抽象方法，需要客户端重写
    Object lookupKey = determineCurrentLookupKey();
    // 从数据源集合中获取数据源对象
    DataSource dataSource = this.resolvedDataSources.get(lookupKey);
    // 如果lenientFallback回退属性为true
    if (dataSource == null && (this.lenientFallback || lookupKey == null)) {
        // 如果数据源不存在，则回退到默认数据源
        dataSource = this.resolvedDefaultDataSource;
    }
    // 如果数据源不存在，则抛出异常
    if (dataSource == null) {
        throw new IllegalStateException("Cannot determine target DataSource for lookup key [" + lookupKey + "]");
    }
    return dataSource;
}
```

### 3.2 afterPropertiesSet()

`AbstractRoutingDataSource` 中的 `afterPropertiesSet()` 方法，会将 targetDataSources、defaultTargetDataSource 两个数据源属性对象解析为 `DataSource` 对象，其源码如下：

```java
public void afterPropertiesSet() {
    if (this.targetDataSources == null) {
        throw new IllegalArgumentException("Property 'targetDataSources' is required");
    }
    this.resolvedDataSources = CollectionUtils.newHashMap(this.targetDataSources.size());
    this.targetDataSources.forEach((key, value) -> {
        Object lookupKey = resolveSpecifiedLookupKey(key);
        DataSource dataSource = resolveSpecifiedDataSource(value);
        this.resolvedDataSources.put(lookupKey, dataSource);
    });
    if (this.defaultTargetDataSource != null) {
        this.resolvedDefaultDataSource = resolveSpecifiedDataSource(this.defaultTargetDataSource);
    }
}
```

该方法调用的 `resolveSpecifiedDataSource()` 方法，来处理具体的解析业务，源码如下：

```java
protected DataSource resolveSpecifiedDataSource(Object dataSource) throws IllegalArgumentException {
    // 如果数据源对象是DataSource的实例对象，直接返回
    if (dataSource instanceof DataSource) {
        return (DataSource) dataSource;
    }
    // 如果是字符串对象，则视其为dataSourceName，则调用JndiDataSourceLookup的getDataSource方法
    else if (dataSource instanceof String) {
        return this.dataSourceLookup.getDataSource((String) dataSource);
    }
    else {
        throw new IllegalArgumentException(
            "Illegal data source value - only [javax.sql.DataSource] and String supported: " + dataSource);
    }
}
```

## 4-实现动态数据源

### 4.1 环境准备

首先，在本地创建两个数据库 db1 和 db2，每个数据库下都创建一张 `user` 表：

```sql
CREATE TABLE `t_user`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户主键',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `password` varchar(100) DEFAULT NULL COMMENT '密码',
  PRIMARY KEY (`id`) USING BTREE
)
```

然后，在 SpringBoot 的全局配置文件中，配置数据源的相关信息：

```yaml
spring:
  datasource:
    druid:
      db1:
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://localhost:3306/db1?serverTimezone=Asia/Shanghai
        username: root
        password: root
      db2:
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://localhost:3306/db2?serverTimezone=Asia/Shanghai
        username: root
        password: root
```

### 4.2 数据源切换如何保证线程隔离？

数据源属于一个公共的资源，在多线程的情况下如何保证线程隔离呢？不能我这边切换了影响其他线程的执行。

说到线程隔离，自然会想到 `ThreadLocal` 了，将切换数据源的 KEY （用于从 targetDataSources 中取值）存储在 `ThreadLocal` 中，执行结束之后清除即可。

这里单独封装一个 `DataSourceHolder`，内部使用 `ThreadLocal` 隔离线程，代码如下：

```java
public class DataSourceHolder {
    //线程 本地环境
    private static final ThreadLocal<String> dataSources = new InheritableThreadLocal<>();
    
    // 设置数据源
    public static void setDataSources(String dataSource) {
        dataSources.set(dataSource);
    }

    // 获取数据源
    public static String getDataSource() {
        return dataSources.get();
    }

    //清除数据源
    public static void clearDataSource() {
        dataSources.remove();
    }
}
```

### 4.3 创建动态数据源

要实现数据源的动态切换，那我们就创建一个动态数据源，代码如下：

```java
public class DynamicDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return DataSourceHolder.getDataSource();
    }

    public DynamicDataSource(
        DataSource defaultTargetDataSource, 
        Map<Object,Object> targetDataSources){
        // 默认的数据源，可以作为主数据源
        super.setDefaultTargetDataSource(defaultTargetDataSource);
        //目标数据源
        super.setTargetDataSources(targetDataSources);
        //执行afterPropertiesSet方法，完成Datasource对象的解析
        super.afterPropertiesSet();
    }
}
```

### 4.4 初始化动态数据源

创建动态数据源后，需要对数据源进行初始化，代码如下：

```java
@Configuration
public class DataSourceConfig {
    
    @Bean(name = "hisDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.db1")
    public DataSource getHisDataSource() {
        return DruidDataSourceBuilder.create().build();
    }
    @Bean(name = "datasource")
    @ConfigurationProperties(prefix = "spring.datasource.db2")
    public DataSource getDateSource() {
        return DruidDataSourceBuilder.create().build();
    }

    @Bean("targetDataSource")
    public DynamicDataSource dynamicDataSource(
            @Qualifier("hisDataSource") DataSource hisDataSource,
            @Qualifier("datasource") DataSource dataSource) {
        Map<Object, Object> targetDataSource = new HashMap<>();
        targetDataSource.put("hisDataSource",hisDataSource);
        targetDataSource.put("datasource",dataSource);
        return new DynamicDataSource(hisDataSource,targetDataSource);
    }
}
```

### 4.5 整合Mybatis

`AbstractRoutingDataSource` 是 spring-jdbc 提供的，我们不需要太多的配置，但实际开发中经常使用的 ORM 框架却是 Mybatis，使用起来略微不同。

先来看看，spring-jdbc 是如何使用动态数据源的。

首先，在 Spring 容器中注入 JdbcTemplate：

```java
@Configuration
public class DataSourceConfig {
    ......
    // JdbcTemplate 使用的 DataSource 一定是动态数据源
    @Bean
    public JdbcTemplate template(@Qualifier("dynamicDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

}
```

接着，在 UserService 中使用：

```java
@Service
public class UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void insertDB1User(User user) {
        DataSourceHolder.setDataSource("hisDataSource");
        String sql = "insert into t_user(username,password) values(?,?)";
        jdbcTemplate.update(sql,user.getUsername(),user.getPassword());
        DataSourceHolder.clearDataSource();
    }

    public void insertDB2User(User user) {
        DataSourceHolder.setDataSource("datasource");
        String sql = "insert into t_user(username,password) values(?,?)";
        jdbcTemplate.update(sql,user.getUsername(),user.getPassword());
        DataSourceHolder.clearDataSource();
    }
}
```

下面介绍如何在 Mybatis 中实现动态数据源的使用。

在 SpringBoot 整合 Mybatis 需要导入如下依赖坐标：

```xml
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>2.3.1</version>
</dependency>
```

在使用时，通常只需要在 `application.yml` 配置文件中进行简单配置即可，如：

```yaml
mybatis:
  type-aliases-package: com.boot.domain
  mapper-locations: classpath:/mapper/**/*.xml
  configuration:
    map-underscore-to-camel-case: true
```

Mybatis 是由 `SqlSessionFactory` 提供 `SqlSession` 连接的，如果将动态数据源设置到 `SqlSessionFactory` 中，是不是就可以实现数据源的动态切换呢？答案是可以的。

下面是 `SqlSessionFactory` 的配置：

```java
@Configuration
public class MybatisConfig {
    
    @Bean
    public SqlSessionFactory sqlSessionFactory(@Qualifier("dynamicDataSource")DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource); // 设置动态数据源
        Resource[] resource = new PathMatchingResourcePatternResolver()
            .getResources("classpath:/mapper/**/*.xml");
        factoryBean.setMapperLocations(resource); // 设置mapper文件路径
        factoryBean.setTypeAliasesPackage("com.boot.domain"); // 设置别名包
        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true); // 开启下划线转驼峰
        factoryBean.setConfiguration(configuration);
        return factoryBean.getObject();
    }
}
```

最后，来看看如何使用：

```java
@Service
public class UserService {

    @Autowired
    private DB1UserMapper userMapper1;

    @Autowired
    private BD2UserMapper userMapper2;


    public void insertDB1UserByMyBatis(User user) {
        DataSourceHolder.setDataSource("hisDataSource");
        userMapper1.insertDB1User(user);
        DataSourceHolder.clearDataSource();
    }

    public void insertDB2UserByMyBatis(User user) {
        DataSourceHolder.setDataSource("datasource");
        userMapper2.insertDB2User(user);
        DataSourceHolder.clearDataSource();
    }
}
```

### 4.6 自定义注解切换数据源

无论是 JdbcTemplate 还是 Mybatis，每次的接口调用都需要调用 `DataSourceHolder.setDataSources()` 来设置数据源，为了方便操作且更低耦合，可以定义一个切换数据源的注解，如下：

```java
@Target(value = ElementType.METHOD)
@Retention(value = RetentionPolicy.RUNTIME)
@Documented
public @interface SwitchDataSource {

    // 默认切换的数据源KEY
    String DEFAULT_NAME = "hisDataSource";

    // 需要切换到数据的KEY
    String value() default DEFAULT_NAME;
}
```

注解中只有一个 `value` 属性，指定了需要切换数据源的 KEY 。有注解还不行，当然还要有切面，代码如下：

```java
@Aspect
//优先级设置到最高
@Order(Ordered.HIGHEST_PRECEDENCE)
@Component
public class DataSourceAspect {

    @Pointcut("@annotation(com.boot.annotation.SwitchDataSource)")
    public void pointcut() {}

    @Around(value = "pointcut()")
    public Object  beforeOpt(ProceedingJoinPoint joinPoint) throws Throwable {
        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        SwitchDataSource switchSource = method.getAnnotation(SwitchDataSource.class);
        DataSourceHolder.setDataSource(switchSource.value());
        try {
            return joinPoint.proceed();
        } finally {
            DataSourceHolder.clearDataSource();
        }
    } 

}
```

这个 `Aspect` 很容易理解，在执行目标方法之前，取 `@SwitchDataSource` 注解中 `value` 属性设置到`ThreadLocal` 中；在目标方法执行后，清除掉 `ThreadLocal` 中的 KEY ，保证了如果不切换数据源，则用默认的数据源。

### 4.7 配置事务管理器

Spring 的事务是基于数据源的，数据源变了事务管理器自然也要变，我们需要自定义一个事务管理器，使其管理的数据源是动态数据源：

```java
@Bean
public PlatformTransactionManager platformTransactionManager(
    @Qualifier("dynamicDataSource") DataSource dataSource) {
    return new DataSourceTransactionManager(dataSource);
}
```

切换数据源是基于 AOP 的，而 Spring 的事务也是基于 AOP 的，那么如何保证切换数据源在前面执行呢？

其实，在前面配置切换数据源切面的时候就已经通过 `@Order` 注解，将切换数据源的 Aspect 优先级调到了最高。

::: tip

此种情况仅适用于多数据源下的单库事务操作！！！

:::