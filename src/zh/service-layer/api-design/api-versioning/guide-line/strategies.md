---
layout: doc
outline: [2, 3]
---

# 版本控制策略：URL、Header 与媒体类型

> 基于 HTTP/REST 工程实践 · 核于 2026-08

## 速查

- **URL 版本控制**（最常用）：`/v1/users`、`/v2/users`。版本在 URL path 里，直观、易调试（浏览器直接访问）、缓存友好（CDN 按 URL 缓存）、客户端易理解。缺点是 URL「污染」（有人说版本不是资源的一部分，违反 REST 纯粹性）。GitHub、Twitter、Stripe 采用。
- **Header 版本控制**：`Accept-Version: 1` 或自定义头（`X-API-Version: 2`）。URL 干净（只有 `/users`），版本与资源分离。缺点是难调试（要构造请求头，浏览器直接访问看不出版本）、不易发现（看 URL 不知道版本）。较少用。
- **媒体类型内容协商**（最 RESTful）：`Accept: application/vnd.api+json;version=1`。用标准 HTTP 内容协商机制，版本嵌在媒体类型里。最符合 REST 哲学（HATEOAS 友好、版本是表示层关注点），但最复杂（客户端实现难、调试难）。GitHub 部分采用（`application/vnd.github.v3+json`）。
- **实现位置**：URL 版本在路由层（不同 path 路由到不同控制器）；Header/媒体类型在中间件（解析头决定版本）。多数 Web 框架都支持。
- **选型建议**：新项目务实选 **URL 版本控制**（直观易用）；追求 REST 纯粹性且团队成熟选**媒体类型**；避免 Header 版本（难调试的代价大过 URL 干净的收益）。
- **GraphQL 的演进**：GraphQL 靠「新增字段兼容 + @deprecated」几乎不需显式版本控制——新增字段不破坏旧查询，废弃字段标记后逐步迁移。这是 GraphQL 相对 REST 的优势。

## 一、URL 版本控制（最常用）

版本号放在 URL path 里：

```
GET /v1/users/42     ← 版本 1
GET /v2/users/42     ← 版本 2（破坏性变更后的新契约）
```

### 1.1 优点

- **直观**：看 URL 就知道版本，客户端、文档、日志一目了然。
- **易调试**：浏览器直接访问 `https://api.example.com/v1/users` 就能测试，curl 也简单。
- **缓存友好**：CDN/浏览器按完整 URL 缓存，`/v1/users` 和 `/v2/users` 是不同的缓存键。
- **客户端易理解**：改版本就是改 URL，明确知道在用哪个版本。

### 1.2 缺点

- **URL「污染」**：REST 纯粹派认为版本不是资源的一部分（`/users` 是资源，`/v1` 是元信息），放 URL 违反 REST。但务实派反驳：版本是契约的一部分，放 URL 最清晰。
- **改版本客户端要改 URL**：从 `/v1/` 迁移到 `/v2/`，所有客户端要改 URL（虽然本来也要改破坏性变更的代码）。

### 1.3 变体

- **path 前缀**（最常见）：`/v1/users`
- **子域名**：`v1.api.example.com/users`（少见，DNS/证书麻烦）
- **查询参数**：`/users?version=1`（不推荐，易与业务参数混淆，且默认 GET 缓存按完整 URL 包含查询参数）

### 1.4 谁在用

GitHub（`/v3/`）、Twitter（`/v1.1/`）、Stripe（`/v1/`）、AWS（`/2012-08-10/` 用日期版本）——业界主流。

## 二、Header 版本控制

版本号放在自定义请求头里：

```
GET /users/42
Accept-Version: 1              ← 版本在头里
# 或
X-API-Version: 2               ← 自定义头
```

### 2.1 优点

- **URL 干净**：只有 `/users`，版本与资源分离，符合「资源 URI 不变」的理念。
- **版本与资源解耦**：同一资源 URI 服务多个版本，路由层据头分发。

### 2.2 缺点

- **难调试**：要构造请求头，浏览器直接访问 `/users` 看不到版本（默认版本），Postman/curl 要手动加头。
- **不易发现**：看 URL 不知道版本，文档要额外说明默认版本和可用版本。
- **缓存难**：同一 URL `/users` 不同头返回不同内容，CDN 缓存要按 `Vary` 头区分（`Vary: Accept-Version`），比 URL 版本复杂。
- **HATEOAS 不友好**：链接里没法带头（链接只能表达 URL），客户端难「跟着链接走」自动选版本。

