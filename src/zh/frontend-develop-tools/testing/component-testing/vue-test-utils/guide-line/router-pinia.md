---
layout: doc
outline: [2, 3]
---

# 测试 Router 与 Pinia

> 基于 @vue/test-utils v2.x 编写

## 速查

- Router（官方推荐）：真实 `createRouter` + `createMemoryHistory` + `await router.isReady()`
- 只需占位：`RouterLinkStub`
- Pinia：`global.plugins: [createTestingPinia({ initialState, stubActions })]`
- Teleport：`findComponent` 查 / `stubs: { Teleport: true }` 忽略
- Transition：VTU 默认自动 stub，过渡立即生效

## 测试 Vue Router（官方推荐）

官方主推**真实 router + 内存历史**，置信度高。每个测试建独立实例避免污染，挂载后必须 `await router.isReady()`：

```ts
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { routes } from "@/router";

test("点击导航到 /about", async () => {
  const router = createRouter({ history: createMemoryHistory(), routes });
  const wrapper = mount(App, { global: { plugins: [router] } });

  await router.isReady(); // 等初始导航完成（关键）

  await wrapper.find("[data-test='about-link']").trigger("click");
  await flushPromises(); // 等路由切换

  expect(router.currentRoute.value.path).toBe("/about");
  expect(wrapper.html()).toContain("About Page");
});
```

### 只需让 RouterLink 不报错

不测路由逻辑、只想让 `<RouterLink>` 渲染时，用内置 `RouterLinkStub`：

```ts
import { RouterLinkStub } from "@vue/test-utils";

const wrapper = mount(NavBar, {
  global: { stubs: { RouterLink: RouterLinkStub } },
});
expect(wrapper.findComponent(RouterLinkStub).props("to")).toBe("/about");
```

::: tip vue-router-mock 作为补充
社区第三方 `vue-router-mock`（posva 出品）提供更完整的 mock 对象（`setNextGuardReturn` 等），适合纯隔离地测 navigation guard；但官方文档主推真实 router 模式，置信度更高。两者按需选用。
:::

## 测试 Pinia

用 `@pinia/testing` 的 `createTestingPinia()` 注入，默认把所有 action 变成 spy（只记录、不执行）：

```ts
import { createTestingPinia } from "@pinia/testing";
import { useCounterStore } from "@/stores/counter";

test("点击调用 store action", async () => {
  const wrapper = mount(Counter, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: { counter: { count: 5 } }, // 预设 state
          stubActions: false, // false = action 真正执行（默认 true 只记录）
        }),
      ],
    },
  });

  const store = useCounterStore();
  store.count = 10; // 可直接改 state

  await wrapper.find("button").trigger("click");
  expect(store.increment).toHaveBeenCalledOnce(); // action 被记录为 spy
});
```

::: tip @pinia/testing 单独成叶
`createTestingPinia` 的 `stubActions` 三档、getter mock、`createSpy` 等细节，详见「组件测试 > @pinia/testing」一章；这里只示范在 VTU 里的注入方式：`global.plugins: [createTestingPinia(...)]`。
:::

## 测试 Teleport

Teleport 把内容渲染到组件树外（如 `document.body`），但 Virtual DOM 引用保留：

```ts
// 用 findComponent 按组件查（不受 DOM 位置影响）
expect(wrapper.findComponent(Modal).exists()).toBe(true);

// 或直接忽略 Teleport 行为，只测其它逻辑
const wrapper = mount(MyComponent, {
  global: { stubs: { Teleport: true } },
});
```

## 测试 Transition

VTU 默认自动 stub `<transition>` / `<transition-group>`，让过渡**立即生效**，可直接断言过渡后的 DOM，无需等动画：

```ts
test("点击后显示内容", async () => {
  const wrapper = mount(FadeComponent);
  await wrapper.find("button").trigger("click");
  expect(wrapper.find(".content").exists()).toBe(true); // transition 被 stub，立即更新
});
```
