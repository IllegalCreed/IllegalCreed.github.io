---
layout: doc
outline: [2, 3]
---

# Asset 优先：Software-defined Asset 与 IO Manager

> 基于 Dagster 1.x · 核于 2026-08

## 速查

- **Software-defined Asset（软件定义资产）**：用 `@asset` 装饰器声明式定义数据资产——它的计算逻辑、上游依赖（**函数参数名 = 上游 asset 名**）、存储方式（IO Manager）。资产依赖图即调度图。
- **依赖即参数**：asset 函数的参数名自动对应同名上游 asset。`def clean(raw):` 表示 `clean` 依赖 `raw`——无需 Airflow 的 `>>` 或 Prefect 的函数调用约定，更显式。
- **物化（Materialization）**：asset 被执行 = 产出新数据 = 物化一次。Dagster 记录每个 asset 的物化历史、最新版本。调度目标：让资产图保持最新。
- **源 asset（Source Asset）**：无计算逻辑、只有外部引用的 asset（如外部数据库表），用 `SourceAsset` 声明，作为资产图的输入节点。
- **分区（Partition）**：asset 可声明按维度分区（如按日期/按地区），Dagster 跟踪每个分区的物化状态，支持**增量处理**（只跑未物化的分区）。
- **IO Manager**：自动管 asset/op 的数据**存储与加载**（存哪、怎么序列化）。开发者只声明存什么，存哪/怎么序列化交给 IO Manager——业务代码与存储解耦。
- **内置 IO Manager**：`fs_io_manager`（本地文件）、`s3_pickle_io_manager`（S3 + pickle）、`adls2_io_manager`（Azure Data Lake）、`dbt`（dbt 模型）等，可自定义。
- **`io_manager_key`**：asset 可指定用哪个 IO Manager（`@asset(io_manager_key="s3_io")`），同一资产图可混合多种存储。
- **op vs asset**：**op** 是传统「无副作用任务」（输入→输出，类似 Airflow Task），**asset** 是「产出数据资产的任务」（现代推荐，可追踪可物化）。新代码首选 asset。
- **资产图可视化**：Dagster UI 自动渲染资产依赖图，每个 asset 显示物化状态、最新时间、上游/下游——治理直观。

## 一、`@asset`：声明式定义数据资产

`@asset` 是 Dagster 资产优先哲学的核心，它把「资产的计算逻辑 + 依赖 + 存储」一体化声明：

```python
from dagster import asset, Definitions

@asset(group_name="etl")
def raw_users():                       # 无参数 = 源 asset（无上游）
    return fetch_users_from_api()

@asset(group_name="etl")
def clean_users(raw_users):            # 参数 raw_users = 上游 asset
    return [u for u in raw_users if u["active"]]

@asset(group_name="analytics")
def active_count(clean_users):         # 依赖 clean_users
    return len(clean_users)

defs = Definitions(assets=[raw_users, clean_users, active_count])
```

- **依赖即参数**：`clean_users(raw_users)` 的参数 `raw_users` 自动对应同名 asset，Dagster 建依赖边。
- **`group_name`**：分组，UI 按组展示（如 etl 组、analytics 组），便于组织大型资产图。
- **资产图自动构建**：所有 asset 的依赖关系自动拼成资产依赖图，无需手动编排。
- **可单独物化**：可单独跑某个 asset（只物化它），或跑整个资产图（按依赖顺序物化所有）。

## 二、依赖即参数：asset 依赖的显式表达

Dagster 用「函数参数名 = 上游 asset 名」表达依赖，比 Airflow 的 `>>` 和 Prefect 的函数调用更显式：

```python
@asset
def orders(): ...                      # 源 asset

@asset
def clean_orders(orders): ...          # 依赖 orders（参数名匹配）

@asset
def report(clean_orders, users): ...   # 依赖两个上游（多参数）
```

- **多依赖**：函数多个参数 = 依赖多个上游 asset。
- **显式 vs 隐式**：Airflow 要 `t1 >> t2` 显式声明；Prefect 用函数调用隐式；Dagster 用参数名「半显式」（参数名必须匹配上游 asset 名，编译器可检查）。
- **可读性**：asset 函数签名直接告诉你它依赖什么，读代码即读依赖。

## 三、源 asset 与外部数据

不是所有 asset 都有计算逻辑——有些只是「外部数据的引用」（如外部数据库表、第三方 API 数据），用 `SourceAsset`：

```python
from dagster import SourceAsset, asset

# 源 asset：外部数据库表（无计算逻辑，只有引用）
external_users = SourceAsset("external_users", description="外部 MySQL 用户表")

@asset
def sync(external_users):              # 依赖外部表
    return sync_from_external()
```

- **`SourceAsset`**：声明外部数据为资产图节点，作为输入。
- **`@asset(non_argument_kwargs={"external": ...})`**：高级用法，控制参数与上游的映射。

## 四、分区：增量处理的支持

