---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Angular 21.x 编写 —— 全局 API、装饰器、Signals、内置控制流、内置 pipes / 指令、DI、HTTP、Router、Forms、测试、TypeScript 工具类型、CLI、版本里程碑

## 全局 API

### 应用启动

| API | 签名 | 用途 |
|-----|------|------|
| `bootstrapApplication(root, config?)` | `(Component, ApplicationConfig?) => Promise<ApplicationRef>` | 启动 standalone 应用 |
| `platformBrowser(extraProviders?)` | `Provider[]? => PlatformRef` | 浏览器平台（standalone 启动） |
| `platformBrowserDynamic(extraProviders?)` | `Provider[]? => PlatformRef` | JIT 启动（旧 NgModule，用于 SSR / 老项目） |
| `mergeApplicationConfig(...)` | `(ApplicationConfig[]) => ApplicationConfig` | 合并多个配置 |
| `provideZonelessChangeDetection()` | `() => EnvironmentProviders` | 启用 Zoneless（v21+ 默认） |
| `provideExperimentalCheckNoChangesForDebug()` | `() => EnvironmentProviders` | 开发调试：检查异步更新 |

```ts
import { bootstrapApplication } from '@angular/platform-browser'

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
})
```

### General

| API | 用途 |
|-----|------|
| `VERSION` | Angular 版本（`{ full: '21.x.x', major: '21', ... }`） |
| `enableProdMode()` | 切到生产模式（关掉 dev 检查） |
| `isDevMode()` | 是否 dev 模式 |
| `assertInInjectionContext(fn)` | 断言在 injection context 内 |
| `runInInjectionContext(injector, fn)` | 在指定 injector 内运行 |
| `inject(token, options?)` | 注入 token |
| `Injector.create({ providers })` | 创建自定义 injector |

```ts
import { runInInjectionContext, Injector, inject } from '@angular/core'

runInInjectionContext(injector, () => {
  const svc = inject(MyService)
})
```

## 装饰器

### `@Component`

```ts
@Component({
  selector: 'app-foo',         // string
  template: '...' | templateUrl: 'foo.html',
  styles: '...' | styleUrl: 'foo.scss' | styleUrls: ['foo.scss'],
  imports: [],                 // Standalone 组件 / 指令 / 管道
  providers: [],               // 组件级 DI
  host: {                      // 宿主元素绑定
    '[class.active]': 'isActive()',
    '(click)': 'handleClick($event)',
    'role': 'button',          // 静态属性
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: [],              // 旧动画 API
  // standalone: true,         // v17+ 默认，无需写
})
class Foo {}
```

### `@Directive`

```ts
@Directive({
  selector: '[appHighlight]',
  host: { ... },
  providers: [],
  exportAs: 'highlight',       // 模板里 #ref="highlight" 引用
})
class Highlight {}
```

### `@Pipe`

```ts
@Pipe({
  name: 'truncate',
  pure: true,                  // 默认 true（推荐）
})
class Truncate implements PipeTransform { /* ... */ }
```

### `@Injectable`

```ts
@Injectable({
  providedIn: 'root' | 'platform' | 'any' | null,
  useFactory: () => new XService(),
  useClass: MockX,
})
class XService {}
```

### `@Input` / `@Output` / `@HostBinding` / `@HostListener`（旧 API）

```ts
@Component({ /* ... */ })
class Old {
  @Input() name: string = ''
  @Input({ required: true }) id!: string
  @Input({ transform: booleanAttribute }) disabled = false
  @Input({ alias: 'displayName' }) internalName = ''

  @Output() saved = new EventEmitter<string>()

  @HostBinding('class.active') get active() { return this.id !== '' }
  @HostListener('click', ['$event']) onClick(e: Event) { /* ... */ }
}
```

新代码推荐用 `input()` / `output()` + `host` 字段，更类型友好。

### `@ViewChild` / `@ViewChildren` / `@ContentChild` / `@ContentChildren`（旧 API）

```ts
class Cmp {
  @ViewChild('search') searchEl?: ElementRef<HTMLInputElement>
  @ViewChild(ChildCmp) child?: ChildCmp
  @ViewChildren(ChildCmp) children!: QueryList<ChildCmp>

  @ContentChild(SlotCmp) slot?: SlotCmp
  @ContentChildren(SlotCmp) slots!: QueryList<SlotCmp>
}
```

