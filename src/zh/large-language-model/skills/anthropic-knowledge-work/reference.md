---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 anthropics/knowledge-work-plugins README、各 plugin.json、SKILL.md 编写。

## 速查

- **仓库**：`anthropics/knowledge-work-plugins`（Apache 2.0）
- **规模**：18 个顶层插件目录 / **212 个 SKILL.md** / README 主推 **11 个官方插件**
- **装（Cowork）**：[claude.com/plugins](https://claude.com/plugins/) 一键装
- **装（Claude Code）**：`claude plugin marketplace add anthropics/knowledge-work-plugins` → `claude plugin install <plugin>@knowledge-work-plugins`
- **激活**：装后自动激活；skills 按相关性触发、commands 显式调用（如 `/sales:call-prep`、`/data:write-query`）

## 11 主推插件全表

| 插件 | 用途 | 连接器 |
| --- | --- | --- |
| **productivity** | 管理任务、日历、日常流程、个人上下文 | Slack、Notion、Asana、Linear、Jira、Monday、ClickUp、Microsoft 365 |
| **sales** | 调研客户、备战通话、review pipeline、起草触达、竞品 battlecard | Slack、HubSpot、Close、Clay、ZoomInfo、Notion、Jira、Fireflies、Microsoft 365 |
| **customer-support** | 分流工单、起草回复、打包升级、客户调研、KB 文档沉淀 | Slack、Intercom、HubSpot、Guru、Jira、Notion、Microsoft 365 |
| **product-management** | 写 PRD、规划路线图、合成用户研究、同步干系人、跟踪竞品 | Slack、Linear、Asana、Monday、ClickUp、Jira、Notion、Figma、Amplitude、Pendo、Intercom、Fireflies |
| **marketing** | 起草内容、规划活动、统一品牌调性、竞品简报、跨渠道效果 | Slack、Canva、Figma、HubSpot、Amplitude、Notion、Ahrefs、SimilarWeb、Klaviyo |
| **legal** | 审合同、分流 NDA、合规导航、风险评估、会议准备、模板回复 | Slack、Box、Egnyte、Jira、Microsoft 365 |
| **finance** | 凭证录入、对账、生成财报、差异分析、月结、支持审计 | Snowflake、Databricks、BigQuery、Slack、Microsoft 365 |
| **data** | 查询、可视化、解读数据集——SQL、统计、dashboard、share 前自检 | Snowflake、Databricks、BigQuery、Definite、Hex、Amplitude、Jira |
| **enterprise-search** | 跨邮件、聊天、文档、wiki 一站式搜公司所有工具 | Slack、Notion、Guru、Jira、Asana、Microsoft 365 |
| **bio-research** | 接 PubMed / bioRxiv / ChEMBL / Benchling 等临床前工具，加速早期生命科学研发 | PubMed、BioRender、bioRxiv、ClinicalTrials.gov、ChEMBL、Synapse、Wiley、Owkin、Open Targets、Benchling |
| **cowork-plugin-management** | 创建新插件或定制现有插件 | — |

## 仓库全目录与 skill 数（18 目录 / 212 SKILL.md）

| 目录 | SKILL.md | 备注 |
| --- | --- | --- |
| partner-built | 71 | 合作方插件（非 Anthropic 官方） |
| small-business | 31 | 小企业场景 |
| data | 10 | 官方主推 |
| engineering | 10 | 工程角色 |
| human-resources | 9 | 人力资源 |
| legal | 9 | 官方主推 |
| sales | 9 | 官方主推 |
| operations | 9 | 运营 |
| marketing | 8 | 官方主推 |
| product-management | 8 | 官方主推 |
| finance | 8 | 官方主推 |
| design | 7 | 设计 |
| bio-research | 6 | 官方主推 |
| customer-support | 5 | 官方主推 |
| enterprise-search | 5 | 官方主推 |
| productivity | 4 | 官方主推 |
| cowork-plugin-management | 2 | 官方主推（元插件） |
| pdf-viewer | 1 | PDF 查看辅助 |

> README 列「We're open-sourcing 11 plugins」是**官方主推**；其余目录（partner-built / small-business / operations / human-resources / design / engineering / pdf-viewer）是仓库自带的扩展层。

## 客服 ticket-triage P1-P4 速查

| 优先级 | SLA | 适用 |
| --- | --- | --- |
| P1 Critical | 1h 响应，1-2h 更新 | 生产宕机 / 数据丢失 / 安全事件 / 全员受影响 |
| P2 High | 4h 响应，当日调查 | 核心功能坏 / 多用户受阻 / 无变通 |
| P3 Medium | 1 工作日响应 | 部分坏 / 有变通 / 单人小团队 |
| P4 Low | 2 工作日响应 | 外观 / 一般问 / feature request |

**路由**：Tier 1（how-to/已知/账单/重置）· Tier 2（bug 调查/复杂配置/集成）· Engineering（确认 bug/基础设施）· Product（feature 需求/设计）· Security（数据访问/漏洞/合规）· Billing/Finance（退款/合同）。

## data 插件 SQL 方言覆盖

| 方言 | 时间/字符串亮点 | 性能提示 |
| --- | --- | --- |
| PostgreSQL | `INTERVAL '7 days'`、`DATE_TRUNC`、`ILIKE`、`~` regex、`->>`/`#>>` JSON | 索引、`EXISTS`、连接池 |
| Snowflake | `DATEADD`、`DATEDIFF`、`DATE_TRUNC`、VARIANT `:`、`LATERAL FLATTEN` | 聚类键、warehouse size、`RESULT_SCAN` |
| BigQuery | `DATE_ADD`/`DATE_DIFF`、`TIMESTAMP_TRUNC`、`REGEXP_CONTAINS`、`UNNEST` | 分区/聚类、`APPROX_COUNT_DISTINCT`、按字节计费 |
| Redshift | `DATEADD`、`DATEDIFF`、`ILIKE`、`LISTAGG` | DISTKEY/SORTKEY、`ANALYZE`/`VACUUM` |
| Databricks | `DATE_ADD`、`ADD_MONTHS`、Delta `MERGE INTO`、`TIMESTAMP AS OF` 时间旅行 | `OPTIMIZE`/`ZORDER`、Photon、`CACHE TABLE` |

## bio-research nf-core 三流水线

| 数据类型 | Pipeline | 版本 | 关键输出 |
| --- | --- | --- | --- |
| RNA-seq | `rnaseq` | 3.22.2 | `salmon.merged.gene_counts.tsv`、TPM |
| WGS/WES | `sarek` | 3.7.1 | `variant_calling/*/` VCF、recalibrated BAM |
| ATAC-seq | `atacseq` | 2.1.2 | `macs2/narrowPeak/`、`bigwig/` 覆盖 track |

**前置**：Docker / Nextflow ≥ 23.04 / Java ≥ 11；可选 Singularity（HPC）。**许可**：nf-core MIT、Nextflow Apache 2.0、SRA Toolkit 公共领域。**声明**：仓库标注 prototype，需自验。

## 目录结构

```text
knowledge-work-plugins/
├── productivity/         # 主推
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json
│   ├── skills/<name>/SKILL.md
│   └── commands/*.md
├── sales/                # 主推
├── customer-support/     # 主推（5 skill：ticket-triage/draft-response/customer-escalation/customer-research/kb-article）
├── product-management/   # 主推
├── marketing/            # 主推
├── legal/                # 主推
├── finance/              # 主推
├── data/                 # 主推（10 skill：sql-queries/write-query/validate-data/build-dashboard/create-viz/explore-data/analyze/statistical-analysis/data-visualization/data-context-extractor）
├── enterprise-search/    # 主推
├── bio-research/         # 主推（6 skill：nextflow-development/scvi-tools/single-cell-rna-qc/scientific-problem-selection/instrument-data-to-allotrope/start）
├── cowork-plugin-management/  # 主推（create-cowork-plugin / cowork-plugin-customizer）
├── partner-built/        # 扩展：71 skill
├── small-business/       # 扩展：31 skill
├── operations/           # 扩展：9 skill
├── human-resources/      # 扩展：9 skill
├── design/               # 扩展：7 skill
├── engineering/          # 扩展：10 skill
└── pdf-viewer/           # 扩展：1 skill
```

## plugin.json 最小示例

```json
{
  "name": "customer-support",
  "version": "1.3.0",
  "description": "Triage tickets, draft responses, escalate issues, and build your knowledge base.",
  "author": { "name": "Anthropic" }
}
```

**规则**：`name` 必须 kebab-case（小写 + 连字符，无空格）；`version` 用 semver，新插件 `0.1.0` 起步；可选字段 `homepage` / `repository` / `license` / `keywords`。

## 资源链接

- 仓库：[anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)（Apache 2.0）
- 插件市场：[claude.com/plugins](https://claude.com/plugins/)
- Cowork：[claude.com/product/cowork](https://claude.com/product/cowork)
- Claude Code：[claude.com/product/claude-code](https://claude.com/product/claude-code)
- MCP 协议：[modelcontextprotocol.io](https://modelcontextprotocol.io/)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Antfu Skills](../antfu-skills/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/)
