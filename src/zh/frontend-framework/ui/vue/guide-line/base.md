---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> 基于 Vue 3.5.x 编写 —— Composition API、模板语法、组件通信、插槽

## 速查

- 响应式：`ref` / `reactive` / `computed` / `watch` / `watchEffect` / `shallowRef` / `readonly` / `toRef` / `toRefs` / `unref`
- 生命周期：`onMounted` / `onUpdated` / `onUnmounted` / `onBeforeMount` / `onBeforeUpdate` / `onBeforeUnmount` / `onErrorCaptured` / `onActivated` / `onDeactivated`
- 模板引用：`useTemplateRef('name')`（3.5+）；旧风格 `const xRef = ref<HTMLElement | null>(null)` + `ref="xRef"`
- 表单：`v-model` 修饰符 `.lazy` / `.number` / `.trim`；checkbox 多选自动给数组；radio 单选给值
- 列表：`v-for` 必带 `:key`，**不要** `v-for` + `v-if` 同元素（Vue 3 中 `v-if` 优先级更高）
- 事件修饰符：`.stop` / `.prevent` / `.capture` / `.self` / `.once` / `.passive`；按键 `.enter` / `.tab` / `.delete` / `.esc` / `.ctrl` / `.shift` / `.alt` / `.meta`
- 类绑定：`:class="{ active: isActive }"` / 数组 `:class="[cls1, { cls2: cond }]"`；scoped 用 `:deep()` 穿透
- 插槽：默认 / 具名 / 作用域；`<template #name="slotProps">` 语法
- Props 验证：用 `<script setup>` + `defineProps<...>()` TS 类型；运行时校验 `withDefaults(defineProps<...>(), {...})`
- 依赖注入：`provide(key, value)` / `inject(key, defaultValue)`；可注入 readonly + reactive

## Composition API 全貌

### `ref` —— 单值响应式

```ts
import { ref } from 'vue'

const count = ref(0)
const user = ref<{ name: string; age: number }>({ name: 'Alice', age: 30 })
const list = ref<string[]>([])

// 修改要 .value
count.value++
user.value.name = 'Bob'
list.value.push('item')

// 替换整体也行
user.value = { name: 'Charlie', age: 25 }
```

`ref` 本质：返回 `RefImpl` 对象，`.value` getter / setter 触发依赖追踪。**模板内自动 unwrap**——<span v-pre>`{{ count }}`</span> 不要写 `count.value`。

### `reactive` —— 对象深响应式

```ts
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: { name: 'Alice', age: 30 },
  items: [] as string[],
})

state.count++
state.user.age = 31
state.items.push('foo')
```

`reactive` 本质：返回 Proxy，所有嵌套对象都被自动 wrap 成响应式。

::: warning reactive 的三个坑

```ts
// 坑 1：解构 → 失去响应性
const { count } = state
count++   // 这只是改普通数字，state.count 不变

// 修复：用 toRefs
import { toRefs } from 'vue'
const { count } = toRefs(state)
count.value++   // 改的是同一个引用

// 坑 2：替换整体 → 旧的 proxy 引用失效
let s = reactive({ a: 1 })
s = reactive({ a: 2 })   // 旧的 s 不再被监听
// 修复：用 Object.assign 而不是替换
Object.assign(s, { a: 2 })

// 坑 3：基本类型不能用 reactive（不是对象）
const x = reactive(0)   // TS / Vue 都不接受
```

官方现在推荐：**优先用 `ref`**，跨函数 / 解构 / 替换都安全；`reactive` 只在确定不离开当前作用域的对象上用。

:::

### `shallowRef` / `shallowReactive` —— 浅响应

只追踪第一层变化，内部嵌套不会被 Proxy 化：

```ts
import { shallowRef } from 'vue'

const data = shallowRef({ list: [1, 2, 3], meta: { total: 3 } })

data.value.list.push(4)   // ❌ 不触发更新（嵌套不响应）
data.value = { list: [1, 2, 3, 4], meta: { total: 4 } }  // ✅ 替换整体触发
```

