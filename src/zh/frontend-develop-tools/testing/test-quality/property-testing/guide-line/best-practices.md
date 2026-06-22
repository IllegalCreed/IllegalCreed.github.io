---
layout: doc
outline: [2, 3]
---

# 最佳实践与反模式

> 基于 fast-check v4.8 编写

## 速查

- **头号反模式**：在谓词里重写被测实现（自己跟自己对拍，属性失去意义）
- 合法输入用 **`.map` 构造**，别用 **`.filter` 硬筛**（过滤太狠 → 丢弃过多 → 慢 / 报「too many pre-condition failures」）
- **`.noShrink()` 是反模式**：会破坏最小反例，调试反而更难
- `numRuns` 与 CI 时间权衡：默认 100 适合日常，关键属性调高，CI 紧张时分档别一刀切
- flaky 复现靠 **`{ seed, path }`** 填回 `fc.assert`，回归钉用例靠 **`examples`**
- 与 example-based **互补非替代**；**fast-check ≠ Faker.js**（前者探索任意/边界 + shrink 找 bug，后者造逼真假数据）

## 选「真正的不变量」，别重写实现当断言

属性应该是**独立于实现**的规律——往返、长度守恒、排序、对拍朴素实现。**最重要的反模式**是把被测函数的逻辑照抄进谓词：

```ts
// ❌ 反模式：谓词里重写了 add 的实现，等于自己跟自己对拍，毫无价值
fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => add(a, b) === a + b));

// ✅ 选独立于实现的规律：交换律（不关心 add 内部怎么实现）
fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => add(a, b) === add(b, a)));

// ✅ 对拍朴素实现（test oracle）：naive 简单到一眼正确，用它给复杂实现挑错
fc.assert(fc.property(fc.array(fc.integer()), (arr) => fastSort(arr).join() === naiveSort(arr).join()));
```

判断标准：如果你的谓词「需要知道被测函数怎么实现」才能写出来，多半就退化成自测了。改问「这个函数的输出应该满足什么不依赖实现的规律」。

## 合法输入用 `.map` 构造，别用 `.filter` 硬筛

要「合法输入」就**构造**它（`.map` / `.chain`），别靠 `.filter` 过滤。filter 过度会大量丢弃生成值 → 变慢、甚至触发 fast-check 的「too many pre-condition failures」告警：

```ts
// ❌ filter 硬筛：偶数只有一半命中，大量样本被丢
const even = fc.integer().filter((n) => n % 2 === 0);

// ✅ map 构造：每个生成值都有效，零丢弃
const even2 = fc.integer().map((n) => n * 2);

// ✅ 依赖生成用 chain：先生成长度，再生成定长数组
const fixedLenArr = fc.nat({ max: 10 }).chain((len) => fc.array(fc.integer(), { minLength: len, maxLength: len }));
```

`fc.pre(...)` 同理——留给命中率高的少量前置约束，别拿它当主力过滤手段。

## 慎用 `.noShrink()`

`.noShrink()` 会让该 arbitrary **不参与收缩**，失败时你就拿不到最小反例，调试反而更难。除非有特殊理由，**保留默认收缩**——shrinking 正是属性测试相对 fuzzing 的核心价值，主动关掉它得不偿失。

## numRuns 与 CI 时间权衡

默认 `numRuns: 100` 适合日常。调优思路：

- 关键属性（核心算法、序列化往返）可调高到上千，甚至上百万当「带 shrinking 的 fuzzer」（配合 `endOnFailure: true`）。
- CI 时间紧张时**按属性重要度分档**，别给所有属性一刀切高 runs。
- 异步属性记得 `fc.asyncProperty` + `await fc.assert(...)`；有状态系统上 model-based。

## 用 seed 固定复现 flaky，用 examples 钉回归

- CI 偶发失败 → 复制报告里的 `{ seed, path }` 本地原样填回 `fc.assert`，精确重放那个反例（详见 [收缩与复现](./shrinking-replay.md)）。
- 把已知反例、复现用例用 `examples: [[...]]` 钉成「每次优先跑」的回归用例。

## 与 example-based 互补，不是替代

属性测试覆盖「规律层」，举例式测试覆盖「具体合同层」（边界值、已知 bug 回归、文档式用例）。两者并存：

- 用属性测「`decode∘encode = id`」「排序后升序」这类对所有输入成立的规律。
- 用举例测「这个特定边界值返回这个特定结果」「这个历史 bug 不再复现」。

## fast-check ≠ Faker.js（高频对比）

两者都「生成数据」，但目的根本不同，**不可互换**：

| 维度 | **fast-check** | **Faker.js** |
| ---- | -------------- | ------------ |
| 目的 | 系统性探索「任意/边界」输入以**证伪不变量** | 造「看起来真实」的假数据（姓名/邮箱/地址…） |
| 生成倾向 | 偏向边界/极端/对抗（空串、`0`、`NaN`、超长、特殊字符） | 偏向**逼真、好看**的样例 |
| 失败后 | **自动 shrinking 出最小反例** + `seed`/`path` 复现 | 无收缩、无反例概念 |
| 典型用途 | 单元/属性测试、找 bug | 填充 demo / seed 数据库 / mock 列表 |
| 一句话 | 「探索任意输入并收缩」 | 「造好看的假数据」 |

判断口诀：要**测正确性 / 挖边界**用 fast-check；要**填一份像样的展示数据**用 Faker。把 Faker 造的「逼真数据」当成属性测试的输入，等于放弃了 fast-check 探索边界和收缩反例的全部价值。
