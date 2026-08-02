---
layout: doc
---

# Cloudflare

**Cloudflare** 不只是一个静态托管平台，而是覆盖**网络、安全、计算、存储、数据库**的**边缘计算全家桶**——它从一个 CDN/抗 DDoS 服务商（2009 创立）演进为全球最大的边缘云平台之一，核心差异化是**无限带宽的免费层**。当 Netlify/Vercel 按 GB 收带宽费时，Cloudflare 对静态资源的请求与带宽"不计费"——这在高流量站点上能省下巨额成本，是它的杀手锏。

Cloudflare 的全部考点围绕**全家桶的六大组件**展开：①**Pages**（静态站点托管 + Git 触发部署，对标 Netlify/Vercel）——回答"静态站点怎么托管"；②**Workers**（边缘计算，基于 V8 Isolates 而非容器，全球 300+ 节点，毫秒冷启动）——回答"边缘代码怎么跑"；③**R2**（对象存储，**零出口费**，对标 AWS S3 但无出口流量费）——回答"大文件/媒体怎么存"；④**D1**（边缘 SQLite 数据库，全球只读副本）——回答"边缘数据库怎么用"；⑤**KV**（全球分布式键值存储，最终一致，超低延迟读）——回答"配置/会话怎么缓存"；⑥**2025 Containers**（容器化工作负载，让 Workers 能跑任意语言/长任务）——回答"容器怎么上边缘"。本叶把这些组件当作一个**协同的全家桶**来讲，而不是孤立产品，核心卖点是无缝集成 + 无限带宽免费层。

## 评价

**优点**

- **无限带宽免费层**：静态资源请求与带宽不计费——高流量站点的成本杀手锏，Netlify/Vercel 都做不到
- **真正的边缘计算全家桶**：Pages（托管）+ Workers（计算）+ R2（存储）+ D1（数据库）+ KV（缓存）+ Containers（容器），无缝协同，一个账号打通
- **Workers 极快冷启动**：基于 V8 Isolates（非容器），冷启动 0-5ms，远快于 AWS Lambda 的数百毫秒
- **R2 零出口费**：对象存储对标 S3，但**出口流量免费**（S3 出口费是云账单大头），存取大文件极省钱
- **全球 300+ 边缘节点**：用户在哪，请求就近处理，延迟天然低
- **安全集成**：免费 SSL、抗 DDoS、WAF、Bot 防护开箱即用，托管站点天然受保护

**缺点**

- **Workers 受 V8 Isolates 限制**：不能跑任意语言（默认 JS/TS/Rust/C/C++/Python via WASM），不能用 Node 完整生态（fs、原生模块受限），长任务受限（CPU 时间限制）
- **D1 较新**：2024 才 GA，生态与工具链不如传统数据库成熟，复杂查询/事务能力有限
- **全家桶学习曲线**：组件多，选型与组合需理解各组件边界，初学者易混淆 KV vs D1 vs R2
- **vendor lock-in 风险**：深度依赖全家桶后迁移成本高（Workers API、R2/D1 绑定非标准）
- **Containers 仍在演进**：2025 推出，成熟度与稳定性待时间检验

## 本叶地图

- [入门](./getting-started) —— Cloudflare 定位、全家桶概览、无限带宽免费层、与 Netlify/Vercel 对比
- [Workers 与边缘计算](./guide-line/workers-and-edge) —— Workers（V8 Isolates）、Pages Functions、Containers（2025）、运行时限制
- [R2 / D1 / KV 存储与数据库](./guide-line/storage-and-db) —— R2 零出口费存储、D1 边缘数据库、KV 键值存储、选型
- [参考](./reference) —— 全家桶组件速查、定价对比、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/cloudflare-slide/" target="_blank">Cloudflare</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Cloudflare" target="_blank" rel="noopener noreferrer">Cloudflare 测试题</a>
