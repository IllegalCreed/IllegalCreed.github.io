---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vue 3.5.x 编写 —— 全局 API、响应式 API、生命周期、编译宏、内置组件 / 指令、TypeScript 工具类型完整速查

## 全局 API

### 应用创建

| API | 签名 | 用途 |
|---|---|---|
| `createApp(rootComponent, rootProps?)` | `Component => App` | 创建客户端应用实例 |
| `createSSRApp(rootComponent, rootProps?)` | `Component => App` | 创建 SSR 应用（客户端 hydrate） |
| `defineComponent(options)` | `Options => Component` | 类型化定义组件（不用 `<script setup>` 时） |
| `defineAsyncComponent(loader \| options)` | `... => AsyncComponent` | 异步组件 |
| `defineCustomElement(component)` | `... => CustomElement` | 编译成原生 Web Component |

```ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App, { initialCount: 5 })
app.mount('#app')
```

### General

| API | 用途 |
|---|---|
| `version` | Vue 版本号字符串（如 `3.5.34`） |
| `nextTick(cb?)` | 下一次 DOM 更新后执行（返回 Promise） |
| `defineComponent()` | TS 包装，给 Options API 加类型 |
| `h(type, props?, children?)` | 创建 vnode（渲染函数用） |
| `mergeProps(...args)` | 合并多个 props 对象 |
| `useCssModule(name?)` | 在 setup 内拿到 `<style module>` 的对象 |
| `useCssVars(getter)` | 注入 `<style v-bind>` 等价的 CSS 变量 |
| `withDirectives(vnode, dirs)` | 给 vnode 加指令（渲染函数用） |
| `withModifiers(fn, modifiers)` | 给事件处理函数加修饰符（渲染函数用） |
| `withKeys(fn, keys)` | 给事件处理函数加按键修饰符 |

```ts
import { nextTick } from 'vue'

count.value++
await nextTick()
// 现在 DOM 已更新，可以安全读 DOM
```

## 应用实例 API

```ts
const app = createApp(App)

app
  .component('MyButton', MyButton)         // 全局组件
  .directive('focus', vFocus)              // 全局指令
  .use(router)                              // 装插件
  .use(createPinia())
  .provide('apiBase', '/api')              // 全局 provide
  .mount('#app')                            // 挂载

// 卸载
app.unmount()
```

### 完整 App 实例方法

| 方法 | 用途 |
|---|---|
| `app.mount(selector \| element)` | 挂载到 DOM |
| `app.unmount()` | 卸载 |
| `app.component(name, component?)` | 注册 / 查询全局组件 |
| `app.directive(name, directive?)` | 注册 / 查询全局指令 |
| `app.use(plugin, options?)` | 装插件 |
| `app.mixin(mixin)` | 全局 mixin（不推荐） |
| `app.provide(key, value)` | 全局 provide |
| `app.runWithContext(fn)` | 在 app context 下跑函数（拿到 inject） |

### `app.config`

| 属性 | 类型 | 用途 |
|---|---|---|
| `app.config.errorHandler` | `(err, instance, info) => void` | 全局错误处理 |
| `app.config.warnHandler` | `(msg, instance, trace) => void` | 全局警告处理（dev） |
| `app.config.performance` | boolean | 启用性能跟踪（DevTools） |
| `app.config.compilerOptions` | object | 模板编译器选项（如自定义元素） |
| `app.config.globalProperties` | object | 添加全局属性（Options API 用 `this.$xxx`） |
| `app.config.optionMergeStrategies` | object | 自定义 options 合并策略 |

```ts
app.config.errorHandler = (err, instance, info) => {
  console.error('[global error]', err, info)
  reportError(err)
}

app.config.globalProperties.$apiBase = '/api'
```

## 响应式 API

### Core

