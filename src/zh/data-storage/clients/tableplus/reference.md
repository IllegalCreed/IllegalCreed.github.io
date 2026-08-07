---
layout: doc
outline: [2, 3]
---

# 参考：数据库矩阵、免费/Pro 对比与客户端对比

> 基于 TablePlus 5.x · 核于 2026-08

## 速查

- **定义**：现代、轻量的原生图形化数据库客户端，主打「原生体验、现代 UI、快速响应」。
- **原生技术栈**：Mac Swift/Cocoa、Win C#/WPF、Linux 原生——启动快、内存小、UI 贴合平台。
- **支持数据库**：主流关系库（MySQL/PG/SQLite/SQL Server/Oracle）+ NoSQL（Redis/MongoDB/Cassandra）+ 分析型（ClickHouse/Redshift/CockroachDB），约 15+。
- **免费层 + Pro**：免费层有限制（连接数/标签/历史），Pro 解锁全部（SSH 隧道、快照、无限量）。
- **独特功能**：快照（Snapshot）回滚误改——区别于其他客户端的安全亮点。
- **定位**：轻量原生、现代 UI、Mac 首选；跨库少、无插件是取舍。
- **对比**：vs Navicat（轻 vs 重全）；vs DBeaver（原生精致 vs 开源跨库）；vs DataGrip（轻量 vs IntelliJ 重构）。

## 一、支持数据库矩阵

| 类别 | 数据库 | Mac | Win | Linux |
| --- | --- | --- | --- | --- |
| 关系库 | MySQL | ✅ | ✅ | ✅ |
| | PostgreSQL（含 CockroachDB） | ✅ | ✅ | ✅ |
| | SQLite | ✅ | ✅ | ✅ |
| | MariaDB | ✅ | ✅ | ✅ |
| | SQL Server | ✅ | ✅ | ⚠️ |
| | Oracle | ✅ | ⚠️ | ⚠️ |
| NoSQL | Redis | ✅ | ✅ | ⚠️ |
| | MongoDB | ✅ | ⚠️ | ⚠️ |
| | Cassandra | ✅ | ⚠️ | ❌ |
| 分析/云 | ClickHouse | ✅ | ✅ | ⚠️ |
| | Amazon Redshift | ✅ | ✅ | ⚠️ |

> Mac 版支持最全；Win 次之；Linux 最少（部分库标注 ⚠️ 表示支持可能滞后或不全）。选型前查官方矩阵。

## 二、免费层 vs Pro 功能对比

| 功能 | 免费层（Free） | Pro（月/年/买断） |
| --- | --- | --- |
| 价格 | 免费 | 付费 |
| 连接数 | 限制（约 2） | 无限 |
| 标签页数 | 限制 | 无限 |
| 查询历史长度 | 限制 | 无限 |
| 代码片段数 | 限制 | 无限 |
| SQL 编辑器（高亮/补全/格式化） | ✅ | ✅ |
| 数据编辑器（网格/BLOB/外键跳转） | ✅ | ✅ |
| 多数据库 | ✅（基础） | ✅（全部） |
| SSH 隧道 | ❌ | ✅ |
| 快照（Snapshot）回滚 | ❌ | ✅ |
| 部分导出格式（Excel） | ❌ | ✅ |
| 全部主题（深色等） | 基础 | 全部 |

## 三、四大客户端对比（TablePlus / Navicat / DBeaver / DataGrip）

| 维度 | TablePlus | Navicat | DBeaver CE/PRO | DataGrip |
| --- | --- | --- | --- | --- |
| 价格 | 免费层 + 付费 | 商业付费 | CE 免费/PRO 订阅 | 商业订阅 |
| 开源 | 否 | 否 | CE 是（Apache 2.0） | 否 |
| 数据库数 | 约 15+ | Premium 多库 | CE 80+/PRO 加 NoSQL | 多库（JDBC） |
| 原生体验 | **是（Swift/C#）** | 否（自绘） | 否（Eclipse） | 否（IntelliJ） |
| 启动/内存 | **快/轻** | 中/重 | 慢/重 | 慢/重 |
| UI 精致度 | 高（现代原生） | 高 | 中（Eclipse） | 高（IntelliJ） |
| SQL 重构 | 弱 | 中 | 中 | **强** |
| 数据同步/备份调度 | 基础 | **强** | 基础（PRO 增强） | 基础 |
| 快照回滚 | **✅（独特）** | ❌ | ❌ | ❌ |
| 插件生态 | 无 | 无 | 活跃 | 有（JetBrains） |
| 跨平台 | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux |
| 适合 | 轻量日常、Mac | 重度企业、多库 | 开源免费、跨库多 | JetBrains 用户 |