新代码用 `viewChild()` / `viewChildren()` / `contentChild()` / `contentChildren()` signal-based。

## Signals API

`@angular/core` 导出：

| API | 签名 | 用途 |
|-----|------|------|
| `signal<T>(initial, options?)` | `T, CreateSignalOptions<T>? => WritableSignal<T>` | 可写信号 |
| `computed<T>(fn, options?)` | `() => T, CreateComputedOptions<T>? => Signal<T>` | 派生只读 |
| `effect(fn, options?)` | `EffectFn, CreateEffectOptions? => EffectRef` | 副作用 |
| `untracked<T>(fn)` | `() => T => T` | 不追踪依赖读取 |
| `linkedSignal<T>(fn \| options)` | `(() => T) \| LinkedSignalOptions<S, T> => WritableSignal<T>` | 跟随其它 signal 但可手动覆盖 |
| `resource<T>(options)` | `ResourceOptions<T, R> => ResourceRef<T>` | 异步资源（experimental） |
| `isSignal(value)` | `unknown => boolean` | 判断是否 Signal |
| `Signal<T>` | type | 只读 Signal 类型 |
| `WritableSignal<T>` | type | 可写 Signal 类型 |

```ts
import { signal, computed, effect, untracked, linkedSignal } from '@angular/core'

const count = signal(0, { equal: (a, b) => a === b })

const doubled = computed(() => count() * 2)

effect((onCleanup) => {
  console.log(count())
  onCleanup(() => console.log('cleanup'))
})

const safe = untracked(count)   // 读但不依赖

const selected = linkedSignal(() => firstOf(items()))
```

### 输入输出 / 双向 Signal

| API | 用途 |
|-----|------|
| `input<T>(default?, options?)` | 创建只读输入 signal |
| `input.required<T>(options?)` | 创建必填输入 signal |
| `output<T>()` | 创建事件输出（替代 EventEmitter） |
| `model<T>(default?, options?)` | 创建双向绑定 signal |
| `model.required<T>(options?)` | 创建必填双向 signal |

```ts
import { input, output, model } from '@angular/core'

class Cmp {
  label = input.required<string>()
  size = input(10)
  disabled = input(false, { transform: booleanAttribute })

  saved = output<string>()

  value = model('')
}
```

### 查询 Signal

| API | 用途 |
|-----|------|
| `viewChild<T>(locator, options?)` | 子元素 / 子组件单查询 |
| `viewChild.required<T>(locator, options?)` | 必填单查询 |
| `viewChildren<T>(locator, options?)` | 子元素 / 子组件多查询 |
| `contentChild<T>(locator, options?)` | 投影内容单查询 |
| `contentChild.required<T>(locator, options?)` | 必填投影内容单查询 |
| `contentChildren<T>(locator, options?)` | 投影内容多查询 |

```ts
class Cmp {
  search = viewChild<ElementRef<HTMLInputElement>>('search')
  searchReq = viewChild.required<ElementRef<HTMLInputElement>>('search')
  buttons = viewChildren<ElementRef<HTMLButtonElement>>('btn')

  // read option
  tmpl = viewChild('tpl', { read: TemplateRef })
}
```

### RxJS Interop

`@angular/core/rxjs-interop`：

| API | 用途 |
|-----|------|
| `toSignal<T>(source$, options?)` | Observable → Signal |
| `toObservable<T>(signal)` | Signal → Observable |
| `takeUntilDestroyed(destroyRef?)` | RxJS 操作符：组件销毁时 unsubscribe |
| `outputFromObservable<T>(obs$, options?)` | Observable → output |
| `outputToObservable<T>(out)` | output → Observable |
| `rxResource<T>(options)` | Observable 版 resource |

```ts
import { toSignal, toObservable, takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop'

class Cmp {
  user$ = this.api.getMe()
  user = toSignal(this.user$, { initialValue: null })

  count = signal(0)
  count$ = toObservable(this.count)

  constructor() {
    interval(1000).pipe(takeUntilDestroyed()).subscribe()
  }

  userResource = rxResource({
    params: () => ({ id: this.userId() }),
    stream: ({ params }) => this.api.user$(params.id),
  })
}
```

## 模板控制流（v17+）

