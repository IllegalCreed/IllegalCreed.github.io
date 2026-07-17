---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 TanStack Intent（`@tanstack/intent`）官方文档与 `TanStack/router` 仓库官方 skills（`library_version` 1.166.2，2026-07 读取）编写。

## 速查

- **机制**：官方 skills 走 **TanStack Intent**——维护者用 `@tanstack/intent` CLI 生成/校验/**随 npm 包发布** SKILL.md，装包即带技能，**随版本同步**不漂移
- **消费者三步**：`intent install`（写 `intent-skills` 引导块进 `AGENTS.md`/`CLAUDE.md`）→ 配 `package.json#intent.skills` 白名单（`["@tanstack/*"]`）→ agent 按需 `intent load`
- **包管理器**：npm→`npx`、pnpm→`pnpm dlx`、Yarn→`yarn dlx`、Bun→`bunx`，后接 `@tanstack/intent@latest <命令>`
- **技能在哪**：`TanStack/router` 仓库 `packages/react-router/skills/` 与 `packages/react-start/skills/`，装了对应 npm 包才会被发现
- **Router**：类型安全、文件式路由（React SPA），route loaders，**client-first**（loader 默认跑客户端）
- **Start**：建在 Router 之上的全栈框架，server functions、SSR/streaming、RSC；**默认同构**，server-only 用 `createServerFn`
- **官方 vs 社区**：官方 = Intent 随包发布；社区 `tanstack-skills/*`、`DeckardGer/*` 为 UNOFFICIAL，**不采用**
- 全部 MIT，遵 [agentskills.io](https://agentskills.io) 开放标准

## TanStack Intent 是什么

`@tanstack/intent` 是一个**给库维护者用的 CLI**，用来把 [Agent Skills](https://agentskills.io) 当作**包产物（package artifacts）**发布和消费。

一句话概括它解决的问题：**让「怎么正确用这个库」这件事，跟着库版本一起进 npm 包，而不是散落在会过时的外部文档里。**

- 技能是一份 **SKILL.md**（markdown），教 AI 编码 agent 如何正确使用某个库
- Intent 把技能**随库的发布一起版本化**，塞进 npm 包
- 它从你的项目与工作区依赖里**发现**技能，并在 agent 处理匹配任务时帮它加载

### skills 随 npm 包发布 —— 为什么不漂移

传统做法里，「库文档」和「库代码」是两条独立更新的线，很容易脱节。Intent 把它们绑在一起：

- 维护者在库仓库的 `skills/` 目录里写 SKILL.md，**跟着同一条 release 流水线发布**
- 你安装某个版本的包，就得到**那个版本**对应的 SKILL.md
- agent 加载技能时，`intent load` 打印的是**当前已安装版本**的技能内容

所以库升级 → 包里的 SKILL.md 一起更新 → agent 读到的永远是匹配当前代码的指令。这就是「不漂移」。

## 安装：消费者三步

Intent 面向两类人：**消费者**（用别人库的开发者）和**维护者**（库作者）。入门先讲消费者。

### 1. 跑 install

```bash
npx @tanstack/intent@latest install
```

> 例子用 `npx`（npm 项目）。pnpm / Yarn / Bun 项目换成 `pnpm dlx` / `yarn dlx` / `bunx`。

`install` 会在你的 agent 配置文件里创建/更新一个 `intent-skills` 引导块：

1. 检查 `AGENTS.md` / `CLAUDE.md` / `.cursorrules` 等是否已有 `intent-skills` 块
2. 写入「如何发现与加载技能」的轻量指令
3. 保留托管块以外的内容不动
4. 已有块则**就地更新**；没有块则默认写进 `AGENTS.md`

生成的块大意是：动手改文件前，先 `intent list` 看有哪些本地技能，命中就 `intent load <包>#<技能>` 再改。

### 2. 选哪些包的技能（白名单）

`package.json#intent.skills` 是一个**信任白名单**——列出你信任、愿意让其贡献技能的包：

```json
{
  "intent": {
    "skills": ["@tanstack/*"]
  }
}
```

Intent 只把匹配的包的技能浮现出来，其余丢弃并报告给你。这是一个**信任决策**：技能是 agent 会执行的指令，所以「哪些包能贡献技能」必须显式授权。

### 3. 让 agent 在工作流里用技能

agent 处理匹配任务时会把对应 SKILL.md 载入上下文。也可手动加载：

```bash
npx @tanstack/intent@latest load @tanstack/react-router#react-router
```

这会打印**当前安装版本**的技能内容。想在支持的 agent 里强制「改文件前先加载」，再开启钩子：

```bash
npx @tanstack/intent@latest hooks install
```

Claude Code 与 Codex 装的是**项目级阻断钩子**；Cursor 和通用 `AGENTS.md` agent 只用引导块。

## Router vs Start 定位

这两个是本叶技能覆盖的两个库，关系是**上下层**：

| | TanStack Router | TanStack Start |
| --- | --- | --- |
| 是什么 | 类型安全、文件式路由（React SPA） | 建在 Router 之上的**全栈** React 框架 |
| 核心 | route loaders、搜索参数、类型全推断 | server functions、SSR/streaming、RSC |
| 执行模型 | **client-first**（loader 默认跑客户端） | **默认同构**（loader 两端都跑），server-only 用 `createServerFn` |
| 部署 | 静态托管 / 任意 SPA 宿主 | Node、Cloudflare Workers 等多目标 |
| npm 包 | `@tanstack/react-router` | `@tanstack/react-start`（re-export Router） |

一句话：**Router 管路由与类型安全，Start 在它之上加服务端能力**。Start 的技能 re-export 了 Router 的能力，所以用 Start 时 Router 的技能同样适用。

## 官方 vs 社区

- **官方**：走 **TanStack Intent**——SKILL.md 在 `TanStack/router` 仓库、随 `@tanstack/react-router` / `@tanstack/react-start` npm 包发布。这是本叶讲的路线。
- **社区（UNOFFICIAL）**：另有 `tanstack-skills/tanstack-skills`、`DeckardGer/tanstack-agent-skills` 等第三方技能集——**不采用**，以官方 Intent 为准（随包发布、版本同步、来源可追溯）。

## 下一步

- [指南](./guide-line) —— Intent 机制细节、Router skills（router-query 组合 · 迁移）、Start skills（RSC · migrate-from-nextjs）、反模式
- [参考](./reference) —— skills 清单表 + `intent` CLI 命令全表 + 安装/版本/许可/链接
