---
layout: doc
outline: [2, 3]
---

# 参考：四机制速查 / 安全清单 / 选型

> 基于 WHATWG HTML（跨文档消息 / 通道消息 / 广播频道）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **四机制**：`window.postMessage`（跨源点对点）· `MessageChannel`/`MessagePort`（私有双向管道 + 端口转移）· `BroadcastChannel`（同源一对多广播）· Web Locks（协调 / 选主，非传消息）。
- **postMessage 发**：`目标window.postMessage(msg, targetOrigin, transfer?)`；`targetOrigin` **精确写对方源、别用 `*` 传敏感数据**。
- **postMessage 收**：`window.addEventListener("message", e => ...)`；**先校验 `e.origin`**（头号安全点）再校验 `e.data` 结构；`e.source` 回复用、非身份；`e.ports` 取转移来的 port。
- **MessageChannel**：`const { port1, port2 } = new MessageChannel()`；`port.postMessage(d, transfer?)` / `port.onmessage`；**`addEventListener` 必须 `port.start()`，`onmessage=` 隐式 start**。
- **端口转移**：`window`：transfer 是**第三**参数；`Worker`：transfer 是**第二**参数；对端从 `event.ports[0]` 取；**转移后原 port 失效（neutered）**。
- **BroadcastChannel**：`new BroadcastChannel("名")` → `bc.postMessage(d)`；**同源同分区**、**不回发给自己**、**无 sender 标识**、`bc.close()`。
- **Web Locks**：`navigator.locks.request(name, opts?, cb)`；锁在**回调返回时释放**，**回调返 永不 resolve 的 Promise = 一直持有（选主）**。
- **Web Locks opts**：`mode`（`exclusive` 默认 / `shared`）、`ifAvailable`（拿不到不等、回调收 `null`）、`steal`（抢占）、`signal`（`AbortSignal` 超时）。
- **能传什么**：postMessage / port / BroadcastChannel 均**结构化克隆**（函数 / DOM 节点不可）；postMessage 与 port 支持 **transfer 零拷贝**，BroadcastChannel **不支持 transfer**。
- **跨源**：只有 `postMessage` 能跨源；`MessageChannel` 随宿主（可转移到跨源 `<iframe>`）；`BroadcastChannel` / Web Locks **仅同源**。
- **Baseline**：postMessage / 通道消息 2015 起；`BroadcastChannel` / Web Locks 2022-03 起（Web Locks **仅 HTTPS 安全上下文**）。
- **多标签同步**：首选 `BroadcastChannel`；老浏览器兜底 storage 事件；共享状态 / 长连接用 `SharedWorker`；已用 SW 可 `clients.matchAll()` 转发。
- **多标签选主**：Web Locks 竞选唯一 leader + `BroadcastChannel` 分发结果 = 黄金搭档；异常关闭自动释放锁、follower 补位。
- **头号坑三连**：postMessage 不校验 `origin`（安全）/ `MessagePort` 漏 `start()`（收不到）/ 选主回调提前返回（leader 秒卸任）。
- **相邻叶只链接**：storage 事件 → [Web Storage 叶](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events)；`SharedWorker` → [Web Workers 叶](/zh/web-advanced/web-api/web-workers/guide-line/shared-worker)；Service Worker → [Service Worker 叶](/zh/web-advanced/web-api/service-worker-pwa/)。

## 一、四机制全景

| 机制 | 规范 | 拓扑 | 跨源 | 传输 | 典型用途 |
| --- | --- | --- | --- | --- | --- |
| `window.postMessage` | WHATWG HTML · Web messaging | 点对点（窗口 ↔ 窗口 / `<iframe>` / 弹窗 / Worker） | **可** | 结构化克隆 + transfer | 与第三方 `<iframe>` / `window.open` 弹窗通信 |
| `MessageChannel` / `MessagePort` | WHATWG HTML · Channel messaging | 点对点专属管道（端口可转移） | 随宿主 | 结构化克隆 + transfer（含转移 port） | 私有双向通道、Worker 直连、RPC 底座 |
| `BroadcastChannel` | WHATWG HTML · Broadcasting | 一对多广播 | **仅同源同分区** | 结构化克隆（**无 transfer**） | 多标签同步：登出 / 主题 / 数据失效 |
| Web Locks | W3C Web Locks API | 协调 / 选主（不传数据） | 仅同源 | —— | 多标签选主、互斥、读写者 |

