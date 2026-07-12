---
layout: doc
outline: [2, 3]
---

# 参考：API 速查 / 支持矩阵 / 易错点

> 基于 WHATWG File API / File System 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **三层能力**：File/Blob/FileReader（**只读**、全浏览器 Baseline）｜ File System Access（读写**可见**文件、**仅 Chromium**）｜ OPFS（**私有**高性能、主入口 Baseline）。
- **Blob**：`new Blob(parts, { type, endings })`；属性 `size`/`type`；方法 `slice(start,end,type?)`/`text()`/`arrayBuffer()`/`bytes()`/`stream()`。
- **File**：`new File(parts, name, { type, lastModified })`；`Blob` 子类，加 `name`/`lastModified`/`webkitRelativePath`。
- **FileReader**：`readAsText(blob,enc?)`/`readAsDataURL`/`readAsArrayBuffer`/`abort()`；事件 `load`/`error`/`progress`/`loadend`；`readAsBinaryString` **废弃**。
- **新读法替代 FileReader**：`await blob.text()`/`arrayBuffer()`/`bytes()`、`blob.stream()`——除非要 `progress`/`abort`。
- **object URL**：`URL.createObjectURL(blob)` 造 `blob:`；`URL.revokeObjectURL(url)` 释放——**必配对**否则泄漏。
- **File System Access 入口**：`showOpenFilePicker()` → **`FileSystemFileHandle[]`**；`showSaveFilePicker()` → **`FileSystemFileHandle`**；`showDirectoryPicker()` → **`FileSystemDirectoryHandle`**；**都要用户激活、仅 HTTPS、仅 Chromium**。
- **FileSystemFileHandle**：`kind:"file"`；`getFile()` → `File`；`createWritable(opts?)` → 可写流；`createSyncAccessHandle()`（OPFS+Worker）。
- **FileSystemDirectoryHandle**：`kind:"directory"`；`getFileHandle(name,{create?})`/`getDirectoryHandle(name,{create?})`/`removeEntry(name,{recursive?})`/`resolve(h)`/`entries()`/`keys()`/`values()`。
- **FileSystemWritableFileStream**：`write(data | {type,position,size,data})`/`seek(pos)`/`truncate(size)`/`close()`；写临时文件，**close 才落盘**；`createWritable({keepExistingData})`。
- **权限（Chromium 非标准）**：`handle.queryPermission({mode})`/`requestPermission({mode})`，`mode:"read"|"readwrite"` → `"granted"|"denied"|"prompt"`。
- **OPFS 入口**：`await navigator.storage.getDirectory()` → 根 `FileSystemDirectoryHandle`；**免授权、主入口 Baseline**。
- **FileSystemSyncAccessHandle（限 Worker、全同步）**：`read(buf,{at})`/`write(buf,{at})`/`getSize()`/`truncate(size)`/`flush()`/`close()`。
- **支持面记忆**：File/Blob/FileReader 2015 全浏览器；picker 三兄弟仅 Chromium；OPFS `getDirectory`+`createSyncAccessHandle` 2023-03 起 Chrome102/Safari15.2/FF111。
- **句柄可持久化**：`FileSystemHandle` 结构化克隆 → 存 **IndexedDB**（非 localStorage），取回需重新 `requestPermission`。
- **下载万能式**：`Blob`→`createObjectURL`→`<a download>`→`click`→`revokeObjectURL`。
- **切片**：`blob.slice(start,end,type?)` 零拷贝，大文件分片/断点续传基础。
- **定位/配额只链接**：存哪、多大、何时被清、`persist()` → [浏览器存储章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)；结构化数据夹 Blob → [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)。

## 一、能力分层全景

