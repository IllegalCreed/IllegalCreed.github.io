---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **VueUse v14.x**（截至 2026 年 **v14.3.0**；要求 **Vue 3.5+**，**不支持 Vue 2**——Vue 2 项目需停留在 VueUse v11.x）。

## 速查

- 系统要求：**Vue 3.5+**（v14 起）+ **Node 18+** + 推荐 **TypeScript 5+**
- 包定位：**组合式函数库**（提供逻辑、不渲染 UI），200+ composable，完全 Tree-shakeable
- 安装：`pnpm add @vueuse/core` / `npm i @vueuse/core` / `yarn add @vueuse/core`
- 基本用法：`import { useMouse } from '@vueuse/core'` → `const { x, y } = useMouse()`
- 去 `.value`：`const mouse = reactive(useMouse())` → 模板/脚本里直接 `mouse.x`
- 副作用清理：composable 随组件 unmount **自动清理**；部分函数返回 `stop` 句柄手动停止
- 批量管理：`effectScope()` + `scope.run(() => {...})` + `scope.stop()` 一次性销毁多个 composable
- 响应式参数：参数接受 `MaybeRef` / `MaybeRefOrGetter`——普通值 / `ref` / `computed` / `() => x` getter 都能传
- 自动导入：`unplugin-auto-import` 配 `@vueuse/core` preset，免写 `import`
- Nuxt：`npx nuxt module add vueuse` + `modules: ['@vueuse/nuxt']`——全应用自动导入
- 主包：`@vueuse/core`；add-on：`@vueuse/router` / `@vueuse/integrations` / `@vueuse/math` / `@vueuse/motion` 等 10 个
- 无渲染组件：`@vueuse/components`，模板里 `<UseMouse v-slot="{ x, y }">`
- CDN：`<script src="https://unpkg.com/@vueuse/shared">` + `<script src="https://unpkg.com/@vueuse/core">` → `window.VueUse`
- 国内镜像：`npm config set registry https://registry.npmmirror.com`

## VueUse 是什么

VueUse 是由 **Anthony Fu**（Vue / Vite / Nuxt 核心团队成员）发起、社区共同维护的 **Vue 3 组合式函数（composable）库**。它**不渲染任何 UI**，而是把「与浏览器交互的有状态逻辑」封装成可直接 `import` 的函数：

```ts
import { useMouse } from '@vueuse/core'

// 一行拿到响应式的鼠标坐标——随组件卸载自动清理监听
const { x, y } = useMouse()
```

理解 VueUse 必须先理解它的**核心定位**：

- **逻辑库，不是 UI 库**：VueUse 提供 `useMouse` / `useDark` / `useFetch` 这类「逻辑积木」，**不提供按钮、表格、对话框**——视觉部分仍交给 Element Plus / Naive UI / Arco Design Vue
- **深度绑定 Vue 响应式系统**：返回的都是 `ref` / `computed`，参数也能接受 `ref`——天然与 Vue 的 `watch` / 模板联动
- **副作用自动清理**：composable 内部的事件监听、定时器随组件 `unmount` 自动移除——消除最常见的内存泄漏 Bug
- **Tree-shakeable + TS + SSR 友好**：按需打包、类型完备、服务端渲染不崩
- **截至 2026 年的 v14.x**：处于「成熟稳定期」——GitHub 22k+ Star、npm 周下载数百万、几乎是 Vue 3 项目的事实标准工具库

### 与 lodash / RxJS 等工具库的区别

VueUse 经常被拿来与 lodash、RxJS 比较，但三者定位**完全不同**：

| 维度 | VueUse | lodash | RxJS |
|---|---|---|---|
| 核心能力 | **Vue 响应式 composable** | 纯数据工具函数 | 通用响应式流（Observable） |
| 是否响应式 | **是**（返回 ref / computed） | 否（纯函数、无状态） | 是（但非 Vue 响应式） |
| 是否绑定 Vue | **深度绑定**（用 Vue 响应式 API） | 与框架无关 | 与框架无关 |
| 副作用清理 | **随组件卸载自动清理** | 无副作用 | 需手动 `unsubscribe` |
| 典型用途 | `useMouse` / `useDark` / `useFetch` | `debounce` / `cloneDeep` / `groupBy` | 复杂事件流编排 |
| 在 Vue 项目 | **首选** | 仍可能用于纯数据处理 | 复杂流场景的补充 |