## 二、window.postMessage 速查

| 项 | 说明 |
| --- | --- |
| 发送 | `目标window.postMessage(message, targetOrigin, transfer?)` 或 `postMessage(message, { targetOrigin, transfer })` |
| `message` | 结构化克隆；函数 / DOM 节点 / 类方法不可（`DataCloneError`） |
| `targetOrigin` | 接收方须匹配的源（scheme+host+port 全等）；省略默认 `"/"`（同源）；`data:` 等不透明源须 `"*"` |
| `transfer` | Transferable 列表（`ArrayBuffer` / `MessagePort` / `ImageBitmap` …）零拷贝移交，移交后本地失效 |
| 接收 | `window.addEventListener("message", handler)` |
| `event.data` | 数据副本 |
| `event.origin` | 发送窗口的源——**唯一可信身份依据** |
| `event.source` | 发送窗口引用——**回复用**（`event.source.postMessage(...)`），非身份 |
| `event.ports` | 随消息转移来的 `MessagePort` 数组 |

**目标窗口引用来源**：`iframe.contentWindow`（父→子）、`window.open()` 返回值（主→弹窗）、`window.opener`（弹窗→主）、`window.frames[i]`、`window.parent` / `window.top`、`event.source`（回复）。

## 三、postMessage 安全清单

- **发送端**：`targetOrigin` **精确写对方源，绝不用 `*` 传敏感数据**（恶意站点可改窗口位置截获）；只有 `data:` / 不透明源不得已才 `*`，且不传敏感数据。
- **接收端第一行**：`if (event.origin !== 期望源) return;`——非白名单一律丢弃；**不接收外站消息就干脆别挂 `message` 监听**（最彻底）。
- **验完来源再验结构**：校验 `event.data` 的类型 / 形状 / 字段，别把它塞进 `innerHTML` / `eval` / `new Function`——否则被信任站点的 XSS 传染成你的 XSS。
- **`event.source` 只当回信地址**：身份永远看 `origin`，不拿 `source` 当认证。
- **回复用 `event.source.postMessage(data, event.origin)`**：`origin` 回填 `targetOrigin`，天然打回正确对端。
- **`<iframe>` 握手**：父页面等 `<iframe>` `load` 再发首条，或让子框架先发 `ready`，避免消息丢失。
- **`SharedArrayBuffer` 跨源**：需 `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`，`crossOriginIsolated === true`。

## 四、MessagePort 方法与事件

| 成员 | 说明 |
| --- | --- |
| `postMessage(message, transfer?)` | 经该端口发消息；**无 `targetOrigin`**；支持 transfer（含再转移 port） |
| `start()` | 启用端口消息队列；**用 `addEventListener` 时必须显式调用**，**`onmessage=` 赋值时隐式调用** |
| `close()` | 断开端口、停止收发、利于回收 |
| `onmessage` / `message` 事件 | 收消息，数据在 `event.data`；赋 `onmessage` 隐式 `start()` |
| `onmessageerror` / `messageerror` 事件 | 收到无法反序列化（结构化克隆失败）的消息 |

**`start()` 判定表**：

| 监听方式 | 是否需手动 `start()` |
| --- | --- |
| `port.onmessage = fn` | **否**（隐式启用队列） |
| `port.addEventListener("message", fn)` | **是**（`port.start()`，否则一条都收不到且不报错） |

