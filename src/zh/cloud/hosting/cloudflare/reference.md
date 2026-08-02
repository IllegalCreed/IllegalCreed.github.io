---
layout: doc
outline: [2, 3]
---

# 参考：Cloudflare 全家桶速查、定价对比与易错点

> 基于 Cloudflare 官方文档（2025） · 核于 2026-08

## 速查

- **Cloudflare 定位**：边缘计算全家桶，从 CDN/抗 DDoS 演进为网络+安全+计算+存储+数据库平台，核心差异化是**无限带宽免费层**。
- **全家桶六件套**：Pages（托管）+ Workers（计算）+ R2（存储）+ D1（数据库）+ KV（键值）+ Containers（2025 容器）。
- **无限带宽免费层**：静态资源请求与带宽不计费——高流量站杀手锏。
- **Workers**：V8 Isolates（非容器），冷启动 0-5ms，全球 300+ 节点，不支持完整 Node。
- **R2**：对象存储，零出口费，S3 兼容。
- **D1**：边缘 SQLite，强一致主 + 只读副本，读多写少。
- **KV**：最终一致键值存储，超低延迟读。
- **Containers（2025）**：补齐长任务/任意语言短板。

## 一、全家桶组件速查

| 组件 | 模型 | 核心特点 | 典型用途 |
| --- | --- | --- | --- |
| **Pages** | 静态托管 | Git 触发 + 无限带宽免费层 | 静态站、SSG、文档站 |
| **Workers** | 边缘计算 | V8 Isolates，冷启动 0-5ms | 边缘 API、鉴权、A/B、缓存 |
| **Pages Functions** | 边缘函数 | Pages 内置的 Workers | 静态站 + 动态逻辑 |
| **R2** | 对象存储 | **零出口费**，S3 兼容 | 大文件、图片、视频、备份 |
| **D1** | 关系型（SQLite） | 强一致主 + 只读副本 | 读多写少 SQL 查询 |
| **KV** | 键值存储 | 最终一致，超低延迟读 | 配置、会话、特征开关 |
| **Durable Objects** | 有状态对象 | 全球唯一 + 强一致 | 协作、限流、WebSocket |
| **Queues** | 消息队列 | 解耦生产/消费者 | 异步任务、削峰 |
| **Containers（2025）** | 容器工作负载 | 任意语言、长任务 | ML 推理、视频转码、JVM |

## 二、免费层额度对比

| 组件 | 免费层额度 |
| --- | --- |
| **Pages** | 无限请求 + 无限带宽 |
| **Workers** | 10 万请求/天，10ms CPU/请求 |
| **R2** | 10GB 存储 + **零出口费** |
| **D1** | 5GB 存储 + 500 万读/天 |
| **KV** | 10 万读/天 + 1000 写/天 |

- **Workers Paid**：$5/月，1000 万请求含 + 30s CPU/请求 + 解锁更多绑定。
- **对比 AWS**：Cloudflare 免费层覆盖更广（无限带宽、R2 零出口），适合原型到中小流量应用零成本起步。

## 三、R2 vs AWS S3 成本对比

| 维度 | Cloudflare R2 | AWS S3 |
| --- | --- | --- |
| 存储费 | ~$0.015/GB-月 | ~$0.023/GB-月 |
| 写入操作 | $4.5/百万 | $5/百万 |
| 读取操作 | $0.36/百万 | $0.4/百万 |
| **出口流量** | **免费** | ~$0.09/GB |

- **示例**：1TB 存储 + 月 10TB 出口 → R2 约 $15（仅存储）；S3 约 $900（存储 + 出口）。

## 四、Workers vs 其他 Serverless

| 维度 | Cloudflare Workers | AWS Lambda | Netlify Edge (Deno) |
| --- | --- | --- | --- |
| 隔离模型 | V8 Isolates | 容器/微虚拟机 | Deno (V8) |
| 冷启动 | **0-5ms** | 数百 ms 到秒 | 毫秒级 |
| 运行时 | JS/TS/WASM（无完整 Node） | Node/Python/Java/Go 等 | Deno + Web 标准 |
| 运行位置 | 全球 300+ 边缘 | 单区域（可配多区） | 全球边缘 |
| CPU 限制 | 10ms（免费）/30s（付费） | 15 分钟 | 受 Deno 限制 |

## 五、易错点清单

- **"Workers 用 Docker 容器"**：错。Workers 用 V8 Isolates（进程内隔离），不是容器；Containers（2025）才是容器。
- **"Workers 能跑完整 Node.js"**：错。Workers 不支持 `fs`/原生 `.node` 模块，用 Web 标准 API + WASM；要完整 Node 用 Containers。
- **"R2 像 S3 一样收出口费"**：错。R2 **零出口费**，这是它对 S3 的核心优势。
- **"KV 是强一致的"**：错。KV 是**最终一致**，写入秒级传播，不能用于需要强一致的场景（如余额扣减）。
- **"D1 适合 PB 级大数据"**：错。D1 单库默认 10GB，适合中小规模关系数据；超大规模用 R2 或传统分布式数据库。
- **"无限带宽免费层适用于所有流量"**：错。免费层针对**静态资源**（Pages 托管的文件）；Workers 动态请求、R2/D1/KV 操作有各自额度上限。
- **"Durable Objects 和 KV 一样"**：错。Durable Objects 是强一致的有状态对象；KV 是最终一致的无状态键值。
- **"Pages Functions 是独立产品"**：错。它是 Workers 的 Pages 集成形态，共享 Workers runtime 与绑定。
- **"Containers 取代了 Workers"**：错。两者协同——Workers 做轻边缘入口，Containers 做重容器任务，互补不替代。
- **"Cloudflare 全家桶完全免费"**：错。免费层有限额（Workers 请求数、R2 存储、D1/KV 操作），重度使用需付费。

## 六、进阶方向（链接其他叶）

- [Netlify](../netlify/) —— JAMstack 先驱，2025 信用制定价，对比 Cloudflare 的无限带宽
- [GitHub Pages](../github-pages/) —— 文档/作品集的零成本默认选择

## 权威链接

- [Cloudflare 官方文档](https://developers.cloudflare.com/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
- [Cloudflare Containers 公告](https://blog.cloudflare.com/cloudflare-containers-coming-2025/)
- [Cloudflare 定价](https://www.cloudflare.com/plans/developer-platform/)
- 本站幻灯片：<a href="/SlideStack/cloudflare-slide/" target="_blank">Cloudflare</a>
