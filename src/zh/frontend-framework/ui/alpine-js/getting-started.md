---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Alpine.js 3.x 编写

## 速查

- 安装：
  - **CDN**（推荐 90% 场景）：`<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
  - **NPM + 打包器**：`pnpm add alpinejs` 后 `import Alpine from 'alpinejs'; window.Alpine = Alpine; Alpine.start()`
- 心智模型：**Sprinkle JS / HTML 上的 jQuery**——给服务端渲染（SSR）页面加交互，不是写 SPA
- 启动：CDN 自动 `Alpine.start()`；NPM 必须手动调用
- 最小示例：`<div x-data="{ open: false }"><button @click="open = !open">Toggle</button><div x-show="open">Hi</div></div>`
- 15 个指令：x-data / x-init / x-show / x-bind / x-on / x-text / x-html / x-model / x-modelable / x-for / x-transition / x-effect / x-ignore / x-ref / x-cloak / x-teleport / x-if / x-id
- 9 个魔术属性：`$el` / `$refs` / `$store` / `$watch` / `$dispatch` / `$nextTick` / `$root` / `$data` / `$id`
- 3 个全局 API：`Alpine.data(name, factory)` / `Alpine.store(name, data)` / `Alpine.bind(name, attrs)`
- 9 个官方插件：Mask / Intersect / Resize / Persist / Focus / Collapse / Anchor / Morph / Sort
- 与 jQuery 区别：Alpine 是**响应式**——数据变 DOM 自动更新；jQuery 是命令式手动操作 DOM
- 与 Vue 区别：Alpine 没有 SFC / 没有路由 / 没有 SSR；只做客户端 sprinkle 不做 SPA

## Alpine.js 是「HTML 上的 jQuery」不是「轻量 Vue」

这是理解 Alpine 定位的关键——**它和 Vue / React / Solid 不在同一赛道**：

| 维度 | Alpine 3 | Vue 3 | jQuery | HTMX |
|---|---|---|---|---|
| 自我定位 | Sprinkle JS（HTML 上的 jQuery） | UI 框架 + SFC | DOM 操作库 | HATEOAS 请求层 |
| 适合场景 | SSR 页面加交互 | SPA / SFC | 老网页改造 | 后端换 HTML 片段 |
| 包体（gzip） | ~7 KB | ~25 KB | ~30 KB | ~10 KB |
| 响应式 | **有**（`@vue/reactivity`） | 有 | 无（手动） | 无 |
| 模板系统 | HTML 属性指令 | SFC / `<template>` | 字符串拼接 | 服务端模板 |
| 单文件组件 | **无** | 有 | 无 | 无 |
| 路由 / SSR | **无** | Vue Router / Nuxt | 无 | 无（服务端处理） |
| 构建工具 | **不需要** | Vite / Rollup | 不需要 | 不需要 |
| TypeScript | 弱（编辑器插件） | 强 | 弱 | 弱 |
| 与 SSR 框架 | **完美**（Laravel / Rails） | 一般 | 兼容 | **完美** |

**含义**：

- Alpine 是**「让 SSR 页面有交互」**的最小化方案，不是「在前端造 SPA」
- 后端框架（Laravel / Rails / Django）的渲染逻辑保留在服务端，Alpine 只处理「点开关」「下拉」「Modal」这类客户端交互
- 与 HTMX 互补：HTMX 处理「点按钮发请求换 HTML 片段」，Alpine 处理「点完之后的交互动效」
- 与 Livewire 集成：Livewire 把 PHP 状态实时映射到 DOM，内部用 Alpine 做客户端反应；TALL Stack 标配

## 安装与首次启动

### 方法 A：CDN（最快，90% 场景推荐）

最简单的方式——直接在 HTML `<head>` 加 `script` 标签：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <!-- 必须有 defer 属性 -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <!-- 生产环境锁版本：alpinejs@3.14.1 -->
</head>
<body>
  <div x-data="{ count: 0 }">
    <button @click="count++">Clicked <span x-text="count"></span></button>
  </div>
</body>
</html>
```

