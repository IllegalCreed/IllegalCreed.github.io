---
layout: doc
outline: [2, 3]
---

# 超链接机制与 rel 安全

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `href` 类型：绝对 URL、协议相对 `//host`、根相对 `/path`、目录相对 `./` / `../`、页内 `#锚点`、`mailto:`、`tel:`、`sms:`、`data:`、`blob:`
- 锚点：`href="#id"` 跳到对应 `id` 元素；`href="#top"` 或 `href="#"` 回到页顶
- `mailto:` 可带 `?subject=` / `body=` / `cc=` / `bcc=`（多参数用 `&` 连接，值需 URL 编码）
- `download`：触发下载并建议文件名；**仅**对同源 / `blob:` / `data:` URL 生效，跨域多被拦
- `target`：`_self`（默认）/ `_blank`（新标签）/ `_parent` / `_top`；自定义名复用同一标签
- **安全铁律**：`target="_blank"` 必配 `rel="noopener"`（防反向标签劫持），现代浏览器已隐含、老浏览器仍需显式写
- `rel="noreferrer"`：隐含 `noopener` + 不发 `Referer`；外链常用 `rel="noopener noreferrer"`
- `rel="nofollow"`：告诉搜索引擎别追踪此链接（用户生成内容、广告）；`external` / `alternate` / `author` / `me` 等表达关系
- 链接文字要**自解释**——屏幕阅读器可单独列出全部链接，「点这里」毫无信息
- 别把 `<a href="#">` + JS 当按钮用——真正的动作请用 `<button>`

## `<a>` 与 `href`

`<a>` 表示一个超链接——把当前文档连到「任何 URL 能寻址的东西」。它的灵魂是 `href`：没有 `href` 的 `<a>` 只是「本可以放链接的占位符」（无下划线、不可点、不可聚焦）。

`href` 支持多种形态：

```html
<!-- 绝对 URL -->
<a href="https://example.com">完整地址</a>
<!-- 协议相对（沿用当前页协议，今天已少用，建议直接写 https） -->
<a href="//example.com">协议相对</a>
<!-- 根相对（站点根开始） -->
<a href="/docs/html">根相对</a>
<!-- 目录相对 -->
<a href="./sibling">同级</a>
<a href="../parent">上级</a>
<!-- 页内锚点 -->
<a href="#install">跳到安装一节</a>
```

## 页内锚点

`href="#id"` 跳到页面里 `id` 等于该值的元素；`href="#top"` 与 `href="#"`（大小写不敏感）回到页顶：

```html
<a href="#features">查看功能</a>
...
<h2 id="features">功能</h2>
```

锚点也能拼在绝对 URL 后，直达外部页面的某一节：`https://example.com/doc#install`。配合 CSS `scroll-behavior: smooth` 可平滑滚动，配合 `scroll-margin-top` 可避免固定页头遮挡目标。

## 协议链接：`mailto` · `tel` · `sms`

```html
<!-- 邮件：可预填主题 / 正文 / 抄送 -->
<a href="mailto:hi@example.com">给我们写信</a>
<a href="mailto:hi@example.com?subject=反馈&body=你好%EF%BC%8C">带主题正文</a>
<a href="mailto:?subject=推荐&body=看看这个">仅预填、不指定收件人</a>

<!-- 电话：手机直接拨号，桌面可能唤起 Skype / FaceTime -->
<a href="tel:+8675512345678">+86 0755-1234-5678</a>

<!-- 短信 -->
<a href="sms:+8613800000000">发短信</a>
```

多个查询参数用 `&` 连接、`?` 起头；参数值里的空格、中文等**必须 URL 编码**（空格→`%20`，逗号「，」是 `%EF%BC%8C` 这类）。

::: tip 用属性选择器给特殊链接加图标
CSS 属性选择器能按 `href` 前后缀自动给链接加标识，无需手动加 class：

```css
a[href^="mailto:"]::before { content: "✉ "; }
a[href^="tel:"]::before    { content: "☎ "; }
a[href$=".pdf"]::after     { content: " (PDF)"; }
```
:::

## `download`：触发下载

`download` 让浏览器把目标**存为文件**而非导航过去，可选地建议文件名：

```html
<!-- 由浏览器决定文件名（来自 Content-Disposition / URL / 类型） -->
<a href="/report.pdf" download>下载报告</a>
<!-- 指定文件名 -->
<a href="/files/2026.pdf" download="年度报告.pdf">下载</a>
```

::: warning download 的同源限制
`download` **只**对同源 URL、`blob:`、`data:` 生效；**跨域**资源的 `download` 通常被浏览器忽略（出于安全，防止悄悄从第三方站点拉文件）。要让跨域文件强制下载，需服务端返回 `Content-Disposition: attachment` 响应头。此外 HTTP 头里的文件名优先级高于 `download` 属性值。
:::

`download` 常配合 `canvas.toDataURL()` 或 `URL.createObjectURL()` 把前端生成的内容存为文件：

```html
<a id="save" download="painting.png">下载我的画</a>
<script>
  document.getElementById("save").addEventListener("click", (e) => {
    e.target.href = document.querySelector("canvas").toDataURL();
  });
</script>
```

## `target`：在哪里打开

| 取值 | 行为 |
| --- | --- |
| `_self` | 当前上下文（**默认**） |
| `_blank` | 新标签 / 新窗口（由用户设置决定） |
| `_parent` | 父级浏览上下文（无父级则等同 `_self`） |
| `_top` | 最顶层上下文（用于跳出深层 iframe 嵌套） |
| 自定义名 | 指向同名窗口 / 框架，不存在则新建；**复用同一个**而非每次新开 |

