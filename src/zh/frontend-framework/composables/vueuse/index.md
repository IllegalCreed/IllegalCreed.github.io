---
layout: doc
---

# VueUse

**Vue 组合式工具函数集合（Collection of Vue Composition Utilities）**——由 **Anthony Fu（Vue / Vite / Nuxt 核心团队成员、`unplugin` / `slidev` / `vitest` 作者）** 发起、与社区 contributors 共同维护的 **Vue 3 组合式函数库**，是当今 Vue 生态中**最流行的工具型 composable 库**。VueUse 不是 UI 组件库、不渲染任何视觉元素，它做的事情是把「**鼠标位置 / 元素尺寸 / 暗色模式 / 本地存储 / 网络请求 / 防抖节流 / 剪贴板 / 媒体查询**」等**与浏览器交互的有状态逻辑**封装成一个个可直接 `import` 的 **composable（组合式函数）**——你只需 `const { x, y } = useMouse()` 一行，就拿到一个**响应式、随组件卸载自动清理副作用、SSR 友好、TypeScript 类型完备**的鼠标坐标。**最新稳定版 v14.3.0**（2026 年发布），**200+ composables** 覆盖 **State / Elements / Browser / Sensors / Network / Animation / Component / Watch / Reactivity / Array / Time / Utilities 共 12 大分类**，**100% TypeScript 编写**、**完全 Tree-shakeable**（按需打包，没用到的函数零体积）、**SSR 友好**（服务端渲染不报错）、**可直接 CDN 引入**（挂在 `window.VueUse`）。**Vue 3 专用**——自 **v12.0 起不再支持 Vue 2**（Vue 2 项目需停留在 v11.x），**v14 起要求 Vue 3.5+**。**核心设计哲学**：**① 函数返回 ref 对象**（既可 `const { x, y } = useMouse()` 解构、也可 `reactive(useMouse())` 一次性去掉 `.value`）；**② 副作用自动清理**（composable 内的事件监听 / 定时器随组件 unmount 自动移除，部分函数额外返回 `stop` 句柄供手动停止，配合 Vue `effectScope` 还能批量管理）；**③ 响应式参数统一**（参数普遍接受 `MaybeRef` / `MaybeRefOrGetter`，内部用 `toValue()` 统一解包——你传普通值、`ref`、`computed`、甚至 `() => x.value` getter 都行，这是 VueUse 的精髓）；**④ `controls` 选项**（同一个函数两种返回：`useTimestamp()` 直接返回时间戳 ref，`useTimestamp({ controls: true })` 多返回 `pause` / `resume` 控制句柄）；**⑤ `isSupported` 模式**（涉及实验性浏览器 API 的函数返回 `isSupported` ref 供降级判断）；**⑥ `configurableWindow` / `configurableDocument`**（可注入自定义 `window` / `document`，便于 iframe 与单测）；**⑦ 异步 composable 返回 PromiseLike**（如 `useFetch` 可直接 `await`）。**包结构**：`@vueuse/core` 主包（200+ 函数）+ **10 个 add-on**（`@vueuse/router` / `@vueuse/integrations`（封装 axios / cookie-es / fuse.js / jwt 等）/ `@vueuse/math` / `@vueuse/motion` / `@vueuse/rxjs` / `@vueuse/firebase` / `@vueuse/electron` / `@vueuse/head` / `@vueuse/sound` / `@vueuse/schema-org`）+ **`@vueuse/components`**（把 composable 包装成无渲染组件，模板里用 `<UseMouse v-slot>`）+ **`@vueuse/nuxt`**（Nuxt 模块，全应用自动导入，无需手写 import）。**自动导入**：配合 `unplugin-auto-import` 的 `@vueuse/core` preset，可在任意 `.vue` 里直接写 `useMouse()` 而不写 `import`。**旗舰 composable**：`useMouse`（鼠标坐标）、`useDark` / `useColorMode`（暗色模式 + 持久化 + 跟随系统）、`useStorage` / `useLocalStorage`（响应式本地存储）、`useFetch`（响应式 HTTP，可 `await`、可中止）、`useClipboard`（剪贴板读写）、`useElementSize`（元素尺寸）、`useEventListener`（自动清理的事件监听）、`onClickOutside`（点击元素外部）、`useBreakpoints`（响应式断点）、`useDebounceFn`（函数防抖）、`useToggle`（布尔切换）、`useVModel`（`v-model` 辅助）。**典型用户群**：**几乎所有 Vue 3 项目**——VueUse 的定位类似「Vue 版的 lodash + 浏览器 API 封装」，绝大多数 Vue 3 应用都会装它来消除重复的「监听 + 清理」样板代码；**Element Plus / Naive UI / Arco Design Vue 等 UI 库本身**也大量内部依赖 VueUse；**Nuxt 项目**通过 `@vueuse/nuxt` 享受全自动导入。**截至 2026 年的 v14.x** 处于「**成熟稳定期**」——Anthony Fu 与社区高频迭代、GitHub 22k+ Star、npm 周下载量数百万——是「**Vue 3 项目的事实标准工具库**」。

## 评价