| 块 | 用途 |
|----|------|
| `@if (cond) { ... } @else if (...) { ... } @else { ... }` | 条件 |
| `@if (cond; as alias) { ... }` | 条件 + 别名 |
| `@for (item of items; track key) { ... } @empty { ... }` | 列表 |
| `@switch (val) { @case (a) { ... } @case (b) { ... } @default { ... } }` | 切换 |
| `@defer (trigger) { ... } @placeholder { ... } @loading { ... } @error { ... }` | 延迟加载 |
| `@let var = expr` | 模板局部变量（v18+） |

### `@for` 上下文变量

`$index` / `$count` / `$first` / `$last` / `$even` / `$odd`

### `@defer` 触发器

| 触发器 | 含义 |
|--------|------|
| `on idle` | requestIdleCallback |
| `on viewport` | IntersectionObserver |
| `on viewport(myRef)` | 指定元素 |
| `on interaction` | 用户交互（click / keydown） |
| `on hover` | mouseenter / focusin |
| `on immediate` | 渲染后立即 |
| `on timer(500ms)` | setTimeout |
| `when condition` | 表达式真值 |
| `prefetch on idle` | 预下载（不渲染） |
| `hydrate on viewport` | 增量水合触发器（v19+） |

`@placeholder (minimum 500ms)` / `@loading (after 100ms; minimum 1s)` / `@error` 子块。

## 内置 Pipes（`@angular/common`）

| Pipe | 签名 |
|------|------|
| `async` | `Observable<T> \| Promise<T> => T \| null` |
| `date` | `Date \| number \| string, format?, timezone?, locale?` |
| `currency` | `number, code?, display?, digits?, locale?` |
| `decimal` (`number`) | `number, digits?, locale?` |
| `percent` | `number, digits?, locale?` |
| `json` | `any => string` |
| `keyvalue` | `Object \| Map => { key, value }[]` |
| `slice` | `T[] \| string, start, end?` |
| `uppercase` | `string => string` |
| `lowercase` | `string => string` |
| `titlecase` | `string => string` |
| `i18nPlural` | `number, mapping, locale?` |
| `i18nSelect` | `string, mapping` |

例子（模板）：

```html
<p>{{ user$ | async }}</p>
<p>{{ d | date:'yyyy-MM-dd HH:mm' }}</p>
<p>{{ p | currency:'USD':'symbol':'1.2-2' }}</p>
<p>{{ x | number:'1.0-2' }}</p>
<p>{{ r | percent:'1.0-2' }}</p>
<pre>{{ obj | json }}</pre>
<p>{{ list | slice:0:5 }}</p>
<p>{{ s | uppercase }}</p>
@for (kv of obj | keyvalue; track kv.key) {
  <p>{{ kv.key }}: {{ kv.value }}</p>
}
```

### Date 格式串

| Pattern | 例子 | 输出 |
|---------|------|------|
| `yyyy` | 年 4 位 | `2026` |
| `MM` | 月 2 位 | `05` |
| `dd` | 日 2 位 | `16` |
| `HH` | 时 24h | `09` |
| `hh` | 时 12h | `09` |
| `mm` | 分 | `30` |
| `ss` | 秒 | `45` |
| `EEEE` | 星期全称 | `Saturday` |
| `MMM` | 月简称 | `May` |

预设：`'short'` / `'medium'` / `'long'` / `'full'` / `'shortDate'` / `'mediumTime'` 等。

## 内置指令（`@angular/common`）

### 标准属性指令

| 指令 | 用途 |
|------|------|
| `NgClass` | 动态 class（旧）`[ngClass]="..."` |
| `NgStyle` | 动态 style（旧）`[ngStyle]="..."` |
| `NgOptimizedImage` | 图像优化（v15+）`<img ngSrc="...">` |
| `NgComponentOutlet` | 动态组件 `<ng-container *ngComponentOutlet="cmp" />` |
| `NgPlural` / `NgPluralCase` | 复数（旧） |
| `NgTemplateOutlet` | 模板渲染 `<ng-container *ngTemplateOutlet="tpl" />` |

### 旧结构指令（仍兼容）

| 指令 | 替代品 |
|------|--------|
| `NgIf` (`*ngIf`) | `@if` |
| `NgFor` (`*ngFor`) | `@for ... track` |
| `NgSwitch` / `NgSwitchCase` / `NgSwitchDefault` | `@switch / @case / @default` |

