---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> 基于 Svelte 5.x 编写 —— Runes 全篇 / 模板控制流 / Snippets / 事件 / 表单 / 样式 / 过渡 / 生命周期 / Stores / Context

## 速查

- **Runes 全表**：`$state` / `$state.raw` / `$state.snapshot` / `$derived` / `$derived.by` / `$effect` / `$effect.pre` / `$effect.tracking` / `$effect.root` / `$props` / `$bindable` / `$inspect` / `$inspect.trace` / `$host`
- **模板控制流**：`{#if}` / `{#each}` / `{#await}` / `{#key}` / `{#snippet}` + `{@render}` / `{@const}` / `{@html}`
- **特殊属性**：`class:name` / `style:prop` / `bind:value` / `use:action` / `transition:` / `in:` / `out:` / `animate:`
- **生命周期 API**：`onMount` / `onDestroy` / `tick` / `untrack`（`beforeUpdate` / `afterUpdate` 在 Svelte 5 已 deprecated，用 `$effect.pre` / `$effect` 替代）
- **Stores**：`writable` / `readable` / `derived` / `get` / `readonly`（from `svelte/store`）
- **Context API**：`setContext(key, value)` / `getContext<T>(key)` / `hasContext(key)` / `getAllContexts()`（from `svelte`）
- **过渡函数**：`fade` / `fly` / `slide` / `scale` / `blur` / `draw` / `crossfade`（from `svelte/transition`）
- **缓动函数**：`linear` / `cubicIn` / `cubicOut` / `cubicInOut` / `elasticIn` / `bounceOut` 等（from `svelte/easing`）

## Runes 深度篇

### `$state` —— 响应式状态

```svelte
<script lang="ts">
  // 基本类型
  let count = $state(0)
  let name = $state('')
  let isActive = $state(false)

  // 对象：深响应式（Proxy）
  let user = $state({
    name: 'Alice',
    address: { city: 'NY', zip: '10001' }
  })

  // 数组：深响应式
  let todos = $state<Todo[]>([])

  // 显式类型
  let count2 = $state<number>(0)
  let user2 = $state<User | null>(null)
</script>
```

**直接修改即响应**：

```svelte
<script lang="ts">
  let count = $state(0)
  let user = $state({ name: 'A', tags: ['vue'] })

  function update() {
    // 标量：赋值
    count = 1
    count++
    count += 5

    // 对象属性
    user.name = 'B'                              // ✅ 深响应式
    user.tags.push('react')                      // ✅ 数组方法
    user.tags = [...user.tags, 'svelte']        // ✅ 替换

    // 整体替换
    user = { name: 'C', tags: [] }              // ✅
  }
</script>
```

**`$state` 三个常见陷阱**：

1. **解构丢失响应式**

```svelte
<script lang="ts">
  let user = $state({ name: 'Alice', age: 30 })
  let { name, age } = user      // ❌ name / age 现在是普通值，不响应
  // 解决：直接 user.name / user.age
</script>
```

2. **Proxy 不等于原对象**

```svelte
<script lang="ts">
  const obj = { name: 'A' }
  const proxy = $state(obj)
  console.log(proxy === obj)    // false
  // proxy 是 Proxy 包装，不等于原始对象引用
</script>
```

3. **JSON.stringify 默认走 Proxy**

```svelte
<script lang="ts">
  let user = $state({ name: 'A' })
  // JSON.stringify(user) 可能受 Proxy 影响
  // 安全做法：先 snapshot
  const json = JSON.stringify($state.snapshot(user))
</script>
```

### `$state.raw` —— 浅响应式

适合：大对象、第三方库实例、不需要深层追踪的数据：

```svelte
<script lang="ts">
  // 整体替换才更新
  let map = $state.raw(new Map<string, number>())

  function addEntry(k: string, v: number) {
    // map.set(k, v)              // ❌ 不响应
    map = new Map(map).set(k, v)  // ✅ 整体替换
  }

  // 大数组（10000+ 元素）
  let bigList = $state.raw<Item[]>([])
  function update() {
    bigList = bigList.map(transform)  // ✅ 替换数组
  }
</script>
```

**何时用 `$state` 何时用 `$state.raw`**：

| 场景 | 推荐 |
|---|---|
| 表单数据 / 配置对象 / 用户对象 | `$state`（要改属性） |
| 来自后端的只读数据（替换式更新） | `$state.raw` |
| Map / Set / 类实例 | `$state.raw` |
| 大数组（性能敏感） | `$state.raw` |

### `$state.snapshot` —— 取出快照

```svelte
<script lang="ts">
  let user = $state({ name: 'Alice', tags: ['vue', 'react'] })

  function save() {
    // 取出干净 JS 对象
    const snapshot = $state.snapshot(user)
    localStorage.setItem('user', JSON.stringify(snapshot))
    // 或传给第三方库
    await api.save(snapshot)
  }
</script>
```

