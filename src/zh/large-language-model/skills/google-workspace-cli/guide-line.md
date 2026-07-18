---
layout: doc
outline: [2, 3]
---

# 指南

> 方法论/社区生态叶，无 Google 官方仓，以社区 gogcli 等 CLI + Google Workspace API 生态为代表。

## 速查

- **邮件**：搜/读/起草止于草稿，发送需显式确认；Gmail API scope 最小化（readonly / send / modify）
- **日程**：Calendar API 查忙闲、约会议、改日程；跨时区用 `timeZone` 字段
- **文档**：Docs/Sheets/Slides API 批量读写，注意 revisionId 与并发
- **Drive**：搜索用 `q` 参数（`fullText contains 'xxx'`），权限改动要 dry-run
- **Chat**：Webhook 最简，空间消息用 Chat API；优先异步
- **认证**：个人数据 OAuth 2.0，组织数据服务账号 + Domain-wide Delegation
- **安全**：写操作必确认 · scope 最小化 · 敏感操作 dry-run · 配额预算

## 各域操作要点

### 邮件（Gmail API）

```text
搜未读邮件 → 按主题聚类 → 起草回复 → 打标签/归档
```

- 搜索：`users.messages.list(q="is:unread after:2026/07/01")`
- 读邮件：先取 `snippet` 决定要不要拉完整 `payload`
- **起草 ≠ 发送**：`users.drafts.create` 停在草稿；`users.messages.send` 才真发
- scope 三档：`readonly` / `modify`（不含 send）/ `send`——能不申请 `send` 就不申请

### 日程（Calendar API）

- 查忙闲：`freeBusy.query` 传 timeMin/timeMax + calendars
- 约会议：`events.insert`，跨时区务必显式传 `timeZone`
- 改/取消：发 update 前向发起人确认；attendee 多时用 `sendUpdates: "all"`

### 文档（Docs / Sheets / Slides API）

- Docs：`documents.batchUpdate` 插入文本/替换；大段写入先 `requests` 数组攒好
- Sheets：`spreadsheets.values.get` / `update`，注意 A1 notation 与 `valueInputOption`
- Slides：基于模板 `presentations.batchUpdate` 批量替换占位符生成报表

### Drive

- 搜索：`files.list(q="fullText contains '合同' and modifiedTime > '2026-06-01'")`
- 移动/改名/共享：批量前先 dry-run（`?supportsAllDrives=true` 对共享盘）
- **权限改动是高危**：`permissions.create` 可能误授权外部用户，必须二次确认

### Chat / Tasks

- Chat：发通知用 Webhook（空间内Incoming Webhook 最简）；建空间/消息需 Chat API + 服务账号
- Tasks：增删查改 tasklists / tasks，适合做「邮件 → 任务」联动

## 认证模型深入

### OAuth 2.0（代表用户）

```text
1. 同意屏申请 scope
2. 跳转授权 → 拿 code → 换 access_token + refresh_token
3. refresh_token 长期有效，access_token 1 小时
4. agent 用 access_token 调 API
```

- 首次 consent 后存 refresh_token；以后无感刷新
- scope 必须**最小化**——`gmail.readonly` 够用就别申请 `gmail.send`
- 敏感 scope（如 `gmail.send`）需通过 Google OAuth verification

### 服务账号（代表组织）

```text
1. GCP 建服务账号，下载 JSON 私钥
2. 域管理员在 Admin Console 做 Domain-wide Delegation
3. 委托对应 scope（如 https://www.googleapis.com/auth/drive）
4. 服务账号「冒充」(impersonate) 用户操作
```

- 适合组织内部批量、报表、备份
- Gmail 用服务账号限制严：通常只允许域内邮件、合规场景
- 私钥泄露风险高——存 Secret Manager，别进 git

## 工作流模式

| 模式 | 典型流程 | 安全要点 |
| --- | --- | --- |
| **邮件分类助手** | 搜未读 → 聚类 → 起草回复 | 止于草稿，发送前确认 |
| **日程协调** | 查忙闲 → 提议时段 → 建会议 | attendee 多时显式 sendUpdates |
| **文档批量生成** | 模板 + 数据源 → Sheets/Docs 批量产出 | dry-run 一份样本再批量 |
| **Drive 整理** | 搜旧文件 → 改名/移动/归档 | 权限改动二次确认 |
| **报表自动化** | 服务账号定时拉数据 → 写 Sheets → Chat 通知 | 配额预算、私钥托管 |

## 安全要点（强制）

- **写操作必须确认**：`send` / `delete` / `update` / `permissions.create` 前 agent 暂停，人确认才执行
- **scope 最小化**：能 readonly 就别 modify，能 modify 就别 send
- **敏感操作 dry-run**：批量改名 / 批量归档 / 批量发信先小样本试
- **凭据隔离**：refresh_token / 服务账号私钥进 Secret Manager 或本地 OS keychain，**绝不进仓库**
- **配额预算**：Gmail 每日发信上限、Drive API QPS——批量前算配额，分段限速
- **审计日志**：写操作记录 actor / target / 时间，便于事后追溯

## 反模式

- **agent 自动发邮件**——没有显式确认就 `send`，误发给客户/全员
- **申请最大 scope「以防万一」**——`gmail.compose` / `gmail.send` 同时申请，扩大攻击面
- **服务账号私钥进 git**——一旦泄露，整个域被授权
- **批量删文件不 dry-run**——`files.delete` 没有回收站（Drive 删 30 天才清空）
- **跨时区不传 timeZone**——会议时间错乱
- **配额打满**：循环发信不 sleep，触发 quota 拒服务

## 与相邻叶的边界

- **Claude Code Agent Skills**（生态总览）在 [Skills CLI 与 find-skills](../skills-cli-find-skills/) 叶
- **其它平台 skill**（Vercel / Anthropic 等）在各自叶——本叶专讲 Google Workspace 方法论

## 下一步

- [参考](./reference) —— Workspace API 全表、认证模型对照、社区工具、链接
- 上游：[Google Workspace APIs](https://developers.google.com/workspace/docs) · [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
