---
layout: doc
outline: [2, 3]
---

# 请求模式三件套：mode、credentials 与 cache

> 基于 WHATWG Fetch 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **本页边界**：只讲 fetch 的**选项如何映射行为**；CORS 预检机制、同源策略原理见[跨域机制叶](/zh/base/network/net-cors/)，HTTP 缓存头语义见[缓存首部页](/zh/base/network/net-http-basics/guide-line/connection-range-caching)。
- **mode 四值**：`cors`（fetch 默认：跨域走 CORS 协商）/ `same-origin`（跨域直接网络错误）/ `no-cors`（跨域不协商，换来 opaque 响应）/ `navigate`（仅文档导航，脚本用不到）。
- **no-cors 三限制**：方法只剩 **GET/HEAD/POST**；头只剩 **CORS-safelisted 请求头**（`Range` 也被排除）；响应为 **opaque**。
- **opaque 陷阱**：`status` 恒 **0**、`ok` 恒 `false`、headers 空、body `null`——"能发出去但什么都读不到"，且**无法判断请求成功与否**。
- **opaque 唯一正经用途**：Service Worker 缓存跨域静态资源（CDN 脚本/图片）——能存能回放，就是不能看。
- **credentials 三档**：`omit`（永不带）/ `same-origin`（**默认**：仅同源带）/ `include`（跨域也带）——管 Cookie、TLS 客户端证书、Authorization 头的发送**与** `Set-Cookie` 的接收。
- **include 的服务端配合**：响应必须 `Access-Control-Allow-Credentials: true` **且** `Access-Control-Allow-Origin` 写**具体源**（`*` 无效），否则浏览器按网络错误处理。
- **SameSite 优先级更高**：Cookie 标了 `SameSite=Strict/Lax` 时，`credentials: "include"` 也带不出去——两套开关都要过。
- **cache 六档**：`default`（正常 HTTP 缓存语义）/ `no-store`（不读不写缓存）/ `reload`（不读但写）/ `no-cache`（必发条件请求验证）/ `force-cache`（有就用不管新鲜度）/ `only-if-cached`（只用缓存，miss 即网络错误）。
- **only-if-cached 前置条件**：必须配 `mode: "same-origin"`，否则抛 TypeError。
- **cache 选项 vs 缓存头**：选项是**客户端单方面策略**（怎么用本地 HTTP 缓存），服务端 `Cache-Control` 决定的是**缓存里存什么、新鲜多久**——两层配合不冲突。
- **redirect 三值**：`follow`（默认自动跟随）/ `error`（遇重定向直接 reject）/ `manual`（返回 **opaqueredirect**：status 0、几乎全滤掉，为 SW 存储重放设计，**读不到 Location**）。
- **重定向侦测**：跟随后用 `response.redirected`（是否跳过）与 `response.url`（最终落点）复核，防开放重定向把数据发去恶意源。
- **referrer / referrerPolicy**：`referrer` 定制 `Referer` 头（传 `""` 整个省略、默认 `about:client`）；`referrerPolicy` 与 `Referrer-Policy` 响应头同一套取值。
- **integrity 子资源完整性**：`sha256-/sha384-/sha512-` + Base64 摘要；哈希不匹配按**网络错误 reject（TypeError）**——校验从 CDN 拉的静态资产没被篡改。
- **priority 三值**：`high`/`low`/`auto`（默认）——资源加载优先级**提示**（hint 非强制）；**Baseline Newly available 2024-10**（Chrome 101 / Safari 17.2 / Firefox 132 补齐）。

## 一、mode：跨域行为的总开关

`mode` 决定"这个请求允不允许跨域、以什么规则跨"：

