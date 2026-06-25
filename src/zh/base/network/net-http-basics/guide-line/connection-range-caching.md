---
layout: doc
outline: [2, 3]
---

# 持久连接、范围请求与缓存首部

> 基于 HTTP 标准（RFC 9110 语义 / RFC 9111 缓存）· 核于 2026-06

## 速查

- **短连接 → 持久连接**：HTTP/1.0 默认一次请求一条 TCP（用完即关）；HTTP/1.1 默认 **keep-alive**，复用同一 TCP，省去反复三次握手与慢启动。
- **`Connection: keep-alive` / `Connection: close`**：逐跳（hop-by-hop）首部，控制本段连接用完是否关闭；HTTP/1.1 持久是默认，`close` 才退回短连接。
- **`Keep-Alive: timeout=5, max=100`**：服务端建议的最小保活时长与该连接最多承载的请求数（仅参考，逐跳）。
- **HTTP/1.1 并发瓶颈**：单连接内请求串行、浏览器每源 ~6 条并发、**应用层队头阻塞**（前一个响应不回来后面排队）；管线化 pipelining 已废弃。
- **`Accept-Ranges: bytes`**：服务端声明支持按字节范围请求（响应头）；缺省或 `none` 表示不支持。
- **`Range: bytes=0-1023` → `206 Partial Content`**：请求部分内容，响应带 **`Content-Range: bytes 0-1023/146515`**（`起-止/总长`），`Content-Length` 是这一段的大小。
- **`If-Range`** + ETag/时间：资源没变才返回 `206` 续传，变了则返回 `200` 整份重传；范围不满足返回 **`416 Range Not Satisfiable`**。
- **强缓存 `Cache-Control`**：`max-age=<秒>`（新鲜期）、`no-cache`（可存但每次须协商）、`no-store`（完全不存）、`private`/`public`、`must-revalidate`、`immutable`、`s-maxage`（仅共享缓存）。
- **`Expires`（旧）/ `Age`**：`Expires` 是绝对过期时刻，优先级**低于** `Cache-Control: max-age`；`Age` 是响应在缓存中已停留的秒数。
- **协商缓存**：`ETag` + `If-None-Match`、`Last-Modified` + `If-Modified-Since`，命中返回 **`304 Not Modified`**（无响应体，仅刷新新鲜期）。
- **ETag 强/弱验证器**：`"abc"` 为强（逐字节一致）；`W/"abc"` 为弱（语义等价即可，适配压缩/范围场景）。
- **高频混淆**：`no-cache` ≠ 不缓存——它**存**但每次都要去服务端验证；真正「一点都别存」是 `no-store`。

## A. 持久连接

### 从短连接到 keep-alive

HTTP 最初的模型（也是 HTTP/1.0 的默认）是**短连接**：每个 HTTP 请求各自完成于一条独立的 TCP 连接上，每次请求前都要走一遍 TCP 三次握手，且这些握手是串行的。问题在于，TCP 连接需要「热身」——它会随着持续使用而逐渐变得高效（拥塞窗口增大），而短连接每次都在一条全新的「冷」连接上传输，永远享受不到这个加速，性能偏离最优。

HTTP/1.1 把**持久连接（persistent connection / keep-alive）**设为默认：一条连接打开后保持一段时间，可被多个请求复用，省去重复握手，并充分利用 TCP 的性能增强能力。

```http
GET /page HTTP/1.1
Host: example.com
Connection: keep-alive
```

```http
HTTP/1.1 200 OK
Connection: keep-alive
Keep-Alive: timeout=5, max=100
Content-Type: text/html
Content-Length: 1270

<!doctype html>…
```

- **`Connection`**：HTTP/1.1 中持久是默认，该头不再必需，但常被显式带上作为「防御性写法」（以防需要回退到 HTTP/1.0）。要退回短连接，发送 `Connection: close`，本次响应传完即关闭。
- **`Keep-Alive: timeout=5, max=100`**：服务端建议——连接至少保活 5 秒、最多承载 100 个请求。这只是建议值，连接不会永远开着，空闲超时后仍会被关闭。

::: tip 逐跳首部，不跨代理
`Connection` 与 `Keep-Alive` 是**逐跳（hop-by-hop）**首部，只约束相邻两个节点之间的这一段连接。客户端 ↔ 代理的连接模型，可以和代理 ↔ 源站的连接模型不同；中间节点可以改写这些头。它们不是端到端语义。
:::

