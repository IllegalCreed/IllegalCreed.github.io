---
layout: doc
---

# Prefect

**Prefect** 是 2018 年由 Jeremiah Lowin（前 Airflow 核心贡献者）创立的**新一代数据编排平台**——核心理念是「**Python-first，把 DAG 当普通函数**」。与 Airflow「静态 DAG + 调度优先」不同，Prefect 让你用 `@flow`/`@task` 装饰器把普通 Python 代码变成可编排、可观测、可重试的流水线，**运行时动态**（循环、条件、按结果动态分支都自然）——这解决了 Airflow 静态 DAG 在 ML/实验性流程上的痛点。它是「反 Airflow 阵营」的旗舰，2026-07 收购 Dagster 后更是整合了「资产优先」的能力。

Prefect 的全部考点围绕「**Python-first + 动态 DAG + 部署模型**」展开：①**flow/task 装饰器**——`@flow` 标记流水线、`@task` 标记任务单元，依赖通过函数调用隐式表达，结果自动追踪；②**动态 DAG**——Flow 就是普通 Python 函数，运行时按实际数据动态生成任务拓扑（map/循环/条件都自然），无需 Airflow 那种「解析时定死」；③**部署模型**——`prefect deploy` + Work Pool + Worker，Worker 轮询 Work Pool 拉取执行，支持 process/Docker/K8s 等多种执行环境；④**2026-07-13 收购 Dagster**——Prefect 收购 Dagster Labs，两家融合（Dagster 预计 2026-08 起以 Prefect 名义运营），Prefect 的动态 + Dagster 的资产能力互补，对 Airflow 形成更强竞争。本叶是 Prefect 全章的总览与地基。

## 评价

**优点**

- **Python-first**：Flow/Task 是普通 Python 函数，可单测、可调试、可在 Jupyter 跑，开发者体验远胜 Airflow 的 DAG 模型
- **运行时动态**：循环、条件、map、按结果动态分支都是原生 Python 语法，无需 Dynamic Task Mapping 这种补丁
- **状态追踪自动**：`@task` 的返回值自动被 Prefect 追踪（状态/输入/输出/日志），无需手动 XCom push/pull
- **部署灵活**：Work Pool + Worker 模型支持 process/Docker/K8s/云函数等多种执行环境，按需弹性

**缺点**

- **生态较新**：Operator/集成数量远不及 Airflow（十年积累的数百个），复杂场景要自己写集成
- **数据感知弱**：传统 Prefect 以 Task/Flow 为中心，不像 Dagster 那样以「数据资产」为一等公民（收购 Dagster 后正在补）
- **生产验证较少**：相比 Airflow 的十年大规模验证，Prefect 在超大型企业（万级 Flow）的案例较少
- **学习曲线**：虽然 Python-first 更友好，但 Work Pool/Worker/Deployment/Block 概念仍需学习

## 本叶地图

- [入门](./getting-started) —— Prefect 定义、Python-first 哲学、flow/task 装饰器、动态 DAG、部署模型、2026-07 收购 Dagster
- [flow、task 与动态 DAG](./guide-line/flow-and-task) —— `@flow`/`@task` 语义、状态自动追踪、运行时动态拓扑、与 Airflow 静态 DAG 的本质差异
- [部署、Work Pool 与收购 Dagster](./guide-line/deployment-and-dagster) —— `prefect deploy` 流程、Work Pool/Worker 模型、Prefect 收购 Dagster 的来龙去脉与影响
- [参考](./reference) —— flow/task API 速查、部署模式对比、Prefect vs Airflow vs Dagster、易错点

## 幻灯片地址

<a href="/SlideStack/prefect-slide/" target="_blank">Prefect</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Prefect" target="_blank" rel="noopener noreferrer">Prefect 测试题</a>
