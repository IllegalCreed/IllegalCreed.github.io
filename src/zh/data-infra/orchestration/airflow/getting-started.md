---
layout: doc
outline: [2, 3]
---

# 入门：Airflow 定义、DAG/Task/Operator 与 Airflow 3.0

> 基于 Apache Airflow 3.x · 核于 2026-08

## 速查

- **定义**：Apache Airflow 是用 **Python 写 DAG** 的数据编排平台——开发者用代码定义「任务拓扑」，平台负责**定时调度、依赖编排、失败重试、状态可视化**。由 Airbnb 2014 开源，2019 进 Apache 孵化，现为数据编排事实标准。
- **三大抽象**：**DAG**（有向无环图，描述「先做什么后做什么」的拓扑）、**Task**（DAG 中的一个执行单元）、**Operator**（Task 的模板/类型，如 `BashOperator`/`PythonOperator`/`KubernetesPodOperator`）。
- **调度执行分离**：**Scheduler** 周期性扫描 DAG 文件、算依赖、把就绪的 Task 推入队列；**Executor** 决定「在哪儿跑」（本机进程 / Celery 集群 / Kubernetes Pod）；**Worker** 实际执行 Task。
- **XCom（Cross-Communication）**：Task 间传递**小数据**（< 2MB，默认存元数据库）的机制；**大数据禁止走 XCom**（会撑爆 DB），必须落外部存储（S3/对象存储）再传引用。
- **Hook 与 Connection**：Hook 是与外部系统（MySQL/S3/Airtable）交互的封装；Connection 是存于元数据库的连接凭证（host/user/password），Hook 据此连接。
- **Airflow 3.0（2025-04 GA）四大变化**：①**TaskSDK**——把任务编写与 Airflow 调度器解耦，任务可独立测试、可跨语言（Python TaskSDK 已 GA，多语言 SDK 规划中）；②**Data Assets**——原生数据感知调度（按「数据就绪」触发 DAG，对齐 Dagster 的核心能力）；③**事件驱动**——DAG 不仅按时间触发，还能响应外部事件；④**全新 UI + DAG 版本化**。
- **三大流派对比**：**Airflow**（静态 DAG + 调度优先，生态最厚）vs **Prefect**（动态 Python-first，把 DAG 当普通函数）vs **Dagster**（资产优先 Asset-centric，以「数据资产」为一等公民）。
- **Jinja 模板**：Task 参数可用 <code v-pre>{{ ds }}</code>/<code v-pre>{{ execution_date }}</code> 等模板变量，按运行时上下文渲染（如按日期分区路径）。
- **重试与 SLA**：Task 可配 `retries=3`（失败自动重试）、`retry_delay`、`sla`（超时告警），是生产稳定性的基础。
- **进阶顺序**：[DAG/Task/Operator/XCom 详解](./guide-line/dag-and-operators) → [调度器/3.0/对比](./guide-line/scheduling-and-v3) → [参考](./reference)。

## 一、Airflow 是什么：Python 写的数据流水线

数据工程师的日常是把数据「从 A 搬到 B、清洗、再搬到 C」——拉取日志、ETL 清洗、写入数仓、生成报表。这套流水线由几十上百个任务组成，彼此有依赖（先拉数才能清洗，先清洗才能建模）。手动脚本无法解决「定时触发、依赖编排、失败重试、状态追踪」这些工程问题——这就是编排平台（Orchestrator）的职责。

Airflow 的核心思想是 **DAG-as-Python-Code**：

```python
from airflow.decorators import dag, task
from datetime import datetime

@dag(start_date=datetime(2026, 1, 1), schedule="@daily", catchup=False)
def daily_etl():
    @task
    def fetch():           # Task 1：拉数据
        return [1, 2, 3]
    @task
    def clean(x):          # Task 2：清洗（XCom 自动传参）
        return x * 10
    clean.expand(x=fetch())  # 拓扑：clean 依赖 fetch

daily_etl()
```

- **拓扑即代码**：任务依赖用 Python 表达（`clean(fetch())`），可 lint、可单测、可 Git 版本管理。
- **调度自动**：`schedule="@daily"` 让 Airflow 每天触发一次，无需写 cron 守护进程。
- **可观测**：UI 上能看到每次执行的拓扑图、每个 Task 的状态（running/success/failed）、实时日志。

## 二、DAG、Task、Operator：三层抽象

理解 Airflow 必须分清这三个层次：

| 抽象 | 是什么 | 类比 |
| --- | --- | --- |
| **DAG** | 有向无环图，描述**任务拓扑**（谁先谁后、谁依赖谁），不含执行逻辑 | 蓝图/施工图 |
| **Task** | DAG 中的一个**节点**，是 DAG 实例化后的一个执行单元 | 施工图上一道工序 |
| **Operator** | Task 的**模板/类型**，定义「这道工序具体做什么」（跑 shell、跑 Python、调 HTTP） | 工具/机床 |

