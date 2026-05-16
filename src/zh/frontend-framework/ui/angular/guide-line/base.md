---
layout: doc
outline: [2, 3]
---

# 指南 - 基础

> 基于 Angular 21.x 编写 —— Standalone 组件、模板语法、Signals、表单、生命周期

## 速查

- 组件装饰器：`@Component({ selector, template/templateUrl, styles/styleUrl, imports, host })`
- Signals：`signal` / `computed` / `effect` / `linkedSignal` / `untracked` / `model` / `input` / `output`
- 输入输出：`input()` / `input.required<T>()` / `output<T>()` / `model<T>()`
- 查询：`viewChild()` / `viewChildren()` / `contentChild()` / `contentChildren()`（全部 signal-based）
- 控制流：`@if` / `@for ... track` / `@switch` / `@defer`
- 老结构指令（兼容）：`*ngIf` / `*ngFor` / `*ngSwitch` —— 不推荐新代码用
- 表单：`FormsModule`（template-driven）/ `ReactiveFormsModule`（reactive）/ Signal Forms（experimental）
- 双向绑定：`[(ngModel)]`（FormsModule）/ `[(modelProp)]`（自定义 `model()`）
- 管道：`AsyncPipe` / `DatePipe` / `CurrencyPipe` / `JsonPipe` / `KeyValuePipe` / `SlicePipe` / 自定义 `@Pipe`
- 指令：`@Directive`（标准）/ 结构指令（`<ng-template>`）/ 属性指令
- 内容投影：`<ng-content>` / `<ng-content select="...">` 多槽
- 生命周期：`ngOnInit` / `ngOnDestroy` / `ngOnChanges` / `ngAfterViewInit` / `afterNextRender` / `afterEveryRender`
- DI：`inject()` 函数式注入（推荐）/ `constructor(private xxx: Xxx)` 旧式

## Standalone 组件全貌

### 最小骨架

```ts
import { Component } from '@angular/core'

@Component({
  selector: 'app-greeter',
  template: `<h1>Hello, {{ name }}!</h1>`,
  styles: `h1 { color: #dd0031; }`,
})
export class Greeter {
  name = 'Angular'
}
```

::: tip Standalone 是 v15+ 引入、v17 默认、v20+ 唯一推荐
v14 之前组件必须挂到 `NgModule` 上，v15 后可以直接 `standalone: true`，v17 起 `standalone` 默认 `true`（不写也是 standalone），v20+ 完全废弃 `standalone: false`（除非显式声明继续用旧 NgModule）。本笔记假设你只写 standalone。

把 `standalone: false` 写出来主要用于：
1. 兼容已有的旧模块化项目
2. 调试某些不支持 standalone 的旧库

新项目不要写 `standalone: true`，因为它已是默认。
:::

### `@Component` 装饰器选项

| 选项 | 类型 | 用途 |
|------|------|------|
| `selector` | string | CSS 选择器（标签 / 属性 / 类） |
| `template` / `templateUrl` | string | 模板内联 / 外部 |
| `styles` / `styleUrl` / `styleUrls` | string / string[] | 样式（**v17+ `styleUrl` 单数**） |
| `imports` | `(Component \| Directive \| Pipe \| NgModule)[]` | 模板中使用的依赖 |
| `providers` | `Provider[]` | 组件级 DI |
| `host` | object | 宿主元素属性 / 事件绑定（取代 `@HostBinding` / `@HostListener`） |
| `changeDetection` | `ChangeDetectionStrategy` | `Default` / `OnPush`（推荐） |
| `encapsulation` | `ViewEncapsulation` | `Emulated`（默认）/ `None` / `ShadowDom` |
| `animations` | `AnimationTriggerMetadata[]` | 旧动画 API（v18+ 已大幅瘦身） |
| `schemas` | `SchemaMetadata[]` | 允许自定义元素 `CUSTOM_ELEMENTS_SCHEMA` |

### 选择器形式

```ts
// 标签
@Component({ selector: 'app-user-card' })   // → <app-user-card />

// 属性
@Component({ selector: '[appHighlight]' })   // → <div appHighlight></div>

// 类
@Component({ selector: '.app-toolbar' })     // → <div class="app-toolbar">

// 组合
@Component({ selector: 'button[appConfirm]' })   // 仅 button + appConfirm 属性匹配
```

### `imports` 是什么

Standalone 组件**没有 NgModule**，模板里用到的所有自定义组件 / 指令 / 管道 / RouterLink / FormsModule 等都要列在 `imports`：

```ts
@Component({
  selector: 'app-user-page',
  imports: [UserCard, RouterLink, AsyncPipe, FormsModule],   // ← 必须显式列出
  template: `
    <app-user-card [user]="user$ | async" />
    <a routerLink="/home">Home</a>
    <input [(ngModel)]="search" />
  `,
})
export class UserPage {}
```

未导入直接用 → 编译错误：

```
NG8001: 'app-user-card' is not a known element
```

## 模板语法详解

### 文本插值

```html
<span>{{ message }}</span>
<span>{{ user.name + ' (' + user.age + ')' }}</span>
<span>{{ count > 10 ? 'large' : 'small' }}</span>

