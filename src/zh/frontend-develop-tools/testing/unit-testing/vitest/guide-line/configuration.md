---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 Vitest v4.1.x 编写

## 速查

- 配置文件：`vitest.config.ts`，`import { defineConfig } from "vitest/config"`
- 环境：`test.environment` = `node`（默认）/ `jsdom` / `happy-dom` / `edge-runtime`
- 全局 API：`test.globals: true` + tsconfig `"types": ["vitest/globals"]`
- 启动钩子：`setupFiles`（每个测试文件前）/ `globalSetup`（整进程一次，不在 worker 内）
- 清理：`clearMocks`（清调用记录）/ `resetMocks`（重置实现）/ `restoreMocks`（恢复 spyOn 原实现）
- 复用 vite：`mergeConfig(viteConfig, defineConfig({ test: {} }))`
- 多项目：用 `test.projects`（v3.2 起取代已废弃的 `workspace`）
- 超时 / 重试：`testTimeout` / `hookTimeout` / `retry`

## 配置文件入口

Vitest 优先读取 `vitest.config.ts`；没有时回退到 `vite.config.ts`。从 `vitest/config`（不是 `vite`）导入 `defineConfig` 才有 `test` 字段的类型提示：

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 所有测试相关配置都在 test 字段下
  },
});
```

## 测试环境

`test.environment` 决定测试代码运行在什么全局环境：

```ts
export default defineConfig({
  test: {
    environment: "jsdom", // node（默认）/ jsdom / happy-dom / edge-runtime
  },
});
```

| 环境          | 场景                       | 取舍                        |
| ------------- | -------------------------- | --------------------------- |
| `node`        | 纯逻辑、工具函数（默认）   | 无 DOM，最快                |
| `jsdom`       | Vue 组件、DOM 操作         | API 完整，较慢              |
| `happy-dom`   | 同上，追求速度             | 更快，部分 API / CSS 不完整 |
| `edge-runtime`| Vercel Edge Function       | 模拟边缘运行时              |

按文件覆盖（首行注释）或按 glob 批量指定：

```ts
// 文件顶部首行：// @vitest-environment jsdom

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ["**/*.dom.test.ts", "jsdom"],
      ["**/*.node.test.ts", "node"],
    ],
  },
});
```

## 全局 API

```ts
export default defineConfig({
  test: { globals: true },
});
```

```json
// tsconfig.json —— 否则 TS 找不到全局 test / expect 类型
{ "compilerOptions": { "types": ["vitest/globals"] } }
```

::: tip 默认 `globals: false`
显式 `import { test, expect } from "vitest"` 更清晰、类型更准；只有从 Jest 迁移时才建议开 `true`。
:::

## 启动钩子：setupFiles vs globalSetup

```ts
export default defineConfig({
  test: {
    // 每个测试文件执行前都会运行——可访问测试 API、可注册全局钩子
    setupFiles: ["./src/test-setup.ts"],
    // 整个测试进程启动前 / 结束后各运行一次——在主线程，拿不到测试 API
    globalSetup: ["./src/global-setup.ts"],
  },
});
```

- `setupFiles`：扩展 jsdom 缺失的全局（如 `IntersectionObserver`）、注册全局 `afterEach`、引入 `@testing-library/jest-dom` 之类断言扩展。
- `globalSetup`：启动 / 关闭一个测试数据库、mock 服务器等“全局一次性”资源。

## 文件匹配

```ts
export default defineConfig({
  test: {
    include: ["**/*.{test,spec}.{ts,tsx,js,jsx}"], // 默认值
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
```

## 路径别名

`vitest.config.ts` 里 `test.alias` 可单独为测试设别名（会与 Vite 的 `resolve.alias` 合并）：

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // 把某个无法在测试环境加载的模块整体重定向到 mock 文件
      vscode: resolve(__dirname, "./mock/vscode.js"),
    },
  },
});
```

## Mock 清理策略

测试间的 mock 状态污染是高频坑。三个配置项语义不同：

```ts
export default defineConfig({
  test: {
    clearMocks: true, // 每个测试后清除“调用记录”（.mockClear()）
    resetMocks: false, // 每个测试后重置“实现”（.mockReset()）——通常关
    restoreMocks: true, // 每个测试后恢复 spyOn 的“原始实现”（.mockRestore()）
  },
});
```

| 配置           | 清调用记录 | 重置实现 | 恢复原始实现 |
| -------------- | ---------- | -------- | ------------ |
| `clearMocks`   | ✅         | ❌       | ❌           |
| `resetMocks`   | ✅         | ✅       | ❌           |
| `restoreMocks` | ✅         | ✅       | ✅（仅 spyOn）|

`vi.fn` / `vi.spyOn` 的行为细节见 [模拟（Mock）](./mocking.md)。

## 超时与重试

```ts
export default defineConfig({
  test: {
    testTimeout: 5000, // 单个测试超时（ms）
    hookTimeout: 10000, // 钩子超时
    retry: 2, // 失败自动重试次数（flaky 测试兜底）
  },
});
```

## 隔离

```ts
export default defineConfig({
  test: {
    // 默认 true：每个测试文件独立 worker + 独立模块实例，互不污染
    // 设 false 更快，但文件间共享模块状态，有副作用风险
    isolate: true,
  },
});
```

## 复用 vite.config

用 `mergeConfig` 把测试配置合并进现有 `vite.config.ts`，让 Vue 插件、alias、`define` 只配一次：

```ts
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: { environment: "jsdom", globals: true },
  }),
);
```

::: warning vite.config 导出函数时
若 `vite.config.ts` 导出的是 `({ mode }) => ({...})` 函数，需在 `defineConfig((env) => mergeConfig(viteConfig(env), {...}))` 内调用后再合并。
:::

## 多项目（projects）

一个仓库里不同目录用不同测试配置（如 `unit` 用 node、`browser` 用浏览器），用 `test.projects`：

```ts
export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", environment: "node", include: ["src/**/*.test.ts"] } },
      { test: { name: "dom", environment: "jsdom", include: ["src/**/*.dom.test.ts"] } },
    ],
  },
});
```

```bash
vitest --project unit          # 只跑某个 project
```

::: warning `workspace` 已废弃
v3.2 起 `vitest.workspace.ts` / `test.workspace` 被 `test.projects` 取代，升级时迁移。
:::

## 覆盖率（基本）

```ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8", // v8（默认）/ istanbul
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
});
```

::: tip 覆盖率单独成章
provider 取舍（v8 vs istanbul）、指标含义、阈值与 CI 门禁、“覆盖率会骗人”等，详见「测试方法与质量 > 代码覆盖率」一章，这里只列最小配置。
:::
