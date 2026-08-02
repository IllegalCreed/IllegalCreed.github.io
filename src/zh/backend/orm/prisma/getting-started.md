---
layout: doc
outline: [2, 3]
---

# 入门：Prisma 是什么、Schema 与工作流

> 基于 Prisma 7 · 核于 2026-08

## 速查

- **定义**：Prisma 是 **TypeScript 优先**的下一代 ORM——用 `.prisma` **Schema DSL** 声明数据模型，由 `prisma generate` 生成**完全类型安全**的查询客户端（`PrismaClient`），把"写 SQL/拼字符串"变成"写类型化的 JS 调用"。它不是传统 Active Record，而是 **Schema-first + 代码生成**路线。
- **Prisma 7（2025）**：里程碑版本——**移除了 Rust 引擎**（Query Engine），改用纯 JS/TS 的 **driver adapter** 架构。客户端体积**缩小约 90%**，冷启动快、查询吞吐约 **3 倍**；原生支持**边缘运行时**（Cloudflare Workers/Vercel Edge）。`@prisma/client` 改名为 **`prisma-client`**，配置从 `schema.prisma` 迁到 **`prisma.config.ts`**。
- **三大件**：①**Schema**（`schema.prisma`，声明 datasource/generator/models/关系）；②**Migrate**（`prisma migrate dev`，把 schema 变更生成 SQL 迁移并应用）；③**Client**（`prisma generate` 生成类型化客户端）。
- **工作流**：改 `schema.prisma` → `prisma migrate dev --name xxx`（生成+应用迁移）→ `prisma generate`（重新生成客户端）→ 在代码里 `new PrismaClient()` 增删改查。
- **Prisma Client CRUD**：`prisma.user.create/findMany/findUnique/update/delete`，**链式查询构建器**风格，参数对象即查询条件（`where`/`select`/`include`/`orderBy`）。
- **关系**：在 schema 里用 `@relation` 声明，查询时用 `include`/`select` **嵌套读取**关联模型；写入时用**嵌套 create/connect** 一次建好关联。
- **事务**：①`prisma.$transaction([op1, op2])` 顺序批量；②`prisma.$transaction(async (tx) => {...})` 交互式（可读中间结果、有条件分支）。
- **Prisma Accelerate**：官方托管服务，提供**全局连接池**（短连接无.getConnection 慢的问题）+ **边缘缓存**（SQL 结果缓存，P95 大幅降低）+ Prisma Postgres。边缘场景标配。
- **边界**：Prisma **Skills**（`prisma/skills` 官方 agent 技能集）归"AI 技能"章；本叶讲 Prisma **作为 ORM 本身**的用法。

## 一、Prisma 是什么：Schema-first 的类型安全 ORM

Prisma 的核心思想是 **Schema-first + 代码生成**：

1. **声明 Schema**：在一个 `.prisma` 文件里用简洁的 DSL 描述你的数据库——datasource（连什么库）、generator（生成什么客户端）、models（表/字段/类型/关系）。
2. **生成客户端**：`prisma generate` 读取 schema，**生成一个完全类型安全的 `PrismaClient`**——每个 model 都有对应的类型（`User`、`Post`），每个查询方法的参数和返回值都有精确的类型推断。
3. **类型化查询**：在代码里 `prisma.user.findMany({ where: {...} })`，写错字段名/类型在**编译期**就报错，不用等运行时。

这与传统 ORM（TypeORM 的 Active Record/DataMapper、Sequelize 的 `Model.findById`）最大的区别是：**Prisma 不需要你手写实体类（class User extends Model）**——schema 是唯一真相，客户端是生成的。好处是类型永远和数据库结构同步（只要记得 `prisma generate`），坏处是 schema DSL 是 Prisma 自创语法，要学。

一句话：**Prisma 把数据库 schema 变成类型，把 SQL 变成类型化的函数调用——让 TS 编译器帮你查 SQL 错误。**

## 二、Prisma 7：去 Rust 化的重大升级

Prisma 1~6 的客户端依赖一个用 **Rust 编写的 Query Engine**（编译成平台相关的二进制 `.node` 文件），负责把 Prisma 查询翻译成 SQL。这带来几个长期痛点：①**体积大**（引擎几 MB~十几 MB）；②**冷启动慢**（加载二进制）；③**边缘运行时不支持**（Cloudflare Workers 不能跑原生 .node）；④**平台兼容性**麻烦（要按 OS/架构下载对应引擎）。

