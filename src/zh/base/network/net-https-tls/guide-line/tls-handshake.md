---
layout: doc
outline: [2, 3]
---

# TLS 握手流程（1.2 vs 1.3）

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **握手三大目标**：① 协商 **TLS 版本 + 加密套件**；② 验证服务端**证书**（必要时双向验证客户端）；③ 协商出一把双方共享的**会话密钥**，握手后用它做对称加密。
- **混合加密落地**：握手用**非对称**完成身份认证与密钥协商，握手完成后用协商出的对称密钥加密所有应用数据——这正是[上一类页](./symmetric-asymmetric)讲的混合加密在 TLS 里的实现。
- **TLS 1.2 约 2-RTT**：`ClientHello` → `ServerHello`+证书+密钥交换 → 客户端密钥交换 → 双方 `Finished`，要两个往返才能发首个 HTTP 请求。
- **TLS 1.3 精简到 1-RTT**：客户端在 `ClientHello` 里**直接捎带密钥协商参数**（猜服务端偏好），一个往返即可开始加密通信，且 **ServerHello 之后的所有握手报文都加密**。
- **TLS 1.3 强制前向保密（PFS）**：只保留 **(EC)DHE** 临时密钥交换，删除了静态 RSA 密钥交换——私钥泄露也无法解密历史流量。
- **ECDHE = 前向保密的来源**：每次握手用一次性临时密钥对算共享密钥，密钥不落盘、不依赖长期私钥，是 TLS 1.2/1.3 都推荐的密钥协商方式。
- **加密套件构成**：密钥交换 + 身份认证 + 对称加密算法 + 摘要/MAC。TLS 1.3 把前两项拆出去单独协商，套件名只剩 `TLS_AES_128_GCM_SHA256` 这样的「对称算法 + 哈希」。
- **SNI**：`ClientHello` 中携带目标域名，让一个 IP 上的多个 HTTPS 站点能返回正确证书（虚拟主机必备）。
- **ALPN**：`ClientHello` 扩展，在 TLS 握手中顺便协商应用层协议（`h2` / `http/1.1` / `h3`），省掉额外往返。
- **会话恢复**：TLS 1.3 用 `NewSessionTicket`（基于 PSK 预共享密钥）恢复会话；回头客可走 **0-RTT** 在首包就捎带请求数据，但有重放风险，仅限幂等请求。
- **版本现状（2026-06）**：**TLS 1.3 为现行主流版本**，TLS 1.2 仍在用；**TLS 1.0 / 1.1 已废弃**，不应再启用。

## 一、握手要解决的三件事

当浏览器对一个 HTTPS 站点发起访问，TCP 三次握手建立连接后，紧接着就是 **TLS 握手**——一连串客户端与服务端互发的报文。它要在「还没有任何共享秘密」的不安全信道上，达成三个目标：

1. **协商参数**：双方都支持哪些 TLS 版本、哪些加密套件？取交集里最安全的一组。
2. **验证身份**：服务端出示证书，客户端用 CA 信任链验证「你确实是这个域名的合法持有者」（证书验证细节见[上一页](./certificates-ca)）。
3. **协商会话密钥**：在窃听者也能看到全部握手报文的前提下，双方各自算出**同一把对称密钥**，且窃听者算不出来。

::: info 为什么不直接全程用非对称加密？
非对称加密（RSA/ECC）运算昂贵，不适合加密大量数据。所以 TLS 用的是**混合加密**：握手阶段用非对称做认证与密钥协商，握手一完成就切换到高效的**对称加密**传输应用数据。握手的全部精妙，就是为了安全地把那把对称密钥「协商」出来。详见 [对称与非对称加密](./symmetric-asymmetric)。
:::

## 二、TLS 1.2 握手：两个往返（约 2-RTT）

TLS 1.2 的密钥协商有两种典型路径。先看历史上的 **RSA 密钥交换**（TLS 1.3 已删除，但理解它有助于看懂演进）：

```
客户端                                              服务端
  │ ─────────────  ClientHello  ──────────────────► │  支持的 TLS 版本、加密套件列表、ClientRandom
  │                                                  │
  │ ◄──── ServerHello / Certificate / Done ───────── │  选定套件、服务端证书、ServerRandom
  │                                                  │
  │  验证证书 → 生成 PreMasterSecret，用证书公钥加密   │
  │ ──────────  ClientKeyExchange  ────────────────► │  服务端用私钥解出 PreMasterSecret
  │                                                  │
  │ ───────  [ChangeCipherSpec] Finished  ─────────► │  双方用三个随机数派生会话密钥
  │ ◄──────  [ChangeCipherSpec] Finished  ────────── │
  │                                                  │
  │ ══════════  此后用会话密钥对称加密  ══════════════ │
```

**致命弱点**：PreMasterSecret 用服务端证书公钥加密传输。一旦服务端**长期私钥**日后泄露，攻击者可解密**历史上录下的所有流量**——没有前向保密。

