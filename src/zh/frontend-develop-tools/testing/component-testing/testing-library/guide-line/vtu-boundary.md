---
layout: doc
outline: [2, 3]
---

# 与 VTU 的边界

> 基于 @testing-library/vue v8 编写

## 速查

- 注入：`render(C, { global: { plugins: [pinia, router] } })`（透传 VTU 的 global）
- TL：用户中心、隐藏内部、行为测试；VTU：组件中心、暴露内部、契约测试
- 二者互补：测用户交互用 TL，测 emitted / props 合约用 VTU
- a11y：`jest-axe` / `vitest-axe` 做自动可访问性扫描

## render 注入依赖

`render` 的 `global` 选项与 [Vue Test Utils](../../vue-test-utils/) 完全一致，可注入 Pinia / Vue Router：

```ts
import { render, screen } from "@testing-library/vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";

render(App, {
  props: { id: 1 },
  global: { plugins: [createPinia(), router] },
});

// 路由初始导航异步，用 findBy 等待
expect(await screen.findByText("首页内容")).toBeInTheDocument();
```

`render` 还有 `container`（自定义挂载容器，如 `<table>` 场景）、`baseElement` 选项。

## TL vs VTU

| 维度 | Testing Library | Vue Test Utils |
| ---- | --------------- | -------------- |
| 哲学 | 用户中心、操作 DOM | 组件中心、访问内部 |
| 查询 | 语义（role/label/text） | CSS 选择器、组件引用 |
| 内部访问 | **主动隐藏** vm/props | `wrapper.vm` / `props()` / `emitted()` 暴露 |
| 交互 | `user-event` / `fireEvent` | `trigger` / `setValue` |
| 插槽 | 较弱 | 完整支持 |
| 适合 | 集成 / 行为测试 | 单元 / 契约测试 |

## 互补使用

```ts
// 验证用户行为 → TL
test("点击提交后显示成功", async () => {
  const user = userEvent.setup();
  render(Form);
  await user.click(screen.getByRole("button", { name: "提交" }));
  expect(screen.getByText("成功")).toBeInTheDocument();
});

// 验证组件契约（emitted 事件）→ VTU
import { mount } from "@vue/test-utils";
test("emit submit 带正确 payload", async () => {
  const wrapper = mount(Form);
  await wrapper.find("button").trigger("click");
  expect(wrapper.emitted("submit")?.[0]).toEqual([{ username: "" }]);
});
```

TL 自身也有 `emitted()`（来自 VTU 别名），需要时可用：

```ts
const { emitted } = render(MyComponent);
await fireEvent.click(screen.getByRole("button"));
expect(emitted()).toHaveProperty("myEvent");
```

::: tip 该用哪个
关注"用户能否完成操作、看到什么"——用 TL；关注"组件 props/emits/slots 契约"——用 VTU。同一项目可混用。
:::

## 可访问性测试（延伸）

`getByRole` 已天然推动可访问的 HTML；要系统性扫描 WCAG 规则，加 `jest-axe` / `vitest-axe`：

```ts
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

test("无 a11y 违规", async () => {
  const { container } = render(MyForm);
  expect(await axe(container)).toHaveNoViolations();
});
```
