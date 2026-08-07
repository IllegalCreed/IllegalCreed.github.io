---
layout: doc
outline: [2, 3]
---

# 入门：Dagster 定义、Asset-centric 与类型系统

> 基于 Dagster 1.x · 核于 2026-08

## 速查

- **定义**：Dagster 是 2018 年 Nick Schrock（前 Meta/Facebook GraphQL 联合创始人）创立的**资产优先（Asset-centric）数据编排平台**，核心理念「**以数据资产（Asset）为一等公民**」。资产依赖图即调度图，调度围绕「资产是否物化/最新」展开。
- **Asset-centric 哲学**：与 Airflow「以 Task 为中心」、Prefect「以 Flow 为中心」不同，Dagster 让你**声明式定义数据资产**（表、模型、报表）及其上游依赖。开发者回答「我要产出哪些资产、它们依赖哪些资产」，平台负责调度让资产保持最新。
- **Software-defined Asset（软件定义资产）**：用 `@asset` 装饰器声明一个数据资产——它的计算逻辑、上游依赖（函数参数即上游资产）、存储方式（IO Manager）。资产间依赖图就是调度图。
- **物化（Materialization）**：asset 被「物化」=它的计算逻辑跑了一次、产出了新数据。调度核心：让下游 asset 在上游物化后重新物化，保持整个资产图最新。
- **IO Manager**：自动管 asset/op 的数据存储与加载（存哪、怎么序列化），开发者只声明存什么，存哪儿交给 IO Manager（如 fs_io_manager 存本地、s3_pickle_io_manager 存 S3）。存储变更（本地→S3）不改业务代码。
- **类型系统（强类型）**：DagsterType/Pydantic 风格的强类型，运行时校验数据契约——asset 输入输出可声明类型，类型不匹配 Dagster 报错，提前发现 schema 漂移。
- **op vs asset**：**op** 是传统的「无副作用任务」（类似 Airflow Task，输入→输出）；**asset** 是「产出数据资产的任务」（现代推荐写法，有名字、可追踪、可物化）。新代码推荐 asset。
- **Resource**：外部系统连接的封装（数据库连接、API client），通过类型系统注入 asset/op，便于测试（mock resource）与配置切换。
- **2026-07-13 被 Prefect 收购**：Prefect 收购 Dagster Labs（产品+代码+客户+团队），Dagster 预计 2026-08 起以 Prefect 名义运营。Dagster 的资产能力融入 Prefect，未来定位是「Prefect 的资产治理模块」。
- **进阶顺序**：[Asset 优先与 IO Manager 详解](./guide-line/asset-centric) → [类型系统与被收购后定位](./guide-line/ecosystem-and-prefect) → [参考](./reference)。

## 一、Dagster 是什么：资产优先的编排器

数据工程的产出是「数据资产」——表、模型、报表、特征。传统编排器（Airflow）以「任务（Task）」为中心：你定义任务和依赖，但「任务产出什么资产」「资产依赖什么资产」是隐含的，平台不感知。Dagster 的创始人 Nick Schrock（前 Meta/Facebook GraphQL 联合创始人）提出「**资产优先（Asset-centric）**」：直接声明数据资产及其依赖，调度围绕「让资产保持最新」展开：

```python
from dagster import asset, Definitions

@asset
def raw_users():                     # asset 1：原始用户数据
    return fetch_from_api()

@asset
def clean_users(raw_users):          # asset 2：清洗后（参数 raw_users = 上游依赖）
    return [u for u in raw_users if u.active]

@asset
def user_report(clean_users):        # asset 3：报表（依赖 clean_users）
    return build_report(clean_users)

defs = Definitions(assets=[raw_users, clean_users, user_report])
```

- **资产依赖图即调度图**：`clean_users` 的参数 `raw_users` 自动建立依赖，Dagster 知道要先物化 `raw_users` 才能 `clean_users`。
- **资产可追踪**：每个 asset 有名字、物化历史、最新版本，UI 可见整个资产图谱。
- **数据感知强**：调度核心是「资产是否最新」，无需 Airflow 的 Sensor 轮询。

## 二、Asset-centric：以数据资产为一等公民

三大编排器的一等公民不同，决定了哲学差异：

| 编排器 | 一等公民 | 编排中心 | 典型场景 |
| --- | --- | --- | --- |
| **Airflow** | Task（任务） | 任务执行 | 传统批 ETL |
| **Prefect** | Flow（函数） | 流程编排 | ML/动态流程 |
| **Dagster** | **Asset（数据资产）** | **资产是否最新** | **数据治理/ELT** |

- **资产优先的好处**：资产图谱直接对应业务价值（哪些表/模型/报表），治理直观；资产物化历史可追溯；下游资产自动感知上游变化。
- **对 ELT 友好**：ELT（抽取-加载-转换）的产出就是资产（表/视图），Dagster 的资产模型天然契合（dbt 集成是一等公民）。
- **痛点**：动态流程（ML 超参搜索）不如 Prefect 灵活——资产模型偏「声明式」，运行时动态生成不如普通函数自然。

## 三、Software-defined Asset：软件定义资产

`@asset` 装饰器是 Dagster 的核心抽象，它把「数据资产的计算逻辑 + 依赖 + 存储」声明式定义：

```python
from dagster import asset

@asset(group_name="etl")
def raw_orders():                    # 无参数 = 无上游（源 asset）
    return pd.read_sql("SELECT * FROM orders")

@asset(group_name="etl")
def clean_orders(raw_orders):        # 参数名 = 上游 asset 名
    return raw_orders.dropna()

@asset(group_name="ml", io_manager_key="s3_io")
def features(clean_orders):          # 指定 IO Manager（存 S3）
    return featurize(clean_orders)
```

