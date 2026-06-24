---
layout: doc
outline: [2, 3]
---

# 自动填充与移动端体验

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `autocomplete` 用**标准字段名**告诉浏览器「这格填什么」，直接决定能否一键自动填充
- 常用值：`name` / `given-name` / `family-name` / `email` / `username` / `tel` / `street-address` / `postal-code` / `country`
- 密码场景关键：注册用 `autocomplete="new-password"`（触发生成强密码），登录用 `current-password`
- 验证码：`autocomplete="one-time-code"` 让 iOS / Android 把短信验证码送到键盘建议条
- 支付：`cc-name` / `cc-number` / `cc-exp` / `cc-csc`；地址可加 `shipping` / `billing` 前缀
- `inputmode` 只换**虚拟键盘**、**不做校验**：`numeric` / `decimal` / `tel` / `email` / `url` / `search` / `none`
- 「数字但非数值」（验证码、卡号）用 `type="text"` + `inputmode="numeric"`，别用 `type="number"`
- `enterkeyhint` 改回车键文案：`enter` / `done` / `go` / `next` / `previous` / `search` / `send`
- 关掉自动填充用 `autocomplete="off"`（但对密码 / 邮箱浏览器常会无视）

## `autocomplete`：让浏览器替用户填

`autocomplete` 属性用一套**标准化字段名**告诉浏览器「这个输入框装的是什么数据」。填对了，浏览器 / 密码管理器就能把用户存过的姓名、邮箱、地址、卡号一键填进来——这是提升填表速度与转化率最廉价的手段。它可用于 `<input>` / `<textarea>` / `<select>` / `<form>`。

```html
<input name="fname" autocomplete="given-name" />
<input name="lname" autocomplete="family-name" />
<input type="email" name="email" autocomplete="email" />
<input type="tel" name="phone" autocomplete="tel" />
```

### 常用字段名速查

| 类别 | 常用 token |
| --- | --- |
| 姓名 | `name` / `given-name`（名）/ `family-name`（姓）/ `additional-name` / `nickname` / `honorific-prefix` |
| 账号 | `username` / `new-password` / `current-password` / `one-time-code` |
| 联系 | `email` / `tel` / `tel-country-code` / `tel-national` / `impp` / `url` |
| 地址 | `street-address` / `address-line1`～`3` / `address-level1`（省/州）/ `address-level2`（市）/ `postal-code` / `country` / `country-name` |
| 支付 | `cc-name` / `cc-number` / `cc-exp` / `cc-exp-month` / `cc-exp-year` / `cc-csc` / `cc-type` |
| 组织 | `organization` / `organization-title` |
| 个人 | `bday`（及 `bday-day/month/year`）/ `sex` / `language` / `photo` |

### 密码与验证码：最该填对的几个

```html
<!-- 注册：触发浏览器/密码管理器「生成强密码」 -->
<input type="password" name="pwd" autocomplete="new-password" />

<!-- 登录：自动填入已保存的密码 -->
<input type="password" name="pwd" autocomplete="current-password" />

<!-- 短信验证码：iOS/Android 自动把收到的码送到键盘建议条 -->
<input type="text" inputmode="numeric" name="otp" autocomplete="one-time-code" />
```

::: tip new-password 与 current-password 的区别很关键
注册 / 改密页用 `new-password`，浏览器才会**主动提议生成强密码**、且不会拿旧密码来填；登录页用 `current-password`，才能**自动填入已存的密码**。两者填反会让密码管理器行为错乱——这是最值得记住的一对。
:::

### 分组前缀：`shipping` / `billing` / 联系方式类型

字段名前可加可选前缀，进一步限定语义。顺序是：`section-*` → `shipping`/`billing` → `home`/`work`/`mobile`/`fax`/`pager` → 字段名 →（可选）`webauthn`：

```html
<!-- 收货地址 vs 账单地址：同样是邮编，靠前缀区分 -->
<input autocomplete="shipping postal-code" />
<input autocomplete="billing postal-code" />

<!-- 住宅电话 vs 工作电话 -->
<input autocomplete="home tel" />
<input autocomplete="work tel" />

<!-- 同一页有多套地址时，用 section-* 分隔成独立组 -->
<input autocomplete="section-addr1 shipping street-address" />
<input autocomplete="section-addr2 billing street-address" />
```

