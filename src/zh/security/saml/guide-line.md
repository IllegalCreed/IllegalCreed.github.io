---
layout: doc
outline: [2, 3]
---

# 深度

> 基于 OASIS SAML 2.0 Technical Overview（sstc-saml-tech-overview-2.0）/ SAML 2.0 Bindings（saml-bindings-2.0-os）/ SAML 2.0 Approved Errata 05 / OWASP SAML Security Cheat Sheet / NIST SP 800-131A Rev.2 / RFC 7522 官方文档编写

## 速查

- **三角色**：IdP（认证 + 签发断言）/ SP（消费断言 + 授访问）/ Principal（被认证主体）
- **Assertion 三类 Statement**：Authentication（认证方式如 PasswordProtectedTransport）/ Attribute（属性）/ Authorization Decision（授权决策，少用）
- **NameID 五种 Format**：transient（临时假名）/ persistent（按 SP 隔离的持久假名）/ email-address / X509SubjectName / entity
- **SubjectConfirmation 三种 Method**：bearer（持有即用，最常用）/ holder-of-key（须证明掌握密钥）/ sender-vouches（发送方担保）
- **Bindings 五种**：HTTP Redirect（DEFLATE+URL query，短消息）/ HTTP POST（Base64+表单字段，断言必须签名）/ HTTP Artifact（固定长度 artifact + 后端 SOAP）/ SAML SOAP / PAOS/ECP
- **XML 签名 enveloped + C14N**：`<ds:Signature>` 嵌入 Assertion 内，`<ds:Reference URI=#ID>` + `<ds:DigestValue>` + `<ds:SignatureValue>` + `<ds:KeyInfo>`
- **两阶段签名验证**：①Digest（对 Reference 指向元素 C14N + enveloped transform 后算哈希）②SignatureValue（对 C14N 后的 SignedInfo 用公钥验签）
- **XSW 攻击根因**：签名验证库与应用数据提取使用不同节点集；防御 = wantAssertionsSigned + 绝对 XPath + Reference URI 与业务节点一致
- **Replay 防御组合拳**：InResponseTo 关联 + Assertion ID 去重缓存 + 极短 NotOnOrAfter（典型 1 分钟）+ OneTimeUse
- **跨 SP 重放防御三字段**：Destination=ACS URL、Audience=SP EntityID、Recipient=ACS URL
- **签名算法**：最低 RSA-SHA-256，**禁 SHA-1**（NIST SP 800-131A Rev.2 已禁，2030-12-31 前全面退役）
- **签名密钥**：HSM 保护、证书独立于 TLS、最长 2 年、EKU 设 id-kp-documentSigning、KU 仅 digitalSignature、通过 metadata URL 发布、忽略文档内 `<ds:KeyInfo>`
- **RelayState**：携带 SP 上下文，IdP 须原样返回；若是 URL 须 allowlist，防 Open Redirect
- **XML 解析器禁 DTD**：防 XXE
- **TLS 1.2+**：所有 SAML 通信走加密通道
- **反模式**：仅验 Response 级签名 / 用 getElementsByTagName / SHA-1 / 信任文档内 KeyInfo / 跳过 InResponseTo/Destination/Audience/Recipient / 不维护 Assertion ID 去重 / TLS 证书兼任 SAML 签名证书 / 邮件交换证书 / DTD 未禁 / SPA 硬上 SAML

## Assertion 结构详解

Assertion 是 IdP 签发的、已签名的 XML 容器，承载 Principal 的认证结果与属性。完整结构如下：

