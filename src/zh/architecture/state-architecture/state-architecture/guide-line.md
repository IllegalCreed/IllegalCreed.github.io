---
layout: doc
outline: [2, 3]
---

# 架构四维度深度

> 基于 Redux / Vue / MobX / Jotai 官方文档与 Kent C. Dodds「State Colocation will make your React app faster」经典论述编写，对照 2026 年前端状态管理主流实践

## 速查

- **State Colocation 原则**：状态放在离消费它的组件**最近层级**——「让东西变快的最佳方式是少做事」
- **Lifting State Up 决策树**：`useState` 起步 → 谁用 → 提升到公共祖先 / 下推到唯一消费者；**持续重构**而非一次性决定
- **Redux 三大原则**：Single Source of Truth / State is Read-Only / Changes via Pure Functions
- **单向数据流五步**：State → View → dispatch(Action) → Reducer → New State
- **响应式 vs 不可变**：Proxy track/trigger 自动依赖追踪 vs `===` 引用相等手动 memo
- **MobX 三大支柱 + Reactions**：Observable State / Derivation（Computed）/ Action + 副作用 Reactions
- **Vue 深度响应式**：Proxy + `WeakMap<target, Map<key, Set<effect>>>`；`reactive()` 解构丢响应性需 `toRefs`
- **Normalized State 四规则**：每类一表 / 对象用 ID 做 key / 引用用 ID / ID 数组表示顺序
- **Atomic vs Normalized**：atom 依赖图天然按订阅粒度触发 vs `useSelector + shallowEqual` 手动控制
- **v-model = prop + event 语法糖**（Vue 3.4+ `defineModel()` 宏）
- **三分法（2026）**：服务端状态 Query / 客户端 UI 轻量 store / 实体缓存 normalized

## 维度一：本地 vs 全局（状态放哪）

### State Colocation 原则

**定义**：把状态放在**离消费它的组件最近的层级**——Kent C. Dodds 在 [State Colocation will make your React app faster](https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster) 中提出，核心理念是「让东西变快的最佳方式是少做事」。

**为什么让应用更快**

- React 更新时必须检查所有可能引用该 state 的子组件
- state 放得越高 → 失效子树越大、重渲染范围越广
- 下移后 → React 只检查真正引用它的少量组件

```ts
// 反模式：把只被一个组件用的输入值塞进全局 store
const useGlobalInput = create((set) => ({ query: "", setQuery: (q) => set({ query: q }) }));

// 正确：colocate 在使用的组件内
const SearchBox = () => {
  const [query, setQuery] = useState(""); // 本地状态
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
};
```

> 「让东西变快的最佳方式是少做事」——少做事 = state 放近一点 = 失效子树小一点。

### Lifting State Up（状态提升）

**判断决策树**

```text
新状态出现
  │
  ├─ 只有一个组件用 → 留在那个组件（本地 useState）
  │
  ├─ 多个组件共享
  │    │
  │    ├─ 共同祖先很近（父子 / 兄弟） → 提升到最近公共祖先（Lifting State Up）
  │    │
  │    └─ 跨路由 / 跨模块 → 提升到全局 store（Redux / Pinia / Zustand）
  │
  └─ 持续反向审视：这个 state 还需要全局吗？
       └─ 只剩一个组件使用 → 下推回本地
```

**关键认知**：colocate 是**持续重构过程**而非一次性决定——应用能跑 ≠ 位置最优。每次重构都要反向审视「这个 state 现在还有谁用」，剩下单一消费者就果断下推。

### 哪些状态保留在本地

- **表单输入**（受控组件的 value）
- **tooltip / modal / dropdown 显隐**
- **快速变化的状态**（鼠标位置、滚动位置、拖拽中间态）
- **组件私有 UI 状态**（折叠 / 展开、tab 当前激活）

> 这些状态只被一个组件消费，放全局会触发大面积重渲染；Redux / Context value 变化会让所有 consumer 重算。

### 哪些状态需要全局

- **跨路由共享的领域实体**（当前用户、购物车、配置）
- **多模块共同读写的服务端缓存**（normalized entities）
- **跨组件树的状态联动**（如主题、locale）

## 维度二：响应式 vs 不可变（怎么变）

### 核心哲学差异

