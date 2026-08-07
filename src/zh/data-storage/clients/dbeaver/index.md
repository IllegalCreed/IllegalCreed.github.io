---
layout: doc
---

# DBeaver

**DBeaver** 是一款**免费开源的通用数据库管理工具**，由俄罗斯开发者 Sergei Kryzhnov 于 2010 年发起，目前由 DBeaver Corporation 维护，是**全球最受欢迎的跨库数据库客户端之一**。它的核心特色是**「一个工具连接 80+ 种数据库」**——基于 **JDBC（Java Database Connectivity）** 通用接口，社区版（Community Edition，CE）免费开源（Apache 2.0 许可），支持 MySQL、PostgreSQL、Oracle、SQL Server、SQLite、MariaDB、DB2、Sybase、Firebird 等几乎所有**JDBC 兼容的关系型数据库**；商业 PRO 版（PRO Edition，订阅付费）扩展支持 **NoSQL**（MongoDB、Redis、Cassandra）、**云数据库**（Redshift、Snowflake、BigQuery）、**文档型/时序/图数据库**（MongoDB、InfluxDB、Neo4j），并增加**数据安全**（脱敏、加密）、**AI 辅助**（SQL 生成）、**协作**（团队共享）等高级功能。DBeaver 的核心能力围绕**数据库开发与分析**：**SQL 编辑器**（语法高亮、自动补全、SQL 格式化、参数化查询、执行计划可视化）、**ER 图**（自动生成表关系图、逆向工程）、**数据编辑器**（网格编辑、过滤、BLOB 预览、数据生成）、**数据传输与导出**（CSV/JSON/Excel/SQL/HTML 多格式）、**元数据浏览**（按 schema/表/列树形浏览）。它基于 **Eclipse RCP** 框架，**跨平台**（Windows/macOS/Linux），用 Java 写就（需 JDK/JRE）。DBeaver 的定位是**「免费开源 + 跨库万能 + 插件生态」**——相比付费的 Navicat，DBeaver CE 免费且开源、插件可扩展、社区活跃；相比轻量的 TablePlus，DBeaver 功能更全但更重（Java 内存占用大）。理解 DBeaver 的核心是理解它**「JDBC 通用接口 + 社区开源 + PRO 商业化」**的双轨模式——这是它与 Navicat（纯商业）、TablePlus（轻量原生）的根本分野。

## 评价

**优点**

- **免费开源（CE）**：Apache 2.0 许可，无功能限制的跨库客户端，个人与团队零成本上手
- **80+ 数据库通吃**：基于 JDBC，几乎所有关系库 + PRO 版扩展 NoSQL/云库，跨库团队一份工具搞定
- **跨平台**：Windows/macOS/Linux 全支持（基于 Eclipse RCP，Java 写就）
- **插件生态**：社区活跃，扩展功能（Office 集成、Git、AI 辅助等）可插件安装
- **ER 图与数据生成**：逆向工程生成 ER 图、随机数据生成器，设计测试两不误

**缺点**

- **Java 内存占用大**：基于 Eclipse RCP，启动较慢、吃内存，比原生应用（TablePlus）重
- **高级功能要 PRO**：NoSQL/云库、数据脱敏、AI 辅助、团队协作等要订阅 PRO，CE 不含
- **UI 略显陈旧**：Eclipse 风格界面不如现代原生应用精致，新手上手有学习成本
- **数据同步/备份不如 Navicat 成熟**：CE 版的数据传输、结构同步基础够用但不如 Navicat 深度

## 本叶地图

- [入门](./getting-started) —— DBeaver 定义、JDBC 通用接口、CE/PRO 双轨、80+ 数据库、跨平台、与 Navicat/TablePlus 对比
- [社区版与 PRO 版](./guide-line/community-and-pro) —— CE 免费开源能力、PRO 扩展（NoSQL/云库/安全/AI）、订阅模式、选型建议
- [功能与 ER 图：SQL 编辑器、数据生成器、跨平台](./guide-line/features-and-er) —— SQL 编辑器、ER 图、数据生成器、元数据浏览、跨平台架构
- [参考](./reference) —— CE/PRO 功能矩阵、80+ 数据库清单、与 Navicat/TablePlus/DataGrip 对比、易错点清单

## 幻灯片地址

<a href="/SlideStack/dbeaver-slide/" target="_blank">DBeaver</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=DBeaver" target="_blank" rel="noopener noreferrer">DBeaver 测试题</a>
