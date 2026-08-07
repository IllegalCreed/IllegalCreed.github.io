---
layout: doc
outline: [2, 3]
---

# 入门：原生应用、现代 UI 与多数据库

> 基于 TablePlus 5.x · 核于 2026-08

## 速查

- **定义**：TablePlus 是现代、轻量的**原生（native）图形化数据库客户端**，由多伦多 TablePlus Inc. 开发。主打「原生体验、现代 UI、快速响应」，是 Mac 用户与轻量日常开发者的热门选择。
- **原生应用（Native App）**：用各平台**原生技术栈**构建——macOS 用 Swift/Objective-C（Cocoa），Windows 用 C#（WPF），Linux 用原生。所以**启动快、占内存小、UI 贴合平台习惯**。区别于 Electron（如 VS Code，跨平台但重）或 Java/Eclipse（如 DBeaver，跨平台但重）。
- **支持数据库**：主流关系库（MySQL、PostgreSQL、SQLite、MariaDB、SQL Server、Oracle）+ 部分 NoSQL（Redis、MongoDB、Cassandra）+ 分析型（ClickHouse、Amazon Redshift、CockroachDB）。不同平台支持范围略有差异（Mac 版最全）。
- **免费层 + 付费订阅**：**免费层（Free）**有功能限制（连接数、标签页数、查询历史长度受限，无 SSH 隧道、快照、部分导出）；**Pro 订阅**（月/年/买断）解锁全部功能与无限量。
- **核心功能**：SQL 编辑器（高亮/补全/格式化/代码片段/错误检查）、数据编辑器（网格编辑/过滤排序/BLOB 预览/外键跳转/表单视图）、多连接多标签、SSH 隧道（Pro）、查询历史与代码片段、数据导出（CSV/SQL/JSON/Excel）、**快照（snapshot）回滚误改**。
- **快照（Snapshot）**：TablePlus 独特的安全特性——编辑数据前自动创建快照，误改（如误删、误更新）可一键回滚到快照点，避免灾难性数据丢失。
- **与 Navicat 对比**：Navicat 功能更全（数据同步、备份调度、ER 正向工程、跨库传输）但更重更贵；TablePlus 轻量原生、UI 现代、Mac 体验极佳，但高级运维功能弱。
- **与 DBeaver 对比**：DBeaver CE 免费开源、跨库更多（80+）但 Eclipse 重、UI 陈旧；TablePlus 原生快、UI 现代，但跨库少、闭源无插件生态。
- **与 DataGrip 对比**：DataGrip（JetBrains）商业订阅、IntelliJ 风格 UI 精致、SQL 重构强、与 IntelliJ 生态集成；TablePlus 更轻量、Mac 原生体验更好。DataGrip 在本叶对比中提及，不单独立叶（属 JetBrains IDE 生态）。
- **进阶顺序**：[原生应用与现代 UI](./guide-line/native-app-and-ui) → [功能与对比：免费层、DataGrip 与插件](./guide-line/features-and-comparison) → [参考](./reference)。

## 一、为什么有 TablePlus：原生轻量的痛点

数据库客户端市场长期被两类工具占据：①商业重工具（Navicat），功能全但体积大、启动慢、UI 老派；②开源跨平台工具（DBeaver），免费但基于 Java/Eclipse，启动慢、内存重、UI 是 Eclipse 风格不精致。许多开发者——尤其 Mac 用户——想要一个**原生、轻量、现代**的客户端：启动快、占资源少、UI 像原生 Mac/Win 应用一样精致流畅。

TablePlus 的设计选择是：**原生技术栈 + 现代 UI + 免费层**。

- **原生技术栈**：Mac 用 Swift/Cocoa，Win 用 C#/WPF——直接调平台原生控件，不经过 Electron/Java 中间层。启动秒级，内存几十 MB（vs DBeaver 几百 MB）。
- **现代 UI**：简洁精致，深色模式、毛玻璃效果（Mac）、流畅动画。视觉体验远超 Eclipse 风格。
- **免费层**：日常轻度使用免费够用，付费解锁高级与无限量——降低尝鲜门槛。

## 二、原生应用 vs Electron vs Java

理解 TablePlus 的「原生」要对比三种桌面应用技术：

| 技术 | 代表 | 原理 | 优势 | 劣势 |
| --- | --- | --- | --- | --- |
| **原生（Native）** | TablePlus、Things | 平台官方语言（Mac Swift、Win C#） | 启动快、内存小、UI 贴合平台 | 每平台单独开发，成本高 |
| **Electron** | VS Code、Slack | Chromium + Node.js 渲染网页 | 跨平台一份代码、Web 技术栈 | 重（带整个浏览器）、内存大 |
| **Java/Eclipse** | DBeaver、IDEA | JVM + SWT/Swing | 跨平台、生态成熟 | 启动慢、内存重、UI 非原生 |

