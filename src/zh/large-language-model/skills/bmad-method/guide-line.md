---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 bmad-code-org/BMAD-METHOD V6 的 README、docs 与 `src/bmm-skills`、`src/core-skills` 编写。

## 速查

- **哲学**：agent 作**专家协作者**引导你，逼出你的最佳思考——非替你思考出平庸结果
- **规模自适应**：按项目复杂度自动调规划深度（bug 修复轻 / 企业系统重）
- **BMM 四阶段**：分析(analyst) → 规划(pm/ux) → 方案(architect) → 实现(dev)
- **core-skills**：bmad-help / party-mode / brainstorming / advanced-elicitation / forge-idea / spec / shard-doc / 三种对抗审查
- **模块**：BMM(核心) / BMB(Builder) / TEA(测试) / BMGD(游戏) / CIS(创意)
- **Web Bundles**：规划技能 → Gemini Gems / ChatGPT GPTs，省 metered token
- 装 `npx bmad-method install`（Node≥20.12/Python≥3.10/uv）；V6；MIT

## 核心哲学：专家协作，不代劳

> 传统 AI 工具**替你思考**，产出平庸结果。BMAD 的 agent 和 facilitated workflow 作为**专家协作者**，引导你走结构化流程，在与 AI 的协作中把**你的最佳思考**逼出来。

这是 BMAD 与「一句话让 AI 全自动生成」的根本区别：它不追求「你走开、AI 全干」，而追求「AI 作专家陪你把事想清楚、做扎实」。四个支柱：

1. **AI 智能帮助**——`bmad-help` 随时告诉你下一步、什么可选
2. **规模-领域自适应**——自动按复杂度调规划深度
3. **结构化工作流**——扎根敏捷最佳实践（分析/规划/架构/实现）
4. **专业 agent**——12+ 域专家（PM/架构/开发/UX…）

## 规模自适应：从 bug 修复到企业系统

BMAD 的一大卖点是 **scale-adaptive intelligence**：它自动按项目复杂度调整规划深度。一个 bug 修复不必走完整的 PRD + 架构 + 多阶段规划；一个企业级系统则值得深度分析、完整 PRD、正式架构。同一套框架从最轻到最重自适应，避免「小题大做」或「大题小做」。

## BMM 四阶段与域专家

核心 BMM 模块把敏捷开发拆成四阶段，每阶段一个域专家 agent 主导：

| 阶段 | 域专家 | 产出 |
| --- | --- | --- |
| **1 分析** | `bmad-agent-analyst` | 需求分析、研究、产品简报、PRFAQ |
| **2 规划** | `bmad-agent-pm` + `bmad-agent-ux-designer` | PRD、UX 规格、规划工作流 |
| **3 方案** | `bmad-agent-architect` | 架构、技术方案 |
| **4 实现** | `bmad-agent-dev` | 敏捷实现、Dev Loop |

> 这正是把敏捷 SDLC 的角色（分析师/PM/UX/架构师/开发）落成 agent，逐阶段推进、每阶段有专家。

## Party Mode：多专家圆桌

`bmad-party-mode` 把多个 agent persona 拉进**一个会话**协作讨论——PM、架构师、UX 在同场从各自视角碰撞。这解决「单角色单线程看不全」的问题：一个决策可以同时被产品、设计、工程三个视角审视。对比 gstack 的「逐个角色命令」，BMAD 的 party mode 是「多角色同场」。

## 对抗审查技能

BMAD 的 core-skills 里有一组专门的对抗性审查，用于压测想法/方案：

| 技能 | 作用 |
| --- | --- |
| `bmad-review-adversarial-general` | 通用对抗审查——主动找方案的漏洞 |
| `bmad-review-edge-case-hunter` | 边界情况猎手——挖被忽略的边界 |
| `bmad-review-verification-gap` | 验证缺口——找「声称做了但没验证」的地方 |
| `bmad-advanced-elicitation` | 高级需求挖掘——把模糊需求逼清晰 |

> 加上 `bmad-brainstorming`（头脑风暴）、`bmad-forge-idea`（锻造想法）、`bmad-spec`（写规格）、`bmad-shard-doc`（把大文档分片），构成从想法到规格的完整前期工具箱。

## 模块生态

BMAD 用官方模块扩展到专业领域，安装时或之后随时选：

| 模块 | 用途 |
| --- | --- |
| **BMM**（BMad Method） | 核心框架，34+ 工作流 |
| **BMB**（BMad Builder） | 建自定义 BMad agent 和工作流 |
| **TEA**（Test Architect） | 基于风险的测试策略与自动化 |
| **BMGD**（Game Dev Studio） | 游戏开发（Unity/Unreal/Godot） |
| **CIS**（Creative Intelligence Suite） | 创新、头脑风暴、设计思维 |

> BMM 是核心，其余按领域**按需装**——别一次全装。

## Web Bundles：规划省 token

Web Bundles 把规划技能打包为 **Gemini Gems / ChatGPT Custom GPTs**，让你在 web LLM **统一订阅费**里做前期规划（头脑风暴、产品简报、PRD、PRFAQ、UX、市场研究），再把打磨好的工件带进 IDE 实现。好处：规划不烧 metered IDE token，长期项目省钱；可选 Gemini/ChatGPT 里最强的模型。

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 期望 agent 替你全想（不参与） | BMAD 是协作者，需要你参与逼出最佳思考 |
| 小 bug 也拉满完整 PRD+架构流程 | 违背规模自适应，用轻流程即可 |
| 一次装全部模块 | BMM 是核心，其余按领域选 |
| 不用 bmad-help 瞎猜下一步 | bmad-help 就是来告诉你下一步的 |
| 把 IDE metered token 烧在规划上 | 前期规划搬到 Web Bundles 省钱 |

## 下一步

- [参考](./reference) —— 模块表、域专家、core-skills、安装（含 CI/CD）、V6 变化
- 上游：[docs.bmad-method.org](https://docs.bmad-method.org)
