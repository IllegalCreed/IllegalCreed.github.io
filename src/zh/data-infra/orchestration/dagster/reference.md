---
layout: doc
outline: [2, 3]
---

# 参考：Dagster API、IO Manager 与易错点速查

> 基于 Dagster 1.x · 核于 2026-08

## 速查

- **核心抽象**：`@asset`（数据资产，现代首选）+ `@op`（无副作用任务，传统）+ IO Manager（管存储）+ Resource（管外部连接）+ Type（管数据契约）。
- **依赖即参数**：asset 函数的参数名 = 上游 asset 名（`def clean(raw):` 依赖 `raw`）。
- **物化（Materialization）**：asset 被执行 = 产出新数据 = 物化一次，调度围绕「资产是否最新」。
- **IO Manager**：自动管 asset/op 的存储（存哪/序列化），业务代码与存储解耦。内置 `fs_io_manager`/`s3_pickle_io_manager`。
- **强类型**：DagsterType/Pydantic 运行时校验数据契约，提前发现 schema 漂移。
- **dbt 一等公民**：`dagster-dbt` 让 dbt 模型自动变 Dagster asset，ELT 黄金组合。
- **2026-07 被 Prefect 收购**：资产能力融入 Prefect，Dagster 定位为「Prefect 的资产治理模块」。
- **三大编排器**：Dagster（Asset-centric + 强类型）vs Prefect（动态 Python-first）vs Airflow（静态 DAG + 调度优先）。
- **分区**：asset 可按日期/类别分区，支持增量处理（只跑未物化分区）与回填。
- **op vs asset**：op 是传统任务（输入→输出），asset 是现代资产（可追踪可物化），新代码首选 asset。

## 一、`@asset` / `@op` API 速查

### `@asset` 参数

| 参数 | 含义 | 示例 |
| --- | --- | --- |
| `group_name` | 分组名（UI 组织） | `group_name="etl"` |
| `io_manager_key` | 指定 IO Manager | `io_manager_key="s3_io"` |
| `dagster_type` | 输出类型（校验） | `dagster_type=UserFrame` |
| `partitions_def` | 分区定义 | `DailyPartitionsDefinition(...)` |
| `config` | 配置 schema | `config={"date": str}` |
| `deps` | 显式依赖 | `deps=[upstream_asset]` |

### `@op` 参数（传统写法）

| 参数 | 含义 |
| --- | --- |
| `ins`/`out` | 输入输出声明（含类型） |
| `required_resource_keys` | 依赖的 Resource key |
| `config` | 配置 schema |

### asset 依赖表达

```python
@asset
def raw(): ...                         # 源 asset

@asset
def clean(raw): ...                    # 参数 raw = 上游 asset

@asset
def report(clean, users): ...          # 多参数 = 多依赖
```

## 二、IO Manager 类型

| IO Manager | 存储 | 适用 |
| --- | --- | --- |
| `fs_io_manager` | 本地文件系统（pickle） | 开发/测试 |
| `s3_pickle_io_manager` | AWS S3（pickle） | 生产/AWS |
| `adls2_io_manager` | Azure Data Lake Gen2 | Azure 生产 |
| `gcs_io_manager` | Google Cloud Storage | GCP 生产 |
| `dbt` (dagster-dbt) | dbt 模型 | ELT 转换 |
| 自定义 | 任意（实现 handle_output/load_input） | 特殊需求 |

```python
from dagster import fs_io_manager, Definitions

defs = Definitions(
    assets=[...],
    resources={"io_manager": fs_io_manager},     # 全局默认 IO Manager
)
```

## 三、类型系统速查

```python
from dagster import asset, DagsterType
from pydantic import BaseModel

# 方式 1：DagsterType 自定义
UserFrame = DagsterType(
    name="UserFrame",
    type_check_fn=lambda _, v: isinstance(v, pd.DataFrame) and "user_id" in v.columns,
)

# 方式 2：Pydantic Model
class UserSchema(BaseModel):
    user_id: int
    name: str

@asset(dagster_type=UserFrame)         # 用 DagsterType
def clean(raw): ...

@asset
def transform(raw) -> list[UserSchema]: ...   # 用 Pydantic（类型注解）
```

