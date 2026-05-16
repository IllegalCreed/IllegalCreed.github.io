---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Lit 3.2.x / 3.3.x。API 速查 / 选项表 / 命名约定 / 与 Stencil/FAST/Hybrids 对比

## 包结构速查

Lit 主包 + 卫星包：

| 包 | 用途 | 状态 |
|---|---|---|
| `lit` | 主包（含 LitElement / html / decorators） | **稳定** |
| `lit/decorators.js` | 装饰器（`lit` 包子路径） | **稳定** |
| `lit/directives/*.js` | 内置指令（按需导入） | **稳定** |
| `lit/static-html.js` | 静态表达式（动态 tag） | **稳定** |
| `@lit/reactive-element` | 无模板的响应式基类 | **稳定** |
| `@lit/context` | Context API | **稳定** |
| `@lit/task` | 异步任务管理 | **稳定** |
| `@lit/localize` | i18n | **稳定** |
| `@lit/react` | React 集成 | **稳定** |
| `@lit-labs/ssr` | SSR | Labs |
| `@lit-labs/signals` | TC39 Signals 集成 | Labs |
| `@lit-labs/preact-signals` | Preact Signals 集成 | Labs |
| `@lit-labs/router` | 路由 | Labs |
| `@lit-labs/observers` | 观察者控制器（Intersection / Resize / Mutation） | Labs |
| `@lit-labs/motion` | 动画（FLIP） | Labs |
| `@lit-labs/virtualizer` | 虚拟列表 | Labs |
| `@lit-labs/scoped-registry-mixin` | Scoped Custom Element Registries | Labs |
| `@lit/localize-tools` | i18n 构建工具 | **稳定** |

::: tip 「Labs」是什么
**Lit Labs** 是 Lit 团队的孵化区——可用、有质量、但 API 可能小幅调整。生产可用，但要关注 release notes。
:::

## LitElement 类 API

```ts
class LitElement extends ReactiveElement {
  // 渲染
  render(): unknown                          // 返回 TemplateResult / nothing / array

  // 配置
  static styles?: CSSResultGroup             // 静态样式
  static shadowRootOptions: ShadowRootInit   // Shadow DOM 配置

  // 渲染根
  protected createRenderRoot(): Element | ShadowRoot  // 覆写以走 light DOM
}
```

继承自 `ReactiveElement`：

```ts
class ReactiveElement extends HTMLElement {
  // 响应式属性
  static properties: PropertyDeclarations
  static getPropertyDescriptor(...): PropertyDescriptor
  static getPropertyOptions(name): PropertyDeclaration

  // 更新流程
  hasUpdated: boolean
  isUpdatePending: boolean
  updateComplete: Promise<boolean>
  requestUpdate(name?, oldValue?, options?): void
  protected performUpdate(): void | Promise<void>
  protected shouldUpdate(changedProperties): boolean
  protected willUpdate(changedProperties): void
  protected update(changedProperties): void
  protected firstUpdated(changedProperties): void
  protected updated(changedProperties): void
  protected getUpdateComplete(): Promise<boolean>

  // 控制器
  addController(controller): void
  removeController(controller): void

  // 生命周期（继承自 HTMLElement）
  connectedCallback(): void
  disconnectedCallback(): void
  adoptedCallback(): void
  attributeChangedCallback(name, old, value): void

  // 自动同步：attribute ↔ property
  static observedAttributes: string[]
}
```

## 装饰器速查

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

| 装饰器 | 等价手动写法 |
|---|---|
| `@customElement('x')` | `customElements.define('x', X)` |
| `@property(opts?)` | `static properties = { x: opts }` |
| `@state()` | `@property({ state: true, attribute: false })` |
| `@query(sel, cache?)` | `get x() { return this.renderRoot.querySelector(sel) }` |
| `@queryAll(sel)` | `get xs() { return this.renderRoot.querySelectorAll(sel) }` |
| `@queryAsync(sel)` | `await this.updateComplete; this.renderRoot.querySelector(sel)` |
| `@queryAssignedElements(opts)` | `const slot = this.renderRoot.querySelector(slotSel); slot?.assignedElements(opts)` |
| `@queryAssignedNodes(opts)` | `const slot = this.renderRoot.querySelector(slotSel); slot?.assignedNodes(opts)` |
| `@eventOptions(opts)` | 给方法附加 `addEventListener` 选项 |

