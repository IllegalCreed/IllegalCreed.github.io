---
layout: doc
---

# 跨上下文通信

跨上下文通信（cross-context messaging）是**浏览器里多个执行环境之间安全交换数据**的一组标准 API。一个页面往往同时存在主文档、`<iframe>`、`window.open` 弹窗、Web Worker、以及同源的多个标签页——它们各有独立的全局对象与事件循环，不共享变量，唯一的桥梁就是「传消息」。本叶把这组机制讲透，共四件：**`window.postMessage`**（跨文档 / 跨源点对点，`<iframe>` 与弹窗通信的基石，也是头号安全面）、**`MessageChannel` / `MessagePort`**（建一条专属双向管道、把 port 转移出去做直连）、**`BroadcastChannel`**（同源多上下文一对多广播，登出同步 / 主题切换的首选）、以及 **Web Locks**（`navigator.locks`，不是传消息而是**跨标签页协调与选主**）。规范上前三者都定义在 **WHATWG HTML 现行标准的「Web messaging」章**，`postMessage` 与通道消息自 2015 年起即 Baseline、`BroadcastChannel` 于 2022-03 进入 Baseline Widely available；**Web Locks 是独立的 W3C 规范**，同样 2022-03 起 Baseline（仅安全上下文）。

多标签页同步还有几条相邻路线只在本叶**点到并对比、不展开 API**：跨文档广播的 **storage 事件**属于 [Web Storage 叶](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events)、多页共享单实例的 **`SharedWorker`** 属于 [Web Workers 叶](/zh/web-advanced/web-api/web-workers/guide-line/shared-worker)、充当网络代理并可转发消息的 **Service Worker** 属于 [Service Worker 与 PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)——它们的完整用法各回各叶，本叶只在选型对比里引用。

## 评价

**优点**

- **`postMessage` 是跨源协作的唯一合法通道**：同源策略把 `<iframe>`、弹窗、跨源窗口的直接访问全部封死，`postMessage` + 结构化克隆是它们之间传数据的标准出口，第三方嵌入（支付、登录、地图、编辑器）全靠它
- **结构化克隆免手写序列化**：对象 / `Date` / `Map` / `Set` / `ArrayBuffer` / `Blob` 原样进出，比 `JSON.stringify` 表达力强，还能用 Transferable 把大 `ArrayBuffer`、`MessagePort`、`ImageBitmap` **零拷贝移交**
- **`MessageChannel` 给出私有直连**：两个上下文用一条专属管道点对点通信，可绕开「所有 message 都撞在同一个 `window.onmessage`」的拥挤，还能把一端 port 交给 Worker / `<iframe>` 建立不经主线程中转的直连
- **`BroadcastChannel` 让多标签页同步变成三行代码**：同源所有标签页 / Worker 连到同名频道即互通，登出、主题、购物车这类「一处改、处处变」的同步一句 `postMessage` 搞定，且**天然不回发给自己**，省掉最常见的回声判重
- **Web Locks 补上「协调」这一环**：多标签页选主（只让一个标签页跑同步 / 轮询 / WebSocket）用「永不 resolve 的锁 = 一直持有」一招优雅解决，异常关闭自动释放，比自造 storage 心跳锁健壮得多

**局限**

- **`postMessage` 安全是重灾区**：发送端 `targetOrigin` 用 `*` 传敏感数据会被恶意站点截获、接收端不校验 `event.origin` 直接吃数据 = 自开 XSS 大门——这两点是最常见、后果最严重的错误（详见 [postMessage 页](./guide-line/postmessage)）
- **全是异步消息、无请求 / 响应语义**：底层只有「发出去」和「收到」，想要「问一句等回答」得自己配 id 匹配、超时、错误回传；`MessagePort` 也一样，请求响应模式要手搭（或上 Comlink 之类的 RPC 封装）
- **`MessagePort` 的 `start()` 反直觉**：用 `addEventListener("message")` 挂监听后**必须显式 `port.start()`** 才会收消息，只有 `onmessage = ` 赋值才隐式启动——漏掉 `start()` 是「代码没错却一条都收不到」的经典坑
- **`BroadcastChannel` 无身份、无协议**：消息不带发送者标识、不定义任何语义，谁发的、是什么类型全得自带字段（`senderId` / `type`）约定；且被**存储分区**约束，跨顶级站点的同源上下文并不互通
- **能力边界要认清**：`postMessage` / `BroadcastChannel` 都受结构化克隆约束（函数、DOM 节点、类方法传不了）；Web Locks 只做协调不传数据，且仅在 HTTPS 安全上下文可用

一句话选型：**跨源 / 跨文档（`<iframe>`、弹窗、Worker）点对点传数据用 `postMessage`；要一条私有双向管道、或把通信端交给 Worker / 子框架直连用 `MessageChannel`；同源多标签页一对多广播（登出、主题、数据失效）用 `BroadcastChannel`；多标签页里「只让一个干活」的选主与互斥用 Web Locks**。storage 事件是 `BroadcastChannel` 未普及年代的老方案、`SharedWorker` 适合需要共享长连接 / 集中状态的场景、Service Worker 转发适合要跨页 + 后台一起触达——三者只在[多标签页方案页](./guide-line/multi-tab-patterns)对比取舍。

## 本叶地图

- [入门](./getting-started) —— 什么是「跨上下文」、四类场景（`<iframe>` / `window.open` 弹窗 / Worker / 多标签）、四机制定位与选型、第一个 `postMessage` 闭环、与相邻叶的分工
- [window.postMessage](./guide-line/postmessage) —— 跨源点对点、**`targetOrigin` 不能用 `*` 传敏感数据**、**接收端必校验 `event.origin`（头号安全点）**、`event.source` 用于安全回复而非身份校验、`iframe.contentWindow` 与 `window.opener` 通信、结构化克隆与 transfer、XSS 风险清单
- [MessageChannel 与 MessagePort](./guide-line/message-channel) —— `new MessageChannel()` 两 port、`postMessage` / `onmessage`、**`port.start()` 显式 vs `onmessage` 隐式（`addEventListener` 必须显式 start）**、把 port 转移给 `<iframe>` / Worker 建直连、端口只属一个上下文（转移后原持有失效）、`close`
- [BroadcastChannel](./guide-line/broadcast-channel) —— 同源多上下文一对多广播、**不回发给发送者自己**、**无 sender 标识需自带 `senderId`**、`close`、全浏览器 Baseline、vs storage 事件 / vs `SharedWorker`、典型场景（登出同步、主题切换）
- [多标签页方案与选主](./guide-line/multi-tab-patterns) —— 方案对比（`BroadcastChannel` 首选 / storage 事件 / `SharedWorker` / Service Worker 转发）、**Web Locks 选主**（`navigator.locks.request`、永不 resolve 的锁 = 持有权、`exclusive` / `shared`、`ifAvailable` / `steal` / `signal`）、选型决策表
- [参考](./reference) —— 四机制接口速查、postMessage 安全清单、MessagePort 方法表、机制对比表、多标签页选型、易错点清单、权威链接

## 文档地址

[MDN Channel Messaging API](https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API)（另见 [Window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)、[Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)、[Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)）

## GitHub 地址

[whatwg/html](https://github.com/whatwg/html)（跨文档消息 / 通道消息 / 广播频道均定义在 HTML 现行标准的「Web messaging」章；Web Locks 见 [w3c/web-locks](https://github.com/w3c/web-locks)）

## 幻灯片地址

<a href="/SlideStack/cross-context-messaging-slide/" target="_blank">跨上下文通信</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=跨上下文通信" target="_blank" rel="noopener noreferrer">跨上下文通信 测试题</a>
