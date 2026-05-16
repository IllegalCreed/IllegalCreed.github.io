---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Alpine.js 3.x 编写 —— 15 个指令 / 9 魔术属性 / Stores / 自定义事件 / 插件生态 / Livewire / HTMX / SSR 框架集成 / 测试 / 性能 / 对比

## 15 个指令：全集

### `x-data`：声明响应式作用域

所有 Alpine 行为的「根」——`x-data` 标记一个 HTML 块为 Alpine 组件，里面声明的状态对当前元素及其后代可见。

```html
<!-- 内联对象 -->
<div x-data="{ open: false, count: 0 }">
  <button @click="open = !open">Toggle</button>
  <span x-text="count"></span>
</div>

<!-- 空作用域（仅启用指令） -->
<button x-data @click="alert('Hi')">Click</button>

<!-- 单元素组件 -->
<button x-data="{ label: 'Click me' }" x-text="label"></button>

<!-- 引用 Alpine.data() 注册的组件 -->
<div x-data="dropdown">
  <button @click="toggle">Menu</button>
  <div x-show="open">...</div>
</div>
```

### `x-init`：初始化逻辑

元素首次被 Alpine 处理时执行（在第一次 DOM 更新前）：

```html
<!-- 内联 -->
<div x-data="{ posts: [] }" x-init="posts = await (await fetch('/posts')).json()">
  <template x-for="post in posts">
    <article x-text="post.title"></article>
  </template>
</div>

<!-- 方法形式（推荐复杂逻辑） -->
<div x-data="{
  posts: [],
  async init() {
    this.posts = await (await fetch('/posts')).json()
  }
}">
</div>
```

::: tip `init()` vs `x-init`
两者都会被自动调用。`init()` 方法**先于** `x-init` 执行；如果只用 `Alpine.data()`，推荐 `init()` 方法形式（更结构化）。
:::

### `x-show`：切换显示（CSS）

通过 `display: none` 切换，元素**保留在 DOM**：

```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open">Content</div>

  <!-- 配合 transition -->
  <div x-show="open" x-transition>Animated</div>

  <!-- !important 优先级 -->
  <div x-show.important="open">High priority</div>
</div>
```

### `x-if`：条件渲染（DOM 增删）

真正的 DOM 增删，必须用 `<template>` 包裹：

```html
<template x-if="open">
  <div>Content (added/removed from DOM)</div>
</template>
```

**`x-if` vs `x-show`**：

| 维度 | `x-show` | `x-if` |
|---|---|---|
| 实现 | `display: none` | DOM 增删 |
| 元素存在 | 始终在 DOM 中 | 切换时新建/移除 |
| 性能 | 切换快 | 销毁重建有成本 |
| 适合 | 频繁切换 | 不常切换 / 重内容 |
| 父元素要求 | 任意 | 必须 `<template>` |

### `x-bind`：绑定属性

```html
<!-- 完整语法 -->
<input x-bind:placeholder="placeholderText">

<!-- 简写 -->
<input :placeholder="placeholderText">

<!-- 布尔属性（false 移除属性） -->
<button :disabled="loading">Save</button>

<!-- class 对象语法 -->
<div :class="{ 'active': isActive, 'error': hasError }">

<!-- class 三元 -->
<div :class="isActive ? 'active' : ''">

<!-- class 字符串（覆盖） -->
<div :class="`base ${isActive ? 'active' : ''}`">

<!-- 与已有 class 合并（不覆盖） -->
<div class="opacity-50" :class="hide && 'hidden'">

<!-- style 对象语法 -->
<div :style="{ color: 'red', fontSize: '14px' }">

<!-- 批量绑定（spread） -->
<button x-bind="commonButtonProps">Click</button>
```

`Alpine.bind()` 注册可复用属性集：

```js
Alpine.bind('CommonButton', () => ({
  type: 'button',
  '@click'() { this.handleClick() },
  ':disabled'() { return this.loading },
  ':aria-label'() { return this.label },
}))
```

### `x-on`：事件监听

```html
<!-- 完整语法 -->
<button x-on:click="count++">+1</button>

<!-- 简写 -->
<button @click="count++">+1</button>

<!-- 访问 $event -->
<button @click="$event.target.remove()">Remove me</button>

<!-- 传方法（自动接 $event） -->
<button @click="handleClick">Click</button>

<!-- 传参数 -->
<button @click="handleClick(item.id)">Delete</button>
```

**事件修饰符**（顺序敏感）：

| 修饰符 | 作用 |
|---|---|
| `.prevent` | `event.preventDefault()` |
| `.stop` | `event.stopPropagation()` |
| `.outside` | 元素外部触发（用于「点其他地方关闭弹窗」） |
| `.window` | 在 window 上监听 |
| `.document` | 在 document 上监听 |
| `.once` | 只触发一次 |
| `.debounce` / `.debounce.500ms` | 防抖（默认 250ms） |
| `.throttle` / `.throttle.300ms` | 节流（默认 250ms） |
| `.self` | 仅元素自身触发（target === currentTarget） |
| `.capture` | 捕获阶段 |
| `.passive` | passive 监听（提示浏览器优化 scroll） |
| `.camel` | 把事件名 kebab → camelCase（用于自定义事件名） |
| `.dot` | 把事件名中 `.` 替换（自定义事件特殊场景） |

**键盘修饰符**：

