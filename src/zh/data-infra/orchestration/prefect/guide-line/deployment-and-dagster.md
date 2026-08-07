---
layout: doc
outline: [2, 3]
---

# 部署、Work Pool 与收购 Dagster

> 基于 Prefect 3.x · 核于 2026-08

## 速查

- **部署三层模型**：**Deployment**（flow + 调度配置 + Work Pool 的注册单元）→ **Work Pool**（定义执行环境：process/Docker/K8s）→ **Worker**（轮询 Work Pool 拉取 flow run 执行）。
- **`prefect deploy`**：写 `prefect.yaml` 定义部署（flow 入口、cron/interval/event 调度、Work Pool），执行后注册到 Prefect Server/Cloud，支持版本化与 CI/CD。
- **Work Pool 类型**：①**process**（本机进程，开发/小规模）；②**docker**（Docker 容器，隔离）；③**kubernetes**（K8s Pod，弹性扩缩，云原生首选）；④**其他托管**（Vertex/Azure ML 等云 AI 环境）。
- **Worker**：长驻进程，轮询 Work Pool 拉取 flow run，按 Work Pool 类型起对应环境执行。Worker 可水平扩展（多实例）做 HA 与扩容。
- **Prefect Server vs Cloud**：**Server**（开源、自托管、数据不出企业）vs **Cloud**（SaaS、免运维、有 Auto-scaling/Automations/RBAC）。合规要求高选 Server，快速上手选 Cloud。
- **事件驱动**：flow 不仅按 cron/interval 触发，还能响应**外部事件**（webhook、S3 文件到达、Snowflake 变更）——通过 Deployment 的 event 触发器配置。
- **2026-07-13 Prefect 收购 Dagster**：Prefect 收购 Dagster Labs（产品+代码库+客户+团队），两家融合。Dagster 预计 2026-08 起以 Prefect 名义运营。
- **收购动机**：Prefect（动态 Python-first）与 Dagster（Asset-centric 资产优先 + 强类型 + IO Manager）能力互补——合并后同时拥有「动态流程 + 资产治理」，对 Airflow 形成更强竞争。
- **行业意义**：「反 Airflow 阵营」从分散整合为一家，资源集中，加速追赶。Airflow 3.0 的 Data Assets 正是防御性应对。
- **选型**：Python 重度/ML 动态 → Prefect；数据资产/强类型/ELT → Dagster（融入 Prefect）；传统批 ETL/大企业 → Airflow。

## 一、部署三层模型：Deployment / Work Pool / Worker

Prefect 把「flow 定义」「执行环境」「执行者」三层解耦：

```
   prefect deploy（注册 Deployment）
          │
          ▼
   ┌──────────────┐
   │  Deployment  │ flow + 调度（cron/interval/event）+ 指向 Work Pool
   └──────┬───────┘
          │ Server/Cloud 按计划生成 flow run
          ▼
   ┌──────────────┐
   │  Work Pool   │ 定义执行环境类型（process/docker/kubernetes）
   └──────┬───────┘
          │ Worker 轮询拉取 flow run
          ▼
   ┌──────────────┐
   │   Worker     │ 起对应环境（进程/容器/Pod）执行 flow run
   └──────────────┘
```

- **Deployment**：flow 的「部署实例」——绑定 flow 入口、调度计划、Work Pool。一个 flow 可有多个 Deployment（如 daily 版 + hourly 版）。
- **Work Pool**：执行环境的抽象。K8s Work Pool 可按负载自动扩缩 Pod。
- **Worker**：长驻进程，轮询 Work Pool 拉取 flow run。多 Worker 做 HA + 扩容。

## 二、`prefect deploy` 与 `prefect.yaml`

生产部署用 `prefect deploy`，配置写在 `prefect.yaml`：

```yaml
# prefect.yaml
name: my-project
prefect-version: 3.0.0

deployments:
  - name: daily-etl
    version: "1.0"
    tags: ["prod", "etl"]
    description: "每日 ETL 流水线"
    entrypoint: flows/etl.py:daily_etl   # flow 函数入口
    work_pool:
      name: my-k8s-pool                  # 指向已创建的 K8s Work Pool
      work_queue_name: default
    schedules:
      - interval: 86400                  # 每 24 小时（秒）
    parameters:
      date: "2026-08-07"
```

- 执行 `prefect deploy` 注册到 Server/Cloud。
- 支持 **CI/CD**：`prefect deploy --all` 批量部署，配合 Git 做版本管理。
- **参数化**：flow run 时可传入参数（如指定日期），Deployment 定义默认值。

## 三、Work Pool 类型与 Worker

Work Pool 决定 flow run 在哪儿跑：

| Work Pool | 执行环境 | 隔离 | 适用 |
| --- | --- | --- | --- |
| **process** | 本机进程 | 无 | 开发/小规模 |
| **docker** | Docker 容器 | 容器级 | 中等规模/需镜像隔离 |
| **kubernetes** | K8s Pod | Pod 级（最强） | 云原生/弹性扩缩 |
| **Vertex/Azure ML** | 云 AI 环境 | 托管 | ML 训练/推理 |

