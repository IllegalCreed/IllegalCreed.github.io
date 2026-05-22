---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 **VueUse v14.x（v14.3.0）**。包含 12 大分类速览、核心设计约定深入（解构 / effectScope / MaybeRef·toValue / controls / isSupported）、State 与 Network 旗舰函数（useStorage / useFetch）深度、元素与传感器、浏览器、Watch 增强、Reactivity 工具、Utilities、Component、无渲染组件、10 个 add-on、自动导入、SSR / Nuxt 完整方案、TypeScript 类型推导、常见踩坑。

## 速查

- **VueUse 是什么**：Anthony Fu 等人维护的 Vue 组合式工具库，**200+ composables**，MIT 协议，**Vue 3 专用**（v12 起弃 Vue 2、v14 要求 Vue 3.5+）
- **包结构**：`@vueuse/core`（核心） + 10 个 add-on（router / integrations / firebase / rxjs / electron / math / sound / motion / gesture / schema-org） + `@vueuse/components`（无渲染组件） + `@vueuse/nuxt`（Nuxt 模块）
- **12 大分类**：State / Elements / Browser / Sensors / Network / Animation / Component / Watch / Reactivity / Array / Time / Utilities
- **核心约定**：函数返回 `ref` 对象 → ES6 解构 / `reactive()` 去 `.value`；副作用自动清理（部分返回 `stop` 句柄）
- **响应式参数**：`MaybeRef`（ref 或值）/ `MaybeRefOrGetter`（ref / getter / 值），内部用 `toValue()` 统一解包
- **controls 选项**：`useTimestamp()` 直接返回 ref，`useTimestamp({ controls: true })` 返回 `{ timestamp, pause, resume }`
- **isSupported 模式**：实验性 Web API（`useShare` / `useEyeDropper` 等）返回 `isSupported`，用前先判断
- **旗舰函数**：`useFetch`（响应式 HTTP） / `useStorage`（响应式持久化） / `useDark`（暗色模式） / `useElementSize`（尺寸观察）
- **自动导入**：`unplugin-auto-import` 配合 `@vueuse/core` preset，或 Nuxt 用 `@vueuse/nuxt`
- **SSR 安全**：大部分函数 SSR 安全，访问 `window` / `document` 的部分在客户端激活后才生效

## 安装

```bash
# 核心包
pnpm add @vueuse/core

# 按需添加 add-on
pnpm add @vueuse/router       # vue-router 集成
pnpm add @vueuse/integrations # axios / cookies / jwt / qrcode 等
pnpm add @vueuse/components   # 无渲染组件

# Nuxt 项目
pnpm add -D @vueuse/nuxt @vueuse/core
```

```ts
// 直接按需导入即可，无需注册插件
import { useStorage, useDark, useFetch } from '@vueuse/core'
```

> **关键概念**：VueUse **不是组件库、也不需要 `app.use()` 注册**——它是一组纯函数（composables），在 `<script setup>` 或其他 composable 内直接调用即可。

## 12 大分类速览

VueUse 把 200+ 函数分为 **12 大类**——熟悉分类有助于快速定位需要的工具：

| 分类 | 数量 | 用途 | 代表函数 |
|---|---|---|---|
| **State** | 13 | 跨组件 / 持久化状态 | `useStorage` `useLocalStorage` `createGlobalState` `useRefHistory` `useAsyncState` |
| **Elements** | 15 | DOM 元素观察与操作 | `useElementSize` `useElementBounding` `useIntersectionObserver` `useResizeObserver` `useDraggable` |
| **Browser** | 41 | 浏览器 API 封装 | `useDark` `useColorMode` `useClipboard` `useEventListener` `useBreakpoints` `useTitle` |
| **Sensors** | 52 | 用户输入 / 设备传感 | `useMouse` `useScroll` `onClickOutside` `useMagicKeys` `useInfiniteScroll` `useGeolocation` |
| **Network** | 3 | 网络请求 | `useFetch` `useWebSocket` `useEventSource` |
| **Animation** | 8 | 动画与定时 | `useTransition` `useRafFn` `useInterval` `useIntervalFn` `useNow` `useTimestamp` |
| **Component** | 14 | 组件辅助 | `useVModel` `useVModels` `createReusableTemplate` `useVirtualList` `templateRef` |
| **Watch** | 11 | 增强的 watch | `watchDebounced` `watchThrottled` `watchPausable` `until` `whenever` `watchOnce` |
| **Reactivity** | 16 | 响应式工具 | `refDebounced` `computedAsync` `syncRef` `toReactive` `reactify` `reactivePick` |
| **Array** | 11 | 响应式数组方法 | `useArrayFilter` `useArrayMap` `useArrayReduce` `useArrayFind` `useSorted` |
| **Time** | 4 | 日期时间 | `useDateFormat` `useTimeAgo` `useTimeAgoIntl` `useCountdown` |
| **Utilities** | 20 | 通用工具 | `useToggle` `useCounter` `useDebounceFn` `useThrottleFn` `useEventBus` `useCycleList` |

> 命名规律：
>
> - `use*`：返回响应式状态的 composable（生命周期内有效），如 `useMouse`
> - `on*`：注册事件型回调，如 `onClickOutside` / `onKeyStroke` / `onLongPress`
> - `create*`：工厂函数，返回另一个可复用的函数 / state，如 `createGlobalState` / `createFetch`
> - `try*`：在「可能没有组件上下文」的场景下安全调用生命周期钩子，如 `tryOnMounted`

## 核心设计约定深入

VueUse 的 200+ 函数能保持一致体验，靠的是几条贯穿全库的设计约定。**理解这些约定，比记住单个函数更重要**——掌握后任何新函数拿来就会用。

### 约定一：返回 ref 对象，解构与 reactive

绝大多数 `use*` 函数返回一个**普通对象，对象的每个属性是 `ref`**。这样既能 ES6 解构、又保持响应性：

```vue
<script setup lang="ts">
import { useMouse, useElementSize } from '@vueuse/core'
import { useTemplateRef } from 'vue'

// 解构出来的 x / y 依然是 ref，模板里自动解包
const { x, y } = useMouse()

const el = useTemplateRef<HTMLElement>('box')
const { width, height } = useElementSize(el)
</script>

<template>
  <div ref="box">
    鼠标坐标：{{ x }}, {{ y }}
    <p>盒子尺寸：{{ width }} × {{ height }}</p>
  </div>
</template>
```

如果不想到处写 `.value`，可以用 Vue 的 `reactive()` 包裹——它会自动解包内部所有 ref：

```ts
import { reactive } from 'vue'
import { useMouse } from '@vueuse/core'

// mouse.x / mouse.y 直接访问、无需 .value
const mouse = reactive(useMouse())

console.log(mouse.x, mouse.y) // 直接读
```

> **关键概念**：
>
> 1. 返回**对象**而非数组，是为了**按需解构**——你只关心 `x` 就只解构 `x`
> 2. 解构后属性**仍是 ref**——这正是 VueUse 能保持响应性的原因（区别于解构 `props` 会丢响应性）
> 3. 少数函数返回**单个 ref**（如 `useStorage` / `useTitle`），此时不能解构、直接当 ref 用
> 4. 部分函数返回**数组**（如 `useToggle` 返回 `[value, toggle]`），按 React 习惯设计，方便重命名

### 约定二：副作用自动清理与 effectScope

