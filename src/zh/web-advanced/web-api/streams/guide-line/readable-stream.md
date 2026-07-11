---
layout: doc
outline: [2, 3]
---

# ReadableStream：读源、reader 与分流

> 基于 WHATWG Streams 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **两种角色**：要么**消费**现成的 `ReadableStream`（如 `response.body`），要么用 `new ReadableStream(underlyingSource, strategy)` **自己造**一个流。
- **underlying source 三方法**：`start(controller)`（构造后立即调一次，做初始化 / 拉起数据源）、`pull(controller)`（队列没满时反复调，用来续喂 chunk——**背压的关键钩子**）、`cancel(reason)`（消费者取消时调，释放数据源）。
- **控制器（`ReadableStreamDefaultController`）**：`enqueue(chunk)` 入队一块、`close()` 关流（不再入队、已入队的仍可读完）、`error(e)` 让流进入错误态；`desiredSize` 是背压信号。
- **拿 reader**：`stream.getReader()` 返回 `ReadableStreamDefaultReader` 并**锁定**流；字节流可 `getReader({ mode:"bytes"... })`——BYOB 见[字节流页](./bytes-compression)。
- **read 循环**：`reader.read()` → `Promise<{ done, value }>`；`done:false` 时 `value` 是 chunk，`done:true` 时读完（`value` 为 `undefined`）；出错则 Promise reject。
- **可移植读法**：`while(true){ const {done,value}=await reader.read(); if(done)break; /* 处理 value */ }`——全浏览器安全（与 [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)口径一致）。
- **`for await...of`**：`ReadableStream` 是异步可迭代对象，可 `for await (const chunk of stream)`，**但 Safari 27 才支持**，2026-07 跨浏览器别裸用；正常结束自动 `releaseLock`。
- **`releaseLock()`**：释放 reader 对流的锁，之后可重新 `getReader()` 或接管道；有未决 `read()` 时旧版会抛错，现规范允许释放（挂起的 read reject）。
- **`reader.cancel(reason)` / `stream.cancel(reason)`**：**丢弃**队列里所有未读 chunk 并调用 underlying source 的 `cancel()`；返回 Promise，流即关闭。
- **`reader.closed`**：一个 Promise，流正常关闭时 resolve、出错时 reject——用来挂"读完/出错"的收尾。
- **`stream.locked`**：布尔，有 reader 锁着就是 `true`；锁定时再 `getReader()` / `pipeTo` / `tee` 均抛 `TypeError`。
- **`tee()` 分流**：`const [a, b] = stream.tee()` 把一个流复制成**两个独立分支**（各自 reader、各自缓冲），原流随即被锁；用于"一份读两次"（渲染 + 缓存）。
- **tee 的内存坑**：两分支共享同一数据，**读得慢的一支会在它的内部队列里累积未读 chunk**——两支消费速度差太大时内存吃紧。
- **push vs pull 源**：push 源（WebSocket、媒体）自己不停产出、你用 `pull`/`cancel` 调速；pull 源（`fetch`）要被显式索取——`pull` 就是"该要下一块了"的回调。
- **`enqueue` 后可读**：`start` 里同步 `enqueue` 若干块也行，`close()` 后消费者仍能把队列里的读完才收到 `done:true`。
- **错误传播**：source 的方法里 throw、或 `controller.error(e)` → reader 的 `read()`/`closed` 以该错误 reject；管道里会传播到下游。
- **别忘收尾**：手写 read 循环时 `try/finally` 里 `releaseLock()`；否则流一直锁着，`tee`/`pipeTo` 都用不了。

## 一、消费一个现成的流：read 循环

最常见的场景是消费平台给的流，比如 `fetch` 的 `response.body`。**读的通用套路**（不限于 fetch）是：`getReader()` 拿 reader → 循环 `read()` → 遇 `done` 收尾。

```js
/** 通用消费套路：逐块读到流结束 */
async function consume(stream) {
  const reader = stream.getReader(); // 拿默认 reader，流被锁定
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break; // 流已读完，value 为 undefined
      handleChunk(value); // 处理这一块 chunk
    }
  } finally {
    reader.releaseLock(); // ⭐ 收尾必做：释放锁，之后流才能重新被读/接管道
  }
}
```

