---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **VueHooks Plus v2.x**（npm 包 `vue-hooks-plus`，截至 2026 年 **v2.4.3**；要求 **Vue 3.2.25+**，**不支持 Vue 2**）。

## 速查

- 系统要求：**Vue 3.2.25+**（Vue 3 专用）+ 推荐 **TypeScript 5+**
- 包定位：**ahooks 风格的 Vue 3 Hooks 库**，以旗舰 `useRequest` 为核心，约 50+ hook，完全 Tree-shakeable
- 安装：`pnpm add vue-hooks-plus` / `npm i vue-hooks-plus`
- 整包导入：`import { useRequest } from 'vue-hooks-plus'`
- 单函数按需引入（体积更优）：`import useRequest from 'vue-hooks-plus/es/useRequest'`
- 旗舰用法：`const { data, loading, error, run } = useRequest(service)`
- 元组约定：State 类 hook 多返回 `[state, actions]`，如 `const [v, { toggle }] = useBoolean()`
- 副作用清理：`useEventListener` / `useInterval` 等随组件 unmount **自动清理**
- 自动导入：`unplugin-auto-import` + `@vue-hooks-plus/resolvers` 的 `VueHooksPlusResolver()`
- 在线 Playground：<https://inhiblabcore.github.io/vue-hooks-plus/>
- VS Code 扩展：`vscode-vue-hooks-plus`（编辑器内查文档）
- 国内镜像：`npm config set registry https://registry.npmmirror.com`

## VueHooks Plus 是什么

VueHooks Plus（npm 包 `vue-hooks-plus`）是由 **InhiblabCore** 维护的 **Vue 3 组合式函数库**，一句话定位是「**Vue 版的 ahooks**」——把 React 生态里 `ahooks` 那套「以 `useRequest` 为核心、覆盖业务高频场景的企业级 Hook 集合」搬到 Vue 3。它的灵魂是那个**插件化架构的旗舰 `useRequest`**：

```ts
import { useRequest } from 'vue-hooks-plus'

// 一行拿到一套完整的异步请求状态机
const { data, loading, error, run } = useRequest(getUserInfo)
```

理解 VueHooks Plus 必须先理解它的**核心定位**：

- **以请求为核心，不是浏览器 API 工具集**：`useRequest` 内建轮询 / 缓存（SWR）/ 重试 / 防抖 / 节流 / 聚焦刷新 / 依赖刷新——这是它区别于 VueUse 的杀手锏
- **ahooks 心智**：`useRequest` 的 Options / Result、`useBoolean` / `useToggle` / `useCounter` 的 `[state, actions]` 元组返回，**几乎与 React 的 ahooks 一致**
- **Vue 3 专用 + TS + SSR 友好 + Tree-shakeable**：要求 Vue 3.2.25+，类型完备，服务端渲染不崩，支持单函数按需引入
- **副作用自动清理**：DOM / 定时器类 hook 随组件 `unmount` 自动清理

### 与 ahooks / VueUse / TanStack Query 的区别

VueHooks Plus 经常被拿来与这三者比较，定位各有侧重：

| 维度 | VueHooks Plus | ahooks | VueUse | TanStack Query |
|---|---|---|---|---|
| 框架 | **Vue 3** | React | **Vue 3** | 多框架（含 Vue 适配） |
| 核心定位 | **ahooks 风格 · 以 `useRequest` 为核心** | React 企业级 Hook 集合 | 浏览器 API + 响应式工具集（200+） | **专业服务端状态管理** |
| 杀手锏 | `useRequest`（轮询/缓存/重试/SWR） | `useRequest` | `useMouse` / `useDark` / `useFetch` 等广度 | 缓存失效策略 + Devtools |
| 工具型 hook | 有（不如 VueUse 全） | 有 | **最全** | 无（专注请求） |
| 适合 | 从 ahooks 迁 Vue / 想轻量请求管理 | React 项目 | 几乎所有 Vue 3 项目 | 大型数据密集型应用 |

