---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Vue Router 4.x。包含路由匹配语法 / 嵌套路由 / Named Views / Redirect 和 Alias / Props 解耦 / 三种 history 模式 / 完整路由守卫 / Route Meta + TS / RouterView slot 与动画 / Scroll Behavior / Lazy Loading / 数据获取 / 动态路由 / Typed Routes / Nuxt SSR / 常见踩坑。

## 速查

- **动态段**：`/users/:id` → `route.params.id`（必填）
- **可选段**：`/users/:id?` → 0 或 1 次（参数可能 `undefined`）
- **重复段**：`/files/:path+` → 1 或多次（参数为数组）/ `/files/:path*` → 0 或多次
- **正则约束**：`/users/:id(\\d+)` → 只匹配数字（路径中需双反斜杠）
- **catch-all 404**：`/:pathMatch(.*)*` → 必须放路由表**末尾**
- **嵌套路由**：`{ path, component, children: [...] }` + 父组件含 `<RouterView />`
- **Named Views**：`{ path, components: { default, sidebar, footer } }` + 模板含 `<RouterView name="sidebar" />`
- **redirect**：`{ path: '/home', redirect: '/' }` 或 `redirect: { name }` 或 `redirect: (to) => ...`
- **alias**：`{ path: '/', alias: ['/home', '/index'] }`（URL 不变、内部按主路由匹配）
- **props 解耦**：`{ path, component, props: true }`（布尔）/ `props: { foo: 'bar' }`（对象）/ `props: (route) => ({ q: route.query.q })`（函数）
- **history**：`createWebHistory()` HTML5 / `createWebHashHistory()` Hash / `createMemoryHistory()` SSR / Node
- **全局守卫**：`router.beforeEach((to, from) => ...)` / `beforeResolve` / `afterEach`
- **路由级守卫**：`{ path, component, beforeEnter: (to, from) => ... }`（数组也可）
- **组件内守卫**：`beforeRouteEnter` / `beforeRouteUpdate` / `beforeRouteLeave`（Options API）
- **Composition API 守卫**：`onBeforeRouteUpdate` / `onBeforeRouteLeave`（`<script setup>` 顶层）
- **导航失败**：`const failure = await router.push(...)` + `isNavigationFailure(failure, NavigationFailureType.aborted)`
- **scrollBehavior**：`(to, from, savedPosition) => ({ top: 0 })` 或 `{ el: to.hash, behavior: 'smooth' }`
- **懒加载**：`{ component: () => import('./X.vue') }`（**不能用 `defineAsyncComponent`**）
- **addRoute / removeRoute**：动态增删路由 / 需手动 `router.replace(currentRoute.fullPath)` 触发匹配

## 路由匹配语法

Vue Router 用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 解析路径——支持丰富的动态段语法。

### 静态路径

最简单的形式——精确匹配：

```ts
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/users/list', component: UserList },
]
```

### 动态段（params）

`:param` 匹配单个 URL 段（默认 `[^/]+`）：

```ts
const routes = [
  // 匹配 /users/1、/users/abc 等任意非空字符串
  { path: '/users/:id', component: User },

  // 多个动态段
  { path: '/users/:userId/posts/:postId', component: UserPost },
]
```

读取：`route.params.id`、`route.params.userId`、`route.params.postId`（**永远是字符串**）。

### 可选段（`?`）

`:param?` 表示该段可选——匹配 0 或 1 次：

```ts
const routes = [
  // 同时匹配 /users 和 /users/123
  { path: '/users/:id?', component: UserOrList },
  // 与正则结合：/users 或 /users/123 但不匹配 /users/abc
  { path: '/users/:id(\\d+)?', component: User },
]
```

> **注意**：若路由段中**还包含非可选字符**（如 `/users/:uid?-:name?`），则只能匹配 `/users/-`、`/users/a-`、`/users/-b`、`/users/a-b`——必须有 `-` 占位。

### 重复段（`+` 和 `*`）

匹配多段路径——参数变为数组：

```ts
const routes = [
  // 1+ 段：匹配 /chapter/a、/chapter/a/b、/chapter/a/b/c
  { path: '/chapter/:chapters+', component: Chapter },

  // 0+ 段：匹配 /chapter、/chapter/a、/chapter/a/b
  { path: '/chapter/:chapters*', component: Chapter },

  // 与正则组合
  { path: '/files/:path(\\d+)+', component: Files },
]
```

读取：`route.params.chapters === ['a', 'b']`（数组）。

```ts
// 命名路由 + 重复参数——传数组
router.push({ name: 'chapter', params: { chapters: ['a', 'b'] } })
// → /chapter/a/b
```

### 自定义正则

参数后的 `(...)` 是正则约束（双反斜杠转义）：

```ts
const routes = [
  // 只匹配数字 id
  { path: '/users/:id(\\d+)', component: UserById },

  // 与字符串路径区分
  { path: '/users/:username', component: UserByName },

  // 多组正则
  { path: '/posts/:year(\\d{4})/:month(\\d{2})', component: Archive },
]
```

> **顺序敏感**：`/:id(\\d+)` 必须放在 `/:username` 之前——否则字符串路径会优先匹配吞掉数字。

### Catch-all（404 通配）

捕获所有未匹配的路径：

```ts
const routes = [
  // 标准路由...
  { path: '/', component: Home },
  { path: '/about', component: About },

  // 404 catch-all（**必须放最后**）
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
]
```

读取：`route.params.pathMatch === ['unknown', 'segments']`（数组）。

> **路径模式三种**：
> - `/:pathMatch(.*)*` → 数组（推荐）
> - `/:pathMatch(.*)` → 字符串
> - `/:catchAll(.*)` → 字符串（命名任意）

### `sensitive` / `strict` 大小写与尾斜杠

默认**大小写不敏感** + **允许尾斜杠**（`/users` 与 `/Users/` 等价）：

