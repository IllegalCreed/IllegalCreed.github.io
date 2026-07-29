---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Atlassian 与 Linear 官方文档编写（atlassian.com / linear.app，2026.07）—— Jira 工作流/JQL / Trello Butler/Power-Ups / Linear Cycles/键盘 / 迁移共存 / 报表 / AI / 治理

## Jira 工作流定制

### 工作流组成

一个工作流由**状态（Status）+ 迁移（Transition）+ 规则**构成：

```
Open --start progress--> In Progress --resolve--> Resolved --close--> Closed
                                  \--reopen--> Open
```

- **Status**：Issue 所处阶段（如 To Do / In Progress / Done）
- **Transition**：状态间的迁移路径
- **Conditions**：迁移前提（如「只有 Assignee 才能点 resolve」）
- **Validators**：迁移前校验（如「必须填 Fix Version」）
- **Post functions**：迁移后动作（如「转 Done 时自动设 Resolution」）

### Company-managed vs Team-managed

| 类型 | 说明 |
|---|---|
| **Company-managed**（原 Next-gen）| 由管理员统一配置，全局一致，复杂项目首选 |
| **Team-managed**（原 Team-managed）| 团队自治配置，灵活轻量，小团队快速上手 |

公司级标准化用 Company-managed，小团队快速实验用 Team-managed。

### Issue Type Hierarchy

```
Initiative（高层战略）
  └── Epic（大需求）
       └── Story / Task / Bug（可执行工作项）
            └── Subtask（细分）
```

Epic 是承上启下的关键：把战略 Initiative 拆成可执行的 Story 集合。

## JQL 进阶

### 运算符与函数

| 类别 | 示例 |
|---|---|
| 比较 | `=`, `!=`, `>`, `<`, `>=`, `<=` |
| 集合 | `IN (...)`, `NOT IN (...)` |
| 模糊 | `~`（包含）, `!~`（不包含）|
| 函数 | `currentUser()`, `openSprints()`, `closedSprints()`, `startOfWeek()`, `now()` |
| 逻辑 | `AND`, `OR`, `NOT` |

### 实用 JQL

```
# 我在当前冲刺的所有未完成项
assignee = currentUser() AND sprint in openSprints() AND status != Done

# 本周更新的高优先级 Bug
type = Bug AND priority = Highest AND updated >= startOfWeek()

# 某 Epic 下所有未关闭 Story
"Epic Link" = "SHOP-100" AND status != Closed

# 阻塞中的 issue（有未完成依赖）
issueFunction in linkedIssuesOf("status != Done", "is blocked by")
```

JQL 可存为**过滤器**，再用于：看板筛选、仪表盘小组件、订阅邮件通知、Webhook 触发。

## Trello Butler 自动化

### 触发器 → 动作

| 触发 | 动作示例 |
|---|---|
| 卡片移到某列表 | 归档 / 改 due / 加成员 |
| 卡片新建 | 自动设 label / 通知 |
| 定时 | 每周一创建卡片 |
| 按钮点击 | 自定义按钮触发动作链 |

### Butler 规则示例

```
When a card is moved to list "Done",
remove all members from the card,
and set the card to archived.
```

复杂场景可用 Trellis 式的多步规则，把重复流程自动化。

## Trello Power-Ups

| 常用 Power-Up | 作用 |
|---|---|
| **Calendar** | 卡片 due 日历视图 |
| **Custom Fields** | 自定义字段 |
| **GitHub / GitLab** | PR/commit 关联卡片 |
| **Slack** | 卡片变更通知 |
| **Voting** | 卡片投票（需求排序）|
| **Butler**（内置）| 自动化 |

Power-Ups 免费版有数量上限，付费版不限。

## Linear Cycles 与键盘流

### Cycle 管理

- **周期长度**：1-4 周（常见 2 周）
- **聚焦**：只把本周期要做的 Issue 拉进 Cycle
- **自动归档**：周期结束未完成项自动移出（可手动顺延到下个 Cycle）
- **Cycle 视图**：看本期 Issue 进度、burndown、容量

