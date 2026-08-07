---
layout: doc
---

# dbt

**dbt（data build tool）** 是一个**纯 SQL 的数据转换层工具**——它把软件工程的最佳实践（版本控制、模块化、测试、文档、CI/CD）引入数据转换，让数据分析师/分析工程师用 SQL 写出可维护、可测试、可复用的转换流水线（transformation pipeline）。dbt 的核心定位是「**现代数据栈（Modern Data Stack）的转换层**」——它不存储数据、不计算数据（计算交给底层仓库 Snowflake/BigQuery/Databricks/PostgreSQL），只负责**编排 SQL 转换**：把原始数据（source 表）经过一系列 SQL **model**（带 `SELECT` 的 `.sql` 文件）加工成分析就绪的派生表，并自动构建 **DAG 依赖关系**、跑**测试**、生成**文档**。理解 dbt 的全部考点围绕五个核心展开：①**model**（一个 SELECT 即一个模型，是 dbt 的基本单元，物化为 table/view/incremental/ephemeral）；②**source 与 ref**（声明上游数据源 source、用 ref() 引用其他 model 构成 DAG）；③**test**（schema/data test 保证数据质量，如 not_null/unique/accepted_values/relationships）；④**macro 与 Jinja**（用 Jinja 模板写可复用 SQL 逻辑，macro 是参数化 SQL 函数）；⑤**增量模型（incremental）**（只处理新数据而非全量重算，节省仓库计算成本）。本叶是批处理与转换章的转换层视角——与 Spark（计算引擎）、Databricks（平台）形成对照：Spark/数仓负责「算」，dbt 负责「怎么用 SQL 编排算」。

## 评价

**优点**

- **SQL 优先**：分析师用熟悉的 SQL 写转换，无需学 Python/Spark，降低数据工程门槛
- **软件工程化**：版本控制（Git）、模块化（model/macro）、测试（test）、文档（auto docs）、CI/CD，让 SQL 转换具备工程严谨性
- **自动 DAG**：ref() 自动解析依赖，dbt 构建依赖图，按拓扑序执行，无需手动编排
- **仓库原生计算**：dbt 编译 SQL 推到数仓（Snowflake/BigQuery/Databricks）执行，复用数仓库算力与安全，无需独立计算集群
- **生态成熟**：现代数据栈核心组件，与 Snowflake/BigQuery/Databricks/Looker/Census 等深度集成

**缺点**

- **只做转换不做 ETL 的「E/L」**：dbt 是 T（Transform），不做 E（Extract 抽取）和 L（Load 加载）——抽取/加载要 Fivetran/Airbyte 等工具
- **依赖仓库能力**：dbt 性能受底层数仓限制，复杂转换（递归 CTE、窗口）靠数仓 SQL 引擎
- **非流式**：dbt 是批处理（定时 `dbt run`），实时场景需配合 Flink/Spark Streaming
- **大量 model 管理复杂**：大型项目数百个 model，DAG 复杂，需纪律（命名约定、分层）避免意大利面

## 本叶地图

- [入门](./getting-started) —— dbt 定位与「T in ELT」、model 与 ref/source、物化方式（table/view/incremental/ephemeral）、DAG 依赖、与 Spark/数仓的关系
- [SQL 转换：model、source、test、macro 与增量](./guide-line/sql-transformation) —— model 物化策略、source/ref/YAML 声明、schema/data test、Jinja macro 复用、增量模型（incremental）策略
- [dbt Core vs Cloud、现代数据栈集成](./guide-line/core-vs-cloud) —— dbt Core（开源 CLI）vs dbt Cloud（托管 + IDE + 调度）、与现代数据栈（Snowflake/BigQuery/Databricks/Fivetran/Looker）集成、与 Spark/数据工程师分工
- [参考](./reference) —— model 物化速查、test 类型、macro 模式、materialization 配置、dbt Core vs Cloud 对比、易错点

## 幻灯片地址

<a href="/SlideStack/dbt-slide/" target="_blank">dbt</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=dbt" target="_blank" rel="noopener noreferrer">dbt 测试题</a>
