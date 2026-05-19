---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Pinia 3.x**（最新 **v3.0+**，2025-03 发布；要求 **Vue 3 + TypeScript 5+**，Vue 2 用户请继续使用 Pinia v2）编写。

## 速查

- 系统要求：**Vue 3.x**（推荐 3.4+） + **TypeScript 5+**（可选但强烈推荐）+ Node 18+
- 安装：`pnpm add pinia` / `npm install pinia` / `yarn add pinia`
- Nuxt 安装：`npx nuxi@latest module add pinia`（自动装 `@pinia/nuxt` + `pinia`）
- 注册：`createPinia()` + `app.use(pinia)`（main.ts 中）
- 定义 store：`export const useXxxStore = defineStore('xxx', { state, getters, actions })` 或 `defineStore('xxx', () => { /* setup */ })`
- store id 命名：`'cart'` / `'authUser'`（kebab-case 或 camelCase 均可）
- composable 命名：必须 `useXxxStore`（约定俗成）
- 组件中使用：`const store = useXxxStore()`（**必须在 setup / `<script setup>` 内调用**）
- 解构响应式：`const { count, name } = storeToRefs(store)`（state / getters）+ `const { increment } = store`（actions 可直接 destructure）
- 直接 mutate：`store.count++`（Pinia 没有 mutation）
- 批量 mutate：`store.$patch({ count: 1, name: 'x' })`（对象）/ `store.$patch(state => { state.list.push(...) })`（函数）
- 重置 state：`store.$reset()`（Option Store 自带；Setup Store 需手写）
- 订阅：`store.$subscribe((mutation, state) => ...)` / `store.$onAction(({ name, args, after, onError }) => ...)`
- HMR：`if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useXxxStore, import.meta.hot))`

## Pinia 是什么

Pinia 是 **Vue 官方御用状态管理库**——准确地说，它是 **Vue 团队成员 Eduardo San Martin Morote**（同时也是 vue-router 的作者）在 2019 年 11 月发起的「Vuex 5 重构实验」，后来被 Vue 核心团队认可、纳入官方生态，最终**取代 Vuex**：

