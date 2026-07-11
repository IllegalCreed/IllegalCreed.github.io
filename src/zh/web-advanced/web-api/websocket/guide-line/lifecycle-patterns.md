---
layout: doc
outline: [2, 3]
---

# 页面生命周期与封装模式

> 基于 WHATWG WebSockets 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **必须显式 close**：`WebSocket` 不会自己关，也不会被 GC 提前回收——SPA 路由切换 / 组件卸载 / 离开页面都要主动 `close()`，否则连接常驻后台。
- **开着的连接挡 bfcache**：未关闭的 WebSocket 会阻止页面进入往返缓存（bfcache），导致前进 / 后退秒开失效。
- **bfcache 用 pagehide / pageshow**：`pagehide` 里 `close()` 断连、置 `null`；`pageshow` 里判 `event.persisted` 为真则**重建连接**（旧实例已作废，必须 `new`）。
- **别用 unload / beforeunload**：它们会**破坏 bfcache**；页面隐藏 / 离开一律用 `pagehide`。
- **visibilitychange 管前后台**：`document.visibilityState` 转 `hidden` 可暂停 / 断连省资源，转 `visible` 触发重连——切后台被杀连接的快速恢复点。
- **重连要 new 新实例**：`WebSocket` 走到 `CLOSED` 即作废、不可复用；重连封装的核心是「`onclose` → 排程 → `new WebSocket`」。
- **重连策略在网络章**：指数退避、随机抖动、`1006` 判据、`1000` 不重连、`navigator.onLine` 联动等**策略**见[网络章](/zh/base/network/net-realtime/guide-line/websocket-practice)；本叶只给浏览器侧**封装骨架**。
- **封装要点**：内部持有可替换的 `ws` 引用、集中挂 / 卸监听、暴露 `send` / `close`、维护「是否用户主动关」标志以决定要不要重连。
- **send 前判 readyState**：封装层 `send` 要么判 `OPEN`、要么在未连时入待发队列，避免 `CONNECTING` 态 `send` 抛 `InvalidStateError`。
- **Vue 封装**：`composable` + `onUnmounted` 里 `close()`；连接状态用 `ref` 暴露给模板。
- **React 封装**：`useEffect` 建连、**cleanup 函数里 `close()`**；`onmessage` 更新 `state`；注意 StrictMode 下开发期双挂载。
- **WebSocketStream 前沿**：`new WebSocketStream(url, { protocols, signal })`；`opened` Promise → `{ readable, writable, extensions, protocol }`；`closed` Promise → `{ closeCode, reason }`。
- **它用 Streams 天然背压**：`await reader.read()` / `await writer.write()` 收发都自动限速——补上标准 WebSocket 无背压的短板。
- **但非标准、仅 Chromium**：Chrome 124+ 实验特性，Firefox / Safari 无、未进标准轨道——用前 `if ("WebSocketStream" in window)` 特性检测，不作生产主线。
- **AbortSignal 建连即可取消**：`WebSocketStream` 构造传 `signal`，可在握手完成前中止连接——标准 `WebSocket` 没有这能力。

## 一、为什么生命周期是 WebSocket 的必修课

`WebSocket` 与 `fetch`、`EventSource` 有个本质区别：**它是一条持续占用资源的长连接**。浏览器不会替你在合适的时机断开它，而它的存在又会反过来影响页面本身的生命周期（尤其 bfcache）。因此「什么时候该关、切后台怎么办、离开页面怎么收尾」不是可选项，而是**用对 WebSocket 的前提**。

核心事实先立住：**开着的 WebSocket 连接会阻止页面进入 bfcache**（往返缓存）——用户点「后退」本该秒开的页面，会因为这条没关的连接被迫重新加载。所以「离开页面前关掉连接」既是省资源，也是保住 bfcache 快速导航体验。

## 二、bfcache：pagehide 断、pageshow 重建

bfcache 会把整个页面（含 JS 堆）冻结存起来，前进 / 后退时**原样恢复**、不重新执行。WebSocket 与它的正确协作是一对事件：

