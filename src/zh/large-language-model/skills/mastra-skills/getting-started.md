---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 mastra-ai/skills 官方 skills（`skills/mastra/SKILL.md` v2.0.0）与仓库 README/AGENTS.md 编写。

## 速查

- **是什么**：Mastra AI 框架**官方** agent skill（`mastra-ai/skills`），教 coding agent 用当前版本的 Mastra 正确写代码
- **装**：`npx skills add mastra-ai/skills`（Claude Code / Cursor / Codex 等）
- **well-known 发现**：`npx skills add https://mastra.ai/`，走 RFC 8615 `.well-known/skills/`，自动发现无需手配
- **手动**：`git clone https://github.com/mastra-ai/skills.git` 后让 agent 从该目录加载
- **核心理念**：**别信记忆**——「你对 Mastra 的记忆很可能过时或错误，永远别靠记忆，务必对照最新文档验证」
- **Mastra 是什么**：现代 TypeScript 技术栈的 AI 应用与 agent 框架（agents / workflows / tools / memory / RAG）
- **写代码优先级**：embedded docs（`node_modules/@mastra/*/dist/docs/`）→ 源码类型定义 → 远程 `https://mastra.ai/llms.txt`
- **硬要求**：ES2022 模块（CommonJS 会报错）、Node.js 20+、模型格式 `"provider/model-name"`
- **许可**：Apache-2.0（仓库 README/LICENSE 明写）

## 官方定位

Mastra Skills 是 [Mastra 框架](https://mastra.ai) 的**官方 agent 技能**——README 原话「Official Mastra skills for agents working with the Mastra framework」。它面向的是 **coding agent**（Claude Code、Cursor、GitHub Copilot、Codex 等），目标是让这些 AI 助手写出**对照当前代码库校验过、可直接跑**的 Mastra 代码。

和某些「一个仓库塞一堆技能」的做法不同，`mastra-ai/skills` 里只有**一个** `mastra` 技能，用**渐进式披露**（progressive disclosure）——主技能文件教核心理念与决策，再按用户的问题路由到对应的 reference 文件。

## 安装

### 方式一：skills CLI

```bash
npx skills add mastra-ai/skills
```

装进支持 Agent Skills 规范的 agent（Claude Code / Cursor / Codex 等）。

### 方式二：`.well-known` 自动发现（RFC 8615）

Mastra 把技能通过 [RFC 8615 Well-Known URI](https://github.com/cloudflare/agent-skills-discovery-rfc) 托管在 `https://mastra.ai/.well-known/skills/`，所以可以直接指向站点根：

```bash
npx skills add https://mastra.ai/
```

agent 可自行拉取以下地址发现可用技能，**无需手动配置**：

- 索引：`https://mastra.ai/.well-known/skills/index.json`
- 技能：`https://mastra.ai/.well-known/skills/mastra/SKILL.md`

### 方式三：手动克隆

```bash
git clone https://github.com/mastra-ai/skills.git
```

然后让你的 agent 从克隆目录加载技能。

## Mastra 是什么

Mastra 是一套用**现代 TypeScript** 技术栈构建 AI 应用与 agent 的框架。它提供的核心原语：

- **Agent（智能体）**：自主决策、调用工具，处理开放式任务
- **Workflow（工作流）**：结构化的多步流程
- **Tool（工具）**：用 API / 数据库 / 外部服务 / 确定性函数扩展 agent 能力
- **Memory（记忆）**：消息历史、工作记忆、语义召回
- **Storage / RAG**：持久化与向量检索

配套还有 **Mastra Studio**（交互式 UI，`npm run dev` 后开 `http://localhost:4111` 建/测/管 agents）和 `mastra api` CLI。

> 本叶讲的是「怎么让 agent 正确用 Mastra」的**技能**；Mastra 框架本身的源码在 [mastra-ai/mastra](https://github.com/mastra-ai/mastra)。

## 核心理念：别信记忆，永远查最新文档

这是整个技能**最重要**的一条，写在 `SKILL.md` 的第一节「Critical: Do not trust internal knowledge」：

> 你对 Mastra 的一切认知很可能已经过时或错误。永远别靠记忆，务必对照最新文档验证。你的训练数据里全是废弃 API、过时模式、错误用法。Mastra 演进极快——版本间 API 会变、构造函数签名会变、模式会被重构。

为什么这条如此关键？因为 LLM 的训练数据有截止日期，而 Mastra 迭代速度远快于此。于是常见翻车是：agent「自信地」用它记忆里的旧构造签名或废弃方法写代码，结果 TypeScript 一堆报错。技能的对策是把「先查文档再写代码」变成**强制流程**：

```text
用户让写 Mastra 代码
  ↓
1. 先看包装没装：ls node_modules/@mastra/
2. 装了 → 查 embedded docs（node_modules/@mastra/*/dist/docs/，精确匹配安装版本）
3. embedded 不够 → 读源码类型定义（.d.ts）
4. 没装 → 查远程 https://mastra.ai/llms.txt
  ↓
5. 基于当前文档写代码，再用 Studio / 脚本测试
```

技能甚至提醒：当你看到 `Property X does not exist on type Y`、`Cannot find module`、构造参数错误时，**先怀疑是你的知识过时，而不是用户写错了**。

## 第一个项目

最快的方式：

```bash
npm create mastra@latest
```

（也支持 `pnpm create mastra@latest` / `yarn` / `bun`）。手动搭建的要点：

```bash
npm install -D typescript @types/node mastra@latest
npm install @mastra/core@latest zod@^4
```

`tsconfig.json` **必须**用 ES2022（否则 CommonJS 报错）：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

模型字符串统一 `"provider/model-name"` 格式（如 `"openai/gpt-5.4"`、`"anthropic/claude-sonnet-4-5"`、`"google/gemini-2.5-pro"`），且写之前应先跑 `scripts/provider-registry.mjs` 校验 provider key 与模型名——**别凭记忆猜模型名，它们变得很频繁**。

## 下一步

- [指南](./guide-line) —— `mastra` 技能教什么、文档查找策略（embedded/remote）、agents vs workflows/tools/memory/RAG、反模式与常见错误
- [参考](./reference) —— 技能与 reference 清单、核心概念速览、安装/well-known、许可、链接
