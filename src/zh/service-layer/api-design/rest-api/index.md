---
layout: doc
---

# REST API

**REST（Representational State Transfer，表述性状态转移）** 是 Roy Fielding 在 2000 年博士论文中提出的**网络架构风格**——它不是协议，也不是标准，而是一组**约束与设计原则**。REST 基于 HTTP，把后端能力组织成一组**资源（Resource）**，每个资源有唯一的 URI（如 `/users/42`），客户端通过 HTTP 动词（GET/POST/PUT/PATCH/DELETE）对资源做操作，用**状态码**表达结果。理解 REST 的核心约束（客户端-服务器分离、无状态、统一接口、分层、可缓存）与工程实践（资源建模、动词语义、状态码、幂等性、分页、错误处理），是设计**可演进、可缓存、易消费** API 的基础——一个把所有操作都塞进 `POST /doStuff` 的「伪 REST」API 会丢失 HTTP 的所有优点（缓存、代理、幂等、自描述）。

REST API 的全部考点围绕**资源与动词**展开：①**资源建模**（把业务实体映射成 URI，名词复数、层级嵌套、关系链接）——回答「URL 怎么设计」；②**HTTP 动词语义**（GET 幂等查询、POST 新增、PUT 全量替换、PATCH 部分更新、DELETE 移除）——回答「操作怎么做」；③**状态码与错误**（2xx 成功、3xx 重定向、4xx 客户端错、5xx 服务端错，统一错误格式）——回答「结果怎么表达」；④**幂等性与分页**（Idempotency-Key 防重复提交、offset/cursor/keyset 分页策略）——回答「重试与大数据集怎么处理」。本叶是 API 设计章的**地基**，讲清 REST 的设计约束、动词语义、状态码、幂等性、分页与错误处理——后续 3 叶分别讲 GraphQL、版本控制、OpenAPI 规范。

## 评价

**优点**

- **基于 HTTP，零额外协议**：复用 HTTP 的缓存（Cache-Control）、代理、TLS、内容协商等成熟设施，无需新造轮子
- **统一接口，自描述**：动词 + URI + 状态码语义明确，GET 一定幂等无副作用，工具（curl/Postman/浏览器）开箱即用
- **无状态，水平可扩展**：每个请求自包含所有信息，服务器不保存会话状态，任意实例都能处理，天然适配负载均衡
- **生态成熟**：OpenAPI/Swagger 工具链、CDN 缓存、网关、SDK 代码生成全套支持，前后端通用

**缺点**

- **多 round-trip 与过度/不足获取**：聚合多个资源（如「用户+订单+评论」）要多次请求，或返回冗余字段——GraphQL 正是为此而生
- **多版本共存痛苦**：URL `/v1/` 还是 Header？旧字段何时删？没有官方版本机制，团队各自摸索
- **动词语义有边界**：复杂操作（「批准订单」「转账」）难映射成 CRUD，常退化成 `POST /orders/42/approve` 这类「RPC 化」端点
- **HTTP/1.1 文本协议开销**：相比 gRPC 的二进制 protobuf，REST 的 JSON 文本在大流量内部调用时体积与解析都更贵

## 本叶地图

- [入门](./getting-started) —— REST 定义、六大约束、资源建模、HTTP 动词语义、状态码、幂等性速览
- [REST 设计原则](./guide-line/design-principles) —— 资源建模细节、动词语义取舍、状态码分类、幂等性与 Idempotency-Key
- [分页、内容协商与错误处理](./guide-line/pagination-and-errors) —— offset/cursor/keyset 分页、内容协商、统一错误格式
- [参考](./reference) —— 动词速查、状态码速查、分页对比、易错点清单

## 幻灯片地址

<a href="/SlideStack/rest-api-slide/" target="_blank">REST API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=REST%20API" target="_blank" rel="noopener noreferrer">REST API 测试题</a>
