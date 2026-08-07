---
layout: doc
outline: [2, 3]
---

# 参考：版本矩阵、功能速查与客户端对比

> 基于 Navicat 17 · 核于 2026-08

## 速查

- **定义**：商业（付费）图形化数据库管理与开发工具，亚洲最受欢迎的数据库 GUI 之一。
- **核心特色**：一个客户端连接多种数据库（Premium 全覆盖），覆盖开发运维全流程。
- **六大功能**：对象管理、SQL 编辑器、数据编辑、备份还原、数据传输与同步、数据建模（ER 图）。
- **发行版**：for MySQL/PG/Oracle/SQL Server 等单库版（便宜）+ Premium 全家桶（多库，贵）。
- **高级能力**：SSH/SSL 隧道、查询构建器、ER 正向/逆向工程、结构/数据同步、定时任务调度、Navicat Cloud 协同。
- **付费模式**：永久授权（大版本）或年度订阅；个人/企业/学术授权；14 天试用。
- **亚洲受欢迎**：中文本地化好、国产库（达梦/GaussDB）支持早、企业普及、香港公司。
- **对比 DBeaver**：DBeaver CE 免费开源 80+ 库；Navicat 付费但同步/备份/建模/传输更成熟。
- **对比 TablePlus**：TablePlus 轻量原生、免费层够用；Navicat 功能全但重，适合重度企业用户。

## 一、Navicat 版本矩阵

| 版本 | 支持数据库 | 价格定位 | 适用 |
| --- | --- | --- | --- |
| **for MySQL** | MySQL、MariaDB | 低 | 只用 MySQL 系 |
| **for PostgreSQL** | PostgreSQL | 低 | 只用 PG |
| **for Oracle** | Oracle | 中 | Oracle 专精 |
| **for SQL Server** | SQL Server | 中 | SQL Server 专精 |
| **for SQLite** | SQLite | 低 | SQLite 单文件库 |
| **for MongoDB** | MongoDB | 中 | 文档库 |
| **for Redis** | Redis | 中 | KV 缓存 |
| **Premium** | **MySQL、PG、Oracle、SQL Server、SQLite、MongoDB、Redis、达梦、GaussDB 等** | 高 | **多库混合，企业首选** |
| **Data Modeler** | 多库（仅建模） | 中 | 专注 ER 建模 |
| **Navicat Cloud** | 协同服务 | 订阅 | 多设备/团队共享 |

## 二、功能速查表

| 功能 | 描述 | 版本要求 |
| --- | --- | --- |
| 对象设计器 | 可视化建/改表、视图、存储过程、触发器 | 全部 |
| SQL 编辑器 | 高亮、补全、格式化、错误检查 | 全部 |
| 查询构建器 | 可视化拖拽拼 SQL（JOIN/条件/排序） | 全部 |
| 数据网格 | 查看、过滤、排序、编辑、BLOB 预览 | 全部 |
| 备份还原 | 转 SQL/CSV/Excel/JSON，定时备份 | 全部 |
| 数据传输 | 跨库批量迁移（同/跨类型） | Premium/部分单库版 |
| 结构同步 | 对比表结构差异，生成 ALTER | Premium |
| 数据同步 | 按主键对比数据差异，增量同步 | Premium |
| ER 图 | 逆向/正向工程，建模文档化 | Premium/Data Modeler |
| 任务调度 | 批处理 + 定时触发，无人值守 | 全部 |
| SSH/SSL 隧道 | 直连内网，加密传输 | 全部 |
| Navicat Cloud | 配置/查询/模型云端协同 | 订阅 |
| 数据生成 | 按规则生成测试数据 | Premium |

## 三、四大客户端对比（Navicat / DBeaver / TablePlus / DataGrip）

