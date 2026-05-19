---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 **MobX 6.x** + **mobx-react-lite 4.x**。包含 observable 全类型、`makeObservable` 完整 annotation 表、action 全谱（含 `flow` 生成器）、computed 完整选项、Reactions 全谱（`autorun` / `reaction` / `when`）、mobx-react-lite 完整模式、Store 设计、TypeScript、装饰器、DevTools 调试、SSR、测试、mobx-state-tree 简介、性能优化与常见踩坑。

## 速查

- **observable 类型**：`observable` / `observable.deep`（默认）/ `observable.shallow` / `observable.ref` / `observable.struct` / `observable.box` / `observable.array` / `observable.map` / `observable.set`
- **创建方式**：`makeAutoObservable(this)`（**推荐**，class）/ `makeObservable(this, { ... })`（显式注解）/ `observable({ ... })`（函数式）/ `@observable accessor`（stage-3 装饰器）
- **action 全谱**：`action` / `action.bound`（自动 bind this）/ `runInAction`（一次性）/ `flow`（generator 替代 async）/ `flow.bound` / `flowResult`（TS 类型工具）
- **computed 全谱**：`computed` / `computed.struct`（结构比较）/ `computed({ equals, keepAlive, requiresReaction })`
- **reactions**：`autorun(effect)` / `reaction(data, effect, options)` / `when(predicate, effect)` —— 都返回 disposer
- **React 集成**：`observer(Component)` HOC / `<Observer>` 组件（render prop）/ `useLocalObservable(() => ({}))` / `useObserver`（已废弃，用 `<Observer>` 替代）
- **响应式陷阱**：解构 observable / 漏写 observer / 忘 `makeObservable` / 组件外读 observable / async 后忘 `runInAction`
- **enforceActions 三档**：`"never"` / `"observed"`（默认）/ `"always"`
- **debug API**：`trace()` / `spy(listener)` / `getDependencyTree()` / `getObserverTree()` / `getDebugName()`

## Observable 类型全谱

`observable` 是 MobX 创建可追踪状态的核心 API——根据数据类型与变化粒度分**多种变体**。

### 1. `observable`（默认 deep）

把任何 JS 对象 / 数组 / Map / Set **递归**转换为 observable：

```ts
import { observable } from "mobx"

const state = observable({
  count: 0,
  user: { name: "Alice" },       // 嵌套对象 —— 自动 observable
  todos: ["A", "B"],              // 数组 —— 自动 observable.array
})

state.count++                     // 触发响应
state.user.name = "Bob"           // 触发响应（嵌套对象也是 observable）
state.todos.push("C")             // 触发响应（数组方法都是 observable）
```

### 2. `observable.ref`（只追踪引用变化）

**不**递归转换值、只在「**整体替换**」时触发响应——适合 immutable data 容器 / 第三方 class instance：

```ts
import { makeObservable, observable } from "mobx"

class Store {
  // 整个 user 对象只在被替换时触发（user.name = ... 不触发）
  user: { name: string; age: number } | null = null

  constructor() {
    makeObservable(this, {
      user: observable.ref,
    })
  }

  // 必须整体替换、不能 mutate 内部字段
  setUser(user: { name: string; age: number }) {
    this.user = user
  }
}
```

**适用场景**：

- 存放 immutable.js / Immer 等 immutable 数据
- 存放第三方 class instance（不想被 MobX proxy 包装）
- 大型对象只需追踪引用变化（性能优化）

### 3. `observable.shallow`（浅 observable）

只让**第一层**可追踪、内部不递归：

```ts
import { makeObservable, observable } from "mobx"

class Store {
  // 数组本身的增删替换触发响应、但 items[0].name = "..." 不触发
  items: { id: number; name: string }[] = []

  constructor() {
    makeObservable(this, {
      items: observable.shallow,
    })
  }
}
```

**适用场景**：

- 列表元素是 immutable（替换整个对象、不修改字段）
- 性能优化（避免深层 proxy）

### 4. `observable.struct`（结构比较）

只在「**结构上不相等**」（深度比较）时触发——避免「值未变但引用变了」的多余响应：

```ts
import { makeObservable, observable } from "mobx"

class Store {
  position: { x: number; y: number } = { x: 0, y: 0 }

  constructor() {
    makeObservable(this, {
      position: observable.struct,
    })
  }

  // 重置为 { x: 0, y: 0 } —— 与当前值结构相等 —— 不触发响应
  reset() {
    this.position = { x: 0, y: 0 }
  }
}
```

### 5. `observable.box`（包装 primitive）

```ts
import { observable } from "mobx"

const count = observable.box(0)
console.log(count.get())  // 0
count.set(1)
console.log(count.get())  // 1
```

> **`observable.box` 何时用**？通常用不着——在 React / class 场景中 `makeAutoObservable` 已经把 primitive 字段自动 observable 了。`box` 适合**纯 JS 工具**或**测试场景**中包裹独立 primitive。

### 6. `observable.array` / `observable.map` / `observable.set`

```ts
import { observable } from "mobx"

const arr = observable.array<string>(["A", "B"])
arr.push("C")
arr.replace(["X", "Y"]) // 整体替换
arr.clear()             // 清空

const map = observable.map<string, number>({ a: 1, b: 2 })
map.set("c", 3)
map.delete("a")
map.replace([["x", 1], ["y", 2]])

const set = observable.set<number>([1, 2, 3])
set.add(4)
set.delete(1)
```

> **observable.array 的扩展方法**：`replace(newItems)` / `clear()` / `remove(value)` —— 比原生 Array 多了这些便利方法。

### Annotations 完整表

| Annotation | 用途 | 适用 class 成员 |
|---|---|---|
| `observable` / `observable.deep` | 可追踪字段，递归转换值 | field |
| `observable.ref` | 只追踪引用变化（不递归） | field |
| `observable.shallow` | 集合可观察、内容不递归 | field（集合） |
| `observable.struct` | 结构相等时忽略赋值 | field |
| `action` | state-modifying 方法 | method |
| `action.bound` | action + 自动绑定 `this` | method |
| `computed` | getter 缓存派生值 | get |
| `computed.struct` | computed + 结构相等时跳过通知 | get |
| `flow` | generator 异步流程 | method（`*name`） |
| `flow.bound` | flow + 自动绑定 `this` | method |
| `override` | 子类重写父类的 action/computed/flow | method/get |
| `false` | 该字段**不**变成 observable | field |

```ts
import { makeObservable, observable, action, computed, flow } from "mobx"

class Store {
  count = 0
  items: string[] = []
  config = { theme: "light" }
  helperRef = new SomeNonReactiveClass()

  constructor() {
    makeObservable(this, {
      count: observable,
      items: observable.shallow,        // 仅追踪数组本身、不追踪内部
      config: observable.ref,           // 仅追踪整体替换
      helperRef: false,                 // 不是 observable
      increment: action,
      doubled: computed,
      fetchData: flow,
    })
  }

  increment() {
    this.count++
  }

  get doubled() {
    return this.count * 2
  }

  *fetchData() {
    const res: Response = yield fetch("/api/data")
    const data = yield res.json()
    this.items = data
  }
}
```

## `makeObservable` vs `makeAutoObservable`

### `makeObservable`：显式注解

每个成员的角色显式声明、最精确：

