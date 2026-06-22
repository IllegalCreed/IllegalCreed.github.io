---
layout: doc
outline: [2, 3]
---

# 收缩与复现

> 基于 fast-check v4.8 编写

## 速查

- **shrinking（收缩）**：谓词失败后，fast-check 自动把反例简化到「最小可复现」再报告
- 失败报告三件套：**`seed`** + **`path`** + **`Counterexample`**（外加 `Shrunk N time(s)` 收缩步数）
- 复现失败 = 把报告里的 `{ seed, path }` **原样填回** `fc.assert` 第二参，精确重放到那个反例
- `numRuns` 默认 **100**（CI 时间 vs 覆盖度的主旋钮）
- `endOnFailure: true` = **关闭 shrinking**、第一个失败即停（要最小反例千万别开）
- `verbose` 详细度 **0/1/2**（API 默认 **0/None**）；`examples` 把固定回归/复现用例钉进属性优先跑

## shrinking 是什么、为什么是核心卖点

当谓词失败，fast-check **不止报第一个出错的随机输入**，而是**系统性地把反例简化成「最小可复现」**——更小的数、更短的数组、更简单的字符串——再报告。这正是属性测试相对纯随机 / fuzzing 的关键优势：fuzzing 常把第一个触发的原始大输入直接甩给你（很大很乱），而 fast-check 给你一个一眼能看懂的最小反例。

官方报告示例：

```txt
Error: Property failed after 1 tests
{ seed: -1819918769, path: "0:...:3", endOnFailure: true }
Counterexample: [[2, 1000000000]]
Shrunk 66 time(s)
Got error: AssertionError: expected 1000000000 to be less than or equal to 2
```

关键字段：

- **`Counterexample`**：收缩后的**最小反例**（这里是 `[[2, 1000000000]]`）。
- **`Shrunk 66 time(s)`**：收缩了 66 步才到这个最小反例。
- **`seed`** / **`path`**：用于精确重放（下一节）。

## seed + path：复现失败的标准姿势

失败报告里直接给出**可粘贴的复现配置**。把 `seed` 和 `path` 填回 `fc.assert` 的第二参，即可精确重放到那个（已收缩的）反例：

```ts
fc.assert(
  fc.property(fc.array(fc.integer()), (data) => {
    /* ... 你的属性 ... */
  }),
  { seed: -1819918769, path: "0:...:3", endOnFailure: true }, // 原样粘贴报告里的配置即可复现
);
```

- **`seed`**：随机数种子，决定整轮的生成序列。固定后整轮可复现；失败报告会自动回填。
- **`path`**：在「生成树 + 收缩树」里的定位路径（形如 `"0:...:3"`），直接跳到那个已收缩的反例。

> 复现 flaky 的正确做法 = **复制报告里的 `{ seed, path }` 原样填回 `fc.assert`**，不是去改谓词、也不是单纯把 `numRuns` 设成 1。另一种重放方式是用 `examples: [[reportedValue]]` 把那个值钉成固定用例（见下文）。

## fc.assert 的 run 参数（含默认值）

`fc.assert(property, params)` 的第二参是 `Parameters`，常用字段：

| 参数 | 默认 | 作用 |
| ---- | ---- | ---- |
| `numRuns` | **100** | 每个属性跑多少组输入（CI 时间 vs 覆盖度的主旋钮） |
| `seed` | 随机（基于时间） | 固定后整轮可复现；失败报告会回填 |
| `path` | — | 配合 `seed` 直达某个（收缩后）反例 |
| `endOnFailure` | `false` | 设 `true` **跳过 shrinking**，第一个失败即停 |
| `verbose` | `0`（None） | 详细度 0/1/2；`1` 列所有失败输入、`2` 连成功也列 |
| `examples` | `[]` | 先跑这批「手写示例」再跑生成值 |
| `interruptAfterTimeLimit` | — | 到时限后停止启动新 run（按时间预算控制） |
| `markInterruptAsFailure` | `false` | 因时限中断是否算失败 |
| `timeout` | — | 单个异步谓词超时（ms） |
| `ignoreEqualValues` | `false` | 忽略重复生成的相同输入 |

### numRuns（默认 100）

每个属性默认抽 **100** 组输入。这是控制「CI 时间 vs 覆盖度」的主旋钮：关键属性可调高（甚至上百万当 fuzzer 用），CI 紧张时按属性重要度分档。

```ts
fc.assert(fc.property(fc.nat(), (n) => f(n) >= 0), { numRuns: 1000 });
```

### endOnFailure（关闭 shrinking）

设 `endOnFailure: true` 会**跳过收缩**、第一个失败立即停止——只想快速确认「会不会挂」时有用，但这样**拿不到最小反例**。要最小反例时千万别开它。

### verbose（详细度 0/1/2）

`verbose` 控制报告详细度：`0`（None，默认，不额外列输入）/ `1`（列出所有失败输入）/ `2`（连成功输入也列）。调试某条属性为何收缩到这个反例时把它调到 1 或 2。

> 注意：fast-check 的 `verbose` **API 默认值是 `0`/None**。某些教程页文案写「defaulted to 1」是那段演示里**手动设置**的值，不是 API 默认——记忆时以 **API 默认 0** 为准。

### examples（钉回归 / 复现用例）

`examples` 让 fast-check **先跑你手写的这批示例，再跑随机生成值**。把已知反例、复现用例钉进来，就成了「永远会被先验证」的回归用例：

```ts
fc.assert(
  fc.property(fc.integer(), fc.integer(), (a, b) => add(a, b) === a + b),
  { examples: [[0, 0], [-1, 1], [2147483647, 1]] }, // 这几个固定示例每次优先跑
);
```