```xml
<saml:Assertion
    ID="_abc123"
    Version="2.0"
    IssueInstant="2026-07-27T08:00:00Z">
  <saml:Issuer>https://idp.example.com</saml:Issuer>
  <ds:Signature>...</ds:Signature>
  <saml:Subject>
    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">user-abc</saml:NameID>
    <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <saml:SubjectConfirmationData
          InResponseTo="_req123"
          NotOnOrAfter="2026-07-27T08:01:00Z"
          Recipient="https://sp.example.com/acs"/>
    </saml:SubjectConfirmation>
  </saml:Subject>
  <saml:Conditions
      NotBefore="2026-07-27T07:59:00Z"
      NotOnOrAfter="2026-07-27T08:05:00Z">
    <saml:AudienceRestriction>
      <saml:Audience>https://sp.example.com</saml:Audience>
    </saml:AudienceRestriction>
    <saml:OneTimeUse/>
  </saml:Conditions>
  <saml:AuthnStatement
      AuthnInstant="2026-07-27T08:00:00Z"
      SessionIndex="_sid1">
    <saml:AuthnContext>
      <saml:AuthnContextClassRef>
        urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport
      </saml:AuthnContextClassRef>
    </saml:AuthnContext>
  </saml:AuthnStatement>
  <saml:AttributeStatement>
    <saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
      <saml:AttributeValue>alice@example.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="role">
      <saml:AttributeValue>admin</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>
```

### 顶层属性

| 属性 | 含义 |
| --- | --- |
| `ID` | Assertion 唯一标识，**SP 必须去重缓存防 Replay** |
| `Version` | 协议版本，固定 `2.0` |
| `IssueInstant` | 签发时间（UTC，ISO 8601） |

### Subject 块

| 子元素 | 含义 |
| --- | --- |
| `<saml:NameID>` | Principal 的标识符，Format 决定类型 |
| `<saml:SubjectConfirmation Method>` | 主体确认方式（bearer / holder-of-key / sender-vouches） |
| `<saml:SubjectConfirmationData>` | 含 `InResponseTo`、`NotOnOrAfter`、`Recipient`，**SP 必校验** |

### Conditions 块

| 子元素 | 含义 | SP 校验 |
| --- | --- | --- |
| `NotBefore` / `NotOnOrAfter` | 有效时间窗口 | 当前时间必须在窗口内（典型窗口 1 分钟） |
| `<AudienceRestriction>` | 受众限制 | `<Audience>` **必须**等于 SP 的 EntityID，否则拒绝 |
| `<OneTimeUse>` | 一次性使用提示 | SP 应维护 Assertion ID 去重缓存 |
| `<ProxyRestriction>` | 限制进一步代理 | 应用层判断 |

### AuthnStatement 块

| 子元素 / 属性 | 含义 |
| --- | --- |
| `AuthnInstant` | 认证发生时间 |
| `SessionIndex` | 会话索引，用于 Single Logout |
| `<AuthnContextClassRef>` | 认证方式（如 `PasswordProtectedTransport`、`InternetProtocolPassword`、多因素 `urn:oasis:names:tc:SAML:2.0:ac:classes:TimeSyncToken`） |

> **AuthnContextClassRef 速记**：`PasswordProtectedTransport` = 用户名密码 + TLS；`TimesyncToken` = TOTP 类时间同步 MFA；`Smartcard` = 智能卡 PKI；`Unspecified` = IdP 不透露（最弱）。

### AttributeStatement 块

承载用户属性（邮箱、姓名、角色、部门等）。属性命名空间常用 `urn:oasis:names:tc:SAML:2.0:attrname-format:basic` 或自定义 URI（如 `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` 是 Azure AD / ADFS 的事实标准）。

## NameID Format 深度

| Format URI | 短名 | 隐私强度 | 适用场景 |
| --- | --- | --- | --- |
| `...:nameid-format:transient` | transient | **最高**（每次会话新假名） | IdP-Initiated SSO、最强隐私 |
| `...:nameid-format:persistent` | persistent | 高（按 SP 隔离的持久假名） | 需跨会话关联用户、又怕跨 SP 追踪 |
| `...:nameid-format:email-address` | email-address | 低（邮箱可复用、可变更） | 简单场景；邮箱变更即关联断裂 |
| `...:nameid-format:X509SubjectName` | X509SubjectName | 中（依赖 PKI） | 证书强身份场景 |
| `...:nameid-format:entity` | entity | N/A | 非人类主体（服务间身份） |

**生产推荐**：`persistent`（默认）或 `transient`（强隐私）。`email-address` 仅在 SP 属性映射简单、不在乎邮箱变更的内部系统使用。

## SubjectConfirmation Method 深度

