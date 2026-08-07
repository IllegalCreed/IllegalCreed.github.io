---
layout: doc
outline: [2, 3]
---

# 类型系统、生态与被 Prefect 收购后定位

> 基于 Dagster 1.x · 核于 2026-08

## 速查

- **类型系统（强类型）**：DagsterType/Pydantic 风格的强类型，asset/op 的输入输出可声明类型，**运行时校验**数据契约——类型不匹配 Dagster 立即报错，提前发现 schema 漂移。
- **DagsterType**：自定义类型，`type_check_fn` 校验数据（如「是 DataFrame 且有 user_id 列」）。校验失败 Dagster 报错，不让脏数据流向下游。
- **Pydantic 集成**：可用 Pydantic Model 作为 asset 的输入输出类型，自动校验 schema（字段名/类型），声明式数据契约。
- **Resource**：外部系统连接的封装（数据库连接、API client、云客户端），通过类型系统**注入** asset/op。便于测试（mock resource）与配置切换（dev/prod 不同 Resource）。
- **Resource 注入**：asset/op 通过函数参数（带 `Annotated[Type, Resource]` 或 `context.resources.xxx`）接收 Resource，Dagster 自动注入实例。
- **dbt 一等公民集成**：`dagster-dbt` 让 dbt 模型自动成为 Dagster asset，dbt 的血缘与 Dagster 资产图无缝融合——ELT 场景的黄金组合。
- **Dagster 生态**：集成覆盖主流数据系统（Snowflake/BigQuery/Spark/Airbyte/dbt/Pandas/Polars），但数量不及 Airflow（十年积累）。
- **2026-07-13 被 Prefect 收购**：Prefect 收购 Dagster Labs（产品+代码+客户+团队），Dagster 预计 2026-08 起以 Prefect 名义运营。
- **被收购后定位**：Dagster 的资产能力（Software-defined Asset + IO Manager + 强类型）融入 Prefect 平台，未来定位是「Prefect 的资产治理模块」。Prefect 的动态 + Dagster 的资产互补。
- **行业意义**：「反 Airflow 阵营」整合为一家，资源集中加速追赶。Airflow 3.0 的 Data Assets 正是防御性应对 Dagster 的资产优先哲学。

## 一、类型系统：运行时数据契约校验

Dagster 的强类型系统让数据契约可校验，是相对 Airflow/Prefect（弱类型）的核心优势：

```python
from dagster import asset, DagsterType
import pandas as pd

# 自定义类型：校验是 DataFrame 且有特定列
UserFrame = DagsterType(
    name="UserFrame",
    type_check_fn=lambda _, value: (
        isinstance(value, pd.DataFrame) and "user_id" in value.columns
    ),
    description="DataFrame with user_id column",
)

@asset(dagster_type=UserFrame)
def clean_users(raw_users):
    df = clean(raw_users)
    # 若返回的 df 缺 user_id 列，Dagster 运行时立即报错
    return df
```

- **`type_check_fn`**：自定义校验函数，返回 True/False 或抛异常。
- **运行时校验**：asset 输出后，Dagster 用声明的类型校验，不匹配立即报错（不让脏数据流向下游）。
- **价值**：提前发现 schema 漂移——上游改了字段，下游立即知道（而非默默处理脏数据导致错误结果）。

## 二、Pydantic 集成：声明式 schema 校验

Dagster 支持 Pydantic Model 作为类型，声明式校验 schema：

```python
from pydantic import BaseModel
from dagster import asset

class UserSchema(BaseModel):
    user_id: int
    name: str
    active: bool

@asset
def clean_users(raw_users) -> list[UserSchema]:   # 声明输出类型
    return [UserSchema(**u) for u in raw_users]    # 字段缺失/类型错，Pydantic 报错
```

- **Pydantic Model**：声明字段名与类型，自动校验。
- **声明式契约**：asset 的输出 schema 显式写在类型注解里，读代码即读契约。
- **错误早暴露**：schema 不匹配在 asset 边界暴露（而非传到下游报表才出错）。

## 三、Resource：外部系统连接的封装

Resource 封装外部系统连接（数据库、API、云客户端），通过类型系统注入：

```python
from dagster import asset, Definitions, Resource

class DatabaseResource(Resource):
    def __init__(self, conn_str): self.conn_str = conn_str
    def query(self, sql): ...

@asset
def users(db: DatabaseResource):           # 参数 db = Resource（自动注入）
    return db.query("SELECT * FROM users")

defs = Definitions(
    assets=[users],
    resources={"db": DatabaseResource(conn_str="...")},
)
```

- **注入**：asset/op 通过函数参数（`db: DatabaseResource`）接收 Resource，Dagster 自动注入实例。
- **便于测试**：测试时可注入 mock Resource（如 mock 数据库），不依赖真实外部系统。
- **配置切换**：dev/prod 用不同 Resource 实例（不同连接串），代码不变。