### HTTP/1.1 的并发瓶颈

持久连接省了握手，但并发能力仍有天花板：

- **单连接内请求串行**：一条 HTTP/1.1 连接上，请求是序列化的——必须等上一个响应完整收完，才能发下一个请求。
- **每源约 6 条并发**：为了并行，浏览器对同一个源（origin）会开多条连接同时发请求。早期默认 2~3 条，如今普遍是 **6 条**。
- **应用层队头阻塞（Head-of-Line Blocking）**：在一条连接上，即便后面的响应早已就绪，只要前一个响应迟迟不回，后面的都得排队等着。这是 HTTP/1.1 在协议层面无法消除的硬伤。

历史上为了绕开每源连接数限制，出现过**域名分片（domain sharding）**：把资源拆到 `www1/www2/www3.example.com` 等多个子域（指向同一台服务器），让浏览器对每个子域各开 6 条。这是一种已不推荐的技巧。

::: warning 管线化（pipelining）已废弃
HTTP/1.1 曾设计**管线化**：在同一条持久连接上连续发多个请求而不等响应返回，试图掩盖往返延迟。但它在现代浏览器中默认关闭并最终被弃用，原因有三：① 有缺陷的代理普遍存在，会导致难以预料和排查的怪异行为；② 正确实现极其复杂，且只在受限场景（仅幂等方法 GET/HEAD/OPTIONS/PUT/DELETE 等可安全重放）下才有边际收益；③ 它本身仍受**队头阻塞**困扰。最终，管线化被一种更好的算法——**多路复用（multiplexing）**——取代，后者由 HTTP/2 采用。
:::

> **边界**：HTTP/2 用单连接多路复用、HTTP/3 用 QUIC 进一步消除队头阻塞，如何彻底解决这些瓶颈属于「HTTP 演进与性能」一节，本页不展开。

## B. 范围请求

### 声明支持与发起请求

范围请求让客户端只取资源的一部分，是**断点续传、视频拖拽（随机播放定位）、分块下载**的底层机制。

服务端通过 **`Accept-Ranges: bytes`** 声明支持按字节范围请求（用 `HEAD` 请求即可探测，无需下载整份）：

```http
HEAD /z4d4kWk.jpg HTTP/1.1
Host: example.com
```

```http
HTTP/1.1 200 OK
Accept-Ranges: bytes
Content-Length: 146515
```

若响应没有该头，或值为 `Accept-Ranges: none`，则表示不支持范围请求。

客户端用 **`Range`** 头指定要哪一段字节（位置从 0 开始计数）：

```http
GET /z4d4kWk.jpg HTTP/1.1
Host: example.com
Range: bytes=0-1023
```

服务端返回 **`206 Partial Content`**，并带上 **`Content-Range`** 标明这段在整份资源中的位置：

```http
HTTP/1.1 206 Partial Content
Content-Type: image/jpeg
Content-Range: bytes 0-1023/146515
Content-Length: 1024

(二进制内容，仅这 1024 字节)
```

::: tip 三个数字别看混
`Content-Range: bytes 0-1023/146515` 的格式是 `bytes 起-止/总长`：本段从第 0 字节到第 1023 字节，整份资源共 146515 字节。而 `Content-Length: 1024` 是**本次返回这一段**的大小（1024 字节），**不是**整份资源的大小。
:::

### 条件续传、多段范围与不满足

**`If-Range`**：断点续传时，客户端担心「我上次下到一半，服务器上的文件已经变了」。带上 `If-Range`（值为上次拿到的 `ETag` 或 `Last-Modified` 时间，**二选一，不能同时用**），让服务端判断：

```http
GET /big.zip HTTP/1.1
Host: example.com
Range: bytes=1048576-
If-Range: "33a64df5"
```

- 资源**没变**（ETag/时间仍匹配）→ 返回 `206`，给出请求的那一段，续传成功。
- 资源**已变** → 返回 `200`，给出**整份**新资源（避免把新旧字节拼接成损坏文件）。

**多段范围（multipart/byteranges）**：一次请求多个不连续区间，响应用 `multipart/byteranges` 封装，每段各带自己的 `Content-Range`，以 `boundary` 分隔：

