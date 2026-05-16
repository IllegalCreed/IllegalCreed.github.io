---
layout: doc
outline: [2, 3]
---

# 指南 - 进阶

> 基于 Angular 21.x 编写 —— 依赖注入、路由、HTTP、RxJS、状态管理、i18n、测试、TypeScript 强类型

## 速查

- DI：`@Injectable({providedIn: 'root'})` / `inject()` / `InjectionToken` / `Provider`（`useClass` / `useValue` / `useFactory` / `useExisting` / `multi`）
- 路由：`provideRouter(routes, withFeatures...)` / `<router-outlet>` / `routerLink` / `ActivatedRoute` / `Router`
- 守卫：函数式 `CanActivateFn` / `CanDeactivateFn` / `ResolveFn` / `CanMatchFn`
- HTTP：`provideHttpClient(withFetch(), withInterceptors([...]))` / `HttpClient` / `HttpInterceptorFn`
- RxJS：`Observable` / `Subject` / `BehaviorSubject` / `takeUntilDestroyed` / `toSignal` / `toObservable`
- 变更检测：`ChangeDetectionStrategy.OnPush`（推荐）/ `ChangeDetectorRef.markForCheck()`
- 状态：NgRx / Component Store / Signal Store / Akita / NGXS
- i18n：`@angular/localize` + `i18n` 属性 + `ng extract-i18n` + `ng build --localize`
- 测试：Karma + Jasmine（默认）/ Jest（社区）/ Cypress / Playwright Component
- TypeScript：泛型组件 / Typed Forms / 类型化 Routes

## 依赖注入

### `@Injectable` 服务

```ts
import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',   // 全局单例（推荐）
})
export class UserService {
  getCurrent() {
    return { name: 'Alice' }
  }
}
```

`providedIn` 可选值：

| 值 | 含义 |
|----|------|
| `'root'` | 全局单例（懒加载也共用） |
| `'platform'` | 多 Angular 应用之间共享（很少用） |
| `'any'` | 每个懒加载模块独立实例 |
| 具体 `@NgModule` 引用 | 仅在该模块下提供（旧风格） |

不传 `providedIn`，必须显式注册到组件 / 模块 / app 的 `providers`：

```ts
@Component({
  providers: [UserService],   // 仅此组件树共享一个实例
  // ...
})
```

### `inject()` 函数（v14+ 推荐）

```ts
import { Component, inject } from '@angular/core'
import { UserService } from './user'

@Component({ /* ... */ })
export class Profile {
  // 字段初始化时即注入，类型自动推断
  private user = inject(UserService)

  current = this.user.getCurrent()
}
```

旧 constructor 注入：

```ts
@Component({ /* ... */ })
export class Profile {
  constructor(private user: UserService) {}
}
```

::: tip `inject()` 的优势
- 不需要 constructor 签名，减少样板
- 可在工厂函数 / `provideXxx` 内使用
- 类型推断更稳，不会和泛型组件起冲突
- 推荐在新代码全面切换
:::

### `InjectionToken`

非 class 类型（接口、字面量、配置对象）注入：

```ts
import { InjectionToken } from '@angular/core'

export interface AppConfig {
  apiUrl: string
  debug: boolean
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({ apiUrl: '/api', debug: false }),
})

// 使用
@Injectable({ providedIn: 'root' })
export class Api {
  private config = inject(APP_CONFIG)
  // ...
}

// 覆盖（app.config.ts）：
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_CONFIG, useValue: { apiUrl: '/api/v2', debug: true } },
  ],
}
```

### `Provider` 配置方式

