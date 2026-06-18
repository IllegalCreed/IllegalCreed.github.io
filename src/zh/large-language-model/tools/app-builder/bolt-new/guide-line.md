---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 bolt.new 2025–2026 现状编写

## 速查

- 内核：**WebContainers**——浏览器内原生跑 Node.js，AI 掌控文件系统 / 包管理 / 终端 / console，是"真环境"而非预览框
- 模型：默认 **Claude 系 + 自动路由**；可选 **Standard / Max** 两个 agent（Free 仅 Standard，Max 付费）
- **Bolt Cloud 两阶段**：2025-08 先整合 **Hosting + Domains**（一键 `.bolt.host`）；**2025-09-30** 才是 **Supabase 驱动的后端 GA**（DB / 鉴权 / 存储 / Edge Functions / Realtime）
- 后端选型：新项目默认 **Bolt Database**；切 Supabase **仅 Vite、不支持 Next.js**，且后期切换有额外步骤——**早决策**
- token：消耗大头来自"同步整个项目文件"，项目越大越贵；Plan / Discussion Mode 省 token
- 计费四档：**Free**（日 300K / 月 1M，仅 Standard）/ **Pro** $25（月 10M、无日限、滚存最多 2 月 FIFO）/ **Teams** $30/席 / **Enterprise**——**金额以官方 [pricing](https://bolt.new/pricing) 为准**
- 滚存规则：付费未用 token 最多留 2 月，**FIFO**（先用最老的桶），Reload 加购 token 不过期
- 导入：Figma / GitHub / Google Stitch；移动端经 **Expo + React Native**；可连 **MCP server**
- **bolt.new ≠ bolt.diy**：前者 StackBlitz 商业 SaaS；后者 **MIT 开源**、可换 **19+ 模型**、可自托管 / Docker / Electron
- 选型口诀：不会写代码要最快验证 → Lovable；技术向 / 大代码库 / 移动端 → bolt.new；高质量 React/Next UI → v0

## 底层内核：WebContainers

bolt.new 构建在 **WebContainers** 之上——StackBlitz 发明的、第一个让 Node.js 能直接在浏览器里跑的技术。这决定了它的全部体验：

- **零安装**：开浏览器即得一个完整开发环境，无需本地装 Node / 配环境。
- **真实运行**：AI agent 拥有对 **文件系统 / 包管理器 / 终端 / 浏览器 console** 的控制权，可以真的 `npm install`、起 Node server、读报错日志再自我修正。
- **与"代码生成器"本质不同**：不是吐一段代码 + 静态预览，而是在浏览器内跑一个真的 dev server。

::: tip 这解释了很多行为
- 为什么预览能交互、能连数据库、能跑终端命令——因为它是真环境。
- 为什么 token 烧得快——AI 要持续读取 / 同步整个项目的文件树才能理解上下文。
:::

## 默认模型与自动路由

bolt.new 刻意**不暴露逐个选模型**，而是平台自动路由：「Bolt automatically routes to the right model for each task, balancing quality and cost」。Bolt V2 起默认 LLM 为 **Claude Agent**。

你能控制的是**两个 agent 档位**：

| Agent | 官方描述要点 | 适合 | 范围 |
| --- | --- | --- | --- |
| **Standard** | Balanced for everyday building，fast and token-efficient | 中小应用、UI 改动、常规开发、定义清晰的任务 | 含 Free |
| **Max** | Maximum reasoning for complex tasks，每步想得更多 | 大型代码库、复杂依赖、重构、开放式问题，对详细 prompt 反应更好 | 付费 |

::: warning 准确性红线：别写死版本号
官方帮助页 / README 通常不点名具体模型版本（仅 system prompt / Release Notes 提到 Claude / Anthropic）。历史上出现过「Opus 4.x is now available」字样，只能印证它属 Anthropic Claude 系，**不能当作长期固定版本**。统一表述：**默认 Claude 系 + 自动路由**。
:::

::: tip v1 Agent 退役时间线
v1 Agent（legacy）：**2026-04-13 起新项目不能再选**，**2026-08-03 退役**，遗留项目自动迁移到默认（Standard）agent。
:::

## 核心工作流

1. **对话生成**：聊天框写想法 → **Build now** → 生成可运行产品。
2. **迭代修改**：继续对话即可改；支持 **diff** 查看、**回滚 / 版本历史**（Version History 可视化恢复）。
3. **浏览器内即时预览**：WebContainers 真实运行，可交互、可连后端。
4. **一键部署**：右上 **Publish**（见下文）。
5. **Enhance prompt + Prompt Library**：帮你把需求写得更完整、复用模板。
6. **Plan Mode（Bolt Agent）/ Discussion Mode（v1 legacy）**：先聊清楚再动代码，省 token。

### 导入能力

| 来源 | 用途 |
| --- | --- |
| **Figma** | 把设计稿导入为起始 UI |
| **GitHub** | 导入现有仓库，做版本管理 |
| **Google Stitch** | 设计一键导出到 Bolt（2025-05） |
| 自有设计系统 | 企业可带入品牌组件库（Material UI / Chakra / Shadcn 等） |

## Bolt Cloud：从 demo 到生产（分两阶段上线）

Bolt Cloud 给 vibe coding 补上"做出来之后还要扛生产"的能力。**这里有个高频易错点：它不是单一日期一次性全功能上线，而是分两个阶段**：

| 阶段 | 时间 | 内容 |
| --- | --- | --- |
| 阶段一 | **2025-08** | 整合 **Hosting + Domains**，启用一键发布到 `.bolt.host` |
| 阶段二 | **2025-09-30** | **Supabase 驱动的后端正式 GA**：数据库 / 鉴权 / 存储 / 函数 |

::: warning 准确性红线：Bolt Cloud 别写成"一次全上"
讲课 / 笔记按"分阶段上线"表述才准确——8 月先有托管 + 域名，9/30 才是 Supabase 后端 GA。
:::

阶段二每个需要后端的 Bolt Cloud 项目「powered by Supabase」，包含：

- A full Postgres Database（完整 Postgres 数据库）
- Authentication and user management（鉴权与用户管理）
- Storage for files, videos, and more（文件 / 视频等存储）
- Edge Functions（边缘函数）
- Realtime（实时）

价值主张：「the speed of vibe coding and the standards enterprises require」，可「build in a weekend and scale to millions」。

### 托管与域名

- 每个项目自带内置 hosting，免费用户得 **`.bolt.host` 子域名**（一键发布）。
- 自定义域名需付费。

## Supabase 集成的两个限制（必考）

这是 bolt.new 最容易踩的两个坑，建议**项目一开始就规划好后端**：

::: warning 限制一：仅 Vite，不支持 Next.js
Supabase 连接**目前仅支持 Vite 项目，Next.js 暂不支持**。如果你打算用 Supabase 后端，建项目时就选 Vite。
:::

::: warning 限制二：Bolt Database → Supabase 切换有额外步骤
新项目默认用 **Bolt Database**（按需自动创建，最省心）；想要高级能力 / 更强数据掌控再改用 **Supabase**。但官方明确「Switching from a Bolt Database to Supabase later requires extra steps」——**后期切换有额外成本，建议早决策**。
:::

| 选项 | 何时用 | 代价 |
| --- | --- | --- |
| **Bolt Database** | 想最快出原型，后端需求简单 | 后期换 Supabase 要额外步骤 |
| **Supabase** | 要 Postgres / 鉴权 / 存储 / Edge Functions 等完整后端 | 仅 Vite；建议项目初就接入 |

## 部署与集成

点右上 **Publish** → 选 hosting → 确认 → 约 1 分钟出链接：

| 目标 | 行为 | 注意 |
| --- | --- | --- |
| **Bolt Cloud** | 自动子域名 + 内置自定义域名管理 | Free 即有 `.bolt.host`，自定义域名付费 |
| **Netlify** | 自动随机 `netlify.app` 域名，Teams 可改 | **必须首次发布前选定**，否则默认走 Bolt Cloud |

也支持手动：`npm run build` → 下载 → 拖拽上传到 Netlify。

其它集成：

| 集成 | 说明 | 起始 |
| --- | --- | --- |
| **Supabase** | 数据库 / 鉴权 / Edge Functions 后端 | 2025-09-30 GA |
| **GitHub** | 导入仓库 + 版本管理 | — |
| **Figma / Google Stitch** | 设计导入 | — |
| **Expo（移动端）** | Expo 起始模板 + React Native 代码生成，可打包到 iOS / Android | Bolt V2（2025-02） |
| **MCP** | 可连接 MCP server 扩展能力 | 2025-02 起 |

## token 计费机制

> 金额与额度仅作"功能向"理解，**一切以官方 [pricing](https://bolt.new/pricing) 为准**（计费常变）。

### token 怎么算

- token 是 LLM 处理文本的基本单位（短词约 1 token，长 / 生僻词拆成多个）。
- **大头消耗来自 Bolt 读取 / 理解 / 同步你的项目文件**——「larger projects use more tokens per message」。这是"token 烧得快"的根因，也是 Plan / Discussion Mode 能省 token 的原理。

### 四档套餐（功能向）

| 档位 | 价格 | token | 关键内容 |
| --- | --- | --- | --- |
| **Free** | $0 | 每日 300K / 每月 1M | 公开 + 私有项目；网站带 Bolt 品牌标；10MB 上传；**仅 Standard agent** |
| **Pro** | $25 / 月 | 每月起 10M，**无每日上限** | 去品牌标；100MB 上传；**未用 token 滚存**；自定义域名、SEO；AI 图片编辑；可用 Max |
| **Teams** | $30 / 月·每席 | Pro 全部 + | 集中账单；团队访问管理；细粒度管理员控制；私有 NPM registry；Design System |
| **Enterprise** | 定制 | Pro 全部 + | 高级安全（SSO、审计日志、合规）；专属客户经理 + 24/7 支持；定制工作流 |

::: tip 金额仅供参考
$25 / $30 / 10M token 等数字会随官方调整而变，**写题 / 做决策一律以 [bolt.new/pricing](https://bolt.new/pricing) 为准**。
:::

### 额度重置与滚存（易错）

| 规则 | 说明 |
| --- | --- |
| Free 重置 | token 在**每月 1 号**重置 |
| 付费重置 | 在**订阅续费日**重置（如 7/15 订阅则每月 15 号重置） |
| 滚存上限 | 付费用户未用 token **最多保留 2 个月**（自发放日起），且需维持订阅 |
| 消耗顺序 | **FIFO**——先用最老的（滚存）桶，再用本期新 token；过期作废 |
| Reload 加购 | 加购的 reload token **不过期**（Pro 年付可加购） |

## bolt.diy：开源自托管版

[bolt.diy](https://github.com/stackblitz-labs/bolt.diy) 是「the official open source version of Bolt.new」——「Prompt, run, edit, and deploy full-stack web applications using **any LLM you want**!」。

::: warning 严格区分 bolt.new 与 bolt.diy
- **bolt.new** = StackBlitz 托管的**商业 SaaS**，默认 Claude，跑在云端 WebContainers。
- **bolt.diy** = **MIT 开源**，可本地 / 自托管，**每个 prompt 可换不同模型**。
- 二者不是同一套部署，别混为一谈。
:::

| 维度 | bolt.diy |
| --- | --- |
| 起源 | 最初由 Cole Medin 发起，后发展为 stackblitz-labs 下的大型社区项目 |
| 许可证 | **MIT**（个人 / 商业均可，限制极少） |
| 部署 | 完全开源、可自托管、**Docker 支持**、**Electron 桌面应用** |
| 模型 | **支持 19+ 提供商**：OpenAI、Anthropic、Google(Gemini)、Groq、xAI、DeepSeek、Mistral、Cohere、Together、Perplexity、HuggingFace、OpenRouter、Moonshot(Kimi)、Bedrock、Ollama、LM Studio 等，及任意 OpenAI-like / Vercel AI SDK 支持的模型 |
| 能力 | 集成终端、代码回滚、项目下载、直接部署 Netlify / Vercel / GitHub Pages、数据可视化、Git 集成、**MCP 支持**、搜索、文件锁、diff、Supabase 集成 |

## 限制与易错点

- **token 烧得快**：消耗主要来自"同步整个项目文件"，项目越大越贵；Free 每日 300K 很容易触顶。对策：用 Plan / Discussion Mode 先聊清楚、保持项目精简、prompt 明确。
- **复杂逻辑仍需懂代码**：适合快速验证 / 中小应用；大型、强依赖、需重构的场景要上 Max 且仍需人审。第三方实测也指出 Bolt Cloud 后端较新、最佳实践仍在沉淀。
- **不是传统 IDE**：浏览器内 WebContainers 环境不等于本地 VS Code。
- **Supabase 仅 Vite、不支持 Next.js**；Bolt Database → Supabase 后期切换有额外步骤——**早做后端选型**。
- **Netlify 必须首次发布前选定**；否则默认走 Bolt Cloud（`.bolt.host`）。
- **模型版本不要写死**：默认 Claude 系 + 自动路由，具体版本会变，帮助页通常不点名。

## 与 v0 / Lovable 的区别

> 以下竞品对比为第三方综合，仅作背景参考。

| 工具 | 强项 | 后端 | 受众 |
| --- | --- | --- | --- |
| **bolt.new** | WebContainers 浏览器内"真环境"全栈 + 多框架自由 + 移动端(Expo) + 开源版 bolt.diy | Bolt Cloud / Supabase | 偏技术，能做更大代码库 |
| **v0（Vercel）** | 生成高质量 React / Next.js **UI 组件** | 自己接（Supabase / Firebase） | 偏 Vercel 生态 |
| **Lovable** | 端到端最快验证，极适合不会写代码的人 | Lovable Cloud（同基于 Supabase） | 更 React-focused |

::: tip 选型口诀
- 不会写代码、要最快验证 → **Lovable**
- 技术向、要控制权 / 大代码库 / 移动端 → **bolt.new**
- 要高质量 React / Next UI 或在 Vercel 生态 → **v0**
:::

## 出题 / 写笔记的准确性红线

- 技术名前缀统一用 **bolt.new**（或明确区分 **bolt.diy**）。
- **计费数字一律加"以官方 pricing 为准"**，别把 $25 / $30、10M token 当永恒事实。
- **不点名具体模型版本号**，用"默认 Claude 系 + 自动路由"。
- **Bolt Cloud 上线分两阶段**（8 月 Hosting / Domains；9/30 Supabase 后端 GA），别写成单一日期全功能。
- **`.bolt.host` 子域名免费即有，自定义域名付费**。
- **Supabase 仅 Vite、不支持 Next.js**；**Bolt Database → Supabase 切换有额外步骤**——高频考点。
- **bolt.diy = MIT 开源、可换 19+ 模型、可自托管 / Docker / Electron**，与 bolt.new(SaaS) 严格区分。
