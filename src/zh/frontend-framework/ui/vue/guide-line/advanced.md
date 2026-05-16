---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> Composables 设计、Pinia、Vue Router、Transition、TypeScript、组件库选型

## 速查

- 编译器宏：`defineProps` / `defineEmits` / `defineExpose` / `defineModel`（3.4+）/ `defineOptions` / `defineSlots` / `withDefaults`
- Composables：约定 `useXxx`，资源清理用 `onUnmounted` / `onWatcherCleanup`
- 状态：Pinia（推荐）—— Setup Store / Option Store / `$onAction` / `$subscribe`
- 路由：Vue Router 4 —— 动态 / 嵌套 / 命名 / 守卫 / meta / 懒加载 / scrollBehavior
- 异步组件：`defineAsyncComponent` + loading / error / suspensible
- Teleport：弹窗 / Modal / Toast 渲染到 `<body>`
- Transition / TransitionGroup：CSS 类 + JS hooks + FLIP move 动画
- KeepAlive：缓存组件（`include` / `exclude` / `max`）
- TS：`<script setup lang="ts">` + 编译器宏类型推导 + `vue-tsc`

## 编译器宏完整用法

### `defineProps` —— 声明 props

```vue
<script setup lang="ts">
// 类型字面量
const props = defineProps<{
  title: string
  count?: number
  items: { id: number; name: string }[]
  variant: 'primary' | 'secondary'
}>()

// 接口
interface Props {
  user: { name: string; email: string }
  showEmail?: boolean
}
const props = defineProps<Props>()

// 解构（3.5+ 默认响应式）
const { title, count = 0 } = defineProps<{
  title: string
  count?: number
}>()

// 运行时声明（无 TS 时用）
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
})
</script>
```

### `withDefaults` —— 默认值

```ts
interface Props {
  title?: string
  count?: number
  items?: string[]
  callback?: (id: number) => void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Default Title',
  count: 0,
  items: () => ['a', 'b'],         // 对象 / 数组用工厂
  callback: () => () => undefined,  // 函数也用工厂
})
```

::: tip 3.5+ 推荐用解构默认值

```ts
// Vue 3.5+ 推荐：用 JS 解构默认值
const { title = 'Default', count = 0 } = defineProps<{
  title?: string
  count?: number
}>()
```

更直观，少一层 withDefaults 包装。

:::

### `defineEmits` —— 声明事件

```vue
<script setup lang="ts">
// 类型签名（Vue 3.3+ 推荐）
const emit = defineEmits<{
  submit: [data: { id: number; name: string }]
  cancel: []
  'update:value': [value: string]
}>()

// 调用
emit('submit', { id: 1, name: 'foo' })
emit('cancel')
emit('update:value', 'new value')

// 老式调用签名（仍可用）
const emit = defineEmits<{
  (e: 'submit', data: { id: number }): void
  (e: 'cancel'): void
}>()

// 运行时（带验证）
const emit = defineEmits({
  submit: (payload: { id: number }) => {
    return typeof payload.id === 'number'   // 返回 false 触发 dev 警告
  },
  cancel: null,
})
</script>
```

### `defineExpose` —— 显式暴露

```vue
<script setup lang="ts">
import { ref } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)
const value = ref('')

function focus() {
  inputRef.value?.focus()
}

function clear() {
  value.value = ''
}

// 父组件通过 ref 拿到的对象只有这些
defineExpose({
  focus,
  clear,
})
// 注意：value / inputRef 不在 expose 里，父组件拿不到
</script>
```

### `defineModel` —— 双向绑定（3.4+ 稳定）

```vue
<!-- 子组件：基础 v-model -->
<script setup lang="ts">
// 等价 props.modelValue + emit('update:modelValue')
const model = defineModel<string>({ required: true })

// 直接读写 model.value 会自动触发 emit
function clear() {
  model.value = ''
}
</script>

<template>
  <input v-model="model" />
  <button @click="clear">Clear</button>
</template>
```

```vue
<!-- 父组件 -->
<MyInput v-model="text" />
```

### 多 `defineModel`