| 修饰符 | 按键 |
|---|---|
| `.enter` | Enter |
| `.escape` / `.esc` | Esc |
| `.tab` | Tab |
| `.space` | Space |
| `.up` / `.down` / `.left` / `.right` | 方向键 |
| `.cmd` / `.meta` | Cmd（Mac） |
| `.ctrl` | Ctrl |
| `.shift` | Shift |
| `.alt` | Alt |
| `.{key名}` | 任意 `event.key` 值（kebab） |

```html
<!-- 组合修饰符 -->
<input @keyup.enter.prevent="submit">
<input @keyup.shift.enter="submitNewline">
<input @keyup.cmd.k="openSearch">
<input @keydown.escape="close">

<!-- 全局事件 -->
<div @keyup.escape.window="closeAllModals"></div>
<div @click.outside="close"></div>

<!-- 自定义事件 -->
<div @custom-event.window="handler">
<button @click="$dispatch('custom-event', { id: 1 })">Dispatch</button>

<!-- 防抖 + 节流 -->
<input @input.debounce.500ms="search">
<div @scroll.throttle.100ms="onScroll">
```

### `x-text`：渲染文本

```html
<span x-text="user.name"></span>

<!-- 等价于 -->
<span>{{ user.name }}</span>  <!-- ⚠️ 这是 Vue 的 mustache 写法，Alpine 不支持 -->

<!-- 复杂表达式 -->
<span x-text="`Hello, ${user.name}!`"></span>
<span x-text="items.length > 0 ? `${items.length} items` : 'Empty'"></span>
```

### `x-html`：渲染 HTML

```html
<!-- ⚠️ 仅用于受信任内容，否则 XSS 风险 -->
<div x-html="markdownContent"></div>
```

### `x-model`：双向绑定

```html
<!-- text -->
<input x-model="message">

<!-- textarea -->
<textarea x-model="description"></textarea>

<!-- checkbox（布尔值） -->
<input type="checkbox" x-model="agreed">

<!-- checkbox（数组值，多选） -->
<input type="checkbox" value="apple" x-model="fruits">
<input type="checkbox" value="banana" x-model="fruits">

<!-- radio -->
<input type="radio" name="size" value="m" x-model="size">

<!-- select 单选 -->
<select x-model="country">
  <option value="cn">China</option>
  <option value="us">US</option>
</select>

<!-- select 多选 -->
<select multiple x-model="tags">
  <option value="vue">Vue</option>
  <option value="alpine">Alpine</option>
</select>

<!-- range -->
<input type="range" min="0" max="100" x-model.number="volume">
```

**`x-model` 修饰符**：

| 修饰符 | 作用 |
|---|---|
| `.lazy` | 用 `change` 事件而不是 `input`（失焦才更新） |
| `.number` | 自动转为数字 |
| `.boolean` | 转 `'true'` / `'false'` 为布尔 |
| `.debounce.500ms` | 防抖 |
| `.throttle.500ms` | 节流 |
| `.fill` | 让 input 的 value 属性回填到空 state 中 |

```html
<input x-model.lazy="name">
<input x-model.number="age" type="number">
<input x-model.debounce.500ms="search">
<input x-model.fill="title" value="预填的标题"> <!-- title 初始为空时用 value 填充 -->
```

### `x-modelable`：让自定义组件支持 `x-model`

允许把组件内部 state 暴露为 `x-model` 的目标：

```html
<!-- 自定义组件：暴露 count 给外部 x-model -->
<div x-data="{ count: 0 }" x-modelable="count">
  <!-- 这里 count 会与外部 number 双向同步 -->
  <button @click="count++">+1</button>
</div>

<!-- 父组件 -->
<div x-data="{ number: 5 }">
  <div x-data="{ count: 0 }" x-modelable="count" x-model="number">
    <!-- 内部 count 与 number 同步 -->
  </div>
  <p>Outside: <span x-text="number"></span></p>
</div>
```

### `x-for`：列表渲染

必须用 `<template>` 包裹，内部只能有**一个根元素**：

```html
<!-- 数组 -->
<template x-for="item in items" :key="item.id">
  <li x-text="item.name"></li>
</template>

<!-- 带索引 -->
<template x-for="(item, index) in items" :key="item.id">
  <li><span x-text="index + 1"></span>. <span x-text="item.name"></span></li>
</template>

<!-- 对象（key, value） -->
<template x-for="(value, key) in user" :key="key">
  <li><b x-text="key"></b>: <span x-text="value"></span></li>
</template>

<!-- 范围循环 -->
<template x-for="i in 10">
  <span x-text="i"></span>
</template>
```

::: warning `:key` 的重要性
重排序时如果不写 `:key`，Alpine 复用元素的策略可能保留旧的内部 state（如展开/折叠状态），导致 bug。**有 reorder 的列表必加 `:key`**。
:::

### `x-transition`：过渡动画

`x-transition` 仅与 `x-show` 配合（或某些插件）：

```html
<!-- 默认过渡（fade + scale） -->
<div x-show="open" x-transition>Content</div>

<!-- 修饰符 -->
<div x-show="open" x-transition.duration.500ms>Content</div>
<div x-show="open" x-transition:enter.duration.500ms x-transition:leave.duration.300ms>Content</div>
<div x-show="open" x-transition.delay.50ms>Content</div>
<div x-show="open" x-transition.opacity>Only fade (no scale)</div>
<div x-show="open" x-transition.scale.80>Scale 80%</div>
<div x-show="open" x-transition.scale.origin.top.right>Scale from top-right</div>

<!-- 自定义类（配合 Tailwind） -->
<div x-show="open"
  x-transition:enter="transition ease-out duration-300"
  x-transition:enter-start="opacity-0 transform scale-90"
  x-transition:enter-end="opacity-100 transform scale-100"
  x-transition:leave="transition ease-in duration-300"
  x-transition:leave-start="opacity-100 transform scale-100"
  x-transition:leave-end="opacity-0 transform scale-90"
>
  Content
</div>
```

