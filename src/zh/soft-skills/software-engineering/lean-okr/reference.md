---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Lean Software Development（Poppendieck 7 原则，en.wikipedia.org/wiki/Lean_software_development）与 OKR 定义（whatmatters.com）编写

## Lean 7 原则速查表

| # | 原则 | 含义 |
|---|---|---|
| 1 | Eliminate Waste 消除浪费 | 一切不增客户价值的都是浪费 |
| 2 | Amplify Learning 放大学习 | 用短反馈环学习，替代详尽前期计划 |
| 3 | Decide as Late as Possible 尽晚决定 | 基于事实而非假设做关键决策 |
| 4 | Deliver as Fast as Possible 尽快交付 | JIT + 短迭代，反馈越快纠偏越省 |
| 5 | Empower the Team 团队授权 | 决策下放给离信息最近的人 |
| 6 | Build Integrity In 内建完整性 | 感知完整性 + 概念完整性 |
| 7 | See the Whole 全局优化 | 优化整体价值流，警惕局部最优 |

## 7 浪费（muda）制造 vs 软件对照

| 制造浪费 | 软件对应 | 典型表现 |
|---|---|---|
| 库存 Inventory | 部分完成的工作 | 未合并分支、未测试功能 |
| 额外加工 Extra Processing | 额外流程 | 冗余审批、无用文档 |
| 生产过剩 Overproduction | 额外功能 | 用户不用的功能（YAGNI） |
| 运输 Transportation | 任务切换 | 多项目并行 |
| 等待 Waiting | 等待 | 等审批、等依赖 |
| 动作 Motion | 交接 | hand-off 丢知识 |
| 缺陷 Defects | 缺陷 | bug、返工 |

## Lean 起源链

| 阶段 | 贡献者 | 内容 |
|---|---|---|
| 丰田生产方式 TPS | 大野耐一 | JIT、自働化、看板、消除 muda |
| 精益制造 | Womack & Jones | 《改变世界的机器》《Lean Thinking》 |
| 精益软件开发 | Mary & Tom Poppendieck | 2003《Lean Software Development》，7 原则 |

## OKR 速查表

| 要素 | 规范 |
|---|---|
| Objective | 定性、鼓舞、行动导向、简短 |
| Key Results | 每 O 配 3-5 条，可量化、可验证、有时限 |
| 数量 | 每季度 3-5 个 O |
| 评分 | 0.0-1.0，0.7 视为成功 |
| 周期 | 季度设定 + 周 Check-in + 季末复盘 |
| 与绩效 | 脱钩（divorced from compensation） |

## OKR 写法正反对照

| 维度 | 好的写法 | 差的写法 |
|---|---|---|
| Objective | 成为中小企业首选的项目管理工具 | 提升产品 |
| KR（outcome） | 季末新用户注册转化率 3%→6% | 优化登录页（任务） |
| KR（可量化） | NPS 从 30 提升到 45 | 提升用户满意度 |
| KR（结果） | 月活跃留存率提升 15% | 开发新模块（产出） |

## OKR vs KPI 完整对比

| 维度 | OKR | KPI |
|---|---|---|
| 性质 | 目标设定框架 | 健康度指标 |
| 目的 | 驱动改变 | 衡量现状 |
| 结构 | O + KR 组合 | 单一指标 |
| 周期 | 季度/年度 | 持续监控 |
| 雄心 | 拉伸（0.7 即成功） | 达标导向 |
| 关系 | KR 可包含 KPI 作度量 | KPI 可独立存在 |
| 挂钩绩效 | 不应挂钩 | 常作为考核依据 |

## OKR 不挂钩绩效的原因

| 挂钩后果 | 说明 |
|---|---|
| 保守设定 | 怕完不成影响收入，目标定低 |
| 隐藏困难 | 不愿暴露风险，透明丧失 |
| 博弈指标 | 为数字做短视行为 |
| 雄心丧失 | 拉伸目标机制被摧毁 |

## OKR 起源与传播

| 阶段 | 人物/组织 |
|---|---|
| 起源 | Andy Grove（Intel），原名 iMBO（Intel Management by Objectives） |
| 系统化 | John Doerr（《Measure What Matters》） |
| 推广 | 1999 年 John Doerr 带入 Google，随后全球流行 |

## Lean 与敏捷伞下方法的关系

| 方法 | 与 Lean 关系 |
|---|---|
| Kanban | 同源（丰田 TPS），Lean 拉动/JIT 的工作流管理具体化 |
| Scrum | Scrum 的「减少浪费、尽快交付、self-managing」与 Lean 相通 |
| XP | XP 的简洁设计、持续集成与 Lean 的消除浪费一致 |
| DevOps | DevOps 的 CI/CD 流水线支持 Lean 的尽快交付 |

## 反模式速查

| Lean 反模式 | OKR 反模式 |
|---|---|
| 原则当口号不落地 | KR 写成任务清单 |
| 局部优化忽视全局 | 季度末赶分平时不跟踪 |
| 尽晚决定变拖延 | 与绩效/奖金挂钩 |
| 无工程支撑的快交付 | 目标过多稀释聚焦 |
| 误判浪费 | KR 不可量化 |

## 选型/适用决策

| 场景 | 推荐 |
|---|---|
| 产品从 0 到 1 探索 | Lean Startup + 短迭代 |
| 价值流优化、消除瓶颈 | Lean + Kanban |
| 组织目标对齐与聚焦 | OKR |
| 例行运维工作（难设雄心 KR） | KPI 而非 OKR |
| 绩效驱动场景 | OKR 脱钩 + 独立绩效评估 |

## 信源

- [Lean Software Development（Wikipedia）](https://en.wikipedia.org/wiki/Lean_software_development)
- [OKR 定义（What Matters）](https://www.whatmatters.com/faqs/okr-meaning-definition-example)
- [OKRs Explained（What Matters）](https://www.whatmatters.com/okrs-explained)
