---
layout: doc
outline: [2, 3]
---

# drizzle-kit 与 Studio：迁移、GUI、边缘运行时

> 基于 Drizzle ORM · 核于 2026-08

## 速查

- **drizzle-kit**：Drizzle 的迁移/管理 CLI——`generate`（生成迁移）、`push`（直推 schema 到库）、`migrate`（应用迁移）、`studio`（启 GUI）、`up`（拉取现有库生成 schema）。
- **drizzle.config.ts**：drizzle-kit 的配置文件——指定 dialect（postgresql/mysql/sqlite）、schema 路径、输出目录、数据库连接。
- **generate**：对比 schema.ts 与上一次迁移，生成 `.sql` 迁移文件 + 快照（journal 追踪历史）。
- **push**：跳过迁移文件，直接把当前 schema 同步到数据库（原型期/快速试验）。
- **migrate**：应用 migrations 目录下的 .sql 迁移（生产/CI）。
- **Drizzle Studio**：`drizzle-kit studio` 启动的本地 GUI——浏览/编辑表数据、查看 schema，类似 Prisma Studio。
- **边缘运行时友好**：Drizzle 无原生依赖、无装饰器元数据、轻量，原生跑 Cloudflare Workers（D1）/Vercel Edge/Neon serverless/Turso（libSQL）/Bun/Deno。
- **driver 多样**：`drizzle-orm/node-postgres`（Node pg）、`drizzle-orm/postgres-js`、`drizzle-orm/neon-http`（Neon serverless）、`drizzle-orm/d1`（Cloudflare D1）、`drizzle-orm/libsql`（Turso）、`drizzle-orm/bun-sqlite`。
- **事务**：`db.transaction(async (tx) => {...})`，tx 是事务客户端，抛错自动回滚。

## 一、drizzle.config.ts：配置

```ts
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema.ts',                  // schema 文件（可数组/glob）
  out: './drizzle',                           // 迁移输出目录
  dialect: 'postgresql',                      // postgresql / mysql / sqlite
  dbCredentials: {
    url: process.env.DATABASE_URL,            // 用于 push/migrate/studio 连库
  },
  verbose: true,
  strict: true,
} satisfies Config
```

- **`schema`**：你的 `pgTable` 定义文件（可多个，用数组或 glob）。
- **`out`**：迁移文件输出目录（生成 .sql + meta 快照）。
- **`dialect`**：决定用哪套 schema 构建器和驱动。
- **`dbCredentials`**：用于 `push`/`migrate`/`studio` 连库（`generate` 只读 schema 不连库）。

## 二、generate：生成迁移

```bash
drizzle-kit generate
```

- 对比 `schema.ts` 与上次迁移的快照（meta 目录），生成差异 SQL 迁移文件：
  - `drizzle/0000_xxx.sql`：实际 SQL（如 `CREATE TABLE users ...`）
  - `drizzle/meta/...`：快照与 journal（追踪迁移历史，用于后续 diff）
- **只读 schema 不连库**——所以不需要数据库凭证即可生成迁移。
- 类似 Prisma 的 `migrate dev`（生成部分）和 TypeORM 的 `migration:generate`。

### 迁移文件示例

```sql
-- drizzle/0000_create_users.sql
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "created_at" timestamp DEFAULT now()
);
```

## 三、push：直推 schema（无迁移文件）

```bash
drizzle-kit push
```

- 跳过迁移文件，直接把当前 schema 同步到数据库（CREATE/ALTER/DROP）。
- **适用**：原型期、探索期、本地开发库快速试验（schema 频繁变）。
- **不适用**：生产环境（无审计历史、无法回滚）、团队协作（拉不到迁移文件）。
- 类似 Prisma 的 `db push`、TypeORM 的 `schema:sync`。

## 四、migrate：应用迁移

```ts
// 应用迁移（生产/CI）
import { migrate } from 'drizzle-orm/node-postgres/migrator'

await migrate(db, { migrationsFolder: './drizzle' })
// 扫描 ./drizzle 目录，应用所有未应用的 .sql 迁移
```

- 在应用启动时调用（或 CI 单独跑），把 `out` 目录的迁移应用到数据库。
- 迁移记录存在 `__drizzle_migrations` 表（自动建），追踪已应用迁移。
- **生产用 migrate**（有审计、可重复），不用 push。

## 五、Drizzle Studio：GUI 浏览数据

```bash
drizzle-kit studio
```

- 启动本地 Web GUI（默认 `https://local.drizzle.studio`），连你的开发库。
- 功能：浏览表结构、查看/编辑表数据、运行查询——类似 Prisma Studio / TablePlus 的轻量版。
- **仅用于开发**（不要暴露生产库凭证到本地 Studio）。

## 六、边缘运行时集成

Drizzle 是边缘运行时友好的核心体现——同一个 schema，配不同 driver 跑在不同运行时：

```ts
// 1. Cloudflare Workers + D1（边缘 SQLite）
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'
export default {
  async fetch(req, env) {
    const db = drizzle(env.DB, { schema })          // env.DB 是 D1 binding
    const users = await db.select().from(schema.users)
    return Response.json(users)
  },
}

// 2. Neon serverless Postgres（Vercel Edge 友好）
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)          // HTTP 协议，无连接池
const db = drizzle(sql, { schema })

// 3. Turso libSQL（边缘 SQLite）
import { drizzle } from 'drizzle-orm/libsql'
const db = drizzle(process.env.LIBSQL_URL, { authToken: process.env.TOKEN })

// 4. Node.js + pg（传统后端）
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })
```

- **同一个 schema.ts**：换 driver 不改 schema 代码（只要 dialect 一致，如都是 postgresql 或都是 sqlite）。
- **无原生依赖**：Workers 等运行时不能加载 `.node` 二进制（这是 Prisma 6 在 Workers 不能用的原因），Drizzle 纯 JS/TS，无此限制。
- **无装饰器元数据**：不像 TypeORM 依赖 `emitDecoratorMetadata`（在受限运行时支持差），Drizzle 用普通函数调用。
- **冷启动快**：包小（核心几十 KB），适合 serverless 冷启动敏感场景。

## 七、事务

```ts
await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql\`balance - 100\` }).where(eq(accounts.id, 1))
  const from = await tx.select().from(accounts).where(eq(accounts.id, 1))
  if (from[0].balance < 0) throw new Error('余额不足')   // 抛错 → 自动回滚
  await tx.update(accounts).set({ balance: sql\`balance + 100\` }).where(eq(accounts.id, 2))
})
// 正常返回 → 提交；抛错 → 回滚
```

- **回调式**：传 async 回调，参数 `tx` 是事务客户端，所有操作用 `tx`（不是外层 `db`）。
- **抛错自动回滚**：回调内任何 throw 都触发回滚。
- **原子操作**：`set({ balance: sql\`balance - 100\` })` 用 `sql` 模板写原子表达式（避免读改写竞态）。

## 八、Drizzle 的取舍

- **适合**：会 SQL 的开发者、serverless/边缘部署、需要控 SQL 调优、追求轻量和冷启动速度、TypeScript 原生偏好。
- **不适合**：完全不想碰 SQL 的（Prisma 更抽象）、需要 OOP 实体+Repository 模式的（TypeORM）、需要官方托管服务（Accelerate）的（Prisma）。

## 下一步

掌握 Drizzle 后，可对照 [Prisma](../../prisma/) 与 [TypeORM](../../typeorm/) 看三大 ORM 范式的取舍，或在 [参考](../reference) 速查 schema 与 API。
