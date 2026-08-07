---
layout: doc
---

# Navicat

**Navicat** 是一款**商业（付费）的图形化数据库管理与开发工具**，由香港 PremiumSoft 公司开发，是**亚洲地区最受欢迎的数据库 GUI**之一。它最大的特色是**一个客户端连接多种数据库**——单一界面支持 **MySQL、PostgreSQL、Oracle、SQL Server、SQLite、MariaDB、MongoDB、Redis、达梦（DM）** 等主流数据库（不同发行版覆盖不同数据库组合），让开发者无需为每种数据库装一个客户端。Navicat 的核心能力围绕**数据库开发与运维全流程**：**对象管理**（建表/视图/存储过程/触发器/函数，可视化设计表结构与外键关系）、**SQL 编辑器**（语法高亮、自动补全、代码格式化、SQL 美化、查询构建器可视化拼 SQL）、**数据可视化与编辑**（网格编辑、过滤排序、BLOB 预览、表单视图）、**数据传输与同步**（数据库之间批量迁移、结构同步、数据同步、对比差异生成同步脚本）、**备份与恢复**（定时备份、转储 SQL/CSV/Excel、还原）、**数据生成与建模**（数据字典、ER 图设计、正向/逆向工程生成 schema）。Navicat 还内置** SSH/SSL 隧道**（直连内网数据库）、**查询分析**（执行计划可视化）、**任务调度**（批处理、定时任务）、**云协同**（Navicat Cloud 同步连接配置与查询）。它的定位是**「付费但省时省力」的专业工具**——相比免费的 DBeaver，Navicat 在数据同步、备份调度、ER 建模、跨库传输等高级功能上更成熟、UI 更精致；相比轻量的 TablePlus，Navicat 功能更全但更重。理解 Navicat 的核心是理解它**「多数据库统一界面 + 全流程工具链 + 商业品质」**的定位——这是它与 DBeaver（开源免费）、TablePlus（轻量原生）的根本分野。

## 评价

**优点**

- **多数据库统一界面**：一套操作习惯通吃 MySQL/PG/Oracle/SQL Server/SQLite/MongoDB 等，无需为每种库学新工具
- **全流程工具链**：从建表、写 SQL、数据编辑、备份、同步、建模一站式，减少工具切换
- **数据同步与传输强**：结构/数据对比差异、生成同步脚本、跨库批量迁移，是企业级运维刚需
- **UI 精致、稳定性好**：商业软件的品质保证，对象设计器、ER 图、查询构建器交互成熟
- **SSH/SSL 隧道内置**：直连内网数据库无需额外配置跳板机

**缺点**

- **商业付费**：个人/企业授权费用高（按数据库类型分版本，全套不便宜），免费试用有限
- **体积较重**：相比轻量客户端（TablePlus）启动慢、占资源，简单查询有点「杀鸡用牛刀」
- **非开源**：无法自定义扩展，功能由厂商决定；社区插件生态不如 DBeaver
- **亚洲导向**：国际化做得好但在欧美的市场份额不如 DBeaver/DataGrip

## 本叶地图

- [入门](./getting-started) —— Navicat 定义、多数据库支持、核心功能（对象管理/SQL 编辑/数据编辑/备份/同步）、商业定位、与 DBeaver/TablePlus 对比
- [GUI 功能与多数据库支持](./guide-line/features-and-databases) —— 对象设计器、SQL 编辑器、查询构建器、ER 图、SSH 隧道、支持的数据库矩阵
- [数据管理：备份、传输与同步](./guide-line/data-management) —— 备份还原、数据传输、结构/数据同步、对比差异、任务调度、Navicat Cloud
- [参考](./reference) —— Navicat 版本矩阵、功能速查、与 DBeaver/TablePlus/DataGrip 对比、易错点清单

## 幻灯片地址

<a href="/SlideStack/navicat-slide/" target="_blank">Navicat</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Navicat" target="_blank" rel="noopener noreferrer">Navicat 测试题</a>
