---
layout: doc
outline: [2, 3]
---

# 参考

> Vue Router 4.x API 速查。所有签名 / 类型 / 选项与官方文档对齐。

## 全部导出

```ts
// from 'vue-router'
import {
  // ===== 核心创建函数 =====
  createRouter,

  // ===== History 实现 =====
  createWebHistory,
  createWebHashHistory,
  createMemoryHistory,

  // ===== Composition API =====
  useRouter,
  useRoute,
  useLink,
  onBeforeRouteUpdate,
  onBeforeRouteLeave,

  // ===== 组件 =====
  RouterLink,
  RouterView,

  // ===== 工具函数 =====
  isNavigationFailure,
  loadRouteLocation,
  parseQuery,
  stringifyQuery,

  // ===== 常量 / 枚举 =====
  START_LOCATION,
  NavigationFailureType,

  // ===== 类型 =====
  type Router,
  type RouterOptions,
  type RouterHistory,
  type RouteRecordRaw,
  type RouteRecordNormalized,
  type RouteRecordInfo,
  type RouteLocationRaw,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  type RouteParams,
  type RouteMeta,
  type NavigationGuard,
  type NavigationGuardWithThis,
  type NavigationGuardNext,
  type NavigationGuardReturn,
  type NavigationHookAfter,
  type NavigationFailure,
  type RouterScrollBehavior,
  type ScrollPositionCoordinates,
  type ScrollPositionElement,
  type RouterLinkProps,
  type RouterViewProps,
  type UseLinkOptions,
  type UseLinkReturn,
  type LocationQuery,
  type LocationQueryRaw,
  type TypesConfig,
} from 'vue-router'
```

## 核心 API

### `createRouter()`

创建路由实例。

```ts
function createRouter(options: RouterOptions): Router
```

**用法**：

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
  ],
})

app.use(router)
```

### `createWebHistory()`

HTML5 标准 history 模式——干净 URL、需服务端 fallback。

```ts
function createWebHistory(base?: string): RouterHistory
```

**参数**：

- `base?: string` — 应用基准路径（如 `/myapp/`）

**用法**：

```ts
const router = createRouter({
  history: createWebHistory('/myapp/'),
  routes,
})

// Vite 项目常用
history: createWebHistory(import.meta.env.BASE_URL),
```

### `createWebHashHistory()`

Hash 模式——URL 带 `#`、无需服务端配置、SEO 差。

```ts
function createWebHashHistory(base?: string): RouterHistory
```

**用法**：

```ts
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// URL 形如：https://example.com/#/users/1
```

### `createMemoryHistory()`

内存 history——不与浏览器同步、用于 SSR / 单元测试 / Electron。

```ts
function createMemoryHistory(base?: string): RouterHistory
```

**用法**：

```ts
// SSR
const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
await router.push(req.url)
await router.isReady()

// 单元测试
const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
```

## Composition API

### `useRouter()`

返回当前路由实例。

```ts
function useRouter(): Router
```

**用法**：

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

router.push('/users/1')
router.replace('/login')
router.back()
router.go(-2)
</script>
```

> **必须在 `<script setup>` 顶层或 `setup()` 函数内调用**——不能在异步回调中调用。

### `useRoute()`

返回当前路由对象（reactive）。

```ts
function useRoute(): RouteLocationNormalizedLoaded
```

**用法**：

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, watch } from 'vue'

const route = useRoute()

// 直接读
console.log(route.path)
console.log(route.params.id)

// computed
const fullName = computed(() => `${route.params.first} ${route.params.last}`)

// watch（只 watch 特定字段）
watch(() => route.params.id, (newId) => fetchUser(newId))
</script>
```

### `useLink()`

暴露 RouterLink 内部状态——用于构建自定义 link 组件。

```ts
function useLink(props: UseLinkOptions): UseLinkReturn
```

**`UseLinkOptions`**：

```ts
interface UseLinkOptions {
  to: MaybeRef<RouteLocationRaw>
  replace?: MaybeRef<boolean>
}
```

**`UseLinkReturn`**：

```ts
interface UseLinkReturn {
  route: ComputedRef<RouteLocationNormalized>  // 解析后的目标路由
  href: ComputedRef<string>                     // 链接 href
  isActive: ComputedRef<boolean>                // 是否激活
  isExactActive: ComputedRef<boolean>           // 是否完全匹配
  navigate: (e?: MouseEvent) => Promise<NavigationFailure | void | undefined>
}
```

