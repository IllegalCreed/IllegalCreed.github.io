---
layout: doc
outline: [2, 3]
---

# 入门

> 方法论/社区生态叶，无 Google 官方仓，以社区 gogcli 等 CLI + Google Workspace API 生态为代表。

## 速查

- **定位**：方法论/社区生态叶——agent 操作 Google Workspace。**无 Google 官方 SKILL.md 仓**，社区以基于 gogcli 等 CLI 的 skill 封装为代表
- **覆盖 API**：Gmail · Calendar · Drive · Docs · Sheets · Slides · Chat · Tasks · People/Contacts · Classroom（10+ REST API）
- **认证两条路**：OAuth 2.0（用户授权，代表本人操作）· 服务账号（域级自动化，需 Domain-wide Delegation）
- **五分类选型**：surface / operation / actor / execution home / trigger → 决定 auth 模型
- **写操作必确认**：邮件发送、文件删除、日历修改 → 干跑 / 最小 scope / 二次确认
- **社区工具**：gogcli（Google CLI）、各 SKILL.md 小仓；底层都依赖 Google Workspace REST API

## 定位：方法论/社区生态叶

Google Workspace CLI Skills **不是一个具体 Google 官方仓库**——`gh search` 没有发现 Google 出品的 SKILL.md 仓库。它代表的是一类**方法论与社区生态**：用 agent + CLI + Workspace API 把日常办公自动化。社区以多个第三方项目为代表：

- 基于 [gogcli](https://github.com/cgroschupp/gogcli) 的 skill 封装（如 `tivojn/gogcli-skill`）
- `evgyur/google-workspace-cli-skill` 等独立小仓
- 各团队自建的内部 Skill（OAuth 凭据 + Workspace API 封装）

底层**统一依赖 Google Workspace REST API**，差异只在认证、封装与触发方式。所以本叶讲的是**方法论**：怎么选 API、怎么选认证、怎么安全地把 Workspace 交给 agent。

## Workspace API 覆盖

| 域 | API | 典型 agent 操作 |
| --- | --- | --- |
| 邮件 | Gmail API | 搜索邮件、读邮件、起草回复、发送、归档、打标签 |
| 日历 | Calendar API | 查日程、查忙闲、约会议、改/取消会议、提醒 |
| 网盘 | Drive API | 搜索文件、上传/下载、移动、共享、批量改名 |
| 文档 | Docs API | 插入段落、批量替换、读取正文 |
| 表格 | Sheets API | 读写行、批量公式、透视表 |
| 幻灯片 | Slides API | 生成页、批量替换占位符 |
| 聊天 | Chat API | 发消息、建空间、Webhook 通知 |
| 任务 | Tasks API | 建/查/完成任务 |
| 通讯录 | People API | 联系人查询、批量补字段 |
| 课堂 | Classroom API | 课程/作业/成绩（教育场景） |

## 认证：OAuth 2.0 vs 服务账号

| 维度 | OAuth 2.0（用户授权） | 服务账号（Service Account） |
| --- | --- | --- |
| 适用 | 代表**单个用户**操作（读本人邮件、改本人日历） | **域级自动化**（组织内部批量） |
| 凭据 | Client ID + Client Secret + Refresh Token | 服务账号邮箱 + JSON 私钥 |
| 授权 | 用户首次 consent 同意 scope | 域管理员在 Admin Console 做 Domain-wide Delegation |
| Gmail | 主流方式（服务账号受严格限制） | 受限，需域内授权且场景合规 |
| 典型场景 | 个人助理、邮件起草、日程查询 | 后台同步、报表生成、批量文档处理 |

> 经验法则：**碰个人数据（Gmail/Calendar）优先 OAuth 2.0，碰组织公共数据（共享 Drive、域文档）用服务账号**。

## 五分类选型

设计一个 Workspace agent 前，先回答五个问题，auth 模型自然浮出：

1. **Surface（在哪用）**——Claude Code / Cursor / claude.ai / 自动化服务器？
2. **Operation（读还是写）**——只读（搜索/查询）还是写（发送/删除）？
3. **Actor（谁执行）**——代表本人，还是代表组织？
4. **Execution home（在哪运行）**——本机 / 云函数 / 长跑 worker？
5. **Trigger（如何启动）**——人触发 / Webhook / 定时？

例如：本机 + 写 + 代表本人 + 手动 → OAuth 2.0 + 发送前确认；云端 + 读 + 代表组织 + 定时 → 服务账号 + Domain-wide Delegation。

## 起一个最小工作流

```bash
# 1. GCP 建项目、启用 Gmail / Calendar / Drive API
# 2. 配 OAuth 同意屏，申请 scope（最小必要）
# 3. 生成 Client ID，拿到 refresh_token
# 4. 在 skill 里封装调用
```

典型 agent 提示词示例：

```text
搜我最近 7 天未读邮件，按发件人分类汇总，起草「已收到，本周内回复」回复，不要发送。
```

agent 会调 Gmail API 搜索、读取、归类、起草——**止于草稿**，发送权在你。

## 下一步

- [指南](./guide-line) —— 各域操作、认证模型深入、安全要点、反模式
- [参考](./reference) —— Workspace API 全表、认证模型对照、社区工具、安全要点、链接
- 上游：[Google Workspace APIs](https://developers.google.com/workspace/docs)
