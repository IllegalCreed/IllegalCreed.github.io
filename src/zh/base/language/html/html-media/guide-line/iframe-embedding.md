---
layout: doc
outline: [2, 3]
---

# `<iframe>` 嵌入与安全

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<iframe>` 嵌入的是**一整个独立文档**，每个 iframe 都吃额外内存——能不用就不用，要用就最小授权
- `src` 给嵌入地址；`srcdoc` 直接内联 HTML（覆盖 `src`）；`title` **必写**（无障碍，读屏靠它说明框内容）
- `sandbox`：**空值 = 最严**（禁脚本 / 表单 / 弹窗 / 同源…），再按需加 token 逐项放开
- **安全红线**：同源内容**绝不**同时给 `allow-scripts` 和 `allow-same-origin`——框内能自己拆掉 `sandbox`，等于没沙箱
- 常用 sandbox token：`allow-scripts`（跑脚本）/ `allow-forms`（提交表单）/ `allow-popups`（弹窗）/ `allow-same-origin`（保留源身份）/ `allow-modals`（alert / confirm）/ `allow-downloads`（下载）/ `allow-top-navigation-by-user-activation`（用户点击才能跳顶层）
- `allow`：权限策略，按 token 精确授予设备能力（`camera` / `microphone` / `geolocation` / `fullscreen` / `autoplay` / `payment`）
- `allowfullscreen` 已被 `allow="fullscreen"` 取代；`allowpaymentrequest` 被 `allow="payment"` 取代
- `loading="lazy"`：iframe 也能懒加载，省资源（仅启用 JS 时生效）
- `referrerpolicy`：控制加载框时发什么 `Referer`，跨域嵌入建议 `strict-origin` 或 `no-referrer`
- `width` / `height` 默认 300×150；实际用 CSS 控尺寸（CSS 宽度会盖过 HTML 属性）

## `<iframe>` 是什么、为什么要谨慎

`<iframe>`（inline frame）在当前页里嵌入**另一个完整的 HTML 文档**——常用于地图、视频播放器、支付组件、第三方小工具、文档预览。但它代价不小：

::: warning 每个 iframe 都是一份开销
每个 `<iframe>` 都是一套完整的文档环境，**需要额外的内存与计算资源**。理论上你想放多少都行，但要留意性能。更重要的是安全——嵌进来的是别人的代码，默认就该**当成不可信**来对待。
:::

基本写法：

```html
<iframe
  src="https://example.com/widget"
  title="第三方小工具"
  sandbox="allow-scripts"
  allow="fullscreen"
  loading="lazy"
  referrerpolicy="strict-origin"
  width="600"
  height="400"></iframe>
```

`title` **必写**：读屏用户靠它知道「这个框是干嘛的」，缺了等于一个无名黑框。

### `src` vs `srcdoc`

```html
<!-- 加载外部地址 -->
<iframe src="https://example.com/" title="示例站"></iframe>

<!-- 直接内联一段 HTML（覆盖 src），常配 sandbox 渲染不可信片段 -->
<iframe sandbox srcdoc="<p>这是内联的、被完全沙箱化的内容</p>" title="内联片段"></iframe>
```

`srcdoc` 直接写一段 HTML 文档作为框内容，**优先级高于 `src`**，特别适合「渲染用户生成 / 不可信的 HTML 片段」——配合空 `sandbox` 可把它彻底关进笼子。

## `sandbox`：把 iframe 关进笼子

`sandbox` 是 iframe 安全的核心。它的逻辑是「**默认全禁、按需放开**」：

```html
<!-- 空 sandbox：最严——禁脚本、禁表单、禁弹窗、禁同源身份…几乎什么都不能做 -->
<iframe sandbox src="untrusted.html" title="不可信内容"></iframe>

<!-- 只放开「跑脚本」，仍不保留源身份 -->
<iframe sandbox="allow-scripts" src="untrusted.html" title="不可信内容"></iframe>
```

- **`sandbox`（空值 / 无值）= 施加所有限制**，安全级别最高；
- **加 token = 逐项解除**对应限制，给多少权限就放多少 token。

常用 token：

| token | 解除的限制 |
| --- | --- |
| `allow-scripts` | 允许跑脚本（但不允许它从父页拿 DOM） |
| `allow-forms` | 允许提交表单（默认表单能显示但提交被拦） |
| `allow-same-origin` | 保留框的源身份，可访问自身存储 / Cookie 与部分 API |
| `allow-popups` | 允许 `window.open()` / `target="_blank"` 开弹窗 |
| `allow-popups-to-escape-sandbox` | 弹出的新窗口不被强制继承沙箱标志 |
| `allow-modals` | 允许 `alert()` / `confirm()` / `prompt()` / `print()` |
| `allow-downloads` | 允许触发文件下载 |
| `allow-top-navigation` | 允许导航顶层窗口（`_top`） |
| `allow-top-navigation-by-user-activation` | 仅**用户手势**触发时才能导航顶层（更安全） |
| `allow-pointer-lock` / `allow-presentation` / `allow-orientation-lock` | 指针锁定 / 演示 / 锁屏方向 |

### 安全红线：`allow-scripts` + `allow-same-origin` 不可同源共用

这是 `<iframe>` 安全最关键的一条，深度可跨引「浏览器安全」相关内容：

::: warning 同源时绝不同开这两个
当**嵌入文档与父页同源**时，**强烈不建议**同时给 `allow-scripts` 和 `allow-same-origin`——因为这会让框内文档**有能力把自己的 `sandbox` 属性删掉**，于是沙箱形同虚设，安全性等于完全没加沙箱。

要么放弃 `allow-same-origin`（框内拿不到源身份，无法改父页 DOM 里的自己），要么确保嵌入的是**异源**内容。简而言之：**给脚本权限，就别给同源身份**。
:::

```html
<!-- ✅ 安全：给脚本、不给同源身份 -->
<iframe sandbox="allow-scripts" src="https://untrusted.example/app" title="应用"></iframe>

