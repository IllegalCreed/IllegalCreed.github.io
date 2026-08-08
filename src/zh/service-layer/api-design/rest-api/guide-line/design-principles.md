---
layout: doc
outline: [2, 3]
---

# REST 设计原则：资源建模、动词语义、状态码与幂等性

> 基于 REST 架构风格（Roy Fielding 2000）· HTTP/1.1 (RFC 9110) · 核于 2026-08

## 速查

- **资源建模三原则**：①URI 用**名词复数**（`/users` 不用 `/getUsers`）；②**层级表达从属**（`/users/42/orders`），但别超 2 层嵌套；③**复杂动作**用子资源（`POST /orders/42/cancel`）或状态字段更新（`PATCH /orders/42 {status}`），团队权衡。
- **HTTP 动词核心语义**：GET（幂等安全，查询）、POST（不幂等，新增/触发）、PUT（幂等，**全量**替换）、PATCH（部分更新，通常幂等）、DELETE（幂等，移除）。**PUT vs PATCH**：PUT 必须传完整资源（漏传字段被清空），PATCH 只传变化字段。
- **安全（Safe）vs 幂等（Idempotent）**：安全 = 不改服务器状态（GET/HEAD/OPTIONS）；幂等 = 重复执行结果不变（GET/PUT/DELETE）。**GET 绝不能改数据**（爬虫/预取/CDN 缓存会误触发）。
- **状态码五类**：2xx 成功（200/201/204）、3xx 重定向（304 缓存命中）、4xx 客户端错（400 格式/401 未认证/403 无权限/404 不存在/409 冲突/422 语义错）、5xx 服务端错（500/502/503）。
- **401 vs 403**：401 = 没认证（你是谁？）、403 = 认证了但没权限（能登录但不能删别人资源）。
- **400 vs 422**：400 = 请求格式错（JSON 解析失败/缺必填字段）、422 = 格式对但语义错（邮箱已注册）。
- **幂等性工程实现**：对非幂等操作（POST 支付）用 **Idempotency-Key** 头——客户端生成唯一 key，服务器存 key→结果，重试同 key 返回首次结果。Stripe/GitHub/AWS 标准实践。
- **HATEOAS**：响应带后续可操作链接（订单附 `pay`/`cancel` 链接），客户端跟着链接走不硬编码 URL——严格 REST 要求，工程落地罕见。

## 一、资源建模：URL 设计的工程细节

资源 URI 设计的好坏，直接决定 API 的可读性、可演进性。核心原则：**URI 命名资源，动词在 HTTP method。**

### 1.1 命名规范

- **名词复数**：`/users`、`/orders`、`/articles`。复数表达「集合」，单数靠 id。**别用单数**（`/user`）也**别混用**（有的 `/users` 有的 `/order`）。
- **小写连字符**（kebab-case）：`/order-items`，不用驼峰（`/orderItems`）或下划线（`/order_items`）——URL 大小写敏感，统一小写避免歧义。
- **用业务名词不用技术名词**：`/users` 不用 `/user-table` 或 `/user-entity`——资源是业务概念，不是数据库表。
- **避免动词**：`/getUser`、`/createOrder`、`/deleteUserById` 都是 RPC 风格，动词应由 HTTP method 表达。

### 1.2 层级与嵌套

```
GET /users/42/orders/7     ← 用户 42 的订单 7（2 层嵌套，OK）
GET /users/42/orders/7/items/3/skus   ← 4 层嵌套，太深（反模式）
```

- **子资源表达从属**：`/users/42/orders` 表示「用户 42 的订单」。但**层级尽量 ≤ 2 层**——超过就改成顶层资源（`/orders/7/items` 而不是 `/users/42/orders/7/items`），用查询参数过滤（`/orders?userId=42`）。
- **关系而非嵌套**：如果资源可独立访问（订单可脱离用户单独查），就用顶层 URI + 过滤参数，不强嵌套。

### 1.3 复杂操作（动作）的处理

业务里有大量非 CRUD 动作：「批准订单」「转账」「激活账户」「重置密码」。两种工程方案：

| 方案 | 示例 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **子资源动作**（务实派） | `POST /orders/42/cancel` `POST /orders/42/approve` | 直观、语义清晰、易实现 | 不纯 REST（带动词），纯粹派诟病 |
| **状态字段更新**（纯粹派） | `PATCH /orders/42 {status: "cancelled"}` | 纯 REST（用 PATCH 改字段） | 副作用隐藏（取消要发邮件/退款，看不出） |

工程现实：**两者混用**。简单状态变更用 PATCH，有复杂副作用的动作用子资源 POST。关键是团队一致。

### 1.4 查询参数

