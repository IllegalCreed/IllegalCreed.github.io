---
layout: doc
outline: [2, 3]
---

# 前端 DNS 优化

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **DNS 是首字节前的隐藏延迟**：每个**新域名首次**访问都要走一遍 DNS 解析（约 20~120ms），它发生在 TCP/TLS 握手之前，直接拉长资源到达的时间，且不在你的 JS 代码里、不易察觉。
- **`<link rel="dns-prefetch">`**：提前把某个域名解析成 IP，省掉将来请求时的那段 DNS 查询时间。**只做 DNS 这一步**，开销极小，对**跨域**资源域名才有意义。
- **`<link rel="preconnect">`**：更进一步——把 **DNS + TCP 握手 + TLS 握手**全部提前完成（HTTP 站只到 TCP），将来请求直接复用这条暖连接。能省 100~500ms，但更耗资源。
- **何时用哪个**：`preconnect` 用于**马上、确定**要用的关键域名，且数量要克制；`dns-prefetch` 用于**可能、稍后**会用到、或域名较多时的广撒网。
- **preconnect 必须克制**：浏览器会在约 **10 秒**内关闭未被使用的预连接；预连接太多会挤占带宽、拖慢真正关键的资源。一般只对 2~4 个最关键的第三方源用。
- **`crossorigin` 决定预连接是否「白做」**：以匿名模式抓取的资源（最典型是**字体** `@font-face`）走的是带 CORS 的独立连接，`preconnect` 不加 `crossorigin` 会连错连接，等于只省了 DNS。
- **回退写法（同域名同时上两条）**：`preconnect` + `dns-prefetch` 各写一行——支持 `preconnect` 的浏览器走全连接，不支持的至少吃到 DNS 预解析。
- **绝不要合并成一个 rel**：`rel="preconnect dns-prefetch"` 会触发 Safari 的 bug 取消掉 preconnect，务必拆成两条 `<link>`。
- **同源不用提示**：`preconnect`/`dns-prefetch` 对**同源**资源无收益（连接早已建立或正在建立），只对第三方/跨域域名有效。
- **域名收敛**：减少页面用到的不同域名数，就是减少要解析/握手的次数——能合并到自有 CDN 的资源尽量收敛，比逐个加提示更治本。
- **资源提示家族**：`dns-prefetch` < `preconnect` < `preload`/`prefetch`——前两者只「热身连接」，后两者才真正「下载内容」，按确定性与代价从轻到重选用。
- **HTTP 头也能下发**：`Link: <https://cdn.example.com>; rel=preconnect` 与 `<link>` 等效，可在响应头里更早地给出提示。

## A. DNS 解析为什么是前端性能问题

打开一个页面，浏览器拿到 HTML 后会去请求里面引用的各种资源——脚本、样式、图片、字体、接口数据。对其中**每一个新出现的域名**，在真正建立连接、发出请求之前，必须先把域名解析成 IP 地址。这一步就是 DNS 查询。

它的特点是「**隐形且靠前**」：DNS 解析排在 TCP 三次握手、TLS 握手**之前**，是访问新域名的第一道关卡（没解析出 IP 后面什么都做不了）；它不在你的业务代码里、性能面板上也易被忽略，但每次约 **20~120ms** 实打实加在首字节（TTFB）之前；而现代页面常引用十几个不同域名（统计、广告、字体、图床、CDN……），**首次**访问每个都各付一次 DNS 代价。

```text
访问一个新的 https 域名，连接前要经历：

  DNS 解析  →  TCP 三次握手  →  TLS 握手  →  发送请求 → 首字节
  (20~120ms)   (1 个 RTT)      (1~2 RTT)
  └─ dns-prefetch 提前的就是这一段 ─┘
  └────────── preconnect 提前的是这三段 ──────────┘
```

::: tip 为什么不能只靠浏览器自己优化
浏览器确实会缓存 DNS、复用连接，但它**只有在解析到 HTML 里的资源引用、或脚本动态发起请求那一刻**才知道要连哪个域名。资源提示（resource hints）的价值在于：让你**比浏览器更早**告诉它「待会儿要用这个域名」，把解析/握手提前到「HTML 还在下载、JS 还没执行」的空档里并行完成。
:::

::: warning 本页不讲缓存有效期与安全
DNS 解析结果能缓存多久（TTL）属于上一页 [DNS 缓存与 TTL](./dns-cache-ttl)；加密 DNS（DoH/DoT）与 DNS 层安全属于下一页 [DoH/DoT 与 DNS 安全](./doh-dot-security)。本页只聚焦**前端如何用资源提示和域名策略压低 DNS 带来的延迟**。
:::

