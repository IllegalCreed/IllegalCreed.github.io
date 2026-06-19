---
layout: doc
outline: [2, 3]
---

# 阈值门禁与 CI

> 基于 Vitest v4.x / Jest v30.x 编写

## 速查

- 阈值层级：global（汇总）/ 目录 / glob / 单文件，越具体优先级越高
- Vitest：`coverage.thresholds`，支持 `100: true`、`perFile`、`autoUpdate`、glob 阈值
- Jest：`coverageThreshold`，负数=最大未覆盖数，匹配文件从 global 扣除
- 不达标 → 进程非零退出 → CI fail
- CI：跑 `--coverage` → 传 `lcov.info` 给 Codecov / Coveralls → 出徽章和 PR 增量
- Reporter 选 `lcov`（上传）+ `text-summary`（日志）+ `json-summary`（徽章）

## 阈值类型

| 层级 | 含义 | 适用 |
| ---- | ---- | ---- |
| global | 所有文件汇总 | 项目整体下限 |
| 目录 | 某目录下文件汇总 | 核心模块单独提高 |
| glob | 匹配文件汇总 | 按文件类型分级 |
| 单文件 | 指定文件 | 关键路径要求 100% |

> 通用规则：匹配到具体 glob / path 的文件，会从 global 中**扣除**后单独检查。

## Vitest thresholds

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,

        // 100: true,        // 快捷：所有全局阈值设为 100%
        // perFile: true,    // 对每个文件单独检查（而非汇总）

        autoUpdate: true, // 实际值更高时自动改写配置，基线只升不降

        // glob 阈值（v4.1 起须在内部显式设 perFile）
        "src/core/**": {
          branches: 90,
          perFile: true,
        },
        "src/api/payment.ts": {
          branches: 100, functions: 100, lines: 100, statements: 100,
        },
      },
    },
  },
});
```

- `thresholds.100: true`：一键全 100%
- `thresholds.perFile`：逐文件检查，任一文件不达标即失败（比汇总严格）
- `thresholds.autoUpdate`：CI 跑出更高覆盖率时自动提升配置里的基线，适合渐进式策略；可传函数自定义格式（如 `Math.floor` 去小数）
- **v4.1 变更**：glob 阈值内的 `perFile` 不再从顶层继承，须在每个 glob 内显式写

## Jest coverageThreshold

```ts
coverageThreshold: {
  global: { branches: 75, functions: 80, lines: 80, statements: 80 },
  "./src/core/": { branches: 90, statements: 90 },
  "./src/api/payment.ts": { branches: 100, lines: 100, functions: 100, statements: 100 },
}
```

不达标时输出形如 `Jest: "branches" coverage threshold (80%) not met: 76%` 并非零退出。

## Reporter 格式

| 格式 | 说明 | 用途 |
| ---- | ---- | ---- |
| `text` | 终端表格（文件 + 指标） | 本地日常 |
| `text-summary` | 终端一行汇总 | CI 日志 |
| `html` | 可点击逐行报告 | 本地分析 |
| `lcov` | `lcov.info` | Codecov / Coveralls / IDE |
| `json` / `json-summary` | JSON 数据 / 汇总 | 程序处理 / 徽章 |
| `clover` / `cobertura` | XML | Jenkins / GitLab / Azure |

推荐组合：本地 `['text','html']`；CI `['text-summary','lcov','json-summary']`。

## CI 集成（GitHub Actions）

```yaml
# .github/workflows/ci.yml
- name: Test with coverage
  run: pnpm vitest run --coverage # 阈值不达标此步直接 fail
  # 或 Jest: pnpm jest --coverage

- name: Upload to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
    fail_ci_if_error: true
```

- 阈值门禁在测试步骤内完成（非零退出即红）
- `lcov.info` 上传 Codecov / Coveralls，得到 PR 增量覆盖率注释和趋势图

## 覆盖率徽章

```markdown
<!-- Codecov 徽章 -->
[![codecov](https://codecov.io/gh/USER/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USER/REPO)
```

也可用 `json-summary` 输出 + Shields.io endpoint 生成本地徽章，或用 `vitest-coverage-report-action` 在 PR 里贴覆盖率表格。
