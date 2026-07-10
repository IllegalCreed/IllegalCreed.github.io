---
layout: doc
outline: [2, 3]
---

# Astryx 入门

> 基于 Astryx 0.1.3（Beta）· 核于 2026-07

## 速查

- **是什么**：Meta 开源的 React 设计系统，样式引擎为 [StyleX](/zh/web-advanced/language/stylex/)（编译期原子化 CSS，对使用者不可见）。当前 v0.1.3 Beta，MIT。
- **装包**：`npm install @astryxdesign/core @astryxdesign/theme-neutral @astryxdesign/cli`（核心 + **一个主题包** + CLI）。
- **初始化**：`npx astryx init`（装包 + 配主题 + 写 agent 文档）。
- **三行 CSS 导入**（顺序）：`@astryxdesign/core/reset.css` → `@astryxdesign/core/astryx.css` → `@astryxdesign/theme-<name>/theme.css`。
- **引组件**：`import {Button} from '@astryxdesign/core/Button'`（core 的**子路径按名导入**）。
- **布局**：`import {VStack} from '@astryxdesign/core/Layout'`，用 `gap` 控制间距。
- **切主题**：换导入的 `@astryxdesign/theme-*/theme.css`（7 个：`neutral`/`butter`/`chocolate`/`matcha`/`stone`/`gothic`/`y2k`）；**暗色内建**。
- **覆盖样式**：给组件传 `className`（Tailwind / CSS Modules / 纯 CSS），**无需写 StyleX**。
- **接 AI**：`npx astryx init --features agents --agent claude`（生成 `CLAUDE.md`）+ 配置托管 MCP `https://astryx.atmeta.com/mcp`。
- **别忘了**：主题包**必装**（组件 token 来自它）；CSS 三行都要导入；组件用**子路径**导入利于 tree-shaking。

本文以 **React + TypeScript + `@astryxdesign/core` 0.1.x（Beta）** 为基线，带你从零装好 Astryx、跑出第一个组件、切主题与暗色、覆盖样式，并接上 AI agent 工作流。⚠️ Astryx 2026-06 才开源、仍是 0.1.x，**组件 props 等细节可能随版本变动**，以官方最新文档为准；本文只写官方文档/仓库明确支持的内容。

## 一、环境与前置要求

- **Node.js** ≥ 18（推荐 20+，CLI 与部署环境默认 Node 20）。
- **React** 项目（Astryx 仅 React 系；无 Vue / Svelte 版本）。
- **TypeScript**：推荐，组件与 CLI 输出对类型友好（`--json` 是类型化信封）。
- **打包器**：需要能接入 StyleX 构建的工具链，配 `@astryxdesign/build`（StyleX 源码构建插件）；`astryx init` 会尽量替你配好。
- **包管理器**：npm / pnpm / yarn 均可，下文示例用 `npx`。

> Astryx 的样式在**构建期**由 StyleX 编译为原子 CSS，因此工具链里需要 StyleX 构建插件；但**日常写业务时你完全不接触 StyleX**——它对使用者不可见。

## 二、安装与初始化

官方入门的安装命令是三件套：**核心包 + 一个主题包 + CLI**。

```bash
# 1) 安装：核心 + 主题（提供 token 值）+ CLI
npm install @astryxdesign/core @astryxdesign/theme-neutral @astryxdesign/cli

# 2) 初始化：安装/配置主题、写入 AI agent 文档
npx astryx init
```

**主题包是必需的**：组件样式的 token 值（颜色、间距、圆角、字体等）来自主题的 `theme.css`，只装 `@astryxdesign/core` 会缺 token。若初始化配置出问题，用 `npx astryx doctor` 自检并按提示修复。

CLI 也可挂到 `package.json` 的 scripts 里长期使用：

```json
{
  "scripts": {
    "astryx": "node node_modules/@astryxdesign/cli/bin/astryx.mjs"
  }
}
```

之后即可 `npm run astryx -- component --list` 这样调用。

## 三、三行 CSS 导入（顺序很重要）

在你的全局样式入口（如 `globals.css`）按顺序导入三个文件：

```css
/* 1) 重置：抹平浏览器默认样式 */
@import '@astryxdesign/core/reset.css';
/* 2) 基础：Astryx 组件的原子/基础样式 */
@import '@astryxdesign/core/astryx.css';
/* 3) 主题：token 变量（换这一行即换主题） */
@import '@astryxdesign/theme-neutral/theme.css';
```