- **Vue 官网 [State Management](https://vuejs.org/guide/scaling-up/state-management.html#pinia)** 章节明确推荐 Pinia
- **Vuex 4 的 README 第一行**写着「Pinia is the new default」
- **Pinia 3.x（2025）** 已**不再支持 Vue 2**，全面拥抱 Vue 3 + Composition API + TypeScript 5

> Pinia 名字来源：西班牙语「松果」（**piña** 的法语化拼写），与 「**pina<u>p</u>p<u>l</u>e**」（去掉两个字母）押韵——这是 Eduardo 写的一个有趣的命名梗。

## Pinia 是「Vuex 的精神继承者」不是「另一个 Redux」

理解 Pinia 必须先理解它**和 Vuex 的关系**——它**不是**「重新发明的 Flux」「mobx 风格的响应式 store」「Vue 版 Zustand」——它是**Vuex 沿着 Composition API 进化的最终形态**：

| 维度 | Pinia 3.x | Vuex 4.x | Zustand (React) | Redux Toolkit | MobX |
|---|---|---|---|---|---|
| 阵营 | **Vue 官方** | Vue 官方（停维护） | React 社区 | React 官方 | 跨框架 |
| 语法 | **Option + Setup 双模** | Options 单模 | Hook + create | Slice + RTK Query | observable / class |
| Mutation | **无**（直接 mutate / `$patch`） | 必须用 commit | 直接 set | createSlice reducer | 直接赋值 |
| 模块化 | **每 store 独立**（无 namespacing） | modules + namespacing | 每 hook 独立 | slice + combineReducer | class 实例 |
| TypeScript | **完美推导**（无样板） | 需手写 InjectionKey | 优秀 | 优秀（RTK 推导） | 装饰器 / class |
| Bundle 大小 | **~1.5KB** | ~3-4KB | ~1KB | ~10KB（含 RTK Query） | ~16KB |
| SSR | 内置（Nuxt 集成） | 支持但麻烦 | 不支持 | RTK SSR 麻烦 | 不支持 |
| DevTools | Vue DevTools 7 | Vue DevTools | Redux DevTools | Redux DevTools | MobX DevTools |
| HMR | 一等支持 | 一等支持 | 不支持 | 不支持 | 不支持 |
| 学习曲线 | **平**（Composable 风格） | 中（Flux + namespacing） | 极平 | 陡（学 thunk + RTK） | 平（响应式简单） |
| 心智模型 | **响应式 + 异步 action** | Flux（state/mutation/action） | hook 即状态 | 严格单向数据流 | 响应式代理 |

**含义**：

- Pinia 解决的是「**Vuex 4 的样板代码 + 类型推导不友好 + namespacing 心智负担**」三大痛点
- 与 React Zustand 的对比：Zustand 是「单 hook 即 store」（更轻量但无 DevTools 时间旅行）；Pinia 强调「**多 store + 跨 store 引用 + DevTools 完美集成**」
- 与 Redux Toolkit 对比：RTK 强调「严格单向数据流」+ `createSlice` 自动生成 action；Pinia 强调「直接 mutate / 异步 action 自由组合」——心智更轻、更 Vue 风格
- **不适合**：跨框架共享状态（Pinia 是 Vue 专属）、需要严格事件溯源审计（Pinia 直接 mutate 不像 Redux 时间旅行那样严格）
- **适合**：99% 的 Vue 3 项目——这不是吹捧、是 Vue 官方推荐的**默认选择**

## 安装与首次启动

### 创建 Vue 3 项目

如果你**还没有 Vue 3 项目**，先创建一个：

```bash
pnpm create vue@latest
# 或：npm create vue@latest / yarn create vue / bun create vue@latest
```

交互式菜单选 **TypeScript: Yes**（强烈推荐）+ **Pinia: Yes**（直接勾选会自动配好）：

```
✔ Add TypeScript? … Yes
✔ Add Pinia for state management? … Yes
```

完成后你的 `package.json` 已包含 `pinia` 依赖、`main.ts` 已自动注册——可以**直接跳到「第一个 Store」**。

### 在已有项目中安装

如果项目已存在、只需添加 Pinia：

```bash
pnpm add pinia
# 或：npm install pinia / yarn add pinia / bun add pinia
```

Vue 版本要求：

| Vue 版本 | Pinia 版本 |
|---|---|
| **Vue 3.x** | **Pinia v3**（推荐） |
| Vue 2.7+ | Pinia v2 |
| Vue 2.x (< 2.7) | Pinia v2 + `@vue/composition-api` |

> Pinia v3 已**正式 drop Vue 2 支持**——如果还在维护 Vue 2 项目，请继续使用 Pinia v2.x（仅 bug 修复，不再新增特性）。

### 在 main.ts / main.js 中注册

`createPinia()` 创建实例 + `app.use(pinia)` 注册为 Vue 插件：

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
```

**注意顺序**：`app.use(pinia)` **必须在 `app.mount()` 之前调用**——否则组件中 `useXxxStore()` 会报「no active pinia」错误。

### Nuxt 项目

Nuxt 项目用 `@pinia/nuxt` 模块（**不要直接装 pinia**）：

```bash
npx nuxi@latest module add pinia
```

这会自动：
- 安装 `@pinia/nuxt` + `pinia`
- 在 `nuxt.config.ts` 的 `modules` 数组里添加 `'@pinia/nuxt'`
- 自动 import `defineStore` / `useNuxtApp` / `storeToRefs` / `acceptHMRUpdate`
- 自动扫描 `stores/` 目录下的所有 store 文件（**不嵌套递归扫描**，只扫第一层）

`nuxt.config.ts` 示例：

```ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  pinia: {
    // 自定义 stores 扫描目录（默认 './stores'）
    storesDirs: ['./stores/**', './custom-folder/stores/**'],
  },
})
```

详细 SSR / Nuxt 集成见 [指南 > SSR 与 Nuxt](./guide-line.md#ssr-与-nuxt-集成)。

## 第一个 Store

Pinia 提供**两种语法**定义 store（**两种语法生成的 store 用法完全一致**）：

### Option Store（Vuex / Options API 风格）

`{ state, getters, actions }` 三件套——**Vuex 用户零迁移成本**：

```ts
// src/stores/counter.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // state：必须是 arrow function 返回初始对象（SSR 必要）
  state: () => ({
    count: 0,
    name: 'Eduardo',
  }),

  // getters：等价于 Vue computed
  getters: {
    doubleCount: (state) => state.count * 2,
    // 访问其他 getter 用 this（必须是常规函数 + 返回类型注解）
    doubleCountPlusOne(): number {
      return this.doubleCount + 1
    },
  },

  // actions：等价于 Vue methods（this 自动指向 store 实例）
  actions: {
    increment() {
      this.count++
    },
    setName(name: string) {
      this.name = name
    },
  },
})
```

### Setup Store（Composition API 风格）

`ref()` / `computed()` / `function` 直接对应 state / getters / actions——**`<script setup>` 用户更自然**：

```ts
// src/stores/counter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // ref() → state
  const count = ref(0)
  const name = ref('Eduardo')

  // computed() → getters
  const doubleCount = computed(() => count.value * 2)
  const doubleCountPlusOne = computed(() => doubleCount.value + 1)

  // function → actions
  function increment() {
    count.value++
  }
  function setName(newName: string) {
    name.value = newName
  }

  // 必须 return 所有需要暴露的字段（return 的对象 = store 实例）
  return { count, name, doubleCount, doubleCountPlusOne, increment, setName }
})
```

### 两种语法对照速查

| 概念 | Option Store | Setup Store |
|---|---|---|
| state | `state: () => ({ ... })` | `const x = ref(0)` |
| getter | `getters: { x: (state) => ... }` | `const x = computed(() => ...)` |
| action | `actions: { x() { this... } }` | `function x() { ... }` |
| this | 自动指向 store | 不存在 this（用闭包） |
| `$reset` | **自动生成** | **必须手写并 return** |
| TS 推导 | state 字段需手动标注 `as` / interface | ref 字段自动推导（更友好） |
| SSR | 简单 | 略复杂（`skipHydrate`） |

**实际项目中如何选**？

- **简单 CRUD + Vuex 迁移**：用 Option Store（结构清晰、`$reset` 自动）
- **需要使用 composable / watch / useLocalStorage**：用 Setup Store（只能在 Setup 内使用 Composition API）
- **混用**：完全允许，同一项目可以两种 store 共存

### Store id 命名约定

第一个参数是 **store id**（必须全局唯一）：

```ts
// 推荐：camelCase（与 useXxxStore 函数名一致）
defineStore('counter', ...)
defineStore('authUser', ...)
defineStore('shoppingCart', ...)

