---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vitest v4.x（`@vitest/coverage-v8`）/ Jest v30.x 编写

## 速查

- 四大指标：**Statements（语句）/ Branches（分支）/ Functions（函数）/ Lines（行）**，其中 **Branches 最能反映测试质量**
- Vitest：装 `@vitest/coverage-v8`（默认 provider）→ `vitest run --coverage`
- Jest：内置，直接 `jest --coverage`（默认 provider 是 `babel`）
- 看报告：终端 `text` 速览 / 浏览器开 `coverage/index.html` 逐行钻取 / `lcov.info` 传 CI
- 阈值门禁：Vitest `coverage.thresholds` / Jest `coverageThreshold`，不达标即 CI 失败
- 核心认知：覆盖率是「**下限门禁**」不是「KPI」，代码被执行 ≠ 被断言

## 覆盖率是什么

代码覆盖率统计「测试运行时执行到了哪些源代码」，用四个维度量化：

| 指标 | 计算对象 | 一句话 |
| ---- | -------- | ------ |
| Statements | 每条可执行语句 | 粒度最细 |
| Branches | 每个判断的 true/false 两侧 | **最能暴露漏测** |
| Functions | 每个函数是否被调用 | 有没有被用到 |
| Lines | 每物理行 | 最直观 |

> 关键：`if (a && b)` 只测了 `a=false` 和 `a=true,b=true`，Lines 可能已 100%，但 `b=false` 分支没测，Branches 才暴露这个洞。详见 [指标与 Provider](./guide-line/metrics-providers.md)。

## Vitest 快速上手

```bash
# v8 是默认 provider，v4 起精度已与 istanbul 持平
pnpm add -D @vitest/coverage-v8
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8", // 默认值，可省略
      reporter: ["text", "html"], // 终端摘要 + 可点击 HTML
      include: ["src/**/*.{ts,vue}"],
      exclude: ["src/main.ts", "src/**/*.d.ts", "src/types/**"],
    },
  },
});
```

```bash
# 日常不开覆盖率（拖慢测试），用命令行临时开启
vitest run --coverage
```

## Jest 快速上手

Jest 覆盖率内置，无需额外装包：

```ts
// jest.config.ts
export default {
  collectCoverageFrom: [
    "**/*.(t|j)s",
    "!**/*.spec.ts", // 排除测试文件本身
    "!**/main.ts", // 排除入口
    "!**/*.module.ts",
  ],
  coverageDirectory: "../coverage",
  coverageReporters: ["text", "text-summary", "lcov"],
};
```

```bash
jest --coverage
```

> 注意：Jest 默认 provider 是 `babel`，Vitest 默认是 `v8`——两者不同。Jest 也可切 `coverageProvider: "v8"`。

## 看懂报告

终端 `text` 报告：

```
File          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------|---------|----------|---------|---------|-------------------
All files     |   85.2  |   76.4   |   88.0  |   85.2  |
 src/utils.ts |   92.3  |   80.0   |  100.0  |   92.3  | 45-47
```

- **Uncovered Line #s** 直接指出哪几行没被测到
- 浏览器打开 `coverage/index.html`（或 `coverage/unit/index.html`），逐文件、逐行高亮红/黄/绿
- CI 里把 `lcov.info` 传 Codecov / Coveralls，出徽章和 PR 增量覆盖率

## 下一步

- [指标与 Provider](./guide-line/metrics-providers.md)：四大指标详解、v8 vs istanbul、babel vs v8、选型
- [Vitest 覆盖率](./guide-line/vitest-coverage.md)：完整配置项、CLI、ignore 注释、v4 变更
- [Jest 覆盖率](./guide-line/jest-coverage.md)：`collectCoverageFrom`、`coverageThreshold`、provider
- [阈值门禁与 CI](./guide-line/thresholds-ci.md)：global/per-file/glob 阈值、reporter、Codecov、徽章
- [反模式与最佳实践](./guide-line/best-practices.md)：覆盖率 ≠ 质量、合理排除、下限门禁思路