| API | 签名 | 用途 |
|---|---|---|
| `ref(value)` | `<T>(value: T) => Ref<T>` | 单值响应式 |
| `reactive(target)` | `<T extends object>(target: T) => T` | 对象深响应式 |
| `computed(getter \| options)` | `<T>(...) => ComputedRef<T>` | 派生值（带缓存） |
| `readonly(target)` | `<T>(target: T) => DeepReadonly<T>` | 只读包装 |
| `watch(source, cb, opts?)` | `(source, cb, opts) => stopHandle` | 显式 watch |
| `watchEffect(fn, opts?)` | `(fn, opts) => stopHandle` | 自动追踪 watch |
| `watchPostEffect(fn)` | `(fn) => stopHandle` | `flush: 'post'` 的 watchEffect |
| `watchSyncEffect(fn)` | `(fn) => stopHandle` | `flush: 'sync'` 的 watchEffect |

### Utilities

| API | 用途 |
|---|---|
| `isRef(value)` | 判断是否 ref |
| `unref(value)` | 拆 ref（非 ref 原值返回） |
| `toRef(reactive, key)` / `toRef(getter)` / `toRef(value)` | 转单字段为 ref（reactive 解构） |
| `toValue(refOrGetter)` | 3.3+ 把 ref / getter / 值都标准化成普通值 |
| `toRefs(reactive)` | 把 reactive 对象的所有属性转 ref |
| `isProxy(value)` | 是否 reactive / readonly / shallowReactive / shallowReadonly 创建的代理 |
| `isReactive(value)` | 是否 `reactive` / `shallowReactive` 创建 |
| `isReadonly(value)` | 是否 readonly 包装 |

### Advanced

| API | 用途 |
|---|---|
| `shallowRef(value)` | 浅响应 ref（只追踪 `.value` 替换） |
| `triggerRef(ref)` | 手动触发 shallowRef 的更新 |
| `customRef(factory)` | 自定义 track / trigger 的 ref |
| `shallowReactive(target)` | 只有根级 reactive |
| `shallowReadonly(target)` | 只有根级 readonly |
| `toRaw(reactive)` | 取出原始非代理对象 |
| `markRaw(target)` | 标记永不被代理 |
| `effectScope(detached?)` | 创建 effect 作用域（批量管理） |
| `getCurrentScope()` | 当前 effect scope（如有） |
| `onScopeDispose(fn)` | scope 停止时回调 |

```ts
import {
  ref, reactive, computed, watch, watchEffect,
  toRef, toRefs, toValue, unref,
  shallowRef, triggerRef, customRef,
  markRaw, toRaw, readonly,
  effectScope, onScopeDispose,
} from 'vue'

// 例：完整组合
const state = reactive({ count: 0 })
const { count } = toRefs(state)
const doubled = computed(() => count.value * 2)
watch(count, (val) => console.log(val))
```

### `onWatcherCleanup` (3.5+)

```ts
import { watch, onWatcherCleanup } from 'vue'

watch(userId, async (id) => {
  const controller = new AbortController()
  onWatcherCleanup(() => controller.abort())

  const data = await fetch(`/api/users/${id}`, { signal: controller.signal })
})
```

## 生命周期钩子

### Composition API

```ts
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
  onRenderTracked,
  onRenderTriggered,
  onActivated,
  onDeactivated,
  onServerPrefetch,
} from 'vue'
```

| Hook | 触发时机 |
|---|---|
| `onBeforeMount` | 挂载前（DOM 未生成） |
| `onMounted` | 挂载后（DOM 可访问） |
| `onBeforeUpdate` | 响应式更新前 |
| `onUpdated` | 响应式更新后 |
| `onBeforeUnmount` | 卸载前 |
| `onUnmounted` | 卸载后 |
| `onErrorCaptured(err, instance, info)` | 捕获子孙错误（return false 阻止冒泡） |
| `onRenderTracked(event)` | 收集依赖时（仅 dev） |
| `onRenderTriggered(event)` | 触发更新时（仅 dev） |
| `onActivated` | KeepAlive 缓存激活 |
| `onDeactivated` | KeepAlive 缓存停用 |
| `onServerPrefetch(asyncFn)` | SSR 异步预取（仅 SSR） |

### Options API 等价

