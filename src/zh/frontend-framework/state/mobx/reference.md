---
layout: doc
outline: [2, 3]
---

# 参考

> MobX 6.x + mobx-react-lite 4.x API 速查。所有签名 / 类型 / 选项与官方文档对齐。

## 全部导出

```ts
// from 'mobx'
import {
  // ============ 创建 Observable ============
  observable,
  makeObservable,
  makeAutoObservable,

  // ============ Annotations ============
  // observable.deep / observable.shallow / observable.ref / observable.struct
  // observable.box / observable.array / observable.map / observable.set
  // action / action.bound
  // computed / computed.struct
  // flow / flow.bound
  // override

  // ============ Action ============
  action,
  runInAction,
  flow,
  flowResult,

  // ============ Computed ============
  computed,

  // ============ Reactions ============
  autorun,
  reaction,
  when,

  // ============ 低层 API ============
  observe,
  intercept,
  onBecomeObserved,
  onBecomeUnobserved,
  untracked,
  transaction,

  // ============ 全局配置 ============
  configure,

  // ============ 数据转换 ============
  toJS,

  // ============ 类型检查 ============
  isObservable,
  isObservableProp,
  isObservableObject,
  isObservableArray,
  isObservableMap,
  isObservableSet,
  isBoxedObservable,
  isComputed,
  isComputedProp,
  isAction,
  isFlow,

  // ============ 调试 ============
  trace,
  spy,
  getDebugName,
  getDependencyTree,
  getObserverTree,
  getAtom,

  // ============ 自定义 Observable ============
  createAtom,

  // ============ 工具 ============
  values,
  keys,
  entries,
  set,
  remove,
  has,
  get,

  // ============ 类型 ============
  type IObservableValue,
  type IObservableArray,
  type ObservableMap,
  type ObservableSet,
  type IReactionDisposer,
  type IReactionOptions,
  type IAutorunOptions,
  type IWhenOptions,
  type Lambda,
  type Annotation,
} from "mobx"
```

```ts
// from 'mobx-react-lite'
import {
  observer,
  Observer,
  useLocalObservable,
  enableStaticRendering,
  isUsingStaticRendering, // 内部 helper
} from "mobx-react-lite"
```

```ts
// from 'mobx-react'（含 class component 支持）
import {
  observer,
  Observer,
  Provider,
  inject,
  useLocalObservable,
  // 还有所有 mobx-react-lite 的导出
} from "mobx-react"
```

```ts
// from 'mobx-utils'（社区常用工具）
import {
  computedFn,
  fromPromise,
  fromResource,
  deepObserve,
  lazyObservable,
  createViewModel,
  asyncAction,        // 已废弃 —— 用 flow 替代
} from "mobx-utils"
```

```ts
// from 'mobx-state-tree'（可选 OOM 框架）
import {
  types,
  flow,
  getSnapshot,
  applySnapshot,
  onSnapshot,
  onPatch,
  getRoot,
  getParent,
  getEnv,
  destroy,
} from "mobx-state-tree"
```

## 核心 Observable API

### `observable()`

把任何 JS 对象 / 数组 / Map / Set 包装为 observable（递归 deep 默认）。

#### 签名

```ts
function observable<T>(
  value: T,
  annotations?: Annotations<T>,
  options?: CreateObservableOptions
): T
```

#### 用法

```ts
// 普通对象
const state = observable({ count: 0, name: "A" })

// 数组
const list = observable([1, 2, 3])

// Map
const m = observable(new Map<string, number>([["a", 1]]))

// Set
const s = observable(new Set<number>([1, 2]))

// 带 annotations
const store = observable(
  { count: 0, items: [] },
  {
    items: observable.shallow,
  },
)

// 带 options
const ref = observable({ x: 0 }, {}, { deep: false, name: "MyStore" })
```

#### `CreateObservableOptions`

```ts
interface CreateObservableOptions {
  name?: string         // DevTools 显示名
  deep?: boolean        // 是否递归 deep（默认 true）
  defaultDecorator?: Annotation  // 默认 annotation
  proxy?: boolean       // 是否用 Proxy（默认 true）
  autoBind?: boolean    // action / flow 是否默认 bound
}
```

### `observable.box()`

包装 primitive 为 observable：