asset 可声明按维度分区，支持增量处理（只跑未物化的分区）：

```python
from dagster import DailyPartitionsDefinition

@asset(partitions_def=DailyPartitionsDefinition(start_date="2026-01-01"))
def daily_orders(context):
    partition_key = context.asset_partitions_time_window.start
    return fetch_orders_for_date(partition_key)   # 只处理该分区
```

- **`partitions_def`**：定义分区策略（按日/按月/按静态类别）。
- **`context.asset_partitions_time_window`**：运行时获取当前分区的区间。
- **增量**：Dagster 跟踪每个分区的物化状态，UI 可选「只跑未物化的分区」，避免全量重算。
- **回填（Backfill）**：可一次性物化多个历史分区（如补跑历史数据）。

## 五、物化（Materialization）：调度核心概念

asset 的「物化」是 Dagster 调度的核心：

- **物化 = 跑了一次 + 产了新数据**：asset 函数被执行，输出被存储（由 IO Manager），资产版本更新。
- **调度目标**：让资产图保持最新——上游 asset 物化后，依赖它的下游 asset 应重新物化。
- **物化记录**：Dagster 记录每次物化（时间、输入、输出、版本），UI 可追溯。
- **数据感知**：下游 asset 自动感知上游物化（无需 Sensor 轮询），这是相对 Airflow 2.x 的核心优势。
- **手动物化**：可在 UI 手动触发某个 asset 物化（开发/调试）。

## 六、IO Manager：解耦存储与业务逻辑

IO Manager 是 Dagster 解耦「业务逻辑」与「数据存储」的关键创新：

```python
from dagster import fs_io_manager, Definitions, asset

@asset
def raw(): ...                         # 业务逻辑：产出 raw（不写存到哪）

defs = Definitions(
    assets=[raw],
    resources={"io_manager": fs_io_manager},    # 输出存本地文件系统
)
# 想改存 S3？换 io_manager 配置，业务代码不动
```

- **IO Manager 管存储**：决定 asset 输出存哪（本地/S3/数据库）、怎么序列化（pickle/parquet）。
- **业务代码解耦**：asset 函数只写「产出什么数据」，不写「存到哪」——存储变更（本地→S3）只改 IO Manager 配置，不动业务代码。
- **`io_manager_key`**：asset 可指定用哪个 IO Manager：

```python
@asset(io_manager_key="s3_io")        # 这个 asset 的输出存 S3
def big_data(): ...
```

- **内置 IO Manager**：
  - `fs_io_manager`：本地文件系统（pickle）。
  - `s3_pickle_io_manager`：S3 + pickle。
  - `adls2_io_manager`：Azure Data Lake Gen2。
  - `dbt` CLI/`dagster-dbt`：dbt 模型（一等公民集成）。
- **自定义 IO Manager**：实现 `handle_output`（存）和 `load_input`（读）两个方法，可按需定制（如存数据库、调用 API）。

## 七、op vs asset：新旧两种抽象

Dagster 有两种任务抽象，理解区别有助于迁移与选型：

| 维度 | op（传统） | asset（现代） |
| --- | --- | --- |
| 抽象 | 无副作用任务（输入→输出） | 产出数据资产的任务 |
| 依赖表达 | graph 显式编排 | 函数参数即依赖 |
| 可追踪 | 一般 | **物化历史、版本** |
| 数据感知 | 弱 | **强（资产为核心）** |
| 推荐 | 兼容老代码 | **新代码首选** |

```python
# op 写法（传统，类似 Airflow）
from dagster import op, graph, Definitions

@op
def extract(): ...
@op
def transform(raw): ...

@graph
def pipeline():
    transform(extract())               # graph 显式编排

# asset 写法（现代推荐）
@asset
def raw(): ...
@asset
def clean(raw): ...                    # 参数即依赖
```

- **Dagster 鼓励迁移到 asset**：享受资产优先的好处（可追踪、数据感知、治理直观）。
- **op 仍支持**：兼容老代码、或无明确产出的任务（如发通知）。

## 八、资产图可视化与治理

Dagster UI 自动渲染资产依赖图，治理直观：

- **资产图谱**：每个 asset 是节点，依赖是边，UI 可视化整个资产图。
- **物化状态**：每个 asset 显示是否已物化、最新物化时间、版本。
- **血缘追踪**：点击某 asset，可看上游（数据从哪来）和下游（数据去哪了），便于影响分析。
- **分区视图**：分区 asset 可按分区看物化状态（哪些分区已跑、哪些待跑）。

这种「资产图即治理视图」是 Dagster 相对 Airflow（以 DAG 运行为中心）的核心差异化。

## 下一步

掌握 asset/IO Manager 后，下一站是[类型系统、生态与被收购后定位](./ecosystem-and-prefect)——理解 DagsterType 强类型校验、Resource 注入、Dagster 生态（dbt 集成），以及 2026-07 被 Prefect 收购后的来龙去脉与 Dagster 的重定位。
