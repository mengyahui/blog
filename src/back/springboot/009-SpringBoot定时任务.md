# 009-SpringBoot定时任务
在项目开发中经常要使用到定时任务，对于一些没有实时性要求且需要周期性执行的任务，都需要使用定时任务解决。

在调用第三方接口时，通常需要携带第三方平台的凭证，就比如微信小程序，要想调用其 OpenApi 就必须携带 accessToken，而这个 accessToken 只有两个小时的时效，所以使用定时任务定时获取 微信小程序的 accessToken 是非常有必要的。SpringBoot 框架对定时任务也给出了解决方案。

## 1-基本使用

在 SpringBoot 项目中，仅仅通过注解就可以实现定时任务。

### 1.1 第一步

在 SpringBoot 项目的启动类或配置类上添加 `@EnableScheduling` 注解。

```java
@SpringBootApplication
@EnableScheduling
public class TaskApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaskApplication.class,args);
    }
}
```

### 1.2 第二步

在**目标任务的执行方法**上标注添加了**触发定时任务元数据**的 `@Scheduled` 注解。目标任务的执行方法不能携带任何参数，且返回值类型为 void。

```java
@Component
public class SchedulerTask {

    @Scheduled(fixRate = 2000)
    public void updateAccessToken() {
        // 执行代码
    }
}
```

触发定时任务的元数据有如下几种：

1. **fixedDelay / fixedDelayString**：表示从上次调用结束到下次调用开始的固定时间。
2. **fixedRate / fixedRateString**：表示两次调用之间的固定时间，如：`@Scheduled(fixedRate=5000)` 表示上次开始无论是否结束 5 秒钟之后会再次执行。**initialDelay / initialDelayString**：表示第一次执行任务时延迟的时间。通常和上面两组元数据搭配使用。
3. **timeUnit**：指定时间的单位，通常搭配上面三组元数据使用。在不指定的情况下时间单位为毫秒。
4. **cron**：通过 cron 表达式来设置定时任务的执行时间。下面会具体介绍 cron 表达式。

### 1.3 xxx 和 xxxString 的区别

首先 xxx 和 xxxString 的值都是以毫秒为单位的，也可以使用 timeUnit 来指定时间单位，不同的是 xxxString 支持占位符 `${}` 从配置文件中读取时间配置。如：`@Scheduled(fixedDelayString= "${task.fixedTime}")`。

## 2-异步任务

通过 `@Scheduled` 注解来实现定时任务还是非常方便的，但如果系统中存在多个定时任务时，这些任务会同步执行，即所有的定时任务每次都是在同一个线程上执行。也就是说，前面定时任务的执行可能会影响到后面任务的执行。

之所以会出现上面的问题，是因为 Java 的方法调用都是同步的。之前都是通过多线程来处理此类问题，但在 Spring 3.x 后，就内置了 `@Async` 注解来处理此类问题。被 `@Async` 注解标注的方法，称之为异步方法；这些方法将会在独立的线程中被执行，调用者无需等待它们的完成，再去继续其它操作。

SpringBoot 将异步任务的执行抽象为 `TaskExecutor` 接口，其默认实现为：`ThreadPoolTaskExecutor`。标注了 `@Async` 注解的定时任务，会被 `ThreadPoolTaskExecutor` 处理，其默认的核心线程数是 8，这也是 `@Async` 注解能处理异步任务的核心。

`@Async` 注解通过配置多个核心线程数来处理异步任务，那定时任务的 `@Scheduled` 注解可不可以通过调整核心线程数来解决任务同步执行的问题呢？**当然可以！！！**

SpringBoot 将定时任务的执行，抽象为`TaskScheduler` 接口，其默认实现为：`ThreadPoolTaskScheduler`，默认为其依赖的底层线程池 `ScheduledExecutorService` 只分配了一个线程。

所以，即使不使用 `@Async` 注解，而仅仅调整 `ThreadPoolTaskScheduler` 所依赖线程池的核心线程数量，同样可以实现定时任务的异步执行。同样的，即使添加了 `@Async` 注解，将 `ThreadPoolTaskExecutor`依赖的线程池的核心线程数设置为 1，定时任务也只能在同一个线程上执行。