- `read()` 返回 `Promise<{ done, value }>`：这是整个读取的核心协议——`done:false` 带 `value`（一块 chunk），`done:true` 表示读完。
- **锁定语义**：`getReader()` 让 `stream.locked` 变 `true`；不 `releaseLock()`，别的地方就拿不到新 reader，也不能 `pipeTo`/`tee`。所以用 `try/finally` 保证释放。
- 具体到 `response.body` 的读取、下载进度累计、`AbortSignal` 取消，见 [fetch 叶 · 流式与离页请求](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)，本页不重复。

### 1.1 `for await...of`：更简洁但要等 Safari

`ReadableStream` 实现了异步可迭代协议，可以直接 `for await`：

```js
// 语法上最简洁：自动 read 循环、自动 releaseLock、自动在结束/出错时收尾
async function consume(stream) {
  for await (const chunk of stream) {
    handleChunk(chunk);
  }
}
```

代价是兼容性：**异步迭代 `ReadableStream` 在 Chrome 124 / Firefox 110 已支持，Safari 直到 27 才补齐**——核于 2026-07 还不是跨浏览器安全写法。移植 MDN 示例里的 `for await` 时，跨端代码换回上面的 `getReader()` 循环（与 fetch 叶结论一致）。

## 二、自己造一个流：underlying source

`new ReadableStream(underlyingSource, queuingStrategy)` 的第一个参数是 **underlying source**，用三个可选方法描述"数据从哪来、怎么续、怎么停"：

```js
const stream = new ReadableStream(
  {
    // 1. 构造后立即调一次：做初始化、拉起数据源
    start(controller) {
      // controller 是 ReadableStreamDefaultController
    },
    // 2. 内部队列没满时反复调：续喂 chunk —— 背压就在这里体现
    pull(controller) {
      // 队列满（desiredSize <= 0）时浏览器不再调 pull，自动背压
    },
    // 3. 消费者取消时调：释放数据源、清理副作用
    cancel(reason) {},
  },
  { highWaterMark: 3, size: () => 1 }, // 排队策略，见背压页
);
```

三个方法的分工与调用时机：

| 方法 | 何时调 | 干什么 |
| --- | --- | --- |
| `start(controller)` | 构造后**立即一次** | 初始化：连数据源、注册监听、（可选）同步 `enqueue` 首批 |
| `pull(controller)` | 队列未满、需要更多时**反复** | 续喂：拉下一块并 `enqueue`；返回 Promise 则等它兑现再算这轮拉取完成 |
| `cancel(reason)` | 消费者 `cancel()` 时 | 收尾：停生成、关句柄、清定时器 |

### 2.1 控制器：enqueue / close / error

`start`/`pull` 收到的 `controller`（`ReadableStreamDefaultController`）是你操控流的手柄：

```js
let timer;
const stream = new ReadableStream({
  start(controller) {
    // 每秒产一块随机字符串，push 型数据源
    timer = setInterval(() => {
      controller.enqueue(randomChunk()); // 入队一块 chunk，消费者即可读到
    }, 1000);
  },
  cancel() {
    clearInterval(timer); // 被取消：停止生产，别再 enqueue
  },
});

// 别处在满足条件时收尾：
// controller.close();     // 关流：不再接受 enqueue，队列里的读完后消费者收到 done:true
// controller.error(err);  // 出错：reader 的 read()/closed 以 err reject
```

- **`enqueue(chunk)`**：把一块放进内部队列。`close()` 之后再 `enqueue` 会抛错。
- **`close()`**：关流。已入队的 chunk 消费者仍能读完，读完才收到 `{ done:true }`。
- **`error(e)`**：让流进入错误态，reader 的 `read()` 与 `closed` 都以 `e` reject。
- **`desiredSize`**：`highWaterMark − 队列已缓冲大小`，push 源可据它判断"是否该暂停生产"——背压细节在[背压与排队策略](./guide-line/backpressure-strategy)。

### 2.2 pull 源示例：按需生成

`pull` 型源（如逐段读文件、逐页拉接口）不主动产出，等浏览器"要"了才拉一块——`pull` 就是那个"该要下一块了"的信号：

