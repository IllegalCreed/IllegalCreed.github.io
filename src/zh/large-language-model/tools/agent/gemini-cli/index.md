---
layout: doc
---

# Gemini CLI

Google 官方推出的开源 AI 编码 Agent —— 把 Gemini 模型放进终端，读写文件 / 跑命令 / 调 MCP / 联网搜索一应俱全。仓库 [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) 截至 2026 年 5 月已超 10 万 star，Apache 2.0 协议，可自由 fork / 二次开发。最大卖点是「**业界最慷慨的免费额度**」—— 用个人 Google 账号登录即可享 60 RPM + 1000 RPD 的 Gemini 3 Pro 调用，且默认上 1M token 上下文。

## 评价

**优点**

- **完全开源（Apache 2.0）**：可二次开发 / 自部署 / 审计代码，与 Claude Code / Codex 闭源形成鲜明对比
- **超慷慨免费额度**：Google OAuth 登录直接 60 RPM + 1000 RPD，Gemini 3 Pro + 1M 上下文不另收钱
- **1M token 上下文**：Gemini 2.5+ / Gemini 3 全系标配 1M context window，整本中型仓库直接塞进去
- **内置 Google Search grounding**：联网搜索是 Google 老本行，answer 自带可溯源 citation
- **一类 MCP 支持**：可装任意 MCP server（GitHub / Postgres / 浏览器自动化等）
- **Plan Mode + 自动模型路由**：规划阶段走 Pro（高推理），实施阶段切 Flash（高速）省时省费
- **Skills 机制**：与 Claude Code 对齐的 `~/.gemini/skills/<name>/SKILL.md` + `activate_skill` 工具
- **Hooks 11 个生命周期事件**：BeforeTool / AfterTool / SessionStart 等，可编程性强于 Codex
- **Extensions 生态**：`gemini extensions install <github-url>` 一键装社区扩展
- **Checkpointing + /restore**：每次工具修改前自动 shadow Git 快照，随时回滚
- **沙箱（Docker / Podman / macOS Seatbelt）**：高风险任务隔离执行

**缺点**

- **国内访问需自备网络**：Google API 国内不可达，Gemini API key / OAuth 都需要代理
- **官方文档结构较散**：reference 折叠到 docs/reference/，部分概念多处提及但版本演进快
- **生态仍在追赶 Claude Code**：Skills / Hooks 是后来者，Anthropic 系社区 skill 数量更多
- **Workspace 账号需绑 GCP project**：免费个人账号无需，但企业 / 学校账号要先建 Cloud Project
- **YOLO 模式安全风险**：`--yolo` 全自动绕过审批，与 Claude Code `bypassPermissions` 同样需谨慎

## 文档地址

[Gemini CLI Docs](https://google-gemini.github.io/gemini-cli/docs/) / [Google Cloud Code Assist 集成](https://cloud.google.com/gemini/docs/codeassist/gemini-cli)

## GitHub 地址

[google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)（主仓，Apache 2.0）

## 推荐资源

- 官方扩展画廊：[geminicli.com/extensions](https://geminicli.com/extensions/browse/)
- 官方 GitHub Action 集成：[google-gemini/gemini-cli-action](https://github.com/google-github-actions/run-gemini-cli)
- MCP 协议官网：[modelcontextprotocol.io](https://modelcontextprotocol.io/)
- AI Studio（API key 获取）：[aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Google AI for Developers：[ai.google.dev](https://ai.google.dev)

## 幻灯片地址

<a href="/SlideStack/gemini-cli-slide/" target="_blank">Gemini CLI</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=gemini-cli" target="_blank" rel="noopener noreferrer">Gemini CLI 测试题</a>
