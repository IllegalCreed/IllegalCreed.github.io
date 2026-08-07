---
layout: doc
outline: [2, 3]
---

# 参考：Prefect API、部署模式与易错点速查

> 基于 Prefect 3.x · 核于 2026-08

## 速查

- **两大装饰器**：`@flow`（流水线，可嵌套 subflow）+ `@task`（任务单元，可重试/缓存）。
- **依赖隐式**：函数调用即依赖（`transform(extract())` 自动建依赖），无需 `>>` 或 set_downstream。
- **动态 DAG**：flow 是普通 Python，循环/条件/map 都是原生语法，运行时动态生成拓扑（核心优势）。
- **状态自动追踪**：task 输入/输出/状态/日志自动记录到 Server/Cloud，无需手动 XCom。
- **部署三层**：Deployment（flow+调度+Work Pool）→ Work Pool（process/docker/kubernetes）→ Worker（轮询执行）。
- **Server vs Cloud**：Server（自托管、合规）vs Cloud（SaaS、免运维、Auto-scaling/Automations）。
- **2026-07 收购 Dagster**：Prefect + Dagster 融合，动态 + 资产互补，对 Airflow 形成更强竞争。
- **三大编排器**：Prefect（动态 Python-first）vs Dagster（Asset-centric）vs Airflow（静态 DAG + 调度优先）。
- **结果持久化**：`result_storage` + `persist_result=True` 让 task 输出落 S3，重启可复用。
- **`serve` vs `deploy`**：`flow.serve()`（开发/本地）vs `prefect deploy`（生产、配 prefect.yaml）。

## 一、`@flow` / `@task` API 速查

### `@flow` 参数

| 参数 | 含义 | 示例 |
| --- | --- | --- |
| `name` | flow 显示名 | `name="daily_etl"` |
| `retries` | flow 级重试次数 | `retries=2` |
| `retry_delay_seconds` | 重试间隔 | `retry_delay_seconds=60` |
| `log_prints` | 捕获 print 到日志 | `log_prints=True` |
| `timeout_seconds` | 超时（秒） | `timeout_seconds=3600` |

### `@task` 参数

| 参数 | 含义 | 示例 |
| --- | --- | --- |
| `retries` | task 级重试 | `retries=3` |
| `retry_delay_seconds` | 重试间隔 | `retry_delay_seconds=60` |
| `cache_key_fn` | 缓存 key 函数 | `cache_key_fn=lambda ctx, p: f"k-{p['v']}"` |
| `result_storage` | 结果存储（S3/本地） | `result_storage=S3.load("bucket")` |
| `persist_result` | 是否持久化结果 | `persist_result=True` |
| `tags` | 标签 | `tags=["etl", "prod"]` |

### task 状态机

```
Pending → Running → ┬→ Completed
                    ├→ Failed → Retrying → ...（达 retries 上限才 Failed）
                    └→ Cancelled
```

## 二、部署模式对比

| 维度 | `flow.serve()` | `prefect deploy` |
| --- | --- | --- |
| 用途 | 开发/本地 | 生产 |
| 调度 | 简单监听 | cron/interval/event 全支持 |
| Work Pool | 内建进程 | 任选（process/docker/k8s） |
| HA | 无 | 多 Worker |
| 配置 | 代码内一行 | prefect.yaml |
| CI/CD | 不便 | 支持（`prefect deploy --all`） |

### Work Pool 类型

| 类型 | 执行环境 | 隔离 | 适用 |
| --- | --- | --- | --- |
| process | 本机进程 | 无 | 开发/小规模 |
| docker | Docker 容器 | 容器级 | 中等规模 |
| kubernetes | K8s Pod | Pod 级 | 云原生/弹性 |
| Vertex/Azure ML | 云 AI | 托管 | ML 训练 |

## 三、Prefect vs Dagster vs Airflow

| 维度 | Prefect | Dagster | Airflow |
| --- | --- | --- | --- |
| 核心哲学 | 动态 Python-first | Asset-centric | 静态 DAG + 调度优先 |
| DAG 时机 | 运行时动态 | Asset 依赖图（也可动态） | 解析时定死 |
| 一等公民 | Flow（函数） | Asset（数据资产） | Task（任务） |
| 数据感知 | 一般（收购 Dagster 补强） | **一等公民** | 3.0 才原生 |
| 类型系统 | 弱（Python 动态） | **强**（DagsterType） | 无 |
| 本地开发 | `python f.py` 直接跑 | 直接跑 | 要起 Airflow |
| 生态 | 较新 | 新 | 最厚（十年） |
| 典型场景 | ML/动态流程 | 数据资产治理/ELT | 传统批 ETL/大企业 |

## 四、易错点清单

- **「Prefect 的 flow 是 DAG 文件」**：错。flow 是**普通 Python 函数**，不是配置文件。本地 `python f.py` 直接跑，无需起平台。
- **「task 间要手动 XCom push/pull」**：错。Prefect 自动追踪 task 输入/输出，无需手动操作（这是与 Airflow 的关键差异）。
- **「flow 的拓扑在解析时定死」**：错。Prefect flow 是普通函数，拓扑在**运行时**按实际数据动态生成——这是它对 Airflow 静态 DAG 的核心优势。
- **「生产用 `flow.serve()` 就够了」**：危险。`serve` 适合开发/本地，生产要用 `prefect deploy` + Work Pool + Worker，才有 HA 与弹性。
- **「Prefect 的数据感知和 Dagster 一样强」**：错。Prefect 传统以 Task/Flow 为中心，数据感知弱于 Dagster（收购 Dagster 后正在补强）。
- **「Worker 不需要水平扩展」**：错。单 Worker 是单点（挂了 flow run 无人执行），生产要多 Worker 做 HA + 扩容。
- **「Server 和 Cloud 功能完全一样」**：错。Cloud 多了 Auto-scaling/Automations/RBAC/SLA，Server 是基础版（开源、自托管）。
- **「2026-07 收购后 Dagster 立即下线」**：错。短期 Dagster 仍可独立使用（开源代码不消失），预计 2026-08 起以 Prefect 名义运营，长期看融合路线图。
- **「Prefect 适合流处理」**：错。Prefect 强在批/动态流程编排，不适合毫秒级实时流（用 Flink/Kafka Streams）。事件驱动只是「按事件触发 flow」。
- **「`@task` 不能有返回值」**：错。`@task` 函数可有返回值，自动被追踪/持久化，下游 task 可直接接收（类似 Airflow XCom 但更自动化）。

## 五、进阶方向（链接其他叶）

- [Apache Airflow](../airflow/) —— 静态 DAG + 调度优先的编排器（被 Prefect 防御对标）
- [Dagster](../dagster/) —— Asset-centric 编排器（2026-07 被 Prefect 收购后重定位）
- 本站幻灯片：<a href="/SlideStack/prefect-slide/" target="_blank">Prefect</a>

## 权威链接

- [Prefect 官方文档](https://docs.prefect.io/v3/)
- [Prefect Deployments](https://docs.prefect.io/v3/concepts/deployments)
- [Prefect acquires Dagster Labs（2026-07-13）](https://www.prefect.io/prefect-acquires-dagster)
- [Dagster is joining Prefect](https://dagster.io/prefect)
- [Prefect GitHub](https://github.com/PrefectHQ/prefect)