VueUse 的函数会在内部调用 `useEventListener` / `watch` / `setInterval` 等——这些副作用**会在组件卸载时自动清理**，无需手动写 `onUnmounted`：

```vue
<script setup lang="ts">
import { useEventListener, useIntervalFn } from '@vueuse/core'

// 组件卸载时自动 removeEventListener
useEventListener(window, 'resize', () => console.log('窗口变化'))

// 组件卸载时自动 clearInterval
useIntervalFn(() => console.log('tick'), 1000)
</script>
```

部分函数还会**返回 `stop` 句柄**，让你提前手动停止：

```ts
import { useIntervalFn, watchDebounced } from '@vueuse/core'

// useIntervalFn 返回控制句柄
const { pause, resume, isActive } = useIntervalFn(() => {
  console.log('tick')
}, 1000)

pause()  // 暂停
resume() // 恢复

// watch 系列返回 stop 函数
const stop = watchDebounced(source, () => {}, { debounce: 500 })
stop()   // 提前停止
```

**`effectScope()` 批量管理**：当你在一个非组件场景（如自定义 composable、Pinia store）里调用了多个 VueUse 函数，可以用 Vue 的 `effectScope()` 把它们全部「装进一个作用域」，一次 `scope.stop()` 全部清理：

```ts
import { effectScope } from 'vue'
import { useMouse, useEventListener, useIntervalFn } from '@vueuse/core'

const scope = effectScope()

scope.run(() => {
  // 作用域内创建的所有副作用都归 scope 管
  const { x, y } = useMouse()
  useEventListener(window, 'click', () => {})
  useIntervalFn(() => {}, 1000)
})

// 一次性清理作用域内的全部副作用
scope.stop()
```

> **为什么需要 effectScope**：VueUse 函数依赖「当前组件实例」来注册 `onUnmounted`。如果在**没有组件上下文**的地方调用（如普通 JS 模块顶层），自动清理就失效、造成内存泄漏。`effectScope` 提供了一个**脱离组件的清理边界**——这也是 Pinia store 内部的实现机制。

### 约定三：MaybeRef / MaybeRefOrGetter 与 toValue

这是 VueUse「响应式参数」的精髓。VueUse 函数的参数**几乎都能接收三种形态**——静态值、ref、getter 函数：

```ts
// VueUse 内部的类型定义（简化）
type MaybeRef<T> = T | Ref<T>
type MaybeRefOrGetter<T> = T | Ref<T> | (() => T)
```

以 `useTitle` 为例，下面三种写法都合法：

```ts
import { ref } from 'vue'
import { useTitle } from '@vueuse/core'

// 1. 静态值
useTitle('我的页面')

// 2. 传 ref —— 改 ref 即改标题
const title = ref('首页')
useTitle(title)
title.value = '详情页' // document.title 同步更新

// 3. 传 getter —— 标题随依赖响应式变化（推荐！）
const route = useRoute()
useTitle(() => `${route.meta.title} - 我的站点`)
```

VueUse 内部用 Vue 3.3+ 的 `toValue()` 统一解包这三种形态：

```ts
import { toValue } from 'vue'

function myComposable(input: MaybeRefOrGetter<string>) {
  // 不管传进来的是值 / ref / getter，toValue 都解包成原始值
  const resolved = toValue(input) // string

  // 配合 watchEffect，getter 形态能自动追踪依赖
  watchEffect(() => {
    console.log('当前值：', toValue(input))
  })
}
```

> **关键概念**：
>
> 1. **优先用 getter 形态**——`() => xxx` 能让 VueUse 自动追踪响应式依赖，是最灵活的写法
> 2. `toValue()` 是 Vue 3.3 内置 API（早期叫 `unref` 但 `unref` 不解包 getter）
> 3. 写自己的 composable 时，参数也应声明为 `MaybeRefOrGetter<T>` + 内部 `toValue()`——这是 VueUse 风格的最佳实践

### 约定四：controls 选项（按需返回控制句柄）

一些函数有两种返回模式——默认返回**单个 ref**（用着简单），传 `{ controls: true }` 返回**带控制方法的对象**：

```ts
import { useTimestamp, useNow, useInterval } from '@vueuse/core'

// 默认：直接返回时间戳 ref
const timestamp = useTimestamp()
console.log(timestamp.value)

// controls 模式：返回 { timestamp, pause, resume }
const { timestamp: ts, pause, resume } = useTimestamp({ controls: true })
pause()  // 暂停更新
resume() // 恢复更新

// useNow 同理
const { now, pause: pauseNow, resume: resumeNow } = useNow({ controls: true })

// useInterval：默认返回计数 ref，controls 模式返回 { counter, reset, pause, resume }
const { counter, reset } = useInterval(1000, { controls: true })
```

> **设计意图**：80% 的场景只需要那个 ref，不想被一堆控制方法干扰；需要精细控制时再开 `controls`。TypeScript 会根据 `controls` 的值**自动推导**返回类型——传 `true` 就是对象、不传就是 ref。

### 约定五：isSupported 模式（实验性 Web API）

涉及实验性 / 兼容性差的浏览器 API（`navigator.share`、`EyeDropper`、`navigator.vibrate` 等），VueUse 会额外返回一个 `isSupported`，**用前必须判断**：

```vue
<script setup lang="ts">
import { useShare, useVibrate, useWakeLock } from '@vueuse/core'

const { share, isSupported } = useShare()

function onShare() {
  if (!isSupported.value) return
  share({
    title: 'VueUse',
    text: '强大的 Vue 组合式工具库',
    url: location.href,
  })
}

const { vibrate, isSupported: canVibrate } = useVibrate({ pattern: [300, 100, 300] })
</script>

<template>
  <button :disabled="!isSupported" @click="onShare">分享</button>
</template>
```

### 约定六：configurableWindow / configurableDocument

访问全局对象的函数允许传入自定义 `window` / `document`——主要服务于**多窗口（iframe / 弹窗）** 和 **SSR / 测试**场景：

```ts
import { useEventListener, useActiveElement } from '@vueuse/core'

// 监听 iframe 内部的 window
const iframe = document.querySelector('iframe')
useEventListener(iframe?.contentWindow, 'scroll', handler)

// 传入自定义 document
useActiveElement({ document: iframe?.contentDocument })
```

## State 状态管理深度

### useStorage / useLocalStorage —— 响应式持久化

`useStorage` 是 VueUse 的旗舰函数之一——把一个 ref 与 `localStorage` / `sessionStorage` **双向绑定**，刷新页面状态不丢、跨标签页自动同步。

```ts
function useStorage<T>(
  key: MaybeRefOrGetter<string>,
  defaults: MaybeRefOrGetter<T>,
  storage?: StorageLike,          // 默认 localStorage
  options?: UseStorageOptions<T>,
): RemovableRef<T>
```

**类型按默认值自动推断**——这是它最贴心的地方：

```ts
import { useStorage } from '@vueuse/core'

// 传字符串 → 推断 string，原样存
const name = useStorage('user-name', 'Anonymous')

// 传数字 → 推断 number，自动 parseFloat
const count = useStorage('visit-count', 0)

// 传布尔 → 推断 boolean
const darkMode = useStorage('dark-mode', false)

// 传对象 → 推断 object，自动 JSON 序列化
const settings = useStorage('app-settings', {
  theme: 'light',
  fontSize: 14,
})

// Map / Set / Date 也能正确序列化
const tags = useStorage('tags', new Set<string>())
const lastVisit = useStorage('last-visit', new Date())

// 读写就像普通 ref
settings.value.fontSize = 16   // 自动写入 localStorage
name.value = null              // 设为 null = 从 storage 中删除该 key
```

