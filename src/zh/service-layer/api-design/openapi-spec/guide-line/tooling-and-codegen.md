---
layout: doc
outline: [2, 3]
---

# 工具链与代码生成

> 基于 OpenAPI 规范 3.0/3.1/3.2 · 核于 2026-08

## 速查

- **契约即文档**：一份 OpenAPI spec 同时驱动**文档生成**（Swagger UI/Redoc/Scalar）、**SDK 代码生成**（openapi-generator）、**Mock 服务**（Prism/Stoplight）、**测试**（contract 测试）、**网关配置**（Kong/APISIX 基于 spec）——单一真相源，消除文档与代码漂移。
- **openapi-generator**：最主流的代码生成工具（Swagger Codegen 的社区 fork，更活跃）。从 spec 生成多语言**客户端 SDK**（TypeScript/Python/Java/Go/Rust 等几十种）+ **服务端桩**（接口骨架，填业务逻辑）+ **文档**（AsciiDoc/Markdown）+ **配置**（Kong/Apisix）。支持 50+ 语言/框架。
- **design-first（设计优先）**：先写 spec（契约），再生成代码 + SDK，最后填业务。好处：契约驱动、前后端并行、spec 与代码强一致。适合新项目、多团队协作。缺点：手写 spec 繁琐。
- **code-first（代码优先）**：先写代码（用框架装饰器，如 NestJS `@ApiProperty`、Spring `@Operation`、FastAPI 自动生成），自动生成 spec。好处：省事、spec 跟代码同步。缺点：spec 表达力受限于注解、易产生「能生成但不优雅」的 spec。适合快速迭代。
- **文档工具**：**Swagger UI**（最老牌，交互式文档+在线调试）、**Redoc**（渲染美观，只读文档，适合对外发布）、**Scalar**（新一代，界面现代+性能好，2023+ 崛起）。这些都**渲染** spec 为人类可读文档，链接到前端开发工具·文档生成器章深入。本叶讲 spec 本身，渲染工具只做概览。
- **Mock 服务**：Prism（Stoplight）、Microcks 等，基于 spec 生成 Mock 服务——前端在后端没开发完时就能对接（返回 examples 里的样例数据），前后端并行开发。
- **contract 测试**：基于 spec 验证后端实现是否符合契约（每个响应的 schema、状态码、参数校验），防止代码与 spec 漂移。Portman/Dredd/Schemathesis 等工具。
- **网关集成**：Kong、APISIX、AWS API Gateway、Tyk 等网关支持导入 OpenAPI spec 自动配置路由、认证、限流——spec 驱动基础设施。

## 一、契约即文档：spec 驱动的生态

OpenAPI 的核心价值是**单一真相源**——一份 spec 驱动整个 API 生命周期：

```
                    ┌─ Swagger UI / Redoc / Scalar（文档生成）
                    ├─ openapi-generator（客户端 SDK + 服务端桩）
OpenAPI spec  ──────┤ Prism / Microcks（Mock 服务，前端并行开发）
（单一真相源）       ├─ Portman / Dredd / Schemathesis（contract 测试）
                    ├─ Kong / APISIX / API Gateway（网关配置）
                    └─ Postman / Insomnia（API 客户端导入）
```

- **文档与代码不再漂移**：spec 是唯一真相，所有工具从 spec 派生，改 spec 即同步所有下游。
- **前后端并行**：design-first 下，后端开发时前端用 spec 生成的 SDK + Mock 已能对接，无需等后端完成。
- **工业化 API 生态**：从开发、测试、文档、网关到监控，全链路基于 spec。

## 二、openapi-generator：代码生成主力

