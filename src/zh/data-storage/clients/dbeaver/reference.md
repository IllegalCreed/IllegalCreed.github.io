---
layout: doc
outline: [2, 3]
---

# 参考：CE/PRO 矩阵、数据库清单与客户端对比

> 基于 DBeaver 24.x · 核于 2026-08

## 速查

- **定义**：免费开源（CE）/ 订阅付费（PRO）的通用数据库管理工具，基于 JDBC，全球最受欢迎的跨库客户端之一。
- **核心特色**：一个工具连 80+ 数据库（CE 关系库，PRO 加 NoSQL/云库），免费开源（CE Apache 2.0）。
- **技术基础**：JDBC 通用接口——屏蔽方言差异，一套界面操作所有 JDBC 关系库。
- **双轨**：CE 免费开源（关系库核心）+ PRO 订阅（NoSQL/云库/安全/AI/协作）。
- **核心功能**：SQL 编辑器、ER 图（逆向）、数据编辑器、数据生成器、数据传输导出、元数据浏览。
- **跨平台**：Eclipse RCP，Win/Mac/Linux，自带 JRE 开箱即用。
- **代价**：Java/Eclipse 启动慢、内存重、UI 偏 Eclipse 风格。
- **对比**：vs Navicat（免费 vs 付费，跨库多 vs 同步强）；vs TablePlus（功能全 vs 轻量原生）；vs DataGrip（免费 vs 订阅，Eclipse vs IntelliJ）。

## 一、CE vs PRO 功能矩阵

| 功能 | CE（免费开源） | PRO（订阅） |
| --- | --- | --- |
| 价格 | 免费（Apache 2.0） | 年订阅（个人/团队/企业） |
| 关系库（JDBC） | ✅ 80+ | ✅ 全部 |
| NoSQL（MongoDB/Redis/Cassandra） | ❌ | ✅ |
| 云数仓（Redshift/Snowflake/BigQuery） | ❌ | ✅ |
| 时序/图库（InfluxDB/Neo4j） | ❌ | ✅ |
| SQL 编辑器 | ✅ | ✅ |
| ER 图（逆向） | ✅ | ✅ |
| 数据编辑器 | ✅ | ✅ |
| 数据生成器 | ✅ | ✅ |
| 数据导出 CSV/JSON/SQL/HTML | ✅ | ✅ |
| 数据导出 Excel/Word（带格式） | ❌ | ✅ |
| 数据传输（跨库） | ✅ 基础 | ✅ 增强 |
| SSH 隧道 | ✅ 基础 | ✅ 增强 |
| 数据脱敏/加密/审计 | ❌ | ✅ |
| AI 辅助（NL→SQL） | ❌ | ✅ |
| 团队协作（共享配置/查询） | ❌ | ✅ |
| 插件生态 | ✅ 社区 | ✅ 含商业 |

## 二、支持的数据库清单（部分）

### CE（JDBC 关系库）

| 类别 | 数据库 |
| --- | --- |
| 主流开源 | MySQL、PostgreSQL、MariaDB、SQLite |
| 主流商业 | Oracle、SQL Server、DB2、Sybase |
| 分析型 | Greenplum、Vertica、Teradata、Netezza、Presto/Trino、ClickHouse（JDBC） |
| 嵌入式 | H2、HSQLDB、Derby |
| 其他 | Firebird、Informix、Ingress、Phoenix、CockroachDB、 YugabyteDB |

### PRO 增量

| 类别 | 数据库 |
| --- | --- |
| NoSQL/文档 | MongoDB、Redis、Cassandra、Apache Hive |
| 云数仓 | Amazon Redshift、Snowflake、Google BigQuery、Databricks |
| 时序/图 | InfluxDB、Neo4j、TimescaleDB |

## 三、四大客户端对比（DBeaver / Navicat / TablePlus / DataGrip）

| 维度 | DBeaver CE/PRO | Navicat | TablePlus | DataGrip |
| --- | --- | --- | --- | --- |
| 价格 | CE 免费/PRO 订阅 | 商业付费 | 免费层 + 付费 | 商业订阅 |
| 开源 | CE 是（Apache 2.0） | 否 | 否 | 否 |
| 数据库数 | CE 80+ / PRO 加 NoSQL | Premium 多库 | 主流关系 + 部分 NoSQL | 多库（JDBC） |
| 数据同步/传输 | 基础（PRO 增强） | 强（成熟） | 基础 | 基础 |
| ER 建模 | 有（逆向为主） | 强（含正向） | 弱 | 有 |
| 备份调度 | 基础 | 强 | 弱 | 基础 |
| UI 精致度 | 中（Eclipse 风格） | 高 | 高（原生） | 高（IntelliJ） |
| 体积 | 重（Java/Eclipse） | 重 | 轻 | 重 |
| 跨平台 | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux |
| 插件生态 | 活跃 | 无 | 无 | 有（JetBrains） |
| AI 辅助 | PRO 有 | 较弱 | 弱 | 有 |
| 适合 | 开源免费、跨库多 | 重度企业、多库 | 轻量日常、Mac | JetBrains 用户 |