| Method URI | 短名 | 安全强度 | 适用场景 |
| --- | --- | --- | --- |
| `...:cm:bearer` | bearer | 中（持有即用，最常用） | 浏览器 SSO（依赖 TLS + 时间窗口 + Replay 缓存） |
| `...:cm:holder-of-key` | holder-of-key | **最高**（须证明掌握密钥） | 高敏感场景（客户端证书绑定） |
| `...:cm:sender-vouches` | sender-vouches | 低（依赖发送方担保） | 中间代理场景，少用 |

> `bearer` 是 Web Browser SSO 的事实标准；`holder-of-key` 在 ECP/PAOS 等非浏览器场景才有意义。生产中 95% 的 SAML 部署都是 `bearer`。

## AuthnRequest / Response 协议详解

### AuthnRequest（SP → IdP）

```xml
<samlp:AuthnRequest
    ID="_req123"
    Version="2.0"
    IssueInstant="2026-07-27T08:00:00Z"
    Destination="https://idp.example.com/SSOService.php"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
    AssertionConsumerServiceURL="https://sp.example.com/acs">
  <saml:Issuer>https://sp.example.com</saml:Issuer>
  <samlp:NameIDPolicy
      Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient"
      AllowCreate="true"/>
  <samlp:RequestedAuthnContext Comparison="minimum">
    <saml:AuthnContextClassRef>
      urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport
    </saml:AuthnContextClassRef>
  </samlp:RequestedAuthnContext>
</samlp:AuthnRequest>
```

**关键字段**：

| 字段 | 含义 | 重要点 |
| --- | --- | --- |
| `ID` | 请求 ID | **Response 的 InResponseTo 必须引用它**，SP 用于关联 |
| `Destination` | 目标 IdP SSO URL | 必须匹配 IdP metadata |
| `ProtocolBinding` | 期望的 Response 传输方式 | 通常 HTTP POST |
| `AssertionConsumerServiceURL` | SP 接收 Response 的 URL | 必须与 metadata 一致 |
| `<saml:Issuer>` | SP 的 EntityID | IdP 用于查 SP metadata |
| `<NameIDPolicy>` | 期望的 NameID Format | `AllowCreate=true` 允许 IdP 创建新假名 |

### Response（IdP → SP）

```xml
<samlp:Response
    ID="_resp456"
    Version="2.0"
    IssueInstant="2026-07-27T08:00:00Z"
    Destination="https://sp.example.com/acs"
    InResponseTo="_req123">
  <saml:Issuer>https://idp.example.com</saml:Issuer>
  <ds:Signature>...</ds:Signature>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion>...</saml:Assertion>
</samlp:Response>
```

**SP 必校验项**：

| 字段 | 校验规则 |
| --- | --- |
| `InResponseTo` | **必须**等于之前发出的 AuthnRequest ID（IdP-Initiated 例外） |
| `Destination` | **必须**等于自身 ACS URL |
| `<saml:Issuer>` | **必须**等于可信 IdP EntityID |
| `<samlp:Status>` | 必须为 `Success` |
| `<ds:Signature>` | Response 整体签名验证（wantMessageSigned） |
| `<saml:Assertion>` 内的 `<ds:Signature>` | **必须**独立验证（wantAssertionsSigned=true） |
| Assertion `Conditions`/`SubjectConfirmation` | 时间窗口、Audience、Recipient、InResponseTo |

## Bindings 深度对比

### HTTP Redirect Binding（适合短消息）

**编码流程**：

```text
1. SAML 消息（如 AuthnRequest XML）序列化为 UTF-8 字节
2. DEFLATE 压缩（zlib，无压缩头）
3. Base64 编码
4. URL 编码（percent-encoding）
5. 作为 URL query 参数（SAMLRequest 或 SAMLResponse）
6. 浏览器 HTTP 302 重定向到 IdP/SP URL
```

**特点**：

- 受 URL 长度限制（浏览器约 2000-8000 字节），不适合长 Response
- **签名不能放在 SAMLRequest URL 内**（URL 易被截获/篡改），通常用独立的 `SigAlg` + `Signature` query 参数对整条 query 做签名（少用）
- 主要用于 AuthnRequest（SP → IdP）和 LogoutRequest

### HTTP POST Binding（断言必须签名）

**编码流程**：

