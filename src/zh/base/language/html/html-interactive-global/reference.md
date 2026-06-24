---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 折叠：`<details>` + `<summary>`，`open` 默认展开；同 `name` 组手风琴（互斥，2024）；`::marker` / `list-style` 改三角
- 对话框：`dialog.showModal()` 模态 / `show()` 非模态 / `close(值)`；`::backdrop` 遮罩；`<form method="dialog">` 提交即关并设 `returnValue`
- 弹层：`popover`（`auto` 点外面关 / `manual` 不自动关）+ `popovertarget`；进顶层、零 JS、`Esc` 关
- 声明式调用：`command` / `commandfor`（`show-modal` / `close` / `toggle-popover`…，自定义以 `--` 开头）——**很新，2025 起，需降级**
- 失活：`inert` 不可点 / 不可聚焦 / 读屏跳过；`showModal()` 自动对背景施加
- 焦点：`tabindex="0"` 入序、`-1` 仅脚本聚焦、正数反模式；`autofocus`；DOM 顺序 = 视觉顺序
- 焦点环：用 `:focus-visible`（仅键盘显示）而非 `:focus`；整组高亮用 `:focus-within`
- 全局属性：`id` / `class` / `data-*` / `hidden` / `title` / `lang` / `dir` / `contenteditable` / `inputmode` / `enterkeyhint` / `inert` / `popover`…
- 移动键盘：`inputmode`（数字/邮箱/网址盘）、`enterkeyhint`（回车键文案）
- ARIA 第一条：能用原生就别用 ARIA；多数语义元素自带隐式角色；「No ARIA is better than bad ARIA」

## 交互元素速查

| 元素 / 属性 | 作用 | 关键点 |
| --- | --- | --- |
| `<details>` / `<summary>` | 原生折叠/展开 | `open` 默认展开；`toggle` 事件 |
| `details name="…"` | 手风琴（互斥分组） | 同名只开一个；不支持则退化为独立折叠 |
| `<dialog>` + `showModal()` | 模态对话框 | 顶层 + `::backdrop` + 背景 `inert` + `Esc` 关 + 焦点收拢 |
| `<dialog>` + `show()` | 非模态对话框 | 不遮挡背景、`Esc` 默认不关 |
| `dialog.close(值)` / `returnValue` | 关闭并回传值 | `<form method="dialog">` 提交即关并设值 |
| `dialog` 的 `cancel` / `close` 事件 | `Esc`/关闭钩子 | `cancel` 可 `preventDefault()` 拦截 |
| `closedby`（`any`/`closerequest`/`none`） | 允许的关闭方式 | 较新，渐进增强 |
| `popover`（`auto`/`manual`/`hint`） | 弹层 | `auto` 支持 light dismiss + 互斥 |
| `popovertarget` / `popovertargetaction` | 弹层触发按钮 | 动作 `show`/`hide`/`toggle`（默认 toggle） |
| `:popover-open` / `::backdrop` | 弹层样式钩子 | 显示时命中 / 背后遮罩 |
| `command` / `commandfor` | 声明式调用者 | 控对话框 + 弹层；**很新，需降级** |
| `inert` | 区域失活 | 不可点/聚焦、移出可访问性树 |

## 全局属性速查

| 属性 | 用途 |
| --- | --- |
| `id` / `class` | 唯一标识 / 类名（CSS、JS 钩子） |
| `data-*` | 自定义数据（JS `element.dataset`） |
| `hidden` | 隐藏（`display:none`）；`until-found` 可被页内查找命中并展开 |
| `title` | 提示气泡（别只靠它放关键信息） |
| `lang` / `dir` | 语言（BCP 47）/ 书写方向（`ltr`/`rtl`/`auto`） |
| `translate` / `spellcheck` | 是否翻译 / 是否拼写检查 |
| `contenteditable` | 可编辑（`true`/`false`/`plaintext-only`） |
| `draggable` | 可拖拽（配拖放 API） |
| `inputmode` | 移动端虚拟键盘类型（`numeric`/`tel`/`email`/`url`…） |
| `enterkeyhint` | 回车键文案（`done`/`go`/`next`/`search`/`send`…） |
| `tabindex` | 焦点序（`0` 入序 / `-1` 仅脚本 / 正数反模式） |
| `autofocus` | 载入/对话框打开时自动聚焦 |
| `inert` | 整片区域失活 |
| `popover` | 把元素变弹层 |
| `accesskey` | 键盘快捷键（坑多，慎用） |
| `role` / `aria-*` | ARIA 语义（优先原生，少用） |
| `autocapitalize` / `writingsuggestions` | 自动大写 / 写作建议（较新） |
| `is` | 自定义内置元素（Web Components） |
| `nonce` | CSP 一次性随机串 |
| `slot` / `part` / `exportparts` | Shadow DOM 插槽 / 部件样式暴露 |
| `itemscope` / `itemtype` / `itemprop`… | 微数据（schema.org） |

