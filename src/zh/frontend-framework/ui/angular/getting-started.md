---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Angular 21.x 编写

## 速查

- 系统要求：Node.js **20.19+** / **22.12+**（Angular 21 起，与 Vite 7 / Nx 一致）；TypeScript **5.8+**
- 创建：`pnpm dlx @angular/cli@latest new my-app`（推荐 standalone + SCSS + SSR 询问）
- 启动：`pnpm start` 或 `ng serve`（默认 `http://localhost:4200`，HMR 默认开启）
- 入口：`main.ts` 调 `bootstrapApplication(App, appConfig)`（standalone API）
- 组件：`@Component({ selector, template/templateUrl, styles/styleUrls, imports })` + class
- 核心响应式：`signal` / `computed` / `effect` / `linkedSignal` / `resource`（experimental）
- 模板语法：插值 <span v-pre>`{{ exp }}`</span>、属性绑定 `[prop]`、事件绑定 `(event)`、双向 `[(value)]`
- 控制流（v17+ 新语法）：`@if` / `@for` / `@switch` / `@defer`
- 路由：[Angular Router](https://angular.dev/guide/routing)（`provideRouter` + `<router-outlet>`）
- 状态：[NgRx](https://ngrx.io/) / Signals + Service / [NgRx Signals](https://ngrx.io/guide/signals)
- 工具：[Angular DevTools](https://angular.dev/tools/devtools)（Chrome / Edge 扩展）

## Angular 是什么

Angular 不是 [AngularJS](https://angularjs.org/)（v1.x）的「升级版」——而是 **2016 年 Google 用 TypeScript 完全重写的新框架**。后者已于 2022 年 1 月停止维护，所有现代「Angular」资料默认指 Angular 2+ 系列。

| 特性 | AngularJS（v1.x） | Angular（v2+） |
|------|------------------|---------------|
| 语言 | JavaScript ES5 | TypeScript |
| 模板 | HTML + 自定义指令（`ng-*`） | 强类型模板编译 |
| 模块化 | `angular.module()` | NgModule（v15-）/ Standalone（v15+） |
| 数据绑定 | scope + `$digest` 脏检查 | Zone.js 检测 / Signals（v17+） |
| 移动端 | Ionic + Cordova | Angular Native / Ionic Capacitor |
| 状态 | 状态散在 scope / 全局服务 | RxJS / Signals + 服务，或 NgRx |
| 当前状态 | EOL（2022.1） | LTS 半年大版本，2026 已到 v21 |

> 后续所有内容默认 **Angular v21**。如果你看到老资料讲 `*ngIf` / `NgModule` / `Module Federation 老语法`，那是 v15 之前的内容，可读但已不是主流写法。

## 安装与首次启动

### 推荐路径：Angular CLI

```bash
# 全局或临时调用 Angular CLI
pnpm dlx @angular/cli@latest new my-app

# 或装到本地：
pnpm add -g @angular/cli
ng new my-app
```

交互式提问：

```
? Which stylesheet format would you like to use? SCSS
? Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)? Yes
? Do you want to enable AI tools? No  (可选)
? Would you like to share pseudonymous usage data ...? No
```

然后：

```bash
cd my-app
pnpm install   # CLI 默认用 npm，可手动切 pnpm
pnpm start     # 或 ng serve
```

浏览器打开 `http://localhost:4200`。HMR 默认开启，保存即热更新。

::: tip 包管理器
Angular CLI 默认 npm。强制切换：

```bash
ng config -g cli.packageManager pnpm   # 全局设
# 或 ng new 时加 --package-manager=pnpm
ng new my-app --package-manager=pnpm
```
:::

### Node 版本

Angular 21 要求 Node 20.19+ / 22.12+；建议 LTS：

```bash
nvm install --lts && nvm use --lts
```

CI 配置（GitHub Actions 示例）：

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'
```

### `ng new` 关键标志

| 标志 | 用途 |
|------|------|
| `--standalone` | （默认 true）使用 standalone API，不生成 AppModule |
| `--ssr` / `--no-ssr` | 启用 / 关闭 SSR（默认询问） |
| `--routing` | 启用路由（默认 true） |
| `--style=scss \| sass \| less \| css` | 样式语言 |
| `--package-manager=pnpm` | 包管理器 |
| `--strict` | TypeScript 严格模式（默认 true） |
| `--inline-template` | 模板写在 `template:` 字段而非独立文件 |
| `--inline-style` | 样式写在 `styles:` 字段而非独立文件 |
| `--minimal` | 最小骨架（不带 testing） |
| `--skip-git` | 不初始化 Git 仓库 |

## 项目结构

CLI 默认生成的目录：

```
my-app/
├── src/
│   ├── app/                    # 应用源码
│   │   ├── app.config.ts       # 应用级 providers（路由、HTTP、动画等）
│   │   ├── app.routes.ts       # 路由表
│   │   ├── app.ts              # 根组件 class
│   │   ├── app.html            # 根组件模板（v21 新约定，不再 .component.html）
│   │   ├── app.scss            # 根组件样式
│   │   └── app.spec.ts         # 单测
│   ├── main.ts                 # 入口（bootstrapApplication）
│   ├── styles.scss             # 全局样式
│   └── index.html              # SPA 入口 HTML
├── public/                     # 不经构建的静态资源（v17+）
├── angular.json                # CLI 工作空间配置（构建 / 测试 / 服务器）
├── package.json
├── tsconfig.json               # 主 TS 配置
├── tsconfig.app.json           # 应用编译选项
├── tsconfig.spec.json          # 测试编译选项
└── README.md
```

::: tip v20+ 文件命名约定改了
v20 起官方移除了 `.component.ts` / `.component.html` / `.component.css` / `.service.ts` 之类的中缀。新项目用：

- `app.ts` 而非 `app.component.ts`
- `app.html` 而非 `app.component.html`
- `user.ts`（服务）而非 `user.service.ts`

老项目仍兼容旧命名。`ng generate` 也已切到新约定。
:::

### `angular.json` 速览

```json
{
  "projects": {
    "my-app": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "outputPath": "dist/my-app",
            "browser": "src/main.ts",
            "polyfills": [],
            "tsConfig": "tsconfig.app.json",
            "assets": ["public"],
            "styles": ["src/styles.scss"],
            "scripts": []
          },
          "configurations": {
            "production": { "optimization": true, "outputHashing": "all" },
            "development": { "optimization": false, "sourceMap": true }
          }
        },
        "serve": { "builder": "@angular/build:dev-server" },
        "test": { "builder": "@angular/build:test" }
      }
    }
  }
}
```

v17+ 默认 builder 已切到 [esbuild + Vite](https://angular.dev/tools/cli/build-system-migration)，旧的 `@angular-devkit/build-angular:browser`（基于 webpack）仅用于旧项目兼容。

## 第一个组件

### 最小 Standalone 组件

```ts
// src/app/hello-button.ts
import { Component, input, output, signal } from '@angular/core'

