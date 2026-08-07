---
layout: doc
outline: [2, 3]
---

# GUI 功能与多数据库支持：对象设计、SQL 编辑与连接

> 基于 Navicat 17 · 核于 2026-08

## 速查

- **对象设计器（Object Designer）**：可视化建/改表——网格定义字段（名/类型/长度/非空/默认/注释）、主键、外键、索引、唯一约束、CHECK 约束。改完自动生成 ALTER DDL，可在「SQL 预览」查看底层原生语句。比手写 DDL 快且少错。
- **视图/存储过程/函数/触发器**：可视化创建与编辑。存储过程/函数支持参数定义、过程体编辑、调试（部分数据库支持 PL/SQL 调试器）。触发器绑定表事件（BEFORE/AFTER INSERT/UPDATE/DELETE）。
- **SQL 编辑器（Query Editor）**：语法高亮（按数据库方言着色）、智能补全（表/列/函数/关键字）、代码格式化（SQL 美化，统一缩进大小写）、错误检查、多标签、运行选中、运行全部、结果分页。**查询构建器（Query Builder）** 可视化拖拽表、连关联、勾字段、设条件，自动生成 SQL。
- **查询创建工具（Query Creator）**：Navicat 16/17 引入的低门槛查询构建——填表式界面选表、选字段、设条件、设排序，完全不写 SQL 也能出复杂查询。
- **ER 图（ER Diagram）**：用实体（表）+ 关系（外键）画数据模型。支持**逆向工程**（从已有库生成 ER 图，自动识别外键关系）与**正向工程**（画 ER 图后生成建表 DDL）。适合数据库设计与文档化。
- **数据网格（Data Grid / Viewer）**：查看表数据，支持过滤、排序、分页、列宽自定义、BLOB（图片/文件）预览与上传、外键关联跳转（点外键值跳到关联表的对应行）、表单视图（一行一页详细编辑）。编辑后自动生成 UPDATE/INSERT/DELETE。
- **SSH/SSL 隧道**：连接配置里设 SSH 主机（跳板机）+ 认证（密码/密钥），Navicat 先 SSH 到跳板机再连内网数据库——直连内网库无需额外工具。SSL 选项支持证书认证加密传输。
- **连接管理（Connection Manager）**：把多个数据库连接分组管理（虚拟分组），连接配置可导出导入、同步到 Navicat Cloud。支持连接颜色标记、最近使用、自动重连。
- **支持的数据库矩阵**：MySQL、MariaDB、PostgreSQL、Oracle、SQL Server、SQLite、MongoDB、Redis、达梦（DM）、GaussDB、OceanBase（部分版本）、Amazon Redshift、Snowflake 等。Premium 全覆盖，单库版本（for X）只覆盖一种。

## 一、对象设计器：可视化建表与改表

Navicat 的对象设计器是它最常用的功能——用 GUI 替代手写 DDL：

```
表设计器（设计 users 表）
┌─────────────────────────────────────────────────┐
│ 字段名      类型          长度   非空  主键  注释  │
├─────────────────────────────────────────────────┤
│ id         BIGINT              ✓     ✓    主键  │
│ email      VARCHAR       255   ✓            邮箱 │
│ created_at TIMESTAMP           ✓            创建 │
└─────────────────────────────────────────────────┘
[主键] [外键] [索引] [唯一约束] [CHECK]  [SQL 预览]
```

- **字段网格**：填字段名、选类型（下拉，按数据库方言给选项）、设长度、勾非空、勾主键、写注释。改完点保存自动生成并执行 DDL。
- **外键/索引/约束标签页**：可视化定义外键关系（选关联表与列、ON DELETE/UPDATE 动作）、索引（选列、ASC/DESC、唯一）、CHECK 约束（表达式）。
- **SQL 预览**：所有可视化操作底层都生成原生 DDL（如 `ALTER TABLE users ADD COLUMN ...`），可预览、复制、修改后执行——让你既享受可视化又保留对 SQL 的控制。
- **DDL 与 GUI 双向**：可视化改表会生成 ALTER，手动改 SQL 也会反映到 GUI——两种方式互通。

## 二、SQL 编辑器与查询构建器

### SQL 编辑器

功能完善的 SQL IDE：

- **语法高亮**：按所选数据库方言着色（MySQL/PG/Oracle 关键字、函数颜色不同）。
- **智能补全**：输入时弹出补全列表——表名、列名（按 schema 缓存）、函数、关键字、别名。`SELECT * FROM u` 会补全以 u 开头的表或别名 u 的列。
- **代码格式化（SQL 美化）**：一键统一缩进、关键字大小写、换行风格。团队协作时统一 SQL 风格。
- **错误检查**：实时语法检查，错误处标红波浪线。
- **运行**：运行全部、运行选中、运行到光标。结果在下方网格显示，支持多结果集。
- **查询历史**：自动保存执行过的 SQL，可搜索复用。

### 查询构建器（Query Builder）

不会写复杂 JOIN 的用户也能拼 SQL：

