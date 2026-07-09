---
layout: doc
---

# HTTP 演进与性能

HTTP 的语义（方法、状态码、首部）三十年几乎未变，但它在网络上的**传输方式**经历了三代跃迁：从 HTTP/1.1 的文本协议、串行连接，到 HTTP/2 的二进制分帧与多路复用，再到 HTTP/3 基于 QUIC 把传输层整个搬到 UDP 之上。每一代都在回答同一个问题——**如何在一条（或一组）连接上更快、更并发地搬运越来越多的页面资源**。本叶顺着这条性能演进主线，讲清每一代的瓶颈、解法与代价，最后落到前端最关心的一点：在 HTTP/2+ 时代，哪些老掉牙的优化该扔、又该怎么重新做。

## 概述

- **语义不变、编码在变**：`GET`/`200`/`Content-Type` 跨三个版本含义完全一致，变的只是字节在网络上的排布——这是版本几乎无感切换的根因（HTTP 语义本身见「HTTP 协议基础」叶）。
- **一条主线：消灭队头阻塞**：HTTP/1.1 有**应用层**队头阻塞 → HTTP/2 多路复用消除它、却留下 **TCP 层**队头阻塞 → HTTP/3 用 QUIC 把队头阻塞降到单个流。看懂这条线，就看懂了整部演进史。
- **驱动力是网页复杂度**：从单文档到一页上百个资源，串行请求与反复建连的成本被不断放大，倒逼协议一代代进化。
- **前端关切点**：HTTP/2+ 下域名分片、雪碧图、文件合并这些老优化反而有害；要会用 DevTools 看协议版本、理解 HTTP/3 对移动端弱网的意义。

## 本叶地图

- [入门](./getting-started) —— 三代 HTTP 的演进脉络与一条「消灭队头阻塞」主线
- [HTTP 版本演进史](./guide-line/http-versions-history) —— 0.9 → 1.0 → 1.1 → 2 → 3、RFC 9110 语义与线格式分离、版本协商
- [HTTP/1.1 瓶颈与队头阻塞](./guide-line/http1-bottlenecks) —— 持久连接、管线化失败、应用层队头阻塞、6 连接上限、前端 hack 及代价
- [HTTP/2 二进制分帧与多路复用](./guide-line/http2-framing-multiplexing) —— 帧 / 消息 / 流、多路复用、流量控制、残留的 TCP 层队头阻塞
- [HPACK 头部压缩与服务器推送](./guide-line/http2-hpack-push) —— 静态 / 动态表、为何不用 gzip（CRIME）、服务器推送已废弃、103 Early Hints
- [HTTP/3 与 QUIC](./guide-line/http3-quic) —— QUIC over UDP、流级独立重传、0-RTT、连接迁移、QPACK、Alt-Svc
- [版本对比与前端性能实践](./guide-line/version-comparison-performance) —— 三版本对比表、过时的旧优化、版本检测、升级前提与务实路线
- [参考](./reference) —— 三版本对比表 + 队头阻塞层级 + 升级实践 + 权威链接

## 文档地址

- [MDN: Evolution of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP)
- [web.dev: HTTP/2](https://web.dev/articles/performance-http2)
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113) · [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114) · [RFC 9000: QUIC](https://www.rfc-editor.org/rfc/rfc9000)
- [caniuse: HTTP/3](https://caniuse.com/http3)

## 幻灯片地址

<a href="/SlideStack/net-http-evolution-slide/" target="_blank">HTTP 演进与性能</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=http-%E6%BC%94%E8%BF%9B%E4%B8%8E%E6%80%A7%E8%83%BD" target="_blank" rel="noopener noreferrer">HTTP 演进与性能 测试题</a>
