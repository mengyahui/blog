const e=JSON.parse('{"key":"v-7b05132a","path":"/back/springboot/009-SpringBoot%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1.html","title":"009-SpringBoot定时任务","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"1-基本使用","slug":"_1-基本使用","link":"#_1-基本使用","children":[{"level":3,"title":"1.1 第一步","slug":"_1-1-第一步","link":"#_1-1-第一步","children":[]},{"level":3,"title":"1.2 第二步","slug":"_1-2-第二步","link":"#_1-2-第二步","children":[]},{"level":3,"title":"1.3 xxx 和 xxxString 的区别","slug":"_1-3-xxx-和-xxxstring-的区别","link":"#_1-3-xxx-和-xxxstring-的区别","children":[]}]},{"level":2,"title":"2-异步任务","slug":"_2-异步任务","link":"#_2-异步任务","children":[]},{"level":2,"title":"3-动态执行","slug":"_3-动态执行","link":"#_3-动态执行","children":[]},{"level":2,"title":"4-案例代码","slug":"_4-案例代码","link":"#_4-案例代码","children":[{"level":3,"title":"4.1 创建数据库","slug":"_4-1-创建数据库","link":"#_4-1-创建数据库","children":[]},{"level":3,"title":"4.2 创建定时任务包装类","slug":"_4-2-创建定时任务包装类","link":"#_4-2-创建定时任务包装类","children":[]},{"level":3,"title":"4.3 实现 TaskService","slug":"_4-3-实现-taskservice","link":"#_4-3-实现-taskservice","children":[]},{"level":3,"title":"4.4 注册任务","slug":"_4-4-注册任务","link":"#_4-4-注册任务","children":[]}]},{"level":2,"title":"5-cron","slug":"_5-cron","link":"#_5-cron","children":[{"level":3,"title":"5.1 域数","slug":"_5-1-域数","link":"#_5-1-域数","children":[]},{"level":3,"title":"5.2 特殊字符","slug":"_5-2-特殊字符","link":"#_5-2-特殊字符","children":[]},{"level":3,"title":"5.3 cron 在线生成器","slug":"_5-3-cron-在线生成器","link":"#_5-3-cron-在线生成器","children":[]}]}],"git":{"createdTime":1699183122000,"updatedTime":1699183122000,"contributors":[{"name":"deer","email":"2772540969@qq.com","commits":1}]},"readingTime":{"minutes":7.93,"words":2378},"filePathRelative":"back/springboot/009-SpringBoot定时任务.md","localizedDate":"2023年11月5日","excerpt":"<h1> 009-SpringBoot定时任务</h1>\\n<p>在项目开发中经常要使用到定时任务，对于一些没有实时性要求且需要周期性执行的任务，都需要使用定时任务解决。</p>\\n<p>在调用第三方接口时，通常需要携带第三方平台的凭证，就比如微信小程序，要想调用其 OpenApi 就必须携带 accessToken，而这个 accessToken 只有两个小时的时效，所以使用定时任务定时获取 微信小程序的 accessToken 是非常有必要的。SpringBoot 框架对定时任务也给出了解决方案。</p>\\n<h2> 1-基本使用</h2>\\n<p>在 SpringBoot 项目中，仅仅通过注解就可以实现定时任务。</p>"}');export{e as data};