<!-- 调用 getter / 函数（注意性能：每次变更检测都调用） -->
<span>{{ getFullName() }}</span>

<!-- 调用 Signal -->
<span>{{ count() }}</span>
```

模板表达式禁用语法：

```html
<!-- ❌ 赋值（事件除外） -->
{{ x = 5 }}

<!-- ❌ new -->
{{ new Date() }}

<!-- ❌ 自增 -->
{{ count++ }}

<!-- ❌ 逗号 / void -->
{{ a, b }}
```

### 属性绑定

```html
<!-- DOM property（推荐） -->
<img [src]="imgUrl" [alt]="imgAlt" />
<button [disabled]="isLoading">Submit</button>

<!-- HTML attribute（DOM property 无对应时用） -->
<td [attr.colspan]="span"></td>
<svg [attr.viewBox]="viewBox"></svg>
<button [attr.aria-label]="label"></button>

<!-- class 单条 -->
<div [class.active]="isActive"></div>

<!-- class 字符串 / 数组 / 对象 -->
<div [class]="cssClasses"></div>
<!-- cssClasses 可以是: 'a b c' | ['a', 'b'] | { a: true, b: false } -->

<!-- style 单条 -->
<div [style.color]="textColor"></div>
<div [style.font-size.px]="fontSize"></div>
<div [style.width.%]="width"></div>

<!-- style 对象 -->
<div [style]="{ color: 'red', fontSize: '14px' }"></div>
```

### 事件绑定

```html
<button (click)="onClick()">Click</button>
<input (input)="onInput($event)" />
<form (submit)="onSubmit($event)"></form>

<!-- 键盘 / 鼠标修饰符 -->
<input (keyup.enter)="submit()" />
<input (keyup.escape)="cancel()" />
<input (keydown.control.shift.s)="save()" />

<!-- 多语句 -->
<button (click)="count = count + 1; logChange()">+1</button>

<!-- 内联表达式 -->
<button (click)="message = 'Hi'">Set</button>
```

`$event` 类型在模板里被推断（v9+ 严格模板）。

### 双向绑定

#### `[(ngModel)]`（Template-driven）

```ts
import { FormsModule } from '@angular/forms'

@Component({
  imports: [FormsModule],
  template: `
    <input [(ngModel)]="name" />
    <p>{{ name }}</p>
  `,
})
export class Demo {
  name = 'Alice'   // 普通属性
}
```

#### `[(value)]` + `model()`（推荐，组件自定义）

```ts
// 子组件
import { Component, model } from '@angular/core'

@Component({
  selector: 'app-toggle',
  template: `
    <button (click)="checked.set(!checked())">
      {{ checked() ? 'ON' : 'OFF' }}
    </button>
  `,
})
export class Toggle {
  checked = model(false)   // 创建可读写的 Signal
}
```

```ts
// 父组件
@Component({
  imports: [Toggle],
  template: `
    <app-toggle [(checked)]="isOn" />
    <p>State: {{ isOn() }}</p>
  `,
})
export class App {
  isOn = signal(false)
}
```

`model()` 在模板上展开为 `[checked]="isOn()"` + `(checkedChange)="isOn.set($event)"`。

### `@for` 完整语法

```html
@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <p>No items</p>
}
```

上下文变量：

| 变量 | 含义 |
|------|------|
| `$index` | 当前索引（0-based） |
| `$count` | 列表总长度 |
| `$first` | 是否第一个 |
| `$last` | 是否最后一个 |
| `$even` | 偶数索引 |
| `$odd` | 奇数索引 |

可以用 `let` 起别名：

```html
@for (user of users(); track user.id; let idx = $index, isFirst = $first) {
  <div [class.first]="isFirst">{{ idx }}. {{ user.name }}</div>
}
```

`track` 是性能关键，选择策略：

- 唯一 ID：`track item.id`（首选）
- 不可变值：`track item`（引用对比）
- 兜底（不推荐）：`track $index`（顺序变化时全部重建）

### `@if` / `@switch` 完整语法

```html
@if (isLoggedIn()) {
  <user-menu />
} @else if (isGuest()) {
  <login-button />
} @else {
  <p>Loading...</p>
}

@if (currentUser(); as user) {     <!-- 别名 -->
  <p>Hi {{ user.name }}</p>
}

