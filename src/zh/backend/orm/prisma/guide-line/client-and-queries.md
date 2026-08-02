---
layout: doc
outline: [2, 3]
---

# Prisma Client 与查询：CRUD、关系嵌套、事务、Accelerate

> 基于 Prisma 7 · 核于 2026-08

## 速查

- **PrismaClient 实例**：`const prisma = new PrismaClient()`（Prisma 7 配 driver adapter：`new PrismaClient({ adapter: new PrismaPostgres(url) })`）。**单例**——整个应用一个实例，避免连接耗尽（开发模式 Next.js 要 globalThis 缓存防热重载爆连接）。
- **CRUD 五件套**：`prisma.<model>.create()`（建）、`findUnique()`（按主键/唯一键查一条）、`findFirst()`（按条件查第一条）、`findMany()`（查多条）、`update()`（改）、`delete()`（删）、`upsert()`（存在则改不存在则建）、`deleteMany()`/`updateMany()`/`count()`/`aggregate()`/`groupBy()`。
- **查询参数对象**：`{ where, select, include, orderBy, take, skip, distinct }`——参数即查询条件，类型完全推断。
- **筛选（where）**：等值（`{ email: "a@b.com" }`）、操作符（`{ age: { gt: 18, lt: 65 } }`、`{ name: { contains: "x" } }`、`{ role: { in: ["ADMIN"] } }`）、逻辑（`AND`/`OR`/`NOT`）。
- **关系读取**：`include: { posts: true }`（把关联全字段读出）、`select: { id: true, posts: { select: { title: true } } }`（嵌套选字段，返回精简对象）。
- **关系写入**：嵌套 `create`（建关联对象）、`connect`（关联已存在对象）、`connectOrCreate`（不存在则建）、`disconnect`/`set`/`update`/`delete`（改关联）。一次调用建好主对象+所有关联。
- **事务两种**：①`prisma.$transaction([op1, op2])` 顺序批量（全成功才提交）；②`prisma.$transaction(async (tx) => {...})` 交互式（tx 是隔离的事务客户端，可读中间结果、有分支）。
- **原始 SQL**：`prisma.$queryRaw\`SELECT ...\``（返回类型化结果）、`prisma.$executeRaw`（不返回结果）——极复杂查询/Prisma 表达不了时回落。
- **分页**：`take`/`skip`（offset 分页，简单但深翻页慢）、游标分页（`cursor: { id: lastId }, skip: 1, take: N`，深翻页快）。
- **Prisma Accelerate**：官方托管服务——①**全局连接池**（解决 serverless 短连接爆连接数）；②**边缘缓存**（SQL 结果缓存，命中 P95 <10ms）；③Prisma Postgres（托管 PG）。边缘/serverless 场景标配。

## 一、PrismaClient 实例化

```ts
// Prisma 7 + driver adapter（推荐，跑在任何 JS 运行时）
import { PrismaClient } from './generated/prisma/client'        // Prisma 7 新路径
import { PrismaPostgres } from '@prisma/adapter-postgres'

const prisma = new PrismaClient({
  adapter: new PrismaPostgres({ url: process.env.DATABASE_URL }),
  // log: ['query', 'info', 'warn', 'error'],  // 调试时开 query log 看生成的 SQL
})

// 单例：开发模式（Next.js 热重载）要缓存到 globalThis，否则每次热重载 new 一个，连接爆
const prisma = globalThis.__prisma ?? new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma
export { prisma }
```

- **driver adapter（Prisma 7）**：传 `adapter` 替代旧的 `datasource.url` 直连。常见 adapter：`@prisma/adapter-pg`（Node）、`@prisma/adapter-pg-worker`（Workers）、`@prisma/adapter-libsql`（Turso/libSQL）、`@prisma/adapter-d1`（Cloudflare D1）、`@prisma/adapter-neon`（Neon serverless PG）。
- **单例原则**：`PrismaClient` 内部维护连接池，**整个应用只 new 一次**。Next.js/Nuxt 等热重载框架会重复执行模块，要用 `globalThis` 缓存（否则开发模式每热重载一次开一批连接，很快耗尽 PG 的 `max_connections`）。
- **log**：开 `['query']` 能在控制台看到每条查询生成的 SQL+耗时——调试 N+1、看是否用了索引的利器。

