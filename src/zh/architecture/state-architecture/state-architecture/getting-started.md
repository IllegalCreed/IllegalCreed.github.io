---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Redux / Vue / MobX / Jotai 官方文档与 Kent C. Dodds「State Colocation」经典论述编写，对照 2026 年前端状态管理主流实践

## 速查

- **四维度**：①本地 vs 全局（放哪）②响应式 vs 不可变（怎么变）③原子化 vs 规范化（怎么拆）④单向 / 双向 / 原子（数据流向）
- **State Colocation**：把状态放在**离消费它的组件最近的层级**——「让东西变快的最佳方式是少做事」
- **Lifting State Up**：多组件共享同一 state 时**提升到最近公共祖先**，并持续反向审视能否下推
- **Redux 三大原则**：Single Source of Truth / State is Read-Only / Changes via Pure Functions
- **单向数据流五步**：State → View → dispatch(Action) → Reducer → New State
- **响应式 vs 不可变核心差异**：状态可变（依赖追踪 track/trigger）vs 只读（引用相等 `===`）
- **MobX 三大支柱**：Observable State / Derivation（Computed）/ Action + Reactions
- **Vue 深度响应式**：Proxy 拦截 get/set，`WeakMap<target, Map<key, Set<effect>>>` 依赖结构；`ref`（getter/setter）vs `reactive`（Proxy）
- **Normalized State 范式**：`{ byId: {[id]: item}, allIds: [id...] }`，每类一表 / ID 做 key / 引用用 ID / ID 数组表示顺序
- **Atomic State**：状态拆为独立可订阅最小单元（atom），atom 之间形成有向依赖图
- **v-model 双向绑定**：编译展开为 `prop modelValue + event update:modelValue` 的语法糖，Vue 3.4+ 用 `defineModel()` 宏
- **三分法走向（2026）**：服务端状态 → Query 库；客户端 UI 状态 → 轻量 store/atom；实体缓存 → normalized / Query 缓存

## 状态架构是什么

状态架构是「应用状态如何组织」的**架构层**取舍，回答四个正交维度的问题——每个维度都是「连续光谱」而非二元选择：

| 维度 | 一端 | 另一端 |
| --- | --- | --- |
| **位置** | 本地（组件内） | 全局（中心化 store） |
| **变更范式** | 响应式（可变 + 依赖追踪） | 不可变（替换 + 引用相等） |
| **拆分粒度** | 原子化（独立 atom） | 规范化（中心表 + ID 引用） |
| **数据流向** | 单向 / 双向 / 原子订阅 | — |

> 这四个维度独立选择、组合出 16+ 种状态风格——没有任何「最优解」，只有「适合场景的解」。

## 四维度速览

### ① 本地 vs 全局（状态放哪）

- **本地（默认）**：组件内 `useState` / `ref`，作用域是组件实例。表单输入、tooltip/modal 显隐、快速变化的状态
- **全局**：中心化 store（Redux / Pinia / Zustand）。跨路由跨组件共享的领域实体（用户、购物车）
- **判断起点**：从 `useState` 起步 → 谁用 → 多组件共享就提升到公共祖先（Lifting State Up）→ 跨路由共享再考虑全局 store
- **关键原则**：**State Colocation**——放在消费它的最近组件层级，state 越高重渲染子树越大

### ② 响应式 vs 不可变（怎么变）

| 范式 | 代表库 | 改变检测 | 书写风格 |
| --- | --- | --- | --- |
| **响应式** | Vue `reactive` / MobX `observable` | Proxy 拦截读写、`track` 收集依赖、`trigger` 触发 effect | 可变（直接赋值） |
| **不可变** | Redux / React `setState` / Zustand | 引用相等 `===`（旧 vs 新对象） | 替换（返回新对象） |

> Immer `produce` 是「不可变结果 + 可变书写」的桥接层——Redux Toolkit 内置，让你写 `state.x = 1` 但产出新对象。

### ③ 原子化 vs 规范化（怎么拆）

