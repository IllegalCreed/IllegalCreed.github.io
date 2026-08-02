---
layout: doc
outline: [2, 3]
---

# Schema 与 SQL：pgTable 定义、列类型、关系、SQL-faithful 查询

> 基于 Drizzle ORM · 核于 2026-08

## 速查

- **schema 是 TS 代码**：`pgTable('users', { id: serial().primaryKey(), name: text().notNull() })`——表名 + 列定义对象，每个列是一个 column builder。
- **列类型（Postgres）**：`serial`/`integer`/`text`/`varchar({length})`/`boolean`/`timestamp`/`jsonb`/`uuid`/`numeric`/`real`/`bigint`，类型原生映射到 PG 列类型，TS 类型自动推断（`serial` → `number`，`text` → `string`）。
- **列约束**：`.primaryKey()`/`.notNull()`/`.unique()`/`.default(...)`/`.defaultNow()`/`.references(() => users.id)`（外键）。
- **关系（relations）**：单独用 `relations()` 函数声明（与表定义分离）——`relations(users, ({ one, many }) => ({ posts: many(posts) }))`，描述导航关系（不影响 DB 结构，只影响 `db.query` 关系 API）。
- **三种查询写法**：①**查询构建器** `db.select().from().where()`（SQL 镜像，最常用）；②**关系查询 API** `db.query.users.findMany({ with: { posts: true } })`（带嵌套关系）；③**裸 SQL** `db.execute(sql\`...\`)`（模板字符串，参数化）。
- **SQL 操作符**：`eq`/`ne`/`gt`/`gte`/`lt`/`lte`/`like`/`ilike`/`inArray`/`notInArray`/`isNull`/`isNotNull`/`between`/`and`/`or`/`not`。
- **SQL-faithful**：每个方法对应 SQL 子句——`select/from/where/join/leftJoin/innerJoin/groupBy/having/orderBy/limit/offset`，你能逐字读出 SQL。
- **类型安全**：错字段名/类型在编译期报错（schema 是 TS，类型原生推断）。

## 一、Schema：用 pgTable 定义表

```ts
// schema.ts
import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core'

// 枚举
export const roleEnum = pgEnum('role', ['USER', 'ADMIN'])

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),                       // SERIAL PRIMARY KEY，TS 类型 number
  email: text('email').notNull().unique(),             // text NOT NULL UNIQUE
  name: text('name'),                                  // text（可空）
  age: integer('age'),                                 // integer
  role: roleEnum('role').default('USER'),              // enum，默认 USER
  createdAt: timestamp('created_at').defaultNow(),     // 默认当前时间
  updatedAt: timestamp('updated_at').defaultNow(),     // （更新需触发器或应用层管）
})

// 文章表（外键）
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'cascade' }),  // 外键
  published: boolean('published').default(false),
})
```

### 列定义要点

- **第一个参数是 DB 列名**：`serial('id')` 的 `'id'` 是数据库里的列名；变量名（`id`）是 TS 里访问的属性名——两者可不同（如 TS 用 `authorId`、DB 用 `author_id`）。
- **类型自动推断**：`serial`/`integer` → `number`，`text`/`varchar` → `string`，`boolean` → `boolean`，`timestamp` → `Date`。无需手写 TS 类型。
- **链式约束**：`.primaryKey().notNull().unique().default(...)` 顺序组合。
- **`.references(() => users.id)`**：声明外键——回调返回被引用列，可加 `{ onDelete: 'cascade'|'set null'|'restrict' }`。

### 常用 Postgres 列类型

| Drizzle | PG 类型 | TS 类型 |
| --- | --- | --- |
| `serial()` | `SERIAL` | `number` |
| `integer()` / `bigint()` | `integer` / `bigint` | `number` / `bigint` |
| `text()` / `varchar({length})` | `text` / `varchar` | `string` |
| `boolean()` | `boolean` | `boolean` |
| `timestamp()` / `date()` | `timestamp` / `date` | `Date` |
| `jsonb()` / `json()` | `jsonb` / `json` | `unknown`（可泛型化） |
| `uuid()` | `uuid` | `string` |
| `numeric()` / `real()` | `numeric` / `real` | `string`（numeric）/ `number` |
| `pgEnum` | `enum` | 联合类型 |

## 二、关系（relations）

Drizzle 的关系**与表定义分离**，单独用 `relations()` 声明，只影响 `db.query` 关系 API（不影响 DB 结构）：

```ts
import { relations } from 'drizzle-orm'

// 用户 → 多文章（一对多）
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),                  // 一个用户有多篇文章（导航）
}))

// 文章 → 一个用户（反向）
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {                 // 一篇文章属于一个用户
    fields: [posts.authorId],          // 当前表的外键字段
    references: [users.id],            // 被引用字段
  }),
}))
```

