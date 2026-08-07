---
layout: doc
---

# Databricks

**Databricks** 是由 **Spark 创始团队（UC Berkeley AMPLab）创立的云数据平台公司**——它把开源 Spark + 自研的 **Delta Lake（事务存储层）** + **Photon（向量化执行引擎）** + **MLflow（机器学习生命周期管理）** 整合成一个托管的 **Lakehouse（湖仓一体）** 平台。Lakehouse 的核心思想是「**数据湖的开放存储 + 数据仓库的事务与查询性能**」——用对象存储（S3/ADLS/GCS）作为低成本、开放的底座，上面叠 Delta Lake 提供 ACID 事务、schema 约束、time travel；用 Photon 引擎加速 SQL/Spark 查询，让湖上查询性能逼近专用数仓；用 MLflow 把 ML 实验追踪、模型注册、部署串成生命周期。理解 Databricks 的全部考点围绕五个核心展开：①**Lakehouse 范式**（数据湖 + 数据仓库优点的融合，对标 Snowflake/BigQuery 等纯云数仓）；②**Delta Lake**（基于 Parquet 的事务日志层，ACID + MVCC + time travel + Z-ordering）；③**Photon 引擎**（C++ 原生向量化执行，替代 JVM 执行层提升性能）；④**MLflow 集成**（追踪/项目/模型/注册表四件套，ML 生命周期管理，开源）；⑤**Spark 商业化与生态**（Databricks Runtime = 优化版 Spark + 自研引擎 + ML/AI 库，云托管 + Serverless，与开源 Spark 的关系）。本叶是批处理与转换章的平台视角——后续各叶在 Lakehouse 平台与集成维度深入。

## 评价

**优点**

- **Lakehouse 统一架构**：一份数据同时服务 BI（SQL 数仓）+ ML（特征工程）+ AI（GenAI），避免数据湖与数据仓库之间的 ETL 搬运
- **Delta Lake 事务**：ACID、MVCC 并发、schema 强约束、time travel（按版本回溯）、upsert/merge、Z-ordering 加速——让对象存储具备数据库级可靠性
- **Photon 性能**：C++ 原生向量化执行引擎，SQL/Spark 查询比开源 Spark 快数倍，逼近专用云数仓
- **MLflow 全生命周期**：实验追踪、可复现运行、模型注册、部署——开源标准，与 Databricks 深度集成
- **云原生 + Serverless**：托管 Spark + Serverless SQL，无需运维集群，按用量计费

**缺点**

- **厂商锁定风险**：Photon 是闭源，迁移回开源 Spark 性能会降；Delta Lake 有开源版（Delta Lake Project）但 Databricks 版功能更全
- **成本**：托管便利的代价是计费——大数据量 + 长期运行成本可能高于自建开源 Spark 集群
- **学习曲线**：Lakehouse、Delta、MLflow、Unity Catalog 概念多，新团队上手需理解整套范式
- **并非所有场景需要**：纯离线小规模 ETL 用开源 Spark 即可；纯 OLAP 用专用数仓（Snowflake/ClickHouse）更划算

## 本叶地图

- [入门](./getting-started) —— Databricks 定位与 Spark 商业化、Lakehouse 范式（数据湖 + 数仓融合）、Delta Lake 基础（ACID/事务日志）、平台架构（Workspace/Cluster/Runtime）
- [Lakehouse 平台：Delta Lake 与 Photon](./guide-line/lakehouse-platform) —— Delta Lake 事务日志与 MVCC、ACID/time travel/merge/Z-ordering、Photon 向量化引擎、Unity Catalog 治理
- [集成：MLflow、Spark 商业化与开源对比](./guide-line/integration) —— MLflow 四件套（追踪/项目/模型/注册表）、Databricks Runtime vs 开源 Spark、Serverless 与定价模型、与 Snowflake/BigQuery 对照
- [参考](./reference) —— Delta Lake 特性速查、Photon 性能数据、MLflow API 速查、Databricks vs 开源 Spark vs Snowflake 对比、易错点

## 幻灯片地址

<a href="/SlideStack/databricks-slide/" target="_blank">Databricks</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Databricks" target="_blank" rel="noopener noreferrer">Databricks 测试题</a>
