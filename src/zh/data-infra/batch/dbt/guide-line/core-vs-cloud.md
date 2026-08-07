---
layout: doc
outline: [2, 3]
---

# dbt Core vs Cloud、现代数据栈集成

> 基于 dbt Core 1.8 / dbt Cloud · 核于 2026-08

## 速查

- **dbt Core（开源 CLI）**：Apache 2.0 开源命令行工具，`pip install dbt-core dbt-<adapter>`。自己管项目、自己跑 `dbt run`、自己接调度（Airflow/Prefect/Dagster）。免费、灵活、可控，但需运维。
- **dbt Cloud（托管 SaaS）**：dbt Labs 公司的商业托管平台。除 CLI 编译能力外，加 **dbt Cloud IDE**（浏览器内 IDE）、**dbt Scheduler**（托管调度）、**dbt Cloud CI**（PR 自动跑 test）、**Semantic Layer**（统一指标定义）。省运维 + 团队协作好，但按席位计费。
- **Core 与 Cloud 的关系**：**dbt Core 开源免费是基础**，Cloud 在其上加托管与协作能力。两者共享同一套 model/source/test/macro 语法，项目代码可互通（在 Core 写的 dbt 项目可上传 Cloud，反之亦然）。
- **调度差异**：Core 需自己接调度（Airflow/cron/GitHub Actions）；Cloud 内置 Scheduler，配置即调度（cron 表达式 + 触发器）。
- **现代数据栈（Modern Data Stack）定位**：dbt 是 MDS 的**转换层（T）标准**——与 Fivetran/Airbyte（E&L 抽取加载）、Snowflake/BigQuery/Databricks（仓库计算）、Looker/Tableau（BI）、Census（反向 ETL）组合，构成云原生模块化数据栈。
- **与数仓集成**：dbt 通过适配器（adapter）支持 Snowflake/BigQuery/Redshift/Databricks/Postgres/Spark。编译 SQL 推到数仓执行，复用数仓库算力。
- **与 Spark/Databricks 集成**：`dbt-spark`（开源）或 `dbt-databricks`（官方）适配器，让 dbt 编排 Spark/Databricks 计算——「dbt 编排 SQL + Spark 算」组合，常见于湖仓栈。
- **与数据工程师/分析师分工**：数据工程师（DE）管基础设施（仓库/Spark/抽取加载），分析工程师（Analytics Engineer，AE）用 dbt 写转换 SQL（业务逻辑）——dbt 让 AE 用 SQL 独立交付，降低对 DE 的依赖。

## 一、dbt Core：开源 CLI

dbt Core 是开源（Apache 2.0）命令行工具：

```bash
# 安装
pip install dbt-core dbt-snowflake     # 装核心 + 适配器

# 项目初始化
dbt init my_project                      # 生成 dbt_project.yml 等骨架

# 开发
dbt run                                  # 执行 model
dbt test                                 # 跑 test
dbt build                                # run + test + seed + snapshot
dbt docs generate && dbt docs serve      # 生成文档站
```

- **profile**：`~/.dbt/profiles.yml` 配置数仓连接（仓库类型/账号/密码/数据库/schema）。dbt Core 用此连数仓。
- **自己接调度**：Core 不内置调度，需配 Airflow（dbt operator）/Prefect/Dagster/cron/GitHub Actions 定时跑 `dbt build`。
- **CI/CD**：用 GitHub Actions/GitLab CI，PR 时跑 `dbt build --select state:modified+`（只测改动 + 下游）。
- **优点**：免费、完全可控、可私有部署（敏感数据不出内网）。
- **缺点**：需自己运维（调度、CI、文档站）、协作弱（无云端 IDE）。

## 二、dbt Cloud：托管 SaaS

dbt Cloud（dbt Labs 公司商业产品）在 Core 之上加托管与协作：

| 功能 | dbt Core | dbt Cloud |
| --- | --- | --- |
| 编译 + run + test | ✅（CLI） | ✅（云端） |
| dbt Cloud IDE | ❌ | ✅ **浏览器内 IDE**（实时编译 + 预览 + DAG 可视化） |
| Scheduler（托管调度） | ❌（自己接） | ✅ **配置即调度**（cron + 触发器） |
| CI/CD | ❌（自己配 GitHub Actions） | ✅ **dbt Cloud CI**（PR 自动跑 test） |
| 文档站 | 本地 `dbt docs serve` | ✅ **自动托管**（持续可访问） |
| Semantic Layer（指标层） | ❌ | ✅ **统一指标定义**（metric / MetricFlow） |
| 协作 | Git + 本地 | ✅ **多人云端协作** |
| 计费 | 免费 | 按席位（Developer/Read-only） |