```ts
import { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. useClass（默认）
    UserService,                                            // 简写
    { provide: UserService, useClass: MockUserService },    // 用 MockUserService 代替

    // 2. useValue（用固定值）
    { provide: API_URL, useValue: '/api/v2' },

    // 3. useFactory（用工厂函数）
    {
      provide: TIMER,
      useFactory: () => new Timer(performance.now()),
      deps: [],   // 工厂依赖（已老式，新写法用 inject 在 factory 内）
    },

    // 4. useExisting（别名）
    { provide: ILogger, useExisting: ConsoleLogger },

    // 5. multi（同 token 多个 provider 累加成数组）
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
    // inject(HTTP_INTERCEPTORS) → [AuthInterceptor, LoggingInterceptor]
  ],
}
```

### `inject()` 配置选项

```ts
import { inject, Optional, Self, SkipSelf, Host } from '@angular/core'

class Cmp {
  // 可选注入（无 provider 时返回 null）
  optional = inject(MaybeMissingService, { optional: true })

  // 跳过当前 injector，从父查
  parent = inject(ParentService, { skipSelf: true })

  // 仅当前 injector
  self = inject(SelfService, { self: true })

  // 只在 host injector 找（指令注入宿主组件）
  host = inject(HostService, { host: true })
}
```

### 层次化 Injector

Angular DI 是「树状 + 沿父链查找」：

```
Root Injector (providedIn: 'root')
  ├─ Lazy Module Injector
  ├─ Component Injector (component's providers)
  │    └─ Sub-component Injector
  └─ ...
```

子组件 `inject(X)` 时：

1. 先查自己 `providers`
2. 没有则向上查父 → 祖先 → ... → root
3. 都没有：抛错 `NullInjectorError`（除非 `{ optional: true }`）

### Hierarchical 实战：组件级 provider

```ts
@Component({
  selector: 'app-form-wizard',
  providers: [WizardState],   // 每个 wizard 实例独立 state
  template: `
    <step-one /> <step-two /> <step-three />
  `,
})
export class FormWizard {}

// step-one / step-two / step-three 通过 inject(WizardState) 拿同一实例
```

这是 React 的 Context Provider + Vue 的 provide-inject 的强类型版本。

## 路由（Angular Router）

### 基础配置

```ts
// src/app/app.routes.ts
import { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then(m => m.Home) },
  { path: 'users', loadComponent: () => import('./pages/users').then(m => m.Users) },
  { path: 'users/:id', loadComponent: () => import('./pages/user').then(m => m.User) },
  { path: '**', loadComponent: () => import('./pages/not-found').then(m => m.NotFound) },
]
```

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core'
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),    // 路由参数自动绑定到 input()
      withViewTransitions(),          // CSS view transitions
    ),
  ],
}
```

### 导航与链接

```html
<!-- 模板内 -->
<a routerLink="/users">Users</a>
<a [routerLink]="['/users', userId]" [queryParams]="{ page: 2 }">User</a>

<!-- 当前激活样式 -->
<a routerLink="/home" routerLinkActive="active">Home</a>

<!-- 精确匹配 -->
<a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Root</a>

<!-- 路由出口 -->
<router-outlet />

<!-- 多 outlet（secondary） -->
<router-outlet name="sidebar" />
```

```ts
// 编程式
import { Router } from '@angular/router'

class Cmp {
  private router = inject(Router)

  goUser(id: number) {
    this.router.navigate(['/users', id], { queryParams: { tab: 'info' } })
  }

  goByUrl() {
    this.router.navigateByUrl('/login?from=/users')
  }
}
```

### `ActivatedRoute` 读参数

```ts
import { ActivatedRoute } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'

@Component({ /* ... */ })
export class UserPage {
  private route = inject(ActivatedRoute)

  // 1. 快照（仅初次）
  idSnapshot = this.route.snapshot.paramMap.get('id')

  // 2. Observable 流（响应路由变化）
  id$ = this.route.paramMap.pipe(map(p => p.get('id')))

  // 3. Signal 化
  id = toSignal(this.id$, { initialValue: null })

  // 4. queryParams / fragment
  page = toSignal(this.route.queryParamMap.pipe(map(p => p.get('page'))))
}
```

### `withComponentInputBinding()` 自动注入路由参数（v16+）

```ts
// app.config.ts
provideRouter(routes, withComponentInputBinding())

