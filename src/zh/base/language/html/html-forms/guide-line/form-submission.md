---
layout: doc
outline: [2, 3]
---

# 表单提交机制

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `action`：表单提交到的 URL；省略时默认提交到当前页面 URL
- `method`：`get`（数据拼到 URL 查询串）、`post`（数据放进请求体）、`dialog`（在 `<dialog>` 内关闭对话框而不提交）
- **GET vs POST 准则**：可分享 / 幂等查询用 `get`；敏感、有副作用、含上传或大数据用 `post`
- `enctype` 三种取值：`application/x-www-form-urlencoded`（默认）、`multipart/form-data`（**文件上传必用**）、`text/plain`（仅调试）
- 文件上传三连：`method="post"` + `enctype="multipart/form-data"` + `<input type="file">`，缺一不可
- 提交的是每个控件的 `name=value` 对；**没有 `name` 不提交**，禁用（`disabled`）控件也不提交
- 单个提交按钮可用 `formaction` / `formmethod` / `formenctype` / `formtarget` / `formnovalidate` 覆盖 `<form>` 的设置
- `target`：`_self`（默认，当前页）/ `_blank`（新标签）/ `_top` / `_parent` / 具名框架
- JS 侧用 `FormData` 收集表单数据，配合 `fetch()` 做无刷新（AJAX）提交

## `<form>` 的核心属性

`<form>` 是表单的容器，提交行为由它的几个属性决定：

| 属性 | 作用 |
| --- | --- |
| `action` | 数据提交到的 URL（处理脚本）；省略则提交到当前页 |
| `method` | 提交用的 HTTP 方法变体：`get` / `post` / `dialog` |
| `enctype` | 提交时数据的编码方式（仅 `post` 有意义） |
| `target` | 在哪个浏览上下文打开响应（`_self` / `_blank` …） |
| `name` | 表单名，用于 `document.forms` API |
| `novalidate` | 提交时跳过约束校验 |
| `accept-charset` | 提交使用的字符编码（现代基本固定 UTF-8） |
| `autocomplete` | 整个表单控件的自动填充默认开关（`on` / `off`） |

## GET 与 POST：怎么选

`method` 决定数据如何随请求发送，这是表单最关键的一个决策：

```html
<!-- GET：数据拼到 URL，如 /search?q=html&page=2 -->
<form action="/search" method="get"></form>

<!-- POST：数据放进 HTTP 请求体，URL 不暴露数据 -->
<form action="/login" method="post"></form>
```

| 维度 | `get` | `post` |
| --- | --- | --- |
| 数据位置 | 拼接在 URL 查询串（`?k=v&k2=v2`） | 放在 HTTP 请求体 |
| 可见 / 可收藏 | 数据出现在地址栏，可分享、可加书签 | 数据不在 URL，无法靠 URL 复现 |
| 数据量 | 受 URL 长度限制 | 基本不受限（适合大数据） |
| 幂等性 | 应为「只读查询」，重复无副作用 | 用于「会改变服务器状态」的操作 |
| 适用场景 | 搜索、筛选、分页等查询 | 登录、下单、上传、删除等 |

::: warning 敏感数据绝不要用 GET
密码、令牌、个人信息若用 `get` 提交，会原样出现在地址栏、浏览器历史、服务器访问日志、`Referer` 头里——这是严重的安全隐患。**凡涉及敏感数据或有副作用的操作，一律用 `post`。**
:::

::: tip method="dialog"
当表单位于 `<dialog>` 元素内部，`method="dialog"` 会在提交时**关闭对话框**：触发一次 `submit` 事件，但数据既不清空也不真正提交到服务器，常用于「确认 / 取消」式弹窗。
:::

## `enctype`：三种编码方式

`enctype` 规定 `post` 提交时，浏览器把表单数据打包成什么格式。共三种取值：