## B. `<link rel="dns-prefetch">`：只提前解析 DNS

`dns-prefetch` 是一条**提示（hint）**：告诉浏览器「用户接下来很可能要用到这个源的资源，请先把它的域名解析了」。浏览器随即在后台抢先完成这个域名的 DNS 解析，将来真正请求该域名资源时，就省掉了那段解析时间。

```html
<head>
  <!-- 提前解析这些第三方域名 -->
  <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
  <link rel="dns-prefetch" href="https://cdn.example.com" />
  <link rel="dns-prefetch" href="https://api.analytics.com" />
</head>
```

它的定位是「**轻量、广撒网**」：

- **只做 DNS 这一步**，不碰 TCP/TLS，开销极小，多写几条也不太心疼。
- **适合「可能用到」的域名**：那些不一定马上请求、但稍后大概率会触达的第三方源（如埋点、社交分享、可能加载的图床）。
- **只对跨域有意义**：同源域名浏览器早已在解析/连接，提示是多余的。

::: tip 浏览器支持与降级
MDN 标注 `dns-prefetch` 为 **Baseline 2025**（2025 年 9 月起在主流浏览器新版本中广泛可用）。它本质是「提示」，老浏览器不识别时只是忽略这行 `<link>`，**不会报错、不会破坏页面**，可以放心写——拿不到优化但也没有副作用。
:::

## C. `<link rel="preconnect">`：DNS + TCP + TLS 全提前

`preconnect` 比 `dns-prefetch` 更进一步：它让浏览器对目标源**提前建立完整连接**——

- **HTTP 站点**：DNS 解析 + TCP 三次握手；
- **HTTPS 站点**：DNS 解析 + TCP 三次握手 + TLS 握手。

将来真正请求该源资源时，这条「暖连接」已经就绪，能省下整段连接建立时间（实测可快 **100~500ms**），效果比单纯 `dns-prefetch` 明显得多。

```html
<head>
  <!-- 马上要从这个 CDN 取关键资源，提前把连接建好 -->
  <link rel="preconnect" href="https://cdn.example.com" />
  <!-- 字体走匿名 CORS 抓取，必须带 crossorigin -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
</head>
```

它的定位是「**重、精准、克制**」：

- **代价更高**：占用一条真实连接（含 TLS 协商的计算与往返），不是免费的。
- **只用于「马上、确定」要用的关键源**：例如承载首屏关键 CSS、字体、首图的 CDN，或必然会调的核心接口域名。
- **数量必须克制**：浏览器会在约 **10 秒**内关掉一直没被使用的预连接；预连接铺太多反而挤占带宽、延迟真正关键的资源。经验上**只对 2~4 个最关键的第三方源**预连接。

::: warning crossorigin 漏了等于白连
这是 `preconnect` 最常见的坑。**以匿名模式（anonymous / CORS）抓取的资源**——最典型的就是 `@font-face` 加载的 Web 字体——会用一条**带 CORS 标记的独立连接**。如果 `preconnect` 没加 `crossorigin`，你提前建好的是「非 CORS 连接」，字体请求用不上它、得另起一条新连接，结果**只省下了 DNS、TCP/TLS 全白做**。

