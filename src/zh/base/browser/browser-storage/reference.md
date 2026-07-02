---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- 六机制一句话：**Cookie 回传服务端、Web Storage 页面级小键值、IndexedDB 结构化数据、Cache API 网络资源、OPFS 文件**——sessionStorage 只是 localStorage 的「按标签页 + 关页即焚」版
- web.dev 官方选型：**Cache API / OPFS / IndexedDB 三首选（全异步）**；localStorage 避免、Cookie 不当存储、用户可见 File System Access API 仅 Chromium
- 容量三级跳：Cookie 单条 **~4KB** → Web Storage **~5 MiB/源** → 共享源配额 **GB 级**（Chrome 单源 ≤ 磁盘 60%）
- 共享配额只覆盖 **IndexedDB / Cache API / OPFS / wasm 代码缓存**；`navigator.storage.estimate()` 查账（估算值）
- 驱逐三板斧：存储压力下 **LRU 整源清除**（best-effort）；**persistent 桶跳过**；**Safari ITP 7 天无交互清空脚本可写存储**（已装 PWA 豁免）
- `persist()` 裁决：Firefox 弹窗问用户，Chrome/Edge/Safari 按交互历史静默批拒——返回 `false` 是常态，代码要兜底
- 超限三张脸：Web Storage **同步 throw**、IndexedDB **事务 onabort**、Cache API **reject**——都是 `QuotaExceededError`
- 隔离两级：按**源**（scheme+host+port）→ 三方 iframe 再按**顶级站点分区**（Chrome 115 / Firefox 103 默认）
- **Storage Buckets**（Chromium 122，WICG 提案）：一源多桶、独立驱逐优先级，`navigator.storageBuckets.open()`
- sessionStorage 三细节：页面会话跨**刷新/恢复**存活；新标签页从 **opener 拷贝**初值（noopener 阻断）；storage 事件只发给同源**其他**文档

## 六机制对比表

| 维度 | Cookie | localStorage | sessionStorage | IndexedDB | Cache API | OPFS |
| --- | --- | --- | --- | --- | --- | --- |
| 容量 | 单条 ~4KB（RFC 6265 下限 4096B/条、50 条/域） | ~5 MiB/源 | ~5 MiB/源 | 共享源配额 | 共享源配额 | 共享源配额 |
| 同步/异步 | 同步（Cookie Store API 异步，Baseline newly available） | 同步 | 同步 | 异步 | 异步 | 异步 + Worker 内同步句柄 |
| 数据形态 | 字符串 | 仅字符串 | 仅字符串 | 结构化克隆对象 | Request/Response 对 | 文件字节流 |
| 生命周期 | 到期时间 / 会话 | 持久（受驱逐） | 标签页会话 | 持久（受驱逐） | 持久（受驱逐） | 持久（受驱逐） |
| 随请求发送 | **是** | 否 | 否 | 否 | 否 | 否 |
| Worker 可达 | `document.cookie` 否 | 否 | 否 | 是 | 是 | 是（同步句柄仅 Worker） |
| JS 不可读选项 | **HttpOnly** | 无 | 无 | 无 | 无 | 无 |
| 典型场景 | 会话凭证、服务端要读的小状态 | 主题/语言偏好 | 单页签草稿、向导态 | 结构化/离线数据 | 静态资源离线（PWA） | 大文件、SQLite-wasm |

## 配额数值表

MDN《Storage quotas and eviction criteria》口径（web.dev 补充项已标注；运行时判断以 `estimate()` 为准）：

| 浏览器 | best-effort | persistent | 补充 |
| --- | --- | --- | --- |
| Chrome / Edge | 单源 ≤ 磁盘 **60%** | 同 60% | 浏览器整体 ~80%；无痕 ~**5%**、「关窗清数据」~**300 MB**（web.dev） |
| Firefox | **min(磁盘 10%, 10 GiB/eTLD+1 组)** | 磁盘 **50%**（≤ 8 TiB），免组限 | 组限按站点（eTLD+1）聚合多子域 |
| Safari（macOS 14 / iOS 17+） | 浏览器内单源 ~**60%**；WKWebView 内 ~**15%** | 同左 | 整体 80% / App 内 20%；跨源 frame ≈ 父配额 1/10；加主屏 Web App 享浏览器配额 |
| Safari（旧版） | 起步 **1 GiB**，弹窗按 **200 MB** 递增（web.dev） | — | 「Safari 1GB 递增提示」出处 |
| Web Storage（各浏览器） | localStorage 与 sessionStorage **各 ~5 MiB/源** | — | 独立于共享配额；超限同步抛错 |

共享配额覆盖：IndexedDB、Cache API、OPFS、WebAssembly 代码缓存；不含 Web Storage 与 Cookie。

## 驱逐规则表

| 规则 | 触发 | 范围 | 豁免 |
| --- | --- | --- | --- |
| **LRU 驱逐** | 存储压力（磁盘紧张 / 浏览器总占用超上限） | 最久未用的源，**整源清除**（防半删不一致） | persistent 桶跳过 |
| **Safari ITP 7 天** | 连续 7 个 Safari 使用日无交互 | 该站**全部脚本可写存储**（IndexedDB/Cache/SW 注册/localStorage…） | 服务端 Set-Cookie 的 Cookie；**已安装 PWA**；交互重置计时 |
| **无痕模式** | 关闭无痕窗口 | 全部（localStorage 亦如 sessionStorage） | 无 |
| **用户清除** | 手动「清除站点数据」 | 全部（含 OPFS） | persistent 桶不被「清缓存」波及，但用户显式操作照删 |

超限（非驱逐）报错：Web Storage `setItem` 同步抛 `QuotaExceededError`；IndexedDB 事务 `onabort`；Cache API 写入 reject。

