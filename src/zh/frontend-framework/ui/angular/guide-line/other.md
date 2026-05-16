---
layout: doc
outline: [2, 3]
---

# 指南 - 其他

> 基于 Angular 21.x 编写 —— 与生态集成、移动端、组件库、AngularJS 升级、Storybook

## 速查

- Monorepo：[Nx](https://nx.dev/)（事实标准）/ [Lerna](https://lerna.js.org/) / pnpm workspace
- 移动端：[Ionic + Capacitor](https://ionicframework.com/)（推荐）/ NativeScript（已下滑）
- 桌面：Electron + Angular / Tauri + Angular
- UI 库：[Angular Material](https://material.angular.io/)（官方）/ [PrimeNG](https://primeng.org/) / [NG-ZORRO](https://ng.ant.design/)（Ant Design）/ [Clarity](https://clarity.design/)（VMware）
- Tailwind：`ng add @ngneat/tailwind` 或手动配置
- UnoCSS：`ng add unocss`（社区 schematic）/ 手动加 PostCSS
- Storybook：`ng add @storybook/angular`
- 从 AngularJS（v1.x）升级：`@angular/upgrade` 双引擎共存 → 渐进式替换

## Nx 集成（Monorepo）

[Nx](https://nx.dev/) 是 Nrwl（Angular 早期核心团队成员创办）的 monorepo 工具，深度集成 Angular CLI。

### 创建 Nx 工作空间

```bash
pnpm dlx create-nx-workspace@latest my-org --preset=angular-standalone
# 或 multi-app preset
pnpm dlx create-nx-workspace@latest my-org --preset=angular-monorepo
```

```
my-org/
├── apps/
│   ├── web/                     # Angular 应用
│   └── admin/                   # 另一个 Angular 应用
├── libs/
│   ├── ui/                      # 共享组件库
│   ├── data-access/             # API services
│   └── feature-auth/            # 业务模块
├── nx.json                      # Nx 配置
└── package.json
```

### Nx 关键命令

```bash
# 创建库
nx g @nx/angular:lib ui

# 创建组件到 lib
nx g @nx/angular:component button --project=ui --standalone

# 构建特定项目
nx build web

# 运行特定项目
nx serve web

# 影响图分析（只跑变更影响的项目）
nx affected:test
nx affected:lint
nx affected:build

# 可视化依赖图
nx graph
```

### Tag-based Dependency Constraints

`project.json` 加 tag：

```json
{ "tags": ["scope:web", "type:feature"] }
```

`eslint.config.js`：

```js
{
  '@nx/enforce-module-boundaries': ['error', {
    depConstraints: [
      { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:data-access', 'type:ui', 'type:util'] },
      { sourceTag: 'scope:web', onlyDependOnLibsWithTags: ['scope:web', 'scope:shared'] },
    ],
  }],
}
```

防止层级混乱（如 ui lib 误依赖 feature lib）。

### Nx Cloud（增量缓存）

```bash
nx connect-to-nx-cloud
```

构建 / 测试结果上传到 Nx Cloud，CI 命中缓存时秒级返回。免费 tier 够中小团队用。

## Ionic（移动端 / 桌面）

[Ionic](https://ionicframework.com/) 是基于 Web Components 的跨平台 UI 框架，原生支持 Angular。

### 创建 Ionic + Angular 项目

```bash
pnpm dlx @ionic/cli@latest start my-app blank --type=angular --capacitor
cd my-app
ionic serve         # 在浏览器调试
```

### 加 Capacitor 平台

[Capacitor](https://capacitorjs.com/) 是 Ionic 官方的原生桥（取代旧 Cordova）：

```bash
ionic cap add ios
ionic cap add android

ionic cap sync      # 同步 web 资源到原生项目
ionic cap run ios   # 在 Xcode 跑
ionic cap run android
```

### 使用 Ionic 组件

```ts
import { Component } from '@angular/core'
import { IonicModule } from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { home, settings } from 'ionicons/icons'

@Component({
  selector: 'app-home',
  imports: [IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        @for (item of items; track item) {
          <ion-item>
            <ion-icon name="home" slot="start" />
            <ion-label>{{ item }}</ion-label>
          </ion-item>
        }
      </ion-list>
      <ion-fab vertical="bottom" horizontal="end">
        <ion-fab-button (click)="add()">
          <ion-icon name="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
})
export class Home {
  items = ['Apple', 'Banana']

  constructor() {
    addIcons({ home, settings })
  }

  add() {
    this.items.push(`Item ${this.items.length + 1}`)
  }
}
```

::: tip Ionic 7+ Standalone
Ionic 7 起组件是基于 Web Components 的 standalone 组件，不再依赖 NgModule。导入方式从 `@ionic/angular` 切到 `@ionic/angular/standalone`：

```ts
// app.config.ts
import { provideIonicAngular } from '@ionic/angular/standalone'

export const appConfig: ApplicationConfig = {
  providers: [provideIonicAngular()],
}
```
:::

## NativeScript + Angular（已下滑）

[NativeScript](https://nativescript.org/) 让 Angular 直接渲染原生 iOS / Android UI（非 WebView）。2020 年后被 React Native + Capacitor 蚕食，社区活跃度大幅下降，**不推荐新项目用**。

历史价值：早期想用 Angular 写真正原生 App 的唯一选择。

## Tailwind CSS 集成

### 手动配置

```bash
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init
```

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: { extend: {} },
  plugins: [],
}
```

```scss
// src/styles.scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```html
<button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click
</button>
```

### Tailwind 4（CSS-first 配置）

```scss
/* styles.css */
@import "tailwindcss";

@theme {
  --color-primary: #dd0031;
}
```

无需 `tailwind.config.js`。

::: tip Angular 17+ 默认 esbuild + Vite
旧 ng add 用的 schematic 是针对 webpack 的，新项目可以直接手装 Tailwind，esbuild 自动处理 PostCSS。
:::

## UnoCSS 集成

[UnoCSS](https://unocss.dev/) 是 Anthony Fu 的原子 CSS 引擎，兼容 Tailwind 语法但更快。

```bash
pnpm add -D unocss
```

```ts
// uno.config.ts
import { defineConfig, presetWind, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetWind(),
    presetIcons({ scale: 1.2 }),
  ],
  content: {
    pipeline: {
      include: [/\.(html|ts)($|\?)/],
    },
  },
})
```

```ts
// main.ts
import 'virtual:uno.css'
```

需要让 Angular CLI 走 Vite（v17+ 默认）才能用 `virtual:uno.css`。esbuild builder 需要加 [@unocss/postcss](https://unocss.dev/integrations/postcss)。

## Storybook

```bash
ng add @storybook/angular
```

会自动配置 `.storybook/` 和 `*.stories.ts` 模板。

### 编写 story

```ts
// src/app/components/button.stories.ts
import type { Meta, StoryObj } from '@storybook/angular'
import { Button } from './button'

const meta: Meta<Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger'] },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<Button>

export const Primary: Story = {
  args: {
    label: 'Primary',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    label: 'Secondary',
    variant: 'secondary',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    disabled: true,
  },
}
```

```bash
pnpm storybook       # 启动 Storybook（默认 6006）
pnpm build-storybook # 构建静态站
```

## Angular Material

```bash
ng add @angular/material
# 交互式询问 Material 3 theme / typography / animations
```

```ts
// app.config.ts（已自动加）
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'

export const appConfig: ApplicationConfig = {
  providers: [provideAnimationsAsync()],
}
```

### 使用组件（v17+ standalone）

```ts
import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatCardModule, MatInputModule, MatFormFieldModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Sign In</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput type="password" />
        </mat-form-field>
      </mat-card-content>
      <mat-card-actions>
        <button mat-flat-button color="primary">Login</button>
        <button mat-button>Cancel</button>
      </mat-card-actions>
    </mat-card>
  `,
})
export class Login {}
```

::: tip Material 3（M3）支持
Angular Material v18+ 默认基于 Material Design 3，主题用 SCSS mixin：

```scss
@use '@angular/material' as mat;

html {
  @include mat.theme((
    color: (
      primary: mat.$violet-palette,
      tertiary: mat.$cyan-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}
```
:::

### Angular CDK（无样式组件层）

[Angular CDK](https://material.angular.io/cdk/categories) 提供大量「无样式行为模块」：

- `@angular/cdk/overlay` — Portal / Overlay
- `@angular/cdk/drag-drop` — 拖拽
- `@angular/cdk/scrolling` — 虚拟滚动
- `@angular/cdk/a11y` — 可访问性（focus trap / aria-live）
- `@angular/cdk/clipboard` — 剪贴板
- `@angular/cdk/dialog` — 对话框
- `@angular/cdk/menu` — 菜单
- `@angular/cdk/testing` — 测试 Harness

可以独立用（不依赖 Material 主题），是 React 生态 Radix UI / Headless UI 的对应物。

```bash
pnpm add @angular/cdk
```

```ts
// 虚拟滚动示例
import { ScrollingModule } from '@angular/cdk/scrolling'

@Component({
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" style="height: 500px">
      @for (item of items; track item.id) {
        <div class="item">{{ item.name }}</div>
      }
    </cdk-virtual-scroll-viewport>
  `,
})
```

10000 条数据丝滑滚动。

## PrimeNG

[PrimeNG](https://primeng.org/) 是企业级 UI 库，组件数量最多（80+），覆盖 DataTable / TreeTable / 图表等高级场景。

```bash
pnpm add primeng
```

```ts
// app.config.ts
import { providePrimeNG } from 'primeng/config'
import Aura from '@primeng/themes/aura'

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: { preset: Aura, options: { darkModeSelector: '.dark' } },
    }),
  ],
}
```

```ts
// 使用
import { ButtonModule } from 'primeng/button'
import { TableModule } from 'primeng/table'

