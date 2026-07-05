---
layout: doc
outline: [2, 3]
---

# 入门：定位、两种语法与安装编译

> 基于 Dart Sass 1.101.0 · 核于 2026-07

## 速查

- **定位**：Sass 是 **CSS 预处理器**——一门「编译成 CSS 的样式表语言」，在兼容 CSS 的语法上加了变量、嵌套、mixin、函数、继承、控制流、模块系统。浏览器**不认识** Sass，必须先编译成 CSS。
- **两种语法**：**SCSS**（`.scss`，用花括号+分号，是 CSS 超集，最流行）与**缩进语法**（`.sass`，用缩进+换行，Sass 最早的语法）。二者功能完全等价，本笔记默认用 SCSS。
- **当前实现**：**Dart Sass**（npm 包名 `sass`，实测 `1.101.0`）是官方主力与新特性首发平台。**LibSass 已 EOL（2025-10）**、`node-sass` EOL、Ruby Sass 早废弃——新项目一律用 Dart Sass。
- **安装**：`npm install -D sass`（Dart Sass 的 JS 版）；也有独立可执行文件、以及各构建工具（Vite/webpack）内置支持。
- **命令行编译**：`sass input.scss output.css`；`sass --watch src:dist` 监听目录；`sass --style=compressed` 压缩输出。
- **变量**：`$` 开头，如 `$primary: #c6538c;`，**编译期求值并消除**，最终 CSS 里看不到。
- **嵌套**：选择器可按结构层层嵌套；`&` 是**父选择器**，用于伪类 `&:hover`、BEM `&__title`/`&--active`、反转上下文 `.dark &`。
- **复用四件套**：`@mixin`/`@include`（产出样式块）、`@function`/`@return`（计算返回值）、`@extend` + 占位符 `%`（继承/合并选择器）、`@use`/`@forward`（模块系统）。
- **模块系统**：`@use 'file'` 带命名空间加载（`file.$var`/`file.fn()`），`@forward` 再导出给下游。**`@import` 已于 1.80.0 弃用、计划 3.0.0 移除**，新代码一律用 `@use`。
- **内置模块**：`@use 'sass:math'` 等，前缀统一 `sass:`；除法用 `math.div($a,$b)`（`/` 作除法已弃用）、颜色调整用 `color.adjust`/`color.scale`（`darken`/`lighten` 已弃用）。
- ⚠️ **Sass 变量 ≠ CSS 自定义属性**：前者编译期、命令式、无运行时；后者（`--x`）运行时、声明式、可随元素/主题动态变化。二者常配合使用。
- **选型速记**：要工程化的样式抽象且团队熟悉 → **Sass**；只想按 CSS 标准做转换/加前缀/用未来语法 → **PostCSS**（可与 Sass 叠用）；类 Sass 但 JS 生态更轻 → **Less**；不想写选择器、直接原子类 → **Tailwind/UnoCSS**。
- **进阶顺序**：本页 → [语法、嵌套与变量](./guide-line/syntax-and-nesting) → [mixin、函数与 @extend](./guide-line/mixins-functions-extend) → [控制流](./guide-line/control-flow) → [模块系统 @use/@forward](./guide-line/module-system) → [内置模块与迁移](./guide-line/built-in-modules) → [参考](./reference)。

## 一、Sass 是什么：定位

Sass（**S**yntactically **A**wesome **S**tyle **S**heets）是一门**编译成 CSS 的样式表语言**，即 **CSS 预处理器**。它不改变 CSS 的运行方式，而是在「写样式」这一层提供工程化能力：变量、嵌套、混入、函数、继承、控制流、模块化。写好的 `.scss`/`.sass` 经 Dart Sass 编译器转成标准 CSS，浏览器最终只加载 CSS。

一句话心智：**Sass 是「给 CSS 加了编程能力的编译期语言」**，抽象都在构建时求值消除，产物是干净、零运行时开销的 CSS。

::: tip Sass 与「CSS 原生特性」的边界
现代 CSS 已原生支持嵌套、自定义属性（`--x`）、`@layer` 等——这些是**浏览器运行时**特性，无需编译。本笔记只讲 **Sass 工具层**（编译期能力）；原生 CSS 选择器、盒模型等归 Web 基础章。二者可以配合：用 Sass 组织代码，用 CSS 自定义属性承载运行时可变的主题值。
:::

## 二、两种语法：SCSS vs 缩进语法