**含义**：VueUse 解决的是「**与浏览器交互 + 通用模式的有状态逻辑**」的重复劳动，是 Vue 项目的首选工具库；纯数据处理（深拷贝、集合操作）仍可能用到 lodash；只有复杂事件流编排才需要 RxJS（VueUse 还提供 `@vueuse/rxjs` add-on 做桥接）。

### 与 React Hooks 库的对照

如果你来自 React 生态，可以这样类比：

| React 生态 | VueUse 对应 | 说明 |
|---|---|---|
| `react-use` | **`@vueuse/core`** | 都是「框架核心团队风格的 Hook / composable 集合」 |
| `ahooks` | `@vueuse/core` | 企业级 Hook 集合的同类定位 |
| `useState` / `useRef` | Vue 的 `ref` / `reactive`（Vue 内置，非 VueUse） | 基础响应式由框架本身提供 |
| `useEffect` 清理函数 | VueUse 的**自动清理** + `stop` 句柄 | VueUse 默认帮你清，不用手写返回函数 |
| `useDebounce`（react-use） | `useDebounceFn` / `refDebounced` | 命名几乎一致 |
| `useLocalStorage`（react-use） | `useLocalStorage` / `useStorage` | 命名几乎一致 |

> **关键差异**：React Hook 受「Hook 规则」（不能在条件 / 循环里调用）约束；Vue composable **没有这类规则**，但**必须在 `setup` / `<script setup>` 同步执行期调用**才能挂上组件生命周期。

## 安装

### 创建 Vue 3 项目

如果**还没有 Vue 3 项目**，先创建一个：

```bash
pnpm create vue@latest
# 或：npm create vue@latest / yarn create vue / bun create vue@latest
```

交互式菜单建议都选 **Yes**（TypeScript / Router / Pinia / ESLint / Vitest）：

```
Add TypeScript? ... Yes
Add JSX Support? ... No
Add Vue Router for Single Page Application development? ... Yes
Add Pinia for state management? ... Yes
Add Vitest for Unit Testing? ... Yes
Add ESLint for code quality? ... Yes
```

> 完成后已有完整 Vue 3 + TS 项目骨架——下一步**单独装 VueUse**。

### 安装 VueUse

VueUse 的主包是 `@vueuse/core`，绝大多数 composable 都在里面：

```bash
# 主包（200+ composable 都在这里）
pnpm add @vueuse/core
```

按需安装的扩展包（add-on，**用到才装**）：

| 包名 | 用途 | 何时需要 |
|---|---|---|
| `@vueuse/core` | 主包，200+ composable | **必需** |
| `@vueuse/router` | `useRouteQuery` / `useRouteParams`（与 Vue Router 同步） | 用到路由响应式时 |
| `@vueuse/integrations` | 封装 axios / cookie-es / fuse.js / jwt-decode / qrcode 等 | 用到对应第三方库时 |
| `@vueuse/math` | `useClamp` / `useSum` / `useMax` 等数学 composable | 需要响应式数学计算时 |
| `@vueuse/motion` | 声明式动画 / 过渡 | 需要动画时 |
| `@vueuse/components` | 把 composable 包装成无渲染组件 | 偏好模板写法时 |
| `@vueuse/nuxt` | Nuxt 模块，全应用自动导入 | Nuxt 项目 |

> VueUse 还有 `@vueuse/rxjs` / `@vueuse/firebase` / `@vueuse/electron` / `@vueuse/head` / `@vueuse/sound` / `@vueuse/schema-org` 等 add-on，按需安装即可。

### Vue 版本要求

| Vue 版本 | VueUse 版本 |
|---|---|
| **Vue 3.5+** | **VueUse v14.x**（最新，推荐） |
| Vue 3.0 – 3.4 | VueUse v12.x – v13.x |
| Vue 2.x | **VueUse v11.x**（v12.0 起不再支持 Vue 2） |

> 自 **v12.0 起 VueUse 不再支持 Vue 2**，**v14 起要求 Vue 3.5+**——升级前务必先核对 Vue 版本。

### 国内镜像加速

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm 用户同样需要**——pnpm 默认走 npm registry。

## 基本用法

VueUse 的用法极简——`import` 一个函数、调用它、用返回值。但有几个**核心约定**必须先掌握。