**用法**：

```vue
<!-- AppLink.vue 自定义 RouterLink -->
<script setup lang="ts">
import { RouterLink, useLink } from 'vue-router'

const props = defineProps({
  ...RouterLink.props,
  inactiveClass: String,
})

const { isActive, isExactActive, href, navigate } = useLink(props)
</script>

<template>
  <a
    :href="href"
    :class="isExactActive ? 'active-exact' : isActive ? 'active' : inactiveClass"
    @click.prevent="navigate"
  >
    <slot />
  </a>
</template>
```

### `onBeforeRouteUpdate()`

组件内守卫——路由切换但组件复用时触发。

```ts
function onBeforeRouteUpdate(guard: NavigationGuard): void
```

**用法**：

```vue
<script setup lang="ts">
import { onBeforeRouteUpdate } from 'vue-router'

onBeforeRouteUpdate(async (to, from) => {
  if (to.params.id !== from.params.id) {
    await fetchData(to.params.id)
  }
  // 返回 false 取消导航 / location 对象重定向 / undefined 允许
})
</script>
```

### `onBeforeRouteLeave()`

组件内守卫——离开当前路由前触发。

```ts
function onBeforeRouteLeave(guard: NavigationGuard): void
```

**用法**：

```vue
<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import { ref } from 'vue'

const hasUnsavedChanges = ref(false)

onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('有未保存的修改，确定离开？')
    if (!answer) return false
  }
})
</script>
```

## 组件

### `<RouterView>`

路由出口——渲染当前匹配的组件。

**Props**：

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `name` | `string` | `'default'` | 命名视图的名称（配合 `components: { name: X }`） |
| `route` | `RouteLocationNormalized` | 当前 route | 强制渲染指定路由的组件（罕用） |

**Slot**：

```ts
interface RouterViewSlots {
  default: (props: { Component: VNode; route: RouteLocationNormalized }) => VNode
}
```

**用法**：

```vue
<template>
  <!-- 基本 -->
  <RouterView />

  <!-- 命名视图 -->
  <RouterView name="sidebar" />

  <!-- v-slot 完整解构 -->
  <RouterView v-slot="{ Component, route }">
    <Transition :name="route.meta.transition as string">
      <KeepAlive>
        <component :is="Component" :key="route.path" />
      </KeepAlive>
    </Transition>
  </RouterView>
</template>
```

### `<RouterLink>`

路由导航链接——渲染为 `<a>` 标签 + 拦截点击。

**Props**：

```ts
interface RouterLinkProps {
  to: RouteLocationRaw                  // 必填——目标
  replace?: boolean                     // 用 router.replace 而非 push
  activeClass?: string                  // 激活时的 CSS 类（默认 router-link-active）
  exactActiveClass?: string             // 完全匹配时的 CSS 类（默认 router-link-exact-active）
  custom?: boolean                      // 不渲染 <a>—— v-slot 自定义
  ariaCurrentValue?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'
  viewTransition?: boolean              // 集成 View Transitions API
}
```

**Slot props**（仅 `custom` 时）：

```ts
interface RouterLinkSlot {
  route: RouteLocationNormalized
  href: string
  isActive: boolean
  isExactActive: boolean
  navigate: (event?: MouseEvent) => Promise<void>
}
```

**用法**：

```vue
<template>
  <!-- 字符串 to -->
  <RouterLink to="/users/1">用户 1</RouterLink>

  <!-- 对象 to -->
  <RouterLink :to="{ name: 'user', params: { id: 1 } }">用户 1</RouterLink>

  <!-- 自定义渲染 -->
  <RouterLink to="/users/1" custom v-slot="{ href, navigate, isActive }">
    <button :class="{ active: isActive }" @click="navigate">
      <a :href="href">用户 1</a>
    </button>
  </RouterLink>
</template>
```

## Router 实例

### Router 接口

