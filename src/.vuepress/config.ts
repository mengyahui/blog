import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import {shikiPlugin} from "@vuepress/plugin-shiki";
import {searchProPlugin} from "vuepress-plugin-search-pro";

// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
export default defineUserConfig({
  base: "/blog/",
  lang: "zh-CN",
  title: "MYH'Blog",
  description: "",

  theme,
  plugins: [
      shikiPlugin({
        theme: "dark-plus"
      }),
      searchProPlugin({
          indexContent: true,
          // customFields: [
          //     {
          //         name: "category",
          //         getter: (page) => page.frontmatter.category,
          //         formatter: "分类：$content",
          //     },
          //     {
          //         name: "tag",
          //         getter: (page) => page.frontmatter.tag,
          //         formatter: "标签：$content",
          //     }
          // ]
      }),
  ]


  // Enable it with pwa
  // shouldPrefetch: false,
});