// 也可：kebab-case
defineStore('auth-user', ...)

// 不推荐：包含路径/命名空间（Vuex 风格）
defineStore('auth/user', ...) // ❌ 不要这样写——Pinia 没有 namespacing
```

返回的函数**必须**以 `useXxxStore` 命名（约定俗成，便于识别）：

```ts
export const useCounterStore = defineStore('counter', ...) // ✅
export const counterStore = defineStore('counter', ...)    // ❌ 缺少 use
export const useCounter = defineStore('counter', ...)      // ⚠️ 缺少 Store 后缀（也勉强可用）
```

## 在组件中使用 Store

### `<script setup>` 风格（强烈推荐）

```vue
<!-- src/components/Counter.vue -->
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()

// 直接读取 state / getter
console.log(counter.count)        // 0
console.log(counter.doubleCount)  // 0

// 直接 mutate state（Pinia 没有 mutation 概念）
counter.count++

// 调用 action
counter.increment()
counter.setName('Vue')
</script>

<template>
  <div>
    <p>Count: <span v-pre>{{ counter.count }}</span></p>
    <p>Double: <span v-pre>{{ counter.doubleCount }}</span></p>
    <button @click="counter.increment()">+1</button>
  </div>
</template>
```

> **Vue 模板 `{{ }}` 在内联反引号中需用 `<span v-pre>`** 包裹，否则会被 Vue 编译器解析——VitePress 笔记中尤其注意。

### 解构 store（`storeToRefs`）

**直接 destructure 会丢失响应式**：

```ts
const counter = useCounterStore()

