---
layout: doc
outline: [2, 3]
---

# 入门：OpenAPI 定义、演进与核心结构

> 基于 OpenAPI 规范 3.0/3.1/3.2 · 核于 2026-08

## 速查

- **OpenAPI 是什么**：描述 RESTful API 的**事实标准**规范（OAS，OpenAPI Specification）。一份机器可读文档（YAML/JSON），精确定义 API 的端点、参数、响应、认证、错误。前身是 **Swagger**（2011 Wordnik 创建，后被 SmartBear 接手），2015 年捐给 Linux 基金会 + OpenAPI Initiative，更名为 OpenAPI。**Swagger 现在指工具集（Swagger Editor/UI/Codegen），OpenAPI 指规范本身**。
- **Swagger vs OpenAPI 的关系**：Swagger 2.0 = OpenAPI 2.0（最后一个以 Swagger 命名的版本）；OpenAPI 3.0+ 是新名。Swagger 工具集（Swagger Editor/UI/Codegen）仍在，支持 OpenAPI 规范。说「OpenAPI 规范」用 3.x，说「Swagger 工具」指具体工具。
- **版本演进**：**Swagger 2.0**（2014，基础结构）→ **OpenAPI 3.0**（2017，重写结构、引入 components 复用、RequestBody、更好的 links/callbacks）→ **OpenAPI 3.1**（2021，对齐 JSON Schema 2020-12，nullable 废弃改用 type 数组、webhooks）→ **OpenAPI 3.2**（2025，参数对象复用、license 升级、JSON Schema 改进）。
- **spec 核心结构**：`openapi`（版本）、`info`（元信息：标题/版本/描述）、`servers`（服务器 URL）、`paths`（端点：每个 path + method 描述操作）、`components`（可复用构件：schemas/parameters/responses/securitySchemes）、`security`（全局认证）、`tags`（分组）、`externalDocs`（外部文档）。
- **components 复用**：把重复的定义（schema/参数/响应/认证方案）放 components 里命名，其他地方用 `$ref` 引用——消除冗余，单一真相源。这是 OpenAPI 3.0+ 的关键改进。
- **契约即文档**：一份 spec 同时驱动**文档生成**（Swagger UI/Redoc/Scalar）、**SDK 代码生成**（openapi-generator）、**Mock 服务**（Prism）、**测试**（.contract 测试）、**网关配置**——单一真相源，消除文档与代码漂移。
- **design-first vs code-first**：①design-first——先写 spec 再写代码（契约驱动，前后端并行，推荐新项目）；②code-first——先写代码用注解生成 spec（如 NestJS/Spring 的装饰器），省事但易漂移。
- **进阶顺序**：[Spec 结构详解](./guide-line/spec-structure) → [工具链与代码生成](./guide-line/tooling-and-codegen) → [参考](./reference)。

## 一、OpenAPI 是什么：API 的机器可读契约

OpenAPI 规范（OAS）是描述 RESTful API 的**标准格式**——一份 YAML 或 JSON 文档，精确、机器可读地定义 API 的全部细节：

```yaml
openapi: 3.1.0
info:
  title: 用户服务 API
  version: 1.0.0
paths:
  /users/{id}:
    get:
      summary: 获取用户
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: 用户不存在
components:
  schemas:
    User:
      type: object
      required: [id, name]
      properties:
        id: { type: integer }
        name: { type: string }
        email: { type: string, format: email }
```

- **机器可读**：工具能解析这份 spec，自动生成文档、SDK、Mock、测试。
- **人类可读**：YAML 格式清晰，开发者也能直接读。
- **单一真相源**：API 的全部契约集中在这份 spec，不再有「文档说一套代码做一套」的漂移。

一句话：**OpenAPI 是 RESTful API 的标准契约格式，一份 spec 驱动文档、SDK、Mock、测试、网关——API 工业化的基础。**

## 二、Swagger 与 OpenAPI 的关系

很多开发者混淆 Swagger 和 OpenAPI，理清关系：

- **2011 年**：Wordnik 创建 **Swagger**——一套 API 描述规范 + 工具（Swagger Editor/UI/Codegen）。
- **2014 年**：Swagger 2.0 发布，成为事实标准。SmartBear 接手。
- **2015 年**：Swagger 规范捐给 **Linux 基金会** + 成立 **OpenAPI Initiative**，规范更名为 **OpenAPI**。Swagger 2.0 = OpenAPI 2.0（最后一个 Swagger 命名的版本）。
- **2017 年**：OpenAPI 3.0 发布（基于 Swagger 2.0 重写，结构更现代）。
- **2021 年**：OpenAPI 3.1 发布（对齐 JSON Schema 2020-12）。
- **2025 年**：OpenAPI 3.2 发布。

