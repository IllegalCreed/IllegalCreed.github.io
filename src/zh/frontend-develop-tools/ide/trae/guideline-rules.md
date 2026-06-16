---
layout: doc
outline: [2, 3]
---

# 规则与 Agent

> 基于 Trae 官方文档（2026）。规则、MCP、自定义 Agent 是 Trae 进阶能力的核心。

## Rules：用户规则与项目规则

| 类型 | 作用域 | 落地 |
| --- | --- | --- |
| **User Rules** | 所有项目（个人偏好） | 存设置中，**不生成文件** |
| **Project Rules** | 当前项目 | 自动生成 `.trae/rules/` 下的 Markdown 文件 |

**四种 Application Mode**（对应 frontmatter）：

| 模式 | 字段 |
| --- | --- |
| Always Apply | `alwaysApply: true` |
| Apply to Specific Files | `globs` |
| Apply Intelligently | `description`（AI 按描述判断） |
| Apply Manually | 需 `#Rule` 手动引用 |

::: tip 关键点（易错）
- `#Rule` **优先级最高**：手动引用可让任何类型规则强制本轮生效
- `.trae/rules/` 支持子文件夹，**最多 3 级嵌套**（第 4 级不可读）
- 子目录的 `.trae/rules/` 或 `AGENTS.md` 仅在涉及该目录文件时生效（模块级隔离）
:::

- 兼容外部规则：项目根 `AGENTS.md`（跨 IDE 通用）、`CLAUDE.md` / `CLAUDE.local.md`（需在 Settings → Rules 打开开关）
- **Git 提交规则**：规则文件加 `scene: git_message` 字段，或生成 `git-commit-message.md`

## MCP：接入外部工具

- 在 Trae 中 **agent 作为 MCP client** 调用工具；MCP 需挂到自定义 agent 上
- **项目级配置**：项目根 `.trae/mcp.json`，需在 `Settings > MCP` 打开 `Enable Project MCP`
- 顶层键 **`mcpServers`**；stdio 用 `command`/`args`/`env`，HTTP 用 `url`/`headers`
- 三种传输：`stdio` / `SSE` / `Streamable HTTP`；变量仅支持 `${workspaceFolder}`

::: warning 易错点
stdio 的 `command` **不能含空格**；MCP 变量**仅** `${workspaceFolder}`（不支持其他 VS Code 风格变量）。
:::

```json
// .trae/mcp.json
{
  "mcpServers": {
    "server-name": { "command": "npx", "args": ["mcp-server"] }
  }
}
```

## 自定义 Agent

聊天里输 `@` → Create Agent（Smart Generate 智能生成 / Manual 手动）：

- 参数：Avatar / Name / Prompt / Callable by other agents / Tools
- **Tools 两类**：MCP servers + 5 个内置工具（**Read / Edit / Terminal / Preview / Web search**）
- **仅 SOLO Agent 能调用自定义 agent**（普通 Agent / IDE mode 不能编排子 agent）
- 可分享/导入（含 prompt + MCP 配置；分享前清除敏感信息）
