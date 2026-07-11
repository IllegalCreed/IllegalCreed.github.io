---
layout: doc
outline: [2, 3]
---

# 工程模式与 Comlink

> 基于 WHATWG HTML 现行标准（Web workers 章）与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **裸 postMessage 的痛点**：手工 `switch(msg.type)` 路由、手工用 `id` 关联请求响应、手工把错误当消息回传、两端消息格式各写一份——样板多、易错、难维护。
- **Comlink 一句话**：Google Chrome Labs 出品的 RPC 库，用 **`Proxy`** 把 worker 里暴露的对象/方法，在主线程包装成**返回 Promise 的 async 调用**，`postMessage` 那层彻底隐形。
- **体积**：约 **1.1KB（brotli）/ 1.2KB（gzip）**，几乎零负担；依赖 ES6 `Proxy`（Chrome 56+/Firefox 52+/Safari 10.1+/Edge 15+）。
- **两个核心 API**：worker 里 `Comlink.expose(obj)` 暴露；主线程 `Comlink.wrap(worker)` 拿到代理——之后**所有属性/方法都变异步**（连读属性都要 `await`）。
- **调用像本地 async**：`const api = Comlink.wrap(worker); await api.doWork(x)`——看不见 `postMessage`、看不见 `onmessage`、看不见 id 关联。
- **暴露什么都行**：对象、`class`（`await new api.Foo()` 远程实例化）、单个函数——Comlink 都能代理。
- **回调用 `Comlink.proxy()`**：函数不可克隆，要把回调传进 worker 得包 `Comlink.proxy(fn)`，Comlink 反向建代理让 worker 能回调主线程。
- **transfer 用 `Comlink.transfer()`**：默认走克隆；要零拷贝移交大 buffer，`api.f(Comlink.transfer(data, [data.buffer]))`。
- **配 SharedWorker**：主线程 `Comlink.wrap(sw.port)`，worker 内 `onconnect = (e) => Comlink.expose(api, e.ports[0])`（见[共享 Worker 页](./shared-worker)）。
- **TypeScript 友好**：`Comlink.wrap<T>(worker)` 得到 `Comlink.Remote<T>`，方法签名自动变 `Promise` 版，类型安全。
- **Vite/打包器导入 worker**：`new Worker(new URL("./x.worker.ts", import.meta.url), { type: "module" })`——打包器据此单独产出 worker chunk，路径可靠、可 tree-shake。
- **worker 池模式**：建 N 个 worker（N≈`navigator.hardwareConcurrency`）轮流/按空闲分派任务，摊薄启动成本、吃满多核；库有 workerpool、Comlink 也可自行封装。
- **何时不值得下放**：worker **启动**（下载解析脚本、建上下文，几到几十 ms）+ **通信**（序列化拷贝）都有成本；任务太短、数据太大且要频繁往返、或本可用 `setTimeout` 时，下放反而更慢。
- **衡量方法**：先测主线程上这段活的真实耗时——**单次同步 > ~50ms 才考虑下放**；小于就别付启动与通信税。
- **别每次任务新建 worker**：反复 `new Worker`/`terminate` 把启动成本乘以调用次数——长期任务复用同一个（或用池）。
- **数据尽量 transfer**：下放大 buffer 走 `Comlink.transfer` / 原生 transfer 列表，别让克隆吃掉并行收益（见[数据传输页](./transfer-offscreen)）。

## 一、裸 postMessage 的样板痛点

回顾[专用 Worker 页](./dedicated-worker)里那段「用 id 关联请求响应」的代码——它能跑，但把「调一个 worker 里的函数」这么简单的意图，摊成了一大堆基础设施：

```js
// 主线程：为了「调 worker 的一个方法」要写这么多
let seq = 0;
const pending = new Map();
function call(cmd, payload) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, cmd, payload });
  });
}
worker.onmessage = (e) => {
  const { id, ok, result, error } = e.data;
  const p = pending.get(id);
  ok ? p.resolve(result) : p.reject(error); // 还要手工分发成功/失败
  pending.delete(id);
};

// worker 端：又要写一套对称的 switch 路由
self.onmessage = async (e) => {
  const { id, cmd, payload } = e.data;
  try {
    let result;
    switch (cmd) {                       // 每加一个方法都要改这里
      case "parse": result = parse(payload); break;
      case "hash": result = await hash(payload); break;
    }
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: { message: err.message } });
  }
};
```

