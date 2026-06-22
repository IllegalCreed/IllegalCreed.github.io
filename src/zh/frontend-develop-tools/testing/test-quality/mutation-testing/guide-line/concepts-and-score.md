---
layout: doc
outline: [2, 3]
---

# 概念与变异分数

> 基于 StrykerJS v9.6 编写

## 速查

- **变异分数公式**：`mutation score = detected / valid × 100`
- **detected** = `killed + timeout`（被检测到，进**分子**）
- **undetected** = `survived + no coverage`（未检测到，进分母，拖低分数）
- **valid** = `detected + undetected`（有效变异体，即分母）——**剔除** runtime error / compile error / ignored / pending
- **常见简化版** `killed / (killed + survived)` 只在「无 timeout、无 no coverage」时才等于官方公式
- **基于覆盖代码的分数**：分母换成 `covered = detected + survived`（不含 no coverage），通常更高
- **vs 覆盖率**：覆盖率测「执行到没」，变异分数测「断言抓得到缺陷没」——覆盖率 100% ≠ 变异分数 100%

## 核心概念回顾

- **mutant（变异体）**：源代码被注入一个微小缺陷后的版本（如 `+` → `-`）。
- **killed（杀死）**：该变异体激活时，**至少一个**测试失败 → 测试抓到了缺陷。
- **survived（存活）**：该变异体激活时，**所有**测试都通过 → 测试没抓到，暴露盲区。
- **mutation score（变异分数）**：被检测到的变异体占有效变异体的百分比，是测试套件有效性的量化指标。

## 官方变异分数公式

> ⚠️ 直觉版口径 `killed / (killed + survived)` **方向对、但不是官方精确公式**。官方按变异体状态分类统计：

```
detected   = killed + timeout            （被检测到 = 杀死 + 超时）
undetected = survived + no coverage       （未检测到 = 存活 + 无覆盖）
valid      = detected + undetected        （有效变异体 = 二者之和）

mutation score = detected / valid × 100
              = (killed + timeout) / (killed + timeout + survived + no_coverage) × 100
```

关键点：

- **分子是 `detected`，不是只有 killed**——**timeout 也计入分子**（超时等同被检测到，对分数有正贡献），详见 [变异体与算子](./mutants-and-operators.md)。
- **分母 `valid` 里包含 no coverage**——无覆盖的变异体也算「未检测到」，会**拖低分数**。
- 分母**剔除** `runtime error` / `compile error` / `ignored` / `pending`（这些既不进分子也不进分母）。

为什么直觉版「近似对」？当一份测试里**不存在 timeout 也不存在 no coverage** 时，公式退化为：

```
detected / valid = killed / (killed + survived)
```

所以 `killed / (killed + survived)` 是官方公式的一个特例，平时拿来心算无妨，但出题 / 严谨场景要用官方口径。

## 另一个口径：基于覆盖代码的变异分数

StrykerJS 报告里还会给出一个「**mutation score based on covered code**」（基于覆盖代码的分数），分母换成 `covered`：

```
covered = detected + survived           （= killed + timeout + survived，不含 no coverage）
mutation score (covered) = detected / covered × 100
```

- 它把 **no coverage 从分母里剔除**，只衡量「**被测试覆盖到的那部分代码**」的测试质量。
- 因此这个数通常**比标准分数高**——标准分数会因为大量 no coverage 被拉低，而 covered 分数不受其影响。
- 解读时分清楚：**标准分数**回答「整体测得怎么样（含没覆盖的）」，**covered 分数**回答「覆盖到的地方断言强不强」。

::: tip 两个分数怎么用
看到标准分数低但 covered 分数高，通常意味着「**已测的部分质量不错，但还有大片代码根本没测**」——这时优先补**覆盖率**（先让代码被跑到），而不是去优化已有断言。
:::

## 变异分数 vs 代码覆盖率：本质区别

| 维度 | 代码覆盖率（Coverage） | 变异分数（Mutation Score） |
| ---- | ---------------------- | -------------------------- |
| 衡量的东西 | 代码**有没有被执行到** | 测试**能不能抓到被注入的缺陷** |
| 一个空断言的测试 | 照样能拿高覆盖率（代码跑过了） | 拿不到高变异分数（改坏代码它也不报错） |
| 本质 | 「跑没跑到」 | 「测得准不准 / 断言够不够强」 |
| 成本 | 便宜、快 | 贵、慢（N 个变异体 × 测试套件） |

覆盖率与变异分数是「**广度 → 深度**」的递进关系，互补而非替代——先用覆盖率保证代码被执行，再用变异测试保证断言够强（顺序见 [最佳实践](./best-practices.md)）。

## 「覆盖率 100% 但变异分数低」说明什么

这是变异测试**最有价值的洞见**，也是它相对覆盖率的存在意义：

```ts
// 业务代码
export function add(a: number, b: number) {
  return a + b;
}

// 覆盖率 100%、变异分数低的「假绿」测试
it("calls add", () => {
  add(1, 2); // 行被执行了 → 覆盖率 100%
  // 但没有 expect！把 a + b 改成 a - b，测试照样绿 → 该变异体 survived
});
```

- **覆盖率 100%** 只说明 `return a + b` 这行**被执行过**。
- **变异分数低** 说明把它改成 `return a - b`（Arithmetic 算子）后测试不报错——**断言不充分**。
- 结论：**覆盖率 100% ≠ 测得好**。覆盖率工具看不出有没有断言，变异测试专门揪这种「调用了代码、没校验行为」的假绿测试。

## 下一步

- [变异体与算子](./mutants-and-operators.md)：8 种 mutant 状态机、timeout 为何算 detected、15 类算子、等价变异体
- [StrykerJS 配置](./strykerjs-config.md)：`coverageAnalysis` 与 `thresholds` 如何影响统计与门禁
- [最佳实践](./best-practices.md)：先覆盖率后变异、分数当信号不当 KPI