**当前命名约定**：
- **OpenAPI 规范** = 规范本身（用 OpenAPI 3.x）。
- **Swagger** = 工具集（Swagger Editor、Swagger UI、Swagger Codegen）——这些工具现在支持 OpenAPI 规范（3.x），不只支持旧的 Swagger 2.0。
- 说「写一份 OpenAPI 文档」用 OpenAPI 3.x；说「用 Swagger UI 渲染」指具体工具。

## 三、版本演进：3.0 → 3.1 → 3.2

| 版本 | 年份 | 关键变化 |
| --- | --- | --- |
| **Swagger 2.0** | 2014 | 基础结构（basePath/host/definitions），最后一个 Swagger 命名版 |
| **OpenAPI 3.0** | 2017 | 重写结构：servers 替代 host/basePath、components 替代 definitions、RequestBody 独立、links/callbacks、更好的 content 协商 |
| **OpenAPI 3.1** | 2021 | 对齐 JSON Schema 2020-12（type 可数组、exclusiveMinimum 是数值、废弃 nullable 改 type:[type,"null"]）、webhooks、license 表达式 |
| **OpenAPI 3.2** | 2025 | 参数对象复用（parameter reuse）、license 升级、JSON Schema 2020-12 进一步对齐、文档工具集成改进 |

- **3.0 的关键改进**：`components` 让复用更优雅（schema/参数/响应/认证方案集中管理 + `$ref` 引用）；`RequestBody` 独立于 parameters（更清晰）；`servers` 支持多环境（dev/staging/prod）；`links` 表达操作间关联（HATEOAS 风格）。
- **3.1 的关键改进**：对齐 JSON Schema 2020-12——`type` 可以是数组（`type: [string, null]` 替代废弃的 `nullable: true`）、`exclusiveMinimum` 是数值不是布尔、新增 `unevaluatedProperties`。这让 OpenAPI schema 与标准 JSON Schema 工具兼容。新增 `webhooks`（与 callbacks 互补）。
- **3.2 的关键改进**：参数对象可在多处复用（减少冗余）、license spec 升级（SPDX 表达式）、JSON Schema 对齐持续改进。
- **选型**：新项目用 **3.1**（JSON Schema 兼容、生态成熟）；3.2 较新（2025），工具支持还在跟上；3.0 仍是业界存量最大版本（兼容性最好）；Swagger 2.0 遗留系统才用，新项目别选。

## 四、核心结构概览

一份 OpenAPI 文档的顶层结构：

| 字段 | 作用 | 示例 |
| --- | --- | --- |
| `openapi` | 规范版本 | `3.1.0` |
| `info` | API 元信息 | title/version/description/contact/license |
| `servers` | 服务器 URL（多环境） | dev/staging/prod 的 base URL |
| `paths` | **端点定义**（核心） | 每个 path + HTTP method 描述一个操作 |
| `components` | **可复用构件** | schemas/parameters/responses/securitySchemes/examples |
| `security` | 全局认证 | 哪些认证方案应用于所有操作 |
| `tags` | 操作分组 | 用于文档分组显示 |
| `externalDocs` | 外部文档链接 | 指向更详细的文档 |

- **paths 是核心**：每个 URL path（如 `/users/{id}`）下的每个 HTTP method（get/post/put/delete）描述一个操作（operation），含参数、请求体、响应、认证。
- **components 是复用关键**：把重复的定义（如 `User` schema 被多个端点引用）放 components 命名，其他地方用 `$ref: '#/components/schemas/User'` 引用。这是减少冗余的核心机制，详见 [Spec 结构详解](./guide-line/spec-structure)。

## 五、design-first vs code-first

两种工作流：

- **design-first（设计优先）**：先手写 spec（契约），再用 openapi-generator 生成服务端桩代码 + 前端 SDK，最后填业务逻辑。好处：契约驱动、前后端并行、spec 与代码强一致。适合新项目、多团队协作。
- **code-first（代码优先）**：先写代码（用框架装饰器/注解，如 NestJS 的 `@ApiProperty`、Spring 的 `@Operation`），自动生成 spec。好处：省事、spec 永远跟代码同步。缺点：spec 表达力受限于注解，且易产生「能生成但不优雅」的 spec。适合快速迭代的小项目。

业界趋势是 **design-first**（spec 作为单一真相源），但 code-first 在存量项目仍主流。

## 下一步

理解了 OpenAPI 的定义、演进、核心结构后，下一步深入——[Spec 结构详解](./guide-line/spec-structure)（paths/components/security/tags 的组织细节、3.1/3.2 新特性）与[工具链与代码生成](./guide-line/tooling-and-codegen)（openapi-generator、design-first 实践、文档工具生态）。
