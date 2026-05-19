---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Vue Router 4.x**（最新稳定 **v4.5+**，要求 **Vue 3.x**）编写。Vue 2 项目请使用 Vue Router 3.x（仅维护、不再新增特性）。

## 速查

- 系统要求：**Vue 3.x**（推荐 3.4+） + **Node 18+** + 推荐 **TypeScript 5+**
- 安装：`pnpm add vue-router` / `npm install vue-router` / `yarn add vue-router`
- create-vue 脚手架：`pnpm create vue@latest` → 选 Router: Yes 自动配好
- 创建实例：`createRouter({ history, routes })`
- History 模式：`createWebHistory()` HTML5 / `createWebHashHistory()` Hash / `createMemoryHistory()` SSR
- 注册：`app.use(router)`（必须在 `app.mount()` 之前）
- 路径参数：`{ path: '/users/:id', component: User }` 中 `:id` 用 `route.params.id` 读取
- 命名路由：`{ path: '/users/:id', name: 'user', component: User }`
- 编程式：`router.push('/users/1')` / `router.push({ name: 'user', params: { id: 1 } })`
- Composition API：`const router = useRouter()` 拿路由实例 / `const route = useRoute()` 拿当前路由
- 模板访问：`$route.path` / `$route.params.id` / `$route.query.q`
- 监听 params：`watch(() => route.params.id, (newId) => ...)`（**不要直接 watch 整个 route 对象**）
- RouterLink：`<RouterLink to="/users/1">` / `<RouterLink :to="{ name: 'user', params: { id: 1 }}">`
- RouterView：`<RouterView />` 渲染当前路由组件
- 命名导出：`vue-router` 导出函数全部命名导出（无默认导出）

## Vue Router 是什么

Vue Router 是 **Vue.js 官方御用路由库**——提供 SPA（Single Page Application）的客户端路由能力，把浏览器 URL 与 Vue 组件树绑定。Vue Router 与 Vue 同一团队开发、共享发布节奏：

