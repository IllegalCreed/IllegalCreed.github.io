---
layout: doc
outline: [2, 3]
---

# 入门：dbt 定位、model 与 DAG 依赖

> 基于 dbt Core 1.8 / dbt Cloud · 核于 2026-08

## 速查

- **dbt 定位**：**纯 SQL 的数据转换层工具**——把软件工程最佳实践（Git/模块化/测试/文档/CI）引入 SQL 转换。不存储不计算数据（算力交给数仓），只编排 SQL 转换。
- **T in ELT**：dbt 是 ELT 的「T」（Transform 转换）。E（Extract 抽取，业务库→湖/仓）和 L（Load 加载）由 Fivetran/Airbyte 等工具完成，dbt 接手在仓内做 SQL 转换。与 ETL（先抽取转换再加载）相比，ELT 利用现代数仓库算力，先全量加载再在仓内转换更简单。
- **model**：dbt 的基本单元——**一个 `.sql` 文件就是一个 model**，内容是一个 `SELECT` 语句（带可选配置头）。dbt 编译后把 SELECT 物化成数仓里的表/视图/临时表，名字默认是文件名。
- **四种物化（materialization）**：①**table**（全量重建表，每次 run 重写）；②**view**（建视图，省空间但查询时算）；③**incremental**（增量，只插新数据，省算力）；④**ephemeral**（不物化，编译成 CTE 内联到引用处）。
- **source**：声明上游原始数据（如数仓里已有的 `raw_orders` 表），在 YAML 里定义。让 dbt 知道「这是外部源，不是 dbt 生成的」。
- **ref()**：在 model 里引用其他 model——<code v-pre>{{ ref('stg_orders') }}</code>。dbt 据此**自动构建 DAG 依赖**，按拓扑序执行，无需手动编排。
- **DAG**：dbt 把所有 model 的 ref 依赖构成**有向无环图**，`dbt run` 时按依赖序执行（先跑被依赖的，再跑依赖者），`dbt test` 在 run 后跑测试。
- **与数仓/Spark 的关系**：dbt **编译 SQL 推到数仓执行**，复用数仓库算力与安全（不自己算）。底层数仓可以是 Snowflake/BigQuery/Redshift/Databricks/Postgres/Spark（dbt-spark 适配器）。所以「dbt 负责 SQL 编排，数仓负责算」。
- **核心命令**：`dbt run`（执行 model 物化）、`dbt test`（跑数据测试）、`dbt compile`（编译不执行）、`dbt docs generate/serve`（生成文档）、`dbt build`（run + test + seed + snapshot 一起）。
- **进阶顺序**：[SQL 转换：model、source、test、macro 与增量](./guide-line/sql-transformation) → [dbt Core vs Cloud、现代数据栈集成](./guide-line/core-vs-cloud) → [参考](./reference)。

## 一、dbt 是什么：ELT 中的 T

数据从业务库到分析要经过「抽取 → 加载 → 转换」三步。两种范式：

- **ETL（Extract-Transform-Load）**：先抽取，在中间引擎做转换，再加载到数仓。转换在加载前，需独立计算引擎（如 Informatica）。复杂且重复。
- **ELT（Extract-Load-Transform）**：先抽取全量加载到数仓（湖/仓），**在仓内**用 SQL 做转换。利用现代数仓（Snowflake/BigQuery）的强大算力，转换更简单（纯 SQL）、更高效（并行）。

**dbt 是 ELT 中的 T**——它不管 E（抽取，Fivetran/Airbyte 做）和 L（加载），只负责在仓内编排 SQL 转换：

```
业务库（MySQL/Postgres）
   │  E（抽取）+ L（加载）—— Fivetran / Airbyte / Debezium
   ▼
数仓 / 湖仓（Snowflake / BigQuery / Databricks）
   ├── raw_orders（原始表，已加载）
   ├── raw_users
   │   │  T（转换）—— dbt
   │   ▼
   ├── stg_orders（dbt model，清洗标准化）
   ├── int_orders_enriched（dbt model，中间层）
   └── fct_daily_revenue（dbt model，事实表，BI 直查）
```

dbt 把这套转换流水线「软件工程化」——Git 版本控制、model 模块化、test 测试、docs 文档、CI/CD——让 SQL 转换像写代码一样严谨。

## 二、model：一个 SELECT 就是一个模型

model 是 dbt 的基本单元——**一个 `.sql` 文件就是一个 model**，文件内容是一个 SELECT 语句（可带配置头）：

```sql
-- models/staging/stg_orders.sql
{{ config(materialized='view') }}      -- 可选配置：物化为 view

SELECT
    order_id,
    user_id,
    amount,
    status,
    created_at
FROM {{ source('raw', 'orders') }}     -- 引用上游 source
WHERE status = 'completed'             -- 清洗过滤
```

- **dbt 编译**：把 <code v-pre>{{ source('raw','orders') }}</code> 解析成数仓里的 `raw.orders`，生成最终 SQL。
- **物化**：默认物化为 `view`（也可配 table/incremental/ephemeral）。`dbt run` 时 dbt 把编译后的 SQL 推到数仓执行 `CREATE VIEW stg_orders AS SELECT ...`。
- **命名约定**：常见分层 `staging/stg_`（标准化）→ `intermediate/int_`（中间计算）→ `marts/fct_/dim_`（事实表/维度表，BI 直查）。

## 三、source 与 ref：构建 DAG

