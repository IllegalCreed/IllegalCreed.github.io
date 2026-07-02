---
layout: doc
outline: [2, 3]
---

# 存储全景与选型矩阵

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- 六机制五维对比：**容量、同步/异步、生命周期、是否随请求发送、Worker 可达性**——本页一张大表全覆盖
- **Cookie**：单条 ~**4KB**（RFC 6265 要求至少 4096 字节/条、50 条/域）、同步、可设过期、**随请求自动发送**、`document.cookie` 在 Worker 不可用
- **localStorage / sessionStorage**：各 ~**5 MiB**/源、**同步阻塞**、仅字符串；前者按源持久，后者随标签页关闭销毁；**Worker 里都不可用**
- **IndexedDB**：异步事务型对象数据库，走共享源配额（**GB 级**），window/Worker/Service Worker 全可用
- **Cache API**：按 Request/Response 对存网络资源，异步、共享源配额、Worker 全可用——Service Worker 离线的基石
- **OPFS**：源私有文件系统，异步 + **Worker 内同步访问句柄**，共享源配额，适合文件类与 SQLite-wasm
- web.dev 官方立场：**首选 Cache API（网络资源）/ OPFS（文件）/ IndexedDB（其余数据）**——全异步；**localStorage 应避免、Cookie 不当存储**
- 用户可见的 File System Access API（带选择器弹窗那个）**仅 Chromium 支持**，web.dev 不推荐作为存储方案；OPFS 则是 Baseline（2023-03 起全浏览器）
- IndexedDB/Cache API/OPFS **共享同一份源级配额**；Web Storage 的 ~5 MiB 是独立小池子；Cookie 不在配额体系内
- 决策口诀：**要回传服务端 → Cookie；页面级小键值 → Web Storage；结构化数据 → IndexedDB；网络资源 → Cache API；文件/数据库文件 → OPFS**
- 三大经典错位反模式：**token 进 localStorage（XSS 可读）、用户偏好进 Cookie（全站请求变胖）、接口缓存进 localStorage（阻塞 + 5 MiB 顶）**
- 一个应用同时用四五种机制是常态——六列是分工不是单选题

## 一、六机制五维对比大表

| 维度 | Cookie | localStorage | sessionStorage | IndexedDB | Cache API | OPFS |
| --- | --- | --- | --- | --- | --- | --- |
| **容量** | 单条 ~4KB，每域几十条起 | ~5 MiB/源 | ~5 MiB/源 | 共享源配额（GB 级） | 共享源配额 | 共享源配额 |
| **同步/异步** | 同步（`document.cookie`） | **同步** | **同步** | 异步 | 异步（Promise） | 异步；Worker 内可开**同步句柄** |
| **数据形态** | 字符串（名=值） | 仅字符串 | 仅字符串 | **结构化克隆**支持的任意对象 | Request/Response 对 | 文件（字节流） |
| **生命周期** | 会话 Cookie 或到期时间 | 持久（手动清除/驱逐前） | **标签页会话**（关标签页即清） | 持久（受驱逐） | 持久（受驱逐） | 持久（受驱逐） |
| **随请求发送** | **是**（自动上行） | 否 | 否 | 否 | 否 | 否 |
| **Worker 可达** | `document.cookie` 不可用① | **否** | **否** | **是** | **是**（SW 核心） | **是**（同步句柄仅 Worker） |
| **典型场景** | 会话凭证、服务端要读的小状态 | 主题/语言等小偏好 | 单标签页临时态、表单草稿 | 接口缓存、离线数据、大列表 | 静态资源离线、PWA | 大文件、SQLite-wasm 数据库 |

① 异步的 Cookie Store API 可在 Service Worker 中读写 Cookie，但兼容性尚未拉齐（见 [Cookie 的浏览器侧](./cookie-browser-side)）。

读表两个提醒：其一，六列不互斥——一个应用同时用上四五种机制是常态（HttpOnly Cookie 装会话 + localStorage 装偏好 + IndexedDB 装数据 + Cache API 装资源）；其二，容量列是 MDN 当前口径的**量级直觉**，运行时判断永远以 `navigator.storage.estimate()` 的实际返回为准。这张表是全叶的地基：后面每一页都是对其中一两列的深挖。

## 二、三个维度值得单独说透

### 2.1 容量：两套账本

容量列里藏着一个关键结构：**Web Storage 的 ~5 MiB 是独立小池子，而 IndexedDB、Cache API、OPFS 共用同一份「源级配额」大池子**（Chrome 里单源可达磁盘的 60%）。所以「localStorage 满了」不等于「这个源没空间了」——大池子可能还空着几十 GB。Cookie 则完全不在配额体系内，它受的是「单条 ~4KB + 每域条数」的独立限制。数值细节与查询方法见[配额与驱逐](./quota-eviction)。

### 2.2 同步还是异步：主线程的账

`document.cookie` 与 Web Storage 是**同步 API**：调用期间主线程停摆。数据小无感，数据一大（或设备一差）就是实打实的卡顿；MDN 对 Web Storage 的建议是性能敏感或大数据场景改用 IndexedDB。反过来，IndexedDB/Cache API/OPFS 的异步设计意味着**读写不挡渲染**，还能整体搬进 Worker，把序列化/压缩这类重活也一并挪出主线程。

