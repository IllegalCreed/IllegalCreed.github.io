---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 developer.stackblitz.com 与 @webcontainer/api 2025–2026 现状编写

## 速查

- **本质**：浏览器内即时全栈 IDE，由 WebContainers 驱动，Node + 终端 + git + npm 全在标签页内跑
- **两套引擎**：WebContainers（当前默认，完整 Node + npm/pnpm/yarn + 真终端）/ EngineBlock（旧版，Turbo v1，仅主流前端框架）
- **打开已有项目**：`stackblitz.com/edit/<id>`
- **fork 一份副本**：`stackblitz.com/fork/<id>`
- **框架自有速建短链**（各框架自有域名，指向 StackBlitz，**不是** `stackblitz.com/fork/*`）：`vite.new`、`vite.new/react`、`astro.new`、`nextjs.new`、`nuxt.new`、`node.new`、`sveltekit.new`、`remix.new`、`vitepress.new`、`sli.dev/new`
- **界面**：编辑器 / 终端 / Ports / Preview（iframe）/ HMR 开关
- **基本流程**：装依赖 → 跑 dev server → 看预览 → fork 后分享
- ⚠️ **持久化**：未 fork / 未登录的新项目只存在浏览器内存，刷新或关页即丢
- **文档**：<https://developer.stackblitz.com/>

## 什么是 StackBlitz

StackBlitz 是一个**在浏览器标签页内运行的即时全栈开发环境**。打开一个链接，几百毫秒后你就得到一份可编辑的代码、一个真实的终端、一个能跑 dev server 的 Node 运行时和一个实时刷新的预览窗口——全程不需要本地安装任何东西，也不需要把代码送到远端服务器。

它的杀手级场景有两个：

1. **可运行的文档 / demo**——把一段示例代码嵌进网页，读者点开即跑、即改、即看效果（本系列「嵌入与 SDK」一章专讲）。
2. **零配置起新项目**——想试一个框架，敲一个 `*.new` 短链就有一份跑起来的模板，比 `npm create` 还快。

::: tip 一句话定位
传统在线 IDE 把你的代码送到云端容器执行；StackBlitz 反过来，把「一台微型 Linux + Node」整个塞进你的浏览器标签页。这就是它「比 localhost 还快、还能离线」的根源。
:::

## 两套运行引擎

StackBlitz 内部有两套执行引擎，理解它们的差异能避免大量「为什么我的项目跑不起来」的困惑。

| 引擎             | 现状         | 运行时           | 包管理器                 | 适用范围                                       |
| ---------------- | ------------ | ---------------- | ------------------------ | ---------------------------------------------- |
| **WebContainers** | 当前默认     | 完整 Node.js     | npm / pnpm / yarn（v1）  | 几乎所有前后端框架与 Node 工具链               |
| **EngineBlock**   | 旧版（遗留） | Turbo（v1）      | 内置依赖解析             | 仅主流前端框架（React / Vue / Angular 等）     |

- **WebContainers** 是真正的 Node 环境，有真实终端，能跑 Vite / Next / Nuxt / Remix / SvelteKit 这类需要 Node server 的项目。新建的现代项目基本都落在这套引擎上。
- **EngineBlock** 是更早的引擎，跑在 Turbo 上，**不支持完整 Node 应用**，只适合纯前端框架。SDK 里除 `node` 之外的模板仍由它承载（见「嵌入与 SDK」的模板表）。

::: warning 选错引擎会「跑不起来」
如果你需要一个真正的 Node 后端 / 自定义 dev server，务必落在 WebContainers（例如用 `node.new` 或 SDK 的 `node` 模板）。EngineBlock 模板无法启动完整 Node 应用。
:::

## 访问与新建

### 打开 / fork 已有项目

| 操作              | URL                         | 说明                                       |
| ----------------- | --------------------------- | ------------------------------------------ |
| 打开已有项目      | `stackblitz.com/edit/<id>`  | 直接进入编辑器                             |
| fork 出一份副本   | `stackblitz.com/fork/<id>`  | 复制一份归你所有，改动不影响原项目         |

### 框架自有 `*.new` 速建短链

各大框架都注册了自己的 `*.new` 域名，敲下去就能在 StackBlitz 里得到一份官方模板：

| 短链            | 起出的项目              |
| --------------- | ----------------------- |
| `vite.new`      | Vite（vanilla）         |
| `vite.new/react`| Vite + React            |
| `astro.new`     | Astro                   |
| `nextjs.new`    | Next.js                 |
| `nuxt.new`      | Nuxt                    |
| `node.new`      | 空白 Node 项目          |
| `sveltekit.new` | SvelteKit               |
| `remix.new`     | Remix                   |
| `vitepress.new` | VitePress               |
| `sli.dev/new`   | Slidev                  |

::: tip 这些是「框架自有域名」，不是 StackBlitz 子路径
`vite.new`、`astro.new` 等是各框架**自己注册的顶级域名**，只是落地页指向 StackBlitz。它们**不等于** `stackblitz.com/fork/vite` 这种写法，别搞混。
:::

## 界面速览

打开任意项目后，编辑器主要由这几块组成：

- **编辑器（Editor）**：基于 Monaco（与 VS Code 同源），有补全、跳转、多文件标签。
- **终端（Terminal）**：WebContainers 项目里这是一个**真实的 shell**（内置 `jsh`），可以敲 `npm install`、`pnpm dev` 等命令。
- **Ports**：列出当前 WebContainer 内监听的端口，点一下即可在预览中打开对应服务。
- **预览（Preview）**：一个 iframe，渲染你的 dev server 输出，支持热更新（HMR）。可在「刷新」与「HMR」之间切换刷新策略。

## 基本用法

一个最典型的「起项目 → 跑起来 → 分享」流程：

```bash
# 1. 在终端安装依赖（WebContainers 支持三大包管理器）
pnpm install

# 2. 启动开发服务器
pnpm dev

# 3. 右侧预览自动指向 dev server，改代码即时热更新
```

- 想分享给别人时，先点 **Fork** 把项目存成你账号下的一份，再复制 URL；这样别人打开的是一份稳定快照。
- 想嵌入到自己的网页 / 文档里，见「嵌入与 SDK」一章。

::: warning 内存态文件系统：刷新即丢
**未 fork、未登录**的新项目只存在于浏览器内存里，刷新或关闭标签页就会丢失全部改动。任何想保留的工作，务必先 **Fork**（或登录后保存）。这是新手最容易踩的坑。
:::