| Options 写法 | Composition |
|---|---|
| `beforeCreate` | （`setup()` 本身） |
| `created` | （`setup()` 本身） |
| `beforeMount` | `onBeforeMount` |
| `mounted` | `onMounted` |
| `beforeUpdate` | `onBeforeUpdate` |
| `updated` | `onUpdated` |
| `beforeDestroy` (V2) / `beforeUnmount` (V3) | `onBeforeUnmount` |
| `destroyed` (V2) / `unmounted` (V3) | `onUnmounted` |
| `errorCaptured` | `onErrorCaptured` |
| `activated` | `onActivated` |
| `deactivated` | `onDeactivated` |

## 依赖注入

| API | 签名 | 用途 |
|---|---|---|
| `provide(key, value)` | `(key, value) => void` | 提供数据给后代 |
| `inject(key, default?, treatDefaultAsFactory?)` | `(key, def, fac?) => T` | 注入祖先提供的数据 |
| `hasInjectionContext()` | `() => boolean` | 3.3+ 是否在 inject 可用的上下文 |

```ts
import { provide, inject, type InjectionKey, type Ref } from 'vue'

// 类型化 key
const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')

// 提供
provide(ThemeKey, theme)

// 注入（自动类型推导）
const theme = inject(ThemeKey)
const fallback = inject(ThemeKey, ref('light'))
const lazyFallback = inject(ThemeKey, () => createTheme(), true)
```

## 编译器宏（`<script setup>` 内）

| 宏 | 用途 |
|---|---|
| `defineProps<T>()` / `defineProps(opts)` | 声明 props |
| `defineEmits<T>()` / `defineEmits(opts)` | 声明 emits |
| `defineExpose({ ... })` | 暴露给父组件 ref |
| `defineModel<T>(name?, opts?)` | 3.4+ 双向绑定 |
| `defineOptions({ ... })` | 等价 Options 顶层（name / inheritAttrs 等） |
| `defineSlots<T>()` | 类型化 slots |
| `withDefaults(defineProps<T>(), defaults)` | 给 defineProps 加默认值 |
| `useSlots()` / `useAttrs()` | 取 $slots / $attrs |
| `useId()` | 3.5+ 生成 SSR-safe 唯一 id |
| `useTemplateRef(name)` | 3.5+ 模板 ref 拿到响应式 ref |

```vue
<script setup lang="ts">
// 完整示例
interface Props { title: string; count?: number }
const { title, count = 0 } = defineProps<Props>()    // 3.5+ 响应式解构

const emit = defineEmits<{
  submit: [data: { id: number }]
  cancel: []
}>()

defineExpose({ focus })
defineOptions({ name: 'MyForm', inheritAttrs: false })

const model = defineModel<string>({ required: true })

const inputRef = useTemplateRef<HTMLInputElement>('input')
const id = useId()
</script>

<template>
  <input ref="input" :id="id" v-model="model" />
</template>
```

## 内置组件

| 组件 | 主要 props | 用途 |
|---|---|---|
| `<Transition>` | `name` / `mode` / `appear` / `css` / `duration` / `type` | 进出动画 |
| `<TransitionGroup>` | 同上 + `tag` / `moveClass` | 列表动画（含 FLIP move） |
| `<KeepAlive>` | `include` / `exclude` / `max` | 缓存组件 |
| `<Teleport>` | `to` (必填) / `disabled` / `defer` (3.5+) | 传送 DOM 到指定容器 |
| `<Suspense>` | `timeout` / `suspensible` | 等待异步子组件 |

### `<Transition>` 全部 props

| Prop | 类型 | 默认 |
|---|---|---|
| `name` | string | `'v'` |
| `appear` | boolean | false |
| `persisted` | boolean | false |
| `css` | boolean | true |
| `type` | `'transition' \| 'animation'` | 自动检测 |
| `duration` | number / `{ enter, leave }` | 自动 |
| `mode` | `'out-in' \| 'in-out' \| undefined` | undefined |
| `enterFromClass` | string | `${name}-enter-from` |
| `enterActiveClass` | string | `${name}-enter-active` |
| `enterToClass` | string | `${name}-enter-to` |
| `leaveFromClass` | string | `${name}-leave-from` |
| `leaveActiveClass` | string | `${name}-leave-active` |
| `leaveToClass` | string | `${name}-leave-to` |
| `appearFromClass` | string | （同 enter） |
| `appearActiveClass` | string | （同 enter） |
| `appearToClass` | string | （同 enter） |

