---
layout: doc
outline: [2, 3]
---

# 入门：File/Blob 基础与三条文件路线

> 基于 WHATWG File API / File System 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：浏览器操作文件分**三层**——① File/Blob + FileReader（**只读**用户交出的文件，全浏览器 Baseline）；② File System Access（读写用户**可见**文件/目录，仅 Chromium）；③ OPFS（源**私有**高性能文件系统，主入口 Baseline）。本叶讲三层的 API 编程。
- **Blob 是什么**：一坨**不可变**的字节 + 一个 MIME `type`——`new Blob([parts], { type })`；`size`/`type` 两个只读属性；能喂给几乎所有吃二进制的 API。
- **File 是什么**：`Blob` 的**子类**，多了 `name`、`lastModified`（毫秒时间戳）、`webkitRelativePath`；凡是收 `Blob` 的地方都能收 `File`。
- **文件从哪来**：`<input type="file">` 的 `input.files`、拖放的 `event.dataTransfer.files`、`new File(...)` 构造、File System Access 的 `handle.getFile()`、OPFS 的 `fileHandle.getFile()`——**前端拿不到磁盘绝对路径**。
- **怎么读（旧）**：`FileReader` + 事件——`readAsText`/`readAsDataURL`/`readAsArrayBuffer` 配 `onload`/`onerror`/`onprogress`。
- **怎么读（新）**：直接 `await blob.text()` / `await blob.arrayBuffer()` / `await blob.bytes()` / `blob.stream()`——Promise 化、更短、可组合，新代码首选。
- **路线一 · File API**：`<input>`/拖放拿 `File` → 读/解析/上传，**只读、拿不到路径、写不回磁盘**；2015 年起全浏览器 Baseline，是上传预览的地基。
- **路线二 · File System Access**：`showOpenFilePicker`(**返数组**)/`showSaveFilePicker`(**返单句柄**)/`showDirectoryPicker` → `FileSystemFileHandle`/`DirectoryHandle` → `getFile()` 读、`createWritable()` 写回磁盘；**仅 Chromium 非 Baseline、每次调用要用户手势**。
- **路线三 · OPFS**：`await navigator.storage.getDirectory()` 拿源私有根目录 → `getFileHandle(name,{create:true})` → 主线程异步 `createWritable()` 或 **Worker 内同步 `createSyncAccessHandle()`**；**免授权、不可见、`getDirectory()` 已 Baseline**。
- **`slice` 切片**：`blob.slice(start, end, type)` 零拷贝切一段——分片上传、断点续传的基础。
- **object URL**：`URL.createObjectURL(blob)` 造 `blob:` 短链给 `<img src>`/`<a href>`；**用完必 `URL.revokeObjectURL(url)`**，否则内存泄漏。
- **支持面分野（关键）**：File/Blob/FileReader = 全浏览器；`showOpenFilePicker` 等 picker = **仅 Chromium**；OPFS `getDirectory()`+`createSyncAccessHandle` = 三大浏览器（Chrome 102 / Safari 15.2 / Firefox 111 起）；OPFS 异步 `createWritable` 近年也已跨浏览器。
- **特性检测按"入口"而非"整个 API"**：`'showOpenFilePicker' in window`、`'getDirectory' in navigator.storage`、`'createSyncAccessHandle' in FileSystemFileHandle.prototype` 分别测，别一杆子。
- **安全上下文**：File System Access 与 OPFS 均**仅 HTTPS/localhost**；picker 还要瞬时用户激活。
- **与浏览器存储章分工**：文件**存哪、能存多大、何时被清、`persist()` 怎么用** → [浏览器存储章 IndexedDB 与 OPFS](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs) 与[配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction)；本叶只讲 API 怎么写。
- **与 IndexedDB 叶分工**：把 Blob/File 作为一个字段**塞进结构化记录**（连同其他字段一起事务存取）→ [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)；本叶只在[句柄持久化](./guide-line/file-system-access)与[工程模式](./guide-line/patterns)点到"存句柄/存 Blob"。
- **进阶顺序**：本页 → [File/Blob/FileReader](./guide-line/file-blob-reader) → [File System Access](./guide-line/file-system-access) → [OPFS](./guide-line/opfs) → [工程模式](./guide-line/patterns) → [参考](./reference)。

