---
layout: doc
outline: [2, 3]
---

# 入门：免费开源、跨库万能与 JDBC 通用接口

> 基于 DBeaver 24.x · 核于 2026-08

## 速查

- **定义**：DBeaver 是免费开源（CE）/ 订阅付费（PRO）的通用数据库管理工具，由 DBeaver Corporation 维护，全球最受欢迎的跨库数据库客户端之一。核心特色是「一个工具连接 80+ 种数据库」。
- **JDBC 通用接口**：DBeaver 基于 **JDBC（Java Database Connectivity）**——Java 标准的数据库连接接口。几乎所有关系库都提供 JDBC 驱动，DBeaver 用同一套界面操作它们，屏蔽方言差异。这是它「跨库万能」的技术基础。
- **社区版（CE）免费开源**：Apache 2.0 许可，无功能限制（基础功能全免费）。支持所有 JDBC 兼容的关系库（MySQL/PG/Oracle/SQL Server/SQLite 等），含 SQL 编辑器、ER 图、数据编辑、导出等核心能力。
- **PRO 版（订阅付费）扩展**：在 CE 基础上加 ①**NoSQL/云库**（MongoDB/Redis/Cassandra/Redshift/Snowflake/BigQuery）；②**数据安全**（脱敏、加密、审计）；③**AI 辅助**（自然语言生成 SQL）；④**Office 集成**（直接导 Excel/Word）；⑤**团队协作**（共享连接、查询、模型）。
- **80+ 数据库**：MySQL、PostgreSQL、Oracle、SQL Server、SQLite、MariaDB、DB2、Sybase、Firebird、Greenplum、H2、HSQLDB、Informix、Ingress、Netezza、Phoenix、Presto、Teradata、Vertica 等（CE）；MongoDB、Redis、Cassandra、Neo4j、InfluxDB、Redshift、Snowflake、BigQuery、OceanBase 等（PRO）。
- **跨平台**：基于 **Eclipse RCP** 框架，Windows/macOS/Linux 全支持。需 JDK/JRE（新版自带打包 JRE，无需单独装）。
- **核心功能**：SQL 编辑器（高亮/补全/格式化/执行计划）、ER 图（逆向工程）、数据编辑器（网格/BLOB/过滤）、数据传输与导出（CSV/JSON/Excel/SQL/HTML）、元数据树形浏览、数据生成器。
- **与 Navicat 对比**：Navicat 商业付费，数据同步/备份调度/跨库传输更成熟、UI 更精致；DBeaver CE 免费开源、跨库更多、插件可扩展，但 Java 内存重、UI 偏 Eclipse 风格。
- **与 TablePlus 对比**：TablePlus 轻量原生、UI 现代、启动快；DBeaver 功能更全（80+ 库）、免费开源，但更重（Java/Eclipse）。
- **与 DataGrip 对比**：DataGrip 是 JetBrains 商业付费（订阅），UI 是 IntelliJ 风格精致、重构强、与 IntelliJ 生态集成；DBeaver CE 免费开源、跨库更多。
- **进阶顺序**：[社区版与 PRO 版](./guide-line/community-and-pro) → [功能与 ER 图](./guide-line/features-and-er) → [参考](./reference)。

## 一、为什么有 DBeaver：跨库团队的痛点

数据库生态碎片化严重——一个团队可能同时用 MySQL（业务库）、PostgreSQL（分析库）、Oracle（遗留系统）、SQL Server（微软栈）、Redis（缓存）、MongoDB（文档）。每种库自带的客户端（mysql、psql、sqlplus、SSMS）界面与操作习惯各异，切换成本高。商业多库客户端（Navicat Premium）虽统一但付费且贵。

DBeaver 的设计选择是：**基于 JDBC 通用接口 + 免费开源 + 双轨（CE/PRO）**。

- **JDBC 通用**：Java 的 JDBC 是关系库的标准接口，几乎所有关系库都提供驱动。DBeaver 用一套界面操作所有 JDBC 库——开发者学一次，通吃所有库。
- **免费开源（CE）**：Apache 2.0 许可，个人与团队零成本。这让它在全球（尤其开源社区、初创公司、教育）普及极快。
- **PRO 商业化**：核心免费，但 NoSQL/云库、数据安全、AI 辅助等高级功能走 PRO 订阅——既保持开源普及，又有商业收入维持开发。这是「开源核心 + 商业增值」的双轨模式（类似 GitLab CE/EE）。

## 二、JDBC 通用接口：跨库的技术基础

JDBC（Java Database Connectivity）是 Java 标准的数据库连接接口，定义了 `Connection`、`Statement`、`ResultSet` 等抽象。各数据库厂商提供 JDBC 驱动实现这些接口。DBeaver 用 JDBC 操作所有库：

```
DBeaver 应用层（统一界面：SQL 编辑器、ER 图、数据网格）
    ↓ 调用 JDBC 标准接口
JDBC 接口层（Connection / Statement / ResultSet）
    ↓ 各厂商驱动实现
MySQL JDBC 驱动    PostgreSQL JDBC 驱动    Oracle JDBC 驱动    ...
    ↓
MySQL 数据库       PostgreSQL 数据库       Oracle 数据库
```

