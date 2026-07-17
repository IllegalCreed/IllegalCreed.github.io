---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 mcollina/skills（Matteo Collina 个人）主分支的 README 与 `skills/` 目录编写（MIT，Copyright © 2026 Matteo Collina）。

## 速查

- **定位**：Matteo Collina **个人**的现代 Node.js agent 技能集，**非 nodejs org 官方**；但作者是 **Node.js TSC 成员 + Fastify/Pino 作者 + Platformatic CTO**，权威性极高
- **装**：`npx skills add mcollina/skills`（遵开放 Agent Skills 标准，可进 Claude Code / Copilot / Codex）
- **11 技能**：`fastify`（插件架构）·`node`（现代 Node.js）·`nodejs-core`（V8/libuv/N-API 内核）·`typescript-magician`（高级 TS 类型）·`oauth`（OAuth 2.0/2.1）·`linting-neostandard-eslint9`（ESLint v9 + neostandard）·`documentation`（Diátaxis）·`init`（AGENTS.md）·`octocat`（Git/GitHub gh CLI）·`skill-optimizer`·`snipgrapher`
- **激活**：装后 agent 检测任务匹配自动调用，也可自然语言显式触发（「用 Fastify 建个 API」「把这些 any 消掉」）
- **核心主张**：现代 Node.js 免构建（Node 22.6+ type stripping，`node app.ts` 直接跑）、Fastify 插件封装、类型安全、内核级 debug

## 定位：个人权威，非 org 官方

`mcollina/skills` 是 **Matteo Collina 个人**维护的技能集，README 自述「my own collection of skills for modern Node.js development」。请如实理解它的性质：

- **不是 nodejs org 官方产物**——没有官方背书，更新随作者节奏
- **但作者权威性极高**——Matteo Collina 的身份决定了内容含金量：
  - **Node.js TSC（技术指导委员会）成员**——参与 Node.js 核心决策
  - **Fastify 框架作者**——所以 `fastify` 技能是「原作者亲授」
  - **Pino 高性能日志库作者**——`node` 技能推 Pino 是自家产品
  - **Platformatic 联合创始人兼 CTO**——把生产级 Node.js 经验产品化

换句话说：这是「造框架、进内核、开公司的人」把一手经验封装成 agent 技能，权威性远超普通个人 side project，但要清楚它是**个人视角与偏好**，不等于社区共识或官方标准。

## 安装

```bash
npx skills add mcollina/skills
```

遵循开放 Agent Skills 标准，装后技能自动可用——agent 检测到相关任务（写 Fastify、调 Node 内核、消除 any 等）时自动激活，也可用自然语言显式触发。技能可装进 Claude Code / GitHub Copilot / Codex 等支持该标准的 agent。

## 11 个技能总览

| 技能 | 一句话 | 何时激活 |
| --- | --- | --- |
| `fastify` | Fastify 全套最佳实践（作者亲授） | 建/调 Fastify 后端、REST API |
| `node` | 现代 Node.js（type stripping、流、缓存、优雅关闭） | 写 Node.js、原生 TS 免构建 |
| `nodejs-core` | Node.js 内核 internals（V8/libuv/N-API/node-gyp） | 贡献 core、写原生插件、调崩溃 |
| `typescript-magician` | 高级 TS 类型体操，消除 `any` | 复杂泛型、类型错误、去 `any` |
| `oauth` | OAuth 2.0/2.1（PKCE/JWT/刷新轮换，带 RFC） | 在 Fastify 里做认证授权 |
| `linting-neostandard-eslint9` | ESLint v9 flat config + neostandard | 配 lint、从 `.eslintrc` 迁移 |
| `documentation` | Diátaxis 技术文档框架 | 写/重组文档（教程/指南/参考/解释） |
| `init` | 高信号 AGENTS.md 维护 | 给仓库配 agent 指令 |
| `octocat` | Git/GitHub 用 gh CLI 全流程 | 任何 github.com 链接/PR/rebase |
| `skill-optimizer` | 提升技能激活率与 benchmark 表现 | 优化/调试技能本身 |
| `snipgrapher` | 生成精美代码截图 | 做代码配图 |

## 上手体验：现代 Node.js 免构建

`node` 技能的核心主张之一是 **Node 22.6+ 原生 type stripping**——直接跑 `.ts` 文件，无需 ts-node/tsx/编译步骤：

```ts
// greet.ts
const greet = (name: string): string => `Hello, ${name}!`
console.log(greet('world'))
```

```bash
node greet.ts   # Node 22.6+ 直接运行，运行时剥离类型注解
```

兼容要点（技能会引导）：类型导入用 `import type`、用 `as const` 对象替代 `enum`、避免 namespace 与参数属性、导入带 `.ts` 扩展名。

## 下一步

- [指南](./guide-line) —— 核心技能逐个深入：Fastify 插件封装、内核 debug、TS 类型、OAuth、ESLint9、Diátaxis
- [参考](./reference) —— 11 技能全表 + 安装、Diátaxis 四类、ESLint9、版本、许可、链接
