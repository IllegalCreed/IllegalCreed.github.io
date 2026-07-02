---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- 浏览器给前端的存储机制有**六种**：Cookie、localStorage、sessionStorage、IndexedDB、Cache API、OPFS——没有万能的，只有各管一段的
- 本叶讲**存储模型**：数据存在哪、多大、何时被清、如何隔离；**不是 API 教程**（完整用法归 Web API 章，待产出）
- 容量差着数量级：Cookie 单条 **~4KB** → Web Storage **~5 MiB** → IndexedDB/Cache/OPFS 共享**源配额**（Chrome 单源可到磁盘 60%）
- 同步/异步是第一分水岭：`document.cookie` 与 Web Storage **同步阻塞主线程**；IndexedDB/Cache/OPFS **异步**
- **Cookie 是唯一随每个 HTTP 请求自动上行的存储**——多存 1KB，每个请求都多背 1KB
- web.dev 官方选型：网络资源 → **Cache API**；文件类内容 → **OPFS**；其余数据 → **IndexedDB**；localStorage 应避免、Cookie 不当存储
- 存储不是保险箱：best-effort 数据在存储压力下按 **LRU 整源驱逐**；**Safari ITP 7 天不交互清空全部脚本可写存储**
- 隔离两级：传统按**源（origin）**隔离；如今第三方 iframe 里再按**顶级站点分区**（Chrome 115 / Firefox 103 默认）
- `navigator.storage`（Storage API）管配额与持久化：`estimate()` 查用量、`persist()` 申请免驱逐——**与 Web Storage API 不是一回事**
- 选型失误有真实代价：localStorage 存大 JSON 卡主线程、Safari 用户离线数据 7 天蒸发、Cookie 塞状态拖慢全站请求
- 数据都在浏览器接管的 profile 目录里：页面只见逻辑接口摸不到真实文件——**配额**与**驱逐**因此都是浏览器说了算

## 一、六种机制全景：先认脸，再深交

把浏览器能持久化数据的地方一字排开（完整五维对比见[存储全景与选型矩阵](./guide-line/storage-overview)）：

| 机制 | 一句话定位 | 典型容量 |
| --- | --- | --- |
| **Cookie** | 服务端要看的小段状态，随请求自动回传 | 单条 ~4KB |
| **localStorage** | 按源持久的同步键值串 | ~5 MiB |
| **sessionStorage** | 按「标签页 + 源」的一次性键值串 | ~5 MiB |
| **IndexedDB** | 异步事务型对象数据库，存结构化大数据 | 共享源配额（GB 级） |
| **Cache API** | 按请求/响应对缓存网络资源（Service Worker 的离线基石） | 共享源配额 |
| **OPFS** | 源私有文件系统，字节级读写、Worker 内有同步句柄 | 共享源配额 |

六种机制不是演进替代关系，而是**分工关系**：Cookie 解决「服务端识别状态」，Web Storage 解决「页面级少量键值」，后三者解决「客户端真正的数据层」。web.dev 的官方推荐很直白：**Cache API 存加载应用所需的网络资源、OPFS 存文件类内容、IndexedDB 存其余数据**——三者都是异步的、不阻塞主线程，且在 window、Web Worker、Service Worker 里都可用。

物理上它们全部落在**浏览器接管的用户资料目录**里（Firefox 的配额甚至按「profile 所在磁盘」计算），由浏览器统一记账、统一回收：页面代码永远只面对逻辑接口，摸不到真实文件——连主打「文件系统」的 OPFS 也刻意不与真实磁盘路径一一对应。这个设计决定了本叶的两大主题：**配额**（浏览器记的账）与**驱逐**（浏览器行使的回收权）。

先破三个高频误会：

- **session Cookie ≠ sessionStorage**：前者「不设过期时间的 Cookie」，随浏览器会话；后者随**单个标签页**的页面会话——隔离单位完全不同。
- **无痕模式 ≠ 没有存储**：六种 API 全部可用，只是配额缩水、关窗全清——离线功能要检测并降级，而不是假设它不存在。
- **「两个标签页数据不同步」**：十有八九是把 sessionStorage 当成了 localStorage——前者每个标签页各一份，天生不同步。

## 二、为什么前端必须懂存储模型（而不只是会调 API）

API 十分钟能学会，但下面这些坑全都不在方法签名里：

### 2.1 选型失误的真实代价

**案例一：localStorage 存大对象，主线程买单。** `localStorage.getItem()`/`setItem()` 是**同步 API**——读写期间 JavaScript 全停。存个主题偏好无所谓；但把几 MB 的接口缓存 JSON 塞进去，每次 `JSON.parse(localStorage.getItem(...))` 都是主线程上的一次卡顿，低端机上肉眼可见。MDN 明说：大数据量或性能敏感场景，请改用异步的 IndexedDB。

**案例二：Safari 用户的「离线数据」7 天蒸发。** Safari 的智能反追踪（ITP）对**所有脚本可写存储**（IndexedDB、Cache API、Service Worker 注册、localStorage……）有一条硬规则：用户 **7 天**（按 Safari 使用天数计）没有与你的站点交互，全部清空。你精心做的离线笔记应用，在 Safari 上就是「两周没打开 = 数据没了」——除非它是加到主屏幕的已安装 PWA（豁免），或你在设计上把服务端当唯一可信数据源。详见[配额与驱逐](./guide-line/quota-eviction)。

**案例三：Cookie 当存储用，全站请求变胖。** Cookie 会随**每一个**匹配的 HTTP 请求自动上行。往里塞几 KB 的用户配置，等于给站点的每个请求都加了几 KB 的固定税。这也是 web.dev 把「别用 Cookie 存数据」列为明确立场的原因。

