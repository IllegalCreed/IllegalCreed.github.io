---
layout: doc
outline: [2, 3]
---

# flow、task 与动态 DAG：Prefect 的核心抽象

> 基于 Prefect 3.x · 核于 2026-08

## 速查

- **`@flow`**：标记一个**流水线**（顶层编排函数）。flow 可嵌套（flow 调 flow 叫 **subflow**），形成层次化编排。flow 函数内的 `@task` 调用自动建立依赖与追踪。
- **`@task`**：标记一个**任务单元**（可被 flow 调用、可重试、可缓存）。可配 `retries`（重试）、`retry_delay_seconds`（重试间隔）、`cache_key_fn`（缓存）、`tags`（标签）。
- **依赖隐式表达**：`transform(extract(...))` 这种函数调用自动建立「transform 依赖 extract」——无需 Airflow 的 `>>` 或 `set_downstream`。
- **状态自动追踪**：每个 task 的输入/输出/状态（Pending/Running/Completed/Failed/Retrying）/耗时/日志**自动记录**到 Prefect Server/Cloud，UI 可见——无需手动 XCom push/pull。
- **动态 DAG（核心优势）**：flow 是普通 Python 函数，**运行时按实际数据动态生成拓扑**——循环（`for`）、条件（`if`）、`map`、按结果动态分支都是原生语法。
- **subflow**：flow 内调用另一个 `@flow` 函数，形成子流水线。subflow 的 task 状态会汇总到父 flow，便于层次化管理。
- **结果持久化**：`@task` 可配 `result_storage`（存 S3/本地）持久化输出，重启后可复用，无需重算。
- **缓存**：`cache_key_fn` 让 task 按输入/参数缓存结果，相同输入直接返回缓存，避免重复计算（如昂贵的模型训练）。
- **与 Airflow 静态 DAG 的本质差异**：Airflow DAG 在 Scheduler 解析 `.py` 时拓扑定死，运行时改不动（动态要 Dynamic Task Mapping 补丁）；Prefect flow 是普通函数，拓扑在运行时按实际数据动态生成。
- **`serve` vs `deploy`**：`flow.serve()` 快速本地部署（开发用）；`prefect deploy` 注册到 Server/Cloud 配生产调度（生产用）。

## 一、`@flow`：流水线的入口

`@flow` 把一个 Python 函数标记为流水线。它是 Prefect 的顶层抽象：

```python
from prefect import flow, task

@flow(name="daily_etl", log_prints=True)
def daily_etl(date: str):
    raw = fetch(date)
    clean = transform(raw)
    load(clean)

@flow(name="monthly_etl")          # flow 可独立
def monthly_etl(month: str):
    for d in days_in(month):
        daily_etl(d)               # 调用另一个 flow → subflow
```

- **`name`**：flow 在 UI 显示的名字（不传则用函数名）。
- **`log_prints=True`**：自动捕获 `print` 输出到 Prefect 日志，便于调试。
- **`retries`/`retry_delay_seconds`**：flow 级重试（整个 flow 失败重跑）。
- **subflow**：flow 内调用另一个 `@flow` 函数，subflow 的 task 状态汇总到父 flow，支持层次化编排（月度 ETL 调用每日 ETL）。

## 二、`@task`：任务单元与状态追踪

`@task` 标记一个任务单元，自动获得重试、缓存、状态追踪：

```python
from prefect import task

@task(retries=3, retry_delay_seconds=60, tags=["etl", "prod"])
def fetch(url: str) -> dict:
    return requests.get(url).json()

@task(cache_key_fn=lambda ctx, params: f"clean-{params['version']}")
def clean(raw, version: str):
    return [x for x in raw if x]
```

- **`retries=3`**：失败自动重试 3 次（覆盖临时故障）。
- **`retry_delay_seconds=60`**：重试间隔 60 秒。
- **`cache_key_fn`**：按 key 缓存结果，相同 key 直接返回缓存（避免重复计算昂贵任务）。
- **`tags`**：标签，便于 UI 筛选与权限控制。
- **状态自动追踪**：每个 task run 的输入/输出/状态/耗时/日志自动记录，无需手动 push/pull。

### task 的状态机

```
Pending → Running → ┬→ Completed
                    ├→ Failed → Retrying → ...（达 retries 上限才 Failed）
                    └→ Cancelled
```

- **Completed**：成功，输出已记录。
- **Failed**：失败，若未达 retries 会 Retrying。
- **Retrying**：等待 retry_delay 后重新执行。

