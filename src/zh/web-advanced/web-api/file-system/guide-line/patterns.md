---
layout: doc
outline: [2, 3]
---

# 工程模式：下载 / 预览 / 导出 / 分片 / 选型

> 基于 WHATWG File API / File System 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **触发下载（万能式）**：`Blob` → `URL.createObjectURL` → 造 `<a download="名字">` → `a.click()` → **`URL.revokeObjectURL`**——全浏览器可用，是导出功能的默认实现。
- **下载记得撤 URL**：`a.click()` 后（或稍作延时）`URL.revokeObjectURL(url)`，否则每次导出泄漏一块内存。
- **图片预览首选 object URL**：`img.src = URL.createObjectURL(file)`，`img.onload` 里 `revokeObjectURL`——比 `readAsDataURL` 省内存、无 +33% base64 膨胀。
- **CSV 导出**：拼字符串 → `new Blob([csv], { type: "text/csv;charset=utf-8" })`；中文 Excel 乱码时**加 UTF-8 BOM**（`﻿` 前缀）。
- **JSON 导出**：`new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })` → 同下载式。
- **大文件分片**：`file.slice(start, start+CHUNK)` 逐片、`arrayBuffer()` 按需读——**别对大文件整体 `arrayBuffer()`/`text()`**。
- **断点续传**：给每片编号，先问服务端"已收哪些片"，只补传缺片；片内失败重试、限并发（如 3~4 片并发）。
- **Blob 存 IndexedDB**：`Blob`/`File` 可结构化克隆，直接作为字段 `put` 进 IndexedDB——离线图片/附件的标准存法，详见 [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)。
- **句柄存 IndexedDB**：File System Access 的 `FileSystemHandle` 也可克隆存 IndexedDB，做"最近打开"，取回需重新 `requestPermission`（见 [File System Access 页](./file-system-access)）。
- **`revokeObjectURL` 时机**：预览在 `img.onload` 后；下载在 `click` 后；列表卸载时统一撤销所有登记过的 URL。
- **读文本编码**：`blob.text()` 固定 UTF-8；要 GBK 等用 `arrayBuffer()` + `new TextDecoder("gbk")`。
- **选型口诀**：只读文本/小数据→`text()`；解析二进制→`arrayBuffer()`；超大/管道处理→`stream()`；要文件名与修改时间→`File`；要跨 API 传字节→`Blob`。
- **canvas 导图**：`canvas.toBlob(cb, "image/png")` 拿 Blob，再走下载式或上传。
- **拖放上传**：`dragover` 里 `preventDefault()`、`drop` 里取 `dataTransfer.files`（见 [File/Blob 页](./file-blob-reader)）。
- **安全**：`file.type`/扩展名可伪造，服务端必须按魔数/内容校验；大小前端先卡一道减少无效上传。
- **内存红线**：同时活着的 object URL、整体读入的大 Buffer 都占常驻内存——预览列表用 `IntersectionObserver` 懒建懒撤 URL。

## 一、触发下载：Blob → a[download]

浏览器没有"保存文件"的直接 API（File System Access 的 `showSaveFilePicker` 仅 Chromium），**跨浏览器的通用下载**靠 object URL + 隐藏 `<a download>`：

```js
/**
 * 通用下载：把任意 Blob 存成用户下载
 * @param {Blob} blob 要下载的数据
 * @param {string} filename 建议文件名
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob); // 造 blob: 短链
  const a = document.createElement("a");
  a.href = url;
  a.download = filename; // download 属性触发"下载"而非"导航"
  document.body.appendChild(a);
  a.click(); // 程序化点击
  a.remove();
  URL.revokeObjectURL(url); // ⭐ 立即释放，避免内存泄漏
}

// 用例
downloadBlob(new Blob(["hello"], { type: "text/plain" }), "hello.txt");
```

在 Chromium 上想要"选择保存位置"的原生体验，可在 `downloadBlob` 前分支到 `showSaveFilePicker`（见 [File System Access 页](./file-system-access) 的 `saveFile` 封装），失败/不支持再退回这段。

