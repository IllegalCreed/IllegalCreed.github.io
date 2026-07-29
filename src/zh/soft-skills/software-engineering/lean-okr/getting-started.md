---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Lean Software Development（Poppendieck 7 原则，en.wikipedia.org/wiki/Lean_software_development）与 OKR 定义（whatmatters.com）编写

## 速查

- **Lean 起源**：丰田生产方式（TPS）/ 精益制造 → 2003 年 Poppendieck 移植到软件
- **Lean 7 原则**：消除浪费 / 放大学习 / 尽晚决定 / 尽快交付 / 团队授权 / 内建完整性 / 全局优化
- **7 浪费（muda）**：部分完成的工作、额外流程、额外功能、任务切换、等待、交接、缺陷
- **尽晚决定**：基于事实而非假设做关键决策，用 set-based 开发保留多种方案
- **尽快交付**：JIT + 短迭代 + 自拉动，让反馈环最短
- **OKR 定义**：Objectives & Key Results，协同式目标设定方法
- **Objective**：定性、鼓舞人心、行动导向的目标
- **Key Results**：3-5 条/目标，可量化、可验证、有时限，衡量结果（outcome）
- **OKR vs KPI**：KPI 衡量「健康度」，OKR 驱动「改变」
- **OKR 不挂钩绩效**：whatmatters 明确「divorced from compensation」，挂钩摧毁雄心
- **OKR 评分**：0.0-1.0，0.7 视为成功（鼓励拉伸目标）
- **OKR 起源**：Andy Grove（Intel，iMBO）→ John Doerr → 1999 年带入 Google

## Lean 是什么

### 一句话定义

```text
Lean = 以「消除浪费、尽快交付价值」为核心的工程哲学，
       源自丰田 TPS，用 7 原则指导软件开发的全局优化。
```

Lean 不规定具体流程（不像 Scrum 给角色与事件），它提供**思考方式**：用价值流视角看工作，识别并移除不增客户价值的环节，全局优化而非局部最优。

### 起源：从丰田到软件

```text
丰田生产方式（TPS）
  │ 大野耐一：JIT、自働化、看板拉动、消除 muda（浪费）
  ▼
精益制造（Lean Manufacturing，Womack & Jones）
  ▼
精益软件开发（Lean Software Development）
   Mary & Tom Poppendieck，2003 年
   将 TPS 的 7 制造浪费映射为软件浪费，提炼 7 原则
```

### 7 浪费（muda）的软件映射

| 制造浪费 | 软件中的对应 |
|---|---|
| 库存 Inventory | 部分完成的工作（未合并的代码、未测试的功能） |
| 额外加工 Extra Processing | 额外流程（冗余审批、无用文档） |
| 生产过剩 Overproduction | 额外功能（YAGNI 之外的功能） |
| 运输 Transportation | 任务切换（多项目并行） |
| 等待 Waiting | 等待（等审批、等依赖、等测试） |
| 动作 Motion | 交接（hand-off，知识在环节间丢失） |
| 缺陷 Defects | 缺陷（bug、返工） |

### 7 原则速览

| # | 原则 | 一句话 |
|---|---|---|
| 1 | 消除浪费 Eliminate Waste | 一切不增客户价值的都是浪费，识别并移除 |
| 2 | 放大学习 Amplify Learning | 软件开发是持续学习，用短反馈环替代详尽前期计划 |
| 3 | 尽晚决定 Decide as Late as Possible | 基于事实而非假设决策，保留可选性 |
| 4 | 尽快交付 Deliver as Fast as Possible | 短迭代 + JIT，反馈越快纠偏成本越低 |
| 5 | 团队授权 Empower the Team | 把决策下放给离信息最近的人 |
| 6 | 内建完整性 Build Integrity In | 感知完整性 + 概念完整性，质量内建非后测 |
| 7 | 全局优化 See the Whole | 优化整体价值流，警惕局部最优 |

## OKR 是什么

### 一句话定义

```text
OKR = Objectives and Key Results，
      协同式目标设定框架：定性目标 + 可量化关键结果，驱动聚焦与对齐。
```

- **Objective（O）**：定性、鼓舞人心、行动导向的目标，描述「要达成什么」，简短易记
- **Key Results（KR）**：3-5 条/目标，**可量化、可验证、有时限**，衡量「如何知道达成了」，必须是**结果（outcome）**而非任务（output）

### 写法对照

```text
差的 Objective：提升产品
好的 Objective：成为中小企业首选的项目管理工具（定性、鼓舞）

差的 KR：     优化登录页（这是任务 output）
好的 KR：     季度末新用户注册转化率从 3% 提升到 6%（可量化 outcome）
```

### OKR vs KPI

| 维度 | OKR | KPI |
|---|---|---|
| 性质 | 目标设定框架 | 健康度指标 |
| 目的 | 驱动「改变」 | 衡量「现状」 |
| 结构 | O + KR 组合 | 单一指标 |
| 周期 | 季度/年度 | 持续监控 |
| 关系 | KR 可以包含 KPI 作为度量 | KPI 可独立存在 |

### OKR 不挂钩绩效

whatmatters.com 明确：OKR「divorced from compensation（与薪酬脱钩）」。原因：挂钩奖金会让团队保守设定（怕完不成影响收入）、隐藏困难（不愿暴露风险），摧毁 OKR 鼓励的雄心与透明。OKR 的目的是对齐与聚焦，绩效评估应走另一套机制。

### OKR 评分

用 0.0-1.0 评分，**0.7 视为成功**——这个设计鼓励设定「拉伸目标（stretch goals）」：如果总是 1.0，说明目标不够有挑战。Google 沿用此法。

## 下一步

- Lean 7 原则深度 / 浪费识别 / 尽晚决定工程支撑 / OKR 写作规范 / 评分与复盘见 [指南](./guide-line.md)
- 7 浪费对照表 / OKR vs KPI 完整对比 / 反模式清单 / 与敏捷关系见 [参考](./reference.md)
