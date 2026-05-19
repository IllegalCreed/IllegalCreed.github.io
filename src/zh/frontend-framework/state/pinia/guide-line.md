---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Pinia 3.x。包含 Setup / Option Store 双语法的完整 API、跨 store 协同、订阅与插件、SSR、Vuex 迁移、测试与常见踩坑。

## 速查

- **Option Store**：`defineStore('id', { state, getters, actions })`——Vuex 风格、`$reset` 自动、TS 推导需断言
- **Setup Store**：`defineStore('id', () => { return { ... } })`——Composition API 风格、`$reset` 需手写、TS 推导更精确
- **state**：必须 arrow function 返回（SSR 必要）+ 每个字段都要声明（不能动态加）
- **getter**：箭头函数 + state 参数 / 常规函数 + this（访问其他 getter）/ 返回函数表达「参数化 getter」
- **action**：常规函数 + this（指向 store）/ 同步异步皆可 / 可调用其他 store 的 action
- **`$patch(obj)`** / **`$patch(fn)`**：批量更新（一次响应式触发）
- **`$reset()`**：Option 自动 / Setup 手写
- **`$subscribe(cb, opts)`**：监听 state 变更，opts = `{ detached, flush }`
- **`$onAction(cb, detached?)`**：监听 action 调用，cb 接收 `{ name, args, after, onError, store }`
- **`$dispose()`**：销毁 store + 清理所有订阅（测试时常用）
- **跨 store**：在 Setup 顶层 / getter / action 内调用 `useOtherStore()`——**避免循环依赖**
- **持久化**：`pinia-plugin-persistedstate`（社区最流行）
- **SSR**：Nuxt 通过 `@pinia/nuxt` 自动处理；非 Nuxt SSR 用 `pinia.state.value = JSON.parse(...)` 手动 hydrate
- **测试**：`setActivePinia(createPinia())` 单元测试隔离；`createTestingPinia()` 组件测试
- **插件**：`pinia.use(({ store, options, app, pinia }) => { ... })`
- **TS 扩展**：`declare module 'pinia' { interface PiniaCustomProperties { ... } }`

## Option Store 完整 API

### state 选项

`state` **必须**是 arrow function 返回一个对象（SSR 必要、避免多实例共享同一对象引用）：

```ts
import { defineStore } from 'pinia'

export const useStore = defineStore('store', {
  state: () => ({
    count: 0,
    name: 'Eduardo',
    isAdmin: true,
    items: [] as string[],
    profile: null as { age: number } | null,
  }),
})
```

**约束**：

- **每个 state 字段必须显式声明**（即使初始 `undefined`）——后续不能动态加：

```ts
const store = useStore()

store.count = 1     // ✅ 已声明
store.newField = 'x' // ❌ 报错：state 中没声明 newField

// 正确做法：在 state() 中显式声明
state: () => ({
  count: 0,
  newField: undefined as string | undefined, // 提前声明
})
```

- **不能用 function 表达式**（必须 arrow function 或简写）：

```ts
// ❌ 错误：function 表达式有 this 绑定问题
state: function() { return { count: 0 } }

// ✅ 正确：arrow function
state: () => ({ count: 0 })
```

### getters 选项

Getters 是**计算属性**——基于 state 派生的只读值（自动缓存）：

#### 箭头函数形式（推荐）

```ts
getters: {
  // 简单：state 参数
  doubleCount: (state) => state.count * 2,

  // 复杂：返回对象
  userInfo: (state) => ({
    name: state.name,
    isAdmin: state.isAdmin,
  }),
}
```

#### 常规函数形式（访问其他 getter）

通过 `this` 访问 store 实例（其他 getter / actions / state）：

```ts
getters: {
  doubleCount: (state) => state.count * 2,

  // 用 this 访问其他 getter——必须显式标注返回类型
  doublePlusOne(): number {
    return this.doubleCount + 1
  },

  // 等价写法：使用 state 参数 + this
  triple(state): number {
    return state.count * 3 + this.doubleCount
  },
}
```

> **TS 关键约束**：当 getter 中用 `this` 访问其他 getter 时，**必须显式标注返回类型**（`(): number`）——否则 TS 推导失败、循环引用报错。

#### 参数化 getter（返回函数）

Getter 不能直接接收参数（违反计算属性缓存语义），但**可以返回函数**：

```ts
getters: {
  // 返回一个接收参数的函数
  getUserById: (state) => {
    return (userId: number) => state.users.find((u) => u.id === userId)
  },
}

// 使用：
const store = useStore()
const user = store.getUserById(42)
```

> **警告**：**返回函数的 getter 失去缓存**——每次调用都会重新执行 `find`。如果性能敏感，考虑改用 `computed` + 参数 / 内部 Map 缓存。

#### 访问其他 store 的 getter

直接在 getter 内 `useOtherStore()`：

