---
layout: doc
outline: [2, 3]
---

# Svelte Playground

> 基于三家官方 Playground 2025–2026 现状编写

## 速查

- **地址（新）**：<https://svelte.dev/playground>；**旧 `/repl/` 仍可用，会重定向到 `/playground/`**
- **改名**：原名 **REPL**，2023-06 的「svelte.dev: A complete overhaul」博客重写并升级到 **CodeMirror 6**，随后正式落地为 **Playground**（合并了原 REPL 与 Examples）
- **客户端编译**：Svelte 编译器在**浏览器里实时编译** `.svelte`（含 bundler worker + npm 包解析 + 代码执行，全在客户端）
- **输出标签**：**Result**（实时预览）/ **JS output**（编译出的 JS）/ **CSS output**（编译出的 CSS）
- **多文件**：支持一个 Playground 里建多个文件 / 组件（顶部文件标签）
- **版本切换**：通过 **`?version=`** query（如 `?version=5.40.1`、`?version=3.47.0`）
- **默认 Svelte 5**：现网默认 Svelte 5；写示例注意 **runes** 等 5 与 3/4 的语法差异
- **分享 / 保存**：保存生成 **`/playground/{id}`** 短链（背后与 GitHub gist 关联，登录后可存）；可导出 SvelteKit 项目模板 zip
- **特殊入口**：`/playground/untitled`（新建空白）、`/playground/hello-world`（默认示例）
- ⚠️ Svelte 的 "REPL" 与 **Vue 的 `vuejs/repl` 仓库无关**，别混
- **文档**：<https://svelte.dev/docs>；改版说明 <https://svelte.dev/blog/svelte-dev-overhaul>

## REPL → Playground：近年的关键改名

这是 Svelte 这个工具**最容易混淆的一点**，先讲清楚：它历史上叫 **REPL**，现在官方正式名是 **Playground**。

- **2023-06-29** 的官方博客 **「svelte.dev: A complete overhaul」** 宣布：REPL 被**从零重写为完全类型安全**，编辑器升级到 **CodeMirror 6**（带无障碍改进、多选模式、性能 / tree-shaking 提升、暗色模式），并把「**Playground：统一的 REPL + Examples 页**」列为「What's next」。
- 此后正式落地为 **Playground**：现站点主入口是 **svelte.dev/playground**（合并了原 REPL 与 Examples 两块）。
- **旧的 `/repl/` 链接被重定向到新的 `/playground/`**（官方称「所有旧站链接都重定向到正确的新页面」），`?version=` 查询参数在新链接里保留。

::: warning 「REPL」是旧称，「Playground」是现名
现在官方正式叫 **Playground**；"REPL" 是它的旧称 / 历史叫法，很多老链接和社区文章仍写 `/repl/`。讲解时点明「**REPL 即 Playground 的前身**」，避免误以为是两个工具。
:::

::: tip 别和 Vue 的 `vuejs/repl` 搞混
Svelte 这个旧名 "REPL" 和 Vue SFC Playground 的引擎仓库 `vuejs/repl` **毫无关系**——一个是 Svelte 工具的历史名字，一个是 Vue 工具的引擎仓库名。
:::

## 客户端编译与输出视图

Svelte 是**编译型框架**——你写的 `.svelte` 不是浏览器能直接跑的东西，要先经 Svelte 编译器编成 JS + CSS。Playground 把整套编译搬进浏览器：**Svelte 编译器在客户端实时编译** `.svelte` 组件（REPL 系统包含 bundler worker + npm 包解析 + 代码执行环境，全部在客户端，无后端）。

输出区的标签（即「看编译产物」的落点）：

| 标签           | 看什么                            |
| -------------- | --------------------------------- |
| **Result**     | 实时预览运行结果                  |
| **JS output**  | 编译生成的 JavaScript             |
| **CSS output** | 编译生成的 CSS                    |

::: tip 编译型框架，看产物尤其有意义
Svelte 的响应式、组件逻辑都是在**编译期**转成普通 JS 的（不像运行时框架带一层虚拟 DOM 运行时）。盯着 **JS output** 看你写的 `.svelte` 编成了什么，是理解 Svelte「编译时魔法」最直接的方式。
:::

## 多文件、版本切换与分享

### 多文件 / 多组件

支持在一个 Playground 里建**多个文件 / 组件**（顶部文件标签新增、切换）——和 Vue 一样是真·多文件标签，便于演示组件拆分与组合。

### 版本切换：`?version=`

通过 **`?version=` 查询参数**切换 Svelte 版本：

```
https://svelte.dev/playground/hello-world?version=5.40.1
https://svelte.dev/playground/hello-world?version=3.47.0
```

::: warning 现网默认 Svelte 5，注意 runes
现网默认是 **Svelte 5**（如 5.40.x / 5.46.x）。Svelte 5 引入了 **runes**（`$state`、`$derived`、`$effect` 等）等新写法，和 Svelte 3/4 的语法有明显差异。写示例时若想要 3/4 的旧写法，记得用 `?version=3.x` 显式指定，否则默认会按 Svelte 5 编译。
:::

### 分享 / 保存

| 行为             | 结果                                                         |
| ---------------- | ------------------------------------------------------------ |
| 保存             | 生成 **`/playground/{id}`** 短链（背后与 GitHub gist 关联，登录后可保存） |
| 导出             | 可导出 / 下载为 **SvelteKit 项目模板 zip**                   |
| `/playground/untitled` | 新建空白入口                                           |
| `/playground/hello-world` | 默认示例                                            |

保存后拿到的 `/playground/{id}` 短链，就是分享 Svelte 最小可复现的标准形态——和 TS（hash）、Vue（hash）一样，一条链接复现完整环境。
