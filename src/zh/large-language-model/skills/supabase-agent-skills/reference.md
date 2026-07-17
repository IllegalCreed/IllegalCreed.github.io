---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 supabase/agent-skills README 与两个 skills（`supabase` v0.1.2 / `supabase-postgres-best-practices` v1.1.1）编写。

## 速查

- **装（全部）**：`npx skills add supabase/agent-skills`
- **装（指定）**：`npx skills add supabase/agent-skills --skill supabase`
- **Claude 插件**：`claude plugin marketplace add supabase/agent-skills` → `claude plugin install supabase@supabase-agent-skills`
- **两个技能**：`supabase`（主，全产品 + 安全清单）· `supabase-postgres-best-practices`（Postgres 性能 8 类）
- **每技能结构**：`SKILL.md`（必需，YAML frontmatter + Markdown 指令）+ `references/`（可选）
- **格式**：遵 [agentskills.io](https://agentskills.io/) 开放标准；许可 MIT；作者 Supabase
- **兼容**：Claude Code、GitHub Copilot、Cursor、Cline 等 18+ agent

## 两个技能全表

| 技能 | 版本 | 触发（Use when） | 覆盖 |
| --- | --- | --- | --- |
| `supabase` | 0.1.2 | 任何 Supabase 任务：产品（Database/Auth/Edge Functions/Realtime/Storage/Vectors/Cron/Queues）、客户端库（supabase-js、@supabase/ssr，Next.js/React/SvelteKit/Astro/Remix）、auth 问题（login/logout/session/JWT/cookie/RLS）、CLI/MCP、schema/迁移/安全审计/扩展（pg_graphql、pg_cron、pg_vector） | 四大域：文档访问 / 安全 / 工具工作流 / schema 管理 |
| `supabase-postgres-best-practices` | 1.1.1 | 写/审/优化 Postgres 查询、schema、配置 | 8 类性能规则，每条含错误 vs 正确 SQL + EXPLAIN/指标 |

## 安装命令全表

| 目的 | 命令 |
| --- | --- |
| 装全部技能 | `npx skills add supabase/agent-skills` |
| 装主技能 | `npx skills add supabase/agent-skills --skill supabase` |
| 装 Postgres 技能 | `npx skills add supabase/agent-skills --skill supabase-postgres-best-practices` |
| 加插件市场 | `claude plugin marketplace add supabase/agent-skills` |
| 装 supabase 插件 | `claude plugin install supabase@supabase-agent-skills` |
| 装 postgres 插件 | `claude plugin install postgres-best-practices@supabase-agent-skills` |

## 四大核心域速览

| 域 | 核心 | 关键点 |
| --- | --- | --- |
| 文档访问 | 别信训练数据 | 先拉 `changelog.md` 扫 `breaking-change`；文档优先级 MCP `search_docs` → 页加 `.md` → Web 搜索 |
| 安全 | Supabase 专属清单 | 暴露 schema 每表开 RLS；`user_metadata` 不做授权；视图默认绕 RLS；`SECURITY DEFINER` 绕 RLS |
| 工具工作流 | CLI + MCP | CLI 用 `--help` 别猜；MCP 排障三步（可达 → 配置 → OAuth 鉴权） |
| schema 管理 | 声明式 vs 命令式 | 声明式改 `supabase/schemas/`；命令式用 `execute_sql` 迭代、别用 `apply_migration` 反复写 |

## 安全清单速查

| 类别 | 陷阱 | 正解 |
| --- | --- | --- |
| Auth | `user_metadata` 用户可改 | 授权数据放 `app_metadata` |
| Auth | 删用户不失效 token | 先登出/吊销会话，JWT 有效期设短 |
| API key | 前端暴露 `service_role` | 用 publishable key；`NEXT_PUBLIC_` 会进浏览器 |
| 视图 | 默认绕 RLS | PG15+ 加 `security_invoker = true` |
| RLS | UPDATE 缺 SELECT 策略 → 静默 0 行 | 补 SELECT 策略 |
| RLS | `TO authenticated` 只认证不授权（IDOR） | 配 `USING` 归属判断 |
| RLS | UPDATE 缺 `WITH CHECK` | `USING` + `WITH CHECK` 都写 |
| RLS | `auth.role()` 已废弃 | 用 `TO` 子句 |
| 函数 | `SECURITY DEFINER` 绕 RLS + public 人人可调 | 优先 `SECURITY INVOKER`；真需要则放非暴露 schema + 内部 `auth.uid()` 检查 |
| Storage | 只给 INSERT，upsert 静默失败 | INSERT + SELECT + UPDATE 三权限 |
| 依赖 | 未锁版本 | 锁版本 + 提交 lockfile |

## Postgres 8 类规则

| 优先级 | 类别 | 影响 | 前缀 | 代表规则 |
| --- | --- | --- | --- | --- |
| 1 | 查询性能 | CRITICAL | `query-` | WHERE/JOIN 列加索引、索引类型、覆盖/复合/部分索引 |
| 2 | 连接管理 | CRITICAL | `conn-` | 连接池（PgBouncer，transaction/session 模式）、连接上限、预处理语句 |
| 3 | 安全 & RLS | CRITICAL | `security-` | RLS 基础、RLS 性能（包 `(select auth.uid())`）、权限 |
| 4 | Schema 设计 | HIGH | `schema-` | 主键、数据类型、约束、外键索引、分区、小写标识符 |
| 5 | 并发 & 锁 | MEDIUM-HIGH | `lock-` | 咨询锁、短事务、skip locked、死锁预防 |
| 6 | 数据访问模式 | MEDIUM | `data-` | 消灭 N+1、批量插入、upsert、游标分页 |
| 7 | 监控 & 诊断 | LOW-MEDIUM | `monitor-` | pg_stat_statements、EXPLAIN ANALYZE、vacuum/analyze |
| 8 | 高级特性 | LOW | `advanced-` | 全文搜索、JSONB 索引 |

## CLI 命令速查

```bash
supabase --help                    # 所有顶层命令
supabase <group> --help            # 子命令
supabase db advisors               # 跑安全/性能顾问（v2.81.3+，否则 MCP get_advisors）
supabase migration new <name>      # 命令式项目建手写迁移
supabase db pull <name> --local --yes   # 从库生成迁移
supabase migration list --local    # 验证迁移
supabase --version                 # 查版本
```

版本门槛：`supabase db query` 需 v2.79.0+、`supabase db advisors` 需 v2.81.3+，缺则回退 MCP 工具。

## MCP Server 排障

```bash
# 查服务是否可达（401 = 在线且未鉴权，属预期）
curl -so /dev/null -w "%{http_code}" https://mcp.supabase.com/mcp
```

1. 查可达性（如上，401 属预期）
2. 查项目根 `.mcp.json` 指向 `https://mcp.supabase.com/mcp`
3. 触发 OAuth 2.1 鉴权流并重载会话

## 技能目录结构

```
agent-skills/
├── skills/
│   ├── supabase/
│   │   ├── SKILL.md              # 主技能：四大域 + 安全清单
│   │   └── references/           # 如 skill-feedback.md
│   └── supabase-postgres-best-practices/
│       ├── SKILL.md              # 8 类规则索引
│       └── references/           # query-*/conn-*/security-*/schema-* 等规则文件
├── AGENTS.md / CLAUDE.md         # 写 SKILL.md 的规范（frontmatter/结构）
└── ...
```

每个 `SKILL.md` = YAML frontmatter（`name` / `description` / 可选 `license` / `metadata.version`）+ Markdown 指令。`description` 是主要触发机制，写明「做什么 + 何时用」。

## `.well-known` 发布

每次 release 会随技能 tarball 上传 `dist/index.json`，符合 agent-skills `.well-known` URI 规范（schema v0.2.0），被 supabase.com 消费，在 `https://supabase.com/.well-known/agent-skills/` 提供技能。

## 许可与作者

- **许可**：MIT
- **作者 / 维护**：Supabase
- **格式**：遵 agentskills.io 开放标准

## 资源链接

- 仓库：[supabase/agent-skills](https://github.com/supabase/agent-skills)
- AI Skills 文档：[supabase.com/docs/guides/getting-started/ai-skills](https://supabase.com/docs/guides/getting-started/ai-skills)
- MCP 设置：[supabase.com/docs/guides/getting-started/mcp](https://supabase.com/docs/guides/getting-started/mcp)
- RLS 指南：[supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Agent Skills 标准：[agentskills.io](https://agentskills.io/)

## 下一步

- 返回 [入门](./getting-started) 或 [指南](./guide-line)
- 上游仓库：[supabase/agent-skills](https://github.com/supabase/agent-skills)