```ts
function observable.box<T>(value?: T, options?: CreateObservableOptions): IObservableValue<T>

const v = observable.box(0)
v.get()  // 0
v.set(1)
```

### `observable.array()` / `observable.map()` / `observable.set()`

```ts
function observable.array<T>(initialValues?: T[], options?: CreateObservableOptions): IObservableArray<T>
function observable.map<K, V>(initialValues?: Iterable<[K, V]>, options?: CreateObservableOptions): ObservableMap<K, V>
function observable.set<T>(initialValues?: Iterable<T>, options?: CreateObservableOptions): ObservableSet<T>
```

`IObservableArray` 额外方法：

```ts
arr.replace(newItems)     // 整体替换
arr.clear()               // 清空
arr.remove(item)          // 删除指定元素（按值）
arr.spliceWithArray(start, deleteCount, newItems)
arr.toJSON()              // 转普通数组
```

`ObservableMap` 额外方法：

```ts
m.replace(newItems)
m.merge(otherMap)
m.toJSON()
```

`ObservableSet` 额外方法：

```ts
s.replace(newSet)
s.toJSON()
```

### `observable.ref` / `observable.shallow` / `observable.struct` / `observable.deep`

```ts
// observable.ref：只追踪赋值（不递归内部）
observable.ref

// observable.shallow：集合本身可观察、内容不递归
observable.shallow

// observable.struct：结构相等时忽略赋值
observable.struct

// observable.deep（默认）：递归转换
observable.deep
```

### `makeObservable()`

显式注解 class 字段。

#### 签名

```ts
function makeObservable<T>(
  target: T,
  annotations?: AnnotationsMap<T>,
  options?: CreateObservableOptions
): T
```

#### 用法

```ts
class Store {
  count = 0
  items: Item[] = []

  constructor() {
    makeObservable(this, {
      count: observable,
      items: observable.shallow,
      increment: action,
      doubled: computed,
      fetchData: flow,
    })
  }
}
```

如果用了装饰器、可以省略第二参数：

```ts
class Store {
  @observable accessor count = 0
  @action increment() {}

  constructor() {
    makeObservable(this) // 不传 annotations，让装饰器 metadata 生效
  }
}
```

### `makeAutoObservable()`

自动推断所有字段角色（推荐）。

#### 签名

```ts
function makeAutoObservable<T>(
  target: T,
  overrides?: AnnotationsMap<T>,
  options?: AutoObservableOptions
): T

interface AutoObservableOptions {
  name?: string
  autoBind?: boolean    // action / flow 默认 bound
  deep?: boolean        // 集合默认 deep（默认 true）
  proxy?: boolean
}
```

#### 用法

```ts
class Store {
  count = 0
  items: Item[] = []
  helper = new Helper()  // 非 observable

  constructor() {
    makeAutoObservable(this, {
      items: observable.shallow,    // overrides
      helper: false,                 // 不要 observable
    }, {
      autoBind: true,                // 所有 action / flow 默认 bound
    })
  }

  increment() { this.count++ }
  get doubled() { return this.count * 2 }
}
```

#### 推断规则

| 形态 | 推断 |
|---|---|
| `name = value` | `observable.deep` |
| `get x()` | `computed` |
| `set x()` | `action` |
| `method()` | `autoAction`（特殊 action） |
| `*method()` | `flow` |

#### 局限

- **不能用于有父类或子类的 class**
- **field 必须在调用前定义好**（`useDefineForClassFields: true`）

## Action API

### `action()`

#### 签名

```ts
// 1. 作为 annotation
action

// 2. 包装函数
function action<F extends (...args: any[]) => any>(fn: F): F
function action<F extends (...args: any[]) => any>(name: string, fn: F): F

// 3. action.bound（自动绑定 this）
action.bound
```

#### 用法

```ts
// 包装独立函数
const increment = action((store: Store) => {
  store.count++
})

// 命名版（DevTools 中显示）
const increment = action("incrementCounter", (store: Store) => {
  store.count++
})

// 在 makeObservable 中
makeObservable(this, {
  increment: action,         // 普通 action
  doStuff: action.bound,     // 自动 bind this
})
```

### `runInAction()`

```ts
function runInAction<T>(fn: () => T): T
```

