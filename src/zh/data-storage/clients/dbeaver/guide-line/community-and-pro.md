---
layout: doc
outline: [2, 3]
---

# 社区版与 PRO 版：免费开源与商业增值

> 基于 DBeaver 24.x · 核于 2026-08

## 速查

- **CE（Community Edition）免费开源**：Apache 2.0 许可，无功能限制的核心工具。支持所有 JDBC 兼容的关系库（MySQL/PG/Oracle/SQL Server/SQLite 等 80+），含 SQL 编辑器、ER 图、数据编辑、导出、元数据浏览、数据生成器。**个人与团队零成本上手**。
- **CE 的能力边界**：CE 只支持 JDBC 关系库——**原生 NoSQL（MongoDB/Redis/Cassandra）和专用云库（Redshift/Snowflake/BigQuery）不在 CE**，因为它们不走 JDBC 标准接口。要用这些库需 PRO。
- **PRO（PRO Edition）订阅付费**：在 CE 基础上扩展 ①**NoSQL 与文档库**（MongoDB、Redis、Cassandra、Apache Hive）；②**云数据仓库**（Redshift、Snowflake、BigQuery、Databricks）；③**时序与图库**（InfluxDB、Neo4j、TimescaleDB）；④**数据安全**（字段脱敏、连接加密、审计日志、SSH 隧道增强）；⑤**AI 辅助**（自然语言转 SQL、SQL 解释、智能补全）；⑥**Office 集成**（直接导 Excel/Word 带格式）；⑦**团队协作**（共享连接配置、查询库、数据模型）。
- **双轨模式（开源核心 + 商业增值）**：CE 保持免费开源普及，PRO 走订阅养开发团队。这是 GitLab CE/EE、VS Code（核心免费 + 商业服务）同款模式——兼顾开源理想与商业可持续。
- **订阅模式**：PRO 按年订阅，分个人/团队/企业版，价格递增（个人约几十美元/年，企业按席位）。提供试用。
- **CE 够用的场景**：只用关系库（MySQL/PG/Oracle 等）做日常开发、查询、ER 图、导出——CE 完全够，不必买 PRO。
- **需要 PRO 的场景**：①要连 NoSQL/云数仓；②要数据脱敏/审计（合规）；③要 AI 辅助写 SQL；④要团队共享配置与查询；⑤要直接导出 Office 格式。
- **插件生态**：CE 支持社区插件（如 Office 集成试用版、主题、Git 集成）；PRO 含商业插件与官方支持。

## 一、CE：免费开源的核心能力

CE 是 DBeaver 的基石，免费且功能完整：

### CE 支持的关系库（部分）

| 类别 | 数据库 |
| --- | --- |
| 主流开源 | MySQL、PostgreSQL、MariaDB、SQLite |
| 主流商业 | Oracle、SQL Server、DB2、Sybase |
| 分析型 | Greenplum、Vertica、Teradata、Netezza、Presto/Trino |
| 嵌入式 | H2、HSQLDB、Derby |
| 其他 | Firebird、Informix、Ingress、Phoenix、CockroachDB、ClickHouse（JDBC） |

> **关键**：这些都是 **JDBC 兼容**的关系库。CE 通过 JDBC 驱动连接，操作界面统一。

### CE 核心功能

- **SQL 编辑器**：高亮、补全、格式化、错误检查、执行计划可视化、多标签、查询历史、参数化查询。
- **ER 图**：逆向工程从已有库生成 ER 图，自动识别外键关系，可布局与导出。
- **数据编辑器**：网格查看编辑、过滤排序、BLOB 预览、外键跳转、表单视图。
- **数据导出**：CSV、JSON、SQL、HTML、XML、Markdown（PRO 加 Excel/Word 带格式）。
- **数据传输**：在 JDBC 关系库之间迁移数据（同类型或跨类型）。
- **元数据浏览**：树形浏览 schema/表/列/索引/约束/视图/存储过程，看 DDL。
- **数据生成器**：按字段类型生成随机测试数据。
- **连接管理**：多连接、分组、SSH 隧道（基础）、连接颜色标记。

### CE 的边界

- **无原生 NoSQL**：MongoDB/Redis/Cassandra 等非 JDBC 库，CE 不支持（连不上）。
- **无云数仓专用支持**：Redshift/Snowflake/BigQuery 虽部分有 JDBC，但完整支持（含认证、元数据）在 PRO。
- **无数据脱敏/审计**：合规场景要 PRO。
- **无 AI 辅助**：自然语言转 SQL 要 PRO。
- **无团队协作**：共享配置/查询要 PRO。