`useLocalStorage` / `useSessionStorage` 是预设了 storage 的简写：

```ts
import { useLocalStorage, useSessionStorage } from '@vueuse/core'

const token = useLocalStorage('token', '')        // 等价 useStorage(..., localStorage)
const draft = useSessionStorage('form-draft', {})  // 等价 useStorage(..., sessionStorage)
```

**完整选项**：

```ts
const state = useStorage('app-config', { theme: 'light' }, localStorage, {
  // 新增字段的默认值会合并进旧数据（升级配置结构时关键！）
  mergeDefaults: true,

  // 深度监听对象 / 数组内部变化（默认 true）
  deep: true,

  // 监听 storage 事件，跨标签页同步（默认 true）
  listenToStorageChanges: true,

  // storage 中无此 key 时是否立即写入默认值（默认 true）
  writeDefaults: true,

  // watch 刷新时机：'pre' | 'post' | 'sync'
  flush: 'pre',

  // 自定义序列化器
  serializer: {
    read: (raw) => JSON.parse(raw),
    write: (value) => JSON.stringify(value),
  },

  // 序列化 / 读写出错的回调
  onError: (e) => console.error('存储失败', e),
})
```

> **`mergeDefaults` 为什么重要**：假设上线时 `defaults` 是 `{ theme }`，用户的 localStorage 里已存了旧数据；下个版本你加了 `fontSize` 字段。若不开 `mergeDefaults`，老用户读出来的对象**没有 `fontSize`**；开了之后，VueUse 会把新默认值**浅合并**进旧数据。需要深合并可传函数：`mergeDefaults: (storageValue, defaults) => deepMerge(defaults, storageValue)`。

**内置序列化器** `StorageSerializers`——可手动指定：

```ts
import { useStorage, StorageSerializers } from '@vueuse/core'

// 默认值是 null 时无法推断类型，需显式指定 serializer
const user = useStorage<UserInfo | null>('user', null, undefined, {
  serializer: StorageSerializers.object,
})
// 可选：string / number / boolean / object / map / set / date / any
```

**key 可响应式**——按用户切换不同存储桶：

```ts
const userId = ref('user-1')
// userId 变化时，自动切换到对应 key 的存储
const prefs = useStorage(() => `prefs-${userId.value}`, {})
```

### createGlobalState —— 跨组件共享状态

把一个 composable 变成**全局单例**——所有组件拿到的是同一份状态，是「不想引入 Pinia」时的轻量方案：

```ts
// stores/useGlobalUser.ts
import { createGlobalState, useStorage } from '@vueuse/core'
import { computed } from 'vue'

export const useGlobalUser = createGlobalState(() => {
  // 这段逻辑只执行一次，结果被所有调用方共享
  const token = useStorage('token', '')
  const profile = useStorage('profile', { name: '', role: 'guest' })

  const isLoggedIn = computed(() => !!token.value)

  function logout() {
    token.value = ''
    profile.value = { name: '', role: 'guest' }
  }

  return { token, profile, isLoggedIn, logout }
})
```

```vue
<script setup lang="ts">
// 任意组件调用，拿到的都是同一份 state
import { useGlobalUser } from '@/stores/useGlobalUser'

const { profile, isLoggedIn, logout } = useGlobalUser()
</script>
```

> 相关函数：`createSharedComposable` —— 与 `createGlobalState` 类似，但**当所有引用方都卸载后会自动销毁并清理副作用**，下次再调用时重新初始化。适合包裹 `useMouse` 这类带副作用的函数，避免重复注册监听。

### createInjectionState —— 带类型的 provide / inject 封装

把 `provide` / `inject` 封装成一对类型安全的 hook，常用于「父组件提供、后代组件消费」：

```ts
// composables/useCounterState.ts
import { createInjectionState } from '@vueuse/core'
import { ref, computed } from 'vue'

const [useProvideCounter, useCounterRaw] = createInjectionState((initial: number) => {
  const count = ref(initial)
  const double = computed(() => count.value * 2)
  const increment = () => count.value++
  return { count, double, increment }
})

export { useProvideCounter }

// 包装一层，给出未 provide 时的友好报错
export function useCounter() {
  const state = useCounterRaw()
  if (!state) throw new Error('请先在祖先组件调用 useProvideCounter()')
  return state
}
```

### useRefHistory —— 撤销 / 重做

追踪一个 ref 的变更历史，自带 `undo` / `redo`——做编辑器、表单草稿很方便：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRefHistory } from '@vueuse/core'

const text = ref('')

const { history, undo, redo, canUndo, canRedo, clear } = useRefHistory(text, {
  deep: true,      // 深度追踪对象 / 数组
  capacity: 50,    // 最多保留 50 条历史（防内存膨胀）
})
</script>

<template>
  <textarea v-model="text" />
  <button :disabled="!canUndo" @click="undo()">撤销</button>
  <button :disabled="!canRedo" @click="redo()">重做</button>
  <button @click="clear()">清空历史</button>
  <p>共 {{ history.length }} 条历史记录</p>
</template>
```

> 衍生函数：`useDebouncedRefHistory`（防抖记录，连续输入只记一次）/ `useThrottledRefHistory`（节流记录）/ `useManualRefHistory`（手动调 `commit()` 才记录）。

### useAsyncState —— 异步状态封装

把一个返回 Promise 的函数包成 `{ state, isLoading, isReady, error }`——比手写 `loading` ref 干净：

```vue
<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import axios from 'axios'

const { state, isLoading, isReady, error, execute } = useAsyncState(
  (id: number) => axios.get(`/api/users/${id}`).then((r) => r.data),
  null,                    // 初始值（请求完成前的占位）
  {
    immediate: true,       // 立即执行（默认 true）
    resetOnExecute: true,  // 重新执行时先重置为初始值
    onError: (e) => console.error(e),
  },
)

// 手动重新请求
function reload(id: number) {
  execute(0, id) // 第一个参数是延迟 ms，后续是传给 promise 函数的参数
}
</script>

<template>
  <p v-if="isLoading">加载中...</p>
  <p v-else-if="error">出错了</p>
  <pre v-else>{{ state }}</pre>
</template>
```

## Network 网络深度

### useFetch —— 响应式 HTTP 请求（旗舰）

`useFetch` 是 VueUse 最强大的函数之一——对原生 `fetch` 的响应式封装，URL 可响应式、支持自动重发、拦截器、可取消、链式 API。

**基础用法**：

```vue
<script setup lang="ts">
import { useFetch } from '@vueuse/core'

// 立即发起请求，data / error 都是响应式 ref
const { data, error, isFetching, isFinished, statusCode } = useFetch(
  'https://api.example.com/users',
)
</script>

<template>
  <p v-if="isFetching">请求中...</p>
  <p v-else-if="error">请求失败：{{ statusCode }}</p>
  <pre v-else>{{ data }}</pre>