```ts
import { makeObservable, observable, action, computed } from "mobx"

class Store {
  count = 0
  history: number[] = []

  constructor() {
    makeObservable(this, {
      count: observable,
      history: observable.shallow,    // 显式声明 shallow
      increment: action,
      doubled: computed,
    })
  }

  increment() {
    this.count++
    this.history.push(this.count)
  }

  get doubled() {
    return this.count * 2
  }
}
```

### `makeAutoObservable`：自动推断

省去显式声明、按规则推断：

```ts
import { makeAutoObservable } from "mobx"

class Store {
  count = 0
  history: number[] = []

  constructor() {
    makeAutoObservable(this)
  }

  increment() {
    this.count++
    this.history.push(this.count)
  }

  get doubled() {
    return this.count * 2
  }
}
```

**自动推断规则**：

| 形态 | 推断 |
|---|---|
| `name = value`（普通字段） | `observable.deep` |
| `get x()` | `computed` |
| `set x()` | `action` |
| `method()`（普通方法） | `autoAction` |
| `*method()`（generator） | `flow` |

### `makeAutoObservable` overrides

少数字段需要不同行为时——用第二参数覆盖：

```ts
import { makeAutoObservable, observable, action } from "mobx"

class Store {
  count = 0
  items: Item[] = []
  cache: Map<string, any> = new Map()
  helperRef = new SomeHelper()

  constructor() {
    makeAutoObservable(this, {
      items: observable.shallow,    // override：只浅观察
      cache: false,                 // override：不是 observable
      helperRef: false,             // override：保留普通对象
      doExpensive: action.bound,    // override：用 bound 版本
    })
  }

  doExpensive = () => {
    // 箭头函数 + action.bound = ✅
  }

  // 普通方法
  doNormal() { /* ... */ }
}
```

### 何时选哪个？

- **优先 `makeAutoObservable`**：90% 场景适用——少写代码、维护成本低
- **必须 `makeObservable`**：
  - 有继承链（父类 / 子类）—— `makeAutoObservable` 不支持
  - 需要 `action.bound` / `flow.bound` 等特殊注解
  - 想精确控制 `observable.shallow` / `observable.ref` 等变体

### `makeAutoObservable` 局限

- **不能用于有父类或子类的 class** —— 这是最常见的限制
- **不能在 constructor 之外**调用
- **field 必须在调用前定义好**（这就是为什么 `useDefineForClassFields: true` 重要）

## Subclassing 与继承

MobX 6 支持继承、但有约束。**`makeAutoObservable` 不能用在父类或子类**——只能用 `makeObservable` + `override` annotation。

```ts
import { makeObservable, observable, action, computed, override } from "mobx"

class BaseStore {
  name = ""

  constructor() {
    makeObservable(this, {
      name: observable,
      reset: action,
      summary: computed,
    })
  }

  reset() {
    this.name = ""
  }

  get summary() {
    return `Name: ${this.name}`
  }
}

class ExtendedStore extends BaseStore {
  count = 0

  constructor() {
    super()
    makeObservable(this, {
      count: observable,
      increment: action,
      reset: override,        // ← 重写父类 action
      summary: override,      // ← 重写父类 computed
    })
  }

  increment() {
    this.count++
  }

  reset() {
    super.reset()
    this.count = 0
  }

  get summary() {
    return `${super.summary}, Count: ${this.count}`
  }
}
```

**重要规则**：

- **只能 override prototype 上的方法 / getter / flow**——不能 override 实例字段（observable field）
- **必须在子类的 `makeObservable` 中显式声明 `override`**
- **箭头函数 action（`action = () => {}`）不能 override**——必须用 prototype method 形式