可以在 application.yml 配置文件中修改定时任务 `ThreadPoolTaskScheduler` 的参数配置

```yaml
spring:
  task:
    scheduling:
      pool:
        size: 10 # 定时任务线程池的大小，默认为 1
      thread-name-prefix: Task-Job- # 线程池的线程名的前缀,默认为 scheduling-
      shutdown:
        await-termination: true # 关闭应用时是否等待定时任务执行完成。默认为false ，建议设置为true
        await-termination-period: 60 # 等待任务完成的最大时长，单位为秒。默认为 0
```

此外，还可以通过向容器中注入一个 `ThreadPoolTaskScheduler` 的 Bean 来修改定时任务 `ThreadPoolTaskScheduler` 的参数配置

```java
@Configuration
@EnableScheduling
public class TaskConfig {
    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(20);
        scheduler.setThreadNamePrefix("Task-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(60);
        return scheduler;
    }
}
```

## 3-动态执行

SpringBoot 提供的 `@Scheduled` 注解实现定时任务虽然很方便，但执行周期是写死在代码中的，若想改变就只能修改代码并重新部署。实在不够灵活，Spring 也考虑到了这一点，提供了一个 `SchedulingConfigurer` 接口，用于拓展动态定时任务。

```java
@FunctionalInterface
public interface SchedulingConfigurer {
	void configureTasks(ScheduledTaskRegistrar taskRegistrar);
}
```

在重写该接口的 `configureTasks` 方法中可以添加指定格式的定时任务，就像下面这样：

```java
@Configuration
@EnableScheduling
public class TaskConfig implements SchedulingConfigurer {
    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        taskRegistrar.addCronTask(() -> System.out.println("定时任务"), "0/10 * * * * ?");
    }
}
```

`addCronTask` 方法有很多重载，这里仅仅介绍本例中使用的`addCronTask(Runable task, String cron)`，该方法的第一个参数为实现了 Runable 接口的目标任务，第二个参数为 cron 表达式。

`ThreadPoolTaskScheduler` 用于调度定时任务，其执行定时任务的核心方法共有 5 个，这里也仅介绍本例中使用到的 `ScheduledFuture<?> schedule(Runnable task, Trigger trigger)`，该方法的第一个参数为实现了 Runable 接口的目标任务，第二个参数为触发器实例，可以传入 cron 表达式的触发器实例。

`ScheduledFuture` 作为 `ThreadPoolTaskScheduler` 任务调度的返回值，是 `ScheduledExecutorService` 线程池的调度结果，可使用其 `cancel(true)` 方法来结束这个定时任务

## 4-案例代码

### 4.1 创建数据库

既然是动态执行定时任务，那就离不开数据库，代码如下：

```sql
CREATE TABLE `t_task`  (
  `task_id` bigint NOT NULL AUTO_INCREMENT COMMENT '定时任务主键',
  `name` varchar(50) CHARACTER SET utf8mb4 COMMENT '定时任务名称',
  `cron` varchar(50) CHARACTER SET utf8mb4 COMMENT 'cron 表达式',
  `job_class` varchar(255) CHARACTER SET utf8mb4 COMMENT '执行类',
  `disabled` varchar(2) CHARACTER SET utf8mb4 COMMENT '是否禁用【1-正常，0-禁用】',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `modify_time` datetime NULL DEFAULT NULL COMMENT '更新时间',
  `note` varchar(255) CHARACTER SET utf8mb4 COMMENT '任务说明',
  PRIMARY KEY (`task_id`) USING BTREE
) 
```

### 4.2 创建定时任务包装类

在前面介绍定时任务调度器 `ThreadPoolTaskScheduler` 时，就已经说明了，目标定时任务必须实现 Runable 接口，结合线程的创建方法，这点不难理解。

