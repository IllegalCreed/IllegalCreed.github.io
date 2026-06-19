---
layout: doc
outline: [2, 3]
---

# 模拟（Mock）

> 基于 Vitest v4.1.x 编写

## 速查

- 造函数：`vi.fn()`，`.mockReturnValue()` / `.mockResolvedValue()` / `.mockImplementation()` / `*Once`
- 监视方法：`vi.spyOn(obj, "method")`，`.mockRestore()` 恢复；v4 可用 `using` 自动恢复
- 模块 mock：`vi.mock(path, factory)`——**会被提升到文件顶部**
- 提升变量：`vi.hoisted(() => ({...}))`，解决 factory 引用外部变量报错
- 动态 mock：`vi.doMock`（不提升）+ 动态 `import()`
- 类型安全：`vi.mocked(fn).mockReturnValue(...)`
- 全局 / 环境：`vi.stubGlobal()` / `vi.stubEnv()`，配 `unstubAllGlobals` / `unstubAllEnvs`
- 假定时器：`vi.useFakeTimers()` + `advanceTimersByTime()` / `runAllTimers()` / `setSystemTime()`

## vi.fn — 造一个 mock 函数

```ts
import { vi, expect, test } from "vitest";

test("记录调用 + 设定返回", () => {
  const fn = vi.fn().mockReturnValue("Hi");

  expect(fn("a", 1)).toBe("Hi");
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith("a", 1);
});

// 一次性返回、自定义实现、异步
const once = vi.fn().mockReturnValueOnce("first").mockReturnValue("default");
const add = vi.fn((a: number, b: number) => a + b);
const fetchUser = vi.fn().mockResolvedValue({ id: 1 });
```

## vi.spyOn — 监视已有方法

```ts
import { vi, expect, test } from "vitest";

const utils = { now: () => Date.now() };

test("替换实现并断言调用", () => {
  const spy = vi.spyOn(utils, "now").mockReturnValue(1000);

  expect(utils.now()).toBe(1000);
  expect(spy).toHaveBeenCalled();

  spy.mockRestore(); // 恢复原实现
});
```

v4 可用 ES 显式资源管理 `using`，离开作用域自动 `mockRestore`：

```ts
test("自动恢复", () => {
  using spy = vi.spyOn(console, "log").mockImplementation(() => {});
  console.log("x");
  expect(spy).toHaveBeenCalled();
}); // 这里自动 restore，不必手写 afterEach
```

监视 getter / setter：

```ts
const spy = vi.spyOn(obj, "count", "get").mockReturnValue(42);
```

## vi.mock — 模块级 mock 与提升

`vi.mock` 是 Vitest 最容易踩坑、也最高频考的点：**它会被插件提升（hoist）到文件所有 `import` 之前执行**，所以写在哪一行都一样早。

```ts
import { getUser } from "./api"; // 实际拿到的是被 mock 后的版本

vi.mock("./api", () => ({
  getUser: vi.fn().mockResolvedValue({ id: 1, name: "Alice" }),
}));
```

保留部分原实现，用 `importOriginal`：

```ts
vi.mock("./utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("./utils")>();
  return {
    ...original,
    formatDate: vi.fn().mockReturnValue("2026-01-01"), // 只改这一个
  };
});
```

推荐用“动态 import 形式”，IDE 类型推断更好：

```ts
vi.mock(import("./module"), async (importOriginal) => {
  const mod = await importOriginal(); // 类型自动推断
  return { ...mod, total: vi.fn() };
});
```

::: danger factory 里不能直接用外部变量
因为提升，下面的 `MOCK` 在 factory 执行时还未定义：

```ts
const MOCK = "test";
vi.mock("./mod", () => ({ value: MOCK })); // ❌ ReferenceError
```

必须用 `vi.hoisted` 把变量也提上去（见下）。
:::

## vi.hoisted — 把变量提到 mock 之前

