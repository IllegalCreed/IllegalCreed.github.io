---
layout: doc
outline: [2, 3]
---

# 标签详解

> 基于 JSDoc 4.0.x 编写

## 速查

- 注释必须 `/**` 开头，普通块注释 `/*` 与行注释 `//` 都**不会被解析**——这是第一道坎
- **块标签**以 `@` 独占一行（`@param` / `@returns`）；多个块标签之间换行分隔
- **内联标签**写在 `{}` 内、嵌入描述文本，仅 4 个：`{@link}` / `{@linkcode}`（等宽）/ `{@linkplain}`（纯文本）/ `{@tutorial}`
- `@param {类型} 名 - 描述`：名后连字符 `-` 仅为可读性，可省略
- `@returns` 与 `@return` **完全等价**，互为别名，别纠结写哪个
- `@deprecated` 才是弃用标记（不是 `@obsolete` / `@removed` / `@legacy`）
- `@ignore` 让符号**不出现**在文档中，用来隐藏内部实现
- 描述文本里出现 `}` 必须用反斜杠转义 `\}`，否则被当作内联标签结束符
- `@async` 仅作语义标注，异步函数的返回值仍用 `@returns {Promise<...>}` 描述

## 块标签与内联标签

JSDoc 标签分两类，写法和位置完全不同：

| 类别       | 写法                              | 位置                       | 例子                          |
| ---------- | --------------------------------- | -------------------------- | ----------------------------- |
| **块标签** | 以 `@` 起行，独占一行             | 注释体内逐行排列           | `@param`、`@returns`、`@type` |
| **内联标签** | 包在花括号 `{@tag ...}` 内        | 嵌入任意描述文本           | `{@link}`、`{@tutorial}`      |

```js
/**
 * 设置鞋的颜色。可用 {@link Shoe#setSize} 设置尺寸。
 * @param {string} color - 颜色。
 */
function setColor(color) {}
```

::: warning 注释开头必须是 `/**`
斜杠 + **两个**星号才会被 JSDoc 解析；`/*`（单星号块注释）与 `//`（行注释）一律忽略。注释还必须**紧贴**在被记录的函数 / 类 / 变量正上方，解析器靠位置把注释与紧随的符号关联起来。
:::

## 参数与返回值

### @param —— 三种可选语法

`@param` 描述函数参数，标准形态是 `@param {类型} 名称 - 描述`，名称后的连字符 `-` 只是为了可读性，可有可无。可选参数有三种写法（详见[类型表达式](./types.md)）：

```js
/**
 * @param {string}   p1        - 必填参数
 * @param {string=}  p2        - 可选（Closure 风格，类型后加 =）
 * @param {string}   [p3]      - 可选（JSDoc 风格，参数名加方括号）
 * @param {string}   [p4="x"]  - 可选 + 默认值
 * @param {...number} nums     - 可变参数（rest）
 */
function fn(p1, p2, p3, p4 = "x", ...nums) {}
```

::: tip 解构参数用「点路径」
当参数是对象时，用 `opts.name` 形式逐个描述其成员，详见[类与模块](./classes-modules.md)与[配合 TypeScript](./typescript.md)：

```js
/**
 * @param {Object} opts
 * @param {string} opts.name
 * @param {number} [opts.age]
 */
function create(opts) {}
```

:::

### @returns 与 @return（别名）

`@returns` 与 `@return` **互为别名、完全等价**。官方示例两种都用，无需统一成某一个。无返回值的函数可以省略，或写 `@returns {void}`。

```js
/**
 * @param {number} a
 * @param {number} b
 * @returns {number} 两数之和。
 */
function add(a, b) {
  return a + b;
}
```

## 类型与示例

| 标签               | 用途                                                          |
| ------------------ | ------------------------------------------------------------- |
| `@type {类型}`     | 标注变量 / 常量的类型                                          |
| `@example`         | 示例代码块，**可多个**（一个标签一段示例）                     |
| `@default`         | 记录默认值                                                    |
| `@summary`         | 一句话摘要（区别于 `@description` 的完整说明）                 |