@Component({
  imports: [ButtonModule, TableModule],
  template: `
    <p-table [value]="users" [paginator]="true" [rows]="10">
      <ng-template pTemplate="header">
        <tr>
          <th>ID</th><th>Name</th><th>Email</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-user>
        <tr>
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
        </tr>
      </ng-template>
    </p-table>
    <p-button label="Add" icon="pi pi-plus" />
  `,
})
```

## NG-ZORRO（Ant Design for Angular）

[NG-ZORRO](https://ng.ant.design/) 是阿里出品的 Angular UI 库，移植自 Ant Design。国内项目使用率最高之一。

```bash
ng add ng-zorro-antd
```

```ts
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzTableModule } from 'ng-zorro-antd/table'

@Component({
  imports: [NzButtonModule, NzTableModule],
  template: `
    <button nz-button nzType="primary">Primary</button>
    <nz-table #table [nzData]="users" nzPageSize="10">
      <thead>
        <tr><th>ID</th><th>Name</th></tr>
      </thead>
      <tbody>
        @for (user of table.data; track user.id) {
          <tr><td>{{ user.id }}</td><td>{{ user.name }}</td></tr>
        }
      </tbody>
    </nz-table>
  `,
})
```

## VMware Clarity

[Clarity](https://clarity.design/) 是 VMware 的 Angular 优先 UI 库，针对企业级管理后台。社区相对小但设计严谨。

```bash
pnpm add @clr/angular @clr/ui @clr/icons
```

## 从 AngularJS（v1.x）升级

如果你接手 AngularJS 1.x 老项目，**直接重写到 Angular**（v2+）是常见选择。但渐进式策略也可行：

### `@angular/upgrade` 双引擎共存

```bash
pnpm add @angular/upgrade
```

```ts
import { downgradeComponent, UpgradeModule } from '@angular/upgrade/static'