## 四、dbt 一等公民集成

`dagster-dbt` 是 Dagster 生态最重要的集成之一，让 dbt 模型自动成为 Dagster asset：

```python
from dagster_dbt import dbt_assets
from dagster import Definitions

@dbt_assets(manifest=...)
def my_dbt_models(): ...                   # dbt 模型自动变 Dagster asset

defs = Definitions(assets=[my_dbt_models])
```

- **dbt 模型 = Dagster asset**：dbt 的转换模型自动映射为 Dagster asset，资产图无缝融合。
- **血缘统一**：dbt 的血缘（模型依赖）+ Dagster 的资产图 = 端到端数据血缘。
- **ELT 黄金组合**：Dagster（编排 + 资产治理）+ dbt（SQL 转换）+ Airbyte/Fivetran（抽取加载）= 现代 ELT 栈的事实标准。

## 五、Dagster 生态

Dagster 的集成覆盖主流数据系统：

| 类别 | 集成 |
| --- | --- |
| 数仓 | Snowflake、BigQuery、Redshift、Databricks |
| 计算 | Spark、Pandas、Polars、Dask |
| ELT | dbt、Airbyte、Fivetran、Singer |
| 云 | AWS、GCP、Azure（S3/GCS/ADLS） |
| 其他 | Slack、PagerDuty、Airflow（迁移用） |

- **特点**：集成深度高（如 dbt 一等公民），但**数量不及 Airflow**（Airflow 有数百个 Operator，十年积累）。
- **Airflow 迁移**：Dagster 提供 `dagster-airflow` 帮助从 Airflow 迁移（把 Airflow DAG 包装成 Dagster asset）。

## 六、2026-07-13 被 Prefect 收购

2026-07-13 Prefect 宣布收购 Dagster Labs，这是 Dagster 历史的重大转折：

### 收购细节

- **收购方**：Prefect（动态 Python-first 编排器）。
- **标的**：Dagster Labs（产品 + Dagster 代码库 + 客户关系 + 团队，含 Nick Schrock 等前 Meta 工程师）。
- **时间线**：2026-07-13 宣布，预计 2026-08 起 Dagster 以 Prefect 名义运营（交易关闭后）。
- **动机**：Prefect（动态）+ Dagster（资产）能力互补，合并后覆盖更全场景，对 Airflow 形成更强竞争。

### Dagster 的重定位

被收购后，Dagster 的定位变化：

- **从独立产品到融合模块**：Dagster 的资产能力（Software-defined Asset + IO Manager + 强类型）将融入 Prefect 平台。
- **新定位**：成为「Prefect 的资产治理模块」——Prefect 的动态流程编排 + Dagster 的资产治理互补。
- **短期独立可用**：Dagster 开源代码不消失，短期仍可独立使用（已部署的用户不受影响）。
- **长期融合**：关注 Prefect 的融合产品路线图（可能统一为一个平台，保留两者优势）。

### 对用户的影响

- **现有 Dagster 用户**：短期无需迁移（代码继续跑），长期关注融合路线图（可能需要适配新平台）。
- **新用户**：若选资产优先 + 动态流程，可关注 Prefect+Dagster 融合产品（一站式）。
- **行业**：「反 Airflow 阵营」整合，资源集中加速追赶 Airflow（3.0 的 Data Assets 是 Airflow 的防御性回应）。

## 七、选型与对比

**选型决策**：

- 数据资产为核心 / 强类型 / ELT 治理 → **Dagster**（融入 Prefect 后两者合一）
- Python 重度 / ML 动态流程 → **Prefect**
- 传统批 ETL / 大企业合规 / 已有 Operator 生态 → **Airflow**
- 现代 ELT 栈（编排 + dbt + 加载器）→ **Dagster**（dbt 一等公民集成）

**三大编排器对比**：

| 维度 | Dagster | Prefect | Airflow |
| --- | --- | --- | --- |
| 核心哲学 | Asset-centric | 动态 Python-first | 静态 DAG + 调度优先 |
| 一等公民 | Asset（数据资产） | Flow（函数） | Task（任务） |
| 数据感知 | **一等公民** | 一般 | 3.0 才原生 |
| 类型系统 | **强**（DagsterType/Pydantic） | 弱 | 无 |
| dbt 集成 | **一等公民** | 一般 | 一般 |
| 适合场景 | 数据治理/ELT | ML/动态流程 | 传统批 ETL/大企业 |

## 下一步

理解了 Dagster 的类型系统与被收购定位后，对比阅读 [Prefect](../../prefect/) 叶（了解收购方的动态哲学）与 [Airflow](../../airflow/) 叶（了解防御方的 Data Assets 回应），最后看 [参考](../reference) 的 API 速查与易错点。