```ts
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/users/:id', sensitive: true },  // 区分大小写
    { path: '/about', strict: true },         // 不允许 /about/
  ],
  strict: true,    // 全局严格模式
  sensitive: true, // 全局大小写敏感
})
```

### 路径调试

复杂正则可用 [path ranker tool](https://paths.esm.dev) 可视化匹配优先级，或运行时打印：

```ts
console.log(router.getRoutes())   // 所有路由的展开形式
console.log(route.matched)         // 当前匹配的路由层级（数组：父 → 子）
```

## 嵌套路由

复杂应用的 UI 是嵌套的——`/users/1/posts` 中 `users` 是 layout、`/1` 是 user、`/posts` 是 user 内的子视图。

### 基本嵌套

```ts
const routes = [
  {
    path: '/users/:id',
    component: UserLayout, // 父组件
    children: [
      // 访问 /users/1/profile
      { path: 'profile', component: UserProfile },
      // 访问 /users/1/posts
      { path: 'posts', component: UserPosts },
    ],
  },
]
```

`UserLayout.vue` **必须**包含子 `<RouterView />`：

```vue
<!-- UserLayout.vue -->
<template>
  <div class="user-layout">
    <h2>用户 #<span v-pre>{{ $route.params.id }}</span></h2>
    <nav>
      <RouterLink :to="`/users/${$route.params.id}/profile`">资料</RouterLink>
      <RouterLink :to="`/users/${$route.params.id}/posts`">帖子</RouterLink>
    </nav>
    <!-- 子路由出口 -->
    <RouterView />
  </div>
</template>
```

> **子 path 不以 `/` 开头**：嵌套路由的子 `path` 相对父路径（`'profile'` 而非 `/profile`）；写 `/profile` 会被当成绝对路径忽略父路径。

### 默认子路由

访问父路径（`/users/1`）时渲染哪个子组件？用**空 path** 定义默认子路由：

```ts
const routes = [
  {
    path: '/users/:id',
    component: UserLayout,
    children: [
      // 默认子路由（path: ''）—— /users/1 渲染这里
      { path: '', name: 'user-home', component: UserHome },
      { path: 'profile', name: 'user-profile', component: UserProfile },
      { path: 'posts', name: 'user-posts', component: UserPosts },
    ],
  },
]
```

> **不写默认子路由**？访问 `/users/1` 时 `<RouterView />` 渲染空——这是初学者最常见的「页面空白」问题。

### 命名子路由

嵌套路由中**强烈推荐**给每个子路由 `name`——便于 `router.push({ name })` 跳转：

```ts
const routes = [
  {
    path: '/users/:id',
    component: UserLayout,
    children: [
      { path: '', name: 'user-home', component: UserHome },
      { path: 'profile', name: 'user-profile', component: UserProfile },
    ],
  },
]

// 使用
router.push({ name: 'user-profile', params: { id: 1 } })
```

### 父路由不需要组件（v4.1+）

某些时候只想**用 path 组织路由**、不需要父组件 layout——直接省略 `component`：

```ts
const routes = [
  {
    path: '/admin',
    // 没有 component——子路由直接挂到顶级 <RouterView />
    children: [
      { path: '', component: AdminOverview },
      { path: 'users', component: AdminUsers },
      { path: 'settings', component: AdminSettings },
    ],
  },
]
```

访问 `/admin/users` 时——`AdminUsers` 直接渲染到顶级 `<RouterView />`（**不嵌套挂载**）。

## Named Views（命名视图）

需要**同屏多视图**（左侧栏 + 主区 + 底部栏）？用 `components: { ... }` + 命名 `<RouterView>`。

### 多视图布局

```ts
const routes = [
  {
    path: '/',
    // 注意：components（复数）而非 component
    components: {
      default: Home,        // 主区
      sidebar: MainSidebar, // 侧栏
      footer: MainFooter,   // 底部
    },
  },
]
```

App.vue 中放对应位置：

```vue
<template>
  <div class="layout">
    <aside>
      <RouterView name="sidebar" />
    </aside>
    <main>
      <!-- 没有 name 等价于 name="default" -->
      <RouterView />
    </main>
    <footer>
      <RouterView name="footer" />
    </footer>
  </div>
</template>
```

不写 `name` 的 `<RouterView />` = `name="default"`。

### 嵌套 Named Views

子路由也可以用 `components: { ... }`：

```ts
const routes = [
  {
    path: '/settings',
    component: UserSettings,
    children: [
      { path: 'emails', component: UserEmailsSubscriptions },
      {
        path: 'profile',
        components: {
          default: UserProfile,
          helper: UserProfilePreview,
        },
      },
    ],
  },
]
```

`UserSettings.vue` 含两个 RouterView：

```vue
<template>
  <div>
    <h1>用户设置</h1>
    <NavBar />
    <RouterView />
    <RouterView name="helper" />
  </div>
</template>
```

> **使用场景**：管理后台多 panel 同屏、Dashboard layout 切换 widget——大多数普通 SPA **不需要** Named Views。

## Redirect 和 Alias

### Redirect 重定向

访问某 URL 时**实际跳到另一个 URL**（浏览器地址栏会变）。

#### 简单重定向

```ts
const routes = [
  { path: '/home', redirect: '/' },
  { path: '/index', redirect: { name: 'home' } },
]
```

访问 `/home` → 地址栏变为 `/` → 渲染 home 路由。

#### 函数式重定向

```ts
const routes = [
  {
    path: '/search/:searchText',
    redirect: (to) => {
      // to 是原始路由 location
      return { path: '/search', query: { q: to.params.searchText } }
    },
  },
]
```

访问 `/search/vue` → 跳到 `/search?q=vue`。

#### 相对重定向

```ts
const routes = [
  {
    path: '/users/:id/posts',
    redirect: (to) => {
      return to.path.replace(/posts$/, 'profile')
    },
  },
]
```

`/users/1/posts` → `/users/1/profile`。

> **重要**：**守卫不在 redirect 源路由上触发**——只在目标路由上触发。

### Alias 别名

URL **保持不变**，但**按主路由的配置匹配**。

```ts
const routes = [
  { path: '/', component: Home, alias: '/home' },
]
```

访问 `/home` → 地址栏保持 `/home` → 渲染 Home 组件（与 `/` 一致）。

#### 多别名

```ts
const routes = [
  {
    path: '/users',
    component: UsersLayout,
    children: [
      { path: '', component: UserList, alias: ['/people', 'list'] },
    ],
  },
]
```

访问任一 URL 都渲染 `UserList`：

- `/users`
- `/users/list`
- `/people`

#### Alias vs Redirect

| 维度 | Redirect | Alias |
|---|---|---|
| 浏览器地址栏 | **改变**（跳到新 URL） | **保持不变** |
| 用途 | URL 迁移 / 简化入口 | 多 URL 共享同一组件 |
| SEO | 通常配合 301 重定向 | 多 URL 可能造成内容重复 |
| 守卫触发 | 守卫在目标路由触发 | 与主路由一致 |

## Props 向路由组件传参

直接用 `useRoute().params.id` 会让组件**强耦合于路由**——不易测试。用 `props` 选项把 params 转为 props。

### 布尔模式

`props: true` → 所有 `params` 自动变成 props：

```ts
const routes = [
  { path: '/users/:id', component: User, props: true },
]
```

```vue
<!-- User.vue -->
<script setup lang="ts">
defineProps<{ id: string }>()
</script>

<template>
  <div>用户 ID：<span v-pre>{{ id }}</span></div>
</template>
```

组件不再依赖 `useRoute()`——可在测试中直接传 props 渲染。

### 对象模式（静态 props）

`props: { ... }` → 把静态对象传给组件：

```ts
const routes = [
  {
    path: '/promo',
    component: Promotion,
    props: { showPopup: false, theme: 'dark' },
  },
]
```

### 函数模式（动态 props）

`props: (route) => ({ ... })` → 动态从 route 计算 props：

```ts
const routes = [
  {
    path: '/search',
    component: SearchView,
    props: (route) => ({
      query: route.query.q,
      page: Number(route.query.page ?? 1),
    }),
  },
]
```

```vue
<!-- SearchView.vue -->
<script setup lang="ts">
defineProps<{
  query: string
  page: number
}>()
</script>
```

> **函数 props 必须无状态**——只在路由变化时执行，副作用会泄漏。

### Named Views 的 props

每个 view 单独配置：

```ts
const routes = [
  {
    path: '/users/:id',
    components: {
      default: User,
      sidebar: UserSidebar,
    },
    props: {
      default: true,     // User 组件收到 params
      sidebar: false,    // Sidebar 不收
    },
  },
]
```

## History 模式

Vue Router 4 提供**三种** history 模式——通过 `history` 选项传入。

### `createWebHistory()` HTML5 模式（推荐）

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes,
})
```

URL 形如 `https://example.com/users/1`——**无 `#`、SEO 友好**。但需要**服务端配置**：所有未匹配静态文件的请求 fallback 到 `index.html`，否则刷新页面会 404。

#### Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Apache (`.htaccess`)

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Express (Node.js)

```ts
const history = require('connect-history-api-fallback')
app.use(history())
app.use(express.static('dist'))
```

#### Vercel / Netlify

`vercel.json`：

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

`netlify.toml`：

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Base URL

部署到子路径（如 `https://example.com/myapp/`）：

```ts
const router = createRouter({
  history: createWebHistory('/myapp/'),
  routes,
})
```

Vite 项目中通常用 `import.meta.env.BASE_URL`（自动读取 `vite.config.ts` 的 `base` 选项）：

```ts
history: createWebHistory(import.meta.env.BASE_URL),
```

### `createWebHashHistory()` Hash 模式

```ts
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
```

URL 形如 `https://example.com/#/users/1`——**无需服务端配置**（`#` 后内容不会传给服务器）。

**缺点**：

- **SEO 极差**——爬虫看到的所有 URL 都是 `/`
- URL 不美观（有 `#`）
- 不能用 [HTML5 History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) 的部分功能

**适用场景**：

- 静态资源托管不支持 rewrite（如某些老 CDN）
- Electron / Chrome 扩展（无服务端）
- 简单原型 / Demo（不在乎 SEO）

### `createMemoryHistory()` 内存模式

```ts
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
```

URL **不与浏览器同步**——history 只在内存中。**适用场景**：

- **SSR（服务端渲染）**——每个请求独立 router 实例
- **单元测试**——隔离的 router、无浏览器副作用
- **Node 环境**（如 Electron 主进程 / CLI 工具）

> **不会自动导航到初始路由**——SSR 中必须手动 `router.push(req.url)` + `await router.isReady()`。

## 路由守卫

路由守卫是**导航过程中的中间件**——在路由真正切换前 / 后执行业务逻辑（鉴权 / 数据加载 / 离开确认）。

### 守卫层级

| 层级 | 守卫 | 触发时机 |
|---|---|---|
| **全局** | `router.beforeEach` | 所有导航开始时 |
| 全局 | `router.beforeResolve` | 所有守卫和异步组件完成、即将确认导航前 |
| 全局 | `router.afterEach` | 导航完成后（**不能取消**） |
| **路由级** | `beforeEnter` | 进入特定路由前 |
| **组件内** | `beforeRouteEnter` | 组件被实例化前（**无 `this`**） |
| 组件内 | `beforeRouteUpdate` | 路由变化但组件复用时 |
| 组件内 | `beforeRouteLeave` | 离开当前路由前 |

### 完整导航流程

按时间顺序：

