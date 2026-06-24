---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 容器：`<form action="/signup" method="post">` —— `action` 是处理地址，`method` 用 `post` 提交敏感数据
- **数据靠 `name`**：没有 `name` 的控件**不会被提交**——这是新手最常踩的「后端收不到数据」坑
- 每个控件都要有 `<label>`：显式 `<label for="id">` + 控件 `id` 是首选写法（点标签即聚焦控件、屏幕阅读器可读）
- 文本类：`<input type="text">` / `type="email"` / `type="password"`；多行用 `<textarea>`
- 校验三件套：`required`（必填）、`type="email"`（类型校验）、`pattern` / `minlength`（格式与长度）
- 单选用 `<input type="radio">`（同 `name` 互斥），多选用 `<input type="checkbox">`，下拉用 `<select>`
- 提交按钮：`<button type="submit">`；`type` 默认就是 `submit`，但显式写出更稳
- 校验失败浏览器**自动拦截提交**并提示，无需 JS；想关掉用 `<form novalidate>`
- 移动端：`type` / `inputmode` 决定唤起哪种虚拟键盘，`autocomplete` 决定能否自动填充

## 一个「正确且现代」的注册表单

下面这份表单覆盖了真实项目里表单的大部分要素，本叶其余各页就是逐块拆解它：

```html
<form action="/signup" method="post">
  <!-- 1. 文本输入：name 必填，否则后端收不到 -->
  <div>
    <label for="username">用户名</label>
    <input
      type="text"
      id="username"
      name="username"
      autocomplete="username"
      minlength="3"
      maxlength="20"
      required
    />
  </div>

  <!-- 2. 邮箱：type=email 自带格式校验 + 移动端 @ 键盘 -->
  <div>
    <label for="email">邮箱</label>
    <input
      type="email"
      id="email"
      name="email"
      autocomplete="email"
      required
    />
  </div>

  <!-- 3. 密码：autocomplete=new-password 触发密码管理器生成强密码 -->
  <div>
    <label for="password">密码</label>
    <input
      type="password"
      id="password"
      name="password"
      autocomplete="new-password"
      minlength="8"
      required
    />
  </div>

  <!-- 4. 单选组：同一个 name，互斥；用 fieldset + legend 分组 -->
  <fieldset>
    <legend>账号类型</legend>
    <label><input type="radio" name="plan" value="free" checked /> 免费版</label>
    <label><input type="radio" name="plan" value="pro" /> 专业版</label>
  </fieldset>

  <!-- 5. 下拉选择 -->
  <div>
    <label for="country">国家 / 地区</label>
    <select id="country" name="country" required>
      <option value="">请选择</option>
      <option value="cn">中国</option>
      <option value="us">美国</option>
    </select>
  </div>

  <!-- 6. 多行文本 -->
  <div>
    <label for="bio">个人简介</label>
    <textarea id="bio" name="bio" rows="4" maxlength="200"></textarea>
  </div>

  <!-- 7. 复选框：必须勾选才能提交 -->
  <div>
    <label>
      <input type="checkbox" name="agree" value="yes" required />
      我已阅读并同意服务条款
    </label>
  </div>

  <!-- 8. 提交按钮 -->
  <button type="submit">注册</button>
</form>
```

::: tip 为什么不用 placeholder 代替 label
`placeholder`（占位提示）一旦开始输入就消失，且对屏幕阅读器支持不一致、对比度常常不足——它是「补充提示」，**绝不能替代 `<label>`**。每个控件都要有真正的标签。
:::

## 逐块拆解

### ① `<form>` 容器：数据去哪、怎么去

```html
<form action="/signup" method="post"></form>
```

- `action`：表单数据提交到的 URL（处理脚本地址）；
- `method`：用哪种 HTTP 方法。`get` 把数据拼到 URL 后面（适合搜索、可分享的查询）；`post` 把数据放进请求体（**密码、上传等敏感或大数据必须用 `post`**）。

详见 [表单提交机制](./guide-line/form-submission)。

### ② `name`：决定「什么会被提交」

提交表单时，浏览器收集的是每个控件的 **`name=value`** 对。**没有 `name` 的控件根本不参与提交**——这是「表单看起来填了，后端却收不到」最常见的原因。

```html
<input type="text" name="username" />
<!-- 提交时发送 username=用户填的值 -->
```

复选框 / 单选按钮还有一条特殊规则：**只有被选中的那个才会带着 `name` 和 `value` 提交**；若复选框没写 `value`，提交值会默认成无意义的 `on`，所以请显式写 `value`。

### ③ 选对控件类型

`<input>` 的 `type` 属性决定它长什么样、校验什么、移动端唤起哪种键盘。注册表单里就用到了 `text` / `email` / `password` / `radio` / `checkbox`，再加上独立的 `<select>` 和 `<textarea>`。全部 22 种类型见 [`input` 类型全谱](./guide-line/input-types)，选择类控件见 [选择类控件](./guide-line/select-controls)。

### ④ `<label>`：每个控件都要有标签

```html
<label for="email">邮箱</label>
<input type="email" id="email" name="email" />
```

`<label>` 的 `for` 指向控件的 `id`，建立「这段文字是这个控件的标签」的程序化关联。好处有三：屏幕阅读器聚焦控件时会读出标签、点击标签会聚焦 / 激活控件（**放大了点击命中区**，对触屏尤其友好）、视觉上一目了然。详见 [`label` / `fieldset` 与可访问关联](./guide-line/labels-fieldset)。

### ⑤ 内置校验：不写 JS 就能拦错

注册表单里的 `required`、`minlength`、`type="email"` 都是**约束校验**属性。用户点提交时，浏览器会自动检查这些约束，不通过就**阻止提交并弹出原生提示**，无需任何 JavaScript：

```html
<input type="email" name="email" required />
<!-- 留空 → 提示「请填写此字段」；填了非邮箱 → 提示「请输入电子邮件地址」 -->
```

想完全关掉浏览器校验，在 `<form>` 上加 `novalidate`。想自定义提示文案，用 JS 的 `setCustomValidity()`。详见 [约束校验](./guide-line/constraint-validation)。

### ⑥ 提交与重置按钮

```html
<button type="submit">注册</button>
<button type="reset">重置</button>
<button type="button">普通按钮（需 JS 绑定）</button>
```

`<button>` 的 `type` 有三个值：`submit`（提交，**也是默认值**）、`reset`（重置为初始值）、`button`（无默认行为，靠 JS）。⚠️ 在 `<form>` 里漏写 `type` 的 `<button>` 会被当作 `submit`，可能导致意外提交——**养成显式写 `type` 的习惯**。

## 一条铁律：永远在服务器端再校验一次

浏览器的约束校验是**为了体验**（即时反馈、减少无效请求），但它能被绕过——改 DevTools、构造 HTTP 请求、用脚本直接赋值都能跳过。所以：

> 客户端校验提升体验，服务器端校验保证安全。**任何入库的数据都必须在服务器端再校验一遍。**

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[表单提交机制](./guide-line/form-submission)、[`input` 类型](./guide-line/input-types)、[`label` / `fieldset`](./guide-line/labels-fieldset)、[选择类控件](./guide-line/select-controls)、[约束校验](./guide-line/constraint-validation)、[自动填充与移动端](./guide-line/autofill-mobile)。
