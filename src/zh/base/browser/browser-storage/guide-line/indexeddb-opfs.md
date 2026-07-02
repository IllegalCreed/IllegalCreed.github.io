---
layout: doc
outline: [2, 3]
---

# IndexedDB 定位与 OPFS

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **IndexedDB**：浏览器内建的**事务型对象数据库**——按键索引的对象存储（object store），不是 SQL 表
- **全异步**：操作经由请求对象以事件回调结果，不阻塞主线程；曾有的同步版 API **已从规范移除**
- 能存**结构化克隆**支持的一切：对象/数组、`Date`、`Map`/`Set`、`Blob`/`File`、`ArrayBuffer`/TypedArray——**不需要 JSON 序列化**
- 存不了：**函数、DOM 节点**（抛 `DataCloneError`）；原型链/属性描述符不保留
- **严格同源隔离**；容量走**共享源配额**（GB 级，远超 Web Storage 的 ~5 MiB）
- **Worker/Service Worker 全可用**（`WorkerGlobalScope.indexedDB`）——重数据处理可整体挪出主线程
- 原生 API 是出名的啰嗦（事务/版本/游标全靠事件），web.dev 建议配 **Promise 包装库 `idb`**
- **OPFS（Origin Private File System）**：**源私有文件系统**——对用户不可见、无权限弹窗，入口 `navigator.storage.getDirectory()`
- OPFS 与「用户可见的 File System Access API」是两回事：后者带选择器与安全检查且仅 Chromium；OPFS 是 **Baseline**（2023-03 起全浏览器），写入**原地生效**、性能高
- OPFS 王牌：Worker 内的**同步访问句柄** `createSyncAccessHandle()`——`read`/`write`/`flush`/`truncate`/`getSize` 全同步，字节级高性能，**SQLite-wasm 的标配后端**
- 两者数据都算入源配额、都受驱逐、都要 HTTPS（OPFS 要求安全上下文）
- 本页只讲**定位与模型**；事务、游标、句柄的完整 API 归 Web API 章（待产出）

## 一、IndexedDB：把「数据库」三个字当真

IndexedDB 是浏览器里真正意义上的数据库：**事务型、按键索引、面向对象存储**。与 Web Storage 的差距不是「容量大一点」，而是整个范式不同：

| | Web Storage | IndexedDB |
| --- | --- | --- |
| 数据模型 | 扁平键值（仅字符串） | **对象存储 + 索引**（object store / index） |
| 一致性 | 无 | **事务**（readonly / readwrite） |
| 调用方式 | 同步 | **异步**（事件/请求对象） |
| 查询 | 按键取值 | 键、键范围（key range）、索引、游标 |
| 容量 | ~5 MiB/源 | 共享源配额（GB 级） |
| Worker | 不可用 | **可用** |

三个模型级要点：

- **异步是底线**：所有读写都不阻塞主线程；规范早期还有一套同步 API，**已被移除**——「同步用 IndexedDB」这条路根本不存在。
- **版本化 schema**：库结构（有哪些 object store、哪些索引）在版本升级事件里定义，这是它保证结构演进有序的机制。
- **严格同源**：域 A 存的数据域 B 永远拿不到，与其他存储机制的隔离规则一致。

## 二、能存什么：结构化克隆的边界

IndexedDB 存值用的是**结构化克隆算法（structured clone）**，这是它对 Web Storage 的降维打击——**不需要 JSON，也不丢形**：

| 能直接存（保形） | 存不了 |
| --- | --- |
| 原始值、普通对象、数组 | **函数**（抛 `DataCloneError`） |
| `Date`、`RegExp` | **DOM 节点**（抛 `DataCloneError`） |
| `Map`、`Set` | getter/setter、属性描述符（不保留） |
| `Blob`、`File` | 原型链（类实例存进去、取出来是普通对象） |
| `ArrayBuffer`、TypedArray | |

工程直觉：接口返回的大数组、含 `Date` 的记录、用户上传的 `File`、二进制缓冲——直接整个丢进去，取出来还是原来的形状。这正是「结构化数据放 IndexedDB」的底气。

## 三、容量、Worker 与工程姿势

