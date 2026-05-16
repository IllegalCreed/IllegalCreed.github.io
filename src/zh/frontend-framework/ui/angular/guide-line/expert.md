---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> 基于 Angular 21.x 编写 —— Signals 内部、Zoneless、SSR + Hydration、编译器、性能、微前端、版本迁移

## 速查

- Signals 内部：**push-pull 混合 / 推送脏标记 + 拉取计算 / 依赖图按需建立 / Glitch-free 调度**
- Zoneless（v21 默认）：去 Zone.js → Signal 触发 CD / 推荐 OnPush
- SSR：`provideServerRendering(withRoutes(serverRoutes))` / 静态预渲染 / 客户端水合
- Incremental Hydration（v19+）：`withIncrementalHydration()` + `@defer (hydrate on viewport)`
- 编译：AOT（默认）+ Ivy 引擎 + 局部性（template 编译为 instance closure）
- 性能：`OnPush` / `trackBy`（@for track）/ `runOutsideAngular` / lazy / `@defer`
- 微前端：[Native Federation](https://github.com/angular-architects/module-federation-plugin) / single-spa-angular
- PWA：`@angular/service-worker` + `ng add @angular/pwa`
- Angular Elements：把组件编译为 Web Component
- 版本迁移：`ng update` 自动化 / 标志性变化清单 v14 → v21

## Signals 内部机制

### Push-Pull 混合模型

Angular Signals 用的是 **push-pull hybrid**：

- **Push**：写入 signal 时，所有依赖（computed / effect / 模板绑定）被标记 dirty（不立即重算）
- **Pull**：读 computed 时，发现是 dirty 才重算；不脏则返回缓存

这与 React 「pull only」（每次 render 全跑）和早期 RxJS BehaviorSubject「push only」（每次都推下游）不同。Push-pull 在保证最小重算的同时避免 glitch（中间不一致状态）。

```ts
import { computed, signal } from '@angular/core'

const a = signal(0)
const b = signal(0)
const sum = computed(() => a() + b())

a.set(1)         // sum dirty
b.set(2)         // sum still dirty（不重算）
console.log(sum())   // 3，此时才真正算（一次）

a.set(5)         // sum dirty
console.log(sum())   // 7
```

### 依赖图按需建立

Signal 的依赖关系**不是静态声明**，而是「**运行时读到谁就依赖谁**」。配合 push-pull：

```ts
const showA = signal(true)
const a = signal(10)
const b = signal(20)

const result = computed(() => showA() ? a() : b())

result()                 // 10；依赖 = { showA, a }（b 未被读到，不订阅）
showA.set(false)
result()                 // 20；依赖图重新建立 = { showA, b }
a.set(999)               // result 不脏（a 不再是依赖）
console.log(result())    // 20，未重算
```

这是 Vue Composition API 的 `computed` 机制类似的，但 Angular Signal 没有 `.value` 的概念（用函数调用代替），更接近 Solid 和 Knockout。

### Glitch-free 调度

「Glitch」指中间不一致状态——多个 signal 同时改、computed 间结果短暂错误。Angular 通过**版本号 + 单一调度**避免：

```ts
const a = signal(0)
const b = computed(() => a() * 2)
const c = computed(() => a() + b())   // 始终等于 3a

a.set(5)
// 不会有「b 是旧值 10 但 a 已经是 5」的中间状态
console.log(c())   // 15
```

Reactive Graph 内部用全局版本号 + 拓扑遍历，保证所有 computed 在一次「重算 pass」内串行更新。

### Effect 调度器

Effect 不是同步执行——默认在**下一个 microtask（或下一帧）**集中跑：

```ts
import { Component, effect, signal } from '@angular/core'

@Component({ /* ... */ })
export class Cmp {
  count = signal(0)

  constructor() {
    effect(() => {
      console.log('count =', this.count())
    })
  }

  // 连续修改只触发一次 effect
  rapidUpdates() {
    this.count.set(1)
    this.count.set(2)
    this.count.set(3)
    // → 下一 microtask 打印 "count = 3"
  }
}
```

可选 `manualCleanup` / `injector`：

```ts
effect(onCleanup => {
  const id = setInterval(() => { /* ... */ }, 1000)
  onCleanup(() => clearInterval(id))
})
```

### Signal 写入受控

默认 **effect 内不能写 signal**，防止形成循环或不可预测的依赖关系：

```ts
effect(() => {
  count.set(count() + 1)   // ❌ NG0600 ERROR
})

// 显式允许（少用，通常有更好的设计）
effect(() => {
  count.set(count() + 1)
}, { allowSignalWrites: true })
```

## Zoneless 模式（v21 默认）

### Zone.js 是什么

Zone.js 是 Brian Ford 早期为 AngularJS 写的「**异步上下文追踪**」库——通过 monkey-patch 浏览器的 `setTimeout` / `Promise` / `XHR` / DOM 事件 / `requestAnimationFrame` 等所有异步入口，给 Angular 一个挂钩：

> 用户发起的任何异步操作 → Zone.js 包裹 → Angular 在异步完成时拿到通知 → 自动跑变更检测

这一招让开发者从不用关心「什么时候触发 CD」，但代价：

- bundle 多 ~30KB（gzip）
- 每个浏览器 API 入口都被劫持，调试栈混乱
- 第三方库（特别是 Web Components / WebRTC / 新 API）经常忘记 patch，CD 不触发
- 严重影响 Core Web Vitals（INP / TBT）

### Zoneless 是什么

「**去掉 Zone.js，改用 Signal 驱动 CD**」——Angular 不再监听异步事件，而是：

- Signal 变化 → 关联组件 / `effect` 被标记 dirty
- 模板事件（`(click)`）→ 当前组件标记 dirty
- 路由 / HTTP 完成 → 内部使用 Signal-based scheduler
- 时间到 → tick

```ts
// app.config.ts（v20 写法）
import { provideZonelessChangeDetection } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // 其它 provider
  ],
}
```

```ts
// main.ts 需要去掉 Zone.js polyfill
// 删除（或在 angular.json polyfills 中移除）：
// import 'zone.js'
```

::: tip v21 默认 Zoneless
v21 起 `ng new` 默认 Zoneless（不再生成 `polyfills.ts` 里的 `zone.js`）。老项目升级时 `ng update` 会询问是否切换。
:::

### 适配 Zoneless 的代码

新代码自然就是 Zoneless 友好的：

```ts
// ✅ 信号驱动
class Cmp {
  count = signal(0)
  inc() { this.count.update(c => c + 1) }
}

// ✅ Async pipe（已是基于 EmitterVisitor，与 Zone 解耦）
class Cmp {
  user$ = this.api.get<User>('/me')
}

// ✅ takeUntilDestroyed + RxJS
```

可能出问题的代码：

```ts
// ❌ 在 setTimeout / Promise 里直接改普通字段
class Cmp {
  data: any = null
  load() {
    fetch('/api').then(r => r.json()).then(d => {
      this.data = d            // Zoneless 下不触发 CD
    })
  }
}

// ✅ 改用 signal
class Cmp {
  data = signal<any>(null)
  load() {
    fetch('/api').then(r => r.json()).then(d => {
      this.data.set(d)         // 自动触发 CD
    })
  }
}
```

### 检查兼容性

```ts
// 触发未在 Angular 调度内的 task
import { isStable } from '@angular/core/testing'

// 用 ApplicationRef 监控
const appRef = inject(ApplicationRef)
appRef.isStable.subscribe(stable => {
  if (!stable) console.warn('App is unstable, CD pending')
})
```

升级到 Zoneless 前的检查清单：
1. 所有可变状态用 signal 包裹
2. 第三方库公告中提到「Zoneless ready」/「Signal compatible」
3. 在 dev 模式打开 `provideExperimentalCheckNoChangesForDebug` 检测未被通知的更新

## Server-Side Rendering（SSR）

### 创建 SSR 项目

```bash
ng new my-app --ssr     # 询问会自动配 SSR
# 或为已有项目加 SSR：
ng add @angular/ssr
```

### 入口结构

```
src/
├── app/
│   ├── app.config.ts                # 浏览器配置（共用）
│   ├── app.config.server.ts         # 服务端配置（merge）
│   ├── app.routes.ts                # 客户端路由
│   ├── app.routes.server.ts         # SSR / Prerender 配置
│   └── app.ts
├── main.ts                          # 浏览器入口
├── main.server.ts                   # 服务器入口
└── server.ts                        # Express / Node 服务器
```

### `app.config.server.ts`

```ts
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core'
import { provideServerRendering, withRoutes } from '@angular/ssr'
import { appConfig } from './app.config'
import { serverRoutes } from './app.routes.server'

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
  ],
}

export const config = mergeApplicationConfig(appConfig, serverConfig)
```

### `app.routes.server.ts` 渲染模式

```ts
import { RenderMode, ServerRoute } from '@angular/ssr'

export const serverRoutes: ServerRoute[] = [
  // SSR：每次请求服务端渲染
  { path: '', renderMode: RenderMode.Server },

  // CSR：客户端渲染（仅发空壳 HTML）
  { path: 'dashboard', renderMode: RenderMode.Client },

  // SSG：构建时预渲染
  { path: 'about', renderMode: RenderMode.Prerender },

  // 动态预渲染：构建时根据数据生成
  {
    path: 'posts/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const posts = await fetch('/api/posts').then(r => r.json())
      return posts.map((p: any) => ({ id: p.id }))
    },
  },
]
```

### 客户端水合

```ts
// app.config.ts
import { provideClientHydration } from '@angular/platform-browser'

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),    // 默认行为：服务端 HTML 被复用，不重渲染
  ],
}
```

### Incremental Hydration（v19+，已稳定）

让部分组件**保持 dehydrated 状态**，直到触发条件才水合（下载 + 实例化 JS）：

```ts
// app.config.ts
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser'

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withIncrementalHydration()),
  ],
}
```

```html
<!-- 模板 -->
@defer (hydrate on viewport) {
  <heavy-chart [data]="data" />
} @placeholder {
  <div class="skeleton">Chart placeholder</div>
}
```

`hydrate on` 触发器：

| 触发器 | 行为 |
|--------|------|
| `hydrate on idle` | 浏览器空闲 |
| `hydrate on viewport` | 进入视口 |
| `hydrate on interaction` | 用户交互 |
| `hydrate on hover` | 悬停 |
| `hydrate on immediate` | 立即（仅延迟下载） |
| `hydrate on timer(500ms)` | 计时器 |
| `hydrate when expr` | 表达式真 |

效果：首屏 JS bundle 缩到最小（只发当前视口需要的代码）；滚动 / 交互按需补齐。

### SSR 中的浏览器 API

服务端没有 `window` / `document`——直接访问会崩。两种方案：

```ts
import { afterNextRender, inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Component({ /* ... */ })
export class Cmp {
  private platformId = inject(PLATFORM_ID)

  constructor() {
    // 方案 1：仅浏览器执行
    if (isPlatformBrowser(this.platformId)) {
      console.log(window.innerWidth)
    }

    // 方案 2（推荐）：用 afterNextRender，本身不在 SSR 跑
    afterNextRender(() => {
      const w = window.innerWidth
      // ...
    })
  }
}
```

## DI 内部细节

### Injector Tree

```
EnvironmentInjector (root, ApplicationRef)
  ├─ ModuleInjector (legacy NgModule)
  ├─ Lazy Module Injector
  └─ Element Injector (per component)
        └─ Element Injector (sub-component)
              └─ ...
```

每个组件都有自己的 ElementInjector（用 `providers` 字段）。当 `inject(X)`：

1. 当前 ElementInjector
2. 父 ElementInjector
3. ...一路到根 ElementInjector
4. 然后跳到 EnvironmentInjector（root providers / lazy module providers）
5. 都没找到 → 抛错（除非 `{ optional: true }`）

### Resolution Modifiers

```ts
import { inject } from '@angular/core'

class Cmp {
  // 跳过自己，从父开始查（防止注入到自己）
  parentLogger = inject(Logger, { skipSelf: true })

  // 只查自己，不向上
  ownConfig = inject(Config, { self: true })

  // 仅当前 host 注入器（指令查宿主组件用）
  hostState = inject(State, { host: true })

  // 找不到也行（返回 null）
  optionalSvc = inject(MaybeSvc, { optional: true })
}
```

### 自定义 Injector

```ts
import { Injector, runInInjectionContext } from '@angular/core'

const custom = Injector.create({
  providers: [
    { provide: MyService, useValue: new MyService() },
  ],
})

runInInjectionContext(custom, () => {
  const svc = inject(MyService)
  // ...
})
```

`runInInjectionContext` 让你在任意函数内用 `inject()`（默认 `inject` 只能在 injection context 内）。

### `EnvironmentInjector` vs `Injector`

- `EnvironmentInjector`：应用根 / 路由根 / lazy module 用
- `Injector`：广义 injector，包含 ElementInjector / EnvironmentInjector

`provideXxx` 返回 `EnvironmentProviders`，只能在应用 / 路由 / 子路由 providers 上用，不能在组件 `providers` 用——这是 v15 引入的约束：

```ts
// ✅ 应用根
provideRouter(routes)

// ✅ 路由级
{
  path: 'admin',
  providers: [
    provideHttpClient(/* lazy module 的额外 interceptor */),
  ],
}

// ❌ 组件级（编译错误）
@Component({
  providers: [provideRouter(routes)],
})
```

## AOT vs JIT 编译

### AOT（Ahead-of-Time）

**默认且推荐的生产构建**。在构建期把模板 / 装饰器 / DI 元数据编译为纯 JS 实例化函数，不再需要运行时模板编译器。

```bash
ng build                # 默认 AOT
ng build --configuration=production
```

优势：
- 启动快（无运行时模板编译）
- bundle 小（编译器代码不打进去）
- 错误早暴露（模板类型错误在 build 期就报）
- Tree-shaking 友好

### JIT（Just-in-Time）

仅 dev 工具 / 早期 v9- 时代用，现在几乎不可见。

```bash
ng build --aot=false    # 已不再支持（v16 默认强制 AOT）
```

## Ivy 渲染引擎

### 局部性（Locality）

Ivy（Angular v9+ 默认）把模板编译为**针对该组件的独立 instance closure**：

```html
<!-- 模板 -->
<div>{{ name }}</div>
<button (click)="onClick()">Click</button>
```

编译后：

```js
function MyCmp_Template(rf, ctx) {
  if (rf & 1) {           // create mode
    ɵɵelementStart(0, 'div')
    ɵɵtext(1)
    ɵɵelementEnd()
    ɵɵelementStart(2, 'button')
    ɵɵlistener('click', () => ctx.onClick())
    ɵɵtext(3, 'Click')
    ɵɵelementEnd()
  }
  if (rf & 2) {           // update mode
    ɵɵadvance()
    ɵɵtextInterpolate(ctx.name)
  }
}
```

每个组件的模板 → 独立函数 → tree-shake 友好（未用的组件代码不打进 bundle）。

### 对比 React Fiber

| 维度 | Angular Ivy | React Fiber |
|------|------------|-------------|
| 编译 | 模板编译为 instance closure | JSX 编译为 `React.createElement` 调用 |
| 节点结构 | LView + TView 数组结构 | Fiber 链表（child / sibling / return） |
| 调度 | 同步（OnPush）/ Zone 通知 | concurrent mode（time-slicing） |
| 局部性 | 模板代码与组件强绑定 | 组件代码与运行时通用化 |

## Standalone 迁移

### 从 NgModule 到 Standalone

```bash
# 自动迁移工具
ng generate @angular/core:standalone

# 交互式询问：
# - Convert all components, directives and pipes to standalone
# - Remove unnecessary NgModules
# - Bootstrap the application using standalone APIs
```

工具会：
1. 给每个 `@Component` 加 `standalone: true`（或删除 `standalone: false`）
2. 把 NgModule 的 `imports` / `declarations` 拷贝到组件 `imports`
3. 删除空 NgModule
4. `main.ts` 切到 `bootstrapApplication`

### 何时仍保留 NgModule

- 与依赖大量 NgModule 的旧库共存
- 极少数 `forRoot()` / `forChild()` 多 provider 配置（用 `EnvironmentInjector + providers` 也能搞定）

新项目应该完全不写 NgModule。

## 性能优化

### `OnPush` + Signal（推荐基线）

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

Zoneless 项目里所有组件都按 OnPush 工作，没有性能损耗。

### `@for` 用合适的 `track`

```html
<!-- ✅ 用唯一 ID -->
@for (user of users(); track user.id) { ... }

<!-- ⚠️ track $index：列表无新增 / 删除时可，否则会重建 -->
@for (chip of chips; track $index) { ... }

<!-- ❌ track item：除非引用稳定（不可变更新） -->
```

### `runOutsideAngular` 跳出 Zone

需要兼容 Zoned 模式时，避免高频任务触发 CD：

```ts
import { NgZone, inject } from '@angular/core'

class Cmp {
  private zone = inject(NgZone)

  startAnimation() {
    this.zone.runOutsideAngular(() => {
      // 高频任务（rAF / mousemove）在 zone 外执行
      const loop = () => {
        // 更新 canvas
        requestAnimationFrame(loop)
      }
      loop()
    })
  }
}
```

Zoneless 模式下不需要这个 API（本来就没 zone）。

### Lazy module / lazy component

```ts
{ path: 'admin', loadComponent: () => import('./admin').then(m => m.Admin) }
```

每个 lazy chunk 是单独 JS 文件 → 首屏 bundle 小。

### `@defer` 延迟下载

非首屏组件用 `@defer`：

```html
@defer (on viewport) {
  <heavy-chart />
}
```

构建时自动拆 chunk。

### Bundle 分析

```bash
ng build --stats-json
pnpm dlx esbuild-visualizer --metadata dist/my-app/stats.json --open
# 或
pnpm dlx source-map-explorer dist/**/*.js
```

`@angular/build:application`（v17+ 默认）输出 `stats.json`，可视化每个 chunk 内容。

### 服务端预渲染（SSG / Prerender）

详见上面 SSR 章节，对静态内容（博客 / 文档）能把首屏时间降到 < 100ms。

### `httpResource` + `prefetch` 配合

```html
@defer (on interaction; prefetch on idle) {
  <heavy-modal />
}
```

idle 时预下载 JS，但不渲染（直到点击）。

## 微前端

### Module Federation / Native Federation

[Native Federation](https://github.com/angular-architects/module-federation-plugin)（基于 Import Maps，无需 Webpack）是 Angular 21 推荐的微前端方案。

```bash
ng add @angular-architects/native-federation
```

```ts
// federation.config.js
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config')

module.exports = withNativeFederation({
  name: 'shell',
  exposes: {},
  remotes: {
    mfe1: 'http://localhost:4201/remoteEntry.json',
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: false, requiredVersion: 'auto' }),
  },
})
```

```ts
// shell 加载 remote 组件
import { loadRemoteModule } from '@angular-architects/native-federation'

const Cmp = await loadRemoteModule({
  remoteName: 'mfe1',
  exposedModule: './FlightsCmp',
}).then(m => m.FlightsCmp)
```

```ts
// 路由内懒加载远程
{
  path: 'flights',
  loadComponent: () =>
    loadRemoteModule({ remoteName: 'mfe1', exposedModule: './FlightsCmp' })
      .then(m => m.FlightsCmp),
}
```

### single-spa-angular

跨框架（React + Vue + Angular）共存方案。配置较繁琐，仅在已有混合栈时考虑。

## PWA 集成

```bash
ng add @angular/pwa
```

自动配置 `manifest.webmanifest`、Service Worker、图标。

```ts
// app.config.ts（已自动加）
import { provideServiceWorker } from '@angular/service-worker'

export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}
```

### `ngsw-config.json` 缓存策略

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/assets/**", "/*.(svg|cur|jpg|jpeg|png|webp|gif|otf|ttf|woff|woff2)"]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api",
      "urls": ["/api/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "5s"
      }
    }
  ]
}
```

策略：`prefetch`（一开始就下载）/ `lazy`（按需）；`freshness`（先网络）/ `performance`（先缓存）。

### SwUpdate 检测新版本

```ts
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker'

class Cmp {
  private swUpdate = inject(SwUpdate)

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(evt => {
        if (evt.type === 'VERSION_READY') {
          if (confirm('New version available. Reload?')) {
            location.reload()
          }
        }
      })
    }
  }
}
```

## Angular Elements（编译为 Web Component）

```bash
pnpm add @angular/elements
```

```ts
import { createCustomElement } from '@angular/elements'

@Injectable()
export class App {
  constructor(injector: Injector) {
    const el = createCustomElement(GreeterCmp, { injector })
    customElements.define('my-greeter', el)
  }
}
```

打包后 `<my-greeter name="Alice" />` 在任意 HTML / React / Vue 项目都能直接用。

::: tip 用途
- 给非 Angular 项目嵌入 Angular 组件（旧 React / WordPress / 静态站）
- 微前端共享组件（不用 Module Federation 的轻量方案）
:::

## 测试深入

### `TestBed` 基础

```ts
import { TestBed } from '@angular/core/testing'
import { Counter } from './counter'

describe('Counter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Counter],
      providers: [
        { provide: ApiService, useValue: { get: jest.fn() } },
      ],
    })
  })

  it('renders count', () => {
    const fixture = TestBed.createComponent(Counter)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Count: 0')
  })
})
```

### `fakeAsync` + `tick`

测试涉及定时器 / Promise 的代码：

```ts
import { fakeAsync, tick } from '@angular/core/testing'

it('updates after delay', fakeAsync(() => {
  const fixture = TestBed.createComponent(DelayedCmp)
  fixture.detectChanges()

  tick(1000)             // 模拟 1 秒过去
  fixture.detectChanges()

  expect(fixture.nativeElement.textContent).toContain('Loaded')
}))
```

### `flushMicrotasks` / `flush`

```ts
flushMicrotasks()        // 跑完所有 microtask（Promise.then）
flush()                  // 跑完所有定时器（直到队列空）
```

### Shallow Component Test

```ts
// 测试 PostList，但不真实渲染 PostCard 子组件
TestBed.overrideComponent(PostList, {
  set: { imports: [MockPostCard] },
})
```

```ts
@Component({ selector: 'app-post-card', template: '' })
class MockPostCard {}
```

或用 [`ng-mocks`](https://ng-mocks.sudo.eu/) 自动 mock。

### HttpClientTestingModule

```ts
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'

beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [UserService],
  })
})

it('loads users', () => {
  const svc = TestBed.inject(UserService)
  const http = TestBed.inject(HttpTestingController)

  let result: User[] = []
  svc.list().subscribe(users => result = users)

  const req = http.expectOne('/api/users')
  expect(req.request.method).toBe('GET')
  req.flush([{ id: 1, name: 'Alice' }])

  expect(result).toEqual([{ id: 1, name: 'Alice' }])
  http.verify()         // 确保所有请求都被消费
})
```

### Test Harnesses（Angular CDK）

`@angular/cdk/testing` 提供组件无关测试 API：

```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { MatButtonHarness } from '@angular/material/button/testing'

it('clicks button', async () => {
  const fixture = TestBed.createComponent(MyCmp)
  const loader = TestbedHarnessEnvironment.loader(fixture)

  const btn = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))
  await btn.click()
  // ...
})
```

跨测试环境（Karma / Cypress / Protractor）同一 API。

## 自定义元素 / 自定义指令

### 自定义结构指令

```ts
import { Directive, TemplateRef, ViewContainerRef, inject, input, effect } from '@angular/core'

@Directive({
  selector: '[appRange]',
})
export class RangeDirective {
  private tpl = inject(TemplateRef<{ $implicit: number; index: number }>)
  private vc = inject(ViewContainerRef)

  appRangeFrom = input.required<number>()
  appRangeTo = input.required<number>()

  constructor() {
    effect(() => {
      this.vc.clear()
      for (let i = this.appRangeFrom(); i < this.appRangeTo(); i++) {
        this.vc.createEmbeddedView(this.tpl, { $implicit: i, index: i - this.appRangeFrom() })
      }
    })
  }
}
```

```html
<p *appRange="let i; from: 0; to: 5">{{ i }}</p>
<!-- 输出：0 1 2 3 4 -->
```

不过 v17+ 用 `@for (i of range(0, 5); track i) {}` 通常更简单。

### 属性指令复用 lifecycle

```ts
@Directive({
  selector: '[appAutoFocus]',
})
export class AutoFocus {
  private el = inject(ElementRef<HTMLInputElement>)

  constructor() {
    afterNextRender(() => {
      this.el.nativeElement.focus()
    })
  }
}
```

## v14 → v21 升级要点

### v14（2022.6）

- 标准 standalone API 引入（experimental）
- Typed Forms（默认）
- inject() 函数

### v15（2022.11）

- Standalone 稳定，可正式生产使用
- `provideHttpClient` / `provideRouter` / `provideAnimations`
- Image 优化指令 `NgOptimizedImage`

### v16（2023.5）

- Signals 引入（experimental → developer preview）
- `DestroyRef` + `takeUntilDestroyed`
- `inject` API 改善
- esbuild dev server 实验

### v17（2023.11）

- **新控制流 `@if` / `@for` / `@switch`**（developer preview）
- **`@defer` 延迟加载**
- Signals 进入 stable
- Standalone API 默认（`ng new` 不再生成 NgModule）
- esbuild + Vite 默认 builder
- 文档站从 `angular.io` 迁到 `angular.dev`

### v18（2024.5）

- 控制流 + Signals API 全部 stable
- Zoneless 实验 API（`provideExperimentalZonelessChangeDetection`）
- `@let` 模板变量
- Material 3 集成

### v19（2024.11）

- **`linkedSignal` 稳定**
- **`resource` API 实验**
- **`httpResource` 实验**
- Incremental Hydration 实验
- standalone components 默认 + `ng generate` 不再生成 standalone 字段

### v20（2025.5）

- Signal Forms 实验
- Component file naming 简化（去掉 `.component` 中缀）
- Incremental Hydration 稳定
- Zoneless 稳定（仍非默认）

### v21（2026.5）

- **Zoneless 默认**
- `@angular/build:application` builder 默认
- 旧 `@angular-devkit/build-angular` builder 标记 deprecated
- 进一步去 Zone.js（移除 polyfills.ts 中的 zone.js）
- Signal Forms 进入 developer preview

### 升级流程

```bash
# 1. 升级 CLI 到最新
pnpm add -g @angular/cli

# 2. 项目内升级（自动迁移）
ng update @angular/core @angular/cli

# 3. 升级第三方
ng update @angular/material
ng update @ngrx/store

# 4. 运行所有迁移 schematic
ng update --create-commits
```

`ng update` 会读 `package.json` → 找到所有 Angular 包 → 按版本顺序应用 schematic（即「自动 codemod」），通常一条命令就能从 v14 升到 v21（虽然实际中分多次更稳）。

### 跨版本迁移工具

```bash
# 把 *ngIf / *ngFor 改写为 @if / @for
ng g @angular/core:control-flow

# 从 NgModule 转 Standalone
ng g @angular/core:standalone

# 从 inject 到 inject() 函数
ng g @angular/core:inject

# 把 .component.ts 改名
ng g @angular/core:cleanup-unused-imports
```

## 一份生产级 Signal Store 示例

```ts
// stores/products.ts
import { Injectable, computed, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError, finalize, of } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

export interface Product {
  id: number
  name: string
  price: number
  stock: number
}

interface State {
  items: Product[]
  loading: boolean
  error: string | null
  filter: string
}

const initialState: State = {
  items: [],
  loading: false,
  error: null,
  filter: '',
}

@Injectable({ providedIn: 'root' })
export class ProductsStore {
  private http = inject(HttpClient)

  // private writable
  private state = signal<State>(initialState)

  // public readonly views
  readonly items = computed(() => this.state().items)
  readonly loading = computed(() => this.state().loading)
  readonly error = computed(() => this.state().error)
  readonly filter = computed(() => this.state().filter)

  readonly filtered = computed(() => {
    const q = this.filter().toLowerCase()
    return q
      ? this.items().filter(p => p.name.toLowerCase().includes(q))
      : this.items()
  })

  readonly totalStock = computed(() =>
    this.items().reduce((sum, p) => sum + p.stock, 0))

  // actions
  setFilter(filter: string) {
    this.state.update(s => ({ ...s, filter }))
  }

  load() {
    this.state.update(s => ({ ...s, loading: true, error: null }))
    this.http.get<Product[]>('/api/products').pipe(
      catchError(err => {
        this.state.update(s => ({ ...s, error: err.message }))
        return of([] as Product[])
      }),
      finalize(() => this.state.update(s => ({ ...s, loading: false }))),
      takeUntilDestroyed(),
    ).subscribe(items => {
      this.state.update(s => ({ ...s, items }))
    })
  }

  add(p: Product) {
    this.state.update(s => ({ ...s, items: [...s.items, p] }))
  }

  remove(id: number) {
    this.state.update(s => ({ ...s, items: s.items.filter(p => p.id !== id) }))
  }

  update(id: number, patch: Partial<Product>) {
    this.state.update(s => ({
      ...s,
      items: s.items.map(p => p.id === id ? { ...p, ...patch } : p),
    }))
  }

  reset() {
    this.state.set(initialState)
  }
}
```

```ts
// pages/products.ts
import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ProductsStore } from '../stores/products'

@Component({
  selector: 'app-products',
  imports: [FormsModule],
  template: `
    <h1>Products</h1>

    <input
      [(ngModel)]="filter"
      (ngModelChange)="store.setFilter($event)"
      placeholder="Search..."
    />

    @if (store.loading()) {
      <p>Loading...</p>
    } @else if (store.error()) {
      <p class="error">{{ store.error() }}</p>
      <button (click)="store.load()">Retry</button>
    } @else {
      <ul>
        @for (p of store.filtered(); track p.id) {
          <li>
            {{ p.name }} - ${{ p.price }} (stock: {{ p.stock }})
            <button (click)="store.remove(p.id)">Remove</button>
          </li>
        } @empty {
          <li>No products</li>
        }
      </ul>

      <p>Total stock: {{ store.totalStock() }}</p>
    }
  `,
})
export class Products {
  store = inject(ProductsStore)
  filter = ''

  ngOnInit() {
    this.store.load()
  }
}
```

这一个 store 涵盖：state 封装 + signal-based selector + RxJS 副作用 + 不可变更新 + computed 派生 + DestroyRef 自动 unsubscribe。生产级别可直接拿来用。

## 下一步

- 生态集成（Material / Tailwind / Nx / Ionic）详见 [指南 - 其他](./other.md)
- 完整 API 速查见 [参考](../reference.md)
