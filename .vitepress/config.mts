import { defineConfig } from "vitepress";
import { fileURLToPath, URL } from "url";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "illegalCreed",
  description: "A Roadmap of Dev",
  srcDir: "./src",
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [
    // 站点图标(favicon):复用阶梯塔 logo
    ["link", { rel: "icon", type: "image/svg+xml", href: "/light-logo.svg" }],
    // Google Analytics 跟踪脚本
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-YZWQCNFFG3",
      },
    ],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', 'G-YZWQCNFFG3');`,
    ],
  ],

  vite: {
    // Vite 配置选项
    resolve: {
      alias: {
        "~": fileURLToPath(new URL(".", import.meta.url)),
        "@": fileURLToPath(new URL("../src", import.meta.url)),
      },
    },
    server: {
      port: 3000, // 将开发服务器端口设置为 3000
    },
  },

  markdown: {
    math: true,
    codeTransformers: [
      // We use `[!!code` in demo to prevent transformation, here we revert it back.
      // see: https://shiki.tmrs.site/guide/transformers
      {
        postprocess(code) {
          return code.replace(/\[\!\!code/g, "[!code");
        },
      },
    ],
  },

  // 全局主题配置（被各 locale 继承）：启用内置本地搜索（minisearch，无需 Algolia）
  themeConfig: {
    search: {
      provider: "local",
      options: {
        // 中文 locale 的搜索界面文案
        locales: {
          zh: {
            translations: {
              button: { buttonText: "搜索", buttonAriaLabel: "搜索" },
              modal: {
                displayDetails: "显示详细列表",
                resetButtonTitle: "重置搜索",
                backButtonTitle: "关闭搜索",
                noResultsText: "没有结果",
                footer: {
                  selectText: "选择",
                  navigateText: "导航",
                  closeText: "关闭",
                },
              },
            },
          },
        },
      },
    },
  },

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
      link: "/zh/",
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
            ],
          },

          {
            text: "Web基础知识",
            collapsed: false,
            items: [
              {
                text: "三大语言",
                collapsed: true,
                items: [
                  {
                    text: "HTML",
                    collapsed: true,
                    link: "/zh/base/language/html/",
                  },
                  {
                    text: "JavaScript",
                    collapsed: true,
                    link: "/zh/base/language/javascript/",
                  },
                  {
                    text: "CSS",
                    collapsed: true,
                    link: "/zh/base/language/css/",
                  },
                ],
              },
              {
                text: "计算机网络基础",
                collapsed: true,
                items: [
                  {
                    text: "网络模型",
                    collapsed: true,
                    items: [
                      {
                        text: "OSI 模型",
                      },
                      {
                        text: "TCP/IP 模型",
                      },
                    ],
                  },
                  {
                    text: "网络协议",
                    collapsed: true,
                    items: [
                      {
                        text: "网络层及以下",
                        items: [
                          {
                            text: "ICMP",
                          },
                          {
                            text: "ARP",
                          },
                          {
                            text: "DNS",
                          },
                        ],
                      },
                      {
                        text: "应用层",
                        items: [
                          {
                            text: "HTTP/HTTPS",
                          },
                          {
                            text: "WebSocket",
                          },
                          {
                            text: "SSL/TLS",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    text: "网络设备",
                    collapsed: true,
                    items: [
                      { text: "路由器" },
                      { text: "交换机" },
                      { text: "网关" },
                      {
                        text: "移动网络",
                        items: [
                          { text: "架构" },
                          { text: "设备" },
                          { text: "协议" },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                text: "浏览器基础",
                collapsed: true,
                items: [
                  {
                    text: "浏览器渲染原理",
                  },
                  {
                    text: "浏览器缓存机制",
                  },
                  {
                    text: "浏览器安全",
                  },
                ],
              },
            ],
          },

          {
            text: "Web进阶知识",
            collapsed: false,
            items: [
              {
                text: "语言",
                collapsed: true,
                items: [
                  { text: "Markdown" },
                  { text: "TypeScript" },
                  {
                    text: "CSS预处理",
                    collapsed: true,
                    items: [
                      { text: "Sass" },
                      { text: "Less" },
                      { text: "PostCSS" },
                      { text: "tailwind CSS" },
                      { text: "UnoCSS" },
                    ],
                  },
                  { text: "JSON" },
                  { text: "YAML" },
                ],
              },
              {
                text: "Web API",
                collapsed: true,
                items: [
                  { text: "Web Components" },
                  { text: "Web Assembly" },
                  { text: "WebRTC API" },
                  { text: "Server-Sent Events" },
                  { text: "Fetch API" },
                  { text: "WebSocket" },
                  { text: "Web Storage API" },
                  { text: "IndexedDB" },
                  { text: "Web Workers API" },
                ],
              },
              {
                text: "模块管理",
                collapsed: true,
                items: [
                  {
                    text: "CommonJS",
                    collapsed: true,
                    link: "/zh/web-advanced/module/commonjs/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/module/commonjs/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/module/commonjs/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/module/commonjs/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/module/commonjs/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/module/commonjs/reference",
                      },
                    ],
                  },
                  {
                    text: "ES Module",
                    collapsed: true,
                    link: "/zh/web-advanced/module/es-module/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/module/es-module/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/module/es-module/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/module/es-module/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/module/es-module/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/module/es-module/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "包管理器",
                collapsed: true,
                items: [
                  {
                    text: "npm",
                    collapsed: true,
                    link: "/zh/web-advanced/package-manager/npm/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/package-manager/npm/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/package-manager/npm/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/package-manager/npm/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/package-manager/npm/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/package-manager/npm/reference",
                      },
                    ],
                  },
                  {
                    text: "pnpm",
                    collapsed: true,
                    link: "/zh/web-advanced/package-manager/pnpm/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/package-manager/pnpm/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/package-manager/pnpm/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/package-manager/pnpm/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/package-manager/pnpm/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/package-manager/pnpm/reference",
                      },
                    ],
                  },
                  {
                    text: "yarn",
                    collapsed: true,
                    link: "/zh/web-advanced/package-manager/yarn/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/package-manager/yarn/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/package-manager/yarn/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/package-manager/yarn/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/package-manager/yarn/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/package-manager/yarn/reference",
                      },
                    ],
                  },
                  {
                    text: "bun",
                    collapsed: true,
                    link: "/zh/web-advanced/package-manager/bun/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/package-manager/bun/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/package-manager/bun/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/package-manager/bun/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/package-manager/bun/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/package-manager/bun/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "JS扩展库",
                collapsed: true,
                items: [
                  {
                    text: "Lodash-es",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/lodash-es/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/lodash-es/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/lodash-es/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/lodash-es/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/lodash-es/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/lodash-es/reference",
                      },
                    ],
                  },
                  {
                    text: "es-toolkit",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/es-toolkit/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/es-toolkit/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/es-toolkit/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/es-toolkit/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/es-toolkit/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/es-toolkit/reference",
                      },
                    ],
                  },
                  {
                    text: "Day.js",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/dayjs/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/dayjs/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/dayjs/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/dayjs/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/dayjs/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/dayjs/reference",
                      },
                    ],
                  },
                  {
                    text: "date-fns",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/date-fns/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/date-fns/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/date-fns/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/date-fns/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/date-fns/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/date-fns/reference",
                      },
                    ],
                  },
                  {
                    text: "Luxon",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/luxon/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/luxon/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/luxon/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/luxon/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/luxon/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/luxon/reference",
                      },
                    ],
                  },
                  {
                    text: "axios",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/axios/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/axios/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/axios/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/axios/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/axios/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/axios/reference",
                      },
                    ],
                  },
                  {
                    text: "ky",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/ky/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/ky/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/ky/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/ky/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/ky/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/ky/reference",
                      },
                    ],
                  },
                  {
                    text: "ofetch",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/ofetch/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/ofetch/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/ofetch/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/ofetch/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/ofetch/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/ofetch/reference",
                      },
                    ],
                  },
                  {
                    text: "Zod",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/zod/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/zod/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/zod/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/zod/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/zod/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/zod/reference",
                      },
                    ],
                  },
                  {
                    text: "Valibot",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/valibot/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/valibot/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/valibot/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/valibot/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/valibot/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/valibot/reference",
                      },
                    ],
                  },
                  {
                    text: "Immer",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/immer/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/immer/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/immer/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/immer/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/immer/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/immer/reference",
                      },
                    ],
                  },
                  {
                    text: "RxJS",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/rxjs/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/rxjs/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/rxjs/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/rxjs/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/rxjs/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/rxjs/reference",
                      },
                    ],
                  },
                  {
                    text: "nanoid",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/nanoid/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/nanoid/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/nanoid/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/nanoid/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/nanoid/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/nanoid/reference",
                      },
                    ],
                  },
                  {
                    text: "type-fest",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/type-fest/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/type-fest/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/type-fest/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/type-fest/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/type-fest/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/type-fest/reference",
                      },
                    ],
                  },
                  {
                    text: "ts-pattern",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/ts-pattern/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/ts-pattern/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/ts-pattern/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/ts-pattern/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/ts-pattern/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/ts-pattern/reference",
                      },
                    ],
                  },
                  {
                    text: "DOMPurify",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/dompurify/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/dompurify/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/dompurify/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/dompurify/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/dompurify/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/dompurify/reference",
                      },
                    ],
                  },
                  {
                    text: "decimal.js",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/decimal-js/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/decimal-js/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/decimal-js/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/decimal-js/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/decimal-js/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/decimal-js/reference",
                      },
                    ],
                  },
                  {
                    text: "PapaParse",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/papaparse/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/papaparse/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/papaparse/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/papaparse/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/papaparse/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/papaparse/reference",
                      },
                    ],
                  },
                  {
                    text: "Fuse.js",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/fuse-js/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/fuse-js/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/fuse-js/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/fuse-js/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/fuse-js/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/fuse-js/reference",
                      },
                    ],
                  },
                  {
                    text: "前端实用小库",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/utility-libs/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/utility-libs/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/utility-libs/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/utility-libs/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/utility-libs/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/utility-libs/reference",
                      },
                    ],
                  },
                  {
                    text: "crypto-js",
                    collapsed: true,
                    link: "/zh/web-advanced/js-extension/crypto-js/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/web-advanced/js-extension/crypto-js/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/web-advanced/js-extension/crypto-js/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/web-advanced/js-extension/crypto-js/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/web-advanced/js-extension/crypto-js/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/web-advanced/js-extension/crypto-js/reference",
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            text: "前端框架",
            collapsed: false,
            items: [
              {
                text: "UI框架",
                collapsed: true,
                items: [
                  {
                    text: "React",
                    collapsed: true,
                    link: "/zh/frontend-framework/ui/react/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ui/react/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/ui/react/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/ui/react/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/ui/react/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-framework/ui/react/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ui/react/reference",
                      },
                    ],
                  },
                  {
                    text: "Vue",
                    collapsed: true,
                    link: "/zh/frontend-framework/ui/vue/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ui/vue/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/ui/vue/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/ui/vue/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/ui/vue/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-framework/ui/vue/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ui/vue/reference",
                      },
                    ],
                  },
                  {
                    text: "Angular",
                    collapsed: true,
                    link: "/zh/frontend-framework/ui/angular/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ui/angular/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/ui/angular/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/ui/angular/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/ui/angular/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-framework/ui/angular/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ui/angular/reference",
                      },
                    ],
                  },
                  {
                    text: "Svelte",
                    collapsed: true,
                    link: "/zh/frontend-framework/ui/svelte/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ui/svelte/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/ui/svelte/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/ui/svelte/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/ui/svelte/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-framework/ui/svelte/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ui/svelte/reference",
                      },
                    ],
                  },
                  {
                    text: "Solid",
                    collapsed: true,
                    link: "/zh/frontend-framework/ui/solid/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ui/solid/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ui/solid/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ui/solid/reference",
                      },
                    ],
                  },
                  {
                    text: "Lit",
                    collapsed: true,
                    link: "/zh/frontend-framework/ui/lit/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ui/lit/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ui/lit/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ui/lit/reference",
                      },
                    ],
                  },
                  {
                    text: "Alpine.js",
                    collapsed: true,
                    link: "/zh/frontend-framework/ui/alpine-js/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ui/alpine-js/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ui/alpine-js/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ui/alpine-js/reference",
                      },
                    ],
                  },
                  {
                    text: "HTMX",
                    collapsed: true,
                    link: "/zh/frontend-framework/ui/htmx/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ui/htmx/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ui/htmx/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ui/htmx/reference",
                      },
                    ],
                  },
                  {
                    text: "Preact",
                    collapsed: true,
                    link: "/zh/frontend-framework/ui/preact/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ui/preact/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ui/preact/guide-line",
                      },
                    ],
                  },
                ],
              },
              {
                text: "元框架",
                collapsed: true,
                items: [
                  {
                    text: "Next.js",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/next-js/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/next-js/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/meta/next-js/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/meta/next-js/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/meta/next-js/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-framework/meta/next-js/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/meta/next-js/reference",
                      },
                    ],
                  },
                  {
                    text: "Nuxt",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/nuxt/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/nuxt/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/meta/nuxt/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/meta/nuxt/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/meta/nuxt/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-framework/meta/nuxt/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/meta/nuxt/reference",
                      },
                    ],
                  },
                  {
                    text: "Astro",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/astro/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/astro/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/meta/astro/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/meta/astro/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/meta/astro/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-framework/meta/astro/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/meta/astro/reference",
                      },
                    ],
                  },
                  {
                    text: "Qwik",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/qwik/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/qwik/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/meta/qwik/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/meta/qwik/reference",
                      },
                    ],
                  },
                  {
                    text: "React Router",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/react-router/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/react-router/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/meta/react-router/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/meta/react-router/reference",
                      },
                    ],
                  },
                  {
                    text: "SolidStart",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/solid-start/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/solid-start/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/meta/solid-start/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/meta/solid-start/reference",
                      },
                    ],
                  },
                  {
                    text: "SvelteKit",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/svelte-kit/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/svelte-kit/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/meta/svelte-kit/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/meta/svelte-kit/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/meta/svelte-kit/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-framework/meta/svelte-kit/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/meta/svelte-kit/reference",
                      },
                    ],
                  },
                  {
                    text: "TanStack Start",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/tanstack-start/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/tanstack-start/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/meta/tanstack-start/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/meta/tanstack-start/reference",
                      },
                    ],
                  },
                  {
                    text: "Analog",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/analog/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/analog/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/meta/analog/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/meta/analog/reference",
                      },
                    ],
                  },
                  {
                    text: "Remix",
                    collapsed: true,
                    link: "/zh/frontend-framework/meta/remix/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/meta/remix/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/meta/remix/guide-line",
                      },
                    ],
                  },
                ],
              },
              {
                text: "静态网站框架",
                collapsed: true,
                items: [
                  {
                    text: "Docusaurus",
                    collapsed: true,
                    link: "/zh/frontend-framework/ssg/docusaurus/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ssg/docusaurus/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ssg/docusaurus/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ssg/docusaurus/reference",
                      },
                    ],
                  },
                  {
                    text: "VitePress",
                    collapsed: true,
                    link: "/zh/frontend-framework/ssg/vite-press/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ssg/vite-press/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/ssg/vite-press/guideline-base.md",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/ssg/vite-press/guideline-advance.md",
                          },
                          { text: "其他" },
                        ],
                      },
                      { text: "API" },
                    ],
                  },
                  {
                    text: "Slidev",
                    collapsed: true,
                    link: "/zh/frontend-framework/ssg/slidev/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ssg/slidev/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/ssg/slidev/guide-line/base.md",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-framework/ssg/slidev/guide-line/advance.md",
                          },
                          {
                            text: "内置",
                            link: "/zh/frontend-framework/ssg/slidev/guide-line/built-in.md",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-framework/ssg/slidev/guide-line/other.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ssg/slidev/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Hexo",
                    collapsed: true,
                    link: "/zh/frontend-framework/ssg/hexo/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ssg/hexo/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ssg/hexo/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ssg/hexo/reference",
                      },
                    ],
                  },
                  {
                    text: "Eleventy",
                    collapsed: true,
                    link: "/zh/frontend-framework/ssg/eleventy/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ssg/eleventy/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ssg/eleventy/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ssg/eleventy/reference",
                      },
                    ],
                  },
                  {
                    text: "Nextra",
                    collapsed: true,
                    link: "/zh/frontend-framework/ssg/nextra/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ssg/nextra/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ssg/nextra/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ssg/nextra/reference",
                      },
                    ],
                  },
                  {
                    text: "Starlight",
                    collapsed: true,
                    link: "/zh/frontend-framework/ssg/starlight/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ssg/starlight/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/ssg/starlight/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/ssg/starlight/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "组件库",
                collapsed: true,
                items: [
                  {
                    text: "Element Plus",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/element-plus/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/element-plus/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/element-plus/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/element-plus/reference",
                      },
                    ],
                  },
                  {
                    text: "Vuetify",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/vuetify/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/vuetify/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/vuetify/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/vuetify/reference",
                      },
                    ],
                  },
                  {
                    text: "Vant UI",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/vant-ui/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/vant-ui/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/vant-ui/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/vant-ui/reference",
                      },
                    ],
                  },
                  {
                    text: "Naive UI",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/naive-ui/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/naive-ui/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/naive-ui/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/naive-ui/reference",
                      },
                    ],
                  },
                  {
                    text: "PrimeVue",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/prime-vue/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/prime-vue/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/prime-vue/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/prime-vue/reference",
                      },
                    ],
                  },
                  {
                    text: "Arco Design Vue",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/arco-design-vue/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/arco-design-vue/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/arco-design-vue/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/arco-design-vue/reference",
                      },
                    ],
                  },
                  {
                    text: "Ant Design",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/ant-design/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/ant-design/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/ant-design/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/ant-design/reference",
                      },
                    ],
                  },
                  {
                    text: "Angular Material",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/angular-material/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/angular-material/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/angular-material/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/angular-material/reference",
                      },
                    ],
                  },
                  {
                    text: "NG-ZORRO",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/ng-zorro/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/ng-zorro/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/ng-zorro/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/ng-zorro/reference",
                      },
                    ],
                  },
                  {
                    text: "PrimeNG",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/prime-ng/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/prime-ng/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/prime-ng/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/prime-ng/reference",
                      },
                    ],
                  },
                  {
                    text: "MUI",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/mui/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/mui/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/mui/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/mui/reference",
                      },
                    ],
                  },
                  {
                    text: "Mantine",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/mantine/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/mantine/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/mantine/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/mantine/reference",
                      },
                    ],
                  },
                  {
                    text: "Chakra UI",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/chakra-ui/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/chakra-ui/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/chakra-ui/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/chakra-ui/reference",
                      },
                    ],
                  },
                  {
                    text: "Nuxt UI",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/nuxt-ui/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/nuxt-ui/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/nuxt-ui/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/nuxt-ui/reference",
                      },
                    ],
                  },
                  {
                    text: "Radix UI",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/radix-ui/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/radix-ui/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/radix-ui/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/radix-ui/reference",
                      },
                    ],
                  },
                  {
                    text: "Headless UI",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/headless-ui/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/headless-ui/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/headless-ui/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/headless-ui/reference",
                      },
                    ],
                  },
                  {
                    text: "shadcn/ui",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/shadcn/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/components/shadcn/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/components/shadcn/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/components/shadcn/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "状态库",
                collapsed: true,
                items: [
                  {
                    text: "Pinia",
                    collapsed: true,
                    link: "/zh/frontend-framework/state/pinia/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/state/pinia/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/state/pinia/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/state/pinia/reference",
                      },
                    ],
                  },
                  {
                    text: "Zustand",
                    collapsed: true,
                    link: "/zh/frontend-framework/state/zustand/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/state/zustand/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/state/zustand/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/state/zustand/reference",
                      },
                    ],
                  },
                  {
                    text: "Jotai",
                    collapsed: true,
                    link: "/zh/frontend-framework/state/jotai/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/state/jotai/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/state/jotai/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/state/jotai/reference",
                      },
                    ],
                  },
                  {
                    text: "Redux",
                    collapsed: true,
                    link: "/zh/frontend-framework/state/redux/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/state/redux/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/state/redux/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/state/redux/reference",
                      },
                    ],
                  },
                  {
                    text: "MobX",
                    collapsed: true,
                    link: "/zh/frontend-framework/state/mobx/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/state/mobx/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/state/mobx/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/state/mobx/reference",
                      },
                    ],
                  },
                  {
                    text: "NgRx",
                    collapsed: true,
                    link: "/zh/frontend-framework/state/ng-rx/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/state/ng-rx/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/state/ng-rx/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/state/ng-rx/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "路由库",
                collapsed: true,
                items: [
                  {
                    text: "Vue Router",
                    collapsed: true,
                    link: "/zh/frontend-framework/router/vue-router/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/router/vue-router/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/router/vue-router/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/router/vue-router/reference",
                      },
                    ],
                  },
                  {
                    text: "TanStack Router",
                    collapsed: true,
                    link: "/zh/frontend-framework/router/tanstack-router/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/router/tanstack-router/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/router/tanstack-router/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/router/tanstack-router/reference",
                      },
                    ],
                  },
                  {
                    text: "React Navigation",
                    collapsed: true,
                    link: "/zh/frontend-framework/router/react-navigation/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/router/react-navigation/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/router/react-navigation/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/router/react-navigation/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "组合式函数库",
                collapsed: true,
                items: [
                  {
                    text: "VueUse",
                    collapsed: true,
                    link: "/zh/frontend-framework/composables/vueuse/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/composables/vueuse/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/composables/vueuse/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/composables/vueuse/reference",
                      },
                    ],
                  },
                  {
                    text: "VueHooks Plus",
                    collapsed: true,
                    link: "/zh/frontend-framework/composables/vue-hooks-plus/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/composables/vue-hooks-plus/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/composables/vue-hooks-plus/guide-line",
                      },
                    ],
                  },
                  {
                    text: "Ahooks",
                    collapsed: true,
                    link: "/zh/frontend-framework/composables/ahooks/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/composables/ahooks/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/composables/ahooks/guide-line",
                      },
                    ],
                  },
                  {
                    text: "React Use",
                    collapsed: true,
                    link: "/zh/frontend-framework/composables/react-use/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/composables/react-use/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/composables/react-use/guide-line",
                      },
                    ],
                  },
                  {
                    text: "usehooks-ts",
                    collapsed: true,
                    link: "/zh/frontend-framework/composables/usehooks-ts/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/composables/usehooks-ts/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/composables/usehooks-ts/guide-line",
                      },
                    ],
                  },
                ],
              },
              {
                text: "文档处理",
                collapsed: true,
                items: [
                  {
                    text: "SheetJS",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/sheetjs/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/sheetjs/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/sheetjs/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/sheetjs/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/sheetjs/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/sheetjs/reference",
                      },
                    ],
                  },
                  {
                    text: "ExcelJS",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/exceljs/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/exceljs/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/exceljs/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/exceljs/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/exceljs/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/exceljs/reference",
                      },
                    ],
                  },
                  {
                    text: "docx",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/docx/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/docx/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/docx/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/docx/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/docx/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/docx/reference",
                      },
                    ],
                  },
                  {
                    text: "mammoth",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/mammoth/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/mammoth/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/mammoth/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/mammoth/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/mammoth/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/mammoth/reference",
                      },
                    ],
                  },
                  {
                    text: "docxtemplater",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/docxtemplater/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/docxtemplater/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/docxtemplater/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/docxtemplater/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/docxtemplater/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/docxtemplater/reference",
                      },
                    ],
                  },
                  {
                    text: "docx-editor",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/docx-editor/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/docx-editor/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/docx-editor/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/docx-editor/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/docx-editor/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/docx-editor/reference",
                      },
                    ],
                  },
                  {
                    text: "PDF.js",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/pdfjs/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/pdfjs/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/pdfjs/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/pdfjs/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/pdfjs/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/pdfjs/reference",
                      },
                    ],
                  },
                  {
                    text: "jsPDF",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/jspdf/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/jspdf/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/jspdf/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/jspdf/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/jspdf/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/jspdf/reference",
                      },
                    ],
                  },
                  {
                    text: "pdf-lib",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/pdf-lib/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/pdf-lib/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/pdf-lib/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/pdf-lib/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/pdf-lib/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/pdf-lib/reference",
                      },
                    ],
                  },
                  {
                    text: "pptxgenjs",
                    collapsed: true,
                    link: "/zh/frontend-framework/document/pptxgenjs/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/document/pptxgenjs/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/document/pptxgenjs/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/document/pptxgenjs/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/document/pptxgenjs/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/document/pptxgenjs/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "其他",
                collapsed: true,
                items: [
                  {
                    text: "Iconify",
                    collapsed: true,
                    link: "/zh/frontend-framework/others/iconify/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/others/iconify/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/others/iconify/guide-line",
                      },
                    ],
                  },
                  {
                    text: "Shiki",
                    collapsed: true,
                    link: "/zh/frontend-framework/others/shiki/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/others/shiki/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/others/shiki/guide-line",
                      },
                    ],
                  },
                  {
                    text: "Markdown-it",
                    collapsed: true,
                    link: "/zh/frontend-framework/others/markdown-it/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/others/markdown-it/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/others/markdown-it/guide-line",
                      },
                    ],
                  },
                  {
                    text: "TanStack Query",
                    collapsed: true,
                    link: "/zh/frontend-framework/others/tanstack-query/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/others/tanstack-query/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/others/tanstack-query/guide-line",
                      },
                    ],
                  },
                  {
                    text: "Vee-validate",
                    collapsed: true,
                    link: "/zh/frontend-framework/others/vee-validate/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/others/vee-validate/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/others/vee-validate/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/others/vee-validate/reference",
                      },
                    ],
                  },
                  {
                    text: "Vue I18n",
                    collapsed: true,
                    link: "/zh/frontend-framework/others/vue-i18n/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/others/vue-i18n/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/frontend-framework/others/vue-i18n/guide-line",
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/others/vue-i18n/reference",
                      },
                    ],
                  },
                  {
                    text: "i18next",
                    collapsed: true,
                    link: "/zh/frontend-framework/others/i18next/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/others/i18next/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-framework/others/i18next/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-framework/others/i18next/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-framework/others/i18next/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-framework/others/i18next/reference",
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            text: "前端基础工具链",
            collapsed: false,
            items: [
              {
                text: "构建工具",
                collapsed: true,
                items: [
                  {
                    text: "Vite",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/build/vite/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/build/vite/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/build/vite/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/build/vite/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-toolchain/build/vite/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-toolchain/build/vite/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/build/vite/reference",
                      },
                    ],
                  },
                  {
                    text: "Webpack",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/build/webpack/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/build/webpack/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/build/webpack/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/build/webpack/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/frontend-toolchain/build/webpack/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-toolchain/build/webpack/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/build/webpack/reference",
                      },
                    ],
                  },
                  {
                    text: "Turbopack",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/build/turbopack/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/build/turbopack/getting-started",
                      },
                    ],
                  },
                  {
                    text: "Parcel",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/build/parcel/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/build/parcel/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/build/parcel/guide-line/base",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    text: "Rsbuild",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/build/rsbuild/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/build/rsbuild/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/build/rsbuild/guide-line/base",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                text: "编译器",
                collapsed: true,
                items: [
                  {
                    text: "Babel",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/compiler/babel/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/compiler/babel/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/compiler/babel/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/compiler/babel/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/compiler/babel/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/compiler/babel/reference",
                      },
                    ],
                  },
                  {
                    text: "SWC",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/compiler/swc/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/compiler/swc/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/compiler/swc/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/compiler/swc/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/compiler/swc/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/compiler/swc/reference",
                      },
                    ],
                  },
                  {
                    text: "tsc",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/compiler/tsc/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/compiler/tsc/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/compiler/tsc/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/compiler/tsc/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/compiler/tsc/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/compiler/tsc/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "打包工具",
                collapsed: true,
                items: [
                  {
                    text: "esbuild",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/bundler/esbuild/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/bundler/esbuild/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/bundler/esbuild/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/bundler/esbuild/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/bundler/esbuild/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/bundler/esbuild/reference",
                      },
                    ],
                  },
                  {
                    text: "Rollup",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/bundler/rollup/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/bundler/rollup/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/bundler/rollup/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/bundler/rollup/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/bundler/rollup/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/bundler/rollup/reference",
                      },
                    ],
                  },
                  {
                    text: "Rolldown",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/bundler/rolldown/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/bundler/rolldown/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/bundler/rolldown/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/bundler/rolldown/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/bundler/rolldown/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/bundler/rolldown/reference",
                      },
                    ],
                  },
                  {
                    text: "Rspack",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/bundler/rspack/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/bundler/rspack/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/bundler/rspack/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/bundler/rspack/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/bundler/rspack/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/bundler/rspack/reference",
                      },
                    ],
                  },
                  {
                    text: "tsup",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/bundler/tsup/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/bundler/tsup/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/bundler/tsup/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/bundler/tsup/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/bundler/tsup/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/bundler/tsup/reference",
                      },
                    ],
                  },
                  {
                    text: "tsdown",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/bundler/tsdown/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/bundler/tsdown/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/bundler/tsdown/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/bundler/tsdown/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/bundler/tsdown/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/bundler/tsdown/reference",
                      },
                    ],
                  },
                  {
                    text: "unbuild",
                    collapsed: true,
                    link: "/zh/frontend-toolchain/bundler/unbuild/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-toolchain/bundler/unbuild/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-toolchain/bundler/unbuild/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-toolchain/bundler/unbuild/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-toolchain/bundler/unbuild/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-toolchain/bundler/unbuild/reference",
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            text: "前端开发工具",
            collapsed: false,
            items: [
              {
                text: "IDE",
                collapsed: true,
                items: [
                  {
                    text: "VSCode",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/vscode/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/vscode/getting-started.md",
                      },
                      {
                        text: "AI 与 Agent",
                        link: "/zh/frontend-develop-tools/ide/vscode/guideline-ai.md",
                      },
                    ],
                  },
                  {
                    text: "Cursor",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/cursor/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/cursor/getting-started.md",
                      },
                      {
                        text: "规则与上下文",
                        link: "/zh/frontend-develop-tools/ide/cursor/guideline-rules.md",
                      },
                    ],
                  },
                  {
                    text: "WebStorm",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/webstorm/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/webstorm/getting-started.md",
                      },
                      {
                        text: "AI 与 Junie",
                        link: "/zh/frontend-develop-tools/ide/webstorm/guideline-ai.md",
                      },
                    ],
                  },
                  {
                    text: "Windsurf",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/windsurf/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/windsurf/getting-started.md",
                      },
                      {
                        text: "规则与工作流",
                        link: "/zh/frontend-develop-tools/ide/windsurf/guideline-rules.md",
                      },
                    ],
                  },
                  {
                    text: "Trae",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/trae/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/trae/getting-started.md",
                      },
                      {
                        text: "规则与 Agent",
                        link: "/zh/frontend-develop-tools/ide/trae/guideline-rules.md",
                      },
                    ],
                  },
                  {
                    text: "Zed",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/zed/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/zed/getting-started.md",
                      },
                      {
                        text: "AI 与 Agent",
                        link: "/zh/frontend-develop-tools/ide/zed/guideline-ai.md",
                      },
                    ],
                  },
                  {
                    text: "Antigravity",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/antigravity/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/antigravity/getting-started.md",
                      },
                    ],
                  },
                  {
                    text: "Kiro",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/kiro/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/kiro/getting-started.md",
                      },
                      {
                        text: "规格与引导",
                        link: "/zh/frontend-develop-tools/ide/kiro/guideline-spec.md",
                      },
                    ],
                  },
                  {
                    text: "Vim/Neovim",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/vim-neovim/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/vim-neovim/getting-started.md",
                      },
                      {
                        text: "Neovim 进阶",
                        link: "/zh/frontend-develop-tools/ide/vim-neovim/guideline-neovim.md",
                      },
                    ],
                  },
                  {
                    text: "Sublime Text",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/ide/sublime-text/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/ide/sublime-text/getting-started.md",
                      },
                      {
                        text: "配置与构建",
                        link: "/zh/frontend-develop-tools/ide/sublime-text/guideline-config.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "版本控制",
                collapsed: true,
                items: [
                  {
                    text: "Git",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/version-control/git/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/version-control/git/getting-started.md",
                      },
                      {
                        text: "分支与合并",
                        link: "/zh/frontend-develop-tools/version-control/git/guideline-branching.md",
                      },
                      {
                        text: "Git 工具",
                        link: "/zh/frontend-develop-tools/version-control/git/guideline-tools.md",
                      },
                      {
                        text: "内部原理",
                        link: "/zh/frontend-develop-tools/version-control/git/guideline-internals.md",
                      },
                    ],
                  },
                  {
                    text: "GitHub Desktop",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/version-control/github-desktop/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/version-control/github-desktop/getting-started.md",
                      },
                    ],
                  },
                  {
                    text: "Sourcetree",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/version-control/sourcetree/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/version-control/sourcetree/getting-started.md",
                      },
                    ],
                  },
                  {
                    text: "GitKraken",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/version-control/gitkraken/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/version-control/gitkraken/getting-started.md",
                      },
                    ],
                  },
                  {
                    text: "Fork",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/version-control/fork/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/version-control/fork/getting-started.md",
                      },
                    ],
                  },
                  {
                    text: "lazygit",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/version-control/lazygit/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/version-control/lazygit/getting-started.md",
                      },
                    ],
                  },
                  {
                    text: "Jujutsu",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/version-control/jujutsu/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/version-control/jujutsu/getting-started.md",
                      },
                    ],
                  },
                  {
                    text: "Sapling",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/version-control/sapling/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/version-control/sapling/getting-started.md",
                      },
                      {
                        text: "栈式开发与撤销",
                        link: "/zh/frontend-develop-tools/version-control/sapling/guideline-stacks-and-undo.md",
                      },
                      {
                        text: "Git 与 GitHub 集成",
                        link: "/zh/frontend-develop-tools/version-control/sapling/guideline-git-github.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "静态分析工具",
                collapsed: true,
                items: [
                  {
                    text: "ESLint",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/eslint/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/eslint/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-develop-tools/static-analysis/eslint/guide-line/base.md",
                          },
                          {
                            text: "配置文件",
                            link: "/zh/frontend-develop-tools/static-analysis/eslint/guide-line/configurations.md",
                          },
                          {
                            text: "插件",
                            link: "/zh/frontend-develop-tools/static-analysis/eslint/guide-line/plugins.md",
                          },
                          {
                            text: "升级",
                            link: "/zh/frontend-develop-tools/static-analysis/eslint/guide-line/migration.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/eslint/reference.md",
                      },
                    ],
                  },
                  {
                    text: "oxlint",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/oxlint/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/oxlint/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/static-analysis/oxlint/guide-line/configuration.md",
                          },
                          {
                            text: "从 ESLint 迁移",
                            link: "/zh/frontend-develop-tools/static-analysis/oxlint/guide-line/migration.md",
                          },
                          {
                            text: "类型感知与插件",
                            link: "/zh/frontend-develop-tools/static-analysis/oxlint/guide-line/type-aware-and-plugins.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/oxlint/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Biome",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/biome/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/biome/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/static-analysis/biome/guide-line/configuration.md",
                          },
                          {
                            text: "lint 与 format",
                            link: "/zh/frontend-develop-tools/static-analysis/biome/guide-line/lint-and-format.md",
                          },
                          {
                            text: "从 ESLint / Prettier 迁移",
                            link: "/zh/frontend-develop-tools/static-analysis/biome/guide-line/migration.md",
                          },
                          {
                            text: "类型感知与 Assist",
                            link: "/zh/frontend-develop-tools/static-analysis/biome/guide-line/type-aware-and-assist.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/biome/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Prettier",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/prettier/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/prettier/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-develop-tools/static-analysis/prettier/guideline-base.md",
                          },
                          {
                            text: "高级",
                            collapsed: true,
                            items: [
                              {
                                text: "配置",
                                link: "/zh/frontend-develop-tools/static-analysis/prettier/guideline-adadvance/configurations.md",
                              },
                              {
                                text: "集成",
                                link: "/zh/frontend-develop-tools/static-analysis/prettier/guideline-adadvance/integration.md",
                              },
                            ],
                          },
                          {
                            text: "其他",
                            link: "/zh/frontend-develop-tools/static-analysis/prettier/guideline-others.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/prettier/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Stylelint",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/stylelint/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/stylelint/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/static-analysis/stylelint/guide-line/configuration.md",
                          },
                          {
                            text: "规则、共享配置与插件",
                            link: "/zh/frontend-develop-tools/static-analysis/stylelint/guide-line/rules-and-plugins.md",
                          },
                          {
                            text: "忽略与禁用",
                            link: "/zh/frontend-develop-tools/static-analysis/stylelint/guide-line/ignore-and-disable.md",
                          },
                          {
                            text: "集成与生态",
                            link: "/zh/frontend-develop-tools/static-analysis/stylelint/guide-line/integration.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/stylelint/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Knip",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/knip/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/knip/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/static-analysis/knip/guide-line/configuration.md",
                          },
                          {
                            text: "插件机制",
                            link: "/zh/frontend-develop-tools/static-analysis/knip/guide-line/plugins.md",
                          },
                          {
                            text: "用法与自动修复",
                            link: "/zh/frontend-develop-tools/static-analysis/knip/guide-line/usage-and-fixing.md",
                          },
                          {
                            text: "Monorepo 与报告器",
                            link: "/zh/frontend-develop-tools/static-analysis/knip/guide-line/monorepo.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/knip/reference.md",
                      },
                    ],
                  },
                  {
                    text: "commitlint",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/commitlint/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/commitlint/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/static-analysis/commitlint/guide-line/configuration.md",
                          },
                          {
                            text: "规则",
                            link: "/zh/frontend-develop-tools/static-analysis/commitlint/guide-line/rules.md",
                          },
                          {
                            text: "约定与交互式提交",
                            link: "/zh/frontend-develop-tools/static-analysis/commitlint/guide-line/conventions-and-prompt.md",
                          },
                          {
                            text: "集成 husky 与 CI",
                            link: "/zh/frontend-develop-tools/static-analysis/commitlint/guide-line/integration-husky.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/commitlint/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Secretlint",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/secretlint/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/secretlint/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/static-analysis/secretlint/guide-line/configuration.md",
                          },
                          {
                            text: "规则与预设",
                            link: "/zh/frontend-develop-tools/static-analysis/secretlint/guide-line/rules-and-presets.md",
                          },
                          {
                            text: "集成 pre-commit 与 CI",
                            link: "/zh/frontend-develop-tools/static-analysis/secretlint/guide-line/integration.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/secretlint/reference.md",
                      },
                    ],
                  },
                  {
                    text: "publint",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/publint/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/publint/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "CLI 与编程式 API",
                            link: "/zh/frontend-develop-tools/static-analysis/publint/guide-line/usage.md",
                          },
                          {
                            text: "检查项详解",
                            link: "/zh/frontend-develop-tools/static-analysis/publint/guide-line/checks-explained.md",
                          },
                          {
                            text: "搭配 are-the-types-wrong",
                            link: "/zh/frontend-develop-tools/static-analysis/publint/guide-line/with-arethetypeswrong.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/publint/reference.md",
                      },
                    ],
                  },
                  {
                    text: "EditorConfig",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/static-analysis/editorconfig/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/static-analysis/editorconfig/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "属性详解",
                            link: "/zh/frontend-develop-tools/static-analysis/editorconfig/guide-line/properties.md",
                          },
                          {
                            text: "编辑器支持",
                            link: "/zh/frontend-develop-tools/static-analysis/editorconfig/guide-line/editor-support.md",
                          },
                          {
                            text: "搭配格式化器",
                            link: "/zh/frontend-develop-tools/static-analysis/editorconfig/guide-line/with-formatters.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/static-analysis/editorconfig/reference.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "在线编辑器",
                collapsed: true,
                items: [
                  {
                    text: "StackBlitz",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/online-editor/stackblitz/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/online-editor/stackblitz/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "WebContainers",
                            link: "/zh/frontend-develop-tools/online-editor/stackblitz/guide-line/webcontainers.md",
                          },
                          {
                            text: "嵌入与 SDK",
                            link: "/zh/frontend-develop-tools/online-editor/stackblitz/guide-line/embed-sdk.md",
                          },
                          {
                            text: "GitHub 与套餐",
                            link: "/zh/frontend-develop-tools/online-editor/stackblitz/guide-line/github-and-pricing.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/online-editor/stackblitz/reference.md",
                      },
                    ],
                  },
                  {
                    text: "CodeSandbox",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/online-editor/codesandbox/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/online-editor/codesandbox/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "VM 与浏览器沙箱",
                            link: "/zh/frontend-develop-tools/online-editor/codesandbox/guide-line/vm-vs-browser-sandboxes.md",
                          },
                          {
                            text: "SDK 与 Sandpack",
                            link: "/zh/frontend-develop-tools/online-editor/codesandbox/guide-line/sdk-and-sandpack.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/online-editor/codesandbox/reference.md",
                      },
                    ],
                  },
                  {
                    text: "CodePen",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/online-editor/codepen/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/online-editor/codepen/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "编辑器与预处理器",
                            link: "/zh/frontend-develop-tools/online-editor/codepen/guide-line/editor-and-processors.md",
                          },
                          {
                            text: "嵌入与 CodePen 2.0",
                            link: "/zh/frontend-develop-tools/online-editor/codepen/guide-line/embed-and-codepen2.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/online-editor/codepen/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Expo Snack",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/online-editor/expo-snack/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/online-editor/expo-snack/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "预览机制与依赖限制",
                            link: "/zh/frontend-develop-tools/online-editor/expo-snack/guide-line/preview-and-dependencies.md",
                          },
                          {
                            text: "嵌入与边界",
                            link: "/zh/frontend-develop-tools/online-editor/expo-snack/guide-line/embed-and-boundaries.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/online-editor/expo-snack/reference.md",
                      },
                    ],
                  },
                  {
                    text: "框架官方 Playground",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/online-editor/framework-playground/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/online-editor/framework-playground/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "TypeScript Playground",
                            link: "/zh/frontend-develop-tools/online-editor/framework-playground/guide-line/typescript-playground.md",
                          },
                          {
                            text: "Vue SFC Playground",
                            link: "/zh/frontend-develop-tools/online-editor/framework-playground/guide-line/vue-sfc-playground.md",
                          },
                          {
                            text: "Svelte Playground",
                            link: "/zh/frontend-develop-tools/online-editor/framework-playground/guide-line/svelte-playground.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/online-editor/framework-playground/reference.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "文档生成器",
                collapsed: true,
                items: [
                  {
                    text: "JSDoc",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/documentation-generator/jsdoc/",
                    items: [
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "标签详解",
                            link: "/zh/frontend-develop-tools/documentation-generator/jsdoc/guide-line/tags.md",
                          },
                          {
                            text: "类型表达式",
                            link: "/zh/frontend-develop-tools/documentation-generator/jsdoc/guide-line/types.md",
                          },
                          {
                            text: "类与模块",
                            link: "/zh/frontend-develop-tools/documentation-generator/jsdoc/guide-line/classes-modules.md",
                          },
                          {
                            text: "配合 TypeScript",
                            link: "/zh/frontend-develop-tools/documentation-generator/jsdoc/guide-line/typescript.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/documentation-generator/jsdoc/reference.md",
                      },
                    ],
                  },
                  {
                    text: "TypeDoc",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/documentation-generator/typedoc/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/documentation-generator/typedoc/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "注释与标签",
                            link: "/zh/frontend-develop-tools/documentation-generator/typedoc/guide-line/comments-tags.md",
                          },
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/documentation-generator/typedoc/guide-line/configuration.md",
                          },
                          {
                            text: "主题与插件",
                            link: "/zh/frontend-develop-tools/documentation-generator/typedoc/guide-line/themes-plugins.md",
                          },
                          {
                            text: "文档站",
                            link: "/zh/frontend-develop-tools/documentation-generator/typedoc/guide-line/docs-site.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/documentation-generator/typedoc/reference.md",
                      },
                    ],
                  },
                  {
                    text: "TSDoc",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/documentation-generator/tsdoc/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/documentation-generator/tsdoc/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "标签三类",
                            link: "/zh/frontend-develop-tools/documentation-generator/tsdoc/guide-line/tag-kinds.md",
                          },
                          {
                            text: "标准化分组",
                            link: "/zh/frontend-develop-tools/documentation-generator/tsdoc/guide-line/standardization.md",
                          },
                          {
                            text: "常用标签",
                            link: "/zh/frontend-develop-tools/documentation-generator/tsdoc/guide-line/common-tags.md",
                          },
                          {
                            text: "配置与生态",
                            link: "/zh/frontend-develop-tools/documentation-generator/tsdoc/guide-line/config-ecosystem.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/documentation-generator/tsdoc/reference.md",
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            text: "前端测试",
            collapsed: false,
            items: [
              {
                text: "单元测试",
                collapsed: true,
                items: [
                  { text: "Jest" },
                  { text: "Vitest" },
                  { text: "VueTestUtils" },
                  { text: "Axios Mock Adapter" },
                  { text: "MSW" },
                  { text: "Testing Library" },
                  { text: "Vue Router Mock" },
                ],
              },
              {
                text: "端到端测试",
                collapsed: true,
                items: [{ text: "Cypress" }, { text: "Playwright" }],
              },
              {
                text: "其他工具",
                collapsed: true,
                items: [{ text: "Mailtrap" }],
              },
            ],
          },

          {
            text: "前端优化",
            collapsed: false,
            items: [
              {
                text: "浏览器工具",
                collapsed: true,
                items: [
                  { text: "Chrome DevTools" },
                  { text: "Firefox Developer Tools" },
                  { text: "React DevTools" },
                  { text: "Vue DevTools" },
                ],
              },
              {
                text: "性能优化",
                collapsed: true,
                items: [
                  { text: "异步组件" },
                  { text: "按需引入" },
                  { text: "虚拟化" },
                  { text: "事件及属性优化" },
                  {
                    text: "性能评估",
                    items: [
                      { text: "Lighthouse" },
                      { text: "Webpack Bundle Analyzer" },
                      { text: "rollup-plugin-visualizer" },
                    ],
                  },
                ],
              },
              {
                text: "代码优化",
                collapsed: true,
                items: [{ text: "代码分割" }, { text: "Tree Shaking" }],
              },
              {
                text: "网络优化",
                collapsed: true,
                items: [{ text: "CDN" }, { text: "缓存" }, { text: "压缩" }],
              },
              {
                text: "用户体验优化",
                collapsed: true,
                items: [
                  { text: "懒加载和预加载" },
                  { text: "交互优化" },
                  { text: "可访问性" },
                ],
              },
              { text: "搜索引擎优化" },
            ],
          },

          {
            text: "前端架构设计",
            collapsed: false,
            items: [
              {
                text: "设计模式",
                collapsed: true,
                items: [
                  {
                    text: "架构模式",
                    collapsed: true,
                    items: [{ text: "MVC" }, { text: "MVVM" }],
                  },
                  {
                    text: "创建型",
                    collapsed: true,
                    items: [
                      { text: "工厂方法" },
                      { text: "抽象工厂" },
                      { text: "单例模式 " },
                      { text: "建造者模式 " },
                      { text: "原型模式 " },
                    ],
                  },
                  {
                    text: "结构型",
                    collapsed: true,
                    items: [
                      { text: "适配器模式" },
                      { text: "桥接模式" },
                      { text: "组合模式" },
                      { text: "装饰模式" },
                      { text: "外观模式" },
                      { text: "享元模式" },
                      { text: "代理模式" },
                    ],
                  },
                  {
                    text: "行为型",
                    collapsed: true,
                    items: [
                      { text: "生产者模式" },
                      { text: "责任链模式" },
                      { text: "命令模式" },
                      { text: "解释器模式" },
                      { text: "迭代器模式" },
                      { text: "中介者模式" },
                      { text: "备忘录模式 " },
                      { text: "观察者模式" },
                      { text: "状态模式" },
                      { text: "策略模式" },
                      { text: "模板方法" },
                      { text: "访问者模式" },
                    ],
                  },
                ],
              },
              {
                text: "组件设计",
                collapsed: true,
                items: [
                  {
                    text: "组件分类",
                    collapsed: true,
                    items: [
                      { text: "基础" },
                      { text: "容器" },
                      { text: "导航" },
                      { text: "表单" },
                      { text: "数据展示" },
                      { text: "反馈" },
                      { text: "其他" },
                    ],
                  },
                  { text: "设计原则" },
                  {
                    text: "文档类工具",
                    collapsed: true,
                    items: [{ text: "Storybook" }, { text: "Styleguidist" }],
                  },
                ],
              },
              {
                text: "微前端框架",
                collapsed: true,
                items: [{ text: "qiankun" }, { text: "single spa" }],
              },
            ],
          },

          {
            text: "移动/桌面开发",
            collapsed: false,
            items: [
              {
                text: "移动端框架",
                collapsed: true,
                items: [
                  { text: "React Native" },
                  { text: "Flutter" },
                  { text: "微信小程序" },
                  { text: "Uniapp" },
                  { text: "Ionic" },
                ],
              },
              {
                text: "桌面端框架",
                collapsed: true,
                items: [{ text: "Electron" }, { text: "Tauri" }],
              },
            ],
          },

          {
            text: "前端可视化",
            collapsed: false,
            items: [
              {
                text: "图表",
                collapsed: true,
                items: [
                  { text: "ECharts" },
                  { text: "D3.js" },
                  { text: "Chart.js" },
                  { text: "Recharts" },
                  { text: "leaflet" },
                  { text: "Mermaid" },
                  { text: "KaTeX" },
                ],
              },
              {
                text: "三维",
                collapsed: true,
                items: [
                  { text: "WebGL" },
                  {
                    text: "Three.js",
                    collapsed: true,
                    link: "/zh/frontend-visualization/three/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-visualization/three/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/frontend-visualization/three/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/frontend-visualization/three/guide-line/advanced",
                          },
                          {
                            text: "专家",
                            link: "/zh/frontend-visualization/three/guide-line/expert",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-visualization/three/reference",
                      },
                    ],
                  },
                  { text: "Babylon" },
                  { text: "CesiumJS" },
                  { text: "ArcGIS API for JavaScript" },
                ],
              },
              {
                text: "动画",
                collapsed: true,
                items: [
                  { text: "Lottie" },
                  { text: "Popmotion" },
                  { text: "Framer Motion" },
                  { text: "GSAP" },
                  { text: "Anime.js" },
                  { text: "Animate.css" },
                ],
              },
              {
                text: "拖拽",
                collapsed: true,
                items: [
                  { text: "Grid Layout Plus" },
                  { text: "Vue Draggable Plus" },
                  { text: "React DnD" },
                  { text: "Interact.js" },
                  { text: "Sortable.js" },
                  { text: "Draggable.js" },
                  { text: "Hammer.js" },
                  { text: "@use-gesture" },
                ],
              },
            ],
          },

          {
            text: "工程化与自动化",
            collapsed: false,
            items: [
              {
                text: "DevOps",
                collapsed: true,
                items: [
                  {
                    text: "GitHub Actions",
                    collapsed: true,
                    link: "/zh/engineering/devops/github-actions/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/devops/github-actions/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/engineering/devops/github-actions/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/engineering/devops/github-actions/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/engineering/devops/github-actions/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/engineering/devops/github-actions/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/devops/github-actions/reference",
                      },
                    ],
                  },
                  {
                    text: "GitLab CI/CD",
                    collapsed: true,
                    link: "/zh/engineering/devops/gitlab-cicd/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/devops/gitlab-cicd/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "基础",
                            link: "/zh/engineering/devops/gitlab-cicd/guide-line/base",
                          },
                          {
                            text: "进阶",
                            link: "/zh/engineering/devops/gitlab-cicd/guide-line/advanced",
                          },
                          {
                            text: "高级",
                            link: "/zh/engineering/devops/gitlab-cicd/guide-line/expert",
                          },
                          {
                            text: "其他",
                            link: "/zh/engineering/devops/gitlab-cicd/guide-line/other",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/devops/gitlab-cicd/reference",
                      },
                    ],
                  },
                  {
                    text: "Jenkins",
                    collapsed: true,
                    link: "/zh/engineering/devops/jenkins/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/devops/jenkins/getting-started",
                      },
                      {
                        text: "指南",
                        link: "/zh/engineering/devops/jenkins/guide-line",
                      },
                    ],
                  },
                  {
                    text: "Husky",
                    collapsed: true,
                    link: "/zh/engineering/devops/husky/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/devops/husky/getting-started.md",
                      },
                      {
                        text: "指南",
                        link: "/zh/engineering/devops/husky/guide-line.md",
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/devops/husky/reference",
                      },
                    ],
                  },
                  {
                    text: "lint-staged",
                    collapsed: true,
                    link: "/zh/engineering/devops/lint-staged/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/devops/lint-staged/getting-started.md",
                      },
                      {
                        text: "指南",
                        link: "/zh/engineering/devops/lint-staged/guide-line.md",
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/devops/lint-staged/reference.md",
                      },
                    ],
                  },
                ],
              },
              { text: "容器", collapsed: true, items: [{ text: "Docker" }] },
              {
                text: "Monorepo",
                collapsed: true,
                items: [
                  { text: "Lerna" },
                  {
                    text: "Turborepo",
                    collapsed: true,
                    link: "/zh/engineering/monorepo/turborepo/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/monorepo/turborepo/getting-started.md",
                      },
                      {
                        text: "指南",
                        link: "/zh/engineering/monorepo/turborepo/guide-line.md",
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/monorepo/turborepo/reference",
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            text: "安全",
            collapsed: false,
            items: [
              {
                text: "攻击方式",
                collapsed: true,
                items: [
                  { text: "XSS" },
                  { text: "CSRF" },
                  { text: "SQL 注入" },
                  { text: "SSRF" },
                  { text: "DDoS" },
                  { text: "MITM" },
                ],
              },
              {
                text: "加密",
                collapsed: true,
                items: [
                  { text: "对称加密和非对称加密" },
                  { text: "公钥基础设施" },
                  { text: "Crypto.js" },
                  { text: "Web Crypto API" },
                ],
              },
              {
                text: "认证与授权",
                collapsed: true,
                items: [
                  { text: "OAuth 2.0" },
                  { text: "JWT" },
                  { text: "SAML" },
                  { text: "哈希算法" },
                ],
              },
              {
                text: "安全框架",
                collapsed: true,
                items: [
                  { text: "OWASP" },
                  { text: "Helmet.js" },
                  { text: "CORS" },
                  { text: "HTTP安全头" },
                ],
              },
              {
                text: "漏洞扫描",
                collapsed: true,
                items: [
                  { text: "ZAP" },
                  { text: "Burp Suite" },
                  { text: "Nessus" },
                  { text: "Nmap" },
                ],
              },
            ],
          },

          {
            text: "软技能",
            collapsed: false,
            items: [
              {
                text: "软件工程",
                collapsed: true,
                items: [{ text: "敏捷开发" }, { text: "Scrum" }],
              },
              {
                text: "开源分享",
                collapsed: true,
                items: [
                  {
                    text: "技术社区",
                    collapsed: true,
                    items: [
                      { text: "Medium" },
                      { text: "dev.to" },
                      { text: "stackoverflow" },
                      { text: "掘金" },
                      { text: "简书" },
                    ],
                  },
                  {
                    text: "代码仓库",
                    collapsed: true,
                    items: [
                      { text: "Github" },
                      { text: "GitLab" },
                      { text: "Gitee" },
                    ],
                  },
                ],
              },
              {
                text: "团队协作",
                collapsed: true,
                items: [
                  {
                    text: "团队协作工具",
                    collapsed: true,
                    items: [
                      { text: "Jira" },
                      { text: "Trello" },
                      { text: "BitBucket" },
                    ],
                  },
                  {
                    text: "远程协作工具",
                    collapsed: true,
                    items: [{ text: "Slack" }, { text: "Discord" }],
                  },
                  { text: "沟通技巧" },
                  { text: "技术写作" },
                ],
              },
            ],
          },

          {
            text: "云服务",
            collapsed: false,
            items: [
              {
                text: "静态网站托管",
                collapsed: true,
                items: [
                  { text: "Netlify" },
                  { text: "Vercel" },
                  { text: "Cloudflare Pages" },
                  { text: "AWS Amplify" },
                  { text: "Render" },
                ],
              },
              {
                text: "通用云服务",
                collapsed: true,
                items: [
                  { text: "阿里云" },
                  { text: "Firebase" },
                  { text: "Azure" },
                  { text: "Netlify" },
                  { text: "Vercel" },
                  { text: "Cloudflare" },
                  { text: "AWS" },
                ],
              },
            ],
          },

          {
            text: "后端框架",
            collapsed: false,
            items: [
              {
                text: "基础框架",
                collapsed: true,
                items: [{ text: "Node.js" }, { text: "Deno" }, { text: "Bun" }],
              },
              {
                text: "应用框架",
                collapsed: true,
                items: [
                  { text: "Express" },
                  { text: "Fastify" },
                  { text: "Hono" },
                ],
              },
              {
                text: "ORM框架",
                collapsed: true,
                items: [{ text: "TypeORM" }, { text: "Prisma" }],
              },
            ],
          },

          {
            text: "服务器基础知识",
            collapsed: false,
            items: [
              {
                text: "基础工具",
                collapsed: true,
                items: [
                  {
                    text: "Shells",
                    collapsed: true,
                    items: [
                      { text: "Bash" },
                      { text: "Zsh" },
                      { text: "powerShell" },
                    ],
                  },
                  {
                    text: "基础命令",
                    collapsed: true,
                    items: [
                      { text: "文件系统" },
                      { text: "进程管理" },
                      { text: "文本编辑器" },
                      { text: "网络工具" },
                      { text: "系统管理工具" },
                    ],
                  },
                  {
                    text: "SSH 工具",
                    items: [{ text: "OpenSSH" }, { text: "OpenSSL" }],
                  },
                ],
              },
              {
                text: "Web服务器",
                collapsed: true,
                items: [{ text: "Caddy" }, { text: "Nginx" }],
              },
            ],
          },

          {
            text: "进阶语言",
            collapsed: false,
            items: [
              {
                text: "系统编程语言",
                collapsed: true,
                items: [{ text: "Rust" }],
              },
              {
                text: "通用编程语言",
                collapsed: true,
                items: [
                  { text: "Python" },
                  { text: "Java" },
                  { text: "Kotlin" },
                  { text: "Swift" },
                  { text: "Dart" },
                ],
              },
              {
                text: "并发编程语言",
                collapsed: true,
                items: [{ text: "Golang" }],
              },
              {
                text: "数据科学和数值计算",
                collapsed: true,
                items: [{ text: "MATLAB" }, { text: "R" }],
              },
            ],
          },

          {
            text: "数据存储",
            collapsed: false,
            items: [
              {
                text: "关系型数据库",
                collapsed: true,
                items: [
                  { text: "MySQL" },
                  { text: "PostgreSQL" },
                  { text: "SQLite" },
                ],
              },
              {
                text: "非关系型数据库",
                collapsed: true,
                items: [
                  { text: "Redis" },
                  { text: "MongoDB" },
                  { text: "Neo4j" },
                  { text: "InfluxDB" },
                  { text: "TimescaleDB" },
                ],
              },
              {
                text: "分布式大数据存储与查询",
                collapsed: true,
                items: [
                  { text: "Cassandra" },
                  { text: "HDFS" },
                  { text: "Elasticsearch" },
                ],
              },
              {
                text: "数据库客户端",
                collapsed: true,
                items: [{ text: "Navicat" }],
              },
            ],
          },

          {
            text: "基础设施与数据流",
            collapsed: false,
            items: [
              {
                text: "容器编排",
                collapsed: true,
                items: [
                  { text: "Docker" },
                  { text: "Kubernetes" },
                  { text: "Podman" },
                ],
              },
              {
                text: "数据编排",
                collapsed: true,
                items: [
                  { text: "Apache Airflow" },
                  { text: "Prefect" },
                  { text: "Dagster" },
                ],
              },
              {
                text: "数据处理",
                collapsed: true,
                items: [
                  {
                    text: "消息队列",
                    collapsed: true,
                    items: [
                      { text: "RocketMQ" },
                      { text: "RabbitMQ" },
                      { text: "Kafka" },
                    ],
                  },
                  {
                    text: "流处理",
                    collapsed: true,
                    items: [{ text: "Flink" }],
                  },
                  {
                    text: "批处理",
                    collapsed: true,
                    items: [{ text: "Hadoop" }, { text: "Spark" }],
                  },
                ],
              },
            ],
          },

          {
            text: "微服务架构",
            collapsed: false,
            items: [
              {
                text: "服务框架",
                collapsed: true,
                items: [{ text: "Nest.js" }, { text: "Apollo Server" }],
              },
              {
                text: "服务注册与发现",
                collapsed: true,
                items: [
                  { text: "Consul" },
                  { text: "Etcd" },
                  { text: "Zookeeper" },
                ],
              },
              {
                text: "远程过程调用",
                collapsed: true,
                items: [{ text: "gRPC" }, { text: "TRPC" }],
              },
              {
                text: "容错设计",
                collapsed: true,
                items: [{ text: "circuit-breaker-js" }, { text: "opossum" }],
              },
              {
                text: "分布式追踪",
                collapsed: true,
                items: [{ text: "Jaeger" }, { text: "Zipkin" }],
              },
              {
                text: "日志和监控",
                collapsed: true,
                items: [
                  { text: "ELK Stack" },
                  { text: "Prometheus" },
                  { text: "Grafana" },
                  { text: "Sentry" },
                  { text: "Datadog" },
                ],
              },
            ],
          },

          {
            text: "服务层设计",
            collapsed: false,
            items: [
              {
                text: "路由层",
                collapsed: true,
                items: [
                  { text: "REST API" },
                  { text: "GraphQL API" },
                  {
                    text: "文档和工具",
                    collapsed: true,
                    items: [
                      { text: "Swagger" },
                      { text: "Postman" },
                      { text: "GraphQL Playground" },
                      { text: "JMeter" },
                    ],
                  },
                ],
              },
              {
                text: "数据访问",
                collapsed: true,
                items: [{ text: "ODBC" }],
              },
              {
                text: "数据转换和验证",
                collapsed: true,
                items: [
                  {
                    text: "数据序列化",
                    collapsed: true,
                    items: [{ text: "JSON" }, { text: "XML" }],
                  },
                  { text: "class-validator" },
                  { text: "class-transformer" },
                ],
              },
            ],
          },

          {
            text: "人工智能",
            collapsed: false,
            items: [
              {
                text: "AI 基础",
                collapsed: true,
                items: [
                  {
                    text: "机器学习基础",
                    collapsed: true,
                    items: [
                      {
                        text: "监督学习",
                      },
                      {
                        text: "无监督学习",
                      },
                      {
                        text: "强化学习",
                      },
                      {
                        text: "AutoML",
                      },
                    ],
                  },
                  {
                    text: "深度学习基础",
                    collapsed: true,
                    items: [
                      {
                        text: "神经网络",
                      },
                      {
                        text: "卷积神经网络 (CNN)",
                      },
                      {
                        text: "循环神经网络 (RNN)",
                      },
                      {
                        text: "Transformer",
                      },
                    ],
                  },
                ],
              },
              {
                text: "AI 框架与库",
                collapsed: true,
                items: [
                  {
                    text: "通用机器学习框架",
                    collapsed: true,
                    items: [
                      {
                        text: "TensorFlow",
                      },
                      {
                        text: "PyTorch",
                      },
                      {
                        text: "scikit-learn",
                      },
                    ],
                  },
                  {
                    text: "自然语言处理 (NLP)",
                    collapsed: true,
                    items: [
                      {
                        text: "Hugging Face Transformers",
                      },
                      { text: "spaCy" },
                    ],
                  },
                  {
                    text: "计算机视觉",
                    collapsed: true,
                    items: [{ text: "OpenCV" }, { text: "YOLO" }],
                  },
                ],
              },
              {
                text: "大语言模型与生成式 AI",
                collapsed: true,
                items: [
                  {
                    text: "模型",
                    collapsed: true,
                    items: [
                      {
                        text: "GPT",
                        collapsed: true,
                        link: "/zh/large-language-model/models/gpt/",
                        items: [
                          {
                            text: "入门",
                            link: "/zh/large-language-model/models/gpt/getting-started",
                          },
                          {
                            text: "指南",
                            link: "/zh/large-language-model/models/gpt/guide-line",
                          },
                          {
                            text: "参考",
                            link: "/zh/large-language-model/models/gpt/reference",
                          },
                        ],
                      },
                      {
                        text: "Gemini",
                        collapsed: true,
                        link: "/zh/large-language-model/models/gemini/",
                        items: [
                          {
                            text: "入门",
                            link: "/zh/large-language-model/models/gemini/getting-started",
                          },
                          {
                            text: "指南",
                            link: "/zh/large-language-model/models/gemini/guide-line",
                          },
                          {
                            text: "参考",
                            link: "/zh/large-language-model/models/gemini/reference",
                          },
                        ],
                      },
                      {
                        text: "Claude",
                        collapsed: true,
                        link: "/zh/large-language-model/models/claude/",
                        items: [
                          {
                            text: "入门",
                            link: "/zh/large-language-model/models/claude/getting-started",
                          },
                          {
                            text: "指南",
                            link: "/zh/large-language-model/models/claude/guide-line",
                          },
                          {
                            text: "参考",
                            link: "/zh/large-language-model/models/claude/reference",
                          },
                        ],
                      },
                      { text: "Grok" },
                      { text: "GLM" },
                      { text: "DeepSeek" },
                      { text: "Qwen" },
                      { text: "MiniMax" },
                    ],
                  },
                  {
                    text: "工具",
                    collapsed: true,
                    items: [
                      {
                        text: "Agent",
                        collapsed: true,
                        items: [
                          {
                            text: "Pi",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/agent/pi/",
                            items: [
                              {
                                text: "入门",
                                link: "/zh/large-language-model/tools/agent/pi/getting-started",
                              },
                              {
                                text: "指南",
                                link: "/zh/large-language-model/tools/agent/pi/guide-line",
                              },
                              {
                                text: "参考",
                                link: "/zh/large-language-model/tools/agent/pi/reference",
                              },
                            ],
                          },
                          {
                            text: "Claude Code",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/agent/claude-code/",
                            items: [
                              {
                                text: "入门",
                                link: "/zh/large-language-model/tools/agent/claude-code/getting-started",
                              },
                              {
                                text: "指南",
                                link: "/zh/large-language-model/tools/agent/claude-code/guide-line",
                              },
                              {
                                text: "参考",
                                link: "/zh/large-language-model/tools/agent/claude-code/reference",
                              },
                            ],
                          },
                          {
                            text: "Codex",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/agent/codex/",
                            items: [
                              {
                                text: "入门",
                                link: "/zh/large-language-model/tools/agent/codex/getting-started",
                              },
                              {
                                text: "指南",
                                link: "/zh/large-language-model/tools/agent/codex/guide-line",
                              },
                              {
                                text: "参考",
                                link: "/zh/large-language-model/tools/agent/codex/reference",
                              },
                            ],
                          },
                          {
                            text: "Gemini CLI",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/agent/gemini-cli/",
                            items: [
                              {
                                text: "入门",
                                link: "/zh/large-language-model/tools/agent/gemini-cli/getting-started",
                              },
                              {
                                text: "指南",
                                link: "/zh/large-language-model/tools/agent/gemini-cli/guide-line",
                              },
                              {
                                text: "参考",
                                link: "/zh/large-language-model/tools/agent/gemini-cli/reference",
                              },
                            ],
                          },
                          {
                            text: "OpenCode",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/agent/opencode/",
                            items: [
                              {
                                text: "入门",
                                link: "/zh/large-language-model/tools/agent/opencode/getting-started",
                              },
                              {
                                text: "指南",
                                link: "/zh/large-language-model/tools/agent/opencode/guide-line",
                              },
                              {
                                text: "参考",
                                link: "/zh/large-language-model/tools/agent/opencode/reference",
                              },
                            ],
                          },
                        ],
                      },
                      {
                        text: "AI 应用生成器",
                        collapsed: true,
                        items: [
                          {
                            text: "bolt.new",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/app-builder/bolt-new/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/tools/app-builder/bolt-new/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/tools/app-builder/bolt-new/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/tools/app-builder/bolt-new/reference" },
                            ],
                          },
                          {
                            text: "v0",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/app-builder/v0/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/tools/app-builder/v0/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/tools/app-builder/v0/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/tools/app-builder/v0/reference" },
                            ],
                          },
                          {
                            text: "Lovable",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/app-builder/lovable/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/tools/app-builder/lovable/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/tools/app-builder/lovable/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/tools/app-builder/lovable/reference" },
                            ],
                          },
                          {
                            text: "Replit Agent",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/app-builder/replit-agent/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/tools/app-builder/replit-agent/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/tools/app-builder/replit-agent/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/tools/app-builder/replit-agent/reference" },
                            ],
                          },
                        ],
                      },
                      {
                        text: "编排工具",
                        collapsed: true,
                        items: [{ text: "Dify" }],
                      },
                      {
                        text: "其他",
                        collapsed: true,
                        items: [
                          { text: "RAG" },
                          { text: "LangChain" },
                          {
                            text: "OpenRouter",
                            collapsed: true,
                            link: "/zh/large-language-model/tools/other/open-router/",
                            items: [
                              {
                                text: "入门",
                                link: "/zh/large-language-model/tools/other/open-router/getting-started",
                              },
                              {
                                text: "指南",
                                link: "/zh/large-language-model/tools/other/open-router/guide-line",
                              },
                              {
                                text: "参考",
                                link: "/zh/large-language-model/tools/other/open-router/reference",
                              },
                            ],
                          },
                          { text: "NotebookLM" },
                        ],
                      },
                    ],
                  },
                  {
                    text: "提示词工程",
                    collapsed: true,
                    items: [{ text: "基础提示设计" }, { text: "高级提示技巧" }],
                  },
                  {
                    text: "MCP",
                    collapsed: true,
                    items: [
                      { text: "Brave Search" },
                      { text: "GitHub MCP" },
                      { text: "Context7 MCP" },
                      { text: "Playwright MCP" },
                      { text: "Chrome DevTools MCP" },
                      { text: "Figma MCP" },
                      { text: "Blender MCP" },
                      { text: "Notion MCP" },
                      { text: "Sentry MCP" },
                      { text: "Supabase MCP" },
                    ],
                  },
                  {
                    text: "Skills",
                    collapsed: true,
                    items: [
                      {
                        text: "Superpowers",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/superpowers/",
                        items: [
                          {
                            text: "入门",
                            link: "/zh/large-language-model/skills/superpowers/getting-started",
                          },
                          {
                            text: "指南",
                            link: "/zh/large-language-model/skills/superpowers/guide-line",
                          },
                          {
                            text: "参考",
                            link: "/zh/large-language-model/skills/superpowers/reference",
                          },
                        ],
                      },
                      {
                        text: "Everything Claude Code",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/everything-claude-code/",
                        items: [
                          {
                            text: "入门",
                            link: "/zh/large-language-model/skills/everything-claude-code/getting-started",
                          },
                          {
                            text: "指南",
                            link: "/zh/large-language-model/skills/everything-claude-code/guide-line",
                          },
                          {
                            text: "参考",
                            link: "/zh/large-language-model/skills/everything-claude-code/reference",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    text: "AI 辅助开发工具",
                    collapsed: true,
                    items: [{ text: "react-doctor" }],
                  },
                  {
                    text: "AI 设计",
                    collapsed: true,
                    items: [{ text: "Stitch" }, { text: "Claude Design" }],
                  },
                ],
              },
              {
                text: "AI 开发工具与平台",
                collapsed: true,
                items: [
                  {
                    text: "模型训练与部署",
                    collapsed: true,
                    items: [
                      {
                        text: "Jupyter Notebook",
                      },
                      { text: "Google Colab" },
                      {
                        text: "SageMaker (AWS)",
                      },
                      { text: "MLflow" },
                    ],
                  },
                  {
                    text: "模型推理与服务化",
                    collapsed: true,
                    items: [
                      {
                        text: "FastAPI + AI 模型",
                      },
                      { text: "Gradio" },
                    ],
                  },
                ],
              },
              {
                text: "AI 在全栈中的应用",
                collapsed: true,
                items: [
                  {
                    text: "前端智能",
                    collapsed: true,
                    items: [
                      {
                        text: "智能表单验证",
                      },
                      {
                        text: "实时图像处理",
                      },
                      {
                        text: "语音识别",
                      },
                    ],
                  },
                  {
                    text: "后端智能",
                    collapsed: true,
                    items: [
                      {
                        text: "推荐系统",
                      },
                      {
                        text: "聊天机器人",
                      },
                      {
                        text: "日志异常检测",
                      },
                    ],
                  },
                  {
                    text: "自动化与优化",
                    collapsed: true,
                    items: [
                      {
                        text: "代码生成 (Copilot-like)",
                      },
                      {
                        text: "测试用例生成",
                      },
                      {
                        text: "性能预测",
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            text: "数据结构和算法",
            collapsed: false,
            items: [
              {
                text: "数据结构",
                collapsed: true,
                items: [
                  {
                    text: "基本数据结构",
                    collapsed: true,
                    items: [
                      { text: "数组" },
                      { text: "链表" },
                      { text: "栈" },
                      { text: "队列" },
                      { text: "哈希表" },
                    ],
                  },
                  {
                    text: "高级数据结构",
                    collapsed: true,
                    items: [
                      { text: "树" },
                      { text: "堆" },
                      { text: "图" },
                      { text: "前缀树" },
                    ],
                  },
                ],
              },
              {
                text: "基本算法",
                collapsed: true,
                items: [
                  {
                    text: "排序",
                    collapsed: true,
                    items: [
                      { text: "冒泡" },
                      { text: "选择" },
                      { text: "插入" },
                      { text: "快速" },
                      { text: "归并" },
                      { text: "堆" },
                    ],
                  },
                  {
                    text: "搜索",
                    collapsed: true,
                    items: [
                      { text: "线性" },
                      { text: "二分" },
                      { text: "深度优先" },
                      { text: "广度优先" },
                    ],
                  },
                  {
                    text: "数学",
                    collapsed: true,
                    items: [{ text: "最大公约数" }, { text: "最小公倍数" }],
                  },
                  {
                    text: "位运算",
                    collapsed: true,
                    items: [
                      { text: "基本位运算" },
                      { text: "位运算技巧和应用" },
                    ],
                  },
                ],
              },
              {
                text: "高级算法",
                collapsed: true,
                items: [
                  { text: "动态规划" },
                  { text: "贪心算法" },
                  { text: "分治算法" },
                  { text: "回溯算法" },
                  {
                    text: "图算法",
                    collapsed: true,
                    items: [
                      { text: "最短路径算法" },
                      { text: "最小生成树算法" },
                      { text: "拓扑排序" },
                    ],
                  },
                ],
              },
              {
                text: "实际应用",
                collapsed: true,
                items: [
                  {
                    text: "在线练习",
                    collapsed: true,
                    items: [
                      { text: "LeetCode" },
                      { text: "HackerRank" },
                      { text: "CodeSignal" },
                    ],
                  },
                  {
                    text: "比赛",
                    collapsed: true,
                    items: [{ text: "ACM" }],
                  },
                  {
                    text: "算法可视化工具",
                    collapsed: true,
                    items: [{ text: "VisuAlgo" }],
                  },
                ],
              },
            ],
          },

          {
            text: "操作系统基础",
            collapsed: false,
            items: [
              {
                text: "概述",
                collapsed: true,
                items: [{ text: "基本概念" }, { text: "结构" }],
              },
              {
                text: "核心组件",
                collapsed: true,
                items: [
                  { text: "进程管理" },
                  { text: "内存管理" },
                  { text: "文件系统" },
                  { text: "输入输出管理" },
                  { text: "存储管理" },
                ],
              },
              {
                text: "高级主题",
                collapsed: true,
                items: [
                  { text: "并发与同步" },
                  { text: "安全与保护" },
                  { text: "容器化基础" },
                ],
              },
              {
                text: "常见操作系统",
                collapsed: true,
                items: [
                  { text: "UNIX/Linux" },
                  { text: "Windows" },
                  { text: "macOS" },
                ],
              },
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
