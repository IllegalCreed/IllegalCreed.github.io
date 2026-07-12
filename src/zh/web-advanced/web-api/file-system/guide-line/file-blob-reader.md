---
layout: doc
outline: [2, 3]
---

# File / Blob / FileReader：读文件的地基

> 基于 WHATWG File API / File System 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **Blob = 不可变字节 + MIME `type`**：`new Blob(parts, { type, endings })`；`parts` 是字符串/`ArrayBuffer`/TypedArray/`DataView`/其它 `Blob` 的数组，按序拼接；只读属性 `size`（字节数）、`type`（MIME，未知为空串）。
- **File = 带元数据的 Blob**：`Blob` 子类，多 `name`、`lastModified`（毫秒时间戳）、`webkitRelativePath`（目录选择时的相对路径）；收 `Blob` 的地方都收 `File`。
- **`size` 是字节数不是字符数**：UTF-8 下一个中文占 3 字节——`new Blob(["中"]).size === 3`。
- **`type` 全靠声明/推断、不校验内容**：input 里的 `file.type` 由浏览器按扩展名/嗅探给，可能为空串或被伪造，**安全校验不能只信 `type`**。
- **来源①  input**：`<input type="file">` 的 `input.files` 是 `FileList`；`multiple` 允许多选、`accept` 过滤、`webkitdirectory` 选整个目录（文件带 `webkitRelativePath`）。
- **来源②  拖放**：`drop` 事件的 `event.dataTransfer.files`（`FileList`）；必须 `dragover` 里 `preventDefault()` 否则浏览器直接打开文件。
- **新式读法（首选）**：`await blob.text()` → `string`（UTF-8）；`await blob.arrayBuffer()` → `ArrayBuffer`；`await blob.bytes()` → `Uint8Array`（较新）；`blob.stream()` → `ReadableStream`。
- **旧式读法 FileReader**：`readAsText(blob, encoding?)` / `readAsDataURL(blob)` / `readAsArrayBuffer(blob)`；结果在 `reader.result`，靠 `onload`/`onerror`/`onprogress` 事件取——**异步、非 Promise**。
- **`readAsBinaryString` 已废弃**：要二进制用 `readAsArrayBuffer` 或 `arrayBuffer()`。
- **FileReader 何时仍必要**：需要 `progress` 进度事件、需要 `abort()` 中途取消、或兼容极老环境；否则新代码用 Blob 的 Promise 方法。
- **DataURL vs object URL**：`readAsDataURL` 把内容 base64 内联进 URL（体积 +33%、可持久化字符串）；`URL.createObjectURL` 造 `blob:` 引用（零拷贝、指向内存、**须手动释放**）——预览大图选后者。
- **`URL.createObjectURL(blob)`**：返回 `blob:` 短链给 `<img src>`/`<a href>`/`<video src>`；**每个 URL 常驻至文档卸载或手动释放**。
- **`URL.revokeObjectURL(url)`**：用完立刻释放，否则稳定内存泄漏——图片 `onload` 后、下载 `click` 后即撤销。
- **`blob.slice(start, end, contentType?)`**：零拷贝切一段返回新 `Blob`；负数从末尾算；分片上传/断点续传的基础。
- **大文件别一次性读**：`file.slice()` 分片 + 逐片 `arrayBuffer()`，或 `file.stream()` 流式——避免把 GB 级文件全塞进内存。
- **全 Baseline**：File/Blob/FileReader/`createObjectURL` 自 2015 年起全浏览器、含 Web Worker；`Blob.bytes()` 较新，用前留意。
- **`endings` 选项**：`new Blob(parts, { endings: "native" })` 把 `\n` 转成平台换行；默认 `"transparent"` 不动。

## 一、Blob：字节容器

`Blob` 是浏览器里表示"一段二进制数据"的通用对象——**不可变**（造好不能改内容）、**惰性**（数据可能还在磁盘上，不一定全在内存）。

### 1.1 构造

```js
// 第一参：blobParts 数组，元素可以混合类型，按序拼接
// 第二参：options —— type（MIME）、endings（换行处理）
const parts = [
  '{"name":"张三"}', // 字符串
  new Uint8Array([0x0a]), // TypedArray（这里是换行符）
  new Blob(["尾部"]), // 甚至可以是另一个 Blob
];
const blob = new Blob(parts, { type: "application/json" });

console.log(blob.size); // 拼接后的总字节数
console.log(blob.type); // "application/json"
```

两个只读属性：

- **`size`**：字节数——注意是**编码后的字节**，不是字符数。`new Blob(["中文"]).size` 是 6（UTF-8 每个汉字 3 字节），不是 2。
- **`type`**：MIME 字符串，未知时是空字符串 `""`。它只是个**标签**，浏览器不保证它与内容一致。

`endings` 选项少用但要知道：`"native"` 会把字符串里的 `\n` 转成当前平台换行（Windows 下 `\r\n`），`"transparent"`（默认）原样保留。

### 1.2 File：带名字的 Blob

