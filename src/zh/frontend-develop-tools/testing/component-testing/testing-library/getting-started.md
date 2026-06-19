---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 @testing-library/vue v8 + @testing-library/user-event v14 编写

## 速查

- 安装：`pnpm add -D @testing-library/vue @testing-library/user-event @testing-library/jest-dom`
- jest-dom：setupFiles 里 `import "@testing-library/jest-dom/vitest"`
- 渲染：`render(Component, { props, global })` + 用全局 `screen` 查询
- 查询优先级：`getByRole` > `getByLabelText` > `getByText` > `getByTestId`
- 交互：`const user = userEvent.setup()` → `await user.click(...)` / `user.type(...)`
- 异步：`await screen.findByText(...)` / `waitFor(...)`
- 断言：`expect(el).toBeInTheDocument()` / `toHaveValue` / `toBeDisabled`

## 核心哲学

> The more your tests resemble the way your software is used, the more confidence they can give you.

测试应操作 **DOM 节点**、模拟**用户实际使用方式**，而非测组件的内部 state / 方法 / 生命周期。这样重构组件实现（不改功能）时，测试不会无谓地碎掉。

## 安装

```bash
pnpm add -D @testing-library/vue @testing-library/user-event @testing-library/jest-dom
```

在 Vitest setup 文件里引入 jest-dom 断言扩展：

```ts
// vitest.config.ts → test: { setupFiles: ["./vitest.setup.ts"] }
// vitest.setup.ts:
import "@testing-library/jest-dom/vitest";
```

## 第一个测试

```ts
import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import MyButton from "./MyButton.vue";

test("点击按钮后显示成功", async () => {
  const user = userEvent.setup(); // v14 推荐：render 前 setup
  render(MyButton);

  // 用「角色 + 名称」定位（最推荐）
  await user.click(screen.getByRole("button", { name: /提交/i }));

  expect(screen.getByText("提交成功")).toBeInTheDocument();
});
```

## render 与 screen

`render(Component, options)` 把组件挂载到 `document.body`；查询推荐用全局 `screen` 而非解构返回值：

```ts
render(MyComponent, {
  props: { msg: "hi" },
  global: { plugins: [pinia, router] }, // 注入同 VTU 的 global
});

screen.getByRole("button"); // 推荐
```

`render` 返回值还有 `debug()`（打印 DOM）、`rerender(props)`、`emitted()`（VTU 别名）、`unmount()` 等。

## 查询优先级

按"对用户的可访问程度"从高到低选查询，详见 [查询](./guide-line/queries.md)：

1. `getByRole`（几乎一切：按钮、输入框、标题、链接）
2. `getByLabelText`（表单字段，最贴近填表行为）
3. `getByText`（非交互元素的文本）
4. `getByTestId`（实在没法语义匹配时的兜底）

## 用 user-event 交互

`user-event` 模拟完整真实交互（焦点、按键序列、可见性检查），比 `fireEvent` 更接近用户：

```ts
const user = userEvent.setup();
render(Form);

await user.type(screen.getByLabelText("用户名"), "Alice");
await user.click(screen.getByRole("button", { name: "登录" }));
expect(screen.getByLabelText("用户名")).toHaveValue("Alice");
```

详见 [user-event](./guide-line/user-event.md)。

## 下一步

- [查询](./guide-line/queries.md)：优先级金字塔、`getByRole` 细节、`getBy`/`queryBy`/`findBy` 变体
- [user-event](./guide-line/user-event.md)：`setup` + `click`/`type`/`keyboard`，与 `fireEvent` 的区别
- [异步与断言](./guide-line/async-matchers.md)：`findBy`/`waitFor`、`fireEvent.update`、jest-dom 断言扩展
- [与 VTU 的边界](./guide-line/vtu-boundary.md)：注入 Pinia/Router、何时用 TL / 何时用 VTU、jest-axe
