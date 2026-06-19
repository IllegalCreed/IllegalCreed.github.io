---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 @pinia/testing v1.x（配 Pinia v3）编写

## 速查

- 安装：`pnpm add -D @pinia/testing`
- 注入：`mount(C, { global: { plugins: [createTestingPinia()] } })`
- 默认：`stubActions: true`——action 变 spy，只记录、不执行真实逻辑
- 取 store：mount 后照常 `useXxxStore()`（自动用 testing pinia）
- 断言 action：`expect(store.action).toHaveBeenCalledOnce()`
- 预设 state：`createTestingPinia({ initialState: { storeId: { ... } } })`
- 改 state：`store.x = 1` / `store.$patch({ ... })`
- spy 工厂：Vitest 未开 globals 时传 `createSpy: vi.fn`

## 安装

```bash
pnpm add -D @pinia/testing
```

它无额外依赖，但需要已装 `pinia` 与测试框架（Vitest / Jest）。

## 注入与第一个测试

把 `createTestingPinia()` 作为 `global.plugins` 注入组件，mount 后照常 `useXxxStore()` 即拿到 testing pinia 的 store：

```ts
import { mount } from "@vue/test-utils";
import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import { useCounterStore } from "@/stores/counter";
import Counter from "@/components/Counter.vue";

test("点击调用 increment", async () => {
  const wrapper = mount(Counter, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
    },
  });

  const store = useCounterStore(); // 自动用 testing pinia

  await wrapper.find("button").trigger("click");

  // 默认 stubActions: true → action 被 spy，可断言调用
  expect(store.increment).toHaveBeenCalledTimes(1);
});
```

::: tip 也能配 Testing Library
`createTestingPinia()` 同样可用于 Testing Library 的 `render(C, { global: { plugins: [createTestingPinia()] } })`——`global` 选项透传给底层 VTU。
:::

## action 默认被 stub

默认 `stubActions: true`：所有 action 被替换为 spy，**只记录调用、不执行真实逻辑**。所以上例点击后 `increment` 被记录，但 state 不会真正改变。需要 action 真正执行时设 `stubActions: false`，详见 [选项](./guide-line/options.md)。

## 预设初始 state

`initialState` 的 key 是 store 的 **id**（`defineStore` 第一个参数），值是要覆盖的字段：

```ts
createTestingPinia({
  initialState: {
    counter: { n: 20 }, // counter store 的 n 从 20 开始
  },
});
// 未提供的字段保持 state() 定义的默认值
```

## createSpy

`@pinia/testing` 会自动选择 spy 工厂：**Jest** 用 `jest.fn`、**Vitest + `globals: true`** 用 `vi.fn`。其它情况（Vitest 未开 globals、Sinon 等）需显式传：

```ts
import { vi } from "vitest";
createTestingPinia({ createSpy: vi.fn });
```

## 下一步

- [选项](./guide-line/options.md)：`stubActions` 四种模式、`initialState`、`stubPatch`/`stubReset`、`plugins`、`fakeApp`
- [state / getter / 断言](./guide-line/state-assertions.md)：直接改 state、覆盖 getter、断言 action、`mockedStore` 类型工具
- [与 setActivePinia 的边界](./guide-line/setactivepinia.md)：组件集成测试 vs 纯 store 单元测试