**优点**

- **Vue 生态核心成员领衔**：作者 **Anthony Fu** 同时是 **Vue / Vite / Nuxt 核心团队成员**、`unplugin` / `unocss` / `slidev` / `vitest` 等明星项目作者——VueUse 的设计与 Vue 响应式系统、Vite 构建生态**高度同源**，跟随 Vue 演进的可靠性最有保障
- **200+ composable 覆盖全场景**：State（`useStorage` / `useRefHistory`）+ Elements（`useElementSize` / `useElementVisibility`）+ Browser（`useDark` / `useClipboard` / `useEventListener`）+ Sensors（`useMouse` / `useScroll` / `onClickOutside`）+ Network（`useFetch` / `useWebSocket` / `useEventSource`）+ Animation（`useTransition` / `useRafFn`）+ Component / Watch（`watchDebounced` / `until`）+ Reactivity（`computedAsync` / `syncRef`）+ Array / Time（`useDateFormat` / `useNow`）+ Utilities（`useDebounceFn` / `useToggle`）——**日常 Vue 业务里 80% 的「监听 + 清理」样板代码都能用一个函数替代**
- **完全 Tree-shakeable**：基于 ESM 按需 `import`，**没用到的 composable 零打包体积**——装了整个 `@vueuse/core` 但只用 `useMouse`，最终 bundle 里只有 `useMouse` 的代码
- **副作用自动清理**：composable 内部的 `addEventListener` / `setInterval` / `IntersectionObserver` **随组件 unmount 自动移除**——彻底消除「忘记在 `onUnmounted` 里清理导致内存泄漏」这一最常见的 Vue 副作用 Bug
- **响应式参数统一（MaybeRef / toValue）**：参数普遍接受 `MaybeRef<T>` / `MaybeRefOrGetter<T>`——**普通值、`ref`、`computed`、`() => x` getter 任意一种都能传**，内部用 `toValue()` 统一解包——这是 VueUse 区别于普通工具库的精髓，让组合式逻辑天然「响应式联动」
- **TypeScript 类型完备**：源码 **100% TypeScript 编写**，所有 composable、选项、返回值都有完整 `.d.ts`——`const { x } = useMouse()` 里的 `x` 自动推导为 `Ref<number>`，无需 `@types/*`
- **SSR 友好**：在服务端渲染（Nuxt / Vite SSR）环境下不会因访问 `window` / `document` 而崩溃——内部做了环境判断与降级，配合 `@vueuse/nuxt` 还能全应用自动导入
- **`@vueuse/nuxt` 全自动导入**：Nuxt 项目 `npx nuxt module add vueuse` 后，`.vue` 里直接写 `useMouse()` / `useDark()` **无需任何 import**——零样板
- **无渲染组件版本**：`@vueuse/components` 把 composable 包装成 `<UseMouse v-slot="{ x, y }">` 等无渲染组件——**偏好模板写法、不想在 `<script>` 里调用函数的场景**也能用
- **丰富的集成 add-on**：`@vueuse/integrations` 直接封装 `axios` / `cookie-es` / `fuse.js`（模糊搜索）/ `jwt-decode` / `qrcode` / `focus-trap` / `nprogress` 等常见第三方库为 composable——省去自己封装
- **`controls` / `isSupported` 等约定一致**：所有 composable 遵循同一套设计约定（`controls` 选项控制返回粒度、`isSupported` 做能力探测、`configurableWindow` 注入依赖）——**学会一个，其余触类旁通**
- **文档质量极高**：[vueuse.org](https://vueuse.org/) 每个函数都有**可交互的在线 Demo**、Type Declarations、Source 链接——边看边试
- **持续高频迭代**：截至 2026 年 v14.x、GitHub 22k+ Star、npm 周下载数百万——**Vue 3 生态保养最好的工具库之一**

**缺点**

- **Vue 3 专用、不支持 Vue 2**：自 **v12.0 起放弃 Vue 2**（Vue 2 项目只能停在 v11.x，不再获得新特性），**v14 起更要求 Vue 3.5+**——老项目升级前需先核对 Vue 版本
- **不是 UI 库**：VueUse **只提供逻辑、不渲染任何视觉**——需要按钮、表格、对话框仍要搭配 Element Plus / Naive UI / Arco Design Vue 等组件库，两者职责不同、互补而非替代
- **函数太多、易选择困难**：200+ composable 中不少功能相近（`useStorage` vs `useLocalStorage` vs `useSessionStorage`、`useDebounceFn` vs `watchDebounced` vs `refDebounced`），**新人需要先理解分类与命名约定**才能快速定位
- **过度封装风险**：极简单的逻辑（一次性的 `addEventListener`）直接用原生 API 反而更清晰——**为了用 VueUse 而 VueUse** 会引入不必要的抽象，应按「是否真的需要响应式 + 自动清理」来决定
- **响应式参数约定有学习成本**：`MaybeRef` / `MaybeRefOrGetter` / `toValue()` 这套约定虽强大，但**新人初次接触会困惑「为什么传普通值也行、传 getter 也行」**——需要先吃透 Vue 响应式基础
- **部分 composable 依赖实验性浏览器 API**：如 `useBattery` / `useNetwork` / `useDeviceMotion` 等基于较新或非标准 Web API，**必须配合返回的 `isSupported` 做降级**，否则在不支持的浏览器上静默失效
- **add-on 需单独安装**：`@vueuse/router` / `@vueuse/integrations` / `@vueuse/motion` 等不在 `@vueuse/core` 内，**用到才装**——容易出现「以为装了 core 就有 `useRouteQuery`」的误解
- **vs 自己写 composable**：VueUse 是「**通用工具**」，**业务专属逻辑**（如「当前订单状态机」）仍应自己写组合式函数——VueUse 解决的是**与浏览器 / 通用模式相关**的重复劳动，不替代业务封装
- **vs lodash / RxJS**：lodash 是**无响应式的纯数据工具**（防抖 / 深拷贝 / 集合操作）、RxJS 是**通用响应式流**；VueUse 是**深度绑定 Vue 响应式系统**的工具——三者定位不同，VueUse 在 Vue 项目里最贴合，但纯数据处理仍可能用到 lodash

## 文档地址

[VueUse 官网](https://vueuse.org/) | [Get Started 入门](https://vueuse.org/guide/) | [Best Practice 最佳实践](https://vueuse.org/guide/best-practice) | [Configurations 全局配置](https://vueuse.org/guide/config) | [Components 无渲染组件](https://vueuse.org/guide/components) | [函数总览（200+）](https://vueuse.org/functions) | [Add-ons 扩展包](https://vueuse.org/add-ons) | [useMouse](https://vueuse.org/core/useMouse/) | [useDark](https://vueuse.org/core/useDark/) | [useStorage](https://vueuse.org/core/useStorage/) | [useFetch](https://vueuse.org/core/useFetch/)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vueuse" target="_blank" rel="noopener noreferrer">VueUse 测试题</a>


## GitHub 地址

[vueuse/vueuse](https://github.com/vueuse/vueuse)（主仓库，22k+ Star，MIT 许可）| [Anthony Fu](https://github.com/antfu)（作者，Vue / Vite / Nuxt 核心团队成员）| [vueuse.org 源码](https://github.com/vueuse/vueuse/tree/main/packages)（monorepo：`core` / `shared` / `router` / `integrations` / `math` / `nuxt` 等各包）| [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import)（配合 VueUse preset 实现自动导入）

## 学习路径

- [入门](./getting-started.md)：`pnpm add @vueuse/core` 安装 / VueUse 是什么（与 lodash / RxJS / React Hooks 库的区别） / 基本用法（解构 ref + `reactive()` 去 `.value` + 副作用自动清理 + `stop` 句柄 + `effectScope` 批量管理） / 自动导入（`unplugin-auto-import` 的 `@vueuse/core` preset + `@vueuse/nuxt` 模块） / 第一个 VueUse 应用（`useMouse` + `useDark` + `useStorage` + `useClipboard` 综合 `.vue` 示例） / **必须懂的概念**：响应式参数约定（`MaybeRef` / `MaybeRefOrGetter` / `toValue()`——VueUse 的精髓） / SSR 友好 / TypeScript 类型推导 / 与 Vue Router + Pinia 配合 / CDN 引入
- [指南](./guide-line.md)：**核心**：12 大分类 200+ composable 系统速览（State / Elements / Browser / Sensors / Network / Animation / Component / Watch / Reactivity / Array / Time / Utilities） / **State 深度**（`useStorage` / `useLocalStorage` 的序列化器、`useRefHistory` 撤销重做、`createGlobalState` 跨组件共享） / **Sensors 深度**（`useMouse` / `useScroll` / `useElementVisibility` / `onClickOutside` / `useInfiniteScroll`） / **Network 深度**（`useFetch` 的链式 `.json()` / `.post()` / 中止 / 重试、`useWebSocket` 心跳重连、`useEventSource`） / **Watch 增强**（`watchDebounced` / `watchThrottled` / `watchOnce` / `until` 异步等待 / `watchPausable`） / **`controls` / `isSupported` / `configurableWindow` 约定深挖** / **`@vueuse/components` 无渲染组件** / **add-on 详解**（`@vueuse/router` 的 `useRouteQuery` / `@vueuse/integrations` 的 `useAxios` / `useFuse`） / **SSR + Nuxt 完整方案** / **TypeScript 类型推导** / **常见踩坑**（响应式参数解包、SSR hydration、实验性 API 降级）
- [参考](./reference.md)：**API 速查**：12 大分类常用 composable 列表 / 高频函数签名速查表（`useMouse` / `useDark` / `useStorage` / `useFetch` / `useClipboard` / `useElementSize` / `useEventListener` / `onClickOutside` / `useBreakpoints` / `useDebounceFn` / `useToggle` / `useVModel`） / **响应式工具类型**（`MaybeRef` / `MaybeRefOrGetter` / `Fn` / `ConfigurableWindow`） / **`controls` / `isSupported` 选项对照** / **add-on 包列表与安装** / **`@vueuse/components` 无渲染组件清单**
