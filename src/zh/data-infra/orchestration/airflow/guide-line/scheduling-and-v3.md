---
layout: doc
outline: [2, 3]
---

# 调度器、Airflow 3.0 与竞品对比

> 基于 Apache Airflow 3.x · 核于 2026-08

## 速查

- **Scheduler 轮询模型**：Scheduler 周期性（`min_file_process_interval`，默认 30s）扫描 DAG 目录，解析每个 `.py` 得到 DAG 定义，再判断「哪些 DAG 的哪些 Task Instance 依赖已满足、该调度了」，把就绪的 TI 推给 Executor 队列。
- **Executor 全谱**：①**SequentialExecutor**（默认，单进程串行，仅测试，依赖 SQLite）；②**LocalExecutor**（多进程本机并行，需 PostgreSQL）；③**CeleryExecutor**（分布式，多 worker 节点，**生产主流**，需 Redis/RabbitMQ 作 broker）；④**KubernetesExecutor**（每个 Task 起独立 K8s Pod，隔离最强）；⑤**CeleryKubernetesExecutor**（混合，Celery 跑小任务、K8s 跑大任务）。
- **Airflow 3.0（2025-04 GA）四大变化**：①**TaskSDK**——任务编写与调度器解耦，任务可独立测试、Python TaskSDK 已 GA、多语言 SDK 规划中；②**Data Assets**——原生数据感知调度（按「数据就绪」触发 DAG，补齐 Dagster 的核心能力，3.2 加 Asset 分区）；③**事件驱动**——DAG 可由外部事件（消息/webhook）触发，不只按时间；④**全新 UI + DAG 版本化**。
- **TaskSDK 的意义**：任务代码不再 `import airflow`，可像普通 Python 函数单测、可在 Jupyter 跑、可被非 Airflow 系统调用——解耦是 3.0 最大的架构改进。
- **Data Assets = 对标 Dagster**：Airflow 2.x 只能按时间调度（「每天 2 点跑」），Dagster 一直主打「按数据就绪触发」。3.0 引入 Data Assets 让 Airflow 也能数据感知，是防御性补课。
- **三大编排器哲学**：**Airflow**（静态 DAG + 调度优先，生态最厚，传统 ETL/大企业）vs **Prefect**（动态 Python-first，DAG 即普通函数，ML/动态流程）vs **Dagster**（Asset-centric，以数据资产为一等公民，数据治理/ELT）。
- **Prefect 2026-07 收购 Dagster**：2026-07-13 Prefect 宣布收购 Dagster Labs，两家融合（Dagster 预计 2026-08 起以 Prefect 名义运营），重塑「反 Airflow 阵营」格局。
- **选型建议**：传统批 ETL / 已有 Operator 生态 / 大企业合规 → **Airflow**；Python 重度 / ML 动态流程 → **Prefect**；数据资产治理 / ELT / 强类型 → **Dagster**（融入 Prefect 后两者合一）。
- **水平扩展瓶颈**：Scheduler 单点（虽可多实例，但有锁竞争）；元数据库压力大（XCom/历史/状态都进 DB）——超大规模（万级 DAG）常自建平台（字节、阿里都自研）。

## 一、Scheduler：决定「跑什么」

Scheduler 是 Airflow 的「大脑」，它持续做三件事：**扫描 DAG 文件 → 解析拓扑 → 决定调度**。

```
   DAG 目录（.py 文件）
          │
          ▼  每 min_file_process_interval（默认 30s）扫一次
   ┌──────────────┐
   │  Scheduler   │ ──解析 .py 得到 DAG 定义（缓存）
   └──────┬───────┘
          │  对每个 DAG：
          │   遍历所有 Task Instance，
          │   看依赖（上游 TI）是否 success、
          │   看是否到调度时间（schedule + data_interval）
          ▼
   把「就绪的 TI」推入 Executor 队列
```

- **DAG 解析开销**：每次扫 + 解析 `.py` 要 import Python 模块，**DAG 文件不能写重逻辑**（连数据库查配置、循环建几百个 Task）——否则 Scheduler 卡死。重逻辑应放 Task 内部。
- **调度时机**：Scheduler 按 DAG 的 `schedule`（cron/预设/timedelta/Asset）+ `data_interval` 决定「这次运行对应的逻辑区间」，然后给区间内的 Task 排队。
- **多 Scheduler**：可起多个 Scheduler 实例做 HA，但它们通过元数据库的锁协调，有竞争开销——单 Scheduler 通常够用，超大规模才上多实例。

## 二、Executor：决定「在哪儿跑」

Executor 是 Airflow 弹性的关键，选型直接决定部署架构与扩展性：

| Executor | 执行方式 | 隔离 | 扩展性 | 适用 |
| --- | --- | --- | --- | --- |
| **Sequential** | 单进程串行 | 无 | 无 | 仅测试（默认，依赖 SQLite） |
| **Local** | 本机多进程并行 | 进程级 | 单机 | 开发/小规模生产 |
| **Celery** | 分布式 worker 池（broker: Redis/RabbitMQ） | 进程级 | 水平扩展 worker | **生产主流** |
| **Kubernetes** | 每个 Task 起独立 Pod | Pod 级（最强） | 弹性扩缩 | 云原生/隔离要求高 |
| **CeleryKubernetes** | 混合：Celery 跑小、K8s 跑大 | 混合 | 混合 | 大规模异构 |

