---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OASIS SAML 2.0 Technical Overview（sstc-saml-tech-overview-2.0）/ OASIS SAML 2.0 Bindings（saml-bindings-2.0-os）/ OWASP SAML Security Cheat Sheet 官方文档编写，对照 tngan/samlify 与 @node-saml/passport-saml 长期支持版行为

## 速查

- **协议定位**：SAML 2.0 = 基于 XML 的**身份联邦 + SSO** 协议（OASIS 2005），不是授权协议（无 Access Token），不是 OAuth 2.0
- **三角色**：IdP（认证用户、签发断言）/ SP（消费断言、授访问）/ Principal（被认证主体，通常用户）
- **Assertion 三类 Statement**：Authentication（认证方式如 PasswordProtectedTransport）/ Attribute（姓名/邮箱/角色）/ Authorization Decision（授权决策）
- **NameID 五种 Format**：transient（临时假名）/ persistent（持久假名，按 SP 隔离）/ email-address / X509SubjectName / entity
- **SubjectConfirmation 三种 Method**：bearer（持有即用，最常用）/ holder-of-key（须证明掌握密钥）/ sender-vouches（发送方担保）
- **Bindings**：HTTP Redirect（DEFLATE+URL query，短消息）/ HTTP POST（Base64+表单字段，断言必须签名）/ HTTP Artifact（传固定长度 artifact，后端 SOAP 解析）/ SAML SOAP / PAOS/ECP
- **AuthnRequest 关键属性**：ID（Response 的 InResponseTo 须引用）、Issuer（SP EntityID）、NameIDPolicy、AssertionConsumerServiceIndex
- **Response 关键属性**：InResponseTo（关联请求 ID）/ Destination（目标 ACS URL）/ Status / Assertion
- **RelayState**：binding-specific 字段，SP 携带上下文，IdP 须原样返回；**隐私风险 + Open Redirect 入口**
- **XML 签名**：enveloped（`<ds:Signature>` 嵌入 Assertion 内）+ **C14N 规范化** + 两阶段验证（Digest + SignatureValue）
- **签名算法**：最低 RSA-SHA-256，**禁 SHA-1**（NIST 2030-12-31 前全面退役）
- **TLS**：所有 SAML 通信走 TLS 1.2+
- **Node 主流库**：`samlify`（默认 RSA-SHA256）/ `@node-saml/passport-saml`（`signatureAlgorithm: 'sha256'`）
- **典型场景**：传统企业浏览器 SSO（Salesforce/ServiceNow/Azure AD/Okta/政府联邦）；SPA/移动端/API-first 优先选 OIDC

## SAML 是什么

SAML 2.0（Security Assertion Markup Language）是 OASIS 2005 年发布的、基于 **XML** 的身份联邦与单点登录协议。它的核心场景是：用户在 **Identity Provider（IdP，身份提供方）** 登录一次后，**Service Provider（SP，服务提供方）** 通过消费 IdP 签发的**已签名 XML 断言（Assertion）** 信任该用户的身份与属性，无需用户再次登录。

它的核心定位有三：

- **身份联邦而非授权**：SAML 解决「**我是谁、我在 IdP 那边认证过、我有这些属性**」的跨信任方传递，**不**包含 Access Token、**不**定义 API 授权流程；要做 API 授权需另接 OAuth 2.0（或 RFC 7522 把 SAML 断言当 OAuth 2.0 Bearer 凭证）
- **XML + 表单 POST 而非 JSON + Bearer**：协议本质是 IdP ↔ SP 后端 + 浏览器重定向，断言通过 HTML 表单隐藏字段（SAMLResponse）传递，与 JWT 的 `Authorization: Bearer` 头是两种范式
- **企业 SSO 事实标准**：与 Salesforce/ServiceNow/Workday/Azure AD/Okta/ADFS/OneLogin 原生兼容，传统企业应用与政府联邦身份（如美国 Login.gov、InCommon 联邦）仍是 SAML 主场

