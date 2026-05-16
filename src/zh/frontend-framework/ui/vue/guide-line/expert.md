---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> 响应式底层、Vapor、SSR、编译优化、性能调优、自定义指令、测试、迁移

## 速查

- 响应式底层：`Proxy + Reflect` 拦截 get/set；`track` 收集依赖、`trigger` 触发更新
- 编译优化：`block` / `patchFlag` / 静态提升 / `cacheHandlers` —— 模板编译期决定运行时只 diff 动态部分
- **Vapor Mode**：跳过 VDOM 直接生成 DOM 操作的编译目标，目前在 `vapor-alpha-branch` 孵化，**3.5 稳定版未集成**
- SSR：`@vue/server-renderer` 的 `renderToString` / `renderToWebStream`；Vite SSR template；Hydration mismatch 检测
- 性能：`v-once`（一次性渲染）/ `v-memo`（依赖数组缓存）/ `shallowRef`（跳过深 proxy）
- 自定义指令：7 个生命周期 hook（`created` / `beforeMount` / `mounted` / `beforeUpdate` / `updated` / `beforeUnmount` / `unmounted`）
- 测试：Vitest + `@vue/test-utils` 的 `mount` / `shallowMount`；E2E 用 Cypress / Playwright
- 迁移：Vue 2 → Vue 3 用官方 codemod；Options API → Composition API 渐进
- Web Components：`defineCustomElement` 把 Vue 组件编译成原生 CE

## 响应式底层

### Proxy + Reflect

Vue 3 用 ES6 Proxy 替代 Vue 2 的 `Object.defineProperty`：

```ts
// 简化版 reactive 实现
const targetMap = new WeakMap()   // target → keyMap
let activeEffect = null

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return result
    },
  })
}

function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  dep?.forEach(effect => effect())
}
```

### Vue 2 vs Vue 3 响应式对比

| 维度 | Vue 2 (`Object.defineProperty`) | Vue 3 (`Proxy`) |
|---|---|---|
| 新增字段 | 不响应（要 `Vue.set`） | 自动响应 |
| 删除字段 | 不响应（要 `Vue.delete`） | 自动响应 |
| 数组下标 | 不响应（要 `splice`） | 自动响应 |
| `length` 修改 | 不响应 | 自动响应 |
| Map / Set | 不支持 | 完整支持 |
| 性能 | 初始化时递归 defineProperty | 惰性（访问时才代理嵌套） |
| 浏览器支持 | IE9+ | 不支持 IE（Proxy 无 polyfill） |

### `track` / `trigger` / `effect`

```ts
import { effect, reactive } from '@vue/reactivity'

const state = reactive({ count: 0, name: 'Alice' })

const runner = effect(() => {
  // 函数内读取的所有 reactive 字段被追踪
  console.log(`Count: ${state.count}`)
})

state.count++   // 自动触发 console.log
state.name = 'Bob'   // 不触发（effect 没读 name）

// 停止 effect
runner.stop()
```

### `@vue/reactivity` 独立用

Vue 3 的响应式系统可独立使用（不需要 Vue 组件）：

```bash
pnpm add @vue/reactivity
```

```ts
import { ref, computed, effect } from '@vue/reactivity'

const count = ref(0)
const doubled = computed(() => count.value * 2)

effect(() => {
  console.log(`doubled: ${doubled.value}`)
})

count.value++   // 自动 log
```

适合：**任意 JS 项目**做响应式状态管理；e.g. node CLI / Tauri / Electron / Web Worker。

### `effectScope` —— 批量管理

```ts
import { effectScope, ref, watch } from 'vue'

const scope = effectScope()

scope.run(() => {
  const count = ref(0)

  watch(count, (val) => console.log(val))

  watch(count, (val) => sendAnalytics(val))
})

// 一键停止 scope 内所有 watch / computed / effect
scope.stop()
```

适合：动态创建的 composable 集合，或者全局插件需要在卸载时清理多个 watch。

### `customRef` 实现节流

```ts
import { customRef } from 'vue'

function useThrottledRef<T>(value: T, delay = 300) {
  let lastTriggered = 0
  return customRef<T>((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      value = newValue
      const now = Date.now()
      if (now - lastTriggered >= delay) {
        lastTriggered = now
        trigger()
      } else {
        setTimeout(() => {
          lastTriggered = Date.now()
          trigger()
        }, delay - (now - lastTriggered))
      }
    },
  }))
}
```

