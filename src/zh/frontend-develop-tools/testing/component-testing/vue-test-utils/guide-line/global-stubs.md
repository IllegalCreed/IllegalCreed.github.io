---
layout: doc
outline: [2, 3]
---

# global 选项与 stub

> 基于 @vue/test-utils v2.x 编写

## 速查

- `global.plugins`：注入 Pinia / Vue Router 等插件
- `global.provide`：注入 `inject` 依赖
- `global.mocks`：mock 全局属性（`$t` / `$store` 等）
- `global.stubs`：替换子组件（`true` / 自定义模板 / 字符串数组）
- `global.components` / `global.directives`：注册全局组件 / 指令
- `shallowMount` / `mount(C, { shallow: true })`：stub 所有子组件
- `config.global`：套件级默认（setup 文件里设）

## global 挂载选项

`global` 控制 Vue 应用级配置，作用于整个组件树：

```ts
const wrapper = mount(MyComponent, {
  global: {
    plugins: [createPinia(), router], // 注入插件
    provide: { "my-key": "data" }, // inject 依赖
    mocks: { $t: (k) => k }, // mock 全局属性（如 vue-i18n）
    stubs: { HeavyChart: true }, // stub 子组件
    components: { GlobalBtn: MyButton }, // 全局组件
    directives: { tooltip: { mounted() {} } }, // 全局指令
  },
});
```

::: tip provide 测 inject
组件内 `const v = inject("my-key")`，测试用 `global.provide: { "my-key": "data" }` 注入即可断言。
:::

## mount vs shallowMount

```ts
mount(Parent); // 完整渲染所有子组件
shallowMount(Parent); // 子组件 → <child-stub />
mount(Parent, { shallow: true }); // 等价 shallowMount
```

::: warning v2 行为变更
`shallowMount` 在 v2 起**不再渲染 stub 子组件的默认插槽内容**（v1 会渲染）。需恢复旧行为：

```ts
import { config } from "@vue/test-utils";
config.global.renderStubDefaultSlot = true;
```

:::

## 局部 stub 子组件

比 `shallowMount` 更精细——只 stub 个别子组件，其余完整渲染：

```ts
const wrapper = mount(Parent, {
  global: {
    stubs: {
      ChildComponent: true, // 默认占位 stub
      HeavyChart: { template: "<div class='chart-stub' />" }, // 自定义模板
    },
  },
});
```

字符串数组批量 stub：

```ts
global: {
  stubs: ["RouterLink", "RouterView"];
}
```

## findComponent 配合 stub

```ts
// 断言 stub 渲染了
expect(wrapper.findComponent({ name: "HeavyChart" }).exists()).toBe(true);

// 访问未 stub 的子组件
const child = wrapper.findComponent(ChildComponent);
expect(child.props("label")).toBe("ok");
```

## 套件级默认

`config.global` 对整个测试套件生效，常放 setup 文件，省去每个测试重复写：

```ts
// vitest.setup.ts
import { config } from "@vue/test-utils";

config.global.mocks = { $t: (k) => k };
config.global.stubs = { Teleport: true };
```

注入 Pinia / Vue Router 的具体写法见 [测试 Router 与 Pinia](./router-pinia.md)。