| 值 | 跨域行为 | 典型场景 |
| --- | --- | --- |
| `cors`（fetch 默认） | 跨域走 **CORS 协商**：简单请求直发、非简单先预检；服务端头不对则拿不到响应 | 调第三方/跨子域 API 的正常姿势 |
| `same-origin` | 跨域**直接网络错误**（请求根本不发） | 强约束"绝不出本源"的内部接口 |
| `no-cors` | 跨域**不协商也不预检**，但响应变 opaque | SW 缓存跨域静态资源；埋点"发出去就行" |
| `navigate` | 仅浏览器**文档导航**时自建 | 脚本里传它没有意义 |

CORS 协商的机制细节（什么算简单请求、预检怎么谈、各响应头语义）是网络层知识，本站已在[跨域机制叶](/zh/base/network/net-cors/)完整展开——本页只需要记住 fetch 侧的映射：**`mode: "cors"` 下服务端不配合 = `fetch()` reject TypeError**，浏览器控制台能看到 CORS 报错，但脚本只能拿到一个笼统的网络错误（安全设计：不让脚本探测跨域细节）。

`no-cors` 的三条硬限制（MDN 口径）：

1. 方法只能 `GET`/`HEAD`/`POST`；
2. 头只能是 **CORS-safelisted 请求头**（`Accept`、`Accept-Language`、`Content-Language`、受限取值的 `Content-Type`），**且 `Range` 也不允许**——SW 里补的头同样受限；
3. 响应是 **opaque**。

## 二、opaque 响应：能发出去，但什么都读不到

`no-cors` 跨域请求的响应 `type` 为 `"opaque"`，它被浏览器"封箱"：

```js
const res = await fetch("https://cdn.example.com/lib.js", { mode: "no-cors" });

res.type;    // "opaque"
res.status;  // 0 —— 不是真实状态码！
res.ok;      // false —— 永远 false
[...res.headers]; // [] —— 头全滤掉
res.body;    // null —— body 读不到
await res.text(); // "" —— 空串，不是脚本内容
```

三个连环陷阱：

- **无从判断成败**：status 恒 0，服务器返回 200 还是 404 你都不知道——`no-cors` 埋点"看起来发出去了"，实际可能全 404；
- **`ok` 检查全军覆没**：通用封装里 `if (!res.ok) throw` 的逻辑遇到 opaque 一律抛错，哪怕请求其实成功了；
- **Cache API 存 opaque 的占位开销**：opaque 响应能被 SW 缓存（这是它存在的意义），但浏览器为防泄露会给它记一个**远大于实际的配额占用**（Chromium 系约 7MB 级别的保守计数），大量缓存 opaque 资源会意外撑爆配额。

判断准则：**想读响应就必须走 CORS**（`mode: "cors"` + 服务端配头）；`no-cors` 只用于"纯发送"（且要接受成败未知）或"SW 缓存转发"两个场景。真实项目里 `no-cors` 出现在业务代码里，九成是把它当"绕过 CORS 报错"的偏方——绕过的只是报错，数据照样拿不到。

## 三、credentials：凭据三档

"凭据"= HTTP Cookie + TLS 客户端证书 + `Authorization`/`Proxy-Authorization` 头。`credentials` 同时管**发**（请求带不带）与**收**（响应里的 `Set-Cookie` 认不认）：

| 值 | 行为 |
| --- | --- |
| `omit` | 任何情况都不带凭据，也忽略响应的 `Set-Cookie` |
| `same-origin`（默认） | 仅同源请求带凭据 |
| `include` | 跨域也带——需服务端明确配合（见下） |

```js
// 跨子域会话接口：api.example.com 要带上 example.com 的登录 Cookie
const res = await fetch("https://api.example.com/me", {
  credentials: "include",
});
```

`include` 是 CSRF 风险放大器，所以规范要求**双向确认**——服务端响应必须同时满足：

1. `Access-Control-Allow-Credentials: true`；
2. `Access-Control-Allow-Origin` 写**具体的请求源**（此时 `*` 通配被禁用）。

缺一条，浏览器把响应按网络错误处理（fetch reject）。另外两个常见误判：

