---
layout: doc
---

# Google Workspace CLI Skills

Google Workspace CLI Skills 是一类**方法论/社区生态叶**——用 AI agent（如 Claude Code、Cursor）通过命令行 / Skill 封装操作 Google Workspace 全家桶（Gmail、Calendar、Drive、Docs、Sheets、Slides、Chat、Tasks、Contacts/People、Classroom）。**目前没有 Google 官方 SKILL.md 仓库**，社区以多个第三方 CLI / Skill 项目为代表（如基于 `gogcli` 的 skill 封装、`google-workspace-cli-skill` 等小仓），共同特点是用 OAuth 2.0 / 服务账号打通 Workspace API，把邮件处理、日程管理、文档协作、Drive 整理、Chat 自动化等流程交给 agent 完成。

## 评价

**优点**

- **场景密集**：邮件、日历、文档、Drive 是日常高频场景，agent 化收益立竿见影
- **API 覆盖全**：Google Workspace 暴露 10+ 个 REST API（Gmail/Calendar/Drive/Docs/Sheets/Slides/Chat/Tasks/People/Classroom），可编程面极宽
- **OAuth 2.0 + 服务账号双模型**：既能做「代表用户授权」（邮件起草/发送），也能做「服务账号直连」（域级自动化）
- **社区先行**：在 Google 官方 Skill 出现前，社区已基于 gogcli 等 CLI 摸索出可用封装
- **五分类选型清晰**：surface（在哪用）/operation（读还是写）/actor（谁执行）/execution home（本地或云）/trigger（如何启动）→ auth 模型

**缺点 / 边界**

- **无 Google 官方仓**：`gh search` 未发现 google 官方 SKILL.md 仓，社区项目体量小、维护不稳定
- **认证门槛高**：OAuth 2.0 需配置 GCP 项目、scope、redirect，服务账号还要域内授权（Domain-wide Delegation）
- **权限风险大**：邮件发送、删文件、改日历是高危写操作，必须有发送确认 / dry-run / 最小 scope
- **速率与配额**：Workspace API 有 quota（Gmail 每日发信上限、Drive API QPS），批量操作易触发
- **数据隐私**：邮件/文档属敏感数据，agent 处理需考虑数据驻留与审计

## 适用场景

- 邮件处理（搜索/分类/起草回复/批量归档）
- 日程管理（查忙闲/约会议/改日程/提醒）
- 文档协作（Docs 写段、Sheets 读写行、Slides 生成）
- Drive 文件整理（搜索/移动/共享/批量改名）
- Chat / Tasks 自动化（发消息、建任务）

## 边界

- **不是 Google 官方技能集**：本叶描述的是方法论与社区生态，无 Google 官方 SKILL.md 仓
- **写操作必须确认**：邮件发送、文件删除、日历修改等不可逆操作要人确认
- **配额敏感**：批量操作前先估算 Gmail / Drive API 配额
- **服务账号 ≠ 万能**：服务账号需域管理员授权对应 scope，且部分 API（如 Gmail）对服务账号限制更严

## 官方文档

[Google Workspace APIs](https://developers.google.com/workspace/docs) ｜ [Gmail API](https://developers.google.com/gmail/api) ｜ [Calendar API](https://developers.google.com/calendar/api) ｜ [Drive API](https://developers.google.com/drive/api) ｜ [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## GitHub 地址

社区代表仓（非官方）：[tivojn/gogcli-skill](https://github.com/tivojn/gogcli-skill)（基于 gogcli）· [evgyur/google-workspace-cli-skill](https://github.com/evgyur/google-workspace-cli-skill) ｜ CLI 基础：[gogcli](https://github.com/cgroschupp/gogcli)（非官方）

## 内容地图

- [入门](./getting-started) —— 定位（方法论叶、无 Google 官方仓）、Workspace API 覆盖、OAuth 2.0 vs 服务账号、五分类选型
- [指南](./guide-line) —— 各域操作（邮件/日程/文档/Drive/Chat）+ 认证模型 + 工作流 + 安全要点
- [参考](./reference) —— Workspace API 表、认证模型、社区工具、安全要点、链接

## 幻灯片地址

<a href="/SlideStack/google-workspace-cli-slide/" target="_blank">Google Workspace CLI Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=662" target="_blank" rel="noopener noreferrer">Google Workspace CLI Skills 测试题</a>

