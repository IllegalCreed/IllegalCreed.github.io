---
layout: doc
outline: [2, 3]
---

# 入门：时序数据与 InfluxDB 演进

> 基于 InfluxDB 3 Core/Enterprise · 核于 2026-08

## 速查

- **时序数据（Time-Series）**：每个数据点带**时间戳**的数据——监控指标（CPU/内存/QPS）、IoT 传感器（温度/湿度）、APM（请求耗时）、金融行情。特征是**写多读少、按时间排序、追加为主、近期数据热查**。
- **为何需要专用 TSDB**：通用关系库（MySQL/PG）为事务与随机更新优化，面对时序场景（亿级点/秒写入、按时间窗口聚合）会力不从心。专用 TSDB 按时间组织存储、批量写入、列式聚合，性能与压缩远胜关系库。
- **InfluxDB 定义**：InfluxData 开源的**专用时序数据库**，按 measurement/tag/field/timestamp 四元组组织数据，专为高吞吐写入与时间窗口聚合设计。
- **数据模型四元组**：**measurement**（表名，如 `cpu`）、**tag**（带索引的维度，如 `host=server1`、`region=us-east`，用于过滤）、**field**（不带索引的数值/字符串，如 `usage=0.83`）、**timestamp**（纳秒精度时间戳）。一行数据 = 一个 **point**。
- **三代演进**：①**1.x**（自研 TSMTree 引擎 + InfluxQL，类 SQL）；②**2.x**（Flux 函数式查询语言 + 云原生 + Task 调度）；③**3.x**（拥抱 **SQL + Apache Arrow/DataFusion + Parquet 列存**，弃用 Flux，回归标准生态）。
- **降采样（Downsampling）**：把高频原始数据按时间窗口聚合成低频摘要（1 秒原始点 → 1 分钟均值/最大值），用更少存储回答趋势查询，是时序场景的核心优化。
- **数据保留（Retention）**：按时间**自动过期删除**老数据（如只保留 30 天原始 + 1 年降采样），避免磁盘无限膨胀。
- **TIG 栈**：**T**elegraf（采集）+ **I**nfluxDB（存储）+ **G**rafana（展示）—— DevOps 监控/可观测性事实标准。Telegraf 数百种 input 插件抓数据，Grafana 原生支持 InfluxDB 数据源。
- **3.x 关键变化**：底层改用 **Parquet 列式文件**（高压缩比、列式聚合快）+ **Apache Arrow** 内存格式（零拷贝传到 DataFrame/BI）+ **Apache DataFusion** 查询引擎 + **SQL** 接口（不再学 Flux），还支持 Flight RPC 远程查询。
- **不适合场景**：业务事务（无 ACID）、复杂关联（JOIN 弱）、强一致性写入、需要随机更新/删除历史数据。

## 一、时序数据为何特殊

时序数据是「**带时间戳、按时间排序、追加写入**」的数据。典型场景：

| 场景 | 数据点举例 | 频率 |
| --- | --- | --- |
| 基础设施监控 | `cpu,host=srv1 usage=0.83 1693843200000000000` | 每秒/每 10 秒 |
| IoT 传感器 | `temp,device=d01 value=23.5 1693843200` | 每分钟 |
| 应用 APM | `http,domain=api latency=42,status=200` | 每请求 |
| 金融行情 | `price,symbol=AAPL bid=189.3,ask=189.5` | 每秒/每 tick |

这些场景的共同特征决定了通用关系库不适用：

1. **写多读少**：每秒百万级写入（监控全网服务器），但查询相对少（看 dashboard）。
2. **追加为主**：数据一旦写入几乎不更新、不删除（历史指标不可变）。
3. **按时间查询**：绝大多数查询是「过去 1 小时 CPU 均值」「昨天 vs 今天对比」——按时间范围 + 聚合。
4. **近期热查**：90% 查询看最近几小时/几天数据，老数据冷访问。
5. **高基数风险**：tag 组合（host×region×metric）爆炸式增长，传统 B+ 树索引会被撑爆。

专用 TSDB 针对这些特征做了优化：按时间分块存储（chunk）、批量写入、列式压缩（相邻时间点的数值很相似，压缩比极高）、tag 索引、时间窗口聚合下推。

## 二、InfluxDB 数据模型：四元组

InfluxDB 的每个数据点（**point**）由四部分组成：

```
cpu,host=server1,region=us-east usage=0.83,load=1.2 1693843200000000000
│   └──── tag ────────┘   └──── field ────┘  └─ timestamp ─┘
└─ measurement                                            (纳秒精度)
```

| 组成 | 作用 | 是否索引 | 举例 |
| --- | --- | --- | --- |
| **measurement** | 表名，一类数据 | 是（主键一部分） | `cpu`、`temperature`、`http_request` |
| **tag** | 维度/标签，用于过滤 | **是**（建索引，快） | `host=server1`、`region=us-east` |
| **field** | 数值/字符串，被测量的量 | **否**（不索引） | `usage=0.83`、`load=1.2` |
| **timestamp** | 时间戳 | 是（按时间排序） | `1693843200000000000`（纳秒） |