@Component({
  selector: 'app-hello-button',
  template: `
    <button [disabled]="disabled()" (click)="handleClick()">
      {{ label() }} ({{ count() }})
    </button>
  `,
  styles: `
    button {
      padding: 8px 16px;
      border-radius: 4px;
      background: #dd0031;
      color: white;
      border: none;
      cursor: pointer;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `,
})
export class HelloButton {
  // 1. Signal-based 输入（v17.1+）
  label = input.required<string>()
  disabled = input(false)

  // 2. Signal-based 输出（v17.3+）
  clicked = output<{ ts: number }>()

  // 3. 组件内部状态
  count = signal(0)

  // 4. 方法
  handleClick() {
    this.count.update(c => c + 1)
    this.clicked.emit({ ts: Date.now() })
  }
}
```

使用：

```ts
// src/app/app.ts
import { Component } from '@angular/core'
import { HelloButton } from './hello-button'

@Component({
  selector: 'app-root',
  imports: [HelloButton],
  template: `
    <app-hello-button
      label="Hi"
      (clicked)="onClicked($event)"
    />
  `,
})
export class App {
  onClicked(payload: { ts: number }) {
    console.log('clicked at', payload.ts)
  }
}
```

### 模板与样式分离

```ts
@Component({
  selector: 'app-hello-button',
  templateUrl: './hello-button.html',
  styleUrl: './hello-button.scss',          // v17+ 是单数 styleUrl
  // 老写法 styleUrls: ['./hello-button.scss']  也兼容
})
```

```html
<!-- hello-button.html -->
<button [disabled]="disabled()" (click)="handleClick()">
  {{ label() }} ({{ count() }})
