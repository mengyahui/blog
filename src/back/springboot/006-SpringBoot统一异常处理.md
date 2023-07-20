## 1-关于异常的理解

首先应该明确一点，一切异常对于系统来说，都是不正常的表现。尽管有时由于业务处理的需要我们会主动抛出一些异常，但也不意味对这些异常可以不管不顾，需要有一个地方对抛出的异常进行处理。

在日常开发中，一个完善的异常处理机制，在提升系统稳定性和用户体验等方面是至关重要的。但我们不能认为完善异常处理机制是系统的核心，而是要反思系统架构设计是否合理、系统逻辑设计是否合理等。而不是指望完善异常处理来给系统缺陷擦屁股。

对异常按阶段进行分类，大体可以分成：进入`Controller`前的异常和 `Service` 层异常

![image-20230717084519181](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springboot/image-20230717084519181.d0iaujsr6ew.png)

## 2-SpringBoot默认异常处理机制

SpringBoot 提供了默认的异常处理机制：默认提供了程序出错的结果映射路径 `/error`。这个 `/error` 请求会在 `BasicErrorController` 中处理，其内部是通过判断请求头中的 Accept 的内容是否为`text/html` 来区分请求是来自客户端浏览器（浏览器通常默认自动发送请求头内容Accept:text/html）还是客户端接口的调用，以此来决定返回页面视图还是 JSON 消息内容。

对于 404 来说，默认返回的 Json 消息内容如下：

```json
{
    "timestamp": "2023-05-12T06:11:45.209+0000",
    "status": 404,
    "error": "Not Found",
    "message": "No message available",
    "path": "/index.html"
}
```

很明显，这样的异常 Json 数据对前端来说是很不友好的，如果是浏览器请求的调用更是会返回一个默认的 `Whitelabel Error Page` 页面。

## 3-统一异常处理

Spring 在 3.2 版本增加了一个注解 `@ControllerAdvice`，可以与 `@ExceptionHandler`、`@InitBinder`、`@ModelAttribute` 等注解注解配套使用。不过跟异常处理相关的只有注解 `@ExceptionHandler`，从字面上看，就是异常处理器的意思。

### 3.1 @ExceptionHandler

`@ExceptionHandler` 注解标注在 Controller 的方法上，用于拦截该 Controller 中被 @RequestMapping 注解标注的 handler 抛出的异常，并进行处理，如：

```java
@ExceptionHandler({RuntimeException.class, MethodArgumentNotValidException.class})
public Map<String,Object> exceptionHandler(Exception e) {
   Map<String,Object> result = new HashMap<>();
   if (e instanceof RuntimeException) {
       result.put("code",501);
       result.put("message","运行时异常");
   } else if (e instanceof MethodArgumentNotValidException) {
       result.put("code",502);
       result.put("message","参数校验异常");
   } else {
       result.put("code",500);
       result.put("message","未知异常");
   }
    return result;
}
```

如果在 UserController 中存在上面的异常处理方法，则 UserController 中的所有 handler 抛出的 `RuntimeException `和 `MethodArgumentNotValidException` 异常都会被该异常处理方法处理。

::: tip

1. `@ExceptionHandler` 注解的 value 属性，用于指定需要处理异常的 class，且只有在当前控制器中抛出的异常才会被处理。
2. 被 `@ExceptionHandler` 注解标注的异常处理方法，返回值类型和当前控制器中标识了`@RequestMapping`  等注解的方法是统一的。

:::

### 3.2 @ControllerAdvice

`@ExceptionHandler` 注解虽然可以处理异常，但只能处理其所在控制器抛出的异常。对于其他控制器的异常 `@ExceptionHandler` 也是无能为力。

有没有一种方法可以对所有控制器抛出的异常，进行捕获并处理呢？

`@ControllerAdvice` 注解就能实现这一功能，该注解就是用于给 Controller 控制器添加统一的操作或处理，配合 `@ExceptionHandler` 注解就可以实现全局的异常处理。

## 4-全局异常处理器

### 4.1 统一响应格式

越来越多的项目采用前后端分离的开发模式，这对后端接口的响应格式便有了一定的要求。通常，我们会采用JSON 格式作为前后端交换数据格式，从而减少沟通成本等。

一般响应格式通常会包含状态码、状态描述（或错误提示信息）、业务数据等信息。在此基础上，不同的架构师、项目搭建者可能会有所调整。但从整体上来说，基本上都是大同小异，但至少包含如下三个属性：

```json
{
  "code":200,
  "message":"操作成功",
  "data":{}
}
```

其中 code 和 message 通常使用枚举来定义：

```java
@Getter
public enum ResponseEnum {
    // 成功
    SUCCESS(200, "操作成功"),
    // 失败
    FAILED(201,"操作失败"),
    // 登录注册相关 6001-7000
    NEED_LOGIN(6001, "需要登录后操作"),
    USERNAME_EXIST(6002, "用户名已存在"),
    PHONE_NUMBER_EXIST(6003, "手机号已存在"),
    USERNAME_NOT_NULL(6004, "用户名不能为空"),
    NICKNAME_NOT_NULL(6005, "昵称不能为空"),
    PASSWORD_NOT_NULL(6006, "密码不能为空"),
    EMAIL_EXIST(6007, "邮箱已存在"),
    EMAIL_NOT_NULL(6008, "邮箱不能为空"),
    NICKNAME_EXIST(6009, "昵称已存在"),
    LOGIN_ERROR(6010, "用户名或密码错误"),

    // 系统相关 7001-8000
    NO_OPERATOR_AUTH(7001, "无权限操作"),
    SYSTEM_ERROR(7002, "出现错误啦！"),
    FILE_TYPE_ERROR(507, "文件类型错误");

    final int code;
    final String message;

    ResponseEnum(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
```

