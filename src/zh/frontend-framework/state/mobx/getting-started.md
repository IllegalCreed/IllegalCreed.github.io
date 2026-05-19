---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **MobX 6.x**（最新 **v6.13+**，2024-2026 发布）+ **mobx-react-lite 4.x** 编写。要求 **TypeScript 4.7+** + **React 16.8+**（推荐 18+）。v4/v5 用户请参考底部「v5 → v6 迁移」章节，或访问官方 [Migrating from MobX 4/5](https://mobx.js.org/migrating-from-4-or-5.html)。

## 速查

- 系统要求：**React 16.8+**（推荐 18+ / 19）+ **TypeScript 4.7+**（强烈推荐 strict 模式）+ **支持 Proxy** 的运行时（不支持 Proxy 的旧浏览器需 `configure({ useProxies: "never" })`）
- 安装：`pnpm add mobx mobx-react-lite` / `npm install mobx mobx-react-lite` / `yarn add mobx mobx-react-lite`
- 三种创建 observable 姿势：
  - `makeObservable(this, { ... })` —— class constructor 显式注解每个字段
  - `makeAutoObservable(this)` —— class constructor 自动推断（**推荐**）
  - `observable({ ... })` —— 函数式（plain object）
- 在 React 中使用：`export default observer(MyComponent)` 包裹**所有读 observable** 的组件
- 异步：await 之后必须用 `runInAction(() => { ... })` 包裹 mutation；或用 `flow` 生成器替代 async
- 派生：`get total() { return ... }` getter 配合 `computed` 注解 / `makeAutoObservable` 自动识别
- 副作用：`autorun(() => { ... })`（自动追踪）/ `reaction(() => data, data => effect)`（手动分离）/ `when(predicate, effect)`（一次性）
- 命名约定：`xxxStore` / `RootStore` / `useXxxStore` / class PascalCase / observable property camelCase
- **禁止**：组件外**读**了 observable 但**不在 reaction / observer / autorun 中** → 不会建立依赖
- **禁止**：解构 observable（`const { x } = store`）→ `x` 是普通值、不再追踪

## MobX 是什么

MobX 是 **JavaScript 生态最具代表性的「响应式（observable）派」状态管理库**——准确地说，它是 **Michel Weststrate**（Immer 作者）2015 年发布的「**spreadsheet-like reactive state**」库。**Jotai / Recoil 是「atom 派」、Redux 是「reducer 派」、Zustand 是「hook-store 派」**——而 **MobX 是「mutable observable 派」**：直接 mutate `store.count++`、自动通知所有依赖 → UI 自动更新。

- **MobX 6.x（2020-2026）** 已完全 TypeScript 重写、默认不依赖装饰器、引入 `makeObservable` / `makeAutoObservable`
- **React 集成有两个选择**：`mobx-react-lite`（仅函数组件 hooks，~2KB）+ `mobx-react`（含 class component 支持，~9KB）
- **跨框架**：MobX core 不依赖任何框架，可用于 Vue / Angular / Svelte / vanilla / Node

> MobX 名字来源：早期叫 **MOBservable**（Mobile + Observable）、后改名 MobX——Michel Weststrate 在 [Mendix](https://www.mendix.com/)（低代码平台）任职时为公司项目开发、随后开源。

## MobX 是「响应式 + mutable 派」的代表

理解 MobX 必须先理解它**和 Redux / Zustand / Jotai 的根本差异**——它**不是**「另一个 reducer + dispatch 库」、也**不是**「hook 即 store 的轻量库」——它是 **「Vue 响应式 / Knockout / spreadsheet」思想在 React 生态的实现**：

| 维度 | MobX 6.x | Redux Toolkit | Zustand 5.x | Jotai 2.x | Vue Pinia |
|---|---|---|---|---|---|
| 阵营 | **响应式 mutable** | reducer immutable | hook-store immutable | atom immutable | 响应式 mutable |
| 心智模型 | **mutate + 自动追踪** | reducer + dispatch + slice | hook + selector | atom 图 + 依赖追踪 | composition + 响应式 |
| 状态变化 | **直接 mutate**（`store.x++`） | `dispatch({ type: ... })` | `set((s) => ({ ... }))` | `setAtom(...)` | 直接 mutate |
| 依赖追踪 | **自动**（属性级别） | 手动（selector） | 手动（selector） | 自动（atom `get`） | 自动（属性级别） |
| 异步处理 | `runInAction` + `flow` | thunk + RTK Query | async action | async atom + Suspense | 普通 async function |
| TypeScript | **优秀**（自动推导） | 优秀（RTK 推导） | 优秀（curried） | 优秀（atom 推导） | 优秀（Vue 推导） |
| Bundle 大小 | **~18KB**（core + lite） | ~25-30KB（RTK + RTK Query） | ~1KB | ~2-3KB | ~5KB |
| 跨框架 | ✅ | ✅ | ❌（React only） | ❌（React only） | ❌（Vue only） |
| 时间旅行 | 仅 MST 子项目 | **Redux DevTools** 一等公民 | devtools middleware | jotai-devtools | Vue DevTools |
| 学习曲线 | **中**（1-2 周） | 陡（2-4 周） | 平（10 分钟） | 中（atom 思想需理解） | 平（5 分钟） |
| 配套生态 | mobx-state-tree / mobx-utils | RTK Query / Reselect / persist | middleware 生态 | utils / jotai-tanstack-query | Nuxt / 完善 |
| 适用规模 | **中大型**（业务规则复杂） | 大型（严格审计） | 中小型 | 中大型（派生 state 多） | 中大型 |

**含义**：

- MobX 解决的是「**复杂业务模型 + 大量派生数据 + 直观 mutable 心智**」的场景
- 与 Redux 对比：Redux 严格 reducer + 时间旅行 + 严格审计；MobX 直观 mutable + 自动追踪——**审计严格场景用 Redux、业务规则复杂场景用 MobX**
- 与 Zustand 对比：Zustand 心智更轻 + 仅 React + bundle 更小；MobX 跨框架 + 自动追踪 + class 模型——**简单全局状态用 Zustand、复杂业务对象用 MobX**
- 与 Jotai 对比：Jotai 是 atom 派、细粒度 atom 图；MobX 是 object 派、细粒度属性图——**派生 atom 多的中后台用 Jotai、对象模型多的业务系统用 MobX**
- 与 Vue Pinia 对比：心智几乎一致（mutable + 自动追踪），但分属 React / Vue 生态——**Vue 用 Pinia、React 用 MobX 是等价选择**
- **不适合**：极小项目（一个 `useState` 能搞定）/ 需要严格 redux time-travel 审计 / 团队不熟悉响应式编程
- **适合**：复杂表单 + 业务规则（如 Mendix 低代码平台）/ 大量派生数据（电子表格 / 计算密集 UI）/ 团队熟悉 OOP 风格 / 从 Redux 迁移过来追求简化

## 安装与首次启动

### 安装

```bash
# 核心 + React 函数组件 hooks 集成（推荐）
pnpm add mobx mobx-react-lite

# 如果还有 class component 需要支持
pnpm add mobx mobx-react

# 可选：工具集
pnpm add mobx-utils
```

版本要求：

| 包 | 版本 | 要求 |
|---|---|---|
| `mobx` | **6.x** | TS 4.7+，运行时支持 Proxy |
| `mobx-react-lite` | **4.x** | React 16.8+ / 18+ / 19 |
| `mobx-react` | **9.x** | React 16.8+ / 18+ / 19（含 class 支持） |
| `mobx-state-tree` | 6.x | 可选，提供 immutable snapshot 能力 |

> **mobx-react-lite vs mobx-react**：函数组件 + hooks 项目优先用 **lite**（~2KB）；混合 class component 项目用 mobx-react（~9KB）。**lite 不导出 `Provider` / `inject` 等老 API**——这些是给 class component 用的。

### TypeScript 配置

`tsconfig.json` 必须设置：

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",            // 或 ES2018+
    "module": "ESNext",
    "useDefineForClassFields": true, // 必须！否则 class field 与 makeObservable 顺序错乱
    "experimentalDecorators": false, // 默认就是 false（MobX 6 不再依赖 legacy 装饰器）
    "strict": true                   // 强烈推荐
  }
}
```

> **`useDefineForClassFields: true` 的重要性**：MobX 6 要求 class field 先按标准定义、然后 `makeObservable(this, ...)` 才能正确读取 field 的初始值。如果设为 false，class field 会在 constructor 体之后才赋值、导致 `makeObservable` 读到 undefined。

### 第一个 Hello World

最小可运行 demo：

```ts
// src/stores/counter.ts
import { makeAutoObservable } from "mobx"