@switch (role()) {
  @case ('admin') { <admin-panel /> }
  @case ('editor') { <editor-panel /> }
  @case ('viewer') { <viewer-panel /> }
  @default { <not-allowed /> }
}
```

### `@defer` 延迟加载

```html
@defer (on viewport; prefetch on idle) {
  <large-chart />
} @placeholder (minimum 500ms) {
  <skeleton-card />
} @loading (after 100ms; minimum 1s) {
  <spinner />
} @error {
  <p>Failed to load</p>
}
```

触发器组合：

| 触发器 | 含义 |
|--------|------|
| `on idle` | 浏览器空闲（默认） |
| `on viewport` | 进入视口 |
| `on viewport(myRef)` | 指定元素进入视口 |
| `on interaction` | 点击 / 键盘交互后 |
| `on hover` | 悬停后 |
| `on immediate` | 渲染立即触发 |
| `on timer(500ms)` | 计时器 |
| `when condition` | 表达式为真 |

支持 `prefetch`（预加载但不渲染）：

```html
@defer (on interaction; prefetch on idle) {
  <heavy-modal />
}
```

::: tip 配合 Incremental Hydration（v19+）
SSR 应用可以加 `hydrate on viewport` 让服务端渲染 HTML 直到用户滚到视口前都不水合 → 节省 JS 解析时间：

```html
@defer (hydrate on viewport) {
  <large-comments />
}
```

需要 `provideClientHydration(withIncrementalHydration())`。详见高级章节。
:::

### 老结构指令（兼容写法）

v17 之前的方式，新代码不推荐但常见于老项目：

```html
<!-- *ngIf -->
<div *ngIf="user; else loading">{{ user.name }}</div>
<ng-template #loading><p>Loading...</p></ng-template>

<!-- *ngFor -->
<li *ngFor="let item of items; let i = index; trackBy: trackById">
  {{ i }}: {{ item.name }}
</li>

<!-- *ngSwitch -->
<div [ngSwitch]="role">
  <div *ngSwitchCase="'admin'">Admin</div>
  <div *ngSwitchCase="'editor'">Editor</div>
  <div *ngSwitchDefault>Viewer</div>
</div>
```

需要在 `imports` 中包含 `NgIf` / `NgFor` / `NgSwitch` / `NgSwitchCase` / `NgSwitchDefault`（或一次性 `CommonModule`）。

```ts
@Component({
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault],
  // ...
})
```

::: tip `ng generate @angular/core:control-flow`
官方提供 schematic 自动把 `*ngIf` / `*ngFor` / `*ngSwitch` 改写为新控制流：

```bash
ng g @angular/core:control-flow
```
:::

## 输入输出（Signal-based API）

### `input()` 全部用法

```ts
import { Component, input, booleanAttribute, numberAttribute } from '@angular/core'

@Component({
  selector: 'app-slider',
  template: `<p>{{ label() }}: {{ value() }}</p>`,
})
export class Slider {
  // 1. 可选 + 默认值（类型推断）
  value = input(0)                            // InputSignal<number>

  // 2. 必填（无默认）
  label = input.required<string>()           // InputSignalWithTransform 无 undefined

  // 3. 仅显式类型
  step = input<number>()                     // InputSignal<number | undefined>

  // 4. 透明转换：HTML 字符串 → number
  size = input(10, { transform: numberAttribute })

  // 5. 布尔属性：'' / 'true' / true → true
  disabled = input(false, { transform: booleanAttribute })

  // 6. 自定义转换
  tag = input('', { transform: (v: string) => v.trim().toLowerCase() })

  // 7. 别名（HTML 名 / class 名解耦）
  internalName = input('', { alias: 'name' })
}
```

模板使用：

```html
<app-slider
  [value]="50"
  label="Volume"
  step="5"
  size="20"
  disabled
  name="vol"
/>
```

### `output()`

```ts
import { Component, output } from '@angular/core'

@Component({
  selector: 'app-form',
  template: `
    <button (click)="submit()">Submit</button>
    <button (click)="cancel()">Cancel</button>
  `,
})
export class FormCmp {
  saved = output<{ id: number; name: string }>()
  closed = output<void>()

  submit() {
    this.saved.emit({ id: 1, name: 'Alice' })
  }

  cancel() {
    this.closed.emit()
  }
}
```

```html
<app-form
  (saved)="onSaved($event)"
  (closed)="onClosed()"
/>
```

与 RxJS 互通：

```ts
import { outputFromObservable, outputToObservable } from '@angular/core/rxjs-interop'

// 把 Observable 包装成 output
class Cmp {
  private clicks$ = new Subject<MouseEvent>()
  clicked = outputFromObservable(this.clicks$)
}

// 把 output 转成 Observable（在父组件 / 测试中）
const obs$ = outputToObservable(comp.clicked)
obs$.subscribe(e => console.log(e))
```

### `model()` 双向

```ts
import { Component, model } from '@angular/core'

@Component({
  selector: 'app-toggle',
  template: `<button (click)="checked.set(!checked())">{{ checked() }}</button>`,
})
export class Toggle {
  // 单 model
  checked = model(false)