- **Vue 3 + Composition API** 必须用 **Vue Router 4.x**（最新稳定版）
- **Vue 2** 用 **Vue Router 3.x**（仅维护、不接新特性）
- **Vue Router 5.x** 实验性、与 v4 共享文档与大部分 API、新增 [Data Loaders](https://uvr.esm.is/data-loaders/) 接口
- **作者**：Eduardo San Martin Morote（同时也是 Pinia 作者、Vue 核心团队成员）

Vue Router 与 React Router / TanStack Router / Next.js App Router 的本质差异：

| 维度 | Vue Router 4 | React Router 7 | TanStack Router | Next.js App Router |
|---|---|---|---|---|
| 阵营 | **Vue 官方** | React 社区 | 跨框架（React/Solid） | Next.js / Vercel |
| 配置 | 配置式（手写 routes） | Data Routers（配置 / 文件） | 文件 + 类型生成 | 100% 文件系统 |
| 类型化 | Typed Routes 试验 + unplugin | 中等 | **极致类型安全** | 中等 |
| 数据加载 | watcher / Data Loaders 试验 | Loader / Action | Loader / Action | Server Components |
| SSR | Nuxt 集成 | 内置 | 内置 | 一等 |
| Bundle | ~10KB gzip | ~15KB | ~15KB | 大（含 Next 框架） |
| 学习曲线 | **平**（配置直观） | 中（v7 学 Loader） | 陡（编译期类型） | 陡（RSC 心智） |
| Vue 反应式 | **深度集成**（route 自动响应） | - | - | - |

**含义**：

- Vue Router 4 的「**配置驱动 + Composition API + Vue Reactivity**」三件套是 Vue 生态独有
- 与 TanStack Router / Next.js 比 Vue Router **更轻量、配置更直观、上手最快**——但**类型化能力**需要 unplugin-vue-router 补齐
- 与 React Router 7 比 Vue Router **数据加载方案不如 RR7 内置 Loader 完善**——目前 v5 的 Data Loaders 仍试验性、社区还在用 watcher 自行管理
- **适合**：99% 的 Vue 3 项目——这不是吹捧、是 Vue 官方推荐的**默认选择**

## 安装

### 在新项目中（推荐：create-vue 脚手架）

```bash
pnpm create vue@latest
# 或：npm create vue@latest / yarn create vue / bun create vue@latest
```

交互式菜单选 **Router: Yes** + **TypeScript: Yes**：

```
✔ Add TypeScript? … Yes
✔ Add Vue Router for Single Page Application development? … Yes
```

完成后 `package.json` 已含 `vue-router`、`src/router/index.ts` 已生成、`main.ts` 已注册——可以直接跳到「第一个 Router」。

### 在已有项目中安装

```bash
pnpm add vue-router
# 或：npm install vue-router / yarn add vue-router / bun add vue-router
```

Vue 版本要求：

| Vue 版本 | Vue Router 版本 |
|---|---|
| **Vue 3.x** | **Vue Router 4.x**（推荐） |
| Vue 2.x | Vue Router 3.x（仅维护） |

> Vue Router 4 已**正式停止支持 Vue 2**——如果维护 Vue 2 项目，使用 [Vue Router 3.x 文档](https://v3.router.vuejs.org/)。

### CDN 方式

ES Module（推荐）：

```html
<script type="importmap">
  {
    "imports": {
      "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js",
      "vue-router": "https://unpkg.com/vue-router@4/dist/vue-router.esm-browser.js"
    }
  }
</script>

<script type="module">
  import { createApp } from 'vue'
  import { createRouter, createWebHashHistory } from 'vue-router'
  // ...
</script>
```

Global 全局变量：

```html
<script src="https://unpkg.com/vue@3"></script>
<script src="https://unpkg.com/vue-router@4"></script>
<script>
  const { createRouter, createWebHashHistory } = VueRouter
</script>
```

> 生产环境建议**锁定版本号**（如 `vue-router@4.5.0`）而非 `@4`——避免 CDN 提供方默认指向最新版本造成不一致。

## 第一个 Router

### 项目结构

推荐目录结构：

```
src/
├── router/
│   └── index.ts        # 路由配置
├── views/              # 路由级组件
│   ├── HomeView.vue
│   └── AboutView.vue
├── App.vue             # 根组件（含 <RouterView />）
└── main.ts             # 注册 router
```

### 创建路由实例

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'

const router = createRouter({
  // history 模式（推荐 createWebHistory，即 HTML5 模式）
  history: createWebHistory(import.meta.env.BASE_URL),

  // 路由表
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // 懒加载——访问时才加载
      component: () => import('@/views/AboutView.vue'),
    },
  ],
})

export default router
```

**核心概念**：

- `path`：URL 路径（**必填**，以 `/` 开头）
- `name`：命名路由的名称（可选但**强烈推荐**——用于 `router.push({ name })` 跳转）
- `component`：路由匹配时渲染的组件
- `import.meta.env.BASE_URL`：Vite 的 base URL（与 `vite.config.ts` 的 `base` 选项一致）

### 在 main.ts 中注册

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

**注意顺序**：`app.use(router)` 必须在 `app.mount()` **之前**调用——否则组件中 `useRouter()` 会拿不到实例。

### App.vue 中添加 RouterView

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink> |
      <RouterLink to="/about">About</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>
```

**两个核心组件**：

- `<RouterView />`：路由出口——当前匹配的路由组件渲染到这里
- `<RouterLink to="...">`：声明式导航——渲染为 `<a>` 标签 + 拦截点击触发 `router.push()`

启动后访问 `/` 渲染 `HomeView`、访问 `/about` 渲染 `AboutView`——这就是 SPA。

## RouterLink 与 RouterView

### RouterLink 基本用法

```vue
<template>
  <!-- 字符串路径 -->
  <RouterLink to="/users">用户列表</RouterLink>

  <!-- 对象路径 -->
  <RouterLink :to="{ path: '/users' }">用户列表</RouterLink>

  <!-- 命名路由（推荐——避免硬编码 path） -->
  <RouterLink :to="{ name: 'user', params: { id: 1 } }">用户 1</RouterLink>

  <!-- 带 query -->
  <RouterLink :to="{ path: '/search', query: { q: 'vue' } }">搜索</RouterLink>

  <!-- 带 hash -->
  <RouterLink :to="{ path: '/about', hash: '#team' }">团队</RouterLink>
</template>
```

