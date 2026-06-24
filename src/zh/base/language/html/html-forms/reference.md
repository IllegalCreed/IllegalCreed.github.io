---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 表单容器：`<form action method enctype target novalidate>`；数据靠各控件的 **`name`** 提交
- `method`：`get`（查询，拼 URL）/ `post`（敏感、有副作用、上传）/ `dialog`（关 `<dialog>`）
- `enctype`：`application/x-www-form-urlencoded`（默认）/ `multipart/form-data`（**文件上传**）/ `text/plain`
- `input` 22 种类型，`type` 决定 UI + 校验 + 移动端键盘；默认 `text`
- 每控件必有 `<label>`（首选 `for` + `id`）；单选 / 复选组用 `<fieldset>` + `<legend>`
- 约束：`required` / `pattern` / `min` / `max` / `step` / `minlength` / `maxlength` + `type` 校验
- API：`el.validity`（`ValidityState`）/ `checkValidity()` / `reportValidity()` / `setCustomValidity()`
- 样式优先 `:user-invalid` / `:user-valid`（交互后才生效），别用一上来就标红的 `:invalid`
- 移动端：`type` → `inputmode` → `autocomplete`（区分 `new-password` / `current-password`）→ `enterkeyhint`
- **红线**：客户端校验仅为体验，服务器端必须再校验一次

## `<form>` 属性速查

| 属性 | 用途 |
| --- | --- |
| `action` | 提交到的 URL（省略=当前页） |
| `method` | `get` / `post` / `dialog` |
| `enctype` | 编码方式（仅 `post` 有意义） |
| `target` | 响应打开位置：`_self` / `_blank` / `_top` / `_parent` |
| `name` | 表单名（`document.forms`） |
| `novalidate` | 跳过约束校验 |
| `autocomplete` | 全表单自动填充开关（`on` / `off`） |
| `accept-charset` | 提交字符编码（现代固定 UTF-8） |

## `<input type>` 速查

| `type` | 作用 | 关键属性 |
| --- | --- | --- |
| `text` | 单行文本（默认） | `maxlength` / `pattern` / `list` |
| `search` | 搜索框 | 同 `text` |
| `email` | 邮箱（校验格式） | `multiple` / `required` |
| `url` | 网址（校验格式） | `pattern` |
| `tel` | 电话（**不校验**） | `pattern`（自定义） |
| `password` | 密码（遮蔽） | `minlength` / `autocomplete` |
| `number` | 数值（步进器） | `min` / `max` / `step` |
| `range` | 滑块 | `min` / `max` / `step` |
| `date` `time` `datetime-local` `month` `week` | 日期时间 | `min` / `max` / `step` |
| `color` | 取色器 | `value`（`#rrggbb`） |
| `file` | 选文件 | `accept` / `multiple` / `capture` |
| `checkbox` | 复选（多选） | `checked` / `value` |
| `radio` | 单选（同 `name` 互斥） | `checked` / `value` |
| `hidden` | 不可见，仍提交 | `value` |
| `submit` `reset` `button` | 提交 / 重置 / 普通按钮 | `value` / `form*` |
| `image` | 图片提交按钮 | `src` / `alt` |

## 通用 / 校验属性速查

| 属性 | 作用 |
| --- | --- |
| `name` | 提交字段名（**无则不提交**） |
| `value` | 值 / 初始值 |
| `required` | 必填 → `valueMissing` |
| `pattern` | 正则（匹配整值）→ `patternMismatch` |
| `min` / `max` | 范围 → `rangeUnderflow` / `rangeOverflow` |
| `step` | 步长 → `stepMismatch` |
| `minlength` / `maxlength` | 长度 → `tooShort` / `tooLong` |
| `placeholder` | 占位提示（不替代 `label`） |
| `disabled` | 禁用，灰显，**不提交** |
| `readonly` | 只读，**仍提交** |
| `autofocus` | 加载即聚焦（每页一个） |
| `autocomplete` | 自动填充字段名 |
| `inputmode` | 虚拟键盘提示（不校验） |
| `enterkeyhint` | 回车键文案 |
| `list` | 关联 `<datalist>` 的 `id` |
| `multiple` | 多值（`email` / `file` / `select`） |
| `form` | 用 `id` 关联到表单 |
| `formaction` / `formmethod` / `formenctype` / `formtarget` / `formnovalidate` | 提交按钮覆盖 `<form>` 设置 |

## 校验状态伪类速查