- **DAG 必须无环**：拓扑里不能有循环（否则永远跑不完），这是 Airflow 在解析时强制校验的。
- **Operator 三大流派**：①**Action Operator**（执行动作，`BashOperator`/`PythonOperator`）；②**Transfer Operator**（搬数据，`S3ToRedshiftOperator`）；③**Sensor**（等待，`S3KeySensor` 等文件出现、`ExternalTaskSensor` 等上游 DAG 跑完）。
- **TaskFlow API（推荐）**：用 `@task` 装饰器把普通函数变 Task，依赖通过函数调用隐式表达，XCom 自动传递——比传统 `PythonOperator` + `set_upstream` 简洁得多。

## 三、调度执行分离：Scheduler 与 Executor

Airflow 把「**决定跑什么**」和「**实际在哪儿跑**」拆开，这是它支撑大规模的关键：

```
   DAG 文件（Python）
          │
          ▼
   ┌──────────────┐   周期扫描、算依赖
   │  Scheduler   │ ──把就绪的 Task 推入队列──┐
   └──────────────┘                            ▼
                                       ┌──────────────┐
                                       │   Executor   │ 决定「在哪儿跑」
                                       └──────┬───────┘
                                  ┌───────────┼───────────┐
                                  ▼           ▼           ▼
                              本机进程    Celery 节点   K8s Pod
                            (Sequential/  (Celery      (Kubernetes-
                             Local)       Executor)    Executor)
```

- **Scheduler**：单点（可水平扩展），每隔几秒扫一遍 DAG 文件，判断「哪些 Task 的依赖已满足、该调度了」。
- **Executor**：决定执行方式。**SequentialExecutor**（默认，单进程串行，仅测试用）、**LocalExecutor**（多进程本机并行）、**CeleryExecutor**（分布式，多 worker 节点，主流生产选择）、**KubernetesExecutor**（每个 Task 起一个独立 Pod，隔离最强）。
- **元数据库**：存 DAG 元信息、Task 实例状态、XCom、历史运行记录。生产用 PostgreSQL/MySQL，测试可用 SQLite。

## 四、XCom：Task 间数据传递

XCom（Cross-Communication）让一个 Task 的输出能被下游 Task 读取——这是「数据在任务间流动」的机制：

- **小数据**：默认存在元数据库，上限约 2MB（可配 `xcom_backend` 自定义存储到 S3）。TaskFlow API 的 `@task` 函数返回值**自动走 XCom**，调用方自动读取，开发者无感。
- **大数据禁止走 XCom**：传 DataFrame/大文件会撑爆元数据库。**正确做法**：Task A 把数据写到 S3/HDFS，XCom 只传「S3 路径」这种引用，Task B 再按路径读。

```python
@task
def write_to_s3():
    df = pd.read_csv("huge.csv")
    path = "s3://bucket/2026-08-07/data.parquet"
    df.to_parquet(path)          # 大数据落 S3
    return path                  # XCom 只传路径（小）

@task
def read_from_s3(path):          # 自动接收 XCom
    return pd.read_parquet(path) # 按 path 读大数据
```

## 五、Airflow 3.0：四年来的大版本

2025 年 4 月 Airflow 3.0 GA，是自 2020 年 2.0 以来最大的版本跃迁，主要变化：

1. **TaskSDK**：把「**写任务**」和「**Airflow 调度器**」解耦。任务代码不再强依赖 Airflow 运行时，可独立单测、可在任何 Python 环境跑；未来会有多语言 SDK（非 Python 任务也能享受 Airflow 编排）。
2. **Data Assets（数据感知调度）**：DAG 可声明「消费/产出哪些数据资产」，并按「**上游数据就绪**」触发，而非只按时间——这是对 Dagster「资产优先」哲学的正面回应。Airflow 3.2 进一步加入**资产分区（Asset Partitioning）**，更细粒度。
3. **事件驱动**：除时间调度外，DAG 可由外部事件（消息、webhook）触发，补齐「实时」短板。
4. **DAG 版本化**：每次运行的 DAG 版本可追溯，便于回滚与治理。
5. **全新 UI/UX**：重写前端，更现代。

## 六、与 Prefect、Dagster 的对比

三大现代数据编排器哲学迥异，选型先看「你优先什么」：

| 维度 | Airflow | Prefect | Dagster |
| --- | --- | --- | --- |
| 核心哲学 | 静态 DAG + 调度优先 | 动态 Python-first | 资产优先（Asset-centric） |
| DAG 拓扑 | 解析时定死（静态） | 运行时动态（普通 Python） | Asset 依赖图（也可动态） |
| 数据感知 | 3.0 才原生支持 | 一般 | **一等公民**（Asset 为中心） |
| 生态成熟度 | 最厚（十年、数百 Operator） | 较新（Python 生态友好） | 新但增长快 |
| 适合场景 | 传统 ETL/批处理、大企业 | ML/动态流程、Python 团队 | 数据资产治理、ELT |

> 注：2026-07-13 Prefect 宣布收购 Dagster，未来两家产品将融合（详见 [Prefect 叶](../prefect/) 与 [Dagster 叶](../dagster/)）。

## 下一步

理解了 Airflow 的总览后，下一步深入两个核心机制——[DAG、Task、Operator 与 XCom 详解](./guide-line/dag-and-operators)（拓扑规则、Operator 选型、XCom 限制）与[调度器、Airflow 3.0 与竞品对比](./guide-line/scheduling-and-v3)（Scheduler 轮询模型、Executor 全谱、3.0 新特性、Prefect/Dagster 选型）。
