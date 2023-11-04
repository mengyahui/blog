## 1-为什么要进行参数校验？

通常来说，前端在发送请求时也会进行参数校验。但是为了避免用户绕过客户端，使用 HTTP 工具直接向后端请求一些违法数据，服务端的数据校验也是不能忽视的。

在日常的 Java 后端开发过程中，经常需要对接口的参数进行校验。例如，对于登录接口需要校验用户名和密码是否为空，添加用户时需要验证邮箱、手机号格式是否正确，若仅仅使用 `if...else` 对接口参数进行校验，不仅十分繁琐，而且代码可读性极差。

下面就来讲讲如何在 SpringBoot 项目中优雅的实现参数校验。

## 2-Spring Validation

说到 `Spring Validation` 就不得不提 `Hibernate Validation`，二者均为 ` Bean Validation` 的具体实现。

`JSR-303` 是 JavaEE 6 中的一项子规范，又称作 `Bean Validation`，提供了针对 Java Bean 字段的一些校验注解，如 `@NotNull`，`@Min`等。`JSR-349` 是其升级版本，添加了一些新特性。`Hibernate Validator` 是对这个规范的实现（与 ORM 框架无关），并在它的基础上增加了一些新的校验注解，如 `@Email`，`@Length`，`@Range` 等等。

`Spring Validation` 又对 `Hibernate Validation` 进行了二次封装，并添加了自动校验功能，并将校验信息封装进了特定的类中。

在 SpringBoot 2.3 以前，`Spring Validation` 是包含在 `spring-boot-starter-web` 里的。之后，校验包被独立成了一个 `Starter` 组件，需要引入如下依赖：

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

## 3-常用校验注解

下面是常用校验注解：

- Bean Validation 中内置的 constraint（约束）    
  - @Null  被注释的元素必须为 null
  - @NotNull  被注释的元素必须不为 null
  - @AssertTrue   被注释的元素必须为 true
  - @AssertFalse  被注释的元素必须为 false
  - @Min(value)   被注释的元素必须是一个数字，其值必须大于等于指定的最小值 
  - @Max(value)   被注释的元素必须是一个数字，其值必须小于等于指定的最大值 
  - @DecimalMin(value) 被注释的元素必须是一个数字，其值必须大于等于指定的最小值 
  - @DecimalMax(value) 被注释的元素必须是一个数字，其值必须小于等于指定的最大值 
  - @Size(max=, min=)  被注释的元素的大小必须在指定的范围内 
  - @Digits (integer, fraction)   被注释的元素必须是一个数字，其值必须在可接受的范围内 
  - @Past  被注释的元素必须是一个过去的日期 
  - @Future   被注释的元素必须是一个将来的日期 
  - @Pattern(regex=,flag=) 被注释的元素必须符合指定的正则表达式 
- Hibernate Validator 附加的 constraint 
  - @NotBlank(message =)  字符串不能为null,字符串trim()后也不能等于“”
  - @Email 被注释的元素必须是电子邮箱地址 
  - @Length(min=,max=) 被注释的字符串的大小必须在指定的范围内 
  - @NotEmpty  不能为null，集合、数组、map等size()不能为0；字符串trim()后可以等于“”
  - @Range(min=,max=,message=) 被注释的元素必须在合适的范围内
  - @URL 被注释的元素必须是一个URL

##  4-异常说明

校验注解标注的位置不同，在校验失败时抛出的异常也不同，下面在一个控制器方法中列举出来了校验注解使用的各种情况：

```java
@RestController
@RequestMapping("user")
@Validated
public class UserController {

    @GetMapping("login")
    public void login(
            @NotBlank(message = "用户名不能为空") String username,
            @NotBlank(message = "密码不能为空") String password) {
    }

    @PostMapping("register")
    public void registerUser(@Validated User user) {

    }

    @PostMapping("update")
    public void updateUser(@Validated @RequestBody User user) {

    }
}
```

1. 对于简单类型的参数，可以直接标注校验注解，并在控制器上标注 `@Validated` 或 `@Valid` 注解。校验失败，会抛出 `javax.validation.ConstraintViolationException` 异常。

