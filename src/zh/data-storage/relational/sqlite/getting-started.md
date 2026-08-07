---
layout: doc
outline: [2, 3]
---

# 入门：SQLite、嵌入式架构、WAL 与 FTS5

> 基于 SQLite 3.46+ · 核于 2026-08

## 速查

- **定义**：SQLite 是**嵌入式、进程内、零配置、单文件**的关系型数据库，公有领域（无版权），由 D. Richard Hipp 于 2000 年创建。全球部署量最大的数据库（每台手机/浏览器/Mac/IoT 都有）。
- **嵌入式架构**：SQLite 是一个**链接进应用进程的 C 库**（几百 KB），不是独立服务。应用直接调 `sqlite3_open`/`sqlite3_exec` 读写**本地文件**，无网络端口、无独立进程、无用户管理。与 MySQL/PG 的客户端/服务端架构根本不同。
- **单文件**：整个数据库就是**一个跨平台文件**（`.db`/`.sqlite`），拷贝即备份、删除即销毁。文件在 Windows/Mac/Linux/Android/iOS 通用（字节序/位宽兼容）。
- **零配置零运维**：无需安装服务、无需配置文件、无需 DBA。`sqlite3 test.db` 即开即用。这是它统治移动端/桌面/IoT 的根本原因。
- **WAL 模式**（`PRAGMA journal_mode=WAL`）：写操作先写 **WAL 文件**（-wal）而非回滚日志，让**读写不互斥**（多读 + 单写并发），大幅提升并发读。默认是 rollback journal（读写互斥）。
- **并发模型**：SQLite 用**文件锁**。整个数据库**一把写锁**（即使 WAL 下也是单写），多读可并发。所以 SQLite 适合**读多写少**，不适合高并发写。
- **ACID**：严格保证。事务用 rollback journal（默认）或 WAL 实现原子性/持久性，`COMMIT` 时 fsync 落盘（可调 `synchronous` 牺牲安全换性能）。
- **SQL 兼容性**：支持绝大多数 SQL 标准——事务、视图、触发器、CTE（含递归）、窗口函数、JSON1、UPSERT、生成列。语法与 MySQL/PG 高度相似，迁移成本低。
- **FTS5**（Full-Text Search 5）：内置全文搜索引擎，`CREATE VIRTUAL TABLE t USING fts5(content)` + `MATCH` 查询，支持中文（需 tokenizer）、分词、排名。小数据量搜索无需 Elasticsearch。
- **无 C/S**：不支持网络访问。要远程/多机访问得靠应用层封装或 **Turso/libSQL**（SQLite 的云原生 fork，加复制/边缘计算/向量）。
- **典型场景**：移动端（Android/iOS 内置）、桌面应用（Safari/Firefox/Mac Spotlight）、PWA/IndexedDB（理念源头）、IoT 设备、本地优先应用、测试夹具。
- **进阶顺序**：[嵌入式架构与 WAL](./guide-line/embedded-and-wal) → [使用场景与本地优先](./guide-line/use-cases) → [参考](./reference)。

## 一、SQLite 是什么：进程内的数据库

SQLite 用 SQL 把数据组织成表，承诺 ACID。但它的架构与 MySQL/PostgreSQL 根本不同：

| 维度 | SQLite | MySQL / PostgreSQL |
| --- | --- | --- |
| **架构** | **嵌入式（进程内库）** | 客户端/服务端（独立进程） |
| 部署 | 链接进应用，无独立服务 | 独立服务进程 + 网络端口 |
| 存储 | **单个跨平台文件** | 多文件 + 进程内存 |
| 协议 | **函数调用**（C API） | 网络协议（TCP） |
| 用户/权限 | **无**（靠文件系统权限） | 细粒度用户授权 |
| 配置 | **零配置** | 配置文件 + 调参 |
| 并发写 | 整库**一把写锁** | 行锁 + MVCC，高并发 |

- **进程内**：SQLite 是一个 C 库（也可绑定到 Python/Node/Java/Swift/Kotlin 等），与应用代码运行在**同一进程**，调用就是普通函数调用，没有网络往返——极快。
- **单文件**：`sqlite3_open("test.db", &db)` 打开一个文件，所有表/索引/触发器都在这个文件里。文件格式跨平台兼容（同一 `.db` 文件可在任意机器/系统读写）。
- **零运维**：无需安装、无需启动服务、无需配置。这是它统治移动端/桌面/IoT 的根本——这些场景无法承受「装数据库服务」的复杂度。

## 二、零配置与单文件

```bash
# 「安装」SQLite：无需装服务，库已链接进应用（或用 sqlite3 CLI）
sqlite3 test.db                  # 打开/创建数据库（一个文件）
sqlite> CREATE TABLE user(id INTEGER PRIMARY KEY, name TEXT);
sqlite> INSERT INTO user(name) VALUES('张三');
sqlite> SELECT * FROM user;
1|张三
sqlite> .exit
# 备份：直接拷贝 test.db 文件
cp test.db test.db.bak           # 这就是完整备份
```

- **文件即数据库**：一个 `.db` 文件包含完整的 schema + 数据 + 索引 + 触发器。`ls -la test.db` 看文件大小就知道数据量。
- **跨平台**：同一文件在 32/64 位、大小端、Windows/Mac/Linux/Android/iOS 都能读写——SQLite 格式规范保证兼容。
- **公有领域**：无版权、无许可费、可任意商用/闭源/分发。这是它被嵌入几乎所有产品的法律基础（MySQL/PG 是 GPL/许可协议受限）。

