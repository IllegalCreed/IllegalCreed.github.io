---
layout: doc
---

# TablePlus

**TablePlus** 是一款**现代、轻量的原生（native）图形化数据库客户端**，由 TablePlus Inc.（多伦多团队）开发，主打**「原生体验、现代 UI、快速响应」**。与基于 Electron 或 Java（如 DBeaver）的「跨平台但重」的客户端不同，TablePlus 用各平台**原生技术栈**构建——macOS 版用 Swift/Objective-C（Cocoa），Windows 版用 C#（WPF），Linux 版基于原生——所以**启动快、占内存小、UI 贴合平台习惯**（Mac 上像 Mac 应用，Win 上像 Win 应用）。它支持**主流关系型与部分 NoSQL 数据库**：MySQL、PostgreSQL、SQLite、Redis、MongoDB、Cassandra、SQL Server、Oracle、MariaDB、Amazon Redshift、CockroachDB、ClickHouse 等（不同平台支持范围略有差异）。TablePlus 采用**免费层 + 付费订阅**模式：免费层（Free）有功能限制（连接数、标签页数、查询历史长度受限），付费订阅（Pro，月/年/买断）解锁无限连接、多标签、SSH 隧道、快照、导出等全部功能。它的核心能力围绕**日常开发与查询**：**SQL 编辑器**（语法高亮、自动补全、SQL 格式化、代码片段、错误检查）、**数据编辑器**（网格编辑、过滤排序、BLOB 预览、外键跳转、表单视图）、**多连接多标签**、**SSH 隧道**、**查询历史与代码片段**、**数据导出**（CSV/SQL/JSON/Excel）、**快照（snapshot）回滚误改**。TablePlus 的定位是**「轻量、现代、原生」**——相比付费的 Navicat（功能全但重），TablePlus 轻量精致、Mac 用户体验极佳；相比免费开源的 DBeaver（跨库多但 Eclipse 重），TablePlus 原生快、UI 现代，但跨库支持与插件生态弱。值得一提的是，JetBrains 的 **DataGrip**（商业订阅）也是现代数据库客户端的有力竞争者，UI 是 IntelliJ 风格精致、SQL 重构强、与 IntelliJ 生态集成紧密——本叶在对比中提及，但不单独立叶（DataGrip 属 JetBrains IDE 生态，非独立数据库工具专题）。理解 TablePlus 的核心是理解它**「原生轻量 + 现代 UI + 免费层试用」**的定位——这是它与 Navicat（重而全）、DBeaver（开源跨库）的根本分野。

## 评价

**优点**

- **原生轻量**：用各平台原生技术栈（Swift/C#），启动快、内存小、UI 贴合平台习惯
- **现代 UI**：界面简洁精致，深色模式、毛玻璃效果（Mac），视觉体验优于 Eclipse 风格的 DBeaver
- **免费层可用**：日常轻度使用免费层够用，不强制付费（付费解锁高级与无限量）
- **快照功能**：编辑数据前自动快照，误改可回滚——这是它独特的安全特性
- **多数据库覆盖**：主流关系库 + Redis/MongoDB/Cassandra/ClickHouse，日常开发够用

**缺点**

- **跨库不如 DBeaver**：支持的数据库种类少于 DBeaver（80+），部分冷门库不支持
- **无插件生态**：闭源，功能固定，无法像 DBeaver 那样插件扩展
- **高级功能付费**：SSH 隧道、无限连接/标签、快照、部分导出格式要 Pro 订阅
- **数据同步/备份调度弱**：不如 Navicat 的深度同步、定时备份；定位是日常查询编辑

## 本叶地图

- [入门](./getting-started) —— TablePlus 定义、原生轻量、支持数据库、免费层/付费、与 Navicat/DBeaver/DataGrip 对比
- [原生应用与现代 UI](./guide-line/native-app-and-ui) —— 原生技术栈（Swift/C#）、启动快省内存、现代 UI 设计、多数据库支持
- [功能与对比：免费层、DataGrip 与插件](./guide-line/features-and-comparison) —— SQL 编辑器、数据编辑、快照、SSH 隧道、DataGrip 对比、免费层边界
- [参考](./reference) —— 支持数据库矩阵、免费/Pro 功能对比、与 Navicat/DBeaver/DataGrip 对比、易错点清单

## 幻灯片地址

<a href="/SlideStack/tableplus-slide/" target="_blank">TablePlus</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=TablePlus" target="_blank" rel="noopener noreferrer">TablePlus 测试题</a>
