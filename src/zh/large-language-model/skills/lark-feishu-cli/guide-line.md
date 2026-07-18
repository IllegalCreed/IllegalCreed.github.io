---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 larksuite/cli 官方仓库（MIT，2026 年）的 README 与各 skills/ 编写。

## 速查

- **核心域**：云文档（docs）· 多维表格（base）· 日历约会（calendar）· 邮箱（mail）· 妙记（minutes）· IM · 任务（task）· OKR · 审批（approval）
- **文档读写**：`lark-cli docs +fetch/+create/+update`，XML 优先（精准编辑）/ Markdown（导入场景）
- **多维表格**：表/字段/记录/视图/仪表盘/工作流/表单/角色权限
- **约会议**：`calendar +agenda` 看日程，`auth login --domain calendar` 授权后创建/邀请/找会议室
- **身份切换**：`--as user`（个人资源）/ `--as bot`（应用级），bot 看不到用户资源
- **多 Profile**：`profile add/list/use` + `--profile` flag，并发安全
- **工作流**：会后纪要聚合（workflow-meeting-summary）、站会报告（workflow-standup-report）、跨时区约会、邮件分类
- **反模式**：bot 缺 scope 跑 `auth login`、未读 SKILL.md 就操作、放宽默认安全设置

## 云文档（lark-doc / lark-markdown / lark-drive）

```bash
# 读取（默认 simple；URL 含 #share- 锚点优先按锚点读）
lark-cli docs +fetch --doc "文档URL或token"

# 创建（XML 默认；用户提供 .md 文件时直接用 Markdown）
lark-cli docs +create --content '<title>标题</title><p>内容</p>'

# 精准编辑（str_replace / block_insert_after / block_replace / block_delete）
lark-cli docs +update --doc "token" --command str_replace --content '<block ...>'

# 复制文档 → 切到 lark-drive 用 drive files copy，不要 fetch+create 重建
```

**格式选择**：创建/导入场景 XML 或 Markdown 都可；**精准编辑优先 XML**（稳定表达 block 结构与样式）。文档里嵌入的 `<sheet>`/`<bitable>` 标签要主动提取 token 切到对应 skill 下钻。

## 多维表格（lark-base）

覆盖表、字段、记录、视图、仪表盘、工作流、表单、角色与权限、数据聚合与分析。常用：

```bash
lark-cli base +records-list   # 列记录
lark-cli base +record-create  # 新建记录
lark-cli base +record-update  # 更新记录
```

适合自动化数据收集（表单 → 记录）、批量更新、跨表聚合分析、按角色授权。

## 日历约会（lark-calendar）

```bash
lark-cli calendar +agenda                          # 今日日程
lark-cli calendar +events-create --summary "周会" \
  --start-time "1700000000" --end-time "1700003600"
# 忙闲查询、时间建议、找会议室、RSVP 回复
```

身份选 `--as user`（看你的日历）；首次需 `auth login --domain calendar`。配合 contact 可按邮箱/手机号查人邀请。

## 邮箱（lark-mail）

浏览、搜索、读邮件、发/回复/转发、草稿管理、新邮件 watch。典型用途：

- 自动分类收件箱（按规则归档/打标）
- watch 新邮件触发 agent 处理后回复
- 跨邮件聚合做摘要、待办提取

## 妙记与会议（lark-vc / lark-minutes / lark-workflow-meeting-summary）

- `lark-vc`：搜会议、查纪要（摘要/待办/转写）
- `lark-minutes`：妙记元数据与 AI 产物（摘要/待办/章节），上传音视频生成妙记、下载媒体
- `lark-workflow-meeting-summary`：**工作流**——把会议纪要聚合成结构化报告
- `lark-workflow-standup-report`：**工作流**——日程与待办聚合，生成站会报告

适合「会议结束 → 自动出纪要 → 抽待办 → 派任务 → 邮件汇报」的闭环。

## IM、任务、OKR、审批

- **IM（lark-im）**：发/回复消息、群管理、消息搜索、上传下载图片文件、reactions
- **任务（lark-task）**：任务/任务清单/子任务/提醒/成员分配
- **OKR（lark-okr）**：OKR 查询/创建/更新，目标与关键结果、对齐、指标、进度
- **审批（lark-approval）**：查询审批任务、同意/拒绝/转交/撤销/加签

## 多 Profile 并发

`lark-cli profile add/list/use/remove/rename` 管理多套应用凭据，每条命令可用 `--profile` 指定使用哪一套——同一台机器并发跑多租户/多环境时安全互不干扰。`profile use` 切默认 profile，缺活动 profile 时会提示 `lark-cli profile use <name>`。

## 工作流场景

| 场景 | 串联 |
| --- | --- |
| **会后待办闭环** | vc 查纪要 → minutes 抽待办 → task 派任务 → im 群里通知 |
| **人机共创文档** | docs +create 起草 → 用户改 → docs +update str_replace 精修 → drive 分享 |
| **跨时区约会** | calendar 查忙闲 → contact 找人 → calendar +events-create 自动选时间 |
| **会议分析** | workflow-meeting-summary 聚合 → base 落表 → sheets 导出 |
| **邮件分类** | mail watch → agent 分类 → 打标/归档 → 重要 mail 回复 |

## 反模式（避坑）

- ❌ **bot 缺 scope 跑 `auth login`**：bot 只需后台开通 scope，**不要**对 bot 跑 `auth login`，引导用户去 `console_url` 开权限
- ❌ **未读 SKILL.md 就操作**：每个 skill 的 `references/` 是必读，不读会参数/格式错误
- ❌ **用 fetch+create 重建文档做复制**：应切到 `drive files copy`
- ❌ **覆盖默认安全设置**：放宽注入/输出保护会显著放大风险
- ❌ **把机器人拉进群当公共助手**：官方明确建议当**私人助手**用，避免他人触发越权
- ❌ **判断成功看 `code == 0`**：CLI 成功响应无 `code`/`msg` 字段，应看 `ok == true` 或 exit code

## 下一步

- [参考](./reference) —— 27 skill 全表 + 业务域能力 + 认证/profile 命令 + 许可
- 上游：[larksuite/cli](https://github.com/larksuite/cli)
