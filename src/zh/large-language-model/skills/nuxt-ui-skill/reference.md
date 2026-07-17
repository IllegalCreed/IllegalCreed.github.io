---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 nuxt/ui 官方 skill（`skills/nuxt-ui/SKILL.md` 及 `references/`，v4 分支）编写。

## 速查

- **装**：`npx skills add nuxt/ui`（`--agent claude-code` / `--global`）；或 `claude skill add https://github.com/nuxt/ui/tree/v4/skills/nuxt-ui`
- **触发**：`/nuxt-ui`
- **MCP**：`claude mcp add --transport http nuxt-ui https://ui.nuxt.com/mcp`（查组件 API）
- **references**：4 guidelines + 5 layouts + 4 recipes + 1 components 索引 = 14 个，按路由表渐进加载
- **版本**：Nuxt UI **v4**（Reka UI + Tailwind CSS + Tailwind Variants，125+ 组件）
- **许可**：MIT；仓库 `nuxt/ui`（官方 org，★6.7k）

## 能力清单

| 维度 | 内容 |
| --- | --- |
| 名称 | Nuxt UI Skill（`skills/nuxt-ui`） |
| 归属 | nuxt 官方组织 `nuxt/ui` 仓库（v4 分支） |
| 类型 | 单库 usage skill（教用 Nuxt UI v4 建界面） |
| 目标库 | Nuxt UI v4（Reka UI + Tailwind CSS + Tailwind Variants，125+ 无障碍 Vue 组件） |
| 覆盖环境 | Nuxt、Vue (Vite)、Laravel (Vite+Inertia)、AdonisJS (Vite+Inertia) |
| 教的内容 | 安装、主题、组件选型、composables、表单、overlays、布局、官方模板 |
| 配套 | Nuxt UI MCP server（供组件精确 API） |
| 格式 | agentskills.io 开放格式 |
| 许可 | MIT |

## 安装与多 agent

```bash
# skills CLI（推荐，支持 35+ agents）
npx skills add nuxt/ui
npx skills add nuxt/ui --agent cursor
npx skills add nuxt/ui --agent claude-code
npx skills add nuxt/ui --global

# Claude Code 直接加 GitHub 路径
claude skill add https://github.com/nuxt/ui/tree/v4/skills/nuxt-ui
```

支持 35+ agent：Cursor、Claude Code、Codex、Windsurf、Cline 等。触发：对话里 `/nuxt-ui`。

## 五条核心铁律

| # | 铁律 |
| --- | --- |
| 1 | 永远用 `UApp` 包住应用（toast/tooltip/overlay/i18n 依赖它） |
| 2 | 永远用语义色（`text-default`/`bg-elevated`/`border-muted`），禁裸调色板色 |
| 3 | 读生成主题文件找 slot 名：Nuxt `.nuxt/ui/<component>.ts` / Vue `node_modules/.nuxt-ui/ui/<component>.ts` |
| 4 | 覆盖优先级（高者胜）：`ui` prop / `class` prop → 全局 config → 主题默认 |
| 5 | 图标 `i-{collection}-{name}` 格式，默认 `lucide` |

## references 结构

| 目录 | 文件 | 用途 |
| --- | --- | --- |
| `guidelines/` | design-system, component-selection, conventions, forms | 设计决策与约定 |
| `layouts/` | landing, dashboard, docs, chat, editor | 整页结构模式 |
| `recipes/` | data-tables, auth, overlays, navigation | 常见任务完整套路 |
| 根 | components.md | 分类组件索引 |

`SKILL.md` 带路由表（任务→加载哪些 reference），**按需渐进加载**，不一次全拉。

## Nuxt UI MCP 工具

| 工具 | 作用 |
| --- | --- |
| `search_components` | 按名/描述/类别找组件（无参=列全部） |
| `search_composables` | 找 composable |
| `search_icons` | 搜 Iconify 图标（默认 lucide），返 `i-{prefix}-{name}` |
| `get_component` | 组件完整文档 + 用例 |
| `get_component_metadata` | props/slots/events（轻量，无文档正文） |
| `get_example` | 真实代码示例 |

分工：**MCP 供 API（组件接受什么），skill 供用法（何时/怎么用好）**。

## 7 语义色

| 语义色 | 默认调色板 |
| --- | --- |
| `primary` | green |
| `secondary` | blue |
| `success` | green |
| `info` | blue |
| `warning` | yellow |
| `error` | red |
| `neutral` | slate |

## 安装 Nuxt UI（Nuxt 示例）

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css']
})
```

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";
```

```vue
<!-- app.vue -->
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

Vue (Vite) 用 `@nuxt/ui/vite` 插件 + `@nuxt/ui/vue-plugin`，根 div 加 `class="isolate"`；Inertia 用 `ui({ router: 'inertia' })`。

## 与相邻叶的边界

- **[Nuxt Skills](../nuxt-skills/)（批 4）**：社区 `onmax/nuxt-skills`，21-skill 全生态（含一个 nuxt-ui skill）；本叶是官方单库
- **[shadcn Skill](../shadcn-skill/)**：同「组件系统」组的另一 UI 库官方 skill（React 侧对照）
- **Nuxt UI MCP**：非本叶（是 skill 的配套 MCP server），供组件精确 API

## 资源链接

- skill 源：[nuxt/ui · skills/nuxt-ui](https://github.com/nuxt/ui/tree/v4/skills/nuxt-ui)（MIT）
- 文档：[Nuxt UI · AI Skills](https://ui.nuxt.com/docs/getting-started/ai/skills) · [Nuxt UI MCP](https://ui.nuxt.com/docs/getting-started/ai/mcp)
- 官网：[ui.nuxt.com](https://ui.nuxt.com)
- 开放格式：[agentskills.io](https://agentskills.io)
