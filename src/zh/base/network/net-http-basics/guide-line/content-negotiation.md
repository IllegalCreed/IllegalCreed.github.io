---
layout: doc
outline: [2, 3]
---

# HTTP 内容协商

> 基于 HTTP 标准（RFC 9110 语义）· 核于 2026-06

## 速查

- **内容协商**：同一个 URL 可对应多个**表示（representation）**，服务器按客户端偏好返回最合适的一份（如中文版 / 英文版、gzip 版 / br 版）。
- **两种模式**：**主动协商 / 服务器驱动（server-driven，主流）**——客户端发偏好头、服务器决定；**被动协商 / 代理驱动（agent-driven，少用）**——服务器返回备选列表、客户端再选。
- **四个 Accept 系列请求头**：`Accept`（媒体类型）、`Accept-Language`（语言）、`Accept-Encoding`（压缩）、`Accept-Charset`（字符集，**已废弃**）。
- **质量值 q（quality value）**：取值 `0~1`，**默认 1**，越大越优先；写法如 `zh;q=0.9`。`q=0` 表示明确不接受。
- **优先级规则**：先按 q 值从大到小，q 相同则更具体的类型优先，再按出现顺序。
- **`Accept-Charset` 已废弃**：现代浏览器**不再发送**，一律假定 UTF-8，服务端无需理会。
- **响应表示头**：`Content-Type`、`Content-Language`、`Content-Encoding` 回告服务器最终选了哪份表示。
- **`Vary` 响应头**：告诉缓存"本响应随哪些请求头变化"（如 `Vary: Accept-Encoding`），**对 CDN/缓存正确性至关重要**；漏配会让缓存把错误编码/语言的版本喂给其他用户。
- **`Vary: *`**：表示协商还依赖请求头之外的信息，**等同于禁止缓存**。
- **现代编码**：`gzip` / `deflate` / `br`（Brotli）/ `zstd`（Zstandard）均为 Baseline，`br`、`zstd` 是当下高压缩比首选。
- **演进**：**Client Hints**（`Sec-CH-*` + `Accept-CH`）作为内容协商的补充，让服务器按需索取设备/视口等提示，减少指纹与冗余。

## 什么是内容协商

同一个资源 URL，背后往往不止一份内容。`https://example.com/page` 可能同时有中文版和英文版、有未压缩版和 Brotli 压缩版、有 HTML 版和 JSON 版——这些都是同一资源的不同**表示（representation）**。

**内容协商（Content Negotiation）** 就是客户端与服务器协商"这次返回哪一份表示"的机制：客户端在请求里带上自己的偏好（能接受什么语言、什么格式、什么压缩），服务器据此挑出最合适的一份返回。

::: tip 为什么用同一个 URL
让多语言/多格式共用一个 URL（而非 `/zh/page`、`/en/page` 分开），好处是链接稳定、SEO 友好、对用户透明。代价是必须正确处理 `Vary`，否则缓存会出错（见后文）。
:::

## 两种协商模式

### 主动协商（服务器驱动，主流）

客户端在请求头里声明偏好，**由服务器决定**返回哪份表示。这是绝大多数场景采用的方式，浏览器自动完成，用户无感知。

```http
GET /page HTTP/1.1
Host: example.com
Accept: text/html,application/xhtml+xml,*/*;q=0.8
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
Accept-Encoding: gzip, deflate, br, zstd
```

服务器读取这些头、选出最匹配的表示后返回，并用响应头回告自己的选择。若实在无法满足，可返回 `406 Not Acceptable`（媒体类型/语言不匹配）或 `415 Unsupported Media Type`。

### 被动协商（代理驱动，少用）

服务器不直接决定，而是返回一个**备选表示的列表**，让客户端（或用户）自己挑，再发起第二次请求。

缺点很明显：多一次往返、拖慢加载，且 HTTP 标准没规定备选列表的格式，实际上往往退化成"一个落地页 + JavaScript 跳转"。因此它只作为兜底，现实中极少使用。下文聚焦主动协商。

## 主动协商的请求头

### Accept：媒体类型

声明客户端能处理的 MIME 类型，逗号分隔，可带 q 值。

```http
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
```

含义：优先 `text/html` 与 `application/xhtml+xml`（默认 q=1），其次 `application/xml`（q=0.9），其余任意类型 `*/*` 兜底（q=0.8）。前端用 `fetch` 请求 JSON 接口时，常显式设 `Accept: application/json`。

