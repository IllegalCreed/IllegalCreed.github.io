---
layout: doc
outline: [2, 3]
---

# 模拟（Mock）

> 基于 Jest v30.x 编写

## 速查

- 造函数：`jest.fn()`，`.mockReturnValue` / `.mockResolvedValue` / `*Once`；`.mock.calls` 看调用
- 监视：`jest.spyOn(obj, "m")`，默认仍调原实现；`jest.restoreAllMocks()` 恢复；Jest 30 可用 `using` 自动恢复
- 模块 mock：`jest.mock(path, factory?)`——**Babel 提升到 import 之前**（CJS）
- 取原始：`jest.requireActual(path)`——**同步**（Vitest 的 `vi.importActual` 是异步）
- 手动 mock：`__mocks__/` 目录——**node_modules 旁的自动加载**，用户模块旁需显式 `jest.mock`
- 假定时器：`jest.useFakeTimers()` + `runAllTimers` / `advanceTimersByTime`

## jest.fn

```ts
const fn = jest.fn().mockReturnValue("Hi");
fn("a", 1);

expect(fn).toHaveBeenCalledWith("a", 1);
expect(fn.mock.calls).toEqual([["a", 1]]); // 所有调用的参数
expect(fn.mock.lastCall).toEqual(["a", 1]);

// 链式控制
const m = jest
  .fn()
  .mockReturnValueOnce("first")
  .mockReturnValue("default")
  .mockResolvedValue({ data: [] });
```

`.mock` 上还有 `results`（返回值）、`instances`、`contexts` 等。

## jest.spyOn

```ts
const spy = jest.spyOn(video, "play"); // 默认仍调用原实现
video.play();
expect(spy).toHaveBeenCalled();

jest.spyOn(api, "fetch").mockResolvedValue({ data: [] }); // 覆盖实现

afterEach(() => jest.restoreAllMocks());
```

Jest 30 支持 `using` 自动恢复（TS 5.2+ / Babel 插件）：

```ts
test("自动恢复", () => {
  using spy = jest.spyOn(console, "warn");
  doWarn();
  expect(spy).toHaveBeenCalled();
}); // 块结束自动 restore，无需 afterEach
```

## jest.mock 与提升

`jest.mock` 被 Babel 插件**提升到文件顶部**，在 `import` 之前执行（CJS）：

```ts
import axios from "axios"; // 实际拿到 mock 后的版本

jest.mock("axios"); // automock：所有方法变 jest.fn()

test("", async () => {
  axios.get.mockResolvedValue({ data: [{ name: "Bob" }] });
  // ...
});
```

::: warning ESM 下不提升
ESM 环境 `jest.mock` 的提升**不生效**，要改用 `jest.unstable_mockModule` + 动态 `import()`，详见 [ESM 与对照 Vitest](./esm-and-vitest.md)。
:::

## jest.requireActual（同步）

保留部分原实现时取原始模块——Jest 是**同步**的，这与 Vitest 的异步 `vi.importActual` 是关键差异：

```ts
jest.mock("../myModule", () => {
  const original = jest.requireActual("../myModule"); // 同步，无需 await
  return {
    __esModule: true,
    ...original,
    getRandom: jest.fn(() => 10), // 只覆盖这一个
  };
});
```

## __mocks__ 目录（手动 mock）

```
project/
├── __mocks__/
│   ├── lodash.js     # node_modules 包 → 自动加载（无需 jest.mock）
│   └── fs.js         # Node 内置 → 仍需显式 jest.mock("fs")
└── models/
    ├── __mocks__/
    │   └── user.js   # 用户模块 → 需显式 jest.mock("./user")
    └── user.js
```

::: tip 加载规则（与 Vitest 的关键差异）
- **node_modules 旁的 `__mocks__`**：第三方包**自动 mock**，无需调用 `jest.mock("lodash")`
- **用户模块旁的 `__mocks__`**：仍需 `jest.mock("./user")` 显式启用
- **Node 内置模块**（fs / path）：即便有 mock 文件也需显式 `jest.mock("fs")`
- **Vitest 无此自动加载机制**，全部需显式 `vi.mock`
:::

```js
// __mocks__/fs.js
const fs = jest.createMockFromModule("fs");
module.exports = fs;
```

## automock

```ts
// jest.config.ts → automock: true，所有模块自动 mock
jest.unmock("../realModule"); // 选择性取消
```

## 假定时器

```ts
jest.useFakeTimers();

test("1 秒后触发", () => {
  const cb = jest.fn();
  setTimeout(cb, 1000);

  jest.advanceTimersByTime(1000); // 精确推进（推荐）
  // 或 jest.runAllTimers() / jest.runOnlyPendingTimers()
  expect(cb).toHaveBeenCalledTimes(1);
});

jest.useFakeTimers({
  now: new Date("2026-01-01"), // 固定初始时间
  doNotFake: ["performance"], // 排除某些 API
});
jest.advanceTimersToNextFrame(); // Jest 30：推进到下一 rAF 帧（约 16ms）

jest.useRealTimers(); // 恢复
```

清理策略（`clearMocks` / `resetMocks` / `restoreMocks`）见 [配置](./configuration.md#mock-清理策略)。
