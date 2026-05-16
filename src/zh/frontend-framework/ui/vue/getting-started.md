---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vue 3.5.x 编写

## 速查

- 系统要求：Node.js **18.3+**（Vite 7 要求 20.19+ / 22.12+）
- 创建：`pnpm create vue@latest` —— 官方脚手架（Vite 内核 + 交互式选 TS / Router / Pinia / Vitest / ESLint / Prettier）
- 启动：`pnpm dev`（默认 `http://localhost:5173`）
- 入口：`main.ts` 调 `createApp(App).mount('#app')`
- SFC：`<template>` + `<script setup lang="ts">` + `<style scoped>`
- 核心响应式：`ref` / `reactive` / `computed` / `watch`
- 模板语法：<span v-pre>`{{ exp }}`</span> 插值、`v-bind:` / `:` 属性、`v-on:` / `@` 事件、`v-model` 双向、`v-if` / `v-for` 控制流
- 路由：[Vue Router 4](https://router.vuejs.org/)（`createRouter` + `<router-view />`）
- 状态：[Pinia](https://pinia.vuejs.org/)（`defineStore` Setup Store）
- 工具：[Vue DevTools](https://devtools.vuejs.org/)（浏览器扩展 / 独立 app / Vite plugin）

## 安装与首次启动

### 推荐路径：`create-vue`

```bash
# 官方脚手架（背后是 Vite 模板）
pnpm create vue@latest

# 交互式提问，常见组合：
# √ Project name … my-app
# √ Add TypeScript? … Yes
# √ Add JSX Support? … No
# √ Add Vue Router for Single Page Application development? … Yes
# √ Add Pinia for state management? … Yes
# √ Add Vitest for Unit Testing? … Yes
# √ Add an End-to-End Testing Solution? … No
# √ Add ESLint for code quality? … Yes
# √ Add Prettier for code formatting? … Yes

cd my-app
pnpm install
pnpm dev
```

浏览器打开 `http://localhost:5173` 即看默认页。**HMR 默认开启**。

### 仅装 Vue + Vite（最小路径）

不想要 Router / Pinia 时，直接用 Vite 的 Vue 模板：

```bash
pnpm create vite@latest my-app -- --template vue-ts
cd my-app && pnpm install && pnpm dev
```

::: tip create-vue vs Vite 模板

- **`create-vue`**：Vue 官方，含可选 Router / Pinia / Vitest / Cypress / ESLint / Prettier 交互；推荐做正式项目
- **`create-vite --template vue-ts`**：Vite 团队维护，只装 Vue + Vite + TS；适合快速原型 / 教学

两者底层都是 Vite。`create-vue` 多帮你把生态选项接好。

:::

### Node 版本

Vue 3 本体支持 Node 18.3+，但 Vite 7（`create-vue` 默认）要求 Node 20.19+ / 22.12+。CI 与本地都升到 LTS：

```bash
nvm install --lts && nvm use --lts
```

## 项目结构

`create-vue` 完整模板默认结构：

```
my-app/
├── src/
│   ├── assets/                 # 静态资源（图片、字体、SCSS）
│   ├── components/             # 可复用组件
│   ├── composables/            # 自定义 composables（约定 useXxx）
│   ├── layouts/                # 布局组件（可选）
│   ├── router/
│   │   └── index.ts            # Vue Router 配置
│   ├── stores/
│   │   └── counter.ts          # Pinia store
│   ├── views/                  # 页面级组件（路由对应）
│   │   ├── HomeView.vue
│   │   └── AboutView.vue
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 入口（createApp + mount）
├── public/                     # 不经 bundler 的静态资源
├── index.html                  # SPA 入口 HTML
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置（references 子项目）
├── tsconfig.app.json
├── tsconfig.node.json
└── package.json
```

::: tip 入口 `index.html` 在根目录

与 React / Angular 不同，Vite 的 SPA 入口 HTML 直接放仓库根目录，里面有 `<script type="module" src="/src/main.ts"></script>`。这是 Vite 的设计：HTML 是开发入口而非「最终产物」。

:::

## 第一个组件

SFC（Single File Component）= 模板 + 脚本 + 样式三段式，文件后缀 `.vue`：

```vue
<!-- src/components/HelloButton.vue -->
<script setup lang="ts">
// 1. Props 用编译器宏声明，类型从 TS interface 自动推导
const props = defineProps<{
  label: string
  disabled?: boolean
}>()

// 2. Emits 同理
const emit = defineEmits<{
  (e: 'click', payload: { ts: number }): void
}>()

// 3. 响应式状态
import { ref } from 'vue'
const count = ref(0)

// 4. 事件处理
function handleClick() {
  count.value++
  emit('click', { ts: Date.now() })
}
</script>

<template>
  <button :disabled="disabled" @click="handleClick">
    {{ label }} ({{ count }})
  </button>
</template>

<style scoped>
button {
  padding: 8px 16px;
  border-radius: 4px;
  background: #41b883;
  color: white;
  border: none;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

使用：

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import HelloButton from './components/HelloButton.vue'

function onClicked(payload: { ts: number }) {
  console.log('clicked at', payload.ts)
}
</script>

<template>
  <HelloButton label="Hi" @click="onClicked" />
</template>
```

### `<style scoped>` 的本质

加 `scoped` 后 Vue 编译器会给当前组件的 DOM 元素添加属性 `data-v-xxxxxx`，CSS 选择器自动改写成 `button[data-v-xxxxxx]`。**样式只影响当前组件**，不会污染其它组件。

```vue
<style scoped>
/* 编译后：button[data-v-abc] { ... } */
button { color: red; }
</style>
```

需要穿透到子组件时用 `:deep()`：

```vue
<style scoped>
.parent :deep(.child-class) { color: blue; }
</style>
```

## `<script setup>` 基础

`<script setup>` 是**编译期语法糖**：里面的顶层绑定（变量 / 函数 / 组件 import）自动暴露给模板，比起手写 `setup()` 函数省掉一层 `return {}`。

```vue
<script setup lang="ts">
// 1. import 的组件可在模板直接用
import ChildComponent from './ChildComponent.vue'

// 2. 顶层变量在模板可访问
const message = 'Hello'

// 3. 顶层函数在模板可调用
function greet() {
  console.log(message)
}

// 4. 编译器宏（仅 <script setup> 可用）
const props = defineProps<{ title: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
defineExpose({ greet })  // 暴露给父组件 ref
defineOptions({ name: 'MyComponent' })  // 等价 Options API 的顶层选项
defineSlots<{ default: () => any }>()  // 类型化 slots
</script>

<template>
  <ChildComponent :title="title" @close="emit('close')" />
  <button @click="greet">Greet</button>
</template>
```

::: tip 编译器宏不需要 import

`defineProps` / `defineEmits` / `defineExpose` / `defineOptions` / `defineSlots` / `defineModel` / `withDefaults` 等都是**编译时被替换的宏**，运行时不存在。直接用，不要 import；编辑器 / linter 也已经识别。

:::

## Composition API 入口

### `ref`：单值响应式

```ts
import { ref, computed, watch } from 'vue'

// 基本类型 + 对象都用 ref
const count = ref(0)
const user = ref<{ name: string; age: number }>({ name: 'Alice', age: 30 })

// 访问要 .value（在模板里自动 unwrap，写 {{ count }} 即可）
count.value++             // 修改
console.log(count.value)  // 读取
```

### `reactive`：对象深响应式

```ts
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: { name: 'Alice', age: 30 },
})

// 直接访问 / 修改（无 .value）
state.count++
state.user.age = 31
```

::: warning ref vs reactive 选择

- **优先用 `ref`**：基本类型、可能被替换整体（`state.value = newObj`）的场景
- **`reactive` 在某些重构里坑多**：解构 / 替换整体 / 跨函数传递时容易丢失响应性
- **官方 style guide 推荐**：除非有明确理由，统一用 `ref`

```ts
// ❌ reactive 解构后失去响应性
const state = reactive({ count: 0 })
const { count } = state   // count 是普通数字，不再响应

// ✅ ref 永远安全
const count = ref(0)
const localCount = count   // 仍是同一个 ref
```

:::

### `computed`：派生值

```ts
const firstName = ref('Alice')
const lastName = ref('Smith')

// 自动追踪 firstName / lastName 变化、缓存结果
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

// 也可写 getter + setter
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (newVal) => {
    [firstName.value, lastName.value] = newVal.split(' ')
  },
})
fullName.value = 'Bob Jones'  // 触发 setter
```

`computed` 是**带缓存**的——依赖未变时多次访问返回同一个值，比方法调用更高效。

### `watch`：副作用

```ts
const count = ref(0)
const userId = ref(1)

// 监听单个 ref
watch(count, (newVal, oldVal) => {
  console.log(`count: ${oldVal} → ${newVal}`)
})

// 监听 getter（推荐 reactive 内部字段）
watch(() => state.user.age, (newAge) => {
  console.log('age changed:', newAge)
})

// 监听多个
watch([count, userId], ([c, u], [oldC, oldU]) => {
  console.log('both', c, u)
})

// 立即执行 + 深度监听 + flush 时机
watch(state, (newState) => {
  // ...
}, {
  immediate: true,
  deep: true,
  flush: 'post',     // 'pre' | 'post' | 'sync'
})
```

`watchEffect` 是自动追踪版本：

```ts
watchEffect(() => {
  // 函数里用到的所有 ref / reactive 自动当依赖
  console.log(`count is ${count.value}, userId is ${userId.value}`)
})
```

## 模板语法基础

### 文本插值

```vue
<template>
  <span>Message: {{ msg }}</span>
  <span>{{ ok ? 'YES' : 'NO' }}</span>      <!-- 表达式 -->
  <span>{{ msg.split('').reverse().join('') }}</span>
</template>
```

<span v-pre>`{{ }}`</span> 内只能写**单个表达式**，不能写语句（`if` / `for`）。

### 原始 HTML

```vue
<span v-html="rawHtml" />
```

::: warning XSS 风险

`v-html` 不会做转义——只用在**完全可信**的内容上。用户输入直接 `v-html` 等同于打开 XSS 大门。

:::

### 属性绑定

```vue
<template>
  <!-- v-bind 完整写法 -->
  <a v-bind:href="url">link</a>

  <!-- : 简写（推荐） -->
  <a :href="url">link</a>

  <!-- 布尔属性：true 时存在、false 时移除 -->
  <button :disabled="isDisabled">Submit</button>

  <!-- 动态属性名 -->
  <a :[attrName]="value">link</a>

  <!-- 绑定一个对象的所有属性 -->
  <div v-bind="{ id: 'app', class: 'foo' }" />
</template>
```

### 事件绑定

```vue
<template>
  <!-- 完整写法 -->
  <button v-on:click="onClick">Click</button>

  <!-- @ 简写 -->
  <button @click="onClick">Click</button>

  <!-- 内联表达式 -->
  <button @click="count++">+1</button>

  <!-- 方法调用 + 自定义参数 -->
  <button @click="onClick($event, item.id)">Click</button>
</template>
```

### `v-for` 列表渲染

```vue
<template>
  <!-- 数组 -->
  <li v-for="(item, index) in items" :key="item.id">
    {{ index }}: {{ item.name }}
  </li>

  <!-- 对象 -->
  <li v-for="(value, key, index) in obj" :key="key">
    {{ key }}: {{ value }}
  </li>

  <!-- 数字 -->
  <span v-for="n in 5" :key="n">{{ n }}</span>  <!-- 1..5 -->
</template>
```

::: warning `:key` 必须给

`v-for` 必须配 `:key`，且 key 在列表内唯一。Vue 用 key 做 diff 算法判断「同一项」。用 `index` 当 key 在列表能重排 / 增删时会出 bug——优先用 `item.id`。

:::

### `v-if` / `v-else-if` / `v-else`

```vue
<template>
  <div v-if="user.role === 'admin'">Admin Panel</div>
  <div v-else-if="user.role === 'editor'">Editor Panel</div>
  <div v-else>Viewer</div>

  <!-- 多元素条件用 <template> 包 -->
  <template v-if="loaded">
    <Header />
    <Main />
    <Footer />
  </template>
</template>
```

`v-if` 是**真销毁 / 真创建**；`v-show` 只切 `display: none`。频繁切换用 `v-show`，进入条件后不再切回的用 `v-if`。

### `v-model` 双向绑定

```vue
<script setup lang="ts">
const text = ref('')
const checked = ref(false)
const selected = ref<string>('a')
</script>

<template>
  <input v-model="text" />
  <input type="checkbox" v-model="checked" />
  <select v-model="selected">
    <option value="a">A</option>
    <option value="b">B</option>
  </select>
</template>
```

`v-model` 在 input 元素上等价于 `:value` + `@input`；在自定义组件上等价 `:modelValue` + `@update:modelValue`，详见进阶。

## 父子组件通信

### Props 向下传递

```vue
<!-- 父组件 -->
<script setup lang="ts">
import UserCard from './UserCard.vue'
import { ref } from 'vue'

const userData = ref({ name: 'Alice', age: 30 })
</script>

<template>
  <UserCard :user="userData" :show-age="true" />
</template>
```

```vue
<!-- 子组件 UserCard.vue -->
<script setup lang="ts">
const props = defineProps<{
  user: { name: string; age: number }
  showAge?: boolean
}>()
</script>

<template>
  <div>
    <p>Name: {{ user.name }}</p>
    <p v-if="showAge">Age: {{ user.age }}</p>
  </div>
</template>
```

模板里属性名是 **kebab-case**（`show-age`），脚本里是 **camelCase**（`showAge`）。

### Emits 向上传事件

```vue
<!-- 子组件 -->
<script setup lang="ts">
const emit = defineEmits<{
  (e: 'submit', value: string): void
  (e: 'cancel'): void
}>()

function onSubmit() {
  emit('submit', 'hello')
}
</script>

<template>
  <button @click="onSubmit">Submit</button>
  <button @click="emit('cancel')">Cancel</button>
</template>
```

```vue
<!-- 父组件 -->
<template>
  <ChildForm @submit="onSubmit" @cancel="onCancel" />
</template>
```

### `v-model` 自定义组件

子组件想支持 `v-model` 时，用 `defineModel`（Vue 3.4+ 稳定）：

```vue
<!-- 子组件 NumberInput.vue -->
<script setup lang="ts">
// 等价于 props.modelValue + emit('update:modelValue')
const model = defineModel<number>({ required: true })
</script>

<template>
  <input type="number" :value="model" @input="model = +($event.target as HTMLInputElement).value" />
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <NumberInput v-model="count" />
</template>
```

多个 v-model：

```vue
<!-- 子组件 -->
<script setup lang="ts">
const firstName = defineModel<string>('firstName')
const lastName = defineModel<string>('lastName')
</script>
```

```vue
<!-- 父组件 -->
<UserNameInput v-model:first-name="first" v-model:last-name="last" />
```

## Vue Router 最小例子

```bash
pnpm add vue-router@4
```

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
    { path: '/users/:id', name: 'user', component: () => import('@/views/UserView.vue') },
  ],
})

