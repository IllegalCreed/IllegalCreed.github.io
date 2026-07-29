---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Atlassian 与 Linear 官方文档 —— 三工具概念对照 / Jira 全表 / Trello / Linear / 定价 / 集成 / 选型

## 三工具概念对照

| 概念 | Jira | Trello | Linear |
|---|---|---|---|
| 工作项 | Issue（Story/Bug/Task/Epic/Subtask）| Card | Issue（含 Sub-issue）|
| 看板 | Scrum/Kanban Board | Board（List+Card）| Cycle/Project 视图 |
| 迭代 | Sprint | 无（连续流）| Cycle |
| 大粒度 | Epic / Initiative | 无原生 | Project / Milestone |
| 查询 | **JQL** | 简单过滤 | 过滤 + 视图 |
| 工作流 | **高度可定制** | 简单列表 | 相对固定 |
| 估算 | Story Points | 无原生 | Estimate |
| 自动化 | Automation（内置）| **Butler** | Triage Intelligence |
| 速度 | 慢 | 中 | **极快** |
| 键盘 | 鼠标为主 | 鼠标为主 | **键盘优先** |

## Jira 全表

### Issue 类型与层级

| 层级 | 类型 | 说明 |
|---|---|---|
| L4 | Initiative | 战略级（跨 Epic）|
| L3 | Epic | 大需求（含多 Story）|
| L2 | Story / Task / Bug | 可执行工作项 |
| L1 | Subtask | 细分 |

### Scrum vs Kanban

| 维度 | Scrum Board | Kanban Board |
|---|---|---|
| 节奏 | Sprint（固定时长）| 连续流 |
| WIP 限制 | 无 | **有**（每列上限）|
| 估算 | Story Points | 可选 |
| 报告 | 燃尽图、速度图 | 累积流图、控制图 |
| 归档 | Sprint 结束归档 | 持续流转 |

### JQL 运算符与函数

| 类别 | 内容 |
|---|---|
| 比较 | `= != > < >= <=` |
| 集合 | `IN NOT IN` |
| 模糊 | `~ !~`（文本包含）|
| 逻辑 | `AND OR NOT` |
| 排序 | `ORDER BY field ASC/DESC` |
| 函数 | `currentUser() openSprints() closedSprints() startOfWeek() now() endOfWeek() membersOf()` |

### 工作流元素

| 元素 | 作用 |
|---|---|
| Status | 状态（To Do/In Progress/Done）|
| Transition | 状态迁移路径 |
| Condition | 迁移前提（权限校验）|
| Validator | 迁移前数据校验 |
| Post function | 迁移后动作（设字段/通知）|

### 部署形态

| 形态 | 说明 |
|---|---|
| **Jira Cloud** | SaaS（最主流）|
| **Jira Data Center** | 自托管（含合规/审计）|
| Jira Service Management | IT 服务管理 |

## Trello 全表

### 模型层级

```
Board（看板）
├── List（列表，如 To Do/Doing/Done）
│   └── Card（卡片，含 due/checklist/label/member/comment）
└── Power-Up（扩展）
```

### Butler 自动化

| 元素 | 说明 |
|---|---|
| Trigger | 触发器（卡片移动/新建/定时）|
| Condition | 条件 |
| Action | 动作（改字段/通知/归档）|

### Power-Ups 常用

| Power-Up | 作用 |
|---|---|
| Calendar | due 日历视图 |
| Custom Fields | 自定义字段 |
| GitHub/GitLab | 代码集成 |
| Slack | 通知 |
| Voting | 投票排序 |

## Linear 全表

### 工作项模型

| 实体 | 说明 |
|---|---|
| Issue | 最小工作单元 |
| Sub-issue | Issue 细分 |
| Project | 跨 Cycle 中长期目标 |
| Cycle | 时间盒周期（1-4 周）|
| Milestone | Project 检查点 |
| Roadmap | 路线图视图 |
| Initiative | 高层战略（Business+）|

### Cycle 要点

| 项 | 说明 |
|---|---|
| 长度 | 1-4 周（常见 2 周）|
| 聚焦 | 只拉本期要做的 Issue |
| 自动归档 | 周期结束未完成移出（可顺延）|
| 容量 | 团队/个人本期可承接估算 |

### 键盘快捷键

| 键 | 动作 |
|---|---|
| `Cmd+K` | 命令面板 |
| `C` | 创建 Issue |
| `A` | 指派 |
| `S` | 改状态 |
| `#` | 加 Label |
| `P` | 设 Priority |
| `E` | 编辑 |
| `Cmd+Enter` | 保存 |
| `Cmd+/` | 快捷键速查 |

### 定价（2026 参考）

| 计划 | 价格 | 关键限制 |
|---|---|---|
| **Free** | $0 | 250 issues、10MB 上传、2 teams |
| **Basic** | $10/user/月 | 无限 issue、5 teams |
| **Business** | $16/user/月 | 无限 team、Insights、Asks、Triage Intelligence |
| **Enterprise** | 定制（年付）| SAML/SCIM、HIPAA、专属支持 |

## 定价对照（2026 参考）

| 工具 | Free | 付费起步 |
|---|---|---|
| **Jira** | 10 用户 | Standard ~$8/user/月 |
| **Trello** | 无限看板（有 Power-Up 限制）| Standard ~$5/user/月 |
| **Linear** | 250 issues | Basic $10/user/月 |

## 集成能力对照

| 集成 | Jira | Trello | Linear |
|---|---|---|---|
| GitHub/GitLab | 原生 | Power-Up | **原生深度** |
| Slack | 原生 | Power-Up | 原生 |
| Figma | 原生 | Power-Up | 原生 |
| Confluence | **深度**（同生态）| 同生态 | 一般 |
| API | 完善 | 完善 | 完善 + Webhook |

## AI 能力对照

| 工具 | AI 能力 |
|---|---|
| **Jira** | Atlassian Intelligence：总结/生成描述/智能 JQL/风险预测 |
| **Trello** | Atlassian Intelligence（部分）|
| **Linear** | Agents：Triage Intelligence 路由 / Code Intelligence / 自动化工作流 |

## 治理与合规对照

| 维度 | Jira | Trello | Linear |
|---|---|---|---|
| 权限粒度 | **极细** | 看板级 | 团队/项目级 |
| 审计 | **强**（Data Center）| 中 | Enterprise |
| 合规 | SOC2/ISO/GDPR/HIPAA | Atlassian 同 | Enterprise HIPAA |
| SSO/SAML | Premium+ | Enterprise | Enterprise |
| 自托管 | **Data Center** | 无 | 无 |

## 选型速查

| 场景 | 推荐 |
|---|---|
| 500+ 人企业、复杂流程、强治理 | **Jira Data Center** |
| Atlassian 生态、研发深度流程 | **Jira Cloud** |
| 轻量任务、跨职能、个人/小团队 | **Trello** |
| 软件产品团队、追求速度体验 | **Linear** |
| 从 Jira 迁移、提速 | **Linear**（导入工具）|
| 强合规、需自托管 | **Jira Data Center**（唯一选择）|

## 参考

- Jira 文档：<https://support.atlassian.com/jira-software-cloud/>
- Jira 定价：<https://www.atlassian.com/software/jira/pricing>
- Trello 指南：<https://trello.com/guide>
- Trello 定价：<https://trello.com/pricing>
- Linear 文档：<https://linear.app/docs>
- Linear 定价：<https://linear.app/pricing>
- Linear Method：<https://linear.app/method>
- Atlassian Intelligence：<https://www.atlassian.com/software/atlassian-intelligence>