## `tabindex` 三类取值速查

| 取值 | 可 `Tab` | 可 `.focus()` | 用途 |
| --- | --- | --- | --- |
| `0` | 是（DOM 序） | 是 | 让自定义组件可键盘聚焦 |
| `-1` | 否 | 是 | 仅供脚本/点击聚焦的目标 |
| 正数 | 是（数字优先序） | 是 | ⚠️ 反模式，避免 |

## `command` 内置值速查

| 目标 | `command` 值 | 等价 JS |
| --- | --- | --- |
| `<dialog>` | `show-modal` / `close` / `request-close` | `showModal()` / `close()` / `requestClose()` |
| 弹层 | `show-popover` / `hide-popover` / `toggle-popover` | `showPopover()` / `hidePopover()` / `togglePopover()` |
| 自定义 | 以 `--` 开头（如 `--archive`） | 在目标上派发 `CommandEvent`（`command` / `source`） |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `<details>` / `<summary>` | ✅ Baseline 广泛可用（2020 起） | 放心用 |
| `details` 的 `name` 手风琴 | 🟢 Baseline 新近可用（2024 起） | 可用；不支持则退化为独立折叠，几乎无害 |
| `<dialog>`（`showModal`/`show`/`close`/`::backdrop`） | ✅ Baseline 广泛可用（2022-03 起） | 放心用 |
| `inert` | ✅ Baseline 广泛可用（2023-04 起） | 放心用 |
| `:focus-visible` | ✅ Baseline 广泛可用（2022-03 起） | 放心用，焦点环首选 |
| Popover API（`popover` / `popovertarget`） | 🟢 Baseline 新近可用（2025-01 起） | 较新；老浏览器弹层不显示，需评估受众或加 JS 兜底 |
| `dialog` 的 `closedby` | 🟡 渐进增强（Chrome 134+ 等） | 渐进增强，不支持回退默认关闭行为 |
| `details::details-content` | 🟡 渐进增强 | 仅做展开动画，不支持则瞬间展开 |
| `hidden="until-found"` | 🟢 较新但已较广支持 | 渐进增强 |
| `contenteditable="plaintext-only"` | 🟢 已广泛可用 | 可用 |
| `command` / `commandfor`（Invoker Commands） | 🟠 **很新，非「广泛可用」**（Chrome/Edge 135、Safari 26.2、Firefox 144，均 2025） | **必须降级**：不支持则按钮无效果，建议 JS 兜底或特性检测 |
| `popover="hint"` / `interestfor`（兴趣调用者） | 🟠 很新 | 渐进增强，不支持回退 `auto`/常规交互 |
| `writingsuggestions` | 🟠 较新 | 渐进增强，不支持则忽略 |

> Baseline 含义：**广泛可用**＝主流浏览器稳定支持多年，可直接用；**新近可用**＝近一两年才在全部主流浏览器齐备，老设备可能不支持；**渐进增强/很新**＝尚未达成跨浏览器一致，务必能降级。以 [webstatus.dev](https://webstatus.dev/) / [caniuse.com](https://caniuse.com/) 实测为准。

## 权威链接

**标准 / 规范**

- [WHATWG HTML Standard — Interactive elements](https://html.spec.whatwg.org/multipage/interactive-elements.html)
- [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) · [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) · [`<summary>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary)
- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) · [HTML 全局属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes) · [`inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert)

**课程 / 指南**

- [web.dev: Learn HTML — Focus](https://web.dev/learn/html/focus)
- [MDN: ARIA — Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles) · [WAI-ARIA basics](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/WAI-ARIA_basics)
- [W3C: ARIA in HTML](https://www.w3.org/TR/html-aria/) · [Using ARIA: Rules of ARIA](https://www.w3.org/TR/using-aria/)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)

## 相关页

- [入门](./getting-started) · [`details` / `summary` 折叠](./guide-line/details-summary) · [`dialog` 模态对话框与 `inert`](./guide-line/dialog-inert)
- [`popover` 与 `command` 调用](./guide-line/popover-command) · [焦点管理](./guide-line/focus-management)
- [全局属性精要](./guide-line/global-attributes) · [HTML 层可访问性](./guide-line/html-a11y)