### Reactivity 限制

```ts
// ❌ 解构 reactive → 失去响应（必须用 toRefs）
const { count } = reactive({ count: 0 })

// ❌ 替换整体 reactive → 旧引用失效
let s = reactive({ a: 1 })
s = reactive({ a: 2 })   // 监听旧 s 的代码失效

// ❌ class 实例的私有字段 / getter 不能 reactive
class User {
  #password = ''
  get name() { ... }
}
const u = reactive(new User())   // 私有字段不响应

// ❌ Map / Set 必须用 reactive，不能用 ref
const m = reactive(new Map())     // ✅
const m2 = ref(new Map())          // ❌ m2.value.set 不响应

// ✅ DOM 元素 / Date 不该被代理（markRaw）
import { markRaw } from 'vue'
const fixedDate = markRaw(new Date())
const data = reactive({ updated: fixedDate })   // updated 不被代理
```

## Vapor Mode 现状

Vapor 是 Vue 团队孵化的「**跳过 Virtual DOM**」编译目标——把模板直接编译成最高效的 DOM 操作指令，运行时无需 vnode diff。

### 设计动机

```
传统 Vue 模板编译：
  <template> → render() → vnode → patch(prevVNode, nextVNode) → DOM 操作

Vapor 编译：
  <template> → 直接生成 DOM 操作代码 → 无 vnode 中间层
```

理论上 bundle 更小、运行时更快（与 SolidJS / Qwik 同方向）。

### 当前状态（2026.5）

