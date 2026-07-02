---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- 浏览器安全的基本假设：**页面代码不可信**——防线必须常开、分层、彼此独立，任何一层被攻破还有下一层
- **第一道：同源策略（SOP）**——跨源读取的默认禁令，细则与 CORS 放行协议在[网络章 · 跨源与 CORS](/zh/base/network/net-cors/)，本叶不重讲
- **第二道：进程与沙箱**——站点隔离把不同 site 分进 renderer，**沙箱（sandbox）**砍掉 renderer 的系统调用权，**CORB/ORB** 拦跨站数据进错进程；应对的是「renderer 已失陷」与 **Spectre** 侧信道
- **第三道：内容防线**——**CSP** 限定什么代码能跑、**Trusted Types** 给 DOM XSS sink 上闸、**SRI** 校验第三方资源完整性
- **第四道：嵌入防线**——iframe **`sandbox`** 属性白名单授权，**`frame-ancestors`**（换代 `X-Frame-Options`）决定谁能把你装进 iframe
- **第五道：传输与上下文**——强能力 API 只在**安全上下文（secure context）**开放；HTTPS 页面里的 HTTP 资源按**可升级/可阻断**处置；TLS/HSTS 本体见[网络章 · HTTPS 与 TLS](/zh/base/network/net-https-tls/)
- **第六道：能力与元数据**——**Permissions Policy** 收窄摄像头/定位等能力，**Local Network Access** 把「公网页面打内网」放进权限提示（Chrome 142 起），**Fetch Metadata**（`Sec-Fetch-*`）把请求来源报给服务端
- 一句话分工：**net-cors 管跨源读取与 opt-in 隔离头，本叶管浏览器常开防护，安全章管攻击手法与鉴权**
- 防线大多**靠响应头下发**：`Content-Security-Policy`、`Permissions-Policy`、`X-Frame-Options` 都是部署配置问题，不是写业务代码的问题
- 排错主入口：DevTools **Console**（CSP/混合内容违规逐条打印）、**Network → Headers**（核对响应头）、**Application → Frames**（看每个 frame 生效的 CSP 与沙箱标志）

## 一、安全模型全景：默认防线有哪几道

浏览器的处境很特殊：它是**主动下载并执行陌生代码**的程序。安全模型因此不押注任何单点，而是纵深布防——每一层回答一个「如果上一层失守」：

| 防线 | 机制 | 回答的问题 | 归属 |
| --- | --- | --- | --- |
| 同源策略 | SOP / CORS / COOP·COEP | 页面 A 的脚本能不能读页面 B 的数据？ | [网络章 · 跨源与 CORS](/zh/base/network/net-cors/) |
| 进程隔离 | 站点隔离 + 渲染器沙箱 + CORB/ORB | 如果渲染引擎本身被攻破呢？ | 本叶[沙箱与隔离防御](./guide-line/sandbox-isolation-defense)（进程模型见[兄弟叶](../browser-architecture/guide-line/site-isolation)） |
| 内容防线 | CSP / Trusted Types / SRI | 注入的脚本、被篡改的 CDN 文件怎么拦？ | 本叶 [CSP 基础](./guide-line/csp-basics)、[防注入三件套](./guide-line/strict-csp-trusted-types) |
| 嵌入防线 | iframe sandbox / frame-ancestors | 第三方内容嵌进来、我被别人嵌走，怎么控？ | 本叶 [iframe sandbox 与点击劫持](./guide-line/iframe-sandbox-clickjacking) |
| 传输底线 | 安全上下文 / 混合内容 | 中间人能看见、能改的通道上，什么不该发生？ | 本叶[安全上下文与混合内容](./guide-line/secure-contexts-mixed-content) |
| 能力防线 | Permissions Policy / LNA / Fetch Metadata | 摄像头、内网、跨站请求，凭什么给你用？ | 本叶[能力与元数据防护](./guide-line/permissions-policy-fetch-metadata) |

两个观察贯穿全叶：

1. **防线是「常开」的**。SOP、沙箱、混合内容阻断、安全上下文门控不需要你配置，出厂即生效；CSP、Permissions Policy、SRI 则是**你下发一行响应头/属性就常年值守**的机制。本叶只讲这类执行环境自带的防护——攻击手法（XSS payload 构造、CSRF 利用链）与鉴权体系（OAuth/JWT）归安全章（待产出）。
2. **防线大多以「拒绝」表达自己**。配错的直接症状是「页面坏了」：脚本不执行、iframe 空白、摄像头拿不到、请求 403。所以每一页都会讲**配错了怎么坏、DevTools 里怎么看**。

