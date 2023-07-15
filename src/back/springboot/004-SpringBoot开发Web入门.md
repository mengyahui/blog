# 004-SpringBoot开发Web入门
SpringBoot 对应 Web 开发的 Starter 只有一个，上一篇创建 HelloWorld 项目时已经使用了：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

**看似只是引入了一个依赖，但是在其实内部引入了 Spring、Spring MVC 的相关依赖，SpringBoot的启动器就是这么神奇！！！**

## 1-开发一个接口

假设这么一个需求，需要根据订单 ID，查询订单信息，该如何写接口呢？其实和 Spring MVC 的开发步骤一致，需要先定义一个 Controller，在使用 Spring MVC 提供的各种注解将 Controller 中的方法定义成接口，代码如下：

```java
@RestController
@RequestMapping("/order")
public class OrderController {

    @GetMapping("{id}")
    public Object getByOrderId(@PathVariable Long id) {
        Order order = new Order();
        order.setId(id);
        order.setTitle("红米K50");
        order.setPrice("2999");
        order.setCreateTime(new Date());
        return order;
    }
}
```

项目启动后，访问 http://localhost:8080/user/1 即可得到如下结果：

```json
{
    "id": 1,
    "title": "红米K50",
    "price": "2999",
    "createTime": "2023-07-12T10:02:19.548+00:00"
}
```

## 2-Spring MVC 配置接口

在 SpringBoot 中配置 Spring MVC 有两种方法，第一种是实现 `WebMvcConfigurer` 接口，第二种是继承 `WebMvcConfigurationSupport` 类，那么这两种实现方式有什么区别呢？

其实在 Spring 5.0 前，配置类需要继承 `WebMvcConfigurerAdapter`，如果加 `@EnableWebMvc` 注解，则为全面接管 Spring MVC，否则为自定义扩展配置。

而在 Spring 5.0 之后，全面接管 Spring MVC，需要继承 `WebMvcConfigurationSupport`，而自定义扩展配置则需要实现`WebMvcConfigurer`接口。

重写 `WebMvcConfigurer`接口中的不同方法可以实现对 Spring MVC 的个性化定制，下表展示了该接口中可以实现的方法及其功能。

| 方法名称                           | 功能描述                                                  |
| ---------------------------------- | --------------------------------------------------------- |
| configurePathMatch                 | 配置请求的 url 和 handler 的映射关系                      |
| configureContentNegotiation        | 内容协商配置，可以实现同一URI指向的资源提供不同的展现形式 |
| configureAsyncSupport              | 配置异步请求，可以设置超时时间和异步任务执行器            |
| configureDefaultServletHanding     | 配置默认的静态资源处理器                                  |
| addResourceHandlers                | 添加自定义静态资源处理                                    |
| addFormatters                      | 添加自定义的 Converter 和 Formatter                       |
| addCorsMappings                    | 添加跨域相关参数                                          |
| addInterceptors                    | 添加自定义拦截器                                          |
| addViewControllers                 | 添加自定义视图控制器                                      |
| configureViewResolvers             | 配置视图解析器                                            |
| addArgumentResolvers               | 添加自定义方法参数处理器                                  |
| addReturnValueHandlers             | 配置统一返回值的处理器                                    |
| configureMessageConverters         | 配置消息转换器                                            |
| extendMessageConverters            | 拓展消息转换器                                            |
| configureHandlerExceptionResolvers | 配置异常处理器                                            |
| extendHandlerExceptionResolvers    | 拓展异常处理器                                            |

::: tip 为什么 实现 `WebMvcConfigurer` 接口 取代了 继承 `WebMvcConfigurerAdapter` 的方式？

在 Java8 推出接口的 default 方法后，`WebMvcConfigurerAdapter` 中的空实现可以直接在 `WebMvcConfigurer` 中定义为 default 方法，从而实现 `WebMvcConfigurer`接口也能实现相同的功能。

:::

## 3-JSON格式化

在前后端分离的项目中大部分的接口基本都是返回 JSON 字符串，在某些特殊场景下需要对返回的 JSON 进一步的定制，如日期的格式、NULL 值是否返回等。

SpringBoot 默认是使用 Jackson 对返回结果进行处理，在引入 Web 启动器的时候会引入相关的依赖，如下图：

