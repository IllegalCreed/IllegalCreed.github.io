---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Lit 3.2.x / 3.3.x 编写

## 速查

- 系统要求：现代浏览器（支持 ES2021）+ Node.js **18+**（推荐 20+）+ TypeScript **5+**
- 创建方式：
  - **官方 Starter Kit（TS）**：`git clone https://github.com/lit/lit-element-starter-ts.git && cd lit-element-starter-ts && npm install`
  - **官方 Starter Kit（JS）**：[lit-element-starter-js](https://github.com/lit/lit-element-starter-js)
  - **Vite 模板**：`pnpm create vite@latest my-lit -- --template lit-ts`
  - **裸安装到现有项目**：`pnpm add lit`
- 启动：`pnpm dev`（Vite 模板默认 `http://localhost:5173`）
- 入口：在 HTML 里 `<script type="module" src="./my-element.ts"></script>` + `<my-element></my-element>`
- 组件写法：`@customElement('my-x') class MyX extends LitElement { ... }`
- 模板：`html\`<div>${value}</div>\`` tagged template
- 响应式属性：`@property()` / `@state()` 装饰器
- 样式：`static styles = css\`...\``（默认 Shadow DOM 隔离）
- 生命周期：`connectedCallback` / `disconnectedCallback` / `willUpdate` / `update` / `firstUpdated` / `updated`
- 复用机制：**Reactive Controllers**（替代 Mixin）
- 内置指令：`classMap` / `styleMap` / `repeat` / `when` / `ifDefined` / `ref` / `cache` / `guard` / `keyed` / `unsafeHTML` / `until` 等
- Context API：`@lit/context`（@provide / @consume / createContext）
- 异步数据：`@lit/task`（Task 类，pending / complete / error 状态）
- SSR：`@lit-labs/ssr`（仍标 Labs）
- 集成：`@lit/react`（createComponent / useController）
- i18n：`@lit/localize`（runtime / transform 模式）
- 测试：`@web/test-runner` + `@open-wc/testing` + `@web/test-runner-puppeteer`

## Lit 是「Web Components 框架」不是「SPA 框架」

这是理解 Lit 的关键定位差异——**Lit 组件 = 标准浏览器 custom element**：

| 维度 | Lit 3 | React 19 | Vue 3.5 |
|---|---|---|---|
| 自我定位 | Library（Web Components） | Library（重渲染 + reconcile） | Framework（编译时优化 + Proxy） |
| 组件本质 | 标准 HTMLElement 子类 | 函数 / 类（VDOM 节点） | SFC（编译产物） |
| 跨框架可用 | **可以**（原生 custom element） | 否（必须在 React 内） | 否（必须在 Vue 内） |
| 模板 | `html` tagged template | JSX | SFC 模板 |
| Virtual DOM | **无**（局部 dirty-check） | 有（Fiber） | 有（patchFlag 优化） |
| 样式隔离 | **Shadow DOM**（默认） | CSS Modules / inline | scoped CSS |
| 响应式 | `@property` setter | `useState` | `ref().value` |
| 路由 | **无内置**（用 `@lit-labs/router` 或外部） | 无内置 | 无内置（用 vue-router） |
| 状态管理 | **无内置**（Reactive Controllers / 外部） | 无内置 | 无内置（Pinia） |
| 学习曲线 | 平缓（API 表面小） | 中等 | 平缓 |
| Bundle（核心） | **5-7 KB** | ~45 KB | ~25 KB |

**含义**：

- Lit 不与 React/Vue/Angular 竞争——它解决的是「**标准 Web Components**」的开发效率问题
- 同一个 `<my-button>` 可以在 React / Vue / Angular / 原生 HTML / 任意框架内使用
- 适合**跨框架设计系统 / 大型组件库 / 微前端 / 嵌入式 SDK**——不适合做完整的 SPA 应用
- 「**重渲染 vs Shadow DOM 隔离**」是 Lit 与 React 的根本路线差异

## 安装与首次启动

### 推荐路径 A：官方 Starter Kit（TypeScript）

最完整的官方起点，含组件 + 测试 + Storybook 演示：

```bash
git clone https://github.com/lit/lit-element-starter-ts.git my-element
cd my-element
npm install
npm run dev      # 或 npm start
```

浏览器打开 `http://localhost:8000` 看演示页面。默认会编译 `src/my-element.ts` 为 `my-element.js`。

### 推荐路径 B：Vite + Lit（纯组件 / 应用开发）

要 Vite 的现代体验：

```bash
pnpm create vite@latest my-lit-app -- --template lit-ts
cd my-lit-app
pnpm install
pnpm dev
```

浏览器打开 `http://localhost:5173`。**HMR 默认开启**，编辑 `src/my-element.ts` 立刻热更。

::: tip Starter Kit vs Vite
- **Starter Kit**：含 `@web/dev-server` + `@web/test-runner` + Rollup 构建 + lint 配置；适合开发 component package 发布到 npm
- **Vite + Lit**：现代 dev server + esbuild + HMR，适合嵌入到应用中、教学、原型开发
:::

### 推荐路径 C：裸装

加到现有项目（Webpack / Rollup / esbuild / Vite 任意）：

```bash
pnpm add lit
# 可选：
pnpm add @lit/context @lit/task @lit/react @lit/localize
pnpm add -D @web/test-runner @open-wc/testing
```

`tsconfig.json` 启用装饰器（Lit 3 同时支持 TC39 标准装饰器 + TypeScript experimentalDecorators）：

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

::: warning useDefineForClassFields
TypeScript 装饰器路线下，**必须设 `useDefineForClassFields: false`**，否则字段初始化会覆盖 `@property` 的 setter，属性更新不再触发渲染。

如果用 TC39 标准装饰器（TS 5.0+），可以保持 `useDefineForClassFields: true`。
:::

### Node / 浏览器版本

- Lit 3 核心：**ES2021**（支持 `??` / `?.` / 私有字段 / WeakRef 等）
- 浏览器：Chrome 88+ / Edge 88+ / Firefox 90+ / Safari 14+ —— **IE11 不再支持**
- Node：18+（推荐 20+）

```bash
nvm install --lts && nvm use --lts
node -v   # v20.x 或 v22.x
```

## 项目结构

最常见的 Lit 组件包结构：

```
my-element/
├── src/
│   ├── my-element.ts        # 组件定义
│   ├── my-element.test.ts   # 测试
│   └── index.ts             # 公共导出
├── docs/                    # 文档站（VitePress / 11ty）
├── package.json
├── tsconfig.json
└── web-test-runner.config.mjs
```

`package.json` 关键字段：

```json
{
  "name": "@my-org/my-element",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "customElements": "custom-elements.json",
  "scripts": {
    "build": "tsc",
    "test": "web-test-runner",
    "analyze": "cem analyze"
  },
  "dependencies": {
    "lit": "^3.2.0"
  }
}
```

`customElements: "custom-elements.json"` 字段是 [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/) 标准——IDE / 文档站可以读取它自动生成属性 / 事件 / 槽位的描述。

## 第一个组件

完整的 Lit 组件骨架：

```ts
// src/my-counter.ts
import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

@customElement('my-counter')
export class MyCounter extends LitElement {
  /** 静态样式：编译为 CSSStyleSheet，所有实例共享 */
  static styles = css`
    :host {
      display: inline-block;
      font-family: system-ui;
    }
    button {
      padding: 6px 12px;
      cursor: pointer;
    }
    .count {
      font-weight: bold;
      margin: 0 8px;
    }
  `

  /** 公共属性：从 HTML attribute 反序列化 + 可手动写 element.label */
  @property({ type: String })
  label = 'Click me'

  /** 公共属性：步长（数字 attribute） */
  @property({ type: Number })
  step = 1

  /** 内部状态：不暴露为 attribute */
  @state()
  private _count = 0

  render() {
    return html`
      <button @click=${this._increment}>${this.label}</button>
      <span class="count">${this._count}</span>
    `
  }

  private _increment() {
    this._count += this.step
    // 派发 DOM 事件，外部用 @change 监听
    this.dispatchEvent(new CustomEvent('change', {
      detail: { count: this._count },
      bubbles: true,
      composed: true,
    }))
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-counter': MyCounter
  }
}
```

在 HTML 里使用：

```html
<script type="module" src="./src/my-counter.ts"></script>

<my-counter label="点我" step="2"></my-counter>

<script type="module">
  const el = document.querySelector('my-counter')
  el.addEventListener('change', (e) => {
    console.log('current count =', e.detail.count)
  })
</script>
```

**关键点**：

- `@customElement('my-counter')` 注册自定义元素——标签名**必须有连字符**（W3C 规范）
- `static styles = css\`...\``：CSS tagged template，编译为 `CSSStyleSheet`，所有实例共享
- `@property({ type: Number })`：从 HTML attribute 反序列化为数字，并把 setter 接入响应式
- `@state()`：内部状态，不会反序列化 attribute（也不会反射回去）
- `html\`...\``：模板 tagged template，返回 `TemplateResult`，由 `render()` 提交到 DOM
- `@click=${fn}`：事件绑定（`@` 前缀），与 `addEventListener` 等价
- `${this._count}`：子节点表达式（任意位置插值）
- `declare global { interface HTMLElementTagNameMap }`：让 `document.createElement('my-counter')` 有类型推导

## 模板基础语法

`html` tagged template 的 5 类绑定：

```ts
render() {
  return html`
    <!-- 1. 子节点表达式：插入文本 / 数字 / TemplateResult / 数组 -->
    <p>Hello ${this.name}</p>
    <ul>${this.items.map(i => html`<li>${i}</li>`)}</ul>

    <!-- 2. 属性绑定：默认转字符串 attribute -->
    <input type="text" placeholder=${this.label}>

    <!-- 3. property 绑定（点前缀）：直接设 element.prop -->
    <input .value=${this.text}>

    <!-- 4. 布尔属性绑定（?前缀）：true 加 attribute，false 移除 -->
    <button ?disabled=${this.loading}>提交</button>

    <!-- 5. 事件监听（@前缀）：等价 addEventListener -->
    <button @click=${this._onClick}>Click</button>
  `
}
```

5 种语法在**同一位置**用不同前缀区分——这是 Lit 模板的核心心智模型。

::: tip attribute vs property
- **attribute**（无前缀）：始终是字符串；适合简单字符串值（class / id / placeholder 等）
- **property**（`.` 前缀）：直接调用 setter，可以传任意 JavaScript 值（对象 / 数组 / 函数）；适合复杂数据
- 二者通过 `@property` 装饰器自动同步：HTML 写 `<my-el data='[1,2,3]'>` 会反序列化为数组
:::

## 响应式属性详解

`@property` 接受 `PropertyDeclaration` 选项：

```ts
import { LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('demo-el')
export class DemoEl extends LitElement {
  // 字符串属性（默认）
  @property()
  name = ''

  // 数字属性
  @property({ type: Number })
  count = 0

  // 布尔属性（attribute 存在即 true，与 input.disabled 类似）
  @property({ type: Boolean })
  disabled = false

  // 数组 / 对象：从 attribute 反序列化用 JSON.parse
  @property({ type: Array })
  items: string[] = []

  // 不映射 attribute
  @property({ attribute: false })
  data: ComplexObject | null = null

  // 自定义 attribute 名（默认是小写 kebab-case）
  @property({ attribute: 'data-id' })
  dataId = ''

  // 反射回 attribute（属性改了同步写回 HTML attribute）
  @property({ type: String, reflect: true })
  mode = 'light'

  // 自定义比较（默认 !==）
  @property({
    hasChanged: (newVal, oldVal) => Math.abs(newVal - oldVal) > 0.01
  })
  ratio = 0
}
```

::: tip 何时用 reflect
**慎用** `reflect: true`——会让 DOM attribute 与 property 双向同步，但**性能开销**且会污染 HTML 看上去。

只在需要 CSS 选择器（`[mode="dark"]`）或外部读取 attribute 的场景才开启。
:::

## 第一个 Reactive Controller

控制器是 Lit 的**组合复用核心机制**——比 mixin 干净、有自己的生命周期：

```ts
// src/clock-controller.ts
import { ReactiveController, ReactiveControllerHost } from 'lit'

export class ClockController implements ReactiveController {
  host: ReactiveControllerHost
  value = new Date()
  private timeout: number
  private intervalId?: ReturnType<typeof setInterval>

  constructor(host: ReactiveControllerHost, timeout = 1000) {
    this.host = host
    this.timeout = timeout
    // 注册到宿主
    host.addController(this)
  }

  hostConnected() {
    // 宿主连入 DOM 时启动定时器
    this.intervalId = setInterval(() => {
      this.value = new Date()
      this.host.requestUpdate()  // 触发宿主重新渲染
    }, this.timeout)
  }

  hostDisconnected() {
    // 宿主断开时清理
    clearInterval(this.intervalId)
  }
}
```

```ts
// src/my-clock.ts
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { ClockController } from './clock-controller'

@customElement('my-clock')
export class MyClock extends LitElement {
  // 实例化时注册到 this
  private clock = new ClockController(this, 1000)

  render() {
    return html`<p>Time: ${this.clock.value.toLocaleTimeString()}</p>`
  }
}
```

**Reactive Controller 的核心钩子**：

| 钩子 | 触发时机 | 典型用途 |
|---|---|---|
| `hostConnected()` | 宿主 `connectedCallback` 后 | 注册事件 / 启动定时器 / 订阅 store |
| `hostDisconnected()` | 宿主 `disconnectedCallback` 后 | 清理订阅 |
| `hostUpdate()` | 宿主 `update` 前 | 读取更新前 DOM |
| `hostUpdated()` | 宿主 `updated` 后 | 读取更新后 DOM |

每个 controller 都是独立类实例——可以在多个组件中复用，也可以多实例（同组件用两个 `ClockController`）。**这是 Lit 对 Mixin 的官方替代**。

## 与其他框架集成

### 在 React 里用 Lit 组件

```bash
pnpm add @lit/react
```

```tsx
// MyCounterReact.ts
import { createComponent } from '@lit/react'
import * as React from 'react'
import { MyCounter } from './my-counter'

export const MyCounterReact = createComponent({
  tagName: 'my-counter',
  elementClass: MyCounter,
  react: React,
  events: {
    onChange: 'change',  // change DOM 事件映射到 onChange prop
  },
})
```

```tsx
// App.tsx
import { MyCounterReact } from './MyCounterReact'

function App() {
  return (
    <MyCounterReact
      label="点击"
      step={2}
      onChange={(e) => console.log(e.detail.count)}
    />
  )
}
```

### 在 Vue 里用 Lit 组件

Vue 3 原生支持 custom element：

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import './my-counter'  // 加载并注册 custom element

const app = createApp(App)
app.config.compilerOptions.isCustomElement = (tag) => tag.includes('-')
app.mount('#app')
```

```vue
<template>
  <my-counter :label="label" :step.prop="step" @change="onChange" />
</template>
```

`:step.prop="step"` 强制走 property 而非 attribute（数字直接传，不经过字符串）。

### 在原生 HTML 里用

```html
<script type="module" src="./my-counter.js"></script>
<my-counter label="点击" step="2"></my-counter>
```

零成本——Lit 组件就是浏览器原生 custom element，**这是 Lit 的核心卖点**。

## 测试

最常用 `@web/test-runner` + `@open-wc/testing`：

```bash
pnpm add -D @web/test-runner @open-wc/testing @web/test-runner-playwright
```

```ts
// src/my-counter.test.ts
import { fixture, html, expect } from '@open-wc/testing'
import './my-counter'
import type { MyCounter } from './my-counter'

it('渲染初始 label', async () => {
  const el = await fixture<MyCounter>(html`<my-counter label="Hi"></my-counter>`)
  const btn = el.shadowRoot!.querySelector('button')!
  expect(btn.textContent).to.include('Hi')
})

it('点击后 count + step', async () => {
  const el = await fixture<MyCounter>(html`<my-counter step="3"></my-counter>`)
  const btn = el.shadowRoot!.querySelector('button')!
  btn.click()
  await el.updateComplete  // 等更新完成
  expect(el.shadowRoot!.querySelector('.count')!.textContent).to.equal('3')
})

it('派发 change 事件', async () => {
  const el = await fixture<MyCounter>(html`<my-counter></my-counter>`)
  let detail: any = null
  el.addEventListener('change', (e: any) => detail = e.detail)
  el.shadowRoot!.querySelector('button')!.click()
  await el.updateComplete
  expect(detail.count).to.equal(1)
})
```

`web-test-runner.config.mjs`：

```js
import { playwrightLauncher } from '@web/test-runner-playwright'

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  plugins: [
    /* esbuild plugin for TS */
  ],
}
```

跑 `pnpm test`——浏览器实例打开，跑真实 DOM 测试，对 Shadow DOM 友好。

## 调试

- **Chrome DevTools**：Elements 面板能展开 `#shadow-root (open)` 看内部结构；用 `$0.shadowRoot.querySelector(...)` 调试
- **Lit DevTools**：[Chrome 扩展](https://chromewebstore.google.com/detail/lit-devtools/jchhkdmhojgcekekfgnfmlpkfehbeicg)，显示组件树 + 属性 + 事件
- **Custom Elements DevTools**：通用 Web Components 扩展
- 打开 `window.litIssuedWarnings`：可以看 Lit 内部告警（dev build）
- `await el.updateComplete`：测试时等更新完成必备

## 接下来读什么

完成本入门后建议按顺序读：

- [指南](./guide-line.md)：装饰器全表 / 模板深入 / 生命周期 / Reactive Controllers / Directives / 样式系统 / Shadow DOM / Context / SSR / 集成 / 测试 / 实战
- [参考](./reference.md)：API 速查 / 选项表 / 命名约定 / 常见陷阱 / 与 Stencil / FAST 对比
