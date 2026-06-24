---
layout: doc
outline: [2, 3]
---

# `input` 类型全谱

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<input>` 的 `type` 决定外观、校验规则与移动端键盘；共 22 种类型，默认 `text`
- 文本族：`text` / `search` / `url` / `email` / `tel` / `password`——后四种带语义校验或专用键盘
- 数字族：`number`（带步进器）、`range`（滑块，重区间不重精确值），用 `min` / `max` / `step`
- 日期时间族：`date` / `time` / `datetime-local` / `month` / `week`，浏览器给原生选择器
- 选择族：`checkbox`（多选）、`radio`（同 `name` 互斥）、`color`（取色器）、`file`（选文件，配 `accept` / `multiple`）
- 按钮族：`submit`（提交）、`reset`（重置）、`button`（无默认行为）、`image`（图片提交按钮）
- `hidden`：不可见但随表单提交，常用于令牌、ID 等上下文数据
- 关键属性：`value` / `placeholder` / `required` / `readonly` / `disabled` / `autofocus` / `list`
- `tel` 不做格式校验（各国号码格式差异太大），需要校验用 `pattern`

## `type` 决定一切

`<input>` 是表单里最百变的元素——同一个标签，靠 `type` 切换出 22 种完全不同的控件。`type` 同时决定三件事：**渲染成什么 UI**、**做什么校验**、**移动端唤起哪种虚拟键盘**。不写 `type` 时默认是 `text`。

## 文本输入族

| `type` | 用途 | 特点 |
| --- | --- | --- |
| `text` | 单行纯文本（默认） | 无特殊校验 |
| `search` | 搜索框 | 部分浏览器显示清除（×）按钮 |
| `url` | 网址 | 校验是否为合法绝对 URL；移动端 URL 键盘 |
| `email` | 邮箱 | 校验邮箱格式；移动端带 `@` 键盘；`multiple` 可填多个 |
| `tel` | 电话号码 | **不校验格式**（各国差异大）；移动端拨号键盘 |
| `password` | 密码 | 输入内容以圆点遮蔽 |

```html
<input type="email" name="email" placeholder="you@example.com" required />
<input type="password" name="pwd" minlength="8" required />
<!-- email 加 multiple 可填逗号分隔的多个地址 -->
<input type="email" name="cc" multiple />
```

文本族通用属性：`placeholder`（提示）、`maxlength` / `minlength`（长度，按 UTF-16 码元计）、`size`（显示宽度，字符数）、`pattern`（正则校验）、`autocomplete`（自动填充）、`list`（关联 `datalist`）。

::: tip tel 为什么不校验
全球电话号码格式千差万别，浏览器无法用统一规则校验，所以 `type="tel"` 只负责唤起拨号键盘、**不做格式校验**。需要校验时自己加 `pattern`，如 `pattern="1[3-9]\d{9}"` 校验中国大陆手机号。
:::

## 数字与范围族

```html
<!-- number：精确数值，带上下步进器 -->
<input type="number" name="age" min="0" max="120" step="1" />

<!-- range：滑块，用户不关心精确值时用（如音量） -->
<input type="range" name="volume" min="0" max="100" step="5" value="50" />
```

- `min` / `max`：取值下限 / 上限，越界触发校验失败；
- `step`：步长（粒度），`step="0.01"` 允许两位小数，`step="any"` 取消步长限制；
- `number` 适合「需要看到并精确输入数值」，`range` 适合「只关心大致比例、不在乎具体数字」。

::: warning number 不等于「只能输数字」
`type="number"` 适合真正的「数量」（年龄、价格）。但像信用卡号、邮编、手机号这类「由数字组成、却不参与运算」的字段，**不要用 `number`**——它会带来前导零丢失、`e` / `+` / `-` 可输入、千分位无法显示等问题。这类字段用 `type="text"` + `inputmode="numeric"` + `pattern` 更稳妥。
:::

## 日期与时间族

浏览器为这些类型提供原生的日历 / 时钟选择器，省去手写日期组件：

| `type` | 采集 | 提交格式示例 |
| --- | --- | --- |
| `date` | 年月日 | `2026-06-24` |
| `time` | 时分（秒） | `14:30` |
| `datetime-local` | 本地日期 + 时间（无时区） | `2026-06-24T14:30` |
| `month` | 年 + 月 | `2026-06` |
| `week` | 年 + 周序号 | `2026-W26` |

```html
<input type="date" name="birthday" min="1900-01-01" max="2026-12-31" />
```

日期时间类型同样支持 `min` / `max`（限制可选范围）和 `step`（如 `time` 用 `step="900"` 表示 15 分钟一档）。

## 选择与特殊族

```html
<!-- 复选框：可多选，同组常用同一 name；务必写 value -->
<input type="checkbox" name="hobby" value="reading" /> 阅读
<input type="checkbox" name="hobby" value="coding" checked /> 编程