## 四、SQL 编辑器能力速查

| 能力 | 描述 |
| --- | --- |
| 语法高亮 | 按数据库方言着色关键字/函数/字符串/注释 |
| 智能补全 | 表/列/函数/关键字/别名补全 |
| SQL 格式化 | 统一缩进、关键字大小写、换行（可配置规则） |
| 错误检查 | 实时语法检查，标红波浪线 |
| 参数化查询 | `:param`（命名）/ `${var}`（变量），运行时填值 |
| 执行计划 | EXPLAIN 树形/图形可视化，分析性能 |
| 多标签 | 同时开多个 SQL 标签 |
| 查询历史 | 自动保存执行过的 SQL |
| 运行选中/全部 | 选代码运行或整文件运行 |

## 五、数据生成器规则速查

| 字段类型 | 生成规则示例 |
| --- | --- |
| 整数 | 随机/序列/范围（1-100） |
| 字符串 | 随机/正则/常量/姓名/邮箱 |
| 日期 | 随机/范围（2020-01-01 至今） |
| 布尔 | 随机（按比例 true/false） |
| JSON | 随机 JSON 结构 |
| UUID | 随机 UUID |
| 外键 | 引用关联表已存在的 id |
| Lorem | 随机文本段落 |

## 六、易错点清单

- **「DBeaver 是纯付费软件」**：错。DBeaver **社区版（CE）免费开源**（Apache 2.0），只有 PRO 版订阅付费。CE 功能对关系库足够日常用。
- **「DBeaver CE 能连 MongoDB/Redis」**：错。CE 只支持 JDBC 关系库；MongoDB/Redis/Cassandra 等非 JDBC 库要 PRO 版。
- **「DBeaver 是原生应用，启动快省内存」**：错。DBeaver 基于 Eclipse RCP（Java），**启动慢、内存占用大**，比原生应用（TablePlus）重。
- **「DBeaver 的 ER 图能正向工程（画图建库）」**：部分错。DBeaver ER 主要做**逆向工程**（从库生成图），正向工程（画图生成 DDL）弱，不如 Navicat。
- **「DBeaver 比 Navicat 在所有方面都好」**：错。DBeaver 免费开源、跨库多；但数据同步、备份调度、跨库传输等深度功能 Navicat 更成熟。
- **「PRO 订阅停了就完全不能用」**：错。停订回退到 CE（连接、查询、ER 图都在），只是 PRO 功能（NoSQL/云库/AI/安全）不可用。
- **「DBeaver 只能在 Windows 用」**：错。基于 Eclipse RCP，跨平台——Windows/macOS/Linux 全支持。
- **「要先用 DBeaver 必须自己装 JDK」**：部分错。新版（24.x）**自带打包 JRE**，开箱即用；旧版或特殊定制版才需单独装。
- **「DBeaver 的数据传输能完全替代 Navicat 的数据同步」**：部分错。DBeaver 数据传输是基础（全量搬），按主键增量对齐的数据同步不如 Navicat 成熟。
- **「DBeaver CE 没有 ER 图和数据生成器」**：错。CE 含 ER 图（逆向工程）和数据生成器，这些是 CE 核心功能，不是 PRO 专属。

## 七、进阶方向（链接其他叶）

- [Navicat](../navicat/) —— 商业付费客户端，DBeaver 的主要商业替代
- [TablePlus](../tableplus/) —— 轻量原生客户端，DBeaver 的轻量替代
- [MySQL / PostgreSQL](../../distributed-search/)（关系库）—— DBeaver 管理的对象

## 权威链接

- [DBeaver 官方网站](https://dbeaver.io/)
- [DBeaver CE 下载（GitHub）](https://github.com/dbeaver/dbeaver)
- [DBeaver PRO 版](https://dbeaver.com/)
- [DBeaver 文档](https://github.com/dbeaver/dbeaver/wiki)
- 本站幻灯片：<a href="/SlideStack/dbeaver-slide/" target="_blank">DBeaver</a>
