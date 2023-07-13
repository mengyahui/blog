# 002-HelloWorld解析

对于创建 SpringBoot 项目，Spring 官方提供了 Spring Initializr，地址为：https://start.spring.io/ ，我们可以将从 Spring Initializr 创建的 SpringBoot 项目下载下来，导入到 IDEA 中。此外，IDEA 中也集成了 Spring Initializr，通常创建项目都是使用 IDEA 中的 Spring Initializr。

除了使用 Spring Initializr 来创建 SpringBoot 项目，还可以创建一个 Maven 项目，然后手动导入 SpringBoot 项目所需的依赖。下面就以这种方式创建一个 HelloWorld 项目。

## 1-HelloWorld 创建

首先，使用 IDEA 创建一个不使用模板的 Maven 项目

![image-20230712124721077](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springboot/image-20230712124721077.23yyaugy74io.png)

然后，在创建的 HelloWorld 项目的 pom 文件中添加 SpringBoot 项目的默认父坐标和 Web 开发所需的 Starter

```xml
<!--SpringBoot项目父坐标-->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.13</version>
</parent>
<!--Web 开发 Starter-->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

接着，需要为 HelloWorld 项目创建一个引导类，且该**引导类需要和项目的最里层的包同级**

```java
package com.boot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HelloWorldApplication {

    public static void main(String[] args) {
        SpringApplication.run(HelloWorldApplication.class,args);
    }
}
```

下面编写一个 Controller 测试一下吧

```java
package com.boot.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello World";
    }
}
```

项目启动后，浏览器访问 http://localhost:8080/hello 即可看到效果，这里就不贴图了。

## 2-项目的入口：引导类

### 2.1 @SpringBootApplication

引导类作为 SpringBoot 工程的入口，需要被 `@SpringBootApplication` 注解标注，执行该注解所标注的类的 main 方法，就可以启动 Spring 容器。该注解是一个组合注解，主要由 `@SpringBootConfiguration` 和 `@EnableAutoConfiguration` 注解组成。

```java
......
@SpringBootConfiguration
@EnableAutoConfiguration
......
public @interface SpringBootApplication {}
```

### 2.2 @EnableAutoConfiguration

这里重点看一下 `@EnableAutoConfiguration` 注解，该注解表示开启自动配置功能，这个注解也是一个复合注解，主要由`@AutoConfigurationPackage` 和 `@Import({AutoConfigurationImportSelector.class})` 注解组成。

```java
......
@AutoConfigurationPackage
@Import({AutoConfigurationImportSelector.class})
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";

    Class<?>[] exclude() default {};

    String[] excludeName() default {};
}
```

### 2.3 @AutoConfigurationPackage

该注解的作用就是将启动类及其所在的 package 作为自动配置的 package 进行管理，也就是说当 SpringBoot应用启动时默认会将引导类所在的 package 作为自动配置的 package

该注解底层使用 `@Import({AutoConfigurationPackages.Registrar.class})` 注解向 Spring 容器中导入了 `Registrar` 类，其中的 `registerBeanDefinitions()` 方法，就是导入组件实例的具体实现，该方法内

```java
public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
            AutoConfigurationPackages.register(registry, (String[])(new PackageImports(metadata)).getPackageNames().toArray(new String[0]));
        }
```

其中，`new PackageImports(metadata)).getPackageNames().toArray(new String[0])` 返回的就是 引导类所在的包路径，`AutoConfigurationPackages.register` 方法会将该包下的所有配置信息，都加载到 Spring容器中。这也是引导类为何需要与项目最内层包同级的原因。

### 2.4 AutoConfigurationImportSelector

自动配置注解 `@EnableAutoConfiguration` ，除了有指定自动配置 package 外，还应该具有自动配置的功能，SpringBoot 自动配置的奥秘就藏在 `AutoConfigurationImportSelector` 类中。

当 SpringBoot 项目启动时，最终会执行 `AutoConfigurationImportSelector` 中的 `selectImports()` 方法，该方法的作用有两个：

1. 加载 `spring-boot-autoconfigure` 下 `META-INF/spring.factories` 中定义的 SpringBoot 启动所需的必须配置类。

2. 加载`spring-boot-autoconfigure` 下`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 中SpringBoot 为 J2EE 各个场景提供的默认配置类。

::: tip

在低版本的 SpringBoot 的 spring-boot-autoconfigure 的 META-INF 下，只有 spring.factories 文件，所有的自动配置类都在这个文件中。

:::

## 3-版本管理：spring-boot-starter-parent

在创建 SpringBoot 工程时需要在 pom.xml 中引入SpringBoot 的父项目。

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.13</version>
</parent>
```

而 spring-boot-starter-parent 又继承了 spring-boot-dependencies，spring-boot-dependencies 管理着该 SpringBoot 项目的所有依赖版本。也就是说，我们在引入第三方框架坐标时，并不需要指定版本信息，SpringBoot 已经给出了一套最优的组合。

## 4-辅助功能：内嵌 Tomcat

前面的 HelloWorld 并没有配置 Tomcat 居然启动了？

这是因为 SpringBoot 的 Web 依赖 spring-boot-starter-web 已经内置了一个 Tomcat，其依赖的坐标 ，如下：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-tomcat</artifactId>
    <version>2.7.13</version>
    <scope>compile</scope>
</dependency>
```

点击去，可以看到 Tomcat 的内核坐标

```xml
<dependency>
    <groupId>org.apache.tomcat.embed</groupId>
    <artifactId>tomcat-embed-core</artifactId>
    <version>9.0.76</version>
    <scope>compile</scope>
    <exclusions>
        <exclusion>
            <artifactId>tomcat-annotations-api</artifactId>
            <groupId>org.apache.tomcat</groupId>
        </exclusion>
    </exclusions>
</dependency>
```

在之前都是服务器启动起来，将写好的程序扔到服务器里；现在怎么是把服务器扔到程序里？

可以这样理解：

Tomcat 是一个 Java 程序，里面包含很多的 jar 包，其运行也是符合 Java 程序运行原理的，而 Java 程序是靠对象运行的，如果将 Tomcat 的执行过程抽取为一个对象，在交由 Spring 容器管理，就可以实现 "将服务器扔到程序里"

既然 SpringBoot 应用可以内嵌 Tomcat 服务器，那是不是还可以使用其它服务器呢？答案是肯定的。SpringBoot 内置了如下三种服务器：

1. tomcat（默认）：应用面广，负载了若干较重的组件。
2. jetty：更轻量级，但负载性能远不及 Tomcat。
3. undertow：负载性能比 Tomcat 略胜一筹。

而更换默认的 Tomcat 服务器也很简单，只需要在 spring-boot-starter-web 中排除 Tomcat 的 Starter 坐标，在引入其他服务器的 Starter 坐标即可。

下面是将 Tomcat 服务器更换为 Jetty 服务器的例子：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <exclusions>
            <!--排除Tomcat Starter-->
            <exclusion>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-tomcat</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
	
    <!--引入Jetty Starter-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-jetty</artifactId>
    </dependency>
</dependencies>
```

