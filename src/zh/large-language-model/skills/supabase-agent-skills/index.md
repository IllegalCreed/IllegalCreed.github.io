---
layout: doc
---

# Supabase Agent Skills

Supabase Agent Skills（`supabase/agent-skills`）是 Supabase 官方出品的一组 AI 编码 agent 技能集，遵循 [agentskills.io](https://agentskills.io/) 开放格式，MIT 开源，兼容 Claude Code、GitHub Copilot、Cursor、Cline 等 18+ 个 AI agent。它把「怎样正确、安全地用 Supabase」这件事沉淀成可按需调用的技能——核心解决 AI agent 用 Supabase 时的两大痛点：**Supabase 变化快，训练数据会过时**（技能强制先查 changelog 与官方文档），以及 **Postgres/RLS 安全陷阱多**（技能内置一份 Supabase 专属安全清单）。仓库含两个技能：`supabase`（主技能，覆盖 Database/Auth/Edge Functions/Realtime/Storage/Vectors/Cron/Queues 全产品线）与 `supabase-postgres-best-practices`（Postgres 性能优化，8 类规则按影响力排序）。

## 评价

**优点**

- **官方沉淀**：由 Supabase 团队维护，规则来自实战而非泛泛而谈；`supabase` 主技能带明确触发词，`postgres-best-practices` 每条规则含「错误示例 vs 正确示例 + EXPLAIN/指标」
- **对抗训练数据过时**：主技能第一原则就是「Supabase 变化快，别信训练数据」——强制先拉 `changelog.md` 扫 `breaking-change` 标签，再查当前文档
- **安全清单是精华**：一份 Supabase 专属安全陷阱清单（`user_metadata` 不可用于授权、视图默认绕过 RLS、`TO authenticated` 只是认证不是授权、`SECURITY DEFINER` 绕 RLS、Storage upsert 需三权限……），照着过一遍能挡掉大量静默漏洞
- **Postgres 规则可执行且分级**：8 类规则按影响力从 CRITICAL（查询性能、连接管理、安全 RLS）到 LOW（高级特性）排序，让 agent「先做影响大的」
- **RLS 性能有量化**：把 `auth.uid()` 包进 `(select auth.uid())` 从「每行调用」变「调一次缓存」，大表 100x+ 提速
- **跨 agent**：`npx skills add` 装进 18+ agent，也可作 Claude Code 插件安装
- **schema 工作流清晰**：区分声明式（`supabase/schemas/`）与命令式迁移，明确「本地迭代用 `execute_sql`、别用 `apply_migration` 反复写」的坑

**缺点 / 边界**

- **绑 Supabase 生态**：主技能围绕 Supabase 产品与约定，非通用后端指南；`postgres-best-practices` 虽是通用 Postgres 知识但示例带 Supabase 语境
- **需配套工具**：很多能力依赖 Supabase CLI（部分命令有最低版本要求）或 Supabase MCP Server（需 OAuth 鉴权）才发挥完整价值
- **是规范不是自动化**：安全清单、Postgres 规则给的是「输入」，最终的 SQL/迁移仍要你写与验证——主技能反复强调「实现后必须跑测试查询验证」
- **两技能各有侧重**：`supabase` 偏产品用法与安全，`postgres-best-practices` 偏纯 Postgres 性能，按需装

## 适用场景

- 用 AI agent 做任何 Supabase 任务（建表、写 RLS、配 Auth、Edge Functions、迁移、安全审计）
- 想给 agent 一份「Supabase 安全清单」，避免 RLS / 视图 / `SECURITY DEFINER` / Storage 权限的静默漏洞
- 写、审、优化 Postgres 查询与 schema（索引、连接池、RLS 性能、N+1）
- 让 agent 别用过时的 API——强制先查 changelog 与当前文档
- 在 Claude Code / Cursor / Copilot 等 agent 里统一 Supabase 开发规范

## 边界

- **不是单个技能，是官方技能集**：两个技能（`supabase` + `supabase-postgres-best-practices`）各有触发条件，按需激活
- **绑 Supabase 平台**：主技能围绕 Supabase 产品与 CLI/MCP 工具链
- **规范不替代验证**：清单与规则是输入，SQL 与迁移仍要你写并跑测试验证
- **依赖工具版本**：`supabase db query` 需 CLI v2.79.0+、`supabase db advisors` 需 v2.81.3+，缺则回退 MCP

## 官方文档

[Supabase AI Skills 文档](https://supabase.com/docs/guides/getting-started/ai-skills) ｜ [MCP 设置指南](https://supabase.com/docs/guides/getting-started/mcp) ｜ [RLS 指南](https://supabase.com/docs/guides/database/postgres/row-level-security)

## GitHub 地址

[supabase/agent-skills](https://github.com/supabase/agent-skills)（MIT）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、两个技能速览、四大核心域总览
- [指南](./guide-line) —— 四大域逐讲（文档访问 / 安全 RLS / 工具工作流 / schema 管理）+ Postgres 最佳实践 + 反模式
- [参考](./reference) —— 技能清单、安装命令、四域速览、安全清单速查、许可与链接

## 幻灯片地址

<a href="/SlideStack/supabase-agent-skills-slide/" target="_blank">Supabase Agent Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=630" target="_blank" rel="noopener noreferrer">Supabase Agent Skills 测试题</a>
