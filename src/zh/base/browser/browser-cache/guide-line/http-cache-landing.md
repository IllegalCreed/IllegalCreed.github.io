---
layout: doc
outline: [2, 3]
---

# HTTP 缓存的浏览器侧落地

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **命中流程**：所有请求先进浏览器缓存查副本——**新鲜（fresh）→ 直接兑现不发请求**（灰色 200）；**陈旧（stale）→ 自动带条件头协商**（`304` 续命 / `200` 换新）；无副本 → 出网。
- **条件头是浏览器自动带的**：`If-None-Match` / `If-Modified-Since` 由浏览器按缓存里的 `ETag` / `Last-Modified` 自动附上，业务代码无感。
- **地址栏回车 / 点链接**＝正常导航：完整走缓存规则，新鲜资源**一个请求都不发**。
- **普通刷新（F5 / ⌘R）**：只对**主文档**强制重验证——Chrome 带 `Cache-Control: max-age=0` + 条件头；Firefox 只带条件头；Safari 带 `no-cache`；**子资源照常走缓存规则**（Chrome 2017「Reload, reloaded」改革）。
- **强制刷新（⌘⇧R / Ctrl+Shift+R）**：主文档 + **全部子资源**都带 `Cache-Control: no-cache` + `Pragma: no-cache`，**不带条件头 → 不可能 304**，全量重下。
- **DevTools「Disable cache」**：仅 DevTools 打开期间禁用 HTTP 缓存；**不禁用** Service Worker 的 Cache API。
- **请求方向的指令语义**：`max-age=0`＝「陈旧了，请重验证」（无法验证时缓存仍可兜底）；`no-cache`＝「必须验证成功才准用缓存」，更严格。
- **`no-store` 波及面**：HTTP 缓存（memory/disk）不存；bfcache 历史上被它阻断（Chrome 2025 起有条件放宽）；**SW Cache API 完全不理它**，照样能存。
- **没写头 ≠ 不缓存**：web.dev 原文「省略 `Cache-Control` 响应头并不会禁用 HTTP 缓存」——浏览器会启发式缓存，务必显式声明。
- **缓存键不只是 URL**：响应带 `Vary` 时，匹配副本还要比对所列请求头的值——同一 URL 可存多份、也可能「缓存过却不命中」。

## 一、浏览器侧的命中流程

首部语义（`max-age`、`ETag`、强/协商缓存概念）在[网络章](/zh/base/network/net-http-basics/guide-line/connection-range-caching)已经讲透，本页从「浏览器拿到头之后」接着走。web.dev 的表述是：**「浏览器发出的所有 HTTP 请求都会先被路由到浏览器缓存**，检查是否有可用于兑现请求的有效缓存响应」。完整决策：

1. **查副本**：缓存（memory/disk，见[内存缓存与磁盘缓存](./memory-disk-cache)）里有没有这个 URL 的条目？没有 → 出网，按响应头决定是否入库。
2. **判新鲜**：有副本，比较年龄与新鲜期（`Age` vs `max-age`）——**新鲜 → 直接兑现，请求不出网**，DevTools 记灰色 200 + `(disk cache)`/`(memory cache)`。
3. **陈旧 → 协商**：浏览器**自动**把缓存里的验证器带上条件头（`ETag` → `If-None-Match`，`Last-Modified` → `If-Modified-Since`）发条件请求：
   - 服务端答 `304 Not Modified` → 不传响应体，本地副本按新响应头**续命**（刷新新鲜期），继续用；
   - 服务端答 `200` → 新副本替换旧条目。
4. **没有验证器的陈旧副本** → 只能当无缓存处理，完整重下。

两个影响「查副本」环节的细节：

- **缓存键不只是 URL**：响应若带 `Vary`（如 `Vary: Accept-Encoding, Origin`），浏览器匹配副本时会连这些请求头的值一起比对——同一 URL 因请求头不同可存多份副本，也可能因此「明明缓存过却不命中」。
- **副本存哪由浏览器定**：内存还是磁盘不归 HTTP 语义管，是启发式分配（见[内存缓存与磁盘缓存](./memory-disk-cache)）。

::: tip 启发式缓存：不写头也会被缓存
web.dev 原文：「**省略 `Cache-Control` 响应头并不会禁用 HTTP 缓存！**浏览器会针对内容类型猜测最合适的缓存行为」。生产事故常出在这里——「我没设缓存啊」的接口/页面被启发式缓存住。结论：**每个响应都显式声明 `Cache-Control`**，要么给新鲜期，要么 `no-cache`/`no-store` 说清楚。
:::

## 二、四种进入方式的行为差异

