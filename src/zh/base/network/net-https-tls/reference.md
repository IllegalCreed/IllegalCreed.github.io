---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- HTTPS = HTTP over TLS；三目标：机密性 / 完整性 / 身份认证
- 混合加密：非对称协商对称会话密钥，数据走对称（AES-GCM / ChaCha20）
- 对称（AES/ChaCha20）快、密钥分发难；非对称（RSA/ECC）慢、解决分发与身份
- 哈希 SHA-256 单向定长；数字签名 = 哈希 + 私钥加密摘要
- 证书 = 公钥 + 身份 + CA 签名（X.509）；域名匹配看 SAN（CN 已忽略）
- 信任链：根 CA → 中间 CA → 站点；根证书内置信任库
- 验证四步：签名链可信 / 有效期内 / 域名匹配 / 未吊销
- 吊销：CRL（慢）/ OCSP（实时）/ OCSP Stapling（最优）；CT 透明度已强制
- TLS 1.3 = 1-RTT（0-RTT 回头客）；1.0/1.1 已弃用（RFC 8996）
- 前向保密（PFS）来自 ECDHE 临时密钥
- HSTS 强制 HTTPS 防 SSL 剥离；HPKP / Expect-CT 均已废弃
- DV/OV/EV 加密强度相同；Let's Encrypt 90 天 + ACME 自动续期
- 混合内容：被动升级、主动拦截；`upgrade-insecure-requests` 兜底

## TLS 1.2 vs 1.3

| 维度 | TLS 1.2 | TLS 1.3 |
| --- | --- | --- |
| 握手往返 | 约 2-RTT | **1-RTT**（回头客 0-RTT） |
| 密钥交换 | RSA / DHE / ECDHE | **仅 (EC)DHE**（强制前向保密） |
| 前向保密 | 可选（用 ECDHE 才有） | **默认** |
| 加密套件 | 4 段（含密钥交换+认证） | 精简为 AEAD + 哈希，如 `TLS_AES_128_GCM_SHA256` |
| 握手加密 | 部分明文 | ServerHello 之后**全程加密** |
| 状态 | 仍广泛在用 | 2026 主流推荐 |

> SSL 2.0/3.0 已废弃；TLS 1.0/1.1 由 RFC 8996（2021）正式弃用、浏览器已移除。

## 证书类型

| 类型 | 验证内容 | 签发速度 | 备注 |
| --- | --- | --- | --- |
| DV 域名验证 | 仅验域名控制权 | 秒级（自动） | 最常用；Let's Encrypt 即 DV |
| OV 组织验证 | 验组织真实性 | 数天 | 企业站常用 |
| EV 扩展验证 | 最严格审核 | 数天~周 | **地址栏绿条已被浏览器淡化** |

> 加密强度三者相同，差异只在 CA 签发前验证了什么。通配符 `*.example.com` 只匹配同层子域，不含裸域、不跨多层。

## 关键概念速查

| 概念 | 要点 |
| --- | --- |
| 对称加密 | 一把密钥加解密；AES（分组）、ChaCha20（流） |
| 非对称加密 | 公钥/私钥；RSA、ECC（等强度密钥更短） |
| 数字签名 | 私钥签名 + 公钥验签；保完整性 + 不可否认 |
| 会话密钥 | 握手协商出的对称密钥，每会话一换 |
| ECDHE | 临时密钥交换，提供前向保密 PFS |
| SNI | ClientHello 明文携带域名，支撑一 IP 多 HTTPS 站 |
| ALPN | 握手中协商 `h2`/`http/1.1`/`h3` |
| OCSP Stapling | 服务器代查吊销状态并钉入握手，省一次往返 |
| CT 证书透明度 | 证书入只追加日志 + SCT，浏览器已强制 |

## 安全头 / 实务速查

| 项 | 作用 |
| --- | --- |
| `Strict-Transport-Security` | HSTS：强制浏览器只用 HTTPS（`max-age`/`includeSubDomains`/`preload`） |
| HSTS preload list | 浏览器内置名单，首访即强制 HTTPS |
| `upgrade-insecure-requests` | CSP 指令，自动把页面内 HTTP 子资源升级为 HTTPS |
| HPKP（已废弃） | 证书钉扎，因自锁风险移除 |
| Expect-CT（已废弃） | CT 已默认强制，无需再发 |
| Let's Encrypt / ACME | 免费 DV 证书、自动签发与续期（90 天有效期，certbot） |
| mkcert | 本地开发受信任证书（根证书仅本机，勿上生产） |

## 权威链接

**标准 / 规范**

- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) · [RFC 8996: 弃用 TLS 1.0/1.1](https://www.rfc-editor.org/rfc/rfc8996)
- [RFC 6962 / 9162: Certificate Transparency](https://www.rfc-editor.org/rfc/rfc9162)

**指南 / 参考**

- [MDN: Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security) · [HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security) · [Mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)
- [Cloudflare: TLS 握手](https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/) · [What is an SSL certificate](https://www.cloudflare.com/learning/ssl/what-is-an-ssl-certificate/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/) · [Mozilla SSL Config Generator](https://ssl-config.mozilla.org/)

## 相关页

- [入门](./getting-started) · [为什么需要 HTTPS](./guide-line/why-https) · [对称与非对称加密](./guide-line/symmetric-asymmetric)
- [数字证书与 CA 信任链](./guide-line/certificates-ca) · [TLS 握手流程](./guide-line/tls-handshake)
- [中间人攻击与 HSTS](./guide-line/mitm-hsts) · [证书实务](./guide-line/certificate-practice)
