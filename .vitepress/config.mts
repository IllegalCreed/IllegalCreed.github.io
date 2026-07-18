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
                    items: [
                      {
                        text: "HTML 文档结构与元数据",
                        collapsed: true,
                        link: "/zh/base/language/html/html-document-metadata/",
                        items: [
                          {
                            text: "入门",
                            link: "/zh/base/language/html/html-document-metadata/getting-started.md",
                          },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              {
                                text: "文档骨架与渲染模式",
                                link: "/zh/base/language/html/html-document-metadata/guide-line/document-skeleton.md",
                              },
                              {
                                text: "字符编码与视口",
                                link: "/zh/base/language/html/html-document-metadata/guide-line/charset-viewport.md",
                              },
                              {
                                text: "标题与 SEO 元数据",
                                link: "/zh/base/language/html/html-document-metadata/guide-line/title-seo-meta.md",
                              },
                              {
                                text: "社交分享元数据",
                                link: "/zh/base/language/html/html-document-metadata/guide-line/social-metadata.md",
                              },
                              {
                                text: "link 关系全谱",
                                link: "/zh/base/language/html/html-document-metadata/guide-line/link-relations.md",
                              },
                              {
                                text: "资源提示",
                                link: "/zh/base/language/html/html-document-metadata/guide-line/resource-hints.md",
                              },
                            ],
                          },
                          {
                            text: "参考",
                            link: "/zh/base/language/html/html-document-metadata/reference.md",
                          },
                        ],
                      },
                      {
                        text: "HTML 语义化与文档大纲",
                        collapsed: true,
                        link: "/zh/base/language/html/html-semantics/",
                        items: [
                          { text: "入门", link: "/zh/base/language/html/html-semantics/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "为什么语义化", link: "/zh/base/language/html/html-semantics/guide-line/why-semantic.md" },
                              { text: "分区元素与页面骨架", link: "/zh/base/language/html/html-semantics/guide-line/sectioning-elements.md" },
                              { text: "article vs section 判定", link: "/zh/base/language/html/html-semantics/guide-line/article-vs-section.md" },
                              { text: "标题层级与文档大纲", link: "/zh/base/language/html/html-semantics/guide-line/headings-outline.md" },
                              { text: "易错语义", link: "/zh/base/language/html/html-semantics/guide-line/niche-semantics.md" },
                              { text: "分组内容", link: "/zh/base/language/html/html-semantics/guide-line/grouping-content.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/html/html-semantics/reference.md" },
                        ],
                      },
                      {
                        text: "HTML 文本内容与超链接",
                        collapsed: true,
                        link: "/zh/base/language/html/html-text-links/",
                        items: [
                          {
                            text: "入门",
                            link: "/zh/base/language/html/html-text-links/getting-started.md",
                          },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              {
                                text: "强调与重要性",
                                link: "/zh/base/language/html/html-text-links/guide-line/emphasis-importance.md",
                              },
                              {
                                text: "行内文本语义全谱",
                                link: "/zh/base/language/html/html-text-links/guide-line/inline-semantics.md",
                              },
                              {
                                text: "超链接机制与 rel 安全",
                                link: "/zh/base/language/html/html-text-links/guide-line/links-and-rel.md",
                              },
                              {
                                text: "列表三型",
                                link: "/zh/base/language/html/html-text-links/guide-line/lists.md",
                              },
                              {
                                text: "国际化与编辑标注",
                                link: "/zh/base/language/html/html-text-links/guide-line/i18n-text.md",
                              },
                              {
                                text: "wbr/br 与空白折叠",
                                link: "/zh/base/language/html/html-text-links/guide-line/wbr-whitespace.md",
                              },
                            ],
                          },
                          {
                            text: "参考",
                            link: "/zh/base/language/html/html-text-links/reference.md",
                          },
                        ],
                      },
                      {
                        text: "HTML 表单与约束校验",
                        collapsed: true,
                        link: "/zh/base/language/html/html-forms/",
                        items: [
                          { text: "入门", link: "/zh/base/language/html/html-forms/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "表单提交机制", link: "/zh/base/language/html/html-forms/guide-line/form-submission.md" },
                              { text: "input 类型全谱", link: "/zh/base/language/html/html-forms/guide-line/input-types.md" },
                              { text: "标签与字段集", link: "/zh/base/language/html/html-forms/guide-line/labels-fieldset.md" },
                              { text: "选择类控件", link: "/zh/base/language/html/html-forms/guide-line/select-controls.md" },
                              { text: "约束校验", link: "/zh/base/language/html/html-forms/guide-line/constraint-validation.md" },
                              { text: "自动填充与移动端", link: "/zh/base/language/html/html-forms/guide-line/autofill-mobile.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/html/html-forms/reference.md" },
                        ],
                      },
                      {
                        text: "HTML 图片与多媒体",
                        collapsed: true,
                        link: "/zh/base/language/html/html-media/",
                        items: [
                          { text: "入门", link: "/zh/base/language/html/html-media/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "img 基础", link: "/zh/base/language/html/html-media/guide-line/img-basics.md" },
                              { text: "响应式图片", link: "/zh/base/language/html/html-media/guide-line/responsive-images.md" },
                              { text: "艺术指导与格式回退", link: "/zh/base/language/html/html-media/guide-line/art-direction.md" },
                              { text: "音视频与字幕", link: "/zh/base/language/html/html-media/guide-line/audio-video.md" },
                              { text: "iframe 嵌入与安全", link: "/zh/base/language/html/html-media/guide-line/iframe-embedding.md" },
                              { text: "图像映射与嵌入", link: "/zh/base/language/html/html-media/guide-line/image-map-embed.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/html/html-media/reference.md" },
                        ],
                      },
                      {
                        text: "HTML 表格",
                        collapsed: true,
                        link: "/zh/base/language/html/html-tables/",
                        items: [
                          { text: "入门", link: "/zh/base/language/html/html-tables/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "表格结构", link: "/zh/base/language/html/html-tables/guide-line/table-structure.md" },
                              { text: "单元格与表头关联", link: "/zh/base/language/html/html-tables/guide-line/cells-scope.md" },
                              { text: "单元格合并", link: "/zh/base/language/html/html-tables/guide-line/colspan-rowspan.md" },
                              { text: "列样式 col/colgroup", link: "/zh/base/language/html/html-tables/guide-line/col-colgroup.md" },
                              { text: "表格可访问性", link: "/zh/base/language/html/html-tables/guide-line/table-a11y.md" },
                              { text: "数据表 vs 布局表", link: "/zh/base/language/html/html-tables/guide-line/data-vs-layout.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/html/html-tables/reference.md" },
                        ],
                      },
                      {
                        text: "HTML 交互元素与全局属性",
                        collapsed: true,
                        link: "/zh/base/language/html/html-interactive-global/",
                        items: [
                          { text: "入门", link: "/zh/base/language/html/html-interactive-global/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "details/summary 折叠", link: "/zh/base/language/html/html-interactive-global/guide-line/details-summary.md" },
                              { text: "dialog 与 inert", link: "/zh/base/language/html/html-interactive-global/guide-line/dialog-inert.md" },
                              { text: "popover 与 command", link: "/zh/base/language/html/html-interactive-global/guide-line/popover-command.md" },
                              { text: "焦点管理", link: "/zh/base/language/html/html-interactive-global/guide-line/focus-management.md" },
                              { text: "全局属性精要", link: "/zh/base/language/html/html-interactive-global/guide-line/global-attributes.md" },
                              { text: "HTML 层可访问性", link: "/zh/base/language/html/html-interactive-global/guide-line/html-a11y.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/html/html-interactive-global/reference.md" },
                        ],
                      },
                    ],
                  },
                  {
                    text: "JavaScript",
                    collapsed: true,
                    items: [
                      {
                        text: "JavaScript 语言基础与类型系统",
                        collapsed: true,
                        link: "/zh/base/language/javascript/js-fundamentals-types/",
                        items: [
                          { text: "入门", link: "/zh/base/language/javascript/js-fundamentals-types/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "变量声明与作用域", link: "/zh/base/language/javascript/js-fundamentals-types/guide-line/variable-declarations.md" },
                              { text: "原始类型与包装对象", link: "/zh/base/language/javascript/js-fundamentals-types/guide-line/primitive-types.md" },
                              { text: "类型转换与相等比较", link: "/zh/base/language/javascript/js-fundamentals-types/guide-line/type-conversion-equality.md" },
                              { text: "运算符全谱", link: "/zh/base/language/javascript/js-fundamentals-types/guide-line/operators.md" },
                              { text: "控制流与循环", link: "/zh/base/language/javascript/js-fundamentals-types/guide-line/control-flow-loops.md" },
                              { text: "严格模式与语言怪癖", link: "/zh/base/language/javascript/js-fundamentals-types/guide-line/strict-mode-quirks.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/javascript/js-fundamentals-types/reference.md" },
                        ],
                      },
                      {
                        text: "JavaScript 函数与作用域",
                        collapsed: true,
                        link: "/zh/base/language/javascript/js-functions-scope/",
                        items: [
                          { text: "入门", link: "/zh/base/language/javascript/js-functions-scope/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "函数形态与参数", link: "/zh/base/language/javascript/js-functions-scope/guide-line/function-forms.md" },
                              { text: "箭头 vs 普通函数", link: "/zh/base/language/javascript/js-functions-scope/guide-line/arrow-vs-regular.md" },
                              { text: "作用域链与闭包", link: "/zh/base/language/javascript/js-functions-scope/guide-line/scope-closures.md" },
                              { text: "this 四规则", link: "/zh/base/language/javascript/js-functions-scope/guide-line/this-rules.md" },
                              { text: "call/apply/bind", link: "/zh/base/language/javascript/js-functions-scope/guide-line/call-apply-bind.md" },
                              { text: "高阶函数", link: "/zh/base/language/javascript/js-functions-scope/guide-line/higher-order-functions.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/javascript/js-functions-scope/reference.md" },
                        ],
                      },
                      {
                        text: "JavaScript 对象与原型继承",
                        collapsed: true,
                        link: "/zh/base/language/javascript/js-objects-prototype/",
                        items: [
                          { text: "入门", link: "/zh/base/language/javascript/js-objects-prototype/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "对象基础", link: "/zh/base/language/javascript/js-objects-prototype/guide-line/object-basics.md" },
                              { text: "属性描述符", link: "/zh/base/language/javascript/js-objects-prototype/guide-line/property-descriptors.md" },
                              { text: "引用与拷贝", link: "/zh/base/language/javascript/js-objects-prototype/guide-line/reference-copy.md" },
                              { text: "原型链", link: "/zh/base/language/javascript/js-objects-prototype/guide-line/prototype-chain.md" },
                              { text: "基于原型的继承", link: "/zh/base/language/javascript/js-objects-prototype/guide-line/prototypal-inheritance.md" },
                              { text: "Object 静态方法", link: "/zh/base/language/javascript/js-objects-prototype/guide-line/object-static-methods.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/javascript/js-objects-prototype/reference.md" },
                        ],
                      },
                      {
                        text: "JavaScript 类与面向对象",
                        collapsed: true,
                        link: "/zh/base/language/javascript/js-classes-oop/",
                        items: [
                          { text: "入门", link: "/zh/base/language/javascript/js-classes-oop/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "类语法与实例化", link: "/zh/base/language/javascript/js-classes-oop/guide-line/class-syntax.md" },
                              { text: "继承与 super", link: "/zh/base/language/javascript/js-classes-oop/guide-line/inheritance-super.md" },
                              { text: "静态成员", link: "/zh/base/language/javascript/js-classes-oop/guide-line/static-members.md" },
                              { text: "私有字段", link: "/zh/base/language/javascript/js-classes-oop/guide-line/private-fields.md" },
                              { text: "访问器与 instanceof", link: "/zh/base/language/javascript/js-classes-oop/guide-line/getters-instanceof.md" },
                              { text: "装饰器现状", link: "/zh/base/language/javascript/js-classes-oop/guide-line/decorators.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/javascript/js-classes-oop/reference.md" },
                        ],
                      },
                      {
                        text: "JavaScript 数组与可迭代协议",
                        collapsed: true,
                        link: "/zh/base/language/javascript/js-arrays-iterables/",
                        items: [
                          { text: "入门", link: "/zh/base/language/javascript/js-arrays-iterables/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "数组基础", link: "/zh/base/language/javascript/js-arrays-iterables/guide-line/array-basics.md" },
                              { text: "变更 vs 不变更", link: "/zh/base/language/javascript/js-arrays-iterables/guide-line/mutating-vs-immutable.md" },
                              { text: "高阶遍历", link: "/zh/base/language/javascript/js-arrays-iterables/guide-line/higher-order-iteration.md" },
                              { text: "解构赋值", link: "/zh/base/language/javascript/js-arrays-iterables/guide-line/destructuring.md" },
                              { text: "扩展与剩余", link: "/zh/base/language/javascript/js-arrays-iterables/guide-line/spread-rest.md" },
                              { text: "可迭代与 Iterator Helpers", link: "/zh/base/language/javascript/js-arrays-iterables/guide-line/iterables-iterator-helpers.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/javascript/js-arrays-iterables/reference.md" },
                        ],
                      },
                      {
                        text: "JavaScript 内建对象与数据结构",
                        collapsed: true,
                        link: "/zh/base/language/javascript/js-builtins-structures/",
                        items: [
                          { text: "入门", link: "/zh/base/language/javascript/js-builtins-structures/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "数值、Math 与 BigInt", link: "/zh/base/language/javascript/js-builtins-structures/guide-line/number-math-bigint.md" },
                              { text: "字符串与模板字面量", link: "/zh/base/language/javascript/js-builtins-structures/guide-line/string-template.md" },
                              { text: "正则表达式", link: "/zh/base/language/javascript/js-builtins-structures/guide-line/regexp.md" },
                              { text: "Map/Set 与弱引用", link: "/zh/base/language/javascript/js-builtins-structures/guide-line/map-set-weak.md" },
                              { text: "JSON 与 Symbol", link: "/zh/base/language/javascript/js-builtins-structures/guide-line/json-symbol.md" },
                              { text: "Date 与 Temporal", link: "/zh/base/language/javascript/js-builtins-structures/guide-line/date-temporal.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/javascript/js-builtins-structures/reference.md" },
                        ],
                      },
                      {
                        text: "JavaScript 异步编程",
                        collapsed: true,
                        link: "/zh/base/language/javascript/js-async/",
                        items: [
                          { text: "入门", link: "/zh/base/language/javascript/js-async/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "事件循环", link: "/zh/base/language/javascript/js-async/guide-line/event-loop.md" },
                              { text: "回调与回调地狱", link: "/zh/base/language/javascript/js-async/guide-line/callbacks-evolution.md" },
                              { text: "Promise 基础", link: "/zh/base/language/javascript/js-async/guide-line/promise-basics.md" },
                              { text: "Promise 组合器", link: "/zh/base/language/javascript/js-async/guide-line/promise-combinators.md" },
                              { text: "async/await", link: "/zh/base/language/javascript/js-async/guide-line/async-await.md" },
                              { text: "取消、超时与竞态", link: "/zh/base/language/javascript/js-async/guide-line/cancellation-timeout.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/javascript/js-async/reference.md" },
                        ],
                      },
                      {
                        text: "JavaScript 生成器与元编程",
                        collapsed: true,
                        link: "/zh/base/language/javascript/js-generators-metaprogramming/",
                        items: [
                          { text: "入门", link: "/zh/base/language/javascript/js-generators-metaprogramming/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "生成器基础", link: "/zh/base/language/javascript/js-generators-metaprogramming/guide-line/generators.md" },
                              { text: "异步生成器", link: "/zh/base/language/javascript/js-generators-metaprogramming/guide-line/async-generators.md" },
                              { text: "自定义迭代器", link: "/zh/base/language/javascript/js-generators-metaprogramming/guide-line/custom-iterators.md" },
                              { text: "Proxy 与 Reflect", link: "/zh/base/language/javascript/js-generators-metaprogramming/guide-line/proxy-reflect.md" },
                              { text: "元编程与资源管理", link: "/zh/base/language/javascript/js-generators-metaprogramming/guide-line/metaprogramming-resources.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/javascript/js-generators-metaprogramming/reference.md" },
                        ],
                      },
                      {
                        text: "JavaScript DOM 与事件",
                        collapsed: true,
                        link: "/zh/base/language/javascript/js-dom-events/",
                        items: [
                          { text: "入门", link: "/zh/base/language/javascript/js-dom-events/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "DOM 树与遍历", link: "/zh/base/language/javascript/js-dom-events/guide-line/dom-tree-traversal.md" },
                              { text: "修改文档", link: "/zh/base/language/javascript/js-dom-events/guide-line/modifying-document.md" },
                              { text: "属性、特性与样式", link: "/zh/base/language/javascript/js-dom-events/guide-line/attributes-styles.md" },
                              { text: "事件机制", link: "/zh/base/language/javascript/js-dom-events/guide-line/event-mechanism.md" },
                              { text: "事件委托", link: "/zh/base/language/javascript/js-dom-events/guide-line/event-delegation.md" },
                              { text: "表单与页面加载", link: "/zh/base/language/javascript/js-dom-events/guide-line/forms-page-load.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/javascript/js-dom-events/reference.md" },
                        ],
                      },
                    ],
                  },
                  {
                    text: "CSS",
                    collapsed: true,
                    items: [
                      {
                        text: "CSS 选择器与层叠",
                        collapsed: true,
                        link: "/zh/base/language/css/css-selectors-cascade/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-selectors-cascade/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "选择器家族", link: "/zh/base/language/css/css-selectors-cascade/guide-line/selector-families.md" },
                              { text: "伪类与伪元素", link: "/zh/base/language/css/css-selectors-cascade/guide-line/pseudo-classes-elements.md" },
                              { text: "特异性计算", link: "/zh/base/language/css/css-selectors-cascade/guide-line/specificity.md" },
                              { text: "层叠与继承", link: "/zh/base/language/css/css-selectors-cascade/guide-line/cascade-inheritance.md" },
                              { text: "级联层 @layer", link: "/zh/base/language/css/css-selectors-cascade/guide-line/cascade-layers.md" },
                              { text: "选择器性能", link: "/zh/base/language/css/css-selectors-cascade/guide-line/selector-performance.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-selectors-cascade/reference.md" },
                        ],
                      },
                      {
                        text: "CSS 盒模型与尺寸",
                        collapsed: true,
                        link: "/zh/base/language/css/css-box-sizing/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-box-sizing/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "盒模型与 box-sizing", link: "/zh/base/language/css/css-box-sizing/guide-line/box-model.md" },
                              { text: "display 全谱", link: "/zh/base/language/css/css-box-sizing/guide-line/display-values.md" },
                              { text: "外边距合并与 BFC", link: "/zh/base/language/css/css-box-sizing/guide-line/margin-collapse-bfc.md" },
                              { text: "尺寸与内在尺寸", link: "/zh/base/language/css/css-box-sizing/guide-line/sizing-keywords.md" },
                              { text: "aspect-ratio 与现代尺寸", link: "/zh/base/language/css/css-box-sizing/guide-line/aspect-ratio.md" },
                              { text: "overflow 与滚动容器", link: "/zh/base/language/css/css-box-sizing/guide-line/overflow-scroll.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-box-sizing/reference.md" },
                        ],
                      },
                      {
                        text: "CSS 定位与层叠上下文",
                        collapsed: true,
                        link: "/zh/base/language/css/css-positioning/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-positioning/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "position 五取值", link: "/zh/base/language/css/css-positioning/guide-line/position-values.md" },
                              { text: "z-index 与层叠上下文", link: "/zh/base/language/css/css-positioning/guide-line/stacking-context.md" },
                              { text: "float 与清除浮动", link: "/zh/base/language/css/css-positioning/guide-line/float-clear.md" },
                              { text: "锚点定位", link: "/zh/base/language/css/css-positioning/guide-line/anchor-positioning.md" },
                              { text: "定位实战", link: "/zh/base/language/css/css-positioning/guide-line/positioning-patterns.md" },
                              { text: "popover 与 dialog", link: "/zh/base/language/css/css-positioning/guide-line/popover-dialog-positioning.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-positioning/reference.md" },
                        ],
                      },
                      {
                        text: "CSS Flexbox 弹性布局",
                        collapsed: true,
                        link: "/zh/base/language/css/css-flexbox/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-flexbox/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "容器与轴向模型", link: "/zh/base/language/css/css-flexbox/guide-line/flex-container-axes.md" },
                              { text: "主轴对齐", link: "/zh/base/language/css/css-flexbox/guide-line/main-axis-alignment.md" },
                              { text: "交叉轴对齐", link: "/zh/base/language/css/css-flexbox/guide-line/cross-axis-alignment.md" },
                              { text: "flex 三值与计算", link: "/zh/base/language/css/css-flexbox/guide-line/flex-grow-shrink-basis.md" },
                              { text: "换行·排序·间距", link: "/zh/base/language/css/css-flexbox/guide-line/wrap-order-gap.md" },
                              { text: "实战模式", link: "/zh/base/language/css/css-flexbox/guide-line/flexbox-patterns.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-flexbox/reference.md" },
                        ],
                      },
                      {
                        text: "CSS Grid 网格布局",
                        collapsed: true,
                        link: "/zh/base/language/css/css-grid/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-grid/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "网格轨道", link: "/zh/base/language/css/css-grid/guide-line/grid-tracks.md" },
                              { text: "模板区域", link: "/zh/base/language/css/css-grid/guide-line/template-areas.md" },
                              { text: "线与区域放置", link: "/zh/base/language/css/css-grid/guide-line/line-area-placement.md" },
                              { text: "隐式网格与自动布局", link: "/zh/base/language/css/css-grid/guide-line/implicit-grid.md" },
                              { text: "subgrid 子网格", link: "/zh/base/language/css/css-grid/guide-line/subgrid.md" },
                              { text: "实战配方", link: "/zh/base/language/css/css-grid/guide-line/grid-patterns.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-grid/reference.md" },
                        ],
                      },
                      {
                        text: "CSS 响应式与现代查询",
                        collapsed: true,
                        link: "/zh/base/language/css/css-responsive-queries/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-responsive-queries/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "媒体查询与 range 语法", link: "/zh/base/language/css/css-responsive-queries/guide-line/media-queries.md" },
                              { text: "用户偏好查询", link: "/zh/base/language/css/css-responsive-queries/guide-line/user-preferences.md" },
                              { text: "容器查询", link: "/zh/base/language/css/css-responsive-queries/guide-line/container-queries.md" },
                              { text: "@supports 特性查询", link: "/zh/base/language/css/css-responsive-queries/guide-line/supports-feature-queries.md" },
                              { text: "逻辑属性与书写模式", link: "/zh/base/language/css/css-responsive-queries/guide-line/logical-properties.md" },
                              { text: "多列布局", link: "/zh/base/language/css/css-responsive-queries/guide-line/multicol-patterns.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-responsive-queries/reference.md" },
                        ],
                      },
                      {
                        text: "CSS 颜色与背景",
                        collapsed: true,
                        link: "/zh/base/language/css/css-color-background/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-color-background/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "颜色与色彩空间", link: "/zh/base/language/css/css-color-background/guide-line/color-spaces.md" },
                              { text: "color-mix 与颜色函数", link: "/zh/base/language/css/css-color-background/guide-line/color-mix-functions.md" },
                              { text: "背景全谱", link: "/zh/base/language/css/css-color-background/guide-line/backgrounds.md" },
                              { text: "边框与圆角", link: "/zh/base/language/css/css-color-background/guide-line/borders-radius.md" },
                              { text: "阴影设计", link: "/zh/base/language/css/css-color-background/guide-line/box-shadow.md" },
                              { text: "渐变", link: "/zh/base/language/css/css-color-background/guide-line/gradients.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-color-background/reference.md" },
                        ],
                      },
                      {
                        text: "CSS 过渡、动画与视觉",
                        collapsed: true,
                        link: "/zh/base/language/css/css-animation-effects/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-animation-effects/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "过渡与缓动", link: "/zh/base/language/css/css-animation-effects/guide-line/transitions.md" },
                              { text: "关键帧动画", link: "/zh/base/language/css/css-animation-effects/guide-line/keyframes-animation.md" },
                              { text: "变换与合成层", link: "/zh/base/language/css/css-animation-effects/guide-line/transforms.md" },
                              { text: "滤镜·混合·裁剪", link: "/zh/base/language/css/css-animation-effects/guide-line/filters-blend-clip.md" },
                              { text: "视图过渡与滚动驱动", link: "/zh/base/language/css/css-animation-effects/guide-line/view-transitions-scroll.md" },
                              { text: "动画性能与无障碍", link: "/zh/base/language/css/css-animation-effects/guide-line/animation-performance.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-animation-effects/reference.md" },
                        ],
                      },
                      {
                        text: "CSS 自定义属性、函数与工程化",
                        collapsed: true,
                        link: "/zh/base/language/css/css-variables-engineering/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-variables-engineering/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "自定义属性", link: "/zh/base/language/css/css-variables-engineering/guide-line/custom-properties.md" },
                              { text: "@property 类型化", link: "/zh/base/language/css/css-variables-engineering/guide-line/property-typed.md" },
                              { text: "原生嵌套", link: "/zh/base/language/css/css-variables-engineering/guide-line/nesting.md" },
                              { text: "数学函数", link: "/zh/base/language/css/css-variables-engineering/guide-line/math-functions.md" },
                              { text: "组织方法论", link: "/zh/base/language/css/css-variables-engineering/guide-line/css-methodology.md" },
                              { text: "CSS 调试", link: "/zh/base/language/css/css-variables-engineering/guide-line/css-debugging.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-variables-engineering/reference.md" },
                        ],
                      },
                      {
                        text: "CSS 文字排版与字体",
                        collapsed: true,
                        link: "/zh/base/language/css/css-typography/",
                        items: [
                          { text: "入门", link: "/zh/base/language/css/css-typography/getting-started.md" },
                          {
                            text: "指南",
                            collapsed: true,
                            items: [
                              { text: "字体族与可变字体", link: "/zh/base/language/css/css-typography/guide-line/font-face-variable.md" },
                              { text: "字体加载与性能", link: "/zh/base/language/css/css-typography/guide-line/font-loading.md" },
                              { text: "行距·字距·对齐", link: "/zh/base/language/css/css-typography/guide-line/line-spacing-align.md" },
                              { text: "截断·折行·断词", link: "/zh/base/language/css/css-typography/guide-line/text-overflow-wrap.md" },
                              { text: "列表与 ::marker", link: "/zh/base/language/css/css-typography/guide-line/list-marker.md" },
                              { text: "计数器与生成内容", link: "/zh/base/language/css/css-typography/guide-line/counters.md" },
                            ],
                          },
                          { text: "参考", link: "/zh/base/language/css/css-typography/reference.md" },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                // 2026-06-25 重构为扁平 11 叶（spec: quiz-monorepo docs/plans/20260625-web-base-computer-network-trilogy.md）
                // 未产出叶用 text 占位，不建占位页（产出叶时再 text→link）
                text: "计算机网络基础",
                collapsed: true,
                items: [
                  {
                    text: "网络分层模型",
                    collapsed: true,
                    link: "/zh/base/network/net-layering/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-layering/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "为什么要分层", link: "/zh/base/network/net-layering/guide-line/why-layering.md" },
                          { text: "OSI 七层逐层职责", link: "/zh/base/network/net-layering/guide-line/osi-seven-layers.md" },
                          { text: "TCP/IP 四层与五层教学模型", link: "/zh/base/network/net-layering/guide-line/tcpip-five-layer.md" },
                          { text: "数据封装与解封装", link: "/zh/base/network/net-layering/guide-line/encapsulation.md" },
                          { text: "两模型对照与协议归层", link: "/zh/base/network/net-layering/guide-line/model-comparison.md" },
                          { text: "一个 HTTP 请求穿越协议栈的端到端旅程", link: "/zh/base/network/net-layering/guide-line/end-to-end-journey.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-layering/reference.md" },
                    ],
                  },
                  {
                    text: "链路层与局域网",
                    collapsed: true,
                    link: "/zh/base/network/net-link-lan/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-link-lan/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "数据链路层与 MAC 寻址", link: "/zh/base/network/net-link-lan/guide-line/datalink-mac.md" },
                          { text: "以太网帧结构", link: "/zh/base/network/net-link-lan/guide-line/ethernet-frame.md" },
                          { text: "交换机工作原理", link: "/zh/base/network/net-link-lan/guide-line/switch.md" },
                          { text: "VLAN 与局域网隔离", link: "/zh/base/network/net-link-lan/guide-line/vlan.md" },
                          { text: "ARP 协议与 ARP 欺骗", link: "/zh/base/network/net-link-lan/guide-line/arp.md" },
                          { text: "Wi-Fi/802.11 无线局域网", link: "/zh/base/network/net-link-lan/guide-line/wifi.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-link-lan/reference.md" },
                    ],
                  },
                  {
                    text: "网络层与路由",
                    collapsed: true,
                    link: "/zh/base/network/net-ip-routing/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-ip-routing/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "IP 协议与 IPv4 寻址", link: "/zh/base/network/net-ip-routing/guide-line/ip-protocol-ipv4.md" },
                          { text: "子网掩码与 CIDR 划分", link: "/zh/base/network/net-ip-routing/guide-line/subnet-cidr.md" },
                          { text: "IPv6 与过渡技术", link: "/zh/base/network/net-ip-routing/guide-line/ipv6.md" },
                          { text: "路由原理与路由器/网关", link: "/zh/base/network/net-ip-routing/guide-line/routing-router-gateway.md" },
                          { text: "ICMP 与 ping/traceroute", link: "/zh/base/network/net-ip-routing/guide-line/icmp-ping-traceroute.md" },
                          { text: "NAT 与 DHCP", link: "/zh/base/network/net-ip-routing/guide-line/nat-dhcp.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-ip-routing/reference.md" },
                    ],
                  },
                  {
                    text: "传输层 TCP 与 UDP",
                    collapsed: true,
                    link: "/zh/base/network/net-transport/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-transport/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "传输层与端口·复用分用", link: "/zh/base/network/net-transport/guide-line/transport-ports-mux.md" },
                          { text: "UDP 协议与适用场景", link: "/zh/base/network/net-transport/guide-line/udp-protocol.md" },
                          { text: "TCP 三次握手与四次挥手", link: "/zh/base/network/net-transport/guide-line/tcp-handshake.md" },
                          { text: "TCP 可靠传输", link: "/zh/base/network/net-transport/guide-line/tcp-reliable.md" },
                          { text: "流量控制与拥塞控制", link: "/zh/base/network/net-transport/guide-line/flow-congestion-control.md" },
                          { text: "TCP vs UDP 选型与队头阻塞", link: "/zh/base/network/net-transport/guide-line/tcp-vs-udp-hol.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-transport/reference.md" },
                    ],
                  },
                  {
                    text: "DNS 域名系统",
                    collapsed: true,
                    link: "/zh/base/network/net-dns/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-dns/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "DNS 作用与域名层级体系", link: "/zh/base/network/net-dns/guide-line/dns-role-hierarchy.md" },
                          { text: "解析流程：递归与迭代查询", link: "/zh/base/network/net-dns/guide-line/dns-resolution.md" },
                          { text: "常见记录类型", link: "/zh/base/network/net-dns/guide-line/dns-record-types.md" },
                          { text: "DNS 缓存与 TTL", link: "/zh/base/network/net-dns/guide-line/dns-cache-ttl.md" },
                          { text: "前端 DNS 优化", link: "/zh/base/network/net-dns/guide-line/dns-frontend-optimization.md" },
                          { text: "DoH/DoT 与 DNS 安全", link: "/zh/base/network/net-dns/guide-line/doh-dot-security.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-dns/reference.md" },
                    ],
                  },
                  {
                    text: "HTTP 协议基础",
                    collapsed: true,
                    link: "/zh/base/network/net-http-basics/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-http-basics/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "HTTP 报文结构与请求方法", link: "/zh/base/network/net-http-basics/guide-line/http-messages-methods.md" },
                          { text: "HTTP 状态码全谱", link: "/zh/base/network/net-http-basics/guide-line/status-codes.md" },
                          { text: "HTTP 首部精要", link: "/zh/base/network/net-http-basics/guide-line/http-headers.md" },
                          { text: "HTTP 内容协商", link: "/zh/base/network/net-http-basics/guide-line/content-negotiation.md" },
                          { text: "Cookie 与会话管理", link: "/zh/base/network/net-http-basics/guide-line/cookies-sessions.md" },
                          { text: "持久连接、范围请求与缓存首部", link: "/zh/base/network/net-http-basics/guide-line/connection-range-caching.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-http-basics/reference.md" },
                    ],
                  },
                  {
                    text: "HTTP 演进与性能",
                    collapsed: true,
                    link: "/zh/base/network/net-http-evolution/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-http-evolution/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "HTTP 版本演进史", link: "/zh/base/network/net-http-evolution/guide-line/http-versions-history.md" },
                          { text: "HTTP/1.1 瓶颈与队头阻塞", link: "/zh/base/network/net-http-evolution/guide-line/http1-bottlenecks.md" },
                          { text: "HTTP/2 二进制分帧与多路复用", link: "/zh/base/network/net-http-evolution/guide-line/http2-framing-multiplexing.md" },
                          { text: "HPACK 头部压缩与服务器推送", link: "/zh/base/network/net-http-evolution/guide-line/http2-hpack-push.md" },
                          { text: "HTTP/3 与 QUIC", link: "/zh/base/network/net-http-evolution/guide-line/http3-quic.md" },
                          { text: "版本对比与前端性能实践", link: "/zh/base/network/net-http-evolution/guide-line/version-comparison-performance.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-http-evolution/reference.md" },
                    ],
                  },
                  {
                    text: "HTTPS 与传输安全",
                    collapsed: true,
                    link: "/zh/base/network/net-https-tls/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-https-tls/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "为什么需要 HTTPS", link: "/zh/base/network/net-https-tls/guide-line/why-https.md" },
                          { text: "对称与非对称加密", link: "/zh/base/network/net-https-tls/guide-line/symmetric-asymmetric.md" },
                          { text: "数字证书与 CA 信任链", link: "/zh/base/network/net-https-tls/guide-line/certificates-ca.md" },
                          { text: "TLS 握手流程", link: "/zh/base/network/net-https-tls/guide-line/tls-handshake.md" },
                          { text: "中间人攻击与 HSTS", link: "/zh/base/network/net-https-tls/guide-line/mitm-hsts.md" },
                          { text: "证书实务", link: "/zh/base/network/net-https-tls/guide-line/certificate-practice.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-https-tls/reference.md" },
                    ],
                  },
                  {
                    text: "跨域与同源策略",
                    collapsed: true,
                    link: "/zh/base/network/net-cors/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-cors/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "同源策略与「源」的定义", link: "/zh/base/network/net-cors/guide-line/same-origin-policy.md" },
                          { text: "跨域常见场景与报错排查", link: "/zh/base/network/net-cors/guide-line/cross-origin-scenarios.md" },
                          { text: "CORS 简单请求与预检请求", link: "/zh/base/network/net-cors/guide-line/cors-simple-preflight.md" },
                          { text: "CORS 凭证与 Access-Control 首部全谱", link: "/zh/base/network/net-cors/guide-line/cors-credentials-headers.md" },
                          { text: "JSONP 与反向代理方案", link: "/zh/base/network/net-cors/guide-line/jsonp-proxy.md" },
                          { text: "Cookie SameSite 与 COOP/COEP/CORP", link: "/zh/base/network/net-cors/guide-line/samesite-coop-coep.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-cors/reference.md" },
                    ],
                  },
                  {
                    text: "实时通信协议",
                    collapsed: true,
                    link: "/zh/base/network/net-realtime/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-realtime/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "实时通信方案演进（轮询→长轮询）", link: "/zh/base/network/net-realtime/guide-line/polling-evolution.md" },
                          { text: "SSE 服务器推送", link: "/zh/base/network/net-realtime/guide-line/sse.md" },
                          { text: "WebSocket 协议握手与帧", link: "/zh/base/network/net-realtime/guide-line/websocket-protocol.md" },
                          { text: "WebSocket 心跳·重连·工程实践", link: "/zh/base/network/net-realtime/guide-line/websocket-practice.md" },
                          { text: "WebRTC 与 NAT 穿透", link: "/zh/base/network/net-realtime/guide-line/webrtc-nat.md" },
                          { text: "实时方案对比与选型", link: "/zh/base/network/net-realtime/guide-line/realtime-comparison.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-realtime/reference.md" },
                    ],
                  },
                  {
                    text: "接入与移动网络",
                    collapsed: true,
                    link: "/zh/base/network/net-access-mobile/",
                    items: [
                      { text: "入门", link: "/zh/base/network/net-access-mobile/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "接入网与 LAN/WAN/MAN", link: "/zh/base/network/net-access-mobile/guide-line/access-lan-wan.md" },
                          { text: "宽带接入技术", link: "/zh/base/network/net-access-mobile/guide-line/broadband.md" },
                          { text: "蜂窝移动网络 2G→5G", link: "/zh/base/network/net-access-mobile/guide-line/cellular-2g-5g.md" },
                          { text: "移动弱网对前端的挑战", link: "/zh/base/network/net-access-mobile/guide-line/mobile-weak-network.md" },
                          { text: "CDN 网络原理", link: "/zh/base/network/net-access-mobile/guide-line/cdn-principle.md" },
                          { text: "网络性能指标与弱网优化", link: "/zh/base/network/net-access-mobile/guide-line/network-performance.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/network/net-access-mobile/reference.md" },
                    ],
                  },
                ],
              },
              {
                // 2026-07-02 选型调研定稿：占位 3 叶 → 5 叶
                // （spec: quiz-monorepo/docs/plans/20260702-web-base-browser-trilogy.md）。
                // 产出一叶补一叶 link（text 占位约定）。
                text: "浏览器基础",
                collapsed: true,
                items: [
                  {
                    text: "浏览器架构与进程模型",
                    collapsed: true,
                    link: "/zh/base/browser/browser-architecture/",
                    items: [
                      { text: "入门", link: "/zh/base/browser/browser-architecture/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "进程、线程与 IPC", link: "/zh/base/browser/browser-architecture/guide-line/process-thread-ipc.md" },
                          { text: "多进程架构", link: "/zh/base/browser/browser-architecture/guide-line/multi-process-model.md" },
                          { text: "各进程内的线程", link: "/zh/base/browser/browser-architecture/guide-line/process-threads-inside.md" },
                          { text: "站点隔离", link: "/zh/base/browser/browser-architecture/guide-line/site-isolation.md" },
                          { text: "一次导航的全流程", link: "/zh/base/browser/browser-architecture/guide-line/navigation-flow.md" },
                          { text: "导航交接与复用", link: "/zh/base/browser/browser-architecture/guide-line/navigation-handoff.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/browser/browser-architecture/reference.md" },
                    ],
                  },
                  {
                    text: "浏览器渲染原理",
                    collapsed: true,
                    link: "/zh/base/browser/browser-rendering/",
                    items: [
                      { text: "入门", link: "/zh/base/browser/browser-rendering/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "HTML 解析与 DOM 构建", link: "/zh/base/browser/browser-rendering/guide-line/dom-construction.md" },
                          { text: "CSSOM 与 render tree", link: "/zh/base/browser/browser-rendering/guide-line/cssom-render-tree.md" },
                          { text: "布局与重排", link: "/zh/base/browser/browser-rendering/guide-line/layout-reflow.md" },
                          { text: "绘制与合成", link: "/zh/base/browser/browser-rendering/guide-line/paint-compositing.md" },
                          { text: "帧生命周期与输入", link: "/zh/base/browser/browser-rendering/guide-line/frame-input.md" },
                          { text: "现代架构 RenderingNG", link: "/zh/base/browser/browser-rendering/guide-line/renderingng.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/browser/browser-rendering/reference.md" },
                    ],
                  },
                  {
                    text: "浏览器存储",
                    collapsed: true,
                    link: "/zh/base/browser/browser-storage/",
                    items: [
                      { text: "入门", link: "/zh/base/browser/browser-storage/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "存储全景与选型矩阵", link: "/zh/base/browser/browser-storage/guide-line/storage-overview.md" },
                          { text: "Cookie 的浏览器侧", link: "/zh/base/browser/browser-storage/guide-line/cookie-browser-side.md" },
                          { text: "Web Storage 存储模型", link: "/zh/base/browser/browser-storage/guide-line/web-storage-model.md" },
                          { text: "IndexedDB 定位与 OPFS", link: "/zh/base/browser/browser-storage/guide-line/indexeddb-opfs.md" },
                          { text: "配额与驱逐", link: "/zh/base/browser/browser-storage/guide-line/quota-eviction.md" },
                          { text: "存储分区与 Storage Buckets", link: "/zh/base/browser/browser-storage/guide-line/partitioning-buckets.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/browser/browser-storage/reference.md" },
                    ],
                  },
                  {
                    text: "浏览器缓存机制",
                    collapsed: true,
                    link: "/zh/base/browser/browser-cache/",
                    items: [
                      { text: "入门", link: "/zh/base/browser/browser-cache/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "多层缓存总览", link: "/zh/base/browser/browser-cache/guide-line/cache-layers.md" },
                          { text: "内存缓存与磁盘缓存", link: "/zh/base/browser/browser-cache/guide-line/memory-disk-cache.md" },
                          { text: "HTTP 缓存的浏览器侧落地", link: "/zh/base/browser/browser-cache/guide-line/http-cache-landing.md" },
                          { text: "往返缓存 bfcache", link: "/zh/base/browser/browser-cache/guide-line/bfcache.md" },
                          { text: "Service Worker 缓存与 Cache API", link: "/zh/base/browser/browser-cache/guide-line/sw-cache-api.md" },
                          { text: "观测与清除", link: "/zh/base/browser/browser-cache/guide-line/cache-observe-clear.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/browser/browser-cache/reference.md" },
                    ],
                  },
                  {
                    text: "浏览器安全",
                    collapsed: true,
                    link: "/zh/base/browser/browser-security/",
                    items: [
                      { text: "入门", link: "/zh/base/browser/browser-security/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "CSP 基础", link: "/zh/base/browser/browser-security/guide-line/csp-basics.md" },
                          { text: "防注入三件套", link: "/zh/base/browser/browser-security/guide-line/strict-csp-trusted-types.md" },
                          { text: "沙箱与隔离防御", link: "/zh/base/browser/browser-security/guide-line/sandbox-isolation-defense.md" },
                          { text: "iframe sandbox 与点击劫持", link: "/zh/base/browser/browser-security/guide-line/iframe-sandbox-clickjacking.md" },
                          { text: "安全上下文与混合内容", link: "/zh/base/browser/browser-security/guide-line/secure-contexts-mixed-content.md" },
                          { text: "能力与元数据防护", link: "/zh/base/browser/browser-security/guide-line/permissions-policy-fetch-metadata.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/base/browser/browser-security/reference.md" },
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
                collapsed: true,
                items: [
                  {
                    text: "Markdown",
                    collapsed: true,
                    link: "/zh/web-advanced/language/markdown/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/language/markdown/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "块级元素", link: "/zh/web-advanced/language/markdown/guide-line/blocks" },
                          { text: "行内元素", link: "/zh/web-advanced/language/markdown/guide-line/inlines" },
                          { text: "GFM 扩展", link: "/zh/web-advanced/language/markdown/guide-line/gfm-extensions" },
                          { text: "方言与 front matter", link: "/zh/web-advanced/language/markdown/guide-line/dialects-and-frontmatter" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/language/markdown/reference" },
                    ],
                  },
                  {
                    text: "MDX",
                    collapsed: true,
                    link: "/zh/web-advanced/language/mdx/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/language/mdx/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "语法详解", link: "/zh/web-advanced/language/mdx/guide-line/syntax" },
                          { text: "组件映射", link: "/zh/web-advanced/language/mdx/guide-line/components-and-provider" },
                          { text: "编译流程", link: "/zh/web-advanced/language/mdx/guide-line/compile-pipeline" },
                          { text: "框架集成与迁移", link: "/zh/web-advanced/language/mdx/guide-line/integrations-and-migration" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/language/mdx/reference" },
                    ],
                  },
                  {
                    text: "TypeScript",
                    collapsed: true,
                    link: "/zh/web-advanced/language/typescript/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/language/typescript/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "类型系统基础", link: "/zh/web-advanced/language/typescript/guide-line/type-system-basics" },
                          { text: "推断与窄化", link: "/zh/web-advanced/language/typescript/guide-line/narrowing-and-inference" },
                          { text: "泛型与工具类型", link: "/zh/web-advanced/language/typescript/guide-line/generics-and-utility-types" },
                          { text: "类型体操", link: "/zh/web-advanced/language/typescript/guide-line/type-manipulation" },
                          { text: "配置·模块·互操作", link: "/zh/web-advanced/language/typescript/guide-line/config-modules-interop" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/language/typescript/reference" },
                    ],
                  },
                  {
                    text: "样式方案",
                    collapsed: true,
                    items: [
                      {
                        text: "CSS 工具链",
                        collapsed: true,
                        items: [
                          {
                            text: "Sass",
                            collapsed: true,
                            link: "/zh/web-advanced/language/sass/",
                            items: [
                              { text: "入门", link: "/zh/web-advanced/language/sass/getting-started" },
                              {
                                text: "指南",
                                collapsed: true,
                                items: [
                                  { text: "语法、嵌套与变量", link: "/zh/web-advanced/language/sass/guide-line/syntax-and-nesting" },
                                  { text: "mixin、函数与 @extend", link: "/zh/web-advanced/language/sass/guide-line/mixins-functions-extend" },
                                  { text: "控制流", link: "/zh/web-advanced/language/sass/guide-line/control-flow" },
                                  { text: "模块系统", link: "/zh/web-advanced/language/sass/guide-line/module-system" },
                                  { text: "内置模块与迁移", link: "/zh/web-advanced/language/sass/guide-line/built-in-modules" },
                                ],
                              },
                              { text: "参考", link: "/zh/web-advanced/language/sass/reference" },
                            ],
                          },
                          {
                            text: "Less",
                            collapsed: true,
                            link: "/zh/web-advanced/language/less/",
                            items: [
                              { text: "入门", link: "/zh/web-advanced/language/less/getting-started" },
                              {
                                text: "指南",
                                collapsed: true,
                                items: [
                                  { text: "变量、作用域与插值", link: "/zh/web-advanced/language/less/guide-line/variables-and-scope" },
                                  { text: "混合、守卫与循环", link: "/zh/web-advanced/language/less/guide-line/mixins-and-guards" },
                                  { text: "嵌套、运算与函数", link: "/zh/web-advanced/language/less/guide-line/nesting-operations-functions" },
                                  { text: "导入与组织", link: "/zh/web-advanced/language/less/guide-line/import-and-organization" },
                                  { text: "Less vs Sass 与选型", link: "/zh/web-advanced/language/less/guide-line/less-vs-sass" },
                                ],
                              },
                              { text: "参考", link: "/zh/web-advanced/language/less/reference" },
                            ],
                          },
                          {
                            text: "PostCSS",
                            collapsed: true,
                            link: "/zh/web-advanced/language/postcss/",
                            items: [
                              { text: "入门", link: "/zh/web-advanced/language/postcss/getting-started" },
                              {
                                text: "指南",
                                collapsed: true,
                                items: [
                                  { text: "工作原理与 AST", link: "/zh/web-advanced/language/postcss/guide-line/how-it-works" },
                                  { text: "插件机制与 API", link: "/zh/web-advanced/language/postcss/guide-line/plugin-mechanism" },
                                  { text: "主流插件生态", link: "/zh/web-advanced/language/postcss/guide-line/ecosystem-plugins" },
                                  { text: "配置与构建集成", link: "/zh/web-advanced/language/postcss/guide-line/config-and-integration" },
                                  { text: "与预处理器的关系", link: "/zh/web-advanced/language/postcss/guide-line/vs-preprocessors" },
                                ],
                              },
                              { text: "参考", link: "/zh/web-advanced/language/postcss/reference" },
                            ],
                          },
                          {
                            text: "Tailwind CSS",
                            collapsed: true,
                            link: "/zh/web-advanced/language/tailwind/",
                            items: [
                              { text: "入门", link: "/zh/web-advanced/language/tailwind/getting-started" },
                              {
                                text: "指南",
                                collapsed: true,
                                items: [
                                  { text: "工具类优先与响应式", link: "/zh/web-advanced/language/tailwind/guide-line/utility-first-and-responsive" },
                                  { text: "状态与变体", link: "/zh/web-advanced/language/tailwind/guide-line/states-and-variants" },
                                  { text: "v4 CSS-first 配置", link: "/zh/web-advanced/language/tailwind/guide-line/css-first-config" },
                                  { text: "深色模式与颜色", link: "/zh/web-advanced/language/tailwind/guide-line/dark-mode-and-colors" },
                                  { text: "v3→v4 迁移与生态", link: "/zh/web-advanced/language/tailwind/guide-line/migration-and-ecosystem" },
                                ],
                              },
                              { text: "参考", link: "/zh/web-advanced/language/tailwind/reference" },
                            ],
                          },
                          {
                            text: "UnoCSS",
                            collapsed: true,
                            link: "/zh/web-advanced/language/unocss/",
                            items: [
                              { text: "入门", link: "/zh/web-advanced/language/unocss/getting-started" },
                              {
                                text: "指南",
                                collapsed: true,
                                items: [
                                  { text: "预设体系", link: "/zh/web-advanced/language/unocss/guide-line/presets" },
                                  { text: "规则、快捷方式与变体", link: "/zh/web-advanced/language/unocss/guide-line/rules-shortcuts-variants" },
                                  { text: "指令与属性化", link: "/zh/web-advanced/language/unocss/guide-line/directives-and-attributify" },
                                  { text: "纯 CSS 图标与 pnpm 坑", link: "/zh/web-advanced/language/unocss/guide-line/icons-and-pitfalls" },
                                  { text: "集成与 Wind4 迁移", link: "/zh/web-advanced/language/unocss/guide-line/integration-and-wind4" },
                                ],
                              },
                              { text: "参考", link: "/zh/web-advanced/language/unocss/reference" },
                            ],
                          },
                        ],
                      },
                      {
                        text: "CSS-in-JS",
                        collapsed: true,
                        items: [
                          {
                            text: "CSS Modules",
                            collapsed: true,
                            link: "/zh/web-advanced/language/css-modules/",
                            items: [
                              { text: "入门", link: "/zh/web-advanced/language/css-modules/getting-started" },
                              {
                                text: "指南",
                                collapsed: true,
                                items: [
                                  { text: "局部作用域与命名", link: "/zh/web-advanced/language/css-modules/guide-line/local-scope-and-naming" },
                                  { text: "组合复用 composes/@value", link: "/zh/web-advanced/language/css-modules/guide-line/composition-and-values" },
                                  { text: "框架集成与 TS 类型", link: "/zh/web-advanced/language/css-modules/guide-line/framework-and-typescript" },
                                  { text: "对照 CSS-in-JS 与选型", link: "/zh/web-advanced/language/css-modules/guide-line/vs-css-in-js" },
                                ],
                              },
                              { text: "参考", link: "/zh/web-advanced/language/css-modules/reference" },
                            ],
                          },
                          {
                            text: "StyleX",
                            collapsed: true,
                            link: "/zh/web-advanced/language/stylex/",
                            items: [
                              { text: "入门", link: "/zh/web-advanced/language/stylex/getting-started" },
                              {
                                text: "指南",
                                collapsed: true,
                                items: [
                                  { text: "定义与应用样式", link: "/zh/web-advanced/language/stylex/guide-line/defining-styles" },
                                  { text: "变量与主题", link: "/zh/web-advanced/language/stylex/guide-line/theming" },
                                  { text: "类型安全与现代 API", link: "/zh/web-advanced/language/stylex/guide-line/types-and-modern-apis" },
                                  { text: "选型对比与集成", link: "/zh/web-advanced/language/stylex/guide-line/comparison-and-integration" },
                                ],
                              },
                              { text: "参考", link: "/zh/web-advanced/language/stylex/reference" },
                            ],
                          },
                          {
                            text: "Panda CSS",
                            collapsed: true,
                            link: "/zh/web-advanced/language/panda-css/",
                            items: [
                              { text: "入门", link: "/zh/web-advanced/language/panda-css/getting-started" },
                              {
                                text: "指南",
                                collapsed: true,
                                items: [
                                  { text: "写样式 css()", link: "/zh/web-advanced/language/panda-css/guide-line/writing-styles" },
                                  { text: "Recipes 与 Patterns", link: "/zh/web-advanced/language/panda-css/guide-line/recipes-and-patterns" },
                                  { text: "Tokens 与主题", link: "/zh/web-advanced/language/panda-css/guide-line/tokens-and-theming" },
                                  { text: "静态提取与配置", link: "/zh/web-advanced/language/panda-css/guide-line/static-extraction-and-config" },
                                  { text: "生态与选型", link: "/zh/web-advanced/language/panda-css/guide-line/ecosystem-and-selection" },
                                ],
                              },
                              { text: "参考", link: "/zh/web-advanced/language/panda-css/reference" },
                            ],
                          },
                          {
                            text: "vanilla-extract",
                            collapsed: true,
                            link: "/zh/web-advanced/language/vanilla-extract/",
                            items: [
                              { text: "入门", link: "/zh/web-advanced/language/vanilla-extract/getting-started" },
                              {
                                text: "指南",
                                collapsed: true,
                                items: [
                                  { text: "Styling 深入", link: "/zh/web-advanced/language/vanilla-extract/guide-line/styling" },
                                  { text: "主题与令牌契约", link: "/zh/web-advanced/language/vanilla-extract/guide-line/theming" },
                                  { text: "recipes 与 sprinkles", link: "/zh/web-advanced/language/vanilla-extract/guide-line/recipes-and-sprinkles" },
                                  { text: "dynamic 与构建集成", link: "/zh/web-advanced/language/vanilla-extract/guide-line/dynamic-and-build" },
                                ],
                              },
                              { text: "参考", link: "/zh/web-advanced/language/vanilla-extract/reference" },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    text: "JSON",
                    collapsed: true,
                    link: "/zh/web-advanced/language/json/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/language/json/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "语法与类型", link: "/zh/web-advanced/language/json/guide-line/syntax-and-types" },
                          { text: "JS 中的 JSON API", link: "/zh/web-advanced/language/json/guide-line/js-json-api" },
                          { text: "变体家族", link: "/zh/web-advanced/language/json/guide-line/variants" },
                          { text: "JSON Schema", link: "/zh/web-advanced/language/json/guide-line/json-schema" },
                          { text: "生态与选型", link: "/zh/web-advanced/language/json/guide-line/ecosystem-and-selection" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/language/json/reference" },
                    ],
                  },
                  {
                    text: "YAML",
                    collapsed: true,
                    link: "/zh/web-advanced/language/yaml/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/language/yaml/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "标量与字符串", link: "/zh/web-advanced/language/yaml/guide-line/scalars-and-strings" },
                          { text: "集合与结构", link: "/zh/web-advanced/language/yaml/guide-line/collections-and-structure" },
                          { text: "锚点与合并", link: "/zh/web-advanced/language/yaml/guide-line/anchors-and-merge" },
                          { text: "类型、Schema 与坑", link: "/zh/web-advanced/language/yaml/guide-line/types-schemas-pitfalls" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/language/yaml/reference" },
                    ],
                  },
                  {
                    text: "TOML",
                    collapsed: true,
                    link: "/zh/web-advanced/language/toml/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/language/toml/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "键与字符串", link: "/zh/web-advanced/language/toml/guide-line/keys-and-strings" },
                          { text: "标量与数组", link: "/zh/web-advanced/language/toml/guide-line/scalars-and-arrays" },
                          { text: "表与表数组", link: "/zh/web-advanced/language/toml/guide-line/tables" },
                          { text: "生态与坑", link: "/zh/web-advanced/language/toml/guide-line/ecosystem-and-pitfalls" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/language/toml/reference" },
                    ],
                  },
                ],
              },
              {
                // 2026-07-11 选型定案 17 叶（spec: quiz-monorepo docs/plans/20260711-web-api-trilogy.md）
                // 本章讲「浏览器 API 用法」；协议原理在网络章、存储模型在浏览器章。产出叶才 text→link。
                text: "Web API",
                collapsed: true,
                items: [
                  {
                    text: "Web Components",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/web-components/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/web-components/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "自定义元素与生命周期", link: "/zh/web-advanced/web-api/web-components/guide-line/custom-elements" },
                          { text: "Shadow DOM 封装与样式", link: "/zh/web-advanced/web-api/web-components/guide-line/shadow-dom" },
                          { text: "template、slot 与声明式 Shadow DOM", link: "/zh/web-advanced/web-api/web-components/guide-line/templates-slots" },
                          { text: "表单、可访问性与框架互操作", link: "/zh/web-advanced/web-api/web-components/guide-line/forms-frameworks" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/web-components/reference" },
                    ],
                  },
                  {
                    text: "Web Assembly",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/webassembly/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/webassembly/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "模块模型与线性内存", link: "/zh/web-advanced/web-api/webassembly/guide-line/module-and-memory" },
                          { text: "JS API 全解", link: "/zh/web-advanced/web-api/webassembly/guide-line/js-api" },
                          { text: "工具链与互操作", link: "/zh/web-advanced/web-api/webassembly/guide-line/toolchains-interop" },
                          { text: "Wasm 3.0 与前沿", link: "/zh/web-advanced/web-api/webassembly/guide-line/wasm3-and-frontier" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/webassembly/reference" },
                    ],
                  },
                  {
                    text: "WebRTC API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/webrtc/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/webrtc/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "媒体捕获与设备", link: "/zh/web-advanced/web-api/webrtc/guide-line/media-capture" },
                          { text: "RTCPeerConnection 生命周期", link: "/zh/web-advanced/web-api/webrtc/guide-line/peer-connection" },
                          { text: "perfect negotiation 与 DataChannel", link: "/zh/web-advanced/web-api/webrtc/guide-line/negotiation-datachannel" },
                          { text: "getStats 与 Encoded Transform", link: "/zh/web-advanced/web-api/webrtc/guide-line/stats-transform" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/webrtc/reference" },
                    ],
                  },
                  {
                    text: "Server-Sent Events",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/sse/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/sse/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "EventSource API 全解", link: "/zh/web-advanced/web-api/sse/guide-line/eventsource-api" },
                          { text: "重连机制与工程局限", link: "/zh/web-advanced/web-api/sse/guide-line/reconnect-and-limits" },
                          { text: "fetch 流式替代方案", link: "/zh/web-advanced/web-api/sse/guide-line/fetch-streaming-alternative" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/sse/reference" },
                    ],
                  },
                  {
                    text: "Fetch API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/fetch/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/fetch/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "Request、Response 与 Headers", link: "/zh/web-advanced/web-api/fetch/guide-line/request-response" },
                          { text: "取消与超时", link: "/zh/web-advanced/web-api/fetch/guide-line/abort-timeout" },
                          { text: "mode、credentials 与 cache", link: "/zh/web-advanced/web-api/fetch/guide-line/cors-credentials-cache" },
                          { text: "流式与离页请求", link: "/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/fetch/reference" },
                    ],
                  },
                  {
                    text: "WebSocket",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/websocket/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/websocket/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "API 全解", link: "/zh/web-advanced/web-api/websocket/guide-line/api-deep-dive" },
                          { text: "二进制与背压", link: "/zh/web-advanced/web-api/websocket/guide-line/binary-backpressure" },
                          { text: "生命周期与封装模式", link: "/zh/web-advanced/web-api/websocket/guide-line/lifecycle-patterns" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/websocket/reference" },
                    ],
                  },
                  {
                    text: "Web Storage API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/web-storage/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/web-storage/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "API 与事件", link: "/zh/web-advanced/web-api/web-storage/guide-line/api-and-events" },
                          { text: "序列化与异常", link: "/zh/web-advanced/web-api/web-storage/guide-line/serialization-exceptions" },
                          { text: "封装模式", link: "/zh/web-advanced/web-api/web-storage/guide-line/patterns" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/web-storage/reference" },
                    ],
                  },
                  {
                    text: "IndexedDB",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/indexeddb/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/indexeddb/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "事务模型", link: "/zh/web-advanced/web-api/indexeddb/guide-line/transactions" },
                          { text: "CRUD、索引与游标", link: "/zh/web-advanced/web-api/indexeddb/guide-line/crud-index-cursor" },
                          { text: "版本与多标签页", link: "/zh/web-advanced/web-api/indexeddb/guide-line/versioning-multitab" },
                          { text: "包装库与生态", link: "/zh/web-advanced/web-api/indexeddb/guide-line/wrappers-ecosystem" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/indexeddb/reference" },
                    ],
                  },
                  {
                    text: "Web Workers API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/web-workers/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/web-workers/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "专用 Worker", link: "/zh/web-advanced/web-api/web-workers/guide-line/dedicated-worker" },
                          { text: "共享 Worker", link: "/zh/web-advanced/web-api/web-workers/guide-line/shared-worker" },
                          { text: "数据传输与 OffscreenCanvas", link: "/zh/web-advanced/web-api/web-workers/guide-line/transfer-offscreen" },
                          { text: "工程模式与 Comlink", link: "/zh/web-advanced/web-api/web-workers/guide-line/patterns-comlink" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/web-workers/reference" },
                    ],
                  },
                  {
                    text: "Service Worker 与 PWA",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/service-worker-pwa/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/service-worker-pwa/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "生命周期与更新模型", link: "/zh/web-advanced/web-api/service-worker-pwa/guide-line/lifecycle" },
                          { text: "fetch 拦截与离线", link: "/zh/web-advanced/web-api/service-worker-pwa/guide-line/fetch-offline" },
                          { text: "推送、通知与后台同步", link: "/zh/web-advanced/web-api/service-worker-pwa/guide-line/push-notification-sync" },
                          { text: "Manifest 与安装", link: "/zh/web-advanced/web-api/service-worker-pwa/guide-line/manifest-install" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/service-worker-pwa/reference" },
                    ],
                  },
                  {
                    text: "Streams API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/streams/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/streams/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "ReadableStream", link: "/zh/web-advanced/web-api/streams/guide-line/readable-stream" },
                          { text: "WritableStream 与 TransformStream", link: "/zh/web-advanced/web-api/streams/guide-line/writable-transform" },
                          { text: "背压与排队策略", link: "/zh/web-advanced/web-api/streams/guide-line/backpressure-strategy" },
                          { text: "字节流与压缩实战", link: "/zh/web-advanced/web-api/streams/guide-line/bytes-compression" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/streams/reference" },
                    ],
                  },
                  {
                    text: "Observer 观察器 API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/observers/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/observers/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "IntersectionObserver", link: "/zh/web-advanced/web-api/observers/guide-line/intersection-observer" },
                          { text: "ResizeObserver", link: "/zh/web-advanced/web-api/observers/guide-line/resize-observer" },
                          { text: "MutationObserver", link: "/zh/web-advanced/web-api/observers/guide-line/mutation-observer" },
                          { text: "PerformanceObserver 与其他", link: "/zh/web-advanced/web-api/observers/guide-line/performance-reporting-observer" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/observers/reference" },
                    ],
                  },
                  {
                    text: "History 与 Navigation API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/history-navigation/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/history-navigation/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "History API", link: "/zh/web-advanced/web-api/history-navigation/guide-line/history-api" },
                          { text: "Navigation API 基础", link: "/zh/web-advanced/web-api/history-navigation/guide-line/navigation-api-basics" },
                          { text: "navigate 事件与拦截", link: "/zh/web-advanced/web-api/history-navigation/guide-line/navigate-intercept" },
                          { text: "迁移与模式", link: "/zh/web-advanced/web-api/history-navigation/guide-line/migration-patterns" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/history-navigation/reference" },
                    ],
                  },
                  {
                    text: "View Transitions API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/view-transitions/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/view-transitions/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "基础与伪元素树", link: "/zh/web-advanced/web-api/view-transitions/guide-line/basics-pseudo" },
                          { text: "命名与定制", link: "/zh/web-advanced/web-api/view-transitions/guide-line/naming-customization" },
                          { text: "SPA、MPA 与类型", link: "/zh/web-advanced/web-api/view-transitions/guide-line/spa-mpa-types" },
                          { text: "工程模式与降级", link: "/zh/web-advanced/web-api/view-transitions/guide-line/patterns-fallback" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/view-transitions/reference" },
                    ],
                  },
                  {
                    text: "File 与文件系统 API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/file-system/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/file-system/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "File、Blob 与 FileReader", link: "/zh/web-advanced/web-api/file-system/guide-line/file-blob-reader" },
                          { text: "File System Access API", link: "/zh/web-advanced/web-api/file-system/guide-line/file-system-access" },
                          { text: "OPFS", link: "/zh/web-advanced/web-api/file-system/guide-line/opfs" },
                          { text: "工程模式", link: "/zh/web-advanced/web-api/file-system/guide-line/patterns" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/file-system/reference" },
                    ],
                  },
                  {
                    text: "跨上下文通信",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/cross-context-messaging/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/cross-context-messaging/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "window.postMessage 与安全", link: "/zh/web-advanced/web-api/cross-context-messaging/guide-line/postmessage" },
                          { text: "MessageChannel 与 MessagePort", link: "/zh/web-advanced/web-api/cross-context-messaging/guide-line/message-channel" },
                          { text: "BroadcastChannel", link: "/zh/web-advanced/web-api/cross-context-messaging/guide-line/broadcast-channel" },
                          { text: "多标签页方案对比", link: "/zh/web-advanced/web-api/cross-context-messaging/guide-line/multi-tab-patterns" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/cross-context-messaging/reference" },
                    ],
                  },
                  {
                    text: "常用杂项 API",
                    collapsed: true,
                    link: "/zh/web-advanced/web-api/misc-apis/",
                    items: [
                      { text: "入门", link: "/zh/web-advanced/web-api/misc-apis/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "剪贴板与分享", link: "/zh/web-advanced/web-api/misc-apis/guide-line/clipboard-share" },
                          { text: "通知、页面状态与唤醒锁", link: "/zh/web-advanced/web-api/misc-apis/guide-line/notification-visibility-wake" },
                          { text: "定位、URL 与其他", link: "/zh/web-advanced/web-api/misc-apis/guide-line/geolocation-url-others" },
                          { text: "权限模型与工程模式", link: "/zh/web-advanced/web-api/misc-apis/guide-line/permissions-patterns" },
                        ],
                      },
                      { text: "参考", link: "/zh/web-advanced/web-api/misc-apis/reference" },
                    ],
                  },
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
                  {
                    text: "Astryx",
                    collapsed: true,
                    link: "/zh/frontend-framework/components/astryx/",
                    items: [
                      { text: "入门", link: "/zh/frontend-framework/components/astryx/getting-started" },
                      { text: "指南", link: "/zh/frontend-framework/components/astryx/guide-line" },
                      { text: "参考", link: "/zh/frontend-framework/components/astryx/reference" },
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
                  {
                    text: "API Extractor",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/documentation-generator/api-extractor/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/documentation-generator/api-extractor/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "三大输出",
                            link: "/zh/frontend-develop-tools/documentation-generator/api-extractor/guide-line/three-outputs.md",
                          },
                          {
                            text: "配置文件",
                            link: "/zh/frontend-develop-tools/documentation-generator/api-extractor/guide-line/config-file.md",
                          },
                          {
                            text: "发布标签与评审",
                            link: "/zh/frontend-develop-tools/documentation-generator/api-extractor/guide-line/release-tags-workflow.md",
                          },
                          {
                            text: "配合 TSDoc / api-documenter",
                            link: "/zh/frontend-develop-tools/documentation-generator/api-extractor/guide-line/tsdoc-and-documenter.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/documentation-generator/api-extractor/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Swagger UI",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/documentation-generator/swagger-ui/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/documentation-generator/swagger-ui/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "三种交付形态",
                            link: "/zh/frontend-develop-tools/documentation-generator/swagger-ui/guide-line/flavors.md",
                          },
                          {
                            text: "配置项",
                            link: "/zh/frontend-develop-tools/documentation-generator/swagger-ui/guide-line/configuration.md",
                          },
                          {
                            text: "Try it out 与 CORS",
                            link: "/zh/frontend-develop-tools/documentation-generator/swagger-ui/guide-line/tryitout-cors.md",
                          },
                          {
                            text: "OAuth 与选型",
                            link: "/zh/frontend-develop-tools/documentation-generator/swagger-ui/guide-line/oauth-and-comparison.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/documentation-generator/swagger-ui/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Redoc",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/documentation-generator/redoc/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/documentation-generator/redoc/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "接入方式",
                            link: "/zh/frontend-develop-tools/documentation-generator/redoc/guide-line/integration.md",
                          },
                          {
                            text: "配置项",
                            link: "/zh/frontend-develop-tools/documentation-generator/redoc/guide-line/configuration.md",
                          },
                          {
                            text: "厂商扩展",
                            link: "/zh/frontend-develop-tools/documentation-generator/redoc/guide-line/vendor-extensions.md",
                          },
                          {
                            text: "开源与商业",
                            link: "/zh/frontend-develop-tools/documentation-generator/redoc/guide-line/open-source-vs-commercial.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/documentation-generator/redoc/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Scalar",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/documentation-generator/scalar/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/documentation-generator/scalar/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "接入方式",
                            link: "/zh/frontend-develop-tools/documentation-generator/scalar/guide-line/integration.md",
                          },
                          {
                            text: "配置对象",
                            link: "/zh/frontend-develop-tools/documentation-generator/scalar/guide-line/configuration.md",
                          },
                          {
                            text: "API 客户端与 CORS",
                            link: "/zh/frontend-develop-tools/documentation-generator/scalar/guide-line/api-client-cors.md",
                          },
                          {
                            text: "主题与选型",
                            link: "/zh/frontend-develop-tools/documentation-generator/scalar/guide-line/themes-comparison.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/documentation-generator/scalar/reference.md",
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
                  {
                    text: "Vitest",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/unit-testing/vitest/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/unit-testing/vitest/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/vitest/guide-line/configuration.md",
                          },
                          {
                            text: "测试 API",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/vitest/guide-line/test-api.md",
                          },
                          {
                            text: "断言",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/vitest/guide-line/assertions.md",
                          },
                          {
                            text: "模拟",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/vitest/guide-line/mocking.md",
                          },
                          {
                            text: "从 Jest 迁移",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/vitest/guide-line/migration.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/unit-testing/vitest/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Jest",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/unit-testing/jest/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/unit-testing/jest/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/jest/guide-line/configuration.md",
                          },
                          {
                            text: "测试 API",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/jest/guide-line/test-api.md",
                          },
                          {
                            text: "断言与快照",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/jest/guide-line/assertions.md",
                          },
                          {
                            text: "模拟",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/jest/guide-line/mocking.md",
                          },
                          {
                            text: "ESM 与对照 Vitest",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/jest/guide-line/esm-and-vitest.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/unit-testing/jest/reference.md",
                      },
                    ],
                  },
                  {
                    text: "MSW",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/unit-testing/msw/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/unit-testing/msw/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "Handler",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/msw/guide-line/handlers.md",
                          },
                          {
                            text: "测试集成",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/msw/guide-line/testing.md",
                          },
                          {
                            text: "网络行为",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/msw/guide-line/network-behavior.md",
                          },
                          {
                            text: "迁移与对比",
                            link: "/zh/frontend-develop-tools/testing/unit-testing/msw/guide-line/migration.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/unit-testing/msw/reference.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "组件测试",
                collapsed: true,
                items: [
                  {
                    text: "Vue Test Utils",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/component-testing/vue-test-utils/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/component-testing/vue-test-utils/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "Wrapper API",
                            link: "/zh/frontend-develop-tools/testing/component-testing/vue-test-utils/guide-line/wrapper-api.md",
                          },
                          {
                            text: "Props 与事件",
                            link: "/zh/frontend-develop-tools/testing/component-testing/vue-test-utils/guide-line/props-events.md",
                          },
                          {
                            text: "异步与插槽",
                            link: "/zh/frontend-develop-tools/testing/component-testing/vue-test-utils/guide-line/async-slots.md",
                          },
                          {
                            text: "global 与 stub",
                            link: "/zh/frontend-develop-tools/testing/component-testing/vue-test-utils/guide-line/global-stubs.md",
                          },
                          {
                            text: "Router 与 Pinia",
                            link: "/zh/frontend-develop-tools/testing/component-testing/vue-test-utils/guide-line/router-pinia.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/component-testing/vue-test-utils/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Testing Library",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/component-testing/testing-library/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/component-testing/testing-library/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "查询",
                            link: "/zh/frontend-develop-tools/testing/component-testing/testing-library/guide-line/queries.md",
                          },
                          {
                            text: "user-event",
                            link: "/zh/frontend-develop-tools/testing/component-testing/testing-library/guide-line/user-event.md",
                          },
                          {
                            text: "异步与断言",
                            link: "/zh/frontend-develop-tools/testing/component-testing/testing-library/guide-line/async-matchers.md",
                          },
                          {
                            text: "与 VTU 的边界",
                            link: "/zh/frontend-develop-tools/testing/component-testing/testing-library/guide-line/vtu-boundary.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/component-testing/testing-library/reference.md",
                      },
                    ],
                  },
                  {
                    text: "@pinia/testing",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/component-testing/pinia-testing/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/component-testing/pinia-testing/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "选项",
                            link: "/zh/frontend-develop-tools/testing/component-testing/pinia-testing/guide-line/options.md",
                          },
                          {
                            text: "state 与断言",
                            link: "/zh/frontend-develop-tools/testing/component-testing/pinia-testing/guide-line/state-assertions.md",
                          },
                          {
                            text: "与 setActivePinia",
                            link: "/zh/frontend-develop-tools/testing/component-testing/pinia-testing/guide-line/setactivepinia.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/component-testing/pinia-testing/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Vitest Browser Mode",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/component-testing/vitest-browser-mode/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/component-testing/vitest-browser-mode/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置",
                            link: "/zh/frontend-develop-tools/testing/component-testing/vitest-browser-mode/guide-line/configuration.md",
                          },
                          {
                            text: "Locators",
                            link: "/zh/frontend-develop-tools/testing/component-testing/vitest-browser-mode/guide-line/locators.md",
                          },
                          {
                            text: "交互与断言",
                            link: "/zh/frontend-develop-tools/testing/component-testing/vitest-browser-mode/guide-line/interactivity.md",
                          },
                          {
                            text: "视觉回归与对比",
                            link: "/zh/frontend-develop-tools/testing/component-testing/vitest-browser-mode/guide-line/visual-vs-jsdom.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/component-testing/vitest-browser-mode/reference.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "端到端测试",
                collapsed: true,
                items: [
                  {
                    text: "Cypress",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/e2e-testing/cypress/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/cypress/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "命令与重试",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/cypress/guide-line/commands-retry.md",
                          },
                          {
                            text: "网络拦截",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/cypress/guide-line/network-intercept.md",
                          },
                          {
                            text: "自定义命令与会话",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/cypress/guide-line/custom-commands-session.md",
                          },
                          {
                            text: "组件测试",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/cypress/guide-line/component-testing.md",
                          },
                          {
                            text: "最佳实践与局限",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/cypress/guide-line/best-practices.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/cypress/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Playwright",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/e2e-testing/playwright/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/playwright/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "Locator 与自动等待",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/playwright/guide-line/locators.md",
                          },
                          {
                            text: "Web-First 断言",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/playwright/guide-line/assertions.md",
                          },
                          {
                            text: "网络与 Fixtures",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/playwright/guide-line/network-fixtures.md",
                          },
                          {
                            text: "并行与多浏览器",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/playwright/guide-line/parallel-projects.md",
                          },
                          {
                            text: "调试与 Trace",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/playwright/guide-line/debugging-trace.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/playwright/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Selenium",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/e2e-testing/selenium/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/selenium/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "定位与交互",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/selenium/guide-line/locators-interactions.md",
                          },
                          {
                            text: "等待策略",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/selenium/guide-line/waits.md",
                          },
                          {
                            text: "Grid 与 BiDi",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/selenium/guide-line/grid-bidi.md",
                          },
                          {
                            text: "最佳实践与对比",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/selenium/guide-line/best-practices.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/selenium/reference.md",
                      },
                    ],
                  },
                  {
                    text: "WebdriverIO",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/e2e-testing/webdriverio/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/webdriverio/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "选择器与命令",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/webdriverio/guide-line/selectors-commands.md",
                          },
                          {
                            text: "断言",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/webdriverio/guide-line/assertions.md",
                          },
                          {
                            text: "配置与 services",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/webdriverio/guide-line/config-services.md",
                          },
                          {
                            text: "Appium 与组件测试",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/webdriverio/guide-line/appium-component.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/webdriverio/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Puppeteer",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/e2e-testing/puppeteer/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/puppeteer/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "Page 与选择器",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/puppeteer/guide-line/page-selectors.md",
                          },
                          {
                            text: "Locator 与交互",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/puppeteer/guide-line/locator-interactions.md",
                          },
                          {
                            text: "截图、PDF 与网络",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/puppeteer/guide-line/screenshot-network.md",
                          },
                          {
                            text: "配测试与对比",
                            link: "/zh/frontend-develop-tools/testing/e2e-testing/puppeteer/guide-line/testing-comparison.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/e2e-testing/puppeteer/reference.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "测试方法与质量",
                collapsed: true,
                items: [
                  {
                    text: "AI 时代如何测试",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/test-quality/ai-era-testing/",
                    items: [
                      {
                        text: "流程变化",
                        link: "/zh/frontend-develop-tools/testing/test-quality/ai-era-testing/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "三方式对比",
                            link: "/zh/frontend-develop-tools/testing/test-quality/ai-era-testing/guide-line/three-approaches.md",
                          },
                          {
                            text: "原则与方法",
                            link: "/zh/frontend-develop-tools/testing/test-quality/ai-era-testing/guide-line/principles-and-methods.md",
                          },
                          {
                            text: "手工·场景与阶段",
                            link: "/zh/frontend-develop-tools/testing/test-quality/ai-era-testing/guide-line/when-manual.md",
                          },
                          {
                            text: "MCP·AI 跑 e2e",
                            link: "/zh/frontend-develop-tools/testing/test-quality/ai-era-testing/guide-line/when-mcp-ai.md",
                          },
                          {
                            text: "AI 写框架用例",
                            link: "/zh/frontend-develop-tools/testing/test-quality/ai-era-testing/guide-line/when-ai-cases.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/test-quality/ai-era-testing/reference.md",
                      },
                    ],
                  },
                  {
                    text: "代码覆盖率",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/test-quality/code-coverage/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/test-quality/code-coverage/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "指标与 Provider",
                            link: "/zh/frontend-develop-tools/testing/test-quality/code-coverage/guide-line/metrics-providers.md",
                          },
                          {
                            text: "Vitest 覆盖率",
                            link: "/zh/frontend-develop-tools/testing/test-quality/code-coverage/guide-line/vitest-coverage.md",
                          },
                          {
                            text: "Jest 覆盖率",
                            link: "/zh/frontend-develop-tools/testing/test-quality/code-coverage/guide-line/jest-coverage.md",
                          },
                          {
                            text: "阈值门禁与 CI",
                            link: "/zh/frontend-develop-tools/testing/test-quality/code-coverage/guide-line/thresholds-ci.md",
                          },
                          {
                            text: "反模式与最佳实践",
                            link: "/zh/frontend-develop-tools/testing/test-quality/code-coverage/guide-line/best-practices.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/test-quality/code-coverage/reference.md",
                      },
                    ],
                  },
                  {
                    text: "快照测试",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/test-quality/snapshot-testing/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/test-quality/snapshot-testing/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "三种快照写法",
                            link: "/zh/frontend-develop-tools/testing/test-quality/snapshot-testing/guide-line/snapshot-types.md",
                          },
                          {
                            text: "属性匹配器与序列化器",
                            link: "/zh/frontend-develop-tools/testing/test-quality/snapshot-testing/guide-line/property-matchers-serializers.md",
                          },
                          {
                            text: "快照管理",
                            link: "/zh/frontend-develop-tools/testing/test-quality/snapshot-testing/guide-line/managing-snapshots.md",
                          },
                          {
                            text: "Vitest vs Jest 差异",
                            link: "/zh/frontend-develop-tools/testing/test-quality/snapshot-testing/guide-line/vitest-vs-jest.md",
                          },
                          {
                            text: "最佳实践与反模式",
                            link: "/zh/frontend-develop-tools/testing/test-quality/snapshot-testing/guide-line/best-practices.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/test-quality/snapshot-testing/reference.md",
                      },
                    ],
                  },
                  {
                    text: "可访问性测试",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/test-quality/accessibility-testing/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/test-quality/accessibility-testing/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "概念与标准",
                            link: "/zh/frontend-develop-tools/testing/test-quality/accessibility-testing/guide-line/concepts-standards.md",
                          },
                          {
                            text: "axe-core 引擎",
                            link: "/zh/frontend-develop-tools/testing/test-quality/accessibility-testing/guide-line/axe-core.md",
                          },
                          {
                            text: "单元与组件接入",
                            link: "/zh/frontend-develop-tools/testing/test-quality/accessibility-testing/guide-line/unit-component.md",
                          },
                          {
                            text: "端到端接入",
                            link: "/zh/frontend-develop-tools/testing/test-quality/accessibility-testing/guide-line/e2e.md",
                          },
                          {
                            text: "CI 与批量扫描",
                            link: "/zh/frontend-develop-tools/testing/test-quality/accessibility-testing/guide-line/ci-scanning.md",
                          },
                          {
                            text: "Vue 实战与最佳实践",
                            link: "/zh/frontend-develop-tools/testing/test-quality/accessibility-testing/guide-line/best-practices.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/test-quality/accessibility-testing/reference.md",
                      },
                    ],
                  },
                  {
                    text: "视觉回归测试",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/test-quality/visual-regression/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/test-quality/visual-regression/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "概念与像素 diff 原理",
                            link: "/zh/frontend-develop-tools/testing/test-quality/visual-regression/guide-line/concepts-principles.md",
                          },
                          {
                            text: "Chromatic 云端方案",
                            link: "/zh/frontend-develop-tools/testing/test-quality/visual-regression/guide-line/chromatic.md",
                          },
                          {
                            text: "Playwright 视觉对比",
                            link: "/zh/frontend-develop-tools/testing/test-quality/visual-regression/guide-line/playwright-visual.md",
                          },
                          {
                            text: "其它工具对照",
                            link: "/zh/frontend-develop-tools/testing/test-quality/visual-regression/guide-line/tools-comparison.md",
                          },
                          {
                            text: "Vue 实战与最佳实践",
                            link: "/zh/frontend-develop-tools/testing/test-quality/visual-regression/guide-line/best-practices.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/test-quality/visual-regression/reference.md",
                      },
                    ],
                  },
                  {
                    text: "变异测试",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/test-quality/mutation-testing/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/test-quality/mutation-testing/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "概念与变异分数",
                            link: "/zh/frontend-develop-tools/testing/test-quality/mutation-testing/guide-line/concepts-and-score.md",
                          },
                          {
                            text: "变异体与算子",
                            link: "/zh/frontend-develop-tools/testing/test-quality/mutation-testing/guide-line/mutants-and-operators.md",
                          },
                          {
                            text: "StrykerJS 配置",
                            link: "/zh/frontend-develop-tools/testing/test-quality/mutation-testing/guide-line/strykerjs-config.md",
                          },
                          {
                            text: "Vue 实战",
                            link: "/zh/frontend-develop-tools/testing/test-quality/mutation-testing/guide-line/vue-practice.md",
                          },
                          {
                            text: "最佳实践与反模式",
                            link: "/zh/frontend-develop-tools/testing/test-quality/mutation-testing/guide-line/best-practices.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/test-quality/mutation-testing/reference.md",
                      },
                    ],
                  },
                  {
                    text: "属性测试",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/test-quality/property-testing/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/test-quality/property-testing/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "概念与范式",
                            link: "/zh/frontend-develop-tools/testing/test-quality/property-testing/guide-line/concepts-paradigm.md",
                          },
                          {
                            text: "Arbitraries 与 API",
                            link: "/zh/frontend-develop-tools/testing/test-quality/property-testing/guide-line/arbitraries-api.md",
                          },
                          {
                            text: "收缩与复现",
                            link: "/zh/frontend-develop-tools/testing/test-quality/property-testing/guide-line/shrinking-replay.md",
                          },
                          {
                            text: "框架集成与进阶",
                            link: "/zh/frontend-develop-tools/testing/test-quality/property-testing/guide-line/integration-advanced.md",
                          },
                          {
                            text: "最佳实践与反模式",
                            link: "/zh/frontend-develop-tools/testing/test-quality/property-testing/guide-line/best-practices.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/test-quality/property-testing/reference.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "其他工具",
                collapsed: true,
                items: [
                  {
                    text: "Faker.js",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/testing/other-tools/faker/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/testing/other-tools/faker/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "概念与历史",
                            link: "/zh/frontend-develop-tools/testing/other-tools/faker/guide-line/concepts-and-history.md",
                          },
                          {
                            text: "模块与 API",
                            link: "/zh/frontend-develop-tools/testing/other-tools/faker/guide-line/modules-api.md",
                          },
                          {
                            text: "确定性与 seed",
                            link: "/zh/frontend-develop-tools/testing/other-tools/faker/guide-line/determinism.md",
                          },
                          {
                            text: "helpers 与本地化",
                            link: "/zh/frontend-develop-tools/testing/other-tools/faker/guide-line/helpers-and-locale.md",
                          },
                          {
                            text: "测试实战",
                            link: "/zh/frontend-develop-tools/testing/other-tools/faker/guide-line/testing-practice.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/testing/other-tools/faker/reference.md",
                      },
                    ],
                  },
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
                  {
                    text: "Chrome DevTools",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/optimization/browser-tools/chrome-devtools/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/chrome-devtools/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "Elements 与样式",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/chrome-devtools/guide-line/elements-styles.md",
                          },
                          {
                            text: "Console 与 Sources",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/chrome-devtools/guide-line/console-sources.md",
                          },
                          {
                            text: "Network 与 Performance",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/chrome-devtools/guide-line/network-performance.md",
                          },
                          {
                            text: "Memory 与 Application",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/chrome-devtools/guide-line/memory-application.md",
                          },
                          {
                            text: "AI 与自动化",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/chrome-devtools/guide-line/ai-assistance.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/chrome-devtools/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Firefox Developer Tools",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/optimization/browser-tools/firefox-devtools/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/firefox-devtools/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "Inspector 与布局",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/firefox-devtools/guide-line/inspector-grid-flex.md",
                          },
                          {
                            text: "字体形状与兼容",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/firefox-devtools/guide-line/fonts-shapes-compat.md",
                          },
                          {
                            text: "可访问性检查",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/firefox-devtools/guide-line/accessibility.md",
                          },
                          {
                            text: "Console 与 Debugger",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/firefox-devtools/guide-line/console-debugger.md",
                          },
                          {
                            text: "网络存储与响应式",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/firefox-devtools/guide-line/network-storage.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/firefox-devtools/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Safari Web Inspector",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/optimization/browser-tools/safari-web-inspector/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/safari-web-inspector/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "iOS 远程调试",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/safari-web-inspector/guide-line/ios-remote-debugging.md",
                          },
                          {
                            text: "Elements 与样式",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/safari-web-inspector/guide-line/elements-styles.md",
                          },
                          {
                            text: "Console 与 Sources",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/safari-web-inspector/guide-line/console-sources.md",
                          },
                          {
                            text: "Network 与 Timelines",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/safari-web-inspector/guide-line/network-timelines.md",
                          },
                          {
                            text: "Storage 审计与图形",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/safari-web-inspector/guide-line/storage-audit-graphics.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/safari-web-inspector/reference.md",
                      },
                    ],
                  },
                  {
                    text: "React DevTools",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/optimization/browser-tools/react-devtools/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/react-devtools/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "组件树导航",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/react-devtools/guide-line/components-tree.md",
                          },
                          {
                            text: "Props/State/Hooks",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/react-devtools/guide-line/props-state-hooks.md",
                          },
                          {
                            text: "Profiler 性能剖析",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/react-devtools/guide-line/profiler.md",
                          },
                          {
                            text: "高亮重渲染与优化",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/react-devtools/guide-line/highlight-optimize.md",
                          },
                          {
                            text: "独立应用与 RN",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/react-devtools/guide-line/standalone-rn.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/react-devtools/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Vue DevTools",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/optimization/browser-tools/vue-devtools/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/vue-devtools/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "组件与状态",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/vue-devtools/guide-line/components-state.md",
                          },
                          {
                            text: "Pinia 与路由",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/vue-devtools/guide-line/pinia-router.md",
                          },
                          {
                            text: "Timeline 时间线",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/vue-devtools/guide-line/timeline.md",
                          },
                          {
                            text: "Inspector 与 Graph",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/vue-devtools/guide-line/inspector-graph.md",
                          },
                          {
                            text: "安装与三形态",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/vue-devtools/guide-line/setup-forms.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/vue-devtools/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Angular DevTools",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/optimization/browser-tools/angular-devtools/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/angular-devtools/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "组件与指令",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/angular-devtools/guide-line/components.md",
                          },
                          {
                            text: "Profiler 变更检测",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/angular-devtools/guide-line/profiler.md",
                          },
                          {
                            text: "Injector 注入树",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/angular-devtools/guide-line/injector-tree.md",
                          },
                          {
                            text: "Signals 与优化",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/angular-devtools/guide-line/signals-cd.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/angular-devtools/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Redux DevTools",
                    collapsed: true,
                    link: "/zh/frontend-develop-tools/optimization/browser-tools/redux-devtools/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/redux-devtools/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "时间旅行调试",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/redux-devtools/guide-line/time-travel.md",
                          },
                          {
                            text: "Action 与状态检查",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/redux-devtools/guide-line/action-state.md",
                          },
                          {
                            text: "跨库接入",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/redux-devtools/guide-line/integration.md",
                          },
                          {
                            text: "导入导出与技巧",
                            link: "/zh/frontend-develop-tools/optimization/browser-tools/redux-devtools/guide-line/import-export.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/frontend-develop-tools/optimization/browser-tools/redux-devtools/reference.md",
                      },
                    ],
                  },
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
                // 2026-07-02 选型调研定稿：占位 2 叶 → 7 叶
                // （spec: quiz-monorepo/docs/plans/20260702-frontend-arch-micro-frontend-trilogy.md）。
                // 产出一叶补一叶 link（text 占位约定）；原「single spa」错名统一为「single-spa」。
                text: "微前端框架",
                collapsed: true,
                items: [
                  {
                    text: "微前端基础",
                    collapsed: true,
                    link: "/zh/architecture/micro-frontend/mfe-basics/",
                    items: [
                      { text: "入门", link: "/zh/architecture/micro-frontend/mfe-basics/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "微前端是什么与为什么", link: "/zh/architecture/micro-frontend/mfe-basics/guide-line/what-why.md" },
                          { text: "适用判据与反判据", link: "/zh/architecture/micro-frontend/mfe-basics/guide-line/when-not-to-use.md" },
                          { text: "组合模式三分法", link: "/zh/architecture/micro-frontend/mfe-basics/guide-line/composition-patterns.md" },
                          { text: "路由分发与容器模式", link: "/zh/architecture/micro-frontend/mfe-basics/guide-line/routing-shell.md" },
                          { text: "与相邻方案的关系", link: "/zh/architecture/micro-frontend/mfe-basics/guide-line/relations.md" },
                          { text: "2026 选型全景", link: "/zh/architecture/micro-frontend/mfe-basics/guide-line/landscape-2026.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/architecture/micro-frontend/mfe-basics/reference.md" },
                    ],
                  },
                  {
                    text: "微前端核心机制",
                    collapsed: true,
                    link: "/zh/architecture/micro-frontend/mfe-mechanisms/",
                    items: [
                      { text: "入门", link: "/zh/architecture/micro-frontend/mfe-mechanisms/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "JS 沙箱谱系", link: "/zh/architecture/micro-frontend/mfe-mechanisms/guide-line/js-sandbox.md" },
                          { text: "CSS 隔离", link: "/zh/architecture/micro-frontend/mfe-mechanisms/guide-line/css-isolation.md" },
                          { text: "HTML entry 与资源加载", link: "/zh/architecture/micro-frontend/mfe-mechanisms/guide-line/html-entry-loading.md" },
                          { text: "应用间通信", link: "/zh/architecture/micro-frontend/mfe-mechanisms/guide-line/communication.md" },
                          { text: "依赖共享三路线", link: "/zh/architecture/micro-frontend/mfe-mechanisms/guide-line/dependency-sharing.md" },
                          { text: "预加载与性能代价", link: "/zh/architecture/micro-frontend/mfe-mechanisms/guide-line/perf-preload.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/architecture/micro-frontend/mfe-mechanisms/reference.md" },
                    ],
                  },
                  {
                    text: "single-spa",
                    collapsed: true,
                    link: "/zh/architecture/micro-frontend/single-spa/",
                    items: [
                      { text: "入门", link: "/zh/architecture/micro-frontend/single-spa/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "三种模块类型", link: "/zh/architecture/micro-frontend/single-spa/guide-line/three-types.md" },
                          { text: "生命周期协议", link: "/zh/architecture/micro-frontend/single-spa/guide-line/lifecycle-protocol.md" },
                          { text: "root config 与注册", link: "/zh/architecture/micro-frontend/single-spa/guide-line/root-config.md" },
                          { text: "import maps 工作流", link: "/zh/architecture/micro-frontend/single-spa/guide-line/import-maps-workflow.md" },
                          { text: "框架适配器", link: "/zh/architecture/micro-frontend/single-spa/guide-line/framework-adapters.md" },
                          { text: "现状与定位", link: "/zh/architecture/micro-frontend/single-spa/guide-line/status-positioning.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/architecture/micro-frontend/single-spa/reference.md" },
                    ],
                  },
                  {
                    text: "qiankun",
                    collapsed: true,
                    link: "/zh/architecture/micro-frontend/qiankun/",
                    items: [
                      { text: "入门", link: "/zh/architecture/micro-frontend/qiankun/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "核心 API", link: "/zh/architecture/micro-frontend/qiankun/guide-line/core-api.md" },
                          { text: "沙箱实现", link: "/zh/architecture/micro-frontend/qiankun/guide-line/sandbox-impl.md" },
                          { text: "样式隔离", link: "/zh/architecture/micro-frontend/qiankun/guide-line/style-isolation.md" },
                          { text: "HTML entry 与接入约束", link: "/zh/architecture/micro-frontend/qiankun/guide-line/html-entry-integration.md" },
                          { text: "Vite 与 ESM 之痛", link: "/zh/architecture/micro-frontend/qiankun/guide-line/vite-esm-pain.md" },
                          { text: "演进与现状", link: "/zh/architecture/micro-frontend/qiankun/guide-line/evolution-status.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/architecture/micro-frontend/qiankun/reference.md" },
                    ],
                  },
                  {
                    text: "wujie",
                    collapsed: true,
                    link: "/zh/architecture/micro-frontend/wujie/",
                    items: [
                      { text: "入门", link: "/zh/architecture/micro-frontend/wujie/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "iframe JS 沙箱", link: "/zh/architecture/micro-frontend/wujie/guide-line/iframe-sandbox.md" },
                          { text: "WebComponent 容器渲染", link: "/zh/architecture/micro-frontend/wujie/guide-line/wc-rendering.md" },
                          { text: "路由同步", link: "/zh/architecture/micro-frontend/wujie/guide-line/route-sync.md" },
                          { text: "保活与预加载", link: "/zh/architecture/micro-frontend/wujie/guide-line/keep-alive-preload.md" },
                          { text: "通信", link: "/zh/architecture/micro-frontend/wujie/guide-line/communication.md" },
                          { text: "v2.0 与现状", link: "/zh/architecture/micro-frontend/wujie/guide-line/v2-status.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/architecture/micro-frontend/wujie/reference.md" },
                    ],
                  },
                  {
                    text: "micro-app",
                    collapsed: true,
                    link: "/zh/architecture/micro-frontend/micro-app/",
                    items: [
                      { text: "入门", link: "/zh/architecture/micro-frontend/micro-app/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "CustomElement 容器", link: "/zh/architecture/micro-frontend/micro-app/guide-line/custom-element.md" },
                          { text: "with 沙箱（默认）", link: "/zh/architecture/micro-frontend/micro-app/guide-line/with-sandbox.md" },
                          { text: "iframe 沙箱模式", link: "/zh/architecture/micro-frontend/micro-app/guide-line/iframe-sandbox-mode.md" },
                          { text: "元素与样式隔离", link: "/zh/architecture/micro-frontend/micro-app/guide-line/element-style-isolation.md" },
                          { text: "数据通信", link: "/zh/architecture/micro-frontend/micro-app/guide-line/data-communication.md" },
                          { text: "1.0 RC 与现状", link: "/zh/architecture/micro-frontend/micro-app/guide-line/rc-status.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/architecture/micro-frontend/micro-app/reference.md" },
                    ],
                  },
                  {
                    text: "Module Federation",
                    collapsed: true,
                    link: "/zh/architecture/micro-frontend/module-federation/",
                    items: [
                      { text: "入门", link: "/zh/architecture/micro-frontend/module-federation/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "联邦概念与心智模型", link: "/zh/architecture/micro-frontend/module-federation/guide-line/federation-concepts.md" },
                          { text: "shared 版本治理", link: "/zh/architecture/micro-frontend/module-federation/guide-line/shared-governance.md" },
                          { text: "MF 2.0 运行时化", link: "/zh/architecture/micro-frontend/module-federation/guide-line/mf2-runtime.md" },
                          { text: "MF 2.0 生态", link: "/zh/architecture/micro-frontend/module-federation/guide-line/mf2-ecosystem.md" },
                          { text: "Native Federation", link: "/zh/architecture/micro-frontend/module-federation/guide-line/native-federation.md" },
                          { text: "与应用级方案的选型", link: "/zh/architecture/micro-frontend/module-federation/guide-line/vs-qiankun-selection.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/architecture/micro-frontend/module-federation/reference.md" },
                    ],
                  },
                ],
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
                  {
                    text: "React Native",
                    collapsed: true,
                    link: "/zh/mobile-desktop/mobile-framework/react-native/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/mobile-framework/react-native/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "新架构深潜", link: "/zh/mobile-desktop/mobile-framework/react-native/guide-line/new-architecture.md" },
                          { text: "样式与布局", link: "/zh/mobile-desktop/mobile-framework/react-native/guide-line/styling-layout.md" },
                          { text: "组件·列表·性能·动画", link: "/zh/mobile-desktop/mobile-framework/react-native/guide-line/components-lists-perf.md" },
                          { text: "Expo 工作流", link: "/zh/mobile-desktop/mobile-framework/react-native/guide-line/expo-workflow.md" },
                          { text: "EAS 与发布", link: "/zh/mobile-desktop/mobile-framework/react-native/guide-line/eas-release.md" },
                          { text: "工具链与导航", link: "/zh/mobile-desktop/mobile-framework/react-native/guide-line/tooling-navigation.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/mobile-framework/react-native/reference.md" },
                    ],
                  },
                  {
                    text: "Flutter",
                    collapsed: true,
                    link: "/zh/mobile-desktop/mobile-framework/flutter/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/mobile-framework/flutter/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "Dart 与 Widget", link: "/zh/mobile-desktop/mobile-framework/flutter/guide-line/dart-widgets.md" },
                          { text: "约束布局", link: "/zh/mobile-desktop/mobile-framework/flutter/guide-line/layout-constraints.md" },
                          { text: "状态管理", link: "/zh/mobile-desktop/mobile-framework/flutter/guide-line/state-management.md" },
                          { text: "渲染与 Impeller", link: "/zh/mobile-desktop/mobile-framework/flutter/guide-line/rendering-impeller.md" },
                          { text: "Dart 异步与热重载", link: "/zh/mobile-desktop/mobile-framework/flutter/guide-line/dart-async-hotreload.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/mobile-framework/flutter/reference.md" },
                    ],
                  },
                  {
                    text: "Capacitor",
                    collapsed: true,
                    link: "/zh/mobile-desktop/mobile-framework/capacitor/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/mobile-framework/capacitor/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "WebView 与原生桥", link: "/zh/mobile-desktop/mobile-framework/capacitor/guide-line/webview-architecture.md" },
                          { text: "原生工程即源码", link: "/zh/mobile-desktop/mobile-framework/capacitor/guide-line/native-projects.md" },
                          { text: "插件体系", link: "/zh/mobile-desktop/mobile-framework/capacitor/guide-line/plugins.md" },
                          { text: "CLI 与工作流", link: "/zh/mobile-desktop/mobile-framework/capacitor/guide-line/cli-workflow.md" },
                          { text: "对比 Cordova 与 Ionic", link: "/zh/mobile-desktop/mobile-framework/capacitor/guide-line/vs-cordova-ionic.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/mobile-framework/capacitor/reference.md" },
                    ],
                  },
                  {
                    text: "Ionic",
                    collapsed: true,
                    link: "/zh/mobile-desktop/mobile-framework/ionic/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/mobile-framework/ionic/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "组件与双 mode", link: "/zh/mobile-desktop/mobile-framework/ionic/guide-line/components-modes.md" },
                          { text: "主题", link: "/zh/mobile-desktop/mobile-framework/ionic/guide-line/theming.md" },
                          { text: "框架集成", link: "/zh/mobile-desktop/mobile-framework/ionic/guide-line/framework-integration.md" },
                          { text: "路由", link: "/zh/mobile-desktop/mobile-framework/ionic/guide-line/routing.md" },
                          { text: "对比 Capacitor", link: "/zh/mobile-desktop/mobile-framework/ionic/guide-line/vs-capacitor.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/mobile-framework/ionic/reference.md" },
                    ],
                  },
                  {
                    text: "Lynx",
                    collapsed: true,
                    link: "/zh/mobile-desktop/mobile-framework/lynx/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/mobile-framework/lynx/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "双线程架构", link: "/zh/mobile-desktop/mobile-framework/lynx/guide-line/dual-thread.md" },
                          { text: "ReactLynx", link: "/zh/mobile-desktop/mobile-framework/lynx/guide-line/reactlynx.md" },
                          { text: "现状与对比 RN", link: "/zh/mobile-desktop/mobile-framework/lynx/guide-line/status-vs-rn.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/mobile-framework/lynx/reference.md" },
                    ],
                  },
                ],
              },
              {
                text: "小程序",
                collapsed: true,
                items: [
                  {
                    text: "微信小程序",
                    collapsed: true,
                    link: "/zh/mobile-desktop/miniprogram/wechat-miniprogram/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/miniprogram/wechat-miniprogram/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "四文件结构", link: "/zh/mobile-desktop/miniprogram/wechat-miniprogram/guide-line/four-files.md" },
                          { text: "双线程架构", link: "/zh/mobile-desktop/miniprogram/wechat-miniprogram/guide-line/dual-thread.md" },
                          { text: "生命周期与 API", link: "/zh/mobile-desktop/miniprogram/wechat-miniprogram/guide-line/lifecycle-api.md" },
                          { text: "分包与云开发", link: "/zh/mobile-desktop/miniprogram/wechat-miniprogram/guide-line/subpackage-cloud.md" },
                          { text: "Skyline 与性能", link: "/zh/mobile-desktop/miniprogram/wechat-miniprogram/guide-line/skyline-perf.md" },
                          { text: "登录与支付", link: "/zh/mobile-desktop/miniprogram/wechat-miniprogram/guide-line/login-pay.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/miniprogram/wechat-miniprogram/reference.md" },
                    ],
                  },
                  {
                    text: "支付宝小程序",
                    collapsed: true,
                    link: "/zh/mobile-desktop/miniprogram/alipay-miniprogram/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/miniprogram/alipay-miniprogram/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "结构与视图", link: "/zh/mobile-desktop/miniprogram/alipay-miniprogram/guide-line/structure.md" },
                          { text: "事件与 API", link: "/zh/mobile-desktop/miniprogram/alipay-miniprogram/guide-line/events-api.md" },
                          { text: "登录与支付", link: "/zh/mobile-desktop/miniprogram/alipay-miniprogram/guide-line/login-pay.md" },
                          { text: "对比微信", link: "/zh/mobile-desktop/miniprogram/alipay-miniprogram/guide-line/vs-wechat.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/miniprogram/alipay-miniprogram/reference.md" },
                    ],
                  },
                  {
                    text: "抖音小程序",
                    collapsed: true,
                    link: "/zh/mobile-desktop/miniprogram/douyin-miniprogram/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/miniprogram/douyin-miniprogram/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "文件结构与视图层", link: "/zh/mobile-desktop/miniprogram/douyin-miniprogram/guide-line/structure.md" },
                          { text: "API 与生命周期", link: "/zh/mobile-desktop/miniprogram/douyin-miniprogram/guide-line/api-lifecycle.md" },
                          { text: "生态能力", link: "/zh/mobile-desktop/miniprogram/douyin-miniprogram/guide-line/features.md" },
                          { text: "对比微信", link: "/zh/mobile-desktop/miniprogram/douyin-miniprogram/guide-line/vs-wechat.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/miniprogram/douyin-miniprogram/reference.md" },
                    ],
                  },
                  {
                    text: "百度智能小程序",
                    collapsed: true,
                    link: "/zh/mobile-desktop/miniprogram/baidu-miniprogram/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/miniprogram/baidu-miniprogram/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "SWAN 框架", link: "/zh/mobile-desktop/miniprogram/baidu-miniprogram/guide-line/swan-framework.md" },
                          { text: "API 与搜索分发", link: "/zh/mobile-desktop/miniprogram/baidu-miniprogram/guide-line/api-distribution.md" },
                          { text: "现状与对比微信", link: "/zh/mobile-desktop/miniprogram/baidu-miniprogram/guide-line/status-vs-wechat.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/miniprogram/baidu-miniprogram/reference.md" },
                    ],
                  },
                  {
                    text: "QQ小程序",
                    collapsed: true,
                    link: "/zh/mobile-desktop/miniprogram/qq-miniprogram/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/miniprogram/qq-miniprogram/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "对比微信", link: "/zh/mobile-desktop/miniprogram/qq-miniprogram/guide-line/vs-wechat.md" },
                          { text: "登录与迁移", link: "/zh/mobile-desktop/miniprogram/qq-miniprogram/guide-line/login-migration.md" },
                          { text: "现状与定位", link: "/zh/mobile-desktop/miniprogram/qq-miniprogram/guide-line/status.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/miniprogram/qq-miniprogram/reference.md" },
                    ],
                  },
                  {
                    text: "uni-app",
                    collapsed: true,
                    link: "/zh/mobile-desktop/miniprogram/uni-app/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/miniprogram/uni-app/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "工程配置", link: "/zh/mobile-desktop/miniprogram/uni-app/guide-line/project-config.md" },
                          { text: "API 与组件", link: "/zh/mobile-desktop/miniprogram/uni-app/guide-line/api-components.md" },
                          { text: "条件编译", link: "/zh/mobile-desktop/miniprogram/uni-app/guide-line/conditional-compile.md" },
                          { text: "生命周期", link: "/zh/mobile-desktop/miniprogram/uni-app/guide-line/lifecycle.md" },
                          { text: "uni-app x", link: "/zh/mobile-desktop/miniprogram/uni-app/guide-line/uni-app-x.md" },
                          { text: "uniCloud", link: "/zh/mobile-desktop/miniprogram/uni-app/guide-line/unicloud.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/miniprogram/uni-app/reference.md" },
                    ],
                  },
                  {
                    text: "Taro",
                    collapsed: true,
                    link: "/zh/mobile-desktop/miniprogram/taro/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/miniprogram/taro/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "React 模型", link: "/zh/mobile-desktop/miniprogram/taro/guide-line/react-model.md" },
                          { text: "Hooks 与路由", link: "/zh/mobile-desktop/miniprogram/taro/guide-line/hooks-router.md" },
                          { text: "架构演进", link: "/zh/mobile-desktop/miniprogram/taro/guide-line/architecture.md" },
                          { text: "纯血鸿蒙", link: "/zh/mobile-desktop/miniprogram/taro/guide-line/harmony.md" },
                          { text: "构建配置", link: "/zh/mobile-desktop/miniprogram/taro/guide-line/build-config.md" },
                          { text: "对比 uni-app", link: "/zh/mobile-desktop/miniprogram/taro/guide-line/vs-uni-app.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/miniprogram/taro/reference.md" },
                    ],
                  },
                ],
              },
              {
                text: "桌面端框架",
                collapsed: true,
                items: [
                  {
                    text: "Electron",
                    collapsed: true,
                    link: "/zh/mobile-desktop/desktop-framework/electron/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/desktop-framework/electron/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "进程模型", link: "/zh/mobile-desktop/desktop-framework/electron/guide-line/process-model.md" },
                          { text: "IPC 通信", link: "/zh/mobile-desktop/desktop-framework/electron/guide-line/ipc.md" },
                          { text: "安全", link: "/zh/mobile-desktop/desktop-framework/electron/guide-line/security.md" },
                          { text: "打包分发", link: "/zh/mobile-desktop/desktop-framework/electron/guide-line/packaging.md" },
                          { text: "原生与生命周期", link: "/zh/mobile-desktop/desktop-framework/electron/guide-line/native-lifecycle.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/desktop-framework/electron/reference.md" },
                    ],
                  },
                  {
                    text: "Tauri",
                    collapsed: true,
                    link: "/zh/mobile-desktop/desktop-framework/tauri/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/desktop-framework/tauri/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "架构", link: "/zh/mobile-desktop/desktop-framework/tauri/guide-line/architecture.md" },
                          { text: "命令与 IPC", link: "/zh/mobile-desktop/desktop-framework/tauri/guide-line/commands-ipc.md" },
                          { text: "权限系统", link: "/zh/mobile-desktop/desktop-framework/tauri/guide-line/permissions.md" },
                          { text: "分发", link: "/zh/mobile-desktop/desktop-framework/tauri/guide-line/distribute.md" },
                          { text: "对比 Electron", link: "/zh/mobile-desktop/desktop-framework/tauri/guide-line/vs-electron.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/desktop-framework/tauri/reference.md" },
                    ],
                  },
                  {
                    text: "Wails",
                    collapsed: true,
                    link: "/zh/mobile-desktop/desktop-framework/wails/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/desktop-framework/wails/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "架构", link: "/zh/mobile-desktop/desktop-framework/wails/guide-line/architecture.md" },
                          { text: "绑定与运行时", link: "/zh/mobile-desktop/desktop-framework/wails/guide-line/bindings-runtime.md" },
                          { text: "v2 vs v3", link: "/zh/mobile-desktop/desktop-framework/wails/guide-line/v2-vs-v3.md" },
                          { text: "构建", link: "/zh/mobile-desktop/desktop-framework/wails/guide-line/build.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/desktop-framework/wails/reference.md" },
                    ],
                  },
                  {
                    text: "Neutralino",
                    collapsed: true,
                    link: "/zh/mobile-desktop/desktop-framework/neutralino/",
                    items: [
                      { text: "入门", link: "/zh/mobile-desktop/desktop-framework/neutralino/getting-started.md" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "架构", link: "/zh/mobile-desktop/desktop-framework/neutralino/guide-line/architecture.md" },
                          { text: "API 与扩展", link: "/zh/mobile-desktop/desktop-framework/neutralino/guide-line/api-extensions.md" },
                          { text: "CLI·配置·模式", link: "/zh/mobile-desktop/desktop-framework/neutralino/guide-line/cli-config-modes.md" },
                          { text: "对比其它", link: "/zh/mobile-desktop/desktop-framework/neutralino/guide-line/vs-others.md" },
                        ],
                      },
                      { text: "参考", link: "/zh/mobile-desktop/desktop-framework/neutralino/reference.md" },
                    ],
                  },
                ],
              },
            ],
          },

          {
            // 🔒 2026-07-04 选型调研定案：8 组 27 叶，与 quiz categories.ts 对齐；
            //   未产出叶一律 text 占位（不建 md、不加 link），产出后 text→link
            text: "前端可视化",
            collapsed: false,
            items: [
              {
                text: "图形基础",
                collapsed: true,
                items: [
                {
                  text: "Canvas",
                  collapsed: true,
                  link: "/zh/frontend-visualization/canvas/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/canvas/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "绘图基础", link: "/zh/frontend-visualization/canvas/guide-line/drawing-basics" },
                        { text: "图像与像素", link: "/zh/frontend-visualization/canvas/guide-line/images-and-pixels" },
                        { text: "变换与状态", link: "/zh/frontend-visualization/canvas/guide-line/transforms-and-state" },
                        { text: "动画与交互", link: "/zh/frontend-visualization/canvas/guide-line/animation" },
                        { text: "性能优化", link: "/zh/frontend-visualization/canvas/guide-line/performance" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/canvas/reference" },
                  ],
                },
                {
                  text: "SVG",
                  collapsed: true,
                  link: "/zh/frontend-visualization/svg/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/svg/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "坐标与形状", link: "/zh/frontend-visualization/svg/guide-line/coordinates-and-shapes" },
                        { text: "路径", link: "/zh/frontend-visualization/svg/guide-line/paths" },
                        { text: "填充描边与渐变", link: "/zh/frontend-visualization/svg/guide-line/fills-strokes-gradients" },
                        { text: "结构与复用", link: "/zh/frontend-visualization/svg/guide-line/structure-and-reuse" },
                        { text: "动画与优化", link: "/zh/frontend-visualization/svg/guide-line/animation-and-optimization" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/svg/reference" },
                  ],
                },
                ],
              },
              {
                text: "图表",
                collapsed: true,
                items: [
                {
                  text: "ECharts",
                  collapsed: true,
                  link: "/zh/frontend-visualization/echarts/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/echarts/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "实例与 option", link: "/zh/frontend-visualization/echarts/guide-line/instance-and-option" },
                        { text: "dataset 与系列", link: "/zh/frontend-visualization/echarts/guide-line/dataset-and-series" },
                        { text: "交互与视觉", link: "/zh/frontend-visualization/echarts/guide-line/interaction-and-visual" },
                        { text: "性能与规模化", link: "/zh/frontend-visualization/echarts/guide-line/performance-and-scale" },
                        { text: "v6 新特性", link: "/zh/frontend-visualization/echarts/guide-line/v6-features" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/echarts/reference" },
                  ],
                },
                {
                  text: "D3.js",
                  collapsed: true,
                  link: "/zh/frontend-visualization/d3/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/d3/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "选择集与数据绑定", link: "/zh/frontend-visualization/d3/guide-line/selection-and-data" },
                        { text: "比例尺与坐标轴", link: "/zh/frontend-visualization/d3/guide-line/scales-and-axes" },
                        { text: "形状与层级布局", link: "/zh/frontend-visualization/d3/guide-line/shapes-and-layouts" },
                        { text: "力导向图", link: "/zh/frontend-visualization/d3/guide-line/force-simulation" },
                        { text: "过渡与交互", link: "/zh/frontend-visualization/d3/guide-line/interaction-and-transition" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/d3/reference" },
                  ],
                },
                {
                  text: "Chart.js",
                  collapsed: true,
                  link: "/zh/frontend-visualization/chartjs/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/chartjs/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "数据与 options", link: "/zh/frontend-visualization/chartjs/guide-line/data-and-options" },
                        { text: "坐标轴与交互", link: "/zh/frontend-visualization/chartjs/guide-line/scales-and-interactions" },
                        { text: "插件与自定义", link: "/zh/frontend-visualization/chartjs/guide-line/plugins-and-custom" },
                        { text: "性能优化", link: "/zh/frontend-visualization/chartjs/guide-line/performance" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/chartjs/reference" },
                  ],
                },
                {
                  text: "Recharts",
                  collapsed: true,
                  link: "/zh/frontend-visualization/recharts/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/recharts/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "图表类型与数据", link: "/zh/frontend-visualization/recharts/guide-line/charts-and-data" },
                        { text: "坐标轴与 domain", link: "/zh/frontend-visualization/recharts/guide-line/axes-and-domain" },
                        { text: "Tooltip 与 Legend", link: "/zh/frontend-visualization/recharts/guide-line/tooltip-legend-reference" },
                        { text: "自定义与性能", link: "/zh/frontend-visualization/recharts/guide-line/customization-and-performance" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/recharts/reference" },
                  ],
                },
                {
                  text: "AntV G2",
                  collapsed: true,
                  link: "/zh/frontend-visualization/antv-g2/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/antv-g2/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "标记与编码", link: "/zh/frontend-visualization/antv-g2/guide-line/marks-and-encode" },
                        { text: "转换与坐标系", link: "/zh/frontend-visualization/antv-g2/guide-line/transform-and-coordinate" },
                        { text: "比例尺与组件", link: "/zh/frontend-visualization/antv-g2/guide-line/scales-and-components" },
                        { text: "复合交互动画", link: "/zh/frontend-visualization/antv-g2/guide-line/composition-interaction-animation" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/antv-g2/reference" },
                  ],
                },
                {
                  text: "Mermaid",
                  collapsed: true,
                  link: "/zh/frontend-visualization/mermaid/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/mermaid/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "流程图与时序图", link: "/zh/frontend-visualization/mermaid/guide-line/flowchart-and-sequence" },
                        { text: "类图状态图 ER", link: "/zh/frontend-visualization/mermaid/guide-line/class-state-er" },
                        { text: "甘特 gitGraph", link: "/zh/frontend-visualization/mermaid/guide-line/gantt-git-and-more" },
                        { text: "配置 API 安全", link: "/zh/frontend-visualization/mermaid/guide-line/config-api-security" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/mermaid/reference" },
                  ],
                },
                ],
              },
              {
                text: "图与流程图",
                collapsed: true,
                items: [
                {
                  text: "AntV G6",
                  collapsed: true,
                  link: "/zh/frontend-visualization/antv-g6/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/antv-g6/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "图与元素", link: "/zh/frontend-visualization/antv-g6/guide-line/graph-and-elements" },
                        { text: "状态与交互", link: "/zh/frontend-visualization/antv-g6/guide-line/state-and-behavior" },
                        { text: "布局", link: "/zh/frontend-visualization/antv-g6/guide-line/layout" },
                        { text: "插件·算法·性能", link: "/zh/frontend-visualization/antv-g6/guide-line/plugins-algorithm-performance" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/antv-g6/reference" },
                  ],
                },
                {
                  text: "AntV X6",
                  collapsed: true,
                  link: "/zh/frontend-visualization/antv-x6/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/antv-x6/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "画布·节点·边", link: "/zh/frontend-visualization/antv-x6/guide-line/graph-nodes-edges" },
                        { text: "连接桩与连线", link: "/zh/frontend-visualization/antv-x6/guide-line/ports-and-connecting" },
                        { text: "交互与插件", link: "/zh/frontend-visualization/antv-x6/guide-line/interaction-and-plugins" },
                        { text: "自定义与数据", link: "/zh/frontend-visualization/antv-x6/guide-line/customization-and-data" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/antv-x6/reference" },
                  ],
                },
                ],
              },
              {
                text: "地图",
                collapsed: true,
                items: [
                {
                  text: "Leaflet",
                  collapsed: true,
                  link: "/zh/frontend-visualization/leaflet/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/leaflet/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "地图与瓦片", link: "/zh/frontend-visualization/leaflet/guide-line/map-and-tiles" },
                        { text: "标记与图形", link: "/zh/frontend-visualization/leaflet/guide-line/markers-and-vectors" },
                        { text: "GeoJSON 与图层", link: "/zh/frontend-visualization/leaflet/guide-line/geojson-and-layers" },
                        { text: "事件·交互·插件", link: "/zh/frontend-visualization/leaflet/guide-line/events-interaction-plugins" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/leaflet/reference" },
                  ],
                },
                {
                  text: "Mapbox GL JS 与 MapLibre",
                  collapsed: true,
                  link: "/zh/frontend-visualization/mapbox-maplibre/",
                  items: [
                    { text: "入门", link: "/zh/frontend-visualization/mapbox-maplibre/getting-started" },
                    {
                      text: "指南",
                      collapsed: true,
                      items: [
                        { text: "样式与数据源", link: "/zh/frontend-visualization/mapbox-maplibre/guide-line/style-and-sources" },
                        { text: "paint·layout·表达式", link: "/zh/frontend-visualization/mapbox-maplibre/guide-line/paint-layout-expressions" },
                        { text: "相机·图层·事件", link: "/zh/frontend-visualization/mapbox-maplibre/guide-line/camera-layers-events" },
                        { text: "GeoJSON·3D·生态", link: "/zh/frontend-visualization/mapbox-maplibre/guide-line/geojson-3d-ecosystem" },
                      ],
                    },
                    { text: "参考", link: "/zh/frontend-visualization/mapbox-maplibre/reference" },
                  ],
                },
                ],
              },
              {
                text: "三维",
                collapsed: true,
                items: [
                  {
                    text: "WebGL",
                    collapsed: true,
                    link: "/zh/frontend-visualization/webgl/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/webgl/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "管线与着色器", link: "/zh/frontend-visualization/webgl/guide-line/pipeline-and-shaders" },
                          { text: "缓冲与绘制", link: "/zh/frontend-visualization/webgl/guide-line/buffers-and-draw" },
                          { text: "纹理与变换", link: "/zh/frontend-visualization/webgl/guide-line/textures-and-transforms" },
                          { text: "WebGL2 与进阶", link: "/zh/frontend-visualization/webgl/guide-line/webgl2-and-advanced" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/webgl/reference" },
                    ],
                  },
                  {
                    text: "WebGPU",
                    collapsed: true,
                    link: "/zh/frontend-visualization/webgpu/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/webgpu/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "管线与 WGSL", link: "/zh/frontend-visualization/webgpu/guide-line/pipeline-and-wgsl" },
                          { text: "绑定与资源", link: "/zh/frontend-visualization/webgpu/guide-line/binding-and-resources" },
                          { text: "命令与计算", link: "/zh/frontend-visualization/webgpu/guide-line/commands-and-compute" },
                          { text: "性能与选型", link: "/zh/frontend-visualization/webgpu/guide-line/performance-and-webgl" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/webgpu/reference" },
                    ],
                  },
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
                  {
                    text: "Babylon.js",
                    collapsed: true,
                    link: "/zh/frontend-visualization/babylon/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/babylon/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "场景·相机·网格", link: "/zh/frontend-visualization/babylon/guide-line/scene-camera-mesh" },
                          { text: "材质·光照·纹理", link: "/zh/frontend-visualization/babylon/guide-line/materials-lights-textures" },
                          { text: "动画与物理", link: "/zh/frontend-visualization/babylon/guide-line/animation-physics" },
                          { text: "GUI·资产·后处理", link: "/zh/frontend-visualization/babylon/guide-line/gui-assets-postfx" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/babylon/reference" },
                    ],
                  },
                  {
                    text: "CesiumJS",
                    collapsed: true,
                    link: "/zh/frontend-visualization/cesium/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/cesium/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "Viewer 与坐标", link: "/zh/frontend-visualization/cesium/guide-line/viewer-and-coordinates" },
                          { text: "实体与图元", link: "/zh/frontend-visualization/cesium/guide-line/entity-and-primitive" },
                          { text: "影像·地形·3DTiles", link: "/zh/frontend-visualization/cesium/guide-line/imagery-terrain-3dtiles" },
                          { text: "时间动态与性能", link: "/zh/frontend-visualization/cesium/guide-line/time-dynamics-performance" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/cesium/reference" },
                    ],
                  },
                ],
              },
              {
                text: "2D 渲染引擎",
                collapsed: true,
                items: [
                  {
                    text: "PixiJS",
                    collapsed: true,
                    link: "/zh/frontend-visualization/pixi/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/pixi/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "应用与场景", link: "/zh/frontend-visualization/pixi/guide-line/app-and-scene" },
                          { text: "图形·文本·资产", link: "/zh/frontend-visualization/pixi/guide-line/graphics-text-assets" },
                          { text: "事件·Ticker·滤镜", link: "/zh/frontend-visualization/pixi/guide-line/events-ticker-filters" },
                          { text: "性能与迁移", link: "/zh/frontend-visualization/pixi/guide-line/performance-and-migration" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/pixi/reference" },
                    ],
                  },
                  {
                    text: "Fabric.js",
                    collapsed: true,
                    link: "/zh/frontend-visualization/fabric/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/fabric/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "画布与对象", link: "/zh/frontend-visualization/fabric/guide-line/canvas-and-objects" },
                          { text: "文本·图片·群组", link: "/zh/frontend-visualization/fabric/guide-line/text-image-group" },
                          { text: "交互与事件", link: "/zh/frontend-visualization/fabric/guide-line/interaction-and-events" },
                          { text: "序列化与自定义", link: "/zh/frontend-visualization/fabric/guide-line/serialization-and-custom" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/fabric/reference" },
                    ],
                  },
                  {
                    text: "Konva",
                    collapsed: true,
                    link: "/zh/frontend-visualization/konva/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/konva/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "舞台·图层·形状", link: "/zh/frontend-visualization/konva/guide-line/stage-layer-shape" },
                          { text: "事件·拖拽·变换", link: "/zh/frontend-visualization/konva/guide-line/events-drag-transform" },
                          { text: "动画与滤镜", link: "/zh/frontend-visualization/konva/guide-line/animation-filters" },
                          { text: "序列化·React·性能", link: "/zh/frontend-visualization/konva/guide-line/serialization-react-performance" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/konva/reference" },
                    ],
                  },
                ],
              },
              {
                text: "动画",
                collapsed: true,
                items: [
                  {
                    text: "Web Animations API",
                    collapsed: true,
                    link: "/zh/frontend-visualization/waapi/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/waapi/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "animate 与关键帧", link: "/zh/frontend-visualization/waapi/guide-line/animate-and-keyframes" },
                          { text: "动画控制", link: "/zh/frontend-visualization/waapi/guide-line/animation-control" },
                          { text: "时间线与合成", link: "/zh/frontend-visualization/waapi/guide-line/timeline-and-composite" },
                          { text: "滚动与互操作", link: "/zh/frontend-visualization/waapi/guide-line/scroll-and-interop" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/waapi/reference" },
                    ],
                  },
                  {
                    text: "GSAP",
                    collapsed: true,
                    link: "/zh/frontend-visualization/gsap/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/gsap/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "Tween 与缓动", link: "/zh/frontend-visualization/gsap/guide-line/tween-and-ease" },
                          { text: "时间线与 stagger", link: "/zh/frontend-visualization/gsap/guide-line/timeline-and-stagger" },
                          { text: "ScrollTrigger 与插件", link: "/zh/frontend-visualization/gsap/guide-line/scrolltrigger-and-plugins" },
                          { text: "框架与性能", link: "/zh/frontend-visualization/gsap/guide-line/framework-and-performance" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/gsap/reference" },
                    ],
                  },
                  {
                    text: "Framer Motion",
                    collapsed: true,
                    link: "/zh/frontend-visualization/framer-motion/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/framer-motion/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "组件与过渡", link: "/zh/frontend-visualization/framer-motion/guide-line/motion-and-transition" },
                          { text: "变体与手势", link: "/zh/frontend-visualization/framer-motion/guide-line/variants-and-gesture" },
                          { text: "退场与布局", link: "/zh/frontend-visualization/framer-motion/guide-line/presence-and-layout" },
                          { text: "MotionValue 与原生", link: "/zh/frontend-visualization/framer-motion/guide-line/motionvalue-and-vanilla" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/framer-motion/reference" },
                    ],
                  },
                  {
                    text: "Lottie",
                    collapsed: true,
                    link: "/zh/frontend-visualization/lottie/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/lottie/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "加载与渲染器", link: "/zh/frontend-visualization/lottie/guide-line/loadanimation-and-renderer" },
                          { text: "播放与事件", link: "/zh/frontend-visualization/lottie/guide-line/playback-and-events" },
                          { text: "dotLottie 与播放器", link: "/zh/frontend-visualization/lottie/guide-line/dotlottie-and-players" },
                          { text: "框架与优化", link: "/zh/frontend-visualization/lottie/guide-line/framework-and-optimization" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/lottie/reference" },
                    ],
                  },
                  {
                    text: "Anime.js",
                    collapsed: true,
                    link: "/zh/frontend-visualization/animejs/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/animejs/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "animate 与参数", link: "/zh/frontend-visualization/animejs/guide-line/animate-and-parameters" },
                          { text: "时间线与 stagger", link: "/zh/frontend-visualization/animejs/guide-line/timeline-and-stagger" },
                          { text: "SVG 与拖拽", link: "/zh/frontend-visualization/animejs/guide-line/svg-and-draggable" },
                          { text: "滚动·工具·缓动", link: "/zh/frontend-visualization/animejs/guide-line/scroll-utils-eases" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/animejs/reference" },
                    ],
                  },
                ],
              },
              {
                text: "拖拽",
                collapsed: true,
                items: [
                  {
                    text: "Sortable.js",
                    collapsed: true,
                    link: "/zh/frontend-visualization/sortablejs/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/sortablejs/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "配置与样式", link: "/zh/frontend-visualization/sortablejs/guide-line/options-and-styling" },
                          { text: "分组与事件", link: "/zh/frontend-visualization/sortablejs/guide-line/group-and-events" },
                          { text: "方法·插件·框架", link: "/zh/frontend-visualization/sortablejs/guide-line/methods-plugins-framework" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/sortablejs/reference" },
                    ],
                  },
                  {
                    text: "dnd-kit",
                    collapsed: true,
                    link: "/zh/frontend-visualization/dnd-kit/",
                    items: [
                      { text: "入门", link: "/zh/frontend-visualization/dnd-kit/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "上下文与 hooks", link: "/zh/frontend-visualization/dnd-kit/guide-line/context-and-hooks" },
                          { text: "Sortable 预设", link: "/zh/frontend-visualization/dnd-kit/guide-line/sortable-preset" },
                          { text: "传感器·修饰符·碰撞", link: "/zh/frontend-visualization/dnd-kit/guide-line/sensors-modifiers-collision" },
                          { text: "无障碍与模式", link: "/zh/frontend-visualization/dnd-kit/guide-line/accessibility-and-patterns" },
                        ],
                      },
                      { text: "参考", link: "/zh/frontend-visualization/dnd-kit/reference" },
                    ],
                  },
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
                    text: "CI/CD 核心机制",
                    collapsed: true,
                    link: "/zh/engineering/devops/cicd-core/",
                    items: [
                      { text: "入门", link: "/zh/engineering/devops/cicd-core/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "流水线模型", link: "/zh/engineering/devops/cicd-core/guide-line/pipeline-model" },
                          { text: "部署策略", link: "/zh/engineering/devops/cicd-core/guide-line/deploy-strategies" },
                          { text: "安全与供应链", link: "/zh/engineering/devops/cicd-core/guide-line/security-supply-chain" },
                          { text: "度量与实践", link: "/zh/engineering/devops/cicd-core/guide-line/metrics-practices" },
                        ],
                      },
                      { text: "参考", link: "/zh/engineering/devops/cicd-core/reference" },
                    ],
                  },
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
              {
                text: "容器",
                collapsed: true,
                items: [
                  {
                    text: "Docker",
                    collapsed: true,
                    link: "/zh/engineering/container/docker/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/container/docker/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "Dockerfile",
                            link: "/zh/engineering/container/docker/guide-line/dockerfile",
                          },
                          {
                            text: "存储与网络",
                            link: "/zh/engineering/container/docker/guide-line/storage-network",
                          },
                          {
                            text: "引擎架构",
                            link: "/zh/engineering/container/docker/guide-line/architecture",
                          },
                          {
                            text: "最佳实践",
                            link: "/zh/engineering/container/docker/guide-line/best-practice",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/container/docker/reference",
                      },
                    ],
                  },
                  {
                    text: "Docker Compose",
                    collapsed: true,
                    link: "/zh/engineering/container/docker-compose/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/container/docker-compose/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "服务配置",
                            link: "/zh/engineering/container/docker-compose/guide-line/services",
                          },
                          {
                            text: "网络与数据卷",
                            link: "/zh/engineering/container/docker-compose/guide-line/networking-volumes",
                          },
                          {
                            text: "环境变量与插值",
                            link: "/zh/engineering/container/docker-compose/guide-line/environment",
                          },
                          {
                            text: "进阶组合",
                            link: "/zh/engineering/container/docker-compose/guide-line/advanced",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/container/docker-compose/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "Monorepo",
                collapsed: true,
                items: [
                  {
                    text: "Lerna",
                    collapsed: true,
                    link: "/zh/engineering/monorepo/lerna/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/monorepo/lerna/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "版本与发布",
                            link: "/zh/engineering/monorepo/lerna/guide-line/versioning-publish.md",
                          },
                          {
                            text: "任务运行与 Nx 流水线",
                            link: "/zh/engineering/monorepo/lerna/guide-line/tasks-with-nx.md",
                          },
                          {
                            text: "缓存与分布式执行",
                            link: "/zh/engineering/monorepo/lerna/guide-line/caching-and-distribution.md",
                          },
                          {
                            text: "迁移与选型",
                            link: "/zh/engineering/monorepo/lerna/guide-line/migration-selection.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/monorepo/lerna/reference.md",
                      },
                    ],
                  },
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
                  {
                    text: "Nx",
                    collapsed: true,
                    link: "/zh/engineering/monorepo/nx/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/monorepo/nx/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "计算缓存与哈希",
                            link: "/zh/engineering/monorepo/nx/guide-line/caching.md",
                          },
                          {
                            text: "任务编排与管道",
                            link: "/zh/engineering/monorepo/nx/guide-line/task-pipeline.md",
                          },
                          {
                            text: "插件、执行器与生成器",
                            link: "/zh/engineering/monorepo/nx/guide-line/plugins-generators.md",
                          },
                          {
                            text: "规模化与治理",
                            link: "/zh/engineering/monorepo/nx/guide-line/scale-governance.md",
                          },
                          {
                            text: "Nx Cloud 与分布式 CI",
                            link: "/zh/engineering/monorepo/nx/guide-line/nx-cloud.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/monorepo/nx/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Rush",
                    collapsed: true,
                    link: "/zh/engineering/monorepo/rush/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/monorepo/rush/getting-started.md",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "依赖治理",
                            link: "/zh/engineering/monorepo/rush/guide-line/dependencies.md",
                          },
                          {
                            text: "增量构建与缓存",
                            link: "/zh/engineering/monorepo/rush/guide-line/build-cache.md",
                          },
                          {
                            text: "受控发布",
                            link: "/zh/engineering/monorepo/rush/guide-line/publishing.md",
                          },
                          {
                            text: "生态与扩展",
                            link: "/zh/engineering/monorepo/rush/guide-line/ecosystem.md",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/monorepo/rush/reference.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "版本发布自动化",
                collapsed: true,
                items: [
                  {
                    text: "Changesets",
                    collapsed: true,
                    link: "/zh/engineering/release/changesets/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/release/changesets/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "工作流",
                            link: "/zh/engineering/release/changesets/guide-line/workflow",
                          },
                          {
                            text: "配置",
                            link: "/zh/engineering/release/changesets/guide-line/config",
                          },
                          {
                            text: "Monorepo",
                            link: "/zh/engineering/release/changesets/guide-line/monorepo",
                          },
                          {
                            text: "预发布与 CI",
                            link: "/zh/engineering/release/changesets/guide-line/prerelease-ci",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/release/changesets/reference",
                      },
                    ],
                  },
                  {
                    text: "semantic-release",
                    collapsed: true,
                    link: "/zh/engineering/release/semantic-release/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/release/semantic-release/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "配置与 CI 集成",
                            link: "/zh/engineering/release/semantic-release/guide-line/configuration",
                          },
                          {
                            text: "插件与发布生命周期",
                            link: "/zh/engineering/release/semantic-release/guide-line/plugins-lifecycle",
                          },
                          {
                            text: "分支与预发布",
                            link: "/zh/engineering/release/semantic-release/guide-line/branches-prerelease",
                          },
                          {
                            text: "选型与工程落地",
                            link: "/zh/engineering/release/semantic-release/guide-line/selection",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/release/semantic-release/reference",
                      },
                    ],
                  },
                  {
                    text: "release-please",
                    collapsed: true,
                    link: "/zh/engineering/release/release-please/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/release/release-please/getting-started",
                      },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          {
                            text: "Release PR 机制",
                            link: "/zh/engineering/release/release-please/guide-line/release-pr",
                          },
                          {
                            text: "monorepo 与 manifest",
                            link: "/zh/engineering/release/release-please/guide-line/monorepo-manifest",
                          },
                          {
                            text: "CI 接入与选型",
                            link: "/zh/engineering/release/release-please/guide-line/ci-selection",
                          },
                        ],
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/release/release-please/reference",
                      },
                    ],
                  },
                ],
              },
              {
                text: "依赖更新自动化",
                collapsed: true,
                items: [
                  {
                    text: "Renovate",
                    collapsed: true,
                    link: "/zh/engineering/deps/renovate/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/deps/renovate/getting-started.md",
                      },
                      {
                        text: "配置",
                        link: "/zh/engineering/deps/renovate/guide-line/config.md",
                      },
                      {
                        text: "进阶",
                        link: "/zh/engineering/deps/renovate/guide-line/advanced.md",
                      },
                      {
                        text: "安全与 Dependabot",
                        link: "/zh/engineering/deps/renovate/guide-line/security-vs-dependabot.md",
                      },
                      {
                        text: "自托管",
                        link: "/zh/engineering/deps/renovate/guide-line/self-hosting.md",
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/deps/renovate/reference.md",
                      },
                    ],
                  },
                  {
                    text: "Dependabot",
                    collapsed: true,
                    link: "/zh/engineering/deps/dependabot/",
                    items: [
                      {
                        text: "入门",
                        link: "/zh/engineering/deps/dependabot/getting-started.md",
                      },
                      {
                        text: "配置详解",
                        link: "/zh/engineering/deps/dependabot/guide-line/config.md",
                      },
                      {
                        text: "告警·安全·分组",
                        link: "/zh/engineering/deps/dependabot/guide-line/security-groups.md",
                      },
                      {
                        text: "与 Renovate 取舍",
                        link: "/zh/engineering/deps/dependabot/guide-line/vs-renovate.md",
                      },
                      {
                        text: "参考",
                        link: "/zh/engineering/deps/dependabot/reference.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "基础设施即代码（IaC）",
                collapsed: true,
                items: [
                  {
                    text: "Terraform",
                    collapsed: true,
                    link: "/zh/engineering/iac/terraform/",
                    items: [
                      { text: "入门", link: "/zh/engineering/iac/terraform/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "HCL 语言", link: "/zh/engineering/iac/terraform/guide-line/language" },
                          { text: "状态 state", link: "/zh/engineering/iac/terraform/guide-line/state" },
                          { text: "模块", link: "/zh/engineering/iac/terraform/guide-line/modules" },
                          { text: "生态与许可", link: "/zh/engineering/iac/terraform/guide-line/ecosystem" },
                        ],
                      },
                      { text: "参考", link: "/zh/engineering/iac/terraform/reference" },
                    ],
                  },
                  {
                    text: "OpenTofu",
                    collapsed: true,
                    link: "/zh/engineering/iac/opentofu/",
                    items: [
                      { text: "入门", link: "/zh/engineering/iac/opentofu/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "治理与许可", link: "/zh/engineering/iac/opentofu/guide-line/governance-license" },
                          { text: "兼容与 CLI", link: "/zh/engineering/iac/opentofu/guide-line/compatibility-cli" },
                          { text: "特性与迁移", link: "/zh/engineering/iac/opentofu/guide-line/features-migration" },
                        ],
                      },
                      { text: "参考", link: "/zh/engineering/iac/opentofu/reference" },
                    ],
                  },
                  {
                    text: "Pulumi",
                    collapsed: true,
                    link: "/zh/engineering/iac/pulumi/",
                    items: [
                      { text: "入门", link: "/zh/engineering/iac/pulumi/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "编程模型", link: "/zh/engineering/iac/pulumi/guide-line/programming-model" },
                          { text: "组件与复用", link: "/zh/engineering/iac/pulumi/guide-line/components-and-reuse" },
                          { text: "状态·配置·密钥", link: "/zh/engineering/iac/pulumi/guide-line/state-config-secrets" },
                          { text: "生态与选型", link: "/zh/engineering/iac/pulumi/guide-line/ecosystem-selection" },
                        ],
                      },
                      { text: "参考", link: "/zh/engineering/iac/pulumi/reference" },
                    ],
                  },
                  {
                    text: "Ansible",
                    collapsed: true,
                    link: "/zh/engineering/iac/ansible/",
                    items: [
                      { text: "入门", link: "/zh/engineering/iac/ansible/getting-started" },
                      {
                        text: "指南",
                        collapsed: true,
                        items: [
                          { text: "Playbook 与模块", link: "/zh/engineering/iac/ansible/guide-line/playbooks-modules" },
                          { text: "角色与集合", link: "/zh/engineering/iac/ansible/guide-line/roles-collections" },
                          { text: "变量与模板", link: "/zh/engineering/iac/ansible/guide-line/variables-templating" },
                          { text: "实践与选型", link: "/zh/engineering/iac/ansible/guide-line/practice-selection" },
                        ],
                      },
                      { text: "参考", link: "/zh/engineering/iac/ansible/reference" },
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
                        text: "规范、发现与创作",
                        collapsed: true,
                        items: [
                          {
                            text: "Agent Skills 规范与生态",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/agent-skills-spec/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/agent-skills-spec/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/agent-skills-spec/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/agent-skills-spec/reference" },
                            ],
                          },
                          {
                            text: "Skills CLI 与 find-skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/skills-cli-find-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/skills-cli-find-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/skills-cli-find-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/skills-cli-find-skills/reference" },
                            ],
                          },
                        ],
                      },
                      {
                        text: "工程方法与上下文管理",
                        collapsed: true,
                        items: [
                          {
                            text: "Superpowers",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/superpowers/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/superpowers/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/superpowers/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/superpowers/reference" },
                            ],
                          },
                          {
                            text: "Everything Claude Code",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/everything-claude-code/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/everything-claude-code/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/everything-claude-code/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/everything-claude-code/reference" },
                            ],
                          },
                          {
                            text: "Grill Me",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/grill-me/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/grill-me/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/grill-me/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/grill-me/reference" },
                            ],
                          },
                          {
                            text: "Grill With Docs",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/grill-with-docs/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/grill-with-docs/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/grill-with-docs/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/grill-with-docs/reference" },
                            ],
                          },
                          {
                            text: "gstack",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/gstack/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/gstack/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/gstack/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/gstack/reference" },
                            ],
                          },
                          {
                            text: "Compound Engineering",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/compound-engineering/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/compound-engineering/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/compound-engineering/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/compound-engineering/reference" },
                            ],
                          },
                          {
                            text: "GSD Core",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/gsd-core/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/gsd-core/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/gsd-core/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/gsd-core/reference" },
                            ],
                          },
                          {
                            text: "Addy Osmani Agent Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/addy-osmani-agent-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/addy-osmani-agent-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/addy-osmani-agent-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/addy-osmani-agent-skills/reference" },
                            ],
                          },
                          {
                            text: "BMAD Method",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/bmad-method/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/bmad-method/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/bmad-method/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/bmad-method/reference" },
                            ],
                          },
                          {
                            text: "Caveman",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/caveman/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/caveman/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/caveman/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/caveman/reference" },
                            ],
                          },
                        ],
                      },
                      {
                        text: "框架与应用开发",
                        collapsed: true,
                        items: [
                          {
                            text: "Web 框架与元框架",
                            collapsed: true,
                            items: [
                              {
                                text: "Vercel Agent Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/vercel-agent-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/vercel-agent-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/vercel-agent-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/vercel-agent-skills/reference" },
                                ],
                              },
                              {
                                text: "Next.js Workflow Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/nextjs-workflow-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/nextjs-workflow-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/nextjs-workflow-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/nextjs-workflow-skills/reference" },
                                ],
                              },
                              {
                                text: "Vue Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/vue-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/vue-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/vue-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/vue-skills/reference" },
                                ],
                              },
                              {
                                text: "Antfu Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/antfu-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/antfu-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/antfu-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/antfu-skills/reference" },
                                ],
                              },
                              {
                                text: "Nuxt Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/nuxt-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/nuxt-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/nuxt-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/nuxt-skills/reference" },
                                ],
                              },
                              {
                                text: "Angular Developer Skill",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/angular-developer-skill/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/angular-developer-skill/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/angular-developer-skill/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/angular-developer-skill/reference" },
                                ],
                              },
                              {
                                text: "Svelte AI Tools",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/svelte-ai-tools/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/svelte-ai-tools/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/svelte-ai-tools/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/svelte-ai-tools/reference" },
                                ],
                              },
                            ],
                          },
                          {
                            text: "路由、状态与数据流",
                            collapsed: true,
                            items: [
                              {
                                text: "React Router Skill",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/react-router-skill/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/react-router-skill/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/react-router-skill/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/react-router-skill/reference" },
                                ],
                              },
                              {
                                text: "TanStack Router & Start Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/tanstack-router-start-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/tanstack-router-start-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/tanstack-router-start-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/tanstack-router-start-skills/reference" },
                                ],
                              },
                              {
                                text: "Redux Toolkit Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/redux-toolkit-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/redux-toolkit-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/redux-toolkit-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/redux-toolkit-skills/reference" },
                                ],
                              },
                            ],
                          },
                          {
                            text: "组件系统",
                            collapsed: true,
                            items: [
                              {
                                text: "shadcn Skill",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/shadcn-skill/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/shadcn-skill/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/shadcn-skill/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/shadcn-skill/reference" },
                                ],
                              },
                              {
                                text: "Nuxt UI Skill",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/nuxt-ui-skill/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/nuxt-ui-skill/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/nuxt-ui-skill/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/nuxt-ui-skill/reference" },
                                ],
                              },
                            ],
                          },
                          {
                            text: "应用服务集成",
                            collapsed: true,
                            items: [
                              {
                                text: "Better Auth Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/better-auth-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/better-auth-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/better-auth-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/better-auth-skills/reference" },
                                ],
                              },
                              {
                                text: "Stripe Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/stripe-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/stripe-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/stripe-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/stripe-skills/reference" },
                                ],
                              },
                            ],
                          },
                          {
                            text: "移动与跨端",
                            collapsed: true,
                            items: [
                              {
                                text: "Expo Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/expo-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/expo-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/expo-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/expo-skills/reference" },
                                ],
                              },
                              {
                                text: "Callstack React Native Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/callstack-react-native-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/callstack-react-native-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/callstack-react-native-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/callstack-react-native-skills/reference" },
                                ],
                              },
                              {
                                text: "Software Mansion Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/software-mansion-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/software-mansion-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/software-mansion-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/software-mansion-skills/reference" },
                                ],
                              },
                              {
                                text: "Flutter Agent Plugins",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/flutter-agent-plugins/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/flutter-agent-plugins/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/flutter-agent-plugins/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/flutter-agent-plugins/reference" },
                                ],
                              },
                            ],
                          },
                          {
                            text: "后端框架与运行时",
                            collapsed: true,
                            items: [
                              {
                                text: "Matteo Collina Node.js Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/matteo-collina-nodejs-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/matteo-collina-nodejs-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/matteo-collina-nodejs-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/matteo-collina-nodejs-skills/reference" },
                                ],
                              },
                              {
                                text: "NestJS Best Practices",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/nestjs-best-practices/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/nestjs-best-practices/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/nestjs-best-practices/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/nestjs-best-practices/reference" },
                                ],
                              },
                              {
                                text: "Deno Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/deno-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/deno-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/deno-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/deno-skills/reference" },
                                ],
                              },
                            ],
                          },
                          {
                            text: "AI 应用开发",
                            collapsed: true,
                            items: [
                              {
                                text: "Vercel AI SDK Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/vercel-ai-sdk-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/vercel-ai-sdk-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/vercel-ai-sdk-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/vercel-ai-sdk-skills/reference" },
                                ],
                              },
                              {
                                text: "Mastra Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/mastra-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/mastra-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/mastra-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/mastra-skills/reference" },
                                ],
                              },
                              {
                                text: "LangChain & LangGraph Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/langchain-langgraph-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/langchain-langgraph-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/langchain-langgraph-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/langchain-langgraph-skills/reference" },
                                ],
                              },
                              {
                                text: "CopilotKit Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/copilotkit-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/copilotkit-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/copilotkit-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/copilotkit-skills/reference" },
                                ],
                              },
                              {
                                text: "assistant-ui Skills",
                                collapsed: true,
                                link: "/zh/large-language-model/skills/assistant-ui-skills/",
                                items: [
                                  { text: "入门", link: "/zh/large-language-model/skills/assistant-ui-skills/getting-started" },
                                  { text: "指南", link: "/zh/large-language-model/skills/assistant-ui-skills/guide-line" },
                                  { text: "参考", link: "/zh/large-language-model/skills/assistant-ui-skills/reference" },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    text: "数据库与数据工程",
                    collapsed: true,
                    items: [
                      {
                        text: "Supabase Agent Skills",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/supabase-agent-skills/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/supabase-agent-skills/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/supabase-agent-skills/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/supabase-agent-skills/reference" },
                        ],
                      },
                      {
                        text: "Firebase Agent Skills",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/firebase-agent-skills/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/firebase-agent-skills/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/firebase-agent-skills/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/firebase-agent-skills/reference" },
                        ],
                      },
                      {
                        text: "Prisma Skills",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/prisma-skills/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/prisma-skills/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/prisma-skills/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/prisma-skills/reference" },
                        ],
                      },
                      {
                        text: "dbt Agent Skills",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/dbt-agent-skills/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/dbt-agent-skills/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/dbt-agent-skills/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/dbt-agent-skills/reference" },
                        ],
                      },
                      {
                        text: "ClickHouse Agent Skills",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/clickhouse-agent-skills/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/clickhouse-agent-skills/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/clickhouse-agent-skills/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/clickhouse-agent-skills/reference" },
                        ],
                      },
                      {
                        text: "DuckDB Skills",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/duckdb-skills/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/duckdb-skills/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/duckdb-skills/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/duckdb-skills/reference" },
                        ],
                      },
                    ],
                  },
                  {
                    text: "云原生、DevOps 与可观测性",
                    collapsed: true,
                    items: [
                      {
                        text: "Azure Skills Plugin",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/azure-skills-plugin/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/azure-skills-plugin/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/azure-skills-plugin/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/azure-skills-plugin/reference" },
                        ],
                      },
                      {
                        text: "AWS Agent Toolkit",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/aws-agent-toolkit/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/aws-agent-toolkit/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/aws-agent-toolkit/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/aws-agent-toolkit/reference" },
                        ],
                      },
                      {
                        text: "Cloudflare Skills",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/cloudflare-skills/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/cloudflare-skills/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/cloudflare-skills/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/cloudflare-skills/reference" },
                        ],
                      },
                      {
                        text: "HashiCorp Agent Skills",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/hashicorp-agent-skills/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/hashicorp-agent-skills/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/hashicorp-agent-skills/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/hashicorp-agent-skills/reference" },
                        ],
                      },
                      {
                        text: "可观测性 Skills",
                        collapsed: true,
                        link: "/zh/large-language-model/skills/observability-skills/",
                        items: [
                          { text: "入门", link: "/zh/large-language-model/skills/observability-skills/getting-started" },
                          { text: "指南", link: "/zh/large-language-model/skills/observability-skills/guide-line" },
                          { text: "参考", link: "/zh/large-language-model/skills/observability-skills/reference" },
                        ],
                      },
                      {
                        text: "设计、Web 质量与多媒体",
                        collapsed: true,
                        items: [
                          {
                            text: "Impeccable",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/impeccable/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/impeccable/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/impeccable/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/impeccable/reference" },
                            ],
                          },
                          {
                            text: "Web Quality Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/web-quality-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/web-quality-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/web-quality-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/web-quality-skills/reference" },
                            ],
                          },
                          {
                            text: "Remotion Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/remotion-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/remotion-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/remotion-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/remotion-skills/reference" },
                            ],
                          },
                          {
                            text: "HyperFrames",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/hyperframes/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/hyperframes/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/hyperframes/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/hyperframes/reference" },
                            ],
                          },
                        ],
                      },
                      {
                        text: "浏览器、测试与检索自动化",
                        collapsed: true,
                        items: [
                          {
                            text: "Agent Browser",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/agent-browser/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/agent-browser/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/agent-browser/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/agent-browser/reference" },
                            ],
                          },
                          {
                            text: "Playwright CLI",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/playwright-cli/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/playwright-cli/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/playwright-cli/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/playwright-cli/reference" },
                            ],
                          },
                          {
                            text: "Browser Use",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/browser-use/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/browser-use/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/browser-use/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/browser-use/reference" },
                            ],
                          },
                          {
                            text: "Firecrawl CLI",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/firecrawl-cli/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/firecrawl-cli/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/firecrawl-cli/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/firecrawl-cli/reference" },
                            ],
                          },
                        ],
                      },
                      {
                        text: "安全审计与供应链治理",
                        collapsed: true,
                        items: [
                          {
                            text: "Skill 安全与供应链治理",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/skill-security-supply-chain/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/skill-security-supply-chain/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/skill-security-supply-chain/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/skill-security-supply-chain/reference" },
                            ],
                          },
                          {
                            text: "Trail of Bits Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/trail-of-bits-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/trail-of-bits-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/trail-of-bits-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/trail-of-bits-skills/reference" },
                            ],
                          },
                        ],
                      },
                      {
                        text: "AI / ML 与科研工作流",
                        collapsed: true,
                        items: [
                          {
                            text: "Hugging Face Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/huggingface-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/huggingface-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/huggingface-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/huggingface-skills/reference" },
                            ],
                          },
                          {
                            text: "Gemini Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/gemini-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/gemini-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/gemini-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/gemini-skills/reference" },
                            ],
                          },
                          {
                            text: "Google DeepMind Science Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/deepmind-science-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/deepmind-science-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/deepmind-science-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/deepmind-science-skills/reference" },
                            ],
                          },
                          {
                            text: "AI 论文复现 Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/ai-paper-reproduction-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/ai-paper-reproduction-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/ai-paper-reproduction-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/ai-paper-reproduction-skills/reference" },
                            ],
                          },
                        ],
                      },
                      {
                        text: "文档、办公与业务工作流",
                        collapsed: true,
                        items: [
                          {
                            text: "Anthropic Knowledge Work Plugins",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/anthropic-knowledge-work/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/anthropic-knowledge-work/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/anthropic-knowledge-work/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/anthropic-knowledge-work/reference" },
                            ],
                          },
                          {
                            text: "Google Workspace CLI Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/google-workspace-cli/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/google-workspace-cli/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/google-workspace-cli/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/google-workspace-cli/reference" },
                            ],
                          },
                          {
                            text: "Lark / 飞书 CLI Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/lark-feishu-cli/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/lark-feishu-cli/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/lark-feishu-cli/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/lark-feishu-cli/reference" },
                            ],
                          },
                          {
                            text: "Marketing Skills",
                            collapsed: true,
                            link: "/zh/large-language-model/skills/marketing-skills/",
                            items: [
                              { text: "入门", link: "/zh/large-language-model/skills/marketing-skills/getting-started" },
                              { text: "指南", link: "/zh/large-language-model/skills/marketing-skills/guide-line" },
                              { text: "参考", link: "/zh/large-language-model/skills/marketing-skills/reference" },
                            ],
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
