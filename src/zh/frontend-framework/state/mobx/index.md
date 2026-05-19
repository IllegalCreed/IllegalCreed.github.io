---
layout: doc
---

# MobX

**老牌「响应式（observable / reactive）派」状态管理库**——准确地说，MobX 是 **2015 年由 Michel Weststrate**（[mweststrate](https://github.com/mweststrate)，同时也是 **Immer** 作者）以「**MOBservable**」之名发布、后改为 **MobX** 的 JavaScript 状态容器。MobX 的灵感来自**电子表格 / Knockout.js / Vue 响应式系统**——把状态视为「**电子表格的单元格**」、把派生值视为「**公式**」、把副作用视为「**自动重算的脚本**」——状态变化 → 依赖此状态的派生值与副作用**自动**重新计算。与 **Redux**（reducer 派 / immutable）/ **Zustand**（hook-store 派）/ **Jotai**（atom 派）形成**鲜明对照**：**MobX 是「响应式 + mutable」的代表**——你可以**直接 mutate**（`store.count++`、`store.todos.push(...)`），MobX 自动捕获变化、通知所有依赖该数据的组件 / 派生 / 副作用。**核心理念**：「**任何派生自 state 的内容（UI / computed / 副作用）都应该自动且原子地更新**」+「**Anything that can be derived from the application state should be**」——这就是著名的 MobX 的**两条核心信条**。**最新 v6.x**（MobX 核心 v6.13+ / 2024-2026 发布 + **mobx-react-lite v4.x** / 2024 起 + **mobx-react v9.x** / 2024 起）作为一个**协调发布的版本群**已经**完全 TypeScript 重写**、**默认不再依赖装饰器**（v6 最大变化，详见底部「v5 → v6 迁移」）、引入 **`makeObservable` + `makeAutoObservable`** 作为标准 API、要求 **TypeScript 4.7+** + **React 16.8+**——这是当前事实标准。**核心特性矩阵**：响应式 mutable（`store.x = 1` 直接生效）/ 自动依赖追踪（`computed` 读哪个 observable 就依赖哪个）/ **细粒度订阅**（属性级别，不是 store 级别）/ `makeObservable` + `makeAutoObservable`（v6 标准 API）/ TypeScript 一等公民（自动推导）/ 反应性 API 完整（`autorun` / `reaction` / `when`）/ 异步处理（async/await + `runInAction` / `flow` 生成器）/ Class & Plain Object 双支持 / `observer` HOC（[mobx-react-lite](https://github.com/mobxjs/mobx-react-lite) 4.x 极轻量）/ DevTools（`mobx-react-devtools` 已 archived，新方案是 [mobx-logger](https://github.com/winstonww/mobx-logger) / `spy` + 浏览器 DevTools）/ SSR 友好 / 跨框架支持（Vue / Angular / Svelte / vanilla 都能用 MobX core）/ 配套生态（[`mobx-state-tree`](https://mobx-state-tree.js.org/) 类型化 + snapshot + 时间旅行 / [`mobx-utils`](https://github.com/mobxjs/mobx-utils) 工具集 / [`mobx-keystone`](https://mobx-keystone.js.org/) class-based 替代 MST）。**典型用户群**：**长期被大型企业 React 应用青睐**——**Microsoft Office Online**（PowerPoint / Excel Web）、**Outlook Web**、**Mendix**（低代码平台、MobX 起源公司）、**Coinbase**、**Lyft**、**Slack** 早期、**MJML**、**SurveyMonkey**、大量 **Wix** 产品、**Facebook Bloks** 等历史使用——尤其在**复杂表单 / 复杂业务规则 / 大量派生数据**的场景中占主导；2024-2026 年虽然 npm 下载排名被 Zustand / Jotai 超越，但**已部署的企业大型项目数量仍非常可观**，许多团队从 Redux 迁移到 MobX 后形成的代码基础持续运行。

## 评价

**优点**

- **响应式心智模型最直观**：`store.count++` / `store.user.name = "新名字"` / `store.todos.push(item)` —— **直接 mutate** 即可触发 UI 更新、computed 重算、reaction 执行——**完全不需要**写 reducer / dispatch / set / 不可变更新——心智成本是「状态管理库中最低之一」（与 Vue 响应式 / Valtio 同档）
- **自动依赖追踪**：computed / autorun / reaction / observer 组件读哪个 observable 就**自动**建立依赖图、observable 变化时**精确**重算受影响的派生 + 副作用——**完全无需手动声明依赖数组**（区别于 React `useMemo`/`useEffect` deps 数组）
- **细粒度订阅**：`observer` HOC 只追踪组件**实际读到**的属性、不是整个 store——`user.name` 变化只重渲读 `user.name` 的组件、`user.email` 变化与之无关——比 Redux 的「store 级订阅 + useSelector」更高效、比 Zustand 的「手动 selector + useShallow」心智更低
- **复杂派生最优雅**：嵌套 `computed`、跨 store 派生、parametrized derivations 都用普通 getter 表达——配合 `mobx-utils` 的 `computedFn` 解决参数化记忆——比 Redux 的「reselect createSelector 嵌套链」简洁
- **同步 + 异步统一**：异步操作用 `runInAction` 显式包裹 await 后的 set / 用 `flow` 生成器替代 async/await + 自动 action 包装——**没有 thunk / saga / observable 的复杂中间件**
- **TypeScript 一等公民**：`makeAutoObservable(this)` 自动推导所有字段类型、`@observable accessor count = 0` 装饰器写法语义清晰、`computed`/`action` 注解可选——大型项目 TS 体验是顶级的
- **跨框架支持**：MobX core 是纯 JS、不依赖 React——可以在 Vue（[mobx-vue-lite](https://github.com/mobxjs/mobx-vue-lite)）/ Angular / Svelte / vanilla JS / Node / Web Worker 中使用，store 逻辑可在不同框架间复用
- **Class & Plain Object 双支持**：既能用 `class Store { ... makeAutoObservable(this) }` 写法（类型清晰、有 prototype 优化）、也能用 `observable({ x: 1, inc() { this.x++ } })` 函数式写法——根据团队偏好选择
- **`mobx-state-tree` 提供完整 OOM**：[MST](https://mobx-state-tree.js.org/) 是 MobX 之上的「**Models 类型系统 + Snapshot + Patch + 时间旅行**」框架——比 Redux Toolkit 更接近「**面向对象 + 函数式 + immutable 三合一**」、Mendix 等企业级低代码平台首选
- **mobx-react-lite 极致轻量**：核心 ~2KB gzip、只导出 `observer` / `useLocalObservable` / `Observer` 组件——对比 `mobx-react`（9.x）支持 class component 但体积更大，**函数组件 + hooks 项目首选 lite**
- **Bundle 体积合理**：MobX core ~16KB gzip（v6 已经 tree-shake 优化）+ mobx-react-lite ~2KB——比 Redux Toolkit + RTK Query 小、比 Jotai / Zustand 大，**中等**

**缺点**

- **mutable 语义牺牲 immutable 优势**：直接 mutate 心智虽轻、但**失去 Redux 时间旅行 / Snapshot diff / 不可变 history**等 immutable 模式天然支持——补救方案是 `mobx-state-tree` 提供 snapshot 能力（额外学习成本）
- **`makeObservable` 必须在 constructor 调用**：v6 要求在每个 class constructor 显式调用 `makeObservable(this, {...})` 或 `makeAutoObservable(this)`——**新人最容易忘**、忘了之后 reactive 不工作但又**没有运行时报错**（只是默默不响应）
- **响应式陷阱**：解构 observable（`const { name } = user`）→ `name` 是普通 primitive、**不再追踪**——必须 `user.name` 直接读取；这是 MobX 最常见的「**为什么我的组件不更新**」原因（详见 [指南 > 响应式陷阱](./guide-line.md#响应式陷阱))
- **`observer` 不能漏**：任何读 observable 的组件都必须 `export default observer(MyComponent)`——忘了一个组件 → 该组件不响应——团队需要 ESLint 规则（[`eslint-plugin-mobx`](https://github.com/mobxjs/mobx/tree/main/packages/eslint-plugin-mobx)）强制
- **学习曲线中等**：observable / action / computed / reaction / autorun / observer / runInAction / flow 概念虽然各自简单、**组合起来需要 1-2 周熟练**——比 Zustand（10 分钟）/ Jotai（30 分钟）陡、比 Redux（2-4 周）平
- **DevTools 弱**：官方 `mobx-react-devtools` 已 **archived 不维护**——目前主要靠 [`mobx-logger`](https://github.com/winstonww/mobx-logger) + `spy` + Chrome DevTools 控制台、**没有 Redux DevTools 那种时间旅行 / state diff** 的浏览器扩展（除非用 `mobx-state-tree`）
- **v4/v5 → v6 迁移成本**：v6 把装饰器从默认改为可选、引入 `makeObservable` 必须调用——存量 v4/v5 项目升级需要全局改动（虽然有 `mobx-undecorate` codemod 辅助）
- **TypeScript 配置易踩坑**：`useDefineForClassFields: true` 必须设、装饰器版本（legacy / stage-3）选择影响语法——配错了类型推导失败
- **vs Redux Toolkit**：RTK 强调严格 reducer + slice + RTK Query + 严格审计；MobX 强调直观 mutable + 自动依赖——**金融 / 医疗 / 政府严格场景用 RTK、复杂业务规则 + 表单密集场景用 MobX**
- **vs Zustand**：Zustand 心智更轻（10 分钟入门）+ bundle 更小（~1KB）+ 只用 React hooks；MobX 心智中等 + 跨框架 + 自动追踪——**简单全局状态用 Zustand、复杂派生 + 业务规则用 MobX**
- **vs Jotai**：Jotai 是 atom 派 + 细粒度依赖追踪（atom 图）+ Suspense 一等公民；MobX 是 object 派 + 细粒度依赖追踪（属性图）+ mutable——**派生 atom 多的中后台用 Jotai、复杂业务对象模型用 MobX**
- **vs Vue 响应式（Pinia）**：心智模型几乎一致（mutable + 自动追踪）、但 Vue 内置 React 必须额外用 MobX——**Vue 用 Pinia、React 用 MobX 是各自生态的等价选择**
- **vs Valtio**：同为 mutable proxy 派（Valtio 是 Poimandres / Daishi Kato 作品）——Valtio 更轻（~3KB）+ API 更小、MobX 更成熟 + 配套 MST/utils 更丰富——**简单 UI 状态 Valtio、复杂业务模型 MobX**
- **`flow` 生成器语法陌生**：`*fetchData() { const r = yield fetch(...) }` 替代 async/await——好处是自动 action 包装、坏处是**调试栈难看**（`yield` 中断点不友好）
- **不再是 React 状态管理首选**：2026 年 React 官方文档（[Managing State](https://react.dev/learn/managing-state)）已推荐 Zustand / Jotai / Redux Toolkit、**未列 MobX**——MobX 仍是大型企业既存项目主力、但**新项目 React 团队优先考虑其他三家**

## 文档地址

[MobX 官网](https://mobx.js.org/) | [The Gist of MobX](https://mobx.js.org/the-gist-of-mobx.html)（10 分钟概览）| [Observable State](https://mobx.js.org/observable-state.html) | [Actions](https://mobx.js.org/actions.html) | [Computeds](https://mobx.js.org/computeds.html) | [Reactions](https://mobx.js.org/reactions.html) | [React integration](https://mobx.js.org/react-integration.html) | [API Reference](https://mobx.js.org/api.html) | [Migrating from MobX 4/5](https://mobx.js.org/migrating-from-4-or-5.html) | [Enabling decorators](https://mobx.js.org/enabling-decorators.html) | [mobx-state-tree 官网](https://mobx-state-tree.js.org/)

## GitHub 地址

[mobxjs/mobx](https://github.com/mobxjs/mobx)（monorepo：core + mobx-react + mobx-react-lite + eslint-plugin）| [mobxjs/mobx-state-tree](https://github.com/mobxjs/mobx-state-tree) | [mobxjs/mobx-utils](https://github.com/mobxjs/mobx-utils) | [Michel Weststrate](https://github.com/mweststrate)（作者、Immer 作者）| [mobx-vue-lite](https://github.com/mobxjs/mobx-vue-lite) | [mobx-keystone](https://github.com/xaviergonz/mobx-keystone)（MST 替代，class-based）

## 学习路径

- [入门](./getting-started.md)：`pnpm add mobx mobx-react-lite` 安装 / 第一个 observable（`makeObservable` / `makeAutoObservable` / `observable` 三种姿势）/ action 包装 mutation / computed 自动派生 / 在 React 中使用（`observer` HOC + `useLocalObservable`）/ Class vs Plain Object 写法 / 异步处理基础（`runInAction` + `flow`）/ TypeScript 基础（`makeAutoObservable` 自动推导 + `@observable accessor` 装饰器）/ Todo List 完整示例
- [指南](./guide-line.md)：**核心**：observable 类型（object / array / map / set / box / ref / shallow / struct）/ `makeObservable` 完整 annotation 表 / `makeAutoObservable` 推断规则 + overrides / action 全谱（`action` / `action.bound` / `runInAction` / `flow` / `flow.bound` / `flowResult`）/ computed 完整选项（`equals` / `keepAlive` / `requiresReaction` / `struct`）/ Reactions 全谱（`autorun` / `reaction` / `when` + options 全表）/ mobx-react-lite（`observer` HOC / `Observer` 组件 / `useLocalObservable` / `useObserver` / 延迟解引用 / 列表渲染优化）/ Class 组件支持（`mobx-react`）/ Store 设计（Single Store / Multi Store / Root Store + Context）/ TypeScript 完整模式 / 装饰器（legacy / stage-3 / TS 5.0 native）/ DevTools 调试（`trace` / `spy` / `getDependencyTree` / `mobx-logger`）/ 集成 React DevTools / SSR（Next.js / Remix）/ 测试（Vitest / Jest + mock store）/ `mobx-state-tree`（MST）简介 / 跨框架（mobx-vue-lite）/ `configure` 全选项（`enforceActions` / `useProxies` 等）/ 性能优化（observer 拆分 / late dereference / list rendering） / 常见踩坑（解构丢响应、忘了 observer、forget makeObservable、组件外读 observable、async 后未 runInAction）/ v5 → v6 迁移
- [参考](./reference.md)：**API 速查**：`makeObservable` / `makeAutoObservable` / `observable` 全签名（object / array / map / set / box / ref / shallow / struct） / `action` / `action.bound` / `runInAction` / `flow` / `flow.bound` / `flowResult` / `computed` / `autorun` / `reaction` / `when` / `observe` / `intercept` / `onBecomeObserved` / `onBecomeUnobserved` / `untracked` / `transaction` / `configure` / `toJS` / `isObservable*` 检查函数 / `trace` / `spy` / `getDependencyTree` / `getObserverTree` / `createAtom` / `observer` / `Observer` / `useLocalObservable` / Annotations 完整表 / TypeScript 类型（`IObservableValue` / `IObservableArray` / `Lambda` / `IReactionDisposer`）/ Import 来源速查 / v5 → v6 迁移 checklist