| 层 | 接口/入口 | 能做 | 支持面 |
| --- | --- | --- | --- |
| 数据对象 | `Blob` / `File` | 表示字节 + 类型（+文件名） | 全浏览器 Baseline（2015） |
| 读 | `FileReader` / `Blob.text/arrayBuffer/bytes/stream` | 把 Blob 读成文本/二进制/流 | 全浏览器 Baseline |
| 引用 | `URL.createObjectURL/revokeObjectURL` | 给 Blob 造临时 URL | 全浏览器 Baseline |
| 可见文件读写 | `showOpen/Save/DirectoryPicker` + 句柄 | 读写用户可见文件/目录 | **仅 Chromium**，非 Baseline |
| 私有文件系统 | `navigator.storage.getDirectory()` + 句柄 | 源私有高性能读写 | 主入口 Baseline（2023-03） |
| 私有同步读写 | `createSyncAccessHandle` | Worker 内同步字节读写 | Baseline（限 Worker+OPFS） |

## 二、Blob 与 File

| 成员 | 签名 / 说明 |
| --- | --- |
| `new Blob(parts, options?)` | `parts` 数组（字符串/`BufferSource`/`Blob`）；`options`：`type`、`endings`(`"transparent"`/`"native"`) |
| `blob.size` | 字节数（只读，编码后字节非字符数） |
| `blob.type` | MIME 字符串（只读，未知为 `""`，仅标签不校验内容） |
| `blob.slice(start?, end?, contentType?)` | `→ Blob`，字节区间 `[start,end)`，负数从末尾，零拷贝 |
| `blob.text()` | `→ Promise<string>`（UTF-8） |
| `blob.arrayBuffer()` | `→ Promise<ArrayBuffer>` |
| `blob.bytes()` | `→ Promise<Uint8Array>`（较新） |
| `blob.stream()` | `→ ReadableStream` |
| `new File(parts, name, options?)` | `Blob` 子类；`options` 多 `lastModified` |
| `file.name` | 文件名（不含路径） |
| `file.lastModified` | 最后修改毫秒时间戳 |
| `file.webkitRelativePath` | 目录选择时的相对路径，否则 `""` |

## 三、FileReader

| 成员 | 说明 |
| --- | --- |
| `new FileReader()` | 构造 |
| `readAsText(blob, encoding?)` | `result` 为字符串，默认 UTF-8 |
| `readAsDataURL(blob)` | `result` 为 `data:` URL（base64 内联） |
| `readAsArrayBuffer(blob)` | `result` 为 `ArrayBuffer` |
| ~~`readAsBinaryString(blob)`~~ | **已废弃**，改用 `readAsArrayBuffer` |
| `abort()` | 中止读取 |
| `result` / `error` / `readyState` | 结果 / `DOMException` / `EMPTY(0)`/`LOADING(1)`/`DONE(2)` |
| 事件 | `loadstart`/`progress`/`load`/`abort`/`error`/`loadend` |

**何时仍用 FileReader**：需要 `progress` 进度、`abort()` 取消、或 `readAsDataURL`；否则新代码用 Blob 的 Promise 方法。

## 四、File System Access vs OPFS 对比

| 维度 | **File System Access（picker）** | **OPFS** |
| --- | --- | --- |
| 入口 | `showOpen/Save/DirectoryPicker()` | `navigator.storage.getDirectory()` |
| 文件可见性 | 用户桌面**可见**的真实文件 | 源**私有**、用户不可见 |
| 授权 | 每次 picker 要**用户激活**；写要确权 | **免授权**，直接可用 |
| 支持面 | **仅 Chromium** | 主入口**跨浏览器 Baseline** |
| 同步 API | 无 | **有**（`createSyncAccessHandle`，限 Worker） |
| 写方式 | `createWritable`（异步） | `createWritable`（异步）或同步句柄 |
| 句柄类型 | `FileSystemFileHandle`/`DirectoryHandle`（同一套） | 同左（复用） |
| 典型用途 | 打开/编辑/保存用户文档 | 数据库、缓存、离线大文件（应用自用） |
| 数据归属 | 用户的文件 | 应用私有数据（清站点数据即没） |

## 五、句柄方法表

### 5.1 FileSystemHandle（基类）

