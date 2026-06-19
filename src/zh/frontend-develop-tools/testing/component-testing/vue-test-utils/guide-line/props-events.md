---
layout: doc
outline: [2, 3]
---

# Props 与事件

> 基于 @vue/test-utils v2.x 编写

## 速查

- 传入：挂载选项 `props` / `attrs`
- 更新：`await wrapper.setProps({ ... })`（异步，必须 await）
- 读取：`wrapper.props("key")`
- 事件：`wrapper.emitted("name")` → `[[arg1], [arg2], ...]`
- v-model：注册 `"onUpdate:modelValue"` 回调 + `setProps` 回写

## 传入 props

```ts
const wrapper = mount(Password, {
  props: { minLength: 10 },
});
```

非 prop 的属性用 `attrs`：

```ts
const wrapper = mount(Button, {
  attrs: { disabled: true, "aria-label": "Submit" },
});
```

## 更新 props

`setProps` 是异步的（要等 Vue 重渲染），**必须 await**：

```ts
const wrapper = mount(Show, { props: { show: true } });
expect(wrapper.html()).toContain("Hello");

await wrapper.setProps({ show: false });
expect(wrapper.html()).not.toContain("Hello");
```

## 断言自定义事件

`emitted()` 记录组件 emit 的所有事件，结构是 `{ 事件名: [[一次的参数...], ...] }`：

```ts
const wrapper = mount(Counter);

await wrapper.find("button").trigger("click");
await wrapper.find("button").trigger("click");

const events = wrapper.emitted("increment");
expect(events).toHaveLength(2); // emit 了两次
expect(events[0]).toEqual([1]); // 第 1 次的参数是 [1]
expect(events[1]).toEqual([2]); // 第 2 次的参数是 [2]
```

```ts
// 无参数事件：断言被触发
expect(wrapper.emitted("close")).toBeTruthy();

// 带 payload：取第 1 次触发的第 1 个参数
expect(wrapper.emitted("update")[0][0]).toEqual({ id: 1 });
```

## 表单

```ts
test("提交表单", async () => {
  const wrapper = mount(Form);

  await wrapper.find("input[type=email]").setValue("my@mail.com");
  await wrapper.find("select").setValue("option-1");
  await wrapper.find("input[type=checkbox]").setValue(); // 勾选
  await wrapper.find("button").trigger("click");

  expect(wrapper.emitted("submit")[0][0]).toBe("my@mail.com");
});
```

## 测试 v-model

VTU 没有真实父组件，用注册 `onUpdate:modelValue` 回调 + `setProps` 回写来模拟双向绑定：

```ts
test("v-model 双向绑定", async () => {
  const wrapper = mount(Editor, {
    props: {
      modelValue: "initial",
      "onUpdate:modelValue": (e) => wrapper.setProps({ modelValue: e }),
    },
  });

  await wrapper.find("input").setValue("test");
  expect(wrapper.props("modelValue")).toBe("test");
});
```

多个 v-model 同理，为每个 `onUpdate:xxx` 注册回调：

```ts
const wrapper = mount(CurrencyInput, {
  props: {
    modelValue: 0,
    "onUpdate:modelValue": (e) => wrapper.setProps({ modelValue: e }),
    currency: "USD",
    "onUpdate:currency": (e) => wrapper.setProps({ currency: e }),
  },
});
```