> **推荐用命名路由 + params**：避免在多个地方硬编码 `/users/1` 这种字符串——路径变更只需修改路由表一处。

### RouterLink 常用 props

| Prop | 类型 | 说明 |
|---|---|---|
| `to` | `string \| RouteLocationRaw` | 目标路由（**必填**） |
| `replace` | `boolean` | 用 `router.replace()` 不留历史 |
| `activeClass` | `string` | 当前路由匹配时的 CSS 类（默认 `router-link-active`） |
| `exactActiveClass` | `string` | 完全匹配时的 CSS 类（默认 `router-link-exact-active`） |
| `custom` | `boolean` | 不渲染 `<a>` 标签 + v-slot 自定义 |
| `ariaCurrentValue` | `string` | aria-current 值（默认 `'page'`） |

### Active 类名

```vue
<template>
  <RouterLink to="/users" active-class="text-blue">用户</RouterLink>
</template>

<style>
/* 默认类名 */
.router-link-active {
  font-weight: bold;
}
.router-link-exact-active {
  color: blue;
}
</style>
```

**区别**：

- `router-link-active`：**包含匹配**——`/users/1` 当前路由时，`/users` 链接也会激活（祖先链接）
- `router-link-exact-active`：**完全匹配**——只在路径完全相同时激活

### 全局自定义 active 类

```ts
const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'text-blue',
  linkExactActiveClass: 'text-blue-bold',
})
```

### RouterLink 名称约定

VS Code / IDE 中两种写法等价：

```vue
<template>
  <RouterLink to="/">Home</RouterLink>
  <router-link to="/">Home</router-link>
</template>
```

> **HTML 模板（in-DOM）只能用 kebab-case**：`<router-link>`、`<router-view>`——浏览器 HTML 解析器对 PascalCase 不敏感。

### RouterView 基本用法

```vue
<template>
  <RouterView />
</template>
```

匹配路由的组件会渲染到 `<RouterView />` 位置。嵌套路由用嵌套 `<RouterView />`：

```vue
<!-- views/UserLayout.vue -->
<template>
  <div>
    <h2>User Layout</h2>
    <!-- 子路由出口 -->
    <RouterView />
  </div>
</template>
```

## 动态路由参数

### 定义参数

```ts
const routes = [
  // 单参数
  { path: '/users/:id', name: 'user', component: UserView },

  // 多参数
  { path: '/users/:userId/posts/:postId', component: UserPost },
]
```

`:id` 是**路径参数**——匹配 `/users/1`、`/users/abc`、`/users/erina` 等任意非空字符串（默认 `[^/]+`）。

### 读取参数

#### 模板中

```vue
<template>
  <div>用户 ID：<span v-pre>{{ $route.params.id }}</span></div>
</template>
```

#### `<script setup>` 中

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.params.id) // 字符串
</script>
```

> **`route.params.id` 永远是字符串**——即使路径是 `/users/123`，`id` 也是 `'123'` 而非 `123`。需要数字请手动 `Number(route.params.id)`。

### 监听参数变化

**当组件被复用时**（如 `/users/1` → `/users/2` 都渲染同一个 `UserView`），**`onMounted` / `setup` 不会重新执行**——需要 watch params：

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { watch } from 'vue'

const route = useRoute()

// ✅ 监听特定 param——只在 id 变化时触发
watch(
  () => route.params.id,
  (newId, oldId) => {
    console.log(`用户从 ${oldId} 切换到 ${newId}`)
    fetchUser(newId)
  }
)

// ❌ 不要监听整个 route——任何 query / hash 变化都会触发
watch(() => route, () => { /* 性能差 */ })
</script>
```

或用 `immediate: true` 让初始挂载也触发：

```ts
watch(() => route.params.id, fetchUser, { immediate: true })
```

