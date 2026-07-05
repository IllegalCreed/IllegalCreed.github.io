---
layout: doc
---

# PostCSS

**A tool for transforming CSS with JavaScript**——PostCSS 不是一门语言，也不是 Sass 那样的预处理器，而是一个**用 JavaScript 插件转换 CSS 的工具 / AST 平台**（当前稳定版 **8.5.16**，2026-06 发布）。它的心智模型极简：把一段 CSS **解析（parse）成抽象语法树（AST）** → 交给一组 JS **插件遍历、增删改节点** → 再**序列化（stringify）回 CSS**。输入是 CSS、输出还是 CSS，中间发生什么完全由你挂载的插件决定。PostCSS 本体「几乎什么都不做」——它只提供解析、遍历、序列化的骨架，真正干活的是插件：**Autoprefixer** 按目标浏览器自动补齐厂商前缀、**postcss-preset-env** 把未来 CSS 降级成兼容写法、**cssnano** 压缩体积、**postcss-import** 内联 `@import`、**stylelint** 校验、乃至 **Tailwind CSS** 生成原子类。正因为它是「平台」而非「功能集」，它能无缝插进 Vite / webpack 等构建流水线，与 Sass / Less 等预处理器**串联共存、各司其职**，成为现代前端样式工具链事实上的公共底座。

## 评价

**优点**

- **插件化、可组合**：核心只做 parse / traverse / stringify，能力全由插件拼装；一份 `postcss.config.js` 即可自由组合加前缀、降级、压缩、校验，按需增删
- **输入即标准 CSS，零学习门槛**：不像预处理器要学 `$变量`、`@mixin`，用现成插件时源码照写 CSS，转换悄悄发生在构建期
- **生态庞大、事实标准**：Autoprefixer、postcss-preset-env、cssnano、stylelint、Tailwind（v3/v4 PostCSS 通道）都建在其上，几乎所有构建工具原生集成
- **与预处理器/原子化不互斥**：Sass/Less 先编译、PostCSS 后处理，职责清晰、可串联；不是二选一的竞争关系
- **Browserslist 单一事实来源**：加前缀、未来 CSS 降级、安全压缩共享同一份目标浏览器配置，改一处全链路同步
- **可编程、可扩展**：用熟悉的 JS 就能写自定义转换插件，操作 DOM 风格的 AST 节点，还能替换 parser 直接解析 SCSS/Less 超集

**缺点**

- **本体不做任何事**：新手常误以为「装了 PostCSS 就自动加前缀/压缩」，实则不配插件等于原样输出——一切靠插件是心智门槛
- **插件顺序敏感**：`@import` 内联要靠前、加前缀居中、压缩垫底，顺序配错会导致后续插件处理不到应生成的内容
- **易与预处理器混淆**：常被错当成「另一个 Sass」，或被笼统贴上「过时/该换掉」标签，忽视了它是通用平台而非固定功能
- **纯固定任务上不如原生实现快**：只做加前缀/压缩这类固定活时，Rust 实现的 Lightning CSS 等更快（但它们不是任意 JS 插件平台）
- **写插件需懂 AST 与 re-visit 语义**：自定义插件要理解节点体系、访问器、幂等判重，否则易踩死循环等坑

## 文档地址

[postcss.org 官方站](https://postcss.org/) ｜ [API 文档](https://postcss.org/api/) ｜ [插件列表](https://github.com/postcss/postcss/blob/main/docs/plugins.md) ｜ [写插件指南](https://github.com/postcss/postcss/blob/main/docs/writing-a-plugin.md) ｜ [Browserslist](https://github.com/browserslist/browserslist)

## GitHub 地址

[postcss/postcss](https://github.com/postcss/postcss) ｜ [postcss/autoprefixer](https://github.com/postcss/autoprefixer) ｜ [csstools/postcss-preset-env](https://github.com/csstools/postcss-plugins/tree/main/plugin-packs/postcss-preset-env) ｜ [cssnano/cssnano](https://github.com/cssnano/cssnano)

## 幻灯片地址

<a href="/SlideStack/postcss-slide/" target="_blank">PostCSS</a>