### 约定一：函数返回 ref 对象，可解构

VueUse 的 composable 通常返回**一个由多个 `ref` 组成的对象**，可用 ES6 解构语法取出：

```vue
<script setup lang="ts">
import { useMouse } from '@vueuse/core'

// 返回的对象里 x、y 都是 Ref<number>
const { x, y } = useMouse()

// 在 <script> 中访问需要 .value
console.log(x.value, y.value)
</script>

<template>
  <!-- 模板里 ref 自动解包，无需 .value -->
  <p>鼠标位置：{{ x }}, {{ y }}</p>
</template>
```

### 约定二：用 reactive() 一次性去掉 .value

如果觉得到处写 `.value` 麻烦，可以用 Vue 的 `reactive()` 包裹返回对象——内部 `ref` 会被自动解包：

```vue
<script setup lang="ts">
import { useMouse } from '@vueuse/core'
import { reactive } from 'vue'

// reactive() 包裹后，访问属性不再需要 .value
const mouse = reactive(useMouse())

console.log(mouse.x, mouse.y) // 直接访问，无 .value
</script>

<template>
  <p>鼠标位置：{{ mouse.x }}, {{ mouse.y }}</p>
</template>
```

> **选哪种**：解构（`const { x, y }`）适合只用其中几个值的场景；`reactive()` 包裹适合把整组状态当一个对象传递的场景——两种都对，看习惯。

### 约定三：副作用自动清理

VueUse 的 composable 在组件 `unmount` 时**自动清理副作用**（事件监听、定时器、Observer）——和 Vue 的 `watch` 一样，**你不需要手写 `onUnmounted`**：

```vue
<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

// 组件卸载时，这个 mousemove 监听会被自动移除——无需手动清理
useEventListener('mousemove', (e) => {
  console.log(e.clientX, e.clientY)
})
</script>
```

### 约定四：部分函数返回 stop 句柄

有些 composable 额外返回一个 `stop` 函数，让你**在组件卸载前就主动停止**：

```vue
<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

const stop = useEventListener('mousemove', () => {
  console.log('moving...')
})

// 满足某条件后提前停止监听（不必等组件卸载）
function done() {
  stop()
}
</script>
```

### 约定五：effectScope 批量管理

如果一处创建了多个 composable，想**一次性全部销毁**，用 Vue 的 `effectScope`：

```ts
import { useEventListener, useIntervalFn } from '@vueuse/core'
import { effectScope } from 'vue'

const scope = effectScope()

scope.run(() => {
  // 在 scope 内创建的所有 composable 副作用都被它收集
  useEventListener('mousemove', () => {})
  useIntervalFn(() => {}, 1000)
})

// 一行销毁 scope 内所有 composable
scope.stop()
```

## 自动导入

每个文件都写 `import { useMouse, useDark } from '@vueuse/core'` 略显啰嗦。VueUse 提供 preset 配合 `unplugin-auto-import`，可在任意 `.vue` 里**直接调用 composable 而不写 import**。

### 安装插件

```bash
pnpm add -D unplugin-auto-import
```

### vite.config.ts 配置

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      // 自动导入 Vue 的 ref/computed/watch + VueUse 的所有 composable
      imports: [
        'vue',
        '@vueuse/core',
      ],
      // 生成 TS 类型声明文件，让 Volar 识别这些全局函数
      dts: 'src/auto-imports.d.ts',
    }),
  ],
})
```

配置后，`.vue` 里**无需 import 即可直接使用**：

```vue
<script setup lang="ts">
// 没有任何 import —— useMouse 和 ref 都由 unplugin-auto-import 自动注入
const { x, y } = useMouse()
const count = ref(0)
</script>

<template>
  <p>{{ x }}, {{ y }} —— {{ count }}</p>
