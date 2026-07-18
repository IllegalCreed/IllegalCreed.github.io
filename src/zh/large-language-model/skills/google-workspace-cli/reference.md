---
layout: doc
outline: [2, 3]
---

# 参考

> 方法论/社区生态叶，无 Google 官方仓，以社区 gogcli 等 CLI + Google Workspace API 生态为代表。

## 速查

- **10+ Workspace API**：Gmail · Calendar · Drive · Docs · Sheets · Slides · Chat · Tasks · People · Classroom
- **认证两路**：OAuth 2.0（个人数据，refresh_token 长期）· 服务账号（组织数据，Domain-wide Delegation）
- **scope 三档**：readonly / modify / send——最小化申请
- **社区工具**：gogcli（CLI 基础）、各 SKILL.md 小仓；底层都依赖 Workspace REST API
- **安全**：写必确认 · 最小 scope · dry-run · 凭据托管 · 配额预算 · 审计日志

## Workspace API 全表

| API | 主要操作 | scope（最小） |
| --- | --- | --- |
| Gmail | search / read / draft / send / label | `gmail.readonly` · `gmail.modify` · `gmail.send` |
| Calendar | events / freeBusy / settings | `calendar.readonly` · `calendar.events` |
| Drive | files / permissions / revisions | `drive.readonly` · `drive.file` · `drive` |
| Docs | documents.batchUpdate / get | `documents.readonly` · `documents` |
| Sheets | values / spreadsheets.batchUpdate | `spreadsheets.readonly` · `spreadsheets` |
| Slides | presentations.batchUpdate / get | `presentations.readonly` · `presentations` |
| Chat | spaces / messages / memberships | `chat.bot` · `chat.memberships` |
| Tasks | tasklists / tasks | `tasks.readonly` · `tasks` |
| People | contacts / profiles | `contacts.readonly` · `contacts` |
| Classroom | courses / coursework / studentSubmissions | `classroom.rosters` · `classroom.coursework.students` |

> 经验：优先 `*.readonly`；只需写入「特定文件」选 `drive.file` 而非 `drive`（全盘）。

## 认证模型对照

| 维度 | OAuth 2.0 | 服务账号 |
| --- | --- | --- |
| 凭据 | Client ID + Secret + refresh_token | 服务账号邮箱 + JSON 私钥 |
| 适用 | 代表单用户操作 | 域级自动化、批量 |
| 授权流程 | 同意屏 → consent → refresh | 域管理员 Domain-wide Delegation |
| Gmail | 主流（个人邮件） | 受限，仅合规域内场景 |
| Drive | 推荐 `drive.file` | 全盘 `drive` + 委托用户 |
| 凭据存储 | OS keychain / Secret Manager | Secret Manager + IAM |
| 风险 | scope 过大、token 泄露 | 私钥泄露影响全域 |

## 五分类选型

| 维度 | 取值 | 影响 |
| --- | --- | --- |
| Surface | Claude Code / Cursor / 服务器 | 决定交互方式（对话 vs 后台） |
| Operation | 只读 / 写 | 写操作必须确认与 dry-run |
| Actor | 代表本人 / 代表组织 | 决定 OAuth vs 服务账号 |
| Execution home | 本机 / 云 | 凭据存储与网络边界 |
| Trigger | 人触发 / Webhook / 定时 | 影响 auth 续期与并发模型 |

## 社区工具与生态

| 项目 | 类型 | 说明 |
| --- | --- | --- |
| [gogcli](https://github.com/cgroschupp/gogcli) | Go CLI | 第三方 Google CLI，覆盖多个 Workspace 域 |
| [tivojn/gogcli-skill](https://github.com/tivojn/gogcli-skill) | Claude Skill | 基于 gogcli 的 skill 封装 |
| [evgyur/google-workspace-cli-skill](https://github.com/evgyur/google-workspace-cli-skill) | Skill | 独立的 Workspace CLI skill |
| Google Workspace APIs | 官方 REST | 各 Workspace 服务的官方 API |

> ⚠️ 无 Google 官方 SKILL.md 仓。社区项目体量小、维护不稳定，使用前请自行核验。

## 典型 scope 与最小化原则

```text
gmail.readonly        # 只读，不能改不能发
gmail.modify          # 改标签/归档，不能直接发
gmail.send            # 直接发送（最敏感）
gmail.compose         # 只起草，不发送
drive.file            # 只能访问 agent 创建或用户显式选的文件
drive.readonly        # 全盘只读
drive                 # 全盘读写（高危）
```

**最小化原则**：能 `.readonly` 别 `.modify`；能 `drive.file` 别 `drive`；能 `gmail.compose` 别 `gmail.send`。

## 安全要点清单

- ✅ 写操作前 agent 暂停，人显式确认
- ✅ scope 最小化（readonly > modify > send）
- ✅ 批量写操作先 dry-run 一份样本
- ✅ refresh_token / 私钥进 Secret Manager / OS keychain
- ✅ 配额预算（Gmail 日发信上限、Drive QPS）+ 限速
- ✅ 写操作写审计日志（actor / target / 时间）
- ❌ 不要 agent 自动 `send` 邮件（误发风险）
- ❌ 不要把私钥 / refresh_token 提交进 git
- ❌ 不要批量 `files.delete` 不试跑

## 资源链接

- 官方 API 总览：[developers.google.com/workspace/docs](https://developers.google.com/workspace/docs)
- OAuth 2.0：[developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)
- 服务账号 / Domain-wide Delegation：[admin.google.com](https://admin.google.com) 委托设置
- Gmail API 配额：[developers.google.com/gmail/api/reference/quota](https://developers.google.com/gmail/api/reference/quota)
- 相关叶：[Skills CLI 与 find-skills](../skills-cli-find-skills/) · [Vercel Agent Skills](../vercel-agent-skills/) · [Antfu Skills](../antfu-skills/)
