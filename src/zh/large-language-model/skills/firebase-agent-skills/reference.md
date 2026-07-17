---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 firebase/agent-skills 官方仓库（Apache-2.0）README 与 skills/ 编写。

## 速查

- **装**：`npx skills add firebase/agent-skills`
- **11 技能**：basics / auth-basics / firestore / hosting-basics / app-hosting-basics / ai-logic-basics / data-connect-basics / crashlytics / remote-config-basics / security-rules-auditor / xcode-project-setup
- **每技能**：`SKILL.md`（必，含 frontmatter `description` 的「Use when…」）+ 可选 `references/` + `scripts/`
- **CLI**：一律 `npx -y firebase-tools@latest`
- **AI**：AI Logic（Gemini）+ Genkit（`npx skills add genkit-ai/skills`，dart/go/js）
- **许可**：Apache-2.0 ｜ **出品**：Firebase（Google）官方

## 11 技能全表

| 技能 | 触发（Use when…） | 覆盖 |
| --- | --- | --- |
| `firebase-basics` | 检查 CLI 版本、初始化、认证、设活动项目、拉配置文件 | 套件入口、`npx` 原则、优先官方知识、MCP 工具、`apps:sdkconfig` |
| `firebase-auth-basics` | app 需登录/用户管理/按 auth 规则安全访问 | 用户/提供商/令牌、`firebase.json` auth 块、`deploy --only auth` |
| `firebase-firestore` | 用 Firestore（列/建库、规则、模型、查询、索引） | 先识别 edition、STANDARD/Enterprise、全文搜索/join |
| `firebase-hosting-basics` | 部署静态站/SPA/简单微服务 | Classic Hosting、CDN、零配置 SSL、预览通道、GitHub Actions |
| `firebase-app-hosting-basics` | 部署带后端的 Next.js/Angular | App Hosting、SSR/ISR、git push to deploy、需 Blaze |
| `firebase-ai-logic-basics` | 给 Web/移动端加 Gemini | 多模态/流式/结构化输出/Nano Banana、`init ailogic`、App Check |
| `firebase-data-connect-basics` | 要关系型数据库 / 提到 SQL Connect | PostgreSQL + GraphQL、类型安全 SDK、`@auth`、向量/全文/事务 |
| `firebase-crashlytics` | 加崩溃报告 | Android/iOS、自定义键/日志/用户标识/非致命异常、MCP 读数据 |
| `firebase-remote-config-basics` | 功能标志/动态改 app 行为 | 云端模板、加载策略、实时监听、`remoteconfig:get/deploy` |
| `firebase-security-rules-auditor` | Firestore 规则更新后审安全 | 红队清单、1–5 评分、`{score, summary, findings}` JSON |
| `xcode-project-setup` | iOS 工程加依赖（Firebase 等 SPM） | 安全改 `.pbxproj`、禁 Ruby、文件夹同步、Firebase `-ObjC` |

## 安装矩阵

| 方式 | 命令 |
| --- | --- |
| Agent Skills CLI | `npx skills add firebase/agent-skills` |
| Gemini CLI 扩展 | `gemini extensions install https://github.com/firebase/agent-skills` |
| Claude 插件 | `claude plugin marketplace add firebase/agent-skills` + `claude plugin install firebase@firebase` |
| Codex 插件 | `codex plugin marketplace add firebase/agent-skills` + `codex plugin add firebase@firebase` |
| 手动 | `git clone` 后拷 `skills/` 到 agent 约定位置（Cursor `.cursor/rules/` 等） |
| 本地路径 | `npx skills add /path/to/agent-skills/skills` |
| 更新 | `npx skills experimental_install` |

> README 内所有安装命令写作 `firebase/skills`；仓库规范地址是 `github.com/firebase/agent-skills`，GitHub 重定向使两者等效。

## 常用 CLI 命令

```bash
# 基础
npx -y firebase-tools@latest --version
npx -y firebase-tools@latest login          # 无浏览器加 --no-localhost
npx -y firebase-tools@latest use <PROJECT_ID>
npx -y firebase-tools@latest apps:sdkconfig ANDROID <APP_ID> --project <PROJECT_ID>

# 认证 / Firestore / AI Logic / SQL Connect
npx -y firebase-tools@latest deploy --only auth
npx -y firebase-tools@latest firestore:databases:list
npx -y firebase-tools@latest init ailogic
npx -y firebase-tools@latest dataconnect:sdk:generate

# Hosting / Remote Config
npx -y firebase-tools@latest emulators:start --only hosting
npx -y firebase-tools@latest remoteconfig:get -o remote_config.json
npx -y firebase-tools@latest deploy --only remoteconfig
```

## Genkit：独立但相关

`firebase-basics` 明确引导：**若用 Genkit，装它自己的技能集**——

```bash
npx skills add genkit-ai/skills
```

Genkit 是 Firebase 的开源 AI 框架，SDK 覆盖 **dart / go / js**，用于比 AI Logic 更复杂的 AI 编排（多步、工具、流程）。它与 `firebase-ai-logic-basics`（客户端直连 Gemini）互补，属独立仓库 `genkit-ai/skills`。

## Firebase MCP Server

技能反复强调「用 Firebase MCP Server 工具，而非直接 API 调用」：

- `firebase_get_environment`——先了解当前连接的项目环境
- `firebase_read_resources`——读任意 `firebase://` URL
- `developerknowledge_search_documents`——查官方 Firebase 知识（比 Google 搜索/内部记忆优先）
- 命令：`/firebase:init`（加认证/数据库/GenAI）、`/firebase:deploy`（部署 web 应用）
- 启动：`npx -y firebase-tools@latest mcp`

## 每技能目录结构

```text
skills/
├── firebase-basics/
│   ├── SKILL.md          # 必需：frontmatter description + 工作流
│   ├── references/       # 可选：深度文档（按平台/环境）
│   └── scripts/          # 可选：辅助脚本
├── firebase-auth-basics/SKILL.md
├── firebase-ai-logic-basics/SKILL.md
├── firebase-data-connect-basics/
│   ├── SKILL.md
│   ├── reference/        # schema/operations/security/realtime…
│   ├── examples.md
│   └── templates.md
├── firebase-security-rules-auditor/SKILL.md
└── xcode-project-setup/
    ├── SKILL.md
    └── scripts/xcode_spm_setup/   # Swift 包
```

## 计费提醒（需 Blaze）

- Firebase App Hosting
- Vertex AI Gemini API（AI Logic 的企业 provider）
- Nano Banana 图像生成

## 资源链接

- 仓库：[firebase/agent-skills](https://github.com/firebase/agent-skills)（Apache-2.0）
- Firebase 文档：[firebase.google.com/docs](https://firebase.google.com/docs)
- AI Logic 入门：[firebase.google.com/docs/ai-logic/get-started](https://firebase.google.com/docs/ai-logic/get-started)
- Agent Skills 格式：[agentskills.io](https://agentskills.io/home)
- Genkit 技能：`genkit-ai/skills`
- 相关叶：[Supabase Agent Skills](../supabase-agent-skills/) · [Agent Skills 规范](../agent-skills-spec/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/)

## 下一步

- 回到 [入门](./getting-started) 或 [指南](./guide-line)
- 上游：[Firebase 文档](https://firebase.google.com/docs)