```ts
runInAction(() => {
  store.count++
  store.total += 10
})

// 也可以有返回值
const result = runInAction(() => {
  store.count++
  return store.count
})
```

### `flow()`

```ts
function flow<R, A extends any[]>(fn: (...args: A) => Generator<any, R, any>): (...args: A) => Promise<R> & { cancel(): void }
```

```ts
class Store {
  *fetchUser(id: number) {
    const res: Response = yield fetch(`/api/users/${id}`)
    const data: User = yield res.json()
    return data
  }

  constructor() {
    makeObservable(this, {
      fetchUser: flow,
    })
  }
}

const promise = store.fetchUser(1)
promise.then(user => console.log(user))
promise.cancel() // 取消
```

### `flowResult()`

把 generator 返回类型转为 Promise（TypeScript 类型工具）：

```ts
function flowResult<T>(generator: T): Promise<UnwrapGenerator<T>>

async function load() {
  const user = await flowResult(store.fetchUser(1))
  // user 类型 = generator return type
}
```

## Computed API

### `computed()`

#### 签名

```ts
// 1. 作为 annotation
computed

// 2. computed.struct（结构比较）
computed.struct

// 3. 配置选项
function computed<T>(getter: () => T, options?: ComputedOptions<T>): IComputedValue<T>

interface ComputedOptions<T> {
  name?: string
  equals?: (a: T, b: T) => boolean
  keepAlive?: boolean
  requiresReaction?: boolean
  context?: any
}
```

#### 用法

```ts
class Store {
  width = 0
  height = 0

  constructor() {
    makeObservable(this, {
      width: observable,
      height: observable,
      area: computed,
      topRight: computed.struct,
      expensive: computed({ keepAlive: true }),
    })
  }

  get area() {
    return this.width * this.height
  }

  get topRight() {
    return { x: this.width, y: this.height }
  }

  get expensive() {
    return this.width ** this.height
  }
}
```

#### 独立 computed（box 风格）

```ts
const ageInDays = computed(() => Math.floor((Date.now() - user.birthday) / 86400000))
console.log(ageInDays.get())

// 加 observer
const dispose = autorun(() => {
  console.log(ageInDays.get())
})
```

## Reactions API

### `autorun()`

#### 签名

```ts
function autorun(
  effect: (reaction: IReactionPublic) => void,
  options?: IAutorunOptions
): IReactionDisposer

interface IAutorunOptions {
  name?: string
  delay?: number               // 节流 ms
  scheduler?: (run: () => void) => void
  onError?: (error: any, reaction: IReactionPublic) => void
  requiresObservable?: boolean
  signal?: AbortSignal
}

interface IReactionPublic {
  dispose(): void
  trace(enterBreakPoint?: boolean): void
}
```

#### 用法

```ts
const dispose = autorun(() => {
  console.log(store.count)
})

// 选项
autorun(() => {
  // ...
}, {
  name: "logCount",
  delay: 300,                 // 节流 300ms
  onError: (err) => console.error(err),
})

// 用 AbortController disposer
const ac = new AbortController()
autorun(() => { /* ... */ }, { signal: ac.signal })
ac.abort() // dispose
```

### `reaction()`

#### 签名

```ts
function reaction<T, FireImmediately extends boolean = false>(
  expression: (reaction: IReactionPublic) => T,
  effect: (value: T, previousValue: T extends Primitive ? T : T | undefined, reaction: IReactionPublic) => void,
  options?: IReactionOptions<T, FireImmediately>
): IReactionDisposer

interface IReactionOptions<T, FireImmediately> {
  name?: string
  fireImmediately?: FireImmediately
  delay?: number
  equals?: (a: T, b: T) => boolean
  scheduler?: (run: () => void) => void
  onError?: (error: any, reaction: IReactionPublic) => void
  requiresObservable?: boolean
  signal?: AbortSignal
}
```

#### 用法

```ts
// 监听 count 变化
const dispose = reaction(
  () => store.count,
  (count, prevCount) => {
    console.log(`Count changed: ${prevCount} → ${count}`)
  },
)

// 选项
reaction(
  () => store.user,
  (user) => {
    if (user) loadProfile(user.id)
  },
  {
    fireImmediately: true,
    delay: 500,
    equals: (a, b) => a?.id === b?.id,
  },
)
```