## 二、图片预览：object URL 优先

上传前预览用户选的图片，**首选 object URL**——零拷贝、不膨胀：

```js
const input = document.querySelector("#avatar"); // <input type="file" accept="image/*">
const img = document.querySelector("#preview");

input.addEventListener("change", () => {
  const file = input.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  const url = URL.createObjectURL(file);
  img.src = url;
  // 图片解码完成后即可释放：DOM 已持有解码结果，撤 URL 不影响显示
  img.onload = () => URL.revokeObjectURL(url);
});
```

为什么不用 `readAsDataURL`：DataURL 把图片 base64 内联，**体积涨约 33%**、大图会造出巨长字符串占内存；object URL 只是个指向内存的引用，配合 `revoke` 更省。仅当你需要把图片**当字符串持久化/传输**时才选 DataURL（对比见 [File/Blob 页](./file-blob-reader)）。

## 三、导出 CSV / JSON

### 3.1 CSV（注意中文 BOM）

```js
/** 把二维数组导出为 CSV 下载 */
function exportCsv(rows, filename = "export.csv") {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          // 含逗号/引号/换行的单元格要用双引号包裹并转义内部引号
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");

  // ⭐ 加 UTF-8 BOM（﻿），否则中文在 Excel 里可能乱码
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

exportCsv([
  ["姓名", "年龄"],
  ["张三", 28],
  ["李四, 备注", 30],
]);
```

### 3.2 JSON

```js
/** 把对象导出为格式化 JSON 下载 */
function exportJson(data, filename = "data.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, filename);
}
```

## 四、大文件分片与断点续传

大文件（视频、镜像）**不能整体读进内存**，用 `Blob.slice()` 分片、逐片上传，配合服务端记录实现断点续传：

```js
const CHUNK = 5 * 1024 * 1024; // 5MB 一片

/**
 * 分片上传 + 断点续传
 * @param {File} file 待上传文件
 * @param {string} uploadId 本次上传的唯一标识（用于问服务端已收哪些片）
 */
async function uploadInChunks(file, uploadId) {
  const total = Math.ceil(file.size / CHUNK);
  // ① 先问服务端已经收到哪些片（断点续传的关键）
  const done = await fetch(`/upload/${uploadId}/status`).then((r) => r.json());
  const doneSet = new Set(done.chunks); // 已完成的片号集合

  // ② 只补传缺失的片，限制并发
  const pending = [];
  for (let i = 0; i < total; i++) {
    if (doneSet.has(i)) continue; // 跳过已传
    pending.push(i);
  }

  const CONCURRENCY = 3; // 并发上限，避免打满连接
  async function worker() {
    while (pending.length) {
      const i = pending.shift();
      const chunk = file.slice(i * CHUNK, (i + 1) * CHUNK); // 零拷贝切片
      await uploadOne(uploadId, i, chunk); // 内部可做失败重试
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // ③ 通知服务端合并
  await fetch(`/upload/${uploadId}/complete`, { method: "POST" });
}

/** 单片上传，带简单重试 */
async function uploadOne(uploadId, index, chunk, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`/upload/${uploadId}/chunk/${index}`, {
        method: "PUT",
        body: chunk, // Blob 可直接作 fetch body
      });
      if (res.ok) return;
    } catch (e) {
      if (attempt === retries) throw e; // 最后一次仍失败才抛
    }
  }
}
```

要点：**切片零成本**（`slice` 只记区间，真正 I/O 在 `fetch(body=chunk)` 时）；**先问后传**实现断点；**限并发**避免连接饱和；**片内重试**吸收瞬时网络抖动。想要秒传/去重可给每片算哈希（`crypto.subtle.digest` + `chunk.arrayBuffer()`）。

## 五、Blob 存 IndexedDB（离线附件）

