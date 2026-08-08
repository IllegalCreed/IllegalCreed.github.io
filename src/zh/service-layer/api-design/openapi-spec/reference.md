---
layout: doc
outline: [2, 3]
---

# 参考：OpenAPI 结构、版本差异与易错点速查

> 基于 OpenAPI 规范 3.0/3.1/3.2 · 核于 2026-08

## 速查

- **OpenAPI 定义**：描述 RESTful API 的事实标准规范，前身 Swagger（2015 捐 Linux 基金会更名）。
- **Swagger vs OpenAPI**：Swagger = 工具集（Editor/UI/Codegen），OpenAPI = 规范。Swagger 2.0 = OpenAPI 2.0。
- **版本**：3.0（2017 重写）/ 3.1（2021 对齐 JSON Schema 2020-12）/ 3.2（2025 参数复用）。新项目选 3.1。
- **核心结构**：openapi / info / servers / paths / components / security / tags。
- **components 复用**：schemas/parameters/responses/securitySchemes 集中管理 + `$ref` 引用。
- **生态**：openapi-generator（代码生成）、Swagger UI/Redoc/Scalar（文档）、Prism（Mock）、Portman（contract 测试）。

## 一、顶层结构速查

| 字段 | 作用 |
| --- | --- |
| `openapi` | 规范版本（3.1.0） |
| `info` | 元信息（title/version/description/contact/license） |
| `servers` | 多环境 base URL |
| `paths` | 端点定义（path + method = operation） |
| `components` | 复用构件（schemas/parameters/responses/securitySchemes） |
| `security` | 全局认证（可被 operation 级覆盖） |
| `tags` | 操作分组（文档组织） |
| `externalDocs` | 外部文档链接 |
| `webhooks` | 3.1+ 服务器主动通知 |

## 二、components 构件速查

| 构件 | 作用 | `$ref` 示例 |
| --- | --- | --- |
| `schemas` | 数据模型 | `#/components/schemas/User` |
| `parameters` | 复用参数 | `#/components/parameters/PageParam` |
| `responses` | 复用响应 | `#/components/responses/NotFound` |
| `securitySchemes` | 认证方案 | `#/components/securitySchemes/bearerAuth` |
| `requestBodies` | 复用请求体 | `#/components/requestBodies/CreateUser` |
| `headers` | 复用响应头 | `#/components/headers/RateLimit` |
| `examples` | 复用示例 | `#/components/examples/UserSample` |
| `links` | 操作关联（HATEOAS） | `#/components/links/GetUserByOrderId` |
| `callbacks` | 回调（服务器→客户端） | `#/components/callbacks/OrderEvent` |

## 三、securitySchemes 类型速查

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| `http` | HTTP 认证（basic/bearer） | Bearer Token（JWT） |
| `apiKey` | API 密钥（header/query/cookie） | `X-API-Key` header |
| `oauth2` | OAuth 2.0（多种 flow） | authorizationCode flow |
| `openIdConnect` | OpenID Connect | OIDC 发现 URL |

## 四、版本差异速查

| 特性 | 3.0 | 3.1 | 3.2 |
| --- | --- | --- | --- |
| **可空字段** | `nullable: true` | `type: [type, null]` | 同 3.1 |
| **exclusiveMinimum** | 布尔 | 数值 | 同 3.1 |
| **JSON Schema 对齐** | 子集 | 2020-12 全兼容 | 进一步改进 |
| **webhooks** | 无 | 有 | 有 |
| **参数对象复用** | 有限 | 有限 | 增强 |
| **license** | name+url | + SPDX identifier | SPDX 表达式 |
| **建议** | 存量大 | 新项目首选 | 较新，工具跟进中 |

## 五、Schema 关键字速查

| 关键字 | 作用 |
| --- | --- |
| `type` | 类型（object/array/string/integer/number/boolean/null） |
| `properties` | 对象字段 |
| `required` | 必填字段数组 |
| `items` | 数组元素 schema |
| `$ref` | 引用其他 schema |
| `allOf` | 合并多个 schema（类似继承） |
| `anyOf` | 满足任一即可 |
| `oneOf` | 互斥多态（仅满足一个） |
| `enum` | 枚举值 |
| `format` | 格式（email/uri/uuid/date-time/int64） |
| `minimum/maximum` | 数值范围 |
| `minLength/maxLength` | 字符串长度 |
| `pattern` | 正则校验 |
| `readOnly` | 只在响应出现（如 id） |
| `writeOnly` | 只在请求出现（如密码） |

## 六、易错点清单

- **「Swagger 和 OpenAPI 是两个东西」**：是也不是。Swagger 现在指工具集（Swagger UI/Editor/Codegen），OpenAPI 指规范。Swagger 2.0 = OpenAPI 2.0（最后以 Swagger 命名的版本）。说「OpenAPI 规范」用 3.x。
- **「OpenAPI 只能描述 REST」**：基本对。OpenAPI 是为 RESTful HTTP API 设计的，不描述 GraphQL/gRPC/WebSocket（GraphQL 用 SDL，gRPC 用 proto，AsyncAPI 描述事件驱动）。描述非 REST API 用对应规范。
- **「nullable: true 在 3.1 还能用」**：错。3.1 废弃了 nullable，改用 `type: [string, null]`（JSON Schema 风格）。3.0 仍用 nullable。
- **「spec 写一次就不用改」**：错。API 演进时 spec 也要同步更新，否则文档与代码漂移。用 contract 测试或 codegen 强制一致。
- **「components 可有可无」**：理论上可选，但工程上强烈推荐——不用 components 会导致 schema/参数/响应在 paths 里重复定义，spec 冗长难维护。
- **「operationId 只是装饰」**：错。operationId 是 codegen 的关键（用作生成的方法名），必须全局唯一且语义清晰（`getUserById` 而非 `get1`）。
- **「design-first 一定比 code-first 好」**：不一定。design-first 契约驱动适合新项目/多团队，code-first 省事适合快速迭代/存量项目。按场景选。
- **「Swagger UI 是唯一文档工具」**：错。还有 Redoc（美观只读）、Scalar（新一代现代 UI）等，各有所长。链接到文档生成器章。
- **「3.2 是最新所以一定选 3.2」**：不一定。3.2 较新（2025），部分工具支持还在跟上。新项目稳妥选 3.1（生态成熟），3.0 是业界存量最大。
- **「OpenAPI spec 能描述所有业务规则」**：不能。OpenAPI 描述结构契约（字段/类型/约束），复杂业务规则（如「金额不能为负」「库存不足拒绝」）需额外文档或代码实现。

## 七、进阶方向（链接其他叶）

- [REST API](../../rest-api/) —— OpenAPI 描述的对象（REST API 的契约描述）
- [API 版本控制](../../api-versioning/) —— spec 里的 `deprecated: true` 标记废弃端点/字段
- [GraphQL API](../../graphql-api/) —— 对比 SDL（GraphQL 的契约）与 OpenAPI spec（REST 的契约）

## 权威链接

- [OpenAPI 官方规范](https://spec.openapis.org/oas/latest.html)
- [OpenAPI 官网](https://www.openapis.org/)
- [openapi-generator](https://openapi-generator.tech/)
- [Swagger 工具](https://swagger.io/tools/)
- [Redoc](https://redocly.com/redoc)
- [Scalar](https://github.com/scalar/scalar)
- [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/json-schema.html)
- [OpenAPI vs Swagger 区别](https://swagger.io/blog/api-strategy/difference-between-swagger-and-openapi/)
- 本站幻灯片：<a href="/SlideStack/openapi-spec-slide/" target="_blank">OpenAPI 规范</a>
