---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OASIS SAML 2.0 Technical Overview（sstc-saml-tech-overview-2.0）/ SAML 2.0 Bindings（saml-bindings-2.0-os）/ SAML 2.0 Approved Errata 05 / OWASP SAML Security Cheat Sheet / NIST SP 800-131A Rev.2 / RFC 7522 官方文档编写

## 速查

- **协议定位**：SAML 2.0 = 基于 XML 的身份联邦 + SSO 协议（OASIS 2005），不是授权协议（无 Access Token）
- **三角色**：IdP（认证 + 签发断言）/ SP（消费断言 + 授访问）/ Principal（被认证主体）
- **Assertion 三类 Statement**：Authentication（认证方式）/ Attribute（属性）/ Authorization Decision（少用）
- **NameID 五种 Format**：transient / persistent / email-address / X509SubjectName / entity
- **SubjectConfirmation 三种 Method**：bearer（最常用）/ holder-of-key / sender-vouches
- **Bindings**：HTTP Redirect（DEFLATE+URL query）/ HTTP POST（Base64+表单字段，断言必须签名）/ HTTP Artifact（固定长度 artifact + 后端 SOAP）/ SAML SOAP / PAOS/ECP
- **XML 签名**：enveloped + C14N 规范化 + 两阶段验证（Digest + SignatureValue）
- **签名算法**：最低 RSA-SHA-256，**禁 SHA-1**（NIST 2030-12-31 前全面退役）
- **Replay 防御组合拳**：InResponseTo 关联 + Assertion ID 去重缓存 + 极短 NotOnOrAfter（典型 1 分钟）+ OneTimeUse
- **跨 SP 重放防御三字段**：Destination=ACS URL、Audience=SP EntityID、Recipient=ACS URL
- **XSW 防御**：wantAssertionsSigned=true + wantAuthnResponseSigned=true + 绝对 XPath + Reference URI 与业务节点一致
- **签名证书**：独立于 TLS、最长 2 年、HSM 保护、通过 metadata URL 发布、忽略文档内 `<ds:KeyInfo>`
- **TLS 1.2+**：所有 SAML 通信走加密通道
- **Node 主流库**：`tngan/samlify`（默认 RSA-SHA256）/ `@node-saml/passport-saml`（`signatureAlgorithm: 'sha256'`）/ `node-saml/xml-crypto`（XML 签名底层库）
- **完整说明见** [入门](./getting-started.md) / [深度](./guide-line.md)

## 三角色完整职责表

| 角色 | 全称 | 职责 | 关键输出 | 典型实现 |
| --- | --- | --- | --- | --- |
| **IdP** | Identity Provider | 认证 Principal、签发已签名 Assertion、维护用户目录与属性 | `<saml:Assertion>` + `<ds:Signature>` | Azure AD / Okta / ADFS / OneLogin / Ping / Keycloak / Shibboleth IdP |
| **SP** | Service Provider | 接收并验证 Assertion、提取 Subject/Attributes、授予业务访问 | 业务会话（Cookie / JWT） | Salesforce / ServiceNow / Workday / 自建 Node SP（samlify / passport-saml） |
| **Principal** | 被认证主体 | 通常为终端用户，被 IdP 认证后跨 SP 免密访问 | / | 浏览器中的用户 |

## Assertion 顶层结构

| 元素 / 属性 | 含义 | SP 必校验 |
| --- | --- | --- |
| `<saml:Assertion ID>` | 唯一标识 | 是（去重缓存防 Replay） |
| `Version` | 协议版本（2.0） | 是（必须为 2.0） |
| `IssueInstant` | 签发时间（UTC ISO 8601） | 是（推断时效） |
| `<saml:Issuer>` | 签发方 EntityID | **必须**等于可信 IdP EntityID |
| `<ds:Signature>` | XML 签名（enveloped） | **必须**独立验证（wantAssertionsSigned） |
| `<saml:Subject>` | 主体（NameID + SubjectConfirmation） | 是 |
| `<saml:Conditions>` | 有效条件（时间窗口、Audience） | **必须**全部校验 |
| `<saml:AuthnStatement>` | 认证声明 | 是（AuthnContextClassRef 匹配策略） |
| `<saml:AttributeStatement>` | 属性声明 | 应用层消费 |
| `<saml:AuthzDecisionStatement>` | 授权决策（少用） | 应用层判断 |

