---
layout: doc
outline: [2, 3]
---

# File System Access API：读写用户可见文件

> 基于 WHATWG File API / File System 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **它解决什么**：让 Web 应用像原生程序一样**读写用户桌面上真实可见的文件与目录**，而非只读上传——在线 IDE、图像编辑器、Markdown 工具的核心能力。
- **支持面（关键）**：**仅 Chromium（Chrome/Edge 桌面）实现，非 Baseline**——Firefox、Safari 长期不支持三个 picker；面向公网**必须写降级**。用 `'showOpenFilePicker' in window` 特性检测。
- **三个入口**：`showOpenFilePicker(opts?)` **返回 `Promise<FileSystemFileHandle[]>`（数组，即使单选）**；`showSaveFilePicker(opts?)` **返回 `Promise<FileSystemFileHandle>`（单个）**；`showDirectoryPicker(opts?)` **返回 `Promise<FileSystemDirectoryHandle>`**。
- **必须用户激活**：三个 picker 都要**瞬时用户激活**（在 click 等手势回调里调用），否则抛 `SecurityError`；不能页面加载时静默弹窗。
- **仅安全上下文**：只在 HTTPS/localhost 可用；`http://` 页面上这些方法根本不存在。
- **`showOpenFilePicker` 选项**：`multiple`（多选，默认 false）、`types`（`[{ description, accept: { MIME: [".ext"] } }]`）、`excludeAcceptAllOption`、`startIn`（`"documents"` 等或某个句柄）、`id`（记住上次目录）。
- **`showSaveFilePicker` 选项**：`suggestedName`（默认文件名）、`types`、`startIn`、`id`。
- **`FileSystemFileHandle`**：`kind === "file"`；`getFile()` → `Promise<File>`（读）；`createWritable(opts?)` → `Promise<FileSystemWritableFileStream>`（写）；`createSyncAccessHandle()` 仅 OPFS+Worker。
- **`FileSystemDirectoryHandle`**：`kind === "directory"`；`getFileHandle(name,{create?})`、`getDirectoryHandle(name,{create?})`、`removeEntry(name,{recursive?})`、`resolve(handle)`；异步迭代 `entries()`/`keys()`/`values()`。
- **写用 `createWritable`**：`write(data)` 写入**临时文件**、`seek(pos)` 移动光标、`truncate(size)` 裁剪，**`close()` 时才原子落到目标文件**；`createWritable({ keepExistingData: true })` 保留原内容做增量改。
- **权限模型**：句柄有 `queryPermission({ mode })` 查、`requestPermission({ mode })` 求，`mode` 为 `"read"`/`"readwrite"`，返回 `"granted"`/`"denied"`/`"prompt"`——**这两个方法是 Chromium 非标准**。
- **读默认不弹权限，写要确权**：`showOpenFilePicker` 拿到的句柄读通常直接可用；改成写、或复用持久化句柄，需 `requestPermission({ mode: "readwrite" })`。
- **句柄可持久化**：`FileSystemHandle` 可**结构化克隆**，能直接 `put` 进 **IndexedDB**（不能进 localStorage）实现"最近打开的文件/文件夹"，下次取出再 `requestPermission` 复用。
- **目录遍历**：`for await (const [name, handle] of dirHandle.entries())`，按 `handle.kind` 分文件/子目录递归。
- **降级路线**：不支持时退回 `<input type="file">`（开）+ `Blob` + `<a download>`（存）——功能近似但拿不到"写回原文件"，见本页末与 [工程模式页](./patterns)。
- **`FileSystemWritableFileStream` 现状**：接口本身近年已跨浏览器（Baseline 2025），但**它的入口 picker 仍锁 Chromium**，所以整条"picker→写回可见文件"链条依然非 Baseline；OPFS 里的 `createWritable` 才是真跨浏览器。

## 一、能力与支持面：先认清边界

File System Access API 是第一个让 Web **读写用户可见真实文件**的标准 API——不是上传副本，而是直接操作用户选中的那个文件，能"打开→改→原地保存"。

但它有一条必须刻在脑子里的约束：**至今仅 Chromium（Chrome/Edge 桌面）实现，不是 Baseline**。Firefox 与 Safari 出于隐私考量长期不落地三个 picker（Safari 仅支持 OPFS 部分，见 [OPFS 页](./opfs)）。所以：

```js
// 面向公网的第一行永远是特性检测
if ("showOpenFilePicker" in window) {
  // 走 File System Access 原生路线
} else {
  // 走 <input> + <a download> 降级路线（见本页第七节）
}
```