```js
let ws = null;
const wsURL = "wss://example.com/chat";

function connect() {
  ws = new WebSocket(wsURL);
  ws.onmessage = (e) => renderMessage(e.data);
  // …其余监听
}

// 页面被隐藏 / 离开（含进入 bfcache）前：关连接、清引用
window.addEventListener("pagehide", () => {
  if (ws) {
    ws.close(1000, "page hidden"); // 主动优雅关闭
    ws = null; // 断掉引用，别让冻结的页面攥着死连接
  }
});

// 页面恢复时：只有从 bfcache 复活（persisted 为真）才需要重建
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    connect(); // 旧实例已在 pagehide 关掉，这里必须 new 一个新的
  }
});
```

两个要点：

- **`pageshow` 要判 `event.persisted`**：只有它为 `true` 才表示「从 bfcache 复活」，需要重建连接；正常首次加载（`persisted` 为 `false`）由你的常规初始化流程建连，别重复。
- **重建必须 `new`**：`pagehide` 里关掉的实例已经 `CLOSED`、作废，`pageshow` 里只能建**新实例**——`WebSocket` 没有「恢复 / reopen」这回事。

::: warning 别用 unload / beforeunload 关连接
用 `unload` 或 `beforeunload` 做收尾会**直接让页面失去 bfcache 资格**（这两个事件的存在本身就使页面不可缓存）。要关 WebSocket、要做离场清理，**一律用 `pagehide`**——它既能覆盖真正的卸载，也能覆盖进入 bfcache 的情形，且不破坏缓存。
:::

## 三、visibilitychange：前后台切换

bfcache 管的是「离开 / 回到页面」；`visibilitychange` 管的是「页面还在，但切到后台 / 切回前台」（切标签页、切 App、锁屏）。这对 WebSocket 有两重意义：

- **切后台可能连接已死**：移动端页面切后台，系统可能冻结甚至杀掉网络，连接悄悄变成「半开」，你这侧却毫无感知。
- **切回前台是最佳恢复点**：`visibilityState` 变 `visible` 的一刻，正是**立即检查连接、必要时重连**的时机。

```js
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    // 切回前台：连接不在 OPEN 就立即重连（配合重连封装）
    if (!ws || ws.readyState !== WebSocket.OPEN) connect();
  } else {
    // 切到后台：按需断连省资源（长时间后台无意义地保活很浪费）
    // 是否断、断多久，取决于业务——策略考量见网络章
  }
});
```

::: tip 联动策略在网络章
「切回前台立即重连并**重置退避计数**」「`navigator.onLine` 由离线转在线时重连」这类**恢复策略**属工程范畴，见[网络章重连要点](/zh/base/network/net-realtime/guide-line/websocket-practice)。本叶只给出**挂接点**：`visibilitychange` + `readyState` 判断 + 调你的 `connect()`。
:::

## 四、重连封装骨架

`WebSocket` 实例走到 `CLOSED` 就作废，**重连 = 建一个新实例**。一个最小可用的重连封装长这样——注意它只负责「**浏览器侧的连接管理与 API 编排**」，**退避 / 抖动的具体算法留空、指向网络章**：