- **`fields`/`references`**：声明外键关系（用于 `db.query` 的 `with` 自动 join）。
- **多对多**：通过中间表 + 两个 `many` 声明。
- **relations 不建表/列**：它只是描述导航关系，DB 结构由 `pgTable` + `.references()` 决定。`relations()` 仅供 `db.query` API 使用。

## 三、查询写法 1：查询构建器（SQL 镜像）

最常用、最贴近 SQL 的写法：

```ts
import { eq, gt, and, desc, like } from 'drizzle-orm'

// SELECT * FROM users WHERE id = 1
const u = await db.select().from(users).where(eq(users.id, 1))

// 选字段 + 条件 + 排序 + 分页
const list = await db
  .select({ id: users.id, email: users.email })
  .from(users)
  .where(and(eq(users.role, 'ADMIN'), gt(users.age, 18)))
  .orderBy(desc(users.createdAt))
  .limit(20)
  .offset(0)

// JOIN
const joined = await db
  .select({ userName: users.name, postTitle: posts.title })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId))      // LEFT JOIN posts ON users.id = posts.author_id
  .where(eq(users.id, 1))

// 聚合
import { count } from 'drizzle-orm'
const stats = await db
  .select({ role: users.role, count: count() })
  .from(users)
  .groupBy(users.role)

// 插入
const [inserted] = await db.insert(users).values({ email: 'a@b.com', name: 'Alice' }).returning()
// UPDATE users SET name='Bob' WHERE id=1
await db.update(users).set({ name: 'Bob' }).where(eq(users.id, 1))
// DELETE FROM users WHERE id=1
await db.delete(users).where(eq(users.id, 1))
```

每个方法对应一个 SQL 子句——**你能逐字读出 SQL**，这是 SQL-faithful 的核心。

### 操作符速查

| 操作符 | SQL |
| --- | --- |
| `eq(col, val)` / `ne` | `=` / `!=` |
| `gt` / `gte` / `lt` / `lte` | `>` / `>=` / `<` / `<=` |
| `like(col, '%x%')` / `ilike` | `LIKE` / `ILIKE`（不区分大小写） |
| `inArray(col, [a,b])` / `notInArray` | `IN (...)` / `NOT IN` |
| `isNull(col)` / `isNotNull` | `IS NULL` / `IS NOT NULL` |
| `between(col, a, b)` | `BETWEEN a AND b` |
| `and(...)` / `or(...)` / `not(...)` | `AND` / `OR` / `NOT` |

## 四、查询写法 2：关系查询 API（db.query）

带嵌套关系的查询（类似 Prisma 的 include），需要 `drizzle()` 时配 `schema`：

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const db = drizzle(pool, { schema })          // 传 schema 才能用 db.query 关系 API

// 查用户带文章（自动 join）
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {                                       // 类似 Prisma 的 include
    posts: true,                                // 带出所有文章
  },
})

// 嵌套选字段
const u = await db.query.users.findFirst({
  where: eq(users.id, 1),
  columns: { id: true, email: true },
  with: {
    posts: {
      columns: { title: true },
      where: eq(posts.published, true),
    },
  },
})
```

- **`with`**：声明要带出的关系（依赖前面 `relations()` 定义）。
- **`columns`**：选字段（类似 Prisma select）。
- **关系 API vs 查询构建器**：关系 API 写嵌套关系方便；复杂 join/聚合用查询构建器。

## 五、查询写法 3：裸 SQL（sql 模板）

极复杂查询（CTE/窗口函数/递归）回落裸 SQL，用 `sql` 模板字符串**自动参数化**：

```ts
import { sql } from 'drizzle-orm'

// 参数化（自动防注入）
const rows = await db.execute(
  sql`SELECT * FROM users WHERE email = ${userInput} AND age > ${age}`,
)
// 生成：SELECT * FROM users WHERE email = $1 AND age > $2（参数化）

// 复杂 CTE
const ranked = await db.execute(sql`
  WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY author_id ORDER BY created_at DESC) AS rn
    FROM posts
  )
  SELECT * FROM ranked WHERE rn = 1
`)
```

- **`sql\`...\${var}\``**：模板字符串里的 `${var}` 自动参数化（防注入），不是字符串拼接。
- **复杂查询**：窗口函数、递归 CTE、数据库特定函数都能用裸 SQL。

## 下一步

schema 与查询讲完后，下一步——[drizzle-kit 与 Studio](./drizzle-kit-and-studio)（迁移工具、Studio GUI、边缘运行时集成）。