1. 触发导航（`router.push` / 浏览器后退）
2. 调用要离开的组件的 `beforeRouteLeave` 守卫
3. 调用全局 `router.beforeEach` 守卫
4. 调用复用组件的 `beforeRouteUpdate` 守卫（如有）
5. 调用路由配置的 `beforeEnter` 守卫
6. 解析异步路由组件
7. 调用进入组件的 `beforeRouteEnter` 守卫
8. 调用全局 `router.beforeResolve` 守卫
9. 导航确认
10. 调用全局 `router.afterEach` 钩子
11. 触发 DOM 更新
12. 调用 `beforeRouteEnter` 守卫中传给 `next` 的回调

### 全局 `beforeEach`

最常用守卫——**所有导航都触发**：

```ts
// src/router/index.ts
router.beforeEach((to, from) => {
  // to：目标路由（normalized）
  // from：当前路由（normalized）

  // 返回 false 取消导航
  if (to.meta.requiresAuth && !isLoggedIn()) {
    return false
  }

  // 返回 location 对象重定向
  if (to.meta.requiresAuth && !isLoggedIn()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 返回 undefined / true / 不返回——允许导航
})
```

> **关键变化**：Vue Router 4 推荐**返回值**而非 v3 的 `next()` 回调——`next()` 仍可用但已不推荐。

### 异步守卫

守卫可以是 `async function`——返回 Promise：

```ts
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const user = await checkSession()
    if (!user) return { name: 'login' }
  }
})
```

### `beforeResolve`（推荐用于权限确认）

`beforeEach` 在导航开始就执行——而 `beforeResolve` 在**所有 async component / `beforeEnter` 都完成后**才执行：

```ts
router.beforeResolve(async (to) => {
  // 此时所有异步组件已加载
  if (to.meta.requiresPermission) {
    if (!await hasPermission(to.meta.permission)) {
      return { name: 'forbidden' }
    }
  }
})
```

**适用场景**：摄像头 / 位置权限 / 大数据加载——保证组件准备好后再请求资源。

### `afterEach`（仅副作用）

导航完成后触发——**不能取消、不能重定向**——只用于副作用：

```ts
router.afterEach((to, from, failure) => {
  // 设置页面标题
  document.title = (to.meta.title ?? 'App') as string

  // 上报分析（包括失败的导航）
  if (failure) {
    sendAnalyticsFailure(to, from, failure)
  } else {
    sendAnalytics(to, from)
  }
})
```

### 路由级 `beforeEnter`

挂在特定路由上——**只在进入该路由时触发、不在 params/query 变化时触发**：

```ts
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from) => {
      if (!isAdmin()) return { name: 'forbidden' }
    },
  },
]
```

#### 数组形式（多个 guard）

```ts
function checkAuth(to, from) {
  if (!isLoggedIn()) return { name: 'login' }
}

function checkRole(to, from) {
  if (!isAdmin()) return { name: 'forbidden' }
}

const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: [checkAuth, checkRole], // 依次执行
  },
]
```

### 组件内守卫（Options API）

```vue
<script>
export default {
  beforeRouteEnter(to, from, next) {
    // ⚠️ 此时组件尚未实例化——无法访问 this
    // 用 next 回调拿到实例
    next(vm => {
      vm.someData = 'loaded'
    })
  },
  beforeRouteUpdate(to, from) {
    // 复用同一组件、params 变化时
    // 可以访问 this
    this.userId = to.params.id
  },
  beforeRouteLeave(to, from) {
    // 离开前确认
    if (this.hasUnsavedChanges) {
      const answer = window.confirm('有未保存的修改，确定离开？')
      if (!answer) return false
    }
  },
}
</script>
```

### 组件内守卫（Composition API）

`<script setup>` 中用 `onBeforeRouteUpdate` / `onBeforeRouteLeave`（**没有 `onBeforeRouteEnter`**——setup 时组件已经在创建中）：

```vue
<script setup lang="ts">
import { onBeforeRouteUpdate, onBeforeRouteLeave } from 'vue-router'
import { ref } from 'vue'

const userData = ref()

// 路由更新（复用组件）
onBeforeRouteUpdate(async (to, from) => {
  if (to.params.id !== from.params.id) {
    userData.value = await fetchUser(to.params.id)
  }
})

// 离开前确认
const hasUnsavedChanges = ref(false)
onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('有未保存的修改，确定离开？')
    if (!answer) return false
  }
})
</script>
```

> **如何替代 `beforeRouteEnter`**？两种思路：
> 1. **全局 `beforeEach`** + 检查 `to.meta` 判断是否需要预加载
> 2. **路由级 `beforeEnter`** + 加载数据后通过 props 传入组件
> 3. **数据加载放 `<script setup>` 内 `onMounted`** + watch `route.params` —— Vue 推荐方式

### 守卫返回值汇总

| 返回值 | 含义 |
|---|---|
| `undefined` / `true` / 不返回 | 允许导航 |
| `false` | 取消导航（地址栏不变） |
| `{ name, params, query, hash, ... }` | 重定向到新 location |
| `Error` 或 `throw` | 取消导航 + 触发 `router.onError` |

## Route Meta（路由元数据）

`meta` 字段可以附加任意数据——常用于**权限标记 / 页面标题 / 过渡名称 / KeepAlive 控制**等。

### 定义 meta

```ts
const routes = [
  {
    path: '/admin/users',
    component: AdminUsers,
    meta: {
      requiresAuth: true,
      requiresRole: 'admin',
      title: '用户管理',
      keepAlive: true,
      transition: 'slide-left',
    },
  },
]
```

### 访问 meta

```ts
// 守卫中
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isLoggedIn()) {
    return { name: 'login' }
  }
})

// 组件中
const route = useRoute()
console.log(route.meta.title)
```

> **嵌套路由的 meta 自动合并**——`route.meta` 包含所有父子层级的 meta 合并结果。

### TypeScript 类型扩展

通过 module augmentation 给 `RouteMeta` 添加类型：