</template>
```

**完整返回值**：

| 返回值 | 类型 | 说明 |
|---|---|---|
| `data` | `Ref<T \| null>` | 响应体（按 `.json()` / `.text()` 等解析） |
| `error` | `Ref<any>` | 请求错误 |
| `response` | `Ref<Response \| null>` | 原始 Response 对象 |
| `statusCode` | `Ref<number \| null>` | HTTP 状态码 |
| `isFetching` | `Ref<boolean>` | 是否请求中 |
| `isFinished` | `Ref<boolean>` | 是否已结束 |
| `canAbort` | `ComputedRef<boolean>` | 是否可取消 |
| `aborted` | `Ref<boolean>` | 是否已取消 |
| `abort` | `() => void` | 取消请求 |
| `execute` | `(throwOnFailed?) => Promise` | 手动发起请求 |
| `onFetchResponse` / `onFetchError` / `onFetchFinally` | EventHook | 事件钩子 |

**响应式 URL + 自动重发**：URL 传 ref 时，URL 变化会**自动重新请求**（需开 `refetch`）：

```ts
import { ref } from 'vue'
import { useFetch } from '@vueuse/core'

const userId = ref('1')
const url = computed(() => `https://api.example.com/users/${userId.value}`)

// refetch: true —— url 变化时自动重发
const { data } = useFetch(url, { refetch: true })

userId.value = '2' // 自动请求 /users/2
```

**手动触发（`immediate: false`）**：

```ts
const { data, execute, isFetching } = useFetch('/api/search', {
  immediate: false, // 不自动发，等手动 execute()
})

async function search() {
  await execute() // 手动发起
}
```

**取消请求与超时**：

```ts
const { abort, canAbort, isFetching } = useFetch('/api/slow', {
  timeout: 5000, // 5 秒后自动 abort
})

// 也可手动取消
function cancel() {
  if (canAbort.value) abort()
}
```

**拦截器钩子**——注入 token、改写数据、统一错误处理：

```ts
const { data } = useFetch('/api/profile', {
  // 请求前：注入鉴权头
  async beforeFetch({ url, options, cancel }) {
    const token = localStorage.getItem('token')
    if (!token) {
      cancel() // 没 token 直接取消请求
      return
    }
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }
    return { options }
  },

  // 响应后：解包后端统一结构 { code, data }
  afterFetch(ctx) {
    if (ctx.data?.code === 0) {
      ctx.data = ctx.data.data // 只保留业务数据
    }
    return ctx
  },

  // 出错时：可改写 data / error
  onFetchError(ctx) {
    ctx.error = new Error('请求失败，请稍后重试')
    return ctx
  },
})
```

**链式 API**——指定 HTTP 方法 + 响应解析方式：

```ts
// GET + JSON 解析
const { data } = useFetch('/api/users').get().json<User[]>()

// POST 携带请求体
const { data } = useFetch('/api/users').post({ name: 'Anthony' }).json()

// PUT / DELETE / PATCH
useFetch(`/api/users/${id}`).put({ name: 'New' }).json()
useFetch(`/api/users/${id}`).delete()

// 响应解析：.json() / .text() / .blob() / .arrayBuffer() / .formData()
const { data: blob } = useFetch('/api/file').get().blob()
```

**`createFetch` —— 创建带预设的实例**：项目里建一个统一配置的 fetch 实例（类似封装 axios 实例）：

```ts
// utils/request.ts
import { createFetch } from '@vueuse/core'

export const useApi = createFetch({
  baseUrl: 'https://api.example.com',
  // combination: 'chain' 默认 —— 实例与调用处的钩子都执行
  // combination: 'overwrite' —— 调用处的钩子覆盖实例钩子
  combination: 'chain',
  options: {
    beforeFetch({ options }) {
      const token = localStorage.getItem('token')
      if (token) {
        options.headers = { ...options.headers, Authorization: `Bearer ${token}` }
      }
      return { options }
    },
  },
  fetchOptions: {
    headers: { 'Content-Type': 'application/json' },
  },
})
```

```ts
// 业务里使用 —— baseUrl 与鉴权头已自动带上
const { data } = useApi('/users').get().json<User[]>()
```

**可 await（配合 Suspense）**：

```vue
<script setup lang="ts">
import { useFetch } from '@vueuse/core'

// 在 <Suspense> 包裹的组件里，可直接 await
const { data } = await useFetch('/api/config').get().json()
</script>
```

> **关键概念**：
>
> 1. `data` 是 `null` 直到请求完成——模板里务必判空 / 配合 `isFetching`
> 2. `useFetch` 默认 `immediate: true`——一调用就发请求；手动模式用 `immediate: false` + `execute()`
> 3. `refetch` 才能让响应式 URL 自动重发，**不开 `refetch` 时改 URL 不会重新请求**
> 4. `useFetch` 适合中小项目；复杂数据层（缓存、依赖、SWR）建议上 TanStack Query

### useWebSocket —— 响应式 WebSocket

```vue
<script setup lang="ts">
import { useWebSocket } from '@vueuse/core'

const { status, data, send, open, close } = useWebSocket('wss://echo.websocket.org', {
  // 自动重连
  autoReconnect: {
    retries: 3,
    delay: 1000,
    onFailed: () => console.error('重连失败'),
  },
  // 心跳保活
  heartbeat: {
    message: 'ping',
    interval: 30000,
    pongTimeout: 5000,
  },
  immediate: true,         // 立即连接
  autoClose: true,         // 组件卸载时自动关闭
  onConnected: () => console.log('已连接'),
  onMessage: (ws, ev) => console.log('收到', ev.data),
})
// status: 'CONNECTING' | 'OPEN' | 'CLOSED'
</script>

<template>
  <p>连接状态：{{ status }}</p>
  <p>最新消息：{{ data }}</p>
  <button @click="send('hello')">发送</button>
</template>
```

### useEventSource —— 服务器推送（SSE）

```ts
import { useEventSource } from '@vueuse/core'

const { status, data, error, close } = useEventSource('/api/sse/notifications', [], {
  autoReconnect: true,
  immediate: true,
})
// status: 'CONNECTING' | 'OPEN' | 'CLOSED'
// data 为最新一条推送消息
```

## 元素与传感器深度

### useElementSize / useElementBounding —— 尺寸与位置

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useElementSize, useElementBounding } from '@vueuse/core'

const box = useTemplateRef<HTMLElement>('box')

// 元素内容尺寸（基于 ResizeObserver）
const { width, height } = useElementSize(box)

// 元素相对视口的位置（getBoundingClientRect 响应式版）
const { top, left, right, bottom, x, y } = useElementBounding(box)
</script>

<template>
  <div ref="box" class="resizable">{{ width }} × {{ height }}</div>
</template>
```

### useIntersectionObserver —— 元素进入 / 离开视口

懒加载、滚动曝光埋点、无限滚动的底层能力：

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const target = useTemplateRef<HTMLElement>('target')
const isVisible = ref(false)

const { stop } = useIntersectionObserver(
  target,
  ([entry]) => {
    isVisible.value = entry?.isIntersecting ?? false
  },
  {
    threshold: 0.5,           // 元素 50% 可见时触发
    rootMargin: '0px 0px 100px 0px', // 提前 100px 触发（预加载）
  },
)
</script>

<template>
  <div ref="target">{{ isVisible ? '在视口内' : '不可见' }}</div>
</template>
```

> 上层封装：`useElementVisibility`（直接返回 `isVisible` ref，无需写回调）。

### useResizeObserver / useMutationObserver

```ts
import { useResizeObserver, useMutationObserver } from '@vueuse/core'

// 监听元素尺寸变化（useElementSize 的底层）
useResizeObserver(el, (entries) => {
  const { width, height } = entries[0]!.contentRect
  console.log('尺寸变化', width, height)
})

