---
layout: doc
---

# Replit Agent

Replit 是一个**云端 AI 应用生成平台**——用自然语言描述需求，**Agent 4** 即可生成、测试、修复并一键上线**生产级全栈应用**（Web / 移动 / 仪表盘 / 幻灯片等），内建数据库 / 认证 / 托管 / 部署，官方主打「**Turn ideas into apps in minutes — no coding needed**」。它已从老牌**在线 IDE / 编程教育**平台**决定性转型**为「自然语言 → app」的 AI 构建工具（vibe coding），受众明确覆盖软件工程师、**产品经理**、设计师、企业与**非技术构建者**。与 bolt.new（浏览器内 WebContainers）最大的不同在于：Replit 的代码跑在**自有云端的服务端 Docker 容器 + Nix 环境**里，能跑真实 50+ 语言运行时、执行数据库迁移、常驻后台进程，**后端最深**。

## 评价

**优点**

- **真服务端云环境**：每个项目由云端 **Docker 容器 + Nix** 支撑，跑真实多语言运行时（50+ 语言）、能 DB 迁移 / 跑常驻进程，不受浏览器内 WASM 限制
- **prompt → 生产级全栈 app**：Agent 不只吐代码，还会建项目、自测、修 bug；产物含 web / 移动 / 幻灯片 / 数据可视化，**可共享同一后端**
- **一体化云开发**：内建数据库（PostgreSQL 兼容）、认证（Replit Auth / Clerk）、托管与部署（Autoscale / Reserved VM / Static / Scheduled）、Monitoring、100+ 集成，零配置上线
- **Agent 4 人在回路**：从 Agent 3 的「最高自主」转向**创意控制**——**并行多 agent + kanban 任务板**，每个任务跑在隔离副本、apply 时自动合并冲突
- **Checkpoints 快照**：里程碑自动建完整快照（文件 + 对话上下文 + 数据库），一键 rollback / roll forward，每 checkpoint 透明成本追踪
- **老牌生态**：从在线 IDE 时代积累的工作区 / 协作 / 教育生态，支持从 GitHub / Figma / Vercel / Bolt / Lovable / ZIP 导入

**缺点**

- **计费极易踩坑**：effort-based（按复杂度）、以 **checkpoint** 计而非按 token；**所有 Agent 交互都计费**，连 Plan Mode 纯问答不改码也扣费；Turbo 模式最贵（可达 Power 6x）
- **闭源、不可私有部署**：Replit 平台非开源，只能跑在 Replit 自有云上
- **并行任务有套餐门槛**：并行多 agent 仅 **Pro / Enterprise**（Core 曾限时开放）
- **Agent 是概率性的**：官方明示 LLM 驱动「may occasionally make mistakes」，生产前仍需人工 review / 测试
- **持续欠费会暂停已发布 app**；中国大陆访问需自备网络

## 文档地址

[Replit Docs](https://docs.replit.com/)

## GitHub 地址

Replit 平台非开源，无公开主仓库。官方资料见 [Replit Docs](https://docs.replit.com/)。

## 幻灯片地址

<a href="/SlideStack/replit-agent-slide/" target="_blank">Replit Agent</a>
