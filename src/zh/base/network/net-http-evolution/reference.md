---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- 三代演进只换传输方式：HTTP/1.1（文本 / TCP）→ HTTP/2（二进制分帧 / TCP）→ HTTP/3（QUIC / UDP），语义不变
- 队头阻塞三层级：1.1 应用层 → 2 消除应用层但残留 TCP 层 → 3 降到单流
- HTTP/2 三件套：二进制分帧（帧 / 消息 / 流）、多路复用、HPACK 头部压缩
- HPACK = 静态表（61 条）+ 动态表（默认 4096 字节、FIFO）+ Huffman；不用 gzip 防 CRIME/BREACH
- 服务器推送**已废弃**（Chrome 106 / 2022 移除），替代方案是 `103 Early Hints` + `preload`
- QUIC：基于 UDP、用户态、内置 TLS 1.3、流级独立重传、1-RTT/0-RTT、连接迁移（Connection ID）
- QPACK = HPACK 的 QUIC 版，化解动态表与流乱序到达的矛盾
- 版本协商：ALPN（TLS 内选 `h2`/`http/1.1`）、`Alt-Svc: h3` 宣告升级 HTTP/3
- 过时优化：域名分片、雪碧图、文件合并、资源内联——在 HTTP/2+ 下应回收
- 升级前提：HTTP/2 实际要 HTTPS；HTTP/3 要 UDP 443 可达 + `Alt-Svc` 宣告

## 三版本对比表

| 维度 | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| 传输层 | TCP | TCP | QUIC（UDP） |
| 报文编码 | 文本 | 二进制分帧 | 二进制分帧 |
| 多路复用 | ❌ 串行 | ✅ 单连接多流 | ✅ 单连接多流 |
| 队头阻塞 | 应用层 | 应用层消除、TCP 层残留 | 降到单流 |
| 每源连接数 | ~6 条 | 1 条 | 1 条 |
| 头部压缩 | 无（明文） | HPACK | QPACK |
| 加密 | 可选 | 规范可选、浏览器实际要 HTTPS | 内置 TLS 1.3 强制 |
| 连接建立 | TCP + TLS（2~3 RTT） | TCP + TLS（2~3 RTT） | QUIC 1-RTT、重连 0-RTT |
| 连接迁移 | ❌ | ❌ | ✅（Connection ID） |
| 服务器推送 | ❌ | 曾有（已多数弃用） | ❌ |

## 队头阻塞层级对照

| 层级 | 出现版本 | 成因 | 解法 |
| --- | --- | --- | --- |
| 应用层 HOL | HTTP/1.1 | 一条连接上响应必须按序返回 | HTTP/2 多路复用 |
| TCP 层 HOL | HTTP/2 | 所有流共用一条 TCP，丢包阻塞全部流 | HTTP/3 改用 QUIC |
| 流级（已最小化） | HTTP/3 | QUIC 每流独立重传，丢包只影响该流 | — |

## 关键机制速查

| 机制 | 所属 | 要点 |
| --- | --- | --- |
| 二进制分帧 | HTTP/2 | 帧（9 字节帧头）→ 消息 → 流；取代文本协议 |
| 多路复用 | HTTP/2 | 单连接并发多流，帧交错后按 Stream ID 重组 |
| HPACK | HTTP/2 | 静态表 + 动态表 + Huffman；整值索引 + 永不索引字面量抗攻击 |
| 服务器推送 | HTTP/2 | `PUSH_PROMISE`；已废弃，改用 103 Early Hints |
| QUIC | HTTP/3 | UDP 上自建连接 / 可靠传输 / 拥塞控制；内置 TLS 1.3 |
| 连接迁移 | HTTP/3 | 用 Connection ID 标识连接，切 Wi-Fi/蜂窝不断连 |
| QPACK | HTTP/3 | 独立编 / 解码器流 + 阻塞流，适配 QUIC 乱序 |
| Alt-Svc | 协商 | `Alt-Svc: h3=":443"` 宣告替代服务，后续请求异步升级 |

## 前端实践要点

- **回收旧优化**：升级 HTTP/2+ 后，域名分片（破坏单连接多路复用）、雪碧图 / 文件合并（破坏缓存粒度）、资源内联（无法独立缓存）应当撤掉。
- **拥抱细粒度**：按变更频率拆包 + 内容哈希 + `immutable`，让浏览器多路复用并发拉取、长缓存命中。
- **资源提示**：用 `preconnect` 提前对跨源建连，用 `preload` 提前拉取「晚发现的关键资源」（勿滥用）。
- **版本检测**：DevTools → Network → Protocol 列；`curl --http2 -I` / `curl --http3 -I`；`nghttp -nv`。
- **升级路线**：HTTPS + HTTP/2 是零业务改造的基线；HTTP/3 交给 CDN / 反向代理一键开启（靠 `Alt-Svc` 宣告、连不通自动回退）。

## 权威链接

**标准 / 规范**

- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113) · [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114)
- [RFC 9000: QUIC](https://www.rfc-editor.org/rfc/rfc9000) · [RFC 9204: QPACK](https://www.rfc-editor.org/rfc/rfc9204) · [RFC 7541: HPACK](https://www.rfc-editor.org/rfc/rfc7541)
- [RFC 8297: 103 Early Hints](https://www.rfc-editor.org/rfc/rfc8297)

**指南 / 参考**

- [MDN: Evolution of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP) · [Connection management in HTTP/1.x](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Connection_management_in_HTTP_1.x)
- [web.dev: HTTP/2](https://web.dev/articles/performance-http2) · [MDN: Alt-Svc](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Alt-Svc)
- [Chrome: 移除 HTTP/2 Server Push](https://developer.chrome.com/blog/removing-push)

**兼容性 / 调试**

- [caniuse: HTTP/2](https://caniuse.com/http2) · [caniuse: HTTP/3](https://caniuse.com/http3)
- 浏览器 DevTools → Network 面板（Protocol 列）· `curl --http2 / --http3`

## 相关页

- [入门](./getting-started) · [HTTP 版本演进史](./guide-line/http-versions-history) · [HTTP/1.1 瓶颈与队头阻塞](./guide-line/http1-bottlenecks)
- [HTTP/2 二进制分帧与多路复用](./guide-line/http2-framing-multiplexing) · [HPACK 头部压缩与服务器推送](./guide-line/http2-hpack-push)
- [HTTP/3 与 QUIC](./guide-line/http3-quic) · [版本对比与前端性能实践](./guide-line/version-comparison-performance)
