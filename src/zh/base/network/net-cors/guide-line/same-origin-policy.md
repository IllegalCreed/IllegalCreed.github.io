---
layout: doc
outline: [2, 3]
---

# 同源策略与「源」的定义

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **同源策略（Same-Origin Policy, SOP）** 是浏览器最核心的安全模型：限制一个「源」加载的文档/脚本去**读取**另一个「源」的资源，防恶意站点窃取你在其他站点的数据。
- **「源（origin）」= 协议 + 域名 + 端口**三元组，三者**全部相同**才算同源；少一个相同都是跨源。比较的是 URL 的 scheme/host/port，**路径不参与**判定。
- 默认端口算同源：`http://a.com` 与 `http://a.com:80`、`https://a.com` 与 `https://a.com:443` 都同源（端口省略 = 协议默认端口）。
- 不同源的三种典型：协议不同（`http` vs `https`）、域名不同（`a.com` vs `www.a.com`，**子域也算不同**）、端口不同（`:80` vs `:8080`）。
- SOP 主要拦三类**读取**：跨源 **DOM** 访问（读另一窗口/iframe 的文档内容）、读取跨源 **AJAX/fetch 响应体**、读取跨源的 **Cookie / localStorage / IndexedDB**。
- **不受 SOP 限制**的跨源**嵌入与写入**：`<img>` / `<script>` / `<link>` / `<video>` / `<audio>` / `@font-face` / `<iframe>` 等标签可跨源加载，表单可跨源提交，超链接 / 重定向可跨源跳转——能用、但脚本**读不到**其内容。
- 「能加载」≠「能读」：跨源 `<script>` 会**执行**、跨源 `<img>` 会**显示**，但 JS 拿不到其源码/像素（画到 canvas 后 canvas 被「污染」，`getImageData` 报错）。
- 「跨域（cross-origin）」与「跨站（cross-site）」是两把不同的尺子：跨域按**源**（协议+域名+端口）算，跨站按**站点（site）= eTLD+1**（可注册域）算，比跨域**更宽松**。
- 站点（site）由 **公共后缀列表（Public Suffix List）** 决定 eTLD：`https://www.example.com` 的站点是 `example.com`；`login.example.com` 与 `www.example.com` **跨源但同站**。
- 现代「同站」含协议（schemeful same-site）：`http://www.example.com` 与 `https://www.example.com` 算**跨站**。
- 突破 SOP 的合法手段：**CORS**（让服务端授权跨源读取，→ 第 3 页）、`postMessage`（跨窗口通信）、反向代理（→ 第 5 页）；`document.domain` 放宽已废弃，勿用。
- 沙箱 iframe、`file:` 等场景会得到**不透明源（opaque origin）**，序列化为 `null`，与任何源（含其他不透明源）都不相等。

## 什么是同源策略：浏览器的安全基石

**同源策略（Same-Origin Policy, SOP）** 是浏览器内置、默认开启的一套安全机制：它限制由某个「源」加载的文档或脚本，去**读取**或**操作**来自另一个「源」的资源。它是 Web 安全的地基——几乎所有浏览器侧的隔离（Cookie 隔离、DOM 隔离、存储隔离）都建立在「源」这个边界之上。

为什么必须有它？设想没有 SOP 的世界：你在 `bank.com` 登录后，另开一个标签页访问了恶意站点 `evil.com`。`evil.com` 的脚本只要 `fetch('https://bank.com/account')`，就能带着你的 Cookie 读到你的账户页面、转账接口返回的数据——你的所有登录态都会被任意站点收割。SOP 的存在，就是把每个源的脚本**关进自己的笼子**：可以向别人发请求，但默认**读不到别人的响应、Cookie 和 DOM**。

::: tip 一句话定位
SOP 的核心不是「不让你发请求」，而是「**不让你读跨源的响应内容**」。请求往往照常发出（服务端也可能照常处理），只是浏览器在把响应交给你的脚本前拦了一道——这点决定了它**防不住** CSRF（写操作），需要配合 SameSite Cookie（→ 第 6 页）。
:::