用途：**大列表 / 大对象**（数千行表格、Map 实例、Chart instance）—— 跳过递归 Proxy 节省内存与性能。

### `readonly` —— 只读

```ts
import { readonly, reactive } from 'vue'

const state = reactive({ count: 0 })
const ro = readonly(state)

ro.count++   // ❌ 控制台警告 + 不会改
state.count++   // ✅ 原状态可改，readonly 视图同步更新
```

常用：**provide 给子组件**时套一层 `readonly`，强制单向数据流。

### `toRef` / `toRefs` —— reactive 字段转 ref

```ts
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({ count: 0, name: 'Alice' })

// toRef 单个字段
const countRef = toRef(state, 'count')
countRef.value++   // === state.count++（双向同步）

// toRefs 全部字段
const { count, name } = toRefs(state)
count.value = 10
name.value = 'Bob'
// 等价 state.count = 10; state.name = 'Bob'
```

`toRefs` 经典场景：从 composable 返回 reactive state，但允许调用方解构：

```ts
function useUser() {
  const state = reactive({ name: '', age: 0 })
  return toRefs(state)
}

const { name, age } = useUser()   // 仍然响应式
```

### `unref` —— 自动 unwrap

```ts
import { unref, ref } from 'vue'

const count = ref(5)
console.log(unref(count))   // 5
console.log(unref(10))      // 10（非 ref 直接返回）
```

`unref(x)` = `isRef(x) ? x.value : x`。用于写「可接受 ref 或裸值」的工具函数。

### `customRef` —— 自定义追踪逻辑

```ts
import { customRef } from 'vue'

// 实现防抖 ref
function useDebouncedRef<T>(value: T, delay = 200) {
  let timeout: ReturnType<typeof setTimeout>
  return customRef<T>((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        value = newValue
        trigger()
      }, delay)
    },
  }))
}

const search = useDebouncedRef('', 500)
```

`track()` 收集当前调用方依赖；`trigger()` 触发更新。`customRef` 是写库时才会用的低层 API。

## `computed` —— 派生值

```ts
import { ref, computed } from 'vue'

const items = ref([
  { name: 'Apple', price: 5 },
  { name: 'Banana', price: 3 },
])
const tax = ref(0.1)

// 只读 computed
const total = computed(() =>
  items.value.reduce((sum, i) => sum + i.price, 0) * (1 + tax.value),
)

// 可写 computed（不常用）
const firstName = ref('Alice')
const lastName = ref('Smith')
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value) => {
    [firstName.value, lastName.value] = value.split(' ')
  },
})
fullName.value = 'Bob Jones'   // 触发 setter
```

### 缓存机制

```ts
const expensive = computed(() => {
  console.log('computing...')
  return slowFunction(input.value)
})

// 多次访问只计算一次（input 没变）
console.log(expensive.value)
console.log(expensive.value)
console.log(expensive.value)
// 输出："computing..." 一次

input.value = newVal
// 下次访问才重新计算
console.log(expensive.value)
// 输出："computing..."
```

依赖未变时 computed 直接返回上次缓存值。**对比方法**：<span v-pre>`{{ expensive() }}`</span> 每次访问都重算。

### 注意事项

```ts
// ❌ 不要在 computed 内做副作用
const total = computed(() => {
  fetch('/log')         // ❌ HTTP 调用
  state.count++         // ❌ 修改其它 state
  return items.length
})

// ❌ 不要返回 reactive 对象（破坏响应链）
const item = computed(() => reactive({ name: 'x' }))

// ✅ 纯函数：只读 + 派生
const total = computed(() => items.value.reduce((s, i) => s + i.price, 0))
```

## `watch` 系列

### `watch` —— 显式依赖

