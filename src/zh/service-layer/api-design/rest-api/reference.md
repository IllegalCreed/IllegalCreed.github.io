---
layout: doc
outline: [2, 3]
---

# 参考：REST 动词、状态码、分页与易错点速查

> 基于 REST 架构风格 · HTTP/1.1 (RFC 9110) · 核于 2026-08

## 速查

- **REST 定义**：Roy Fielding 2000 提出的网络架构风格，基于 HTTP，资源 + 动词 + 状态码。
- **六大约束**：客户端-服务器分离、无状态、可缓存、统一接口、分层、按需代码（可选）。
- **资源 URI**：名词复数（`/users`），层级 ≤ 2 层，查询参数过滤。
- **动词语义**：GET（查询，幂等安全）、POST（新增/触发，不幂等）、PUT（全量替换，幂等）、PATCH（部分更新）、DELETE（移除，幂等）。
- **状态码**：2xx 成功、3xx 重定向、4xx 客户端错、5xx 服务端错。401 vs 403（认证 vs 授权），400 vs 422（格式 vs 语义）。
- **幂等性**：GET/PUT/DELETE 幂等，POST 不幂等；非幂等操作用 Idempotency-Key 防重。
- **分页**：offset（简单，深翻慢漂移）、cursor（稳定，不能跳页）、keyset（最优，需唯一排序键）。

## 一、HTTP 动词速查

| 动词 | CRUD | 幂等 | 安全 | 用途 | 成功响应 |
| --- | --- | --- | --- | --- | --- |
| GET | Read | ✅ | ✅ | 查询 | 200 + body |
| POST | Create | ❌ | ❌ | 新增 / 触发动作 | 201 + Location |
| PUT | Update | ✅ | ❌ | 全量替换 | 200 / 204 |
| PATCH | Update | ✅* | ❌ | 部分更新 | 200 + body |
| DELETE | Delete | ✅ | ❌ | 删除 | 204 |
| HEAD | - | ✅ | ✅ | 只取头（如检查资源存在） | 200（无 body） |
| OPTIONS | - | ✅ | ✅ | 查支持的动词（CORS 预检） | 200 + Allow 头 |

## 二、状态码速查

| 码 | 名称 | 用途 |
| --- | --- | --- |
| **200 OK** | 成功 | GET / PATCH 成功 |
| **201 Created** | 创建成功 | POST 新增，带 Location |
| **202 Accepted** | 已接收 | 异步任务已排队 |
| **204 No Content** | 无内容 | DELETE / PUT 成功 |
| **301 Moved Permanently** | 永久重定向 | URI 永久变更 |
| **304 Not Modified** | 未修改 | 缓存命中 |
| **400 Bad Request** | 请求格式错 | JSON 解析失败 / 缺必填 |
| **401 Unauthorized** | 未认证 | 没登录 / token 失效 |
| **403 Forbidden** | 无权限 | 登录了角色不够 |
| **404 Not Found** | 不存在 | 资源没找到 |
| **405 Method Not Allowed** | 方法不允许 | URI 对但动词错（GET 用成了 DELETE） |
| **409 Conflict** | 冲突 | 唯一约束 / 并发版本冲突 |
| **410 Gone** | 永久消失 | 曾存在已永久删除 |
| **422 Unprocessable Entity** | 语义错 | 业务校验失败 |
| **429 Too Many Requests** | 限流 | 配 Retry-After |
| **500 Internal Server Error** | 服务器错 | 未捕获异常 |
| **502 Bad Gateway** | 网关错 | 上游挂了 |
| **503 Service Unavailable** | 暂不可用 | 维护 / 过载 |

## 三、分页策略对比

| 策略 | 请求示例 | 深翻 | 漂移 | 跳页 | total | 适用 |
| --- | --- | --- | --- | --- | --- | --- |
| offset | `?page=3&pageSize=20` | 慢 | 有 | ✅ | ✅ | 后台/小数据 |
| cursor | `?cursor=abc&pageSize=20` | 快 | 无 | ❌ | ❌ | Feed/大数据 |
| keyset | `?afterId=42&pageSize=20` | 最快 | 无 | ❌ | ❌ | 按id排序 |

## 四、PUT vs PATCH 速查

| 维度 | PUT | PATCH |
| --- | --- | --- |
| 语义 | 全量替换 | 部分更新 |
| body | 完整资源 | 只传变化字段 |
| 漏传字段 | 被置空/默认 | 保留原值 |
| 幂等 | ✅ | 通常 ✅ |
| 表单全量编辑 | ✅ | - |
| 单字段编辑 | - | ✅ |

## 五、幂等性速查

| 动词 | 幂等 | 防重试方式 |
| --- | --- | --- |
| GET | ✅ | 天然可重试 |
| PUT | ✅ | 天然可重试 |
| DELETE | ✅ | 天然可重试（首次 204，后续可能 404） |
| POST | ❌ | **需 Idempotency-Key 头** |
| PATCH | ✅* | 取决于操作 |

## 六、易错点清单

- **「REST 就是 HTTP API」**：错。HTTP 是协议，REST 是基于 HTTP 的**架构风格**（六大约束）。`POST /createUser` 是 HTTP API 不是 REST（动词在 URL 里违反统一接口）。
- **「GET 可以用来创建资源」**：错。GET 必须安全（无副作用）。用 GET 改数据会被爬虫/预取/缓存误触发，导致数据被误改。
- **「PUT 和 PATCH 一样，都是更新」**：错。PUT 是**全量替换**（漏传字段被清空），PATCH 是**部分更新**（只改变化字段）。误用 PUT 做部分更新是高频 bug。
- **「创建成功返回 200 就行」**：不规范。应用 **201 Created** + `Location` 头指向新资源。
- **「401 和 403 一样」**：错。401 = 未认证（没登录），403 = 无权限（登录了但角色不够）。
- **「所有错误都返回 200 + error body」**：反模式。破坏 HTTP 状态码语义，网关/监控/客户端无法据状态码判断。应用正确的 4xx/5xx。
- **「offset 分页随便用」**：深翻慢（`LIMIT 100000,20` 扫 10 万行），且有数据漂移。大数据集/无限滚动用 cursor。
- **「DELETE 返回 200 + body」**：可以但不规范。DELETE 成功通常 **204 No Content**（删了就没内容返回）。
- **「幂等 = 重复请求返回相同结果」**：不严谨。幂等是**服务器状态**相同（DELETE 第二次返回 404 但状态一致，仍算幂等），不是响应字节相同。
- **「POST 一定不幂等」**：基本对，但 POST + Idempotency-Key 可实现应用层幂等（Stripe 支付）。

## 七、进阶方向（链接其他叶）

- [API 版本控制](../../api-versioning/) —— REST API 如何演进而不破坏客户端
- [OpenAPI 规范](../../openapi-spec/) —— 如何用规范描述 REST API 并生成文档/SDK
- [GraphQL API](../../graphql-api/) —— 解决 REST 的过度/不足获取问题

## 权威链接

- [RFC 9110 - HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)（状态码、动词、内容协商权威定义）
- [RFC 9457 - Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)（标准错误格式）
- [Fielding 的博士论文第五章](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)（REST 原始定义）
- [REST API Tutorial](https://restfulapi.net/)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- 本站幻灯片：<a href="/SlideStack/rest-api-slide/" target="_blank">REST API</a>