> 详见官方 [Subclassing](https://mobx.js.org/subclassing.html)。

## Action 全谱

Action 是「**修改 state 的代码**」。MobX 默认 `enforceActions: "observed"` 要求所有 observable mutation 必须在 action 中——这是核心契约。

### `action`：基础注解

```ts
import { makeObservable, observable, action } from "mobx"

class Counter {
  count = 0

  constructor() {
    makeObservable(this, {
      count: observable,
      increment: action,
    })
  }

  increment() {
    this.count++
    this.count++ // 两次 mutation 合并为一个事务（observer 只重渲一次）
  }
}
```

### `action.bound`：自动绑定 `this`

把 action 方法**永久绑定到实例**——传递为 callback 时不会丢 `this`：

```ts
import { makeObservable, observable, action } from "mobx"

class Counter {
  count = 0

  constructor() {
    makeObservable(this, {
      count: observable,
      increment: action.bound,
    })
  }

  increment() {
    this.count++
  }
}

const counter = new Counter()

// ✅ 直接传递 —— this 已经绑定
button.addEventListener("click", counter.increment)

// 而非 action.bound 的话需要：
// button.addEventListener("click", () => counter.increment())
```

### `runInAction`：一次性 action

```ts
import { observable, runInAction } from "mobx"

const state = observable({ count: 0, total: 0 })

// 临时包装 mutation
runInAction(() => {
  state.count++
  state.total += 10
})
```

**典型用途**：

1. **async/await 后的 mutation**（最常见）：

```ts
async function fetchAndUpdate() {
  const res = await fetch("/api/data")
  const data = await res.json()

  // ⚠️ await 后必须 runInAction（async 已经离开了原 action）
  runInAction(() => {
    state.count = data.count
    state.total = data.total
  })
}
```

2. **测试中临时设置状态**：

```ts
test("computes correctly", () => {
  runInAction(() => {
    store.count = 5
    store.tax = 0.1
  })
  expect(store.total).toBe(5.5)
})
```

3. **第三方回调中需要 mutate**：

```ts
someThirdPartyLib.onEvent((data) => {
  runInAction(() => {
    state.data = data
  })
})
```

### `flow`：generator 替代 async/await

`flow` 是 MobX 自带的 generator-based 异步处理——**`yield` 替代 `await`**、**自动**包装每个 yield 之间的代码为 action：

```ts
import { makeObservable, observable, flow, flowResult } from "mobx"

class UserStore {
  user: User | null = null
  loading = false

  constructor() {
    makeObservable(this, {
      user: observable,
      loading: observable,
      fetchUser: flow,
    })
  }

  // 注意 * —— generator function
  *fetchUser(id: number) {
    this.loading = true
    try {
      const res: Response = yield fetch(`/api/users/${id}`)
      const data: User = yield res.json()
      this.user = data       // ✅ 不需要 runInAction
    } finally {
      this.loading = false   // ✅ 不需要 runInAction
    }
  }
}

// 调用
const store = new UserStore()
store.fetchUser(1).then(() => console.log("done"))

// TypeScript 工具：把 generator 返回类型转为 Promise
async function load() {
  const result = await flowResult(store.fetchUser(1))
  // result 类型 = generator 的 return type
}
```

**flow 的取消能力**：

```ts
const promise = store.fetchUser(1)
promise.cancel() // 取消当前 flow（中断 yield 链）
```

### `flow.bound`：flow + bound

同 `action.bound`——把 flow 方法绑定到实例：

```ts
class Store {
  constructor() {
    makeObservable(this, {
      fetchUser: flow.bound,
    })
  }

  *fetchUser() { /* ... */ }
}

// ✅ 直接传递不丢 this
useEffect(() => {
  store.fetchUser()
}, [])
```

### `flow` vs `async/await + runInAction` 选用

| 维度 | `flow`（generator） | `async/await + runInAction` |
|---|---|---|
| 语法 | `*name() { yield ... }` | `async name() { await ... ; runInAction(() => ...) }` |
| `runInAction` | **不需要**手动包 | **必须**手动包 |
| 取消能力 | **支持** `.cancel()` | 需手动配合 `AbortController` |
| TypeScript | yield 类型推导稍弱（需手动标注） | 推导正常 |
| 调试栈 | generator 调试栈不友好 | async 调试栈清晰 |
| 推荐场景 | 复杂多步流程、需要取消 | 简单 fetch + 普通 async 流程 |

**社区共识**：简单 async fetch 用 `async/await + runInAction`、复杂流程（多步、可取消）用 `flow`。

### action 选项

```ts
// 给 action 命名（DevTools / spy 中显示）
const myAction = action("incrementCounter", () => {
  counter.value++
})

// 等价的注解形式
makeObservable(this, {
  increment: action("incrementCounter"),
})
```

## Computed 全谱

`computed` 是「**自动派生 + 智能缓存**」的核心——getter 函数 + 依赖自动追踪 + 仅在依赖变化时重算。

### 基础用法

```ts
import { makeAutoObservable } from "mobx"

class Cart {
  items: { price: number; quantity: number }[] = []
  taxRate = 0.08

  constructor() {
    makeAutoObservable(this)
  }

  get subtotal() {
    console.log("Recompute subtotal")
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  }

  get total() {
    // subtotal 是另一个 computed —— 依赖 subtotal 与 taxRate
    return this.subtotal * (1 + this.taxRate)
  }
}

const cart = new Cart()
console.log(cart.total)  // 触发 subtotal 计算
console.log(cart.total)  // 缓存命中、不重算
cart.taxRate = 0.1       // taxRate 变化 → total 重算（但 subtotal 仍缓存）
```

### Computed 的 5 大规则

1. **只能依赖其他 observable / computed**——不能依赖普通变量
2. **必须是纯函数**——不能 mutate observable、不能有副作用
3. **不能 throw**（throw 会让缓存失效）
4. **不能 return 新创建的 observable**
5. **不能依赖随机数 / `Date.now()` 等非 observable 输入**

### Computed Setter

可以给 computed 配 setter——实现「**逆向派生**」：

```ts
import { makeAutoObservable } from "mobx"

class Temperature {
  celsius = 0

  constructor() {
    makeAutoObservable(this)
  }

  get fahrenheit() {
    return this.celsius * 9 / 5 + 32
  }

  set fahrenheit(value: number) {
    this.celsius = (value - 32) * 5 / 9
  }
}

const t = new Temperature()
t.fahrenheit = 100    // → celsius 自动设为 37.78
console.log(t.celsius) // 37.78
```

### `computed.struct`：结构比较

默认 `computed` 比较旧值 / 新值用 `===`——返回新对象时即使内容一样也会触发下游。`computed.struct` 用**结构相等**：

```ts
import { makeObservable, observable, computed } from "mobx"

class Box {
  width = 0
  height = 0

  constructor() {
    makeObservable(this, {
      width: observable,
      height: observable,
      topRight: computed.struct,    // ← 结构比较
    })
  }

  get topRight() {
    return { x: this.width, y: this.height }
  }
}

// 即使 topRight getter 每次返回新对象、只要 { x, y } 结构没变 → 下游不重渲
```

### Computed 完整选项

```ts
import { makeObservable, computed } from "mobx"

class Store {
  constructor() {
    makeObservable(this, {
      // 1. 自定义 equals 比较器
      expensive: computed({
        equals: (a, b) => a.toString() === b.toString(),
      }),

      // 2. keepAlive：不被订阅时仍保持缓存（防止重新计算）
      // 警告：可能造成内存泄漏（observable 引用被 keepAlive 持有）
      cachedHeavy: computed({ keepAlive: true }),

      // 3. requiresReaction：直接访问（非 reaction / observer 中）→ 报错
      // 用于强制保证 computed 只在响应式上下文中使用
      strictComputed: computed({ requiresReaction: true }),

      // 4. name：DevTools 中显示
      total: computed({ name: "CartTotal" }),
    })
  }
}
```

### Computed with Arguments（参数化派生）

`computed` 默认**不支持参数**——但有几种 workaround：

#### 方案 1：普通方法（无缓存）

```ts
class Store {
  items: Item[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // 不需要 computed 注解 —— observer 组件会自动追踪
  isSelected(id: number): boolean {
    return this.items.some(i => i.id === id && i.selected)
  }
}
```

**缺点**：没有缓存、每次调用都重算。

#### 方案 2：闭包内 `computed`

```tsx
import { computed } from "mobx"
import { observer } from "mobx-react-lite"

const Item = observer(({ store, id }: { store: Store; id: number }) => {
  // 在组件渲染中创建一个 computed —— 自动追踪 + 缓存
  const isSelected = computed(() => store.items.some(i => i.id === id && i.selected)).get()
  return <div className={isSelected ? "selected" : ""}>...</div>
})
```

#### 方案 3：`computedFn`（mobx-utils）

```ts
import { computedFn } from "mobx-utils"

class Store {
  items: Item[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // computedFn 自动 memoize 每个 (id) 参数对应的结果
  isSelected = computedFn((id: number) => {
    return this.items.some(i => i.id === id && i.selected)
  })
}
```

#### 方案 4：移到 item 上

```ts
class Item {
  id = 0
  selected = false

  constructor() {
    makeAutoObservable(this)
  }
}

class Store {
  items: Item[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // store 级 selection 用 computed 派生
  get selected() {
    return this.items.filter(i => i.selected)
  }
}
```

> **建议顺序**：先用「普通方法」（无缓存）—— 性能不足时再加 `computedFn`。

## Reactions 全谱

Reactions 是「**state → side effect**」的桥梁——`autorun` / `reaction` / `when` 三种 API 应对不同场景。

### `autorun`：自动追踪

`autorun` 第一次执行时**追踪所有读到的 observable**——这些 observable 变化时 autorun 重新执行：

```ts
import { autorun, makeAutoObservable } from "mobx"

class Store {
  count = 0
  name = ""

  constructor() {
    makeAutoObservable(this)
  }
}

const store = new Store()

const dispose = autorun(() => {
  // 读 count + name → 这两个 observable 变化时重新执行
  console.log(`Count: ${store.count}, Name: ${store.name}`)
})

store.count++    // 重新执行
store.name = "A" // 重新执行
dispose()        // 停止
store.count++    // 不再执行
```

**何时用 `autorun`**？

- **日志 / 调试**：监听任意 observable 变化、打印
- **同步到 localStorage / IndexedDB**：state 变化 → 序列化保存
- **同步到 URL / window.title**：state 变化 → 更新外部环境
- **触发简单副作用**：state 变化 → 调用 console / sentry / analytics

### `reaction`：分离追踪 + 副作用

`reaction` 明确分离**数据函数**（追踪）与**副作用函数**（执行）——只有数据函数返回值变化时副作用才执行：

```ts
import { reaction, makeAutoObservable } from "mobx"

class Store {
  todos: { text: string; done: boolean }[] = []
  filter = "all"

  constructor() {
    makeAutoObservable(this)
  }
}

const store = new Store()

// 只追踪 todos 数量、不追踪具体内容
const dispose = reaction(
  () => store.todos.length,
  (length, prevLength) => {
    console.log(`Todos count changed from ${prevLength} to ${length}`)
  },
)

store.todos.push({ text: "A", done: false }) // 触发（length 0 → 1）
store.todos[0].done = true                    // 不触发（length 没变）
```

### `reaction` 选项

```ts
reaction(
  () => store.count,
  (count) => console.log(count),
  {
    name: "logCount",          // DevTools 名
    fireImmediately: true,     // 立即执行一次（默认 false）
    delay: 300,                // 节流 300ms
    equals: (a, b) => a === b, // 自定义比较
    onError: (err, r) => console.error(err),
    signal: abortController.signal, // 用 AbortController disposer
    scheduler: (f) => setTimeout(f, 0), // 自定义调度
  },
)
```

### `when`：一次性 condition

`when` 等待 predicate 返回 true、然后执行 effect 一次、自动 dispose：

```ts
import { when, makeAutoObservable } from "mobx"

class Store {
  user: { authenticated: boolean } | null = null

  constructor() {
    makeAutoObservable(this)
  }
}

const store = new Store()

// 等用户登录后执行一次
when(
  () => store.user?.authenticated === true,
  () => {
    console.log("User logged in! Fetching profile...")
    // 一次性副作用
  },
)
```

### `when` 的 Promise 形式

不传 effect 参数时——`when` 返回一个 Promise：

```ts
// 等待 condition 后继续
async function waitAndDo() {
  await when(() => store.user?.authenticated === true)
  console.log("Continuing...")
}

// Promise 形式可以 cancel
const promise = when(() => store.x === 10)
promise.cancel() // 取消等待
```

### `autorun` vs `reaction` vs `when` 选用

| API | 触发时机 | 典型用途 |
|---|---|---|
| `autorun` | **第一次立即** + observable 变化 | 日志 / localStorage 同步 / DOM 更新 |
| `reaction` | observable 变化（**首次不触发** unless fireImmediately） | 精确分离追踪 + 副作用 |
| `when` | predicate **首次为 true** 时**一次** | 等待 + 一次性副作用 / 异步初始化 |

### Reactions 内禁忌

- **不要 mutate observable**——用 action 包装、或避免在 reaction 中 mutate
- **不要 async / setTimeout 后读 observable**——异步代码丢失追踪上下文
- **必须 dispose**——长期 reaction 内存泄漏

正确清理：

```ts
useEffect(() => {
  const dispose = autorun(() => {
    console.log(store.count)
  })
  return dispose // ✅ React 组件 unmount 时自动 dispose
}, [])
```

或使用 DisposableStack（TS 5.2+ + Node 22+）：

```ts
class Cleanup {
  private stack = new DisposableStack()

  constructor() {
    this.stack.use(autorun(() => { /* ... */ }))
    this.stack.use(reaction(() => store.x, () => { /* ... */ }))
  }

  [Symbol.dispose]() {
    this.stack[Symbol.dispose]()
  }
}
```

## mobx-react-lite 完整模式

`mobx-react-lite` 是 React 函数组件 + hooks 项目的首选——只导出三个核心 API：

- **`observer(Component)`** —— HOC 包裹组件
- **`<Observer>{() => ...}</Observer>`** —— render prop 组件（用于 children 中追踪）
- **`useLocalObservable(() => initial)`** —— 组件局部 observable

### `observer` HOC

```tsx
import { observer } from "mobx-react-lite"

// 命名 function（DevTools 友好）
const TodoList = observer(function TodoList({ store }: { store: TodoStore }) {
  return (
    <ul>
      {store.todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
})

// 或：
const TodoList = observer((props: Props) => <ul>...</ul>)
TodoList.displayName = "TodoList"
```

**`observer` 自带能力**：

- 内部已经 `React.memo` 包装 —— **不**需要 `React.memo(observer(Comp))`
- 支持 `forwardRef` —— 用 `observer(forwardRef(...))` 包装
- 支持 generics —— TypeScript 类型保留

### `<Observer>`：render prop（追踪 children）

`observer` 是组件级——如果想**只**让某段 JSX 响应、不整个组件响应：

```tsx
import { Observer } from "mobx-react-lite"

// 父组件不是 observer
function Parent({ store }: { store: Store }) {
  return (
    <div>
      <h1>Static Title</h1>
      {/* 只让这段响应 */}
      <Observer>{() => <p>Count: {store.count}</p>}</Observer>
    </div>
  )
}
```

**何时用 `<Observer>`**？

- 父组件不是 observer、但某段 children 需要响应
- 传 render callback 到第三方组件（如 react-window / react-virtualized 的 row renderer）

```tsx
import { FixedSizeList } from "react-window"
import { Observer } from "mobx-react-lite"

// react-window 的 children 是 render callback、不是 React 组件
;<FixedSizeList itemCount={items.length}>
  {({ index, style }) => (
    <Observer>
      {() => (
        <div style={style}>{items[index].text}</div>
      )}
    </Observer>
  )}
</FixedSizeList>
```

### `useLocalObservable`：组件局部 observable

替代 `useState` 处理**复杂局部状态**（含 computed / action）：

```tsx
import { observer, useLocalObservable } from "mobx-react-lite"

const TimerView = observer(() => {
  const timer = useLocalObservable(() => ({
    seconds: 0,
    increment() {
      this.seconds++
    },
    reset() {
      this.seconds = 0
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
      <button onClick={() => timer.reset()}>Reset</button>
    </div>
  )
})
```

**`useLocalObservable` vs `useState`**：

| 维度 | `useLocalObservable` | `useState` |
|---|---|---|
| 多个相关字段 | 一个对象（全部响应） | 多个 useState |
| computed | 直接 getter | useMemo |
| action | 方法 | 闭包内 callback |
| 持久化 | mount 期间稳定 | mount 期间稳定 |
| 适用 | 复杂局部状态 | 简单 primitive |

### 列表渲染性能优化

把 list item 拆为独立 observer 组件——这样 item 内部变化不会触发整个 list 重渲：

```tsx
// ❌ 一个大 observer —— 任意 todo.text 变化都会触发整个 list 重渲
const TodoList = observer(({ store }: { store: TodoStore }) => (
  <ul>
    {store.todos.map(todo => (
      <li key={todo.id}>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => todo.toggle()}
        />
        {todo.text}
      </li>
    ))}
  </ul>
))

// ✅ list + item 拆分 —— item 变化只重渲该 item
const TodoItem = observer(({ todo }: { todo: Todo }) => (
  <li>
    <input
      type="checkbox"
      checked={todo.done}
      onChange={() => todo.toggle()}
    />
    {todo.text}
  </li>
))

const TodoList = observer(({ store }: { store: TodoStore }) => (
  <ul>
    {store.todos.map(todo => (
      <TodoItem key={todo.id} todo={todo} />
    ))}
  </ul>
))
```

### 延迟解引用（Late Dereferencing）

把对象 / store 传下去、而不是把 primitive 字段提前解出来：

```tsx
// ❌ 在 props 中解 primitive —— 任意 user 字段变化都会触发父组件重渲
<DisplayName name={user.name} avatar={user.avatar} />

// ✅ 传整个 user 对象 —— 只有 DisplayName 内部读到的字段才追踪
<DisplayName user={user} />

const DisplayName = observer(({ user }: { user: User }) => (
  <span>{user.name}</span>
))
```

详见 [指南 > 性能优化](#性能优化)。

## 响应式陷阱

MobX 的「**自动追踪**」让代码简洁、但有几个**经典陷阱**——这是新手最常踩的坑。

### 陷阱 1：解构 observable

```tsx
// ❌ 错误：解构 primitive 字段后丢失响应
const Counter = observer(({ store }: { store: CounterStore }) => {
  const { count } = store // ← count 是 number、不再追踪
  return <p>{count}</p>   // ← store.count 变化也不重渲
})

// ✅ 正确：在 JSX 中直接读
const Counter = observer(({ store }: { store: CounterStore }) => {
  return <p>{store.count}</p>
})
```

**为什么**？MobX 追踪的是「**属性访问**」——`store.count` 是一次属性访问、`const { count } = store` 也是访问、但**两次访问发生在 observer 内**才有效。一旦把值赋给本地变量、本地变量是普通 primitive 与 store 无关。

**例外**：解构 observable 对象（不是 primitive）—— 引用本身还在：

```tsx
// ⚠️ 解构 user 后、user 仍是 observable 对象（同一引用）
const { user } = store
return <p>{user.name}</p> // ✅ 仍然追踪 user.name 变化
```

但如果 `store.user` 被**整体替换**为新对象、本地的 user 仍是旧对象——所以不推荐这种写法。

### 陷阱 2：忘了 `observer`

```tsx
// ❌ 没有 observer —— store.count 变化不会重渲
const Counter = ({ store }: { store: CounterStore }) => {
  return <p>{store.count}</p>
}

// ✅ 加 observer
const Counter = observer(({ store }: { store: CounterStore }) => {
  return <p>{store.count}</p>
})
```

**建议**：启用 ESLint 规则 `mobx/missing-observer` 强制检查。或配置 `configure({ observableRequiresReaction: true })` 在开发时警告。

### 陷阱 3：忘了 `makeObservable` / `makeAutoObservable`

```ts
class Store {
  count = 0
  // ❌ 没有 constructor 调用 makeObservable —— 字段不是 observable
}

const store = new Store()
store.count++ // 不触发任何响应
```

**修复**：

```ts
class Store {
  count = 0

  constructor() {
    makeAutoObservable(this) // ✅
  }
}
```

### 陷阱 4：在 reaction 外读 observable

```ts
// ❌ 错误：组件外、autorun 外、observer 外
const count = store.count // 这只是普通读取、不建立任何依赖
console.log(count) // 永远是初始值

// ✅ 正确：放进 autorun
autorun(() => {
  console.log(store.count) // 现在 count 变化会触发
})
```

### 陷阱 5：async 后忘了 `runInAction`

```ts
class Store {
  data: Data | null = null

  async fetchData() {
    const res = await fetch("/api/data")
    const json = await res.json()
    // ❌ enforceActions: "observed" → 这里会报错
    this.data = json
  }
}

// ✅ 正确
async fetchData() {
  const res = await fetch("/api/data")
  const json = await res.json()
  runInAction(() => {
    this.data = json
  })
}
```

### 陷阱 6：在 computed 中 mutate

```ts
class Store {
  count = 0

  // ❌ 错误：computed 中 mutate
  get total() {
    this.count++ // 警告 + 可能导致死循环
    return this.count * 2
  }
}
```

### 陷阱 7：在 render 中创建新 observer 函数

```tsx
// ❌ 每次渲染都创建新组件
function Parent({ store }: { store: Store }) {
  const Inner = observer(() => <p>{store.count}</p>) // ← 每次渲染都新建
  return <Inner />
}

// ✅ 把 observer 包装放到模块级
const Inner = observer(({ store }: { store: Store }) => <p>{store.count}</p>)

function Parent({ store }: { store: Store }) {
  return <Inner store={store} />
}
```

## Store 设计与组织

### 单 Store 模式

小型项目——一个全局 store：

```ts
// src/stores/app.ts
import { makeAutoObservable, runInAction } from "mobx"

class AppStore {
  user: User | null = null
  todos: Todo[] = []
  notifications: Notification[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // ... actions / computeds
}

export const appStore = new AppStore()
```

### 多 Store 模式

中等复杂度——按 domain 拆分 store：

```ts
// src/stores/user.ts
export class UserStore { /* ... */ }
export const userStore = new UserStore()

// src/stores/todo.ts
export class TodoStore { /* ... */ }
export const todoStore = new TodoStore()

// src/stores/notification.ts
export class NotificationStore { /* ... */ }
export const notificationStore = new NotificationStore()
```

组件中按需 import：

```tsx
import { observer } from "mobx-react-lite"
import { userStore } from "@/stores/user"
import { todoStore } from "@/stores/todo"

const Dashboard = observer(() => {
  return (
    <div>
      <h1>Welcome, {userStore.user?.name}</h1>
      <p>Todos: {todoStore.todos.length}</p>
    </div>
  )
})
```

### Root Store 模式（推荐复杂项目）

把所有 store 组合到 RootStore——store 之间互相引用：

```ts
// src/stores/root.ts
import { makeAutoObservable } from "mobx"
import { UserStore } from "./user"
import { TodoStore } from "./todo"

export class RootStore {
  userStore: UserStore
  todoStore: TodoStore

  constructor() {
    // 把 root 传给子 store —— 子 store 可以互相引用
    this.userStore = new UserStore(this)
    this.todoStore = new TodoStore(this)
  }
}

// src/stores/user.ts
import { makeAutoObservable } from "mobx"
import type { RootStore } from "./root"

export class UserStore {
  root: RootStore
  user: User | null = null

  constructor(root: RootStore) {
    this.root = root
    makeAutoObservable(this, { root: false }) // root 不是 observable
  }

  login(user: User) {
    this.user = user
    // 可以访问其他 store
    this.root.todoStore.loadForUser(user.id)
  }
}

// src/stores/todo.ts
export class TodoStore {
  root: RootStore
  todos: Todo[] = []

  constructor(root: RootStore) {
    this.root = root
    makeAutoObservable(this, { root: false })
  }

  loadForUser(userId: number) { /* ... */ }
}
```

### React Context 注入（推荐复杂项目）

不用模块级 singleton——通过 Context 注入 RootStore：

```tsx
// src/stores/context.ts
import { createContext, useContext } from "react"
import type { RootStore } from "./root"

export const StoreContext = createContext<RootStore | null>(null)

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useStore must be inside <StoreProvider>")
  return store
}

// 便利 hooks
export function useUserStore() {
  return useStore().userStore
}

export function useTodoStore() {
  return useStore().todoStore
}
```

```tsx
// src/main.tsx
import { RootStore } from "@/stores/root"
import { StoreContext } from "@/stores/context"

const rootStore = new RootStore()

createRoot(document.getElementById("root")!).render(
  <StoreContext.Provider value={rootStore}>
    <App />
  </StoreContext.Provider>
)
```

```tsx
// 组件中
import { observer } from "mobx-react-lite"
import { useUserStore } from "@/stores/context"

const Header = observer(() => {
  const userStore = useUserStore()
  return <p>{userStore.user?.name}</p>
})
```

**Context 注入的好处**：

- **测试友好**：每个测试一个新 RootStore、注入 Provider
- **SSR 友好**：每个请求一个新 RootStore（避免请求间状态泄漏）
- **避免 singleton 副作用**：模块级 singleton 在测试 / SSR 中容易状态污染

## 装饰器：Legacy vs Stage-3

MobX 6 同时支持两种装饰器，**默认不依赖**——`makeObservable` / `makeAutoObservable` 是默认方案。

### Legacy 装饰器（旧 / 将在 MobX 7 移除）

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": true
  }
}
```

```ts
import { observable, action, computed, makeObservable } from "mobx"