外加两条硬性前提：**只在安全上下文（HTTPS/localhost）**、**每次弹 picker 都要瞬时用户激活**。

## 二、三个 picker：注意返回值形态不同

三个入口的返回值形态各异，是最容易记错的点：

```js
// ① 打开：返回句柄【数组】——即使没开 multiple 也是长度 1 的数组
openBtn.addEventListener("click", async () => {
  const [fileHandle] = await window.showOpenFilePicker({
    multiple: false, // 多选设 true，则数组可能多个
    excludeAcceptAllOption: false, // true 则不给"所有文件"选项
    types: [
      {
        description: "文本与 Markdown",
        accept: { "text/plain": [".txt", ".md"] }, // MIME → 扩展名数组
      },
    ],
    startIn: "documents", // 起始目录：desktop/documents/downloads/music/pictures/videos 或某句柄
    id: "note-editor", // 同 id 的 picker 记住上次目录
  });
  const file = await fileHandle.getFile();
  console.log(await file.text());
});

// ② 保存：返回【单个】句柄
saveBtn.addEventListener("click", async () => {
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: "untitled.txt", // 预填文件名
    types: [{ description: "文本", accept: { "text/plain": [".txt"] } }],
  });
  const writable = await fileHandle.createWritable();
  await writable.write("要保存的内容");
  await writable.close();
});

// ③ 选目录：返回【目录句柄】
dirBtn.addEventListener("click", async () => {
  const dirHandle = await window.showDirectoryPicker({
    mode: "readwrite", // 请求读写权限（默认 read）
  });
  // 遍历见第五节
});
```

| 入口 | 返回 | 记忆点 |
| --- | --- | --- |
| `showOpenFilePicker` | `Promise<FileSystemFileHandle[]>` | **数组**（哪怕单选） |
| `showSaveFilePicker` | `Promise<FileSystemFileHandle>` | **单个** |
| `showDirectoryPicker` | `Promise<FileSystemDirectoryHandle>` | **目录句柄** |

用户点"取消"时，三者都以 `AbortError` **reject**——要 `try/catch` 区分"取消"与"真错误"。

## 三、句柄：FileSystemHandle 家族

picker 返回的都是**句柄**（handle），是对文件系统条目的引用，而非内容本身。基类 `FileSystemHandle` 有：

- `kind`：`"file"` 或 `"directory"`——遍历时靠它分流。
- `name`：条目名。
- `isSameEntry(other)`：判断两个句柄是否指向同一条目。

两个子类：

- **`FileSystemFileHandle`**（`kind === "file"`）：`getFile()`（读）、`createWritable()`（写）、`createSyncAccessHandle()`（仅 OPFS+Worker，见 [OPFS 页](./opfs)）。
- **`FileSystemDirectoryHandle`**（`kind === "directory"`）：增删子条目、遍历（第五节）。

## 四、读与写

### 4.1 读：getFile → File

```js
const [fileHandle] = await window.showOpenFilePicker();
const file = await fileHandle.getFile(); // 拿到 File 对象（磁盘当前快照）
const text = await file.text(); // 之后就是普通 File，用上一页的读法
```

`getFile()` 返回的是**读取那一刻的磁盘快照**——文件后来在磁盘上被改了，要重新 `getFile()` 拿新内容。

### 4.2 写：createWritable → write → close

```js
const writable = await fileHandle.createWritable();
// 写入的是一个【临时文件】，close 前原文件不变
await writable.write("第一段"); // 追加在光标处
await writable.write({ type: "seek", position: 0 }); // 移动光标到开头
await writable.write("覆盖开头"); // 从开头覆盖
await writable.write({ type: "truncate", size: 100 }); // 裁剪到 100 字节
await writable.close(); // ⭐ 此刻才把临时文件【原子替换】到目标文件
```

`FileSystemWritableFileStream` 继承 `WritableStream`，便捷方法：

| 调用 | 作用 |
| --- | --- |
| `write(data)` | 在当前光标写入 string / `BufferSource` / `Blob` |
| `write({ type: "write", position, data })` | 指定位置写 |
| `write({ type: "seek", position })` / `seek(pos)` | 移动光标 |
| `write({ type: "truncate", size })` / `truncate(size)` | 裁剪文件到指定字节 |
| `close()` | **关闭并原子落盘**——不调用则改动丢弃 |
| `abort()` | 放弃写入 |

两个关键语义：

- **写进的是临时文件，`close()` 才生效**——中途崩溃/不 close，原文件安然无恙（原子写，避免写坏文件）。
- **默认清空重写**。要在原内容基础上增量改，用 `createWritable({ keepExistingData: true })` 保留原数据，再用 `seek`/`write` 局部覆盖。

