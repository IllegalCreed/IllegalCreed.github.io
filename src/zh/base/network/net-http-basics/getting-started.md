---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTTP 标准（RFC 9110 语义 / RFC 9111 缓存）· 核于 2026-06

## 速查

- HTTP 是**应用层**协议、**请求—响应**模型、**无状态**、**媒体无关**；HTTP/1.1 与 HTTP/2 跑在 TCP 上，HTTP/3 跑在 QUIC（UDP）上
- 一次请求的生命周期：**DNS 解析 → 建立 TCP（HTTPS 再加 TLS）连接 → 发送请求报文 → 服务器返回响应报文 → 连接复用（keep-alive）或关闭**
- 请求报文四段：**请求行**（方法 + 目标 + 版本）/ **首部** / **空行** / **体**；响应把请求行换成**状态行**（版本 + 状态码 + 原因短语）
- 方法记语义：`GET` 读、`POST` 写、`PUT` 整体替换、`PATCH` 局部改、`DELETE` 删、`HEAD` 只要响应头、`OPTIONS` 探询能力
- 三大属性：**安全**（只读）⊆ **幂等**（多次 = 一次）；`GET`/`HEAD` 默认**可缓存**；`POST` 非幂等
- 状态码五类：**1xx** 信息 / **2xx** 成功 / **3xx** 重定向 / **4xx** 客户端错 / **5xx** 服务端错
- 高频码：`200`/`201`/`204`/`206`、`301`/`302`/`304`/`307`/`308`、`400`/`401`/`403`/`404`/`429`、`500`/`502`/`503`/`504`
- 首部四类：**请求头** / **响应头** / **表示头**（描述消息体）/ **通用头**；字段名**大小写不敏感**
- 状态靠外挂：`Set-Cookie` 下发、`Cookie` 自动回传；会话方案有服务端 Session 与自包含 Token（JWT）
- 缓存两路：**强缓存**（`Cache-Control`/`Expires`，命中不发请求）+ **协商缓存**（`ETag`/`Last-Modified` → `304`）
- 内容协商：`Accept` 系列 + 质量值 `q` 让同一 URL 返回最合适的语言 / 格式 / 编码
- 学习捷径：`curl -v https://example.com` 或浏览器 **DevTools → Network** 面板，逐字节看真实的请求行、首部与状态码

## 五分钟看懂一次 HTTP 请求

在浏览器地址栏敲下一个网址、按回车，到页面出现，HTTP 这一层大致经历五步：

1. **DNS 解析**：把域名 `example.com` 换成 IP 地址（详见「DNS 域名系统」叶）。
2. **建立连接**：与该 IP 的服务器建立 TCP 连接（三次握手）；如果是 HTTPS，再叠一层 TLS 握手协商加密（详见「HTTPS 与传输安全」叶）。
3. **发送请求报文**：浏览器把「要什么」写成一条 HTTP 请求发过去。
4. **服务器返回响应报文**：服务器处理后，把「状态 + 数据」写成一条响应发回来。
5. **复用或关闭**：HTTP/1.1 默认 `keep-alive`，这条 TCP 连接会留着给后续请求复用，省去反复握手。

中间第 3、4 步就是 HTTP 协议的核心。一条最简单的请求与响应长这样：

```http
GET /index.html HTTP/1.1
Host: example.com
Accept: text/html
Accept-Language: zh-CN,zh;q=0.9
User-Agent: Mozilla/5.0
```

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 1256
Cache-Control: max-age=3600
ETag: "a1b2c3"

<!DOCTYPE html>
<html>...</html>
```

读懂这两段，就读懂了 HTTP 的一大半：

- 请求第一行 `GET /index.html HTTP/1.1` 是**请求行**——「用 GET 方法、要 /index.html、走 HTTP/1.1」。
- 响应第一行 `HTTP/1.1 200 OK` 是**状态行**——「HTTP/1.1、状态码 200、一切正常」。
- 两边各自的 `Key: Value` 都是**首部**，传递元数据：`Content-Type` 说明体是什么、`Cache-Control`/`ETag` 控制缓存、`Accept-Language` 表达语言偏好。
- 首部之后空一行，再往下（响应里）才是真正的**消息体**——HTML 内容。

::: tip 亲手抓一次包
打开浏览器 DevTools 切到 **Network** 面板，刷新任意网页，点开任意一条请求，就能看到上面这套「请求行 / 状态行 / 首部 / 体」的真实内容。命令行里 `curl -v https://example.com` 也会把发出与收到的每一行打印出来。把本叶的概念对着真实抓包看一遍，远比死记硬背高效。
:::

## 本叶讲什么

HTTP 协议基础这一叶，就是把上面这套「请求—响应」拆开讲透：

- **报文与方法**：四段结构、九个方法的语义、安全 / 幂等 / 可缓存——[HTTP 报文结构与请求方法](./guide-line/http-messages-methods)
- **状态码**：五大类与高频码、容易混淆的几组——[HTTP 状态码全谱](./guide-line/status-codes)
- **首部**：分类、高频字段、语法规则——[HTTP 首部精要](./guide-line/http-headers)
- **内容协商**：Accept 系列与 q 值、Vary——[HTTP 内容协商](./guide-line/content-negotiation)
- **Cookie 与会话**：Set-Cookie 属性、SameSite 安全——[Cookie 与会话管理](./guide-line/cookies-sessions)
- **连接、范围与缓存**：keep-alive、Range/206、Cache-Control/ETag——[持久连接、范围请求与缓存首部](./guide-line/connection-range-caching)

学完整叶，再去看「HTTP 演进与性能」（HTTP/2、HTTP/3）、「HTTPS 与传输安全」、「跨域与同源策略」三叶，就能把现代 Web 网络层串成完整的一张图。