### @property 选项

```ts
interface PropertyDeclaration<Type = unknown, TypeHint = unknown> {
  attribute?: boolean | string      // attribute 名（默认是属性名）；false 表示不映射
  converter?: ComplexAttributeConverter<Type, TypeHint>
  hasChanged?: HasChanged<Type>     // 自定义变化判断
  noAccessor?: boolean              // 不自动生成 accessor
  reflect?: boolean                 // 属性 → attribute 反射
  state?: boolean                   // 内部状态（等价 @state()）
  type?: TypeHint                   // 类型 (String, Number, Boolean, Array, Object 或 ctor)
  useDefault?: boolean              // 3.x 新增：初始值不反射 + attribute 移除时重置
}
```

**默认 converter** 行为：

| `type` | attribute → property | property → attribute |
|---|---|---|
| `String` | 直接字符串 | 字符串 |
| `Number` | `Number(attr)` | `String(value)` |
| `Boolean` | attribute 存在 = true，不存在 = false | true 加 attribute，false 移除 |
| `Array` / `Object` | `JSON.parse(attr)` | `JSON.stringify(value)` |
| 自定义类 | 用 `converter` 选项 | 同上 |

## html 模板 API

```ts
import { html, svg, mathml, render, nothing, noChange, TemplateResult } from 'lit'

// html: 普通 HTML 模板
html`<div>${value}</div>`

// svg: SVG 命名空间
svg`<circle cx="50" cy="50" r="40"/>`

// mathml: MathML 命名空间（Lit 3.x 新增）
mathml`<mo>+</mo>`

// render: 提交到 DOM
render(html`...`, container)

// sentinel 值
nothing       // 渲染为「空」
noChange      // 「跳过本次更新」
```

### 模板表达式速查

```ts
html`
  <!-- 子节点 -->
  <p>${textOrTpl}</p>

  <!-- attribute -->
  <a href=${url}>

  <!-- property -->
  <input .value=${text}>

  <!-- boolean attribute -->
  <button ?disabled=${loading}>

  <!-- event -->
  <button @click=${handler}>

  <!-- element 表达式（仅 directive） -->
  <input ${ref(myRef)}>
`
```

## 内置指令速查

| 指令 | 用途 | 性能场景 |
|---|---|---|
| `classMap(obj)` | 类名切换 | - |
| `styleMap(obj)` | 样式切换 | - |
| `when(cond, T, F?)` | 条件渲染 | 替代三元 |
| `choose(key, cases, fb?)` | switch/case | - |
| `map(items, fn)` | iterable 映射 | 短列表 |
| `repeat(items, keyFn, tpl)` | 带 key 列表 | 长列表 / 重排 |
| `join(items, sep)` | 间隔 | - |
| `range(n)` | 数字序列 | - |
| `ifDefined(v)` | undefined 移除 attribute | - |
| `live(v)` | 与 DOM 实际值比较 | 受控 input 必备 |
| `ref(refOrCb)` | DOM 引用 | - |
| `cache(tpl)` | 切换保留 DOM | Tab / 路由切换 |
| `guard(deps, fn)` | 依赖不变跳过 | 贵子模板 |
| `keyed(key, tpl)` | key 变化强制重建 | 切 user 重置状态 |
| `unsafeHTML(str)` | 字符串解析 HTML | XSS 注意 |
| `unsafeSVG(str)` | 字符串解析 SVG | XSS 注意 |
| `templateContent(tpl)` | 渲染 `<template>` | - |
| `until(...vals)` | 多个 Promise / 同步 | - |
| `asyncAppend(it, tpl)` | async iterable 追加 | - |
| `asyncReplace(it, tpl)` | async iterable 替换 | - |

导入路径：

```ts
import { classMap }    from 'lit/directives/class-map.js'
import { styleMap }    from 'lit/directives/style-map.js'
import { when }        from 'lit/directives/when.js'
import { choose }      from 'lit/directives/choose.js'
import { map }         from 'lit/directives/map.js'
import { repeat }      from 'lit/directives/repeat.js'
import { join }        from 'lit/directives/join.js'
import { range }       from 'lit/directives/range.js'
import { ifDefined }   from 'lit/directives/if-defined.js'
import { live }        from 'lit/directives/live.js'
import { ref, createRef, Ref } from 'lit/directives/ref.js'
import { cache }       from 'lit/directives/cache.js'
import { guard }       from 'lit/directives/guard.js'
import { keyed }       from 'lit/directives/keyed.js'
import { unsafeHTML }  from 'lit/directives/unsafe-html.js'
import { unsafeSVG }   from 'lit/directives/unsafe-svg.js'
import { templateContent } from 'lit/directives/template-content.js'
import { until }       from 'lit/directives/until.js'
import { asyncAppend } from 'lit/directives/async-append.js'
import { asyncReplace } from 'lit/directives/async-replace.js'
```

