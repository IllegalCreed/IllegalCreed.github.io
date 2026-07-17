---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 shadcn-ui/ui 官方 skill 的 SKILL.md、`rules/` 与 CLI 编写。

## 速查

- **skill 目录**：SKILL.md + `rules/`（styling/forms/composition/icons/chat）+ cli.md/registry.md/mcp.md/customization.md + agents/assets/evals
- **CLI**：`npx shadcn@latest` info / docs / search / add / preset / apply / init
- **MCP**：shadcn MCP（ui.shadcn.com/docs/mcp）接 registry
- **配套 skill**：`migrate-radix-to-base`
- **官方**：shadcn-ui/ui，MIT，★119k

## skill 目录结构

| 文件/目录 | 内容 |
| --- | --- |
| `SKILL.md` | 入口：原则 + 6 大 Critical Rules + Key Patterns + 组件选择表（~19KB） |
| `rules/styling.md` | className/gap/size/dark/cn/z-index 错误对 |
| `rules/forms.md` | FieldGroup/Field/InputGroup/ToggleGroup/校验 |
| `rules/composition.md` | Group 嵌套/触发/Title/Card/Tabs/Avatar |
| `rules/icons.md` | data-icon/尺寸/对象传入 |
| `rules/chat.md` | MessageScroller/Message/Bubble/Attachment |
| `cli.md` / `registry.md` / `mcp.md` / `customization.md` | CLI / registry / MCP / 定制 |
| `agents/` `assets/` `evals/` | 代理 / 资源 / 评测 |

## CLI 命令

| 命令 | 作用 |
| --- | --- |
| `shadcn@latest info --json` | 项目配置 + 已装组件 |
| `shadcn@latest docs <component>` | 组件文档 + 示例 URL |
| `shadcn@latest search` | 查 registry（含社区）现有组件 |
| `shadcn@latest add <component>` | 加组件源码进项目 |
| `shadcn@latest preset decode/url/open/resolve <code>` | preset 代码解析（**别手拼**） |
| `shadcn@latest apply <code>` | 既有项目应用 preset |
| `shadcn@latest init --preset <code>` | 初始化带 preset |

> 运行器按项目 `packageManager`：`npx` / `pnpm dlx` / `bunx --bun`。

## 4 原则

1. 先用现有组件（`search` registry）
2. 组合而非重造
3. 内建 variant 优先（`variant`/`size`）
4. 语义色（`bg-primary` 非 `bg-blue-500`）

## Key Patterns 速览

| 场景 | 正确 |
| --- | --- |
| 表单布局 | `FieldGroup` + `Field`（非 `div`+`Label`） |
| 校验 | `Field data-invalid` + 控件 `aria-invalid` |
| Button 图标 | `<Icon data-icon="inline-start" />`（无尺寸类） |
| 间距 | `flex flex-col gap-4`（非 `space-y-4`） |
| 等宽高 | `size-10`（非 `w-10 h-10`） |
| 状态色 | `Badge variant` / 语义 token |

## shadcn MCP

ui.shadcn.com/docs/mcp——一个 MCP URL 接 shadcn.io registry，AI 直接 search/browse/install 每个 block/icon/example。与 skill（规则 + 项目上下文）互补。

## 安装与许可

- **skill**：装入 agent skills 目录（`user-invocable: false`，自动触发；`allowed-tools` 限 `shadcn@latest` CLI）
- **MCP**：接 shadcn MCP URL
- **许可**：MIT，源 `shadcn-ui/ui` 的 `skills/shadcn/`
- **贡献**：改 shadcn-ui/ui 提 PR

## 资源链接

- 仓库：[shadcn-ui/ui](https://github.com/shadcn-ui/ui)
- Skills 文档：[ui.shadcn.com/docs/skills](https://ui.shadcn.com/docs/skills)
- MCP 文档：[ui.shadcn.com/docs/mcp](https://ui.shadcn.com/docs/mcp)
- 相关叶：[Nuxt UI Skill](../nuxt-ui-skill/)（另一组件库官方 skill）
