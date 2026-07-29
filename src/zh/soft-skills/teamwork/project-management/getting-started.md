---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Atlassian 官方文档与 Linear 官方文档编写（atlassian.com / linear.app，2026.07 版本）

## 速查

### Jira

- 厂商：**Atlassian**
- 定位：**企业级项目管理事实标准**
- 工作项类型：**Story / Bug / Task / Epic / Subtask**（可自定义）
- 看板模式：**Scrum Board**（Sprint 冲刺）/ **Kanban Board**（连续流）
- 查询语言：**JQL（Jira Query Language）**
- 工作流：**Custom Workflows**（状态 + 迁移规则可定制）
- 估算：**Story Points**（故事点）
- 层级：Subtask → Story/Task → Epic → Initiative
- 部署：**Cloud（SaaS）/ Data Center（自托管）**
- 定价：Free（10 人）/ Standard / Premium / Enterprise

### Trello

- 厂商：**Atlassian**
- 定位：**极简看板工具**
- 模型：**Board（看板）→ List（列表）→ Card（卡片）**
- 自动化：**Butler**（触发→条件→动作）
- 扩展：**Power-Ups**（第三方插件）
- 适用：轻量任务、跨职能、个人
- 定价：Free / Standard / Premium / Enterprise

### Linear

- 厂商：**Linear Inc.**
- 定位：**2026 新主流，软件团队专用、键盘优先**
- 工作项：**Issue**（含 Sub-issue）/ **Project** / **Cycle** / **Milestone** / **Roadmap**
- 周期：**Cycles**（时间盒迭代，常 2 周）
- 交互：**Cmd+K 命令面板 + 大量快捷键**（keyboard-first）
- 技术：**本地优先 + 同步引擎**（操作近瞬时）
- 集成：GitHub / GitLab / Figma / Slack 原生
- 定价：Free（250 issues）/ Basic $10 / Business $16 / Enterprise

## 三款工具是什么

它们都是**把工作拆成结构化工作项并跟踪流转**的工具，但定位差异显著：

| 维度 | Jira | Trello | Linear |
|---|---|---|---|
| 定位 | 企业级事实标准 | 极简看板 | 2026 新主流（软件团队）|
| 复杂度 | 高（强大但重）| 低（简单直观）| 中（现代精炼）|
| 工作项 | Issue（多种类型）| Card | Issue |
| 看板 | Scrum/Kanban 双模 | 单一看板 | Cycle/Project 视图 |
| 查询 | **JQL（强大）** | 简单过滤 | 过滤 + 视图 |
| 工作流 | **高度可定制** | 简单列表流转 | 相对固定 |
| 速度 | 慢（功能堆叠）| 中 | **极快（本地优先）**|
| 键盘 | 鼠标为主 | 鼠标为主 | **键盘优先（Cmd+K）**|
| 适用 | 大企业、复杂流程 | 轻量、跨职能 | 软件产品团队 |
| 生态 | Atlassian 全家桶 | Power-Ups | 现代 SaaS 集成 |

**核心结论**：要**企业级治理 + 复杂流程** 选 **Jira**；要**极简看板 + 跨职能** 选 **Trello**；要**速度 + 现代体验 + 软件团队** 选 **Linear**。

## Jira 核心概念

### Issue 类型

| 类型 | 用途 |
|---|---|
| **Story**（故事）| 用户视角的功能需求 |
| **Bug** | 缺陷 |
| **Task** | 通用任务 |
| **Epic** | 大粒度需求（包含多个 Story）|
| **Subtask** | Story/Task 的子任务 |
| **Initiative** | 更高层级（跨 Epic）|

### Scrum Board vs Kanban Board

| 维度 | Scrum Board | Kanban Board |
|---|---|---|
| 节奏 | **Sprint 冲刺**（固定时长，如 2 周）| 连续流（无固定迭代）|
| 列 | To Do / In Progress / Done | 自定义列 + **WIP 限制** |
| 估算 | Story Points | 可选 |
| 报告 | 燃尽图、速度图 | 累积流图 |
| 适用 | 可拆分的迭代式开发 | 持续支持/维护流 |

