---
layout: doc
outline: [2, 3]
---

# 能力与元数据防护

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **Permissions Policy**（原名 **Feature Policy**）：用响应头按目录管理强能力——`Permissions-Policy: camera=(), geolocation=(self)`；就算代码有漏洞被注入，**摄像头这类能力根本不在授权目录里**
- allowlist 语法：**`*`**（所有上下文）、**`()`**（全禁）、**`self`**（仅同源）、**`src`**（iframe 专用：与 `src` 属性同源即放行，是 `allow` 属性的默认值）、**`"https://a.example.com"`**（指定源，头里要带引号）、**`"https://*.example.com"`**（通配子域，**不匹配裸域**）
- **双通道叠加**：顶层页面的**响应头** × iframe 的 **`allow` 属性**——两道都放行才可用，任一道收紧即禁；iframe 只能**收窄**继承来的授权，不能放大
- 常用指令：`camera`、`microphone`、`geolocation`、`fullscreen`、`autoplay`、`display-capture`、`payment`、`usb`、`web-share`、`picture-in-picture`、`screen-wake-lock`……被禁时的症状是 **`NotAllowedError`/`SecurityError`**（而非权限弹窗）
- 报告链路：`Permissions-Policy-Report-Only` 头 + `report-to=端点`（配 `Reporting-Endpoints`），或页内 **`ReportingObserver`** 订阅 `permissions-policy-violation`
- **Local Network Access（LNA，原 Private Network Access/PNA）**：把「公网页面请求内网/本机」变成**权限提示**——防公网页对路由器、打印机、localhost 服务的 **CSRF**（改 DNS、刷固件）
- 地址三分：**public**（公网）、**local**（RFC1918 私网段 `192.168/16`、`10/8` 等 + 链路本地 + IPv6 ULA）、**loopback**（`127.0.0.0/8`、`::1`、localhost）；对应权限 **`local-network`** 与 **`loopback-network`**（旧名 `local-network-access` 作兼容别名）
- LNA 时间线：PNA 的 **CORS 预检方案（`Access-Control-Allow-Private-Network`）被搁置**，改为权限提示方案；Chrome 138 flag 试用 → **Chrome 142（2025-10）正式落地**；其他引擎跟进中——2026 年做跨浏览器产品仍需查 BCD/caniuse
- LNA 细则：**仅安全上下文可用**（http 公网页打内网一律失败）；权限授予后对本地目标**放宽混合内容**（IP 字面量、`.local` 域自动豁免；公网域名解析到内网 IP 需 `fetch(url, { targetAddressSpace: "local" })` 显式声明）
- **Fetch Metadata**：浏览器给每个请求自动带上 **`Sec-Fetch-Site`**（`same-origin`/`same-site`/`cross-site`/`none`）、**`Sec-Fetch-Mode`**、**`Sec-Fetch-Dest`**、**`Sec-Fetch-User`**——`Sec-` 前缀禁改、只发给 HTTPS——服务端据此**一个 if 拒掉跨站流量**（资源隔离策略）
- Fetch Metadata **Baseline Widely available（2023-03 起全浏览器）**，服务端可放心依赖；`Sec-Fetch-Site: none` = 用户主动发起（地址栏/书签）
- 安全响应头全家福速查见本页第四节；**Referrer-Policy** 一句话——控制 `Referer` 头泄露多少 URL，细节归[网络章 · HTTP 头部](/zh/base/network/net-http-basics/guide-line/http-headers)

## 一、Permissions Policy：能力的授权目录

CSP 管「什么代码能跑」，Permissions Policy 管**「跑起来的代码能用什么能力」**。它由 Feature Policy 更名而来（旧 API `document.featurePolicy` 仍在一些浏览器里残留），核心价值有二：给自己的页面**削权**（哪怕被 XSS，注入代码也调不动摄像头），给嵌进来的第三方**限权**（广告 iframe 别想读定位）。

### 1.1 头部语法与 allowlist

```http
# 结构：指令=(allowlist)，逗号分隔多指令；可选 ;report-to=端点
Permissions-Policy: camera=(), microphone=()
# 全站禁用摄像头与麦克风：getUserMedia 直接拒绝 NotAllowedError

Permissions-Policy: geolocation=(self "https://map.partner.example")
# 定位：本源 + 指定伙伴源可用；注意头里的具体源要带引号

Permissions-Policy: fullscreen=*
# 全屏：任何上下文（含所有 iframe）可用
```

| 值 | 语义 |
| --- | --- |
| `*` | 所有文档与 iframe，无论来源 |
| `()` | 空列表 = 彻底禁用（iframe `allow` 属性里的对应写法是 `'none'`） |
| `self` | 当前文档 + 同源 iframe |
| `src` | 仅 iframe `allow` 属性可用：与 iframe `src` 的源一致即放行——**`allow` 属性的默认值** |
| `"https://a.example.com"` | 指定源（头里带引号；`allow` 属性里不带） |
| `"https://*.example.com"` | 通配子域；**不匹配 `https://example.com` 本身** |

