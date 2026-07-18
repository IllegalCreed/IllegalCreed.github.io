---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 anthropics/knowledge-work-plugins 各插件 README、SKILL.md、plugin.json 编写。

## 速查

- **核心范式**：插件 = 角色（11 主推）+ 三件结构（清单 + 连接器 + 知识/命令）
- **客服 ticket-triage**：6 步流水线（解析→分类优先级→查重→路由→出报告→提下一步），P1-P4 SLA 明确
- **数据 SQL**：跨方言（PG/Snowflake/BigQuery/Redshift/Databricks），覆盖窗口/CTE/漏斗/留存/去重
- **生物科研 nextflow**：跑 nf-core 的 rnaseq/sarek/atacseq，6 步从 GEO/SRA 到结果，prototype 需自验
- **create-cowork-plugin**：5 阶段对话（发现→组件规划→设计→实现→审阅打包）产出 `.plugin`
- **反模式**：把插件当 prompt 模板、连接器不配凭据、修改 commands 旧插件而不迁到 skills、用 `~~category` 占位符却忘了写 CONNECTORS.md
- Apache 2.0；Cowork 主场、Claude Code 兼容

## 客服：ticket-triage 的工作流

`customer-support/skills/ticket-triage` 是工单分流的标准范式——分 6 步：

1. **解析问题**——核心问题、症状、客户背景、紧急度信号、客户情绪
2. **分类与优先级**——9 类主类（bug / how-to / feature-request / billing / account / integration / security / data / performance）+ **P1-P4 SLA**
3. **查重与已知问题**——搜支持平台、知识库、项目追踪器；命中则关联、通知客户、补信息
4. **路由判定**——按类与复杂度路由到 Tier 1 / Tier 2 / Engineering / Product / Security / Billing
5. **输出 triage 报告**——摘要、客户、影响、变通方案、关联工单、路由建议、建议首响应（含 9 类自动响应模板）
6. **提供下一步**——起草回复 / 搜更多背景 / 查 bug / 用 `/customer-escalation` 打包升级

### P1-P4 SLA

| 优先级 | 标准 | SLA |
| --- | --- | --- |
| **P1 Critical** | 生产宕机 / 数据丢失 / 安全事件 / 全员受影响 | 1h 内响应、持续处理、1-2h 更新 |
| **P2 High** | 核心功能坏、多用户受阻、无变通 | 4h 内响应、当日调查、4h 更新 |
| **P3 Medium** | 功能部分坏、有变通、单人/小团队 | 1 工作日响应、3 工作日内更新 |
| **P4 Low** | 外观/一般问/feature request | 2 工作日响应 |

**自动升级触发**：超 SLA、多客户报同因、客户升级到高管、变通失效、范围扩大。

### 分类判定速记

- 「以前能用现在不行」= **Bug**
- 「我想让它不一样」= **Feature request**
- 「我要怎么做」= **How-to**
- 既报 bug 又提 feature → bug 优先
- 登录失败若是 bug 引起 → **Bug**（非 Account），按根因归类
- 拿不准时**倾向 Bug**——调查优于忽视

## 数据：sql-queries 跨方言覆盖

`data/skills/sql-queries`（`user-invocable: false`，纯知识型）覆盖五大仓库方言 + 通用模式：

- **方言**：PostgreSQL（含 Aurora/RDS/Supabase/Neon）、Snowflake、BigQuery、Redshift、Databricks SQL
- **覆盖点**：日期/时间、字符串、数组/JSON、半结构化（VARIANT、UNNEST、FLATTEN）、性能提示（PG 索引、Snowflake 聚类、BigQuery 分区、Redshift DISTKEY/SORTKEY、Databricks ZORDER）
- **通用模式**：窗口函数（ROW_NUMBER/RANK/LAG/LEAD/FIRST_VALUE/移动平均）、CTE 多步可读、cohort 留存、funnel 漏斗、去重（`ROW_NUMBER` + `rn=1`）
- **错误排查**：方言差异（BigQuery 无 `ILIKE`、`SAFE_DIVIDE` 仅 BigQuery）、列名大小写（PG 带引号区分）、`NULLIF` 防除零、JOIN 列名歧义

> 数据插件还含 `write-query`、`validate-data`（share 前自检）、`build-dashboard`、`create-viz`、`statistical-analysis` 等——把「查询→验证→可视化→分享」一条龙做掉。

## 生物科研：nextflow-development 六步跑 nf-core

`bio-research/skills/nextflow-development` 面向**没有生信背景的科研人员**，跑 nf-core 三大流水线：

