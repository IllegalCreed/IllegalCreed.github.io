---
layout: doc
outline: [2, 3]
---

# 参考：Prisma Schema、Client API 与命令速查

> 基于 Prisma 7 · 核于 2026-08

## 速查

- **Prisma 是什么**：Schema-first + 代码生成的 TypeScript ORM；schema 即类型，PrismaClient 由 `prisma generate` 生成。
- **Prisma 7 关键变化**：去 Rust 引擎 → driver adapter；客户端体积降约 90%、吞吐约 3 倍；包名 `prisma-client`（原 `@prisma/client`）；配置迁到 `prisma.config.ts`；原生支持边缘运行时。
- **工作流**：改 `schema.prisma` → `prisma migrate dev`（生成+应用迁移+generate）→ `new PrismaClient()` 查询。
- **schema 三块**：datasource（连库）、generator（生成客户端）、model（表/字段/关系）。
- **关系**：父模型反向字段（`Model[]`，不带外键）+ 子模型外键字段 + `@relation`。
- **migrate**：`migrate dev`（开发，生成+应用）、`migrate deploy`（生产，只应用）、`db push`（原型期直推，无迁移文件）。
- **事务**：`$transaction([...])`（顺序批量）、`$transaction(async tx => {})`（交互式）。
- **Accelerate**：全局连接池 + 边缘缓存，serverless/边缘场景标配。

## 一、Schema DSL 速查

```prisma
datasource db {
  provider = "postgresql"            // postgresql/mysql/sqlite/sqlserver/mongodb
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client"          // Prisma 7（Prisma 6 是 prisma-client-js）
  output   = "../src/generated/prisma"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([email])
  @@map("users")
}

enum Role { USER  ADMIN }
```

### 标量类型

| 类型 | 用途 | 常用 `@db.*` |
| --- | --- | --- |
| `String` | 文本 | `@db.VarChar(n)` `@db.Text` |
| `Int`/`BigInt` | 整数 | `@db.Integer` `@db.BigInt` |
| `Float`/`Decimal` | 浮点/金额 | `@db.Decimal(p,s)` |
| `Boolean` | 布尔 | — |
| `DateTime` | 时间 | `@db.Timestamp` |
| `Json` | JSON | `@db.JsonB` |
| `Bytes` | 二进制 | `@db.Bytea` |

### 字段/表属性

| 属性 | 作用 |
| --- | --- |
| `@id` | 主键 |
| `@@id([a,b])` | 复合主键 |
| `@default(...)` | 默认值（`autoincrement()` `now()` `cuid()` `uuid()`） |
| `@unique` / `@@unique([a,b])` | 唯一约束 |
| `@updatedAt` | update 时自动设当前时间 |
| `@relation(fields:[fk], references:[pk])` | 关系+外键 |
| `@map("x")` / `@@map("x")` | 字段/表名映射 |
| `@@index([f])` | 索引 |

## 二、Client API 速查

```ts
// 实例化（Prisma 7 + driver adapter）
import { PrismaClient } from './generated/prisma/client'
import { PrismaPostgres } from '@prisma/adapter-postgres'
const prisma = new PrismaClient({ adapter: new PrismaPostgres({ url }) })

// 单条
await prisma.user.create({ data: {...} })
await prisma.user.findUnique({ where: { id: 1 } })      // 必须唯一字段
await prisma.user.findFirst({ where: {...} })           // 非唯一条件取第一条
await prisma.user.update({ where: { id: 1 }, data: {...} })
await prisma.user.upsert({ where, update, create })
await prisma.user.delete({ where: { id: 1 } })

// 多条
await prisma.user.findMany({ where, orderBy, take, skip, select, include })
await prisma.user.updateMany({ where, data })
await prisma.user.deleteMany({ where })
await prisma.user.count({ where })
await prisma.user.groupBy({ by: ['role'], _count: { _all: true } })

// 原始 SQL
const rows = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`
await prisma.$executeRaw`UPDATE users SET active = true WHERE id = ${id}`
```

### where 操作符

`equals` `not` `in` `notIn` `lt` `lte` `gt` `gte` `contains`（`mode:'insensitive'`）`startsWith` `endsWith` `search`（全文）`is` `isNot`（关联）；逻辑 `AND` `OR` `NOT`。

### 关系读写

```ts
// 读：include / select 嵌套
await prisma.user.findUnique({ where: { id: 1 }, include: { posts: true } })
await prisma.user.findUnique({
  where: { id: 1 },
  select: { id: true, posts: { select: { title: true }, where: { published: true } } },
})

