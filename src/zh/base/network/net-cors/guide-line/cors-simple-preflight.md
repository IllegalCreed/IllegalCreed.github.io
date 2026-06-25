---
layout: doc
outline: [2, 3]
---

# CORS 简单请求与预检请求

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **CORS**（Cross-Origin Resource Sharing，跨源资源共享）是一套基于 HTTP 头的机制：浏览器照常发跨源请求，由**服务器用响应头授权**，浏览器据此决定是否把响应交给页面脚本。
- 授权的核心响应头是 `Access-Control-Allow-Origin`，取值为**具体源**或通配 `*`；不匹配则浏览器拦截、控制台报 CORS 错误。
- CORS 把请求分两类：**简单请求**（直接发）与**需预检请求**（先发 OPTIONS 探路）。
- **简单请求三条件**（须同时满足）：① 方法只能是 `GET` / `HEAD` / `POST`；② 仅含 CORS 安全头（`Accept`、`Accept-Language`、`Content-Language`、`Content-Type`、`Range`）；③ `Content-Type` 只能是 `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain` 三者之一。
- 简单请求流程：浏览器自动带 `Origin` 头直接发 → 服务器回 `Access-Control-Allow-Origin` → 匹配则放行响应。
- **预检（preflight）触发**：只要不满足简单请求条件（如 `PUT`/`DELETE`/`PATCH`、自定义头如 `Authorization` 之外的 `X-*`、`Content-Type: application/json`）就会先发预检。
- 预检请求用 **`OPTIONS`** 方法，带 `Access-Control-Request-Method`（真实方法）和 `Access-Control-Request-Headers`（真实自定义头清单）。
- 服务器预检响应回 `Access-Control-Allow-Methods` / `Access-Control-Allow-Headers`，覆盖真实请求的方法与头才算通过，浏览器才发真实请求。
- **`Access-Control-Max-Age: <秒>`** 缓存预检结果，期内同类请求不再预检；浏览器对该值有上限（如 Chromium 封顶 7200 秒）。
- 简单请求**不能**靠 `OPTIONS` 探到错误——它直接发出，副作用（如写库）可能已经发生；预检则在真实请求前先拦下。
- 凭证（Cookie）与完整 `Access-Control-*` 头清单见下一页，本页只讲简单/预检的判定与流程。

## CORS 是什么

**CORS（跨源资源共享）** 是浏览器与服务器之间的一套协商协议。同源策略默认禁止页面脚本读取跨源响应，而 CORS 提供了一条「开口子」的标准通道：**浏览器照常发出跨源请求并带上 `Origin` 头，服务器在响应里用一组 `Access-Control-*` 头声明「我允许哪个源访问」，浏览器再根据这些头决定是否把响应数据交给发起请求的脚本**。

关键点要立住：

- **授权方是服务器，执行方是浏览器**。服务器不返回正确的 CORS 头，浏览器就拦下响应；但请求本身（对简单请求而言）往往已经送达服务器。
- CORS 拦的是**脚本读取响应**这一步，不是「不让请求发出去」。理解这点才能解释「为什么接口明明返回了 200，前端却拿不到数据」。
- 最核心的授权头是 `Access-Control-Allow-Origin`：

```http
Access-Control-Allow-Origin: https://foo.example   # 只允许该源
Access-Control-Allow-Origin: *                      # 允许任意源（不可与凭证同用）
```

::: tip CORS 是「放行白名单」，不是「安全防线」
CORS 保护的是**用户**（防止恶意站点拿用户身份偷读别站数据），不是保护**服务器**。绕过浏览器的客户端（curl、服务端请求）根本不受 CORS 约束。别把 CORS 当成接口鉴权。
:::

## 简单请求（Simple Request）

### 判定条件

按 Fetch 标准，一个跨源请求要被当作**简单请求**（不触发预检），必须**同时**满足以下全部条件：

- **方法**属于 CORS 安全方法：`GET`、`HEAD`、`POST` 三者之一。
- **请求头**只包含「CORS 安全头（CORS-safelisted request-header）」，即：
  - `Accept`
  - `Accept-Language`
  - `Content-Language`
  - `Content-Type`（且取值受下一条限制）
  - `Range`（仅限简单范围值，如 `bytes=0-100`）
- **`Content-Type`** 的值只能是以下三者之一：
  - `application/x-www-form-urlencoded`
  - `multipart/form-data`
  - `text/plain`
- 此外（多由 `fetch`/`XMLHttpRequest` 自动满足）：未对 `XMLHttpRequest.upload` 注册事件监听器；请求体不是 `ReadableStream`；安全头的值不违反额外约束（如单个头值字节长度不超过 128）。

::: warning 最常踩的坑：`Content-Type: application/json`
前端发 JSON 是日常操作，但 `application/json` **不在**三种允许值里——所以「`POST` 一个 JSON 请求体」会触发预检，而不是简单请求。很多人误以为「POST 就是简单请求」，实际是被 `Content-Type` 卡住的。
:::

### 简单请求流程与报文

简单请求**不预检**，浏览器直接发出真实请求，仅自动附加 `Origin` 头：

```http
GET /resources/public-data/ HTTP/1.1
Host: bar.other
Accept: text/html,application/xhtml+xml
Accept-Language: en-us,en;q=0.5
Origin: https://foo.example
```

服务器在响应里通过 `Access-Control-Allow-Origin` 授权：

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://foo.example
Vary: Origin
Content-Type: application/xml

