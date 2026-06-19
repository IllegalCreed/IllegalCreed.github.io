---
layout: doc
outline: [2, 3]
---

# Vitest 覆盖率

> 基于 Vitest v4.x（`@vitest/coverage-v8` / `@vitest/coverage-istanbul` 同版本号）

## 速查

- 启用：`vitest run --coverage`（等价 `coverage.enabled: true`）
- provider：`coverage.provider: "v8"`（默认）/ `"istanbul"`，需装对应包
- 筛选：`coverage.include` 白名单 + `coverage.exclude` 黑名单（glob）
- 报告：`coverage.reporter`，默认 `["text","html","clover","json"]`
- 阈值：`coverage.thresholds`（详见 [阈值门禁](./thresholds-ci.md)）
- ignore：`/* v8 ignore next -- @preserve */`（TS 必须加 `-- @preserve`）
- CLI 点记法陷阱：用 `--coverage.xxx` 时须显式 `--coverage.enabled`

## 安装与启用

```bash
pnpm add -D @vitest/coverage-v8        # 默认 provider
# 或 pnpm add -D @vitest/coverage-istanbul
```

```bash
# 日常不开（拖慢），命令行临时开启
vitest run --coverage
```

## 配置项

### 基础

| 字段 | 类型 | 默认 | 说明 |
| ---- | ---- | ---- | ---- |
| `provider` | `'v8' \| 'istanbul' \| 'custom'` | `'v8'` | 覆盖率引擎 |
| `enabled` | `boolean` | `false` | `--coverage` 等价此项 |
| `reportsDirectory` | `string` | `'./coverage'` | 输出目录 |
| `reporter` | `string \| string[]` | `['text','html','clover','json']` | 报告格式 |
| `all` | `boolean` | `true` | 含未被测试引用的文件 |
| `clean` | `boolean` | `true` | 跑前清空旧报告 |
| `reportOnFailure` | `boolean` | `false` | 测试失败也出报告 |
| `skipFull` | `boolean` | `false` | text 报告隐藏 100% 的文件 |

### 文件筛选

| 字段 | 类型 | 默认 | 说明 |
| ---- | ---- | ---- | ---- |
| `include` | `string[]` | 被引用到的文件 | glob 白名单，建议带扩展名 |
| `exclude` | `string[]` | `[]` | glob 黑名单 |
| `allowExternal` | `boolean` | `false` | 收集项目根外文件 |
| `excludeAfterRemap` | `boolean` | `false` | source map 重映射后再排除（bundle 场景） |

### 高级

| 字段 | 类型 | 默认 | 说明 |
| ---- | ---- | ---- | ---- |
| `watermarks` | `{lines:[low,high],...}` | `[50,80]` | 报告红/黄/绿水位线 |
| `processingConcurrency` | `number` | `min(20, CPU)` | 处理并发上限 |
| `ignoreClassMethods` | `string[]` | `[]` | 排除指定类方法名 |

```ts
// vitest.config.ts —— 本项目 quiz-app 真实配置
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["html", "text"],
      reportsDirectory: "./coverage/unit",
      include: ["src/**/*.{ts,vue}"],
      exclude: [
        "src/main.ts", // 入口，无业务逻辑
        "src/**/*.d.ts", // 类型声明
        "src/**/__tests__/**", // 测试文件本身
        "src/types/**", // 纯类型
      ],
    },
  },
});
```

## CLI 用法（点记法陷阱）

```bash
vitest run --coverage                                  # 最常用
vitest run --coverage.provider=istanbul                # ⚠ 见下
vitest run --coverage.thresholds.lines=80              # 临时设阈值
vitest run --coverage.reporter=text --coverage.reporter=lcov
```

::: warning 点记法必须带 --coverage.enabled
用 `--coverage.xxx` 点记法时，单独的 `--coverage` 不再隐式开启覆盖率，须显式 `--coverage.enabled`：

```bash
# ❌ vitest --coverage --coverage.provider=istanbul
# ✅ vitest --coverage.enabled --coverage.provider=istanbul
```
:::

## 代码忽略注释

```ts
/* v8 ignore next -- @preserve */
const debugOnly = process.env.DEBUG; // 这一行不计入覆盖率

/* v8 ignore next 3 -- @preserve */ // 忽略后 3 行
/* v8 ignore start -- @preserve */
// ...整段忽略...
/* v8 ignore stop -- @preserve */

/* v8 ignore file -- @preserve */ // 整个文件忽略
```

> **TS 必须加 `-- @preserve`**：esbuild 编译 TypeScript 时会擦除普通注释，`@preserve` 告诉它保留，否则 ignore 指令失效。istanbul provider 用 `/* istanbul ignore next */`。

## v4 变更要点

- `experimentalAstAwareRemapping` **转正为默认**，配置项被移除——v8 精度默认持平 istanbul
- `coverage.ignoreEmptyLines` **移除**（并入 AST 重映射逻辑）
- v4.1：glob 阈值里的 `perFile` **不再继承顶层**，须在每个 glob 内显式声明（见 [阈值门禁](./thresholds-ci.md)）
- v8 provider 新增支持 `coverage.ignoreClassMethods`