| 成员 | 说明 |
| --- | --- |
| `kind` | `"file"` / `"directory"` |
| `name` | 条目名 |
| `isSameEntry(other)` | `→ Promise<boolean>` 是否同一条目 |
| `queryPermission({ mode })` | `→ "granted"/"denied"/"prompt"`（**Chromium 非标准**） |
| `requestPermission({ mode })` | 同上，会弹窗、需用户激活（**Chromium 非标准**） |

### 5.2 FileSystemFileHandle

| 成员 | 签名 / 说明 |
| --- | --- |
| `getFile()` | `→ Promise<File>`，磁盘当前快照 |
| `createWritable(options?)` | `→ Promise<FileSystemWritableFileStream>`；`{ keepExistingData }` 保留原内容 |
| `createSyncAccessHandle(options?)` | `→ Promise<FileSystemSyncAccessHandle>`，**仅 OPFS + Dedicated Worker**；`{ mode }` 较新 |

### 5.3 FileSystemDirectoryHandle

| 成员 | 签名 / 说明 |
| --- | --- |
| `getFileHandle(name, { create? })` | `→ Promise<FileSystemFileHandle>`；缺省不存在抛 `NotFoundError` |
| `getDirectoryHandle(name, { create? })` | `→ Promise<FileSystemDirectoryHandle>` |
| `removeEntry(name, { recursive? })` | `→ Promise<void>`；`recursive` 删非空目录 |
| `resolve(handle)` | `→ Promise<string[] \| null>` 相对路径段 |
| `entries()` / `keys()` / `values()` | 异步迭代器（`[name,handle]` / `name` / `handle`） |
| `for await (const [n,h] of dir)` | 等价 `entries()` |

### 5.4 FileSystemWritableFileStream（继承 WritableStream）

| 成员 | 说明 |
| --- | --- |
| `write(data)` | 写 string/`BufferSource`/`Blob` 到光标处 |
| `write({ type:"write", position, data })` | 指定位置写 |
| `write({ type:"seek", position })` / `seek(pos)` | 移动光标 |
| `write({ type:"truncate", size })` / `truncate(size)` | 裁剪文件 |
| `close()` | **关闭并原子落盘**（不调用则丢弃） |
| `abort()` | 放弃 |

### 5.5 FileSystemSyncAccessHandle（限 Worker，全同步）

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `getSize()` | `→ number` | 当前字节数 |
| `read(buffer, { at })` | `→ number` | 读入 `buffer`，返回读到字节数 |
| `write(buffer, { at })` | `→ number` | 写 `buffer`，返回写入字节数 |
| `truncate(size)` | `→ void` | 裁剪/扩展 |
| `flush()` | `→ void` | 强制落盘 |
| `close()` | `→ void` | 关闭、释放独占锁（**必调**） |

> `createSyncAccessHandle()` 本身是 `async`（要 `await`），返回句柄上的方法**全同步**。

## 六、三路线支持矩阵

| 特性 | Chrome/Edge | Firefox | Safari | Baseline |
| --- | --- | --- | --- | --- |
| `Blob`/`File`/`FileReader` | ✅ | ✅ | ✅ | ✅（2015） |
| `Blob.text/arrayBuffer/stream` | ✅ | ✅ | ✅ | ✅ |
| `URL.createObjectURL` | ✅ | ✅ | ✅ | ✅ |
| `showOpen/Save/DirectoryPicker` | ✅ | ❌ | ❌ | ❌（仅 Chromium） |
| `FileSystemWritableFileStream` 接口 | ✅ | ✅ | ✅ | ✅（近年）但 picker 入口仍锁 Chromium |
| `navigator.storage.getDirectory()`（OPFS 根） | ✅ 102 | ✅ 111 | ✅ 15.2 | ✅（2023-03） |
| `createSyncAccessHandle()`（Worker） | ✅ | ✅ | ✅ | ✅（限 Worker+OPFS） |
| OPFS 主线程 `createWritable` | ✅ | ✅ | ✅ | ✅ |

