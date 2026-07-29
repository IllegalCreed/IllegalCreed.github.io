---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Slack / Discord / 飞书 / 钉钉官方文档编写 —— 频道治理 / 通知进阶 / 机器人自动化 / 跨组织 / 选型 / 异步协作礼仪

## 频道治理与命名规范

### Slack 频道架构（推荐实践）

```
#ann-*            公告（仅管理员发言）：releases / incidents / company
#team-*           团队：backend / frontend / data
#proj-*           项目（临时，结束归档）：payment-v2 / migration
#help-*           求助：help-devops / help-it
#ch-***           频道主题前缀：ch-design / ch-qa
#social-*         闲聊：random / pets / memes
```

**频道生命周期管理**：

- 项目频道用完**归档**（Archive），保留历史但不再活跃
- 定期审计：半年无消息的频道归档或合并
- 每个 Channel 写**清晰的 Topic + Description**（Pin 一条「频道用途 + 常见问题」）

### Discord 频道架构（社区实践）

用 **Category + emoji 前缀**分类：

```
📢 公告 (Announcements)
   #announcements  #rules  #events
💬 交流 (Chat)
   #general  #off-topic  #introductions
💻 开发 (Development)
   #dev-general  #bugs  #pr-reviews  #help
🔊 语音 (Voice)
   🔊 general  🔊 gaming  🎤 stage
📚 资源 (Resources)
   #faq  #links  #showcase
🔒 内部 (Staff)
   #staff-only  #mod-log
```

Discord 频道多（百级常见），靠 Category 收纳 + 角色权限控制可见性。

### 飞书/钉钉群组治理

- 飞书用「**群公告 + 群待办 + 群话题**」结构化群消息
- 钉钉用「**群模板 + 群机器人 + DING**」规范化
- 共同原则：**一个群一个明确主题**，避免「大群刷屏」

## 通知策略进阶

### 通知分层模型

| 频道级别 | 通知策略 | 响应预期 | 示例 |
|---|---|---|---|
| **P0 紧急** | 全部 + 推送 + 桌面 | 5 分钟内 | `#incidents`（线上故障）|
| **P1 重要** | `@我` + `@here` 推送 | 1 小时内 | `#team-backend` |
| **P2 常规** | 仅 `@我` | 当天响应 | `#proj-xxx` |
| **P3 低优** | 摘要 / 不通知 | 按需查看 | `#social-random` |

### 平台具体设置

**Slack**：

- 频道右上 ⋮ → `Mute channel`（静音）/ `Change notifications`
- 全局：偏好设置 → 通知 → 仅 `Direct messages, mentions & keywords`
- 启用 `Do Not Disturb` 时段（如 22:00-08:00）
- 移动端：`Automatically determine hours` 智能勿扰

**Discord**：

- 频道右键 → `Notification Settings` → All / Only @mentions / Nothing
- Server 设置 → `Notification Settings` 设默认
- 角色 `@mentions` 可单独屏蔽

**飞书/钉钉**：

- 群设置 → 消息提醒方式（全部 / 仅 @ / 不提醒）
- 「专注模式」隐藏非重要会话
- 钉钉「DING」仅用于真正紧急，避免滥用

### 免打扰礼仪

- **非紧急不打扰**：跨时区团队在对方工作时间发消息，避免凌晨 @
- **用「稍后发送」**：Slack/飞书支持定时发送，让对方上班时看到
- **`@here` 慎用**：会通知所有在线成员，大频道里是噪音
- **`@channel` 极少用**：通知所有人，几乎总是过度打扰

## 机器人与自动化实战

### Slack 自动化三件套

**1. Workflow Builder（无代码）**

可视化拖拽建流程：

```
触发（定时 / 关键词 / 表单提交 / 新成员加入）
  → 步骤（发消息 / 发表单 / 调 API / 等待审批）
  → 结束
```

典型场景：每日站会提醒、新人入群欢迎、收集周报、值班轮换。

**2. Incoming Webhook（最简单的推送）**

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"部署完成 v1.2.3"}' \
  https://hooks.slack.com/services/Txxx/Bxxx/xxx
```

CI/CD、监控告警、Bot 通知的最轻量方案。

**3. Bolt 框架（编程式 Bot）**

```javascript
const { App } = require('@slack/bolt');
const app = new App({ token, signingSecret });

// 监听关键词
app.message('部署', async ({ message, say }) => {
  await say(`收到部署请求，来自 <@${message.user}>`);
});

// 斜杠命令
app.command('/deploy', async ({ command, ack, respond }) => {
  await ack();
  await respond(`开始部署 ${command.text}...`);
});

await app.start(process.env.PORT || 3000);
```

Bolt 支持 JS / Python，是构建复杂 Slack Bot 的标准方案。

### Discord Bot 实战

```javascript
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('messageCreate', msg => {
  if (msg.content === '!ping') {
    msg.reply('Pong!');
  }
});

client.login(process.env.DISCORD_TOKEN);
```

Discord Bot 生态：MEE6（管理）、Dyno（审核）、Groovy（音乐）、自建 Bot 做 CI 状态、issue 通知。

### 飞书机器人与开放平台

- **自定义机器人（Webhook）**：群内添加 → 拿 webhook 地址 → 推消息（类似 Slack Incoming Webhook）
- **应用机器人**：通过开放平台创建应用，订阅事件、调用 API（发消息/读文档/写多维表格）
- **larksuite/cli 自动化**：

```bash
# 安装
npm i -g @larksuiteoapi/lark-cli

