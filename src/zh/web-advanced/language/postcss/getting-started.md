---
layout: doc
outline: [2, 3]
---

# 入门：定位、工作原理与最小用法

> 基于 PostCSS 8.5.16 · 核于 2026-07

## 速查

- **定位**：PostCSS 是**用 JavaScript 插件转换 CSS 的工具 / AST 平台**，官方定义「a tool for transforming CSS with JavaScript」。**不是语言、不是预处理器、不是框架**。
- **核心澄清**：**PostCSS 本体几乎什么都不做**——只做 `parse`（CSS→AST）→ 插件遍历转换 → `stringify`（AST→CSS）。加前缀、压缩、降级**全靠插件**。
- **输入输出**：**CSS 进、CSS 出**，中间是 AST。因此能无缝插进 Vite / webpack 流水线。
- **三段式管线**：① 解析（tokenizer→parser 建 AST）→ ② 插件转换 AST → ③ 序列化（stringifier 回 CSS）。
- **AST 五种核心节点**：`Root`（根）、`Rule`（选择器+声明块）、`Declaration`（`prop: value`）、`AtRule`（`@media` 等，有 `name`/`params`）、`Comment`。
- **最小 Node API**：`postcss([autoprefixer]).process(css, { from, to })` → `result.css` 取结果。
- **配置文件**：根目录 `postcss.config.js`（或 `.cjs`/`.mjs`/`.postcssrc*`/`package.json` 的 `postcss` 键），导出 `{ plugins: [...] }`。
- **插件顺序**：按声明顺序自上而下执行——`postcss-import` 靠前、`autoprefixer` 居中、`cssnano` 垫底。
- **明星插件**：`autoprefixer`（加前缀）· `postcss-preset-env`（未来 CSS 降级，内置 autoprefixer）· `cssnano`（压缩）· `postcss-import`（内联 @import）· `postcss-nesting`（原生嵌套）。
- **与预处理器关系**：**可组合非互斥**——Sass/Less 先编译成 CSS，PostCSS 再后处理。
- **不用学新语法**：用现成插件时源码照写标准 CSS，转换发生在构建期。
- **进阶顺序**：本页 → [工作原理与 AST](./guide-line/how-it-works) → [插件机制与 API](./guide-line/plugin-mechanism) → [主流插件生态](./guide-line/ecosystem-plugins) → [配置与构建集成](./guide-line/config-and-integration) → [与预处理器/原子化的关系](./guide-line/vs-preprocessors) → [参考](./reference)。

## 一、PostCSS 是什么：一个被高频误解的定位

初次接触，很多人把 PostCSS 归到 Sass / Less 那一档，以为它是「又一个预处理器」。这是**最需要先纠正的误解**。

官方对它的定义只有一句：**「A tool for transforming CSS with JavaScript」**（用 JavaScript 转换 CSS 的工具）。拆开看三个关键词：

- **transforming CSS**：它对 CSS 做**转换**——输入一段 CSS，输出另一段 CSS。
- **with JavaScript**：转换逻辑用 **JS 插件**编写，你用熟悉的 JavaScript 操作 CSS。
- **tool / platform**：它是**平台**，不是功能集——本体不预设任何具体转换。

所以更准确的三句话心智：

1. PostCSS **不是语言**：它不发明新语法，输入就是标准 CSS。
2. PostCSS **不是预处理器**：预处理器是「新语法 → 编译成 CSS」的单向编译器；PostCSS 是「CSS → AST → 插件 → CSS」的**通用转换平台**，既能做预处理器式的事（如插件提供嵌套），也能做后处理（加前缀、压缩）、校验（stylelint）。
3. PostCSS **本体几乎什么都不做**：它只提供解析、遍历、序列化的骨架，**真正干活的是插件**。

::: tip 一句话记住它
PostCSS 之于 CSS，约等于 **Babel 之于 JavaScript**：一个把源码解析成 AST、让插件转换、再输出的平台。空着不装插件，它基本原样输出。
:::

## 二、工作原理：parse → 插件转换 → stringify

PostCSS 的处理管线是**三段式**：

```
CSS 字符串
   │  ① 解析（tokenizer 切 token → parser 建树）
   ▼
  AST（Root / Rule / Declaration / AtRule / Comment）
   │  ② 转换（各插件遍历 AST，增删改节点）
   ▼
 改后的 AST
   │  ③ 序列化（stringifier 遍历还原）
   ▼
CSS 字符串（+ source map）
```