```ts
import { watch, ref } from 'vue'

const count = ref(0)

// 监听单个 ref
watch(count, (newVal, oldVal) => {
  console.log(`count: ${oldVal} → ${newVal}`)
})

// 监听 reactive 字段（必须用 getter）
const state = reactive({ user: { age: 30 } })
watch(() => state.user.age, (age, oldAge) => {
  console.log('age', oldAge, '→', age)
})

// 监听多个
watch([count, () => state.user.age], ([c, a], [oc, oa]) => {
  console.log('both changed')
})

// 监听整个 reactive（自动 deep）
watch(state, (newState) => {
  console.log('state changed', newState)
})

// 选项
watch(count, fn, {
  immediate: true,    // 立刻跑一次
  deep: true,         // 深度监听（对象内部变化）
  flush: 'post',      // 'pre'（默认）/ 'post'（DOM 更新后）/ 'sync'（立即）
  once: true,         // 3.4+ 只触发一次
})

// 停止 watch
const stop = watch(count, fn)
stop()
```

### `watchEffect` —— 自动追踪

```ts
import { watchEffect } from 'vue'

const count = ref(0)
const userId = ref(1)

// 函数里读到的所有 ref 自动当依赖
watchEffect(() => {
  console.log(`count=${count.value}, userId=${userId.value}`)
})
// 立刻跑一次；count 或 userId 变化时再跑
```

`watchPostEffect` = `watchEffect(fn, { flush: 'post' })`，在 DOM 更新后跑（适合读取更新后的 DOM 尺寸）。
`watchSyncEffect` = `watchEffect(fn, { flush: 'sync' })`，依赖变化立即跑（不批处理）。

### `watch` vs `watchEffect`

| 维度 | `watch` | `watchEffect` |
|---|---|---|
| 依赖声明 | 显式传入第一参 | 自动追踪函数内 read 的 ref |
| 首次执行 | 默认懒执行（要 `immediate: true`） | 立即执行一次 |
| 拿到旧值 | ✅ 回调有 `oldValue` | ❌ 没有 |
| 调用频率 | 依赖变化时 | 函数内任意依赖变化时 |

经验：**watch 优先用于「响应特定变化」**；watchEffect 优先用于「跟踪当前状态副作用」。

### `onWatcherCleanup` —— 清理副作用（3.5+）

```ts
import { watch, onWatcherCleanup } from 'vue'

const userId = ref(1)

watch(userId, async (newId) => {
  const controller = new AbortController()

  // 注册清理：下次触发前 / watcher 停止前会跑
  onWatcherCleanup(() => {
    controller.abort()
  })

  const data = await fetch(`/api/users/${newId}`, {
    signal: controller.signal,
  })
})
```

Vue 3.5 前：清理函数作为第三参传入，3.5 用顶层 `onWatcherCleanup` 更优雅。

```ts
// 旧风格（仍可用）
watch(userId, (newId, oldId, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  // ...
})
```

## 生命周期钩子

### 完整生命周期

```vue
<script setup lang="ts">
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
  onActivated,
  onDeactivated,
  onServerPrefetch,
} from 'vue'

// 1. setup() 内 / <script setup> 顶层注册

onBeforeMount(() => {
  // DOM 渲染前
})

onMounted(() => {
  // DOM 已渲染（首次）
  // 此时可访问 ref 引用的 DOM 元素
})

onBeforeUpdate(() => {
  // 响应式数据变化、DOM 更新前
})

onUpdated(() => {
  // DOM 已更新
})

onBeforeUnmount(() => {
  // 组件卸载前，DOM 还在
})

onUnmounted(() => {
  // 组件卸载后
  // 适合清理：定时器、事件监听、WebSocket 等
})

// keep-alive 缓存的组件
onActivated(() => {
  // 缓存后再次激活
})

onDeactivated(() => {
  // 被 keep-alive 缓存
})

// 错误捕获
onErrorCaptured((err, instance, info) => {
  console.error(err)
  return false   // 阻止错误向上冒泡
})

// SSR 预取（仅 SSR）
onServerPrefetch(async () => {
  await someAsyncTask()
})
</script>
```

### 调用顺序（父 / 子组件）

挂载：

```
父 setup → 父 beforeMount
  → 子 setup → 子 beforeMount → 子 mounted
→ 父 mounted
```

更新（父 prop 变化）：

```
父 beforeUpdate
  → 子 beforeUpdate → 子 updated
→ 父 updated
```

卸载：

```
父 beforeUnmount
  → 子 beforeUnmount → 子 unmounted
→ 父 unmounted
```