- **依赖即参数**：asset 函数的参数名就是上游 asset 名，Dagster 自动建依赖。
- **`group_name`**：分组，便于 UI 组织（如 etl 组、ml 组）。
- **`io_manager_key`**：指定用哪个 IO Manager 存输出。
- **物化**：asset 被执行 = 产出新数据 = 物化一次，Dagster 记录物化历史。

## 四、物化（Materialization）：让资产保持最新

asset 的「物化」是 Dagster 调度的核心概念：

- **物化**=asset 的计算逻辑跑了一次，产出了新数据。
- **调度目标**：让整个资产图保持「最新」——上游 asset 物化后，下游 asset 应重新物化以反映上游变化。
- **增量/分区**：asset 可声明分区（如按日期分区），Dagster 跟踪每个分区的物化状态，支持增量处理（只跑未物化的分区）。
- **数据感知**：下游 asset 自动感知上游物化，无需手动 Sensor——这是相对 Airflow 2.x（只按时间调度）的核心优势。

## 五、IO Manager：解耦存储与业务逻辑

IO Manager 是 Dagster 解耦「业务逻辑」与「数据存储」的关键：

```python
from dagster import fs_io_manager, Definitions

@asset
def raw(): ...                       # 业务逻辑：产出 raw 数据

# 不写「存到哪」——交给 IO Manager
defs = Definitions(
    assets=[raw],
    resources={"io_manager": fs_io_manager},  # 输出存本地文件系统
)
# 想改存 S3？换 io_manager 即可，业务代码不动
```

- **IO Manager 管存储**：决定 asset 输出存哪（本地/S3/数据库）、怎么序列化（pickle/parquet）。
- **业务代码解耦**：asset 函数只写「产出什么数据」，不写「存到哪」——存储变更（本地→S3）只改 IO Manager 配置，不动业务代码。
- **内置 IO Manager**：`fs_io_manager`（本地）、`s3_pickle_io_manager`（S3 + pickle）、`dbt`（dbt 模型）等，可自定义。

## 六、类型系统：运行时数据契约校验

Dagster 的强类型系统让数据契约可校验：

```python
from dagster import asset, DagsterType

# 自定义类型：校验是 DataFrame 且有特定列
UserFrame = DagsterType(
    name="UserFrame",
    type_check_fn=lambda _, v: isinstance(v, pd.DataFrame) and "user_id" in v.columns,
)

@asset(dagster_type=UserFrame)
def clean_users(raw_users):
    return clean(raw_users)          # 若返回缺 user_id 列，Dagster 运行时报错
```

- **运行时校验**：asset 输入输出可声明类型，类型不匹配 Dagster 立即报错（而非让下游默默处理脏数据）。
- **Pydantic 风格**：支持 Pydantic Model 作为类型，自动校验 schema。
- **价值**：提前发现 schema 漂移（上游改了字段，下游立即知道），数据契约显式化。

## 七、op vs asset：新旧两种写法

Dagster 有两种任务抽象：

| 抽象 | 是什么 | 推荐 |
| --- | --- | --- |
| **op** | 传统「无副作用任务」，输入→输出（类似 Airflow Task） | 兼容老代码 |
| **asset** | 「产出数据资产的任务」，有名字、可追踪、可物化 | **新代码首选** |

- **op**：`@op` 装饰器，graph（op 的拓扑）显式编排，类似 Airflow DAG。
- **asset**：`@asset` 装饰器，依赖即参数，资产图谱自然。
- **迁移**：Dagster 鼓励从 op 迁移到 asset，享受资产优先的好处（可追踪、数据感知）。

## 八、被 Prefect 收购后定位

2026-07-13 Prefect 收购 Dagster Labs，Dagster 的定位变化：

- **收购方**：Prefect（动态 Python-first 编排器）。
- **标的**：Dagster Labs（产品 + Dagster 代码库 + 客户关系 + 团队）。
- **Dagster 的新定位**：预计 2026-08 起以 Prefect 名义运营，Dagster 的资产能力（Software-defined Asset + IO Manager + 强类型）融入 Prefect 平台，成为「Prefect 的资产治理模块」。
- **对用户**：短期 Dagster 仍可独立使用（开源代码不消失）；长期需关注 Prefect 融合产品路线图（可能统一平台，Prefect 的动态 + Dagster 的资产互补）。
- **行业意义**：「反 Airflow 阵营」整合为一家，资源集中加速追赶 Airflow（Airflow 3.0 的 Data Assets 正是防御性应对）。

## 九、与 Prefect、Airflow 的对比与选型

| 维度 | Dagster | Prefect | Airflow |
| --- | --- | --- | --- |
| 核心哲学 | Asset-centric（资产优先） | 动态 Python-first | 静态 DAG + 调度优先 |
| 一等公民 | Asset（数据资产） | Flow（函数） | Task（任务） |
| 数据感知 | **一等公民** | 一般 | 3.0 才原生 |
| 类型系统 | **强** | 弱 | 无 |
| 适合场景 | 数据治理/ELT | ML/动态流程 | 传统批 ETL/大企业 |

**选型建议**：数据资产为核心 / 强类型 / ELT 治理 → **Dagster**（融入 Prefect 后两者合一）；Python 重度 / ML 动态流程 → **Prefect**；传统批 ETL / 大企业合规 → **Airflow**。

## 下一步

理解了 Dagster 的总览后，下一步深入两个核心机制——[Asset 优先：Software-defined Asset 与 IO Manager 详解](./guide-line/asset-centric)（@asset 语义、物化、IO Manager 解耦）与[类型系统、生态与被收购后定位](./guide-line/ecosystem-and-prefect)（DagsterType、Resource、被收购重定位）。
