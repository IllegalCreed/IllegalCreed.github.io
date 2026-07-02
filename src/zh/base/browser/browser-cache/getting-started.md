---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **多层缓存**：浏览器发出的每个请求都会先过缓存层——**Service Worker（Cache API）→ memory cache → disk cache → 网络**；web.dev 原文：「浏览器发出的所有 HTTP 请求都会**先被路由到浏览器缓存**，检查是否有可用的有效缓存响应」。
- **disk cache 就是「HTTP 缓存」本体**：跨会话持久、遵守 RFC 9111 的新鲜度语义（`max-age`、`ETag` 那一套）。
- **memory cache**：渲染进程内存里的短命高速层，**同一标签页会话内**复用（典型：同页重复出现的图片），关标签页即失效。
- **Service Worker + Cache API**：开发者可编程的缓存层，**不遵守 HTTP 缓存头、不自动过期**，全靠代码做主。
- **bfcache（往返缓存）是另一维度**：不缓存「响应」，而是把**整页快照**（DOM + JS 堆）冻结在内存，前进/后退瞬时恢复。
- **「200 但没发请求」**：强缓存命中时 DevTools Network 显示**灰色 200**，Size 栏写 `(memory cache)` / `(disk cache)` / `(ServiceWorker)`——请求根本没出网络。
- **304 是「真请求」**：协商缓存命中时确实发了条件请求，服务端只回状态行和头、不回响应体，本地副本被「续命」。
- **push cache 已从「四级缓存」里除名**：HTTP/2 Server Push 已被 Chrome 106（2022）与 Firefox 132（2024）先后默认禁用。
- **分工**：`Cache-Control` / `ETag` / 强协商语义在[网络章](/zh/base/network/net-http-basics/guide-line/connection-range-caching)；本叶讲浏览器拿到头之后的**命中决策、缓存位置与清除**。
- **观察三开关**：Network 面板先开 **Preserve log** + **Big request rows**、确认 **Disable cache 没勾**，再谈判读。

## 一、一次请求要过几道缓存

在页面里写下一行 `<img src="/logo.png">`，这个请求从发起至拿到字节，中途有多次机会被「截住」：

| 顺序 | 缓存层 | 归谁管 | 一句话职责 |
| --- | --- | --- | --- |
| 1 | **Service Worker（Cache API）** | 开发者代码 | 若页面被 SW 控制，`fetch` 事件可拦截请求，用 `caches.match()` 直接回响应 |
| 2 | **memory cache（内存缓存）** | 浏览器（渲染进程） | 本标签页会话内刚用过的资源，直接从内存复用，快到近乎 0ms |
| 3 | **disk cache（磁盘缓存）** | 浏览器（网络栈） | 即「HTTP 缓存」：按 `Cache-Control` 等语义判定新鲜/陈旧，跨会话持久 |
| 4 | **网络** | — | 以上全 miss（或需要协商验证）才真正出网 |

三点关键认知：

1. **每层「归属」不同**：Cache API 归你管（代码写什么就存什么），memory/disk cache 归浏览器管（你只能通过 HTTP 头影响它，不能编程读写）。
2. **每层「寿命」不同**：memory cache 随标签页关闭蒸发；disk cache 跨重启存活；Cache API 里的条目**不删就一直在**。
3. **bfcache 不在这条链上**：它作用于「整页导航」而非「单个资源请求」，是前进/后退专用的整页内存快照——和上表是两个维度的东西（详见 [bfcache](./guide-line/bfcache)）。

> 老文章里的「四级缓存」还有一层 **push cache**（HTTP/2 Server Push 推来的资源暂存区）。这一层已随 Server Push 的移除成为历史——Chrome 106 起默认禁用，Firefox 132 跟进，理由与考古见[多层缓存总览](./guide-line/cache-layers)。

## 二、「Network 显示 200 但没发请求」解剖

打开 DevTools Network，二次访问一个页面，常见三种「看起来都成功」的行：

| 现象 | Status | Size 栏 | 真相 |
| --- | --- | --- | --- |
| 灰色 200 | `200` | `(memory cache)` 或 `(disk cache)` | **没发请求**：强缓存命中，浏览器直接用本地副本回给页面 |
| 灰色 200 | `200` | `(ServiceWorker)` | **没出网络**：SW 的 `fetch` 事件用 Cache API 里的副本响应 |
| 正常 304 | `304` | 几百字节 | **真发了请求**：条件请求出网，服务端答「没变」，只传头不传体 |

为什么会有「假 200」？因为 HTTP 缓存的设计是**对页面透明**的：资源新鲜（fresh）时浏览器直接兑现本地副本，页面代码感知到的仍是一次成功响应，DevTools 便记一条 200，再用 Size 栏标注真实来源。判定链条是：

1. 浏览器查缓存中是否有该 URL 的副本；
2. 有，且按 `max-age` 等指令**仍新鲜** → 直接用，**不发请求**（灰色 200）；
3. 有，但**已陈旧（stale）** → 自动带上 `If-None-Match` / `If-Modified-Since` 发**条件请求**——web.dev 原文：这些条件头「由浏览器根据它对 HTTP 缓存当前值的理解自动带上」；服务端没变则 `304` 续命，变了则 `200` 给新副本;
4. 没有副本 → 正常出网。

::: tip 判读口诀
**Size 栏有括号 = 没花流量；Status 304 = 花了一个来回但没花响应体。** 排查「用户拿到旧版」时，第一眼永远先看 Size 栏——它告诉你旧资源是从哪一层来的，才能决定去清哪一层。
:::

