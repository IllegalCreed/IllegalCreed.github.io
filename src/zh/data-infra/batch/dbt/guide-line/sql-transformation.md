---
layout: doc
outline: [2, 3]
---

# SQL 转换：model、source、test、macro 与增量

> 基于 dbt Core 1.8 / dbt Cloud · 核于 2026-08

## 速查

- **model 物化配置**：在 `.sql` 文件头用 <code v-pre>{{ config(materialized='xxx', ...) }}</code> 或在 `.yml` 里集中配。四种物化：view（视图）/ table（全量重建）/ incremental（增量）/ ephemeral（CTE 内联）。
- **source 声明**：在 `_sources.yml` 里声明上游原始表（database/schema/tables），<code v-pre>{{ source('name','table') }}</code> 引用。可加 `freshness`（新鲜度监控）与 `loaded_at_field`。
- **schema.yml 声明 model + test**：在一个 `.yml` 里声明 model 的列、描述、测试。dbt 用此生成文档、跑测试、做列级血缘。
- **两类 test**：①**generic test**（内置/自定义通用测试）——`not_null`/`unique`/`accepted_values`/`relationships`，在 schema.yml 列上声明；②**singular test（data test）**——`tests/` 下独立 `.sql` 文件，返回任意行即失败。dbt 1.8+ 把 data test 与 singular test 统一为新的 test 框架。
- **四大内置 test**：`not_null`（非空）、`unique`（唯一）、`accepted_values`（值域）、`relationships`（外键引用完整性，引用另一表存在的值）。
- **macro（宏）**：用 Jinja 写的可复用 SQL 函数——<code v-pre>{% macro calc_revenue(amount, qty) %}{{ amount }} * {{ qty }}{% endmacro %}</code>，在任意 model 里 <code v-pre>{{ calc_revenue(...) }}</code> 调用。封装重复 SQL 逻辑。
- **Jinja 模板**：dbt 用 Jinja2 模板——<code v-pre>{{ }}</code> 表达式（求值输出）、<code v-pre>{% %}</code> 语句（控制流 if/for/macro）、<code v-pre>{# #}</code> 注释。支持条件、循环、宏、过滤器，让 SQL 可编程。
- **增量模型（incremental）核心**：只处理「自上次 run 以来的新数据」而非全量重算，大表省算力。需配 `unique_key`（去重键）+ `incremental_strategy`（策略）+ 过滤新数据的逻辑（用 `is_incremental()` 判断）。
- **增量策略（仓库相关）**：①`append`（直接追加，最简单不去重）；②`merge`（按 unique_key MERGE，去重默认）；③`delete+insert`（先删后插）；④`microbatch`（dbt 1.9+ 按批）。
- **snapshot（SCD Type 2）**：跟踪维度表的历史变更——`dbt snapshot` 把变化记录为多版本行（valid_from/valid_to/is_current），用于「某时点的维度值」分析。

## 一、model 物化：配置方式与场景

model 物化可在 `.sql` 文件头或 `.yml` 里配：

```sql
-- 方式一：文件头 config（行内）
{{ config(
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge'
) }}

SELECT ... FROM {{ ref('stg_orders') }}
{% if is_incremental() %}
  WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
{% endif %}
```

```yaml
# 方式二：yml 集中配（推荐，便于管理）
version: 2
models:
  - name: fct_orders
    config:
      materialized: incremental
      unique_key: order_id
    columns:
      - name: order_id
        tests: [not_null, unique]
```

**物化选择决策**：①数据小/频繁变 → view；②重计算/查询频繁/数据稳定 → table；③大表 + 增量 → incremental；④简单转换被少数引用 → ephemeral。

## 二、source 声明与新鲜度监控

source 声明 dbt 之外的原始表，并可监控数据新鲜度：

```yaml
# models/staging/_sources.yml
version: 2
sources:
  - name: raw
    database: warehouse
    schema: raw
    freshness:                          # 新鲜度监控
      warn_after: { count: 12, period: hour }
      error_after: { count: 24, period: hour }
    loaded_at_field: loaded_at          # 用此字段判断新鲜度
    tables:
      - name: orders
        columns:
          - name: order_id
            tests: [not_null, unique]
      - name: users
```

- <code v-pre>{{ source('raw','orders') }}</code> 引用时，dbt 解析成 `warehouse.raw.orders`。
- **freshness**：`dbt source freshness` 检查 `loaded_at_field` 是否在 warn/error 阈值内（如 12 小时未更新 warn，24 小时 error），数据延迟告警。
- **source freshness** 是数据 SLA 监控的基础——上游延迟了 dbt 能发现。

## 三、schema.yml：model 与 test 的集中声明

在一个 `.yml` 里声明 model 的列、描述、测试、文档：

```yaml
version: 2
models:
  - name: fct_daily_revenue
    description: "每日收入汇总事实表，BI 直查"
    columns:
      - name: day
        description: "统计日期"
        tests:
          - not_null
          - unique
      - name: revenue
        description: "当日总收入"
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"        # 自定义 generic test
      - name: order_count
        tests:
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0              # 第三方包的 test
```

- **description**：列/model 的文档，`dbt docs` 生成 HTML 文档站。
- **tests**：列级测试（generic test），run 时失败则报错。第三方包（dbt-utils/dbt-expectations）提供更多 test。
- **列级血缘**：dbt 据此生成列级血缘图（model 的列从哪来）。

## 四、test：保证数据质量

dbt 的两类 test：

### generic test（通用测试，schema.yml 列声明）

```yaml
columns:
  - name: order_id
    tests:
      - not_null                # 非空
      - unique                  # 唯一
      - relationships:          # 外键引用
          to: ref('stg_orders')
          field: order_id
  - name: status
    tests:
      - accepted_values:        # 值域
          values: ['completed', 'cancelled', 'pending']
```

**四大内置 test**：`not_null`、`unique`、`accepted_values`、`relationships`。第三方包（dbt-utils、dbt-expectations）扩展更多。

### singular test（独立 SQL 文件，data test）

```sql
-- tests/assert_revenue_positive.sql
-- 返回任意行即测试失败
SELECT *
FROM {{ ref('fct_daily_revenue') }}
WHERE revenue < 0
```

`singular test` 是独立 SQL 文件，**返回任意行即失败**——适合复杂业务断言（如「收入不能为负」「订单金额必须匹配支付金额」）。

## 五、macro 与 Jinja：SQL 可编程

macro 用 Jinja 写可复用 SQL 函数：

```sql
-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name, precision=2) %}
    ({{ column_name }} / 100.0)  -- 假设存的是分
{% endmacro %}
```

```sql
-- models/staging/stg_orders.sql
SELECT
    order_id,
    {{ cents_to_dollars('amount_cents') }} AS amount_dollars  -- 调用 macro
FROM {{ source('raw', 'orders') }}
```

- **Jinja 三种标记**：<code v-pre>{{ expr }}</code>（表达式输出）、<code v-pre>{% statement %}</code>（控制流 if/for/macro/set）、`{# comment #}`（注释）。
- **macro 复用**：把重复 SQL（如金额转换、日期格式化、缓慢变化维度）封装成 macro，跨 model 复用，统一口径。
- **package 复用**：用 dbt-utils/dbt-codegen/dbt-expectations 等社区包（在 `packages.yml` 声明 + `dbt deps` 安装），获得大量现成 macro/test。

## 六、增量模型：省算力的关键

大表（亿级行）每次全量重算成本高，**增量模型只处理新数据**：

```sql
-- models/marts/fct_orders.sql
{{ config(
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge'       -- Snowflake 默认 merge
) }}

SELECT *
FROM {{ source('raw', 'orders') }}
{% if is_incremental() %}              -- 增量时才加过滤
  WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
{% endif %}
```

- **`is_incremental()`**：当表已存在（非首次 run）返回 true，加上「只取新数据」的 WHERE。
- **`unique_key`**：去重键（如 order_id），用于 merge 策略判断「是 INSERT 新行还是 UPDATE 已有行」。
- **增量策略**：
  - `append`：直接 `INSERT INTO` 新数据，不去重（最简单，适合只追加不更新的日志）。
  - `merge`：`MERGE INTO ... ON unique_key`（Snowflake/BigQuery 默认，去重 upsert）。
  - `delete+insert`：先 `DELETE` unique_key 匹配的，再 `INSERT`（适合 batch 重写）。
  - `microbatch`（dbt 1.9+）：按时间批处理，每批独立。
- **首次 run**：表不存在时 `is_incremental()` 返回 false，全量 `CREATE TABLE AS SELECT`。
- **后续 run**：只处理 WHERE 过滤的新数据，MERGE 进已有表。

增量模型的难点：**正确识别「新数据」**——用 `created_at > MAX(created_at)` 简单但漏掉迟到/更新；更稳健用 `updated_at` 或 partition + watermark。

## 七、snapshot：SCD Type 2 历史跟踪

snapshot 跟踪维度表的历史变更（如用户的会员等级变化）：

```sql
-- snapshots/snap_users.sql
{% snapshot snap_users %}
{{
    config(
      target_schema='snapshots',
      unique_key='user_id',
      strategy='timestamp',
      updated_at='updated_at',
    )
}}
SELECT * FROM {{ source('raw', 'users') }}
{% endsnapshot %}
```

- **SCD Type 2**：变化时**不覆盖**旧值，而是「关闭」旧行（valid_to = 当前时间），「开启」新行（valid_from = 当前时间，is_current = true）。某时点的维度值 = `WHERE valid_from <= ts AND valid_to > ts`。
- **策略**：`timestamp`（按 updated_at 字段判断变化）vs `check`（按所有列 hash 对比）。
- **用途**：历史回溯分析（如「下单时的用户等级」，而非「现在的用户等级」）。

## 下一步

掌握了 model/source/test/macro/增量后，下一步是 [dbt Core vs Cloud、现代数据栈集成](./core-vs-cloud) —— dbt Core（开源 CLI）vs dbt Cloud（托管 + IDE + 调度），与现代数据栈、Spark、数据工程师分工。
