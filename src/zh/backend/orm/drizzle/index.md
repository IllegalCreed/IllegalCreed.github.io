---
layout: doc
---

# Drizzle ORM

**Drizzle ORM** 是 **TypeScript-first**、**SQL-faithful** 的轻量 ORM——schema 用纯 TS 代码定义（`pgTable`/`mysqlTable`/`sqliteTable`），查询 API 贴近原生 SQL（`select().from().where()`），**不隐藏 SQL**、无代码生成步骤、零运行时依赖。它假定你懂 SQL，帮你把 SQL 写成类型安全的 TS 调用，而不是把 SQL 抽象掉——会 SQL 就会用 Drizzle，类型靠 TS 原生推断（改 schema 立即生效，无 `generate` 步骤）。这是它与 Prisma（schema DSL + 生成、隐藏 SQL）、TypeORM（装饰器实体、OOP 映射）的根本分野。

Drizzle 在 2023-2026 经历**爆发式增长**：GitHub **34k+ stars**，**周下载量已超过 Prisma**（2026 数据）——靠轻量（核心几十 KB）、快（冷启动快、无 Rust 引擎）、控 SQL（查询是 SQL 的镜像，可预测可调优）、边缘友好（无装饰器元数据、无原生依赖，原生跑 Cloudflare Workers/Vercel Edge/Bun/Deno）走红，是 serverless/边缘/全栈 TS 项目的热门选择。本叶覆盖 ORM 本身：schema 用 TS 代码定义（pgTable/列类型/关系）、SQL-faithful 查询写法（查询构建器/关系查询 API/裸 SQL）、drizzle-kit 迁移工具（generate/push/migrate）、Drizzle Studio（GUI）、边缘运行时集成与三大 ORM 对比。

## 评价

**优点**

- **SQL-faithful**：查询是 SQL 的类型化镜像，能准确预测生成的 SQL，调试调优直观
- **TypeScript-first**：schema 即 TS 代码，类型原生推断，改 schema 立即生效，无 generate 步骤、无装饰器元数据
- **轻量零依赖**：核心几十 KB，冷启动快，无 Query Engine（对比 Prisma）、无反射依赖（对比 TypeORM）
- **边缘运行时最佳**：原生跑 Cloudflare Workers/Vercel Edge/Bun/Deno，是 serverless 首选
- **复杂查询表达力最强**：join/CTE/窗口函数/递归都能表达，不回落 raw

**缺点**

- **要求懂 SQL**：不像 Prisma 把 SQL 抽象掉，Drizzle 假定你懂 SQL，新手门槛稍高
- **schema 分散在多文件**：TS 代码定义 schema 灵活但不如单一 DSL 文件集中（Prisma 的 schema.prisma）
- **生态较新**：相比 Prisma/TypeORM 的成熟度和托管服务（Accelerate），Drizzle 生态还在快速演进
- **关系查询 API 表达力演进中**：`db.query` 关系 API 比 Prisma 的 include/select 略简，复杂嵌套仍在完善
- **多方言 schema 不通用**：Postgres/MySQL/SQLite 的 schema 构建器不同，换数据库要改 schema 代码

## 本叶地图

- [入门](./getting-started) —— Drizzle 是什么、为什么爆发、SQL-faithful 与 TS-first、工作流、与其他 ORM 的定位差异
- [Schema 与 SQL 详解](./guide-line/schema-and-sql) —— pgTable 定义、列类型、关系声明、SQL-faithful 查询写法（构建器/关系 API/裸 SQL）
- [drizzle-kit 与 Studio](./guide-line/drizzle-kit-and-studio) —— 迁移工具（generate/push/migrate）、Drizzle Studio GUI、边缘运行时集成
- [参考](./reference) —— schema 速查、查询 API 速查、drizzle-kit 命令、易错点、与 Prisma/TypeORM 对比

## 幻灯片地址

<a href="/SlideStack/drizzle-slide/" target="_blank">Drizzle ORM</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Drizzle%20ORM" target="_blank" rel="noopener noreferrer">Drizzle ORM 测试题</a>