### `when()`

#### 签名

```ts
// 1. callback 形式
function when(
  predicate: () => boolean,
  effect: () => void,
  options?: IWhenOptions
): IReactionDisposer

// 2. Promise 形式（不传 effect）
function when(
  predicate: () => boolean,
  options?: IWhenOptions
): Promise<void> & { cancel(): void }

interface IWhenOptions {
  name?: string
  timeout?: number       // ms，超时 reject
  onError?: (error: any) => void
  signal?: AbortSignal
}
```

#### 用法

```ts
// 回调形式
when(
  () => store.user?.authenticated === true,
  () => {
    console.log("User authenticated!")
  },
)

// Promise 形式
async function init() {
  await when(() => store.ready === true)
  console.log("Continuing...")
}

// 带 timeout
when(
  () => store.ready,
  { timeout: 5000, onError: (err) => console.error("Timeout!") },
)

// Promise + cancel
const p = when(() => store.x === 10)
p.cancel() // 取消等待
```

## 低层 Observe / Intercept API

> ⚠️ **不推荐**——这些是低层 API、官方建议优先用 `reaction`。

### `observe()`

监听 observable 变化（变化**之后**触发）：

```ts
function observe<T>(
  target: IObservable,
  listener: (change: IObjectChange | IArrayChange | IMapChange | ...) => void,
  fireImmediately?: boolean
): Lambda

function observe<T>(
  target: object,
  propertyName: string,
  listener: ...,
  fireImmediately?: boolean
): Lambda
```

```ts
const dispose = observe(store, "count", change => {
  console.log(`Changed ${change.oldValue} → ${change.newValue}`)
})

// 数组
observe(observableArray, change => {
  // change.type: "splice" | "update"
  // change.added / change.removed / change.index
})
```

### `intercept()`

拦截 observable 变化（变化**之前**触发、可修改 / 取消）：

```ts
function intercept<T>(
  target: IObservable,
  interceptor: (change: IObjectWillChange | ...) => null | IObjectWillChange
): Lambda
```

```ts
intercept(theme, "color", change => {
  if (change.newValue?.length === 6) {
    change.newValue = "#" + change.newValue  // 修改
    return change
  }
  if (!change.newValue) {
    return null  // 取消
  }
  throw new Error("Invalid color")  // 抛错
})
```

### `onBecomeObserved()` / `onBecomeUnobserved()`

```ts
function onBecomeObserved(
  target: IObservable,
  callback: () => void
): Lambda

function onBecomeObserved(
  target: object,
  property: string,
  callback: () => void
): Lambda

function onBecomeUnobserved(...same shape): Lambda
```

懒加载场景：

```ts
class Clock {
  time = new Date()
  timer?: number

  constructor() {
    makeAutoObservable(this)

    // 仅在被观察时启动
    onBecomeObserved(this, "time", () => this.start())
    onBecomeUnobserved(this, "time", () => this.stop())
  }

  start() {
    this.timer = setInterval(() => {
      runInAction(() => {
        this.time = new Date()
      })
    }, 1000) as any
  }

  stop() {
    clearInterval(this.timer)
  }
}
```

## 工具函数

### `untracked()`

在 reaction / observer 中读 observable 但**不建立依赖**：

```ts
function untracked<T>(action: () => T): T
```

```ts
autorun(() => {
  // 只追踪 store.count，不追踪 store.timestamp
  const c = store.count
  const t = untracked(() => store.timestamp)
  console.log(`Count: ${c} at ${t}`)
})
```

### `transaction()`

```ts
function transaction<T>(action: () => T): T
```

> **不推荐手动调用**——action 已经自动 batch。

### `toJS()`

把 observable 递归转换为普通 JS 对象：

```ts
function toJS<T>(source: T, options?: ToJSOptions): T

interface ToJSOptions {
  exportMapsAsObjects?: boolean // 默认 true
  recurseEverything?: boolean    // 默认 false
}
```

```ts
const store = observable({ count: 0, items: [1, 2] })
const plain = toJS(store)
// plain = { count: 0, items: [1, 2] } （普通 JS 对象）
```

> **注意**：`toJS` **不包含** `computed`（getter）—— 因为它们是 derived。