关键推论：**同样是"写文件"，OPFS 里跨浏览器、picker 里仅 Chromium**——特性检测按具体入口做（`'showOpenFilePicker' in window` 与 `'getDirectory' in navigator.storage` 分别测）。

## 七、易错点清单

- **忘了 `revokeObjectURL`**：object URL 常驻到文档卸载——预览 `onload` 后、下载 `click` 后立即撤。
- **把 File System Access 当默认能力**：仅 Chromium——面向公网必须写 `<input>`+`<a download>` 降级（见 [File System Access 页](./guide-line/file-system-access)）。
- **picker 不在用户手势里调**：抛 `SecurityError`——`showOpenFilePicker` 等必须在 click 等回调里。
- **`http://` 页面调 File System Access/OPFS**：入口根本不存在——仅安全上下文。
- **`showOpenFilePicker` 当返回单句柄**：它返回**数组**（哪怕单选）——`const [h] = await showOpenFilePicker()`。
- **`createWritable` 后不 `close()`**：写进的是临时文件，不 close 改动全丢——写完必 `await writable.close()`。
- **以为句柄持久化就带权限**：权限不随句柄持久化——重开会话取回句柄需重新 `requestPermission`。
- **把句柄存 localStorage**：只存字符串存不了句柄——句柄要存 **IndexedDB**（可结构化克隆）。
- **在主线程调 `createSyncAccessHandle`**：同步 API 仅 Dedicated Worker——主线程用异步 `createWritable`。
- **同步句柄用完不 `close()`**：默认独占锁不释放，文件锁死——用完必 `close()`。
- **大文件整体 `arrayBuffer()`/`text()`**：GB 级全进内存——用 `slice()` 分片或 `stream()`。
- **只信 `file.type`/扩展名做安全校验**：可伪造——服务端按魔数/内容校验。
- **`blob.size` 当字符数**：是编码后字节数，中文每字 3 字节——按字符数用 `str.length`。
- **CSV 中文乱码**：Excel 需 UTF-8 BOM——`new Blob(["﻿"+csv], ...)`。
- **`readAsBinaryString`**：已废弃——改 `readAsArrayBuffer` 或 `arrayBuffer()`。
- **`blob.text()` 读非 UTF-8**：固定 UTF-8——GBK 等用 `arrayBuffer()`+`TextDecoder("gbk")`。
- **把三条路线当一个特性检测**：OPFS 可用 ≠ picker 可用（Safari/FF 正是如此）——分入口检测。
- **把 OPFS 当用户可见文件**：OPFS 私有、用户看不到——要用户可见用 File System Access。
- **依赖配额而不申请持久化**：默认存储可能被驱逐——`navigator.storage.persist()`，详见浏览器章。

## 八、权威链接

- [MDN: File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) —— 接口总览与指南入口
- [MDN: File](https://developer.mozilla.org/en-US/docs/Web/API/File) ｜ [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) ｜ [FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) —— 数据对象与读取
- [MDN: Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) —— OPFS 完整说明
- [MDN: FileSystemFileHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle) ｜ [DirectoryHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle) ｜ [WritableFileStream](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream) ｜ [SyncAccessHandle](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemSyncAccessHandle) —— 句柄 API
- [MDN: showOpenFilePicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker)（明确标注"Limited availability / 非 Baseline"）
- [Chrome for Developers: The File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) —— 官方指南与降级建议
- [WHATWG File System 现行标准](https://fs.spec.whatwg.org/) ｜ [whatwg/fs](https://github.com/whatwg/fs) —— 规范原文与 issue
- [W3C File API 规范](https://w3c.github.io/FileAPI/) ｜ [w3c/FileAPI](https://github.com/w3c/FileAPI) —— Blob/File/FileReader 规范
- [browser-fs-access](https://github.com/GoogleChromeLabs/browser-fs-access) —— 自动"优先原生、降级 input/a" 的封装库
- 本站相邻内容：[浏览器章 · IndexedDB 与 OPFS 定位](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs) ｜ [配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction) ｜ [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)