- **未进入稳定版**：3.5 稳定版尚未包含 Vapor 编译输出
- **开发分支**：[`vuejs/core` 的 `vapor-alpha-branch`](https://github.com/vuejs/core/tree/vapor-alpha-branch) 持续迭代
- **试玩**：[Vapor Playground](https://vapor-repl.netlify.app/) / [Vapor Template Explorer](https://vapor-template-explorer.netlify.app/)

### 未来期望的写法

```vue
<!-- 同一份 SFC，按 mode 编译输出不同代码 -->
<script setup vapor lang="ts">
import { ref } from 'vue/vapor'

const count = ref(0)
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

最终 API 仍在演进，**正式生产前不要押注**。后续稳定后会更新本文。

::: tip 现在能做什么

- 关注 [`vuejs/core` 的 PR 标 `vapor`](https://github.com/vuejs/core/pulls?q=vapor) 进展
- 阅读 [Evan You 在 Vue.js Live 2024 的演讲](https://www.youtube.com/results?search_query=evan+you+vapor+mode)
- 现阶段写组件用标准 Composition API + `<script setup>`，将来 Vapor 上线时迁移成本很小

:::

## 编译时优化

Vue 3 模板编译器把模板转成「**优化的渲染函数**」，运行时只 diff 动态部分。

### `patchFlag`

```vue
<template>
  <div>
    <span>静态文本</span>
    <span>{{ dynamicText }}</span>
    <button :class="cls" @click="handler">Click</button>
  </div>
</template>
```

编译成（简化）：

```ts
function render() {
  return (
    openBlock(),
    createElementBlock('div', null, [
      createElementVNode('span', null, '静态文本'),   // 无 patchFlag
      createElementVNode('span', null, ctx.dynamicText, 1 /* TEXT */),
      createElementVNode('button', {
        class: normalizeClass(ctx.cls),
        onClick: ctx.handler,
      }, 'Click', 2 /* CLASS */),
    ])
  )
}
```

`1 /* TEXT */` / `2 /* CLASS */` 是 patchFlag——告诉运行时 **只需要 diff 这种属性，跳过其它**。

### `block` 优化

```vue
<template>
  <div>
    <span>静态</span>
    <span>{{ msg }}</span>
    <div v-if="show">
      <span>{{ inner }}</span>
    </div>
  </div>
</template>
```

外层 `<div>` 是 `block`，编译器收集**所有动态子节点**到 `block.dynamicChildren` 数组里。运行时 patch 只跑这数组，跳过静态子树。

`v-if` / `v-for` / `<Suspense>` / `<Teleport>` 也会创建新 block。

### 静态提升（hoistStatic）

```vue
<template>
  <div>
    <span class="title">My App</span>
    <span>{{ msg }}</span>
  </div>
</template>
```

编译成：

```ts
const _hoisted_1 = createElementVNode('span', { class: 'title' }, 'My App')

function render() {
  return createElementVNode('div', null, [
    _hoisted_1,    // 复用同一 vnode
    createElementVNode('span', null, ctx.msg, 1),
  ])
}
```

静态 vnode 创建一次，所有 render 调用共享。

### `cacheHandlers`

```vue
<template>
  <button @click="onClick">Click</button>
</template>
```

事件处理函数包装层会被缓存，避免每次 render 创建新函数：

```ts
function render() {
  return createElementVNode('button', {
    onClick: _cache[0] || (_cache[0] = (...args) => ctx.onClick(...args)),
  })
}
```

让子组件不会因为父组件 rerender 而误判 props 变化。

### `v-once` —— 单次渲染

```vue
<template>
  <div v-once>
    <h1>{{ initialTitle }}</h1>       <!-- 只渲染一次，永不更新 -->
    <p>{{ initialDescription }}</p>
  </div>
</template>
```

适合：**展示型组件**（如博客文章正文 / Markdown 渲染结果）—— 数据来源不变。

### `v-memo` —— 依赖数组缓存

```vue
<template>
  <div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">
    <img :src="item.cover" />
    <h3>{{ item.name }}</h3>
    <span :class="{ active: item.selected }">{{ item.status }}</span>
  </div>
</template>
```

`v-memo="[deps]"` —— 依赖数组未变时，**整个子树跳过 diff**。适合大列表 + 单项更新很少的场景。

::: warning v-memo 慎用

`v-memo` 把责任移到开发者：依赖数组列全是关键。漏了一个依赖 → 该更新时不更新 → bug 极难调试。

只在 profiled 后确认有性能问题再用。

:::

## SSR（服务端渲染）

### `@vue/server-renderer` 基础

```bash
pnpm add @vue/server-renderer
```

```ts
// entry-server.ts
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import App from './App.vue'

export async function render() {
  const app = createSSRApp(App)
  const html = await renderToString(app)
  return html
}
```

```ts
// server.ts (Express 或其它)
import express from 'express'
import { render } from './dist/server/entry-server.js'

const app = express()
app.use(express.static('dist/client'))

app.get('*', async (req, res) => {
  const appHtml = await render()
  const html = `
    <!doctype html>
    <html>
      <head><title>SSR App</title></head>
      <body>
        <div id="app">${appHtml}</div>
        <script type="module" src="/entry-client.js"></script>
      </body>
    </html>
  `
  res.send(html)
})

app.listen(3000)
```

### Hydration（客户端激活）

```ts
// entry-client.ts
import { createSSRApp } from 'vue'
import App from './App.vue'

const app = createSSRApp(App)
app.mount('#app')   // SSR 标记下自动 hydrate（不重新创建 DOM）
```

注意：**SSR 渲染用 `createSSRApp` 而非 `createApp`** —— 这样客户端 mount 时会 hydrate 而非全量重新挂载。

### Hydration mismatch

服务端 HTML 与客户端首次渲染不一致时，Vue 警告：

```
[Vue warn] Hydration text mismatch:
- Server rendered: "Hello Alice"
- Client rendered: "Hello Bob"
```

常见原因：

```vue
<!-- ❌ 服务端无 window -->
<span>{{ Date.now() }}</span>          <!-- 每次渲染不同 -->
<span>{{ Math.random() }}</span>
<span>{{ window.innerWidth }}</span>   <!-- 服务端报错 -->

<!-- ❌ 服务端 / 客户端 cookie 不同步 -->
<span>{{ isLoggedIn ? 'Welcome' : 'Sign in' }}</span>

<!-- ✅ 用 ClientOnly 包裹或延后到 onMounted -->
<ClientOnly>
  <span>{{ window.innerWidth }}</span>
</ClientOnly>
```

### Selective Hydration（实验性）

Vue 3.5 加强了懒 hydration——`defineAsyncComponent` 支持 `hydrate` 选项控制激活时机：

```ts
import { defineAsyncComponent, hydrateOnVisible, hydrateOnIdle, hydrateOnInteraction } from 'vue'

// 视口可见时才 hydrate
const ChartAsync = defineAsyncComponent({
  loader: () => import('./Chart.vue'),
  hydrate: hydrateOnVisible(),
})

// 浏览器空闲时 hydrate
const SidebarAsync = defineAsyncComponent({
  loader: () => import('./Sidebar.vue'),
  hydrate: hydrateOnIdle(2000),   // 最多等 2 秒
})

// 用户交互时 hydrate
const FormAsync = defineAsyncComponent({
  loader: () => import('./Form.vue'),
  hydrate: hydrateOnInteraction(['click', 'focus']),
})
```

适合：**首屏 SSR + 非关键组件延后 hydrate**——降低 JS 解析 + 执行成本。

### Vite SSR 模板

`create-vue` 不带 SSR 模板，但官方有：

```bash
# Vite 官方 SSR 模板
pnpm create vite@latest my-ssr -- --template vue-ts
# 然后参考 https://vitejs.dev/guide/ssr.html 手动接 SSR
```

或直接用 **Nuxt**（推荐）—— 详见 [Nuxt 笔记](../../meta/nuxt/index.md)。

### `useSSRContext` —— 服务端注入

```ts
// 服务端
const ctx = { teleports: {} }
const html = await renderToString(app, ctx)
// ctx.teleports 含有 <Teleport> 的内容
```

```vue
<script setup>
import { useSSRContext } from 'vue'

if (import.meta.env.SSR) {
  const ctx = useSSRContext()
  ctx.title = 'My SSR Page'    // 向 SSR context 写数据
}
</script>
```

## 性能优化

### 大列表虚拟滚动

```bash
pnpm add vue-virtual-scroller
# 或
pnpm add @tanstack/vue-virtual
```

```vue
<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
</script>

<template>
  <RecycleScroller
    class="scroller"
    :items="items"
    :item-size="50"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="item">{{ item.name }}</div>
  </RecycleScroller>
</template>

<style scoped>
.scroller { height: 600px; }
.item { height: 50px; padding: 8px; }
</style>
```

只渲染可视区域 + 缓冲区的几十个 DOM 节点。

### `shallowRef` 大对象

```ts
// ❌ reactive 一个 10000 行表格 → 创建上万个 Proxy
const tableData = reactive(largeDataset)

// ✅ shallowRef → 不递归 proxy
const tableData = shallowRef(largeDataset)

// 修改时手动 trigger
tableData.value = [...largeDataset, newRow]
```

经典场景：表格数据、Map / Set 实例、Chart instance / Quill editor 等第三方实例。

### 防抖 watch

```ts
import { watch } from 'vue'
import { debounce } from 'lodash-es'

watch(
  searchInput,
  debounce(async (query) => {
    results.value = await fetch(`/api/search?q=${query}`).then(r => r.json())
  }, 300),
)
```

或用 VueUse 的 `useDebouncedRef`：

```ts
import { useDebouncedRef } from '@vueuse/core'
const debouncedSearch = useDebouncedRef('', 300)

// 用 debouncedSearch 而非 searchInput 当 watch 源
watch(debouncedSearch, async (q) => {
  results.value = await fetch(`/api/search?q=${q}`).then(r => r.json())
})
```

### 异步组件 + 路由懒加载

```ts
// 1. 路由级
const routes = [
  { path: '/heavy', component: () => import('./HeavyView.vue') },
]

// 2. 组件级
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
```

### 关闭 reactive 在非响应数据

```ts
// 大型固定数据用 markRaw
import { markRaw } from 'vue'

const config = markRaw({
  // 数千行配置，永不变
})

const state = reactive({ config })   // config 不被代理
```

### Bundle 分析

```bash
pnpm add -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({ open: true }),   // 构建后自动开 stats.html
  ],
})
```

或用 Vite 的 `--report`：

```bash
pnpm build -- --report
```

## 自定义指令

### 基础

```vue
<script setup lang="ts">
import type { Directive } from 'vue'

