---
layout: doc
---

# InfluxDB

**InfluxDB** 是 InfluxData 公司开源的**专用时序数据库（TSDB）**——专为带时间戳的数据（监控指标、IoT 传感器、应用 APM、金融行情）设计，按**时间**而非按业务实体组织存储。它的核心数据模型是 **measurement（测量）+ tag（标签）+ field（字段）+ timestamp（时间戳）** 四元组：tag 建索引便于高效过滤，field 存数值（温度/CPU/股价），所有数据点按时间排序。InfluxDB 经历了三代演进——**1.x**（自研查询语言 InfluxQL + TSMTree 引擎）、**2.x**（Flux 查询语言 + 云原生）、**3.x**（拥抱 **SQL 与 Apache Arrow/DataFusion**，底层改用 **Parquet 列式存储**，性能与生态全面升级）。3.x 是当前主线：用标准 SQL 查询时序数据、借助 Arrow 列式格式实现高吞吐分析、用 Apache Flight RPC 提供远程查询。InfluxDB 与 **Telegraf（数据采集）+ Grafana（可视化）** 组成经典的 **TIG 监控栈**，是 DevOps 与可观测性领域的事实标准之一。时序场景的两个杀手锏是**降采样（downsampling）**——把高频原始数据按时间窗口聚合为低频摘要（如 1 秒 → 1 分钟均值），用更少存储回答趋势问题；与**数据保留（retention）**——按时间自动过期删除老数据，避免磁盘膨胀。理解 InfluxDB 的核心是理解**时序数据模型**（为何 tag 索引、field 不索引）、**3.x 的 SQL/Parquet 引擎**（为何列式更适合聚合分析）、**降采样与 retention 的协同**（如何用存储换查询速度）、以及**TIG 栈集成**（Telegraf 采集 → InfluxDB 存储 → Grafana 展示）。

## 评价

**优点**

- **时序专用优化**：按时间排序写入、tag 索引高效过滤，监控/IoT 场景下写入吞吐与查询性能远超通用关系库
- **3.x 拥抱 SQL 与 Arrow**：标准 SQL 接口（不再学 Flux/InfluxQL）+ Parquet 列存 + Arrow 内存格式，分析与生态（BI 工具、DataFrame）全面打通
- **降采样 + retention**：内置时间窗口聚合与自动过期，用存储策略平衡精度与成本
- **TIG 栈生态成熟**：Telegraf 数百种 input 插件、Grafana 原生数据源支持，监控/可观测性开箱即用

**缺点**

- **三代 API 割裂**：1.x 的 InfluxQL、2.x 的 Flux、3.x 回归 SQL，迁移与学习成本高，Flux 已逐步被弃用
- **非时序场景不适合**：无事务、无复杂 JOIN、强一致性弱，做业务库会踩坑
- **资源占用与运维**：集群版（Enterprise）闭源收费，开源版横向扩展能力有限
- **3.x 重写尚在成熟**：Parquet/Arrow 架构较新，部分边缘特性与文档滞后于 1.x

## 本叶地图

- [入门](./getting-started) —— 时序数据为何特殊、InfluxDB 定义、三代演进（1.x/2.x/3.x）、measurement/tag/field 模型、降采样与 retention、TIG 栈
- [时序数据模型：measurement/tag/field/降采样/retention](./guide-line/time-series-model) —— 为何 tag 索引 field 不索引、point/series 概念、降采样的时间窗口聚合、retention 自动过期策略
- [SQL 与监控集成：3.x Parquet 引擎与 TIG 栈](./guide-line/sql-and-monitoring) —— 3.x 的 SQL 接口与 Arrow/DataFusion、Parquet 列存、Telegraf 采集、Grafana 可视化
- [参考](./reference) —— 三代 API 对比、数据模型速查、降采样/retention 策略、TIG 栈组件、易错点清单

## 幻灯片地址

<a href="/SlideStack/influxdb-slide/" target="_blank">InfluxDB</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=InfluxDB" target="_blank" rel="noopener noreferrer">InfluxDB 测试题</a>
