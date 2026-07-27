---
layout: doc
---

# SAML 2.0

SAML 2.0（Security Assertion Markup Language，安全断言标记语言）是 OASIS 于 2005 年 3 月发布、基于 **XML** 的身份联邦与单点登录（SSO）协议。它的核心是用一条**已签名的 XML 断言（Assertion）**让 **Service Provider（SP，服务提供方）** 信任 **Identity Provider（IdP，身份提供方）** 对 **Principal（被认证主体，通常是用户）** 的认证结果与属性声明，从而让用户在一次登录后跨多个独立应用免密访问。整套协议围绕三件套展开：**角色三件套（IdP / SP / Principal）**、**Assertion 三件套（Authentication/Attribute/Authorization Decision Statement）**、**绑定三件套（HTTP Redirect / HTTP POST / HTTP Artifact，外加 SOAP/PAOS）**。安全模型的核心是 **XML 数字签名（enveloped + C14N 规范化）**，所有跨信任方的断言都必须由 IdP 私钥签名、SP 用预共享的 IdP 公钥验签，并强制走 TLS 1.2+。与 OAuth 2.0/OIDC 的根本差异是：**SAML 是纯身份认证 + 属性断言协议（无 Access Token、无授权框架）**，主要服务传统企业浏览器应用（Salesforce/ServiceNow/Workday/政府联邦），而 OIDC 是建立在 OAuth 2.0 之上、JSON/JWT 编码、原生支持 SPA 与移动端的现代替代。生产使用必须过几道安全门：①SP 同时开启 `wantAssertionsSigned=true` 与 `wantAuthnResponseSigned=true`（仅验 Response 级签名挡不住 XSW 攻击）；②签名算法最低 RSA-SHA-256，禁用 SHA-1（NIST SP 800-131A Rev.2 已宣布 2030-12-31 前全面退役）；③维护 `InResponseTo` 关联 + Assertion ID 去重缓存防 Replay；④强制校验 `Destination` / `Audience` / `Recipient` 三件套防跨 SP 重放；⑤签名密钥用 HSM 保护、证书独立于 TLS、通过受 TLS 保护的 metadata URL 发布、忽略文档内 `<ds:KeyInfo>`。SAML 2.0 至今仍是企业 SSO 事实标准，最新勘误为 OASIS Approved Errata 05（2015 年），OASIS 未发布 SAML 3.0 主版本。

## 评价

**优点**

- **企业 SSO 事实标准**：与 Salesforce/ServiceNow/Azure AD/Okta/ADFS/OneLogin/政府联邦身份（如美国 Login.gov）原生兼容，传统企业应用接入门槛低
- **身份联邦成熟**：IdP/SP 角色清晰、metadata 自动协商证书与端点，跨组织联邦（InCommon/Federation Identity）开箱即用
- **XML 签名强度高**：enveloped 签名 + C14N 规范化，密码学层面与 JWT 一样可防篡改
- **断言自包含**：Assertion 直接承载用户属性（姓名/邮箱/角色），SP 无需回查 IdP 即可授权
- **IdP-Initiated / SP-Initiated 双流程**：用户可从 IdP 门户跳转，也可从 SP 触发登录，灵活覆盖企业门户与直链场景
- **协议规范稳定**：2005 年至今核心规范未变，库实现成熟、互操作测试覆盖充分

**缺点**

- **XML + 表单 POST，前端不友好**：SPA / 移动端 / API-first 场景硬上 SAML 是反模式，应换 OIDC
- **断言体积大**：一条带签名的 SAML Response 可达几 KB，远超 JWT 的几百字节
- **协议不含授权**：只有认证 + 属性断言，无 Access Token 概念，要做 API 授权需另接 OAuth 2.0
- **元数据交换重**：跨组织联邦需预先交换 metadata XML，不像 OIDC `.well-known/openid-configuration` 即时可发现
- **实现细节多、易踩坑**：XML 签名验证、C14N、XSW 防御、InResponseTo 关联、Assertion ID 去重，任何一项漏做都是致命漏洞
- **SHA-1 历史包袱**：早期实现大量用 rsa-sha1，NIST 已禁，迁移工作量分散在各厂商
- **签名密钥运维成本**：IdP 签名证书需独立于 TLS、最长 2 年轮换、通过 metadata 发布，比 JWT JWKS 轮换重

## 文档地址

- [OASIS SAML 2.0 Technical Overview](https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [OASIS SAML 2.0 Bindings（saml-bindings-2.0-os）](https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf)
- [OASIS SAML 2.0 Approved Errata 05](https://docs.oasis-open.org/security/saml/v2.0/sstc-saml-approved-errata-2.0.html)
- [OWASP SAML Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html)
- [RFC 7522 - SAML 2.0 Bearer Assertion Profile for OAuth 2.0](https://datatracker.ietf.org/doc/rfc7522/)

## GitHub地址

[tngan/samlify（Node SP/IdP 库）](https://github.com/tngan/samlify) · [@node-saml/passport-saml（Node SP 中间件）](https://github.com/node-saml/passport-saml) · [node-saml/xml-crypto（XML 签名底层库）](https://github.com/node-saml/xml-crypto)

## 幻灯片地址

<a href="/SlideStack/saml-slide/" target="_blank">SAML</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=220" target="_blank" rel="noopener noreferrer">SAML 测试题</a>
