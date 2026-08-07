---
layout: doc
outline: [2, 3]
---

# 参考：dbt 物化、test、macro 与集成速查

> 基于 dbt Core 1.8 / dbt Cloud · 核于 2026-08

## 速查

- **dbt 定位**：纯 SQL 的数据转换层工具，ELT 中的 T，把软件工程引入 SQL 转换。
- **核心概念**：model（一个 SELECT 文件）、source（外部源）、ref（model 间引用建 DAG）、test（数据质量）、macro（Jinja 复用 SQL）、incremental（增量）。
- **四种物化**：view / table / incremental / ephemeral。
- **四大内置 test**：not_null / unique / accepted_values / relationships。
- **增量策略**：append / merge（默认）/ delete+insert / microbatch（1.9+）。
- **Core vs Cloud**：Core 开源 CLI 免费 + 自运维；Cloud 托管 SaaS + IDE + Scheduler + CI + Semantic Layer，按席位计费。
- **MDS 定位**：dbt 是转换层标准，与 Fivetran/Airbyte（E&L）、数仓（计算）、Looker（BI）、Census（反向 ETL）组合。
- **与 Spark/Databricks**：`dbt-databricks` / `dbt-spark` 适配器，dbt 编排 SQL，Spark/Databricks 算。
- **分工**：DE 管基础设施，AE 用 dbt 写转换 SQL。
- **关键命令**：run / test / build / compile / docs。

## 一、物化（materialization）速查

| 物化 | 数仓对象 | 执行成本 | 配置 | 适用 |
| --- | --- | --- | --- | --- |
| **view** | 视图 | 低（建视图快） | `materialized='view'` | 轻量、数据频繁变 |
| **table** | 物理表（全量重建） | 高（每次 run 重写） | `materialized='table'` | 重计算、查询频繁、稳定 |
| **incremental** | 物理表（增量插入） | 低（只插新） | `materialized='incremental', unique_key='id'` | 大表 + 增量 |
| **ephemeral** | 不物化（CTE 内联） | 0 | `materialized='ephemeral'` | 简单转换被少数引用 |

```sql
{{ config(materialized='incremental', unique_key='order_id', incremental_strategy='merge') }}
SELECT * FROM {{ source('raw','orders') }}
{% if is_incremental() %}
  WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
{% endif %}
```

## 二、source / ref / schema.yml 速查

```yaml
# _sources.yml（声明外部源）
version: 2
sources:
  - name: raw
    schema: raw
    freshness:
      warn_after: { count: 12, period: hour }
      error_after: { count: 24, period: hour }
    loaded_at_field: loaded_at
    tables:
      - name: orders
```

```yaml
# _schema.yml（声明 model + test + 文档）
version: 2
models:
  - name: fct_revenue
    description: "每日收入事实表"
    columns:
      - name: day
        tests: [not_null, unique]
      - name: revenue
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
```

```sql
-- 引用：ref（model 间）/ source（外部源）
SELECT * FROM {{ ref('stg_orders') }}      -- 引用 model
SELECT * FROM {{ source('raw','orders') }} -- 引用外部源
```

## 三、test 类型速查

| 类型 | 说明 | 写法 |
| --- | --- | --- |
| **not_null** | 非空 | schema.yml 列声明 |
| **unique** | 唯一 | schema.yml 列声明 |
| **accepted_values** | 值域 | schema.yml + values |
| **relationships** | 外键引用 | schema.yml + to/field |
| **singular/data test** | 独立 SQL，返回行即失败 | `tests/*.sql` |
| **第三方包 test** | dbt-utils/dbt-expectations | packages.yml + dbt deps |

## 四、macro 速查

```sql
-- macros/calc.sql
{% macro cents_to_dollars(column_name) %}
  ({{ column_name }} / 100.0)
{% endmacro %}

-- model 调用
SELECT {{ cents_to_dollars('amount_cents') }} AS amount_dollars
FROM {{ ref('stg_orders') }}
```

Jinja：`{{ }}` 表达式、`{% %}` 语句（if/for/macro）、`{# #}` 注释。

## 五、Core vs Cloud 对比

| 维度 | dbt Core（开源） | dbt Cloud（托管） |
| --- | --- | --- |
| 协议 | Apache 2.0 | 商业 SaaS |
| 安装 | `pip install dbt-core` | 注册账号 |
| 调度 | 自接（Airflow/cron） | 内置 Scheduler |
| IDE | 本地（VS Code） | 浏览器内 IDE |
| CI/CD | 自配（GitHub Actions） | dbt Cloud CI |
| 文档站 | 本地 serve | 自动托管 |
| Semantic Layer | ❌ | ✅ |
| 计费 | 免费 | 按席位 |
| 适用 | 预算敏感/私有部署/有运维 | 省运维/协作/统一指标 |

