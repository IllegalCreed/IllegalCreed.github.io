---
layout: doc
outline: [2, 3]
---

# 专用 Worker：构造、通信、错误与销毁

> 基于 WHATWG HTML 现行标准（Web workers 章）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **构造签名**：`new Worker(url, options)`——`url` 是脚本地址（须同源，或 `blob:`/`data:`）；`options` 有 `type`（`"classic"` 默认 / `"module"`）、`credentials`、`name`。
- **模块 worker**：`{ type: "module" }` 让 worker 内可用标准 `import`/`export`；**Chrome 80+/Edge 80+/Safari 15+/Firefox 114+（2023 中）已 Baseline**。经典 worker 用 `importScripts()`。
- **打包器写法**：`new Worker(new URL("./x.worker.js", import.meta.url), { type: "module" })`——Vite/Rollup/webpack 据此单独产出 worker 产物，比裸字符串路径可靠。
- **双向 postMessage**：主线程 `worker.postMessage(data)` ↔ worker 内 `self.postMessage(data)`；对称，两边都能主动发。
- **收消息**：`onmessage = (e) => e.data`（或 `addEventListener("message", …)`）；`e.data` 是对方数据的**结构化克隆拷贝**。
- **结构化克隆边界**：对象/数组/`Date`/`RegExp`/`Map`/`Set`/`ArrayBuffer`/`Blob`/`File`/`ImageData` 可传；**函数、DOM 节点、类方法**抛 `DataCloneError`——传数据不传行为。
- **`importScripts(...urls)`**：**仅经典 worker**，同步加载并执行外部脚本（可多个、可跨源），加载失败抛 `NetworkError`；模块 worker 里不可用，改用 `import`。
- **错误一：`onerror`**：worker 内未捕获异常冒泡到主线程 `worker.onerror`，事件是 `ErrorEvent`，带 `message`/`filename`/`lineno`；`e.preventDefault()` 可阻止默认输出。
- **错误二：`messageerror`**：收到的消息**无法反序列化**时触发（如传了跨代理的不可克隆值），与 `error` 是两回事。
- **worker 内也要接错误**：worker 里 `self.onerror` 兜 worker 自己的未捕获异常；`self.onmessageerror` 兜它收不下的消息。
- **`worker.terminate()`**：主线程侧**立即**强杀 worker，不给收尾机会，正在跑的任务直接中断。
- **`self.close()`**：worker **内部**主动关闭自己，处理完当前任务后停止事件循环。
- **作用域**：worker 全局是 `self`（`DedicatedWorkerGlobalScope`），**没有 `window`/`document`/`parent`**；有 `location`、`navigator`、`setTimeout`、`fetch`、`WebSocket`、`IndexedDB`、`WebAssembly`、`caches`、Streams 等。
- **同源**：worker 脚本须与页面同源；子 worker（worker 内再 `new Worker`）须与**父页面**同源，且路径相对于父 worker 解析。
- **内联 worker**：把代码变成 `Blob` → `URL.createObjectURL` → `new Worker(url)`，可不落独立文件（记得 `revokeObjectURL`）。
- **CSP**：worker 有独立执行上下文，其 CSP 由 worker 脚本响应头决定（`blob:`/`data:` 例外，继承创建者）。
- **传大数据别只靠克隆**：大 `ArrayBuffer` 用 transfer 列表零拷贝移交，见[数据传输与 OffscreenCanvas](./transfer-offscreen)。

## 一、构造 Worker：url 与 options

专用 worker 由 `Worker()` 构造函数创建，一个页面可以建多个：

```js
// 最简：经典 worker，脚本须与页面同源
const w1 = new Worker("worker.js");

// 完整 options
const w2 = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module", // "classic"（默认）| "module"
  credentials: "same-origin", // 模块 worker 拉取脚本时的凭据策略：omit | same-origin | include
  name: "parser-worker", // 给 worker 命名，调试面板与 self.name 里可见
});
```

