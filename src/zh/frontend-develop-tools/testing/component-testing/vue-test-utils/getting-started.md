---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 @vue/test-utils v2.x 编写

## 速查

- 安装：`pnpm add -D @vue/test-utils`（搭配 Vitest + jsdom / happy-dom）
- Vitest 配置：`plugins: [vue()]` + `test.environment: "jsdom"`
- 挂载：`mount(Component, { props, global })` → 返回 wrapper
- 浅挂载：`shallowMount(C)` / `mount(C, { shallow: true })`（子组件 stub 成占位）
- 查询：`wrapper.find("css")` / `get`（找不到抛错）/ `findComponent(Child)`
- 交互：`await wrapper.find("button").trigger("click")` / `setValue(v)`（**必须 await**）
- 断言：`text()` / `html()` / `exists()` / `classes()` / `emitted()`
- 注入：`global: { plugins: [pinia, router], provide, stubs, mocks }`

## 安装

```bash
pnpm add -D @vue/test-utils
```

VTU 需要 DOM 环境，搭配 Vitest 时配 `jsdom`（API 全）或 `happy-dom`（更快）：

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: { environment: "jsdom" },
});
```

::: tip Vite 项目零额外配置
基于 Vite 的项目里，Vitest 通过 `@vitejs/plugin-vue` 原生处理 `.vue` 文件，无需额外 transform。VTU 本身不关心你用哪个运行器，只负责挂载与交互。
:::

## 第一个测试

```ts
// HelloWorld.vue: <template><h1>{{ msg }}</h1></template>
import { mount } from "@vue/test-utils";
import HelloWorld from "./HelloWorld.vue";

test("渲染传入的 msg", () => {
  const wrapper = mount(HelloWorld, {
    props: { msg: "Hello Vue!" },
  });
  expect(wrapper.text()).toContain("Hello Vue!");
});
```

`mount` 返回一个 **wrapper**，它包裹挂载后的组件，提供查询、交互、断言的入口。

## mount vs shallowMount

```ts
import { mount, shallowMount } from "@vue/test-utils";

mount(Parent); // 完整渲染，含所有子组件——最接近真实
shallowMount(Parent); // 子组件被替换为 <child-stub />，隔离本组件
// 等价：mount(Parent, { shallow: true })
```

- `mount`：集成/功能测试，置信度高。
- `shallowMount`：子组件很重、或只测本组件逻辑时用，隔离更彻底。

详见 [global 选项与 stub](./guide-line/global-stubs.md)。

## 交互与断言

```ts
const wrapper = mount(Counter);

// 交互必须 await（Vue DOM 更新是异步的）
await wrapper.find("button").trigger("click");

// 断言
expect(wrapper.find("[data-test='count']").text()).toBe("1");
expect(wrapper.find("#error").exists()).toBe(false);
```

::: warning 别忘了 await
`trigger` / `setValue` / `setProps` 都返回 Promise（内部等一次 `nextTick`），不 `await` 则断言在 DOM 更新前执行、必然失败。详见 [异步与插槽](./guide-line/async-slots.md)。
:::

## 注入 Pinia / Router 等

用 `global` 选项给组件树注入应用级依赖：

```ts
import { createTestingPinia } from "@pinia/testing";

const wrapper = mount(Counter, {
  global: {
    plugins: [createTestingPinia(), router], // 注入 Pinia、Vue Router
    provide: { theme: "dark" }, // inject 依赖
    stubs: { HeavyChart: true }, // stub 子组件
  },
});
```

## 下一步

- [Wrapper API](./guide-line/wrapper-api.md)：`find`/`get`/`findComponent`、`trigger`/`setValue`、`text`/`exists`/`classes`
- [Props 与事件](./guide-line/props-events.md)：`props`/`setProps`、`emitted` 断言事件、`v-model` 测试
- [异步与插槽](./guide-line/async-slots.md)：`await`/`nextTick`/`flushPromises`、`slots` 选项
- [global 选项与 stub](./guide-line/global-stubs.md)：`plugins`/`provide`/`mocks`/`stubs`、`shallowMount`
- [测试 Router 与 Pinia](./guide-line/router-pinia.md)：真实 router + `createMemoryHistory`、`createTestingPinia`、Teleport / Transition
