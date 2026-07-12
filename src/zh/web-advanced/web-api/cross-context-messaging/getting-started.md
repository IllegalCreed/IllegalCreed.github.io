---
layout: doc
outline: [2, 3]
---

# 入门：跨上下文场景与四机制定位

> 基于 WHATWG HTML（跨文档消息 / 通道消息 / 广播频道）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：浏览器里主文档、`<iframe>`、`window.open` 弹窗、Web Worker、同源多标签页各有独立全局与事件循环，**不共享变量**，只能靠「传消息」通信；本叶讲这组标准 API。
- **四类场景**：① 主页 ↔ `<iframe>`（嵌入第三方 / 被第三方嵌入）② 主页 ↔ `window.open` 弹窗（`window.opener` 反向）③ 主页 ↔ Worker ④ 同源多个标签页 / 窗口互相同步。
- **四种机制**：`window.postMessage`（跨文档 / 跨源点对点）· `MessageChannel` / `MessagePort`（专属双向管道 + 端口转移）· `BroadcastChannel`（同源一对多广播）· **Web Locks**（`navigator.locks`，不是传消息而是协调 / 选主）。
- **`postMessage` 一句话**：`目标window.postMessage(数据, targetOrigin, [transfer])`，接收端 `window.addEventListener("message", ...)`；跨源可用，是 `<iframe>` / 弹窗通信基石。
- **两条安全铁律**（详见 [postMessage 页](./guide-line/postmessage)）：发送端 **`targetOrigin` 别用 `*` 传敏感数据**；接收端 **必须先校验 `event.origin`** 再处理，还要校验消息结构（防 XSS）。
- **`event.source`**：指向发消息的那个 `window`，**用来安全回复**（`event.source.postMessage(...)`），**不是身份凭证**——身份看 `origin`。
- **`MessageChannel`**：`new MessageChannel()` 得 `port1` / `port2` 一对；一端留用、另一端用 transfer 交给 `<iframe>` / Worker，建立一条私有直连管道。
- **`port.start()` 坑**：用 `addEventListener("message")` 收消息**必须显式 `port.start()`**；只有 `port.onmessage = ` 赋值才隐式启动（详见 [MessageChannel 页](./guide-line/message-channel)）。
- **`BroadcastChannel`**：`new BroadcastChannel("名字")` → `bc.postMessage(x)` 广播给**同源所有**连到同名频道的上下文；**不回发给自己**、消息**不带发送者标识**。
- **Web Locks 选主**：`navigator.locks.request("名", async () => { /* 持锁期间不 resolve 就一直持有 */ })`——多标签页里只让一个拿到锁 = leader，做同步 / 轮询的唯一执行者。
- **能传什么**：`postMessage` / `BroadcastChannel` 走**结构化克隆**（对象 / `Date` / `Map` / `ArrayBuffer` / `Blob` 可，函数 / DOM 节点不可）；大 `ArrayBuffer` / `MessagePort` / `ImageBitmap` 可用 transfer 零拷贝。
- **选型速记**：跨源 / 跨文档点对点 → `postMessage`；要私有管道 / 交端口给 Worker → `MessageChannel`；同源多标签广播 → `BroadcastChannel`；多标签「只让一个干活」→ Web Locks。
- **Baseline**：`postMessage` 与通道消息自 2015-09 起 Baseline；`BroadcastChannel` 与 Web Locks 自 2022-03 起 Baseline Widely available（Web Locks **仅安全上下文 HTTPS**）。
- **相邻叶只对比不展开**：storage 事件 → [Web Storage 叶](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events)；`SharedWorker` → [Web Workers 叶](/zh/web-advanced/web-api/web-workers/guide-line/shared-worker)；Service Worker 转发 → [Service Worker 叶](/zh/web-advanced/web-api/service-worker-pwa/)。
- **进阶顺序**：本页 → [postMessage](./guide-line/postmessage) → [MessageChannel](./guide-line/message-channel) → [BroadcastChannel](./guide-line/broadcast-channel) → [多标签页方案与选主](./guide-line/multi-tab-patterns) → [参考](./reference)。

