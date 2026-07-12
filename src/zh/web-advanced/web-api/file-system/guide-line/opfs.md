---
layout: doc
outline: [2, 3]
---

# OPFS：源私有文件系统

> 基于 WHATWG File API / File System 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **OPFS 是什么**：Origin Private File System——一个**源独占、用户不可见、无授权弹窗**的沙盒文件系统，专为高性能字节级读写设计（SQLite WASM、离线大文件、缓存）。
- **主入口 Baseline**：`await navigator.storage.getDirectory()` 返回 `Promise<FileSystemDirectoryHandle>`（OPFS 根目录）——**已跨浏览器 Baseline**（Chrome 102 / Safari 15.2 / Firefox 111 起，2023-03）。
- **与 File System Access 复用句柄类型**：拿到根目录后用的是同一套 `FileSystemDirectoryHandle`/`FileSystemFileHandle` API——但 OPFS **不需要 picker、不需要用户激活、不需要权限确认**。
- **两条写路径**：主线程**异步** `createWritable()`（返 `FileSystemWritableFileStream`）；**Worker 内同步** `createSyncAccessHandle()`（返 `FileSystemSyncAccessHandle`）。
- **`createSyncAccessHandle()` 关键约束**：**只能在 Dedicated Web Worker 内用**、方法全**同步**、默认对文件加**独占锁**——是 OPFS 性能主力，SQLite WASM 靠它。跨浏览器可用（同 OPFS 起始版本）。
- **同步句柄方法**：`read(buffer, { at })` → 读入字节数；`write(buffer, { at })` → 写入字节数；`getSize()` → 字节数；`truncate(size)`；`flush()` 落盘；`close()` 释放锁——全同步、无 `await`。
- **建文件/目录**：`getFileHandle(name, { create: true })`、`getDirectoryHandle(name, { create: true })`——`create:true` 不存在则建，缺省则不存在时抛 `NotFoundError`。
- **删除**：父目录 `removeEntry(name, { recursive })`；或句柄自身 `remove()`（新）/ 目录 `remove({ recursive: true })`；清空整个 OPFS = 根 `remove({ recursive: true })`。
- **遍历**：根/子目录是异步迭代器——`for await (const [name, handle] of dirHandle.entries())`，同 File System Access。
- **私有 vs 可见**：OPFS 文件**不在用户文件管理器里**、路径不可见、别的源访问不到；File System Access 操作的是用户桌面上**可见**的真实文件——两者是不同世界。
- **主线程也能读**：`fileHandle.getFile()` 在主线程返回 `File`，可 `await file.text()`——读向来简单，纠结点只在"高性能写"要不要进 Worker。
- **`createWritable` 也在 OPFS 可用且跨浏览器**：不想上 Worker 时，主线程异步 `createWritable` 写 OPFS 完全可行，只是吞吐不如同步句柄。
- **仅安全上下文**：OPFS 只在 HTTPS/localhost；`'getDirectory' in navigator.storage` 特性检测。
- **配额与持久化不在本页**：OPFS 占用多少、会不会被驱逐、`navigator.storage.persist()` 怎么申请持久化 → [浏览器存储章 IndexedDB 与 OPFS](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs) 与[配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction)；本页只讲 API。
- **典型落点**：把 SQLite / DuckDB 编译成 WASM 后用 OPFS 当持久层、视频编辑的临时素材、大模型权重缓存——需要"文件语义 + 大容量 + 高吞吐"的场景。
- **和 IndexedDB 的分工**：结构化记录 + 索引查询用 [IndexedDB](/zh/web-advanced/web-api/indexeddb/)；裸字节流、随机读写、数据库文件用 OPFS——选型详见浏览器存储章。

## 一、OPFS 是什么：私有、免授权、高性能

OPFS（Origin Private File System，源私有文件系统）是 File System API 的另一半：**同样是 `FileSystemDirectoryHandle`/`FileSystemFileHandle` 那套句柄 API，但作用在一个对用户不可见的沙盒里**。三个决定性特征：

