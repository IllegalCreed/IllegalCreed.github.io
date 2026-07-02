---
layout: doc
outline: [2, 3]
---

# 多层缓存总览

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **命中优先级（心智模型）**：**Service Worker（Cache API）→ memory cache → disk cache → 网络**；越靠前越快，命中即短路后面所有层。
- **归属**：SW 层归**开发者代码**管；memory/disk cache 归**浏览器**管，不可编程读写，只能靠 HTTP 头影响。
- **生命周期**：memory cache 随**标签页关闭**失效；disk cache **跨会话持久**；Cache API 条目**不删不灭**。
- **遵守 HTTP 语义与否**：disk cache 严格遵守 RFC 9111；Cache API **完全不看 HTTP 缓存头**；memory cache 是实现细节、行为宽松。
- **Chrome 实测细节**：同文档内 **memory cache 命中不会触发 SW 的 `fetch` 事件**（disk cache 命中会触发）——分层图是心智模型，别当严格实现规范（[w3c/ServiceWorker#1174](https://github.com/w3c/ServiceWorker/issues/1174)）。
- **push cache 已死**：HTTP/2 Server Push 被 **Chrome 106（2022-09）默认禁用**、**Firefox 132（2024-10）默认禁用**；经典「四级缓存」图已过时。
- **死因数据**：仅 **1.25% → 后降至 0.7%** 的 HTTP/2 站点在用；Chrome 分析结论是「没有明确的净性能收益，很多场景反而回退」。
- **HTTP/3 连实现都没铺开**：规范里有 push，但「很多 HTTP/3 服务端与客户端根本没实现」。
- **继任者**：**103 Early Hints** + `preload`/`preconnect`——让浏览器自己决定拉什么（详见[网络章 · HTTP 演进](/zh/base/network/net-http-evolution/)）。
- **bfcache / prefetch cache 是另两个维度**：一个缓存「整页快照」，一个暂存「预取的下一页资源」，都不在上面这条单资源命中链里。

## 一、分层全景

| 层 | 归谁管 | 存什么 | 生命周期 | 遵守 HTTP 缓存语义？ | DevTools Size 栏 |
| --- | --- | --- | --- | --- | --- |
| **Service Worker（Cache API）** | 开发者代码 | `Request`/`Response` 键值对 | 显式删除才消失（或整源被配额淘汰） | **否**，全由代码做主 | `(ServiceWorker)` |
| **memory cache** | 浏览器渲染进程 | 本标签页刚用过的资源（完整响应） | 标签页会话内；关 tab 即失效 | 宽松（实现细节） | `(memory cache)` |
| **disk cache** | 浏览器网络栈 | 按 HTTP 语义可缓存的响应 | 跨会话持久；容量满按 LRU 淘汰 | **是**（RFC 9111） | `(disk cache)` |
| ~~push cache~~ | ~~HTTP/2 会话~~ | ~~服务端推送的资源~~ | ~~随连接关闭~~ | — | **已死**，见第三节 |

补两个不在此链上、但常被一起讨论的「缓存」：

| 名字 | 维度 | 一句话 |
| --- | --- | --- |
| **bfcache** | 整页导航 | 前进/后退时恢复**整页内存快照**（DOM + JS 堆），不是按资源缓存响应，见 [bfcache](./bfcache) |
| **prefetch cache** | 预取 | `<link rel="prefetch">` 拉回的「下一页资源」暂存区，命中时 Size 栏显示 `(prefetch cache)`，见[观测与清除](./cache-observe-clear) |

上面每一层的存在都能在 DevTools Network 的 **Size 栏标签**里得到直接印证——`(ServiceWorker)` / `(memory cache)` / `(disk cache)` / `(prefetch cache)` 四个标签就是四层的「身份证」，判读细节见[观测与清除](./cache-observe-clear)。

## 二、命中决策流

以被 Service Worker 控制的页面请求一张图片为例，完整决策流是：

1. **Service Worker 拦截**：页面在 SW 控制范围内，请求触发 SW 的 `fetch` 事件。SW 代码可 `caches.match()` 直接回缓存副本（Size 栏 `(ServiceWorker)`），也可 `fetch()` 放行——放行的请求继续走后面的层。
2. **memory cache**：本标签页刚加载过同一资源（典型：同页两处引用同一张图、刚被 preload 的脚本），渲染进程直接从内存复用，耗时近乎 0ms。
3. **disk cache（HTTP 缓存本体）**：按 `Cache-Control` 判定——新鲜则直接兑现（灰色 200）；陈旧则带条件头出网协商（`304` 续命 / `200` 换新），语义见[网络章](/zh/base/network/net-http-basics/guide-line/connection-range-caching)，落地细节见 [HTTP 缓存的浏览器侧落地](./http-cache-landing)。
4. **网络**：以上全 miss，真正下载。

::: warning 心智模型 ≠ 实现规范：memory cache 会「短路」Service Worker
上面的顺序是最常见的教学模型，但 Chrome 的真实实现有一个著名出入：**memory cache 位于渲染进程内部，同一文档内的重复请求若在 memory cache 命中，请求根本不会派发出去——SW 的 `fetch` 事件不会触发**；而 disk cache 命中前 `fetch` 事件会正常触发（服务工作线程规范仓库把它记录为 [w3c/ServiceWorker#1174](https://github.com/w3c/ServiceWorker/issues/1174)）。实战含义：别假设 SW 能观测到页面的**每一个**资源请求——同文档内的内存级复用对 SW 不可见。
:::

各层的详细行为分页展开：[内存缓存与磁盘缓存](./memory-disk-cache)、[Service Worker 缓存与 Cache API](./sw-cache-api)。

### 归属决定排查路径

分层的最大实用价值是**把「用户拿到旧资源」翻译成「去哪一层修」**：

| Size 栏证据 | 命中层 | 修在哪 |
| --- | --- | --- |
| `(ServiceWorker)` | Cache API | 改 SW 代码：版本化换仓、activate 收尸（见 [SW 缓存](./sw-cache-api)） |
| `(disk cache)` | HTTP 缓存 | 改响应头策略：哈希 URL + 正确 `Cache-Control`（见 [HTTP 落地](./http-cache-landing)） |
| `(memory cache)` | 内存复用 | 通常无需修——关标签页自愈；测试时换新标签页排除 |
| 无请求、整页是旧状态 | bfcache | 不是资源问题：`pageshow(persisted)` 里刷新时效数据（见 [bfcache](./bfcache)） |

## 三、push cache 已死

### 3.1 它曾是「第四级」

HTTP/2 Server Push 允许服务端不等请求、随主文档用 `PUSH_PROMISE` 帧主动把资源推给浏览器；推来的资源先落在**连接级的 push cache** 里，等页面真正请求时再被「认领」。这层暂存有两个天生软肋：**跟着连接走**（连接一关、未认领的推送作废），以及**服务端看不见浏览器缓存**——客户端磁盘里明明有新鲜副本，服务端照推不误，带宽白烧。协议机制本身见[网络章 · HTTP 演进](/zh/base/network/net-http-evolution/)，本页只讲它的死亡。

### 3.2 死亡时间线与数据

| 时间 | 事件 |
| --- | --- |
| 2022-09 | **Chrome 106** 默认禁用 HTTP/2 Server Push（[官方博客](https://developer.chrome.com/blog/removing-push)，其他 Chromium 系浏览器随后跟进） |
| 2024-10-29 | **Firefox 132** 将 `network.http.http2.allow-push` 默认置为 `false`；[发行说明](https://www.firefox.com/en-US/firefox/132.0/releasenotes/)直言：「由于与多个站点的兼容性问题，HTTP/2 Push 支持已被移除。目前没有任何其他主流浏览器支持该特性」，并预告实现可能在后续版本彻底删除 |

Chrome 给出的死因（均出自官方博客）：

- **没人用**：移除决定时仅 **1.25%** 的 HTTP/2 站点用到 push，后续统计进一步跌到 **0.7%**；
- **性能不及预期**：官方分析「结果好坏参半……没有明确的净性能收益，很多情况下反而出现性能回退」——服务端猜不准浏览器缓存里已有什么，重复推送浪费带宽；
- **HTTP/3 时代名存实亡**：push 虽写进了 HTTP/3 规范，但「很多 HTTP/3 服务端与客户端根本没有实现它」。

### 3.3 继任者：103 Early Hints

替代思路是从「服务端硬塞」改成「服务端提示、浏览器自己拉」：**`103 Early Hints`** 临时响应在正式响应还没生成时（比如后端在查库）就提前告诉浏览器「待会儿要用这些资源」：

```http
HTTP/1.1 103 Early Hints
Link: </app.css>; rel=preload; as=style

HTTP/1.1 200 OK
Content-Type: text/html
...
```

浏览器收到提示后**结合本地缓存自行决定**要不要提前拉取——缓存里已有的资源不会被重复传输，这正好补上了 Server Push 的最大短板；Chrome 官方评价它是「出错概率小得多的替代方案」。Early Hints 与 HTTP 演进脉络见[网络章](/zh/base/network/net-http-evolution/)。

::: danger 面试与旧文避坑
网上大量 2018~2021 年的「浏览器四级缓存：Service Worker → memory cache → disk cache → push cache」图文已经**过时**：push cache 层随 Server Push 一起消失了。今天再画命中链，第四级直接是**网络**。
:::

## 四、把维度理清：三张「缓存地图」

最后把容易混为一谈的几类东西各归各位：

1. **单资源命中链**（本页主角）：SW → memory → disk → 网络，作用对象是**一个个请求**；
2. **整页快照**：bfcache，作用对象是**一次前进/后退导航**，恢复的是 DOM + JS 堆的完整执行状态，与「响应缓存」性质完全不同（见 [bfcache](./bfcache)）；
3. **投机加载暂存**：prefetch cache 等，作用对象是**还没发生的下一次导航**（观测方法见[观测与清除](./cache-observe-clear)）；
4. **引擎级缓存**：如 V8 的编译代码缓存（script cache）——缓存的是「脚本编译产物」而非响应本身，对开发者透明；知道它存在即可（MDN 对 `Clear-Site-Data: "cache"` 的描述里，「脚本缓存」与浏览器缓存、bfcache 并列在可能被清除之列）。

排查缓存问题时先问「我面对的是哪张地图」，再谈去哪层找旧副本。

## 小结

- 单资源命中链四层心智模型：**SW（开发者管，不看 HTTP 头）→ memory cache（tab 会话级）→ disk cache（HTTP 语义本体）→ 网络**；Chrome 实测中 memory cache 命中会短路 SW 的 `fetch` 事件，模型别当规范。
- **push cache 已死**：Chrome 106（2022）、Firefox 132（2024）先后默认禁用 Server Push——使用率 1.25%→0.7%、无净性能收益、HTTP/3 未实现；经典「四级缓存」图已过时，继任方案是 **103 Early Hints + preload**。
- bfcache 与 prefetch cache 是另外两个维度：一个缓存整页执行状态，一个暂存预取资源，别与单资源命中链混谈。