// 1. 把 AngularJS module 包成 Angular 启动入口
@NgModule({
  imports: [BrowserModule, UpgradeModule],
})
class AppModule {
  ngDoBootstrap() {}
}

platformBrowserDynamic().bootstrapModule(AppModule).then(ref => {
  const upgrade = ref.injector.get(UpgradeModule)
  upgrade.bootstrap(document.body, ['legacyApp'])
})

// 2. 把 Angular 组件降级为 AngularJS directive
angular.module('legacyApp')
  .directive('appNew', downgradeComponent({ component: NewCmp }))
```

```ts
// 3. 把 AngularJS service 升级到 Angular DI
import { downgradeInjectable } from '@angular/upgrade/static'

angular.module('legacyApp')
  .factory('NewService', downgradeInjectable(NewService))
```

策略：
1. 新功能用 Angular 写，通过 `downgradeComponent` 嵌入老页面
2. 老 service 逐个迁移到 Angular，`downgradeInjectable` 让 AngularJS 老代码继续可用
3. 老页面逐个替换，最后移除 AngularJS

### 现实建议

AngularJS 1.x 已 EOL（2022.1），任何新功能都不再获得官方支持。如果项目规模 < 5 万行，**建议直接重写**：

- 工时通常比渐进迁移短（双引擎调试成本高）
- 类型安全 / 性能 / 工具链全面碾压旧版
- 一刀切重写时机会一并重构旧的架构债

## 服务器渲染（SSR）平台

### Angular Universal（已合并到 `@angular/ssr`）

历史上 SSR 由独立的 `@angular/universal` 包提供。v17+ 起，SSR / SSG / Prerender 已经统一到 `@angular/ssr`，老的 `@angular/universal` 包标记为 deprecated。

`ng add @angular/ssr` 就是入口（详见 [指南 - 高级](./expert.md#server-side-rendering-ssr) 章节）。

### Analog（社区元框架）

[Analog](https://analogjs.org/) 是 Brandon Roberts（Angular GDE）做的「**Angular 的 Next.js**」——基于 Vite，提供：

- 文件路由（`src/app/pages/` 自动生成 routes）
- API 路由（`src/server/routes/`）
- Markdown SSG（适合写博客）
- 内置 Vitest

```bash
pnpm create analog@latest my-app
```

适合纯 Angular 全栈站点 / 静态博客。生产采用率仍较低，但活跃维护。

## 桌面应用

### Electron + Angular

```bash
ng new desktop-app
cd desktop-app
pnpm add -D electron electron-builder
```

```js
// electron/main.js
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({ width: 1200, height: 800 })
  win.loadFile(path.join(__dirname, '../dist/desktop-app/browser/index.html'))
}

