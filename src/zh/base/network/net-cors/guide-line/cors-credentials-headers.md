---
layout: doc
outline: [2, 3]
---

# CORS 凭证与 Access-Control 首部全谱

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **凭证（credentials）三类**：Cookie、HTTP 认证首部（如 `Authorization`）、TLS 客户端证书；默认跨域请求**不带**凭证。
- **前端开启凭证**：`fetch(url, { credentials: 'include' })`；XHR `xhr.withCredentials = true`；`EventSource` 用 `withCredentials: true`。
- **服务端开关**：响应须带 `Access-Control-Allow-Credentials: true`（唯一合法值就是字符串 `true`，不需要时直接**省略**而非写 `false`）。
- **头号坑**：带凭证时 `Access-Control-Allow-Origin` **不能用 `*`**，必须**回显具体源**（如 `https://foo.example`）。
- **连带约束**：带凭证时 `Access-Control-Allow-Methods`、`Access-Control-Allow-Headers`、`Access-Control-Expose-Headers` 也**不能用 `*`**，须逐项列举。
- **`*` 是字面量**：带凭证时浏览器把 `*` 当**字面星号源**匹配，不再是通配符，于是直接失配报错。
- **响应头六件套**：Allow-Origin / Allow-Methods / Allow-Headers / Allow-Credentials / Expose-Headers / Max-Age。
- **`Expose-Headers`**：不配时 JS 只能读 7 个 CORS 安全首部，要读自定义响应头须显式 allowlist。
- **`Max-Age`**：预检结果缓存秒数，省略默认 5 秒，浏览器有上限（如 Chrome 7200s、Firefox 86400s）。
- **`Vary: Origin` 必加**：只要 Allow-Origin 回显具体源（而非 `*`），就必须加，否则缓存会把 A 站的响应错发给 B 站。
- **预检不带凭证**：`OPTIONS` 预检本身**从不**携带 Cookie；预检响应过关后，真实请求才带凭证。
- **报错关键词**：`Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'`。

## 什么是「带凭证的请求」

跨域请求默认是**匿名**的：浏览器不会自动附带 Cookie，也不允许服务端的 `Set-Cookie` 生效。要让请求携带身份信息，必须**前端开启 + 后端放行**双向同意。这里的「凭证」明确指三类：

- **Cookie**（最常见，会话态全靠它）；
- **HTTP 认证信息**（如 `Authorization: Basic/Bearer`）；
- **TLS 客户端证书**（双向 TLS 场景）。

::: warning 凭证是「全有或全无」
`credentials: 'include'` 一旦开启，这三类凭证会按浏览器策略整体携带，**无法只带 Cookie 不带证书**。另外第三方 Cookie 策略仍然生效——即便前后端都配置正确，浏览器层面屏蔽了第三方 Cookie，请求里照样不会有它。
:::

## 前端：如何开启凭证

三种主流 API 的写法：

```js
// 1) Fetch API —— credentials 取值 'omit'（不带）/ 'same-origin'（默认，仅同源带）/ 'include'（跨域也带）
fetch("https://bar.other/api/profile", {
  credentials: "include",
});

// 2) XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open("GET", "https://bar.other/api/profile", true);
xhr.withCredentials = true; // 关键开关
xhr.send();

// 3) EventSource（SSE）
const es = new EventSource("https://bar.other/sse", { withCredentials: true });
```

::: tip fetch 默认值的变化点
现代浏览器 `fetch` 的 `credentials` 默认是 `same-origin`：同源自动带、跨域不带。所以跨域要带 Cookie，**必须显式写 `include`**，漏写是登录态丢失的高频原因。
:::

## 服务端：如何放行凭证

