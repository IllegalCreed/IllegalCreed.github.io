---
layout: doc
outline: [2, 3]
---

# Cookie SameSite 与 COOP/COEP/CORP

> 基于 HTTP 现代标准 · 核于 2026-06

CORS 解决的是「页面能否读取跨域响应」，而本页四个机制管的是另一条线：**浏览器要不要带 Cookie、跨源资源能不能被引用、不同源的 window 要不要隔离**。它们共同支撑起现代浏览器的「跨源隔离」边界。

## 速查

- **SameSite=Strict**：完全禁止跨站请求携带 Cookie，连从外站点击链接跳回来的首次导航都不带（适合纯粹的会话敏感场景）。
- **SameSite=Lax**：**现代浏览器的默认值**。仅放行「顶级导航 + 安全方法（GET/HEAD）」携带 Cookie，排除 `fetch`、`<img>`/`<script>` 子资源、`<iframe>` 内导航。
- **SameSite=None**：跨站、同站都带 Cookie，**必须同时设置 `Secure`**（只能走 HTTPS），否则浏览器拒绝写入。
- **Lax 作为默认时更宽松**：未显式声明 SameSite 的 Cookie，在设置后 **2 分钟内**也会随跨站 `POST` 发送（兼容历史表单跳转）。
- **SameSite 缓解 CSRF**：跨站发起的状态变更请求（POST/PUT/DELETE）不自动带 Cookie，攻击者伪造的请求拿不到登录态；但它是「纵深防御」一层，不能取代 CSRF Token。
- **「站点 site」≠「源 origin」**：SameSite 的边界是 **scheme + 可注册域（eTLD+1）**，比 origin 宽——`a.example.com` 与 `b.example.com` 同站但不同源。
- **CORP（Cross-Origin-Resource-Policy）**：响应头，声明本资源允许被谁引用，三值 `same-origin` / `same-site` / `cross-origin`，拦截 `no-cors` 跨源读取。
- **COOP（Cross-Origin-Opener-Policy）**：响应头，`same-origin` 将本页放入独立的浏览上下文组，切断与跨源 `window.opener` 的互访。
- **COEP（Cross-Origin-Embedder-Policy）**：响应头，`require-corp` 要求所有跨源子资源都带 CORP 或 CORS，否则拒载；`credentialless` 则以无凭证方式加载。
- **跨源隔离 crossOriginIsolated**：COOP `same-origin` + COEP `require-corp` 同时满足后解锁 `SharedArrayBuffer`、高精度 `performance.now()`（5µs 级）、`measureUserAgentSpecificMemory()`，用 `self.crossOriginIsolated` 检测。

## 一、Cookie SameSite 属性

`SameSite` 是 `Set-Cookie` 的一个属性，控制**这枚 Cookie 是否随跨站请求自动发送**。它直接决定第三方上下文（如别人页面里的 `<img>`、`fetch`、表单跳转）能否带上你的登录态。

### 1.1 三个取值对比

| 取值 | 同站请求 | 跨站请求 | 必须 Secure | 典型用途 |
| --- | --- | --- | --- | --- |
| `Strict` | 携带 | **一律不带**（含外站点击链接跳回的首次导航） | 否 | 银行转账、改密等高敏感会话 |
| `Lax`（默认） | 携带 | 仅「顶级导航 + 安全方法」携带 | 否 | 普通登录态会话（绝大多数场景） |
| `None` | 携带 | **携带** | **是** | 跨站嵌入、第三方 SSO、跨域 API 鉴权 |

```http
Set-Cookie: sid=abc; SameSite=Strict
Set-Cookie: sid=abc; SameSite=Lax
Set-Cookie: sid=abc; SameSite=None; Secure
```

::: warning Lax 是现代浏览器的默认值
当 `Set-Cookie` **未显式写** `SameSite` 时，现代浏览器按 `Lax` 处理。但「默认 Lax」比「显式 Lax」更宽松：Cookie 在**设置后 2 分钟内**仍会随跨站 `POST` 发送（为兼容老式「表单提交后跳转」流程）。因此**不要依赖这个隐式默认**——需要跨站带 Cookie 就显式写 `None; Secure`，需要严格就显式写 `Lax`/`Strict`。
:::

### 1.2 Lax 究竟放行什么

