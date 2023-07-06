# 002-SpringCloud案例项目搭建

为了方便 SpringCloud 的学习，这里以电商项目的三个核心模块：用户模块、商品模块和订单模块为例，来学习 SpringCloud 组件。

## 1-技术选型

数据库：MySQL8.0.11

持久层：MyBatis-Plus

Maven：3.8.4

## 2-数据库设计

微服务架构下的不同微服务之间可以使用不同的语言和存储技术，这里使用 MySQL 数据库进行存储，为每个独立的模块创建自己的数据库。

#### 2.2.1 用户服务

用户服务的数据库名设计为 mall_ums，仅仅创建一张用户表 ums_user，表结构如下：

```sql
CREATE TABLE ums_user(
    id                 bigint NOT NULL auto_increment comment '自增主键',
    username           varchar(64) NOT NULL comment '用户名',
    password           varchar(64) NOT NULL comment '密码',
    nickname           varchar(64) NULL DEFAULT NULL comment '昵称',
    mobile             varchar(20) NULL DEFAULT NULL comment '手机号码',
    email              varchar(64) NULL DEFAULT NULL comment '邮箱',
    avatar             varchar(500) NULL DEFAULT NULL comment '头像',
    status             tinyint(4) NOT NULL DEFAULT 1 comment '启用状态[1-启用,0-禁用]',
    create_time        datetime NULL DEFAULT NULL comment '注册时间',
    is_deleted         tinyint(4) NOT NULL DEFAULT 1 comment '删除标志[1-未删除,0-已删除]',
    PRIMARY KEY (id)
);
```

#### 2.2.2 商品服务

商品服务的数据库名设计为 mall_pms，为了方便学习这里仅仅创建一张商品表 pms_product，表结构如下：

```sql
CREATE TABLE pms_product(
    id          	      bigint NOT NULL auto_increment comment '自增主键',
    name        	      varchar(64) NOT NULL comment '商品名称',
    price      	 	      varchar(20) NOT NULL comment '商品价格',
    status      	      tinyint(4) NOT NULL DEFAULT 1 comment '上架状态[1-已上架,0-下架]',
    goods_desc  	      varchar(100) NULL DEFAULT NULL comment '商品详情',
    is_deleted		      tinyint(4) NOT NULL DEFAULT 1 comment '删除标志[1-未删除,0-已删除]',
    PRIMARY KEY (id)
);
```

#### 2.2.3 订单服务

订单模块的数据库名设计为 mall_order，为了方便学习，订单状态也只设计了 2 种状态：已创建、已完成，表结构如下：

```sql
CREATE TABLE oms_order(
    id                  bigint(20) NOT NULL auto_increment comment '自增主键',
    user_id             bigint(20) NULL DEFAULT NULL COMMENT '用户id',
    order_no            char(32) NULL DEFAULT NULL COMMENT '订单号',
    create_time         datetime NULL DEFAULT NULL COMMENT '订单创建时间',
    total_amount        varchar(20) NULL DEFAULT NULL COMMENT '订单总额',
    note                varchar(500) NULL DEFAULT NULL COMMENT '订单备注',
    receiver_name       varchar(100) NULL DEFAULT NULL COMMENT '收货人姓名',
    receiver_phone      varchar(32) NULL DEFAULT NULL COMMENT '收货人电话',
    status              tinyint(4) NULL DEFAULT NULL COMMENT '订单状态[1-已发货,3-已完成]',
    is_deleted          tinyint(4) NOT NULL DEFAULT 1 comment '删除标志[1-未删除,0-已删除]',
    PRIMARY KEY (id)
);
```

## 3-创建服务

案例项目的目录结构如下：

```apl
mall				    # 聚合服务
 ├─mall-api			  # 服务调用模块
 ├─mall-common		  # 公共模块
 ├─mall-model		  # 实体模块
 ├─mall-services	  # 服务模块
 	├─mall-order-server		# 订单服务
 	├─mall-product-server 	# 商品服务
 	├─mall-user-server		# 用户服务
```

