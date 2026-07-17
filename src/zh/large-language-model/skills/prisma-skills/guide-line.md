---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 prisma/skills 官方各 `SKILL.md` 编写；Prisma ORM 7.6.x，`prisma-postgres` 追 7.7.x。

## 速查

- **日常两把**：`prisma-cli`（命令）+ `prisma-client-api`（查询）——建库/迁移/写查询靠它俩
- **建库三件**：`prisma-database-setup`（选 provider + 配 adapter）→ `prisma-postgres` / `prisma-postgres-setup`（专攻 Prisma Postgres）
- **Prisma 7 五变**：`prisma-client` 生成器 + 显式 `output` + **SQL 必须 driver adapter** + `prisma.config.ts` + 手动 env（dotenv）
- **写 adapter**：`prisma-driver-adapter-implementation`——`commit`/`rollback` **只是钩子不发 SQL**，Prisma 自己用 `executeRaw` 发 `COMMIT`/`ROLLBACK`；嵌套事务用 savepoint
- **升级**：`prisma-upgrade-v7`（v6→v7 十步）；MongoDB 例外 → `prisma-mongodb-upgrade`（v7 无 Mongo，迁 Prisma Next 或守 v6）
- **部署**：`prisma-compute`（`app deploy` / `compute:deploy` / `create-prisma --deploy`），与 `prisma-cli` 分工
- **反模式**：MongoDB 升 v7、忘装 adapter、`commit()` 里发 SQL、照抄 Compute 命令不核版本

## 日常：prisma-cli + prisma-client-api

### prisma-cli：命令全参考

覆盖 Prisma ORM 全命令，按优先级分级（迁移类为 CRITICAL）：

| 类别 | 命令 |
| --- | --- |
| 建项目 | `init`（`--datasource-provider` / `--db` / `--with-model`） |
| 生成 | `generate`（`--watch`） |
| 本地库 | `dev`（本地 Prisma Postgres，`--name` / `--detach` / `ls` / `stop`） |
| 数据库 | `db pull` / `db push` / `db seed` / `db execute` |
| 迁移 | `migrate dev` / `migrate deploy` / `migrate reset` / `migrate status` / `migrate diff` |
| 工具 | `studio` / `mcp`（给 AI 工具的 MCP server）/ `validate` / `format` / `debug` |

用 Bun 时命令要带 `--bun`（`bunx --bun prisma generate`），否则因 CLI shebang 回落到 Node.js。**边界**：应用部署命令（`app deploy` 等）不在这里，走 `prisma-compute`。

### prisma-client-api：查询全参考

Client API 参考，按优先级把「模型查询、事务、原始 SQL」列为 CRITICAL：

- **模型方法**：`findUnique` / `findFirst` / `findMany` / `create` / `createMany` / `update` / `upsert` / `delete` / `count` / `aggregate` / `groupBy` 等
- **查询选项**：`where` / `select` / `include` / `omit` / `orderBy` / `take` / `skip` / `cursor` / `distinct`
- **过滤操作符**：`equals` / `in` / `lt` / `gt` / `contains` / `startsWith` / `mode`（大小写）
- **关系过滤**：`some` / `every` / `none`（1-N）、`is` / `isNot`（1-1）
- **事务**：数组式 `$transaction([...])` 与交互式 `$transaction(async (tx) => ...)`
- **原始 SQL**：`$queryRaw` / `$executeRaw`（用模板串防注入）
- **生命周期**：`$connect` / `$disconnect` / `$on` / `$extends`（扩展，取代 v6 的中间件）

## 建库：database-setup + postgres

### prisma-database-setup

按 provider 给配置。支持 PostgreSQL / MySQL / SQLite / MongoDB / SQL Server / CockroachDB / Prisma Postgres。核心是 **SQL 库要配对应的 driver adapter**：

| 数据库 | Adapter | JS 驱动 |
| --- | --- | --- |
| PostgreSQL / CockroachDB | `@prisma/adapter-pg` | `pg` |
| Prisma Postgres（Node） | `@prisma/adapter-pg` | `pg` |
| Prisma Postgres（边缘/无服务器） | `@prisma/adapter-ppg` | `@prisma/ppg` |
| MySQL / MariaDB | `@prisma/adapter-mariadb` | `mariadb` |
| SQLite | `@prisma/adapter-better-sqlite3` | `better-sqlite3` |
| SQLite（Turso/LibSQL） | `@prisma/adapter-libsql` | `@libsql/client` |
| SQL Server | `@prisma/adapter-mssql` | `node-mssql` |

> **MongoDB 例外**：不走 SQL adapter，留在 Prisma 6.x，schema 里保留 `url = env("DATABASE_URL")`，用经典 `db push` 流程。

### prisma-postgres / prisma-postgres-setup

Prisma Postgres 的多种接入方式：

- **Console 优先**：`https://console.prisma.io` 建工作区/项目，侧栏 Studio 看数据
- **秒建临时库**：`npx create-db@latest`（别名 `create-pg` / `create-postgres`），临时库约 24 小时后自动删除，除非认领
- **持久库（属于项目）**：`npx @prisma/cli@latest database create main --branch main`，打印一次性连接串要立即存
- **接现有库**：`prisma postgres link`（CI 用 `--api-key` + `--database`），会更新本地 `.env` 的 `DATABASE_URL`
- **编程式**：Management API（`https://api.prisma.io/v1`，服务令牌或 OAuth）+ 类型化 SDK `@prisma/management-api-sdk`

