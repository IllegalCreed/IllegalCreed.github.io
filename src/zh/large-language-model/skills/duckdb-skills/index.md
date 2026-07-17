---
layout: doc
---

# DuckDB Skills

DuckDB Skills（`duckdb/duckdb-skills`）是 **DuckDB 官方**（GitHub `duckdb` 组织，非 MotherDuck 社区）出品的一个 **Claude Code 插件**，把 DuckDB 的数据探索能力打包成一组可按需调用的 skill，MIT 开源（v0.2.4）。装上后，你在对话里就能「读任意数据文件、附加并查询 DuckDB 库、搜 DuckDB/DuckLake 文档、检索历史会话、装/更新扩展」——底层全靠本地的 DuckDB CLI。DuckDB 本身是一个 **in-process（进程内 / 嵌入式）分析型（OLAP）SQL 数据库**：列式向量化执行、零外部依赖、无需起服务，能**直接查询** CSV / Parquet / JSON 等文件，被称为「分析界的 SQLite」。这组 skill 就是把「DuckDB 直读文件 + Friendly SQL」的威力接到 AI agent 的手上。

## 评价

**优点**

- **官方出品**：来自 `duckdb` 组织（DuckDB Foundation / DuckDB Labs），非第三方封装，扩展/SQL 用法跟随官方
- **直读文件不落库**：`read-file` 用一个 `read_any` 表宏按扩展名自动分派，CSV/JSON/Parquet/Avro/Excel/SQLite/空间/Jupyter 一把梭；`query` 可直接 `FROM 'data.parquet'`
- **会话状态可复用**：所有 skill 共享一个 `state.sql`（ATTACH/USE/LOAD/SECRET/宏），**只追加、幂等**，任何 skill 用 `duckdb -init state.sql` 恢复会话
- **省 token 的安全设计**：`query` 先估结果规模（>100 万行 / >10GB 提醒），ad-hoc 模式开沙箱（`enable_external_access=false` + `allowed_paths` + `lock_configuration`）
- **远程零下载**：`s3-explore` 用 `parquet_metadata` / `read_blob` 只取文件名/大小/行数，靠谓词下推在 S3/R2/GCS 上过滤，不拉全量
- **文档可检索**：`duckdb-docs` 用 FTS（BM25）搜官方文档 + 博客，本地缓存索引（>2 天自动刷新）
- **技能会互相协作**：`read-file` 建议接 `query`，出错时各 skill 自动查 `duckdb-docs`

**缺点 / 边界**

- **依赖本地 DuckDB CLI**：CLI 没装时 skill 会引导你用 `install-duckdb` 装（`brew` / `curl install.duckdb.org` / `winget`）
- **平台支持**：官方只在 **macOS / Linux** 测过，**Windows 尚未完全支持**（部分 shell 命令、路径处理可能异常）
- **不是 MotherDuck**：这是纯本地开源 DuckDB 的 skill，不是 MotherDuck 的云端 serverless DuckDB 服务
- **装法不是 `npx skills add`**：它以 **Claude Code 插件**分发（`/plugin marketplace add` + `/plugin install`），与部分 agentskills.io 生态的叶子装法不同

## 适用场景

- 手头有 CSV/Parquet/JSON/Excel 等数据文件，想快速看结构、行数、样本（`read-file`）
- 想用 SQL 或自然语言查本地文件 / DuckDB 库（`query`，Friendly SQL）
- 探查 S3/R2/GCS 上的远程数据集，不想先下载（`s3-explore`）
- 格式转换（CSV → Parquet、导出 Excel/GeoJSON）（`convert-file`）
- 空间数据分析、用 Overture Maps 免费全球数据（`spatial`）
- 查 DuckDB 语法 / 恢复历史会话上下文（`duckdb-docs` / `read-memories`）

## 边界

- **是插件（技能集），不是单个 skill**：9 个 skill 各有触发条件，按需激活
- **能力上限 = DuckDB + 扩展**：缺扩展时靠 `install-duckdb` 补（`spatial`/`httpfs`/`fts`/`excel`/`sqlite_scanner` 等）
- **只读优先**：探索类 skill 偏只读；写操作（`convert-file` 的 COPY）明确落到你指定的输出文件
- **DuckLake 归 DuckLake**：湖仓/目录相关能力走 DuckLake 文档索引，`duckdb-docs` 可切换

## 官方文档

[DuckDB 官方文档](https://duckdb.org/docs/) ｜ [DuckDB Friendly SQL](https://duckdb.org/docs/sql/dialect/friendly_sql) ｜ [DuckLake](https://ducklake.select/docs)

## GitHub 地址

[duckdb/duckdb-skills](https://github.com/duckdb/duckdb-skills)（MIT，v0.2.4）

## 内容地图

- [入门](./getting-started) —— 定位（官方 duckdb org、in-process OLAP）、Claude Code 插件安装、9 个 skill 总览
- [指南](./guide-line) —— 各 skill 逐讲（attach-db / query / read-file / s3-explore / convert-file / spatial / duckdb-docs / read-memories / install-duckdb）、DuckDB 直读文件用法、反模式
- [参考](./reference) —— skill 清单表、安装、DuckDB 关键（Friendly SQL / 扩展）、state.sql、许可 MIT、链接

## 幻灯片地址

<a href="/SlideStack/duckdb-skills-slide/" target="_blank">DuckDB Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=635" target="_blank" rel="noopener noreferrer">DuckDB Skills 测试题</a>