## 二、CRUD 基础

```ts
// 建一条
const user = await prisma.user.create({
  data: { email: 'a@b.com', name: 'Alice', role: 'ADMIN' },
})

// 按主键查一条
const u = await prisma.user.findUnique({ where: { id: 1 } })
// 按唯一键（@unique 字段）查一条
const u2 = await prisma.user.findUnique({ where: { email: 'a@b.com' } })

// 查多条（带条件/排序/分页/选字段）
const users = await prisma.user.findMany({
  where: { role: 'ADMIN', age: { gt: 18 } },
  orderBy: { createdAt: 'desc' },
  take: 20,                       // LIMIT 20
  skip: 0,                        // OFFSET 0
  select: { id: true, email: true },   // 只选这两个字段（返回类型自动变窄）
})

// 改一条
await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Alice2' },
})

// upsert：存在则改不存在则建
await prisma.user.upsert({
  where: { email: 'a@b.com' },
  update: { name: 'Alice2' },
  create: { email: 'a@b.com', name: 'Alice' },
})

// 删一条
await prisma.user.delete({ where: { id: 1 } })

// 批量改/删/计数
const n = await prisma.user.updateMany({ where: { role: 'USER' }, data: { active: false } })
const count = await prisma.user.count({ where: { active: true } })
```

- **`findUnique` 必须用唯一字段**（主键或 `@unique`）——它走索引，最快。用非唯一字段查用 `findFirst`。
- **`select` vs `include`**：`select` 选你要的字段（返回精简对象，类型变窄）；`include` 把整个关联模型带出来（返回完整关联）。可嵌套：`select: { posts: { select: { title: true } } }`。

## 三、筛选（where）操作符

```ts
where: {
  role: 'ADMIN',                              // 等值
  age: { gt: 18, lte: 65 },                   // > 18 且 <= 65
  name: { contains: 'li', mode: 'insensitive' },  // LIKE '%li%'（不区分大小写）
  email: { endsWith: '@gmail.com' },
  status: { in: ['ACTIVE', 'PENDING'] },      // IN (...)
  createdAt: { gte: new Date('2026-01-01') },
  AND: [{ age: { gt: 18 } }, { age: { lt: 65 } }],   // 显式 AND
  OR: [{ role: 'ADMIN' }, { age: { gt: 60 } }],      // OR
  NOT: { email: null },                       // NOT
}
```

操作符：`equals`/`not`/`in`/`notIn`/`lt`/`lte`/`gt`/`gte`/`contains`/`startsWith`/`endsWith`/`search`（全文检索，PG 用 `@@@`）/`is`/`isNot`（关联筛选）。

## 四、关系嵌套读取与写入

### 读取（include / select 嵌套）

```ts
// include：把用户的所有文章带出来（全字段）
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true },
})
// user.posts 是 Post[]

// select 嵌套：精简，只取需要的字段
const u = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    email: true,
    posts: { select: { id: true, title: true }, where: { published: true } },
  },
})
// 返回类型自动推断为 { id, email, posts: { id, title }[] }——TS 知道字段都在
```

- **关联筛选**：在 `include`/`select` 的关联上加 `where`，过滤关联对象（如只取已发布的文章）。Prisma 会生成 `LEFT JOIN ... WHERE` 或子查询。
- **N+1 警惕**：循环里调 `findUnique` 是 N+1 灾难；正确做法是一次 `findMany` + `include` 关联（Prisma 会优化成 join 或批量 IN 查询）。

### 写入（嵌套 create / connect）

```ts
// 建用户 + 同时建他的第一篇文章（一次调用，自动填外键）
const user = await prisma.user.create({
  data: {
    email: 'a@b.com',
    posts: {                            // 嵌套 create
      create: [{ title: 'Hello' }, { title: 'World' }],
    },
  },
  include: { posts: true },
})

// 建文章，关联到已存在的用户（connect）
await prisma.post.create({
  data: {
    title: 'New Post',
    author: { connect: { id: 1 } },     // 关联 userId=1
  },
})

// connectOrCreate：用户不存在则建，存在则关联
await prisma.post.create({
  data: {
    title: 'X',
    author: {
      connectOrCreate: { where: { email: 'a@b.com' }, create: { email: 'a@b.com' } },
    },
  },
})
```