## 一、本叶与相邻内容的分工

文件相关内容在本站分三处，各管一段：

| 问题 | 去哪读 |
| --- | --- |
| 文件存哪、能存多大、什么时候被清、`persist()` 怎么用 | [浏览器存储章：IndexedDB 与 OPFS 定位](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)、[配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction) |
| 把 Blob/File 作为字段连同结构化数据一起事务存取 | [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/) |
| **怎么编程：读文件 / 读写可见文件 / OPFS 字节级读写** | **本叶** |

一句话回顾定位：**File/Blob 是数据对象，File System Access 与 OPFS 是把这些数据落到"文件"的两套读写通道**。存储配额那套规则不在本叶重复，下面直接进 API。

## 二、地基：Blob 与 File

一切从两个数据对象开始。**`Blob`**（Binary Large Object）表示一段**不可变**的原始字节，外加一个 MIME `type` 标签：

```js
// 用字符串、TypedArray、其它 Blob 拼一个 Blob；第二参声明 MIME 类型
const blob = new Blob(["姓名,年龄\n张三,28\n"], { type: "text/csv;charset=utf-8" });

console.log(blob.size); // 字节数（UTF-8 编码后的长度，非字符数）
console.log(blob.type); // "text/csv;charset=utf-8"
```

**`File`** 是 `Blob` 的子类——就是"一个带了文件名和修改时间的 Blob"：

```js
// File 构造：第一参同 Blob，第二参是文件名，第三参可带 type / lastModified
const file = new File(["hello"], "greeting.txt", {
  type: "text/plain",
  lastModified: Date.now(),
});

console.log(file.name); // "greeting.txt"
console.log(file.size); // 5（继承自 Blob）
console.log(file.type); // "text/plain"
console.log(file.lastModified); // 毫秒时间戳
```

记住这层继承关系，后面就通了：**凡是接受 `Blob` 的 API（`FileReader`、`URL.createObjectURL`、`fetch` 的 body、`createImageBitmap`……）都能直接接受 `File`**。它俩 **2015 年起就是全浏览器 Baseline**，也能在 Web Worker 里用。字段与读法细节见 [File/Blob/FileReader 页](./guide-line/file-blob-reader)。

## 三、三条文件路线概览

同样是"操作文件"，浏览器给了三条能力与支持面都不同的路线。先建立全局地图，再逐页展开。

### 3.1 路线一 · File API：只读用户交出的文件

**能做**：拿到用户通过 `<input>` 选择或拖进来的文件，读成文本/二进制/DataURL，做上传、预览、解析。**不能做**：拿磁盘路径、写回原文件、访问用户没主动交出的文件。**支持**：全浏览器 Baseline。

```js
// input 来源：拿到 File 后直接用新式 Promise 读法
const input = document.querySelector("#picker"); // <input type="file">
input.addEventListener("change", async () => {
  const file = input.files[0]; // File 对象；未选则 files 为空
  if (!file) return;
  const text = await file.text(); // 新式读法：直接 await 出文本
  console.log(`${file.name}（${file.size} 字节）内容：`, text);
});
```

这是覆盖面最广、最该优先掌握的一层。来源（input/拖放）、字段、三种读法、object URL 内存管理全在 [File/Blob/FileReader 页](./guide-line/file-blob-reader)。

### 3.2 路线二 · File System Access：读写用户可见的真实文件

**能做**：弹系统文件选择框，读写用户桌面上**真实可见**的文件与目录，把句柄存起来下次直接打开。**代价**：**仅 Chromium（Chrome/Edge 桌面）实现，非 Baseline**；每个 picker 都要**瞬时用户激活**，不能静默调用。

```js
// 必须在用户手势（如 click）回调里调用，否则抛 SecurityError
saveBtn.addEventListener("click", async () => {
  // showSaveFilePicker 返回单个句柄（open 版返回数组，见对应页）
  const handle = await window.showSaveFilePicker({
    suggestedName: "note.txt",
    types: [{ description: "文本", accept: { "text/plain": [".txt"] } }],
  });
  const writable = await handle.createWritable(); // 可写流
  await writable.write("写回磁盘的内容"); // 先写入临时文件
  await writable.close(); // close 时才真正落到目标文件
});
```