- **SameSite 是另一道闸**：Cookie 自身标了 `SameSite=Strict`/`Lax`（现代浏览器默认 Lax）时，跨站请求 `include` 也带不出去——"为什么 include 了还没 Cookie"的头号答案；
- **`headers` 里手写 Cookie 无效**：`Cookie` 是禁设头，静默忽略——凭据只能靠这套开关声明。

## 四、cache：六档缓存策略

`cache` 声明"这次请求**怎么用浏览器的 HTTP 缓存**"。六个值按"读缓存吗 → 新鲜度怎么算 → 写缓存吗"理解（HTTP 缓存本身的新鲜度/验证器语义见[缓存首部页](/zh/base/network/net-http-basics/guide-line/connection-range-caching)）：

| 值 | 读缓存 | 行为 | 写缓存 |
| --- | --- | --- | --- |
| `default` | 是 | 标准语义：新鲜直接用；过期发**条件请求**验证（304 则用缓存） | 是 |
| `no-store` | 否 | 完全绕过缓存直连网络 | **否** |
| `reload` | 否 | 直连网络 | **是**（刷新缓存） |
| `no-cache` | 是 | 命中也**必发条件请求**验证，304 才用缓存 | 是 |
| `force-cache` | 是 | 命中就用，**过期也用**；miss 才走网络 | 是 |
| `only-if-cached` | 是 | 命中就用（过期也用）；**miss 直接按网络错误 reject** | — |

```js
// 场景一：强制拿最新（用户点了"刷新报表"）—— 拉新并更新缓存
await fetch("/api/report", { cache: "reload" });

// 场景二：能用就用，省流量（静态字典、图标）
await fetch("/assets/dict.json", { cache: "force-cache" });

// 场景三：只查缓存不碰网络（离线兜底探测）
// 注意：only-if-cached 必须配 same-origin，否则抛 TypeError
try {
  const res = await fetch("/assets/dict.json", {
    cache: "only-if-cached",
    mode: "same-origin",
  });
} catch {
  // 缓存没有 —— 走降级逻辑
}
```

概念对齐：这里的 `cache` 选项是**客户端单方面的使用策略**，与服务端 `Cache-Control` 响应头（决定"能不能存、新鲜多久"）是两层——比如 `force-cache` 也救不了响应头本身 `no-store` 的资源（缓存里根本没有）。名字撞车但含义不同的 `no-cache`（选项：必验证）与 `no-store`（选项：不碰缓存）沿用了 `Cache-Control` 的同名指令语义。

## 五、redirect、referrer 与 referrerPolicy

### redirect 三值

| 值 | 行为 |
| --- | --- |
| `follow`（默认） | 自动跟随重定向链，`response` 是**最终落点**的响应 |
| `error` | 服务器返回重定向状态码即 **reject（TypeError）** |
| `manual` | 返回 `type: "opaqueredirect"` 的响应：status 0、头体全滤——**不是给你读 Location 手动跳的**，是给 SW 原样存储/回放重定向用的 |

`manual` 的命名极具误导性——它**读不到** `Location`（安全考虑），页面脚本几乎用不上。脚本侧对重定向能做的是**事后侦测**：

```js
const res = await fetch("/api/data");
if (res.redirected) {
  // 发生过跳转：校验落点还在可信域，防开放重定向劫持
  const finalOrigin = new URL(res.url).origin;
  if (finalOrigin !== location.origin) throw new Error("重定向出了可信域");
}
```

另一个隐蔽交互：**流式上传 body 遇到非 303 重定向会直接 reject**（body 无法重放），见[流式页](./streaming-keepalive)。

### referrer 与 referrerPolicy

```js
await fetch("/api/track", {
  referrer: "",                            // 空串 = 整个省略 Referer 头
  // referrer: "/landing",                 // 或指定一个同源 URL（默认 about:client）
  referrerPolicy: "strict-origin-when-cross-origin", // 与 Referrer-Policy 头同套取值
});
```