// 监听 DOM 属性 / 子节点变化
useMutationObserver(el, (mutations) => {
  console.log('DOM 变化', mutations)
}, { attributes: true, childList: true, subtree: true })
```

### useMouse / useScroll —— 鼠标与滚动

```vue
<script setup lang="ts">
import { useMouse, useScroll } from '@vueuse/core'

// 全局鼠标坐标
const { x, y, sourceType } = useMouse()

// 元素滚动状态（双向：读 / 写都可以）
const el = useTemplateRef<HTMLElement>('scroller')
const { x: scrollX, y: scrollY, isScrolling, arrivedState, directions } = useScroll(el, {
  behavior: 'smooth',
})
// arrivedState: { left, right, top, bottom } —— 是否滚到边界
// directions: { left, right, top, bottom } —— 当前滚动方向

// 写入即触发滚动
function scrollToTop() {
  scrollY.value = 0
}
</script>
```

### onClickOutside —— 点击元素外部

下拉菜单、弹层、抽屉「点外面关闭」的标准方案：

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { onClickOutside } from '@vueuse/core'

const dropdown = useTemplateRef<HTMLElement>('dropdown')
const open = ref(false)

onClickOutside(dropdown, () => {
  open.value = false
}, {
  ignore: ['.toggle-button'], // 忽略某些元素（点它们不算「外部」）
})
</script>

<template>
  <button class="toggle-button" @click="open = !open">菜单</button>
  <div v-if="open" ref="dropdown" class="dropdown">下拉内容</div>
</template>
```

### useDraggable —— 元素拖拽

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useDraggable } from '@vueuse/core'

const el = useTemplateRef<HTMLElement>('draggable')
const handle = useTemplateRef<HTMLElement>('handle')

const { x, y, style, isDragging } = useDraggable(el, {
  initialValue: { x: 40, y: 40 },
  handle,                       // 只有拖 handle 才能移动
  // axis: 'x' / 'y' / 'both'   限制拖拽方向
})
</script>

<template>
  <div ref="el" :style="style" class="card">
    <div ref="handle" class="card__handle">⠿ 拖我</div>
    内容（{{ isDragging ? '拖拽中' : '静止' }}）
  </div>
</template>
```

> 配套：`useDropZone`（拖放区域、接收文件）/ `useElementHover`（hover 状态）/ `useInfiniteScroll`（无限滚动加载）。

## 浏览器深度

### useDark / useColorMode —— 暗色模式

`useDark` 是做暗黑模式的首选——返回一个布尔 ref，**读取尊重系统偏好、写入持久化到 localStorage、自动切换 `<html>` 上的 class**：

```vue
<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark({
  selector: 'html',           // 切换 class 挂在哪个元素（默认 html）
  attribute: 'class',         // 用 class 还是属性
  valueDark: 'dark',          // 暗色时的值
  valueLight: '',             // 亮色时的值
  storageKey: 'vueuse-color-scheme', // localStorage key
})

const toggleDark = useToggle(isDark)
</script>

<template>
  <button @click="toggleDark()">{{ isDark ? '🌙' : '☀️' }}</button>
</template>
```

`useColorMode` 是 `useDark` 的进阶版——支持 `auto` / `light` / `dark` **三态**（甚至自定义更多主题）：

```ts
import { useColorMode } from '@vueuse/core'

const mode = useColorMode({
  modes: {
    // 在 light / dark 之外扩展自定义主题
    cafe: 'theme-cafe',
    ocean: 'theme-ocean',
  },
})
// mode.value: 'auto' | 'light' | 'dark' | 'cafe' | 'ocean'
mode.value = 'dark'

// store: 用户的选择（含 auto）；state: 实际生效的模式（auto 被解析成 light/dark）
const { system, store } = useColorMode()
```

### useClipboard —— 剪贴板

```vue
<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const source = ref('要复制的文本')
const { text, copy, copied, isSupported } = useClipboard({
  source,
  copiedDuring: 1500, // copied 状态保持 1.5 秒
})
</script>

<template>
  <button :disabled="!isSupported" @click="copy()">
    {{ copied ? '已复制!' : '复制' }}
  </button>
  <p>剪贴板当前内容：{{ text }}</p>
</template>
```

### useBreakpoints —— 响应式断点

```ts
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

// 内置预设：breakpointsTailwind / breakpointsBootstrapV5 / breakpointsAntDesign 等
const breakpoints = useBreakpoints(breakpointsTailwind)

const isMobile = breakpoints.smaller('md')      // < 768px
const isDesktop = breakpoints.greaterOrEqual('lg') // >= 1024px
const current = breakpoints.active()            // 当前激活的断点名

// 自定义断点
const bp = useBreakpoints({ mobile: 0, tablet: 640, desktop: 1024 })
```

### useEventListener —— 自动清理的事件监听

比手写 `addEventListener` + `onUnmounted` 干净——卸载时自动 `removeEventListener`：

```ts
import { useEventListener } from '@vueuse/core'

// 监听 window
useEventListener(window, 'resize', onResize)

// 监听元素（可传 ref，元素变化时自动重新绑定）
const el = useTemplateRef<HTMLElement>('box')
useEventListener(el, 'click', onClick)

// 返回 stop，可提前解绑
const stop = useEventListener(document, 'keydown', onKey)
stop()
```

### useTitle / useUrlSearchParams

```ts
import { useTitle, useUrlSearchParams } from '@vueuse/core'

// 双向绑定 document.title
const title = useTitle('初始标题')
title.value = '新标题'

// 也可传 getter，标题随依赖响应式更新
useTitle(() => `${unreadCount.value} 条未读 - 消息中心`)

// 双向绑定 URL 查询参数（history / hash / hash-params 三种模式）
const params = useUrlSearchParams('history')
params.page = '2'        // 写入即更新 URL ?page=2
console.log(params.keyword) // 读取当前 URL 参数
```

> 其他常用：`useFavicon`（动态图标）/ `useFullscreen`（全屏 API）/ `useMediaQuery`（媒体查询）/ `usePreferredDark`（系统暗色偏好）/ `useCssVar`（读写 CSS 变量）/ `usePermission`（权限查询）。

## Watch 增强

VueUse 在 Vue 原生 `watch` 之上提供了 11 个增强版——**返回 `stop` 函数**，签名与 `watch` 基本一致，但多了防抖 / 节流 / 暂停等能力。

### watchDebounced / watchThrottled

```ts
import { watchDebounced, watchThrottled } from '@vueuse/core'

// 防抖：搜索框停止输入 500ms 后才触发
watchDebounced(
  searchText,
  (val) => fetchResults(val),
  { debounce: 500, maxWait: 2000 }, // maxWait：最长等待，防止一直输入永不触发
)

// 节流：滚动 / resize 每 300ms 最多触发一次
watchThrottled(scrollY, (val) => updateProgress(val), { throttle: 300 })
```

### watchPausable —— 可暂停的 watch

```ts
import { watchPausable } from '@vueuse/core'

const { stop, pause, resume, isActive } = watchPausable(source, (val) => {
  console.log('变化', val)
})

pause()  // 暂停后，source 变化不再触发回调
resume() // 恢复
```

### watchIgnorable —— 可忽略的 watch

```ts
import { watchIgnorable } from '@vueuse/core'

const { ignoreUpdates } = watchIgnorable(source, () => {
  console.log('用户改的')
})