::: tip 观察前先拨好三个开关
1. **Preserve log**：跨导航保留请求记录，不然一跳转证据就没了；
2. **Big request rows**：Size 栏显示两行（传输量 / 资源真实大小），缓存效果一目了然；
3. **确认 Disable cache 没勾着**——勾着它你永远观察不到缓存命中（它只在 DevTools 打开期间生效，也常是「本地怎么都不命中」的元凶）。
:::

### 高频三连问

- **「缓存命中的 200，JS 还会执行吗？」** 会。缓存兑现的是与当年网络响应字节相同的副本，解析、执行、渲染一切照旧——缓存只是省了「传输」，没省「使用」。
- **「我都强制刷新了怎么还是旧的？」** 强制刷新穿透的是 HTTP 缓存（memory/disk），**穿不透 Service Worker**——SW 的 `fetch` 事件照样拦截并回旧副本。看 Size 栏是不是 `(ServiceWorker)`，是就去 [SW 缓存](./guide-line/sw-cache-api)那页找版本化收尸的答案。
- **「304 算缓存命中吗？」** 算「协商缓存」命中：请求真的出网了（花一个往返 + 头部字节），但响应体没传，本地副本被续命——它省的是**带宽**而非**延迟**。这也是为什么高频小资源与其依赖 304，不如给足 `max-age` 直接零请求。

## 三、二次访问的完整时间线

把上面串成一次真实的「昨天来过、今天再来」：

1. **HTML 入口**（配了 `no-cache`）：磁盘里有副本但每次必须协商 → 浏览器带 `If-None-Match` 出网 → 服务端答 `304` → 用本地 HTML，只花了头部往返；
2. **带哈希的 `app.3f2a.js`**（配了 `max-age=31536000, immutable`）：新鲜期内 → **不发请求**，Size 栏 `(disk cache)`；
3. **页面里出现 6 次的 `sprite.png`**：第一次 `(disk cache)`，其余 5 次 `(memory cache)`——磁盘副本进内存后同文档复用；
4. **SW 控制的接口 `GET /api/config`**：SW `fetch` 事件里 `caches.match` 命中 → Size 栏 `(ServiceWorker)`，网络零参与；
5. 用户点去第三方页又**按后退回来**：整页从 **bfcache** 解冻——以上四步一步都不用重来，连 JS 都不重新执行。

同一次「重访」，五种资源各命中一层。**缓存排查的本领 = 能对每一行 Network 记录说出它命中的是哪层、为什么。**

## 四、与网络章「HTTP 缓存首部」的分工

本库把 HTTP 缓存拆成了「协议语义」和「浏览器落地」两半，避免重复也避免断层：

| 问题 | 属于哪半 | 去哪读 |
| --- | --- | --- |
| `max-age` / `no-cache` / `no-store` / `immutable` 各是什么意思 | 协议语义 | [网络章 · 缓存首部](/zh/base/network/net-http-basics/guide-line/connection-range-caching) |
| `ETag` 强弱验证器、304 的语义 | 协议语义 | 同上 |
| 新鲜/陈旧判定后浏览器**怎么走**、副本存内存还是磁盘 | 浏览器落地 | 本叶 [HTTP 缓存的浏览器侧落地](./guide-line/http-cache-landing)、[内存缓存与磁盘缓存](./guide-line/memory-disk-cache) |
| 普通刷新和强制刷新有什么区别、各带什么头 | 浏览器落地 | [HTTP 缓存的浏览器侧落地](./guide-line/http-cache-landing) |
| 缓存怎么看、怎么清（DevTools / Clear-Site-Data / 用户清数据） | 浏览器落地 | [观测与清除](./guide-line/cache-observe-clear) |
| HTTP/2 Server Push 的协议机制本身 | 协议演进 | [网络章 · HTTP 演进](/zh/base/network/net-http-evolution/)（本叶只讲 push cache 之死） |

一句话：**网络章管「头是什么意思」，本叶管「浏览器拿到头之后干了什么」。**

## 五、入门期最常见的五个误区

| 误区 | 纠正 | 展开 |
| --- | --- | --- |
| 「`no-cache` = 不缓存」 | 是「存但每次协商」；真不存是 `no-store` | [网络章](/zh/base/network/net-http-basics/guide-line/connection-range-caching) |
| 「让用户强制刷新就能拿到新版」 | 强刷穿不透 SW 缓存，且没有用户会强刷；根治靠资源版本化 | [HTTP 落地](./guide-line/http-cache-landing) |
| 「304 反正没传内容，等于免费」 | 它仍花一个完整网络往返；高频资源应给足 `max-age` 做到零请求 | [HTTP 落地](./guide-line/http-cache-landing) |
| 「SW 缓存是 HTTP 缓存的加强版」 | 是完全另一套：不看 HTTP 头、不过期，忘清理即事故 | [SW 缓存](./guide-line/sw-cache-api) |
| 「后退很快是因为缓存了 HTML」 | 多半是 bfcache 恢复了整页快照，连 JS 执行都省了 | [bfcache](./guide-line/bfcache) |

## 六、本叶路线

- 先立骨架：[多层缓存总览](./guide-line/cache-layers)把层级、归属、优先级一次说清，顺带给 push cache 发讣告；
- 再拆浏览器自管的两层：[内存缓存与磁盘缓存](./guide-line/memory-disk-cache)；
- 然后回答日常最高频的困惑：[HTTP 缓存的浏览器侧落地](./guide-line/http-cache-landing)——四种刷新到底差在哪；
- 两个「特殊物种」各占一页：[bfcache](./guide-line/bfcache)（整页快照）与 [Service Worker 缓存](./guide-line/sw-cache-api)（可编程缓存）；
- 最后是工具箱：[观测与清除](./guide-line/cache-observe-clear)与[参考](./reference)速查表。

从[多层缓存总览](./guide-line/cache-layers)开始。
