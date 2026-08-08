---
layout: doc
outline: [2, 3]
---

# 分页、内容协商与错误处理

> 基于 REST 架构风格 · HTTP/1.1 (RFC 9110) · 核于 2026-08

## 速查

- **分页三种策略**：①**offset 分页**（`?page=2&pageSize=20`，简单但深翻慢、有数据漂移）；②**cursor 分页**（`?cursor=abc123`，稳定不漂移、深翻快，但只能顺序翻）；③**keyset 分页**（`?afterId=42`，基于排序键，性能最优）。**offset 适合浅翻/随机跳页，cursor/keyset 适合无限滚动/数据频繁变动**。
- **offset 分页的坑**：`LIMIT 100000, 20` 要先扫 100020 行再丢弃，深翻极慢；翻页期间有新数据插入会导致「跳过/重复」（数据漂移）。
- **cursor 分页**：服务器返回下一页的「游标」（通常是加密的排序位置），客户端传回继续翻——稳定（不受新插入影响）、深翻快，但**不能随机跳到第 N 页**，只能上一页/下一页。
- **响应携带分页元信息**：用 **Link header**（RFC 5988）表达 `rel="next"/"prev"/"first"/"last"`，或返回 `{data, pagination: {total, page, hasMore}}` 体。GitHub API 用 Link header。
- **内容协商（Content Negotiation）**：客户端用 `Accept` 头声明想要的格式（`Accept: application/json` / `application/xml`），服务器据此选格式返回，响应用 `Content-Type` 头声明实际格式——这是 HTTP 的标准机制，让同一 URI 服务多种客户端。
- **Accept 常见值**：`application/json`（最常用）、`application/xml`、`text/html`、`application/vnd.api+json`（JSON:API 规范）、`application/vnd.github.v3+json`（带版本，见 API 版本控制叶）。
- **统一错误格式**：错误响应应有**固定结构**——至少含 `code`（业务错误码）、`message`（人类可读）、`details`（字段级错误，用于表单校验回显）。RFC 9457（Problem Details for HTTP APIs）是标准格式：`{type, title, status, detail, instance}`。
- **错误分类**：①客户端可重试（503 暂不可用、429 限流）；②客户端改请求（400/422 格式或语义错）；③客户端无能为力（403/404）。在 `message` 或 `Retry-After` 头里给指引。

## 一、分页：处理大数据集

当资源集合很大（如 10 万条订单），一次全返会撑爆内存与网络。分页让客户端按页取。

### 1.1 offset 分页（最简单）

```
GET /orders?page=3&pageSize=20
→ SQL: SELECT * FROM orders LIMIT 20 OFFSET 40;
→ 返回 {data: [...], pagination: {page:3, pageSize:20, total:10000, totalPages:500}}
```

- **优点**：直观、可随机跳页（直接 `?page=50`）、能返回 total（前端显示「共 500 页」）。
- **缺点 1：深翻慢**。`LIMIT 100000, 20` 数据库要先扫 100020 行再丢弃前 10 万行——越往后越慢，百万级数据深翻到秒级。
- **缺点 2：数据漂移**。翻到第 3 页时有人插入了新数据，原本第 3 页的内容被挤到第 4 页——用户看到重复或跳过的数据。
- **适用**：数据量小（千级）、不频繁变动、需要随机跳页（如后台管理分页表格）。

### 1.2 cursor 分页（稳定且深翻快）

```
GET /orders?pageSize=20
→ 返回 {data: [...20条...], nextCursor: "eyJjcmVhdGVkQXQiOiIyMDI2In0="}

GET /orders?pageSize=20&cursor=eyJjcmVhdGVkQXQiOiIyMDI2In0=
→ 返回下一页 + 新的 nextCursor（null 表示到底）
```

- **cursor 是什么**：服务器返回的「游标」，通常是**加密/编码的排序位置**（如 Base64 编码的 `{createdAt: "2026-08-01", id: 42}`）。客户端不关心内容，只原样传回。
- **优点**：①**稳定不漂移**——基于位置的游标，新插入数据不影响已翻过的页；②**深翻快**——每次 `WHERE created_at < cursor值 LIMIT 20` 走索引，不用扫前面所有行。
- **缺点**：①**不能随机跳页**（只能上一页/下一页，没有「第 50 页」）；②**无法返回准确 total**（要 total 得单独 count，慢）；③实现稍复杂。
- **适用**：无限滚动（信息流/时间线）、数据频繁变动、大数据集（百万级以上）。Twitter/Facebook Feed 都用 cursor。

### 1.3 keyset 分页（性能最优）

```
GET /orders?afterId=42&pageSize=20
→ SQL: SELECT * FROM orders WHERE id > 42 ORDER BY id LIMIT 20;
```

- **keyset（键集）分页**：基于排序键（通常是自增 id 或 created_at）的比较。是 cursor 分页的简化版（cursor 是加密的 keyset）。
- **优点**：性能最优（走索引范围查询），实现比 cursor 简单（无需加密）。
- **缺点**：排序键必须**唯一且单调**（id 或 created_at+id 复合），否则会漏/重。多列排序难处理。
- **适用**：按 id 或时间排序的列表，内部 API。

### 1.4 三种分页对比

| 策略 | 深翻性能 | 数据漂移 | 随机跳页 | 实现 | 适用 |
| --- | --- | --- | --- | --- | --- |
| offset | 慢（扫前面行） | 有 | ✅ | 简单 | 小数据/后台/需跳页 |
| cursor | 快 | 无 | ❌ | 中等 | 无限滚动/大数据/变动频繁 |
| keyset | 最快 | 无 | ❌ | 简单 | 按id/时间排序的列表 |

