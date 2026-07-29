---
layout: doc
---

# 项目管理工具（Jira / Trello / Linear）

研发团队用来**跟踪需求、组织协作、可视化进度**的三类主流工具——把「谁在做什么、做到哪了、什么时候交付」从口头/邮件/表格，搬到结构化的工作项系统。本叶聚焦三款代表产品：**Jira**（Atlassian 旗下，企业级项目管理的事实标准，强大但重）、**Trello**（Atlassian 旗下，看板轻量化的代表，简单直观）、**Linear**（2026 年崛起的新主流，键盘优先、速度极快、专为现代软件团队设计，正从 Jira 手中抢走大量新客）。三者定位互补：Jira 适合复杂流程与大企业治理、Trello 适合轻量看板与跨职能、Linear 适合追求速度与体验的软件产品团队。核心概念包括：**工作项（Issue/Task/Card）**、**看板（Board）**、**冲刺/周期（Sprint/Cycle）**、**工作流（Workflow）**、**查询语言（JQL）**、**键盘优先（keyboard-first）**。注意边界：本叶讲**工具用法**；敏捷方法论（Scrum/Kanban 的理念与流程）归「软件工程」章的 Scrum/Kanban 叶。

## 评价

### Jira

**优点**

- **企业事实标准**：全球大型组织项目管理首选，生态与人才储备最厚
- **流程与工作流高度可定制**：Custom Workflows、Custom Fields、Issue Types 几乎能建模任意流程
- **JQL 强大**：Jira Query Language 可写复杂查询、保存为过滤器、驱动看板与报表
- **Scrum + Kanban 双模**：原生支持 Sprint 冲刺与看板连续流，报告齐全（燃尽图、累积流）
- **企业治理强**：权限矩阵、项目权限方案、审计、合规，满足大企业管控
- **Atlassian 生态**：与 Confluence、Bitbucket、Compass 深度集成

**缺点**

- **重而慢**：功能堆叠致界面复杂、加载慢，小团队上手成本高
- **配置门槛高**：工作流/字段/权限方案繁琐，需专职管理员
- **体验老旧**：UI/UX 被新一代工具（Linear）拉开差距
- **价格随人数上涨快**：大团队 Standard/Premium 成本不低
- **「Jira 痛苦」文化梗**：开会多、字段多、流程重，开发者吐槽集中

### Trello

**优点**

- **极简看板**：列表 + 卡片的看板模型，5 分钟上手，最直观的任务可视化
- **跨职能友好**：不只研发，市场/运营/个人都能用
- **Power-Ups 扩展**：第三方插件生态丰富，按需启用
- **Butler 自动化**：内置无代码自动化（触发→条件→动作）
- **免费够用**：个人/小团队免费版即可满足
- **移动端体验好**：随手拖拽卡片

**缺点**

- **不适合复杂研发流程**：无原生 Sprint、无 JQL、工作流简单，深度研发管理力不从心
- **数据规模一大就乱**：卡片多了难管理，缺层级（Epic/ Initiative）
- **报表弱**：燃尽图/累积流/效能度量不及 Jira/Linear
- **集成深度有限**：与代码仓库/GitHub PR 的联动不如 Jira/Linear

### Linear

**优点**

- **速度极快**：本地优先 + 同步引擎，操作近乎瞬时，体验远超 Jira
- **键盘优先（keyboard-first）**：Cmd+K 命令面板、大量快捷键，双手不离键盘
- **Cycles 周期**：时间盒迭代模型，强制聚焦、节奏清晰
- **现代设计**：UI/UX 业界顶级，开发者爱用
- **软件团队专用**：原生集成 GitHub/GitLab、PR 联动、分支命名约定
- **增长迅猛**：2026 已成新主流，从 Jira 抢走大量新客，估值与口碑双高

**缺点**

- **流程定制弱于 Jira**：工作流相对固定，极度复杂的自定义流程不如 Jira
- **跨职能能力弱**：专为软件团队设计，市场/运营场景不如 Trello 通用
- **企业治理尚浅**：权限/合规/审计能力不及 Jira 成熟，超大企业落地有挑战
- **生态较新**：集成与模板数量不及 Jira/Atlassian 生态
- **付费起步**：免费版有 issue 数量上限，团队稍大需付费

## 文档地址

- [Jira 官方文档](https://support.atlassian.com/jira-software-cloud/)
- [Trello 官方指南](https://trello.com/guide)
- [Linear 官方文档](https://linear.app/docs)

## GitHub 地址

- [Jira（Atlassian，闭源）](https://www.atlassian.com/software/jira)
- [Trello（Atlassian，闭源）](https://trello.com)
- [Linear（闭源）](https://linear.app)

## 幻灯片地址

<a href="/SlideStack/project-management-slide/" target="_blank">项目管理工具</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=项目管理工具" target="_blank" rel="noopener noreferrer">项目管理工具测试题</a>
