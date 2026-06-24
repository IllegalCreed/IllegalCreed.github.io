---
layout: doc
outline: [2, 3]
---

# `dialog` 模态对话框与 `inert`

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `dialog.showModal()`：打开**模态**对话框——渲染到顶层、自动画 `::backdrop` 遮罩、其余页面自动 `inert`、`Esc` 可关、焦点收进对话框
- `dialog.show()`：打开**非模态**对话框（不遮挡背景、`Esc` 默认不关）；`dialog.close(值)`：关闭并设 `returnValue`
- 别直接拿 `open` 属性当模态用——它只能开出非模态，且不带焦点管理 / 遮罩；模态必须走 `showModal()`
- `<form method="dialog">`：表单提交即**关闭对话框**（不发请求），并把所点按钮的 `value` 写入 `dialog.returnValue`
- `::backdrop`：仅 `showModal()` 才有的背景遮罩，可染色 / 模糊；`dialog:open::backdrop` 选中它
- 焦点：打开后焦点落在第一个可聚焦元素；用 `autofocus` 显式指定落点；关闭后焦点应回到触发按钮
- `cancel` 事件：按 `Esc` 时先触发（可 `preventDefault()` 阻止关闭）；`close` 事件：关闭后触发
- `closedby` 属性：`any`（点外面也能关）/ `closerequest`（仅 `Esc` 等）/ `none`（仅代码关）；较新，渐进增强
- `inert`：让一片区域不可点 / 不可聚焦 / 读屏器跳过 / 查找跳过；`showModal()` 已自动对背景施加（`inert` Baseline 2023）
- 可访问：`dialog` 隐式 `role="dialog"`，`showModal()` 时自动 `aria-modal="true"`（Baseline 2022）；务必提供显式「关闭」按钮

## 三个方法：`showModal` / `show` / `close`

`<dialog>` 有两种打开方式，差别很大：

```html
<button id="openBtn">打开对话框</button>

<dialog id="dlg">
  <h2 id="dlgTitle">确认操作</h2>
  <p>确定要发布这篇文章吗？</p>
  <button id="closeBtn" autofocus>关闭</button>
</dialog>

<script>
  const dlg = document.getElementById("dlg");
  // 模态：遮挡并失活背景，Esc 可关，焦点收进对话框
  document.getElementById("openBtn").addEventListener("click", () => dlg.showModal());
  document.getElementById("closeBtn").addEventListener("click", () => dlg.close());
</script>
```

| 方法 | 模态？ | 背景 | `Esc` 关闭 | `::backdrop` |
| --- | --- | --- | --- | --- |
| `showModal()` | 是 | 自动 `inert`（不可交互） | 默认可 | 有 |
| `show()` | 否 | 可正常交互 | 默认不可 | 无 |
| `close(返回值?)` | — | 关闭对话框，可选地设置 `returnValue` | — | — |

::: warning 别用 `open` 属性手搓模态
`<dialog open>` 只能渲染出**非模态**对话框——没有遮罩、不失活背景、不接管焦点、`Esc` 不关闭。真正的模态体验**只能**由 `showModal()` 提供。所以规范与 MDN 都建议：用方法（`show()` / `showModal()`）打开对话框，而不是直接切 `open` 属性。
:::

## `::backdrop`：背景遮罩

只有用 `showModal()` 打开时，浏览器才会在对话框**之下**铺一层 `::backdrop`。它默认是半透明黑，可自由定制（染色、模糊背景）：

```css
dialog::backdrop {
  background: rgb(0 0 0 / 0.5);
  backdrop-filter: blur(3px); /* 模糊背后页面 */
}
```

非模态对话框（`show()`）没有 `::backdrop`——这也是「模态 vs 非模态」最直观的视觉差别。

## `method="dialog"`：表单即关闭

把表单的 `method` 设为 `dialog`，是 `<dialog>` 最优雅的用法：**提交表单不会发请求，而是关闭对话框**，并把「触发提交的那个按钮」的 `value` 写入 `dialog.returnValue`：

```html
<dialog id="confirmDlg">
  <form method="dialog">
    <p>是否保存更改？</p>
    <button value="cancel">不保存</button>
    <button value="save" autofocus>保存</button>
  </form>
</dialog>

<script>
  const dlg = document.getElementById("confirmDlg");
  dlg.addEventListener("close", () => {
    // returnValue 就是用户点的那个按钮的 value
    if (dlg.returnValue === "save") {
      console.log("用户选择了保存");
    }
  });
</script>
```

要点：

- 表单控件的值会被**保存但不提交**，页面不刷新；
- 单个按钮也可用 `formmethod="dialog"` 覆盖所属表单的 `method`；
- 按 `Esc` 关闭时**不会**更新 `returnValue`（它保持上一次的值）。