> **`onBeforeRouteUpdate` 替代方案**：组件内可用 `onBeforeRouteUpdate((to, from) => ...)` 钩子——同样在路由参数变化时触发，且能取消导航（守卫）。详见 [指南 > 路由守卫](./guide-line.md#路由守卫)。

## Query 与 Hash

URL `/search?q=vue&page=2#results` 的组成：

- `path`：`/search`
- `query`：`{ q: 'vue', page: '2' }`
- `hash`：`#results`
- `fullPath`：`/search?q=vue&page=2#results`

### 读取 query

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

console.log(route.query.q)    // 'vue'
console.log(route.query.page) // '2'（字符串）
console.log(route.hash)       // '#results'
</script>
```

### 传 query / hash

```ts
import { useRouter } from 'vue-router'
const router = useRouter()

router.push({ path: '/search', query: { q: 'vue', page: 2 } })
router.push({ path: '/about', hash: '#team' })
router.push({ name: 'user', params: { id: 1 }, query: { tab: 'posts' } })
```

URL 中数字会自动转为字符串：`?page=2` → `route.query.page === '2'`。

### Query 与 params 的差异

| 概念 | URL 表现 | 路由配置 | 适用场景 |
|---|---|---|---|
| **params** | `/users/:id` → `/users/1` | path 中的 `:xxx` | 资源 ID、路径段、SEO 友好 |
| **query** | `/search?q=vue` | 不需配置、URL 任意 query | 筛选 / 排序 / 分页 |
| **hash** | `/about#team` | 不需配置 | 页内锚点、单 SPA 多 view |

## 编程式导航

不用 `<RouterLink>` 时用 `router.push()` 编程触发：

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 字符串路径
router.push('/users/1')

// 对象路径
router.push({ path: '/users/1' })

// 命名路由（推荐）
router.push({ name: 'user', params: { id: 1 } })

// 带 query
router.push({ path: '/search', query: { q: 'vue' } })

// 带 hash
router.push({ path: '/about', hash: '#team' })

// 组合
router.push({
  name: 'user',
  params: { id: 1 },
  query: { tab: 'posts' },
  hash: '#header',
})
</script>
```

### `params` 与 `path` 互斥

**最大坑**：使用 `path` 时 `params` 会被忽略：

```ts
// ❌ 错误：params 被忽略——实际跳转到 /users/:id（字面值）
router.push({ path: '/users/:id', params: { id: 1 } })

// ❌ 错误：path + params 同时给——params 仍被忽略
router.push({ path: '/users', params: { id: 1 } })

// ✅ 正确做法 1：用 name + params
router.push({ name: 'user', params: { id: 1 } })

// ✅ 正确做法 2：手动拼接 path
router.push(`/users/${userId}`)
router.push({ path: `/users/${userId}` })

// ✅ query 不受此限制——可与 path 共用
router.push({ path: '/search', query: { q: 'vue' } })
```

### router.replace / back / forward / go

```ts
// 替换当前历史——不留浏览器后退记录
router.replace('/login')

// 等价于：
router.push({ path: '/login', replace: true })
// 或 RouterLink replace prop
// <RouterLink to="/login" replace>登录</RouterLink>

// 前进 / 后退（与浏览器原生 history 一致）
router.back()     // 后退一步
router.forward()  // 前进一步
router.go(-1)     // 后退 1 步（等价 back）
router.go(2)      // 前进 2 步
router.go(-100)   // 历史不足时静默失败
```

### 导航是 Promise

`router.push()` 返回 Promise——成功 resolve `undefined`，失败 resolve **Navigation Failure** 对象：

```ts
const failure = await router.push('/users/1')

if (failure) {
  console.warn('导航失败', failure)
} else {
  console.log('导航成功')
}
```

详见 [指南 > 导航失败检测](./guide-line.md#导航失败检测)。

## Composition API：useRouter / useRoute

`<script setup>` 中通过两个 composable 拿到 router 实例和当前 route：

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

// 路由实例（与 main.ts 中创建的同一个）
const router = useRouter()

// 当前路由（reactive！）
const route = useRoute()

// 跳转
function goHome() {
  router.push('/')
}

// 读取
console.log(route.path)
console.log(route.params.id)
console.log(route.query.q)
</script>
```

### `route` 是 Reactive 对象

`useRoute()` 返回的 route 是 **`reactive` 对象**——可在 `watch` / `computed` / 模板中直接使用，所有字段自动响应：

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { watch, computed } from 'vue'

const route = useRoute()

// computed
const currentId = computed(() => route.params.id)

// watch
watch(() => route.params.id, (newId) => fetchUser(newId), { immediate: true })

// 模板直接用
</script>

<template>
  <div>当前 ID：<span v-pre>{{ route.params.id }}</span></div>
  <div>当前路径：<span v-pre>{{ route.path }}</span></div>
</template>
```

### 必须在 setup / 顶层调用

`useRouter()` / `useRoute()` **必须在 `<script setup>` 顶层或 setup 函数内调用**——不能在异步回调内：

```ts
// ❌ 错误：异步回调内调用——拿不到正确的 router
async function load() {
  await fetch('/api/...')
  const router = useRouter() // 错误：injection 上下文已丢失
}

// ✅ 正确：顶层拿到 router 引用
const router = useRouter()
async function load() {
  await fetch('/api/...')
  router.push('/done')
}
```

### Options API 等价

Options API 通过 `this.$router` / `this.$route`：

```vue
<script>
export default {
  methods: {
    goHome() {
      this.$router.push('/')
    },
  },
  computed: {
    userId() {
      return this.$route.params.id
    },
  },
}
</script>
```

**新项目强烈推荐 Composition API**——Vue 3 + `<script setup>` 是 Vue 官方推荐的默认范式。

## 命名路由

### 为什么用命名路由

```ts
const routes = [
  { path: '/users/:id', name: 'user', component: UserView },
]
```

**好处**：

- **避免硬编码 path**：路径变更只需改路由表一处
- **自动编码 params**：`router.push({ name, params: { id: 'abc/def' }})` 自动 URL 编码
- **类型化（v4.4+）**：配合 unplugin-vue-router 实现编译期类型校验

### 用 name 跳转

```vue
<template>
  <!-- RouterLink -->
  <RouterLink :to="{ name: 'user', params: { id: 1 } }">用户 1</RouterLink>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

// 编程式
router.push({ name: 'user', params: { id: 1 } })
router.replace({ name: 'login' })
</script>
```

### name 必须唯一

```ts
// ❌ 错误：name 重复——后定义的会覆盖前定义的（且不报错）
const routes = [
  { path: '/a', name: 'foo', component: A },
  { path: '/b', name: 'foo', component: B },
]
```

> **约定**：name 用 **camelCase** 或 **PascalCase**（如 `'user'` / `'UserDetail'`），全局唯一。

## 嵌套路由（预览）

子路由通过 `children` 嵌套：

```ts
const routes = [
  {
    path: '/users/:id',
    component: UserLayout, // 父组件
    children: [
      // 默认子路由（访问 /users/1 时渲染）
      { path: '', name: 'user-home', component: UserHome },
      // 访问 /users/1/posts
      { path: 'posts', name: 'user-posts', component: UserPosts },
      // 访问 /users/1/profile
      { path: 'profile', name: 'user-profile', component: UserProfile },
    ],
  },
]
```

`UserLayout.vue` 必须含子 `<RouterView />`：

```vue
<!-- UserLayout.vue -->
<template>
  <div class="user-layout">
    <h2>用户 #<span v-pre>{{ $route.params.id }}</span></h2>
    <nav>
      <RouterLink :to="{ name: 'user-posts' }">帖子</RouterLink>
      <RouterLink :to="{ name: 'user-profile' }">资料</RouterLink>
    </nav>
    <!-- 子路由出口 -->
    <RouterView />
  </div>
</template>
```

完整嵌套路由 / Named Views / 默认子路由 / 重定向详见 [指南 > 嵌套路由](./guide-line.md#嵌套路由)。

## 完整示例：博客 SPA

来一个综合 demo——博客列表 + 详情 + 编辑：

### 路由配置

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/posts',
      name: 'posts',
      component: () => import('@/views/PostListView.vue'),
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: () => import('@/views/PostDetailView.vue'),
      props: true, // 把 params 作为 props 传入
    },
    {
      path: '/posts/:id/edit',
      name: 'post-edit',
      component: () => import('@/views/PostEditView.vue'),
      props: true,
    },
    // 404 catch-all（必须放最后）
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

export default router
```

### App.vue

```vue
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header>
      <nav>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink :to="{ name: 'posts' }">文章</RouterLink>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.router-link-active {
  font-weight: bold;
  color: var(--vp-c-brand);
}
</style>
```

### PostListView.vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

interface Post {
  id: number
  title: string
}

const posts = ref<Post[]>([])

onMounted(async () => {
  const res = await fetch('/api/posts')
  posts.value = await res.json()
})
</script>

<template>
  <div>
    <h1>文章列表</h1>
    <ul>
      <li v-for="post in posts" :key="post.id">
        <RouterLink :to="{ name: 'post-detail', params: { id: post.id } }">
          <span v-pre>{{ post.title }}</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
```

### PostDetailView.vue（params via props）

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// 通过 props 接收 params（路由配置中 `props: true`）
const props = defineProps<{ id: string }>()

const router = useRouter()
const post = ref<{ title: string; body: string } | null>(null)

// 监听 id 变化重新加载
watch(
  () => props.id,
  async (newId) => {
    const res = await fetch(`/api/posts/${newId}`)
    post.value = await res.json()
  },
  { immediate: true }
)

function goEdit() {
  router.push({ name: 'post-edit', params: { id: props.id } })
}
</script>

<template>
  <article v-if="post">
    <h1><span v-pre>{{ post.title }}</span></h1>
    <p><span v-pre>{{ post.body }}</span></p>
    <button @click="goEdit">编辑</button>
  </article>
  <p v-else>加载中...</p>
</template>
```

> **为什么用 `props: true`**？把 params 解耦为 props——组件不依赖 `useRoute()`，更易测试 / 复用。详见 [指南 > Props 解耦](./guide-line.md#props-向路由组件传参)。

### NotFoundView.vue

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
// route.params.pathMatch 是 ['unknown', 'segments'] 数组
</script>

<template>
  <div>
    <h1>404 - 页面未找到</h1>
    <p>路径：<span v-pre>{{ $route.path }}</span></p>
    <RouterLink to="/">回到首页</RouterLink>
  </div>
</template>
```

## TypeScript 基础

### 类型声明

`vue-router` 自带完整类型——无需额外 `@types/vue-router`：

```ts
import type {
  RouteRecordRaw,
  RouteLocationNormalized,
  RouteLocationRaw,
  NavigationGuard,
  Router,
} from 'vue-router'
```

### 路由表类型

```ts
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/users/:id',
    name: 'user',
    component: () => import('@/views/UserView.vue'),
  },
]
```

### `useRoute` / `useRouter` 自动推导

```ts
const route = useRoute()
// route 类型：RouteLocationNormalizedLoaded
// route.params.id 类型：string（默认）

