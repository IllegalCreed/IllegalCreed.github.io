---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 mastra-ai/skills 官方 skills（`skills/mastra/SKILL.md` v2.0.0、`references/`、README/AGENTS.md）编写。

## 速查

- **装**：`npx skills add mastra-ai/skills` ｜ well-known：`npx skills add https://mastra.ai/`
- **仓库结构**：单个 `mastra` 技能 = `SKILL.md` + `references/`（8 篇）+ `scripts/provider-registry.mjs`
- **核心理念**：别信记忆，写代码前先查文档（embedded → 源码 → remote）
- **原语**：Agent（决策）/ Workflow（流程）/ Tool（Zod）/ Memory（需 storage）/ Storage / RAG
- **硬要求**：ES2022、Node 20+、模型 `"provider/model-name"`
- **well-known**：`https://mastra.ai/.well-known/skills/`（index.json + mastra/SKILL.md）
- **许可**：Apache-2.0（Kepler Software, Inc.；GitHub 一度 NOASSERTION，以仓库为准）

## 技能与 reference 清单

仓库里只有**一个** `mastra` 技能，采用渐进式披露，主 `SKILL.md` 路由到 8 篇 reference 与 1 个脚本：

| 文件 | 作用 |
| --- | --- |
| `skills/mastra/SKILL.md` | 主技能：核心理念（别信记忆）+ 概念 + 路由表（v2.0.0） |
| `references/create-mastra.md` | 新建项目：CLI（`npm create mastra@latest`）与手动步骤 |
| `references/core-concepts.md` | 选原语：agents vs workflows、tools、memory、storage |
| `references/embedded-docs.md` | 在 `node_modules/@mastra/*/dist/docs/` 查 API |
| `references/remote-docs.md` | 从 `https://mastra.ai/llms.txt` 拉最新文档 |
| `references/model-selection.md` | 模型格式与 provider 注册表查询 |
| `references/common-errors.md` | 常见错误与解法 |
| `references/migration-guide.md` | 跨版本升级流程 |
| `references/mastra-api.md` | `mastra api` CLI 巡检/调用服务资源 |
| `scripts/provider-registry.mjs` | 列 provider 与模型，用模型前先跑它校验 |

## SKILL.md frontmatter（元数据）

```yaml
name: mastra
description: Comprehensive Mastra framework guide for building agents,
  workflows, tools, memory, workspaces, and storage with current APIs...
license: Apache-2.0
metadata:
  author: Mastra
  version: "2.0.0"
  repository: https://github.com/mastra-ai/skills
```

## 核心概念速览

| 原语 | 何时用 | 要点 |
| --- | --- | --- |
| **Agent** | 开放式、需决策的任务 | 自主、用工具；`new Agent({ id, name, instructions, model, tools })` |
| **Workflow** | 确定的多步流程 | `createWorkflow().then().commit()`，忘 `.commit()` 会崩 |
| **Tool** | 扩展 agent 能力 | `createTool({ id, inputSchema, outputSchema, execute })` + Zod |
| **Memory** | 保持对话上下文 | `new Memory({ storage, ... })`，**必须**配 storage；语义召回还需 vector + embedder |
| **Storage** | 持久化 | Postgres / LibSQL / MongoDB 等 provider |
| **RAG** | 检索增强 | `@mastra/rag`，向量库 |

## 写代码优先级（永远先查再写）

1. **Embedded docs**（装了包）——`node_modules/@mastra/*/dist/docs/`，精确匹配安装版本，最可靠
2. **源码类型定义**（embedded 不够）——读 `.d.ts`
3. **Remote docs**（没装包 / 探新特性）——`https://mastra.ai/llms.txt`，URL 加 `.md` 取纯 markdown

## 安装与 `.well-known` 发现

```bash
# skills CLI
npx skills add mastra-ai/skills

# well-known 自动发现（RFC 8615）
npx skills add https://mastra.ai/

# 手动
git clone https://github.com/mastra-ai/skills.git
```

`.well-known` 端点（RFC 8615 Well-Known URI）：

```text
索引：  https://mastra.ai/.well-known/skills/index.json
技能：  https://mastra.ai/.well-known/skills/mastra/SKILL.md
```

agent 拉取上述地址即可**自动发现**技能，无需手动配置。

## 关键约束速记

| 项 | 要求 |
| --- | --- |
| TypeScript | `target/module: ES2022`，`moduleResolution: bundler`；CommonJS 会报错 |
| Node.js | 20+ |
| 模型格式 | `"provider/model-name"`（如 `"anthropic/claude-sonnet-4-5"`） |
| Studio | `npm run dev` → `http://localhost:4111` |
| 依赖同步 | 所有 `@mastra/*` 包版本一起升 |

## `mastra api` 命令组

```text
agent  workflow  tool  mcp  thread  memory
trace  log  metric  score  dataset  experiment
```

- 只读用 `list '{"page":0,"perPage":10}'` 快路径 + `jq` 投影
- observability（`trace`/`log`/`score`/`metric`）默认打到 `https://observability.mastra.ai`
- 本地默认 `http://localhost:4111`，远程用 `--url`，鉴权用 `--header`

## 许可

**Apache-2.0**。仓库 `README.md` 结尾「License: Apache-2.0」，`LICENSE` 文件为 Apache License 2.0（Copyright (c) 2026 Kepler Software, Inc.）。

> GitHub 的许可检测器一度显示 **NOASSERTION**（因 `LICENSE` 用了非标准头，未被自动归类为标准 Apache-2.0 文本），但以仓库 README/LICENSE 的**明确声明**为准——即 Apache-2.0。

## 资源链接

- 技能仓库：[mastra-ai/skills](https://github.com/mastra-ai/skills)
- Mastra 框架：[mastra-ai/mastra](https://github.com/mastra-ai/mastra)
- 文档：[mastra.ai/docs](https://mastra.ai/docs) ｜ agent 友好总览 [mastra.ai/llms.txt](https://mastra.ai/llms.txt)
- Agent Skills 规范：[agentskills.io](https://agentskills.io)
- `.well-known` Skills RFC：[cloudflare/agent-skills-discovery-rfc](https://github.com/cloudflare/agent-skills-discovery-rfc)
- 社区：[Discord](https://discord.gg/BTYqqHKUrf)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Agent Skills 规范](../agent-skills-spec/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/)
