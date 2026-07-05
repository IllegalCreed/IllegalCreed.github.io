---
layout: doc
outline: [2, 3]
---

# Astryx 参考

> 基于 Astryx 0.1.3（Beta）· 核于 2026-07

本文为 Astryx 的一站式速查——npm 包、安装、CSS 导入、CLI 全命令与全局 flag、`manifest` 契约、MCP 配置、主题与 foundations token、选型对比、版本与链接。概念与示例见[入门](./getting-started.md)与[指南](./guide-line.md)。⚠️ 0.1.x Beta，精确清单以你安装版本的 `npx astryx manifest --json` 为准。

## 1. npm 包一览

| 包 | 作用 |
| --- | --- |
| `@astryxdesign/core` | 组件 + 主题系统 + 工具（组件从子路径 `@astryxdesign/core/<Name>` 导入） |
| `@astryxdesign/cli` | 命令行：docs / templates / scaffolding / themes / codemods |
| `@astryxdesign/build` | StyleX 源码构建插件（接入打包器，编译期出原子 CSS） |
| `@astryxdesign/theme-<name>` | 开箱主题包（含 `theme.css` token） |

## 2. 安装与 CSS 导入

```bash
npm install @astryxdesign/core @astryxdesign/theme-neutral @astryxdesign/cli
npx astryx init
```

```css
/* 顺序固定：reset → 基础 → 主题 */
@import '@astryxdesign/core/reset.css';
@import '@astryxdesign/core/astryx.css';
@import '@astryxdesign/theme-neutral/theme.css';
```

挂到 scripts 长期用：`"astryx": "node node_modules/@astryxdesign/cli/bin/astryx.mjs"` → `npm run astryx -- <cmd>`。

## 3. CLI 命令速查

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `init` | 装包 + 配主题 + 写 agent 文档 | `astryx init --features agents --agent claude` |
| `component` | 列组件 / 打印某组件文档（props·用法·源码） | `astryx component Dialog --dense` |
| `search` | 跨组件/hooks/文档/模板统一检索（发现入口） | `astryx search "date picker"` |
| `docs` | 打印参考文档（tokens/theme/color/…） | `astryx docs tokens` |
| `template` | 注入页面/区块模板 | `astryx template dashboard --skeleton` |
| `hook` | 列 hooks / 打印 hook 文档 | `astryx hook --list` |
| `swizzle` | 复制组件源码做深度定制（opt-in） | `astryx swizzle Button` |
| `upgrade` | codemods 版本迁移 | `astryx upgrade` |
| `theme build` | 把 `defineTheme` 编译为生产 CSS/JS | `astryx theme build` |
| `discover` | 发现外部包与组件 | `astryx discover` |
| `doctor` | 诊断安装/配置并给修复建议 | `astryx doctor` |

## 4. 全局选项速查

| 选项 | 含义 |
| --- | --- |
| `--json` | 类型化 JSON 信封 `{ type, data }`（机器消费） |
| `--detail <level>` | `brief` / `compact` / `full` 详略 |
| `--zh` | 简体中文输出文档 |
| `--dense` | 压缩、token 高效格式（喂 AI，省上下文） |
| `--lang <locale>` | `en` / `zh` / `dense` 统一快捷（`--dense` ≈ `--lang dense`） |

## 5. manifest 契约

```bash
npx astryx manifest --json     # 或 npx astryx --json
```

返回**自描述 manifest**：每条命令、其参数、每个 flag（**类型 · 可选值 choices · 默认值**）、是否支持 `--json`。定位 =「**命令行的 OpenAPI**」，给 agent 结构化、权威、可自举/校验/自适应的访问，免抓文档、免猜 API。

## 6. MCP 配置与工具

**配置**（各 MCP 工具通用，服务名 `xds`，远程托管）：

```json
{
  "mcpServers": {
    "xds": {
      "type": "url",
      "url": "https://astryx.atmeta.com/mcp"
    }
  }
}
```

| MCP 工具 | 作用 |
| --- | --- |
| `search(query)` | 自然语言发现组件 / 文档主题 / 模板 |
| `get(name)` | 取回完整文档（props、用法、示例） |