// 一个自动聚焦的指令
const vFocus: Directive<HTMLInputElement> = {
  mounted(el) {
    el.focus()
  },
}
</script>

<template>
  <input v-focus />
</template>
```

### 完整生命周期 hooks

```ts
const myDirective: Directive = {
  created(el, binding, vnode, prevVnode) {
    // 元素属性 / 监听器应用之前
  },
  beforeMount(el, binding) {
    // 插入父节点之前
  },
  mounted(el, binding) {
    // 父节点挂载之后（DOM 可访问）
  },
  beforeUpdate(el, binding) {
    // 包含组件更新之前
  },
  updated(el, binding) {
    // 包含组件 + 子组件更新之后
  },
  beforeUnmount(el, binding) {
    // 卸载之前
  },
  unmounted(el, binding) {
    // 卸载之后
  },
}
```

### `binding` 对象

```vue
<input v-my-directive:arg.modifier1.modifier2="value" />
```

```ts
const vMyDirective: Directive = {
  mounted(el, binding) {
    binding.value         // 'value'
    binding.oldValue      // 更新时才有
    binding.arg           // 'arg'
    binding.modifiers     // { modifier1: true, modifier2: true }
    binding.instance      // 当前组件实例
    binding.dir           // 指令对象本身
  },
}
```

### 全局注册

```ts
// main.ts
import { createApp } from 'vue'