顺序上先 `reset`、再组件基础 `astryx.css`、最后主题 token——主题变量放最后以便正确生效。**换主题只需改第 3 行**的主题包名。

## 四、第一个组件

Astryx 组件从核心包的**子路径按组件名导入**（利于 tree-shaking）。下面是官方入门风格的最小示例：

```tsx
import {Button} from '@astryxdesign/core/Button';
import {VStack} from '@astryxdesign/core/Layout';

export default function Page() {
  return (
    <VStack gap={2}>
      <Button label="Hello Astryx" onClick={() => alert('Hi!')} />
    </VStack>
  );
}
```

要点：

- `VStack` 来自 `Layout` 模块，做纵向堆叠，用 `gap` 控制子元素间距（token 化的间距标度，如 `gap={2}`）。Layout 通常还提供 `HStack` / `Stack` 等对应横向/通用堆叠。
- `Button` 从 `@astryxdesign/core/Button` 子路径导入。官方 getting-started 示例用 `label` + `onClick` 形态；官方 blog 也出现过 `variant`（如 `variant="primary"`）+ children 的写法。⚠️ **Beta 期组件 props 仍在演进**，具体以你安装版本的 `npx astryx component Button` 输出为准。

想快速查任一组件的 props / 用法 / 源码，直接问 CLI：

```bash
npx astryx component Button          # 打印 Button 完整文档
npx astryx component --list          # 列出所有组件
npx astryx component Dialog --dense  # 压缩输出，便于贴给 AI
```

## 五、主题与暗色

**切换主题**：安装目标主题包并把 CSS 第 3 行换掉即可。官方 7 个开箱主题：

```bash
npm install @astryxdesign/theme-matcha
```

```css
/* 从 neutral 换成 matcha */
@import '@astryxdesign/theme-matcha/theme.css';
```

可选主题：`neutral` / `butter` / `chocolate` / `matcha` / `stone` / `gothic` / `y2k`。

**暗色模式内建**：Astryx 的主题系统内建暗色，随 token 生效，无需额外拼装第三方暗色库。查看某类 token（颜色/间距/排版）可用：

```bash
npx astryx docs tokens       # 打印设计 token 参考
npx astryx docs color        # 只看颜色 token
```

**自定义品牌主题**（进阶）：用 `defineTheme` 写主题定义文件，再 `npx astryx theme build` 编译为生产 CSS/JS——改一组 token 即让全部组件统一换肤（详见[指南](./guide-line.md)）。

## 六、覆盖单个组件的样式

StyleX 写好的默认样式对你不可见，需要局部覆盖时，给组件传 `className`——**样式方案自由**：

```tsx
// Tailwind
<Button className="mt-4 w-full" label="提交" />

// 或 CSS Modules / 纯 CSS 类名
<Button className={styles.primaryCta} label="提交" />
```

覆盖只需 `className`，**不要去改 `node_modules` 里的组件源码**；若要做超出 `className`/token 的深度改造，用 `npx astryx swizzle` 把该组件源码复制进项目（opt-in，详见指南）。

## 七、接入 AI agent 工作流

Astryx 从底层为 agent 设计，接入分两步：

**1) 生成 agent 约定文档**（按你用的工具选 `--agent`）：

```bash
npx astryx init --features agents --agent claude   # 生成 CLAUDE.md
npx astryx init --features agents --agent cursor   # 生成 .cursorrules
npx astryx init --features agents --agent codex    # 生成 AGENTS.md
```

**2) 配置托管 MCP server**（各 MCP 工具用同一份配置，服务名 `xds`）：

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

配好后，agent 即可用 MCP 的 `search(query)`（自然语言发现组件/文档/模板）与 `get(name)`（取回完整文档）访问 Astryx；适用于 Claude Desktop、Cursor、Windsurf、Cline 等。⚠️ 托管 MCP 需**联网**，强隔离/离线环境请改用离线 CLI（`component --dense` / `docs --dense`）。

---

进阶：StyleX 关系与编译期原子 CSS、主题系统（`defineTheme`）、CLI 全命令与全局 flag、AI-agent-ready 全景（MCP + `manifest` 契约）、模板系统、升级排障、选型对比与常见坑，见 **[指南](./guide-line.md)**；速查表见 **[参考](./reference.md)**。
