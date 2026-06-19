---
layout: doc
outline: [2, 3]
---

# ESM 与对照 Vitest

> 基于 Jest v30.x 编写

## 速查

- Jest 默认 **CJS-first**；ESM 仍是 **experimental**
- 启用 ESM：禁用转换 + `NODE_OPTIONS=--experimental-vm-modules`
- ESM 下 `jest.mock` **不提升**，改用 `jest.unstable_mockModule` + `await import()`（factory 必填）
- 对照 Vitest：`requireActual` 同步 / 异步、`__mocks__` 自动加载、Vite 支持、配置复杂度
- 何时仍选 Jest：React Native、存量套件、非 Vite 项目

## CJS 优先

Jest 默认走 CommonJS：每个测试文件在独立 VM context 中 `require`，`jest.mock` 由 Babel 插件提升。这套机制成熟稳定，但与原生 ESM 有本质张力。

## 启用 ESM（experimental）

```bash
# 1) 关闭代码转换（或让 transformer 输出 ESM）
#    jest.config.mjs → export default { transform: {} }

# 2) 必须给 Node 传 flag
NODE_OPTIONS="--experimental-vm-modules" npx jest
```

## ESM 下的 mock 差异（关键）

静态 `import` 在代码执行前就被求值，`jest.mock` 无法像 CJS 那样提升，必须改写：

```ts
import { jest } from "@jest/globals";

// factory 必填；mock 声明在前
jest.unstable_mockModule("node:child_process", () => ({
  execSync: jest.fn(),
}));

// 必须用动态 import，且在 unstable_mockModule 之后
const { execSync } = await import("node:child_process");
```

| 特性          | CJS（默认）             | ESM（experimental）              |
| ------------- | ----------------------- | -------------------------------- |
| 模块 mock     | `jest.mock("m")`        | `jest.unstable_mockModule("m", factory)` |
| factory       | 可选                    | **必填**                         |
| factory 异步  | 不支持                  | 支持（`async () => ...`）        |
| mock 加载时机 | 自动提升到 import 前    | 需 `await import()` 手动加载     |
| `jest.mock` 提升 | Babel 自动             | **不生效**                       |

## Jest 30 的 ESM 改进

```ts
// 1) 支持 import.meta.*
import.meta.jest.useFakeTimers();

// 2) .mts / .cts 原生支持，无需额外配置

// 3) Node v24.9+ 可在 CJS 中 require() ESM
const mod = require("./esm-module.mjs");

// 4) 新增 jest.unstable_unmockModule()
```

## 对照 Vitest（迁移视角）

| 维度              | Jest 30                          | Vitest                       |
| ----------------- | -------------------------------- | ---------------------------- |
| Vite 集成         | **不支持**（官方）               | 原生                         |
| ESM               | experimental，需 flag            | 原生                         |
| `requireActual`   | **同步** `jest.requireActual`    | **异步** `await vi.importActual` |
| `__mocks__` 自动  | node_modules 旁**自动加载**      | **无**，全部显式             |
| 配置              | `transform` / `preset` 较重      | 复用 `vite.config`           |
| 假定时器 / 断言   | `jest.*` / `expect`              | `vi.*` / `expect`（同名）    |
| 快照              | `.snap`（鼻祖）                  | 兼容同格式                   |

**从 Jest 迁到 Vitest 的主要代价**：

1. `jest.requireActual` → `await vi.importActual`（factory 改成 async）
2. `__mocks__` 自动 mock 改为显式 `vi.mock`
3. 确认 `jest.mock` 的提升行为在 Vitest 下一致
4. Jest 特有 API（`jest.createMockFromModule` 等）查找替代

> 反过来，新建 Vite 项目直接用 [Vitest](../vitest/) 更顺；Jest 的强项在 React Native、非 Vite 与存量套件。

## 何时仍选 Jest

| 场景                         | 理由                                       |
| ---------------------------- | ------------------------------------------ |
| React Native                 | Metro 生态，RN 官方 preset 基于 Jest       |
| 存量大型 Jest 套件           | 迁移成本高；Jest 30 已大幅提速             |
| 非 Vite 项目（webpack/CRA）  | Jest 不支持 Vite 插件系统                  |
| 需要 `__mocks__` 自动 mock   | Jest 独有的自动加载机制                    |