```vue
<!-- 子组件 -->
<script setup lang="ts">
const firstName = defineModel<string>('firstName')
const lastName = defineModel<string>('lastName')
const age = defineModel<number>('age', { default: 0 })
</script>

<template>
  <input v-model="firstName" />
  <input v-model="lastName" />
  <input v-model.number="age" type="number" />
</template>
```

```vue
<!-- 父组件 -->
<UserForm v-model:first-name="first" v-model:last-name="last" v-model:age="age" />
```

### `defineModel` 修饰符

```vue
<script setup lang="ts">
// modifiers 是父侧传的修饰符
const [model, modifiers] = defineModel<string>({
  set(value) {
    // 自定义 set 逻辑（capitalize 修饰符为例）
    return modifiers.capitalize
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : value
  },
})
</script>
```

```vue
<!-- 父组件用 .capitalize -->
<MyInput v-model.capitalize="text" />
```

### `defineOptions` —— 顶层选项

```vue
<script setup lang="ts">
defineOptions({
  name: 'MyButton',            // 命名（DevTools / KeepAlive 用）
  inheritAttrs: false,         // 默认 true：根元素继承未声明的 attrs
})
</script>
```

不用 `defineOptions` 时，组件名按文件名推导。

### `defineSlots` —— 类型化 slots

```vue
<script setup lang="ts">
defineSlots<{
  default(props: { item: Item }): any
  header(props: { title: string }): any
  footer(): any
}>()
</script>

<template>
  <header><slot name="header" :title="title" /></header>
  <slot :item="currentItem" />
  <footer><slot name="footer" /></footer>
</template>
```

## Composables 设计

### 基本约定

```ts
// composables/useToggle.ts
import { ref } from 'vue'

export function useToggle(initial = false) {
  const value = ref(initial)
  const toggle = () => { value.value = !value.value }
  return { value, toggle }
}
```

约定：
- 函数名以 `use` 开头
- 返回响应式 ref / reactive + 操作函数
- 第一个参数支持默认值

### 异步 composable + 资源清理

```ts
// composables/useFetchData.ts
import { ref, onUnmounted, onWatcherCleanup, watch } from 'vue'

export function useFetchData<T>(url: () => string) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  watch(url, async (currentUrl) => {
    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort())   // 3.5+

    loading.value = true
    error.value = null

    try {
      const res = await fetch(currentUrl, { signal: controller.signal })
      data.value = await res.json()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        error.value = e as Error
      }
    } finally {
      loading.value = false
    }
  }, { immediate: true })

  return { data, loading, error }
}
```

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useFetchData } from '@/composables/useFetchData'

const userId = ref(1)
const { data, loading, error } = useFetchData<User>(
  () => `/api/users/${userId.value}`,
)
</script>
```

### 共享 state 的 composable

```ts
// composables/useGlobalCounter.ts
import { ref } from 'vue'

// 模块级 ref → 跨组件共享
const count = ref(0)

export function useGlobalCounter() {
  function increment() { count.value++ }
  function decrement() { count.value-- }
  return { count, increment, decrement }
}
```

任何组件调 `useGlobalCounter()` 拿到**同一个 count ref**。适合：购物车数量、当前主题、登录状态等。

::: warning 模块级 state 不能在 SSR 用

SSR 时多个请求共享同一 Node 进程，模块级变量会**跨用户污染**。SSR 项目要用 Pinia / Nuxt useState 这种「按请求隔离」的方案。

:::

### TypeScript 泛型 composable

```ts
import { ref, computed, type Ref } from 'vue'