每个指令都有**隐式默认 allowlist**（`*` 或 `self`，因指令而异）：`fullscreen`/`geolocation`/`camera` 等多数强能力默认 `self`——**不发头时，同源内容能用、跨源 iframe 不能用**，这解释了「第三方地图 iframe 定位失效」的默认现象。

### 1.2 双通道：响应头 × iframe allow 属性

跨源 iframe 要用某能力，必须**两道闸都开**：

```http
# 通道一：顶层响应头——本站及可信广告网络可用定位
Permissions-Policy: geolocation=(self "https://trusted-ad.example")
```

```html
<!-- 通道二：iframe allow 属性——把授权显式委托给这个 frame -->
<iframe src="https://trusted-ad.example/widget" allow="geolocation"></iframe>

<!-- 多能力用分号分隔；可带来源列表 -->
<iframe src="https://player.example/embed"
        allow="fullscreen; autoplay; picture-in-picture"></iframe>

<!-- 就算 allow 写了，头里没放行这个源照样禁：两道闸取交集 -->
<iframe src="https://rogue.example" allow="geolocation"></iframe>
```

规则一句话：**每一层只能收窄、不能放大**——iframe 拿不到顶层没有的授权，孙 frame 拿不到父 frame 没委托的授权。配错的症状不是弹权限框，而是 API **直接拒绝**：`getUserMedia` 抛 `NotAllowedError`、`requestFullscreen` 抛 `TypeError`、定位回调收 `PERMISSION_DENIED`——用户看到的是「按钮点了没反应」。

### 1.3 违规观测

```http
Reporting-Endpoints: pp-endpoint="https://example.com/reports"
Permissions-Policy-Report-Only: geolocation=();report-to=pp-endpoint
# Report-Only：不执行，只把「谁在什么位置调了被禁能力」POST 给端点
```

报告类型为 `permissions-policy-violation`，含 `featureId`/`sourceFile`/`lineNumber`；页内可用 `ReportingObserver` 实时订阅。注意 `Permissions-Policy` 头自身在 MDN 标注为 **not Baseline**——指令支持度参差（Chromium 最全），关键路径别只依赖它，把它当纵深里的一层。

## 二、Local Network Access：公网页面打内网，先过权限

### 2.1 威胁与前世（PNA）

浏览器长期存在一个盲区：公网页面可以直接 `fetch("http://192.168.0.1/…")`——你的浏览器**就在内网里**，是天然的跳板。经典攻击链：诱导访问恶意页 → 页面向路由器管理接口发 CSRF 请求（默认密码常年不改）→ 改 DNS 配置 → 此后所有流量被劫持。打印机、NAS、IoT 设备、本机 `localhost` 调试服务同理。

第一代方案 **Private Network Access（PNA）** 走 CORS 路线：公网→内网的请求先发预检，目标设备用 `Access-Control-Allow-Private-Network: true` 显式同意。问题在「要全网内网设备升级固件配合」不现实，**该方案已被搁置**。现行方案 **Local Network Access（LNA）** 改为把决定权交给用户：**权限提示**。

### 2.2 现行模型

| 要素 | 内容 |
| --- | --- |
| 地址三分 | **public**（公网）/ **local**（`192.168.0.0/16`、`10.0.0.0/8` 等 RFC1918 + 链路本地 `169.254/16` + IPv6 `fc00::/7`、`fe80::/10`）/ **loopback**（`127.0.0.0/8`、`::1`、localhost） |
| 触发 | 公网页面请求 local/loopback 目标（子资源、`fetch`、子 frame 导航、SW、WebSocket、WebTransport、WebRTC 逐步纳管） |
| 权限 | **`local-network`** 与 **`loopback-network`** 两枚（旧 `local-network-access` 为兼容别名）；首次触发弹**权限提示**，拒绝则请求失败 |
| 门槛 | **仅安全上下文**：http 公网页面打内网**直接失败**，连提示都没有 |
| 委托 | Permissions Policy 集成，默认 allowlist 为 `self`；跨源 iframe 需 `<iframe allow="local-network">` 显式委托 |
| 落地 | Chrome 138 起 flag（`#local-network-access-check`）试用 → **Chrome 142（2025-10-28）正式启用**；企业可用策略预授/预禁；Firefox/Safari 跟进中（2026-07 口径），跨浏览器场景查 BCD |

### 2.3 开发者侧的三个动作

```js
// 1. 探测权限状态，提前引导用户（而不是等请求静默失败）
const st = await navigator.permissions.query({ name: "local-network" });
if (st.state !== "granted") showSetupGuide();

// 2. 公网域名解析到内网 IP 时，显式声明目标地址空间
//    （IP 字面量与 .local 域浏览器能在 DNS 前识别，可省略）
fetch("http://printer.corp.example/status", {
  targetAddressSpace: "local", // 声明后：权限已授予时豁免混合内容检查
});

// 3. 本机服务同理
fetch("http://localhost:8888/api", { targetAddressSpace: "loopback" });
```