这里仅仅给出了部分的状态码，更多的状态码可根据实际业务需求定义。

为了方便响应数据的返回，这里定义一个统一返回的实体类：

```java
@Data
@AllArgsConstructor
@Accessors(chain = true)
public class R<T> implements Serializable {

    private Integer code;
    private String message;
    private T data;

    public static <T> R<T> build(Integer code, String message) {
        return new R<>(code,message,null);
    }

    public static <T> R<T> build(ResponseEnum responseEnum) {
        return build(responseEnum.getCode(),responseEnum.getMessage());
    }

    public static <T> R<T> success() {
        return build(ResponseEnum.SUCCESS);
    }
    
    public static <T> R<T> fail() {
        return build(ResponseEnum.FAILED);
    }
}
```

### 4.2 全局异常处理器

当然异常是很多的，在实际开发中，一般都会比较详细的去拦截一些常见的异常，拦截 `Exception` 虽然可以一劳永逸，但是不利于我们去排查或者定位问题。实际项目中，可以把拦截 `Exception`异常写在**全局异常处理器**最下面，如果都没有找到，最后再拦截一下 `Exception`异常，保证输出信息友好。

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 请求体参数校验异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<?> methodArgumentNotValidExceptionHandler(MethodArgumentNotValidException e) {
        ObjectError objectError = e.getBindingResult().getAllErrors().get(0);
        log.error("参数校验异常:{}",objectError.getDefaultMessage());
        return R.fail(objectError.getDefaultMessage());
    }

    // 数据绑定异常
    @ExceptionHandler(BindException.class)
    public R<?> bindException(BindException e) {
        ObjectError objectError = e.getBindingResult().getAllErrors().get(0);
        log.error("数据绑定异常:{}",objectError.getDefaultMessage());
        return R.fail(objectError.getDefaultMessage());
    }

    // 参数校验异常
    @ExceptionHandler(ConstraintViolationException.class)
    public R<?> constraintViolationExceptionHandler(ConstraintViolationException e) {
        String message = e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toList()).get(0);
        log.error("参数校验异常:{}",message);
        return R.fail(message);
    }
    
    // 未知异常
    @ExceptionHandler(Exception.class)
    public R<?> exceptionAllHandler(Exception e) {
        log.error("未知异常:{}",e.getMessage());
        return R.fail(e.getMessage());
    }
}
```

### 4.3 自定义异常

在实际开发中，一些异常是无法预知的，像请求超时、文件上传格式不对等等。可以自定义一个业务异常，当出现业务异常时，抛出这个自定义异常即可。

```java
@Getter
@Setter
public class BaseException extends RuntimeException{

    private Integer code;
    private String message;

    public BaseException(ResponseEnum responseEnum) {
        this.code = responseEnum.getCode();
        this.message = responseEnum.getMessage();
    }

    public BaseException(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
```

上面自定义了一个基本异常，在使用时只需要抛出该异常并传入具体业务对应的构造参数即可。例如，在用户注册时，若用户传入的用户名已被注册，则抛出自定义异常：

```java
public R<?> registerUser(User user) {
    List<User> userList = userMapper.selectByName(user.getUsername());
    if (userList.size() > 0) {
        throw new BaseException(ResponseEnum.USERNAME_EXIST);
    }
    ......
}
```

最后，不要忘了将自定义异常加入全局异常处理器中。

## 5-使用Assert替换throw Exception

Spring 中的 `org.springframework.util.Assert` ，是一个用于验证参数或状态的工具类，它提供了一系列的静态方法，可以在不满足条件时抛出异常。

下面是 `Assert.notNull()` 的源码：

```java
public static void notNull(@Nullable Object object, String message) {
    if (object == null) {
        throw new IllegalArgumentException(message);
    }
}
```

可以看到 `Assert.notNull()` 其实就是帮我们把 `if...{}` 语句封装了一下，在不满足条件时抛出异常`IllegalArgumentException` 。虽然很简单，但不可否认的是很大程度上提升了我们的编码体验。

业务逻辑出现的异常基本都是对应特定的场景，比如根据用户名获取用户信息，查询结果为 null，此时抛出的异常可能为 `UserNotFoundException` ，并且有特定的异常码（如：7001）和异常信息（如：该用户不存在）。

我们能不能仿照 `Assert` ，也写一个断言类，当不满足条件时抛出我们自定义的异常？当然可以！！！

```java
public class Assert {

    public static void assertNotNull(Object obj,String message) {
        if (obj == null) {
            throw new BaseException(ResponseEnum.FAILED.getCode(),message);
        }
    }

    public static void assertNotNull(Object obj,ResponseEnum responseEnum) {
        if (obj == null) {
            throw new BaseException(responseEnum);
        }
    }

}
```

上面的断言类只提供了判断对象不为 null 的静态方法，可根据实际需求进行拓展。