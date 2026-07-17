---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 supabase/agent-skills 官方 skills（`supabase` v0.1.2 + `supabase-postgres-best-practices` v1.1.1）与仓库 README 编写。

## 速查

- **是什么**：Supabase 官方 agent 技能集，遵 agentskills.io 格式、MIT，兼容 Claude Code/Copilot/Cursor 等 18+ agent
- **装（全部）**：`npx skills add supabase/agent-skills`
- **装（指定）**：`npx skills add supabase/agent-skills --skill supabase`
- **Claude 插件**：`claude plugin marketplace add supabase/agent-skills` → `claude plugin install supabase@supabase-agent-skills`
- **两个技能**：`supabase`（主技能，覆盖 Database/Auth/Edge Functions/Realtime/Storage/Vectors/Cron/Queues 全产品）·`supabase-postgres-best-practices`（Postgres 性能 8 类规则）
- **四大核心域**：① 文档访问（先查 changelog + 当前文档，别信训练数据）② 安全（Supabase 专属 RLS/权限清单）③ 工具工作流（CLI `--help` + MCP Server）④ schema 管理（声明式 vs 命令式迁移）
- **触发**：装后任务匹配自动激活；主技能 description 写明「Use when doing ANY task involving Supabase」
- **铁律**：实现后必须跑测试查询验证；失败 2-3 次就换方法别死循环

## 定位：给 AI agent 的 Supabase 说明书

Supabase Agent Skills 解决两个 AI agent 用 Supabase 的老问题：

1. **训练数据会过时**——Supabase 迭代快，函数签名、`config.toml` 配置、API 约定常在版本间变化。技能强制 agent 先查最新文档，而不是凭记忆写代码。
2. **安全陷阱多且静默**——Supabase 建在 Postgres + RLS 之上，很多坑（视图默认绕过 RLS、`user_metadata` 可被用户篡改、`SECURITY DEFINER` 绕权限）不会报错，只会静默留下漏洞。技能内置一份专属安全清单。

它不是通用 prompt，而是 Supabase 官方沉淀的、带明确触发条件的工程规范。

## 安装

### 安装全部技能

```bash
npx skills add supabase/agent-skills
```

### 安装指定技能

```bash
npx skills add supabase/agent-skills --skill supabase
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices
```

### 作为 Claude Code 插件安装

```bash
# 1. 添加 supabase/agent-skills 插件市场
claude plugin marketplace add supabase/agent-skills

# 2. 安装想要的插件
claude plugin install supabase@supabase-agent-skills
claude plugin install postgres-best-practices@supabase-agent-skills
```

装后技能自动可用——agent 检测到相关 Supabase 任务时调用，也可自然语言触发（如「帮我给这张表配 RLS」「优化这条 Postgres 查询」）。

## 两个技能速览

| 技能 | 版本 | 何时用 | 覆盖 |
| --- | --- | --- | --- |
| `supabase` | 0.1.2 | 任何 Supabase 任务 | 全产品线（Database/Auth/Edge Functions/Realtime/Storage/Vectors/Cron/Queues）、客户端库（supabase-js、@supabase/ssr）、CLI/MCP、schema 变更、安全审计 |
| `supabase-postgres-best-practices` | 1.1.1 | 写/审/优化 SQL 与 schema | Postgres 性能优化 8 类规则，按影响力从 CRITICAL 到 LOW 排序 |

## 四大核心域总览

主技能 `supabase` 的能力可归纳为四大域：

### 1. 文档访问（documentation access）

**核心原则：别信训练数据。** 实现任何 Supabase 特性前，按优先级找文档：

1. MCP `search_docs` 工具（首选，直接返回相关片段）
2. 把文档页当 markdown 拉取——任意文档页 URL 后加 `.md` 即可
3. Web 搜索——不知道看哪页时用

且实现前先拉 `https://supabase.com/changelog.md`（轻量摘要索引），扫与任务相关的 `breaking-change` 标签。

### 2. 安全（security，RLS 为核心）

一份 Supabase 专属安全清单，覆盖 Auth/会话、API key 暴露、RLS/视图/特权代码、Storage 访问控制、依赖供应链。核心如：暴露 schema 里每张表都要开 RLS、`user_metadata` 不可用于授权、视图默认绕 RLS。详见[指南](./guide-line)。

### 3. 工具工作流（tooling workflow）

- **Supabase CLI**：永远用 `--help` 发现命令、别猜；注意版本门槛（`supabase db query` 需 v2.79.0+）
- **Supabase MCP Server**：连接排障三步（查可达性 → 查 `.mcp.json` → OAuth 鉴权）

### 4. schema 管理

先判断项目用哪种工作流：**声明式**（有 `supabase/schemas/`，改期望状态再生成迁移）还是**命令式**（用 `execute_sql` 迭代，别用 `apply_migration` 反复写）。提交前跑 advisors + 过安全清单 + 生成迁移。

## 两条铁律

- **验证你的工作**：实现任何修复后，跑一条测试查询确认生效——「没验证的修复是未完成的修复」。
- **别死循环**：一种方法失败 2-3 次就停下重新考虑——换方法、查文档、更仔细看错误、必要时查日志。Supabase 的问题不总靠重试同一条命令解决。

## 下一步

- [指南](./guide-line) —— 四大域逐讲、安全清单细节、Postgres 最佳实践 8 类、反模式
- [参考](./reference) —— 技能清单、安装命令、四域速览、安全清单速查、许可与链接