```text
1. SAML 消息（如 Response XML）序列化为 UTF-8 字节
2. Base64 编码（不 DEFLATE）
3. 放入 HTML 表单隐藏字段（SAMLRequest 或 SAMLResponse）
4. 浏览器自动 POST 到目标 URL（Content-Type: application/x-www-form-urlencoded）
```

**HTML 表单示例**：

```html
<form method="POST" action="https://sp.example.com/acs">
  <input type="hidden" name="SAMLResponse" value="PHNhbWxwOlJlc3BvbnNl..."/>
  <input type="hidden" name="RelayState" value="/dashboard"/>
  <input type="submit" value="Continue"/>
</form>
<script>document.forms[0].submit();</script>
```

**特点**：

- 不受 URL 长度限制，适合含已签名 Assertion 的长 Response
- **断言必须签名**（POST 传递的内容是断言本体）
- 是 IdP → SP 传递 Response 的主流方式

### HTTP Artifact Binding（避免暴露断言给浏览器）

**流程**：

```text
1. 发送方生成短 artifact（如 AAQAAMh48/...，固定长度）
2. 通过 GET 或 POST 把 artifact 传给接收方
3. 接收方用 SOAP ArtifactResolve 向发送方换真实 SAML 消息
4. 接收方拿到真实消息后正常处理
```

**特点**：

- 断言不经过浏览器，**最适合极敏感场景**或断言过大的情况
- 增加一次后端 SOAP 往返，延迟与复杂度高
- 生产中使用较少

### SAML SOAP / PAOS / ECP

- **SAML SOAP Binding**：后端直连场景（如 ArtifactResolve、AttributeQuery），消息包在 SOAP 信封内
- **PAOS（Reverse SOAP）**：客户端通过 `Accept: application/vnd.paos+xml` 头表明自己能处理反向 SOAP
- **ECP（Enhanced Client Profile）**：非浏览器场景（如命令行、桌面客户端）的 SSO，配合 PAOS 使用

## Web Browser SSO Profile 完整流程

把上面的 AuthnRequest + Response + HTTP Redirect + HTTP POST 串起来：

```text
┌────────┐                ┌────────┐                ┌────────┐
│ User   │                │  SP    │                │  IdP   │
│ Agent  │                │example │                │example │
└───┬────┘                └───┬────┘                └───┬────┘
    │ 1. GET /dashboard       │                         │
    │─────────────────────────>                         │
    │                         │                         │
    │ 2. 302 Redirect         │                         │
    │   Location: idp/SSO?SAMLRequest=...               │
    │<─────────────────────────                         │
    │                         │                         │
    │ 3. GET idp/SSO?SAMLRequest=...                    │
    │───────────────────────────────────────────────────>│
    │                                                   │
    │                         4. IdP 检查 session       │
    │                         (无 session → 登录页)     │
    │                                                   │
    │ 5. IdP 构造 Response + 签名                       │
    │                                                   │
    │ 6. 返回 HTML form (auto-POST to sp/acs)           │
    │<───────────────────────────────────────────────────│
    │                                                   │
    │ 7. POST sp/acs  (SAMLResponse + RelayState)       │
    │─────────────────────────>                         │
    │                         │                         │
    │                         8. SP 验证签名            │
    │                         InResponseTo              │
    │                         Destination/Audience       │
    │                         NotBefore/NotOnOrAfter    │
    │                         Assertion ID 去重         │
    │                         │                         │
    │ 9. 302 Redirect to RelayState (/dashboard)        │
    │<─────────────────────────                         │
    │                                                   │
```

## XML 签名详解：Enveloped + C14N

### Enveloped 签名结构

```xml
<saml:Assertion ID="_abc123">
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <ds:Reference URI="#_abc123">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
          <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>base64...</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>base64...</ds:SignatureValue>
    <ds:KeyInfo>
      <ds:X509Data>
        <ds:X509Certificate>base64...</ds:X509Certificate>
      </ds:X509Data>
    </ds:KeyInfo>
  </ds:Signature>
  <!-- Assertion 实际内容（Subject/Conditions/AuthnStatement/AttributeStatement） -->
</saml:Assertion>
```

**关键点**：