```ts
interface Router {
  // ===== 属性 =====
  readonly currentRoute: Ref<RouteLocationNormalizedLoaded>
  readonly options: RouterOptions

  // ===== 导航方法 =====
  push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
  replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
  back(): void
  forward(): void
  go(delta: number): void

  // ===== 路由管理 =====
  addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void
  addRoute(route: RouteRecordRaw): () => void
  removeRoute(name: RouteRecordName): void
  hasRoute(name: RouteRecordName): boolean
  getRoutes(): RouteRecordNormalized[]

  // ===== 守卫注册 =====
  beforeEach(guard: NavigationGuardWithThis<undefined>): () => void
  beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void
  afterEach(guard: NavigationHookAfter): () => void

  // ===== 错误处理 =====
  onError(handler: (error: any) => any): () => void

  // ===== 工具 =====
  resolve(to: RouteLocationRaw, currentLocation?: RouteLocationNormalizedLoaded): RouteLocation & { href: string }
  isReady(): Promise<void>

  // ===== Vue 插件 =====
  install(app: App): void
}
```

### `router.push()`

导航到新 URL（推入历史栈）。

```ts
function push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
```

**用法**：

```ts
// 字符串
await router.push('/users/1')

// 对象
await router.push({ path: '/users/1' })
await router.push({ name: 'user', params: { id: 1 } })
await router.push({ path: '/search', query: { q: 'vue' } })
await router.push({ path: '/about', hash: '#team' })

// 组合
await router.push({
  name: 'user',
  params: { id: 1 },
  query: { tab: 'posts' },
  hash: '#header',
  replace: false,  // 等价于 router.push
})
```

### `router.replace()`

替换当前历史栈（不留后退记录）。

```ts
function replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
```

### `router.back()` / `router.forward()` / `router.go()`

```ts
function back(): void
function forward(): void
function go(delta: number): void

router.back()      // 后退一步（= go(-1)）
router.forward()   // 前进一步（= go(1)）
router.go(2)       // 前进 2 步
router.go(-3)      // 后退 3 步
```

### `router.addRoute()` / `router.removeRoute()`

```ts
function addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void
function addRoute(route: RouteRecordRaw): () => void
function removeRoute(name: RouteRecordName): void
```

**用法**：

```ts
// 添加顶级路由
const remove = router.addRoute({
  path: '/admin',
  name: 'admin',
  component: () => import('@/views/Admin.vue'),
})

// 添加子路由（第一参数 = 父 name）
router.addRoute('admin', {
  path: 'users',
  component: AdminUsers,
})

// 删除
remove()                  // 通过返回的清理函数
router.removeRoute('admin') // 或通过 name
```

### `router.hasRoute()` / `router.getRoutes()`

```ts
function hasRoute(name: RouteRecordName): boolean
function getRoutes(): RouteRecordNormalized[]
```

**用法**：

```ts
if (router.hasRoute('admin')) {
  router.removeRoute('admin')
}

const allRoutes = router.getRoutes()
console.log(allRoutes.length)
```

### `router.beforeEach()` / `beforeResolve()` / `afterEach()`

```ts
function beforeEach(guard: NavigationGuard): () => void
function beforeResolve(guard: NavigationGuard): () => void
function afterEach(hook: NavigationHookAfter): () => void
```

返回**取消注册的函数**——用于动态卸载守卫。

**用法**：

```ts
// 注册
const unregisterBeforeEach = router.beforeEach((to, from) => { /* ... */ })
const unregisterAfterEach = router.afterEach((to, from, failure) => { /* ... */ })

// 取消
unregisterBeforeEach()
unregisterAfterEach()
```

### `router.isReady()`

返回 Promise——等待初始导航完成（用于 SSR / 测试 / 首屏 transition）。

```ts
function isReady(): Promise<void>
```

**用法**：

```ts
const app = createApp(App)
app.use(router)
await router.isReady()
app.mount('#app')
```

### `router.resolve()`

把 `RouteLocationRaw` 解析为完整的路由对象——不触发导航。

```ts
function resolve(
  to: RouteLocationRaw,
  currentLocation?: RouteLocationNormalizedLoaded
): RouteLocation & { href: string }
```

**用法**：

```ts
const resolved = router.resolve({ name: 'user', params: { id: 1 } })
console.log(resolved.href)        // '/users/1'
console.log(resolved.fullPath)    // '/users/1'
console.log(resolved.matched)     // 匹配的路由记录
```

### `router.onError()`

注册全局错误处理器——守卫抛错 / 异步组件加载失败时触发。