- **CeleryExecutor 是生产事实标准**：worker 横向扩展、broker 缓冲任务、稳可靠。需配套 Redis/RabbitMQ + PostgreSQL。
- **KubernetesExecutor**：每个 Task 独立 Pod，**资源隔离最干净**（CPU/内存/网络/镜像都隔离），失败不污染其他 Task——云原生首选，但每 Task 起停 Pod 有秒级开销。
- **CeleryKubernetesExecutor**：路由规则把「轻 Task」送 Celery（快），「重 Task」送 K8s（隔离），兼顾速度与隔离，是超大规模（字节/Airbnb 级）的选择。

## 三、Airflow 3.0：四年的大版本跃迁

2025-04 Airflow 3.0 GA，自 2020 年 2.0 以来最大的架构升级：

### 1. TaskSDK：解耦任务与调度器

传统 Airflow 任务代码 `import airflow` 才能跑——离开 Airflow 运行时无法独立测试。3.0 的 **TaskSDK** 把「任务编写」与「Airflow 调度」解耦：

```python
# 用 TaskSDK 写的任务：可独立单测、可在 Jupyter 跑
from airflow.sdk import task

@task
def clean(raw):
    return [x.strip() for x in raw if x]

def test_clean():
    assert clean([" a ", "", "b"]) == ["a", "b"]   # 不需起 Airflow
```

- Python TaskSDK 已 GA；**多语言 SDK**（Go/Java 等）规划中，未来非 Python 任务也能享受 Airflow 编排。
- 任务可被非 Airflow 系统（如独立的服务、Jupyter）调用复用——架构上是一次「关注点分离」。

### 2. Data Assets：数据感知调度

Airflow 2.x 只能按时间调度，**Dagster 的核心卖点就是「按数据就绪触发」**。3.0 引入 Data Assets 正面回应：

```python
# 声明 DAG 产出/消费的 Data Asset
@dag(schedule=[my_dataset])  # my_dataset 就绪时触发
def on_data_ready(): ...
```

- DAG 可声明「消费/产出哪些数据资产」，并按「**上游数据就绪**」触发，而非只按 cron。
- 3.2 进一步引入 **Asset Partitioning**（资产分区），按数据分区粒度调度，更精细——逐步对齐 Dagster。

### 3. 事件驱动

DAG 不只按时间触发，还能响应**外部事件**（消息、webhook、文件到达），补齐「实时性」短板——传统 Airflow 强在批处理，弱在事件驱动。

### 4. DAG 版本化 + 全新 UI

每次 DAG 运行可追溯到具体版本，便于回滚与合规治理；前端完全重写，更现代、更可用。

## 四、三大编排器对比：Airflow vs Prefect vs Dagster

数据编排领域三大主流，哲学迥异，选型先看「你优先什么」：

| 维度 | Airflow | Prefect | Dagster |
| --- | --- | --- | --- |
| **核心哲学** | 静态 DAG + 调度优先 | 动态 Python-first | Asset-centric（资产优先） |
| **DAG 拓扑** | 解析时定死（静态） | 运行时动态（普通 Python） | Asset 依赖图（也可动态） |
| **一等公民** | Task（任务） | Flow（函数） | Asset（数据资产） |
| **数据感知** | 3.0 才原生（Data Assets） | 一般 | **一等公民** |
| **类型系统** | 无 | 弱（Python 动态） | **强**（DagsterType/Pydantic 风格） |
| **生态** | 最厚（十年、数百 Operator） | 较新 | 新但增长快 |
| **典型场景** | 传统 ETL/批处理、大企业 | ML/动态流程、Python 团队 | 数据资产治理、ELT |

- **Airflow**：成熟、生态厚、Operator 海量，适合「**任务为中心**」的传统 ETL 与大企业合规场景。痛点是静态 DAG、数据感知弱（3.0 在补）。
- **Prefect**：Python-first，Flow 就是普通函数，**运行时动态**（循环、条件、按结果动态分支都自然），适合 ML/实验性流程。详见 [Prefect 叶](../../prefect/)。
- **Dagster**：以「**数据资产**」为一等公民（Software-defined Asset），调度围绕「资产是否最新」展开，强类型 + IO Manager 自动管数据存储，适合数据治理与 ELT。详见 [Dagster 叶](../../dagster/)。
- **2026-07-13 Prefect 收购 Dagster**：两家融合（Dagster 预计 2026-08 起以 Prefect 名义运营），「反 Airflow 阵营」整合为一家，未来 Prefect + Dagster 能力互补（动态 + 资产）。

## 五、选型与水平扩展

**选型决策树**：

- 已有大量 Airflow Operator / 大企业要 SLA 与审计 → **Airflow**
- Python 重度团队 / ML 动态流程 / 想要「DAG 即函数」→ **Prefect**
- 数据资产为核心 / 强类型 / ELT 治理 → **Dagster**（融入 Prefect 后两者合一）
- 个人学习入门数据工程 → **Airflow**（生态、文档、岗位需求最广）

**Airflow 水平扩展的瓶颈**：

- **Scheduler 单点**：虽可多实例 HA，但通过 DB 锁协调有竞争；超大规模常自研调度。
- **元数据库压力**：XCom/历史/状态都进 DB，万级 DAG 时 DB 是瓶颈——需分区/归档/清理（`airflow db clean`）。
- **DAG 解析开销**：DAG 文件多/重，Scheduler 解析慢——`min_file_process_interval` 调大、DAG 文件瘦身、用 `.airflowignore`。

## 下一步

理解了 Airflow 的调度与 3.0 后，对比阅读 [Prefect](../../prefect/) 与 [Dagster](../../dagster/) 两叶，能更清楚三者的取舍与各自适合的场景；最后看 [参考](../reference) 的 Operator/Executor 速查与易错点。
