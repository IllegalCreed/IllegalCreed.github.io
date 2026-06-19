---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Jest v30.x 编写

## 速查

- 安装：`pnpm add -D jest`；DOM 测试再加 `jest-environment-jsdom`（v28+ 需单独装）
- TypeScript：`ts-jest`（带类型检查）或 `babel-jest + @babel/preset-typescript`（更快、不检查类型）
- 配置文件：`jest.config.ts`（v30 原生支持），`import { defineConfig } from "jest"`
- 测试文件：`*.test.ts` / `*.spec.ts` / `__tests__/` 下的文件
- 跑测试：`jest`（全部）/ `jest --watch`（监听）/ `jest -t "名"` / `jest --coverage`
- 更新快照：`jest -u`
- 环境：`testEnvironment` = `node`（默认）/ `jsdom`（需单独装）
- 类型：`@jest/globals`（官方，随版本更新）或 `@types/jest`（第三方）

## 安装

```bash
pnpm add -D jest
```

DOM 测试（操作 `document`、测组件）需单独安装 jsdom 环境——自 Jest 28 起它不再内置：

```bash
pnpm add -D jest-environment-jsdom
```

::: warning Jest 不支持 Vite
官方明确：Jest 因与 Vite 插件系统不兼容而**不支持** Vite。若你的项目基于 Vite，应选 [Vitest](../vitest/)；Jest 更适合 React Native、非 Vite（webpack / CRA）以及存量 Jest 套件。
:::

## TypeScript

两种转换方案，二选一：

```bash
# 方案 A：ts-jest —— 运行时做类型检查（慢一点，更安全）
pnpm add -D ts-jest

# 方案 B：babel-jest —— 仅剥离类型，不检查（更快）
pnpm add -D babel-jest @babel/core @babel/preset-env @babel/preset-typescript
```

::: tip 取舍
`ts-jest` 会在跑测试时校验类型，类型错误导致测试失败；`babel-jest` 只是把 TS 转成 JS、不校验类型（类型问题留给 `tsc` / IDE）。追求速度选 babel，想让测试兜住类型选 ts-jest。详见 [配置](./guide-line/configuration.md#typescript)。
:::

## 配置文件

Jest 30 原生支持 `jest.config.ts`：

```ts
// jest.config.ts
import { defineConfig } from "jest";

export default defineConfig({
  testEnvironment: "jsdom", // node（默认）/ jsdom（需单独装）
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // 对应 tsconfig paths
  },
});
```

完整字段（preset、transform、覆盖率、清理策略等）见 [配置](./guide-line/configuration.md)。

## 第一个测试

```ts
// src/math.ts
export function add(a: number, b: number): number {
  return a + b;
}
```

```ts
// src/math.test.ts
import { describe, expect, test } from "@jest/globals";
import { add } from "./math";

describe("add", () => {
  test("两数相加", () => {
    expect(add(1, 2)).toBe(3);
  });
});
```

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

## 命令行

```bash
jest                  # 跑全部测试
jest --watch          # 监听模式（只跑变更相关）
jest -t "两数相加"     # 按测试名过滤（正则）
jest src/math.test.ts # 按文件过滤
jest --coverage       # 覆盖率
jest -u               # 更新快照
jest --ci             # CI 模式：新快照不自动保存，直接失败
```

更多参数见 [参考](./reference.md)。

## 测试环境

`testEnvironment` 决定全局环境，注意 jsdom 需单独安装：

| 环境     | 场景                       | 备注                              |
| -------- | -------------------------- | --------------------------------- |
| `node`   | 纯逻辑、工具函数（默认）   | 无 DOM，最快                      |
| `jsdom`  | 组件、DOM 操作             | 需 `pnpm add -D jest-environment-jsdom` |

也可在单个文件顶部用 docblock 覆盖：

```js
/**
 * @jest-environment jsdom
 */
```

## 全局类型

`@jest/globals`（官方，随 Jest 更新）或 `@types/jest`（DefinitelyTyped，第三方、可能版本落后）：

```ts
// 推荐：显式 import（官方）
import { describe, expect, test, jest } from "@jest/globals";
```

## 下一步

- [配置](./guide-line/configuration.md)：jest.config 完整字段、ts-jest vs babel-jest、moduleNameMapper、清理策略
- [测试 API](./guide-line/test-api.md)：`test.each`、钩子执行顺序、修饰符
- [断言与快照](./guide-line/assertions.md)：matchers、非对称匹配、`toMatchSnapshot`
- [模拟（Mock）](./guide-line/mocking.md)：`jest.fn`/`jest.mock` 提升 / `__mocks__` 自动加载 / 假定时器
- [ESM 与对照 Vitest](./guide-line/esm-and-vitest.md)：CJS/ESM 差异、何时选 Jest