![image-20230712190427623](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springboot/image-20230712190427623.4e032ghao3s0.png)

Jackson 的 自动配置类是 JacksonAutoConfiguration，我们可以选择在配置文件中修改 JackSon 的配置，也可以在配置类中修改。

### 3.1 日期格式化

上面的例子中日期的返回结果其实是一个时间戳，那么我们需要返回格式为 yyyy-MM-dd HH:mm:ss，则可以在 application.yml 配置文件中进行如下配置：

```yaml
spring:
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss #日期格式化
    time-zone: GMT+8 #时区
```

也可以在实体属性上使用 `@JsonFormat` 注解来配置日期格式化，但这属于局部配置，仅仅在其标注的实体属性上生效：

```java
@JsonFormat(pattern = "yyyy/MM/dd HH:mm:ss",timezone = "GMT+8")
private Date createTime;
```

### 3.2 拓展消息转换器

在某些场景下 Spring MVC 的默认消息转换器并不能满足实际需求，如：

1. 在分布式场景下，数据库 id 都是采用雪花算法生成，那么在传输给前端的时候就会产生**精度丢失**的问题，前端并没有 Long 类型这一说法。
2. JackSon 并不支持 Java8 推出的新的日期和时间 API 的转换。

Spring MVC 中默认使用的消息转换器是 `MappingJackson2HttpMessageConverter`，我们可以对其功能进行拓展，代码如下：

```java
public class JacksonObjectMapper extends ObjectMapper {
    public static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";
    public static final String DEFAULT_DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    public static final String DEFAULT_TIME_FORMAT = "HH:mm:ss";
    public static final String DEFAULT_TIME_ZONE = "GMT+8";
    public JacksonObjectMapper() {
        super();
        //收到未知属性时不报异常
        this.configure(FAIL_ON_UNKNOWN_PROPERTIES, false);
        //反序列化时，属性不存在的兼容处理
        this.getDeserializationConfig()
            .withoutFeatures(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        // 设置 Date 类型的 JSON 格式化
        this.setTimeZone(TimeZone.getTimeZone(DEFAULT_TIME_ZONE));
        this.setDateFormat(new SimpleDateFormat(DEFAULT_DATE_TIME_FORMAT));

        SimpleModule simpleModule = new SimpleModule()
                .addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(DateTimeFormatter.ofPattern(DEFAULT_DATE_TIME_FORMAT)))
                .addDeserializer(LocalDate.class, new LocalDateDeserializer(DateTimeFormatter.ofPattern(DEFAULT_DATE_FORMAT)))
                .addDeserializer(LocalTime.class, new LocalTimeDeserializer(DateTimeFormatter.ofPattern(DEFAULT_TIME_FORMAT)))

                .addSerializer(BigInteger.class, ToStringSerializer.instance)
                .addSerializer(Long.class, ToStringSerializer.instance)

                .addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(DateTimeFormatter.ofPattern(DEFAULT_DATE_TIME_FORMAT)))
                .addSerializer(LocalDate.class, new LocalDateSerializer(DateTimeFormatter.ofPattern(DEFAULT_DATE_FORMAT)))
                .addSerializer(LocalTime.class, new LocalTimeSerializer(DateTimeFormatter.ofPattern(DEFAULT_TIME_FORMAT)));
        //注册功能模块 例如，可以添加自定义序列化器和反序列化器
        this.registerModule(simpleModule);
    }
}
```

