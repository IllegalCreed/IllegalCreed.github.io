---
layout: doc
outline: [2, 3]
---

# 配合 TypeScript

> 基于 JSDoc 4.0.x 编写

## 速查

- 开启检查：单文件顶部 `// @ts-check`；全项目 tsconfig `"checkJs": true` + `"allowJs": true`
- TS 语言服务读 `.js` 里的 JSDoc 注解 → 补全 / 悬停 / 类型报错，**纯 JS 不迁移 `.ts` 也能类型安全**
- 可选参数三语法：`{string=}`（Closure）、`{string} [p]`（JSDoc）、`{string} [p="x"]`（带默认）
- 类型断言（casting）：括号包裹表达式 `/** @type {number} */ (value)`
- `@import` 导入类型（运行时 no-op）；`@satisfies` 校验但不改变类型；`@template` 支持约束 + 默认
- **TS 不支持的标签**：`@memberof`、`@yields`、`@member`、`@async`——写了也不生效
- 语义差异：`!`（非空）TS 当普通类型**忽略**；`?`（可空）官方建议改写成 `T | null`
- legacy 同义词陷阱：`Object` / `object` 退化成 **any**，在 `noImplicitAny` 下报错——明确写类型

## 两种开启方式

让 TypeScript 编译器消费 `.js` 文件里的 JSDoc 类型注解，有两种粒度：

```js
// ① 单文件：放在文件最顶部
// @ts-check

/** @type {Map<string, number>} */
const scores = new Map();
scores.set("a", 1);
scores.set("b", "2"); // ❌ TS: 类型 string 不能赋给 number
```

```json
// ② 全项目：tsconfig.json
{
  "compilerOptions": {
    "allowJs": true, // 允许编译 .js
    "checkJs": true, // 对 .js 做类型检查
    "noEmit": true
  }
}
```

::: tip 纯 JS 也能类型安全
TS 语言服务读取 `.js` 里的 JSDoc 注解后，VS Code 立刻获得补全、悬停提示与类型报错。这是纯 JavaScript 项目**不改写 `.ts`** 就享受类型检查的关键路径，迁移成本几乎为零。对单文件想临时关掉检查用 `// @ts-nocheck`。
:::

## 可选参数的三种语法

与 [核心标签](./tags.md) 一致，但在 TS 检查下三者都被正确识别为「可选」：

```js
/**
 * @param {string}  p1        - 必填
 * @param {string=} p2        - 可选（Closure 风格，类型后 =）
 * @param {string}  [p3]      - 可选（JSDoc 风格，名加方括号）
 * @param {string}  [p4="x"]  - 可选 + 默认值
 */
function fn(p1, p2, p3, p4 = "x") {}
```

::: warning 后缀 `=` 在对象字面量里 TS 不支持
形如 <code v-pre>{{ b: number= }}</code>（对象属性用后缀 `=` 表可选）**TS 不识别**，请改用 `?`：写成 <code v-pre>{{ b?: number }}</code> 或拆成 `@typedef` + 可选 `@property`。
:::

## 类型断言（casting）

把表达式断言成某类型，用 `@type` 注释紧跟**括号包裹**的表达式：

```js
// 圆括号不能省，否则断言不生效
const n = /** @type {number} */ (someValue);

// 常见于 DOM 取窄类型
const input = /** @type {HTMLInputElement} */ (document.getElementById("name"));
console.log(input.value);
```

## TS 扩展标签：@import / @satisfies / @template

这几个是 TS 语言服务专门扩展、JSDoc 现代用法里最实用的部分：

### @import —— 仅导入类型

```js
/** @import {Pet} from "./types" */

/** @type {Pet} */
let p;
```

`@import` 是 TS 扩展，**运行时是 no-op**（不产生真实 import），专门用于在 `.js` 里引用其它文件导出的类型，避免污染运行时依赖。

### @satisfies —— 校验但不改变类型

