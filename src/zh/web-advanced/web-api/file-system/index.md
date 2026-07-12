---
layout: doc
---

# File 与文件系统 API

浏览器里操作文件的能力不是一个 API，而是**三层能力叠加**：最底层是 **File / Blob** 这对表示"一坨字节 + MIME 类型"的不可变数据对象（`File` 是带文件名与修改时间的 `Blob` 子类），配合 **FileReader** 与更现代的 `Blob.text()`/`arrayBuffer()`/`stream()` 把它们读成文本、二进制或流——这一层 **2015 年起就是全浏览器 Baseline**，只能读用户主动交出的文件（`<input type="file">`、拖放），拿不到路径也写不回磁盘。往上是 **File System Access API**（`showOpenFilePicker`/`showSaveFilePicker`/`showDirectoryPicker` + `FileSystemFileHandle`/`FileSystemDirectoryHandle`），第一次让 Web 应用能像原生程序一样**读写用户可见的真实文件与目录**、还能把句柄持久化下次直接打开——代价是**至今仅 Chromium 支持、非 Baseline、每次调用都要用户手势**。第三层是 **OPFS（源私有文件系统）**，源独占、不可见、无授权弹窗的高性能沙盒文件系统：**`navigator.storage.getDirectory()` 已跨浏览器 Baseline**，其 Worker 内的 `createSyncAccessHandle()` 同步字节级读写是 SQLite WASM 等库的性能主力。本叶讲**这三层各自的 API 编程**；文件系统的存储定位与配额、以及 IndexedDB 存 Blob 的场景，在相邻章节点到即链接。

## 评价

**优点**

- **底层 File/Blob 极其稳固**：`Blob` 是"字节 + 类型"的通用容器，`File` 只是多了 `name`/`lastModified`，两者可无缝喂给 `FileReader`、`URL.createObjectURL`、`fetch` body、`createImageBitmap`——2015 年起全环境 Baseline，是所有上传/预览/导出功能的地基
- **读多路可选、逐步现代化**：老代码用 `FileReader` 的事件回调，新代码直接 `await blob.text()`/`blob.arrayBuffer()`/`blob.stream()`——Promise 化、可组合 Streams、心智负担骤降
- **File System Access 补齐"真文件"缺口**：能打开/保存用户可见文件、遍历整个目录树、把句柄存进 IndexedDB 实现"最近打开"，让在线 IDE、图像编辑器、Markdown 工具达到接近原生的体验
- **OPFS 兼顾高性能与跨浏览器**：源私有、免授权、Worker 内同步 API（`FileSystemSyncAccessHandle`）提供数据库级读写吞吐，且 `getDirectory()` 主入口已是 Baseline，是"把 SQLite 搬进浏览器"这类方案的落点
- **切片与流式天然支持大文件**：`Blob.slice()` 零拷贝切片 + `stream()` 流式读，分片上传、断点续传、超大文件不撑爆内存都有一等公民支持

**局限**

- **File System Access 至今非 Baseline**：`showOpenFilePicker`/`showSaveFilePicker`/`showDirectoryPicker` **只有 Chromium（Chrome/Edge 桌面）实现**，Firefox 与 Safari 长期不支持——面向公网必须写 `<input>` + `<a download>` 降级路径，不能当默认能力
- **权限与手势约束繁琐**：所有 picker 都要**瞬时用户激活**（transient activation），不能在加载时静默调用；重新使用持久化句柄还得 `requestPermission` 二次确权，且 `queryPermission`/`requestPermission` 本身是 Chromium 非标准
- **OPFS 的高性能路径被关进 Worker**：`createSyncAccessHandle()` 的同步读写**只能在 Web Worker 里用**，主线程只有异步 `createWritable()`；想吃满性能就得引入 Worker + 消息通信的架构成本
- **URL.createObjectURL 会漏内存**：每个 object URL 都在文档存活期常驻，忘了 `revokeObjectURL` 就是稳定泄漏——预览、下载场景的高频坑
- **三层能力支持面参差**：同一个"写文件"，OPFS 里 `createWritable` 已跨浏览器、picker 里 `createWritable` 却锁 Chromium——特性检测要按"具体入口"而非"整个 API"来做

一句话选型：**只读用户交出的文件（上传、预览、解析）→ File/Blob/FileReader，全浏览器可用直接上**；**要读写用户可见的真实文件/目录且能接受仅 Chromium（或写好降级）→ File System Access**；**要大容量、高性能、源私有的字节级读写（数据库、缓存、离线大文件）→ OPFS**。文件该存哪、能存多大、何时被清，是[浏览器存储章](/zh/base/browser/browser-storage/guide-line/indexeddb-opfs)的话题；结构化数据里夹带 Blob 则归 [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)。

## 本叶地图

- [入门](./getting-started) —— File/Blob 是什么、三条路线（File API 只读 / File System Access 本地读写 / OPFS 私有）如何分工、与浏览器存储章的边界、各路线的支持面分野与特性检测
- [File / Blob / FileReader](./guide-line/file-blob-reader) —— 文件来源（input 与拖放）、`name`/`size`/`type`/`lastModified`、Blob 构造与 `type`、`slice()` 切片、`text`/`arrayBuffer`/`stream`、FileReader 三读法与事件、`createObjectURL`/`revokeObjectURL` 内存管理、大文件分片
- [File System Access API](./guide-line/file-system-access) —— 三个 picker（open 返数组 / save 返单句柄 / directory）、**仅 Chromium 非 Baseline 与用户激活**、`FileSystemFileHandle`/`DirectoryHandle`、`getFile`/`createWritable`、权限 `queryPermission`/`requestPermission`、句柄持久化到 IndexedDB、降级到 `input`+`a.download`
- [OPFS 源私有文件系统](./guide-line/opfs) —— **`navigator.storage.getDirectory()` Baseline**、**Worker 内 `createSyncAccessHandle()` 同步读写与 SQLite WASM**、`getFileHandle`/`getDirectoryHandle` 的 `create` 选项、`removeEntry`/`remove`、异步 `createWritable`、私有 vs 可见、`storage.persist` 链浏览器章
- [工程模式](./guide-line/patterns) —— `a.download` + Blob URL 下载、图片预览、CSV/JSON 导出、大文件分片与断点、Blob 存 IndexedDB、`revokeObjectURL` 时机、File vs Blob vs ArrayBuffer vs Stream 选型表
- [参考](./reference) —— API 速查、File System Access vs OPFS 对比、三路线支持矩阵、句柄方法表、易错点清单、资源链接

## 文档地址

[MDN File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)

## GitHub 地址

[whatwg/fs](https://github.com/whatwg/fs)（File System 现行标准规范仓库；File API 规范见 [w3c/FileAPI](https://github.com/w3c/FileAPI)）

## 幻灯片地址

<a href="/SlideStack/file-system-slide/" target="_blank">File 与文件系统 API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=file-与文件系统-api" target="_blank" rel="noopener noreferrer">File 与文件系统 API 测试题</a>