</template>
```

> 生成的 `src/auto-imports.d.ts` **建议提交到仓库**——避免 CI 首次构建时报 TS 错误。

### @vueuse/nuxt（Nuxt 项目）

Nuxt 项目无需手动配 `unplugin-auto-import`——直接用官方 Nuxt 模块：

```bash
# 安装并自动写入 nuxt.config.ts
npx nuxt@latest module add vueuse
```

或手动配置 `nuxt.config.ts`：

```ts
export default defineNuxtConfig({
  modules: [
    '@vueuse/nuxt',
  ],
})
```

配置后，**整个 Nuxt 应用**的 `.vue` 与 `composables/` 里都能直接用 VueUse 函数，无需 import：

```vue
<script setup lang="ts">
// Nuxt + @vueuse/nuxt —— 全自动导入
const { x, y } = useMouse()
const isDark = useDark()
</script>
```

## 第一个 VueUse 应用

下面用一个 `.vue` 文件综合演示四个旗舰 composable——`useMouse`（鼠标坐标）、`useDark`（暗色模式）、`useStorage`（本地存储）、`useClipboard`（剪贴板）：

```vue
<template>
  <div :class="{ dark: isDark }" class="demo">
    <h1>第一个 VueUse 应用</h1>

    <!-- useMouse：实时鼠标坐标 -->
    <section>
      <h2>1. 鼠标坐标（useMouse）</h2>
      <p>X：{{ x }} ，Y：{{ y }}</p>
    </section>

    <!-- useDark + useToggle：暗色模式切换 -->
    <section>
      <h2>2. 暗色模式（useDark + useToggle）</h2>
      <button @click="toggleDark()">
        当前：{{ isDark ? '🌙 暗色' : '☀️ 亮色' }}（点击切换）
      </button>
    </section>

    <!-- useStorage：响应式本地存储（刷新后保留） -->
    <section>
      <h2>3. 本地存储（useStorage）</h2>
      <input v-model="userName" placeholder="输入名字，刷新页面后仍在" />
      <p>已保存的名字：{{ userName }}</p>
    </section>

    <!-- useClipboard：剪贴板读写 -->
    <section>
      <h2>4. 剪贴板（useClipboard）</h2>
      <button :disabled="!isSupported" @click="copy(textToCopy)">
        {{ copied ? '已复制！' : '复制文本' }}
      </button>
      <p v-if="!isSupported">当前浏览器不支持剪贴板 API</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  useClipboard,
  useDark,
  useMouse,
  useStorage,
  useToggle,
} from '@vueuse/core'

// 1. useMouse —— 返回响应式的 x / y 坐标，监听随组件卸载自动清理
const { x, y } = useMouse()

// 2. useDark —— 可写计算属性，自动同步 localStorage + 系统主题 + DOM class
const isDark = useDark()
// useToggle —— 传入一个 ref，返回切换函数
const toggleDark = useToggle(isDark)

// 3. useStorage —— 响应式本地存储，值变化自动写入 localStorage，刷新后自动读回
const userName = useStorage('demo-user-name', '')

// 4. useClipboard —— 剪贴板读写，copied 在复制后短暂为 true，isSupported 做能力探测
const textToCopy = 'Hello VueUse!'
const { copy, copied, isSupported } = useClipboard()
</script>

<style scoped>
.demo {
  padding: 24px;
  font-family: sans-serif;
}
.demo.dark {
  background: #1a1a1a;
  color: #f0f0f0;
}
section {
  margin: 16px 0;
}
</style>
```

**这个示例覆盖**：

- `useMouse()`：返回 `{ x, y }` 响应式坐标——内部的 `mousemove` 监听**随组件卸载自动清理**
- `useDark()` + `useToggle()`：`useDark` 返回可写 `computed`（写它会改 DOM class + 写 localStorage），`useToggle` 把它包成切换函数
- `useStorage('key', default)`：返回一个 `ref`，值变化**自动写入 localStorage**、刷新页面**自动读回**——天然持久化
- `useClipboard()`：返回 `copy` 方法、`copied` 状态、`isSupported` 能力探测——**`isSupported` 模式**的典型用法
- 所有 composable**没有一行手动清理代码**——VueUse 全部代办

## 响应式参数约定（精髓）

VueUse 最强大、也是新人最容易困惑的设计：**composable 的参数普遍能接受多种形态**——普通值、`ref`、`computed`、甚至 getter 函数。这是 VueUse 区别于普通工具库的精髓。

### MaybeRef 与 MaybeRefOrGetter

VueUse 的参数类型常见两种：

```ts
// MaybeRef<T> —— 普通值 或 ref 都行
type MaybeRef<T> = T | Ref<T>

