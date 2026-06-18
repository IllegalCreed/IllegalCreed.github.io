---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 replit.com / docs.replit.com 2025–2026 现状编写。金额 / 额度仅作功能向参考，**一切以官方 [pricing](https://replit.com/pricing) 为准**。完整文档见 [docs.replit.com](https://docs.replit.com/)。

## 套餐速记（功能向）

| 套餐 | 价格 | 月度 credits | 并行 agent | 关键能力 |
| --- | --- | --- | --- | --- |
| **Starter（免费）** | $0 | 每日免费 Agent credits | — | **发布 1 个项目**；内建数据库；设计工具（slides / videos / animations） |
| **Replit Core** | **$25 / 月**（年付 $20/月，省 20%） | **$25 / 月** | **2** | 邀 5 协作者；无限 workspace；去品牌 badge |
| **Replit Pro** | **$100 / 月**（年付 $95/月，省 5%） | **$100 / 月** | **10** | 邀 15 协作者 + 50 viewers；最强模型；**数据库回滚 28 天**；优先支持 |
| **Enterprise** | 定制 | 定制 | 定制 | Pro 全部 + 定制席位 / **SSO/SAML** / 高级隐私 / 单租户 / 数仓连接 / 专属支持 |

::: tip 金额免责
$25 / $100 / credits 额度等会随官方调整而变，做决策 / 出题一律以 [replit.com/pricing](https://replit.com/pricing) 为准。文档侧亦提及「background tasks: 1 on Core; 10 on Pro」，与并行 agent 数一致。
:::

## Agent 模式速记

| 模式 | 定位 | 适合 | 相对成本 | 可用范围 |
| --- | --- | --- | --- | --- |
| **Lite** | 快速定向改动（10–60 秒） | 视觉微调 / 小 bug；**不适合架构 / 新集成 / 改 schema** | 最低 | 全套餐 |
| **Economy** | 成本优化 | 日常开发 / 学习 / 省 credit | 低 | 全套餐 |
| **Power** | 能力优先 | 复杂功能 / 生产级 / 难题 | 中高 | 全套餐 |
| **Turbo** | Power 加成，最多 2.5x 快 | 赶时间的复杂任务 | **最高（可达 Power 6x）** | **仅 Pro / Enterprise**，默认关 |
| **High Effort**（开关） | 更深推理（Economy / Power 可选） | 最难任务 | 最多 **2x** | 全套餐 |

## 计费机制速记

| 项 | 规则 |
| --- | --- |
| 定价模型 | **effort-based**——按请求复杂度（pay-as-you-go） |
| 计费单位 | **checkpoint**（非按 token），"One checkpoint per request" |
| 是否都计费 | **所有 Agent 交互都计费**（含纯问答 / Plan Mode 不改码） |
| 首个 prompt | **免费，不扣 credit** |
| 月度 credits | 覆盖 Agent + apps + 存储 + 数据库 |
| 超额 | 累计成本超月度 credits 后出账；可买 credit packs |
| 滚存 | Pro credits 可滚存 **1 个月** |
| 控费 | 优先 Economy；复杂才 Power；赶时间才 Turbo；docs 有 "managing spend" |

## Checkpoints 速记

| 项 | 说明 |
| --- | --- |
| 本质 | 里程碑**自动创建的完整快照** |
| 含内容 | **项目文件 + AI 对话上下文 + 数据库** |
| 操作 | 一键 **rollback** / **roll forward** |
| 成本追踪 | 每 checkpoint 透明成本 |
| 数据库回滚窗口 | Pro 可达 **28 天** |

## Agent 任务板四阶段

| 阶段 | 含义 |
| --- | --- |
| **Drafts** | 已规划、未开始 |
| **Active** | 在隔离副本中构建 / 排队 |
| **Ready** | 构建完成、待批准合并 |
| **Done** | 已合并 |

> 每任务跑在**项目隔离副本**，apply 前不动主版本；多任务 apply 时**冲突自动合并**；可开 **Auto-approve plan**。

## 执行环境速记

| 项 | Replit |
| --- | --- |
| 形态 | 云端**服务端 Docker 容器**（非浏览器内 WASM） |
| 包 / 环境管理 | **Nix**（`replit.nix`，80,000+ Linux 包） |
| 语言运行时 | 真实 **50+ 语言** |
| 能力 | DB 迁移 / 常驻后台进程 / 监控生产应用 |
| vs bolt.new | bolt 用浏览器内 **WebContainers**，后端**仅 Node/Express** |

## 数据库速记

| 项 | 规则 |
| --- | --- |
| 类型 | 全托管 SQL，**PostgreSQL 兼容** |
| 连接 | 经环境变量 `DATABASE_URL`，任意 Postgres 客户端 |
| 托管基础设施 | **2025-12-04 后**在 Replit 自有基础设施（之前 Neon） |
| 加库方式 | 叫 Agent「add a database」自动建集成 + schema + 改码 + ORM |
| 开发 / 生产 | 需创建**生产库**做隔离；连接串 **scoped to your app** |
| 免费存储 | 每 App **20GB** |
| 单库上限 | **10 GiB**（计费维度） |
| 生产库计费 | compute time（小时活跃）+ data storage（GiB） |

## 认证速记

| 方案 | 特点 | 接入方式 |
| --- | --- | --- |
| **Replit Auth** | 零配置；Google / GitHub / X / Apple / Email；底层 Firebase + GCP Identity + Stytch MFA | **仅能经 Agent**（一句 prompt） |
| **Clerk Auth** | 独立 tenant、可完全自定义品牌、账号独立于 Replit | 集成接入 |

## 部署类型速记

| 类型 | 行为 | 适合 | 计费要点 |
| --- | --- | --- | --- |
| **Autoscale** | 忙时扩、闲时**缩到 0** | 可变负载 Web / API | Outbound 流量（入站免费）+ Compute Units + per-request |
| **Reserved VM** | 专用 VM、不中断 | 常驻 bot / 持久 API / 内存密集 | 按预留 VM |
| **Static** | 静态站点 | 纯前端 / 文档 | 基本免费 / 含订阅 |
| **Scheduled** | 定时任务 | 周期 job | 按运行 |

## 集成 / 连接器速记

| 集成 | 用途 |
| --- | --- |
| **数据库（内建）** | PostgreSQL 兼容，Agent 一键加 |
| **Replit Auth / Clerk** | 认证 |
| **Autoscale / Reserved VM / Static / Scheduled** | 部署 |
| **BigQuery / Linear / Slack / Notion** | Agent 数据连接器（直连查数据） |
| **OpenAI / Stripe / Google Workspace 等** | 100+ 第三方集成 |
| **GitHub / Figma / Vercel / Bolt / Lovable / ZIP** | 导入来源 |

## 关键时间线

| 时间 | 事件 |
| --- | --- |
| 2025-09-10 | **Agent 3** 发布——"most autonomous agent yet"，可自主运行 up to 200 分钟，能造其他 agent / 自动化 |
| 2025-12-04 | 此后创建的数据库**托管在 Replit 自有基础设施**（之前 Neon） |
| 2026-03-11 | **Agent 4** 发布——"Built for creativity"，人在回路 + **并行多 agent + kanban 任务板** |

## 竞品对比速记

> 多来自第三方对比，**仅作背景**。

| 工具 | 强项 | 执行环境 / 后端 | 受众 |
| --- | --- | --- | --- |
| **Replit** | 完整云端开发 + 部署一体机，真实 50+ 语言，**后端最深**，老牌生态 | 服务端 Docker 容器 + Nix；内建 DB / Auth / 部署 | 工程师 + PM / 设计 + 企业 + 非技术 |
| **bolt.new** | prompt→运行反馈最快，多框架 + 移动端 + 开源版 | 浏览器内 WebContainers，后端仅 Node/Express | 偏技术 |
| **v0（Vercel）** | 前端 / UI 顶尖（shadcn/ui + Tailwind） | 需后端另建，深绑 Vercel | Vercel 系 |
| **Lovable** | chat-first、最适合非技术 / 新手 | Lovable Cloud（Supabase） | 新手 / 非技术 |

## 资源链接

| 资源 | 地址 |
| --- | --- |
| 官网 | [replit.com](https://replit.com/) |
| 定价 | [replit.com/pricing](https://replit.com/pricing) |
| 文档首页 | [docs.replit.com](https://docs.replit.com/) |
| Agent 概览 | [docs.replit.com/references/agent/overview](https://docs.replit.com/references/agent/overview) |
| Agent 模式 | [docs.replit.com/references/agent/agent-modes](https://docs.replit.com/references/agent/agent-modes) |
| 任务板 | [docs.replit.com/references/agent/task-board](https://docs.replit.com/references/agent/task-board) |
| AI 计费 | [docs.replit.com/billing/ai-billing](https://docs.replit.com/billing/ai-billing) |
| Checkpoints / 回滚 | [docs.replit.com/references/version-control/checkpoints-and-rollbacks](https://docs.replit.com/references/version-control/checkpoints-and-rollbacks) |
| SQL 数据库 | [docs.replit.com/references/data-and-storage/sql-database](https://docs.replit.com/references/data-and-storage/sql-database) |
| Agent 4 发布 | [replit.com/blog/introducing-agent-4-built-for-creativity](https://replit.com/blog/introducing-agent-4-built-for-creativity) |
