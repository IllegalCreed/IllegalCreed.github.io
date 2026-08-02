---
layout: doc
outline: [2, 3]
---

# Schema 与迁移详解：DSL、datasource、generator、migrate 全流程

> 基于 Prisma 7 · 核于 2026-08

## 速查

- **Schema 三块**：`schema.prisma` 由 ①**datasource**（连什么库：provider+url）、②**generator**（生成什么客户端，Prisma 7 用 `prisma-client`+driver adapter）、③**model**（表/字段/关系）组成。
- **字段类型**：标量类型 `String`/`Int`/`Boolean`/`DateTime`/`Json`/`BigInt`/`Decimal`/`Float`/`Bytes`；映射到 DB 列类型由 `@db.*` 属性控制（如 `@db.VarChar(100)`、`@db.Text`）。
- **属性（attribute）**：`@id`（主键）、`@default(...)`（默认值，如 `@default(autoincrement())`/`@default(cuid())`/`@default(now())`）、`@unique`（唯一）、`@updatedAt`（自动更新时间）、`@relation`（外键关系）、`@map`/`@@map`（字段/表名映射，DB 列名与 TS 名不同时用）。
- **关系三件套**：①在父模型加 `posts Post[]`（反向字段，**不带外键**，只是导航）；②在子模型加 `author User @relation(fields: [authorId], references: [id])`（外键字段 + 关系声明）；③外键字段 `authorId Int`。多对多 Prisma 自动建中间表（隐式）或你显式声明（显式）。
- **migrate dev vs deploy vs db push**：`migrate dev`（开发，生成新迁移+应用+generate）、`migrate deploy`（生产/CI，只应用已有迁移）、`db push`（原型期，跳过迁移文件直推 schema）。
- **迁移是 SQL 文件**：`prisma/migrations/<时间戳>_<name>/migration.sql`，可 review、可改、可提交 Git，是生产环境 schema 变更的**唯一审计入口**。
- **prisma generate**：读 schema 生成客户端类型，**每次改 schema 后必跑**（migrate dev 会自动跑，手动改 schema 单独 generate 也要跑）。
- **prisma.config.ts（Prisma 7）**：把 generator 配置、datasource 覆盖、迁移路径统一到一个 TS 文件，支持读环境变量、条件配置。
- **driver adapter（Prisma 7）**：schema 里 datasource 仍声明 provider，但**实际数据库连接**由 adapter 提供（如 `@prisma/adapter-pg`），在 `prisma.config.ts` 或 new PrismaClient 时传入。

## 一、Schema DSL 全景

一个完整的 `schema.prisma`：

```prisma
// ① 数据源：连什么库
datasource db {
  provider = "postgresql"          // postgresql / mysql / sqlite / sqlserver / mongodb
  url      = env("DATABASE_URL")   // 从环境变量读，如 postgresql://user:pass@host:5432/db
}

// ② 生成器：生成什么客户端（Prisma 7 用 prisma-client）
generator client {
  provider = "prisma-client"       // Prisma 6 是 "prisma-client-js"
  output   = "../src/generated/prisma"  // 输出位置（Prisma 7 默认可自定义）
  // Prisma 7 通过 driver adapter 提供驱动，不再需要 previewFeatures = ["driverAdapters"]
}

// ③ 模型：表/字段/关系
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?              // ? 表示可空
  role      Role     @default(USER)
  posts     Post[]               // 反向关系：一个用户有多篇文章（不带外键）
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])               // 表级：加索引
  @@map("users")                 // 表名映射：DB 里表叫 users，TS 里类叫 User
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId Int                            // 外键字段
  tags     Tag[]                          // 多对多（隐式中间表）

  @@map("posts")
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]                            // 多对多的另一端
}

enum Role {
  USER
  ADMIN
}
```

- **datasource**：`provider` 决定连哪种库；`url` 用 `env("DATABASE_URL")` 从环境变量读（不要硬编码密码）。Prisma 7 仍要声明 datasource（用于 migrate），但**运行时连接**由 driver adapter 接管。
- **generator**：`provider = "prisma-client"`（Prisma 7）生成新的 `prisma-client` 包；`output` 可自定义输出目录（Prisma 7 推荐输出到 `src/generated/prisma` 而非 `node_modules`，方便提交/审查）。
- **model**：一个 model 对应一张表（关系型）或一个集合（MongoDB）。字段名是 TS 属性名，DB 列名可用 `@map` 重命名。
- **enum**：枚举类型，Prisma 会映射成 DB 的 enum（Postgres 原生支持）或字符串（MySQL/SQLite）。

## 二、字段、类型与属性

### 标量类型

| Prisma 类型 | 含义 | Postgres 映射 |
| --- | --- | --- |
| `String` | 字符串 | `text`（可用 `@db.VarChar(n)` 改） |
| `Int` | 32 位整数 | `integer` |
| `BigInt` | 64 位整数 | `bigint` |
| `Float` | 浮点 | `double precision` |
| `Decimal` | 高精度小数（金额） | `decimal(p,s)`，用 `@db.Decimal(10,2)` |
| `Boolean` | 布尔 | `boolean` |
| `DateTime` | 时间戳 | `timestamp(3)` |
| `Json` | JSON | `jsonb` |
| `Bytes` | 二进制 | `bytea` |