  // 必填 model
  // value = model.required<number>()
}
```

```html
<app-toggle [(checked)]="isOn" />
<!-- 等价于：[checked]="isOn" (checkedChange)="isOn = $event" -->
```

### `viewChild()` / `viewChildren()`

模板中标记 `#name` 后，组件读取：

```ts
import { Component, viewChild, viewChildren, ElementRef, AfterViewInit, effect } from '@angular/core'

@Component({
  selector: 'app-stage',
  template: `
    <input #search />
    <button #btn>One</button>
    <button #btn>Two</button>
    <button #btn>Three</button>
  `,
})
export class Stage {
  // 单元素，可能 undefined
  search = viewChild<ElementRef<HTMLInputElement>>('search')

  // 单元素必填，无 undefined
  searchRequired = viewChild.required<ElementRef<HTMLInputElement>>('search')

  // 多元素
  buttons = viewChildren<ElementRef<HTMLButtonElement>>('btn')

  constructor() {
    // 自动响应 DOM 变化
    effect(() => {
      const input = this.search()
      console.log('input element:', input?.nativeElement)
    })

    effect(() => {
      console.log('button count:', this.buttons().length)
    })
  }
}
```

`read` 选项指定要读取的 token 类型：

```ts
form = viewChild('myForm', { read: NgForm })
template = viewChild('tmpl', { read: TemplateRef })
```

### `contentChild()` / `contentChildren()`

「Content」是父组件投影到 `<ng-content>` 中的节点：

```ts
@Component({
  selector: 'app-tab-group',
  template: `<ng-content />`,
})
export class TabGroup {
  // 查询父组件投影进来的 <app-tab>
  tabs = contentChildren(Tab)
}

@Component({ selector: 'app-tab', template: `...` })
export class Tab {
  title = input.required<string>()
}
```

```html
<app-tab-group>
  <app-tab title="One">Content 1</app-tab>
  <app-tab title="Two">Content 2</app-tab>
</app-tab-group>
```

## Signals 完整

### `signal` 详细 API

```ts
import { signal } from '@angular/core'

const count = signal(0)

// 读：
count()              // 函数调用
count.asReadonly()   // 返回只读 Signal<number>（无 set / update）

// 写：
count.set(5)
count.update(c => c + 1)

// 自定义相等：
const s = signal({ x: 0 }, { equal: (a, b) => a.x === b.x })
s.set({ x: 0 })   // 不触发更新（等值）
```

### `computed`

```ts
import { computed, signal } from '@angular/core'

const a = signal(1)
const b = signal(2)
const sum = computed(() => a() + b())

console.log(sum())   // 3
a.set(10)
console.log(sum())   // 12

// 也可指定相等
const arr = signal([1, 2, 3])
const sorted = computed(() => [...arr()].sort(), { equal: shallowArrayEqual })
```

`computed` 是 **lazy + memoized**：

- **lazy**：从未被读时不会执行
- **memoized**：依赖未变时多次读返回缓存

### `effect`

```ts
import { Component, effect, signal } from '@angular/core'

@Component({ /* ... */ })
export class Cmp {
  count = signal(0)

  constructor() {
    // 必须在 injection context（如 constructor）内
    const ref = effect(() => {
      console.log('count =', this.count())
    })

    // ref.destroy() 可手动停止；组件销毁时自动停止
  }
}
```

Effect 在 injection context 外创建：

```ts
import { effect, inject, Injector } from '@angular/core'

class Service {
  injector = inject(Injector)

  start(count: Signal<number>) {
    // 显式注入 injector 才能在任意函数内创建 effect
    effect(() => console.log(count()), { injector: this.injector })
  }
}
```

### `linkedSignal`（v19 稳定）

「与其它 signal 相关联但可被手动覆盖」的 signal：

```ts
import { linkedSignal, signal } from '@angular/core'

const shippingOptions = signal(['Standard', 'Express'])

// 1. 简单：跟随第一个选项
const selected = linkedSignal(() => shippingOptions()[0])

selected()                        // 'Standard'
selected.set('Express')           // 用户手动改
shippingOptions.set(['A', 'B'])   // 选项变了，selected 重置为 'A'

// 2. 完整：可访问 previous 值
const selectedWithMemory = linkedSignal<string[], string>({
  source: shippingOptions,
  computation: (newOptions, previous) => {
    // 若上次选的还在新列表里，保留它
    if (previous && newOptions.includes(previous.value)) return previous.value
    return newOptions[0]
  },
})
```

应用场景：表单初始值跟随 props、tab 跟随路由、列表选中项跟随数据。

### `resource`（v19 引入，experimental）

异步数据流的 signal 化：

