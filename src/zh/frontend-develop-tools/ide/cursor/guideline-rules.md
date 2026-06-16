---
layout: doc
outline: [2, 3]
---

# 规则与上下文

> 基于 Cursor 官方文档（2026）。规则、忽略文件、MCP 与隐私是 Cursor 进阶使用的关键。

## Rules：给 AI 的项目规约

**Project Rules** 存于 `.cursor/rules/`，扩展名必须是 **`.mdc`**（纳入版本控制，可子目录嵌套）；纯 `.md` 会被忽略（缺 frontmatter）。

`.mdc` frontmatter 三字段：

| 字段 | 含义 |
| --- | --- |
| `alwaysApply` | 是否每次会话无条件注入 |
| `description` | 规则用途，供 Agent 判断是否拉取 |
| `globs` | 文件匹配模式，决定自动附加时机 |

**四种规则类型**由这三字段组合推导：

| 类型 | 配置 | 行为 |
| --- | --- | --- |
| Always | `alwaysApply: true` | 始终注入（此时 globs/description 被忽略） |
| Auto Attached | `false` + `globs` | 上下文出现匹配文件时自动附加 |
| Agent Requested | `false` + `description` | Agent 读 description 自行决定是否拉取 |
| Manual | `false` + 两者都无 | 仅 `@规则名` 显式调用 |

- **Project / User / Team Rules**：项目级（随仓库）/ 全局（仅 Agent·Chat 用，Inline Edit 用不到）/ 组织级（dashboard 下发）
- **`.cursorrules`**（根目录单文件）是 **legacy**，已被 `.cursor/rules/*.mdc` 取代
- 也支持无 frontmatter 的 **`AGENTS.md`**（可放子目录，就近覆盖）

::: warning 高频易错
`alwaysApply: true` 时 `globs` 和 `description` 会被忽略；旧教程里的根目录 `.cursorrules` 已非推荐写法。
:::

## 忽略文件：两个别搞混

| 文件 | 作用 |
| --- | --- |
| `.cursorignore` | **尽力**屏蔽索引 + 所有 AI 访问（Tab/Agent/@/索引） |
| `.cursorindexingignore` | **仅**排除索引，文件对 AI 功能仍可见 |

::: warning best-effort 的陷阱
`.cursorignore` 是 best-effort，不保证 100% 不上传；且 **Terminal 与 MCP 工具仍能访问**被忽略的代码。语法同 `.gitignore`，但 `!` 取消忽略对「父目录已被 `*` 排除」的文件无效。
:::

## MCP：接入外部工具

- 配置文件：项目级 `.cursor/mcp.json`、全局 `~/.cursor/mcp.json`
- 顶层键是 **`mcpServers`**（注意与 VS Code 的 `servers` 不同）
- 本地用 `command`+`args`+`env`，远程用 `url`+`headers`
- 默认每次调用 MCP 工具前都询问；新版可用 Auto-review + `permissions.json` 白名单免确认

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["mcp-server"],
      "env": { "API_KEY": "value" }
    }
  }
}
```

## 隐私模式

开启 Privacy Mode（`Cmd+Shift+J` → General）后，代码**绝不被用于训练**并获得零数据保留（ZDR），适用于发往 OpenAI / Anthropic / Google 的请求。

::: warning BYOK 例外
使用自带 API key（BYOK）时**不享 ZDR**，转而遵循你自己 provider 的隐私政策。Enterprise 版隐私模式默认开启、可全组织强制。
:::
