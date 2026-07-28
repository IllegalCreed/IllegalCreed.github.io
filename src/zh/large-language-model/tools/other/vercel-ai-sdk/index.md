---
layout: doc
---

# Vercel AI SDK

**面向 TypeScript 的统一 AI 应用开发工具包**——由 Vercel 出品（最新主线版本 **v7**，包名 `ai`），把 OpenAI / Anthropic / Google / Mistral / xAI 等 25+ Provider 收敛到一套统一的 **Language Model Specification** 之上。一套代码、一个 `model` 参数即可在厂商之间切换。

AI SDK 自上而下分两层：

- **AI SDK Core**（`ai` 包）：`generateText` / `streamText` / `embedMany` / `generateImage` 等核心函数，provider-agnostic。在 v7 中，结构化数据生成统一收敛到 `generateText` + `Output.object()` / `Output.array()` / `Output.choice()`（替代了 5.x 时代的 `generateObject` / `streamObject`）。
- **AI SDK UI**（`@ai-sdk/react` / `@ai-sdk/svelte` / `@ai-sdk/vue` / `@ai-sdk/solid`）：`useChat` / `useCompletion` / `useObject` 等 hook，把流式渲染、状态管理、错误恢复全包圆。

定位是 **「SDK 而非框架」**——只做模型调用的抽象层与 UI 适配层，不替你决定 Agent 编排 / 记忆 / RAG 等业务架构，因此比 LangChain 轻量、与 Next.js / Vite / RSC 都能无缝配合。

## 评价

**优点**

- **Provider 切换零成本**：改一个 `model` 参数即可换厂，API schema 统一
- **TypeScript 一等公民**：结构化输出走 Zod / Valibot schema，全程类型安全
- **UI 层封装到位**：`useChat` 几行代码搞定流式聊天界面，支持 React / Svelte / Vue / Solid
- **RSC 原生支持**：`streamUI` / `createStreamableUI` 在 React Server Components 中按 token 渲染组件
- **Tool Calling 标准化**：`tool({ inputSchema, execute })` 跨厂商一致
- **生态广**：官方维护 25+ Provider 包，社区还有更多
- **文档与示例齐全**：sdk.vercel.ai（已迁移至 ai-sdk.dev）

**缺点**

- **TypeScript-only**：没有 Python 版（与 LangChain/LlamaIndex 不同）
- **v7 破坏性变更多**：从 4.x / 5.x 升级需重写 provider 调用、`generateObject` 改 `Output.object`
- **不提供编排逻辑**：复杂 Agent 工作流仍需自己写或上 Mastra / Inngest
- **抽象有泄漏**：个别厂商独有特性（如 Claude MCP / Gemini Live）仍需 `providerOptions` 透传
- **流式协议自定义**：自定义 stream part 学习曲线略陡

## 文档地址

[ai-sdk.dev/docs](https://ai-sdk.dev/docs)（原 sdk.vercel.ai/docs 已 301 跳转至此）

## GitHub地址

[github.com/vercel/ai](https://github.com/vercel/ai)

## 主要资源

- [Introduction](https://ai-sdk.dev/docs/introduction)
- [AI SDK Core Overview](https://ai-sdk.dev/docs/ai-sdk-core/overview)
- [Generating Text](https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
- [Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [Providers & Models](https://ai-sdk.dev/docs/ai-sdk-core/providers-and-models)
- [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview)
- [Changelog](https://ai-sdk.dev/changelog)

## 推荐场景

| 场景 | Vercel AI SDK 是否合适 |
| --- | --- |
| TypeScript 全栈 AI Web 应用 | ✅ 首选 |
| Next.js / Nuxt / SvelteKit 项目 | ✅ |
| 想统一多家 LLM、随时切换 | ✅ |
| 需要 RSC 中按 token 渲染组件 | ✅ |
| Python 后端 / 纯 CLI 脚本 | ❌ 用 LangChain / LlamaIndex |
| 复杂多 Agent 编排 + 长期记忆 | △ 需配合 Mastra / Inngest / 自研 |
| 只用单一厂商且需要全部独有特性 | △ 直接用厂商官方 SDK 更直接 |

## 幻灯片地址

<a href="/SlideStack/vercel-ai-sdk-slide/" target="_blank">Vercel AI SDK</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vercel-ai-sdk" target="_blank" rel="noopener noreferrer">Vercel AI SDK 测试题</a>