### Accept-Language：语言

声明用户偏好的自然语言。

```http
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
```

浏览器通常根据系统/浏览器的语言设置自动生成此头，是服务端做国际化（i18n）路由的主要依据。

### Accept-Encoding：压缩

声明客户端能解压的内容编码（压缩算法）。

```http
Accept-Encoding: gzip, deflate, br, zstd
```

| 取值 | 含义 | 状态 |
| --- | --- | --- |
| `gzip` | LZ77 + 32 位 CRC，兼容性最好 | Baseline |
| `deflate` | zlib + DEFLATE | Baseline |
| `br` | Brotli，压缩比优于 gzip，文本首选 | Baseline |
| `zstd` | Zstandard，压缩比与速度俱佳的新选择 | Baseline |
| `identity` | 不压缩；即使不写也总是可接受 | Baseline |
| `*` | 匹配未列出的任意编码；头缺失时的默认值 | Baseline |

::: tip 压缩算法本身不在本页范围
这里只把 `gzip` / `br` / `zstd` 当作 `Accept-Encoding` 的取值来看待，不展开各算法实现原理。
:::

### Accept-Charset：已废弃

历史上用来声明可接受的字符集，但 **HTTP 标准已将其标记为废弃**。

::: warning Accept-Charset 别再用
现代浏览器**不再发送** `Accept-Charset`——因为 Web 已统一到 UTF-8，逐请求声明字符集既无意义又徒增指纹风险。服务端**无需理会**此头，直接以 UTF-8 编码输出即可。你只会在很老的代码/抓包里偶尔见到它。
:::

## 质量值 q：如何排优先级

**质量值（quality value，简称 q）** 用 `;q=` 附在每个取值后，表示相对偏好程度：

- 取值范围 `0` ~ `1`（最多三位小数）；
- **不写 q 时默认 `q=1`**（最高优先）；
- `q=0` 表示**明确不接受**该项；
- 数值越大越优先。

以 `Accept-Language: zh-CN,zh;q=0.9,en;q=0.8` 为例，解析出的优先级：

| 语言标记 | q 值 | 优先级 | 说明 |
| --- | --- | --- | --- |
| `zh-CN` | 1.0（默认） | 1 | 简体中文（中国大陆），最优先 |
| `zh` | 0.9 | 2 | 任意中文（如 `zh-TW`、`zh-HK`）作为退路 |
| `en` | 0.8 | 3 | 英文，再退一步 |

服务器据此匹配：若有 `zh-CN` 资源就返回它；没有但有 `zh-TW` 则用 `zh`（0.9）这条退路命中；都没有才回退英文。

::: tip 排序规则
当多个候选 q 值相同时，**更具体的类型优先**（如 `text/html` 优先于 `text/*`，`text/*` 又优先于 `*/*`），其次才看在头里出现的先后顺序。
:::

## 服务端如何选择并回告

服务器综合各 `Accept-*` 头与自身可提供的表示，挑出最佳匹配，并在**响应头**里回告最终选择：

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Language: zh-CN
Content-Encoding: br
Vary: Accept-Encoding, Accept-Language
Content-Length: 5328

