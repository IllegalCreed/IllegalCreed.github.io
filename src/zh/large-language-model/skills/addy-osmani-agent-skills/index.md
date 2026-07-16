---
layout: doc
---

# Addy Osmani Agent Skills

Addy Osmani（Google Chrome 团队）开源的 **agent-skills** 是一套「生产级工程技能」集——把资深工程师在构建软件时用的工作流、质量门、最佳实践编码成 24 个结构化技能，让 AI agent 在开发每个阶段都一致地遵循。它沿 **DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP** 六阶段组织，8 个 slash 命令（`/spec` `/plan` `/build` `/test` `/review` `/webperf` `/code-simplify` `/ship`）作入口，内嵌大量 Google 工程文化（Hyrum's Law、Beyoncé Rule、测试金字塔、Chesterton's Fence…）。每个技能都带一张「反合理化」的借口-反驳表，且以证据要求收尾。

## 评价

**优点**

- **生产级、非玩具**：编码「何时写 spec、测什么、如何审、何时 ship」的资深工程判断，把原型质量拉到生产质量
- **反合理化**：每个技能列出 agent 常用来跳步的借口（如「测试以后再补」）+ 反驳，堵住偷懒路径
- **证据非可选**：每个技能以证据要求收尾——测试通过、构建输出、运行时数据，「看起来对」永远不够
- **process not prose**：技能是 agent 遵循的工作流（有步骤、检查点、退出判据），不是拿来读的参考文档
- **Google 工程文化内嵌**：Hyrum's Law、Beyoncé Rule、测试金字塔 80/15/5、Chesterton's Fence、trunk-based、Shift Left 直接嵌进步骤
- **完整生命周期**：24 技能 + 4 专家 persona + 7 参考清单，从定义到上线全覆盖
- **`/build auto` 自主**：批准计划一次，自主实现每个任务（仍逐个 test-driven + commit，失败/风险处暂停）
- **70+ agent**：`npx skills add addyosmani/agent-skills` 装进 Claude Code / Cursor / Codex / Copilot / Cline 等

**缺点**

- **强观点、流程重**：24 个 opinionated 工作流，简单任务显得繁琐
- **偏 Web/前端与 Google 实践**：部分技能（frontend-ui、webperf、Core Web Vitals）更契合 Web 栈
- **技能多需导航**：靠 `using-agent-skills` meta 技能 + 8 命令入口帮忙定位
- **证据要求增加往返**：坚持证据会让「快速试一下」变慢——但这是刻意的质量门

## 适用场景

- 想让 AI agent 带着「资深工程师的纪律」写生产代码，而非走最短路径跳过 spec/测试/审查
- 认同 Google 工程实践（测试金字塔、trunk-based、Shift Left、代码即负债）
- 需要覆盖完整生命周期（定义→规划→构建→验证→审查→上线）的一套技能
- 想要 `/build auto` 式「批准计划一次，自主逐任务实现」的体验

## 边界

- **不是单个技能，是 24 技能的一整套 pack**：量级大，靠命令入口 + meta 技能导航
- **技能是流程不是文档**：有步骤/检查点/退出判据，agent 跟着走而非读
- **与 Superpowers / Matt Pocock skills 定位不同**：仓库自带 `docs/comparison.md` 诚实对比三者形态与何时选谁
- **证据是硬要求**：不接受「seems right」，这是它区别于宽松 prompt 的核心

## 官方文档

[技能解剖 skill-anatomy](https://github.com/addyosmani/agent-skills/blob/main/docs/skill-anatomy.md) ｜ [采纳指南 adoption-guide](https://github.com/addyosmani/agent-skills/blob/main/docs/adoption-guide.md) ｜ [三者对比 comparison](https://github.com/addyosmani/agent-skills/blob/main/docs/comparison.md) ｜ [getting-started](https://github.com/addyosmani/agent-skills/blob/main/docs/getting-started.md)

## GitHub 地址

[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)（MIT）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、8 命令映射生命周期、跑第一个技能
- [指南](./guide-line) —— 技能解剖六段式、反合理化、证据要求、Google 工程实践、distinctive 技能
- [参考](./reference) —— 24 技能全表（按阶段）、8 命令、4 persona、7 参考清单、跨工具安装

## 幻灯片地址

<a href="/SlideStack/addy-osmani-agent-skills-slide/" target="_blank">Addy Osmani Agent Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=592" target="_blank" rel="noopener noreferrer">Addy Osmani Agent Skills 测试题</a>
