---
layout: doc
outline: [2, 3]
---

# 参考

> 基于《Scrum Guide 2020》（scrumguides.org/scrum-guide.html）编写

## Scrum 骨架速查表

### 3 Accountability

| Accountability | 核心问责 | 一句话 |
|---|---|---|
| Product Owner | 最大化产品价值 | 决定「做什么、什么顺序」 |
| Scrum Master | 确立 Scrum + 提升效能 | 是真正的服务型领导（true leader who serves） |
| Developers | 每 Sprint 创造可用 Increment | self-managing 内部决定分工 |

### 5 Events

| 事件 | 时长上限（1 月 Sprint） | 参与者 | 目的 |
|---|---|---|---|
| Sprint | ≤1 个月（容器） | 全团队 | 所有事件容器 |
| Sprint Planning | ≤8 小时 | 全团队 | Why/What/How |
| Daily Scrum | 15 分钟 | Developers | 检视 Sprint Goal 进展、调整当日计划 |
| Sprint Review | ≤4 小时 | 全团队 + 利益相关者 | 检视 Increment、协作下一步 |
| Sprint Retrospective | ≤3 小时 | 全团队 | 改进流程 |

时长按比例缩放：2 周 Sprint 的 Planning ≤4 小时，Review ≤2 小时，Retro ≤1.5 小时。

### 3 Artifacts + 3 Commitments

| Artifact | Commitment | 含义 |
|---|---|---|
| Product Backlog | Product Goal | 团队长期目标，一次只一个 |
| Sprint Backlog | Sprint Goal | 单个 Sprint 的唯一目标 |
| Increment | Definition of Done | Increment 满足质量要求的正式描述 |

### 5 Values

| 价值观 | 含义 |
|---|---|
| 承诺 Commitment | 致力于达成目标、互相支持 |
| 专注 Focus | 聚焦当前 Sprint 的工作与目标 |
| 开放 Openness | 对工作与挑战透明 |
| 尊重 Respect | 把彼此当有能力、独立的人 |
| 勇气 Courage | 做正确的事、处理棘手问题 |

## 2020 vs 2017 完整对照

| 维度 | Scrum Guide 2017 | Scrum Guide 2020 |
|---|---|---|
| 人员称谓 | roles（角色） | accountabilities（问责） |
| 开发者称谓 | Development Team | Developers |
| 团队自管理 | self-organizing（自组织） | self-managing（自管理：内部决定谁做/何时/如何） |
| SM 定位 | servant leader（仆人式领导） | true leader who serves（真正的服务型领导） |
| 工件承诺 | 无统一概念 | 引入 commitment（Product Goal/Sprint Goal/DoD） |
| 团队规模 | Development Team 3-9 人 | 整个 Scrum Team「10 人或更少」 |
| Product Goal | 提及但未作为 commitment | 明确为 Product Backlog 的 commitment |
| Sprint Goal | 提及 | 明确为 Sprint Backlog 的 commitment |
| DoD | 流程描述 | 明确为 Increment 的 commitment |
| 预估 | 单独章节（如估算技术） | 删减，由团队自决 |
| 增量定义 | 强调「可用」+「潜在可发布」 | 强调「可用」+ 满足 DoD + 累加到既有 Increment |
| 三支柱 | 经验主义 | 经验主义 + 明确精益思维 |
| 预设主题 | 无 | Sprint Planning 三个主题 Why/What/How |

## accountability 职责详表

### Product Owner

| 职责 | 说明 |
|---|---|
| 制定并沟通 Product Goal | 长期方向 |
| 创建并清晰表达 Backlog 项 | 让 Developers 理解 |
| 排序 Backlog | 按价值与依赖 |
| 确保透明 | Backlog 对所有人可见 |
| 确保 Developers 理解到所需程度 | 达 Planning 所需 |

### Scrum Master（三向服务）

| 服务对象 | 关键动作 |
|---|---|
| Scrum Team | 辅导、清除障碍、确保事件、提升效能 |
| Product Owner | 辅导 Backlog 管理、产品价值、跨团队协作 |
| 组织 | 领导 Scrum 采纳、规划实施、辅导员工与利益相关者 |

### Developers

| 职责 | 说明 |
|---|---|
| 为 Sprint Planning 创建计划 | Sprint Backlog |
| 内建质量与 DoD | 到 Increment |
| 每期至少把一部分 Increment 调整为可用 | 朝 Product Goal |
| 与 PO/利益相关者对齐进展 | 透明 |

## 事件流程与产物

```text
Product Backlog（PO 管理）
        │ Sprint Planning（Why/What/How）
        ▼
Sprint Backlog = Sprint Goal + 选中项 + 计划
        │ Daily Scrum（每天 15 分钟，检视 Sprint Goal 进展）
        ▼
Increment（满足 DoD，累加到既有 Increment）
        │ Sprint Review（协作检视 + 调整 Product Backlog）
        ▼
        │ Sprint Retrospective（改进流程，改进项进下个 Sprint Backlog）
        ▼
   下一个 Sprint
```

## 反模式速查

| 反模式 | 表现 | 纠正 |
|---|---|---|
| PO 委员会 | 多人共担 PO，决策瘫痪 | 明确一人为 PO |
| SM 当项目经理 | SM 分配任务、追进度 | SM 不分配任务，团队 self-managing |
| Daily 变汇报 | 给经理讲昨天干了什么 | 聚焦 Sprint Goal 进展与当日计划 |
| Velocity 当 KPI | 用故事点考核团队 | Velocity 仅用于容量规划 |
| 无 DoD | 「完成」无标准 | 团队制定 DoD 并执行 |
| Sprint 频繁取消 | 一遇变化就取消 Sprint | Sprint Goal 内的变化在期内吸收 |
| Review 变演示 | 单向给客户看 | 改为协作式工作会 |
| Retro 无改进项 | 反思了但不落实 | 改进项进下个 Sprint Backlog |

## 与敏捷伞下其他框架的关系

| 框架 | 与 Scrum 关系 |
|---|---|
| 敏捷（伞） | Scrum 是伞下的时间盒式实现 |
| Kanban | 可与 Scrum 融合（Scrumban），或替代用于流式场景 |
| XP | Scrum 不含工程实践，常与 XP 的 TDD/CI/结对 配合 |
| Lean | Scrum 的「减少浪费、尽快交付」与精益相通 |
| DevOps | Scrum 的「每 Sprint 可用 Increment」需 DevOps 的 CI/CD 真正发布 |

## 规模扩展框架

| 框架 | 思路 | 适合 |
|---|---|---|
| Nexus | 多团队共用 Product Backlog + 集成 Sprint | 数十人多团队 |
| LeSS | 保持 Scrum 简洁，多团队一 PO | 中等规模，要求高 |
| SAFe | 层级化（团队/项目群/组合） | 超大型强合规组织 |

## 信源

- [Scrum Guide 2020（官方权威版）](https://scrumguides.org/scrum-guide.html)
- [Scrum Guides 历史版本与下载](https://scrumguides.org/)