```http
GET /index.html HTTP/1.1
Host: example.com
Range: bytes=0-50, 100-150
```

```http
HTTP/1.1 206 Partial Content
Content-Type: multipart/byteranges; boundary=3d6b6a416f9b5
Content-Length: 282

--3d6b6a416f9b5
Content-Type: text/html
Content-Range: bytes 0-50/1270

<!doctype html>…
--3d6b6a416f9b5
Content-Type: text/html
Content-Range: bytes 100-150/1270

…(第二段)
--3d6b6a416f9b5--
```

::: warning 范围不满足 → 416
当请求的字节范围**完全落在资源范围之外**（如对一个 1000 字节的文件请求 `bytes=200000-300000`），服务端返回 **`416 Range Not Satisfiable`**。此外，若服务端根本不支持范围请求，它会忽略 `Range` 头、返回 `200 OK` 加完整正文。
:::

## C. 缓存首部语义

::: tip 本节只讲「头本身的语义」
下面只解释这些 HTTP 首部各自表达什么意思。浏览器拿到这些头后**具体怎么决策、缓存放在内存还是磁盘、如何清除**，属于「浏览器缓存机制」一节，本页不涉及。
:::

缓存分两类：**强缓存**（在新鲜期内直接用本地副本，不发请求）和**协商缓存**（带条件去服务端问一句「变了没」，没变则 `304` 复用）。

### 强缓存：Cache-Control / Expires / Age

**`Cache-Control`** 是 HTTP/1.1 起的核心缓存控制头，承载一组指令：

| 指令 | 含义 |
| --- | --- |
| `max-age=<秒>` | 新鲜期：响应在缓存中年龄小于该值即为新鲜，可直接复用；超过则变「陈旧（stale）」。 |
| `s-maxage=<秒>` | 同 `max-age`，但**仅对共享缓存**（代理 / CDN）生效，并在共享缓存中覆盖 `max-age`。 |
| `no-cache` | **可以存**，但复用前**必须**先向服务端协商（发条件请求），命中则 `304`、变了则 `200`。 |
| `no-store` | **任何缓存都不许存**这份响应（最严格）。 |
| `private` | 只允许存进**私有缓存**（通常是浏览器），不进共享缓存——用于个性化内容。 |
| `public` | 允许存进**共享缓存**，即便带了 `Authorization` 头也可存。 |
| `must-revalidate` | 一旦陈旧，**不得**在未重新验证的情况下复用，必须回源校验。 |
| `immutable` | 声明内容在新鲜期内**永不改变**，浏览器刷新时也跳过不必要的重新验证（配合带哈希的文件名用）。 |

```http
HTTP/1.1 200 OK
Content-Type: application/javascript
Cache-Control: public, max-age=31536000, immutable
ETag: "abc123"
```

上面是带哈希文件名（如 `bundle.v123.js`）的典型强缓存：一年新鲜期 + `immutable`，连刷新都不回源。

**`Expires`（旧）**：HTTP/1.0 遗留头，给的是**绝对过期时刻**：

```http
Expires: Tue, 28 Feb 2026 22:22:22 GMT
```

它依赖客户端系统时钟、易解析出错。**当 `Cache-Control: max-age` 与 `Expires` 同时存在时，以 `max-age` 为准**（`Cache-Control` 优先级更高）。

**`Age`**：响应在缓存中已停留的秒数（由缓存添加）。例如在缓存里放了一天：`Age: 86400`。新鲜度判断本质是比较 `Age` 与 `max-age`。

::: warning no-cache 与 no-store 是高频混淆点
二者名字像，语义截然不同：

- **`no-cache`**：字面易误读成「不缓存」，实际是「**可以缓存，但每次用之前都要去服务端验证**」。响应会被存下来，复用前发条件请求（`If-None-Match`/`If-Modified-Since`），服务端说没变就回 `304` 复用本地副本（省下响应体带宽），变了才回 `200` 给新内容。适合「内容会变、但希望尽量走 304 省流量」的资源（如 HTML 入口）。
- **`no-store`**：才是真正的「**一点都别存**」——任何缓存都不得保存这份响应，每次都完整重新获取。适合敏感数据（如含隐私的接口响应）。

一句话：要「**每次校验**」用 `no-cache`，要「**绝不留存**」用 `no-store`。
:::

