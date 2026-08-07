---
layout: doc
---

# SQLite

**SQLite** 是全球**部署量最大**的数据库（没有之一）——每台 Android/iOS 手机、每个浏览器、每台 Mac/Windows、无数 IoT 设备里都跑着它。它是一个**嵌入式、进程内、零配置、单文件**的关系型数据库，由 D. Richard Hipp 于 2000 年创建（公有领域，无版权限制）。与 MySQL/PostgreSQL 的「客户端/服务端」架构根本不同：SQLite 是一个**链接进应用进程的库**（C 库，几百 KB），整个数据库就是**一个跨平台文件**（`.db`/`.sqlite`），没有独立的服务进程、没有网络端口、没有用户管理——应用直接调函数（`sqlite3_open`/`sqlite3_exec`）读写本地文件。这种「**进程内 + 单文件**」设计让 SQLite 极致轻量、零运维、零配置，是**移动端（Android/iOS 内置）、桌面应用（Safari/Firefox/Mac 的 Spotlight）、浏览器（WebSQL/IndexedDB 底层理念源头）、嵌入式设备**的事实标准。它的**WAL（Write-Ahead Logging）模式**让读写并发不再互斥；**FTS5 全文搜索**让小数据量搜索无需 Elasticsearch；原生支持 SQL（与 MySQL/PG 高度兼容）让开发者无需学新东西。**本地优先（Local-First）** 应用理念的兴起（数据先存本地、按需同步）让 SQLite 重新成为焦点——CRDT 同步库（如 ElectricSQL）、**Turso/libSQL**（SQLite 的云原生 fork，加复制/向量/边缘计算）把 SQLite 从「单机嵌入式」推向「分布式边缘数据库」。理解 SQLite 的核心是理解**嵌入式架构**（进程内 vs C/S）、**零配置单文件**的取舍、**WAL 模式**（如何让读写并发）、**FTS5 全文搜索**、以及它在**移动端/PWA/本地优先应用**与 Turso/libSQL 中的现代角色。本叶是关系型数据库章的轻量级补充，与 [MySQL](../mysql/)、[PostgreSQL](../postgresql/)（C/S 服务端架构）互为对照。

## 评价

**优点**

- **零配置零运维**：无需安装服务、无需配置、无需 DBA——一个文件就是整个库，拷贝即备份
- **极致轻量**：C 库几百 KB，可嵌入任何语言（移动端/桌面/IoT/浏览器），资源占用极低
- **跨平台单文件**：一个 `.db` 文件在 Windows/Mac/Linux/Android/iOS 通用（字节序/位宽兼容）
- **完整 SQL + 可靠**：支持绝大多数 SQL 标准（事务/触发器/视图/CTE/窗口函数/JSON），ACID 严格保证
- **公有领域**：无版权限制，可任意商用/闭源/分发（这是它被嵌入无数产品的法律基础）

**缺点**

- **无客户端/服务端**：不支持网络访问，只能本地进程内用（多机/远程场景要靠 Turso 这类云封装）
- **并发写受限**：整个数据库**一把写锁**（WAL 模式下仍是单写），高并发写是瓶颈
- **无用户/权限系统**：靠文件系统权限控制访问，没有 MySQL/PG 的细粒度用户授权
- **不适合超大规模**：单文件上限 281TB 理论够，但实际百 GB 级以上查询/备份/恢复就吃力

## 本叶地图

- [入门](./getting-started) —— SQLite 定义、嵌入式架构、零配置单文件、WAL 模式、FTS5、ACID、SQL 兼容性、移动端/PWA/本地优先、Turso/libSQL
- [嵌入式架构与 WAL](./guide-line/embedded-and-wal) —— 进程内 vs C/S、单文件存储、WAL 工作原理、并发模型、ACID 实现、备份与恢复
- [使用场景与本地优先](./guide-line/use-cases) —— 移动端（Android/iOS）、桌面应用、PWA/IndexedDB、FTS5 全文搜索、本地优先应用、Turso/libSQL 对比
- [参考](./reference) —— 嵌入式 vs C/S 对比、pragma 速查、并发模型、备份方式、易错点清单

## 幻灯片地址

<a href="/SlideStack/sqlite-slide/" target="_blank">SQLite</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=SQLite" target="_blank" rel="noopener noreferrer">SQLite 测试题</a>
