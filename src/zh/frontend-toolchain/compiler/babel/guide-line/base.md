---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **@babel/core 7.29.x**。本篇把「能编译」用到「会配置」：编译三阶段、安装、`babel.config.json` 与 `.babelrc.json` 的本质区别、preset/plugin 顺序规则、最小配置。

## 一、编译三阶段：parse / transform / generate

Babel 不是「字符串替换」，而是一条 **AST 改写管线**：

```text
源码 ──parse──▶ Babel AST ──transform──▶ 新 AST ──generate──▶ 目标代码
```

| 阶段 | 负责包 | 做什么 |
|---|---|---|
| **parse** | `@babel/parser`（fork 自 acorn） | 源码 → **Babel AST** |
| **transform** | `@babel/traverse` | 用 **visitor** 遍历并改写 AST（plugin/preset 在此生效） |
| **generate** | `@babel/generator` | 改写后的 AST → 代码 + source map |

- `@babel/types`：构建/校验 AST 节点的工具库（写插件时高频使用）。
- `@babel/core`：编排者——读配置、解析 preset/plugin、按阶段跑完整流程。

> 记住这条链，后面的「插件 = 一组 visitor」「Babel 为什么慢」「为什么能做 codemod」都从这里来。

## 二、安装

按用途装包：

```bash
# 核心三件套（命令行编译）
npm i -D @babel/core @babel/cli @babel/preset-env

# 处理 TS / React 时按需追加
npm i -D @babel/preset-typescript @babel/preset-react

# 应用注入 polyfill（运行时依赖，装到 dependencies）
npm i core-js
```

- `@babel/core`：核心库，所有集成都依赖它。
- `@babel/cli`：提供 `babel` 命令（`npx babel ...`）。打包器场景通常用对应的 loader/插件而非 CLI。
- preset 是开发依赖；`core-js` 是**运行时**依赖（要进 `dependencies`）。

## 三、babel.config.json vs .babelrc.json：本质区别

两类配置文件的差别不是「写法」，而是**解析作用域**：

| 维度 | `babel.config.json` | `.babelrc.json` |
|---|---|---|
| 定位 | **项目级 / project-wide** | **文件相对 / file-relative** |
| 解析起点 | 项目 **root** | 被编译文件**所在目录**，逐级向上 |
| 何时停止 | 作用于整个项目 | **遇到含 `package.json` 的目录即停** |
| 能否作用于 `node_modules` | **能** | **不能** |
| 典型场景 | monorepo、要编译依赖、统一配置 | 单包内对某子目录做差异化配置 |

```json
// babel.config.json（放项目根，推荐）
{
  "presets": ["@babel/preset-env"]
}
```

::: warning 要编译 node_modules 必须用 babel.config
最常见的「配置不生效」根因：想让 Babel 转换某个发布为 ES2015+ 的依赖、或在 monorepo 里跨包共享配置，却写进了 `.babelrc.json`。`.babelrc` 是文件相对的，碰到 `node_modules`（或子包的 `package.json`）就停了，根本管不到。**跨包 / 编依赖 → 一律用 `babel.config.json`。**
:::

> 经验法则：新项目**默认用 `babel.config.json`**；只有「同一个包内、个别目录要不同配置」时才补 `.babelrc.json`。两者可共存，Babel 会按规则合并（合并优先级见[进阶篇](./advanced)）。

## 四、preset 与 plugin 的顺序规则

这是 Babel 最反直觉、也最常考的点。官方明确三条规则：

- 「**Plugins run before Presets.**」——**plugin 整体先于 preset 执行**；
- 「**Plugin ordering is first to last.**」——**plugin 数组按正序**（从前到后）；
- 「**Preset ordering is reversed (last to first).**」——**preset 数组按逆序**（从后到前）。

```json
{
  "plugins": ["plugin-a", "plugin-b"],          // a 先于 b
  "presets": ["@babel/preset-env", "@babel/preset-react"]
  // preset 逆序：preset-react 先跑，preset-env 后跑
}
```

为什么 preset 要逆序？因为编写组合时，人们习惯把「更基础/更靠近输出」的 preset 放在后面，逆序执行能让它先把方言（如 JSX）转成普通 JS，再交给前面的 preset 继续处理。

> 另一条相关规则：「**Transform plugins will enable the corresponding syntax plugin.**」——转换插件会自动启用对应的语法插件，所以一般无需手动再加 syntax-only 插件。

## 五、最小配置

最常用的最小 `babel.config.json`：

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": "> 0.25%, not dead" }]
  ]
}
```

- 只装一个 `@babel/preset-env` + 一个 `targets`，就能把现代语法降级到目标浏览器。
- `targets` 也可省略改用项目根的 `.browserslistrc`（preset-env 会自动读，详见[进阶篇](./advanced)）。
- 暂不配 polyfill 时，**记住它只降语法、不补运行时 API**——`Promise`/`includes` 等仍要靠 polyfill。

带 React + TS 的常见组合：

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": "defaults" }],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ]
}
```

---

进入 [指南 · 进阶](./advanced)：`preset-env` + browserslist、polyfill 三策略、`preset-typescript`/`preset-react`、`overrides`、配置合并优先级与 `api.cache`。
