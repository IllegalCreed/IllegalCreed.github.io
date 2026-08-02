---
layout: doc
outline: [2, 3]
---

# 入门：Drizzle ORM 是什么、SQL-faithful 与工作流

> 基于 Drizzle ORM · 核于 2026-08

## 速查

- **定义**：Drizzle ORM 是 **TypeScript-first**、**SQL-faithful** 的 ORM——schema 用纯 TS 代码定义（`pgTable`/`mysqlTable`/`sqliteTable`），查询 API 贴近原生 SQL（`select().from().where()`），**不隐藏 SQL**、无代码生成步骤、零运行时依赖。会 SQL 就会用 Drizzle。
- **爆发式增长**：GitHub **34k+ stars**，**周下载量已超过 Prisma**（2026 数据）——靠轻量、快、控 SQL、边缘友好走红，是 serverless/边缘/全栈 TS 项目的热门选择。
- **TypeScript-first**：schema 即 TS 代码，类型**原生推断**（不靠代码生成，不靠装饰器元数据），改 schema 立即生效，无 `generate` 步骤。
- **SQL-faithful（不隐藏 SQL）**：查询 API 一一对应 SQL 子句（`select/from/where/join/groupBy/orderBy/limit/offset`），你能准确预测生成的 SQL，调试和调优直观。与 Prisma/TypeORM 隐藏 SQL 的路线相反。
- **三大件**：①**schema**（TS 代码定义表/列/关系）；②**drizzle-kit**（迁移工具：`generate`/`push`/`migrate`）；③**Drizzle Studio**（GUI 浏览数据）。
- **多方言**：PostgreSQL（`drizzle-orm/pg-core`）、MySQL（`drizzle-orm/mysql-core`）、SQLite（`drizzle-orm/sqlite-core`），每方言有专属 schema 构建器，贴近各自特性。
- **边缘运行时友好**：无原生依赖、无装饰器元数据、轻量（核心几十 KB），原生跑在 Cloudflare Workers/Vercel Edge/Bun/Deno，是边缘场景**最佳 ORM**。
- **查询写法**：`db.select().from(users).where(eq(users.id, 1))`（查询构建器）；或 `db.query.users.findMany({...})`（关系查询 API，带嵌套关系）；或 `db.execute(sql\`...\`)`（裸 SQL，rSQL 模板）。
- **事务**：`db.transaction(async (tx) => {...})`，tx 是事务客户端，抛错自动回滚。

## 一、Drizzle 是什么：SQL-faithful 的 TypeScript ORM

Drizzle 的核心思想是 **让 ORM 贴近 SQL，而不是隐藏 SQL**：

1. **schema 是 TS 代码**：用 `pgTable({ id: serial(), name: text() })` 定义表，每一列是一个 TS 对象，类型原生推断（`id` 是 `number`，`name` 是 `string`）。不需要装饰器、不需要代码生成——改 schema 立即生效。
2. **查询是 SQL 的镜像**：`db.select().from(users).where(eq(users.age, 18)).orderBy(desc(users.name)).limit(10)` 几乎能逐字读成 `SELECT * FROM users WHERE age = 18 ORDER BY name DESC LIMIT 10`。你能**准确预测**生成的 SQL，不像 Prisma 要开 log 才看到。
3. **零运行时魔法**：无 Query Engine（对比 Prisma 的 Rust 引擎）、无装饰器元数据反射（对比 TypeORM）、无代码生成。类型靠 TS 原生推断，包体积小、启动快、跑在任何 JS 运行时。

这与 Prisma（schema DSL + 生成、隐藏 SQL）、TypeORM（装饰器实体、OOP 映射）的根本区别是：**Drizzle 不假装 SQL 不存在**。它假定你懂 SQL，帮你把 SQL 写成类型安全的 TS 调用，而不是把 SQL 抽象掉。

一句话：**Drizzle 是会 SQL 的人的 ORM——schema 是 TS 代码，查询是 SQL 的类型化镜像，你能看到并控制每一行 SQL。**

## 二、为什么爆发：轻量、快、控 SQL、边缘友好

Drizzle 在 2023-2026 爆发式增长（34k+ stars，周下载超 Prisma），原因：

| 痛点（其他 ORM） | Drizzle 解法 |
| --- | --- |
| Prisma 体积大（Rust 引擎）、冷启动慢 | **零依赖、轻量**（核心几十 KB），冷启动快 |
| Prisma/TypeORM 隐藏 SQL，调试难 | **SQL 可见**，能预测每条查询 |
| TypeORM 装饰器元数据在边缘运行时弱 | **无装饰器**，原生跑 Workers/Edge |
| Prisma 复杂查询表达不了要回落 raw | **SQL-faithful**，复杂查询（join/CTE/窗口）都能表达 |
| 类型靠生成（Prisma）或手写维护（TypeORM） | **原生 TS 推断**，改 schema 立即生效，无 generate |

- **serverless/边缘首选**：Cloudflare D1、Turso（libSQL）、Neon、Supabase 等 serverless 数据库的官方推荐 ORM 多是 Drizzle。
- **类型安全不牺牲控制**：你看到 SQL 但仍享受 TS 类型检查（错字段名编译报错）。

## 三、工作流：schema → drizzle-kit → 查询

```
写 schema.ts（pgTable 定义表/列/关系）
   │
   ▼
drizzle-kit generate    ← 对比 schema 与库差异生成 SQL 迁移
   │
   ▼
drizzle-kit migrate     ← 应用迁移到数据库
   │
   ▼
db.select().from(...)   ← 立即查询（无 generate 步骤，类型已推断）
```

- **`drizzle-kit generate`**：对比 schema 与数据库（或上一次迁移）差异，生成 SQL 迁移文件（`.sql`）。类似 Prisma migrate dev / TypeORM migration:generate。
- **`drizzle-kit push`**：跳过迁移文件，直接把 schema 推到库（同步）。原型期用，生产用 migrate。
- **`drizzle-kit migrate`**：应用已生成的迁移。
- **无 generate 步骤**：与 Prisma/TypeORM 不同，Drizzle 的客户端类型由 schema TS 代码直接推断，**改 schema 不用跑任何 generate 命令**——立即生效。

## 四、与其他 ORM 的定位差异

| 维度 | Drizzle ORM | Prisma | TypeORM |
| --- | --- | --- | --- |
| 范式 | SQL-faithful（代码即 schema） | Schema-first + 代码生成 | OOP（Active Record/DataMapper） |
| schema 语言 | TS 代码（`pgTable`） | `.prisma` DSL | TS 装饰器（`@Entity`） |
| 类型来源 | **原生 TS** | 生成式推断 | 手写实体类+装饰器 |
| SQL 可见性 | **可见**（贴近原生） | 隐藏 | 隐藏（QueryBuilder） |
| 复杂查询 | **最强**（原生 SQL 表达力） | 受限（回落 raw） | QueryBuilder 强 |
| 边缘运行时 | **最佳** | Prisma 7 起支持 | 弱 |
| 学习曲线 | **会 SQL 即可** | 学 DSL | 学装饰器+两种模式 |
| 托管服务 | 无（自托管为主） | Accelerate/Postgres | 无 |

详见各自的叶：[Prisma](../prisma/)、[TypeORM](../typeorm/)。

## 下一步

理解了 Drizzle 的定位后，下一步深入——[Schema 与 SQL 详解](./guide-line/schema-and-sql)（pgTable 定义、列类型、关系、SQL-faithful 查询写法）与[drizzle-kit 与 Studio](./guide-line/drizzle-kit-and-studio)（迁移工具、Studio GUI、边缘运行时集成）。
