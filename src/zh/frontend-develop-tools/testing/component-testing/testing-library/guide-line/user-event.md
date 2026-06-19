---
layout: doc
outline: [2, 3]
---

# user-event

> 基于 @testing-library/user-event v14 编写

## 速查

- v14 推荐：`const user = userEvent.setup()`（在 `render` 前）
- 点击：`await user.click(el)`；输入：`await user.type(el, "文本")`
- 清空：`await user.clear(el)`；键盘：`await user.keyboard("{Enter}")`
- 下拉：`await user.selectOptions(el, ["值"])`；上传：`await user.upload(el, file)`
- 都要 `await`；与 `fireEvent` 区别：模拟完整交互序列 + 可见性检查

## 与 fireEvent 的区别

`fireEvent` 是低层 API，只派发单个 DOM 事件；`user-event` 是高层，模拟**完整真实交互**：

| 维度       | `fireEvent`              | `user-event`                              |
| ---------- | ------------------------ | ----------------------------------------- |
| 点击       | 只派发 `click`           | `pointerover`→…→`mousedown`→`mouseup`→`click` 全序列 |
| 输入       | 只派发 `input` / `change`| 先点击获焦 → 逐字符 `keydown`/`input`/`keyup` |
| 可见性检查 | 无                       | **有**：不能点隐藏元素、不能在 disabled 输入框输入 |
| 推荐度     | 边缘场景兜底             | **日常首选**                              |

## setup 模式（v14）

v14 起推荐先 `setup()` 创建实例（共享输入设备状态），再 `render`：

```ts
import userEvent from "@testing-library/user-event";

test("交互", async () => {
  const user = userEvent.setup(); // render 之前
  render(MyForm);

  await user.click(screen.getByRole("button", { name: "打开" }));
});
```

## 常用方法

```ts
const user = userEvent.setup();

// 点击
await user.click(screen.getByRole("button"));
await user.dblClick(el);

// 输入：点击获焦后逐字符键入
const input = screen.getByLabelText("用户名");
await user.type(input, "Alice");
expect(input).toHaveValue("Alice");

// 清空：全选 → 删除
await user.clear(input);

// 下拉选择
await user.selectOptions(screen.getByRole("listbox"), ["选项A"]);

// 文件上传
const file = new File(["内容"], "a.png", { type: "image/png" });
await user.upload(screen.getByLabelText(/上传/i), file);
```

## 键盘记号系统

`user.keyboard()` 做纯键盘操作（不触发 click）：

```ts
await user.keyboard("hello"); // 逐字母键入
await user.keyboard("{Enter}"); // 特殊键用 {Key}
await user.keyboard("{Backspace}{Tab}");

// 组合键：{Key>} 按住不放，{/Key} 抬起
await user.keyboard("{Shift>}A{/Shift}"); // Shift+A → 大写 A
await user.keyboard("{Control>}a{/Control}"); // Ctrl+A 全选
```

## setup 选项

```ts
const user = userEvent.setup({
  delay: null, // null=立即（默认）；数字=每事件间隔 ms（模拟慢速输入）
  pointerEventsCheck: 0, // 0=禁用指针事件检查（性能更好）
});
```

::: tip Vue 里 fireEvent 是异步的
若用 `fireEvent`（而非 user-event），Vue Testing Library 把它重导出为**异步**（返回 Promise），务必 `await`；v-model 更新用专门的 `await fireEvent.update(input, "新值")`。详见 [异步与断言](./async-matchers.md)。
:::