- `URI="#_abc123"`：引用被签 Assertion 的 ID（**SP 必须验证此 URI 指向业务读取的同一节点**，防 XSW）
- `CanonicalizationMethod`：C14N 算法（`xml-c14n11` 或 `xml-exc-c14n#`），XML 文档物理表示可能不同（空白、命名空间声明位置），C14N 规范化保证签名可复现
- `SignatureMethod`：签名算法（**RSA-SHA256** 强制，禁用 RSA-SHA1）
- `DigestMethod`：哈希算法（**SHA-256** 强制，禁用 SHA-1）
- `enveloped-signature` Transform：从被签元素中**移除 `<ds:Signature>` 节点本身**后再算哈希（签名不能签自己）

### 两阶段验证详解

```text
阶段一：Digest 验证（Reference 完整性）
1. 解析 <ds:Reference URI="#_abc123">，找到 ID=_abc123 的 Assertion 元素
2. 对该 Assertion 元素应用 Transforms：
   a. enveloped-signature：移除 <ds:Signature> 子节点
   b. xml-exc-c14n：C14N 规范化为字节流
3. 对规范化后的字节流算 SHA-256
4. 比对计算结果与 <ds:DigestValue>，不匹配则拒绝

阶段二：SignatureValue 验证（签名完整性）
1. 对 <ds:SignedInfo> 元素应用 CanonicalizationMethod（C14N）
2. 用 IdP 公钥按 SignatureMethod（RSA-SHA256）验签
3. 比对计算结果与 <ds:SignatureValue>，不匹配则拒绝

两阶段都通过 = 签名有效
```

> **阶段一失败或阶段二失败都必须拒绝**。许多 XSW 漏洞根因是只做阶段二（验 SignedInfo 的签名）但跳过阶段一（Reference 完整性）。

## XSW（XML Signature Wrapping）攻击

### 攻击原理

XSW 利用「签名验证库」与「应用数据提取」使用**不同 XML 节点集**的架构性漏洞：

```text
攻击者构造的恶意 Response：
<samlp:Response>
  <ds:Signature>
    <ds:SignedInfo>
      <ds:Reference URI="#original-assertion">  ← 签名校验这个
        ...
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>...</ds:SignatureValue>
  </ds:Signature>
  <saml:Assertion ID="original-assertion">  ← 原始（合法的）Assertion，签名验证通过
    <!-- 合法内容 -->
  </saml:Assertion>
  <saml:Assertion ID="evil-assertion">  ← 攻击者注入的恶意 Assertion
    <saml:Subject><saml:NameID>admin@attacker.com</saml:NameID></saml:Subject>
    <!-- 攻击者构造的 admin 身份 -->
  </saml:Assertion>
</samlp:Response>

签名库：遍历到第一个 Assertion（ID=original），验签通过 ✅
应用代码：用 getElementsByTagName('//saml:Assertion') 提取，拿到的是 evil-assertion ❌
        → 攻击者以 admin 身份登录
```

### 变体

XSW 有多种变体（XSW1/XSW2/XSW3/...），区别在于恶意 Assertion 的注入位置（Signature 前/后、Response 包装等），但**根因相同**：签名验证与业务读取使用不同节点集。

### 防御组合拳

| 防御 | 作用 |
| --- | --- |
| **`wantAssertionsSigned=true`** | 强制每条 Assertion 独立签名，攻击者注入的 evil-assertion 没有合法签名直接拒 |
| **`wantAuthnResponseSigned=true`** | 同时验 Response 级签名 |
| **Reference URI 与业务节点一致性** | 签名库返回已验证的节点集给应用，应用只从该节点集读数据 |
| **绝对 XPath 选择元素** | 禁用 `getElementsByTagName`，改用基于 ID 的引用或 schema 验证后的 XPath |
| **schema 验证**（用本地可信 schema） | 拒绝不符合 SAML schema 的畸形构造（如多个 Assertion 嵌套） |
| **同一组件签名验证 + 数据提取** | 避免不同库节点集不一致 |

> **根因层面**：所有 XSW 漏洞都源于「签名验证库与应用数据提取使用不同组件且节点集不一致」。用同一组件、且应用从签名库返回的已验证节点集读数据是治本方案。

## Replay 攻击与防御

