---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Kanban 方法（David Anderson 体系，kanbanize.com/kanban-resources）与丰田生产方式编写

## Kanban 6 一般原则

| 原则 | 含义 |
|---|---|
| Start with what you do now | 从你当前的工作方式起步，不重组团队 |
| Agree to pursue incremental, evolutionary change | 追求渐进式、演进式变革，而非大爆炸式重组 |
| Respect the current process, roles, responsibilities | 尊重现有流程、角色与职责，阻力小 |
| Encourage acts of leadership at all levels | 鼓励各级别展现领导力（改进人人有责） |
| Focus on customer needs and expectations | 聚焦客户需求与期望 |
| Manage the work, not the people | 管理工作流动，而非微观管理人 |

## 4 核心实践（+2 辅助）

| 实践 | 说明 |
|---|---|
| Visualize the workflow | 可视化工作流（列/卡/泳道/阻塞标记） |
| Limit WIP | 限制在制品，每阶段设上限 |
| Manage flow | 管理流动，识别瓶颈、优化流速 |
| Make process policies explicit | 显式化流程规则（入口/出口标准） |
| Implement feedback loops（辅助） | 实现反馈环（每日站会/评审/运营评审） |
| Improve collaboratively（辅助） | 协作式改进（用科学方法/模型驱动） |

## Kanban vs Scrum 完整对照

| 维度 | Kanban | Scrum |
|---|---|---|
| 起源 | 丰田 TPS → David Anderson 2010 | Schwaber & Sutherland → Scrum Guide 2020 |
| 工作模型 | 连续流 | 时间盒 Sprint |
| 迭代 | 无固定迭代 | ≤1 个月固定 Sprint |
| 角色 | 无强制角色 | PO / SM / Developers |
| 变更窗口 | 容量允许随时拉入 | Sprint 内尽量稳定 |
| 承诺 | 流动指标（前置时间） | Sprint Goal |
| 度量 | 前置时间、吞吐率、CFD | Velocity |
| 起步 | 从现状开始 | 先定义框架 |
| 改进触发 | WIP 限制暴露瓶颈 | Retro 改进流程 |
| 板的列 | 按真实流程阶段 | To Do / Doing / Done 简化 |
| 团队规模 | 灵活 | ≤10 人 |
| 适用 | 运维/支持/持续发布 | 复杂产品开发 |
| 信源 | kanbanize.com/kanban-resources | scrumguides.org |

## 流动指标速查

| 指标 | 定义 | 计算方式 |
|---|---|---|
| 前置时间 Lead Time | 需求提出 → 交付 | 完成日 - 提出日 |
| 周期时间 Cycle Time | 开始处理 → 完成 | 完成日 - 开始日 |
| 吞吐率 Throughput | 单位时间完成数 | 完成项数 / 时长 |
| 在制品 WIP | 某时刻系统中项数 | 各列卡片数之和 |
| 效率比 Efficiency | 处理时间 / 前置时间 | 越高越少等待浪费 |

## 累积流图（CFD）读图

| 信号 | 含义 | 行动 |
|---|---|---|
| 带宽变厚 | 总在制品增加，流动变慢 | 找瓶颈、降 WIP |
| 带宽变薄 | 在制品减少，流动改善 | 维持 |
| 斜率变平 | 吞吐下降 | 排查阻塞 |
| 某阶段面积突起 | 该阶段是瓶颈 | 扩容/改进该阶段 |
| 上下边界平行 | 稳定流动 | 健康 |

## 服务类别（Class of Service）

| 类别 | 特征 | WIP/优先级 |
|---|---|---|
| Standard 标准 | 普通需求 | 正常排队，FIFO |
| Expedite 加速 | 紧急、阻塞性 | 可超 WIP、最高优先级，同时仅 1 个 |
| Fixed Date 固定日期 | 有硬截止日 | 按日期倒排，预留容量 |
| Intangible 无形 | 长期改进、风险缓解 | 填充剩余容量 |

## Scrumban 要素

| 元素 | 来源 |
|---|---|
| PO / SM 角色 | Scrum |
| Review / Retrospective | Scrum（按需频率） |
| Definition of Done | Scrum |
| 固定 Sprint | 放弃 |
| WIP 限制 | Kanban |
| 连续流 | Kanban |
| 吞吐率 / 前置时间度量 | Kanban |

## 反模式速查

| 反模式 | 危害 |
|---|---|
| 无 WIP 限制的白板 | 丢失 Kanban 核心，沦为任务清单 |
| 偷偷突破 WIP | 摧毁拉系统，回到推系统的过载 |
| 只可视化不改进 | 板漂亮但流动停滞 |
| 加速类滥用 | 一切都紧急，WIP 形同虚设 |
| 无显式规则 | 流转靠默契，问题难追溯 |
| 板当存储库 | 卡片长期不动，污染流动指标 |

## 选型决策表

| 场景 | 推荐 |
|---|---|
| 运维/支持，需求随机到达 | Kanban |
| 持续发布的产品团队 | Kanban 或 Scrumban |
| 复杂新产品开发，需节奏与检查点 | Scrum |
| 想要 Scrum 结构但不便固定迭代 | Scrumban |
| 团队刚起步，想低门槛引入敏捷 | Kanban（渐进式、低侵入） |
| 强里程碑、多团队协调的大型项目 | Scrum + 扩展框架 |

## 信源

- [Kanbanize / Business Map - What is Kanban](https://kanbanize.com/kanban-resources/getting-started/what-is-kanban/)
- [David Anderson《Kanban》](https://www.djaa.com/)
