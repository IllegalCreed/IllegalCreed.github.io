---
layout: doc
outline: [2, 3]
---

# Vue/TS 实战

> 基于 StrykerJS v9.6 编写

## 速查

- **装包**：`npm i -D @stryker-mutator/core @stryker-mutator/vitest-runner`（vitest 自带，peer `>= 2.0.0`）
- **最小配置**：`{ testRunner: "vitest", plugins: ["@stryker-mutator/vitest-runner"] }`
- ⚠️ **vitest-runner 三限制**：`coverageAnalysis` 被忽略**恒 perTest**、仅支持 `threads: true`、不支持 Browser Mode
- **运行**：`npx stryker run` → 看 `reports/` 下 HTML 报告，盯 **survived / no coverage**
- **示例洞见**：「行覆盖到了」≠「断言充分」，缺边界断言会让边界变异体 survived
- **忽略等价变异体**：`// Stryker disable next-line <Mutator>: 原因`（大写 S 开头）
- **性能三板斧**：`perTest`（已强制）+ `incremental` + 缩小 `mutate` + `concurrency` 并发

## 最小可用配置（Vitest + TS）

```bash
# 交互式初始化，或手动装包
npm init stryker@latest
# 手动：
npm i -D @stryker-mutator/core @stryker-mutator/vitest-runner
# 注意 vitest 需项目自带（peer: vitest >= 2.0.0）
```

最小 `stryker.config.json`：

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "plugins": ["@stryker-mutator/vitest-runner"]
}
```

更完整的 TS + Vitest 配置：

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "reporters": ["html", "clear-text", "progress"],
  "mutate": ["src/**/*.ts", "!src/**/*.{spec,test}.ts"],
  "concurrency": 2,
  "timeoutMS": 60000,
  "incremental": true
}
```

::: tip vitest-runner 三大限制（务必记住）
1. **`coverageAnalysis` 被忽略，始终强制 `perTest`**——写 `off` / `all` 无效。
2. **仅支持 `threads: true`** 模式（Vitest 的线程池）。
3. **不支持 Browser Mode**（以 vitest-runner 文档为准）。
:::

vitest-runner 专属子配置（可选）：

```json
"vitest": {
  "configFile": "vitest.config.ts",   // 自定义 vitest 配置
  "dir": "packages",                    // 对应 --dir
  "related": true                        // 只跑与被变异文件相关的测试（默认 true）
}
```

> 默认 `mutate` glob 也会变异 `.vue` / `.html` 文件，但 Vue SFC 的变异多是低价值噪音。前端实战建议用 `mutate` **显式圈定 `.ts` 工具函数 / 校验器 / store 逻辑**，把 UI 组件排除在外（详见 [最佳实践](./best-practices.md)）。

## 示例：survived mutant 如何暴露缺失断言

源文件 `src/utils/clamp.ts`（把 value 限制在 `[min, max]`）：

```ts
/** 把 value 限制在 [min, max] 区间内 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
```

**断言不足**的测试 `src/utils/clamp.spec.ts`：

```ts
import { describe, it, expect } from "vitest";
import { clamp } from "./clamp";

describe("clamp", () => {
  it("returns the value when in range", () => {
    expect(clamp(5, 0, 10)).toBe(5); // 只测了「区间内」这一条路径
  });
});
```

跑 `npx stryker run` 后会发生什么：

- 这个测试**根本没触发** `value < min` / `value > max` 两条分支，断言不充分。
- StrykerJS 把 `if (value < min)` 的 `<` 变成 `<=`（Equality Operator）、或清空两个 `return` 的逻辑——**测试依旧全绿 → 这些变异体 survived**。
- HTML 报告会把 `value < min`、`value > max` 那两行标为 **survived**，提示「这里缺断言」。

**修复**：补边界用例，把变异体杀掉：

```ts
expect(clamp(-3, 0, 10)).toBe(0); // value < min
expect(clamp(99, 0, 10)).toBe(10); // value > max
```

这正是变异测试比覆盖率多抓到的部分——覆盖率工具看不出「调用了但没校验」，变异测试一针见血。

## 解读 HTML 报告

- 默认 reporter 含 `html`，运行后产物在 `reports/` 下的 mutation 报告（路径随版本 / 配置略有差异）。
- 报告把每个文件**按行展示**，**survived / no coverage 高亮定位到具体行 + 列**，点开能看到「原代码 → 变异成什么」。
- 顶部展示整体 mutation score 与各状态计数（killed / survived / no coverage / timeout / …）。
- 解读重点：**盯 survived 和 no coverage**——它们就是测试盲区清单。survived 去补断言，no coverage 去补测试用例。

> ⚠️ 别误以为「分数低于 low 阈值」会自动让 CI 失败——`high` / `low` 只染色，**CI fail 靠 `thresholds.break`**（见 [StrykerJS 配置](./strykerjs-config.md)）。

## 处理 survived mutant 的两条路

1. **补断言（首选）**：survived 说明测试没校验到这块逻辑，去对应测试加 / 加强断言，把它杀掉。
2. **标记忽略（仅限等价变异体）**：只有确属等价变异体或确实不该测时，用注释指令并写明原因。

`// Stryker disable` 注释指令（通用格式）：

```
// Stryker [disable|restore] [next-line] <mutatorList>[: 自定义原因]
```

```ts
// 关闭下一行的某个算子（带原因——推荐）
// Stryker disable next-line EqualityOperator: <= 与 < 在 a===b 时等价，无法区分
return a < b ? b : a;

// 从此处起关闭全部变异（文件级 / 区块级）
// Stryker disable all

// 关闭多个算子
// Stryker disable EqualityOperator,ObjectLiteral: 下个迭代再补测试

// 在已 disable all 的区块里，恢复某一行的某算子
// Stryker restore next-line EqualityOperator
```

> ⚠️ 注释**必须以 `// Stryker` 开头**（大写 S），后接 `disable` 或 `restore`；可选 `next-line` 限定只作用下一行，省略则从该行起持续生效直到对应 `restore`。**反模式**：把自己没写好的测试当等价变异体随手 disable，会掩盖真实缺陷。

## 性能现实与优化

变异测试本质是 **N 个变异体 × 测试套件**，比普通测试慢一两个数量级——一个文件可能生成几十上百个变异体，每个都要跑测试。降本三板斧 + 一招：

1. **coverageAnalysis: perTest**——每个变异体只跑覆盖它的测试（vitest-runner 已强制 perTest，自动享受）。
2. **incremental（增量）**——`--incremental` 只重测变化部分，CI 缓存增量文件。
3. **缩小 `mutate` 范围**——只对核心逻辑 / 工具函数 / 校验器跑，**别全仓扫**。
4. **concurrency 并发**——默认按 CPU 核数，v9.6 起可设 `"50%"`。

## 下一步

- [StrykerJS 配置](./strykerjs-config.md)：`coverageAnalysis` / `thresholds` / `incremental` 字段全解
- [变异体与算子](./mutants-and-operators.md)：示例里 `<→<=` 属哪类算子、等价变异体判定
- [最佳实践](./best-practices.md)：`mutate` 圈定策略、CI 用 `break` 门禁、反模式