接着需要在 Spring MVC 的配置文件中将上面创建的 JacksonObjectMapper 添加到 Spring MVC 的消息转换器中。

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        //创建消息转换器对象
        MappingJackson2HttpMessageConverter messageConverter = new MappingJackson2HttpMessageConverter();
        //设置对象转换器，底层使用Jackson将Java对象转为json
        messageConverter.setObjectMapper(new JacksonObjectMapper());
        //将上面的消息转换器对象追加到mvc框架的转换器集合中
        converters.add(0,messageConverter);
    }
}
```

## 4-处理静态资源

### 4.1 默认的静态资源目录

SpringBoot 对 Web 开发的支持，主要是基于 Spring MVC 模块来实现的，而 Spring MVC 主要是利用`ResourceHttpRequestHandler` 来处理静态内容的，默认情况下，SpringBoot 会按照如下顺序将 `/` 下的所有资源访问映射到以下目录：

1. `classpath:/META-INF/resources/`
2. `classpath:/resources/`
3. `classpath/static/`
4. `classpath/public/`

依据上面的规则可知，若在 `/static/` 和 `/public/` 目录下同时存在名为 img.png 的图片，则会优先加载 `/static` 下面的 img.png。

对于默认的静态资源目录下的资源，我们可以直接通过 url 地址访问，例如 http://localhost:8080/static/img.png，类似于以前 web 项目中的 webapp 目录。

### 4.2 WebJars 映射

为了让页面更加美观，让用户拥有更好的体验，Web 应用通常会使用大量的 JS 和 CSS，例如 jQuery、Bootstrap等等。对于 Java web 的项目来说，可以将这些前端资源放到 webapp 目录下进行管理，而对于 SpringBoot 项目来说并不存在 webapp 目录，如果将这些前端框架都放在默认的静态资源目录下难免造成管理的混乱，且很容易造成版本冲突，SpringBoot 提供了一种像后端依赖管理的方式 WebJars 来管理诸多的前端框架。

顾名思义，我们只需要在 [WebJars 官网](https://www.webjars.org/)找到所需前端框架对应的 pom 依赖，并将其导入项目即可，例如 jQuery的坐标如下：

```xml
<dependency>
    <groupId>org.webjars</groupId>
    <artifactId>jquery</artifactId>
    <version>3.6.3</version>
</dependency>
```

在浏览器中输入 http://localhost:8080/webjars/jquery/3.6.3/jquery.js 即可访问 jQuery。在 HTML页面中也可以直接引用。

### 4.3 自定义静态资源映射

除了将静态资源放到默认的资源目录下，SpringBoot 还支持自定义静态资源的存放路径。那么什么情况下需要自定义静态资源的存放路径呢？

对于文件上传功能来说如果将上传的文件放到那些默认的资源目录下，当项目被打成 jar 时将文件上传到 jar 中的效率是非常低的。这时我们就可以自定义静态资源的存放位置，将静态资源的访问映射到磁盘的某个目录里。

还是需要实现 `WebMvcConfigurer` 接口，并重写其中的 `addResourceHandlers()` 方法。



如上图所示我在电脑的 D 盘的 root 目录下放了一张图片，实现的 `WebMvcConfigurer` 的如下：

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {


    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:D:/root/");
    }
}
```

此时，在浏览器访问 http://localhost:8080/upload/mv.jpg 就可以看到这张图片。

## 4-拦截器、过滤器、监听器

### 4.1 拦截器

拦截器（Interceptor）是一种特殊的组件，它可以在请求处理的过程中对请求和响应进行拦截和处理。拦截器可以在请求到达目标处理器之前、处理器处理请求之后以及视图渲染之前执行特定的操作。拦截器的主要目的是在不修改原有代码的情况下，实现对请求和响应的统一处理。

#### 4.1.1 拦截器的功能

拦截器（Interceptor）可以实现如下功能：

- 权限控制：拦截器可以在请求到达处理器之前进行权限验证，从而实现对不同用户的访问控制。
- 日志记录：拦截器可以在请求处理过程中记录请求和响应的详细信息，便于后期分析和调试。
- 接口幂等性校验：拦截器可以在请求到达处理器之前进行幂等性校验，防止重复提交。
- 数据校验：拦截器可以在请求到达处理器之前对请求数据进行校验，确保数据的合法性。
- 缓存处理：拦截器可以在请求处理之后对响应数据进行缓存，提高系统性能。

#### 4.1.2 SpringBoot 实现拦截器

配置一个拦截器非常简单，只需要实现 `HandlerInterceptor` 这个接口即可，该接口有三个方法可以实现：

1. `preHandle()`：该方法会在控制器方法前执行，当其返回值为 true 时，表示继续向下执行；当其返回值为 false 时，会中断后续的所有操作（包括调用下一个拦截器和控制器类中的方法执行等）；
2. `postHandle()`：该方法会在控制器方法调用之后，且解析视图之前执行。可以通过此方法对请求域中的模型和视图做出进一步的修改；
3. `afterCompletion()`：该方法会在整个请求完成，即视图渲染结束之后执行。可以通过此方法实现一些资源清理、记录日志信息等工作。