export default router
```

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

```vue
<!-- src/App.vue -->
<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
  </nav>
  <RouterView />
</template>
```

```vue
<!-- src/views/UserView.vue -->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const id = route.params.id   // 当前 :id

function goBack() {
  router.back()
}
</script>

<template>
  <h1>User {{ id }}</h1>
  <button @click="goBack">Back</button>
</template>
```

## Pinia 最小例子

```bash
pnpm add pinia
```

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

```ts
// src/stores/counter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Setup Store 风格（推荐）
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubled = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, doubled, increment }
})
```

```vue
<!-- 任意组件 -->
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

const counter = useCounterStore()
// 解构 state / getter 要 storeToRefs 保留响应性
const { count, doubled } = storeToRefs(counter)
// 解构 actions 直接拿
const { increment } = counter
</script>

<template>
  <p>Count: {{ count }} (×2 = {{ doubled }})</p>
  <button @click="increment">+1</button>
</template>
```

## Vue DevTools

Vue 3 调试三件套：

1. **浏览器扩展**：Chrome / Firefox / Edge 装 Vue DevTools 扩展，开发者工具里多一个 Vue panel——查组件树、props、reactive state、router、pinia、events、performance
2. **Vue DevTools Standalone**（独立 app）：脚手架移动端 / WebView / Electron 等无法装扩展的环境，跑 `pnpm dlx @vue/devtools` 起一个独立窗口
3. **Vite Plugin（推荐）**：`@vue/devtools` 是 Nuxt / Vite 共用的，安装后页面右下角浮一个 V 按钮，无需浏览器扩展

```bash
pnpm add -D vite-plugin-vue-devtools
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
})
```

## 一份能跑的最小示例

```
my-app/
├── src/
│   ├── components/HelloButton.vue
│   ├── views/HomeView.vue
│   ├── views/UserView.vue
│   ├── router/index.ts
│   ├── stores/counter.ts
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts
└── package.json
```

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

createApp(App).use(router).use(createPinia()).mount('#app')
```

```vue
<!-- src/App.vue -->
<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/users/42">User 42</RouterLink>
    </nav>
  </header>
  <main>
    <RouterView />
  </main>
</template>
```

```vue
<!-- src/views/HomeView.vue -->
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'
import HelloButton from '@/components/HelloButton.vue'

const counter = useCounterStore()
const { count, doubled } = storeToRefs(counter)
</script>

<template>
  <h1>Home</h1>
  <p>Count: {{ count }} (×2 = {{ doubled }})</p>
  <HelloButton label="+1" @click="counter.increment" />
</template>
```

`pnpm dev` → 浏览器看主页 + 路由 + 状态全联通。

## 下一步

- Composition API + 模板语法 + 通信 + 插槽细节见 [指南 - 基础](./guide-line/base.md)
- Composables 设计 + Pinia + Vue Router + Transition + TypeScript 见 [指南 - 进阶](./guide-line/advanced.md)
- 响应式底层 / Vapor / SSR / 编译时优化 / 测试 / 自定义指令见 [指南 - 高级](./guide-line/expert.md)
- 微前端 / 与其它工具集成 / 边缘场景见 [指南 - 其他](./guide-line/other.md)
- 全 API + 编译宏 + 内置组件 + 配置项速查见 [参考](./reference.md)