```html
<!-- 对字体源：必须加 crossorigin，否则预连接对字体无效 -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

判断原则：**该源上要抓的资源是否以 CORS/匿名模式请求**（字体、`fetch()`/XHR 默认跨域、带 `crossorigin` 的脚本与图片），是就加 `crossorigin`。
:::

## D. dns-prefetch vs preconnect：怎么选

二者是同一思路的**轻重两档**：`dns-prefetch` 只热身 DNS，`preconnect` 把整条连接热身好。

| 维度 | `dns-prefetch` | `preconnect` |
| --- | --- | --- |
| 提前完成的工作 | 仅 **DNS 解析** | **DNS + TCP + TLS**（HTTP 站到 TCP 为止） |
| 节省时间量级 | ~20~120ms（DNS 部分） | ~100~500ms（整段连接建立） |
| 资源开销 | 极小，几乎免费 | 较大，占用真实连接 + TLS 计算 |
| 适用场景 | **可能、稍后**会用到的域名 | **马上、确定**要用的**关键**域名 |
| 数量建议 | 可以多写（广撒网） | 严格克制（2~4 个最关键源） |
| 是否需要 crossorigin | 否（只做 DNS） | 抓 CORS/匿名资源（字体等）时**需要** |
| 浏览器支持 | Baseline 2025 | Baseline 2020（更早、更广） |

**选择口诀**：

- 这个域名**确定马上要用、且是关键路径**（首屏 CSS/字体/首图的 CDN、核心 API）→ 用 **`preconnect`**。
- 这个域名**只是有可能用到、或一次要覆盖很多个**（埋点、第三方挂件、备选图床）→ 用 **`dns-prefetch`**。
- 不确定时优先 `dns-prefetch`：它代价小、副作用低；`preconnect` 留给真正算得清收益的关键源。

::: tip 回退写法：同一域名两条都上，但绝不合并
想兼顾「新浏览器吃满 preconnect、老浏览器至少吃到 dns-prefetch」，对同一域名**分别写两行**：

```html
<link rel="preconnect" href="https://cdn.example.com" />
<link rel="dns-prefetch" href="https://cdn.example.com" />
```

支持 `preconnect` 的浏览器走全连接、忽略 dns-prefetch；不支持的回退到 DNS 预解析。

**切忌**把两个关键字塞进同一个 `rel`：

```html
<!-- 反例：会触发 Safari 的 bug，导致 preconnect 被取消 -->
<link rel="preconnect dns-prefetch" href="https://cdn.example.com" />
```
:::

## E. 域名收敛与资源提示家族

### 域名收敛：从源头减少解析次数

资源提示是在「既定的多域名」前提下抢时间；**域名收敛**则是直接减少域名数量，更治本：

- 页面引用的**不同域名越少**，需要解析/握手的次数就越少，也越少触发资源提示的管理负担。
- 能合并到**自有 CDN / 同一子域**的静态资源尽量收敛；第三方脚本能自托管的考虑自托管。
- 注意权衡：HTTP/2 之后**域名分片（domain sharding）反而是反模式**——把资源拆到多个子域会破坏连接复用、增加 DNS 与握手成本，与收敛背道而驰。

::: tip 收敛之后，提示更值钱
域名收敛与资源提示不冲突而是互补：先把域名收敛到少数几个关键源，再对这几个关键源精准 `preconnect`——少而准，正好契合 preconnect「数量必须克制」的要求。
:::

### 资源提示家族：从「热身连接」到「下载内容」

`dns-prefetch`/`preconnect` 属于一组 **资源提示（resource hints）**，按「确定性 + 代价」从轻到重排：

| 关键字 | 做什么 | 何时用 |
| --- | --- | --- |
| `dns-prefetch` | 只解析 DNS | 可能用到的跨域域名，广撒网 |
| `preconnect` | DNS + TCP + TLS 建连接 | 确定马上要用的少数关键源 |
| `preload` | **真正下载**当前页高优先级资源 | 本页必用、但发现得晚的资源（字体、关键 CSS/JS） |
| `prefetch` | 低优先级**下载**将来要用的资源 | 下一步导航**很可能**用到的资源，空闲时拉取 |

一句话区分：**前两者只「热连接」、不下载字节**；`preload`/`prefetch` 才真正把资源**下载**下来。本页聚焦的 DNS 优化只涉及前两者；`preload`/`prefetch` 的取舍属于资源加载优化的范畴。

::: tip 用 HTTP 响应头下发提示
资源提示不止能写在 `<link>` 里，也能用 HTTP 响应头 `Link` 给出，让浏览器**在解析 HTML 之前**就拿到提示、更早动手：

```http
Link: <https://cdn.example.com>; rel=preconnect
Link: <https://fonts.gstatic.com>; rel=preconnect; crossorigin
```
:::

## 小结

- **DNS 是首字节前的隐形延迟**：每个新域名首次访问都要解析（~20~120ms），排在 TCP/TLS 之前，逐域名累加，是值得前端主动优化的一环。
- **`dns-prefetch` = 只提前解析 DNS**：轻量、几乎免费、可广撒网，适合「可能、稍后」用到的跨域域名；老浏览器忽略而无副作用。
- **`preconnect` = 提前建好整条连接（DNS+TCP+TLS）**：省 100~500ms 但更耗资源，只用于「马上、确定」的关键源，数量克制（2~4 个），未用连接约 10 秒被回收。
- **两个高频坑**：抓字体等 CORS/匿名资源的 `preconnect` 必须加 `crossorigin`（否则白连）；同域名回退要写两条 `<link>`，**绝不能**合并成 `rel="preconnect dns-prefetch"`（Safari bug）。
- **治本靠域名收敛**：减少不同域名数比逐个加提示更根本，且 HTTP/2 后域名分片是反模式；资源提示家族按代价从轻到重为 `dns-prefetch` < `preconnect` < `preload`/`prefetch`。

> 解析结果能缓存多久、TTL 如何影响这些优化的命中，见上一页 [DNS 缓存与 TTL](./dns-cache-ttl)；DNS 查询本身的加密与安全（DoH/DoT、防劫持）见下一页 [DoH/DoT 与 DNS 安全](./doh-dot-security)。
