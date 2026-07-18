---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 anthropics/knowledge-work-plugins 主分支（2026-07）的 README 与各插件目录、SKILL.md 编写。

## 速查

- **是什么**：Anthropic 官方知识工作插件集市（`anthropics/knowledge-work-plugins`），Apache 2.0；为 Claude Cowork 设计、兼容 Claude Code
- **规模**：18 个顶层插件目录 / **212 个 SKILL.md** / README 主推 **11 个官方插件**
- **装（Cowork）**：在 [claude.com/plugins](https://claude.com/plugins/) 一键装
- **装（Claude Code）**：先 `claude plugin marketplace add anthropics/knowledge-work-plugins`，再 `claude plugin install <plugin>@knowledge-work-plugins`
- **11 主推**：productivity / sales / customer-support / product-management / marketing / legal / finance / data / enterprise-search / bio-research / cowork-plugin-management
- **三件结构**：`.claude-plugin/plugin.json`（清单，必有 `name`）+ `.mcp.json`（连接器）+ `skills/*/SKILL.md`（自动激活知识）+ `commands/*.md`（slash 命令，旧格式）
- **激活**：装后自动激活——Skills 按相关性自动触发，Commands 显式调用（如 `/sales:call-prep`、`/data:write-query`）

## 定位：Anthropic 官方「角色插件」集市

Knowledge Work Plugins 把 Claude 从「通用助手」升级成「岗位专家」——每个插件对应一个**角色**：销售、客服、产品经理、市场、法务、财务、数据分析师、企业搜索者、生物科研者、个人生产力、插件开发者。每个插件打包了：

- **Skills**：领域知识与最佳实践，Claude 检测到相关任务时**自动加载**
- **Commands**：显式触发的 slash 命令（如 `/finance:reconciliation`、`/product-management:write-spec`）
- **Connectors**：通过 [MCP servers](https://modelcontextprotocol.io/) 把 Claude 接到 Slack / Notion / Jira / Snowflake / HubSpot 等外部工具

整套体系**纯文件**——Markdown + JSON，无代码、无构建、无基础设施。

## 安装

### Cowork

在 [claude.com/plugins](https://claude.com/plugins/) 浏览并直接安装。

### Claude Code

```bash
# 第一步：把集市加进来
claude plugin marketplace add anthropics/knowledge-work-plugins

# 第二步：装某个具体插件（如 sales）
claude plugin install sales@knowledge-work-plugins
```

装好后插件自动激活——技能按相关性触发，slash 命令在会话里直接可用，例如 `/sales:call-prep`、`/data:write-query`。

## 11 个主推插件速览

| 插件 | 一句话 | 典型连接器 |
| --- | --- | --- |
| **productivity** | 管理任务、日历、日常流程、个人上下文 | Slack、Notion、Asana、Linear、Jira、Monday、ClickUp、Microsoft 365 |
| **sales** | 调研客户、备战通话、review pipeline、起草触达、做竞品 battlecard | Slack、HubSpot、Close、Clay、ZoomInfo、Notion、Jira、Fireflies、Microsoft 365 |
| **customer-support** | 分流工单、起草回复、打包升级、客户背景调研、把已解决案例变 KB 文档 | Slack、Intercom、HubSpot、Guru、Jira、Notion、Microsoft 365 |
| **product-management** | 写 PRD、规划路线图、合成用户研究、同步干系人、跟踪竞品 | Slack、Linear、Asana、Monday、ClickUp、Jira、Notion、Figma、Amplitude、Pendo、Intercom、Fireflies |
| **marketing** | 起草内容、规划活动、统一品牌调性、竞品简报、跨渠道效果 | Slack、Canva、Figma、HubSpot、Amplitude、Notion、Ahrefs、SimilarWeb、Klaviyo |
| **legal** | 审合同、分流 NDA、合规导航、风险评估、会议准备、模板回复 | Slack、Box、Egnyte、Jira、Microsoft 365 |
| **finance** | 凭证录入、对账、生成财报、差异分析、月结管理、支持审计 | Snowflake、Databricks、BigQuery、Slack、Microsoft 365 |
| **data** | 查询、可视化、解读数据集——SQL、统计分析、dashboard、share 前自检 | Snowflake、Databricks、BigQuery、Definite、Hex、Amplitude、Jira |
| **enterprise-search** | 跨邮件、聊天、文档、wiki 一站式搜公司所有工具 | Slack、Notion、Guru、Jira、Asana、Microsoft 365 |
| **bio-research** | 接 PubMed / bioRxiv / ChEMBL / Benchling 等临床前工具，加速早期生命科学研发 | PubMed、BioRender、bioRxiv、ClinicalTrials.gov、ChEMBL、Synapse、Wiley、Owkin、Open Targets、Benchling |
| **cowork-plugin-management** | 创建新插件或定制现有插件 | — |

## 仓库实际目录（按 skill 数）

| 目录 | SKILL.md 数 | 角色 |
| --- | --- | --- |
| partner-built | 71 | 合作方插件集 |
| small-business | 31 | 小企业工具 |
| data | 10 | 数据分析 |
| engineering | 10 | 工程 |
| human-resources | 9 | 人力资源 |
| legal | 9 | 法务 |
| sales | 9 | 销售 |
| operations | 9 | 运营 |
| marketing | 8 | 市场 |
| product-management | 8 | 产品 |
| finance | 8 | 财务 |
| design | 7 | 设计 |
| bio-research | 6 | 生物科研 |
| customer-support | 5 | 客服 |
| enterprise-search | 5 | 企业搜索 |
| productivity | 4 | 生产力 |
| cowork-plugin-management | 2 | 插件管理 |
| pdf-viewer | 1 | PDF 查看 |

> **11 主推**来自 README 的「Plugin Marketplace」表；**partner-built / small-business / operations / human-resources / design / engineering / pdf-viewer** 等是仓库自带的扩展层（README 未列详）。本叶「领域数」据实写 **18 个顶层目录、212 个 SKILL.md、11 个主推**。

## 三件结构

每个插件遵循同一布局：

```text
plugin-name/
├── .claude-plugin/plugin.json   # 清单（必有 name；可含 version/description/author）
├── .mcp.json                    # MCP 连接器（Slack/Snowflake/...）
├── skills/                      # 自动激活知识（skills/<name>/SKILL.md）
└── commands/                    # 显式 slash 命令（旧格式，新插件用 skills/）
```

- `plugin.json` 必须有 `name`（kebab-case）；`version` 用 semver，新插件建议 `0.1.0` 起步
- 新插件**优先用 `skills/*/SKILL.md`**（支持 `references/` 渐进披露），`commands/` 是旧格式但仍兼容
- Cowork UI 把 `skills/` 和 `commands/` 统一展示为「Skills」

## 下一步

- [指南](./guide-line) —— 按领域讲（客服 ticket-triage、数据 SQL、生物科研 nextflow、插件管理 create-cowork-plugin）、典型工作流、反模式
- [参考](./reference) —— 18 插件全表、11 主推连接器、安装、目录结构、许可