## CSS API

```ts
import { css, unsafeCSS, CSSResult, CSSResultGroup } from 'lit'

// 静态 CSS tagged template
const styles = css`
  :host { display: block; }
  button { color: red; }
`

// 嵌套 CSSResult
const buttonStyles = css`button { padding: 6px 12px; }`
const combined = css`
  ${buttonStyles}
  button { color: blue; }
`

// 嵌入非 CSS 字符串
const color = '#007aff'
const themed = css`button { color: ${unsafeCSS(color)}; }`

// 多个样式
static styles = [
  buttonStyles,
  themed,
  css`/* 更多样式 */`,
]
```

`css` 模板只允许嵌套 `CSSResult` 或 number——其他类型需 `unsafeCSS()`。

### Shadow DOM 选择器

```css
:host { /* 组件自身 */ }
:host([variant="primary"]) { /* 自身 attribute 条件 */ }
:host-context(.dark) { /* 祖先匹配 */ }
::slotted(p) { /* slot 内直接子元素 */ }
::slotted(*) { /* 所有 slot 子元素 */ }
::part(label) { /* 通过 part attribute 暴露 */ }
```

## ReactiveController 接口

```ts
interface ReactiveController {
  hostConnected?(): void
  hostDisconnected?(): void
  hostUpdate?(): void         // host.update() 之前
  hostUpdated?(): void        // host.updated() 之后
}

interface ReactiveControllerHost {
  addController(controller: ReactiveController): void
  removeController(controller: ReactiveController): void
  requestUpdate(): void
  readonly updateComplete: Promise<boolean>
}
```

`LitElement` 与 `ReactiveElement` 都实现了 `ReactiveControllerHost`。

## @lit/context API

```ts
import { createContext, provide, consume, ContextProvider, ContextConsumer } from '@lit/context'

// 创建 context（建议加 Symbol 唯一性）
const myContext = createContext<MyData>(Symbol('my-context'))

// 装饰器（推荐）
@customElement('my-provider')
class MyProvider extends LitElement {
  @provide({ context: myContext })
  value: MyData = { ... }
}

@customElement('my-consumer')
class MyConsumer extends LitElement {
  @consume({ context: myContext, subscribe: true })
  value?: MyData
}

// 控制器形式
class WithCtrl extends LitElement {
  private provider = new ContextProvider(this, { context: myContext, initialValue: ... })
  private consumer = new ContextConsumer(this, {
    context: myContext,
    subscribe: true,
    callback: (value, dispose) => {},
  })
}
```

## @lit/task API

```ts
import { Task, TaskStatus } from '@lit/task'

class MyEl extends LitElement {
  private _task = new Task<[number], User>(this, {
    task: async ([id], { signal }) => {
      const res = await fetch(`/api/users/${id}`, { signal })
      return res.json()
    },
    args: () => [this.userId],
    autoRun: true,           // 默认 true，args 变化自动跑
    onComplete: (value) => { /* 副作用 */ },
    onError: (err) => { /* 错误处理 */ },
  })

  // 渲染方式
  render() {
    return this._task.render({
      initial: () => html`...`,
      pending: () => html`...`,
      complete: (value) => html`...`,
      error: (err) => html`...`,
    })
  }

  // 直接访问状态
  get status() { return this._task.status }    // TaskStatus enum
  get value() { return this._task.value }      // 完成值
  get error() { return this._task.error }      // 错误
}

enum TaskStatus {
  INITIAL  = 0,
  PENDING  = 1,
  COMPLETE = 2,
  ERROR    = 3,
}
```

## @lit/localize API