### `$derived` —— 计算值

```svelte
<script lang="ts">
  let firstName = $state('')
  let lastName = $state('')
  let age = $state(0)

  // 表达式版（最常用）
  let fullName = $derived(`${firstName} ${lastName}`)
  let isAdult = $derived(age >= 18)
  let initial = $derived(firstName[0]?.toUpperCase() ?? '?')
</script>
```

### `$derived.by` —— 多语句计算

```svelte
<script lang="ts">
  let numbers = $state<number[]>([1, 2, 3, 4, 5])

  // 函数版（多语句、复杂逻辑）
  let stats = $derived.by(() => {
    let sum = 0
    let max = -Infinity
    let min = Infinity
    for (const n of numbers) {
      sum += n
      if (n > max) max = n
      if (n < min) min = n
    }
    return {
      sum,
      avg: sum / numbers.length,
      max,
      min
    }
  })
</script>

<p>Sum: {stats.sum}, Avg: {stats.avg}</p>
```

**`$derived` 三特性**：

1. **懒计算**——只在被读取时才执行（与 Vue `computed` 同）
2. **自动追踪**——内部读取的 `$state` 自动成为依赖（不需要依赖数组）
3. **引用相等优化**——重算结果与上次相同时，下游不重渲染

**注意**：`$derived` 的表达式必须**无副作用**——不要在里面写 `console.log` / `fetch` / DOM 操作。需要副作用用 `$effect`。

### `$effect` —— 副作用

```svelte
<script lang="ts">
  let count = $state(0)

  $effect(() => {
    // 自动追踪：count 是依赖
    console.log('count is', count)
    document.title = `Count: ${count}`
  })

  // 带 cleanup
  $effect(() => {
    const timer = setInterval(() => count++, 1000)
    return () => clearInterval(timer)
  })

  // 写 localStorage
  $effect(() => {
    localStorage.setItem('count', String(count))
  })
</script>
```

**Effect 不要做的事**（与 React 一致）：

- ❌ **派生状态**——用 `$derived`
  ```svelte
  // ❌
  let fullName = $state('')
  $effect(() => { fullName = `${first} ${last}` })

  // ✅
  let fullName = $derived(`${first} ${last}`)
  ```

- ❌ **响应用户事件**——直接在 onclick 里写
  ```svelte
  // ❌
  let submitting = $state(false)
  $effect(() => { if (submitting) postData() })

  // ✅
  function handleSubmit() { postData() }
  ```

### `$effect.pre` —— DOM 更新前的 effect

```svelte
<script lang="ts">
  let messages = $state<Message[]>([])
  let container: HTMLDivElement

  // 在 DOM 更新前测量当前滚动位置
  let shouldScrollDown = $state(false)
  $effect.pre(() => {
    if (!container) return
    shouldScrollDown =
      container.scrollTop + container.clientHeight >= container.scrollHeight - 1

    // 触发依赖追踪
    messages.length
  })

  // DOM 更新后再滚动
  $effect(() => {
    if (shouldScrollDown) {
      container.scrollTop = container.scrollHeight
    }
  })
</script>

<div bind:this={container} class="chat">
  {#each messages as msg}
    <p>{msg.text}</p>
  {/each}
</div>
```

**`$effect.pre` 何时用**：

- 需要在 DOM 真正改变**之前**读取旧 DOM 测量值（scroll、size）
- 替代 Svelte 4 的 `beforeUpdate`

### `$effect.tracking()` —— 检查追踪上下文

```ts
// utils.ts
import { tick } from 'svelte'

export function watch(getter: () => unknown, callback: () => void) {
  if ($effect.tracking()) {
    // 在 effect 内 → 用 effect 包装
    $effect(() => {
      getter()
      return callback
    })
  } else {
    // 在组件外 / 普通函数 → 不能用 effect
    throw new Error('watch must be called within an effect context')
  }
}
```

**用途**：写**可在 effect 内外都被调用**的工具函数时，根据上下文选择策略。

### `$effect.root()` —— 手动管理的 effect 作用域

```ts
// app.ts
import { mount } from 'svelte'
import App from './App.svelte'

const cleanup = $effect.root(() => {
  let count = $state(0)

  $effect(() => {
    console.log('Outside component effect:', count)
  })

  // 模拟一些操作
  setInterval(() => count++, 1000)

  // 返回 cleanup
  return () => {
    console.log('Cleaning up root effect')
  }
})

// 卸载时
cleanup()
```

**用途**：在组件外（如插件、共享状态模块）想用 `$effect` 时使用。

### `$props` —— 组件输入

```svelte
<!-- Button.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    label: string
    variant?: 'primary' | 'secondary' | 'danger'
    disabled?: boolean
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  }

  let {
    label,
    variant = 'primary',
    disabled = false,
    onclick,
    children
  }: Props = $props()
</script>

<button class={variant} {disabled} {onclick}>
  {#if children}{@render children()}{:else}{label}{/if}
</button>
```