Sass 提供两种书写语法，**功能完全等价**，只是形式不同：

::: code-group

```scss [SCSS（.scss，推荐）]
// 用花括号和分号，是 CSS 的超集
@mixin button-base {
  display: inline-flex;
  &:hover {
    cursor: pointer;
  }
}
```

```sass [缩进语法（.sass）]
// 用缩进代替花括号、换行代替分号
=button-base
  display: inline-flex
  &:hover
    cursor: pointer
```

:::

- **SCSS（`.scss`）**：官方称它是 CSS 的**超集**——「几乎所有合法 CSS 都是合法 SCSS」。因此最易上手、最流行，可把现有 `.css` 直接改名 `.scss` 起步。
- **缩进语法（`.sass`）**：Sass 最早的语法，用缩进层级代替花括号、换行代替分号，更精简；mixin 定义用 `=`、引入用 `+`（如上 `=button-base` / `+button-base`）。

除非团队偏好缩进风格，**默认选 SCSS**。本笔记全部用 SCSS。

## 三、安装与命令行编译

Dart Sass 有多种分发形式，最常用的是 npm 上的纯 JS 版 `sass`：

```bash
# 安装（项目内）
npm install -D sass

# 单文件编译：输入 → 输出
npx sass src/main.scss dist/main.css

# 监听目录，改动即重编（src 目录 → dist 目录）
npx sass --watch src:dist

# 压缩输出（生产）
npx sass src/main.scss dist/main.css --style=compressed

# 生成 source map（默认开启，可 --no-source-map 关闭）
npx sass src/main.scss dist/main.css
```

实际工程里，Sass 通常**由构建工具驱动**：Vite 只需 `npm i -D sass` 后直接 `import './style.scss'` 即可；webpack 用 `sass-loader`。此时不必手动跑 CLI。

## 四、第一个 Sass：变量 + 嵌套

一个最小示例，把变量与嵌套用起来：

```scss
// 1) 变量：编译期求值，最终 CSS 里消失
$primary: #c6538c;
$radius: 8px;

// 2) 嵌套 + 父选择器 &
.card {
  padding: 16px;
  border-radius: $radius;
  background: $primary;

  // 编译成 .card__title
  &__title {
    font-weight: bold;
  }

  // 编译成 .card:hover
  &:hover {
    filter: brightness(1.05);
  }

  // 编译成 .card .card__body（后代）
  .card__body {
    color: white;
  }
}
```

编译后的 CSS（节选）——注意 `$primary`/`$radius` 已被求值消除、`&` 已展开：

```css
.card { padding: 16px; border-radius: 8px; background: #c6538c; }
.card__title { font-weight: bold; }
.card:hover { filter: brightness(1.05); }
.card .card__body { color: white; }
```

## 五、选型：Sass vs Less vs PostCSS vs CSS 自定义属性

| 维度 | Sass | Less | PostCSS | CSS 自定义属性（`--x`） |
| --- | --- | --- | --- | --- |
| 类型 | 预处理器（编译期语言） | 预处理器 | 后处理器/转换平台（插件生态） | 浏览器**原生**运行时特性 |
| 变量 | `$x`，编译期消除 | `@x`，编译期 | 靠插件（如 `postcss-custom-properties`） | `--x`，运行时保留、可动态改 |
| 逻辑能力 | 强（mixin/函数/控制流/模块） | 中（mixin/函数） | 取决于插件组合 | 无（纯值容器） |
| 是否需构建 | 是 | 是 | 是 | 否（浏览器直接支持） |
| 典型定位 | 成熟工程化样式抽象 | 轻量、JS 生态 | 「用 JS 处理 CSS」的可组合管线（Autoprefixer、未来语法降级） | 运行时可变的主题/换肤 |

**一句话选型**：要成熟、功能全的样式工程化，团队也熟 → **Sass**；想更轻或已在 Less 生态 → **Less**；要按标准做转换（加前缀、降级新语法、原子化）→ **PostCSS**（常与 Sass **叠用**：Sass 编译 + PostCSS 后处理）；要运行时随主题/元素动态变化的值 → **CSS 自定义属性**（与 Sass 互补，不是二选一）。完整对比见[参考页](./reference)。

---

打好地基后，下一步进入 [语法、嵌套与变量](./guide-line/syntax-and-nesting)：`&` 父选择器全用法、嵌套属性、变量作用域与 `!default`/`!global`、插值 `#{}`。