**含义**：VueHooks Plus 与 VueUse **互补而非替代**——VueUse 偏「通用浏览器 API + 响应式工具」（广度），VueHooks Plus 偏「以请求为核心的业务 Hook」（深度），很多项目两者同装；而当应用「以服务端数据为中心、需要精细缓存失效」时，TanStack Query 更专业，VueHooks Plus 则胜在「轻量 + 开箱即用 + ahooks 风格」。

### 与 React Hooks 库的对照

如果你来自 React 生态，可以直接类比：

| React 生态 | VueHooks Plus 对应 | 说明 |
|---|---|---|
| `ahooks` | **`vue-hooks-plus`** | 几乎是 ahooks 的 Vue 移植，API 心智一致 |
| ahooks `useRequest` | **`useRequest`** | 同名同结构（Options / Result 几乎一致） |
| ahooks `useBoolean` / `useToggle` | `useBoolean` / `useToggle` | 同样返回 `[state, actions]` 元组 |
| `useState` / `useRef` | Vue 的 `ref` / `reactive`（Vue 内置） | 基础响应式由框架本身提供 |

> **关键差异**：React Hook 受「Hook 规则」（不能在条件/循环里调用）约束；Vue composable **没有这类规则**，但**必须在 `setup` / `<script setup>` 同步执行期调用**才能挂上组件生命周期。

## 安装

### 创建 Vue 3 项目

如果**还没有 Vue 3 项目**，先创建一个：

```bash
pnpm create vue@latest
# 或：npm create vue@latest / yarn create vue / bun create vue@latest
```

### 安装 VueHooks Plus

```bash
pnpm add vue-hooks-plus
# 或：npm i vue-hooks-plus / yarn add vue-hooks-plus
```

> **版本要求**：`vue-hooks-plus` 要求 **Vue 3.2.25+**，**不支持 Vue 2**。

### 国内镜像加速

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm 用户同样需要**——pnpm 默认走 npm registry。

## 基本用法

### 约定一：整包导入 vs 单函数按需引入

两种导入方式都支持，按需引入对打包体积更友好：

```ts
// 方式 1：整包导入（写法简洁，配合 Tree-shaking 也只打包用到的）
import { useRequest, useBoolean } from 'vue-hooks-plus'

// 方式 2：单函数按需引入（显式只引入单个 hook 的实现）
import useRequest from 'vue-hooks-plus/es/useRequest'
```

### 约定二：useRequest 三件套（data / loading / error）

`useRequest` 接收一个**返回 Promise 的 service 函数**，默认**自动执行**，返回响应式的请求状态：

```vue
<script setup lang="ts">
import { useRequest } from 'vue-hooks-plus'

// service：一个返回 Promise 的异步函数
function getUserInfo(): Promise<{ name: string }> {
  return fetch('/api/user').then(res => res.json())
}

// 默认自动执行；data / loading / error 都是响应式 Ref
const { data, loading, error, run } = useRequest(getUserInfo)
</script>

<template>
  <p v-if="loading">加载中…</p>
  <p v-else-if="error">出错了：{{ error.message }}</p>
  <p v-else>你好，{{ data?.name }}</p>
  <button @click="run()">手动刷新</button>
</template>
```

> **手动触发**：传 `{ manual: true }` 后不自动执行，需调用 `run()` 才发起请求——常用于「点击按钮才提交表单」的场景。

### 约定三：State 类 hook 返回 [state, actions] 元组

这是从 ahooks 继承的标志性约定——状态类 hook 返回一个**二元组**：第一项是响应式状态，第二项是操作方法对象：