class Store {
  @observable count = 0

  @action
  increment() {
    this.count++
  }

  @computed
  get doubled() {
    return this.count * 2
  }

  constructor() {
    // 必须调用 makeObservable(this) —— 让装饰器 metadata 生效
    makeObservable(this)
  }
}
```

> **将在 MobX 7 移除**——不推荐新项目使用。

### Stage-3 装饰器（TS 5.0+ 推荐）

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": false,    // ← 注意是 false（用 native）
    "useDefineForClassFields": true
  }
}
```

```ts
import { observable, action, computed } from "mobx"

class Store {
  // 注意 accessor 关键字 —— stage-3 标准要求
  @observable accessor count = 0

  @action
  increment() {
    this.count++
  }

  @computed
  get doubled() {
    return this.count * 2
  }

  // 不需要 makeObservable(this) —— stage-3 装饰器自动初始化
}
```

### 装饰器 + makeObservable 组合

如果需要混用（部分字段用装饰器、部分用 annotation）：

```ts
class Store {
  @observable accessor count = 0

  // 这个字段不用装饰器、在 makeObservable 中声明
  todos: Todo[] = []

  constructor() {
    makeObservable(this, {
      todos: observable,
    })
  }
}
```

### 不用装饰器的优势（推荐）

- **不依赖 TS / Babel 配置**——任何环境都能跑
- **类型推导更稳定**——`makeAutoObservable` 完全自动
- **未来兼容**——`makeObservable` 是 MobX 6+ 的标准 API

