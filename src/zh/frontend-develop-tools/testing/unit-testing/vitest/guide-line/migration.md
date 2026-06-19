---
layout: doc
outline: [2, 3]
---

# 从 Jest 迁移

> 基于 Vitest v4.1.x 编写

## 速查

- 命名空间整体替换：`jest.*` → `vi.*`
- factory 必须返回对象：`vi.mock(p, () => ({ default: x }))`
- `jest.requireActual()` → `await vi.importActual()`（**异步**）
- 想保留全局 `test` / `expect`：`globals: true` + tsconfig `"types": ["vitest/globals"]`
- `done` 回调不支持 → 改 `async / await`
- `__mocks__` 不自动加载 → 必须显式 `vi.mock()`
- 环境变量：`JEST_WORKER_ID` → `VITEST_POOL_ID`
- ESM 无需 `unstable_mockModule`，直接 `vi.mock`

## 为什么能低成本迁移

Vitest 的 API 刻意对齐 Jest：`describe` / `test` / `expect` 的 matchers、`test.each`、快照、mock 系统几乎同名。多数测试文件只需把 `jest.` 改成 `vi.`，再调一处配置即可跑通。

## API 映射

| Jest                      | Vitest                       | 注意                     |
| ------------------------- | ---------------------------- | ------------------------ |
| `jest.fn()`               | `vi.fn()`                    | 同                       |
| `jest.spyOn()`            | `vi.spyOn()`                 | 同                       |
| `jest.mock()`             | `vi.mock()`                  | factory 返回格式有差异   |
| `jest.requireActual()`    | `await vi.importActual()`    | **异步**，必须 `await`   |
| `jest.clearAllMocks()`    | `vi.clearAllMocks()`         | 同                       |
| `jest.resetAllMocks()`    | `vi.resetAllMocks()`         | 同                       |
| `jest.restoreAllMocks()`  | `vi.restoreAllMocks()`       | 同                       |
| `jest.useFakeTimers()`    | `vi.useFakeTimers()`         | 同                       |
| `jest.setTimeout(n)`      | `vi.setConfig({ testTimeout: n })` | —                  |
| `jest.replaceProperty()`  | `vi.stubEnv()` / `vi.spyOn()`| —                        |
| `JEST_WORKER_ID`          | `VITEST_POOL_ID`             | 环境变量名不同           |

## factory 返回格式（最易踩）

```ts
// ❌ Jest 可以直接返回值
jest.mock("./path", () => "hello");

// ✅ Vitest 必须返回模块对象，默认导出写 default
vi.mock("./path", () => ({ default: "hello" }));

vi.mock("./userService", () => ({
  default: vi.fn(),
  getUser: vi.fn(),
}));
```

## 全局 API

Jest 默认注入全局 `test` / `expect`；Vitest 默认要 import。要保留 Jest 习惯：

```ts
// vitest.config.ts
export default defineConfig({ test: { globals: true } });
```

```json
// tsconfig.json
{ "compilerOptions": { "types": ["vitest/globals"] } }
```

## done 回调不支持

```ts
// ❌ Jest 的 done 风格
test("old", (done) => {
  asyncOp((res) => {
    expect(res).toBeDefined();
    done();
  });
});

// ✅ 改为 async / await
test("new", async () => {
  const res = await new Promise((resolve) => asyncOp(resolve));
  expect(res).toBeDefined();
});
```

## importActual 是异步的

```ts
// Jest
const actual = jest.requireActual("./utils");

// Vitest —— 必须 await
const actual = await vi.importActual<typeof import("./utils")>("./utils");
```

## __mocks__ 目录差异

- **Jest**：`__mocks__/axios.js` 会被自动使用。
- **Vitest**：必须显式 `vi.mock("axios")`，才会去找 `__mocks__/axios.ts`。

## ESM 场景

Jest 处理 ESM 要用 `jest.unstable_mockModule` + 动态 import；Vitest 原生 ESM，直接 `vi.mock()` 即可，无特殊 API。

## 迁移步骤建议

1. 安装：`pnpm add -D vitest`，按需加 `jsdom` / `happy-dom`、`@vitest/coverage-v8`。
2. 新建 `vitest.config.ts`（或 `mergeConfig` 进 `vite.config.ts`），需要时设 `globals: true`。
3. 全局替换 `jest.` → `vi.`，把 `requireActual` 改成 `await vi.importActual`。
4. 处理 `vi.mock` factory 返回对象格式、`done` 回调。
5. `package.json` 脚本 `jest` → `vitest run`，CI 跑通后删除 `jest` / `babel-jest` / `ts-jest` 依赖与配置。

`vi.mock` 的提升语义见 [模拟（Mock）](./mocking.md)；配置项见 [配置](./configuration.md)。
