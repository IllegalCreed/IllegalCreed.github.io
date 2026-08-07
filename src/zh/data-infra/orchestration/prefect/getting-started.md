---
layout: doc
outline: [2, 3]
---

# 入门：Prefect 定义、Python-first 与动态 DAG

> 基于 Prefect 3.x · 核于 2026-08

## 速查

- **定义**：Prefect 是 2018 年 Jeremiah Lowin（前 Airflow 核心贡献者）创立的**新一代数据编排平台**，核心理念「**Python-first，把 DAG 当普通函数**」。用 `@flow`/`@task` 装饰器把 Python 代码变可编排流水线，**运行时动态**。
- **Python-first**：Flow/Task 是**普通 Python 函数**——可单测、可调试、可在 Jupyter 跑。开发者无需学新 DSL，写 Python 即写流水线。
- **两大装饰器**：**`@flow`** 标记一个流水线（顶层编排函数），**`@task`** 标记一个任务单元（可被 flow 调用）。依赖通过**函数调用隐式表达**，结果自动追踪。
- **动态 DAG（核心优势）**：Flow 是普通函数，**运行时按实际数据动态生成拓扑**——循环、条件、`map`、按结果动态分支都是原生 Python 语法，无需 Airflow 的「解析时定死 + Dynamic Task Mapping 补丁」。
- **状态自动追踪**：`@task` 返回值自动被 Prefect 记录（状态/输入/输出/日志/重试），无需手动 XCom push/pull（Airflow 那套）。
- **部署模型**：`prefect deploy` 把 flow 注册到 Prefect Server/Cloud；**Work Pool** 定义执行环境（process/Docker/K8s）；**Worker** 轮询 Work Pool 拉取 flow run 执行——支持弹性扩缩。
- **Prefect Server vs Cloud**：**Server**（开源、自托管）vs **Cloud**（SaaS、免运维、有自动化/Auto-scaling）。Server 适合数据合规要求高的企业，Cloud 适合快速上手。
- **2026-07-13 收购 Dagster**：Prefect 收购 Dagster Labs（产品+代码库+客户+团队），两家融合。Dagster 预计 2026-08 起以 Prefect 名义运营——Prefect 的动态 + Dagster 的资产能力互补，对 Airflow 形成更强竞争。
- **与 Airflow 对比**：Airflow「静态 DAG + 调度优先 + 生态厚」，Prefect「动态 Python-first + 开发者友好 + 部署灵活」。ML/动态流程选 Prefect，传统批 ETL/大企业合规选 Airflow。
- **进阶顺序**：[flow/task/动态 DAG 详解](./guide-line/flow-and-task) → [部署/收购 Dagster](./guide-line/deployment-and-dagster) → [参考](./reference)。

## 一、Prefect 是什么：把 DAG 当普通函数

Airflow 把 DAG 当成「需要专门解析的拓扑结构」，写 DAG 像写配置文件（Operator + set_downstream），且拓扑在解析时定死——这让动态流程（按查询结果决定跑几个 task、ML 实验的循环调参）变得笨拙。Prefect 的创始人 Jeremiah Lowin（曾是 Airflow 核心贡献者）正是受够了这些痛点，创立 Prefect 提出「**Python-first**」：

```python
from prefect import flow, task

@task
def fetch(url):
    return requests.get(url).json()

@task
def clean(raw):
    return [x.strip() for x in raw if x]

@flow
def daily_pipeline(urls):
    results = []
    for url in urls:                  # 循环：运行时动态
        raw = fetch(url)              # 依赖：函数调用隐式表达
        results.append(clean(raw))    # clean 依赖 fetch，自动追踪
    return results

daily_pipeline(["a.com", "b.com"])    # 直接像普通函数调用
```

- **Flow 就是普通函数**：`daily_pipeline` 是 Python 函数，能 `if/else`、能 `for`、能 `try/except`——拓扑在运行时按实际数据动态生成。
- **可本地直接跑**：`python pipeline.py` 直接执行，无需起 Airflow。开发/调试体验远胜 Airflow。
- **编排与本地一致**：本地这么跑，部署后也这么跑（Prefect Server/Cloud 负责调度），代码不变。

## 二、Python-first：开发者体验的核心

Prefect 的设计哲学是「**让数据工程师用最熟悉的工具（Python）写流水线，平台在背后加编排能力**」：

| 维度 | Airflow | Prefect |
| --- | --- | --- |
| DAG 定义 | 专门 DSL（Operator + DAG 上下文） | **普通 Python 函数** |
| 拓扑时机 | 解析时定死（静态） | **运行时动态** |
| 本地调试 | 要起 Airflow | `python file.py` 直接跑 |
| 测试 | 要 mock Airflow 运行时 | **像普通函数单测** |
| 依赖表达 | `task1 >> task2` 或 set_downstream | **函数调用隐式** |

- **对 ML/实验性流程友好**：超参调优的循环、按结果决定下一步的分支，在 Prefect 里就是普通 Python，在 Airflow 里是 Dynamic Task Mapping 的补丁。
- **缺点**：生态较新，Operator/集成数量不及 Airflow（十年积累的数百个）。

## 三、flow 与 task：两大装饰器

Prefect 用两个装饰器把 Python 代码变流水线：

