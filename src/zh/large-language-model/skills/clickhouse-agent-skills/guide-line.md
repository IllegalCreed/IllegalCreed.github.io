---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 ClickHouse/agent-skills 官方各 SKILL.md 编写（clickhouse-best-practices 等）。

## 速查

- **best-practices**：31 规则 / 4 类（**schema** 设计 / **query** 优化 / **insert** 摄取 / **agent** 连接工作流），按 impact 排序，MUST USE 审 schema/query/config
- **agent 5 步**：Connect（MCP/CLI）→ Discover（7 步 schema）→ Plan（sort key+skip index 写 WHERE）→ Execute（LIMIT+超时）→ Recover（收窄重试）
- **7 步 schema 探索**：databases → tables → columns+comments → sort keys → skip indexes → sample → EXPLAIN
- **chdb**：in-process ClickHouse for Python（chdb-sql / chdb-datastore）
- **clickhousectl**：local-dev / cloud-deploy
- **js-node**：coding / rowbinary / troubleshooting

## clickhouse-best-practices：31 规则 / 4 类

`description` 明确「审查 ClickHouse schema / query / config 时 **MUST USE**，含 31 条必须先检查的规则，回答时引用具体规则」。4 大类（按 impact 排序）：

| 类 | 覆盖 |
| --- | --- |
| **schema** | 表结构设计（引擎、排序键 ORDER BY、分区、编解码、数据类型、低基数、稀疏索引） |
| **query** | 查询优化（用排序键/skip index 命中、避免全表扫、EXPLAIN、聚合） |
| **insert** | 数据摄取（批量、异步插入、去重、幂等） |
| **agent** | agent 连接 + 查询工作流（见下） |

> 应用铁律：先查 `rules/` → 命中就用并 cite「Per `rule-name`…」→ 无规则才用通用知识/文档 → 始终标注来源。

## agent 查询工作流（5 步）

`agent` 类的三条 CRITICAL 规则（agent-connect-mcp / agent-discovery-schema / agent-query-safety）定义每个 agent 会话应走的序列：

1. **Connect** —— 经 MCP 或 CLI 建连（凭据发现、选输出格式）
2. **Discover** —— **7 步 schema 探索**：databases → tables → columns + comments → sort keys → skip indexes → sample → EXPLAIN
3. **Plan** —— 用 sort key 和 skip index 知识写高效 WHERE 子句
4. **Execute** —— 带 **LIMIT + 超时** 跑查询
5. **Recover** —— 遇超时/内存错误，收窄过滤条件再重试（渐进探索）

## chdb（Python 内嵌 ClickHouse）

`chdb-sql` / `chdb-datastore`：chdb 是 in-process ClickHouse for Python，无需独立服务器，在 Python 进程里直接跑 ClickHouse SQL、读数据。适合数据科学/嵌入式分析。

## clickhousectl 与 JS/Node

- `clickhousectl-local-dev`：用 `clickhousectl` 建本地 ClickHouse 开发环境（装 CLI、初始化项目、起服务器、建 schema、seed、验证）
- `clickhousectl-cloud-deploy`：部署到 ClickHouse Cloud
- `clickhouse-js-node-coding` / `-rowbinary` / `-troubleshooting`：JS/Node 客户端编码、RowBinary 格式、排障

## 反模式

| 反模式 | 正确 |
| --- | --- |
| 用通用 DB 直觉设计 ClickHouse 表 | 查 `rules/` schema 类（列式/排序键/稀疏索引特有） |
| 查询不带 LIMIT/超时 | agent-query-safety：LIMIT + 超时 + 渐进探索 |
| 跳过 schema 探索直接查 | 先走 7 步 Discover（sort key/skip index） |
| 回答不引用规则来源 | cite「Per `rule-name`…」或标注来源 |
| 逐行小批插入 | insert 类规则：批量/异步插入 |

## 下一步

- [参考](./reference) —— 11 skill 清单、安装、规则类别、chdb/clickhousectl、许可
- 上游：[ClickHouse/agent-skills](https://github.com/ClickHouse/agent-skills) · [clickhouse.com/docs/best-practices](https://clickhouse.com/docs/best-practices)
