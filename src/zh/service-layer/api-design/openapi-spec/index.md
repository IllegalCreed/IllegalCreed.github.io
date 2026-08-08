---
layout: doc
---

# OpenAPI 规范

**OpenAPI 规范（OpenAPI Specification，OAS）** 是描述 RESTful API 的**事实标准**——一份机器可读的文档（YAML 或 JSON），精确定义 API 有哪些端点、每个端点接收什么参数、返回什么数据结构、如何认证、可能抛出哪些错误。它源自 Swagger（2011 年 Wordnik 创建，后被 SmartBear 接手），2015 年捐给 Linux 基金会后更名为 OpenAPI。理解 OpenAPI 的核心价值——**契约即文档**（一份 spec 同时驱动文档生成、SDK 代码生成、Mock 服务、测试、网关配置、监控）——是构建**工业化 API 生态**的基础。OpenAPI 经历了 Swagger 2.0 → OpenAPI 3.0 → 3.1（对齐 JSON Schema 2020-12）→ 3.2（2025）的演进，每一版都强化了表达力（3.0 的 components 复用、3.1 的 JSON Schema 全兼容、3.2 的参数对象复用与 webhooks 改进）。本叶讲规范本身——Swagger UI/Redoc/Scalar 等**渲染工具**在前端开发工具·文档生成器章展开，openapi-generator 等**代码生成**工具的工程实践在本叶覆盖。

OpenAPI 规范的全部考点围绕**结构与生态**展开：①**规范演进**（Swagger 2.0 → OpenAPI 3.0/3.1/3.2 的关键差异）——回答「规范版本怎么选」；②**spec 结构**（paths/components/security/tags/info 的组织与 components 复用）——回答「spec 怎么写」；③**与 Swagger 的关系**（Swagger 是旧名+工具集，OpenAPI 是规范）——回答「两者什么关系」；④**代码生成与工具链**（openapi-generator 生成 SDK/服务端桩、文档工具渲染）——回答「spec 能驱动什么」。本叶讲规范本身，是 REST API 的**契约描述层**（对应 GraphQL 的 SDL）——与 REST、GraphQL、版本控制三叶共同构成完整的 API 设计体系。

## 评价

**优点**

- **契约即文档**：一份 spec 同时驱动文档、SDK、Mock、测试、网关，单一真相源消除文档与代码漂移
- **机器可读，工具生态丰富**：openapi-generator 生成多语言 SDK/服务端桩，Swagger UI/Redoc/Scalar 渲染交互文档，Postman/Insomnia 导入即用
- **标准化契约**：跨团队、跨语言统一 API 描述格式，降低协作成本（前端、后端、QA、网关都看同一份 spec）
- **设计优先（Design-First）支持**：先写 spec 再写代码，契约驱动开发，前后端并行

**缺点**

- **spec 冗长**：完整描述一个 API 的 YAML 可能几百上千行，手写繁琐（需用 components 复用 + 工具辅助）
- **维护负担**：代码改了 spec 没同步（或反之）会导致漂移，需 spec-first 或 codegen + 校验强制一致
- **表达能力有边界**：复杂业务规则（如「金额不能为负」「库存不足时拒绝」）难在 spec 完整表达，需额外文档
- **版本演进复杂**：spec 本身也要版本控制（OpenAPI 3.0 vs 3.1 vs 3.2），且描述的 API 也在演进

## 本叶地图

- [入门](./getting-started) —— OpenAPI 定义、与 Swagger 的关系、3.0/3.1/3.2 演进、核心结构概览
- [Spec 结构详解](./guide-line/spec-structure) —— paths/components/security/tags/info 的组织与 components 复用、3.1/3.2 新特性
- [工具链与代码生成](./guide-line/tooling-and-codegen) —— openapi-generator 生成 SDK/服务端桩、design-first vs code-first、文档工具生态
- [参考](./reference) —— spec 结构速查、版本差异速查、易错点清单

## 幻灯片地址

<a href="/SlideStack/openapi-spec-slide/" target="_blank">OpenAPI 规范</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=OpenAPI%20%E8%A7%84%E8%8C%83" target="_blank" rel="noopener noreferrer">OpenAPI 规范测试题</a>