```vue
<script setup lang="ts">
import { useBoolean, useToggle, useCounter } from 'vue-hooks-plus'

// useBoolean：返回 [布尔状态, { toggle, set, setTrue, setFalse }]
const [open, { toggle, setTrue, setFalse }] = useBoolean(false)

// useToggle：在两个值之间切换，返回 [state, { toggle, set, setLeft, setRight }]
const [lang, { toggle: toggleLang }] = useToggle('zh', 'en')

// useCounter：带 min/max 边界的计数器，返回 [current, { inc, dec, set, reset }]
const [count, { inc, dec, reset }] = useCounter(0, { min: 0, max: 10 })
</script>

<template>
  <button @click="toggle()">{{ open ? '展开' : '收起' }}</button>
  <button @click="toggleLang()">语言：{{ lang }}</button>
  <button @click="dec()">-</button>
  <span>{{ count }}</span>
  <button @click="inc()">+</button>
  <button @click="reset()">重置</button>
</template>
```

### 约定四：副作用自动清理

DOM / 定时器类 hook 在组件 `unmount` 时**自动清理副作用**，无需手写 `onUnmounted`：

```vue
<script setup lang="ts">
import { useEventListener } from 'vue-hooks-plus'

// 组件卸载时这个监听自动移除——无需手动清理
useEventListener('resize', () => {
  console.log('窗口大小变了')
}, { target: window })
</script>
```

## 自动导入

每个文件都写 import 略显啰嗦。官方提供 `@vue-hooks-plus/resolvers`，配合 `unplugin-auto-import` 可在任意 `.vue` 里**直接调用 hook 而不写 import**。

### 安装插件

```bash
pnpm add -D unplugin-auto-import @vue-hooks-plus/resolvers
```

### vite.config.ts 配置

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { VueHooksPlusResolver } from '@vue-hooks-plus/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      // 自动导入 Vue / vue-router + VueHooks Plus 的所有 hook
      imports: ['vue', 'vue-router'],
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/, /\.md$/],
      // 生成 TS 类型声明，让 Volar 识别这些全局函数
      dts: 'src/auto-imports.d.ts',
      resolvers: [VueHooksPlusResolver()],
    }),
  ],
})
```

### webpack 配置

```js
const { VueHooksPlusResolver } = require('@vue-hooks-plus/resolvers')

module.exports = {
  plugins: [
    require('unplugin-auto-import/webpack')({
      imports: ['vue', 'vue-router'],
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/, /\.md$/],
      dts: 'src/auto-imports.d.ts',
      resolvers: [VueHooksPlusResolver()],
    }),
  ],
}
```

配置后，`.vue` 里**无需 import 即可直接使用**：

```vue
<script setup lang="ts">
// 没有任何 import —— useRequest 和 ref 都由 unplugin-auto-import 自动注入
const { data, loading } = useRequest(() => fetch('/api/user').then(r => r.json()))
const count = ref(0)
</script>
```

> 生成的 `src/auto-imports.d.ts` **建议提交到仓库**——避免 CI 首次构建报 TS 错误。

## 第一个 VueHooks Plus 应用

下面用一个 `.vue` 综合演示三个 hook——`useRequest`（请求）、`useBoolean`（布尔开关）、`useLocalStorageState`（响应式本地存储）：

```vue
<template>
  <div class="demo">
    <h1>第一个 VueHooks Plus 应用</h1>

    <!-- useRequest：请求状态机 -->
    <section>
      <h2>1. 用户信息（useRequest）</h2>
      <p v-if="loading">加载中…</p>
      <p v-else-if="error">出错：{{ error.message }}</p>
      <p v-else>用户：{{ data?.name }}</p>
      <button @click="run()">刷新</button>
    </section>

    <!-- useBoolean：折叠开关 -->
    <section>
      <h2>2. 折叠面板（useBoolean）</h2>
      <button @click="toggle()">{{ open ? '收起' : '展开' }}</button>
      <p v-if="open">这是折叠内容。</p>
    </section>

    <!-- useLocalStorageState：刷新后保留 -->
    <section>
      <h2>3. 草稿（useLocalStorageState）</h2>
      <input :value="draft" @input="onInput" placeholder="输入后刷新页面仍在" />
      <p>已保存：{{ draft }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRequest, useBoolean, useLocalStorageState } from 'vue-hooks-plus'