- **原子化（Jotai / Recoil）**：状态拆为独立可订阅最小单元 atom，atom 之间通过 `atom(get => ...)` / `selector` 形成有向依赖图——不挂在组件树任何层级
- **规范化（Redux normalized state）**：每类实体一张 `{ byId, allIds }` 表放在中心 store，组件通过 ID 引用、ID 数组表示顺序

> 两者根本分歧：atom 依赖图天然按订阅粒度触发重渲染；规范化中心 store 需配合 `useSelector` + `shallowEqual` 手动控制。

### ④ 数据流方向

| 方向 | 代表 | 底层机制 | 适用 |
| --- | --- | --- | --- |
| **单向** | Redux | dispatch(Action) → reducer 纯函数 → 新 state | 大型应用、time-travel、SSR |
| **双向** | Vue `v-model` | prop + event 的语法糖（隐式同步） | 表单输入、开关、简单同步 |
| **原子订阅** | Jotai / Recoil | 组件直接订阅 atom，跳过组件树层级 | 深层嵌套兄弟组件共享、性能敏感 |

## 入门决策树

新状态出现时，按以下顺序判断（来自 Kent C. Dodds / React 官方推荐）：

```text
1. 这个 state 谁会用？
   ├─ 只有当前组件 → useState / ref（本地）
   └─ 多个组件共享 → 进入 2

2. 这些组件的共同祖先有多远？
   ├─ 很近（父子 / 兄弟）→ 提升到最近公共祖先（Lifting State Up）
   └─ 很远（跨路由 / 跨模块）→ 进入 3

3. 状态性质？
   ├─ 服务端数据（API 返回的实体）→ Query 库（RTK Query / TanStack Query）
   ├─ 客户端 UI 状态（开关、表单草稿）→ 轻量 store / atom
   └─ 关系型领域实体（用户/订单/评论）→ normalized state 或 Query 缓存

4. 持续反向审视：state 还需要全局吗？
   └─ 只剩一个组件使用 → 下推回本地（colocate 是持续重构过程）
```

> 「应用能跑 ≠ 位置最优」——colocate 是一次性决定还是持续重构过程，决定项目长期可维护性。

## 选型矩阵速览

| 场景 | 推荐范式 | 理由 |
| --- | --- | --- |
| 表单输入、modal 显隐 | 本地 `useState` / `ref` | 只被一个组件消费 |
| 父子 / 兄弟组件共享 | 提升 to 公共祖先 | colocate 原则 |
| 跨路由共享领域实体 | 全局 store（normalized） | 单一数据源 |
| 大型团队、time-travel | Redux Toolkit（不可变 + 单向） | 可预测、可审计 |
| 中小规模、最少样板 | MobX / Vue Pinia（响应式） | 自动追踪依赖 |
| 深层嵌套兄弟组件共享 | Jotai / Recoil（原子化） | 跳过组件树 |
| 表单控件双向同步 | Vue `v-model`（双向） | 语法糖、隐式同步 |
| 复杂校验 / 撤销重做 | 单向 `props` + `emit` | 显式可控 |

## 反模式速查（避坑）

- **把所有状态塞进单一全局 store**：快速变化状态进 Redux = 性能首要杀手
- **嵌套结构存关系型数据**：`posts:[{author:{...}, comments:[{author:{...}}]}]` 致数据重复 + 更新复制祖先链成本爆炸
- **Context Provider 顶在应用最顶层 + value 含频繁变化字段**：所有 consumer 全部重渲染
- **响应式范式下不开 `enforceActions`**：状态散落各组件直接 mutate，重蹈 flux 之前覆辙
- **Props drilling 过深**：层层透传 state 与回调，重构脆弱
- **Redux reducer 中直接 mutate state**：破坏引用相等检测与 time-travel
- **对 Vue `reactive()` 对象直接解构**：丢失响应性，需 `toRefs` 包裹
- **双向绑定用于跨层级 / 复杂校验 / 撤销重做**：数据流隐式难追踪

## 下一步

- [架构四维度深度](./guide-line.md)：本地 vs 全局、响应式 vs 不可变、原子化 vs 规范化、单向 / 双向 / 原子、选型决策与反模式
- [参考](./reference.md)：四维度对比表、选型矩阵、官方资源链接
