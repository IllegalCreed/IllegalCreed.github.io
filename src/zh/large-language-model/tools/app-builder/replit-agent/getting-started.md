---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 replit.com / docs.replit.com 2025–2026 现状编写

## 速查

- 入口：浏览器打开 [replit.com](https://replit.com/)，注册即用——代码跑在**云端服务端 Docker 容器 + Nix**（非浏览器内 WASM）
- 基本流：聊天框写想法 → Agent 规划 / 建项目 / 写码 / 自测 / 修 bug → 继续对话迭代 → 一键 **Publish**
- **首个 prompt 免费**（No credit consumption）；之后**所有 Agent 交互都计费**
- Agent 版本：**Agent 4**（2026-03-11 发布），主打**创意控制 / 人在回路** + **并行多 agent**（kanban 任务板）
- Agent 模式：**Lite**（10–60 秒微调）/ **Economy**（省 credit）/ **Power**（复杂功能）/ **Turbo**（Power 加成，最贵，仅 Pro/Ent）
- 计费单位：**effort-based + 以 checkpoint 计**（非按 token）；Plan Mode 纯问答不改码**也扣费**
- 内建数据库：全托管 **PostgreSQL 兼容**，叫 Agent「add a database」自动建库 + 改码
- 认证：**Replit Auth**（仅能经 Agent 接入，一句 prompt）/ Clerk（备选，独立品牌）
- 部署四型：**Autoscale**（闲时缩到 0）/ **Reserved VM**（常驻）/ **Static** / **Scheduled**
- 套餐：Starter 免费（1 项目）/ Core $25（2 并行）/ Pro $100（10 并行，DB 回滚 28 天）/ Enterprise，**金额以官方 [pricing](https://replit.com/pricing) 为准**
- 版本控制：**Checkpoints**——里程碑自动建快照（文件 + 对话 + 数据库），一键 rollback

## 它是什么

Replit 官方主标语是 **"Turn ideas into apps in minutes — no coding needed"**——你用自然语言描述想做的东西，**Agent** 会规划、写代码、在云端真实运行、自测并修复，最后一键上线。文档把这种工作方式定位为 **"vibe coding"**：「you bring the idea, taste, and judgment; Agent helps turn it into software you can test and improve.」

它和"只生成代码 + 静态预览框"的工具有本质区别：

| 维度 | Replit | 纯代码生成器 |
| --- | --- | --- |
| 运行环境 | 云端服务端 **Docker 容器 + Nix**（真多语言运行时） | 静态预览 / 需本地跑 |
| Agent 能力 | 建项目 / 写码 / 在浏览器预览里自测 / 自修 | 仅吐代码 |
| 全栈 | 内建 DB + Auth + 托管 + 部署，一条龙上线 | 多为前端 / UI |
| 后端深度 | 能跑 DB 迁移 / 常驻进程 / 监控生产 | 通常没有 |

::: tip 它不再是"只是个在线 IDE"
Replit 早年是老牌**在线 IDE / 编程教育**平台。如今首屏与文档全部以「描述 → 生成 app」为主线，并支持从 **GitHub / Figma / Vercel / Bolt / Lovable / ZIP 导入**（把竞品产物迁进来）。这是一次从"在线 IDE"到"AI app builder"的决定性转型。
:::

## 受众：不止开发者

Replit 把受众明确扩展到**非技术人群与企业**：Software Developers、**Product Managers**、Designers、Enterprise、SMB / founders、**non-technical builders**。官方引用的 PM 视角原话很能说明定位：

> rather than writing requirements and waiting for Figmas, I can show, not tell.

也就是说，PM / 设计师可以直接"做出来给人看"，而不是写一堆需求文档再等开发。

## 第一个应用

1. 打开 [replit.com](https://replit.com/) 注册登录，在 Agent 聊天框输入想法，例如：

```text
做一个待办事项应用：可以添加 / 勾选完成 / 删除，
数据存数据库，界面用浅色简洁风格。
```

2. Agent 会**规划任务 → 建项目 → 写代码 → 在云端真实运行 → 在浏览器预览里点按钮自测 → 修 bug**，全程你能看到它在做什么。
3. 继续对话即可修改，例如「加一个按完成状态筛选的标签」「把数据换成存数据库」。
4. 关键里程碑会自动生成 **Checkpoint**（快照），随时可一键 rollback。

::: tip 首个 prompt 免费
官方明示 **"Your first prompt is free. No credit consumption."**——第一条 prompt 不扣 credit，适合先免费试一把感受效果。之后**每次** Agent 交互都会计费（见下文计费章）。
:::

## Agent 模式：选对档省钱

Agent 有四个模式，**直接决定每次交互的花费**：

| 模式 | 定位 | 适合 | 成本 |
| --- | --- | --- | --- |
| **Lite** | 快速定向改动（10–60 秒） | 视觉微调 / 小 bug 修复 | 最低（轻量模型） |
| **Economy** | 成本优化 | 日常开发 / 学习 / 省 credit | 低 |
| **Power** | 能力优先 | 复杂功能 / 生产级 / 难题 | 中高 |
| **Turbo** | Power 加成，最多 2.5x 快 | 赶时间的复杂任务 | **最高（可达 Power 6x）** |

::: warning Lite 不适合大改
Lite 用轻量模型，**不适合架构改动 / 新集成 / 改数据库 schema**——这类任务用 Power。Turbo 默认关闭、**仅 Pro / Enterprise**，按需才开。
:::

另有 **High Effort 开关**（Economy / Power 可选）：开启后做更深推理，最难的任务成本最多 **2x**。

## Plan Mode：先规划再写码

对复杂项目，Agent 提供 **Plan Mode**：

- 把复杂项目**拆成有序任务列表**（"Break down complex projects into ordered task lists"）。
- 在多个方案间**权衡 trade-off** 后再写码（"Explore different approaches and weigh trade-offs"）。

::: warning Plan Mode 也扣费
即使 Plan Mode 只回答 / 规划、**一行代码都没改**，官方也明示 "there is still a charge"。别把它当免费问答用。
:::

## 一键上线：内建数据库 + 认证 + 部署

Replit 最大的卖点是**整条云开发链路都内建**，无需自己拼第三方：

- **数据库**：叫 Agent「add a database」，自动建集成、建 schema、改代码并加 ORM（防 SQL 注入 / schema 校验）。全托管、**PostgreSQL 兼容**。
- **认证**：**Replit Auth** 一句 prompt 接入（Google / GitHub / X / Apple / Email 登录）。
- **部署**：点 **Publish**，选部署类型（Autoscale / Reserved VM / Static / Scheduled），内建 Monitoring + 自定义域名。

::: tip 多产物共享同一后端
Agent 能在**同一个项目**里产出 web app、移动 app、slides、数据可视化，"all sharing the same backend"——一套后端撑多个前端产物。
:::

## 下一步

- [指南](./guide-line) —— Agent 4 vs Agent 3、执行环境（容器 + Nix）、计费机制、数据库 / 认证 / 部署、与 bolt/v0/Lovable 对比
- [参考](./reference) —— 套餐 / Agent 模式 / 部署类型 / 时间线速记表
