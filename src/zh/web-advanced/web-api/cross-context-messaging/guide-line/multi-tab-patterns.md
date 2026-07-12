---
layout: doc
outline: [2, 3]
---

# 多标签页方案与选主：从广播到 Web Locks

> 基于 WHATWG HTML（跨文档消息 / 通道消息 / 广播频道）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **两类需求**：① **同步**——一处改、同源多标签页处处变（登出 / 主题 / 数据失效）；② **选主 / 互斥**——多标签页里只让**一个**干活（连 WebSocket / 跑轮询 / 后台同步）。前者用广播，后者用 Web Locks。
- **同步首选 `BroadcastChannel`**：同源一对多、不回发给自己、2022 起 Baseline——新项目多标签同步的默认选择（详见 [BroadcastChannel 页](./broadcast-channel)）。
- **storage 事件**：`localStorage` 变更广播、**仅字符串**、**写入页自身不触发**、需读回值；老浏览器兜底方案，API 属 [Web Storage 叶](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events)。
- **`SharedWorker`**：多页共享**单实例**后台线程，可持共享状态 / 单一长连接，天然「一份连接多页复用」；Safari 支持历史曲折，用前核对——API 属 [Web Workers 叶](/zh/web-advanced/web-api/web-workers/guide-line/shared-worker)。
- **Service Worker 转发**：一个网络代理服务多页，可用 `clients.matchAll()` 向所有受控页 `postMessage` 转发——API 属 [Service Worker 叶](/zh/web-advanced/web-api/service-worker-pwa/)。
- **Web Locks 选主（本页核心）**：`navigator.locks.request(name, callback)`——同源多标签抢同名锁，只有一个拿到 = leader。
- **永不 resolve = 一直持有**：锁在**回调返回时**释放；回调返回一个**永不 resolve 的 Promise**，就一直持有锁 = 一直当 leader（选主经典写法）。
- **`mode`**：`"exclusive"`（默认，同名只能一个持有）/ `"shared"`（可多个同时持有，读写者模式的「读」）。
- **`ifAvailable`**：拿不到锁**不排队**，回调立即以 `null` 调用——用来「抢不到就算了 / 我不是 leader」。
- **`steal`**：抢占——释放同名已持有的锁、把它夺过来，并绕过排队；用于 leader 卡死时强制换主（慎用）。
- **`signal`**：传 `AbortSignal`，可给锁请求做**超时 / 取消**（`AbortController` + `setTimeout`）。
- **`navigator.locks.query()`**：快照当前源的锁状态（held / pending + mode），调试选主用。
- **安全上下文**：Web Locks **仅 HTTPS（安全上下文）+ Worker** 可用；作用域限**同源**。
- **选主 + 广播组合拳**：Web Locks 选出唯一 leader（连 WebSocket / 轮询），leader 用 `BroadcastChannel` 把结果分发给其余标签页——多标签页架构的黄金搭档。
- **异常自动释放**：持锁标签页崩溃 / 关闭，锁自动释放，其他等待者顺位补位——比自造 storage 心跳锁健壮得多。
- **Baseline**：`BroadcastChannel` 与 Web Locks 均 2022-03 起 Baseline Widely available。

## 一、先分清两类需求

「多标签页」下其实混着两个不同问题，别用一把锤子砸所有钉子：

1. **同步（fan-out 状态）**：一个标签页发生了变化，要让**同源所有**标签页跟上——登出、切主题、购物车更新、后台数据变了通知各页刷新。这是**广播**问题。
2. **选主 / 互斥（single-owner）**：一件事**只该有一个标签页做**——只连一条 WebSocket、只跑一份轮询、只让一个页做 IndexedDB 与网络的后台同步，避免 N 个标签页各连各的、各写各的。这是**协调 / 选主**问题。

同步问题的首选是 `BroadcastChannel`（上一页讲透）；选主问题的利器是 **Web Locks**（本页重点）。两者常组合使用。

## 二、同步方案横向对比

| 方案 | 机制 | 数据类型 | 触发发送者自己 | 兼容 / Baseline | 何时选 |
| --- | --- | --- | --- | --- | --- |
| **`BroadcastChannel`** | 同源广播总线 | 任意结构化克隆 | **否**（不回声） | 2022-03 起 | **默认首选**：纯同步、代码最短 |
| **storage 事件** | `localStorage` 变更广播 | **仅字符串** | **否**（写入页不触发） | 很老亦支持 | 需兼容老旧浏览器时的兜底 |
| **`SharedWorker`** | 多页共享单实例后台 | postMessage | 由你的逻辑决定 | 主流支持（Safari 曲折） | 需**共享状态 / 单一长连接** |
| **Service Worker 转发** | 网络代理向受控页广播 | postMessage | 由你的逻辑决定 | 主流支持（需 HTTPS） | 已用 SW、要**跨页 + 后台**统一触达 |

