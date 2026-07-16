---
layout: doc
---

# BMAD Method

BMAD Method（**Breakthrough Method for Agile AI Driven Development**）是一套**敏捷 AI 驱动开发**框架——把 AI agent 当作**专家协作者**引导你走完从构思到部署的完整流程，而非替你思考出平庸结果。它有真正的**规模自适应智能**（scale-adaptive）：从 bug 修复到企业级系统，自动调整规划深度。核心 BMM 模块用 12+ 个域专家 agent（分析师、PM、架构师、开发、UX…）沿分析 → 规划 → 方案 → 实现四阶段推进，还有 `bmad-help` 随时问下一步、**Party Mode** 把多个角色拉进一个会话讨论。V6 引入了 Skills Architecture，把这些能力打包成 SKILL.md。100% 免费 MIT。

## 评价

**优点**

- **专家协作而非代劳**：agent 作专家引导你，把**你**的最佳思考逼出来，而非直接给平庸答案
- **规模自适应**：自动按项目复杂度调整规划深度——bug 修复轻、企业系统重，不一刀切
- **完整生命周期**：从头脑风暴、产品简报、PRD、UX 规格到架构、实现、QA，覆盖全流程
- **12+ 域专家 agent**：analyst / pm / ux-designer / architect / dev 各司其职，对应四阶段
- **Party Mode**：把多个 agent persona 拉进一个会话协作讨论——多视角同场
- **模块生态**：BMM（核心）/ BMB（Builder 建自定义 agent）/ TEA（测试架构）/ BMGD（游戏开发）/ CIS（创意智能）
- **Web Bundles**：把规划技能打包成 Gemini Gems / ChatGPT GPTs，在 web 订阅里做规划再带进 IDE（省 metered token）
- **100% 免费**：无付费墙、无 gated 内容、无 gated Discord

**缺点**

- **重量级、学习曲线陡**：完整敏捷框架 + 多 agent + 多模块，上手需时间
- **依赖较多**：需 Node ≥20.12、Python ≥3.10、uv
- **偏「流程仪式」**：结构化工作流对追求极简的人显得繁琐
- **模块多需规划**：BMM/BMB/TEA/BMGD/CIS 要按需选，别全装
- **商标约束**：BMad / BMAD-METHOD 是 BMad Code, LLC 的商标（代码本身 MIT）

## 适用场景

- 想要一套完整的、敏捷最佳实践驱动的 AI 开发流程（分析→规划→方案→实现→QA）
- 项目规模跨度大，想要「规模自适应」——小改动轻流程、大系统重规划
- 想让 AI 作专家协作者逼出你的最佳思考，而非放飞 vibe coding
- 想在 web LLM 订阅里做规划（Web Bundles → Gemini Gems / ChatGPT GPTs）省 IDE token

## 边界

- **不是单个技能，是一整套框架 + 模块生态**：量级最大，靠 `bmad-help` 导航
- **agent 是协作者不是代劳**：它引导你思考、facilitated workflow，需要你参与
- **模块按需装**：BMM 是核心，其余（游戏/测试/创意）按领域选
- **与 gstack/GSD/Compound 同为流程系统**：BMAD 最偏「完整敏捷方法论 + 域专家角色」

## 官方文档

[docs.bmad-method.org](https://docs.bmad-method.org) ｜ [Getting Started 教程](https://docs.bmad-method.org/tutorials/getting-started/) ｜ [升级到 V6](https://docs.bmad-method.org/how-to/upgrade-to-v6/) ｜ [Web Bundles](https://bmadcode.com/web-bundles/)

## GitHub 地址

[bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)（V6，MIT；BMad/BMAD-METHOD 为 BMad Code, LLC 商标）

## 内容地图

- [入门](./getting-started) —— `npx bmad-method install`、四阶段 + 域专家、`bmad-help`、Party Mode
- [指南](./guide-line) —— 专家协作哲学、规模自适应、BMM 四阶段、模块生态、Web Bundles、对抗审查技能
- [参考](./reference) —— 模块表、域专家 agent、core-skills、安装（含非交互 CI/CD）、V6 变化

## 幻灯片地址

<a href="/SlideStack/bmad-method-slide/" target="_blank">BMAD Method</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=593" target="_blank" rel="noopener noreferrer">BMAD Method 测试题</a>