**案例四：超限没接住，保存静默失败。** `localStorage.setItem` 超限会**同步抛出** `QuotaExceededError`；IndexedDB 超限走事务 `onabort`；Cache API 写入直接 reject。三条失败路径只要有一条没兜住，用户看到的就是「点了保存、什么都没发生」。别以为超限是小概率——无痕模式下配额骤减（Chrome 只给 ~5% 磁盘），低磁盘设备上驱逐与超限都是日常。**写本地存储要按「可能失败的 I/O」对待，不是内存赋值。**

### 2.2 存储不是保险箱：配额与驱逐

浏览器给每个源的空间是**配额制**的，而且**会主动回收**：设备空间紧张时，浏览器按 **LRU（最近最少使用）**把整个源的数据一锅端（防止半删导致的数据不一致）。想知道还剩多少、想申请「别删我」，就要用 `navigator.storage.estimate()` 与 `persist()`——注意这个 **Storage API** 与 localStorage 所属的 **Web Storage API** 是两个完全不同的东西，名字像纯属历史巧合。

### 2.3 隔离在收紧：你的 iframe 不再「全局同源」

传统上存储只按**源**隔离；为了反跨站追踪，现代浏览器对**第三方 iframe 里的存储**追加了按**顶级站点**的分区（Chrome 115、Firefox 103 起默认）。做嵌入式组件（评论挂件、客服窗口、SSO iframe）的同学要重建心智：同一个 widget 嵌在 A 站和 B 站，看到的是**两份互不相通的存储**。详见[存储分区与 Storage Buckets](./guide-line/partitioning-buckets)。

## 三、先学会看：你的站到底存了什么

正式进指南页之前，两件排查工具建议现在就在自己的项目上试一遍：

**DevTools 的存储面板**（Chrome/Edge：Application → Storage；Firefox：存储面板）。六种机制的内容逐条可见——Cookie 的完整属性列表（JS 侧永远读不到的 Domain/Path/HttpOnly 在这里一览无余）、Web Storage 的键值、IndexedDB 的库与对象存储、Cache Storage 的请求对。顶部用量条显示当前源占了多少配额，Chrome 还能勾选「Simulate custom storage quota」把配额调小，专门测试超限路径。

**代码里查账**：

```js
// Storage API：查询当前源的存储用量与配额（估算值，单位字节）
const { usage, quota } = await navigator.storage.estimate();
console.log(
  `已用 ${(usage / 1048576).toFixed(1)} MiB / 配额 ${(quota / 1073741824).toFixed(1)} GiB`,
);
```

注意这里的 `navigator.storage` 属于 **Storage API**——与 localStorage 所属的 **Web Storage API** 重名不同物：前者管配额、持久化与 OPFS 入口，后者只是那对同步键值兄弟。这是本叶第一个命名陷阱，[配额与驱逐](./guide-line/quota-eviction)页展开。

## 四、本叶与其他章的分工

| 主题 | 归属 | 去处 |
| --- | --- | --- |
| 六机制的容量/生命周期/隔离/驱逐（存储模型） | **本叶** | 下面六个指南页 |
| localStorage/IndexedDB 完整 API（方法签名、事务、游标） | Web API 章（**待产出**） | 暂无链接 |
| Set-Cookie 语义、属性、会话方案（Session/Token） | 网络章 | [Cookie 与会话管理](/zh/base/network/net-http-basics/guide-line/cookies-sessions) |
| SameSite 细则、CHIPS 分区 Cookie、COOP/COEP | 网络章 | [SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep) |
| HTTP 缓存、Service Worker 缓存策略、Cache API 实战 | 兄弟叶 | [浏览器缓存](../browser-cache/) |

一句话：**本叶回答「放哪、多大、多久、谁可见」；「怎么写代码」与「协议语义」各回各章。**

## 五、带着六个问题往下读

每个指南页回答一个工程问题，按需跳读也成立：

| 问题 | 答案所在 |
| --- | --- |
| 这份数据到底该放哪？ | [存储全景与选型矩阵](./guide-line/storage-overview) |
| Cookie 在浏览器里怎么读写、贵在哪？ | [Cookie 的浏览器侧](./guide-line/cookie-browser-side) |
| 同源的两个标签页共享什么、隔离什么？ | [Web Storage 存储模型](./guide-line/web-storage-model) |
| 大数据与文件放哪、Worker 里怎么存？ | [IndexedDB 定位与 OPFS](./guide-line/indexeddb-opfs) |
| 能存多大、什么时候会被清？ | [配额与驱逐](./guide-line/quota-eviction) |
| 我的 iframe 为什么「失忆」了？ | [存储分区与 Storage Buckets](./guide-line/partitioning-buckets) |

## 小结

- 六种存储机制是分工不是替代：Cookie 管回传、Web Storage 管少量键值、IndexedDB/Cache API/OPFS 是真正的客户端数据层。
- 选型第一刀切在**同步/异步**：同步的 Cookie 与 Web Storage 天生不适合大数据；web.dev 官方首选全是异步阵营。
- 存储模型的三条硬约束——**配额**（能存多大）、**驱逐**（何时被清）、**隔离**（谁看得见）——每一条都能让「能跑的代码」变成线上事故。
- 本叶不教 API：完整用法等 Web API 章（待产出），协议语义回网络章，缓存策略去浏览器缓存叶。
- 排查两板斧现在就能用：DevTools 的 Application/存储面板看内容与用量，`navigator.storage.estimate()` 在代码里查账。

下一步：把六种机制放进同一张表里横向对比——[存储全景与选型矩阵](./guide-line/storage-overview)。
