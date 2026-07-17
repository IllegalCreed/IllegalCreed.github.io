---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 firebase/agent-skills 官方仓库（Apache-2.0）的 README 与 skills/ 目录编写（2026-07）。

## 速查

- **是什么**：Firebase（Google）官方的 AI agent 技能集，遵 agentskills.io 格式，Apache-2.0
- **装**：`npx skills add firebase/agent-skills`（README 亦写作 `firebase/skills`，GitHub 会重定向到 agent-skills）
- **跨 agent**：Claude Code / Cursor / Codex / Gemini CLI / Antigravity / Android Studio / GitHub Copilot
- **11 技能**：`firebase-basics`（入口）·`firebase-auth-basics`·`firebase-firestore`·`firebase-hosting-basics`·`firebase-app-hosting-basics`·`firebase-ai-logic-basics`·`firebase-data-connect-basics`·`firebase-crashlytics`·`firebase-remote-config-basics`·`firebase-security-rules-auditor`·`xcode-project-setup`
- **CLI 铁律**：一律 `npx -y firebase-tools@latest`，永远最新版，绝不用裸 `firebase`
- **AI**：`firebase-ai-logic-basics` 调 Gemini；需要 Genkit 时再 `npx skills add genkit-ai/skills`（dart/go/js）
- **触发**：装后任务匹配自动激活，也可自然语言显式说「帮我给 app 加 Firebase 认证」

## 定位

Firebase Agent Skills 解决一个具体痛点：agent 对 Firebase 的「内部记忆」经常过时或含糊（用了已下线的模型名、建议裸 `firebase` 命令、写出不安全的 Firestore 规则）。这组技能把 Firebase 官方的**约定俗成工作流（CUJ）、安全规则、最佳实践**写成 agent 可读的指令，让 agent「照官方来」而非「凭印象猜」。

它遵循 [agentskills.io](https://agentskills.io/home) 的 Agent Skills 开放格式：每个技能是一个含 `SKILL.md` 的目录，frontmatter 里的 `description` 写明「Use when…」触发条件，正文是工作流，`references/` 放深度文档、`scripts/` 放辅助脚本。

## 安装

最常用的是 Agent Skills CLI：

```bash
npx skills add firebase/agent-skills
```

也支持多种 agent 环境（均出自官方 README）：

```bash
# Gemini CLI 扩展
gemini extensions install https://github.com/firebase/agent-skills

# Claude 插件
claude plugin marketplace add firebase/agent-skills
claude plugin install firebase@firebase

# Codex 插件
codex plugin marketplace add firebase/agent-skills
codex plugin add firebase@firebase

# 手动：克隆后把 skills/ 拷到 agent 约定位置（Cursor .cursor/rules/ 等）
git clone https://github.com/firebase/agent-skills.git
```

> README 里的安装命令写作 `firebase/skills`，而仓库的规范地址是 `github.com/firebase/agent-skills`——GitHub 会把旧短名重定向过去，两者都能装。

装好后技能自动可用：agent 检测到相关任务（如「初始化 Firebase」「加 Firestore」）时自动激活，也可用自然语言显式触发。

## 11 个技能总览

| 技能 | 何时用 | 一句话 |
| --- | --- | --- |
| `firebase-basics` | 任何 Firebase 任务的**起点** | CLI 版本检查、登录、设活动项目、拉配置文件；套件入口 |
| `firebase-auth-basics` | app 需要登录/用户管理 | 邮箱密码/Google/匿名等，ID Token(JWT) + Refresh Token |
| `firebase-firestore` | 用 Firestore | 先识别 edition（STANDARD/Enterprise），规则/模型/索引/搜索 |
| `firebase-hosting-basics` | 部署静态站/SPA/微服务 | Classic Hosting，CDN + 零配置 SSL + 预览通道 |
| `firebase-app-hosting-basics` | 部署 Next.js/Angular（SSR） | App Hosting，git push to deploy，需 Blaze |
| `firebase-ai-logic-basics` | 客户端加 Gemini AI | 无需专用后端，多模态/流式/结构化输出/出图 |
| `firebase-data-connect-basics` | 要关系型数据库 | SQL Connect（PostgreSQL + GraphQL + 类型安全 SDK） |
| `firebase-crashlytics` | 崩溃报告 | Android/iOS，自定义键/日志/非致命异常 |
| `firebase-remote-config-basics` | 功能标志/动态改 app | 云端配置模板，无需发版 |
| `firebase-security-rules-auditor` | 审 Firestore 安全规则 | 红队视角找漏洞，1–5 评分产 JSON |
| `xcode-project-setup` | iOS 项目加 Firebase SPM | 安全改 .pbxproj，禁 Ruby，Firebase 需 `-ObjC` |

## firebase-basics：一切的起点

`firebase-basics` 是套件入口——如果你的环境里只装了它，它会引导你按 agent 环境（Gemini CLI / Antigravity / Claude Code / Cursor…）装齐全套技能。它定义了几条**贯穿所有技能的原则**：

1. **CLI 一律 `npx`**：用 `npx -y firebase-tools@latest <cmd>` 永远拉最新版，**绝不**建议裸 `firebase`
2. **优先官方知识**：查 Firebase 知识先用 `developerknowledge_search_documents` MCP 工具，再退回搜索/内部记忆
3. **用 MCP Server 工具而非直接 API**：读 Crashlytics 日志、跑 Data Connect 查询等，用 Firebase MCP Server 提供的工具
4. **自动化拉配置**：不让用户去 Console 下 `google-services.json` / `GoogleService-Info.plist`，用 `apps:sdkconfig` 程序化获取

```bash
npx -y firebase-tools@latest --version        # 检查 CLI
npx -y firebase-tools@latest login             # 登录（无浏览器加 --no-localhost）
npx -y firebase-tools@latest use <PROJECT_ID>  # 设活动项目
```

## 下一步

- [指南](./guide-line) —— 各技能分组深入（auth/firestore/ai-logic/data-connect/security-rules-auditor…）+ 反模式
- [参考](./reference) —— 11 技能清单表 + 安装矩阵 + Genkit + Firebase MCP Server + 许可与链接
