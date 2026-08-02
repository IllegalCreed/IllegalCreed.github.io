---
layout: doc
---

# Prisma

**Prisma** 是 **TypeScript 优先**的下一代 ORM——用 `.prisma` **Schema DSL** 声明数据模型，由 `prisma generate` 生成**完全类型安全**的查询客户端（`PrismaClient`），把"写 SQL/拼字符串"变成"写类型化的函数调用"。它走 **Schema-first + 代码生成**路线，不需要手写实体类，schema 是唯一真相，客户端类型由 schema 推断——让 TS 编译器在编译期帮你查 SQL 错误，而不是等运行时崩。理解 Prisma，是写**类型安全、可维护、不裸拼 SQL** 的 Node.js 后端的基础；一个手写 `Model.findById` 还要 `as any` 强转的开发者，难以享受类型重构的红利。

Prisma 7（2025）是一次架构级跃迁——**移除了 Rust Query Engine**，改用纯 JS/TS 的 **driver adapter** 架构：客户端体积**缩小约 90%**、查询吞吐约 **3 倍**、原生支持**边缘运行时**（Cloudflare Workers/Vercel Edge）。`@prisma/client` 更名为 `prisma-client`，配置从 `schema.prisma` 迁到 **`prisma.config.ts`**。本叶覆盖 ORM 本身：Schema DSL 语法、`migrate`/`generate` 工作流、Prisma Client CRUD、多模型关系（嵌套读写）、事务（批量/交互式）、Prisma Accelerate（连接池+边缘缓存）与 Prisma Postgres。注意边界：Prisma **官方 agent 技能集**（`prisma/skills`）归"AI 技能"章，本叶只讲 Prisma **作为 ORM** 的工程用法。

## 评价

**优点**

- **极致类型安全**：schema 即类型，查询参数和返回值全推断，改字段立即编译报错，重构放心
- **Schema 即文档**：`.prisma` 文件同时是数据库 schema、类型定义、团队文档，单一真相
- **迁移可审计**：`prisma migrate dev` 生成带时间戳的 SQL 迁移，可 review、可回滚、可进 CI
- **Prisma 7 高性能**：去 Rust 后体积降 90%、吞吐 3 倍，原生跑在边缘运行时
- **生态完整**：Prisma Studio（GUI 浏览数据）、Accelerate（连接池+缓存）、Postgres（托管数据库）

**缺点**

- **隐藏 SQL**：生成的 SQL 不可见（除非开 query log），调试复杂查询或调优索引时要额外查日志
- **DSL 是自有语法**：要学 `.prisma` 语法，且 schema 与 TS 类型分离（改完要 `generate`）
- **复杂查询受限**：极复杂的 SQL（窗口函数/CTE/递归）Prisma 表达不了，要回落 `prisma.$queryRaw` 写裸 SQL
- **N+1 隐患**：用 `include` 嵌套读取时若不注意会触发 N+1（虽然 Prisma 会优化为 join 或批量）
- **耦合托管服务**：Accelerate/Postgres 是官方 SaaS，自托管 Postgres 也能用但部分功能（缓存）要 SaaS

## 本叶地图

- [入门](./getting-started) —— Prisma 是什么、Prisma 7 去引擎升级、工作流（schema→migrate→generate）、与其他 ORM 的定位差异
- [Schema 与迁移详解](./guide-line/schema-and-migrations) —— `.prisma` DSL 语法、datasource/generator、模型/字段/属性、关系声明、migrate 全流程
- [Prisma Client 与查询](./guide-line/client-and-queries) —— CRUD、查询构建器、关系嵌套读写、事务、Prisma Accelerate
- [参考](./reference) —— Schema 速查、客户端 API 速查、migrate 命令、易错点、与 TypeORM/Drizzle 对比

## 幻灯片地址

<a href="/SlideStack/prisma-slide/" target="_blank">Prisma</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Prisma" target="_blank" rel="noopener noreferrer">Prisma 测试题</a>