### 攻击场景

攻击者嗅探或截获一条合法的已签名 SAML Response（例如通过日志泄露、中间人、共享浏览器），在 `NotOnOrAfter` 之前**重复提交**给 SP，冒充原用户登录。

### 防御组合拳

| 防御 | 作用 |
| --- | --- |
| **`InResponseTo` 关联** | Response 的 `InResponseTo` 必须等于 SP 此前发出的 AuthnRequest ID；IdP-Initiated 例外但需更严格 `Destination` 校验 |
| **Assertion ID 去重缓存** | SP 维护近期已消费的 Assertion ID 集合（Redis/TTL），重复 ID 立即拒绝 |
| **极短 `NotOnOrAfter`** | IdP→SP 传递典型 1 分钟足够，缩小 Replay 窗口 |
| **`OneTimeUse` 元素** | IdP 在 Conditions 中声明 OneTimeUse，SP 应尊重（语义提示，非强制） |
| **`SubjectConfirmationData InResponseTo`** | 同时校验 SubjectConfirmation 内的 InResponseTo |

> **历史漏洞**：Google SSO 曾因缺失 `InResponseTo` 校验导致 Replay 攻击。`InResponseTo` 是 Replay 防御的**第一道闸**。

### 跨 SP 重放防御三字段

| 字段 | 期望值 | 拒绝规则 |
| --- | --- | --- |
| `Destination`（Response） | SP 的 ACS URL | 不匹配立即拒绝 |
| `Audience`（Conditions 内 AudienceRestriction） | SP 的 EntityID | 不包含 SP 立即拒绝 |
| `Recipient`（SubjectConfirmationData） | SP 的 ACS URL | 不匹配立即拒绝 |

攻击者若从 SP-A 截获一条 Response 提交给 SP-B，三字段任一不匹配即被拒（前提是 SP-B 严格校验）。

## XXE 攻击

### 攻击场景

SAML Response 是 XML，若 SP 的 XML 解析器**未禁用 DTD 处理**，攻击者可在 Response 中嵌入外部实体定义，诱导 SP 读取服务器本地文件（如 `/etc/passwd`、AWS 元数据 `169.254.169.254`）：

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<samlp:Response>
  ...
  <saml:AttributeStatement>
    <saml:Attribute Name="email">
      <saml:AttributeValue>&xxe;</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</samlp:Response>
```

### 防御

- **禁用 XML 解析器 DTD 处理**（Node 的 `libxmljs` 设 `noEnt: true` 反向、Java `DocumentBuilderFactory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)`）
- **禁用外部实体解析**
- **所有 SAML 通信走 TLS 1.2+**

## RelayState 双刃剑

`RelayState` 是 binding-specific 字段，SP 用于携带上下文（如用户原始 URL），IdP 须原样返回。问题在于**它经常被 SP 当作重定向目标**：

```text
SP-Initiated：
用户访问 sp.example.com/dashboard
→ SP 把 RelayState=/dashboard 传给 IdP
→ IdP 回传时 RelayState=/dashboard
→ SP 验证后重定向到 sp.example.com/dashboard