const app = createApp(App)

app.directive('focus', {
  mounted(el) { el.focus() },
})

// 模板任意位置可用 v-focus
```

### 实战：v-permission 权限指令

```ts
// directives/permission.ts
import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const vPermission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const auth = useAuthStore()
    const required = Array.isArray(binding.value) ? binding.value : [binding.value]
    const ok = required.every(p => auth.permissions.includes(p))
    if (!ok) {
      el.parentNode?.removeChild(el)
    }
  },
}
```

```vue
<template>
  <button v-permission="'user:delete'">Delete</button>
  <button v-permission="['user:edit', 'user:create']">Edit & Create</button>
</template>
```

### 实战：v-clickoutside

```ts
import type { Directive } from 'vue'

export const vClickOutside: Directive<HTMLElement, (e: MouseEvent) => void> = {
  mounted(el, binding) {
    el._clickOutside = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) {
        binding.value(e)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
    delete el._clickOutside
  },
}
```

```vue
<template>
  <div v-click-outside="closeMenu" class="menu">
    Menu content
  </div>
</template>
```

## 插件开发

### 基础结构

```ts
// plugins/myPlugin.ts
import type { App, Plugin } from 'vue'

interface MyPluginOptions {
  apiBase?: string
}

const myPlugin: Plugin<MyPluginOptions> = {
  install(app: App, options: MyPluginOptions = {}) {
    // 1. 全局属性
    app.config.globalProperties.$apiBase = options.apiBase ?? '/api'

    // 2. 全局组件
    app.component('AppButton', AppButton)

    // 3. 全局指令
    app.directive('focus', { mounted(el) { el.focus() } })

    // 4. provide
    app.provide('apiClient', createApiClient(options.apiBase))

    // 5. mixin（不推荐，但偶尔需要）
    app.mixin({
      mounted() {
        console.log(`[mixin] ${this.$options.name} mounted`)
      },
    })
  },
}

export default myPlugin
```

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import myPlugin from './plugins/myPlugin'

createApp(App).use(myPlugin, { apiBase: 'https://api.example.com' }).mount('#app')
```

### TypeScript 类型扩展

```ts
// types/vue.d.ts
import 'vue'

declare module 'vue' {
  interface ComponentCustomProperties {
    $apiBase: string
  }
}
```

之后任意组件 `this.$apiBase` 有正确类型（Options API），`<script setup>` 内通过 `getCurrentInstance` 拿到。

## Mixins —— 已不推荐

Vue 2 时代用 `mixins` 复用逻辑：

```ts
// mixins/loggable.ts
export const loggable = {
  created() {
    console.log(`${this.$options.name} created`)
  },
  data() {
    return { logCount: 0 }
  },
}
```

```ts
export default {
  mixins: [loggable],
  data() {
    return { name: 'MyComponent' }
  },
}
```

### 为什么不推荐

- **命名冲突**：mixin 与组件 / 其它 mixin 同名字段冲突，调试困难
- **来源不明**：组件内某个变量是来自当前组件、还是 mixin？阅读时要追多个文件
- **TS 推导差**：mixins 的类型合并写起来痛苦

### Composition API 替代

