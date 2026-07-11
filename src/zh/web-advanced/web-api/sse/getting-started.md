---
layout: doc
outline: [2, 3]
---

# 入门：定位、心智模型与一分钟上手

> 基于 WHATWG HTML 现行标准（Server-sent events 章）· 核于 2026-07

## 速查

- **一句话定位**：`EventSource` 是浏览器消费 SSE（服务器单向推送）的原生接口——一个 GET 请求换一条永不结束的 `text/event-stream` 响应，服务器持续写、浏览器持续派发事件。
- **三行上手**：`const es = new EventSource("/events")` → `es.onmessage = (e) => { /* 用 e.data */ }` → 不用时 `es.close()`。
- **单向**：只有服务器到客户端；客户端要发言另开普通请求；双向需求选 WebSocket。
- **本章分工**：协议原理（推送模型、SSE vs WebSocket vs 轮询选型）在[网络章 SSE 页](/zh/base/network/net-realtime/guide-line/sse)已产出；本叶只讲浏览器 API 用法与工程实践。
- **响应三要素**：状态码必须 **200** + MIME 必须 **`text/event-stream`** + 响应保持不结束；MIME 不对或非 200 直接致命失败、**不重连**。
- **事件流格式**：`data:` / `event:` / `id:` / `retry:` 四字段 + 冒号行注释，**空行分隔事件**；纯文本 UTF-8。
- **默认事件是 message**：服务器不写 `event:` 字段 → `onmessage` 接收；写了 `event: xxx` → 必须 `addEventListener("xxx")`，`onmessage` 收不到。
- **`e.data` 永远是字符串**：传 JSON 要自己 `JSON.parse`。
- **自动重连内建**：连接断开（含响应正常结束）浏览器自动重连，`retry:` 控制间隔、重连自动带 `Last-Event-ID` 请求头续推。
- **readyState 三态**：`CONNECTING(0)` / `OPEN(1)` / `CLOSED(2)`；`onerror` 里靠它区分"重连中"与"已放弃"。
- **构造仅一个选项**：`{ withCredentials: true }`（跨域带 Cookie）；**没有自定义请求头的入口**——认证局限详见[重连与局限页](./guide-line/reconnect-and-limits)。
- **AI 场景注意**：ChatGPT 类接口的流式响应是 SSE 格式，但客户端主流用 **fetch + 流式解析**消费（可 POST、可带 Authorization），详见 [fetch 流式替代页](./guide-line/fetch-streaming-alternative)。
- **服务端最小实现**：响应头 `Content-Type: text/event-stream` + `Cache-Control: no-cache`，之后每条消息往响应里写 `data: 内容` + 空行即可（Node 示例见下文）。
- **心跳保活**：冒号开头的行是注释，服务端每 15 秒左右发一条 `: ping` 防代理掐线；注释对客户端 JS 完全不可见。
- **必须手动 close()**：挂着监听器的 `EventSource` 不会被垃圾回收，SPA 路由切走后仍在后台常驻重连——组件卸载钩子里 `es.close()`。
- **Worker 可用**：`EventSource` 同时暴露在 Window 与 Worker 全局；多标签页可用 SharedWorker 共享一条连接省配额。
- **支持现状**：Baseline Widely available；Chrome 6 / Safari 5 / Firefox 6 / Edge 79 起全绿，成熟无演进包袱。

## 一、定位：给"服务器推"一个原生 API

"服务器有新数据时主动告知页面"这件事，协议层的完整故事——轮询/长轮询的演进、SSE 的 HTTP 长响应本质、与 WebSocket 的对比选型——[网络章 SSE 页](/zh/base/network/net-realtime/guide-line/sse)已经讲透。本叶站在它的结论之上：**假定你已确认"单向文本推送选 SSE"，聚焦浏览器端怎么把它用好**。

