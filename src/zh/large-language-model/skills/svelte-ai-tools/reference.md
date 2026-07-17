---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 sveltejs/ai-tools（官方）的插件配置、SKILL.md 与 CLI 编写。

## 速查

- **装**：Claude 插件市场装 `svelte` 插件；或接远程 MCP `https://mcp.svelte.dev`
- **CLI**：`npx @sveltejs/mcp list-sections` / `get-documentation "<段>"` / `svelte-autofixer "<code|path>"`
- **skills**：`svelte-code-writer` · `svelte-core-bestpractices`
- **agent**：`svelte-file-editor`（配 `svelteserver` LSP）
- **官方**：sveltejs org，MIT，插件 v1.0.4，Svelte 5 + SvelteKit

## CLI 命令（@sveltejs/mcp）

| 命令 | 作用 |
| --- | --- |
| `npx @sveltejs/mcp list-sections` | 列出所有 Svelte 5 / SvelteKit 文档段落（标题 + 路径） |
| `npx @sveltejs/mcp get-documentation "<s1>,<s2>"` | 取指定段落完整文档（先 list 再 get） |
| `npx @sveltejs/mcp svelte-autofixer "<code\|path>"` | 分析 Svelte 代码、给修复 |
| `svelte-autofixer ... --async` | 启用 async Svelte 模式（默认 false） |
| `svelte-autofixer ... --svelte-version 4` | 目标版本 4 或 5（默认 5） |

> 传含 runes 的行内代码，`$` 转义为 `\$`。

## 组件清单

| 类型 | 名称 | 说明 |
| --- | --- | --- |
| MCP | `@sveltejs/mcp` | 官方 MCP（mcp.svelte.dev），HTTP/STDIO，`tmcp` + Valibot |
| MCP 工具 | `svelte-autofixer` | AST 分析（svelte-eslint-parser + TS）、rune 检测、修复 |
| skill | `svelte-code-writer` | CLI 查文档 + 分析；写 .svelte 时必用 |
| skill | `svelte-core-bestpractices` | runes 最佳实践 + `references/` |
| agent | `svelte-file-editor` | 编辑 .svelte 的专用子代理 |
| LSP | `svelteserver` | `--stdio`，诊断/导航/hover |

## Svelte 5 runes 规则速览

| Rune | 要点 |
| --- | --- |
| `$state` | 只给响应式变量；对象/数组深响应式（proxy）；大对象只重赋值用 `$state.raw` |
| `$derived` | 从 state 计算优先；可写；复杂用 `$derived.by`（给函数不是表达式） |
| `$effect` | 逃生舱，少用；别在里面改 state；别包 `if (browser)` |
| `$props` | 当会变；依赖 props 的值用 `$derived` |
| `$inspect` / `$inspect.trace` | 调试用 |
| `{@attach}` / `createSubscriber` | 同步外部库 / 观察外部状态 |

## 安装与多编辑器

- **Claude 插件**：插件市场装 `svelte`（`.claude-plugin/plugin.json`，v1.0.4，含 MCP + skills + agent + LSP）
- **远程 MCP**：`https://mcp.svelte.dev`（STDIO / streamable HTTP）
- **Cursor**：仓库 `plugins/cursor/` 有对应插件（skills：svelte-code-writer / svelte-core-bestpractices）

## 版本与许可

- 插件 v1.0.4，author Svelte，MIT
- 面向 Svelte 5（runes）；老项目 `--svelte-version 4`
- 源：`sveltejs/ai-tools`（官方）

## 贡献

改 `sveltejs/ai-tools`（MCP 服务器 + plugins）提 PR；MCP 本地开发见 CLAUDE.md（`pnpm dev`、Drizzle ORM、MCP inspector）。

## 资源链接

- 仓库：[sveltejs/ai-tools](https://github.com/sveltejs/ai-tools)
- 官方文档：[svelte.dev/docs/mcp](https://svelte.dev/docs/mcp) · [svelte.dev/docs/ai/claude-plugin](https://svelte.dev/docs/ai/claude-plugin)
- 远程 MCP：[mcp.svelte.dev](https://mcp.svelte.dev)
- 相关叶：[Agent Skills 规范与生态](../agent-skills-spec/)（MCP 与 skills）
