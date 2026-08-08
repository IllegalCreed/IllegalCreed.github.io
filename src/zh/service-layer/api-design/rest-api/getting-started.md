---
layout: doc
outline: [2, 3]
---

# 入门：REST 定义、资源建模与动词语义

> 基于 REST 架构风格（Roy Fielding 2000）· HTTP/1.1 (RFC 9110) · 核于 2026-08

## 速查

- **REST 是什么**：**表述性状态转移（Representational State Transfer）**——Roy Fielding 在 2000 年博士论文提出的**网络架构风格**，不是协议也不是标准，而是一组**约束**。它基于 HTTP，把后端能力组织成**资源**，用 URI 标识、用动词操作、用状态码表达结果。
- **六大约束**：①**客户端-服务器分离**（UI 与数据解耦，各自演进）；②**无状态**（每个请求自包含，服务器不存会话，水平扩展友好）；③**可缓存**（响应声明 Cache-Control，减少后续请求）；④**统一接口**（资源 URI + 动词 + 自描述消息 + HATEOAS）；⑤**分层系统**（客户端不知是否经过代理/网关/负载均衡）；⑥**按需代码**（可选，服务器返回可执行代码如 JS，少见）。违反前五条之一就不算「严格 REST」。
- **资源（Resource）**：任何可命名的业务实体（用户/订单/文章），URI 用**名词复数**：`/users`、`/users/42`、`/users/42/orders`。**资源是名词，动词在 HTTP method 里**——这是 REST 与 RPC 的根本分野。
- **HTTP 动词语义**：`GET`（幂等安全，查询）、`POST`（非幂等，新增/触发）、`PUT`（幂等，全量替换，客户端指定 URI）、`PATCH`（幂等，部分更新）、`DELETE`（幂等，移除）。
- **幂等性（Idempotent）**：**同一请求执行 N 次，结果与执行 1 次相同**——GET/PUT/DELETE 天然幂等，POST 不幂等。对非幂等操作（如支付）用 **Idempotency-Key** 头防网络重试导致的重复。
- **状态码五类**：**2xx 成功**（200 OK / 201 Created / 204 No Content）、**3xx 重定向**（301 / 304 Not Modified）、**4xx 客户端错**（400 / 401 / 403 / 404 / 409 / 422）、**5xx 服务端错**（500 / 502 / 503）。
- **无状态**：服务器**不保存客户端会话状态**，每个请求必须携带全部信息（认证 token、参数）——这是 REST 水平扩展的基础（任意实例都能处理任意请求）。
- **HATEOAS**（Hypermedia As The Engine Of Application State）：响应里带后续可操作链接（如订单响应附 `pay` / `cancel` 链接），让客户端「跟着链接走」而无需硬编码 URL——严格 REST 的要求，实际工程很少完整实现。
- **进阶顺序**：[REST 设计原则](./guide-line/design-principles) → [分页、内容协商与错误处理](./guide-line/pagination-and-errors) → [参考](./reference)。

## 一、REST 是什么：架构风格而非协议

REST（Representational State Transfer）是 Roy Fielding 在 2000 年博士论文《Architectural Styles and the Design of Network-based Software Architectures》第五章提出的**网络架构风格（architectural style）**。关键点：REST **不是协议**（HTTP 才是）、**不是标准**（没有 RFC 规定 URL 怎么写）、**不是工具**——它是一组**设计约束**，告诉你「用 HTTP 设计 API 时，怎样设计才能获得可扩展、可缓存、可演进的系统」。

很多团队口中的「REST API」其实只是「HTTP API」——用了 HTTP 但没遵循 REST 约束（如把所有操作塞进 `POST /api?action=createUser`，这就是 RPC 风格，不是 REST）。区分二者是理解 REST 的第一步。

一句话：**REST 是借用 HTTP 已有语义（动词、状态码、头、缓存）来组织 API 的一组设计原则，目标是让 API 像万维网一样可扩展、可缓存、自描述。**

## 二、六大约束：REST 的「身份证」

满足这六条约束才算严格 REST（最后一条可选）：

| 约束 | 含义 | 收益 |
| --- | --- | --- |
| **客户端-服务器分离** | UI（客户端）与数据存储（服务器）独立演进 | 简化服务器、多端复用、各自移植 |
| **无状态** | 服务器不保存客户端会话，每个请求自包含 | 可见性、可靠性、水平扩展（任意实例处理） |
| **可缓存** | 响应声明是否可缓存（Cache-Control） | 减少延迟、降低服务器负载、减少网络流量 |
| **统一接口** | 资源 URI + 动词 + 自描述消息 + HATEOAS | 解耦、独立演进、可见性（REST 最核心特征） |
| **分层系统** | 客户端看不到中间的代理/网关/负载均衡 | 中间层可加缓存/安全/负载均衡，对客户端透明 |
| **按需代码**（可选） | 服务器可返回可执行代码（如 JS）给客户端 | 扩展客户端能力，实际工程罕见 |

- **「无状态」是最常被违反的**：用 session cookie 在服务器存登录态的 API 是**有状态**的——同一用户的不同请求必须落到同一实例（sticky session），破坏了水平扩展。REST 偏好**无状态 token**（JWT/ bearer token 自包含认证信息）。
- **「统一接口」是 REST 的灵魂**：所有资源遵循同一套操作语义（GET/POST/PUT/DELETE），客户端学一次就能操作所有资源——这是 REST 与「每个端点语义各异」的 SOAP/RPC 的根本区别。

## 三、资源建模：URL 用名词，动词在 HTTP method

REST 的核心是**资源（Resource）**——任何可命名的业务实体。资源 URI 的设计原则：