## NameID Format 完整表

| Format URI | 短名 | 隐私强度 | 适用场景 |
| --- | --- | --- | --- |
| `urn:oasis:names:tc:SAML:2.0:nameid-format:transient` | transient | **最高**（每次会话新假名） | IdP-Initiated SSO、最强隐私 |
| `urn:oasis:names:tc:SAML:2.0:nameid-format:persistent` | persistent | 高（按 SP 隔离持久假名） | 需跨会话关联用户、又怕跨 SP 追踪 |
| `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress` | email-address | 低（邮箱可复用、变更） | 简单内部场景；邮箱变更即关联断裂 |
| `urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName` | X509SubjectName | 中（依赖 PKI） | 证书强身份场景 |
| `urn:oasis:names:tc:SAML:2.0:nameid-format:entity` | entity | N/A | 非人类主体（服务间身份） |
| `urn:oasis:names:tc:SAML:2.0:nameid-format:unspecified` | unspecified | 最弱 | 兼容老系统 |

## SubjectConfirmation Method 完整表

| Method URI | 短名 | 安全强度 | 适用场景 |
| --- | --- | --- | --- |
| `urn:oasis:names:tc:SAML:2.0:cm:bearer` | bearer | 中（持有即用） | 浏览器 SSO（事实标准，95% 部署） |
| `urn:oasis:names:tc:SAML:2.0:cm:holder-of-key` | holder-of-key | **最高**（须证明掌握密钥） | 高敏感场景、ECP/PAOS |
| `urn:oasis:names:tc:SAML:2.0:cm:sender-vouches` | sender-vouches | 低（依赖发送方担保） | 中间代理场景，少用 |

## AuthnContextClassRef 常见取值

| ClassRef URI | 含义 |
| --- | --- |
| `urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport` | 用户名密码 + TLS |
| `urn:oasis:names:tc:SAML:2.0:ac:classes:Password` | 仅用户名密码（无 TLS） |
| `urn:oasis:names:tc:SAML:2.0:ac:classes:TimesyncToken` | 时间同步 MFA（TOTP 类） |
| `urn:oasis:names:tc:SAML:2.0:ac:classes:Smartcard` | 智能卡 PKI |
| `urn:oasis:names:tc:SAML:2.0:ac:classes:SmartcardPKI` | 智能卡 PKI（细化） |
| `urn:oasis:names:tc:SAML:2.0:ac:classes:Kerberos` | Kerberos 票据 |
| `urn:oasis:names:tc:SAML:2.0:ac:classes:Unspecified` | IdP 不透露（最弱） |

## Bindings 完整对比表

| Binding | 编码方式 | 传递方式 | 签名要求 | 长度限制 | 典型用途 |
| --- | --- | --- | --- | --- | --- |
| **HTTP Redirect** | DEFLATE + Base64 + URL query | HTTP 302 重定向 | URL 可单独签名（少用） | **是**（URL ~2000-8000 字节） | AuthnRequest、LogoutRequest（短消息） |
| **HTTP POST** | Base64 + HTML 表单隐藏字段 | 浏览器自动 POST 表单 | **断言必须签名** | 否 | 含已签名 Assertion 的 Response |
| **HTTP Artifact** | 固定长度 artifact | GET 或 POST 传 artifact | Artifact 解析通道（SOAP）独立签名 | 否（artifact 固定长度） | 极敏感场景、断言过大 |
| **SAML SOAP** | SOAP 信封 | HTTP SOAP（后端直连） | 整条 SOAP 可签名 | 否 | ArtifactResolve、AttributeQuery、NameIDMapping |
| **PAOS / ECP** | 反向 SOAP | HTTP `Accept: application/vnd.paos+xml` | 同 SOAP | 否 | 非浏览器客户端（ECP） |

