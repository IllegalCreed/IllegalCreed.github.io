---
layout: doc
---

# gstack

gstack 是 Garry Tan（Y Combinator 总裁兼 CEO）开源的一套 Claude Code 技能集，把单个 AI 助手变成一支**虚拟工程团队**：23 个专家角色 + 8 个 power tool，全部是 slash 命令、全部是 Markdown、MIT 许可。它的核心不是「让 AI 多写代码」，而是把一次软件冲刺的完整流程——**Think → Plan → Build → Review → Test → Ship → Reflect**——拆给各司其职的 AI 专家（CEO、工程经理、设计师、审查员、QA、安全官、发布工程师），每个专家一条命令，技能之间链式衔接。

## 评价

**优点**

- **角色化流程**：把 SDLC 拆成明确角色（`/office-hours` 产品追问、`/plan-ceo-review` 重构问题、`/review` 抓生产 bug、`/qa` 真浏览器测试、`/cso` 安全审计、`/ship` 发 PR），比空白 prompt 更有结构
- **技能链式衔接**：`/office-hours` 写的设计文档喂给 `/plan-ceo-review` 读，`/plan-eng-review` 写的测试计划被 `/qa` 接手——环环相扣不掉链
- **真浏览器 QA**：`/qa` 用真实 Chromium 点击、截图、发现并修 bug，还自动生成回归测试
- **多重审查**：Claude 的 `/review` + OpenAI Codex 的 `/codex` 跨模型交叉审查，同一 diff 两个不同模型看
- **安全护栏**：`/careful`（危险命令预警）`/freeze`（锁定编辑范围）`/guard`（两者合一），加提示注入防御
- **多 agent + 团队模式**：支持 10 家 agent，`--team` 模式让整仓库自动获得 gstack、限流静默自更新
- **可并行**：配合 Conductor 可同时跑 10-15 个隔离冲刺

**缺点**

- **重、学习曲线陡**：23 个命令 + 8 个工具，初上手要花时间理清何时用哪个
- **强观点**：一套「opinionated」流程，不完全契合你的工作习惯时要调整
- **依赖较多**：需要 Bun v1+、Git，浏览器功能要 Chromium，部分能力挂 GBrain/Supabase/Conductor
- **生产力宣传需理性看待**：作者宣称的高产出（如「逻辑行 810× 于 2013」）用「逻辑行」而非原始 LOC 度量、附方法论文档，但仍是个人化的极端案例，**工程价值在方法论本身，不在这些数字**
- **Claude Code 为主**：虽支持多 agent，最完整的体验在 Claude Code

## 适用场景

- **想给 Claude Code 一套结构化流程**而非每次从空白 prompt 开始，尤其 Claude Code 新手
- 独立开发者/小团队想要「一个人当一支团队」的角色化协作
- 想在每个 PR 上都跑严格的审查、QA、发布自动化
- 技术型创始人/CEO——仍想亲自 ship，但要杠杆放大

## 边界

- **不是 CI/CD 系统**：它是 agent 侧的工作流技能，不替代 GitHub Actions 等流水线（但可与之配合）
- **不是自动驾驶**：角色会追问、审查、报告，但关键决策仍需你拍板（如设计取舍、是否 ship）
- **不保证「AI 全自动写对代码」**：它靠流程（审查 + QA + 测试）提高正确率，不是魔法
- **与单一技能（如 Grill Me）不同层**：gstack 是一整套流程系统；要轻量单技能对齐用 [Grill Me](../grill-me/)

## 官方文档

[gstack · README](https://github.com/garrytan/gstack#readme) ｜ [技能深潜 docs/skills.md](https://github.com/garrytan/gstack/blob/main/docs/skills.md) ｜ [Builder Ethos](https://github.com/garrytan/gstack/blob/main/ETHOS.md) ｜ [gstacks.org](https://gstacks.org/)

## GitHub 地址

[garrytan/gstack](https://github.com/garrytan/gstack)（v1.60.1.0，MIT）

## 内容地图

- [入门](./getting-started) —— 30 秒安装、跑通 `/office-hours → /review → /qa → /ship`、理解冲刺流程
- [指南](./guide-line) —— 七阶段冲刺、23 角色按阶段拆解、安全护栏、多 agent、ETHOS 哲学、LOC 争议辨析
- [参考](./reference) —— 全命令表、power tools、新 binary、团队模式、GBrain、并行冲刺、卸载

## 幻灯片地址

<a href="/SlideStack/gstack-slide/" target="_blank">gstack</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">gstack 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
