---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 replit.com / docs.replit.com 2025–2026 现状编写

## 速查

- **执行环境**（关键区别）：云端**服务端 Docker 容器 + Nix**，跑真实 50+ 语言运行时——与 bolt.new 的浏览器内 WebContainers（后端仅 Node）**决定性不同**
- **Agent 4**（2026-03-11）：从 Agent 3 的「最高自主」转向**人在回路 / 创意控制**；**并行多 agent + kanban 任务板**（任务跑隔离副本、apply 自动合并冲突）；**并行仅 Pro/Ent**
- **Agent 3**（2025-09-10，背景）：10x 更自主，可自主运行 up to 200 分钟，浏览器内自测自修，能造其他 agent / 自动化
- **任务板四阶段**：Drafts → Active（隔离副本）→ Ready（待批准合并）→ Done；可设 Auto-approve plan
- **计费**：effort-based（按复杂度）+ 以 **checkpoint** 计（非按 token）；**所有交互都计费**，Plan Mode 纯问答也扣；模式成本 Lite<Economy<Power<**Turbo(最多 6x Power)**，High Effort 最多 2x；**首个 prompt 免费**
- **数据库**：全托管 **PostgreSQL 兼容**；**2025-12-04 后**库托管在 Replit 自有基础设施（之前 Neon）；每 App 含 **20GB** 免费存储，单库上限 10 GiB
- **认证**：**Replit Auth 只能经 Agent 接入**（底层 Firebase/GCP Identity + Stytch MFA）；Clerk 为可自定义品牌的备选
- **部署四型**：Autoscale（闲时缩到 0）/ Reserved VM（常驻）/ Static / Scheduled
- **Checkpoints**：里程碑自动快照（文件 + 对话上下文 + 数据库），一键 rollback / roll forward
- 竞品区分：**Replit = 完整云端开发 + 部署一体机（服务端容器、后端最深、老牌生态）**

## Agent 4：从"自主"到"创意控制"

**Agent 4 于 2026-03-11 发布**（"Built for creativity"）。它和前代 Agent 3 的理念有一次明确转向：

| | Agent 3（2025-09-10） | Agent 4（2026-03-11） |
| --- | --- | --- |
| 核心理念 | **自主（autonomy）**——"most autonomous agent yet" | **创意控制 / 人在回路**——"putting human creativity at the center" |
| 工作方式 | 自主运行 up to 200 分钟，自动 build / test / fix | 你保持在环：指挥设计、并行启任务、随产出 review |
| 旗舰能力 | 浏览器内自测自修；能造其他 agent / 自动化 | **并行多 agent + kanban 任务板** |

Agent 4 的定位语是 **"ship production-ready software 10x faster"**，客户证言来自 Gusto、Payouts.com 等企业 / PM 场景。

::: tip 转向不等于"变弱"
Agent 3 仍是重要背景：它声称比 Agent V2「10x more autonomous」，能在真实浏览器预览里测试——你能看到 **"the Agent's cursor as it clicks around the app"**，评估按钮 / 表单 / API / 数据源并自动修复；其自研测试系统号称比 Computer Use 模型「3x faster and 10x more cost-effective」。Agent 4 是在这些能力之上，把**人的判断**重新放回中心。
:::

## 并行任务 + 任务板（Agent 4 旗舰能力）

Agent 4 最大的新能力是**多个 agent 同时工作**，各管项目的不同部分，用 **kanban 风格任务板**可视化：

- 每个任务 **"runs in its own isolated copy of your project, so nothing changes in your main version until you apply the work"**——跑在项目的隔离副本里，不动你的主版本。
- apply 时 **"Agent handles conflicts automatically when you apply changes from multiple tasks."**——多任务合并冲突自动处理。
- 自动依赖排序：任务之间的先后依赖由 Agent 排好。

任务板四阶段：

| 阶段 | 含义 |
| --- | --- |
| **Drafts** | 已规划、未开始 |
| **Active** | 在隔离副本中构建 / 排队 |
| **Ready** | 构建完成、待你批准合并 |
| **Done** | 已合并 |

可开 **Auto-approve plan** 让规划自动通过。

::: warning 并行任务仅 Pro / Enterprise
并行多 agent 面向 **Pro 与 Enterprise**（power users）；Core 曾限时开放。如果你在 Starter / Core 上看不到并行能力，多半是套餐限制而非 bug。
:::

::: tip 设计也在同一环境
Agent 4 把设计与构建放进同环境：**infinite canvas** 生成多套 UI 变体，支持精细控制（multi-select、hover/active 状态编辑、响应式覆盖）。
:::

## 执行环境：服务端容器 + Nix（最关键的区分点）

这是 Replit 和其它 app builder（尤其 bolt.new）**最本质的差异**，务必记牢：