**结论**：除非团队特别偏好装饰器、否则**优先用 `makeAutoObservable`**。

## TypeScript 完整模式

### Typed Hooks（Context 注入场景）

```ts
// src/stores/context.ts
import { createContext, useContext } from "react"
import type { RootStore } from "./root"

const StoreContext = createContext<RootStore | null>(null)
export { StoreContext }

export function useStore<T>(selector: (root: RootStore) => T): T {
  const store = useContext(StoreContext)
  if (!store) throw new Error("Missing StoreProvider")
  return selector(store)
}

// 用法
const todos = useStore(s => s.todoStore.todos)
```

### `flowResult`：把 generator 返回类型转 Promise

```ts
import { flow, flowResult } from "mobx"

class Store {
  *fetchUser(id: number) {
    const res: Response = yield fetch(`/api/users/${id}`)
    const data: User = yield res.json()
    return data // ← 返回 User
  }
}

const store = new Store()

// 直接调用返回 IterableIterator —— 不是 Promise
const result = store.fetchUser(1) // type: IterableIterator<...>

// 转 Promise
async function load() {
  const user: User = await flowResult(store.fetchUser(1))
}
```

### `IObservableArray` / `IObservableValue`

```ts
import type { IObservableArray, IObservableValue, ObservableMap, ObservableSet } from "mobx"

let arr: IObservableArray<number>
let value: IObservableValue<string>
let map: ObservableMap<string, number>
let set: ObservableSet<number>
```