// pages/user.ts
@Component({ /* ... */ })
export class UserPage {
  // 路径参数 :id 自动绑定到 input id（同名）
  id = input<string>()

  // queryParam ?tab=info 自动绑定到 input tab
  tab = input<string>()

  // 路由 data 也可
  // { path: 'admin', data: { role: 'admin' }, ... }
  role = input<string>()
}
```

这一招大幅简化了原来必须订阅 `ActivatedRoute` 的写法。

### 子路由 / 嵌套路由

```ts
export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-layout').then(m => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', loadComponent: () => import('./admin/users').then(m => m.AdminUsers) },
      { path: 'orders', loadComponent: () => import('./admin/orders').then(m => m.AdminOrders) },
    ],
  },
]
```

```ts
// admin-layout.ts
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav>
      <a routerLink="users">Users</a>
      <a routerLink="orders">Orders</a>
    </nav>
    <router-outlet />
  `,
})
export class AdminLayout {}
```

### 路由守卫（函数式，v15+）

```ts
// guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router'
import { inject } from '@angular/core'
import { AuthService } from '../services/auth'

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)
  const router = inject(Router)

  if (auth.isLoggedIn()) return true
  // 重定向：返回 UrlTree
  return router.createUrlTree(['/login'], { queryParams: { from: state.url } })
}
```

```ts
// 使用
export const routes: Routes = [
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile').then(m => m.Profile),
  },
]
```

各种守卫：

| 守卫 | 用途 |
|------|------|
| `CanActivateFn` | 能否激活路由 |
| `CanActivateChildFn` | 能否激活子路由 |
| `CanDeactivateFn<Cmp>` | 能否离开当前路由（脏表单提示） |
| `CanMatchFn` | 是否匹配此路由（更早，可改路由策略） |
| `ResolveFn<T>` | 进入前预取数据 |

```ts
// CanDeactivate 示例
import { CanDeactivateFn } from '@angular/router'

export const confirmLeaveGuard: CanDeactivateFn<FormPage> = (cmp) => {
  if (cmp.form.dirty) {
    return confirm('Unsaved changes. Leave anyway?')
  }
  return true
}
```

```ts
// Resolve 示例
import { ResolveFn } from '@angular/router'

export const userResolver: ResolveFn<User> = (route) => {
  const api = inject(ApiService)
  return api.getUser(route.paramMap.get('id')!)
}

// 使用
{
  path: 'users/:id',
  resolve: { user: userResolver },
  loadComponent: () => import('./pages/user').then(m => m.User),
}

// 组件内（配合 withComponentInputBinding）
@Component({ /* ... */ })
export class User {
  user = input.required<User>()    // 自动从 resolve 数据注入
}
```

### 懒加载

```ts
// 组件懒加载（v14+，推荐）
{ path: 'admin', loadComponent: () => import('./pages/admin').then(m => m.Admin) }

// 一段子路由懒加载
{ path: 'admin', loadChildren: () => import('./admin/routes').then(m => m.adminRoutes) }
```

```ts
// admin/routes.ts
import { Routes } from '@angular/router'

export const adminRoutes: Routes = [
  { path: '', loadComponent: () => import('./layout').then(m => m.Layout) },
  { path: 'users', loadComponent: () => import('./users').then(m => m.Users) },
]
```

### `withPreloading` 预加载

```ts
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router'

provideRouter(routes, withPreloading(PreloadAllModules))

// 或自定义策略
import { PreloadingStrategy, Route } from '@angular/router'
import { Observable, of } from 'rxjs'

class PreloadOnHover implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>) {
    return route.data?.['preload'] ? load() : of(null)
  }
}

provideRouter(routes, withPreloading(PreloadOnHover))
```

### `withViewTransitions()`（v17+）

