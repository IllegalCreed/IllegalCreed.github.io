---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTTP 标准（RFC 9110 语义 / RFC 9111 缓存）· 核于 2026-06

## 速查

- 报文四段：请求行 / 状态行 → 首部 → 空行（CRLF）→ 体
- 方法语义：`GET` 读、`POST` 写、`PUT` 替换、`PATCH` 局改、`DELETE` 删、`HEAD` 仅头、`OPTIONS` 探询
- 安全 ⊆ 幂等；安全 = `GET`/`HEAD`/`OPTIONS`/`TRACE`，幂等再加 `PUT`/`DELETE`，`POST` 都不是
- 状态码：1xx 信息 / 2xx 成功 / 3xx 重定向 / 4xx 客户端错 / 5xx 服务端错
- 永久重定向 `301`/`308`、临时 `302`/`307`/`303`；`308`/`307` 严格保留方法与体
- `401` = 未认证（带 `WWW-Authenticate`）、`403` = 已认证但无权
- 首部名大小写不敏感、多值逗号分隔；HTTP/2 起规范为小写 + 伪首部
- 内容协商：`Accept`/`Accept-Language`/`Accept-Encoding` + `q` 值；响应配 `Vary`
- Cookie 安全三件套：`HttpOnly`（防 JS 读）+ `Secure`（仅 HTTPS）+ `SameSite`（防 CSRF）
- 缓存：强缓存 `Cache-Control`/`Expires` 不发请求；协商缓存 `ETag`/`Last-Modified` → `304`
- `no-cache`（可存但每次须协商）≠ `no-store`（完全不存）
- 范围请求：`Accept-Ranges: bytes` + `Range` → `206` + `Content-Range`

## 请求方法速查

| 方法 | 语义 | 安全 | 幂等 | 可缓存 | 请求体 |
| --- | --- | --- | --- | --- | --- |
| `GET` | 获取资源 | ✅ | ✅ | ✅ | 无 |
| `HEAD` | 同 GET 但只要响应头 | ✅ | ✅ | ✅ | 无 |
| `POST` | 提交 / 创建（服务器定 URI） | ❌ | ❌ | 有条件 | 有 |
| `PUT` | 整体替换指定 URI 资源 | ❌ | ✅ | ❌ | 有 |
| `PATCH` | 局部更新资源 | ❌ | ❌（不保证） | 有条件 | 有 |
| `DELETE` | 删除资源 | ❌ | ✅ | ❌ | 可选 |
| `OPTIONS` | 探询资源支持的能力 | ✅ | ✅ | ❌ | 可选 |
| `TRACE` | 回显请求（诊断） | ✅ | ✅ | ❌ | 无 |
| `CONNECT` | 建立隧道（代理 / HTTPS） | ❌ | ❌ | ❌ | 无 |

> POST/PATCH「可缓存」需响应显式带新鲜度信息且匹配 `Content-Location`，实际极少缓存。

## 状态码速查

| 类 | 高频码 | 含义 |
| --- | --- | --- |
| 1xx | `100` Continue · `101` Switching Protocols · `103` Early Hints | 信息性、临时响应 |
| 2xx | `200` OK · `201` Created · `204` No Content · `206` Partial Content | 成功 |
| 3xx | `301` Moved Permanently · `302` Found · `303` See Other · `304` Not Modified · `307`/`308` | 重定向 |
| 4xx | `400` · `401` · `403` · `404` · `405` · `409` · `410` · `422` · `429` Too Many Requests | 客户端错误 |
| 5xx | `500` · `501` · `502` Bad Gateway · `503` Service Unavailable · `504` Gateway Timeout | 服务端错误 |

## 易混状态码辨析