浏览器消费 SSE 的原生入口只有一个：**`EventSource` 接口**。它把"发起请求、解析事件流、掉线重连、断点续推"全部打包，暴露给你的只是一个事件目标（EventTarget）：

```js
const es = new EventSource("/events"); // 一份长期订阅从此开始
es.onmessage = (e) => console.log(e.data);
```

与它对照的是近年 AI 流式场景的主流做法——**fetch + 流式读取**：消费的还是同一种 `text/event-stream` 格式，但解析、重连全部手写，换来自定义请求头与 POST 的自由。两条路线的取舍是本叶的重要主题，先按下不表（见 [fetch 流式替代页](./guide-line/fetch-streaming-alternative)）。

## 二、心智模型：订阅一条"不结束"的响应

`EventSource` 的一切行为都源自一个事实：**它发的是一次普通 GET，但对方的响应永远"没写完"**。

```text
浏览器                                    服务器
   │  GET /events                           │
   │───────────────────────────────────────▶│
   │  200 OK                                │
   │  Content-Type: text/event-stream       │
   │◀───────────────────────────────────────│
   │◀── data: 事件 1 ────────────────────────│  响应一直不结束，
   │◀── data: 事件 2 ────────────────────────│  服务器随时往里写一段
   │◀── : 心跳注释 ──────────────────────────│
   │  ✕ 连接断了？浏览器自动重连，           │
   │    并带上 Last-Event-ID 请求头          │
```

三个心智锚点：

1. **它是"订阅"，不是"请求—响应"**：一次 `new EventSource(url)` 等于订了一份长期报纸，之后事件何时到、到多少，完全由服务器决定；
2. **事件以文本块的形式陆续到达**：每个块由若干 `字段: 值` 行组成，**一个空行**宣告"这个事件完整了"，浏览器随即派发；
3. **断线重连是浏览器的事**：网络抖动、服务重启、代理掐线，浏览器都会自己等一会儿再连，还替你捎上"我读到哪了"（`Last-Event-ID`）——但它的边界（什么情况不重连）必须搞清，详见[重连页](./guide-line/reconnect-and-limits)。

## 三、一分钟上手：最小可运行示例

一个零依赖的完整例子。保存为 `server.mjs`，`node server.mjs` 后浏览器访问 `http://localhost:3000`，即可看到每秒新增一条推送：

```js
// server.mjs —— 零依赖的最小 SSE 服务
import { createServer } from "node:http";

// 演示页：订阅 /events 并把每条消息追加到列表
const page = `<!doctype html>
<meta charset="utf-8" />
<ul id="list"></ul>
<script type="module">
  const es = new EventSource("/events");
  es.onmessage = (e) => {
    const li = document.createElement("li");
    li.textContent = e.data; // data 永远是字符串
    document.getElementById("list").append(li);
  };
</script>`;

const server = createServer((req, res) => {
  // 普通页面路由
  if (req.url !== "/events") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(page);
    return;
  }

  // SSE 响应头三件套：MIME 必须是 text/event-stream，否则浏览器直接报错且不再重连
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write("retry: 5000\n\n"); // 建议浏览器：断线后等 5 秒再重连

  let id = 0;
  const timer = setInterval(() => {
    id += 1;
    // 一个事件 = 若干"字段: 值"行 + 一个空行（空行触发浏览器派发）
    res.write(`id: ${id}\ndata: 第 ${id} 条推送 ${new Date().toLocaleTimeString()}\n\n`);
  }, 1000);

  // 客户端断开（关标签页 / es.close()）时停止写入，防定时器泄漏
  req.on("close", () => clearInterval(timer));
});

server.listen(3000, () => console.log("http://localhost:3000"));
```

客户端的完整"三件套"写法（页面里那段的展开版）：

