---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 StrykerJS v9.6 编写

## 速查

- **一句话**：变异测试故意把代码改坏（注入变异体），看你的测试能不能发现——「**测试你的测试**」
- **核心指标**：`mutation score = detected / valid × 100`，其中 `detected = killed + timeout`（超时也算被检测到）
- **vs 覆盖率**：覆盖率测「代码跑没跑到」，变异分数测「断言够不够强」——覆盖率 100% 不代表变异分数高
- **装包**：`npm i -D @stryker-mutator/core @stryker-mutator/vitest-runner`（自带 vitest >= 2）
- **初始化**：`npm init stryker@latest`（交互式生成 `stryker.config.mjs`）
- **运行**：`npx stryker run`（注意带 `run` 子命令）
- **看结果**：默认输出 HTML 报告，盯 **survived / no coverage** 两类——它们是测试盲区清单
- **认知**：变异分数是**质量信号**不是 KPI，等价变异体使 100% 常不可达

## 变异测试是什么

变异测试是一种**评估测试套件质量**的技术。它的做法很「反直觉」：

1. 自动在源代码里注入一个微小的、人为的缺陷，得到一个 **mutant（变异体）**——例如把 `return a + b` 改成 `return a - b`。
2. 用你**现有的测试套件**去跑这份被改坏的代码。
3. 如果有**至少一个测试失败**，说明测试「抓到了」这个缺陷，该变异体被 **killed（杀死）**。
4. 如果改坏后**所有测试依然通过**，说明测试没发现这个 bug，该变异体 **survived（存活）**——它暴露了一处测试盲区。

把这个过程对源文件里成百上千个可变异点重复一遍，就得到了一份「测试套件到底有多严密」的体检报告。

## 为什么叫「测试你的测试」

普通单元测试在测**业务代码**对不对；变异测试在测**你的测试本身够不够好**。

```ts
// 业务代码
export function add(a: number, b: number) {
  return a + b;
}

// 一个「看起来在测、其实没断言」的测试
it("add works", () => {
  add(1, 2); // 调用了，但没有 expect！
});
```

上面这个测试**有行覆盖率**（`add` 被执行了），却毫无价值——把 `+` 改成 `-`，它照样绿。变异测试会把这个 `a + b → a - b` 的变异体标为 **survived**，一针见血地告诉你：「这里缺断言」。这就是 StrykerJS 社区那句口号的由来——**"Who's testing the tests?"**（谁来测试这些测试？）。

::: tip Stryker 名字的由来
Stryker 取自《X 战警》里专门迫害「变异体（mutant）」的反派 William Stryker，呼应 mutation testing 主题。
:::

## mutation score vs 覆盖率

两个指标衡量的是**完全不同的东西**，不能互相替代：

| 维度 | 代码覆盖率（Coverage） | 变异分数（Mutation Score） |
| ---- | ---------------------- | -------------------------- |
| 衡量什么 | 代码**有没有被执行到** | 测试**能不能抓到被注入的缺陷** |
| 一个空断言的测试 | 照样拿高覆盖率（代码跑过了） | 拿不到高变异分数（改坏也不报错） |
| 本质 | 「跑没跑到」 | 「测得准不准 / 断言够不够强」 |

> **「覆盖率 100% 但变异分数低」说明什么**：代码每一行都被执行过，**但断言不充分**——测试只是「调用了」代码，没真正校验行为。把 `return a + b` 改成 `return a - b` 测试依旧绿，就是典型的「有覆盖、没断言」。这正是变异测试相对覆盖率的核心价值：**揪出假绿测试**。详见 [概念与变异分数](./guide-line/concepts-and-score.md)。

## 最小上手

以 Vitest + TS 项目为例（已有 vitest 测试），三步即可跑起来：

```bash
# 1. 安装核心 + Vitest 运行器（vitest 需自带，peer 要求 >= 2.0.0）
npm i -D @stryker-mutator/core @stryker-mutator/vitest-runner

# 或交互式初始化，自动生成 stryker.config.mjs
npm init stryker@latest
```

```json
// 2. stryker.config.json —— 最小可用配置
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "plugins": ["@stryker-mutator/vitest-runner"]
}
```

```bash
# 3. 运行（注意是 stryker run，带 run 子命令，不是裸跑 stryker）
npx stryker run
```

跑完后终端会打印整体 mutation score 与各状态计数，并在 `reports/` 下生成 HTML 报告——浏览器打开它，重点看被高亮成 **survived** 和 **no coverage** 的行，那就是你接下来该补断言的地方。

> 变异测试很慢（N 个变异体 × 测试套件），**别一上来就全仓跑**。先用 `mutate` 圈定核心逻辑 / 工具函数，详见 [Vue/TS 实战](./guide-line/vue-practice.md)。

## 下一步

- [概念与变异分数](./guide-line/concepts-and-score.md)：`detected/valid` 公式拆解、vs 覆盖率的本质区别、覆盖率 100% 为何分数仍低
- [变异体与算子](./guide-line/mutants-and-operators.md)：8 种 mutant 状态机、15 类变异算子、等价变异体
- [StrykerJS 配置](./guide-line/strykerjs-config.md)：`testRunner` / `mutate` / `coverageAnalysis` / `thresholds` 逐项详解
- [Vue/TS 实战](./guide-line/vue-practice.md)：Vitest + TS 最小接入、示例、读 HTML 报告、性能优化
- [最佳实践](./guide-line/best-practices.md)：挑核心逻辑跑、分数当信号、与覆盖率互补、CI 门禁、反模式
- [参考](./reference.md)：版本锚点、状态表、配置项表、命令对照、官方资源
