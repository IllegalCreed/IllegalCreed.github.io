---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Alpine.js 3.x 编写 —— 15 个指令 / 9 个魔术属性 / 3 个全局 API / 9 个官方插件 / 高级 API / TypeScript / 版本里程碑

## 15 个指令清单

| 指令 | 用途 | 必须 `<template>` |
|---|---|---|
| `x-data` | 声明响应式作用域 | 否 |
| `x-init` | 初始化逻辑 | 否 |
| `x-show` | 切换显示（`display: none`） | 否 |
| `x-bind` / `:` | 绑定 HTML 属性 | 否 |
| `x-on` / `@` | 监听事件 | 否 |
| `x-text` | 渲染文本 | 否 |
| `x-html` | 渲染 HTML（XSS 风险） | 否 |
| `x-model` | 双向绑定 | 否 |
| `x-modelable` | 让自定义组件支持 `x-model` | 否 |
| `x-for` | 列表渲染 | **是** |
| `x-transition` | 进出过渡（配 `x-show`） | 否 |
| `x-effect` | 响应式副作用 | 否 |
| `x-ignore` | 跳过 Alpine 处理 | 否 |
| `x-ref` | 引用 DOM 元素 | 否 |
| `x-cloak` | 隐藏未初始化内容 | 否 |
| `x-teleport` | DOM 传送（配 modal） | **是** |
| `x-if` | 条件渲染（DOM 增删） | **是** |
| `x-id` | 唯一 ID 作用域 | 否 |

> 注：清单合计 18 项（含 `x-if` / `x-teleport` / `x-modelable`），官方称「~15 directives」是按概念归类。

### `x-data`

```html
x-data="objectOrName"
```

- `{ key: value }`：内联对象字面量
- `componentName`：引用 `Alpine.data(name, ...)` 注册的组件
- `componentName(arg)`：传参

### `x-init`

```html
x-init="expression"
```

- 元素首次被 Alpine 处理时执行
- 在第一次 DOM 更新前执行
- `init()` 方法会**先于** `x-init` 执行

### `x-show`

```html
x-show="condition"
x-show.important="condition"  <!-- 加 !important -->
```

### `x-bind`

```html
x-bind:attr="value"
:attr="value"
x-bind="objectOrName"  <!-- 批量绑定 -->
```

### `x-on`

```html
x-on:event="expression"
@event="expression"
@event.modifier="expression"
@event.key="expression"
```

### `x-text` / `x-html`

```html
x-text="expression"
x-html="expression"  <!-- 仅受信任内容 -->
```

### `x-model`

```html
x-model="property"
x-model.lazy="property"
x-model.number="property"
x-model.boolean="property"
x-model.debounce.500ms="property"
x-model.throttle.500ms="property"
x-model.fill="property"
```

### `x-modelable`

```html
<div x-data="{ count: 0 }" x-modelable="count">
  <!-- 暴露 count 给外部 x-model -->
</div>
```

### `x-for`

```html
<template x-for="item in items" :key="item.id">
  <li x-text="item.name"></li>
</template>

<template x-for="(item, index) in items">...</template>
<template x-for="(value, key) in object">...</template>
<template x-for="i in 10">...</template>
```

### `x-transition`

```html
x-transition
x-transition.duration.500ms
x-transition.delay.50ms
x-transition.opacity
x-transition.scale.80
x-transition.scale.origin.top.right
x-transition:enter.duration.500ms
x-transition:leave.duration.300ms

<!-- 自定义类 -->
x-transition:enter="..."
x-transition:enter-start="..."
x-transition:enter-end="..."
x-transition:leave="..."
x-transition:leave-start="..."
x-transition:leave-end="..."
```

### `x-effect`

```html
x-effect="expression"
```

- 自动追踪表达式中读到的响应式属性
- 首次 + 任意依赖变化时执行
- 类似 Vue 的 `watchEffect`

### `x-ignore`

```html
<div x-ignore>...</div>  <!-- 跳过 Alpine 处理 -->
```

### `x-ref` + `$refs`

```html
<input x-ref="email">
<button @click="$refs.email.focus()">Focus</button>
```

### `x-cloak`

```html
<div x-cloak x-data="...">...</div>
```

```css
[x-cloak] { display: none !important; }
```

### `x-teleport`

```html
<template x-teleport="body">
  <!-- 传送到 body 末尾 -->
</template>

<template x-teleport="#modal-root">...</template>
```

### `x-if`

```html
<template x-if="condition">
  <div>Only one root element</div>
</template>
```

### `x-id`

```html
<div x-id="['my-id', 'another']">
  <label :for="$id('my-id')">...</label>
  <input :id="$id('my-id')">
</div>
```

## 9 个魔术属性清单