### `x-effect`：自动追踪响应式表达式

类似 Vue 的 `watchEffect`——读到什么追踪什么：

```html
<div x-data="{ label: 'Hello' }" x-effect="console.log(label)">
  <!-- label 变化时自动重跑 console.log -->
  <button @click="label = 'World'">Change</button>
</div>

<!-- 多个依赖自动追踪 -->
<div x-data="{ a: 1, b: 2 }" x-effect="document.title = `${a} + ${b} = ${a + b}`">
  <button @click="a++">a++</button>
  <button @click="b++">b++</button>
</div>
```

**`x-effect` vs `$watch`**：

| 维度 | `x-effect` | `$watch` |
|---|---|---|
| 依赖 | 自动追踪 | 显式指定属性名 |
| 触发 | 首次 + 依赖变化 | 仅依赖变化（不首次跑） |
| 旧值 | 无 | 有 `(newVal, oldVal)` |
| 适合 | 副作用 / 同步 DOM | 监听特定字段 |

### `x-ignore`：跳过初始化

让 Alpine 忽略某段 DOM（用于第三方脚本接管或避免冲突）：

```html
<div x-data="{ label: 'From Alpine' }">
  <span x-text="label"></span> <!-- 渲染 "From Alpine" -->

  <div x-ignore>
    <span x-text="label"></span> <!-- 不会被处理，保持原始 HTML -->
  </div>
</div>
```

### `x-ref`：引用 DOM 元素

```html
<div x-data>
  <input x-ref="emailInput" type="email">
  <button @click="$refs.emailInput.focus()">Focus</button>
</div>
```

### `x-cloak`：隐藏未初始化内容

```css
/* 必须有这条 CSS */
[x-cloak] { display: none !important; }
```

```html
<div x-cloak x-data="{ count: 0 }">
  <!-- 初始化前隐藏，Alpine 启动后移除 x-cloak 属性 -->
  <span x-text="count"></span>
</div>
```

### `x-teleport`：传送到 DOM 其他位置

```html
<!-- 把 modal 渲染到 body 末尾（避开 z-index / overflow 问题） -->
<template x-teleport="body">
  <div x-show="open" class="modal">
    <p>Modal content</p>
  </div>
</template>
```

### `x-id`：唯一 ID 作用域

```html
<!-- 同 $id 多次调用返回同一个生成 ID -->
<div x-data x-id="['text-input']">
  <label :for="$id('text-input')">Name</label>
  <input :id="$id('text-input')" type="text">
</div>
```

## 9 个魔术属性：全集

### `$el`：当前 DOM 元素

```html
<button @click="$el.innerHTML = 'Clicked!'">Click me</button>
```

### `$refs`：引用集合

```html
<div x-data>
  <button @click="$refs.input.focus()">Focus</button>
  <input x-ref="input">
</div>
```

### `$store`：全局 store 访问

```html
<div x-data>
  <button @click="$store.darkMode.toggle()">
    Current: <span x-text="$store.darkMode.on ? 'Dark' : 'Light'"></span>
  </button>
</div>

<script>
  document.addEventListener('alpine:init', () => {
    Alpine.store('darkMode', {
      on: false,
      toggle() { this.on = !this.on },
    })
  })
</script>
```

### `$watch`：监听特定属性

```html
<div x-data="{
  search: '',
  init() {
    this.$watch('search', (value, oldValue) => {
      console.log(`changed from ${oldValue} to ${value}`)
    })
  }
}">
  <input x-model="search">
</div>
```

支持嵌套属性：

```js
this.$watch('user.profile.name', value => console.log(value))
```

::: warning 监听器无限循环
不要在 `$watch` 回调内修改被监听的对象本身——会触发自身重跑形成无限循环。
:::

### `$dispatch`：派发自定义事件

```html
<!-- 简单派发 -->
<button @click="$dispatch('opened')">Open</button>
<div @opened="open = true">...</div>

<!-- 带数据 -->
<button @click="$dispatch('notify', { message: 'Saved!' })">Save</button>
<div @notify.window="msg = $event.detail.message">
  <p x-text="msg"></p>
</div>

<!-- 跨组件通信用 .window -->
<button @click="$dispatch('user:login', { id: 123 }, { bubbles: true })">Login</button>
```

事件默认会 `bubbles: true`——除非用 `.stop` 阻止冒泡。

### `$nextTick`：等待 DOM 更新完成

```html
<div x-data="{
  count: 0,
  async increment() {
    this.count++
    await this.$nextTick()
    console.log(this.$el.textContent) // DOM 已更新
  }
}">
  <button @click="increment">+1 <span x-text="count"></span></button>
</div>
```

### `$root`：找最近的 `x-data` 根元素

```html
<div x-data data-message="Hello World!">
  <div>
    <button @click="alert($root.dataset.message)">Show</button>
  </div>
</div>
```

### `$data`：当前 reactive scope 整体

```html
<div x-data="{ count: 0, label: 'Hi' }">
  <!-- 把整个 scope 传给函数 -->
  <button @click="logScope($data)">Log</button>
</div>
```

适合写「跨组件工具函数」。日常很少用。

### `$id`：生成唯一 ID

```html
<div x-data x-id="['email']">
  <label :for="$id('email')">Email</label>
  <input :id="$id('email')" type="email">
</div>

<!-- 同 $id 多次调用 → 同一个 ID -->
<div x-data x-id="['list-item']">
  <ul>
    <template x-for="(item, i) in items">
      <li :id="$id('list-item', [i])" x-text="item"></li>
    </template>
  </ul>
</div>
```