::: tip 为什么必须 `defer`
`defer` 让 Alpine 在 HTML 解析完成后再执行，这样 Alpine 启动时 `x-data` 标记的元素已经在 DOM 中。如果没加 `defer`，Alpine 可能在 HTML 解析完之前启动，扫不到元素。
:::

### 方法 B：NPM + 打包器（中大型项目）

如果项目已有 Vite / webpack 构建链路：

```bash
pnpm add alpinejs
# 或 npm install alpinejs / yarn add alpinejs
```

然后在入口 JS 中：

```js
// src/main.js
import Alpine from 'alpinejs'

// 暴露到 window，方便调试 / 控制台访问
window.Alpine = Alpine

// 必须手动调用 start
Alpine.start()
```

::: warning 注册顺序
任何扩展（`Alpine.data` / `Alpine.store` / `Alpine.plugin`）必须在 `Alpine.start()` 之前注册，否则会错过启动时机。
:::

### 方法 C：CSP 友好构建

如果应用启用了严格 Content Security Policy（禁止 `unsafe-eval`），用 CSP 版：

```html
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/csp@3.x.x/dist/cdn.min.js"></script>
```

CSP 版**限制**：

- 不支持任意 JS 表达式求值（用 `Function` 构造器的能力被关闭）
- 不能用 `user.name = 'John'` 这种属性赋值
- 不能用箭头函数、模板字符串、解构、扩展运算符
- 不能访问全局 `console` / `document` / `window` / `Math`
- 复杂逻辑必须挪到 `Alpine.data()` 注册的 JS 中

## 最小示例

### 例 1：计数器（State + Event + Text）

```html
<div x-data="{ count: 0 }">
  <button @click="count++">+1</button>
  <span x-text="count"></span>
</div>
```

3 个核心指令一次到位：

- `x-data="{ count: 0 }"`——声明响应式状态
- `@click="count++"`——监听点击事件（`x-on:click` 的简写）
- `x-text="count"`——把 `count` 渲染为元素文本

### 例 2：下拉菜单（条件渲染 + 外部点击关闭）

```html
<div x-data="{ open: false }" @click.outside="open = false">
  <button @click="open = !open">Menu</button>
  <div x-show="open" x-transition>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </div>
</div>
```

- `@click.outside`——点击元素外部时触发（修饰符）
- `x-show`——切换显示（`display: none`）
- `x-transition`——自动加默认过渡动画

### 例 3：搜索 + 列表过滤（双向绑定 + 列表渲染）

```html
<div x-data="{
  search: '',
  items: ['Apple', 'Banana', 'Cherry', 'Durian'],
  get filtered() {
    return this.items.filter(i =>
      i.toLowerCase().includes(this.search.toLowerCase())
    )
  }
}">
  <input x-model="search" placeholder="Filter...">
  <ul>
    <template x-for="item in filtered" :key="item">
      <li x-text="item"></li>
    </template>
  </ul>
</div>
```

- `x-model`——双向绑定（input → state，state → input）
- `get filtered()`——JS getter 作为「计算属性」，依赖变化时自动重算
- `<template x-for>`——列表渲染必须用 `<template>` 包裹（参考 Vue / Svelte）

## 配合后端框架的典型架构

### Laravel + Blade + Alpine

```blade
{{-- resources/views/products/index.blade.php --}}
@extends('layouts.app')

@section('content')
  <div x-data="{ filter: 'all' }">
    <div class="filters">
      <button @click="filter = 'all'" :class="{ active: filter === 'all' }">All</button>
      <button @click="filter = 'new'" :class="{ active: filter === 'new' }">New</button>
    </div>

    @foreach ($products as $product)
      <div x-show="filter === 'all' || filter === '{{ $product->status }}'">
        <h3>{{ $product->name }}</h3>
        <p>${{ $product->price }}</p>
      </div>
    @endforeach
  </div>
@endsection
```