| Magic | 用途 |
|---|---|
| `$el` | 当前 DOM 元素 |
| `$refs` | `x-ref` 集合 |
| `$store` | 全局 store（`Alpine.store`） |
| `$watch` | 监听属性变化 |
| `$dispatch` | 派发自定义事件 |
| `$nextTick` | 等 DOM 更新完 |
| `$root` | 最近 `x-data` 根元素 |
| `$data` | 当前 reactive scope 整体 |
| `$id` | 生成唯一 ID |

### `$el`

```html
<button @click="$el.classList.add('clicked')">Add class</button>
```

### `$refs`

```html
<div x-data>
  <input x-ref="input">
  <button @click="$refs.input.focus()">Focus</button>
</div>
```

### `$store`

```html
<!-- 任意 reactive scope 访问 -->
<span x-text="$store.user.name"></span>
<button @click="$store.cart.add(item)">Add</button>
```

### `$watch`

```js
this.$watch('search', (value, oldValue) => { ... })
this.$watch('user.profile.name', value => { ... })  // 嵌套
```

### `$dispatch`

```js
$dispatch('event-name')
$dispatch('event-name', { detail: 'data' })
$dispatch('event-name', payload, { bubbles: true, cancelable: true })
```

### `$nextTick`

```js
// 回调形式
$nextTick(() => { ... })

// Promise 形式
await $nextTick()
```

### `$root`

```html
<div x-data data-message="Hi">
  <div>
    <button @click="alert($root.dataset.message)">Show</button>
  </div>
</div>
```

### `$data`

```js
// 把当前整个 reactive scope 传出去
externalFunc($data)
```

### `$id`

```html
<div x-id="['my-id']">
  <label :for="$id('my-id')">...</label>
  <input :id="$id('my-id')">
</div>

<!-- 带 key（loop 中） -->
<div x-id="['list-item']">
  <template x-for="(item, i) in items">
    <li :id="$id('list-item', [i])"></li>
  </template>
</div>
```

## 3 个全局 API

### `Alpine.data(name, factory)`

```js
Alpine.data('dropdown', () => ({
  open: false,
  init() { /* 自动调用 */ },
  destroy() { /* 自动调用 */ },
  toggle() { this.open = !this.open },
}))

// 带参数
Alpine.data('counter', (start = 0) => ({
  count: start,
  increment() { this.count++ },
}))
```

### `Alpine.store(name, data)`

```js
// 对象 store
Alpine.store('cart', {
  items: [],
  init() { /* 自动调用 */ },
  add(item) { this.items.push(item) },
  get total() { return this.items.length },
})

// 单值 store
Alpine.store('darkMode', false)
```

### `Alpine.bind(name, attributes)`

```js
Alpine.bind('PrimaryButton', () => ({
  type: 'button',
  class: 'btn-primary',
  '@click'() { this.handleClick() },
  ':disabled'() { return this.loading },
}))
```

```html
<button x-data x-bind="PrimaryButton">...</button>
```

## 9 个官方插件清单

| 插件 | npm 包 | 主要 API |
|---|---|---|
| **Persist** | `@alpinejs/persist` | `$persist(value).as(key).using(storage)` |
| **Intersect** | `@alpinejs/intersect` | `x-intersect` / `:enter` / `:leave` |
| **Mask** | `@alpinejs/mask` | `x-mask` / `x-mask:dynamic` / `$money` |
| **Morph** | `@alpinejs/morph` | `Alpine.morph(el, html, opts)` / `Alpine.morphBetween` |
| **Focus** | `@alpinejs/focus` | `x-trap` / `$focus` |
| **Collapse** | `@alpinejs/collapse` | `x-collapse.duration.500ms` / `.min.50px` |
| **Anchor** | `@alpinejs/anchor` | `x-anchor` / Floating UI 内核 |
| **Sort** | `@alpinejs/sort` | `x-sort` / `:item` / `:handle` / `:group` |
| **Resize** | `@alpinejs/resize` | `x-resize` / `$width` / `$height` / `.document` |

### Persist 完整 API

```js
$persist(initialValue)                     // localStorage
$persist(initialValue).as('custom-key')    // 自定义 key
$persist(initialValue).using(sessionStorage)  // sessionStorage
$persist(initialValue).using(customStorage)   // 自定义（需 getItem / setItem）

Alpine.$persist(...)                       // 全局访问（store / Alpine.data 外）
```

### Intersect 修饰符

| 修饰符 | 作用 |
|---|---|
| `.once` | 只触发一次 |
| `.half` | 50% 阈值 |
| `.full` | 99% 阈值 |
| `.threshold.XX` | 自定义阈值 0-100 |
| `.margin.XXpx` | 视口边距 |
| `:enter` / `:leave` | 仅进入 / 仅离开 |

### Mask 占位符

