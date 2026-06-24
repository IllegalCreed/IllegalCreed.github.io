---
layout: doc
outline: [2, 3]
---

# 约束校验

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 内置约束属性：`required` / `pattern` / `min` / `max` / `step` / `minlength` / `maxlength`，以及 `type="email|url"` 的类型校验
- 校验**只在提交时**（或调用 API 时）触发；不通过则**阻止提交**并弹原生提示
- `pattern` 是 JS 正则、需匹配**整个值**（无须写 `^…$`），适用于 `text/search/url/tel/email/password`
- 状态伪类：`:valid` / `:invalid` / `:required` / `:optional` / `:in-range` / `:out-of-range` / `:placeholder-shown`
- `:user-valid` / `:user-invalid`：仅在**用户交互后**才生效，体验远好于一上来就标红
- `ValidityState`（`el.validity`）：`valueMissing` / `typeMismatch` / `patternMismatch` / `tooLong` / `tooShort` / `rangeUnderflow` / `rangeOverflow` / `stepMismatch` / `badInput` / `customError` / `valid`
- API：`checkValidity()`（静默查）、`reportValidity()`（查并提示）、`setCustomValidity(msg)`（设自定义错误 / 清空）
- 其它：`el.validationMessage`（当前提示文案）、`el.willValidate`（是否参与校验）、`invalid` 事件
- 关校验：`<form novalidate>` 或提交按钮 `formnovalidate`
- **铁律**：客户端校验只为体验，**服务器端必须再校验一次**——前端可被绕过

## 内置约束：不写 JS 就能校验

HTML 自带一套**约束校验**：在控件上声明几个属性，浏览器就会在用户提交时自动检查，不通过就拦下提交并给出原生提示气泡，全程无需 JavaScript。

| 属性 | 作用 | 适用控件 | 违反时的 `ValidityState` |
| --- | --- | --- | --- |
| `required` | 必填 / 必选 | 几乎所有输入、`select`、`textarea`、`checkbox`、`radio`、`file` | `valueMissing` |
| `type="email"` / `"url"` | 邮箱 / URL 格式 | 对应 `input` | `typeMismatch` |
| `pattern` | 正则匹配 | `text/search/url/tel/email/password` | `patternMismatch` |
| `min` / `max` | 数值 / 日期上下限 | `number/range` + 日期时间类型 | `rangeUnderflow` / `rangeOverflow` |
| `step` | 步长粒度 | `number/range` + 日期时间类型 | `stepMismatch` |
| `minlength` / `maxlength` | 文本长度（UTF-16 码元） | `text/search/url/tel/email/password`、`textarea` | `tooShort` / `tooLong` |

```html
<form>
  <input type="email" name="email" required />
  <input type="text" name="zip" pattern="\d{6}" title="请输入 6 位邮编" required />
  <input type="number" name="qty" min="1" max="99" step="1" />
  <input type="password" name="pwd" minlength="8" required />
  <button type="submit">提交</button>
</form>
```

::: tip pattern 的两个细节
① `pattern` 用 JavaScript 正则语法，且**隐式匹配整个值**——不用自己加 `^` 和 `$`。② 配合 `title` 写一句说明，浏览器会在提示里带上它，告诉用户「正确格式长什么样」。注意 `g` / `i` / `m` 等标志在此处不生效。
:::

::: warning minlength/maxlength 只校验「用户输入」
`minlength` / `maxlength` 只对用户键入的值校验，**对脚本通过 `.value` 赋的值不重新校验**。另外 `maxlength` 会直接截断、让用户「打不进去字」，体验可能比提交时报错更糟——长度限制要不要用 `maxlength`，按场景权衡。
:::

## 用 CSS 反映校验状态

一组伪类让你按校验状态给控件上色：

| 伪类 | 匹配 |
| --- | --- |
| `:required` / `:optional` | 有 / 无 `required` 的控件 |
| `:valid` / `:invalid` | 当前满足 / 不满足所有约束 |
| `:in-range` / `:out-of-range` | 数值在 / 不在 `min`–`max` 范围内 |
| `:placeholder-shown` | 正在显示 `placeholder`（即还没输入） |
| `:user-valid` / `:user-invalid` | 同 `:valid`/`:invalid`，但**仅用户交互后**才生效 |

```css
/* 仅在用户动过这个字段、且确实出错后才标红——不会一进页面就满屏红 */
input:user-invalid {
  border-color: #dc2626;
}
input:user-valid {
  border-color: #16a34a;
}
```

::: tip 优先用 :user-invalid 而非 :invalid
`:invalid` 在页面**一加载**就对所有空的必填项生效——用户还没填，整张表单就标红，体验很差。`:user-invalid`（及 `:user-valid`）只在用户**与该控件交互过之后**才生效，是现代表单校验样式的首选。它已是 Baseline 广泛可用。
:::