### JQL 示例

```
project = "SHOP" AND status = "In Progress" AND assignee = currentUser()
project = "SHOP" AND sprint in openSprints() AND type = Bug
project = "SHOP" AND updated >= -7d ORDER BY priority DESC
```

JQL 可保存为**过滤器（Filter）**，驱动看板、仪表盘、订阅通知。

### Custom Workflows

工作流定义 Issue 如何在状态间流转：

```
To Do --开始--> In Progress --完成--> In Review --通过--> Done
                                \--打回--> In Progress
```

管理员可创建多个工作流、加迁移规则（如「必须填某字段才能转到 Done」）、设条件/验证器/后处理函数。

## Trello 核心概念

### Board → List → Card

```
看板 Board（如「产品迭代」）
├── 列表 List「To Do」
│   ├── 卡片 Card「登录页改版」
│   └── 卡片 Card「支付 Bug」
├── 列表 List「Doing」
└── 列表 List「Done」
```

卡片可加：due date、checklist、label、附件、成员、评论。

### Butler 自动化

无代码规则：「当卡片移到 Done 列时，移除所有成员并归档」：

```
Trigger: 卡片移到列表「Done」
Action: 移除所有成员 + 归档卡片
```

### Power-Ups

第三方扩展：日历视图、GitHub 集成、Slack 通知、自定义字段等，按需启用。

## Linear 核心概念

### 工作项模型

| 实体 | 说明 |
|---|---|
| **Issue** | 最小工作单元（含 Sub-issue）|
| **Project** | 一组相关 Issue（有起止/进度）|
| **Cycle** | **时间盒周期**（常 1-4 周，类似 Sprint）|
| **Milestone** | 里程碑（Project 的检查点）|
| **Roadmap** | 路线图视图 |

### Cycles（周期）

Linear 的 Cycles 是**时间盒迭代**：把要做的 Issue 拉进当前 Cycle，周期结束自动归档未完成项（可顺延）。强调**聚焦与节奏**，比传统 Sprint 更轻量。

### 键盘优先（keyboard-first）

- **Cmd+K**：全局命令面板（创建/搜索/跳转/改状态）
- 大量单键快捷键：`C` 创建 issue、`A` 指派、`S` 改状态、`#` 加 label
- 几乎所有操作双手不离键盘

### 速度（同步引擎）

Linear 用**本地优先架构 + 同步引擎**：操作先在本地生效（近瞬时），后台同步到服务器，再推给其他客户端。这是它体验碾压 Jira 的技术根基。

## 与代码仓库集成

三款都能与 GitHub/GitLab 联动（PR 关联工作项）：

- **Jira**：commit/PR 提到 issue key（如 `SHOP-123`）自动关联
- **Trello**：Power-Up 把 PR 状态挂到卡片
- **Linear**：原生集成，分支命名约定（如 `shop-123-feat-login`）自动关联 issue

## 选型速查

| 你的场景 | 推荐 |
|---|---|
| 500 人以上大企业、复杂流程、强治理 | **Jira** |
| 轻量任务、跨职能、个人/小团队 | **Trello** |
| 软件产品团队、追求速度与现代体验 | **Linear** |
| 已用 Atlassian 全家桶 | **Jira + Trello** |
| 从 Jira 迁移、想提速 | **Linear** |

## 下一步

入门到此——你已了解三款工具的定位、核心概念、看板/周期、查询、集成与选型。下一章 `guide-line.md` 深入讲 **Jira 工作流定制与 JQL 进阶 / Trello Butler 与 Power-Ups / Linear Cycles 与键盘流 / 三者迁移与共存 / 报表与效能度量 / AI 能力（Atlassian Intelligence / Linear Agents）/ 企业治理与权限**。
