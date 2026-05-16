---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Lit 3.2.x / 3.3.x 编写，覆盖装饰器、模板、生命周期、Reactive Controllers、Directives、样式、Shadow DOM、Context、SSR、集成、测试与实战

## 心智模型：组件 = 标准 custom element

Lit 不是「重写组件模型」的库，而是「**让标准 Web Components 好用**」的工具集：

```ts
@customElement('my-button')
export class MyButton extends LitElement {
  // ↑ 这就是浏览器原生 HTMLElement 的子类
  // ↓ 注册之后 <my-button> 在任何 HTML 中都能用
}
```

**继承链**：

```
HTMLElement
  └── ReactiveElement     // Lit 的响应式基类（无模板能力）
        └── LitElement    // 加上 html`` 模板能力
```

`ReactiveElement` 提供「响应式属性 + 更新调度 + 控制器」；`LitElement` 在它之上加了 `render()` 方法 + `html` 模板。要做无模板的纯响应式 custom element（如 `<my-data-loader>`）可以直接继承 `ReactiveElement`。

**与 React/Vue 的根本路线差异**：

| 路线 | Lit | React | Vue |
|---|---|---|---|
| 组件本质 | **浏览器原生 custom element** | JS 函数（VDOM 节点） | 编译产物（vnode） |
| 注册到运行时 | 浏览器 `customElements.define()` | React Reconciler | Vue 实例 |
| 跨框架可用 | **是**（标签即元素） | 否 | 否 |
| 状态变化 → 渲染 | dirty-checking 模板槽位 | VDOM diff | patchFlag |
| 样式作用域 | **Shadow DOM**（默认） | CSS Modules / inline | scoped CSS |

理解「Lit 组件 = HTMLElement 子类」是后续所有概念的钥匙。

## 装饰器全表

Lit 装饰器都从 `lit/decorators.js` 导入：

```ts
import {
  customElement,
  property,
  state,
  query,
  queryAll,
  queryAsync,
  queryAssignedElements,
  queryAssignedNodes,
  eventOptions,
} from 'lit/decorators.js'
```

| 装饰器 | 作用 | 用法 |
|---|---|---|
| `@customElement(tag)` | 注册 custom element | `@customElement('my-el')` |
| `@property(opts?)` | 公共响应式属性（带 attribute） | `@property({ type: Number }) count = 0` |
| `@state()` | 内部响应式状态（无 attribute） | `@state() private _open = false` |
| `@query(sel)` | 单元素 querySelector（lazy getter） | `@query('input') input!: HTMLInputElement` |
| `@queryAll(sel)` | querySelectorAll（NodeList） | `@queryAll('li') items!: NodeListOf<HTMLLIElement>` |
| `@queryAsync(sel)` | 异步 query（等下次更新） | `@queryAsync('input') input!: Promise<HTMLInputElement>` |
| `@queryAssignedElements(opts?)` | 获取 slot 分配的元素 | `@queryAssignedElements({ slot: 'icon' }) icons!: Element[]` |
| `@queryAssignedNodes(opts?)` | 获取 slot 分配的节点（含文本） | `@queryAssignedNodes() defaultSlot!: Node[]` |
| `@eventOptions(opts)` | 给方法加事件 listener 选项 | `@eventOptions({ passive: true }) onScroll() {}` |

### @property 完整选项

```ts
@property({
  type: Number,                   // 类型：String / Number / Boolean / Array / Object / 自定义类
  attribute: 'data-id',           // attribute 名（默认是属性名 kebab-case；false 表示不映射）
  reflect: true,                  // 属性变化反射回 attribute
  noAccessor: false,              // 不要自动生成 getter/setter（手动控制）
  state: false,                   // 等价 @state()
  hasChanged: (n, o) => n !== o,  // 自定义变化判断（默认 !==）
  converter: {                    // 自定义 attribute ↔ property 转换
    fromAttribute: (v) => Number(v),
    toAttribute: (v) => String(v),
  },
  useDefault: true,               // 初始值不反射；attribute 移除时重置（Lit 3.x 新增）
})
```

最关键的两个：

- `type`：默认 `String`；告诉 Lit 如何把 HTML attribute 字符串反序列化为属性值
- `attribute`：默认开启，attribute 名是属性名小写。`attribute: false` 表示完全不与 HTML attribute 关联（适合复杂对象 / 函数 prop）

### @state 内部状态

`@state()` = `@property({ state: true, attribute: false })`——只触发响应式更新，不暴露为公共 API：

```ts
@customElement('open-menu')
export class OpenMenu extends LitElement {
  @property({ type: Boolean })
  open = false              // 公共 API：HTML <open-menu open> 可控

  @state()
  private _highlightedIndex = 0   // 内部状态：键盘高亮项
}
```

约定：私有字段加下划线前缀 + `private` 关键字。

### @query / @queryAll：DOM 引用

```ts
@customElement('text-input')
export class TextInput extends LitElement {
  @query('input')
  private _input!: HTMLInputElement   // lazy getter，每次访问都 querySelector

  @query('input', true)
  private _inputCached!: HTMLInputElement  // 第二个参数 cache=true，只 querySelector 一次

  @queryAll('li')
  private _items!: NodeListOf<HTMLLIElement>

  focus() {
    this._input.focus()
  }

  render() {
    return html`<input>`
  }
}
```

`@query(sel, cache?)` 的 `cache: true` 适合「DOM 不会移除/重建」的场景，能避免重复 querySelector。

### @queryAssignedElements：访问 slot 内容

```ts
@customElement('icon-button')
export class IconButton extends LitElement {
  @queryAssignedElements({ slot: 'icon', selector: 'svg' })
  private _icons!: SVGElement[]

  protected firstUpdated() {
    console.log('图标数量', this._icons.length)
  }

  render() {
    return html`
      <button>
        <slot name="icon"></slot>
        <slot></slot>
      </button>
    `
  }
}
```

选项：

- `slot`：指定哪个具名 slot（不传则默认 slot）
- `selector`：CSS 选择器过滤
- `flatten`：把嵌套 slot 摊平
- `slotName`：旧版选项（同 `slot`）

### @eventOptions

把方法做成 listener 时附加 `addEventListener` 选项：

```ts
@customElement('scroll-watch')
export class ScrollWatch extends LitElement {
  @eventOptions({ passive: true })
  private _onWheel(e: WheelEvent) {
    // passive listener，不会阻塞滚动
  }

  render() {
    return html`<div @wheel=${this._onWheel}>...</div>`
  }
}
```

也可以直接在模板里写成对象：`@wheel=${{handleEvent: this._onWheel, passive: true}}`。

## 模板系统深入

`html` tagged template 返回 `TemplateResult` 对象（不是字符串），由 Lit 运行时**只在首次渲染时解析 HTML 模板**，之后只更新变化的「槽位（part）」：

