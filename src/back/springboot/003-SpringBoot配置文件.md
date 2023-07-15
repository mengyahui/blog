# 003-SpringBoot配置文件
在使用 Spring Initializr 构建完 SpringBoot 项目后，会在 resources 目录下生成一个默认的全局配置文件 `application.properties`，在这个配置文件进行的修改，会影响 SpringBoot 底层的自动配置。

SpringBoot 的配置文件名是固定的，必须是 `application.properties`，也可以是 `application.yml`，这两个配置文件的本质是一样的，只是语法不同。相对于 `properties` 来讲，`YML` 更加年轻，层级也更加分明。

下面是 `application.yml` 配置文件语法的具体示例：

```yaml
user:
  age: 25
  name: zhangsan
  active: true
  created-date: 2018/03/31 16:54:30
  address: {k1: v1,k2: v2}
  hobbies:
    - one
    - two
    - three
```



YML 是一种新式的格式，层级鲜明，个人比较喜欢使用的一种格式，注意如下：

1. **字符串可以不加引号，若加双引号则输出特殊字符，若不加或加单引号则转义特殊字符**

2. **数组类型，短横线后面要有空格；对象类型，冒号后面要有空格**

3. **YAML是以空格缩进的程度来控制层级关系，但不能用 tab 键代替空格，大小写敏感**

## 1-配置随机值

在⼀些情况下，有些参数我们需要希望它不是⼀个固定的值，⽐如密钥、服务端⼝等。SpringBoot 内部提供了一个 `random.*` 属性，专门用于生成随机值，可以通过 `${random.*}` 来使用，下面是对应属性的描述：

| 属性                 | 描述                                                       |
| -------------------- | ---------------------------------------------------------- |
| random.int           | 随机产生正负的整数                                         |
| random.int(max)      | 随机产生 [0, max) 区间的整数                               |
| random.int(min,max)  | 随机产生 [min, max) 区间的整数                             |
| random.long          | 随机产生正负的长整数                                       |
| random.long(max)     | 随机产生 [0, max) 区间的长整数                             |
| random.long(min,max) | 随机产生 [min, max) 区间的长整数                           |
| random.uuid          | 产生 UUID 字符串（含‘-‘字符）                              |
| random.*             | `*` 表示除上面列举之外的其它字符，用于随机产生 32 位字符串 |

## 2-配置文件优先级

理论上讲 SpringBoot 可以同时存在这两种格式的配置文件，但如果 properties 与 yml 配置文件中出现了相同的配置，那么会以 properties 配置文件中的配置为主。

在实际业务中，通常只会采取一种统一的配置文件格式，这样可以更好的维护项目

SpringBoot 项目在启动时，不仅仅加载 resources 目录下的配置文件，以下位置的配置也会被加载：

| 路径              | 说明                     | 优先级 |
| ----------------- | ------------------------ | ------ |
| ./config          | 项目根目录下的config目录 | 1      |
| ./                | 项目根目录               | 2      |
| classpath:/config | 资源目录下的 config 目录 | 3      |
| classpath:/       | 资源目录的根目录         | 4      |

有的时候，配置信息是我们无法在开发时就能确定的，比如数据库配置，加密密钥配置等。这时候就需要把配置文件放到外边，让用户自定义配置部署。

只需要将配置文件放到 SpringBoot 打包的 jar 同级目录下或 config 目录下，程序启动时就会自动读取该配置文件

::: tip

除了 application.xxx 类型的配置文件，SpringBoot 项目启动时还会加载名为 bootstrap.xxx 的配置文件。bootstarp 文件用于配置系统级别的参数，如：程序的端口号、配置中心地址等；而 application 文件则是用于配置应用级别的参数，如：日志级别、一些开关参数。

:::

## 3-如何从配置文件中取值？

一切的配置都是为了取值，SpringBoot 也是提供了几种取值的方式，下面一一介绍。

### 3.1 @ConfigurationProperties