启用浏览器 View Transitions API（路由切换有原生过渡动画）：

```ts
provideRouter(routes, withViewTransitions())
```

仅 Chromium 系支持，其它浏览器自动回退。

## HTTP 客户端

### 启用 HttpClient（v15+ 推荐用 `provideHttpClient`）

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),                          // 用 fetch API 代替 XHR（v17+）
      withInterceptors([authInterceptor]),  // 函数式拦截器
    ),
  ],
}
```

### 基本 CRUD

```ts
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Observable } from 'rxjs'

export interface User {
  id: number
  name: string
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient)
  private base = '/api/users'

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.base)
  }

  get(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`)
  }

  create(data: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.base, data)
  }

  update(id: number, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}`, data)
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`)
  }
}
```

### Headers / Query Params

```ts
import { HttpHeaders, HttpParams } from '@angular/common/http'

this.http.get<User[]>('/api/users', {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + token,
    'X-Trace-Id': traceId,
  }),
  params: new HttpParams()
    .set('page', '1')
    .set('size', '20'),
})

// 也可直接传对象
this.http.get<User[]>('/api/users', {
  headers: { Authorization: 'Bearer ' + token },
  params: { page: 1, size: 20 },
})
```

### 函数式拦截器（v15+ 推荐）

```ts
// interceptors/auth.ts
import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from '../services/auth'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService)
  const token = auth.token()

  // 加 Authorization
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req

  return next(authReq)
}
```

```ts
// interceptors/logging.ts
import { HttpInterceptorFn } from '@angular/common/http'
import { tap } from 'rxjs'

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const t0 = performance.now()
  console.log('→', req.method, req.url)

  return next(req).pipe(
    tap(event => {
      if (event.type === 4 /* HttpEventType.Response */) {
        const dt = performance.now() - t0
        console.log('←', req.method, req.url, dt.toFixed(0) + 'ms')
      }
    }),
  )
}
```

```ts
// 注册（顺序即执行顺序）
provideHttpClient(withInterceptors([loggingInterceptor, authInterceptor]))
```

### 错误处理

```ts
import { HttpErrorResponse } from '@angular/common/http'
import { catchError, throwError } from 'rxjs'

this.http.get<User>(`/api/users/${id}`).pipe(
  catchError((err: HttpErrorResponse) => {
    if (err.status === 404) {
      console.warn('Not found')
      return of(null)
    }
    return throwError(() => err)
  }),
)
```

全局错误拦截器：

```ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const toast = inject(ToastService)
      if (err.status === 401) {
        inject(Router).navigate(['/login'])
      } else {
        toast.error(err.message)
      }
      return throwError(() => err)
    }),
  )
}
```

### `httpResource`（v19 experimental）

把 HTTP 请求直接转 signal resource：

```ts
import { httpResource } from '@angular/common/http'

@Component({ /* ... */ })
export class UserView {
  userId = input.required<string>()

  user = httpResource<User>(() => `/api/users/${this.userId()}`)
  // user.value() / user.isLoading() / user.error() / user.reload()
}
```

```html
@if (user.isLoading()) {
  <spinner />
} @else if (user.error()) {
  <p>Error: {{ user.error()?.message }}</p>
} @else if (user.value(); as data) {
  <p>{{ data.name }}</p>
}
```

支持完整请求配置：

```ts
user = httpResource<User>(() => ({
  url: `/api/users/${this.userId()}`,
  method: 'GET',
  headers: { 'X-Trace': '1' },
  params: { include: 'profile' },
}))
```

## RxJS 集成

### Observable 基础

```ts
import { Observable, of, from, interval, fromEvent } from 'rxjs'
import { map, filter, debounceTime, switchMap, takeUntil, takeUntilDestroyed } from 'rxjs'

const numbers$ = of(1, 2, 3)             // 同步发射
const arr$ = from([1, 2, 3])              // Iterable
const tick$ = interval(1000)              // 每秒发射
const clicks$ = fromEvent(btn, 'click')   // 事件流
```