### `configure()`

```ts
function configure(options: IConfigureOptions): void

interface IConfigureOptions {
  enforceActions?: "never" | "observed" | "always"
  computedRequiresReaction?: boolean
  reactionRequiresObservable?: boolean
  observableRequiresReaction?: boolean
  useProxies?: "always" | "never" | "ifavailable"
  isolateGlobalState?: boolean
  reactionScheduler?: (run: () => void) => void
  disableErrorBoundaries?: boolean
  safeDescriptors?: boolean // 默认 true
}
```

```ts
configure({
  enforceActions: "always",
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
})
```

### `set()` / `remove()` / `has()` / `get()` / `values()` / `keys()` / `entries()`

针对 observable Map / Object / Array 的辅助工具——支持响应式动态属性：

```ts
import { set, remove, has, get, values, keys } from "mobx"

const obj = observable.object({}, {}, { proxy: false })

set(obj, "x", 10)           // 添加属性（响应式）
set(obj, { y: 20, z: 30 })  // 批量
has(obj, "x")               // true
get(obj, "x")               // 10
remove(obj, "x")
values(obj)                  // [20, 30]
keys(obj)                    // ["y", "z"]
entries(obj)                 // [["y", 20], ["z", 30]]
```

> **何时用**？在 `useProxies: "never"` 模式或处理动态键场景。Proxy 模式下普通 `obj.x = 10` 已经响应式。

## 类型检查 API

### `isObservable*` 系列

```ts
function isObservable(target: any): boolean
function isObservableProp(target: any, property: string): boolean
function isObservableObject(target: any): boolean
function isObservableArray(target: any): boolean
function isObservableMap(target: any): boolean
function isObservableSet(target: any): boolean
function isBoxedObservable(target: any): boolean
function isComputed(target: any): boolean
function isComputedProp(target: any, property: string): boolean
function isAction(target: any): boolean
function isFlow(target: any): boolean
```

```ts
isObservable(store)              // true
isObservableProp(store, "count") // true
isComputedProp(store, "doubled") // true
isAction(store.increment)        // true
```

## 调试 API

### `trace()`

```ts
function trace(enterBreakPoint?: boolean): void
function trace(target: object, property?: string, enterBreakPoint?: boolean): void
```

```ts
// 在 observer / autorun / reaction 中
trace()           // 打印重新计算原因
trace(true)       // 进入 debugger

// 针对特定 computed
trace(store, "doubled")
```

### `spy()`

```ts
function spy(listener: (event: SpyEvent) => void): Lambda

type SpyEvent =
  | { type: "action"; name: string; arguments: any[]; ... }
  | { type: "update"; observableKind: ...; ... }
  | { type: "compute"; name: string; ... }
  | { type: "scheduled-reaction"; ... }
  | { type: "reaction"; ... }
```

```ts
const dispose = spy(event => {
  if (event.type === "action") {
    console.log("Action:", event.name)
  }
})
```

### `getDependencyTree()` / `getObserverTree()`

```ts
function getDependencyTree(target: object, property?: string): IDependencyTree
function getObserverTree(target: object, property?: string): IObserverTree

interface IDependencyTree {
  name: string
  dependencies?: IDependencyTree[]
}

interface IObserverTree {
  name: string
  observers?: IObserverTree[]
}
```

### `getDebugName()` / `getAtom()`

```ts
function getDebugName(target: object, property?: string): string
function getAtom(target: object, property?: string): IAtom
```

## 自定义 Observable

### `createAtom()`

创建自定义响应式数据源：

```ts
function createAtom(
  name: string,
  onBecomeObservedHandler?: () => void,
  onBecomeUnobservedHandler?: () => void
): IAtom

interface IAtom {
  reportObserved(): boolean   // 通知 MobX 「我被读了」
  reportChanged(): void        // 通知 MobX 「我变了」
}
```

#### Clock 示例

