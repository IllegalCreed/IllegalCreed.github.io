---
layout: doc
outline: [2, 3]
---

# HTTP 首部精要

> 基于 HTTP 标准（RFC 9110 语义）· 核于 2026-06

## 速查

- **字段语法**：`名: 值`，字段名后紧跟冒号，值前可有可选空格；行尾以 CRLF（`\r\n`）结束，空行分隔首部与消息体。
- **大小写不敏感**：字段名大小写不敏感（`Content-Type` ≡ `content-type`）；**字段值**通常大小写敏感（如 token、URL、文件名）。
- **HTTP/2 起规范小写**：HTTP/1.x 习惯首字母大写，HTTP/2 / HTTP/3 要求字段名一律小写，并引入伪首部（`:method`、`:status`、`:path`、`:authority`）。
- **多值与重复**：多个值用逗号 `, ` 分隔（`Accept: a, b`）；多数字段可重复出现，语义等价于逗号合并；**Set-Cookie 例外**，必须每条一行、不能合并。
- **四类心智模型**：通用首部（请求响应都可）/ 请求头（描述客户端与请求）/ 响应头（描述服务端与响应）/ **表示头**（描述消息体本身，`Content-*` 系列）。
- **必备请求头**：`Host`（HTTP/1.1 必需，虚拟主机定位）；`User-Agent` / `Referer` / `Origin` / `Authorization` / `Cookie` 为高频。
- **关键响应头**：`Location`（重定向 3xx / 201 新建资源）、`WWW-Authenticate`（配 401）、`Retry-After`（配 503 / 429）、`Allow`（配 405 列允许方法）。
- **表示头四件套**：`Content-Type`（MIME + charset）、`Content-Length`（字节数）、`Content-Encoding`（gzip / br 压缩）、`Content-Disposition`（inline 内联 / attachment 下载）。
- **MIME 结构**：`type/subtype`，可带参数，如 `application/json; charset=utf-8`；表单用 `application/x-www-form-urlencoded` 或 `multipart/form-data`。
- **X- 前缀**：RFC 6648（2012）已不建议新增 `X-` 前缀自定义首部，直接用语义化名称即可。
- **逐跳首部**：`Connection` / `Keep-Alive` / `Transfer-Encoding` / `TE` / `Trailer` / `Upgrade` / `Proxy-Authorization` 仅对单段连接有效，**代理不转发**；其余为端到端首部。

## 首部字段语法

HTTP 首部是消息起始行之后、消息体之前的一系列**键值对**，每行一个字段，整体格式如下（`↵` 表示 CRLF）：

```http
GET /index.html HTTP/1.1↵
Host: example.com↵
User-Agent: Mozilla/5.0↵
Accept: text/html↵
↵
（此处空行后为消息体，GET 通常无体）
```

语法规则要点：

- **`名: 值` 结构**：字段名后紧跟冒号 `:`，再跟可选空格（OWS），然后是字段值。
- **字段名大小写不敏感**：`Host`、`host`、`HOST` 等价。HTTP/1.x 约定俗成首字母大写（`Content-Type`），但解析时不区分。
- **字段值的大小写**：由具体字段决定。多数 token（如 `gzip`、`no-cache`）不敏感，但 URL、文件名、Cookie 值等通常**敏感**，应原样保留。
- **行尾 CRLF**：每行以 `\r\n` 结束；首部区与消息体之间以一个**空行**（即连续两个 CRLF）分隔。
- **多值合并**：同一字段的多个值用逗号 `, ` 分隔；大多数情况下，重复出现该字段与逗号合并等价。

::: warning Set-Cookie 不可合并
绝大多数首部可以「重复多次 ≡ 逗号合并一次」，但 `Set-Cookie` 是**显式例外**：每个 Cookie 必须独占一行，**不能**用逗号合并成一行（其值内部含有逗号、分号等分隔符，合并会产生歧义）。详见「Cookie 与会话管理」页。
:::

::: tip HTTP/2 起字段名规范为小写
HTTP/1.x 用纯文本传输首部；HTTP/2 / HTTP/3 改为二进制帧 + HPACK / QPACK 压缩，并**强制字段名为小写**（`content-type` 而非 `Content-Type`）。同时新增以冒号开头的**伪首部**承载起始行信息：请求侧 `:method`、`:scheme`、`:authority`、`:path`，响应侧 `:status`。浏览器开发者工具里看到的全小写首部即源于此。
:::

## 首部分类心智模型

理解首部最实用的角度是按「**它在描述什么**」分类，而不是死记字段名：

| 分类 | 描述对象 | 典型字段 |
| --- | --- | --- |
| 通用首部（General） | 请求与响应都适用，与消息体无关 | `Date`、`Connection`、`Cache-Control`、`Via` |
| 请求头（Request） | 客户端、请求的附加信息或约束 | `Host`、`User-Agent`、`Referer`、`Accept`、`Authorization` |
| 响应头（Response） | 服务端、响应的附加信息 | `Server`、`Location`、`Allow`、`WWW-Authenticate` |
| 表示头（Representation） | **消息体本身**的元数据（类型/长度/编码/语言） | `Content-Type`、`Content-Length`、`Content-Encoding`、`Content-Language` |

