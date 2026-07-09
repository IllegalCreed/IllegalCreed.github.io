---
layout: doc
---

# Sass

**Syntactically Awesome Style Sheets**——历史最悠久、生态最成熟的 **CSS 预处理器**。它是一门「编译成 CSS 的样式表语言」：在完全兼容 CSS 的语法之上，补齐了变量、嵌套、混入（`@mixin`）、函数（`@function`）、继承（`@extend`）、控制流（`@if`/`@each`/`@for`/`@while`）以及现代**模块系统**（`@use`/`@forward`）等工程化能力，但浏览器并不认识 Sass——所有 `.scss`/`.sass` 都必须先由编译器转成普通 CSS。它提供两种等价语法：更常用、作为 CSS 超集的 **SCSS**（`.scss`），与更早、以缩进代替花括号的**缩进语法**（`.sass`）。当前官方主力实现是 **Dart Sass**（npm 实测 `1.101.0`）；早年的 LibSass 已于 2025-10 达到 End-Of-Life、Ruby Sass 更早废弃。Sass 近年最重要的两条主线是：用命名空间化的模块系统 `@use`/`@forward` **取代已弃用的 `@import`**（Dart Sass 1.80.0 弃用、计划 3.0.0 移除），以及把 `/` 除法、`darken()`/`lighten()` 等旧全局函数迁移到 `math.div()`、`sass:color` 等内置模块。

## 评价

**优点**

- **生态最成熟、心智最直觉**：变量/嵌套/mixin/函数/继承一应俱全，SCSS 又是 CSS 超集，几乎零门槛上手；社区框架（Bootstrap、Bulma 等）与工具链支持最广
- **模块系统真正解决工程化**：`@use`/`@forward` 带命名空间、私有成员、单次加载、可配置默认值（`with` + `!default`），彻底告别 `@import` 的全局污染与重复输出
- **内置模块化的标准库**：`sass:math`/`sass:color`/`sass:string`/`sass:list`/`sass:map`/`sass:meta` 等，提供可控的数值与颜色运算能力
- **两种语法各取所好**：SCSS 贴近 CSS、易迁移；缩进语法（`.sass`）更精简，团队按喜好选
- **纯编译期、零运行时开销**：所有抽象在构建时求值消除，产物就是干净 CSS，不给浏览器增加任何负担

**缺点**

- **需要构建步骤**：不像 CSS 原生变量/嵌套那样浏览器直接可用，必须接编译器与构建工具
- **编译期变量 ≠ 运行时能力**：Sass 变量在编译期就消除，无法像 CSS 自定义属性（`--x`）那样在运行时随元素/主题动态切换——现代项目常需两者配合
- **历史包袱与破坏性变更多**：`/` 除法、`@import`、`darken()`/`lighten()` 等陆续弃用，老代码迁移有成本，需盯官方 breaking-changes
- **`@extend` 有坑**：会牵连所有出现被继承选择器的地方、不能跨 `@media`，用不好反而不可预测，很多团队更偏向 mixin
- **原子化浪潮下的竞争**：Tailwind/UnoCSS 等原子化方案、以及 PostCSS + 原生 CSS 新特性（嵌套、`@layer`、自定义属性）都在蚕食预处理器的部分场景

## 文档地址

[Sass 官网](https://sass-lang.com/) ｜ [文档首页](https://sass-lang.com/documentation/) ｜ [模块系统 @use](https://sass-lang.com/documentation/at-rules/use/) ｜ [内置模块](https://sass-lang.com/documentation/modules/) ｜ [Breaking Changes](https://sass-lang.com/documentation/breaking-changes/)

## GitHub 地址

[sass/dart-sass](https://github.com/sass/dart-sass) ｜ [sass/sass（规范）](https://github.com/sass/sass) ｜ [sass/migrator（@import → @use 迁移工具）](https://github.com/sass/migrator)

## 幻灯片地址

<a href="/SlideStack/sass-slide/" target="_blank">Sass</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=sass" target="_blank" rel="noopener noreferrer">Sass 测试题</a>
