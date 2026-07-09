---
layout: doc
---

# HTTPS 与传输安全

HTTP 是明文协议——传输途中任何中间节点都能窃听、篡改、冒充。**HTTPS = HTTP over TLS**，在 HTTP 与 TCP 之间插入一层 TLS，用「加密 + 证书」一举达成三大安全目标：**机密性、完整性、身份认证**。本叶从「为什么需要 HTTPS」讲起，拆解对称/非对称加密如何混合、证书与 CA 信任链如何验证身份、TLS 握手如何协商出会话密钥，再到中间人攻击与 HSTS 防护、证书签发实务——覆盖前端工程师理解 HTTPS 所需的完整链路。

## 概述

- **它管什么**：在不可信的公共网络上，建立一条加密（防窃听）、防篡改、且能验证对端身份（防冒充）的安全信道。
- **混合加密**：非对称加密慢但解决密钥分发与身份，对称加密快但密钥难分发——TLS 用非对称在握手阶段协商出**对称会话密钥**，之后数据全用对称加密，兼顾安全与性能。
- **信任的根基**：数字证书把「公钥 ↔ 身份」绑定，由 CA 签名背书，浏览器通过**根 → 中间 → 站点**的信任链验证；这是防中间人替换公钥的关键。
- **前端关切点**：Secure Context（很多 Web API 仅 HTTPS 可用）、HSTS 强制 HTTPS、混合内容拦截、本地 HTTPS 调试（mkcert）；而 XSS/CSRF/CSP 属「浏览器安全」叶。

## 本叶地图

- [入门](./getting-started) —— 一次 HTTPS 连接如何建立，安全三目标与核心机制速览
- [为什么需要 HTTPS](./guide-line/why-https) —— 明文三风险、安全三目标、HTTPS=HTTP over TLS、Secure Context
- [对称与非对称加密](./guide-line/symmetric-asymmetric) —— AES/ChaCha20、RSA/ECC、哈希与签名、TLS 混合加密
- [数字证书与 CA 信任链](./guide-line/certificates-ca) —— X.509、SAN、CA、信任链、验证四步、吊销与 CT
- [TLS 握手流程](./guide-line/tls-handshake) —— TLS 1.2 vs 1.3、ECDHE 前向保密、加密套件、SNI/ALPN、0-RTT
- [中间人攻击与 HSTS](./guide-line/mitm-hsts) —— MITM、SSL 剥离、HSTS、preload list、HPKP 已废弃
- [证书实务](./guide-line/certificate-practice) —— DV/OV/EV、通配符/SAN、Let's Encrypt+ACME、混合内容、mkcert
- [参考](./reference) —— TLS 版本对比 + 证书类型 + 安全头 + 权威链接

## 文档地址

- [MDN: Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security)
- [MDN: Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security) · [Mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)
- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) · [Cloudflare: How TLS works](https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)

## 幻灯片地址

<a href="/SlideStack/net-https-tls-slide/" target="_blank">HTTPS 与传输安全</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=https-%E4%B8%8E%E4%BC%A0%E8%BE%93%E5%AE%89%E5%85%A8" target="_blank" rel="noopener noreferrer">HTTPS 与传输安全 测试题</a>