- **Worker 启动**：`prefect worker start --pool my-k8s-pool`，Worker 轮询该 Pool 拉取任务。
- **水平扩展**：多 Worker 实例做 HA（一个挂了另一个接）与扩容（多 Worker 并发处理多 flow run）。
- **K8s 弹性**：K8s Work Pool + KEDA 可按 flow run 队列深度自动扩缩 Worker（甚至到 0），极致弹性。

## 四、Prefect Server vs Cloud

| 维度 | Prefect Server（开源） | Prefect Cloud（SaaS） |
| --- | --- | --- |
| 部署 | 自托管（Docker/K8s） | SaaS，免运维 |
| 数据 | 不出企业（合规友好） | 流经 Prefect 云 |
| 功能 | 基础调度/状态/日志 | + Auto-scaling + Automations + RBAC + SLA |
| 成本 | 免费（自付基础设施） | 按用量付费 |
| 适合 | 合规要求高/大企业 | 快速上手/中小团队 |

- **Server**：开源，自托管，数据完全在企业内（金融/医疗/政企合规首选）。
- **Cloud**：SaaS，免运维，有 Automations（自动响应事件）、RBAC（权限）、SLA 保障。

## 五、事件驱动部署

Prefect 不仅按 cron/interval 触发，还能响应外部事件：

```yaml
deployments:
  - name: on-s3-arrival
    entrypoint: flows/process.py:handle
    work_pool: { name: my-pool }
    triggers:
      - enabled: true
        expect: ["s3.object.created"]     # S3 文件到达事件
        match: { "bucket": "my-bucket" }
```

- **事件源**：webhook、S3 文件到达、Snowflake 数据变更、自定义事件。
- **应用场景**：实时响应数据就绪（不必死等 cron 时间点），与 Airflow 3.0 的事件驱动能力对齐。

## 六、2026-07 收购 Dagster：来龙去脉

2026-07-13 Prefect 宣布收购 Dagster Labs，这是数据编排领域近年最大的一次整合：

### 为什么收购

- **能力互补**：Prefect 擅长动态 Python-first 流程（ML/实验），Dagster 擅长 Asset-centric 资产治理（强类型 + IO Manager + 数据感知调度）。两者合并后可同时拥有「动态流程 + 资产治理」，覆盖更全场景。
- **对抗 Airflow**：Airflow 生态最厚、用户最多，单个竞品难以撼动。Prefect + Dagster 整合资源，形成更强竞争者。
- **资本与团队**：Dagster 团队（含 Nick Schrock 等前 Meta/Facebook 工程师）加入，增强研发实力。

### 收购细节

- **标的**：Dagster Labs（产品 + Dagster 代码库 + 客户关系 + 团队）。
- **时间线**：2026-07-13 宣布，预计 2026-08 起 Dagster 以 Prefect 名义运营（交易关闭后）。
- **用户影响**：短期 Dagster 仍可独立使用（开源代码不消失）；长期需关注融合产品路线图（可能统一平台，保留两者优势）。

### 对编排器格局的影响

- **「反 Airflow 阵营」整合**：从分散（Prefect + Dagster + 其他）变一家，资源集中。
- **Airflow 防御**：Airflow 3.0 引入 Data Assets（数据感知调度）正是应对——试图补齐 Dagster 的核心卖点。
- **用户选择**：短期内三家仍并存，长期看 Prefect+Dagster 融合能否形成对 Airflow 的实质替代。

## 七、选型与对比

**选型决策**：

- Python 重度团队 / ML 动态流程 / 想要「DAG 即函数」→ **Prefect**
- 数据资产为核心 / 强类型 / ELT 治理 → **Dagster**（融入 Prefect 后两者合一）
- 已有大量 Airflow Operator / 大企业要 SLA 与审计 → **Airflow**
- 个人学习入门数据工程 → **Airflow**（生态、文档、岗位需求最广）

**三大编排器对比**：

| 维度 | Prefect | Dagster | Airflow |
| --- | --- | --- | --- |
| 核心哲学 | 动态 Python-first | Asset-centric | 静态 DAG + 调度优先 |
| 一等公民 | Flow（函数） | Asset（数据资产） | Task（任务） |
| 数据感知 | 一般（收购 Dagster 补强） | **一等公民** | 3.0 才原生 |
| 类型系统 | 弱（Python 动态） | **强** | 无 |
| 生态 | 较新 | 新 | 最厚 |

## 下一步

理解了 Prefect 的部署与收购后，对比阅读 [Dagster](../../dagster/) 叶（了解被收购方的资产优先哲学）与 [Airflow](../../airflow/) 叶（了解防御方的 Data Assets 补课），最后看 [参考](../reference) 的 API 速查与易错点。
