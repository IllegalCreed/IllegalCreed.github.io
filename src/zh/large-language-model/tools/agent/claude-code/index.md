---
layout: doc
---

# Claude Code

Anthropic 官方的 AI 编码助手 CLI / IDE 扩展 / Web App，以「**Agent in your terminal**」为定位——把 Claude 模型放进真实开发环境里读写文件、运行命令、调 MCP、执行长任务。与单纯的对话框界面（claude.ai）相比，Claude Code 直接接管 shell + 文件系统 + Git，是 AI 写代码的「事实标准方案」之一。

## 评价

**优点**

- 与 Anthropic 自家模型深度集成，Opus / Sonnet / Haiku 一键切换，可显式选 1M 上下文版本
- 内置文件操作 / 命令执行 / 浏览器 MCP / Git 整合，覆盖端到端开发流程，无需手动复制粘贴代码
- **Skill 机制**：用户可自定义可复用的指令包（`/<skill-name>` 触发），社区已有 superpowers / cypress-skill 等生态
- **Hooks 机制**：在 tool 调用前/后注入自定义脚本（如 lint / 通知 / 审计）
- **MCP 一类支持**：Brave Search / Chrome DevTools / Context7 / 自家 MCP server 都能直接接入
- 子代理（Agent）系统：spawn Explore / general-purpose / 自定义 subagent 并行处理大任务
- 持久化 Memory：跨会话的用户偏好 / 项目知识 / 反馈 自动累积
- 多模态：终端粘图 + 文件读图 + PDF / 截图 都能识别
- 同时提供 CLI / VS Code 扩展 / JetBrains 扩展 / Web (claude.ai/code)

**缺点**

- 闭源，仅运行在 Anthropic 服务上（不能私有部署）
- 价格按 token 计费（Pro / Max / API 三档），重度用户成本不低
- 中国大陆访问需自备网络（无国内代理）
- 学习曲线偏陡：hooks / skills / MCP / subagents 等高级特性文档分散
- Web 版功能少于 CLI（部分 hook / MCP 仅 CLI 可用）

## 文档地址

[Claude Code](https://docs.claude.com/en/docs/claude-code/overview)

## GitHub 地址

[anthropics/claude-code](https://github.com/anthropics/claude-code)（CLI 主仓）/ [anthropics/claude-code-sdk-python](https://github.com/anthropics/claude-code-sdk-python)（Agent SDK）

## 幻灯片地址

<a href="/SlideStack/claude-code-slide/" target="_blank">Claude Code</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=claude-code" target="_blank" rel="noopener noreferrer">Claude Code 测试题</a>
