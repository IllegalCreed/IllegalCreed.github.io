---
layout: doc
outline: [2, 3]
---

# 参考：Drizzle Schema、查询 API、drizzle-kit 速查

> 基于 Drizzle ORM · 核于 2026-08

## 速查

- **Drizzle 是什么**：TypeScript-first、SQL-faithful 的轻量 ORM；schema 用 TS 代码，查询是 SQL 镜像，不隐藏 SQL，无生成步骤，边缘运行时最佳。
- **爆发**：34k+ stars，周下载超 Prisma（2026）。
- **schema**：`pgTable('name', { col: type()... })`，列类型自动映射 TS 类型。
- **关系**：`relations(table, ({ one, many }) => ({...}))`，与表定义分离，供 `db.query` 用。
- **查询**：①构建器 `db.select().from().where()`；②关系 API `db.query.x.findMany({ with })`；③裸 SQL `db.execute(sql\`...\`)`。
- **drizzle-kit**：`generate`（生成迁移）/`push`（直推）/`migrate`（应用）/`studio`（GUI）。
- **边缘**：同一 schema 配不同 driver（D1/Neon/libsql/pg），无原生依赖。

## 一、Schema（pgTable）速查

```ts
import { pgTable, serial, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

const roleEnum = pgEnum('role', ['USER', 'ADMIN'])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: roleEnum('role').default('USER'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'cascade' }),
  published: boolean('published').default(false),
})

// 关系（与表分离，供 db.query）
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}))
```

### 列类型（Postgres）

| builder | PG 类型 | TS |
| --- | --- | --- |
| `serial()` / `integer()` | `SERIAL` / `integer` | `number` |
| `bigint({ mode: 'number' })` | `bigint` | `number` |
| `text()` / `varchar({ length })` | `text` / `varchar` | `string` |
| `boolean()` | `boolean` | `boolean` |
| `timestamp()` / `date()` | `timestamp` / `date` | `Date` |
| `jsonb<$T>()` | `jsonb` | `$T` |
| `uuid()` | `uuid` | `string` |
| `numeric()` | `numeric` | `string` |
| `real()` / `doublePrecision()` | `real` / `double precision` | `number` |
| `pgEnum()` | `enum` | 联合类型 |

### 列约束（链式）

`.primaryKey()` `.notNull()` `.unique()` `.default(value)` `.defaultNow()` `.defaultRandom()` `.references(() => table.col, { onDelete: 'cascade'|'set null'|'restrict', onUpdate })`。

## 二、查询 API 速查

### 1. 查询构建器

```ts
import { eq, and, gt, desc, sql, count } from 'drizzle-orm'

// 查
await db.select().from(users).where(eq(users.id, 1))                       // SELECT *
await db.select({ id: users.id }).from(users).where(gt(users.age, 18)).orderBy(desc(users.id)).limit(20).offset(0)
await db.select({ name: users.name, title: posts.title }).from(users).leftJoin(posts, eq(users.id, posts.authorId))
await db.select({ role: users.role, n: count() }).from(users).groupBy(users.role)

// 改
const [r] = await db.insert(users).values({ email: 'a@b.com' }).returning()   // 插入并返回
await db.update(users).set({ name: 'Bob' }).where(eq(users.id, 1))
await db.delete(users).where(eq(users.id, 1))

// 批量插入
await db.insert(users).values([{ email: 'a' }, { email: 'b' }])
// 冲突处理（upsert）
await db.insert(users).values({ email: 'a@b.com' }).onConflictDoUpdate({ target: users.email, set: { name: 'New' } })
```

### 2. 关系查询 API（db.query）

```ts
const db = drizzle(pool, { schema })                       // 传 schema 才能用 db.query

await db.query.users.findFirst({ where: eq(users.id, 1), with: { posts: true } })
await db.query.users.findMany({
  where: gt(users.age, 18),
  columns: { id: true, email: true },
  with: { posts: { columns: { title: true }, where: eq(posts.published, true) } },
  orderBy: desc(users.createdAt),
  limit: 20,
})
```

### 3. 裸 SQL（参数化）

```ts
import { sql } from 'drizzle-orm'
await db.execute(sql`SELECT * FROM users WHERE email = ${email} AND age > ${age}`)   // 自动参数化
```

### 操作符

`eq` `ne` `gt` `gte` `lt` `lte` `like` `ilike` `inArray` `notInArray` `isNull` `isNotNull` `between` `exists` `and` `or` `not`。

## 三、drizzle-kit 命令速查