```js
function makeRangeStream(start, end) {
  let i = start;
  return new ReadableStream({
    // 队列没满就反复调 pull，续喂到 desiredSize <= 0 自动停（背压）
    pull(controller) {
      if (i >= end) {
        controller.close(); // 生成完毕，关流
        return;
      }
      controller.enqueue(i++); // 一次喂一块；浏览器按需决定调多少次 pull
    },
  });
}
```

因为背压，`pull` 只在队列还能装时被调——**你不用手动节流，队列满了浏览器自然不再调 `pull`**。这正是"用流 = 自动背压"的体现。

## 三、取消：cancel 丢弃未读数据

消费者不想读了，用 `reader.cancel(reason)` 或 `stream.cancel(reason)`（流未锁时）：

```js
await reader.cancel("用户切走了"); // 丢弃队列里所有未读 chunk，并调用 source 的 cancel()
```

- **cancel = 丢数据 + 通知源收尾**：队列里未读的 chunk 直接扔掉，underlying source 的 `cancel(reason)` 被调用去释放资源；返回的 Promise 在收尾完成后兑现。
- 与 `controller.close()` 的区别：`close` 是**源侧**说"没有更多了、把剩的读完"；`cancel` 是**消费侧**说"我不要了、剩的别读了"。
- 结合 `fetch` 时，`reader.cancel()` 会中断底层网络传输——但取消 fetch 更规范的方式是 `AbortController`（见 [fetch 叶](/zh/web-advanced/web-api/fetch/guide-line/streaming-keepalive)）。

## 四、tee：把一个流分成两份

流只能顺序读一遍。要**同一份数据读两次**（经典场景：Service Worker 里一边把响应流给浏览器、一边写进 Cache），用 `tee()`：

```js
const [branchA, branchB] = stream.tee(); // 复制成两个独立分支；原 stream 随即被锁
consume(branchA); // 分支 A：比如喂给浏览器渲染
consume(branchB); // 分支 B：比如写入缓存
```

- **两个分支各自独立**：各有自己的 reader、各自的内部队列，互不影响读取进度。
- **内存坑**：两分支共享同一批上游 chunk，**读得慢的一支会把未读 chunk 堆在它的队列里**。两支速度差越大、数据越多，累积内存越多——别 tee 出一个"永远不读"或"慢半拍"的分支。
- `tee()` 后**原流被锁**（`locked` 为 `true`），此后只能通过两个分支读；对原流再 `getReader`/`pipeTo` 会抛 `TypeError`。
- 字节流 `tee()` 有专门语义（分支也是字节流），见[字节流页](./bytes-compression)。

## 五、locked 与生命周期收尾

`stream.locked` 是判断流"能不能被接管"的开关：

```js
if (!stream.locked) {
  stream.pipeTo(sink); // 未锁才能接管道
}
```

- `getReader()` / `getWriter()`（可写侧）/ `pipeTo` / `pipeThrough` / `tee` 期间流都是锁定的。
- **手写 read 循环务必在 `finally` 里 `releaseLock()`**：漏了会让流一直锁着，后续 `tee`/`pipeTo` 全用不了，还可能泄漏底层资源。
- **`reader.closed`** 是收尾的好挂点：流正常关闭它 resolve、出错它 reject——可用来统一记日志或触发下一步。

```js
reader.closed
  .then(() => console.log("流正常读完"))
  .catch((e) => console.error("流出错：", e));
```

## 六、错误处理

流的错误从**源**流向**消费者**：

- underlying source 的 `start`/`pull`/`cancel` 里 throw、或显式 `controller.error(e)` → 流进入错误态；
- 该错误让 reader 的 `read()`（挂起的那次）与 `closed` 都以 `e` reject；
- 在管道里（`pipeThrough`/`pipeTo`），错误会**沿管道传播**给下游（可用 `preventAbort` 等改变行为，见[背压页](./guide-line/backpressure-strategy)）。

```js
try {
  const { value, done } = await reader.read();
} catch (e) {
  // source 侧 error 或网络错误在此浮现
  console.error("读取失败：", e);
}
```

下一页进入**写**与**变换**：`WritableStream` 的 underlying sink、`getWriter` 与 `ready` 背压钩子，以及 `TransformStream` 如何用 transform/flush 插进管道——[WritableStream 与 TransformStream](./writable-transform)。