```ts
// 一次性导入所有
import { CommonModule } from '@angular/common'
// 或独立 standalone 指令
import { NgIf, NgFor, NgClass, NgStyle, AsyncPipe } from '@angular/common'
```

### `NgOptimizedImage`

```html
<img
  ngSrc="https://example.com/photo.webp"
  alt="Photo"
  width="800"
  height="600"
  priority             [外接 LCP 用 priority]
  loading="lazy"       [其余 lazy]
/>
```

自动生成 `srcset` / `sizes`，要求显式 `width` / `height` 防止 CLS。

## DI API

`@angular/core` 中：

| API | 用途 |
|-----|------|
| `inject<T>(token, options?)` | 函数式注入 |
| `InjectionToken<T>(desc, options?)` | 创建注入 token |
| `Injector` | DI 容器接口 |
| `Injectable` | 类装饰器 |
| `Inject` | 旧装饰器（已淡出） |
| `Optional` / `Self` / `SkipSelf` / `Host` | 旧 modifier 装饰器（已淡出） |
| `EnvironmentInjector` | 环境级 injector |
| `runInInjectionContext(injector, fn)` | 自定义 context 运行 |
| `makeEnvironmentProviders([...])` | 包装 providers 为 EnvironmentProviders |
| `Provider` | type union |

### Provider 配置类型

```ts
type Provider =
  | Type<T>                                                      // 简写：useClass
  | { provide: any, useClass: Type<T>, multi?: boolean }
  | { provide: any, useValue: T, multi?: boolean }
  | { provide: any, useFactory: () => T, deps?: any[], multi?: boolean }
  | { provide: any, useExisting: any, multi?: boolean }
  | EnvironmentProviders                                         // provideXxx 返回
```

### `inject()` 选项

```ts
inject(MyService, {
  optional: true,   // 找不到返回 null
  self: true,       // 仅当前 injector
  skipSelf: true,   // 跳过当前
  host: true,       // 仅 host
})
```

## HTTP API（`@angular/common/http`）

### Provider

| API | 用途 |
|-----|------|
| `provideHttpClient(...features)` | 注册 HttpClient |
| `withFetch()` | 用 fetch API 代替 XHR |
| `withInterceptors([fns])` | 函数式拦截器 |
| `withInterceptorsFromDi()` | DI-based 拦截器（旧） |
| `withXsrfConfiguration({...})` | XSRF 配置 |
| `withRequestsMadeViaParent()` | 复用父 injector 的 HttpClient |
| `withJsonpSupport()` | 启用 JSONP |
| `withNoXsrfProtection()` | 禁用 XSRF |

```ts
provideHttpClient(
  withFetch(),
  withInterceptors([authInterceptor, errorInterceptor]),
  withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
)
```

### `HttpClient`

| 方法 | 用途 |
|------|------|
| `get<T>(url, options?)` | GET |
| `post<T>(url, body?, options?)` | POST |
| `put<T>(url, body, options?)` | PUT |
| `patch<T>(url, body, options?)` | PATCH |
| `delete<T>(url, options?)` | DELETE |
| `head<T>(url, options?)` | HEAD |
| `options<T>(url, options?)` | OPTIONS |
| `request<T>(method, url, options?)` | 通用 |

请求选项：

```ts
{
  headers?: HttpHeaders | { [k: string]: string | string[] }
  params?: HttpParams | { [k: string]: string | number | boolean }
  observe?: 'body' | 'events' | 'response'
  reportProgress?: boolean
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
  withCredentials?: boolean
  context?: HttpContext
  transferCache?: boolean | { includeHeaders: string[] }
}
```

### `httpResource`（v19 experimental）

```ts
import { httpResource } from '@angular/common/http'

user = httpResource<User>(() => `/api/users/${this.id()}`)
user = httpResource<User>(() => ({
  url: `/api/users/${this.id()}`,
  method: 'GET',
  headers: { /* ... */ },
  params: { /* ... */ },
}))
```

## Router API（`@angular/router`）

### Provider

| API | 用途 |
|-----|------|
| `provideRouter(routes, ...features)` | 注册路由（v15+） |
| `withComponentInputBinding()` | 路由参数自动绑定 input |
| `withViewTransitions()` | View Transitions API |
| `withPreloading(strategy)` | 预加载策略 |
| `withDebugTracing()` | 开发调试 |
| `withRouterConfig({...})` | 通用配置 |
| `withInMemoryScrolling({...})` | 滚动恢复 |
| `withEnabledBlockingInitialNavigation()` | 阻塞首次导航 |
| `withDisabledInitialNavigation()` | 禁用首次导航 |
| `withHashLocation()` | hash 模式 |
| `withNavigationErrorHandler(fn)` | 错误处理 |

