---
layout: doc
outline: [2, 3]
---

# 并行与多浏览器

> 基于 Playwright v1.61 编写

## 速查

- 默认按文件并行（多 worker 进程）；`fullyParallel: true` 文件内也并行
- `test.describe.configure({ mode: "serial" | "parallel" })` 控制单文件
- worker 数：`--workers 4` / `--workers=50%`；CI 常用 50%
- sharding：`--shard=1/4` 分散到多台 CI 机器
- 多浏览器：config.projects 配 chromium/firefox/webkit + devices
- project 依赖：`dependencies: ["setup"]` 先跑登录 setup

## 并行模型（worker）

Playwright 默认把测试**按文件**分发到多个 worker 进程并行跑。每个 worker 是独立 Node 进程，互不共享状态：

```ts
// playwright.config.ts
export default defineConfig({
  fullyParallel: true, // 文件内的 test 也并行
  workers: process.env.CI ? "50%" : undefined,
});
```

```ts
// 单文件内控制模式
test.describe.configure({ mode: "parallel" }); // 文件内并行
test.describe.configure({ mode: "serial" }); // 串行（前一个失败则跳过后续）
```

> 并行安全：避免写全局共享资源，可用 `workerIndex` 给各 worker 分配独立测试数据（如不同账号）。

## Sharding（跨机器分片）

把测试分散到多台 CI 机器，再合并报告：

```bash
npx playwright test --shard=1/4   # 第 1 台（共 4 台）
npx playwright test --shard=2/4   # 第 2 台
```

## 多浏览器 projects 矩阵

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 13"] } },
  ],
});
```

`devices[...]` 预置视口、UA、touch 等。跑单个：`npx playwright test --project=webkit`。

## project 依赖（登录 setup）

用 setup project 先准备登录态，正式 project 复用：

```ts
projects: [
  { name: "setup", testMatch: /.*\.setup\.ts/ },
  {
    name: "authenticated",
    use: { storageState: "playwright/.auth/user.json" },
    dependencies: ["setup"], // setup 先跑，保存登录态
  },
];
```