## 二、一次页面加载要过几道岗

把机制串到一次真实加载上，感受它们各自的站位：

```text
https://app.example 返回 HTML
 ├─ 响应头到达：CSP / Permissions-Policy / frame-ancestors 随头生效
 ├─ 解析到 <script src="https://cdn.example/lib.js" integrity="sha384-…">
 │   ├─ CSP script-src：这个源/这个 nonce 允许吗？──不允许 → 不请求，Console 报违规
 │   ├─ 混合内容：http:// 的脚本？──可阻断类 → 直接拦
 │   └─ SRI：哈希对不上？──按网络错误丢弃
 ├─ 解析到 <iframe sandbox="allow-scripts" src="https://ads.example">
 │   ├─ 站点隔离：跨站 → 进独立 renderer 进程（OOPIF）
 │   ├─ 对方的 frame-ancestors 允许被我嵌吗？──不允许 → iframe 空白
 │   └─ sandbox：无 token 白名单授权的能力一律禁用
 ├─ 页面 JS 调 navigator.mediaDevices.getUserMedia()
 │   ├─ 安全上下文：不是 HTTPS？──API 直接不可用
 │   └─ Permissions Policy：camera 在 allowlist 里吗？──不在 → NotAllowedError
 └─ 页面 fetch("http://192.168.0.1/status")
     └─ Local Network Access：弹权限提示，拒绝 → 请求失败
与此同时，每个出站请求都自动带上 Sec-Fetch-Site/Mode/Dest —— 服务端的最后一道判断依据。
```

注意分层的**互不依赖**：SRI 挡不住恶意 inline 脚本（那是 CSP 的活），CSP 挡不住 renderer 被 0day 攻破（那是沙箱的活），沙箱挡不住 Spectre 读本进程内存（那是站点隔离的活）。这正是纵深防御（defense in depth）的含义。

## 三、分工地图：这个问题去哪查

本叶夹在网络章与（未来的）安全章之间，边界一句话：**net-cors 管跨源读取与 opt-in 隔离头，本叶管浏览器常开防护，安全章管攻击手法与鉴权。**

| 你想查的问题 | 去处 |
| --- | --- |
| 跨源请求为什么被拦？预检怎么触发？带凭证怎么配？ | [网络章 · 跨源与 CORS](/zh/base/network/net-cors/) |
| SameSite Cookie、COOP/COEP、`crossOriginIsolated` | [网络章 · SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep) |
| TLS 握手、证书链、HSTS | [网络章 · HTTPS 与 TLS](/zh/base/network/net-https-tls/) |
| XSS/CSRF 攻击手法、加密算法、OAuth/JWT、Helmet 配置 | 安全章（待产出） |
| 站点隔离的进程模型、OOPIF、内存代价 | [浏览器架构 · 站点隔离](../browser-architecture/guide-line/site-isolation) |
| CSP 怎么写、Trusted Types 怎么接、SRI 哈希怎么生成 | 本叶 [CSP 基础](./guide-line/csp-basics) → [防注入三件套](./guide-line/strict-csp-trusted-types) |
| iframe 嵌第三方怎么限权、防点击劫持配哪个头 | 本叶 [iframe sandbox 与点击劫持](./guide-line/iframe-sandbox-clickjacking) |
| 为什么 localhost 能用 SW 而 http 站点不能、混合内容为什么有的升级有的拦 | 本叶[安全上下文与混合内容](./guide-line/secure-contexts-mixed-content) |
| iframe 里 autoplay/摄像头失效、公网页面访问内网失败、`Sec-Fetch-*` 怎么用 | 本叶[能力与元数据防护](./guide-line/permissions-policy-fetch-metadata) |
| CDN 脚本突然报网络错误加载失败（integrity 不匹配） | 本叶[防注入三件套](./guide-line/strict-csp-trusted-types) |
| `Referer` 带出了敏感路径/参数怎么收 | [网络章 · HTTP 头部](/zh/base/network/net-http-basics/guide-line/http-headers)（本叶只在响应头速查里提一句） |

