---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 duckdb/duckdb-skills 官方仓库（v0.2.4，MIT）的各 skills/*/SKILL.md 逐字通读编写。

## 速查

- **三类 skill**：查询核心（`read-file`/`query`/`attach-db`）· 远程与格式（`s3-explore`/`convert-file`/`spatial`）· 辅助（`duckdb-docs`/`read-memories`/`install-duckdb`）
- **共享 `state.sql`**：ATTACH/USE/LOAD/SECRET/宏，只追加、幂等，`duckdb -init state.sql` 恢复；存项目 `.duckdb-skills/` 或 `~/.duckdb-skills/<project-id>/`
- **`read-file` 核心**：内联 `read_any(file_name)` 表宏，按扩展名 `ILIKE` 分派到 `read_csv`/`read_json_auto`/`read_parquet`/`read_avro`/`read_xlsx`/`st_read`/`sqlite_scan`
- **`query` 两模式**：ad-hoc（沙箱：`enable_external_access=false` + `allowed_paths` + `lock_configuration=true`）vs session（信任库，`-init state.sql`）；先估结果规模（>100 万行 / >10GB 提醒）
- **`s3-explore` 不下载**：列桶只取 `filename/size/last_modified`（不选 `content`）；Parquet 用 `parquet_metadata` 拿行数；谓词下推
- **`spatial` 三铁律**：`SET geometry_always_xy = true`、bbox 先过滤（下推）、球面函数 `ST_Distance_Spheroid` 需 `POINT_2D`
- **`duckdb-docs`**：`INSTALL httpfs; INSTALL fts;` → `match_bm25` 搜本地缓存索引（>2 天刷新）；DuckDB 与 DuckLake 两套索引
- 出错各 skill 自动查 `duckdb-docs`；缺扩展自动 `install-duckdb`

## 会话状态 state.sql：所有 skill 的粘合剂

理解这组 skill，先理解 `state.sql`——**每个项目一份、所有 skill 共享**的 DuckDB 初始化文件：

- 内容是纯 SQL：`ATTACH` / `USE` / `LOAD` / `CREATE SECRET` / `CREATE MACRO`
- **只追加、幂等**（append-only, idempotent）：`attach-db` 追加时先 `grep` 查重、用 `ATTACH IF NOT EXISTS`，绝不覆盖别的 skill 写的内容
- 恢复方式统一：`duckdb -init "$STATE_DIR/state.sql" -c "<QUERY>"`
- 存两处任选：**项目**（`.duckdb-skills/state.sql`，可选 gitignore）或**主目录**（`~/.duckdb-skills/<project-id>/state.sql`，`project-id` 由项目根路径把 `/` 换成 `-` 得到）

正因为共享这一份状态，`read-file` 建的 SECRET/宏能被 `query` 复用，`attach-db` 附加的库在各处都可见。

## attach-db：附加库 + 探索 schema

`attach-db <path.duckdb>` 的完整流程：

1. **解析路径**：相对路径按 `$PWD` 解析成绝对路径；文件不存在时问是否新建空库（DuckDB 首次写入才落盘）
2. **校验库**：`duckdb "$DB" -c "PRAGMA version;"`，失败即报（损坏/非 DuckDB 文件）
3. **探索 schema**：`FROM duckdb_tables()` 列所有表（含 `estimated_size`），再对每张表（最多 20）`DESCRIBE` + 数行数
4. **解析状态目录**：先查两处是否已有 `state.sql`，没有则问用户存哪
5. **追加状态**：查重后 `ATTACH IF NOT EXISTS '<path>' AS <alias>;` + `USE <alias>;`（别名默认取文件名去扩展名，冲突则问你）
6. **验证 + 汇报**：`duckdb -init state.sql -c "SHOW TABLES;"` 确认可用，然后汇报路径/别名/各表列数行数

支持**多库**：再跑 `attach-db` 会往同一 `state.sql` 追加新的 ATTACH。

## query：Friendly SQL + 两种执行模式

`query` 接受**原始 SQL 或自然语言**，是这组 skill 的查询核心。

### 两种模式

- **session 模式**：`state.sql` 存在且输入引用表名/自然语言/无文件引用的 SQL → `duckdb -init "$STATE_DIR/state.sql" -csv -c "<QUERY>"`，查信任的已附加库
- **ad-hoc 模式**：带 `--file`、或 SQL 里直接引用文件（`FROM 'data.csv'`）、或没有 `state.sql` → 对 `:memory:` 跑，**开沙箱**：

```bash
duckdb :memory: -csv <<'SQL'
SET allowed_paths=['FILE_PATH'];
SET enable_external_access=false;
SET allow_persistent_secrets=false;
SET lock_configuration=true;
<QUERY>;
SQL
```

沙箱四设置只放行被引用的那个文件、禁外部访问、禁持久 secret、锁死配置——ad-hoc 查陌生文件更安全。

### 先估规模，防爆 token

执行前 `query` 会估结果规模（session 用 `duckdb_tables()` 的 `estimated_size`，ad-hoc 探源 `count()`）：

- 已有 `LIMIT`/`count()`/聚合 → 安全，直接跑
- 源 **>100 万行**且无 LIMIT/聚合 → 提醒「结果太大会烧很多 token，建议加 `LIMIT 1000` 或聚合」，等你确认
- 数据 **>10GB** → 额外提醒查询可能较慢

`DESCRIBE`/`SUMMARIZE`/聚合这类天然有界的查询跳过估算。

### Friendly SQL 常用式

生成 SQL 时优先这些 DuckDB 惯用法（更短更好写）：

```sql
FROM sales WHERE amount > 100          -- FROM 前置，隐式 SELECT *
SELECT * EXCLUDE (id, updated_at)      -- 通配里剔除列
SELECT * REPLACE (upper(name) AS name) -- 通配里就地改列
GROUP BY ALL                            -- 按所有非聚合列自动分组
ORDER BY ALL                            -- 按所有列排序，结果确定
SELECT count() FILTER (WHERE x > 10)   -- 条件聚合
COLUMNS('sales_.*')                     -- 正则批量选列 / 施加表达式
SUMMARIZE sales                         -- 一键统计画像
PIVOT / UNPIVOT                         -- 宽长互转
```

出错时自愈：语法错→改并重跑；缺扩展→`install-duckdb`；表不存在→列 `duckdb_tables()`；文件找不到→`find` 定位；说不清的错→查 `duckdb-docs`。

## read-file：一个宏读万物

`read-file` 的核心是一个内联的 **`read_any` 表宏**——按文件扩展名 `ILIKE` 分派到对应的 `read_*` 函数：

| 扩展名 | 读取函数 |
| --- | --- |
| `.json` / `.jsonl` / `.ndjson` / `.geojson` / `.har` | `read_json_auto` |
| `.csv` / `.tsv` / `.tab` / `.txt` | `read_csv` |
| `.parquet` / `.pq` | `read_parquet` |
| `.avro` | `read_avro` |
| `.xlsx` / `.xls` | `read_xlsx` |
| `.shp` / `.gpkg` / `.fgb` / `.kml` | `st_read`（空间） |
| `.ipynb` | 解析 Jupyter cells |
| `.db` / `.sqlite` / `.sqlite3` | `sqlite_scan` |
| 其它 | `read_blob` |

读完自动 `DESCRIBE` + 数行数 + 取前 20 行，然后回答你的问题。**远程文件**按协议前置扩展与 SECRET：`https://` 前加 `LOAD httpfs;`；`s3://` 加 `LOAD httpfs; CREATE SECRET (TYPE S3, PROVIDER credential_chain);`；GCS/Azure 类推。缺扩展（spatial/xlsx/sqlite）时补 `INSTALL ...; LOAD ...;` 重试。

## s3-explore：远程对象存储，零下载

`s3-explore` 探查 S3 / Cloudflare R2 / GCS / MinIO 等，关键是**不把文件拉下来**：

- **列桶**：`read_blob('<url>/*')` 只选 `filename, size, last_modified`——**绝不选 `content`**（那会下载真身）
- **Parquet 行数**：从元数据取，不读数据：

```sql
SELECT file_name,
       sum(row_group_num_rows) AS total_rows,
       (sum(row_group_compressed_bytes)/1024/1024)::DECIMAL(10,1) AS compressed_mb
FROM parquet_metadata('<url>')
GROUP BY file_name;
```

- **谓词下推**：DuckDB 把 `WHERE` 下推进 S3 上的 Parquet，即使远程大数据集也能高效过滤
- 凭证走 `CREATE SECRET (TYPE S3/R2/GCS, PROVIDER credential_chain)`；公开桶（如 Overture、AWS Open Data）无需 secret

## convert-file：格式互转

`convert-file <input> [output]` 用一条 `COPY` 转格式，输出格式由输出扩展名推断：

```sql
COPY (FROM 'data.csv') TO 'data.parquet';                    -- 默认 Parquet
COPY (FROM 'data.csv') TO 'out.json' (FORMAT json, ARRAY true);
COPY (FROM 'data.csv') TO 'out.xlsx' (FORMAT xlsx);          -- 需 LOAD excel
```

- 不给输出名时默认转成同名 `.parquet`
- 提到「按 year 分区」→ 加 `PARTITION_BY (col)`（仅 Parquet/CSV）
- 提到「用 zstd」→ Parquet 加 `CODEC 'zstd'`
- 远程输入（`s3://`/`https://`）前置同 `read-file` 的协议设置
- 意义：Parquet/Excel 等二进制格式 AI 无法直接产出，交给 DuckDB 写

## spatial：空间分析 + Overture Maps

`spatial` 用 DuckDB 空间扩展答地理问题，缺数据时用 **Overture Maps**（免费全球 POI/建筑/道路/边界，GeoParquet on S3，**无需 API key**）。三条铁律：

- **`SET geometry_always_xy = true`**：让所有空间函数按「经度, 纬度」解释坐标（Overture/GeoJSON 标准）；不设则球面函数会把纬度当第一位、结果全错
- **bbox 先过滤**：查 Overture 一律先按 `bbox.xmin/xmax/ymin/ymax` 过滤，利用 Parquet 谓词下推避免拉全量
- **真实距离用球面函数**：`ST_Distance_Spheroid` 返回 WGS84 米；但它要 `POINT_2D` 输入，Overture 的 `GEOMETRY('OGC:CRS84')` 不能直接 cast，要先 `ST_Point(ST_X(geom), ST_Y(geom))::POINT_2D`

常用：`ST_Read`（GeoJSON/Shapefile/GPX 等 50+ 格式）、`ST_Contains`（点在面内）、H3 六边形分箱（`INSTALL h3 FROM community`）、`COPY ... (FORMAT GDAL, DRIVER 'GeoJSON')` 导出可视化。

## 辅助三件：duckdb-docs / read-memories / install-duckdb

- **`duckdb-docs <关键词>`**：`INSTALL httpfs; INSTALL fts;` 后用 `fts_main_docs_chunks.match_bm25(...)` 对本地缓存索引做全文搜索。索引托管在 `duckdb.org/data/docs-search.duckdb`（DuckDB 文档 + 博客）和 `ducklake.select/data/docs-search.duckdb`（DuckLake），缓存 >2 天自动重拉。自然语言问题会先抽取技术关键词再搜。
- **`read-memories <关键词> [--here]`**：用 `read_ndjson` 搜历史 Claude Code 会话日志（`~/.claude/projects/*/*.jsonl`），恢复过往决策/模式/未决 TODO。`--here` 只搜当前项目。它**静默**工作——吸收结果、不向你复述原始日志。
- **`install-duckdb [--update] [ext...]`**：`name` → `INSTALL name;`；`name@repo` → `INSTALL name FROM repo;`（社区扩展如 `gcs@community`）。`--update` 更新扩展，并对比 `latest_stable_version.txt` 检查 CLI 是否最新、必要时引导升级。

## DuckDB 直读文件：不必先建表

这组 skill 的威力根源，是 DuckDB **直接把文件当表查**：

```sql
FROM 'sales.parquet' WHERE region = 'APAC';   -- 直接查 Parquet
FROM 'data/part-*.parquet';                     -- 通配读多文件
SELECT * FROM read_csv('big.csv', auto_detect=true);
FROM read_json_auto('events.ndjson');
```

CSV 表头/类型自动推断、Parquet 列裁剪 + 谓词下推、多文件通配一把读——无需 `CREATE TABLE` + `INSERT` 的落库步骤，这正是「嵌入式 OLAP + 直读文件」的价值。

## 反模式（别这么干）

- **列远程桶时选 `content`**：会把每个文件真身下载下来——只选 `filename/size/last_modified`
- **对大表不加 LIMIT/聚合直接查**：结果打回对话会烧海量 token；`query` 会拦你，别硬跑
- **空间查询忘了 `geometry_always_xy = true`**：球面距离全错（经纬顺序反了）
- **查 Overture 不先 bbox 过滤**：等于拉全球数据集，又慢又贵
- **手动覆盖 `state.sql`**：它是所有 skill 共享的追加式文件，覆盖会丢别的 skill 的 SECRET/宏
- **以为它是 MotherDuck**：这是本地开源 DuckDB 的 skill，不是云端 serverless 服务
- **用 `npx skills add` 装**：它是 Claude Code 插件，用 `/plugin marketplace add` + `/plugin install`

## 下一步

- [参考](./reference) —— skill 清单表、安装、DuckDB 关键、state.sql、许可、链接
- 上游：[DuckDB 官方文档](https://duckdb.org/docs/) · [Friendly SQL](https://duckdb.org/docs/sql/dialect/friendly_sql)