## 四、Resource 速查

```python
from dagster import asset, Definitions, Resource

class DBResource(Resource):
    def __init__(self, conn_str): self.conn = conn_str
    def query(self, sql): ...

@asset
def users(db: DBResource):             # 参数 db 自动注入
    return db.query("SELECT * FROM users")

defs = Definitions(
    assets=[users],
    resources={"db": DBResource(conn_str="...")},
)
```

## 五、Dagster vs Prefect vs Airflow

| 维度 | Dagster | Prefect | Airflow |
| --- | --- | --- | --- |
| 核心哲学 | Asset-centric（资产优先） | 动态 Python-first | 静态 DAG + 调度优先 |
| 一等公民 | Asset（数据资产） | Flow（函数） | Task（任务） |
| 数据感知 | **一等公民** | 一般 | 3.0 才原生 |
| 类型系统 | **强**（DagsterType/Pydantic） | 弱（Python 动态） | 无 |
| IO 管理 | **IO Manager 解耦** | result_storage | XCom（< 2MB） |
| dbt 集成 | **一等公民** | 一般 | 一般 |
| 本地开发 | 直接跑 | `python f.py` 直接跑 | 要起 Airflow |
| 生态 | 较新（dbt 深度集成） | 较新 | 最厚（十年） |
| 典型场景 | 数据治理/ELT | ML/动态流程 | 传统批 ETL/大企业 |

## 六、易错点清单

- **「Dagster 的 asset 和 Airflow 的 Task 是一回事」**：错。asset 是「产出数据资产的任务」（有名字、可追踪、可物化），Task 是「无副作用任务」。asset 是资产优先的核心抽象。
- **「asset 的依赖要像 Airflow 那样用 `>>` 声明」**：错。Dagster 用「函数参数名 = 上游 asset 名」自动建依赖，无需 `>>`。
- **「IO Manager 是数据库」**：错。IO Manager 是「管 asset/op 数据存哪/序列化」的机制（存本地/S3/dbt），不是数据库本身。
- **「Dagster 没有类型校验」**：错。DagsterType/Pydantic 提供运行时强类型校验，是相对 Airflow/Prefect 的核心优势。
- **「被 Prefect 收购后 Dagster 立即下线」**：错。短期 Dagster 仍可独立使用（开源代码不消失），预计 2026-08 起以 Prefect 名义运营，长期融入 Prefect。
- **「Dagster 适合毫秒级流处理」**：错。Dagster 强在资产治理/ELT（批 + 资产），流处理用 Flink。
- **「asset 和 op 完全一样」**：错。asset 是现代首选（资产优先、可追踪），op 是传统写法（输入→输出，无资产语义）。
- **「分区 asset 必须全量重跑」**：错。分区 asset 支持增量处理（只跑未物化的分区），可回填历史。
- **「Dagster 的 dbt 集成只是调用 dbt 命令」**：低估。`dagster-dbt` 让 dbt 模型自动变 Dagster asset，血缘与资产图无缝融合，是一等公民集成。
- **「Resource 就是数据库连接串」**：低估。Resource 是外部系统连接的封装（含连接逻辑、可 mock、可配置切换），不只是连接串。

## 七、进阶方向（链接其他叶）

- [Prefect](../prefect/) —— 动态 Python-first 编排器（2026-07 收购 Dagster）
- [Apache Airflow](../airflow/) —— 静态 DAG + 调度优先编排器（防御性对标 Dagster）
- 本站幻灯片：<a href="/SlideStack/dagster-slide/" target="_blank">Dagster</a>

## 权威链接

- [Dagster 官方文档](https://docs.dagster.io/)
- [Dagster Software-defined Assets](https://docs.dagster.io/concepts/assets/software-defined-assets)
- [Dagster I/O Managers](https://docs.dagster.io/guides/build/io-managers)
- [Dagster is joining Prefect（2026-07-13）](https://dagster.io/prefect)
- [Prefect acquires Dagster Labs](https://www.prefect.io/prefect-acquires-dagster)
- [Dagster GitHub](https://github.com/dagster-io/dagster)