// MaybeRefOrGetter<T> —— 普通值、ref、或 () => T getter 都行
type MaybeRefOrGetter<T> = T | Ref<T> | (() => T)
```

以 `useTitle`（控制 `document.title`）为例，三种传参都合法：

```ts
import { useTitle } from '@vueuse/core'
import { computed, ref } from 'vue'

// 形态 1：传普通字符串
const title = useTitle('Hello')
title.value = 'New Title' // 之后改返回的 ref

// 形态 2：传一个 computed —— title 跟着 computed 变
const isDark = ref(false)
const computedTitle = computed(() =>
  isDark.value ? '🌙 晚上好' : '☀️ 早上好',
)
useTitle(computedTitle)

// 形态 3：传一个 getter 函数（VueUse 9.0+）—— 最简洁
useTitle(() => (isDark.value ? '🌙 晚上好' : '☀️ 早上好'))
```

### toValue：统一解包的秘密

VueUse 内部之所以能「随便你传什么」，靠的是 Vue 内置的 `toValue()`——它把**值 / ref / getter 统一解包成普通值**：

```ts
import { toValue } from 'vue'

toValue(1) //          → 1        （普通值原样返回）
toValue(ref(2)) //     → 2        （ref 取 .value）
toValue(() => 3) //    → 3        （getter 调用取返回值）
```

自己写 composable 时遵循同一约定，就能无缝融入 VueUse 生态：

```ts
import { type MaybeRefOrGetter, toValue, watchEffect } from 'vue'

/**
 * 自定义 composable —— 参数接受 值 / ref / getter 三种形态
 * @param count 计数值（可响应式）
 */
function useDouble(count: MaybeRefOrGetter<number>) {
  watchEffect(() => {
    // toValue 统一解包，无论调用方传的是什么
    console.log('double =', toValue(count) * 2)
  })
}
```

> **理解这一点 = 理解 VueUse**：你看到 VueUse 文档里某个参数标 `MaybeRefOrGetter`，就知道可以「传死值、也可以传 `ref` 让它响应式联动、也可以传 `() => x.value` getter」——这套约定贯穿全库。

## SSR 友好

VueUse 在服务端渲染（Nuxt / Vite SSR）环境下**不会因访问 `window` / `document` 而崩溃**——内部做了环境判断与降级：

```vue
<script setup lang="ts">
import { useLocalStorage, useMouse } from '@vueuse/core'

// SSR 时 window 不存在，VueUse 内部会安全降级；
// 客户端 hydration 后再开始真正工作
const { x, y } = useMouse()
const store = useLocalStorage('ssr-key', { name: 'Apple' })
</script>
```

注意事项：

- **服务端首屏与客户端可能不一致**：`useMouse` / `useLocalStorage` 等依赖浏览器环境的值，在 SSR 阶段拿到的是默认值，hydration 后才更新——若该值参与首屏渲染，需注意 **hydration mismatch** 警告
- **`configurableWindow` 注入**：访问浏览器 API 的 composable 支持传入自定义 `window` / `document`（用于 iframe 或单测）：

  ```ts
  import { useMouse } from '@vueuse/core'

  // 监听父窗口 / iframe 的鼠标
  const parentMouse = useMouse({ window: window.parent })

  // 单元测试时传入 mock
  const mockWindow = { /* ... */ } as Window
  const { x } = useMouse({ window: mockWindow })
  ```

- **Nuxt 项目**：用 `@vueuse/nuxt` 模块，SSR 兼容已内置处理，直接用即可

## TypeScript

VueUse **100% 用 TypeScript 编写**，无需安装额外 `@types/*`，所有返回值与选项都有完整类型推导：

```vue
<script setup lang="ts">
import { useMouse, useStorage } from '@vueuse/core'

// x、y 自动推导为 Ref<number>
const { x, y } = useMouse()

// 泛型决定存储值的类型 —— settings 推导为 Ref<{ theme: string; fontSize: number }>
const settings = useStorage('app-settings', {
  theme: 'light',
  fontSize: 14,
})

settings.value.fontSize = 16   // ✅ number，类型正确
// settings.value.fontSize = '大'  // ❌ TS 报错：不能把 string 赋给 number
</script>
```

常用响应式工具类型（编写自己的 composable 时会用到）：

| 类型 | 含义 |
|---|---|
| `MaybeRef<T>` | `T \| Ref<T>`——值或 ref |
| `MaybeRefOrGetter<T>` | `T \| Ref<T> \| (() => T)`——值、ref 或 getter |
| `Fn` | `() => void`——无参回调 |
| `ConfigurableWindow` | `{ window?: Window }`——可注入 window 的选项 |
| `ConfigurableDocument` | `{ document?: Document }`——可注入 document 的选项 |

## 与 Vue Router + Pinia 配合

VueUse 与 Vue Router、Pinia 一起使用零冲突，且能互相增强。

### 与 Vue Router 配合（@vueuse/router）

`@vueuse/router` 这个 add-on 提供把**路由 query / params 当响应式 ref** 用的 composable：

```bash
pnpm add @vueuse/router
```

```vue
<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'

// 把 URL 的 ?page=1 变成一个可读可写的 ref
// 改 page.value 会自动更新 URL，刷新页面后从 URL 读回
const page = useRouteQuery('page', '1', { transform: Number })

function nextPage() {
  page.value++ // URL 自动变成 ?page=2
}
</script>

<template>
  <p>当前页：{{ page }}</p>
  <button @click="nextPage">下一页</button>
</template>
```

### 与 Pinia 配合

VueUse 的 composable 可以直接在 Pinia 的 setup store 里调用——`useStorage` 让 store 状态天然持久化：

```ts
import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

/**
 * 用户偏好 store —— 借助 useStorage 实现自动持久化
 */