// 程序内部改值时，包在 ignoreUpdates 里 → 不触发 watch（避免回环）
ignoreUpdates(() => {
  source.value = '内部赋值'
})
```

### until —— 等待响应式条件成立

把「轮询等待某个状态」变成可 `await` 的 Promise：

```ts
import { until } from '@vueuse/core'

async function submit() {
  isLoading.value = true
  await doWork()
  // 等 isLoading 变成 false 再继续
  await until(isLoading).toBe(false)

  // 也支持 toBeTruthy / toBeNull / toMatch / changed / 超时
  await until(count).toMatch((n) => n > 10, { timeout: 5000 })
}
```

### whenever —— 值为真时执行

`watch` 的简写——只在值「为真」时触发回调：

```ts
import { whenever } from '@vueuse/core'

// 等价于 watch(isReady, (v) => { if (v) {...} })
whenever(isReady, () => {
  console.log('准备就绪，开始初始化')
})
```

> 其他：`watchOnce`（只触发一次后自动 stop）/ `watchAtMost`（最多触发 N 次）/ `watchTriggerable`（返回 `trigger()` 可手动触发）/ `watchDeep` / `watchImmediate`（预设 `deep` / `immediate` 的简写）。

## Reactivity 工具

### refDebounced / refThrottled —— 防抖 / 节流的 ref

不是包装 watch，而是**产出一个新 ref**，其值是源 ref 的防抖 / 节流副本：

```ts
import { ref } from 'vue'
import { refDebounced, refThrottled } from '@vueuse/core'

const input = ref('')
// debounced 滞后于 input 500ms 更新
const debounced = refDebounced(input, 500)

// 把 debounced 当作搜索条件的依赖
watchEffect(() => fetchResults(debounced.value))
```

### computedAsync —— 异步计算属性

`computed` 不能用异步函数；`computedAsync` 可以：

```ts
import { computedAsync } from '@vueuse/core'

const userId = ref(1)

const user = computedAsync(
  async () => {
    // userId 变化时自动重新计算
    const res = await fetch(`/api/users/${userId.value}`)
    return res.json()
  },
  null, // 计算完成前的初始值
)
```

### syncRef / syncRefs —— 双向 / 单向同步 ref

```ts
import { syncRef, syncRefs } from '@vueuse/core'

// 双向同步：改任意一个，另一个跟着变
const a = ref('a')
const b = ref('b')
syncRef(a, b, { direction: 'both' }) // 也可 'ltr' / 'rtl'

// 单源同步到多个目标
const source = ref(0)
syncRefs(source, [target1, target2])
```

### toReactive / reactify

```ts
import { toReactive, reactify } from '@vueuse/core'

// 把 ref<对象> 转成 reactive 对象（属性访问无需 .value）
const objRef = ref({ name: 'VueUse' })
const obj = toReactive(objRef)
console.log(obj.name) // 直接读

// reactify：把普通函数变成「参数 / 返回值都响应式」的函数
function add(a: number, b: number) { return a + b }
const reactiveAdd = reactify(add)
const sum = reactiveAdd(numA, numB) // numA / numB 变化，sum 自动重算
```

> 其他：`refAutoReset`（一段时间后自动恢复默认值，适合「复制成功」提示）/ `refDefault`（值为 null 时返回默认值）/ `reactivePick` / `reactiveOmit`（响应式地挑选 / 排除对象字段）/ `reactiveComputed`。

## Array 响应式数组

把 `Array.prototype` 方法包成响应式版本——源数组变化时结果 `computed` 自动重算：

```ts
import {
  useArrayFilter, useArrayMap, useArrayReduce,
  useArrayFind, useArrayEvery, useSorted,
} from '@vueuse/core'

const list = ref([1, 2, 3, 4, 5, 6])

const evens = useArrayFilter(list, (n) => n % 2 === 0)   // [2,4,6]
const doubled = useArrayMap(list, (n) => n * 2)          // [2,4,...]
const total = useArrayReduce(list, (acc, n) => acc + n, 0) // 21
const firstBig = useArrayFind(list, (n) => n > 3)        // 4
const allPositive = useArrayEvery(list, (n) => n > 0)    // true

// useSorted —— 响应式排序（不修改源数组）
const sorted = useSorted(list, (a, b) => b - a)          // 降序
```

## Time 时间

```ts
import { useDateFormat, useTimeAgo, useNow, useCountdown } from '@vueuse/core'

// 响应式日期格式化（类 dayjs 语法）
const now = useNow()
const formatted = useDateFormat(now, 'YYYY-MM-DD HH:mm:ss')

// 相对时间："5 分钟前" / "3 天前"，自动更新
const timeAgo = useTimeAgo(new Date('2026-05-20'))

// 倒计时
const { remaining, start, pause, reset } = useCountdown(60, {
  onComplete: () => console.log('结束'),
  onTick: () => console.log('每秒'),
})
```

## Utilities 通用工具

```ts
import {
  useToggle, useCounter, useDebounceFn, useThrottleFn,
  useEventBus, useCycleList, useStepper,
} from '@vueuse/core'

// useToggle —— 布尔切换
const [isOpen, toggleOpen] = useToggle(false)
toggleOpen()        // 取反
toggleOpen(true)    // 指定值

// useCounter —— 计数器（带边界）
const { count, inc, dec, set, reset } = useCounter(0, { min: 0, max: 10 })

// useDebounceFn / useThrottleFn —— 防抖 / 节流「函数」
const debouncedSave = useDebounceFn(() => save(), 1000)
const throttledScroll = useThrottleFn(() => onScroll(), 200)

// useEventBus —— 类型安全的全局事件总线
const bus = useEventBus<string>('notification')
bus.on((msg) => console.log(msg))   // 订阅（组件卸载自动取消）
bus.emit('hello')                   // 发布

// useCycleList —— 在列表中循环切换（轮播 / 主题切换）
const { state, next, prev, go } = useCycleList(['light', 'dark', 'auto'])
next() // 切到下一个，到末尾回到开头

// useStepper —— 多步表单 / 向导
const { current, next: nextStep, previous, isFirst, isLast, goTo } = useStepper([
  'account', 'profile', 'confirm',
])
```

> 其他：`useMemoize`（结果缓存）/ `useOffsetPagination`（分页计算）/ `useConfirmDialog`（确认对话框状态机）/ `useCloned`（深克隆 ref）/ `useBase64`（文件转 base64）/ `get` / `set`（读写可能是 ref 的值）。

## Component 组件辅助

### useVModel / useVModels —— 简化双向绑定

封装 `v-model` 的 props + emit 模板代码（Vue 3.4+ 有 `defineModel` 后，多用于库作者）：

```vue
<script setup lang="ts">
import { useVModel, useVModels } from '@vueuse/core'

const props = defineProps<{ modelValue: string; count: number }>()
const emit = defineEmits(['update:modelValue', 'update:count'])

// 单个 v-model —— 读写 data 自动 emit update:modelValue
const data = useVModel(props, 'modelValue', emit)

// 多个 v-model 一次性解构
const { modelValue, count } = useVModels(props, emit)
</script>
```

### createReusableTemplate —— 模板片段复用

在同一个组件内复用一段模板，又不想抽成单独文件：

```vue
<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{ label: string }>()
</script>