| 命令 | 用途 |
| --- | --- |
| `drizzle-kit generate` | 对比 schema 生成 .sql 迁移（只读 schema，不连库） |
| `drizzle-kit push` | 直推 schema 到库（无迁移文件，原型期） |
| `drizzle-kit migrate` | 应用迁移到库（生产/CI） |
| `drizzle-kit studio` | 启本地 GUI 浏览数据 |
| `drizzle-kit up` | 从现有数据库反向生成 schema（接手老库） |
| `drizzle-kit check` | 校验 schema 与迁移一致性 |
| `drizzle-kit drop` | 删除一个生成的迁移 |

## 四、driver 速查

| 运行时/数据库 | driver |
| --- | --- |
| Node.js + Postgres | `drizzle-orm/node-postgres`（pg） |
| Node.js + Postgres（postgres-js） | `drizzle-orm/postgres-js` |
| Neon serverless PG | `drizzle-orm/neon-http` / `neon-serverless` |
| Cloudflare D1 | `drizzle-orm/d1` |
| Turso / libSQL | `drizzle-orm/libsql` |
| MySQL（Node） | `drizzle-orm/mysql2` |
| Bun SQLite | `drizzle-orm/bun-sqlite` |
| Deno（HTTP） | `drizzle-orm/...`（按方言） |

## 五、三大 ORM 对比

| 维度 | Drizzle ORM | Prisma | TypeORM |
| --- | --- | --- | --- |
| 范式 | SQL-faithful（代码即 schema） | Schema-first + 代码生成 | OOP（Active Record/DataMapper） |
| schema 语言 | TS 代码 `pgTable` | `.prisma` DSL | TS 装饰器 `@Entity` |
| 类型来源 | **原生 TS** | 生成式推断 | 手写实体类+装饰器 |
| SQL 可见性 | **可见**（贴近原生） | 隐藏 | 隐藏（QueryBuilder） |
| 复杂查询 | **最强**（原生表达力） | 受限（回落 raw） | QueryBuilder 强 |
| 边缘运行时 | **最佳** | Prisma 7 起支持 | 弱 |
| 生成步骤 | **无** | `prisma generate` | 无（但依赖装饰器元数据） |
| 包体积 | 极小（几十 KB） | Prisma 6 大/7 缩 90% | 中 |
| 学习曲线 | 会 SQL 即可 | 学 DSL | 学装饰器+两种模式 |
| 托管服务 | 无 | Accelerate/Postgres | 无 |
| 典型场景 | 控 SQL、边缘、轻量 | 类型安全、schema 即文档 | NestJS、OOP 习惯 |

## 六、易错点清单

- **"Drizzle 像 Prisma 一样要 generate"**：错。Drizzle 类型由 schema TS 代码原生推断，无 generate 步骤，改 schema 立即生效。
- **"schema 列名就是 TS 属性名"**：不一定。`text('email')` 的 `'email'` 是 DB 列名，变量名是 TS 属性名，两者可不同。
- **"relations() 会建表"**：错。relations 只描述导航关系供 `db.query` 用，DB 结构由 `pgTable` + `.references()` 决定。
- **"db.query 不用传 schema"**：错。`drizzle(pool, { schema })` 必须传 schema 才能用 `db.query` 关系 API。
- **"push 用于生产"**：错。push 无迁移文件无审计，生产用 migrate。
- **"裸 SQL 用字符串拼接"**：危险，SQL 注入。用 `sql\`...\${var}\`` 模板字符串自动参数化。
- **"Drizzle 隐藏 SQL"**：错。Drizzle 是 SQL-faithful，SQL 可见可预测，这是它的卖点。
- **"事务里用外层 db"**：错。事务回调内要用 `tx`，否则不在事务内。
- **"Drizzle 必须配 Postgres"**：错。支持 PG/MySQL/SQLite，每方言有专属 schema builder 和 driver。
- **"换数据库不改 schema"**：错。PG/MySQL/SQLite 的 schema builder 不同（pgTable/mysqlTable/sqliteTable），换数据库要改 schema 代码。

## 七、进阶方向（链接其他叶）

- [Prisma](../prisma/) —— Schema-first + 代码生成的类型安全 ORM
- [TypeORM](../typeorm/) —— OOP 装饰器、Active Record/DataMapper、NestJS 默认
- Cloudflare Workers / Neon / Turso —— Drizzle 常用的边缘/serverless 平台

## 权威链接

- [Drizzle ORM 官方文档](https://orm.drizzle.team)
- [drizzle-kit 文档](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [Drizzle GitHub](https://github.com/drizzle-team/drizzle-orm)
- [Drizzle Learn](https://orm.drizzle.team/learn)
- 本站幻灯片：<a href="/SlideStack/drizzle-slide/" target="_blank">Drizzle ORM</a>