## 全局 API：3 个核心

### `Alpine.data()`：注册可复用组件

最重要的「组件化」API：

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('dropdown', () => ({
    open: false,

    // 自动调用
    init() {
      console.log('mounted')
      this.$watch('open', v => console.log('open =', v))
    },

    toggle() {
      this.open = !this.open
    },

    // 自动调用（unmount 时）
    destroy() {
      console.log('cleanup')
    },
  }))
})
```

```html
<!-- 多处复用 -->
<div x-data="dropdown">
  <button @click="toggle">Menu A</button>
  <div x-show="open">...</div>
</div>

<div x-data="dropdown">
  <button @click="toggle">Menu B</button>
  <div x-show="open">...</div>
</div>
```

**带参数**：

```js
Alpine.data('counter', (start = 0, step = 1) => ({
  count: start,
  step,
  increment() { this.count += this.step },
}))
```

```html
<div x-data="counter(10, 2)">
  <button @click="increment">+2 <span x-text="count"></span></button>
</div>
```

### `Alpine.store()`：全局响应式 store

```js
document.addEventListener('alpine:init', () => {
  Alpine.store('cart', {
    items: [],

    init() {
      // store 也有 init()
      this.items = JSON.parse(localStorage.getItem('cart') || '[]')
    },

    get total() {
      return this.items.reduce((sum, i) => sum + i.price, 0)
    },

    add(item) {
      this.items.push(item)
      localStorage.setItem('cart', JSON.stringify(this.items))
    },

    clear() {
      this.items = []
      localStorage.removeItem('cart')
    },
  })
})
```

```html
<!-- 任何组件都能访问 -->
<div x-data>
  <p>Items: <span x-text="$store.cart.items.length"></span></p>
  <p>Total: $<span x-text="$store.cart.total"></span></p>
  <button @click="$store.cart.clear()">Clear</button>
</div>
```

**单值 store**：

```js
Alpine.store('darkMode', false)
// 修改：$store.darkMode = !$store.darkMode
```

### `Alpine.bind()`：注册可复用属性集

```js
Alpine.bind('PrimaryButton', () => ({
  type: 'button',
  class: 'btn-primary',
  '@click'() { this.handleClick() },
  ':disabled'() { return this.loading },
}))
```

```html
<button x-data="{ loading: false, handleClick() { ... } }" x-bind="PrimaryButton">
  Save
</button>
```

## 9 个官方插件：场景与用法

### `@alpinejs/persist`：状态持久化

```html
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/persist@3.x.x/dist/cdn.min.js"></script>
```

```html
<div x-data="{
  count: $persist(0),                          // localStorage（默认）
  open: $persist(false).as('sidebar-open'),    // 自定义 key
  draft: $persist('').using(sessionStorage),   // sessionStorage
}">
  <button @click="count++">+1 <span x-text="count"></span></button>
</div>
```

```js
// 配合 Alpine.store + $persist
Alpine.store('settings', {
  theme: Alpine.$persist('light').as('theme'),
  fontSize: Alpine.$persist(14).as('fontSize'),
})
```

### `@alpinejs/intersect`：视口检测

```html
<div x-data="{ shown: false }">
  <!-- 进入视口时 -->
  <div x-intersect="shown = true">
    <span x-show="shown">Hello!</span>
  </div>

  <!-- 进入时 -->
  <div x-intersect:enter="loadMore()"></div>

  <!-- 离开时 -->
  <div x-intersect:leave="paused = true"></div>

  <!-- 只触发一次 -->
  <div x-intersect.once="trackView()"></div>

  <!-- 阈值 -->
  <div x-intersect.half="halfVisible = true"></div>    <!-- 50% -->
  <div x-intersect.full="fullyVisible = true"></div>   <!-- 99% -->
  <div x-intersect.threshold.30="visible = true"></div>

  <!-- 视口边距 -->
  <div x-intersect.margin.200px="trigger200before = true"></div>
</div>
```

常见场景：**无限滚动**、**懒加载图片**、**滚动进度统计**、**进入视口动画**。

### `@alpinejs/mask`：输入掩码

```html
<!-- 数字日期 -->
<input x-mask="99/99/9999" placeholder="MM/DD/YYYY">

<!-- 电话 -->
<input x-mask="(999) 999-9999">

<!-- 字母混合 -->
<input x-mask="aaa-9999">

<!-- 任意字符 -->
<input x-mask="****-****">

<!-- 动态 mask（信用卡） -->
<input x-mask:dynamic="
  ['34', '37'].includes($input.slice(0, 2))
    ? '9999 999999 99999'    // Amex
    : '9999 9999 9999 9999'  // 标准卡
">

<!-- 货币 -->
<input x-mask:dynamic="$money($input, '.', ',', 2)">
```

占位符：`9` 数字 / `a` 字母 / `*` 任意字符。

### `@alpinejs/morph`：DOM 差量更新

把 DOM 「morph」到新 HTML，**保留 Alpine state**——Livewire / Hotwire / HTMX 的 swap 机制底层：

```js
import morph from '@alpinejs/morph'
Alpine.plugin(morph)

// 用法
const el = document.querySelector('#list')
const newHtml = await fetch('/list').then(r => r.text())
Alpine.morph(el, newHtml, {
  key(el) { return el.id },      // 用于匹配元素
  updating(el, toEl, childrenOnly, skip) { /* hook */ },
  updated(el, toEl) { /* hook */ },
  removing(el, skip) { /* hook */ },
  removed(el) { /* hook */ },
  adding(el, skip) { /* hook */ },
  added(el) { /* hook */ },
})