`referrer` 管"这个头写什么"（只能同源 URL 或空串，跨源值会被忽略回默认），`referrerPolicy` 管"什么情况下发多少"（`no-referrer`、`origin`、`strict-origin-when-cross-origin` 等九档，语义与响应头 `Referrer-Policy` 完全一致）。隐私敏感的第三方上报常配 `referrerPolicy: "no-referrer"`。

## 六、integrity 与 priority

### integrity：子资源完整性（SRI）

给 fetch 的响应体挂哈希校验——从 CDN 等"半信任"源拉静态资产时，确认内容没被篡改：

```js
// 格式：<算法>-<Base64 摘要>，算法限 sha256 / sha384 / sha512
const res = await fetch("https://cdn.example.com/lib.v2.js", {
  integrity: "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC",
});
// 哈希不匹配：不 fulfill 一个"坏响应"，而是整个按网络错误 reject（TypeError）
const code = await res.text();
```

语义与 `<script integrity>` 属性一致；注意校验失败落在**网络层错误**（catch 里是 TypeError），不是 `!ok`。

### priority：资源加载优先级提示

```js
// 首屏关键数据：提高相对同类请求的调度优先级
fetch("/api/critical-above-the-fold", { priority: "high" });

// 预取下一页：明确降级，别跟关键请求抢带宽
fetch("/api/prefetch-next-page", { priority: "low" });
```

取值 `high` / `low` / `auto`（默认，非法值也回落 auto）——这是**提示（hint）而非强制**，浏览器在同类型请求间参考它调度。**Baseline Newly available 2024-10**（Chrome 101 早已支持、Safari 17.2 跟进、Firefox 132 补齐后达成），与 `<img fetchpriority>` 属性同属 Fetch Priority 体系。

## 七、易错点

- **用 `no-cors` "绕过" CORS 报错**：报错没了，数据也没了（opaque）——想读响应只能服务端配 CORS 头，机制见[跨域机制叶](/zh/base/network/net-cors/)。
- **对 opaque 响应做 `ok` 检查**：恒 `false`（status 0）——通用封装要对 `type === "opaque"` 单独放行或拒收。
- **SW 大量缓存 opaque 资源**：配额按保守值虚记，撑爆存储——跨域资源尽量让源站开 CORS 后用 `cors` 模式缓存。
- **`credentials: "include"` 后端只配了 ACAO**：还差 `Access-Control-Allow-Credentials: true`，且 ACAO 不能是 `*`——三件套齐了才通。
- **include 了还是没带 Cookie**：查 Cookie 的 `SameSite` 属性——`Strict/Lax` 拦截跨站发送，与 credentials 无关。
- **在 `headers` 里写 `Cookie`/`Origin`**：禁设头静默忽略——凭据走 `credentials`，来源浏览器接管。
- **`no-cache` 与 `no-store` 记反**：`no-cache` = 必验证后可用缓存；`no-store` = 完全不碰缓存——与 `Cache-Control` 同名指令同义。
- **`only-if-cached` 忘配 `same-origin`**：直接抛 TypeError——两个选项绑定出现。
- **以为 `redirect: "manual"` 能读 Location**：opaqueredirect 什么都不给——页面脚本处理跳转靠 `res.redirected`/`res.url` 事后校验。
- **重定向后不校验 `res.url`**：`follow` 默认静默跟到底，开放重定向可能把带凭据的请求送去恶意域。
- **integrity 校验失败当 HTTP 错误处理**：它是 reject（TypeError）不是 `!ok`——catch 分支里要能识别。
- **把 `priority` 当保证**：它只是调度提示，不改变请求顺序的语义正确性——关键依赖靠代码顺序与 await 表达。

策略面收官，下一页进入 fetch 的"高级形态"——流式读写、离页存活与 fetchLater 前沿：[流式与离页请求](./streaming-keepalive)。
