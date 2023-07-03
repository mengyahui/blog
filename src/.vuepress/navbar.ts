import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "后端",
    icon: "back",
    children: [
      {
        text: "SpringBoot",
        icon: "springboot",
        link: "/back/springboot"
      },
      {
        text: "SpringCloud",
        icon: "springcloud",
        link: "/back/springcloud"
      }
    ]
  },
  {
    text: "前端",
    icon: "front",
    children: [
      {
        text: "Vue基础总结",
        icon: "vue",
        link: "/front/vue"
      },
      {
        text: "常用CSS样式梳理",
        icon: "css",
        link: "/front/css"
      },
      {
        text: "JavaScript使用技巧",
        icon: "javascript",
        link: "/front/js"
      },
    ]
  },
  {
    text: "数据库",
    icon: "database",
    children: [
      {
        text: "MySQL",
        icon: "mysql",
        link: "/db/mysql"
      },
      {
        text: "Redis",
        icon: "redis",
        link: "/db/redis"
      },
      {
        text: "MongoDB",
        icon: "mongo",
        link: "/db/mongo"
      },
    ]
  }
]);