/**
 * 计数器 Store
 * - count 是 observable
 * - increment / reset 是 action
 * - doubled 是 computed
 */
export class CounterStore {
  count = 0

  constructor() {
    // 自动注解所有字段
    makeAutoObservable(this)
  }

  increment() {
    this.count++
  }

  reset() {
    this.count = 0
  }

  get doubled() {
    return this.count * 2
  }
}

// 单例
export const counterStore = new CounterStore()
```

在 React 组件中使用：

```tsx
// src/components/Counter.tsx
import { observer } from "mobx-react-lite"
import { counterStore } from "@/stores/counter"

// observer 是关键 —— 把组件订阅到 store 中实际读的 observable
const Counter = observer(() => {
  return (
    <div>
      <p>Count: {counterStore.count}</p>
      <p>Doubled: {counterStore.doubled}</p>
      <button onClick={() => counterStore.increment()}>+1</button>
      <button onClick={() => counterStore.reset()}>Reset</button>
    </div>
  )
})

export default Counter
```

> **关键点**：组件必须 `observer` 包裹——否则 store 变化不会触发重渲。这是 MobX 最容易忘的事。

### 不需要 `<Provider>`（默认）

与 Redux 不同，MobX **不需要** `<Provider>` 包裹应用根部——store 是普通 JS 对象，**任何地方 import 即用**：

```tsx
// src/main.tsx
import { createRoot } from "react-dom/client"
import App from "./App"

