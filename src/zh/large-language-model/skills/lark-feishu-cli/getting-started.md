---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 larksuite/cli 官方仓库（MIT，2026 年）的 README 与 skills/ 编写。

## 速查

- **是什么**：飞书官方 `larksuite/cli` CLI + 27 个 AI Agent Skills，给 Agent 操作飞书的双手
- **装**：`npx @larksuite/cli@latest install`（兼容 Claude Code / TRAE / Cursor / Codex）
- **首次配置**：`lark-cli config init` → `lark-cli auth login --recommend` → `lark-cli auth status`
- **两种身份**：`--as user`（访问个人资源，需 `auth login`）· `--as bot`（应用身份，只需后台 scope）
- **业务域**：消息群组 / 云文档 / 云空间 / 电子表格 / 多维表格 / 日历 / 视频会议 / 妙记 / 邮箱 / 任务 / 知识库 / 通讯录 / 幻灯片 / 画板 / OKR / 审批 / 考勤 / 应用，约 18 类
- **三层命令**：Shortcuts（`+` 前缀）→ API 命令（100+）→ Raw API（2500+ 接口）
- **国际版**：支持国际版 Lark 与国内飞书，`config init` 时选对应域名

## 定位：给 Agent 操作飞书的双手

`larksuite/cli` 是飞书官方出品的 CLI 工具，把飞书 OpenAPI 的 2500+ 接口打包成 agent 友好的命令，再封装成 27 个按业务域划分的 Skills。装上后，AI Agent（Claude Code、Cursor、TRAE、Codex）就能：

- 读你的飞书消息、日历、文档、邮件
- 帮你发消息、约会议、建文档、写表格
- 跨多个业务域串工作流（会议 → 纪要 → 待办 → 邮件）

OpenClaw 飞书官方插件底层即基于它。MIT 许可、零门槛使用。

## 安装

任选一种方式：

```bash
# 方式一：npm（推荐）
npx @larksuite/cli@latest install

# 方式二：源码（需 Go 1.23+ 与 Python 3）
git clone https://github.com/larksuite/cli.git
cd cli
make install
npx skills add larksuite/cli -y -g
```

## 配置与登录

```bash
# 1. 配置应用凭据（一次性，交互式引导）
lark-cli config init

# 2. 登录（--recommend 自动选常用 scope）
lark-cli auth login --recommend

# 3. 验证
lark-cli auth status
```

Agent 模式下，`config init` 与 `auth login` 都会输出授权 URL，agent 提取后转交用户在浏览器完成；命令在用户操作完成后自动退出。

## 认证：用户身份 vs 应用身份

| 身份 | 标识 | 获取方式 | 适用 |
| --- | --- | --- | --- |
| **user 用户身份** | `--as user` | `lark-cli auth login` 授权 | 访问个人日历/邮箱/云盘/消息等 |
| **bot 应用身份** | `--as bot` | 自动（appId + appSecret） | 应用级操作，看不到用户个人资源 |

切换：`lark-cli calendar +agenda --as user` / `lark-cli im +messages-send --as bot ...`

**关键差异**：

- Bot 看不到用户资源（日历/云空间/邮箱）
- Bot 权限只需后台开通 scope；user 身份需后台 scope + 用户授权，**两层都要满足**
- 缺 scope 时看错误里的 `missing_scopes`、`console_url`、`hint`，**不要对 bot 执行 `auth login`**

## 业务域总览（约 18 类）

| 业务域 | 主要能力 |
| --- | --- |
| 📅 日历 | 查看/创建/更新日程、邀请、找会议室、RSVP、忙闲与时间建议 |
| 💬 消息群组 | 发/回复消息、群管理、历史与 thread、消息搜索、媒体下载 |
| 📄 云文档 | 创建/读取/更新/搜索文档（基于 Markdown） |
| 📁 云空间 | 上传/下载文件、权限与评论管理 |
| 📝 Markdown | Drive 原生 `.md` 文件创建/读取/补丁/覆盖 |
| 📊 多维表格 | 表/字段/记录/视图/仪表盘/工作流/表单/角色权限/聚合分析 |
| 📈 电子表格 | 创建/读/写/追加/查找/导出表格数据 |
| 🖼️ 幻灯片 | 创建/管理演示、读取内容、增删幻灯片 |
| ✅ 任务 | 创建/查询/更新/完成任务，子任务、提醒、成员分配 |
| 📚 知识库 | 知识空间/节点/文档管理 |
| 👤 通讯录 | 按姓名/邮箱/手机号搜索用户、获取资料 |
| 📧 邮箱 | 浏览/搜索/读邮件、发/回复/转发、草稿、新邮件 watch |
| 🎥 视频会议 | 搜索会议、查询纪要（摘要/待办/转写） |
| 🕐 考勤 | 查询个人打卡记录 |
| ✍️ 审批 | 查询审批任务、同意/拒绝/转交/撤销/加签 |
| 🎯 OKR | OKR 的查询/创建/更新，目标与关键结果、对齐、指标与进度 |
| 🎨 画板 | 画板/图表 DSL 渲染 |
| 🔗 应用 | 创建 Spark/Miaoda 应用、发布 HTML/静态站、云生成与权限范围 |

## 三层命令系统

```bash
# 1. Shortcuts（+ 前缀，人/Agent 友好，智能默认 + 表格输出 + dry-run）
lark-cli calendar +agenda
lark-cli im +messages-send --chat-id "oc_xxx" --text "Hello"

# 2. API 命令（100+，1:1 映射平台端点）
lark-cli calendar calendars list

# 3. Raw API（2500+ 接口全覆盖）
lark-cli api GET /open-apis/calendar/v4/calendars
```

辅助：`lark-cli schema` 看任意接口的参数/响应/身份/scope，`lark-cli <service> --help` 看全部 shortcuts。

## 下一步

- [指南](./guide-line) —— 核心业务域实战、多 Profile、工作流场景、反模式
- [参考](./reference) —— 27 skill 全表 + 认证/profile 命令 + 许可