### Subject 类型

```ts
import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs'

const s = new Subject<number>()
s.next(1)
s.subscribe(v => console.log(v))   // 订阅后才能收到

const bs = new BehaviorSubject(0)   // 必须有初始值
bs.subscribe(v => console.log(v))   // 立即收到 0
bs.next(1)                          // 收到 1
console.log(bs.value)               // 1（同步读当前值）

const rs = new ReplaySubject<number>(2)   // 缓存最近 2 个
rs.next(1); rs.next(2); rs.next(3)
rs.subscribe(v => console.log(v))   // 收到 2, 3（最近 2 个）
```

### Signal ↔ RxJS 互通（`@angular/core/rxjs-interop`）

```ts
import { toSignal, toObservable } from '@angular/core/rxjs-interop'

@Component({ /* ... */ })
export class Cmp {
  // Observable → Signal
  user$ = this.api.getUser()
  user = toSignal(this.user$, { initialValue: null })   // Signal<User | null>

  // 必须有初始值或要求 sync 发射
  userRequired = toSignal(this.user$, { requireSync: true })

  // Signal → Observable
  count = signal(0)
  count$ = toObservable(this.count)
}
```

### `takeUntilDestroyed`（v16+）

自动在组件销毁时退订：

```ts
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

@Component({ /* ... */ })
export class Cmp {
  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())   // 在 constructor 等 injection context 内自动绑定 DestroyRef
      .subscribe(t => console.log(t))
  }

  // 在其它方法内：显式 DestroyRef
  private destroyRef = inject(DestroyRef)

  start() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe()
  }
}
```

替代了「手动 `private destroy$ = new Subject()` + `ngOnDestroy() { this.destroy$.next() }`」的样板。

### 典型 RxJS 模式：debounced 搜索

```ts
import { Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-search',
  imports: [FormsModule],
  template: `
    <input [(ngModel)]="query" (ngModelChange)="onChange($event)" />
    @if (results(); as data) {
      <ul>
        @for (item of data; track item.id) {
          <li>{{ item.name }}</li>
        }
      </ul>
    }
  `,
})
export class Search {
  private api = inject(ApiService)
  query = signal('')

  private query$ = new Subject<string>()

  onChange(v: string) {
    this.query$.next(v)
  }

  results = toSignal(
    this.query$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q ? this.api.search(q) : of([])),
    ),
    { initialValue: [] },
  )
}
```

## 变更检测与 OnPush

### Change Detection 策略

```ts
import { ChangeDetectionStrategy } from '@angular/core'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

- **Default**：每次 Zone.js 通知（事件 / setTimeout / Promise）→ 整棵树脏检查
- **OnPush**：仅在以下情况才检查：
  1. 输入引用变化（`@Input` / `input()` 收到新引用）
  2. 组件 / 子组件触发了事件
  3. AsyncPipe 收到新值
  4. 手动 `cdr.markForCheck()`
  5. Signal 依赖变化（v17+）

::: tip Zoneless 时代 OnPush 等价于默认
v21 Zoneless 模式下没有 Zone.js 触发的「整树脏检查」，所有组件本质上都按 OnPush 工作。新代码可以不写 `changeDetection: OnPush`，**但仍是好习惯**——能在 Zoned / Zoneless 之间无缝迁移。
:::

### Signals 与 OnPush 完美配合

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Count: {{ count() }}</p>
    <button (click)="increment()">+1</button>
  `,
})
export class Counter {
  count = signal(0)   // signal 变化自动触发当前组件的 CD（不需手动 markForCheck）

  increment() {
    this.count.update(c => c + 1)
  }
}
```

### 手动控制 CD

```ts
import { ChangeDetectorRef, inject } from '@angular/core'

class Cmp {
  private cdr = inject(ChangeDetectorRef)

