# 003-Nacos服务注册与配置中心
## 1-Nacos 概述

官网地址：https://nacos.io

GitHub地址：https://github.com/alibaba/nacos

以下的 Nacos 介绍来自 Nacos 官网：

Nacos /nɑ:kəʊs/ 是 Dynamic Naming and Configuration Service 的首字母简称，一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台。

Nacos 致力于帮助您发现、配置和管理微服务。Nacos 提供了一组简单易用的特性集，帮助您快速实现动态服务发现、服务配置、服务元数据及流量管理。

Nacos 帮助您更敏捷和容易地构建、交付和管理微服务平台。 Nacos 是构建以“服务”为中心的现代应用架构 (例如微服务范式、云原生范式) 的服务基础设施。

## 2-Nacos 的下载与安装

SpringCloud Alibaba 对应的 Nacos 版本可以在 SpringCloud Aibaba 的 [Github 地址](https://github.com/alibaba/spring-cloud-alibaba/wiki/版本说明) 查看，我这里下载的是 1.4.2 版本的 Nacos，下载地址为：https://github.com/alibaba/nacos/releases。

下载完成后在本地解压即可，解压后的 bin 目录里存放的是 Nacos 的启动脚本，在不同的系统下执行相应的启动脚本即可启动 Nacos，例如，在 Windows 系统下双击执行 startup.cmd 文件，就可以启动 Nacos，但此时会报错，这是因为 Nacos 默认的启动模式是集群，可以通过如下命令，以单例模式启动 Nacos。

```shell
startup.cmd -m standalone
```

启动后，在浏览器访问 http://localhost:8848/nacos 即可进入 Nacos 的控制台的登陆界面，默认的用户名和密码都是 nacos。



![image-20230609164217967](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springcloud/image-20230609164217967.24zkxin9f940.png)

## 3-Nacos 注册中心

### 3.1 服务注册中心介绍

在微服务架构中，一个系统通常被拆分为多个模块 / 服务，在服务是单实例情况下，可以采用点对点的 HTTP 直接调用，即 IP + Port + 接口的形式。但模块 / 服务通常都是多实例集群部署，用以减轻服务器的压力。

在多实例集群部署服务时，我们不得不考虑如下几个问题：

1. 调用方如何知晓调用哪个实例？
2. 当实例运行失败后，如何转移到别的实例上去处理请求？

服务注册中心便是为了解决上述问题，将所有的服务统一的、动态的管理起来。**所有的服务都与注册中心发生连接，由注册中心统一配置管理，不再由实例自身直接调用**。

服务管理的过程大致如下：

1. 服务提供者启动时，将服务提供者的信息主动提交到服务注册中心进行服务注册。
2. 服务调用者启动时，将服务提供者信息从注册中心下载到调用者本地，调用者从本地的服务提供者列表中，基于某种负载均衡策略选择一台服务实例发起远程调用，这是一个点到点调用的方式。
3. 服务注册中心能够感知服务提供者某个实例下线，同时将该实例服务提供者信息从注册中心清除，并通知服务调用者集群中的每一个实例，告知服务调用者不再调用本实例，以免调用失败。

### 3.2 搭建 Nacos 注册中心

#### 3.2.1 导入坐标

所有的服务都需要注册到 Nacos 注册中心，这里将 Nacos 服务发现与注册的坐标导入 mall-services 模块中：

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

#### 3.2.2 Nacos 服务发现配置

这里以 mall-user-server 服务为例，在 application.yml 中配置的 Nacos 服务发现的具体信息为：

```yaml
spring:
  application:
    name: mall-user-server
  cloud:
    nacos:
      server-addr: 127.0.0.1:8848 # Nacos 服务地址
      discovery:
      # 服务注册的名称，默认是:spring.application.name
        service: ${spring.application.name} 
        # 服务注册的地址，默认是:spring.cloud.nacos.server-addr
        server-addr: ${spring.cloud.nacos.server-addr} 
```

此时，只需要在各个服务的启动类或配置类上加上 `@EnableDiscoveryClient` 注解用于开启服务注册与发现的支持，服务就可以注册到 Nacos，但经过实际测试不加 `@EnableDiscoveryClient` 注解，服务也能注册到 Nacos。

::: tip
在配置 `spring.application.name` 和 `spring.cloud.nacos.server-addr` 的前提下，可以不配置 `spring.cloud.nacos.service` 和 `spring.cloud.nacos.discovery`。
:::
### 3.3 Nacos 领域模型

**Nacos 领域模型描述了服务与实例之间的边界和层级关系。**Nacos 的服务领域模型是以**服务**为维度构建起来的，这个服务并不是指集群中的单个服务器，而是指微服务的服务名。**服务**是 Nacos 中位于最上层的概念，在服务之下，还有**集群**和**实例**的概念。

![image-20230609205457741](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springcloud/image-20230609205457741.3ofjmn24h0i0.png)

#### 3.2.1 服务

在服务这个层级上可以配置元数据和服务保护阈值等信息。服务阈值是一个 0~1 之间的 数字，当服务的健康实例数与总实例的比例小于这个阈值的时候，说明能提供服务的机器已经 没多少了。这时候 Nacos 会开启服务保护模式，不再主动剔除服务实例，同时还会将不健康 的实例也返回给消费者。

#### 3.2.2 集群

一个服务由很多服务实例组成，在每个服务实例启动的时候，可以设置它所属的集群，在集群这个层级上，也可以配置元数据。除此之外，还可以为持久化节点设置健康检查模式。

所谓持久化节点，是一种会保存到 Nacos 服务端的节点，即便该节点的客户端进程没有在运行，节点也不会被服务端删除，只不过 Nacos 会将这个持久化节点的状态标记为不健康， Nacos 可以采用一种“主动探活”的方式来对持久化节点做健康检查。

除了持久化节点以外，大部分服务节点在 Nacos 中以 “临时节点” 的方式存在，它是默认的服务注册方式，从名字中就可以看出，这种节点不会被持久化保存在 Nacos 服务器，临时节点通过主动发送 heartbeat 请求向服务器报送自己的状态。

#### 3.2.3 实例

这里所说的实例就是指服务节点，可以在 Nacos 控制台查看每个实例的 IP 地址和端口、 编辑实例的元数据信息、修改它的上线 / 下线状态或者配置路由权重等等。

在这三个层级上都有 “元数据” 这一数据结构，可以把它理解为一组包含了服务描述信息（如服务版本等）和自定义标签的数据集合。Client 端通过服务发现技术可以获取到 每个服务实例的元数据，可以将自定义的属性加入到元数据并在 Client 端实现某些定制化的业务场景。

### 3.4 Nacos 数据模型

Nacos 的数据模型有三个层次结构，分别是 Namespace、Group 和 Service/DataId。

- Namespace：即命名空间，它是最顶层的数据结构，可以用它来区分开发环境、生产环境等不同环境。默认情况下，所有服务都部署到一个叫做 “public” 的公共命名空间；

- Group：在命名空间之下有一个分组结构，默认情况下所有微服务都属于 “DEFAULT_GROUP” 这个分组，不同分组间的微服务是相互隔离的；

- Service/DataID：在 Group 分组之下，就是具体的微服务了，比如订单服务、商品服务等等。

![image-20230609210818177](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springcloud/image-20230609210818177.74msn75ly0w0.png)

通过 Namespace + Group + Service/DataID，就可以精准定位到一个具体的微服务

#### 3.4.1 Namespace

不同的命名空间逻辑上是隔离的，不特殊设置的情况下，服务不会跨命名空间请求，命名空间主要的作用是区分服务使用的范围，比如开发、测试、生产可以分别设置三个命名空间来互相隔离。在不设置的情况下，只有一个保留空间 public。

设置命名空间也很简单，首先在 nacos 控制台新建命名空间，如下图所示：

![image-20230609211316753](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springcloud/image-20230609211316753.1n47u116f600.png)

在创建命名空间时，我们不必填写命名空间 ID，系统会自动生成，可以在控制台查看命名空间的 ID。接下来就可以在 Nacos 的注册配置中将服务注册到此命名空间下，例如这里将 mall-user 服务注册到此命名空间下，代码如下：

```yaml
spring:
  application:
    name: mall-user
  cloud:
    nacos:
      server-addr: 127.0.0.1:8848
      discovery:
        service: ${spring.application.name}
        server-addr: ${spring.cloud.nacos.server-addr}
        namespace: 4331959a-47d7-48d1-8995-1e606968dfe1 # Nacos 控制台生成的命名空间ID
```

#### 3.4.2 Group

Group 可以在 Namespace 基础上进行更加细致的隔离，Group 具体的使用场景主要有如下几个方面：

1. 配置分组

Group 的最常用的场景就是配置分组，一个命名空间下的一些服务都用到了一些相同的配置，就可以将这些服务分配到同一个组中，再将这些服务都用到的配置信息，抽取为改分组下的一个配置文件，这样只有在该分组的服务才能使用这个配置文件。

2. 服务分类

在企业级应用系统中，通常会有多个服务同时运行，可能包含了不同功能、不同频率和不同负载的服务。使用 Nacos 的 Group 功能可以将这些服务按照自定义的规则进行分类，以便更好地区分和管理。

3. 灰度发布

灰度发布是基于服务的，在 Nacos 中服务的 Group 就是实现灰度发布的关键，在灰度发布中，通常将新版本的服务和旧版本的服务同时运行一段时间，然后再逐步将新版本的服务全部投入使用。可以将新版本的服务和旧版本的服务归类到不同的组中，通过不断调节不同组的服务权重来实现灰度发布。

## 4 Nacos 集群

Nacos 支持两种部署模式：单机模式和集群模式。在开发中，我们习惯用单机模式快速构建一个 Nacos 开发/测试环境，而在生产中，出于高可用的考虑，一定需要使用 Nacos 集群部署模式。Nacos 为高可用做了非常多的特性支持，而这些高可用特性大多数都依赖于集群部署模式。

### 4.1 Nacos 集群架构

下图是 Nacos  官方文档给出的 Nacos 集群部署架构图，其中的 SLB 表示负载均衡，外部服务向 Nacos 发起注册时，首先会经过 SLB，通常使用 Nginx，为了保证高可用 Nginx 也可以做集群，通过 Nginx 来分发到具体的 Nacos 服务器上面。

![deployDnsVipMode](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springcloud/deployDnsVipMode.3bnwy73qeqm0.jpg)

### 4.2 数据持久化配置

Nacos 默认数据存储在内嵌数据库 Derby 中，不属于生产可用的数据库。官方推荐的最佳实践是使用带有主从的高可用数据库集群，这里以单点的外部数据库 MySQL 为例。可以使用 Docker 在虚拟机上安装 MySQL，命令如下：

```shell
docker run \
		-p 3306:3306 \
		--name mysql \
		-v /docker/mysql/logs:/logs \
		-v /docker/mysql/data:/var/lib/mysql \
		-v /docker/mysql/conf:/etc/mysql/conf.d \
		-e MYSQL_ROOT_PASSWORD=root \
		-d mysql:8.0.17
```

首先，在 nacos 安装目录的 conf 目录下找到 nacos-mysql.sql 文件，需要在名为 nacos_config 的数据库中执行这个文件。

接着，在 nacos 安装目录的 conf 目录下找到 application.properties 文件，修改其中的数据库配置，除了下面的数据库平台配置和数据库数量配置外，还要保证连接的数据库地址的正确性。

```properties
spring.datasource.platform=mysql # 使用mysql数据库
db.num=1 # 数据库的数量
```

### 4.3 搭建 Nacos 集群

#### 4.3.1 Nacos 集群配置

在做好 Nacos 持久化之后，需要在 Nacos 安装目录的 conf 目录下，将 cluster.conf.example 文件重命名为 cluster.conf，然后打开这个文件，添加需要集群 Nacos 的 IP 信息。

这里采用在本地机器上启动三个 Nacos 实例为例，来说明 Nacos 的集群部署。需要在 cluster.conf 集群配置文件中添加本地及其不同端口的三个 Nacos IP 信息，这里需要保证保证端口不连续，否则会出现集群异常。下面是我本地配置的三台 Nacos IP 信息：

| Nacos 服务        | IP                 |
| ----------------- | ------------------ |
| nacos server 8848 | 192.168.0.107:8848 |
| nacos server 8858 | 192.168.0.107:8858 |
| nacos server 8868 | 192.168.0.107:8868 |

然后，将 Nacos 安装目录复制三份，分别命名为 nacos-8848、nacos-8858、nacos-8868。

最后，需要分别修改这三个 Nacos 的 application.properties 中配置的 Nacos 端口，需要和 Nacos 的 IP 信息 一一对应。

#### 4.3.2 Nginx 配置

这里以 Windows 版的 Nginx 为例，修改其 conf 目录下的 nginx.conf 文件：

```java
upstream nacos-cluster {
    server 192.168.0.107:8848;
    server 192.168.0.107:8858;
    server 192.168.0.107:8868;
}

server {
    listen       80;
    server_name  localhost;

    location /nacos {
        proxy_pass http://nacos-cluster;
    }
}
```

这里的 192.168.0.107 为本机电脑的 IPv4 地址。如果使用 127.0.0.1，Nacos 集群启动后，不仅会注册 127.0.0.1 相应的集群，也会注册 192.168.0.107 相应的集群。

启动 Nginx 后，即可访问 http://localhost:80/nacos 来检查是否代理成功：

![image-20230707094529973](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springcloud/image-20230707094529973.4xdi7gxvv180.png)

可以通过如下配置将服务注册到搭建的 Nacos 集群上：

```yaml
server:
  port: 7000

spring:
  application:
    name: mall-user
  cloud:
    nacos:
      server-addr: 192.168.0.107:80
      discovery:
        service: ${spring.application.name}
        server-addr: ${spring.cloud.nacos.server-addr}
        cluster-name: Shanghai # 集群名字，可以用地区命名,默认的集群名字为 DEFAULT
```

### 4.4 权重策略

在项目的实际部署过程中，不同机器之间存在性能差异，我们希望性能好的机器承担更多的用户请求，但默认情况下 NacosRule 是同集群内随机挑选，不会考虑机器性能问题。

SpringCloud Alibaba Nacos 默认提供了名为 `NacosLoadBalancer` 的负载均衡规则，其负载均衡规则首先会选择同一个集群下的服务，然后再根据服务的权重进行选择。

默认情况下，Nacos 的权重选择是关闭的，仅仅使用轮询策略，可使用如下配置来开启 Nacos 的权重策略：

```yaml
spring:
  cloud:
    loadbalancer:
      nacos:
      	enabled: true
```

Nacos 的权重配置可以在 Nacos 控制台进行配置，其值介于 0~1 之间，权重越大则访问频率越高，权重为 0 的 Nacos 实例永远不会被访问。

> 如果未给服务器设置权重，建议不要使用基于权重的策略，因为如果微服务的权重都相同，相当于随机

我们可以在本地再启动一份 mall-user-server，配置如下：

```yaml
server:
  port: 7001

spring:
  application:
    name: mall-user-server
  cloud:
    nacos:
      server-addr: 192.168.0.107:80
      discovery:
        service: ${spring.application.name}
        server-addr: ${spring.cloud.nacos.server-addr}
        cluster-name: Shanghai
```

现在就可以在 Nacos 的 Shanghai 集群里看到两个 mall-user-server 实例了

![image-20230707100922402](https://cdn.jsdelivr.net/gh/mengyahui/image-repository@master/springcloud/image-20230707100922402.1ny8yvotse8w.png)

### 4.5 临时/持久化实例

注册到 Nacos 的服务实例默认都是临时实例，临时实例每隔一段时间想 Nacos 发送一个心跳请求来告诉 Nacos 自己还活着，和 Eureka  一样，如果心跳停止，则 Nacos 会将其从服务列表中剔除。

对于持久化实例 Nacos 会主动发送请求询问其是否活着，若是死了，则会等待其恢复健康，而并不是剔除。可以通过如下配置将服务注册为持久化实例：

```yaml
spring:
  application:
    name: mall-user
  cloud:
    nacos:
      server-addr: 192.168.0.107:80
      discovery:
        service: ${spring.application.name}
        server-addr: ${spring.cloud.nacos.server-addr}
        cluster-name: Shanghai
        namespace: f354ee02-7bd3-4743-bcd1-b5683b5050a7
        ephemeral: false # 注册持久化实例
```

这里新建了一个命名空间，这是因为 **public 命名空间下的服务是无法被注册为持久化实例的**。

### 4.6 保护阈值

Nacos 设计了临时实例和持久化实两种服务注册模式，这与 Nacos 的保护阈值息息相关。本质上，保护阈值是⼀个⽐例值（当前服务健康实例数/当前服务总实例数）。

服务消费者从 Nacos 拉去服务时，获取的实例有健康可不健康之分，Nacos 在返回实例时，只会返回健康实例。

但在⾼并发、⼤流量场景会存在⼀定的问题。比如，服务 A 有 100 个实例，其中 98 个实例都处于不健康状态，如果 Nacos 只返回其中的两个健康实例的话。流量洪峰的到来可能会直接打垮这两个服务，进一步产生雪崩效应。

若（当前服务健康实例数/当前服务总实例数）< 保护阈值时，Nacos 会把该服务所有的实例信息（健康的+不健康的）全部提供给消费者，消费者可能访问到不健康的实例，请求失败，但这样也⽐造成雪崩要好。牺牲了⼀些请求，保证了整个系统的可⽤。

所以，对于永久实例来说，即使它们挂掉了，状态为不健康的，但当触发保护阈值时，还是可以起到分流的作用，这就是 Nacos 设计两种服务注册模式的意义。

## 5-Nacos 配置中心

### 5.1 服务配置中心介绍

顾名思义，配置中心就是一个统一存放配置的地方。为什么我们会需要配置中心？

在没有配置中心之前，项目的配置存在如下问题：

1. 采用本地静态配置，无法保证实时性：修改配置不灵活且需要经过较长的测试发布周期，无法尽快通知到客户端，还有些配置对实时性要求很高，比方说主备切换配置或者碰上故障需要修改配置，这时通过传统的静态配置或者重新发布的方式去配置，那么响应速度是非常慢的，业务风险非常大；
2. 易引发生产事故：比如在发布的时候，容易将测试环境的配置带到生产上，引发生产事故；
3. 配置散乱且格式不标准：有的用 properties 格式，有的用 xml 格式，还有的存储在数据库中；
4. 配置缺乏安全审计、版本控制、配置权限控制功能：谁？在什么时间？修改了什么配置？无从追溯，出了问题也无法及时回滚到上一个版本；无法对配置的变更发布进行认证授权，所有人都能修改和发布配置。

而配置中心区别于传统的配置信息分散到系统各个角落的方式，对系统中的配置文件进行集中统一管理，而不需要逐一对单个的服务器进行管理。那这样做有什么好处呢？

1. 通过配置中心，可以使得配置标准化、格式统一化；
2. 当配置信息发生变动时，修改实时生效，无需要重新重启服务器，就能够自动感知相应的变化，并将新的变化统一发送到相应程序上，快速响应变化。
3. 将配置和发布包解藕进一步提升发布的成功率，并为运维的细力度管控、应急处理等提供强有力的支持。

### 5.2 搭建 Nacos 配置中心

#### 5.2.1 导入坐标

每个服务都需要使用 Nacos 配置中心，将其坐标导入 mall-services 模块下：

```xml
<dependencies>
    <dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bootstrap</artifactId>
</dependency>
</dependencies>
```

从 SpringCloud 2020 版本后不再默认加载 bootstrap 文件，如果需要加载 bootstrap 文件，则需要手动添加依赖。

#### 5.2.2 Nacos 配置中心配置

搭建 Nacos 配置中心时，需要将 Nacos 的配置中心信息放到 `bootstrap.yml` 文件中？

微服务要拉取 Nacos 中管理的配置，并且与本地的 `application.yml` 配置**合并**，才能完成项目启动，但本地尚未读取 `application.yml` 又如何获取 Nacos 配置中心地址呢？

除了 `application.yml` 配置文件外，SpringBoot 还提供了另一种配置文件 `bootstrap.yml` 文件，会在 `application.yml` 之前被读取，而且发生在拉取 Nacos 配置中心信息之前。

以 mall-user-server 服务为例，搭建 Nacos 的配置中心，可以在其 bootstrap.yml 中配置如下信息：

```yaml
spring:
  cloud:
    nacos:
      server-addr: 192.168.0.107:8848
      discovery:
        service: ${spring.application.name}
        server-addr: ${spring.cloud.nacos.server-addr}
      config:
        server-addr: ${spring.cloud.nacos.server-addr} # nacos 配置中心地址
        file-extension: yml # nacos 配置文件格式
        prefix: ${spring.application.name} # nacos 配置中心名字
        
  profiles:
    active: dev

  application:
    name: mall-user-server
```

#### 5.2.3 在 Nacos 中添加配置信息

点击 Nacos 控制台配置列表右上角的 “+” 号，即可进入新建配置页面，不同服务的配置是通过 `Data ID` 来区分的，其命名规则为：`${prefix}-${spring.profiles.active}.${file-extension}`

- prefix 默认为 `spring.application.name` 的值，也可以通过 `spring.cloud.nacos.config.prefix` 来指定；
- `spring.profiles.active` 即为当前环境对应的 profile，当 `spring.profiles.active` 为空时，对应的连接符 `-`  也将不存在，dataId 的拼接格式变成 `${prefix}.${file-extension}`

- `file-exetension` 为配置内容的数据格式，可以通过配置项 `spring.cloud.nacos.config.file-extension` 来配置。目前只支持 properties 和 yaml 类型。

如果我们要为 mall-user-server 添加配置信息，则其 Data ID 为：`mall-user-server-dev.yml`。

既然服务需要拉取 Nacos 配置中心管理的配置再与本地的 `application.yml` 中的配置进行合并，那么我们就可以只在本地保存 Nacos 拉取和注册需要的配置信息，将其它的配置信息都放到 Nacos，下面是 mall-user-server 的具体配置。

**bootstrap.yml**

```yaml
server:
  port: 7000

spring:
  application:
    name: mall-user-server
  cloud:
    nacos:
      server-addr: 192.168.0.107:8848
      discovery:
        service: ${spring.application.name}
        server-addr: ${spring.cloud.nacos.server-addr}
      config:
        server-addr: ${spring.cloud.nacos.server-addr}
        file-extension: yml
        prefix: ${spring.application.name}

  profiles:
    active: dev
```

**Nacos 配置中心配置**

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc://mysql:localhost:3306/mall_ums
    username: root
    password: root
```

#### 5.2.4 配置热更新

Nacos 也是支持配置的热更新的，下面以阿里云短信服务来介绍两种 Nacos 热更新的使用方式。

首先，在 mall-user-server 的 Nacos 配置中心上添加阿里云的短信服务配置：

```yaml
sms:
  accessKey: LTAI5tMGtKPbL2bCp6zSU4Bz
  accessKeySecret: baAdNzxAjnIMKU3wroxZLlpAACpy02
  signName: gtzk
  templateCode: SMS_183195440
  doMain: dysmsapi.aliyuncs.com
  regionId: cn-hangzhou
```

> 方式一：在 @Value 注入的变量所在类上添加注解 **@RefreshScope**

```java
@RestController
@RefreshScope
public class AliSmsController {

    @Value("${sms.accessKey}")
    private String accessKey;

    @Value("${sms.accessKeySecret}")
    private String accessKeySecret;

    @Value("${sms.signName}")
    private String signName;

    @Value("${sms.templateCode}")
    private String templateCode;

    @GetMapping("method1")
    public Map<String,String> method1() {
        Map<String,String> result = new HashMap<>();
        result.put("accessKey",accessKey);
        result.put("accessKeySecret",accessKeySecret);
        result.put("signName",signName);
        result.put("templateCode",templateCode);
        return result;
    }
    
}
```

> 方式二：使用 @ConfigurationProperties 注解

使用 `@ConfigurationProperties` 注解读取配置文件，不需要加 `@RefreshScope` 注解，就可以实现配置的热更新，一般也是使用这种方式。

首先，使用 `@ConfigurationProperties` 注解定义 sms 的配置：

```java
@ConfigurationProperties(prefix = "sms")
@Component
@Data
public class AliSmsProperties {

    private String accessKey;

    private String accessKeySecret;

    private String signName;

    private String templateCode;
}
```

接着使用 @Autowired 注解在使用处注入即可：

```java
@RestController
public class UserController {
    
    @Autowired
    private AliSmsProperties aliSmsProperties;

    @GetMapping("method2")
    public Map<String,String> method2() {
        Map<String,String> result = new HashMap<>();
        result.put("accessKey",aliSmsProperties.getAccessKey());
        result.put("accessKeySecret",aliSmsProperties.getAccessKeySecret());
        result.put("signName",aliSmsProperties.getSignName());
        result.put("templateCode",aliSmsProperties.getTemplateCode());
        return result;
    }

}
```

#### 5.2.5 多个服务共享配置

在实际开发过程中，如果遇到多个服务用到相同的配置，可以将重复的配置抽取出来，然后在每个服务中引用即可。例如，我们在 Nacos 配置中心新建了一个 common.yml 的配置文件，则可以使用如下方式在每个服务中引用：

```yaml
server:
  port: 7000

spring:
  application:
    name: mall-user-server
  cloud:
    nacos:
      server-addr: 192.168.0.110:8848
      discovery:
        service: ${spring.application.name}
        server-addr: ${spring.cloud.nacos.server-addr}
      config:
        server-addr: ${spring.cloud.nacos.server-addr}
        file-extension: yml
        prefix: ${spring.application.name}
        shared-configs: # 共享配置列表
          - data-id: common.yml

  profiles:
    active: dev
```

