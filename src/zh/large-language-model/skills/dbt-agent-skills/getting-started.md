---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 dbt-labs/dbt-agent-skills 官方仓库（main 分支，tile.json v1.3.1）的 README、CLAUDE.md 与各 skills/ 编写。

## 速查

- **是什么**：dbt Labs 官方的 AI agent 技能集，帮 agent 更准地执行 dbt 分析工程/语义层/迁移工作流；Apache-2.0，遵 agentskills.io 格式
- **装（Claude Code）**：`/plugin marketplace add dbt-labs/dbt-agent-skills` → `/plugin install dbt@dbt-agent-marketplace`（+ 需要时 `dbt-migration@dbt-agent-marketplace`）
- **装（其它 agent）**：`npx skills add dbt-labs/dbt-agent-skills`（Vercel Skills CLI，支持 30+ agent）
- **12 技能 3 组**：`dbt`（分析工程，9 个）· `dbt-migration`（迁移，2 个）· `dbt-extras`（1 个）
- **触发**：装后自动激活（多数 `user-invocable: false`），自然语言描述需求即可，不是 slash 命令
- **核心约定**：开发用 `dbt build`（= run + test）而非 `dbt run`；总带 `--select`；语义层优先 latest spec；单测优先 `dict` 格式
- **前置**：多数技能假设 dbt 已装、有 `dbt_project.yml`；`fetching-dbt-docs`/`configuring-dbt-mcp-server` 可无项目用

## dbt 与 Agent Skills

**dbt**（data build tool）是 SQL 化的数据转换工具——分析工程师用它把软件工程纪律（DRY、模块化、测试、版本控制）带进数据仓库里的数据转换。**Agent Skills** 则是「一组给 agent 用的指令、脚本与资源目录」，agent 发现后按需调用。二者结合：让 AI agent 用 dbt 干活时，自动加载对口的专家知识。

这些技能**不是** slash 命令，也不是用户手动触发的动作。装好后，agent 在你的 prompt 匹配某技能用例时自动加载它——你只需自然语言描述需求。

## 安装

### Claude Code（插件市场）

```bash
# 添加市场
/plugin marketplace add dbt-labs/dbt-agent-skills

# 装 dbt 技能（分析工程、语义层、测试等）
/plugin install dbt@dbt-agent-marketplace

# 装迁移技能（一次性，非每次会话都需要）
/plugin install dbt-migration@dbt-agent-marketplace
```

### 其它 AI 客户端（Vercel Skills CLI）

```bash
# 预览可装技能
npx skills add dbt-labs/dbt-agent-skills --list

# 装全部
npx skills add dbt-labs/dbt-agent-skills

# 只装 dbt 组 / 只装迁移组
npx skills add dbt-labs/dbt-agent-skills/skills/dbt
npx skills add dbt-labs/dbt-agent-skills/skills/dbt-migration

# 装单个技能 / 全局安装
npx skills add dbt-labs/dbt-agent-skills --skill using-dbt-for-analytics-engineering
npx skills add dbt-labs/dbt-agent-skills --global
```

也可用 [Tessl](https://tessl.io/)：`tessl install dbt-labs/dbt-agent-skills`。

## 12 个技能，3 组

| 组 | 技能 | 一句话 |
| --- | --- | --- |
| **dbt** | `using-dbt-for-analytics-engineering` | 建/改模型、写 SQL 转换、建测试、评估变更影响 |
| **dbt** | `running-dbt-commands` | 跑 dbt CLI：正确的可执行文件、flag、selector、参数格式 |
| **dbt** | `adding-dbt-unit-test` | 加单元测试，mock 上游输入验证输出（TDD） |
| **dbt** | `building-dbt-semantic-layer` | 用 MetricFlow 建 semantic models / metrics / dimensions |
| **dbt** | `answering-natural-language-questions-with-dbt` | 查语义层或 SQL 回答业务问题 |
| **dbt** | `working-with-dbt-mesh` | 多项目治理：契约、访问、组、版本、跨项目 ref |
| **dbt** | `troubleshooting-dbt-job-errors` | 诊断 dbt 平台 job 失败（日志 / Admin API / git） |
| **dbt** | `configuring-dbt-mcp-server` | 配 dbt MCP server（Claude / Cursor / VS Code） |
| **dbt** | `fetching-dbt-docs` | 高效检索 dbt 文档（LLM 友好 markdown） |
| **dbt-migration** | `migrating-dbt-core-to-fusion` | 迁到 Fusion 引擎：先 dbt-autofix，再分诊错误 |
| **dbt-migration** | `migrating-dbt-project-across-platforms` | 跨数据平台迁移（Snowflake ↔ Databricks） |
| **dbt-extras** | `creating-mermaid-dbt-dag` | 把模型血缘画成 Mermaid 流程图 |

> `dbt` 组另有一个较新的 `using-dbt-state`（服务端复用机制，区别于 `state:modified` 选择器与 `--state` 延迟），已在仓库、尚未进 v1.3.1 tile。

## 实战：跑一个模型

用户说「run 一下 `stg_orders`」时，`running-dbt-commands` 会推荐 `build` 而非 `run`——因为 `build` = `run` + `test`，能立刻抓出数据质量问题：

```bash
dbt build --select stg_orders --quiet \
  --warn-error-options '{"error": ["NoNodesForSelectionCriteria"]}'
```

预览模型输出、或跑内联 SQL：

```bash
dbt show --select stg_orders --limit 10
dbt show --inline "select * from {{ ref('orders') }} where status = 'pending'" --limit 5
```

> 三种 CLI：**dbt Core**（Python venv）、**dbt Fusion**（`~/.local/bin/dbt` 或 `dbtf`，更快、SQL 理解更强）、**dbt Cloud CLI**（Go）。不确定时技能会先问你用哪个。

## 实战：搭语义层

用 MetricFlow 在模型上定义 metric（latest spec，Core 1.12+/Fusion）：

```yaml
# models/fct_orders.yml
models:
  - name: fct_orders
    semantic_model:
      enabled: true
    agg_time_dimension: order_date
    columns:
      - name: order_id
        entity: { type: primary, name: order }
      - name: order_date
        granularity: day
        dimension: { type: time }
    metrics:
      - name: total_revenue
        type: simple
        agg: sum
        expr: amount
```

## 下一步

- [指南](./guide-line) —— 三组逐讲、每技能的关键约定与反模式
- [参考](./reference) —— 技能全表 + 触发词、MetricFlow、Fusion、安装、链接