`@ConfigurationProperties` 注解标注在实体类上，用于读取一组配置，可使用其 prefix 属性指定配置文件中属性的前缀，如：

```java
@Component
@Data
@ConfigurationProperties(prefix = "profile")
public class Profile {

    private String name;
    private String desc;

}
```

此时，IDEA 中应该会出现如下提示：

![image-20230715142231163](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springboot/image-20230715142231163.199w34b77sps.png)

什么意思呢？

其实 SpringBoot 底层为各种场景的配置都提供了一个配置元数据文件，供 IDE 使用。在添加或修改 application.yml 配置文件属性时进行提示。

而我们自定义的属性是不具备自动提示的功能的，如果你想使用此功能，可以在项目的 pom 文件中添加如下依赖坐标：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-configuration-processor</artifactId>
    <optional>true</optional>
</dependency>
```

这个依赖只是为了我们开发方便，和实际的业务无关，所以不需要出现在项目打包后的 jar 包中，因此，我们可以通过如下插件在项目打包时，排除掉这个依赖。

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <excludes>
                    <exclude>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-configuration-processor</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### 3.2 @Value

`@Value` 注解可以读取单个配置项，示例代码如下

```java
@RestController
public class HelloController {

    @Value("${profile.name}")
    private String name;

    @GetMapping("/hello")
    public String hello() {
        return name;
    }
}
```

## 4-如何从自定义配置文件中取值？

SpringBoot 在启动的时候会自动加载 application.xxx 和 bootsrap.xxx ，但是为了区分，有时候需要自定义一个配置文件，那么如何从自定义的配置文件中取值呢？此时就需要配合 `@PropertySource` 这个注解使用了

只需要在配置类上标注 `@PropertySource` 并指定你自定义的配置文件即可完成.

加入 resources 目录下有一个 java-info.properties 文件，内容如下：

```java
java.version=11
java.framework=SpringBoot
```

在一个 JavaBean 中可以通过如下代码读取 user.properties 文件中的配置信息：

```java
@Component
@Data
@PropertySource(value = "classpath:user.properties",encoding = "UTF-8")
public class JavaInfo {

    @Value("${java.version}")
    private String version;

    @Value("${java.framework}")
    private String framework;
}
```

`@PropertySource` 注解只是用于加载自定义配置文件的配置信息，读取配置信息还是需要配合 `@Value` 或 `@ConfigurationProperties` 注解来使用。

此外，`@PropertySource` 注解是不支持加载 YML 文件的，怎么解决呢？

`@PropertySource` 注解有一个属性 factory ，默认值是 `PropertySourceFactory.class` ，这个就是用来加载 properties 格式的配置文件，我们可以自定义一个用来加载 YML 格式的配置文件，如下：

```java
public class YMLPropertyFactory implements PropertySourceFactory {
    @Override
    public PropertySource<?> createPropertySource(String name, EncodedResource resource) throws IOException {
        Properties propertiesFromYaml = loadYamlIntoProperties(resource);
        String sourceName = name != null ? name : resource.getResource().getFilename();
        assert sourceName != null;
        return new PropertiesPropertySource(sourceName, propertiesFromYaml);
    }


    private Properties loadYamlIntoProperties(EncodedResource resource) throws FileNotFoundException {
        try {
            YamlPropertiesFactoryBean factory = new YamlPropertiesFactoryBean();
            factory.setResources(resource.getResource());
            factory.afterPropertiesSet();
            return factory.getObject();
        } catch (IllegalStateException e) {
            // for ignoreResourceNotFound
            Throwable cause = e.getCause();
            if (cause instanceof FileNotFoundException)
                throw (FileNotFoundException) e.getCause();
            throw e;
        }
    }

}
```

此时，只需要将 factory 属性值指定为 YMLPropertyFactory 即可：

```java
@Component
@Data
@PropertySource(value = "classpath:user.properties",factory=YMLPropertyFactory.class)
public class JavaInfo {

    @Value("${java.version}")
    private String version;

    @Value("${java.framework}")
    private String framework;
}
```