- **容量**：走 IndexedDB/Cache API/OPFS 共享的**源级配额**——Chrome 单源可达磁盘 60%，动辄几十 GB（数值与驱逐规则见[配额与驱逐](./quota-eviction)）。「几 MB 就发愁」的时代到此为止。
- **Worker 可用**：`indexedDB` 在 window、Web Worker、Service Worker 里都有。重查询、批量写入、导入导出可以整体放进 Worker，主线程只收结果。
- **API 人体工学**：原生 API 是事件驱动的请求-回调风格，事务、版本升级、游标遍历全要手写样板。web.dev 的建议是配 **Promise 包装库 `idb`**（隐藏事务与版本机器，换来 async/await 手感）。方法签名、事务规则、游标细节这些实操内容归 Web API 章（待产出），本叶点到定位为止。

## 四、OPFS：给源一块私有磁盘

**OPFS（Origin Private File System，源私有文件系统）**是 File System API 里「私有」的那一半：每个源一棵**对用户不可见**的文件树，入口一行：

```js
// OPFS 根目录（FileSystemDirectoryHandle）；需要安全上下文（HTTPS）
const opfsRoot = await navigator.storage.getDirectory();
```

### 4.1 与「用户可见的文件系统访问」划清界限

| | File System Access API（用户可见） | **OPFS** |
| --- | --- | --- |
| 用户可见性 | 真实文件系统，用户选文件 | **源私有**，用户看不见 |
| 权限 | `showOpenFilePicker()` + 权限弹窗 | **无任何弹窗** |
| 写入路径 | 临时文件 + 安全检查（慢） | **原地写入（快）** |
| 兼容性 | 仅 Chromium（web.dev 不推荐） | **Baseline**：2023-03 起全浏览器 |

两者共用 `FileSystemFileHandle`/`FileSystemDirectoryHandle` 这套句柄类型，但定位完全不同：前者是「替用户管他的文件」，OPFS 是「给应用一块高性能私有盘」。

### 4.2 同步访问句柄：Worker 里的高性能王牌

OPFS 在主线程走异步（`getFile()` 读、`createWritable()` 写）；真正的杀手锏是**仅 Web Worker 可用**的同步句柄：

```js
// 仅 Worker 内：创建同步访问句柄（创建这一步本身是异步的）
const handle = await fileHandle.createSyncAccessHandle();

// 之后 read / write / flush / truncate / getSize 全是【同步】调用——
// 无 Promise 开销，字节级随机读写
const size = handle.getSize();
handle.write(new TextEncoder().encode("追加内容"), { at: size });
handle.flush(); // 确保落盘
handle.close();
```

「在 Worker 里同步」听着矛盾，其实正是设计点：**同步调用的低开销 + Worker 隔离保证不卡主线程**。这让 OPFS 成为把传统文件型软件搬上 Web 的地基——最典型的是 **SQLite-wasm 官方把 OPFS 当持久化后端**：数据库引擎需要的就是高频、小块、随机的同步 I/O。

### 4.3 归属与清理

OPFS 不是法外之地：**用量算入源配额**（`navigator.storage.estimate()` 的 usage 里包含它）、受同一套驱逐规则管、用户「清除站点数据」会连它一起删。文件也不与真实磁盘一一对应——别指望在 Finder/资源管理器里找到它们。

## 五、选型再落一锤

- **结构化记录**（列表、缓存、含索引查询需求）→ IndexedDB。
- **文件语义**（大二进制、需要字节级随机读写、wasm 数据库文件）→ OPFS。
- **别过度设计**：三五个偏好字段仍然属于 localStorage，为它们开数据库/文件系统是杀鸡用牛刀。
- 两者互补而非竞争；配合 Worker 都能把重 I/O 全部移出主线程。
- 两者的数据都在共享源配额与驱逐规则的管辖内——「持久」依旧不等于「保证不丢」。
- API 细节（事务、游标、句柄方法逐个讲）留给 Web API 章（待产出）。

## 小结

- IndexedDB 是异步事务型对象数据库：对象存储 + 索引 + 事务 + 版本化 schema，同步 API 已从规范移除。
- 结构化克隆让它「存什么都保形」：Date/Map/Blob/ArrayBuffer 直接存；函数与 DOM 节点是边界（DataCloneError）。
- 容量走共享源配额（GB 级）、Worker 全可用；原生 API 啰嗦，web.dev 推荐 `idb` 包装。
- OPFS 是源私有文件系统：无权限弹窗、原地写入、Baseline 全浏览器；Worker 内同步访问句柄是 SQLite-wasm 级性能的来源。
- 两者都算配额、都可能被驱逐——「能存多大、何时被清」的完整答案在下一页：[配额与驱逐](./quota-eviction)。
