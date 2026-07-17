---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 duckdb/duckdb-skills 官方仓库（v0.2.4，MIT）的 README 与 skills/*/SKILL.md 编写。

## 速查

- **它是什么**：DuckDB **官方**（GitHub `duckdb` 组织）出的 **Claude Code 插件**，把 DuckDB 数据探索接进 agent；不是 MotherDuck 云服务
- **装**（Claude Code 里）：`/plugin marketplace add duckdb/duckdb-skills` → `/plugin install duckdb-skills@duckdb-skills`
- **调用**：装后 skill 变成 `/duckdb-skills:<skill-name>`（如 `/duckdb-skills:query FROM sales LIMIT 10`）
- **前置**：本地要有 **DuckDB CLI**；没有时 skill 会引导 `install-duckdb` 装（`brew install duckdb` / `curl -fsSL https://install.duckdb.org | sh` / `winget install DuckDB.cli`）
- **9 个 skill**：`attach-db`·`query`·`read-file`·`s3-explore`·`convert-file`·`spatial`·`duckdb-docs`·`read-memories`·`install-duckdb`
- **DuckDB**：in-process（嵌入式）分析型（OLAP）列式 SQL 库，**直读** CSV/Parquet/JSON，无需起服务，「分析界的 SQLite」
- **会话状态**：所有 skill 共享一个 `state.sql`（ATTACH/USE/LOAD/宏），只追加、幂等，`duckdb -init state.sql` 恢复
- **平台**：macOS / Linux 已测，Windows 尚未完全支持

## 安装

它是 **Claude Code 插件**（仓库带 `.claude-plugin/marketplace.json`），在 Claude Code 里两步装：

```text
/plugin marketplace add duckdb/duckdb-skills
/plugin install duckdb-skills@duckdb-skills
```

第一条把 GitHub 仓库注册为插件市场，第二条安装插件。装好后，所有 skill 以 `/duckdb-skills:<skill-name>` 形式在后续会话里可用。更新：

```text
/plugin marketplace update duckdb-skills
/plugin update duckdb-skills@duckdb-skills
```

> **前置条件**：DuckDB CLI 必须已安装。若未装，skill 会主动提示用 `/duckdb-skills:install-duckdb` 引导安装（macOS `brew install duckdb`、Linux `curl -fsSL https://install.duckdb.org | sh`、Windows `winget install DuckDB.cli`）。

## DuckDB 是什么

理解这组 skill，先理解 DuckDB：

- **in-process / 嵌入式**：像 SQLite 一样跑在你的进程里，**无需起服务**、无外部依赖，一个 CLI 或一个库文件即可
- **分析型（OLAP）列式**：列式存储 + 向量化执行，为聚合、扫描、分析查询优化（区别于 OLTP 的行式事务库）
- **直读文件**：能**直接**查 CSV / Parquet / JSON / Avro / Excel 等，`FROM 'data.parquet'` 就出结果，**不必先导入建表**
- **Friendly SQL**：一套更好写的 SQL 方言——`FROM` 前置、`GROUP BY ALL`、`SELECT * EXCLUDE (...)`、`COLUMNS(*)` 等
- **扩展生态**：`httpfs`（远程/S3）、`spatial`（地理）、`fts`（全文搜索）、`excel`、`sqlite_scanner`、`avro`、`h3` 等按需 `INSTALL`/`LOAD`

一句话：DuckDB = 本地就能跑的分析引擎；DuckDB Skills = 把它的直读文件 + SQL 能力接到 AI 对话里。

## 9 个 skill 速览

| skill | 何时用 | 一句话 |
| --- | --- | --- |
| `read-file` | 「这个文件里是什么」 | 用 `read_any` 宏按扩展名自动识别，读 CSV/JSON/Parquet/Avro/Excel/SQLite/空间/Jupyter，本地或远程 |
| `query` | 跑 SQL / 自然语言问数 | 对附加库或文件跑查询，Friendly SQL，自动接会话状态，估结果规模防爆 token |
| `attach-db` | 附加一个 `.duckdb` 库 | 探索 schema（表/列/行数），写 `state.sql` 让后续 skill 自动恢复会话 |
| `s3-explore` | 探查 S3/R2/GCS 数据 | 列桶、预览远程 Parquet/CSV，靠元数据与谓词下推**不下载**全量 |
| `convert-file` | 「转成 parquet」 | `COPY` 在格式间转换（CSV/Parquet/JSON/Excel/GeoJSON），支持分区、压缩 |
| `spatial` | 地理/坐标/距离 | 空间扩展 + Overture Maps 免费全球数据（无需 API key），距离/包含/密度分析 |
| `duckdb-docs` | 查 DuckDB 语法 | FTS（BM25）搜官方文档 + 博客 + DuckLake 文档，本地缓存索引 |
| `read-memories` | 「我们之前做过什么」 | 搜历史 Claude Code 会话日志（`.jsonl`），恢复过往决策/TODO 上下文 |
| `install-duckdb` | 装/更新扩展 | `INSTALL name` 或 `INSTALL name FROM repo`；`--update` 更新扩展并检查 CLI 版本 |

## 上手实战：读一个文件

装好后，最常用的入口是 `read-file`：

```text
/duckdb-skills:read-file variants.parquet what columns does it have?
/duckdb-skills:read-file https://example.com/data.csv how many rows?
```

它会用一个内联的 `read_any` 宏按扩展名分派到对应的 `read_*` 函数，然后 `DESCRIBE` + 数行数 + 取前 20 行样本，最后回答你的问题。看完想深入，接 `query`：

```text
/duckdb-skills:query "top 5 customers by revenue"
/duckdb-skills:query FROM 'exports.csv' WHERE amount > 100
```

## 上手实战：附加一个库，会话可复用

有 `.duckdb` 库文件时，先 `attach-db` 附加并探索 schema：

```text
/duckdb-skills:attach-db my_analytics.duckdb
```

它会问你把会话状态存哪：**项目目录**（`.duckdb-skills/state.sql`，可 gitignore）或**主目录**（`~/.duckdb-skills/<project-id>/state.sql`，保持仓库干净）。之后 `query` 会自动读这个 `state.sql`，无需重复附加——多个 skill 共享同一份会话。

## 下一步

- [指南](./guide-line) —— 各 skill 逐讲、DuckDB 直读文件用法、Friendly SQL、反模式
- [参考](./reference) —— skill 清单表、安装、DuckDB 关键、state.sql、许可、链接