`Lax` 只在**同时满足两个条件**的跨站请求上携带 Cookie：

1. **顶级导航**——请求会改变地址栏 URL。包括：点击链接从 A 站跳到 B 站、`document.location` 赋值、`<form>` 提交。**排除**：`fetch()`、`<img>`/`<script>` 等子资源、`<iframe>` 内部导航。
2. **安全方法**——即 `GET`/`HEAD`，**排除** `POST`/`PUT`/`DELETE`。

也就是说：用户从搜索结果点链接进入你的站点（顶级 GET 导航），Cookie 会带上，登录态保留——这正是 `Lax` 兼顾安全与体验的设计。

### 1.3 SameSite 如何缓解 CSRF

CSRF（跨站请求伪造）的本质是：攻击者诱导你在已登录站点上发出**非预期的状态变更请求**，浏览器自动带上了你的 Cookie。

`SameSite` 从「带不带 Cookie」这一层切断它：

- `Strict` / `Lax` 下，攻击者页面里的 `<form method="POST">`、`fetch` 等**跨站状态变更请求不会自动携带目标站 Cookie**，伪造请求落到服务端时是「未登录」状态，被拒。
- `Lax` 仍放行顶级 GET 导航带 Cookie，所以**依赖 GET 做状态变更是危险的**（这也是「GET 必须幂等安全」的安全意义所在）。

::: tip 边界说明
`SameSite` 是 CSRF 防御的**纵深一层**，不是银弹——同站子域被攻破、或必须使用 `SameSite=None` 的场景仍需 CSRF Token / Origin 校验兜底。CSRF 的完整攻防（Token、双提交、Origin/Referer 校验）属「浏览器安全」叶，本页不展开。
:::

### 1.4 「跨站 site」与「跨域 origin」的区别

这是 SameSite 语境最易混淆的点：**SameSite 比较的是「站点 site」，不是「源 origin」。**

- **源（origin）** = `scheme + host + port` 三者全等才同源（CORS 的判定单位，见[第 1 页](./same-origin-policy)）。
- **站点（site）** = `scheme + 可注册域（eTLD+1）`，**不看子域、不看端口**（SameSite 的判定单位）。

| 对比 | 是否同源（origin） | 是否同站（site） |
| --- | --- | --- |
| `https://app.example.com` vs `https://api.example.com` | 否（host 不同） | **是**（同为 `example.com`） |
| `https://example.com` vs `https://example.com:8443` | 否（端口不同） | **是** |
| `https://example.com` vs `http://example.com` | 否（scheme 不同） | **否**（schemeful：scheme 也要同） |
| `https://example.com` vs `https://other.com` | 否 | 否 |

现代浏览器采用 **schemeful same-site**：`http` 与 `https` 即使域名相同也视为**不同站**，因此降级到 HTTP 会丢失 SameSite Cookie。结论：**同站 ⊋ 同源**，跨子域属于「同站跨源」，SameSite 不拦它带 Cookie，但 CORS 仍按跨源管。

## 二、跨源资源策略 CORP

`Cross-Origin-Resource-Policy`（CORP）是**响应头**，由资源所有者声明「**谁可以引用我**」，用于拦截 `no-cors` 模式的跨源/跨站读取，缓解 Spectre 这类侧信道把别人资源读进自己进程的攻击。

| 值 | 含义 |
| --- | --- |
| `same-origin` | 仅同源页面可引用本资源 |
| `same-site` | 同站（scheme + eTLD+1）即可引用，允许同站跨源 |
| `cross-origin` | 任意源都可引用（如公共 CDN 静态资源） |

```http
Cross-Origin-Resource-Policy: same-origin
```

::: tip CORP 与 CORS 的区别
- **CORS** 是「**请求方**想读跨源响应」时的协商（`Access-Control-*`，见[第 4 页](./cors-credentials-headers)），默认拦截读取、靠服务端放行。
- **CORP** 是「**资源方**主动声明谁能引用我」，针对的是 `no-cors` 引用（如 `<img>`、`<script>`），CORS 管不到的那部分由 CORP 兜。
两者互补：一个资源既可被 CORS 放行读取，也可用 CORP 限制被引用范围。
:::

## 三、COOP 与 COEP：通往跨源隔离