### `<Transition>` events

`@before-enter` / `@enter(el, done)` / `@after-enter` / `@enter-cancelled` / `@before-leave` / `@leave(el, done)` / `@after-leave` / `@leave-cancelled` / `@appear` 等。

## 内置特殊属性

| 属性 | 用途 |
|---|---|
| `key` | 强制识别同 / 异元素（v-for / 组件切换关键） |
| `ref` | 模板引用（指向 DOM 或组件实例） |
| `is` | 动态组件 `<component :is="...">` |
| `v-pre` | 跳过模板编译（输出原始 <span v-pre>`{{ }}`</span>） |
| `v-cloak` | 隐藏未编译模板（避免闪烁） |
| `v-once` | 只渲染一次，不再更新 |
| `v-memo="[deps]"` | 依赖未变跳过子树 diff |

```vue
<template>
  <!-- 动态组件 -->
  <component :is="currentView" :data="data" />

  <!-- v-pre：输出原始模板 -->
  <span v-pre>{{ this will not be compiled }}</span>

  <!-- v-cloak + CSS 隐藏未编译模板 -->
  <div v-cloak>{{ message }}</div>
</template>

<style>
[v-cloak] { display: none; }
</style>
```

## 内置指令完整表

| 指令 | 用途 | 简写 |
|---|---|---|
| `v-text` | 设 textContent | - |
| `v-html` | 设 innerHTML（XSS 风险） | - |
| `v-show` | 切换 CSS display | - |
| `v-if` / `v-else-if` / `v-else` | 条件渲染（真销毁） | - |
| `v-for="item in list"` | 列表渲染 | - |
| `v-on:event="handler"` | 事件绑定 | `@event` |
| `v-bind:attr="value"` | 属性绑定 | `:attr` |
| `v-model` | 双向绑定（input / 组件） | - |
| `v-slot:name="props"` | 具名 / 作用域插槽 | `#name` |
| `v-pre` | 跳过编译 | - |
| `v-once` | 一次性渲染 | - |
| `v-memo` | 依赖数组缓存子树 | - |
| `v-cloak` | 未编译时隐藏 | - |

### 事件修饰符

| 修饰符 | 等价 |
|---|---|
| `.stop` | `event.stopPropagation()` |
| `.prevent` | `event.preventDefault()` |
| `.capture` | 捕获阶段监听 |
| `.self` | 仅当 `event.target === el` |
| `.once` | 只触发一次 |
| `.passive` | `addEventListener({ passive: true })` |

### 按键修饰符

`.enter` / `.tab` / `.delete` / `.esc` / `.space` / `.up` / `.down` / `.left` / `.right` / `.ctrl` / `.alt` / `.shift` / `.meta` / `.exact`

### 鼠标按键修饰符

`.left` / `.right` / `.middle`

### `v-model` 修饰符

| 修饰符 | 用途 |
|---|---|
| `.lazy` | 使用 `change` 事件而非 `input` |
| `.number` | 自动转 number |
| `.trim` | 去首尾空白 |

## TypeScript 工具类型

| 类型 | 用途 |
|---|---|
| `Ref<T>` | ref 类型 |
| `ComputedRef<T>` | computed 返回类型 |
| `WritableComputedRef<T>` | 可写 computed |
| `ShallowRef<T>` | shallowRef 类型 |
| `Reactive<T>` | reactive 包装的对象类型 |
| `MaybeRef<T>` | `T \| Ref<T>` |
| `MaybeRefOrGetter<T>` | `T \| Ref<T> \| (() => T)` |
| `UnwrapRef<T>` | 拆 ref 层 |
| `PropType<T>` | Options API props 类型断言 |
| `ComponentPropsOptions` | 整个 props 配置类型 |
| `ExtractPropTypes<T>` | 从 props 配置反推 props 类型 |
| `ExtractPublicPropTypes<T>` | 同上但只含 public（不含 default） |
| `DefineComponent<...>` | defineComponent 返回类型 |
| `Component` / `ComponentInstance` | 通用组件 / 实例类型 |
| `Slot<T>` / `Slots` | slot 函数 |
| `InjectionKey<T>` | 类型化 inject key |
| `Directive<Element, Value, Modifiers>` | 自定义指令类型 |
| `DirectiveBinding<Value>` | 指令 binding 参数 |
| `App<HostElement>` | 应用实例 |