```ts
getters: {
  fullInfo(state): string {
    const userStore = useUserStore()
    return `${state.name} - ${userStore.email}`
  },
}
```

### actions 选项

Actions 是**业务逻辑层**——可同步 / 异步、可调用其他 action / store：

#### 同步 action

```ts
actions: {
  increment() {
    this.count++
  },

  reset() {
    this.count = 0
    this.name = ''
  },

  // 接收参数
  setName(newName: string) {
    this.name = newName
  },
}
```

#### 异步 action

`async` / `await` 自由组合：

```ts
import { mande } from 'mande'
const api = mande('/api/users')

actions: {
  async registerUser(login: string, password: string) {
    try {
      this.loading = true
      this.userData = await api.post({ login, password })
      showTooltip(`Welcome ${this.userData.name}!`)
      return this.userData
    } catch (error) {
      showTooltip(error)
      throw error // 抛出错误以便组件捕获
    } finally {
      this.loading = false
    }
  },

  async logout() {
    await api.delete('/session')
    this.$reset()
  },
}
```

#### 调用其他 action

直接通过 `this.otherAction()`：

```ts
actions: {
  async loadProfile() {
    await this.fetchUser()   // 调用本 store 的另一个 action
    await this.fetchOrders()
  },
}
```

#### 调用其他 store 的 action

```ts
actions: {
  async checkout() {
    const cart = useCartStore()
    const user = useUserStore()

    await user.refreshSession()        // 跨 store action 调用
    await api.post('/checkout', cart.items)
    cart.$reset()
  },
}
```

> **SSR 关键陷阱**：**所有 `useXxxStore()` 调用必须在 `await` 之前**——SSR 多实例环境下，`await` 之后调用 store 可能拿到错误的 pinia 实例（不是当前请求的实例）。

```ts
// ❌ SSR 危险
async badAction() {
  await api.fetchSomething()
  const user = useUserStore()  // SSR 下可能拿到错误实例
}

// ✅ 正确
async goodAction() {
  const user = useUserStore()  // 先获取 store
  await api.fetchSomething()
  user.doSomething()
}
```

## Setup Store 完整 API

Setup Store **直接使用 Composition API**——`ref` / `computed` / `watch` / 任意 composable 都能用：

### 基本结构

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // ref / reactive → state
  const count = ref(0)
  const profile = ref<{ name: string } | null>(null)

  // computed → getters
  const doubleCount = computed(() => count.value * 2)

  // function → actions
  function increment() {
    count.value++
  }

  async function fetchProfile() {
    profile.value = await api.getProfile()
  }

  // ⚠️ 必须 return——return 的对象 = store 实例
  return { count, profile, doubleCount, increment, fetchProfile }
})
```

### ref / reactive 都可以用于 state

```ts
import { ref, reactive } from 'vue'