## 三、WAL 模式：让读写不互斥

SQLite 默认用 **rollback journal**（回滚日志）：写操作开始前，把要改的页先备份到回滚日志，再改主库文件——写时**锁整库**，读也被阻塞。这在「读多写少」场景问题不大，但「边读边写」会卡。

**WAL（Write-Ahead Logging）模式**（`PRAGMA journal_mode=WAL`）改为：所有写操作先追加到 **WAL 文件**（`test.db-wal`），不直接改主库；读操作看主库 + WAL 合并视图；WAL 达到阈值（默认 1000 帧）或 `PRAGMA wal_checkpoint` 时把 WAL 合并回主库。

| 模式 | 写时读 | 并发读 | 并发写 | 适用 |
| --- | --- | --- | --- | --- |
| rollback（默认 DELETE） | **互斥**（写时不能读） | 多读 | 单写 | 偶发写 |
| **WAL** | **不互斥**（边读边写） | 多读 | 单写 | **读多写少首选** |
| MEMORY | — | — | — | 临时/测试 |

- **WAL 的核心收益**：读写不互斥——一个写者写 WAL 时，多个读者仍能读主库。大幅提升「读多写少」的并发。
- **仍是单写**：即使 WAL，整个数据库依然只有**一把写锁**，多个写者要排队。所以 SQLite 不适合高并发写（如高 QPS 的 Web 后端），那种场景用 MySQL/PG。

## 四、SQL 兼容性与 FTS5

SQLite 支持绝大多数 SQL 标准，与 MySQL/PG 语法高度相似：

```sql
-- 事务、CTE（含递归）、窗口函数、JSON、UPSERT、生成列都支持
BEGIN;
WITH RECURSIVE cnt(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM cnt WHERE x<10)
SELECT x FROM cnt;
INSERT INTO user(id,name) VALUES(1,'张') ON CONFLICT(id) DO UPDATE SET name=excluded.name;
SELECT name, ROW_NUMBER() OVER (ORDER BY id) FROM user;
COMMIT;

-- FTS5 全文搜索
CREATE VIRTUAL TABLE docs USING fts5(content);    -- 虚拟表
INSERT INTO docs(content) VALUES('SQLite 是嵌入式数据库');
SELECT * FROM docs WHERE docs MATCH '嵌入式';      -- 全文匹配（带排名）
```

- **FTS5**：内置倒排索引全文搜索。`MATCH` 查询带相关性排名，支持前缀/短语/布尔/中文（需 trigram 或 jieba tokenizer）。小数据量（百万级）搜索无需 Elasticsearch。
- **不支持的**：RIGHT/FULL OUTER JOIN（直到 3.39+ 才支持 RIGHT）、存储过程、用户权限系统、细粒度并发写。

## 五、ACID 与可靠性

SQLite 严格保证 ACID，可靠性靠 **`synchronous` pragma** 控制：

| `synchronous` | 行为 | 安全 | 速度 |
| --- | --- | --- | --- |
| FULL（默认） | 每次 COMMIT 都 fsync 等落盘 | 最高（断电不丢已提交） | 最慢 |
| NORMAL | WAL 模式下只在 checkpoint 时 fsync | 高（仅在 checkpoint 间隔断电可能丢最后事务） | 较快 |
| OFF | 不 fsync | 低（断电可能损坏） | 最快 |

- **WAL + NORMAL** 是「读多写少」应用的常见组合——性能比 FULL 快数倍，安全性可接受（仅在 checkpoint 间隔的断电风险）。
- **`journal_mode`**：DELETE（默认回滚）、**WAL**（推荐）、TRUNCATE/PERSIST/MEMORY。WAL 是大多数应用的最佳选择。

## 六、移动端、PWA、本地优先与 Turso/libSQL

- **移动端**：Android（`android.database.sqlite`）、iOS（Core Data/GRDB/FMDB）都内置 SQLite——每个 App 的本地数据默认就存 SQLite。
- **桌面应用**：Safari（历史/书签）、Firefox（书签/cookies）、Mac 的 Spotlight（索引）、Skype/Dropbox 等都用 SQLite 存本地数据。
- **PWA/浏览器**：IndexedDB 的理念借鉴 SQLite（虽然底层实现不同）；WASM 版 SQLite（sqlite-wasm）让浏览器也能直接跑 SQLite。
- **本地优先（Local-First）**：数据先存本地 SQLite，按需与云端同步（CRDT/ ElectricSQL / PowerSync）。优势：离线可用、低延迟、数据自主。
- **Turso/libSQL**：SQLite 的云原生 fork（Turso 公司维护 libSQL 开源引擎）。在 SQLite 基础上加：①**复制**（边缘节点同步）；②**向量搜索**；③**托管服务**（多区域、按需）。把 SQLite 从「单机嵌入式」推向「分布式边缘数据库」。详见云服务章。

## 下一步

理解了 SQLite 的全貌后，下一步深入两个核心——[嵌入式架构与 WAL](./guide-line/embedded-and-wal)（进程内 vs C/S、WAL 工作原理、并发模型与 ACID）与[使用场景与本地优先](./guide-line/use-cases)（移动端/桌面/PWA、FTS5、本地优先与 Turso/libSQL 对比）。