```ts
import { html, render, nothing } from 'lit'

const result = html`<p>Hello ${name}</p>`
// 不会立即渲染，只是描述一个 TemplateResult

render(result, document.body)  // 提交到 DOM
```

**底层原理**：

- 模板字符串数组在 JavaScript 引擎中是**值唯一**的（同模板每次返回同一个数组引用）
- Lit 用这个唯一性做模板缓存：首次解析为 `<template>` 元素，后续只更新表达式槽位
- 这就是 Lit 「无 VDOM 但性能仍然好」的核心机制

### 5 种绑定 + sentinel 值

```ts
render() {
  return html`
    <!-- 1. 子节点：插入文本 / 数字 / TemplateResult / 数组 / nothing -->
    <p>${this.message}</p>
    <p>${this.show ? html`<b>Yes</b>` : nothing}</p>
    <ul>${this.items.map(i => html`<li>${i}</li>`)}</ul>

    <!-- 2. attribute：字符串化 -->
    <a href=${this.url} class="link ${this.active ? 'on' : ''}">Go</a>

    <!-- 3. property：直接 setter -->
    <input .value=${this.text}>
    <select .selectedIndex=${this.index}></select>

    <!-- 4. 布尔 attribute：true 加 / false 移 -->
    <button ?disabled=${this.loading} ?aria-busy=${this.loading}>OK</button>

    <!-- 5. 事件：addEventListener -->
    <button @click=${this._onClick} @mouseenter=${this._onHover}>Click</button>

    <!-- 6. 元素表达式：directive 专用 -->
    <input ${ref(this._inputRef)}>
  `
}
```

### sentinel 值

```ts
import { nothing, noChange } from 'lit'

// nothing：渲染为「无内容」（移除 attribute / 不渲染 child）
render() {
  return html`<p title=${this.tip ?? nothing}>${this.text || nothing}</p>`
}

// noChange：跳过这次更新（保持上次值）
@property() count = 0
render() {
  return html`<p>${this.count > 0 ? this.count : noChange}</p>`
}
```

`nothing` 是「绑定为空」，`noChange` 是「跳过本次更新」——前者会清除上次内容，后者保留。

### 子节点表达式可以是什么

```ts
const value = 'hello'                          // 字符串
const num = 42                                 // 数字
const tpl = html`<b>x</b>`                     // TemplateResult
const list = ['a', 'b', 'c']                   // 数组（递归插入）
const dom = document.createElement('span')     // DOM 节点
const empty = nothing                          // 空
const skip = noChange                          // 不变

html`<p>${value}</p>`        // 全部合法
```

### 字符串模板可以拆分

```ts
const item = (i: Item) => html`<li>${i.name}</li>`

render() {
  return html`
    <ul>
      ${this.items.map(item)}
    </ul>
  `
}
```

复用度高的子模板抽成独立函数——不会产生 React 那种「重渲染 + 重新创建函数」的性能问题（Lit 模板首次解析后被缓存）。

### 静态表达式（动态 tag 名）

正常的表达式不允许在 tag 名或 attribute 名位置。如果需要，用 `static-html.js`：

```ts
import { html, literal, unsafeStatic } from 'lit/static-html.js'

const tag = literal`a`  // 推荐：编译时白名单
// 或动态（unsafe）：
const dynamicTag = unsafeStatic(this.tagName)

render() {
  return html`<${tag} href="...">link</${tag}>`
}
```

::: warning unsafeStatic 性能
**变化频繁的 static 表达式会摧毁模板缓存**——每个不同的 static 值都重新解析整个模板。只在「极少变化的场景」才用 `unsafeStatic`。
:::

## 响应式属性生命周期

属性变化 → 重新渲染的完整流程：

```
property 变化 (this.count = 1)
  ↓ hasChanged(new, old) 返回 true
requestUpdate() 触发
  ↓ 微任务批处理
performUpdate()
  ↓ shouldUpdate(changedProperties) 返回 true
willUpdate(changedProperties)        ← 计算派生状态
  ↓
update(changedProperties)             ← 反射 attribute + 调 render()
  ↓
render() 返回新 TemplateResult
  ↓ Lit 对 TemplateResult 做 dirty-check + 更新槽位
updated(changedProperties)            ← DOM 已更新，可读 DOM
  ↓ 首次：firstUpdated()
updateComplete Promise resolves
```

完整钩子表：

| 钩子 | 触发时机 | 可改属性？ | 典型用途 |
|---|---|---|---|
| `constructor()` | 元素创建 | 是 | 默认值（很少用，Lit 字段初始化更好） |
| `connectedCallback()` | 加入 DOM | 是 | 注册外部事件 / 启动控制器 |
| `disconnectedCallback()` | 离开 DOM | 是 | 清理订阅 / 移除事件 |
| `adoptedCallback()` | 移到新 document | 是 | 极少用 |
| `attributeChangedCallback()` | observed attribute 变化 | 否（Lit 自动处理） | 自动同步到 property，无需手写 |
| `shouldUpdate(changed)` | 更新前 | 否 | 返回 false 跳过更新 |
| `willUpdate(changed)` | render 前 | **是** | 计算依赖其他属性的派生值 |
| `update(changed)` | render 前（反射 attribute 后） | 是（但通常不重写） | 罕见，重写时要 `super.update()` |
| `render()` | update 中 | 否 | 返回 TemplateResult |
| `firstUpdated(changed)` | 首次 DOM 更新后 | 是 | 一次性 DOM 初始化（focus / Observer） |
| `updated(changed)` | 每次 DOM 更新后 | 是 | 读 DOM / 派发事件 / 动画 |
| `updateComplete` | DOM 更新完成 | - | `await` 等待更新（测试常用） |

### willUpdate vs updated

```ts
@customElement('user-card')
export class UserCard extends LitElement {
  @property() firstName = ''
  @property() lastName = ''
  @state() private _fullName = ''

  // ✅ 计算派生值：在 willUpdate 里，避免触发额外更新
  willUpdate(changed: PropertyValues<this>) {
    if (changed.has('firstName') || changed.has('lastName')) {
      this._fullName = `${this.firstName} ${this.lastName}`
    }
  }

  // ✅ 读 DOM：在 updated 里，此时 DOM 已经反映最新状态
  updated(changed: PropertyValues<this>) {
    if (changed.has('_fullName')) {
      console.log('rendered name', this.shadowRoot!.textContent)
    }
  }

  render() {
    return html`<p>${this._fullName}</p>`
  }
}
```

::: warning 在 updated 里写属性
在 `updated()` 里写属性会**再触发一次更新**——通常不是问题（异步合并），但要避免死循环：用 `changedProperties.has()` 守护，不要无条件写。
:::

