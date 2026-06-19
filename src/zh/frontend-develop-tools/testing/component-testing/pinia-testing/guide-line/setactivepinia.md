---
layout: doc
outline: [2, 3]
---

# 与 setActivePinia 的边界

> 基于 @pinia/testing v1.x 编写

## 速查

- 组件 + store 集成测试 → `createTestingPinia()` 注入 `global.plugins`
- 纯 store 单元测试 → `setActivePinia(createPinia())` 直接测 store
- store 依赖 Pinia 插件时 → `createApp().use(pinia)` 或 `createTestingPinia({ fakeApp: true })`

## 两个场景，不要混用

| 场景 | 工具 | 适用 |
| ---- | ---- | ---- |
| **纯 store 单元测试** | `setActivePinia(createPinia())` | 直接实例化 store，测 action 真实逻辑、getter 计算 |
| **组件 + store 集成测试** | `createTestingPinia()`（`global.plugins`）| mock / spy store，隔离组件与 store 实现 |

## 纯 store 单元测试

不涉及组件、只测 store 本身时，用 `setActivePinia(createPinia())`，**不需要 @pinia/testing**：

```ts
import { setActivePinia, createPinia } from "pinia";
import { useCounterStore } from "@/stores/counter";

describe("Counter Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia()); // 每个测试用全新 pinia
  });

  it("increment 真实执行", () => {
    const counter = useCounterStore();
    expect(counter.n).toBe(0);
    counter.increment(); // 真正执行 action 逻辑
    expect(counter.n).toBe(1);
  });
});
```

这里 action 真正运行，验证的是 store 自身的逻辑正确性。

## 组件集成测试

测「组件如何与 store 交互」时用 `createTestingPinia`，默认把 action stub 成 spy：

```ts
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";

const wrapper = mount(Counter, {
  global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
});
const store = useCounterStore();
await wrapper.find("button").trigger("click");
expect(store.increment).toHaveBeenCalledOnce(); // 关注交互，不跑真实逻辑
```

## store 依赖 Pinia 插件时

Pinia 插件只在 `pinia` 被 `app.use()` 后激活。纯 store 测试若依赖插件，需手动触发：

```ts
import { createApp } from "vue";
const app = createApp({});
const pinia = createPinia();
app.use(pinia);
setActivePinia(pinia);
```

或在组件集成测试里用 `createTestingPinia({ fakeApp: true })` 让其内部 `app.use(pinia)`。