```ts
// src/types/router.d.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresRole?: 'user' | 'admin' | 'superadmin'
    title?: string
    keepAlive?: boolean
    transition?: string
  }
}
```

之后所有 `route.meta.xxx` 都有完整类型推导：

```ts
router.beforeEach((to) => {
  // ✅ TS 知道 requiresAuth 是 boolean | undefined
  if (to.meta.requiresAuth) { /* ... */ }

  // ❌ TS 报错：requiresFoo 不存在
  if (to.meta.requiresFoo) { /* ... */ }
})
```

## `<RouterView>` Slot 与动画

Vue Router 4 的 `<RouterView>` 暴露 slot——把当前组件作为 `Component` 提供——可与 `<Transition>` / `<KeepAlive>` / `<Suspense>` 任意组合。

### 基本 slot 用法

```vue
<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>
</template>
```

`Component` 是当前路由匹配的组件——`<component :is>` 动态渲染。

### 配合 Transition

```vue
<template>
  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

> **`mode="out-in"`**：旧组件完全消失后再渲染新组件——避免重叠。

#### 路由级动画

通过 `meta.transition` 给每个路由配不同动画：

```ts
const routes = [
  { path: '/', component: Home, meta: { transition: 'fade' } },
  { path: '/about', component: About, meta: { transition: 'slide-left' } },
]
```

```vue
<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="(route.meta.transition as string) || 'fade'" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>
```

#### 基于路由深度的动画

```ts
router.afterEach((to, from) => {
  const toDepth = to.path.split('/').length
  const fromDepth = from.path.split('/').length
  to.meta.transition = toDepth < fromDepth ? 'slide-right' : 'slide-left'
})
```

#### 强制重新渲染（key）

同一组件不同 params 时，默认**复用组件**——不会触发 transition。加 `:key`：

```vue
<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>
```

### 配合 KeepAlive

KeepAlive 缓存组件实例——切回时保留状态（如表单 / 滚动位置）：

```vue
<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive>
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
```

#### 按 meta 选择性缓存

```vue
<template>
  <RouterView v-slot="{ Component, route }">
    <KeepAlive>
      <component
        v-if="route.meta.keepAlive"
        :is="Component"
        :key="route.fullPath"
      />
    </KeepAlive>
    <component
      v-if="!route.meta.keepAlive"
      :is="Component"
      :key="route.fullPath"
    />
  </RouterView>
</template>
```

或用 KeepAlive 的 `include`：

```vue
<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive :include="['UserList', 'ProductList']">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
```

> **要求**：被缓存的组件必须有 `name` 选项（`<script setup>` 中用 `defineOptions({ name: 'UserList' })`）。

### 配合 Suspense（async setup）

`<script setup>` 是 `async` 时，外层需 `<Suspense>`：

```vue
<template>
  <RouterView v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
      <template #fallback>
        <div>加载中...</div>
      </template>
    </Suspense>
  </RouterView>
</template>
```

### 三者组合（Transition + KeepAlive + Suspense）

```vue
<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="fade" mode="out-in">
      <KeepAlive>
        <Suspense>
          <component :is="Component" :key="route.path" />
          <template #fallback>
            <div>加载中...</div>
          </template>
        </Suspense>
      </KeepAlive>
    </Transition>
  </RouterView>
</template>
```

> **顺序敏感**：`Transition > KeepAlive > Suspense > Component`——这是社区公认最佳实践。

### 等待 router 就绪

App 首次加载时，路由可能还没准备好——`router.isReady()` 等待初始导航完成后再 mount：

```ts
const app = createApp(App)
app.use(router)

await router.isReady()
app.mount('#app')
```

否则可能闪现 fallback / 空白。

## Scroll Behavior（滚动行为）

`scrollBehavior` 选项控制路由切换时的滚动位置——返回值告诉浏览器滚到哪里。

### 基本用法：每次切换回到顶部

```ts
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 }
  },
})
```

### 浏览器前进 / 后退保留位置

```ts
scrollBehavior(to, from, savedPosition) {
  if (savedPosition) {
    // 前进 / 后退时 savedPosition 是 { top: number, left: number }
    return savedPosition
  } else {
    return { top: 0 }
  }
}
```

### 滚动到锚点（hash）

```ts
scrollBehavior(to, from, savedPosition) {
  if (to.hash) {
    return {
      el: to.hash, // '#section-1' → 元素选择器
      behavior: 'smooth',
    }
  }
  if (savedPosition) return savedPosition
  return { top: 0 }
}
```

### 平滑滚动

```ts
scrollBehavior(to, from, savedPosition) {
  return {
    top: 0,
    behavior: 'smooth',
  }
}
```

> **浏览器兼容**：`behavior: 'smooth'` 在 Firefox / Chrome / Safari 现代版本都支持。

### 异步 / 延迟滚动

返回 Promise——等待 transition 结束再滚：

```ts
scrollBehavior(to, from, savedPosition) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ left: 0, top: 0 })
    }, 500)
  })
}
```

### 滚动到特定元素（offset）

固定 header 时需要 offset——`el` + `top` 组合：

```ts
scrollBehavior(to, from, savedPosition) {
  if (to.hash) {
    return {
      el: to.hash,
      top: 60, // 距离锚点元素顶部 60px（让出 header）
    }
  }
}
```

或在 CSS 中给目标元素加 `scroll-margin-top`：

```css
.section-target {
  scroll-margin-top: 60px;
}
```

## Lazy Loading（懒加载）+ Code Splitting

### 为什么懒加载

不懒加载时——所有路由组件被打到主 bundle，首屏 JS 体积爆炸。懒加载后——访问路由时才加载对应 chunk，**首屏快、按需加载**。

### 动态 import

```ts
// 不懒加载（全部在主 bundle）
import UserDetails from '@/views/UserDetails.vue'

// 懒加载（独立 chunk）
const UserDetails = () => import('@/views/UserDetails.vue')