- **dbt Cloud IDE**：浏览器内开发 model——写 SQL 时实时显示编译后 SQL、预览结果、DAG 图，降低分析师入门门槛。
- **Scheduler**：在 Cloud UI 配 cron（如每天凌晨 2 点跑 `dbt build`），无需运维 Airflow。
- **Semantic Layer**：统一指标定义（如「日活 DAU」），所有 BI/工具查同一指标口径，避免「各 BI 算的 DAU 不一致」。
- **计费**：按席位（Developer 席位贵，可改 model；Read-only 便宜，只查；Cloud CI 单独）。免费层有限。

## 三、Core vs Cloud：选型决策

- **选 dbt Core**：①预算敏感（免费）；②已有调度基础设施（Airflow/Dagster）；③数据敏感需私有部署（如金融/医疗，数据不出内网）；④团队小、能自己运维。
- **选 dbt Cloud**：①要省运维（不想管 Airflow/CI/文档站）；②团队大、要协作（IDE + 多人）；②要 Semantic Layer（统一指标）；④愿意为便利付席位费。
- **混合**：Core 开发 + 生产用 Cloud 调度（最常见的企业模式），或反之。项目代码互通。

## 四、与现代数据栈（MDS）集成

dbt 是现代数据栈的转换层标准，与其他工具组合：

```
数据源（MySQL/Postgres/SaaS API）
   │
   ▼  E&L（抽取加载）
Fivetran / Airbyte / Debezium / Stitch
   │
   ▼
数仓 / 湖仓（计算 + 存储）
Snowflake / BigQuery / Redshift / Databricks / Postgres / Spark
   │
   ▼  T（转换）—— dbt
dbt（model/source/test/macro，编排 SQL 推到数仓执行）
   │
   ▼
分析就绪表（fct_/dim_）
   │
   ├──► BI（查询展示）：Looker / Tableau / Metabase / Power BI
   ├──► 反向 ETL（推回业务系统）：Census / Hightouch
   └──► ML（特征）：Feast / 自建特征存储
```

- **E&L（Fivetran/Airbyte）**：把业务库/SaaS 全量增量抽取加载到数仓，dbt 不管这步。
- **T（dbt）**：在仓内做 SQL 转换，产出分析就绪表。
- **下游（BI/反向 ETL/ML）**：查 dbt 产出的表做展示/推送/建模。

这套模块化栈各专一职、云原生、按用计费——比传统一体式（Informatica/Teradata）灵活。

## 五、与 Spark/Databricks 集成

dbt 可编排 Spark 或 Databricks 的计算：

```yaml
# ~/.dbt/profiles.yml（dbt-databricks 适配器）
my_databricks:
  target: dev
  outputs:
    dev:
      type: databricks
      host: dbc-xxx.cloud.databricks.com
      http_path: /sql/1.0/warehouses/xxx
      token: dapiXXX
      schema: analytics
```

- **`dbt-databricks`**（官方推荐）：连 Databricks SQL Warehouse，用 Photon 加速，支持 Delta Lake MERGE 增量。
- **`dbt-spark`**（开源，较老）：连开源 Spark 或 Databricks cluster，功能不如 dbt-databricks 全。
- **场景**：湖仓栈用 Databricks 存储 + 计算（Delta + Photon），dbt 做转换层编排——「dbt 编排 SQL + Databricks 算」组合。这样分析师用 dbt SQL 写转换，复用 Databricks 的高性能与治理。

## 六、分工：数据工程师 vs 分析工程师

dbt 推动了数据团队的分工细化：

- **数据工程师（Data Engineer, DE）**：管基础设施——数仓/湖仓选型与运维、Spark/Flink 集群、抽取加载管道（Airbyte）、性能优化、安全治理。技能偏后端/分布式系统。
- **分析工程师（Analytics Engineer, AE）**：用 dbt 写转换 SQL——业务逻辑建模（事实表/维度表设计）、数据质量测试、文档、与业务方对接需求。技能偏 SQL + 业务理解。
- **dbt 让 AE 独立交付**：AE 用熟悉的 SQL（通过 dbt）就能交付转换流水线，不必依赖 DE 写 Python/Spark——降低协作摩擦，让 DE 专注基础设施。

## 下一步

掌握了 Core vs Cloud 与 MDS 集成后，可进入 [参考](../reference) 速查物化配置、test 类型、macro 模式、Core vs Cloud 对比、与 Spark/数仓集成要点、易错点。