```ts
// composables/useLoggable.ts
import { onMounted, ref } from 'vue'

export function useLoggable(name: string) {
  const logCount = ref(0)

  onMounted(() => {
    console.log(`${name} created`)
    logCount.value++
  })

  return { logCount }
}
```

```vue
<script setup>
import { useLoggable } from '@/composables/useLoggable'

const { logCount } = useLoggable('MyComponent')
</script>
```

优势：**显式 import + 显式 return** → 来源清晰、类型完整、无命名冲突。

## Vue 2 → Vue 3 迁移

### 主要变化

| 维度 | Vue 2 | Vue 3 |
|---|---|---|
| 响应式 | `Object.defineProperty` | `Proxy` |
| 入口 | `new Vue({ ... })` | `createApp(App)` |
| 多根节点 | ❌ 必须单根 | ✅ 支持 fragments |
| `<template v-for>` | 不能加 key | 可加 key |
| `v-model` | 单值 + `value` / `input` | 多值 + `modelValue` / `update:modelValue` |
| `v-if` + `v-for` | `v-for` 优先 | `v-if` 优先 |
| `$on` / `$off` / `$once` | 有 | 移除（用 mitt / nanoevents） |
| Filter | 有 | 移除 |
| 函数式组件 | `functional: true` | 用普通函数 + setup |
| Async Component | `() => import` | `defineAsyncComponent` |
| Mixins | 主流 | 不推荐 → Composables |
| Vue Router | v3 | v4 |
| Vuex | v3/v4 | Pinia |

### 迁移路径

#### 路径 1：直接 Vue 3 重写

完全废弃 Vue 2 项目，从头建 Vue 3。适合：项目小、依赖简单、想顺便重构。

#### 路径 2：Vue 2 → Vue 2.7 → Vue 3

```bash
# Vue 2.7 是「移植 Composition API + setup」到 Vue 2 的版本
pnpm add vue@^2.7.16
```

先在 Vue 2.7 上把代码改成 Composition API 风格（用 `setup()` 替代 Options API），再换到 Vue 3——大幅降低迁移风险。

#### 路径 3：用迁移构建（migration build）

```bash
pnpm add @vue/compat
```

兼容 Vue 2 大部分 API，但跑在 Vue 3 引擎上。逐步迁移：先跑通 → 一个个修 warning → 最后切纯 Vue 3。

### Codemod

```bash
# 官方提供（覆盖部分场景）
pnpm dlx @vue/codemod
```

### `vue-router` 3 → 4

```ts
// Vue Router 3 (Vue 2)
import VueRouter from 'vue-router'
Vue.use(VueRouter)
const router = new VueRouter({
  mode: 'history',
  routes,
})

// Vue Router 4 (Vue 3)
import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(),
  routes,
})
app.use(router)
```

主要变化：`new VueRouter` → `createRouter`；`mode: 'history'` → `createWebHistory()`；catch-all 路径变 `/:pathMatch(.*)*`。

### `Vuex` → `Pinia`

Vuex 4 兼容 Vue 3 但官方不再积极维护。**直接迁 Pinia**：

```ts
// Vuex 4
const store = createStore({
  state: () => ({ count: 0 }),
  mutations: {
    increment(state) { state.count++ },
  },
  getters: {
    doubled: (state) => state.count * 2,
  },
  actions: {
    async fetchCount({ commit }) {
      const val = await fetch('/api/count').then(r => r.json())
      commit('setCount', val)
    },
  },
})

// Pinia 等价
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubled = computed(() => count.value * 2)

  function increment() { count.value++ }

  async function fetchCount() {
    count.value = await fetch('/api/count').then(r => r.json())
  }

  return { count, doubled, increment, fetchCount }
})
```

Pinia 优势：无 mutation 概念（actions 直接改 state）、TypeScript 类型自动推导、bundle 更小。

## 测试

### Vitest + `@vue/test-utils`

```bash
pnpm add -D vitest @vue/test-utils happy-dom @vitejs/plugin-vue
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
```

### 组件测试基础

```vue
<!-- src/components/Counter.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ initial?: number }>()
const count = ref(props.initial ?? 0)

const emit = defineEmits<{ change: [n: number] }>()

function increment() {
  count.value++
  emit('change', count.value)
}
</script>

<template>
  <div>
    <span data-testid="count">{{ count }}</span>
    <button @click="increment">+1</button>
  </div>
</template>
```