[openapi-generator](https://openapi-generator.tech/) 是 Swagger Codegen 的社区 fork（更活跃、修复更快），从 spec 生成多种产物：

```bash
# 生成 TypeScript 客户端 SDK
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./sdk

# 生成 Java Spring 服务端桩
openapi-generator-cli generate \
  -i openapi.yaml \
  -g spring \
  -o ./server-stub

# 生成 Python 客户端
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./python-sdk
```

### 2.1 生成产物类型

| 产物 | 用途 | 示例 generator |
| --- | --- | --- |
| **客户端 SDK** | 前端/第三方调用 API 的类型安全封装 | typescript-fetch、python、java、go、rust |
| **服务端桩** | 接口骨架，填业务逻辑 | spring、nodejs-server、python-flask |
| **文档** | 静态文档 | html、markdown、asciidoc |
| **Schema** | JSON Schema 校验文件 | json-schema |
| **配置** | 网关/API 工具配置 | kong、aws-api-gateway |

### 2.2 客户端 SDK 的价值

- **类型安全**：生成的 SDK 有完整 TypeScript 类型（基于 spec 的 schema），调用 `getUserById(42)` 返回类型化的 `User`，编译期校验。
- **封装 HTTP 细节**：SDK 封装了请求构造、认证、错误处理，前端无需手写 fetch/axios 调用。
- **自动同步**：spec 改了，重新生成 SDK，前端升级类型即可（破坏性变更编译期发现）。

### 2.3 服务端桩的价值

- **接口骨架**：生成 Controller/Handler 接口 + DTO 类 + 校验逻辑，开发者只需填业务逻辑（实现接口方法）。
- **契约一致性**：生成的接口签名、参数校验、响应格式严格匹配 spec，防止实现偏离契约。

## 三、design-first vs code-first

### 3.1 design-first（设计优先）

```
手写 spec（契约） → openapi-generator 生成 SDK + 服务端桩 → 填业务逻辑
                                              ↓
                                    前端用 SDK + Mock 并行开发
```

- **优点**：契约驱动（先想清楚再写）、前后端并行（前端用 SDK + Mock 不等后端）、spec 与代码强一致（从 spec 生成）。
- **缺点**：手写 spec 繁琐（几百行 YAML）、要求团队熟悉 OpenAPI。
- **适合**：新项目、多团队协作、对外发布的公共 API（spec 作为对外契约）。

### 3.2 code-first（代码优先）

```
写代码（框架装饰器/注解） → 自动扫描生成 spec → Swagger UI 渲染文档
```

框架支持：

| 框架 | 注解/装饰器 | 生成工具 |
| --- | --- | --- |
| NestJS（TS） | `@ApiProperty`、`@ApiOperation` | `@nestjs/swagger` |
| Spring Boot（Java） | `@Operation`、`@Schema` | springdoc-openapi |
| FastAPI（Python） | 自动从 Pydantic + 类型注解 | 内置 |
| Express + swagger-jsdoc | JSDoc 注释 | swagger-jsdoc |

- **优点**：省事（spec 永远跟代码同步）、上手快。
- **缺点**：spec 表达力受限于注解（复杂约束难表达）、易产生「能生成但不优雅」的 spec（如 operationId 不规范、schema 命名混乱）。
- **适合**：快速迭代的小项目、存量项目（已有代码，补生成 spec）。

### 3.3 选型与混合

- 业界趋势是 **design-first**（spec 作为单一真相源），但 code-first 在存量项目仍主流。
- **混合实践**：design-first 起步（先写 spec 定契约），代码实现后用 contract 测试验证与 spec 一致（防止漂移）。

## 四、文档工具概览（链接到文档生成器章）

OpenAPI spec 可被多种工具**渲染**为人类可读的交互文档：

| 工具 | 特点 | 适用 |
| --- | --- | --- |
| **Swagger UI** | 最老牌，交互式文档 + 在线调试（"Try it out"） | 开发调试、内部文档 |
| **Redoc** | 渲染美观，三栏布局，只读（无在线调试） | 对外发布的 API 文档 |
| **Scalar** | 新一代（2023+），界面现代、性能好、可定制主题 | 追求现代 UI 的项目 |
| **Stoplight Elements** | Stoplight 出品，文档 + 试玩 | 企业级文档 |

- 这些工具**渲染** spec 为文档（本叶概览），具体实现在**前端开发工具·文档生成器章**深入。
- 多数工具是纯前端（加载 spec JSON 渲染），可静态托管（如 GitHub Pages），零后端成本。

## 五、Mock 服务：前后端并行

基于 spec 的 Mock 服务让前端在后端没完成时就能对接：

- **Prism**（Stoplight）：`prism mock openapi.yaml` 启动 Mock 服务器，根据 spec 的 examples 返回样例数据。
- **Microcks**：开源 API Mock & 测试平台，支持 OpenAPI/AsyncAPI/gRPC。
- 工作流：后端写完 spec → 启动 Mock → 前端用 Mock + 生成的 SDK 开发 → 后端完成后切换到真实 API。

## 六、contract 测试：防止 spec 漂移

contract 测试验证后端实现是否符合 spec 契约：

- **Portman**：基于 spec 生成 Postman 测试集，验证每个响应的 schema、状态码、参数校验。
- **Dredd**：用 spec 定义的每个 operation 调用真实 API，验证响应符合 spec。
- **Schemathesis**：基于 spec 的属性测试（fuzz 输入，验证响应符合契约）。
- 价值：在 CI 里跑 contract 测试，代码改了不符合 spec 会立即失败，强制 spec 与代码一致。

## 七、网关集成

主流 API 网关支持导入 OpenAPI spec 自动配置：

- **Kong**：`decK` 工具从 spec 生成 Kong 配置（路由、插件、认证）。
- **APISIX**：支持从 OpenAPI 导入路由。
- **AWS API Gateway**：导入 spec 创建 API。
- 价值：spec 驱动基础设施——加端点改 spec，网关自动配置，无需手动配路由。

## 交互演示

本叶无专门可视化，工具链建议结合实际项目（用 openapi-generator 给一个示例 spec 生成 TS SDK，体验类型安全）体会。

## 下一步

OpenAPI 规范到此讲完。下一步可回到 [REST API](../../rest-api/)（OpenAPI 描述的对象）、[API 版本控制](../../api-versioning/)（spec 里的 `deprecated: true` 标记废弃）与 [GraphQL API](../../graphql-api/)（对比 SDL 与 OpenAPI spec 的契约描述差异）。
