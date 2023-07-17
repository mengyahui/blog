# 005-SpringBoot日志管理

## 1- 为什么要用日志？

日志就是记录发生了什么。为啥要记录发生了什么呢？想象⼀下，如果程序报错了，不让你打开控制台看⽇志，那么你能找到报错的原因吗？因此我们需要记录程序的行为，通过这些行为能让我们更好的发现和定位错误所在位置。

除了发现和定位问题之外，还可以通过⽇志实现以下功能：

- 记录⽤户登录⽇志，⽅便分析⽤户是正常登录还是恶意破解⽤户。
- 记录系统的操作⽇志，⽅便数据恢复和定位操作⼈。
- 记录程序的执⾏时间，⽅便为以后优化程序提供数据⽀持。

## 2-SpringBoot默认日志管理

### 2.1 日志分类

Java 中的日志框架主要分为两大类：

**日志门面**：日志门面定义了一组日志的接口规范，它并不提供底层具体的实现逻辑。`Apache Commons Logging` 和 `Slf4j` 就属于这一类。

**日志实现**：日志实现是日志具体的实现，包括日志级别控制、日志打印格式、日志输出形式（输出到数据库、输出到文件、输出到控制台等）。`Log4j`、`Log4j2`、`Logback` 以及 `Java Util Logging` 则属于这一类。

将日志门面和日志实现分离其实是一种典型的门面模式，这种方式可以让具体业务在不同的日志实现框架之间自由切换，而不需要改动任何代码，开发者只需要掌握日志门面的 API 即可。

日志门面是不能单独使用的，它必须和一种具体的日志实现框架相结合使用。那么日志框架是否可以单独使用呢？

技术上来说当然没问题，但是我们一般不会这样做，因为这样做可维护性很差，而且后期扩展不易。

SpringBoot 底层采用 Slf4j + Logback 作为默认的日志系统，同时提供了一个名为 `spring-boot-starter-logging` 的 Starter 为常见的日志框架（如 Log4j 等）提供了自动化配置。

![image-20230715211030742](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springboot/image-20230715211030742.2o7s796z7560.png)

### 2.2 日志级别

Logback 默认提供的日志级别从低到高分别为：

1. TRACE：最低级别的日志，用于记录程序的详细信息，通常用于排查问题；
2. DEBUG：用于记录程序的调试信息，通常用于开发和测试阶段；
3. INFO：用于记录程序的运行状态信息，通常用于记录程序的启动、关闭等信息；
4. WARN：用于记录警告信息，表示程序可能存在潜在的问题，但不会影响程序的正常运行；
5. ERROR：最高级别的日志，用于记录程序中的错误信息，通常在程序出现异常时使用。

SpringBoot 应用，日志默认输出到控制台，日志级别包含：ERROR、WARN 和 INFO，这是因为 SpringBoot 默认的日志级别是 INFO，若要开启 DEBUG 级别的日志，可以在 application.yml 配置文件中配置如下内容：

```yaml
debug: true
```

但是在实际项目中，日志通常的配置如下：

```yaml
logging:
  level:
    root: info
    com.example.controller: debug
    com.example.service: debug
```

其中，root 表示组表示整个项目，同时也可以为不同的包指定不同的日志级别，这会覆盖 root 的日志级别。

像上面那样以包为单位设置日志级别是很麻烦的，此时可以将相同日志级别的包定义到同一个组中，再为组设置日志级别，就像下面这样：

```yaml
logging:
  group:
    server: com.example.service, com.example.controller
    sql: com.example.mapper
  level:
    root: info
    server: debug
    sql: trace
```

### 2.3 打印日志

SpringBoot 打印日志，通常需要先获取日志对象，具体如下：

```java
@RestController
@RequestMapping("/user")
public class UserController {

    public static final Logger log = LoggerFactory.getLogger(UserController.class);
    
}
```

除此之外，获取日志对象也可以使用 Lombok 的 `@Slf4j` 注解替代：

```java
@Slf4j
@RestController
@RequestMapping("/user")
public class UserController {
}
```

拿到日志对象后，调用相应的方法即可打印不同级别的日志，`{}` 可以作为日志输出的占位符，数据在之后传入，如：`log.error("用户id：{}不存在",userId)`

### 2.4 自定义日志格式

在 SpringBoot 项目的配置文件中添加如下配置，可以自定义日志输出格式：

```yaml
logging:
  pattern:
    file: '%d{yyyy-MM-dd} [%thread] %-5level %logger{50} - %msg%n'
    console: '%d{yyyy-MM-dd hh:mm:ss} [%thread] %-5level %logger{50} - %msg%n'
```

下面是常用日志配置参数的说明：

| 配置参数                     | 说明                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| %d{yyyy-MM-dd HH:mm:ss, SSS} | 日志生产时间，输出到毫秒的时间                               |
| %-5level                     | 输出日志级别，-5 表示左对齐并且固定输出 5 个字符，如果不足在右边补 0 |
| %logger 或 %c                | logger 的名称                                                |
| %thread 或 %t                | 输出当前线程名称                                             |
| %message 或 %msg 或 %m       | 日志内容，即 logger.info("message")                          |
| %class 或 %C                 | 输出 Java 类名                                               |
| %method 或 %M                | 输出方法名                                                   |
| hostName                     | 本地机器名                                                   |
| hostAddress                  | 本地 ip 地址                                                 |