// 不需要 <Provider>！
createRoot(document.getElementById("root")!).render(<App />)
```

需要 store 隔离时（如多 tab / 测试），可以用 React Context 注入——详见 [指南 > Store 设计](./guide-line.md#store-设计与组织)。

## 创建 Observable 的三种姿势

MobX 6 提供**三种**创建 observable 的方式——按推荐顺序：

### 1. `makeAutoObservable`（class，**推荐**）

class 内部一行调用、自动推断所有字段：

```ts
import { makeAutoObservable } from "mobx"

class TodoStore {
  todos: string[] = []           // 自动识别为 observable
  filter = "all"                 // 自动识别为 observable

  constructor() {
    makeAutoObservable(this)
  }

  // 自动识别为 action（普通方法）
  addTodo(text: string) {
    this.todos.push(text)
  }

  // 自动识别为 action
  setFilter(filter: string) {
    this.filter = filter
  }

  // 自动识别为 computed（getter）
  get count() {
    return this.todos.length
  }

  get filteredTodos() {
    return this.todos.filter(t => t.startsWith(this.filter))
  }
}
```

**`makeAutoObservable` 推断规则**：

| Class 成员形态 | 推断为 |
|---|---|
| `field = value`（普通字段） | `observable` |
| `get x() { ... }`（getter） | `computed` |
| `set x(v) { ... }`（setter） | `action` |
| `method() { ... }`（普通方法） | `autoAction`（特殊 action，**不**被外层 reaction 追踪） |
| `*method() { ... }`（generator） | `flow` |

> **限制**：`makeAutoObservable` 不能用于**有父类或子类**的 class——继承链中的 class 必须显式 `makeObservable(this, { ... })`。详见 [指南 > Subclassing](./guide-line.md#subclassing-与继承)。

### 2. `makeObservable`（class，显式注解）

需要更精确控制时、显式声明每个成员的角色：

```ts
import { makeObservable, observable, action, computed } from "mobx"

class TodoStore {
  todos: string[] = []
  filter = "all"

  constructor() {
    makeObservable(this, {
      todos: observable,
      filter: observable,
      addTodo: action,
      setFilter: action,
      count: computed,
      filteredTodos: computed,
    })
  }

  addTodo(text: string) {
    this.todos.push(text)
  }

  setFilter(filter: string) {
    this.filter = filter
  }

  get count() {
    return this.todos.length
  }

  get filteredTodos() {
    return this.todos.filter(t => t.startsWith(this.filter))
  }
}
```

**何时用 `makeObservable` 而非 `makeAutoObservable`**？

- 有父类 / 子类（继承场景）
- 某些字段**不想**变成 observable（注解为 `false`）
- 需要更细粒度的 annotation（如 `observable.ref` / `observable.shallow` / `action.bound`）

### 3. `observable`（plain object，函数式）

非 class 写法（函数式 store）：

```ts
import { observable, action, autorun } from "mobx"

const counter = observable({
  count: 0,
  increment() {
    this.count++
  },
  get doubled() {
    return this.count * 2
  },
})