判断口诀：问题落在「**两个源之间能不能读**」→ 网络章；落在「**浏览器允不允许这段代码/这个能力/这次嵌入**」→ 本叶；落在「**攻击者怎么构造利用、身份怎么鉴别**」→ 安全章。

## 四、一套共用的观测基建：Reporting API

本叶会反复出现同一对搭档：`*-Report-Only` 头 + `report-to`。这是刻意的设计——各防线的**违规观测走同一套 Reporting API**：

```http
# 一次声明端点，多个机制共用
Reporting-Endpoints: sec-reports="https://example.com/reports"

Content-Security-Policy-Report-Only: script-src 'self'; report-to sec-reports
Permissions-Policy-Report-Only: geolocation=();report-to=sec-reports
Integrity-Policy-Report-Only: blocked-destinations=(script), endpoints=(sec-reports)
```

由此形成所有防线共用的上线节奏：**先 Report-Only 观测真实流量 → 按报告修代码/改配置 → 换强制头 → 保留上报持续监控**。谁在违规、违在哪个文件哪一行，报告 JSON 里都有；页内还可用 `ReportingObserver` 实时订阅。把报告端点在项目初期就搭好，后面每接入一道防线都是复用。

## 五、旧认知快检：这些说法已经过时

浏览器安全的资料半衰期很短，读本叶前先把几条流传最广的旧结论标记出来——每条的新答案都在对应深度页展开：

| 旧认知 | 2026 年的事实 | 展开 |
| --- | --- | --- |
| 「CSP 写好域名白名单就安全了」 | 白名单 CSP 已被证明易绕过、难维护，官方推荐 nonce/hash + `'strict-dynamic'` 的 strict CSP | [防注入三件套](./guide-line/strict-csp-trusted-types) |
| 「Trusted Types 只有 Chrome 支持，生产不敢用」 | **Baseline 2026-02 Newly available**——各主流浏览器最新版已全支持，老版本一行 tinyfill 兜底 | 同上 |
| 「HTTPS 页面里的 HTTP 图片只是控制台警告」 | 已换代：img/audio/video **自动升级**到 https，script/iframe/fetch **直接阻断**，不存在「仅警告」档 | [安全上下文与混合内容](./guide-line/secure-contexts-mixed-content) |
| 「防点击劫持配 `X-Frame-Options: ALLOW-FROM 源`」 | ALLOW-FROM 已废——现代浏览器遇到它**整头忽略**；来源白名单用 CSP `frame-ancestors` | [iframe sandbox 与点击劫持](./guide-line/iframe-sandbox-clickjacking) |
| 「iframe 加了 sandbox 就放心嵌」 | 同源内容 + `allow-scripts` + `allow-same-origin` 可**自拆沙箱**；不可信内容必须独立源 | 同上 |
| 「公网页面 fetch 内网设备，配好 CORS 就行」 | Chrome 142 起走 **Local Network Access 权限提示**；PNA 的预检方案已搁置 | [能力与元数据防护](./guide-line/permissions-policy-fetch-metadata) |
| 「CSRF 防御只能靠 token」 | `Sec-Fetch-*` 已 Baseline（2023-03），服务端一个 if 即可拒掉跨站流量，与 token 叠加 | 同上 |
| 「混合内容要配 `block-all-mixed-content`」 | 该指令**已废弃**；升级语义成为默认后只需 `upgrade-insecure-requests` 处理存量 | [安全上下文与混合内容](./guide-line/secure-contexts-mixed-content) |
| 「CSP 违规上报写 `report-uri`」 | `report-uri` 已废弃，现行是 `Reporting-Endpoints` + `report-to`，过渡期可并写 | [CSP 基础](./guide-line/csp-basics) |
| 「安全上下文就是 HTTPS」 | `http://localhost`、`http://127.0.0.1`、`http://*.localhost`、`file://` 也算（本机投递）；反之 HTTPS iframe 嵌在 HTTP 页里**不算** | [安全上下文与混合内容](./guide-line/secure-contexts-mixed-content) |
| 「CORB 拦截是玄学，遇到了只能关」 | 它按 MIME 判定——数据接口标准 MIME + `nosniff` 就能与它和平共处 | [沙箱与隔离防御](./guide-line/sandbox-isolation-defense) |

防线从最常配、也最常配坏的一道开始：先看 [CSP 基础](./guide-line/csp-basics)。