后端用 Blade 渲染列表 + Alpine 处理客户端筛选——零 AJAX 零 API 也能交互。

### Rails 7 + ERB + Alpine

```erb
<%# app/views/posts/index.html.erb %>
<div x-data="{ commentsOpen: false }">
  <%= render @posts %>

  <button @click="commentsOpen = !commentsOpen">
    <span x-text="commentsOpen ? 'Hide' : 'Show'"></span> Comments
  </button>

  <div x-show="commentsOpen" x-collapse>
    <%= render @comments %>
  </div>
</div>
```

### Django + Template + Alpine

```html
{# templates/products/list.html #}
{% extends "base.html" %}

{% block content %}
<div x-data="{ cart: $persist([]) }">
  {% for product in products %}
    <div>
      <h3>{{ product.name }}</h3>
      <button @click="cart.push({{ product.id }})">Add to cart</button>
    </div>
  {% endfor %}

  <p>Cart items: <span x-text="cart.length"></span></p>
</div>
{% endblock %}
```

`$persist` 是 Persist 插件的 magic——`cart` 自动写入 localStorage，刷新页面不丢。

### TALL Stack（Laravel + Alpine + Livewire）

[Livewire](https://livewire.laravel.com/) 是 Caleb Porzio（Alpine 作者）的另一个项目——「PHP 写后端，DOM 自动更新」：

```blade
{{-- counter.blade.php (Livewire 组件) --}}
<div x-data="{ animating: false }">
  <button wire:click="increment" @click="animating = true">
    +1
  </button>

  <span :class="{ 'animate-pulse': animating }">
    {{ $count }}
  </span>
</div>
```

- `wire:click`——Livewire 把点击映射回 PHP 方法（自动发请求 + 更新 DOM）
- `@click`——Alpine 同时处理客户端动画 state
- 两者无冲突——Livewire 用 Morph 算法保留 Alpine state

## 配合 HTMX

[HTMX](https://htmx.org/) 是「服务端换 HTML 片段」的扩展库，与 Alpine 互补：

```html
<div x-data="{ loading: false }">
  <!-- HTMX 发请求 -->
  <button
    hx-get="/users/list"
    hx-target="#user-list"
    @htmx:before-request="loading = true"
    @htmx:after-request="loading = false"
  >
    Load users
  </button>

  <!-- Alpine 处理加载态 -->
  <div x-show="loading">Loading...</div>

  <div id="user-list">
    <!-- HTMX 把响应 HTML 插这里 -->
  </div>
</div>
```

**职责清晰**：

- HTMX 负责「点按钮→发 AJAX→换 HTML 片段」
- Alpine 负责「按钮 disabled、loading spinner、错误提示」等客户端 UI 反应

## 与 Vue 早期的相似度

Alpine 的指令系统几乎是 Vue 2 / Vue 3 的「精简翻版」：

| 概念 | Alpine 3 | Vue 3 |
|---|---|---|
| 状态 | `x-data="{ open: false }"` | `data() { return { open: false } }` / `ref(false)` |
| 文本 | `x-text="msg"` | `{{ msg }}` |
| HTML | `x-html="content"` | `v-html="content"` |
| 显示 | `x-show="open"` | `v-show="open"` |
| 条件 | `<template x-if="show">` | `v-if="show"` |
| 列表 | `<template x-for>` | `v-for="item in items"` |
| 事件 | `@click="..."` | `@click="..."`（同款语法） |
| 双向 | `x-model="value"` | `v-model="value"` |
| 绑定 | `:href="url"` / `x-bind:href` | `:href="url"` / `v-bind:href` |
| Ref | `x-ref="input"` / `$refs.input` | `ref="input"` / `$refs.input` |
| 监听 | `$watch('foo', cb)` | `watch(foo, cb)` |
| 派发 | `$dispatch('event')` | `$emit('event')` / Composition API |
| 生命周期 | `init() { ... }` | `onMounted(() => ...)` |

::: tip 从 Vue 来的开发者
如果你写过 Vue 2，Alpine 几乎不用学新东西，把 `v-` 替换成 `x-` 即可。但要记住——**Alpine 没有 SFC、没有路由、不能写 SPA**。
:::

## 第一个完整组件：Todo List

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/persist@3.x.x/dist/cdn.min.js"></script>
  <style>[x-cloak] { display: none !important; }</style>
</head>
<body>
  <div x-cloak x-data="todoApp">
    <h1>Alpine.js Todo</h1>

    <form @submit.prevent="add">
      <input
        x-model="newTodo"
        placeholder="What needs to be done?"
        x-ref="input"
        autofocus
      >
      <button :disabled="!newTodo.trim()">Add</button>
    </form>

    <ul>
      <template x-for="todo in todos" :key="todo.id">
        <li>
          <input type="checkbox" x-model="todo.done">
          <span :class="{ 'line-through': todo.done }" x-text="todo.text"></span>
          <button @click="remove(todo.id)">×</button>
        </li>
      </template>
    </ul>

    <p>Remaining: <span x-text="remaining"></span></p>
  </div>

  <script>
    document.addEventListener('alpine:init', () => {
      Alpine.data('todoApp', () => ({
        // 状态（用 $persist 自动写 localStorage）
        todos: Alpine.$persist([]).as('todos'),
        newTodo: '',

        // 计算属性（用 getter）
        get remaining() {
          return this.todos.filter(t => !t.done).length
        },

        // 方法
        add() {
          if (!this.newTodo.trim()) return
          this.todos.push({
            id: crypto.randomUUID(),
            text: this.newTodo.trim(),
            done: false,
          })
          this.newTodo = ''
          this.$refs.input.focus()
        },
        remove(id) {
          this.todos = this.todos.filter(t => t.id !== id)
        },
      }))
    })
  </script>
</body>
</html>
```

涵盖了 Alpine 的核心能力：

- `x-data="todoApp"`——用 `Alpine.data()` 注册的可复用组件
- `x-cloak` + CSS——防止初始化前内容闪烁
- `$persist`——状态持久化到 localStorage
- `$refs.input.focus()`——直接操作 DOM
- `@submit.prevent`——事件修饰符（防止默认表单提交）
- `:class="{ '...': cond }"`——条件 class（对象语法）
- `<template x-for>`——列表渲染
- `get remaining()`——getter 作为计算属性

## 调试技巧

### 1. 浏览器控制台直接访问

```js
// 把组件 root 元素的 Alpine 数据导出到全局
window.dump = (el) => Alpine.$data(el)

// 在控制台
dump($0) // $0 是浏览器开发者工具选中的元素
```

### 2. 用 `$watch` 加日志

```html
<div x-data="{ count: 0 }" x-init="$watch('count', v => console.log('count =', v))">
  <button @click="count++">+1</button>
</div>
```

### 3. 用 `x-effect` 自动追踪

```html
<div x-data="{ a: 1, b: 2 }" x-effect="console.log('sum =', a + b)">
  <!-- 任何 a 或 b 变化都会打日志 -->
</div>
```

### 4. 浏览器 DevTools 检查 `_x_dataStack`

Alpine 把每个元素的 reactive scope 挂在 `el._x_dataStack[0]`，DevTools 选中元素后：

```js
$0._x_dataStack[0]    // 当前元素的 reactive data
$0._x_dataStack[1]    // 父元素 data（如果嵌套）
```

## 常见踩坑

### 1. `x-for` 必须用 `<template>`

```html
<!-- ❌ 错 -->
<div x-for="item in items">...</div>

<!-- ✅ 对 -->
<template x-for="item in items">
  <div>...</div>
</template>
```

### 2. `<template>` 内必须只有一个根元素

```html
<!-- ❌ 错：多根 -->
<template x-for="item in items">
  <h3 x-text="item.title"></h3>
  <p x-text="item.body"></p>
</template>

<!-- ✅ 对：单根 -->
<template x-for="item in items">
  <article>
    <h3 x-text="item.title"></h3>
    <p x-text="item.body"></p>
  </article>
</template>
```

### 3. CDN 模式不要手动调 `Alpine.start()`

CDN 版会自动 `Alpine.start()`；NPM + bundler 模式才需要手动调用。重复调用会报错或导致多实例。

### 4. 注册扩展要在 `alpine:init` 事件 / `Alpine.start()` 之前

```js
// ❌ 错：太晚了
Alpine.start()
Alpine.data('foo', () => ({ ... })) // 不会生效

// ✅ 对（CDN 模式）
document.addEventListener('alpine:init', () => {
  Alpine.data('foo', () => ({ ... }))
})

// ✅ 对（NPM 模式）
import Alpine from 'alpinejs'
Alpine.data('foo', () => ({ ... }))
window.Alpine = Alpine
Alpine.start()
```

### 5. 不要在 `x-data` 内直接用 `this`

```html
<!-- ❌ 错：x-data 内的 this 是 window -->
<div x-data="{ count: 0, log() { console.log(this.count) } }">

<!-- ✅ 对：方法内 this 才是 reactive scope -->
<div x-data="{
  count: 0,
  log() { console.log(this.count) }
}">
  <button @click="log()">Log</button>
</div>
```

### 6. `x-cloak` 必须配 CSS

```css
[x-cloak] { display: none !important; }
```

没这条 CSS，`x-cloak` 不生效，初始化前的模板会闪一下。

## 与 Vue 3 / Stimulus 对比

| 维度 | Alpine 3 | Vue 3 | Stimulus 3 |
|---|---|---|---|
| 创作者 | Caleb Porzio | Evan You | Basecamp / DHH |
| 包体（gzip） | ~7 KB | ~25 KB | ~10 KB |
| 模板系统 | HTML 属性指令 | SFC / `<template>` | HTML data 属性 |
| 响应式 | `@vue/reactivity` | Proxy | 无（手动 setter/getter） |
| 状态 | `x-data` / `Alpine.store` | `ref` / `reactive` / Pinia | controller class properties |
| 生态 | 9 插件 | 庞大 | 较小（属于 Hotwire） |
| 适合 | SSR + 轻交互 | SPA / 全栈 | Rails + Turbo + Stimulus |
| 学习曲线 | 极平缓 | 中等 | 平缓 |

**经验**：

- **新项目纯前端 SPA** → Vue / React / Solid
- **后端框架（Laravel / Rails / Django） + 想加点客户端交互** → Alpine.js
- **Rails 7 默认栈 / Hotwire 体系** → Stimulus
- **JAMstack + 偶尔加点交互** → Alpine.js（CDN 加载）

## 版本里程碑

| 版本 | 时间 | 关键特性 |
|---|---|---|
| **1.0** | 2019.11 | Caleb Porzio 首次发布，10 个指令 |
| **2.0** | 2020.7 | 性能优化，`$store` 引入 |
| **3.0** | 2021.5 | 重写为 ESM 架构，9 个魔术属性 |
| **3.4** | 2021.10 | x-modelable / x-teleport |
| **3.10** | 2022.5 | x-effect 引入 |
| **3.13** | 2023.10 | Sort 插件、Anchor 插件 |
| **3.14** | 2024.1 | Morph 改进、x-bind 性能提升 |

::: tip 当前推荐版本
**Alpine 3.14.x** 为当前主流稳定版。CDN 锁版用 `@3.14.1`；前沿版用 `@3.x.x`（自动取最新 3.x）。
:::

## 下一步

- 详细 → [指南](./guide-line)：15 指令 / 9 魔术属性 / 全局 API / 插件 / Livewire / 测试 / SSR 框架集成
- API → [参考](./reference)：指令清单 / 魔术属性清单 / 插件 API / TypeScript 类型