要把图片/附件**离线保存**，`Blob`/`File` 可被结构化克隆，直接作为字段存进 IndexedDB——比转 base64 存更省、更快：

```js
// 用 idb 库示意：把附件连同元数据一起存
import { openDB } from "idb";

const db = await openDB("attachments", 1, {
  upgrade(db) {
    db.createObjectStore("files", { keyPath: "id" });
  },
});

// 存：Blob 直接作为对象的一个字段
async function saveAttachment(id, file) {
  await db.put("files", { id, name: file.name, type: file.type, blob: file });
}

// 取：拿回 Blob 后用 object URL 预览
async function loadAttachment(id) {
  const record = await db.get("files", id);
  if (!record) return null;
  const url = URL.createObjectURL(record.blob); // 别忘了用完 revoke
  return { ...record, url };
}
```

这属于"结构化数据里夹二进制"的场景，IndexedDB 的事务、索引、克隆边界等完整用法在 [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)；OPFS 更适合纯字节流/数据库文件（见 [OPFS 页](./opfs)），两者选型见浏览器存储章。

## 六、内存管理：revokeObjectURL 的时机

object URL 是本叶最高频的泄漏源——**每个 `createObjectURL` 都常驻到文档卸载或显式 `revoke`**。按场景记住释放时机：

| 场景 | 何时 `revokeObjectURL` |
| --- | --- |
| 图片/视频预览 | 元素 `onload`/`onloadeddata` 后 |
| 触发下载 | `a.click()` 之后（可 `setTimeout` 稍延时保下载启动） |
| 列表大量预览 | 用 `IntersectionObserver` 进视口才建、离开就撤 |
| 组件卸载 | 在卸载钩子里统一撤销本组件登记过的所有 URL |

```js
// 列表懒加载 + 懒释放：只给进入视口的项建 object URL
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const img = entry.target;
    if (entry.isIntersecting && !img.src) {
      img.src = URL.createObjectURL(img._file); // 进视口才建
    } else if (!entry.isIntersecting && img.src) {
      URL.revokeObjectURL(img.src); // 离开视口就撤
      img.removeAttribute("src");
    }
  }
});
```

## 七、选型：File vs Blob vs ArrayBuffer vs Stream

同一份数据有多种载体，按"你要拿它干什么"选：

| 载体 | 是什么 | 什么时候用 |
| --- | --- | --- |
| **`File`** | 带 `name`/`lastModified` 的 `Blob` | 需要文件名、修改时间（来自 input/拖放/句柄的文件） |
| **`Blob`** | 不可变字节 + MIME `type` | 在 API 间传递整块数据（上传 body、`createObjectURL`、存 IndexedDB） |
| **`ArrayBuffer`** | 定长原始字节缓冲 | 要**解析/改写**二进制（配 `DataView`/TypedArray 读结构、算哈希） |
| **`Uint8Array` 等** | `ArrayBuffer` 的类型视图 | 按字节操作、和 WASM/加密 API 交互 |
| **`ReadableStream`** | 惰性数据流 | 超大文件、边读边处理、管道转换（`stream().pipeThrough(...)`） |

转换关系（都很便宜或惰性）：

```js
// File/Blob 之间：File 就是 Blob，直接当 Blob 用
// Blob → ArrayBuffer
const buf = await blob.arrayBuffer();
// Blob → Uint8Array
const bytes = await blob.bytes(); // 或 new Uint8Array(await blob.arrayBuffer())
// Blob → 文本
const text = await blob.text();
// Blob → 流
const stream = blob.stream();
// ArrayBuffer/字符串 → Blob
const back = new Blob([buf], { type: "application/octet-stream" });
// 流 → Blob（消费整条流）
const fromStream = await new Response(stream).blob();
```

口诀：**只读小数据 `text()`；解析二进制 `arrayBuffer()`；超大/管道 `stream()`；要文件元数据留着 `File`；跨 API 传字节用 `Blob`**。方法与浏览器支持的完整速查见 [参考页](../reference)。