```ts
// tests/Counter.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Counter from '@/components/Counter.vue'

describe('Counter', () => {
  it('renders initial value', () => {
    const wrapper = mount(Counter, { props: { initial: 5 } })
    expect(wrapper.get('[data-testid=count]').text()).toBe('5')
  })

  it('increments on click', async () => {
    const wrapper = mount(Counter)
    await wrapper.find('button').trigger('click')
    expect(wrapper.get('[data-testid=count]').text()).toBe('1')
  })

  it('emits change event', async () => {
    const wrapper = mount(Counter)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[1]])
  })
})
```

### `mount` vs `shallowMount`

- **`mount`**：完整渲染所有子组件（DOM 真实）
- **`shallowMount`**：子组件被 stub 成 `<child-component-stub />`（隔离测试当前组件）

```ts
import { mount, shallowMount } from '@vue/test-utils'

const fullTree = mount(Parent)       // 含完整子组件
const isolated = shallowMount(Parent) // 子组件被 stub
```

### Stubs（替换子组件）

```ts
const wrapper = mount(Parent, {
  global: {
    stubs: {
      ChildComponent: true,         // 简单 stub
      AnotherChild: {                // 自定义 stub
        template: '<div data-stub="another">Stubbed</div>',
      },
    },
  },
})
```

### Mock 全局对象

```ts
const wrapper = mount(Component, {
  global: {
    mocks: {
      $route: { params: { id: 1 } },
      $router: { push: vi.fn() },
    },
    provide: {
      apiClient: mockApiClient,
    },
    plugins: [createPinia()],   // 装插件
  },
})
```

### Mock fetch / API

```ts
import { vi } from 'vitest'

vi.mock('@/api/users', () => ({
  fetchUsers: vi.fn().mockResolvedValue([
    { id: 1, name: 'Alice' },
  ]),
}))
```

### Composable 测试

```ts
// composables/useCounter.ts
export function useCounter(initial = 0) {
  const count = ref(initial)
  function increment() { count.value++ }
  return { count, increment }
}
```

```ts
import { describe, it, expect } from 'vitest'
import { useCounter } from '@/composables/useCounter'

describe('useCounter', () => {
  it('starts at initial value', () => {
    const { count } = useCounter(10)
    expect(count.value).toBe(10)
  })

  it('increments', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })
})
```

### Pinia store 测试

```ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCounterStore } from '@/stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('increments', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
    store.increment()
    expect(store.count).toBe(1)
  })
})
```

### Vue Router 测试

```ts
import { createRouter, createMemoryHistory } from 'vue-router'
import routes from '@/router/routes'

const router = createRouter({
  history: createMemoryHistory(),   // 内存模式（测试用）
  routes,
})

const wrapper = mount(App, {
  global: {
    plugins: [router],
  },
})

await router.push('/users/42')
await router.isReady()
```

### Testing Library 风格

```bash
pnpm add -D @testing-library/vue
```

```ts
import { render, screen, fireEvent } from '@testing-library/vue'
import Counter from '@/components/Counter.vue'

it('counts up', async () => {
  render(Counter)
  await fireEvent.click(screen.getByText('+1'))
  expect(screen.getByTestId('count').textContent).toBe('1')
})
```

Testing Library 推荐**按用户视角测**——找元素用「能看见的文本」而非 CSS 选择器。

## E2E 测试

### Cypress

```bash
pnpm add -D cypress
pnpm dlx cypress open
```

```ts
// cypress/e2e/home.cy.ts
describe('Home', () => {
  it('shows welcome', () => {
    cy.visit('/')
    cy.contains('Welcome').should('be.visible')
  })

  it('navigates to about', () => {
    cy.visit('/')
    cy.contains('About').click()
    cy.url().should('include', '/about')
  })
})
```

::: tip Cypress + Vue 项目陷阱（Claude Code 环境）

详见 [cypress-skill SKILL](/cypress-skill)：
- 运行前必须 `unset ELECTRON_RUN_AS_NODE`（否则 Electron 崩溃）
- E2E 用测试服务器（独立端口 + test DB），不能用 dev server

:::