```
GET /users?role=admin&sort=-created&page=2&pageSize=20
GET /users?fields=id,name,email        ← 稀疏字段（按需取字段）
GET /users?embed=orders                ← 嵌入关联资源
```

- **过滤/排序/分页**用查询参数，不放 path。
- **稀疏字段**（Sparse Fieldset）：`?fields=id,name` 让客户端按需取字段，减少传输——这是 REST 应对 GraphQL「过度获取」的标准手段。

## 二、HTTP 动词语义：CRUD 对应与边界

### 2.1 五大动词

| 动词 | 语义 | 幂等 | 安全 | 典型响应 |
| --- | --- | --- | --- | --- |
| GET | 获取资源 | ✅ | ✅ | 200 + body |
| POST | 新增资源（集合） / 触发动作 | ❌ | ❌ | 201 + Location + body |
| PUT | 全量替换（客户端提供完整资源） | ✅ | ❌ | 200 / 204 |
| PATCH | 部分更新（只传变化字段） | ✅* | ❌ | 200 + body |
| DELETE | 删除资源 | ✅ | ❌ | 204（无 body） |

### 2.2 PUT vs PATCH（最常踩的坑）

```
现有：  /users/42 = {id:42, name:"Alice", email:"a@x.com", age:30}

PUT /users/42 {name:"Bob"}
  → 结果：{id:42, name:"Bob"}            ← email、age 被清空！PUT 是全量替换

PATCH /users/42 {name:"Bob"}
  → 结果：{id:42, name:"Bob", email:"a@x.com", age:30}   ← 只改 name，其他保留
```

- **PUT 的契约**：客户端必须提供**完整资源**，服务器用接收到的资源**整体替换**。漏传字段 = 服务器认为你要置空/默认。误用 PUT 做部分更新（漏传字段被清空）是高频 bug。
- **PATCH 的契约**：只传**变化的字段**，服务器合并。PATCH 的 body 格式有多种：①简单合并（JSON Merge Patch，RFC 7396）；②JSON Patch（RFC 6902，操作序列 `[{op:"replace",path:"/name",value:"Bob"}]`）；③自定义。
- **选型**：表单全量编辑用 PUT，单字段编辑用 PATCH。绝大多数「更新」场景用 PATCH 更合适（不要求客户端记住全字段）。

### 2.3 GET 绝不能改数据

GET 是**安全**的（无副作用）。违反这一点的代价：

- 爬虫/搜索引擎会预取 GET URL（误删数据）。
- 浏览器/CDN 会缓存 GET（同一 URL 返回缓存，副作用只触发一次）。
- 预检请求（preflight）、HTML 表单、`<img src>` 都发 GET（CSRF 攻击面）。

改数据的操作**必须**用 POST/PUT/PATCH/DELETE。

### 2.4 POST 的两种身份

- **对集合 POST = 新增**：`POST /users` 新增用户，服务器分配 id 和 URI，响应 **201 Created** + `Location: /users/43`。
- **对动作 POST = 触发**：`POST /orders/42/cancel` 触发取消（无新资源产生）。POST 是「catch-all」，无法归入其他动词的都用 POST。

## 三、状态码：用对而非全返回 200

### 3.1 常用状态码语义

| 码 | 含义 | 何时用 |
| --- | --- | --- |
| **200 OK** | 成功，有响应体 | GET / PATCH 成功 |
| **201 Created** | 创建成功 | POST 新增成功，**应带 Location 头** |
| **204 No Content** | 成功，无响应体 | DELETE / PUT 成功（无需返回内容） |
| **301 Moved Permanently** | 永久重定向 | 资源 URI 永久变更 |
| **304 Not Modified** | 缓存命中 | GET 带 `If-None-Match`，资源未变 |
| **400 Bad Request** | 请求格式错 | JSON 解析失败、缺必填字段、参数类型错 |
| **401 Unauthorized** | 未认证 | 没登录 / token 失效（实际是「Unauthenticated」） |
| **403 Forbidden** | 无权限 | 登录了但角色不够 |
| **404 Not Found** | 资源不存在 | URI 对应资源没找到 |
| **409 Conflict** | 冲突 | 唯一约束冲突、并发版本冲突 |
| **422 Unprocessable Entity** | 语义错 | 格式对但业务校验失败（邮箱已注册） |
| **500 Internal Server Error** | 服务器内部错 | 未捕获异常 |
| **502 Bad Gateway** | 网关错 | 上游服务挂了 |
| **503 Service Unavailable** | 暂不可用 | 维护中 / 过载 |

### 3.2 易混状态码