### Annotation 类型

```ts
import type { Annotation } from "mobx"

const customAnnotation: Annotation = { /* ... */ }
```

### Class 不带显式字段类型时的推导

`makeAutoObservable(this)` 完全从 class field 初始值推导——只要 field 写好类型即可：

```ts
class Store {
  user: User | null = null      // 显式联合类型
  todos: Todo[] = []             // 显式数组类型
  count = 0                      // 自动推导 number

  constructor() {
    makeAutoObservable(this)
  }
}
```

## Configure 完整选项

`configure` 是全局配置——通常在 app 入口设置一次：

```ts
import { configure } from "mobx"

configure({
  /**
   * 强制 action 模式
   * - "never": 任何地方都能 mutate observable（不推荐）
   * - "observed"（默认）: 观察中的 observable 必须在 action 中改
   * - "always": 所有 observable 都必须在 action 中改（最严格）
   */
  enforceActions: "always",

  /**
   * computed 必须在 reaction / observer 上下文中读
   * 防止「访问 computed 但不触发缓存」的浪费
   */
  computedRequiresReaction: true,

  /**
   * reaction（包括 observer）必须读至少一个 observable
   * 否则警告 —— 找出无用的 reaction / observer
   */
  reactionRequiresObservable: true,

  /**
   * observable 访问必须在 reaction 中
   * 警告找出忘 observer 的组件
   */
  observableRequiresReaction: true,

  /**
   * 使用 Proxy？
   * - "always"（默认）: 任何时候都用 Proxy（需要 Proxy 支持）
   * - "never": ES5 fallback（用于 IE11 等老浏览器）
   * - "ifavailable": 检测后决定
   */
  useProxies: "always",

  /**
   * 隔离 global state
   * 多个 MobX 实例共存时启用 —— 避免互相干扰
   */
  isolateGlobalState: false,

  /**
   * 自定义 reaction 调度器
   * 默认同步执行 —— 可以延迟到下一个 tick
   */
  reactionScheduler: (run) => Promise.resolve().then(run),

  /**
   * Disable error boundaries
   * 默认 reaction 抛错被 MobX 捕获 —— 设 true 让错误冒泡
   */
  disableErrorBoundaries: false,
})
```

**推荐配置**：

```ts
// 开发阶段最严格 + 生产阶段适度
configure({
  enforceActions: "always",
  computedRequiresReaction: import.meta.env.DEV,
  reactionRequiresObservable: import.meta.env.DEV,
  observableRequiresReaction: false, // 太严容易误报
})
```

## DevTools 调试

### `trace()`：诊断重新计算原因

```ts
import { trace } from "mobx"

const ExpensiveCard = observer(({ todo }: { todo: Todo }) => {
  // 在 render 中加 trace —— 任何 observable 变化导致此组件重渲时打印
  trace()
  return <div>{todo.text}</div>
})
```

或在 computed / reaction 中：

```ts
class Store {
  get total() {
    trace() // 哪个依赖变化导致重算？
    return this.items.reduce((sum, i) => sum + i.price, 0)
  }
}
```

传 `true` 直接断点（debugger）：

```ts
const Card = observer(() => {
  trace(true) // 自动进入 debugger
  return <div>...</div>
})
```

### `spy(listener)`：监听所有事件

```ts
import { spy } from "mobx"

const dispose = spy(event => {
  if (event.type === "action") {
    console.log(`Action ${event.name} with`, event.arguments)
  } else if (event.type === "update") {
    console.log(`Updated ${event.observableKind} ${event.name}: ${event.oldValue} → ${event.newValue}`)
  }
})

// 后续...
dispose() // 停止 spy
```

### `getDependencyTree` / `getObserverTree`

```ts
import { getDependencyTree, getObserverTree } from "mobx"

// 查 computed 的依赖
const tree = getDependencyTree(store, "total")
console.log(tree)

// 查 observable 的观察者
const observers = getObserverTree(store, "count")
console.log(observers)
```

### `mobx-logger`：开发日志中间件

```ts
import { enableLogging } from "mobx-logger"

enableLogging({
  predicate: () => true,
  action: true,
  reaction: true,
  transaction: true,
  compute: true,
})
```

### React DevTools 集成

