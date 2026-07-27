---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Redux / Vue / MobX / Jotai 官方文档编写，对照 2026 年前端状态管理主流实践

## 速查

- **四维度**：本地 vs 全局 / 响应式 vs 不可变 / 原子化 vs 规范化 / 单向-双向-原子
- **State Colocation**：状态放离消费它的最近层级（Kent C. Dodds「少做事」）
- **Redux 三大原则**：单一数据源 / 状态只读 / 纯函数变更
- **单向数据流五步**：State → View → dispatch(Action) → Reducer → New State
- **Normalized 四规则**：每类一表 / ID 做 key / 引用用 ID / ID 数组表顺序
- **Atomic**：独立 atom + 派生 atom 依赖图，跳过组件树层级
- **v-model = prop + event 语法糖**（Vue 3.4+ `defineModel` 宏）
- **三分法**：服务端状态 Query / UI 状态轻量 store / 实体缓存 normalized
- 完整说明见 [入门](./getting-started.md) / [架构四维度深度](./guide-line.md)

## 四维度对比总表

### ① 本地 vs 全局

| 维度 | 本地（组件内） | 全局（中心化 store） |
| --- | --- | --- |
| **作用域** | 组件实例 | 整个应用 |
| **API** | `useState` / `ref` | Redux / Pinia / Zustand / MobX |
| **典型场景** | 表单输入、modal 显隐、UI 私有状态 | 跨路由共享领域实体、用户、购物车 |
| **重渲染范围** | 仅当前组件 | 所有订阅该 state 的组件 |
| **持久化** | 组件卸载即销毁 | 应用生命周期内持久 |
| **可调试性** | 弱（散落各组件） | 强（中心化、可 time-travel） |

### ② 响应式 vs 不可变

| 维度 | 响应式 | 不可变 |
| --- | --- | --- |
| **代表库** | Vue `reactive` / MobX `observable` / Solid signals | Redux / React `setState` / Zustand / Recoil |
| **状态性质** | 可变（直接赋值） | 只读（返回新对象） |
| **改变检测** | Proxy / getter-setter 拦截读写 | 引用相等 `===` |
| **依赖追踪** | 运行时自动（track / trigger） | 手动 `useMemo` / `useCallback` |
| **派生值** | `@computed` / `computed()` 自动 | selector / reselect 手动 memo |
| **time-travel** | 难 | 易（核心卖点） |
| **SSR 序列化** | 难 | 易（plain object） |
| **样板量** | 少 | 多 |

### ③ 原子化 vs 规范化

| 维度 | Atomic（原子化） | Normalized（规范化） |
| --- | --- | --- |
| **代表库** | Jotai / Recoil | Redux normalized state |
| **结构** | 独立 atoms、无中心 store | 中心 store + `byId` 表 |
| **订阅粒度** | 天然按 atom | `useSelector` + `shallowEqual` |
| **依赖关系** | atom 依赖图（声明式） | 组件树拓扑 / Provider |
| **组件树重构** | 不影响订阅 | Provider 层级影响连接 |
| **Provider** | 可无（Jotai 默认） | 必须 Provider |
| **典型场景** | 状态分散、深层嵌套兄弟共享 | 关系型领域实体、跨路由 |

### ④ 数据流方向

| 维度 | 单向 | 双向 | 原子订阅 |
| --- | --- | --- | --- |
| **代表** | Redux | Vue `v-model` | Jotai / Recoil |
| **机制** | action → reducer → state | prop + event 语法糖 | atom 依赖图 |
| **优点** | 可预测、可审计、time-travel | 简洁、表单友好 | 最小重渲染、跳过组件树 |
| **缺点** | 样板多、性能调优需 selector | 数据流隐式、复杂场景难追踪 | 设计成本高、调试需理解依赖图 |
| **适用** | 大型应用、SSR | 表单、开关 | 性能敏感、深层嵌套 |

## 选型决策矩阵

| 场景 | 范式 | 库示例 | 理由 |
| --- | --- | --- | --- |
| 表单输入、modal 显隐 | 本地 | `useState` / `ref` | 只被一个组件消费 |
| 父子 / 兄弟组件共享 | 提升 to 公共祖先 | `useState` in parent | colocate 原则 |
| 跨路由共享领域实体 | 全局 normalized | Redux Toolkit / Pinia | 单一数据源 |
| 大型团队、time-travel | Redux Toolkit | `configureStore` | 可预测、可审计、SSR 友好 |
| 中小规模、OOP 风格 | MobX | `makeAutoObservable` | 最少样板、自动追踪 |
| Vue 生态 | Pinia | `defineStore` | Vue 官方推荐 |
| 深层嵌套兄弟共享 | Jotai / Recoil | `atom` / `useAtom` | 跳过组件树、最小重渲染 |
| 关系型实体缓存 | RTK Query / TanStack Query | `createApi` / `useQuery` | 服务端状态 + normalized 缓存 |
| 表单控件双向同步 | Vue `v-model` | `defineModel` | 语法糖、隐式同步 |
| 复杂校验 / 撤销重做 | 单向 `props + emit` | — | 显式可控 |

