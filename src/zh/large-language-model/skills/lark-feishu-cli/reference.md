---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 larksuite/cli 官方仓库（MIT，2026 年）的 README 与 skills/ 编写。

## 速查

- **仓库**：[larksuite/cli](https://github.com/larksuite/cli)，npm `@larksuite/cli`
- **许可**：MIT（Copyright (c) 2026 Lark Technologies Pte. Ltd.）
- **Skills 数**：27 个（`skills/` 目录实际计数）
- **业务域**：约 18 类（消息/文档/云空间/表格/多维表格/日历/会议/妙记/邮箱/任务/知识库/通讯录/幻灯片/画板/OKR/审批/考勤/应用）
- **命令数**：200+（Shortcuts + API），Raw API 覆盖 2500+ 接口
- **认证**：`auth login/status/logout/check/scopes/list`
- **Profile**：`profile add/list/use/remove/rename`，`--profile` flag
- **辅助**：`config init`、`schema`、`whoami`、`help`

## 27 Skills 全表

| Skill | 覆盖 |
| --- | --- |
| `lark-shared` | 应用配置、auth 登录、身份切换、scope 管理、安全规则（其他 skill 自动加载） |
| `lark-calendar` | 日程创建/更新、agenda、忙闲查询、时间建议、找会议室、RSVP |
| `lark-im` | 发/回复消息、群管理、消息搜索、上传/下载图片文件、reactions |
| `lark-doc` | 创建/读取/更新/搜索文档（Markdown 基础） |
| `lark-drive` | 上传/下载文件、权限与评论管理 |
| `lark-markdown` | Drive 原生 `.md` 文件创建/读取/补丁/覆盖 |
| `lark-sheets` | 电子表格创建/读/写/追加/查找/导出 |
| `lark-slides` | 演示文稿创建/管理、读取内容、增删幻灯片 |
| `lark-base` | 多维表格：表/字段/记录/视图/仪表盘/聚合分析 |
| `lark-task` | 任务、任务清单、子任务、提醒、成员分配 |
| `lark-mail` | 浏览/搜索/读邮件、发/回复/转发、草稿、新邮件 watch |
| `lark-contact` | 按姓名/邮箱/手机号搜索用户、获取资料 |
| `lark-wiki` | 知识空间、节点、文档 |
| `lark-event` | 实时事件订阅（WebSocket）、正则路由、agent 友好格式 |
| `lark-vc` | 搜会议、查纪要（摘要/待办/转写） |
| `lark-whiteboard` | 画板/图表 DSL 渲染 |
| `lark-minutes` | 妙记元数据与 AI 产物；上传音视频生成妙记、下载媒体 |
| `lark-openapi-explorer` | 从官方文档探索底层 API |
| `lark-skill-maker` | 自定义 skill 创建框架 |
| `lark-attendance` | 查询个人考勤打卡记录 |
| `lark-approval` | 查询审批任务、同意/拒绝/转交/撤销/加签 |
| `lark-workflow-meeting-summary` | 工作流：会议纪要聚合与结构化报告 |
| `lark-workflow-standup-report` | 工作流：日程与待办聚合的站会报告 |
| `lark-okr` | OKR 查询/创建/更新，目标与关键结果、对齐、指标、进度 |
| `lark-note` | 笔记相关 |
| `lark-apps` | 创建 Spark/Miaoda 应用、发布 HTML/静态站、云生成、权限范围 |
| `lark-vc-agent` | 视频会议 agent 相关 |

> 实际 `skills/` 目录 27 个子目录；新版本可能增减，以仓库为准。

## 业务域能力速查

| 业务域 | 能力要点 |
| --- | --- |
| 日历 | 创建/更新日程、邀请、找会议室、忙闲、时间建议、RSVP |
| 消息群组 | 发/回复、群管理、历史与 thread、搜索、媒体下载 |
| 云文档 | 创建/读/更新/搜索，XML + Markdown |
| 云空间 | 上传/下载、权限、评论 |
| Markdown | Drive 原生 `.md` 文件 CRUD |
| 多维表格 | 表/字段/记录/视图/仪表盘/工作流/表单/角色权限/聚合 |
| 电子表格 | 创建/读写/追加/查找/导出 |
| 幻灯片 | 演示管理、读内容、增删幻灯片 |
| 任务 | 任务/清单/子任务/提醒/分配 |
| 知识库 | 空间/节点/文档 |
| 通讯录 | 搜索用户、获取资料 |
| 邮箱 | 浏览/搜索/读/发/回复/转发/草稿/watch |
| 视频会议 | 搜会议、查纪要 |
| 考勤 | 个人打卡记录 |
| 审批 | 查询/同意/拒绝/转交/撤销/加签 |
| OKR | OKR/目标/关键结果/对齐/指标/进度 |
| 画板 | DSL 渲染 |
| 应用 | Spark/Miaoda 应用、发布站、云生成、scope |

## 认证命令

| 命令 | 作用 |
| --- | --- |
| `auth login` | OAuth 登录（交互选 scope 或 CLI flag） |
| `auth login --recommend` | 自动选常用 scope |
| `auth login --domain <d>` | 按业务域过滤（`calendar,task` 等，可逗号或重复） |
| `auth login --scope "<s>"` | 指定单 scope |
| `auth login --no-wait` | Agent 模式：返回 URL 不阻塞 |
| `auth login --device-code <c>` | 后续轮询恢复 |
| `auth logout` | 退出并清凭据 |
| `auth status` | 当前登录态与 scope |
| `auth status --json --verify` | 校验 token 有效性 |
| `auth check` | 校验单 scope（exit 0=ok, 1=缺） |
| `auth scopes` | 列出全部可用 scope |
| `auth list` | 列全部已认证用户 |
| `whoami` | 当前生效身份 |

## 身份切换

```bash
lark-cli calendar +agenda --as user
lark-cli im +messages-send --as bot --chat-id "oc_xxx" --text "Hello"
```

- **user 身份**：访问个人资源（日历/云盘/邮箱），需 `auth login`
- **bot 身份**：应用级操作，看不到用户资源；只需后台 scope，**不要**对 bot 跑 `auth login`

## Profile 管理

```bash
lark-cli profile add              # 新建 profile（交互式）
lark-cli profile list             # 列出全部
lark-cli profile use <name>       # 切默认
lark-cli profile remove <name>    # 删除
lark-cli profile rename <old> <new>  # 改名

# 命令级临时指定
lark-cli --profile prod calendar +agenda
```

多 Profile 适合多租户/多环境（开发/生产/不同应用）并发使用，凭据互不干扰。

## 输出格式与契约

```bash
--format json      # 默认，完整 JSON
--format pretty    # 人友好
--format table     # 表格
--format ndjson    # 行分隔 JSON（管道）
--format csv       # CSV
```

**成功** → stdout，exit 0：

```json
{ "ok": true, "identity": "user", "data": { "guid": "..." }, "meta": { "count": 1 } }
```

**错误** → stderr，非 0：

```json
{ "ok": false, "identity": "user", "error": { "type": "api", "code": 99991679, "message": "...", "hint": "..." } }
```

> 判断成功看 `ok == true` 或 exit code，**不要**看 `code == 0`——成功响应无 `code`/`msg` 字段。

## 分页与 Dry Run

```bash
--page-all              # 自动翻全部页
--page-limit 5          # 最多 5 页
--page-delay 500        # 页间 500ms

lark-cli im +messages-send --chat-id oc_xxx --text "hi" --dry-run  # 预览请求
```

## Schema 内省

```bash
lark-cli schema                          # 全部
lark-cli schema calendar.events.instance_view
lark-cli schema im.messages.delete
```

## 目录结构

```text
cli/
├── skills/                       # 27 个 skill 子目录
│   ├── lark-shared/SKILL.md      # 共享规则（其他 skill 自动加载）
│   ├── lark-doc/SKILL.md
│   ├── lark-base/SKILL.md
│   └── ...
├── cmd/                          # CLI 命令实现（Go）
├── shortcuts/                    # Shortcuts（+ 前缀）
├── sidecar/                      # 凭据 sidecar
├── internal/                     # 内部实现
├── README.md / README.zh.md
└── LICENSE                       # MIT
```

## 资源链接

- 仓库：[larksuite/cli](https://github.com/larksuite/cli)
- npm：[@larksuite/cli](https://www.npmjs.com/package/@larksuite/cli)
- 飞书开放平台：[open.feishu.cn](https://open.feishu.cn/)
- Lark 国际版：[larksuite.com](https://www.larksuite.com/)
- Meegle 独立 CLI：[larksuite/meegle-cli](https://github.com/larksuite/meegle-cli)
- 相关叶：[Skills CLI 与 find-skills](../skills-cli-find-skills/) · [Vercel Agent Skills](../vercel-agent-skills/)
