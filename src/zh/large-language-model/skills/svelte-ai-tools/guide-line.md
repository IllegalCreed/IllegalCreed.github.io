---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 sveltejs/ai-tools（官方）的 CLAUDE.md、两个 SKILL.md 与插件配置编写。

## 速查

- **MCP 架构**：`tmcp` 库 + HTTP/STDIO 传输 + Valibot schema；核心工具 `svelte-autofixer`
- **分析引擎**：`svelte-eslint-parser` + TS parser 解析 AST → scope 分析 → rune 检测 → autofixer 修复
- **svelte-code-writer**：写/改/分析任何 .svelte / .svelte.ts 时**必用**；三命令 list-sections / get-documentation / svelte-autofixer
- **svelte-core-bestpractices**：`$state` 只给响应式变量、`$state.raw` 大对象、`$derived` 优先于 `$effect`、`$effect` 是逃生舱少用、`$props` 当会变
- **svelte-file-editor agent**：配 `svelteserver` LSP 编辑 .svelte
- **协同**：查文档 → 写代码 → autofixer 校验 → LSP 诊断

## MCP 服务器与 svelte-autofixer

官方 MCP 服务器 `@sveltejs/mcp` 的实现（`src/lib/mcp/index.ts`）：

- **传输层**：HTTP（`HttpTransport`）+ STDIO（`StdioTransport`）双支持，基于 `tmcp` 库
- **schema 校验**：Valibot（`ValibotJsonSchemaAdapter`）
- **核心工具**：`svelte-autofixer`——分析 Svelte 代码、给建议/修复

**代码分析引擎**（`src/lib/server/analyze/`）：

- **Parser**：`svelte-eslint-parser` + TypeScript parser 解析 Svelte 组件为 AST
- **Scope 分析**：跨 AST 追踪变量、引用、作用域
- **Rune 检测**：识别 Svelte 5 runes（`$state`/`$effect`/`$derived` 等）
- **Autofixer**：访问者模式，如 `assign_in_effect`——检测在 `$effect` 里给 `$state` 变量赋值（典型反模式）

> MCP 还从官方文档拉 tools/prompts/resources，`get-documentation` 取到的是**最新官方文档**。

## 两个 skills

### svelte-code-writer（CLI 工具技能）

- **触发**：创建/编辑/分析任何 Svelte 组件（.svelte）或模块（.svelte.ts / .svelte.js）时**必用**；最好在 `svelte-file-editor` agent 内执行
- **三命令**：`list-sections`（列文档段落）→ `get-documentation "<段落>"`（取全文）→ `svelte-autofixer "<code|path>"`（分析修复，`--async` / `--svelte-version 4|5`）
- **工作流**：拿不准语法先查文档；审查/调试跑 autofixer；**定稿前必跑** autofixer

### svelte-core-bestpractices（最佳实践技能）

讲写快、稳、现代 Svelte 代码，覆盖 reactivity / 事件 / 样式 / 库集成，带 `references/` 深文档。核心规则：

| Rune | 规则 |
| --- | --- |
| `$state` | 只给**需要响应式**的变量；对象/数组深响应式（proxy，有开销）；大对象只重赋值不改用 `$state.raw`（如 API 响应） |
| `$derived` | 从 state 计算优先用它、别用 `$effect`；可写；复杂表达式用 `$derived.by` |
| `$effect` | **逃生舱、尽量避免**；别在里面改 state；同步外部库用 `{@attach}`，响应交互用事件处理，调试用 `$inspect`，观察外部用 `createSubscriber`；别包 `if (browser)` |
| `$props` | 当作会变；依赖 props 的值用 `$derived` |

## svelte-file-editor agent + LSP

- **agent** `svelte-file-editor`：专门编辑 .svelte 文件的子代理，配合 skills + MCP
- **LSP**：插件声明 `lspServers.svelte`（`svelteserver --stdio`，`.svelte` → svelte 语言），提供诊断、导航、hover——让编辑有真实语言智能，而非纯文本改动

## 四件如何协同

```text
拿不准 Svelte 语法
   → svelte-code-writer: list-sections + get-documentation（查官方最新文档）
写/改 .svelte
   → svelte-file-editor agent + LSP（svelteserver 诊断/导航/hover）
   → 遵循 svelte-core-bestpractices（runes 规则）
定稿前
   → svelte-autofixer 校验 rune 用法，有问题即修
```

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 用 `$effect` 计算派生值 | 该用 `$derived`；`$effect` 是逃生舱 |
| 在 `$effect` 里给 `$state` 赋值 | autofixer 的 `assign_in_effect` 专抓这个 |
| 大 API 响应对象用 `$state({...})` | 深响应式 proxy 有开销，只重赋值用 `$state.raw` |
| 依赖 props 的值不用 `$derived` | props 变了值不更新 |
| CLI 传 runes 不转义 `$` | 被 shell 变量替换，要写 `\$` |
| 跳过 svelte-autofixer 就定稿 | 技能要求定稿前必跑校验 |

## 下一步

- [参考](./reference) —— CLI 命令表、skills/agent 清单、安装/多编辑器、版本、许可
- 上游：[sveltejs/ai-tools](https://github.com/sveltejs/ai-tools) · [svelte.dev/docs/mcp](https://svelte.dev/docs/mcp)