```js
// 同步：这两行执行完之前，主线程什么都干不了（含渲染）
localStorage.setItem("bigList", JSON.stringify(hugeArray));
const cached = JSON.parse(localStorage.getItem("bigList") ?? "[]");

// 异步：读写在后台进行，主线程继续响应用户
await db.put("lists", hugeArray, "bigList"); // idb 包装后的 IndexedDB
const record = await db.get("lists", "bigList");
```

### 2.3 生命周期：没有一种是「永久」

- **sessionStorage** 最短命：标签页关闭即销毁（刷新与恢复不算关闭）。
- **Cookie** 由 `Expires`/`Max-Age` 决定，不设即会话 Cookie。
- **localStorage / IndexedDB / Cache API / OPFS** 名义上持久，但都排在浏览器的驱逐队列里：存储压力下按 LRU 整源清除，Safari 还有 7 天 ITP 清库。**「持久」只是「没到期时间」，不是「保证不丢」**——想要承诺得调 `navigator.storage.persist()`。

## 三、「随请求发送」是 Cookie 的独有属性，也是原罪

六机制里只有 Cookie 会**自动跟着每个匹配请求上行**。这正是它作为「会话凭证载体」的价值，也是它作为「存储」的原罪：存进 Cookie 的每个字节都要乘以请求数。web.dev 的原话立场：Cookie 里存的东西一多，「每个 Web 请求的体积都会显著增大」。所以判断标准只有一条——**这份数据服务端每次请求都需要看吗？** 是，才配进 Cookie；否则一律放本地。

## 四、web.dev 官方立场与决策清单

web.dev《Storage for the web》给出的现代选型（也是本叶采用的基线）：

| 数据 | 官方推荐 | 理由 |
| --- | --- | --- |
| 加载应用所需的网络资源 | **Cache API** | Service Worker 离线体系的一部分，异步 |
| 文件类内容 | **OPFS** | 字节级高性能读写，异步 + Worker 同步句柄 |
| 其余数据 | **IndexedDB**（配 Promise 包装库如 `idb`） | 异步、容量大、Worker 可用 |

同时点名的「别用」：

- **localStorage/sessionStorage**：同步阻塞主线程，~5 MiB、仅字符串——「应避免」（legacy 小偏好除外）。
- **Cookie**：随请求发送，不当存储用。
- **File System Access API**（用户可见、带 `showOpenFilePicker()` 弹窗的那套）：仅 Chromium 支持，不作跨浏览器存储方案；注意与 Baseline 的 OPFS 区分开。

落到日常工程的决策清单：

| 你要存的 | 放哪 | 一句话理由 |
| --- | --- | --- |
| 会话凭证 | **HttpOnly Cookie** | 唯一 JS 读不到的存储，XSS 偷不走（存储视角一句话，细节归安全主题与网络章） |
| 主题、语言、折叠状态 | localStorage | 小、简单、够用 |
| 当前标签页的向导步骤/草稿 | sessionStorage | 要的就是「关页即焚」+ 多标签互不干扰 |
| 接口数据缓存、离线业务数据 | IndexedDB | 结构化、量大、异步 |
| 静态资源/页面离线 | Cache API | 与 Service Worker 配套（实战见[浏览器缓存](../../browser-cache/)） |
| 用户导出文件、wasm 数据库 | OPFS | 文件语义 + 高性能句柄 |
| 跨标签页要同步的状态 | localStorage + storage 事件 | 原生跨标签页广播（见 [Web Storage 存储模型](./web-storage-model)） |
| 第三方 iframe 里的状态 | 任选，但**预期被分区** | 同一 widget 不同宿主站互不相通（见[存储分区](./partitioning-buckets)） |

## 五、常见反模式对照

选型矩阵反着用，就是一张事故清单：

| 反模式 | 症状 | 纠正 |
| --- | --- | --- |
| token 放 localStorage | 一次 XSS 整锅端走 | HttpOnly Cookie（见 [Cookie 的浏览器侧](./cookie-browser-side)） |
| 接口缓存塞 localStorage | 主线程卡顿 + 5 MiB 天花板 | IndexedDB（异步、GB 级） |
| 用户偏好塞 Cookie | 全站每个请求变胖 | localStorage |
| 跨标签页同步靠轮询 localStorage | 白耗 CPU | storage 事件（见 [Web Storage 存储模型](./web-storage-model)） |
| 离线静态资源存 IndexedDB | 手搓 Cache API 已有的能力 | Cache API + Service Worker（见[浏览器缓存](../../browser-cache/)） |
| 把本地存储当唯一副本 | Safari 7 天清库后数据蒸发 | 服务端为源、本地当缓存；或引导安装 PWA |
| sessionStorage 存跨标签页共享态 | 登录态「时有时无」——每页签各一份 | localStorage（或服务端会话） |

## 小结

- 一张五维大表定乾坤：容量差数量级、同步/异步定性能、生命周期定可靠性、「随请求发送」只属于 Cookie、Worker 可达性划出异步阵营。
- 容量是两套账本：Web Storage 独立 ~5 MiB，IndexedDB/Cache/OPFS 共享源级大配额。
- web.dev 官方选型：Cache API（网络资源）/ OPFS（文件）/ IndexedDB（其余）；localStorage 避免、Cookie 不当存储、用户可见 File System Access API 仅 Chromium。
- 所有「持久」存储都可能被驱逐——生命周期的真相在[配额与驱逐](./quota-eviction)页展开。
- 下一页先端详六机制里最老的那位：[Cookie 的浏览器侧](./cookie-browser-side)。