- **401 vs 403**：401 = **没认证**（你是谁？）→ 客户端要重新登录；403 = **认证了但没权限**（你是普通用户想删别人的资源）→ 客户端登录了也没用，要换账号。RFC 9110 已明确 401 是「Unauthenticated」语义。
- **400 vs 422**：400 = 请求**语法/格式**错（JSON 解析失败、缺必填字段）；422 = 格式对但**语义/业务**错（邮箱格式对但已被注册）。422 来自 WebDAV（RFC 4918），REST 圈广泛采纳做业务校验失败。
- **404 vs 410**：404 = 不知道有没有（通用「不存在」）；410 Gone = **曾经存在现在永久删除**（告诉客户端别再查，可清缓存）。日常多用 404。
- **200 vs 204**：有响应体用 200，无响应体用 204。DELETE 成功通常返回 204（删了就没内容可返回）。

### 3.3 反模式：全返回 200

```
HTTP/1.1 200 OK
{"error": "user not found", "code": 404}    ← 反模式：状态码骗人
```

把所有错误都返回 200 + 错误体，破坏了 HTTP 状态码语义：网关无法据状态码做重试/熔断、监控系统无法统计错误率、客户端无法用标准 HTTP 库判断成败。**永远用正确的 4xx/5xx**，错误详情放 body。

## 四、幂等性与 Idempotency-Key

### 4.1 动词的天然幂等性

| 动词 | 幂等 | 原因 |
| --- | --- | --- |
| GET | ✅ | 只读，重复读结果不变 |
| PUT | ✅ | 全量替换，重复设置同一值结果不变 |
| DELETE | ✅ | 删第一次资源没了，再删还是没了（可能返回 404 但状态一致） |
| POST | ❌ | 重复 POST 创建多个资源（重复支付扣多次款） |
| PATCH | ✅* | 取决于操作（`{op: replace}` 幂等，`{op: increment}` 不幂等） |

### 4.2 为什么幂等性是工程刚需

网络不可靠，客户端超时会**重试**。幂等操作可放心重试（GET 超时再 GET 一次没事）；非幂等操作（POST 支付）重试会**重复扣款**。

### 4.3 Idempotency-Key：给 POST 加幂等性

对非幂等操作（主要是 POST），用 **Idempotency-Key** 请求头防重复：

```
POST /payments
Idempotency-Key: 7a8b9c10-d1e2-...（客户端生成的唯一 UUID）
{"orderId": 42, "amount": 100}

# 第一次：服务器处理，记录 key=7a8b9c10 → 结果
# 网络超时，客户端用同一 key 重试
POST /payments
Idempotency-Key: 7a8b9c10-d1e2-...（同一 key）
{"orderId": 42, "amount": 100}

# 服务器发现 key 已存在 → 直接返回首次结果，不重复扣款
```

- **实现要点**：①客户端为每个「逻辑请求」生成唯一 key（通常 UUID）；②服务器把 key + 请求体摘要存起来（带 TTL，如 24 小时）；③相同 key 重试时，服务器比对请求体一致后返回首次结果；④请求体不同却用同 key = 逻辑错误，应拒绝（409）。
- **谁支持**：Stripe、GitHub、AWS、Square 等支付/计费 API 都支持 Idempotency-Key，是行业事实标准。
- **key 的生命周期**：通常设 TTL（如 24 小时或 7 天），过期清理。key 应存在 Redis 等共享存储（多实例共享）。

## 五、HATEOAS：严格 REST 的超媒体约束

**HATEOAS**（Hypermedia As The Engine Of Application State）：响应里**带后续可操作的链接**，客户端「跟着链接走」而无需硬编码 URL：

```json
GET /orders/42
{
  "id": 42,
  "status": "pending",
  "_links": {
    "self":   {"href": "/orders/42"},
    "pay":    {"href": "/orders/42/pay", "method": "POST"},
    "cancel": {"href": "/orders/42/cancel", "method": "POST"}
  }
}
```

- **理论价值**：服务器改 URI（`/cancel` → `/void`）客户端不用改代码（跟着链接走）；客户端无需预先知道所有端点（自发现）。
- **工程现实**：落地复杂、响应体膨胀、客户端库支持少。**绝大多数「REST API」不实现 HATEOAS**，只满足前 4 条约束——业界称之为 **PRREST（Pragmatic REST，务实 REST）** 或干脆「HTTP API」。理解 HATEOAS 是为了知道「严格 REST 长什么样」，而非强求实现。

## 交互演示

本叶无专门可视化，动词语义与状态码建议结合实际项目（如本站 quiz-backend 的 NestJS 控制器）对照学习。

## 下一步

讲完资源建模、动词、状态码、幂等性后，下一个工程主题是[分页、内容协商与错误处理](./pagination-and-errors)——offset/cursor/keyset 三种分页的取舍、内容协商机制、统一错误格式的设计。