<!-- 单选按钮：同一 name 互斥，只能选一个 -->
<input type="radio" name="gender" value="male" /> 男
<input type="radio" name="gender" value="female" /> 女

<!-- 颜色选择器：值为 #rrggbb 十六进制 -->
<input type="color" name="theme" value="#0d6efd" />

<!-- 文件选择：accept 限类型，multiple 允许多选 -->
<input type="file" name="docs" accept=".pdf,.doc,.docx" multiple />
```

- **`checkbox` / `radio`**：用 `checked` 预选；`radio` 凭**相同的 `name`** 组成互斥组；`checkbox` 若不写 `value`，选中时提交值默认是无意义的 `on`，所以**一定要写 `value`**。
- **`color`**：取色器，值是 `#rrggbb` 格式的十六进制颜色。
- **`file`**：`accept` 用 MIME 类型或扩展名（逗号分隔，如 `image/*`、`.pdf`）提示可选类型；`multiple` 允许选多个；在移动端加 `capture="user"` / `capture="environment"` 可直接调起前 / 后摄像头。文件上传须配合表单的 `enctype="multipart/form-data"`（见 [表单提交机制](./form-submission)）。

## 按钮族与 hidden

```html
<input type="submit" value="提交" />   <!-- 提交表单 -->
<input type="reset" value="重置" />    <!-- 重置为初始值 -->
<input type="button" value="点我" />   <!-- 无默认行为，靠 JS -->
<input type="image" src="go.png" alt="提交" /> <!-- 图片提交按钮 -->

<!-- hidden：不可见，但随表单提交，用于传递上下文数据 -->
<input type="hidden" name="userId" value="42" />
```

- `submit` / `reset` / `button` 用 `value` 设置按钮文字；现代更推荐用 `<button>` 元素（可放图标、富文本，见 [选择类控件](./select-controls)）。
- `image` 是图片形式的提交按钮，点击时还会额外提交点击坐标 `name.x` / `name.y`。
- `hidden` 控件用户看不见、也改不了，但会照常提交，常用来携带 CSRF 令牌、记录 ID、表单步骤等服务端需要的上下文。

## 跨类型通用属性

无论哪种 `type`，这些属性都很常用：

| 属性 | 作用 |
| --- | --- |
| `name` | 提交时的字段名（**没有它就不提交**） |
| `value` | 控件的值 / 初始值 |
| `required` | 必填（布尔） |
| `placeholder` | 占位提示（不替代 `<label>`） |
| `disabled` | 禁用，灰显且**不提交** |
| `readonly` | 只读，可聚焦、可复制、**仍提交** |
| `autofocus` | 页面加载后自动聚焦（每页仅一个） |
| `autocomplete` | 自动填充字段名（见 [自动填充与移动端](./autofill-mobile)） |
| `list` | 关联 `<datalist>` 的 `id`，提供建议项 |

::: tip disabled vs readonly
两者都让用户改不了值，但：`disabled` 灰显、不可聚焦、**不提交**；`readonly` 外观正常、可聚焦可复制、**照常提交**。「想展示一个不可改但要随表单一起交回」的值，用 `readonly`。
:::

## 小结

`type` 是 `<input>` 的灵魂——选对类型，就同时拿到了合适的 UI、内置校验和移动端键盘。控件选好后，下一步是给它们配上无障碍的标签与分组：[`label` / `fieldset` 与可访问关联](./labels-fieldset)。
