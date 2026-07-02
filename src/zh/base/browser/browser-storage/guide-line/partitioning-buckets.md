---
layout: doc
outline: [2, 3]
---

# 存储分区与 Storage Buckets

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **存储分区（storage partitioning）**：第三方 iframe 里的存储不再只按源隔离，而是按 **「源 + 顶级站点」双键**切分——防跨站追踪
- 同一个 `widget.example` iframe 嵌在 A 站和 B 站，读写的是**两份互不相通的存储**；与用户直接访问 `widget.example` 看到的又是第三份
- **Chrome 115 起对全体用户默认开启**；嵌套场景再加一个「祖先位（ancestor bit）」：中间只要隔着跨站文档，即使 iframe 与顶级同站也分区
- **Firefox 103 起默认开启**动态分区（网络状态分区更早，85 起且**不可解除**）
- 被分区的不只 localStorage：sessionStorage、IndexedDB、Cache API、OPFS、配额系统、ServiceWorker、**BroadcastChannel、SharedWorker、Web Locks** 等通信 API 一并分区（Chrome 137 起 Blob URL 也分区）
- 对嵌入组件的影响：三方 iframe 里「记住用户」失效、跨站共享状态失效、SSO iframe 拿不到既有登录态
- 逃生门：**Storage Access API**（`document.requestStorageAccess()`）——经用户许可拿回**非分区 Cookie** 访问权（Firefox 授权有效期 30 天；配套过渡启发式勿依赖）
- 第三方 Cookie 本体：**2024-07 Google 官宣不再单方面默认淘汰**，一句话带过即可，细节见 [SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep)
- **Storage Buckets API**：一个源开**多个桶**、各桶**独立驱逐**、可分别申请持久化——解决 `persist()` 「全有或全无」的痛点
- 入口 `navigator.storageBuckets.open(name, { persisted, durability })`；桶内访问 `bucket.indexedDB`、`bucket.caches`
- 兼容性要点：**Chromium 122 起可用**；仍是 WICG 提案（Mozilla 立场评估中），跨浏览器项目只能渐进增强

## 一、为什么「按源隔离」不够了

传统模型里，存储只按**源**隔离：`tracker.example` 的 iframe 无论嵌在哪个网站，读写的都是同一份 `tracker.example` 存储。这正是跨站追踪的温床——它在 A 站写入一个用户 ID，在 B 站原样读回，你在两个站的行为就被串起来了。

历史上的两种对策都不理想：**全面封杀第三方存储**会砸坏 SSO、支付、客服挂件这类正经嵌入；**按追踪者名单封杀**依赖分类准确。于是浏览器走了第三条路：**不封杀，改隔离**。

## 二、双键分区：源 + 顶级站点

分区后的存储键从「源」变成 **「(顶级站点, 源)」双键**：

```
分区前：tracker.example 的存储 ——全网唯一一份
分区后：
  (siteA.com,  tracker.example) —— 一份
  (siteB.com,  tracker.example) —— 另一份
  (tracker.example 顶级访问)     —— 第三份
```

- **Chrome**：115 起全量默认开启。嵌套 iframe 还引入**祖先位（ancestor bit）**——只要当前 iframe 与顶级文档之间隔着任何跨站文档（如 A 嵌 B、B 再嵌 A），即使首尾同站也照样分区，堵住「跳板 iframe」漏洞。
- **Firefox**：网络状态（HTTP 缓存、DNS、连接池等）自 85 起**永久分区且不可解除**；存储的动态分区自 103 起默认。
- 分区范围远不止 localStorage。Chrome 口径：Web Storage、IndexedDB、Cache API、OPFS、Storage Buckets、配额系统、三方上下文注册的 Service Worker，连 **BroadcastChannel、SharedWorker、Web Locks** 这些**通信 API** 也按分区切断（137 起 Blob URL 除顶级导航外也分区）；`Clear-Site-Data` 也只清当前分区。Firefox 的清单同理覆盖存储 + 通信两类。

**配额也按分区记账**：每个分区是独立的桶，三方 iframe 能用的配额远小于顶级上下文（Safari 给跨源 frame 的配额约为父级的 1/10，见[配额与驱逐](./quota-eviction)）。

还要注意：分区**不是可选特性**——没有让站点整体退出的开关（Chrome 仅有迁移期的弃用试验），代码里也没有「是否被分区」的直接查询 API。正确姿势是把「嵌入上下文 = 独立小仓库」当作默认世界观来设计。

## 三、对嵌入式组件的实际影响

做「被别人嵌」的产品（评论区、客服窗、播放器、SSO）时，旧心智全部作废：

| 旧预期 | 分区后的现实 |
| --- | --- |
| 用户在 A 站的 widget 里设置过偏好，B 站的同一 widget 记得 | **不记得**——两个分区两份数据 |
| 用户登录过 `sso.example`，任何站的 SSO iframe 都能读到会话 | **读不到**——iframe 分区里没有顶级会话 |
| iframe 与打开的弹窗共享 BroadcastChannel | **切断**——通信 API 同样分区 |
| 在 iframe 里写满数据，配额与主站共享 | **独立记账**，且往往更小 |