```ts
const mocks = vi.hoisted(() => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1 }),
}));

vi.mock("./api", () => ({
  fetchUser: mocks.fetchUser,
}));

test("可在用例里改 mock 行为", async () => {
  mocks.fetchUser.mockResolvedValueOnce({ id: 99 });
  // ...
});
```

## vi.doMock — 不提升、按条件 mock

需要“运行到某一刻才决定怎么 mock”时用 `vi.doMock`，它**不提升**，但因此只能配合**动态 `import()`** 生效：

```ts
test("条件 mock", async () => {
  vi.doMock("./config", () => ({ env: "test" }));
  const { env } = await import("./config"); // 必须动态 import
  expect(env).toBe("test");
  vi.doUnmock("./config");
});
```

## vi.mocked — 类型安全包装

`vi.mock` 后，导入的函数运行时是 mock，但 TS 仍认为是原类型。用 `vi.mocked` 拿到 mock 的方法提示：

```ts
import * as api from "./api";
vi.mock("./api");

test("有 .mockResolvedValue 提示", () => {
  vi.mocked(api.getUser).mockResolvedValue({ id: 1, name: "Alice" });
  vi.mocked(api.getConfig, { partial: true }).mockReturnValue({ debug: true });
});
```

## vi.mock 的 spy 模式（v4）

`{ spy: true }`：automock 但**保留原始实现**，同时记录调用——既测真实逻辑又能断言被调用：

```ts
import { calculator } from "./calculator";
vi.mock("./calculator", { spy: true });

test("跑真实现 + 断言调用", () => {
  expect(calculator(1, 2)).toBe(3); // 真实结果
  expect(calculator).toHaveBeenCalledWith(1, 2);
});
```

## __mocks__ 目录

与 Jest 不同，Vitest **不自动**加载 `__mocks__/` 下的手动 mock；必须显式 `vi.mock("模块名")`，它才会去找同名 mock 文件：

```ts
vi.mock("axios"); // 此时才使用 __mocks__/axios.ts
```

## 模拟全局与环境变量

```ts
import { vi, afterEach } from "vitest";

// 补 jsdom 缺失的全局（组件测试常用）
vi.stubGlobal(
  "IntersectionObserver",
  vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() })),
);

// 改环境变量（同时作用于 process.env 和 import.meta.env）
vi.stubEnv("NODE_ENV", "production");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
// 或配置 unstubGlobals: true / unstubEnvs: true 自动清理
```

## 假定时器

把 `setTimeout` / `setInterval` / `Date` 等交给 Vitest 控制，让“等 1 秒”变成同步推进：

```ts
import { vi, beforeEach, afterEach, expect, test } from "vitest";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test("推进时间触发回调", () => {
  const cb = vi.fn();
  setTimeout(cb, 1000);

  vi.advanceTimersByTime(1000); // 直接快进，不必真的等
  expect(cb).toHaveBeenCalledTimes(1);
});

test("固定系统时间", () => {
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  expect(new Date().getFullYear()).toBe(2026);
});
```

常用推进方法：`advanceTimersByTime(ms)`、`runAllTimers()`、`advanceTimersToNextTimer()`，以及含 Promise 的异步版 `advanceTimersByTimeAsync()`。

## 两个高频坑

1. **factory 引用外部变量报错** → 用 `vi.hoisted`（见上）。
2. **同文件内部调用无法被 mock**：

```ts
// utils.ts
export function helper() { return 42; }
export function caller() { return helper(); } // 直接调用，不经过模块导出
```

```ts
vi.mock("./utils");
vi.mocked(helper).mockReturnValue(99);
caller(); // 仍是 42——内部引用绕过了 mock
```

解决：把 `helper` 拆到独立文件，或改用依赖注入。

清理策略（`clearMocks` / `resetMocks` / `restoreMocks`）见 [配置](./configuration.md#mock-清理策略)。