**`$props` 高级用法**：

```svelte
<script lang="ts">
  // 1. 重命名（属性名是关键字 / 数字 / 含连字符）
  let { class: className } = $props()
  let { 'data-id': dataId } = $props()

  // 2. Rest 收集所有其他 props
  let { variant, ...rest } = $props()
</script>

<!-- 把 rest 透传给底层元素 -->
<button class={variant} {...rest}>...</button>
```

### `$bindable` —— 双向绑定 prop

子组件想接受 `bind:` 必须显式声明：

```svelte
<!-- Modal.svelte -->
<script lang="ts">
  let { open = $bindable(false) }: { open?: boolean } = $props()
</script>

{#if open}
  <div class="modal">
    <button onclick={() => open = false}>Close</button>
  </div>
{/if}

<!-- 父组件 -->
<script lang="ts">
  let isOpen = $state(false)
</script>

<Modal bind:open={isOpen} />
<button onclick={() => isOpen = true}>Open Modal</button>
```

### `$inspect` —— 开发期响应式日志

```svelte
<script lang="ts">
  let count = $state(0)
  let user = $state({ name: 'Alice' })

  $inspect(count)               // 每次 count 变化都打印
  $inspect(count, user)         // 多值
  $inspect(count).with((type, value) => {
    // type: 'init' | 'update'
    console.log(type, value)
  })

  // 追踪 derived / effect 为什么重跑
  let doubled = $derived.by(() => {
    $inspect.trace('doubled')
    return count * 2
  })
</script>
```

::: tip `$inspect` 生产环境被剥离
`$inspect` 仅在 dev 模式有效，`vite build` 后会被编译成 no-op，可以放心散布。
:::

### `$host` —— 自定义元素宿主

仅在编译为 Custom Element（`<svelte:options customElement="my-button" />`）时可用，访问宿主元素：

```svelte
<svelte:options customElement="my-button" />

<script lang="ts">
  function dispatch() {
    $host().dispatchEvent(new CustomEvent('greet', { detail: 'hello' }))
  }
</script>

<button onclick={dispatch}>Greet</button>
```

## 模板语法详解

### 表达式与属性

```svelte
<script lang="ts">
  let name = $state('Svelte')
  let url = $state('https://svelte.dev')
  let count = $state(0)
  let active = $state(true)
</script>

<!-- 文本插值 -->
<h1>Hello, {name}!</h1>
<p>{name.toUpperCase()}</p>
<p>{count > 0 ? 'positive' : 'zero or negative'}</p>

<!-- 属性绑定 -->
<a href={url}>Link</a>
<a href="https://{name}.dev">Link</a>
<input value={name} disabled={count === 0} />

<!-- 短属性（同名） -->
<input {value} {disabled} />

<!-- 布尔属性 -->
<button {disabled}>Click</button>
<!-- disabled=true → 渲染 <button disabled> -->
<!-- disabled=false → 不渲染该属性 -->

<!-- Spread 属性 -->
<input {...$$restProps} />     <!-- Svelte 4 -->
<input {...rest} />            <!-- Svelte 5（来自 $props rest） -->
```

### `{#if}` / `{:else if}` / `{:else}`

```svelte
{#if user}
  <p>Hello, {user.name}!</p>
{:else if loading}
  <p>Loading...</p>
{:else}
  <p>Please log in</p>
{/if}

<!-- 嵌套也 OK -->
{#if user}
  {#if user.isAdmin}
    <AdminPanel />
  {:else}
    <UserPanel {user} />
  {/if}
{/if}
```

### `{#each}` —— 列表

```svelte
<script lang="ts">
  let users = $state([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
</script>

<!-- 基本：用 id 做 key -->
<ul>
  {#each users as user (user.id)}
    <li>{user.name}</li>
  {/each}
</ul>

<!-- 带 index -->
{#each users as user, i (user.id)}
  <li>{i + 1}. {user.name}</li>
{/each}

<!-- 解构 -->
{#each users as { id, name } (id)}
  <li>{name}</li>
{/each}

<!-- 空列表分支 -->
{#each users as user (user.id)}
  <li>{user.name}</li>
{:else}
  <p>No users</p>
{/each}

<!-- 双向绑定（key 一致时 Svelte 自动适配） -->
{#each items as item, i (item.id)}
  <input bind:value={items[i].name} />
{/each}
```

**`(item.id)` key 的重要性**：

- **有 key**：增删 / 排序时，Svelte 精确移动 DOM 节点，保留组件状态
- **无 key**：按 index 兜底，列表插入 / 移除时会复用错节点（如带 input 的 list）

### `{#await}` —— 异步