| 占位符 | 匹配 |
|---|---|
| `9` | 数字（0-9） |
| `a` | 字母（a-z, A-Z） |
| `*` | 任意字符 |
| `9{n}` | n 个数字 |
| `a{n}` | n 个字母 |

```html
<input x-mask="999-9999">
<input x-mask:dynamic="condition ? 'a' : 'b'">
<input x-mask:dynamic="$money($input)">
```

### Morph 钩子

```js
Alpine.morph(el, newHtml, {
  key(el) { return el.id },
  updating(from, to, childrenOnly, skip) { },
  updated(from, to) { },
  removing(el, skip) { },
  removed(el) { },
  adding(el, skip) { },
  added(el) { },
})
```

### Focus 修饰符 / Magic

```html
<div x-trap="open">                          <!-- 基础 -->
<div x-trap.inert="open">                    <!-- + aria-hidden 兄弟节点 -->
<div x-trap.noscroll="open">                 <!-- 锁滚动 -->
<div x-trap.noreturn="open">                 <!-- 不还原焦点 -->
<div x-trap.noautofocus="open">              <!-- 不自动 focus -->
```

```js
$focus.focus(el)            // 聚焦指定
$focus.first()              // 首个可聚焦
$focus.last()               // 末个
$focus.next()               // 下一个
$focus.previous()           // 上一个
$focus.wrap()               // 启用循环
$focus.within(el)           // 限定容器
$focus.focusable(el)        // 检查
$focus.focusables()         // 全部
```

### Anchor 位置 + 修饰符

```html
<div x-anchor="$refs.button">                          <!-- 默认 bottom -->
<div x-anchor.bottom-start="...">
<div x-anchor.bottom-end="...">
<div x-anchor.top="...">
<div x-anchor.top-start="...">
<div x-anchor.top-end="...">
<div x-anchor.left="...">
<div x-anchor.left-start="...">
<div x-anchor.left-end="...">
<div x-anchor.right="...">
<div x-anchor.right-start="...">
<div x-anchor.right-end="...">

<div x-anchor.offset.10="...">                <!-- 偏移 -->
<div x-anchor.noflip="...">                   <!-- 不自动翻转 -->
<div x-anchor.no-style="..." :style="$anchor">  <!-- 自己控制样式 -->
```

### Sort 配置

```html
<ul x-sort>...</ul>
<ul x-sort="(key, position) => move(key, position)">...</ul>
<ul x-sort.ghost>                              <!-- 视觉占位 -->
<ul x-sort x-sort:group="my-group">            <!-- 跨容器拖 -->

<!-- 子元素 -->
<li x-sort:item="key">
  <span x-sort:handle>⋮⋮</span>             <!-- 仅 handle 可拖 -->
  <button x-sort:ignore>Delete</button>       <!-- 不触发拖拽 -->
</li>

<!-- 透传 SortableJS 配置 -->
<ul x-sort x-sort:config="{ animation: 300 }">...</ul>
```

### Resize 用法

```html
<div x-resize="width = $width; height = $height">...</div>
<div x-resize.document="...">              <!-- 整个 document -->
```

## 高级 API

### `Alpine.reactive(obj)` / `Alpine.effect(fn)` / `Alpine.release(dispose)`

```js
const data = Alpine.reactive({ count: 0 })

const dispose = Alpine.effect(() => {
  console.log(data.count)
})

data.count++   // 触发 effect

Alpine.release(dispose)  // 停止订阅
```

### `Alpine.directive(name, callback)`

```js
Alpine.directive('uppercase', (el, { expression }, { evaluateLater, effect }) => {
  const getter = evaluateLater(expression)
  effect(() => {
    getter(value => {
      el.textContent = String(value).toUpperCase()
    })
  })
})
```

### `Alpine.magic(name, callback)`

```js
Alpine.magic('clipboard', () => subject => navigator.clipboard.writeText(subject))
```

```html
<button @click="$clipboard('Hello!')">Copy</button>
```

### `Alpine.plugin(plugin)`

```js
import persist from '@alpinejs/persist'
import intersect from '@alpinejs/intersect'

Alpine.plugin(persist)
Alpine.plugin(intersect)
// 或批量
Alpine.plugin([persist, intersect])
```

### `Alpine.start()` / `Alpine.initTree(el)`

```js
Alpine.start()              // 启动 + 扫描整个 document
Alpine.initTree(element)    // 仅扫描指定子树（动态插入新 DOM 时用）
```

### 全局生命周期事件

```js
// 启动前（注册 store / data / plugin 的时机）
document.addEventListener('alpine:init', () => {
  Alpine.data('foo', ...)
})

// 启动完成后
document.addEventListener('alpine:initialized', () => {
  console.log('Alpine ready')
})
```

## CDN 链接（推荐锁版本）