| 维度 | Navicat | DBeaver（CE/PRO） | TablePlus | DataGrip（JetBrains） |
| --- | --- | --- | --- | --- |
| 价格 | 商业付费 | CE 免费/PRO 付费 | 免费层 + 付费 | 商业付费（订阅） |
| 开源 | 否 | CE 是 | 否 | 否 |
| 数据库数 | Premium 多库 | CE 80+ | 主流关系 + 部分 NoSQL | 多库（JDBC） |
| 数据同步/传输 | 强（成熟） | 基础（PRO） | 基础 | 基础 |
| ER 建模 | 强 | 有 | 弱 | 有 |
| 备份调度 | 强 | 基础 | 弱 | 基础 |
| UI 精致度 | 高 | 中 | 高（原生） | 高（IntelliJ 风格） |
| 体积 | 重 | 中 | 轻 | 重 |
| 跨平台 | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux |
| 适合 | 重度企业、多库 | 开源免费、跨库多 | 轻量日常、Mac | JetBrains 生态用户 |

## 四、连接配置速查（SSH 隧道）

```
连接配置（连内网 MySQL）：
  常规标签：
    主机名：内网 IP（如 10.0.0.5）   ← 内网地址，公网不可达
    端口：3306
    用户名：root
    密码：***
  SSH 标签：
    使用 SSH 隧道：✓
    主机名：跳板机公网 IP（如 1.2.3.4）
    端口：22
    用户名：jumpuser
    认证：密码 / 私钥（~/.ssh/id_rsa）
  SSL 标签（可选）：
    使用 SSL：✓（云数据库常要求）
    CA 证书 / 客户端证书 / 私钥
```

**流程**：Navicat 先 SSH 到跳板机（1.2.3.4），通过隧道连到内网 10.0.0.5:3306，全程加密。

## 五、易错点清单

- **「Navicat 是免费软件」**：错。Navicat 是**商业付费**软件（14 天试用后要购买授权）。免费的是 DBeaver CE。
- **「Navicat for MySQL 能连 PostgreSQL」**：错。for MySQL 只支持 MySQL/MariaDB；连 PG 要买 for PostgreSQL 或 Premium。
- **「数据传输和数据同步是一回事」**：错。数据传输是**全量搬运**（整库或按条件），数据同步是**按主键增量对齐差异**（只同步不同行）。
- **「结构同步会自动改生产库」**：部分错。结构同步会**生成 ALTER 脚本**，但默认要你**预览确认后执行**，不会静默改生产。生产环境务必先在测试库验证脚本。
- **「Navicat 是开源的可扩展」**：错。Navicat 闭源，无法自定义插件；要开源可扩展选 DBeaver CE（有插件生态）。
- **「Navicat Cloud 不安全，生产密码会泄露」**：部分对。Navicat Cloud 用 AES-256 加密存储密码，但敏感生产库密码是否上云要按公司安全策略评估，谨慎起见可不上云或用只读账号。
- **「跨类型数据传输（MySQL→PG）全自动无损」**：部分错。Navicat 自动做类型/方言转换，但复杂类型（如 MySQL 的 ENUM、存储过程）可能无法完美映射，要人工校验。
- **「ER 图逆向工程能 100% 还原外键关系」**：部分错。能识别**显式外键**，但应用层维护的隐式关系（无外键约束）无法识别，要手动补关系线。
- **「Navicat 比 DBeaver 一定更好」**：错。看需求——重度企业用户（多库 + 同步 + 备份调度）选 Navicat；开源免费/跨库多的选 DBeaver CE；轻量日常选 TablePlus。
- **「定时备份就万无一失」**：部分错。定时备份要配合**备份保留策略**（保留最近 N 个）+ **异地存储**（别和数据库同机），否则磁盘塞满或机器故障时备份也丢。

## 六、进阶方向（链接其他叶）

- [DBeaver](../dbeaver/) —— 开源免费的跨库客户端，Navicat 的主要免费替代
- [TablePlus](../tableplus/) —— 轻量原生客户端，Mac 用户的现代选择
- [MySQL / PostgreSQL](../../distributed-search/)（关系库）—— Navicat 管理的对象

## 权威链接

- [Navicat 官方网站](https://www.navicat.com/)
- [Navicat 产品对比](https://www.navicat.com/en/products)
- [Navicat 文档手册](https://docs.navicat.com/)
- [PremiumSoft CyberTech（开发公司）](https://www.navicat.com/en/company)
- 本站幻灯片：<a href="/SlideStack/navicat-slide/" target="_blank">Navicat</a>
