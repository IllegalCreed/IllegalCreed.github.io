---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 prisma/skills 官方 README、AGENTS.md 与各 `SKILL.md` 编写。

## 速查

- **装**：`npx skills add prisma/skills`；单装 `--skill <name>`；列出 `--list`
- **9 技能**：cli / client-api / database-setup / postgres / postgres-setup / driver-adapter-implementation / upgrade-v7 / mongodb-upgrade / compute
- **每技能**：`SKILL.md`（必，frontmatter: name/description/license/metadata）+ `references/`（可选，driver-adapter-implementation 无）
- **版本**：ORM 技能 7.6.x；`prisma-postgres` 7.7.x；`prisma-compute` 1.4.1；`prisma-mongodb-upgrade` 0.1.0
- **前置**：Node.js 20.19.0+、TypeScript 5.4.0+；遵 agentskills.io；MIT；Prisma 官方出品

## 9 技能全表

| 技能 | 触发词 | 覆盖 |
| --- | --- | --- |
| `prisma-cli` | prisma init / migrate / db / studio / mcp | `init`/`generate`/`dev`/`migrate`/`db`/`studio`/`mcp`/`validate`/`format`/`debug`；`--bun` 说明 |
| `prisma-client-api` | prisma query / findMany / $transaction | CRUD、`select`/`include`/`omit`、过滤/关系操作符、事务、`$queryRaw`、`$extends` |
| `prisma-database-setup` | configure postgres / connect mysql / sqlite setup | 6+ provider 配置、driver adapter 表、客户端生成与实例化 |
| `prisma-postgres` | create prisma postgres / create-db / management api | Console、`create-db`、`postgres link`、Management API + SDK |
| `prisma-postgres-setup` | prisma postgres setup | Prisma Postgres 从零建库与客户端接线 |
| `prisma-driver-adapter-implementation` | implement adapter / SqlDriverAdapter / Transaction | 接口契约、事务生命周期协议、`ColumnTypeEnum` 映射、错误转换、验证清单 |
| `prisma-upgrade-v7` | upgrade to prisma 7 / prisma-client generator / driver adapter required | v6→v7 十步迁移、全部破坏性变更、故障排查 |
| `prisma-mongodb-upgrade` | prisma 7 mongodb / mongodb prisma migration / prisma next mongodb | v6 终点 + v7 无 Mongo + Prisma Next 决策表 |
| `prisma-compute` | prisma compute / app deploy / compute:deploy / create-prisma --deploy | Compute 部署、框架就绪度、SDK/API、故障排查 |

## Prisma 7 破坏性变更表

| 变更 | v6 | v7 |
| --- | --- | --- |
| 模块格式 | 隐式/混合 | ESM 优先，`moduleFormat = "cjs"` 可退 |
| 生成器 | `prisma-client-js` | `prisma-client`（默认；js 仅遗留） |
| 输出路径 | 自动（node_modules） | 必须显式 `output` |
| Driver adapter | 可选 | SQL 库必需 |
| 配置文件 | `.env` + schema | `prisma.config.ts` |
| env 加载 | 自动 | 手动（dotenv） |
| 生成入口 | 单包导出 | `client` / `browser` / `models` / `enums` |
| 类型安全片段 | `Prisma.validator()` | TypeScript `satisfies` |
| 中间件 | `$use()` | Client Extensions |
| Metrics | 预览特性 | 移除 |

## Driver Adapter 选型表

| 数据库 | Adapter | JS 驱动 |
| --- | --- | --- |
| PostgreSQL / CockroachDB | `@prisma/adapter-pg` | `pg` |
| Prisma Postgres（Node） | `@prisma/adapter-pg` | `pg` |
| Prisma Postgres（边缘/无服务器） | `@prisma/adapter-ppg` | `@prisma/ppg` |
| MySQL / MariaDB | `@prisma/adapter-mariadb` | `mariadb` |
| SQLite | `@prisma/adapter-better-sqlite3` | `better-sqlite3` |
| SQLite（Turso/LibSQL） | `@prisma/adapter-libsql` | `@libsql/client` |
| SQL Server | `@prisma/adapter-mssql` | `node-mssql` |
| Neon | `@prisma/adapter-neon` | — |

## 安装命令

```bash
# 全装
npx skills add prisma/skills

# 单装
npx skills add prisma/skills --skill prisma-cli
npx skills add prisma/skills --skill prisma-upgrade-v7

# 列出可装 / 已装
npx skills add prisma/skills --list
npx skills list
```

## driver adapter 事务契约（关键）

```typescript
// commit/rollback 只是钩子——不发 SQL！
commit(): Promise<void> {
  // 不要写 client.query('COMMIT')——Prisma 用 executeRaw 自己发
  this.release()          // 只释放连接
  return Promise.resolve()
}
```

嵌套事务：depth 1 → `BEGIN`；depth > 1 → `SAVEPOINT`。列类型映射到 `ColumnTypeEnum`（`Int32=0`…`UuidArray=78`）。驱动错误转 `DriverAdapterError`。

## 目录结构

```text
prisma/skills（仓库根，非 skills/ 子目录）
├── prisma-cli/SKILL.md + references/
├── prisma-client-api/SKILL.md + references/
├── prisma-database-setup/SKILL.md + references/
├── prisma-postgres/SKILL.md + references/
├── prisma-postgres-setup/SKILL.md + references/
├── prisma-driver-adapter-implementation/SKILL.md   # 单文件，无 references/
├── prisma-upgrade-v7/SKILL.md + references/
├── prisma-mongodb-upgrade/SKILL.md + references/
├── prisma-compute/SKILL.md + references/
├── README.md / AGENTS.md / CLAUDE.md
└── LICENSE（MIT）
```

## 许可与出品

- **许可**：MIT
- **出品**：Prisma（Prisma ORM 团队）；`prisma-driver-adapter-implementation` 作者标注 Tyler Benfield
- **格式**：agentskills.io 开放格式，兼容 `npx skills add`

## 资源链接

- 仓库：[prisma/skills](https://github.com/prisma/skills)
- Prisma 文档：[prisma.io/docs](https://www.prisma.io/docs)
- 升级到 v7：[to-v7](https://www.prisma.io/docs/orm/more/upgrades/to-v7)
- Driver Adapters：[database-drivers](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- Prisma Postgres：[postgres](https://www.prisma.io/docs/postgres)
- Prisma Config：[prisma-config-reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