…（Brotli 压缩后的简体中文 HTML 字节）…
```

各响应头与请求头一一对应：

| 请求偏好 | 服务器回告 | 含义 |
| --- | --- | --- |
| `Accept` | `Content-Type` | 实际返回的媒体类型与字符集 |
| `Accept-Language` | `Content-Language` | 实际返回的语言 |
| `Accept-Encoding` | `Content-Encoding` | 实际采用的压缩算法 |

::: tip Content-Encoding 缺失即未压缩
若响应**没有** `Content-Encoding` 头，表示内容未压缩（identity），客户端直接按原始字节处理。
:::

## Vary：缓存正确性的关键

内容协商一旦遇上缓存（浏览器缓存、CDN、反向代理），就必须搞清楚一个问题：**缓存把同一个 URL 的响应存起来后，下一个偏好不同的用户来取，能直接复用吗？**

`Vary` 响应头就是答案——它列出"本响应是依据哪些请求头协商出来的"，缓存据此把同一 URL 拆成多个缓存条目分别存储。

```http
Vary: Accept-Encoding
```

这行的意思是："本响应随 `Accept-Encoding` 变化"。于是缓存会为 `Accept-Encoding: br` 和 `Accept-Encoding: gzip` 分别保存一份，互不串味。

::: warning 漏配 Vary：最隐蔽也最致命的缓存坑
假设服务器对同一 URL 按 `Accept-Encoding` 返回了 **Brotli 版**，却**忘了**带 `Vary: Accept-Encoding`：

1. 用户 A（支持 br）请求 → CDN 缓存了这份 **br 压缩字节**，但因没有 Vary，缓存认为"这个 URL 只有一份内容"；
2. 用户 B（老客户端，**不支持 br**，只发 `Accept-Encoding: gzip`）请求同一 URL → CDN 直接把缓存的 **br 字节**返回；
3. 用户 B 的客户端按 gzip 解压 br 数据 → **解压失败 / 页面乱码 / 白屏**。

语言协商同理：漏配 `Vary: Accept-Language` 会让英文用户拿到缓存里的中文页。**凡是做了内容协商，就必须把参与协商的请求头写进 `Vary`**——这是 CDN/缓存正确性的硬性要求。
:::

`Vary` 还有一个特殊值 `*`：

```http
Vary: *
```

它表示协商还依赖了请求头**之外**的信息（缓存无从复现），因此**等同于告诉缓存"别缓存"**。

::: tip Vary 的取舍
`Vary` 的值越多，缓存命中率越低（条目被切得越碎）。常见做法是只对真正影响内容的头（多为 `Accept-Encoding`，国际化站点再加 `Accept-Language`）声明 Vary，避免把 `User-Agent` 这类高基数头塞进去导致缓存几乎失效。
:::

## 前端实战

内容协商在前端开发里随处可见，理解它能帮你定位很多"玄学"问题：

- **国际化（i18n）**：服务端读取 `Accept-Language` 决定首屏语言。注意它只是"偏好提示"——成熟产品通常允许用户手动切换并用 Cookie/localStorage 记住选择，覆盖浏览器默认值。
- **压缩**：客户端发 `Accept-Encoding: gzip, br, zstd`，服务端/CDN 据此选最优压缩。前端基本无需手动处理——浏览器自动解压，`fetch`/`XHR` 拿到的已是解压后的内容。
- **接口格式**：调用 REST 接口时显式 `Accept: application/json`，可避免服务端误返回 HTML 错误页；配合 `Content-Type` 校验响应。
- **排查缓存异常**：遇到"换了浏览器/语言后内容不对""CDN 返回乱码"，第一时间在响应里查 `Vary` 配得对不对，再看 `Content-Encoding` / `Content-Language` 是否与请求偏好一致。

## 现代演进：Client Hints

主动协商有个固有矛盾：要让服务器选得准，就得在**每个请求**里塞进大量偏好头，既冗余又放大了**指纹（fingerprinting）** 风险。

**Client Hints（客户端提示）** 是应对之道：服务器先用 `Accept-CH` 响应头**声明它想要哪些提示**，浏览器随后只在需要时附带对应的 `Sec-CH-*` 请求头（如 `Sec-CH-Viewport-Width` 视口宽度、`Sec-CH-DPR` 像素比、`Sec-CH-Device-Memory` 设备内存）。

```http
# 服务器先索取
Accept-CH: Sec-CH-Viewport-Width, Sec-CH-DPR

# 浏览器后续请求按需附带
Sec-CH-Viewport-Width: 1280
Sec-CH-DPR: 2
```

这是"按需索取"对"无脑全发"的改良，可用于响应式图片等场景。目前仍在演进、各浏览器支持程度不一，了解其思路即可，本页不展开。

## 小结

- 内容协商让**同一 URL** 承载多份**表示**，按客户端偏好返回最合适的版本；**主动协商（服务器驱动）** 是绝对主流，被动协商极少用。
- 偏好通过 `Accept` / `Accept-Language` / `Accept-Encoding` 三个请求头表达（`Accept-Charset` 已废弃、浏览器不再发送）；**质量值 q**（0~1、默认 1）决定优先级。
- 服务器用 `Content-Type` / `Content-Language` / `Content-Encoding` 回告最终选择。
- **`Vary` 是缓存正确性的命门**：参与协商的请求头必须写进 `Vary`，否则 CDN/缓存会把错误编码或语言的版本喂给其他用户。
- **Client Hints（`Sec-CH-*`）** 是内容协商面向隐私与精简的演进方向。

下一页进入有状态的世界：[Cookie 与会话管理](./cookies-sessions)。