### shouldUpdate：跳过更新

```ts
shouldUpdate(changed: PropertyValues<this>): boolean {
  // 只有 mode 变化才更新（忽略 internalCounter 等噪声）
  return changed.has('mode')
}
```

返回 `false` 直接跳过 update → render，**省 CPU**。但要注意：跳过的属性变化**不会再次得到机会**——下次更新时它们已经在 `changedProperties` 之外了。

### requestUpdate：手动触发

非属性变化也需要重渲染时：

```ts
// 定时器场景
hostConnected() {
  this._timer = setInterval(() => {
    this.host.requestUpdate()
  }, 1000)
}

// 外部 setter
private _externalData: any
get data() { return this._externalData }
set data(v) {
  const old = this._externalData
  this._externalData = v
  this.requestUpdate('data', old)
}
```

`requestUpdate(name?, oldValue?)`：参数可选——传了会进入 `changedProperties`；不传只是触发一次更新。

### updateComplete

```ts
// 测试场景
it('点击后更新', async () => {
  el.shadowRoot!.querySelector('button')!.click()
  await el.updateComplete       // 等待更新完成
  expect(el.count).to.equal(1)
})

// updateComplete 返回的 Promise resolve 值是 boolean：
// true = 已完成；false = 期间又触发了更新（极少见）
```

`updateComplete` 是 **Promise**——`await` 它能等到 DOM 渲染完成。所有需要测量 DOM 的逻辑都应该 `await el.updateComplete`。

## Reactive Controllers 深入

控制器是 Lit 的核心组合复用机制——**比 mixin 干净、比 HOC 简单**：

```ts
import { ReactiveController, ReactiveControllerHost } from 'lit'

export class MouseController implements ReactiveController {
  host: ReactiveControllerHost
  pos = { x: 0, y: 0 }

  private _onMouseMove = (e: MouseEvent) => {
    this.pos = { x: e.clientX, y: e.clientY }
    this.host.requestUpdate()
  }

  constructor(host: ReactiveControllerHost) {
    this.host = host
    host.addController(this)
  }

  hostConnected() {
    window.addEventListener('mousemove', this._onMouseMove)
  }

  hostDisconnected() {
    window.removeEventListener('mousemove', this._onMouseMove)
  }
}
```

```ts
@customElement('mouse-tracker')
export class MouseTracker extends LitElement {
  private mouse = new MouseController(this)

  render() {
    return html`<p>x=${this.mouse.pos.x} y=${this.mouse.pos.y}</p>`
  }
}
```

### 与 Mixin 对比

| 维度 | Reactive Controller | Mixin（旧路线） |
|---|---|---|
| 接入方式 | 实例化 + `addController` | `class X extends MyMixin(LitElement)` |
| 标识 | 有自己的对象引用（this.mouse） | 混入到 host 原型，无独立 this |
| 多实例 | **可**（new 两个 controller） | 不可（mixin 同名方法冲突） |
| 类型 | 标准 TS class，类型清晰 | TS Mixin 类型推导复杂 |
| 复用粒度 | 任意函数式组合 | 类继承链 |
| 命名冲突 | 无（隔离在 controller 实例上） | 高（同名方法 / 属性会覆盖） |
| 推荐度 | **强烈推荐** | 仅遗留场景保留 |

Reactive Controller 在 2021 年与 Lit 2 一起发布，**官方明确推荐替代 Mixin**。

### 完整生命周期钩子

```ts
class FullLifecycleController implements ReactiveController {
  hostConnected() {
    // 宿主 connectedCallback 之后
  }

  hostDisconnected() {
    // 宿主 disconnectedCallback 之后
  }

  hostUpdate() {
    // 宿主 update() 之前（DOM 尚未更新）
    // 适合读「更新前」的 DOM 状态
  }

  hostUpdated() {
    // 宿主 updated() 之后（DOM 已更新）
    // 适合读最新 DOM
  }
}
```

### 常用社区控制器

- **`@lit-labs/router`**：基础路由 controller
- **`@lit-labs/motion`**：动画 controller（FLIP）
- **`@lit-labs/observers`**：IntersectionObserver / ResizeObserver / MutationObserver / PerformanceObserver 包装
- **`@lit/task`**：异步任务 controller（见后文）
- **`@lit/context`**：context 消费者本质也是 controller

### 实战示例：ResizeObserverController

```ts
import { ReactiveController, ReactiveControllerHost } from 'lit'

export class ResizeController implements ReactiveController {
  host: ReactiveControllerHost & Element
  size = { width: 0, height: 0 }
  private _observer?: ResizeObserver

  constructor(host: ReactiveControllerHost & Element) {
    this.host = host
    host.addController(this)
  }

  hostConnected() {
    this._observer = new ResizeObserver(([entry]) => {
      this.size = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }
      this.host.requestUpdate()
    })
    this._observer.observe(this.host)
  }

  hostDisconnected() {
    this._observer?.disconnect()
  }
}
```

```ts
@customElement('responsive-card')
export class ResponsiveCard extends LitElement {
  private resize = new ResizeController(this)

  render() {
    const isWide = this.resize.size.width > 600
    return html`
      <div class=${isWide ? 'wide' : 'narrow'}>
        ${this.resize.size.width}px
      </div>
    `
  }
}
```

## 内置指令全表

指令从 `lit/directives/*.js` 单独导入——**按需打包**：

```ts
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'
import { repeat } from 'lit/directives/repeat.js'
// ...
```

### 类与样式

| 指令 | 用途 | 示例 |
|---|---|---|
| `classMap(obj)` | 根据对象切类名 | `<div class=${classMap({ active: open })}>` |
| `styleMap(obj)` | 根据对象切样式 | `<div style=${styleMap({ color: 'red' })}>` |

```ts
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'

render() {
  return html`
    <div
      class=${classMap({
        card: true,
        'card--active': this.active,
        'card--disabled': this.disabled,
      })}
      style=${styleMap({
        color: this.color,
        '--my-var': '#fff',
        backgroundColor: this.bg,
      })}
    >...</div>
  `
}
```

### 条件 / 循环

| 指令 | 用途 |
|---|---|
| `when(cond, T, F?)` | 条件渲染（替代三元） |
| `choose(key, cases, fallback?)` | switch/case |
| `map(items, fn)` | iterable map（懒求值） |
| `repeat(items, keyFn, tpl)` | 带 key 的高效列表 |
| `range(n)` | 数字序列 |
| `join(items, sep)` | iterable 间插入分隔符 |

