---
layout: doc
outline: [2, 3]
---

# 参考：Delta Lake、Photon、MLflow 速查与选型

> 基于 Databricks Runtime 16 / Delta Lake 3.x / MLflow 3.x · 核于 2026-08

## 速查

- **Databricks 定位**：Spark 创始团队创立的云数据平台，Lakehouse 范式代表，整合 Spark + Delta Lake + Photon + MLflow。
- **Lakehouse**：数据湖（开放低成本）+ 数据仓库（事务与查询性能）的融合，一份数据服务 BI/ML/AI。
- **Delta Lake**：基于 Parquet 的事务存储层。事务日志 `_delta_log/` + ACID + MVCC + schema 约束 + time travel + merge + Z-order。
- **Photon**：C++ 原生向量化执行引擎，闭源，比开源 Spark 快数倍，商业化核心壁垒。
- **MLflow**：开源 ML 生命周期四件套——Tracking / Projects / Models / Model Registry。
- **Unity Catalog**：统一元数据 + 行列级权限 + 审计日志，取代 Hive Metastore。
- **Databricks Runtime**：开源 Spark + Photon + 自适应优化 + Delta + ML/AI 库的发行版。
- **计费**：All-Purpose（高）/ Job（低）/ Serverless（按查询）。DBU 为单位。
- **vs Snowflake**：Databricks 开放格式 + ML 强；Snowflake 闭源 + SQL 数仓 + 数据共享强。
- **vs 开源 Spark**：Databricks 省心快但计费 + Photon 锁定；开源零费但需自运维、无 Photon。

## 一、Delta Lake 特性速查

| 特性 | 说明 | 命令/语法 |
| --- | --- | --- |
| ACID | 原子提交，事务日志保证 | 自动（每次写即一次 commit） |
| MVCC | 多版本快照读，读写不互斥 | 自动 |
| time travel | 查历史版本 | `VERSION AS OF n` / `TIMESTAMP AS OF 'ts'` |
| schema 约束 | 拒绝不匹配数据 | 自动；`mergeSchema=true` 演进 |
| merge/upsert | 按 key 合并 | `MERGE INTO ... WHEN MATCHED THEN UPDATE ...` |
| OPTIMIZE | 合并小文件 + Z-order | `OPTIMIZE table ZORDER BY (a,b)` |
| VACUUM | 清理旧文件释放空间 | `VACUUM table RETAIN 168 HOURS` |
| Liquid Clustering | 流式自动聚簇（Databricks 优先） | `CLUSTER BY (a,b)` 建表时声明 |

## 二、Photon 性能对比

| 维度 | 开源 Spark（JVM） | Photon（C++） |
| --- | --- | --- |
| 语言 | Scala/Java | **C++ 原生** |
| 执行 | 行/对象 | **向量化（列批量 SIMD）** |
| GC | 有（停顿） | **无** |
| 代码生成 | JVM 字节码 | **C++ 编译** |
| 性能 | 基线 | **快数倍（部分场景 10x+）** |
| 开源 | 是 | **否（Databricks 专有）** |

## 三、MLflow API 速查

```python
import mlflow

# Tracking
mlflow.set_experiment("exp")
with mlflow.start_run(run_name="v1"):
    mlflow.log_params({"lr": 0.01})
    mlflow.log_metric("auc", 0.92)
    mlflow.sklearn.log_model(model, "model", registered_model_name="fraud")

# 加载模型（按 stage）
import mlflow.sklearn
model = mlflow.sklearn.load_model("models:/fraud/Production")

# Model Registry 操作（CLI / UI）
# mlflow models serve -m models:/fraud/Production -p 5000
```

| 组件 | API |
| --- | --- |
| Tracking | `start_run` / `log_params` / `log_metrics` / `log_artifacts` / `autolog` |
| Projects | `mlflow run <git>` / `MLproject` 文件 |
| Models | `log_model` / `save_model` / `load_model`（flavor） / `models serve` |
| Registry | `register_model` / stage（Staging/Production/Archived）/ 审批 |