</button>
```

```scss
/* hello-button.scss */
button {
  padding: 8px 16px;
  border-radius: 4px;
  background: #dd0031;
  color: white;
  border: none;
}
button:disabled { opacity: 0.5; }
```

::: tip 组件样式默认隔离
Angular 组件样式默认 `ViewEncapsulation.Emulated`——编译器给当前组件 DOM 加属性 `_ngcontent-xxx-c1`，CSS 选择器自动改写。**样式不污染其它组件**。

需要穿透：用 `::ng-deep`（已废弃但仍可用）或 `:host-context()`，最佳做法是把样式提到全局 `styles.scss`。
:::

## Signals 入门

Signal 是 Angular v17 引入、v21 全面采用的细粒度响应式原语，对标 Vue 的 `ref` / Solid 的 Signal / React 的 `useState`。

### `signal` —— 可写

```ts
import { signal } from '@angular/core'

const count = signal(0)

console.log(count())     // 读：调用函数（不是 React 的 .value，也不是 Vue 的 .value）
count.set(5)             // 写：直接设值
count.update(c => c + 1) // 写：基于旧值
```

### `computed` —— 派生

```ts
import { computed, signal } from '@angular/core'

const count = signal(0)
const doubled = computed(() => count() * 2)

console.log(doubled())   // 0
count.set(5)
console.log(doubled())   // 10
```

`computed` 是**带缓存的**：依赖不变时多次访问只算一次。

### `effect` —— 副作用

```ts
import { effect, signal } from '@angular/core'

const count = signal(0)

effect(() => {
  console.log('count is:', count())   // 自动追踪依赖
})

count.set(1)   // 触发 effect，打印 "count is: 1"
```

::: warning `effect` 不能在 effect 内修改 signal
默认情况下，在 `effect` 内调用 `signal.set()` / `signal.update()` 会抛 `ERROR RuntimeError: NG0600`。需要时显式 `effect(fn, { allowSignalWrites: true })`，但通常这意味着设计有问题。
:::

### 组件内的 signals

```ts
@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <p>Doubled: {{ doubled() }}</p>
    <button (click)="increment()">+1</button>
  `,
})
export class Counter {
  count = signal(0)
  doubled = computed(() => this.count() * 2)

  increment() {
    this.count.update(c => c + 1)
  }

  constructor() {
    // effect 必须在「injection context」内创建（构造函数 / 工厂函数 / inject 调用点）
    effect(() => {
      console.log('count changed:', this.count())
    })
  }
}
```

## 模板语法基础

### 文本插值

```html
<span>Message: {{ msg }}</span>
<span>{{ ok ? 'YES' : 'NO' }}</span>
<span>{{ user.name.toUpperCase() }}</span>
```

模板表达式可以是任意 JS 表达式，但**不能写赋值语句**（除了事件处理器中）、`new`、`++` / `--`、`+=` / `-=`、`,` 等。

### 属性绑定 `[prop]`

```html
<img [src]="imageUrl" [alt]="imageAlt" />
<button [disabled]="isLoading">Submit</button>

<!-- attr.* 显式绑定 HTML 属性而非 DOM 属性 -->
<td [attr.colspan]="span"></td>

<!-- class / style 绑定 -->
<div [class.active]="isActive" [class]="cssClasses"></div>
<div [style.color]="textColor" [style.font-size.px]="fontSize"></div>
```