| 维度 | 响应式（MobX / Vue reactive） | 不可变（Redux / React setState） |
| --- | --- | --- |
| **状态性质** | 可变（直接赋值 `state.x = 1`） | 只读（必须返回新对象） |
| **改变检测** | Proxy / getter-setter 拦截读写、`track` 收集依赖、`trigger` 触发 effect | 引用相等 `===`（旧对象 vs 新对象） |
| **依赖追踪** | 运行时自动构建依赖树 | 手动维护 `useMemo` / `useCallback` 依赖数组 |
| **派生值** | `@computed` / `computed()` 自动追踪 | selector / reselect 手动 memo |
| **书写风格** | 命令式、可变 | 函数式、声明式 |
| **样板量** | 少（自动追踪） | 多（action / reducer / dispatch / memo） |
| **time-travel** | 难（状态可变、历史快照成本高） | 易（每次新对象，直接序列化） |
| **SSR 序列化** | 难（需 observable 转 plain） | 易（plain object 直接 JSON.stringify） |

### Redux 三大原则（不可变范式标杆）

1. **Single Source of Truth**（单一数据源）：全局 state 存于**单一 store** 的对象树，便于调试、序列化、回放
2. **State is Read-Only**（状态只读）：唯一变更方式是 **dispatch 一个描述意图的 action 对象**
3. **Changes via Pure Functions**（纯函数变更）：reducer 是 `(state, action) => newState` 纯函数，返回新对象不 mutate

### 单向数据流五步

```text
State（当前状态）
   ↓
View（UI 渲染）
   ↓
dispatch(Action)（用户交互触发 action）
   ↓
Reducer（纯函数计算新 state）
   ↓
New State（新状态进入下一轮）
```

> 单向 = 数据流可预测、可审计、可回放——这是 Redux time-travel 调试的理论基础。

### MobX 三大支柱 + Reactions

1. **Observable State**：`observable` / `observable.object` 把状态标记为可观察
2. **Derivation（Computed）**：`@computed` / `derived` 自动从 observable 派生值，依赖变化自动重算
3. **Action**：修改状态的函数；推荐 `enforceActions` 强制走 action 修改
4. **Reactions**（副作用）：`autorun` / `reaction` / `when`，响应 observable 变化执行副作用

**指导原则**：「任何能从 state 派生的东西都应自动派生」——不要手动 memo，让框架自动构建依赖树。

### Vue 深度响应式原理

- **机制**：Proxy 拦截 get/set，`track` 收集当前 effect 为依赖、`trigger` 触发所有依赖 effect 重算
- **依赖结构**：`WeakMap<target, Map<key, Set<effect>>>`——按对象 → 属性 → effect 三层组织
- **`ref` vs `reactive`**：
  - `ref`：用 getter/setter 包裹基本类型，`.value` 访问
  - `reactive`：用 Proxy 包裹对象，深度响应式

```ts
// 陷阱：reactive 对象解构丢响应性
const state = reactive({ count: 0 });
const { count } = state;  // 陷阱：count 是普通值，不再响应
count++;                  // 视图不更新

// 正确：用 toRefs 包裹
const { count } = toRefs(state);  // count 是 ref，保持响应
```

### Immer：可变书写 + 不可变结果

`produce(state, draft => { draft.x = 1 })` 以可变风格书写，产出新对象——Redux Toolkit 内置 Immer，让 reducer 写起来像 mutate 但实际不可变。这是「响应式书写习惯 + 不可变语义」的桥接层。

## 维度三：原子化 vs 规范化（怎么拆）

### Normalized State Shape（Redux 范式）

**标准结构**

```ts
{
  posts: {
    byId: { 1: { id: 1, title: "..." }, 2: { id: 2, title: "..." } },
    allIds: [1, 2]
  },
  comments: {
    byId: { 101: { id: 101, postId: 1, text: "..." } },
    allIds: [101]
  }
}
```

**四规则**（来自 Redux 官方 [Normalizing State Shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)）

1. 每种类型的数据**一张表**（一个 slice）
2. 表里用 **ID 做 key** 存对象（`byId`）
3. 引用其他实体时**只存 ID**，不嵌套
4. 顺序用 **ID 数组**表示（`allIds`）

**为什么必须 normalize**

| 维度 | 嵌套结构（反模式） | normalized（推荐） |
| --- | --- | --- |
| **数据重复** | 同一 author 嵌入到多个 post | 一份 author、post 用 authorId 引用 |
| **更新复杂度** | O(深度) 复制整条祖先链 | O(1) 替换单个 `byId[id]` |
| **重渲染范围** | 更新一条评论波及所有 Post | 仅评论相关组件重渲染 |
| **一致性** | 多处副本同步难 | 单一来源，自动一致 |