支持：Claude Desktop / Cursor / Windsurf / Cline 等。**需联网**；离线用 CLI `--dense`。Cursor user rule：`npx astryx init --features agents --agent-docs-path ~/.cursor/rules/xds.mdc`。

## 7. agent 文档生成对照

| 命令 | 生成文件 |
| --- | --- |
| `astryx init --features agents --agent claude` | `CLAUDE.md` |
| `astryx init --features agents --agent cursor` | `.cursorrules` |
| `astryx init --features agents --agent codex` | `AGENTS.md` |

## 8. 开箱主题（7 个）

| 主题包 | 名称 |
| --- | --- |
| `@astryxdesign/theme-neutral` | neutral（中性，默认） |
| `@astryxdesign/theme-butter` | butter |
| `@astryxdesign/theme-chocolate` | chocolate |
| `@astryxdesign/theme-matcha` | matcha |
| `@astryxdesign/theme-stone` | stone |
| `@astryxdesign/theme-gothic` | gothic |
| `@astryxdesign/theme-y2k` | y2k |

切换 = 装包 + 换 CSS 第 3 行；自定义 = `defineTheme` + `astryx theme build`；**暗色内建**。

## 9. Foundations token 清单

`npx astryx docs <topic>` 可查：**All Tokens、Color、Elevation、Icons、Illustrations、Motion、Shape、Spacing、Typography**。

```bash
npx astryx docs tokens        # 全部
npx astryx docs color         # 颜色
npx astryx docs spacing       # 间距
npx astryx docs typography    # 排版
npx astryx docs elevation     # 层级/阴影
```

## 10. 组件 / hook / 模板查询

```bash
npx astryx component --list        # 全部组件
npx astryx component <Name>        # 某组件 props/用法/源码
npx astryx hook --list             # 全部 hooks
npx astryx template --list         # 全部模板（如 dashboard、kanban-board）
npx astryx template <name> --skeleton   # 只取骨架
```

> 组件/hook 的精确清单随 0.1.x 版本演进，**以 CLI/MCP 实时输出为权威**，勿凭记忆。

## 11. 选型对比速查

| | Astryx | shadcn/ui | 经典 MUI | Radix | Chakra |
| --- | --- | --- | --- | --- | --- |
| 分发 | npm 依赖（swizzle 才复制） | 复制源码 | npm | npm | npm |
| 样式 | StyleX 编译期原子 CSS | Tailwind | Emotion 运行时 | 无样式 | 运行时 style props |
| 带样式 | ✅ | ✅ | ✅ | ❌ | ✅ |
| AI 原生 | MCP+manifest+dense | CLI+MCP | ❌ | ❌ | ❌ |
| 出身 | Meta（8y/13k 应用） | 独立(Vercel) | 独立公司 | WorkOS | 独立 |

## 12. 版本与关键事实

| 项 | 值 |
| --- | --- |
| 当前版本 | **0.1.3（Beta）** |
| 首次开源 | 2026-06 |
| 许可 | MIT |
| 出品 | Meta（`github.com/facebook/astryx`） |
| 样式引擎 | StyleX（编译期原子化 CSS） |
| 内部沉淀 | 约 8 年、13000+ 应用 |
| 组件数 | 150+（官网首页称 160+） |
| 框架 | 仅 React |

## 13. 资源链接

- 官网：<https://astryx.atmeta.com/>
- 文档：<https://astryx.atmeta.com/docs>
- 博客：[Introducing Astryx](https://astryx.atmeta.com/blog/introducing-astryx) · [How Astryx Works](https://astryx.atmeta.com/blog/how-astryx-works)
- Changelog：<https://astryx.atmeta.com/changelog>
- 托管 MCP：<https://astryx.atmeta.com/mcp>
- GitHub：<https://github.com/facebook/astryx>
- StyleX（样式引擎）：[本站 StyleX 叶](/zh/web-advanced/language/stylex/) · <https://stylexjs.com>
- MCP 标准：<https://modelcontextprotocol.io>