// 1. useRequest —— data / loading / error 三件套，默认自动执行
const { data, loading, error, run } = useRequest<{ name: string }>(
  () => fetch('/api/user').then(res => res.json()),
)

// 2. useBoolean —— 返回 [布尔状态, { toggle, ... }]
const [open, { toggle }] = useBoolean(false)

// 3. useLocalStorageState —— [state, setState]，值变化自动写 localStorage，刷新自动读回
const [draft, setDraft] = useLocalStorageState<string>('demo-draft', {
  defaultValue: '',
})

function onInput(e: Event) {
  setDraft((e.target as HTMLInputElement).value)
}
</script>

<style scoped>
.demo { padding: 24px; font-family: sans-serif; }
section { margin: 16px 0; }
</style>
```

**这个示例覆盖**：

- `useRequest(service)`：返回 `data` / `loading` / `error` / `run`——默认自动执行，`run()` 手动刷新
- `useBoolean(false)`：返回 `[state, { toggle, setTrue, setFalse }]` 元组——典型的 ahooks 风格
- `useLocalStorageState('key', { defaultValue })`：返回 `[state, setState]`，值变化**自动写入 localStorage**、刷新页面**自动读回**——天然持久化（调用 `setState(undefined)` 可清除）

## SSR 友好

VueHooks Plus 在服务端渲染（Nuxt / Vite SSR）环境下做了环境判断与降级，**不会因访问 `window` / `document` 而崩溃**，官方提供 Nuxt 3 示例工程：

```vue
<script setup lang="ts">
import { useLocalStorageState } from 'vue-hooks-plus'

// SSR 时安全降级为 defaultValue；客户端 hydration 后再读 localStorage
const [theme] = useLocalStorageState('theme', { defaultValue: 'light' })
</script>
```

> **注意 hydration mismatch**：依赖浏览器环境的值在 SSR 阶段拿到的是默认值，hydration 后才更新——若该值参与首屏渲染，需留意 Vue 的 hydration 不一致警告。

## TypeScript

VueHooks Plus **100% 用 TypeScript 编写**，无需额外 `@types/*`。`useRequest` 会**根据 service 的返回类型自动推导 `data`**、根据 service 的参数推导 `run` 的入参：

```vue
<script setup lang="ts">
import { useRequest } from 'vue-hooks-plus'

interface User { id: number; name: string }

// service 返回 Promise<User> —— data 自动推导为 Readonly<Ref<User | undefined>>
async function getUser(id: number): Promise<User> {
  return fetch(`/api/user/${id}`).then(r => r.json())
}

const { data, run } = useRequest(getUser, {
  manual: true,           // 手动触发
  defaultParams: [1],     // 类型必须匹配 getUser 的参数 [number]
})

// run 的入参类型由 getUser 推导 —— run('abc') 会 TS 报错
run(2)
</script>
```

## 下一步

到这里你已经会安装 VueHooks Plus、掌握「整包/按需导入、`useRequest` 三件套、`[state, actions]` 元组、副作用自动清理」四大核心约定了——下一步深入：

- [指南](./guide-line.md)：**旗舰 `useRequest` 全选项深度**（`manual` / `defaultParams` / `ready` / `refreshDeps` / `loadingDelay` / `pollingInterval` 轮询 / `debounceWait` / `throttleWait` / `refreshOnWindowFocus` 聚焦刷新 / `cacheKey` + `staleTime` SWR 缓存 / `retryCount` 重试 / `mutate` 乐观更新 / `run` vs `runAsync` vs `refresh` / `use` 中间件） / **State 类** / **Effect 类** / **DOM 类** / **Scene 类**（`useVirtualList` / `useInfiniteScroll` / `useWebSocket`） / **Advanced 调试 hook** / **常见踩坑**（轮询与防抖叠加、SSR、与 VueUse 同装取舍）