::: tip 为什么单独强调「表示头」
RFC 9110 用「表示（representation）」一词描述消息体的具体形态。`Content-*` 系列首部既可能出现在请求里（POST 一个 JSON 体），也可能出现在响应里（返回一张图片），它们描述的始终是**当前这段消息体**长什么样、怎么解读，与「请求头/响应头」的方向性正交。把它们独立成一类，能避免「Content-Type 到底算请求头还是响应头」的混乱。
:::

## 高频请求头

| 首部名 | 作用 | 示例值 |
| --- | --- | --- |
| `Host` | 指定目标服务器域名（+可选端口），支持虚拟主机；HTTP/1.1 **必需** | `example.com` / `example.com:8080` |
| `User-Agent` | 标识客户端类型、操作系统、浏览器/引擎版本 | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36` |
| `Referer` | 当前请求的来源页面 URL（注意历史拼写少一个 r） | `https://example.com/list` |
| `Origin` | 请求发起的源（协议+主机+端口），不含路径 | `https://app.example.com` |
| `Authorization` | 携带身份凭据 | `Bearer eyJhbGciOi...` / `Basic dXNlcjpwYXNz` |
| `Cookie` | 回传服务端先前通过 Set-Cookie 写入的 Cookie | `sid=abc123; theme=dark` |
| `Connection` | 控制本次事务后连接是否保持 | `keep-alive` / `close` |
| `Accept` 系列 | 声明可接受的媒体类型/语言/编码（内容协商） | `Accept: text/html`（详见内容协商页） |
| `If-*` 条件请求 | 条件化请求，配合缓存校验 | `If-None-Match`、`If-Modified-Since`（详见缓存页） |
| `Range` | 请求资源的某个字节区间 | `bytes=0-1023`（详见范围/缓存页） |

::: warning Host 与 Referer 的两个坑
1. **Host 必需**：HTTP/1.1 请求若缺少 `Host`，服务器应返回 `400 Bad Request`。一台服务器靠 `Host` 区分同 IP 上的多个站点（虚拟主机）。
2. **Referer 拼写**：该字段名在最初的 RFC 里就误拼为 `Referer`（少一个 `r`），后来将错就错沿用至今；而 JavaScript 里 `document.referrer` 是**正确拼写**，二者并存，别混淆。
:::

::: tip Origin vs Referer
`Origin` 只含「协议 + 主机 + 端口」，不暴露路径与查询串，隐私性优于 `Referer`，因此跨域请求与 `POST` 等场景常用它做来源判断。CORS 的 `Access-Control-*` 系列首部正是围绕 `Origin` 工作，但其细节属「跨域与同源策略」专题，本页不展开。
:::

## 高频响应头

| 首部名 | 作用 | 示例值 |
| --- | --- | --- |
| `Server` | 标识源服务器软件信息 | `nginx/1.25.3` |
| `Date` | 消息生成的日期时间（GMT） | `Wed, 25 Jun 2026 07:28:00 GMT` |
| `Location` | 重定向目标，或 `201 Created` 时新资源的 URL | `https://example.com/new` |
| `Set-Cookie` | 服务端向客户端写入 Cookie | `sid=abc123; Path=/; HttpOnly`（详见 Cookie 页） |
| `Retry-After` | 提示客户端多久后重试 | `120`（秒）/ `Fri, 31 Dec 2026 23:59:59 GMT` |
| `WWW-Authenticate` | 配合 `401`，声明所需认证方案 | `Basic realm="Login"` / `Bearer` |
| `Allow` | 配合 `405`，列出资源支持的方法 | `GET, POST, OPTIONS` |

::: tip Location 的双重身份
`Location` 不只用于重定向。在 `3xx`（如 `301`、`302`、`303`、`307`、`308`）里它指向重定向目标；在 `201 Created` 里它指向**新创建资源的地址**，方便客户端拿到刚建好的资源 URI。两种场景含义不同，但用的是同一个首部。
:::

::: warning Retry-After 的两种格式
`Retry-After` 既可以是**秒数**（`120` 表示 120 秒后重试），也可以是**HTTP 日期**（绝对时间点）。常见于 `503 Service Unavailable`（维护）与 `429 Too Many Requests`（限流），客户端做退避重试时应同时兼容两种格式。
:::

## 表示头（描述消息体）

表示头描述**当前消息体**的媒体类型、大小、压缩与语言，请求与响应都可能出现：

| 首部名 | 作用 | 示例值 |
| --- | --- | --- |
| `Content-Type` | 消息体的媒体类型（MIME），可带 `charset` / `boundary` 等参数 | `application/json; charset=utf-8` |
| `Content-Length` | 消息体大小（十进制字节数） | `1234` |
| `Content-Encoding` | 消息体使用的压缩算法 | `gzip` / `br` / `deflate` |
| `Content-Language` | 消息体面向的自然语言 | `zh-CN` / `en, fr` |
| `Content-Disposition` | 内联展示还是作为附件下载，可指定文件名 | `attachment; filename="report.pdf"` |

