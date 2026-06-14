---
layout: doc
---

# Immer

::: tip 本篇范围
本篇聚焦 **Immer —— 用「可变写法」安全产出不可变（immutable）数据的微型库**。它与手写不可变更新（层层 `...` 展开）、`structuredClone` 同属「不可变状态更新」选型方向，本篇在取舍与对比时一笔带过另两者。版本基线 **Immer 11.x**（v11 重写终态化系统、默认改为 loose iteration、新增 array methods 插件）。
:::

Immer（德语「always」）让你在一个临时的 **draft（草稿）** 上用熟悉的可变 API 随意修改，它记录这些改动并据此生成**全新的不可变 state**，原 state 分毫不动。核心是一句 `produce(baseState, draft => { ... })`：draft 是 `baseState` 的 **Proxy 代理**，你写 `draft.a.b = 1`、`draft.list.push(x)`，Immer 在配方结束后**只复制被改动路径上的节点**（结构共享），其余子树与旧状态共享引用——因此「未变即引用不变」，天然适配 React/Redux 的 memo 化与变更检测。

它**不引入任何新数据结构**：状态进出都是普通对象/数组（启用插件后还有 Map/Set），与 JSON、网络传输、组件 props 无缝衔接，这是它相对 Immutable.js 的最大差异。Immer 默认**自动深冻结**产出结果（auto-freeze），从根上防止越界 mutate；并通过可选插件按需扩展能力——`enableMapSet()`（Map/Set）、`enablePatches()`（补丁/undo-redo）、`enableArrayMethods()`（数组方法性能优化）。核心仅约 **3KB gzipped**。**2026 年的现状**：库已演进到 **v11**，Redux Toolkit 2.x 内置依赖 immer 11.x，`createSlice` 里可直接 mutate。

## 评价

**优点**

- **零学习成本的可变写法**：用原生 `push`/`delete`/赋值即可，无需记忆「不可变更新模式」，深层更新尤其省心
- **消灭样板代码**：告别层层 `...` 浅拷贝，配方里直接改 draft，Immer 自动按需复制
- **结构共享开箱即用**：只复制改动节点，未变子树共享引用，`===` 即可做高效变更检测
- **原生数据结构**：用普通对象/数组，无需 `toJS()` 来回转换，序列化/传输无摩擦
- **自动冻结防错**：默认深冻结产出结果，意外 mutate 会被拦截
- **生态深度集成**：Redux Toolkit 内置，`use-immer` 适配 React，patches 支持 undo/redo 与增量同步
- **TypeScript 友好**：`Draft<T>` / `Immutable<T>` / `castDraft` 等类型工具完善

**缺点**

- **Proxy 开销**：比纯手写 reducer 慢约 2–3 倍（实践中通常可忽略），超热路径可局部弃用
- **依赖 Proxy 环境**：v10 起移除 ES5 回退，不支持无 Proxy 的老环境
- **几个易踩的坑**：`draft = newObj`（重新赋值）无效、不能「既改 draft 又 return 新值」、`return undefined` 需用 `nothing`
- **能力需显式启用**：Map/Set、patches 默认关闭，忘了 `enableMapSet()`/`enablePatches()` 会报错
- **不支持奇异对象**：DOM Node、Buffer、`window.location` 等不可 draft；类需 `[immerable]=true`
- **假设单向树**：循环引用 / 同一对象出现两次会出问题，图结构要先规范化

## 文档地址

[Immer 官方文档](https://immerjs.github.io/immer/)

## GitHub 地址

[immerjs/immer](https://github.com/immerjs/immer)

## 幻灯片地址

<a href="/SlideStack/immer-slide/" target="_blank">Immer</a>