```ts
import {
  msg,
  str,
  configureLocalization,
  configureTransformLocalization,
  setLocale,
  getLocale,
  updateWhenLocaleChanges,
  LOCALE_STATUS_EVENT,
} from '@lit/localize'

// 字符串
msg('Hello!')
msg('Hello!', { id: 'greeting' })   // 显式 id
msg(str`Hi ${name}!`)                // 含表达式
msg(html`Hi <b>${name}</b>!`)        // 含 HTML 模板

// 配置（runtime 模式）
configureLocalization({
  sourceLocale: 'en',
  targetLocales: ['zh-CN', 'ja'],
  loadLocale: (locale) => import(`./generated/locales/${locale}.js`),
})

// 切换
await setLocale('zh-CN')
console.log(getLocale())   // 'zh-CN'

// 组件响应 locale 变化
class MyEl extends LitElement {
  constructor() {
    super()
    updateWhenLocaleChanges(this)
  }
}
```

## @lit/react API

```ts
import { createComponent, useController } from '@lit/react'
import * as React from 'react'

// 包装 custom element
const ButtonReact = createComponent({
  tagName: 'my-button',
  elementClass: MyButton,
  react: React,
  events: {
    onPress: 'press',
    onChange: 'change',
  },
  displayName: 'Button',
})

// 在 React 中用 Lit controller
import { useController } from '@lit/react'

function useMouse() {
  const ctrl = useController(React, (host) => new MouseController(host))
  return ctrl.pos
}
```

类型：

```ts
import { EventName } from '@lit/react'

events: {
  'onChange': 'change' as EventName<CustomEvent<{ count: number }>>,
}
// 之后 onChange handler 的 event.detail 有类型
```

## Lit SSR API

```ts
import { render, RenderInfo } from '@lit-labs/ssr'
import { collectResult, collectResultSync } from '@lit-labs/ssr/lib/render-result.js'
import { html } from 'lit'

// 流式
const stream = render(html`...`)
for await (const chunk of stream) {
  res.write(chunk)
}

// 一次性
const str = await collectResult(render(html`...`))

// 同步
const sync = collectResultSync(render(html`...`))
```

DSD polyfill：

```html
<script src="https://unpkg.com/@webcomponents/template-shadowroot"></script>
<script type="module">
  import { hydrateShadowRoots } from '@webcomponents/template-shadowroot'
  hydrateShadowRoots(document.body)
</script>
```

## 浏览器支持

Lit 3 基线 ES2021：

| 浏览器 | 最低版本 |
|---|---|
| Chrome | 88+ |
| Edge | 88+ |
| Firefox | 90+ |
| Safari | 14+ |

**IE11 不再支持**（Lit 2.x 仍有 polyfill 支持 IE11，3.x 移除）。

## 命名约定

| 类型 | 约定 | 示例 |
|---|---|---|
| Tag 名 | kebab-case，**必须有连字符** | `my-button` / `app-header` |
| 类名 | PascalCase | `class MyButton extends LitElement` |
| 公共属性 | camelCase（attribute 自动 kebab-case） | `firstName` → `first-name` |
| 私有属性 | `_` 前缀 + `private` | `private _onClick = () => ...` |
| 内部状态 | `@state() private _xxx` | `@state() private _open = false` |
| 事件 | kebab-case + `composed: true` | `dispatchEvent(new CustomEvent('item-select'))` |
| CSS Custom Property | `--组件-属性` | `--my-button-bg` |
| CSS Part | kebab-case | `<div part="label">` |

### Tag 名规则（W3C）

- 必须有**至少一个连字符**：`<my-button>` ✅，`<mybutton>` ❌
- 必须以**小写字母开头**：`<my-button>` ✅，`<My-Button>` ❌
- 不能是保留名：`<annotation-xml>` / `<color-profile>` 等

## 与 React/Vue/Angular 对比

