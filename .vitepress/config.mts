import { defineConfig } from "vitepress";
import { fileURLToPath, URL } from "node:url";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "illegalCreed",
  description: "A Roadmap of Dev",
  srcDir: "./src",
  cleanUrls: true,

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
                            text: "FTP工具",
                            link: "/zh/base/network/protocol/tools/ftp/",
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
                  { text: "MathML" },
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
                link: "/zh/frontend-framework/ui/",
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
                link: "/zh/frontend-framework/meta/",
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
                collapsed: false,
                link: "/zh/frontend-framework/ssg/",
                items: [
                  { text: "Docusaurus" },
                  {
                    text: "VitePress",
                    collapsed: false,
                    link: "/zh/frontend-framework/ssg/vite-press/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/ssg/vite-press/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: false,
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
                  { text: "Astro" },
                  { text: "Docz" },
                ],
              },
              {
                text: "组件库",
                link: "/zh/frontend-framework/components/",
                collapsed: false,
                items: [
                  { text: "Element Plus" },
                  { text: "Vuetify" },
                  { text: "Vant UI" },
                  { text: "Ant Design" },
                  { text: "Nuxt UI" },
                  { text: "MUI" },
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
              {
                text: "其他",
                collapsed: false,
                link: "/zh/frontend-framework/others",
                items: [
                  { text: "Slidev" },
                  { text: "Viteshot" },
                  { text: "Iconify" },
                  { text: "Shiki" },
                  { text: "Whyframe" },
                  { text: "Markdown-it" },
                  {
                    text: "Vee-validate",
                    collapsed: false,
                    link: "/zh/frontend-framework/others/vee-validate/",
                    items: [
                      { text: "入门" },
                      { text: "指南" },
                      { text: "例子" },
                      { text: "集成" },
                    ],
                  },
                  {
                    text: "Vue-i18n Vue3",
                    collapsed: false,
                    link: "/zh/frontend-framework/others/vue-i18n/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-framework/others/vue-i18n/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: false,
                        link: "/zh/frontend-framework/others/vue-i18n/guide-line",
                        items: [
                          { text: "基础" },
                          { text: "高级" },
                          { text: "其他" },
                        ],
                      },
                      { text: "API" },
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
                  { text: "Axios Mock Adapter" },
                  { text: "MSW" },
                  { text: "Testing Library" },
                  { text: "Vue Router Mock" },
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
                  { text: "Mailtrap" },
                ],
              },
              {
                text: "其他测试工具",
                collapsed: true,
                items: [{ text: "MSW" }, { text: "Tinylibs" }],
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
                collapsed: false,
                items: [
                  { text: "React Native" },
                  { text: "Flutter" },
                  { text: "微信小程序" },
                  { text: "Uniapp" },
                  { text: "Ionic" },
                  { text: "Cordova" },
                ],
              },
              {
                text: "桌面端框架",
                collapsed: false,
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
                collapsed: false,
                items: [
                  { text: "ECharts" },
                  { text: "D3.js" },
                  { text: "Chart.js" },
                  { text: "Recharts" },
                  { text: "leaflet" },
                ],
              },
              {
                text: "三维",
                collapsed: true,
                items: [
                  { text: "WebGL" },
                  { text: "Three.js" },
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
                collapsed: false,
                items: [
                  { text: "GitHub Actions" },
                  { text: "GitLab CI/CD" },
                  { text: "Jenkins" },
                  {
                    text: "Husky",
                    collapsed: false,
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
                    ],
                  },
                  { 
                    text: "lint-staged",
                    collapsed: false,
                    link: "/zh/engineering/devops/lint-staged/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/devops/lint-staged/getting-started.md",
                      },
                      {
                        text: "进阶",
                        link: "/zh/engineering/devops/lint-staged/advanced.md",
                      },
                    ],
                   },
                ],
              },
              {
                text: "依赖管理器",
                collapsed: false,
                items: [{ text: "Pnpm" }, { text: "Yarn" }, { text: "Bit" }],
              },
              { text: "容器", collapsed: true, items: [{ text: "Docker" }] },
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
                collapsed: false,
                items: [{ text: "敏捷开发" }, { text: "Scrum" }],
              },
              {
                text: "开源分享",
                collapsed: false,
                items: [
                  {
                    text: "技术博客",
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
                    text: "贡献代码",
                    collapsed: false,
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
                      { text: "Bugzilla" },
                    ],
                  },
                  { text: "沟通技巧" },
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
                collapsed: false,
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
                collapsed: false,
                items: [{ text: "Node.js" }, { text: "Deno" }, { text: "Bun" }],
              },
              {
                text: "应用框架",
                collapsed: false,
                items: [
                  { text: "Express" },
                  { text: "Koa" },
                  { text: "Fastify" },
                  { text: "Hono" },
                ],
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
                    collapsed: false,
                    items: [
                      { text: "Bash" },
                      { text: "Zsh" },
                      { text: "powerShell" },
                    ],
                  },
                  { text: "终端复用工具" },
                  {
                    text: "进程管理工具",
                    collapsed: false,
                    items: [{ text: "htop" }, { text: "pm2" }],
                  },
                  {
                    text: "文本编辑器",
                    collapsed: false,
                    items: [{ text: "vim" }, { text: "nano" }],
                  },
                ],
              },
              {
                text: "Web服务器",
                collapsed: false,
                items: [
                  { text: "Apache HTTP Server" },
                  { text: "Nginx" },
                  { text: "Apache Tomcat" },
                  { text: "IIS" },
                ],
              },
            ],
          },

          {
            text: "进阶语言",
            collapsed: false,
            items: [
              {
                text: "系统编程语言",
                collapsed: false,
                items: [{ text: "Rust" }],
              },
              {
                text: "通用编程语言",
                collapsed: false,
                items: [
                  { text: "Python" },
                  { text: "Java" },
                  { text: "Kotlin" },
                  { text: "Swift" },
                  { text: "Drat" },
                ],
              },
              {
                text: "并发编程语言",
                collapsed: false,
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
                collapsed: false,
                items: [
                  { text: "MySQL" },
                  { text: "PostgreSQL" },
                  { text: "SQLite" },
                ],
              },
              {
                text: "非关系型数据库",
                collapsed: false,
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
                  { text: "CouchDB" },
                  { text: "HBase" },
                  { text: "HDFS" },
                  { text: "Hive" },
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
            text: "数据处理",
            collapsed: false,
            items: [
              {
                text: "消息队列",
                collapsed: false,
                items: [
                  { text: "RocketMQ" },
                  { text: "RabbitMQ" },
                  { text: "ActiveMQ" },
                  { text: "Kafka" },
                ],
              },
              {
                text: "流处理",
                collapsed: false,
                items: [{ text: "Flink" }, { text: "Storm" }],
              },
              {
                text: "批处理",
                collapsed: false,
                items: [{ text: "Hadoop" }, { text: "Spark" }],
              },
            ],
          },

          {
            text: "生态系统",
            collapsed: false,
            items: [
              {
                text: "容器编排",
                items: [
                  { text: "Docker" },
                  { text: "Kubernetes" },
                  { text: "Docker Swarm" },
                ],
              },
              {
                text: "数据编排",
                collapsed: true,
                items: [
                  { text: "Apache Airflow" },
                  { text: "Prefect" },
                  { text: "Apache NiFi" },
                  { text: "Apache Oozie" },
                ],
              },
              {
                text: "数据治理",
                collapsed: true,
                items: [
                  { text: "Informatica" },
                  { text: "Collibra" },
                  { text: "Alation" },
                  { text: "Talend" },
                  { text: "Apache Atlas" },
                ],
              },
              {
                text: "数据安全",
                collapsed: true,
                items: [
                  { text: "Apache Ranger" },
                  { text: "Apache Knox" },
                  { text: "Apache Sentry" },
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
                collapsed: false,
                items: [
                  { text: "Spring Boot" },
                  { text: "Spring Cloud" },
                  { text: "Nest.js" },
                  { text: "Apollo Server" },
                  { text: "LoopBack" },
                  { text: "Feathers" },
                  { text: "Gin" },
                ],
              },
              {
                text: "服务注册与发现",
                collapsed: true,
                items: [
                  { text: "Eureka" },
                  { text: "Consul" },
                  { text: "Etcd" },
                  { text: "Zookeeper" },
                ],
              },
              {
                text: "远程过程调用",
                collapsed: true,
                items: [
                  { text: "gRPC" },
                  { text: "Thrift" },
                  { text: "Dubbo" },
                ],
              },
              {
                text: "容错设计",
                collapsed: true,
                items: [{ text: "Hystrix" }, { text: "Resilience4j" }],
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
                collapsed: false,
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
                items: [
                  { text: "ORM 框架" },
                  { text: "JDBC" },
                  { text: "ODBC" },
                ],
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
                    items: [
                      { text: "ACM" },
                      { text: "Google Code Jam" },
                      { text: "Facebook Hacker Cup" },
                    ],
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
                  { text: "分布式系统" },
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