### 事件绑定 `(event)`

```html
<button (click)="onClick()">Click</button>
<input (input)="onInput($event)" />
<input (keyup.enter)="submit()" />  <!-- 键盘修饰符 -->

<!-- 多语句 -->
<button (click)="count = count + 1; logChange()">+1</button>
```

### 双向绑定 `[(value)]`

需要导入 `FormsModule`（template-driven）或自定义 `model()`（v17.2+）：

```ts
import { Component, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-form',
  imports: [FormsModule],
  template: `
    <input [(ngModel)]="name" />
    <p>Hello, {{ name() }}!</p>
  `,
})
export class FormCmp {
  name = signal('')
}
```

## 控制流（v17+ 新语法）

v17 之前用 `*ngIf` / `*ngFor` / `*ngSwitch` 结构指令，v17 起官方推荐**模板控制流块**：编译时知道分支边界，编译器优化更激进、bundle 更小、类型推导更准。

### `@if` / `@else if` / `@else`

```html
@if (user.role === 'admin') {
  <p>Admin Panel</p>
} @else if (user.role === 'editor') {
  <p>Editor Panel</p>
} @else {
  <p>Viewer</p>
}

<!-- 别名：把表达式结果存到变量 -->
@if (currentUser(); as user) {
  <p>Hello, {{ user.name }}</p>
}
```

### `@for`

```html
@for (item of items(); track item.id) {
  <li>{{ $index }}: {{ item.name }}</li>
} @empty {
  <p>No items</p>
}
```

**`track` 必填**——告诉 Angular 用什么作为唯一标识（对应 Vue 的 `:key`）。可用：`track item.id` / `track $index` / `track item`（引用比较）。

可用上下文变量：`$index` / `$count` / `$first` / `$last` / `$even` / `$odd`，可用 `let` 重命名：

```html
@for (item of items(); track item.id; let idx = $index, isFirst = $first) {
  <li [class.first]="isFirst">{{ idx }}: {{ item.name }}</li>
}
```

### `@switch` / `@case` / `@default`

```html
@switch (user.role) {
  @case ('admin') { <admin-panel /> }
  @case ('editor') { <editor-panel /> }
  @default { <viewer-panel /> }
}
```

使用**严格相等** `===` 比较，无 fallthrough（无需 `break`）。

### `@defer` 延迟加载

```html
@defer (on viewport) {
  <large-chart [data]="data()" />
} @placeholder {
  <div class="skeleton">Loading...</div>
} @loading (minimum 200ms) {
  <spinner />
} @error {
  <p>Failed to load</p>
}
```

触发条件：`idle`（默认）/ `viewport` / `interaction` / `hover` / `immediate` / `timer(500ms)` / `when condition`。

`@defer` 在编译期生成单独的 chunk，触发时才下载组件代码——非常适合首屏外的大组件。

## Angular CLI 常用命令

| 命令 | 简写 | 用途 |
|------|------|------|
| `ng new <name>` | - | 创建新工作空间 |
| `ng serve` | `ng s` | 启动开发服务器（默认 4200） |
| `ng build` | `ng b` | 构建到 `dist/` |
| `ng test` | `ng t` | 运行单元测试 |
| `ng e2e` | `ng e` | 运行 E2E 测试 |
| `ng generate component <name>` | `ng g c` | 生成组件 |
| `ng generate service <name>` | `ng g s` | 生成服务 |
| `ng generate directive <name>` | `ng g d` | 生成指令 |
| `ng generate pipe <name>` | `ng g p` | 生成管道 |
| `ng generate guard <name>` | `ng g g` | 生成路由守卫 |
| `ng generate interceptor <name>` | `ng g i` | 生成 HTTP 拦截器 |
| `ng add <package>` | - | 安装并自动配置 schematic |
| `ng update` | - | 列出可升级依赖；`ng update @angular/core` 升级并自动迁移 |
| `ng version` | `ng v` | 显示版本 |
| `ng lint` | - | 运行 ESLint（需先 `ng add @angular-eslint/schematics`） |