`SharedArrayBuffer`、高精度计时器等强力能力，曾被 Spectre 用作侧信道攻击的「放大器」。浏览器的对策是：**只有在页面证明自己处于「跨源隔离」状态后，才解锁这些能力**。COOP + COEP 就是这把双重锁。

### 3.1 COOP（隔离 window.opener）

`Cross-Origin-Opener-Policy` 控制本页与「打开它的窗口 / 它打开的窗口」是否同处一个**浏览上下文组（Browsing Context Group, BCG）**——同组才能通过 `window.opener` 互访。

| 值 | 行为 |
| --- | --- |
| `unsafe-none`（默认） | 不隔离，允许与任意文档共享 BCG |
| `same-origin-allow-popups` | 自身进入隔离组，但保留对 `window.open()` 打开的弹窗的引用（OAuth/支付常用） |
| `same-origin` | 仅与「同源且同为 same-origin」的文档同组；跨源 opener 被切断 |
| `noopener-allow-popups` | 总是把新文档开到新 BCG，彻底切断 opener 关系 |

`same-origin` 下，跨源打开的页面与本页不在同一 BCG，**`window.opener` 互访被切断**（跨源时表现为 `null`），防止恶意页面通过 opener 引用篡改你的页面（即 tabnabbing）。

### 3.2 COEP（管控跨源嵌入）

`Cross-Origin-Embedder-Policy` 要求页面加载的**所有跨源子资源都必须显式授权**，否则拒载。

| 值 | 行为 |
| --- | --- |
| `require-corp` | 每个跨源子资源都必须带 `CORP` 头或通过 CORS（`crossorigin` 属性），否则被拦 |
| `credentialless` | 以「不带凭证（Cookie 等）」的方式加载跨源资源，无需对方提供 CORP |

```http
Cross-Origin-Embedder-Policy: require-corp
```

### 3.3 跨源隔离 crossOriginIsolated

**当且仅当**顶级文档同时返回下面两个头，页面进入「跨源隔离」状态：

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

此时 `self.crossOriginIsolated` 为 `true`，解锁以下能力：

| 解锁能力 | 说明 |
| --- | --- |
| `SharedArrayBuffer` | WebAssembly 多线程依赖它，非隔离环境被禁用 |
| 高精度 `performance.now()` | 计时分辨率从 ~100µs 提升到 **5µs 级**（高精度计时器） |
| `measureUserAgentSpecificMemory()` | 精确测量页面内存占用 |

```js
if (self.crossOriginIsolated) {
  // 安全使用 SharedArrayBuffer、高精度计时器等
  const sab = new SharedArrayBuffer(1024)
}
```

::: warning 落地顺序
开 `require-corp` 后，页面里**所有**跨源资源（图片、脚本、字体、iframe）都需带 CORP 或走 CORS，漏一个就整页加载失败。建议先用 <code v-pre>Cross-Origin-Embedder-Policy-Report-Only: require-corp</code> 跑报告、补齐资源授权，再切正式头。
:::

## 小结

本页收口「跨域与同源策略」整叶：在 CORS 解决「读取跨域响应」之外，**SameSite 管 Cookie 携带、CORP 管资源被引用、COOP/COEP 管 window 与子资源隔离**。

- **SameSite**：`Strict` 全禁跨站带 Cookie / `Lax`（现代默认）放行顶级 GET 导航 / `None` 必须配 `Secure`；它从「不带 Cookie」一层缓解 CSRF，但需配合 Token 等纵深防御。
- **站点 ≠ 源**：SameSite 按「scheme + eTLD+1」判同站，比 CORS 的 origin 宽，跨子域属同站跨源。
- **跨源隔离三件套**：COOP `same-origin` + COEP `require-corp` 解锁 `SharedArrayBuffer` 与高精度计时器，CORP 为被引用资源放行；用 `self.crossOriginIsolated` 验证。

回顾整叶脉络：同源策略定义边界 → 跨域场景与报错 → CORS 简单/预检 → CORS 凭证与首部 → JSONP 与反向代理 → 本页的 Cookie 与隔离策略。CSRF 完整攻防归「浏览器安全」叶。

- 上一页：[JSONP 与反向代理方案](./jsonp-proxy)
- 参考资料汇总：[参考](../reference)