- **`type`**：决定 worker 脚本按经典脚本还是 ES 模块解析——直接影响你能不能在 worker 里写 `import`，见第二节。
- **`name`**：调试用；在 worker 内可通过 `self.name` 读到，多 worker 场景便于区分。
- **`url` 同源**：跨源脚本地址会触发 `error` 事件（现代浏览器不再抛同步 `SecurityError`）。要加载跨源代码，用内联 worker 包一层（第六节）。

## 二、经典 worker vs 模块 worker

这是构造 worker 最需要先决定的一件事，它决定了 worker 内部的模块系统：

| 维度 | 经典 worker（默认） | 模块 worker（`type: "module"`） |
| --- | --- | --- |
| 加载依赖 | `importScripts("a.js", "b.js")` 同步加载 | 标准 `import` / `import()` / `export` |
| 顶层 `import` | 不支持（语法错误） | 支持 |
| `import.meta` | 无 | 有 |
| 兼容性 | 老到不能再老，全支持 | **Chrome/Edge 80+、Safari 15+、Firefox 114+（2023 中）已 Baseline** |

**模块 worker**（推荐新项目用）：

```js
// ---------- 主线程 ----------
const worker = new Worker(new URL("./sum.worker.js", import.meta.url), {
  type: "module",
});

// ---------- sum.worker.js（模块 worker）----------
import { sum } from "./math.js"; // ✅ 模块 worker 里可以直接 import

self.onmessage = (e) => {
  self.postMessage(sum(e.data)); // 复用共享的纯函数模块
};
```

**经典 worker**用 `importScripts()` 同步拉依赖——它会**阻塞**worker 线程直到全部脚本下载并执行完，脚本按参数顺序执行（下载顺序不保证，但执行顺序保证）：

```js
// ---------- classic.worker.js（经典 worker）----------
importScripts("./lib/lodash.js", "./lib/dayjs.js"); // 同步加载，多个按序执行
// 加载失败抛 NetworkError；跨源脚本也允许（与模块 import 的同源限制不同）

self.onmessage = (e) => {
  self.postMessage(_.chunk(e.data, 100)); // 用 importScripts 引入的全局
};
```

> 选择：新代码优先**模块 worker**，能用 `import` 复用主项目的 ES 模块、配合打包器体验最好；只有要兼容极老环境或用 `importScripts` 动态加载跨源脚本时才回落经典 worker。

## 三、双向通信：postMessage 与 onmessage

主线程和 worker 的通信是**对称**的——两边都有 `postMessage`（发）和 `onmessage`（收），谁都能主动发起：

```js
// ---------- 主线程 ----------
const worker = new Worker(new URL("./task.worker.js", import.meta.url), {
  type: "module",
});

// 用请求 id 关联「一发一收」（裸 postMessage 需要自己做）
let seq = 0;
const pending = new Map();
function call(cmd, payload) {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    worker.postMessage({ id, cmd, payload }); // 带上 id 发出去
  });
}
worker.onmessage = (e) => {
  const { id, result } = e.data;
  pending.get(id)?.(result); // 按 id 找回对应的 resolve
  pending.delete(id);
};

// 用起来像普通异步调用
const hash = await call("sha256", fileBytes);
```

```js
// ---------- task.worker.js（worker 端）----------
self.onmessage = async (e) => {
  const { id, cmd, payload } = e.data;
  let result;
  if (cmd === "sha256") {
    const digest = await crypto.subtle.digest("SHA-256", payload); // worker 里可用 Web Crypto
    result = [...new Uint8Array(digest)];
  }
  self.postMessage({ id, result }); // 原样带回 id，主线程才能对上号
};
```

两种监听写法等价：`self.onmessage = fn`（只能挂一个）或 `self.addEventListener("message", fn)`（可挂多个）。这段「id 关联 + Map 存 resolve」的样板，正是 Comlink 要替你消灭的东西（见[工程模式页](./patterns-comlink)）。

## 四、结构化克隆：能传什么、不能传什么