## 五、目录：遍历与增删

`showDirectoryPicker()` 拿到目录句柄后，可读写整棵子树：

```js
const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });

// 异步迭代目录条目：entries() 给 [名字, 句柄] 对
for await (const [name, handle] of dirHandle.entries()) {
  if (handle.kind === "file") {
    const file = await handle.getFile();
    console.log("文件：", name, file.size);
  } else {
    console.log("子目录：", name); // handle 是 DirectoryHandle，可递归
  }
}

// 取/建子条目：create:true 不存在则创建
const subDir = await dirHandle.getDirectoryHandle("assets", { create: true });
const newFile = await subDir.getFileHandle("data.json", { create: true });

// 删除：recursive 删非空目录
await dirHandle.removeEntry("old.txt");
await dirHandle.removeEntry("cache", { recursive: true });

// resolve：算出某句柄相对本目录的路径段数组
const segments = await dirHandle.resolve(newFile); // ["assets"] 之类 → 实际 ["assets","data.json"]
```

`entries()`/`keys()`/`values()` 三个异步迭代器分别给"名字+句柄""名字""句柄"；直接 `for await...of dirHandle` 等价于 `entries()`。递归遍历整棵目录树的完整封装见 [参考页](../reference)。

## 六、权限模型与句柄持久化

### 6.1 queryPermission / requestPermission

句柄携带权限状态，可查可求（**注意这两个方法是 Chromium 非标准扩展**）：

```js
/** 确保句柄有指定权限，没有就求 */
async function ensurePermission(handle, mode = "readwrite") {
  const opts = { mode }; // mode: "read" | "readwrite"
  // 已有权限直接过
  if ((await handle.queryPermission(opts)) === "granted") return true;
  // 否则请求（会弹窗，需用户激活）——返回 "granted" / "denied"
  if ((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}
```

规则：`showOpenFilePicker` 拿到的句柄**读**通常即时可用；一旦要**写**、或复用**持久化后**的句柄，就得 `requestPermission({ mode: "readwrite" })` 重新确权（且需用户激活）。

### 6.2 把句柄存进 IndexedDB

`FileSystemHandle` 是**可结构化克隆**的——可直接 `put` 进 **IndexedDB**（不能进 localStorage，那只存字符串），实现"最近打开的文件/文件夹"：

```js
// 存：把句柄当普通值放进 IndexedDB（这里借用 idb 库示意）
import { get, set } from "idb-keyval";
await set("last-file", fileHandle); // 句柄被结构化克隆持久化

// —— 下次会话 ——
const savedHandle = await get("last-file"); // 取回句柄（引用仍指向原文件）
if (savedHandle) {
  // 复用前必须重新确权（权限不随句柄持久化）
  if (await ensurePermission(savedHandle, "readwrite")) {
    const file = await savedHandle.getFile();
    console.log("恢复上次文件：", await file.text());
  }
}
```

要点：**句柄能持久化，但权限不能**——重开页面后拿到的句柄，`queryPermission` 会是 `"prompt"`，必须在用户手势里 `requestPermission` 重新确权。IndexedDB 存句柄/存 Blob 的通用做法见 [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/) 与 [工程模式页](./patterns)。

## 七、降级：不支持时退回 input + a.download

面向公网必须给 Firefox/Safari 一条退路——功能近似（能开能存），只是失去"写回原文件"的原子语义：

```js
/** 打开文件：优先 File System Access，降级到隐藏 input */
async function openFile() {
  if ("showOpenFilePicker" in window) {
    const [handle] = await window.showOpenFilePicker();
    return handle.getFile();
  }
  // 降级：临时 input，Promise 化 change 事件
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => resolve(input.files[0]);
    input.click();
  });
}

/** 保存文件：优先写回原文件，降级到 a.download 触发下载 */
async function saveFile(blob, suggestedName) {
  if ("showSaveFilePicker" in window) {
    const handle = await window.showSaveFilePicker({ suggestedName });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  // 降级：object URL + a[download]，走浏览器下载（不能覆盖原文件）
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url); // 用完即撤，避免泄漏
}
```

降级的本质差异：原生路线能"打开 A.txt → 改 → 原地存回 A.txt"；降级路线的"保存"永远是**另存/下载**一个新文件，拿不到原文件引用。成熟项目可直接用 [browser-fs-access](https://github.com/GoogleChromeLabs/browser-fs-access) 库自动封装这套优先/降级逻辑。

下一页是既跨浏览器又高性能的第三条路线——源私有、免授权、Worker 内同步读写的 [OPFS](./opfs)。
