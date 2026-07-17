---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 dbt-labs/dbt-agent-skills 各 `skills/*/SKILL.md` 逐个精读编写。

## 速查

- **分析工程**：`using-dbt-for-analytics-engineering`（把软件工程纪律带进转换）+ `running-dbt-commands`（`build` 而非 `run`、总带 `--select`、图操作符 `model+`/`+model`）+ `adding-dbt-unit-test`（Model-Inputs-Outputs、`dict` 默认、只测复杂逻辑）
- **语义层**：`building-dbt-semantic-layer`（MetricFlow，latest vs legacy spec，5 种 metric 类型）+ `answering-natural-language-questions-with-dbt`（语义层优先，4 级 fallback）
- **Mesh 与运维**：`working-with-dbt-mesh`（契约/组/访问/版本，跨项目 ref 需 Enterprise）+ `troubleshooting-dbt-job-errors`（诊断平台 job）+ `configuring-dbt-mcp-server`（local vs remote）+ `fetching-dbt-docs`
- **迁移**：`migrating-dbt-core-to-fusion`（先 dbt-autofix，再 4 类分诊）+ `migrating-dbt-project-across-platforms`（信任 Fusion 实时编译做方言转换）
- **extras**：`creating-mermaid-dbt-dag`（血缘画 Mermaid，按资源类型着色）
- **反模式**：`run` 不带 `--select`、语义层混用两种 spec、给 staging 模型加契约、破坏性变更不做版本迁移窗口、为过测试而改测试

## dbt 组 · 分析工程

### using-dbt-for-analytics-engineering

**核心原则**：把软件工程纪律（DRY、模块化、测试）通过 dbt 的抽象层带进数据转换。它是「做任何 dbt 活」的总入口——建/改模型、写 SQL 转换（用 `ref()` 和 `source()`）、建测试、探不熟的数据源、评估变更影响。`allowed-tools` 限定为 `Bash(dbt *)`、`Bash(jq *)`、`Read/Write/Edit/Glob/Grep`。

### running-dbt-commands

把「正确地跑 dbt CLI」这件事标准化。几条硬约定：

- **优先用 MCP 工具**（`dbt_build`/`dbt_run`/`dbt_show`）——它们自动处理路径、超时与格式
- **总是用 `build`，即使用户说「run」**——`build` = `run` + `test` 一步到位，开发中 `dbt run` 单跑几乎从不是对的答案
- **总带 `--select`**——未经明确同意别跑整个项目；配 `--quiet` + `--warn-error-options` 抓 selector 拼写错
- **三种 CLI 要分清**：Core（venv）、Fusion（`dbtf`，更快、SQL 理解更强）、Cloud CLI（Go）

**图操作符（selector）**：

| 操作符 | 含义 | 例 |
| --- | --- | --- |
| `model+` | 模型及其所有下游 | `stg_orders+` |
| `+model` | 模型及其所有上游 | `+dim_customers` |
| `+model+` | 双向 | `+orders+` |
| `model+N` | 模型及下游 N 层 | `stg_orders+1` |

`--select` 空格分隔 = 并集，逗号 = 交集；`--exclude` 排除。`dbt show` 用 `--limit` flag（不是 SQL `LIMIT`）；`--defer --state` 可引用生产数据而不重建上游。

### adding-dbt-unit-test

单元测试在**静态输入**上验证 SQL 建模逻辑，模型物化前跑；任一单测失败，dbt 就不物化该模型。结构是 **Model-Inputs-Outputs** 三元组：`model`（测哪个）+ `given`（给定输入行）+ `expect`（期望输出行）。

```yaml
unit_tests:
  - name: test_order_items_count_drink_items_with_zero_drinks
    model: order_items_summary
    given:
      - input: ref('order_items')
        rows:
          - { order_id: 76, order_item_id: 3, is_drink_item: false }
      - input: ref('stg_orders')
        rows:
          - { order_id: 76 }
    expect:
      rows:
        - { order_id: 76, count_drink_items: 0 }
```

关键约定：

- **只测复杂逻辑**：regex、日期数学、窗口函数、多分支 `case when`、复杂 join；**别测**仓库内置函数（如 `min()`）
- **三种格式**：`dict`（默认，最易读）/ `csv` / `sql`；`sql` 须写**全部列**，且模型依赖 **ephemeral** 模型时**必须**用 `sql`
- **只支持 SQL 模型**（不支持 Python 模型、snapshot、seed、source）、且只测**当前项目**内的模型
- **只在 dev/CI 跑**：输入是静态的，生产跑纯浪费算力，用 `--exclude-resource-type` 或 `DBT_EXCLUDE_RESOURCE_TYPES` 排除
- `dbt build --select my_model` 一步搞定：单测过了才物化、再跑数据测试，省仓库开销

