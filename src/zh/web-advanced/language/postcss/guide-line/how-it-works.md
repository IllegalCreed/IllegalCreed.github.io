---
layout: doc
outline: [2, 3]
---

# 工作原理与 AST：解析、节点体系、序列化

> 基于 PostCSS 8.5.16 · 核于 2026-07

## 速查

- **三段式管线**：`tokenizer`（字符串→token）→ `parser`（token→AST）→ 插件转换 → `stringifier`（AST→CSS）。
- **tokenize 是热点**：官方架构文档指出词法分析约占**处理耗时 90%**，故 tokenizer 为性能重度优化；刻意与 parser 分层（优化热点 + 保持清晰）。
- **五种核心节点**：`Root` / `Rule` / `Declaration`(源码 `Decl`) / `AtRule` / `Comment`。
- **字段速记**：`Rule.selector`；`Declaration.prop` + `.value`（+ `.important`）；`AtRule.name` + `.params`；`Comment.text`；容器有 `.nodes`。
- **继承体系**：`Node`（通用基类：`type`/`parent`/`source`/`clone`/`remove`/`replaceWith`）→ `Container`（可含子节点：`nodes`/`each`/`walk`/`append`/`prepend`/`insertBefore`）。`Root`/`Rule`/`AtRule` 是 `Container`；`Declaration`/`Comment` 是叶子。
- **`raws`**：节点保存原始格式细节（空白、注释、分号）的地方，改值时保留它才能不破坏格式。
- **`source`**：节点在原 CSS 的位置，**新建/替换节点要复制它**，否则 source map / 报错定位失真。
- **parser/stringifier 可插拔**：传自定义 `parser`（`postcss-scss`/`postcss-less`/`sugarss`）即可直接解析超集语法，不必先编译成 CSS。
- **`LazyResult`**：`.process()` 返回惰性结果，取 `result.css` / `await` 时才真正跑，支持异步插件。

## 一、三段式管线的内部构造

PostCSS 把「CSS 字符串 → CSS 字符串」拆成三个可独立理解的阶段：

```
        ┌───────────┐   tokens   ┌────────┐   AST   ┌──────────┐   AST   ┌──────────────┐
 CSS ──▶│ tokenizer │───────────▶│ parser │────────▶│ plugins  │────────▶│ stringifier  │──▶ CSS
        └───────────┘            └────────┘         └──────────┘         └──────────────┘
         lib/tokenize.js         lib/parse.js       Processor 调度        lib/stringify.js
```

- **tokenizer（`lib/tokenize.js`）**：接收 CSS 字符串，产出一串 token（每个 token 标记它是 at 规则、注释、单词、括号还是空白，并可带位置信息用于报错）。
- **parser（`lib/parse.js` / `lib/parser.js`）**：**在 token 上工作**（而非直接啃字符串），做语法分析，把 token 组装成 `Node` 对象构成的 AST。
- **stringifier（`lib/stringify.js` / `lib/stringifier.js`）**：遍历 AST 生成 CSS 字符串，最核心方法是 `Stringifier.stringify`，接收根节点产出最终字符串。

### 为什么 tokenize 与 parse 要分层

官方架构文档明确：**tokenize 约占整体处理耗时的 90%**，是最热的一步。把它单独成层，可以对这一层做重度性能优化（哪怕代码更复杂），而让 parser 专注语法结构、保持清晰。这是一次典型的「**性能 + 可维护性**」分层取舍——不是语言限制，也不是为了并行。

## 二、五种核心节点及其字段

一段 CSS 会被解析成一棵以 `Root` 为根的树。对照记忆各节点的关键字段：

```css
/* 主色 */
.btn {
  color: red !important;
}
@media (min-width: 600px) {
  .btn { color: blue }
}
```

| 节点 | 对应片段 | 关键字段 |
| --- | --- | --- |
| `Root` | 整份样式表 | `nodes`：顶层子节点数组 |
| `Comment` | `/* 主色 */` | `text`：`主色` |
| `Rule` | `.btn { … }` | `selector`：`.btn`；子节点是 `Declaration` |
| `Declaration` | `color: red !important` | `prop`：`color`；`value`：`red`；`important`：`true` |
| `AtRule` | `@media (min-width: 600px) { … }` | `name`：`media`；`params`：`(min-width: 600px)`；带体故有子节点 |