### 1.5 分页元信息怎么传

- **Link header（RFC 5988）**：GitHub API 的做法，响应头里带上下页链接：
  ```
  Link: <https://api.example.com/orders?page=4>; rel="next",
        <https://api.example.com/orders?page=50>; rel="last"
  ```
- **响应体 pagination 字段**：`{data, pagination: {page, pageSize, total, hasMore}}`，前端易消费，最常见。

## 二、内容协商：同 URI 多格式

**内容协商（Content Negotiation）** 让同一 URI 根据客户端需求返回不同格式——这是 HTTP 的标准机制（RFC 9110 第 12 节）。

### 2.1 协商流程

```
客户端                          服务器
  │  GET /users/42
  │  Accept: application/json    ← 声明要 JSON
  │ ───────────────────────────→ │
  │                              │ 据 Accept 选格式
  │  200 OK
  │  Content-Type: application/json   ← 声明返回了 JSON
  │  {"id":42,"name":"Alice"}
  │ ←─────────────────────────── │
```

- **Accept 头**：客户端声明能接受的格式（可多个，带权重 `q`）：`Accept: application/json, application/xml;q=0.8`。
- **Content-Type 头**：服务器响应里声明实际返回的格式。GET 请求的响应也带 Content-Type（不只是 POST body 才有）。
- **服务器拒绝**：客户端要的格式服务器不支持 → 返回 **406 Not Acceptable**。

### 2.2 常见 Accept 值

| Accept | 含义 |
| --- | --- |
| `application/json` | JSON（最常用） |
| `application/xml` | XML（老系统/企业 API） |
| `text/html` | HTML（浏览器） |
| `application/vnd.api+json` | JSON:API 规范格式 |
| `application/vnd.github.v3+json` | 厂商自定义媒体类型（带版本，见版本控制叶） |
| `application/octet-stream` | 二进制流（文件下载） |

### 2.3 媒体类型（Media Type）与厂商前缀

- **标准媒体类型**：`application/json`、`text/html` 等，由 IANA 注册。
- **厂商/自定义媒体类型**：`application/vnd.{vendor}.{version}+{format}`，如 GitHub 的 `application/vnd.github.v3+json`。`vnd` 是 vendor，用于携带版本或规范信息——这是**Header 版本控制**的基础（见 API 版本控制叶）。

## 三、错误处理：统一错误格式

REST API 的错误处理要兼顾**机器可解析**（客户端据错误码做不同处理）与**人类可读**（开发者看 message 排查）。

### 3.1 统一错误格式

错误响应应有**固定结构**，不能每种错误格式不一样：

```json
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://errors.example.com/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "Email already registered",
  "instance": "/users",
  "errors": [
    {"field": "email", "code": "DUPLICATE", "message": "Email already registered"}
  ]
}
```

- **type**：错误类型的 URI（可链接到文档），便于客户端程序化处理。
- **title**：简短人类可读摘要。
- **status**：HTTP 状态码（冗余但便于日志）。
- **detail**：详细人类可读说明。
- **instance**：出问题的具体 URI。
- **errors**（扩展）：字段级错误数组，用于表单校验回显（哪个字段、什么错）。

### 3.2 RFC 9457（Problem Details for HTTP APIs）

RFC 9457（前身为 RFC 7807）定义了 HTTP API 的**标准错误格式**（application/problem+json），已被 Spring、NestJS、ASP.NET Core 等框架广泛支持。建议直接用此格式而非自造，好处：①标准化，工具能识别；②跨团队一致；③扩展字段（errors）可加业务细节。

### 3.3 错误码设计

- **HTTP 状态码**表达**类别**（4xx 客户端错 / 5xx 服务端错），**业务错误码**（body 里的 code）表达**具体业务错**（`USER_NOT_FOUND` / `EMAIL_DUPLICATE` / `INSUFFICIENT_BALANCE`）。
- **业务错误码命名**：大写蛇形（`INSUFFICIENT_BALANCE`），带业务前缀（`USER_NOT_FOUND`），稳定不变（一旦发布不改名，否则破坏客户端）。
- **别用数字错误码**：`code: 4001` 没语义，`code: "USER_NOT_FOUND"` 自描述——优先用字符串。

### 3.4 客户端可重试 vs 不可重试

| 情况 | 客户端怎么办 |
| --- | --- |
| **503 Service Unavailable** / **429 Too Many Requests** | 可重试，**看 `Retry-After` 头**等几秒再试 |
| **500 Internal Server Error** | 谨慎重试（可能是持续性 bug），有限次 |
| **400 / 422** | 改请求后重试 |
| **401** | 重新登录获取新 token |
| **403 / 404** | 别重试（重试也没用） |

- **429 限流**：服务器返回 `429 Too Many Requests` + `Retry-After: 60`（60 秒后重试）。客户端必须遵守，否则被封。
- **幂等性配合重试**：可重试的错误，配合 Idempotency-Key（POST）确保重试不产生副作用。

## 交互演示

本叶无专门可视化，分页与错误处理建议结合实际项目（调用 GitHub REST API 观察 Link header 与错误响应）体会。

## 下一步

REST 的核心设计原则到此讲完。下一步可深入 [API 版本控制](../../api-versioning/)（REST API 如何演进而不破坏客户端）与 [OpenAPI 规范](../../openapi-spec/)（如何用规范描述 REST API 并生成文档/SDK）。
