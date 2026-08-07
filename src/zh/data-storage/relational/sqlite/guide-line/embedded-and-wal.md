---
layout: doc
outline: [2, 3]
---

# 嵌入式架构与 WAL：进程内库、单文件与并发模型

> 基于 SQLite 3.46+ · 核于 2026-08

## 速查

- **嵌入式 vs C/S**：SQLite 是**进程内 C 库**（应用调函数读写本地文件），MySQL/PG 是**独立服务进程**（应用走网络协议）。这是架构层面的根本差异。
- **进程内的优势**：无网络往返（极快）、无独立进程（省资源）、零配置（链接即用）。代价：单进程内访问、难远程/多机。
- **单文件存储**：整个库是一个跨平台文件（`.db`）。B-tree 组织（每个表/索引一棵 B-tree），页大小默认 4KB（`PRAGMA page_size`）。文件格式跨平台兼容（字节序/位宽）。
- **rollback journal（默认）**：写前把原页备份到回滚日志（`-journal`），改主库，COMMIT 删日志。崩溃时用日志回滚。**写时锁整库，读被阻塞**。
- **WAL 模式**：写先追加到 **WAL 文件**（`-wal`），不直接改主库；读看主库+WAL 合并；WAL 达阈值或 `wal_checkpoint` 时合并回主库。**读写不互斥**（边读边写），仍是单写。
- **并发模型**：文件锁（POSIX advisory / Windows locks）。**读锁共享（多读并发）**，**写锁独占（单写）**。WAL 提升读并发但不解决多写。
- **ACID**：原子性靠 journal/WAL（崩溃回滚或重放），持久性靠 `synchronous`（fsync 策略），隔离性靠锁，一致性靠约束 + 前三者。
- **`synchronous`**：FULL（默认，每次 COMMIT fsync，最安全）、NORMAL（WAL 下仅 checkpoint fsync，推荐）、OFF（不 fsync，最快但断电危险）。
- **备份**：①`.backup` 命令（在线热备，推荐）；②文件拷贝（需先 checkpoint 或停写）；③`VACUUM INTO`（导出干净副本）。
- **适用边界**：读多写少、单机/嵌入式、数据量 < 几十 GB、不需多机远程。高并发写/多机/超大规模选 MySQL/PG。

## 一、嵌入式架构：进程内 C 库

SQLite 与 MySQL/PostgreSQL 的架构对比：

```
传统 C/S（MySQL/PG）              SQLite（嵌入式）
                                  
  应用 ──网络协议──→ 服务进程        应用进程
  (JDBC/Prisma)     (mysqld)        ┌────────────────┐
                    ├ 连接器         │  应用代码        │
                    ├ 优化器         │  SQLite 库(.a/.so)│ ← 链接进进程
                    └ 存储引擎       │  ↓ 函数调用      │
                      ↓             │  test.db 文件    │ ← 直接读写本地文件
                   数据文件          └────────────────┘
```

| 维度 | SQLite（嵌入式） | MySQL / PG（C/S） |
| --- | --- | --- |
| 进程 | 进程内（应用一部分） | 独立服务进程 |
| 访问 | 函数调用（C API） | 网络协议（TCP） |
| 延迟 | 纳秒级（无网络） | 毫秒级（网络往返） |
| 资源 | 极低（几百 KB 库） | 高（独立进程 + 内存池） |
| 配置 | 零配置 | 配置文件 + 调参 |
| 远程访问 | ❌（本地进程内） | ✅（任意客户端连服务） |
| 多机 | ❌ | ✅ |
| 并发写 | 单写（整库一锁） | 行锁 + MVCC（高并发） |

- **进程内的根本优势**：①**无网络往返**——函数调用纳秒级，比网络 SQL 快几个数量级；②**无独立进程**——省内存/启动开销，适合资源受限的移动/IoT；③**零配置**——链接库即用，无需运维。
- **代价**：①单进程内访问（跨进程要文件锁协调）；②不支持远程客户端（要 Turso 这类封装）；③并发写受限（整库单写）。

## 二、单文件存储：B-tree 组织

SQLite 的 `.db` 文件内部结构：

```
test.db 文件
  ├ 页（page）：默认 4KB，I/O 最小单位（PRAGMA page_size）
  │  ├ 页类型：table leaf / table interior / index leaf / index interior
  │  └ 每页有页头 + 单元格（行/键）
  └ B-tree 组织：
     ├ 每个表 → 一棵 table B-tree（行按 rowid 排）
     ├ 每个索引 → 一棵 index B-tree（键按索引列排）
     └ sqlite_master 表（schema）→ 第一棵 B-tree
```

- **rowid**：每行有个隐式的 64 位 rowid（`INTEGER PRIMARY KEY` 即别名）。数据按 rowid 在 table B-tree 的叶子节点排好——按主键查询/范围扫描极快。
- **WITHOUT ROWID 表**：`CREATE TABLE ... WITHOUT ROWID` 用主键作 B-tree 键（类似聚簇索引），适合主键复杂/省空间的场景。
- **跨平台兼容**：文件格式规范固定（字节序、位宽、页大小），同一文件在任意机器/系统都能读写。

