---
layout: doc
---

# HTTP/2·HTTP/3

HTTP/2 与 HTTP/3 是 HTTP 语义在**传输层**的两次重大升级，前者把请求/响应搬到「单 TCP 连接上的二进制多路复用流 + HPACK 头部压缩」上，后者干脆把传输层换成基于 UDP 的 QUIC（RFC 9000），把 TLS 1.3 握手与连接管理合二为一。两者都解决了 HTTP/1.1 的两大顽疾——**应用层队头阻塞**（一个慢请求堵住整条连接）与**重复握手开销**（每条 TCP 连接都要 DNS + TCP + TLS 三次往返），但解决路径截然不同：HTTP/2 在单 TCP 上并行多条 stream，TCP 层丢包仍会卡住所有流（TCP 队头阻塞）；HTTP/3 把每条 stream 独立做到丢包只阻塞自身，再加上 Connection ID 实现网络切换不掉线、0-RTT 实现重连零握手。本章聚焦协议特性与协议级优化：多路复用、HPACK / QPACK 头部压缩、Server Push 弃用（Chrome 106 默认禁用，2022）与 103 Early Hints 替代、流优先级（RFC 9113 弃用旧优先级树，改用 RFC 9218 Priority 头 / HTTP/3 的 PRIORITY_UPDATE 帧）、QUIC 的 UDP 化 + 0-RTT + 连接迁移、域名分片在 HTTP/2 下的失效、Fetch Priority API 与协议优先级的协作。本章不展开 TLS 1.3 / 证书申请（属 HTTPS 与 TLS 章）、应用层性能（LCP/INP 评测属 Web 性能优化总览）、缓存策略（属 HTTP 缓存 / 资源缓存章）、HTTP 语义本身（方法/状态码属 HTTP 基础章）——只讨论这些语义在 h2 / h3 之上的传输表达差异。

## 评价

**优点**

- **多路复用消除应用层队头阻塞**：单 TCP 连接（h2）或单 QUIC 连接（h3）并行跑上百条 stream，慢请求不再堵住后续
- **头部压缩降带宽**：HPACK（h2，静态表 61 项 + 动态表 + Huffman）/ QPACK（h3，静态表 99 项）把重复 Cookie / User-Agent 压缩到几字节
- **HTTP/3 流级 HOL**：QUIC 把每条 stream 独立加密独立重传，TCP 时代的「一个包丢全部流卡住」从根上消除
- **连接迁移**：Connection ID 标识连接，Wi-Fi 切蜂窝 IP 变了不掉线，移动端体验立竿见影
- **0-RTT 重连**：重复访问场景 TTFB 大幅缩短（Cloudflare 实测 176ms vs h2 201ms，-12.4%）
- **协议级优先级**：RFC 9218 的 `Priority: u=0..7; i=?1` + HTML 层 `fetchpriority`，让 LCP 关键资源被协议优先调度

**缺点**

- **HTTP/2 仍有 TCP 队头阻塞**：单 TCP 上一个包丢，全部 stream 都要等重传
- **0-RTT 重放风险**：early data 缺前向保密可被重放，POST / 支付 / 写操作必须等 1-RTT
- **Server Push 已事实性废弃**：Chrome 106（2022-09）默认禁用，采用率仅 0.7%，HTTP/3 多数服务器根本未实现
- **HTTP/3 在弱 UDP 链路可能更慢**：企业网 / 中间盒常对 UDP 限速或丢弃，需要回退 HTTP/2 还要付重试开销
- **配置面广**：Alt-Svc 协商、UDP/443 放通、HPACK 表大小、拥塞算法（CUBIC vs BBR）选择，坑多
- **大对象传输可能略慢**：QUIC 默认 New Reno/CUBIC 不如调优过的 h2 + BBR（Cloudflare 实测 1MB 页面 h3 2.33s vs h2 2.30s）

## 文档地址

- [RFC 9113：HTTP/2（2022-06，取代 RFC 7540）](https://www.rfc-editor.org/rfc/rfc9113)
- [RFC 9114：HTTP/3（2022-06）](https://www.rfc-editor.org/rfc/rfc9114)
- [RFC 9000：QUIC 传输（2021-05）](https://www.rfc-editor.org/rfc/rfc9000)
- [RFC 7541：HPACK（h2 头部压缩）](https://www.rfc-editor.org/rfc/rfc7541) · [RFC 9204：QPACK（h3 字段压缩）](https://www.rfc-editor.org/rfc/rfc9204)
- [RFC 9218：Extensible Prioritization Scheme（Priority 头）](https://www.rfc-editor.org/rfc/rfc9218) · [RFC 8297：103 Early Hints](https://www.rfc-editor.org/rfc/rfc8297)
- [MDN：HTTP/2 词汇表](https://developer.mozilla.org/en-US/docs/Glossary/HTTP_2) · [Chrome：Removing HTTP/2 Server Push](https://developer.chrome.com/blog/removing-push) · [web.dev：Fetch Priority](https://web.dev/articles/fetch-priority)

## GitHub地址

- [cloudflare/quiche（QUIC + HTTP/3 实现）](https://github.com/cloudflare/quiche)
- [nginx HTTP/2 / HTTP/3 模块](https://github.com/nginx/nginx) · [nodejs/node（内置 h2）](https://github.com/nodejs/node)

## 幻灯片地址

<a href="/SlideStack/http2-http3-slide/" target="_blank">HTTP/2·HTTP/3</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=685" target="_blank" rel="noopener noreferrer">HTTP/2·HTTP/3 测试题</a>

> 待回填：题库 `http2-http3.json` 经 `import:content:prod` 入库后，把 `PENDING` 换成实际 categoryId。

## 相关章节

- TLS 1.3 / PKI / 证书申请与续期属 HTTPS 与 TLS 章，本章只在 h2 over TLS、QUIC 内嵌 TLS 1.3 的边界处点到
- Core Web Vitals（LCP / INP / CLS）评测与图片格式优化属 Web 性能优化总览，本章只讨论协议对 LCP 的间接影响
- Service Worker / Cache API / CDN 缓存策略属资源缓存 / CDN 章，本章只讨论协议对缓存层的影响
- Resource Hints（preload / preconnect / dns-prefetch）属资源加载章，但 `fetchpriority` 与 103 Early Hints 因与协议优先级、Server Push 弃用强绑定，本章会涉及
- HTTP 语义（方法、状态码、内容协商）属 HTTP 基础章，本章只讨论这些语义在 h2 / h3 之上的传输表达差异
