---
layout: doc
---

# Lark / 飞书 CLI Skills

Lark / 飞书 CLI Skills（`larksuite/cli`，npm 包 `@larksuite/cli`）是**飞书官方**出品的 CLI 工具与配套 AI Agent 技能集，MIT 开源。定位「给 AI Agent 操作飞书的双手」——装上后 Agent 可读消息、查日历、写文档、建多维表格、搜知识库、发邮件，直接在飞书里把事办了。覆盖消息群组、云文档、云空间、电子表格、多维表格、日历、视频会议、妙记、邮箱、任务、知识库、通讯录、幻灯片、画板、OKR、审批、考勤等核心业务域，提供 200+ 命令与 27 个 AI Agent Skills。兼容 Claude Code / TRAE / Cursor / Codex 等主流 agent 工具，支持国际版 Lark 与国内飞书。OpenClaw 飞书官方插件底层即基于它。

## 评价

**优点**

- **官方沉淀**：飞书官方 `larksuite` 团队出品、MIT 许可，命令与 OpenAPI 同源、覆盖 2500+ 接口
- **Agent 原生设计**：每个命令都用真实 Agent 测过，参数简洁、智能默认值、结构化输出，最大化 Agent 调用成功率
- **三层命令架构**：Shortcuts（`+` 前缀，人/Agent 友好）→ API 命令（100+ 平台同步）→ Raw API（2500+ 全覆盖），按粒度选
- **身份清晰**：`--as user`（用户身份，访问个人日历/消息/文档并以你名义操作）与 `--as bot`（应用身份，可发消息/建文档但不能访问个人数据）一键切换
- **多 Profile 并发安全**：`--profile` flag + `profile add/list/use`，可同时挂多套应用凭据
- **安全可控**：输入注入防护、终端输出脱敏、OS 原生 keychain 凭据存储，多层默认保护

**缺点 / 边界**

- **权限模型两层叠加**：user 身份既要后台开通 scope 又要用户 `auth login` 授权，缺一不可；首次上手有学习曲线
- **个人资源敏感**：授权后 agent 以你的用户身份在飞书操作，敏感数据/越权风险需谨慎，官方建议当**私人助手**用、不拉群
- **国际版 / 国内版差异**：国际版 Lark 与国内飞书域名/接入流程略有不同，需在 `config init` 时选对
- **Project（Meegle）独立**：项目管理走独立的 [meegle-cli](https://github.com/larksuite/meegle-cli)，需另装

## 适用场景

- 让 Agent 帮你查日历、约会议、找会议室（calendar）
- 用一句话读飞书文档、写文档、导入导出（docs / markdown / drive）
- 自动化处理多维表格与电子表格数据（base / sheets）
- 会议结束自动出纪要、待办、转写（vc / minutes / workflow-meeting-summary）
- 跨时区约会、邮件分类、知识库检索等跨域工作流

## 边界

- **不是单个技能，是官方技能集**：27 个 skill 各有触发条件与前置必读，按业务域激活
- **个人数据需 user 身份**：bot 看不到用户日历/邮箱/云盘；私人资源必须 `auth login`
- **默认安全设置勿轻易放开**：放宽注入/输出保护会显著放大风险，后果自负
- **机器人当私人助手用**：建议不拉群、不让他人交互，避免权限滥用或数据泄露

## 官方文档

[Lark/Feishu CLI · larksuite/cli](https://github.com/larksuite/cli) ｜ [npm: @larksuite/cli](https://www.npmjs.com/package/@larksuite/cli) ｜ [飞书开放平台](https://open.feishu.cn/)

## GitHub 地址

[larksuite/cli](https://github.com/larksuite/cli)（MIT，Copyright (c) 2026 Lark Technologies Pte. Ltd.）

## 内容地图

- [入门](./getting-started) —— 定位、安装（`npx @larksuite/cli install`）、认证（user vs bot）、业务域总览
- [指南](./guide-line) —— 核心业务域（云文档/多维表格/日历约会/邮箱/妙记/IM/任务/OKR/审批）+ 多 Profile + 工作流场景 + 反模式
- [参考](./reference) —— 27 skill 全表 + 业务域能力 + 认证命令 + profile 管理 + 许可

## 幻灯片地址

<a href="/SlideStack/lark-feishu-cli-slide/" target="_blank">Lark / 飞书 CLI Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=663" target="_blank" rel="noopener noreferrer">Lark / 飞书 CLI Skills 测试题</a>