```js
const es = new EventSource("/events");

es.onopen = () => console.log("已连上，readyState =", es.readyState); // 1 = OPEN

// 服务器没写 event: 字段的消息都到这里
es.onmessage = (e) => console.log("data:", e.data, "| lastEventId:", e.lastEventId);

es.onerror = () => {
  // error 事件本身几乎不带信息，靠 readyState 判断处境
  if (es.readyState === EventSource.CONNECTING) console.log("掉线，浏览器自动重连中…");
  if (es.readyState === EventSource.CLOSED) console.log("致命失败，已停止重连");
};

// 退订的唯一方式；之后 readyState 恒为 CLOSED，不会再重连
// es.close();
```

**建议做一次断线实验**：页面跑起来后 Ctrl+C 杀掉 Node 进程，控制台会打出"重连中"；重启服务，5 秒内自动恢复推送——打开 DevTools 网络面板还能看到重连请求自动带了 `Last-Event-ID` 请求头。SSE 最有价值的能力，就这样零代码地展示完了。

## 四、第一次就该记住的事实

- **响应三要素是铁律**：状态码 200 + `Content-Type: text/event-stream` + 响应不结束。MIME 写错（比如 `text/plain`）或返回非 200，浏览器判定**致命失败**——触发 `error` 后直接 CLOSED，连重试都不会。
- **`event:` 字段改变收件人**：服务器一旦给消息加了 `event: price`，`onmessage` 就收不到它了，必须 `es.addEventListener("price", handler)`——"服务端加了类型、客户端没改监听"是新手"收不到消息"的第一嫌疑。
- **`e.data` 永远是字符串**：事件流是纯文本协议，JSON 要自己 parse，二进制传不了。
- **重连白送，但"正常结束"也算断**：服务器把响应正常 end 掉，浏览器同样视为掉线并重连——SSE 的世界观里响应就不该结束。想让浏览器死心，服务端回 **204**，或客户端自己 `close()`。
- **关闭要显式**：`close()` 是唯一退订手段，且没有对应的 close 事件；把变量置 `null` 不会断开连接（规范要求挂着监听器的实例不被回收），SPA 里组件卸载不 close 就是"幽灵订阅"。

## 五、与协议层、替代方案的分工

一张表厘清"这个问题去哪读"：

| 问题 | 归属 |
| --- | --- |
| SSE 与 WebSocket / 轮询怎么选、协议长什么样 | [网络章 SSE 页](/zh/base/network/net-realtime/guide-line/sse)（协议层，已产出） |
| `EventSource` 怎么用、事件流怎么解析 | 本叶 [EventSource API 全解](./guide-line/eventsource-api) |
| 重连语义、连接数限制、认证局限、部署坑 | 本叶[重连机制与工程局限](./guide-line/reconnect-and-limits) |
| AI 流式响应为什么绕开 `EventSource`、怎么手动解析 | 本叶 [fetch 流式替代页](./guide-line/fetch-streaming-alternative) |
| fetch 请求本身的完整能力 | [Fetch API 叶](/zh/web-advanced/web-api/fetch/) |
| `ReadableStream` 等流原语的通用能力 | 本章后续 Streams API 叶（产出后串链） |

## 六、浏览器支持现状

| 能力 | 状态（核于 2026-07） |
| --- | --- |
| `EventSource` 全接口 | **Baseline Widely available**：Chrome 6（2010）/ Safari 5（2010）/ Firefox 6（2011）/ Edge 79 起全绿 |
| Worker 中使用 | 支持（接口暴露于 Window 与 Worker 全局，含 SharedWorker） |
| IE | 从未支持（已无关紧要） |

结论：**兼容性在 2026 年完全不是问题**——`EventSource` 是 Web 平台里罕见的"十几年没变、也不需要变"的 API。真正要花心思的是它的工程边界（连接数、认证、代理），以及"什么时候该放弃它改用 fetch"。

下一页把 API 面一寸寸铺开——构造与请求语义、三态与三事件、命名事件、事件流四字段与解析边界：[EventSource API 全解](./guide-line/eventsource-api)。