```ts
import { resource, signal } from '@angular/core'

const userId = signal<string | undefined>(undefined)

const userResource = resource({
  params: () => ({ id: userId() }),                          // 反应式参数
  loader: async ({ params, abortSignal }) => {
    if (!params.id) return null
    const res = await fetch(`/api/users/${params.id}`, { signal: abortSignal })
    return res.json()
  },
})

// 在模板里：
// userResource.status()   // 'idle' | 'loading' | 'resolved' | 'error' | 'reloading' | 'local'
// userResource.value()    // 数据（可能 undefined）
// userResource.hasValue() // boolean
// userResource.error()    // 错误对象
// userResource.isLoading()// boolean
// userResource.reload()   // 重新加载
```

`abortSignal` 会在新参数到来时自动 abort 上一次请求——天然防竞态。

::: warning experimental
v21 时 `resource` 仍标记为 experimental，API 可能调整。生产可用但要锁版本。
:::

### `untracked` 与 `effect` 调试

```ts
import { effect, signal, untracked } from '@angular/core'

const count = signal(0)
const log = signal<string[]>([])

effect(() => {
  const c = count()
  // 在 effect 里读 log 但不希望 log 变化触发本 effect
  const old = untracked(log)
  log.set([...old, `count=${c}`])
})
```

## 表单系统

### Template-driven Forms（FormsModule）

适合简单表单：

```ts
import { Component, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-signup',
  imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f)">
      <input
        name="email"
        type="email"
        [(ngModel)]="email"
        required
        email
        #emailRef="ngModel"
      />
      @if (emailRef.invalid && emailRef.touched) {
        <p class="error">
          @if (emailRef.errors?.['required']) { Email is required }
          @if (emailRef.errors?.['email']) { Invalid email }
        </p>
      }

      <input
        name="password"
        type="password"
        [(ngModel)]="password"
        required
        minlength="8"
      />

      <button [disabled]="f.invalid">Sign Up</button>
    </form>
  `,
})
export class Signup {
  email = signal('')
  password = signal('')

  onSubmit(f: NgForm) {
    console.log(f.value)   // { email: '...', password: '...' }
  }
}
```

### Reactive Forms（ReactiveFormsModule）

适合复杂表单 / 动态字段 / 大量校验：

```ts
import { Component, inject } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <input formControlName="name" placeholder="Name" />
      @if (form.controls.name.invalid && form.controls.name.touched) {
        <p class="error">Name is required</p>
      }

      <input formControlName="email" placeholder="Email" />

      <div formGroupName="address">
        <input formControlName="city" placeholder="City" />
        <input formControlName="zip" placeholder="ZIP" />
      </div>

      <div formArrayName="phones">
        @for (phone of phones.controls; track $index) {
          <input [formControlName]="$index" placeholder="Phone" />
          <button type="button" (click)="removePhone($index)">×</button>
        }
        <button type="button" (click)="addPhone()">+ Add Phone</button>
      </div>

      <button [disabled]="form.invalid">Save</button>
    </form>
  `,
})
export class Profile {
  private fb = inject(FormBuilder)

  // 用 nonNullable 简写
  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: this.fb.nonNullable.group({
      city: [''],
      zip: ['', Validators.pattern(/^\d{5}$/)],
    }),
    phones: this.fb.nonNullable.array<string>([]),
  })

  get phones() {
    return this.form.controls.phones
  }

  addPhone() {
    this.phones.push(this.fb.nonNullable.control(''))
  }

  removePhone(i: number) {
    this.phones.removeAt(i)
  }

  save() {
    if (this.form.invalid) return
    console.log(this.form.value)
  }
}
```

### Typed Forms（v14+ 默认）

`FormControl<T>` / `FormGroup<T>` 全程类型安全：

```ts
import { FormControl, FormGroup, Validators } from '@angular/forms'

// 显式
const email = new FormControl<string | null>('', Validators.required)
// 推断为 FormControl<string | null>

// 非 null
const name = new FormControl('', { nonNullable: true, validators: Validators.required })
// 推断为 FormControl<string>（reset 回初始值而非 null）

// FormGroup 类型化
interface ProfileForm {
  name: FormControl<string>
  age: FormControl<number | null>
}

const form = new FormGroup<ProfileForm>({
  name: new FormControl('', { nonNullable: true }),
  age: new FormControl<number | null>(null),
})

form.controls.name.value   // string
form.controls.age.value    // number | null
form.value                 // Partial<{ name: string; age: number | null }>
form.getRawValue()         // { name: string; age: number | null }
```

::: tip FormRecord（动态键）
键不固定时用 FormRecord：

```ts
import { FormRecord, FormControl } from '@angular/forms'

const tags = new FormRecord<FormControl<boolean>>({
  vue: new FormControl(false, { nonNullable: true }),
})
tags.addControl('react', new FormControl(false, { nonNullable: true }))
```
:::

### 自定义校验器

```ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'

// 同步
export function noSpaces(control: AbstractControl): ValidationErrors | null {
  return /\s/.test(control.value) ? { noSpaces: true } : null
}

// 带参数
export function minWords(min: number): ValidatorFn {
  return (control: AbstractControl) => {
    const words = (control.value || '').trim().split(/\s+/)
    return words.length < min ? { minWords: { min, actual: words.length } } : null
  }
}

// 异步
export function uniqueUsername(api: ApiService): AsyncValidatorFn {
  return (control: AbstractControl) =>
    api.checkUsername(control.value).pipe(
      map(exists => exists ? { taken: true } : null),
    )
}

// 使用
const form = fb.nonNullable.group({
  username: ['', [Validators.required, noSpaces], [uniqueUsername(api)]],
  bio: ['', minWords(3)],
})
```

### Signal Forms（experimental，v21）

Angular v21 引入了基于 Signals 的实验性表单 API（`@angular/forms/signals`），暂未稳定，关注后续版本即可：

```ts
import { signal } from '@angular/core'
import { form, required } from '@angular/forms/signals'

const userModel = signal({ name: '', email: '' })

const f = form(userModel, {
  name: { validators: [required()] },
  email: { validators: [required(), email()] },
})

// f().valid, f().touched, f.name().value, ...
```

## 管道（Pipes）

### 内置管道

| 管道 | 用途 |
|------|------|
| `async` | 自动订阅 / 退订 Observable / Promise |
| `date` | 格式化日期，默认 medium 格式 |
| `currency` | 格式化货币，支持 ISO 4217 代码 / 符号 |
| `decimal` (`number`) | 格式化数值（小数位数 / 千分位） |
| `percent` | 格式化百分比 |
| `json` | 对象序列化（调试用） |
| `slice` | 数组 / 字符串切片 |
| `keyvalue` | 把对象 / Map 转 `[{key, value}]` 数组 |
| `uppercase` | 字符串转大写 |
| `lowercase` | 字符串转小写 |
| `titlecase` | 字符串转首字母大写 |
| `i18nPlural` | 数量映射到字符串（复数） |
| `i18nSelect` | 字符串映射 |

例子（模板）：

```html
<p>{{ user$ | async }}</p>
<p>{{ date | date:'yyyy-MM-dd' }}</p>
<p>{{ price | currency:'USD':'symbol':'1.2-2' }}</p>
<p>{{ pi | number:'1.2-4' }}</p>
<p>{{ rate | percent:'1.0-2' }}</p>
<pre>{{ obj | json }}</pre>
<p>{{ list | slice:0:3 }}</p>
<p>{{ name | titlecase }}</p>
```

链式：

```html
{{ date | date:'short' | uppercase }}
```

### `AsyncPipe` 详解

```ts
@Component({
  imports: [AsyncPipe],
  template: `
    @if (user$ | async; as user) {
      <p>{{ user.name }}</p>
    } @else {
      <p>Loading...</p>
    }
  `,
})
export class UserView {
  user$ = this.http.get<User>('/api/me')
}
```

`AsyncPipe` 自动 subscribe + unsubscribe，能省掉大部分手动订阅样板。

::: tip Signal 时代不需要 AsyncPipe
有 Signal 后，直接 `toSignal(obs$)` 然后 <span v-pre>`{{ data() }}`</span> 即可。`AsyncPipe` 仍是 RxJS 直读的便利方式。
:::

### 自定义管道

```ts
import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, maxLength = 20, suffix = '...'): string {
    if (!value || value.length <= maxLength) return value
    return value.slice(0, maxLength) + suffix
  }
}
```

使用：

```ts
@Component({
  imports: [TruncatePipe],
  template: `<p>{{ longText | truncate:50:'…' }}</p>`,
})
```

#### Pure vs Impure 管道

```ts
@Pipe({
  name: 'filter',
  pure: false,    // 默认 true，false 每次变更检测都重算
})
```

`pure: false` 会显著影响性能（每次 CD 都跑 transform），尽量避免。

## 指令

### 属性指令

加在元素上改变行为：

```ts
import { Directive, ElementRef, HostListener, inject, input } from '@angular/core'

@Directive({
  selector: '[appHighlight]',
})
export class HighlightDirective {
  private el = inject(ElementRef<HTMLElement>)

  color = input<string>('yellow')

  @HostListener('mouseenter') onEnter() {
    this.el.nativeElement.style.backgroundColor = this.color()
  }

  @HostListener('mouseleave') onLeave() {
    this.el.nativeElement.style.backgroundColor = ''
  }
}
```

使用：

```ts
@Component({
  imports: [HighlightDirective],
  template: `
    <p appHighlight color="lightblue">Hover me</p>
  `,
})
```

### 用 `host` 字段替代 `@HostBinding` / `@HostListener`

v17+ 推荐 `host` 字段（更简洁）：