```ts
provideRouter(
  routes,
  withComponentInputBinding(),
  withViewTransitions(),
  withPreloading(PreloadAllModules),
  withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
)
```

### Route 配置

```ts
interface Route {
  path?: string
  matcher?: UrlMatcher
  pathMatch?: 'full' | 'prefix'
  redirectTo?: string

  // 组件
  component?: Type<unknown>
  loadComponent?: () => Promise<Type<unknown>>
  children?: Routes
  loadChildren?: () => Promise<Routes>

  // 守卫
  canActivate?: CanActivateFn[]
  canActivateChild?: CanActivateChildFn[]
  canDeactivate?: CanDeactivateFn<unknown>[]
  canMatch?: CanMatchFn[]
  canLoad?: CanLoadFn[]      // 已弃用，用 canMatch

  // 数据
  resolve?: { [key: string]: ResolveFn<unknown> }
  data?: any
  title?: string | Type<Resolve<string>> | ResolveFn<string>

  // 其它
  outlet?: string             // secondary outlet 名
  providers?: Provider[]      // 路由级 DI
  runGuardsAndResolvers?: 'paramsChange' | 'paramsOrQueryParamsChange' | 'always' | ...
}
```

### Router 服务

| 方法 / 属性 | 用途 |
|------------|------|
| `router.navigate(commands, extras?)` | 编程导航 |
| `router.navigateByUrl(url, extras?)` | URL 字符串导航 |
| `router.createUrlTree(commands, extras?)` | 创建 UrlTree（在守卫中返回） |
| `router.url` | 当前 URL |
| `router.events` | NavigationStart / End / Cancel / Error 流 |
| `router.routerState` | 当前路由状态树 |

### `ActivatedRoute`

| 属性 | 用途 |
|-----|------|
| `snapshot.paramMap` / `snapshot.queryParamMap` | 同步快照 |
| `paramMap` (`Observable`) | 路径参数流 |
| `queryParamMap` | 查询参数流 |
| `data` | 静态 data + resolved data |
| `url` | URL segments 流 |
| `fragment` | URL fragment 流 |
| `parent` / `firstChild` / `root` | 路由树导航 |

### 路由指令

| 指令 | 用途 |
|------|------|
| `<router-outlet />` | 占位符 |
| `<router-outlet name="x" />` | secondary outlet |
| `[routerLink]` | 导航链接 |
| `[routerLinkActive]` | 激活样式 |
| `[routerLinkActiveOptions]` | 精确匹配 |
| `(activate)` / `(deactivate)` | outlet 事件 |

## Forms API（`@angular/forms`）

### Reactive Forms

| 类 | 用途 |
|----|------|
| `FormControl<T>` | 单个控件 |
| `FormGroup<T>` | 表单组 |
| `FormArray<T>` | 表单数组 |
| `FormRecord<T>` | 动态键 group |
| `FormBuilder` | 工厂 |
| `NonNullableFormBuilder` | 非空工厂（`fb.nonNullable`） |

```ts
const ctrl = new FormControl<string | null>('', {
  validators: Validators.required,
  asyncValidators: [],
  updateOn: 'change' | 'blur' | 'submit',
  nonNullable: true,
})

const grp = new FormGroup({
  name: new FormControl(''),
  age: new FormControl(0),
})

const arr = new FormArray([
  new FormControl(''),
  new FormControl(''),
])
```

### `FormBuilder` 简写

```ts
const fb = inject(FormBuilder)
const form = fb.nonNullable.group({
  name: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  hobbies: fb.nonNullable.array<string>([]),
  address: fb.nonNullable.group({
    city: '',
    zip: '',
  }),
})
```

### `Validators` 内置

| 验证器 | 用途 |
|--------|------|
| `Validators.required` | 必填 |
| `Validators.requiredTrue` | 必为 true（同意条款） |
| `Validators.email` | 邮箱格式 |
| `Validators.min(n)` / `max(n)` | 数值范围 |
| `Validators.minLength(n)` / `maxLength(n)` | 字符长度 |
| `Validators.pattern(re)` | 正则 |
| `Validators.nullValidator` | 占位（无效） |
| `Validators.compose([...])` | 组合 |

