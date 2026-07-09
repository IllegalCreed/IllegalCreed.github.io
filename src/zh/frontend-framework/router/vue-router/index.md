---
layout: doc
---

# Vue Router

Vue.js 官方御用路由库，由 **Eduardo San Martin Morote**（Vue 核心团队成员、Pinia 作者）领衔维护。Vue Router 与 Vue 同一组核心团队、同一时间线发布——Vue 1.x 时代起就是 Vue 单页应用的标配路由方案，Vue 2 时代有 **Vue Router 3.x**（仅支持 Vue 2），Vue 3 + Composition API 时代发布 **Vue Router 4.x**（仅支持 Vue 3，最新稳定版 **v4.5.x**），2025 年起 **Vue Router 5.x**（实验性，与 v4 共享文档与大部分 API、新增 [Data Loaders](https://uvr.esm.is/data-loaders/) 实验性接口）进入预览阶段。Vue Router 的设计哲学：**与 Vue 反应式系统深度耦合**——`useRoute()` 返回的 route 是 `reactive` 对象、所有 params / query / hash 自动响应、`<RouterView>` 通过 Vue 内置 `<Transition>` / `<KeepAlive>` / `<Suspense>` 完美组合（slot API）。**核心特性矩阵**：**三种 history 模式**（`createWebHistory` 标准 HTML5 / `createWebHashHistory` Hash / `createMemoryHistory` SSR 与 Node）/ **嵌套路由 + Named Views**（`children` + 多 `<RouterView name="...">`）/ **动态路由匹配**（`:param` / `:param?` 可选 / `:param+` 重复 / `:param(\\d+)` 正则 / `:pathMatch(.*)*` 通配 404）/ **路由守卫三层级**（全局 `beforeEach` / `beforeResolve` / `afterEach` / 路由级 `beforeEnter` / 组件内 `beforeRouteEnter` / `beforeRouteUpdate` / `beforeRouteLeave`，Composition API 等价 `onBeforeRouteUpdate` / `onBeforeRouteLeave`）/ **导航失败检测**（`isNavigationFailure` + `NavigationFailureType.aborted` / `cancelled` / `duplicated`）/ **Route Meta + TS 类型扩展**（`declare module 'vue-router' { interface RouteMeta { ... } }`）/ **滚动行为定制**（`scrollBehavior(to, from, savedPosition)`）/ **路由懒加载 + Code Splitting**（`() => import('./views/X.vue')`）/ **动态路由 API**（`router.addRoute` / `router.removeRoute` / `router.hasRoute` / `router.getRoutes`）/ **Typed Routes**（v4.4+，配合 [unplugin-vue-router](https://uvr.esm.is/) 自动生成路由类型）/ **完美 SSR**（与 Nuxt 通过自动 `<NuxtPage>` / `<NuxtLink>` 无缝集成）。**典型用户群**：所有 Vue 3 SPA / Nuxt 3+ / Element Plus / Naive UI / Quasar Framework 等 UI 库的 docs 站点 / `vee-validate` / `vueuse` 的演示项目 / 几乎 100% 的中大型 Vue 应用——Vue 官方推荐、Vue 生态唯一路由方案。

## 评价

**优点**

- **Vue 官方钦定 + Pinia 同一作者**：Eduardo 同时维护 Vue Router + Pinia + Vue 核心，三库深度协同（路由守卫中可直接 `useXxxStore()`），社区方向唯一确定
- **Vue 3 Reactivity 完美适配**：`useRoute()` 返回的 route 对象 **自动响应**——`watch(() => route.params.id, ...)` / `computed(() => route.query.q)` 都是 idiomatic 用法，无需手动订阅
- **声明式 + 编程式双轨**：`<RouterLink to="...">` 声明式 + `router.push()` 编程式，**两种风格自由组合**——`<RouterLink>` 自带 a11y（aria-current）+ 中键打开新标签等浏览器原生交互
- **嵌套路由 + Named Views 一等公民**：`children: [...]` 递归嵌套，`<RouterView>` 父子层级自动挂载；`components: { default, sidebar, footer }` 多视图同屏
- **路由守卫体系完整**：**全局 / 路由级 / 组件内**三层守卫互补，**异步守卫**自然支持（`async beforeEach`）、**重定向链**通过返回 location 对象一气呵成
- **导航是 Promise**：`await router.push(...)` 拿到结果——成功 `undefined`、失败 Navigation Failure 对象（含 `NavigationFailureType.aborted` / `cancelled` / `duplicated` 分类）
- **TypeScript 全面拥抱**：`RouteRecordRaw` / `RouteLocationNormalized` / `NavigationGuardWithThis` 类型完善；v4.4+ 支持 `declare module 'vue-router' { interface TypesConfig { RouteNamedMap } }` 实现**完全类型化的路由名称 + params**
- **History 模式三种全覆盖**：`createWebHistory`（HTML5，SEO 友好但需服务端 fallback）/ `createWebHashHistory`（Hash，零服务端配置但 SEO 差）/ `createMemoryHistory`（Node SSR / 单元测试 / Electron）
- **`<RouterView>` Slot API**：`<RouterView v-slot="{ Component, route }">` 暴露当前组件 + route，组合 `<Transition>` / `<KeepAlive>` / `<Suspense>` **任意嵌套**——这是 Vue Router 4 相对 v3 最大的设计升级
- **懒加载零样板**：`{ component: () => import('./X.vue') }` 一行启用 code splitting，Vite + Vue Router 配合零配置就能 chunk per route
- **动态路由能力**：`router.addRoute` / `router.removeRoute` / `router.hasRoute` / `router.getRoutes` 运行时增删路由——SaaS 多租户 / 权限驱动路由 / 微前端最常用
- **滚动行为可定制**：`scrollBehavior(to, from, savedPosition)` 返回坐标对象 / 元素选择器 / Promise——支持锚点、保留 back/forward 位置、smooth scroll
- **Typed Routes 试验性 v4.4+**：配合 [unplugin-vue-router](https://uvr.esm.is/) 文件系统路由 → 自动生成 `RouteNamedMap` 接口、`router.push({ name: '/users/[id]' })` 全自动补全
- **生态深度集成**：Nuxt 3+（`@nuxt/router-builder`）/ VitePress（自定义路由）/ Vue DevTools 7（路由树可视化、导航历史回放）

**缺点**

- **`<RouterView>` slot 必须 single root**：`<Transition>` 包裹时只能一个根元素——Vue 3 多根模板（fragment）需要包一层 div 才能用 transition
- **嵌套 catch-all 易踩坑**：`/:pathMatch(.*)*` 顶级 catch-all 容易吞掉子路由——必须放在 `routes` 数组末尾 + 注意 children 数组排序
- **`params` 不能传 path**：`router.push({ path: '/users/123', params: { id: '123' } })` 中 params **会被忽略**——必须用 `name + params` 组合，新手最大坑
- **path 中的 query 与 params 混淆**：`/search?q=vue` 是 query，`/users/:id` 是 params——文档写得清楚但仍是高频面试题
- **history 模式服务端配置麻烦**：HTML5 模式必须配 nginx `try_files`/ Apache `mod_rewrite` / Express `connect-history-api-fallback`——SPA 部署最常见 404 来源
- **Hash 模式 SEO 差**：`#/users/123` 在 URL 中的 fragment 不会传到服务器、爬虫不友好——所以 Nuxt SSR 必用 HTML5
- **导航守卫的 `next()` v4 已废弃**：v4 推荐**返回值**而非 `next(...)`——但很多 v3 教程仍在用 `next()`，迁移容易留坑
- **`onBeforeRouteEnter` 不存在**：Composition API 只暴露 `onBeforeRouteUpdate` / `onBeforeRouteLeave`，**没有 onBeforeRouteEnter**（因为 setup 时组件还没创建）——必须用全局 `beforeEach` 或路由 `beforeEnter` 替代
- **Async 组件 + Suspense + KeepAlive 复杂**：三者组合时 `<RouterView>` slot 的写法非常讲究、易出 hydration 错误
- **Data Loaders 仍试验性**：Vue Router 5.x 的 [Data Loaders](https://uvr.esm.is/data-loaders/) 还未稳定，目前社区主流仍是 `onBeforeRouteUpdate` + watcher 手写数据获取——比 TanStack Router / Remix 的内置 loader 心智成本高
- **Typed Routes 需第三方插件**：v4.4+ 提供了 `TypesConfig` 接口但**手动维护 `RouteNamedMap` 不现实**——必须配 unplugin-vue-router 自动生成
- **vs React Router / TanStack Router**：Vue Router 强调「Vue 反应式 + slot 组合」；React Router 7 强调「Data Loader + Server Actions」；TanStack Router 强调「**100% TS 类型化 + 编译期路由表**」——三者哲学差异大、不可直接对应迁移
- **vs Nuxt 文件系统路由**：Nuxt 用 `pages/` 目录约定式路由——开发体验更轻；但 Vue Router 原生是**配置式**（手写 routes 数组）。文件系统路由需要 [unplugin-vue-router](https://uvr.esm.is/) 补齐

## 文档地址

[Vue Router 官网](https://router.vuejs.org/) | [Introduction](https://router.vuejs.org/introduction.html) | [Installation](https://router.vuejs.org/installation.html) | [Getting Started](https://router.vuejs.org/guide/) | [Guide - Essentials](https://router.vuejs.org/guide/essentials/dynamic-matching.html) | [Guide - Advanced](https://router.vuejs.org/guide/advanced/navigation-guards.html) | [API Reference](https://router.vuejs.org/api/) | [中文文档](https://router.vuejs.org/zh/)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vue-router" target="_blank" rel="noopener noreferrer">Vue Router 测试题</a>


## GitHub 地址

[vuejs/router](https://github.com/vuejs/router) | [unplugin-vue-router](https://github.com/posva/unplugin-vue-router)（文件系统路由 + Typed Routes 自动化）| [Data Loaders 规范](https://github.com/vuejs/rfcs/discussions/700)

## 学习路径

- [入门](./getting-started.md)：`pnpm add vue-router@4` 安装 / `createRouter` + `createWebHistory` 创建实例 / `app.use(router)` 注册 / `<RouterLink>` + `<RouterView>` 模板用法 / 路径参数 `:id` / `useRoute` + `useRouter` Composition API / 编程式 `router.push` / 第一个完整 SPA Demo
- [指南](./guide-line.md)：**核心**：路由匹配语法（动态段 / 可选 / 重复 / 正则 / catch-all）/ 嵌套路由 + Named Views / Redirect 和 Alias / Props 解耦 / 三种 history 模式 + 服务端配置 / 完整路由守卫（全局 / 路由级 / 组件内 + Composition API）/ Route Meta + TypeScript 扩展 / `<RouterView>` slot 与 Transition / KeepAlive / Suspense 组合 / Scroll Behavior / Lazy Loading + Code Splitting / 数据获取模式（before vs after 导航）/ 动态路由（addRoute / removeRoute）/ Typed Routes + unplugin-vue-router / Nuxt SSR 集成 / 常见踩坑（hash 模式 SEO / 嵌套 catch-all / params 与 path 互斥）
- [参考](./reference.md)：**API 速查**：`createRouter` / `createWebHistory` / `createWebHashHistory` / `createMemoryHistory` / `useRouter` / `useRoute` / `useLink` / `<RouterView>` / `<RouterLink>` 完整 props / `router.push` / `replace` / `back` / `go` / `forward` 全签名 / `beforeEach` / `beforeResolve` / `afterEach` 守卫签名 / `isNavigationFailure` + `NavigationFailureType` / `onBeforeRouteUpdate` / `onBeforeRouteLeave` / `RouterOptions` / `RouteRecordRaw` / `RouteLocationNormalized` 完整类型 / `RouteMeta` 模块扩展 / `RouteNamedMap` Typed Routes 示例