export function useArrayFilter<T>(
  list: Ref<T[]>,
  predicate: (item: T) => boolean,
) {
  return computed(() => list.value.filter(predicate))
}
```

```ts
const users = ref<User[]>([])
const activeUsers = useArrayFilter(users, u => u.active)
```

## Pinia —— 推荐状态管理

### 安装

```bash
pnpm add pinia
```

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

### Setup Store（推荐）

```ts
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // state
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  // getters
  const isLoggedIn = computed(() => user.value !== null)
  const userName = computed(() => user.value?.name ?? 'Guest')

  // actions
  async function login(email: string, password: string) {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    user.value = data.user
    token.value = data.token
    localStorage.setItem('token', data.token)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isLoggedIn, userName, login, logout }
})
```

### Option Store（向后兼容）

```ts
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Eduardo',
  }),
  getters: {
    doubled: (state) => state.count * 2,
    fullName(): string {
      return `${this.name} - ${this.count}`
    },
  },
  actions: {
    increment() {
      this.count++
    },
    async incrementAsync() {
      await new Promise(r => setTimeout(r, 1000))
      this.count++
    },
  },
})
```

Option Store 用 `this` 拿到 state / getters。

### 使用 Store

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const auth = useAuthStore()

// 解构 state / getter 必须用 storeToRefs 保留响应性
const { user, isLoggedIn, userName } = storeToRefs(auth)

// actions 直接解构
const { login, logout } = auth
</script>

<template>
  <div v-if="isLoggedIn">
    Welcome, {{ userName }}
    <button @click="logout">Logout</button>
  </div>
  <LoginForm v-else @submit="login" />
</template>
```

### `$reset`、`$patch`、`$state`

```ts
const counter = useCounterStore()

// 重置到 state() 初始值（仅 Option Store 自动有；Setup Store 要自己实现）
counter.$reset()

// 批量修改（避免多次触发 watcher）
counter.$patch({ count: 10, name: 'New' })
counter.$patch((state) => {
  state.count++
  state.items.push({ id: Date.now() })
})

// 替换整个 state
counter.$state = { count: 100, name: 'Reset' }
```

### `$onAction` —— 监听 action

```ts
const cart = useCartStore()

const unsubscribe = cart.$onAction(({ name, store, args, after, onError }) => {
  console.log(`Calling ${name} with`, args)

  after((result) => {
    console.log(`${name} returned:`, result)
  })

  onError((err) => {
    console.error(`${name} failed:`, err)
  })
})

// 取消订阅
unsubscribe()
```

### `$subscribe` —— 监听 state

```ts
cart.$subscribe((mutation, state) => {
  console.log('mutation type:', mutation.type)   // 'direct' / 'patch object' / 'patch function'
  console.log('store id:', mutation.storeId)
  localStorage.setItem('cart', JSON.stringify(state))
}, {
  detached: true,    // 默认组件卸载时取消订阅；detached 后保留
})
```

### 持久化插件

```bash
pnpm add pinia-plugin-persistedstate
```

```ts
// main.ts
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

```ts
// stores/preferences.ts
export const usePreferencesStore = defineStore('prefs', () => {
  const theme = ref<'light' | 'dark'>('light')
  const lang = ref('zh-CN')
  return { theme, lang }
}, {
  persist: true,    // 自动 localStorage
})

// 自定义
export const useCartStore = defineStore('cart', () => {
  // ...
}, {
  persist: {
    storage: sessionStorage,
    pick: ['items'],     // 只持久化某些字段
    key: 'app:cart',
  },
})
```

### Store 间组合

```ts
export const useAuthStore = defineStore('auth', () => {
  const userStore = useUserStore()   // 引用另一个 store

  async function login(credentials) {
    const data = await fetch('/api/login', { method: 'POST', body: JSON.stringify(credentials) }).then(r => r.json())
    userStore.setUser(data.user)
  }

  return { login }
})
```

### SSR

Pinia 在 Nuxt 下用 `@pinia/nuxt` 模块自动 SSR-safe。手写 SSR 时：

```ts
// entry-server.ts
const pinia = createPinia()
app.use(pinia)
const ctx = { state: pinia.state.value }   // 把 state 序列化到 HTML

// entry-client.ts
const pinia = createPinia()
pinia.state.value = window.__INITIAL_STATE__   // 从 HTML 恢复
app.use(pinia)
```

## Vue Router 4

### 创建

```ts
// router/index.ts
import { createRouter, createWebHistory, createWebHashHistory, createMemoryHistory } from 'vue-router'

const router = createRouter({
  // 三种 history mode
  history: createWebHistory(),       // /path（推荐）
  // history: createWebHashHistory(), // /#/path（无服务端配置时用）
  // history: createMemoryHistory(),  // SSR / 测试用

  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
  ],
})