const routes = [
  // 推荐写法：直接在路由配置中懒加载
  {
    path: '/users/:id',
    component: () => import('@/views/UserDetails.vue'),
  },
]
```

### Vite 默认按路由分包

Vite + Rollup 默认会按 `import('./xxx.vue')` 自动 split——**无需额外配置**：

```
dist/assets/
├── index-abc123.js          # 主 bundle
├── UserDetails-def456.js    # /users/:id 的 chunk
├── About-ghi789.js          # /about 的 chunk
```

### Vite 手动 chunk 分组

把多个相关路由打到一个 chunk：

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'group-user': [
            './src/views/UserDetails.vue',
            './src/views/UserDashboard.vue',
            './src/views/UserProfileEdit.vue',
          ],
        },
      },
    },
  },
})
```

### Webpack 手动 chunk 命名

```ts
const UserDetails = () =>
  import(/* webpackChunkName: "user-bundle" */ '@/views/UserDetails.vue')
const UserDashboard = () =>
  import(/* webpackChunkName: "user-bundle" */ '@/views/UserDashboard.vue')
```

相同 `webpackChunkName` 的组件会被打到同一个 chunk。

### 不要用 `defineAsyncComponent`

```ts
import { defineAsyncComponent } from 'vue'

// ❌ 错误：defineAsyncComponent 不能作为路由组件
const UserDetails = defineAsyncComponent(() => import('@/views/UserDetails.vue'))

// ✅ 正确：直接传函数
const UserDetails = () => import('@/views/UserDetails.vue')
```

> **原因**：`defineAsyncComponent` 包装后的组件不再是 Promise 函数——Vue Router 无法识别。但**在路由组件内部使用 `defineAsyncComponent` 是 OK 的**。

### 函数式组件的特殊处理

Vue Router 通过「函数返回值是否带 Promise」来判断懒加载——函数式组件需手动加 `displayName`：

```ts
import type { FunctionalComponent } from 'vue'
import { h } from 'vue'

const AboutPage: FunctionalComponent = () => h('h1', {}, 'About')
AboutPage.displayName = 'AboutPage' // 必须，否则被当作懒加载工厂函数
```

## 数据获取模式

何时拉取数据？两种思路。

### 1. 在组件 mount 后拉取（After Navigation）

**特点**：立即导航 / 组件渲染 → 在组件内部加载数据 + 显示 loading。

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const loading = ref(false)
const post = ref<{ title: string; body: string } | null>(null)
const error = ref<string | null>(null)

async function fetchPost(id: string) {
  error.value = null
  post.value = null
  loading.value = true
  try {
    const res = await fetch(`/api/posts/${id}`)
    post.value = await res.json()
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

// 初始 + params 变化都触发
watch(() => route.params.id as string, fetchPost, { immediate: true })
</script>

<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="error">错误：<span v-pre>{{ error }}</span></div>
  <article v-else-if="post">
    <h1><span v-pre>{{ post.title }}</span></h1>
    <p><span v-pre>{{ post.body }}</span></p>
  </article>
</template>
```

**优点**：组件立即渲染、用户感知快。**缺点**：初始 loading 状态明显。

### 2. 在路由切换前拉取（Before Navigation）

**特点**：等待数据加载完成后再切换路由——切换后立即看到完整页面。

#### Options API：`beforeRouteEnter` / `beforeRouteUpdate`

```vue
<script>
export default {
  data() {
    return { post: null, error: null }
  },
  async beforeRouteEnter(to, from, next) {
    try {
      const res = await fetch(`/api/posts/${to.params.id}`)
      const post = await res.json()
      next(vm => { vm.post = post })
    } catch (err) {
      next(vm => { vm.error = err.message })
    }
  },
  async beforeRouteUpdate(to) {
    this.post = null
    const res = await fetch(`/api/posts/${to.params.id}`)
    this.post = await res.json()
  },
}
</script>
```

**优点**：进入路由后立即有数据、UX 完整。**缺点**：导航期间用户停留在旧页面、需全局 loading 指示器。

#### Composition API：`beforeEnter` + props

`<script setup>` 中**没有 `onBeforeRouteEnter`**——推荐用路由级 `beforeEnter` + `props` 传入：

```ts
// router/index.ts
const routes = [
  {
    path: '/posts/:id',
    component: () => import('@/views/PostView.vue'),
    props: (route) => ({ id: route.params.id }),
    beforeEnter: async (to) => {
      // 预加载数据 → 挂在 meta 上
      const res = await fetch(`/api/posts/${to.params.id}`)
      to.meta.preloadedPost = await res.json()
    },
  },
]
```

```vue
<!-- PostView.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
const post = route.meta.preloadedPost as { title: string }
</script>
```

> **推荐**：日常项目用「**组件内拉取**」+ 适当的 loading 指示器——心智更简单、Vue 反应式系统天然支持。

### 3. Data Loaders（Vue Router v5 试验性）

[Data Loaders](https://uvr.esm.is/data-loaders/) 是 Vue Router 5.x 的实验性特性——基于 [unplugin-vue-router](https://uvr.esm.is/) 提供——目前未稳定，详见官方 RFC。

## 动态路由（运行时增删）

`router.addRoute` / `router.removeRoute` 允许**运行时增删路由**——常用于权限驱动 / 微前端。

### 添加路由

```ts
router.addRoute({
  path: '/admin',
  component: () => import('@/views/Admin.vue'),
})

// ⚠️ addRoute 不会自动触发当前匹配——需要手动 replace
router.replace(router.currentRoute.value.fullPath)
```

### 添加嵌套路由

第一个参数传父路由 `name`：

```ts
router.addRoute({ name: 'admin', path: '/admin', component: AdminLayout })
router.addRoute('admin', { path: 'users', component: AdminUsers })
// 等价于配置中：
// { name: 'admin', path: '/admin', component: AdminLayout, children: [
//   { path: 'users', component: AdminUsers }
// ]}
```

### 删除路由

#### 方法 1：同名覆盖

```ts
router.addRoute({ path: '/users', name: 'users', component: UsersV1 })
router.addRoute({ path: '/users', name: 'users', component: UsersV2 })
// UsersV1 被静默替换为 UsersV2
```

#### 方法 2：保留 addRoute 返回的清理函数

```ts
const removeRoute = router.addRoute({ path: '/admin', name: 'admin', component: Admin })
// 之后：
removeRoute()
```

#### 方法 3：按 name 删除

```ts
router.removeRoute('admin')
```

> **删除路由时同时删除所有别名和子路由**。

### 检查路由

```ts
// 是否存在
router.hasRoute('admin') // boolean

// 获取所有路由（展平后的）
router.getRoutes() // RouteRecordNormalized[]
```

### 权限驱动路由示例

```ts
// 假设登录后从后端拿到 menus
async function setupRoutes(menus: { path: string; component: string }[]) {
  for (const menu of menus) {
    router.addRoute({
      path: menu.path,
      component: () => import(`@/views/${menu.component}.vue`),
    })
  }
  router.replace(router.currentRoute.value.fullPath) // 触发当前匹配
}

router.beforeEach(async (to) => {
  if (to.path === '/login' || routesLoaded.value) return

  const user = await fetchSession()
  if (user) {
    await setupRoutes(user.menus)
    routesLoaded.value = true
    return to.fullPath // 重新匹配
  }
  return { name: 'login' }
})
```

## 导航失败检测

`router.push()` 等返回 Promise——失败时 resolve **Navigation Failure** 对象。

### 检测失败类型

```ts
import { NavigationFailureType, isNavigationFailure } from 'vue-router'

const failure = await router.push('/posts/2')

if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
  // 被守卫 return false 取消
  showToast('有未保存的改动')
} else if (isNavigationFailure(failure, NavigationFailureType.cancelled)) {
  // 用户在导航完成前发起了新导航
} else if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
  // 目标与当前完全相同
}
```

### 三种失败类型

| 类型 | 说明 |
|---|---|
| `aborted` | 守卫返回 `false` 取消 |
| `cancelled` | 新导航中断了当前导航 |
| `duplicated` | 目标位置与当前完全相同 |

### 全局检测

```ts
router.afterEach((to, from, failure) => {
  if (failure) {
    console.warn(`导航 ${from.path} → ${to.path} 失败`, failure)
  }
})
```

### 检测重定向（不是失败）

重定向**不是失败**——而是产生新的成功导航。检测当前 route 的 `redirectedFrom`：

```ts
await router.push('/my-profile')
if (router.currentRoute.value.redirectedFrom) {
  console.log('从 ', router.currentRoute.value.redirectedFrom, ' 重定向而来')
}
```

## Typed Routes（类型化路由）

Vue Router 4.4+ 提供 `TypesConfig` 接口——配合 [unplugin-vue-router](https://uvr.esm.is/) **从文件系统自动生成类型**。

### 手动定义（不推荐）

```ts
// src/types/router.d.ts
import type { RouteRecordInfo } from 'vue-router'