  triggerCheck() {
    this.cdr.detectChanges()   // 立刻同步检测自身和子树
  }

  markForCheck() {
    this.cdr.markForCheck()    // 标记后下次 tick 检测
  }

  detach() {
    this.cdr.detach()          // 暂停 CD（极少用，性能优化）
    this.cdr.reattach()
  }
}
```

## 状态管理

### Service + Signals（最轻量）

```ts
// services/cart.ts
import { Injectable, computed, signal } from '@angular/core'

interface Item { id: string; price: number; qty: number }

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<Item[]>([])

  readonly items = this._items.asReadonly()
  readonly total = computed(() =>
    this._items().reduce((s, i) => s + i.price * i.qty, 0))
  readonly count = computed(() =>
    this._items().reduce((n, i) => n + i.qty, 0))

  add(item: Item) {
    this._items.update(list => {
      const idx = list.findIndex(i => i.id === item.id)
      if (idx === -1) return [...list, item]
      const next = [...list]
      next[idx] = { ...next[idx], qty: next[idx].qty + item.qty }
      return next
    })
  }

  remove(id: string) {
    this._items.update(list => list.filter(i => i.id !== id))
  }
}
```

### NgRx（Redux 风格，企业级首选）

```bash
pnpm add @ngrx/store @ngrx/effects @ngrx/entity
```

```ts
// state/counter.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store'

export const CounterActions = createActionGroup({
  source: 'Counter',
  events: {
    Increment: emptyProps(),
    Decrement: emptyProps(),
    Set: props<{ value: number }>(),
  },
})
```

```ts
// state/counter.reducer.ts
import { createReducer, on } from '@ngrx/store'
import { CounterActions } from './counter.actions'

export interface CounterState { count: number }

export const initialState: CounterState = { count: 0 }

export const counterReducer = createReducer(
  initialState,
  on(CounterActions.increment, s => ({ ...s, count: s.count + 1 })),
  on(CounterActions.decrement, s => ({ ...s, count: s.count - 1 })),
  on(CounterActions.set, (s, { value }) => ({ ...s, count: value })),
)
```

```ts
// state/counter.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store'
import { CounterState } from './counter.reducer'

export const selectCounter = createFeatureSelector<CounterState>('counter')
export const selectCount = createSelector(selectCounter, s => s.count)
```

```ts
// app.config.ts
import { provideStore } from '@ngrx/store'
import { provideEffects } from '@ngrx/effects'
import { counterReducer } from './state/counter.reducer'

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({ counter: counterReducer }),
    provideEffects(),
  ],
}
```

```ts
// 组件使用
import { Store } from '@ngrx/store'
import { toSignal } from '@angular/core/rxjs-interop'
import { selectCount } from './state/counter.selectors'
import { CounterActions } from './state/counter.actions'

@Component({ /* ... */ })
export class CounterView {
  private store = inject(Store)

  count = toSignal(this.store.select(selectCount), { initialValue: 0 })

  inc() { this.store.dispatch(CounterActions.increment()) }
  dec() { this.store.dispatch(CounterActions.decrement()) }
}
```

### NgRx Signals（新 API）

NgRx Signal Store 完全基于 Signal，无 Action / Reducer 的开销：

```bash
pnpm add @ngrx/signals
```

```ts
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals'
import { computed } from '@angular/core'

export const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0 }),
  withComputed(({ count }) => ({
    doubled: computed(() => count() * 2),
  })),
  withMethods(store => ({
    increment: () => patchState(store, { count: store.count() + 1 }),
    reset: () => patchState(store, { count: 0 }),
  })),
)
```

```ts
// 组件
@Component({ /* ... */ })
export class Cmp {
  store = inject(CounterStore)
  // store.count(), store.doubled(), store.increment()
}
```

### Component Store（NgRx 局部状态）

```bash
pnpm add @ngrx/component-store
```

```ts
import { ComponentStore } from '@ngrx/component-store'
import { Injectable } from '@angular/core'

