---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 ClickHouse/agent-skills 官方仓库与各 SKILL.md 编写。

## 速查

- **装**：`npx skills add clickhouse/agent-skills` 或 `clickhousectl skills`
- **11 skill**：best-practices（31 规则）/architecture-advisor/chdb-sql/chdb-datastore/js-node×3/clickhousectl×2/managed-postgres-rca/clickstack-otel-collector
- **best-practices 4 类**：schema / query / insert / agent
- **agent 工作流**：Connect→Discover(7 步)→Plan→Execute→Recover
- **官方**：ClickHouse Inc.，Apache-2.0

## 11 skill 清单

| skill | 用途 |
| --- | --- |
| `clickhouse-best-practices` | 31 规则 / 4 类，审 schema/query/config（MUST USE） |
| `clickhouse-architecture-advisor` | 架构建议 |
| `chdb-sql` | chdb（Python 内嵌 ClickHouse）SQL |
| `chdb-datastore` | chdb 数据存储 |
| `clickhouse-js-node-coding` | JS/Node 客户端编码 |
| `clickhouse-js-node-rowbinary` | RowBinary 格式 |
| `clickhouse-js-node-troubleshooting` | JS/Node 排障 |
| `clickhousectl-local-dev` | 本地开发环境 |
| `clickhousectl-cloud-deploy` | ClickHouse Cloud 部署 |
| `clickhouse-managed-postgres-rca` | 托管 Postgres 根因分析 |
| `clickstack-otel-collector` | ClickStack OTel collector 可观测 |

## best-practices 4 类

| 类 | 覆盖 |
| --- | --- |
| schema | 引擎、ORDER BY 排序键、分区、编解码、类型、低基数、稀疏索引 |
| query | 命中排序键/skip index、避免全表扫、EXPLAIN、聚合 |
| insert | 批量/异步插入、去重、幂等 |
| agent | 连接（agent-connect-mcp）、schema 探索（agent-discovery-schema）、查询安全（agent-query-safety） |

## agent 查询工作流

1. Connect（MCP/CLI，凭据发现，选输出格式）
2. Discover（7 步：databases→tables→columns+comments→sort keys→skip indexes→sample→EXPLAIN）
3. Plan（用 sort key + skip index 写 WHERE）
4. Execute（LIMIT + 超时）
5. Recover（超时/内存错误 → 收窄过滤重试）

## 应用规则的优先级

1. 查 `rules/` 有无适用规则
2. 有 → 应用并 cite「Per `rule-name`…」
3. 无 → LLM 知识 / 文档
4. 不确定 → web 搜
5. 始终标注来源

## 安装与许可

- **npx**：`npx skills add clickhouse/agent-skills`（自动探测已装 agent）
- **clickhousectl**：`clickhousectl skills`
- **许可**：Apache-2.0，作者 ClickHouse Inc.
- **贡献**：改 ClickHouse/agent-skills

## 资源链接

- 仓库：[ClickHouse/agent-skills](https://github.com/ClickHouse/agent-skills)
- Best Practices：[clickhouse.com/docs/best-practices](https://clickhouse.com/docs/best-practices)
- chdb：[clickhouse.com/docs/chdb](https://clickhouse.com/docs/chdb)
- 相关叶：[DuckDB Skills](../duckdb-skills/)（同「数据库与数据工程」组，另一 OLAP）