```ts
@Directive({
  selector: '[appHighlight]',
  host: {
    '(mouseenter)': 'onEnter()',
    '(mouseleave)': 'onLeave()',
    '[style.background-color]': 'color()',
    '[class.active]': 'active()',
  },
})
export class HighlightDirective {
  color = input('yellow')
  active = input(false)

  onEnter() { /* ... */ }
  onLeave() { /* ... */ }
}
```

### 结构指令（需要 ng-template）

老的 `*ngIf` / `*ngFor` 就是结构指令。自定义示例：

```ts
import { Directive, TemplateRef, ViewContainerRef, inject, input, effect } from '@angular/core'

@Directive({
  selector: '[appUnless]',
})
export class UnlessDirective {
  private tpl = inject(TemplateRef<unknown>)
  private vc = inject(ViewContainerRef)

  // input 自动转布尔
  appUnless = input.required<boolean>()

  constructor() {
    effect(() => {
      this.vc.clear()
      if (!this.appUnless()) {
        this.vc.createEmbeddedView(this.tpl)
      }
    })
  }
}
```

```html
<p *appUnless="isHidden">Visible when isHidden is false</p>
```

::: tip 新代码优先用 `@if`
自定义结构指令在 v17+ 已经不太需要——绝大多数场景 `@if` / `@for` 配合 signal 就能搞定。
:::

## 内容投影（Content Projection）

类似 Vue slot / React children：

### 单槽默认投影

```ts
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <ng-content />
    </div>
  `,
})
export class Card {}
```

```html
<app-card>
  <h2>Title</h2>
  <p>Body</p>
</app-card>
```

### 多槽（具名）

```ts
@Component({
  selector: 'app-page',
  template: `
    <header><ng-content select="[slot=header]" /></header>
    <main><ng-content /></main>          <!-- 兜底 -->
    <footer><ng-content select="[slot=footer]" /></footer>
  `,
})
export class Page {}
```

```html
<app-page>
  <h1 slot="header">Welcome</h1>
  <p>Main content</p>
  <small slot="footer">© 2026</small>
</app-page>
```

### 条件投影 + 默认值

```ts
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      @if (title) {
        <h2><ng-content select="[card-title]" /></h2>
      }
      <ng-content />
    </div>
  `,
})
```

### 使用 `ng-container` 避免额外标签

```html
<app-card>
  <ng-container card-title>Hello</ng-container>
  <p>Body</p>
</app-card>
```

`<ng-container>` 不渲染到 DOM。

## 生命周期 Hooks

### 经典生命周期接口

| Hook | 时机 |
|------|------|
| `ngOnChanges(changes)` | 输入属性变化时（每次） |
| `ngOnInit()` | 首次输入初始化后（一次） |
| `ngDoCheck()` | 每次变更检测前（性能敏感） |
| `ngAfterContentInit()` | 内容投影初始化后（一次） |
| `ngAfterContentChecked()` | 内容投影变更检测后（每次） |
| `ngAfterViewInit()` | 视图初始化后（一次） |
| `ngAfterViewChecked()` | 视图变更检测后（每次） |
| `ngOnDestroy()` | 销毁前（一次） |

```ts
import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, input } from '@angular/core'

@Component({ /* ... */ })
export class Demo implements OnInit, OnChanges, OnDestroy {
  id = input.required<string>()

  ngOnChanges(changes: SimpleChanges) {
    console.log('changes:', changes)
  }

  ngOnInit() {
    console.log('init, id =', this.id())
  }

  ngOnDestroy() {
    console.log('destroy')
  }
}
```

### `afterNextRender` / `afterEveryRender`（v16+）

新的渲染回调（**不在 SSR 服务端运行**，仅浏览器）：

```ts
import { Component, afterNextRender, afterEveryRender } from '@angular/core'

@Component({ /* ... */ })
export class Cmp {
  constructor() {
    afterNextRender(() => {
      // 一次，组件首次渲染到 DOM 后
      console.log('First paint done')
    })

    afterEveryRender(() => {
      // 每次渲染后（取代 ngAfterViewChecked，更轻量）
      console.log('rendered')
    })
  }
}
```

分阶段执行：

```ts
afterNextRender({
  earlyRead:  () => readDom1(),
  write:      (e1) => writeDom(e1),
  mixedReadWrite: () => bothPhases(),
  read:       () => readFinal(),
})
```

避免布局抖动（layout thrashing）。

### `DestroyRef`（v16+）

替代 `OnDestroy` 接口的注入式 API：

```ts
import { Component, DestroyRef, inject } from '@angular/core'

@Component({ /* ... */ })
export class Cmp {
  private destroyRef = inject(DestroyRef)

  constructor() {
    const sub = someObservable$.subscribe(/* ... */)
    this.destroyRef.onDestroy(() => sub.unsubscribe())
  }
}
```

也可以配合 RxJS 的 `takeUntilDestroyed`：