::: tip 异步初始化要在 onMounted

```ts
// ❌ setup 顶层异步 → 阻塞渲染（需要 Suspense）
const data = await $fetch('/api/x')

// ✅ onMounted 内异步 → 不阻塞首屏
const data = ref(null)
onMounted(async () => {
  data.value = await $fetch('/api/x')
})
```

:::

## 模板引用（template refs）

### Vue 3.5+ 推荐：`useTemplateRef`

```vue
<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'

// 字符串名字与模板 ref="xxx" 对应
const input = useTemplateRef<HTMLInputElement>('input-el')

onMounted(() => {
  input.value?.focus()
})
</script>

<template>
  <input ref="input-el" />
</template>
```

### Vue 3.0~3.4 风格（仍可用）

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputEl = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputEl.value?.focus()
})
</script>

<template>
  <input ref="inputEl" />
</template>
```

变量名与 `ref="xxx"` 一致即可。新风格 `useTemplateRef` 解决了 dynamic ref 名字的情况。

### v-for 内的 ref

```vue
<script setup lang="ts">
import { ref } from 'vue'

const itemRefs = ref<HTMLElement[]>([])
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id" ref="itemRefs">
      {{ item.name }}
    </li>
  </ul>
</template>
```

`itemRefs.value` 是数组（按 DOM 顺序）。

### 组件实例 ref（访问子组件方法）

```vue
<!-- 子组件 -->
<script setup lang="ts">
function greet() {
  console.log('hi')
}
// 暴露给父组件 ref
defineExpose({ greet })
</script>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import Child from './Child.vue'

const childRef = useTemplateRef<InstanceType<typeof Child>>('child')

function callChild() {
  childRef.value?.greet()
}
</script>

<template>
  <Child ref="child" />
  <button @click="callChild">Call child.greet()</button>
</template>
```

::: warning `<script setup>` 默认不暴露内部

组件内的变量 / 函数默认是「私有」的，父组件拿 ref 也看不到。**必须 `defineExpose({ ... })` 才暴露**。

:::

## 表单绑定与 `v-model` 修饰符

### 输入框

```vue
<script setup lang="ts">
import { ref } from 'vue'
const text = ref('')
</script>

<template>
  <!-- .lazy：blur 时才同步（默认是 input 事件） -->
  <input v-model.lazy="text" />

  <!-- .number：自动转 number（NaN 时保留字符串） -->
  <input v-model.number="age" type="number" />

  <!-- .trim：自动去首尾空格 -->
  <input v-model.trim="username" />

  <!-- 组合 -->
  <input v-model.lazy.trim="username" />
</template>
```

### Checkbox

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 单个 → boolean
const agreed = ref(false)

// 多个共绑一个数组 → 数组里出现 value
const fruits = ref<string[]>([])
</script>

<template>
  <!-- 单个 → boolean -->
  <input type="checkbox" v-model="agreed" />

  <!-- 多个 → 数组 -->
  <label>
    <input type="checkbox" value="apple" v-model="fruits" /> Apple
  </label>
  <label>
    <input type="checkbox" value="banana" v-model="fruits" /> Banana
  </label>
  <!-- fruits = ['apple', 'banana'] 等 -->

  <!-- true-value / false-value 自定义 -->
  <input type="checkbox" v-model="status" true-value="on" false-value="off" />
</template>
```

### Radio

```vue
<script setup lang="ts">
const gender = ref<'male' | 'female'>('male')
</script>

<template>
  <label>
    <input type="radio" value="male" v-model="gender" /> Male
  </label>
  <label>
    <input type="radio" value="female" v-model="gender" /> Female
  </label>
</template>
```

### Select

```vue
<script setup lang="ts">
const single = ref('')
const multi = ref<string[]>([])
</script>

<template>
  <!-- 单选 -->
  <select v-model="single">
    <option disabled value="">Choose</option>
    <option value="a">A</option>
    <option value="b">B</option>
  </select>

  <!-- 多选（按住 ctrl/cmd 多选）-->
  <select v-model="multi" multiple>
    <option value="a">A</option>
    <option value="b">B</option>
    <option value="c">C</option>
  </select>
</template>
```