export const usePreferenceStore = defineStore('preference', () => {
  // 直接用 useStorage 作为 state —— 改了自动写 localStorage，刷新自动读回
  const language = useStorage('pref-language', 'zh-CN')
  const fontSize = useStorage('pref-font-size', 14)

  /** 切换语言 */
  function setLanguage(lang: string) {
    language.value = lang
  }

  return { language, fontSize, setLanguage }
})
```

> `createGlobalState`（VueUse 自带）也能做「跨组件共享的全局状态」，适合不想引入 Pinia 的轻量场景；需要 devtools、插件、模块化时仍推荐 Pinia。

## CDN 引入（无构建场景）

不用 Vite / Webpack 时（如 HTML demo / 旧项目），可通过 CDN 引入——VueUse 会挂在 `window.VueUse` 上：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <script src="https://unpkg.com/vue@3"></script>
  <!-- VueUse 依赖 shared 包，必须先引入 -->
  <script src="https://unpkg.com/@vueuse/shared"></script>
  <script src="https://unpkg.com/@vueuse/core"></script>
</head>
<body>
  <div id="app">
    <p>鼠标位置：{{ x }}, {{ y }}</p>
  </div>

  <script>
    const { createApp } = Vue
    // 所有 composable 挂在 window.VueUse 上
    const { useMouse } = VueUse

    createApp({
      setup() {
        const { x, y } = useMouse()
        return { x, y }
      },
    }).mount('#app')
  </script>
</body>
</html>
```

> **生产环境锁版本**：将 `https://unpkg.com/@vueuse/core` 换成 `https://unpkg.com/@vueuse/core@14.3.0`——否则 unpkg 默认 latest、未来升级可能破坏页面。

## 下一步

到这里你已经会安装 VueUse、掌握「解构 ref / `reactive()` 去 `.value` / 自动清理 / 响应式参数」四大核心约定了——下一步深入：

- [指南](./guide-line.md)：**12 大分类 200+ composable 系统速览**（State / Elements / Browser / Sensors / Network / Animation / Component / Watch / Reactivity / Array / Time / Utilities） / **State 深度**（`useStorage` 序列化器 / `useRefHistory` 撤销重做 / `createGlobalState`） / **Sensors 深度**（`useMouse` / `useScroll` / `onClickOutside` / `useElementVisibility`） / **Network 深度**（`useFetch` 链式 API + 中止 + 重试 / `useWebSocket` 心跳重连） / **Watch 增强**（`watchDebounced` / `watchThrottled` / `until` / `watchPausable`） / **`controls` / `isSupported` / `configurableWindow` 约定深挖** / **`@vueuse/components` 无渲染组件** / **add-on 详解** / **SSR + Nuxt 完整方案** / **常见踩坑**
- [参考](./reference.md)：**API 速查** / 12 大分类常用 composable 列表 / 高频函数签名速查表 / 响应式工具类型 / `controls` / `isSupported` 选项对照 / add-on 包列表 / `@vueuse/components` 无渲染组件清单