```js
/**
 * 自动重连的 WebSocket 封装（浏览器侧骨架）
 * 退避 / 抖动 / 何时不重连的「策略」见网络章；这里只搭 API 编排
 */
class ReconnectingSocket extends EventTarget {
  #url;
  #protocols;
  #ws = null;
  #closedByUser = false; // 用户主动 close 就不再重连
  #retries = 0;
  #queue = []; // 未连上时的待发队列

  constructor(url, protocols) {
    super();
    this.#url = url;
    this.#protocols = protocols;
    this.#connect();
  }

  #connect() {
    const ws = new WebSocket(this.#url, this.#protocols);
    this.#ws = ws;

    ws.onopen = () => {
      this.#retries = 0; // 连上就重置计数
      // 补发排队消息
      for (const data of this.#queue) ws.send(data);
      this.#queue.length = 0;
      this.dispatchEvent(new Event("open"));
    };

    ws.onmessage = (e) => this.dispatchEvent(new MessageEvent("message", { data: e.data }));

    ws.onclose = (e) => {
      // 用户主动关、或正常关闭码 1000 → 不重连（判据细节见网络章）
      if (this.#closedByUser || e.code === 1000) return;
      // 异常断开（如 1006）→ 排程重连
      const delay = this.#backoffDelay(this.#retries++);
      setTimeout(() => this.#connect(), delay); // new 一个新实例
    };

    ws.onerror = () => this.dispatchEvent(new Event("error"));
  }

  /**
   * 退避 + 抖动的具体算法见网络章，这里给一个占位实现
   * （min(base·2^n, cap) + jitter）
   */
  #backoffDelay(n) {
    const base = 1000, cap = 30000;
    return Math.min(base * 2 ** n, cap) + Math.random() * 1000;
  }

  /** 未连上时入队，OPEN 时直接发，避免 CONNECTING 态 send 抛异常 */
  send(data) {
    if (this.#ws?.readyState === WebSocket.OPEN) this.#ws.send(data);
    else this.#queue.push(data);
  }

  /** 用户主动关：置标志位，不再触发重连 */
  close(code = 1000, reason = "") {
    this.#closedByUser = true;
    this.#ws?.close(code, reason);
  }
}
```

封装的四个通用要点（不分框架）：

1. **持有可替换的 `ws` 引用**：重连时旧实例弃、新实例上，外部拿到的封装对象不变。
2. **区分「用户主动关」与「异常断开」**：主动 `close()` 后不该重连——靠一个 `closedByUser` 标志或对 `code === 1000` 的判断。
3. **`send` 前判 `readyState`**：未 `OPEN` 时入待发队列，`open` 后补发——彻底规避 `CONNECTING` 态 `send()` 抛 `InvalidStateError`。
4. **策略与编排分离**：退避 / 抖动 / 判据是**策略**（网络章），建连 / 换实例 / 挂监听是**编排**（本叶）——骨架把两者的接缝留清楚。

## 五、框架封装：Vue 与 React

框架里封装的核心诉求一致：**把连接的生命周期绑到组件生命周期上，卸载时务必 `close()`**。

### Vue 3 composable

```ts
// useWebSocket.ts
import { ref, onUnmounted, type Ref } from "vue";

/**
 * 极简 WebSocket 组合式函数
 * @param url 连接地址
 * @returns 响应式的连接状态、最近消息与 send
 */
export function useWebSocket(url: string) {
  const isOpen = ref(false); // 连接是否就绪，供模板用
  const lastMessage = ref<string | ArrayBuffer | Blob | null>(null);
  let ws: WebSocket | null = new WebSocket(url);

  ws.onopen = () => (isOpen.value = true);
  ws.onclose = () => (isOpen.value = false);
  ws.onmessage = (e) => (lastMessage.value = e.data);

  /** 发送前判状态，避免 CONNECTING 态抛异常 */
  const send = (data: string | ArrayBufferLike | Blob) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(data);
  };

  // 组件卸载：务必关连接，否则「幽灵连接」常驻
  onUnmounted(() => {
    ws?.close(1000, "component unmounted");
    ws = null;
  });

  return { isOpen, lastMessage, send };
}
```

### React hook

```tsx
// useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";

export function useWebSocket(url: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | ArrayBuffer | Blob | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setIsOpen(true);
    ws.onclose = () => setIsOpen(false);
    ws.onmessage = (e) => setLastMessage(e.data);

    // cleanup：卸载 / url 变化时关掉旧连接——这是最关键的一步
    return () => {
      ws.close(1000, "effect cleanup");
      wsRef.current = null;
    };
  }, [url]);

  const send = useCallback((data: string | ArrayBufferLike | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(data);
  }, []);

  return { isOpen, lastMessage, send };
}
```