选择路径：

- **只是同步状态** → `BroadcastChannel`。要兼容到很老的浏览器，退回 **storage 事件**（记住它只传字符串、且写入页自己不触发、要从 `event.newValue` 读回值——细节在 [Web Storage 叶](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events)）。
- **要在多页间共享一份状态或一条长连接** → `SharedWorker`：所有页连到同一个后台实例，状态集中在 worker 里，一条 WebSocket 多页复用（API 见 [Web Workers 叶](/zh/web-advanced/web-api/web-workers/guide-line/shared-worker)）。
- **已经在用 Service Worker、想让后台事件（推送 / 同步）同时通知所有打开的页** → Service Worker 里 `clients.matchAll()` 遍历受控页 `postMessage`（API 见 [Service Worker 叶](/zh/web-advanced/web-api/service-worker-pwa/)）。

## 三、Web Locks：多标签页选主

`BroadcastChannel` 解决「广播」，但解决不了「**谁负责发**」。如果每个标签页都连一条 WebSocket、都跑一份轮询，就是 N 倍浪费和数据打架。**Web Locks** 让多个标签页协调出**唯一的负责人（leader）**。

### 3.1 基本形态：锁在回调期间持有

```js
navigator.locks.request("my_resource", async (lock) => {
  // 进到这里 = 已拿到锁（此刻同源没有别人持有 "my_resource"）
  await doSomething();
  await doSomethingElse();
  // 回调（async 函数）结束 → 锁自动释放
});
```

MDN 原义：锁在**回调返回时自动释放**，所以通常把回调写成 `async` 函数——它彻底跑完，锁才释放。作用域限**同源**：`https://example.com` 的锁与 `https://example.org:8080` 的锁互不影响。

### 3.2 选主经典写法：永不 resolve 的锁 = 一直当 leader

选主的诀窍是「**让回调永远不返回**」——回调返回一个**永不 resolve 的 Promise**，锁就一直被这个标签页持有，它就一直是 leader：

```js
/**
 * 竞选 leader：拿到锁的标签页成为唯一负责人，
 * 用一个永不 resolve 的 Promise 把锁一直攥在手里。
 */
function becomeLeaderThen(runAsLeader) {
  navigator.locks.request("app-leader", () => {
    // 只有一个标签页能进到这里 —— 它就是 leader
    runAsLeader(); // 连 WebSocket / 跑轮询 / 做后台同步

    // 返回永不 resolve 的 Promise：锁一直持有 = 一直是 leader；
    // 本页崩溃 / 关闭时锁【自动释放】，排队中的下一个标签页顺位补位。
    return new Promise(() => {});
  });
}

becomeLeaderThen(() => {
  const ws = new WebSocket("wss://push.example/stream");
  const bc = new BroadcastChannel("push");
  // leader 收到推送后，用广播分发给其余所有标签页
  ws.onmessage = (e) => bc.postMessage({ type: "push", data: e.data });
});
```

关键优势——**异常自动释放**：leader 标签页被关闭或崩溃，浏览器自动释放锁，正在 `request` 排队的其他标签页里会有一个立刻拿到锁、接任 leader。这比用 `localStorage` 自造「心跳锁 + 过期判定」健壮得多（自造锁要处理时钟、死锁、僵尸持有者一堆边界）。

### 3.3 `mode`：exclusive 与 shared

```js
// 默认 exclusive：同名锁同源只能一个持有
navigator.locks.request("sync", async () => { /* 独占 */ });

// shared：多个 shared 请求可同时持有 —— 读写者模式的「读」
navigator.locks.request("data", { mode: "shared" }, async () => {
  // 多个标签页可同时以 shared 持有，用于「多个读者并行」
});
```

MDN 原义：`"exclusive"` 只能有一个持有者（默认）；`"shared"` 可多个同时持有——用来实现**读者-写者（readers-writer）**模式：多个「读」持 shared 并行，「写」持 exclusive 独占，写等所有读释放。

### 3.4 `ifAvailable` / `steal` / `signal`：三个进阶选项

```js
// ifAvailable：拿不到不排队，回调立即以 null 调用 —— 「抢不到就当自己不是 leader」
navigator.locks.request("app-leader", { ifAvailable: true }, async (lock) => {
  if (lock === null) {
    // 没抢到：已有 leader，本页当 follower
    setupFollower();
    return;
  }
  // 抢到了：本页是 leader
  return new Promise(() => {});
});
```

