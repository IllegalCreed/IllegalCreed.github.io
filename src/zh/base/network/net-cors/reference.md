---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- 同源 = 协议 + 域名 + 端口全等；SOP 拦读取不拦发送
- 跨域（origin）比跨站（site = 协议 + eTLD+1）更严格；同源⊆同站
- CORS = 服务器响应头授权浏览器放行跨源读取
- 简单请求：方法 GET/HEAD/POST + CORS 安全头 + Content-Type 三种值
- application/json → 触发预检 OPTIONS
- 凭证 `credentials:'include'` + `Allow-Credentials:true`；此时 `Allow-Origin` 不能用 `*`
- 回显具体源时必带 `Vary: Origin`（缓存正确性）
- CORS 报错 = 浏览器拦截，请求已达服务器
- JSONP 靠 `<script>`、只 GET、有安全风险、已被 CORS 取代
- 反向代理绕 SOP（浏览器只与同源代理通信）；Vite/webpack 开发 proxy、nginx 生产
- SameSite：Lax（默认）/ Strict / None(须 Secure)；缓解 CSRF
- COOP + COEP → crossOriginIsolated 解锁 SharedArrayBuffer

## 同源判定

| 对比 URL（基准 `https://a.com/p`） | 结果 | 原因 |
| --- | --- | --- |
| `https://a.com/other` | 同源 | 仅路径不同 |
| `http://a.com` | 跨源 | 协议不同 |
| `https://a.com:8443` | 跨源 | 端口不同 |
| `https://x.a.com` | 跨源（同站） | 子域不同 |
| `https://b.com` | 跨源（跨站） | 域名不同 |

> SOP 限制：跨源 DOM / AJAX 响应 / Cookie·storage 读取。不受限：`<img>`/`<script>`/`<link>`/`<video>`/表单提交/跳转。

## CORS 简单请求 vs 预检

| | 简单请求 | 预检请求 |
| --- | --- | --- |
| 触发条件 | 方法 GET/HEAD/POST + 仅 CORS 安全头 + Content-Type∈三种 | 其他（PUT/DELETE、自定义头、application/json 等） |
| 流程 | 直接发 + `Origin` | 先 OPTIONS 预检，通过再发真实请求 |
| 失败副作用 | 请求已达服务器（副作用可能已发生） | 预检失败则真实请求不发出 |

> Content-Type 简单三值：`application/x-www-form-urlencoded` / `multipart/form-data` / `text/plain`。

## Access-Control-\* 响应头全谱

| 响应头 | 作用 |
| --- | --- |
| `Access-Control-Allow-Origin` | 允许的源（带凭证时不能用 `*`，须回显具体源） |
| `Access-Control-Allow-Methods` | 预检：允许的方法 |
| `Access-Control-Allow-Headers` | 预检：允许的自定义请求头 |
| `Access-Control-Allow-Credentials` | `true` 允许带凭证（唯一合法值，否则省略） |
| `Access-Control-Expose-Headers` | 允许 JS 读取的额外响应头（默认仅 7 个安全头） |
| `Access-Control-Max-Age` | 预检结果缓存秒数（浏览器有上限：Chrome 7200 / Firefox 86400） |
| `Vary: Origin` | 回显具体源时必带，防缓存跨源污染 |

## 跨域方案对比

| 方案 | 原理 | 限制 | 现状 |
| --- | --- | --- | --- |
| CORS | 服务器响应头授权 | 需服务端配合 | 标准方案 |
| JSONP | `<script>` 跨域 + callback | 只 GET、有安全风险 | 已淘汰 |
| 反向代理 | 浏览器只与同源代理通信 | 需部署代理 | 常用（开发 Vite proxy / 生产 nginx） |

## SameSite 与跨源隔离

| 项 | 要点 |
| --- | --- |
| `SameSite=Lax`（默认） | 仅顶级导航 + 安全方法(GET/HEAD)放行跨站 Cookie |
| `SameSite=Strict` | 完全禁止跨站携带 Cookie |
| `SameSite=None` | 允许跨站，**必须配 `Secure`** |
| CORP | `Cross-Origin-Resource-Policy`：声明谁能跨源引用本资源 |
| COOP | `Cross-Origin-Opener-Policy`：隔离 `window.opener` |
| COEP | `Cross-Origin-Embedder-Policy: require-corp` |
| crossOriginIsolated | COOP `same-origin` + COEP `require-corp` → 解锁 SharedArrayBuffer、高精度计时器 |

## 权威链接

- [MDN: 同源策略](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy) · [CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS) · [CORS 错误](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors)
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie/SameSite) · [Cross-Origin-Resource-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Resource-Policy)
- [Fetch 标准: CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol) · [web.dev: COOP/COEP](https://web.dev/articles/coop-coep)

## 相关页

- [入门](./getting-started) · [同源策略与「源」的定义](./guide-line/same-origin-policy) · [跨域常见场景与报错排查](./guide-line/cross-origin-scenarios)
- [CORS 简单请求与预检请求](./guide-line/cors-simple-preflight) · [CORS 凭证与 Access-Control 首部全谱](./guide-line/cors-credentials-headers)
- [JSONP 与反向代理方案](./guide-line/jsonp-proxy) · [Cookie SameSite 与 COOP/COEP/CORP](./guide-line/samesite-coop-coep)
