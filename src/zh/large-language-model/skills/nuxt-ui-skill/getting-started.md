---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 nuxt/ui 官方 skill（`skills/nuxt-ui/SKILL.md`，v4 分支）与 [Nuxt UI · AI Skills 文档](https://ui.nuxt.com/docs/getting-started/ai/skills) 编写。

## 速查

- **是什么**：nuxt 官方 `nuxt/ui` 仓库自带的 usage skill，教 AI 用 **Nuxt UI v4** 建界面（125+ 组件，基于 Reka UI + Tailwind CSS + Tailwind Variants）
- **vs 社区 Nuxt Skills**：本叶=官方单库（只管 Nuxt UI）；[Nuxt Skills](../nuxt-skills/)=社区 21-skill 全生态（含一个 nuxt-ui skill）
- **装**：`npx skills add nuxt/ui`（skills CLI，支持 **35+ agents**）；指定 `--agent claude-code`；全局 `--global`
- **Claude Code 备选**：`claude skill add https://github.com/nuxt/ui/tree/v4/skills/nuxt-ui`
- **触发**：对话里输入 `/nuxt-ui`
- **配套 MCP**：组件精确 API 查 [Nuxt UI MCP](https://ui.nuxt.com/mcp)（`claude mcp add --transport http nuxt-ui https://ui.nuxt.com/mcp`）——skill 教用法、MCP 供 API
- **入口**：`SKILL.md` + 路由表，按任务渐进加载 references；MIT

## 官方定位：官方 skill，不是社区版

Nuxt UI Skill 住在 **nuxt 官方组织** 的 `nuxt/ui` 仓库里（`skills/nuxt-ui/SKILL.md`，v4 分支，★6.7k，MIT）。它是 **Nuxt UI 组件库自带的官方 usage skill**——随库同源、与 v4 对齐，教 AI 编码 agent 用 Nuxt UI 建界面。

与批 4 的 [Nuxt Skills](../nuxt-skills/) 别混淆：

| 维度 | **Nuxt UI Skill（本叶）** | Nuxt Skills（批 4） |
| --- | --- | --- |
| 仓库 | `nuxt/ui`（官方 org） | `onmax/nuxt-skills`（社区个人） |
| 范围 | **只聚焦 Nuxt UI 组件库** | Nuxt 全生态 21 skill（nuxt/vue/nuxthub/content/vueuse…） |
| 性质 | 官方、随库同源 | 社区、自动从上游重生成 |
| 关系 | — | 其 21 skill 中含一个 `nuxt-ui` skill |

两者都遵 agentskills.io 开放格式、都用 skills CLI 装，但一个是官方单库权威、一个是社区全家桶。

## Nuxt UI v4 总览

Nuxt UI 是构建在 [Reka UI](https://reka-ui.com/)（无障碍原语）+ [Tailwind CSS](https://tailwindcss.com/) + [Tailwind Variants](https://www.tailwind-variants.org/) 之上的 Vue 组件库，**125+ 个无障碍组件**。它不止能在 Nuxt 里用：

- **Nuxt** — `modules: ['@nuxt/ui']`
- **Vue (Vite)** — `@nuxt/ui/vite` 插件 + `@nuxt/ui/vue-plugin`
- **Laravel（Vite + Inertia）** 和 **AdonisJS（Vite + Inertia）** — `ui({ router: 'inertia' })`

skill 就是教 agent 在这些环境里，照官方模式把 Nuxt UI 用对、用好。

## 安装 skill：一条命令，35+ agents

skills CLI 是推荐方式：

```bash
# 装进已检测到的 agent（交互式挑选）
npx skills add nuxt/ui

# 指定 agent
npx skills add nuxt/ui --agent cursor
npx skills add nuxt/ui --agent claude-code

# 全局安装
npx skills add nuxt/ui --global
```

支持 **35+ 种 agent**：Cursor、Claude Code、Codex、Windsurf、Cline 等。Cursor 还能点按钮或在「设置 > Skills」里填 GitHub URL 直接装。Claude Code 也可直接加 GitHub 路径：

```bash
claude skill add https://github.com/nuxt/ui/tree/v4/skills/nuxt-ui
```

## 触发：`/nuxt-ui`

装好后，在 agent 对话里输入 `/nuxt-ui` 即可触发这个 skill。触发后 agent 拿到 `SKILL.md` 入口——里面有五条核心铁律、参考文件清单和**路由表**（什么任务该加载哪些 reference），然后按需渐进加载。

## 配套：Nuxt UI MCP server（查 API）

skill 与 [Nuxt UI MCP server](https://ui.nuxt.com/docs/getting-started/ai/mcp) 是**分工搭档**：

```bash
# Claude Code 加 MCP
claude mcp add --transport http nuxt-ui https://ui.nuxt.com/mcp
```

- **MCP**：给组件的精确 API——`search_components`、`search_composables`、`search_icons`、`get_component`、`get_component_metadata`、`get_example`。想知道**某组件接受什么 props/slots/events**，问 MCP。
- **skill**：教**何时用哪个组件、怎么建得好**。

一句话：**MCP 供 API，skill 供用法**。两者搭配是 Nuxt UI 官方推荐的 AI 工作流。

## 下一步

- [指南](./guide-line) —— usage skill 教什么、渐进披露 references、五条核心铁律、反模式
- [参考](./reference) —— 能力清单表、安装/多 agent、references 结构、版本、许可、链接
