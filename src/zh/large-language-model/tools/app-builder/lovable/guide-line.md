---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 docs.lovable.dev 2025–2026 现状编写

## 速查

- **Lovable Cloud**（2025-09-29 发布）：内建后端五件套 = 数据库 / 认证 / 存储 / Edge Functions / AI，Supabase 基座、默认开启、零外部配置
- **Lovable AI**：在发布的 app 里直接用内建模型，**免自带 API key**；默认 **Gemini**（后扩 GPT），AI 调用**强制走 server-side Edge Function**（凭据留服务端）
- **GitHub 双向同步**：Lovable 里改 → GitHub，活跃分支 push → 同步回 Lovable；代码所有权归你；也支持 GitLab
- **计费 = message 制**：每条 build 消息按复杂度扣 **0.5–2 credit**，Plan mode 固定 1 / 条
- **四档计划**：Free / Pro(~$25/月) / Business(~$50/月，原 "Teams") / Enterprise（金额功能向，以官方为准）
- **集成**：Supabase / Stripe / GitHub / GitLab / Resend 有官方专页；**Clerk / Figma 非官方内置连接器**
- **安全铁律**：前端硬编码密钥 = 已泄露（须经 Edge Function）；发布前敏感表必开 **RLS**；平台发布前强制安全扫描
- **三大差异化**：① 可视化点选编辑 ② Supabase 全栈自动供给 ③ GitHub 双向同步 + 代码所有权 + 发布前安全扫描

## Lovable Cloud：内建全栈后端

**发布于 2025-09-29。** Lovable Cloud 是平台内建的全栈后端，定义为「Lovable's built-in full-stack platform with database, authentication, storage, edge functions, and AI for your app, all with no external setup」。它**基于 Supabase 开源基座**，开箱即用，无需单独打开 Supabase dashboard 或配置屏：

| 能力 | 说明 |
| --- | --- |
| **数据库** | 自动生成 schema，UI 里直接增删改，无需写 SQL |
| **认证** | 邮箱 / 手机 / Google 登录，自动生成登录注册页 |
| **存储** | 文件上传 / 管理，存项目 bucket |
| **Edge Functions** | Serverless 自定义逻辑 / API |
| **AI** | 内建模型（见下一节） |

::: tip 默认开启 + 新老项目策略
- 「By default, Lovable Cloud is enabled for your workspace」——默认开启（在 Connectors → App connectors → Lovable Cloud 管理权限）
- **新项目**：可选 Lovable Cloud 或直接 Supabase 二选一
- **已有 Supabase 项目**：保持不变，继续用
:::

## Lovable AI：免自带 key 的内建 AI

**Lovable AI** 让你在**发布出去的 app** 里直接用内建模型，定义为「Built-in AI models you can use inside the apps you publish, for chatbots, summaries, sentiment detection, image generation, semantic search, and more」。核心价值是 **"No API keys or provider setup required"**——免去申请 key、多方计费、各家响应格式适配。

::: warning 安全实现（关键考点）
Lovable AI 的调用**走 Lovable 自动创建的 secure backend edge function，不在浏览器直接调用**，凭据与 prompt 留在服务端。这正是「密钥不能进前端」铁律的落地方式。
:::

**支持模型（采集于 2026-06-18，清单变动快，以官方为准）：**

| 系列 | 代表模型 | 备注 |
| --- | --- | --- |
| **Google Gemini（默认）** | Gemini 3 Flash (preview)、3.5 Flash、3.1 Pro Preview、2.5 Pro/Flash | 发布之初官方 blog 仅提 "powered by Google Gemini models" |
| **OpenAI GPT（后扩）** | GPT-5.5 Pro / 5.4 Pro（强推理）、GPT-5 Mini/Nano（省成本）、GPT Image 2（生图） | 后续扩充 |
| **Embedding** | 语义搜索 / RAG 用 | — |

::: danger 模型清单与价格变动极快
上表仅为采集快照。**模型清单、默认模型、价格随时调整，一切以官方页面实时为准。** 计费按 **Run credits**（按 token 量从额度扣），免费工作区每月有 AI grant。
:::

## 工作流：对话 → 编辑 → 同步 → 部署

官方总流程：「Describe what you want to build → Review and iterate on the generated application → Sync code to GitHub → Deploy, operate, and govern according to your standards」。

### 生成与编辑模式

- **Build / Plan / Code** 三种核心模式（agent 驱动）
- **Plan Mode 固定 1 credit / 条**；Build Mode 按复杂度计费（见下文计费章节）