| 维度 | Lit | React 19 | Vue 3.5 | Angular 18 |
|---|---|---|---|---|
| 自我定位 | Web Components 框架 | 重渲染 UI 库 | 完整框架 | 完整框架 |
| 组件本质 | HTMLElement 子类 | 函数 / 类 | SFC 编译产物 | TS 类 + 装饰器 |
| 跨框架可用 | **是** | 否 | 否（除非编译成 CE） | 否 |
| 模板 | `html` tagged template | JSX | SFC 模板 | HTML 模板（指令） |
| Virtual DOM | **无**（局部 dirty-check） | 有 | 有（patchFlag） | 无（增量 DOM） |
| 样式 | **Shadow DOM**（默认） | CSS Modules / inline | scoped CSS | Shadow DOM / Emulated |
| 响应式 | `@property` setter | `useState` | `ref().value` | RxJS Observables / Signals |
| 状态管理 | **无内置** | 无内置 | 无内置（Pinia） | NgRx / Signal Store |
| 路由 | **无内置**（@lit-labs/router） | 无内置（React Router） | vue-router | @angular/router |
| SSR | `@lit-labs/ssr`（Labs） | Next.js（生产） | Nuxt（生产） | Angular Universal |
| Bundle（核心） | **5-7 KB** | ~45 KB | ~25 KB | ~50 KB（含 RxJS） |
| 浏览器要求 | ES2021 | ES2017 | ES2015 | ES2017 |
| 学习曲线 | 平缓（API 小） | 中等 | 平缓 | 陡峭 |

## 与 Web Components 同类对比

| 维度 | Lit 3 | Stencil 4 | Microsoft FAST | Hybrids | 原生 Web Components |
|---|---|---|---|---|---|
| 维护方 | Google（Polymer 团队） | Ionic 团队 | Microsoft | 个人 / 社区 | W3C |
| 模板语法 | `html` tagged template | JSX（编译时优化） | `html` tagged template | 纯函数式 + property descriptor | 手写 DOM |
| 类风格 | OOP（class + 装饰器） | OOP（class + 装饰器） | OOP | **函数式 + 工厂** | OOP |
| 编译器 | 无（运行时） | **有**（Stencil compiler） | 无 | 无 | 无 |
| 默认 Shadow DOM | 是 | **是 / 否可选** | 是 | 是 | 看你 attachShadow |
| 响应式 | `@property` setter | `@Prop` / `@State` 装饰器 | observable decorators | property descriptor | 手动调 attribute / 渲染 |
| TS 类型 | 一流 | 一流 | 一流 | 优秀（但函数式风格不熟悉） | 自己写 |
| SSR | `@lit-labs/ssr`（Labs） | 内置 prerender | FAST SSR | 无 | 无 |
| 体积 | 5-7 KB | ~10 KB（运行时） | ~30 KB | ~3 KB | 0 |
| 包管理 | 单源码即可 | 编译多输出（ESM/CJS/UMD） | 单源码 | 单源码 | 单源码 |
| 企业采用 | Adobe Spectrum / IBM Carbon / SAP UI5 | Ionic / 多家组件库 | Microsoft Fluent UI | 小众 | - |
| 推荐场景 | **跨框架设计系统 / 微前端 / 企业组件库** | 多输出格式（编译为各框架）/ 复杂应用 | Microsoft 生态 / Fluent UI | 函数式偏好 / 极小项目 | 学习 / demo |

### 与 Stencil 的关键差异

- **编译策略**：Stencil 是**编译时框架**（编译时生成 React/Vue/Angular wrapper、prerender HTML），Lit 是**运行时**
- **Shadow DOM 选项**：Stencil 默认开启但可关；Lit 默认开启需手动覆写 `createRenderRoot` 才能走 light DOM
- **多输出**：Stencil 可一键生成 React/Vue/Angular wrappers + 文档；Lit 需要手动用 `@lit/react`
- **体积**：Lit 核心运行时更小（5-7 KB vs Stencil 10 KB）
- **响应式 API**：Stencil 用 `@Prop` / `@State` / `@Watch`（更接近 React Class Component）；Lit 更接近 HTML 原生 attribute

**怎么选**：

- 已有 React 经验 + 想做 React-first 但能跨框架 → **Stencil**
- 想要更接近 HTML 原生 + 更小体积 + 已经熟悉 LitElement → **Lit**

### 与 Microsoft FAST 的关键差异

- **样式系统**：FAST 有 Design Tokens 系统更完善（可被设计师工具消费）；Lit 是基础 CSS Custom Properties
- **响应式**：FAST 有自己的 observable（更接近 Knockout）；Lit 直接走 setter + requestUpdate
- **生态**：FAST 主要用于 Microsoft Fluent UI；Lit 跨企业使用更广

### 与 Hybrids 的关键差异

Hybrids 是函数式 Web Components 框架：

```ts
import { html, define } from 'hybrids'

const MyButton = {
  label: 'Click',
  count: 0,
  render: ({ label, count }) => html`<button>${label} ${count}</button>`,
}

define('my-button', MyButton)
```