```ts
import { createAtom } from "mobx"

class Clock {
  atom: IAtom
  currentDate = new Date()
  timer?: number

  constructor() {
    this.atom = createAtom(
      "Clock",
      () => this.startTicking(),
      () => this.stopTicking(),
    )
  }

  getTime() {
    if (this.atom.reportObserved()) {
      return this.currentDate
    } else {
      return new Date()
    }
  }

  startTicking() {
    this.timer = setInterval(() => this.tick(), 1000) as any
  }

  stopTicking() {
    clearInterval(this.timer)
  }

  tick() {
    this.currentDate = new Date()
    this.atom.reportChanged()
  }
}

// 用法
const clock = new Clock()
autorun(() => {
  console.log(clock.getTime())
})
```

## mobx-react-lite API

### `observer()`

```ts
function observer<P>(component: FunctionComponent<P>): FunctionComponent<P>
function observer<P, T>(component: ForwardRefRenderFunction<T, P>): ForwardRefExoticComponent<...>
```

#### 用法

```tsx
// 函数组件
const Counter = observer(function Counter({ store }: Props) {
  return <p>{store.count}</p>
})

// forwardRef
import { forwardRef } from "react"
const Input = observer(forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} value={props.value} />
}))

// 泛型
function ListView<T>({ store }: { store: ListStore<T> }) { /* ... */ }
const ObservedListView = observer(ListView) as typeof ListView
```

### `<Observer>` 组件

```tsx
interface ObserverProps {
  children?: () => ReactNode
  render?: () => ReactNode
}

const Component = <Observer>{() => <p>{store.count}</p>}</Observer>
```

### `useLocalObservable()`

```ts
function useLocalObservable<T>(
  initializer: () => T,
  annotations?: AnnotationsMap<T>
): T
```

```tsx
const timer = useLocalObservable(() => ({
  seconds: 0,
  increment() {
    this.seconds++
  },
  get doubled() {
    return this.seconds * 2
  },
}))
```

### `enableStaticRendering()`

```ts
function enableStaticRendering(enable: boolean): void
```

```ts
// 仅在 SSR server 进程
enableStaticRendering(true)
```

## mobx-react（含 class 支持）

### `<Provider>` 与 `inject()`（老 API、不推荐新项目）

```tsx
import { Provider, inject, observer } from "mobx-react"

const stores = { userStore: new UserStore() }

const App = () => (
  <Provider {...stores}>
    <Child />
  </Provider>
)

const Child = inject("userStore")(
  observer(({ userStore }: { userStore?: UserStore }) => (
    <p>{userStore!.user?.name}</p>
  ))
)
```

> **新项目**：用 React Context + hooks 替代 Provider + inject。

## TypeScript 类型

### `IObservableValue`

```ts
interface IObservableValue<T> {
  get(): T
  set(value: T): void
}

const v: IObservableValue<number> = observable.box(0)
```

### `IObservableArray`

```ts
interface IObservableArray<T> extends Array<T> {
  observe(listener: ...): Lambda
  intercept(handler: ...): Lambda
  clear(): T[]
  replace(newItems: T[]): T[]
  remove(value: T): boolean
  toJSON(): T[]
}
```

### `ObservableMap` / `ObservableSet`

```ts
class ObservableMap<K, V> extends Map<K, V> {
  replace(values: Iterable<[K, V]>): this
  merge(values: Iterable<[K, V]> | object): this
  toJSON(): [K, V][]
}

class ObservableSet<T> extends Set<T> {
  replace(values: Iterable<T>): this
  toJSON(): T[]
}
```

### `IReactionDisposer`

```ts
interface IReactionDisposer {
  (): void                                      // 调用以 dispose
  $mobx: IReactionPublic
}

const dispose: IReactionDisposer = autorun(() => { /* ... */ })
dispose()
```

### `Lambda`

```ts
type Lambda = () => void
```

### `Annotation`

```ts
interface Annotation {
  annotationType_: string
  options_?: any
  make_(adm: any, key: PropertyKey, descriptor: PropertyDescriptor, source: object): MakeResult
  extend_(adm: any, key: PropertyKey, descriptor: PropertyDescriptor, proxyTrap: boolean): boolean | null
}
```

通常你不需要直接用 `Annotation`——它是内部类型。

### `AnnotationsMap`

```ts
type AnnotationsMap<T> = {
  [P in keyof T]?: Annotation | false
}

// 用于 makeObservable
makeObservable(this, {
  count: observable,        // Annotation
  helper: false,            // 不要 observable
})
```

## mobx-utils API（选）

