---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 prisma/skills 官方仓库（Prisma ORM 团队，MIT）的 README、AGENTS.md 与各 `SKILL.md` 编写；ORM 技能锁定 Prisma ORM 7.6.x。

## 速查

- **装**：`npx skills add prisma/skills`（Claude Code / Cursor / Codex 等），或 `--skill prisma-cli` 单装、`--list` 列出
- **9 技能**：`prisma-cli`（命令）·`prisma-client-api`（查询）·`prisma-database-setup`（建库）·`prisma-postgres`（Postgres）·`prisma-postgres-setup`（Postgres 建库）·`prisma-driver-adapter-implementation`（写 adapter）·`prisma-upgrade-v7`（升级）·`prisma-mongodb-upgrade`（Mongo 决策）·`prisma-compute`（部署）
- **渐进披露**：启动只加载 name + description，`SKILL.md` 按需载入（建议 < 500 行，细节放 `references/`）
- **触发**：装后自动激活（任务匹配），也可直接说「Run Prisma migrations」「Upgrade my project to Prisma 7」「How do I use transactions in Prisma?」
- **Prisma 7 关键**：`prisma-client` 新生成器 + 必须显式 `output` + **SQL 库必须装 driver adapter** + `prisma.config.ts` + 手动加载 env
- **版本**：ORM 技能 7.6.x；`prisma-postgres` 追 7.7.x；Node.js 20.19.0+、TypeScript 5.4.0+

## 安装

安装全部技能：

```bash
npx skills add prisma/skills
```

按需单装某个技能：

```bash
npx skills add prisma/skills --skill prisma-cli
npx skills add prisma/skills --skill prisma-upgrade-v7
npx skills add prisma/skills --skill prisma-client-api
```

列出可装 / 已装技能：

```bash
npx skills add prisma/skills --list   # 可装
npx skills list                       # 已装
```

装后技能自动可用——agent 检测到相关任务时调用，也可用自然语言显式触发。

## 9 个技能速览

| 技能 | 何时用 | 一句话 |
| --- | --- | --- |
| `prisma-cli` | 跑 Prisma 命令、建项目、迁移 | `init`/`generate`/`dev`/`migrate`/`db`/`studio`/`mcp` 全命令参考 |
| `prisma-client-api` | 写查询、CRUD、事务 | `findMany`/`create`/`$transaction`/`$queryRaw` + 过滤/关系/分页 |
| `prisma-database-setup` | 建新项目、换库、连不上 | PostgreSQL/MySQL/SQLite/MongoDB/SQL Server/CockroachDB 配置 + adapter 表 |
| `prisma-postgres` | 开 Prisma Postgres、秒建库 | Console / `create-db` / `postgres link` / Management API + SDK |
| `prisma-postgres-setup` | Prisma Postgres 从零接入 | Prisma Postgres 的建库与客户端接线细节 |
| `prisma-driver-adapter-implementation` | 实现自定义 SQL adapter | `SqlDriverAdapter`/`Transaction` 接口契约 + 事务生命周期协议 |
| `prisma-upgrade-v7` | Prisma 6 升 7 | 逐步迁移全部破坏性变更（生成器/adapter/config/ESM） |
| `prisma-mongodb-upgrade` | MongoDB 项目问升级 | v7 无 Mongo 连接器——留 v6 还是迁 Prisma Next 的决策 |
| `prisma-compute` | 部署 Prisma 应用 | `@prisma/cli app deploy`/`compute:deploy`/`create-prisma --deploy` |

## 渐进披露：为什么省 token

Skills 遵循 agentskills.io 的**渐进披露**原则：

1. **启动时**——只加载每个技能的 `name` 与 `description`（一两行），几乎不占上下文
2. **判定相关时**——agent 才把该技能完整的 `SKILL.md` 载入上下文
3. **需要细节时**——`SKILL.md` 里指向 `references/{category}-{rule}.md`，用到哪条读哪条

所以官方建议 `SKILL.md` 保持在 500 行以内、写具体的 description（含触发词），把长解释与代码例子放进 `references/`。这样装 9 个技能也不会一次性撑爆上下文。

## 触发示例：自然语言即可

装好后，直接用日常语言描述任务，agent 自动挑对应技能：

```text
Help me run Prisma migrations in production   → prisma-cli
Upgrade my project from Prisma 6 to Prisma 7  → prisma-upgrade-v7
How do I use transactions in Prisma?          → prisma-client-api
Set up Prisma with PostgreSQL                 → prisma-database-setup
```

## 技能的目录结构

每个技能是一个 kebab-case 目录（`prisma-` 前缀），含：

```text
prisma-{skill-name}/
├── SKILL.md          # 必需：YAML frontmatter（name/description/license/metadata）+ 指令
└── references/       # 可选：{category}-{rule}.md，逐条细化，含好/坏代码对比
```

`SKILL.md` 的 frontmatter 长这样：

```yaml
---
name: prisma-cli
description: Prisma ORM CLI commands reference... Triggers on "prisma init", "prisma migrate".
license: MIT
metadata:
  author: prisma
  version: "7.6.0"
---
```

## 下一步

- [指南](./guide-line) —— 各技能分组深入、Prisma 7 五大破坏性变更、driver adapter 事务坑、反模式
- [参考](./reference) —— 9 技能全表 + 触发词、Prisma 7 变更表、driver adapter 表、许可与链接
