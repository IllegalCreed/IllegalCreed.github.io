---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 vercel/ai 官方 AI SDK 技能（仓库 `skills/`）、`AGENTS.md` 与 ai-sdk.dev 文档编写。

## 速查

- **装**：`npx skills add vercel/ai`（`-a` 装到 `.agents/skills`，`-y` 非交互）
- **两个用户向技能**：`use-ai-sdk`（`name: ai-sdk`）+ `migrate-ai-sdk-v6-to-v7`
- **版本匹配文档**：`node_modules/ai/docs/`、`node_modules/ai/src/`、`node_modules/@ai-sdk/<name>/docs/`
- **当前主版本**：v7（Node ≥ 22、ESM-only）；**许可 Apache-2.0**
- **仓库**：`vercel/ai`，pnpm + Turborepo monorepo

## 技能全表

| 技能（`skills/`） | 类型 | 覆盖 |
| --- | --- | --- |
| `use-ai-sdk` | **用户向** | 回答 AI SDK 问题、建 AI 功能；读版本匹配文档、AI Gateway、`ToolLoopAgent`、DevTools、保持 SDK 最新 |
| `migrate-ai-sdk-v6-to-v7` | **用户向** | v6.x→7.0 迁移工作清单（改名、语义变化、ESM 化、Node ≥ 22） |
| `add-provider-package` | 贡献者向 | 新增一个 provider 包 |
| `add-function-examples` | 贡献者向 | 给函数补示例 |
| `add-harness-package` | 贡献者向 | 新增测试 harness 包 |
| `adr-skill` | 贡献者向 | 写架构决策记录（ADR） |
| `capture-api-response-test-fixture` | 贡献者向 | 抓 API 响应做测试 fixture |
| `develop-ai-functions-example` | 贡献者向 | 开发 ai-functions 示例 |
| `list-npm-package-content` | 贡献者向 | 列 npm 包内容 |
| `major-version-mode` | 贡献者向 | 大版本开发模式 |
| `update-provider-models` | 贡献者向 | 更新 provider 模型列表 |

> 普通应用开发者主要用前两个（用户向）；后面是给 `vercel/ai` 提代码的贡献者用的。

## use-ai-sdk 触发词

frontmatter `name: ai-sdk`，description 触发于：`AI SDK`、`Vercel AI SDK`、`generateText`、`streamText`、`add AI to my app`、`build an agent`、`tool calling`、`structured output`、`useChat`，以及问 provider（OpenAI/Anthropic/Google）、流式、工具调用、结构化输出、嵌入等。

## AI SDK 关键 API

| API | 用途 |
| --- | --- |
| `generateText` | 一次性文本生成 |
| `streamText` | 流式文本生成（v7：结果流是 `.stream`） |
| `generateObject` / `streamObject` | 结构化输出（按 schema 校验） |
| `tool()` | 声明工具，供模型调用 |
| `ToolLoopAgent` | 内置 agent 抽象（免手搓工具循环） |
| `embed` / `embedMany` | 向量嵌入（RAG） |
| `useChat` / `useCompletion` | 前端 hook（react/vue/svelte/angular） |

## 安装选项

```bash
npx skills add vercel/ai        # 交互安装到 agent 专属目录
npx skills add vercel/ai -y     # 非交互
npx skills add vercel/ai -a <agent>   # 指定 agent，装到 .agents/skills
```

- 支持环境：Claude Code、Codex、OpenCode、Cursor，及任何 Agent Skills 格式环境
- 装入 `.claude/skills` / `.codex/skills` 等；多 agent 共享用 symlink
- **渐进披露**：启动只载 name+description，任务需要才拉全文

## AI Gateway

```bash
# 鉴权：AI_GATEWAY_API_KEY 环境变量，或 Vercel OIDC
# 引用模型：provider/model 字符串（如 anthropic/... openai/...）

# 拉取当前模型列表（别凭记忆写模型 ID）
curl -s https://ai-gateway.vercel.sh/v1/models | jq -r '.data[].id'
```

## v6 → v7 关键变更清单

| 类别 | 变更 |
| --- | --- |
| 运行时 | Node ≥ 22；ESM-only（`require()`→`import`，加 `"type": "module"`） |
| 提示 | 顶层 `system`→`instructions`；`{ role: 'system' }` 消息移入 `instructions` |
| 流 | `StreamTextResult.fullStream`→`stream` |
| 回调 | `onFinish`→`onEnd`、`onStepFinish`→`onStepEnd` |
| 步数 | `stepCountIs`→`isStepCount` |
| 前缀 | `experimental_*` 去前缀（`customProvider`/`generateImage`/`transcribe`/`output`…） |
| 遥测 | OpenTelemetry 移出 `ai`，改装 `@ai-sdk/otel`；`experimental_telemetry`→`telemetry` |
| 多步结果 | 顶层 `content`/`toolCalls`/`usage` 等含全部步骤；旧「仅最后一步」用 `finalStep` |
| provider | Google `createGoogleGenerativeAI`→`createGoogle`；MCP `redirect` 默认 `'error'` |

> 迁移以仓库 `content/docs/08-migration-guides/23-migration-guide-7-0.mdx` 为准。

## 仓库结构（AI SDK monorepo）

```
vercel/ai/
├── skills/               # 本叶：官方 agent 技能（use-ai-sdk / migrate… 等）
├── packages/
│   ├── ai/               # 主 SDK 包（npm 上的 ai）
│   ├── provider/         # provider 接口规范 @ai-sdk/provider
│   ├── provider-utils/   # 共享工具
│   ├── <provider>/       # openai / anthropic / google / azure / amazon-bedrock…
│   ├── <framework>/      # react / vue / svelte / angular / rsc
│   └── codemod/          # 大版本自动迁移
├── examples/             # 示例应用
├── content/              # 文档源（MDX）
└── AGENTS.md             # 给 AI 编码助手的仓库上下文
```

## 版本与环境

- **AI SDK 当前主版本**：v7
- **Node.js**：v22 / v24 / v26（v22 推荐）；**ESM-only**
- **包管理**：pnpm v10+（仓库开发用）
- **许可**：Apache-2.0

## 资源链接

- 仓库：[vercel/ai](https://github.com/vercel/ai)
- 文档：[ai-sdk.dev/docs](https://ai-sdk.dev/docs)
- 编码 agent 技能：[ai-sdk.dev/docs/getting-started/coding-agents](https://ai-sdk.dev/docs/getting-started/coding-agents)
- 迁移指南：[ai-sdk.dev/docs/migration-guides](https://ai-sdk.dev/docs/migration-guides)
- 相关叶（**别混**）：[Vercel Agent Skills](../vercel-agent-skills/)（`vercel-labs/agent-skills`，deploy/优化通用规范，MIT）