### `computedFn()`

参数化 memoized computed：

```ts
import { computedFn } from "mobx-utils"

class Store {
  items: Item[] = []

  isSelected = computedFn((id: number): boolean => {
    return this.items.some(i => i.id === id && i.selected)
  })
}
```

### `fromPromise()`

把 Promise 包装为 observable（带 `state` / `value` / `reason` 字段）：

```ts
import { fromPromise } from "mobx-utils"

const userPromise = fromPromise(fetch("/api/user").then(r => r.json()))

autorun(() => {
  switch (userPromise.state) {
    case "pending":
      console.log("Loading...")
      break
    case "fulfilled":
      console.log("User:", userPromise.value)
      break
    case "rejected":
      console.log("Error:", userPromise.reason)
      break
  }
})
```

### `deepObserve()`

递归观察整个对象树：

```ts
import { deepObserve } from "mobx-utils"

const dispose = deepObserve(store, (change, path) => {
  console.log(`Change at ${path}:`, change)
})
```

### `createViewModel()`

创建可编辑的临时副本（form 编辑场景）：

```ts
import { createViewModel } from "mobx-utils"

const userVM = createViewModel(user)
userVM.name = "Edited"      // 不影响原 user
userVM.isDirty               // true
userVM.submit()              // 提交到原对象
userVM.reset()               // 重置
```

## v5 → v6 迁移 Checklist

### 1. 装饰器配置

```diff
- experimentalDecorators: true
+ experimentalDecorators: false  # 改用 makeObservable 或 stage-3 装饰器

+ useDefineForClassFields: true   # 必须设
```

### 2. `makeObservable` 必须调用

```diff
  class Store {
    @observable count = 0

+   constructor() {
+     makeObservable(this) // 必须调用
+   }
  }
```

或完全去装饰器：

```diff
  class Store {
-   @observable count = 0
+   count = 0

    constructor() {
-     // empty
+     makeAutoObservable(this)
    }

-   @action
    increment() {
      this.count++
    }
  }
```

### 3. `enforceActions` 默认变严

```diff
+ configure({
+   enforceActions: "observed",  // 6.x 默认
+ })

// 临时降低严格度：
+ configure({ enforceActions: "never" })
```

### 4. Proxy 要求

```diff
+ configure({ useProxies: "always" })  // 默认

// IE11 等环境：
+ configure({ useProxies: "never" })
```

### 5. 自动化迁移：`mobx-undecorate`

```bash
npx mobx-undecorate                    # 完全去装饰器
npx mobx-undecorate --keepDecorators   # 保留装饰器、加 makeObservable
```

### 6. `mobx-react` → `mobx-react-lite`（函数组件项目）

```diff
- import { observer, Provider } from "mobx-react"
+ import { observer } from "mobx-react-lite"

// Provider / inject 老 API 不在 lite 中 —— 改用 React Context
```

### 7. 移除的 API

| MobX 5 | MobX 6 |
|---|---|
| `decorate(Store, { ... })` | `makeObservable(this, { ... })` 在 constructor 中 |
| `extendObservable(target, props)` | `makeAutoObservable` 或 `observable(props)` |
| `observable(value, "name")` | `observable(value, {}, { name: "..." })` |
| `useObserver(() => ...)` | `<Observer>{() => ...}</Observer>` |
| `Provider` + `inject` | React Context + hooks |

## Import 来源速查

| API | 来源 |
|---|---|
| `observable` / `makeObservable` / `makeAutoObservable` | `mobx` |
| `action` / `runInAction` / `flow` / `flowResult` | `mobx` |
| `computed` | `mobx` |
| `autorun` / `reaction` / `when` | `mobx` |
| `observe` / `intercept` / `untracked` / `transaction` | `mobx` |
| `configure` / `toJS` | `mobx` |
| `isObservable*` / `isComputed*` / `isAction` / `isFlow` | `mobx` |
| `trace` / `spy` / `getDependencyTree` / `getObserverTree` / `getDebugName` / `getAtom` | `mobx` |
| `createAtom` | `mobx` |
| `set` / `remove` / `has` / `get` / `values` / `keys` / `entries` | `mobx` |
| `observer` / `<Observer>` / `useLocalObservable` / `enableStaticRendering` | `mobx-react-lite` |
| `Provider` / `inject` （含上面所有） | `mobx-react`（含 class 支持） |
| `computedFn` / `fromPromise` / `deepObserve` / `createViewModel` | `mobx-utils` |
| `types` / `flow`（MST 版本） / `getSnapshot` / `applySnapshot` / `onPatch` | `mobx-state-tree` |