```js
/** @satisfies {Record<string, number>} */
const cfg = { a: 1, b: 2 };
// cfg 仍是字面量类型 { a: number; b: number }，
// 但已校验「满足」Record<string, number> 约束
```

### @template —— 约束与默认

```js
/** @template {string} K */ // 约束：K 必须是 string（仅首个类型参数受约束）
/** @template [T=object] */ // 默认类型：未指定时 T 为 object
```

| 写法                  | 含义                                             |
| --------------------- | ------------------------------------------------ |
| `@template T`         | 声明泛型参数 T                                    |
| `@template {string} K`| 约束 K 必须是 string（**仅对首个类型参数生效**） |
| `@template [T=object]`| 给 T 一个默认类型                                |

## @param 解构

参数是对象时，用「父名.成员」逐项描述，TS 会据此推断解构后各字段类型：

```js
/**
 * @param {Object} opts
 * @param {string} opts.name
 * @param {number} [opts.age]
 */
function create({ name, age }) {}
```

## TS 不支持的 JSDoc 标签

这是高手级考点：以下标签在纯 JSDoc 生成文档时有效，但 **TS 类型检查会忽略**它们：

| 标签         | 在 TS 中的状态                          |
| ------------ | --------------------------------------- |
| `@memberof`  | 不支持（TS 靠真实代码结构判断归属）     |
| `@yields`    | 不支持（生成器返回类型用 `@returns`）   |
| `@member`    | 不支持                                  |
| `@async`     | 不支持（异步靠 `@returns {Promise<…>}`）|

::: warning 别指望这几个标签影响 TS 类型
比如想用 `@memberof` 把一个函数「挂」到某命名空间下让 TS 识别——**没用**，TS 只看真实的代码结构。生成器产出类型也别写 `@yields`，TS 读的是 `@returns {Generator<…>}`。
:::

## `!`（非空）与 `?`（可空）的语义差异

同一个符号，JSDoc 与 TS 解读不同，这是混用时最大的坑：

| 写法       | JSDoc 含义           | TypeScript 行为                                 |
| ---------- | -------------------- | ----------------------------------------------- |
| `!number`  | 非空（non-nullable） | **忽略 `!`**，当作普通 `number`                 |
| `?number`  | 可空 = number 或 null | 仅 `strictNullChecks` 下有意义；**建议改写**     |

::: tip 想表达可空，直接写联合类型
不要依赖 JSDoc 的 `?` 前缀，TS 官方建议直接写 `{number | null}`——语义清晰、跨工具一致：

```js
/** @param {number | null} a */
function fn(a) {}
```

:::

## legacy 类型同义词陷阱

为兼容历史代码，TS 把一些大写类型名当作 legacy 同义词处理，其中 `Object` 最危险——它退化成 `any`：

| 写法（不推荐） | TS 实际解析为      | 风险                                    |
| -------------- | ------------------ | --------------------------------------- |
| `String`       | `string`           | 包装对象，应写小写                      |
| `Number`       | `number`           | 同上                                    |
| `Boolean`      | `boolean`          | 同上                                    |
| `Object` / `object` | **any**       | **`noImplicitAny` 下报错**，丧失类型检查 |
| `array`        | `Array<any>`       | 失去元素类型                            |
| `promise`      | `Promise<any>`     | 失去 resolve 类型                       |
| `function`     | `Function`         | 失去参数 / 返回类型                     |

::: warning `Object` 在 `noImplicitAny` 下直接报错
开启 `noImplicitAny`（`strict` 包含）后，写 `@type {Object}` 会因退化成隐式 `any` 而报错。明确写出形状：`{Record<string, unknown>}`、<code v-pre>{{ name: string }}</code> 或自定义 `@typedef`。
:::

下一步：[核心标签详解](./tags.md) · [类型表达式全集](./types.md) · [类与模块](./classes-modules.md) · [速查参考](../reference.md)