// 区间 morph
Alpine.morphBetween(startNode, endNode, newHtml)
```

### `@alpinejs/focus`：焦点管理

```html
<!-- 焦点陷阱：modal 打开时 tab 不能跑出去 -->
<div x-data="{ open: false }">
  <button @click="open = true">Open</button>

  <div x-show="open" x-trap="open">
    <button @click="open = false">Close</button>
    <input>
  </div>

  <!-- + .inert（其他元素 aria-hidden） -->
  <div x-show="open" x-trap.inert="open">...</div>

  <!-- + .noscroll（禁止页面滚动） -->
  <div x-show="open" x-trap.inert.noscroll="open">...</div>

  <!-- + .noreturn（关闭后不还原焦点） -->
  <div x-show="open" x-trap.noreturn="open">...</div>

  <!-- + .noautofocus（不自动 focus 第一个） -->
  <div x-show="open" x-trap.noautofocus="open">...</div>
</div>
```

`$focus` magic：

```js
this.$focus.focus(el)         // 聚焦指定元素
this.$focus.first()           // 首个可聚焦
this.$focus.last()            // 末个可聚焦
this.$focus.next()            // 下一个
this.$focus.previous()        // 上一个
this.$focus.wrap()            // 启用循环
this.$focus.within(el)        // 限定容器
this.$focus.focusable(el)     // 检查
this.$focus.focusables()      // 全部
```

### `@alpinejs/collapse`：折叠动画

```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>

  <!-- 默认动画 -->
  <div x-show="open" x-collapse>Content</div>

  <!-- 自定义时长 -->
  <div x-show="open" x-collapse.duration.500ms>Content</div>

  <!-- 最小高度（露出预览） -->
  <div x-show="open" x-collapse.min.50px>Content</div>
</div>
```

::: warning `x-collapse` 必须配合 `x-show`
单独用 `x-collapse` 不会工作——它依赖 `x-show` 触发的展开/收起信号。
:::

### `@alpinejs/anchor`：浮动 UI 定位

基于 [Floating UI](https://floating-ui.com/) 的智能定位：

```html
<div x-data="{ open: false }">
  <button @click="open = !open" x-ref="button">Menu</button>

  <!-- 默认 bottom -->
  <div x-show="open" x-anchor="$refs.button">Dropdown</div>

  <!-- 修饰符位置 -->
  <div x-show="open" x-anchor.bottom-start="$refs.button">Dropdown</div>
  <div x-show="open" x-anchor.top-end="$refs.button">Dropdown</div>
  <div x-show="open" x-anchor.left="$refs.button">Dropdown</div>

  <!-- 偏移 -->
  <div x-show="open" x-anchor.offset.10="$refs.button">Dropdown</div>

  <!-- 禁止自动翻转 -->
  <div x-show="open" x-anchor.noflip="$refs.button">Dropdown</div>

  <!-- 自己控制样式 -->
  <div x-show="open" x-anchor.no-style="$refs.button" :style="$anchor">
    Dropdown
  </div>
</div>
```

常见场景：**下拉菜单**、**Popover**、**Tooltip**、**Dialog 头部贴边**。

### `@alpinejs/sort`：拖拽排序

基于 [SortableJS](https://github.com/SortableJS/Sortable)：

```html
<div x-data="{ items: ['A', 'B', 'C'] }">
  <ul x-sort="(key, position) => move(key, position)">
    <template x-for="(item, i) in items" :key="item">
      <li x-sort:item="item">
        <span x-sort:handle class="cursor-move">⋮⋮</span>
        <span x-text="item"></span>
      </li>
    </template>
  </ul>

  <!-- 多容器 group -->
  <ul x-sort x-sort:group="todos">...</ul>
  <ul x-sort x-sort:group="todos">...</ul>

  <!-- 视觉占位 -->
  <ul x-sort.ghost>...</ul>

  <!-- 配置（透传给 SortableJS） -->
  <ul x-sort x-sort:config="{ animation: 300, easing: 'cubic-bezier(...)'}">...</ul>
</div>
```

### `@alpinejs/resize`：尺寸监听

封装 [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)：

```html
<div x-data="{ width: 0, height: 0 }">
  <div x-resize="width = $width; height = $height">
    <p>Width: <span x-text="width"></span>px</p>
    <p>Height: <span x-text="height"></span>px</p>
  </div>

  <!-- 整个 document -->
  <div x-resize.document="docWidth = $width">...</div>
</div>
```

## Stores（全局状态）实战

```js
// 多 store 组织
document.addEventListener('alpine:init', () => {
  // 用户 store
  Alpine.store('user', {
    info: null,
    isLoggedIn: false,

    async fetch() {
      const res = await fetch('/api/me')
      if (res.ok) {
        this.info = await res.json()
        this.isLoggedIn = true
      }
    },

    logout() {
      this.info = null
      this.isLoggedIn = false
      fetch('/api/logout', { method: 'POST' })
    },
  })

  // 通知 store
  Alpine.store('notifications', {
    list: [],

    push(message, type = 'info') {
      const id = Date.now()
      this.list.push({ id, message, type })
      setTimeout(() => this.dismiss(id), 3000)
    },

    dismiss(id) {
      this.list = this.list.filter(n => n.id !== id)
    },
  })

  // 启动时自动加载
  Alpine.store('user').fetch()
})
```

```html
<!-- 任何组件都能访问 -->
<header x-data>
  <span x-show="$store.user.isLoggedIn" x-text="$store.user.info?.name"></span>
  <button @click="$store.user.logout()">Logout</button>