export default router
```

### 动态路由

```ts
const routes = [
  // 单参数
  { path: '/users/:id', component: UserView },

  // 多参数
  { path: '/users/:id/posts/:postId', component: UserPostView },

  // 可选参数（vue-router 4 新语法）
  { path: '/users/:id?', component: UsersView },

  // 通配（catch-all）
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },

  // 正则约束
  { path: '/users/:id(\\d+)', component: UserView },   // 只匹配数字
]
```

```vue
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.params.id)       // 当前 :id
console.log(route.params.pathMatch) // catch-all 的数组
</script>
```

### 嵌套路由

```ts
const routes = [
  {
    path: '/user/:id',
    component: UserLayout,
    children: [
      // /user/:id/profile
      { path: 'profile', component: UserProfile },
      // /user/:id/posts
      { path: 'posts', component: UserPosts },
      // /user/:id（默认子路由）
      { path: '', component: UserHome },
    ],
  },
]
```

```vue
<!-- UserLayout.vue -->
<template>
  <div class="user-layout">
    <UserSidebar />
    <main>
      <RouterView />     <!-- 子路由渲染在这里 -->
    </main>
  </div>
</template>
```

### 命名路由

```ts
const routes = [
  { path: '/users/:id', name: 'user', component: UserView },
]
```

```vue
<template>
  <!-- 通过 name + params -->
  <RouterLink :to="{ name: 'user', params: { id: 42 } }">User 42</RouterLink>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
router.push({ name: 'user', params: { id: 42 } })
</script>
```

### 命名视图

```ts
const routes = [
  {
    path: '/',
    components: {
      default: HomeView,
      sidebar: SidebarView,
      header: HeaderView,
    },
  },
]
```

```vue
<template>
  <RouterView name="header" />
  <RouterView name="sidebar" />
  <RouterView />   <!-- default -->
