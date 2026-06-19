---
layout: doc
outline: [2, 3]
---

# 异步与断言

> 基于 @testing-library/vue v8 编写

## 速查

- 等元素出现：`await screen.findByText(...)`（内置 waitFor）
- 等断言通过：`await waitFor(() => expect(...).toBe(...))`（回调抛错才重试）
- 等元素消失：`await waitForElementToBeRemoved(() => screen.queryByText("加载中"))`
- v-model 更新：`await fireEvent.update(input, "新值")`
- jest-dom：`toBeInTheDocument` / `toBeVisible` / `toHaveValue` / `toBeDisabled` / `toHaveClass`

## findBy：等异步元素出现

`findBy` = `getBy` + `waitFor`，默认超时 1000ms、每 50ms 轮询：

```ts
const msg = await screen.findByText("加载完成");
const items = await screen.findAllByRole("listitem");
await screen.findByText("慢加载", {}, { timeout: 3000 }); // 自定义超时
```

## waitFor：等断言通过

回调里的断言**抛出错误**才会重试（返回 falsy 不够）：

```ts
import { waitFor } from "@testing-library/vue";

await waitFor(() => {
  expect(screen.getByText("异步内容")).toBeInTheDocument();
});
await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(1), {
  timeout: 2000,
  interval: 100,
});
```

## waitForElementToBeRemoved：等元素消失

元素必须**已存在**才能调用；推荐传 callback 避免同步查询抛错：

```ts
await waitForElementToBeRemoved(() => screen.queryByText("加载中..."));
```

## Vue 里的 fireEvent

Vue Testing Library 把 `fireEvent` 重导出为**异步**（Vue DOM 更新是异步的），务必 `await`；v-model 用专门的 `fireEvent.update`：

```ts
import { fireEvent } from "@testing-library/vue";

await fireEvent.click(button);
await fireEvent.update(screen.getByLabelText("用户名"), "Alice"); // v-model
```

> 日常交互更推荐 [user-event](./user-event.md)；`fireEvent` 用于 user-event 未覆盖的边缘场景。

## jest-dom 断言扩展

`import "@testing-library/jest-dom"` 后获得语义化断言：

| matcher | 说明 |
| ------- | ---- |
| `toBeInTheDocument()` | 元素在文档中 |
| `toBeVisible()` | 元素可见 |
| `toBeDisabled()` / `toBeEnabled()` | 表单元素禁用 / 可用 |
| `toHaveValue(v)` | input/select/textarea 的值 |
| `toHaveTextContent(t)` | 文本内容 |
| `toHaveClass(c)` | 含某 class |
| `toHaveAttribute(a, v?)` | 含某属性 |
| `toBeChecked()` | checkbox/radio 选中 |
| `toBeRequired()` | 必填字段 |
| `toHaveFocus()` | 当前获焦 |

```ts
import "@testing-library/jest-dom";

test("表单状态", async () => {
  const user = userEvent.setup();
  render(LoginForm);
  const btn = screen.getByRole("button", { name: "登录" });

  expect(btn).toBeDisabled();
  expect(screen.queryByText("错误")).not.toBeInTheDocument();

  await user.type(screen.getByLabelText("用户名"), "Alice");
  expect(btn).toBeEnabled();
});
```