```python
from prefect import flow, task

@task(retries=3, retry_delay_seconds=60)   # task：可重试、可缓存
def extract(source):
    return pd.read_csv(source)

@task
def transform(df):
    return df.dropna()

@flow(name="etl", log_prints=True)          # flow：顶层编排
def etl_flow(source):
    raw = extract(source)                   # task 调用，依赖自动建
    clean = transform(raw)
    return clean

etl_flow("data.csv")
```

- **`@flow`**：标记一个流水线（顶层函数），可嵌套（flow 调 flow，叫 subflow）。
- **`@task`**：标记一个任务单元，可配 `retries`/`retry_delay_seconds`/`cache_key_fn`（缓存）。
- **依赖隐式**：`transform(extract(...))` 自动建立「transform 依赖 extract」。
- **状态自动追踪**：每个 task 的输入/输出/状态/耗时自动记录到 Prefect，UI 可见。

## 四、动态 DAG：运行时按数据生成拓扑

这是 Prefect 相对 Airflow 的最大优势。Airflow 的 DAG 在「Scheduler 解析 DAG 文件时」拓扑就定死，运行时改不动——要动态生成分支得用 Dynamic Task Mapping（Airflow 3.0 才成熟）。Prefect 的 flow 是普通函数，运行时按实际数据动态生成：

```python
@flow
def dynamic_pipeline():
    config = fetch_config()                # 运行时才知道有多少分区
    partitions = config["partitions"]      # 如 [1, 2, 3] 或动态查询结果
    for p in partitions:                   # 循环：每个分区一个 task 链
        raw = extract(p)
        clean = transform(raw)
        load(clean, p)
    if some_condition:                     # 条件分支：运行时决定
        notify()
```

- **map/循环/条件都自然**：Python 原生语法，无需专门 API。
- **典型场景**：ML 超参搜索（循环多组参数训练）、按查询结果决定处理多少数据、A/B 测试的动态分流。

## 五、部署模型：Work Pool 与 Worker

Prefect 的部署模型把「**flow 定义**」和「**执行环境**」解耦：

```
   开发者写 flow.py
        │ prefect deploy（注册到 Server/Cloud）
        ▼
   ┌──────────────┐
   │ Prefect      │ 管理 flow 定义、调度、状态
   │ Server/Cloud │
   └──────┬───────┘
          │ 按计划触发 flow run
          ▼
   ┌──────────────┐ 定义执行环境（process/Docker/K8s）
   │  Work Pool   │
   └──────┬───────┘
          │ Worker 轮询拉取
          ▼
   ┌──────────────┐ 实际执行 flow run
   │   Worker     │（process/Docker 容器/K8s Pod）
   └──────────────┘
```

- **`prefect deploy`**：把 flow 注册到 Server/Cloud，配置触发计划（cron/interval/event）。
- **Work Pool**：定义执行环境类型（process-work-pool / docker-work-pool / kubernetes-work-pool），可弹性。
- **Worker**：轮询 Work Pool 拉取 flow run 执行，按 Work Pool 类型起对应环境。
- **弹性**：K8s Work Pool 可按负载自动扩缩 Pod，云原生友好。

## 六、2026-07 收购 Dagster：反 Airflow 阵营整合

2026-07-13 Prefect 宣布收购 Dagster Labs，包括 Dagster 产品、代码库、客户关系和团队：

- **为什么收购**：Prefect（动态 Python-first）与 Dagster（Asset-centric 资产优先 + 强类型 + IO Manager）能力互补——Prefect 擅长动态流程，Dagster 擅长资产治理。合并后可同时拥有「动态 + 资产」能力，对 Airflow 形成更强竞争。
- **时间线**：预计 Dagster 2026-08 起以 Prefect 名义运营。
- **对用户**：短期 Dagster 仍可独立使用，长期需关注融合后的产品路线图（可能统一为一个平台）。
- **行业意义**：「反 Airflow 阵营」从分散（Prefect + Dagster + 其他）整合为一家，资源集中，加速对 Airflow 的追赶。

## 七、与 Airflow 的对比与选型

| 维度 | Prefect | Airflow |
| --- | --- | --- |
| 核心哲学 | 动态 Python-first | 静态 DAG + 调度优先 |
| DAG 时机 | 运行时动态 | 解析时定死 |
| 本地开发 | `python f.py` 直接跑 | 要起 Airflow |
| 动态流程 | 原生 Python | Dynamic Task Mapping（补丁） |
| 生态成熟度 | 较新 | 最厚（十年） |
| 适合场景 | ML/动态流程、Python 团队 | 传统批 ETL、大企业合规 |

**选型建议**：Python 重度团队 / ML 动态流程 / 想要「DAG 即函数」→ **Prefect**；已有大量 Airflow Operator / 大企业要 SLA 与审计 → **Airflow**；数据资产为核心 / 强类型 / ELT → **Dagster**（融入 Prefect 后两者合一）。

## 下一步

理解了 Prefect 的总览后，下一步深入两个核心机制——[flow、task 与动态 DAG 详解](./guide-line/flow-and-task)（装饰器语义、状态追踪、动态拓扑）与[部署、Work Pool 与收购 Dagster](./guide-line/deployment-and-dagster)（部署流程、Worker 模型、收购来龙去脉）。
