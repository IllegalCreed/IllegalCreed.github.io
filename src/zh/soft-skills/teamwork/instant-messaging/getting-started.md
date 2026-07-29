---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Slack / Discord / 飞书 Lark / 钉钉 DingTalk 官方文档编写（2026.07 版本）

## 速查

- 四大平台定位：**Slack**（企业 IM 事实标准，英文世界）/ **Discord**（社区导向，语音强）/ **飞书 Lark**（中文重度协作文档一体化）/ **钉钉 DingTalk**（国内强管控 + AI 转型）
- Slack 核心抽象：**Workspace → Channel（频道）→ Thread（线程）→ DM（私信）**
- Slack 三大扩展点：**App Directory**（2600+ 应用）/ **Slack Connect**（跨组织频道）/ **Huddles**（一键语音）
- Discord 核心抽象：**Server（服务器）→ Channel（文字/语音/舞台/论坛频道）→ Role（角色权限）→ Bot**
- 飞书核心抽象：**Messenger + Docs（实时协作文档）+ Bitable（多维表格）+ Wiki**
- 钉钉核心抽象：**组织架构 + 消息 + 应用（考勤/审批/日志）+ AI 听记/表格/搜问**
- 选型口诀：**国际/英文 → Slack；社区/语音 → Discord；中文文档协作 → 飞书；国内合规/管理 → 钉钉**
- 频道命名：Slack `#proj-xxx` / `#team-xxx` / `#help-xxx`；Discord 用 emoji 前缀分类
- 通知治理：默认「仅 @我」+「勿扰时段」+「摘要模式」，保护深度工作时间
- 机器人自动化：Slack Workflow Builder / Incoming Webhook / Bolt（JS·Python）；Discord Bot API；飞书机器人 + 开放平台；钉钉自定义机器人
- 异步优先：能用线程说清就不开会，能写文档就不在频道刷屏
- [larksuite/cli](https://github.com/larksuite/cli)：飞书官方 CLI（Go），200+ 命令、26 个 AI Agent Skills，可被 AI Agent 驱动操作整个飞书

## 四大平台是什么

即时通讯与协作工具把团队沟通收敛到「频道 + 线程 + 机器人」的统一工作台。四大主流对比：

| 维度 | Slack | Discord | 飞书 Lark | 钉钉 DingTalk |
|---|---|---|---|---|
| 出身 | 企业 IM（2013）| 游戏语音（2015）| 字节办公套件（2016）| 阿里办公套件（2014）|
| 定位 | 企业异步协作 | 社区 / 实时语音 | 中文协同一体化 | 国内强管控 + AI |
| 核心单元 | Channel + Thread | Server + Channel（文字/语音）| 消息 + 文档/表格 | 组织 + 消息 + 应用 |
| 文档协作 | 弱（靠集成 Notion）| 无 | **Docs / Bitable / Wiki** | 文档/表格/脑图 |
| 语音/视频 | Huddles（轻量）| **语音频道（永远在线）**| 视频会议 | 视频会议 |
| 跨组织协作 | **Slack Connect** | 天然跨 Server | 外部联系人 | 外部联系人 |
| 扩展生态 | App Directory（2600+）| Bot API | 开放平台 | 应用市场 |
| AI 能力 | Slack AI（搜索/摘要）| Clyde（实验）| My AI / 智能伙伴 | **AI 听记/表格/搜问/千问** |
| 典型场景 | SaaS 团队、跨国公司 | 开源社区、Web3、创作者 | 国内互联网公司 | 国内传统企业、政企 |
| 数据归属 | 美国/欧盟 | 美国 | 中国 / 海外版 Lark | 中国 |

**核心结论**：没有「最好」的工具，只有「最匹配场景」的。**跨国英文团队 → Slack；技术社区/语音重 → Discord；中文文档重度协作 → 飞书；国内合规强管理 → 钉钉**。

## Slack 基础

### 核心概念层级

```
Workspace（工作区，一个公司）
├── Channel（频道）
│   ├── Public Channel（公开，可搜索、可旁听）
│   ├── Private Channel（私有，需邀请）
│   └── Thread（线程，频道内的子讨论）
├── Direct Message（DM，一对一）
├── Group DM（小群）
└── Slack Connect（跨工作区的共享频道）
```

### Channel 命名规范

| 前缀 | 含义 | 示例 |
|---|---|---|
| `#proj-` | 项目频道 | `#proj-payment-v2` |
| `#team-` | 团队频道 | `#team-backend` |
| `#help-` | 求助 | `#help-devops` |
| `#ann-` | 公告 | `#ann-releases` |
| `#social-` | 闲聊 | `#social-random` |

约定前缀让频道可按主题筛选，新人易找。

### Thread（线程）用法

- 复杂讨论**拉线程**，不在主频道刷屏
- 线程首条写清上下文（链接、截图、问题），方便回溯
- 线程里 `Also send to #channel` 把结论广播到主频道
- 决策落定后在末条 `📌 总结：...` 便于检索

### Huddles（轻量语音）

- 频道/DM 右下角耳机图标一键发起，**无需预约**
- 支持屏幕共享、实时字幕、消息同步
- 适合「这个问题打字说不清，拉个 huddle」的快速同步

### Slack Connect（跨组织）

- 与外部公司建**共享频道**，双方都在自己 Workspace 操作
- 替代邮件往复，B2B 协作首选
- 适合：乙方对接、客户成功、联合开发

## Discord 基础

### 核心概念层级

```
Server（服务器，一个社区/团队）
├── Category（分类，频道分组）
│   ├── Text Channel（文字频道 #general）
│   ├── Voice Channel（语音频道，永远在线）
│   ├── Stage Channel（舞台频道，一对多发言）
│   └── Forum Channel（论坛频道，帖子式）
├── Role（角色，决定权限 + 颜色）
└── Bot（机器人，自动化 + 功能扩展）
```

### 与 Slack 的关键差异

| 维度 | Slack | Discord |
|---|---|---|
| 组织单元 | Workspace（公司）| Server（社区，可任意建）|
| 频道类型 | 文字 | **文字/语音/舞台/论坛** |
| 权限 | 工作区管理员 | **细粒度角色权限**（按频道/角色）|
| 语音 | Huddles（临时）| **语音频道（持久，随时进）**|
| 自动化 | App + Workflow | **Bot API（自建机器人文化）**|
| 免费 | 90 天历史 | **无限历史（部分限搜索）**|
| 定位 | 企业 | 社区 / 兴趣小组 |

### 角色权限（关键）

Discord 的权限系统是**按角色叠加**的：

```
@everyone          基础权限（所有人）
├── @Developer     开发者（可发代码片段频道）
├── @Moderator     版主（可删消息、踢人）
├── @Contributor   贡献者（特殊颜色 + 频道访问）
└── @Bot           机器人（被授予的 API 权限）
```

权限可按**频道级别**覆盖：某个文字频道只允许 `@Developer` 发言。这是 Discord 管理大型社区的核心机制。

### Bot（机器人）

- 通过 [Developer Portal](https://discord.com/developers/applications) 注册 Bot，获取 token
- Bot 加入 Server 后可监听事件、回复消息、管理角色
- 主流库：discord.js（Node）、discord.py（Python）、serenity（Rust）
- 常见用途：欢迎新人、自动化角色分配、音乐、投票、日志

## 飞书 Lark 基础

### 一体化套件

飞书不是单纯 IM，而是「**消息 + 文档 + 表格 + 日历 + 会议 + 审批 + OKR**」全家桶：

| 模块 | 说明 |
|---|---|
| Messenger | 即时消息，支持群组、话题、@、RichText |
| Docs | **实时协作文档**（多人光标、评论、建议模式）|
| Bitable（多维表格）| 数据库式表格，支持视图/公式/自动化 |
| Wiki | 知识库，文档结构化沉淀 |
| Sheet | 电子表格（类 Excel）|
| Mind Notes | 思维笔记 / 幻灯片 / 画板 |
| Calendar | 日历 + 智能日程 |
| Meeting | 视频会议（含 AI 字幕/纪要）|
| Approval | 审批流 |

### 消息与文档的深度交织

飞书的特色是**消息里直接插入文档/表格/@人/任务**：

- 在群里发一个文档链接 → 自动渲染预览 → 点击进入实时协作
- `@人` 直接把人拉进文档协作
- 文档里的待办可同步到任务系统

这种「**讨论即在文档上发生**」的体验是飞书区别于 Slack（IM + 外部 Notion）的核心。

### larksuite/cli（2026-03 开源）

飞书官方命令行工具 [larksuite/cli](https://github.com/larksuite/cli)，Go 编写，MIT 协议：

- **18 个业务域**：Messenger、Docs、Base（Bitable）、Calendar、Mail、Meetings、Tasks、Sheets、Drive、Slides、Wiki、Contacts、Attendance、Approval、OKR 等
- **200+ 命令**：三层架构（快捷命令 → API 命令 → 原始 API）
- **26 个 AI Agent Skills**：开箱即用，让 AI Agent 操作整个飞书
- 结构化输出（JSON），天然适配 LLM / MCP 生态

意义：把办公套件从「GUI 操作」变为「可编程/可被 Agent 驱动」的平台，是国内办公工具走向 AI Native 的标志。

## 钉钉 DingTalk 基础

### 强管控起家

钉钉以**组织管理**为核心：

- **组织架构同步**：HR 系统直连，部门/层级/汇报关系清晰
- **考勤打卡**：定位/WiFi/人脸，国内企业强需求
- **审批流**：请假/报销/用印，可视化配置
- **DING 消息**：已读/未读追踪，紧急消息可强提醒（电话/短信）
- **日志/汇报**：日报/周报模板化

### AI 转型（2024-2026）

钉钉全面转向「**AI 时代工作方式**」：

| AI 产品 | 定位 |
|---|---|
| AI 听记 | 录音/会议转文字 + 纪要，"未来的录音方式" |
| AI 表格 | 自然语言操作多维表格，"AI 时代的工作入口" |
| AI 搜问 | 跨应用知识检索 + 问答，"知识入口" |
| 钉钉 A1 | 个人 AI 助理 |
| 千问办公 | 基于通义千问的专业办公助手 |

2 亿月活的体量 + 通义千问大模型，钉钉把 IM 变成 AI Agent 的落地场景。

## 通知治理（通用）

IM 默认配置会**摧毁注意力**。治理三招：

1. **分级通知**：默认仅 `@我` + `@here` 触发；非关键频道设为「静音/摘要」
2. **勿扰时段**：设 22:00-08:00 不接收推送；深度工作时开启「专注模式」
3. **频道分级**：把频道分「必须即时响应」「每日扫一次」「仅存档」三档，对应不同通知策略

::: tip 通知过载是生产力杀手
研究表明，每次被打断后恢复专注平均需 23 分钟。**默认静音、主动检索**比「实时刷消息」高效得多。
:::

## 下一步

入门到此——你已经能区分四大平台定位、理解 Slack/Discord/飞书/钉钉的核心抽象、做基础通知治理。下一章 `guide-line.md` 深入讲 **频道治理与命名规范 / 通知策略进阶 / 机器人与自动化实战 / 跨组织协作 / 飞书开放平台与 larksuite/cli / 钉钉 AI 能力 / 选型决策矩阵 / IM 礼仪与异步协作最佳实践**。
