---
layout: doc
outline: [2, 3]
---

# 为什么需要 HTTPS

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **明文 HTTP 三大风险**：窃听（eavesdropping，链路上任何人可读）、篡改（tampering，运营商/中间设备可改包注广告）、冒充（spoofing，无法确认对端是不是真服务器）。
- **安全三目标**：机密性（Confidentiality，别人看不懂）、完整性（Integrity，别人改了能发现）、身份认证（Authentication，确认对端身份）——HTTPS 三者全包。
- **HTTPS = HTTP over TLS**：HTTP 报文不变，只是跑在 TLS 加密通道里，端口由 80 变 443，URL 由 `http://` 变 `https://`。
- **SSL 已死**：SSL 2.0 / 3.0 早已废弃（存在 POODLE 等漏洞），「SSL 证书」只是历史叫法，现在用的全是 TLS。
- **TLS 现役版本**：TLS 1.3（RFC 8446）为当前主流、最快最安全；TLS 1.2 仍广泛在用；**TLS 1.0 / 1.1 已于 RFC 8996（2021）正式弃用**。
- **不只是加密，更是「门票」**：HTTPS 是 Secure Context（安全上下文）的前提，大量强能力 Web API 只在 HTTPS 下可用。
- **HTTPS-only API**：Service Worker、`getUserMedia()`（摄像头/麦克风）、Geolocation、Web Crypto `crypto.subtle`、Push、Web Authentication 等，HTTP 页面直接拿不到。
- **`localhost` 例外**：`http://localhost`、`127.0.0.1`、`*.localhost`、`file://`、`wss://` 被视为「可信来源」，本地开发无需证书即可用上述 API。
- **特征检测**：用 `window.isSecureContext` 判断当前是否安全上下文，再决定是否注册 Service Worker 等。
- **信任与 SEO**：HTTPS 是浏览器地址栏「不安全」警告的免疫线，也是 Google 排名信号；HTTP/2、HTTP/3 在浏览器中事实上只跑在 HTTPS 上。
- **混合内容**：HTTPS 页面里加载 `http://` 子资源会被浏览器拦截或升级——这是落地 HTTPS 的常见坑（详见本叶「中间人攻击与 HSTS」「证书实务」）。

## 明文 HTTP 的三大风险

HTTP 报文在网络上是**完全明文**传输的：请求行、首部、Cookie、表单数据、响应体，全都以可读字节流的形式经过路由器、运营商、Wi-Fi 热点、代理等无数中间节点。这意味着任何能接触到链路的人都能动手脚。

::: danger 把明文 HTTP 想象成寄明信片
寄出的明信片，沿途每个邮差都能读内容、能涂改、甚至能换一张假明信片塞进信箱——这正是 HTTP 面临的三类威胁。
:::

| 风险 | 英文 | 攻击者能做什么 | 前端可感知的后果 |
| --- | --- | --- | --- |
| **窃听** | Eavesdropping | 被动读取链路上的所有字节 | 登录 Cookie、Token、表单密码、浏览记录全部泄露 |
| **篡改** | Tampering | 主动修改传输中的内容 | 运营商注入广告/统计脚本、JS 被改、下载文件被植入恶意代码 |
| **冒充** | Spoofing | 伪装成目标服务器应答 | 用户连到钓鱼站却以为是真站，DNS 劫持、中间人代理 |

- **窃听**是被动的，受害者毫无察觉；**篡改**和**冒充**是主动的，会真实改变页面行为。
- 这三类风险**不是理论**：公共 Wi-Fi 嗅探、运营商「流量劫持注入广告」、咖啡馆假热点钓鱼，都是真实世界的常见手段。
- 仅靠应用层自己加密（比如只把密码字段 base64）**无法**解决——base64 不是加密，且首部、Cookie 仍然裸奔。

## 安全三目标：HTTPS 到底保护什么

针对上述三类风险，传输安全有三个经典目标，HTTPS（通过 TLS）三者全部覆盖：

- **机密性（Confidentiality）** —— 数据被加密，中间人即使截获也读不懂。对应「反窃听」。
- **完整性（Integrity）** —— 数据带有完整性校验（MAC / AEAD），中间人偷偷改一个字节，接收方就能立刻发现并丢弃。对应「反篡改」。
- **身份认证（Authentication）** —— 通过数字证书验证服务器身份，确认「我连的确实是 example.com，不是冒名顶替者」。对应「反冒充」。

::: info 三目标如何落地
这三件事分别由不同密码学手段实现：机密性靠对称加密、身份认证靠证书与非对称加密、完整性靠 AEAD/MAC。**具体怎么实现**是后面几页的主题，本页只需建立「HTTPS 同时保障机密性 + 完整性 + 身份认证」这一整体心智。
:::

## HTTPS = HTTP over TLS

HTTPS 不是一个全新协议，它就是 **HTTP 跑在 TLS 之上**：HTTP 的报文语义、方法、状态码、首部一字不改，只是在 TCP 与 HTTP 之间插入了一层 TLS 加密通道。

```text
        明文 HTTP                         HTTPS（HTTP over TLS）
   ┌──────────────┐                  ┌──────────────┐
   │     HTTP     │                  │     HTTP     │  ← 报文完全相同
   ├──────────────┤                  ├──────────────┤
   │     TCP      │                  │   TLS（加密）  │  ← 多插一层
   ├──────────────┤                  ├──────────────┤
   │      IP      │                  │     TCP      │
   └──────────────┘                  ├──────────────┤
                                     │      IP      │
                                     └──────────────┘
```

落到前端能直接看到的差异只有三处：