// ❌ 错误：count 是 plain number，不会响应 store 变化
const { count, name } = counter
counter.count++   // count 变量不会更新

// ❌ 错误：模板中 {{ count }} 也不会响应
```

**正确做法**：用 `storeToRefs` 把 state / getter 转成 `ref`（actions 不需要 ref、可直接 destructure）：

```ts
import { storeToRefs } from 'pinia'

const counter = useCounterStore()

// ✅ state / getters：用 storeToRefs 保留响应式
const { count, name, doubleCount } = storeToRefs(counter)

// ✅ actions：直接 destructure（action 自动 bind 到 store）
const { increment, setName } = counter

// 现在可以直接用：
counter.increment()      // store.action()
increment()              // 解构的 action（已 bind）
count.value++           // 直接 mutate（注意是 .value）
```

模板中 `storeToRefs` 解构的字段**自动解包**（不需要 `.value`）：

```vue
<script setup>
const counter = useCounterStore()
const { count, doubleCount } = storeToRefs(counter)
const { increment } = counter
</script>

<template>
  <p>Count: <span v-pre>{{ count }}</span></p>          <!-- 自动解包 -->
  <p>Double: <span v-pre>{{ doubleCount }}</span></p>
  <button @click="increment">+1</button>
</template>
```

### `useStore()` 必须在 setup 内调用

`useXxxStore()` **必须在 `setup()` / `<script setup>` 顶层、或 router beforeEach 内、或其他 setup-like 上下文调用**——不能在模块顶层调用：

```ts
// ❌ 错误：模块顶层调用——此时 pinia 还没注册到 app
const store = useCounterStore()  // 报错：no active pinia

export function someFunc() {
  store.count++
}

