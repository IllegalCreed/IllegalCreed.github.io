---
layout: doc
outline: [2, 3]
---

# DAG、Task、Operator 与 XCom：Airflow 的核心抽象

> 基于 Apache Airflow 3.x · 核于 2026-08

## 速查

- **DAG（Directed Acyclic Graph）**：描述**任务拓扑**的有向无环图——节点是 Task、边是依赖，**必须无环**（解析期强制校验）。DAG 只管「谁先谁后」，不含执行逻辑。
- **Task**：DAG 实例化后的**一个执行单元**，对应 DAG 图上一个节点。每次 DAG 运行会为每个 Task 生成一个 **Task Instance**，状态机：`none → scheduled → queued → running → success/failed/up_for_retry`。
- **Operator**：Task 的**模板/类型**，定义「做什么」。三大流派：①**Action Operator**（执行，`BashOperator`/`PythonOperator`）；②**Transfer Operator**（搬数据，`S3ToRedshiftOperator`）；③**Sensor**（等待，`S3KeySensor`/`ExternalTaskSensor`）。
- **TaskFlow API（推荐）**：`@task` 装饰器把函数变 Task，依赖用函数调用表达，XCom 自动传——比传统 `PythonOperator + set_upstream()` 简洁得多。
- **Hook**：与外部系统（MySQL/S3/Slack）交互的**封装层**，隐藏连接细节。Operator 内部通常调 Hook，避免重复造轮子。
- **Connection**：存于元数据库的**连接凭证**（host/port/user/password/extra），UI 配置，Hook 据此连接外部系统——凭证与代码分离。
- **Variable**：存于元数据库的**全局变量**（key-value），UI 配置，适合放配置项；**敏感信息要用 Secret**（不进日志/UI）。
- **XCom（Cross-Communication）**：Task 间传**小数据**（< 2MB，默认存元数据库）的机制；TaskFlow API 的 `@task` 返回值自动走 XCom。**大数据必须落外部存储只传引用**。
- **Jinja 模板**：Operator 参数可用 `{{ ds }}`（逻辑日期 YYYY-MM-DD）/`{{ ts }}`/`{{ data_interval_start }}` 等模板变量，按运行时上下文渲染——按日期分区路径的标配。
- **依赖表达**：传统用 `task1 >> task2`（BitShift）或 `task1.set_downstream(task2)`；TaskFlow 用 `task2(task1())` 隐式表达。**Sensor 的依赖**：等待条件满足才往下走。

## 一、DAG：拓扑即代码

DAG 是 Airflow 的顶层抽象。一个 DAG 文件定义「**一组任务 + 它们的依赖关系 + 调度配置**」：

```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG(
    dag_id="example_dag",
    start_date=datetime(2026, 1, 1),
    schedule="@daily",         # 每天 1 次
    catchup=False,             # 不补历史（默认 True 会回灌）
    default_args={"retries": 2, "retry_delay": timedelta(minutes=5)},
) as dag:
    t1 = BashOperator(task_id="extract", bash_command="curl ...")
    t2 = BashOperator(task_id="transform", bash_command="python clean.py")
    t3 = BashOperator(task_id="load", bash_command="psql -c '...'")
    t1 >> t2 >> t3             # 依赖：extract → transform → load
```

- **DAG 必须无环**：Airflow 解析 DAG 文件时会拓扑排序，发现环直接报错拒绝加载。
- **`catchup`**：默认 True 会「补历史」——若 `start_date` 是一年前、`schedule=@daily`，第一次启动会回灌 365 次运行，常把集群跑炸。**生产建议 `catchup=False`**。
- **`schedule`**：Cron 表达式（`0 2 * * *`）、预设（`@daily`/`@hourly`）、timedelta（`timedelta(hours=1)`）、或 Airflow 3.0 的 Dataset/Asset 触发。
- **DAG 文件加载**：Scheduler 每隔 `min_file_process_interval`（默认 30s）扫一次 DAG 目录，解析所有 `.py`——所以 DAG 文件**不能写重逻辑**（如连数据库查配置），否则拖慢 Scheduler。

## 二、Task 与 Task Instance

**Task** 是 DAG 里的一个节点（模板），**Task Instance（TI）** 是某次 DAG 运行里 Task 的具体实例。TI 有完整状态机：

```
   none → scheduled → queued → running → ┬→ success
                                         ├→ failed
                                         └→ up_for_retry → ...（达 retries 上限才 failed）
```

- **scheduled**：依赖已满足，Scheduler 把它标记为待执行。
- **queued**：已进入 Executor 队列，等 Worker 拉取。
- **running**：Worker 正在执行。
- **up_for_retry**：失败但未达 `retries` 上限，等 `retry_delay` 后重试。
- **生产稳定性三件套**：`retries`（失败重试次数）、`retry_delay`（重试间隔）、`retry_exponential_backoff=True`（指数退避，避免雪崩）。

## 三、Operator 三大流派

Operator 决定 Task 具体做什么，选对 Operator 是写好 DAG 的关键：

### 1. Action Operator：执行动作

```python
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.providers.docker.operators.docker import DockerOperator

BashOperator(task_id="t", bash_command="echo {{ ds }}")  # 跑 shell
PythonOperator(task_id="t", python_callable=my_func)     # 跑 Python 函数
DockerOperator(task_id="t", image="my-etl:1.0", ...)     # 跑容器
```

- **`BashOperator`**：最通用，跑任意 shell。Jinja 模板让 `{{ ds }}` 自动渲染成逻辑日期。
- **`PythonOperator`**：跑 Python 函数。`@task`（TaskFlow）是它的语法糖，自动处理 XCom。
- **`KubernetesPodOperator`**（生产首选）：每个 Task 起独立 K8s Pod，**隔离最强**（互不影响、资源可控），是云原生部署的标准做法。