[响应体]
```

浏览器拿到响应后比对 `Origin` 与 `Access-Control-Allow-Origin`：匹配（或服务器回 `*`）则把响应交给脚本；不匹配则**拦截响应、报 CORS 错误**，但此时请求早已抵达服务器、副作用可能已发生。

::: tip 回显具体源时记得加 `Vary: Origin`
若服务器按请求 `Origin` 动态回显具体源（而非固定 `*`），响应必须带 `Vary: Origin`，否则 CDN/缓存可能把「为 A 源生成的响应」错发给 B 源，导致跨源缓存污染。
:::

## 预检请求（Preflight）

### 何时触发

只要请求**不满足**上面任意一条简单请求条件，浏览器就会在真实请求**之前**先自动发一个**预检请求**探路。常见触发场景：

- 使用 `GET`/`HEAD`/`POST` 之外的方法：`PUT`、`DELETE`、`PATCH` 等。
- 携带任何非安全头的自定义头：如 `Authorization`、`X-Requested-With`、`X-Token` 等。
- `Content-Type` 取了三种允许值之外的类型，最典型的就是 `application/json`。

### 预检报文：OPTIONS + Access-Control-Request-\*

预检请求固定用 **`OPTIONS`** 方法，并通过两个专用请求头「预告」真实请求的形态：

- `Access-Control-Request-Method`：真实请求将使用的方法。
- `Access-Control-Request-Headers`：真实请求将携带的自定义头清单（逗号分隔）。

```http
OPTIONS /doc HTTP/1.1
Host: bar.other
Origin: https://foo.example
Access-Control-Request-Method: POST
Access-Control-Request-Headers: X-PINGOTHER, Content-Type
```

### 服务器预检响应：Allow-Methods / Allow-Headers

服务器用一组响应头回答「这些方法/头我允许吗」。**只有当真实请求的方法被 `Access-Control-Allow-Methods` 覆盖、所有自定义头被 `Access-Control-Allow-Headers` 覆盖时，预检才通过**：

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://foo.example
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: X-PINGOTHER, Content-Type
Access-Control-Max-Age: 86400
Vary: Origin
```

预检通过后，浏览器才发出**真实请求**（此时报文与普通跨源请求无异，仍带 `Origin`）：

```http
POST /doc HTTP/1.1
Host: bar.other
Origin: https://foo.example
Content-Type: text/xml; charset=UTF-8
X-PINGOTHER: pingpong

<person><name>Arun</name></person>
```

::: warning 预检失败 ≠ 真实请求被拒
若预检不通过（缺 `Allow-Methods`/`Allow-Headers`、或 `Allow-Origin` 不匹配），浏览器**不会**发真实请求，控制台报 CORS 错误。此时后端日志里只看得到一条 `OPTIONS`，看不到真实的 `POST`——排查时别只盯着业务接口，要先看 OPTIONS 的响应头是否齐全。
:::

### 预检缓存：Access-Control-Max-Age

每个非简单请求前都预检一次代价很高。`Access-Control-Max-Age` 让浏览器把预检结果缓存指定秒数，期内对**同一 URL、同一方法与头组合**的请求不再重复预检：

```http
Access-Control-Max-Age: 86400   # 缓存 24 小时
```

注意：浏览器对该值设有**上限**，超出会被截断（如 Chromium 系封顶 7200 秒 / 2 小时，Firefox 为 86400 秒）。设得再大也以浏览器上限为准。

## 简单请求 vs 预检请求

| 维度 | 简单请求 | 需预检请求 |
| --- | --- | --- |
| 触发条件 | 方法 ∈ GET/HEAD/POST + 仅安全头 + Content-Type 限三种 | 不满足简单请求任一条件 |
| 是否先发 OPTIONS | 否，直接发真实请求 | 是，先 OPTIONS 探路 |
| 请求专用头 | 仅 `Origin` | `Origin` + `Access-Control-Request-Method` + `Access-Control-Request-Headers` |
| 服务器关键响应头 | `Access-Control-Allow-Origin` | 预检：`Allow-Origin`/`Allow-Methods`/`Allow-Headers`/`Max-Age` |
| 失败时副作用 | 请求已送达，副作用可能已发生 | 真实请求不发出，无业务副作用 |
| 网络往返 | 1 次 | 预检 1 次 + 真实请求 1 次（缓存期内退回 1 次） |
| 典型例子 | `GET` 列表、表单 `application/x-www-form-urlencoded` 提交 | `PUT`/`DELETE`、带 `Authorization`、`POST` JSON |

## 小结

CORS 的本质是「浏览器发请求、服务器用 `Access-Control-*` 响应头授权、浏览器据此放行响应」。它把跨源请求分成两路：**简单请求**（方法限 GET/HEAD/POST、仅含安全头、`Content-Type` 限三种）直接发出、靠 `Access-Control-Allow-Origin` 放行；**需预检请求**（如 `PUT`/`DELETE`、自定义头、`application/json`）先发 `OPTIONS` 预检，由 `Access-Control-Request-Method`/`Headers` 预告、服务器用 `Access-Control-Allow-Methods`/`Headers` 应答，再用 `Access-Control-Max-Age` 缓存预检结果。记住一条排查铁律：**简单请求失败时请求已送达，预检失败时真实请求根本没发**。

理解了「哪些请求会预检」，回看上一页 [跨域常见场景与报错排查](./cross-origin-scenarios) 中的报错就有了抓手；而 `Access-Control-Allow-Origin` 之外的完整响应头清单、以及携带 Cookie 的凭证模式（为何不能用 `*`），将在下一页 [CORS 凭证与 Access-Control 首部全谱](./cors-credentials-headers) 系统展开。