`postMessage` 用**结构化克隆算法**把数据深拷贝到对方世界。它比 `JSON.stringify` 强得多——能搬 `Date`、`RegExp`、`Map`、`Set`、`ArrayBuffer`、TypedArray、`Blob`、`File`、`ImageData`、循环引用，但也有硬边界：

```js
// ✅ 能传
worker.postMessage({
  when: new Date(), // Date 保真
  tags: new Set(["a", "b"]), // Set/Map 保真
  buf: new Uint8Array([1, 2, 3]), // TypedArray/ArrayBuffer 保真
  pattern: /ab+c/gi, // RegExp 保真
});

// ❌ 抛 DataCloneError：函数、DOM 节点、类的方法都克隆不了
worker.postMessage({
  fn: () => 1, // 💥 函数不可克隆
  node: document.body, // 💥 DOM 节点不可克隆
});

// ⚠️ 类实例：数据字段能过去，但【方法与原型链丢失】——取到的是普通对象
class Point { constructor(x) { this.x = x; } dist() { return this.x; } }
worker.postMessage(new Point(3)); // worker 收到 { x: 3 }，没有 dist()
```

记忆口诀：**结构化克隆搬数据，不搬行为**。要在 worker 里用某个类，就在 worker 里也定义这个类、只传纯数据字段过去、在对面重建实例。完整的类型边界表见[参考页](../reference)。大对象深拷贝本身也耗时——几十 MB 的 `ArrayBuffer` 应该用 transfer 零拷贝移交而非克隆，见[数据传输页](./transfer-offscreen)。

## 五、错误处理：error 与 messageerror

worker 相关的错误分两类，别混：

```js
// ---------- 主线程 ----------
// 类型一：worker 内部未捕获的异常，冒泡到这里
worker.onerror = (e) => {
  // e 是 ErrorEvent，带定位信息
  console.error(`worker 崩了：${e.message}`);
  console.error(`位置：${e.filename}:${e.lineno}:${e.colno}`);
  e.preventDefault(); // 阻止默认的控制台报错输出（可选）
};

// 类型二：收到的消息无法反序列化（例如对方传了当前环境克隆不了的值）
worker.onmessageerror = (e) => {
  console.error("收到无法解析的消息", e);
};
```

worker **内部**也应该自己接错误，避免异常静默：

```js
// ---------- worker 端 ----------
self.onerror = (e) => {
  // worker 自身未捕获异常；返回 true / preventDefault 可阻止继续向外冒泡
  console.error("worker 内部错误", e.message);
};
self.onmessageerror = (e) => {
  console.error("worker 收到无法解析的消息", e);
};

// 更稳的做法：业务逻辑里主动 try/catch，把错误【当消息】发回主线程
self.onmessage = async (e) => {
  try {
    self.postMessage({ ok: true, data: await doWork(e.data) });
  } catch (err) {
    // 注意：Error 对象跨 postMessage 的可克隆性各浏览器不完全一致，
    // 稳妥起见把关键字段拆成纯数据传回
    self.postMessage({ ok: false, error: { name: err.name, message: err.message } });
  }
};
```

要点：

- **`error` ≠ `messageerror`**：前者是「worker 里代码抛了异常」，后者是「消息反序列化失败」，处理位置和含义都不同。
- **`ErrorEvent` 的定位字段**：`message`/`filename`/`lineno`/`colno` 帮你定位 worker 内部哪行出的错。
- **推荐把错误当消息回传**：依赖 `onerror` 冒泡拿不到结构化的业务上下文；生产代码通常在 worker 内 `try/catch`，把 `{ ok, error }` 主动 `postMessage` 回来，主线程按约定处理。

## 六、销毁与生命周期：terminate 与 self.close

专用 worker 的生命周期跟着创建它的文档，但你也能手动结束它——从两侧都行：

```js
// ---------- 主线程侧：立即强杀 ----------
worker.terminate();
// worker 线程被立刻销毁，正在跑的任务直接中断，不触发任何收尾事件。
// terminate 后再 postMessage 无效。
```