```html
<!-- 核心 -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>

<!-- CSP 友好版（替代核心，二选一） -->
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/csp@3.14.1/dist/cdn.min.js"></script>

<!-- 插件（在核心之前加载） -->
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/persist@3.14.1/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/intersect@3.14.1/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/mask@3.14.1/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/morph@3.14.1/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/focus@3.14.1/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.14.1/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/anchor@3.14.1/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/sort@3.14.1/dist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/resize@3.14.1/dist/cdn.min.js"></script>
```

## NPM 包

| 包 | 用途 |
|---|---|
| `alpinejs` | 核心 |
| `@alpinejs/csp` | CSP 友好版 |
| `@alpinejs/persist` | $persist 状态持久化 |
| `@alpinejs/intersect` | x-intersect 视口检测 |
| `@alpinejs/mask` | x-mask 输入掩码 |
| `@alpinejs/morph` | Alpine.morph DOM 差量更新 |
| `@alpinejs/focus` | x-trap 焦点管理 |
| `@alpinejs/collapse` | x-collapse 折叠动画 |
| `@alpinejs/anchor` | x-anchor 浮动定位 |
| `@alpinejs/sort` | x-sort 拖拽排序 |
| `@alpinejs/resize` | x-resize 尺寸监听 |

## TypeScript 配置

```bash
pnpm add alpinejs
pnpm add -D @types/alpinejs
```

```ts
// src/main.ts
import Alpine from 'alpinejs'
import persist from '@alpinejs/persist'

declare global {
  interface Window {
    Alpine: typeof Alpine
  }
}

window.Alpine = Alpine
Alpine.plugin(persist)

interface CartItem {
  id: number
  price: number
}

Alpine.data('cart', () => ({
  items: [] as CartItem[],
  add(item: CartItem) { this.items.push(item) },
}))

Alpine.start()
```

## Alpine 内部属性（DevTools 调试用）

| 属性 | 含义 |
|---|---|
| `el._x_dataStack` | 元素的 reactive scope 栈（最近 x-data） |
| `el._x_attributesAdded` | Alpine 添加的属性 |
| `el._x_ignore` | 是否被 x-ignore 标记 |
| `el._x_model` | x-model 绑定的 getter/setter |
| `el._x_refs` | $refs 引用集合 |

```js
// DevTools 选中元素后：
$0._x_dataStack[0]    // 当前 scope
Alpine.$data($0)      // 同义（API）
```

## 版本里程碑

| 版本 | 时间 | 关键特性 |
|---|---|---|
| **1.0** | 2019.11 | Caleb Porzio 首次发布；10 个指令 |
| **2.0** | 2020.7 | `$store` 引入；性能优化 |
| **2.8** | 2021.4 | 2.x 收官 |
| **3.0** | 2021.5 | 重写 ESM 架构；新增魔术属性 / 插件系统 |
| **3.4** | 2021.10 | x-modelable / x-teleport |
| **3.10** | 2022.5 | x-effect / Morph 改进 |
| **3.12** | 2023.2 | x-id 引入；性能提升 |
| **3.13** | 2023.10 | Sort 插件 / Anchor 插件 / Mask 改进 |
| **3.14** | 2024.1 | Morph 算法 / x-bind 性能提升 |

::: tip 推荐版本
**3.14.x** 是当前主流稳定版。CDN 锁版用 `@3.14.1`；新项目用 `@3.x.x`（自动取最新 3.x）。
:::

## 浏览器兼容

| 浏览器 | 支持 |
|---|---|
| Chrome / Edge | 84+ |
| Firefox | 75+ |
| Safari | 13+ |
| IE 11 | **不支持**（Alpine 3 用 ES2020+） |

## 资源

- 官网：[alpinejs.dev](https://alpinejs.dev/)
- GitHub：[alpinejs/alpine](https://github.com/alpinejs/alpine)
- 组件：[alpinejs.dev/components](https://alpinejs.dev/components)
- Discord：[Alpine.js Discord](https://discord.com/invite/alpinejs)
- 配套：[Livewire](https://livewire.laravel.com/)（PHP 全栈）/ [HTMX](https://htmx.org/)（请求层）
- 编辑器：[Alpine.js IntelliSense (VS Code)](https://marketplace.visualstudio.com/items?itemName=adrianwilczynski.alpine-js-intellisense)

## 相关项目

- **Livewire**（laravel-livewire/livewire）：Caleb Porzio 的 Laravel 全栈框架，深度集成 Alpine
- **Pines**（pinesui/pines）：基于 Alpine + Tailwind 的免费组件集合
- **Penguin UI**（penguinui/penguin-ui）：Alpine 组件库
- **Component Party**（component-party.dev）：Alpine 与其他框架对比的代码片段集合