| 维度 | HTTP | HTTPS |
| --- | --- | --- |
| URL 协议头 | `http://` | `https://` |
| 默认端口 | 80 | 443 |
| 地址栏 | 标「不安全 / Not secure」 | 无警告（曾有锁图标） |

::: tip 抓包看到的「乱码」就是 TLS 在起作用
在 HTTP 站点抓包，能直接看到明文请求；换成 HTTPS，链路上只剩加密字节，Chrome DevTools 的 Network 面板之所以仍能展示明文，是因为它在浏览器**内部、解密之后**读取的，并非链路上真实传输的内容。
:::

## SSL 与 TLS：关系与历史

「SSL 证书」「SSL 加密」是沿用至今的习惯叫法，但今天实际运行的协议早已全是 **TLS**。两者是同一条技术演进线上的前后两代：

- **SSL（Secure Sockets Layer）** 是 TLS 的前身，由 Netscape 在 1990 年代提出。**SSL 2.0 与 3.0 均已废弃**（含 POODLE 等已知漏洞），现代客户端一律拒绝。
- **TLS（Transport Layer Security）** 是 SSL 的标准化后继。版本线：

| 版本 | 状态（2026） | 说明 |
| --- | --- | --- |
| SSL 2.0 / 3.0 | ❌ 废弃 | 存在严重漏洞，禁止使用 |
| TLS 1.0 / 1.1 | ❌ 已弃用 | **RFC 8996（2021）正式弃用**，主流浏览器已移除 |
| TLS 1.2 | ✅ 在用 | 仍被大量站点使用，安全配置下可接受 |
| TLS 1.3 | ✅ 主流推荐 | RFC 8446，最新版本，握手更快、默认更安全 |

::: warning 别再说「SSL」了，但听到时知道指什么
对外沟通里「SSL 证书」「开启 SSL」基本都指 TLS。但在技术判断上要清楚：任何真在用 SSL 2.0/3.0 或 TLS 1.0/1.1 的配置都是**安全隐患**，应升级到 TLS 1.2/1.3。
:::

## HTTPS 带来的信任与能力收益

HTTPS 早已不是「锦上添花」，而是现代 Web 的**准入门槛**。除了挡住上述三类攻击，它还直接关系到前端能用哪些能力：

### 安全上下文（Secure Context）= 强能力 API 的门票

浏览器把许多敏感、强能力的 API 限制在**安全上下文（Secure Context）**中才可用。判定为安全上下文的核心条件就是：页面经 HTTPS 送达，且整条祖先链（含 iframe 父页）都是 HTTPS。

下列 API 在普通 HTTP 页面**直接不可用**（调用即抛错或返回空）：

- **Service Worker** —— 离线缓存、PWA 的地基
- **`getUserMedia()`** —— 访问摄像头 / 麦克风
- **Geolocation API** —— 地理定位
- **Web Crypto** —— `crypto.subtle` 加解密
- **Push API / Web Authentication（WebAuthn）** —— 推送、通行密钥/指纹登录

```js
// 用 isSecureContext 做特征检测，再决定是否启用强能力
if (window.isSecureContext) {
  // 处于安全上下文，可以注册 Service Worker
  navigator.serviceWorker.register("/sw.js");
} else {
  console.warn("非安全上下文：Service Worker 等能力不可用，请用 HTTPS 访问");
}
```

::: tip 本地开发不必为证书发愁
`http://localhost`、`http://127.0.0.1`、`http://*.localhost`、`file://`、`wss://` 被浏览器视为**潜在可信来源**，同样享有安全上下文待遇。所以本地 `localhost` 调试 Service Worker、摄像头都没问题——但**用局域网 IP（如 `http://192.168.x.x`）真机调试时不算安全上下文**，这些 API 会失效。
:::

### 信任、SEO 与协议升级

- **用户信任**：现代浏览器对纯 HTTP 站点显式标注「不安全」，输入密码/信用卡时还会额外警告，直接影响转化与口碑。
- **SEO 收益**：HTTPS 是 Google 公开的搜索排名信号之一，同等条件下 HTTPS 站点更占优。
- **协议升级前提**：HTTP/2、HTTP/3（QUIC）在浏览器实现中事实上只在 HTTPS 上启用——不上 HTTPS，就享受不到多路复用等性能红利（详见「HTTP 演进与性能」叶）。

### 混合内容：HTTPS 站点的常见坑（一句话引出）

即便主文档是 HTTPS，只要页面里还引用了 `http://` 的脚本、样式、图片等子资源，就构成**混合内容（Mixed Content）**——浏览器会拦截危险的（脚本等）或自动升级为 HTTPS，否则安全保证形同虚设。如何排查与治理，留待本叶「中间人攻击与 HSTS」和「证书实务」展开。

## 小结

- 明文 HTTP 面临**窃听 / 篡改 / 冒充**三类风险；HTTPS 通过 TLS 同时提供**机密性 / 完整性 / 身份认证**三大保障。
- HTTPS **就是 HTTP over TLS**：报文不变，端口 80→443，协议头 `http://`→`https://`。
- **SSL 已全面废弃**，现役是 **TLS 1.2 / 1.3**（TLS 1.0/1.1 已被 RFC 8996 弃用）；口头说「SSL」实指 TLS。
- HTTPS 是 **Secure Context** 的前提，Service Worker、`getUserMedia`、Geolocation 等强能力 API 只在 HTTPS（或 `localhost`）下可用，还带来用户信任、SEO 与 HTTP/2·3 升级红利。

HTTPS 凭什么能同时做到「看不懂、改不了、认得清」？答案藏在两类加密手段的配合里——下一页拆解：[对称与非对称加密](./symmetric-asymmetric)。
