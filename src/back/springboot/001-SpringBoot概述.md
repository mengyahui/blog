
# 001-SpringBoot概述

## 1-什么是 SpringBoot？

在介绍 SpringBoot 之前，先来简单介绍下 Spring。

Spring 是诞生于 2002 年的轻量级开源框架，它的出现使得开发者无须开发重量级的 Enterprise JavaBean(EJB)，而是通过**控制反转(IOC)** 和**面向切面编程(AOP)** 的思想进行更轻松的企业应用开发，取代了EJB 臃肿、低效的开发模式。可以说已经成为 Java 开发的标准。

虽然 Spring 框架是轻量级的，但它的配置却是重量级的。Spring 的早期版本专注于 XML 配置，发一个程序需要配置各种 XML 配置文件。为了简化开发，在 Spring 2.x 版本开始引入少量的注解，如 `@Component`、`@Service` 等。由于支持的注解不是很多且功能尚不完善，所以只能辅助使用。

到了 Spring4.x 版本基本可以脱离 XML 配置文件进行项目开发，多数开发者也逐渐感受到了基于注解开发的便利。与此同时，Pivotal 团队在原有 Spring 框架的基础上通过注解的方式进一步简化了 Spring 框架的使用，并基于Spring 框架开发了全新的 SpringBoot 框架，于 2014 年 4 月正式推出了 Spring Boot 1.0 版本，同时在 2018 年 3 月又推出了 Spring Boot 2.0 版本。Spring Boot 2.x 版本在 Spring Boot 1.x 版本的基础上进行了诸多功能的改进和扩展，同时进行了大量的代码重构，在学习时也是推荐优化后的 SpringBoot2.x。

SpringBoot 框架本身并不提供 Spring 框架的核心特性以及扩展功能，只是用于快速、敏捷地开发新一代基于 Spring 框架的应用。

SpringBoot 在设计时遵从**约定优先配置**的思想来摆脱 Spring 框架中各种复杂的手动配置，同时衍生出了JavaConfig 配置，取代传统 XML 配置文件的 Java 配置类。

**SpringBoot 的设计目的简单一句话：简化 Spring 应用的初始搭建以及开发过程。**

## 2-SpringBoot 的特性

SpringBoot 作为 Java 领域微服务架构的最优落地技术，具有如下特性：

SpringBoot 有如下特性：

1. 快速创建并运行 Spring 应用；
2. 能够使用内嵌的 Web 容器（如 Tomcat、Jetty等）；
3. 提供定制化的启动器 Starter 简化第三方依赖配置，开箱即用；
4. 零代码生成和零 XML 配置，自动配置 Spring；
5. 提供可以直接在生产环境中使用的功能特性，如性能指标、健康检查、属性配置等。

## 3-SpringBoot Starter

SpringBoot 在配置上相比 Spring 要简单许多, 其核心在于其 Starter 机制。

SpringBoot 的 Starter 机制抛弃了以前繁杂的配置，将其统一集成进 Starter，使用的时候只需要在 maven 中引入对应的 Starter 依赖即可，SpringBoot 就能自动扫描到要加载的信息并启动相应的默认配置。

SpringBoot 官方提供了很多当前流行的基础功能组件的封装，命名一般以 `spring-boot-starter` 开头，比如 `spring-boot-starter-quartz` 定时任务组件和 `spring-boot-starter-thymeleaf`页面模板引擎等。

另外，由于 SpringBoot 的流行，很多第三方中间件也按照 SpringBoot 的规范提供了针对 SpringBoot 项目的 Starters（启动器），一般以组件名开头，比如 MyBatis 针对 Spring Boot 提供的组件包 mybatis-spring-boot-starter。

## 4-什么是"约定优于配置"？

SpringBoot 的核心设计思想是“约定优于配置”，SpringBoot 提供的所有 Starter 都是遵循这一思想实现的。那么，究竟什么是“约定优于配置”呢？

“约定优于配置”也被称作“按约定编程”，是一种软件设计范式，旨在减少软件开发者需要的配置项，这样既能使软件保持简单而又不失灵活性。

约定优于配置是一个简单的概念。系统，类库，框架应该假定合理的默认值，而非要求提供不必要的配置。在大部分情况下，你会发现使用框架提供的默认值会让你的项目开发起来效率更快。

例如在模型中存在一个名为 User 的类，那么对应到数据库会存在一个名为 user 的表，只有在偏离这个约定时才需要做相关的配置。简单来说就是假如你所期待的配置与约定的配置一致，那么就可以不做任何配置，约定不符合期待时才需要对约定进行替换配置。