## 三、rollback journal（默认模式）

默认的 journal 模式是 DELETE（回滚日志），工作流程：

```
写事务开始：
  1. 获取写锁（整库独占）
  2. 把要修改的页（原值）写入回滚日志文件 (-journal)
  3. fsync 回滚日志（保证崩溃可恢复）
  4. 修改主库文件中的页
  5. fsync 主库（synchronous=FULL 时）
COMMIT：
  6. 删除回滚日志（提交完成）
崩溃恢复（下次打开）：
  - 若有回滚日志 → 用它回滚未完成的事务
```

- **问题**：步骤 1-5 期间**整库独占写锁**，连读都不行——「写时不能读」是 rollback 模式的痛点。
- **适用**：偶发写、单线程、或可接受写时短暂阻塞读的场景。

## 四、WAL 模式：读写不互斥

WAL（Write-Ahead Logging）模式（`PRAGMA journal_mode=WAL`）改为「先写日志文件，再异步合并回主库」：

```
写事务：
  1. 获取写锁（仍是整库单写）
  2. 把修改【追加】到 WAL 文件 (-wal)   ← 不改主库文件！
  3. fsync WAL
COMMIT：
  4. 标记事务在 WAL 中提交（commit frame）

读操作：
  - 读主库文件 + WAL 中已提交的事务 → 合并视图
  - 读不阻塞写，写不阻塞读          ← 核心收益！

WAL checkpoint（WAL 太大或主动触发）：
  - 把 WAL 内容合并回主库文件
  - 重置 WAL
```

| 维度 | rollback（默认） | WAL |
| --- | --- | --- |
| 写时读 | **互斥**（写时不能读） | **不互斥**（边读边写） |
| 多读并发 | 受限 | ✅ |
| 多写并发 | ❌ 单写 | ❌ **仍单写** |
| 速度（读多写少） | 慢（写阻塞读） | **快** |
| 文件 | 主库 + -journal（临时） | 主库 + -wal + -shm |

- **WAL 不解决多写**：即使 WAL，整个数据库仍只有**一把写锁**，多个写事务排队。这是 SQLite 不适合高并发写的根本原因。
- **checkpoint 策略**（`PRAGMA wal_autocheckpoint`）：WAL 达到 N 页（默认 1000）自动 checkpoint。也可 `PRAGMA wal_checkpoint(PASSIVE|FULL|RESTART)` 手动。
- **WAL 文件**：`-wal`（日志）+ `-shm`（共享内存索引）。备份时要包含这两个文件，或先 checkpoint。

## 五、ACID 与 `synchronous`

SQLite 严格 ACID，可靠性由 `synchronous` pragma 控制 fsync 策略：

| `synchronous` | fsync 时机 | 安全性 | 速度 | 适用 |
| --- | --- | --- | --- | --- |
| FULL（0=2，默认） | 每次 COMMIT 都 fsync 主库/WAL | 最高（断电不丢已提交） | 最慢 | 强一致关键数据 |
| NORMAL（1） | WAL 模式下只在 checkpoint fsync | 高（仅在 checkpoint 间隔断电可能丢最后事务） | 较快 | **WAL 推荐组合** |
| OFF（0） | 不 fsync | 低（断电可能损坏库） | 最快 | 可重建的临时数据 |

- **WAL + NORMAL** 是「读多写少」应用的最佳组合——速度比 FULL 快数倍，安全性可接受（仅 checkpoint 间隔的断电风险，NORMAL 下不会损坏库，最多丢最后几个已提交事务）。
- **绝不建议生产用 OFF**：断电可能导致**整个数据库文件损坏**（不是丢事务而是库不可用）。
- **`busy_timeout`**：写锁被占时，读/写等待的毫秒数（默认 0 立即报错）。设 `PRAGMA busy_timeout=5000` 让短暂冲突自动重试而非报错。

## 六、备份与恢复

| 方式 | 命令 | 特点 |
| --- | --- | --- |
| **`.backup`**（推荐） | `sqlite3 test.db ".backup backup.db"` | 在线热备，不阻塞写 |
| **`VACUUM INTO`** | `VACUUM INTO 'clean.db';` | 导出干净紧凑副本（无碎片） |
| 文件拷贝 | `cp test.db bak.db` | 需先 `wal_checkpoint(TRUNCATE)` 或停写，否则 WAL 数据丢失 |
| `.dump` | `sqlite3 test.db .dump > dump.sql` | 导出 SQL 文本（可跨库迁移） |

- **在线备份首选 `.backup`**：它处理 WAL 合并、页拷贝、并发写，安全可靠。文件拷贝要小心 WAL——若不停写/checkpoint，拷贝的 `.db` 可能不含 WAL 中最新数据。
- **崩溃恢复**：下次 `sqlite3_open` 时，SQLite 自动检测并处理未完成的 journal/WAL——回滚未提交事务或重放已提交 WAL，恢复到一致状态。

## 下一步

嵌入式架构与 WAL 讲透后，下一个核心是[使用场景与本地优先](./use-cases)——移动端/桌面/PWA、FTS5 全文搜索、本地优先应用、Turso/libSQL 对比。
