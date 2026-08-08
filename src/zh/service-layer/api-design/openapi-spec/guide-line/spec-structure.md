---
layout: doc
outline: [2, 3]
---

# Spec 结构详解：paths、components、security

> 基于 OpenAPI 规范 3.0/3.1/3.2 · 核于 2026-08

## 速查

- **顶层结构**：`openapi`（版本）→ `info`（元信息）→ `servers`（多环境 URL）→ `paths`（端点）→ `components`（复用构件）→ `security`（全局认证）→ `tags`（分组）。一份 spec 由这些顶层字段组织。
- **paths（端点定义）**：每个 path（`/users/{id}`）下的每个 method（get/post/put/delete）是一个 **operation**，含 `parameters`（路径/查询/头/cookie 参数）、`requestBody`（请求体）、`responses`（响应：状态码→内容）、`security`（覆盖全局认证）、`tags`（分组）、`operationId`（唯一标识，用于 codegen 命名方法）。
- **components（复用构件）**：把重复定义集中管理，含 `schemas`（数据模型）、`parameters`（参数）、`responses`（响应）、`securitySchemes`（认证方案）、`requestBodies`、`headers`、`examples`、`links`、`callbacks`。其他地方用 `$ref: '#/components/schemas/User'` 引用——消除冗余，单一真相源。
- **`$ref` 引用**：OpenAPI 用 JSON Reference（`$ref`）引用 components 里的命名构件，避免重复定义。`$ref` 路径以 `#/` 开头（指向当前文档），也可指向外部文档（`$ref: './common.yaml#/User'`）。
- **securitySchemes（认证方案）**：定义认证方式——`apiKey`（API 密钥，header/query/cookie）、`http`（Basic/Bearer 等）、`oauth2`（OAuth 2.0 flows）、`openIdConnect`。在 operation 或全局 `security` 字段引用。
- **3.0 → 3.1 关键差异**：①`nullable: true` 废弃，改用 `type: [string, null]`（JSON Schema 风格）；②`exclusiveMinimum`/`exclusiveMaximum` 从布尔改数值；③对齐 JSON Schema 2020-12（`unevaluatedProperties`、`if/then/else`）；④新增 `webhooks` 字段。
- **3.1 → 3.2 关键差异**：①参数对象（parameters）可在 operation 和 path 级别复用；②`info.license` 支持 SPDX 表达式；③JSON Schema 2020-12 进一步对齐；④文档工具集成改进（summary 给丰富描述）。
- **Schema 表达**：用 JSON Schema 子集描述数据模型——`type`（object/array/string/integer/number/boolean/null）、`properties`、`required`、`items`（数组元素）、`$ref`（引用）、`allOf/anyOf/oneOf`（组合）、`enum`、`format`（email/uri/date-time）、`minimum/maximum`、`pattern`（正则）。

## 一、info 与 servers：元信息与多环境

```yaml
info:
  title: 用户服务 API
  version: 1.0.0
  description: |
    管理用户、订单、权限的 RESTful API。
    [详细文档](https://docs.example.com)
  contact:
    name: API Support
    email: api@example.com
  license:
    name: MIT
    identifier: MIT        # 3.1+ 用 SPDX 标识符

servers:                   # 多环境 base URL
  - url: https://api.example.com/v1
    description: 生产环境
  - url: https://staging.api.example.com/v1
    description: 预发环境
  - url: https://{host}/v1  # 模板变量
    variables:
      host:
        default: localhost:3000
        description: 本地开发
```

- `info`：API 的元信息（标题、版本、描述、联系方式、许可证）。文档工具在首页展示。
- `servers`：3.0+ 替代了 Swagger 2.0 的 `host`/`basePath`/`schemes`，支持多环境（用户在文档里切换），支持模板变量。

## 二、paths：端点定义（核心）

```yaml
paths:
  /users/{id}:               # path 模板，{id} 是路径参数
    get:                     # HTTP method
      operationId: getUserById    # 唯一标识，codegen 用作方法名
      summary: 获取用户           # 简短描述（文档列表显示）
      description: 根据 id 获取用户的完整信息。  # 详细描述
      tags: [用户]                # 分组（文档按 tag 组织）
      parameters:                 # 参数（path/query/header/cookie）
        - name: id
          in: path
          required: true
          schema: { type: integer, minimum: 1 }
          description: 用户 ID
        - $ref: '#/components/parameters/FieldsParam'   # 引用复用参数
      responses:                  # 响应（必须有，至少一个状态码）
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
              examples:
                sample:
                  value: { id: 42, name: "Alice" }
        '404':
          description: 用户不存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '429':
          $ref: '#/components/responses/RateLimited'   # 引用复用响应
      security:                   # 覆盖全局认证
        - bearerAuth: []
    delete:
      operationId: deleteUser
      responses:
        '204': { description: 删除成功 }
    parameters:                   # path 级参数（应用于所有 method）
      - $ref: '#/components/parameters/IdInPath'
```

- **operation**：path + method 的组合是一个操作，每个操作有 operationId（全局唯一，codegen 关键）、parameters、requestBody（post/put/patch）、responses（必填）。
- **parameters 的 `in`**：`path`（路径参数 `/users/{id}`）、`query`（查询参数 `?role=admin`）、`header`（请求头）、`cookie`（Cookie）。
- **responses**：必须定义至少一个响应（通常 200/201 + 错误状态码）。每个响应含 `description`（必填）和 `content`（可选，描述响应体格式与 schema）。
- **path 级 parameters**：定义在 path 下（不在具体 method 内），应用于该 path 的所有 method——适合公共参数（如 `{id}` 路径参数）。