### Playwright

```bash
pnpm dlx playwright init
```

```ts
// e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test('home loads', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await expect(page.locator('h1')).toContainText('Welcome')
})

test('navigation', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.click('text=About')
  await expect(page).toHaveURL(/.*about/)
})
```

Playwright 优势：跨浏览器（Chromium / Firefox / WebKit）、自动等待、Trace Viewer 强大。

## Web Components（defineCustomElement）

把 Vue 组件编译成原生 Custom Element：

```ts
// MyButton.ce.vue
<script setup>
defineProps<{ label: string }>()
</script>

<template>
  <button>{{ label }}</button>
</template>

<style>
button { background: #41b883; color: white; }
</style>
```

```ts
// main.ts
import { defineCustomElement } from 'vue'
import MyButton from './MyButton.ce.vue'

const MyButtonCE = defineCustomElement(MyButton)
customElements.define('my-button', MyButtonCE)
```

```html
<!-- 任意 HTML 文件 -->
<script type="module" src="./main.js"></script>
<my-button label="Click me"></my-button>
```

### `.ce.vue` 文件后缀约定

`*.ce.vue` 文件自动以 Shadow DOM 模式编译（样式隔离）。普通 `*.vue` 用 `defineCustomElement` 不会 Shadow DOM。

### 适用场景

- **微前端**：Vue 组件嵌入到 React / 老技术栈页面
- **Embed Widget**：第三方网站嵌入你的 Vue 组件
- **Cross-framework Library**：写一次，到处用

### 局限

- Shadow DOM 中的全局样式失效（Tailwind / UnoCSS 等需要特殊配置）
- Vue 路由 / Pinia / Provide-Inject 在 CE 内部用受限
- 不能用 `<slot>` 之外的 SSR 特性

## 库开发（vue-tsc + Vite Library Mode）

### Vite Library 模式

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'MyLib',
      fileName: 'my-lib',
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
  },
})
```

### 生成类型声明

```bash
pnpm add -D vue-tsc
```

```json
// package.json
{
  "scripts": {
    "build:types": "vue-tsc --declaration --emitDeclarationOnly --outDir dist/types"
  }
}
```

或用 `vite-plugin-dts`：

```bash
pnpm add -D vite-plugin-dts
```

```ts
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({ insertTypesEntry: true }),
  ],
  // ...
})
```

### `package.json` 导出

```json
{
  "name": "my-vue-lib",
  "main": "./dist/my-lib.cjs",
  "module": "./dist/my-lib.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/my-lib.js",
      "require": "./dist/my-lib.cjs"
    },
    "./style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "vue": "^3.3.0"
  }
}
```

## Dev Tools 6.0

Vue DevTools 6.x 重写，**架构与 v5 完全不同**：

- **独立 app + Vite Plugin 集成**：不再依赖浏览器扩展
- **更全的面板**：Inspector / Routes / Pinia / Timeline / Components / Performance / Pages / Plugins
- **直接打开源代码**：点组件名跳 VSCode 对应文件 + 行号
- **AI 集成**（实验性）：解释 props / hooks 用法

```bash
# 全局 standalone
pnpm dlx @vue/devtools

# Vite Plugin（项目内集成，推荐）
pnpm add -D vite-plugin-vue-devtools
```

```ts
// vite.config.ts
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()],
})
```

启动开发服务器后，页面右下角浮一个 V 按钮，点开 DevTools 面板。

## WebContainer / StackBlitz 集成

Vue 项目可在浏览器内运行（无需本地 node_modules）：

- **[Vue Playground](https://play.vuejs.org/)**：官方 SFC Playground
- **[StackBlitz Vue Template](https://stackblitz.com/fork/vue)**：完整 Vite + Vue 项目模板
- **[CodeSandbox](https://codesandbox.io/p/sandbox/vue-vite-ts-forked-r8slt7)**：Cloud IDE

适合：教学 / Issue 复现 / 文档 demo。把可运行的 Playground 链接附到 GitHub issue 里，maintainer 不用 clone 项目。

## 下一步

- 微前端 / 与其它工具集成 / Storybook / Tailwind / vue-i18n 见 [指南 - 其他](./other.md)
- 全 API + 编译宏 + 内置组件 + 配置项速查见 [参考](../reference.md)