```ts
import { when } from 'lit/directives/when.js'
import { choose } from 'lit/directives/choose.js'
import { repeat } from 'lit/directives/repeat.js'

render() {
  return html`
    ${when(
      this.loading,
      () => html`<spinner></spinner>`,
      () => html`<content .data=${this.data}></content>`
    )}

    ${choose(this.status, [
      ['idle', () => html`<p>Idle</p>`],
      ['loading', () => html`<spinner></spinner>`],
      ['done', () => html`<p>Done</p>`],
    ], () => html`<p>Unknown</p>`)}

    <ul>
      ${repeat(
        this.items,
        (item) => item.id,         // keyFn：必须！
        (item) => html`<li>${item.name}</li>`
      )}
    </ul>
  `
}
```

::: tip repeat vs map
- **`map(items, fn)`**：返回 iterable，渲染时按位置更新——**适合短列表 / 不重排**
- **`repeat(items, keyFn, tpl)`**：按 key 复用 DOM——**适合长列表 / 频繁重排 / 删除中间项**

类比 React 列表的 `key` prop——但 Lit 的 `repeat` 是显式 opt-in，`map` 没有 key 概念。
:::

### 属性条件

| 指令 | 用途 |
|---|---|
| `ifDefined(v)` | undefined 时移除 attribute |
| `live(v)` | 与 DOM 当前值比较（不是与上次表达式值） |

```ts
import { ifDefined } from 'lit/directives/if-defined.js'
import { live } from 'lit/directives/live.js'

render() {
  return html`
    <!-- ifDefined：href=undefined 时移除 href attribute（而不是写成 href="undefined"） -->
    <a href=${ifDefined(this.url)}>${this.text}</a>

    <!-- live：受控 input 的标准模式 -->
    <input
      .value=${live(this.value)}
      @input=${(e: any) => this.value = e.target.value}
    >
  `
}
```

::: warning live 的必要性
默认 Lit 把表达式与「上次表达式值」比较——但用户输入会改变 `<input>.value`，下次 Lit 看到「表达式没变」就不更新，导致**受控输入失效**。`live(v)` 强制与 **DOM 当前值** 比较，是受控输入的标准做法。
:::

### DOM 缓存与控制

| 指令 | 用途 |
|---|---|
| `cache(tpl)` | 切换模板时保留旧 DOM（缓存） |
| `guard(deps, tpl)` | 只在依赖变化时重算（性能优化） |
| `keyed(key, tpl)` | key 变化时强制重建 DOM |

```ts
import { cache } from 'lit/directives/cache.js'
import { guard } from 'lit/directives/guard.js'
import { keyed } from 'lit/directives/keyed.js'

render() {
  return html`
    <!-- cache：tab 切换时保留隐藏 tab 的 DOM 状态 -->
    ${cache(this.tab === 'a' ? html`<panel-a></panel-a>` : html`<panel-b></panel-b>`)}

    <!-- guard：deps 不变就跳过整个 tpl 求值（适合贵的子模板） -->
    ${guard([this.expensive], () => html`<expensive-chart .data=${this.expensive}></expensive-chart>`)}

    <!-- keyed：key 变化时摧毁旧 DOM 重建（适合切换 user 重置状态） -->
    ${keyed(this.userId, html`<user-detail .id=${this.userId}></user-detail>`)}
  `
}
```

### DOM 引用

`ref(refOrCallback)`：

```ts
import { ref, createRef, Ref } from 'lit/directives/ref.js'

@customElement('input-form')
export class InputForm extends LitElement {
  private _inputRef: Ref<HTMLInputElement> = createRef()

  focusInput() {
    this._inputRef.value?.focus()
  }

  render() {
    return html`<input ${ref(this._inputRef)}>`
  }
}

// 也可以传回调
render() {
  return html`<input ${ref((el) => console.log('input mounted', el))}>`
}
```

`createRef()` 创建的 `Ref` 对象有 `.value` 属性指向 DOM。回调形式在 DOM 挂载/卸载时调用。

### 异步与不安全

| 指令 | 用途 |
|---|---|
| `until(...values)` | 多个 Promise / 同步值，按 ready 顺序渲染 |
| `asyncAppend(iterable, tpl)` | async iterable 追加 |
| `asyncReplace(iterable, tpl)` | async iterable 替换 |
| `unsafeHTML(str)` | 解析字符串为 HTML（XSS 风险） |
| `unsafeSVG(str)` | 解析字符串为 SVG |
| `templateContent(tpl)` | 渲染 `<template>` 元素内容 |

```ts
import { until } from 'lit/directives/until.js'
import { asyncReplace } from 'lit/directives/async-replace.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

render() {
  return html`
    <!-- until：promise 完成前显示 loading -->
    ${until(this.fetchData(), html`<spinner></spinner>`)}

    <!-- asyncReplace：流式数据 -->
    ${asyncReplace(this.eventStream(), (e) => html`<event-card .data=${e}></event-card>`)}

    <!-- unsafeHTML：信任输入时才用 -->
    ${unsafeHTML(this.markdownHtml)}
  `
}
```

::: warning unsafeHTML XSS
**`unsafeHTML` 不会过滤**——把未信任内容传进去会导致 XSS。只在确认输入安全（自己生成 / 已经过滤）时使用。
:::

## 自定义指令

自定义 directive 用于「**模板系统级**」复用——比 controller 更轻量，作用在「单个绑定槽位」上：

```ts
import { Directive, directive, PartInfo, PartType, ChildPart } from 'lit/directive.js'
import { html } from 'lit'

class CountdownDirective extends Directive {
  private _count: number
  private _timer?: ReturnType<typeof setInterval>

  constructor(partInfo: PartInfo) {
    super(partInfo)
    if (partInfo.type !== PartType.CHILD) {
      throw new Error('countdown 指令只能用在 child 位置')
    }
    this._count = 0
  }

  render(seconds: number) {
    return `${seconds}s`
  }
}

export const countdown = directive(CountdownDirective)

// 使用：
html`<p>剩余 ${countdown(this.left)}</p>`
```

### Async Directive

需要在异步操作完成后更新 DOM 的指令：

```ts
import { AsyncDirective, directive } from 'lit/async-directive.js'

class StreamDirective extends AsyncDirective {
  private _stream?: AsyncIterable<string>

  render(stream: AsyncIterable<string>) {
    if (this._stream !== stream) {
      this._stream = stream
      this._consume()
    }
    return ''
  }

  private async _consume() {
    for await (const value of this._stream!) {
      if (!this.isConnected) break
      this.setValue(value)  // 异步推送新值到 DOM
    }
  }

  disconnected() { /* 清理 */ }
  reconnected() { /* 重连 */ }
}

export const stream = directive(StreamDirective)
```

`setValue(v)`：在任意时机推送新值，不依赖响应式更新流程。

### PartType 分类

