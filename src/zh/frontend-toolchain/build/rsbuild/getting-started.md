---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Rsbuild 2.x**（latest 2.0.10，底层 Rspack 2.0.6）。涉及 v1→v2 的差异均显式标注。

## 速查

- 安装：`npm add @rsbuild/core -D`（脚手架：`npm create rsbuild@latest`）
- 环境要求：**Node.js 20.19+ / 22.12+**（v1 仅需 18.12+，2.0 抬高门槛）
- 配置文件：`rsbuild.config.ts`（`export default defineConfig({ ... })`）
- 默认入口：**自动探测 `src/index.*`**（多入口才配 `source.entry`）
- 开发：`rsbuild`（= `rsbuild dev`，默认 `http://localhost:3000`）
- 生产：`rsbuild build`（输出到 `dist/`）；预览：`rsbuild preview`（需先 build）
- 底层：打包=**Rspack**、转译/压缩=**SWC**、CSS=**Lightning CSS**；**不做类型检查**（需 `tsc`/插件）
- 分层：**`dev` 段仅开发态** vs **`server` 段 dev+preview 都生效**；顶层 `plugins` 收 Rsbuild 插件，**`tools.rspack.plugins` 收 Rspack/webpack 原生插件**

## 一、安装与脚手架

```bash
# 脚手架（7 种模板：vanilla / react / vue / lit / preact / svelte / solid，各含 JS/TS）
npm create rsbuild@latest
# 或非交互
npx -y create-rsbuild@latest my-app --template react

# 已有项目手动安装
npm add @rsbuild/core -D
```

标准 `package.json` 脚本（注意 `dev` 是裸 `rsbuild`）：

```jsonc
{
  "scripts": {
    "dev": "rsbuild",          // = rsbuild dev
    "build": "rsbuild build",
    "preview": "rsbuild preview"
  }
}
```

最小配置（推荐从 `@rsbuild/core` 导入 `defineConfig` 获类型提示）：

```ts
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()], // 框架支持全走插件，核心包不内置
});
```

> ⚠️ 框架能力（React/Vue/…）**核心包不内置**，必须装并注册对应 `@rsbuild/plugin-*`。

## 二、四个 CLI 命令

| 命令 | 作用 |
|---|---|
| `rsbuild` / `rsbuild dev` | 启动开发服务器（默认 `localhost:3000`，自带 HMR） |
| `rsbuild build` | 生产构建到 `dist/`（`-w`/`--watch` 监听重建） |
| `rsbuild preview` | 本地预览生产产物（**需先 build**，只起静态服务器） |
| `rsbuild inspect` | 导出最终 Rsbuild/Rspack 配置到 `.rsbuild/*.mjs`（调试用） |

> ⚠️ **`--watch` 是 `build` 的 flag，不是 `dev`**（`dev` 本身就是热更新服务器）。全局 flag：`-c/--config`、`-m/--mode`、`--environment`、`--port`、`--host`（省值则监听 `0.0.0.0` 对外暴露）；CLI flag 优先级高于配置文件。

## 三、分层关系：Rsbuild 与 Rspack

这是理解 Rsbuild 的关键：

- **Rsbuild** 提供语义化分层配置（`source` / `output` / `server` / `dev` / `html` / `resolve` / `performance` / `plugins`）。
- 真正打包的 **Rspack** 通过 **`tools.rspack`** 这个「逃生舱」接入——要用 Rspack/webpack 原生插件、`module.rules`、`resolve`，都写在这里。

```ts
export default defineConfig({
  plugins: [pluginReact()], // ← 顶层 plugins 收【Rsbuild 插件】
  tools: {
    rspack: {
      plugins: [new SomeWebpackPlugin()], // ← Rspack/webpack 原生插件写这里
    },
  },
});
```

> ⚠️ **高频混淆点**：放 webpack 原生插件要写在 **`tools.rspack.plugins`**，不是顶层 `plugins`（顶层只收 `pluginReact()` 这类 Rsbuild 插件）。

## 四、零配置默认行为

无需配置即开箱即用：

- **JS/TS**：Rspack 打包、SWC 转译 + 压缩；TS 由 SWC 编译（**只剥类型、不做类型检查**）
- **CSS**：Lightning CSS 自动加厂商前缀 + 按 browserslist 降级；`*.module.*` 自动识别为 CSS Modules
- **静态资源**：图片/字体/媒体/Wasm 默认可 import，小于 **4KiB** 自动 base64 内联（`output.dataUriLimit` 调）
- **开发**：默认 HMR；**默认 dev server `localhost:3000`**
- **生产**：默认 minify、自动代码分割、构建后打印各 bundle 体积

> ⚠️ **不做类型检查**：构建默认不报类型错误，需 `@rsbuild/plugin-type-check`（独立进程）或在脚本里跑 `tsc --noEmit`。

## 五、Rsbuild 2.0 关键变更（v1 → v2）

| 项 | v1 | **v2** |
|---|---|---|
| Node 要求 | 18.12+ | **20.19+ / 22.12+** |
| `@rsbuild/core` | CJS + ESM | **纯 ESM**（体积减 ~500KB） |
| 默认依赖 | 13 个 | **4 个**（移除 core-js / MF runtime / bundle-analyzer） |
| `server.host` | `0.0.0.0` | **`localhost`**（secure-by-default） |
| 代码分割 | `performance.chunkSplit` | **`splitChunks`**（对齐 Rspack，旧的废弃） |
| 默认 browserslist | 较旧 | **Baseline 2025-05-01**（Chrome 107 等） |

> ⚠️ **`server.host` 默认改 `localhost`** 是高频踩坑点：局域网/容器内访问会失败，需显式 `--host` 或 `server.host: '0.0.0.0'`。`core-js` 等也不再默认安装，用到需手动装。

---

更深入的配置分层、框架/CSS、`tools` 透传、Environments 多环境与迁移见 [指南 · 基础](./guide-line/base)。