```
查询构建器（可视化拼 SELECT）
┌──────────────┐     ┌──────────────┐
│ users (u)    │──┐  │ orders (o)   │
│ ✓ id         │  │  │ ✓ id         │
│ ✓ name       │  └──│ ✓ user_id (FK)│  ← 拖 u.id 到 o.user_id 建关联
│ ✓ email      │     │ ✓ amount     │
└──────────────┘     └──────────────┘
条件：o.amount > 100 AND u.email LIKE '%@x.com'
排序：o.id DESC
→ 自动生成：
SELECT u.id, u.name, u.email, o.id, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.amount > 100 AND u.email LIKE '%@x.com'
ORDER BY o.id DESC;
```

- **可视化关联**：拖拽外键字段到关联表建立 JOIN，自动生成 ON 条件。
- **勾选字段**：在表图上勾选要查的字段，自动加到 SELECT。
- **条件/排序/分组**：填表式设 WHERE/ORDER BY/GROUP BY/HAVING。
- **生成 SQL**：所有操作实时生成 SQL，可在编辑器查看修改。

## 三、ER 图：数据建模与文档化

ER 图（Entity-Relationship Diagram）是 Navicat 的建模能力：

- **逆向工程**：连接已有数据库，一键生成 ER 图——自动把表画成实体、外键画成关系线。适合快速理解陌生库的结构。
- **正向工程**：在 ER 图上画新表与关系，一键生成建表 DDL 并执行——从设计直接落地。
- **逻辑/物理模型**：支持概念模型（独立于具体数据库）与物理模型（绑定具体数据库类型）。
- **导出**：ER 图可导出 PNG/SVG/PDF，作为数据库设计文档。
- **大库优化**：对表多的库，Navicat 自动布局 + 支持手动拖动整理，避免线交叉混乱。

## 四、数据网格与编辑

数据网格是日常查看和编辑数据的核心：

- **网格视图**：表数据以行列网格显示，支持列宽拖拽、列固定、列隐藏、排序（点列头）、过滤（自定义条件）。
- **编辑**：双击单元格直接编辑，回车提交。Navicat 自动生成对应的 UPDATE/INSERT/DELETE，可预览再提交（避免误操作）。
- **BLOB 处理**：图片字段（BLOB）可直接预览缩略图，文件字段可上传/下载。
- **外键跳转**：点外键值（如 orders.user_id），右键「在 users 表中打开」直接跳到关联行——快速追溯关联数据。
- **表单视图**：切换到一行一页的表单视图，适合字段多的表逐行查看编辑。

## 五、SSH/SSL 隧道与连接管理

### SSH 隧道（直连内网）

生产数据库通常在内网，不能直接从办公网访问。Navicat 内置 SSH 隧道：

```
你的电脑 ──SSH──► 跳板机（公网）──► 内网数据库
        Navicat 自动建立 SSH 隧道
```

- 在连接配置的「SSH」标签填跳板机主机、端口、用户名、认证（密码或私钥）。
- Navicat 先 SSH 到跳板机，再通过隧道连内网数据库——无需额外工具（如单独的 SSH 端口转发）。
- 支持多跳（Jump Host）和 SSH 配置文件读取。

### SSL 加密

连接配置的「SSL」标签启用 SSL，选 CA 证书、客户端证书、私钥——加密客户端到数据库的传输，防中间人。云数据库（如 RDS）常要求 SSL。

### 连接管理

- **虚拟分组**：把连接按项目/环境分组（如「生产」「测试」「开发」），颜色标记。
- **导入导出**：连接配置可导出为文件，换电脑或团队共享时导入。
- **Navicat Cloud**：连接配置、查询、虚拟分组同步到云端，多设备/多人共享。

## 六、支持的数据库矩阵详解

| 数据库 | Navicat 支持 | 备注 |
| --- | --- | --- |
| MySQL / MariaDB | 全部版本 | 最基础支持，对象/SQL/同步/备份全覆盖 |
| PostgreSQL | 全部版本 | 含 Greenplum、PPAS 等 |
| Oracle | 全部版本 | PL/SQL 调试（部分版本） |
| SQL Server | 全部版本 | 含 Azure SQL |
| SQLite | 全部版本 | 本地文件库 |
| MongoDB | Premium / for MongoDB | 文档库，聚合管道可视化 |
| Redis | Premium / for Redis | KV，键树浏览 |
| 达梦（DM） | Premium | 国产库 |
| GaussDB | Premium | 华为库 |
| OceanBase | 部分 | 兼容 MySQL 模式 |
| Redshift / Snowflake | Premium | 云数仓 |

**版本选择建议**：只用 MySQL 选 Navicat for MySQL（便宜）；多库混合选 Premium（全覆盖但贵）；个人轻量需求可考虑 Navicat Lite（已较少更新）或转 DBeaver CE。

## 交互演示

本叶无专门可视化。建议结合[数据管理：备份、传输与同步](./data-management)理解 Navicat 的运维级能力。

## 下一步

GUI 功能与多数据库支持讲完后，下一步深入[数据管理：备份、传输与同步](./data-management)——备份还原、数据传输、结构/数据同步的差异与算法、任务调度、Navicat Cloud 协同。