</header>

<aside x-data>
  <template x-for="notif in $store.notifications.list" :key="notif.id">
    <div :class="`alert-${notif.type}`">
      <span x-text="notif.message"></span>
      <button @click="$store.notifications.dismiss(notif.id)">×</button>
    </div>
  </template>
</aside>

<main x-data>
  <button @click="$store.notifications.push('Saved!', 'success')">Save</button>
</main>
```

## 跨组件通信：$dispatch 模式

Alpine 没有 Pinia / Redux 这种 store 工具（虽然有 `Alpine.store()`），跨组件通信主要靠 `$dispatch` 事件总线：

```html
<!-- 派发组件 -->
<form @submit.prevent="$dispatch('user-saved', { id: 42 })">
  <button>Save</button>
</form>

<!-- 监听组件（必须 .window 才能跨组件） -->
<div @user-saved.window="refreshList($event.detail.id)">...</div>
```

**事件命名约定**：

- `event-name`（kebab-case）—— `customEvent` 浏览器会 lowercase 化，必须用 kebab
- 业务事件加前缀：`user:login` / `cart:add` / `modal:close`

## Livewire 集成（TALL Stack）

[Livewire](https://livewire.laravel.com/) 是 Caleb Porzio（Alpine 作者）的 Laravel 全栈框架，**与 Alpine 深度集成**：

```php
<?php
// app/Livewire/Counter.php
namespace App\Livewire;

use Livewire\Component;

class Counter extends Component
{
    public int $count = 0;

    public function increment()
    {
        $this->count++;
    }

    public function render()
    {
        return view('livewire.counter');
    }
}
```

```blade
{{-- resources/views/livewire/counter.blade.php --}}
<div x-data="{ animating: false }">
  <button
    wire:click="increment"
    @click="animating = true"
  >
    +1
  </button>

  <span
    :class="{ 'animate-pulse': animating }"
    @animationend="animating = false"
  >
    {{ $count }}
  </span>
</div>
```

**协作原理**：

- `wire:click="increment"` → 发请求到 Laravel `Counter::increment()` 方法
- Livewire 拿到新 HTML，用 **Morph 算法**（`@alpinejs/morph` 同源）替换 DOM
- Morph 时保留所有 Alpine reactive scope（`animating` 不会丢）
- 客户端 Alpine state + 服务端 PHP state 完美分工

### TALL Stack 是什么

**T**ailwind + **A**lpine + **L**aravel + **L**ivewire——Caleb 主推的 Laravel 现代全栈范式：

| 角色 | 工具 |
|---|---|
| 样式 | Tailwind CSS |
| 前端交互 | Alpine.js |
| 后端 | Laravel |
| 实时 UI | Livewire（PHP 写组件，自动同步 DOM） |

## 与 HTMX 配合

[HTMX](https://htmx.org/) 处理「点按钮 → 发请求 → 换 HTML 片段」，Alpine 处理「之后的客户端交互」：

```html
<div x-data="{ loading: false, error: null }">
  <button
    hx-get="/api/users"
    hx-target="#user-list"
    hx-swap="innerHTML"
    @htmx:before-request="loading = true; error = null"
    @htmx:after-request="loading = false"
    @htmx:response-error="error = $event.detail.xhr.statusText"
  >
    Load users
  </button>

  <!-- Alpine 处理 UI 反馈 -->
  <div x-show="loading" class="spinner"></div>
  <div x-show="error" x-text="error" class="alert-error"></div>

  <!-- HTMX 把响应 HTML 塞这里 -->
  <ul id="user-list"></ul>
</div>
```

**HTMX 事件汇总**（Alpine 用 `@htmx:xxx` 监听）：

| 事件 | 时机 |
|---|---|
| `htmx:before-request` | 请求前 |
| `htmx:after-request` | 请求后 |
| `htmx:response-error` | 响应 4xx/5xx |
| `htmx:send-error` | 网络错误 |
| `htmx:before-swap` | DOM 替换前 |
| `htmx:after-swap` | DOM 替换后 |
| `htmx:load` | 元素加载完 |

## CSP 友好版（@alpinejs/csp）

```html
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/csp@3.x.x/dist/cdn.min.js"></script>
```

**不能用**：

- 任意 JS 表达式（`eval` / `Function` 被禁用）
- 箭头函数：`() => ...`
- 解构 / 扩展：`const { a } = obj` / `[...arr]`
- 模板字符串：`` `${x}` ``
- 属性赋值：`user.name = 'John'`
- 访问 `console` / `document` / `window` / `Math`

**能用**：

- 对象 / 数组字面量：`{ a: 1, b: 2 }` / `[1, 2, 3]`
- 算术 / 比较：`a + b` / `a > b`
- 自增 / 自减：`count++`
- 方法调用：`items.push(x)` / `toggle()`
- 三元 / 逻辑：`a ? b : c` / `a && b`

**最佳实践**：复杂逻辑挪到 `Alpine.data()` 注册的 JS 中：

```html
<!-- ✅ 简单表达式 -->
<button x-data="counter" @click="increment()">+1</button>

<!-- ❌ CSP 模式下不能用 -->
<button @click="count = count + 1">+1</button>
```

```js
// 复杂逻辑放 JS
Alpine.data('counter', () => ({
  count: 0,
  increment() { this.count++ },
}))
```

## 响应式底层（Alpine.reactive / Alpine.effect）

Alpine 用 Vue 3 的 [`@vue/reactivity`](https://github.com/vuejs/core/tree/main/packages/reactivity) 作为响应式核心：

```js
const data = Alpine.reactive({ count: 0 })

