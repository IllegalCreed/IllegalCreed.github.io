---
layout: doc
---

# Svelte AI Tools

Svelte AI Tools 是 **Svelte 官方**（sveltejs org，MIT）出品的一套 agent 编码工具，源在 `sveltejs/ai-tools`——README 自述「The official svelte MCP for all your agentic needs」。它以一个 Claude 插件（`.claude-plugin`，name `svelte`，v1.0.4）打包了**四件套**：①官方远程 **MCP 服务器** `@sveltejs/mcp`（mcp.svelte.dev，STDIO + streamable HTTP，从官方 Svelte 文档拉 tools/prompts/resources，核心工具 `svelte-autofixer`）；②两个 **skills**（`svelte-code-writer` 教用 CLI 查文档+分析代码、`svelte-core-bestpractices` 讲 runes 最佳实践）；③专用 **agent** `svelte-file-editor`（编辑 .svelte 文件）；④**LSP** 集成（`svelteserver --stdio`，诊断/导航/hover）。面向 **Svelte 5**（runes/reactivity）与 SvelteKit，让 AI 写出准确、可运行的现代 Svelte 代码。

## 评价

**优点**

- **Svelte 官方**：sveltejs org 出品、随框架演进、权威不漂移
- **四件套合一**：MCP + skills + agent + LSP 一个插件装齐，覆盖查文档→写代码→校验→编辑全链路
- **官方 MCP**：`@sveltejs/mcp`（mcp.svelte.dev），STDIO/HTTP 双传输，从**官方文档**拉资源，避免训练数据过时
- **svelte-autofixer**：解析 Svelte AST（svelte-eslint-parser + TS）、检测 Svelte 5 runes、发现问题并给修复（如 `$effect` 里给 `$state` 赋值）
- **runes 最佳实践内建**：`svelte-core-bestpractices` 讲清 `$state`/`$derived`/`$effect`/`$props` 该怎么用、何时别用
- **LSP 智能**：`svelteserver` 提供诊断/导航/hover，agent 编辑 .svelte 有真实语言智能
- **跨编辑器**：plugins 下有 claude 与 cursor 两套

**缺点 / 边界**

- **专注 Svelte 5**：面向 Svelte 5 runes；老 Svelte 4 项目部分指导需 `--svelte-version 4`
- **依赖 MCP/CLI**：查文档/autofix 靠 `@sveltejs/mcp` CLI 与 MCP 连接
- **terminal 转义坑**：CLI 传含 `$` runes 的代码要把 `$` 转义为 `\$`（防 shell 变量替换）
- **组合件多**：MCP + skills + agent + LSP 概念较多，需理解各自分工

## 适用场景

- 用 AI 写/改 Svelte 5 组件（.svelte）或模块（.svelte.ts/.svelte.js），要官方最佳实践
- 想让 agent 查**最新** Svelte/SvelteKit 官方文档（而非过时训练数据）
- 需要 `svelte-autofixer` 在定稿前自动校验 rune 用法
- 想要 LSP 级诊断/导航的 .svelte 编辑体验

## 边界

- **只服务 Svelte**：非通用技能
- **Svelte 5 优先**：runes 体系，老版本需指定版本
- **官方组合件**：MCP + 2 skills + agent + LSP，理解各自职责才好用
- **贡献到 sveltejs/ai-tools**：官方仓库

## 官方文档

[Svelte MCP 概览（svelte.dev/docs/mcp）](https://svelte.dev/docs/mcp) ｜ [Claude 插件（svelte.dev/docs/ai/claude-plugin）](https://svelte.dev/docs/ai/claude-plugin) ｜ [mcp.svelte.dev](https://mcp.svelte.dev)

## GitHub 地址

[sveltejs/ai-tools](https://github.com/sveltejs/ai-tools)（官方，MIT，"The official svelte MCP for all your agentic needs"）

## 内容地图

- [入门](./getting-started) —— 安装（Claude 插件 / MCP）、四件套总览、Svelte 5 定位
- [指南](./guide-line) —— MCP 服务器与 svelte-autofixer、两 skills、svelte-file-editor agent、LSP、runes 最佳实践
- [参考](./reference) —— MCP 工具/CLI 命令、skills 清单、安装/多编辑器、版本、许可

## 幻灯片地址

<a href="/SlideStack/svelte-ai-tools-slide/" target="_blank">Svelte AI Tools</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Svelte AI Tools 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