## Prisma 7 五大破坏性变更

`prisma-upgrade-v7` 把 v6→v7 拆成十步，核心是五个必改点：

| 变更 | v6 | v7 |
| --- | --- | --- |
| 生成器 | `prisma-client-js` | `prisma-client`（新默认；js 仅遗留） |
| 输出路径 | 自动（node_modules） | **必须显式** `output = "../generated"` |
| Driver adapter | 可选 | **SQL 库必需** |
| 配置 | `.env` + schema | `prisma.config.ts` |
| env 加载 | 自动 | **手动**（`import 'dotenv/config'`） |

此外：ESM 优先（需 CJS 则生成器加 `moduleFormat = "cjs"`）；生成入口拆成 `client` / `browser` / `models` / `enums`；`Prisma.validator()` 换成 TypeScript `satisfies`；中间件 `$use()` 换成 Client Extensions；metrics 预览特性移除。要求 Node.js 20.19.0+、TypeScript 5.4.0+。

v7 客户端实例化（PostgreSQL 为例）：

```typescript
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
```

> 本仓库（quiz-monorepo）自身就是 Prisma 7 + MariaDB adapter 的实例——`prisma.config.ts` 配置、`PrismaMariaDb` adapter 接线，正是这个技能描述的范式。

## 写 adapter：driver-adapter-implementation

这是「含不可从代码推断的契约」的技能——实现自定义 SQL driver adapter 的硬约束。核心接口从 `@prisma/driver-adapter-utils` 导入：`SqlDriverAdapter`、`Transaction`、`SqlMigrationAwareDriverAdapterFactory`、`SqlQuery`、`SqlResultSet`、`ColumnTypeEnum`、`DriverAdapterError`。

分层：`Factory`（`connect()` + `connectToShadowDb()`）→ `SqlDriverAdapter`（`queryRaw` / `executeRaw` / `startTransaction` / `executeScript` / `dispose`）→ `Transaction`（继承 `SqlQueryable` + `commit` / `rollback`）。

**最容易踩的契约**——事务生命周期协议：

> `commit()` 和 `rollback()` **只是生命周期钩子，绝不能发 SQL**。Prisma 会自己通过事务对象上的 `executeRaw` 发送 `COMMIT` / `ROLLBACK`。你的 `commit()` 里只做释放连接（release），不要写 `client.query('COMMIT')`。

其它要点：嵌套事务用 savepoint（depth 1 发 `BEGIN`，depth > 1 发 `SAVEPOINT`）；每列类型要映射到 `ColumnTypeEnum`（`Int32=0` … `UuidArray=78`）；驱动错误要转成 `DriverAdapterError`；隔离级别要校验。

## MongoDB：唯一没有 v7 路的队列

`prisma-mongodb-upgrade` 专门拦一个错误计划：**MongoDB 项目不能升 Prisma 7**。

| 版本 | MongoDB 状态 |
| --- | --- |
| Prisma v6 | 完整支持（`mongodb` provider），维护线 |
| Prisma v7 | **永无 Mongo 连接器——不是选项** |
| Prisma Next | Mongo 处于 Early Access，Postgres GA 后跟进——后继路 |

两条铁律：**绝不**建议 MongoDB 项目「升到 Prisma 7」；**绝不**为解决版本问题把应用改写到 SQL 库（换引擎是另一个大得多的决定）。真正的决策是「迁 Prisma Next（鼓励）还是守最新 v6（有硬阻断时合理，如事务门面尚未包好）」。

## 部署：prisma-compute

Prisma 应用的部署/托管，用 Prisma Platform CLI：`@prisma/cli app deploy`、生成的 `compute:deploy` 脚本、`create-prisma --deploy` 脚手架。框架就绪度覆盖 Hono / Elysia / Next.js / TanStack Start / Astro / Nuxt / Svelte / Nest / Turborepo。**要求 agent 先核对当前 CLI 与 `create-prisma` 命令面再动手**，不照抄。与 `prisma-cli` 分工：ORM/数据库命令归 CLI，应用部署归 Compute。

## 反模式清单

- **把 MongoDB 项目升 Prisma 7**——v7 无 Mongo 连接器，走 v6 或 Prisma Next
- **SQL 库忘装 driver adapter**——v7 里 adapter 是必需的，不是可选
- **在 `commit()` / `rollback()` 里发 SQL**——它们只是钩子，Prisma 自己发 `COMMIT` / `ROLLBACK`
- **升 v7 后仍用自动 env**——v7 要手动 `import 'dotenv/config'` 并用 `prisma.config.ts`
- **照抄 Compute 命令不核版本**——Compute 追活跃发布流，先核对当前命令面
- **拿 `prisma-cli` 干部署**——部署走 `prisma-compute`，别混

## 下一步

- [参考](./reference) —— 9 技能全表 + 触发词、Prisma 7 变更表、driver adapter 表、许可与链接
- 上游：[升级到 Prisma 7](https://www.prisma.io/docs/orm/more/upgrades/to-v7) · [Driver Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
