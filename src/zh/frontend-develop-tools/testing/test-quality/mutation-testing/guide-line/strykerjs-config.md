---
layout: doc
outline: [2, 3]
---

# StrykerJS 配置

> 基于 StrykerJS v9.6 编写

## 速查

- **配置文件**：`stryker.config.json` / `.mjs` / `.js` / `.cjs`；`npm init stryker@latest` 默认生成 `.mjs`
- **testRunner**：默认 `command`（仅看退出码、慢），应换专用插件 —— Vitest 用 `@stryker-mutator/vitest-runner`（v9.4+ 支持 Vitest v4，peer `vitest >= 2.0.0`）、Jest 用 `@stryker-mutator/jest-runner`
- **mutate**：glob 选「要被变异的源文件」（默认排除测试文件），支持 `"src/app.ts:1-11"` 行范围
- **coverageAnalysis**：`off` / `all` / **`perTest`（默认）**——速度 `perTest` > `all` > `off`
- **thresholds**：`{ high, low, break }`——⚠️ **只有 `break` 决定 CI 退出码**，`high`/`low` 仅染色；默认 `break: null` **不会让构建失败**
- **concurrency**：默认按 CPU 核数；**v9.6 起支持百分比** `"50%"`
- **incremental**：`true` + `--incremental` 存结果加速后续运行
- **disableTypeChecks**：默认 **`true`**（v7 起），自动插 `// @ts-nocheck` 防变异引发 TS 编译错
- **reporters**：默认 `['clear-text', 'progress', 'html']`

## 配置文件形式

支持 `stryker.config.json` / `stryker.config.mjs` / `stryker.config.js` / `.cjs`。`npm init stryker@latest`（即旧 `stryker init`）默认生成 **`stryker.config.mjs`**。JSON 配置建议加 `$schema` 头以获得 IDE 智能提示：

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json"
}
```

## 关键字段总览

| 字段 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `testRunner` | `string` | `'command'` | 测试运行器，见下 |
| `mutate` | `string[]` | 选 `src`/`lib` 下源文件、排除测试文件 | 选「要被变异的源文件」，支持 `"src/app.ts:1-11"` 行范围 |
| `coverageAnalysis` | `string` | **`'perTest'`** | `off` / `all` / `perTest`，见下 |
| `thresholds` | `object` | `{ high: 80, low: 60, break: null }` | 见下 |
| `concurrency` | `number \| string` | `cpu<=4 ? cpu : cpu-1` | worker 数；**v9.6 起支持** `"50%"` |
| `incremental` | `boolean` | `false` | 增量模式，命令行 `--incremental` |
| `incrementalFile` | `string` | `'reports/stryker-incremental.json'` | 增量数据文件位置 |
| `reporters` | `string[]` | `['clear-text','progress','html']` | 见下 |
| `disableTypeChecks` | `boolean \| string` | **`true`**（v7 起） | 关闭类型检查（插 `// @ts-nocheck`）；可传 glob 选择性关闭 |
| `checkers` | `string[]` | `[]` | 校验器插件，如 `["typescript"]`，测试前剔除编译错变异体 |
| `plugins` | `string[]` | `['@stryker-mutator/*']` | 加载的插件，默认自动加载所有 `@stryker-mutator/*` |
| `ignorePatterns` | `string[]` | `[]` | 排除**不复制进沙箱**的目录（如 `dist`），与 `mutate` 不同 |
| `timeoutMS` | `number` | `5000` | 超时绝对偏移 |
| `timeoutFactor` | `number` | `1.5` | 超时相对系数 |

## testRunner 与运行器插件

`testRunner` 默认是 `'command'`——它只看测试命令的**退出码**（0 = 成功），不做覆盖优化，**性能很差**，生产应换成专用插件：

| testRunner | 插件包 | 备注 |
| ---------- | ------ | ---- |
| `vitest` | `@stryker-mutator/vitest-runner` | **v9.4+ 支持 Vitest v4**；peer `vitest >= 2.0.0`（兼容 v2/v3/v4） |
| `jest` | `@stryker-mutator/jest-runner` | 不内置 jest，需项目自带 |
| `mocha` | `@stryker-mutator/mocha-runner` | — |
| `karma` | `@stryker-mutator/karma-runner` | — |
| TS 类型校验 | `@stryker-mutator/typescript-checker` | 配 `checkers: ["typescript"]` 使用 |