逃生门是 **Storage Access API**：三方 iframe 调 `document.requestStorageAccess()`，经用户许可后拿回**非分区 Cookie**（即用户顶级访问该站时的 Cookie）——**跨浏览器基线上**它救的是 Cookie 型会话（Firefox/Safari 明确只有 Cookie 可动态解除分区）；Chromium 125+ 另有实验性扩展 `requestStorageAccess({localStorage:true, indexedDB:true, …})` 返回 **StorageAccessHandle**、可按类型拿回非 Cookie 存储（非 Baseline、其他引擎未跟进），跨浏览器产品不能依赖。Firefox 的授权一次有效 **30 天**，并配有 opener/导航两条**过渡期启发式**自动授权——官方原话是兼容性权宜，**别把产品逻辑押在启发式上**。Chrome 侧另有临时的解分区弃用试验（deprecation trial）供迁移期使用。

你的产品会被别人 iframe 嵌入时，按这份清单自查：

- 是否假设 iframe 里能读到用户**顶级访问**你站时写的 localStorage/IndexedDB？——分区后读不到。
- 是否用 BroadcastChannel/SharedWorker 在「iframe ↔ 你站的顶级页/弹窗」之间通信？——跨分区已切断。
- 是否依赖三方上下文里的 Service Worker 共享缓存？——按分区各自注册、各自缓存。
- 配额告警阈值是否按顶级上下文的大配额设定？——分区里的配额小得多（Safari 跨源 frame ≈ 父配额 1/10）。
- 登录态是否只压在 Cookie 上？——跨浏览器可靠的解分区通道只有 Cookie（Chromium 125+ 的 StorageAccessHandle 非 Cookie 扩展系实验性，勿押注）。

排查时浏览器会留线索：Firefox 在控制台明确打印「Partitioned cookie or storage access was provided to …」这类消息，标明当前上下文拿到的是分区存储还是解分区授权。

顺带一句收束背景：与分区互补的「第三方 Cookie 默认淘汰」计划，**Google 已于 2024-07 官宣反转、不再单方面默认淘汰**——但分区与 SameSite 收紧的大方向未变；这条线的来龙去脉归 [SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep)，此处不展开。

## 四、Storage Buckets API：一个源，多个桶

分区是浏览器**替用户**切存储；Storage Buckets 反过来，让**开发者自己**切——把一个源的数据拆成多个**独立驱逐**的桶。

动机来自 `persist()` 的粗粒度：它对整个源「全有或全无」。而真实应用里数据分三六九等——用户没发出去的草稿丢了不可原谅，上周的列表缓存丢了无所谓。Buckets 让你按重要性分桶，各桶单独设持久化与驱逐优先级：

```js
// 草稿桶：申请持久化 + 严格落盘（性能换可靠）
const drafts = await navigator.storageBuckets.open("drafts", {
  persisted: true,       // 申请免驱逐（默认 false）
  durability: "strict",  // 断电也尽量不丢；默认 "relaxed"（性能优先）
});

// 缓存桶：默认 best-effort，压力下先被清掉的就是它
const cache = await navigator.storageBuckets.open("cache");

// 每个桶内是一套独立的存储端点
const db = drafts.indexedDB.open("notes");   // 桶内 IndexedDB
const c = await cache.caches.open("api-v1"); // 桶内 Cache API
```

驱逐时浏览器可以**逐桶清除**：先清 best-effort 的 `cache` 桶，`drafts` 桶因 persisted 而幸存——这就是「独立驱逐优先级」的含义。

两个补充认知：

- **分区与分桶正交**：分区是浏览器**按顶级站点**替用户切，分桶是开发者**按数据重要性**替自己切；Chrome 的分区清单里明确包含 Storage Buckets——三方 iframe 里开的桶照样按分区各记各账。
- `durability: "strict"` 买的是**断电落盘**的可靠性、付的是写性能，只该给「丢了不可原谅」的桶；缓存类桶保持默认 `"relaxed"`。

**兼容性现状（写作时点）**：Chromium **122** 起正式可用；规范仍是 **WICG 提案**，TAG 评审与 Mozilla 标准立场在评估中，Firefox/Safari 未跟进。跨浏览器产品只能做渐进增强：

```js
// 特性检测：不支持就回落到默认桶（即普通 navigator.storage 世界）
if ("storageBuckets" in navigator) {
  /* 分桶策略 */
} else {
  /* 单桶 + persist() 兜底 */
}
```

## 小结

- 存储分区把三方 iframe 的隔离键从「源」升级为「源 + 顶级站点」双键：同一 widget 在不同站点、以及顶级访问，看到的是互不相通的多份数据。
- 落地时间线：Chrome 115 全量默认（含祖先位），Firefox 103 默认动态分区（网络状态 85 起永久分区）；分区覆盖存储 + 通信 API + 配额记账。
- 嵌入式产品要按「无共享状态」重新设计；Storage Access API 只救非分区 Cookie，且要用户许可。
- 第三方 Cookie 默认淘汰已于 2024-07 反转，但隔离收紧的大方向不变——细节归网络章。
- Storage Buckets 让一个源分多桶、独立驱逐优先级，治 `persist()` 的「全有或全无」；Chromium 122 可用、仍是 WICG 提案，只做渐进增强。
- 至此模型讲完，最后一页把全叶数字与表格集中归档：[参考](../reference)。