## 三、components：复用构件（关键）

```yaml
components:
  schemas:                # 数据模型（最常复用）
    User:
      type: object
      required: [id, name]
      properties:
        id: { type: integer, format: int64, readOnly: true }   # readOnly: 只在响应出现
        name: { type: string, minLength: 1 }
        email: { type: string, format: email }
        role: { $ref: '#/components/schemas/Role' }            # 引用其他 schema
        createdAt: { type: string, format: date-time, readOnly: true }
    Role:
      type: string
      enum: [ADMIN, USER, GUEST]
    Error:
      type: object
      required: [code, message]
      properties:
        code: { type: string }
        message: { type: string }

  parameters:             # 复用参数
    FieldsParam:
      name: fields
      in: query
      schema: { type: string }
      description: 按需取字段（逗号分隔）
    PageParam:
      name: page
      in: query
      schema: { type: integer, minimum: 1, default: 1 }

  responses:              # 复用响应
    RateLimited:
      description: 请求过多
      headers:
        Retry-After:
          schema: { type: integer }

  securitySchemes:        # 认证方案
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
```

- **`$ref` 引用**：`$ref: '#/components/schemas/User'` 引用 components 里的命名构件，`#/` 表示当前文档根。这让 User schema 定义一次，被多处引用（get 响应、post 请求体、list 响应的 items），消除冗余。
- **readOnly / writeOnly**：`readOnly: true` 字段只在响应出现（如 id、createdAt，客户端不传）；`writeOnly: true` 只在请求出现（如密码，不返回）。这让同一 schema 同时描述请求和响应。
- **securitySchemes**：定义认证方式，在 operation 的 `security` 字段或全局 `security` 引用。

## 四、securitySchemes：认证方案

```yaml
components:
  securitySchemes:
    bearerAuth:           # Bearer Token（JWT 常用）
      type: http
      scheme: bearer
      bearerFormat: JWT
    basicAuth:            # HTTP Basic
      type: http
      scheme: basic
    apiKey:               # API Key（header/query/cookie）
      type: apiKey
      in: header
      name: X-API-Key
    oauth2:               # OAuth 2.0
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://example.com/oauth/authorize
          tokenUrl: https://example.com/oauth/token
          scopes:
            read: 读权限
            write: 写权限

security:                 # 全局应用认证（所有操作默认需要）
  - bearerAuth: []
```

- 认证方案在 components.securitySchemes 定义，在 operation 的 `security` 字段或全局 `security` 字段引用。
- 全局 `security` 可被 operation 级 `security` 覆盖（如某些公开端点用 `security: []` 表示无需认证）。

## 五、3.0 → 3.1 → 3.2 关键差异

### 5.1 3.0 → 3.1（对齐 JSON Schema 2020-12）

```yaml
# 3.0 写法（已废弃）
email:
  type: string
  nullable: true          # ← 3.1 废弃

# 3.1 写法（JSON Schema 风格）
email:
  type: [string, null]    # ← type 数组表达可空

# 3.0
age:
  type: integer
  exclusiveMinimum: true  # ← 布尔（3.1 改了）
  minimum: 0

# 3.1
age:
  type: integer
  exclusiveMinimum: 0     # ← 数值（JSON Schema 2020-12）

# 3.1 新增 webhooks（与 callbacks 互补，服务器主动通知）
webhooks:
  orderEvent:
    post:
      requestBody: ...
```

### 5.2 3.1 → 3.2（参数复用 + license 升级）

- 参数对象（parameters）可在 operation 和 path 级别更灵活复用。
- `info.license` 支持 SPDX 表达式（`identifier: MIT` 而非 `name: MIT License` + URL）。
- JSON Schema 2020-12 进一步对齐（更多关键字支持）。

## 六、Schema 表达（JSON Schema 子集）

```yaml
components:
  schemas:
    CreateUserRequest:
      type: object
      required: [name, email]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: 用户名
        email:
          type: string
          format: email       # 格式校验（email/uri/uuid/date-time）
          pattern: '^[^@]+@[^@]+\.[^@]+$'   # 正则
        age:
          type: integer
          minimum: 0
          maximum: 150
          exclusiveMaximum: false    # 3.0；3.1 改数值
        role:
          type: string
          enum: [ADMIN, USER, GUEST]   # 枚举
        tags:
          type: array
          items: { type: string }      # 数组元素 schema
          minItems: 1
          uniqueItems: true
        address:
          $ref: '#/components/schemas/Address'   # 引用
      additionalProperties: false      # 3.0：禁止额外字段；3.1 用 unevaluatedProperties

    ValidationError:
      allOf:                           # 组合（allOf 合并/anyOf 任一/oneOf 互斥）
        - $ref: '#/components/schemas/Error'
        - type: object
          properties:
            errors:
              type: array
              items: { $ref: '#/components/schemas/FieldError' }
```

- OpenAPI schema 是 JSON Schema 的子集（3.1 起更接近全集），表达数据模型的类型、约束、组合、引用。
- **组合关键字**：`allOf`（合并多个 schema，类似继承）、`anyOf`（满足任一即可）、`oneOf`（必须满足且仅满足一个，互斥多态）、`not`（不满足）。

## 交互演示

本叶无专门可视化，spec 结构建议结合实际项目（用 Swagger Editor 加载一份 spec 实时查看渲染效果）体会。

## 下一步

讲完 spec 结构后，下一个主题是 [工具链与代码生成](./tooling-and-codegen)——openapi-generator 生成多语言 SDK/服务端桩、design-first vs code-first 实践、文档工具生态（Swagger UI/Redoc/Scalar 链接到文档生成器章）。
