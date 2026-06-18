---
layout: doc
outline: [2, 3]
---

# 类型表达式

> 基于 JSDoc 4.0.x 编写

## 速查

- 类型写在**花括号内**：`{string}`、`{number}`、`{boolean}`
- 可空 `{?number}`（= number 或 null，前缀 `?`）；非空 `{!string}`（前缀 `!`，源自 Closure）
- 可选参数：类型后加 `=`（`{string=}`）或参数名加方括号（`[name]`、`[name=默认值]`）
- 可变参数（rest）前缀 `...`：`{...number}`
- 联合类型用竖线 `|` 连接、圆括号分组：`{(string|Array.<string>)}`
- 数组两种等价写法：`Array.<number>`（带点）与 `number[]`
- 映射 `Object.<string, number>`（键类型, 值类型）；对象字面量 <code v-pre>{{a: number, b: string}}</code>
- 函数类型 `{function(string, number): boolean}`；任意类型 `{*}`
- 自定义类型用 `@typedef` + `@property` 描述对象形状，`@callback` 描述回调，可跨文件复用

## 基础与特殊类型

类型表达式一律包在花括号 `{}` 内，跟在 `@param` / `@returns` / `@type` 等标签后：

| 写法                          | 含义                          |
| ----------------------------- | ----------------------------- |
| `{string}` `{number}` `{boolean}` | 基础类型                  |
| `{null}` `{undefined}` `{void}`   | 特殊值                    |
| `{*}`                         | 任意类型（any）               |
| `{Object}` / `{object}`       | 对象（两种写法均可）          |

::: tip 大小写有讲究
JSDoc 自身大小写都接受，但若用 TypeScript 消费这些注释，首字母大写的 `String` / `Number` / `Boolean` 是「包装对象类型」，且 `Object` 会退化成 `any`——务必写小写的 `string` / `number` / `object`。详见[配合 TypeScript](./typescript.md)。
:::

## 可空、非空与可选

这三组前后缀来自 Closure 风格，是 JSDoc 类型表达式的精华，也是最容易混淆的地方：

| 写法                  | 含义                                                  |
| --------------------- | ----------------------------------------------------- |
| `{?number}`           | **可空**（nullable）= `number` 或 `null`，前缀 `?`    |
| `{!string}`           | **非空**（non-nullable），前缀 `!`                    |
| `{string=}` 或 `[name]` | **可选参数**（类型后 `=`，或参数名加方括号）         |
| `[name=default]`      | 可选 + 默认值                                         |

```js
/**
 * @param {?number} a   - 可空：number 或 null。
 * @param {!Object} b   - 非空对象。
 * @param {number} [c]  - 可选参数。
 * @param {number} [d=10] - 可选 + 默认值 10。
 */
function fn(a, b, c, d = 10) {}
```

::: warning JSDoc 的 `?` / `!` 与 TypeScript 语义不同
- `!number`（非空）：JSDoc 里表示非空，但 **TS 把 `!` 当普通类型忽略**。
- `?number`（可空）：TS 里仅在 `strictNullChecks` 下有意义，**官方建议直接写 `number | null`**。

跨 TS 使用务必清楚这层差异，详见[配合 TypeScript](./typescript.md)。
:::

## 可变、联合与分组

```js
/**
 * @param {...number} nums - 可变参数（rest），前缀 ...
 * @param {(string|number)} id - 联合类型，竖线连接、圆括号分组。
 * @returns {(Array.<string>|null)} 结果或 null。
 */
function pick(id, ...nums) {}
```

- **可变参数**：前缀 `...`，如 `{...number}` 表示「零或多个 number」。
- **联合类型**：用竖线 `|` 连接候选，圆括号 `()` 分组消歧，如 `{(string|Array.<string>)}`。

## 数组、映射、对象字面量与函数

| 写法                                      | 含义                                  |
| ----------------------------------------- | ------------------------------------- |
| `Array.<number>` 或 `number[]`            | 数组（两种等价；注意 `Array.<>` 带点） |
| `Object.<string, number>`                 | 键值映射（键类型, 值类型）            |
| <code v-pre>{{a: number, b: string}}</code>                | 对象类型字面量（内层 `{}` 列属性）    |
| `{function(string, number): boolean}`     | 函数类型（参数序列 : 返回类型）       |

```js
/**
 * @param {string[]} tags                       - 字符串数组。
 * @param {Object.<string, number>} scoreMap     - string→number 映射。
 * @param {{x: number, y: number}} point         - 对象字面量类型。
 * @param {function(Error): void} callback        - 函数类型。
 */
function handle(tags, scoreMap, point, callback) {}
```

::: tip `Array.<T>` 的点不能丢
泛型形式必须写成 `Array.<T>`、`Object.<K, V>`、`Promise.<T>`（类型名与 `<` 之间有个 `.`）。漏掉点在严格解析下会报错。嫌啰嗦就用简写 `T[]`。
:::

## 自定义类型：@typedef

`@typedef` 给复杂类型起一个**可复用、可跨文件引用**的名字。两种常见用法：

### 联合别名

```js
/** @typedef {(number|string)} NumberLike */

/** @param {NumberLike} v */
function use(v) {}
```

### 对象形状（配合 @property）

`@property`（别名 `@prop`）逐个描述对象成员，可选成员用方括号：

```js
/**
 * @typedef {Object} Triforce
 * @property {boolean} hasCourage - 是否有勇气。
 * @property {boolean} hasPower
 * @property {boolean} [hasWisdom] - 可选属性。
 */

/** @type {Triforce} */
const tri = { hasCourage: true, hasPower: true };
```

::: tip `{Object}` 与 `{object}` 都行
`@typedef {Object}` 与 `@typedef {object}` 在 JSDoc 里等价。定义后即可在 `@param` / `@returns` / `@type` 处按名引用，并跨文件复用（同一个 JSDoc 运行集内可见）。
:::

## 回调、泛型与枚举

| 标签               | 用途                                                          |
| ------------------ | ------------------------------------------------------------- |
| `@callback`        | 定义回调函数签名（类似只描述函数的 `@typedef`）               |
| `@template`        | 声明泛型类型参数                                              |
| `@enum {类型}`     | 一组同类型命名常量，常配 `@readonly`                          |

```js
/**
 * @callback Predicate
 * @param {string} data
 * @param {number} [index]
 * @returns {boolean}
 */

/** @param {Predicate} fn */
function filterBy(fn) {}

/** @template T */ // 声明泛型参数 T

/**
 * 状态枚举。
 * @readonly
 * @enum {number}
 */
const State = {
  PENDING: 0,
  DONE: 1,
};
```

::: tip `@template` 的约束与默认在 TS 下更强
配合 TypeScript 时，`@template` 可加类型约束 `{string} K` 与默认 `[T=object]`，是写泛型工具函数的关键。详见[配合 TypeScript](./typescript.md)；全量速查见[参考](../reference.md)。
:::

下一步：[核心标签详解](./tags.md) · [类与模块](./classes-modules.md) · [配合 TypeScript](./typescript.md) · [速查参考](../reference.md)