const dispose = Alpine.effect(() => {
  console.log('count =', data.count)
})

data.count++  // 日志: count = 1
data.count++  // 日志: count = 2

// 停止订阅
Alpine.release(dispose)
```

实际应用场景：写自定义指令时直接操作 reactive 系统。日常 95% 场景用 `x-data` / `$watch` 即可，不用碰底层。

## 自定义指令（Alpine.directive）

```js
document.addEventListener('alpine:init', () => {
  // 自定义 x-uppercase 指令
  Alpine.directive('uppercase', (el, { expression }, { evaluateLater, effect }) => {
    const getter = evaluateLater(expression)

    effect(() => {
      getter(value => {
        el.textContent = String(value).toUpperCase()
      })
    })
  })
})
```

```html
<div x-data="{ name: 'caleb' }">
  <span x-uppercase="name"></span> <!-- 渲染 "CALEB" -->
</div>
```

## 自定义 Magic（Alpine.magic）

```js
Alpine.magic('clipboard', () => {
  return subject => navigator.clipboard.writeText(subject)
})
```

```html
<button @click="$clipboard('Hello!')">Copy</button>
```

## 配合 SSR 框架的常见模式

### 1. SSR + Alpine：客户端 hydration

服务端渲染好 HTML，Alpine 加载后接管交互：

```html
<!-- Rails / Laravel / Django 服务端渲染输出 -->
<div x-data="{ open: false }">
  <button @click="open = !open">Menu</button>
  <ul x-show="open" x-cloak>
    {% for item in menu_items %}
      <li>{{ item.name }}</li>  <!-- 服务端模板循环 -->
    {% endfor %}
  </ul>
</div>
```

::: tip x-cloak 在 SSR 中尤为重要
SSR 输出时 `x-show="open"` 不生效（Alpine 还没启动），服务端会渲染出展开状态的 HTML 一闪而过。`x-cloak` + CSS `display: none !important` 是必备搭配。
:::

### 2. 老页面渐进增强

逐步给老网页加交互，零侵入：

```html
<!-- 原本 jQuery 写的下拉 -->
<!-- <script>$('.menu-toggle').on('click', ...)</script> -->

<!-- 改写为 Alpine（删除原 jQuery） -->
<div x-data="{ open: false }">
  <button class="menu-toggle" @click="open = !open">☰</button>
  <ul x-show="open" x-transition>
    <li>...</li>
  </ul>
</div>
```

### 3. 与 Turbo / Hotwire 配合（Rails）

```html
<!-- Turbo 替换片段时，Alpine 自动重新初始化 -->
<turbo-frame id="todos">
  <div x-data="todoList">
    <!-- Alpine 组件 -->
  </div>
</turbo-frame>
```

监听 Turbo 事件：

```html
<div @turbo:before-cache.window="cleanup()">...</div>
```

### 4. WordPress 插件

```php
<?php
// 在 functions.php 中
function enqueue_alpine() {
  wp_enqueue_script(
    'alpine',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
    [],
    null,
    true
  );
  // defer 由 WP 自动加（third param empty + footer hook）
}
add_action('wp_enqueue_scripts', 'enqueue_alpine');

// 在主题 .php 模板中
?>
<div x-data="{ liked: false }">
  <button @click="liked = !liked">
    <span x-text="liked ? '❤️' : '🤍'"></span>
  </button>
</div>
```

## 测试

Alpine 项目以 **E2E 测试**为主——`Cypress` 或 `Playwright`：

### Cypress 示例

```js
// cypress/e2e/counter.cy.js
describe('Counter Component', () => {
  beforeEach(() => cy.visit('/'))

  it('increments counter on click', () => {
    cy.get('[data-test=count]').should('contain', '0')
    cy.get('[data-test=plus]').click()
    cy.get('[data-test=count]').should('contain', '1')
  })

  it('persists count after reload', () => {
    cy.get('[data-test=plus]').click().click()
    cy.reload()
    cy.get('[data-test=count]').should('contain', '2')
  })
})
```

```html
<div x-data="{ count: $persist(0) }">
  <span data-test="count" x-text="count"></span>
  <button data-test="plus" @click="count++">+</button>
</div>
```

### Playwright 示例

```ts
// tests/counter.spec.ts
import { test, expect } from '@playwright/test'

test('counter increments', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-test=count]')).toHaveText('0')
  await page.locator('[data-test=plus]').click()
  await expect(page.locator('[data-test=count]')).toHaveText('1')
})
```

### 单元测试

Alpine 没有官方测试工具。常见做法：

1. **Vitest + jsdom**：手动挂载 Alpine 到 DOM 节点测试响应式
2. **直接 E2E**：成本最低，覆盖度最高

```js
// 简易单元测试（Vitest + jsdom）
import { describe, it, expect, beforeEach } from 'vitest'
import Alpine from 'alpinejs'

beforeEach(() => {
  document.body.innerHTML = ''
  Alpine.start()
})

it('toggles open state', async () => {
  document.body.innerHTML = `
    <div x-data="{ open: false }">
      <button id="btn" @click="open = !open">Toggle</button>
      <div id="content" x-show="open">Hi</div>
    </div>
  `
  Alpine.initTree(document.body)

  const btn = document.getElementById('btn')
  const content = document.getElementById('content')

  expect(content.style.display).toBe('none')
  btn.click()
  await Promise.resolve()
  expect(content.style.display).not.toBe('none')
})
```

## TypeScript 支持

Alpine 有官方类型，但**仅限 `Alpine` 全局对象**——HTML 属性内的表达式不会被类型检查：

```bash
pnpm add -D alpinejs
```

```ts
// src/main.ts
import Alpine from 'alpinejs'

