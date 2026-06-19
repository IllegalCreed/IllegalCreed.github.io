---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- 四大指标：Statements / Branches / Functions / Lines（Branches 最关键）
- Vitest：`@vitest/coverage-v8`（默认）→ `vitest run --coverage`
- Jest：内置 → `jest --coverage`（默认 provider `babel`）
- 阈值：Vitest `coverage.thresholds` / Jest `coverageThreshold`，不达标即 CI fail
- 完整说明见 [入门](./getting-started.md) / [指标与 Provider](./guide-line/metrics-providers.md) / [Vitest](./guide-line/vitest-coverage.md) / [Jest](./guide-line/jest-coverage.md) / [阈值门禁](./guide-line/thresholds-ci.md) / [最佳实践](./guide-line/best-practices.md)

## 四大指标

| 指标 | 对象 | 备注 |
| ---- | ---- | ---- |
| Statements | 每条语句 | 粒度最细 |
| Branches | 每个判断 true/false | **最能暴露漏测** |
| Functions | 每个函数 | 是否被调用 |
| Lines | 每物理行 | 最直观 |

## Vitest 配置项（节选）

| 字段 | 默认 | 说明 |
| ---- | ---- | ---- |
| `coverage.provider` | `'v8'` | `v8` / `istanbul` / `custom` |
| `coverage.enabled` | `false` | `--coverage` 等价 |
| `coverage.reporter` | `['text','html','clover','json']` | 报告格式 |
| `coverage.include` / `exclude` | — / `[]` | glob 白/黑名单 |
| `coverage.reportsDirectory` | `'./coverage'` | 输出目录 |
| `coverage.thresholds` | — | `.100` / `.perFile` / `.autoUpdate` / glob |
| `coverage.all` | `true` | 含未引用文件 |

## Jest 配置项（节选）

| 字段 | 默认 | 说明 |
| ---- | ---- | ---- |
| `collectCoverage` | `false` | 自动收集 |
| `collectCoverageFrom` | — | 参与文件 glob（`!` 排后） |
| `coverageProvider` | `'babel'` | `babel` / `v8` |
| `coverageReporters` | `['clover','json','lcov','text']` | 报告格式 |
| `coverageThreshold` | — | global / 目录 / glob / 单文件 |
| `coveragePathIgnorePatterns` | `['/node_modules/']` | 跳过路径 |

## Reporter 格式

| 格式 | 用途 |
| ---- | ---- |
| `text` / `text-summary` | 终端表格 / 一行汇总 |
| `html` | 可点击逐行报告 |
| `lcov` | Codecov / Coveralls / IDE |
| `json` / `json-summary` | 程序处理 / 徽章 |
| `clover` / `cobertura` | Jenkins / GitLab / Azure XML |

## ignore 注释对照

| provider | 忽略一行 | 整文件 |
| -------- | -------- | ------ |
| Vitest v8 | `/* v8 ignore next -- @preserve */` | `/* v8 ignore file -- @preserve */` |
| istanbul | `/* istanbul ignore next */` | `/* istanbul ignore file */` |
| Jest v8 | `/* c8 ignore next */` | `/* c8 ignore file */` |

> TypeScript 下 v8 注释须加 `-- @preserve`，否则被 esbuild 擦除而失效。

## 命令对照

```bash
# Vitest
vitest run --coverage
vitest run --coverage.enabled --coverage.provider=istanbul
vitest --coverage.enabled --coverage.thresholds.lines=80

# Jest
jest --coverage
jest --coverage --coverageProvider=v8
jest --coverage --collectCoverageFrom="src/**/*.ts"

# 看报告
open coverage/index.html
```

## 官方资源

- Vitest Coverage：[https://vitest.dev/guide/coverage.html](https://vitest.dev/guide/coverage.html)
- Vitest coverage 配置：[https://vitest.dev/config/#coverage](https://vitest.dev/config/#coverage)
- Jest 配置：[https://jestjs.io/docs/configuration](https://jestjs.io/docs/configuration)
- Istanbul：[https://istanbul.js.org/](https://istanbul.js.org/)
- Codecov：[https://docs.codecov.com/](https://docs.codecov.com/)
