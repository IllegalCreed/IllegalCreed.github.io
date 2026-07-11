---
layout: doc
---

# Server-Sent Events

Server-Sent Events（SSE）是**浏览器原生的服务器单向推送能力**，客户端接口是 `EventSource`：向服务器发一个普通 HTTP GET，服务器以 `text/event-stream` 格式在一条不结束的响应里持续写入事件，浏览器自动解析并派发为 DOM 事件——**自动重连、断点续推（`Last-Event-ID` 请求头）、命名事件全部内建**。SSE 定义在 WHATWG HTML Living Standard（不是独立规范），`EventSource` 自 2010 年前后就进入各引擎（Chrome 6 / Safari 5 / Firefox 6），Baseline Widely available，成熟稳定、零演进包袱；近年因 AI 流式输出重新翻红——ChatGPT 类接口的流式响应正是 SSE 格式，但该场景下客户端多改用 **fetch + 流式解析**消费同一格式（`EventSource` 无法自定义请求头、只能 GET）。"EventSource 正统用法"与"fetch 流式替代"正是本叶的两条主线。

## 评价

**优点**

- **可靠性逻辑白送**：掉线自动重连（`retry:` 字段可调节奏）、重连自动携带 `Last-Event-ID` 请求头做断点续推——其他实时方案要手写的部分，浏览器内建
- **复用 HTTP 全家桶**：本质是一条普通 GET + 长响应，鉴权、压缩、CDN、HTTP/2、负载均衡等既有基础设施照常工作，不像 WebSocket 要为独立协议单独铺路
- **API 面极小**：一个构造函数、三个只读属性、一个方法、三个事件，学习成本接近零；事件流是裸眼可读的纯文本，curl 就能调试
- **成熟无包袱**：全浏览器绿了十几年，标准长期稳定；`Window` 与 Worker 全局都可用，多标签页还能借 SharedWorker 共享一条连接
- **服务端门槛低**：任何能保持响应不结束的 HTTP 服务几行代码即可支持，无需专用网关

**局限**

- **单向**：只有服务器到客户端一个方向；客户端发言得另开普通请求，双向场景应选 WebSocket（协议对比见[网络章](/zh/base/network/net-realtime/guide-line/sse)）
- **无法自定义请求头**：构造选项只有 `withCredentials`，`Authorization: Bearer` 无门——认证只能靠 Cookie 或 URL token，这是 AI 场景转投 fetch 流式读取的核心原因
- **HTTP/1.1 下每域约 6 条连接红线**：上限按"浏览器 + 域名"计（跨标签页累计），多开几个标签页即耗尽，Chrome/Firefox 标记 Won't fix；需 HTTP/2（默认 100 并发流）或 SharedWorker 化解
- **纯文本 UTF-8**：不能传二进制、不能声明其他字符编码
- **"响应正常结束也重连"**：流自然走完同样触发自动重连，一次性任务（如单轮 AI 生成）用它会被反复重发，需服务端 204 拦停或客户端主动 close

一句话选型：**页面需要长期订阅服务器单向推送的文本事件（通知、行情、日志、进度），`EventSource` 是最省事的标准答案；要带认证头、POST 大参数或做一次性流式生成（AI 对话），改用 fetch + 流式解析消费同样的 SSE 格式**；需要双向低延迟通信直接上 WebSocket。

## 本叶地图

- [入门](./getting-started) —— 定位与本章分工（协议层在网络章）、"订阅一条不结束的响应"心智模型、Node 最小服务 + `EventSource` 一分钟上手、浏览器支持现状
- [EventSource API 全解](./guide-line/eventsource-api) —— 构造与请求语义、withCredentials 跨域、readyState 三态与三事件、onmessage 与命名事件、事件流四字段与解析边界、注释心跳、close 与生命周期
- [重连机制与工程局限](./guide-line/reconnect-and-limits) —— 重连 vs 致命失败的完整判定、retry 与重连节奏、lastEventId 与 Last-Event-ID、断点续推服务端设计、六连接限制与 HTTP/2、代理缓冲坑、认证局限
- [fetch 流式替代方案](./guide-line/fetch-streaming-alternative) —— AI 流式响应的主流消费方式、fetch + ReadableStream 手动解析 SSE、与 EventSource 的取舍、手动重连要点
- [参考](./reference) —— API 与事件流字段速查表 + 重连语义速查 + EventSource vs fetch 对比 + 易错点清单 + 资源链接

## 文档地址

[MDN Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## GitHub 地址

[whatwg/html](https://github.com/whatwg/html)（SSE 属 HTML Living Standard 第 9.2 节，无独立仓库）

## 幻灯片地址

<a href="/SlideStack/sse-slide/" target="_blank">Server-Sent Events</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=server-sent-events" target="_blank" rel="noopener noreferrer">Server-Sent Events 测试题</a>