## 四、SQL 编辑器能力速查

| 能力 | 描述 | 免费层 |
| --- | --- | --- |
| 语法高亮 | 按方言着色 | ✅ |
| 智能补全 | 表/列/函数 | ✅ |
| SQL 格式化 | 统一缩进大小写 | ✅ |
| 错误检查 | 实时标红 | ✅ |
| 多标签 | 同时多 SQL | 限数量 |
| 查询历史 | 自动保存 | 限长度 |
| 代码片段 | 保存复用 SQL | 限数量 |
| 执行计划可视化 | EXPLAIN 展示 | 较简单 |

## 五、快捷键速查（Mac，Win 对应改 ⌘ 为 Ctrl）

| 快捷键 | 功能 |
| --- | --- |
| ⌘+R | 运行 SQL |
| ⌘+⇧+R | 运行选中 |
| ⌘+T | 新标签页 |
| ⌘+W | 关闭标签 |
| ⌘+/ | 注释/取消注释 |
| ⌘+⇧+F | 格式化 SQL |
| ⌘+N | 新建（连接/查询/表） |
| ⌘+F | 在结果中查找 |
| ⌘+S | 保存（SQL 文件） |

## 六、易错点清单

- **「TablePlus 是免费软件」**：部分错。TablePlus 有**免费层**（功能限制），但 SSH 隧道、快照、无限连接等要 **Pro 订阅**。免费层够轻度日常，重度要付费。
- **「TablePlus 是开源的」**：错。TablePlus **闭源**，无插件生态（不像 DBeaver CE 开源可扩展）。
- **「TablePlus 支持所有数据库」**：错。支持约 15+ 种主流库，冷门库（Informix/Firebird/DB2）不支持，跨库不如 DBeaver（80+）。
- **「TablePlus 是 Electron 应用」**：错。TablePlus 用**原生技术栈**（Mac Swift、Win C#），不是 Electron（Chromium）。所以快、轻。
- **「快照功能免费」**：错。快照（Snapshot）是 **Pro 专属**，免费层不含。
- **「TablePlus 能完全替代 Navicat 做企业数据同步」**：错。TablePlus 定位轻量日常查询编辑，深度数据同步/备份调度/ER 正向工程不如 Navicat 成熟。
- **「TablePlus 的 SQL 编辑器比 DataGrip 强」**：部分错。TablePlus 轻快但 SQL 重构（重命名表/列自动改引用）弱于 DataGrip。
- **「TablePlus 在所有平台支持相同数据库」**：错。Mac 版支持最全，Win 次之，Linux 最少——选型前查官方矩阵。
- **「免费层的连接数限制不影响使用」**：看场景。只连一两个库够用；要同时连生产+测试+开发多个库就受限，需 Pro。
- **「TablePlus 比 DBeaver 在所有方面都好」**：错。TablePlus 原生轻量精致；但跨库少、无插件、深度同步弱——各有取舍，看需求。

## 七、进阶方向（链接其他叶）

- [Navicat](../navicat/) —— 商业付费全功能客户端，TablePlus 的重功能对照
- [DBeaver](../dbeaver/) —— 免费开源跨库客户端，TablePlus 的开源跨库对照
- [MySQL / PostgreSQL](../../distributed-search/)（关系库）—— TablePlus 管理的对象

## 权威链接

- [TablePlus 官方网站](https://tableplus.com/)
- [TablePlus 下载](https://tableplus.com/download)
- [TablePlus 文档](https://docs.tableplus.com/)
- [TablePlus 定价](https://tableplus.com/pricing)
- 本站幻灯片：<a href="/SlideStack/tableplus-slide/" target="_blank">TablePlus</a>