### 2.3 谁在用

较少见。部分内部 API 用（`X-API-Version`）。不推荐新项目采用。

## 三、媒体类型内容协商（最 RESTful）

用 HTTP 标准的内容协商机制，版本嵌在媒体类型（Media Type）里：

```
GET /users/42
Accept: application/vnd.example.v2+json     ← 厂商媒体类型带版本
# 或
Accept: application/json;version=2          ← 参数形式
```

### 3.1 优点

- **最符合 REST 哲学**：版本是「表示层」（representation）的关注点（同一资源的不同表示），不是资源本身的属性——这正是内容协商的设计意图。
- **HATEOAS 友好**：链接可以带媒体类型（`<link rel="user" type="application/vnd.example.v2+json">`），客户端跟着链接走自动选版本。
- **标准机制**：用 HTTP 内建的内容协商（Accept/Content-Type），无需发明新约定。

### 3.2 缺点

- **最复杂**：客户端要构造复杂的 Accept 头，比 URL 版本难用得多。
- **难调试**：同 Header 版本，浏览器直接访问看不出。
- **媒体类型注册**：`vnd.example.v2+json` 是厂商自定义媒体类型（vendor media type），虽符合 RFC 但需文档说明。

### 3.3 厂商媒体类型命名规范

```
application/vnd.{vendor}.{version}+{format}
```

- `vnd` = vendor（厂商前缀，IANA 约定）
- `{vendor}` = 公司/项目名（github、api）
- `{version}` = 版本（v1、v2、v3）
- `+{format}` = 基础格式（+json、+xml）

举例：GitHub 的 `application/vnd.github.v3+json`、JSON:API 的 `application/vnd.api+json`。

### 3.4 谁在用

GitHub（部分端点用 `application/vnd.github.v3+json`）。最 RESTful 但最复杂，适合追求纯粹 REST 的成熟团队。

## 四、三种策略对比

| 维度 | URL 版本 | Header 版本 | 媒体类型版本 |
| --- | --- | --- | --- |
| **示例** | `/v1/users` | `Accept-Version: 1` | `application/vnd.x.v1+json` |
| **直观性** | ✅ 最高 | ❌ 低 | ❌ 低 |
| **易调试** | ✅ 浏览器直访 | ❌ 要构造头 | ❌ 要构造头 |
| **缓存友好** | ✅ 按 URL | ❌ 需 Vary | ❌ 需 Vary |
| **REST 纯粹性** | ❌ 低 | 🟡 中 | ✅ 最高 |
| **HATEOAS 友好** | ❌ | ❌ | ✅ |
| **客户端易用** | ✅ | 🟡 | ❌ |
| **业界采用** | ✅ 最多 | 少见 | GitHub 等 |
| **推荐** | ✅ 务实首选 | ❌ 避免 | 成熟团队 |

## 五、实现要点

### 5.1 路由层分发（URL 版本）

```js
// NestJS / Express 示例
app.use('/v1/users', v1UserController);
app.use('/v2/users', v2UserController);
// 或单一控制器内据版本分发
```

### 5.2 中间件解析（Header/媒体类型）

```js
// 解析 Accept-Version 头
function versionMiddleware(req, res, next) {
  req.apiVersion = req.get('Accept-Version') || '1';  // 默认 v1
  next();
}
```

### 5.3 版本共存策略

- **新旧版本同时运行**：`/v1/` 和 `/v2/` 路由到不同控制器，给客户端迁移窗口（如 6-12 个月）。
- **共享业务逻辑 + 适配层**：核心业务逻辑共享，各版本控制器做字段映射/转换（`v1` 的 `email` ↔ `v2` 的 `emailAddress`）。
- **退役旧版本**：到期后下线 `/v1/`（返回 410 Gone + 升级提示），但要注意长尾客户端。

## 交互演示

本叶无专门可视化，版本控制策略建议结合实际项目（如对比 GitHub API 的 `/v3/` 与媒体类型）体会。

## 下一步

讲完三种策略后，下一个主题是 [废弃策略与迁移](./deprecation)——旧版本/字段如何标记废弃、Sunset 头、迁移窗口设计、向后兼容的工程原则。