### Atomic State（Jotai / Recoil 范式）

**核心思想**：状态拆为独立可订阅**最小单元**（atom），atom 之间通过 `atom(get => ...)` / `selector` 形成有向依赖图。

```ts
// Jotai 示例
const priceAtom = atom(100);
const qtyAtom = atom(2);
const totalAtom = atom((get) => get(priceAtom) * get(qtyAtom)); // 派生 atom

// 组件直接订阅 totalAtom，不关心 priceAtom/qtyAtom 在哪一层
const Total = () => {
  const total = useAtomValue(totalAtom);
  return <div>{total}</div>;
};
```

### Atomic vs Normalized 根本分歧

| 维度 | Atomic（Jotai / Recoil） | Normalized（Redux） |
| --- | --- | --- |
| **状态结构** | 独立 atoms，无中心 store | 中心 store + `byId` 表 |
| **订阅粒度** | 天然按 atom 粒度触发重渲染 | `useSelector` + `shallowEqual` 手动控制 |
| **依赖关系** | atom 依赖图（声明式） | 组件树拓扑 / Provider 层级 |
| **重构组件树** | 订阅关系绑在 atom 上，不受影响 | Provider 层级移动会影响连接 |
| **Provider** | 可无 Provider（Jotai 默认） | 必须 Provider 包裹 |
| **适用** | 状态分散、性能敏感、深层嵌套兄弟共享 | 关系型领域实体、跨路由共享 |

### Derived Atoms / Atom 依赖图

- **Jotai**：`atom(get => get(a) + get(b))` 声明派生 atom，依赖图自动构建
- **Recoil**：`selector({ get: ({ get }) => ... })` 类似机制

对比 Redux 的 `selector / reselect`：Redux selector 是**命令式组合**（`createSelector(a, b, (a, b) => ...)`），atom 是**声明式响应式数据流**。

## 维度四：数据流方向

### 单向（Redux）

**定义**：dispatch(Action) → reducer 纯函数 → 新 state → 视图刷新——状态只能从 reducer 流出，UI 只能 dispatch action 触发变更。

**适用**：大型团队协作、需要 time-travel 调试、SSR 状态序列化、高可测试性、可预测变更审计。

### 双向（Vue v-model）

**底层展开**

```vue
<!-- 等价于 -->
<MyInput v-model="text" />
<MyInput :modelValue="text" @update:modelValue="text = $event" />
```

- Vue 3.4+ 推出 `defineModel()` 宏，简化自定义组件 v-model 封装：

```ts
// 子组件
const model = defineModel<string>(); // 自动展开为 prop + emit
```

**适用**：表单输入、开关、简单状态同步——底层是 prop + event 语法糖、隐式同步。

**何时改用单向**：复杂业务逻辑、需要校验 / 转换 / 中间草稿 / 多状态联动时——单向 `props` + `emit` 显式可控。

### 原子订阅（Jotai）

**定义**：组件直接订阅 atom，atom 之间通过依赖图自动派生——数据流不经过组件树层级。

**适用**：深层嵌套兄弟组件共享、性能敏感（最小重渲染）、无需 Provider 包裹。

### 三种方向对比

| 方向 | 代表 | 底层机制 | 优点 | 缺点 |
| --- | --- | --- | --- | --- |
| **单向** | Redux | action → reducer → state | 可预测、可审计、time-travel | 样板多、性能调优需 selector |
| **双向** | Vue v-model | prop + event 语法糖 | 简洁、表单友好 | 数据流隐式、复杂场景难追踪 |
| **原子订阅** | Jotai / Recoil | atom 依赖图 | 最小重渲染、跳过组件树 | 设计成本高、调试需理解依赖图 |

## 选型决策矩阵

| 场景 | 范式选择 | 理由 |
| --- | --- | --- |
| 表单输入、modal 显隐 | 本地 `useState` / `ref` | 只被一个组件消费 |
| 父子 / 兄弟组件共享 | 提升 to 公共祖先 | colocate 原则、最近层级 |
| 跨路由共享领域实体 | 全局 normalized store | 单一数据源 |
| 大型团队、time-travel | Redux Toolkit（不可变 + 单向） | 可预测、可审计、SSR 友好 |
| 中小规模、OOP 风格 | MobX（响应式 + 三大支柱） | 最少样板、自动追踪 |
| Vue 生态 | Pinia（响应式 + Composition API） | Vue 官方推荐 |
| 深层嵌套兄弟共享 | Jotai / Recoil（原子化） | 跳过组件树、最小重渲染 |
| 关系型实体缓存 | RTK Query / TanStack Query | 服务端状态 + normalized 缓存 |
| 表单控件双向同步 | Vue `v-model` | 语法糖、隐式同步 |
| 复杂校验 / 撤销重做 | 单向 `props` + `emit` | 显式可控、可调试 |

