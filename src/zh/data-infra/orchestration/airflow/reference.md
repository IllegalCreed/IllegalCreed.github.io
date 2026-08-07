---
layout: doc
outline: [2, 3]
---

# 参考：Airflow Operator、Executor 与易错点速查

> 基于 Apache Airflow 3.x · 核于 2026-08

## 速查

- **三大抽象**：DAG（拓扑）→ Task（节点）→ Operator（模板）。Task 是 DAG 实例化后的执行单元。
- **TaskFlow API（推荐）**：`@task` 装饰器把函数变 Task，XCom 自动传，比传统 `PythonOperator + set_upstream` 简洁。
- **Operator 三流派**：Action（执行，Bash/Python/K8s Pod）、Transfer（搬数据，S3ToRedshift）、Sensor（等待，S3KeySensor/ExternalTaskSensor）。
- **Executor 全谱**：Sequential（默认，仅测试）→ Local（本机多进程）→ Celery（分布式，生产主流）→ Kubernetes（每 Task 独立 Pod，隔离最强）→ CeleryKubernetes（混合）。
- **XCom 边界**：小数据（< 2MB）走元数据库，大数据必须落 S3/HDFS 只传引用。
- **Airflow 3.0 四变**：TaskSDK（解耦）、Data Assets（数据感知）、事件驱动、全新 UI + DAG 版本化。
- **三大编排器**：Airflow（静态 DAG + 调度优先）vs Prefect（动态 Python-first）vs Dagster（Asset-centric）。
- **Jinja 关键变量**：`{{ ds }}`（YYYY-MM-DD）、`{{ data_interval_start }}`（推荐，取代 `execution_date`）。
- **生产稳定三件套**：`retries` + `retry_delay` + `retry_exponential_backoff=True`。
- **Sensor 必坑**：长等待 Sensor 用 `mode='reschedule'` 释放 slot，否则阻塞 Worker。

## 一、Operator 速查

### Action Operator（执行动作）

| Operator | 用途 | 备注 |
| --- | --- | --- |
| `BashOperator` | 跑 shell 命令 | 最通用，支持 Jinja 模板 |
| `PythonOperator` | 跑 Python 函数 | `@task`（TaskFlow）是它的语法糖 |
| `EmailOperator` | 发邮件 | 告警通知 |
| `HttpOperator` | 调 HTTP API | 调内部服务/webhook |
| `DockerOperator` | 跑 Docker 容器 | 隔离，但不如 K8s |
| `KubernetesPodOperator` | 起 K8s Pod 跑 | **生产首选**，隔离最强 |
| `SparkSubmitOperator` | 提交 Spark 作业 | 大数据 ETL |

### Transfer Operator（搬数据）

| Operator | 用途 |
| --- | --- |
| `S3ToRedshiftOperator` | S3 → Redshift（COPY） |
| `MySQLToS3Operator` | MySQL → S3（导出） |
| `GCSToBigQueryOperator` | GCS → BigQuery |
| `MongoToS3Operator` | Mongo → S3 |

### Sensor（等待条件）

| Sensor | 等什么 | 必坑 |
| --- | --- | --- |
| `S3KeySensor` | S3 文件出现 | 长等待用 `mode='reschedule'` |
| `ExternalTaskSensor` | 上游 DAG 跑完 | 跨 DAG 依赖 |
| `DateTimeSensor` | 到达目标时刻 | 等到特定时间 |
| `SqlSensor` | SQL 返回真值 | 轮询数据库状态 |

## 二、Executor 对比

| Executor | 执行 | 隔离 | 扩展 | 依赖 | 适用 |
| --- | --- | --- | --- | --- | --- |
| **Sequential** | 单进程串行 | 无 | 无 | SQLite（默认） | 仅测试 |
| **Local** | 本机多进程 | 进程级 | 单机 | PostgreSQL | 开发/小生产 |
| **Celery** | 分布式 worker 池 | 进程级 | 水平 | Redis/RabbitMQ + PG | **生产主流** |
| **Kubernetes** | 每 Task 一 Pod | Pod 级 | 弹性 | K8s 集群 | 云原生/高隔离 |
| **CeleryKubernetes** | 混合路由 | 混合 | 混合 | Celery + K8s | 超大规模异构 |

## 三、Airflow 2.x vs 3.0 差异

