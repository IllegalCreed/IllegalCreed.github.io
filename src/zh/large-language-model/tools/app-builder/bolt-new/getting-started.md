---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 bolt.new 2025–2026 现状编写

## 速查

- 入口：浏览器打开 [bolt.new](https://bolt.new/)，无需安装——它跑在 **WebContainers**（浏览器内的 Node.js 环境）
- 基本流：聊天框写想法 → **Build now** → 生成可运行 app → 继续对话迭代
- 默认模型：**Claude 系 + 平台自动路由**（按任务平衡质量与成本，不要记死具体版本号）
- 两个 agent：**Standard**（日常、省 token，Free 仅此项）/ **Max**（强推理、付费才有）
- 省 token：先用 **Plan Mode**（Bolt Agent）/ **Discussion Mode**（v1 legacy）聊清楚再生成
- 预览：浏览器内真实运行（可 `npm install`、开终端、看 console），非静态截图
- 改与回退：支持 diff 查看、**Version History** 可视化恢复历史版本
- 部署：右上 **Publish** → 选 **Bolt Cloud**（得 `.bolt.host` 子域名）或 **Netlify** → 约 1 分钟出链接
- 导入：可从 **Figma / GitHub / Google Stitch** 导入设计或仓库
- 后端：新项目默认 **Bolt Database**；要 Supabase 后端**早做选型**（仅 Vite，不支持 Next.js）
- 计费：Free / Pro / Teams / Enterprise 四档，按 **token** 计量，**一切以官方 [pricing](https://bolt.new/pricing) 为准**
- 开源版：[bolt.diy](https://github.com/stackblitz-labs/bolt.diy)（MIT、可换 19+ 模型、可自托管 / Docker）

## 它是什么

bolt.new 是 StackBlitz 出品的 **AI 全栈应用生成器**——官方定义为「an AI-powered builder for websites, web apps, and mobile apps」。你用自然语言描述想做的东西，它生成可在浏览器内即时运行、可一键部署的全栈应用。

它和"只生成代码 + 静态预览框"的工具有本质区别：

| 维度 | bolt.new | 纯代码生成器 |
| --- | --- | --- |
| 运行环境 | WebContainers（浏览器内真 Node.js） | 静态预览 / 需本地跑 |
| AI 能力 | 掌控文件系统 / 包管理 / 终端 / console | 仅吐代码 |
| 安装 | 零安装，开浏览器即用 | 通常要本地环境 |
| 全栈 | 前端 + 后端（Bolt Cloud） | 多为前端 / UI |

::: tip 为什么"浏览器里能跑 Node"很关键
WebContainers 是 StackBlitz 发明的技术——「the technology that first made it possible to run Node.js directly in your browser」。所以 bolt.new 的预览是**真实运行**而非渲染，AI 可以真的 `npm install`、起服务、读报错日志再自我修正。
:::

## 第一个应用

1. 打开 [bolt.new](https://bolt.new/)，在聊天框输入想法，例如：

```text
做一个待办事项应用：可以添加 / 勾选完成 / 删除，
数据存本地，界面用浅色简洁风格。
```

2. 点 **Build now**，Bolt 会规划文件结构、写代码、在右侧 WebContainers 里**真实运行**并给出预览。
3. 继续对话即可修改，例如「加一个按完成状态筛选的标签」「把主色换成蓝色」。
4. 每次改动都可在 **Version History** 里回看 / 恢复，代码改动可用 **diff** 查看。

::: tip 善用 Enhance prompt 与 Prompt Library
- **Enhance prompt**（提示增强）：把你随手写的需求自动扩写得更完整。
- **Prompt Library**（2025-07 上线）：收藏 / 复用高质量提示词模板。
:::

## 模型与两个 Agent

bolt.new **不让你逐个挑模型**，而是由平台自动路由——官网原话「Bolt automatically routes to the right model for each task, balancing quality and cost」。默认走 **Claude 系**（Bolt V2 的 Release Notes 明确写「Claude Agent as default LLM」）。

你能选的是**两个 agent 档位**：

| Agent | 定位 | 适合 | 可用范围 |
| --- | --- | --- | --- |
| **Standard** | 均衡、快、省 token | 中小应用、UI 改动、常规开发、**定义清晰**的任务 | 含 Free |
| **Max** | 最大推理，每步想得更多 | 大型代码库、复杂依赖、重构、开放式问题 | **付费才有** |

::: warning 不要记死模型版本号
官方帮助页 / README 一般**不点名具体模型版本**（只在 system prompt 与 Release Notes 提到 Claude / Anthropic）。讲课与笔记口径统一为「**默认 Claude 系 + 自动路由**」，别把某个版本号当成长期事实——它会变。
:::

::: tip v1 Agent 正在退役
旧的 v1 Agent（legacy）：**2026-04-13 起新项目不能再选 v1**，**2026-08-03 退役**，遗留项目自动迁移到默认（Standard）agent。
:::

## Plan / Discussion Mode：先聊清楚再动代码

token 主要消耗在"Bolt 读取并同步你的整个项目文件"上——**项目越大，每条消息越贵**。所以动手前先把需求聊明白能显著省 token：

- **Plan Mode**（Bolt Agent）/ **Discussion Mode**（v1 legacy）：「Chat with Bolt to get help without immediately generating code」。
- 价值：「save tokens by avoiding unnecessary code exchanges」「ensure you get things right before moving into Build Mode」。
- 每条消息都带项目代码做上下文，且能联网做实时检索。

::: tip 省 token 三板斧
1. 先用 Plan / Discussion Mode 把方案敲定，再切 Build。
2. 保持项目精简，别让无关文件膨胀上下文。
3. prompt 写清楚一次到位，减少来回返工。
:::

## 部署：一键 Publish

点右上 **Publish** → 选 hosting → 确认 → 约 1 分钟出链接：

| 目标 | 行为 | 注意 |
| --- | --- | --- |
| **Bolt Cloud** | 自动 `.bolt.host` 子域名 + 内置自定义域名管理 | Free 即有子域名，自定义域名需付费 |
| **Netlify** | 自动随机 `netlify.app` 域名，Teams 可改 | **必须首次发布前就选 Netlify**，否则默认走 Bolt Cloud |

也支持手动：`npm run build` → 下载产物 → 拖拽上传到 Netlify。

::: warning Netlify 要趁早选
要用 Netlify 托管**必须在首次发布前选定**；不选则默认走 Bolt Cloud（`.bolt.host`）。
:::

## 选后端：Bolt Database vs Supabase

这是高频易错点，建议**项目一开始就决策**：

- 新项目**默认用 Bolt Database**（按需自动创建，体验最简）。
- 想要更强的数据掌控 / 高级能力，可改用 **Supabase**（Postgres + 鉴权 + 存储 + Edge Functions + Realtime）。
- **「Switching from a Bolt Database to Supabase later requires extra steps」**——后期再切换有额外步骤。
- **Supabase 连接目前仅支持 Vite 项目，Next.js 暂不支持**。

::: warning 后端选型铁律
如果确定要用 Supabase，请在建项目时就选好框架（**Vite**，别用 Next.js），并尽量一开始就接 Supabase，避免日后从 Bolt Database 迁移的额外成本。
:::

## bolt.new 还是 bolt.diy？

| | bolt.new | bolt.diy |
| --- | --- | --- |
| 性质 | StackBlitz 托管的**商业 SaaS** | **MIT 开源**社区版 |
| 运行 | 云端 WebContainers | 可本地 / 自托管 / Docker / Electron |
| 模型 | 默认 Claude 系 + 自动路由 | **每个 prompt 可换**，支持 19+ 提供商 |
| 适合 | 想即开即用、要托管 + 后端一条龙 | 想完全掌控、换模型、私有部署 |

入门先用 **bolt.new**（开浏览器即可）；想自托管或自带模型再看 [指南](./guide-line) 里的 bolt.diy 部分。

## 下一步

- [指南](./guide-line) —— WebContainers、Bolt Cloud 两阶段、Supabase 限制、token 机制、bolt.diy、与 v0/Lovable 对比
- [参考](./reference) —— 套餐 / 集成 / token 速记表