::: warning React StrictMode 开发期会双挂载
开发模式的 `StrictMode` 会**故意挂载 → 卸载 → 再挂载**组件一次，导致 WebSocket 被建 → 关 → 再建。上面 hook 因为 cleanup 里正确 `close()` 了，行为是自洽的（只是开发期能看到一次多余的连开）。**别为消除这现象去掉 cleanup**——生产环境没有双挂载，而 cleanup 是防连接泄漏的命根子。生产中通常用成熟库（`react-use-websocket` 等）处理重连与去重。
:::

## 六、WebSocketStream：前沿，只需了解形态

`WebSocketStream` 是为解决标准 `WebSocket` **无背压**短板而生的新 API：它用 [Streams](/zh/web-advanced/web-api/) 收发数据，`ReadableStream` / `WritableStream` 天然带背压——**读得慢，发送端自动被限速；发得快过网络，`await writer.write()` 自动等**，收发两侧都不再需要手动轮询 `bufferedAmount`。

```js
// 特性检测：非标准，用前必须判
if ("WebSocketStream" in window) {
  // 构造支持 protocols 与 signal（AbortSignal，可在握手完成前中止）
  const controller = new AbortController();
  const wss = new WebSocketStream("wss://example.com/stream", {
    protocols: ["v1.chat"],
    signal: controller.signal,
  });

  // opened Promise：连上后 resolve 出可读 / 可写流与协商结果
  const { readable, writable, extensions, protocol } = await wss.opened;
  const reader = readable.getReader();
  const writer = writable.getWriter();

  await writer.write("hello"); // 带背压：发太快会自动 await 等

  while (true) {
    const { value, done } = await reader.read(); // 带背压：读得慢，上游自动放缓
    if (done) break;
    handle(value);
  }

  // closed Promise：连接关闭后 resolve 出 { closeCode, reason }
  wss.closed.then(({ closeCode, reason }) => console.log("关闭", closeCode, reason));

  // 主动关：close 接受 { closeCode, reason }，约束同标准 close()（1000 或 3000–4999）
  // wss.close({ closeCode: 1000, reason: "done" });
}
```

对比标准 `WebSocket`：

| 维度 | 标准 `WebSocket` | `WebSocketStream` |
| --- | --- | --- |
| 形态 | 事件驱动（`onmessage` / `onopen`） | Promise + Streams（`opened` / `closed` / reader / writer） |
| 接收背压 | **无**（消息堆内存 / 100% CPU） | 有（`await reader.read()` 天然限速） |
| 发送背压 | 轮询 `bufferedAmount`、无事件 | 有（`await writer.write()` 天然等） |
| 建连中止 | 无（只能等 `open` 或失败） | `AbortSignal`（握手完成前可中止） |
| 关闭信息 | `CloseEvent`（`code` / `reason` / `wasClean`） | `closed` Promise → `{ closeCode, reason }` |
| 标准化 | WHATWG 现行标准、全绿 | **非标准、仅 Chromium（Chrome 124+）**、未进标准轨道 |

::: warning 别拿它当生产主线
`WebSocketStream` **Firefox / Safari 完全不支持、也未进标准轨道**——它是「知道有这么个更优形态」的前沿了解对象，不是可跨浏览器依赖的生产 API。真要在 Chromium 环境用，务必特性检测 + 对其余浏览器降级回标准 `WebSocket`（自己补背压节流）。绝大多数项目：**标准 `WebSocket` + 上文的封装骨架**才是现实答案。
:::

## 小结

WebSocket 是长连接，**生命周期管理是用对它的前提**：开着的连接挡 bfcache，离场用 `pagehide` 关、`pageshow` 判 `persisted` 重建，切勿用 `unload` / `beforeunload`；前后台切换用 `visibilitychange` 挂重连点。重连的本质是「`onclose` → 排程 → `new` 新实例」，封装要分清**编排**（本叶）与**退避策略**（网络章），并在 `send` 前判 `readyState`。Vue / React 里把连接绑到组件生命周期、卸载必 `close()`。`WebSocketStream` 用 Streams 补上了背压短板，但非标准、仅 Chromium，只作前沿了解。参考页汇总全部 API 速查与易错点：[参考](../reference)。