问题很清楚：**协议是手写的**（id、cmd、ok/error 约定两端各维护一份）、**路由是手写的**（`switch` 随方法数膨胀）、**错误传播是手写的**、**加一个方法要改三处**。这正是 Comlink 要抹掉的一切。

## 二、Comlink：用 Proxy 让 worker 调用像本地函数

[Comlink](https://github.com/GoogleChromeLabs/comlink)（约 1.1KB brotli）的核心思路：worker 里 `expose` 一个对象，主线程 `wrap` 成一个 **ES6 `Proxy`**；你在这个代理上读属性、调方法，Comlink 底层自动转成 `postMessage` 往返，并把结果 `resolve` 回来。上面几十行样板缩成几行：

```js
// ---------- worker 端 api.worker.js ----------
import * as Comlink from "comlink";

const api = {
  parse(text) {
    return JSON.parse(text); // 就是普通同步/异步函数，不用管消息协议
  },
  async hash(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)];
  },
};

Comlink.expose(api); // 把 api 暴露给主线程；就这一行
```

```js
// ---------- 主线程 main.js ----------
import * as Comlink from "comlink";

const worker = new Worker(new URL("./api.worker.js", import.meta.url), {
  type: "module",
});
const api = Comlink.wrap(worker); // 拿到代理

// 调用像调本地 async 函数——没有 postMessage、没有 id、没有 switch
const data = await api.parse('{"a":1}');
const digest = await api.hash(fileBytes);
```

要点：

- **一切都变异步**：`wrap` 出来的代理上，方法调用返回 Promise，**连读属性也返回 Promise**（`await api.someProp`）——因为值在另一个线程，取回来必然异步。
- **加方法零成本**：worker 的 `api` 对象上加个函数，主线程立刻能 `await api.newFn()`，不用改任何协议代码。
- **错误自动传播**：worker 里抛的异常，会让主线程对应的 `await` reject——不用再手工塞 `{ ok, error }`。

## 三、Comlink 进阶：class、回调、transfer

**暴露 class（远程实例化）**：

```js
// worker 端
class Calculator {
  constructor(base) { this.base = base; }
  add(n) { return this.base + n; }
}
Comlink.expose(Calculator);

// 主线程：用 new 远程实例化，再调其方法（都要 await）
const Remote = Comlink.wrap(worker);
const calc = await new Remote(10); // 远程 new
console.log(await calc.add(5)); // 15
```

**回调要 `Comlink.proxy()`**：函数不可克隆，直接传进 worker 会报错；用 `proxy()` 包一层，Comlink 会反向建代理让 worker 能调回主线程：

```js
// 主线程：把进度回调传给 worker
await api.processLargeFile(
  file,
  Comlink.proxy((percent) => updateProgressBar(percent)), // 回调必须 proxy
);
```

**大数据用 `Comlink.transfer()` 零拷贝移交**（默认是克隆）：

```js
// 主线程：把 buffer 的所有权移交给 worker，不走深拷贝
const buf = new Uint8Array(20 * 1024 * 1024);
await api.compress(Comlink.transfer(buf, [buf.buffer])); // 第二参数是 transfer 列表
// 移交后主线程的 buf 已 detached（见数据传输页）
```

`Comlink.transfer` 底层就是把对象塞进 `postMessage` 的 transfer 列表——语义和[数据传输页](./transfer-offscreen)讲的一致，只是包了个顺手的门面。

## 四、用打包器导入 worker：Vite 的标准写法

现代打包器（Vite、Rollup、webpack 5、Parcel）都认 **`new URL(..., import.meta.url)` + `{ type: "module" }`** 这个组合——它让打包器把 worker 当独立入口处理、产出单独的 chunk、正确改写路径：

```js
// Vite / Rollup / webpack 5 通用：可靠、可 tree-shake、路径不会错
const worker = new Worker(
  new URL("./heavy.worker.ts", import.meta.url), // 相对当前模块解析
  { type: "module" }, // 模块 worker，可在 worker 内 import
);
```

Vite 另有语法糖 `import HeavyWorker from "./heavy.worker.ts?worker"`，但 `new URL(...)` 写法是跨打包器最通用的一种，推荐优先用它。**别用裸字符串路径**（`new Worker("./heavy.worker.js")`）——打包/部署后相对路径经常错位，且打包器不会把它当模块处理。

配合 Comlink + TypeScript，类型也能一路贯通：

```ts
// heavy.worker.ts —— 导出接口类型供主线程复用
export interface HeavyApi {
  compress(bytes: Uint8Array): Promise<Uint8Array>;
}

// main.ts
import * as Comlink from "comlink";
import type { HeavyApi } from "./heavy.worker";

const worker = new Worker(new URL("./heavy.worker.ts", import.meta.url), {
  type: "module",
});
// Comlink.Remote<T> 把每个方法自动变 Promise 版，签名类型安全
const api = Comlink.wrap<HeavyApi>(worker);
const out = await api.compress(bytes); // out: Uint8Array，类型全程可推导
```

## 五、Worker 池：摊薄启动、吃满多核

单个 worker 只有一条线程，扛不住高频/可并行的任务流；反复 `new Worker`/`terminate` 又让启动成本乘以调用次数。**Worker 池**建一组常驻 worker，按空闲把任务分派进去——既复用（省启动）、又并行（吃满多核）：

```js
// 极简 worker 池：按 CPU 核数建一组 worker，轮询分派
class WorkerPool {
  constructor(url, size = navigator.hardwareConcurrency || 4) {
    // hardwareConcurrency ≈ 逻辑核数，是池大小的合理默认
    this.workers = Array.from({ length: size }, () =>
      Comlink.wrap(new Worker(url, { type: "module" })),
    );
    this.next = 0;
  }
  // 轮询取一个 worker 代理（生产可换成「取空闲的」更优策略）
  pick() {
    const w = this.workers[this.next];
    this.next = (this.next + 1) % this.workers.length;
    return w;
  }
}

const pool = new WorkerPool(new URL("./task.worker.js", import.meta.url));
// 并行跑多个任务，自动摊到多个 worker 上
const results = await Promise.all(chunks.map((c) => pool.pick().process(c)));
```

要点：**池大小取 `navigator.hardwareConcurrency`** 附近（逻辑核数），再多只会互相抢核；生产可用成熟库（如 workerpool）或按「空闲队列」而非「轮询」分派以更均衡。

## 六、何时不值得下放：worker 的成本账

Worker 不是免费的加速器，它有两笔明确成本：

1. **启动成本**：`new Worker` 要下载并解析 worker 脚本、创建独立的 JS 上下文——冷启动几毫秒到几十毫秒。任务越短，这笔固定开销占比越离谱。
2. **通信成本**：`postMessage` 要序列化/反序列化（结构化克隆）数据。传大对象时深拷贝本身就慢；来回频繁通信时，序列化开销可能吃掉全部并行收益。

由此得到「**该不该下放**」的判断：

| 情形 | 判断 |
| --- | --- |
| 单次同步计算 **> ~50ms**、输入输出可序列化 | ✅ 值得下放（50ms 是用户可感知卡顿门槛） |
| 任务只有几 ms | ❌ 启动 + 通信比计算还贵 |
| 只是想「稍后/空闲再跑」，不需要真并行 | ❌ 用 `setTimeout`/`requestIdleCallback` |
| 要传的数据极大且**需频繁双向往返** | ⚠️ 先算通信账；能 transfer 就 transfer，或考虑 `SharedArrayBuffer` |
| 高频、可并行的任务流 | ✅ 用 worker 池，别每次新建 |

**衡量而非猜测**：下放前先用 `performance.now()` 量一下这段活在主线程上的真实耗时，再对照上表决定。「感觉很重」常常并不重，而真正重的活下放后收益立竿见影。数据传输务必配合 transfer/`OffscreenCanvas`（见[数据传输页](./transfer-offscreen)）把通信成本压到最低。

到此，专用/共享 worker 的编程面、数据传输、工程封装都过了一遍——速查、对比表与易错清单汇总见[参考页](../reference)。