想要拦截器生效，需要在Spring MVC的配置接口`WebMvcConfigurer`的实现类中重写`addInterceptors()` 方法进行拦截配置。

#### 4.1.3 Token 令牌校验

举个例子，下项目开发时，很多资源都是需要登录后才可以访问的，如果在每个请求控制器的方法中对 Token 进行校验也是不合理的，这时就可以使用拦截器拦截需要 Token 校验的请求，并在其中校验 Token 的有效性以及合法性。

首先，实现一个 Token 校验的拦截器：

```java
public class TokenVerifyInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, 
                             HttpServletResponse response, 
                             Object handler) throws Exception {

        // 判断请求的路径对应的处理方法是否为 Controller
        // 静态资源请求的 handler 类型是 RequestResourceHandler
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }
        // 获取请求头中的 token
        String token = request.getHeader("token");
        // token 不存在,向前端给出提示
        if (!StringUtils.hasText(token)) {
            Map<String,Object> result = new HashMap<>();
            result.put("code",401);
            result.put("message","未登录");
            response.setContentType("application/json;charset=utf-8");
            response.getWriter().println(new JsonMapper().writeValueAsString(result));
            return false;
        }
        // 判断 token 是否合法
        if (!TokenUtil.checkToken(token)) {
            Map<String,Object> result = new HashMap<>();
            result.put("code",401);
            result.put("message","登录过期");
            response.setContentType("application/json;charset=utf-8");
            response.getWriter().println(new JsonMapper().writeValueAsString(result));
            return false;
        }
        return true;
    }
}
```

接着需要将实现的 Token 拦截器添加到 SpringBoot 中

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    private static final List<String> whiteList = Arrays.asList("/login","verifyCode");
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new TokenVerifyInterceptor())
                .addPathPatterns("/**") // 设置拦截路径
                .excludePathPatterns(whiteList);  // 排除不需要拦截的路径
    }
}
```

### 4.2 过滤器

#### 4.1.1 什么是过滤器？

Filter 也称之为过滤器，它是 Servlet 技术中最实用的技术，WEB 开发人员通过 Filter 技术，对 web 服务器管理的所有web资源：例如 JSP，Servlet，静态图片文件或静态 HTML 文件进行拦截，从而实现一些特殊功能。例如实现 URL 级别的权限控制 、 过滤敏感词汇 、 压缩响应信息 等一些高级功能。

配置一个过滤器很简单，只需要实现 `javax.servlet.Filter` 接口即可，该接口有三个方法可以实现：`init()`、`doFilter()`、`destroy()` 分别对应着 Filter 的生命周期。其中 `init()` 和 `destroy()` 都有默认实现，我们只需要实现处理过滤器逻辑的 `doFilter()` 方法即可。

#### 4.1.2 SpringBoot 实现过滤器

在 SpringBoot 中要想使过滤器生效，通常有如下两种方法：

1. 使用 `FilterRegistrationBean` （推荐使用）

SpringBoot 提供了 `FilterRegistrationBean` 用于注册 Filter，下面是注册 Filter 的例子：

```java
@Configuration
public class FilterConfig {
    
    @Autowired
    private Filter1 filter1;
    
    @Autowired
    private Filter2 filter2;
    
    @Bean
    public FilterRegistrationBean filter1() {
    	FilterRegistrationBean registration = new FilterRegistrationBean();
    	registration.setFilter(filter1);
    	registration.addUrlPatterns("/*");
    	registration.setName("filter1");
    	//设置优先级别
    	registration.setOrder(1);
    	return registration;
    }
    