## dbt 组 · 语义层（MetricFlow）

### building-dbt-semantic-layer

指导用 **MetricFlow** 建语义层四大组件：**semantic models**（模型到业务概念的映射）、**entities**（标识数据粒度、支持 join 的键）、**dimensions**（过滤/分组用的属性，分类或时间）、**metrics**（建在语义模型上的业务计算）。

两种 YAML spec 要先辨明：

| spec | 支持版本 | 特点 |
| --- | --- | --- |
| **latest** | dbt Core 1.12+ / Fusion | 语义模型作为**模型上的 metadata**配置，更简单 |
| **legacy** | dbt Core 1.6–1.11（1.12+ 也向后兼容） | 语义模型是**独立顶层资源**，用 measures 作为 metric 构建块 |

辨别现有配置：YAML 里顶层 `semantic_models:` 键 = legacy；模型下嵌套 `semantic_model:` 块 = latest。

**5 种 metric 类型**：`simple`（直接聚合单列，最常用、其它类型的基石）、`derived`（多 metric 数学组合，如 profit = revenue − cost）、`cumulative`（运行窗口/至今累计，**需 time spine**；`window` 与 `grain_to_date` 不能同时用）、`ratio`（分子/分母，如转化率）、`conversion`（漏斗，一个事件多久导向另一个）。

**验证两步**：先 `dbt parse`（或 `dbtf parse`）确认 YAML 语法与引用，再 `dbt sl validate` 或 `mf validate-configs` 做语义层校验。注意 `mf validate-configs` 读的是**编译后的 manifest**——改了 YAML 必须先重跑 `parse`。装 **`dbt-metricflow`**（不是裸 `metricflow`）才能拿到兼容依赖。

> **过滤器坑**：filter 表达式只能引用已声明为 dimension 或 entity 的列，measure 的 `expr` 里用到的裸表列不能直接拿来 filter。

### answering-natural-language-questions-with-dbt

把业务问题（「上季度总销售额多少？」）翻成数据答案，**穷尽 4 种方法**再说「答不了」：

1. **语义层查询**（`list_metrics` → `get_dimensions` → `query_metrics`）——首选
2. **改编译后 SQL**（`get_metrics_compiled_sql` 拿 SQL，加缺的维度/过滤/case，再 `execute_sql`）
3. **模型发现**（`get_mart_models`/`get_model_details`，优先 mart 而非 staging，写 SQL 跑）
4. **manifest/catalog 分析**（无 MCP 时读 `target/manifest.json`，先用 jq 过滤再读）

这是「答业务问题」的技能，**不用于**开发时验证模型正确性或跑 `dbt run/test/build`。

## dbt 组 · Mesh 与平台运维

### working-with-dbt-mesh

**核心**：mesh 项目里上游数据走 `ref()` 而不是 `source()`；每个跨项目引用都要带项目名，拿不准先读 `dependencies.yml`。四大治理特性可增量采用：

| 特性 | 作用 | 关键配置 |
| --- | --- | --- |
| **Model Contracts** | 构建时保证列名/类型/约束 | `contract: {enforced: true}` |
| **Groups** | 按团队/域组织模型 | `group: finance` |
| **Access** | 控制谁能 ref 你的模型 | `access: public / protected / private` |
| **Model Versions** | 破坏性变更配迁移窗口 | `versions:` + `latest_version` |

采用顺序：**Groups & Access → Contracts → Versions → Cross-Project Refs**。跨项目 `ref('upstream_project', 'model_name')` 需 **dbt Cloud Enterprise 或 Enterprise+**，且上游有成功的生产 job（靠 `manifest.json` 解析）。

几条硬规则：

- 治理配置 `access`/`group`/`contract` 在属性 YAML 里**必须嵌在 `config:` 下**，放顶层会在 Fusion 引擎解析报错
- 只有 `access: public` 的模型才能跨项目被 ref
- **版本化的关键**：加新版本与把它提升为 `latest_version` 是**两次独立部署、隔着迁移窗口**——同一次改就等于零窗口，BI/reverse ETL 按名读的关系立刻断
- **别给 staging 模型加契约**（内部实现细节，非消费者 API）；别给 pivot/动态列模型加契约（列表会变）

### troubleshooting-dbt-job-errors

系统化诊断 **dbt Cloud/平台** job 失败：用 Admin API（`list_jobs_runs`/`get_job_run_error`）或让用户给日志与 `run_results.json`，按错误类型分流（基础设施 / 代码编译 / 数据测试失败），查 git history 定位近期改动。**铁律**：绝不为了让测试通过而改测试——失败的测试是问题的证据。（本地开发错误请用 `using-dbt-for-analytics-engineering`。）

### configuring-dbt-mcp-server

