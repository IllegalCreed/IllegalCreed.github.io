---
layout: doc
outline: [2, 3]
---

# 异步与插槽

> 基于 @vue/test-utils v2.x 编写

## 速查

- `await wrapper.trigger(...)`：等事件触发的 DOM 更新
- `await nextTick()`：手动等一次 Vue 渲染队列刷新
- `await flushPromises()`：等所有 Promise resolve（含 axios / fetch）
- `async setup()` 组件：用 `<Suspense>` 包裹后测
- 插槽：挂载选项 `slots`（默认 / 具名 / 作用域）

## 为什么必须 await

Vue 的 DOM 更新是**异步批量**的，而测试代码是同步执行的。`trigger` / `setValue` / `setProps` 内部都会返回 `nextTick()`；不 `await` 则断言在 DOM 更新前跑、必然失败。

```ts
// ❌ 漏 await：断言时 DOM 还没更新
wrapper.find("button").trigger("click");
expect(wrapper.text()).toContain("1"); // 失败

// ✅
await wrapper.find("button").trigger("click");
expect(wrapper.text()).toContain("1");
```

## 三种等待方式

```ts
import { nextTick } from "vue";
import { flushPromises } from "@vue/test-utils";

await wrapper.trigger("click"); // 等事件引发的更新
await nextTick(); // 手动等一次渲染刷新
await flushPromises(); // 等所有挂起的 Promise
```

## 异步 HTTP 测试

组件里发请求（axios / fetch）时，先 mock，再用 `flushPromises` 等数据回来：

```ts
import { flushPromises } from "@vue/test-utils";

test("加载文章列表", async () => {
  vi.spyOn(axios, "get").mockResolvedValue({ data: posts });

  const wrapper = mount(PostList);
  await wrapper.find("button").trigger("click");
  expect(wrapper.html()).toContain("Loading..."); // Promise 还 pending

  await flushPromises(); // 等 axios 的 Promise resolve
  expect(wrapper.findAll("[data-test='post']")).toHaveLength(3);
});
```

::: tip 网络请求更推荐 MSW
直接 mock axios 适合简单场景；涉及多个接口、跨测试复用时，用 MSW 在网络层拦截更干净（业务代码不动）。`flushPromises` 仍是等待异步完成的关键。
:::

## 异步 setup 与 Suspense

组件用 `async setup()`（顶层 await）时，需用 `<Suspense>` 包裹后再挂载：

```ts
import { defineComponent } from "vue";

const TestComponent = defineComponent({
  components: { AsyncComp },
  template: "<Suspense><AsyncComp /></Suspense>",
});

const wrapper = mount(TestComponent);
await flushPromises(); // 等 async setup 完成
expect(wrapper.html()).toContain("加载完成");
```

## 插槽

用挂载选项 `slots` 传入插槽内容，支持字符串、HTML、SFC、渲染函数、对象：

```ts
import { h } from "vue";
import Header from "./Header.vue";

const wrapper = mount(Layout, {
  slots: {
    default: "Main Content", // 字符串
    header: Header, // SFC 组件
    sidebar: h("div", "Sidebar"), // 渲染函数
    footer: "<div>Footer</div>", // HTML 字符串
  },
});
```

作用域插槽用 `<template>` 语法接收作用域参数：

```ts
const wrapper = mount(List, {
  slots: {
    item: `<template #item="{ name }">{{ name }}</template>`,
  },
});
```