## 「源」的定义：协议 + 域名 + 端口

**源（origin）** 由 URL 的三个部分共同决定：

| 组成 | 英文 | 例子 |
| --- | --- | --- |
| 协议（方案） | scheme / protocol | `http`、`https` |
| 域名（主机） | host / hostname | `store.company.com` |
| 端口 | port | `80`、`443`、`8080` |

**只有这三者全部相同，两个 URL 才同源。** 路径（path）、查询串（query）、片段（hash）都**不影响**源的判定。端口省略时取协议默认端口（`http` → 80，`https` → 443）。

### 同源判定表

以基准 URL **`http://store.company.com/dir/page.html`** 为参照（出自 MDN 经典示例）：

| 对比 URL | 是否同源 | 原因 |
| --- | --- | --- |
| `http://store.company.com/dir2/other.html` | ✅ 同源 | 仅路径不同 |
| `http://store.company.com/dir/inner/another.html` | ✅ 同源 | 仅路径不同 |
| `https://store.company.com/secure.html` | ❌ 跨源 | 协议不同（https ≠ http） |
| `http://store.company.com:81/dir/etc.html` | ❌ 跨源 | 端口不同（81 ≠ 默认 80） |
| `http://news.company.com/dir/other.html` | ❌ 跨源 | 域名不同（news ≠ store） |

再补两组对照（出自 MDN Glossary）：

| 对比组 | 是否同源 | 原因 |
| --- | --- | --- |
| `http://example.com:80` vs `http://example.com` | ✅ 同源 | 80 是 http 默认端口，等价 |
| `http://example.com` vs `http://www.example.com` | ❌ 跨源 | 主机名不同（裸域 ≠ www 子域） |

::: warning 三个高频踩坑
1. **`localhost` 与 `127.0.0.1` 跨源**——主机名字面不同，即便指向同一台机器；前端开发联调时尤其要统一。
2. **子域之间跨源**——`a.example.com` 和 `b.example.com` 不同源，企业内多子域应用互调一样受限。
3. **协议升级即跨源**——同一域名从 `http` 切到 `https`，源就变了，混用易触发跨源/混合内容问题。
:::

## SOP 限制了哪些操作

SOP 管控的核心是**跨源「读取」**。具体落到三类资源：

### ① 跨源 DOM 访问

脚本无法读取**不同源**窗口或 `<iframe>` 内的文档内容。比如父页面 `a.com` 内嵌了 `b.com` 的 iframe，父页面 JS 去访问 `iframe.contentWindow.document.body` 会被拦截抛错。跨窗口只保留极有限的「写/导航」接口（如 `window.postMessage()`、`window.location` 写入、`window.close()`），**读 DOM 一律不行**。

### ② 读取跨源 AJAX / fetch 响应

这是前端最常撞墙的一类。`fetch()` / `XMLHttpRequest` 向跨源地址发请求时，请求**可能照常送达服务端**，但浏览器默认**不把响应体交给你的脚本**——除非服务端用 **CORS** 响应头（如 `Access-Control-Allow-Origin`）明确授权（机制详见第 3、4 页）。

### ③ 读取跨源 Cookie / 存储

每个源的 **Cookie、localStorage、sessionStorage、IndexedDB** 都按源隔离：`a.com` 的脚本读不到 `b.com` 的 `localStorage`，也访问不了 `b.com` 的 Cookie。这保证了你在不同站点的会话与本地数据互不串味。

## 哪些操作不受 SOP 限制

SOP 限制的是「读」，对很多跨源的**嵌入（embed）与写入（write）** 是放行的——这也是为什么页面能加载 CDN 上的图片和脚本：

- **跨源嵌入资源**：`<img src>`、`<script src>`、`<link rel="stylesheet">`、`<video>` / `<audio>`、`@font-face` 字体、`<object>` / `<embed>`、`<iframe>`（可加载，但脚本读不到其 DOM）。
- **表单跨源提交**：`<form action="https://other.com">` 可以提交到任意源。
- **超链接与重定向**：跨源跳转、`<a href>`、重定向都不受限。

