---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 mastra-ai/skills 官方 skills（`skills/mastra/SKILL.md` v2.0.0 及 `references/`）编写。

## 速查

- **技能教三件事**：① 找最新文档 ② 验证 API 签名 ③ 建 agents 和 workflows——统统建立在「别信记忆」之上
- **文档查找优先级**：embedded docs（装了包，精确匹配版本，最可靠）→ 源码 `.d.ts` → 远程 docs（没装包或探索新特性）
- **embedded docs**：`node_modules/@mastra/*/dist/docs/`，含 `SKILL.md`、`assets/SOURCE_MAP.json`（export→文件）、`references/`（`<category>-<topic>.md`），用 `grep` 找
- **remote docs**：先 `https://mastra.ai/llms.txt` 看全貌；任意文档 URL 加 `.md` 后缀取纯 markdown（或发 `text-markdown` 头）
- **agents vs workflows**：开放式决策用 agent；确定的多步流程用 workflow
- **tools / memory / RAG**：工具扩能力（Zod 校验）、记忆保上下文（需 storage）、RAG 走向量库
- **反模式**：凭记忆写过时 API、猜模型名、忘 `.commit()`、Memory 不给 storage、模型漏 provider 前缀
- **模型**：`"provider/model-name"`，写前跑 `scripts/provider-registry.mjs` 校验

## `mastra` 技能教什么

技能文件 `SKILL.md` 的定位是「Build AI applications with Mastra. This skill teaches you how to find current documentation and build agents and workflows.」拆开就是三件事，且都建立在**别信记忆**的前提上：

1. **找最新文档**（find current documentation）——教 agent 去 embedded docs / 源码 / 远程 docs 现查，而不是凭训练数据
2. **验证 API 签名**（verify APIs）——写之前确认构造参数、方法签名对得上当前版本
3. **建 agents 和 workflows**——在验证过的 API 基础上落地核心原语

它采用**渐进式披露**：主技能只讲理念与「遇到 X 问题看哪个 reference」的路由表，具体细节按需加载。这样既控制了上下文体积，也避免把「会过时的 API 细节」写死在技能里。

### 路由表（问题 → reference）

| 用户的问题 | 先看哪个 reference |
| --- | --- |
| 新建 / 安装 Mastra 项目 | `references/create-mastra.md` |
| 选 Agent / Workflow / Tool / Memory / Storage | `references/core-concepts.md` |
| 怎么用 Agent / Workflow / Tool？（装了包） | `references/embedded-docs.md` |
| 怎么用 X？（没装包） | `references/remote-docs.md` |
| 选或校验模型 | `references/model-selection.md` |
| 我报错了…… | `references/common-errors.md` |
| 从 v0.x 升到 v1.x | `references/migration-guide.md` |
| 用 CLI 巡检 / 调用服务资源 | `references/mastra-api.md` |

## 文档查找策略：写代码前的三级优先

技能反复强调「Never write code without checking current docs first」，并给出严格优先级：

### 1. Embedded docs（装了包时首选，最可靠）

装了 `@mastra/*` 包时，文档就在本地 `node_modules/@mastra/*/dist/docs/`，**与安装版本精确匹配**——这是最可信的真相来源，还不用联网：

```bash
# 先确认装了哪些包
ls node_modules/@mastra/

# 在 references/ 里 grep 找 API
grep -r "Agent" node_modules/@mastra/core/dist/docs/references

# 从 SOURCE_MAP 找 export 对应的类型定义文件
cat node_modules/@mastra/core/dist/docs/assets/SOURCE_MAP.json | grep '"Agent"'
# → { "Agent": { "types": "dist/agent/agent.d.ts", ... } }

# 读类型定义拿到精确构造参数
cat node_modules/@mastra/core/dist/agent/agent.d.ts
```

文档目录结构：`SKILL.md`（包概览与 exports）、`assets/SOURCE_MAP.json`（export → 源文件映射）、`references/`（按 `<category>-<topic>.md` 命名，category ∈ `docs / reference / guides / models`）。

### 2. 源码类型定义（embedded 不够时）

embedded docs 没覆盖到的问题，直接读安装源码的 `.d.ts`——文档缺失或含糊时，类型定义才是最终真相。

### 3. 远程 docs（没装包 / 探索新特性）

没装包，或想看可能领先于本地版本的最新文档时，用远程：

```text
# 先看总览，agent 友好
https://mastra.ai/llms.txt

# 任意文档 URL 加 .md 取纯 markdown（去导航/页眉/页脚）
https://mastra.ai/reference/workflows/workflow-methods/then.md
```

URL 模式：概览 `https://mastra.ai/docs/{topic}/overview`、参考 `https://mastra.ai/reference/{topic}/`、指南 `https://mastra.ai/guides/{topic}/`。