```html
<a href="https://example.com" target="_blank" rel="noopener">外站（新标签）</a>
<!-- 自定义名：第一次点开新标签，再点会复用同一个标签 -->
<a href="help.html" target="helpwin">帮助</a>
```

自定义名与 `_blank` 的关键区别：`_blank` **每次都开新标签**，自定义名**复用同名标签**，能避免「点一次开一个、开一堆」。

## `rel` 与超链接安全（重点）

`rel` 声明「当前文档与目标资源的关系」，可空格分隔多值。其中两个与**安全**直接相关，是本叶的硬核知识点。

### 反向标签劫持（reverse tabnabbing）

历史上，用 `target="_blank"` 打开的新页面，可以通过 `window.opener` 反过来操控**原页面**——比如把你刚才那个标签悄悄重定向到一个仿冒登录页，等你切回来时已是钓鱼站。这就是「反向标签劫持」：

```html
<!-- 危险（在老浏览器里）：新页面可通过 window.opener 操控原页 -->
<a href="https://untrusted.com" target="_blank">外站</a>
```

修复办法是加 `rel="noopener"`，切断新页面对 `window.opener` 的访问：

```html
<a href="https://untrusted.com" target="_blank" rel="noopener">外站</a>
```

::: warning 现代浏览器已隐含，但仍建议显式写
现代浏览器（Chrome 88+ / Firefox 79+ / Safari 等）对 `target="_blank"` **已自动隐含 `rel="noopener"`**，新代码默认是安全的。但出于「向后兼容老浏览器」与「明确表达意图」，**仍建议显式写出 `rel="noopener"`**。指向不可信外站时再加上 `noreferrer`。
:::

### `noopener` vs `noreferrer`

| `rel` 值 | 作用 |
| --- | --- |
| `noopener` | 新页面拿不到 `window.opener`（防劫持），**但仍会发 `Referer` 头** |
| `noreferrer` | 既切断 `window.opener`（隐含 noopener），**又不发 `Referer`**（隐私） |

外链的稳妥写法：

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">外站</a>
```

### 其他常用 `rel` 值

| `rel` 值 | 含义 |
| --- | --- |
| `nofollow` | 别让搜索引擎追踪此链接（用户生成内容、广告、付费链接） |
| `external` | 指向外部站点 |
| `alternate` | 当前文档的替代版本（配 `hreflang` 标多语言、配 `type` 标 PDF / RSS） |
| `author` | 指向作者信息 |
| `me` | 指向「我」的另一处身份页（用于 IndieAuth / Mastodon 验证） |
| `bookmark` | 指向所在区块的永久链接 |
| `help` / `license` / `search` | 帮助 / 许可 / 搜索 |
| `prev` / `next` | 序列中的上一 / 下一篇（索引价值已很低） |
| `tag` | 标签 / 分类 |

```html
<!-- 用户评论里的外链：别给 SEO 权重 -->
<a href="https://user-site.com" rel="nofollow noopener" target="_blank">某用户的站点</a>
<!-- 多语言替代版本 -->
<a href="/en/" rel="alternate" hreflang="en">English</a>
```

## 其他实用属性

```html
<!-- 语言提示（仅提示，无功能） -->
<a href="/fr/" hreflang="fr">版本 française</a>
<!-- MIME 类型提示 -->
<a href="/feed.xml" type="application/rss+xml">RSS</a>
<!-- 引用来源策略（默认就是较安全的 strict-origin-when-cross-origin） -->
<a href="https://x.com/secret" referrerpolicy="no-referrer">不泄露来源</a>
```

`referrerpolicy` 控制跳转时发送多少来源信息，默认值 `strict-origin-when-cross-origin` 已较安全：同源发完整 URL，跨域只发源，降级（HTTPS→HTTP）则不发。

## 可访问性

### 链接文字要自解释

屏幕阅读器用户可以「列出页面全部链接」来快速导航——此时**只有链接文字本身**会被读出，脱离了上下文。所以「点这里 / 阅读更多 / here」毫无信息：

```html
<!-- 差：脱离上下文听不懂 -->
<p>了解我们的产品，<a href="/products">点这里</a>。</p>
<!-- 好：链接文字本身就说明了去向 -->
<p>了解 <a href="/products">我们的产品线</a>。</p>
```

### 新标签 / 下载要给用户提示

```html
<a href="https://wiki.org" target="_blank" rel="noopener">
  维基百科（在新标签打开）
</a>
```

用图标提示时，图标的 `alt` 要补足语义（如 `alt="(新标签打开)"`），否则图标加载失败信息就丢了。

### 别拿链接当按钮

`<a href="#" onclick="…">` 这种「假链接」会让屏幕阅读器困惑、键盘行为也不对。**导航**用 `<a href>`，**动作**（提交、切换、删除）用 `<button>`。也不要在 `<a>` 里嵌套按钮等可交互元素。

## 小结

`href` 决定「连到哪」（URL / 锚点 / 协议链接 / 下载），`target` 决定「在哪打开」，而 `rel`——尤其是 `noopener` / `noreferrer`——决定「安不安全」。配合自解释的链接文字，才是一个既好用又安全又无障碍的链接。下一页转向把多个项目组织起来的结构——列表：[列表三型](./lists)。