```ts
enum PartType {
  ATTRIBUTE  = 1,  // 属性槽位
  CHILD      = 2,  // 子节点槽位
  PROPERTY   = 3,  // property 槽位
  BOOLEAN    = 4,  // ?attr 槽位
  EVENT      = 5,  // @event 槽位
  ELEMENT    = 6,  // 整元素槽位（${ref()}）
}
```

构造时检查 `PartInfo.type`，确保指令只在合适位置使用：

```ts
constructor(partInfo: PartInfo) {
  super(partInfo)
  if (partInfo.type !== PartType.ATTRIBUTE) {
    throw new Error('classMap 只能用于 class attribute')
  }
}
```

## 样式系统

### 静态样式

```ts
import { LitElement, html, css } from 'lit'

@customElement('my-card')
export class MyCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 16px;
      border: 1px solid var(--card-border, #ddd);
      border-radius: 8px;
    }
    :host([variant="primary"]) {
      background: #007aff;
      color: white;
    }
    .title {
      font-size: 18px;
      font-weight: bold;
    }
    ::slotted(p) {
      margin: 8px 0;
    }
  `
}
```

**关键选择器**：

- `:host`：组件自身
- `:host(selector)`：根据自身 attribute 条件选择（`:host([disabled])`）
- `:host-context(selector)`：根据祖先匹配（`:host-context(.dark)`）
- `::slotted(selector)`：slot 内容（**只能匹配直接子元素**）
- 普通选择器（如 `button` / `.class`）：作用于 Shadow DOM 内部

### 共享样式

```ts
// styles/button.ts
import { css } from 'lit'
export const buttonStyles = css`
  button {
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
  }
`

// my-button.ts
import { buttonStyles } from './styles/button'

@customElement('my-button')
export class MyButton extends LitElement {
  static styles = [
    buttonStyles,
    css`
      button { color: var(--btn-color, #333); }
    `,
  ]
}
```

`static styles = [a, b, c]` 数组形式合并多个 `CSSResult`。

### unsafeCSS：内联非 CSS 字符串

```ts
import { css, unsafeCSS } from 'lit'

const accentColor = '#007aff'

static styles = css`
  :host { color: ${unsafeCSS(accentColor)}; }
`
```

`css` tagged template **只允许嵌套 `CSSResult` 或数字**——其他类型必须用 `unsafeCSS()` 包装。

::: warning unsafeCSS XSS
**未过滤的字符串可能导致 CSS 注入**——只对可信输入使用。
:::

### CSS Custom Properties 主题

```ts
@customElement('themed-button')
export class ThemedButton extends LitElement {
  static styles = css`
    :host {
      --btn-bg: #007aff;
      --btn-color: white;
    }
    button {
      background: var(--btn-bg);
      color: var(--btn-color);
    }
  `
}
```

外部覆盖：

```html
<themed-button style="--btn-bg: red; --btn-color: black;"></themed-button>

<style>
  :root {
    --btn-bg: #28a745;   /* CSS custom property 穿透 Shadow DOM */
  }
</style>
```

**Shadow DOM 唯一的样式渗透通道**就是 CSS Custom Properties——这是 Lit 设计系统主题化的标准方案。

### CSS Parts

允许外部样式精准选中 Shadow DOM 内的特定元素：

```ts
@customElement('my-tab')
export class MyTab extends LitElement {
  render() {
    return html`
      <div part="label">${this.label}</div>
      <div part="indicator"></div>
    `
  }
}
```

```css
my-tab::part(label) {
  color: red;
}
my-tab[active]::part(indicator) {
  background: blue;
}
```

`part` attribute 让组件**显式声明可被外部样式定制的部分**——比 CSS Custom Properties 更结构化。

### adoptedStyleSheets

Lit 内部用 `adoptedStyleSheets` API（CSSStyleSheet 实例）实现样式共享——所有相同 `static styles` 的实例共享同一个 stylesheet 对象，**比 inline `<style>` 节省内存且更新更快**。这一切都是透明的，不用管。

## Shadow DOM + Slots

### Shadow DOM 默认开启

```ts
class MyEl extends LitElement {
  // 默认：开放 Shadow DOM
  // shadowRootOptions = { mode: 'open' }
}
```

要自定义：

```ts
static shadowRootOptions: ShadowRootInit = {
  ...LitElement.shadowRootOptions,
  delegatesFocus: true,    // 聚焦 host 时自动聚焦内部第一个可聚焦元素
  mode: 'closed',          // 关闭模式（外部 .shadowRoot 返回 null，不推荐）
}
```

`mode: 'closed'` 几乎不用——它**只是给开发者添麻烦**（不阻止逆向，也不增加安全）。

### Light DOM 模式

需要让外部样式（Tailwind / Bootstrap）穿透时，覆写 `createRenderRoot`：

```ts
@customElement('light-dom-el')
export class LightDomEl extends LitElement {
  protected createRenderRoot() {
    return this   // 渲染到自己（light DOM），不再有 Shadow DOM
  }

  // 注意：static styles 在 light DOM 模式下不生效
}
```

**代价**：

- 失去样式作用域（外部样式会污染内部）
- 失去 slot 抽象（外部 light DOM 元素直接是 children）
- 失去 `::slotted` 选择器

::: tip Light DOM 何时用
- 与 Tailwind / 全局 CSS 框架集成
- 需要 SEO（搜索引擎对 Shadow DOM 支持差）
- 服务端渲染时无 DSD polyfill 的旧浏览器

否则**始终保持 Shadow DOM 默认开启**——这是 Lit 最大的卖点之一。
:::

### Slot 基础

```ts
@customElement('my-card')
export class MyCard extends LitElement {
  render() {
    return html`
      <header><slot name="title"></slot></header>
      <main><slot></slot></main>
      <footer>
        <slot name="actions">默认 Action</slot>
        <!-- ↑ slot 内文本是 fallback：无内容时显示 -->
      </footer>
    `
  }
}
```

外部使用：

```html
<my-card>
  <h2 slot="title">标题</h2>
  <p>正文内容</p>
  <p>另一段</p>
  <button slot="actions">OK</button>
  <button slot="actions">Cancel</button>
</my-card>
```

slot 是「**透明的插入点**」——子节点仍然在外部 light DOM 中（DevTools 看得到），只是渲染位置被组件控制。

### 访问 slot 内容

```ts
@customElement('icon-tabs')
export class IconTabs extends LitElement {
  @queryAssignedElements({ slot: 'tab', selector: '[role="tab"]' })
  private _tabs!: HTMLElement[]

  @queryAssignedNodes({ slot: 'icon' })
  private _iconNodes!: Node[]

  protected firstUpdated() {
    this._tabs.forEach((tab, i) => {
      tab.setAttribute('tabindex', i === 0 ? '0' : '-1')
    })
  }

  private _onSlotChange() {
    // slot 内容变化时回调
    this.requestUpdate()
  }