| 场景 | 用哪个 |
| --- | --- |
| 包装在本地 | **embedded docs**（版本精确匹配） |
| 包没装 | **remote docs** |
| 要精确 API 签名 | **embedded docs** |
| 要概念指南 | **remote docs** |
| 探索新特性 | **remote docs**（可能领先本地版本） |

## 核心概念：选对原语

来自 `references/core-concepts.md`——决定用哪个 Mastra 原语时看这里。

### Agents vs Workflows

| | Agent（智能体） | Workflow（工作流） |
| --- | --- | --- |
| 本质 | 自主、会决策、用工具 | 结构化的步骤序列 |
| 适合 | 开放式任务：客服、调研、分析、用工具的助手 | 确定的流程：管道、审批、ETL、多步业务逻辑、可恢复流程 |

一句话：**要它自己拿主意 → agent；流程你已经定好 → workflow。**

### Tools（工具）

用 API、数据库、外部服务、确定性函数扩展 agent 能力。`createTool` 配 Zod schema：

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({ location: z.string() }),
  outputSchema: z.object({ output: z.string() }),
  execute: async () => ({ output: "The weather is sunny" }),
});
```

### Memory（记忆）

通过消息历史、工作记忆、语义召回、观察式记忆保持上下文。**关键：Memory 必须配 storage 后端**；要语义召回还得配 vector store 和 embedder：

```typescript
const memory = new Memory({
  id: "chat-memory",
  storage,             // 必需，否则 "Storage is required for Memory"
  vector,              // 语义召回必需
  embedder,            // 语义召回必需
  options: { lastMessages: 10, semanticRecall: true },
});
```

调用时用**一致的 `threadId`**，否则 agent「记不住」上一轮。

### Storage & RAG

- **Storage**：用 Postgres、LibSQL、MongoDB 等 provider 持久化数据
- **RAG**：`@mastra/rag` 提供 RAG 特性与向量库，配合 memory 的语义召回做检索增强

## 反模式：这些坑技能专门治

### 凭记忆写过时 API（头号反模式）

这是整个技能针对的核心问题。症状是一堆 TypeScript 报错：

```text
Property 'tools' does not exist on type 'Agent'
Cannot find module '@mastra/core'
Type mismatch / Constructor parameter errors
```

技能的态度很明确：**这往往是你的知识过时，不是用户写错**。对策——查 embedded docs、查 `SOURCE_MAP.json` 当前 exports、`npm list @mastra/core` 核版本、`npm update`。

### 其它高频错误（`references/common-errors.md`）

| 症状 | 根因 | 对策 |
| --- | --- | --- |
| `Cannot find module` / import 报错 | CommonJS 配置、缺 `"type": "module"` | tsconfig 用 ES2022 + `moduleResolution: bundler` |
| agent 不用工具 | 工具没注册 / 没传给 agent / id 不匹配 | 在 Mastra 与 Agent 两处都引用工具 |
| 记忆不持久 | 没配 storage、`threadId` 不一致 | 配 storage + 全程同一 `threadId` |
| workflow 立即崩 `Cannot read property 'then'` | 忘了 `.commit()` | 链末尾必须 `.commit()` |
| `Storage is required for Memory` | Memory 没给 storage | 建 Memory 时传 storage |
| 语义召回不生效 | 缺 vector / embedder / `semanticRecall` | 三者都配上 |
| `Model not found` | 漏 provider 前缀 | 用 `"provider/model"`，跑 provider-registry 校验 |

workflow 正确骨架（注意 `.commit()`）：

```typescript
const workflow = createWorkflow({ id, inputSchema, outputSchema })
  .then(step1)
  .then(step2)
  .commit();                       // 必需，否则运行即崩

const run = await workflow.createRun();
const result = await run.start({ inputData: { data: "test" } });
```

## 巡检与调试：Studio 与 `mastra api`

- **Mastra Studio**：项目内 `npm run dev` → `http://localhost:4111`，可视化建 / 测 / 调 agents、workflows、tools，很多报错先在 Studio 交互复现最省事
- **`mastra api` CLI**：巡检或调用本地 / Mastra 平台 / 远程服务的 agents、workflows、tools、traces、logs、scores、threads。只读走 `list`/`get` 快路径并用 `jq` 投影；observability 命令（`trace`/`log`/`score`/`metric`）默认打到 `https://observability.mastra.ai`

## 下一步

- [参考](./reference) —— 技能与 reference 清单、核心概念速览、安装/well-known、许可、链接
- 上游：[Mastra 文档](https://mastra.ai/docs) · [Agent Skills 规范](https://agentskills.io)