```ts
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

@Component({ /* ... */ })
export class Cmp {
  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())   // 在 injection context 内自动用当前 DestroyRef
      .subscribe(t => console.log(t))
  }
}
```

## 父子通信汇总

### 父 → 子：input

```ts
// 子
@Component({ template: `<p>{{ name() }}</p>` })
export class Child {
  name = input.required<string>()
}

// 父
@Component({
  imports: [Child],
  template: `<app-child [name]="userName" />`,
})
export class Parent {
  userName = 'Alice'
}
```

### 子 → 父：output

```ts
// 子
@Component({ template: `<button (click)="save()">Save</button>` })
export class Child {
  saved = output<string>()
  save() { this.saved.emit('done') }
}

// 父
@Component({
  imports: [Child],
  template: `<app-child (saved)="onSaved($event)" />`,
})
export class Parent {
  onSaved(msg: string) { console.log(msg) }
}
```

### 双向：model

```ts
// 子
@Component({ template: `<button (click)="checked.set(!checked())">{{ checked() }}</button>` })
export class Child {
  checked = model(false)
}

// 父
@Component({
  template: `<app-child [(checked)]="isOn" />`,
})
export class Parent {
  isOn = signal(false)
}
```

### 父调子方法：viewChild

```ts
// 子（公开方法）
@Component({ /* ... */ })
export class Child {
  reset() {
    console.log('child reset')
  }
}

// 父
@Component({
  imports: [Child],
  template: `
    <app-child />
    <button (click)="child()?.reset()">Reset child</button>
  `,
})
export class Parent {
  child = viewChild(Child)
}
```

### 跨层级：依赖注入（详见进阶）

```ts
// 服务
@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<'light' | 'dark'>('light')
}

// 顶层
@Component({ /* ... */ })
export class App {
  private theme = inject(ThemeService)

  toggle() {
    this.theme.theme.update(t => t === 'light' ? 'dark' : 'light')
  }
}

// 任意子组件
@Component({ /* ... */ })
export class DeepChild {
  theme = inject(ThemeService)
  // 模板里直接 {{ theme.theme() }}
}
```

## 一份能跑的完整示例

```ts
// src/app/components/todo-list.ts
import { Component, computed, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'

interface Todo {
  id: number
  title: string
  done: boolean
}

@Component({
  selector: 'app-todo-list',
  imports: [FormsModule],
  template: `
    <div class="todo">
      <h2>Todos ({{ remaining() }} / {{ todos().length }})</h2>

      <form (ngSubmit)="add()">
        <input [(ngModel)]="newTitle" name="newTitle" placeholder="What to do?" />
        <button [disabled]="!newTitle().trim()">Add</button>
      </form>

      <ul>
        @for (todo of todos(); track todo.id) {
          <li [class.done]="todo.done">
            <input type="checkbox"
                   [checked]="todo.done"
                   (change)="toggle(todo)" />
            <span>{{ todo.title }}</span>
            <button (click)="remove(todo)">×</button>
          </li>
        } @empty {
          <li class="empty">No todos yet</li>
        }
      </ul>

      @if (todos().length > 0) {
        <button (click)="clearDone()">Clear done</button>
      }
    </div>
  `,
  styles: `
    .todo { font-family: sans-serif; max-width: 400px; }
    li.done span { text-decoration: line-through; opacity: 0.5; }
    li.empty { color: #888; }
  `,
})
export class TodoList {
  todos = signal<Todo[]>([
    { id: 1, title: 'Learn Angular', done: false },
    { id: 2, title: 'Learn Signals', done: true },
  ])
  newTitle = signal('')

  remaining = computed(() => this.todos().filter(t => !t.done).length)

  add() {
    const title = this.newTitle().trim()
    if (!title) return
    this.todos.update(list => [
      ...list,
      { id: Date.now(), title, done: false },
    ])
    this.newTitle.set('')
  }

  toggle(todo: Todo) {
    this.todos.update(list => list.map(t =>
      t.id === todo.id ? { ...t, done: !t.done } : t,
    ))
  }

  remove(todo: Todo) {
    this.todos.update(list => list.filter(t => t.id !== todo.id))
  }

  clearDone() {
    this.todos.update(list => list.filter(t => !t.done))
  }
}
```

这一个组件涵盖：standalone import / signals / computed / `@for + track` / `@if` / `@empty` / 表单（`[(ngModel)]`）/ 事件 / 不可变更新 / inline styles。

## 下一步

- 依赖注入 / 路由 / HTTP / RxJS / 测试详见 [指南 - 进阶](./advanced.md)
- Signals 内部 / Zoneless / SSR / 性能详见 [指南 - 高级](./expert.md)
- 与生态集成（Material / Tailwind / Nx）详见 [指南 - 其他](./other.md)
- API 速查见 [参考](../reference.md)
