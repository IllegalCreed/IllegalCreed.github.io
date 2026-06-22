---
layout: doc
outline: [2, 3]
---

# 确定性

> 基于 @faker-js/faker v10 编写

## 速查

- **`faker.seed(123)`**：固定随机序列；**再次 `faker.seed(123)` 会复位**到同一序列（这是测试可复现的关键）
- **`faker.seed()`（无参）**：返回当前 seed（记录失败用例便于复现），也用于「取消」固定
- **不 seed → flaky**：数据每次不同，断言具体假值随机失败、快照永远 diff
- seed 是**实例级全局、有副作用**：多个测试共享 `faker` 实例时要在 `afterEach(() => faker.seed())` 复位
- 相对日期（`faker.date.past()` 等）会随真实时间漂移，要可复现须配 **`faker.setDefaultRefDate(date)`**
- ⚠️ 同一 seed **只保证同版本内一致，不保证跨版本**；升级 Faker 后快照基线可能需重建

## 核心：`faker.seed()`

固定随机种子能让随机序列**可复现**。官方原话：`faker.seed(123)` 设定一致序列；再次调用 `faker.seed(123)` 会**重置**该序列。

```ts
faker.seed(123);
const firstRandom = faker.number.int();

faker.seed(123); // 重新设同一 seed，序列复位
const secondRandom = faker.number.int();

console.log(firstRandom === secondRandom); // true
```

`faker.seed()` 有**两重语义**，别混淆：

| 调用 | 作用 |
| ---- | ---- |
| `faker.seed(123)` | 设定数字种子，后续随机序列确定 |
| `faker.seed([42, 1, 2])` | 设定数组种子 |
| `faker.seed()`（**无参**） | **返回当前 seed**；常用于记录失败用例的 seed，或「取消」固定让后续测试重新随机化 |

## 为什么测试里要 seed

官方（frameworks 页）原话：

> It can sometimes be useful to do seeded tests ... so that it will generate the same random value each time. These are especially useful in tests that are meant to be deterministic, such as **snapshot tests**.

**不 seed 的后果**：每次跑数据都不同 → 断言 / 快照**不稳定（flaky）** → CI 红绿随机、快照永远 diff。
**seed 之后**：同一 seed 必出同一序列，CI **可复现**，快照稳定。

## Vitest / Jest 实战（官方示例）

```ts
import { faker } from "@faker-js/faker/locale/en";
import { afterEach, describe, expect, it } from "vitest";

// 让其它测试“不被 seed”：每个测试后重新随机化
afterEach(() => {
  faker.seed();
});

describe("reverse array", () => {
  it("should reverse the array", () => {
    faker.seed(1234); // 固定本测试的随机
    const title = faker.person.jobTitle();
    const name = faker.person.fullName();
    const animal = faker.animal.bear();

    const array = [title, name, animal];
    expect(array.reverse()).toStrictEqual([animal, name, title]);
    expect(array.reverse()).toMatchSnapshot(); // 快照稳定
  });
});
```

## seed 的作用范围（副作用）

- **seed 是实例级全局状态**：作用于该 faker 实例后续**所有**模块调用，直到再次 `seed()` 或调用无参 `seed()`。
- 多个测试**共享同一 `faker` 实例**时，前一个测试消耗掉的随机数会**影响**后一个测试的输出——这正是要在 `afterEach` 里 `faker.seed()` 复位的原因。
- 复位策略二选一：
  - `beforeEach(() => faker.seed(固定值))`：每个测试从同一起点开始（适合每个测试都要确定）。
  - `afterEach(() => faker.seed())`：测试后取消固定，让默认随机化恢复（适合只给个别测试 seed）。

## 相对日期：`setDefaultRefDate()`

`faker.date.past()` / `recent()` / `soon()` 等相对日期方法默认以「**现在**」为基准 → 结果随真实时间漂移、不可复现（即使 seed 固定了随机数，基准日期还是变的）。设一个固定参考日期可让日期类输出也确定：

```ts
faker.setDefaultRefDate("2023-01-01T00:00:00.000Z");
// 之后所有 faker.date.* 都以此为基准，输出稳定
```

> 做含日期字段的快照测试时，`faker.seed(...)` + `faker.setDefaultRefDate(...)` 通常要**一起**用，才能让日期也可复现。

## ⚠️ 同一 seed 跨版本不保证一致

这是最容易被误解的一点：很多人以为「seed 一样 = 输出永远一样」。事实是——

> `faker.seed` 只保证「**同一 Faker 版本内**」可复现，**不保证跨版本**。升级 Faker 版本可能改变同一 seed 的输出（底层数据集 / 算法变动）。

**实践影响**：升级 `@faker-js/faker` 后，依赖具体假值的**快照基线可能需要更新**（重新生成快照）。把它当作升级 Faker 时的常规检查项，而不是 bug。
