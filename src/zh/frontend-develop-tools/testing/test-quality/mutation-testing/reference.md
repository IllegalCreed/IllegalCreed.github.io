---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 StrykerJS v9.6 编写

## 速查

- **变异分数**：`detected / valid × 100`，`detected = killed + timeout`，`valid = killed + timeout + survived + noCoverage`
- **状态归属**：detected = killed + timeout｜undetected = survived + noCoverage｜invalid（不计分）= runtimeError + compileError｜ignored / pending 不计分
- **coverageAnalysis**：`off`（慢/全跑）< `all`（跳无覆盖）< **`perTest`（默认/最快）**
- **thresholds**：`high` / `low` 染色，**`break` 才决定 CI 退出码**（默认 `null` = 不 fail）
- **运行**：`npx stryker run`；初始化 `npm init stryker@latest`
- **禁用**：`// Stryker disable next-line <Mutator>: 原因`
- 完整说明见 [入门](./getting-started.md) / [概念与变异分数](./guide-line/concepts-and-score.md) / [变异体与算子](./guide-line/mutants-and-operators.md) / [StrykerJS 配置](./guide-line/strykerjs-config.md) / [Vue/TS 实战](./guide-line/vue-practice.md) / [最佳实践](./guide-line/best-practices.md)

## 版本锚点

> 核实日期 2026-06-22（npm registry + GitHub releases 实测）

| 包 | 版本 | 说明 |
| -- | ---- | ---- |
| `@stryker-mutator/core` | **9.6.1** | 核心引擎（2026-04-10 发布） |
| `@stryker-mutator/vitest-runner` | **9.6.1** | Vitest 运行器；peer `vitest >= 2.0.0` |
| `@stryker-mutator/jest-runner` | **9.6.1** | Jest 运行器 |
| `@stryker-mutator/mocha-runner` | **9.6.1** | Mocha 运行器 |
| `@stryker-mutator/karma-runner` | **9.6.1** | Karma 运行器 |
| `@stryker-mutator/typescript-checker` | **9.6.1** | TS 类型校验插件 |
| Node 要求 | **>= 20.0.0** | v9.0.0 起放弃 Node 18 |
| Vitest 兼容 | **vitest >= 2.0.0** | v9.4.0 起支持 Vitest v4 |

关键里程碑：v9.0.0（2025-05-13，要求 Node 20+）→ v9.4.0（2025-11-23，新增 Vitest v4 支持）→ v9.6.0（2026-02-27，`concurrency` 支持百分比）→ v9.6.1（2026-04-10，最新补丁）。

## mutant 状态表

| 状态 | 含义 | 分数归属 |
| ---- | ---- | -------- |
| Pending | 已生成、未运行（临时） | 不计入 |
| **Killed** | 至少一个测试失败 | **detected**（分子） |
| **Survived** | 所有测试都通过 | **undetected**（分母，拖低） |
| **No coverage** | 无任何测试覆盖而存活 | **undetected**（分母，拖低） |
| **Timeout** | 触发超时 | **detected**（≈ killed，分子） |
| Runtime error | 跑测试时报错（非断言失败） | **invalid**，不计入 |
| Compile error | 变异导致编译失败 | **invalid**，不计入 |
| Ignored | 被显式忽略（`// Stryker disable`） | 不计入 |

```
detected = killed + timeout          undetected = survived + no coverage
covered  = detected + survived        valid = detected + undetected（= 分母）
invalid  = runtime errors + compile errors
total    = valid + invalid + ignored + pending
```

## 配置项表（节选）

| 字段 | 默认 | 说明 |
| ---- | ---- | ---- |
| `testRunner` | `'command'` | `vitest` / `jest` / `mocha` / `karma` / … 应换专用插件 |
| `mutate` | `src`/`lib` 源文件、排除测试 | 选「要被变异的源文件」，支持 `"src/app.ts:1-11"` |
| `coverageAnalysis` | **`'perTest'`** | `off` / `all` / `perTest` |
| `thresholds` | `{ high:80, low:60, break:null }` | **仅 `break` 决定退出码** |
| `concurrency` | `cpu<=4?cpu:cpu-1` | worker 数；v9.6 支持 `"50%"` |
| `incremental` | `false` | 增量；配 `--incremental` |
| `reporters` | `['clear-text','progress','html']` | `html`/`json`/`dashboard`/… |
| `disableTypeChecks` | **`true`** | 插 `// @ts-nocheck` 防编译错 |
| `checkers` | `[]` | 如 `["typescript"]` 剔除编译错变异体 |
| `ignorePatterns` | `[]` | 不复制进沙箱的目录（≠ `mutate`） |
| `timeoutMS` / `timeoutFactor` | `5000` / `1.5` | 超时偏移 / 系数 |

## 运行器插件包

| testRunner | 插件包 |
| ---------- | ------ |
| `vitest` | `@stryker-mutator/vitest-runner` |
| `jest` | `@stryker-mutator/jest-runner` |
| `mocha` | `@stryker-mutator/mocha-runner` |
| `karma` | `@stryker-mutator/karma-runner` |
| TS 校验 | `@stryker-mutator/typescript-checker`（`checkers: ["typescript"]`） |

## 命令对照

```bash
# 初始化（交互式生成 stryker.config.mjs）
npm init stryker@latest

# 安装核心 + Vitest 运行器（vitest 需自带，peer >= 2.0.0）
npm i -D @stryker-mutator/core @stryker-mutator/vitest-runner

# 运行（注意带 run 子命令）
npx stryker run
npx stryker run --incremental         # 增量模式
npx stryker run --logLevel trace      # 调试

# 看报告（路径随版本/配置略有差异）
open reports/mutation/mutation.html
```

## 禁用注释指令

```
// Stryker [disable|restore] [next-line] <mutatorList>[: 原因]
```

```ts
// Stryker disable next-line EqualityOperator: 等价变异体，无法区分
// Stryker disable all                              // 区块级关闭全部
// Stryker disable EqualityOperator,ObjectLiteral: 下个迭代补测试
// Stryker restore next-line EqualityOperator        // 在 disable all 区块里恢复
```

> 注释须以大写 `// Stryker` 开头；`next-line` 只作用下一行，省略则持续到对应 `restore`。

## 官方资源

- StrykerJS 介绍：[https://stryker-mutator.io/docs/stryker-js/introduction/](https://stryker-mutator.io/docs/stryker-js/introduction/)
- Getting started：[https://stryker-mutator.io/docs/stryker-js/getting-started/](https://stryker-mutator.io/docs/stryker-js/getting-started/)
- 全部配置项：[https://stryker-mutator.io/docs/stryker-js/configuration/](https://stryker-mutator.io/docs/stryker-js/configuration/)
- Vitest runner：[https://stryker-mutator.io/docs/stryker-js/vitest-runner/](https://stryker-mutator.io/docs/stryker-js/vitest-runner/)
- Jest runner：[https://stryker-mutator.io/docs/stryker-js/jest-runner/](https://stryker-mutator.io/docs/stryker-js/jest-runner/)
- Disable mutants：[https://stryker-mutator.io/docs/stryker-js/disable-mutants/](https://stryker-mutator.io/docs/stryker-js/disable-mutants/)
- 支持的变异算子：[https://stryker-mutator.io/docs/mutation-testing-elements/supported-mutators/](https://stryker-mutator.io/docs/mutation-testing-elements/supported-mutators/)
- 变异体状态与指标：[https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/)
- GitHub Releases：[https://github.com/stryker-mutator/stryker-js/releases](https://github.com/stryker-mutator/stryker-js/releases)
