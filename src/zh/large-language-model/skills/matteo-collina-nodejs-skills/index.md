---
layout: doc
---

# Matteo Collina Node.js Skills

Matteo Collina Node.js Skills（`mcollina/skills`）是 Matteo Collina **个人**维护的一组面向现代 Node.js 开发的 AI agent 技能集，作者自述「my own collection of skills for modern Node.js development」，MIT 开源。**它是个人权威、非 nodejs org 官方产物**——但作者 **Matteo Collina 是 Node.js TSC（技术指导委员会）成员、Fastify 框架作者、Pino 日志库作者、Platformatic 联合创始人兼 CTO**，在 Node.js 生态的权威性极高，因此这套「个人技能集」的含金量远超普通 side project，本质是「造框架、进内核的人」把一手经验封装成可被 agent 调用的技能。11 个技能覆盖 Fastify 插件架构、Node.js 内核 internals（V8 / libuv / N-API）、原生 TypeScript type stripping、高级 TS 类型体操、OAuth 2.0/2.1、ESLint v9 + neostandard、Diátaxis 文档框架等，遵循开放 Agent Skills 标准，一条 `npx skills add mcollina/skills` 即可装进 Claude Code / Copilot / Codex 等 agent。

## 评价

**优点**

- **作者即权威**：Node.js TSC 成员 + Fastify/Pino 作者 + Platformatic CTO，内容是「造框架、进内核的人」的一手经验，而非二手总结
- **Fastify 一手规范**：`fastify` 技能 18 个 rules 文件覆盖插件封装（encapsulation + `fastify-plugin`）、JSON Schema、hooks 生命周期、Pino 日志、`inject()` 测试、TypeScript strip types——由 Fastify 作者本人给出
- **内核深度罕见**：`nodejs-core` 深入 V8 GC/JIT、libuv 事件循环、N-API/node-addon-api、primordials、node-gyp，甚至含 `nodejs/node` 的 commit/PR 规范与「改 `lib/`/`src/` 后必先 rebuild」这类核心贡献者才懂的门道
- **现代 Node.js 范式**：`node` 技能主推 Node 22.6+ 原生 type stripping（`node greet.ts` 免构建步骤）、流用 `pipeline()`、缓存用 `lru-cache`/`async-cache-dedupe`、优雅关闭与信号处理
- **TS 类型体操**：`typescript-magician` 覆盖 `infer`/条件类型/映射类型/模板字面量/品牌类型，系统性消除 `any`
- **OAuth 严谨带 RFC**：`oauth` 技能每条要求都标 RFC 引用（6749/6750/7636/7519/8252/8628），含 PKCE、刷新令牌轮换、反模式清单
- **开放标准跨 agent**：遵开放 Agent Skills 格式，`npx skills add` 可装进 Claude Code/Copilot/Codex；还带跨模型 benchmark 工作流

**缺点 / 边界**

- **个人非官方**：是 Matteo 个人集，不是 nodejs org 官方产物，无官方背书/SLA，更新节奏随作者
- **强 Fastify/Matteo 生态倾向**：`oauth` 绑 Fastify 集成、`node` 缓存推荐他自己的 `async-cache-dedupe`、日志推 Pino（他写的）——非 Fastify 栈时需甄别
- **内核技能门槛高**：`nodejs-core` 面向 Node.js core 贡献者/原生插件开发者，普通业务开发多数用不上
- **部分技能与主题弱相关**：`skill-optimizer`、`snipgrapher`、`octocat` 偏工具性，与「Node.js 开发」主线关联较弱
- **需 agent 宿主**：技能是给 AI agent 加载激活的指令集，不是给人直接读的教程

## 适用场景

- 用 Fastify 建后端/REST API，想要框架作者的一手最佳实践（插件封装、Schema、测试）
- 写现代 Node.js：Node 22+ type stripping 免构建、流/背压、缓存、优雅关闭
- 给 Node.js core 贡献代码、开发 C++/N-API 原生插件、调 V8/libuv 问题
- 系统消除 TypeScript 的 `any`、写复杂泛型与类型体操
- 在 Fastify 里实现 OAuth 2.0/2.1（PKCE、JWT 校验、刷新令牌轮换）
- 配 ESLint v9 flat config + neostandard、按 Diátaxis 组织技术文档

## 边界

- **个人权威 ≠ org 官方**：内容质量高但无官方背书，是 Matteo 个人视角与偏好
- **强 Fastify 倾向**：多个技能默认 Fastify / Pino / Platformatic 生态，跨栈需甄别
- **面向 agent 非人类教程**：技能是给 AI agent 加载的指令集，激活靠 agent 检测任务匹配
- **与其它 skills 叶并列**：本叶是「个人权威」代表，Vercel / Antfu 等各有专叶

## 官方文档

[mcollina/skills README](https://github.com/mcollina/skills#readme) ｜ [跨模型 benchmark 工作流](https://github.com/mcollina/skills/blob/main/docs/skill-benchmarking.md) ｜ [Agent Skills 开放标准](https://agentskills.io/)

## GitHub 地址

[mcollina/skills](https://github.com/mcollina/skills)（MIT · Copyright © 2026 Matteo Collina）

## 内容地图

- [入门](./getting-started) —— 定位（个人权威 + Matteo 身份）、`npx skills add` 安装、11 个技能总览
- [指南](./guide-line) —— 核心技能逐个深入（Fastify 插件架构、内核、TS 类型、OAuth、ESLint9、Diátaxis）、反模式
- [参考](./reference) —— 11 技能全表 + 安装、Diátaxis、ESLint9、版本、许可、链接

## 幻灯片地址

<a href="/SlideStack/matteo-collina-nodejs-skills-slide/" target="_blank">Matteo Collina Node.js Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=620" target="_blank" rel="noopener noreferrer">Matteo Collina Node.js Skills 测试题</a>