TablePlus 选原生——所以快、轻、精致，但每个平台要单独开发（Mac/Win/Linux 版本是不同代码库）。这是它「原生」的代价与优势所在。

## 三、支持的数据库

TablePlus 覆盖主流开发场景（Mac 版最全）：

| 类别 | 数据库 |
| --- | --- |
| 主流关系库 | MySQL、PostgreSQL、SQLite、MariaDB、SQL Server、Oracle |
| NoSQL | Redis、MongoDB、Cassandra |
| 分析型 | ClickHouse、Amazon Redshift、CockroachDB |
| 其他 | Amazon DynamoDB（部分版本）、Snowflake（部分版本） |

- **跨库不如 DBeaver**：DBeaver CE 支持 80+，TablePlus 约十几种。冷门库（如 Informix、Firebird、DB2）TablePlus 不支持。
- **平台差异**：Mac 版支持最全，Windows 版次之，Linux 版相对少（因 Linux 桌面用户少）。选型前查官方支持矩阵。

## 四、核心功能概览

### SQL 编辑器

- 语法高亮（按方言）、智能补全（表/列/函数）、SQL 格式化、代码片段（snippet，保存复用常用 SQL）、错误检查。
- 多标签、运行选中/全部、查询历史。
- 比 DBeaver/Navicat 的 SQL 编辑器更轻快，但深度功能（如执行计划可视化）较弱。

### 数据编辑器

- 网格视图：过滤、排序、分页、列宽。
- BLOB 预览（图片/文件）、外键跳转、表单视图。
- 编辑后生成 UPDATE/INSERT/DELETE 可预览。

### 多连接多标签

- 同时连多个数据库、开多个标签页。免费层有连接数与标签数限制，Pro 无限。

### SSH 隧道（Pro）

- 连内网数据库：设 SSH 跳板机，TablePlus 先 SSH 再连内网库。免费层不含。

### 快照（Snapshot）

- **TablePlus 独特功能**：编辑数据前自动快照。误删、误改后可一键回滚到快照点，避免灾难。这是它区别于其他客户端的安全亮点。

### 查询历史与代码片段

- 自动保存查询历史（免费层长度受限）。代码片段保存常用 SQL 复用。

### 数据导出

- 导出为 CSV、SQL、JSON、Excel（部分格式 Pro）。

## 五、免费层 vs Pro 订阅

| 功能 | 免费层（Free） | Pro（订阅/买断） |
| --- | --- | --- |
| 价格 | 免费 | 月/年/买断 |
| 连接数 | 限制（如 2 个） | 无限 |
| 标签页数 | 限制 | 无限 |
| 查询历史长度 | 限制 | 无限 |
| SSH 隧道 | ❌ | ✅ |
| 快照（Snapshot） | ❌ | ✅ |
| 部分导出格式 | ❌ | ✅ |
| 多数据库 | ✅（基础） | ✅（全部） |

**选型**：轻度日常（一两个连接、简单查询）免费层够；重度（多连接、SSH 内网、要快照、要导出）买 Pro。

## 六、与 Navicat / DBeaver / DataGrip 对比

| 维度 | TablePlus | Navicat | DBeaver CE | DataGrip |
| --- | --- | --- | --- | --- |
| 价格 | 免费层 + 付费 | 商业付费 | 免费 | 商业订阅 |
| 开源 | 否 | 否 | 是 | 否 |
| 数据库数 | 约 15+ | Premium 多库 | 80+ | 多库（JDBC） |
| 原生体验 | **是（Swift/C#）** | 否（自绘） | 否（Eclipse） | 否（IntelliJ） |
| 启动/内存 | 快/轻 | 中/重 | 慢/重 | 慢/重 |
| UI 精致度 | 高（现代原生） | 高 | 中 | 高 |
| 数据同步/备份 | 基础 | 强 | 基础 | 基础 |
| 快照回滚 | ✅（独特） | ❌ | ❌ | ❌ |
| 插件生态 | 无 | 无 | 活跃 | 有（JetBrains） |
| 适合 | 轻量日常、Mac | 重度企业 | 开源免费 | JetBrains 用户 |

## 下一步

理解了 TablePlus 的原生轻量定位后，下一步深入两个核心——[原生应用与现代 UI](./guide-line/native-app-and-ui)（Swift/C# 原生技术栈、启动快省内存、UI 设计哲学、多数据库支持细节）与[功能与对比：免费层、DataGrip 与插件](./guide-line/features-and-comparison)（SQL 编辑器、快照、SSH 隧道、DataGrip 对比、免费层边界、插件生态）。
