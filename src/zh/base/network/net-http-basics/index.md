---
layout: doc
---

# HTTP 协议基础

HTTP（HyperText Transfer Protocol，超文本传输协议）是 Web 的应用层基石——浏览器与服务器之间每一次取页面、调接口、传文件，都是一来一回的 HTTP 请求与响应。它定义了一套通用语言：**报文长什么样、用什么方法、返回什么状态码、靠哪些首部传递元数据**。HTTP 本身**无状态**，登录态、缓存、内容协商这些能力都是用首部与 Cookie 在朴素的请求—响应模型上叠出来的。本叶聚焦 HTTP/1.1 的语义骨架（报文、方法、状态码、首部、Cookie、连接与缓存）——这套语义在 HTTP/2、HTTP/3 里完全不变，是看懂任何抓包与网络面板的基础。

## 概述

- **它管什么**：客户端怎么发请求（方法 + 目标 + 首部 + 体）、服务器怎么回响应（状态码 + 首部 + 体），双方靠首部协商内容 / 缓存 / 连接 / 会话。
- **无状态的本质**：协议本身不记忆上一次请求；登录态、购物车等「状态」靠 Cookie、Session、Token 等**额外手段**外挂上去。
- **语义 vs 编码**：方法、状态码、首部是**语义**；HTTP/1.1 用纯文本、HTTP/2 / 3 用二进制分帧——**语义不变，只是编码不同**（演进见「HTTP 演进与性能」叶）。
- **前端关切点**：用状态码诊断问题、调优缓存首部、设对 Cookie 安全属性、理解内容协商与压缩——跨域（CORS）与 HTTPS/TLS 各有专叶。

## 本叶地图

- [入门](./getting-started) —— 一次 HTTP 请求的完整生命周期，报文 / 方法 / 状态码 / 首部速览
- [HTTP 报文结构与请求方法](./guide-line/http-messages-methods) —— 请求 / 响应四段结构、方法语义、安全 / 幂等 / 可缓存三属性
- [HTTP 状态码全谱](./guide-line/status-codes) —— 1xx~5xx 五大类、易混码辨析（301/308、302/307/303、401/403、502/503/504）
- [HTTP 首部精要](./guide-line/http-headers) —— 请求 / 响应 / 表示头分类、高频首部、语法规则
- [HTTP 内容协商](./guide-line/content-negotiation) —— Accept 系列、质量值 q、Vary 与缓存正确性
- [Cookie 与会话管理](./guide-line/cookies-sessions) —— Set-Cookie 属性、SameSite、HttpOnly / Secure、会话方案
- [持久连接、范围请求与缓存首部](./guide-line/connection-range-caching) —— keep-alive、Range/206、Cache-Control / ETag 语义
- [参考](./reference) —— 方法表 + 状态码表 + 首部表 + 缓存指令表 + 权威链接

## 文档地址

- [MDN: HTTP（中文）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP)
- [MDN: HTTP Messages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111)

## 幻灯片地址

<a href="/SlideStack/net-http-basics-slide/" target="_blank">HTTP 协议基础</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=http-%E5%8D%8F%E8%AE%AE%E5%9F%BA%E7%A1%80" target="_blank" rel="noopener noreferrer">HTTP 协议基础 测试题</a>