::: tip 没给 Cache-Control 时的启发式缓存
HTTP 倾向于尽量缓存——即便没有任何 `Cache-Control`，满足一定条件的响应仍会被存储复用，这叫**启发式缓存（heuristic caching）**：规范建议取「自上次修改以来时间」的约 10% 作为新鲜期（如资源一年没改，则缓存约 0.1 年）。因此最佳实践是**总是显式设置 `Cache-Control`**，别依赖这种隐式行为。
:::

### 协商缓存：ETag / Last-Modified → 304

当强缓存过期（陈旧）时，浏览器带「验证器」去问服务端「变了没」，这就是**协商缓存**。两套验证器：

**① `ETag` + `If-None-Match`（优先）**

服务端给资源一个 `ETag`（可基于正文哈希或版本号生成）；下次浏览器用 `If-None-Match` 带回去：

```http
GET /style.css HTTP/1.1
Host: example.com
If-None-Match: "33a64df5"
```

```http
HTTP/1.1 304 Not Modified
ETag: "33a64df5"
Cache-Control: max-age=3600
```

- **强验证器** `"33a64df5"`：要求**逐字节完全一致**。
- **弱验证器** `W/"33a64df5"`：以 `W/` 前缀标记，只要求**语义等价**（内容实质相同即可，不必字节一致），适用于动态压缩、范围请求等场景。

**② `Last-Modified` + `If-Modified-Since`**

服务端给出资源最后修改时间，浏览器下次用 `If-Modified-Since` 带回：

```http
GET /style.css HTTP/1.1
Host: example.com
If-Modified-Since: Tue, 22 Feb 2026 22:00:00 GMT
```

未变则同样返回 **`304 Not Modified`**。`304` 响应**没有响应体**，只有状态码与头，传输量极小，把陈旧副本「续命」为新鲜（继续享用剩余 `max-age`）。

::: tip ETag 更可靠，二者可并存
`Last-Modified` 精度只到秒、且「文件被改回原样」也会变时间戳，不够精确；`ETag` 基于内容更可靠。RFC 9110 建议服务端在 200 响应中**尽量同时**给出 `ETag` 与 `Last-Modified`。当条件请求同时带了二者时，**`If-None-Match`（ETag）优先**作为验证依据。
:::

### 强缓存 vs 协商缓存：语义区别

| 维度 | 强缓存 | 协商缓存 |
| --- | --- | --- |
| 是否发请求 | 新鲜期内**不发**，直接用本地副本 | **发**条件请求去服务端校验 |
| 相关首部 | `Cache-Control: max-age` / `Expires` | `ETag`+`If-None-Match` / `Last-Modified`+`If-Modified-Since` |
| 命中结果 | 本地直接读取（无网络） | `304 Not Modified`（仅头，无响应体） |
| 触发时机 | 资源仍新鲜 | 资源已陈旧（强缓存过期）后回源验证 |

两者通常**配合使用**：先用 `max-age` 吃强缓存，过期后再靠 `ETag`/`Last-Modified` 走协商，命中 `304` 就省下整个响应体的传输。

## 小结

- **持久连接**：HTTP/1.1 默认 keep-alive 复用 TCP，省握手；但单连接串行 + 每源 ~6 并发 + 应用层队头阻塞仍是瓶颈，管线化已废弃，根治靠 HTTP/2 多路复用。
- **范围请求**：`Accept-Ranges` 声明支持 → `Range` 请求 → `206` + `Content-Range`（`起-止/总长`）；`If-Range` 保证「没变才续传」，越界返回 `416`，多段用 `multipart/byteranges`。
- **缓存首部**：强缓存看 `Cache-Control`（`max-age`/`no-cache`/`no-store`/`immutable`/`s-maxage`…，优先于旧的 `Expires`）；协商缓存靠 `ETag`/`Last-Modified` 换 `304`；牢记 `no-cache`（每次校验）≠ `no-store`（绝不留存）。

> 浏览器拿到这些头后的**缓存决策流程、缓存位置与清除**见「浏览器缓存机制」一节；**HTTP/2、HTTP/3** 如何消除队头阻塞见「HTTP 演进与性能」一节。各首部、状态码（206/304/416）的逐条权威定义见 [参考](../reference)。
