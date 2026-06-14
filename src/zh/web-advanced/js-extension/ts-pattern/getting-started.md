---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **ts-pattern 的基础用法**：`match`/`with`/`exhaustive`/`otherwise`、字面量与对象模式、最常用的 `P.*` 通配模式。版本基线 **ts-pattern 5.x**。对比对象：原生 `if/else`、`switch`。

## 速查

- 安装：`npm i ts-pattern`（或 `pnpm add ts-pattern` / `bun add ts-pattern`）
- 导入：`import { match, P } from 'ts-pattern'`
- 基本结构：`match(value).with(pattern, handler).exhaustive()`
- 兜底收尾：`.otherwise((value) => 默认值)`（等价 `.with(P._, handler).exhaustive()`）
- 通配符：`P._`（匹配任意值，`P.any` 是其别名）
- 类型通配：`P.string` / `P.number` / `P.boolean` / `P.bigint` / `P.nullish`
- 多模式（三选一走同一分支）：`.with('a', 'b', 'c', () => '...')`
- 核心认知：**match 是表达式**，命中分支 handler 的返回值即整条表达式的返回值
- ⚠️ **匹配自上而下短路**：第一个命中的分支胜出，`P._` 兜底放最后
- ⚠️ **`.exhaustive()` 做编译期穷尽检查**，漏分支编译报错；`.run()` 不做检查、不安全

## 一、ts-pattern 是什么

官方一句话定位：「**The exhaustive Pattern Matching library for TypeScript**」。三个关键点：

1. **替代条件语句**：用一条 `match().with().exhaustive()` 表达式表达原本要写一堆 `if/else`/`switch` 的分支逻辑。
2. **类型安全**：每个分支命中后，handler 拿到的值被**精确收窄**到对应类型；末尾 `.exhaustive()` 在编译期检查是否漏分支。
3. **求值表达式**：`match(...)` 不是语句而是表达式，整体有返回值，可直接 `const x = match(...)...`。

> 边界提醒：ts-pattern 处理「**已知类型的值**」的分支选择，不做「未知输入」的运行时 schema 校验——那是 Zod/Valibot 的范畴。二者常配合：先 Zod 解析得到可信类型，再 ts-pattern match 它做穷尽分发。

## 二、第一个匹配表达式

```ts
import { match } from 'ts-pattern';

type Status = 'loading' | 'success' | 'error';

// status 是字面量联合，三个分支恰好覆盖全部可能
const getMessage = (status: Status) =>
  match(status)
    .with('loading', () => 'Loading...')
    .with('success', () => 'Done!')
    .with('error', () => 'Failed')
    .exhaustive(); // 漏掉任一分支都会编译报错

getMessage('success'); // "Done!"
```

`.with(pattern, handler)` 的第一个参数是**模式**，第二个是命中后执行的**处理函数**；handler 的返回值就是整条表达式的返回值。

## 三、对象模式：匹配结构

用对象作模式时，ts-pattern 逐属性递归匹配——输入只要**包含**模式列出的键、且值满足子模式即命中（输入可有额外属性）：

```ts
import { match } from 'ts-pattern';

type Result =
  | { status: 'success'; data: string }
  | { status: 'error'; error: Error };

const render = (res: Result) =>
  match(res)
    // 命中后 res 被收窄到 success 成员，能安全访问 data
    .with({ status: 'success' }, (r) => `数据：${r.data}`)
    // 这里 r 被收窄到 error 成员，能访问 error
    .with({ status: 'error' }, (r) => `出错：${r.error.message}`)
    .exhaustive();
```

> 类型收窄是核心：在 success 分支里访问 `r.error` 会**编译报错**，因为该分支的类型上没有 `error` 字段。

## 四、常用通配模式

```ts
import { match, P } from 'ts-pattern';

const describe = (input: unknown) =>
  match(input)
    .with(P.string, (s) => `字符串(${s.length})`) // s: string
    .with(P.number, (n) => `数字 ${n}`)            // n: number
    .with(P.boolean, () => '布尔')
    .with(P.nullish, () => '空值(null/undefined)') // null | undefined
    .otherwise(() => '其它');
```

- `P._`：匹配任意值（`P.any` 是它的别名）。
- `P.string` / `P.number` / `P.boolean` / `P.bigint` / `P.symbol`：匹配对应基础类型。
- `P.nullish`：匹配 `null | undefined`；`P.nonNullable`：匹配除二者外的任意值。

## 五、兜底：otherwise 与 exhaustive

```ts
import { match, P } from 'ts-pattern';

// exhaustive：要求覆盖全部可能，漏分支编译报错
const a = (n: 1 | 2) =>
  match(n)
    .with(1, () => 'one')
    .with(2, () => 'two')
    .exhaustive();

// otherwise：提供兜底，不强制覆盖每种情况
const b = (n: number) =>
  match(n)
    .with(1, () => 'one')
    .otherwise(() => 'other'); // 等价 .with(P._, () => 'other').exhaustive()
```

> 经验法则：能穷尽就用 `.exhaustive()` 拿编译期安全；确实需要兜底（输入是开放类型如 `number`/`string`）才用 `.otherwise()`。

## 六、多模式：三选一走同一分支

```ts
import { match } from 'ts-pattern';

const kind = (tag: 'h1' | 'h2' | 'h3' | 'p') =>
  match(tag)
    // 在 handler 之前并列多个模式，命中任一即执行
    .with('h1', 'h2', 'h3', () => '标题')
    .with('p', () => '段落')
    .exhaustive();
```

> 注意区分：`.with('a', 'b', 'c', handler)` 是「三选一」；而 `.with(['a', 'b', 'c'], handler)` 会被解读为「匹配一个三元素元组」，语义完全不同。

---

掌握基本结构后，进入 [指南 · 基础](./guide-line/base)：`P.array` / `P.union` / `P.when` / `P.select` 等模式语言，与类型收窄的细节。