dbt MCP server 把 AI 工具连到 dbt 的 CLI、语义层、Discovery API、Admin API。两种形态：

| | Local（`uvx dbt-mcp`） | Remote（HTTP） |
| --- | --- | --- |
| 跑在哪 | 你本机 | 连 dbt 平台 |
| CLI 命令 | 支持（run/build/test/show） | 不支持 |
| 平台账号 | 不强制 | 必需 |
| 消耗 | 无 credit | 耗 dbt Copilot credits |

客户端支持 Claude Desktop / Claude Code / Cursor / VS Code（VS Code 用 `servers` 键，不是 `mcpServers`）。Claude Code 一键加：`claude mcp add dbt -s user -- uvx dbt-mcp`。工具类别默认**开** CLI/语义层/Discovery/Admin，默认**关** SQL（`text_to_sql`/`execute_sql`）与 Codegen。**凭据安全**：配置里用环境变量引用（如 `${DBT_TOKEN}`），别提交明文 token。

### fetching-dbt-docs

以 LLM 友好的 markdown 检索/搜索 dbt 文档页——查 dbt 特性、回答 dbt Cloud/Core/语义层的问题时用。无需现有项目即可用。

## dbt-migration 组（一次性）

### migrating-dbt-core-to-fusion

**Fusion 迁移分诊助手**——角色是**分诊而非全自动修**。严格执行顺序：Step 0 问是否跑 `dbt debug` 验证凭据 → Step 1 **先跑 `dbt-autofix`** 并复核其改动 → Step 2 把剩余错误按 4 类分诊，之后才提修复：

- **A 自动修（安全）**：如 config 引号嵌套、`analyses/` 里的静态分析错误（加 `static_analysis='off'`）
- **B 需批准（先看 diff）**：config API 弃用、无用 schema.yml 项、包版本等
- **C 需用户输入**：多种合理做法，如硬编码 FQN 是模型还是源
- **D 被阻塞**：需 Fusion 引擎更新（MiniJinja 差异、parser 缺口、崩溃），主动搜 GitHub issue，说清风险让用户定夺

关键理念：迁移是**迭代**的，成功 = 有进展 + 知道被什么卡住；`dbt1065` 包版本兼容**警告**可忽略（autofix 已处理升级）。

### migrating-dbt-project-across-platforms

跨数据平台迁移（如 Snowflake ↔ Databricks）。**核心思路**：**Fusion 实时编译**产出精确错误日志，完全信任 Fusion 做方言转换——读错误、修、重编译、循环，不必预先枚举每种 SQL 差异。配合迁移前在**源平台**生成的单测（golden dataset），同时证明**编译正确**与**数据正确**。

成功标准：`dbtf compile` **0 错 0 警**（警告在生产会变错，视为阻塞）+ 单测全过 + `dbtf run` 成功。**`dbtf compile` 免费**（不查仓库）当迭代门，`dbtf run`/`dbt test` 才花钱，编译干净后再跑。切平台前 `rm -rf target/` 清缓存，避免源平台的陈旧 schema 导致假的「列不存在」。

## dbt-extras 组

### creating-mermaid-dbt-dag

把 dbt 模型血缘生成 **Mermaid 流程图**（`graph LR` 左到右）。取血缘走层级 fallback：MCP `get_lineage_dev`（本地最准）→ `get_lineage`（dbt Cloud 生产）→ 解析 `manifest.json`（离线，>10MB 则跳过）→ 直接解析代码（最后手段）。节点**按资源类型着色**：source 蓝、staging 铜、intermediate 银、mart/fact/dimension 金、seed 绿、exposure 橙、test 黄、焦点模型紫。附图例，保证文字与背景对比可读。

## 反模式

- **`dbt run` 不带 `--select`、或用 `run` 而非 `build`**：run 单跑不刷新测试，且可能全库跑
- **语义层混用两种 spec**：latest spec 里用 `type_params`、或 legacy 里用直接键，都会解析失败
- **给 staging 模型加契约**：内部实现细节，加契约只添摩擦不保护消费者；改用数据测试
- **破坏性变更不做版本迁移窗口**：新版本一上来就设为 `latest_version`，按名读表的 BI/reverse ETL 立刻断
- **把 `access`/`group`/`contract` 放模型属性顶层**：Fusion 解析报错，必须嵌 `config:` 下
- **为让 job/测试通过而改测试**：失败的测试是问题证据，先查根因
- **迁移时预修 Fusion 没报的问题**：Fusion 的错误输出才是真相，只修它报的

## 下一步

- [参考](./reference) —— 技能全表 + 触发词、MetricFlow、Fusion、安装、链接
- 上游：[dbt 文档](https://docs.getdbt.com/) · [dbt-agent-skills 仓库](https://github.com/dbt-labs/dbt-agent-skills)
