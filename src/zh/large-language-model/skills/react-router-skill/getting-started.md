---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 remix-run/react-router 官方 Agent Skill（`.agents/skills/react-router`）与已归档的 remix-run/agent-skills（2026-07 读取）编写。

## 速查

- **装（新，推荐）**：`npx skills add https://github.com/remix-run/react-router --skill react-router`
- **装（旧，已归档仓库）**：`npx skills add remix-run/agent-skills`（可加 `--skill react-router-framework-mode` 等选单模式）
- **一句话**：React Router 官方随库技能，教 agent 用**当前安装版本**的 API 写 React Router，而非过时训练数据
- **演进三步**：① skill 从独立仓库 `remix-run/agent-skills`（已 ARCHIVED）迁入主仓库 `remix-run/react-router/.agents/skills/react-router/`；② 官方文档发布到 `node_modules`；③ skill 瘦身，引导 agent 直接读 `node_modules` 里的文档
- **文档源**：`node_modules/react-router/docs/`（`index.md` / `start/` / `how-to/` / `explanation/` / `upgrading/`），随包版本一致
- **模式**：Framework / Data / Declarative / unstable RSC（先识别模式再动手）
- **CLI 集成**：`create-react-router` 新建项目时可默认带上该技能
- **许可**：MIT

## 安装

新版（迁入主仓库后，官方推荐）：

```bash
npx skills add https://github.com/remix-run/react-router --skill react-router
```

它把 `react-router` 这个技能装进你的项目，让 AI agent 在写 / 改 React Router 代码时引用它。

旧版（独立仓库 `remix-run/agent-skills`，现已归档，仅作了解）：

```bash
# 装全部三个模式技能
npx skills add remix-run/agent-skills

# 或只装某一个模式
npx skills add remix-run/agent-skills --skill react-router-framework-mode
npx skills add remix-run/agent-skills --skill react-router-data-mode
npx skills add remix-run/agent-skills --skill react-router-declarative-mode
```

> 旧仓库 README 顶部已挂 WARNING：仓库已归档，改用主仓库里的技能。新项目请用新命令。

## 从独立仓库到主仓库：演进三步

React Router 官方把 Agent Skill 的托管与形态做了一次关键调整（见 [discussion #15099](https://github.com/remix-run/react-router/discussions/15099)），核心是三步：

1. **迁入主仓库**：把 React Router Agent Skill 直接放进 [`remix-run/react-router`](https://github.com/remix-run/react-router/tree/main/.agents/skills/react-router) 的 `.agents/skills/react-router/`，与库同仓维护、同步版本——独立仓库 `remix-run/agent-skills` 随之归档。
2. **文档进 `node_modules`**：官方把 React Router 的 markdown 文档随 npm 包一起发布到 `node_modules/react-router/docs/`，于是「文档版本」天然等于「你装的库版本」。
3. **skill 瘦身 + 引导读本地文档**：把 skill 本体大幅精简，改为**引导 agent 直接去读 `node_modules` 里的最新文档**，而不是把大量细节固化进 skill 或依赖模型训练数据。

这一步的工程价值在于：**技能不再自带一份可能滞后的知识副本，而是把「真相源」指向随包安装、与版本对齐的一手文档。** 库升级了，文档跟着升级，agent 读到的自然是新版——避免「skill 说一套、装的库是另一套」。

## `node_modules` 文档策略

新 skill 明确写道：把随包安装的文档当**真相源**（source of truth）。

```txt
node_modules/react-router/docs/
├── index.md
├── start/
├── how-to/
├── explanation/
└── upgrading/
```

- 当 skill 里引用 `react-router/docs/...` 时，就去读 `node_modules/react-router/docs/` 下对应文件——**版本随你安装的包**。
- 多数文档顶部有**模式标记**，例如 `[MODES: framework, data, declarative]`；只有标记与当前应用模式匹配时才套用该文档。
- 若安装的版本没带本地 docs：在 React Router 仓库里工作时回退到仓库的 `docs/`；在消费方应用里则回退到**版本匹配**的官网文档。
- RSC 主要文档在 `node_modules/react-router/docs/how-to/react-server-components.md`。

这套策略让 agent 的输出与项目实际依赖版本对齐，是本 skill 最有价值的设计。

## `create-react-router` 集成

官方在迁移说明里预告：**新建项目时加上 Agent Skill 会成为 React Router CLI 的一部分**——也就是用 `create-react-router` 起新项目时可默认带上 `react-router` 技能，无需手动再 `skills add`。对「新项目即刻具备版本对齐的 agent 指引」很友好。

## 下一步

- [指南](./guide-line) —— 三模式（+RSC）各覆盖什么、skill 瘦身设计、`loader`/`action`/表单、渲染策略、反模式
- [参考](./reference) —— 三模式速查表、安装命令、`references/` 组织、`node_modules` 文档路径、版本、许可、链接