<template>
  <!-- 定义一次 -->
  <DefineTemplate v-slot="{ label }">
    <span class="badge">{{ label }}</span>
  </DefineTemplate>

  <!-- 多处复用 -->
  <ReuseTemplate label="新功能" />
  <ReuseTemplate label="热门" />
</template>
```

### useVirtualList —— 虚拟列表

万级数据流畅渲染：

```vue
<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

const allItems = Array.from({ length: 100000 }, (_, i) => `第 ${i + 1} 项`)

const { list, containerProps, wrapperProps } = useVirtualList(allItems, {
  itemHeight: 40,  // 固定行高（动态高度传函数）
  overscan: 10,    // 上下额外渲染的缓冲行数
})
</script>

<template>
  <div v-bind="containerProps" style="height: 400px">
    <div v-bind="wrapperProps">
      <div v-for="item in list" :key="item.index" style="height: 40px">
        {{ item.data }}
      </div>
    </div>
  </div>
</template>
```

> 其他：`templateRef`（模板引用，等价 `useTemplateRef`）/ `unrefElement`（从 ref / 组件实例取出真实 DOM）/ `useCurrentElement` / `useMounted`（是否已挂载的 ref）/ `tryOnMounted` / `tryOnScopeDispose`（无组件上下文也能安全调用的生命周期钩子）。

## @vueuse/components 无渲染组件

对于不方便写 `<script setup>` 的场景（如纯模板），`@vueuse/components` 把部分 composable 包成**无渲染组件**——通过作用域插槽暴露状态：

```vue
<script setup lang="ts">
import { UseMouse, OnClickOutside, UseDark } from '@vueuse/components'
</script>

<template>
  <!-- useMouse 的组件形态 -->
  <UseMouse v-slot="{ x, y }">
    鼠标位置：{{ x }}, {{ y }}
  </UseMouse>

  <!-- onClickOutside 的组件形态 -->
  <OnClickOutside :options="{ ignore: [] }" @trigger="open = false">
    <div class="modal">弹层内容</div>
  </OnClickOutside>

  <UseDark v-slot="{ isDark, toggleDark }">
    <button @click="toggleDark()">{{ isDark ? '暗色' : '亮色' }}</button>
  </UseDark>
</template>
```

> 何时用：组件形态对「只在模板里用一次、不想引入额外 script 逻辑」很方便；常规情况下**优先用函数形态**——更灵活、tree-shaking 更好。

## 10 个 add-on 概览

`@vueuse/core` 之外，VueUse 还有一组独立发布的 add-on——按需安装，避免给核心包塞入重依赖：

| Add-on | 安装包 | 用途 |
|---|---|---|
| **Router** | `@vueuse/router` | `useRouteQuery` / `useRouteParams` / `useRouteHash`——把路由参数当响应式 ref |
| **Integrations** | `@vueuse/integrations` | 集成第三方库：`useAxios` / `useCookies` / `useJwt` / `useQRCode` / `useFuse` / `useNProgress` / `useDrauu` / `useChangeCase` / `useFocusTrap` / `useSortable` / `useIDBKeyval` / `useAsyncValidator` |
| **Firebase** | `@vueuse/firebase` | `useAuth` / `useFirestore`——Firebase 响应式绑定 |
| **RxJS** | `@vueuse/rxjs` | `useObservable` / `from` / `toObserver`——RxJS 与 Vue 响应式互转 |
| **Electron** | `@vueuse/electron` | `useIpcRenderer` / `useZoomFactor`——Electron 渲染进程工具 |
| **Math** | `@vueuse/math` | `useMin` / `useMax` / `useClamp` / `useSum` / `useRound` / `useProjection`——响应式数学计算 |
| **Sound** | `@vueuse/sound` | `useSound`——基于 Howler.js 的音效播放 |
| **Motion** | `@vueuse/motion` | 声明式动画与过渡（独立大型库，也可单独用） |
| **Gesture** | `@vueuse/gesture` | 手势识别（拖拽 / 缩放 / 滑动） |
| **SchemaOrg** | `@vueuse/schema-org` | Schema.org 结构化数据（SEO） |

`@vueuse/router` 示例——把 query 参数当作可读写的 ref：

```ts
import { useRouteQuery } from '@vueuse/router'

// 双向绑定到 ?page=xxx，改 page.value 即 router.replace
const page = useRouteQuery('page', '1', { transform: Number })
page.value = 2 // URL 变为 ?page=2
```

`@vueuse/integrations` 示例——`useAxios`：

```ts
import { useAxios } from '@vueuse/integrations/useAxios'
import axios from 'axios'

const instance = axios.create({ baseURL: '/api' })
const { data, isLoading, error, execute } = useAxios('/users', instance)
```

> **重要**：add-on **必须单独安装**——`pnpm add @vueuse/core` 不会带上 `@vueuse/router`。漏装会报 `Cannot find module '@vueuse/router'`。

## 自动导入

VueUse 200+ 函数全靠手写 `import` 会很繁琐——配合自动导入插件，写下 `useStorage` 就能直接用。

### unplugin-auto-import（Vite / Webpack 通用）

```bash
pnpm add -D unplugin-auto-import
```

```ts
// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    AutoImport({
      imports: [
        'vue',
        '@vueuse/core',   // VueUse 核心函数全部自动导入
        // '@vueuse/math', // add-on 也可加入
      ],
      dts: 'src/auto-imports.d.ts', // 生成类型声明，保证 TS 提示
    }),
  ],
})
```

配好后无需 import 直接用：

```vue
<script setup lang="ts">
// 不写 import，useStorage / useDark 直接可用
const count = useStorage('count', 0)
const isDark = useDark()
</script>
```

> 记得把生成的 `auto-imports.d.ts` 加进 `tsconfig.json` 的 `include`，并在 `.eslintrc` / `eslint.config.js` 里配好（否则 ESLint 会报 `no-undef`）。

### @vueuse/nuxt（Nuxt 自动导入）

Nuxt 项目用官方模块，零配置自动导入：

```bash
pnpm add -D @vueuse/nuxt @vueuse/core
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vueuse/nuxt'],
})
```

```vue
<script setup lang="ts">
// Nuxt 组件内直接用，无需 import
const isDark = useDark()
const { x, y } = useMouse()
</script>
```

## SSR / Nuxt 完整方案

VueUse 对 SSR **友好**——大部分函数在服务端能安全调用（不会因为 `window` 未定义而崩溃），访问浏览器 API 的部分会在**客户端激活后**才真正生效。

### SSR 安全原则

```vue
<script setup lang="ts">
import { useWindowSize, useLocalStorage } from '@vueuse/core'

// ✅ SSR 安全：服务端返回默认值（如 width=Infinity），客户端 hydration 后取真实值
const { width, height } = useWindowSize()

// ✅ useStorage 在服务端读不到 localStorage，返回 defaults；客户端再同步
const theme = useLocalStorage('theme', 'light')
</script>
```

但**直接在 setup 顶层访问浏览器对象**仍然会崩——这不是 VueUse 的锅：

```ts
// ❌ 服务端没有 window，setup 顶层执行直接报错
const w = window.innerWidth

// ✅ 包进 onMounted（仅客户端执行）
import { onMounted, ref } from 'vue'
const w = ref(0)
onMounted(() => { w.value = window.innerWidth })
```

### initOnMounted —— 规避 hydration mismatch

`useStorage` 等函数：服务端渲染时用 `defaults`，客户端首帧若立刻读到 localStorage 的不同值，会导致 **hydration mismatch** 警告。开启 `initOnMounted` 让它**等组件挂载后再读 storage**，首帧与服务端保持一致：

```ts
import { useStorage } from '@vueuse/core'