末尾的 `webauthn`（如 `autocomplete="username webauthn"`）用于 passkey 场景，让浏览器在该框提供通行密钥（Web Authentication API）的条件式自动填充。

### 关闭自动填充

```html
<input autocomplete="off" />
```

`off` 请求浏览器不要自动填充。但要注意：出于安全 / 体验考量，**浏览器对密码、邮箱等字段经常无视 `off`**——它不是一个可靠的「禁用开关」。

## `inputmode`：只换键盘，不做校验

移动端虚拟键盘可以随字段类型变化——填数字给数字盘、填网址给带 `/` 的盘。`inputmode` 就是这个「键盘提示」。它**只影响弹出的软键盘、不做任何校验**（这点与 `type` 截然不同）。

| `inputmode` | 唤起的键盘 |
| --- | --- |
| `text` | 当前语言的标准键盘（默认） |
| `none` | 不弹键盘（自绘输入界面时用） |
| `numeric` | 仅 0–9 数字盘 |
| `decimal` | 数字 + 小数点（金额） |
| `tel` | 电话拨号盘（含 `*` `#`） |
| `email` | 带 `@` 的邮箱键盘 |
| `url` | 带 `/`、`.com` 的网址键盘 |
| `search` | 回车键为「搜索」的键盘 |

```html
<!-- 验证码：是数字但不是「数值」，用 text + inputmode 最稳 -->
<input type="text" inputmode="numeric" autocomplete="one-time-code" name="otp" />

<!-- 金额：要小数点 -->
<input type="text" inputmode="decimal" name="amount" />
```

::: warning inputmode 不能替代 type 的校验
能用语义 `type` 就优先用 `type`——`<input type="email">` 既给邮箱键盘**又做格式校验**，而 `inputmode="email"` 只给键盘、不校验。`inputmode` 的真正价值在于 `type` 表达不了的场景：典型就是「由数字组成但不是数值」的验证码、卡号、邮编——这些用 `type="text"` + `inputmode="numeric"`（必要时再加 `pattern`），既得数字键盘又避开 `type="number"` 的副作用（前导零丢失、可输 `e` `+` `-` 等）。
:::

## `enterkeyhint`：定制回车键

`enterkeyhint` 改变移动端软键盘上**回车 / 提交键的文案或图标**，给用户「按下去会发生什么」的预期：

| `enterkeyhint` | 回车键变为 |
| --- | --- |
| `enter` | 普通换行 / 确认 |
| `done` | 「完成」（结束输入） |
| `go` | 「前往」（跳转） |
| `next` | 「下一项」（移到下个字段） |
| `previous` | 「上一项」 |
| `search` | 「搜索」 |
| `send` | 「发送」 |

```html
<!-- 搜索框：回车键显示「搜索」 -->
<input type="search" enterkeyhint="search" name="q" />

<!-- 多步表单的中间字段：回车键显示「下一项」 -->
<input type="text" enterkeyhint="next" name="step1" />

<!-- 聊天输入：回车键显示「发送」 -->
<textarea enterkeyhint="send" name="message"></textarea>
```

## 移动端表单清单

把上面几件事串起来，一个移动端友好的字段通常长这样：

```html
<label for="phone">手机号</label>
<input
  type="tel"
  id="phone"
  name="phone"
  inputmode="tel"
  autocomplete="tel"
  enterkeyhint="next"
  required
/>
```

落地要点：

- **选对 `type`**：拿到合适的键盘 + 内置校验（`email` / `tel` / `url` / `number`）；
- **`type` 不够再加 `inputmode`**：尤其验证码 / 卡号 / 金额；
- **`autocomplete` 填对字段名**：自动填充与密码管理直接受益，密码区分清 `new-` / `current-`；
- **`enterkeyhint` 给回车键正确文案**：多步表单用 `next`、搜索用 `search`、聊天用 `send`；
- 别忘了每个控件仍要有 `<label>`（见 [`label` / `fieldset`](./labels-fieldset)）。

## 小结

`autocomplete` 让浏览器替用户把表填完，`inputmode` / `enterkeyhint` 让移动端键盘恰好顺手——这些都是「不报错、却实打实影响完成率」的细节。至此本叶六个深度页全部走完，把高频属性与取值汇总在一处便于随时查阅，见 [参考](../reference)。