// ✅ 正确：在函数 / setup 内调用
export function someFunc() {
  const store = useCounterStore()  // 此时 pinia 已就绪
  store.count++
}
```

**例外**：在 main.ts 中**手动传入 pinia 实例**也可以：

```ts
// src/main.ts
import { createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const pinia = createPinia()
app.use(pinia)

// 手动传 pinia——可以在 setup 之外调用
const counter = useCounterStore(pinia)
counter.increment()

app.mount('#app')
```

## 直接 Mutate State

**Pinia 没有 mutation 概念**——可以直接 mutate state（或者用 action 封装变更，看你的项目规范）：

```ts
const counter = useCounterStore()

// 方法 1：直接 mutate（最简单）
counter.count++
counter.name = 'Vue'

// 方法 2：通过 action（推荐大型项目，便于追溯）
counter.increment()
counter.setName('Vue')
```

> **何时直接 mutate / 何时用 action**？
>
> - **简单赋值（count++ / setName）**：直接 mutate 更简洁
> - **业务逻辑 / 异步操作 / 跨字段变更**：必须用 action（统一管理副作用）
> - **大型项目**：建议**所有变更都走 action**——便于 `$onAction` 订阅、日志、回滚

### `$patch` 批量更新

`$patch` 用于**多字段同时更新**（一次响应式触发，性能更优）：

#### 对象形式（适合简单赋值）

```ts
const counter = useCounterStore()

// ❌ 三次响应式触发
counter.count = 1
counter.name = 'Vue'
counter.age = 30

// ✅ 一次响应式触发
counter.$patch({
  count: 1,
  name: 'Vue',
  age: 30,
})
```

#### 函数形式（适合数组 / Map / Set / 复杂变更）

```ts
const cart = useCartStore()

// ❌ 对象形式无法表达「向数组 push」
// ✅ 函数形式：直接在 state 上操作
cart.$patch((state) => {
  state.items.push({ name: 'shoes', quantity: 1 })
  state.hasChanged = true
  state.lastUpdate = Date.now()
})
```

## 重置 State

### Option Store：自动 `$reset()`

Option Store **自动生成 `$reset()`** 方法（基于 `state()` 函数重新执行返回初始值）：

```ts
const counter = useCounterStore()
counter.count = 99
counter.name = 'Modified'

counter.$reset()  // 一键恢复到 state() 返回的初始值
console.log(counter.count) // 0
console.log(counter.name)  // 'Eduardo'
```

### Setup Store：必须手写

Setup Store **没有自动 `$reset`**（因为 Setup 函数只执行一次、Pinia 没法自动重新执行）——必须手动写并 return：

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const name = ref('Eduardo')

  function increment() {
    count.value++
  }

  // 手写 $reset
  function $reset() {
    count.value = 0
    name.value = 'Eduardo'
  }

  return { count, name, increment, $reset }
})
```

> **这是 Setup Store 最大的坑**——很多人忘记写 `$reset`、然后调用 `store.$reset()` 报「is not a function」错误。建议每个 Setup Store 都手动实现 `$reset`。

## Vue DevTools 集成

**Vue DevTools 7** 已内置 Pinia 标签页——安装 [Vue DevTools 浏览器扩展](https://devtools.vuejs.org/) 后：

1. 打开 Vue 应用 → F12 → **Vue DevTools** 标签页
2. 左侧导航有 **Pinia 树**（按 store id 列出所有已注册的 store）
3. 点击任一 store 查看：
   - **State**：所有 state 字段（实时更新）
   - **Getters**：所有 computed 值
   - **Actions**：每次 action 调用的参数 + 返回值历史
   - **History**：时间旅行——可以**回放到任意历史 state**

DevTools 功能：

| 功能 | 说明 |
|---|---|
| **State 编辑** | 直接在 DevTools 修改 state，实时反映到应用 |
| **时间旅行** | 回放 mutation 历史、对比前后 state |
| **`$patch` 标记** | DevTools 时间线区分 `direct mutation` / `patch object` / `patch function` |
| **HMR 集成** | 修改 store 文件保存后，DevTools 自动刷新树（保留当前 state） |

> **生产环境 DevTools 默认关闭**——Pinia 通过 `process.env.NODE_ENV === 'development'` 判断、生产构建自动 tree-shake DevTools 集成代码。

## TypeScript 基础

### `tsconfig.json` 必备配置

确保 `tsconfig.json` 启用以下选项（影响 Pinia 类型推导）：

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "Bundler"
  }
}
```

> **必须** `strict: true` 或至少 `noImplicitThis: true`——否则 Option Store 的 `getters` 中 `this` 类型推导失效。

### Option Store 类型推导

Option Store 的 state / getters / actions **大多数情况自动推导**：

```ts
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,           // 自动推导为 number
    name: 'Eduardo',    // 自动推导为 string
  }),
  getters: {
    doubleCount: (state) => state.count * 2,  // 自动推导为 number
  },
  actions: {
    increment() {
      this.count++  // this 自动推导为 store 实例（含所有 state/getters/actions）
    },
  },
})

// 使用时：
const counter = useCounterStore()
counter.count       // number
counter.doubleCount // number（只读，因为是 getter）
counter.increment() // void
```

### 复杂 state 手动标注

初始 `null` / 空数组 / 联合类型等需要**手动断言**：

```ts
interface User {
  id: number
  name: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userList: [] as User[],         // 否则推导为 never[]
    currentUser: null as User | null, // 否则推导为 null
    role: 'guest' as 'guest' | 'admin' | 'user',
  }),
})
```

### Setup Store 类型推导

Setup Store **更精确**（因为基于 Vue 的 `ref` 类型推导）：

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
}

export const useUserStore = defineStore('user', () => {
  // 显式标注 ref<T>
  const userList = ref<User[]>([])
  const currentUser = ref<User | null>(null)

  const userCount = computed(() => userList.value.length)

  function addUser(user: User) {
    userList.value.push(user)
  }

  return { userList, currentUser, userCount, addUser }
})
```