```js
// signal：用 AbortSignal 给锁请求做超时 / 取消
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 3000); // 3 秒还没拿到就放弃
try {
  await navigator.locks.request("slow", { signal: controller.signal }, async () => {
    await heavyWork();
  });
} catch (err) {
  if (err.name === "AbortError") console.warn("等锁超时，已放弃");
} finally {
  clearTimeout(timer);
}
```

```js
// steal：抢占 —— 释放同名已持有的锁并夺过来，绕过排队（用于 leader 卡死时强制换主）
navigator.locks.request("app-leader", { steal: true }, async (lock) => {
  // 慎用：会打断原持有者的临界区，可能破坏其一致性假设
  takeOverAsLeader();
});
```

三个选项（MDN 原义）：

- **`ifAvailable`**：锁不能立即授予就**不等待**，回调以 `null` 调用——「能拿则拿、拿不到就走另一条路」。
- **`steal`**：释放同名的已持有锁、抢占授予本请求，并**抢在排队请求前面**——用于原 leader 疑似卡死时强制夺权，代价是可能打断对方临界区。
- **`signal`**：传入 `AbortSignal`，可中止锁请求——常配 `setTimeout` 实现请求超时。

### 3.5 `navigator.locks.query()`：观测锁状态

```js
// 快照当前源的锁管理器状态：谁持有、谁在等、各是什么 mode —— 调试选主必备
const state = await navigator.locks.query();
console.log("已持有：", state.held); // [{ name, mode, clientId }, ...]
console.log("排队中：", state.pending);
```

`query()` 返回某一时刻的**快照**，用于调试「锁为什么拿不到」、观察 leader 归属。

## 四、组合拳：Web Locks 选主 + BroadcastChannel 分发

多标签页架构的黄金搭档——**用 Web Locks 选出唯一 leader，用 `BroadcastChannel` 把 leader 的成果广播给全体**：

```js
const bc = new BroadcastChannel("realtime");

// 每个标签页都参与竞选；只有 leader 真正连 WebSocket
navigator.locks.request("realtime-leader", { ifAvailable: true }, (lock) => {
  if (lock === null) {
    // follower：不连 WS，只等 leader 的广播
    bc.onmessage = (e) => applyRealtime(e.data);
    return; // 不持锁，立即返回
  }
  // leader：连唯一一条 WS，收到数据广播给所有标签页（含自己要 applyRealtime）
  const ws = new WebSocket("wss://push.example");
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    applyRealtime(data); // leader 自己也要用（广播不回发给自己）
    bc.postMessage(data); // 分发给其余标签页
  };
  return new Promise(() => {}); // 永不 resolve：持锁当 leader 直到本页关闭
});
```

这套组合解决了「N 个标签页各连各的」——**全站只有一条 WebSocket**（leader 持有），其余标签页零连接、纯靠广播消费；leader 挂了，某个 follower 竞选补位、接管连接。注意 leader 自己也要 `applyRealtime`，因为 `BroadcastChannel` **不回发给发送者自己**（见 [BroadcastChannel 页](./broadcast-channel)）。

## 五、易错点

- **用广播解决选主**：`BroadcastChannel` 只扩散、不决定「谁负责」——选主用 Web Locks。
- **忘了 leader 要自己消费**：广播不回发给自己——leader 产出的数据本页要手动 `apply` 再广播。
- **选主回调写成会返回的 async**：回调一返回锁就释放、leader 立刻卸任——持有期要用**永不 resolve 的 Promise**。
- **自造 `localStorage` 心跳锁**：要处理时钟漂移、僵尸持有者、死锁——Web Locks 的异常自动释放天然免这些坑。
- **在 HTTP 页用 Web Locks**：仅安全上下文（HTTPS）——本地 `localhost` 视作安全，线上必须 HTTPS。
- **滥用 `steal`**：会打断原持有者临界区、破坏一致性——仅在确诊 leader 卡死时用，优先靠异常自动释放换主。
- **不设超时地等 exclusive 锁**：可能长时间挂起——需要时用 `signal` + `AbortController` 加超时，或 `ifAvailable` 不等待。
- **storage 事件当通用广播**：只字符串、写入页不触发、要读回值——新项目用 `BroadcastChannel`，storage 事件仅老浏览器兜底（见 [Web Storage 叶](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events)）。
- **误以为 `SharedWorker` 到处能用**：Safari 支持历史曲折——用前核对目标浏览器，或用「Web Locks 选主 + 普通 Worker + 广播」替代。

下一页汇总四机制速查、安全清单与选型表——[参考](../reference)。
