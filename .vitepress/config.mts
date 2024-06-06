import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "illegalCreed",
  description: "A Roadmap of Dev",
  srcDir: "./src",
  cleanUrls: true,
  locales: {
    root: {
      label: "English",
      lang: "en",
      themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
          { text: "Home", link: "/" },
          { text: "Examples", link: "/markdown-examples" },
        ],

        sidebar: [
          {
            text: "Examples",
            items: [
              { text: "Markdown Examples", link: "/markdown-examples" },
              { text: "Runtime API Examples", link: "/api-examples" },
            ],
          },
        ],

        socialLinks: [
          { icon: "github", link: "https://github.com/vuejs/vitepress" },
        ],
      },
    },
    zh: {
      label: "中文",
      lang: "zh", // 可选，将作为 `lang` 属性添加到 `html` 标签中
      link: "/zh/", // 默认 /fr/ -- 显示在导航栏翻译菜单上，可以是外部的
      themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
          { text: "首页", link: "/zh/" },
          { text: "文档", link: "/zh/start" },
        ],

        sidebar: [
          {
            text: "指南",
            items: [
              { text: "开始", link: "/zh/start" },
              { text: "简历", link: "/zh/CV" },
              { text: "Markdown Examples", link: "/zh/markdown-examples" },
              { text: "Runtime API Examples", link: "/zh/api-examples" },
            ],
          },
        ],

        socialLinks: [
          {
            icon: "github",
            link: "https://github.com/IllegalCreed/IllegalCreed.github.io",
          },
        ],
      },
    },
  },
});
