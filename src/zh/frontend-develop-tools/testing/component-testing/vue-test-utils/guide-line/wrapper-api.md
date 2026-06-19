---
layout: doc
outline: [2, 3]
---

# Wrapper API

> 基于 @vue/test-utils v2.x 编写

## 速查

- 查询 DOM：`find(css)`（找不到返回空 wrapper）/ `get(css)`（找不到抛错）/ `findAll(css)`
- 查询组件：`findComponent(Child)` / `findComponent({ name })` / `findAllComponents`
- 交互：`await trigger(event)` / `await setValue(v)`（必须 await）
- 断言：`text()` / `html()` / `exists()` / `isVisible()` / `classes()` / `attributes()`
- 组件级：`props()` / `emitted()` / `vm`

## 查询 DOM

```ts
wrapper.find("#submit"); // CSS 选择器，DOMWrapper
wrapper.find("[data-test='email']"); // 推荐用 data-test 属性，抗重构
wrapper.findAll("li"); // 所有匹配，DOMWrapper[]
```

`find` 与 `get` 的区别：

```ts
// find：找不到返回一个"空 wrapper"，配合 exists() 判断
expect(wrapper.find("#admin").exists()).toBe(false);

// get：找不到直接抛错，用于"我断言它一定存在"
const btn = wrapper.get("#submit"); // 不存在则测试报错
```

::: tip 优先 data-test 选择器
用 `[data-test="xxx"]` 而非 class / id 选择，能让测试不被样式 / 结构重构打破。

```ts
wrapper.find('[data-test="submit"]');
```

:::

## 查询组件

v2.x 中 `find` 只接受 CSS 选择器；查找 Vue 组件要用 `findComponent`：

```ts
import Child from "./Child.vue";

wrapper.findComponent(Child); // 传组件定义
wrapper.findComponent({ name: "Child" }); // 按 name
wrapper.findComponent({ ref: "childRef" }); // 按 ref
wrapper.findAllComponents(Child); // 所有匹配
```

## 交互

```ts
await wrapper.find("button").trigger("click"); // 触发事件
await wrapper.find("input").setValue("hello@x.com"); // 设置值
await wrapper.find("input[type=checkbox]").setValue(); // 不传 = 勾选
```

事件修饰符直接拼字符串：

```ts
await wrapper.find("form").trigger("submit.prevent");
await wrapper.find("input").trigger("keydown.enter");
```

::: warning 交互必须 await
`trigger` / `setValue` 返回 Promise（内部等一次 `nextTick`），不 `await` 则后续断言在 DOM 更新前执行。详见 [异步与插槽](./async-slots.md)。
:::

## 断言

```ts
expect(wrapper.text()).toContain("Hello"); // 文本内容
expect(wrapper.html()).toContain("active"); // HTML 字符串
expect(wrapper.find("#user").exists()).toBe(true); // 是否存在

expect(wrapper.classes()).toContain("active"); // 所有 class 数组
expect(wrapper.classes("active")).toBe(true); // 是否含某 class
expect(wrapper.attributes("disabled")).toBe("true"); // 属性值
```

`isVisible()` 检测 CSS 驱动的隐藏（`display:none` 等），需挂载到真实 DOM：

```ts
const wrapper = mount(Nav, { attachTo: document.body });
expect(wrapper.get("#dropdown").isVisible()).toBe(false);
```

## 组件级方法（VueWrapper）

```ts
wrapper.props("msg"); // 当前 props
await wrapper.setProps({ show: false }); // 更新 props（必须 await）
wrapper.emitted("submit"); // 自定义事件记录
wrapper.vm; // 底层 Vue 实例（Options API 的 data/methods）
wrapper.unmount(); // 卸载（v1 叫 destroy）
```

`props` / `emitted` 的用法见 [Props 与事件](./props-events.md)。