  render() {
    return html`
      <slot name="tab" @slotchange=${this._onSlotChange}></slot>
      <slot name="icon"></slot>
    `
  }
}
```

`@slotchange` 是 DOM 事件——外部增删 slot 子节点时触发。

## Context API（@lit/context）

跨组件层级共享数据，无需 prop drilling：

```bash
pnpm add @lit/context
```

```ts
// theme-context.ts
import { createContext } from '@lit/context'

export interface Theme {
  mode: 'light' | 'dark'
  toggle: () => void
}

export const themeContext = createContext<Theme>(Symbol('theme'))
```

```ts
// theme-provider.ts
import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { provide } from '@lit/context'
import { themeContext, Theme } from './theme-context'

@customElement('theme-provider')
export class ThemeProvider extends LitElement {
  @state()
  private _mode: 'light' | 'dark' = 'light'

  @provide({ context: themeContext })
  theme: Theme = {
    mode: 'light',
    toggle: () => {
      this._mode = this._mode === 'light' ? 'dark' : 'light'
      this.theme = { ...this.theme, mode: this._mode }
    },
  }

  render() {
    return html`<slot></slot>`
  }
}
```

```ts
// theme-toggle.ts
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { themeContext, Theme } from './theme-context'

@customElement('theme-toggle')
export class ThemeToggle extends LitElement {
  @consume({ context: themeContext, subscribe: true })
  theme?: Theme

  render() {
    if (!this.theme) return html``
    return html`
      <button @click=${this.theme.toggle}>
        当前 ${this.theme.mode}
      </button>
    `
  }
}
```

`subscribe: true` 让消费者在 provider 值更新时**自动 requestUpdate**。

### 控制器形式（不用装饰器）

```ts
import { ContextProvider, ContextConsumer } from '@lit/context'

class MyProvider extends LitElement {
  private _ctx = new ContextProvider(this, { context: themeContext, initialValue: { mode: 'light', toggle: () => {} } })
}

class MyConsumer extends LitElement {
  private _theme = new ContextConsumer(this, {
    context: themeContext,
    subscribe: true,
    callback: (value) => { /* 值变化回调 */ },
  })

  render() {
    return html`mode: ${this._theme.value?.mode}`
  }
}
```

### 工作机制

Lit Context 基于 W3C 的 **Context Community Protocol**——本质是 DOM 事件：

- 消费者派发 `context-request` 事件（`bubbles: true, composed: true`）
- 提供者监听该事件并响应 callback
- 所以 context 沿 DOM 树自然传播——**不限于 Lit 组件**，任何符合协议的库都能互通

## 异步数据：@lit/task

异步任务管理，自动处理 loading / error / cancel：

```bash
pnpm add @lit/task
```

```ts
import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Task } from '@lit/task'

@customElement('user-card')
export class UserCard extends LitElement {
  @property({ type: Number })
  userId = 0

  private _userTask = new Task(this, {
    task: async ([userId], { signal }) => {
      if (!userId) return null
      const res = await fetch(`/api/users/${userId}`, { signal })
      if (!res.ok) throw new Error('Fetch failed')
      return res.json()
    },
    args: () => [this.userId],
  })

  render() {
    return this._userTask.render({
      initial: () => html`<p>请选择用户</p>`,
      pending: () => html`<spinner></spinner>`,
      complete: (user) => html`<p>${user?.name}</p>`,
      error: (err) => html`<p>Error: ${(err as Error).message}</p>`,
    })
  }
}
```

### 状态机

```ts
enum TaskStatus {
  INITIAL  = 0,   // 还没跑过
  PENDING  = 1,   // 进行中
  COMPLETE = 2,   // 完成
  ERROR    = 3,   // 失败
}

// 直接访问状态
console.log(this._userTask.status)
console.log(this._userTask.value)
console.log(this._userTask.error)
```

### 自动取消

`args` 返回的依赖变化时，**自动 abort 上次请求**（通过 `signal: AbortSignal`）：

```ts
private _searchTask = new Task(this, {
  task: async ([query], { signal }) => {
    const res = await fetch(`/api/search?q=${query}`, { signal })
    return res.json()
  },
  args: () => [this.query],
})
```

用户连续输入时，旧请求自动 abort——**避免回包乱序导致的 UI 闪烁**。

### 手动控制

```ts
// 关闭 autoRun，手动触发
private _task = new Task(this, {
  autoRun: false,
  task: async () => { /* ... */ },
  args: () => [],
})

// 在事件回调里手动跑
private _onClick() {
  this._task.run()
}
```

## TypeScript 集成

### 类型增强：HTMLElementTagNameMap

```ts
@customElement('my-button')
export class MyButton extends LitElement {
  @property() label = ''
}

declare global {
  interface HTMLElementTagNameMap {
    'my-button': MyButton
  }
}
```

之后：

```ts
const btn = document.createElement('my-button')   // 类型 MyButton
btn.label = 'OK'                                  // ✅ 有类型检查

document.querySelector<MyButton>('my-button')     // 也可以泛型显式
const found = document.querySelector('my-button') // 自动推为 MyButton | null
```

### tsconfig 关键选项

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "node",
    "experimentalDecorators": true,      // TypeScript 实验性装饰器
    "useDefineForClassFields": false,    // 必须 false（与装饰器配合）
    "strict": true
  }
}
```

或用 TC39 标准装饰器（TS 5.0+）：

```json
{
  "experimentalDecorators": false,
  "useDefineForClassFields": true        // 标准装饰器下可保持 true
}
```

::: warning useDefineForClassFields
**实验性装饰器路线 + `useDefineForClassFields: true` 是常见踩坑**——属性初始化会用 `[[DefineOwnProperty]]` 覆盖 Lit 的 setter，导致响应式失效。

最安全：实验装饰器路线显式设 `useDefineForClassFields: false`。
:::

### Custom Element Manifest（CEM）

发布组件包给消费方：

```bash
pnpm add -D @custom-elements-manifest/analyzer
npx cem analyze --litelement
```

生成 `custom-elements.json`——IDE / 文档站可读取它自动生成 props / events / slots 描述。`package.json` 加：

```json
{
  "customElements": "custom-elements.json"
}
```

VSCode 与 WebStorm 都支持读取 CEM 提供属性自动补全。

## 集成各前端框架

### React 集成

```bash
pnpm add @lit/react
```

```ts
// my-counter-react.ts
import { createComponent } from '@lit/react'
import * as React from 'react'
import { MyCounter } from './my-counter'

export const MyCounterReact = createComponent({
  tagName: 'my-counter',
  elementClass: MyCounter,
  react: React,
  events: {
    onChange: 'change',
    onSelect: 'select',
  },
})
```

```tsx
<MyCounterReact
  label="Click"
  step={2}
  onChange={(e) => console.log(e.detail)}
/>
```