// 直接 mutate 即可
counter.count++  // 1
counter.increment() // 2
```

> **注意**：`observable({...})` 默认**递归深度转换**——嵌套对象 / 数组 / Map / Set 都会被代理为 observable 版本。

也可以用 `makeAutoObservable` 处理普通对象（更推荐，因为可以自动推断 action / computed）：

```ts
import { makeAutoObservable } from "mobx"

function createCounter() {
  return makeAutoObservable({
    count: 0,
    increment() {
      this.count++
    },
    get doubled() {
      return this.count * 2
    },
  })
}

const counter = createCounter()
counter.count++
```

> **选哪个**：**class + `makeAutoObservable`** 是 MobX 6 推荐的「标准姿势」——TypeScript 类型自动推导、易于继承（用 `makeObservable`）、有 prototype 优化、`instanceof` 友好。函数式写法适合**轻量 store**。

## Action：包装状态变化

MobX 默认配置（`enforceActions: "observed"`）要求**任何修改 observable 的代码必须包装为 action**——这是 MobX 的核心契约。

### 为什么需要 action

- **批量更新**：action 内多个 mutation 视为一个事务、reaction 只在 action 结束时跑一次（而不是每次 mutation 跑一次）
- **可追溯**：DevTools / spy 可以记录每个 action 的名字与参数
- **强制 enforce**：错过 action 包装会运行时报错，避免「state 莫名其妙变了」的 bug

### Class 中：方法自动是 action

`makeAutoObservable` 把所有方法自动包装为 action，**无需手动**：

```ts
class CartStore {
  items: { id: number; price: number; quantity: number }[] = []
  discount = 0

  constructor() {
    makeAutoObservable(this)
  }

  // 自动是 action
  addItem(item: { id: number; price: number; quantity: number }) {
    this.items.push(item) // ✅ 自动包装
    this.recalc()
  }

  recalc() {
    // 这里的 mutation 都在外层 addItem action 中、合并为一个事务
    if (this.items.length > 3) {
      this.discount = 0.1
    }
  }
}
```

### Plain Object：用 `action` 显式包装

```ts
import { action, observable } from "mobx"

const counter = observable({
  count: 0,
})

// 错误：直接 mutate 会 enforceActions 报错
// counter.count++  // ❌ MobX Error: Attempt to modify observable outside action

// 正确：包装为 action
const increment = action(() => {
  counter.count++
})
increment()
```

或用 `runInAction` 一次性调用：

```ts
import { runInAction } from "mobx"

runInAction(() => {
  counter.count++
  counter.count++ // 两次 mutation 合并为一个事务
})
```

### `runInAction` 的典型用途

`runInAction` 主要用于**异步代码 await 之后**——见下一节。

## 异步处理

MobX 异步处理有两种主流姿势：**async/await + `runInAction`** 与 **`flow` 生成器**。

### 姿势 1：async/await + `runInAction`（推荐）

```ts
import { makeAutoObservable, runInAction } from "mobx"

