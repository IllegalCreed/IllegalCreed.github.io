---
layout: doc
outline: [2, 3]
---

# 概念与范式

> 基于 fast-check v4.8 编写

## 速查

- **example-based**：手写「具体输入 → 期望输出」，只覆盖你想得到的用例
- **property-based**：声明「对所有输入成立的不变量」，框架自动生成上千组输入证伪
- property（属性 / 不变量）= 独立于实现的规律，不是某个具体输入→输出
- 渊源：fast-check 灵感来自 **QuickCheck（Haskell）+ Hypothesis（Python）**，非自创
- vs fuzzing：属性测试有**明确 oracle/property** + **自动 shrinking 出最小反例**；fuzzing 常无 oracle、只报第一个原始大输入
- 经典适合场景：**往返 / 排序 / 幂等 / 交换律 / 结合律 / 对拍朴素实现**

## 两种测试范式

| 维度 | example-based（举例式） | property-based（属性式） |
| ---- | ----------------------- | ------------------------ |
| 你写什么 | 具体输入 + 期望输出 | 对所有输入成立的不变量 |
| 输入来源 | 你手工挑选 | 框架自动生成（默认 100 组） |
| 覆盖面 | 你「想得到」的用例 | 你想不到的边界也被探索 |
| 失败信息 | 你写的那个用例失败 | shrinking 后的**最小反例** + `seed`/`path` |
| 典型代表 | `expect(add(1,2)).toBe(3)` | `fc.property(..., (a,b) => a+b===b+a)` |

两者不是替代关系，而是互补：举例式钉「具体合同」（边界值、已知 bug 回归、文档式用例），属性式覆盖「规律层」。

## 什么是 property（属性 / 不变量）

property 是一条**对整个输入空间都成立的规律**，独立于被测函数的具体实现。fast-check 官方的定义形式是：

> A property is to property-based tests, what an example is to example-based tests.
> （属性之于属性测试 = 举例之于举例式测试，是核心构件。）
>
> for any (x, y, ...) such that precondition(x, y, ...) holds, predicate(x, y, ...) is true.

拆开看，一条属性由三部分组成：

1. **输入空间**：用 arbitraries 描述（如「任意整数数组」`fc.array(fc.integer())`）。
2. **前置条件 precondition**（可选）：筛掉不该考虑的输入（用 `fc.pre(...)`）。
3. **谓词 predicate**：对满足前置条件的输入，断言必为真（返回 `false` 或 `expect` 抛错即失败）。

关键认知：property 描述的是「规律」，不是「这个输入应该得到那个输出」。一旦你在谓词里把被测实现重抄一遍，就退化成自己跟自己对拍，属性失去意义——这是头号反模式，详见 [最佳实践](./best-practices.md)。

## QuickCheck 家族渊源

属性测试不是新发明。fast-check 官方自述「inspired by QuickCheck (Haskell) and Hypothesis (Python)」，它处在一条清晰的谱系上：

- **QuickCheck**（Haskell，1999，Koen Claessen & John Hughes）——属性测试鼻祖，首次提出「声明属性 + 随机生成 + 自动收缩」。
- 各语言移植：**ScalaCheck**、**test.check**（Clojure）、**Hypothesis**（Python）、**PropEr**（Erlang）、**Hedgehog**。
- **fast-check** 是 JS/TS 生态的事实标准实现，用 TypeScript 编写，把 QuickCheck 的理念带到前端。

> 出题/面试常考点：fast-check 的灵感来源是 QuickCheck + Hypothesis，**不要答成「自创」或「源于某 JS 库」**。

## 与模糊测试（fuzzing）的关系与区别

属性测试和模糊测试（fuzzing）都会自动生成大量输入、都擅长挖边界和复杂组合（fast-check 官网甚至把自身能力描述为 "fuzzing and generative testing"，能挖 race condition、prototype poisoning、zero-day）。但二者有两处关键区别：

| 维度 | 模糊测试 fuzzing | 属性测试 property-based |
| ---- | ---------------- | ----------------------- |
| 判定标准 | 通常只问「会不会崩 / 抛异常」（**无 oracle**） | 针对**明确的 property/oracle** 判真假 |
| 失败报告 | 经典 fuzzer 报**第一个**触发的原始输入（往往很大很乱） | 自动 **shrinking** 收缩到**最小可复现反例** |

换句话说，属性测试的分水岭 = **有明确 oracle/property** + **自动 shrinking**。fast-check 本身也能当「带 shrinking 的 fuzzer」用（设 `numRuns: 1_000_000, endOnFailure: true`），但其常态价值在于围绕一条属性证伪并给出可读的最小反例。

## 适合属性测试的经典场景

不知道写什么属性时，从这些「天然不变量」模式入手最容易落地：

| 模式 | 不变量表述 | 例子 |
| ---- | ---------- | ---- |
| **往返 round-trip** | `decode(encode(x)) === x` | JSON、base64、URL 编码、序列化 |
| **排序 sort** | 长度不变 + 整体升序 + 是原数组的排列 | `sorted.length === arr.length` |
| **幂等 idempotent** | `f(f(x)) === f(x)` | 去重、归一化、`reverse(reverse(x)) === x` |
| **交换律 commutative** | `f(a, b) === f(b, a)` | 加法、集合并 |
| **结合律 / 单位元** | `f(f(a,b),c) === f(a,f(b,c))` | reducer、Monoid |
| **对拍 test oracle** | `fast(x) === naive(x)` | 优化实现 vs 暴力朴素实现 |

其中「reverse 两次回到原数组」「`decode∘encode = id`」是**往返**属性的标准范例；「优化实现对拍朴素实现」叫 **test oracle / 对拍**，是属性测试最实用的落地姿势——naive 实现简单到一眼正确，用它当参照系给复杂实现挑错。