**为什么需要 wrapper**：

- React 18 之前把所有 JSX 属性视为 attribute（字符串）——传不了复杂对象
- 自定义事件 `dispatchEvent(new CustomEvent('change'))` 在 React 不能用 `onChange` 直接监听
- `@lit/react` 的 `createComponent` 解决这两个问题

React 19 原生支持 custom element + property + event——但建议**仍用 wrapper**获得类型推导。

### Vue 集成

Vue 3 原生支持：

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import './my-counter'

const app = createApp(App)
app.config.compilerOptions.isCustomElement = (tag) => tag.includes('-')
app.mount('#app')
```

```vue
<template>
  <my-counter
    :label="text"
    :step.prop="step"
    @change="onChange"
  />
</template>
```

`.prop` 修饰符强制走 property（数字 / 对象正确传递）。

### Angular 集成

Angular 也支持 custom element，要在 `NgModule` 加 `CUSTOM_ELEMENTS_SCHEMA`：

```ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'

@NgModule({
  declarations: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```

```html
<my-counter [label]="text" [step]="step" (change)="onChange($event)"></my-counter>
```

Angular 的 `[prop]` 走 property binding，`(event)` 走 addEventListener——与 Lit 完全兼容。

### Svelte 集成

Svelte 也支持：

```svelte
<script lang="ts">
  import './my-counter'
  let count = 0
</script>

<my-counter label="Click" step={2} on:change={(e) => count = e.detail.count}>
</my-counter>
```

Svelte 的 `on:change` 等价 `addEventListener('change', ...)`。

## i18n：@lit/localize

```bash
pnpm add @lit/localize
pnpm add -D @lit/localize-tools
```

```ts
import { msg, str, updateWhenLocaleChanges } from '@lit/localize'

@customElement('greeting')
export class Greeting extends LitElement {
  constructor() {
    super()
    updateWhenLocaleChanges(this)  // locale 变化时 requestUpdate
  }

  @property() name = 'World'

  render() {
    return html`
      <h1>${msg('Hello!')}</h1>
      <p>${msg(str`Hi ${this.name}!`)}</p>
    `
  }
}
```

### 两种模式

**Runtime 模式**（推荐）：

- 单 bundle，动态加载 locale chunk
- `setLocale('zh')` 切换不刷新页面
- ~1.3 KB 运行时开销

**Transform 模式**：

- 每个 locale 单独 bundle（编译时把 `msg()` 替换为静态字符串）
- 零运行时开销
- 切换语言需要刷新页面

### 工作流

```bash
# 1. 配置 lit-localize.json
# 2. 提取要翻译的字符串
npx lit-localize extract

# 3. 翻译团队填 XLIFF 文件 (xliff/zh-CN.xlf)

# 4. 构建 locale chunks
npx lit-localize build
```

`lit-localize.json`：

```json
{
  "sourceLocale": "en",
  "targetLocales": ["zh-CN", "ja"],
  "tsConfig": "tsconfig.json",
  "output": {
    "mode": "runtime",
    "outputDir": "src/generated/locales/",
    "localeCodesModule": "src/generated/locale-codes.ts"
  },
  "interchange": {
    "format": "xliff",
    "xliffDir": "xliff/"
  }
}
```

## Lit SSR

```bash
pnpm add @lit-labs/ssr
```

```ts
// server.ts
import { render } from '@lit-labs/ssr'
import { html } from 'lit'
import './my-counter'

const result = render(html`<my-counter label="Hi"></my-counter>`)
let str = ''
for (const chunk of result) str += chunk

console.log(str)
// 输出包含 Declarative Shadow DOM：
// <my-counter label="Hi"><template shadowrootmode="open"><button>Hi</button>...</template></my-counter>
```

### Declarative Shadow DOM

`<template shadowrootmode="open">` 是 DSD——浏览器（Chrome 90+ / Safari 16.4+ / Firefox 123+）原生支持，无需 JS 也能渲染 Shadow DOM。旧浏览器需要 polyfill：

```html
<script src="https://cdn.jsdelivr.net/npm/@webcomponents/template-shadowroot"></script>
```

### Hydration

```html
<script type="module">
  import { hydrateShadowRoots } from '@webcomponents/template-shadowroot/template-shadowroot.js'
  hydrateShadowRoots(document.body)

  // 然后正常加载 Lit 组件
  await import('./my-counter.js')
</script>
```

### 集成

- **Eleventy**：`@lit-labs/eleventy-plugin-lit`
- **Next.js**：`@lit-labs/nextjs`（pages router）
- **Astro**：`@astrojs/lit`
- **Hono / Express**：手动包装

### 限制

- 不支持 async 组件（render 是同步的）
- Light DOM 组件不支持
- 仍标 Labs—— API 可能小幅调整

## 测试深入

### Web Test Runner + Open WC

```bash
pnpm add -D @web/test-runner @open-wc/testing @web/test-runner-playwright
```

```ts
// my-counter.test.ts
import { fixture, html, expect, oneEvent } from '@open-wc/testing'
import './my-counter'
import type { MyCounter } from './my-counter'

describe('MyCounter', () => {
  it('渲染初始 label', async () => {
    const el = await fixture<MyCounter>(html`<my-counter label="Hi"></my-counter>`)
    expect(el.shadowRoot!.textContent).to.include('Hi')
  })

  it('点击后 count 增加', async () => {
    const el = await fixture<MyCounter>(html`<my-counter step="3"></my-counter>`)
    el.shadowRoot!.querySelector('button')!.click()
    await el.updateComplete
    expect(el.shadowRoot!.querySelector('.count')!.textContent).to.equal('3')
  })

  it('派发 change 事件', async () => {
    const el = await fixture<MyCounter>(html`<my-counter></my-counter>`)
    setTimeout(() => el.shadowRoot!.querySelector('button')!.click())
    const e = await oneEvent(el, 'change')
    expect(e.detail.count).to.equal(1)
  })
})
```

`fixture` 把元素挂载到测试容器，自动 await `updateComplete`；`oneEvent` 等待一次事件。

### 跨浏览器

```js
// web-test-runner.config.mjs
import { playwrightLauncher } from '@web/test-runner-playwright'

export default {
  files: 'src/**/*.test.ts',
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  coverage: true,
  plugins: [
    /* esbuild plugin for TS */
  ],
}
```

跑 `pnpm test`——三个浏览器并行测试同一份代码。

### Vitest（Lit 也可以用）

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',  // 或 happy-dom
  },
})
```

```ts
import { describe, it, expect } from 'vitest'
import './my-counter'

it('属性反序列化', async () => {
  document.body.innerHTML = `<my-counter step="3"></my-counter>`
  const el = document.querySelector('my-counter') as any
  await el.updateComplete
  expect(el.step).to.equal(3)
})
```

**注意**：jsdom / happy-dom 对 Shadow DOM 支持有限——复杂场景仍建议用 Web Test Runner 跑真实浏览器。

## 实战：用 Lit 写跨框架设计系统

完整流程：

### 1. 项目结构

```
@my-org/ui/
├── src/
│   ├── button/
│   │   ├── my-button.ts
│   │   ├── my-button.test.ts
│   │   └── index.ts
│   ├── card/
│   │   ├── my-card.ts
│   │   └── ...
│   ├── styles/
│   │   ├── tokens.ts        # CSS Custom Properties
│   │   └── reset.ts         # Shadow DOM 内 reset
│   └── index.ts
├── docs/                    # VitePress / Storybook
├── react-wrapper/           # @my-org/ui-react
│   └── src/index.ts
├── vue-wrapper/             # @my-org/ui-vue
│   └── src/index.ts
├── custom-elements.json
├── package.json
└── tsconfig.json
```

### 2. 设计 Token 主题

```ts
// styles/tokens.ts
import { css } from 'lit'

export const tokens = css`
  :host {
    /* Color */
    --color-primary: #007aff;
    --color-danger: #ff3b30;
    --color-text: #1a1a1a;
    --color-bg: #ffffff;

    /* Spacing */
    --space-1: 4px;
    --space-2: 8px;
    --space-4: 16px;

    /* Typography */
    --font-base: system-ui, sans-serif;
    --font-size-sm: 14px;
    --font-size-md: 16px;
  }

  :host([theme="dark"]) {
    --color-text: #ffffff;
    --color-bg: #1a1a1a;
  }
`
```

### 3. 共享 Button 组件

```ts
// button/my-button.ts
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { tokens } from '../styles/tokens'

@customElement('my-button')
export class MyButton extends LitElement {
  static styles = [
    tokens,
    css`
      :host { display: inline-block; }
      button {
        font-family: var(--font-base);
        font-size: var(--font-size-md);
        padding: var(--space-2) var(--space-4);
        border-radius: 6px;
        border: none;
        cursor: pointer;
      }
      .variant-primary { background: var(--color-primary); color: white; }
      .variant-danger { background: var(--color-danger); color: white; }
      .variant-text { background: transparent; color: var(--color-primary); }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
    `,
  ]

  @property() variant: 'primary' | 'danger' | 'text' = 'primary'
  @property({ type: Boolean }) disabled = false

  render() {
    return html`
      <button
        class=${classMap({
          [`variant-${this.variant}`]: true,
        })}
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        <slot></slot>
      </button>
    `
  }

  private _onClick(e: MouseEvent) {
    if (this.disabled) {
      e.stopPropagation()
      return
    }
    this.dispatchEvent(new CustomEvent('press', {
      bubbles: true,
      composed: true,
    }))
  }
}
```

### 4. React Wrapper

```ts
// react-wrapper/src/index.ts
import { createComponent } from '@lit/react'
import * as React from 'react'
import { MyButton } from '@my-org/ui'

export const Button = createComponent({
  tagName: 'my-button',
  elementClass: MyButton,
  react: React,
  events: {
    onPress: 'press',
  },
})
```

### 5. Vue Wrapper（不需要）

Vue 3 直接用即可：

```vue
<my-button variant="primary" @press="onPress">点击</my-button>
```

只需在 `vite.config.ts` 配 `isCustomElement`。

### 6. 文档与发布

```bash
# 生成 CEM
npx cem analyze --litelement

# 发布
pnpm publish --access public
```

跨框架团队的痛点解决了——**一份组件，三个生态都能用**。

## 常见陷阱速查

- **`useDefineForClassFields: true` 与实验装饰器冲突** → 设 `false`
- **`@property` 在 attribute 反序列化 boolean 时**：HTML 中**只要 attribute 存在就是 true**（即使 `disabled="false"`）；要表达 false 必须**移除** attribute
- **`reflect: true` 性能开销** → 慎用，只在 CSS / 外部需要读 attribute 时开
- **受控 input 不更新** → 用 `live(this.value)` 而非 `.value=${this.value}`
- **`unsafeHTML` XSS** → 只对可信输入
- **`unsafeStatic` 摧毁模板缓存** → 慎用，会重新解析
- **Light DOM 模式 `static styles` 不生效** → 必须用 Shadow DOM 才能样式隔离
- **CustomEvent 不冒泡跨 Shadow DOM** → `composed: true` 才能穿越 Shadow boundary
- **`@property({ type: Boolean })` 反射** → 默认 attribute 出现/移除；显式 `reflect: true` 才同步回 HTML attribute
- **Async Directive 不在 server side 跑** → SSR 时 async 内容不会渲染
- **`@queryAssignedElements` 的 slot 名错** → 传 `slot: 'icon'` 必须与模板 `<slot name="icon">` 名一致
- **React 18 不能传对象 prop** → 用 `@lit/react` 的 `createComponent`
- **CSS `::slotted` 只能匹配直接子元素** → 嵌套结构匹配不到

## 性能优化

### 模板槽位最小化

```ts
// ❌ 整个表达式都跟随 active 变化
<div class="card ${this.active ? 'active' : 'inactive'}">

// ✅ 用 classMap，槽位边界清晰
<div class=${classMap({ card: true, active: this.active })}>
```

### 用 `repeat` 而非 `map`（长列表 / 重排）

```ts
// ❌ map 按位置更新——重排时大量 DOM 重建
${this.items.map(item => html`<li>${item.name}</li>`)}

// ✅ repeat 按 key 复用 DOM
${repeat(this.items, item => item.id, item => html`<li>${item.name}</li>`)}
```

### `guard` 守护贵的子模板

```ts
${guard([this.expensiveData], () =>
  html`<expensive-chart .data=${this.expensiveData}></expensive-chart>`
)}
```

### `cache` 保留隐藏 Tab 状态

```ts
${cache(
  this.tab === 'list'
    ? html`<list-view></list-view>`
    : html`<detail-view></detail-view>`
)}
```

### shouldUpdate 跳过更新

```ts
shouldUpdate(changed: PropertyValues<this>) {
  // 只关心 mode 变化，其他属性变化不重渲染
  return changed.has('mode')
}
```

## 资源链接

- [Lit 官方文档](https://lit.dev/)
- [Lit GitHub](https://github.com/lit/lit)
- [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/)
- [Open Web Components](https://open-wc.org/)
- [Web Components 黄金书](https://www.webcomponents.guide/)
- [Lit Patterns](https://lit.dev/articles/) — 官方文章合集

## 接下来

完成本指南后建议读 [参考](./reference.md)：API 速查 / 选项表 / 命名约定 / 与 Stencil/FAST/Hybrids 对比。