### 范式哲学对比（MobX vs Redux vs Atomic）

| 决策点 | MobX | Redux | Atomic（Jotai/Recoil） |
| --- | --- | --- | --- |
| **应用规模** | 中小 | 大型 | 性能敏感大型 |
| **编程风格** | OOP | 函数式 | 函数式 + 细粒度 |
| **上手成本** | 低 | 中 | 中 |
| **time-travel** | 难 | 易（核心卖点） | 中 |
| **SSR** | 难 | 易 | 中 |
| **测试** | 中 | 高（纯函数） | 中 |
| **样板量** | 最少 | 较多 | 中 |
| **重渲染控制** | 自动 | 手动 selector | 天然 atom 粒度 |

## 关键概念速查

### Redux 三大原则

1. **Single Source of Truth**：全局 state 在单一 store 的对象树
2. **State is Read-Only**：唯一变更方式是 dispatch 一个 action 对象
3. **Changes via Pure Functions**：reducer 是 `(state, action) => newState` 纯函数

### 单向数据流五步

```text
State → View → dispatch(Action) → Reducer → New State
```

### MobX 三大支柱 + Reactions

1. **Observable State**（可观察状态）
2. **Derivation / Computed**（自动派生）
3. **Action**（修改动作）
4. **Reactions**（副作用：autorun / reaction / when）

### Normalized State 四规则

1. 每种类型的数据一张表（slice）
2. 表里用 ID 做 key 存对象（`byId`）
3. 引用其他实体时只存 ID
4. 顺序用 ID 数组表示（`allIds`）

### Vue 深度响应式

- **机制**：Proxy 拦截 get/set + `WeakMap<target, Map<key, Set<effect>>>` 依赖结构
- **`ref`**：getter/setter 包裹基本类型，`.value` 访问
- **`reactive`**：Proxy 包裹对象，深度响应式
- **解构陷阱**：`reactive` 解构丢响应性，需 `toRefs` 包裹

### v-model 双向绑定展开

```vue
<MyInput v-model="text" />
<!-- 等价 -->
<MyInput :modelValue="text" @update:modelValue="text = $event" />
```

- Vue 3.4+ 用 `defineModel()` 宏简化封装

## 反模式清单

| 反模式 | 问题 | 对策 |
| --- | --- | --- |
| 所有状态塞单一全局 store | 性能首要杀手 | colocate 原则 |
| 嵌套结构存关系型数据 | 重复 + 复制祖先链成本爆炸 | normalize |
| Context Provider 顶层 + 频繁变化 value | 所有 consumer 全部重渲染 | 拆 Context 或用 store |
| 响应式不开 `enforceActions` | 状态散落、难追踪 | 强制走 action |
| Props drilling 过深 | 重构脆弱 | 组合 / Context / atom |
| Redux reducer 直接 mutate | 破坏引用相等 + time-travel | 返回新对象 / 用 Immer |
| `reactive` 对象直接解构 | 丢响应性 | 用 `toRefs` |
| 双向绑定用于复杂场景 | 数据流隐式 | 单向 props + emit |

## 版本与现状（2026-07）

| 库 / 框架 | 当前状态 |
| --- | --- |
| **Redux Toolkit** | Redux 官方默认推荐，内置 Immer + RTK Query |
| **手写 Redux** | 已不推荐（样板多、易出 bug） |
| **Vue 3.4+** | 推出 `defineModel()` 宏，简化 v-model 封装 |
| **Vue Reactivity Transform** | 已放弃（RFC 369），团队转向 Vapor Mode |
| **Immer** | 不可变更新事实标准，被 RTK / Zustand / draft-js 集成 |
| **Recoil（Meta）** | 更新放缓、社区活跃度下降 |
| **Jotai / Zustand** | 成为主流轻量方案 |
| **signals 范式** | 复兴（Solid / Qwik / Angular Signals / Preact Signals），呼应 MobX 细粒度响应式 |
| **总体走向** | 「服务端状态 Query / 客户端 UI 轻量 store / 实体缓存 normalized」三分法 |

## 官方资源

- Redux Three Principles：[https://redux.js.org/understanding/thinking-in-redux/three-principles](https://redux.js.org/understanding/thinking-in-redux/three-principles)
- Redux Normalizing State Shape：[https://redux.js.org/usage/structuring-reducers/normalizing-state-shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)
- Vue Reactivity in Depth：[https://vuejs.org/guide/extras/reactivity-in-depth.html](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- Vue Component v-model：[https://vuejs.org/guide/components/v-model.html](https://vuejs.org/guide/components/v-model.html)
- MobX README：[https://mobx.js.org/README.html](https://mobx.js.org/README.html)
- Kent C. Dodds - State Colocation：[https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster](https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster)
- Robin Wieruch - Redux vs MobX：[https://www.robinwieruch.de/redux-mobx/](https://www.robinwieruch.de/redux-mobx/)
- Jotai 官方：[https://jotai.org/](https://jotai.org/)