### 2.5 持久化日志

SpringBoot 日志的默认配置，只会输出日志到控制台，但是在生产环境通常都需要将日志持久化到文件中，实现也很简单，只需要在配置文件添加几个简单的配置即可：

```yaml
logging:
  file:
    # 指定日志文件名字和路径
    # name: D:\\logs\\run.log
    # 指定日志文件路径，不能指定日志文件的名字，固定为 spring.log
    path: log/
```

::: tip

1. `logging.file.name` 和 `logging.file.path` 只需要配置一个，若同时存在，则 path 无效；
2. 默认情况下，日志文件的大小达到 10MB 时会切分一次，产生新的日志文件

:::

## 3-Logback日志文件

在 SpringBoot 配置文件中对日志进行的配置只适用一些简单的场景，对于比较负杂的场景，像区分 info 和 error 的日志、每天产生一个日志文件等场景，使用配置文件实现则更加合适。

SpringBoot 为各个日志实现配置了默认的配置文件名，只需要将日志文件放到 resources 目录下，即可被正确加载。以 Logback 为例，SpringBoot 默认支持的配置文件名为：

- logback-spring.xml
- logback-spring.groovy
- logback.xml
- logback.groovy

Spring 官方推荐优先使用带有 `-spring` 的文件名作为日志配置，这是因为命名为 logback-spring.xml 配置文件不会被日志框架直接加载，而是由 SpringBoot 解析日志配置文件，这意味着我们可以在 logback-spring.xml 配置文件中添加一些 SpringBoot 特有的配置项，比如获取 `application.yml` 中定义的数据，这是在 logback.xml 中是无法获取的。

除此之外，SpringBoot 还支持在 `application.yml` 使用如下配置自定义配置日志文件名：

```yaml
logging:
  config: classpath:logback-core.xml
```

下面给出一个 Logback 的常用配置文件，实际开发可根据该配置文件进行修改：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration scan="true" scanPeriod="60 seconds" debug="false">
    <!-- 日志存放路径 -->
	<property name="log.path" value="logs/gt" />
   <!-- 日志输出格式 -->
	<property name="log.pattern" value="%d{HH:mm:ss.SSS} [%thread] %-5level %logger{20} - [%method,%line] - %msg%n" />

    <!-- 控制台输出 -->
	<appender name="console" class="ch.qos.logback.core.ConsoleAppender">
		<encoder>
			<pattern>${log.pattern}</pattern>
		</encoder>
	</appender>

    <!-- 系统日志输出 -->
	<appender name="file_info" class="ch.qos.logback.core.rolling.RollingFileAppender">
	    <file>${log.path}/info.log</file>
        <!-- 循环政策：基于时间创建日志文件 -->
		<rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <!-- 日志文件名格式 -->
			<fileNamePattern>${log.path}/info.%d{yyyy-MM-dd}.log</fileNamePattern>
			<!-- 日志最大的历史 60天 -->
			<maxHistory>60</maxHistory>
		</rollingPolicy>
		<encoder>
			<pattern>${log.pattern}</pattern>
		</encoder>
		<filter class="ch.qos.logback.classic.filter.LevelFilter">
            <!-- 过滤的级别 -->
            <level>INFO</level>
            <!-- 匹配时的操作：接收（记录） -->
            <onMatch>ACCEPT</onMatch>
            <!-- 不匹配时的操作：拒绝（不记录） -->
            <onMismatch>DENY</onMismatch>
        </filter>
	</appender>

    <appender name="file_error" class="ch.qos.logback.core.rolling.RollingFileAppender">
	    <file>${log.path}/error.log</file>
        <!-- 循环政策：基于时间创建日志文件 -->
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <!-- 日志文件名格式 -->
            <fileNamePattern>${log.path}/error.%d{yyyy-MM-dd}.log</fileNamePattern>
			<!-- 日志最大的历史 60天 -->
			<maxHistory>60</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>${log.pattern}</pattern>
        </encoder>
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <!-- 过滤的级别 -->
            <level>ERROR</level>
			<!-- 匹配时的操作：接收（记录） -->
            <onMatch>ACCEPT</onMatch>
			<!-- 不匹配时的操作：拒绝（不记录） -->
            <onMismatch>DENY</onMismatch>
        </filter>
    </appender>

    <!-- 系统模块日志级别控制  -->
	<logger name="com.g" level="info" />
	<!-- Spring日志级别控制  -->
	<logger name="org.springframework" level="warn" />

	<root level="info">
		<appender-ref ref="console" />
	</root>
	
	<!--系统操作日志-->
    <root level="info">
        <appender-ref ref="file_info" />
        <appender-ref ref="file_error" />
    </root>
</configuration>
```