> SAML ≠ OAuth 2.0/OIDC。SAML 解决企业浏览器 SSO；OAuth 2.0 解决 API 授权；OIDC 是 OAuth 2.0 之上的身份层。新建项目、SPA、移动端优先 OIDC，传统企业应用继续用 SAML。

## 为什么需要 SAML：企业 SSO 场景

设想一家公司用着 Salesforce（CRM）、ServiceNow（ITSM）、Workday（HR）、自建内部 OA 共 4 个独立系统。没有 SSO 时：

- 每个系统独立账号、独立密码 → 用户需记 4 套凭证
- 离职时 IT 需在 4 个系统分别禁用账号 → 容易遗漏
- 弱密码 / 密码复用 → 攻击面分散

引入 SAML + 集中 IdP（如 Azure AD / Okta）后：

- **一次登录**：用户早晨登录 IdP 一次，访问任一 SP 都免密跳转
- **统一账号生命周期**：HR 系统的入职/离职触发 IdP 账号启用/禁用，所有 SP 自动跟随
- **强认证集中**：MFA 在 IdP 一次配置，全公司所有 SP 自动获得 MFA 保护
- **审计集中**：所有 SP 的登录都在 IdP 留痕，符合 SOC 2 / ISO 27001 审计要求

> 这是 SAML 在企业不可替代的根本原因：**集中身份 + 联邦 SSO + 统一审计**。OIDC 也能做，但 SAML 与传统企业应用集成更深、配置工具链更成熟。

## 三角色速览：IdP / SP / Principal

| 角色 | 全称 | 职责 | 典型实现 |
| --- | --- | --- | --- |
| **IdP** | Identity Provider（身份提供方） | 认证 Principal、签发已签名 Assertion、维护用户目录与属性 | Azure AD / Okta / ADFS / OneLogin / Ping Identity / Keycloak / Shibboleth IdP |
| **SP** | Service Provider（服务提供方） | 接收并验证 Assertion、提取 Subject/Attributes、授予业务访问 | Salesforce / ServiceNow / Workday / 自建 Node SP（samlify / passport-saml） |
| **Principal** | 被认证主体 | 通常是终端用户，被 IdP 认证后跨 SP 免密访问 | 浏览器中的用户 |

**信任方向**：SP **信任** IdP 签发的断言（通过预共享 IdP 签名证书），IdP **不**信任 SP。用户身份信息从 IdP 单向流向 SP。

> IdP ≠ OAuth 2.0 的 Authorization Server。IdP 只发身份断言（无 Access Token），Authorization Server 发 Access Token + 可选 ID Token。OIDC 把两者合并在 Provider 中。

## Assertion 速览：身份信息的 XML 容器

SAML Assertion 是 IdP 签发给 SP 的、已签名的 XML 片段，包含 Principal 的认证结果与属性。一条典型断言结构：

```xml
<saml:Assertion ID="_abc123" Version="2.0" IssueInstant="2026-07-27T08:00:00Z">
  <saml:Issuer>https://idp.example.com</saml:Issuer>
  <ds:Signature>...</ds:Signature>
  <saml:Subject>
    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">user-abc</saml:NameID>
    <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <saml:SubjectConfirmationData InResponseTo="_req123" NotOnOrAfter="2026-07-27T08:01:00Z"
        Recipient="https://sp.example.com/acs"/>
    </saml:SubjectConfirmation>
  </saml:Subject>
  <saml:Conditions NotBefore="2026-07-27T07:59:00Z" NotOnOrAfter="2026-07-27T08:05:00Z">
    <saml:AudienceRestriction>
      <saml:Audience>https://sp.example.com</saml:Audience>
    </saml:AudienceRestriction>
  </saml:Conditions>
  <saml:AuthnStatement AuthnInstant="2026-07-27T08:00:00Z" SessionIndex="_sid1">
    <saml:AuthnContext>
      <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
    </saml:AuthnContext>
  </saml:AuthnStatement>
  <saml:AttributeStatement>
    <saml:Attribute Name="email"><saml:AttributeValue>alice@example.com</saml:AttributeValue></saml:Attribute>
    <saml:Attribute Name="role"><saml:AttributeValue>admin</saml:AttributeValue></saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>
```