### HTTP Redirect 编码流程

```text
1. SAML 消息 XML → UTF-8 字节
2. DEFLATE 压缩（zlib，无压缩头）
3. Base64 编码
4. URL 编码（percent-encoding）
5. 拼为 URL query：?SAMLRequest=...&RelayState=...
6. 浏览器 302 重定向
```

### HTTP POST 编码流程

```text
1. SAML 消息 XML → UTF-8 字节
2. Base64 编码（不 DEFLATE）
3. 放入 HTML 表单隐藏字段 SAMLResponse
4. 浏览器自动 POST 到目标 URL
```

## SP 必校验字段汇总

| 字段 | 位置 | 期望值 | 拒绝规则 |
| --- | --- | --- | --- |
| `<saml:Issuer>`（Response） | Response | 可信 IdP EntityID | 不在白名单立即拒绝 |
| `<saml:Issuer>`（Assertion） | Assertion | 同 IdP EntityID | 不匹配立即拒绝 |
| `<ds:Signature>`（Response） | Response | 验签通过 | wantAuthnResponseSigned=true |
| `<ds:Signature>`（Assertion） | Assertion | 验签通过 | wantAssertionsSigned=true |
| `InResponseTo`（Response） | Response | 之前发出的 AuthnRequest ID | 不匹配立即拒绝（IdP-Initiated 例外） |
| `InResponseTo`（SubjectConfirmationData） | Assertion 内 | 同上 | 同上 |
| `Destination`（Response） | Response | SP 的 ACS URL | 不匹配立即拒绝（防跨 SP 重放） |
| `Audience`（AudienceRestriction） | Conditions | SP 的 EntityID | 不包含立即拒绝（防跨 SP 重放） |
| `Recipient`（SubjectConfirmationData） | Assertion 内 | SP 的 ACS URL | 不匹配立即拒绝（防跨 SP 重放） |
| `NotBefore` / `NotOnOrAfter` | Conditions | 当前时间在窗口内 | 超出立即拒绝（典型窗口 1 分钟） |
| `ID`（Assertion） | Assertion | 不在去重缓存 | 重复立即拒绝（防 Replay） |
| `<samlp:Status>` | Response | `Success` | 非 Success 按错误处理 |

## XML 签名算法与状态

| 算法 URI | 短名 | NIST 状态 | samlify/passport-saml 默认 |
| --- | --- | --- | --- |
| `http://www.w3.org/2001/04/xmldsig-more#rsa-sha256` | RSA-SHA-256 | **接受**（推荐） | samlify 默认 |
| `http://www.w3.org/2001/04/xmldsig-more#rsa-sha384` | RSA-SHA-384 | 接受 | 可选 |
| `http://www.w3.org/2001/04/xmldsig-more#rsa-sha512` | RSA-SHA-512 | 接受 | 可选 |
| `http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256` | ECDSA-SHA-256 | 接受 | 可选 |
| `http://www.w3.org/2000/09/xmldsig#rsa-sha1` | RSA-SHA-1 | **禁用**（2030-12-31 前全面退役） | 不推荐 |
| `http://www.w3.org/2000/09/xmldsig#dsa-sha1` | DSA-SHA-1 | **禁用** | 不推荐 |
| `http://www.w3.org/2000/09/xmldsig#hmac-sha1` | HMAC-SHA-1 | 禁用于签名 | 不推荐 |

| DigestMethod URI | 短名 | 状态 |
| --- | --- | --- |
| `http://www.w3.org/2001/04/xmlenc#sha256` | SHA-256 | **推荐** |
| `http://www.w3.org/2001/04/xmldsig-more#sha384` | SHA-384 | 接受 |
| `http://www.w3.org/2001/04/xmlenc#sha512` | SHA-512 | 接受 |
| `http://www.w3.org/2000/09/xmldsig#sha1` | SHA-1 | **禁用** |

## SAML vs OIDC 完整对比表