```js
// ---------- worker 内部：自行了结 ----------
self.onmessage = (e) => {
  if (e.data === "shutdown") {
    self.close(); // 处理完当前任务后停止事件循环、关闭自己
  }
};
```

- **`terminate()`（外部）**：粗暴但可靠——用户取消了长任务、worker 卡死、页面要清理资源时用它一刀切。
- **`self.close()`（内部）**：worker 干完活自我了断，适合「一次性任务型」worker。
- **两者都不给「优雅收尾」的机会**：没有 `beforeterminate` 之类事件，需要保存的状态得在关闭前自己处理好。
- **注意 `Worker` 没有 `terminate` 之外的暂停/恢复**——要复用 worker 做多次任务就别关它，建个 worker 池（见[工程模式页](./patterns-comlink)）。

> 顺带一提：`terminate()` 是 `Worker` 的方法，**Service Worker 没有 `terminate()`**（它的生命周期由浏览器托管），这也是两者定位不同的一个体现。

## 七、worker 内能用什么：作用域与 API 范围

worker 运行在 `DedicatedWorkerGlobalScope` 里，全局对象是 `self`（大多数场合可省略）。和主线程最大的区别是**没有 DOM**：

**worker 内可用**（够搭完整的数据/计算层）：

- `self`、`self.name`、`location`、`navigator`
- 定时器：`setTimeout`/`setInterval`/`queueMicrotask`
- 网络：`fetch`、`XMLHttpRequest`、`WebSocket`、`EventSource`
- 存储：`IndexedDB`、`caches`（Cache API）
- 计算：`WebAssembly`（见 [WASM 叶](/zh/web-advanced/web-api/webassembly/)）、`crypto`（Web Crypto）、`TextEncoder`/`TextDecoder`
- 图形：`OffscreenCanvas`、`createImageBitmap`（见[数据传输页](./transfer-offscreen)）
- 流：`ReadableStream`/`WritableStream`/`TransformStream`
- 经典 worker 专属：`importScripts()`

**worker 内不可用**（都归主线程管）：

- `window`、`document`、`parent`、`frames`
- 任何 DOM 节点与 DOM API（`alert`、直接改 `<canvas>` 等）
- `localStorage` / `sessionStorage`（**Web Storage 在 worker 里不可用**——要在 worker 用持久存储走 `IndexedDB` 或 `caches`）

心智规则：**worker 管「算」和「网络/存储 IO」，主线程管「界面」**。worker 算完把结果 `postMessage` 回主线程，由主线程去改 DOM。要在 worker 里也用 Web Storage 那种键值存储，用 `IndexedDB` 顶上（见 [IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)）。

## 八、内联 worker：不落独立文件

有时不想为一小段 worker 逻辑单独维护一个文件（或要动态生成 worker 代码），可以把代码变成 `Blob` 再造对象 URL：

```js
// 把一段 worker 代码内联成 Blob URL
const code = `
  self.onmessage = (e) => {
    const n = e.data;
    // 一段纯计算，比如算斐波那契
    const fib = (k) => (k < 2 ? k : fib(k - 1) + fib(k - 2));
    self.postMessage(fib(n));
  };
`;
const blob = new Blob([code], { type: "text/javascript" });
const url = URL.createObjectURL(blob);

const worker = new Worker(url); // 用 blob: URL 造 worker
worker.onmessage = (e) => {
  console.log("fib =", e.data);
  URL.revokeObjectURL(url); // 用完释放，避免内存泄漏
};
worker.postMessage(30);
```

内联 worker 适合小工具、动态代码、或想把 worker 逻辑和主逻辑放同一文件的场景；代价是拿不到独立文件的缓存与 sourcemap 体验，大 worker 仍推荐独立文件 + `new URL(...)` 打包写法。

下一页看**多个页面/标签如何共享同一个后台实例**——[共享 Worker](./shared-worker)。