- **服务端云容器，不是浏览器内 WASM**：每个 repl 由 **Docker 容器**支撑，运行代码 / shell 命令都发生在容器内 runner 用户上下文——是**云端服务端执行环境**。
- **Nix 管理包与环境**：`replit.nix` 声明系统依赖，可用 **80,000+ Linux 包**；Nix Store 预置近百万包于云端快盘，按下 Run 即可即时访问。
- **跑真实运行时、50+ 语言**：内建 shell / 包管理 / Linux 环境，支持持久化服务端进程，能写并执行**数据库迁移**、监控生产应用、跑常驻后台进程。

::: warning 与 bolt.new 的决定性区别
- **bolt.new（StackBlitz）**：用 **WebContainers 在浏览器内**跑 Node.js——反馈最快，但后端**仅 Node.js / Express**（无 Python / PHP / Go）。
- **Replit**：在**自有云服务端**跑真实多语言运行时，**后端最深**，能做 bolt.new 做不到的 DB 迁移 / 常驻进程 / 多语言后端。

> 历史注脚：Replit 早期曾用 WebAssembly，但**当前架构是容器化、服务端、Nix 驱动**，别把"浏览器内运行"安到 Replit 头上。
:::

## 计费：effort-based + checkpoint（最易踩坑）

> 金额功能向、易变；**以官方 [pricing](https://replit.com/pricing) 为准**。

Replit 的 Agent 计费机制和"按 token 计"的工具很不一样，是高频踩坑点：

- **Effort-Based Pricing（按工作量 / pay-as-you-go）**：**"effort-based pricing that scales with the complexity of your request"**——按请求复杂度收费，简单请求更便宜。
- **以 checkpoint 为计费单位（非按 token）**：一个 checkpoint = 一次请求完成的工作，**"One checkpoint per request"**。简单请求（小 bug / 小改）通常便宜；复杂构建打包成一个 checkpoint、可能更贵。
- **所有 Agent 交互都计费**：官方原话 **"All Agent interactions are billable"**。
- **无代码改动也可能收费**：例如 **Plan Mode 只规划没改码，"there is still a charge"**。

::: danger 三个最容易扣冤枉钱的点
1. **Plan Mode / 纯问答也扣费**——别当免费聊天用。
2. **Turbo 最贵**，请求成本可达 **Power 的 6x**（仅 Pro/Ent，默认关）。
3. **High Effort 最多 2x**——最难任务才开。

日常优先用 **Economy**，复杂功能才上 Power，赶时间再考虑 Turbo。
:::

模式成本梯度（相对）：

```text
Lite  <  Economy  <  Power  <  Turbo（最多 6x Power）
                    └─ High Effort 开关：最多 2x
```

### Credits 与超额

- **月度 credits + 超额**：账单按"monthly or once your accumulated costs exceed your monthly credits"出；超额可买 **credit packs**；Pro credits 可**滚存 1 个月**。
- credits **同时覆盖** Agent + apps + 存储 + 数据库。
- **首个 prompt 免费**（No credit consumption）。

## Checkpoints：版本控制 + 成本追踪

Checkpoint 不只是计费单位，也是 Replit 的**版本控制核心**：

- **本质**：Agent 在关键里程碑**自动创建的完整快照**，含**项目文件 + AI 对话上下文 + 数据库**。
- **可逆**：一键 **rollback**，也能 **roll forward**。
- **透明成本**：每个 checkpoint 都有成本追踪，看得见每步花了多少。

::: tip rollback 连数据库一起回
因为 checkpoint 含数据库快照，回滚时数据状态也一并恢复——这对"Agent 改崩了"的场景很有用。Pro 套餐数据库回滚窗口可达 **28 天**。
:::

## 数据库：内建 PostgreSQL 兼容

- **全托管 SQL，PostgreSQL 兼容**：可用任意 Postgres 兼容客户端经环境变量 `DATABASE_URL` 连接。
- **基础设施迁移**：**2025-12-04 之后**创建的库**托管在 Replit 自有基础设施**；之前用 **Neon**（第三方）。
- **Agent 一键加库**：叫 Agent「add a database」→ 自动建集成、建 schema、改代码并加 **ORM**（内建防 SQL 注入 / schema 校验）。
- **开发库 vs 生产库分离**：发布 / 部署需创建**生产库**做环境隔离；连接串 **scoped to your app**（同账号他 app 也访问不到）。**每个 App 含 20GB 免费存储**，单库上限 **10 GiB**（计费维度）。

生产库计费两维：**compute time（按小时活跃）+ data storage（GiB）**。

## 认证：Replit Auth 与 Clerk

| 方案 | 特点 | 何时用 |
| --- | --- | --- |
| **Replit Auth** | **零配置——"Add authentication with a single prompt in Agent"**；登录支持 Google / GitHub / X / Apple / Email | 默认首选；要快 |
| **Clerk Auth** | 独立认证 tenant、可完全自定义品牌、用户账号独立于 Replit | 需自定义品牌 / 非 Replit 绑定账号 |

::: warning Replit Auth 只能经 Agent 接入
**Replit Auth 没有独立配置面板**——只能在 Agent 里用一句 prompt 写明需求来接入。底层基础设施是 **Firebase & Google Cloud Identity Platform** + reCAPTCHA（防机器人）+ Clearout（邮箱验证）+ **Stytch（MFA）**。
:::

## 部署：四种类型

点 **Publish** 后选部署类型：

| 类型 | 行为 | 适合 |
| --- | --- | --- |
| **Autoscale** | 忙时自动加机器、闲时**缩到 0** 省钱 | 可变负载的 Web / API |
| **Reserved VM** | 专用 VM，成本 / 性能可预测、不中断 | 常驻 bot / 持久 API / 内存密集型 |
| **Static** | 静态站点（基本免费 / 含在订阅内） | 纯前端 / 文档站 |
| **Scheduled** | 定时任务 | 周期性 job |

Autoscale 计费：**Outbound Data Transfer**（按字节，**入站永远免费**）+ **Compute Units** + per-request。一键发布后内建 **Monitoring** + 自定义域名 + **100+ 集成**（OpenAI / Stripe / Google Workspace 等）。

::: tip 选 Autoscale 还是 Reserved VM
- 流量起伏大、想省钱、能接受冷启动 → **Autoscale**（闲时缩到 0）。
- 要常驻进程（如 Discord bot）、要稳定低延迟、内存密集 → **Reserved VM**。
:::

## 自动化与数据连接器

- **造 agent / 自动化**：Agent 3 起可用自然语言搭 **Slack / Telegram bot**、定时自动化（"Agent 3 can build other agents and automations"）。
- **数据连接器**：Agent 可直连 **BigQuery、Linear、Slack、Notion** 等查数据。

## 已知限制 / 易错点

::: warning 上手前先记这几条
- **Agent 是概率性的**：官方明示 LLM 驱动、**"may occasionally make mistakes"**——生产前需人工 review / 测试。
- **每次** Agent 交互都扣费（含纯问答 / Plan Mode 不改码）；Turbo 最贵（可达 Power 6x）；credits 用尽走 pay-as-you-go 超额，需自行控费（docs 有 "managing spend"）。
- **Replit Auth 只能经 Agent 接入**；生产数据库需显式创建（与开发库隔离），单库存储上限 **10 GiB**。
- **持续欠费会暂停已发布 app**。
- 平台**闭源、不可私有部署**；中国大陆访问需自备网络。
:::

## 与 bolt.new / v0 / Lovable 对比

> 以下竞品差异多来自第三方对比（lovable.dev、altar.io、getmocha.com 等，2026），**仅作背景**，金额 / 边界以各家官方为准。

| 工具 | 强项 | 执行环境 / 后端 | 受众 |
| --- | --- | --- | --- |
| **Replit** | **完整云端开发 + 部署一体机**，跑真实服务端运行时、**50+ 语言**，能 DB 迁移 / 监控生产 / 常驻进程，**后端最深**，老牌生态 | 服务端 Docker 容器 + Nix；内建 DB / Auth / 部署 | 工程师 + **PM / 设计 + 企业 + 非技术** |
| **bolt.new** | prompt→运行**反馈最快**，多框架 + 移动端 + 开源版 | **WebContainers 浏览器内** Node.js，后端**仅 Node/Express** | 偏技术 |
| **v0（Vercel）** | **前端 / UI 顶尖**，生成 shadcn/ui + Tailwind 组件质量业界一流 | 需后端逻辑另建，深绑 **Vercel 生态** | Vercel 系 |
| **Lovable** | **chat-first、最适合非技术 / 新手**，端到端最快验证 | **Lovable Cloud** 自动配 **Supabase** 后端 | 新手 / 非技术 |

::: tip 一句话区分
**Replit = 完整云端开发 + 部署一体机（服务端容器、最深后端、老牌生态）；bolt = 浏览器内极速 Node；v0 = Vercel 系顶尖前端；Lovable = Supabase 系可视化、对非技术最友好。**
:::

## 版本里程碑

| 时间 | 事件 |
| --- | --- |
| 2025-09-10 | **Agent 3** 发布——"most autonomous agent yet"，可自主运行 up to 200 分钟，能造其他 agent / 自动化 |
| 2025-12-04 | 此后创建的数据库**托管在 Replit 自有基础设施**（之前用 Neon） |
| 2026-03-11 | **Agent 4** 发布——"Built for creativity"，转向人在回路，**并行多 agent + kanban 任务板** |