| 维度 | SAML 2.0 | OIDC（OpenID Connect） |
| --- | --- | --- |
| **发布年份** | 2005（OASIS） | 2014（OpenID Foundation） |
| **数据格式** | XML Assertion | JSON + JWT（JWS 签名） |
| **协议范围** | 纯身份认证 + 属性断言（无 Access Token） | OAuth 2.0 之上的身份层，含 Access Token + ID Token + 授权 |
| **协议角色** | IdP / SP / Principal | OP（OpenID Provider）/ RP（Relying Party）/ End-User |
| **元数据交换** | XML metadata 互换（预共享 XML） | `.well-known/openid-configuration` 即时发现 + JWKS |
| **传输流程** | 表单 POST + 浏览器重定向 | Authorization Code Flow（GET 重定向 + 后端 token 端点交换） |
| **签名机制** | XMLDSig（enveloped + C14N） | JWS（Compact Serialization，Base64URL） |
| **签名算法** | RSA-SHA-256（默认）/ ECDSA-SHA-256 | RS256 / ES256 / PS256 |
| **吊销** | 难（短时效，无标准吊销协议；SLO 不保证传播） | Refresh Token 轮换 + 复用检测（RFC 9700） |
| **属性传递** | `<AttributeStatement>` 内多个 `<saml:Attribute>` | ID Token claims + UserInfo 端点 + 标准 claims（sub/email/profile） |
| **典型场景** | 传统企业浏览器（Salesforce / ServiceNow / 政府联邦） | SPA + 移动端 + API-first |
| **元数据复杂度** | 高（XML、命名空间、签名证书嵌入） | 低（JSON、JWKS、自动发现） |
| **API 授权** | 无（需另接 OAuth 2.0 或 RFC 7522） | 内建（Access Token + scopes） |
| **PKCE 支持** | 无（依赖 TLS） | Authorization Code Flow + PKCE（RFC 7636） |
| **库实现（Node）** | samlify / passport-saml / xml-crypto | jose / jsonwebtoken / openid-client / panva/oauth4webapi |
| **库实现（Java）** | java-saml / OpenSAML | nimbus-jose-jwt / pac4j |
| **库实现（Python）** | python3-saml / PySAML2 | authlib / python-jose |
| **元数据发布** | 通过 metadata URL（受 TLS 保护） | `.well-known/openid-configuration` |
| **会话管理** | IdP session + SP session（独立） | IdP session + RP session（独立）+ 前端/后端通道退出 |
| **Single Logout** | SAML SLO Profile（不保证传播） | OIDC RP-Initiated Logout / Back-Channel Logout |
| **响应大小** | 大（几 KB，XML + 签名） | 小（几百字节，JWT） |
| **学习曲线** | 陡（XML、命名空间、签名、绑定、profile） | 平缓（JSON、REST） |

## 常见 IdP 厂商对照

| 厂商 | EntityID 示例 | 备注 |
| --- | --- | --- |
| Azure AD（Entra ID） | `https://login.microsoftonline.com/<tenant-id>/` | 同时支持 SAML 与 OIDC，跨应用协调 |
| Okta | `http://www.okta.com/exk<id>` | 同时支持 SAML 与 OIDC |
| ADFS | `https://adfs.example.com/federationmetadata/2007-06/federationmetadata.xml` | Microsoft 自建 IdP |
| OneLogin | `https://app.onelogin.com/saml/metadata/<app-id>` | 同时支持 SAML 与 OIDC |
| Ping Identity | `https://ping.example.com/idp/samlmetadata` | 企业级 |
| Keycloak | `https://keycloak.example.com/realms/<realm>` | 开源，同时支持 SAML 与 OIDC |
| Shibboleth IdP | `https://idp.example.com/idp/shibboleth` | 学术 / 政府联邦主流 |
| Google Workspace | `https://accounts.google.com/o/saml2?idpid=<id>` | 仅 SAML（OIDC 是另一产品） |

## 典型代码片段

### samlify SP 配置