### `v-model` 在自定义组件上

```vue
<!-- 父组件 -->
<MyInput v-model="text" v-model:label="labelText" />
```

```vue
<!-- 子组件 MyInput.vue（Vue 3.4+ 推荐 defineModel） -->
<script setup lang="ts">
const text = defineModel<string>({ required: true })
const label = defineModel<string>('label')
</script>

<template>
  <input v-model="text" />
  <span>{{ label }}</span>
</template>
```

## 列表渲染细节

### `:key` 的重要性

```vue
<template>
  <!-- ❌ 用 index 当 key：列表重排 / 中间插入会出 bug -->
  <li v-for="(item, idx) in items" :key="idx">{{ item.name }}</li>

  <!-- ✅ 用稳定的 id 当 key -->
  <li v-for="item in items" :key="item.id">{{ item.name }}</li>
</template>
```

Vue 用 key 判断「同一项」。如果用 index：插入新项后所有后面项的 index 都变了，Vue 会**移动 + 修改**多个 DOM 节点，而不是只插一个。

### `v-for` 与 `v-if` 不能同元素

```vue
<!-- ❌ Vue 3 中 v-if 优先级高 → item 未定义 -->
<li v-for="item in items" v-if="item.active" :key="item.id">
  {{ item.name }}
</li>

<!-- ✅ 把 v-if 移到外层 template，或者过滤 -->
<template v-for="item in items" :key="item.id">
  <li v-if="item.active">{{ item.name }}</li>
</template>

<!-- ✅✅ 推荐：computed 内过滤（更清晰） -->
<script setup>
const activeItems = computed(() => items.value.filter(i => i.active))
</script>
<template>
  <li v-for="item in activeItems" :key="item.id">{{ item.name }}</li>
</template>
```

### `v-for` 数据类型

```vue
<template>
  <!-- 数组 -->
  <li v-for="(item, idx) in arr" :key="item.id">{{ idx }}: {{ item }}</li>

  <!-- 对象（顺序按 Object.keys()，注意不保证稳定） -->
  <li v-for="(value, key, idx) in obj" :key="key">{{ key }}={{ value }}</li>

  <!-- 数字（1..n） -->
  <span v-for="n in 5" :key="n">{{ n }}</span>

  <!-- 字符串（按 char 迭代） -->
  <span v-for="c in 'hello'" :key="c">{{ c }}</span>

  <!-- Iterable（Map / Set） -->
  <li v-for="[k, v] in map" :key="k">{{ k }}: {{ v }}</li>
</template>
```

### 计算属性过滤更清晰

```ts
const todos = ref<Todo[]>([])

const activeTodos = computed(() => todos.value.filter(t => !t.done))
const sortedTodos = computed(() =>
  [...todos.value].sort((a, b) => b.priority - a.priority),
)
```

```vue
<li v-for="todo in sortedTodos" :key="todo.id">{{ todo.title }}</li>
```

## 条件渲染：`v-if` vs `v-show`

```vue
<template>
  <!-- v-if：真销毁 + 真创建，DOM 不存在 -->
  <ExpensiveComponent v-if="visible" />

  <!-- v-show：始终渲染，CSS display: none -->
  <Tooltip v-show="hover" />
</template>
```

| 维度 | `v-if` | `v-show` |
|---|---|---|
| DOM 存在 | 条件为 true 时才挂 | 一直存在 |
| 切换开销 | 高（重新挂 / 卸载） | 低（CSS toggle） |
| 适合场景 | 切换不频繁 + 隐藏时性能敏感 | 频繁切换 + 简单显隐 |
| 子组件生命周期 | 每次进 / 出都跑 mount / unmount | 不重复跑 |
| `<template>` 包多元素 | ✅ 支持 | ❌ 不支持 |

::: tip 条件 `<template>`

```vue
<template v-if="showDetail">
  <h2>Title</h2>
  <p>Body</p>
  <button>Action</button>
</template>
```

`<template>` 是「隐形包装」，不会真生成 DOM，仅作为分组容器。**`v-show` 不能用在 `<template>` 上**——因为它要给元素加 `style`。