```js
// File 继承 Blob，构造多一个 fileName 参数
const file = new File(["报告正文"], "2026-report.txt", {
  type: "text/plain;charset=utf-8",
  lastModified: new Date("2026-07-01").getTime(),
});
```

`File` 独有的字段：

| 字段 | 含义 |
| --- | --- |
| `name` | 文件名（不含路径），如 `"photo.png"` |
| `lastModified` | 最后修改时间，**毫秒时间戳**（`number`） |
| `webkitRelativePath` | 用 `webkitdirectory` 选目录时，文件相对所选目录的路径；否则空串 |

> 历史字段 `lastModifiedDate`（`Date` 对象）已废弃，用 `lastModified` 毫秒值自己 `new Date(file.lastModified)`。

## 二、文件从哪来

前端拿到 `File` 只有几条合法途径，共同点是**都拿不到磁盘绝对路径**（安全限制），`input.value` 里只是个假路径 `C:\fakepath\...`。

### 2.1 来源一：`<input type="file">`

```html
<!-- multiple 多选；accept 建议性过滤；webkitdirectory 选整个目录 -->
<input id="picker" type="file" accept="image/*,.pdf" multiple />
```

```js
const input = document.querySelector("#picker");
input.addEventListener("change", () => {
  // input.files 是 FileList（类数组，非真数组）
  const files = Array.from(input.files); // 转成数组好遍历
  for (const file of files) {
    console.log(file.name, file.type, file.size);
  }
});
```

要点：

- `input.files` 是 **`FileList`**——类数组，用 `Array.from()` 或展开转成数组。
- `accept` 只是**建议性过滤**（影响系统选择框默认筛选），用户仍可能绕过选到别的类型——**服务端与前端都要再校验**。
- `webkitdirectory` 属性让用户选一个**目录**，`files` 里是该目录下所有文件，每个的 `webkitRelativePath` 给出相对路径。
- 同一文件重复选不触发 `change`——需要"选同一文件也响应"时，在处理完后清空 `input.value = ""`。

### 2.2 来源二：拖放（Drag and Drop）

```js
const dropZone = document.querySelector("#drop");

// 关键：必须阻止 dragover 默认行为，否则 drop 不会触发、浏览器直接打开文件
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault(); // 阻止浏览器默认"打开文件"
  // DataTransfer.files 是拖进来的文件列表
  const files = Array.from(e.dataTransfer.files);
  for (const file of files) {
    console.log("拖入：", file.name);
  }
});
```

进阶：`e.dataTransfer.items`（`DataTransferItemList`）比 `.files` 更强——每个 `item` 有 `getAsFile()`；在 Chromium 里还有 `item.getAsFileSystemHandle()`（返回 File System Access 的句柄，可拿到**拖入的目录**），以及老式的 `item.webkitGetAsEntry()`。跨目录拖放的句柄用法见 [File System Access 页](./file-system-access)。

### 2.3 其它来源

- **`new File(...)` / `new Blob(...)`**：程序内生成（如导出 CSV）。
- **`canvas.toBlob(cb, type, quality)`**：把画布导出成图片 Blob。
- **`await fetch(url).then(r => r.blob())`**：把网络响应当 Blob。
- **File System Access / OPFS 的 `handle.getFile()`**：见对应页。

## 三、读 Blob：新式 Promise 优先

拿到 `Blob`/`File` 后要把它变成能用的数据。**新代码首选 Blob 自带的 Promise 方法**——短、可 `await`、可组合：

```js
const file = input.files[0];

// ① 读成文本（按 UTF-8 解码）
const text = await file.text();

// ② 读成 ArrayBuffer（通用二进制，配 DataView / TypedArray 解析）
const buffer = await file.arrayBuffer();
const view = new DataView(buffer);
const magic = view.getUint32(0); // 例如读文件头魔数

// ③ 读成 Uint8Array（较新的便捷方法，省去 new Uint8Array(buffer)）
const bytes = await file.bytes();

// ④ 读成流（超大文件流式处理，不整体入内存）
const stream = file.stream(); // ReadableStream<Uint8Array>
for await (const chunk of stream) {
  console.log("收到一块：", chunk.byteLength, "字节");
}
```

| 方法 | 返回 | 用途 |
| --- | --- | --- |
| `blob.text()` | `Promise<string>` | 文本（UTF-8） |
| `blob.arrayBuffer()` | `Promise<ArrayBuffer>` | 通用二进制解析 |
| `blob.bytes()` | `Promise<Uint8Array>` | 直接拿字节视图（较新） |
| `blob.stream()` | `ReadableStream` | 流式、超大文件 |

> `text()` 固定按 **UTF-8** 解码。要指定别的编码（如 GBK），用 `arrayBuffer()` + `new TextDecoder("gbk").decode(buffer)`。

## 四、FileReader：旧式事件读法

`FileReader` 是 Promise 之前的读文件方式——**异步、事件驱动**。新代码大多能被上面的 Blob 方法替代，但**三种情况它仍不可替代**：需要进度事件、需要中途取消、或读成 DataURL。