::: info 关键区分：能「加载」不等于能「读」
跨源 `<script>` 会被**执行**、跨源 `<img>` 会被**显示**，但你的 JS **拿不到**它们的源码或像素数据。典型例证：把跨源图片画进 `<canvas>` 后，canvas 会被标记为「**已污染（tainted）**」，再调 `getImageData()` 就会抛安全错误——浏览器允许「看」，但不允许脚本「读出内容」。也正因为「跨源写/嵌入」被放行，才有了 CSRF 这类攻击，需要 SameSite Cookie 等手段额外防护（→ 第 6 页）。
:::

## 跨域（origin）≠ 跨站（site）

「跨域」和「跨站」是两个**容易混用**但定义不同的概念，分别对应两把尺子：

| 维度 | 跨域（cross-origin） | 跨站（cross-site） |
| --- | --- | --- |
| 比较单位 | **源** = 协议 + 域名 + 端口 | **站点（site）** = 协议 + eTLD+1（可注册域） |
| 严格程度 | 更严格 | 更宽松 |
| 子域 | 不同子域 = 跨域 | 不同子域 = **同站** |
| 端口 | 不同端口 = 跨域 | 不同端口 = **同站** |
| 用在哪 | SOP / CORS 判定 | Cookie 的 `SameSite`、COOP/COEP 等 |

**站点（site）** 取的是「可注册域」，即 **eTLD+1**：`eTLD`（有效顶级域）由 [公共后缀列表](https://publicsuffix.org/) 决定（如 `.com`、`.co.uk`、`.github.io` 都是公共后缀），`eTLD+1` 就是在它前面再加一级。所以 `https://www.example.com` 的站点是 `example.com`。现代定义还**带上协议**（schemeful same-site，2019 年起）：`http` 与 `https` 算跨站。

以基准 **`https://www.example.com`** 为参照（出自 web.dev）：

| 对比 URL | 同源？ | 同站？ | 说明 |
| --- | --- | --- | --- |
| `https://www.example.com:443` | ✅ 同源 | ✅ 同站 | 443 是 https 默认端口，完全一致 |
| `https://login.example.com` | ❌ 跨源 | ✅ 同站 | 子域不同 → 跨源；eTLD+1 相同 → 同站 |
| `https://www.example.com:80` | ❌ 跨源 | ✅ 同站 | 端口不同 → 跨源；站点不看端口 → 同站 |
| `http://www.example.com` | ❌ 跨源 | ❌ 跨站 | 协议不同 → 跨源，且 schemeful 下跨站 |
| `https://www.evil.com` | ❌ 跨源 | ❌ 跨站 | 可注册域不同 |

::: tip 记忆口诀
**同源一定同站，同站未必同源。** 子域和端口的差异会让两个 URL「跨源但同站」——这正是为什么 `SameSite=Lax` 的 Cookie 能在 `www.a.com` 与 `api.a.com` 之间携带，但 CORS 仍把它们当跨源拦着。两套规则服务于不同目的，别混为一谈。
:::

## 小结

- **同源策略**是浏览器默认开启的安全地基，核心作用是**阻止脚本读取跨源资源**，防止恶意站点窃取你在其他站点的数据。
- **「源」= 协议 + 域名 + 端口**三元组，三者全等才同源；路径不参与判定，默认端口可省略。
- SOP 主要拦三类**读取**：跨源 DOM、跨源 AJAX/fetch 响应、跨源 Cookie/存储；而跨源**嵌入与写入**（`<img>`/`<script>`/`<link>`/`<iframe>`、表单提交、跳转）被放行——「能加载 ≠ 能读」。
- **跨域**（按源）比**跨站**（按 eTLD+1）更严格：同源必同站，同站未必同源，二者服务于不同机制。
- 合法突破 SOP 的手段是 CORS、`postMessage`、反向代理，而非关闭 SOP。

下一页进入实战：[跨域常见场景与报错排查](./cross-origin-scenarios)，看看跨源限制在真实项目里以什么样的报错暴露出来，以及如何快速定位。