```ts
import { observer } from "mobx-react-lite"

// 命名 function 让 DevTools 显示组件名
const Counter = observer(function Counter() {
  return <div>...</div>
})
```

### `getDebugName(observable)`

```ts
import { getDebugName } from "mobx"

const name = getDebugName(store, "count") // 返回字符串名
```

## SSR 与 Next.js 集成

MobX 在 SSR 中需要注意「**每个请求一个 store**」——避免请求间状态泄漏：

### 标准 React SSR

```tsx
// server.tsx
import { renderToString } from "react-dom/server"
import { RootStore } from "@/stores/root"
import { StoreContext } from "@/stores/context"

function handleRequest(req, res) {
  // ✅ 每个请求一个新 store
  const rootStore = new RootStore()

  // 预填数据
  rootStore.userStore.loadFromCookie(req.cookies)

  // 渲染
  const html = renderToString(
    <StoreContext.Provider value={rootStore}>
      <App />
    </StoreContext.Provider>
  )

  // 序列化 store 注入到 HTML
  const initialState = toJS(rootStore)
  res.send(`
    <html>
      <body>
        <div id="root">${html}</div>
        <script>window.__INITIAL_STATE__ = ${JSON.stringify(initialState)}</script>
      </body>
    </html>
  `)
}
```

客户端 hydration：

```tsx
// client.tsx
import { hydrateRoot } from "react-dom/client"
import { RootStore } from "@/stores/root"

const rootStore = new RootStore()
// 用 SSR 注入的初始状态填充
rootStore.hydrate(window.__INITIAL_STATE__)

hydrateRoot(
  document.getElementById("root"),
  <StoreContext.Provider value={rootStore}>
    <App />
  </StoreContext.Provider>
)
```

### Next.js App Router

```tsx
// src/stores/context.tsx
"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { RootStore } from "./root"

const StoreContext = createContext<RootStore | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  // 每次 mount 一个新 store —— Next.js 在 SSR 时也会 mount 一次
  const [store] = useState(() => new RootStore())

  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("Missing StoreProvider")
  return ctx
}
```

```tsx
// app/layout.tsx
import { StoreProvider } from "@/stores/context"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  )
}
```

### `enableStaticRendering(true)`：禁用 observer 订阅

在纯 SSR 环境（不需要 hydration）中：

```ts
// server.tsx
import { enableStaticRendering } from "mobx-react-lite"

enableStaticRendering(true) // 让 observer 跳过订阅、只渲染一次
```

> **注意**：用了 `enableStaticRendering(true)` 后、客户端 hydrate 时**仍需**正常 observer 订阅、所以这个设置只在纯 server 进程中开启。

## 测试

### Vitest / Jest 基本测试

```ts
import { describe, expect, it } from "vitest"
import { CounterStore } from "@/stores/counter"

describe("CounterStore", () => {
  it("increments count", () => {
    const store = new CounterStore()
    expect(store.count).toBe(0)
    store.increment()
    expect(store.count).toBe(1)
  })

  it("computes doubled correctly", () => {
    const store = new CounterStore()
    store.increment()
    store.increment()
    expect(store.doubled).toBe(4)
  })

  it("async fetchUser updates state", async () => {
    const store = new UserStore()
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ id: 1, name: "Alice" }),
    })

    await store.fetchUser(1)
    expect(store.user).toEqual({ id: 1, name: "Alice" })
  })
})
```

### 使用 reaction 验证响应式

```ts
import { reaction, configure } from "mobx"

it("triggers reaction on count change", () => {
  configure({ enforceActions: "never" }) // 测试中放宽

  const store = new CounterStore()
  const changes: number[] = []

  reaction(
    () => store.count,
    (count) => changes.push(count),
  )

  store.count = 5
  store.count = 10
  expect(changes).toEqual([5, 10])
})
```

### React 组件测试

```tsx
import { render, screen } from "@testing-library/react"
import { observer } from "mobx-react-lite"
import { CounterStore } from "@/stores/counter"

const Counter = observer(({ store }: { store: CounterStore }) => (
  <p>{store.count}</p>
))

it("renders count and reacts to changes", async () => {
  const store = new CounterStore()
  render(<Counter store={store} />)

  expect(screen.getByText("0")).toBeInTheDocument()

  store.increment()
  // observer 会自动重渲
  expect(await screen.findByText("1")).toBeInTheDocument()
})
```

### `toJS` 序列化用于 snapshot

```ts
import { toJS } from "mobx"

it("matches snapshot", () => {
  const store = new TodoStore()
  store.addTodo("A")
  store.addTodo("B")

  expect(toJS(store)).toMatchSnapshot()
})
```

## mobx-state-tree（MST）简介