```ts
import type {
  Ref, ComputedRef, MaybeRef, MaybeRefOrGetter,
  PropType, ExtractPropTypes, DefineComponent,
  Directive, DirectiveBinding,
  InjectionKey, Slots,
} from 'vue'

// MaybeRef 让函数接受值或 ref
function useDouble(input: MaybeRef<number>) {
  return computed(() => unref(input) * 2)
}

// 类型化 InjectionKey
const ApiKey: InjectionKey<ApiClient> = Symbol('api')
```

## 配置项（`app.config`）

```ts
const app = createApp(App)

// 错误处理
app.config.errorHandler = (err, instance, info) => { /* ... */ }
app.config.warnHandler = (msg, instance, trace) => { /* ... */ }

// 性能跟踪（DevTools 可见）
app.config.performance = true

// 全局属性
app.config.globalProperties.$apiBase = '/api'
app.config.globalProperties.$formatDate = (d: Date) => d.toISOString()

// 编译器选项
app.config.compilerOptions = {
  isCustomElement: (tag) => tag.startsWith('my-'),  // 跳过这些标签的组件解析
  whitespace: 'condense',                            // 'preserve' | 'condense'
  delimiters: ['${', '}'],                            // 改插值定界符（默认 {{ }}）
  comments: false,                                    // 是否保留注释
}

// 选项合并策略（极少用）
app.config.optionMergeStrategies.myOption = (parent, child) => ({ ...parent, ...child })
```

## Vue Router 4 主要 API

### 创建

```ts
import { createRouter, createWebHistory, createWebHashHistory, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/users/:id', name: 'user', component: User, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
  scrollBehavior(to, from, savedPosition) { /* ... */ },
})
```

### 守卫

| 守卫 | 触发 |
|---|---|
| `router.beforeEach((to, from) => ...)` | 全局前置 |
| `router.beforeResolve((to) => ...)` | 解析后（组件守卫之后） |
| `router.afterEach((to, from, failure?) => ...)` | 全局后置（无返回值） |
| `route.beforeEnter` | 路由独享守卫 |
| `onBeforeRouteLeave((to, from) => ...)` | 组件内：离开 |
| `onBeforeRouteUpdate((to, from) => ...)` | 组件内：同组件参数变化 |

### Composables

| API | 用途 |
|---|---|
| `useRoute()` | 当前路由对象（响应式 readonly） |
| `useRouter()` | router 实例（push / replace / back / forward） |
| `useLink(props)` | 编程获取 RouterLink 等同行为 |
| `onBeforeRouteUpdate(fn)` | 组件内更新守卫 |
| `onBeforeRouteLeave(fn)` | 组件内离开守卫 |

### Router 实例方法

```ts
const router = useRouter()

router.push('/about')
router.push({ name: 'user', params: { id: 42 } })
router.push({ path: '/search', query: { q: 'vue' } })

router.replace('/login')   // 不进历史
router.go(-1)               // 等价 history.go(-1)
router.back()
router.forward()

router.addRoute({ path: '/new', component: NewView })
router.removeRoute('user')
router.hasRoute('user')
router.getRoutes()
```

## Pinia 主要 API

### 创建 Store

```ts
import { defineStore } from 'pinia'

// Setup Store（推荐）
export const useStore = defineStore('id', () => {
  const state = ref(...)
  const getter = computed(...)
  function action() { ... }
  return { state, getter, action }
})

// Option Store
export const useStore = defineStore('id', {
  state: () => ({ ... }),
  getters: { doubled: (state) => state.count * 2 },
  actions: { increment() { this.count++ } },
})
```

### Store 实例方法