- **tag vs field 的关键区别**：tag 建索引（查询 `WHERE host='server1'` 极快），field 不索引（只能在被 tag 过滤后的数据集上扫描聚合）。**该把什么放 tag**：维度/类别（host/region/status），用于过滤分组；**该把什么放 field**：数值度量（CPU/温度/延迟），用于聚合（mean/max/sum）。
- **series**：一组 measurement + 所有 tag 值的组合，对应一条时间序列。tag 组合越多 series 越多（高基数），索引膨胀——是 InfluxDB 性能的头号坑。
- **高基数（High Cardinality）陷阱**：把唯一性强的值（用户 ID、请求 trace ID、URL 带参数）当 tag，会产生海量 series，索引爆炸、内存撑爆。这类值应放 field 或不存。

## 三、三代演进：从 InfluxQL 到 SQL

| 版本 | 查询语言 | 存储引擎 | 定位 |
| --- | --- | --- | --- |
| **1.x** | **InfluxQL**（类 SQL，`SELECT mean("usage") FROM "cpu" WHERE time > ... GROUP BY time(1m)`） | 自研 **TSMTree**（Time-Structured Merge Tree） | 单机/集群，社区最熟 |
| **2.x** | **Flux**（函数式数据脚本语言，能跨 measurement JOIN、写复杂转换） | 自研 + 云原生（TSM） | 强调云、Task 调度、生态 |
| **3.x** | **SQL**（标准 ANSI SQL）+ InfluxQL（兼容）+ Flight RPC | **Parquet 列存** + **Apache Arrow** + **DataFusion** | 性能与生态全面升级，弃用 Flux |

- **3.x 为何重写**：①Flux 学习曲线陡、生态小；②Parquet 列存对分析聚合更友好（列式压缩 + 向量化）；③Arrow 内存格式让查询结果零拷贝进 Pandas/Polars/BI；④标准 SQL 让所有 BI 工具、ORM、数据科学家直接上手。
- **Flux 的命运**：InfluxData 已宣布 Flux 进入维护模式，3.x 主推 SQL。新项目应直接用 SQL，老项目需评估迁移。
- **3.x 产品线**：**Core**（开源，单机，适合中小规模）与 **Enterprise**（闭源，集群，分布式）。

## 四、降采样与 retention：时序的两大策略

时序数据涨得快（1 秒一个点 × 1 万台机器 = 每天 8.6 亿点），全量保留既贵又慢。两大策略协同控成本：

- **降采样（Downsampling）**：用**时间窗口聚合**把高频原始点转成低频摘要。例如原始每秒一个 CPU 点，按 1 分钟窗口算 mean/max，老数据用摘要替代原始。趋势查询用摘要足够，明细查询才需原始。
- **数据保留（Retention）**：为每个 measurement 设置**保留时长**（如 7 天/30 天/1 年），到期自动删除。常见策略：**原始数据保留短期（热）+ 降采样数据保留长期（温/冷）**——近期要明细、远期要趋势。

两者协同：原始高频数据保留 7 天，同时跑定时任务把原始聚合成 1 分钟/1 小时粒度的降采样数据，降采样数据保留 1 年。7 天后原始自动过期删除，只留摘要——存储省 90%+，趋势查询照样能答。

## 五、TIG 栈：Telegraf + InfluxDB + Grafana

DevOps 监控/可观测性的事实标准组合：

```
  服务器/应用/IoT 设备
         │
         ▼
   ┌───────────┐  数百种 input 插件（cpu/mem/nginx/mysql/redis/docker...）
   │ Telegraf  │  采集 → 处理 → 输出
   └─────┬─────┘
         │ 写入（HTTP/Line Protocol）
         ▼
   ┌───────────┐  时序存储 + 聚合
   │ InfluxDB  │  SQL 查询 / Flight RPC
   └─────┬─────┘
         │ 查询
         ▼
   ┌───────────┐  可视化 dashboard、告警
   │  Grafana  │  原生 InfluxDB 数据源
   └───────────┘
```

- **Telegraf**：Go 写的采集 agent，**插件化**——input 插件抓数据（CPU/内存/磁盘/网络/nginx/mysql/redis/docker/kafka...），processor 插件转换（聚合/过滤/重命名），output 插件写出（InfluxDB/Kafka/Prometheus...）。配置即启用，无需写采集代码。
- **Grafana**：可视化平台，原生支持 InfluxDB 数据源（1.x/2.x/3.x 都有），写 SQL/Flux 画时序图，配告警规则。是「看监控」的标准界面。
- **为何 TIG 流行**：全开源、组件解耦、社区资料极多，从单机到中小集群开箱即用。

## 六、何时用、何时不用

| 场景 | 是否合适 | 原因 |
| --- | --- | --- |
| 监控指标（CPU/内存/QPS） | ✅ 极合适 | 时序专用，TIG 栈开箱即用 |
| IoT 传感器数据 | ✅ 极合适 | 高吞吐写入 + 时间聚合 |
| 应用 APM / 链路指标 | ✅ 合适 | 按服务/端点维度聚合 |
| 业务事务（订单/账户） | ❌ 不合适 | 无 ACID 事务、JOIN 弱，用关系库 |
| 复杂关联分析 | ❌ 不合适 | 不是分析型数据库，用 ClickHouse/DuckDB |
| 需要更新/删除历史 | ❌ 不合适 | 时序追加为主，改删代价高 |

## 下一步

理解了时序数据的特殊性与 InfluxDB 演进后，下一步深入两个核心——[时序数据模型：measurement/tag/field/降采样/retention](./guide-line/time-series-model)（数据如何组织、为何这样组织）与[SQL 与监控集成：3.x Parquet 引擎与 TIG 栈](./guide-line/sql-and-monitoring)（3.x 的查询栈与采集展示链路）。
