---
layout: doc
---

# Nuxt

Vue 官方维护的元框架，建在 Vue 3 + Vite + Nitro 之上，把"渲染库 Vue"升级成「文件路由 + SSR / SSG / ISR / hybrid + 服务端 API + 自动导入 + 模块生态」一整套。Nuxt 4（2025）相比 Nuxt 3 最大的变化是引入了 `app/` 目录把客户端代码与服务端 / 共享代码分开，类型推导和性能都更好。

## 评价

**优点**

- **Vue 圈事实标准**：Vue 3 项目要 SSR / SSG 时几乎没有第二选择；与 Vue 核心组同一团队维护，路线长期稳定
- **约定优于配置**：`pages/` 是路由、`composables/` 自动导入、`server/api/` 自动暴露成 API，新人上手快
- **渲染模式齐**：默认 SSR；`routeRules` 一行切换 SSG / ISR / SWR / CSR，混合渲染开箱即用
- **Nitro 服务引擎**：内置 H3 + 路由 + middleware + plugins，**不需要再装 Express / Fastify**；同一份代码可部署到 Node / Vercel / Netlify / Cloudflare / Deno / Bun
- **模块生态完整**：`@nuxt/image` / `@nuxt/content` / `@pinia/nuxt` / `@nuxt/ui` / 数十种官方与社区模块，多数装一行配置即用
- **DX 顶级**：Nuxt DevTools 内置（页面 / 组件 / 路由 / payload / hooks 可视化）、TypeScript 零配置、自动生成 types

**缺点**

- **抽象层多**：自动导入 + 神奇目录 + Nitro 服务器对老 Vue 开发者来说要重新学一套心智模型
- **依赖体积大**：哪怕做一个简单 SPA 也要拉进 Nitro + 完整 module 链；起步项目 node_modules 几百兆
- **TypeScript 类型链路复杂**：Nuxt 4 的 `app/` + `server/` + `shared/` 三套 tsconfig 互引偶尔报奇怪错，需要熟悉 type project references
- **模块质量参差**：官方维护的模块靠谱，但社区模块更新滞后或与 v4 不兼容的不少；选模块前最好看下最近 release
- **生态绑定**：一旦深度用 `useFetch` / `definePageMeta` / `defineNuxtConfig` 这些 Nuxt-only API，迁出 Nuxt 几乎要重写

## Nuxt 4 vs Nuxt 3 关键变化

- **目录结构重组**：默认源码进 `app/`，与 `server/` / `shared/` / `content/` / `layers/` / `modules/` / `public/` 平级
- **数据获取共享**：相同 key 的 `useFetch` / `useAsyncData` 现在共享 data / error / status，最后一个消费者卸载时数据自动释放
- **响应式更浅**：`useAsyncData` / `useFetch` 用 `shallowRef`（之前是 `ref`），大对象性能更好
- **模块加载顺序修正**：layer 模块先加载，项目模块后加载（之前是反的）
- **TypeScript 多上下文 tsconfig**：app / server / node / shared 各一份，类型隔离更干净
- **`noUncheckedIndexedAccess` 默认开**：数组下标访问会推断成 `T | undefined`

兼容性：Nuxt 3 项目大多自动识别旧目录结构能跑，但建议趁早迁移到 `app/`。

## 文档地址

[Nuxt Documentation](https://nuxt.com/docs)

## GitHub 地址

[nuxt/nuxt](https://github.com/nuxt/nuxt)

## 幻灯片地址

<a href="/SlideStack/nuxt-slide/" target="_blank">Nuxt</a>