```ts
import * as samlify from 'samlify';

// SP 配置（关键安全开关）
export const sp = samlify.ServiceProvider({
  entityID: 'https://sp.example.com/metadata',
  authnRequestsSigned: true,
  wantAssertionsSigned: true,           // ★ 强制断言独立签名
  wantMessageSigned: true,              // ★ 强制 Response 签名
  requestSignatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
  wantLogoutResponseSigned: true,
  wantLogoutRequestSigned: true,
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://sp.example.com/acs',
  }],
});

// IdP 配置（预共享 metadata）
export const idp = samlify.IdentityProvider({
  metadata: fs.readFileSync('./idp-metadata.xml'),
});
```

### samlify 处理登录请求与响应

```ts
import { sp, idp } from './saml-config';

// SP → IdP：生成 AuthnRequest URL
app.get('/saml/login', async (req, res) => {
  const { id, context } = sp.createLoginRequest(idp, 'redirect');
  req.session.authnRequestId = id;  // ★ 保存请求 ID 用于 InResponseTo 校验
  res.redirect(context);
});

// IdP → SP：ACS 端点接收 Response
app.post('/acs', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { extract, samlContentXml } = await sp.parseLoginResponse(idp, 'post', req);
    // ★ samlify 已自动验证 Response 签名 + Assertion 签名 + InResponseTo + Destination/Audience
    // 但 Assertion ID 去重需应用层维护
    const assertionId = extract.request.id; // 实际字段以库版本为准
    if (await redis.get(`saml:assertion:${assertionId}`)) {
      return res.status(401).send('Replay detected');
    }
    await redis.set(`saml:assertion:${assertionId}`, '1', 'EX', 600);

    // 提取 NameID + Attributes
    req.session.user = {
      nameID: extract.nameID,
      email: extract.attributes['email'],
      role: extract.attributes['role'],
    };
    res.redirect(extract.relaysate || '/dashboard');
  } catch (e) {
    res.status(401).send('SAML validation failed');
  }
});
```

### passport-saml 策略配置

```ts
import { Strategy as SAMLStrategy } from '@node-saml/passport-saml';

passport.use(new SAMLStrategy(
  {
    entryPoint: 'https://idp.example.com/SSOService.php',
    issuer: 'https://sp.example.com',
    callbackUrl: 'https://sp.example.com/acs',
    cert: fs.readFileSync('idp-signing-cert.pem', 'utf-8'), // ★ 预共享 IdP 签名证书
    signatureAlgorithm: 'sha256',                            // ★ 强制 SHA-256
    wantAssertionsSigned: true,                              // ★ 强制断言独立签名
    wantAuthnResponseSigned: true,                           // ★ 强制 Response 签名
    acceptedClockSkewMs: 60000,                              // 时钟偏差容忍（毫秒）
    disableRequestedAuthnContext: false,
    passReqToCallback: true,
  },
  (req, profile, done) => {
    // Assertion ID 去重
    const assertionId = profile.sessionIndex; // 字段以库版本为准
    return checkReplayCache(assertionId)
      .then(() => done(null, profile))
      .catch(done);
  },
));
```

### XXE 防御（Node libxmljs2）

```ts
import { parseXml } from 'libxmljs2';

// ★ 禁用 DTD 处理防 XXE
const doc = parseXml(samlResponseXml, {
  dtdload: false,    // 不加载外部 DTD
  dtdvalid: false,   // 不验证 DTD
  noent: false,      // ★ 不展开实体（防 XXE）
  nocdata: true,
});
```

## 攻击与防御对照表