## 二、PRO：商业增值能力

PRO 在 CE 基础上扩展，针对企业与重度用户：

### 1. NoSQL 与文档库

- **MongoDB**：文档库，支持聚合管道可视化、文档树浏览、JSON 编辑。
- **Redis**：KV 缓存，键树浏览、命令行操作。
- **Cassandra**：宽列库，CQL 编辑、分区键识别。
- **Apache Hive**：Hadoop 数仓，HiveQL 编辑。

### 2. 云数据仓库

- **Amazon Redshift**：AWS 数仓。
- **Snowflake**：多云数仓。
- **Google BigQuery**：GCP 数仓。
- **Databricks**：Lakehouse。

这些云库认证复杂（OAuth/Service Account）、元数据特殊，PRO 提供原生集成。

### 3. 时序与图库

- **InfluxDB**：时序数据库，时序查询。
- **Neo4j**：图数据库，Cypher 查询、图可视化。
- **TimescaleDB**：PG 时序扩展。

### 4. 数据安全（合规场景）

- **字段脱敏**：对敏感字段（手机号、身份证）脱敏显示，保护隐私。
- **连接加密**：增强的 SSL/SSH 隧道、凭证加密存储。
- **审计日志**：记录谁在何时执行了什么 SQL，合规审计。
- **权限控制**：团队内限制谁能看哪些连接/数据。

### 5. AI 辅助

- **自然语言转 SQL**：用自然语言描述需求（「查最近 7 天注册的用户」），AI 生成 SQL。
- **SQL 解释**：选中复杂 SQL，AI 用自然语言解释它做什么。
- **智能补全**：基于上下文与 schema 的更智能补全。

### 6. Office 集成

- 直接把查询结果导出为 **Excel（.xlsx）带格式**（列宽、样式、公式）或 **Word（.docx）**，省去手动处理。
- CE 的 CSV 导出要 Excel 二次处理。

### 7. 团队协作

- **共享连接配置**：团队统一管理数据库连接（含凭证加密）。
- **共享查询库**：团队 SQL 仓库，复用与版本管理。
- **共享数据模型**：ER 图与元数据团队共享。

## 三、订阅模式与定价

PRO 是年度订阅：

| 版本 | 适用 | 价格区间（年） |
| --- | --- | --- |
| **PRO Personal** | 个人开发者 | 低（约几十美元/年） |
| **PRO Team** | 小团队（5+ 席位） | 中（按席位） |
| **PRO Enterprise** | 企业（含 SSO/审计/优先支持） | 高（按需报价） |

- **试用**：PRO 提供 30 天全功能试用。
- **学生/教育/开源项目**：有免费或折扣许可。
- **续费**：订阅含版本升级与官方支持；停止订阅则回退到 CE（已保存的连接与查询仍在，PRO 功能不可用）。

## 四、选型建议：CE vs PRO vs 其他

| 场景 | 推荐 |
| --- | --- |
| 只用关系库（MySQL/PG/Oracle），个人或小团队，预算敏感 | **DBeaver CE**（免费够用） |
| 要连 MongoDB/Redis/Cassandra/Redshift/Snowflake/BigQuery | **DBeaver PRO** |
| 要数据脱敏/审计（金融/医疗合规） | **DBeaver PRO** |
| 要 AI 辅助写 SQL | **DBeaver PRO** 或 DataGrip |
| 重度企业需要深度数据同步/备份调度/跨库传输 | **Navicat Premium**（付费但更成熟） |
| 轻量日常、Mac 原生体验 | **TablePlus** |
| JetBrains 生态用户 | **DataGrip** |

## 五、CE 与 PRO 的技术差异

- **驱动层**：CE 只用 JDBC 驱动；PRO 加了 NoSQL/云库的专用驱动（非 JDBC）。
- **插件**：CE 的社区插件免费；PRO 含商业插件（Office、AI、安全）。
- **架构**：两者都基于 Eclipse RCP，PRO 是 CE + 商业插件包的发行版。
- **数据兼容**：CE 与 PRO 的连接配置、查询、ER 图**互通**——从 CE 升 PRO 无需迁移数据。

## 交互演示

本叶无专门可视化。建议结合[功能与 ER 图](./features-and-er)理解 DBeaver 的 SQL 编辑器、ER 图、数据生成器与跨平台架构。

## 下一步

社区版与 PRO 版讲完后，下一步深入[功能与 ER 图：SQL 编辑器、数据生成器、跨平台](./features-and-er)——SQL 编辑器细节、ER 图逆向工程、数据生成器规则、Eclipse RCP 跨平台架构。