```java
@Component
@Slf4j
public abstract class AbstractTask implements Runnable {

    private ScheduledFuture<?> scheduledFuture;

    @Resource
    private ThreadPoolTaskScheduler taskScheduler;

    public abstract String getName();

    public abstract void execute();

    // 创建定时任务
    public void createTask(String cron) {
        try {
            scheduledFuture = taskScheduler.schedule(this, new CronTrigger(cron));
        } catch (Exception e) {
            log.error("创建定时任务【{}】失败", getName());
        }
    }

    // 取消定时任务
    public void cancel() {
        try {
            if (scheduledFuture != null) {
                scheduledFuture.cancel(true);
                log.info("取消执行【{}】任务",getName());
            }
        } catch (Exception e) {
            log.error("取消执行【{}】任务失败",getName());
            e.printStackTrace();
        }
    }

    @Override
    public void run() {
        execute();
    }
}
```

### 4.3 实现 TaskService

这里采用类的全路径来获取实现了 `AbstractTask` 的目标任务实例。

```java
@Service
public class TaskServiceImpl implements TaskService {

    @Resource
    private ApplicationContext context;

    @Resource
    private TaskMapper taskMapper;

    
    @Override
    public List<Task> findAllTask() {
        return taskMapper.list();
    }

    @Override
    public void createTask(Task task) {
        try {
            AbstractTask job = 
                (AbstractTask) context.getBean(Class.forName(task.getJobClass()));
            job.createTask(task.getCron());
            taskMapper.addTask(task);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void updateTask(Task task) {
        try {
            AbstractTask job = 
                (AbstractTask) context.getBean(Class.forName(task.getJobClass()));
            job.cancel();
            job.createTask(task.getCron());
            taskMapper.updateTask(task);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void deleteTask(Task task) {
        try {
            AbstractTask job = 
                (AbstractTask) context.getBean(Class.forName(task.getJobClass()));
            job.cancel();
            taskMapper.deleteTask(task);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void executeTask(Task task) {
        try {
            AbstractTask job = 
                (AbstractTask) context.getBean(Class.forName(task.getJobClass()));
            job.execute();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}
```

### 4.4 注册任务

```java
@Configuration
@EnableScheduling
public class TaskConfig implements SchedulingConfigurer {

    @Resource
    private TaskService taskService;

    @Resource
    private ApplicationContext context;

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        List<Task> allTask = taskService.findAllTask();
        allTask.forEach(task -> {
            try {
                AbstractTask job = 
                    (AbstractTask) context.getBean(Class.forName(task.getJobClass()));
                job.createTask(task.getCron());
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
        });
    }

    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(20);
        scheduler.setThreadNamePrefix("Task-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(60);
        return scheduler;
    }
}
```

## 5-cron

### 5.1 域数

cron 表达式有 6域、7域之分，不同域之间以空格分隔。

| 域数 | 每域的含义                       |
| ---- | -------------------------------- |
| 6 域 | 秒、分、时、日期、月份、星期     |
| 7 域 | 秒、分、时、日期、月份、星期、年 |

在大部分情况下都会省略年这一位，使用 6 位的 cron 表达式。

> Linux 中的 crontab 表达式只有 5 域，分别为：分、时、日期、月份、星期

### 5.2 特殊字符

cron 表达式中的每一域都支持一定数量的特殊字符，每个特殊字符有其特殊含义。

| 特殊字符 | 使用域     | 说明                                                         |
| -------- | ---------- | ------------------------------------------------------------ |
| `*`      | 所有域     | 在月域中，`*`表示每个月；在星期域中，`*`表示星期的每一天。   |
| `,`      | 所有域     | 在分钟域中，`5,20`表示分别在 5 分钟和 20 分钟触发一次。      |
| `-`      | 所有域     | 在分钟域中，`5-20`表示从 5 分钟到 20 分钟之间每隔一分钟触发一次。 |
| `/`      | 所有域     | 在分钟域中，`0/15`表示从第0分钟开始，每15分钟触发一次。      |
| `?`      | 日期、星期 | 当日期或星期其中之一确定以后，为了避免冲突，需要将另一位的值设为`?` |
| `L`      | 日期、星期 | 单词 Last 的首字母，某月或某星期的最后一天触发，仅日期和星期支持该字符。 |
| `W`      | 日期       | 除周末以外距离指定日期最近的有效工作日触发，且不会跨过当前月份。 |
| `#`      | 星期       | 在星期域中，`4#2`表示某月的第二个星期四触发。                |

### 5.3 cron 在线生成器

http://cron.ciding.cc/