**端口转移规则**：`MessagePort` 是 Transferable；`window.postMessage(msg, targetOrigin, [port])`（第三参数）或 `worker.postMessage(msg, [port])`（第二参数）转移；对端 `event.ports[0]` 取；**转移后原持有者立即 neutered**；可多次接力转移，同一时刻仅一个活跃持有者。

## 五、BroadcastChannel 速查

| 成员 | 说明 |
| --- | --- |
| `new BroadcastChannel(name)` | 连接 / 创建同名频道；参数仅频道名 |
| `postMessage(data)` | 广播给同源同分区所有**其他**订阅者；结构化克隆；**无 transfer** |
| `onmessage` / `message` 事件 | 收广播，数据在 `event.data` |
| `onmessageerror` / `messageerror` 事件 | 收到无法反序列化的消息 |
| `close()` | 断开与频道的连接、允许回收 |
| `name` | 只读，频道名 |

**两条定义性特征**：① **发送者收不到自己发的消息**（WHATWG「Remove source from destinations」）——本页要立即生效的状态须自己手动应用再广播；② **消息无发送者标识、无语义**——payload 自带 `type` / `senderId`。**范围**：仅同源且同存储分区。

## 六、Web Locks 速查

| API | 说明 |
| --- | --- |
| `navigator.locks.request(name, cb)` | 请求锁；拿到后调 `cb(lock)`；**`cb` 返回（或其 Promise resolve）时释放** |
| `navigator.locks.request(name, options, cb)` | 带选项版 |
| `navigator.locks.query()` | 返回锁状态快照 `{ held, pending }`（name / mode / clientId），调试用 |

| 选项 | 取值 / 含义 |
| --- | --- |
| `mode` | `"exclusive"`（默认，同名仅一个持有）/ `"shared"`（可多个同时持有，读写者的「读」） |
| `ifAvailable` | `true`：不能立即授予就**不排队**，`cb` 以 `null` 调用 |
| `steal` | `true`：释放同名已持有锁并抢占授予、绕过排队（慎用，会打断原持有者） |
| `signal` | `AbortSignal`：中止锁请求，配 `setTimeout` 做超时（中止时 reject `AbortError`） |

**选主范式**：`request(name, cb)` 里 `cb` 返回 `new Promise(() => {})`（永不 resolve）= 一直持锁 = 一直是 leader；本页关闭 / 崩溃锁**自动释放**，排队者补位。**限制**：仅安全上下文（HTTPS，`localhost` 视作安全）+ Worker；作用域限同源。

## 七、机制对比

| 维度 | postMessage | MessageChannel | BroadcastChannel | Web Locks |
| --- | --- | --- | --- | --- |
| 拓扑 | 点对点 | 点对点专线 | 一对多广播 | 协调 / 选主 |
| 跨源 | ✅ | 随宿主 | ❌ 仅同源 | ❌ 仅同源 |
| 收自己发的 | 视对端 | 视对端 | **❌ 不回发** | —— |
| 传数据 | 克隆 + transfer | 克隆 + transfer | 克隆（无 transfer） | 不传数据 |
| 需校验来源 | **✅ `origin`** | 转移那次需 | 同源天然 | —— |
| 招牌坑 | 不校验 `origin` | 漏 `start()` | 以为收自己发的 | 回调提前返回丢 leader |
| Baseline | 2015 起 | 2015-09 起 | 2022-03 起 | 2022-03 起（HTTPS） |

## 八、多标签页选型

| 需求 | 首选 | 备选 / 兜底 |
| --- | --- | --- |
| 同步状态（登出 / 主题 / 数据失效） | **`BroadcastChannel`** | storage 事件（老浏览器）· SW 转发（已用 SW） |
| 共享一份状态 / 一条长连接 | **`SharedWorker`** | Web Locks 选主 + 普通 Worker + 广播 |
| 只让一个标签页干活（连 WS / 轮询 / 同步） | **Web Locks 选主** | —— |
| 选主 + 把成果发给全体 | **Web Locks + `BroadcastChannel`** | `SharedWorker` 集中 + 广播 |
| 跨源（`<iframe>` / 弹窗）传数据 | **`postMessage`** | `postMessage` + `MessageChannel` 建专线 |