```svelte
<script lang="ts">
  let promise = $state<Promise<User>>(fetchUser())

  async function fetchUser(): Promise<User> {
    const res = await fetch('/api/me')
    if (!res.ok) throw new Error('Unauthorized')
    return res.json()
  }

  function reload() {
    promise = fetchUser()
  }
</script>

{#await promise}
  <p>Loading...</p>
{:then user}
  <p>Hello, {user.name}!</p>
{:catch error}
  <p style:color="red">Error: {error.message}</p>
{/await}

<button onclick={reload}>Reload</button>

<!-- 只关心 then -->
{#await promise then result}
  <p>{result}</p>
{/await}

<!-- 只关心 catch -->
{#await promise catch error}
  <p>{error.message}</p>
{/await}
```

### `{#key}` —— 强制重建

```svelte
<script lang="ts">
  let key = $state(0)
</script>

<!-- key 变化时，子树销毁重建（含组件状态、过渡触发） -->
{#key key}
  <Counter />
{/key}

<button onclick={() => key++}>Reset Counter</button>
```

**用途**：

- 重置子组件状态（Counter 重新归零）
- 触发过渡（结合 `transition:`）
- 路由变化时强制重建页面

### `{#snippet}` + `{@render}`

Svelte 5 的内容传递机制——替代 `<slot>`：

```svelte
<!-- DataTable.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props<T> {
    items: T[]
    row: Snippet<[T]>           // 单参数：每行收到 item
    empty?: Snippet
  }

  let { items, row, empty }: Props<unknown> = $props()
</script>

<table>
  <tbody>
    {#each items as item (item.id)}
      <tr>{@render row(item)}</tr>
    {:else}
      <tr><td>{empty ? @render empty() : 'No data'}</td></tr>
    {/each}
  </tbody>
</table>

<!-- 使用 -->
<DataTable items={users}>
  {#snippet row(user)}
    <td>{user.id}</td>
    <td>{user.name}</td>
    <td>{user.email}</td>
  {/snippet}

  {#snippet empty()}
    <p style:color="gray">No users yet.</p>
  {/snippet}
</DataTable>
```

**`{#snippet}` 与 `<slot>` 对比**：

| 维度 | Svelte 4 `<slot>` | Svelte 5 `{#snippet}` |
|---|---|---|
| 声明 | 子组件 `<slot name="x" />` | 子组件 `{@render x()}` |
| 传值给 slot | `<slot {value}>` + `let:value` | `{@render x(value)}` |
| 命名 | `slot="x"` 属性 | `{#snippet x()}` 块 |
| 实质 | 编译时绑定 | 真正的函数（可传参、复用） |

### `{@const}` —— 模板内常量

```svelte
{#each users as user (user.id)}
  {@const isAdmin = user.role === 'admin'}
  {@const initial = user.name[0].toUpperCase()}
  <li class:admin={isAdmin}>
    <span class="avatar">{initial}</span>
    {user.name}
  </li>
{/each}
```

### `{@html}` —— 原始 HTML

```svelte
<script lang="ts">
  let markdown = $state('<strong>Hello</strong>')
</script>

<!-- 直接渲染（注意 XSS） -->
<div>{@html markdown}</div>
```