</template>
```

### 路由守卫

#### 全局前置守卫

```ts
router.beforeEach((to, from) => {
  // return undefined / true：放行
  // return false：取消导航
  // return '/login'：重定向
  // return { name: 'login' }：重定向（命名路由）

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

// 异步守卫
router.beforeEach(async (to) => {
  if (!user.loaded) {
    await user.fetchProfile()
  }
})
```

#### 全局解析守卫（在所有组件守卫之后跑）

```ts
router.beforeResolve(async (to) => {
  if (to.meta.requiresPermissions) {
    await checkPermissions(to.meta.requiresPermissions)
  }
})
```

#### 全局后置守卫（不影响导航）

```ts
router.afterEach((to, from, failure) => {
  if (!failure) {
    sendAnalytics({ from: from.fullPath, to: to.fullPath })
  }
})
```

#### 路由独享守卫

```ts
const routes = [
  {
    path: '/admin',
    component: AdminView,
    beforeEnter: (to, from) => {
      if (!user.isAdmin) return false
    },
  },
]
```

#### 组件内守卫

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

// 离开页面前（适合表单提示未保存）
onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    return confirm('Discard changes?')
  }
})

// 当前路由参数变化（如 /user/1 → /user/2，组件复用）
onBeforeRouteUpdate(async (to, from) => {
  if (to.params.id !== from.params.id) {
    await loadUser(to.params.id)
  }
})
</script>
```

### 路由 meta

```ts
const routes = [
  {
    path: '/admin',
    component: AdminView,
    meta: {
      requiresAuth: true,
      permissions: ['admin'],
      title: 'Admin Panel',
      keepAlive: true,
    },
  },
]
```

```ts
router.beforeEach((to) => {
  document.title = to.meta.title as string ?? 'My App'

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return '/login'
  }
})
```

类型扩展（让 `to.meta` 类型推导生效）：

```ts
// router/types.d.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    permissions?: string[]
    title?: string
    keepAlive?: boolean
  }
}
```

### 滚动行为

```ts
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 按浏览器前进 / 后退恢复滚动位置
    if (savedPosition) {
      return savedPosition
    }

    // hash 跳转滚到锚点
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }

    // 其它情况回到顶部
    return { top: 0 }
  },
})
```

### 懒加载

```ts
const routes = [
  // 动态 import
  { path: '/', component: () => import('@/views/HomeView.vue') },

  // 命名 chunk
  { path: '/admin', component: () => import(/* webpackChunkName: "admin" */ '@/views/AdminView.vue') },

  // 与 defineAsyncComponent 组合
  { path: '/dashboard', component: defineAsyncComponent({
    loader: () => import('@/views/Dashboard.vue'),
    loadingComponent: LoadingSpinner,
    delay: 200,
  }) },
]
```

### 过渡动画

```vue
<!-- App.vue -->
<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="route.meta.transition ?? 'fade'" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

## 异步组件

### `defineAsyncComponent` 基础

```ts
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
```

```vue
<template>
  <HeavyChart v-if="show" />
</template>
```

只在需要时下载 chunk。

### 完整选项

```ts
import { defineAsyncComponent } from 'vue'
import LoadingComponent from './Loading.vue'
import ErrorComponent from './Error.vue'

const AsyncChart = defineAsyncComponent({
  // 异步加载函数
  loader: () => import('./Chart.vue'),

  // 加载中显示
  loadingComponent: LoadingComponent,
  // 等待多久才显示 loading（默认 200ms，避免闪烁）
  delay: 200,

  // 加载失败显示
  errorComponent: ErrorComponent,
  // 多久未加载完算失败
  timeout: 10000,

  // 是否支持 Suspense
  suspensible: false,

  // 失败时如何处理
  onError(error, retry, fail, attempts) {
    if (attempts < 3) {
      retry()         // 重试
    } else {
      fail()          // 放弃 + 显示 errorComponent
    }
  },
})
```

### 配合 Suspense

```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <Loading />
    </template>
  </Suspense>
</template>
```

`Suspense` 等待内部所有 async setup 完成才显示 default slot，否则显示 fallback。

## `<Suspense>` 实验性

```vue
<!-- 子组件：async setup -->
<script setup lang="ts">
const data = await fetch('/api/x').then(r => r.json())
</script>
```

```vue
<!-- 父组件 -->
<template>
  <Suspense>
    <template #default>
      <UserProfile />
    </template>
    <template #fallback>
      <SkeletonLoader />
    </template>
  </Suspense>
</template>
```

::: warning Suspense 仍标记实验性

API 在未来版本可能调整。Nuxt 内部用了 Suspense 但官方不推荐直接用在生产组件——尤其与 `<KeepAlive>` / `<Transition>` 组合时有 edge case。

:::

## `<Teleport>` 传送门

把内部 DOM 「传送」到任意 DOM 节点（常用 `<body>`）：

```vue
<template>
  <!-- 在组件 DOM 树某处 -->
  <button @click="show = true">Open Modal</button>

  <!-- 内容渲染到 body 下 -->
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click="show = false">
      <div class="modal" @click.stop>
        <h2>Modal Title</h2>
        <p>Modal content</p>
        <button @click="show = false">Close</button>
      </div>
    </div>
  </Teleport>
</template>
```

适合：**Modal / Toast / Tooltip / Dropdown** —— 避免父容器 `overflow: hidden` / `z-index` / `transform` 创建新栈上下文影响层级。

### 完整选项

```vue
<template>
  <Teleport
    to="#some-id"
    :disabled="isMobile"
    :defer="true"
  >
    <div>...</div>
  </Teleport>
</template>
```

- `to`: CSS 选择器或 DOM 元素（必填）
- `disabled`: true 时跳过传送
- `defer` (3.5+): 推迟到当前渲染周期之后挂载（目标元素由 Teleport 自己后续渲染时用）

## `<Transition>` 过渡

### CSS 类名约定

`<Transition>` 在元素进入 / 离开时自动加 6 个 class：

```
v-enter-from   → v-enter-active   → v-enter-to
v-leave-from   → v-leave-active   → v-leave-to
```

```vue
<template>
  <button @click="show = !show">Toggle</button>
  <Transition>
    <p v-if="show">Hello</p>
  </Transition>
</template>

<style>
.v-enter-active, .v-leave-active {
  transition: opacity 0.3s ease;
}
.v-enter-from, .v-leave-to {
  opacity: 0;
}
</style>
```

### 命名 Transition

```vue
<template>
  <Transition name="fade">
    <p v-if="show">Hello</p>
  </Transition>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

类名变成 `fade-enter-from` / `fade-enter-active` / 等。

### `mode`

```vue
<Transition mode="out-in">    <!-- 先出后进（推荐路由切换） -->
<Transition mode="in-out">    <!-- 先进后出（重叠） -->
<Transition>                   <!-- 同时进出（默认） -->
```

### JS Hooks

```vue
<template>
  <Transition
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @enter-cancelled="onEnterCancelled"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
    @leave-cancelled="onLeaveCancelled"
    :css="false"
  >
    <div v-if="show" ref="el">Hello</div>
  </Transition>
</template>

<script setup>
function onEnter(el, done) {
  // 用 GSAP / anime.js 等
  gsap.from(el, {
    opacity: 0,
    y: 20,
    duration: 0.3,
    onComplete: done,    // 必须调 done
  })
}

function onLeave(el, done) {
  gsap.to(el, {
    opacity: 0,
    y: -20,
    duration: 0.3,
    onComplete: done,
  })
}
</script>
```

`:css="false"` 告诉 Vue 跳过 CSS 类检测，直接用 JS。

### 自定义过渡类

```vue
<template>
  <Transition
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__fadeOut"
  >
    <div v-if="show">Hello</div>
  </Transition>
</template>
```

配 Animate.css 用。

### `appear` —— 首次挂载触发

```vue
<Transition name="fade" appear>
  <p v-if="show">Hello</p>
</Transition>
```

默认 Transition 只在 `v-if` / `v-show` 切换时触发，加 `appear` 后首次渲染也触发。

## `<TransitionGroup>` 列表过渡

```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">{{ item.text }}</li>
  </TransitionGroup>
</template>

<style>
.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 移动时（已存在的项目重新排序）平滑过渡 */
.list-move {
  transition: transform 0.5s;
}

/* 离开时绝对定位避免占位 */
.list-leave-active {
  position: absolute;
}
</style>
```

`tag` 指定外层元素（默认 fragment）。`list-move` 是 FLIP 动画类，已存在项目位置变化时用。

## `<KeepAlive>` 组件缓存

```vue
<template>
  <KeepAlive>
    <component :is="currentView" />
  </KeepAlive>
</template>
```

被 KeepAlive 包裹的组件**不会被销毁**，切换时只是隐藏。

### 选项

```vue
<KeepAlive
  :include="['HomeView', 'AboutView']"        <!-- 仅缓存这些（按 name） -->
  :exclude="['NoCachePage']"                   <!-- 排除这些 -->
  :max="10"                                    <!-- 最多缓存 10 个 -->
>
  <component :is="currentView" />
</KeepAlive>
```

### 生命周期

被 KeepAlive 包裹的组件，生命周期变化：

```
首次：setup → beforeMount → mounted → activated
缓存切走：deactivated
缓存切回：activated
真销毁（被 KeepAlive 移除）：beforeUnmount → unmounted
```

```vue
<script setup>
import { onActivated, onDeactivated } from 'vue'

onActivated(() => {
  console.log('Component activated (entered cache view)')
})

onDeactivated(() => {
  console.log('Component deactivated (left view but still cached)')
})
</script>
```

适合：**列表 + 详情来回切换**，详情页保留滚动 / 表单状态。

## 组件库选型

### 主流 Vue 3 组件库对比

| 库 | 风格 | 适合 | 主仓库 |
|---|---|---|---|
| **Element Plus** | 桌面后台 | 中国系企业内部系统 | [element-plus/element-plus](https://github.com/element-plus/element-plus) |
| **Naive UI** | 现代极简 | 创业团队 / 个人项目 | [tusen-ai/naive-ui](https://github.com/tusen-ai/naive-ui) |
| **Vuetify** | Material Design | 跨设备 / Material 风格 | [vuetifyjs/vuetify](https://github.com/vuetifyjs/vuetify) |
| **Ant Design Vue** | 国际企业风 | 大型管理系统 | [vueComponent/ant-design-vue](https://github.com/vueComponent/ant-design-vue) |
| **Quasar** | 全能跨平台 | PWA / Hybrid / Electron | [quasarframework/quasar](https://github.com/quasarframework/quasar) |
| **Vant** | 移动端 | H5 / 小程序前端 | [youzan/vant](https://github.com/youzan/vant) |
| **PrimeVue** | 国际企业风 | Java / .NET 团队 | [primefaces/primevue](https://github.com/primefaces/primevue) |
| **Nuxt UI** | 现代 Tailwind | Nuxt 项目 | [nuxt/ui](https://github.com/nuxt/ui) |
| **shadcn-vue** | 抄写式 + Tailwind | 完全定制 | [unovue/shadcn-vue](https://github.com/unovue/shadcn-vue) |
| **Radix Vue / Reka UI** | Headless | 自定义样式 | [radix-vue/radix-vue](https://github.com/radix-vue/radix-vue) |

### 选择决策

```
项目类型？
├─ 中国企业内部后台 → Element Plus（成熟度 / 文档 / 社区都最好）
├─ 移动端 H5 → Vant
├─ Material 风格跨设备 → Vuetify
├─ 国际化大型企业系统 → Ant Design Vue / PrimeVue
├─ Nuxt 项目 → Nuxt UI（深度集成）
├─ Tailwind + 完全定制 → shadcn-vue / Radix Vue
└─ 个人项目 / 简洁现代 → Naive UI
```

### 与设计系统结合

如果团队有自家 design system，推荐：

1. **基于 Headless 库**（Radix Vue / Reka UI）做定制——无样式仅行为，套自己的 Token
2. **shadcn-vue 风格**——把组件源码 copy 进项目而非装包，完全可改
3. **避免重型库改样式**：Element Plus / Vuetify 等改样式工作量比从头写 wrapper 大

## VueUse —— 必装的工具库

```bash
pnpm add @vueuse/core
```

### 常用 composables

```ts
import {
  useEventListener,
  useStorage,
  useFetch,
  useDark,
  useMouse,
  useWindowSize,
  useDebouncedRef,
  useThrottleFn,
  useEventBus,
  useClipboard,
  useNetwork,
  useIntersectionObserver,
  useResizeObserver,
  useMediaQuery,
  useColorMode,
  useFavicon,
  useTitle,
  useScroll,
  useFocus,
  useKeyboardShortcut,
  useDateFormat,
  useTimeAgo,
} from '@vueuse/core'
```

### 例子：`useEventListener` —— 自动清理

```vue
<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

// 自动绑定 + onUnmounted 时清理
useEventListener(window, 'resize', () => {
  console.log('window resized')
})

useEventListener(document, 'click', (e) => {
  console.log('clicked', e.target)
})
</script>
```

### `useStorage` —— localStorage 响应式

```ts
import { useStorage } from '@vueuse/core'

// 双向同步 localStorage
const userPrefs = useStorage('user-prefs', {
  theme: 'light',
  lang: 'zh',
}, localStorage)   // 默认 localStorage，可换 sessionStorage

userPrefs.value.theme = 'dark'   // 自动写入
```

### `useDark` —— 暗黑模式

```ts
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)
```

```vue
<template>
  <button @click="toggleDark">
    {{ isDark ? '🌞' : '🌙' }}
  </button>
</template>
```

### `useFetch` —— 类型化 fetch

```ts
import { useFetch } from '@vueuse/core'

const url = ref('/api/users/1')
const { data, error, isFetching, execute } = useFetch(url, {
  immediate: true,
  refetch: true,   // url 变化自动重新拉
}).json<User>()
```

### `useEventBus` —— 跨组件事件

```ts
// composables/keys.ts
import { useEventBus } from '@vueuse/core'

export const refreshListBus = useEventBus<{ source: string }>('refresh-list')
```

```ts
// detailPage.vue —— 触发
refreshListBus.emit({ source: 'detail-save' })
```

```ts
// listPage.vue —— 监听
refreshListBus.on(({ source }) => {
  console.log('refresh from', source)
  loadList()
})
```

适合 keep-alive 列表 + 详情场景：详情保存后通知列表刷新，但不强行重新挂载列表组件。

### `useIntersectionObserver` —— 元素进入可视区

```ts
import { useIntersectionObserver } from '@vueuse/core'
import { ref } from 'vue'

const target = ref<HTMLElement | null>(null)
const isVisible = ref(false)

useIntersectionObserver(target, ([{ isIntersecting }]) => {
  isVisible.value = isIntersecting
})
```

适合：图片懒加载、无限滚动、动画触发。

## 渲染函数与 JSX

### `h` 函数

```ts
import { h } from 'vue'

// 等价 <div class="card"><h2>{{ title }}</h2></div>
const Card = (props: { title: string }) =>
  h('div', { class: 'card' }, [
    h('h2', null, props.title),
  ])
```

### JSX

需要装 `@vitejs/plugin-vue-jsx`：

```bash
pnpm add -D @vitejs/plugin-vue-jsx
```

```ts
// vite.config.ts
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
})
```

```tsx
// MyComponent.tsx
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(0)

    return () => (
      <div class="card">
        <h2>Count: {count.value}</h2>
        <button onClick={() => count.value++}>+1</button>
      </div>
    )
  },
})
```

JSX 适合：**渲染逻辑高度动态**（如组件库内部）、**与 React 项目共存**。日常业务推荐 SFC 模板。

## TypeScript 集成

### `<script setup lang="ts">` 基础

所有编译器宏自动支持 TS 类型：

```vue
<script setup lang="ts">
interface Props {
  user: User
  count?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: FormData]
  cancel: []
}>()
</script>
```

### `PropType` —— 运行时 + 类型

```ts
import { type PropType, defineComponent } from 'vue'

interface User {
  id: number
  name: string
}

defineComponent({
  props: {
    user: Object as PropType<User>,
    items: {
      type: Array as PropType<User[]>,
      required: true,
    },
    status: String as PropType<'idle' | 'loading' | 'done'>,
  },
})
```

### `ExtractPropTypes`

从 props 配置反推类型：

```ts
const propsDefinition = {
  user: Object as PropType<User>,
  count: { type: Number, default: 0 },
} as const

type Props = ExtractPropTypes<typeof propsDefinition>
// → { user?: User; count: number }
```

### Generic Component（3.3+）

```vue
<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  items: T[]
  onSelect: (item: T) => void
}>()
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id" @click="onSelect(item)">
      <slot :item="item" />
    </li>
  </ul>
</template>
```

```vue
<!-- 使用 -->
<TypedList :items="users" :on-select="onUserSelect">
  <template #default="{ item }">
    <!-- item 自动推导成 User 类型 -->
    {{ item.name }}
  </template>
</TypedList>
```

### Ref 类型

```ts
import { ref, type Ref } from 'vue'

// 自动推导
const count = ref(0)                          // Ref<number>
const user = ref<User | null>(null)            // Ref<User | null>

// 函数签名
function useFoo(items: Ref<string[]>) { ... }
```

### `vue-tsc` 检查

```bash
pnpm add -D vue-tsc
```

```json
// package.json
{
  "scripts": {
    "type-check": "vue-tsc --noEmit"
  }
}
```

`vue-tsc` 是 Vue SFC 的 TypeScript 检查器，普通 `tsc` 不认 `.vue` 文件。

### Volar / Vue Language Tools

VSCode 装 Vue (Volar) 扩展即可。Vue 3 时代统一用 Volar，**不要装 Vetur**（Vetur 是 Vue 2 时代的）。

::: tip Take Over Mode

让 Volar 接管 TS 服务（关闭 VSCode 内置 TS），减少 30%+ 内存占用 + 加速：

VSCode → Command Palette → "TypeScript: Disable TypeScript and JavaScript Language Features (Workspace)"

:::

## vite-plugin-vue 内部机制

简单了解 SFC 编译过程：

```
*.vue 文件
  ↓ @vitejs/plugin-vue
  - 解析 <template> → render function（含 patchFlag / hoisting 优化）
  - 解析 <script setup> → 普通 setup() + import / export
  - 解析 <style scoped> → 加 data-v-xxx 属性 + CSS rewrite
  ↓
  生成 .ts / .css 文件 → 走 Vite 普通 pipeline
  ↓
HMR：Vite 检测 .vue 变化 → 只热替换变化的部分（template / script / style）
```

::: tip 调试编译输出

VSCode 装 Vue (Volar) 扩展，右键 `.vue` 文件选「Show Compiled Vue Code」可看生成的 JS。理解 patchFlag / hoisting 时很有用。

:::

## 下一步

- 响应式底层 / Vapor / SSR / 性能 / 测试 / 自定义指令见 [指南 - 高级](./expert.md)
- 微前端 / 跨工具集成见 [指南 - 其他](./other.md)
