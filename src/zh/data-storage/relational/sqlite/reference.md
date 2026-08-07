---
layout: doc
outline: [2, 3]
---

# 参考：SQLite 架构、pragma、并发与备份速查

> 基于 SQLite 3.46+ · 核于 2026-08

## 速查

- **SQLite 定义**：嵌入式、进程内、零配置、单文件关系库，公有领域，全球部署量最大的数据库。
- **架构**：进程内 C 库（应用调函数读写本地文件），无独立服务/无网络端口/无用户系统。
- **存储**：单个跨平台文件（`.db`），B-tree 组织，页大小默认 4KB。
- **journal 模式**：DELETE（默认回滚，写时锁整库）/ **WAL**（推荐，读写不互斥）/ MEMORY / TRUNCATE。
- **并发**：文件锁，多读并发 + **整库单写**（WAL 也不解决多写）。
- **ACID**：严格保证；`synchronous` 控制 fsync（FULL 最安全/NORMAL WAL 推荐/OFF 危险）。
- **SQL 兼容**：事务/视图/触发器/CTE（含递归）/窗口函数/JSON1/UPSERT/生成列；不支持存储过程/用户权限。
- **FTS5**：内置全文搜索（`MATCH`+排名），中文用 trigram tokenizer。
- **备份**：`.backup`（推荐热备）/ `VACUUM INTO`（干净副本）/ `.dump`（SQL 文本）/ 文件拷贝（需 checkpoint）。
- **适用**：移动/桌面/PWA/IoT/测试夹具/小搜索/本地优先；**不适合**高并发写/多机/超大规模/细粒度权限。

## 一、嵌入式 vs C/S 对比

| 维度 | SQLite（嵌入式） | MySQL / PostgreSQL（C/S） |
| --- | --- | --- |
| 架构 | 进程内 C 库 | 独立服务进程 + 网络端口 |
| 访问方式 | 函数调用（C API） | 网络协议（TCP） |
| 访问延迟 | 纳秒级（无网络） | 毫秒级（网络往返） |
| 资源占用 | 极低（几百 KB） | 高（独立进程 + 内存池） |
| 配置 | **零配置** | 配置文件 + 调参 |
| 远程访问 | ❌ | ✅ |
| 多机 | ❌ | ✅ |
| 并发写 | **整库单写** | 行锁 + MVCC（高并发） |
| 用户权限 | ❌（靠文件系统） | ✅ 细粒度 |
| 运维 | 零 | 需要 DBA |
| 单库容量上限 | 281TB（理论，实际几十 GB 吃力） | TB+ 级常见 |

## 二、常用 pragma 速查

| pragma | 作用 | 常用值 |
| --- | --- | --- |
| `journal_mode` | 事务日志模式 | **WAL**（推荐）/ DELETE（默认）/ MEMORY |
| `synchronous` | fsync 策略 | FULL（默认）/ **NORMAL**（WAL 推荐）/ OFF |
| `page_size` | 页大小 | 4096（默认）/ 8192 / 16384 |
| `cache_size` | 页缓存大小（页数，负数为 KB） | `-65536`（64MB） |
| `busy_timeout` | 锁冲突等待毫秒 | **5000**（避免立即报错） |
| `foreign_keys` | 外键约束开关 | **ON**（默认 OFF！需手动开） |
| `wal_autocheckpoint` | WAL 自动 checkpoint 页数 | 1000（默认） |
| `mmap_size` | 内存映射 IO 大小 | `268435456`（256MB，大库提速） |
| `temp_store` | 临时表存储 | MEMORY（默认 FILE） |
| `locking_mode` | 锁模式 | NORMAL（默认）/ EXCLUSIVE |

- **推荐组合（读多写少）**：`journal_mode=WAL` + `synchronous=NORMAL` + `busy_timeout=5000` + `foreign_keys=ON` + `mmap_size=256MB`。
- **`foreign_keys` 默认关闭**：这是经典坑——SQLite 默认不检查外键约束，需 `PRAGMA foreign_keys=ON;` 显式开启。

## 三、并发模型

| 锁状态 | 含义 | 并发 |
| --- | --- | --- |
| UNLOCKED | 无锁 | — |
| SHARED | 读锁 | 多读并发 |
| RESERVED | 准备写（reserved 区） | 单写预备 |
| PENDING | 待写（等读者退出） | 写等待 |
| EXCLUSIVE | 独占写 | **整库单写** |

- **WAL 改善读并发**：WAL 下读不阻塞写、写不阻塞读，但**仍是单写**（写者排队）。
- **`SQLITE_BUSY`**：写锁被占时的错误。设 `busy_timeout` 让其自动重试，或应用层退避重试。

## 四、备份与恢复方式