### 4.1 三个读方法与事件

```js
const reader = new FileReader();

// 结果通过事件送达，不是返回值
reader.onload = () => {
  console.log("读完：", reader.result); // 结果在 reader.result
};
reader.onerror = () => {
  console.error("读失败：", reader.error); // DOMException
};
reader.onprogress = (e) => {
  if (e.lengthComputable) {
    console.log(`进度 ${((e.loaded / e.total) * 100).toFixed(0)}%`);
  }
};

// 三选一发起读取（都是异步启动，立即返回）
reader.readAsText(file, "utf-8"); // → result 是字符串
// reader.readAsDataURL(file);    // → result 是 data:...;base64,... URL
// reader.readAsArrayBuffer(file);// → result 是 ArrayBuffer
```

| 方法 | `result` 类型 | 说明 |
| --- | --- | --- |
| `readAsText(blob, encoding?)` | `string` | 默认 UTF-8，可指定编码 |
| `readAsDataURL(blob)` | `string` | `data:` URL，base64 内联，可直接当 `img.src` |
| `readAsArrayBuffer(blob)` | `ArrayBuffer` | 二进制 |
| ~~`readAsBinaryString`~~ | `string` | **已废弃**，改用 `readAsArrayBuffer` |

### 4.2 事件与状态

- 事件序：`loadstart` → `progress`（可多次）→ `load`（成功）/ `error` / `abort` → `loadend`（无论成败最后都触发）。
- `reader.readyState`：`EMPTY`(0) / `LOADING`(1) / `DONE`(2)。
- `reader.abort()`：中途取消，`readyState` 变 `DONE`、触发 `abort` 事件——**这是 Blob Promise 方法给不了的能力**（配合大文件"取消上传"很有用）。

### 4.3 需要就地 Promise 化

```js
/** 把 FileReader 包成 Promise，同时保留 progress 回调能力 */
function readAsDataURL(blob, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    if (onProgress) reader.onprogress = onProgress;
    reader.readAsDataURL(blob);
  });
}

const dataUrl = await readAsDataURL(file, (e) => console.log(e.loaded));
```

## 五、object URL 与内存管理

要把一个 Blob 交给 `<img>`/`<video>`/`<a>` 显示或下载，最省内存的方式是 **object URL**：

```js
const url = URL.createObjectURL(blob); // 造一个 blob:https://... 短链
img.src = url;

// ⚠️ 用完必须释放，否则这块内存直到文档卸载都不回收
img.onload = () => URL.revokeObjectURL(url); // 图片加载完立即撤销
```

**为什么必须 `revoke`**：每次 `createObjectURL` 都在文档里登记一个映射，**它让对应的 Blob 无法被垃圾回收**，一直活到显式 `revokeObjectURL` 或整个文档卸载。在列表里给上百张图各造一个 URL 又不释放，就是一条稳定的内存泄漏曲线。

### 5.1 DataURL vs object URL 怎么选

| | `createObjectURL`（`blob:`） | `readAsDataURL`（`data:`） |
| --- | --- | --- |
| 形态 | 指向内存的短引用 | base64 把内容**内联**进字符串 |
| 体积 | 零拷贝，URL 极短 | 比原文件**大约 +33%** |
| 内存 | 需手动 `revoke` | 字符串本身占内存，可被 GC |
| 可持久化 | 否（页面级、刷新即失效） | 是（就是普通字符串，可存 localStorage/发送） |
| 适用 | 预览大图/大视频、临时下载 | 小图标内联、需要把图当字符串存/传 |

经验：**预览/下载走 `createObjectURL` 并及时 `revoke`；需要把图片当字符串序列化保存才用 DataURL**。完整的下载/预览工程写法见 [工程模式页](./patterns)。

## 六、切片与大文件

`Blob.slice()` 是处理大文件的关键——**零拷贝**地切出一段，返回新 `Blob`：

```js
// slice(start, end, contentType?)：字节区间 [start, end)，负数从末尾算
const CHUNK = 5 * 1024 * 1024; // 5MB 一片
const file = input.files[0];

for (let start = 0; start < file.size; start += CHUNK) {
  const chunk = file.slice(start, start + CHUNK); // 切一片，仍是 Blob，几乎不占内存
  const buf = await chunk.arrayBuffer(); // 只在这一刻把这一片读进内存
  await uploadChunk(buf, start); // 逐片上传
}
```

两条大文件铁律：

- **别对大文件直接 `file.arrayBuffer()`/`text()`**——那会把整个 GB 级文件塞进内存。用 `slice()` 分片，或 `file.stream()` 流式。
- **`slice()` 本身不读数据**——它只是记录"从哪到哪"的视图，真正的 I/O 发生在你对切片调 `arrayBuffer()`/`text()` 时。

分片上传的完整断点续传、并发控制、失败重试模式，见 [工程模式页](./patterns) 的大文件一节。下一页进入能"写回磁盘"的路线：[File System Access API](./file-system-access)。