同一个 URL，「怎么到达」决定了穿透到哪一层。下表为 2025-03 实测行为（[csswizardry 考据](https://csswizardry.com/2025/03/why-do-we-have-a-cache-control-request-header/)）：

| 进入方式 | 主文档请求头 | 子资源 | 能否 304 |
| --- | --- | --- | --- |
| **地址栏回车 / 点链接**（正常导航） | 无特殊缓存头，完整走缓存规则 | 完整走缓存规则（新鲜则不发请求） | 陈旧时可 |
| **普通刷新** F5 / ⌘R | Chrome：`Cache-Control: max-age=0` + 条件头；Firefox：仅条件头；Safari：`Cache-Control: no-cache` + `Pragma: no-cache`（无条件头） | **照常走缓存规则**，不连坐 | 主文档：Chrome/Firefox 可，Safari 不可 |
| **强制刷新** ⌘⇧R / Ctrl+Shift+R | `Cache-Control: no-cache` + `Pragma: no-cache`（三家一致） | **同主文档**，全部 `no-cache`，不带条件头 | **不可能**——csswizardry 原文「没有浏览器带验证头，304 无从谈起」，全量重下 |
| **DevTools 勾 Disable cache 后刷新** | 请求绕过 HTTP 缓存 | 全部绕过 HTTP 缓存 | 否（不查本地副本） |

几个值得咀嚼的细节：

- **普通刷新只「怀疑」主文档**。用户按刷新通常意味着「怀疑这页旧了/坏了」，于是浏览器强制重验证 HTML 本身；子资源自 Chrome 2017 年[「Reload, reloaded」](https://blog.chromium.org/2017/01/reload-reloaded-faster-and-leaner-page_26.html)改革起不再连坐（此前刷新会重验证所有子资源，改革后按 Chromium [loading-dev 公告](https://groups.google.com/a/chromium.org/g/loading-dev/c/LpgNPCMEg1I)的灰度数据，304 验证请求减少约一半）。**推论：给静态资源配了长 `max-age`，用户普通刷新也不会打爆你的 304。**
- **三家浏览器普通刷新的「狠劲」不同**：Firefox 最温和（只带条件头，能 304 就 304）；Chrome 居中（`max-age=0` 表达「视作陈旧、请重验证」）；Safari 最激进（直接 `no-cache` 且不带验证器，主文档必然全量重下）。
- **`Pragma: no-cache`** 是 HTTP/1.0 时代的兼容遗产，与 `Cache-Control: no-cache` 成对出现，照顾极老的中间缓存。
- **移动端没有「强刷」手势**：下拉刷新等价于普通刷新——所以「让用户强制刷新」在移动端连操作入口都不存在，又多一条「根治靠版本化 URL」的理由。

### immutable：对「刷新」的定向豁免

`Cache-Control: immutable` 的诞生就是为了驯服刷新：它向浏览器承诺「新鲜期内内容**绝不改变**」，于是**普通刷新也不必对它发起重验证**。历史脉络很有意思：Firefox 走的是「实现 `immutable` 指令、逐资源豁免」路线（Facebook 推动）；Chrome 走的是「干脆改掉刷新行为、子资源一律不连坐」路线（上面的 Reload, reloaded）——殊途同归。今天给哈希资源写 `max-age=31536000, immutable` 依然是最佳实践：在尊重该指令的浏览器里精确豁免，在 Chrome 里也无害。

### 请求方向的 max-age=0 vs no-cache

这两个指令出现在**请求**头里时是浏览器对沿途缓存（本地 + 代理）说话：

- `max-age=0`：「把响应当作已陈旧处理，请重验证」——但若验证不可达，缓存**仍可**复用副本兜底；
- `no-cache`：「**必须**验证成功才能把缓存副本给我」，验证失败宁可报错——语义更严格，所以强制刷新用它。

## 三、`Cache-Control: no-store` 对多层的影响

`no-store`（语义：任何缓存都不得存储）在浏览器各层的真实落地并不一刀切：

| 层 | 受 `no-store` 影响？ | 说明 |
| --- | --- | --- |
| disk cache | **是** | 完全不写入磁盘 |
| memory cache | **是**（目标行为） | 不应保存；但它是实现细节，别把安全性押在这上面 |
| **bfcache** | **历史上阻断，Chrome 已有条件放宽** | 见下方详述——bfcache 存的是页面快照不是响应，语义上本就不是 RFC 9111 管的「缓存」 |
| **SW Cache API** | **否** | Cache API **不看任何 HTTP 缓存头**——SW 代码 `cache.put()` 什么就存什么。敏感响应要防 SW 缓存，得靠代码约定，响应头拦不住 |

bfcache 放宽详情：带 `Cache-Control: no-store` 的页面历史上一律不进 bfcache；Chrome 自 116 起实验、[2025 年 3~4 月全量](https://developer.chrome.com/docs/web-platform/bfcache-ccns)改为「有条件允许进入」——**Cookie 或其他授权凭据发生变化即逐出**、页面内 fetch/XHR 的响应若也带 `no-store` 即逐出，且此类页面的 bfcache 存活时限从常规的 10 分钟压到 **3 分钟**。完整规则见 [bfcache](./bfcache)。

## 四、判走向速练：响应头 × 进入方式

把前三节合成一张「看头断案」表（副本已在缓存中，均为 Chrome 行为）：

| 响应头 | 正常导航 | 普通刷新 | 强制刷新 |
| --- | --- | --- | --- |
| `max-age=31536000, immutable`（哈希资源） | 新鲜期内**零请求**（`(disk cache)`/`(memory cache)`） | 子资源不连坐，**零请求** | 全量重下（200） |
| `no-cache` + `ETag`（HTML 入口） | 每次条件请求 → 通常 `304` | 主文档 `max-age=0`+条件头 → `304`/`200` | 全量重下（200） |
| `max-age=600`（短新鲜期接口） | 10 分钟内零请求，过期后协商 | 主文档才强制验证；作为子请求走左列规则 | 全量重下 |
| `no-store` | **每次全量重下**，永不入缓存 | 同左 | 同左 |
| 什么都没写 | **启发式缓存**接管——行为不可预期 | 视启发式副本状态 | 全量重下 |

会读这张表，就能反向定位：「用户明明刷新了还是旧页」→ 查主文档是否被配了长 `max-age`（普通刷新只重验证主文档一层，若 HTML 本身命中强缓存的路径被绕过，问题多半在别层——SW 或代理）。

## 五、实战：部署新版后用户拿到旧页面

最经典的缓存事故链：**HTML 入口被配了长 `max-age`**（或被启发式缓存），于是用户手里的旧 HTML 一直引用旧哈希的 JS/CSS——你怎么发版都无效。排查与根治：

1. **先判层**：让用户（或自己复现）看 Network Size 栏——旧 HTML 来自 `(disk cache)` 说明是 HTTP 缓存层问题；来自 `(ServiceWorker)` 则去查 SW 缓存版本化（见 [SW 缓存](./sw-cache-api)）。
2. **明白「强刷只能救自己」**：你按 ⌘⇧R 看到新版 ≠ 用户看到新版——用户不会强刷，普通刷新虽会重验证主文档，但**新鲜期内的正常导航连请求都不发**。
3. **根治靠正确分工**（web.dev 推荐配方）：
   - 带哈希的静态资源：`Cache-Control: max-age=31536000, immutable`——URL 变即新资源，缓存一年也安全；
   - HTML 入口等无版本 URL：`Cache-Control: no-cache`（存但每次协商，配 `ETag` 走 304）——发版后下一次导航即拿到新 HTML；
   - 服务端已错发长缓存的止血：改对响应头后，等旧副本自然过期，或上 [`Clear-Site-Data: "cache"`](./cache-observe-clear)（注意其兼容性坑）。

::: warning SPA 的隐蔽变体：fallback 路由返回的 HTML
SPA 常把所有深链接 rewrite 到 `index.html`。检查缓存头时别只看 `/`——**每一条 fallback 路由返回的 HTML 响应都得是 `no-cache`**。静态托管平台对 rewrite 响应的默认缓存策略各不相同，`curl -sI https://example.com/some/deep/route` 逐条核对最稳。
:::
4. **别忘了链路上的共享缓存**：CDN/代理的缓存不归浏览器管，本叶不展开，但排查时要意识到 `(disk cache)` 之外还有服务侧的层。

## 小结

- 浏览器侧流程三步走：**查副本 → 判新鲜（fresh 直接兑现不发请求）→ 陈旧自动带条件头协商**（304 续命/200 换新）；没写 `Cache-Control` 也会被启发式缓存。
- 四种进入方式穿透力递增：**正常导航**（全走缓存）→ **普通刷新**（只重验证主文档，三家浏览器带头不同，子资源不连坐）→ **强制刷新**（全资源 `no-cache` + `Pragma`，无验证器必全量）→ **Disable cache**（HTTP 缓存整体旁路，但不含 SW）。
- `no-store` 管得住 HTTP 缓存，管不住 SW 的 Cache API；对 bfcache 从「一票否决」演进为 Chrome 的「有条件放行 + Cookie 变化即逐出 + 3 分钟时限」。
- 用户拿旧版的根治之道是**资源分工**：哈希 URL 配一年 `immutable`，HTML 配 `no-cache` 走 304——强刷只能救开发者自己。