### 状态

```ts
control.value                // T
control.valid / invalid
control.pending              // 异步验证中
control.disabled / enabled
control.dirty / pristine     // 是否用户修改过
control.touched / untouched  // 是否聚焦过
control.errors               // ValidationErrors | null
control.statusChanges        // Observable
control.valueChanges         // Observable<T>

control.setValue(...)        // 必须包含全部字段（group）
control.patchValue(...)      // 部分更新
control.reset(...)
control.markAsTouched()
control.markAsDirty()
control.disable()
control.enable()
```

### Template-driven 指令

```ts
import { FormsModule } from '@angular/forms'
```

| 指令 | 用途 |
|------|------|
| `NgForm` | `<form>` 自动绑定 |
| `NgModel` | `[(ngModel)]` 双向 |
| `NgModelGroup` | 嵌套组 |

```html
<form #f="ngForm" (ngSubmit)="onSubmit(f)">
  <input name="email" [(ngModel)]="email" required email />
</form>
```

### Reactive 指令

```ts
import { ReactiveFormsModule } from '@angular/forms'
```

| 指令 | 用途 |
|------|------|
| `[formGroup]` | 绑定 FormGroup |
| `formControlName` | 绑定子控件 |
| `[formControl]` | 直接绑 FormControl |
| `formGroupName` / `formArrayName` | 嵌套 |

```html
<form [formGroup]="form" (ngSubmit)="save()">
  <input formControlName="name" />
  <div formGroupName="address">
    <input formControlName="city" />
  </div>
</form>
```

## 测试 API（`@angular/core/testing`）

| API | 用途 |
|-----|------|
| `TestBed.configureTestingModule({...})` | 配置测试模块 |
| `TestBed.createComponent(Type)` | 创建组件 fixture |
| `TestBed.inject(token)` | 注入 |
| `TestBed.overrideComponent(Type, override)` | 覆盖 |
| `TestBed.runInInjectionContext(fn)` | 在 TestBed 内运行 |
| `ComponentFixture<T>` | 组件 fixture |
| `fixture.detectChanges()` | 触发 CD |
| `fixture.whenStable()` | 等异步稳定 |
| `fixture.componentInstance` | 组件实例 |
| `fixture.nativeElement` | DOM 元素 |
| `fixture.debugElement` | DebugElement（querying） |
| `fakeAsync(fn)` | 包裹同步化异步 |
| `tick(ms?)` | 模拟时间推进 |
| `flushMicrotasks()` | 跑完 microtask |
| `flush()` | 跑完所有定时器 |
| `waitForAsync(fn)` | 旧 async wrapper |

### Harness（`@angular/cdk/testing`）

| API | 用途 |
|-----|------|
| `TestbedHarnessEnvironment.loader(fixture)` | 创建 loader |
| `loader.getHarness(HarnessClass)` | 获取 harness |
| `loader.getAllHarnesses(HarnessClass)` | 获取多个 |

## TypeScript 工具类型

`@angular/core` 导出：

| 类型 | 用途 |
|------|------|
| `Signal<T>` | 只读 Signal |
| `WritableSignal<T>` | 可写 Signal |
| `InputSignal<T>` | input() 返回值 |
| `InputSignalWithTransform<T, TransformT>` | input() with transform |
| `OutputEmitterRef<T>` | output() 返回值 |
| `ModelSignal<T>` | model() 返回值 |
| `Type<T>` | 构造函数类型 |
| `Provider` | provider 类型 union |
| `EnvironmentProviders` | provideXxx 返回 |
| `Signal<T>` | 只读信号 |
| `Observable<T>` (RxJS) | 用得最多 |

```ts
import { Signal, WritableSignal, InputSignal, ModelSignal, Type } from '@angular/core'

class Component<T> {
  count: WritableSignal<number>
  doubled: Signal<number>
  label: InputSignal<string>
  value: ModelSignal<T>
}
```

## Angular CLI 命令完整表

### 工作空间命令

| 命令 | 简写 | 说明 |
|------|------|------|
| `ng new <name>` | - | 创建工作空间 |
| `ng version` | `ng v` | 版本信息 |
| `ng config <key> <value>` | - | 读写 angular.json |
| `ng analytics on/off/prompt/info` | - | 遥测 |
| `ng cache enable/disable/clean/info` | - | 缓存管理 |