export interface RouteNamedMap {
  home: RouteRecordInfo<
    'home',                  // name
    '/',                     // path
    Record<never, never>,    // 原始 params（raw）
    Record<never, never>,    // 标准化 params（normalized）
    never                    // children
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

之后：

```ts
router.push({ name: 'user', params: { id: 1 } }) // ✅ TS 校验 params
router.push({ name: 'usr' }) // ❌ TS 报错：name 不存在

const route = useRoute('user')
route.params.id // ✅ TS 知道是 string
```

### 自动生成（推荐）

[unplugin-vue-router](https://uvr.esm.is/) 文件系统路由 + 自动类型生成：

```bash
pnpm add -D unplugin-vue-router
```

```ts
// vite.config.ts
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig({
  plugins: [
    VueRouter({
      routesFolder: 'src/pages',
    }),
    vue(),
  ],
})
```

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
})
```

文件结构：

```
src/pages/
├── index.vue           → { name: '/', path: '/' }
├── users/
│   └── [id].vue        → { name: '/users/[id]', path: '/users/:id' }
└── [...path].vue       → 404 catch-all
```

unplugin 自动生成 `typed-router.d.ts`：

```ts
declare module 'vue-router/auto-routes' {
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', ...>
    '/users/[id]': RouteRecordInfo<'/users/[id]', '/users/:id', { id: string }, ...>
  }
}
```

之后所有 `router.push({ name: '/users/[id]', params: { id: 1 } })` 都全自动补全。

## Nuxt SSR 集成

Nuxt 3+ **不需要手动配置 Vue Router**——内置 `<NuxtPage>` / `<NuxtLink>` 自动包装 + 文件系统路由 + 类型化。

### 基本使用

```vue
<!-- app.vue -->
<template>
  <div>
    <NuxtLink to="/">首页</NuxtLink>
    <NuxtLink to="/about">关于</NuxtLink>
    <NuxtPage />
  </div>
</template>
```

### 文件系统路由

```
pages/
├── index.vue           → /
├── about.vue           → /about
├── users/
│   ├── index.vue       → /users
│   └── [id].vue        → /users/:id
└── [...slug].vue       → 404 catch-all
```

### 访问 router / route

```vue
<script setup lang="ts">
const route = useRoute()       // Nuxt 自动 import
const router = useRouter()     // Nuxt 自动 import
</script>
```

### Middleware（替代 beforeEach）

```ts
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  if (to.meta.requiresAuth && !useAuth().isLoggedIn) {
    return navigateTo('/login')
  }
})
```

> **Nuxt 中**：用 `navigateTo()` 而非 `router.push()`——后者只在客户端有效、Nuxt 中会跳过 SSR。

## 常见踩坑

### 1. `params` 与 `path` 互斥

```ts
// ❌ params 被忽略
router.push({ path: '/users/1', params: { id: 1 } })

