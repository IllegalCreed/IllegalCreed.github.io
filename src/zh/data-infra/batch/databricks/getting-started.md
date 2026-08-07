---
layout: doc
outline: [2, 3]
---

# 入门：Databricks 定位、Lakehouse 与 Delta Lake 基础

> 基于 Databricks Runtime 16 / Delta Lake 3.x · 核于 2026-08

## 速查

- **Databricks 定位**：由 **Spark 创始团队（UC Berkeley AMPLab，2009）**2013 年创立的云数据平台公司，把开源 Spark + 自研 Delta Lake（事务存储）+ Photon（C++ 向量化引擎）+ MLflow（ML 生命周期）整合成托管的 **Lakehouse（湖仓一体）** 平台。
- **Lakehouse 范式**：「**数据湖的开放低成本存储 + 数据仓库的事务与查询性能**」。底座用对象存储（S3/ADLS/GCS）存开放格式（Parquet/ Delta），上层叠事务层 + 高性能引擎，让一份数据同时服务 BI（SQL 数仓）+ ML（特征）+ AI——避免传统「数据湖 → ETL → 数据仓库」的两套系统搬运。
- **传统数据湖的痛点**：对象存储 + Parquet/JSON 文件，开放但**无事务**（写一半失败留脏数据）+ **无 schema 约束**（垃圾数据进湖没人管）+ **并发写冲突**（多个作业改同一文件）+ **查询慢**（无索引无统计）。Lakehouse 用 Delta Lake 解决。
- **传统数据仓库的痛点**：专用格式 + 闭源存储（Snowflake/BigQuery），查询快但**数据锁定**（搬不出来）+ **成本高**（存储贵于对象存储）+ **不适合 ML/非结构化**（只擅长结构化 SQL）。Lakehouse 用开放存储 + 高性能引擎解决。
- **Delta Lake**：基于 Parquet 的**事务存储层**——在每个 Parquet 文件上加一个 **事务日志（_delta_log/）**，记录所有变更（add/remove 文件、schema 变更）。提供 ACID 事务、MVCC 并发、schema 强约束、time travel（按版本/时间戳回溯）、merge/upsert、Z-ordering（多维聚簇加速）。
- **Photon 引擎**：Databricks 自研的 **C++ 原生向量化执行引擎**，替代开源 Spark 的 JVM 执行层——向量化（批量处理列）、原生代码（无 JVM/GC 开销）、代码生成，让 SQL/Spark 查询比开源 Spark 快数倍，逼近专用云数仓。**闭源**，是 Databricks 商业化的核心壁垒。
- **MLflow**：开源的 ML 生命周期管理平台（Databricks 主导贡献）——**Tracking（实验追踪）** + **Projects（可复现打包）** + **Models（模型打包与部署）** + **Model Registry（模型注册表）** 四件套，与 Databricks Workspace 深度集成。
- **Databricks Runtime**：Databricks 平台上的「Spark 发行版」——开源 Spark + 自研优化（Photon/自适应优化/Delta 集成）+ ML/AI 库（MLflow/PyTorch/XGBoost）+ GPU 支持，每次发布一个版本号（如 Runtime 16.x）。
- **平台组件**：**Workspace**（ notebooks/作业/模型管理 UI）+ **Cluster**（计算资源，all-purpose/job/Serverless）+ **Unity Catalog**（统一元数据与权限治理）+ **Delta Lake**（存储）。
- **进阶顺序**：[Lakehouse 平台：Delta Lake 与 Photon](./guide-line/lakehouse-platform) → [集成：MLflow、Spark 商业化与开源对比](./guide-line/integration) → [参考](./reference)。

## 一、Databricks 是什么：Spark 的商业化与超越

Databricks 由 Spark 的创始团队（UC Berkeley AMPLab，2009 开发 Spark）于 2013 年创立——这是理解 Databricks 的钥匙：**它从商业化 Spark 起家，但远不止「托管 Spark」**。

- **起点：托管 Spark**。早期 Databricks 提供「云上托管的 Spark 集群 + notebooks」——免运维，开发者开箱即用。但单纯的托管 Spark 价值有限（云厂商 AWS EMR/Google Dataproc 也能托管）。
- **突破：Delta Lake + Photon**。Databricks 真正的差异化：①**Delta Lake**（2017 开源）——给数据湖加事务层，让 Parquet 文件具备 ACID；②**Photon**（2020，闭源）——C++ 向量化引擎，让 Spark 性能逼近专用数仓。这两者让 Databricks 从「托管 Spark」升级为「Lakehouse 平台」。
- **生态：MLflow + Unity Catalog**。收购/主导 MLflow（ML 生命周期，2018 开源）、Unity Catalog（统一元数据治理，2021），把 BI/ML/AI 统一在一个平台。

所以现代 Databricks 的定位是「**Lakehouse 平台**」——不是单纯 Spark 托管，而是数据湖 + 数仓 + ML 一体化的云数据平台。

## 二、Lakehouse：数据湖 + 数据仓库的融合

传统上，企业数据架构是「数据湖 + 数据仓库」两套系统：

```
传统架构：
  数据源 → 数据湖（S3 + Parquet/JSON）─ ETL → 数据仓库（Snowflake/BigQuery）→ BI
              │                                  │
              开放、便宜、但无事务/无约束          查询快、有事务、但闭源锁定、贵
              适合 ML/原始数据                    只擅长结构化 SQL

Lakehouse 架构（Databricks）：
  数据源 → 对象存储（S3）+ Delta Lake（事务层）
              │
              开放格式（Parquet + 事务日志）+ ACID + schema 约束 + Photon 加速查询
              │
              同时服务 BI（SQL 数仓）+ ML（特征）+ AI（训练）—— 一份数据
```

