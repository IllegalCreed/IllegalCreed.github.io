---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vitest v4.1.x 编写

## 速查

- 安装：`pnpm add -D vitest`（需要 DOM 时再加 `jsdom` 或 `happy-dom`）
- 测试文件：`*.test.ts` / `*.spec.ts`（默认 `**/*.{test,spec}.{ts,tsx,js,jsx}`）
- 配置文件：`vitest.config.ts`，从 `vitest/config` 导入 `defineConfig`
- 跑测试：`vitest`（watch）/ `vitest run`（单次，CI）/ `vitest --ui`（可视化面板）
- 过滤：`vitest -t "用例名"`（按测试名）/ `vitest path/foo.test.ts`（按文件）
- 环境：`test.environment` = `node`（默认）/ `jsdom` / `happy-dom`
- 全局 API：`globals: true` + tsconfig 加 `"types": ["vitest/globals"]`
- 复用 vite 配置：`mergeConfig(viteConfig, defineConfig({ test: {} }))`

## 安装

最小安装只需运行器本身：

```bash
pnpm add -D vitest
```

测试用到 DOM（Vue 组件、`document`、`window`）时，再装一个 DOM 模拟环境：

```bash
pnpm add -D jsdom        # 兼容性好，API 完整
# 或
pnpm add -D happy-dom    # 更快，但部分 API 不全
```

::: tip Vitest 需要 Vite
Vitest 复用 Vite 的转换管线，会自动读取项目根目录的 `vite.config.*`。在 Vue 3 + Vite 项目里它天然契合——`@vitejs/plugin-vue`、路径 alias、`define` 等配置测试时无需重写。
:::

## 第一个测试

新建 `src/math.ts` 与 `src/math.test.ts`：

```ts
// src/math.ts
export function add(a: number, b: number): number {
  return a + b;
}
```

```ts
// src/math.test.ts
import { describe, expect, test } from "vitest";
import { add } from "./math";

describe("add", () => {
  test("两数相加", () => {
    expect(add(1, 2)).toBe(3);
  });
});
```

在 `package.json` 加脚本并运行：

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

```bash
pnpm test         # watch 模式，改文件自动重跑相关测试
pnpm test:run     # 单次执行，CI 用
```

## 配置文件

推荐独立的 `vitest.config.ts`，从 `vitest/config`（而非 `vite`）导入 `defineConfig`：

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // 测试环境：node / jsdom / happy-dom
    globals: false, // 是否注入全局 test/expect（默认 false）
    setupFiles: ["./src/test-setup.ts"], // 每个测试文件执行前运行
    include: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
```

完整字段（mock 清理、覆盖率、alias、超时、重试等）见 [配置](./guide-line/configuration.md)。

## 命令行

```bash
vitest                       # 默认 watch 模式
vitest run                   # 单次执行（CI）
vitest --ui                  # 启动可视化 UI（需 @vitest/ui）
vitest run --coverage        # 生成覆盖率报告
vitest -t "两数相加"          # 按测试名过滤（正则）
vitest src/math.test.ts      # 按文件名过滤
vitest --changed             # 只跑改动相关的测试
vitest run --shard=1/3       # 分片，多机并行 CI
```

更多参数见 [参考](./reference.md)。

## 测试环境

`test.environment` 决定每个测试文件跑在什么环境里：

| 环境         | 适用场景                       | 特点                          |
| ------------ | ------------------------------ | ----------------------------- |
| `node`       | 纯逻辑、工具函数、后端（默认） | 无 DOM，最快                  |
| `jsdom`      | Vue 组件、DOM 操作             | API 完整，较慢                |
| `happy-dom`  | 同上，追求速度                 | 更快，部分 CSS / API 不完整   |

可在单个文件顶部用注释覆盖（须是首行）：

```ts
// @vitest-environment jsdom
import { expect, test } from "vitest";

test("操作 DOM", () => {
  expect(document.createElement("div")).toBeTruthy();
});
```

## 全局 API

默认必须显式 `import { test, expect } from "vitest"`。若想像 Jest 那样直接用全局 `test` / `expect`，开启 `globals`：

```ts
// vitest.config.ts
export default defineConfig({
  test: { globals: true },
});
```

```json
// tsconfig.json —— 否则 TS 找不到全局类型
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

::: tip 新项目建议保持 `globals: false`
显式 import 让依赖更清晰、IDE 类型提示更准；只有从 Jest 迁移、想减少改动量时才开 `globals: true`。
:::

## 复用 vite.config

若不想维护两份配置，用 `mergeConfig` 把测试配置合并进现有的 `vite.config.ts`：

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
    },
  }),
);
```

这样 Vue 插件、`@` 路径 alias、环境变量等只配一次，测试与构建完全同源。

## 下一步

- [配置](./guide-line/configuration.md)：环境、覆盖率、alias、清理策略等完整字段
- [测试 API](./guide-line/test-api.md)：`test.each` / `test.for` / 并发 / fixtures / 钩子
- [断言](./guide-line/assertions.md)：matchers、`expect.soft`、类型测试
- [模拟（Mock）](./guide-line/mocking.md)：`vi.fn` / `vi.spyOn` / `vi.mock` 提升 / 假定时器
- [从 Jest 迁移](./guide-line/migration.md)：API 映射与常见差异