// ✅ 用 name + params
router.push({ name: 'user', params: { id: 1 } })

// ✅ 或手动拼接 path
router.push(`/users/${id}`)
```

### 2. 直接 watch 整个 route 性能差

```ts
// ❌ 任何 query / hash 变化都触发
watch(() => route, () => fetchData())

// ✅ 只 watch 关心的字段
watch(() => route.params.id, () => fetchData())
```

### 3. 嵌套路由 path 不以 `/` 开头

```ts
// ❌ /profile 被当成绝对路径
{ path: '/users/:id', children: [{ path: '/profile', component: Profile }] }

// ✅ 相对父路径
{ path: '/users/:id', children: [{ path: 'profile', component: Profile }] }
```

### 4. catch-all 必须放最后

```ts
// ❌ 顶级 catch-all 在前面——所有路由都被它吞掉
const routes = [
  { path: '/:pathMatch(.*)*', component: NotFound },
  { path: '/', component: Home }, // 永远不会匹配
]

// ✅ catch-all 在最后
const routes = [
  { path: '/', component: Home },
  { path: '/:pathMatch(.*)*', component: NotFound },
]
```

### 5. HTML5 模式刷新 404

部署到 nginx / Vercel / Netlify 后**刷新页面 404**——必须配 fallback 到 `index.html`：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### 6. Hash 模式 SEO 差

SEO 要求高 → 必须用 `createWebHistory()` + 服务端 fallback；Hash 模式不被搜索引擎索引子路径。

### 7. 守卫返回值替代 `next()`

```ts
// v4 推荐写法
router.beforeEach((to) => {
  if (notAuth) return { name: 'login' }
})

// v3 旧写法（仍可用但不推荐）
router.beforeEach((to, from, next) => {
  if (notAuth) next({ name: 'login' })
  else next()
})
```

### 8. `<script setup>` 没有 `onBeforeRouteEnter`

Composition API 只暴露 `onBeforeRouteUpdate` / `onBeforeRouteLeave`——`Enter` 不存在（setup 时组件已开始创建）。改用：
- 全局 `router.beforeEach` 守卫
- 路由级 `beforeEnter` + `props` 传数据
- 组件 `onMounted` + `watch(route.params)` 自行加载

### 9. KeepAlive 需要组件 name

```vue
<!-- 必须给组件命名 -->
<script setup lang="ts">
defineOptions({ name: 'UserList' })
</script>
```

### 10. addRoute 不会自动触发当前匹配

```ts
router.addRoute({ path: '/new', component: NewView })
// 当前 URL 已经是 /new 但仍渲染 NotFound——必须手动触发
router.replace(router.currentRoute.value.fullPath)
```

### 11. 懒加载组件用 `() => import()` 而非 `defineAsyncComponent`

```ts
// ❌ 路由组件不能用 defineAsyncComponent
const X = defineAsyncComponent(() => import('./X.vue'))

// ✅ 直接传函数
const X = () => import('./X.vue')
```

### 12. `route.params.xxx` 永远是字符串

```ts
// /users/123
route.params.id // '123' （字符串！）

// 需要数字时手动转换
const id = Number(route.params.id)
```

或在 props 函数中转换：

```ts
{
  path: '/users/:id',
  component: User,
  props: (route) => ({ id: Number(route.params.id) }),
}
```

### 13. v4 严格要求 `path` 不能有相对路径

```ts
// ❌ Vue Router 4 不支持相对路径
{ path: './profile', component: Profile }

// ✅ 嵌套路由的子 path 不带 /
{ path: '/users', children: [{ path: 'profile', component: Profile }] }
```

### 14. 重定向不触发守卫源路由

```ts
const routes = [
  {
    path: '/home',
    redirect: '/',
    beforeEnter: (to) => { /* ❌ 永远不会执行 */ },
  },
]
```

守卫只在重定向**目标**路由上触发。

## 与其他生态集成

### Pinia + Vue Router

守卫中直接用 `useXxxStore()`：

```ts
import { useAuthStore } from '@/stores/auth'

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```

> **`useStore()` 在守卫中可调用**——因为 `pinia.install(app)` 在 `app.use(router)` 之前完成、active pinia 已就绪。

### Vue I18n + Vue Router

路由切换时设置语言：

```ts
import { useI18n } from 'vue-i18n'

router.beforeEach((to) => {
  const { locale } = useI18n({ useScope: 'global' })
  locale.value = (to.params.lang as string) || 'zh'
})
```

### Vitest 单元测试

```ts
import { createRouter, createMemoryHistory } from 'vue-router'
import { mount } from '@vue/test-utils'

test('navigate to user page', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Home },
      { path: '/users/:id', component: User },
    ],
  })

  const wrapper = mount(App, {
    global: { plugins: [router] },
  })

  await router.push('/users/1')
  await router.isReady()

  expect(wrapper.html()).toContain('User 1')
})
```

> **测试中用 `createMemoryHistory()`**——避免污染浏览器 URL。

## 下一步

至此你已掌握 Vue Router 4 的核心——**路由匹配语法** / **嵌套路由 + Named Views** / **redirect / alias** / **Props 解耦** / **三种 history 模式 + 服务端配置** / **完整路由守卫体系** / **Route Meta + TS** / **`<RouterView>` slot 与 Transition / KeepAlive / Suspense** / **Scroll Behavior** / **Lazy Loading** / **数据获取模式** / **动态路由** / **导航失败检测** / **Typed Routes** / **Nuxt SSR** / **常见踩坑**。

继续学习：

- [参考](./reference.md)：**API 速查**——所有导出函数 / 组件 / 类型 / RouterOptions / RouteRecordRaw / RouteLocationNormalized / 守卫签名 / NavigationFailureType / RouteMeta 模块扩展示例