## Web Storage 行为细节表

| 行为 | localStorage | sessionStorage |
| --- | --- | --- |
| 隔离键 | 源 | **标签页 + 源**（页面会话） |
| 刷新 / 崩溃恢复标签页 | 保留 | **保留**（页面会话未结束） |
| 关闭标签页 | 保留 | **清空** |
| 新标签页初值 | 同源共享同一份 | 有 `opener` 则**拷贝**一份初值（noopener 阻断；拷贝后独立） |
| 无痕模式 | 退化如 sessionStorage：关无痕窗即清 | 行为不变 |
| storage 事件可达 | 同源**其他**标签页/文档（发起者不触发） | 仅同标签页内其他文档（如 iframe） |
| 超限 | `setItem` 同步抛 `QuotaExceededError` | 同 |
| Worker | 不可用 | 不可用 |

## Storage API（navigator.storage）方法表

| 方法 | 返回 | 用途 | 备注 |
| --- | --- | --- | --- |
| `estimate()` | `Promise<{usage, quota}>` | 查用量与配额（字节） | 估算值：反指纹混淆、去重/压缩致偏差 |
| `persist()` | `Promise<boolean>` | 把源的桶从 best-effort 升为 persistent | Firefox 弹窗；Chromium/Safari 按交互史静默裁决 |
| `persisted()` | `Promise<boolean>` | 查询当前是否已持久 | 不触发申请 |
| `getDirectory()` | `Promise<FileSystemDirectoryHandle>` | **OPFS 根目录**入口 | 需安全上下文；Worker 可用 |

相关但别混淆：`navigator.storageBuckets.open(name, { persisted, durability })`（Storage Buckets API，Chromium 122，WICG 提案）——桶内经 `bucket.indexedDB` / `bucket.caches` 访问各存储端点。

## 分区与新特性状态表

| 特性 | Chrome | Firefox | 规范状态 |
| --- | --- | --- | --- |
| 存储分区（源 + 顶级站点双键） | **115 默认**（含祖先位；137 起 Blob URL 亦分区） | **103 默认**（网络状态 85 起永久分区） | Privacy CG 工作项 |
| Storage Access API（解分区 Cookie） | 支持 | 支持（授权 30 天 + 过渡启发式） | 已标准化推进 |
| Storage Buckets API | **122 起** | 立场评估中 | WICG 提案 |
| 第三方 Cookie 默认淘汰 | **2024-07 官宣反转**，不再单方面默认淘汰 | —（另行限制） | 见网络章 |

## 术语表

| 术语 | 含义 |
| --- | --- |
| **源（origin）** | scheme + host + port 三元组；绝大多数存储隔离与配额的记账单位 |
| **站点（site / eTLD+1）** | 有效顶级域 + 一级（如 `example.com`）；Firefox 组配额与分区「顶级站点」键的单位 |
| **页面会话（page session）** | sessionStorage 的生命周期单位：随标签页生灭，跨刷新/恢复存活 |
| **桶（bucket）** | WHATWG Storage 模型中一个源的存储记账与驱逐单元 |
| **best-effort / persistent** | 桶的两种模式：默认可被静默驱逐 vs `persist()` 成功后仅用户显式操作可清 |
| **存储压力（storage pressure）** | 磁盘紧张或浏览器总占用超上限——LRU 驱逐的触发条件 |
| **结构化克隆（structured clone）** | IndexedDB 的存值算法：保形存对象/Date/Map/Blob/ArrayBuffer；函数与 DOM 节点抛 `DataCloneError` |
| **存储分区（storage partitioning）** | 三方 iframe 的存储按「源 + 顶级站点」双键隔离（Chrome 115 / Firefox 103 默认） |
| **ITP** | Safari 智能反追踪：7 个使用日无交互即清空该站脚本可写存储 |
| **OPFS** | 源私有文件系统：用户不可见、无权限弹窗，Worker 内有同步访问句柄 |
| **同步访问句柄（sync access handle）** | OPFS 在 Worker 中的高性能接口：`read`/`write`/`flush`/`truncate`/`getSize` 皆同步 |

## 权威链接

- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) · [Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) · [Document.cookie](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)
- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) · [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [MDN: Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API) · [Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [MDN: State Partitioning](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning) · [Privacy Sandbox: Storage partitioning](https://privacysandbox.google.com/cookies/storage-partitioning)
- [web.dev: Storage for the web](https://web.dev/articles/storage-for-the-web) · [Chrome: Storage Buckets API](https://developer.chrome.com/docs/web-platform/storage-buckets)
- 规范：[WHATWG Storage Standard](https://storage.spec.whatwg.org/) · [W3C Indexed Database API 3.0](https://w3c.github.io/IndexedDB/) · [RFC 6265（HTTP State Management）](https://datatracker.ietf.org/doc/html/rfc6265)

## 相关页

- 本叶：[入门](./getting-started) · [存储全景与选型矩阵](./guide-line/storage-overview) · [Cookie 的浏览器侧](./guide-line/cookie-browser-side) · [Web Storage 存储模型](./guide-line/web-storage-model) · [IndexedDB 定位与 OPFS](./guide-line/indexeddb-opfs) · [配额与驱逐](./guide-line/quota-eviction) · [存储分区与 Storage Buckets](./guide-line/partitioning-buckets)
- 网络章：[Cookie 与会话管理](/zh/base/network/net-http-basics/guide-line/cookies-sessions)（Set-Cookie 语义、会话方案） · [SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep)（SameSite/CHIPS 深挖）
- 兄弟叶：[浏览器缓存](../browser-cache/)（HTTP 缓存与 Service Worker/Cache API 实战） · [浏览器架构与进程模型](../browser-architecture/)
- localStorage/IndexedDB/OPFS 的完整 API 用法归 Web API 章（待产出）