## Constraint Validation API：用 JS 精细控制

每个表单控件都暴露一套校验 API，让你在 JS 里读状态、定制行为。

### `ValidityState`：到底错在哪

`el.validity` 返回一个 `ValidityState` 对象，它的布尔属性精确说明「错在哪一类」：

| 属性 | 含义 |
| --- | --- |
| `valueMissing` | `required` 却为空 |
| `typeMismatch` | 不符合 `type`（如非法邮箱 / URL） |
| `patternMismatch` | 不匹配 `pattern` |
| `tooLong` / `tooShort` | 超出 `maxlength` / 不足 `minlength` |
| `rangeOverflow` / `rangeUnderflow` | 超出 `max` / 低于 `min` |
| `stepMismatch` | 不符合 `step` |
| `badInput` | 浏览器无法转换的输入（如 number 里输入字母） |
| `customError` | 调用过 `setCustomValidity(非空)` |
| `valid` | 以上全不违反时为 `true` |

```js
const email = document.querySelector("#email");
if (email.validity.valueMissing) {
  console.log("邮箱必填");
} else if (email.validity.typeMismatch) {
  console.log("邮箱格式不对");
}
```

### 三个核心方法

```js
// 1) checkValidity()：静默检查，返回 true/false，不打扰用户
const ok = form.checkValidity();

// 2) reportValidity()：检查 + 把错误以原生气泡提示给用户（并聚焦首个错误项）
form.reportValidity();

// 3) setCustomValidity(msg)：设一条自定义错误（非空=出错；空串=清除错误）
input.setCustomValidity("两次输入的密码不一致");
input.setCustomValidity(""); // 校验通过后务必清空，否则会一直处于 invalid
```

- `checkValidity()` / `reportValidity()` 既能在单个控件上调，也能在整个 `<form>` 上调；
- ⚠️ **`form.submit()` 不会触发校验**——若想以编程方式提交又保留校验，应触发提交按钮的点击，或先 `reportValidity()` 再决定；
- 其它常用：`el.validationMessage`（当前会显示的提示文案）、`el.willValidate`（该控件是否参与校验，`disabled` / `readonly` 等会使其为 `false`）。

### 自定义校验：跨字段 / 业务规则

内置约束管不了的规则（两字段相等、依国家变化的邮编格式等），用 `setCustomValidity()`：

```js
const country = document.querySelector("#country");
const postal = document.querySelector("#postal");

// 不同国家的邮编正则与提示
const rules = {
  cn: [/^\d{6}$/, "中国邮编为 6 位数字"],
  us: [/^\d{5}$/, "美国邮编为 5 位数字"],
};

function validatePostal() {
  const rule = rules[country.value];
  if (!rule) return;
  if (rule[0].test(postal.value)) {
    postal.setCustomValidity(""); // 通过 → 清空错误
  } else {
    postal.setCustomValidity(rule[1]); // 失败 → 设提示
  }
}

country.addEventListener("change", validatePostal);
postal.addEventListener("input", validatePostal);
```

### `invalid` 事件

校验失败时，控件上会触发 `invalid` 事件，可用它做日志或自定义错误 UI（如把提示渲染到自己的元素里，而非用原生气泡）：

```js
input.addEventListener("invalid", (e) => {
  e.preventDefault(); // 阻止原生气泡，自己接管展示
  errorBox.textContent = input.validationMessage;
});
```

## 关闭浏览器校验

有时想自己全权接管校验（或允许「保存草稿」时跳过）：

```html
<!-- 整个表单跳过约束校验 -->
<form novalidate>…</form>

<!-- 仅这个按钮提交时跳过（如「保存草稿」按钮） -->
<button type="submit" formnovalidate>保存草稿</button>
```

注意：即使加了 `novalidate` 关掉了**交互式校验与拦截**，`el.validity` / `checkValidity()` 这些 API **依然可用**——你仍能在 JS 里读状态、自己决定怎么提示。

## 一条不可妥协的铁律

::: danger 客户端校验永远不能替代服务器端校验
内置约束、`pattern`、自定义校验全都跑在浏览器里，能被轻易绕过：改 DevTools 删掉 `required`、用脚本给 `.value` 直接赋非法值、干脆绕过页面构造一个 HTTP 请求……所以——

**客户端校验是为了体验（即时反馈、少发无效请求）；服务器端校验才是安全底线。任何要入库的数据，都必须在服务器端按同样的规则再校验一次。**
:::

## 小结

声明式约束（`required` / `pattern` / `min`…）解决八成场景，Constraint Validation API（`validity` / `setCustomValidity` / `reportValidity`）补齐自定义与跨字段规则，`:user-invalid` 让样式恰到好处——但别忘了服务器端那道闸。最后一页看看怎么让用户在移动端填得又快又顺：[自动填充与移动端体验](./autofill-mobile)。