更安全的是 **ECDHE 临时密钥交换**（TLS 1.2 推荐做法），它在 `ServerHello` 后多发一个携带临时 DH 参数与签名的报文：

> In contrast to the RSA handshake, the server also computes a digital signature of all the messages up to this point... the client and server use the DH parameters they exchanged to calculate a matching premaster secret separately.
> —— Cloudflare, What happens in a TLS handshake

关键差异：PreMasterSecret **不再被传输**，而是双方各用一次性临时密钥对，通过 Diffie-Hellman **各自独立算出同一个值**。临时密钥用完即弃，于是获得**前向保密**（详见第四节）。

::: warning 记住「2-RTT」这个数字
无论 RSA 还是 ECDHE，TLS 1.2 都需要**两个完整往返**才能发出第一个 HTTP 请求：第一个 RTT 交换 Hello 与证书，第二个 RTT 交换密钥与 Finished。叠加前面 TCP 的 1-RTT，HTTPS 首字节要等约 3 个 RTT——在高延迟移动网络下这是实打实的首屏延迟。
:::

## 三、TLS 1.3 握手：精简到一个往返（1-RTT）

TLS 1.3（RFC 8446）最重要的改进是**把握手压缩到 1-RTT**。做法是：客户端在 `ClientHello` 里**直接附上密钥协商参数**（`key_share`），赌一把服务端会用某个主流的 ECDHE 群——由于 1.3 的套件列表大幅精简，这一赌几乎总是对的。

```
客户端                                              服务端
  │ ──── ClientHello (+ key_share, SNI, ALPN) ─────► │  附上 ECDHE 公钥参数
  │                                                  │  服务端此时已能算出共享密钥
  │ ◄─ ServerHello (+ key_share)                     │
  │    {EncryptedExtensions}                         │  ← 大括号 = 已加密
  │    {Certificate} {CertificateVerify}             │
  │    {Finished} ─────────────────────────────────  │
  │                                                  │
  │  验证证书与签名 → 算出同一密钥                      │
  │ ──── {Finished} ───────────────────────────────► │
  │ ══════  此后（含本往返尾部）全程对称加密  ═════════ │
```

RFC 8446 的原话点明两个核心变化：

> All handshake messages after the ServerHello are now encrypted.
> Static RSA and Diffie-Hellman cipher suites have been removed; all public-key based key exchange mechanisms now provide forward secrecy.

::: tip 1-RTT 的收益
TLS 1.3 把「协商参数」和「交换密钥」合并进同一个往返：客户端发 `ClientHello` 时就把密钥材料给齐，服务端一次回复即可带上证书、签名和 `Finished`。**一个往返**后双方就握手完毕，比 TLS 1.2 省掉整整一个 RTT。配合 HTTP/3，握手还能与 QUIC 合并（见 [HTTP/3 与 QUIC](../../net-http-evolution/guide-line/http3-quic)）。
:::

TLS 1.3 同时**删除了一大批不安全机制**，这也是它能精简的前提：

| 被删除 / 弃用 | 原因 |
| --- | --- |
| 静态 RSA、静态 DH 密钥交换 | 无前向保密；只保留 (EC)DHE |
| CBC 模式、RC4 等非 AEAD 加密 | 易受 padding/流密码攻击；只保留 AEAD（GCM、ChaCha20-Poly1305） |
| MD5、SHA-1 | 已被攻破，不再用于签名 |
| TLS 压缩、重协商（renegotiation） | 引发 CRIME 等攻击 |
| Session ID、旧式 Session Ticket | 由基于 PSK 的新恢复机制取代 |

## 四、ECDHE 与前向保密（PFS）

**前向保密（Perfect Forward Secrecy, PFS）** 指：即使服务端的**长期私钥**将来泄露，攻击者也**无法解密之前录下的流量**。实现它的关键是密钥协商用**临时（ephemeral）密钥**，每次握手一换、用完即弃。

**ECDHE**（Elliptic Curve Diffie-Hellman Ephemeral，椭圆曲线临时 DH）的工作直觉：

- 双方各生成一个**一次性**临时密钥对，互发公钥部分。
- 各自用「自己的私钥 + 对方的公钥」做椭圆曲线运算，**数学上必然算出同一个共享密钥**，而窃听者只看到两个公钥、算不出该密钥。
- 握手结束，临时私钥即丢弃，**从不落盘**。

::: info 为什么长期私钥泄露也不怕？
长期私钥（证书对应的私钥）在 ECDHE 里**只用来签名**「证明这些临时参数确实出自我」，**不参与**会话密钥的计算。会话密钥只由当次的临时密钥决定，临时密钥又已销毁——所以拿到长期私钥也还原不出任何历史会话密钥。这正是 TLS 1.3 强制 (EC)DHE、彻底删除静态 RSA 的根本动机。
:::

## 五、加密套件（Cipher Suite）的构成

加密套件是一组「配套使用」的算法。以 TLS 1.2 的经典套件 `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256` 为例，拆开看：