**Prisma 7（2025 年发布）** 彻底重构了客户端，解决了这些痛点：

| 变化 | Prisma 6（及之前） | Prisma 7 |
| --- | --- | --- |
| 查询引擎 | Rust 二进制 `.node` | **纯 JS/TS**（driver adapter） |
| 客户端体积 | ~10MB+ | **缩小约 90%** |
| 查询吞吐 | 基准 | **约 3 倍** |
| 边缘运行时 | 不支持 | **原生支持**（Workers/Edge） |
| 包名 | `@prisma/client` | **`prisma-client`**（新名） |
| 配置 | `schema.prisma` 的 generator | **`prisma.config.ts`**（TS 配置） |
| 数据库驱动 | 内置 | **driver adapter**（如 `@prisma/adapter-pg`） |

- **driver adapter** 是关键：Prisma 不再自己管数据库连接，而是把 SQL 委托给一个适配器（如 `@prisma/adapter-pg` 跑在 `pg` 上、`@prisma/adapter-pg-worker` 跑在 Workers、`@prisma/adapter-libsql` 跑在 libSQL/Turso）。这让 Prisma 能在任何能跑 JS 的地方连任何数据库。
- **`prisma.config.ts`**：把原本散在 schema.prisma 的 generator 配置、迁移路径、datasource 覆盖等，统一到一个 TS 文件——能在运行时读环境变量、做条件配置。
- **向后兼容**：Prisma 7 仍支持旧的 Rust 引擎（向后兼容期），但新项目推荐 driver adapter 路线。

## 三、工作流：schema → migrate → generate → 查询

Prisma 的日常开发循环只有四步：

```
改 schema.prisma（加表/改字段/加关系）
   │
   ▼
prisma migrate dev --name add_user_email   ← 生成 SQL 迁移 + 应用到 dev 库
   │
   ▼
prisma generate                            ← 重新生成 PrismaClient 类型
   │
   ▼
代码里 prisma.user.findMany({...})         ← 立即享受新字段的类型提示
```

- **`prisma migrate dev`**：开发环境用。它做四件事——①对比 schema 和数据库的差异；②生成一个 SQL 迁移文件（如 ` migrations/20260802_add_user_email/migration.sql`）；③应用到开发数据库；④自动 `prisma generate`。它还会重置开发库（如果迁移有冲突），所以**只在 dev 用**。
- **`prisma migrate deploy`**：生产/CI 用。只应用已生成的迁移（不创建新迁移、不重置库）——安全。
- **`prisma db push`**：跳过迁移文件，直接把 schema 推到数据库（schema 同步）。适合**原型/探索期**（schema 频繁变），不适合需要可审计迁移历史的生产环境。
- **`prisma generate`**：读 schema，生成 `node_modules/.prisma/client`（或 prisma 7 的 `prisma-client` 输出）——这是 `PrismaClient` 的实际实现+类型。**每次改 schema 后都要跑**，否则类型不同步。

## 四、与其他 ORM 的定位差异

| 维度 | Prisma | TypeORM | Drizzle ORM |
| --- | --- | --- | --- |
| 范式 | Schema-first + 代码生成 | Active Record / DataMapper（OOP） | SQL-faithful（代码即 schema） |
| schema 语言 | `.prisma` DSL（自有） | TS 装饰器（`@Entity`） | TS 代码（`pgTable`） |
| 类型安全 | **生成式**（从 schema 推断） | 手写实体类 | **原生 TS**（schema 即类型） |
| 隐藏 SQL | 是（生成 SQL） | 是（QueryBuilder） | **否**（可见 SQL） |
| 生态 | Accelerate/Postgres/Studio | NestJS 默认 | drizzle-kit/Studio |
| 边缘运行时 | Prisma 7 起原生支持 | 弱 | **最佳** |
| 学习曲线 | 学 DSL，但查询直观 | 学装饰器+两种模式 | 会 SQL 即可 |

详见各自的叶：[TypeORM](../typeorm/)、[Drizzle ORM](../drizzle/)。

## 下一步

理解了 Prisma 的定位与工作流后，下一步深入两个核心——[Schema 与迁移详解](./guide-line/schema-and-migrations)（DSL 语法、datasource/generator、migrate 全流程）与[Prisma Client 与查询](./guide-line/client-and-queries)（CRUD、关系嵌套、事务、Accelerate）。
