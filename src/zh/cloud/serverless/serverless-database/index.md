---
layout: doc
---

# Serverless 数据库

**Serverless 数据库**是一类**无需预置实例、按用量计费、能随负载自动伸缩（甚至缩到零）**的托管数据库。传统托管数据库（RDS/Aurora Provisioned）要你选实例规格、24/7 付费、手动扩缩；Serverless 数据库把这些全自动化——**空闲时 scale-to-zero（零成本）、有请求时毫秒级唤醒、按行/按存储/按计算计费**。它解决了 Serverless 计算（Lambda/Workers）的最后一块拼图：**计算无服务器了，数据库也得无服务器**，否则数据库实例常驻的费用与运维会吞噬 Serverless 的红利。本叶是 Serverless 与边缘计算章的第三叶（聚合叶），横向对比三大主流方案：**Neon**（Postgres scale-to-zero + DB branching）、**PlanetScale**（MySQL 基于 Vitess）、**Turso**（边缘 SQLite）。

三大方案的考点围绕**"scale-to-zero + 计费模型 + 数据模型差异"**展开：①**Neon**——**云原生 Postgres**，存算分离（存储在 S3-like 对象存储，计算是无状态计算节点），支持**scale-to-zero**（空闲秒级挂起、有连接毫秒级唤醒）、**DB branching**（像 git 一样分支数据库，每个 PR 一个独立副本，秒级创建）、完整 PG 生态；②**PlanetScale**——基于 **Vitess**（YouTube 在用的 MySQL 分片层）的**云原生 MySQL**，强项是**水平分片**与**schema 迁移工作流**（分支 + deploy requests），但**无外键约束**、无事务跨分片；③**Turso**——**边缘 SQLite**（libSQL，SQLite 的开源 fork），数据复制到全球边缘节点**就近读**，每个客户端可有一个嵌入式副本，超低延迟读，适合读多写少 + 全球分布。后续两叶分别深入"Neon 与 PlanetScale"和"Turso 与选型对比"。

## 评价

**优点**

- **scale-to-zero 零空闲成本**：开发/测试/低流量环境几乎不花钱（Neon/Turso 空闲即挂起）
- **按用量计费**：按行读/存储/计算，无需为峰值预置实例；与 Serverless 计算天然契合
- **自动伸缩**：无需手动扩容，负载来了自动加计算资源
- **DB branching**（Neon/PlanetScale）：像 git 一样分支数据库，preview 环境/迁移测试极方便

**缺点**

- **唤醒延迟**：scale-to-zero 后首次请求有**冷唤醒**（Neon 几百 ms - 数秒），延迟敏感场景要 keep-alive
- **生态与一致性权衡**：PlanetScale 无外键约束；Turso 边缘副本最终一致；Neon 唤醒延迟
- **大数据量成本**：高流量或大数据集下，按行/按计算计费可能比预留实例贵（要算清）
- **厂商锁定**：各家分片/分支/复制机制是私有实现，迁出有成本

## 本叶地图

- [入门](./getting-started) —— Serverless DB 定位、scale-to-zero、三家概览、核心术语
- [Neon 与 PlanetScale](./guide-line/neon-and-planetscale) —— Neon 存算分离 + DB branching、PlanetScale Vitess 分片 + schema 迁移
- [Turso 与选型对比](./guide-line/turso-and-selection) —— Turso 边缘 SQLite/嵌入式副本、三家横向选型决策
- [参考](./reference) —— 三家对比矩阵、计费表、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/serverless-database-slide/" target="_blank">Serverless 数据库</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Serverless%20%E6%95%B0%E6%8D%AE%E5%BA%93" target="_blank" rel="noopener noreferrer">Serverless 数据库测试题</a>