## 焦点管理

模态对话框最大的价值之一就是**自动接管焦点**：

- 打开时，焦点会落到对话框内**第一个可聚焦元素**；用 `autofocus` 可显式指定让谁先获得焦点（如「关闭」或最常用的按钮）；
- 打开期间，焦点被「困」在对话框内，`Tab` 不会跑到背后已 `inert` 的页面；
- **关闭后，你应主动把焦点还给触发它的按钮**（这一步浏览器不全包，需自己处理），否则键盘用户会「丢失」焦点位置：

```js
let lastTrigger = null;
openBtn.addEventListener("click", () => {
  lastTrigger = openBtn;
  dlg.showModal();
});
dlg.addEventListener("close", () => lastTrigger?.focus());
```

注意：**不要**给 `<dialog>` 本身加 `tabindex`——它不是交互元素，加了反而干扰。

## `Esc` 与 `cancel` 事件

模态对话框默认支持 `Esc` 关闭。按 `Esc` 时会先派发 `cancel` 事件，可 `preventDefault()` 拦下来阻止关闭（例如有未保存内容时二次确认）：

```js
dlg.addEventListener("cancel", (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault(); // 阻止 Esc 关闭
    alert("请先保存或放弃更改");
  }
});
```

`close` 事件则在对话框真正关闭后触发（无论由 `close()`、表单提交还是 `Esc` 引起）。规范还提供 `dialog.requestClose()` 方法：它会先触发 `cancel`（可被取消），与「点击关闭按钮」语义一致。

## `closedby`：控制关闭方式（较新）

`closedby` 属性声明对话框允许被哪些方式关闭：

| 取值 | 含义 |
| --- | --- |
| `any` | 点击对话框外部（light dismiss）、`Esc`、或代码都可关 |
| `closerequest` | `Esc` 等「关闭请求」或代码可关，但点外面**不**关 |
| `none` | 只有代码（按钮 / `close()`）能关 |

不写 `closedby` 时：`showModal()` 默认相当于 `closerequest`，`show()` / `open` 相当于 `none`。

::: tip Baseline 现状
`closedby` 是较新的增量特性，支持度低于 `<dialog>` 本体（Chrome 134+ 起，其它浏览器陆续跟进）。把它当**渐进增强**：不支持的浏览器忽略该属性、退回默认行为，不影响对话框可用。
:::

## `inert`：让一片区域失活

`inert` 是个全局**布尔属性**，给某元素加上后，它**及其所有后代**整体失活：

- 不可点击（`click` 不触发）、不可聚焦（移出 Tab 序）；
- 从**可访问性树**移除（读屏器读不到）；
- 浏览器「页内查找」（Ctrl/Cmd+F）跳过它；
- 文本不可选中、`contenteditable` 不可编辑。

```html
<!-- 加载中时，把整个表单失活 -->
<form inert>
  <input name="email" />
  <button>提交</button>
</form>
```

典型用途：抽屉/侧边栏收起时失活其内容、自定义弹层背后的页面、加载态下禁用一片区域。

**和 `dialog` 的关系**：`showModal()` 会**自动**把对话框之外的整页设为 `inert`——这正是模态「背景点不动」的底层机制。所以用原生 `dialog` 时你**无需手动**加 `inert`；只有自己用 `div` 搓弹层时才需要。

::: warning `inert` 没有默认样式
`inert` 不会让内容变灰或有任何视觉提示。如果一片**仍然可见**的内容被失活，用户会困惑「为什么点不动」。务必自己加 CSS（如 `opacity` 降低）明示其失活状态；想失活**单个**控件时，优先用 `disabled` 而非 `inert`。
:::

## 可访问性

- `<dialog>` 隐式 `role="dialog"`；`showModal()` 时浏览器自动加 `aria-modal="true"`，`show()` 时为 `false`；
- 用 `aria-labelledby` 指向对话框标题，给读屏器一个可读的名字：`<dialog aria-labelledby="dlgTitle">`；
- **务必提供一个显式的「关闭」按钮**——这是确保所有用户（尤其键盘与读屏器用户）都能退出对话框的最稳妥方式；
- 若是警告类对话框，可把 `role` 改为 `alertdialog`。

## 小结

`dialog` 用 `showModal()` 一行就拿到「遮罩 + 背景失活 + 焦点收拢 + `Esc` 关闭」的完整模态，`inert` 则是这套失活机制的通用底层。下一页看更轻量、连 JS 都省掉的弹层——[`popover` 与 `command` 调用](./popover-command)。
