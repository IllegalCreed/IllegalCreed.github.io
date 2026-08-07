---
layout: doc
---

# Apache Airflow

**Apache Airflow** 是 Airbnb 于 2014 年开源、2019 年捐给 Apache 基金会的**数据编排（Orchestration）平台**——用 Python 写 DAG（有向无环图）定义数据流水线，由调度器按时触发、worker 执行，是数据工程领域**事实标准（de facto standard）**级的存在。它的核心抽象是「**DAG = 一组 Task + 依赖关系**」：开发者用 Python 代码描述任务（拉数据、清洗、写库、发邮件）及其上下游，Airflow 负责定时调度、依赖编排、失败重试、状态可视化。几乎每家有数据团队的公司（字节、Airbnb、字节、阿里、Netflix）都跑过 Airflow，它是数据工程师简历上的「必备技能」。

Airflow 的全部考点围绕「**Python-as-DAG + 调度执行分离**」展开：①**DAG/Task/Operator**——DAG 描述拓扑、Task 是执行单元、Operator 是 Task 的模板（BashOperator/PythonOperator/容器化任务）；②**调度器架构**——Scheduler 扫 DAG 文件算依赖、Executor 把 Task 派给 Worker（LocalExecutor/CeleryExecutor/KubernetesExecutor）；③**XCom**——Task 间小数据传递通道（大数据要走外部存储）；④**Airflow 3.0（2025-04 GA）**——四年来首次大版本，引入 TaskSDK（解耦任务编写与调度）、Data Assets（原生数据感知调度）、事件驱动触发、DAG 版本化、全新 UI；⑤**与 Prefect/Dagster 对比**——Airflow 是「静态 DAG + 调度优先」，Prefect 是「动态 Python-first」，Dagster 是「资产优先（Asset-centric）」，三者哲学迥异。本叶是 Airflow 全章的总览与地基。

## 评价

**优点**

- **Python-as-DAG**：用纯 Python 写流水线，可 lint/可测试/可复用，比 XML/YAML 配置式编排强得多
- **生态成熟**：数百个 Operator（AWS/GCP/Azure/Spark/Kubernetes/数据库）开箱即用，社区庞大，文档齐全
- **调度稳定**：经过十年生产验证，Scheduler + Executor 模型可水平扩展，支撑数万 DAG 的企业级部署
- **可观测性好**：UI 实时显示 DAG 执行图、Task 状态、日志、重试，运维友好

**缺点**

- **静态 DAG 痛点**：DAG 在解析时拓扑就定死，运行时动态生成分支（如「按查询结果决定跑几个 task」）笨拙（Dynamic Task Mapping 3.0 才补齐）
- **数据感知弱**：Airflow 2.x 只能按时间调度，不原生感知「上游数据就绪」——Data Assets 在 3.0 才引入（Dagster 一直以此为核心卖点）
- **架构重**：Scheduler/Webserver/Executor/Worker/元数据库多组件，本地起一套要 PostgreSQL + Redis，对个人开发者偏重
- **学习曲线陡**：Operator/Jinja 模板/XCom/Hook/Connection 概念多，新手要踩不少坑

## 本叶地图

- [入门](./getting-started) —— Airflow 定义、DAG/Task/Operator、Scheduler/Executor、XCom、Airflow 3.0 变化、与 Prefect/Dagster 对比
- [DAG、Task、Operator 与 XCom](./guide-line/dag-and-operators) —— DAG 拓扑规则、Task 生命周期、Operator 三大流派、Hook/Connection、XCom 原理与限制
- [调度器、Airflow 3.0 与竞品对比](./guide-line/scheduling-and-v3) —— Scheduler 轮询模型、Executor 全谱、Airflow 3.0 TaskSDK/Data Assets/事件驱动、Prefect vs Dagster 选型
- [参考](./reference) —— Operator 速查、Executor 对比、Airflow 2.x vs 3.0 差异、易错点

## 幻灯片地址

<a href="/SlideStack/airflow-slide/" target="_blank">Apache Airflow</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Apache%20Airflow" target="_blank" rel="noopener noreferrer">Apache Airflow 测试题</a>