| 方式 | 命令 | 特点 |
| --- | --- | --- |
| **`.backup`**（推荐） | `.backup target.db` | 在线热备，处理 WAL/并发，不阻塞写 |
| **`VACUUM INTO`** | `VACUUM INTO 'clean.db';` | 导出干净紧凑副本（去碎片） |
| **`.dump`** | `.dump > dump.sql` | 导出 SQL 文本（可跨库迁移） |
| 文件拷贝 | `cp test.db bak.db` | 需先 `wal_checkpoint(TRUNCATE)` 或停写，否则丢 WAL 数据 |

- **崩溃恢复**：`sqlite3_open` 时自动处理未完成的 journal/WAL——回滚未提交事务或重放已提交 WAL，恢复到一致状态。SQLite 的可靠性正是靠这个。

## 五、FTS5 速查

```sql
CREATE VIRTUAL TABLE docs USING fts5(title, content, tokenize='trigram');
INSERT INTO docs VALUES('SQLite 简介', 'SQLite 是嵌入式关系数据库');
SELECT title, rank FROM docs WHERE docs MATCH '嵌入式' ORDER BY rank;  -- 带排名
SELECT * FROM docs WHERE docs MATCH 'SQLite AND 数据库';               -- 布尔
SELECT highlight(docs, 1, '<b>', '</b>') FROM docs WHERE docs MATCH '嵌入式';  -- 高亮
```

- **tokenizer**：`unicode61`（默认，对中文不友好）/ `trigram`（3 字符滑窗，中文友好，3.34+）/ `porter`（英文词干）/ 第三方 `simple/jieba`。
- **vs LIKE**：LIKE '%x%' 全表扫描无排名；FTS5 倒排索引快且有相关性排名。

## 六、易错点清单

- **「SQLite 是服务端数据库」**：错。SQLite 是**进程内嵌入式**库（无独立服务/无网络端口），与 MySQL/PG 的 C/S 架构根本不同。
- **「SQLite 不支持事务」**：错。SQLite 完整支持 ACID 事务（BEGIN/COMMIT/ROLLBACK），`synchronous` 控制可靠性。
- **「WAL 让 SQLite 支持高并发写」**：错。WAL 只让读写不互斥（提升读并发），**写仍是整库单写**——高并发写选 MySQL/PG。
- **「`synchronous=OFF` 只是慢一点丢数据」**：错。OFF 可能让**整个数据库文件损坏**（不是丢事务而是库不可用），生产别用。
- **「文件拷贝就是完整备份」**：不精确。WAL 模式下要先 `wal_checkpoint(TRUNCATE)` 或停写，否则拷贝的 `.db` 不含 WAL 中最新数据。用 `.backup` 命令最安全。
- **「外键自动生效」**：错。SQLite **默认关闭**外键约束（`foreign_keys=OFF`），需 `PRAGMA foreign_keys=ON;` 显式开启——这是经典坑。
- **「SQLite 不支持 JSON」**：错。SQLite 1.x 起有 JSON1 扩展（编译进默认构建），支持 `json_extract`/`json_object` 等操作 JSON。
- **「SQLite 不能全文搜索」**：错。FTS5 提供内置全文搜索（带排名、中文 trigram 支持），小数据量无需 Elasticsearch。
- **「SQLite 是公有领域所以随便改」**：可以，但改了就不兼容标准 SQLite 文件格式。公有领域指无版权限制（可商用/闭源/分发），非「格式不保证」。
- **「Turso 就是 SQLite」**：不精确。Turso 维护的 libSQL 是 SQLite 的 fork，加了复制/向量/托管，是 SQLite 的云原生演进（详见云服务章）。
- **「本地优先不需要同步」**：错。本地优先仍需与云端同步（CRDT/异步），只是数据主存在本地——同步冲突是核心挑战。
- **「SQLite 适合所有 Web 后端」**：错。整库单写让它在高并发写 Web 后端是瓶颈，那种场景用 MySQL/PG。

## 七、进阶方向（链接其他叶）

- [MySQL](../../mysql/) —— 高并发写、多机远程的服务端选择（本站 quiz-backend 跑在它上）
- [PostgreSQL](../../postgresql/) —— 功能最强、扩展生态丰富的服务端选择
- 云服务章：Turso/libSQL 作为边缘/Serverless 数据库的代表（待建）
- 本站幻灯片：<a href="/SlideStack/sqlite-slide/" target="_blank">SQLite</a>

## 权威链接

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQLite WAL Mode](https://www.sqlite.org/wal.html)
- [SQLite FTS5 Extension](https://www.sqlite.org/fts5.html)
- [SQLite PRAGMA Statements](https://www.sqlite.org/pragma.html)
- [SQLite Architectural Overview](https://www.sqlite.org/arch.html)
- [Appropriate Uses for SQLite](https://www.sqlite.org/whentouse.html)
- [libSQL / Turso](https://turso.tech/)
- 本站幻灯片：<a href="/SlideStack/sqlite-slide/" target="_blank">SQLite</a>
