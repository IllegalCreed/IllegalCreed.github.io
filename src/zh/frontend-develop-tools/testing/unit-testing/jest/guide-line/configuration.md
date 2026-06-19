---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 Jest v30.x 编写

## 速查

- 配置文件：`jest.config.ts`（v30 原生支持），`import { defineConfig } from "jest"`
- 环境：`testEnvironment` = `node`（默认）/ `jsdom`（**需单独装 `jest-environment-jsdom`**）
- TS 转换：`preset: "ts-jest"`（带类型检查）或 `babel-jest`（默认 transform，不检查）
- 路径别名：`moduleNameMapper`（对应 tsconfig paths）
- 启动钩子：`setupFilesAfterEnv`（框架就绪后、每个测试文件前运行）
- 清理：`clearMocks` / `resetMocks` / `restoreMocks`（config 或 CLI）
- 覆盖率引擎：`coverageProvider` = `babel`（默认）/ `v8`
- 内存：`testEnvironmentOptions.globalsCleanup`（Jest 30 新增，设 `"on"` 大幅省内存）

## 配置文件

Jest 30 原生支持 TS 配置文件，用 `defineConfig` 拿类型提示：

```ts
// jest.config.ts
import { defineConfig } from "jest";

export default defineConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
});
```

::: tip 加载器
顶部可用 docblock 指定加载器：`/** @jest-config-loader ts-node */` 或 `esbuild-register`，Jest 据此解析 TS 配置文件。
:::

## 测试环境

```ts
export default defineConfig({
  testEnvironment: "node", // 默认；jsdom 需单独安装
});
```

::: warning jsdom 自 Jest 28 起需单独安装
`jest-environment-jsdom` 不再内置：`pnpm add -D jest-environment-jsdom`。Jest 30 把它升级到 jsdom 26（注意 `window.location` 的 mock 行为有变化）。
:::

## TypeScript

### 方案 A：ts-jest（带类型检查）

```ts
export default defineConfig({
  preset: "ts-jest",
  testEnvironment: "node",
});
```

跑测试时做 TS 类型检查、支持 source map；类型错误会让测试失败。代价是更慢。

### 方案 B：babel-jest（仅剥类型，更快）

```js
// babel.config.js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
};
```

`babel-jest` 是 Jest 默认的 transform，只把 TS 转成 JS、**不校验类型**（类型问题交给 `tsc` / IDE）。

## 转换（transform）

默认已用 `babel-jest` 处理 `[jt]sx?`。需要额外文件类型才覆写：

```ts
export default defineConfig({
  transform: {
    "\\.[jt]sx?$": "babel-jest", // 默认值
    "\\.svg$": "<rootDir>/svgTransform.js",
  },
});
```

## 路径别名

`moduleNameMapper` 把正则映射到模块（顺序生效，最具体的写最前）：

```ts
export default defineConfig({
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|scss)$": "<rootDir>/__mocks__/styleMock.js",
  },
});
```

## 启动钩子

```ts
export default defineConfig({
  // 框架就绪后、每个测试文件前运行（可用 expect / jest 全局）
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
});
```

Jest 30 起 `setupFilesAfterEnv` 支持 async / 顶层 await。常用于引入 `@testing-library/jest-dom` 断言扩展、注册全局 `afterEach`。

## Mock 清理策略

和 Vitest 同名，可在 config 或 CLI 设：

```ts
export default defineConfig({
  clearMocks: true,   // 每测试前清调用记录（clearAllMocks）
  resetMocks: false,  // 每测试前移除 mock 实现（resetAllMocks）
  restoreMocks: true, // 每测试前恢复 spyOn 原始实现（restoreAllMocks）
});
```

| 配置           | 清调用记录 | 移除实现 | 恢复原始实现   |
| -------------- | ---------- | -------- | -------------- |
| `clearMocks`   | ✅         | ❌       | ❌             |
| `resetMocks`   | ✅         | ✅       | ❌             |
| `restoreMocks` | ✅         | ✅       | ✅（仅 spyOn） |

## 覆盖率

```ts
export default defineConfig({
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  coverageProvider: "v8", // 或 "babel"（默认）
});
```

::: tip 覆盖率单独成章
指标含义、阈值与 CI 门禁、v8 vs babel/istanbul 取舍等，详见「测试方法与质量 > 代码覆盖率」一章。
:::

## Jest 30 省内存开关

```ts
export default defineConfig({
  testEnvironmentOptions: {
    globalsCleanup: "on", // 默认 "soft"；"on" 更激进地清理全局，大幅降内存
  },
});
```