interface SearchState {
  query: string
  results: User[]
  loading: boolean
}

@Injectable()
export class SearchStore extends ComponentStore<SearchState> {
  constructor() {
    super({ query: '', results: [], loading: false })
  }

  readonly query$ = this.select(s => s.query)
  readonly results$ = this.select(s => s.results)

  readonly setQuery = this.updater((s, query: string) => ({ ...s, query }))

  readonly search = this.effect((query$: Observable<string>) =>
    query$.pipe(
      debounceTime(300),
      switchMap(q =>
        this.api.search(q).pipe(
          tapResponse(
            results => this.patchState({ results, loading: false }),
            err => console.error(err),
          ),
        ),
      ),
    ))
}
```

适合一次性的页面级 store（不需要全局）。

## 国际化（i18n）

### 官方 `@angular/localize`

```bash
ng add @angular/localize
```

```html
<!-- 标记可翻译文本 -->
<h1 i18n>Welcome</h1>
<p i18n="@@homeWelcomeMessage">Welcome to Angular!</p>
<button i18n-aria-label aria-label="Close">×</button>

<!-- 插值 -->
<p i18n>Hello, {{ user.name }}!</p>

<!-- ICU 复数 / 选择 -->
<p i18n>
  { count, plural,
    =0 {no items}
    =1 {1 item}
    other {{{ count }} items}
  }
</p>
```

```bash
# 抽取消息 → src/locale/messages.xlf
ng extract-i18n

# 翻译副本（手动维护）
# src/locale/messages.fr.xlf
# src/locale/messages.zh-CN.xlf
```

`angular.json` 配置：

```json
"i18n": {
  "sourceLocale": "en-US",
  "locales": {
    "fr": "src/locale/messages.fr.xlf",
    "zh-CN": "src/locale/messages.zh-CN.xlf"
  }
}
```

构建：

```bash
ng build --localize       # 生成 dist/{en-US,fr,zh-CN}/
```

### `transloco` / `ngx-translate`（社区方案）

```bash
pnpm add @ngneat/transloco
```

```ts
// app.config.ts
import { provideTransloco } from '@ngneat/transloco'

provideTransloco({
  config: {
    availableLangs: ['en', 'zh'],
    defaultLang: 'en',
  },
  loader: TranslocoHttpLoader,
})
```

```html
<h1>{{ 'home.title' | transloco }}</h1>
<p>{{ 'greeting' | transloco:{ name: user.name } }}</p>
```

适合需要**运行时切换语言**的应用（官方 `@angular/localize` 在每个 locale 上构建独立 bundle）。

## 测试

### Karma + Jasmine（默认 v15-）

::: warning Karma 已 deprecated
Karma 自 2023 年起官方建议迁移到 Web Test Runner / Vitest / Jest。新项目（v17+）`ng new` 默认仍是 Karma + Jasmine，但官方计划在未来版本中切换默认 runner。
:::

```ts
// counter.spec.ts
import { TestBed } from '@angular/core/testing'
import { Counter } from './counter'

describe('Counter', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Counter],
    }).compileComponents()
  })

  it('renders count', () => {
    const fixture = TestBed.createComponent(Counter)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Count: 0')
  })

  it('increments on click', () => {
    const fixture = TestBed.createComponent(Counter)
    fixture.detectChanges()
    const btn = fixture.nativeElement.querySelector('button')
    btn.click()
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Count: 1')
  })
})
```

### Jest（社区主流）

```bash
ng add jest-preset-angular
# 或自行集成
```

API 与 Jasmine 几乎一致，只是 `describe` / `it` 换成 Jest 全局，且不需要浏览器。

### Vitest（v17+ experimental）

```bash
pnpm add -D vitest @analogjs/vite-plugin-angular jsdom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import angular from '@analogjs/vite-plugin-angular'

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
  },
})
```

Vitest 速度比 Karma 快 5-10x，已被很多新项目（包括 Analog 框架）采纳。

### Cypress E2E

```bash
ng add @cypress/schematic
```

```ts
// cypress/e2e/home.cy.ts
describe('Home', () => {
  it('shows welcome', () => {
    cy.visit('/')
    cy.contains('Welcome')
    cy.get('button').contains('+1').click()
    cy.contains('Count: 1')
  })
})
```

### Playwright Component Testing

```bash
pnpm add -D @playwright/test @playwright/experimental-ct-vue
# Angular CT 在 Playwright 1.40+ 可用，但仍 experimental
```

## TypeScript 强类型

### 泛型组件

```ts
import { Component, input } from '@angular/core'

