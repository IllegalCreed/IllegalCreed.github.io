---
layout: doc
outline: [2, 3]
---

# 使用场景与本地优先：移动端、PWA、FTS5 与 Turso/libSQL

> 基于 SQLite 3.46+ · 核于 2026-08

## 速查

- **移动端**：Android（`android.database.sqlite`/Room）、iOS（Core Data/GRDB/FMDB）都内置 SQLite——每个 App 本地数据默认存 SQLite。是移动端本地存储事实标准。
- **桌面应用**：Safari（历史/书签）、Firefox（书签/cookies）、Mac Spotlight（索引）、Skype/Dropbox/Slack 等都用 SQLite 存本地数据。
- **PWA/浏览器**：IndexedDB 理念借鉴 SQLite；**sqlite-wasm**（OPFS）让浏览器直接跑 SQLite；WebAssembly + Origin Private FS 让本地优先 Web 应用成为可能。
- **IoT/嵌入式**：资源受限设备（路由器、车机、家电）用 SQLite 存配置/日志/历史——几百 KB 库、无服务进程、零运维。
- **测试夹具**：用 SQLite（内存模式 `:memory:`）替代 MySQL/PG 跑单元测试——零部署、极速、测完即弃。
- **FTS5 全文搜索**：`CREATE VIRTUAL TABLE t USING fts5(content)` + `MATCH` 查询，内置倒排索引、相关性排名、中文支持（trigram/jieba tokenizer）。小数据量（百万级）搜索无需 Elasticsearch。
- **本地优先（Local-First）**：数据先存本地 SQLite，按需与云端同步（CRDT/ElectricSQL/PowerSync）。优势：离线可用、低延迟（本地读写）、数据自主权、按需同步。
- **Turso/libSQL**：SQLite 的云原生 fork（Turso 公司维护 libSQL 开源引擎）。在 SQLite 基础加：①**复制**（边缘节点同步）；②**向量搜索**；③**托管服务**（多区域、按需）。把 SQLite 推向分布式边缘数据库。详见云服务章。
- **SQLite 不适合**：高并发写（整库单写）、多机远程访问（无 C/S）、超大规模（百 GB+ 备份/恢复吃力）、细粒度用户权限。这些场景选 MySQL/PG。
- **适用决策**：①单机/嵌入式/移动端 → SQLite；②高并发写/多机 Web 后端 → MySQL/PG；③本地优先 + 按需同步 → SQLite + 同步层（或 Turso）。

## 一、移动端：SQLite 是本地存储事实标准

移动应用的数据存储几乎全是 SQLite：

| 平台 | API | 说明 |
| --- | --- | --- |
| **Android** | `android.database.sqlite` / **Room**（Jetpack） | 系统内置 SQLite；Room 是 ORM 抽象层 |
| **iOS** | Core Data / **GRDB** / FMDB | Core Data 可配 SQLite 后端；GRDB 是 Swift 直用 SQLite |

- **为什么是 SQLite**：移动端资源受限（内存/电量/启动时间），无法承受「装 MySQL 服务」。SQLite 是进程内库（几百 KB）、零配置、零运维，App 启动即可用。
- **典型用法**：App 的本地缓存、用户偏好、离线数据、草稿、消息历史都存 SQLite。联网时再与服务端 API 同步。
- **Room（Android）**：Google 推荐的 SQLite 抽象层——编译期 SQL 校验、流式 API（Flow/LiveData）、迁移助手，避免手写 `sqlite3_*` 的样板代码。

## 二、桌面应用：无处不在的 SQLite

桌面应用大量用 SQLite 存本地数据：

- **浏览器**：Safari（历史/书签/cookies）、Firefox（书签/cookies/ Places）、Chrome（部分本地数据）。
- **系统**：macOS 的 Spotlight（搜索索引）、Photos（图库）、Messages（消息历史）、Mail。
- **应用**：Skype/Dropbox/Slack/Notion/VS Code（部分状态）/Git（虽然是自己的对象存储但理念类似）。
- **优势**：桌面应用需「离线可用 + 低延迟本地读写」，SQLite 完美匹配——数据在本地文件，无网络往返。

## 三、PWA 与浏览器：sqlite-wasm 与本地优先 Web

浏览器场景的 SQLite 演进：

- **IndexedDB**：浏览器的内置事务型 KV/文档库，理念借鉴 SQLite（事务/索引），但 API 不同（非 SQL）。是 PWA 本地数据的主流选择。
- **sql.js / sqlite-wasm**：把 SQLite 编译成 WebAssembly，让浏览器直接跑 SQLite。配合 **OPFS（Origin Private File System）** 持久化，性能接近原生。
- **本地优先 Web 应用**：用 SQLite-wasm 把数据存浏览器本地，PWA 离线可用，按需与云端同步。详见云服务章。

## 四、FTS5：内置全文搜索

SQLite 的 FTS5（Full-Text Search 5）是内置全文搜索引擎，小数据量搜索无需 Elasticsearch：