dbt 通过 **source（外部源）** 和 **ref（model 间引用）** 自动构建 DAG：

- **source**：在 `.yml` 文件里声明上游原始表（数仓已有，非 dbt 生成）：
  ```yaml
  # models/staging/sources.yml
  version: 2
  sources:
    - name: raw              # 源名
      database: warehouse
      schema: raw
      tables:
        - name: orders       # → 仓里 raw.orders
        - name: users
  ```
  在 model 里用 <code v-pre>{{ source('raw','orders') }}</code> 引用。

- **ref**：在 model 里引用其他 model：<code v-pre>{{ ref('stg_orders') }}</code>。dbt 据此知道「这个 model 依赖 stg_orders」，构建依赖图。
  ```sql
  -- models/marts/fct_daily_revenue.sql
  SELECT
      DATE(created_at) AS day,
      SUM(amount) AS revenue
  FROM {{ ref('stg_orders') }}          -- 引用 stg_orders model
  GROUP BY 1
  ```

dbt 把所有 ref 依赖构成 **DAG**（有向无环图），`dbt run` 时按拓扑序执行（先跑 stg_orders，再跑依赖它的 fct_daily_revenue）。无需手动写 Airflow DAG——ref 即依赖。

## 四、四种物化策略

model 怎么物化成数仓对象，决定性能与成本：

| 物化 | 数仓对象 | 执行成本 | 适用 |
| --- | --- | --- | --- |
| **view** | 视图 | 低（建视图快），查询时算 | 轻量转换、数据频繁变 |
| **table** | 物理表（全量重建） | 高（每次 run 重写全表） | 重计算、查询频繁、数据稳定 |
| **incremental** | 物理表（增量插入） | 低（只插新数据） | **大表 + 增量场景，省算力** |
| **ephemeral** | 不物化（CTE 内联） | 0（不创建对象） | 简单转换被少数引用 |

- **view**：dbt `CREATE VIEW AS SELECT`，不存数据，每次查询时执行 SELECT。适合轻量或数据频繁变的转换。
- **table**：dbt `CREATE TABLE AS SELECT` 全量重建。每次 `dbt run` 重写整表。适合查询频繁、数据稳定的重计算转换。
- **incremental**：只插入「自上次 run 以来的新数据」，不全量重算。大表（亿级行）+ 增量场景省算力。需要配 `unique_key` + `incremental_predicates`。
- **ephemeral**：dbt 不创建表/视图，把 SELECT 编译成 CTE 内联到引用它的 model 里。适合简单转换被少数 model 引用——避免物化开销。

## 五、与数仓/Spark 的关系：dbt 编排，数仓算

dbt **不自己计算**——它把编译后的 SQL 推到底层数仓执行，复用数仓库算力、安全、并发能力：

```
dbt（编排层）
  · 编译 model（SELECT + Jinja）
  · 构建依赖 DAG
  · 调度 run/test/docs
        │ 推 SQL（适配器翻译方言）
        ▼
数仓（计算层）
  Snowflake / BigQuery / Redshift / Databricks / Postgres / Spark
  · 执行 CREATE TABLE/VIEW/INSERT
  · 仓库原生算力与安全
```

- **适配器（adapter）**：dbt 通过适配器支持多种数仓——`dbt-snowflake`/`dbt-bigquery`/`dbt-databricks`/`dbt-postgres`/`dbt-spark`。适配器负责把 dbt 通用 SQL 翻译成各数仓方言（如 MERGE 语法差异）。
- **dbt-spark**：dbt 可适配 Spark（开源 dbt-spark 适配器，配合 Databricks），让 dbt 跑在 Spark 引擎上——这样「dbt 编排 + Spark 计算」组合也能用，但更常见是 dbt + 专用数仓（Snowflake/BigQuery）。

## 六、核心命令与项目结构

典型 dbt 项目结构：

```
my_dbt_project/
  ├── dbt_project.yml          # 项目配置（profile/路径/全局配置）
  ├── models/
  │     ├── staging/           # stg_ 标准化层
  │     │     ├── stg_orders.sql
  │     │     └── _sources.yml # source 声明
  │     ├── intermediate/      # int_ 中间层
  │     └── marts/             # fct_/dim_ 业务层（BI 直查）
  │           ├── _schema.yml  # model + test 声明
  │           └── fct_revenue.sql
  ├── macros/                  # 可复用 SQL 宏
  ├── seeds/                   # 静态 CSV（小维度表）
  ├── snapshots/               # SCD Type 2 快照
  ├── tests/                   # 自定义 data test
  └── target/                  # 编译产物（编译 SQL + run 结果）
```

**核心命令**：

- `dbt run`：执行所有 model 物化（按 DAG 序）。可加 `--select stg_orders` 跑子集。
- `dbt test`：跑所有数据测试（not_null/unique 等）。
- `dbt build`：seed + run + test + snapshot 一起（最常用）。
- `dbt compile`：只编译不执行（看生成的 SQL）。
- `dbt docs generate && dbt docs serve`：生成并启动文档站（含 DAG 图）。

## 下一步

理解了 dbt 的总览后，下一步深入两个核心——[SQL 转换：model、source、test、macro 与增量](./guide-line/sql-transformation)（增量策略 + test + macro）与 [dbt Core vs Cloud、现代数据栈集成](./guide-line/core-vs-cloud)（Core vs Cloud + 与 Spark/数仓集成）。