## 一、本叶与相邻内容的分工

「跨上下文通信」在本站分本叶自身 + 三条相邻路线，各管一段：

| 问题 | 去哪读 |
| --- | --- |
| **跨源 / 跨文档点对点、私有管道、同源广播、多标签选主** | **本叶** |
| 同步 KV + 跨文档 storage 事件（老式多标签同步） | [Web Storage 叶：API 与事件](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events) |
| 多页共享单实例后台线程（`SharedWorker`） | [Web Workers 叶：SharedWorker](/zh/web-advanced/web-api/web-workers/guide-line/shared-worker) |
| 网络代理型 worker、可跨页转发（Service Worker） | [Service Worker 与 PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/) |

本叶聚焦四件标准 API：`window.postMessage`、`MessageChannel` / `MessagePort`、`BroadcastChannel`、Web Locks。storage 事件、`SharedWorker`、Service Worker 只在[多标签页方案页](./guide-line/multi-tab-patterns)作为**同步方案对比**点到并链接，不重复它们的完整 API。

## 二、什么是「跨上下文」：一页之内的多个执行环境

一个网页运行时往往不止一个 JavaScript 执行环境。它们**各有独立的全局对象和事件循环，内存互不相通**——一个环境里的变量另一个环境读不到，唯一的通信手段就是「传消息」：

- **主文档窗口**：页面本体。
- **`<iframe>` 子框架**：嵌入的另一份文档，可能同源也可能跨源（第三方支付、登录、地图、富文本编辑器都是跨源 `<iframe>`）。
- **`window.open` 弹窗 / 新窗口**：被打开的窗口有 `window.opener` 指回打开它的窗口。
- **Web Worker**：后台线程，无 DOM，与主线程只能靠 `postMessage`（这条线的编程细节在 [Web Workers 叶](/zh/web-advanced/web-api/web-workers/)，本叶讲的是通信机制本身）。
- **同源的多个标签页 / 窗口**：用户开了好几个你的站点页面，它们之间要同步登录态、主题、数据。

同源策略（same-origin policy）把「跨源直接读对方变量 / DOM」这条路彻底堵死；哪怕同源，跨标签页也没有共享内存。所以浏览器提供了一组**受控的消息通道**，让这些环境在**明确知道对方是谁**的前提下安全交换数据。

## 三、四种机制，各占一个生态位

| 机制 | 拓扑 | 跨源？ | 典型场景 | Baseline |
| --- | --- | --- | --- | --- |
| `window.postMessage` | 点对点（窗口 ↔ 窗口 / `<iframe>` / 弹窗 / Worker） | **可跨源** | 与第三方 `<iframe>`、`window.open` 弹窗通信 | 2015 起 |
| `MessageChannel` / `MessagePort` | 点对点专属管道（可把一端转移出去） | 随宿主（转移到跨源 `<iframe>` 也可） | 建私有双向通道、Worker 直连、RPC 底座 | 2015-09 起 |
| `BroadcastChannel` | 一对多广播 | **仅同源**（同存储分区） | 多标签页同步：登出、主题、数据失效 | 2022-03 起 |
| Web Locks（`navigator.locks`） | 协调 / 选主（不传数据） | 仅同源 | 多标签页选主（只让一个跑同步 / 轮询） | 2022-03 起（仅 HTTPS） |

一句话记住它们的分工：

- **要跨源、点对点**——只有 `postMessage` 能跨过同源策略，`<iframe>` 与弹窗通信必用它。
- **要一条私有双向管道**（不想所有消息都挤在 `window.onmessage`，或想把通信端交给 Worker / 子框架自己收发）——用 `MessageChannel`，它本质是「两个用管道连起来的 `MessagePort`」。
- **要一处改、同源处处变**——用 `BroadcastChannel`，一句 `postMessage` 广播给所有同源标签页 / Worker。
- **要「多个标签页里只让一个干活」**——用 Web Locks 做选主（leader election），这不是传消息，是**协调**。