```
✅ 名词复数，层级表达关系
GET    /users              列表
GET    /users/42           单个
POST   /users              新增
PUT    /users/42           全量替换（客户端指定 id=42）
PATCH  /users/42           部分更新
DELETE /users/42           删除
GET    /users/42/orders    子资源（用户 42 的订单）

❌ 反模式：把动词塞进 URL（这是 RPC，不是 REST）
POST   /createUser
GET    /getUserById?id=42
POST   /orders/cancel/42
```

- **名词复数**：`/users` 不是 `/user` 或 `/getUsers`。复数表达「集合」，单数靠 id 区分。
- **层级表达从属**：`/users/42/orders` 表示「用户 42 的订单」——但**避免超过 2 层嵌套**（`/users/42/orders/7/items/3/skus` 太深，改用 `/orders/7/items`）。
- **难映射成 CRUD 的操作**：业务里常有「批准订单」「转账」「激活账户」这类动词操作。两种处理：①**子资源动作**（`POST /orders/42/cancel`，务实派）；②**状态字段更新**（`PATCH /orders/42 {status: "cancelled"}`，纯粹派）。前者是工程现实，后者更 RESTful——团队需权衡。
- **查询参数用于过滤/排序/分页**：`GET /users?role=admin&sort=-created&page=2`，不放在 path 里。

## 四、HTTP 动词语义：CRUD 的对应

HTTP 动词（method）表达「对资源做什么」，与 CRUD（Create/Read/Update/Delete）对应：

| 动词 | CRUD | 幂等 | 安全 | 典型用途 | 示例 |
| --- | --- | --- | --- | --- | --- |
| **GET** | Read | ✅ | ✅ | 查询，无副作用 | `GET /users/42` |
| **POST** | Create | ❌ | ❌ | 新增（服务器分配 id）/触发动作 | `POST /users` |
| **PUT** | Update | ✅ | ❌ | **全量**替换（客户端提供完整资源） | `PUT /users/42` |
| **PATCH** | Update | ✅* | ❌ | **部分**更新（只传改的字段） | `PATCH /users/42 {email}` |
| **DELETE** | Delete | ✅ | ❌ | 移除资源 | `DELETE /users/42` |

- **安全（Safe）**：不改变服务器状态（只读）。GET 必须安全（所以绝不能用 GET 改数据——会触发爬虫/预取/缓存误改）。
- **幂等（Idempotent）**：重复执行结果不变。GET/PUT/DELETE 幂等；POST 不幂等（重复 POST 创建两条）；PATCH 通常幂等但取决于实现（`{op: increment}` 不幂等）。
- **PUT vs PATCH 关键区别**：PUT 要求**客户端提供完整资源**（没传的字段被置空/默认）；PATCH 只**传变化的字段**。误用 PUT 做部分更新（漏传字段被清空）是常见 bug。
- **POST 的两种含义**：①对集合 `POST /users` = 新增（服务器分配 URI）；②对动作 `POST /orders/42/cancel` = 触发操作。POST 是「catch-all」，无法用其他动词表达的都用 POST。

## 五、状态码：用 HTTP 自带的语义

状态码是 HTTP 表达请求结果的**标准语言**，分五类：

| 类别 | 含义 | 常见 |
| --- | --- | --- |
| **2xx 成功** | 请求被正确处理 | 200 OK、201 Created、204 No Content |
| **3xx 重定向** | 需进一步动作 | 301 Moved、304 Not Modified（缓存命中） |
| **4xx 客户端错** | 客户端请求有问题 | 400 Bad Request、401 Unauthorized、403 Forbidden、404 Not Found、409 Conflict、422 Unprocessable |
| **5xx 服务端错** | 服务器内部故障 | 500 Internal、502 Bad Gateway、503 Unavailable |

- **常见误区**：「创建成功返回 200」也能跑，但**201 Created** 更准确（还应带 `Location` 头指向新资源 URI）；「删除成功」用 **204 No Content**（无响应体）比 200 更贴切。
- **401 vs 403**：**401 Unauthorized** = 没认证（你是谁？请登录）；**403 Forbidden** = 认证了但没权限（你是 admin 但想删别人的资源）。两者常被混用。
- **400 vs 422**：**400 Bad Request** = 请求格式错（JSON 解析失败、缺必填字段）；**422 Unprocessable Entity** = 格式对但语义错（邮箱格式对但已被注册）。422 来自 WebDAV（RFC 4918），REST 圈广泛采纳。
- **别滥用 200**：把所有错误都返回 200 + `{error: ...}` 是反模式——破坏了 HTTP 状态码语义，让网关/监控/客户端无法据状态码判断成败。

## 六、幂等性：为什么 GET/PUT/DELETE 可重试

**幂等（Idempotent）**：同一请求执行 1 次与 N 次，服务器状态相同。

```
PUT /users/42 {name: "Alice"}    ← 发 100 次结果都一样（最终 name=Alice）
POST /users {name: "Bob"}        ← 发 100 次创建 100 个 Bob（不幂等！）
```

- **为什么幂等很重要**：网络不可靠，客户端会**重试**（超时、连接断开）。幂等操作可放心重试；非幂等操作（POST 支付）重试会导致重复扣款。
- **Idempotency-Key 头**：为非幂等操作（主要是 POST）防重复的标准做法——客户端为每个「逻辑请求」生成唯一 key，服务器记录 key 与结果，相同 key 重试直接返回首次结果。Stripe、GitHub、AWS 都支持。详见 [REST 设计原则](./guide-line/design-principles)。

## 下一步

理解了 REST 的总览后，下一步深入两个工程主题——[REST 设计原则](./guide-line/design-principles)（资源建模细节、动词语义取舍、状态码分类、幂等性实现）与[分页、内容协商与错误处理](./guide-line/pagination-and-errors)（offset/cursor/keyset 分页、内容协商、统一错误格式）。