```ts
function onError(handler: (error: any, to: RouteLocationNormalized, from: RouteLocationNormalized) => any): () => void
```

**用法**：

```ts
router.onError((err) => {
  console.error('路由错误', err)
  // 上报 sentry / showToast
})
```

## RouterOptions

```ts
interface RouterOptions {
  history: RouterHistory                              // 必填
  routes: readonly RouteRecordRaw[]                  // 必填
  scrollBehavior?: RouterScrollBehavior
  parseQuery?: (search: string) => LocationQuery
  stringifyQuery?: (query: LocationQueryRaw) => string
  linkActiveClass?: string                            // 默认 'router-link-active'
  linkExactActiveClass?: string                       // 默认 'router-link-exact-active'
  strict?: boolean                                    // 严格模式（默认 false——允许尾斜杠）
  sensitive?: boolean                                 // 大小写敏感（默认 false）
  end?: boolean                                       // 已废弃——使用 strict
}
```

### `scrollBehavior`

```ts
type RouterScrollBehavior = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  savedPosition: ScrollPosition | null
) => Awaitable<ScrollPosition | false | void>
```

**返回值**：

```ts
// 滚动到坐标
{ top: 0, left: 0, behavior: 'smooth' }

// 滚动到元素
{ el: '#section', top: 60, behavior: 'smooth' }

// 保留位置（前进 / 后退时）
savedPosition  // 浏览器记忆的位置

// 不滚动
return false
```

**完整示例**：

```ts
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 60 }
    }
    return { top: 0 }
  },
})
```

## RouteRecordRaw

路由记录——传给 `routes` 数组的元素。

```ts
type RouteRecordRaw =
  | RouteRecordSingleView         // 单视图
  | RouteRecordMultipleViews      // 多视图（components）
  | RouteRecordRedirect           // 重定向

interface RouteRecordSingleView {
  path: string
  name?: RouteRecordName
  component: RawRouteComponent | (() => Promise<RawRouteComponent>)
  components?: never
  redirect?: never
  alias?: string | readonly string[]
  children?: RouteRecordRaw[]
  meta?: RouteMeta
  props?: boolean | Record<string, any> | ((route: RouteLocationNormalized) => Record<string, any>)
  beforeEnter?: NavigationGuard | readonly NavigationGuard[]
  sensitive?: boolean
  strict?: boolean
}

interface RouteRecordMultipleViews {
  path: string
  name?: RouteRecordName
  components: Record<string, RawRouteComponent | (() => Promise<RawRouteComponent>)>
  component?: never
  // ... 其他与 SingleView 相同
  props?: boolean | Record<string, boolean | Record<string, any> | ((route) => any)>
}

interface RouteRecordRedirect {
  path: string
  redirect: RouteLocationRaw | ((to: RouteLocationNormalized) => RouteLocationRaw)
  name?: RouteRecordName
  meta?: RouteMeta
  // 不能有 component / components / children
}
```

**完整示例**：

```ts
const routes: RouteRecordRaw[] = [
  // 单视图
  {
    path: '/users/:id(\\d+)',
    name: 'user',
    component: () => import('@/views/User.vue'),
    props: true,
    meta: { requiresAuth: true },
    beforeEnter: (to, from) => { /* ... */ },
    alias: ['/profile/:id', '/u/:id'],
    children: [
      { path: '', name: 'user-home', component: UserHome },
      { path: 'posts', name: 'user-posts', component: UserPosts },
    ],
  },

  // 多视图
  {
    path: '/dashboard',
    components: {
      default: Dashboard,
      sidebar: DashboardSidebar,
      footer: DashboardFooter,
    },
    props: {
      default: true,
      sidebar: false,
      footer: (route) => ({ year: 2026 }),
    },
  },

  // 重定向
  {
    path: '/home',
    redirect: { name: 'user-home' },
  },

  // catch-all
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
  },
]
```

## RouteLocationNormalized

当前路由对象（`useRoute()` / `route.beforeEach(to, from)` 中的 `to` / `from`）。

```ts
interface RouteLocationNormalized {
  path: string                       // /users/1
  fullPath: string                   // /users/1?tab=posts#header
  hash: string                       // '#header'
  query: LocationQuery               // { tab: 'posts' }
  params: RouteParams                // { id: '1' }
  matched: RouteRecordNormalized[]   // 匹配的路由层级（父→子）
  meta: RouteMeta                    // 合并后的 meta
  name?: RouteRecordName             // 'user'
  redirectedFrom?: RouteLocationNormalized  // 如果从重定向而来
}
```