> ⚠️ 包名带 `@stryker-mutator/` scope、用**连字符**（`vitest-runner` 不是驼峰 `vitestRunner`），是常见易错点。`plugins` 默认 `['@stryker-mutator/*']` 会自动加载已装的全部插件，一般无需手写。

## coverageAnalysis 三档（性能核心）

| 值 | 行为 | 性能 |
| -- | ---- | ---- |
| `off` | 每个变异体都跑**全部测试**，不做任何优化 | 最慢 |
| `all` | 先测一遍收集覆盖；**没被任何测试覆盖的变异体直接标 NoCoverage**，不再跑测试 | 中等 |
| **`perTest`（默认）** | 记录「每个测试覆盖了哪些代码」，每个变异体**只跑覆盖它的那些测试** | 最快 |

- 默认是 **`perTest`**（v5 起；旧版本曾默认 `off`），速度 `perTest` > `all` > `off`。
- ⚠️ **perTest 的前提**：测试必须**相互独立**；若测试间有共享状态泄漏，perTest 可能漏跑导致结果不准。
- ⚠️ **Vitest runner 特例**：该字段被**忽略**，vitest-runner 始终强制用 `perTest`（详见 [Vue/TS 实战](./vue-practice.md)）。

## thresholds 三个值（CI 门禁关键）

```json
"thresholds": { "high": 80, "low": 60, "break": 60 }
```

| 字段 | 含义 |
| ---- | ---- |
| `high` | 分数 ≥ high → 报告显示**绿色**（达标） |
| `low` | low ≤ 分数 < high → 报告显示**黄 / 橙**（警告区） |
| **`break`** | 分数 **< break → 进程退出码 1（CI 失败）**；`null`（默认）= **永不让构建失败** |

> ⚠️ **关键区分**：`high` / `low` **只影响报告配色**，不影响退出码；**只有 `break` 决定 CI 是否 fail**。要做 CI 门禁必须显式设 `break`（默认 `null` 不会卡，这是高频陷阱）。`break` 必须 < high、< low 才合理（典型 `break: 60`）。

## reporters

可选值：`html` / `json` / `progress` / `clear-text` / `dots` / `dashboard` / `event-recorder`。默认 `['clear-text', 'progress', 'html']`。

- `html`：可交互报告，把每个变异体定位到行列（解读重点）。
- `dashboard`：上报到 stryker-mutator.io 官方 dashboard。
- `json`：机器可读，便于 CI 二次处理。

## concurrency / incremental / disableTypeChecks

```json
{
  "concurrency": "50%",              // v9.6 起支持百分比；默认按 CPU 核数
  "incremental": true,               // 配 --incremental，存结果只重测变化部分
  "incrementalFile": "reports/stryker-incremental.json",
  "disableTypeChecks": true          // TS 默认 true，自动插 // @ts-nocheck
}
```

- **concurrency**：worker 并行数，默认 `cpu<=4 ? cpu : cpu-1`；v9.6 起可写 `"50%"`（最小 1）。
- **incremental**：增量模式，把上次结果存进 `incrementalFile`，后续只重测改动部分——CI 缓存该文件可大幅提速。
- **disableTypeChecks**：默认 **`true`**（v7 起），给被变异文件插 `// @ts-nocheck`，避免变异触发 TS 编译错误（Compile error，invalid）。也可传 glob 字符串选择性关闭。
- **checkers**：TS 项目可配 `checkers: ["typescript"]` + `@stryker-mutator/typescript-checker`，在跑测试前就剔除会编译报错的变异体，减少 invalid，让分数更干净。

## 下一步

- [Vue/TS 实战](./vue-practice.md)：Vitest + TS 最小配置、vitest-runner 限制、性能优化三板斧
- [变异体与算子](./mutants-and-operators.md)：`disableTypeChecks` / `checkers` 对应的 invalid 状态
- [最佳实践](./best-practices.md)：`mutate` 怎么圈、`break` 怎么设
