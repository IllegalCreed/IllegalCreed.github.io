---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 ClickHouse/agent-skills 官方仓库 README 与各 SKILL.md 编写。

## 速查

- **是什么**：ClickHouse 官方 agent 技能，帮 LLM 用 ClickHouse + chdb 采用最佳实践
- **覆盖**：开源 ClickHouse + 托管 ClickHouse Cloud
- **装**：`npx skills add clickhouse/agent-skills`（CLI 自动探测已装 agent）或 `clickhousectl skills`
- **核心 skill**：`clickhouse-best-practices`（**31 规则 / 4 类**：schema/query/insert/agent，按 impact 排序）
- **规则优先**：回答前先查 `rules/`，命中就用并 cite「Per rule-name…」
- **agent 工作流**：Connect → Discover(7 步) → Plan → Execute → Recover
- **11 skill**：best-practices/architecture-advisor/chdb-sql/chdb-datastore/js-node×3/clickhousectl×2/managed-postgres-rca/clickstack-otel-collector
- **官方**：ClickHouse Inc.，Apache-2.0

## 安装

```bash
# npx（自动探测已装 agent，提示选安装位置）
npx skills add clickhouse/agent-skills

# 或用 ClickHouse CLI clickhousectl
clickhousectl skills
```

## 11 个 skill 总览

| 类 | skill |
| --- | --- |
| 最佳实践 | `clickhouse-best-practices`（31 规则）、`clickhouse-architecture-advisor` |
| chdb（Python 内嵌）| `chdb-sql`、`chdb-datastore` |
| JS/Node 客户端 | `clickhouse-js-node-coding`、`-rowbinary`、`-troubleshooting` |
| clickhousectl | `clickhousectl-local-dev`、`clickhousectl-cloud-deploy` |
| 运维/可观测 | `clickhouse-managed-postgres-rca`、`clickstack-otel-collector` |

## 为什么「规则优先于直觉」

`clickhouse-best-practices` 开宗明义：回答 ClickHouse 问题前按优先级——①查 `rules/` 有无适用规则 ②有则应用并引用「Per `rule-name`…」③无则用 LLM 知识/查文档 ④不确定则 web 搜 ⑤**始终标注来源**。原因：ClickHouse 有**列式存储、稀疏索引、MergeTree 合并**等特有行为，通用数据库直觉会误导——规则编码了经验证的 ClickHouse 专属指导。

## 下一步

- [指南](./guide-line) —— best-practices 31 规则/4 类、agent 5 步工作流、chdb、clickhousectl
- [参考](./reference) —— 11 skill 清单、安装、规则类别、许可