- **源私有**：每个源（origin）有自己独立的一棵文件树，**别的源看不到、用户在文件管理器里也看不到**，路径不暴露。
- **免授权**：没有 picker、没有权限弹窗、没有用户激活要求——代码直接 `getDirectory()` 就能读写。
- **高性能**：为字节级、随机、高频读写优化；Worker 内的同步 API 吞吐达到数据库级，是"把 SQLite 搬进浏览器"方案的落点。

它和上一页的 [File System Access](./file-system-access) 是**两个世界**：那个操作用户桌面上**可见**的真实文件、仅 Chromium；OPFS 操作**私有沙盒**、且**主入口已跨浏览器 Baseline**（Chrome 102 / Safari 15.2 / Firefox 111，2023 年 3 月起）。

```js
// 唯一入口：拿到源私有根目录（免授权，直接可调）
const root = await navigator.storage.getDirectory(); // FileSystemDirectoryHandle

// 特性检测
const hasOPFS = "storage" in navigator && "getDirectory" in navigator.storage;
```

## 二、主线程：异步读写

拿到根目录后，增删查改用的是和 File System Access 完全相同的句柄 API——只是不用弹窗、不用确权。

### 2.1 建文件、写、读

```js
const root = await navigator.storage.getDirectory();

// 建/取文件：create:true 不存在则创建
const fileHandle = await root.getFileHandle("notes.txt", { create: true });

// 写：主线程用异步 createWritable（返回 FileSystemWritableFileStream）
const writable = await fileHandle.createWritable();
await writable.write("第一行\n"); // 写进临时文件
await writable.write("第二行\n");
await writable.close(); // close 时落盘

// 读：getFile 拿 File，之后就是普通 File 读法
const file = await fileHandle.getFile();
console.log(await file.text()); // "第一行\n第二行\n"
```

### 2.2 建目录、嵌套、遍历、删除

```js
const root = await navigator.storage.getDirectory();

// 嵌套目录
const dbDir = await root.getDirectoryHandle("databases", { create: true });
const wal = await dbDir.getFileHandle("app.db-wal", { create: true });

// 遍历（异步迭代器，同 File System Access）
for await (const [name, handle] of root.entries()) {
  console.log(handle.kind, name);
}

// 删除：父目录 removeEntry，或递归删非空目录
await dbDir.removeEntry("app.db-wal");
await root.removeEntry("databases", { recursive: true });

// 清空整个 OPFS（把根自己递归删空）
await root.remove?.({ recursive: true }); // remove() 为较新方法，留意兼容
```

`getFileHandle`/`getDirectoryHandle` 的 `{ create: true }`：存在则返回、不存在则创建；不传（或 `false`）时若不存在抛 `NotFoundError`。

## 三、Worker 内：同步高性能读写

OPFS 的**性能杀手锏**是 `createSyncAccessHandle()`——**同步**的字节级读写。但它有一条硬约束：

> **`createSyncAccessHandle()` 返回的 `FileSystemSyncAccessHandle`，其读写方法全是同步的，且只能在 Dedicated Web Worker 里使用**（主线程调用会抛错）。这是刻意设计——同步 I/O 若放主线程会卡死 UI。

跨浏览器可用（与 OPFS 主入口同批落地：Chrome 102 / Safari 15.2 / Firefox 111）。

### 3.1 Worker 内完整示例

```js
// worker.js —— 运行在 Dedicated Web Worker 内
self.onmessage = async () => {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle("fast.bin", { create: true });

  // 拿同步访问句柄——注意 createSyncAccessHandle 本身是异步的（要 await）
  // 但它返回的 handle 上所有方法都是【同步】的（无 await）
  const accessHandle = await fileHandle.createSyncAccessHandle();

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // 写：同步，返回写入字节数；{ at } 指定偏移
  let size = accessHandle.getSize(); // 同步取当前大小（初始 0）
  const bytes = encoder.encode("Some text");
  accessHandle.write(bytes, { at: size }); // 从末尾追加
  accessHandle.flush(); // 同步落盘

  // 读：同步，读入调用者提供的 buffer，返回读到字节数
  size = accessHandle.getSize();
  const buf = new DataView(new ArrayBuffer(size));
  accessHandle.read(buf, { at: 0 });
  const text = decoder.decode(buf);

  // 裁剪与关闭
  accessHandle.truncate(4); // 同步裁到 4 字节
  accessHandle.close(); // ⭐ 必须关闭，释放独占锁

  self.postMessage(text);
};
```