2. 对于对象类型的参数，直接在对象参数上标注 `@Validated` 或 `@Valid` 即可。校验失败，会抛出 `org.springframework.validation.BindException` 异常。

3. 对于使用 `@Validated` 或 `@Valid` 注解标注的请求体（使用 `@RequestBody` 注解标注）对象参数的校验，如果校验失败，则会抛出 `org.springframework.web.bind.MethodArgumentNotValidException` 异常。

## 5-异常处理

`Spring Validation` 校验失败会抛出异常，有异常就要处理，通常将异常加入全局异常处理器进行处理。

下面直接贴出全局异常处理类：

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<?> methodArgumentNotValidExceptionHandler(MethodArgumentNotValidException e) {
        ObjectError objectError = e.getBindingResult().getAllErrors().get(0);
        return R.fail(objectError.getDefaultMessage());
    }

    @ExceptionHandler(BindException.class)
    public R<?> bindException(BindException e) {
        ObjectError objectError = e.getBindingResult().getAllErrors().get(0);
        return R.fail(objectError.getDefaultMessage());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public R<?> constraintViolationExceptionHandler(ConstraintViolationException e) {
        String message = e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toList()).get(0);
        return R.fail(message);
    }

}
```

## 6-@Validated&@Valid

`@Valid` 与 `@Validated` 都是用于校验参数的，其中 `@Valid` 是 `Hibernate Validation` 提供的，而 `@Validated` 注解是 `Spring Validation` 提供的，二者在使用上略有不同。

### 6.1 分组校验

`@Validated`提供了一个分组功能，可以在入参验证时，根据不同的分组采用不同的验证机制。

对于插入操作来说，通常不需要携带 id，而对于修改操作来说是需要携带 id 的，就可以根据这两种情况进行分组，相关示例如下：

首先，定义两个分组 Insert 和 Update：

```java
public interface Insert extends Default {
}

public interface Update extends Default {
}
```

接着就是在实体类需要校验的属性上添加分组了：

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @NotNull(message = "更新用户id不能为空",groups = {Update.class})
    @Null(message = "添加用户不携带id",groups = {Insert.class})
    private Long id;
}
```

在 Controller 中，只需要指定 @Validated 的 value 属性为相应的组名即可：

```java
@Slf4j
@RestController
@RequestMapping("/user")
@Validated
public class UserController {

    @PostMapping("/add")
    @ResponseBody
    public String addUser(@Validated({Insert.class}) @RequestBody User user) {
        log.error("user is {}",user);
        return "user valid success";
    }

    @PostMapping("update")
    public String updateUser(@Validated({Update.class}) @RequestBody User user) {
        log.error("user is {}",user);
        return "user valid success";
    }
}

```

### 6.2 嵌套校验

`@Validated`可以用在类、方法和方法参数上。但是不能用在成员属性（字段）上

`@Valid`可以用在方法、构造函数、方法参数和成员属性（字段）上

两者是否能用于成员属性（字段）上直接影响能否提供嵌套验证的功能。仅仅 `@Valid` 支持嵌套校验。

那么什么是嵌套校验呢？

一个待验证的 POJO 中还包含了其它待验证的对象，最常见的就是各种 List 集合了。

在下面的 User 类中，仅仅对 roleList 做了非空校验，并没有校验其中的数据：

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @NotNull(message = "更新用户id不能为空",groups = {Update.class})
    @Null(message = "添加用户不携带id",groups = {Insert.class})
    private Long id;
    
    @NotEmpty(message = "角色不能为空")
    private List<Role> roleList;
}
```

如果在成员变量 roleList 上加上 `@Valid` 注解，则也会对 roleList 中的数据 Role 对象进行校验，当然 Role 类的字段上需要有校验注解。

假如 Role 类如下所示，且在 roleList 上标注了 `@Vaild` 注解：

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Role {

    private Long id;
    @NotNull(message = "角色名称不能为空")
    private String roleName;
}
```

此时，在 roleList 上添加 `@Valid` 注解即可实现嵌套验证。