### MIME 类型与 Content-Type

MIME 类型采用 `type/subtype` 结构，可附带分号分隔的参数：

```http
Content-Type: text/html; charset=utf-8
Content-Type: application/json; charset=utf-8
Content-Type: image/png
```

常见参数：

- **`charset`**：文本类资源的字符编码，现代 Web 几乎统一用 `utf-8`。
- **`boundary`**：仅用于 `multipart/*`，作为各分段之间的分隔标记。

### 表单提交的两种 Content-Type

HTML 表单 `POST` 时，浏览器根据 `enctype` 决定消息体的 `Content-Type`：

| enctype | Content-Type | 适用场景 | 体格式 |
| --- | --- | --- | --- |
| 默认 | `application/x-www-form-urlencoded` | 纯文本字段 | `key1=val1&key2=val2`（URL 编码） |
| 文件上传 | `multipart/form-data; boundary=...` | 含文件或二进制 | 多段，用 boundary 分隔每个字段/文件 |

```http
POST /submit HTTP/1.1
Content-Type: application/x-www-form-urlencoded

name=alice&age=30
```

```http
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryABC123

------WebKitFormBoundaryABC123
Content-Disposition: form-data; name="file"; filename="a.png"
Content-Type: image/png

（二进制数据）
------WebKitFormBoundaryABC123--
```

::: tip Content-Disposition 触发下载
响应头 `Content-Disposition: attachment; filename="x.pdf"` 会让浏览器把响应当作**文件下载**而非内联展示，并以 `filename` 作为默认文件名；用 `inline` 则尽量内联渲染。它也复用在 `multipart/form-data` 的每个分段里，用 `form-data; name="..."` 标注字段名。文件名含非 ASCII 字符时，用 `filename*=UTF-8''...` 形式做百分号编码。
:::

::: warning Content-Length 与压缩的关系
`Content-Length` 描述的是**实际传输的字节数**，即 `Content-Encoding` 压缩**之后**的大小，而非原始资源大小。若采用 `Transfer-Encoding: chunked` 分块传输，则不使用 `Content-Length`（长度由分块结构隐式表达）。
:::

## 自定义首部与 X- 前缀

历史上自定义、非标准首部惯用 `X-` 前缀（如 `X-Requested-With`、`X-Forwarded-For`）以示「非官方」。但这带来一个问题：一旦该首部被标准化，就要在「带 X- 的旧名」与「去掉 X- 的新名」之间艰难取舍（典型如 `X-Forwarded-For` 与后来的标准 `Forwarded`）。

为此 **RFC 6648（2012）已不建议新增 `X-` 前缀**：新自定义首部应直接采用清晰、语义化的名称，避免预设「这辈子都不会标准化」。已广泛存在的 `X-` 首部出于兼容仍可继续使用。

## 端到端 vs 逐跳首部

当请求经过代理（proxy）时，首部分两类：

- **端到端首部（end-to-end）**：必须原样传递给最终接收方（请求的服务器 / 响应的客户端），代理可缓存、应转发。绝大多数首部属此类。
- **逐跳首部（hop-by-hop）**：仅对**单段传输连接**有意义，代理**不得转发、不得缓存**，需在每一跳重新协商。

逐跳首部固定为以下几个：`Connection`、`Keep-Alive`、`Transfer-Encoding`、`TE`、`Trailer`、`Upgrade`、`Proxy-Authorization`、`Proxy-Authenticate`。

::: tip 为什么 Connection 不能被转发
`Connection: keep-alive` / `close` 描述的是「客户端与某一跳之间」这条 TCP 连接的复用策略，对下一跳并无意义。代理收到后应据此处理本段连接，并**剥离**这些逐跳首部，再用自己的策略与下一跳建立连接。`Connection` 首部还会列出本次需一并剥离的其他逐跳字段名。
:::

## 小结

- 首部是 `名: 值` 键值对：**字段名大小写不敏感**，多值逗号分隔，行尾 CRLF；HTTP/2 起字段名规范为小写并引入伪首部。
- 按「描述什么」分四类：通用 / 请求头 / 响应头 / **表示头**；其中表示头（`Content-*`）描述消息体本身，与方向性正交。
- 请求头里 `Host` 是 HTTP/1.1 必需，`Origin` / `Referer` / `Authorization` / `Cookie` 高频；响应头里 `Location`、`WWW-Authenticate`、`Retry-After`、`Allow` 各自配套特定状态码。
- 表示头四件套 `Content-Type` / `Content-Length` / `Content-Encoding` / `Content-Disposition` 决定消息体如何被解读、压缩与处置；表单用 `application/x-www-form-urlencoded` 或 `multipart/form-data`。
- 自定义首部不再建议 `X-` 前缀（RFC 6648）；逐跳首部（`Connection` 等）不被代理转发。

内容协商相关的 `Accept` / `Accept-Language` / `Accept-Encoding` / `Vary` 与 q 值机制是首部的另一大主题，详见 [HTTP 内容协商](./content-negotiation)。