# 发消息
lark messenger send --chat_id xxx --text "构建完成"

# 操作多维表格
lark base record create --app_token xxx --table_id xxx --fields '{"status":"done"}'

# 26 个 AI Agent Skills 可被 LLM 直接调用
```

CLI 让飞书从 GUI 工具变成**可编程平台**，AI Agent 能端到端完成「读群消息 → 查文档 → 更新表格 → 回复结论」。

### 钉钉机器人

- 群设置 → 添加机器人 → 自定义/Webhook
- 支持 Markdown / ActionCard / 链接消息
- 企业内部应用通过开放 API 接入审批、考勤、日志数据

## 跨组织协作

### Slack Connect（B2B 首选）

- 与外部公司建**共享频道**，双方在自己的 Workspace 操作
- 适合：客户对接、供应商协作、联合开发
- 权限可控：可限制外部成员的频道权限
- 替代邮件往复，沟通留痕可检索

### Discord（天然跨组织）

- 一个 Server 就是跨组织的社区
- 开源项目、Web3 DAO、创作者社群的标准形态
- 角色权限管理多组织成员

### 飞书/钉钉外部协作

- 飞书「外部联系人 + 外部群」
- 钉钉「外部企业通讯录 + 合作群」
- 注意：数据合规要求下，跨企业协作需走合规审批

## 飞书开放平台与 larksuite/cli

### 开放平台能力

飞书开放平台（open.feishu.cn）提供：

- **开放 API**：消息、文档、多维表格、日历、审批、通讯录等
- **事件订阅**：监听消息/审批/任务变化，驱动自动化
- **应用市场**：第三方应用接入（类似 Slack App Directory）
- **小程序**：在飞书内嵌业务应用

### larksuite/cli 架构

```
larksuite/cli（Go，2026-03 开源）
├── 18 业务域（Messenger/Docs/Base/Calendar/Mail/Meetings/Tasks/...）
├── 200+ 命令（三层：快捷命令 → API 命令 → 原始 API）
├── 26 个 AI Agent Skills（开箱即用，适配 MCP）
└── 结构化输出（JSON）
```

意义：把飞书能力**CLI 化 + Skill 化**，让 AI Agent 能像调用函数一样操作整个办公套件。例如：

> 「帮我把这个群里讨论的需求整理成文档，建一个多维表格跟踪，并在群里 @相关人」

这种跨应用的复合任务，CLI + Skill 让 LLM 能端到端完成。

## 钉钉 AI 能力深用

| AI 产品 | 能力 | 典型用法 |
|---|---|---|
| AI 听记 | 会议/录音转文字 + 摘要 | 会后自动出纪要、待办 |
| AI 表格 | 自然语言操作多维表格 | 「筛选本月高优 bug」一句话完成 |
| AI 搜问 | 跨应用知识检索 + 问答 | 「上次架构评审的结论是？」|
| 千问办公 | 通义千问驱动的写作/分析 | 起草方案、总结长文档 |
| 钉钉 A1 | 个人助理 | 日程管理、提醒、代办 |

钉钉的 AI 战略是**把 IM 作为 Agent 的入口**——2 亿月活的用户基数 + 通义千问，让 AI 落地到日常办公。

## 选型决策矩阵

| 你的场景 | 推荐工具 | 理由 |
|---|---|---|
| 跨国/英文 SaaS 团队 | **Slack** | 事实标准，App Directory 生态最全 |
| 开源社区 / Web3 / 创作者 | **Discord** | 社区导向，语音强，免费无限历史 |
| 国内互联网/技术团队 | **飞书** | 文档协作一体，larksuite/cli 可编程 |
| 国内传统企业/政企 | **钉钉** | 强管控合规，AI 听记/表格实用 |
| B2B 客户协作 | **Slack Connect** | 跨组织频道安全共享 |
| 游戏公会 / 兴趣小组 | **Discord** | 语音频道 + 角色权限 |
| 重度协作文档（中文）| **飞书** | Docs/Bitable/Wiki 一体 |
| 强考勤/审批/合规 | **钉钉** | 组织管理深度 |

**混合使用很常见**：例如技术团队用 Slack，国内商务用钉钉/飞书，开源社区用 Discord。关键是**明确每个工具的边界**，避免重复。

## IM 礼仪与异步协作最佳实践

### 异步优先原则

1. **默认异步**：能写清的不开会，能开会的不打电话
2. **写清上下文**：消息包含背景、问题、你的尝试、期望的回复——让对方一条看完就能回
3. **结构化表达**：长消息用列表/标题，避免一大段文字
4. **结论先行**：先说结论/请求，再说背景（BLUF - Bottom Line Up Front）

### 良好消息模板

```
【请求代码评审】
PR: https://github.com/org/repo/pull/123
影响：支付模块，新增退款流程
风险：改了订单状态机，需重点看状态流转
期望：今天 EOD 前能否过一遍？
```

vs 差的消息：「在吗？」（然后不说话）

### 决策落定

- 频道讨论出的决策，**回到文档/ADR 固化**，避免散落线程
- 重要结论 `📌 Pin` 到频道或转成 Wiki 条目
- 定期整理：把高频问题沉淀成 FAQ 文档

::: warning IM 不是知识库
聊天是易碎信息，决策必须二次沉淀到文档（飞书 Wiki / Notion / Confluence / ADR）。否则三个月后没人记得「当时为什么这么定」。
:::