IdP-Initiated：
攻击者诱导用户点击恶意 IdP 链接
→ RelayState=https://attacker.com/phishing
→ 若 SP 未对 RelayState 做 allowlist，直接重定向
→ 开放重定向（Open Redirect），可被钓鱼利用
```

**防御**：

- 若 RelayState 契约是 URL，**必须 allowlist 校验**（仅允许本站相对路径或预定义域名）
- 若 RelayState 是 opaque token，确认 SP 解析时不直接当 URL 用

## Signature Removal 攻击

如果 SP 实现错误——只校验「Response 里有 `<ds:Signature>` 元素」但不实际验签，攻击者可：

1. 截获合法 Response（含签名）
2. 修改断言内容（如改 NameID 为 admin）
3. **保留原始 `<ds:Signature>` 不动**（不重新签名）
4. 提交给 SP
5. SP 看到「有签名元素」即放行

**防御**：实际跑两阶段签名验证，不只检查元素存在。

## SAML vs OIDC 六维对比

| 维度 | SAML 2.0（2005） | OIDC（2014） |
| --- | --- | --- |
| **数据格式** | XML Assertion | JSON + JWT（JWS 签名） |
| **协议范围** | 纯身份认证 + 属性断言（**无 Access Token**、无授权框架） | OAuth 2.0 之上的身份层，含 Access Token + ID Token + 授权 |
| **元数据交换** | XML metadata 互换（预共享 XML 文件） | `.well-known/openid-configuration` 即时发现 + JWKS 端点 |
| **传输流程** | 表单 POST + 浏览器重定向（XML 携带在 SAMLResponse） | Authorization Code Flow（GET 重定向 + 后端 token 端点交换） |
| **典型场景** | 传统企业浏览器（Salesforce/ServiceNow/政府联邦） | SPA + 移动端 + API-first |
| **签名强度** | XMLDSig（enveloped + C14N） | JWS（RSA-SHA256 / ECDSA） |
| **吊销** | 难（断言短时效，无标准吊销协议，SLO 不保证传播） | Refresh Token 轮换 + 复用检测（RFC 9700） |
| **属性传递** | `<AttributeStatement>` 内多个 `<saml:Attribute>` | ID Token claims + UserInfo 端点 |
| **元数据复杂度** | 高（XML、命名空间、签名证书嵌入） | 低（JSON、JWKS、自动发现） |
| **库实现** | samlify / passport-saml / java-saml / python3-saml | jose / jsonwebtoken / openid-client |

### 选型决策

- **传统企业应用**（Salesforce / ServiceNow / Workday / 政府联邦）→ **SAML**，深度集成、配置工具链成熟
- **新建项目 / SPA / 移动端 / API-first**→ **OIDC**，JSON 轻量、原生支持 PKCE、Authorization Code Flow
- **混合场景** → OIDC 为主 + SAML 桥接（部分 IdP 如 Azure AD / Okta 同时支持两者，后端可做协议转换）

## 签名证书与算法要求

### 算法（NIST SP 800-131A Rev.2）

| 算法 | 状态 | 说明 |
| --- | --- | --- |
| **RSA-SHA-256**（推荐） | **接受** | 现代默认，samlify `requestSignatureAlgorithm` 默认值 |
| RSA-SHA-384 / RSA-SHA-512 | 接受 | 更高位宽，性能稍慢 |
| ECDSA-SHA-256 | 接受 | 椭圆曲线，密钥更短 |
| **RSA-SHA-1** | **禁用**（2030-12-31 前全面退役） | NIST 已禁用于数字签名，碰撞攻击可行 |
| **SHA-1 DigestMethod** | **禁用** | 同上 |
| `rsa-sha1` 在 xmldsig | 强制弃用 | 现代 SP 库应显式拒绝 |

### 签名证书要求

| 项 | 要求 |
| --- | --- |
| **独立于 TLS 证书** | TLS 证书由公共 CA 签发、生命周期短、暴露面大，**不可兼任** SAML 签名证书 |
| **生命周期** | 最长 2 年，建议 1 年 |
| **EKU（Extended Key Usage）** | `id-kp-documentSigning`（1.3.6.1.5.5.7.3.36） |
| **KU（Key Usage）** | 仅 `digitalSignature` |
| **密钥保护** | HSM（FIPS 140-2/3） |
| **发布渠道** | 通过受 TLS 保护的 metadata URL 发布，**禁用电子邮件交换** |
| **KeyInfo 处理** | SP 忽略文档内 `<ds:KeyInfo>`，从预共享 metadata 本地读取证书 |

### 密钥选择策略

- **StaticKeySelector / X509KeySelector**（从预共享 metadata 本地读取）
- **忽略文档内的 `<ds:KeyInfo>`**（防攻击者自带 KeyInfo 冒充 IdP）

## Node SP 库速查

### samlify

```ts
import { sp, idp } from './saml-config'; // 预先构造

// SP 配置（关键安全开关）
const sp = samlify.ServiceProvider({
  entityID: 'https://sp.example.com/metadata',
  authnRequestsSigned: true,
  wantAssertionsSigned: true,           // ★ 强制断言独立签名
  wantMessageSigned: true,              // ★ 强制 Response 签名
  requestSignatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256', // ★ 默认即 RSA-SHA256
  wantLogoutResponseSigned: true,
  wantLogoutRequestSigned: true,
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://sp.example.com/acs',
  }],
});

