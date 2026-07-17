---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 duckdb/duckdb-skills 官方仓库（v0.2.4，MIT）的 README、marketplace.json 与 skills/*/SKILL.md 编写。

## 速查

- **装**：`/plugin marketplace add duckdb/duckdb-skills` → `/plugin install duckdb-skills@duckdb-skills`（Claude Code 插件）
- **调用**：`/duckdb-skills:<skill-name>`
- **9 skill**：read-file · query · attach-db · s3-explore · convert-file · spatial · duckdb-docs · read-memories · install-duckdb
- **前置**：DuckDB CLI（`brew install duckdb` / `curl -fsSL https://install.duckdb.org | sh` / `winget install DuckDB.cli`）
- **状态**：共享 `state.sql`，只追加幂等，`duckdb -init state.sql` 恢复
- **平台**：macOS / Linux 已测，Windows 未完全支持
- **许可**：MIT · **出品**：DuckDB 官方（`duckdb` 组织），非 MotherDuck

## 9 skill 全表

| skill | 触发/参数 | 覆盖 |
| --- | --- | --- |
| `read-file` | `<文件或 URL> [问题]` | `read_any` 宏按扩展名读 CSV/JSON/Parquet/Avro/Excel/SQLite/空间/Jupyter；本地/远程；DESCRIBE + 行数 + 样本 |
| `query` | `<SQL 或问题> [--file]` | ad-hoc（沙箱）/ session（信任库）两模式；Friendly SQL；结果规模估算防爆 token |
| `attach-db` | `<path.duckdb>` | 附加库、探索 schema（表/列/行数）、写 `state.sql`；支持多库追加 |
| `s3-explore` | `<s3/r2/gs URL> [问题]` | 列桶（不下载）、预览远程 Parquet/CSV、`parquet_metadata` 拿行数、谓词下推 |
| `convert-file` | `<输入> [输出]` | `COPY` 转 CSV/Parquet/JSON/Excel/GeoJSON；`PARTITION_BY`、`CODEC 'zstd'` |
| `spatial` | `<问题或文件>` | 空间扩展 + Overture Maps；`ST_Distance_Spheroid`/`ST_Contains`/H3；bbox 下推 |
| `duckdb-docs` | `<问题或关键词>` | FTS（BM25）搜 DuckDB 文档+博客 / DuckLake；本地缓存索引（>2 天刷新） |
| `read-memories` | `<关键词> [--here]` | `read_ndjson` 搜历史会话日志 `~/.claude/projects/*/*.jsonl`；静默恢复上下文 |
| `install-duckdb` | `[--update] [ext@repo...]` | `INSTALL name`/`INSTALL name FROM repo`；`--update` 更新扩展 + 检查 CLI 版本 |

## 安装与调用

```text
# 安装（Claude Code 内）
/plugin marketplace add duckdb/duckdb-skills
/plugin install duckdb-skills@duckdb-skills

# 更新
/plugin marketplace update duckdb-skills
/plugin update duckdb-skills@duckdb-skills

# 调用示例
/duckdb-skills:read-file variants.parquet what columns does it have?
/duckdb-skills:query FROM sales LIMIT 10
/duckdb-skills:duckdb-docs window functions
```

DuckDB CLI 是硬前置；未装时 skill 会引导 `install-duckdb`。

## DuckDB 关键：Friendly SQL

| 惯用法 | 说明 |
| --- | --- |
| `FROM t WHERE ...` | FROM 前置，隐式 `SELECT *` |
| `GROUP BY ALL` / `ORDER BY ALL` | 按所有非聚合列分组 / 按所有列排序 |
| `SELECT * EXCLUDE (c)` / `REPLACE (e AS c)` | 通配里剔除 / 就地改列 |
| `COLUMNS('regex')` | 正则批量选列、施加表达式 |
| `count()` | 无需 `count(*)` |
| `FILTER (WHERE ...)` | 条件聚合 |
| `SUMMARIZE t` / `DESCRIBE t` | 统计画像 / 结构 |
| `PIVOT` / `UNPIVOT` | 宽长互转 |
| `FROM 'file.parquet'` / `'data/*.csv'` | 直读文件 / 通配多文件 |

## DuckDB 关键：常用扩展

| 扩展 | 用途 | 装/加载 |
| --- | --- | --- |
| `httpfs` | 远程 / S3 / GCS / Azure | `INSTALL httpfs; LOAD httpfs;` |
| `spatial` | 地理空间（GDAL 50+ 格式） | `INSTALL spatial; LOAD spatial;` |
| `fts` | 全文搜索（BM25） | `INSTALL fts;` |
| `excel` | 读写 `.xlsx` | `INSTALL excel; LOAD excel;` |
| `sqlite_scanner` | 读 SQLite 库 | `INSTALL sqlite_scanner; LOAD sqlite_scanner;` |
| `avro` | 读 Avro | `INSTALL avro; LOAD avro;` |
| `h3` | 六边形空间分箱（社区） | `INSTALL h3 FROM community; LOAD h3;` |

## 会话状态 state.sql

- **内容**：`ATTACH` / `USE` / `LOAD` / `CREATE SECRET` / `CREATE MACRO` 的纯 SQL
- **特性**：每项目一份、所有 skill 共享；**只追加、幂等**（`ATTACH IF NOT EXISTS` + 查重）
- **位置**：项目 `.duckdb-skills/state.sql`（可 gitignore）或主目录 `~/.duckdb-skills/<project-id>/state.sql`
- **恢复**：`duckdb -init "$STATE_DIR/state.sql" -c "<QUERY>"`

## 协作关系

- `read-file` 建议接 `query` 深入探索，建议 `attach-db` 持久化大文件
- `query` / `read-file` / `read-memories` 遇 DuckDB 报错自动查 `duckdb-docs`
- 所有 skill 共享 `state.sql`——`read-file` 建的 SECRET/宏被 `query` 复用，`attach-db` 附加的库处处可见
- 缺扩展时各 skill 自动委派 `install-duckdb`

## 平台与许可

- **平台**：macOS / Linux 已测；Windows 尚未完全支持（部分 shell/路径可能异常）
- **许可**：MIT（Copyright DuckDB Foundation）
- **版本**：插件 v0.2.4
- **出品**：DuckDB 官方（GitHub `duckdb` 组织 / DuckDB Foundation），**非 MotherDuck** 社区/云服务

## 资源链接

- 仓库：[duckdb/duckdb-skills](https://github.com/duckdb/duckdb-skills)（MIT）
- DuckDB 文档：[duckdb.org/docs](https://duckdb.org/docs/)
- Friendly SQL：[duckdb.org/docs/sql/dialect/friendly_sql](https://duckdb.org/docs/sql/dialect/friendly_sql)
- DuckLake：[ducklake.select/docs](https://ducklake.select/docs)
- Issues：[github.com/duckdb/duckdb-skills/issues](https://github.com/duckdb/duckdb-skills/issues)

## 下一步

- 回到 [入门](./getting-started) 或 [指南](./guide-line)
- 实战：装好后从 `/duckdb-skills:read-file` 开始