三类 Statement：

| Statement 类型 | 携带的信息 |
| --- | --- |
| **Authentication Statement** | 认证时间、认证方式（如 PasswordProtectedTransport）、SessionIndex |
| **Attribute Statement** | 用户属性（邮箱、姓名、角色、部门等） |
| **Authorization Decision Statement** | 授权决策（Permit/Deny，实际生产使用较少） |

> **关键安全字段**（SP 必校验）：`InResponseTo`（关联 AuthnRequest ID）、`Destination`（= ACS URL）、`Audience`（= SP EntityID）、`Recipient`（= ACS URL）、`NotBefore`/`NotOnOrAfter`（极短时间窗口，典型 1 分钟）、`OneTimeUse`（一次性使用）。

## SSO 流程速览：SP-Initiated（最常见）

```text
1. 用户访问 SP（https://sp.example.com），未登录
2. SP 生成 AuthnRequest（含 ID、Issuer、ACS URL、NameIDPolicy），通过 HTTP Redirect 重定向到 IdP
3. 浏览器跳转到 https://idp.example.com/SSOService.php?SAMLRequest=...&RelayState=origin-url
4. IdP 检查用户会话：
   - 无会话 → 展示登录页（用户输入凭证，可选 MFA）
   - 有会话 → 跳过登录
5. IdP 构造 Response（含已签名 Assertion、InResponseTo=步骤2 的 ID、Destination=ACS URL），通过 HTTP POST 表单回传 SP 的 ACS URL
6. 浏览器自动 POST 表单到 https://sp.example.com/acs（SAMLResponse + RelayState）
7. SP 验证：
   - Response/Assertion 的 XML 签名（用预共享 IdP 证书）
   - InResponseTo 关联（防 Replay）
   - Destination=自身 ACS URL、Audience=自身 EntityID、Recipient=自身 ACS URL
   - NotBefore/NotOnOrAfter 时间窗口
   - Assertion ID 去重缓存
8. SP 提取 NameID + Attributes，建立业务会话（Cookie 或 JWT）
9. 重定向到 RelayState 指定的原始 URL，用户开始使用 SP
```

**IdP-Initiated 变体**：用户从 IdP 门户点击 SP 应用 → IdP 直接构造 Response 跳转 SP（无 AuthnRequest）。这种模式少了 `InResponseTo` 关联，是 Replay 攻击的高发场景，SP 必须更严格校验 `Destination` / `Audience` / `Recipient`。

## Bindings 速览：消息如何传输

| Binding | 编码方式 | 传递方式 | 签名要求 | 适用 |
| --- | --- | --- | --- | --- |
| **HTTP Redirect** | DEFLATE 编码 → Base64 → URL query（`SAMLRequest`） | HTTP 302 重定向 | 整条 URL 可单独签名（少用，因 URL 长度受限） | 短消息（AuthnRequest、LogoutRequest） |
| **HTTP POST** | Base64 编码 → HTML 表单隐藏字段（`SAMLResponse`） | 表单自动 POST | **断言必须签名**（POST 传递的内容是断言本体） | 长消息（含已签名 Assertion 的 Response） |
| **HTTP Artifact** | 仅传固定长度 artifact（如 `AAQAAMh48/...`） | GET 或 POST 传 artifact | Artifact 解析通道（SOAP）独立签名 | 断言过大或不想暴露给浏览器的场景 |
| **SAML SOAP** | SOAP 信封 | HTTP SOAP | 整条 SOAP 可签名 | 后端直连（ArtifactResolve、AttributeQuery） |
| **PAOS / ECP** | 反向 SOAP | HTTP `Accept: application/vnd.paos+xml` | 同 SOAP | 增强客户端（非浏览器场景） |

**典型组合**：

- **SP → IdP**：HTTP Redirect（传 AuthnRequest，消息短）
- **IdP → SP**：HTTP POST（传含已签名 Assertion 的 Response，消息长且必须签名）

