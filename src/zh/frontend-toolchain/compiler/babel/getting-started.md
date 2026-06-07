---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **@babel/core 7.29.x**（npm `latest`）。**Babel 8 处于 RC**（`@babel/core@8.0.0-rc.x`、dist-tag `next`，尚未 GA）。涉及 7 → 8 差异处均显式标注，详见[专家篇](./guide-line/expert)。

## 速查

- 安装：`npm i -D @babel/core @babel/cli @babel/preset-env`（`@babel/core` 是核心，`@babel/cli` 提供 `babel` 命令）
- 配置文件：项目级 `babel.config.json`（推荐）｜ 文件相对 `.babelrc.json`
- 命令：`npx babel src --out-dir dist`（编译目录）｜ `npx babel src/x.js`（输出到 stdout）
- 核心认知：Babel 干**语法转换 + polyfill 注入**两件事，**不做类型检查**
- 编译三阶段：**parse → transform → generate**，由 `@babel/core` 编排
- 能力组合：**preset = 一组 plugin 的套餐**；`@babel/preset-env` 按 `targets` 智能降级
- ⚠️ 顺序反直觉：**plugin 先于 preset；plugin 正序、preset 逆序**
- ⚠️ polyfill：`useBuiltIns: "usage"` + `corejs: "3.x"`（**写 `"3"` 会被当 3.0、漏掉新特性**）
- ⚠️ 要编译 `node_modules` / monorepo → 必须用 `babel.config.json`，`.babelrc.json` 管不到

## 一、Babel 是什么

官方定义：「**Babel is a JavaScript compiler.**」更完整地说，它是「一套主要用于把 ECMAScript 2015+ 代码转换成当前与较旧浏览器/环境都能运行的、向后兼容版本 JavaScript 的工具链」。它做两件事：

1. **语法转换**：把箭头函数、可选链、装饰器、JSX、TS 类型标注等新语法/方言，转换或**降级**成目标环境能跑的 JS。
2. **polyfill 注入（可选）**：配合 `core-js`，为旧环境补上缺失的**运行时 API**（`Promise`、`Array.prototype.includes` 等）。

> 关键边界：**Babel 不做类型检查**。`@babel/preset-typescript` 只是逐文件「剥掉类型」，语法对就放行——类型错了照样产出。要类型安全得另跑 `tsc --noEmit`。这与 tsc「检查 + emit」双职责正好互补。

## 二、编译三阶段

Babel 的核心是一条 **AST 改写管线**：

```text
源码 ──parse──▶ Babel AST ──transform──▶ 新 AST ──generate──▶ 目标代码 (+ source map)
```

| 阶段 | 负责包 | 做什么 |
|---|---|---|
| **parse** | `@babel/parser`（fork 自 acorn） | 把源码解析成 **Babel AST** |
| **transform** | `@babel/traverse` | 遍历 AST，用 **visitor** 增删改节点（plugin/preset 在此生效） |
| **generate** | `@babel/generator` | 把改写后的 AST 重新输出成代码与 source map |

辅助：`@babel/types` 用来构建/校验 AST 节点；`@babel/core` 把以上串起来、读配置、跑插件。**插件本质就是一组 visitor**——这是理解「Babel 为什么能扩展、为什么慢」的钥匙。

## 三、安装与第一次编译

```bash
mkdir my-babel && cd my-babel
npm init -y
npm i -D @babel/core @babel/cli @babel/preset-env
```

新建 `babel.config.json`：

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": "> 0.25%, not dead" }]
  ]
}
```

新建 `src/index.js`（用点新语法）：

```js
const greet = (name) => `Hello, ${name}`;
const list = [1, 2, 3].map((n) => n ** 2);
console.log(greet("Babel"), list);
```

编译：

```bash
npx babel src --out-dir dist   # 读 babel.config.json，输出到 dist/
node dist/index.js
```

## 四、配置文件：babel.config vs .babelrc

Babel 有两类配置文件，**作用域完全不同**，这是最常见的踩坑点：

| 文件 | 类型 | 作用范围 |
|---|---|---|
| `babel.config.json` | **项目级（project-wide）** | 从项目 root 解析，作用于**整个项目，包括 `node_modules`** |
| `.babelrc.json` | **文件相对（file-relative）** | 沿目录向上查找、**遇到含 `package.json` 的目录即停**，只在单个包内生效 |

```json
// babel.config.json —— 推荐，尤其 monorepo / 要编译 node_modules
{ "presets": ["@babel/preset-env"] }
```

> ⚠️ 经典坑：想让 Babel 编译某个 `node_modules` 里的依赖，却把配置写进 `.babelrc.json` → **不生效**。因为 `.babelrc` 是文件相对、管不到 `node_modules`。要跨包/编依赖，必须用 `babel.config.json`。

## 五、preset 与 plugin

- **plugin**：单一职责的转换单元（如把可选链转掉的一个插件）。
- **preset**：一组 plugin 打包成的「套餐」（如 `@babel/preset-env` 内含一大批语法转换插件）。

顺序规则**反直觉**，务必记牢（官方原文）：

- 「**Plugins run before Presets.**」——plugin 先于 preset 执行；
- 「**Plugin ordering is first to last.**」——plugin 数组**正序**；
- 「**Preset ordering is reversed (last to first).**」——preset 数组**逆序**。

```json
{ "presets": ["@babel/preset-env", "@babel/preset-react"] }
// 实际执行顺序：preset-react 先跑，preset-env 后跑
```

## 六、preset-env 与 polyfill

`@babel/preset-env` 是「智能预设」：你声明 `targets`（或用 browserslist），它**自动决定要降级哪些语法、要注入哪些 polyfill**，不用手工挑插件。

polyfill 由 `useBuiltIns` 控制（配 `corejs`）：

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": "defaults",
      "useBuiltIns": "usage",
      "corejs": "3.36"
    }]
  ]
}
```

- `"usage"`：按代码**实际用到**的 API 自动注入（应用首选，最省体积）；
- `"entry"`：按 `targets` 在入口处全量注入（需手动 `import "core-js/stable"`）；
- `false`：不动 polyfill（默认）。

> ⚠️ 两个高频坑：① `corejs` 要写**带次版本**（如 `"3.36"`），只写 `"3"` 会被当 `3.0`、漏掉后续新增的 polyfill；② **库（library）不要用 `useBuiltIns: usage` 污染全局**，应改用 `@babel/plugin-transform-runtime` + `corejs` 做沙箱化注入（详见[进阶篇](./guide-line/advanced)）。

---

掌握基本编译后，进入 [指南 · 基础](./guide-line/base)：三阶段细节、`babel.config` vs `.babelrc` 的本质、preset/plugin 顺序与最小配置。