:::

## 事件处理

### 修饰符

```vue
<template>
  <!-- 阻止冒泡 -->
  <button @click.stop="onClick">Click</button>

  <!-- 阻止默认 -->
  <form @submit.prevent="onSubmit">
    <button type="submit">Submit</button>
  </form>

  <!-- 捕获阶段（默认是冒泡阶段） -->
  <div @click.capture="onCapture">...</div>

  <!-- 只当 event.target === el 时触发（不响应冒泡） -->
  <div @click.self="onSelf">...</div>

  <!-- 只触发一次 -->
  <button @click.once="onOnce">Click once</button>

  <!-- passive 监听（不调 preventDefault，滚动性能好） -->
  <div @scroll.passive="onScroll">...</div>

  <!-- 组合 -->
  <a @click.stop.prevent="onClick">link</a>
</template>
```

### 按键修饰符

```vue
<template>
  <!-- 单键 -->
  <input @keyup.enter="onEnter" />
  <input @keyup.tab="onTab" />
  <input @keyup.delete="onDelete" />
  <input @keyup.esc="onEsc" />
  <input @keyup.space="onSpace" />
  <input @keyup.up="onUp" />
  <input @keyup.down="onDown" />

  <!-- 系统键 -->
  <input @keyup.ctrl.s="onSave" />          <!-- Ctrl+S -->
  <input @keyup.alt.delete="onAltDel" />
  <input @keyup.shift.enter="onShiftEnter" />
  <input @keyup.meta.k="onCmdK" />          <!-- mac cmd+k / win meta+k -->

  <!-- 精确匹配：只有这些键按下，不许有其它 -->
  <button @click.ctrl.exact="onCtrlClick">Only Ctrl+Click</button>

  <!-- 鼠标按键 -->
  <div @click.left="leftClick" />
  <div @click.right="rightClick" />
  <div @click.middle="middleClick" />
</template>
```

按键名规则：把 `KeyboardEvent.key` 转 kebab-case。例如 `PageDown` → `page-down`。

### 内联事件

```vue
<template>
  <!-- 表达式 -->
  <button @click="count++">+1</button>

  <!-- 内联函数 -->
  <button @click="(e) => count = e.shiftKey ? count + 10 : count + 1">+1 or +10</button>

  <!-- 调方法 + 传 $event -->
  <button @click="onClick($event, item.id)">Click</button>
</template>
```

## Class 与 Style 绑定

### Class 绑定

```vue
<script setup lang="ts">
const isActive = ref(true)
const hasError = ref(false)
const cls = computed(() => `theme-${theme.value}`)
</script>

<template>
  <!-- 对象语法 -->
  <div :class="{ active: isActive, error: hasError }" />

  <!-- 数组语法 -->
  <div :class="['base-class', cls, { active: isActive }]" />

  <!-- 与 class 共存 -->
  <div class="static" :class="{ active: isActive }" />
</template>
```

### Style 绑定

```vue
<script setup lang="ts">
const color = ref('red')
const fontSize = ref(16)
const styleObj = computed(() => ({
  color: color.value,
  fontSize: `${fontSize.value}px`,
}))
</script>

<template>
  <!-- 对象语法（camelCase 或 kebab-case） -->
  <p :style="{ color: 'red', fontSize: '16px' }">Hello</p>
  <p :style="{ 'background-color': 'blue' }">Hello</p>

  <!-- 数组（多个对象合并） -->
  <p :style="[baseStyle, overrideStyle]" />

  <!-- 自动加 vendor prefix -->
  <div :style="{ transform: 'rotate(45deg)' }" />

  <!-- CSS 变量 -->
  <div :style="{ '--primary': color }" />
</template>
```

### `<style scoped>` 深度选择器

```vue
<style scoped>
/* 默认只影响当前组件 DOM */
.card { padding: 16px; }

/* 穿透到子组件用 :deep() */
.card :deep(.child-element) {
  color: red;
}

/* 给 slot 内容设样式用 :slotted() */
.card :slotted(.slot-class) {
  margin: 8px;
}

/* 仅作用于全局某处用 :global() */
:global(body) {
  font-family: sans-serif;
}
</style>
```