    @Bean
    public FilterRegistrationBean filter2() {
    	FilterRegistrationBean registration = new FilterRegistrationBean();
    	registration.setFilter(filter2);
    	registration.addUrlPatterns("/*");
    	registration.setName("filter2");
    	//设置优先级别
    	registration.setOrder(2);
    	return registration;
    }
}
```

::: tip

设置的优先级决定了 Filter 的执行顺序

:::

2. 使用 `@WebFilter` + `@ServletComponentScan` 注解

`@WebFilter` 是 Servlet3.0 的一个注解，用于标注一个 Filter，SpringBoot 也是支持这种方式，只需要在自定义的 Filter 上标注该注解即可，如下：

```java
@WebFilter(filterName = "tokenFilter",urlPatterns = {"/*"})
public class TokenFilter implements Filter {...}
```

要想 `@WebFilter` 注解生效，需要在 SpringBoot 项目的引导类上标注另外一个注解 `@ServletComponentScan`

```java
@ServletComponentScan("com.boot.filter")
@SpringBootApplication
public class HelloWorldApplication {...}
```

::: tip

@ServletComponentScan 注解不仅可以扫描 Filter 组件，还可以扫描其他的 Servlet 组件，如扫描标注了 @WebLintener 注解的监听器。

:::



### 4.3 监听器

#### 4.3.1 什么是监听器？

监听器也叫 Listener，也是一种 Servlet 技术，可以用于监听 Web 应用中 ServletContext、HttpSession 和ServletRequest 等域对象的创建和销毁事件。常用于统计在线人数和在线用户、系统加载时进行信息初始化、统计网站的访问量等。

Servlet 提供的监听器分为如下三种类型：

1. 监听域对象生命周期
    - ServletContextListener：监听 ServletContext 实例的创建与销毁
    - HttpSessionListener：监听 HttpSession 实例的创建与销毁
    - ServletRequestListener：监听 ServletRequest 实例的创建与销毁
2. 监听域对象中属性变化
    - ServletContextAttributeListener：监听 ServletContext 实例中属性的创建、删除、修改操作
    - HttpSessionAttributeListener：监听 HttpSession 实例中属性的创建、删除、修改操作
    - ServletRequestAttributeListener：监听 ServletRequest 实例中属性的创建、删除、修改操作

3. 监听Session内的对象
    - HttpSessionBindingListener：和 HttpSessionAttributeListener 类似
    - HttpSessionActivationListener：监听 HttpSession 中属性的活化和钝化

::: tip 活化和钝化

钝化：当服务关闭时，会将 session 中的内容保存在硬盘上<br/>

活化：当服务开启时，会将 session 中的内容重新加载到内存

:::

#### 4.3.2 实现 Servlet 的 Listener

和 Filter 一样 SpringBoot 也提供了一个名为 `ServletListenerRegistrationBean` 的 Bean 用于注册 Lisenter。此外，也可以使用 `@WebListener` 注解配合 `@ServletComponentScan` 注解来实现。

下面写一个统计在线人数的案例来演示 Listener 的使用

::: tip 思路分析

1. 在浏览器发来请求的时候，利用 ServletRequestListener 进行监听，获取 sessionId
2. 判断 sessionId 是否存在，不存在就可构造 User 并放入到 List 中，在页面获取
3. 在 session 销毁的时候，将对应的 sessionId 的 User 从 List 中移除

:::

1. **创建统计在线用户人数的监听器**

```java
public class OnlineListener implements HttpSessionListener, ServletRequestListener {

    // 在线用户人数
    private int onlineNumber = 0;


    @Override
    public void sessionCreated(HttpSessionEvent se) {
        onlineNumber ++;
        se.getSession().getServletContext().setAttribute("onlineNumber", onlineNumber);
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        // 维护在线人数
        onlineNumber--;
        se.getSession().getServletContext().setAttribute("onlineNumber", onlineNumber);
        // 维护在线用户列表
        List<OnlineUser> userList = (List<OnlineUser>) se
                        .getSession()
                        .getServletContext()
                        .getAttribute("userList");
        // 根据 sessionId 获取在线用户
        OnlineUser user = SessionUtil.getUserBySessionId(userList, se.getSession().getId());
        if (user != null) {
            userList.remove(user);
        }
        se.getSession().getServletContext().setAttribute("userList",userList);
    }
}
```



2. **创建统计在线用户列表的 Listener**

```java
public class OnlineRequestListener implements ServletRequestListener {

