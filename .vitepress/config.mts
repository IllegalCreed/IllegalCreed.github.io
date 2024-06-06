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

          {
            text: "Web基础知识",
            link: "/zh/base/",
            collapsed: false,
            items: [
              {
                text: "基本语言",
                collapsed: false,
                link: "/zh/base/language/",
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
                text: "计算机网络",
                collapsed: false,
                link: "/zh/base/network/",
                items: [
                  {
                    text: "万维网",
                    collapsed: true,
                    link: "/zh/base/network/www/",
                    items: [
                      {
                        text: "网络设备",
                        link: "/zh/base/network/www/device/",
                      },
                      {
                        text: "OSI 模型",
                        link: "/zh/base/network/www/osi/",
                      },
                      {
                        text: "IP 地址",
                        link: "/zh/base/network/www/ip/",
                      },
                    ],
                  },
                  {
                    text: "移动网络",
                    collapsed: true,
                    link: "/zh/base/network/mobile/",
                    items: [
                      {
                        text: "移动网络架构",
                        link: "/zh/base/network/mobile/framework/",
                      },
                      {
                        text: "移动设备",
                        link: "/zh/base/network/mobile/device/",
                      },
                    ],
                  },
                  {
                    text: "浏览器",
                    collapsed: true,
                    link: "/zh/base/network/browser/",
                  },
                  {
                    text: "网路协议",
                    collapsed: true,
                    link: "/zh/base/network/protocol/",
                    items: [
                      {
                        text: "传输层协议",
                        link: "/zh/base/network/protocol/transport/",
                        items: [
                          {
                            text: "TCP",
                            link: "/zh/base/network/protocol/transport/tcp",
                          },
                          {
                            text: "UDP",
                            link: "/zh/base/network/protocol/transport/udp",
                          },
                        ],
                      },
                      {
                        text: "应用层协议",
                        collapsed: true,
                        link: "/zh/base/network/protocol/application/",
                        items: [
                          {
                            text: "HTTP/HTTPS",
                            link: "/zh/base/network/protocol/application/http",
                          },
                          {
                            text: "FTP",
                            link: "/zh/base/network/protocol/application/ftp",
                          },
                          {
                            text: "SMTP",
                            link: "/zh/base/network/protocol/application/smtp",
                          },
                          {
                            text: "IMAP",
                            link: "/zh/base/network/protocol/application/imap",
                          },
                          {
                            text: "POP3",
                            link: "/zh/base/network/protocol/application/pop3",
                          },
                          {
                            text: "DNS",
                            link: "/zh/base/network/protocol/application/dns",
                          },
                          {
                            text: "DHCP",
                            link: "/zh/base/network/protocol/application/dhcp",
                          },
                          {
                            text: "SSH",
                            link: "/zh/base/network/protocol/application/ssh",
                          },
                        ],
                      },
                      {
                        text: "工具",
                        collapsed: true,
                        link: "/zh/base/network/protocol/tools/",
                        items: [
                          {
                            text: "抓包工具",
                            link: "/zh/base/network/protocol/tools/capture/",
                          },
                          {
                            text: "SSH工具",
                            link: "/zh/base/network/protocol/tools/ssh/",
                          },
                          {
                            text: "邮件库",
                            link: "/zh/base/network/protocol/tools/mail/",
                          },
                        ],
                      },
                    ],
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
                items: [
                  { text: "Markdown" },
                  { text: "TypeScript" },
                  { text: "CSS预处理" },
                ],
              },
              {
                text: "Web API",
                collapsed: true,
                items: [
                  { text: "Web Component" },
                  { text: "Web Assembly" },
                  { text: "WebRTC" },
                ],
              },
              {
                text: "包管理器",
                collapsed: false,
                items: [
                  {
                    text: "系统级",
                    collapsed: true,
                    items: [
                      { text: "Homebrew" },
                      { text: "apt-get" },
                      { text: "yum" },
                      { text: "dnf" },
                      { text: "Chocolatey" },
                    ],
                  },
                  {
                    text: "框架级",
                    collapsed: true,
                    items: [
                      { text: "NPM" },
                      { text: "pip3" },
                      { text: "Cargo" },
                    ],
                  },
                ],
              },
              {
                text: "常见扩展库",
                collapsed: true,
                items: [
                  { text: "Lodash" },
                  { text: "Moment" },
                  { text: "uuid" },
                  { text: "axios" },
                  { text: "i18next" },
                  { text: "crypto.js" },
                ],
              },
            ],
          },

          {
            text: "前端框架",
            collapsed: false,
            link: "/zh/frontend-framework/",
            items: [
              {
                text: "UI框架",
                collapsed: false,
                link: "/zh/frontend-framewor/ui/",
                items: [
                  { text: "React" },
                  { text: "Vue" },
                  { text: "Angular" },
                  { text: "Solid" },
                  { text: "Svelte" },
                  { text: "Preact" },
                ],
              },
              {
                text: "元框架",
                collapsed: false,
                items: [
                  { text: "Next.js" },
                  { text: "Nuxt.js" },
                  { text: "Analog" },
                  { text: "SolidStart" },
                  { text: "SvelteKit" },
                ],
              },
              {
                text: "静态网站框架",
                collapsed: true,
                items: [
                  { text: "Docusaurus" },
                  { text: "VitePress" },
                  { text: "Astro" },
                  { text: "Docz" },
                ],
              },
              {
                text: "组件库",
                collapsed: true,
                items: [
                  { text: "Element Plus" },
                  { text: "Vuetify" },
                  { text: "Vant UI" },
                  { text: "Ant Design" },
                  { text: "MUI" },
                  {
                    text: "其他",
                    collapsed: true,
                    items: [
                      { text: "Slidev" },
                      { text: "Viteshot" },
                      { text: "Grid Layout Plus" },
                      { text: "Vue Draggable Plus" },
                      { text: "Iconify" },
                      { text: "Shiki" },
                      { text: "Whyframe" },
                      { text: "Markdown-it" },
                      { text: "Interact.js" },
                      { text: "Sortable.js" },
                    ],
                  },
                ],
              },
              {
                text: "状态库",
                collapsed: true,
                items: [
                  { text: "Pinia" },
                  { text: "Vuex" },
                  { text: "Zustand" },
                  { text: "mobx" },
                  { text: "Redux" },
                ],
              },
              {
                text: "路由库",
                collapsed: true,
                items: [
                  { text: "Vue Router" },
                  { text: "React Router" },
                  { text: "React Navigation" },
                ],
              },
              {
                text: "复用库",
                collapsed: true,
                items: [
                  { text: "VueUse" },
                  { text: "VueHooks Plus" },
                  { text: "Ahooks" },
                  { text: "React Use" },
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
                collapsed: false,
                items: [{ text: "Vite" }, { text: "Webpack" }],
              },
              {
                text: "编译器",
                collapsed: true,
                items: [{ text: "Babel" }, { text: "SWC" }, { text: "tsc" }],
              },
              {
                text: "打包工具",
                collapsed: true,
                items: [
                  { text: "esBuild" },
                  { text: "rollup" },
                  { text: "rolldown" },
                  { text: "uglifyjs" },
                ],
              },
              {
                text: "开发服务器",
                collapsed: true,
                items: [{ text: "Live Server" }, { text: "BrowserSync" }],
              },
              {
                text: "任务运行器",
                collapsed: true,
                items: [{ text: "Gulp" }, { text: "Grunt" }],
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
                items: [{ text: "VScode" }, { text: "WebStorm" }],
              },
              {
                text: "版本控制",
                collapsed: true,
                items: [{ text: "Git" }, { text: "GitLab" }],
              },
              {
                text: "静态分析工具",
                collapsed: true,
                items: [{ text: "ESLint" }, { text: "Prettier" }],
              },
              {
                text: "在线编辑器",
                collapsed: true,
                items: [
                  { text: "StackBlitz" },
                  { text: "JSFiddle" },
                  { text: "CodePen" },
                  { text: "CodeSandbox" },
                  { text: "Expo" },
                ],
              },
              {
                text: "文档生成器",
                collapsed: true,
                items: [
                  { text: "JSdoc" },
                  { text: "TypeDoc" },
                  { text: "ESDoc" },
                  { text: "SassDoc" },
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
                collapsed: false,
                items: [
                  { text: "Jest" },
                  { text: "Mocha" },
                  { text: "Vitest" },
                  { text: "VueTestUtils" },
                ],
              },
              {
                text: "端到端测试",
                collapsed: true,
                items: [
                  { text: "Cypress" },
                  { text: "Playwright" },
                  { text: "WebdriverIO" },
                  { text: "Puppeteer" },
                ],
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
                collapsed: false,
                items: [
                  {
                    text: "架构模式",
                    collapsed: false,
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
                items: [{ text: "qiankun" }, { text: "single spa" }],
              },
            ],
          },

          {
            text: "移动/桌面开发",
            collapsed: false,
            items: [
              { text: "移动端框架" },
              { text: "桌面端框架" },
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