picker 三兄弟、句柄接口、权限模型、句柄持久化到 IndexedDB、以及**面向公网必须写的 `input`+`a.download` 降级**，全在 [File System Access 页](./guide-line/file-system-access)。

### 3.3 路线三 · OPFS：源私有的高性能文件系统

**能做**：在一个**源独占、用户不可见、无授权弹窗**的沙盒文件系统里读写文件，Worker 内还能同步字节级读写，吞吐达到数据库级。**支持**：主入口 `navigator.storage.getDirectory()` **已跨浏览器 Baseline**（Chrome 102 / Safari 15.2 / Firefox 111 起）。

```js
// 主线程：异步拿根目录、建文件、异步写
const root = await navigator.storage.getDirectory(); // 源私有根目录，免授权
const fileHandle = await root.getFileHandle("cache.bin", { create: true });
const writable = await fileHandle.createWritable();
await writable.write(new Uint8Array([1, 2, 3]));
await writable.close();
```

高性能的**同步**路径 `createSyncAccessHandle()`（`read`/`write`/`getSize`/`truncate`/`flush`/`close`）**只能在 Web Worker 里用**，是 SQLite WASM 等库的落点。私有 vs 可见的区别、`create` 选项、删除、以及"存哪/能存多大"链到浏览器章，全在 [OPFS 页](./guide-line/opfs)。

## 四、三条路线怎么选

| 需求 | 选哪条 | 关键约束 |
| --- | --- | --- |
| 上传前预览图片 / 解析用户选的 CSV/JSON | **File API** | 只读；全浏览器可用 |
| 在线编辑器"打开本地文件、Ctrl+S 存回" | **File System Access** | 仅 Chromium；要用户手势；写降级 |
| 遍历用户整个项目目录做批处理 | **File System Access**（`showDirectoryPicker`） | 同上 |
| 离线大文件缓存 / 把 SQLite 搬进浏览器 | **OPFS** | 免授权高性能；同步 API 限 Worker |
| 结构化记录里夹一个头像 Blob | **IndexedDB**（存 Blob） | 见 [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/) |

一句话决策：**只读 → File API**；**读写用户可见文件、能接受 Chromium 限制或写好降级 → File System Access**；**要私有大容量高性能字节读写 → OPFS**。

## 五、支持面分野与特性检测

这是本叶最容易踩的坑：**"文件系统 API"不是一个整体的开关**，三条路线支持面差异极大，必须按"具体入口"分别检测。

```js
// ① File API：全浏览器 Baseline，基本无需检测（FileReader / Blob 一直都在）
const hasBlobText = typeof Blob !== "undefined" && "text" in Blob.prototype;

// ② File System Access：仅 Chromium——用「入口是否存在」判定
const hasFilePicker = "showOpenFilePicker" in window;

// ③ OPFS 主入口：已跨浏览器 Baseline
const hasOPFS = "storage" in navigator && "getDirectory" in navigator.storage;

// ④ OPFS 同步句柄：Worker 内、且需运行时具备
const hasSyncAccess =
  typeof FileSystemFileHandle !== "undefined" &&
  "createSyncAccessHandle" in FileSystemFileHandle.prototype;
```

工程结论：

- **面向公网**：File System Access 必须有降级分支（`hasFilePicker` 为假时退回 `<input>` + `<a download>`），详见 [File System Access 页](./guide-line/file-system-access)的降级一节。
- **安全上下文**：File System Access 与 OPFS 都**只在 HTTPS/localhost** 可用，`http://` 页面上上述入口直接不存在。
- **别把三者当一个特性**：OPFS 可用不代表 picker 可用（Safari/Firefox 正是"有 OPFS、无 picker"）；反之亦然要独立判断。

下一页从最通用的地基开始：File/Blob 的来源、字段、三种读法与 object URL 内存管理——[File / Blob / FileReader](./guide-line/file-blob-reader)。