    @Override
    public void requestInitialized(ServletRequestEvent sre) {
        List<OnlineUser> userList =
                (ArrayList<OnlineUser>) sre.getServletContext().getAttribute("userList");
        if(userList == null){
            userList = new ArrayList<>();
        }

        // 获取 sessionId
        ServletRequest servletRequest = sre.getServletRequest();
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        String sessionId = request.getSession().getId();

        // 根据 sessionId 获取 OnlineUser
        OnlineUser user = SessionUtil.getUserBySessionId(userList, sessionId);

        // 该用户不存在，即该用户不是在线状态，向在线用户列表中添加用户信息
        if (user == null) {
            user = new OnlineUser();
            user.setSessionId(sessionId);
            user.setIP(request.getRemoteAddr());
            userList.add(user);
        }
        // 重新设置在线用户列表
        sre.getServletContext().setAttribute("userList", userList);

    }
}
```

3. **注册创建的监听器**

上面创建的监听器并没有添加 `@WebListener` 注解，这里使用 `ServletListenerRegistrationBean` 进行注册，代码如下：

```java
@Configuration
public class ListenerConfig {

    @Bean
    public ServletListenerRegistrationBean<OnlineSessionListener> onlineSessionListener() {
        ServletListenerRegistrationBean<OnlineSessionListener> registrationBean =
                new ServletListenerRegistrationBean<>();
        registrationBean.setListener(new OnlineSessionListener());
        return registrationBean;
    }

    @Bean
    public ServletListenerRegistrationBean<OnlineRequestListener> onlineRequestListener() {
        ServletListenerRegistrationBean<OnlineRequestListener> registrationBean =
                new ServletListenerRegistrationBean<>();
        registrationBean.setListener(new OnlineRequestListener());
        return registrationBean;
    }
}
```

4. **在页面中获取在线用户信息**

如果使用的是 thymeleaf 模板引擎，可以使用如下方式获取：

```html
<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
    在线人数:
    <span th:text="${application.onlineNumber}"></span><br/>
    在线用户:
    <span th:each="user:${application.userList}">
        sessionId: <span th:text="${user.sessionId}"></span>,
        IP: <span th:text="${user.IP}"></span>
    </span>
</body>
</html>
```

### 4.4 SpringBoot 的 Lisenter

SpringBoot 不仅实现了 Servlet 的监听器，还实现了自己的一套监听机制，SpringBoot 是如何实现监听的呢？

Spring 监听器包含以下模块：

1. 发布器（ApplicationEventPublisher）：用来在业务逻辑中发布事件。
2. 广播器（ApplicationEventMulticaster）：用来把发布的事件广播给支持当前事件的监听器。
3. 监听器（ApplicationListener）：用来监听自己感兴趣的事件，当程序发布事件时，可以执行一些相应的业务逻辑。ApplicationListener 监听器监听到事件发布后执行 onApplicationEvent方法。
4. 事件（ApplicationEvent）：用来定义事件。

::: tip

SpringBoot 项目启动时会扫描项目中的监听器并加载到广播器中。SpringBoot 识别项目中的监听器规则是：@EventListener 注解标注的方法，ApplicationListener 接口的实现类。

:::

#### 4.4.1 Listener 执行流程

下面的图描述了从 ApplicationEventPublisher 事件发布器发布事件到事件监听器加载的过程。

![image-20230715102951627](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springboot/image-20230715102951627.6me1gui3d900.png)

#### 4.4.2 实现 Listener

SpringBoot 实现 Lintener 有基于 ApplicationListener 接口和基于 @EventListener 注解两种方法。无论哪种实现方式都只需要三步即可，步骤如下：

1. 定义事件
2. 定义监听器
3. 发布事件

下面演示基于 ApplicationListener 接口实现的监听器：

**第一步**：定义用户注册事件

```java
public class UserRegisterEvent extends ApplicationEvent {

    private User user;

    public UserRegisterEvent(Object source, User user) {
        super(source);
        this.user = user;
    }

    public User getUser() {
        return user;
    }
}
```

**第二步**：定义事件监听器

```java
public class UserRegisterListener implements ApplicationListener<UserRegisterEvent> {
    @Override
    public void onApplicationEvent(UserRegisterEvent event) {
        User user = event.getUser();
        // 处理用户注册事件，可以向用户发送邮件
    }
}
```

**第三步**：通过 `ApplicationEventPublisher`  发布事件

```java
@Service
public class UserService {

    @Autowired
    private ApplicationEventPublisher publisher;

    public void registerUser(User user) {
        // 处理注册逻辑
        // ......
        // 发布用户注册事件
        publisher.publishEvent(new UserRegisterEvent(this,user));
    }
}
```