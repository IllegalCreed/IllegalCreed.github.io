---
layout: doc
---

# Less

**Less（Leaner Style Sheets）** 是一门**向后兼容 CSS 的语言扩展**，也就是俗称的「CSS 预处理器」——用 `@变量`、混合（mixin）、嵌套、运算、颜色函数等能力扩展 CSS，再由编译器输出成标准 CSS。它由 **JavaScript 实现**（Node 与浏览器都能跑），官方口号是「It's CSS, with just a little more」。当前稳定版本 **Less 4.6.7**（核于 2026-07）。Less 最大的气质是「贴近 CSS、学习成本低」：几乎所有合法 CSS 都是合法 Less，你可以把 `.css` 改名 `.less` 就地起步，再逐步引入预处理特性。它诞生于 2009 年，早期因 Bootstrap 3、Ant Design 等明星项目而大热；如今语言特性趋于成熟稳定、版本仍在维护，但在**新项目预处理器选型**上，声量已让位于 Sass/SCSS、PostCSS 与不断增强的**原生 CSS**（自定义属性、嵌套、`@layer`、`color-mix()`）。理解 Less，既是读懂海量存量代码库（尤其 Ant Design 生态）的必备，也是横向对比预处理器设计取舍的好样本。

::: tip 边界说明
本页只讲 **Less 这一层工具**（预处理器语言特性、编译方式、与 Sass 的对比）。原生 CSS 的语法、层叠、自定义属性等归「Web 基础」章，本叶不重复展开，仅在辨析处点到。
:::

## 评价

**优点**

- **贴近 CSS、上手极快**：向后兼容，合法 CSS 基本就是合法 Less；改扩展名即可渐进迁移，团队学习成本低
- **JS 实现、集成顺畅**：Node/浏览器双端可跑，`lessc` CLI、`less.render()` 编程 API、`less-loader`/Vite 插件等构建集成成熟
- **核心特性齐全**：变量、嵌套与父选择器 `&`、参数化混合、守卫、颜色函数、`@import` 精细选项、命名空间、映射、`:extend`，覆盖日常样式复用需求
- **主题定制友好**：`--modify-var` / `modifyVars` 支持外部覆盖变量，一套源码产出多主题（Ant Design 早期主题定制的招牌能力）
- **稳定成熟、存量庞大**：语言多年趋稳，老项目多、迁移风险可控；文档完整、行为可预期

**缺点**

- **无正式模块系统**：不像 Sass（Dart Sass）有 `@use`/`@forward`，Less 只能用 `@import (reference)` 近似「按需引用」，大型工程的命名隔离与依赖管理偏弱
- **控制流较弱**：没有 `@if`/`@each`/`@for`/`@function` 等真正的指令，条件与循环靠**守卫混合 + 递归 + `each()`** 拼凑，写复杂逻辑不如 Sass 直观
- **变量语义反直觉**：惰性求值 + 「最后定义生效」，同作用域重定义会让整个作用域取最后一次值，是新手高频踩坑点
- **生态热度相对停滞**：新项目更倾向 Sass/PostCSS；Bootstrap 从 v4 起转 Sass、Ant Design v5 起转 CSS-in-JS 设计令牌，风向标项目在流失
- **易与 CSS 自定义属性混淆**：`@var`（编译期静态）与 `--var`（运行时可变）本质不同，混用/误用会导致预期外行为

## 文档地址

[lesscss.org 官方站](https://lesscss.org/) ｜ [语言特性 Features](https://lesscss.org/features/) ｜ [内置函数 Functions](https://lesscss.org/functions/) ｜ [使用方式 Usage](https://lesscss.org/usage/)

## GitHub 地址

[less/less.js](https://github.com/less/less.js) ｜ [less-loader](https://github.com/webpack-contrib/less-loader) ｜ [Releases](https://github.com/less/less.js/releases)

## 幻灯片地址

<a href="/SlideStack/less-slide/" target="_blank">Less</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=less" target="_blank" rel="noopener noreferrer">Less 测试题</a>