| 数据类型 | 流水线 | 版本 | 目标 |
| --- | --- | --- | --- |
| RNA-seq | `rnaseq` | 3.22.2 | 基因表达 |
| WGS/WES | `sarek` | 3.7.1 | 变异检测 |
| ATAC-seq | `atacseq` | 2.1.2 | 染色质可及性 |

**六步**：①（可选）GEO/SRA 拉数据 + 生成 samplesheet → ②环境检查（Docker / Nextflow ≥ 23.04 / Java ≥ 11）→ ③选定流水线（与用户确认）→ ④跑 test profile 验环境（**必须过**）→ ⑤配置基因组 + 运行（`-resume` 断点续跑）→ ⑥校验输出（multiqc 报告、log 中 `Pipeline completed successfully`）。

> 仓库明确这是 **prototype 示例**，Anthropic **不保证生信输出准确性**，需用户自行按社区规范验证；nf-core 本身是 MIT、Nextflow 是 Apache 2.0。

## 插件管理：create-cowork-plugin 五阶段对话

`cowork-plugin-management/skills/create-cowork-plugin` 用**对话引导**从零造一个 `.plugin` 包，要求 Cowork 桌面环境（`.plugin` 输出到 outputs 目录）：

1. **Discovery**——明确插件做什么、给谁用、是否接外部工具、是否有参考
2. **Component Planning**——决定要哪些组件（skills / agents / hooks / MCP），出组件计划表确认
3. **Design & Clarifying Questions**——逐组件细化（skills 触发短语 + 工具权限、agents 主动还是被动、hooks 事件类型、MCP server 类型 + 鉴权）
4. **Implementation**——建目录 → `plugin.json` → 各组件 → `README.md`
5. **Review & Package**——`claude plugin validate` 校验结构，打包成 `.plugin`（先 zip 到 `/tmp/` 再复制到 outputs 防权限失败）

### 最佳实践

- **Skills 是给 Claude 的指令，不是给用户的文档**——动词开头（"Parse the config file"），不是"You should parse…"
- **渐进披露**：SKILL.md 主体 ≤ 3000 字，细节放 `references/`，例子放 `examples/`
- **触发短语具体**：description 里写「Use when…」+ 用户会说的具体词，agent 据此判断
- **路径可移植**：始终用 `${CLAUDE_PLUGIN_ROOT}`，别硬编码绝对路径
- **`~~category` 占位符**：仅当**对外分发**时才用——把 Jira 写成 `~~project tracker`，并在仓库根写 `CONNECTORS.md` 解释占位符；内部插件不必用

## 典型工作流

- **客服分流**：工单进来 → `/customer-support:ticket-triage`（或自动触发）→ 出 triage 报告 + 建议首响应 → 一键起草回复 → 解决后 `/customer-support:kb-article` 沉淀到知识库
- **数据查询**：业务提问 → `data` 插件写 SQL（自动选方言）→ `validate-data` 自检 → `create-viz` 出图 → `build-dashboard` 落 dashboard
- **生物科研**：拿到 GSE 号 → `nextflow-development` 自动拉数据、生成 samplesheet → 跑 nf-core → 出 multiqc 报告
- **造新插件**：`create-cowork-plugin` 五阶段对话 → 产出 `.plugin` → 在 Cowork 一键装

## 反模式

- **把插件当 prompt 模板**：插件是「角色全栈」（知识 + 命令 + 连接器），不是单条 prompt。只改一条 prompt 而不动 skills/MCP 会丢角色上下文
- **连接器不配凭据**：`.mcp.json` 写了连 Slack/OAuth 但没设环境变量 → 插件加载但连不上
- **改 commands 旧插件不迁 skills**：新插件应 `skills/*/SKILL.md`（支持 `references/` 渐进披露）；只在 `commands/*.md` 改单文件会错过渐进披露
- **用 `~~` 占位符却不写 CONNECTORS.md**：占位符要配套说明文档，否则用户不知道该连什么
- **把 partner-built 当官方**：partner-built / small-business 是扩展层，质量与维护方与 Anthropic 官方 11 插件不等
- **bio-research 直上生产**：nextflow-development 是 prototype，必须自验；nf-core 流水线本身也要按社区规范验证

## 与相邻叶的边界

- 本叶聚焦 **Anthropic 官方知识工作插件集市**（角色插件 + MCP 连接器 + slash 命令）
- **Vercel Agent Skills**（同章节）是 Vercel 出品的工程/部署/审计技能集——更偏前端工程规范
- **Antfu Skills / CLI find-skills** 等是社区或工具型技能——本叶是 Anthropic 自家的角色插件集市

## 下一步

- [参考](./reference) —— 18 插件目录全表、11 主推连接器、安装、目录结构、许可
- 上游：[knowledge-work-plugins README](https://github.com/anthropics/knowledge-work-plugins)