const router = useRouter()
// router 类型：Router
// router.push() 等方法已类型化
```

### Route Meta 类型扩展

为 `meta` 添加类型——通过 module augmentation：

```ts
// src/types/router.d.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    icon?: string
  }
}
```

之后所有 `route.meta` 都有完整类型：

```ts
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isLoggedIn()) { // TS 知道 requiresAuth 是 boolean
    return { name: 'login' }
  }
})
```

详细 Typed Routes（v4.4+ 自动生成 name → params 映射）见 [指南 > Typed Routes](./guide-line.md#typed-routes-类型化路由)。

## 下一步

至此你已掌握 Vue Router 的基础——**安装** / **第一个 router** / **RouterLink / RouterView** / **动态参数** / **编程式导航** / **Composition API** / **命名路由** / **嵌套路由预览** / **TypeScript 基础**。

继续学习：

- [指南](./guide-line.md)：**核心**——路由匹配语法 / 嵌套路由 + Named Views / Redirect 和 Alias / Props 解耦 / 三种 history 模式 + 服务端配置 / 完整路由守卫（全局 / 路由级 / 组件内）/ Route Meta + TS 扩展 / `<RouterView>` slot 与 Transition / KeepAlive / Suspense / Scroll Behavior / Lazy Loading + Code Splitting / 数据获取模式 / 动态路由 / Typed Routes / Nuxt SSR / 常见踩坑
- [参考](./reference.md)：**API 速查**——所有导出函数 / 组件 / 类型 / RouterOptions 完整属性 / RouteRecordRaw / RouteLocationNormalized / 守卫签名 / NavigationFailureType