<!-- ❌ 危险（同源时）：框内可自行拆除沙箱 -->
<iframe sandbox="allow-scripts allow-same-origin" src="/same-origin/app" title="应用"></iframe>
```

## `allow`：权限策略，精确授予设备能力

`sandbox` 管「能不能跑脚本 / 提交表单」这类**文档级**行为；`allow` 管「能不能用摄像头 / 麦克风 / 定位」这类**设备能力**——它实现的是 [权限策略（Permissions Policy）](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)：

```html
<iframe
  src="https://meet.example.com/room"
  title="视频会议"
  allow="camera; microphone; fullscreen"></iframe>
```

常见 token：`camera`、`microphone`、`geolocation`、`fullscreen`、`autoplay`、`payment`、`usb`、`display-capture` 等。每个 token 后还能限定来源（如 `geolocation 'self'`）。

::: tip `allow` 是「再收紧」，不是「放开」
`allow` 在父页自身的 `Permissions-Policy` HTTP 头**之上再加一层限制**，而**不替换**它。也就是说，父页头里没授予的能力，`allow` 也给不了框；`allow` 只能在父页允许的范围内、进一步决定**把哪些给这个 iframe**。默认情况下，未列入 `allow` 的能力在跨域 iframe 里是被禁的——这正是「最小授权」。
:::

两个历史属性已被 `allow` 取代：`allowfullscreen` 等价于 `allow="fullscreen"`，`allowpaymentrequest` 等价于 `allow="payment"`，新代码直接用 `allow`。

## `loading="lazy"`：iframe 也能懒加载

iframe 往往很重（一整个文档），首屏外的更该延后加载：

```html
<iframe src="https://maps.example.com/embed" title="地图"
        loading="lazy" width="600" height="400"></iframe>
```

`lazy` 让框等接近视口时再加载，省带宽与内存。和图片懒加载一样，它**只在启用 JavaScript 时生效**（反追踪设计——否则站点能靠 iframe 请求时机反推用户滚动位置）。

## `referrerpolicy`：加载框时发什么 `Referer`

控制「向被嵌站点请求时，`Referer` 头透露多少」：

```html
<iframe src="https://third-party.example/widget" title="小工具"
        referrerpolicy="strict-origin"></iframe>
```

常用取值（与 `<img>` / `<a>` 同一套）：

| 取值 | 行为 |
| --- | --- |
| `no-referrer` | 完全不发 `Referer` |
| `origin` | 只发源（协议 + 主机 + 端口），不带路径 |
| `strict-origin` | 同等安全级（HTTPS→HTTPS）才发源，降级（HTTPS→HTTP）不发 |
| `strict-origin-when-cross-origin` | **默认**：同源发完整 URL，跨域发源，降级不发 |
| `no-referrer-when-downgrade` | 不向非 TLS 源发 `Referer` |
| `unsafe-url` | 总是带完整 URL（含路径）——**不安全**，会向不安全源泄露路径 |

跨域嵌入第三方时，为减少信息泄露，常用 `strict-origin` 或更严的 `no-referrer`。

## 尺寸：HTML 属性 vs CSS

`width` / `height` 默认 300×150（CSS 像素）。实战通常用 CSS 控制，且 **CSS 宽高会盖过 HTML 属性**：

```css
iframe {
  border: 0; /* 去掉默认边框 */
  width: 100%; /* 盖过 HTML width 属性 */
  aspect-ratio: 16 / 9; /* 配合保持比例，避免抖动 */
}
```

## 一份「默认安全」的嵌入模板

嵌第三方内容时，建议从这套「最小授权」起步，再按需放开：

```html
<iframe
  src="https://third-party.example/widget"
  title="第三方小工具说明"
  sandbox="allow-scripts allow-popups"
  allow="fullscreen"
  loading="lazy"
  referrerpolicy="strict-origin"
  width="600"
  height="400"></iframe>
```

要点回顾：`title` 必写、`sandbox` 从严起步、`allow` 精确授权、`loading="lazy"` 省资源、`referrerpolicy` 控泄露，且牢记**同源别同开 `allow-scripts` + `allow-same-origin`**。

## 小结

`<iframe>` 把别人的页面嵌进来，安全靠 `sandbox`（文档级，默认全禁按需放）+ `allow`（设备能力，最小授权）双管，再配 `loading` 省资源、`referrerpolicy` 控泄露。除了嵌完整页面，HTML 还有一类「嵌外部资源 / 可点击区域」的元素——下一页：[图像映射与 object / embed](./image-map-embed)。