### 可视化编辑（Preview Toolbar）

新版 Preview Toolbar 取代旧 Visual edits 面板，三种交互的**计费差异是最大易错点**：

| 交互 | 作用 | 计费 |
| --- | --- | --- |
| **Edit Text Inline** | 行内原地改文字 | ✅ 免费，每用户每天 ≤100 次 |
| **Select Elements** | 点选元素 + 自然语言改样式 | ❌ 按 chat 计 credit |
| **Draw Annotation** | 预览上手绘标注 | ❌ 计 credit |

::: danger 计费边界再强调
真正免费的「点选改 UI」只有**行内改文字**（每日 100 次内）。**点选改样式、涂画标注都消耗 credit。**
:::

### GitHub 双向同步（强差异化）

**真双向同步**：「Edits in Lovable appear in GitHub, and changes pushed to the active GitHub branch sync back into Lovable」。两层结构：

1. **Workspace 连接**：安装 Lovable GitHub App，授权账号 / 组织
2. **Project ↔ Repo** 一对一绑定

价值：**代码所有权**、克隆到本地用自己 IDE 改、PR / 分支 / code review、可脱离 Lovable 独立部署。**也支持 GitLab。**

### 部署 + 自定义域名

- 默认发布域名 **`xxx.lovable.app`**（目前**无法移除**该项目 URL）
- **自定义域名仅限付费计划**：可在 Lovable 内买域名（Entri 自动配置 / 手动 DNS），或接入已有域名；连域名不收月费，只付注册 / 续费
- 一键部署，也可经 GitHub 到 Vercel / Netlify 等

## 集成生态（60+ 连接器）

集成分两类，**区分很重要**：

| 类型 | 范围 | 是否进部署产物 |
| --- | --- | --- |
| **App Connectors（生产）** | workspace 级，部署后的 app 可调用；admin 配一次、控权限 | ✅ |
| **Chat Connectors / MCP Servers（仅开发期）** | 构建时给上下文用，仅本人可见 | ❌ 不进部署 |
| **自定义 API** | 任意外部 API；密钥作为 secret 存 Cloud 项目，只经 Edge Functions 访问 | ✅ |

**常被问到的集成核对：**

| 集成 | 状态 | 说明 |
| --- | --- | --- |
| **Supabase** | ✅ 官方专页 | 后端 / Cloud 底座 |
| **Stripe** | ✅ 官方专页 | 支付 / 计费 |
| **GitHub / GitLab** | ✅ 官方专页 | 版本控制（双向同步） |
| **Resend** | ✅ 官方专页 | 邮件 |
| **Figma** | ⚠️ 非连接器 | 支持「导入设计 / 资产」，并非 Figma 连接器 |
| **Clerk** | ⚠️ 非内置 | 认证默认走 Lovable Cloud / Supabase Auth；Clerk 仅可选第三方 |

其他重点连接器：AI 类（Replicate、ElevenLabs、Perplexity）、数据 / CMS（Airtable、Notion、Contentful）、数仓（BigQuery、Snowflake、Databricks、AWS S3）、CRM（HubSpot、Salesforce）、电商（Shopify、WooCommerce）、通信（Slack、Twilio、Telegram）等。

## 安全实践（教学必讲的坑）

官方 Security Best Practices 明确两大风险点：

::: danger 1. 前端硬编码密钥 = 已泄露
「Secrets stored in frontend code are visible to users and should be considered compromised.」反例直接点名 `const API_KEY = "sk-..."` / `STRIPE_SECRET`。

**正确做法：密钥存后端，只经 Edge Functions 访问，绝不进浏览器代码。**
:::

::: danger 2. RLS 配置不当 → 越权读数据
RLS（行级安全）「acts as a final layer of protection, enforcing access rules even if frontend or backend logic fails」。要求：

- **发布前所有敏感表必须开 RLS**，用户不能读到他人私有数据
- 「RLS is much easier to change before real data exists」——有真实数据前改更省事
:::

**平台侧防护**：发布前自动安全扫描（pre-publish security scan）、Sensitive Data Scanning、Security Center、第三方扫描集成（Aikido、Wiz）。

::: tip 工具兜底 ≠ 免责
vibe coding 工具早期普遍被讨论「生成 app 暴露密钥 / RLS 没开导致数据越权」，这正是 Lovable 把「密钥进 Edge Function + 发布前强制扫描 + RLS 检查清单」做成默认门禁的原因。但**开发者仍须核对 RLS 与密钥位置**。
:::