### Project 与 Roadmap

- **Project**：跨 Cycle 的中长期目标（如「重构支付模块」），含起止、进度、关联 Issue
- **Milestone**：Project 内的检查点
- **Roadmap**：多 Project 的时间线视图，对外沟通进度

### 键盘流（提高效核心）

| 快捷键 | 动作 |
|---|---|
| `Cmd+K` | 全局命令面板 |
| `C` | 创建 Issue |
| `A` | 指派 Assignee |
| `S` | 改状态 |
| `#` | 加 Label |
| `P` | 设 Priority |
| `E` | 编辑 |
| `Cmd+Enter` | 保存 |
| `Cmd+/` | 快捷键速查 |

熟练键盘流后，Linear 操作速度远超 Jira/Trello 的鼠标点击。

### 分支命名约定

Linear 与 GitHub 集成支持分支命名约定：

```
shop-123-feat-login
└─ shop-123 是 issue ID，自动关联
```

开 PR 时自动把 issue 状态改成 In Progress，merge 时自动关闭 issue。

## 迁移与共存

### Jira → Linear

- Linear 提供 **Jira 导入工具**：映射 issue/project/user
- 注意：复杂工作流/自定义字段需在 Linear 重新建模（Linear 工作流较固定）
- 适合：被 Jira 的重与慢困扰、追求速度的软件团队

### Jira + Trello 共存（Atlassian 生态）

- Jira 管研发深度流程，Trello 管跨职能轻量任务
- 同属 Atlassian，账号与部分集成打通

### 三者混合

```
Linear（研发主战场）
   ↓ 同步
Jira（向上汇报/跨部门对齐）
Trello（市场/运营轻量任务）
```

## 报表与效能度量

| 工具 | 关键报表 |
|---|---|
| **Jira** | 燃尽图、速度图（Velocity）、累积流图（CFD）、控制图、Sprint 报告 |
| **Trello** | Buttle 报表、Power-Up 仪表盘（较弱）|
| **Linear** | Cycle burndown、Project 进度、Insights 效能分析 |

度量要点：**周期时间（cycle time）、吞吐量（throughput）、在制品（WIP）**——而非单纯代码行数。

## AI 能力

### Atlassian Intelligence（Jira/Trello）

- **Jira**：AI 总结 issue、生成描述、智能 JQL、风险预测
- **Confluence**：AI 总结页面、问答
- 基于 Atlassian 云的 AI（数据在 Atlassian 侧）

### Linear Agents（Linear）

- **Agent 平台**：AI 自动化工作流（分类、分配、补充信息）
- **Triage Intelligence**：新 issue 自动分类路由（Business+）
- **Code Intelligence**：与代码上下文联动（Business+）

::: warning AI 定位差异
Atlassian Intelligence 偏「辅助写与总结」；Linear Agents 偏「自动化工作流路由」。前者面向协作内容，后者面向流程自动化。
:::

## 企业治理与权限

| 维度 | Jira | Trello | Linear |
|---|---|---|---|
| 权限粒度 | **极细**（项目/角色/字段级）| 看板级 | 团队/项目级 |
| 审计 | **强**（Data Center 合规）| 中 | Enterprise 级 |
| 合规框架 | **全**（SOC2/ISO/GDPR/HIPAA）| Atlassian 同 Jira | Enterprise 含 HIPAA |
| SSO/SAML | Premium+ | Enterprise | Enterprise |
| 自托管 | **Data Center**（可内网）| 无 | 无 |

超大企业、强合规、需自托管 → Jira Data Center 几乎是唯一选择。

::: warning 边界提醒
本叶讲**工具用法**（Jira 工作流/JQL、Trello 看板、Linear Cycles）。敏捷方法论（Scrum 三角色/五事件、Kanban 的 WIP/看板原则）归「软件工程」章的 Scrum/Kanban 叶——工具是方法论的载体，不是方法论本身。
:::
