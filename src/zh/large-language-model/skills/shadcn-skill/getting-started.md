---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 shadcn-ui/ui 官方 skill（`skills/shadcn/SKILL.md`）与 ui.shadcn.com 文档编写。

## 速查

- **是什么**：shadcn/ui 官方 agent 技能——管理 shadcn 组件/项目（加/搜/修/调/样式/组合）
- **触发**：处理 shadcn/ui、component registry、`--preset` 代码、含 `components.json` 的项目时
- **CLI**：`npx shadcn@latest`（按项目 packageManager 换 `pnpm dlx` / `bunx --bun`）
- **4 原则**：①先用现有组件（search）②组合而非重造 ③内建 variant 优先 ④语义色
- **项目上下文**：`npx shadcn@latest info --json`（配置 + 已装组件）· `docs <component>`（文档）
- **MCP**：shadcn MCP 一个 URL 接 registry，search/browse/install
- **官方**：shadcn-ui/ui，MIT；配套 `migrate-radix-to-base`

## 安装与接入

shadcn skill 随 shadcn/ui 生态提供，两种接入：

- **skill**：把官方 `skills/shadcn` 装入 agent 的 skills 目录（`user-invocable: false`，由 agent 在处理 shadcn 任务时自动触发）；`allowed-tools` 限定为 `Bash(npx shadcn@latest *)` 等 CLI。
- **shadcn MCP**（ui.shadcn.com/docs/mcp）：一个 MCP URL 接入 shadcn.io registry，让 AI 直接 search/browse/install 每个 block/icon/example。

> **CLI 运行约定**：所有命令用项目的包运行器——`npx shadcn@latest` / `pnpm dlx shadcn@latest` / `bunx --bun shadcn@latest`，按项目 `packageManager` 选择。

## 4 条原则

skill 开宗明义 4 原则：

1. **先用现有组件**——写自定义 UI 前，`npx shadcn@latest search` 查 registry（含社区 registry）
2. **组合，别重造**——设置页 = Tabs + Card + form controls；仪表盘 = Sidebar + Card + Chart + Table
3. **内建 variant 优先**——`variant="outline"`、`size="sm"`，别急着自定义样式
4. **用语义色**——`bg-primary`、`text-muted-foreground`，绝不用 `bg-blue-500` 这种裸值

## 项目上下文（project-aware）

skill 一上来就取项目上下文：

```bash
# 项目配置 + 已装组件（JSON）
npx shadcn@latest info --json

# 任意组件的文档 + 示例 URL
npx shadcn@latest docs <component>

# 加组件（搜到后）
npx shadcn@latest add <component>
```

> 组件以**源码**加入你的项目（不是黑盒依赖），可自由改。

## 一眼看懂：正确 vs 错误

```tsx
// 间距：gap-*，不是 space-y-*
<div className="flex flex-col gap-4">  // ✓
<div className="space-y-4">            // ✗

// 等宽高：size-*，不是 w-* h-*
<Avatar className="size-10">   // ✓
<Avatar className="w-10 h-10"> // ✗

// 状态色：Badge / 语义色，不是裸色
<Badge variant="secondary">+20.1%</Badge>          // ✓
<span className="text-emerald-600">+20.1%</span>   // ✗
```

## 下一步

- [指南](./guide-line) —— 6 大 Critical Rules、CLI/registry/preset、shadcn MCP、组合模式深入
- [参考](./reference) —— 规则文件清单、CLI 命令、MCP、preset、安装、许可