> 不要混淆 Binding 与 Profile。Binding 是「消息怎么传」，Profile 是「组合哪些 Binding 完成什么场景」（如 Web Browser SSO Profile = HTTP Redirect + HTTP POST 的组合）。

## NameID Format 速览：用户身份标识

| Format | 隐私含义 | 适用场景 |
| --- | --- | --- |
| **transient** | 每次会话生成新随机假名，会话结束销毁 | 最强隐私，IdP-Initiated SSO 常用 |
| **persistent** | 持久假名，按 SP 隔离（同一用户在不同 SP 看到不同 ID） | 需要长期关联用户但跨 SP 不可追踪 |
| **email-address** | 直接用邮箱 | 简单但邮箱可复用、可变更，隐私弱 |
| **X509SubjectName** | 证书 Subject | PKI 强场景 |
| **entity** | 实体标识（用于非人类主体） | 服务间身份 |

> 生产推荐 `persistent` 或 `transient`。`email-address` 虽简单但邮箱变更时跨 SP 关联会断；`transient` 不能跨会话关联同一用户。

## XML 签名速览：防篡改核心

SAML Assertion 的完整性靠 **XML 数字签名（XMLDSig）** 保证。签名结构（enveloped，签名嵌入被签元素内部）：

```xml
<saml:Assertion ID="_abc123">
  <ds:Signature>
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="...xml-c14n11..."/>
      <ds:SignatureMethod Algorithm="...rsa-sha256..."/>
      <ds:Reference URI="#_abc123">
        <ds:Transforms>
          <ds:Transform Algorithm="...enveloped-signature..."/>
          <ds:Transform Algorithm="...xml-c14n11..."/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="...sha256..."/>
        <ds:DigestValue>...</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>...</ds:SignatureValue>
    <ds:KeyInfo>...</ds:KeyInfo>
  </ds:Signature>
  <!-- 实际 Assertion 内容 -->
</saml:Assertion>
```

**两阶段验证**：

1. **Digest 验证**：对 `<ds:Reference URI="#_abc123">` 指向的 Assertion 元素做 C14N 规范化 + enveloped transform（去掉 `<ds:Signature>` 节点本身）后，算 SHA-256 哈希，与 `<ds:DigestValue>` 比对
2. **SignatureValue 验证**：对 `<ds:SignedInfo>` 做 C14N 规范化后，用 IdP 公钥按 `SignatureMethod`（RSA-SHA256）验签

> 任何一阶段失败都必须拒绝。生产实现必须用 `wantAssertionsSigned=true`，因为仅验 Response 级签名挡不住 XSW（攻击者在已签 Response 内注入未签 Assertion）。

## 与 OIDC 的根本差异速览

| 维度 | SAML 2.0 | OIDC（OpenID Connect） |
| --- | --- | --- |
| 数据格式 | XML Assertion | JSON + JWT（JWS 签名） |
| 协议范围 | 纯身份认证 + 属性断言（无 Access Token） | OAuth 2.0 之上，含身份 + 授权（Access Token + ID Token） |
| 元数据 | XML metadata 交换 | `.well-known/openid-configuration` 即时发现 |
| 传输 | 表单 POST + 浏览器重定向 | Authorization Code Flow（GET 重定向 + 后端 token 交换） |
| 主战场 | 传统企业浏览器（Salesforce/政府联邦） | SPA + 移动端 + API-first |

详见 [SAML vs OIDC 对比](./guide-line.md#saml-vs-oidc-六维对比)。

## 下一步

- [深度](./guide-line.md)：Assertion 结构详解、HTTP Redirect/POST/Artifact Binding 对比、XML 签名两阶段验证、XSW/Replay/XXE 攻防、SAML vs OIDC 六维对比、签名证书与算法要求、反模式
- [参考](./reference.md)：角色职责完整表、Binding 完整对比表、NameID/SubjectConfirmation 表、SAML vs OIDC 完整对比表、官方资源