- **统一抽象**：DBeaver 不直接连数据库，而是通过 JDBC。换数据库只是换驱动与连接配置，界面操作一致。
- **方言适配**：虽然界面统一，但 DBeaver 知道每个库的方言（DDL 语法、系统视图、数据类型），在生成 SQL 时用对应方言。
- **驱动管理**：DBeaver 内置驱动管理器，首次连某库时自动下载对应 JDBC 驱动（Maven Central），无需手动找 jar。
- **局限**：JDBC 是关系库接口，**原生 NoSQL（MongoDB/Redis/Cassandra）不走 JDBC**——所以这些库在 PRO 版用专用驱动实现，CE 不支持。

## 三、CE 与 PRO 双轨

| 能力 | 社区版（CE） | PRO 版 |
| --- | --- | --- |
| 价格 | **免费**（Apache 2.0 开源） | 订阅付费（个人/团队/企业） |
| 关系库（JDBC） | ✅ 全部（MySQL/PG/Oracle/SQL Server 等 80+） | ✅ 全部 |
| NoSQL（MongoDB/Redis/Cassandra） | ❌ | ✅ |
| 云数仓（Redshift/Snowflake/BigQuery） | ❌ | ✅ |
| 时序/图库（InfluxDB/Neo4j） | ❌ | ✅ |
| SQL 编辑器 + ER 图 + 数据编辑 | ✅ | ✅ |
| 数据传输/导出 | ✅ 基础 | ✅ 增强（Office 直接导） |
| 数据脱敏/加密/审计 | ❌ | ✅ |
| AI 辅助（自然语言生成 SQL） | ❌ | ✅ |
| 团队协作（共享连接/查询/模型） | ❌ | ✅ |
| 插件生态 | ✅（社区） | ✅（含商业插件） |

**选型**：只用关系库且预算敏感 → CE 完全够；需要 NoSQL/云库/数据安全/AI/团队协作 → PRO 订阅。

## 四、核心功能概览

### SQL 编辑器

- 语法高亮（按数据库方言）、智能补全（表/列/函数）、SQL 格式化、错误检查。
- 多标签、运行选中/全部、参数化查询、查询历史。
- **执行计划可视化**：EXPLAIN 结果以树形/图形展示，分析查询性能。

### ER 图

- **逆向工程**：连已有库，自动生成 ER 图（表为实体、外键为关系）。
- 支持大库自动布局、手动调整、导出图片。

### 数据编辑器

- 网格视图：过滤、排序、分页、列宽。
- BLOB 预览（图片/文件）、外键关联跳转。
- 编辑后生成 UPDATE/INSERT/DELETE 可预览。

### 数据传输与导出

- 把查询结果或表数据导出为 CSV/JSON/Excel/SQL/HTML/XML/Markdown。
- 跨库数据迁移（同 JDBC 库之间）。
- PRO 版可直接导出为 Office 格式（带格式）。

### 元数据浏览

- 按「连接 → 数据库 → schema → 表 → 列」树形浏览。
- 查看表结构、索引、约束、外键、视图、存储过程、触发器。
- DDL 查看（看建表语句）。

### 数据生成器

- 按字段类型生成随机测试数据（姓名、邮箱、日期、数字、JSON）。
- 支持自定义规则、外键引用。

## 五、跨平台与 Eclipse RCP

DBeaver 基于 **Eclipse RCP**（Rich Client Platform）框架：

- **跨平台**：Eclipse RCP 是 Java 桌面框架，同一份代码跑 Windows/macOS/Linux。
- **插件架构**：Eclipse 的 OSGi 插件系统，功能以插件形式提供，可扩展。
- **JRE 依赖**：早期需用户装 JDK/JRE，新版（24.x）**自带打包 JRE**，开箱即用。
- **代价**：Java + Eclipse 启动较慢、内存占用大（动辄几百 MB），比原生应用（TablePlus）重。这是它的主要短板。

## 六、与 Navicat / TablePlus / DataGrip 对比

| 维度 | DBeaver CE/PRO | Navicat | TablePlus | DataGrip |
| --- | --- | --- | --- | --- |
| 价格 | CE 免费/PRO 订阅 | 商业付费 | 免费层 + 付费 | 商业订阅 |
| 开源 | CE 是（Apache 2.0） | 否 | 否 | 否 |
| 数据库数 | CE 80+ / PRO 加 NoSQL 云 | Premium 多库 | 主流关系 + 部分 NoSQL | 多库（JDBC） |
| 数据同步/传输 | 基础（PRO 增强） | 强（成熟） | 基础 | 基础 |
| ER 建模 | 有（逆向工程） | 强 | 弱 | 有 |
| UI 精致度 | 中（Eclipse 风格） | 高 | 高（原生） | 高（IntelliJ） |
| 体积 | 重（Java/Eclipse） | 重 | 轻 | 重 |
| 插件生态 | 活跃 | 无 | 无 | 有（JetBrains） |
| 适合 | 开源免费、跨库多 | 重度企业 | 轻量日常、Mac | JetBrains 用户 |

## 下一步

理解了 DBeaver 的 JDBC 通用接口与 CE/PRO 双轨后，下一步深入两个核心——[社区版与 PRO 版](./guide-line/community-and-pro)（CE 能力边界、PRO 扩展的 NoSQL/云库/安全/AI/协作、订阅模式）与[功能与 ER 图](./guide-line/features-and-er)（SQL 编辑器、ER 图、数据生成器、跨平台架构细节）。