## 六、与 Spark/数仓集成速查

| 数仓 | 适配器 | 增量策略 |
| --- | --- | --- |
| Snowflake | `dbt-snowflake` | merge（默认）/ delete+insert |
| BigQuery | `dbt-bigquery` | merge / insert_overwrite |
| Databricks | `dbt-databricks`（官方） | merge / append |
| Postgres | `dbt-postgres` | append（merge 较弱） |
| Spark（开源） | `dbt-spark` | append / merge |

```yaml
# profiles.yml（Databricks 示例）
my_databricks:
  outputs:
    dev:
      type: databricks
      host: dbc-xxx.cloud.databricks.com
      http_path: /sql/1.0/warehouses/xxx
      token: dapiXXX
      schema: analytics
```

## 七、核心命令速查

| 命令 | 作用 |
| --- | --- |
| `dbt run` | 执行 model 物化（按 DAG 序） |
| `dbt run --select stg_orders+` | 跑 stg_orders 及其下游 |
| `dbt run --select state:modified+` | 跑改动 + 下游（CI 用） |
| `dbt test` | 跑所有数据测试 |
| `dbt build` | seed + run + test + snapshot 一起 |
| `dbt compile` | 只编译不执行（看生成的 SQL） |
| `dbt docs generate && dbt docs serve` | 生成并启动文档站 |
| `dbt source freshness` | 检查 source 新鲜度（SLA） |
| `dbt snapshot` | 跑 SCD Type 2 快照 |
| `dbt deps` | 安装 packages.yml 的包 |
| `dbt seed` | 把 seeds/*.csv 加载为数仓表（小维度表） |

## 八、易错点清单

- **「dbt 能抽取和加载数据」**：错。dbt 只做 T（转换），E&L 要 Fivetran/Airbyte 等工具。
- **「dbt 自己计算数据」**：错。dbt 编译 SQL 推到数仓执行，复用数仓库算力，自己不算。
- **「incremental 一定比 table 快/省」**：错。增量逻辑复杂（识别新数据）+ merge 有开销，小表或数据全变的场景未必划算。
- **「is_incremental() 首次 run 也过滤」**：错。首次 run（表不存在）`is_incremental()` 返回 false，全量 CREATE TABLE。
- **「ref 和 source 等价」**：错。ref 引用其他 model（dbt 生成），source 引用外部原始表（dbt 之外）。
- **「dbt 能做实时流处理」**：错。dbt 是批处理（定时 `dbt run`），实时用 Flink/Spark Streaming。
- **「dbt Cloud 是开源的」**：错。Core 开源，Cloud 是商业 SaaS（按席位计费）。
- **「所有 test 都在 schema.yml」**：错。singular/data test 是 `tests/*.sql` 独立文件，返回行即失败。
- **「macro 只能写简单 SQL」**：错。macro 用 Jinja 可写条件/循环/复杂逻辑，是可编程 SQL。
- **「snapshot 就是增量模型」**：错。snapshot 是 SCD Type 2 历史跟踪（多版本行），incremental 是增量插入，两者不同。
- **「dbt Core 一定要用 dbt Cloud 调度」**：错。Core 可接 Airflow/Prefect/cron/GitHub Actions 任意调度，不依赖 Cloud。

## 九、进阶方向（链接其他叶）

- [Spark](../spark/) —— dbt-spark/dbt-databricks 适配器，dbt 编排 Spark 计算
- [Databricks](../databricks/) —— dbt-databricks 官方适配器，连 SQL Warehouse + Photon
- [Flink](../../stream/flink/) —— 实时对照，dbt 是批处理，实时场景用 Flink

## 权威链接

- [dbt 官方文档](https://docs.getdbt.com/)
- [dbt Core（GitHub）](https://github.com/dbt-labs/dbt-core)
- [dbt Cloud](https://www.getdbt.com/product/what-is-dbt-cloud/)
- [dbt Learn（入门教程）](https://learn.getdbt.com/)
- [dbt-utils 包](https://github.com/dbt-labs/dbt-utils)
- [The Analytics Engineering Guide](https://docs.getdbt.com/terms/analytics-engineering)
- 本站幻灯片：<a href="/SlideStack/dbt-slide/" target="_blank">dbt</a>