| 攻击 | 根因 | 防御组合拳 |
| --- | --- | --- |
| **XSW（XML Signature Wrapping）** | 签名验证库与应用数据提取使用不同节点集 | wantAssertionsSigned=true + wantAuthnResponseSigned=true + 绝对 XPath + Reference URI 与业务节点一致 + 同一组件签名验证与数据提取 |
| **Replay** | 同一有效断言被重复消费 | InResponseTo 关联 + Assertion ID 去重缓存 + 极短 NotOnOrAfter（典型 1 分钟）+ OneTimeUse |
| **跨 SP 重放** | 攻击者从 SP-A 截获断言提交给 SP-B | Destination=ACS URL + Audience=SP EntityID + Recipient=ACS URL 三字段校验 |
| **XXE** | XML 解析器允许 DTD / 外部实体 | 禁用 DTD 处理（noent=false 等）+ TLS 1.2+ |
| **Signature Removal** | SP 只检查「有签名元素」但不实际验签 | 实际跑两阶段签名验证 |
| **SHA-1 弱算法** | 历史实现大量用 rsa-sha1 | 强制 RSA-SHA-256 及以上，NIST 2030-12-31 前全面退役 SHA-1 |
| **KeyInfo 注入** | SP 信任文档内 `<ds:KeyInfo>` 选公钥 | StaticKeySelector / 从预共享 metadata 本地读取证书，忽略文档内 KeyInfo |
| **Open Redirect（RelayState）** | SP 把 RelayState 当重定向目标但未 allowlist | RelayState 若是 URL 须 allowlist 校验 |
| **TLS 降级** | 通信未加密 | 所有 SAML 通信强制 TLS 1.2+ |

## OASIS 规范索引

| 规范 | 全称 | 用途 |
| --- | --- | --- |
| **saml-core-2.0-os** | Assertions and Protocols for SAML 2.0 | 核心规范（Assertion 结构、协议消息） |
| **saml-bindings-2.0-os** | Bindings for SAML 2.0 | 5 种绑定（Redirect/POST/Artifact/SOAP/PAOS） |
| **saml-profiles-2.0-os** | Profiles for SAML 2.0 | Web Browser SSO、SSO、Single Logout、Name Identifier Management 等 Profile |
| **saml-metadata-2.0-os** | Metadata for SAML 2.0 | 元数据结构与签名 |
| **saml-authn-context-2.0-os** | Authentication Context for SAML 2.0 | AuthnContextClassRef 详解 |
| **saml-tech-overview-2.0** | SAML 2.0 Technical Overview | 入门概览（最易读） |
| **sstc-saml-approved-errata-2.0** | Approved Errata 05（2015） | 最新勘误 |

## 版本与生态

| 项 | 取值 |
| --- | --- |
| 核心规范 | OASIS SAML 2.0（2005-03，至今未废弃） |
| 最新勘误 | Approved Errata 05（2015） |
| 下一代主版本 | **无 SAML 3.0**（仅有 SAML-EOA、SAML-ECP 等扩展） |
| 算法底线 | RSA-SHA-256（NIST SP 800-131A Rev.2） |
| SHA-1 退役 | 2030-12-31 前（NIST） |
| Node 主流库 | `tngan/samlify`、`@node-saml/passport-saml`、`node-saml/xml-crypto` |
| Java 主流库 | java-saml、OpenSAML |
| Python 主流库 | python3-saml、PySAML2 |
| 在线工具 | [SAML Developer Tools](https://www.samltool.com/)（编解码、调试） |
| 替代协议 | OpenID Connect（OIDC，2014） |

## 官方资源

- OASIS SAML 2.0 Technical Overview：[docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html](https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- OASIS SAML 2.0 Bindings：[docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf](https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf)
- OASIS SAML 2.0 Approved Errata 05：[docs.oasis-open.org/security/saml/v2.0/sstc-saml-approved-errata-2.0.html](https://docs.oasis-open.org/security/saml/v2.0/sstc-saml-approved-errata-2.0.html)
- OWASP SAML Security Cheat Sheet：[cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html)
- RFC 7522（SAML 2.0 Bearer Profile for OAuth 2.0）：[datatracker.ietf.org/doc/rfc7522](https://datatracker.ietf.org/doc/rfc7522/)
- NIST SP 800-131A Rev.2：[nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar2.pdf](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar2.pdf)
- tngan/samlify：[github.com/tngan/samlify](https://github.com/tngan/samlify)
- @node-saml/passport-saml：[github.com/node-saml/passport-saml](https://github.com/node-saml/passport-saml)
- node-saml/xml-crypto：[github.com/node-saml/xml-crypto](https://github.com/node-saml/xml-crypto)
- SAML Developer Tools（在线）：[samltool.com](https://www.samltool.com/)