| 方法 | 用途 |
|---|---|
| `store.$id` | store id |
| `store.$state` | 直接访问 / 替换 state |
| `store.$patch(partialState)` | 批量修改 |
| `store.$patch((state) => ...)` | 函数式批量修改 |
| `store.$reset()` | 重置到 state() 初始值（Option Store 自动；Setup Store 要自己实现） |
| `store.$subscribe((mutation, state) => ...)` | 监听 state 变化 |
| `store.$onAction(({ name, args, after, onError }) => ...)` | 监听 action |
| `store.$dispose()` | 卸载 store |

### `storeToRefs` —— 解构保留响应

```ts
import { storeToRefs } from 'pinia'

const counter = useCounterStore()
const { count, doubled } = storeToRefs(counter)   // state + getter 保持响应
const { increment } = counter                       // actions 直接拿
```

## 版本里程碑

| 版本 | 时间 | 关键特性 |
|---|---|---|
| **0.x** | 2013~2014 | 初版 |
| **1.0** "Evangelion" | 2015.10 | 首个稳定版 |
| **2.0** "Ghost in the Shell" | 2016.9 | Virtual DOM、Server Rendering |
| **2.1** | 2016.11 | `<transition-group>` |
| **2.5** | 2017.10 | TypeScript 大幅改进 |
| **2.6** | 2019.2 | 新插槽语法（`v-slot`） |
| **2.7** "Naruto" | 2022.7 | 移植 Composition API + `<script setup>` 到 Vue 2 |
| **3.0** "One Piece" | 2020.9 | 重写：Composition API、Proxy 响应式、Fragments、Teleport、Suspense |
| **3.1** | 2021.6 | Migration Build（兼容 v2） |
| **3.2** "Quintessential Quintuplets" | 2021.8 | `<script setup>` 稳定、Web Components、SFC 多 `<style>` |
| **3.3** "Rurouni Kenshin" | 2023.5 | `defineEmits` 短签名、`defineSlots`、Generic Components、`toValue` |
| **3.4** "Slam Dunk" | 2023.12 | `defineModel` 稳定、性能提升、`v-bind` 同名简写 |
| **3.5** "Tengen Toppa Gurren Lagann" | 2024.9 | 反应式 props 解构默认稳定、`useId` / `useTemplateRef` / `onWatcherCleanup`、Lazy Hydration、Teleport `defer` |
| **3.x.x** | 持续迭代 | bug 修复 + 小特性 |
| **Vapor Mode** | 孵化中 | 跳过 VDOM 编译输出（`vapor-alpha-branch`） |

## 完整片段拷贝即用

### 完整 main.ts

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('[global]', err, info)
}

// 全局属性
app.config.globalProperties.$apiBase = import.meta.env.VITE_API_BASE

app
  .use(createPinia())
  .use(router)
  .mount('#app')
