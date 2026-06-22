---
layout: doc
outline: [2, 3]
---

# 变异体与算子

> 基于 StrykerJS v9.6 编写

## 速查

- **8 种状态**：Pending / Killed / Survived / No coverage / Timeout / Runtime error / Compile error / Ignored
- **detected（进分子）** = `Killed + Timeout`——⚠️ **timeout 算被检测到，不是 survived**
- **undetected（进分母拖低分）** = `Survived + No coverage`——⚠️ no coverage 计入分母，不是「不算」
- **invalid（不计分）** = `Runtime error + Compile error`；`Ignored` / `Pending` 也不计分
- **Killed 判定**：至少**一个**测试失败；**Survived 判定**：**所有**测试都通过
- **15 类算子**：算术 / 数组 / 赋值 / 块语句 / 布尔 / 条件 / 相等(边界) / 逻辑 / 方法 / 对象 / 可选链 / 正则 / 字符串 / 一元 / 自增自减
- **等价变异体**：变异后功能与原码完全等价，**任何测试都杀不死**，是分数到不了 100% 的根因

## mutant 生命周期状态机

一个变异体从生成到出结果，会落在以下 8 种状态之一（mutation-testing-elements 官方规范，StrykerJS 完全遵循）：

| 状态 | 含义 | 对分数的影响 |
| ---- | ---- | ------------ |
| **Pending** | 已生成、尚未运行（临时态） | 不计入分数 |
| **Killed（被杀）** | 该变异体激活时**至少一个测试失败** | **detected**（进分子） |
| **Survived（存活）** | 该变异体激活时**所有测试都通过** | **undetected**（进分母，拖低分数） |
| **No coverage（无覆盖）** | **没有任何测试覆盖**该变异体，因此存活 | **undetected**（进分母，拖低分数） |
| **Timeout（超时）** | 跑测试时触发了超时 | **detected**（算作被检测到，≈ killed） |
| **Runtime error（运行时错误）** | 跑测试时报错（而非测试失败） | **invalid**，不计入分数 |
| **Compile error（编译错误）** | 变异体导致编译失败 | **invalid**，不计入分数 |
| **Ignored（被忽略）** | 因被显式忽略而未测试（如 `// Stryker disable`） | 不计入分数 |

派生指标一并记住：

```
detected   = killed + timeout
undetected = survived + no coverage
covered    = detected + survived          （被测试覆盖到的）
valid      = detected + undetected         （有效变异体 = 分母）
invalid    = runtime errors + compile errors
total      = valid + invalid + ignored + pending
```

## ⚠️ Timeout 到底算不算 killed

高频易错点，结论：**算「被检测到」（detected），对分数有正贡献，等同 killed 进分子——但状态名独立叫 Timeout，不叫 Killed。**

- 直觉解释：变异体导致测试卡死 / 死循环触发超时，相当于「测试以某种方式察觉到了异常」，所以归入 detected 一侧。
- 出题 / 严谨表述时要区分两件事：「**计为 detected**」（对，进分子）≠「**状态名是 killed**」（错，是独立的 Timeout 状态）。

## ⚠️ No coverage：计入分母，不是「不算」

另一个易错点：**No coverage 属于 undetected，计入分母 `valid`，会拖低分数**——不是「没覆盖就不参与统计」。

- 它表示这个变异体所在的代码**根本没有测试覆盖**，自然没人能杀死它，所以归为「未检测到」。
- 这也是为什么「基于覆盖代码的分数」会更高——那个口径把 no coverage 从分母剔除了（见 [概念与变异分数](./concepts-and-score.md)）。

## ⚠️ Runtime / Compile error：invalid，不计分

`Runtime error` 与 `Compile error` 属于 **invalid**，**既不进分子也不进分母**。

- 注意区分 **Runtime error**（跑测试时代码抛错）与 **Killed**（测试断言失败）——前者不计分，后者计入分子。
- TS 项目里变异常引发编译错误（Compile error），StrykerJS 默认 `disableTypeChecks: true` 自动插 `// @ts-nocheck` 规避，或用 `@stryker-mutator/typescript-checker` 在测试前剔除编译错变异体（详见 [StrykerJS 配置](./strykerjs-config.md)）。