### 项目命令

| 命令 | 简写 | 说明 |
|------|------|------|
| `ng serve [project]` | `ng s`, `ng dev` | 启动开发服务器 |
| `ng build [project]` | `ng b` | 构建 |
| `ng test [project]` | `ng t` | 运行单测 |
| `ng e2e [project]` | `ng e` | 跑 E2E |
| `ng lint [project]` | - | 跑 lint（需 @angular-eslint） |
| `ng deploy [project]` | - | 部署（需 schematic） |
| `ng extract-i18n` | - | 抽取 i18n 消息 |

### 生成命令

| 命令 | 简写 | 说明 |
|------|------|------|
| `ng generate application <name>` | `ng g app` | 新应用 |
| `ng generate library <name>` | `ng g lib` | 新库 |
| `ng generate component <name>` | `ng g c` | 组件 |
| `ng generate service <name>` | `ng g s` | 服务 |
| `ng generate directive <name>` | `ng g d` | 指令 |
| `ng generate pipe <name>` | `ng g p` | 管道 |
| `ng generate guard <name>` | `ng g g` | 守卫 |
| `ng generate interceptor <name>` | `ng g i` | 拦截器 |
| `ng generate resolver <name>` | `ng g r` | resolver |
| `ng generate enum <name>` | - | 枚举 |
| `ng generate interface <name>` | - | 接口 |
| `ng generate class <name>` | - | 类 |
| `ng generate module <name>` | `ng g m` | NgModule（旧风格） |

### 升级 / 集成

| 命令 | 说明 |
|------|------|
| `ng add <package>` | 安装并自动配置 schematic |
| `ng update` | 列出可升级依赖 |
| `ng update @angular/core @angular/cli` | 升级核心 + 自动迁移 |
| `ng update --create-commits` | 每个迁移单独 commit |
| `ng update --allow-dirty` | 工作树不干净也升级 |

### 关键标志

`ng serve`：

- `--port=4200` 端口
- `--host=0.0.0.0` 监听地址
- `--ssl` HTTPS
- `--open` 打开浏览器
- `--hmr` 热更新（默认开）
- `--configuration=production` 用生产配置

`ng build`：

- `--configuration=production / development`
- `--output-path=dist/foo`
- `--source-map` 输出 sourcemap
- `--stats-json` 输出 bundle 分析
- `--watch` 监听
- `--localize` 多语言构建

`ng generate component`：

- `--standalone=true / false`
- `--inline-template`
- `--inline-style`
- `--style=scss / sass / less / css / none`
- `--change-detection=Default / OnPush`
- `--skip-tests`
- `--export` 加到 NgModule exports（旧）

## 版本里程碑

| 版本 | 发布 | 关键变化 |
|------|------|---------|
| **2** | 2016.9 | 完全重写 TS / Component / DI |
| **4** | 2017.3 | 跳过 v3（路由包对齐），新 Router |
| **5** | 2017.11 | Build Optimizer, ServiceWorker, i18n pipes |
| **6** | 2018.5 | Angular Elements, CLI workspaces, RxJS 6 |
| **7** | 2018.10 | CDK 虚拟滚动, Drag-Drop |
| **8** | 2019.5 | Differential Loading (ES5/ES2015), Ivy preview |
| **9** | 2020.2 | **Ivy 默认**, 更小 bundle |
| **10** | 2020.6 | Date 范围 picker, 严格模式 |
| **11** | 2020.11 | 自动字体内联, Hot Module Replacement |
| **12** | 2021.5 | Webpack 5, Nullish 在模板, 移除老 View Engine |
| **13** | 2021.11 | IE11 移除, ng add 改进, Angular Package Format |
| **14** | 2022.6 | **Typed Forms**, **standalone preview**, **inject()** |
| **15** | 2022.11 | **standalone 稳定**, `provideRouter` / `provideHttpClient`, `NgOptimizedImage` |
| **16** | 2023.5 | **Signals preview**, `DestroyRef` / `takeUntilDestroyed`, esbuild dev |
| **17** | 2023.11 | **@if / @for / @switch / @defer**, **Signals stable**, **standalone 默认**, esbuild + Vite 默认, 文档站换 angular.dev |
| **18** | 2024.5 | 控制流稳定, **Zoneless 实验**, `@let`, Material 3 |
| **19** | 2024.11 | **linkedSignal 稳定**, **resource 实验**, **httpResource 实验**, **Incremental Hydration 实验** |
| **20** | 2025.5 | **Signal Forms 实验**, **Incremental Hydration 稳定**, **Zoneless 稳定**, 组件文件名简化 |
| **21** | 2026.5 | **Zoneless 默认**, `@angular/build:application` 默认 builder, Signal Forms developer preview |