const theme = useStorage('theme', 'light', undefined, {
  initOnMounted: true, // 挂载后才从 storage 初始化，避免 hydration mismatch
})
```

### Nuxt 中用 useDark

`useDark` 的暗色判断依赖 `localStorage` + 系统偏好——Nuxt 里建议配合 `ClientOnly` 或 `initOnMounted`，并在 `app.vue` 顶层调用一次：

```vue
<!-- app.vue -->
<script setup lang="ts">
import { useColorMode } from '@vueuse/core'

// 顶层调用一次，整站共享
useColorMode()
</script>

<template>
  <div>
    <!-- 依赖暗色状态的 UI 包进 ClientOnly，避免首屏闪烁 -->
    <ClientOnly>
      <ThemeToggle />
    </ClientOnly>
    <NuxtPage />
  </div>
</template>
```

## TypeScript 类型推导

VueUse 全量使用 TypeScript 编写，类型推导很强——大部分情况无需手动标注。

```ts
import { useStorage, useFetch, useToggle, useTimestamp } from '@vueuse/core'

// 1. useStorage 按默认值推断类型
const count = useStorage('count', 0)        // RemovableRef<number>
const name = useStorage('name', 'guest')    // RemovableRef<string>

// 2. 默认值是 null 时需显式泛型
interface User { id: number; name: string }
const user = useStorage<User | null>('user', null)

// 3. useFetch 用泛型标注 data 类型
const { data } = useFetch('/api/users').get().json<User[]>()
// data: Ref<User[] | null>

// 4. controls 选项影响返回类型 —— TS 自动区分
const ts = useTimestamp()                   // Ref<number>
const ctrl = useTimestamp({ controls: true }) // { timestamp: Ref<number>, pause, resume }

// 5. useToggle 返回元组，可解构重命名
const [visible, toggleVisible] = useToggle()
```

VueUse 导出了大量工具类型，写自己的 composable 时可复用：

```ts
import type { MaybeRef, MaybeRefOrGetter, RemovableRef, Fn } from '@vueuse/core'

// 遵循 VueUse 风格的参数约定
function useGreeting(name: MaybeRefOrGetter<string>) {
  return computed(() => `你好，${toValue(name)}`)
}
```

## 常见踩坑

### 坑 1：解构后丢失响应性

**现象**：从 VueUse 返回值里解构出的值，模板里不更新。

**原因**：通常不是 VueUse 的问题——VueUse 返回的对象属性是 **ref**，解构后仍是 ref、保持响应性。出问题往往是**把它当成 `props` / `reactive` 来解构了**，或解构后又 `.value` 取了原始值存进普通变量。

```ts
// ✅ 正确：x / y 解构出来仍是 ref
const { x, y } = useMouse()

// ❌ 错误：解构出 .value 存进普通变量，丢响应性
const { x } = useMouse()
const plainX = x.value // plainX 不会再变

// ❌ 错误：用 toRefs 之类二次处理 reactive 包裹后的结果
const mouse = reactive(useMouse()) // 这是对的
// 但 const { x } = mouse 解构 reactive 会丢响应性，应保留 mouse.x
```

### 坑 2：SSR 下 window / document 未定义

**现象**：Nuxt / SSR 项目报 `window is not defined` / `document is not defined`。

**原因**：在 setup 顶层直接访问了浏览器对象，或某函数在服务端就尝试读 DOM。

**修复**：

- 用 VueUse 的封装函数代替裸 API（`useWindowSize` 而非 `window.innerWidth`）——它们 SSR 安全
- 必须用裸 API 时包进 `onMounted`
- 用 `useStorage` / `useDark` 时开 `initOnMounted: true` 规避 hydration mismatch

### 坑 3：在没有组件上下文的地方调用

**现象**：在普通 JS 模块顶层 / 路由守卫 / setTimeout 回调里调用 `useMouse` 等，副作用不会被清理，或控制台报「`onUnmounted` is called when there is no active component instance」。

**原因**：VueUse 函数靠「当前组件实例」注册 `onUnmounted` 自动清理。脱离组件上下文时这套机制失效。

**修复**：

- 在 `<script setup>` / 其他 composable 内调用（最常见的正确位置）
- 确需在组件外用，包进 `effectScope()`，并自行管理 `scope.stop()`
- 用 `tryOnMounted` / `tryOnScopeDispose` 等 `try*` 函数——它们在无上下文时静默跳过而非报错

### 坑 4：useStorage 类型推断陷阱

**现象**：`useStorage('user', null)` 后，`user.value` 的类型是 `null`，没法赋值对象。

**原因**：默认值是 `null` 时，TS 只能推断出 `null` 类型，VueUse 也无法选对 serializer。

**修复**：显式传泛型 + 必要时指定 serializer：

```ts
import { useStorage, StorageSerializers } from '@vueuse/core'

const user = useStorage<User | null>('user', null, undefined, {
  serializer: StorageSerializers.object,
})
```

### 坑 5：add-on 未单独安装

**现象**：`import { useRouteQuery } from '@vueuse/router'` 报 `Cannot find module`。

**原因**：`@vueuse/router` / `@vueuse/integrations` 等是**独立的包**，安装 `@vueuse/core` 不会带上。

**修复**：

```bash
pnpm add @vueuse/router
pnpm add @vueuse/integrations   # useAxios / useCookies 等需要
```

### 坑 6：refetch 没开，响应式 URL 不重发

**现象**：`useFetch` 的 URL 是 ref，改了 URL 但没重新请求。

**原因**：`useFetch` 默认**不会**因 URL 变化而自动重发，需显式开 `refetch`。

**修复**：

```ts
const { data } = useFetch(url, { refetch: true })
```

### 坑 7：useDark 首屏闪烁（FOUC）

**现象**：刷新页面瞬间先显示亮色、再跳成暗色。

**原因**：JS 执行（VueUse 读 localStorage 切 class）发生在首屏渲染之后。

**修复**：在 `index.html` 的 `<head>` 里加一段**内联脚本**，在 VueUse 之前就把 class 设好：

```html
<script>
  // 在框架加载前同步设置主题，消除闪烁
  const stored = localStorage.getItem('vueuse-color-scheme')
  const isDark = stored === 'dark'
    || (!stored && matchMedia('(prefers-color-scheme: dark)').matches)
  if (isDark) document.documentElement.classList.add('dark')
</script>
```

### 坑 8：watch 增强版与原生 watch 混淆

**现象**：以为 `watchDebounced` 的第三个参数和 `watch` 完全一样。

**原因**：`watchDebounced` 的 options 在 `watch` 的 `{ immediate, deep, flush }` 之外，**多了 `debounce` / `maxWait`**；`watchThrottled` 多了 `throttle` / `trailing` / `leading`。漏传 `debounce` 就退化成普通 watch。

**修复**：明确传入增强选项：

```ts
watchDebounced(source, cb, { debounce: 500, maxWait: 2000, immediate: true })
```

## 下一步

学完指南后，可以查阅 [参考](./reference.md) 速查 API 细节：12 大分类完整函数列表 / 旗舰函数选项速查表 / 工具类型（MaybeRef / MaybeRefOrGetter / RemovableRef） / add-on 函数清单 / 自动导入配置模板。