## 九、易错点清单

- **postMessage `targetOrigin` 用 `*` 传敏感数据**：可被截获——写死对方源。
- **接收端不校验 `event.origin`**：任何窗口都能发消息——第一行 `if (event.origin !== 期望源) return;`。
- **`event.data` 直接进 `innerHTML` / `eval`**：XSS 传染——校验结构 + 白名单 / 转义。
- **拿 `event.source` 当身份**：只是回信地址——身份看 `origin`。
- **`<iframe>` 未 `load` 就发消息**：监听未就绪、丢失——等 `load` 或 `ready` 握手。
- **`MessagePort` 用 `addEventListener` 漏 `port.start()`**：一条都收不到、不报错——补 `start()` 或改 `onmessage=`。
- **转移后仍用原 port / `ArrayBuffer`**：已 neutered / `byteLength` 0——转移前发完，转移后用新宿主的。
- **对端不从 `event.ports[0]` 取 port**：port 不在 `data` 里——在 `ports`。
- **给 `port.postMessage` 传 `targetOrigin`**：port 版第二参数是 transfer——`targetOrigin` 只属 `window.postMessage`。
- **以为 `BroadcastChannel` 收自己发的**：不会——本页状态自己手动应用再广播。
- **`BroadcastChannel` 消息不带 `type` / `senderId`**：无语义无身份——payload 自带。
- **指望 `BroadcastChannel` 跨源 / 到没开的页 / transfer 大对象**：仅同源存活上下文、无 transfer——跨源用 postMessage、持久化用存储、大对象用点对点。
- **选主回调写成会返回的 async**：锁一释放 leader 秒卸任——返回永不 resolve 的 Promise。
- **自造 `localStorage` 心跳锁做选主**：时钟 / 死锁 / 僵尸持有者——用 Web Locks（异常自动释放）。
- **HTTP 页用 Web Locks**：仅安全上下文——线上 HTTPS（`localhost` 例外）。
- **滥用 Web Locks `steal`**：打断原持有者临界区——仅确诊卡死时用。
- **用 storage 事件当通用广播**：只字符串、写入页不触发、要读回值——新项目用 `BroadcastChannel`。

## 十、权威链接

- [MDN: Window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) —— 方法、安全警告、`event.origin` / `source` 原文
- [MDN: Channel Messaging API](https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API) ｜ [Using channel messaging](https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API/Using_channel_messaging) —— 通道消息教程
- [MDN: MessagePort](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) —— `postMessage` / `start()` / `close()`（`start()` 仅 `addEventListener` 需要的原文）
- [MDN: Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) ｜ [BroadcastChannel.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel/postMessage) —— 广播、同分区、无语义
- [MDN: Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) ｜ [LockManager.request](https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request) —— 选主、mode / ifAvailable / steal / signal
- [WHATWG HTML: Web messaging](https://html.spec.whatwg.org/multipage/web-messaging.html) —— 规范原文（`postMessage` 算法「Remove source from destinations」、端口队列 `start` 语义）
- [W3C: Web Locks API](https://w3c.github.io/web-locks/) ｜ [w3c/web-locks](https://github.com/w3c/web-locks) —— Web Locks 规范与仓库
- 本站相邻内容：[Web Storage 叶 · API 与事件（storage 事件）](/zh/web-advanced/web-api/web-storage/guide-line/api-and-events) ｜ [Web Workers 叶 · SharedWorker](/zh/web-advanced/web-api/web-workers/guide-line/shared-worker) ｜ [Web Workers 叶 · Comlink 模式](/zh/web-advanced/web-api/web-workers/guide-line/patterns-comlink) ｜ [Service Worker 与 PWA 叶](/zh/web-advanced/web-api/service-worker-pwa/)
