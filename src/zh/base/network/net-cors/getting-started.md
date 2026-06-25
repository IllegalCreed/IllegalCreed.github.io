---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **同源** = 协议 + 域名 + 端口三者全等；路径/查询/hash 不参与判定（`http`↔`https`、不同子域、不同端口都算**跨源**）
- **SOP 拦读取不拦发送**：跨源请求常照常送达服务器，浏览器只拦住脚本读取响应——故 SOP 防不住 CSRF
- SOP 限制三类：跨源 DOM 访问、读跨源 AJAX/fetch 响应、读跨源 Cookie/storage；`<img>`/`<script>`/`<link>`/表单等跨源**嵌入**不受限（但「能加载 ≠ 能读」）
- **CORS** = 服务器用 `Access-Control-*` 响应头授权浏览器放行跨源读取；保护用户、不是接口鉴权
- **简单请求**（方法 GET/HEAD/POST + CORS 安全头 + Content-Type 限三种）直接发；否则先发 **OPTIONS 预检**
- 坑：`Content-Type: application/json` 不在简单请求三种值内，会**触发预检**
- **CORS 报错是浏览器拦截**：请求已达服务器、响应已回，只是浏览器不给 JS 读（Postman/curl 不受影响）
- **凭证 + 通配符冲突**：带 Cookie 跨域（`credentials:'include'`）时 `Access-Control-Allow-Origin` **不能用 `*`**，必须回显具体源
- **JSONP** 靠 `<script>` 跨域、只 GET、有安全风险，已被 CORS 取代
- **反向代理**绕开 SOP（SOP 是浏览器限制，服务器间通信不受约束）：开发用 Vite/webpack proxy，生产用 nginx
- **Cookie SameSite**：`Lax`（现代浏览器默认）/ `Strict` / `None`（须配 `Secure`）；缓解 CSRF
- **跨源隔离**：COOP `same-origin` + COEP `require-corp` → `crossOriginIsolated`，解锁 SharedArrayBuffer

## 同源策略到底限制什么

「同源」要求两个 URL 的**协议、域名、端口**三者完全一致：

| URL | 与 `https://a.com/p1` 是否同源 | 原因 |
| --- | --- | --- |
| `https://a.com/p2` | ✅ 同源 | 仅路径不同 |
| `http://a.com` | ❌ 跨源 | 协议不同 |
| `https://b.com` | ❌ 跨源 | 域名不同 |
| `https://a.com:8080` | ❌ 跨源 | 端口不同 |
| `https://sub.a.com` | ❌ 跨源 | 子域不同 |

SOP 限制的是**读取**：跨源的 DOM、AJAX 响应、Cookie/localStorage 都读不到。但**发送**和**嵌入**不受限——这就是为什么跨源图片能显示、跨源脚本能执行、表单能跨源提交，但 JS 读不到它们的内容。

::: warning CORS 报错的真相
看到「blocked by CORS policy」时，请求**其实已经发到服务器、服务器也返回了响应**——只是浏览器因为缺少授权响应头，拦住了 JS 读取。所以用 Postman/curl 测同一接口往往「正常」（它们不执行 SOP），修复几乎总在**后端补响应头**或**走代理变同源**。
:::

## CORS 如何放行跨域

浏览器跨源请求会自动带上 `Origin` 头，服务器用响应头表态：

```http
GET /api/data HTTP/1.1
Origin: https://app.example.com

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
```

只要响应里的 `Access-Control-Allow-Origin` 匹配请求的源，浏览器就放行 JS 读取。非简单请求（如带 JSON 体、自定义头）会先发一个 OPTIONS **预检**询问服务器是否允许，通过后才发真实请求。

下面各页逐一展开：先看 [同源策略与「源」的定义](./guide-line/same-origin-policy)。