| 对比 | 区别 |
| --- | --- |
| `301` vs `308` | 都永久；`308` 严格保留方法与体，`301` 历史上常被客户端改写为 GET |
| `302` vs `307` | 都临时；`307` 严格保留方法与体，`302` 可能被改写为 GET |
| `302` vs `303` | `303` 强制转 GET，专用于 POST 提交后重定向（PRG 模式）|
| `401` vs `403` | `401` 未认证（应带 `WWW-Authenticate`）；`403` 已认证但无权限 |
| `502` vs `503` vs `504` | 上游返回无效响应 / 服务主动不可用（带 `Retry-After`）/ 等上游超时 |
| `no-cache` vs `no-store` | 前者可缓存但每次须向源校验；后者完全不缓存 |

## 高频首部速查

| 分类 | 首部 | 作用 |
| --- | --- | --- |
| 请求 | `Host` | 目标主机（HTTP/1.1 必填） |
| 请求 | `Authorization` | 携带认证凭据 |
| 请求 | `Accept` / `Accept-Language` / `Accept-Encoding` | 内容协商偏好 |
| 请求 | `Cookie` | 回传 Cookie |
| 请求 | `Range` | 请求资源的某个字节范围 |
| 请求 | `If-None-Match` / `If-Modified-Since` | 协商缓存条件 |
| 响应 | `Location` | 重定向目标 / 201 新资源地址 |
| 响应 | `Set-Cookie` | 下发 Cookie |
| 响应 | `Cache-Control` / `ETag` / `Last-Modified` | 缓存控制与校验 |
| 响应 | `Vary` | 声明响应随哪些请求头变化 |
| 响应 | `Retry-After` | 配合 429/503，提示重试时机 |
| 表示 | `Content-Type` | 体的媒体类型（含 charset） |
| 表示 | `Content-Length` | 体的字节长度 |
| 表示 | `Content-Encoding` | 体的压缩方式（gzip/br/zstd） |

## Cache-Control 指令速查

| 指令 | 含义 |
| --- | --- |
| `max-age=N` | 资源在 N 秒内新鲜（强缓存） |
| `s-maxage=N` | 仅对共享缓存（CDN/代理）生效，优先于 max-age |
| `no-cache` | 可缓存，但每次使用前必须向源校验 |
| `no-store` | 完全不缓存（敏感数据） |
| `private` | 只允许浏览器等私有缓存存，CDN 不存 |
| `public` | 允许任何缓存存 |
| `must-revalidate` | 过期后必须校验，不得用陈旧副本 |
| `immutable` | 有效期内内容绝不改变，刷新也不发校验请求 |

## Cookie 关键属性速查

| 属性 | 作用 |
| --- | --- |
| `Domain` / `Path` | 作用域（哪些域名 / 路径会带上） |
| `Expires` / `Max-Age` | 过期时间（`Max-Age` 优先）；都不设 = 会话 Cookie |
| `Secure` | 仅通过 HTTPS 发送 |
| `HttpOnly` | JS 不可读（`document.cookie` 取不到），防 XSS 窃取 |
| `SameSite` | `Strict` / `Lax`（默认）/ `None`（须配 `Secure`），防 CSRF |
| `__Host-` 前缀 | 强制 `Secure` + 无 `Domain` + `Path=/`，最严作用域 |

## 权威链接

**标准 / 规范**

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)（方法、状态码、首部语义总纲）
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111)
- [RFC 6265bis: Cookies](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis)

**指南 / 参考**

- [MDN: HTTP（中文）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP)
- [MDN: HTTP Messages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages) · [Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods) · [Status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) · [Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers)
- [MDN: HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) · [Content negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Content_negotiation) · [Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)

**兼容性 / 调试**

- 浏览器 DevTools → Network 面板（看真实请求 / 响应首部、状态码、缓存命中）
- `curl -v` / `curl -I`（命令行查看完整报文 / 仅响应头）

## 相关页

- [入门](./getting-started) · [HTTP 报文结构与请求方法](./guide-line/http-messages-methods) · [HTTP 状态码全谱](./guide-line/status-codes)
- [HTTP 首部精要](./guide-line/http-headers) · [HTTP 内容协商](./guide-line/content-negotiation)
- [Cookie 与会话管理](./guide-line/cookies-sessions) · [持久连接、范围请求与缓存首部](./guide-line/connection-range-caching)
