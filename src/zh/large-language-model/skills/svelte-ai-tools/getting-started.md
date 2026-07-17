---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 sveltejs/ai-tools（官方，Svelte 5）的 `.claude-plugin`（name svelte，v1.0.4）、README 与 SKILL.md 编写。

## 速查

- **是什么**：Svelte 官方 agent 编码工具，一个 Claude 插件打包 **MCP + 2 skills + agent + LSP**
- **装**：Claude 插件市场装 `svelte` 插件，或接官方远程 MCP `https://mcp.svelte.dev`
- **MCP**：`@sveltejs/mcp`，STDIO + streamable HTTP，核心工具 `svelte-autofixer`
- **两 skills**：`svelte-code-writer`（CLI 查文档 + 分析代码）· `svelte-core-bestpractices`（runes 最佳实践）
- **agent**：`svelte-file-editor`（编辑 .svelte，配 LSP `svelteserver`）
- **CLI 三命令**：`npx @sveltejs/mcp list-sections` / `get-documentation "$state,$derived"` / `svelte-autofixer <code|path>`
- **坑**：CLI 传 runes 代码把 `$` 转义成 `\$`；老项目加 `--svelte-version 4`
- **官方**：sveltejs org，MIT，Svelte 5 + SvelteKit

## 安装

Svelte AI Tools 以一个官方 Claude 插件（`.claude-plugin`，name `svelte`）交付，插件里声明了 MCP 服务器、skills、agent 与 LSP。安装后：

- **Claude 插件**：从插件市场安装 `svelte` 插件，自动接入远程 MCP、注册 skills 与 `svelte-file-editor` agent、挂上 `svelteserver` LSP。
- **远程 MCP**：也可直接把 `https://mcp.svelte.dev` 作为 MCP 服务器接入（STDIO 或 streamable HTTP），获得官方文档与 autofix 能力。
- **多编辑器**：仓库 `plugins/` 下有 `claude` 与 `cursor` 两套，Cursor 用户有对应插件。

> MCP 服务器从**官方 Svelte 文档**拉 tools/prompts/resources，让 AI 用最新文档而非可能过时的训练数据。

## 四件套总览

| 组件 | 是什么 | 作用 |
| --- | --- | --- |
| **MCP 服务器** `@sveltejs/mcp` | 官方远程 MCP（mcp.svelte.dev） | 查官方文档、`svelte-autofixer` 分析/修复 Svelte 代码 |
| **skill** `svelte-code-writer` | CLI 工具技能 | 教 agent 用 `@sveltejs/mcp` CLI 查文档段落、跑 autofixer |
| **skill** `svelte-core-bestpractices` | 最佳实践技能 | 讲 runes（`$state`/`$derived`/`$effect`/`$props`）该怎么写 |
| **agent** `svelte-file-editor` | 专用子代理 | 在 LSP 加持下编辑 .svelte 文件 |
| **LSP** `svelteserver` | 语言服务器（`--stdio`） | 诊断、导航、hover，真实语言智能 |

## svelte-code-writer 的 CLI 三命令

`svelte-code-writer` skill 的核心是 `@sveltejs/mcp` CLI（用 `npx` 调用）：

```bash
# 1. 列出所有 Svelte 5 / SvelteKit 文档段落
npx @sveltejs/mcp list-sections

# 2. 取指定段落的完整文档（先 list 再 get）
npx @sveltejs/mcp get-documentation "$state,$derived,$effect"

# 3. 分析 Svelte 代码并给修复建议（定稿前必跑）
npx @sveltejs/mcp svelte-autofixer ./src/lib/Component.svelte
```

工作流：**拿不准语法** → `list-sections` + `get-documentation`；**审查/调试** → `svelte-autofixer`；**定稿前必跑** autofixer 校验。

> ⚠️ 终端传含 runes 的行内代码，`$` 要转义为 `\$`（防 shell 变量替换）：`npx @sveltejs/mcp svelte-autofixer '<script>let count = \$state(0);</script>'`。老项目加 `--svelte-version 4`。

## Svelte 5 定位

技能全面向 **Svelte 5**：runes（`$state`/`$derived`/`$effect`/`$props`/`$inspect`）、深响应式与 `$state.raw`、`$derived.by`、`{@attach}`、`createSubscriber`。`svelte-autofixer` 会检测 rune 用法问题（如在 `$effect` 里给 `$state` 赋值）。

## 下一步

- [指南](./guide-line) —— MCP + autofixer 原理、两 skills、svelte-file-editor agent、LSP、runes 最佳实践深入
- [参考](./reference) —— CLI 命令表、skills 清单、安装/多编辑器、版本