前端开了 `include`，服务端还得明确点头，否则浏览器会**直接丢弃响应**并报网络错误（JS 拿不到任何数据）。核心是两条响应头配合：

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://foo.example   # 必须是具体源，不能是 *
Access-Control-Allow-Credentials: true             # 唯一合法值就是 true
Vary: Origin                                        # 回显具体源时必加
```

- 非预检请求：响应缺 `Access-Control-Allow-Credentials: true`，浏览器报错、丢响应。
- 预检请求：`OPTIONS` 预检**本身不带凭证**；只有当预检响应带了 `Access-Control-Allow-Credentials: true`，真实请求才会携带凭证。

## 关键约束：凭证 + 通配符 `*` 冲突（高频坑）

这是 CORS 最容易踩的一个坑，务必牢记：**一旦请求带凭证，所有放行头都不能用 `*`**。

| 响应头                          | 匿名请求可用 `*` | 带凭证请求           |
| ------------------------------- | :--------------: | -------------------- |
| `Access-Control-Allow-Origin`   |        ✅        | ❌ 必须回显具体源    |
| `Access-Control-Allow-Methods`  |        ✅        | ❌ 必须逐个列举方法  |
| `Access-Control-Allow-Headers`  |        ✅        | ❌ 必须逐个列举首部  |
| `Access-Control-Expose-Headers` |        ✅        | ❌ 必须逐个列举首部  |

原因：带凭证意味着响应里可能含**用户专属的敏感数据**。若允许 `*`，等于让**任意源**都能携带受害者的 Cookie 读取响应，等同放开 CSRF 式数据窃取。所以规范规定——**带凭证时 `*` 被当作「字面意义的星号源」**去和 `Origin` 做精确字符串匹配，几乎必然失配，浏览器随即抛出：

```text
Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'
```

::: danger 正确做法：动态回显 + 白名单
不能图省事写 `*`，也不能无脑回显任意 `Origin`（等于对所有源开放）。正确姿势是：维护**源白名单**，命中才把请求的 `Origin` 原样回显，并补 `Vary: Origin`：
```js
// Node/Express 伪代码
const ALLOW = new Set(["https://foo.example", "https://app.example"]);
const origin = req.headers.origin;
if (ALLOW.has(origin)) {
  res.setHeader("Access-Control-Allow-Origin", origin); // 回显具体源
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin"); // 缓存按 Origin 分桶
}
```
:::

## Access-Control-\* 响应头全谱

| 响应头                            | 作用                                       | 取值 / 默认                                                  | 备注                                       |
| --------------------------------- | ------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| `Access-Control-Allow-Origin`     | 声明哪个源可读取响应                       | 具体源 / `*` / `null`                                       | 带凭证只能具体源；回显时配 `Vary: Origin`  |
| `Access-Control-Allow-Methods`    | 预检中声明真实请求允许的方法               | `GET, POST, PUT, ...` / `*`                                | 带凭证不可用 `*`                           |
| `Access-Control-Allow-Headers`    | 预检中声明真实请求允许的自定义首部         | 首部名列表 / `*`                                           | 带凭证不可用 `*`；回应 `Request-Headers`   |
| `Access-Control-Allow-Credentials`| 声明是否允许携带凭证                       | 仅 `true`                                                  | 不需要时**省略**，别写 `false`             |
| `Access-Control-Expose-Headers`   | 把额外响应头暴露给 JS 读取                  | 首部名列表 / `*`                                           | 带凭证不可用 `*`                           |
| `Access-Control-Max-Age`          | 预检结果缓存秒数                           | `<delta-seconds>`，省略默认 **5s**                          | 浏览器有上限（Chrome 7200 / FF 86400）     |

### Expose-Headers：默认只暴露 7 个安全首部

不配 `Expose-Headers` 时，跨域响应里 JS（`getResponseHeader()` / `response.headers.get()`）**只能读到** CORS 安全响应首部：`Cache-Control`、`Content-Language`、`Content-Length`、`Content-Type`、`Expires`、`Last-Modified`、`Pragma`。要读 `X-Total-Count`、`X-Request-Id` 这类自定义头，必须显式暴露：

```http
Access-Control-Expose-Headers: X-Total-Count, X-Request-Id
```

### Vary: Origin 为什么必须加

只要 `Access-Control-Allow-Origin` 回显的是**具体源**（动态值），就必须加 `Vary: Origin`。否则中间缓存（CDN / 浏览器缓存 / 代理）会把第一次请求（来自 A 源）拿到的 `Access-Control-Allow-Origin: https://a.example` 响应，原样缓存并**复用**给 B 源的请求——结果要么 B 源被错误放行，要么 B 源拿到只对 A 源有效的头而报错。`Vary: Origin` 告诉缓存：**按 `Origin` 请求头分桶存储**，互不串味。

```http
Access-Control-Allow-Origin: https://foo.example
Vary: Origin
# 若同时按编码协商，可合并：Vary: Accept-Encoding, Origin
```

## 小结

带凭证的跨域请求是「前端 `credentials:'include'` + 后端 `Access-Control-Allow-Credentials: true`」的**双向握手**；最致命的坑是——**带凭证时一切放行头都不能用 `*`**，`Allow-Origin` 必须按白名单回显具体源，并配 `Vary: Origin` 保证缓存正确。响应头六件套各司其职：Allow-Origin/Methods/Headers 负责放行、Allow-Credentials 开凭证、Expose-Headers 决定 JS 能读哪些响应头、Max-Age 缓存预检。

至于「为什么会触发预检、哪些算简单请求」见上一页 [CORS 简单请求与预检请求](./cors-simple-preflight)；当 CORS 行不通（如老接口不支持、第三方不可改）时的替代方案，见下一页 [JSONP 与反向代理方案](./jsonp-proxy)。