### 范式选型决策（MobX vs Redux vs Atomic）

| 决策点 | 选 MobX | 选 Redux | 选 Atomic（Jotai/Recoil） |
| --- | --- | --- | --- |
| **应用规模** | 中小 | 大型 | 性能敏感大型 |
| **编程风格** | OOP | 函数式 | 函数式 + 细粒度 |
| **上手成本** | 低（自动追踪） | 中（action / reducer） | 中（atom 设计） |
| **time-travel** | 难 | 易（核心卖点） | 中 |
| **SSR** | 难（observable 序列化） | 易（plain object） | 中 |
| **测试** | 中 | 高（纯函数） | 中 |
| **样板量** | 最少 | 较多 | 中 |
| **重渲染控制** | 自动（依赖追踪） | 手动（selector） | 天然（atom 粒度） |

## 反模式（避坑）

### 1. 把所有状态塞进单一全局 store

**问题**：组件意外频繁重渲染、性能随应用增长恶化。Kent C. Dodds 明确指出滥用全局 state（尤其快速变化状态）是 React 性能首要杀手。

**对策**：colocate 原则——只在跨多组件共享时才提升到全局。

### 2. 嵌套结构存关系型数据

**反例**

```ts
// 反模式：posts 内嵌 author + comments，author 重复出现
posts: [
  { id: 1, author: { id: 9, name: "Alice" }, comments: [{ author: { id: 9, name: "Alice" } }] }
]
```

**问题**：①数据重复（同一 author 嵌多次）②不可变更新复制祖先链成本爆炸 ③不相关组件被迫重渲染——违反 single source of truth。

**对策**：normalize 成 `byId + allIds` + ID 引用。

### 3. Context Provider 顶在应用最顶层 + value 含频繁变化字段

**问题**：任何 Context value 变化都会让所有 consumer 重渲染，无论是否关心变化的那部分。

**对策**：①拆分 Context（不同变化频率的字段分 Provider）②快速变化字段用 atom / store 而非 Context。

### 4. 响应式范式下不启用 enforceActions

**问题**：状态散落各组件直接 mutate，缺少约束会让状态管理重蹈 flux 之前 SPA 框架「一团乱麻」覆辙。

**对策**：MobX `enforceActions` 实际是在采纳 Redux 的约束理念——强制状态变更走 action。

### 5. Props drilling 过深

**问题**：层层透传 state 与回调，可读性差、重构脆弱。

**对策**：①Component Composition（组件组合）②Context 作用域化（限定范围）③原子化 atom 订阅。

### 6. Redux reducer 中直接 mutate state

**反例**：`state.push(item)` / `state.x = 1`——破坏引用相等检测与 time-travel。

**对策**：必须返回新对象；Immer `produce` 可桥接书写习惯（Redux Toolkit 内置）。

### 7. 对 Vue reactive() 对象直接解构

**问题**：解构后变量脱离 Proxy、丢失响应性。

**对策**：用 `ref` 或 `toRefs` 包裹后再解构。

### 8. 双向绑定用于复杂场景

**问题**：跨层级传递、复杂校验、撤销 / 重做——数据流隐式难追踪，调试需理解展开机制。

**对策**：单向 `props + emit` 数据流清晰可控。

## 三分法（2026 主流走向）

```text
应用状态
   │
   ├─ 服务端状态（API 返回的实体）
   │    → Query 库（RTK Query / TanStack Query / SWR）
   │      职责：获取 / 缓存 / 失效 / 乐观更新 / normalized 缓存
   │
   ├─ 客户端 UI 状态（开关 / 表单草稿 / 临时交互）
   │    → 轻量 store / atom（Pinia / Zustand / Jotai）
   │      职责：组件树内或跨组件 UI 状态
   │
   └─ 关系型领域实体（用户 / 订单 / 评论）
        → normalized state 或 Query 缓存
          职责：单一数据源、ID 引用、按需订阅
```

> 取代了过去「所有状态塞进 Redux」的单一范式——这是 Redux Toolkit Query / TanStack Query 兴起后的最大架构变化。

## 下一步

- [参考](./reference.md)：四维度对比表、选型矩阵、官方资源链接