```ts
// 子接口：RouteLocationNormalizedLoaded（包含完全解析的组件）
interface RouteLocationNormalizedLoaded extends RouteLocationNormalized {
  matched: RouteRecordNormalizedLoaded[]  // 组件已加载
}
```

**用法**：

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

console.log(route.path)         // /users/1
console.log(route.fullPath)     // /users/1?tab=posts#header
console.log(route.params.id)    // '1'
console.log(route.query.tab)    // 'posts'
console.log(route.hash)         // '#header'
console.log(route.name)         // 'user'
console.log(route.meta.title)   // meta 中的字段

// matched：所有匹配的路由层级
route.matched.forEach(record => {
  console.log(record.path, record.meta)
})

// 是否从重定向来
if (route.redirectedFrom) {
  console.log('从', route.redirectedFrom.path, '重定向')
}
</script>
```

## RouteLocationRaw

`router.push()` / `RouterLink to` 的参数类型——可以是字符串或对象。

```ts
type RouteLocationRaw = string | RouteLocationPathRaw | RouteLocationNamedRaw

interface RouteLocationPathRaw {
  path: string                       // 必填
  query?: LocationQueryRaw
  hash?: string
  replace?: boolean
  // params 在 path 形式下会被忽略
}

interface RouteLocationNamedRaw {
  name: RouteRecordName              // 必填
  params?: RouteParamsRaw
  query?: LocationQueryRaw
  hash?: string
  replace?: boolean
}
```

## 守卫类型

### `NavigationGuard`

```ts
type NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next?: NavigationGuardNext  // 已废弃，推荐返回值
) => NavigationGuardReturn | Promise<NavigationGuardReturn>

type NavigationGuardReturn =
  | void
  | Error
  | boolean
  | RouteLocationRaw
```

**返回值含义**：

| 返回值 | 含义 |
|---|---|
| `undefined` / `true` | 允许导航 |
| `false` | 取消导航 |
| `RouteLocationRaw` | 重定向 |
| `Error` 或 `throw` | 取消 + 触发 `onError` |

### `NavigationHookAfter`

```ts
type NavigationHookAfter = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  failure?: NavigationFailure | void
) => any
```

`afterEach` 不能取消导航——只用于副作用。

### `NavigationGuardNext`（已废弃）

```ts
type NavigationGuardNext = {
  (): void                                          // 允许
  (error: Error): void                              // 错误
  (location: RouteLocationRaw): void                // 重定向
  (valid: boolean): void                            // 取消（false）
  (cb: NavigationGuardNextCallback): void           // 组件内 beforeRouteEnter 回调
}
```

**v4 推荐返回值替代 `next()`**，但 `beforeRouteEnter` 仍可用 `next(vm => ...)` 拿到组件实例。

## 导航失败

### `NavigationFailureType`

```ts
enum NavigationFailureType {
  aborted = 4,      // 守卫 return false
  cancelled = 8,    // 新导航中断了当前
  duplicated = 16,  // 目标 = 当前
}
```

### `NavigationFailure`

```ts
interface NavigationFailure extends Error {
  type: NavigationFailureType
  from: RouteLocationNormalized
  to: RouteLocationNormalized
}
```

### `isNavigationFailure()`

```ts
function isNavigationFailure(
  failure: any,
  type?: NavigationFailureType
): failure is NavigationFailure
```

**用法**：

```ts
import { NavigationFailureType, isNavigationFailure } from 'vue-router'

const failure = await router.push('/users/1')

if (isNavigationFailure(failure)) {
  // 任意失败
}

if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
  // 守卫取消
}

if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
  // 同 URL
}
```

## 常量

### `START_LOCATION`

初始路由位置——`router.currentRoute.value === START_LOCATION` 时表示尚未导航。

```ts
const START_LOCATION: RouteLocationNormalizedLoaded
```

**用法**：

```ts
import { START_LOCATION } from 'vue-router'

router.beforeEach((to, from) => {
  if (from === START_LOCATION) {
    // 首次导航
  }
})
```

## 工具函数

### `parseQuery()` / `stringifyQuery()`

```ts
function parseQuery(search: string): LocationQuery
function stringifyQuery(query: LocationQueryRaw): string
```

**用法**：

```ts
import { parseQuery, stringifyQuery } from 'vue-router'

