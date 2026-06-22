---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 fast-check v4.8 编写

## 速查

- 属性测试 = 不写具体用例，声明**对所有输入成立的不变量**，框架自动生成上千组输入去证伪
- 安装：`pnpm add -D fast-check`（core 4.8.0，runner-agnostic，任何运行器裸用）
- 最小例：`fc.assert(fc.property(arb1, arb2, (a, b) => 谓词))`——谓词返回 `false` 或抛错即失败
- 异步用 `fc.asyncProperty`，且 `fc.assert(...)` 返回 Promise，**必须 `await`**（忘 await = 假绿）
- 默认每个属性跑 **`numRuns: 100`** 组输入
- **shrinking**：失败后自动把反例收缩到「最小可复现」，并给出可重放的 `seed` / `path`
- 与 example-based 测试**互补**：属性测「规律」，举例测「具体合同」（边界、已知 bug、文档用例）

## 属性测试是什么

传统的 **example-based（举例式）测试**由你手写「具体输入 + 期望输出」：

```ts
// 举例式：你想到几个用例就写几个
expect(add(1, 2)).toBe(3);
expect(add(0, 0)).toBe(0);
expect(add(-1, 1)).toBe(0);
```

它只覆盖你「想得到」的用例——想不到的边界（`add(MAX_SAFE_INTEGER, 1)`、负零、`NaN`）就是盲区。

**property-based（属性式）测试**换一种思路：不写具体值，而是声明一条**对所有输入都成立的不变量（property / invariant）**，由框架生成大量随机输入去尝试证伪。fast-check 官方对 property 的权威表述是：

> for any (x, y, ...) such that precondition(x, y, ...) holds, predicate(x, y, ...) is true
> （对任意满足前置条件的输入，谓词都为真）

它带来三个正面影响：① 随时间测到越来越多输入；② 测到更多样、更对抗的输入；③ **你不必自己绞尽脑汁想反例**——框架替你找。

> fast-check 灵感来自 Haskell 的 **QuickCheck**（属性测试鼻祖，1999）和 Python 的 **Hypothesis**，是 JS/TS 生态的事实标准实现。详见 [概念与范式](./guide-line/concepts-paradigm.md)。

## 从举例到属性：一次思路转变

以「数组排序」为例。举例式要逐个手写期望结果；属性式则问「排好序的数组应该满足什么规律」——长度不变、整体升序、且是原数组的一个排列。这些规律对**任何**输入数组都成立，于是变成一条属性：

```ts
import fc from "fast-check"; // core 4.8.0

fc.assert(
  fc.property(fc.array(fc.integer()), (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    // 不变量 1：长度守恒
    if (sorted.length !== arr.length) return false;
    // 不变量 2：相邻元素非降序
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1] > sorted[i]) return false;
    }
    return true;
  }),
);
```

`fc.array(fc.integer())` 是一个 **arbitrary（生成器）**，描述「整数数组」这一输入空间；fast-check 默认从中抽 100 组喂给谓词。

## 最小可运行示例

`fc.assert(fc.property(...))` 是属性测试的入口三件套，谓词返回 `boolean`（或用 `expect` 抛错）：

```ts
import fc from "fast-check";

// 同步属性：加法满足交换律
fc.assert(
  fc.property(fc.integer(), fc.integer(), (a, b) => {
    return a + b === b + a; // 对任意整数都成立
  }),
);

// 异步属性：注意必须用 asyncProperty + await
await fc.assert(
  fc.asyncProperty(fc.nat(), async (id) => {
    const user = await fetchUser(id);
    return user !== undefined; // 谓词返回 Promise<boolean>
  }),
);
```

> 易错点：异步场景一定要用 `fc.asyncProperty`，此时 `fc.assert(...)` 返回 Promise，忘记 `await` 会让测试「假绿」（断言其实没跑完就通过）。

## shrinking：失败时给你最小反例

属性测试相对纯随机/fuzzing 的杀手锏是 **shrinking（收缩）**。当谓词失败，fast-check 不会把第一个出错的随机大输入直接甩给你，而是系统性地把反例往「更小、更简单」的方向收缩，最后报告一个**最小可复现反例**：

```txt
Error: Property failed after 1 tests
{ seed: -1819918769, path: "0:...:3", endOnFailure: true }
Counterexample: [[2, 1000000000]]
Shrunk 66 time(s)
Got error: AssertionError: expected 1000000000 to be less than or equal to 2
```

`Counterexample` 是收缩后的最小反例，`Shrunk 66 time(s)` 表示收缩了 66 步，`seed` + `path` 让你能精确重放——这一套是属性测试「既能找到 bug、又能让 bug 好读好复现」的核心。详见 [收缩与复现](./guide-line/shrinking-replay.md)。

## 下一步

- [概念与范式](./guide-line/concepts-paradigm.md)：范式转变、property/不变量、QuickCheck 渊源、vs fuzzing、适合场景
- [Arbitraries 与核心 API](./guide-line/arbitraries-api.md)：`fc.property`/`asyncProperty`、内置 arbitraries、`.map/.filter/.chain`、`fc.pre`
- [收缩与复现](./guide-line/shrinking-replay.md)：shrinking 原理、`seed`/`path` 重放、`numRuns`/`verbose`/`endOnFailure`
- [框架集成与进阶](./guide-line/integration-advanced.md)：`@fast-check/vitest`、`@fast-check/jest`、model-based、与 Zod/Valibot 结合
- [最佳实践与反模式](./guide-line/best-practices.md)：选真正的不变量、`.map` vs `.filter`、CI 时间、vs Faker.js