@Component({
  selector: 'app-list',
  template: `
    @for (item of items(); track $index) {
      <p>{{ render(item) }}</p>
    }
  `,
})
export class ListComponent<T> {
  items = input.required<T[]>()
  render = input.required<(item: T) => string>()
}
```

```html
<!-- 父组件 -->
<app-list [items]="users" [render]="renderUser" />
```

类型推断：当 `items` 是 `User[]`，模板里 `item` 自动是 `User`，无需 `as` 断言。

### `inject()` 中的泛型

```ts
class StateService<T> {
  private state = signal<T | null>(null)
  // ...
}

// 注入泛型服务
const userState = inject(StateService<User>)   // TS 5+ 支持
```

### Strict Templates

`tsconfig.json` 中：

```json
{
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInputAccessModifiers": true,
    "strictDomEventTypes": true,
    "strictNullInputTypes": true,
    "strictAttributeTypes": true,
    "strictOutputEventTypes": true
  }
}
```

启用后，模板里 `[disabled]="form.invalid"` 也接受完整类型检查；事件处理器中 `$event` 类型自动推断。

### 类型化路由（`@angular/router` v17+）

```ts
import { Routes } from '@angular/router'

interface UserData {
  permissions: string[]
}

export const routes: Routes = [
  {
    path: 'users/:id',
    data: { permissions: ['user.read'] } as UserData,
    loadComponent: () => import('./pages/user').then(m => m.User),
  },
]
```

## 一份能跑的进阶示例

```ts
// services/posts.ts
import { Injectable, computed, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { toSignal } from '@angular/core/rxjs-interop'

interface Post { id: number; title: string; body: string }

@Injectable({ providedIn: 'root' })
export class PostsService {
  private http = inject(HttpClient)

  private _refreshTick = signal(0)
  refresh() { this._refreshTick.update(n => n + 1) }

  // 用 toSignal 把 HTTP 请求转 signal
  posts = toSignal(
    this.http.get<Post[]>('/api/posts'),
    { initialValue: [] },
  )
}
```

```ts
// pages/posts.ts
import { Component, inject } from '@angular/core'
import { PostsService } from '../services/posts'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-posts',
  imports: [RouterLink],
  template: `
    <h1>Posts ({{ posts.posts().length }})</h1>
    <button (click)="posts.refresh()">Refresh</button>

    @for (post of posts.posts(); track post.id) {
      <article>
        <h2>
          <a [routerLink]="['/posts', post.id]">{{ post.title }}</a>
        </h2>
        <p>{{ post.body }}</p>
      </article>
    } @empty {
      <p>No posts</p>
    }
  `,
})
export class Posts {
  posts = inject(PostsService)
}
```

```ts
// app.config.ts（完整）
import { ApplicationConfig } from '@angular/core'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { authInterceptor } from './interceptors/auth'
import { errorInterceptor } from './interceptors/error'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
  ],
}
```

## 下一步

- Signals 内部 / Zoneless / SSR / 编译器 / 性能详见 [指南 - 高级](./expert.md)
- 生态集成（Material / Tailwind / Nx / Ionic）详见 [指南 - 其他](./other.md)
- 完整 API 速查见 [参考](../reference.md)