### CSS Modules

```vue
<template>
  <div :class="$style.card">Card</div>
</template>

<style module>
.card {
  padding: 16px;
  background: white;
}
</style>
```

`$style` 是自动注入的对象，class 名经过 hash 处理避免冲突。多个 `<style module>` 可命名：

```vue
<style module="m1">.card { ... }</style>
<style module="m2">.card { ... }</style>

<template>
  <div :class="m1.card">From m1</div>
  <div :class="m2.card">From m2</div>
</template>
```

### `v-bind` 在 CSS 中（3.2+）

```vue
<script setup>
import { ref } from 'vue'
const color = ref('red')
const fontSize = ref(16)
</script>

<template>
  <p class="text">Hello</p>
</template>

<style scoped>
.text {
  color: v-bind(color);
  font-size: v-bind('fontSize + "px"');
}
</style>
```

响应式 CSS——`color` 改变时样式自动更新。

## 插槽（slots）

### 默认插槽

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <slot>Default content if no slot provided</slot>
  </div>
</template>
```

```vue
<!-- 使用 -->
<Card>
  <p>I'm in the slot</p>
</Card>
```

### 具名插槽

```vue
<!-- Layout.vue -->
<template>
  <div class="layout">
    <header><slot name="header" /></header>
    <main><slot /></main>      <!-- 默认 = name="default" -->
    <footer><slot name="footer" /></footer>
  </div>
</template>
```

```vue
<!-- 使用：v-slot:name 或 #name 简写 -->
<Layout>
  <template #header>
    <h1>Page Title</h1>
  </template>

  <p>Main content</p>     <!-- 进默认 slot -->

  <template #footer>
    <p>© 2026</p>
  </template>
</Layout>
```

### 作用域插槽（子→父传 props）

```vue
<!-- TodoList.vue -->
<script setup lang="ts">
defineProps<{ todos: Todo[] }>()
</script>

<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      <slot :todo="todo" :index="todo.id">{{ todo.text }}</slot>
    </li>
  </ul>
</template>
```

```vue
<!-- 父组件用 slotProps -->
<TodoList :todos="list">
  <template #default="{ todo, index }">
    <span :class="{ done: todo.done }">{{ index }}. {{ todo.text }}</span>
  </template>
</TodoList>
```

可解构：`#default="{ todo }"`。

### 动态插槽名

```vue
<template>
  <Layout>
    <template #[slotName]>Dynamic slot</template>
  </Layout>
</template>
```

### `useSlots` / `useAttrs`

```vue
<script setup lang="ts">
import { useSlots, useAttrs } from 'vue'

const slots = useSlots()
const attrs = useAttrs()

// 判断 slot 是否被使用
if (slots.header) { /* ... */ }

// 透传 attrs
</script>

<template>
  <header v-if="$slots.header">
    <slot name="header" />
  </header>
</template>
```

## Props 验证

### `<script setup>` + TypeScript（推荐）

```vue
<script setup lang="ts">
// 纯 TS 类型 → 编译期 + IDE 检查
interface Props {
  title: string
  count?: number
  items: { id: number; name: string }[]
  status: 'idle' | 'loading' | 'done'
}

const props = defineProps<Props>()
</script>
```

### `withDefaults` 加默认值

```ts
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  status: 'idle',
  items: () => [],   // 数组 / 对象用工厂函数
})
```

### 响应式 Props 解构（3.5+ 默认稳定）

```vue
<script setup lang="ts">
// 解构后仍响应式
const { title, count = 0 } = defineProps<{
  title: string
  count?: number
}>()

// 模板里直接用解构变量
</script>

<template>
  <h1>{{ title }} ({{ count }})</h1>
</template>
```

::: warning 解构在 JS 函数内仍要谨慎

```ts
const { count = 0 } = defineProps<{ count?: number }>()

// ❌ 普通函数内直接读 count → 一次性值
function logIt() {
  setTimeout(() => console.log(count), 1000)   // 1 秒后读到的可能是旧值
}

// ✅ watch / computed / setup 顶层是响应式的
watchEffect(() => console.log(count))   // 自动追踪
```