## 四、第一个闭环：主页与 `<iframe>` 用 postMessage 通信

一个可直接运行的最小例子——父页面向 `<iframe>` 发消息，`<iframe>` 校验来源后回复：

```html
<!-- 父页面 parent.html（源 https://parent.example） -->
<iframe id="child" src="https://child.example/child.html"></iframe>
<script>
  const iframe = document.getElementById("child");

  // 等子框架加载完再发，否则对方还没挂监听
  iframe.addEventListener("load", () => {
    // 第二参数是 targetOrigin：明确写子框架的源，绝不用 "*"
    iframe.contentWindow.postMessage(
      { type: "greet", text: "你好，子框架" },
      "https://child.example",
    );
  });

  // 接收子框架的回复
  window.addEventListener("message", (event) => {
    // 头号安全点：先校验来源，非白名单直接丢弃
    if (event.origin !== "https://child.example") return;
    console.log("父页面收到回复：", event.data);
  });
</script>
```

```html
<!-- 子框架 child.html（源 https://child.example） -->
<script>
  window.addEventListener("message", (event) => {
    // 同样先校验来源：只信任已知父页面
    if (event.origin !== "https://parent.example") return;

    console.log("子框架收到：", event.data);

    // event.source 指向父窗口，用它安全回复；event.origin 回填 targetOrigin
    event.source.postMessage(
      { type: "greet-ack", text: "收到，子框架已就绪" },
      event.origin,
    );
  });
</script>
```

这段代码已经浓缩了跨上下文通信最核心的四件事，第一次接触就该记住：

- **发送**：`目标window.postMessage(数据, targetOrigin)`——目标窗口的引用（这里是 `iframe.contentWindow`）+ 明确的 `targetOrigin`。
- **接收**：给自己的 `window` 挂 `message` 监听，数据在 `event.data`。
- **安全**：发送端 `targetOrigin` 写死对方的源（不用 `*`）；接收端**先 `if (event.origin !== 期望源) return;`** 再处理——这是整套 API 最重要的一行。
- **回复**：用 `event.source`（对方 `window` 的引用）加 `event.origin`（对方的源）回消息，天然打到正确的对端。

安全细节、`window.opener` 弹窗方向、结构化克隆与 transfer、XSS 风险清单，全部展开在 [window.postMessage 页](./guide-line/postmessage)。

## 五、如何选：一张决策图

面对一个具体需求，按这个顺序问自己：

1. **对端是跨源的 `<iframe>` / 弹窗 / 跨源窗口吗？** → 只能用 **`postMessage`**（唯一能跨源的机制）。若要在其上建**私有双向管道**（避免消息混在同一个 `window.onmessage`、或让 Worker / 子框架自己收发），再叠一层 **`MessageChannel`**：用一次 `postMessage` 把 `port2` 转移过去，之后两端各用自己的 port 直连。
2. **对端是 Web Worker 吗？** → Worker 本身就用 `postMessage`（见 [Web Workers 叶](/zh/web-advanced/web-api/web-workers/)）；要多路复用或结构化 RPC，用 **`MessageChannel`** 建独立通道。
3. **要把一件事同步给同源的所有标签页 / 窗口吗？**（登出、切主题、购物车变化、缓存失效） → **`BroadcastChannel`**，一对多广播、不回发给自己、三行代码。
4. **要在多个标签页里选出「唯一负责人」吗？**（只让一个标签页连 WebSocket / 跑轮询 / 做后台同步） → **Web Locks** 选主：所有标签页抢同名锁，拿到的当 leader，用「永不 resolve 的回调」一直持有。
5. **只是想兼容很老的浏览器做多标签同步？** → 老式 **storage 事件** 兜底（见 [Web Storage 叶](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events)），但 2022 年后 `BroadcastChannel` 已 Baseline，新项目首选它。

下一页从最基础也最危险的一件讲起——[window.postMessage](./guide-line/postmessage)，跨源通信与它的两条安全铁律。
