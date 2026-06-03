---
layout: doc
---

# Preact

**快速的 3kB React 替代品，拥有相同的现代 API（Fast 3kB alternative to React with the same modern API）**——由 **Jason Miller（developit）** 与 Preact 团队维护，**当前 v10.29.x（v11 为下一个大版本）**。它在「**最小体积**」「**贴近 DOM**」「**高性能**」三点上做到极致：核心 gzip 仅约 **3kB**（官网口径；README 因含 compat 测量写作 4kB），**提供尽可能薄的虚拟 DOM 抽象**，diff 简单可预测、是最快的虚拟 DOM 库之一。**核心定位认知**：Preact **拥有与 React 几乎相同的现代 API**（ES6 Class、Hooks、函数组件、JSX、Context），但**不是 React**——它最根本的技术差异是「**不实现合成事件系统**」：直接用浏览器原生 `addEventListener`，所以**事件命名与行为和原生 JS/DOM 一致**（用 `onInput` 而非 React 的 `onChange`、`onDblClick` 而非 `onDoubleClick`）。**其它与 React 的差异**：`class` 与 `className` **都支持**（多数 Preact 开发者用更短的 `class`）；**SVG 属性按原样写**（kebab-case 如 `stroke-width`，可直接粘贴设计工具导出的 SVG）；类组件 `render(props, state)` 把 props/state 作参数传入；**Hooks 在独立入口 `preact/hooks`**（不在核心 `preact`）。**React 生态兼容**靠 **`preact/compat`**——通过把 `react` / `react-dom` 别名指向 `preact/compat`（webpack `resolve.alias`，或 Vite 用 `@preact/preset-vite` 自动配），即可**无改动运行成千上万的 React 库**（compat 提供 `forwardRef` / `memo` / `createPortal` / `Suspense` / `lazy` / `Children` 等）。**`@preact/signals` 信号**：可选的细粒度响应式状态原语——`signal(.value)` / `computed` / `effect` / `batch`，**在 JSX 里直接用 signal（无需 `.value`）会自动订阅、只精确更新用到的那部分、跳过组件级重渲染**（与 `useState` 触发整组件重渲染不同）。**工具链**：`npm init preact`（create-preact，现代脚手架，含 TS/路由/ESLint 选项）/ `preact-cli`（旧）/ `@preact/preset-vite`；SSR 用 `preact-render-to-string` 的 `renderToString`；`preact/debug`（开发期警告 + DevTools，须首位导入）。**典型用户群**：**对体积/性能敏感的场景**——可嵌入的 widget、营销页、移动端、性能预算紧张的应用；以及**想用 React 心智但要更小更快**的团队（Deno 的 **Fresh** 框架即基于 Preact）。

## 评价

**优点**

- **极小体积**：核心 gzip 仅 ~3kB，「你的代码才是应用最大的部分」——对体积预算、嵌入式 widget、移动端极友好
- **相同的现代 API**：ES6 Class / Hooks / 函数组件 / JSX / Context 与 React 一致——React 开发者**几乎零学习成本**
- **贴近 DOM、性能优异**：最薄的虚拟 DOM 抽象 + 简单可预测的 diff，是最快的 VDOM 库之一
- **React 生态兼容**：`preact/compat` 别名一配，**无改动跑 React 库**（React Router、Redux 等）
- **原生事件、行为可预测**：无合成事件系统，事件命名/行为与原生 DOM 一致，心智更简单
- **`class` / `className` 都支持 + SVG 原样写**：可直接粘贴 SVG，写法更贴近 HTML
- **`@preact/signals` 细粒度响应式**：信号在 JSX 里直接用，**跳过组件级重渲染**、只更新真正变化的节点——性能更进一步
- **可移植可嵌入**：tiny footprint 让你把组件范式带到任何地方；Deno Fresh 等采用
- **完整工程化**：JSX / VDOM / DevTools / HMR / SSR（水合）一应俱全

**缺点**

- **不是 100% React**：纯 Preact 有差异（`onInput` 而非 `onChange`、`class`、SVG kebab-case、Hooks 在 `preact/hooks`）——**直接迁移 React 代码需注意**，完全兼容要靠 `preact/compat`
- **Hooks 不在核心**：从 `preact` 导入 `useState` 会失败，必须从 `preact/hooks`（新手常踩）
- **`preact/compat` 别名顺序有坑**：webpack/Jest 里要把具体键（`react-dom/test-utils`、`react/jsx-runtime`）放在宽泛的 `react-dom`/`react` **之前**，否则匹配错
- **生态规模仍小于 React**：虽能跑 React 库，但 Preact 专属生态、社区体量、招聘面都不及 React
- **某些 React 库可能不完全兼容**：极少数深度依赖 React 内部实现的库在 compat 下行为异常，需逐一验证
- **`render()` 的 `replaceNode` 参数将在 v11 移除**：依赖该参数的旧代码需迁移
- **事件细节差异**：事件**不穿过 Portal 冒泡**（与 React 不同）、`onChange` 语义不同——表单处理需留意
- **vs React**：超大型团队/最大生态/最多三方组件仍可能选 React；Preact 胜在「小、快、贴近 DOM」

## 文档地址

[Preact 官网](https://preactjs.com/) | [快速上手](https://preactjs.com/guide/v10/getting-started/) | [与 React 的差异](https://preactjs.com/guide/v10/differences-to-react/) | [Hooks](https://preactjs.com/guide/v10/hooks/) | [Signals](https://preactjs.com/guide/v10/signals/) | [切换到 Preact](https://preactjs.com/guide/v10/switching-to-preact/)

## GitHub 地址

[preactjs/preact](https://github.com/preactjs/preact)（主仓库，MIT 许可）| [@preact/signals](https://github.com/preactjs/signals)（信号）| [@preact/preset-vite](https://github.com/preactjs/preset-vite)（Vite 预设）

## 学习路径

- [入门](./getting-started.md)：Preact 是什么（3kB React 替代品，相同 API，对比 React） / 安装 `npm init preact` / 核心 API（`h` / `render` / `Component` / `preact/hooks`） / **与 React 的关键差异**（原生事件 / `onInput` / `class`+`className` / SVG / Hooks 在 `preact/hooks`） / 第一个 Preact 应用 / `preact/compat` 跑 React 库 / SSR
- [指南](./guide-line.md)：**核心 API**（`h`/`createElement` / `render`·`hydrate` / `Component` 的 `render(props, state)` / `Fragment`·`createContext`·`createRef`·`toChildArray`） / **Hooks**（`preact/hooks` 全清单 + Preact 专属 `useErrorBoundary`） / **与 React 差异详解**（无合成事件 / `onInput`·`onDblClick` / `class`+`className` / SVG kebab-case / Portal 不冒泡 / Context 默认全传） / **preact/compat 生态兼容**（别名配置 webpack·Vite·Rollup·Jest / 别名顺序坑 / 导出清单 / `preact/debug`·`preact/devtools`） / **@preact/signals**（`signal`·`computed`·`effect`·`batch` / JSX 直接用 signal 跳过重渲染 / `useSignal`·`useComputed` / vs `useState` / 三个包） / **工具链**（create-preact / `@preact/preset-vite` / SSR `preact-render-to-string`） / **常见坑**