// 声明 store 类型
declare global {
  interface Window {
    Alpine: typeof Alpine
  }
}

window.Alpine = Alpine

// 注册 typed data
interface CartItem {
  id: number
  price: number
}

Alpine.data('cart', () => ({
  items: [] as CartItem[],
  add(item: CartItem) {
    this.items.push(item)
  },
}))

Alpine.start()
```

**编辑器插件**：[Alpine.js IntelliSense](https://marketplace.visualstudio.com/items?itemName=adrianwilczynski.alpine-js-intellisense) 提供 VS Code 内的指令补全。

## 性能优化

### 1. 减少 `x-data` 嵌套层级

每个 `x-data` 都会创建独立 reactive scope，过深嵌套会引入开销：

```html
<!-- ❌ 过度嵌套 -->
<div x-data="A">
  <div x-data="B">
    <div x-data="C">...</div>
  </div>
</div>

<!-- ✅ 扁平化 -->
<div x-data="App">
  <!-- A / B / C 的状态都放在 App 里 -->
</div>
```

### 2. 大列表用 `x-show` 而不是 `x-if`

频繁切换场景，DOM 增删比 `display: none` 慢得多。

### 3. `@input` 用 `.debounce`

```html
<input @input.debounce.300ms="search">
```

### 4. 1000+ 元素列表考虑虚拟滚动

Alpine 没有原生虚拟滚动，1000+ 元素用 [`@alpinejs/intersect`](https://alpinejs.dev/plugins/intersect) 实现「视口可见才挂载」：

```html
<div x-data="{ visibleIndices: new Set() }">
  <template x-for="(item, i) in items" :key="item.id">
    <div x-intersect="visibleIndices.add(i)" x-intersect:leave="visibleIndices.delete(i)">
      <template x-if="visibleIndices.has(i)">
        <article>...</article>
      </template>
      <template x-if="!visibleIndices.has(i)">
        <div class="placeholder" style="height: 100px"></div>
      </template>
    </div>
  </template>
</div>
```

### 5. 用 `Alpine.data()` 而不是 inline `x-data`

```html
<!-- ❌ inline（每次 element 都 parse 一次表达式） -->
<div x-data="{ open: false, items: [...], toggle() { ... } }">...</div>

<!-- ✅ 注册一次，多处复用 -->
<div x-data="dropdown">...</div>
```

## 与 jQuery 迁移指南

```js
// jQuery: 命令式
$('.btn').on('click', function() {
  $('.menu').toggle()
})

// Alpine: 声明式
// <div x-data="{ open: false }">
//   <button @click="open = !open">Toggle</button>
//   <div x-show="open" class="menu">...</div>
// </div>
```

| jQuery | Alpine |
|---|---|
| `$('.x').on('click', ...)` | `@click="..."` |
| `$('.x').toggle()` | `x-show="state"` |
| `$('.x').html(...)` | `x-html="..."` |
| `$('.x').text(...)` | `x-text="..."` |
| `$('.x').attr('href', url)` | `:href="url"` |
| `$('.x').addClass('active')` | `:class="{ active: cond }"` |
| `$('.x').val()` / `.val(v)` | `x-model="value"` |
| `$('form').submit(e => e.preventDefault())` | `@submit.prevent="..."` |
| `$(window).on('resize', ...)` | `@resize.window="..."` |
| `$(document).on('click', '.x', ...)` | `@click.outside="..."` |
| `$.ajax({ ... })` | `await fetch(...)` |

## 不要选 Alpine 的场景

- **SPA 项目（含路由 / 大型状态）** → React / Vue / Solid
- **重客户端交互（拖拽编辑器 / 表格 / 图表）** → 用 Vue / Svelte（性能 + 工程化更佳）
- **React Native / 跨端** → React Native / Capacitor
- **企业级中后台（依赖 Element Plus / Ant Design）** → Vue / React
- **强 TypeScript 要求** → Vue + SFC + Volar（类型推导一流）
- **团队全是 React / Vue 老手** → 用熟悉的框架

## 适合选 Alpine 的场景

- **Laravel / Rails / Django / WordPress 项目加交互** → Alpine 是首选
- **JAMstack（11ty / Astro / Hugo） + 轻交互** → CDN 引一行就用
- **Marketing / 落地页 / Blog 加点 modal / 下拉 / 切换** → 极佳
- **老项目用 jQuery 想升级** → Alpine 是平滑迁移路径
- **Livewire 全栈项目** → TALL Stack 标配
- **HTMX 项目** → Alpine 补客户端交互的最佳搭档

## 经验法则

- **小型 + 增强 SSR 页面** → Alpine 完美选择
- **优先用 `Alpine.data()`** → 复用 + 可测试 > inline x-data
- **`x-show` > `x-if`**（频繁切换） / **`x-if` > `x-show`**（不常切换）
- **`x-model.lazy` 减少更新** → 大表单场景
- **`x-cloak` + CSS** → 必备组合，防止初始化闪烁
- **`$persist` 用 `.as()` 命名** → 避免不同组件 key 冲突
- **`$dispatch('xxx', ..., { bubbles: false })`** → 限制冒泡范围
- **`.window` 是跨组件通信关键** → `$dispatch` 默认只冒泡到父节点
- **CSP 模式优先用 `Alpine.data()`** → 把复杂逻辑挪到 JS