| 伪类 | 匹配 |
| --- | --- |
| `:required` / `:optional` | 有 / 无 `required` |
| `:valid` / `:invalid` | 满足 / 不满足约束（页面一加载即生效） |
| `:user-valid` / `:user-invalid` | 同上，但**仅用户交互后**生效（推荐） |
| `:in-range` / `:out-of-range` | 在 / 不在 `min`–`max` |
| `:placeholder-shown` | 正显示占位符 |
| `:read-only` / `:read-write` | 只读 / 可写 |
| `:checked` / `:default` | 选中 / 初始选中 |
| `:enabled` / `:disabled` | 可用 / 禁用 |

## Constraint Validation API 速查

`ValidityState`（`el.validity`）的布尔属性：

| 属性 | 含义 |
| --- | --- |
| `valueMissing` | `required` 为空 |
| `typeMismatch` | 不符 `type`（邮箱 / URL） |
| `patternMismatch` | 不匹配 `pattern` |
| `tooLong` / `tooShort` | 超 `maxlength` / 不足 `minlength` |
| `rangeOverflow` / `rangeUnderflow` | 超 `max` / 低于 `min` |
| `stepMismatch` | 不符 `step` |
| `badInput` | 无法转换的输入 |
| `customError` | 设过 `setCustomValidity(非空)` |
| `valid` | 全部通过 |

方法 / 属性：`checkValidity()`（静默）· `reportValidity()`（提示）· `setCustomValidity(msg)`（设 / 清错误）· `validationMessage`（提示文案）· `willValidate`（是否参与校验）· `invalid` 事件。

## `autocomplete` 常用字段名速查

| 类别 | token |
| --- | --- |
| 姓名 | `name` / `given-name` / `family-name` / `additional-name` / `nickname` |
| 账号 | `username` / `new-password` / `current-password` / `one-time-code` |
| 联系 | `email` / `tel` / `tel-country-code` / `tel-national` / `url` / `impp` |
| 地址 | `street-address` / `address-line1`～`3` / `address-level1`（省/州）/ `address-level2`（市）/ `postal-code` / `country` / `country-name` |
| 支付 | `cc-name` / `cc-number` / `cc-exp` / `cc-exp-month` / `cc-exp-year` / `cc-csc` / `cc-type` |
| 前缀 | `section-*` / `shipping` / `billing` / `home` / `work` / `mobile` /（末尾）`webauthn` |

## `inputmode` / `enterkeyhint` 速查

- `inputmode`：`text`（默认）/ `none` / `numeric` / `decimal` / `tel` / `email` / `url` / `search`
- `enterkeyhint`：`enter` / `done` / `go` / `next` / `previous` / `search` / `send`

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| 内置约束校验（`required` / `pattern` / `min` / `max`…） | ✅ Baseline 广泛可用 | 放心用 |
| Constraint Validation API（`setCustomValidity` 等） | ✅ Baseline 广泛可用 | 放心用 |
| `:user-valid` / `:user-invalid` | ✅ Baseline（2023 起广泛） | 优先于 `:invalid` |
| `autocomplete` 字段名 | ✅ 广泛可用 | 放心用，填准 token |
| `inputmode` / `enterkeyhint` | ✅ 广泛可用 | 放心用（仅移动端可见效果） |
| `<datalist>` | ✅ 广泛可用 | 放心用（各类型支持度略有差异） |
| `one-time-code` 自动填充 | 🟡 渐进增强 | iOS / Android 支持，桌面忽略 |
| 可定制 `<select>`（`appearance: base-select`） | 🟠 较新 | 查 Baseline，渐进增强 |
| `<input type="checkbox" switch>` | 🟠 实验性 | 谨慎，需降级 |

## 权威链接

**标准 / 规范**

- [WHATWG HTML Standard — Forms](https://html.spec.whatwg.org/multipage/forms.html)
- [MDN: `<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) · [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) · [`<select>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select) · [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)
- [MDN: Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) · [`ValidityState`](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
- [MDN: `autocomplete` 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) · [`inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)

**课程 / 指南**

- [web.dev: Learn HTML — Forms](https://web.dev/learn/html/forms)
- [MDN: Web forms（学习路径）](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms)
- [MDN: Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)

## 相关页

- [入门](./getting-started) · [表单提交机制](./guide-line/form-submission) · [`input` 类型全谱](./guide-line/input-types)
- [`label` / `fieldset` 与可访问关联](./guide-line/labels-fieldset) · [选择类控件](./guide-line/select-controls)
- [约束校验](./guide-line/constraint-validation) · [自动填充与移动端体验](./guide-line/autofill-mobile)