### 2. Transfer Operator：搬数据

```python
from airflow.providers.amazon.aws.transfers.s3_to_redshift import S3ToRedshiftOperator
S3ToRedshiftOperator(task_id="t", s3_bucket="...", redshift_table="...")
```

封装「从 A 搬到 B」的常见模式（S3→Redshift、MySQL→S3），省去手写 SQL/SDK。

### 3. Sensor：等待条件满足

```python
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor
from airflow.sensors.external_task import ExternalTaskSensor

S3KeySensor(task_id="wait_file", bucket_key="data/{{ ds }}.csv", poke_interval=60)
ExternalTaskSensor(task_id="wait_upstream", external_dag_id="upstream_dag", ...)
```

- **Sensor 不断轮询**（`poke_interval`），直到条件满足或超时（`timeout`）才往下走。
- **坑**：Sensor 默认占用一个 Worker slot 整个轮询周期，**`mode='reschedule'`**（释放 slot，每次 poke 重新调度）能避免阻塞，长等待 Sensor 必用。

## 四、Hook 与 Connection：与外部系统交互

**Hook** 是与外部系统交互的封装，**Connection** 是凭证仓库：

```python
from airflow.providers.postgres.hooks.postgres import PostgresHook

hook = PostgresHook(postgres_conn_id="my_pg")  # 读 Connection "my_pg"
conn = hook.get_conn()                          # 拿到 psycopg2 连接
df = pd.read_sql("SELECT ...", conn)
```

- **Connection** 在 UI 配置（Admin → Connections），存 host/port/login/password/extra，凭证不进代码不进 Git。
- **Hook 封装** 连接管理、重试、SDK 细节，Operator 内部调 Hook。**自定义 Operator 应优先用 Hook 而非直连**。
- **Variable**：全局 key-value 配置（UI 配），适合放「环境相关但非敏感」的值；**敏感信息用 Secret**（不进日志、UI 脱敏）。

## 五、XCom：Task 间数据传递的边界

XCom 是 Airflow 在 Task 间传数据的唯一原生机制，但**有严格的体积边界**：

```python
# TaskFlow API：返回值自动进 XCom，调用自动读 XCom
@task
def fetch():
    return [1, 2, 3]          # 小数据：进 XCom（存元数据库）

@task
def process(items):
    return [x * 10 for x in items]

process(fetch())              # 拓扑 + XCom 自动建立
```

- **小数据（< 2MB）**：默认存元数据库（`xcom_object` 表），TaskFlow API 自动用，无需手写。
- **大数据（DataFrame/文件）**：**禁止走 XCom**（撑爆元数据库、拖垮 Scheduler）。正确做法：

```python
@task
def write_big():
    df = huge_dataframe()
    path = f"s3://bucket/{context['ds']}/data.parquet"
    df.to_parquet(path)
    return path              # XCom 只传路径（小）

@task
def read_big(path):           # 自动接收 path
    return pd.read_parquet(path)
```

- **自定义 XCom Backend**：3.0 起 `xcom_backend` 可指向自定义类（如存 S3），把 XCom 的「存哪儿」改为对象存储，间接支持「大 XCom」——但仍推荐显式落外部存储只传引用，更可控。

## 六、Jinja 模板：按运行时上下文渲染

Operator 参数（非所有字段）支持 Jinja 模板，按「这次运行的逻辑日期/区间」渲染：

| 变量 | 含义 | 示例值 |
| --- | --- | --- |
| `{{ ds }}` | 逻辑日期 YYYY-MM-DD | `2026-08-07` |
| `{{ ds_nodash }}` | 无分隔日期 | `20260807` |
| `{{ ts }}` | ISO 时间戳 | `2026-08-07T00:00:00+00:00` |
| `{{ data_interval_start }}` | 数据区间起点（2.2+，取代 `execution_date`） | `2026-08-06T00:00:00+00:00` |
| `{{ run_id }}` | 本次运行 ID | `scheduled__2026-08-07` |

```python
BashOperator(
    task_id="partition_load",
    bash_command="aws s3 cp s3://bucket/{{ data_interval_start | ds }}/data.csv .",
)
```

> **Airflow 2.2 起推荐 `data_interval_start/end` 取代 `execution_date`**——后者语义模糊（是区间开始而非运行时刻），新代码避免用。

## 七、依赖表达的三种写法

```python
# 1. BitShift（推荐，简洁）
t1 >> t2 >> t3
[t1, t2] >> t3              # t1、t2 都完成才跑 t3

# 2. 方法调用
t1.set_downstream(t2)
t1 >> t2                     # 等价

# 3. TaskFlow：函数调用隐式表达
@task
def a(): ...
@task
def b(x): ...
b(a())                       # b 依赖 a，XCom 自动传
```

- **链式 vs 并行**：`t1 >> t2 >> t3` 是串行；`[t1, t2] >> t3` 是 t1、t2 并行后 t3。
- **动态分支**：传统 Airflow 难写（要 `BranchPythonOperator`）；3.0 的 **Dynamic Task Mapping**（`expand`）让「按上游结果动态生成 N 个 Task」变得自然。

## 下一步

掌握 DAG/Task/Operator/XCom 后，下一站是[调度器、Airflow 3.0 与竞品对比](./scheduling-and-v3)——理解 Scheduler 如何轮询调度、Executor 如何选型、3.0 的 TaskSDK 与 Data Assets 带来了什么，以及 Prefect/Dagster 与 Airflow 的本质差异。
