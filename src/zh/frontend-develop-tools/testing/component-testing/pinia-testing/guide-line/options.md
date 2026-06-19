---
layout: doc
outline: [2, 3]
---

# 选项

> 基于 @pinia/testing v1.x 编写

## 速查

- `stubActions`：`true`（默认，全 stub）/ `false`（真执行 + spy）/ `string[]`（选择性）/ 函数（自定义）
- `initialState`：预设各 store 初始 state（key 是 store id）
- `stubPatch`：`true` 时 `$patch` 被 spy 但不改 state（默认 false）
- `stubReset`：`true` 时 `$reset` 被 spy 但不重置（默认 false）
- `plugins`：注入应用层 Pinia 插件
- `fakeApp`：`true` 时创建空 Vue App 并 `app.use(pinia)`
- `createSpy`：自定义 spy 工厂

## stubActions（核心）

控制哪些 action 被替换为 spy，四种写法：

```ts
// 1) true（默认）：全部 action 变 spy，只记录、不执行
createTestingPinia();

// 2) false：action 真正执行，但仍被 spy 包裹（可断言调用 + 验证真实效果）
createTestingPinia({ stubActions: false });

// 3) 字符串数组：只 stub 指定 action，其余正常执行
createTestingPinia({ stubActions: ["increment", "reset"] });

// 4) 函数：(actionName, store) => boolean，store 初始化时求值
createTestingPinia({
  stubActions: (name, store) => name.startsWith("set"),
});
```

::: tip 选哪个
只关心「组件有没有调用 action」用默认 `true`；既要跑真实 action 又要断言调用用 `false`；混合需求用数组 / 函数精细控制。空数组 `[]` 等同 `false`。
:::

## initialState

key 是 store 的 id（`defineStore` 第一个参数），值是要覆盖的字段（partial）：

```ts
createTestingPinia({
  initialState: {
    counter: { n: 20 }, // counter store
    user: { name: "Alice" }, // user store
  },
});
```

内部通过 `$patch` 应用，未提供的字段保持默认。

## stubPatch / stubReset

默认 `$patch` / `$reset` 会真正改 / 重置 state。需要拦截（只 spy 不生效）时：

```ts
createTestingPinia({
  stubPatch: true, // $patch 被 spy 但不改 state
  stubReset: true, // $reset 被 spy 但不重置
});
```

## plugins

应用层 Pinia 插件（如持久化）要通过 `plugins` 选项传，**不要**在返回实例上 `.use()`：

```ts
createTestingPinia({ plugins: [somePlugin] }); // ✅
// createTestingPinia().use(somePlugin)         // ❌
```

## fakeApp

某些插件依赖真实 App 上下文。设 `fakeApp: true` 会创建一个空 Vue App 并 `app.use(pinia)`，让这类插件正常激活：

```ts
createTestingPinia({ fakeApp: true });
```

## createSpy

不在 Jest / Vitest(globals) 自动检测范围时显式传：

```ts
import { vi } from "vitest";
createTestingPinia({ createSpy: vi.fn });
```