主线程只管起 Worker、收结果：

```js
// main.js
const worker = new Worker("worker.js");
worker.onmessage = (e) => console.log("Worker 读到：", e.data);
worker.postMessage("go");
```

### 3.2 FileSystemSyncAccessHandle 方法（全同步）

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getSize()` | `→ number` | 当前文件字节数 |
| `read(buffer, { at })` | `→ number` | 读入 `buffer`（`ArrayBufferView`），返回读到字节数 |
| `write(buffer, { at })` | `→ number` | 写 `buffer`，返回写入字节数 |
| `truncate(newSize)` | `→ void` | 裁剪/扩展到指定字节 |
| `flush()` | `→ void` | 强制落盘（不调用可能只在内存） |
| `close()` | `→ void` | 关闭并**释放独占锁**——忘了关会锁死文件 |

两个必记点：

- **`createSyncAccessHandle()` 是 `async`（要 `await`），但它返回的句柄上的方法全同步**——这个"异步获取、同步使用"的组合别搞混。
- **默认独占锁**：一个文件同时只能有一个 sync handle，`close()` 前别处再开会失败；新标准支持 `createSyncAccessHandle({ mode })`（`"read-only"`/`"readwrite"`/`"readwrite-unsafe"`）放宽并发，但兼容面窄，保守写法就是"用完即 `close()`"。

### 3.3 为什么它是 SQLite WASM 的主力

把 SQLite 编译成 WASM 跑在浏览器里，需要一个**支持随机偏移读写 + 同步语义**的持久后端——OPFS 的 `FileSystemSyncAccessHandle` 恰好提供 `read/write({ at })` 的随机访问和同步调用，正对 SQLite VFS 的胃口。这也是官方文档反复强调"OPFS 为数据库类高性能场景设计"的原因。实际项目里用 `sql.js`/`wa-sqlite`/官方 `sqlite-wasm` 时，OPFS 就是默认或推荐的持久层。

## 四、私有 vs 可见：和 File System Access 的根本区别

| 维度 | **OPFS** | **File System Access（picker）** |
| --- | --- | --- |
| 文件位置 | 源私有沙盒，用户**不可见** | 用户桌面上**真实可见**的文件/目录 |
| 授权 | **免**——无 picker、无权限弹窗、无用户激活 | 每次 picker 要**用户激活**；写要确权 |
| 支持面 | **主入口 Baseline**（含 Safari/Firefox） | **仅 Chromium** |
| 同步 API | **有**（`createSyncAccessHandle`，限 Worker） | 无（只有异步 `createWritable`） |
| 典型用途 | 数据库、缓存、离线大文件（应用自用） | 让用户"打开/编辑/保存"自己的文档 |
| 数据归属 | 应用的私有数据（清站点数据会没） | 用户的文件（独立于站点数据） |

一句话：**OPFS 是"应用自己的高速私有磁盘"，File System Access 是"借用户之手读写用户自己的文件"**。选 OPFS 当你要存的是应用内部数据（且要大、要快、要私有）；选 File System Access 当你要操作的是用户能在文件管理器里看到的文档。

## 五、配额、驱逐与持久化：链到浏览器存储章

OPFS 的**容量上限、被驱逐规则、以及如何用 `navigator.storage.persist()` 申请"持久化"存储桶**，属于浏览器存储管理的范畴，本站已在浏览器章讲透，本页不重复：

- **能存多大、和 IndexedDB 共享哪块配额** → [浏览器存储章：IndexedDB 与 OPFS 定位](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)
- **什么时候会被清、`persist()` 与 `estimate()` 怎么用** → [浏览器存储章：配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction)

只记一条 API 关联：`await navigator.storage.persist()` 申请把本源存储（含 OPFS 与 IndexedDB）标记为持久、降低被自动清理的概率；`await navigator.storage.estimate()` 查用量与配额。

下一页把三条路线的读写拼成实战工程模式：下载、预览、导出、分片、Blob 存 IndexedDB、以及 File/Blob/ArrayBuffer/Stream 选型——[工程模式](./patterns)。