| `enctype` | 含义 | 何时用 |
| --- | --- | --- |
| `application/x-www-form-urlencoded` | **默认值**，数据编码成 `key=value&key2=value2`（空格变 `+`，特殊字符百分号转义） | 纯文本字段的普通表单 |
| `multipart/form-data` | 把每个字段拆成独立「部分」分块传输，可携带二进制 | **含 `<input type="file">` 文件上传时必用** |
| `text/plain` | 数据以纯文本发送、不做转义 | 仅用于调试，**生产不要用** |

### 文件上传的标准写法

文件上传有一套固定组合，三者缺一不可：

```html
<form action="/upload" method="post" enctype="multipart/form-data">
  <label for="avatar">头像</label>
  <input type="file" id="avatar" name="avatar" accept="image/*" />
  <button type="submit">上传</button>
</form>
```

- `method="post"`：二进制文件不可能塞进 URL；
- `enctype="multipart/form-data"`：默认的 urlencoded 编码无法承载文件内容；
- `<input type="file">`：选择文件的控件，`accept` 限制可选类型，`multiple` 允许多选。

漏掉 `enctype` 是文件上传「后端只收到文件名、收不到内容」的典型原因。

## 什么会被提交、什么不会

提交时，浏览器构造一份「表单数据集」，规则要点：

- **必须有 `name`**：没有 `name` 属性的控件**完全不参与**提交；
- **被禁用的不提交**：带 `disabled` 的控件（包括被 `disabled` 的 `<fieldset>` 内的所有控件）不提交——若想显示但仍提交，用 `readonly` 而非 `disabled`；
- **复选 / 单选只交选中项**：只有被选中的 `checkbox` / `radio` 才带 `name=value`；
- **`<output>` 不提交**：它只用于展示计算结果，不进入表单数据集；
- **空提交按钮不提交**：没有 `name` 或 `value` 的按钮不会出现在数据里。

## 单按钮覆盖：`formaction` 等

一个表单可以有多个提交按钮，各自把数据发往不同地方。提交按钮（`<button>` / `<input type="submit">` / `<input type="image">`）上的 `form*` 属性会**覆盖** `<form>` 的对应设置：

```html
<form action="/save" method="post">
  <!-- … 字段 … -->
  <button type="submit">保存草稿</button>
  <!-- 这个按钮把同一份数据发到另一个地址、且跳过校验 -->
  <button type="submit" formaction="/publish" formnovalidate>直接发布</button>
</form>
```

| 按钮属性 | 覆盖 `<form>` 的 |
| --- | --- |
| `formaction` | `action` |
| `formmethod` | `method` |
| `formenctype` | `enctype` |
| `formtarget` | `target` |
| `formnovalidate` | `novalidate`（这个按钮跳过校验） |

## 用 `FormData` 做无刷新提交

现代应用常用 JavaScript 拦截提交、用 `FormData` 收集数据，再以 `fetch()` 异步发送，避免整页刷新：

```js
const form = document.querySelector("form");

form.addEventListener("submit", async (event) => {
  // 阻止浏览器默认的「整页跳转式」提交
  event.preventDefault();

  // FormData 自动按 name 收集所有可提交控件（含文件）
  const data = new FormData(form);

  const response = await fetch(form.action, {
    method: "post",
    body: data, // 传 FormData 时浏览器自动设置 multipart 边界，不要手动设 Content-Type
  });

  const result = await response.json();
  console.log(result);
});
```

要点：

- `new FormData(form)` 按各控件的 `name` 收集值，**包括文件**；
- 把 `FormData` 直接作为 `fetch` 的 `body`，浏览器会自动用 `multipart/form-data` 并生成边界——**此时千万别手动设 `Content-Type`**，否则边界缺失会导致后端解析失败；
- 也可 `data.append("extra", "值")` 追加字段、`data.get("name")` 读取。

## 小结

`action` + `method` 决定「数据去哪、怎么去」，`enctype` 决定「怎么打包」（文件上传认准 `multipart/form-data`），而 `name` 决定「什么会被提交」。掌握这套规则后，下一页进入采集数据的主力控件——[`input` 类型全谱](./input-types)。