class UserStore {
  user: { id: number; name: string } | null = null
  loading = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  async fetchUser(id: number) {
    this.loading = true
    this.error = null
    try {
      const res = await fetch(`/api/users/${id}`)
      const data = await res.json()

      // ⚠️ await 之后必须 runInAction —— 因为 async/await 之后已经不在 action 中
      runInAction(() => {
        this.user = data
      })
    } catch (err) {
      runInAction(() => {
        this.error = (err as Error).message
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }
}
```

> **核心规则**：`async` 方法的 **`await` 关键字之后**已经离开了原 action——所以接下来的 mutation 必须用 `runInAction(() => { ... })` 包裹。

### 姿势 2：`flow` 生成器（无需手动 `runInAction`）

`flow` 是 MobX 自带的 generator-based 异步替代，**`yield` 替代 `await`**——好处是不需要手动 `runInAction`：

```ts
import { makeAutoObservable, flow } from "mobx"

class UserStore {
  user: { id: number; name: string } | null = null
  loading = false
  error: string | null = null

  constructor() {
    // makeAutoObservable 自动识别 *fetchUser 为 flow
    makeAutoObservable(this)
  }

  // 注意 * —— 是 generator function
  *fetchUser(id: number) {
    this.loading = true
    this.error = null
    try {
      const res: Response = yield fetch(`/api/users/${id}`)
      const data: { id: number; name: string } = yield res.json()
      // ✅ 不需要 runInAction —— flow 内每次 yield 都自动包装 action
      this.user = data
    } catch (err) {
      this.error = (err as Error).message
    } finally {
      this.loading = false
    }
  }
}

// 调用方式：和 async/await 一样
const userStore = new UserStore()
userStore.fetchUser(1).then(() => {
  console.log("Done!")
})
```

> **`flow` vs `async`**：
> - **优点**：不需要手动 `runInAction`，代码更简洁；支持 `.cancel()` 取消
> - **缺点**：generator 语法陌生（`*` 与 `yield`）；调试栈不友好；TypeScript 推导稍弱（每个 yield 需要手动标注类型）
> - **推荐**：复杂多步 async 流程优先用 `flow`；简单 fetch 用 `async/await + runInAction`

详见 [指南 > Action 全谱](./guide-line.md#action-全谱) 与 [参考 > flow](./reference.md#flow)。

## Computed：自动派生

`computed` 是 MobX 的**自动派生**机制——getter 函数 + 自动追踪 + 智能缓存。

```ts
import { makeAutoObservable } from "mobx"

class CartStore {
  items: { id: number; price: number; quantity: number }[] = []
  taxRate = 0.08

  constructor() {
    makeAutoObservable(this)
  }

  addItem(item: { id: number; price: number; quantity: number }) {
    this.items.push(item)
  }

  // computed —— 自动追踪 items 与 taxRate
  get subtotal() {
    console.log("Computing subtotal...")
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  }

  // computed —— 自动追踪 subtotal 与 taxRate
  get total() {
    return this.subtotal * (1 + this.taxRate)
  }

  // computed —— 自动追踪 items
  get itemCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0)
  }
}
```

**`computed` 的特点**：

- **惰性**：只有被订阅（在 `observer` 组件 / `autorun` / `reaction` 中读到）才会执行
- **缓存**：依赖不变时返回缓存值、不重新计算
- **自动依赖**：getter 中读哪个 observable 就建立依赖
- **必须纯函数**：computed 内**不能**修改 observable（会运行时报错）

> **不要在 computed 中调用 action 或 mutate observable**——computed 是 pure derivation、不应有副作用。

详见 [指南 > Computed 全谱](./guide-line.md#computed-全谱) 与 [参考 > computed 选项](./reference.md#computed)。

## 在 React 中使用：observer HOC

`observer` HOC（来自 `mobx-react-lite`）是 MobX 与 React 集成的核心——把组件**自动订阅**到组件内部实际读到的 observable：

```tsx
import { observer } from "mobx-react-lite"
import { todoStore } from "@/stores/todo"

// ✅ 用 observer 包裹组件 —— MobX 会追踪此组件内读到的所有 observable
const TodoList = observer(() => {
  return (
    <ul>
      {todoStore.todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
})

export default TodoList
```

### `observer` 的工作机制

- 渲染期间 MobX 追踪所有被读取的 observable
- 这些 observable 变化时、组件**自动重渲**
- 与 React.memo 集成（observer 已经内部 memo、不需要额外包）
- 支持 hooks / props / forwardRef / generics

### 命名建议（DevTools 友好）

```tsx
// ❌ 匿名箭头函数 —— DevTools 显示 "Unknown"
const TodoList = observer(() => <ul>...</ul>)

// ✅ 命名 function —— DevTools 显示 "TodoList"
const TodoList = observer(function TodoList() {
  return <ul>...</ul>
})

// ✅ 或者起名后 + displayName
const TodoListInner = (...) => <ul>...</ul>
const TodoList = observer(TodoListInner)
TodoList.displayName = "TodoList"
```

### 何时 `observer` 不工作（最常见 bug）

**1. 解构 observable（最容易踩）**

```tsx
// ❌ 错误：解构 todos 后、todos 是普通数组、不再追踪
const TodoCount = observer(({ store }: { store: TodoStore }) => {
  const { todos } = store // ← 这里只是普通的引用赋值（数组本身仍是 observable）
  return <p>{todos.length}</p> // ← 但 todos 的 length 变化会触发，因为 length 在 observer 内被读
})

// ❌ 真正错误：解构 primitive 字段
const Counter = observer(({ store }: { store: CounterStore }) => {
  const { count } = store // ← count 是普通 number、已经丢失响应
  return <p>{count}</p> // ← 永远不会更新
})

// ✅ 正确：在 render 中直接读
const Counter = observer(({ store }: { store: CounterStore }) => {
  return <p>{store.count}</p> // ← 每次渲染都读 store.count
})
```

**2. 漏写 `observer`**

```tsx
// ❌ 没有 observer —— count 变化不会触发重渲
const Counter = ({ store }: { store: CounterStore }) => {
  return <p>{store.count}</p>
}

// ✅ 包裹 observer
const Counter = observer(({ store }: { store: CounterStore }) => {
  return <p>{store.count}</p>
})
```

> **核心原则**：**任何读 observable 的组件都必须 `observer` 包裹**——团队建议启用 [`eslint-plugin-mobx`](https://github.com/mobxjs/mobx/tree/main/packages/eslint-plugin-mobx) 强制检查。

### `useLocalObservable`：组件局部 observable

需要组件内部的 observable state 时（替代 `useState` 处理复杂局部状态）：

```tsx
import { observer, useLocalObservable } from "mobx-react-lite"

const TimerView = observer(() => {
  // 组件局部 observable —— 类似 useState 但支持 computed / action
  const timer = useLocalObservable(() => ({
    seconds: 0,
    increment() {
      this.seconds++
    },
    get doubled() {
      return this.seconds * 2
    },
  }))

  return (
    <div>
      <p>Seconds: {timer.seconds}</p>
      <p>Doubled: {timer.doubled}</p>
      <button onClick={() => timer.increment()}>+1</button>
    </div>
  )
})
```

`useLocalObservable` 自动 `makeAutoObservable` 包装、组件 unmount 时清理——是组件局部复杂状态的最佳实践。

## TypeScript 基础

### `makeAutoObservable` 自动推导

无需任何泛型——MobX 完全从 class field 推导：

```ts
import { makeAutoObservable } from "mobx"

class UserStore {
  user: { id: number; name: string } | null = null    // 自动推导 observable
  loading = false                                       // 自动推导 observable

  constructor() {
    makeAutoObservable(this)
  }

  setUser(user: { id: number; name: string }) {        // 自动推导 action
    this.user = user
  }

  get displayName() {                                    // 自动推导 computed
    return this.user?.name ?? "Anonymous"
  }
}
```

### `makeObservable` 显式注解

需要更细控制时显式：

```ts
import { makeObservable, observable, action, computed } from "mobx"

class UserStore {
  user: { id: number; name: string } | null = null
  loading = false

  constructor() {
    makeObservable(this, {
      user: observable,
      loading: observable,
      setUser: action,
      displayName: computed,
    })
  }

  setUser(user: { id: number; name: string }) {
    this.user = user
  }

  get displayName() {
    return this.user?.name ?? "Anonymous"
  }
}
```

### TS 5.0+ Stage-3 装饰器

MobX 6 支持 TC39 标准（stage-3 / 2023-05）装饰器写法——**需要 TS 5.0+** + `experimentalDecorators: false`：

```ts
import { observable, action, computed } from "mobx"

class UserStore {
  // 注意 accessor 关键字 —— stage-3 标准要求
  @observable accessor user: { id: number; name: string } | null = null
  @observable accessor loading = false

  @action
  setUser(user: { id: number; name: string }) {
    this.user = user
  }

  @computed
  get displayName() {
    return this.user?.name ?? "Anonymous"
  }
}
```

> **何时用装饰器**？团队熟悉 OOP 装饰器风格 + 已经在用 TS 5.0+。否则**优先用 `makeAutoObservable`**——配置简单、不依赖 TS / Babel 配置。

### 类型工具

```ts
import type {
  IObservableValue,        // observable.box 的返回类型
  IObservableArray,        // observable 数组类型
  ObservableMap,           // observable Map 类型
  ObservableSet,           // observable Set 类型
  Lambda,                  // () => void 别名
  IReactionDisposer,       // autorun / reaction / when 返回的 disposer
} from "mobx"

import type { IObserverProps } from "mobx-react-lite"
```

详见 [参考 > TypeScript 类型](./reference.md#typescript-类型)。

## Configure：全局配置

MobX 全局行为通过 `configure` 一次性设置——通常在 app 入口：

```ts
// src/main.tsx 或 src/configure-mobx.ts
import { configure } from "mobx"

configure({
  // "observed": 默认 —— 观察中的状态必须通过 action 修改
  // "always": 所有修改都必须 action（最严格）
  // "never": 关闭 enforceActions（不推荐）
  enforceActions: "always",

  // computed 必须在 reaction 中访问、否则警告
  computedRequiresReaction: true,

  // reaction 内必须读至少一个 observable、否则警告（找出无用 reaction）
  reactionRequiresObservable: true,

  // observable 必须在 reaction 中访问、否则警告（找出忘 observer 的组件）
  observableRequiresReaction: true,

  // 旧浏览器不支持 Proxy 时设为 "never"
  useProxies: "always", // 默认
})
```

**推荐生产配置**（开发阶段最严格、生产阶段适度放宽）：

```ts
configure({
  enforceActions: "always",          // 强制 action 包装
  computedRequiresReaction: import.meta.env.DEV,  // 开发阶段警告
  reactionRequiresObservable: import.meta.env.DEV,
  observableRequiresReaction: false, // 不强制 —— 太严格容易误报
})
```

详见 [指南 > Configure 全选项](./guide-line.md#configure-完整选项)。

## 完整示例：Todo 应用

来一个综合 demo——一个带 computed + async 的 todo list：

```ts
// src/stores/todo.ts
import { makeAutoObservable, runInAction } from "mobx"

interface Todo {
  id: number
  text: string
  done: boolean
}

export class TodoStore {
  todos: Todo[] = []
  filter: "all" | "active" | "done" = "all"
  loading = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  // ============ Actions ============

  addTodo(text: string) {
    this.todos.push({
      id: Date.now(),
      text,
      done: false,
    })
  }

  toggleTodo(id: number) {
    const todo = this.todos.find(t => t.id === id)
    if (todo) {
      todo.done = !todo.done
    }
  }

  removeTodo(id: number) {
    this.todos = this.todos.filter(t => t.id !== id)
  }

  setFilter(filter: "all" | "active" | "done") {
    this.filter = filter
  }

  // ============ Async Action ============

  async loadTodos() {
    this.loading = true
    this.error = null
    try {
      const res = await fetch("/api/todos")
      const data: Todo[] = await res.json()
      runInAction(() => {
        this.todos = data
      })
    } catch (err) {
      runInAction(() => {
        this.error = (err as Error).message
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  // ============ Computed ============

  get filteredTodos() {
    switch (this.filter) {
      case "active":
        return this.todos.filter(t => !t.done)
      case "done":
        return this.todos.filter(t => t.done)
      default:
        return this.todos
    }
  }

  get activeCount() {
    return this.todos.filter(t => !t.done).length
  }

  get doneCount() {
    return this.todos.filter(t => t.done).length
  }

  get hasCompleted() {
    return this.doneCount > 0
  }
}

// 单例
export const todoStore = new TodoStore()
```

组件中使用：

```tsx
// src/components/TodoApp.tsx
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { todoStore } from "@/stores/todo"

const TodoApp = observer(() => {
  const [input, setInput] = useState("")

  useEffect(() => {
    todoStore.loadTodos()
  }, [])

  if (todoStore.loading) return <p>Loading...</p>
  if (todoStore.error) return <p>Error: {todoStore.error}</p>

  return (
    <div>
      <h1>Todos ({todoStore.activeCount} active)</h1>

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && input.trim()) {
            todoStore.addTodo(input.trim())
            setInput("")
          }
        }}
        placeholder="New todo..."
      />

      <div>
        <button onClick={() => todoStore.setFilter("all")}>
          All ({todoStore.todos.length})
        </button>
        <button onClick={() => todoStore.setFilter("active")}>
          Active ({todoStore.activeCount})
        </button>
        <button onClick={() => todoStore.setFilter("done")}>
          Done ({todoStore.doneCount})
        </button>
      </div>

      <ul>
        {todoStore.filteredTodos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => todoStore.toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.done ? "line-through" : "none" }}>
              {todo.text}
            </span>
            <button onClick={() => todoStore.removeTodo(todo.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  )
})

export default TodoApp
```

注意：**TodoApp 是单个 `observer`**——MobX 内部已经自动追踪了所有读到的 observable。如果想进一步优化（避免不同 todo item 重渲影响整个 list），可以把 `<li>` 部分拆为独立的 `observer` 组件——详见 [指南 > 性能优化](./guide-line.md#性能优化)。

## Class 组件支持（mobx-react）

如果项目中还有 React class component，需要用 `mobx-react`（非 lite 版）：

```bash
pnpm add mobx mobx-react
```

```tsx
import * as React from "react"
import { observer } from "mobx-react"
import { counterStore } from "@/stores/counter"

@observer
class Counter extends React.Component {
  render() {
    return (
      <div>
        <p>Count: {counterStore.count}</p>
        <button onClick={() => counterStore.increment()}>+1</button>
      </div>
    )
  }
}
```

> **mobx-react vs mobx-react-lite**：
> - **lite**：只支持函数组件 hooks，~2KB
> - **完整版**：支持 class component + Provider + inject HOC（老 API），~9KB
> - **推荐**：新项目用 lite；老项目混用时用完整版

详见 [指南 > mobx-react 完整版](./guide-line.md#mobx-react-完整版class-组件支持).

## v5 → v6 迁移要点

如果项目还在 MobX 5 或更早，升级到 6 主要要做以下事：

### 1. 装饰器从「默认」变成「可选」

**MobX 5**：依赖 legacy 装饰器（`experimentalDecorators: true`）：

```ts
class Store {
  @observable count = 0       // ← MobX 5 legacy 装饰器
  @action increment() {       // ← MobX 5 legacy 装饰器
    this.count++
  }
}
```

**MobX 6 推荐**：用 `makeObservable` 或 `makeAutoObservable`，**不需要装饰器**：

```ts
class Store {
  count = 0

  constructor() {
    makeAutoObservable(this) // ← 推荐
  }

  increment() {
    this.count++
  }
}
```

如果仍想用装饰器、需要切换到 TC39 stage-3：

```ts
class Store {
  @observable accessor count = 0 // ← 注意 accessor 关键字
  @action increment() {
    this.count++
  }
}
```

> **TS 5.0+** + `experimentalDecorators: false` 启用 stage-3。详见 [指南 > 装饰器](./guide-line.md#装饰器legacy-vs-stage-3) 与官方 [Enabling decorators](https://mobx.js.org/enabling-decorators.html)。

### 2. 自动化迁移：`mobx-undecorate`

官方提供 codemod 帮助自动迁移：

```bash
npx mobx-undecorate          # 完全去装饰器、改用 makeObservable
npx mobx-undecorate --keepDecorators  # 保留装饰器、加上 makeObservable(this)
```

### 3. `enforceActions` 默认变严

**MobX 5 默认**：`enforceActions: "never"`（什么地方都能 mutate）
**MobX 6 默认**：`enforceActions: "observed"`（观察中的 observable 必须在 action 中改）

迁移建议：

```ts
// 临时降低严格度
configure({ enforceActions: "never" })

// 逐步迁移到 "observed"，再到 "always"
```

### 4. Proxy 要求

MobX 6 默认 `useProxies: "always"`——**不支持 Proxy 的旧浏览器**（IE11）需要切换到 `"never"`：

```ts
configure({ useProxies: "never" })
```

> 完整迁移指南：[Migrating from MobX 4/5](https://mobx.js.org/migrating-from-4-or-5.html)

## 下一步

至此你已掌握 MobX 的基础——**安装**（核心 + mobx-react-lite）/ **三种 observable 姿势**（`makeAutoObservable` / `makeObservable` / `observable`）/ **`observer` HOC**（React 集成必备）/ **action** 包装 mutation / **computed** 自动派生 / **异步处理**（async/await + `runInAction` / `flow` 生成器）/ **`useLocalObservable`**（组件局部 observable）/ **TypeScript 自动推导** / **`configure`** 全局配置 / **v5 → v6 迁移**。

继续学习：

- [指南](./guide-line.md)：**核心**——observable 类型（object / array / map / set / box / ref / shallow / struct）/ `makeObservable` 完整 annotation 表 / `makeAutoObservable` 推断规则 + overrides / action 全谱（`action` / `action.bound` / `runInAction` / `flow` / `flow.bound` / `flowResult`）/ computed 完整选项 / Reactions 全谱（`autorun` / `reaction` / `when` + 全选项）/ mobx-react-lite（observer / Observer / useLocalObservable / 列表渲染优化）/ Class 组件支持（mobx-react）/ Store 设计（Single / Multi / RootStore + Context）/ TypeScript 完整 / 装饰器 / DevTools 调试 / SSR / 测试 / mobx-state-tree 简介 / 性能优化 / 常见踩坑
- [参考](./reference.md)：**API 速查**——所有 import 来源、全部 API 签名（`makeObservable` / `observable` / `action` / `computed` / `autorun` / `reaction` / `when` 等）+ TypeScript 类型 + Annotations 完整表 + v5 → v6 迁移 checklist