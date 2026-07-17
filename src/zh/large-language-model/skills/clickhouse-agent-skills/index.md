---
layout: doc
---

# ClickHouse Agent Skills

ClickHouse Agent Skills 是 **ClickHouse 官方**（源在 `ClickHouse/agent-skills`，Apache-2.0，★492）出品的一组 agent 技能——「The official Agent Skills for ClickHouse and ClickHouse Cloud」，帮 LLM 与 agent 在用 ClickHouse（列式 OLAP 数据库）及 **chdb**（in-process ClickHouse for Python）时采用最佳实践。同时支持开源 ClickHouse 与托管 ClickHouse Cloud。仓库含 **11 个 skill**，核心是 `clickhouse-best-practices`（**31 条规则 / 4 大类**：schema 设计、query 优化、insert 摄取、agent 连接工作流，按 impact 排序）——规则优先于「通用数据库直觉」，因为 ClickHouse 有列式存储、稀疏索引、MergeTree 合并机制等特有行为，通用直觉常误导。

## 评价

**优点**

- **ClickHouse 官方**：ClickHouse Inc. 出品、随产品演进、覆盖 OSS + Cloud
- **规则优先**：best-practices 明确「回答前先查 `rules/`，命中就用并 cite『Per rule-name…』」——避免用通用 DB 直觉误答列式库
- **agent 查询工作流**：Connect（MCP/CLI）→ Discover（7 步 schema 探索）→ Plan（用 sort key + skip index 写 WHERE）→ Execute（LIMIT + 超时）→ Recover（超时/内存错误则收窄过滤重试）
- **chdb 覆盖**：chdb-sql / chdb-datastore（Python 内嵌 ClickHouse）
- **JS/Node 全套**：coding / rowbinary / troubleshooting
- **clickhousectl**：local-dev（本地开发环境）/ cloud-deploy（云部署）+ `clickhousectl skills` 一键装
- **可观测**：clickstack-otel-collector；managed-postgres-rca 根因分析
- 安装 `npx skills add clickhouse/agent-skills` 或 `clickhousectl skills`

**缺点 / 边界**

- **面向 ClickHouse/chdb**：非通用数据库技能
- **规则须真读**：best-practices 要求 agent 读 `rules/*.md` 并引用，不是记忆
- **偏 OLAP 场景**：列式分析型，非 OLTP
- **JS/Node 侧重**：客户端 skill 目前主要 js-node

## 适用场景

- 用 AI 审查/优化 ClickHouse schema、query、配置（照 31 规则）
- agent 连 ClickHouse 做 schema 探索 + 安全查询（LIMIT/超时/渐进）
- 用 chdb 在 Python 里跑 in-process ClickHouse
- ClickHouse Cloud 部署（clickhousectl）、JS/Node 客户端编码

## 边界

- **ClickHouse/chdb 专用**（OLAP 列式）
- **规则驱动**：须读 rules/ 并引用
- **贡献到 ClickHouse/agent-skills**（官方）

## 官方文档

[ClickHouse Best Practices](https://clickhouse.com/docs/best-practices) ｜ [chdb 文档](https://clickhouse.com/docs/chdb) ｜ [clickhouse.com/docs](https://clickhouse.com/docs)

## GitHub 地址

[ClickHouse/agent-skills](https://github.com/ClickHouse/agent-skills)（官方，Apache-2.0）

## 内容地图

- [入门](./getting-started) —— 定位、安装、11 skill 总览、best-practices 规则优先、agent 工作流
- [指南](./guide-line) —— best-practices 31 规则/4 类、agent 5 步工作流、chdb、clickhousectl、js-node
- [参考](./reference) —— 11 skill 清单、安装、规则类别、chdb/clickhousectl、许可

## 幻灯片地址

<a href="/SlideStack/clickhouse-agent-skills-slide/" target="_blank">ClickHouse Agent Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=634" target="_blank" rel="noopener noreferrer">ClickHouse Agent Skills 测试题</a>