// 写：嵌套 create / connect / connectOrCreate
await prisma.user.create({ data: { email, posts: { create: [{ title }] } } })
await prisma.post.create({ data: { title, author: { connect: { id: 1 } } } })
await prisma.post.create({ data: { title, author: { connectOrCreate: { where, create } } } })
```

### 事务

```ts
await prisma.$transaction([op1, op2])                          // 顺序批量
await prisma.$transaction(async (tx) => { /* tx.user... */ }, { timeout: 10_000, isolationLevel: 'Serializable' })  // 交互式
```

## 三、CLI 命令速查

| 命令 | 用途 |
| --- | --- |
| `prisma init` | 初始化 schema.prisma + .env |
| `prisma generate` | 读 schema 生成客户端（改 schema 后必跑） |
| `prisma migrate dev --name x` | 生成+应用迁移+generate（开发） |
| `prisma migrate deploy` | 应用已有迁移（生产/CI） |
| `prisma migrate status` | 查看迁移应用情况 |
| `prisma migrate resolve` | 标记迁移状态（修复卡住的失败迁移） |
| `prisma db push` | 跳过迁移文件直推 schema（原型期） |
| `prisma db pull` | 反向：从现有库生成 schema（接手老库） |
| `prisma studio` | 启动 GUI 浏览/编辑数据 |
| `prisma validate` | 校验 schema.prisma 语法 |
| `prisma format` | 格式化 schema.prisma |

## 四、三大 ORM 对比

| 维度 | Prisma | TypeORM | Drizzle ORM |
| --- | --- | --- | --- |
| 范式 | Schema-first + 生成 | Active Record / DataMapper | SQL-faithful（代码即 schema） |
| schema 语言 | `.prisma` DSL | TS 装饰器 `@Entity` | TS 代码 `pgTable` |
| 类型来源 | 生成式推断 | 手写实体类 | 原生 TS |
| SQL 可见性 | 隐藏（开 log 看） | 隐藏（QueryBuilder） | 可见（贴近原生） |
| 复杂查询 | 受限（回落 `$queryRaw`） | QueryBuilder 灵活 | 原生 SQL 表达力 |
| 边缘运行时 | Prisma 7 起支持 | 弱 | 最佳 |
| 托管服务 | Accelerate/Postgres | 无 | 无（自托管为主） |
| 典型场景 | 类型安全优先、schema 即文档 | NestJS 默认、OOP 习惯 | 控 SQL、轻量、边缘 |

## 五、易错点清单

- **"schema 改了类型没生效"**：忘了 `prisma generate`。改完 schema 必须 generate（migrate dev 会自动跑，单独改 schema 要手动 generate）。
- **"findUnique 用了非唯一字段报错"**：`findUnique` 只能用于主键或 `@unique` 字段（走索引）。非唯一字段用 `findFirst`。
- **"开发模式连接耗尽"**：Next.js/Nuxt 热重载每模块执行一次 `new PrismaClient()`，开一堆连接。用 `globalThis` 缓存单例。
- **"include 导致 N+1"**：循环里 `findUnique + include` 是 N+1。改用一次 `findMany + include`（Prisma 优化为 join/批量 IN）。
- **"事务里忘了用 tx"**：交互式事务里要用回调参数 `tx`（而非外层 `prisma`），否则不在事务内。
- **"生产环境用 migrate dev"**：错。`migrate dev` 会重置库。生产用 `migrate deploy`。
- **"db push 上生产"**：错。`db push` 无迁移文件、无审计历史，只用于原型/开发库。
- **"Prisma 7 还用 @prisma/client"**：Prisma 7 包名改为 `prisma-client`，配置迁到 `prisma.config.ts`，要用 driver adapter。
- **"Prisma 能表达所有 SQL"**：不能。窗口函数/递归 CTE/复杂聚合要回落 `$queryRaw` 写裸 SQL。
- **"Accelerate 等于 Prisma Postgres"**：Accelerate 是连接池+缓存服务（可连自托管 PG）；Prisma Postgres 是托管 PG（基于 Accelerate）。

## 六、进阶方向（链接其他叶）

- [TypeORM](../typeorm/) —— Active Record/DataMapper、装饰器实体、NestJS 默认 ORM
- [Drizzle ORM](../drizzle/) —— TypeScript-first、SQL-faithful、边缘运行时友好
- [Prisma Skills](../../../large-language-model/skills/)（如有）—— 官方 agent 技能集（归 AI 技能章）

## 权威链接

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma 7 升级指南](https://www.prisma.io/docs/guides/upgrade-prisma)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Accelerate](https://www.prisma.io/docs/data-platform/accelerate)
- 本站幻灯片：<a href="/SlideStack/prisma-slide/" target="_blank">Prisma</a>