模板和 setup 顶层 / computed / watch 自动响应；JS 函数闭包不响应。

:::

### 运行时 Props 校验（无 TS）

```ts
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
    validator: (value: number) => value >= 0,
  },
  items: {
    type: Array as PropType<{ id: number }[]>,
    default: () => [],
  },
  status: {
    type: String as PropType<'idle' | 'loading'>,
    default: 'idle',
  },
})
```

dev 模式下 props 不合规会在 console 警告。

## Provide / Inject

跨层级传递数据，不必一层层 props 透传：

```vue
<!-- 顶层组件 -->
<script setup lang="ts">
import { provide, ref, readonly } from 'vue'

const theme = ref<'light' | 'dark'>('light')

// 提供响应式 + readonly
provide('theme', readonly(theme))

// 还可以提供修改方法（API 分离）
provide('toggleTheme', () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
})
</script>
```

```vue
<!-- 任意后代组件 -->
<script setup lang="ts">
import { inject } from 'vue'

const theme = inject<Ref<'light' | 'dark'>>('theme')
const toggle = inject<() => void>('toggleTheme')
</script>

<template>
  <button @click="toggle">Theme: {{ theme }}</button>
</template>
```

### 类型化的 InjectionKey

```ts
// shared/keys.ts
import type { InjectionKey, Ref } from 'vue'

export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')
export const ToggleKey: InjectionKey<() => void> = Symbol('toggle')
```

```ts
// 提供方
import { ThemeKey, ToggleKey } from './keys'
provide(ThemeKey, theme)
provide(ToggleKey, toggle)

// 消费方（自动类型推导）
const theme = inject(ThemeKey)
const toggle = inject(ToggleKey)
```

### 默认值

```ts
const theme = inject('theme', 'light')              // 默认值
const config = inject('config', () => createConfig(), true)  // 工厂函数
```

### `app.provide` —— 应用级

```ts
// main.ts
const app = createApp(App)
app.provide('apiBase', '/api')   // 所有组件都可 inject
app.mount('#app')
```

适合：全局配置 / API client / i18n 实例。

## 组件注册

### 局部注册（推荐）

```vue
<script setup lang="ts">
import ChildComponent from './ChildComponent.vue'
</script>

<template>
  <ChildComponent />
</template>
```

`<script setup>` 内 import 的组件**直接可用**。

### 全局注册

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import BaseButton from './components/BaseButton.vue'

const app = createApp(App)
app.component('BaseButton', BaseButton)
app.mount('#app')
```

```vue
<!-- 任意组件 -->
<template>
  <BaseButton>Click</BaseButton>
</template>
```

::: warning 全局注册的代价

全局注册的组件**不会被 tree shake**——即使没用也会进 bundle。优先局部注册；只有真正全局用的（比如 design system 入口）才全局注册。

:::

### Async Component

```ts
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
```

```vue
<template>
  <HeavyChart v-if="showChart" />
</template>
```

仅在 `v-if` 为 true 时才下载 chunk。详见进阶。

## Composables 入门

把可复用逻辑封装到函数里：

```ts
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)

  function increment() { count.value++ }
  function decrement() { count.value-- }
  function reset() { count.value = initial }

  return { count, doubled, increment, decrement, reset }
}
```

```vue
<script setup lang="ts">
import { useCounter } from '@/composables/useCounter'

const { count, doubled, increment, reset } = useCounter(10)
</script>

<template>
  <p>{{ count }} ({{ doubled }})</p>
  <button @click="increment">+1</button>
  <button @click="reset">Reset</button>
</template>
```

约定：composable 名以 `use` 开头，返回响应式 + 函数。详细设计原则见进阶章节。

## 下一步

- Composables 设计 / Pinia / Vue Router / Transition / TS / VueUse 见 [指南 - 进阶](./advanced.md)
- 响应式底层 / SSR / 性能优化 / 自定义指令 / 测试见 [指南 - 高级](./expert.md)