```sql
-- 建全文虚拟表
CREATE VIRTUAL TABLE docs USING fts5(
  title,
  content,
  tokenize = 'trigram'    -- 中文友好（按 3 字符滑窗分词），3.34+ 支持
);

-- 插入
INSERT INTO docs(title, content) VALUES('SQLite 简介', 'SQLite 是嵌入式关系数据库');

-- 全文搜索（MATCH 带相关性排名）
SELECT title, rank FROM docs WHERE docs MATCH '嵌入式' ORDER BY rank;
SELECT * FROM docs WHERE docs MATCH 'SQLite AND 数据库';     -- 布尔
SELECT * FROM docs WHERE docs MATCH '"嵌入式数据库"';        -- 短语
SELECT * FROM docs WHERE docs MATCH '数据*';                 -- 前缀

-- 高亮与摘要
SELECT highlight(docs, 1, '<b>', '</b>') FROM docs WHERE docs MATCH '嵌入式';
```

- **FTS5 vs LIKE**：`LIKE '%xxx%'` 是全表扫描（慢、无排名）；FTS5 用倒排索引（快、有相关性排名）。
- **中文支持**：默认 tokenizer（unicode61）按空格/标点分词，对中文不友好（中文无空格）。用 `trigram`（3 字符滑窗，3.34+）或第三方 `simple/jieba` tokenizer。
- **适用规模**：百万级文档内 FTS5 足够快；亿级或需复杂分析（聚合/分面）用 Elasticsearch。

## 五、本地优先（Local-First）应用

**本地优先**是一种应用架构理念：数据**先存本地**（SQLite），按需与云端**异步同步**——颠覆传统「数据在云端服务器，客户端只是展示层」的模式。

| 维度 | 传统云端优先 | 本地优先 |
| --- | --- | --- |
| 数据主存 | 云端数据库 | **本地 SQLite** |
| 读写延迟 | 网络（毫秒） | **本地（纳秒）** |
| 离线 | 不可用 | **完全可用** |
| 同步 | 实时（强一致） | 异步（最终一致/CRDT） |
| 数据自主 | 平台控制 | **用户控制** |

- **核心挑战——同步冲突**：多端离线编辑后同步，如何解决冲突？主流方案：①**CRDT**（Conflict-free Replicated Data Type，无冲突复制数据类型，自动合并）；②**Last-Write-Wins**（时间戳最新者赢，简单但可能丢更新）；③**应用层冲突解决**。
- **同步工具**：**ElectricSQL**（Postgres ↔ SQLite 同步）、**PowerSync**（云 ↔ SQLite）、**replicache**（JS 同步库）、**RxDB**（响应式本地优先 DB）。
- **优势**：离线可用、低延迟、数据自主权、按需同步省流量。劣势：同步冲突复杂、一致性最终（非强一致）。

## 六、Turso/libSQL：SQLite 的云原生 fork

**Turso**（公司）维护的 **libSQL**（开源，SQLite 的 fork）在 SQLite 基础上加现代云能力：

| 能力 | 说明 |
| --- | --- |
| **复制**（Replication） | 一个主库 + 多个边缘副本，读写本地副本、异步同步主库 |
| **向量搜索** | 内置 `vector` 类型 + 向量索引（受 pgvector 启发），AI 场景 |
| **托管服务** | Turso 平台托管，多区域、按需扩容、免费层 |
| **边缘计算** | 数据库贴近用户（边缘节点），低延迟全球访问 |
| **SQL 兼容** | 与 SQLite 几乎完全兼容，迁移成本低 |

- **典型场景**：①**边缘应用**（全球低延迟，数据副本贴近用户）；②**本地优先 + 同步**（libSQL 内置复制，省去自己搭同步层）；③**嵌入式 AI**（向量搜索 + 关系数据一条 SQL）。
- **vs SQLite**：SQLite 是单机嵌入式（无复制/无托管）；libSQL/Turso 把它推向分布式边缘数据库，但仍是 SQLite 内核（轻量、SQL 兼容）。
- **详见云服务章**：Turso/libSQL 作为边缘/Serverless 数据库的代表，在云服务章深入。

## 七、选型决策：何时用 SQLite vs MySQL/PG

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 移动端 App 本地数据 | **SQLite** | 进程内、零运维、内置 |
| 桌面应用本地数据 | **SQLite** | 离线可用、单文件、跨平台 |
| PWA / 浏览器本地 | **SQLite-wasm** 或 IndexedDB | 浏览器内本地优先 |
| IoT / 嵌入式设备 | **SQLite** | 资源极低、无服务进程 |
| 单元测试夹具 | **SQLite**（`:memory:`） | 零部署、极速、测完即弃 |
| 小数据量全文搜索 | **SQLite FTS5** | 内置、无需额外服务 |
| 本地优先 + 按需同步 | **SQLite + 同步层** 或 Turso | 离线可用 + 低延迟 |
| **高并发写 Web 后端** | **MySQL / PG** | SQLite 整库单写是瓶颈 |
| **多机远程访问** | **MySQL / PG** | SQLite 无 C/S 架构 |
| **超大规模（百 GB+）** | **MySQL / PG** | SQLite 备份/恢复/查询吃力 |
| **细粒度用户权限** | **MySQL / PG** | SQLite 无用户/权限系统 |

- **一句话**：**单机/嵌入式/移动端 → SQLite；高并发写/多机服务端 → MySQL/PG；本地优先 + 边缘 → SQLite/Turso + 同步层**。

## 下一步

使用场景与本地优先讲完后，可回到[参考](../reference)查阅嵌入式 vs C/S 对比、pragma 速查、并发模型、备份方式与易错点清单。