// 拿到 SAMLResponse（POST body）后验证
const { extract } = await sp.parseLoginResponse(idp, 'post', { body: req.body });
// extract.nameID、extract.attributes 等
```

### @node-saml/passport-saml

```ts
import { SAMLStrategy } from '@node-saml/passport-saml';

const strategy = new SAMLStrategy(
  {
    entryPoint: 'https://idp.example.com/SSOService.php',
    issuer: 'https://sp.example.com',
    callbackUrl: 'https://sp.example.com/acs',
    cert: fs.readFileSync('idp-signing-cert.pem'), // ★ 预共享 IdP 签名证书
    signatureAlgorithm: 'sha256',                   // ★ 强制 SHA-256
    wantAssertionsSigned: true,                     // ★ 强制断言独立签名
    wantAuthnResponseSigned: true,                  // ★ 强制 Response 签名
    disableRequestedAuthnContext: false,
    acceptedClockSkewMs: 60000,                     // 时钟偏差容忍（毫秒）
  },
  (profile, done) => done(null, profile),
);
```

> **关键开关**：`wantAssertionsSigned=true` + `wantAuthnResponseSigned=true` + `signatureAlgorithm: 'sha256'` 是底线，缺一不可。

## 反模式（避坑）

- **仅验 Response 级签名，断言未独立签名（`wantAssertionsSigned=false`）**：攻击者可在已签 Response 内替换 / 注入未签 Assertion，直接落入 XSW 漏洞
- **用 `getElementsByTagName('//saml:Assertion')` 提取业务数据**：XSW 让签名库验签的是原始 Assertion、应用读到的却是攻击者注入的伪造 Assertion；应改用绝对 XPath 或基于 ID 的引用，且应用从签名库返回的已验证节点集读数据
- **使用 SHA-1 签名算法（`rsa-sha1` / `DigestMethod sha1`）**：NIST SP 800-131A Rev.2 已禁，碰撞攻击可行；必须 RSA-SHA-256 及以上
- **信任 XML 文档内 `<ds:KeyInfo>` 元素来选签名验证公钥**：攻击者可自带 KeyInfo 冒充 IdP；必须从预共享 metadata 本地读取证书
- **跳过 `InResponseTo` / `Destination` / `Audience` / `Recipient` 校验**：跨 SP 重放与历史断言重用；`InResponseTo` 缺失是 Google SSO 历史漏洞根因
- **不维护 Assertion ID 去重缓存**：同一有效断言可被重复消费（Replay）；应配合 Redis TTL 缓存近期 Assertion ID
- **用 TLS 服务器证书同时充当 SAML 签名证书**：TLS 证书由公共 CA 签发受 CA 策略约束、生命周期短且暴露面大；签名证书必须独立
- **通过电子邮件交换证书**：中间人篡改风险；应用 metadata URL
- **XML 解析器未禁用 DTD 处理**：SAML Response 可被构造成 XXE 攻击读取服务器文件
- **IdP-Initiated SSO 场景未对 RelayState 做 allowlist**：开放重定向，可被钓鱼利用
- **签名验证库与应用 XML 解析器使用不同组件且节点集不一致**：XSW 得以成立的架构性根因；应用同一组件、且应用从签名库返回的已验证节点集读数据
- **在 SPA / 移动端硬上 SAML**：XML + 表单 POST 流程在前端不友好，应换 OIDC
- **极长 `NotOnOrAfter` 时间窗口**（数小时甚至天）：扩大 Replay 攻击窗口；应极短（典型 1 分钟）
- **`AuthnRequest ID` 不存或丢失**：无法关联 `InResponseTo`，等于放弃第一道 Replay 闸
- **不验证 `Issuer` 字段**：攻击者可构造任意 Issuer 的恶意断言冒充 IdP
- **生产环境未强制 TLS 1.2+**：SAML Response 在传输中被嗅探 / 篡改

## 下一步

- [参考](./reference.md)：角色职责完整表、Binding 完整对比表、NameID/SubjectConfirmation 完整表、SAML vs OIDC 完整对比表、官方资源
