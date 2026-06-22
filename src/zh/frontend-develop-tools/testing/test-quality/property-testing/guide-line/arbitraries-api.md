---
layout: doc
outline: [2, 3]
---

# Arbitraries 与核心 API

> 基于 fast-check v4.8 编写

## 速查

- 入口三件套：`fc.assert(fc.property(...arbs, predicate))`，谓词返回 `false`/抛错即失败
- 同步 `fc.property`、异步 `fc.asyncProperty`（`fc.assert` 返回 Promise，**必须 `await`**）
- arbitraries（内置 70+）：`integer`/`nat`/`float`/`double`/`boolean`/`string`/`array`/`tuple`/`record`/`oneof`/`constantFrom`…
- `fc.nat()` **含 0**，默认上界 **2147483647**；`fc.double()` **默认会产出 `NaN`/`±Infinity`**，要有限值须 `noNaN`/`noDefaultInfinity`
- **v4 变化**：旧的 `fullUnicodeString`/`asciiString`/`hexaString` 统一收编进 `fc.string({ unit })`
- 组合子：`.map`（构造合法输入，**首选**）/ `.filter`（慎用，丢样本）/ `.chain`（依赖生成）/ `.noShrink`（反模式）
- `fc.pre(condition)`：在谓词体内做前置条件过滤

## 入口三件套：assert / property / asyncProperty

```ts
import fc from "fast-check";

// fc.assert(fc.property(arb1, arb2, ..., predicate))
fc.assert(
  fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
    return (a + b + c).includes(b); // 谓词返回 boolean，或用 expect 抛错
  }),
);
```

- **`fc.property(...arbs, predicate)`**：**同步**属性。谓词签名 `(...values) => boolean | void`，返回 `false` 或抛异常（含 `expect` 失败）视为失败。
- **`fc.asyncProperty(...arbs, predicate)`**：**异步**属性，谓词返回 `Promise<boolean | void>`。此时 `fc.assert(...)` 返回 `Promise`，**必须 `await`**：

```ts
await fc.assert(
  fc.asyncProperty(fc.nat(), async (n) => {
    const r = await loadById(n);
    return r !== undefined;
  }),
);
```

> 高频易错点：异步属性忘记 `await fc.assert(...)`，测试会在断言真正跑完前就「假绿」通过。

- **`fc.assert(property, params?)`**：真正的执行器（runner），默认跑 `numRuns` 次；失败时执行 shrinking 并抛出带 `seed`/`path`/`Counterexample` 的报告。run 参数详见 [收缩与复现](./shrinking-replay.md)。

## 常用 arbitraries

fast-check 内置 70+ 个 arbitrary。下面是高频集合：

### 基本类型

```ts
fc.integer({ min: 0, max: 100 }); // 区间整数
fc.nat(); // 非负整数，含 0，默认上界 2147483647（2^31-1）
fc.nat(10); // 上界改成 10
fc.float();
fc.double({ noNaN: true, noDefaultInfinity: true }); // ⚠️ 不加这俩默认会产出 NaN/±Infinity
fc.boolean();
fc.bigInt();
```

> 两个常踩坑：`fc.nat()` **包含 0**、默认上界是 **2147483647**；`fc.double()` / `fc.float()` **默认会生成 `NaN` 和 `±Infinity`**，需要纯有限值时必须显式 `noNaN: true, noDefaultInfinity: true`。

### 字符串（v4 统一为 unit）

v4 的一个重大变化：旧的 `fc.fullUnicodeString()`/`fc.asciiString()`/`fc.hexaString()`/`fc.unicodeString()` 等被**统一收编进 `fc.string({ unit })`**。

```ts
fc.string(); // 默认 unit: 'grapheme-ascii'，可打印 ASCII
fc.string({ unit: "grapheme", minLength: 1, maxLength: 20 }); // 多码点字素
fc.string({ unit: "binary" }); // 任意码点（除半代理）
fc.string({ unit: fc.constantFrom("a", "b", "c") }); // 自定义字符集
```

`unit` 取值：`'grapheme-ascii'`（默认）、`'grapheme'`、`'grapheme-composite'`、`'binary'`、`'binary-ascii'`，或传一个自定义 arbitrary。`minLength` 默认 0、`maxLength` 默认 `0x7fffffff`，按 **unit 个数**计长。若你在老代码里看到 `fullUnicodeString` 之类，迁移到 `fc.string({ unit })` 即可。

### 常量 / 选择

```ts
fc.constant(42); // 恒定单值
fc.constantFrom("GET", "POST", "PUT"); // 随机选一个；⚠️ 第一个参数 = shrinking 默认目标
fc.option(fc.nat(), { nil: null }); // 可能产出 null（或自定义 nil）
fc.oneof(fc.nat(), fc.string()); // 在多个 arbitrary 间选
fc.oneof({ arbitrary: fc.nat(), weight: 3 }, { arbitrary: fc.string(), weight: 1 }); // 带权重
```

> `fc.constantFrom(a, b, c)` 的**第一个参数是 shrinking 的默认目标**——收缩时会优先往它靠。

### 复合 / 容器

```ts
fc.array(fc.integer(), { minLength: 1, maxLength: 5 });
fc.tuple(fc.string(), fc.nat()); // 定长异构元组
fc.uniqueArray(fc.integer(), { maxLength: 10 }); // 去重数组
fc.record({ id: fc.nat(), name: fc.string() }); // 固定键对象
fc.record({ id: fc.nat(), name: fc.string() }, { requiredKeys: ["id"] }); // name 可缺省
fc.dictionary(fc.string(), fc.nat()); // 键值都生成的对象
fc.json(); // 合法 JSON 字符串
fc.anything(); // 任意 JS 值
fc.date(); // 日期
```

## 组合子（combinators）

组合子对一个已有 arbitrary 做变换，得到新的 arbitrary：

```ts
// .map：把生成值映射成另一种——构造「合法输入」的首选（不丢样本）
const userArb = fc.tuple(fc.string(), fc.nat({ max: 120 })).map(([name, age]) => ({ name, age }));

// .filter：只保留满足条件的值——慎用，过滤太狠会大量丢弃 → 慢 / 报「too many pre-condition failures」
const evenArb = fc.integer().filter((n) => n % 2 === 0); // 改用 fc.integer().map((n) => n * 2) 更好

// .chain：用上一个生成值「动态决定」下一个 arbitrary（依赖生成）
const lenThenArr = fc.nat({ max: 10 }).chain((len) => fc.array(fc.integer(), { minLength: len, maxLength: len }));

// .noShrink：禁止该 arbitrary 参与收缩——⚠️ 反模式，会破坏最小反例，仅特殊场景用
const noShrinkArb = fc.integer().noShrink();
```

口诀：**构造合法输入优先 `.map`，不要 `.filter` 硬筛**（filter 丢样本、拖慢、可能耗尽生成预算）；**依赖生成用 `.chain`**；`.noShrink()` 是反模式，正常保留默认收缩。

## fc.pre：谓词内的前置条件

`fc.pre(condition)` 写在**谓词体内**，对应属性定义里的 precondition——条件不满足时丢弃本次 run：

```ts
fc.assert(
  fc.property(fc.integer(), fc.integer(), (a, b) => {
    fc.pre(b !== 0); // 前置条件：除数非 0，否则丢弃本次输入
    return Number.isFinite(a / b);
  }),
);
```

注意：`fc.pre(...)` 丢弃过多输入时，fast-check 会因有效样本不足而告警（pre-condition failures 过多）。能用 `.map` 直接**构造**合法输入时，优先 `.map`，把 `fc.pre` 留给少量、命中率高的前置约束。
