---
layout: doc
outline: [2, 3]
---

# 规则与工作流

> 基于 Windsurf / Devin Desktop 官方文档（2026）。规则、记忆、MCP、工作流是 Cascade 持久化与扩展的关键。

## Rules：给 Cascade 的规约

四层作用域（注意新旧路径双轨）：

| 作用域 | 路径 | 上限 |
| --- | --- | --- |
| Workspace（首选） | `.devin/rules/*.md` | 12,000 字符/文件 |
| Workspace（legacy） | `.windsurf/rules/*.md` 或单文件 `.windsurfrules` | — |
| Global（全局） | `~/.codeium/windsurf/memories/global_rules.md` | 6,000 字符 |
| System（企业） | 系统目录（IT 部署，只读） | — |

四种激活模式（frontmatter `trigger`）：

- `always_on`：完整内容注入每条消息
- `model_decision`：仅 description 进 prompt，Cascade 判断相关时读全文
- `glob`：读/改匹配 glob 的文件时激活
- `manual`：需 `@rule-name` 手动唤起

::: tip 全局规则路径反直觉
全局规则仍在 `~/.codeium/windsurf/` 下（保留 Codeium 历史路径），而非 `.devin/`。
:::

## Memories：自动记忆

- 自动生成（Cascade 觉得值得记时）或手动（对它说 `create a memory of …`）
- 存 `~/.codeium/windsurf/memories/`，**绑定单个 workspace**

::: warning 易错
Memories **只在本机、不跨工作区、不进仓库、不消耗 credits**；要团队共享持久上下文，应写 Rules 或 `AGENTS.md`。
:::

## MCP：接入外部工具

- 配置文件 `~/.codeium/windsurf/mcp_config.json`，顶层键 **`mcpServers`**（与 Claude Desktop 一致）
- stdio 用 `command`/`args`/`env`，远程用 `serverUrl`/`headers`；支持 `${env:}`/`${file:}` 插值
- **Cascade 任意时刻最多访问 100 个工具**

## Workflows：可复用步骤序列

- 存 `.windsurf/workflows/*.md`，用斜杠命令 `/[workflow-name]` 调用
- **manual-only**：Cascade **永不自动**调用 workflow（与 Rules 可自动激活相反）
- 12,000 字符/文件，可在 workflow 内调用其它 workflow

## Skills / Rules / Workflows 三者区分

| | Skills | Rules | Workflows |
| --- | --- | --- | --- |
| 用途 | 多步流程 + 支撑文件 | 行为准则 | prompt 模板 |
| 触发 | 模型判断 / `@mention` | 配置驱动（激活模式） | **仅手动斜杠命令** |

## AGENTS.md

根级 `AGENTS.md` = always-on 注入每条消息；子目录级 = 仅访问匹配 `<目录>/**` 的文件时激活。与 `.devin/rules/` 共用同一指令引擎，但 AGENTS.md 靠**位置**自动 scoping，rules 靠 frontmatter + glob。