混合内容的联动值得单记一笔：内网设备几乎拿不到公网可信的 TLS 证书，所以 LNA 规定**权限授予后，对可识别的本地目标放宽混合内容检查**——HTTPS 页面得以合法访问 `http://192.168.0.1`。这补上了[上一页](./secure-contexts-mixed-content)「IP 主机阻断不升级」留下的正规出口。受影响的典型业务：设备配网页、内网管理台、跨域打 localhost 的开发工具——升级 Chrome 142 后「突然要弹权限」不是 bug，是新常态。

## 三、Fetch Metadata：把请求来源如实告诉服务端

前面都是浏览器侧拦截；Fetch Metadata 反过来**武装服务端**。浏览器给每个（HTTPS 的）出站请求自动附上四个 `Sec-` 前缀头——脚本改不了、攻击者伪造不了：

| 头 | 取值 | 含义 |
| --- | --- | --- |
| **`Sec-Fetch-Site`** | `same-origin` / `same-site` / `cross-site` / `none` | 发起方与目标的源关系；**`none` = 用户直接发起**（地址栏、书签、拖放） |
| **`Sec-Fetch-Mode`** | `navigate` / `cors` / `no-cors` / `same-origin` / `websocket` | 请求模式；`navigate` = 页面导航 |
| **`Sec-Fetch-Dest`** | `document` / `iframe` / `script` / `image` / `style` / `empty` … | 数据的去处（`empty` ≈ fetch/XHR） |
| **`Sec-Fetch-User`** | 仅 `?1` | 仅出现在**用户手势触发**的导航上 |

服务端据此实施**资源隔离策略（Resource Isolation Policy）**——在框架中间件里加一个 if，把「不该跨站来的流量」整体拒掉：

```js
// 资源隔离策略（伪码）：跨站流量默认拒绝，白放导航类顶层请求
function isRequestAllowed(req) {
  const site = req.headers["sec-fetch-site"];
  const mode = req.headers["sec-fetch-mode"];
  const dest = req.headers["sec-fetch-dest"];

  if (site === undefined) return true;          // 老客户端没有该头：放行（渐进增强）
  if (site === "same-origin" || site === "same-site" || site === "none")
    return true;                                 // 自己人 / 用户直接输入：放行
  if (mode === "navigate" && req.method === "GET"
      && dest !== "object" && dest !== "embed")
    return true;                                 // 跨站的顶层导航（别人链接到我）：放行
  return false;                                  // 其余跨站子资源/接口请求：403
}
```

这一个 if 同时压制 CSRF、跨站的资源盗链与部分 XS-Leaks 探测（攻击原理归安全章，待产出）。放心用的底气：**Baseline Widely available，2023-03 起各浏览器均发**；对不发头的老客户端按「放行 + 走既有 CSRF token 防线」渐进兼容。DevTools → Network → 任一请求的 Request Headers 里可直接观察这四个头。

## 四、安全响应头速查

把本叶讲过的「一行头换一道防线」集中列一遍，作部署清单：

| 响应头 | 一句话 | 细讲 |
| --- | --- | --- |
| `Content-Security-Policy` | 什么代码能跑、资源能从哪来 | [CSP 基础](./csp-basics) |
| `Content-Security-Policy` 之 `frame-ancestors` | 谁能把我嵌进 iframe（防点击劫持） | [iframe sandbox 与点击劫持](./iframe-sandbox-clickjacking) |
| `X-Frame-Options` | 上一条的遗留兜底（DENY/SAMEORIGIN） | 同上 |
| `Permissions-Policy` | 强能力授权目录 | 本页第一节 |
| `X-Content-Type-Options: nosniff` | 禁 MIME 嗅探，助 CORB/ORB 识别 | [沙箱与隔离防御](./sandbox-isolation-defense) |
| `Referrer-Policy` | 控制 `Referer` 头带出多少 URL（防路径/参数泄露）——一句话到此为止 | [网络章 · HTTP 头部](/zh/base/network/net-http-basics/guide-line/http-headers) |
| `Strict-Transport-Security` | 强制后续访问走 HTTPS | [网络章 · HTTPS 与 TLS](/zh/base/network/net-https-tls/guide-line/mitm-hsts) |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` / `Cross-Origin-Resource-Policy` | opt-in 跨源隔离三件套 | [网络章 · SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep) |
| `Reporting-Endpoints` | 各类违规报告的端点声明 | [CSP 基础](./csp-basics)第七节 |

## 小结

能力防线三段式：**Permissions Policy**（原 Feature Policy）用 `指令=(allowlist)` 的响应头 + iframe `allow` 属性双通道管理强能力，两道闸取交集、只能收窄不能放大，被禁的症状是 `NotAllowedError` 而非弹窗；**Local Network Access** 把「公网页面打内网」从盲区变成权限提示——`local-network`/`loopback-network` 两枚权限、仅安全上下文、授权后对本地目标放宽混合内容，PNA 的预检方案已搁置，Chrome 142（2025-10）正式落地、其他引擎跟进中；**Fetch Metadata** 的 `Sec-Fetch-Site/Mode/Dest/User` 四头（Baseline 2023-03）让服务端用一个 if 实施资源隔离策略，把跨站流量挡在业务逻辑之前。加上安全响应头速查表，本叶的机制部分至此讲完——各类指令表、属性表、门控清单的横向对照，进[参考](../reference)。