- **风格**：Hybrids 函数式 + property descriptor；Lit 是 class + 装饰器
- **依赖追踪**：Hybrids 用 cached property descriptor 自动追踪；Lit 用 `requestUpdate`
- **生态**：Hybrids 远小于 Lit；少数项目使用

Hybrids 适合「不喜欢 class + 装饰器」的开发者，但生态规模决定了 Lit 是更安全的选择。

## 常用第三方组件库

基于 Lit 的现成组件库：

| 组件库 | 维护方 | 特点 |
|---|---|---|
| **Shoelace** | 社区（被 Font Awesome 收购） | 通用组件库，覆盖度最高 |
| **IBM Carbon Web Components** | IBM | Carbon Design System 实现 |
| **Adobe Spectrum Web Components** | Adobe | Spectrum Design System 实现 |
| **SAP UI5 Web Components** | SAP | 企业级 |
| **Salesforce Lightning** | Salesforce | Lightning 平台 |
| **VS Code Webview UI Toolkit** | Microsoft | VS Code Webview 专用 |
| **Material Web Components** | Google | Material Design 实现（部分基于 Lit） |
| **Generic Web Components** | 各社区 | 大量小组件 |

Shoelace 是「上手用」首选；Carbon / Spectrum / UI5 是企业落地最常引用的范例。

## 资源

- [Lit 官网](https://lit.dev/)
- [Lit GitHub](https://github.com/lit/lit)
- [Lit Labs](https://lit.dev/docs/libraries/labs/)
- [Lit Playground](https://lit.dev/playground/) - 在线练习
- [Lit Tutorial](https://lit.dev/tutorials/) - 官方交互式教程
- [Lit Articles](https://lit.dev/articles/) - 文章合集（patterns / 进阶）
- [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/)
- [Open Web Components](https://open-wc.org/) - 通用 Web Components 工具
- [Web Components 黄金书](https://www.webcomponents.guide/)
- [Awesome Web Components](https://github.com/web-padawan/awesome-web-components)
- [Shoelace](https://shoelace.style/) - 通用 Lit 组件库
- [@lit/react](https://www.npmjs.com/package/@lit/react)
- [@lit/context](https://www.npmjs.com/package/@lit/context)
- [@lit/task](https://www.npmjs.com/package/@lit/task)
- [@lit/localize](https://www.npmjs.com/package/@lit/localize)
- [@lit-labs/ssr](https://www.npmjs.com/package/@lit-labs/ssr)

## 不要选 Lit 的场景

- **构建完整 SPA + 重视成熟生态** → React + Next.js / Vue + Nuxt 仍是首选
- **需要内置路由 / 状态管理 / 数据获取** → Angular / Nuxt / Next.js 更全
- **团队不熟悉 Shadow DOM** → 学习成本高，要重学样式系统
- **重度依赖 Tailwind utility 类** → Shadow DOM 把 utility 类挡在外面（要么用 light DOM 模式，要么内嵌 utility 到每个组件）
- **追求最广浏览器支持** → Lit 3 要 ES2021（IE11 不支持，2.x 还可）
- **SEO 至上 + 高度依赖爬虫看到内容** → SSR 仍 Labs，Next.js / Astro 更稳

## 经验法则

- **跨框架设计系统 → 首选 Lit**：唯一能让 React / Vue / Angular / 原生 HTML 共用一套组件的方案
- **微前端 / 嵌入式 SDK → Lit 体积最小**：5-7 KB 不污染宿主框架
- **企业组件库 → Lit 有大厂背书**：Adobe Spectrum / IBM Carbon / SAP UI5 / Salesforce
- **TypeScript 装饰器 → 设 `useDefineForClassFields: false`**
- **Shadow DOM 默认开启 → 用 CSS Custom Properties 做主题**
- **Reactive Controllers 替代 Mixin → 优先组合**
- **`@lit/context` 跨层级共享 → 比 prop drilling 干净**
- **`@lit/task` 异步数据 → 不要自己造 loading / error 状态机**
- **`@lit/react` 包装给 React 用 → 即使 React 19 原生支持也建议 wrapper**
- **`@web/test-runner` 跑真实浏览器 → 不要用 jsdom 测试 Shadow DOM**
- **Lit SSR 仍 Labs → 生产前评估，集成走 Eleventy / Astro / Next.js plugin**
- **组件发布 → 一定生成 Custom Elements Manifest**