- **Lakehouse 的核心承诺**：用对象存储的低成本 + 开放格式，叠加事务层 + 高性能引擎，**让一份数据同时满足数仓查询性能和湖的开放性**。
- **避免 ETL 搬运**：传统「湖 → 仓」要 ETL 复制数据，Lakehouse 直接在湖上查询，无搬运（「single source of truth」）。
- **ML/BI 统一**：同一份 Delta 表，BI 用 SQL 查，ML 用 Spark 读特征，AI 用 notebooks 训练——无需多套存储。

## 三、Delta Lake：事务存储层

Delta Lake 是 Lakehouse 的存储基石——在 Parquet 文件之上加一层**事务日志**，让对象存储具备数据库级可靠性：

```
Delta 表 = 一堆 Parquet 文件 + 一个事务日志（_delta_log/）
                      │
                      ├── 00000000000000000000.json   ← 第 0 次提交（建表）
                      ├── 00000000000000000001.json   ← 第 1 次提交（add 文件）
                      ├── 00000000000000000002.json   ← 第 2 次提交（remove + add）
                      └── _last_checkpoint            ← 检查点（加速日志重放）
```

- **事务日志（transaction log）**：每次写操作（INSERT/UPDATE/DELETE/MERGE）都是一次原子提交（commit），追加一个 JSON 文件记录变更（add/remove 哪些 Parquet 文件、schema 变更）。日志本身是「单一事实来源（single source of truth）」。
- **ACID**：每次提交是原子的——要么全部成功（新文件可见 + 日志更新），要么全部失败（无副作用）。基于 **乐观并发控制（OCC）+ 原子文件系统操作**（如 S3 的 conditional write）实现。
- **MVCC**：每次提交对应一个**版本号**（version 0, 1, 2...）。读操作指定版本读对应快照——**读不阻塞写，写不阻塞读**。这就是 time travel 的基础。
- **schema 约束**：写入时校验 schema（拒绝不匹配的脏数据），支持 schema evolution（显式 merge schema）。避免数据湖的「垃圾数据进湖没人管」。
- **time travel**：`SELECT * FROM t VERSION AS OF 5` 或 `TIMESTAMP AS OF '2026-08-01'`——查询历史版本，用于审计、回滚、复现 ML 实验。
- **merge/upsert**：`MERGE INTO target USING source ON ... WHEN MATCHED THEN UPDATE ... WHEN NOT MATCHED THEN INSERT`——CDC（变更数据捕获）利器。
- **Z-ordering / Liquid Clustering**：对多列重排数据（如把 (user_id, date) 联合聚簇），让查询跳过无关文件（data skipping），大幅加速多维查询。

## 四、平台架构：Workspace、Cluster 与 Runtime

Databricks 平台的核心组件：

- **Workspace**：Web UI，管理 notebooks、作业（Jobs）、模型、数据集。团队协作（notebook 类似 Jupyter，支持 Python/SQL/Scala/R）。
- **Cluster**：计算资源。类型：①**All-Purpose Cluster**（交互分析，多人共享）；②**Job Cluster**（定时作业，单作业用完即销）；③**Serverless**（按查询计费，无固定集群）。底层是云 VM（AWS/Azure/GCP），由 Databricks 管理。
- **Databricks Runtime**：装在 cluster 上的「Spark 发行版」——开源 Spark + 自研优化（Photon/自适应查询/IO 加速）+ 预装 ML/AI 库（MLflow/PyTorch/XGBoost/Hugging Face）+ GPU 驱动。版本号（如 Runtime 16.3 LTS）对应 Spark 版本 + 增量。
- **Unity Catalog**：统一的**元数据 + 权限治理**层——管理数据库/表/视图/模型/文件，统一行/列级权限，审计日志。取代早期 Hive Metastore 的碎片化权限。
- **Delta Lake**：默认存储格式（建表默认是 Delta 表），也可读写 Parquet/JSON/CSV。

## 五、与开源 Spark 的关系

Databricks 与开源 Spark 的关系是「**商业化发行版 + 闭源增强**」：

- **开源贡献**：Databricks 是 Spark 最大的贡献者（创始团队在公司），持续把改进回馈开源（Spark 核心仍开源 Apache 2.0）。
- **闭源增强**：Photon（执行引擎）、部分 Delta Lake 优化（如 Liquid Clustering 在 Databricks 版先发）、Unity Catalog 的托管版——这些是 Databricks 商业化壁垒，开源版没有或滞后。
- **Databricks Runtime = Spark + 增量**：比开源 Spark 更快（Photon）、更稳（已验证的 ML/AI 库组合）、更省心（无运维）。代价是计费 + 厂商锁定。

所以「我用开源 Spark」与「我用 Databricks」的区别：前者自建集群、JVM 执行、需自己装 ML 库；后者托管 + Photon 加速 + 一体化 ML/AI 平台 + Delta 深度集成。

## 下一步

理解了 Databricks 的总览后，下一步深入两个核心——[Lakehouse 平台：Delta Lake 与 Photon](./guide-line/lakehouse-platform)（事务日志/MVCC/Photon 向量化）与 [集成：MLflow、Spark 商业化与开源对比](./guide-line/integration)（MLflow 四件套/Serverless/与 Snowflake 对照）。