### State 接口模式（Option Store 推荐）

更整洁的方式——单独定义 State 接口：

```ts
interface UserInfo {
  name: string
  age: number
}

interface State {
  userList: UserInfo[]
  user: UserInfo | null
}

export const useUserStore = defineStore('user', {
  state: (): State => ({
    userList: [],
    user: null,
  }),
})
```

## 完整示例：购物车应用

来一个综合 demo——**Setup Store 风格**的购物车：

```ts
// src/stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  // state
  const items = ref<CartItem[]>([])
  const discount = ref(0)

  // getters
  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )
  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  const total = computed(() => subtotal.value * (1 - discount.value))
  const isEmpty = computed(() => items.value.length === 0)

  // actions
  function addItem(item: Omit<CartItem, 'quantity'>) {
    const existing = items.value.find((i) => i.id === item.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...item, quantity: 1 })
    }
  }

  function removeItem(id: number) {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx > -1) items.value.splice(idx, 1)
  }

  function setQuantity(id: number, quantity: number) {
    const item = items.value.find((i) => i.id === id)
    if (item) item.quantity = quantity
  }

  async function checkout() {
    // 模拟异步 API
    const res = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items: items.value, total: total.value }),
    })
    if (res.ok) {
      $reset()
    }
  }

  function $reset() {
    items.value = []
    discount.value = 0
  }

  return {
    items,
    discount,
    itemCount,
    subtotal,
    total,
    isEmpty,
    addItem,
    removeItem,
    setQuantity,
    checkout,
    $reset,
  }
})
```

组件中使用：

```vue
<!-- src/components/CartView.vue -->
<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'

const cart = useCartStore()
const { items, itemCount, total, isEmpty } = storeToRefs(cart)
const { removeItem, checkout } = cart
</script>

<template>
  <div>
    <h2>购物车（<span v-pre>{{ itemCount }}</span> 件）</h2>
    <p v-if="isEmpty">购物车为空</p>
    <ul v-else>
      <li v-for="item in items" :key="item.id">
        <span v-pre>{{ item.name }}</span> ×
        <span v-pre>{{ item.quantity }}</span>
        — ￥<span v-pre>{{ item.price * item.quantity }}</span>
        <button @click="removeItem(item.id)">删除</button>
      </li>
    </ul>
    <p>合计：￥<span v-pre>{{ total }}</span></p>
    <button @click="checkout" :disabled="isEmpty">结算</button>
  </div>
</template>
```

## 启用 HMR

在 store 文件末尾添加 HMR 代码——**保存 store 文件后保留当前 state**：

```ts
// src/stores/counter.ts
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useCounterStore = defineStore('counter', { /* ... */ })

// HMR：仅 Vite / 支持 import.meta.hot 的 bundler
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot))
}
```

Webpack 用户使用 `import.meta.webpackHot`：

```ts
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(acceptHMRUpdate(useCounterStore, import.meta.webpackHot))
}
```

> **每个 store 文件都要加一次** `acceptHMRUpdate`——VSCode 用户可以装 [Pinia VSCode Snippets](https://marketplace.visualstudio.com/items?itemName=hyoa.pinia-snippets) 插件，输入 `pinia-options` / `pinia-setup` 自动展开包含 HMR 代码的模板。

## 下一步

至此你已掌握 Pinia 的基础——**安装** / **第一个 store** / **组件中使用** / **`storeToRefs`** / **`$patch` / `$reset`** / **TypeScript** / **HMR**。

继续学习：

- [指南](./guide-line.md)：**核心**——Setup Store 高级用法 / 异步 actions / 跨 store 引用（循环依赖陷阱） / `$subscribe` + `$onAction` 订阅 / 测试隔离 / 持久化插件 / SSR + Nuxt 集成 / 插件系统 / Vuex 迁移 / 常见踩坑
- [参考](./reference.md)：**API 速查**——所有 `defineStore` / store 实例方法 / mapXxx 助手 / TypeScript 类型扩展