## 四、Databricks vs 开源 Spark vs Snowflake 对比

| 维度 | Databricks | 开源 Spark | Snowflake |
| --- | --- | --- | --- |
| 计算 | Spark + **Photon** | Spark（JVM） | 专用虚拟仓库 |
| 存储 | 对象存储 + **Delta（开放）** | 任意（自管） | **闭源**格式 |
| 性能 | **快（Photon）** | 基线 | 快（专用） |
| ML/AI | **强**（MLflow + 深度学习 + GenAI） | 中（MLlib） | 中（Snowpark） |
| 运维 | 托管 + Serverless | **自运维** | 托管 |
| 成本 | DBU 计费（许可费） | 只付云资源（零许可） | 仓库计费 |
| 锁定 | Photon 锁定（Delta 开放） | 无 | 闭源锁定 |
| 适用 | 企业 + ML/AI + 跨团队 | 预算敏感 + 自建 | 纯 SQL 数仓 + BI |

## 五、易错点清单

- **「Delta Lake 就是 Parquet」**：错。Delta = Parquet 文件 + 事务日志（_delta_log/）。无日志的 Parquet 不是 Delta 表。
- **「对象存储原生支持 ACID」**：错。S3/ADLS 本身无事务，Delta Lake 用事务日志 + 原子操作在文件系统之上模拟 ACID。
- **「Photon 是开源的」**：错。Photon 是 Databricks 闭源专有，开源 Spark 没有，是商业化核心壁垒。
- **「Databricks 只能跑 Spark」**：错。Databricks 还有 SQL Warehouse（数仓查询，Photon 加速）、MLflow、GenAI（Mosaic AI），不只是 Spark。
- **「time travel 永久保留」**：错。VACUUM 会清旧版本，默认保留 7 天（可配），超过的版本不可回溯。
- **「MLflow 只能用于 Databricks」**：错。MLflow 是开源（Apache 2.0），可自部署，与 Databricks 是「开源 + 深度集成」关系。
- **「Lakehouse 完全取代数据仓库」**：错。Lakehouse 适合 BI/ML/AI 统一场景；纯 OLAP/重 BI 专用数仓（Snowflake/ClickHouse）仍有性能与生态优势。
- **「OPTIMIZE 频繁越好」**：错。OPTIMIZE 重写文件有成本，按数据写入频率调（如每天一次）。
- **「Z-order 对所有列都有效」**：错。Z-order 只对查询带过滤的高基数列有效，低基数列（如布尔）聚簇意义不大。
- **「Delta Lake 与 Iceberg/Hudi 完全等价」**：概念类似（都是湖上事务层），但生态与细节有差异——Delta 由 Databricks 主导、Iceberg 由 Netflix/Apache、Hudi 由 Uber。功能趋同但 API/性能有别。
- **「Serverless 一定比固定集群便宜」**：错。Serverless 适合突发/不规则负载；高稳定负载用固定 Job Cluster 可能更省。

## 六、进阶方向（链接其他叶）

- [Spark](../spark/) —— Databricks Runtime 的底座，RDD/DataFrame/SQL/MLlib
- [Flink](../../stream/flink/) —— 流处理对照，Databricks 用 Structured Streaming（微批）
- [dbt](../dbt/) —— SQL 转换层，可与 Databricks SQL Warehouse 集成

## 权威链接

- [Databricks 官方文档](https://docs.databricks.com/)
- [Delta Lake 文档](https://docs.delta.io/)
- [MLflow 官方文档](https://mlflow.org/docs/latest/)
- [Photon 说明](https://www.databricks.com/glossary/photon-engine)
- [Unity Catalog 文档](https://docs.databricks.com/data-governance/unity-catalog/)
- 本站幻灯片：<a href="/SlideStack/databricks-slide/" target="_blank">Databricks</a>