- **带花括号体的 `AtRule`**（如 `@media`、`@supports`、`@keyframes`）是容器，内部可再嵌 `Rule`/`Declaration`。
- **无体的 `AtRule`**（如 `@import 'a.css';`、`@charset`）没有子节点，只有 `name` + `params`。

## 三、Node 与 Container：继承体系

节点分两大类，理解继承关系能让你在写插件时知道「哪个节点有哪些方法」：

```
Node（所有节点的基类）
├─ type / parent / source / raws
├─ clone() / cloneBefore() / cloneAfter()
├─ remove() / replaceWith() / before() / after()
│
└─ Container（能容纳子节点，继承 Node）
   ├─ nodes（子节点数组）
   ├─ each() / walk() / walkRules() / walkDecls() / walkAtRules() / walkComments()
   ├─ append() / prepend() / insertBefore() / insertAfter()
   │
   ├─ Root      （整棵树的根）
   ├─ Rule      （选择器规则）
   └─ AtRule    （@ 规则）

叶子节点（只继承 Node，无子节点）：
   ├─ Declaration（prop / value / important）
   └─ Comment    （text）
```

- **通用能力在 `Node`**：任何节点都能 `remove()`、`replaceWith()`、`clone()`，都能读 `parent`（父节点）与 `source`（源码位置）。
- **容器能力在 `Container`**：只有 `Root`/`Rule`/`AtRule` 能 `append` 子节点、能 `walk` 遍历子孙——因为只有它们**有** `nodes`。
- **叶子无子节点**：对 `Declaration` 调 `walkDecls` 是没有意义的（它没有 `nodes`）。

## 四、raws 与 source：格式与定位的守护者

两个容易被忽略、却决定输出质量的字段：

### `raws`——保留原始格式

节点把「用户写的原始格式细节」（各处空白、分号、注释里的缩进等）存在 `raws` 里。序列化时优先用 `raws` 还原，从而**尽量保持原样**。这意味着：

- 你只改 `decl.value`，PostCSS 会保留这条声明周围的空白与缩进；
- 但如果你**新建**节点却不给 `raws`，它会用默认格式（可能与周围风格不一致），必要时手动设置 `raws.before` 等。

### `source`——保住 source map

每个节点的 `source` 记录它在**原始 CSS** 中的起止位置（`start`/`end`/`input`）。它是 source map 与报错定位的依据。

::: warning 新建/替换节点务必复制 source
当你在插件里 `new Declaration()` 或 `replaceWith(newNode)` 时，若不把原节点的 `source` 拷到新节点，生成的 CSS 在 source map 里就**丢失来源位置**，浏览器 DevTools 会定位错误、报错信息失真。官方建议：新建/替换节点时复制 `Node#source`。
:::

## 五、parser / stringifier 可插拔：解析 SCSS/Less 超集

PostCSS 默认解析标准 CSS，但它的**解析层是可替换的**。通过 `process` 的 `syntax` / `parser` / `stringifier` 选项传入自定义实现，就能让 PostCSS 直接解析超集语法：

```js
import postcss from 'postcss';
import scssSyntax from 'postcss-scss';

// 直接解析 SCSS 语法本身（保留 // 注释、嵌套等），不必先编译成 CSS
const result = await postcss([/* 插件 */])
  .process(scssSource, { syntax: scssSyntax, from: 'a.scss' });
```

- `postcss-scss`、`postcss-less`、`sugarss`（缩进式）等提供了对应语法的 parser + stringifier。
- 这正是 **stylelint 能直接校验 `.scss` 源码**、而不必先 Sass 编译的原因——它换了个能读 SCSS 的 parser。
- 体现了 PostCSS 作为「**解析层可插拔的通用平台**」的设计：不只处理 CSS，而是处理「类 CSS 的一切」。

## 六、LazyResult：惰性与异步

`.process()` 返回的不是立即算好的结果，而是一个 **`LazyResult`（惰性结果）**：

- 真正的转换被**推迟**到你第一次取结果时（访问 `result.css`、`result.map`，或 `.then()` / `await`）才执行。
- 因为部分插件是**异步**的（可能读文件、查网络数据），PostCSS 支持异步管线——**优先用 `await` / `.then()`** 取结果最稳妥。
- 若插件全同步，直接读 `result.css` 也会触发同步求值；但一旦链上有异步插件却用同步取值，会抛错提示改用异步。

---

原理与节点体系清楚后，下一步进入 [插件机制与 API](./plugin-mechanism)：插件的标准结构、访问器（visitor）体系、walk 遍历、节点增删改方法，以及 re-visit 与防死循环。