## 变异算子（mutators）分类

StrykerJS 内置 **15 类变异算子**，每类定义了「如何把一段代码改坏」（官方 supported-mutators 规范）：

| 算子 | 示例（before → after） |
| ---- | ---------------------- |
| **Arithmetic（算术）** | `a + b` → `a - b`；`a * b` → `a / b`；`a % b` → `a * b` |
| **Array Declaration（数组）** | `[1, 2, 3]` → `[]`；`new Array(1,2,3)` → `new Array()` |
| **Assignment（赋值）** | `+=` → `-=`；`*=` → `/=`；`<<=` → `>>=` |
| **Block Statement（块语句）** | `function f() { doSomething(); }` → `function f() {}`（**清空函数体**） |
| **Boolean Literal（布尔字面量）** | `true` → `false`；`false` → `true`；`!(a == b)` → `a == b`（去取反） |
| **Conditional Expression（条件表达式）** | `a > b` → `true` 或 `false`；循环条件替换为常量 |
| **Equality Operator（相等 / 边界）** | `a < b` → `a <= b` 或 `a >= b`；`a == b` → `a != b`；`a === b` → `a !== b` |
| **Logical Operator（逻辑）** | `a && b` → `a \|\| b`；`a ?? b` → `a && b` |
| **Method Expression（方法）** | `endsWith()` ↔ `startsWith()`；`toUpperCase()` → `toLowerCase()`；删除 `sort()` / `filter()` |
| **Object Literal（对象字面量）** | `{ foo: 'bar' }` → `{}` |
| **Optional Chaining（可选链）** | `foo?.bar` → `foo.bar`；`foo?.[1]` → `foo[1]` |
| **Regex（正则）** | `^abc` → `abc`（去锚点）；`[abc]` → `[^abc]`；`\d` ↔ `\D` |
| **String Literal（字符串字面量）** | `"foo"` → `""`；`""` → `"Stryker was here!"` |
| **Unary Operator（一元）** | `+a` → `-a`；`-a` → `+a` |
| **Update Operator（自增自减）** | `a++` → `a--`；`++a` → `--a` |

几个常考归属（容易混）：

- `<` → `<=`：属 **Equality Operator**（边界变异，最能暴露「临界值没测」）。
- `true` → `false`：属 **Boolean Literal**。
- 清空函数体 `{}`：属 **Block Statement**。
- `a && b` → `a || b`：属 **Logical Operator**。
- `foo?.bar` → `foo.bar`（去掉可选链）：属 **Optional Chaining**。
- 空字符串被填成 `"Stryker was here!"`：是 **String Literal** 的反向变异，Stryker 的标志性「彩蛋」。

## 等价变异体（equivalent mutant）

- **定义**：变异后的代码与原代码**功能完全等价**（任何输入下行为都没有可观测差异），因此**理论上任何测试都无法杀死它**。
- **经典例子**：求最大值 `return a < b ? b : a` 里把 `<` 变成 `<=`——当 `a === b` 时两者都返回 `a`（即 `b`），**对所有输入输出相同**，无法用断言区分。
- **影响**：它是变异测试**无法达到 100% 分数的根本原因之一**。
- **正确处理**：用源码注释指令带原因标记，而不是硬写无意义测试：
  ```ts
  // Stryker disable next-line EqualityOperator: <= 与 < 在 a===b 时等价，无法区分
  return a < b ? b : a;
  ```
- ⚠️ **反模式**：把「自己没写好的测试」当等价变异体随手 disable——只有**真正功能等价**才该忽略，否则会掩盖真实测试缺陷（详见 [Vue/TS 实战](./vue-practice.md) 的 disable 指令）。

## 下一步

- [概念与变异分数](./concepts-and-score.md)：detected/valid 公式如何用上这些状态
- [StrykerJS 配置](./strykerjs-config.md)：`disableTypeChecks` / `checkers` 如何减少 invalid 变异体
- [Vue/TS 实战](./vue-practice.md)：`// Stryker disable` 注释语法、survived 实例