[`mobx-state-tree`](https://mobx-state-tree.js.org/)（MST）是 MobX 之上的「**结构化对象模型**」——把 MobX 与「类型系统 + Snapshot + Patch + 时间旅行」结合：

```ts
import { types, flow, getSnapshot } from "mobx-state-tree"

// 定义类型（类似 TypeScript 类型 + 运行时验证）
const Todo = types.model("Todo", {
  id: types.identifier,
  text: types.string,
  done: types.boolean,
}).actions(self => ({
  toggle() {
    self.done = !self.done
  },
}))

const TodoStore = types.model("TodoStore", {
  todos: types.array(Todo),
}).actions(self => ({
  addTodo(text: string) {
    self.todos.push({ id: String(Date.now()), text, done: false })
  },

  loadTodos: flow(function* () {
    const res: Response = yield fetch("/api/todos")
    const data = yield res.json()
    self.todos = data
  }),
})).views(self => ({
  get unfinished() {
    return self.todos.filter(t => !t.done)
  },
}))

// 创建 store
const store = TodoStore.create({ todos: [] })
store.addTodo("Buy milk")

// Snapshot —— immutable plain object
const snapshot = getSnapshot(store)
console.log(snapshot) // { todos: [{ id: "1700000000", text: "Buy milk", done: false }] }

// 应用 snapshot（回放历史）
applySnapshot(store, snapshot)

// Patch 记录所有变化（时间旅行基础）
onPatch(store, patch => {
  console.log("Patch:", patch)
})
```

**MST 的特点**：

- **类型系统 + 运行时验证**：`types.model` / `types.string` / `types.array` 等
- **Snapshot**：把整个 store 转成 immutable JSON
- **Patch**：记录每次变化（add / remove / replace）
- **时间旅行**：基于 Patch 实现 undo/redo
- **环境**：可注入环境变量（如 fetch / logger 实例）
- **References**：原生支持引用其他 model（避免循环引用）

**MST vs 纯 MobX**：

| 维度 | MST | 纯 MobX |
|---|---|---|
| API 风格 | builder（types.model().actions()） | class 或 plain object |
| 类型系统 | 运行时 + 静态 | 仅静态 TS |
| Snapshot | 一等公民 | 用 `toJS` 手动 |
| 时间旅行 | 内置 Patch + applySnapshot | 需要手动实现 |
| Bundle | +~15KB | 0 |
| 学习曲线 | 陡 | 中 |

> **何时选 MST**？需要「严格类型化对象模型 + 时间旅行」（如 Mendix 低代码平台）。否则**纯 MobX 已经够用**。

## mobx-react 完整版（class 组件支持）

如果项目中还有 React class component、需要用 `mobx-react`（不是 lite 版）：

```bash
pnpm add mobx mobx-react
```

### `@observer` 装饰器 / HOC

```tsx
import * as React from "react"
import { observer } from "mobx-react"

@observer
class Counter extends React.Component<{ store: CounterStore }> {
  render() {
    return (
      <div>
        <p>Count: {this.props.store.count}</p>
        <button onClick={() => this.props.store.increment()}>+1</button>
      </div>
    )
  }
}

// 或 HOC 形式（不依赖装饰器）
class CounterRaw extends React.Component<{ store: CounterStore }> {
  render() { /* ... */ }
}
export default observer(CounterRaw)
```

### `<Provider>` + `inject`（老 API、不推荐新项目）

```tsx
import { Provider, inject, observer } from "mobx-react"

const rootStore = { counterStore: new CounterStore() }

// 注入 store 到 props（老风格、新项目用 Context + hooks 替代）
const Counter = inject("counterStore")(
  observer(({ counterStore }: { counterStore?: CounterStore }) => (
    <p>{counterStore!.count}</p>
  ))
)

function App() {
  return (
    <Provider {...rootStore}>
      <Counter />
    </Provider>
  )
}
```

> **新项目推荐**：直接用 mobx-react-lite + React Context（见 [Store 设计 > React Context 注入](#react-context-注入推荐复杂项目)），不用 `<Provider>` + `inject`。

## 性能优化

### 1. observer 拆分

把大组件拆为小 observer—— observable 变化只重渲读到该字段的小组件：

```tsx
// ❌ 一个大 observer
const Dashboard = observer(({ root }: { root: RootStore }) => (
  <div>
    <h1>Welcome, {root.userStore.user?.name}</h1>
    <p>Todos: {root.todoStore.todos.length}</p>
    <p>Notifications: {root.notificationStore.unread.length}</p>
  </div>
))

// ✅ 拆为多个小 observer
const UserHeader = observer(({ store }: { store: UserStore }) => (
  <h1>Welcome, {store.user?.name}</h1>
))

const TodoCounter = observer(({ store }: { store: TodoStore }) => (
  <p>Todos: {store.todos.length}</p>
))

const NotifCounter = observer(({ store }: { store: NotificationStore }) => (
  <p>Notifications: {store.unread.length}</p>
))

const Dashboard = ({ root }: { root: RootStore }) => (
  <div>
    <UserHeader store={root.userStore} />
    <TodoCounter store={root.todoStore} />
    <NotifCounter store={root.notificationStore} />
  </div>
)
```

### 2. 列表渲染拆分

把 row 抽成独立 observer：

```tsx
const TodoItem = observer(({ todo }: { todo: Todo }) => (
  <li>
    <input type="checkbox" checked={todo.done} onChange={() => todo.toggle()} />
    {todo.text}
  </li>
))

const TodoList = observer(({ store }: { store: TodoStore }) => (
  <ul>
    {store.todos.map(todo => (
      <TodoItem key={todo.id} todo={todo} />
    ))}
  </ul>
))
```

**效果**：单个 todo.text / todo.done 变化只重渲该 `<TodoItem>`、不重渲整个 `<TodoList>`。

### 3. 延迟解引用（Late Dereferencing）

把对象传下去、不要在 prop 层解引用：

```tsx
// ❌ 提前解引用
<UserName name={user.name} />

// ✅ 传整个 user 对象
<UserName user={user} />

const UserName = observer(({ user }: { user: User }) => (
  <span>{user.name}</span>
))
```

### 4. computed 而非普通方法

把派生计算放在 computed 中——避免重复计算：

```ts
class Store {
  items: Item[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // ❌ 普通方法 —— 每次访问都重算
  filteredItems(filter: string) {
    return this.items.filter(i => i.name.includes(filter))
  }

  // ✅ computed（无参数版）—— 缓存
  get activeItems() {
    return this.items.filter(i => i.active)
  }

  // ✅ 参数化 computed 用 computedFn
  filteredByCategory = computedFn((category: string) => {
    return this.items.filter(i => i.category === category)
  })
}
```

### 5. `observable.shallow` / `observable.ref`

不需要深度追踪时——用 shallow / ref：

```ts
class Store {
  // 内部对象不变（immutable）—— 用 ref
  user: User | null = null

  // 数组元素是 immutable —— 用 shallow
  events: Event[] = []

  constructor() {
    makeObservable(this, {
      user: observable.ref,
      events: observable.shallow,
    })
  }
}
```

### 6. `transaction` 批量更新（自动）

action 已经自动 batch、无需手动 `transaction`：

```ts
class Store {
  setUser(user: User) {
    this.user = user
    this.role = user.role
    this.permissions = user.permissions
    // 三次 mutation 合并为一个事务、observer 只重渲一次
  }
}
```

### 7. 避免在 render 中创建 observable

```tsx
// ❌ 每次渲染都创建新 observable
function BadCounter() {
  const counter = observable({ count: 0 }) // ← 每次渲染都新建！
  return <p>{counter.count}</p>
}

// ✅ 用 useLocalObservable
function GoodCounter() {
  const counter = useLocalObservable(() => ({ count: 0 }))
  return <p>{counter.count}</p>
}
```

## 常见踩坑总结

| 坑 | 现象 | 修复 |
|---|---|---|
| 忘了 `makeObservable` | mutation 不触发响应 | 在 constructor 加 `makeAutoObservable(this)` |
| 忘了 `observer` | 组件不重渲 | `export default observer(Component)` |
| 解构 observable 字段 | 解构后丢失响应 | 在 JSX / render 中直接 `store.x` |
| async 后忘 `runInAction` | enforceActions 报错 | await 后用 `runInAction(() => { ... })` |
| 组件外读 observable | 永远是初始值 | 放进 `autorun` / `observer` / `reaction` |
| computed 中 mutate | 警告 / 死循环 | computed 必须纯函数 |
| 渲染中创建新 observable | 反复重建 | 用 `useLocalObservable` |
| 列表大且只读 1 字段 | 全部 row 重渲 | row 抽成独立 observer |
| 用了 `makeAutoObservable` 但有父类 | runtime 报错 | 改用 `makeObservable(this, ...)` |
| 装饰器配置不当 | 类型推导失败 | 改用 `makeAutoObservable`、不用装饰器 |

## 下一步

完整理解了 MobX 的核心机制——**observable 全类型** / **`makeObservable` + `makeAutoObservable`** / **action 全谱（含 flow）** / **computed 完整选项** / **Reactions（autorun / reaction / when）** / **mobx-react-lite 完整模式** / **响应式陷阱** / **Store 设计（Single / Multi / RootStore + Context）** / **装饰器（legacy / stage-3）** / **TypeScript** / **Configure** / **DevTools 调试** / **SSR** / **测试** / **mobx-state-tree** / **mobx-react 完整版** / **性能优化** / **常见踩坑**。

继续学习：

- [参考](./reference.md)：**API 速查**——所有 import 来源、全部 API 签名（`makeObservable` / `observable` / `action` / `computed` / `autorun` / `reaction` / `when` / `runInAction` / `flow` / `flowResult` / `observe` / `intercept` / `untracked` / `transaction` / `configure` / `toJS` / `isObservable*` 检查函数 / `trace` / `spy` / `getDependencyTree` / `getObserverTree` / `createAtom` / `observer` / `Observer` / `useLocalObservable`）+ Annotations 完整表 + TypeScript 类型 + v5 → v6 迁移 checklist