## 计费机制（credit / message 制）

::: warning 金额以官方为准
定价 / 额度变动频繁，下文采集于 **2026-06-18**，落稿前务必回查 [lovable.dev/pricing](https://lovable.dev/pricing)。
:::

**计划（四档）：Free / Pro / Business / Enterprise**

| 计划 | 价格（约） | 关键点 |
| --- | --- | --- |
| **Free** | $0 / 月 | 每天 5 credit、每月封顶 30；Cloud grant 20 / 月、AI grant 4 / 月 |
| **Pro** | **~$25 / 月**（年付 ~$21/月） | 100 credit 档；每日 5 credit 可累积；top-up $0.30 / credit |
| **Business** | **~$50 / 月**（年付 ~$42/月） | **SSO**、可退出用数据训练（data opt-out）；top-up $0.60 / credit |
| **Enterprise** | 定制报价 | SCIM、审计日志、发布控制、SSO、专属支持 / onboarding |

::: tip "Teams" 是旧称
官方第三档现称 **"Business"**，「Teams」是旧称 / 通称——统一用 **Business**。
:::

**credit / message 计费机制（核心考点）：**

- **每条 build 消息按复杂度扣 credit**，区间约 **0.5 ~ 2**：

| 示例消息 | 约耗 credit |
| --- | --- |
| "Make the button gray"（改按钮颜色） | 0.50 |
| "Remove the footer"（删页脚） | 0.90 |
| "Add authentication"（加认证） | 1.20 |
| "Build a landing page with images"（带图落地页） | 2.00 |
| **Plan Mode 任意一条** | 固定 1.00 |

- credit 也用于：发消息构建、**Cloud 托管**、给 app 内 AI 功能供能（Run credits 按 token 扣）
- **过期规则**：月付方案 credit 发放后 **2 个月**过期；年付方案在年度结束后 **1 个月**过期；top-up credit 自购买起 **12 个月**；每日 build credit 当天清零；专项 grant（Cloud / AI）不滚存

## 与 Bolt.new / v0 对比

| 维度 | **Lovable** | Bolt.new | v0 (Vercel) |
| --- | --- | --- | --- |
| 范围 | **全栈**（前端 + 后端 + DB + 部署） | 全栈（浏览器 WebContainer） | **仅前端 UI 组件** |
| 默认栈 | React + Supabase（+Vite/TS/Tailwind/shadcn） | Node + 自家 Bolt Database | React 组件（后端自备） |
| 后端 / DB | 自动供给（Supabase / Lovable Cloud） | 自动供给（Bolt Database） | **需自带后端** |
| 可视化编辑 | **点选 + 行内改文字（部分免费）** | 靠改代码 / prompt | 靠改代码 / prompt |
| GitHub | **持续双向同步、代码所有权** | 有 | 生成组件需手动并入 |
| 安全 | **发布前强制安全扫描 + RLS 清单** | — | — |
| 最适合 | **想少写代码、最快上线全栈想法** | 速度优先、浏览器内即跑、Demo | 给已托管在 Vercel 的项目做高质量 React UI |

**Lovable 三大差异化记忆点**：① 可视化点选编辑（部分免费）② Supabase 全栈自动供给 ③ GitHub 双向同步 + 代码所有权 + 发布前安全扫描。

## 限制 / 注意点

- 默认 `*.lovable.app` 项目 URL **无法移除**；自定义域名仅付费档
- 可视化编辑「免费」只覆盖**行内改文字**（每日 100 次内）；点选改样式 / 标注仍耗 credit
- 复杂消息单条最高约 2 credit，**大型迭代消耗快**，免费档（30 / 月）很快见底
- **模型清单 / 定价 / 额度变动频繁，一切金额与模型以官方页面实时为准**
- 平台闭源、不能私有部署（但代码归用户、可经 GitHub 导出）

## 公司背景（标杆叙事）

- **2025-12-18**：完成 **$330M Series B，估值 $6.6B**（5 个月内估值翻 3 倍多），领投 CapitalG + Menlo Ventures，NVIDIA / Salesforce / Databricks / Atlassian / HubSpot 等参投
- **增长**：2024 年成立；约 8 个月达 **$100M ARR**，再 4 个月破 **$200M ARR**；CEO **Anton Osika** 称达 $100M ARR「faster than OpenAI, Cursor, Wiz, and every other software company in history」
- **规模**：每天 **>100,000** 新项目，首年累计 **>2500 万** 项目；客户含 Klarna、Uber、Zendesk