```js
/** @type {Map<string, number>} */
const scores = new Map();

/**
 * 把价格格式化为带货币符号的字符串。
 * @summary 价格格式化。
 * @param {number} amount - 金额（分）。
 * @param {string} [currency="¥"] - 货币符号。
 * @returns {string} 形如 "¥12.34"。
 * @example
 * format(1234);        // "¥12.34"
 * @example
 * format(1234, "$");   // "$12.34"
 */
function format(amount, currency = "¥") {}
```

## 异常、异步与生成器

| 标签                    | 用途 / 要点                                                       |
| ----------------------- | ---------------------------------------------------------------- |
| `@throws` / `@exception` | 可能抛出的异常类型与条件（两者别名）                              |
| `@async`                | 标记异步函数；返回值仍用 `@returns {Promise<...>}` 描述           |
| `@generator`            | 标记生成器函数                                                   |
| `@yields` / `@yield`    | 生成器每次产出（yield）的值                                       |

```js
/**
 * @param {number} amount
 * @throws {RangeError} amount 为负时抛出。
 */
function charge(amount) {}

/**
 * @async
 * @param {string} url
 * @returns {Promise<Response>} 响应对象。
 */
async function request(url) {}
```

::: warning `@async` / `@yields` 在 TS 类型检查里不被识别
若你打算用 TypeScript 消费这些注释（`// @ts-check`），`@async`、`@yields`、`@member`、`@memberof` 这几个标签 **TS 不认**。详见[配合 TypeScript](./typescript.md)。
:::

## 可见性与元信息

| 标签                                          | 用途                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| `@private` / `@protected` / `@public` / `@package` | 访问可见性（**仅文档语义**，运行时不强制）              |
| `@readonly`                                    | 只读成员（文档语义）                                        |
| `@deprecated`                                  | 弃用标记，可附说明（替代方案、移除版本）                    |
| `@see`                                         | 交叉引用，可指符号名或 URL                                  |
| `@ignore`                                      | 让符号**完全不出现**在生成的文档里                          |
| `@inheritdoc`                                  | 沿用父类 / 接口的文档                                       |
| `@author` / `@version` / `@since`             | 作者 / 版本 / 起始版本等元信息                              |

```js
/**
 * @deprecated 自 v2.0 起改用 {@link fetchUser}。
 * @see https://example.com/migration
 * @since 1.2.0
 */
function getUser() {}

/**
 * 内部缓存，不对外暴露。
 * @private
 * @ignore
 */
let _cache = {};
```

::: tip 弃用标记只认 `@deprecated`
社区常见的 `@obsolete` / `@removed` / `@legacy` 都**不是** JSDoc 标准标签，不会被识别为弃用。统一用 `@deprecated`。
:::

## 内联标签：链接与教程

内联标签嵌入描述文本，只有 4 个，区别在「渲染样式」和「目标类型」：

| 内联标签              | 渲染效果              | 用途                         |
| --------------------- | --------------------- | ---------------------------- |
| `{@link 目标}`        | 由配置决定（普通/等宽） | 链接到符号或 URL             |
| `{@linkcode 目标}`    | **等宽字体**          | 强制以代码样式渲染链接       |
| `{@linkplain 目标}`   | **纯文本样式**        | 强制以普通文本渲染链接       |
| `{@tutorial 名}`      | 链接                  | 链接到独立教程页             |

```js
/**
 * 详见 {@link Book#getTitle} 与 {@linkcode module:utils.slug}。
 * 也可链外部地址：{@link https://jsdoc.app 官网}。
 * 入门请读 {@tutorial quickstart}。
 * 文本里要写花括号需转义：\{ 与 \}。
 */
```

::: warning 描述里的 `}` 必须转义
内联标签以 `}` 结束，所以普通描述文本中若出现 `}`（比如示例对象 `{a: 1}`），需写成 `\}`，否则会被误判为内联标签的结束。`{@link}` 的渲染样式还受 `jsdoc.json` 里 `templates.cleverLinks` / `monospaceLinks` 影响，详见[参考](../reference.md)。
:::

下一步：[类型表达式全集](./types.md) · [类与模块](./classes-modules.md) · [配合 TypeScript](./typescript.md) · [速查参考](../reference.md)
