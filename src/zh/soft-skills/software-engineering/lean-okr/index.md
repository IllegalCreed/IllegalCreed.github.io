---
layout: doc
---

# 精益开发与目标管理

本叶涵盖两条同源主线：**精益软件开发（Lean Software Development）**与**目标管理（OKR）**。精益源自**丰田生产方式（TPS）**与精益制造，2003 年由 Mary & Tom Poppendieck 在《Lean Software Development》一书中移植到软件领域，核心是 **7 原则**——消除浪费（Eliminate Waste）、放大学习（Amplify Learning）、尽晚决定（Decide as Late as Possible）、尽快交付（Deliver as Fast as Possible）、团队授权（Empower the Team）、内建完整性（Build Integrity In）、全局优化（See the Whole / Optimize the Whole）。其底层是消除「muda（浪费）」：部分完成的工作、额外流程、额外功能、任务切换、等待、交接（hand-off）、缺陷。**OKR（Objectives and Key Results）**是协同式目标设定方法，由 Andy Grove 在 Intel 创立（原名 iMBO），经 John Doerr 于 1999 年带入 Google 后全球流行：**Objective** 是定性、鼓舞人心的目标，**Key Results** 是 3-5 条可量化、可验证、有时限的结果度量（强调结果 outcome 而非任务 output）。OKR 与 KPI 的关键区别：KPI 是衡量「健康度」的独立指标，OKR 是驱动「改变」的目标设定框架。**核心纪律：OKR 不应与绩效/薪酬挂钩**——whatmatters.com 明确「they are divorced from compensation」，挂钩会摧毁 OKR 的雄心与透明。OKR 评分用 0.0-1.0，0.7 视为成功。信源 wikipedia（Lean software development）+ whatmatters.com（OKR）。核心共识：**Lean 提供消除浪费、尽快交付的工程哲学，OKR 提供对齐与聚焦的目标机制——二者都强调「全局优化」与「以价值为导向」**。

> 注意：本叶 Lean 以 Poppendieck 7 原则（wikipedia: Lean software development）为准，OKR 以 whatmatters.com 定义为准。市面常把 OKR 与 KPI 混用、或把 OKR 当绩效考核工具——这与 OKR 原意相悖。

## 评价

**优点**

- **Lean：聚焦价值、消除浪费**：用价值流视角识别并移除不增客户价值的环节，显著提升交付效率
- **Lean：尽晚决定降低不确定性风险**：基于事实而非假设决策，适配软件的高不确定性
- **Lean：尽快交付加速反馈**：短迭代 + JIT 拉动，让反馈环变短，方向纠偏成本低
- **Lean：全局优化避免局部最优陷阱**：强调看整体价值流，避免某环节最优却拖累全局
- **OKR：聚焦与对齐**：3-5 个目标 + 每目标 3-5 个 KR，强制「少即是多」，组织上下对齐
- **OKR：透明可衡量**：目标与关键结果公开，进展可量化，减少方向歧义
- **OKR：鼓励雄心**：0.7 视为成功的设计鼓励设定有挑战的「拉伸目标」

**缺点**

- **Lean：原则抽象，落地难**：7 原则是哲学非流程，缺乏 Scrum 那样的具体骨架，团队不知从何起步
- **Lean：价值流识别需功底**：找准「浪费」需要对业务的深度理解，新手易误判
- **Lean：尽晚决定需工程支撑**：无延迟决策的技术能力（如可扩展架构、set-based 开发），晚决定会变成拖延
- **OKR：易沦为形式主义**：写一堆「任务型 KR」（output 而非 outcome）、季度末赶分，背离初衷
- **OKR：与绩效挂钩的诱惑难抵**：一旦挂钩奖金，团队会保守设定、隐藏困难，摧毁透明与雄心
- **OKR：不适合所有类型工作**：运维、例行支持类工作难以设定雄心 KR，强用会扭曲

## 文档地址

- [Lean Software Development（Wikipedia）](https://en.wikipedia.org/wiki/Lean_software_development)
- [OKR 定义（What Matters）](https://www.whatmatters.com/faqs/okr-meaning-definition-example)
- [OKRs Explained（What Matters）](https://www.whatmatters.com/okrs-explained)

## GitHub 地址

- Lean 与 OKR 无代码仓库。实践工具见各 OKR 软件（Workboard/Ally）与价值流分析工具。

## 幻灯片地址

<a href="/SlideStack/lean-okr-slide/" target="_blank">精益开发与目标管理</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E7%B2%BE%E7%9B%8A%E5%BC%80%E5%8F%91%E4%B8%8E%E7%9B%AE%E6%A0%87%E7%AE%A1%E7%90%86" target="_blank" rel="noopener noreferrer">精益开发与目标管理 测试题</a>
