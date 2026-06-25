---
layout: doc
outline: [2, 3]
---

# 证书实务

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **三种验证等级**：DV（域名验证，仅证明你控制域名，秒级签发）/ OV（组织验证，核验企业身份）/ EV（扩展验证，最严格审核）。
- **EV 绿条已淡化**：Chrome 77+、Firefox 70+ 起，地址栏不再为 EV 显示公司名绿条，所有 HTTPS 站点统一显示一把锁——**EV 的视觉溢价基本消失**。
- **通配符证书** `*.example.com`：覆盖**同一层级**的所有子域（`a.example.com`、`b.example.com`），但**不覆盖** `example.com` 裸域，也不跨层（不含 `x.y.example.com`）。
- **SAN 多域名证书**：一张证书在 `Subject Alternative Name` 中列多个**不同**域名（`example.com`、`example.org`、`api.foo.com`），现代证书域名**全靠 SAN**，CN 字段已被忽略。
- **Let's Encrypt 免费 + 自动化**：证书有效期 **90 天**（短，靠自动续期），通过 **ACME 协议**程序化签发/续期；另有 **6 天**短期证书（2025-02 起灰度推进中）。
- **ACME 三种校验**：**HTTP-01**（放文件到 `/.well-known/acme-challenge/`）、**DNS-01**（写 `_acme-challenge` TXT 记录）、**TLS-ALPN-01**（443 端口 TLS 层校验）。
- **通配符证书必须用 DNS-01**：HTTP-01 与 TLS-ALPN-01 都**不能**签发通配符。
- **certbot** 是官方推荐客户端：`certbot --nginx` 一键签发并改写配置，安装时自带 systemd timer / cron **每日两次**检查、到期前 30 天自动续。
- **混合内容（mixed content）**：HTTPS 页面引用 HTTP 资源。被动类（img/audio/video）现代浏览器**自动升级**到 HTTPS；主动类（script/css/iframe/fetch/字体）**直接拦截**。
- **HTTPS 性能三件套**：**会话复用**（Session Ticket，省去重复握手）、**OCSP Stapling**（服务器代客户端查吊销状态，省一次往返）、**HTTP/2**（浏览器仅在 TLS 上启用，多路复用）。
- **本地开发 HTTPS 用 mkcert**：一条命令生成「本地受信任」证书，免去自签名证书的浏览器红色警告。
- **配置别手写**：用 [Mozilla SSL Config Generator](https://ssl-config.mozilla.org/) 选 modern / intermediate / old 档位，直接产出 Nginx/Apache 安全配置。

## 一、证书类型：按「验证等级」与「覆盖范围」两个维度看

证书的差异不在加密强度（都用同样的公钥算法），而在 **CA 签发前验证了什么**，以及**一张证书能护住多少域名**。

### 按验证等级：DV / OV / EV

| 等级                       | 验证内容                       | 签发速度    | 典型场景                   | 价格      |
| -------------------------- | ------------------------------ | ----------- | -------------------------- | --------- |
| **DV**（Domain Validation） | 仅验证「你控制这个域名」       | 秒级~分钟级 | 个人站、博客、绝大多数网站 | 免费~低   |
| **OV**（Organization）      | 额外核验企业工商信息           | 1~3 天      | 企业官网                   | 中        |
| **EV**（Extended）          | 最严格的法律实体审核           | 数天~数周   | 银行、大型电商（历史上）   | 高        |

::: warning EV 绿条已成历史
EV 证书过去的最大卖点是地址栏那条「绿色公司名」。但 **Chrome 77（2019）、Firefox 70 起，浏览器移除了 EV 的特殊 UI**——如今无论 DV 还是 EV，地址栏都只显示一把普通的锁。研究表明用户几乎不会注意到绿条，钓鱼网站也能轻易申请 DV 证书伪装。

**结论**：对前端/绝大多数业务，DV（尤其 Let's Encrypt 免费 DV）已完全够用；EV 的安全收益主要体现在「企业身份背书」这一非技术层面，技术上不再有浏览器加成。
:::

### 按覆盖范围：单域名 / 通配符 / SAN 多域名

- **单域名证书**：只护一个完全限定域名（如 `www.example.com`）。
- **通配符证书** `*.example.com`：护住该域**同一层级**的全部子域。

::: tip 通配符的边界（极易踩坑）
`*.example.com` **能**护 `api.example.com`、`cdn.example.com`；**不能**护：
- 裸域 `example.com`（需把它单独加进 SAN，或申请 `example.com` + `*.example.com` 两个名）；
- 多层子域 `a.b.example.com`（通配符只吃一层）。
:::

- **SAN 多域名证书**（Multi-Domain / UCC）：在证书的 `Subject Alternative Name` 扩展里列多个**彼此不同**的域名，一张证书护 `example.com` + `example.org` + `blog.foo.net`。

::: info CN 已死，全看 SAN
现代浏览器**完全忽略**证书的 `Subject / CN`（Common Name）字段，域名匹配**只读 `Subject Alternative Name`**。所以哪怕只护一个域名，证书也必须把它写进 SAN，否则报 `ERR_CERT_COMMON_NAME_INVALID`。
:::

## 二、Let's Encrypt 与 ACME：免费证书的自动化基础设施

[Let's Encrypt](https://letsencrypt.org/) 是非营利 CA，签发**免费 DV 证书**，把 HTTPS 从「要花钱、要手动」变成了「免费、全自动」，是当今 HTTPS 普及率超过 90% 的最大推手。

### 90 天有效期与 ACME 协议

Let's Encrypt 证书有效期只有 **90 天**（远短于传统商业证书的 1 年）。短有效期的逻辑是：**逼你自动化**——一旦私钥泄露，证书最多 90 天就自然失效，把风险窗口压到最小。

> 注：Let's Encrypt 自 2025-02 起开始推进 **6 天短期证书**（short-lived certificate），首张已于 2025-02-19 签发，正分批灰度，目标是让续期完全无感、彻底取消吊销机制。

90 天靠手动续显然不现实，于是有了 **ACME**（Automatic Certificate Management Environment，RFC 8555）——一套让客户端与 CA 之间**程序化完成「证明域名控制 → 签发 → 续期」**的标准协议。

### 三种 ACME 校验方式

CA 在签发前必须确认「你确实控制这个域名」，ACME 提供三种 challenge：

| 校验类型         | 怎么证明控制权                                          | 能否签通配符 |
| ---------------- | ------------------------------------------------------- | ------------ |
| **HTTP-01**      | 在 `http://域名/.well-known/acme-challenge/<token>` 放文件 | ❌ 不能      |
| **DNS-01**       | 在 `_acme-challenge.域名` 添加一条 `TXT` 记录            | ✅ **可以**  |
| **TLS-ALPN-01**  | 在 443 端口用专用 ALPN 协议在 TLS 层应答                 | ❌ 不能      |

::: warning 通配符证书只能用 DNS-01
要签 `*.example.com`，**必须用 DNS-01**——HTTP-01 和 TLS-ALPN-01 都明确**不支持**通配符。这也意味着自动续通配符证书时，你的 ACME 客户端需要有**操作 DNS 解析的 API 权限**（各 DNS 服务商提供插件）。
:::

### certbot：部署与自动续期

[certbot](https://certbot.eff.org/) 是 EFF 维护的官方推荐 ACME 客户端：

```bash
# 一键：签发证书 + 自动改写 Nginx 配置 + 配好跳转
sudo certbot --nginx -d example.com -d www.example.com

# 通配符（需 DNS 插件，以 Cloudflare 为例）
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials ~/.secrets/cf.ini \
  -d "*.example.com" -d example.com

# 手动测试续期（不会真的改证书）
sudo certbot renew --dry-run
```

::: tip 自动续期是默认行为
certbot 安装时会自动注册一个 **systemd timer（或 cron）每天检查两次**，仅在证书**剩余有效期不足 30 天**时才真正续期并热加载服务器。换句话说：**装好 certbot 后，续期通常无需任何额外配置**。生产环境务必定期 `certbot renew --dry-run` 验证链路通畅。
:::

## 三、混合内容（Mixed Content）：HTTPS 页面里的 HTTP 资源

当一个通过 HTTPS 加载的页面，又去引用 `http://` 的资源时，就构成**混合内容**——这等于在「安全」的页面里开了一个明文窗口，中间人可篡改这些资源。浏览器为此分两类处理：

| 类别                        | 包含资源                                                            | 浏览器行为（2026）       |
| --------------------------- | ------------------------------------------------------------------ | ------------------------ |
| **被动 / 可升级**（passive） | `<img src>`、`<audio src>`、`<video src>`、`<source>`、CSS 背景图     | **自动升级**到 HTTPS 加载 |
| **主动 / 可拦截**（active）  | `<script>`、`<link>` 样式表、`<iframe>`、`fetch`/`XHR`、Web 字体、`<object>` | **直接拦截**，不加载      |

```html
<!-- ❌ 主动混合内容：脚本被拦截，页面可能直接报错白屏 -->
<script src="http://cdn.example.com/app.js"></script>

<!-- ⚠️ 被动混合内容：现代浏览器静默升级为 https 再加载 -->
<img src="http://cdn.example.com/logo.png" />

<!-- ✅ 正解：始终用 https，或用协议相对/绝对 https -->
<script src="https://cdn.example.com/app.js"></script>
```

::: info MDN 新术语 & 一键升级
MDN 已把旧的 passive/active 改称 **upgradable（可升级）/ blockable（可拦截）**：图片、音视频请求被**自动从 HTTP 升级到 HTTPS**，其余一律拦截。对一时改不完的历史页面，可在响应头加 CSP 指令 <code v-pre>Content-Security-Policy: upgrade-insecure-requests</code>，让浏览器把页面内所有 `http://` 子资源统一升级为 `https://` 再请求。注意：以**纯 IP** 为主机的请求会被**直接拦截而非升级**。
:::

## 四、HTTPS 性能：让「安全」几乎不收费

「HTTPS 慢」早已是过时印象。靠以下手段，TLS 的开销已被压到可忽略：

- **会话复用（Session Resumption）**：完整 TLS 握手要 1~2 个 RTT，开销主要在非对称加密协商。复用机制（**Session Ticket**，TLS 1.3 内建）让后续连接「凭票续接」，跳过完整握手。
- **OCSP Stapling**：客户端原本要**自己再向 CA 发一次请求**查证书是否被吊销（慢且泄露隐私）。OCSP Stapling 让**服务器预先取好**带时间戳的吊销状态，在握手时一并「钉」给客户端，省掉这次往返。Nginx 中 `ssl_stapling on;` 即可开启。
- **HTTP/2 over TLS**：浏览器**只在 HTTPS 上启用 HTTP/2**（明文 HTTP/2 浏览器不支持）。即「上了 HTTPS 才能享受 HTTP/2 的多路复用」，安全与性能在此处反而是正相关。

::: tip 别手写 TLS 配置
TLS 套件、协议版本、Stapling 这些极易配错。直接用 [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)：选服务器类型，挑 **modern**（只留 TLS 1.3，面向现代客户端）/ **intermediate**（TLS 1.2+1.3，通用推荐）/ **old**（兼容老旧客户端）档位，复制生成的配置即可，已内置 Stapling、安全套件与合理的会话设置。
:::

## 五、前端本地开发的 HTTPS：mkcert

开发时常需要本地 HTTPS（测 Service Worker、`Secure` Cookie、`getUserMedia` 等仅在安全上下文可用的 API）。直接自签名证书会触发浏览器红色警告，而 [mkcert](https://github.com/FiloSottile/mkcert) 能生成**被本机操作系统/浏览器信任**的本地证书：

```bash
mkcert -install                      # 把本地 CA 装进系统信任库（一次性）
mkcert localhost 127.0.0.1 ::1       # 生成 localhost 的证书 + 私钥
# 把生成的 .pem 喂给 Vite：server.https = { key, cert }
```

::: warning mkcert 仅限本地
mkcert 的根证书**只装在你自己的机器上**，外网/他人设备并不信任它，**绝不能用于生产**。生产环境一律走 Let's Encrypt 等公共 CA 签发的证书。
:::

## 小结

证书实务把前面五页的密码学与信任链落到了「真刀真枪部署 HTTPS」：

- **选证书**：技术上 DV（Let's Encrypt 免费）足够，EV 绿条已被浏览器淡化；多子域用通配符（注意只吃一层、不含裸域），多个不同域名用 SAN。
- **自动化签发**：Let's Encrypt + ACME（HTTP-01 / DNS-01 / TLS-ALPN-01，通配符必走 DNS-01）+ certbot，90 天有效期靠**自动续期**消化，装好即无感。
- **避坑混合内容**：HTTPS 页面里别留 `http://` 资源，主动类会被拦截致页面崩；用 `upgrade-insecure-requests` 兜底历史页面。
- **要性能**：会话复用 + OCSP Stapling + HTTP/2 over TLS，让 HTTPS 几乎零额外成本；配置交给 Mozilla SSL Config Generator。
- **本地开发**：mkcert 一键拿到受信任本地证书，但绝不上生产。

至此「HTTPS 与传输安全」全叶收口：从[为什么需要 HTTPS](./why-https) 出发，经[对称与非对称加密](./symmetric-asymmetric)、[数字证书与 CA 信任链](./certificates-ca)、[TLS 握手流程](./tls-handshake)、[中间人攻击与 HSTS](./mitm-hsts)，最终落到本页的证书工程实践——理解了「为什么安全」，更要会「把它正确部署上线」。

延伸阅读见本叶 [参考](../reference)。