嵌套写操作让"建主对象+关联"一次完成，避免多次调用+手动管外键。

## 五、事务

```ts
// ① 顺序批量事务：数组里所有操作要么全成功要么全回滚
const [a, b] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'a@b.com' } }),
  prisma.user.create({ data: { email: 'c@d.com' } }),
])

// ② 交互式事务：传回调，tx 是隔离的事务客户端，可读中间结果、有分支
const result = await prisma.$transaction(async (tx) => {
  const from = await tx.account.findUnique({ where: { id: 1 } })
  if (from.balance < 100) throw new Error('余额不足')     // 抛错 → 整个事务回滚
  await tx.account.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } })
  await tx.account.update({ where: { id: 2 }, data: { balance: { increment: 100 } } })
  return { ok: true }
}, { timeout: 10_000, isolationLevel: 'Serializable' })    // 可设超时和隔离级别
```

- **顺序批量**适合简单"几个独立写操作要原子"。
- **交互式**适合需要"读后判断再写"的逻辑（如转账：先查余额够不够）。
- **原子操作符**：`{ decrement: n }`/`{ increment: n }`/`{ multiply: n }`/`{ divide: n }`——把"读出来-算-写回"压成一条 `UPDATE ... SET balance = balance - 100`，避免读改写的竞态。

## 六、分页与排序

```ts
// offset 分页（简单，深翻页慢）
const page1 = await prisma.post.findMany({ take: 20, skip: 0, orderBy: { id: 'asc' } })
const page2 = await prisma.post.findMany({ take: 20, skip: 20, orderBy: { id: 'asc' } })

// 游标分页（深翻页快，要求有序且唯一）
const first = await prisma.post.findMany({ take: 20, orderBy: { id: 'asc' } })
const lastId = first[first.length - 1].id
const next = await prisma.post.findMany({
  take: 20,
  skip: 1,                  // 跳过游标本身
  cursor: { id: lastId },   // 从这个 id 之后开始
  orderBy: { id: 'asc' },
})
```

- **offset 分页**：`OFFSET N` 在深页（N 大）时要扫 N 行，慢——适合浅翻页。
- **游标分页**：用 `WHERE id > cursor ORDER BY id LIMIT N`，无论多深都扫 N 行——适合无限滚动、深翻页。

## 七、Prisma Accelerate：连接池与边缘缓存

Prisma Accelerate 是官方托管服务，解决 serverless/边缘场景的两个痛点：

1. **连接耗尽**：serverless（Vercel/Lambda）每次请求可能 new 一个 PrismaClient，PG 的 `max_connections`（如 100）很快被几十个并发实例占满。Accelerate 提供一个**全局连接池**，你的客户端通过 HTTPS 连 Accelerate，Accelerate 再用长连接池连数据库——客户端再多也不怕。
2. **边缘缓存**：开缓存后，相同的查询命中缓存直接返回（不查库），P95 可降到 <10ms。适合读多写少（配置、目录、文章列表）。

```ts
import { PrismaClient } from './generated/prisma/client'
import { PrismaAccelerate } from '@prisma/accelerate'

const prisma = new PrismaClient({
  accelerate: { url: process.env.ACCELERATE_URL },     // 走 Accelerate
})

// 命中缓存的查询
const users = await prisma.user.findMany({
  cacheStrategy: { ttl: 60, swr: 300 },     // 缓存 60s，stale-while-revalidate 300s
})
```

- **Prisma Postgres**：官方托管的 Postgres 服务（基于 Accelerate），开箱即用，免运维。也可连自托管 PG（部分功能如缓存要 SaaS）。
- **何时用 Accelerate**：serverless/边缘部署、读多写少、连接数紧张。自托管长连接后端（如 NestJS 跑在容器里）通常不需要，直接 driver adapter 连库即可。

## 下一步

掌握了 Prisma Client 后，可对照 [TypeORM](../../typeorm/) 与 [Drizzle ORM](../../drizzle/) 看 ORM 三大范式的取舍，或在 [参考](../reference) 速查 API 与易错点。