- **① 解析**：`tokenizer`（`lib/tokenize.js`）把 CSS 字符串切成 token，`parser`（`lib/parse.js`）再把 token 组装成 AST。官方指出 **tokenize 约占处理耗时的 90%**，是被重度优化的热点——这也是 PostCSS 刻意把 tokenize 与 parse 分成两层的原因（既能优化最慢步骤，又保持 parser 代码清晰）。
- **② 转换**：`Processor` 调度所有插件遍历这棵 AST。插件通过**访问器（visitor）** 或 `walk` 系列方法找到目标节点，读改它的属性（如 `decl.value = 'red'`）、替换、克隆或删除。
- **③ 序列化**：`stringifier`（`lib/stringify.js`）从根节点遍历，把 AST 还原成 CSS 文本，并生成 source map。

## 三、AST 长什么样：五种核心节点

理解 PostCSS 的关键是理解它的 AST 节点。一段 CSS：

```css
/* 主题色 */
.btn {
  color: red;
}
@media (min-width: 600px) {
  .btn { color: blue; }
}
```

会被解析成这样的节点树：

| 节点类型 | 代表 | 关键字段 |
| --- | --- | --- |
| `Root` | 整棵树的根 | `nodes`（子节点数组） |
| `Rule` | 一条规则 `.btn { … }` | `selector`（`.btn`）+ `Declaration` 子节点 |
| `Declaration` | 一条声明 `color: red` | `prop`（`color`）、`value`（`red`） |
| `AtRule` | `@` 规则 `@media …` | `name`（`media`）、`params`（`(min-width: 600px)`） |
| `Comment` | 注释 `/* 主题色 */` | `text` |

- 所有节点都继承基类 `Node`（提供 `type`、`parent`、`source`、`clone`、`remove`、`replaceWith` 等）。
- 能容纳子节点的（`Root`/`Rule`/`AtRule`）继承 `Container`，额外有 `nodes`、`walk`、`append` 等；`Declaration`/`Comment` 是**叶子节点**。

::: tip 想直观看 AST
可以用在线工具 [AST Explorer](https://astexplorer.net/)（选 CSS + postcss）把任意 CSS 实时解析成节点树，是理解节点结构最快的方式。
:::

## 四、最小用法：Node API

PostCSS 的核心入口就一句：`postcss([...plugins]).process(css, options)`。

```js
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';

const css = 'a { user-select: none }';

const result = await postcss([autoprefixer])
  .process(css, { from: undefined }); // from/to 用于 source map 与报错定位

console.log(result.css);
// a { -webkit-user-select: none; -moz-user-select: none; user-select: none }
```

- `postcss([...])` 用一个**插件数组**构造 processor。
- `.process(css, { from, to })` 传入 CSS 源与选项，返回一个惰性的 `LazyResult`——真正转换推迟到你取结果时才跑（因此支持异步插件，用 `await` / `.then()` 最稳）。
- `result.css` 拿到转换后的 CSS，`result.map` 拿 source map。

日常开发几乎不直接写这段——**构建工具帮你封装了这层**。你只需在 `postcss.config.js` 声明插件（见 [配置与构建集成](./guide-line/config-and-integration)）。

## 五、典型应用场景

- **自动加浏览器前缀**：挂 `autoprefixer`，只写标准 CSS，前缀按目标浏览器自动补齐。
- **提前用未来 CSS**：挂 `postcss-preset-env`，写现代语法（嵌套、自定义媒体查询、现代颜色函数），自动降级。
- **生产压缩**：挂 `cssnano`，删注释空白、压颜色、合并规则。
- **原子化 CSS 底座**：Tailwind CSS v3 就是一个 PostCSS 插件（v4 提供 `@tailwindcss/postcss`）。
- **代码校验**：`stylelint` 基于 PostCSS 解析 CSS/SCSS 做规则检查。
- **自定义转换**：团队私有的 CSS 规范/迁移，用几十行 JS 写个插件即可。

---

打好定位与原理的地基后，下一步进入 [工作原理与 AST](./guide-line/how-it-works)：逐层拆解 tokenizer / parser / stringifier、五种节点的字段、Node 与 Container 的继承体系，以及可替换 parser 解析 SCSS 的机制。