### 关键 deprecation 时间线

| 特性 | 弃用 | 移除 |
|------|------|------|
| `View Engine`（前 Ivy 渲染器） | v9 | v12 |
| IE 11 | v12 | v13 |
| `@angular/http`（旧 HttpModule） | v8 | v9 |
| `*ngIf` / `*ngFor`（结构指令） | - | 仍兼容（v17 推 `@if` / `@for`） |
| `NgModule` | - | 仍兼容（v17 标 standalone 默认） |
| `EventEmitter`（在 outputs） | - | 仍兼容（推 `output()`） |
| Zone.js | - | v21 默认 Zoneless（但 polyfill 仍存在） |
| `@angular/universal` | v17 | 用 `@angular/ssr` |
| `@angular-devkit/build-angular:browser` (webpack) | v17 | v21 deprecated |

### 升级建议路径

| 起始版本 | 推荐路径 |
|---------|---------|
| v8 / v9 | 先升到 v12，启用 Ivy + 严格模式，再 → v15 → v17 → v21 |
| v10 - v12 | 直升 v15，再 → v17 → v21 |
| v13 - v14 | 直升 v17（享受 standalone + 控制流） |
| v15 - v17 | 直升 v21 |
| v18 - v20 | `ng update` 一步到位 |

## 常见错误码

| 错误码 | 含义 |
|--------|------|
| `NG0100` | ExpressionChangedAfterItHasBeenCheckedError |
| `NG0101` | Circular DI |
| `NG0200` | Circular import |
| `NG0201` | NullInjectorError |
| `NG0203` | inject() 在 injection context 外调用 |
| `NG0300` | Multiple definitions for selector |
| `NG0500` | Hydration mismatch |
| `NG0600` | Cannot write to signals from a `computed` / `effect` |
| `NG0951` | Signal 必传未传 |
| `NG8001` | 模板中未知元素 |
| `NG8002` | 模板中未知属性 |
| `NG2001` | 装饰器找不到 metadata |

## Reference 实用代码片段

### 完整 Signal Store 模板

```ts
import { Injectable, computed, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class Store {
  private state = signal({ items: [] as Item[], loading: false })

  readonly items = computed(() => this.state().items)
  readonly loading = computed(() => this.state().loading)

  load() {
    this.state.update(s => ({ ...s, loading: true }))
    /* fetch */
  }
}
```

### 函数式拦截器模板

```ts
import { HttpInterceptorFn } from '@angular/common/http'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token()
  if (!token) return next(req)
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
}
```

### 函数式守卫模板

```ts
import { CanActivateFn, Router } from '@angular/router'

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)
  const router = inject(Router)
  return auth.isLoggedIn() || router.createUrlTree(['/login'])
}
```

### `httpResource` + signal 模板

```ts
@Component({ /* ... */ })
export class UserView {
  userId = input.required<string>()
  user = httpResource<User>(() => `/api/users/${this.userId()}`)
}
```

```html
@if (user.isLoading()) { <spinner /> }
@if (user.error()) { <p>Error</p> }
@if (user.value(); as data) { <p>{{ data.name }}</p> }
```

### 完整 Standalone 应用入口

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { App } from './app/app'
import { routes } from './app/app.routes'
import { authInterceptor, errorInterceptor } from './app/interceptors'

bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
  ],
})
.catch(err => console.error(err))
```

## 相关资源

- [Angular 官方文档](https://angular.dev/)
- [Angular GitHub](https://github.com/angular/angular)
- [Angular Material](https://material.angular.io/)
- [Angular CDK](https://material.angular.io/cdk/categories)
- [Angular Architects（Module Federation 等）](https://www.angulararchitects.io/)
- [NgRx](https://ngrx.io/)
- [Nx](https://nx.dev/)
- [Update Guide](https://angular.dev/update-guide)（升级指南，自动给出 codemod 列表）
- [Angular DevTools](https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)
