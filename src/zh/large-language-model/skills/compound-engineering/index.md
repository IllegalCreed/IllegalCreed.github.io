---
layout: doc
---

# Compound Engineering

Compound Engineering 是 Every（Kieran Klaassen 等，Cora 团队）开源的一套 Claude Code 技能插件，核心理念一句话：**每一单元工程工作都应让下一单元更容易，而非更难**。它把开发倒过来配比——**80% 花在规划与审查、20% 花在执行**，并用 `/ce-compound` 把每次解决的问题沉淀成可复用的「learning」，让工具集**越用越聪明**。30 个 `/ce-*` 技能串成 brainstorm → plan → work → simplify → review → compound 的复利循环，`/lfg` 还能全自动跑完整条流水线。

## 评价

**优点**

- **对抗技术债累积**：传统开发每加一个功能都增加复杂度，Compound 反过来——每次工作让下次更易
- **系统带记忆**：每个 PR 教系统、每个 bug 变永久教训、每次审查更新默认值，知识复利
- **80/20 配比落地**：`/ce-brainstorm` + `/ce-plan` 把功夫下在动手前，执行反而变小
- **完整流水线**：从 `/ce-ideate`（还没想法时）到 `/ce-strategy`（战略锚）到核心循环再到 `/ce-product-pulse`（用户实际体验回流），每阶段产出耐用工件喂给下一阶段
- **`/lfg` 全自动**：一条命令 plan→work→simplify→审查+修复→浏览器测试→commit→push→开 PR→盯 CI 修到绿
- **给人也给库**：`/ce-explain` 产出「讲给你自己听」的 explainer + check-in（预测-揭示），agent 写代码时人也在学
- **跨平台**：Claude Code / Cursor / Codex / Kimi / Cline / Grok / Devin / Copilot / Factory / Qwen / OpenCode / Pi / Antigravity

**缺点**

- **强观点**：opinionated by design，方向反映特定的 AI 工程哲学，未必全契合你的习惯
- **前期投入重**：80% 在规划审查，对「就想快点写完」的小改动显得慢
- **概念多**：Learning / Pattern doc / Explainer / Check-in / Pipeline / 各种编排术语，学习曲线不低
- **复利需积累**：单次收益不如「循环复循环」明显，`docs/solutions/` 要养起来才见效
- **30 个技能记不全**：需要 `/ce-setup` 和文档目录帮忙导航

## 适用场景

- 长期维护的代码库，想让「知识不流失、下次更快」——每次 compound 沉淀 learning
- 团队想把「规划先行 + 审查把关 + 知识复利」固化成可执行流程
- 想要 `/lfg` 式「交出一个功能、回来看到开好的绿 PR」的自主体验
- 认同「80% 规划审查、20% 执行」的工程哲学，愿意为长期杠杆付前期功夫

## 边界

- **不是单个技能，是一整套流水线插件**：30 技能 + 编排，量级远超单技能
- **compound ≠ 只是写文档**：learning 带结构化元数据供检索，是「复利知识单元」，喂回下轮 brainstorm/plan
- **与轻量对齐工具不同层**：要轻量盘问用 [Grill Me](../grill-me/)；Compound 是全流程 + 记忆系统
- **执行仍需人在关键处把关**：`/lfg` 自主但会在真正模糊/风险处停下

## 官方文档

[Compound Engineering: how Every codes with agents](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents) ｜ [The story behind compounding engineering](https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it) ｜ [skills 目录](https://github.com/EveryInc/compound-engineering-plugin/tree/main/docs/skills)

## GitHub 地址

[EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin)（MIT）

## 内容地图

- [入门](./getting-started) —— 安装、跑通核心 6 步循环、理解「complound 复利」
- [指南](./guide-line) —— 复利哲学、6 步循环拆解、Learning/Pattern/Explainer、`/lfg` 自主流水线、编排术语
- [参考](./reference) —— 30 个 `/ce-*` 技能全表、安装矩阵、compound 记忆机制、跨平台

## 幻灯片地址

<a href="/SlideStack/compound-engineering-slide/" target="_blank">Compound Engineering</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Compound Engineering 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
