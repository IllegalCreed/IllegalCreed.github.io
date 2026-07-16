---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 bmad-code-org/BMAD-METHOD V6（提交 `717479b`，2026-07-15）的 README 与 docs 编写。

## 速查

- **装**：`npx bmad-method install`（先决条件 Node ≥20.12 / Python ≥3.10 / uv）
- **非交互（CI/CD）**：`npx bmad-method install --directory <path> --modules bmm --tools claude-code --yes`
- **问下一步**：`bmad-help`（随时问「我做完架构了，接下来做什么」）
- **BMM 四阶段**：1-分析 → 2-规划 → 3-方案 → 4-实现，对应域专家 analyst → pm/ux → architect → dev
- **多角色同场**：`bmad-party-mode` 把多个 persona 拉进一个会话
- **模块**：BMM(核心 34+ 工作流) / BMB(Builder) / TEA(测试架构) / BMGD(游戏) / CIS(创意)
- **Web Bundles**：规划技能打包为 Gemini Gems / ChatGPT GPTs，web 订阅做规划再带进 IDE

## 安装

先决条件：[Node.js](https://nodejs.org) ≥20.12、[Python](https://www.python.org) ≥3.10、[uv](https://docs.astral.sh/uv/)。

```bash
npx bmad-method install
```

跟着向导走，然后在你的 AI IDE（Claude Code / Cursor 等）打开项目文件夹。想要最新预发布用 `npx bmad-method@next install`（churn 更高）。

**非交互安装**（CI/CD）：

```bash
npx bmad-method install --directory /path/to/project --modules bmm --tools claude-code --yes

# 用 --set 覆盖模块配置（可重复）
npx bmad-method install --yes --modules bmm --tools claude-code \
  --set bmm.project_knowledge=research --set bmm.user_skill_level=expert
```

## 不知道下一步？问 bmad-help

```text
bmad-help
bmad-help 我刚做完架构，接下来做什么？
```

`bmad-help` 会告诉你下一步是什么、什么是可选的——它是贯穿整个流程的智能向导。

## BMM 四阶段 + 域专家

核心 BMM 模块把敏捷开发拆成四阶段，每阶段有对应的域专家 agent：

| 阶段 | 域专家 agent | 干什么 |
| --- | --- | --- |
| **1 分析** | `bmad-agent-analyst` | 分析、需求、研究、产品简报 |
| **2 规划** | `bmad-agent-pm` / `bmad-agent-ux-designer` | PRD、UX 规格、规划工作流 |
| **3 方案** | `bmad-agent-architect` | 架构、技术方案 |
| **4 实现** | `bmad-agent-dev` | 敏捷实现 |

> agent 是**专家协作者**——它引导你走结构化流程、把你的最佳思考逼出来，而非替你思考出平庸结果。

## Party Mode：多角色同场

```text
bmad-party-mode
```

把多个 agent persona 拉进一个会话协作讨论——PM、架构师、UX 可以在同一场里从各自视角碰撞。这是 BMAD 的特色：不是单角色单线程，而是多专家圆桌。

## 为什么用 BMAD

> 传统 AI 工具替你思考，产出平庸结果。BMAD 的 agent 和 facilitated workflow 作为专家协作者，引导你走结构化流程，在与 AI 的协作中把**你的最佳思考**逼出来。

四个卖点：AI 智能帮助（bmad-help）、规模-领域自适应、结构化工作流（敏捷最佳实践）、专业 agent（12+ 域专家）。

## Web Bundles：规划搬到 web 订阅

Web Bundles 把选定的 BMad 技能打包为 **Google Gemini Gems** 和 **ChatGPT Custom GPTs**。用它们在 web LLM 订阅里做前期规划（头脑风暴、产品简报、PRD、PRFAQ、UX 规格、市场研究），再把打磨好的工件带进 IDE 实现。规划跑在**统一订阅费**上而非 metered IDE token，长期项目省钱。见 [bmadcode.com/web-bundles](https://bmadcode.com/web-bundles/)。

## 下一步

- [指南](./guide-line) —— 专家协作哲学、规模自适应、四阶段深入、模块生态、对抗审查技能
- [参考](./reference) —— 模块表、域专家、core-skills、安装、V6 变化