## 配置选项速查表

### `CreateObservableOptions`

```ts
{
  name?: string         // DevTools 名
  deep?: boolean        // 默认 true（递归 deep）
  defaultDecorator?: Annotation
  proxy?: boolean       // 默认 true
  autoBind?: boolean    // action / flow 默认 bound
}
```

### `IConfigureOptions`（全局）

```ts
{
  enforceActions?: "never" | "observed" | "always"
  computedRequiresReaction?: boolean
  reactionRequiresObservable?: boolean
  observableRequiresReaction?: boolean
  useProxies?: "always" | "never" | "ifavailable"
  isolateGlobalState?: boolean
  reactionScheduler?: (run: () => void) => void
  disableErrorBoundaries?: boolean
  safeDescriptors?: boolean
}
```

### `IReactionOptions`

```ts
{
  name?: string
  fireImmediately?: boolean
  delay?: number
  equals?: (a, b) => boolean
  scheduler?: (run: () => void) => void
  onError?: (err, reaction) => void
  requiresObservable?: boolean
  signal?: AbortSignal
}
```

### `IAutorunOptions`

```ts
{
  name?: string
  delay?: number
  scheduler?: (run: () => void) => void
  onError?: (err, reaction) => void
  requiresObservable?: boolean
  signal?: AbortSignal
}
```

### `IWhenOptions`

```ts
{
  name?: string
  timeout?: number      // ms（超时 reject Promise）
  onError?: (err) => void
  signal?: AbortSignal
}
```

### `ComputedOptions`

```ts
{
  name?: string
  equals?: (a, b) => boolean
  keepAlive?: boolean
  requiresReaction?: boolean
  context?: any
}
```

## ESLint 集成

```bash
pnpm add -D eslint-plugin-mobx
```

```jsonc
// .eslintrc
{
  "plugins": ["mobx"],
  "rules": {
    "mobx/exhaustive-make-observable": "error",  // makeObservable 漏字段警告
    "mobx/missing-make-observable": "error",     // 装饰器但忘 makeObservable
    "mobx/missing-observer": "error",            // 读 observable 但没 observer
    "mobx/no-anonymous-observer": "warn",        // 匿名 observer（影响 DevTools）
    "mobx/unconditional-make-observable": "error" // makeObservable 必须无条件调用
  }
}
```

## 完整 Annotation 列表

| Annotation | 用途 |
|---|---|
| `observable` / `observable.deep` | 可追踪字段（默认 deep） |
| `observable.ref` | 仅追踪引用变化 |
| `observable.shallow` | 浅 observable（集合本身、内容不递归） |
| `observable.struct` | 结构相等时忽略赋值 |
| `observable.box` | 包装 primitive（很少用注解形式） |
| `action` | state-modifying 方法 |
| `action.bound` | action + 自动 bind this |
| `computed` | getter 缓存派生 |
| `computed.struct` | computed + 结构比较跳过通知 |
| `flow` | generator 异步流程 |
| `flow.bound` | flow + 自动 bind this |
| `override` | 子类重写父类的 action / computed / flow |
| `false` | 该字段**不**变成 observable（在 `makeAutoObservable` 中 override） |
| `true` | 该字段保留默认 annotation（在 `makeAutoObservable` 中无效） |

## 参考链接

- [MobX 6 完整文档](https://mobx.js.org/)
- [API Reference](https://mobx.js.org/api.html)
- [Migrating from MobX 4/5](https://mobx.js.org/migrating-from-4-or-5.html)
- [Enabling decorators](https://mobx.js.org/enabling-decorators.html)
- [mobx-state-tree 文档](https://mobx-state-tree.js.org/)
- [mobx-utils GitHub](https://github.com/mobxjs/mobx-utils)
- [eslint-plugin-mobx](https://github.com/mobxjs/mobx/tree/main/packages/eslint-plugin-mobx)