app.whenReady().then(createWindow)
```

### Tauri + Angular

[Tauri](https://tauri.app/) 用系统 WebView + Rust 后端，bundle 大小约为 Electron 的 1/10。

```bash
pnpm create tauri-app@latest my-app
# 选择 Angular template
```

适合体积敏感的桌面工具。

## 浏览器扩展

直接用 Angular CLI 输出静态文件，配 `manifest.json` 即可作为 Chrome 扩展。

```bash
ng new ext --skip-tests --routing=false
ng build --configuration=production
```

```json
// manifest.json
{
  "manifest_version": 3,
  "name": "My Ext",
  "version": "1.0",
  "action": { "default_popup": "index.html" }
}
```

复制 `dist/ext/browser/` 内容到扩展目录加载即可。

## Web Components 集成

详见 [指南 - 高级 / Angular Elements](./expert.md#angular-elements-编译为-web-component)。简言之：

```ts
import { createCustomElement } from '@angular/elements'

const el = createCustomElement(MyCmp, { injector })
customElements.define('my-cmp', el)
```

任意 HTML / 别的框架（React / Vue / Svelte）都能用 `<my-cmp />` 调用 Angular 组件。

## 表单库扩展

### `@ngneat/reactive-forms`

更类型友好的 reactive form 替代品（v14 之前流行）。Angular 14 起官方 Typed Forms 已经能力足够，**新项目不再需要**。

### `@ngneat/forms-manager`

跨组件 / 路由的表单状态持久化（草稿保存 / 跨页面恢复）。

### `formly`

[Formly](https://formly.dev/) 是 schema-driven 表单库——用 JSON 配置生成完整表单：

```ts
fields: FormlyFieldConfig[] = [
  {
    key: 'name',
    type: 'input',
    props: { label: 'Name', required: true },
  },
  {
    key: 'email',
    type: 'input',
    props: { label: 'Email', type: 'email', required: true },
  },
]
```

适合后台管理系统（大量类似的 CRUD 表单）。

## 图表

### NGX-Charts

[ngx-charts](https://swimlane.github.io/ngx-charts/) 基于 D3.js 的 Angular 包装。响应式 / 主题化 / 服务端友好。

### ECharts + ngx-echarts

```bash
pnpm add echarts ngx-echarts
```

```ts
import { NgxEchartsModule } from 'ngx-echarts'

@Component({
  imports: [NgxEchartsModule],
  template: `
    <div echarts [options]="chartOptions" style="height: 400px"></div>
  `,
})
export class Chart {
  chartOptions = {
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [10, 22, 33] }],
  }
}
```

Apache ECharts 在国内非常流行，组件库生态最丰富。

### Plotly / Chart.js / D3 直接用

```bash
pnpm add chart.js
```

```ts
import { afterNextRender } from '@angular/core'
import Chart from 'chart.js/auto'

@Component({ /* ... */ })
export class ChartCmp {
  constructor() {
    afterNextRender(() => {
      new Chart(this.canvas.nativeElement, { /* ... */ })
    })
  }
}
```

`afterNextRender` 保证 SSR 安全。

## 动画系统

### `@angular/animations`（经典）

```bash
pnpm add @angular/animations
```

```ts
import { trigger, state, style, transition, animate } from '@angular/animations'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'