::: warning 永远清洗用户输入
`{@html}` 不会转义，等同于 React `dangerouslySetInnerHTML`。来自用户的内容必须先经 [DOMPurify](https://github.com/cure53/DOMPurify) 清洗：

```ts
import DOMPurify from 'isomorphic-dompurify'
const clean = DOMPurify.sanitize(userInput)
```
:::

## 事件处理（Svelte 5）

### 基本 onclick

```svelte
<script lang="ts">
  let count = $state(0)

  function increment() {
    count++
  }

  function handleClick(e: MouseEvent) {
    e.preventDefault()
    console.log(e.clientX, e.clientY)
    count++
  }
</script>

<!-- 直接传函数 -->
<button onclick={increment}>+1</button>

<!-- 内联箭头函数（推荐传参时用） -->
<button onclick={() => count++}>+1</button>
<button onclick={() => alert('clicked')}>Alert</button>

<!-- 带类型的 handler -->
<button onclick={handleClick}>Detailed</button>
```

### 表单事件

```svelte
<script lang="ts">
  let formData = $state({ email: '', password: '' })

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()    // ← v4 的 |preventDefault 在 v5 用代码写
    console.log(formData)
  }

  function handleChange(e: Event) {
    const input = e.target as HTMLInputElement
    console.log(input.value)
  }
</script>

<form onsubmit={handleSubmit}>
  <input
    type="email"
    bind:value={formData.email}
    oninput={handleChange}
  />
  <input type="password" bind:value={formData.password} />
  <button type="submit">Login</button>
</form>
```

### 事件修饰符已废弃

Svelte 4 的 `|preventDefault` / `|stopPropagation` / `|self` / `|once` / `|capture` 在 Svelte 5 全部移除——直接在函数里写：

```svelte
<!-- Svelte 4（已废弃） -->
<form on:submit|preventDefault={save}>
<button on:click|stopPropagation={...}>
<button on:click|once={...}>

<!-- Svelte 5 -->
<form onsubmit={(e) => { e.preventDefault(); save() }}>
<button onclick={(e) => { e.stopPropagation(); ... }}>
<!-- once 需要在 effect / mount 里用 addEventListener({ once: true }) 或 use: action -->
```

### Capture 阶段事件

```svelte
<!-- 加 capture 后缀 -->
<div onclickcapture={handleCaptureClick}>
  <button onclick={handleClick}>Click</button>
</div>
```

## 表单与 `bind:`

### `bind:value`（文本输入）

```svelte
<script lang="ts">
  let text = $state('')
  let count = $state(0)
</script>

<input bind:value={text} />
<p>You typed: {text}</p>

<!-- number 类型自动转为 number -->
<input type="number" bind:value={count} />
<p>{count + 1}</p>

<!-- 显式 bind:value 转换 -->
<input bind:value={count} type="number" />
```

### `bind:checked`（checkbox）

```svelte
<script lang="ts">
  let agreed = $state(false)
</script>

<label>
  <input type="checkbox" bind:checked={agreed} />
  I agree to terms
</label>

<button disabled={!agreed}>Continue</button>
```

### `bind:group`（radio / checkbox 组）

```svelte
<script lang="ts">
  let favorite = $state('vue')
  let selected = $state<string[]>([])
</script>

<!-- Radio group -->
<label><input type="radio" bind:group={favorite} value="vue" /> Vue</label>
<label><input type="radio" bind:group={favorite} value="react" /> React</label>
<label><input type="radio" bind:group={favorite} value="svelte" /> Svelte</label>
<p>Favorite: {favorite}</p>

<!-- Checkbox group -->
<label><input type="checkbox" bind:group={selected} value="vue" /> Vue</label>
<label><input type="checkbox" bind:group={selected} value="react" /> React</label>
<label><input type="checkbox" bind:group={selected} value="svelte" /> Svelte</label>
<p>Selected: {selected.join(', ')}</p>
```

### `bind:` 高级

```svelte
<script lang="ts">
  let text = $state('')
  let select = $state('')
  let files = $state<FileList | null>(null)
  let video: HTMLVideoElement
  let inputEl: HTMLInputElement
</script>

<!-- Select -->
<select bind:value={select}>
  <option value="a">A</option>
  <option value="b">B</option>
</select>

<!-- Textarea -->
<textarea bind:value={text} />

<!-- File input -->
<input type="file" bind:files multiple />

<!-- bind:this 拿 DOM 引用 -->
<input bind:this={inputEl} />
<video bind:this={video} src="..." />

<button onclick={() => inputEl.focus()}>Focus</button>
```

### 媒体元素双向绑定

```svelte
<script lang="ts">
  let currentTime = $state(0)
  let duration = $state(0)
  let volume = $state(1)
  let paused = $state(true)
</script>

<video
  src="movie.mp4"
  bind:currentTime
  bind:duration
  bind:volume
  bind:paused
/>

<p>{currentTime.toFixed(1)} / {duration.toFixed(1)}s, vol: {volume}</p>
```

### `bind:` + 组件 prop

见 `getting-started.md` 的 `$bindable` 章节。

## 样式

### Scoped 默认

```svelte
<!-- Card.svelte -->
<div class="card">
  <h2>Title</h2>
</div>

<style>
  /* 选择器自动加 hash，仅作用本组件 */
  .card { padding: 16px; border: 1px solid #ddd; }
  h2 { font-size: 18px; }
</style>
```

编译后：

```html
<div class="card svelte-abc123">
  <h2 class="svelte-abc123">Title</h2>
</div>
<style>
  .card.svelte-abc123 { ... }
  h2.svelte-abc123 { ... }
</style>
```

### `:global(...)` 开洞

```svelte
<style>
  /* 仅本组件 .button */
  .button { padding: 8px; }

  /* 全局 .button（影响所有组件） */
  :global(.button) { font-family: sans-serif; }

  /* 子选择器全局 */
  .wrapper :global(strong) { color: red; }

  /* 整块全局 */
  :global {
    body { margin: 0; }
    h1 { font-weight: bold; }
  }
</style>
```

### 动态 class

```svelte
<script lang="ts">
  let active = $state(false)
  let size = $state<'sm' | 'md' | 'lg'>('md')
</script>

<!-- 普通属性 -->
<div class="btn {size} {active ? 'active' : ''}">Click</div>

<!-- class:name 指令（推荐） -->
<div class="btn" class:active>Click</div>
<div class:active={count > 5}>...</div>

<!-- Svelte 5：clsx 风格的对象 / 数组（实验性） -->
<div class={['btn', size, { active }]}>Click</div>
```

### `style:` 指令

```svelte
<script lang="ts">
  let color = $state('red')
  let size = $state(16)
</script>

<p style:color style:font-size={`${size}px`}>Hello</p>

<!-- 等价于 -->
<p style="color: {color}; font-size: {size}px;">Hello</p>
```

### CSS 自定义属性传递

```svelte
<!-- Parent.svelte -->
<Card --bg-color="lightblue" --text-color="darkblue" />

<!-- Card.svelte -->
<div class="card">Hello</div>

<style>
  .card {
    background: var(--bg-color, white);
    color: var(--text-color, black);
  }
</style>
```

## 过渡与动画

### `transition:`（双向过渡）

```svelte
<script lang="ts">
  import { fade, fly, slide, scale, blur } from 'svelte/transition'
  let visible = $state(true)
</script>

<button onclick={() => visible = !visible}>Toggle</button>

{#if visible}
  <div transition:fade={{ duration: 300 }}>Fade</div>
  <div transition:fly={{ y: 50, duration: 400 }}>Fly</div>
  <div transition:slide={{ axis: 'y' }}>Slide</div>
  <div transition:scale={{ start: 0.5 }}>Scale</div>
  <div transition:blur={{ amount: 10 }}>Blur</div>
{/if}
```

### `in:` / `out:`（单向）

```svelte
<script lang="ts">
  import { fly, fade } from 'svelte/transition'
  let visible = $state(true)
</script>

{#if visible}
  <!-- 进入 fly，退出 fade -->
  <div in:fly={{ y: 50 }} out:fade>Hello</div>
{/if}
```

### `animate:`（列表项重排）

```svelte
<script lang="ts">
  import { flip } from 'svelte/animate'
  let todos = $state([
    { id: 1, text: 'A' },
    { id: 2, text: 'B' },
    { id: 3, text: 'C' }
  ])

  function shuffle() {
    todos = todos.sort(() => Math.random() - 0.5)
  }
</script>

<button onclick={shuffle}>Shuffle</button>
<ul>
  {#each todos as todo (todo.id)}
    <li animate:flip={{ duration: 300 }}>{todo.text}</li>
  {/each}
</ul>
```

### `easing` 缓动函数

```svelte
<script lang="ts">
  import { fly } from 'svelte/transition'
  import { cubicOut, bounceOut, elasticOut } from 'svelte/easing'
</script>

<div transition:fly={{ y: 50, duration: 600, easing: bounceOut }}>Bounce</div>
```

### `crossfade` —— 元素跨容器过渡

```svelte
<script lang="ts">
  import { crossfade } from 'svelte/transition'

  const [send, receive] = crossfade({ duration: 400 })

  let todos = $state([
    { id: 1, text: 'A', done: false },
    { id: 2, text: 'B', done: true }
  ])

  let active = $derived(todos.filter(t => !t.done))
  let completed = $derived(todos.filter(t => t.done))
</script>

<div class="lists">
  <ul>
    {#each active as todo (todo.id)}
      <li in:receive={{ key: todo.id }} out:send={{ key: todo.id }}>
        <input type="checkbox" bind:checked={todo.done} />
        {todo.text}
      </li>
    {/each}
  </ul>
  <ul>
    {#each completed as todo (todo.id)}
      <li in:receive={{ key: todo.id }} out:send={{ key: todo.id }}>
        <input type="checkbox" bind:checked={todo.done} />
        {todo.text}
      </li>
    {/each}
  </ul>
</div>
```

### 自定义过渡

```ts
// myTransition.ts
import type { TransitionConfig } from 'svelte/transition'

export function whirl(node: Element, params?: { duration?: number }): TransitionConfig {
  return {
    duration: params?.duration ?? 400,
    css: (t, u) => `
      transform: scale(${t}) rotate(${u * 720}deg);
      opacity: ${t};
    `
  }
}
```

```svelte
<script lang="ts">
  import { whirl } from './myTransition'
  let visible = $state(true)
</script>

{#if visible}
  <div transition:whirl={{ duration: 600 }}>Spinning!</div>
{/if}
```

## 生命周期

### `onMount` —— 挂载后

```svelte
<script lang="ts">
  import { onMount } from 'svelte'

  let ref: HTMLDivElement
  let data = $state<Item[]>([])

  onMount(async () => {
    // 1. 客户端独占（SSR 不跑）
    ref.focus()

    // 2. 取数据
    const res = await fetch('/api/items')
    data = await res.json()

    // 3. 返回 cleanup
    const handler = () => console.log('online')
    window.addEventListener('online', handler)
    return () => window.removeEventListener('online', handler)
  })
</script>

<div bind:this={ref}>Loaded {data.length} items</div>
```

### `onDestroy` —— 卸载前

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  let timer: number

  onMount(() => {
    timer = window.setInterval(() => console.log('tick'), 1000)
  })

  onDestroy(() => {
    clearInterval(timer)
    console.log('Component destroyed')
  })
</script>
```

::: tip onMount return cleanup 是 onDestroy 的简写
两种等价写法：

```ts
// 用 onMount return
onMount(() => {
  const timer = setInterval(...)
  return () => clearInterval(timer)
})

// 用 onMount + onDestroy
let timer
onMount(() => { timer = setInterval(...) })
onDestroy(() => clearInterval(timer))
```

前者更紧凑。`onDestroy` 在 SSR 也会跑（清理服务端资源），`onMount` 不跑。
:::

### `tick` —— 等待 DOM 更新

```svelte
<script lang="ts">
  import { tick } from 'svelte'
  let count = $state(0)

  async function clickAndMeasure() {
    count++
    // count++ 后 DOM 尚未更新
    console.log(document.querySelector('p')?.textContent)  // 旧值

    await tick()
    // 现在 DOM 已更新
    console.log(document.querySelector('p')?.textContent)  // 新值
  }
</script>

<button onclick={clickAndMeasure}>Click</button>
<p>{count}</p>
```

### `untrack` —— 读值不追踪

```svelte
<script lang="ts">
  import { untrack } from 'svelte'

  let a = $state(0)
  let b = $state(0)

  $effect(() => {
    console.log('a:', a)              // 追踪 a
    console.log('b:', untrack(() => b))  // 读 b 但不追踪
  })

  // 现在只有 a 变化才触发 effect
</script>
```

### Svelte 4 → 5 生命周期变化

| Svelte 4 | Svelte 5 |
|---|---|
| `onMount` | 保留（建议改用 `$effect`） |
| `onDestroy` | 保留（建议改用 `$effect` return cleanup） |
| `beforeUpdate` | **已 deprecated**，用 `$effect.pre` |
| `afterUpdate` | **已 deprecated**，用 `$effect` |
| `tick` | 保留 |

`beforeUpdate` / `afterUpdate` 的问题是「**任何状态变化都触发**」——没有依赖控制。`$effect.pre` / `$effect` 通过显式读取追踪解决了这个问题。

## Stores（Svelte 4 兼容）

### `writable` —— 可读可写

```ts
// stores/counter.ts
import { writable } from 'svelte/store'

export const count = writable(0)

// 操作
count.set(5)
count.update(n => n + 1)
count.subscribe(value => console.log(value))  // 返回 unsubscribe
```

```svelte
<!-- 在组件里用 $ 自动订阅 -->
<script lang="ts">
  import { count } from './stores/counter'
</script>

<p>{$count}</p>
<button onclick={() => $count++}>+1</button>
<button onclick={() => count.set(0)}>Reset</button>
```

**`$` 自动订阅**：

- 在 `<script>` 顶层或模板中读 `$count` —— 自动 subscribe + cleanup
- 写 `$count = 5` —— 等价 `count.set(5)`
- 离开作用域自动 unsubscribe

### `readable` —— 仅读

```ts
import { readable } from 'svelte/store'

// 当前时间 store
export const time = readable(new Date(), set => {
  const interval = setInterval(() => set(new Date()), 1000)
  return () => clearInterval(interval)
})
```

```svelte
<script lang="ts">
  import { time } from './stores/time'
</script>

<p>{$time.toLocaleTimeString()}</p>
```

### `derived` —— 派生 store

```ts
import { writable, derived } from 'svelte/store'

export const count = writable(0)
export const doubled = derived(count, $count => $count * 2)
export const tripled = derived(count, $count => $count * 3)

// 多个依赖
export const summary = derived(
  [count, doubled],
  ([$count, $doubled]) => `${$count} doubled is ${$doubled}`
)

// 异步 derived
export const userInfo = derived(userId, ($id, set) => {
  fetch(`/api/users/${$id}`)
    .then(r => r.json())
    .then(set)
}, null)  // 初始值
```

### `get` —— 一次性取值

```ts
import { get } from 'svelte/store'
import { count } from './stores/counter'

function logCurrent() {
  console.log(get(count))   // 不订阅，仅读当前
}
```

### `readonly` —— 只读包装

```ts
import { writable, readonly } from 'svelte/store'

const _user = writable(null)
export const user = readonly(_user)         // 暴露只读
export function setUser(u: User) { _user.set(u) }
```

### 自定义 store

任何对象只要符合 store contract（有 `subscribe` 方法）就是 store：

```ts
// stores/persistent.ts
import { writable, type Writable } from 'svelte/store'

export function persistent<T>(key: string, initial: T): Writable<T> {
  const stored = localStorage.getItem(key)
  const store = writable<T>(stored ? JSON.parse(stored) : initial)

  store.subscribe(value => {
    localStorage.setItem(key, JSON.stringify(value))
  })

  return store
}

// 使用
import { persistent } from './stores/persistent'
export const theme = persistent('theme', 'light')
```

### Stores vs Runes —— 选哪个？

| 场景 | 推荐 |
|---|---|
| 单组件状态 | `$state` |
| 父子共享 | `$props` + `$bindable` 或 prop 传递 |
| 跨组件共享（兄弟） | `$state` + `.svelte.ts` 模块导出 |
| 跨多个不相关组件 | Context API 或 stores |
| 全局唯一（用户、主题） | stores 或 `.svelte.ts` 单例 |
| 异步流（WebSocket、订阅） | stores（更适合命令式订阅） |

**Svelte 5 推荐**：新代码优先用 `$state` + `.svelte.ts` 模块；stores 仅在需要外部订阅 / 异步流 / 兼容老代码时用。

### `.svelte.ts` 模块化共享状态

```ts
// stores/counter.svelte.ts
let _count = $state(0)

export function getCount() { return _count }
export function increment() { _count++ }
export function reset() { _count = 0 }

// 或导出 getter（保持响应）
export const counter = {
  get count() { return _count },
  increment() { _count++ },
  reset() { _count = 0 }
}
```

```svelte
<!-- 任意组件 -->
<script lang="ts">
  import { counter } from './stores/counter.svelte'
</script>

<p>{counter.count}</p>
<button onclick={counter.increment}>+1</button>
```

::: tip 必须用 .svelte.ts 后缀
普通 `.ts` 文件不会被 Svelte 编译，`$state` 等 Runes 无效。要用 Runes 的工具模块必须命名 `.svelte.ts` 或 `.svelte.js`。
:::

## Context API

跨组件层级共享值（替代 prop drilling）：

```svelte
<!-- App.svelte（顶层） -->
<script lang="ts">
  import { setContext } from 'svelte'

  let theme = $state<'light' | 'dark'>('light')

  // 用 Symbol 作为 key 避免冲突
  setContext('theme', {
    get value() { return theme },
    toggle() { theme = theme === 'light' ? 'dark' : 'light' }
  })
</script>

<DeepChild />

<!-- DeepChild.svelte（任意层级深处） -->
<script lang="ts">
  import { getContext } from 'svelte'

  const theme = getContext<{ value: string; toggle: () => void }>('theme')
</script>

<p>Theme: {theme.value}</p>
<button onclick={theme.toggle}>Toggle</button>
```

### 类型安全的 Context（推荐）

```ts
// theme-context.ts
import { getContext, setContext } from 'svelte'

interface ThemeContext {
  value: 'light' | 'dark'
  toggle(): void
}

const KEY = Symbol('theme')

export function setThemeContext(ctx: ThemeContext) {
  setContext(KEY, ctx)
}

export function getThemeContext(): ThemeContext {
  return getContext<ThemeContext>(KEY)
}
```

```svelte
<!-- 提供 -->
<script lang="ts">
  import { setThemeContext } from './theme-context'
  let theme = $state<'light' | 'dark'>('light')

  setThemeContext({
    get value() { return theme },
    toggle() { theme = theme === 'light' ? 'dark' : 'light' }
  })
</script>

<!-- 消费 -->
<script lang="ts">
  import { getThemeContext } from './theme-context'
  const theme = getThemeContext()
</script>
```

### Context vs Stores 选择

| 场景 | Context | Stores |
|---|---|---|
| 主题、用户身份 | ✅ | OK |
| 表单深层共享 | ✅ | 也 OK |
| 全局唯一（router、i18n） | ✅（推荐） | 都 OK |
| 跨多个独立组件树 | ❌（context 限组件树） | ✅ |
| 在 `.ts` 模块里订阅 | ❌ | ✅ |

**Context 的限制**：必须在组件 `<script>` 顶层调用 `setContext` / `getContext`（不能在事件回调、async 内）。

## 小结

- **Runes**（`$state` / `$derived` / `$effect` / `$props` / `$bindable` / `$inspect` / `$host`）是 Svelte 5 响应式核心
- **模板控制流**（`{#if}` / `{#each}` / `{#await}` / `{#key}` / `{#snippet}`）覆盖大多数模板需求
- **`{#snippet}` + `{@render}`** 替代 Svelte 4 的 `<slot>`
- **事件 onclick** 替代 `on:click`；修饰符已废弃
- **`bind:`** 双向绑定，组件 prop 用 `$bindable` 显式声明
- **`<style>` 默认 scoped**；`:global()` 显式开洞
- **过渡 / 动画** 内置（`transition:` / `in:` / `out:` / `animate:`）零依赖
- **Stores** 仍可用，但新代码优先 `$state` + `.svelte.ts` 模块共享
- **Context API** 跨层级共享值

下一章 `advanced.md` 进入 SvelteKit、状态库选型、TypeScript 深入、测试、动画系统、特殊元素与 Actions。