```

### 完整 router/index.ts

```ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/users/:id(\\d+)',
    name: 'user',
    component: () => import('@/views/UserView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
```

### 完整 Pinia store

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isLoggedIn = computed(() => user.value !== null)
  const userName = computed(() => user.value?.name ?? 'Guest')

  async function login(email: string, password: string) {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error('Login failed')

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

### 通用 SFC 模板

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted, useTemplateRef } from 'vue'

// Props + Emits
interface Props {
  initialValue?: number
}
const { initialValue = 0 } = defineProps<Props>()

const emit = defineEmits<{
  change: [value: number]
}>()

// 状态
const count = ref(initialValue)
const doubled = computed(() => count.value * 2)

// 模板引用
const buttonRef = useTemplateRef<HTMLButtonElement>('btn')

// 副作用
watch(count, (val) => emit('change', val))

onMounted(() => {
  buttonRef.value?.focus()
})

// 事件
function increment() {
  count.value++
}

// 暴露
defineExpose({ count, increment })
</script>

<template>
  <div class="counter">
    <span>{{ count }} ({{ doubled }})</span>
    <button ref="btn" @click="increment">+1</button>
  </div>
</template>

<style scoped>
.counter {
  display: flex;
  gap: 8px;
  align-items: center;
}
button {
  padding: 4px 12px;
}
</style>
```

### 完整自定义指令

```ts
// directives/clickOutside.ts
import type { Directive } from 'vue'

type Handler = (e: MouseEvent) => void

interface ClickOutsideElement extends HTMLElement {
  _clickOutsideHandler?: (e: MouseEvent) => void
}

export const vClickOutside: Directive<ClickOutsideElement, Handler> = {
  mounted(el, binding) {
    el._clickOutsideHandler = (e) => {
      if (!el.contains(e.target as Node)) {
        binding.value(e)
      }
    }
    document.addEventListener('click', el._clickOutsideHandler)
  },
  unmounted(el) {
    if (el._clickOutsideHandler) {
      document.removeEventListener('click', el._clickOutsideHandler)
      delete el._clickOutsideHandler
    }
  },
}
```

```ts
// main.ts 注册
import { vClickOutside } from './directives/clickOutside'
app.directive('click-outside', vClickOutside)
```

```vue
<template>
  <div v-click-outside="closeDropdown">Dropdown content</div>
</template>
```

### 完整 Composable

```ts
// composables/useFetchData.ts
import { ref, watch, type Ref } from 'vue'
import { onWatcherCleanup } from 'vue'

export interface UseFetchOptions {
  immediate?: boolean
}

export function useFetchData<T>(
  url: Ref<string> | (() => string),
  options: UseFetchOptions = {},
) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function execute(currentUrl: string) {
    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort())

    loading.value = true
    error.value = null

    try {
      const res = await fetch(currentUrl, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data.value = await res.json()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        error.value = e as Error
      }
    } finally {
      loading.value = false
    }
  }

  watch(
    typeof url === 'function' ? url : url,
    execute,
    { immediate: options.immediate ?? true },
  )

  return { data, loading, error }
}
```

### 完整 plugin

```ts
// plugins/apiClient.ts
import type { App } from 'vue'

export interface ApiClientOptions {
  baseURL?: string
  headers?: Record<string, string>
}

export class ApiClient {
  constructor(private options: ApiClientOptions = {}) {}

  async get<T>(url: string): Promise<T> {
    const res = await fetch(`${this.options.baseURL ?? ''}${url}`, {
      headers: this.options.headers,
    })
    return res.json()
  }

  async post<T>(url: string, body: any): Promise<T> {
    const res = await fetch(`${this.options.baseURL ?? ''}${url}`, {
      method: 'POST',
      headers: { ...this.options.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json()
  }
}

export const ApiClientKey = Symbol('apiClient')

export default {
  install(app: App, options: ApiClientOptions = {}) {
    const client = new ApiClient(options)
    app.provide(ApiClientKey, client)
    app.config.globalProperties.$api = client
  },
}
```

```ts
// 类型扩展
declare module 'vue' {
  interface ComponentCustomProperties {
    $api: ApiClient
  }
}
```

```ts
// main.ts
import ApiClientPlugin from './plugins/apiClient'

app.use(ApiClientPlugin, {
  baseURL: import.meta.env.VITE_API_BASE,
})
```

```vue
<script setup lang="ts">
import { inject } from 'vue'
import { ApiClientKey, type ApiClient } from '@/plugins/apiClient'

const api = inject(ApiClientKey) as ApiClient
const data = await api.get('/users')
</script>
```

## 速查链接

- 官方中文文档：[cn.vuejs.org](https://cn.vuejs.org/)
- 官方英文文档：[vuejs.org](https://vuejs.org/)
- API 参考：[cn.vuejs.org/api](https://cn.vuejs.org/api/)
- SFC Playground：[play.vuejs.org](https://play.vuejs.org/)
- 路由：[router.vuejs.org](https://router.vuejs.org/)
- 状态管理：[pinia.vuejs.org](https://pinia.vuejs.org/)
- DevTools：[devtools.vuejs.org](https://devtools.vuejs.org/)
- 工具库：[vueuse.org](https://vueuse.org/)
- Awesome Vue：[github.com/vuejs/awesome-vue](https://github.com/vuejs/awesome-vue)
