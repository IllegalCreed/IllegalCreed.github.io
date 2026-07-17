---
layout: doc
---

# dbt Agent Skills

dbt Agent Skills（`dbt-labs/dbt-agent-skills`）是 dbt Labs 官方出品的一组 AI agent 技能集，遵循 agentskills.io 开放格式，Apache-2.0 开源。dbt 是 SQL 化的数据转换工具（analytics engineering，分析工程），这个技能集把「用 dbt 干活」的专业知识打包成可按需调用的技能——从建/改 dbt 模型、写单元测试、探数据源（分析工程），到用 **MetricFlow** 建 metrics/dimensions/semantic models（语义层）、多项目 **dbt Mesh** 治理、排查平台 job 失败，再到迁移到 **dbt Fusion** 引擎。技能装后由 agent 在任务匹配时**自动加载**（多数 `user-invocable: false`，不是 slash 命令），你只需用自然语言描述需求，agent 处理其余。

## 评价

**优点**

- **官方沉淀**：dbt Labs 亲自维护，规则来自 dbt 团队对分析工程/语义层/Mesh/迁移的最佳实践，而非社区泛化 prompt
- **覆盖 dbt 全流程**：12 个技能分 3 组，从建模、测试、语义层到平台运维、跨引擎/跨平台迁移全链路都有
- **强约定即护栏**：把「用 `build` 而非 `run`」「优先 latest spec」「单测优先 `dict` 格式」「别为过测试而改测试」这类专家习惯写进技能，让 agent 少踩坑
- **自动激活**：靠每个 `SKILL.md` frontmatter 的 `description`（`Use when…`）判断触发，无需记技能名
- **迁移长尾也覆盖**：`migrating-dbt-core-to-fusion`（分诊而非盲修）、`migrating-dbt-project-across-platforms`（靠 Fusion 实时编译做方言转换）覆盖高价值一次性任务
- **跨 agent**：`npx skills add`（Vercel Skills CLI，支持 30+ agent）或 `/plugin`（Claude Code）或 Tessl 都能装

**缺点 / 边界**

- **需 dbt 基础**：多数技能假设 dbt 已装配、有 `dbt_project.yml`、你懂模型/测试/源等概念
- **部分特性绑商业方案**：跨项目 `ref()` 需 **dbt Cloud Enterprise**；remote MCP server 需 dbt 平台账号且消耗 dbt Copilot credits
- **语义层双 spec 版本敏感**：latest spec（Core 1.12+/Fusion）与 legacy spec（Core 1.6–1.11）语法不同，用错会解析失败
- **是知识与流程规范，不是执行器**：技能给正确的命令、YAML、分诊路径，真正跑 dbt、连仓库、改数据仍要你的环境

## 适用场景

- 让 AI agent 帮你写/改 dbt 模型与 SQL 转换、加单元测试、跑 dbt 命令（分析工程）
- 用 MetricFlow 搭语义层（metrics/dimensions/semantic models），或用自然语言查语义层回答业务问题
- 多项目 dbt Mesh：跨项目 `ref()`、契约（contracts）、访问控制（access）、模型版本化（versions）
- 排查 dbt Cloud/平台 job 失败，或配置 dbt MCP server 让 Claude/Cursor/VS Code 连上 dbt
- 一次性迁移：dbt Core → Fusion 引擎，或跨数据平台（如 Snowflake ↔ Databricks）

## 边界

- **不是单个技能，是官方技能集**：12 个技能各有触发条件，按需激活
- **多为 `user-invocable: false`**：自动加载，不是手动 slash 命令
- **迁移类是一次性**：`dbt-migration` 组的技能通常一个迁移项目用一次，不必每次会话都装
- **相邻叶**：技能格式与生态见 [Agent Skills 规范](../agent-skills-spec/) 与 [Vercel Agent Skills](../vercel-agent-skills/)（skills CLI 同源）

## 官方文档

[dbt 文档](https://docs.getdbt.com/) ｜ [dbt CLI 参考](https://docs.getdbt.com/reference/dbt-commands) ｜ [Agent Skills 官网](https://agentskills.io/home) ｜ [Agent Skills 规范](https://agentskills.io/specification)

## GitHub 地址

[dbt-labs/dbt-agent-skills](https://github.com/dbt-labs/dbt-agent-skills)（Apache-2.0）

## 内容地图

- [入门](./getting-started) —— 定位、`/plugin` 与 `npx skills add` 安装、12 技能 3 组总览
- [指南](./guide-line) —— 三组逐讲（分析工程 / 语义层 / Mesh / 平台运维 / 迁移 / extras）+ 反模式
- [参考](./reference) —— 技能清单表、安装命令、MetricFlow、Fusion、许可与链接

## 幻灯片地址

<a href="/SlideStack/dbt-agent-skills-slide/" target="_blank">dbt Agent Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=633" target="_blank" rel="noopener noreferrer">dbt Agent Skills 测试题</a>