| 片段 | 角色 | 说明 |
| --- | --- | --- |
| `ECDHE` | 密钥交换 | 临时椭圆曲线 DH，提供前向保密 |
| `RSA` | 身份认证 | 用 RSA 证书/签名验证服务端身份 |
| `AES_128_GCM` | 对称加密 | AES-128 的 GCM（AEAD）模式，加密应用数据 |
| `SHA256` | 摘要 / PRF | 用于完整性校验与密钥派生 |

**TLS 1.3 简化了命名**：因为密钥交换（永远是 (EC)DHE）和身份认证（看证书类型）被**单独协商**，套件名里不再出现它们，只保留「对称算法 + 哈希」：

```
TLS 1.2:  TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256   ← 含密钥交换 + 认证 + 加密 + 哈希
TLS 1.3:  TLS_AES_128_GCM_SHA256                  ← 只剩 AEAD 加密 + 哈希
          TLS_CHACHA20_POLY1305_SHA256
```

**协商过程**：`ClientHello` 按偏好列出客户端支持的套件清单，服务端从中挑一个自己也支持的，在 `ServerHello` 里回告——双方就此对齐算法。

## 六、握手里的两个关键扩展：SNI 与 ALPN

`ClientHello` 里还携带若干**扩展（extensions）**，其中两个对前端最常打交道：

### SNI（Server Name Indication，一 IP 多站）

早期 TLS 的难题：握手要先选证书，但一台服务器一个 IP 上可能托管几十个 HTTPS 域名，服务端**还没收到 HTTP 的 `Host` 头**（那是握手之后才发的），怎么知道该返回哪张证书？

**SNI** 解决之：客户端在 `ClientHello` 里**明文携带要访问的域名**，服务端据此返回对应证书。这是虚拟主机 / CDN「一个 IP 服务多个 HTTPS 站点」的前提。

::: warning SNI 明文与 ECH
传统 SNI 是**明文**的，会泄露你访问的域名。新机制 **ECH（Encrypted Client Hello）** 把 SNI 也加密，2026 年已在 Chrome、Firefox 与 Cloudflare 等落地推广，但尚未全网普及。
:::

### ALPN（Application-Layer Protocol Negotiation，协商应用层协议）

浏览器与服务端都可能支持多种应用层协议（HTTP/1.1、HTTP/2、HTTP/3）。**ALPN** 让双方**在 TLS 握手中顺便**把它谈妥：客户端在 `ClientHello` 扩展里列出 `h2`、`http/1.1`，服务端在 `ServerHello` 选定一个回告。这样不必等握手完再额外往返协商，**HTTP/2 的启用就是靠 ALPN 选中 `h2`** 实现的。

## 七、会话恢复与 0-RTT

完整握手有成本（非对称运算 + 往返）。对**回头客**，TLS 提供更快的**会话恢复**。

TLS 1.3 的做法：首次握手成功后，服务端发一个 `NewSessionTicket`，双方据此派生出**恢复主密钥（resumption main secret，本质是 PSK 预共享密钥）**。客户端下次连接时带上这张票据，跳过证书与完整密钥协商，握手更快。

> The server also sends the client a session ticket during this first session. The client can use this shared secret to send encrypted data to the server on its first message of the next session, along with that session ticket.
> —— Cloudflare, What happens in a TLS handshake

更激进的是 **0-RTT**：回头客在握手的**第一个包**里就把 HTTP 请求数据一起发出去，零往返即开始传业务数据。

::: warning 0-RTT 的安全代价：重放攻击
0-RTT 的早期数据在握手完成前就发出，**无法享受前向保密，且可能被重放（replay）**。因此规范要求：**只有幂等、无副作用的请求**（如 `GET`）才适合走 0-RTT，绝不能把「下单」「转账」这类写操作放进 0-RTT。这与 [HTTP/3 与 QUIC](../../net-http-evolution/guide-line/http3-quic) 里 0-RTT 的约束完全一致——本质是同一套 TLS 1.3 机制。
:::

## 小结

TLS 握手要在不安全信道上同时完成**版本/套件协商、证书验证、会话密钥协商**三件事，再用协商出的对称密钥保护后续通信——这正是混合加密的落地。TLS 1.2 需约 **2-RTT**，并存在静态 RSA 无前向保密的隐患；**TLS 1.3 把握手压到 1-RTT**，强制 **(EC)DHE** 带来**前向保密**，删除了 CBC、RC4、MD5/SHA-1、压缩、重协商等不安全机制，并加密了 ServerHello 之后的全部握手报文。`ClientHello` 里的 **SNI** 支撑「一 IP 多站」，**ALPN** 顺手协商出 `h2`/`http/1.1`；会话恢复与 **0-RTT** 则为回头客进一步省去往返，代价是 0-RTT 仅适用于幂等请求。理解了握手，就理解了 HTTPS「既验身份又保机密」的全部地基。

---

- 上一页：[数字证书与 CA 信任链](./certificates-ca)
- 下一页：[中间人攻击与 HSTS](./mitm-hsts)