#### 2.3.1 聚合服务 mall

聚合服务 mall 主要对所有项目的依赖坐标进行管理，其 pom 文件如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.mall</groupId>
    <artifactId>mall</artifactId>
    <version>1.0.0}</version>
    <packaging>pom</packaging>

    <modules>
        <module>mall-common</module>
        <module>mall-model</module>
        <module>mall-services</module>
        <module>mall-api</module>
    </modules>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.6.3</version>
    </parent>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>

        <spring_boot_version>2.6.3</spring_boot_version>
        <spring_cloud-alibaba_version>2021.0.1.0</spring_cloud-alibaba_version>
        <spring_cloud_version>2021.0.1</spring_cloud_version>
        <mybatis_plus_version>3.5.2</mybatis_plus_version>
        <mysql_version>8.0.29</mysql_version>
        <lombok_version>1.18.24</lombok_version>
        <mall_version>1.0.0</mall_version>

    </properties>

    <dependencyManagement>
        <dependencies>
            <!--SpringCloud 依赖-->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring_cloud_version}</version>
                <scope>import</scope>
                <type>pom</type>
            </dependency>

            <!--SpringCloud Alibaba依赖-->
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring_cloud-alibaba_version}</version>
                <scope>import</scope>
                <type>pom</type>
            </dependency>

            <dependency>
                <groupId>com.baomidou</groupId>
                <artifactId>mybatis-plus-boot-starter</artifactId>
                <version>${mybatis_plus_version}</version>
            </dependency>

            <dependency>
                <groupId>mysql</groupId>
                <artifactId>mysql-connector-java</artifactId>
                <version>${mysql_version}</version>
            </dependency>

            <!--内部依赖包-->
            <dependency>
                <groupId>com.mall</groupId>
                <artifactId>mall-model</artifactId>
                <version>${mall_version}</version>
            </dependency>

            <dependency>
                <groupId>com.mall</groupId>
                <artifactId>mall-api</artifactId>
                <version>${mall_version}</version>
            </dependency>

            <dependency>
                <groupId>com.mall</groupId>
                <artifactId>mall-common</artifactId>
                <version>${mall_version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>

</project>
```

#### 2.3.2 服务调用模块 mall-api

服务调用模块，管理了各个微服务的远程调用 API，其 pom 文件如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.mall</groupId>
        <artifactId>mall</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>mall-api</artifactId>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

</project>
```

#### 2.3.2 公共模块 mall-common

公共模块 mall-common，用于集中管理各个微服务公共的配置，其 pom 文件如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <artifactId>mall-common</artifactId>

    <parent>
        <groupId>com.mall</groupId>
        <artifactId>mall</artifactId>
        <version>1.0.0</version>
    </parent>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>

</project>
```

#### 2.3.3 实体模块 mall-model

实体模块 mall-model 主要对服务需要使用的pojo、vo、dto 进行管理，其 pom 文件如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.mall</groupId>
        <artifactId>mall</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>mall-model</artifactId>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
        </dependency>

        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
    </dependencies>

</project>
```

#### 2.3.4 服务模块 mall-services

该模块下管理着用户服务、商品服务和订单服务三个微服务，其 pom 文件如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.mall</groupId>
        <artifactId>mall</artifactId>
        <version>1.0.0</version>
    </parent>

    <groupId>com.mall.service</groupId>
    <artifactId>mall-services</artifactId>
    <packaging>pom</packaging>
    <modules>
        <module>mall-user-server</module>
        <module>mall-order-server</module>
        <module>mall-product-server</module>
    </modules>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>


    <dependencies>
        <!--内部依赖-->
        <dependency>
            <groupId>com.mall</groupId>
            <artifactId>mall-model</artifactId>
        </dependency>

        <dependency>
            <groupId>com.mall</groupId>
            <artifactId>mall-common</artifactId>
        </dependency>

        <dependency>
            <groupId>com.mall</groupId>
            <artifactId>mall-api</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
        </dependency>
    </dependencies>
</project>
```