defineStore('mixed', () => {
  // 单值用 ref
  const count = ref(0)
  const name = ref('Eduardo')

  // 对象用 reactive（也可以）
  const user = reactive({
    name: '',
    age: 0,
    email: '',
  })

  return { count, name, user }
})
```

> **推荐都用 ref**——避免 reactive 解构丢响应式的问题。混用反而增加心智负担。

### 使用 Composable（Setup Store 独有优势）

Setup Store 可以**自由使用任意 composable**——这是 Option Store 做不到的：

```ts
import { defineStore } from 'pinia'
import { useLocalStorage, useNetwork, useMediaControls } from '@vueuse/core'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 持久化的 state（自动同步 localStorage）
  const theme = useLocalStorage('app:theme', 'light')

  // 网络状态
  const { isOnline } = useNetwork()

  // ⚠️ SSR 注意：useLocalStorage 在 server 端不可用——需 skipHydrate
  return {
    theme: skipHydrate(theme),
    isOnline: skipHydrate(isOnline),
  }
})
```

详见后文 [SSR 与 Nuxt > skipHydrate](#skiphydrate)。

### Setup Store 手写 `$reset`

Setup Store **必须手写 `$reset`**（Option Store 自动有）：

```ts
defineStore('counter', () => {
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

### Setup Store + watch

Setup Store 可以**在 setup 函数内直接 watch state**——监听跨 store 的逻辑非常方便：

```ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from './auth'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)
  const authStore = useAuthStore()

  // 监听登录状态变化，自动加载/清空 profile
  watch(
    () => authStore.isAuthenticated,
    async (isAuth) => {
      if (isAuth) {
        profile.value = await api.getProfile()
      } else {
        profile.value = null
      }
    },
    { immediate: true }
  )

  return { profile }
})
```

## `$patch` 批量更新

`$patch` 是 Pinia 的**批量变更 API**——一次触发响应式 / DevTools 中可见「patch」标记。

### 对象签名

适合**简单 key-value 赋值**：

```ts
const cart = useCartStore()

cart.$patch({
  total: 99,
  count: 3,
  discount: 0.1,
})
```

### 函数签名

适合**数组操作 / Map / Set / 复杂 mutate**：

```ts
cart.$patch((state) => {
  state.items.push({ name: 'shoes', quantity: 1 })
  state.items.splice(1, 1)
  state.total = state.items.reduce((sum, i) => sum + i.price, 0)
  state.lastUpdate = Date.now()
})
```

### `$patch` vs 直接 mutate

| 方式 | 响应式触发次数 | DevTools 显示 | 适用场景 |
|---|---|---|---|
| `store.x = 1; store.y = 2` | **多次**（每次赋值） | `direct mutation` | 单字段简单赋值 |
| `store.$patch({ x: 1, y: 2 })` | **一次** | `patch object` | 多字段同时改 |
| `store.$patch(fn)` | **一次** | `patch function` | 复杂 mutate / 数组 |

## 状态订阅

### `$subscribe` 监听 state 变更

类似 Vuex 的 `subscribe`——每次 state 变化时回调：

```ts
const cart = useCartStore()

const unsubscribe = cart.$subscribe((mutation, state) => {
  // mutation.type: 'direct' | 'patch object' | 'patch function'
  // mutation.storeId: 'cart'
  // mutation.payload: 仅 patch object 有，是 $patch 的对象
  // state: 当前 state 快照

  console.log(`[${mutation.storeId}] type=${mutation.type}`)
  localStorage.setItem('cart', JSON.stringify(state))
})

// 取消订阅
unsubscribe()
```

#### 选项参数

```ts
cart.$subscribe(callback, {
  // 触发时机（默认 'post'：组件 update 之后；'sync'：立即）
  flush: 'sync',

  // 组件卸载时是否保留订阅（默认 false：随组件卸载自动取消）
  detached: true,
})
```

#### 常见用途：自动持久化

```ts
// 在组件 setup 中
const cart = useCartStore()

cart.$subscribe(
  (_mutation, state) => {
    localStorage.setItem('cart', JSON.stringify(state))
  },
  { detached: true } // 保留订阅、不随组件卸载
)
```

> 实际项目推荐直接用 `pinia-plugin-persistedstate`——见后文 [持久化](#持久化)。

### `$onAction` 监听 action 调用

更精确——可以监听 action 的**前置 / 完成 / 错误**三个阶段：

```ts
const userStore = useUserStore()

const unsubscribe = userStore.$onAction(
  ({
    name,    // action 名称
    args,    // 传入参数（数组）
    store,   // store 实例
    after,   // action 成功后调用
    onError, // action 抛错时调用
  }) => {
    const start = Date.now()
    console.log(`[${name}] start with args:`, args)

    after((result) => {
      console.log(`[${name}] done in ${Date.now() - start}ms, result:`, result)
    })

    onError((error) => {
      console.error(`[${name}] failed in ${Date.now() - start}ms:`, error)
    })
  }
)

unsubscribe()
```

`after` / `onError` **仅对 async action 有意义**——sync action 走到回调时已经执行完。

#### 保留订阅（不随组件卸载取消）

```ts
userStore.$onAction(callback, true) // 第二个参数 true = detached
```

### 应用场景：审计日志 / 异常上报 / 性能监控

```ts
// 集中监控所有 store 的 action（Pinia 插件版）
pinia.use(({ store }) => {
  store.$onAction(({ name, args, after, onError }) => {
    const start = Date.now()

    after((result) => {
      analytics.track('action_success', {
        store: store.$id,
        action: name,
        args,
        duration: Date.now() - start,
      })
    })

    onError((error) => {
      analytics.track('action_error', {
        store: store.$id,
        action: name,
        args,
        error: error.message,
      })
    })
  })
})
```

### `$dispose` 销毁 store

测试或动态场景下可以**主动销毁**一个 store（清理所有订阅 / 移除注册）：

```ts
const store = useCounterStore()
store.$dispose() // 移除 store 实例 + 取消所有 $subscribe / $onAction
```

## 跨 Store 引用

Pinia 没有 namespacing——store 互相引用就像 import 一个 composable：

### 在 Setup Store 顶层引用

```ts
// stores/cart.ts
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  // ✅ 在 setup 顶层调用——store 实例只创建一次
  const user = useUserStore()
  const items = ref([])

  const summary = computed(() =>
    `Hi ${user.name}, you have ${items.value.length} items.`
  )

  return { items, summary }
})
```

### 在 Option Store 的 getter / action 中引用

Option Store **不能在 state() 中**调用其他 store（state 是 arrow function、不存在 setup 上下文）——只能在 getter / action 内：

```ts
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),

  getters: {
    // ✅ 在 getter 内调用
    summary(state): string {
      const user = useUserStore()
      return `Hi ${user.name}, you have ${state.items.length} items.`
    },
  },

  actions: {
    // ✅ 在 action 内调用
    async checkout() {
      const user = useUserStore()
      const auth = useAuthStore()
      await api.post('/checkout', {
        userId: user.id,
        token: auth.token,
        items: this.items,
      })
      this.$reset()
    },
  },
})
```

### 循环依赖陷阱

**两个 store 在 setup 顶层互相引用 + 互相 read state** → **启动死循环**：

```ts
// stores/x.ts
export const useX = defineStore('x', () => {
  const y = useY()
  console.log(y.name) // ❌ 启动时直接 read → 触发 useY() 重新初始化

  return { name: ref('I am X') }
})

// stores/y.ts
export const useY = defineStore('y', () => {
  const x = useX()
  console.log(x.name) // ❌ 同样的死循环

  return { name: ref('I am Y') }
})
```

**解决方案**：

1. **只在 getter / action 内读取**（按需读取、不在 setup 顶层 read）：

```ts
export const useX = defineStore('x', () => {
  const name = ref('I am X')

  // ✅ 在 computed / function 内读取——惰性、不会死循环
  const greeting = computed(() => {
    const y = useY()
    return `Hello ${y.name}`
  })

  return { name, greeting }
})
```

2. **重构 store 拆分**：把循环依赖的部分提取到第三个 store。

## 持久化

Pinia 本身**不内置持久化**——通过插件实现。社区最流行的是 [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/)。

### 安装

```bash
pnpm add pinia-plugin-persistedstate
```

### 注册

```ts
// main.ts
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
```

### 使用：在 store 定义中开启

```ts
// Option Store
export const useUserStore = defineStore('user', {
  state: () => ({ token: '', name: '' }),

  // 启用持久化（最简单形式）
  persist: true,
})

// Setup Store
export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('')
    const name = ref('')
    return { token, name }
  },
  {
    persist: true, // 第三个参数
  }
)
```

`persist: true` 默认行为：
- 存储介质：`localStorage`
- key：store id（`'user'`）
- 序列化：`JSON.stringify` / `JSON.parse`
- 字段：**所有 state**

### 高级配置

```ts
defineStore('user', {
  state: () => ({ token: '', name: '', tempData: null }),

  persist: {
    key: 'app:user',          // 自定义存储 key
    storage: sessionStorage,  // 改用 sessionStorage
    pick: ['token', 'name'],  // 仅持久化指定字段（推荐）
    // 或者：omit: ['tempData']  // 排除指定字段
  },
})
```

### 多策略持久化

针对不同字段用不同存储：

```ts
defineStore('app', {
  state: () => ({ token: '', settings: {}, draftPost: null }),

  persist: [
    {
      pick: ['token'],
      storage: localStorage,
      key: 'app:auth',
    },
    {
      pick: ['settings'],
      storage: localStorage,
      key: 'app:settings',
    },
    {
      pick: ['draftPost'],
      storage: sessionStorage,
      key: 'app:draft',
    },
  ],
})
```

## SSR 与 Nuxt 集成

Pinia 是**SSR 一等公民**——但需要正确处理 hydration、避免 server / client 状态不一致。

### Nuxt 集成（推荐 SSR 方式）

Nuxt 通过 `@pinia/nuxt` 模块**零配置 SSR**：

```bash
npx nuxi@latest module add pinia
```

`nuxt.config.ts`：

```ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  pinia: {
    storesDirs: ['./stores/**'], // 默认值
  },
})
```

**Nuxt 自动处理**：
- 安装 + 注册 Pinia
- 自动 import `defineStore` / `storeToRefs` / `acceptHMRUpdate` / `usePinia`
- 自动扫描 `stores/` 目录下所有 store 文件并 auto-import
- 服务器端 state 自动 serialize + 客户端 hydrate（**用 [devalue](https://github.com/Rich-Harris/devalue) 处理 XSS**）
- 无需手动 `pinia.state.value = ...`

> Nuxt 默认用 devalue 序列化、**不需要关心 XSS 转义**——这是 `@pinia/nuxt` 最大的便利。

#### 在 Nuxt 中使用

```vue
<!-- pages/index.vue -->
<script setup>
const userStore = useUserStore() // 自动 import
await callOnce('user', () => userStore.fetchUser())
</script>
```

#### 在 Nuxt 插件 / 中间件中使用

```ts
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore() // 自动可用
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return navigateTo('/login')
  }
})
```

#### 手动获取 pinia 实例

```ts
import { useUserStore } from '~/stores/user'

const { $pinia } = useNuxtApp()
const userStore = useUserStore($pinia) // 手动传 pinia
```

### 非 Nuxt SSR（Vite SSR / 自建）

如果不用 Nuxt（如 Vite SSR / 自建 SSR），需要**手动处理 hydration**：

#### 服务端：序列化 state

```ts
// entry-server.ts
import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'

export async function render(url: string) {
  const { app, pinia } = createApp()
  await router.push(url)
  const html = await renderToString(app)

  // ⚠️ 安全考虑：生产环境务必用 devalue 而非 JSON.stringify
  // JSON.stringify 不防 XSS（state 中包含用户输入时危险）
  const state = JSON.stringify(pinia.state.value)

  return { html, state }
}
```

注入到 HTML：

```html
<!-- index.html -->
<div id="app">{{ html }}</div>
<script>
  window.__pinia = '{{ state }}'
</script>
```

#### 客户端：hydrate state

**必须在任何 `useXxxStore()` 调用之前 hydrate**：

```ts
// entry-client.ts
import { createApp, createPinia } from './main'

const { app, pinia } = createApp()

// ⚠️ 关键：必须在 mount / 任何 useStore() 之前
if (window.__pinia) {
  pinia.state.value = JSON.parse(window.__pinia)
}

app.mount('#app')
```

### `skipHydrate`

某些**仅客户端可用**的 composable（`useLocalStorage` / `useEventListener` / Web API）必须用 `skipHydrate` 排除——否则 server-rendered HTML 与 client-side 不匹配（hydration mismatch）：

```ts
import { defineStore, skipHydrate } from 'pinia'
import { useLocalStorage, useEyeDropper } from '@vueuse/core'

export const useColorStore = defineStore('colors', () => {
  // useEyeDropper 仅客户端可用
  const { isSupported, open, sRGBHex } = useEyeDropper()

  // useLocalStorage 仅客户端可用
  const lastColor = useLocalStorage('lastColor', sRGBHex)

  return {
    // ⚠️ 这些必须 skipHydrate
    lastColor: skipHydrate(lastColor),
    isSupported: skipHydrate(isSupported),

    // 普通函数无需 skipHydrate
    open,
  }
})
```

**仅适用于 state 属性**——不要对 action 用 `skipHydrate`。

### Option Store 的 `hydrate` 钩子

Option Store 中如果 `state()` 包含 `useLocalStorage` 等，需要在 `hydrate()` 中重新执行：

```ts
import { useLocalStorage } from '@vueuse/core'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: useLocalStorage('pinia/auth/login', 'bob'),
  }),

  // 客户端 hydrate 时重新执行 useLocalStorage
  hydrate(state, initialState) {
    state.user = useLocalStorage('pinia/auth/login', 'bob')
  },
})
```

## Plugin 系统

Pinia 插件 = `pinia.use(plugin)` 注册的函数，每次 `useStore()` 时自动调用一次（针对每个 store）。

### 插件签名

```ts
import type { PiniaPluginContext } from 'pinia'

function myPlugin(context: PiniaPluginContext) {
  context.pinia    // pinia 实例
  context.app      // Vue app
  context.store    // 当前正在初始化的 store
  context.options  // store 的 defineStore 第二参数
}

pinia.use(myPlugin)
```

> **顺序敏感**：插件**只对注册之后创建的 store 生效**——`pinia.use(plugin)` 必须在 `app.use(pinia)` 之前 / 之后但**早于第一次 `useXxxStore()`** 调用。

### 案例 1：给所有 store 加新属性

```ts
pinia.use(({ store }) => {
  // 给每个 store 加一个 router 引用（来自 Vue Router）
  store.router = markRaw(router) // markRaw 防止响应式包装
})

// 使用：
const counter = useCounterStore()
counter.router.push('/about') // 任意 store 都能用 .router
```

### 案例 2：给所有 store 加新 state（带 DevTools 展示）

```ts
import { toRef, ref } from 'vue'

pinia.use(({ store }) => {
  if (!store.$state.hasOwnProperty('hasError')) {
    const hasError = ref(false)
    store.$state.hasError = hasError
  }
  store.hasError = toRef(store.$state, 'hasError')

  // 让 DevTools 也能看到自定义属性
  if (process.env.NODE_ENV === 'development') {
    store._customProperties.add('hasError')
  }
})
```

### 案例 3：自定义 defineStore options

定义一个 `debounce` 选项，让 action 自动 debounce：

```ts
import debounce from 'lodash/debounce'

pinia.use(({ options, store }) => {
  if (options.debounce) {
    return Object.keys(options.debounce).reduce((debounced, action) => {
      debounced[action] = debounce(store[action], options.debounce[action])
      return debounced
    }, {} as Record<string, any>)
  }
})

// store 中使用自定义 options：
defineStore('search', {
  actions: {
    searchContacts() { /* ... */ },
  },
  debounce: {
    searchContacts: 300, // 300ms debounce
  },
})
```

### 案例 4：扩展 `$reset`

为插件添加的新 state 提供 `$reset`：

```ts
pinia.use(({ store }) => {
  const originalReset = store.$reset.bind(store)
  return {
    $reset() {
      originalReset()       // 先调用原始 reset
      store.hasError = false // 重置插件加的 state
    },
  }
})
```

### 案例 5：所有 store 集中持久化（简版 persistedstate）

```ts
pinia.use(({ store }) => {
  // 读取 localStorage
  const saved = localStorage.getItem(store.$id)
  if (saved) {
    store.$patch(JSON.parse(saved))
  }

  // 订阅变化
  store.$subscribe((_mutation, state) => {
    localStorage.setItem(store.$id, JSON.stringify(state))
  })
})
```

### TypeScript：扩展类型

让自定义属性 / state 在 TS 类型中可见：

```ts
// types/pinia.d.ts
import 'pinia'
import type { Router } from 'vue-router'

declare module 'pinia' {
  // 扩展所有 store 实例的属性
  export interface PiniaCustomProperties {
    router: Router
    hasError: boolean
  }

  // 扩展所有 store 的 $state
  export interface PiniaCustomStateProperties<S> {
    hasError: boolean
  }

  // 扩展 defineStore 第二参数的 options 类型
  export interface DefineStoreOptionsBase<S, Store> {
    debounce?: Partial<Record<keyof StoreActions<Store>, number>>
  }
}
```

> **关键**：`tsconfig.json` 必须 include 这个 `.d.ts` 文件——否则类型扩展无效。

## HMR 与 Vue DevTools

### HMR：每个 store 文件末尾添加

每个 store 文件末尾添加：

```ts
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useCounterStore = defineStore('counter', { /* ... */ })

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot))
}
```

**效果**：编辑 store 文件保存后——
- ✅ 当前 state **保留**
- ✅ 修改的 actions / getters 立即生效
- ❌ 新增的 state 字段需要刷新（不在初始 state 中无法 hydrate）

### Webpack 用户

```ts
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(acceptHMRUpdate(useCounterStore, import.meta.webpackHot))
}
```

### Vue DevTools 7

Vue DevTools 7 内置 Pinia 集成——无需额外配置：

- **Pinia 标签页**：所有 store 树状显示
- **State 实时编辑**：DevTools 中修改 state、应用立即响应
- **时间旅行**：回放 mutation 历史、对比 state 快照
- **Mutation 类型**：清晰区分 `direct` / `patch object` / `patch function`
- **Action 日志**：每次 action 的参数 / 返回值 / 耗时

## Vuex 4 → Pinia 迁移

### 核心对照

| Vuex 4 | Pinia |
|---|---|
| `store/index.js` 单一 root store | 多个独立 store 文件（`stores/*.ts`） |
| `modules: { auth, cart }` + namespacing | 每个 store 独立、不需要 namespacing |
| `mutations: { ADD_TODO(state, payload) }` | **删除**：直接 mutate / `$patch` |
| `commit('auth/SET_USER', user)` | `userStore.user = user` 或 `userStore.setUser(user)` |
| `dispatch('auth/login', payload)` | `userStore.login(payload)` |
| `mapState`、`mapGetters`、`mapActions` | `useUserStore()` + `storeToRefs()`（推荐） |
| `useStore()` + `store.state.auth.user.name` | `const userStore = useUserStore(); userStore.name` |
| Vue 2 + `@vue/composition-api` 兼容 | **仅 Vue 3** |

### 迁移步骤

#### 1. 目录结构

```diff
- src/store/
-   index.js
-   modules/
-     auth.js
-     cart.js
+ src/stores/
+   auth.ts
+   cart.ts
```

#### 2. 注册方式

```diff
- // src/store/index.js
- import { createStore } from 'vuex'
- export default createStore({
-   modules: { auth, cart },
- })

+ // src/stores/auth.ts
+ import { defineStore } from 'pinia'
+ export const useAuthStore = defineStore('auth', { ... })
+
+ // src/stores/cart.ts
+ export const useCartStore = defineStore('cart', { ... })
```

```diff
- // main.js
- import store from './store'
- app.use(store)

+ // main.ts
+ import { createPinia } from 'pinia'
+ app.use(createPinia())
+ // 不需要再 import 任何 store——每个 store 在用到时按需 import
```

#### 3. State 转换

```diff
  // 原 Vuex
- state: {
-   user: null,
-   firstName: '',
- }

+ // Pinia
+ state: () => ({
+   user: null as User | null,
+   firstName: '',
+ })
```

#### 4. Getter 转换

```diff
- // Vuex
- getters: {
-   fullName: (state) => `${state.firstName} ${state.lastName}`,
- }

+ // Pinia（语法几乎一样）
+ getters: {
+   fullName: (state) => `${state.firstName} ${state.lastName}`,
+ }
```

**访问其他 module 的 getter**：

```diff
- // Vuex
- fullInfo: (state, getters, rootState, rootGetters) => {
-   return rootGetters['auth/email'] + state.name
- }

+ // Pinia——直接 import 用
+ fullInfo(state): string {
+   const authStore = useAuthStore()
+   return authStore.email + state.name
+ }
```

#### 5. Mutation 删除

Pinia **完全没有 mutation**——所有 mutation 转为 action 或直接 mutate：

```diff
- // Vuex
- mutations: {
-   SET_USER(state, user) {
-     state.user = user
-   },
- },
- actions: {
-   async login({ commit }, credentials) {
-     const user = await api.login(credentials)
-     commit('SET_USER', user)
-   },
- },

+ // Pinia（mutation → action）
+ actions: {
+   async login(credentials) {
+     const user = await api.login(credentials)
+     this.user = user
+   },
+ }
```

#### 6. 组件中使用

```diff
- // Vuex
- import { mapState, mapActions } from 'vuex'
- export default {
-   computed: {
-     ...mapState('auth', ['user', 'isLoggedIn']),
-   },
-   methods: {
-     ...mapActions('auth', ['login', 'logout']),
-   },
- }

+ // Pinia（Composition API 推荐）
+ <script setup lang="ts">
+ import { useAuthStore } from '@/stores/auth'
+ import { storeToRefs } from 'pinia'
+
+ const authStore = useAuthStore()
+ const { user, isLoggedIn } = storeToRefs(authStore)
+ const { login, logout } = authStore
+ </script>
```

#### 7. Router Guards / 非组件场景

```diff
- // Vuex
- import store from '@/store'
- router.beforeEach((to, from, next) => {
-   if (store.getters['auth/isLoggedIn']) next()
-   else next('/login')
- })

+ // Pinia——必须在函数内 useStore()
+ import { useAuthStore } from '@/stores/auth'
+ router.beforeEach((to) => {
+   const authStore = useAuthStore() // 在 guard 内调用
+   if (!authStore.isLoggedIn && to.meta.requiresAuth) {
+     return '/login'
+   }
+ })
```

## 测试

### 单元测试 Store

每个测试用例之间需要**重新创建 pinia**——避免 state 污染：

```ts
// counter.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    // 每个测试创建新的 pinia 实例（防 state 污染）
    setActivePinia(createPinia())
  })

  it('initial count is 0', () => {
    const counter = useCounterStore()
    expect(counter.count).toBe(0)
  })

  it('increments', () => {
    const counter = useCounterStore()
    counter.increment()
    expect(counter.count).toBe(1)
  })

  it('async action', async () => {
    const counter = useCounterStore()
    await counter.fetchCount()
    expect(counter.count).toBeGreaterThan(0)
  })
})
```

### 测试带插件的 store

```ts
import { createApp } from 'vue'

beforeEach(() => {
  const app = createApp({})
  const pinia = createPinia()
  pinia.use(myPlugin) // 安装插件
  app.use(pinia)
  setActivePinia(pinia)
})
```

### 组件测试：`createTestingPinia`

测试组件时（Vue Test Utils + Vitest）——用 `@pinia/testing` 提供的 `createTestingPinia` mock 整个 pinia：

```bash
pnpm add -D @pinia/testing
```

```ts
// Counter.spec.ts
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { vi } from 'vitest'
import Counter from '@/components/Counter.vue'
import { useCounterStore } from '@/stores/counter'

describe('Counter.vue', () => {
  it('renders count from store', () => {
    const wrapper = mount(Counter, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,  // Vitest 必传，Jest 用 jest.fn
            initialState: {
              counter: { count: 5 },
            },
          }),
        ],
      },
    })

    expect(wrapper.text()).toContain('5')
  })

  it('calls increment when clicked', async () => {
    const wrapper = mount(Counter, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
      },
    })

    const store = useCounterStore()
    await wrapper.find('button').trigger('click')

    // 默认 actions 被 mock（stubActions: true）——可以断言调用
    expect(store.increment).toHaveBeenCalled()
  })
})
```

### `createTestingPinia` 配置

```ts
createTestingPinia({
  // mock 函数（Vitest 必传 vi.fn，Jest 默认）
  createSpy: vi.fn,

  // 初始 state（可选）
  initialState: {
    counter: { count: 5 },
    user: { name: 'Test' },
  },

  // actions 行为
  stubActions: true,    // 默认 true——所有 action 被 mock 不执行
  // stubActions: false // 不 mock，action 正常执行
  // stubActions: ['increment'] // 只 mock 指定 action

  // 安装额外插件
  plugins: [myPlugin],
})
```

### Mock Getter

Getters **不会被自动 mock**——可以手动赋值覆盖：

```ts
const counter = useCounterStore()
counter.doubleCount = 100 // 强制覆盖 getter 返回值
expect(counter.doubleCount).toBe(100)

counter.doubleCount = undefined // 恢复正常 getter 行为
```

## 常见踩坑

### 1. 直接 destructure store 丢响应式

```ts
const counter = useCounterStore()

// ❌ 错误
const { count } = counter
counter.count++       // count 变量不会更新

// ✅ 正确
const { count } = storeToRefs(counter)
counter.count++       // count.value 会更新
```

### 2. Setup Store 忘写 `$reset`

```ts
// Setup Store 没有自动 $reset
defineStore('counter', () => {
  const count = ref(0)
  // ❌ 没 return $reset → store.$reset() 报「is not a function」
  return { count }
})

// ✅ 手写并 return
defineStore('counter', () => {
  const count = ref(0)
  function $reset() { count.value = 0 }
  return { count, $reset }
})
```

### 3. State 字段不能动态加

```ts
state: () => ({ count: 0 })

const store = useStore()
store.count = 1       // ✅ 已声明
store.newField = 'x'  // ❌ 报错（且 DevTools 看不见）

// 正确：在 state() 中提前声明（即使初始 undefined）
state: () => ({
  count: 0,
  newField: undefined as string | undefined,
})
```

### 4. 模块顶层 `useXxxStore()` 报「no active pinia」

```ts
// ❌ 错误：模块顶层调用——pinia 还没注册
const store = useCounterStore() // 报错

export function someFunc() {
  store.count++
}

// ✅ 正确：在函数 / setup 内调用
export function someFunc() {
  const store = useCounterStore()
  store.count++
}
```

### 5. 循环依赖

```ts
// ❌ A 与 B 在 setup 顶层互相 read
const useA = defineStore('a', () => {
  const b = useB()
  b.name // 启动死循环
  return { name: ref('A') }
})

const useB = defineStore('b', () => {
  const a = useA()
  a.name // 启动死循环
  return { name: ref('B') }
})

// ✅ 改为 getter / action 内按需读取
const useA = defineStore('a', () => {
  const name = ref('A')
  const greeting = computed(() => {
    const b = useB()
    return `Hello ${b.name}`
  })
  return { name, greeting }
})
```

### 6. SSR：`useStore()` 在 `await` 之后

```ts
// ❌ SSR 下可能拿到错误 pinia 实例
async checkout() {
  await api.something()
  const user = useUserStore() // 错误
}

// ✅ 正确：在 await 之前获取 store
async checkout() {
  const user = useUserStore()
  await api.something()
}
```

### 7. SSR：客户端 hydrate 时机

```ts
// ❌ 错误：先调用了 useStore，再 hydrate
const store = useCounterStore()
pinia.state.value = JSON.parse(window.__pinia)
// → store.count 还是初始 0，不是 SSR 序列化的值

// ✅ 正确：hydrate 在所有 useStore 之前
pinia.state.value = JSON.parse(window.__pinia)
app.mount('#app')
// → 之后任何 useStore() 都能拿到正确的 state
```

### 8. getter 中用 `this` 但忘标返回类型

```ts
// ❌ TS 推导失败（this 类型为 any）
getters: {
  double: (state) => state.count * 2,
  doublePlusOne() {
    return this.double + 1 // TS 报「this implicitly has any type」
  },
}

// ✅ 显式标注返回类型
getters: {
  doublePlusOne(): number {
    return this.double + 1
  },
}
```

### 9. `tsconfig.json` 没启用 strict

```json
{
  "compilerOptions": {
    "strict": true,                // ✅ 必须
    "noImplicitThis": true         // ✅ 至少这个
  }
}
```

否则 getter `this` 推导失效。

### 10. Pinia 插件没在所有 store 创建前注册

```ts
// ❌ 错误：先用 store、再 use 插件
const counter = useCounterStore()
pinia.use(persistedstate) // 太晚了——counter 没有 persist 能力

// ✅ 正确：先 use 所有插件、再 useStore
pinia.use(persistedstate)
app.use(pinia)
const counter = useCounterStore() // 此时 persist 生效
```

### 11. `pinia-plugin-persistedstate` v3 配置语法变化

```ts
// ❌ v1 旧语法（不再支持）
persist: {
  paths: ['token', 'name']
}

// ✅ v3 新语法
persist: {
  pick: ['token', 'name']  // 或 omit: ['tempData']
}
```

### 12. Nuxt 中 store 没自动 import

确认 `nuxt.config.ts` 配了 `'@pinia/nuxt'` 在 `modules` 数组中、且 store 文件放在 `stores/` 第一层（**不递归扫描嵌套目录**）。

```
✅ stores/user.ts          → useUserStore 自动 import
✅ stores/cart.ts          → useCartStore 自动 import
❌ stores/auth/user.ts     → 不会自动 import（需手动 import 或配置 storesDirs）
```

配置 `storesDirs` 支持嵌套：

```ts
defineNuxtConfig({
  pinia: {
    storesDirs: ['./stores/**'], // 加 `**` 递归扫描
  },
})
```

## 下一步

- [参考](./reference.md)：API 速查——所有 `defineStore` / store 实例方法 / mapXxx 助手 / TypeScript 类型扩展
