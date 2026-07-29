---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Slack / Discord / 飞书 / 钉钉官方文档编写 —— 平台概念对照 / 通知参数 / 机器人 API / CLI 命令 / 选型矩阵

## 四大平台概念对照表

| 概念 | Slack | Discord | 飞书 Lark | 钉钉 DingTalk |
|---|---|---|---|---|
| 顶层组织 | Workspace | Server | 租户/Tenant | 组织 |
| 文字空间 | Channel | Text Channel | 群 / 话题 | 群 |
| 子讨论 | Thread | Thread | 话题（消息内）| 引用回复 |
| 私信 | DM | DM | 单聊 | 单聊 |
| 语音 | Huddles | Voice Channel | 视频会议 | 音视频会议 |
| 跨组织 | **Slack Connect** | 跨 Server | 外部群 | 合作群 |
| 角色/权限 | 工作区管理员 | **细粒度 Role** | 群角色/管理员 | 管理员/部门主管 |
| 应用市场 | App Directory | Bot / App | 应用市场 | 应用市场 |
| 工作流 | Workflow Builder | Bot 自建 | 飞书机器人/审批 | 宜搭/审批流 |
| AI | Slack AI | Clyde（实验）| My AI / 智能伙伴 | AI 听记/表格/搜问/千问 |
| 文档协作 | 弱（集成）| 无 | **Docs/Bitable/Wiki** | 文档/表格/脑图 |
| 官方 CLI | 无 | 无 | **[larksuite/cli](https://github.com/larksuite/cli)** | 无 |

## Slack 核心概念详解

### 频道类型

| 类型 | 可见性 | 搜索 | 加入方式 |
|---|---|---|---|
| Public Channel | 全员可见 | 可搜 | 自由加入 |
| Private Channel | 仅成员 | 仅成员可搜 | 邀请 |
| Multi-Workspace（Connect）| 跨组织共享 | 各方成员 | 邀请 |

### 消息格式

Slack 消息支持 mrkdwn（非标准 Markdown）：

```
*粗体*          → 粗体
_斜体_          → 斜体
~删除线~        → 删除线
`行内代码`      → code
```代码块```    → 多行
> 引用          → blockquote
@用户名         → 提及
#频道名         → 链接频道
:emoji:         → 表情
```

### 通知设置枚举

| 级别 | 行为 |
|---|---|
| All new messages | 每条都推 |
| Direct messages, mentions & keywords | 仅 DM / @我 / 关键词 |
| Nothing | 静音 |

### App Directory 主要集成

| 类别 | 典型应用 |
|---|---|
| 协作 | Google Drive / Dropbox / OneDrive |
| 项目管理 | Jira / Asana / Trello / Linear |
| 代码 | GitHub / GitLab / Bitbucket |
| CI/CD | CircleCI / Jenkins / Travis |
| 监控 | Datadog / PagerDuty / Sentry |
| 设计 | Figma / Zeplin |
| 客服 | Zendesk / Intercom |
| AI | Slack AI / GPT 应用 |

## Discord 核心概念详解

### 频道类型

| 类型 | 用途 | 特性 |
|---|---|---|
| Text Channel | 文字交流 | 消息历史、线程 |
| Voice Channel | 实时语音 | 永远在线、屏幕共享 |
| Stage Channel | 一对多发言 | 主持人/发言者/听众角色 |
| Forum Channel | 帖式讨论 | 每个话题一个帖子 |
| Announcement Channel | 公告 | 跨 Server 转发 |

### 权限系统（核心）

权限分两层：

**1. 角色（Role）权限**

| 权限 | 说明 |
|---|---|
| Administrator | 超级管理员 |
| Manage Server | 管理服务器设置 |
| Manage Roles | 管理其他角色 |
| Manage Channels | 管理频道 |
| Kick / Ban Members | 踢人/封禁 |
| Manage Messages | 删除他人消息 |
| Mention @everyone/@here | 全员提醒 |

**2. 频道覆盖（Channel Override）**

每个频道可针对角色/成员**单独覆盖**权限，例如 `#staff-only` 仅允许 `@Staff` 角色查看。

### Bot API 要点

- 通过 [Developer Portal](https://discord.com/developers/applications) 注册
- 需要 **Privileged Gateway Intents**（Message Content / Server Members / Presence）
- 主流库：discord.js / discord.py / serenity
- 速率限制：按路由/方法分别限流

## 飞书 Lark 核心概念详解

### 套件模块全表

| 模块 | 国内版 | 国际版 | 说明 |
|---|---|---|---|
| Messenger | 飞书消息 | Lark Messenger | IM 核心 |
| Docs | 飞书文档 | Lark Docs | 实时协作文档 |
| Bitable | 多维表格 | Lark Base | 数据库式表格 |
| Sheet | 电子表格 | Lark Sheet | Excel 式 |
| Slides | 飞书幻灯片 | Lark Slides | 演示文稿 |
| Mind Notes | 思维笔记 | Lark Mind | 思维导图/白板 |
| Wiki | 知识库 | Lark Wiki | 结构化知识 |
| Calendar | 日历 | Lark Calendar | 日程 |
| Meeting | 视频会议 | Lark Meet | 含 AI 字幕/纪要 |
| Approval | 审批 | Approval | 流程审批 |
| Mail | 飞书邮箱 | Lark Mail | 企业邮箱 |
| Tasks | 任务 | Tasks | 待办管理 |
| OKR | OKR | OKR | 目标管理 |
| Contacts | 通讯录 | Contacts | 组织架构 |
| Attendance | 考勤 | Attendance | 打卡 |
| Drive | 云文档 | Drive | 文件存储 |

### larksuite/cli 命令速查

```bash
# 安装
npm i -g @larksuiteoapi/lark-cli

# 认证
lark auth login

# Messenger
lark messenger send --chat_id &lt;id&gt; --text "消息"
lark messenger list --user_id &lt;id&gt;

# Docs
lark doc create --title "周报" --folder_token &lt;token&gt;
lark doc get --doc_token &lt;token&gt;

# Base（多维表格）
lark base record list --app_token &lt;token&gt; --table_id &lt;id&gt;
lark base record create --app_token &lt;token&gt; --table_id &lt;id&gt; --fields '{"k":"v"}'

# Calendar
lark calendar event list --time_min "2026-07-01T00:00:00Z"

# 查看 26 个 AI Agent Skills
lark skills list
```

- **18 业务域**、**200+ 命令**、**26 AI Agent Skills**
- 三层架构：快捷命令 → API 命令 → 原始 API（`--raw`）
- 结构化输出 JSON，天然适配 LLM / MCP

## 钉钉 DingTalk 核心概念详解

### 组织管理

| 能力 | 说明 |
|---|---|
| 组织架构 | 部门/层级/汇报关系，HR 系统同步 |
| 考勤打卡 | 定位/WiFi/人脸，班次/排班 |
| 审批流 | 请假/报销/用印，可视化配置 |
| DING 消息 | 已读追踪 + 紧急强提醒（电话/短信）|
| 日志/汇报 | 日报/周报/月报模板 |
| 智能报表 | 考勤/绩效/销售数据看板 |

### AI 产品矩阵

| 产品 | 定位 | 核心能力 |
|---|---|---|
| AI 听记 | "未来的录音方式" | 录音/会议转文字 + 智能纪要 |
| AI 表格 | "AI 时代的工作入口" | 自然语言操作多维表格 |
| AI 搜问 | "AI 时代的知识入口" | 跨应用知识检索 + 问答 |
| 钉钉 A1 | "随身助理" | 个人日程/提醒/代办 |
| 千问办公 | 专业办公助手 | 通义千问驱动写作/分析 |
| AI 麦穗 | 销售助手 | 客户跟进/话术 |
| AI 工牌 | 服务记录 | 线下服务数字化 |

### 钉钉机器人消息类型

| 类型 | 说明 |
|---|---|
| text | 纯文本 |
| markdown | Markdown（部分客户端有限渲染）|
| ActionCard | 带按钮的卡片 |
| Link | 链接消息 |
| FeedCard | 图文流 |

## 通知治理参数对照

| 平台 | 全局勿扰 | 频道静音 | 关键词提醒 | 摘要模式 |
|---|---|---|---|---|
| Slack | Do Not Disturb 时段 | Mute channel | Keywords 设置 | 有（Digest）|
| Discord | 状态设为 Do Not Disturb | 频道 Notification Settings | 无原生 | 无 |
| 飞书 | 专注模式 | 群消息提醒方式 | 关键词 | 摘要 |
| 钉钉 | 勿扰模式 | 群免打扰 | DING 关键词 | 摘要 |

## Webhook / Bot 入口对照

| 平台 | 入口 | 鉴权 |
|---|---|---|
| Slack | Incoming Webhook / Bolt App | Webhook URL / OAuth Token |
| Discord | Bot Token + Gateway | Bot Token |
| 飞书 | 自定义机器人 / 开放平台 App | Webhook 签名 / App Secret |
| 钉钉 | 群机器人 / 企业内部应用 | 加签 / AppKey+AppSecret |

## 选型决策流程图（文字版）

```
是否国内为主？
├─ 是 → 是否强合规/考勤/审批？
│       ├─ 是 → 钉钉
│       └─ 否 → 是否重度协作文档？
│               ├─ 是 → 飞书
│               └─ 否 → 飞书（默认推荐）
└─ 否 → 是社区/语音重场景？
        ├─ 是 → Discord
        └─ 否 → Slack（企业默认）
```

## 参考

- Slack 帮助中心：<https://slack.com/help>
- Slack API 文档：<https://api.slack.com/>
- Discord 安全/帮助：<https://discord.com/safety>
- Discord Developer Portal：<https://discord.com/developers/applications>
- 飞书开放平台：<https://open.feishu.cn/>
- Lark 国际版：<https://www.larksuite.com/>
- 钉钉开放平台：<https://open.dingtalk.com/>
- larksuite/cli（飞书官方 CLI）：<https://github.com/larksuite/cli>