// app.config.ts
providers: [provideAnimationsAsync()]
```

```ts
@Component({
  animations: [
    trigger('openClose', [
      state('open', style({ height: '200px', opacity: 1 })),
      state('closed', style({ height: 0, opacity: 0 })),
      transition('open <=> closed', animate('300ms ease-in-out')),
    ]),
  ],
  template: `
    <button (click)="open = !open">Toggle</button>
    <div [@openClose]="open ? 'open' : 'closed'">Content</div>
  `,
})
```

::: tip Angular 动画系统在缩水
官方 v18+ 已经在轻量化动画系统（`provideAnimationsAsync()` 替代旧 `provideAnimations()`），逐步推荐用：

1. **CSS 动画 / `@starting-style`**（现代浏览器原生）
2. **View Transitions API**（路由切换：`withViewTransitions()`）
3. **Web Animations API**（细粒度控制）

复杂场景用 [GSAP](https://gsap.com/) / [Motion](https://motion.dev/)。
:::

## E2E 测试框架

### Cypress

```bash
ng add @cypress/schematic
```

```ts
// cypress/e2e/home.cy.ts
describe('Home', () => {
  it('shows counter', () => {
    cy.visit('/')
    cy.contains('Count: 0')
    cy.get('button').contains('+1').click()
    cy.contains('Count: 1')
  })
})
```

### Playwright

```bash
pnpm add -D @playwright/test
pnpm dlx playwright install
```

```ts
// e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test('shows counter', async ({ page }) => {
  await page.goto('http://localhost:4200/')
  await expect(page.getByText('Count: 0')).toBeVisible()
  await page.getByRole('button', { name: '+1' }).click()
  await expect(page.getByText('Count: 1')).toBeVisible()
})
```

Playwright 速度 / 跨浏览器 / Debug 体验都比 Cypress 好，社区采用率快速上升。

## Lint / 格式化

### ESLint

```bash
ng add @angular-eslint/schematics
```

```bash
ng lint                          # 跑 lint
ng lint --fix                     # 自动修
```

`@angular-eslint` 提供 Angular 特定规则：
- `@angular-eslint/no-empty-lifecycle-method`
- `@angular-eslint/use-pipe-transform-interface`
- `@angular-eslint/template/no-distracting-elements`

### Prettier

```bash
pnpm add -D prettier eslint-config-prettier
```

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all"
}
```

```bash
pnpm dlx prettier --write src/
```

## CI / CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm ng lint
      - run: pnpm ng test --watch=false --browsers=ChromeHeadless
      - run: pnpm ng build
```

### Nx Affected（monorepo）

```yaml
- run: pnpm nx affected:test --base=origin/main --head=HEAD
- run: pnpm nx affected:build --base=origin/main --head=HEAD
```

只跑变更影响的项目，CI 时间显著降低。

## 自定义 Schematics

```bash
pnpm dlx @angular-devkit/schematics-cli blank --name=my-schematic
cd my-schematic
```

```ts
// src/my-feature/index.ts
import { Rule, Tree } from '@angular-devkit/schematics'

export function myFeature(options: { name: string }): Rule {
  return (tree: Tree) => {
    tree.create(`${options.name}.ts`, `export const ${options.name} = 1\n`)
    return tree
  }
}
```

```json
// src/collection.json
{
  "schematics": {
    "my-feature": {
      "factory": "./my-feature/index#myFeature",
      "schema": "./my-feature/schema.json"
    }
  }
}
```

```bash
ng add ./my-schematic
ng generate my-schematic:my-feature --name=foo
```

公司内可以做出标准化的「新增页面」/「新增服务」schematic，结合 lint 强制团队风格统一。

## TypeScript 配置（高级）

`tsconfig.json` 推荐设置：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true,
    "useDefineForClassFields": false,    // Angular 必须 false（与装饰器冲突）
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "isolatedModules": true,
    "skipLibCheck": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInputAccessModifiers": true,
    "strictDomEventTypes": true,
    "strictNullInputTypes": true
  }
}
```

## 一份 Nx + Angular Material + Storybook 完整模板

推荐起手：

```bash
pnpm dlx create-nx-workspace@latest acme \
  --preset=angular-monorepo \
  --appName=web \
  --style=scss \
  --bundler=esbuild \
  --ssr=false \
  --pm=pnpm

cd acme
nx g @nx/angular:lib ui --standalone
nx g @nx/angular:lib data-access --standalone

ng add @angular/material
ng add @storybook/angular --project=ui

nx serve web
```

这样会得到：
- `apps/web` — 主应用
- `libs/ui` — 共享组件库 + Storybook
- `libs/data-access` — API 服务
- `nx.json` — 构建任务编排
- Material 3 + esbuild + Vitest 全套

## 下一步

- API 速查见 [参考](../reference.md)