## 三、依赖隐式表达：函数调用即拓扑

Prefect 通过函数调用隐式表达依赖，比 Airflow 的 `>>` 或 `set_downstream` 自然：

```python
@task
def extract(src): ...
@task
def transform(raw): ...
@task
def load(clean): ...

@flow
def pipeline():
    raw = extract("data.csv")       # extract 先跑
    clean = transform(raw)          # transform 依赖 extract（接收 raw）
    load(clean)                     # load 依赖 transform
```

- **数据流即依赖**：`transform(raw)` 接收 `extract` 的输出，自动建立「extract → transform」依赖。
- **无需手动编排**：不用写 `extract >> transform >> load`，函数调用顺序就是拓扑。
- **并行**：多个无依赖的 task 调用会被 Prefect 自动并行调度（async flow 更明显）。

## 四、动态 DAG：运行时按数据生成拓扑

这是 Prefect 相对 Airflow 的最大优势。Airflow DAG 在「Scheduler 解析 `.py` 时」拓扑定死，运行时改不动。Prefect flow 是普通函数，拓扑在运行时按实际数据动态生成：

```python
@flow
def dynamic_ml():
    # 运行时才知道有多少分区（如查数据库）
    partitions = get_partitions()        # [1, 2, 3, ...] 动态

    # 循环：每个分区一个 task 链
    models = []
    for p in partitions:
        raw = extract(p)
        train = train_model(raw, p)
        models.append(train)

    # 条件分支：运行时决定
    if evaluate(models) > 0.9:
        deploy(best(models))
    else:
        alert("accuracy too low")

    # map：对列表批量并发
    results = validate.map(models)       # 每个 model 一个 validate task
```

- **循环（`for`）**：按动态数据重复 task 链。
- **条件（`if`）**：运行时决定执行哪条分支。
- **`map`**：对列表批量并发（类似 Airflow Dynamic Task Mapping，但语法更自然）。
- **典型场景**：ML 超参搜索（循环多组参数训练）、按查询结果决定处理多少数据、A/B 测试动态分流。

### 与 Airflow Dynamic Task Mapping 对比

| 维度 | Prefect（原生 Python） | Airflow（Dynamic Task Mapping） |
| --- | --- | --- |
| 写法 | 普通 `for`/`if`/`map` | `task.expand(x=list)` 专门 API |
| 时机 | 完全运行时动态 | 解析时定框架，运行时展开 |
| 复杂逻辑 | 任意 Python | 受限于 Mapping API |
| 学习成本 | 零（就是 Python） | 需学专门 API |

## 五、状态追踪与结果持久化

Prefect 自动追踪每个 task 的状态，并可选持久化结果：

- **状态追踪**：task 的输入/输出/状态/日志自动记录到 Server/Cloud，UI 可见（比 Airflow 的手动 XCom 友好）。
- **`result_storage`**：task 输出可持久化到 S3/本地/自定义存储，重启后可复用：

```python
from prefect.filesystems import S3

@task(result_storage=S3.load("my-bucket"), persist_result=True)
def expensive_train(X, y):
    return model.fit(X, y)        # 结果自动存 S3，下次相同输入直接读
```

- **`cache_key_fn`**：按 key 缓存，相同 key 返回缓存（避免重复计算）。
- **与 Airflow XCom 的区别**：Airflow 要手动 `XCom_push/pull` 且有 2MB 限制；Prefect 的结果持久化更自动化、无小数据限制（大结果直接落存储）。

## 六、`serve` 与 `deploy`：两种部署入口

| 方式 | 用途 | 命令 |
| --- | --- | --- |
| `flow.serve()` | **开发/本地**快速部署，起一个长驻进程监听 | `python flow.py`（内含 serve） |
| `prefect deploy` | **生产**部署，注册到 Server/Cloud 配调度 | `prefect deploy`（用 `prefect.yaml`） |

- **`serve`**：一行 `my_flow.serve(name="my-deployment")` 就起一个本地 worker 监听，适合开发调试。
- **`deploy`**：写 `prefect.yaml` 定义部署（flow 入口、调度、Work Pool），`prefect deploy` 注册到 Server/Cloud，支持 HA 与弹性。

## 下一步

掌握 flow/task/动态 DAG 后，下一站是[部署、Work Pool 与收购 Dagster](./deployment-and-dagster)——理解 Prefect 的部署模型（deploy/Work Pool/Worker）、Server vs Cloud 的取舍，以及 2026-07 收购 Dagster 的来龙去脉与对编排器格局的影响。