示例：

```bash
# 生成功能模块
ng g c features/user-list           # → src/app/features/user-list/
ng g s services/auth                # → src/app/services/auth.ts

# 加 standalone 路由守卫（v15+ 默认函数式）
ng g g guards/auth --functional

# 安装 Angular Material（自动配置 + 加主题）
ng add @angular/material

# 升级到下一个大版本
ng update @angular/core @angular/cli
```

## DevTools

[Angular DevTools](https://angular.dev/tools/devtools) 是 Chrome / Edge 扩展，提供：

- **组件树**：查看 standalone / module 组件树、props、signals、injector
- **性能分析**：变更检测耗时火焰图
- **Profiler**：Zone 任务 / 渲染时间 / change detection 计数
- **路由 inspector**：当前激活路由 / 参数 / data / 守卫
- **DI 树**：每个组件 / 服务的依赖来源

::: tip Chrome DevTools 协议
Angular CLI 21+ 已经把 Chrome DevTools 集成进了 `ng serve` 工作流——在 DevTools 里直接看 Angular 组件名、signal 值、afterNextRender 钩子，无需安装扩展。

```bash
ng serve --hmr   # 默认开 HMR + DevTools 接入
```
:::

## 一份能跑的最小示例

```
my-app/
├── src/
│   ├── app/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.ts
│   │   ├── app.html
│   │   ├── pages/home.ts
│   │   ├── pages/user.ts
│   │   └── services/counter.ts
│   ├── main.ts
│   └── styles.scss
├── angular.json
└── package.json
```

```ts
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser'
import { App } from './app/app'
import { appConfig } from './app/app.config'

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err))
```

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
  ],
}
```

```ts
// src/app/app.routes.ts
import { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then(m => m.Home) },
  { path: 'user/:id', loadComponent: () => import('./pages/user').then(m => m.User) },
]
```

```ts
// src/app/services/counter.ts
import { Injectable, computed, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class CounterService {
  // 私有 writable + 公开 readonly
  private _count = signal(0)
  readonly count = this._count.asReadonly()
  readonly doubled = computed(() => this._count() * 2)

  increment() {
    this._count.update(c => c + 1)
  }
}
```

```ts
// src/app/pages/home.ts
import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CounterService } from '../services/counter'

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <h1>Home</h1>
    <p>Count: {{ counter.count() }} (×2 = {{ counter.doubled() }})</p>
    <button (click)="counter.increment()">+1</button>
    <a routerLink="/user/42">Go User 42</a>
  `,
})
export class Home {
  // inject() 函数式注入（v14+，推荐）
  counter = inject(CounterService)
}
```

```ts
// src/app/pages/user.ts
import { Component, input } from '@angular/core'

@Component({
  selector: 'app-user',
  template: `<h1>User {{ id() }}</h1>`,
})
export class User {
  // 与 withComponentInputBinding() 配合，路由参数自动注入
  id = input<string>()
}
```

```ts
// src/app/app.ts
import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {}
```

`pnpm start` → 浏览器 `http://localhost:4200` 看到 Home → 点链接进 User 页 → 计数器服务全局共享。

## 下一步

- 组件 / 模板 / 表单 / 双向绑定 / 生命周期详见 [指南 - 基础](./guide-line/base.md)
- DI / 路由 / HTTP / RxJS / 测试 / 状态管理详见 [指南 - 进阶](./guide-line/advanced.md)
- Signals 内部 / Zoneless / SSR / 编译器 / 性能 / 微前端详见 [指南 - 高级](./guide-line/expert.md)
- 与生态集成（Nx / Ionic / Material / NG-ZORRO / Tailwind）详见 [指南 - 其他](./guide-line/other.md)
- 全 API + 装饰器 + Signals + Pipes + CLI 速查见 [参考](./reference.md)