| 维度 | Airflow 2.x | Airflow 3.0 |
| --- | --- | --- |
| 任务编写 | 强依赖 Airflow 运行时 | **TaskSDK** 解耦，可独立测试 |
| 调度触发 | 只按时间（cron） | **Data Assets** 数据感知 + 事件驱动 |
| 数据感知 | 弱（需自建 Sensor 轮询） | 原生（3.2 加 Asset 分区） |
| DAG 版本 | 无显式版本 | **DAG 版本化**，可追溯回滚 |
| UI | 2.x 经典 UI | **全新重写**，更现代 |
| 多语言 | 仅 Python | TaskSDK 规划多语言 SDK |

## 四、Jinja 模板变量速查

| 变量 | 含义 | 示例 |
| --- | --- | --- |
| `{{ ds }}` | 逻辑日期 YYYY-MM-DD | `2026-08-07` |
| `{{ ds_nodash }}` | 无分隔日期 | `20260807` |
| `{{ ts }}` | ISO 时间戳 | `2026-08-07T00:00:00+00:00` |
| `{{ data_interval_start }}` | 数据区间起点（**推荐**，取代 execution_date） | `2026-08-06T00:00:00+00:00` |
| `{{ data_interval_end }}` | 数据区间终点 | `2026-08-07T00:00:00+00:00` |
| `{{ run_id }}` | 本次运行 ID | `scheduled__2026-08-07` |
| `{{ params.key }}` | DAG 级自定义参数 | 用户传入 |

## 五、易错点清单

- **「DAG 可以有循环」**：错。DAG 必须无环（Acyclic），解析期强制校验，有环直接拒绝加载。
- **「XCom 可以传大数据」**：错。XCom 默认存元数据库，> 2MB 会撑爆 DB。大数据必须落 S3/HDFS 只传引用。
- **「`execution_date` 是运行时刻」**：错。它是「数据区间的开始」（如 daily DAG，8 月 7 日跑的 run 的 execution_date 是 8 月 6 日 00:00）——2.2+ 推荐用 `data_interval_start/end`，语义更清晰。
- **「`catchup=True` 是好事（补历史）」**：危险。若 start_date 是一年前、schedule=@daily，启动会回灌 365 次运行，常把集群跑炸。**生产建议 catchup=False**。
- **「Sensor 不占资源」**：错。默认 `mode='poke'`，Sensor 占用 Worker slot 整个轮询周期，长等待 Sensor 会阻塞其他 Task。**长等待必用 `mode='reschedule'`**。
- **「DAG 文件可以写连接数据库查配置的重逻辑」**：危险。Scheduler 每 30s 扫一遍 DAG 文件，重逻辑会拖慢甚至卡死 Scheduler。重逻辑放 Task 内部。
- **「SequentialExecutor 能用于生产」**：错。Sequential 单进程串行，仅测试用（依赖 SQLite）。生产必须 Local/Celery/K8s。
- **「3.0 的 TaskSDK 让所有老 DAG 失效」**：错。TaskSDK 向后兼容，老 DAG（2.x 风格）在 3.0 仍可跑，TaskSDK 是新的、更解耦的写法。
- **「Airflow 适合流处理」**：错。Airflow 强在批处理与定时调度，流处理用 Flink/Kafka Streams。Airflow 3.0 的事件驱动只是「按事件触发 DAG」，不是真正的流处理。
- **「Airflow 的 Data Assets 等于 Dagster 的 Asset」**：方向对但成熟度不同。Airflow 3.0 才引入，3.2 加分区；Dagster 以 Asset 为一等公民打磨多年，深度仍领先。

## 六、进阶方向（链接其他叶）

- [Prefect](../prefect/) —— 动态 Python-first 编排器（2026-07 收购 Dagster）
- [Dagster](../dagster/) —— Asset-centric 编排器（被 Prefect 收购后重定位）
- 本站幻灯片：<a href="/SlideStack/airflow-slide/" target="_blank">Apache Airflow</a>

## 权威链接

- [Apache Airflow 官方文档](https://airflow.apache.org/docs/)
- [Airflow 3.0 GA 公告](https://airflow.apache.org/blog/airflow-three-point-oh-is-here/)
- [Airflow Release Notes](https://airflow.apache.org/docs/apache-airflow/stable/release_notes.html)
- [Astronomer（Airflow 商业化公司）](https://www.astronomer.io/)
- [Airflow GitHub](https://github.com/apache/airflow)
