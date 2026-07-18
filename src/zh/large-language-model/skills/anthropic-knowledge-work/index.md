---
layout: doc
---

# Anthropic Knowledge Work Plugins

Anthropic Knowledge Work Plugins（`anthropics/knowledge-work-plugins`）是 Anthropic 官方开源的知识工作插件集市，Apache 2.0 许可，专为 [Claude Cowork](https://claude.com/product/cowork) 设计，同时兼容 [Claude Code](https://claude.com/product/claude-code)。它把 Claude 变成「角色专家」——把销售、客服、数据分析、生物科研、法务、财务、产品、市场、设计、工程等岗位的专业知识、工作流、外部工具连接、slash 命令打包成一个个**插件**，按角色直接装即用。仓库共 **18 个顶层插件目录、212 个 SKILL.md**——README 主推 11 个官方插件，扩展目录（partner-built、small-business、pdf-viewer 等）提供更多场景。每个插件都是纯 Markdown + JSON，零代码、零构建、零基础设施，fork 即可改造成你公司的样子。

## 评价

**优点**

- **官方沉淀**：Anthropic 自家工程团队按角色实战沉淀，非泛泛的 prompt 模板
- **角色即插件**：11 个主推插件对应销售/客服/产品/市场/法务/财务/数据/企业搜索/生物科研/插件管理/个人生产力——装一个就把整套工作流拉进来
- **三件结构清晰**：每个插件 = `.claude-plugin/plugin.json`（清单）+ `.mcp.json`（连接器）+ `skills/`（自动激活知识）+ `commands/`（显式 slash 命令），全是文件
- **连接器生态广**：Slack / Notion / Jira / Linear / Snowflake / BigQuery / HubSpot / Salesforce 系 / Intercom / PubMed / bioRxiv / ChEMBL……通过 MCP 标准接入
- **企业可定制**：`cowork-plugin-management` 插件提供引导式「五阶段对话」从零造一个 `.plugin` 包；`~~category` 占位符让插件对外分发时按工具类别而非具体产品描述
- **生物科研亮点**：`bio-research/nextflow-development` 覆盖 nf-core 的 rnaseq/sarek/atacseq 三大流水线，从 GEO/SRA 拉数据到生成 samplesheet 全自动
- **跨运行时**：Cowork 装即用，Claude Code 用 `claude plugin marketplace add` + `claude plugin install` 也能装

**缺点 / 边界**

- **偏 Cowork 桌面场景**：插件设计的「主战场」是 Cowork（.plugin 包、对话式安装）；Claude Code 用法相对简单
- **角色覆盖广但深度不一**：partner-built（71 skill）、small-business（31 skill）是社区/扩展层，质量与官方 11 插件可能不等
- **连接器需自配**：MCP 连接器要你公司的真实凭据和工具栈，README 给的是「能连哪些」而非「已连好」
- **命令名易混**：Cowork UI 把 `commands/`（旧）和 `skills/`（新）统一成「Skills」展示，但内部仍是两套，老插件用 commands、新插件用 skills
- **partner-built 不等同官方背书**：扩展目录里的合作方插件由第三方维护

## 适用场景

- 团队想给 Claude「上岗培训」：销售备战、客服分流、财务月结、法务合同审、数据查询与可视化
- 公司想把内部工具（自家 CRM、自家知识库、自家数据仓库）按角色接到 Claude
- 生物科研团队跑 nf-core 流水线（rnaseq/sarek/atacseq）做 RNA-seq/WGS/ATAC-seq
- 想从零造一个属于你公司角色的插件，且要打包成 `.plugin` 对外分发

## 边界

- **不是单个技能，是角色插件集市**：18 目录 / 212 SKILL.md / 11 主推，每个插件自带若干 skill + 连接器 + slash 命令
- **不替代真实业务系统**：它定义「Claude 该怎么做这个角色」，连接器仍指向你已有的 Slack / Snowflake / Jira / HubSpot 等
- **bio-research 仍属原型**：仓库明确 nextflow-development 是 prototype，需自行验证生产适用性，Anthropic 不保证生信输出准确性
- **Cowork 才是主场**：部分功能（如 `.plugin` 包对话式打包、Cowork outputs 目录）依赖 Cowork 桌面应用

## 官方文档

[Knowledge Work Plugins README](https://github.com/anthropics/knowledge-work-plugins) ｜ [Claude Cowork](https://claude.com/product/cowork) ｜ [Claude 插件市场](https://claude.com/plugins/)

## GitHub 地址

[anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)（Apache 2.0）

## 内容地图

- [入门](./getting-started) —— 定位（Anthropic 官方知识工作插件集市）、安装（Cowork + Claude Code）、11 主推插件速览
- [指南](./guide-line) —— 按角色讲（客服 ticket-triage / 数据 SQL / 生物科研 nextflow / 插件管理 create-cowork-plugin）、典型工作流、反模式
- [参考](./reference) —— 18 插件目录全表、11 主推连接器、安装、目录结构、许可

## 幻灯片地址

<a href="/SlideStack/anthropic-knowledge-work-slide/" target="_blank">Anthropic Knowledge Work Plugins</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=661" target="_blank" rel="noopener noreferrer">Anthropic Knowledge Work Plugins 测试题</a>