### 常用属性

- `@id`：主键（单字段）。复合主键用 `@@id([fieldA, fieldB])`。
- `@default(...)`：默认值。`autoincrement()`（自增整数）、`now()`（当前时间）、`cuid()`/`uuid()`（生成唯一 ID）、`uuidv4()`、`dbgenerated("...")`（DB 层默认值）。
- `@unique`：唯一约束（单字段）。多字段唯一用 `@@unique([a, b])`。
- `@updatedAt`：Prisma 在 `update` 时自动把该字段设为当前时间——无需应用层管"更新时间"。
- `@map("db_column")`：字段名映射——TS 里叫 `createdAt`，DB 列里叫 `created_at`。
- `@@map("db_table")`：表名映射——TS 里 model 叫 `User`，DB 表叫 `users`。
- `@@index([field])`：加索引（可多字段、可指定顺序 `@@index([email, name(sort: Desc)])`）。

## 三、关系：一对一、一对多、多对多

Prisma 的关系在 schema 里**两段声明**（父模型的反向字段 + 子模型的外键+@relation）：

### 一对多（最常见）

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]              // 反向字段：User 1 → Post N（不带外键，纯导航）
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id])
  authorId Int                       // 外键字段（必须在 DB 存）
}
```

- `posts Post[]`：在 User 上加一个"虚拟"字段，类型是 Post 数组——**不建列**，只是让查询时能 `include: { posts: true }` 读出来。
- `author User @relation(...)`：在 Post 上声明关系，`fields: [authorId]` 是 Post 的外键字段，`references: [id]` 指向 User 的主键。

### 一对一

把外键那侧加 `@unique`：

```prisma
model User {
  id     Int     @id @default(autoincrement())
  profile Profile?
}
model Profile {
  id     Int  @id @default(autoincrement())
  user   User @relation(fields: [userId], references: [id])
  userId Int  @unique              // 一对一靠 @unique 保证
}
```

### 多对多

Prisma 支持**隐式**和**显式**两种：

- **隐式**（最省事）：两端都写 `Model[]`，Prisma 自动建中间表（`_PostToTag`），但你**不能给中间表加额外字段**。
- **显式**：自己建中间表 model（如 `PostTag`），加额外字段（如 `assignedAt`）——当中间表要存元数据时用。

## 四、migrate：从 schema 到数据库

`prisma migrate` 把 schema 变更落到数据库，生成可审计的 SQL 迁移：

```
schema.prisma 改了（加表/改字段）
        │
        ▼
prisma migrate dev --name add_post_tags
   ① 对比 schema 和 DB 的差异
   ② 生成 migrations/20260802103000_add_post_tags/migration.sql
   ③ 应用到 dev 数据库
   ④ 触发 prisma generate（重新生成客户端类型）
        │
        ▼
提交 migration.sql 到 Git（团队其他人 git pull 后 prisma migrate deploy）
```

- **`migrate dev`（开发环境）**：生成新迁移 + 应用 + generate。如果检测到迁移与现有数据冲突（如加非空列无默认值），会**提示重置开发库**——所以只用在 dev。
- **`migrate deploy`（生产/CI）**：只应用 `migrations/` 下尚未应用的迁移，**不生成新迁移、不重置库**——生产环境安全。
- **`migrate status`**：查看哪些迁移已应用、哪些待应用——CI 里用来检查是否漏迁移。
- **`migrate resolve`**：标记某个迁移为已应用/已回滚——用于修复迁移卡在"失败"状态（如迁移执行到一半 DB 挂了）。
- **迁移文件能改吗**：能（生成后 review 时可手改 SQL），但**已应用到生产的迁移不要再改**（会导致历史不一致），改未应用的可。

## 五、db push：跳过迁移直推

`prisma db push` 把 schema 直接同步到数据库，**不生成迁移文件**：

- **适用**：原型期、探索期（schema 一天改十次，懒得每次生成迁移）、本地开发库快速试验。
- **不适用**：生产环境（无审计历史）、团队协作（别人拉不到迁移）、需要回滚的场景。
- **和 migrate 的关系**：`db push` 是 `migrate` 的"快速版"，最终上生产还是要 `migrate` 生成正式迁移。

## 六、prisma.config.ts（Prisma 7 新配置）

Prisma 7 把配置从 `schema.prisma` 的 generator 块迁到 `prisma.config.ts`：

```ts
// prisma.config.ts
import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  // 可读环境变量做条件配置
  earlyPreview: process.env.PRISMA_PREVIEW === 'true',
})
```

好处：①配置是 TS（有类型、能读 env、能做条件）；②不再需要在 schema.prisma 里写 `previewFeatures`；③与项目其他 TS 配置风格统一。

## 下一步

schema 与迁移讲完后，下一步用生成的客户端做查询——[Prisma Client 与查询](./client-and-queries)（CRUD、查询构建器、关系嵌套读写、事务、Prisma Accelerate）。