parseQuery('q=vue&page=2')  // { q: 'vue', page: '2' }
stringifyQuery({ q: 'vue', page: 2 })  // 'q=vue&page=2'
```

可在 `RouterOptions` 中传入自定义版本（如 [qs](https://github.com/ljharb/qs) 库）：

```ts
import qs from 'qs'

createRouter({
  // ...
  parseQuery: qs.parse,
  stringifyQuery: qs.stringify,
})
```

### `loadRouteLocation()`

加载路由的所有异步组件（懒加载 + 异步守卫）——用于 SSR 提前加载。

```ts
function loadRouteLocation(location: RouteLocation): Promise<RouteLocationNormalized>
```

## TypeScript 类型扩展

### Route Meta 扩展

```ts
// src/types/router.d.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresRole?: 'user' | 'admin'
    title?: string
    keepAlive?: boolean
    transition?: string
    icon?: string
  }
}

export {}
```

使用：

```ts
router.beforeEach((to) => {
  if (to.meta.requiresAuth) { /* TS 知道类型 */ }
})
```

### Typed Routes 扩展（v4.4+）

```ts
// src/types/router.d.ts
import 'vue-router'
import type { RouteRecordInfo } from 'vue-router'

export interface RouteNamedMap {
  home: RouteRecordInfo<
    'home',
    '/',
    Record<never, never>,
    Record<never, never>,
    never
  >
  user: RouteRecordInfo<
    'user',
    '/users/:id',
    { id: string | number },
    { id: string },
    never
  >
}

declare module 'vue-router' {
  interface TypesConfig {
    RouteNamedMap: RouteNamedMap
  }
}
```

使用：

```ts
router.push({ name: 'user', params: { id: 1 } })  // ✅ TS 校验
router.push({ name: 'usr' })                       // ❌ 错误：name 不存在

const route = useRoute('user')                     // 类型化 useRoute
route.params.id                                    // ✅ string
```

> **推荐**：手动维护 `RouteNamedMap` 不现实——配 [unplugin-vue-router](https://uvr.esm.is/) 自动生成。

## 完整 createRouter 示例

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardLayout.vue'),
    meta: { requiresAuth: true, title: '工作台' },
    children: [
      { path: '', name: 'dashboard-home', component: () => import('@/views/DashboardHome.vue') },
      { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue') },
      {
        path: 'users/:id',
        name: 'user-detail',
        component: () => import('@/views/UserDetailView.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '404' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 60 }
    return { top: 0 }
  },
})

// 全局前置守卫
router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }
})

// 全局后置 hook
router.afterEach((to, from, failure) => {
  document.title = (to.meta.title as string) ?? 'App'
  if (failure) {
    console.warn('导航失败', failure)
  }
})

// 错误处理
router.onError((err) => {
  console.error('路由错误', err)
})

export default router
```

## 与 v3 (Vue 2) 差异速查

| 维度 | v3 (Vue 2) | v4 (Vue 3) |
|---|---|---|
| 创建 | `new VueRouter({ ... })` | `createRouter({ ... })` |
| History | `mode: 'history' / 'hash'` | `history: createWebHistory()` |
| 通配 | `path: '*'` | `path: '/:pathMatch(.*)*'` |
| 守卫返回 | `next()` 回调 | 返回值（推荐） |
| `<router-link>` | tag prop / event prop | custom + v-slot |
| `<router-view>` | 无 v-slot | 支持 v-slot |
| Composition | `this.$router` | `useRouter()` / `useRoute()` |
| Async 组件 | 函数返回 Promise | 同（**不能用 `defineAsyncComponent`**） |

详细迁移指南见 [官方文档](https://router.vuejs.org/guide/migration/)。

## 相关链接

- [Vue Router 官网](https://router.vuejs.org/)
- [中文文档](https://router.vuejs.org/zh/)
- [GitHub 仓库](https://github.com/vuejs/router)
- [unplugin-vue-router](https://uvr.esm.is/) — 文件系统路由 + Typed Routes 自动化
- [Data Loaders RFC](https://github.com/vuejs/rfcs/discussions/700) — v5 试验性数据加载
