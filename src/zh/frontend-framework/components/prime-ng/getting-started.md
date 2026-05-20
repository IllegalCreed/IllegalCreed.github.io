---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **PrimeNG v20**（截至 2026 年 5 月最新稳定 **v20.x**；要求 **Angular 20+** + **Node 20+**，**v17 → v20 主题系统经过 3 次重构**——v17 / v18 / v19 项目升级到 v20 需调整主题 import 路径、CSS 变量前缀和部分组件 prop）。

## 速查

- 系统要求：**Angular 20+**（推荐最新稳定 Angular major） + **Node 20+** + 推荐 **TypeScript 5+**
- 浏览器：现代浏览器（Chrome / Edge / Firefox / Safari 最新两个版本），**不支持 IE**
- 安装：`pnpm add primeng @primeuix/themes`（**两个包都要装**，主包 + 主题包）
- 图标包：`pnpm add primeicons`（PrimeIcons 官方图标库，250+ 图标 + `pi pi-*` 类前缀）
- 主题预设：`@primeuix/themes` 提供 **Aura / Material / Lara / Nora** 4 大预设（**v20 新路径，与 v17 内置 Less 不同**）
- 必装：`provideAnimationsAsync()` + `providePrimeNG({ theme: { preset: Aura } })` 在 `app.config.ts` providers 中
- Tailwind 插件：`pnpm add -D tailwindcss-primeui`（语义化色板工具类，与 PrimeVue 共用）
- 命令式 API：`ConfirmationService` / `MessageService` / `DialogService` —— **标准 Angular DI 服务**，配合占位组件（`<p-toast />` / `<p-confirmdialog />`）
- 国内镜像：`npm config set registry https://registry.npmmirror.com`
- 组件命名：所有组件 **kebab-case + `p-` 前缀**（`<p-button>` / `<input pInputText>` / `<p-table>` / `<p-select>`）—— 与 PrimeVue PascalCase 不同
- Standalone 默认：Angular 17+ standalone API、**v20 全 standalone-only**、`imports: [ButtonModule]` 按组件按需引入

## PrimeNG 是什么

PrimeNG 是 **土耳其公司 PrimeTek**（自 2008 年起做 PrimeFaces）旗下 Angular 组件库 —— **国外 Angular UI 生态组件最丰富、欧美企业级应用最主流**的选择。理解 PrimeNG 必须先理解它的 **设计哲学**：

- **欧美主流 + 商业全家桶**：PrimeTek 同时维护 **PrimeReact / PrimeNG / PrimeFaces / PrimeVue** 全家桶 —— 跨 React / Angular / Vue 的统一设计语言、商业模板 Apollo / Genesis / Diamond / Avalon / Sapphire
- **80+ 组件 + 含稀有组件**：业内 Angular 组件数最多 —— 含 **OrganizationChart / Galleria / TreeTable / Editor / Chart / Knob / SpeedDial / MeterGroup** 等其他 Angular UI 库少见组件
- **v20 主题系统**：基于 `@primeuix/themes`（**与 PrimeVue 4 / PrimeReact 共享同一份主题底座**）—— `Aura` / `Material` / `Lara` / `Nora` 4 大预设 + Design Token 三层结构 + 运行时切换 + `definePreset` 自定义
- **Styled + Unstyled 两种模式**：默认 Styled、可切到 Unstyled 配合 Tailwind 完全自由
- **PassThrough (`pt`) 革命**：穿透到组件任意内部 DOM 元素 —— **业内最强的 Angular UI 库定制 API**
- **截至 2026 年的 v20.x**：进入「**成熟稳定期**」—— v17 / v18 / v19 / v20 跟随 Angular major 同步

PrimeNG 与 Angular Material / NG-ZORRO 的本质差异：

| 维度 | PrimeNG | Angular Material | NG-ZORRO | Taiga UI |
|---|---|---|---|---|
| 阵营 | PrimeTek（商业 + 开源） | Google 官方 | 阿里 + 社区 | Tinkoff（俄罗斯银行）|
| 国家 | **土耳其** | 美国 | 中国 | 俄罗斯 |
| 国外市场份额 | **最高（欧美主流）** | 高（Material 严格） | 低 | 中（Tinkoff 系）|
| 国内市场份额 | **极低** | 中 | **断层第一** | 极低 |
| 组件数 | **80+（Angular 最多）** | 30+ | 70+ | 130+ |
| 稀有组件 | **OrgChart / Editor / Chart / Knob** | 较少 | 较少 | 中等 |
| 主题系统 | **Design Token + 4 大预设** | Material Component Tokens | Less Variables + CSS Var | CSS Custom Properties |
| Unstyled 模式 | **是（业内独家）** | 否 | 否 | 否 |
| Tailwind 集成 | **是（官方 tailwindcss-primeui）** | 第三方 | 第三方 | 第三方 |
| 自定义 API | **`pt` PassThrough（最强）** | `::ng-deep` + Mixin | `NzConfigService` | CSS Variables |
| Standalone 默认 | v17+ 是 / v20 全 standalone | v15+ 是 | v15+ 是 | v18+ 是 |
| 中文文档 | **无（仅英文）** | 部分 | **官方完整** | 部分 |
| 招聘市场 | 海外 | 海外 + 国内 | **国内绝对主流** | 俄语圈 |

**含义**：

- PrimeNG **海外最主流、Angular 组件最多、定制最强 + Tailwind 集成最好** —— 是 **海外 SaaS / 跨境项目 / 重型 Dashboard / Tailwind 项目** 的最佳 Angular 选择
- **不适合**：国内项目（除非有 PrimeReact / PrimeVue 经验）/ 必须中文文档 / 严格 Material 风格（用 Angular Material）
- **适合**：海外 / 跨境业务 / 与 PrimeReact / PrimeVue 共栈 / 需要 80+ 组件覆盖业务 / Tailwind 重度用户 / 设计师有自由度需求 / 商业级 SaaS Dashboard

## 安装与首次启动

### 创建 Angular 项目

如果**还没有 Angular 项目**，先创建一个：

```bash
# 全局安装 Angular CLI（如已装可跳过）
pnpm add -g @angular/cli

# 创建 standalone 项目（v17+ 默认 standalone）
ng new my-primeng-app --standalone --routing --style=scss
cd my-primeng-app
```

交互式菜单建议：

```
Which stylesheet format would you like to use? SCSS
Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)? No (或 Yes 看需要)
```

> 完成后已有完整 Angular 20+ standalone 项目骨架——下一步**单独装 PrimeNG**。Angular CLI 不带 PrimeNG 选项（不像 NG-ZORRO 有 `ng add ng-zorro-antd`）。

### 安装 PrimeNG 包

```bash
# 主包 + 主题（两个都要）
pnpm add primeng @primeuix/themes
```

| 库 | 用途 | 必需 |
|---|---|---|
| `primeng` | 主组件库（80+ 组件） | **必需** |
| `@primeuix/themes` | 主题预设（Aura / Material / Lara / Nora） | **必需**（Styled mode） |
| `primeicons` | PrimeIcons 图标包（250+ 图标） | **强烈推荐** |
| `tailwindcss-primeui` | Tailwind 集成插件 | 仅用 Tailwind 时 |

Angular 版本要求：

| Angular 版本 | PrimeNG 版本 |
|---|---|
| **Angular 20** | **PrimeNG v20**（推荐） |
| Angular 19 | PrimeNG v19 |
| Angular 18 | PrimeNG v18 |
| Angular 17 | PrimeNG v17 |
| Angular &lt;=16 | PrimeNG &lt;=v16（NgModule API） |

> **`@primeuix/themes` 是 PrimeNG v18+ 全新主题包**——v17 是内置 Less 主题（`primeng/resources/themes/...`）、v18+ 是设计令牌 TS 对象（`@primeuix/themes/aura`）。**v17 → v20 主题系统经过 3 次重构**：v17 内置 Less → v18 引入 `@primeng/themes` → v19 默认 CSS Layer + 三层 token → v20 整合 `@primeuix/themes`（与 PrimeVue / PrimeReact 共享）。

### 安装 PrimeIcons

PrimeNG 默认配套图标库是 **PrimeIcons**（250+ 图标）——必须装 + 导入 CSS：

```bash
pnpm add primeicons
```

### 国内镜像加速

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm 用户同样需要**——pnpm 默认走 npm registry。`@primeuix/themes` / `primeicons` 等都通过 npm registry 分发。

## 配置 PrimeNG Providers

PrimeNG v20 用 **`providePrimeNG`** + **`provideAnimationsAsync`** 标准 Angular 17+ Standalone API 注册。

### app.config.ts（极简配置）

```ts
import { ApplicationConfig } from '@angular/core'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideRouter } from '@angular/router'
import { providePrimeNG } from 'primeng/config'
import Aura from '@primeuix/themes/aura'

import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // 1. 异步注册动画（Angular 17+ 推荐方式）
    provideAnimationsAsync(),
    // 2. 注册 PrimeNG（必须传 theme.preset）
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',                          // CSS 变量前缀（默认 p）
          darkModeSelector: 'system',           // 'system' / '.my-app-dark' / false
          cssLayer: false,                      // 是否启用 CSS @layer（Tailwind 共存时建议开）
        },
      },
    }),
  ],
}
```

> **关键概念**：
>
> 1. **`providePrimeNG` 必须搭配 `provideAnimationsAsync()`** —— PrimeNG 大量组件依赖 Angular Animations、必须注册
> 2. **`@primeuix/themes/aura` 是 v20 主题路径** —— v17 的 `primeng/resources/themes/aura-light-blue/theme.css` **已废弃**
> 3. **`darkModeSelector: 'system'`** 自动跟随 OS 偏好；**`'.my-app-dark'`** 手动 class 切换；**`false`** 禁用暗色
> 4. **`cssLayer: false`** 默认；与 Tailwind 共存时强烈建议开（见 Tailwind 章节）

### styles.scss（导入 PrimeIcons）

```scss
/* src/styles.scss */
@import "primeicons/primeicons.css";

/* 可选：自定义全局样式 */
body {
  margin: 0;
  font-family: 'Inter', sans-serif;
}
```

> **PrimeIcons CSS 必须 import** —— 否则所有 `pi pi-*` 图标都不显示。可以在 `styles.scss` 全局导入、或在 `angular.json` 的 `styles` 数组里加 `"node_modules/primeicons/primeicons.css"`。

### 第一个 PrimeNG 组件

`app.component.ts`：

```ts
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { CardModule } from 'primeng/card'

@Component({
  selector: 'app-root',
  standalone: true,
  // Standalone Component 按需引入对应 Module
  imports: [FormsModule, ButtonModule, InputTextModule, CardModule],
  template: `
    <div style="padding: 24px; max-width: 600px;">
      <h1>第一个 PrimeNG 示例</h1>

      <div style="display: flex; gap: 8px; margin-bottom: 24px;">
        <p-button label="Primary" />
        <p-button label="Success" severity="success" />
        <p-button label="Warning" severity="warn" />
        <p-button label="Danger" severity="danger" />
        <p-button icon="pi pi-check" [rounded]="true" />
      </div>

      <input pInputText [(ngModel)]="value" placeholder="请输入内容" [fluid]="true" />

      <div style="margin-top: 16px;">
        <p>输入：{{ value }}</p>
      </div>

      <p-card style="margin-top: 24px;">
        <ng-template #title>欢迎使用 PrimeNG</ng-template>
        <ng-template #content>
          <p>这是一张 PrimeNG Card 卡片示例。</p>
        </ng-template>
      </p-card>
    </div>
  `,
})
export class AppComponent {
  value = ''
}
```

**这个示例覆盖**：

- `<p-button>`：按钮 + severity 主题 + icon + rounded
- `<input pInputText>`：输入框 + `[(ngModel)]` + fluid（占满宽度）
- `<p-card>`：卡片 + title slot + content slot（用 `<ng-template>`）
- 按需引入：每个组件 standalone import 对应 Module（`ButtonModule` / `InputTextModule` / `CardModule`）
- FormsModule：使用 `[(ngModel)]` 时必须 import

启动 `ng serve` —— 已经可以看到默认 Aura 主题的 PrimeNG 组件。

## Standalone Component 按需引入（v20 默认）

PrimeNG v20 **完全 Standalone**——所有组件以 `XxxModule` 形式按需引入。

### 标准用法

```ts
// 单个组件
import { ButtonModule } from 'primeng/button'

@Component({
  standalone: true,
  imports: [ButtonModule],
  template: `<p-button label="点击" />`,
})
export class MyComponent {}
```

### 多个组件

```ts
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'
import { DatePickerModule } from 'primeng/datepicker'
import { TableModule } from 'primeng/table'

@Component({
  standalone: true,
  imports: [
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TableModule,
  ],
  // ...
})
```

> **每个 PrimeNG 组件都有对应的 `XxxModule`** —— 按需引入、Tree Shaking 极致友好。**不需要 unplugin-vue-components 那种自动 import 插件**（Angular standalone 已经足够简洁）。

### 常用组件 import 路径

| 组件 | 模块路径 |
|---|---|
| Button | `primeng/button` → `ButtonModule` |
| InputText | `primeng/inputtext` → `InputTextModule` |
| Select | `primeng/select` → `SelectModule` |
| MultiSelect | `primeng/multiselect` → `MultiSelectModule` |
| DatePicker | `primeng/datepicker` → `DatePickerModule` |
| Checkbox | `primeng/checkbox` → `CheckboxModule` |
| RadioButton | `primeng/radiobutton` → `RadioButtonModule` |
| Table | `primeng/table` → `TableModule` |
| Dialog | `primeng/dialog` → `DialogModule` |
| Drawer | `primeng/drawer` → `DrawerModule` |
| Toast | `primeng/toast` → `ToastModule` |
| ConfirmDialog | `primeng/confirmdialog` → `ConfirmDialogModule` |
| DynamicDialog | `primeng/dynamicdialog` → `DynamicDialogModule` |
| Menubar | `primeng/menubar` → `MenubarModule` |
| Menu | `primeng/menu` → `MenuModule` |
| Card | `primeng/card` → `CardModule` |
| Toolbar | `primeng/toolbar` → `ToolbarModule` |

## 主题预设选择

PrimeNG v20 内置 **4 大主题预设**——通过 `@primeuix/themes` 引入（与 PrimeVue 4 共用）：

### Aura（推荐，PrimeTek 官方设计愿景）

```ts
import Aura from '@primeuix/themes/aura'

providePrimeNG({
  theme: { preset: Aura },
})
```

**特点**：现代企业 SaaS 风格、靛蓝主色、圆润边角、温和阴影——**PrimeNG v20 默认推荐**。

### Material（Google Material Design v2）

```ts
import Material from '@primeuix/themes/material'

providePrimeNG({
  theme: { preset: Material },
})
```

**特点**：严格遵循 Material Design 规范、紫色主色、Material 阴影曲线——适合追求 Material 严格性的项目。

### Lara（Bootstrap 风格）

```ts
import Lara from '@primeuix/themes/lara'

providePrimeNG({
  theme: { preset: Lara },
})
```

**特点**：基于 Bootstrap 设计语言、蓝色主色、扁平化——适合从 Bootstrap 迁移的项目。

### Nora（企业应用启发）

```ts
import Nora from '@primeuix/themes/nora'

providePrimeNG({
  theme: { preset: Nora },
})
```

**特点**：传统企业应用风格、紧凑布局、直角边框——适合传统 IT 企业应用。

### 4 大预设对比

| 预设 | 风格 | 主色 | 圆角 | 推荐场景 |
|---|---|---|---|---|
| **Aura**（默认） | 现代企业 SaaS | 靛蓝 | 中等圆角 | **新项目默认** |
| Material | Material Design | 紫色 | 圆润 | 严格 Material 风 |
| Lara | Bootstrap 风格 | 蓝色 | 扁平 | Bootstrap 迁移 |
| Nora | 传统企业应用 | 蓝色 | 直角 | 传统 IT 系统 |

## 暗色模式

PrimeNG v20 暗色模式基于 **`darkModeSelector` 选择器** —— 通过 CSS class 触发：

### 配置 darkModeSelector

```ts
// app.config.ts
providePrimeNG({
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.my-app-dark',         // 自定义类名
      // 或：
      // darkModeSelector: 'system',            // 跟随 OS 偏好（默认）
      // darkModeSelector: false,               // 禁用暗色模式
    },
  },
}),
```

| 取值 | 行为 |
|---|---|
| `'system'`（默认） | 自动跟随 OS `prefers-color-scheme: dark` |
| `'.my-app-dark'` | 在 `<html>` / `<body>` 加该 class 时启用暗色 |
| `false` | 禁用暗色模式（强制亮色） |

### 手动切换（按钮触发）

```ts
import { Component } from '@angular/core'
import { ButtonModule } from 'primeng/button'

@Component({
  selector: 'app-dark-toggle',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button label="切换暗色" (onClick)="toggleDarkMode()" />
  `,
})
export class DarkToggleComponent {
  toggleDarkMode() {
    const element = document.querySelector('html')
    element!.classList.toggle('my-app-dark')
  }
}
```

### 持久化 + 跟随系统（标准实现）

```ts
import { Component, OnInit, signal } from '@angular/core'
import { ButtonModule } from 'primeng/button'

@Component({
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button
      [label]="isDark() ? '亮色' : '暗色'"
      (onClick)="toggle()"
    />
  `,
})
export class DarkToggleComponent implements OnInit {
  // Angular Signals 状态
  isDark = signal(false)

  ngOnInit() {
    // 1. 优先读取 localStorage
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      this.isDark.set(saved === 'true')
    } else {
      // 2. 否则跟随系统
      this.isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    this.applyDark()
  }

  toggle() {
    this.isDark.update(v => !v)
    localStorage.setItem('darkMode', String(this.isDark()))
    this.applyDark()
  }

  applyDark() {
    document.documentElement.classList.toggle('my-app-dark', this.isDark())
  }
}
```

> **关键点**：
>
> 1. `providePrimeNG({ theme: { options: { darkModeSelector: '.my-app-dark' } } })` 的 selector 必须与 toggle class 完全一致
> 2. Angular Signals API（`signal()` / `update()`）是 v17+ 标准状态管理方式
> 3. SSR 项目用 `isPlatformBrowser` 守护 `document` / `localStorage` 调用

## 图标使用

PrimeNG 默认配套图标库是 **PrimeIcons**（250+ 图标） —— 必须装 + import CSS：

### 安装

```bash
pnpm add primeicons
```

### 导入 CSS

两种方式任选一种：

**方式 1：在 `src/styles.scss` 中导入**

```scss
@import "primeicons/primeicons.css";
```

**方式 2：在 `angular.json` 中配置**

```json
{
  "projects": {
    "my-primeng-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/primeicons/primeicons.css",
              "src/styles.scss"
            ]
          }
        }
      }
    }
  }
}
```

### 用法（`pi pi-*` 类名）

PrimeIcons 用 **CSS 类**（不是 Angular 组件）——所有图标都是 `<i class="pi pi-{name}">`：

```html
<!-- 直接用 <i> -->
<i class="pi pi-check"></i>
<i class="pi pi-times" style="font-size: 2rem; color: red;"></i>
<i class="pi pi-spin pi-spinner"></i>           <!-- pi-spin 旋转动画 -->

<!-- 在 PrimeNG 组件中用 icon 属性 -->
<p-button icon="pi pi-search" label="搜索" />
<p-button icon="pi pi-trash" severity="danger" [rounded]="true" />
```

### 在 Angular 中用 PrimeIcons 常量 API

```ts
import { Component } from '@angular/core'
import { PrimeIcons, MenuItem } from 'primeng/api'
import { MenubarModule } from 'primeng/menubar'

@Component({
  standalone: true,
  imports: [MenubarModule],
  template: `<p-menubar [model]="items" />`,
})
export class MyMenuComponent {
  items: MenuItem[] = [
    {
      label: 'New',
      icon: PrimeIcons.PLUS,                  // 等价于 'pi pi-plus'
    },
    {
      label: 'Delete',
      icon: PrimeIcons.TRASH,                 // 等价于 'pi pi-trash'
    },
  ]
}
```

> `PrimeIcons.PLUS` 是字符串常量 `'pi pi-plus'`、好处是 TypeScript 类型检查 + 自动补全。

### 常用图标速查

```text
pi-check / pi-times / pi-plus / pi-minus
pi-search / pi-filter / pi-sort / pi-refresh
pi-user / pi-users / pi-cog / pi-home
pi-pencil / pi-trash / pi-save / pi-undo
pi-file / pi-folder / pi-download / pi-upload
pi-eye / pi-eye-slash / pi-lock / pi-unlock
pi-arrow-up / pi-arrow-down / pi-arrow-left / pi-arrow-right
pi-chevron-up / pi-chevron-down / pi-chevron-left / pi-chevron-right
pi-info-circle / pi-exclamation-triangle / pi-question-circle
pi-spin pi-spinner / pi-cloud / pi-bell / pi-envelope
```

完整列表见 [PrimeIcons 官网](https://primeng.org/icons)。

### 自定义图标（用其他图标库）

PrimeNG 组件的 icon 部分都支持 `<ng-template #icon>` 投影 —— 可以放 Material Icons / Font Awesome / SVG / 图片：

```html
<!-- 用 Font Awesome -->
<p-button>
  <ng-template #icon>
    <i class="fa fa-github"></i>
  </ng-template>
  GitHub
</p-button>

<!-- 用 SVG -->
<p-button>
  <ng-template #icon>
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="..." />
    </svg>
  </ng-template>
  自定义
</p-button>
```

> 大多数组件的图标插槽支持 `<ng-template #dropdownicon>` / `<ng-template #clearicon>` / `<ng-template #filtericon>` 等模板——见各组件文档 Custom Icons 章节。

## 中文国际化

PrimeNG 默认是 **英文** —— 国内项目必须切到中文。PrimeNG **没有内置中文 translation 数据** —— 需要手动定义。

### 在 providers 中配置 translation

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { providePrimeNG } from 'primeng/config'
import Aura from '@primeuix/themes/aura'

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: { preset: Aura },
      translation: {
        accept: '确认',
        reject: '取消',
        choose: '选择',
        upload: '上传',
        cancel: '取消',
        completed: '已完成',
        pending: '待处理',
        fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        dayNamesShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        dayNamesMin: ['日', '一', '二', '三', '四', '五', '六'],
        monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        chooseYear: '选择年份',
        chooseMonth: '选择月份',
        chooseDate: '选择日期',
        prevDecade: '上个十年',
        nextDecade: '下个十年',
        prevYear: '上一年',
        nextYear: '下一年',
        prevMonth: '上个月',
        nextMonth: '下个月',
        prevHour: '上一小时',
        nextHour: '下一小时',
        prevMinute: '上一分钟',
        nextMinute: '下一分钟',
        prevSecond: '上一秒',
        nextSecond: '下一秒',
        am: '上午',
        pm: '下午',
        dateFormat: 'yy-mm-dd',
        firstDayOfWeek: 1,                        // 周一作为一周开始
        today: '今天',
        weekHeader: '周',
        weak: '弱',
        medium: '中',
        strong: '强',
        passwordPrompt: '请输入密码',
        emptyMessage: '无结果',
        emptyFilterMessage: '无符合的结果',
        emptySearchMessage: '无搜索结果',
        emptySelectionMessage: '未选择',
        searchMessage: '已找到 {0} 项结果',
        selectionMessage: '已选 {0} 项',
        clear: '清除',
        apply: '应用',
        addRule: '增加规则',
        removeRule: '移除规则',
        matchAll: '全部匹配',
        matchAny: '匹配任一',
        startsWith: '开头是',
        contains: '包含',
        notContains: '不包含',
        endsWith: '结尾是',
        equals: '等于',
        notEquals: '不等于',
        noFilter: '无筛选',
        lt: '小于',
        lte: '小于等于',
        gt: '大于',
        gte: '大于等于',
        is: '是',
        isNot: '不是',
        before: '早于',
        after: '晚于',
        dateIs: '日期等于',
        dateIsNot: '日期不等于',
        dateBefore: '日期早于',
        dateAfter: '日期晚于',
      },
    }),
  ],
}
```

> 完整字段列表见 [PrimeNG Configuration 文档](https://primeng.org/configuration) 或源码 `primeng/config` 中的 `Translation` 接口。

### 运行时切换语言（`PrimeNG` config service）

```ts
import { Component, inject } from '@angular/core'
import { PrimeNG } from 'primeng/config'
import { ButtonModule } from 'primeng/button'

@Component({
  selector: 'app-lang-toggle',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button label="切换为英文" (onClick)="switchToEn()" />
    <p-button label="切换为中文" (onClick)="switchToZh()" />
  `,
})
export class LangToggleComponent {
  private primeng = inject(PrimeNG)

  switchToZh() {
    this.primeng.setTranslation({
      accept: '确认',
      reject: '取消',
      // ... 中文配置
    })
  }

  switchToEn() {
    this.primeng.setTranslation({
      accept: 'Accept',
      reject: 'Cancel',
      // ... 英文配置
    })
  }
}
```

### 抽出 locale 模块

```ts
// src/locales/zh-cn.ts
export const zhCN = {
  accept: '确认',
  reject: '取消',
  // ... 完整字段
}

// app.config.ts
import { zhCN } from './locales/zh-cn'

providePrimeNG({
  theme: { preset: Aura },
  translation: zhCN,
})
```

## 主题定制（definePreset）

PrimeNG v20 主题系统的精髓 —— `definePreset` 基于预设修改、生成自定义主题：

### 基础用法

```ts
// src/app/mypreset.ts
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',                      // 使用 primitive token 引用
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
  },
})
```

```ts
// app.config.ts
import { MyPreset } from './mypreset'

providePrimeNG({
  theme: { preset: MyPreset },
}),
```

### 改主色到品牌色

```ts
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',                         // 主色
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
})
```

### 不同色阶配亮 / 暗模式

```ts
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const MyPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{zinc.50}',
          100: '{zinc.100}',
          200: '{zinc.200}',
          300: '{zinc.300}',
          400: '{zinc.400}',
          500: '{zinc.500}',
          600: '{zinc.600}',
          700: '{zinc.700}',
          800: '{zinc.800}',
          900: '{zinc.900}',
          950: '{zinc.950}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
      },
    },
  },
})
```

> **完整主题深度（多 token 修改 / 组件级 token / 运行时 updatePreset）见 [指南 > Theming 深度](./guide-line.md#theming-深度)**。

## 命令式服务：Toast / Confirm / Dialog

PrimeNG 的弹窗 / 提示 API 是 **`ConfirmationService` / `MessageService` / `DialogService`** —— 标准 Angular DI 服务 + 占位组件。

### Toast 顶部消息

**1. 在 Component 中 provide MessageService**：

```ts
import { Component, inject } from '@angular/core'
import { MessageService } from 'primeng/api'
import { ToastModule } from 'primeng/toast'
import { ButtonModule } from 'primeng/button'

@Component({
  selector: 'app-toast-demo',
  standalone: true,
  imports: [ToastModule, ButtonModule],
  providers: [MessageService],                    // 必须在 component 或 root 提供
  template: `
    <p-toast />
    <p-button label="显示消息" (onClick)="showSuccess()" />
  `,
})
export class ToastDemoComponent {
  private messageService = inject(MessageService)

  showSuccess() {
    this.messageService.add({
      severity: 'success',                        // success / info / warn / error / secondary / contrast
      summary: '保存成功',
      detail: '数据已保存到服务器',
      life: 3000,                                 // ms，省略 = 不自动消失
    })
  }
}
```

> **关键点**：`<p-toast />` 必须放在模板中、`MessageService` 通过 `providers: [MessageService]` 注册（或在 `app.config.ts` providers 数组中全局注册）。

### ConfirmDialog 确认对话框

```ts
import { Component, inject } from '@angular/core'
import { ConfirmationService } from 'primeng/api'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ButtonModule } from 'primeng/button'

@Component({
  selector: 'app-confirm-demo',
  standalone: true,
  imports: [ConfirmDialogModule, ButtonModule],
  providers: [ConfirmationService],
  template: `
    <p-confirmdialog />
    <p-button (onClick)="confirmDelete()" label="删除" severity="danger" />
  `,
})
export class ConfirmDemoComponent {
  private confirmationService = inject(ConfirmationService)

  confirmDelete() {
    this.confirmationService.confirm({
      message: '确定要删除？',
      header: '提示',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // 用户点了确定
        console.log('已删除')
      },
      reject: () => {
        // 用户点了取消
        console.log('已取消')
      },
    })
  }
}
```

### DynamicDialog 动态对话框（命令式打开 Angular 组件）

**子组件**（被打开的组件）：

```ts
// product-list.component.ts
import { Component, inject } from '@angular/core'
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog'
import { ButtonModule } from 'primeng/button'

@Component({
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div>
      <p>传入数据 id = {{ config.data?.id }}</p>
      <p-button label="关闭" (onClick)="close()" />
    </div>
  `,
})
export class ProductListComponent {
  private ref = inject(DynamicDialogRef)
  config = inject(DynamicDialogConfig)

  close() {
    this.ref.close({ result: 'ok' })
  }
}
```

**调用方组件**：

```ts
import { Component, inject } from '@angular/core'
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog'
import { ButtonModule } from 'primeng/button'
import { ProductListComponent } from './product-list.component'

@Component({
  standalone: true,
  imports: [ButtonModule],
  providers: [DialogService],
  template: `
    <p-button label="打开动态对话框" (onClick)="open()" />
  `,
})
export class DialogDemoComponent {
  private dialogService = inject(DialogService)
  ref: DynamicDialogRef | undefined

  open() {
    this.ref = this.dialogService.open(ProductListComponent, {
      header: '动态对话框',
      width: '50vw',
      modal: true,
      data: { id: 1 },                              // 传给子组件 config.data
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    })

    this.ref.onClose.subscribe((result) => {
      console.log('返回数据：', result)
    })
  }
}
```

> **关键点**：
>
> 1. `DialogService` 通过 `providers: [DialogService]` 在调用方组件 / 全局注册
> 2. 子组件用 `inject(DynamicDialogRef)` + `inject(DynamicDialogConfig)` 取 dialog 引用和传入数据
> 3. `this.ref.close(data)` 关闭并返回数据；`this.ref.onClose.subscribe()` 监听关闭

## 与 Angular Router 集成

PrimeNG + Angular Router 集成零冲突 —— 用 PrimeNG 的 Menu / Menubar 组件配合 `routerLink` 或 `command` 回调：

### app.component.ts（典型布局）

```ts
import { Component, inject } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { MenuItem } from 'primeng/api'
import { MenuModule } from 'primeng/menu'
import { ToastModule } from 'primeng/toast'
import { ConfirmDialogModule } from 'primeng/confirmdialog'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuModule, ToastModule, ConfirmDialogModule],
  template: `
    <p-toast />
    <p-confirmdialog />

    <div style="display: flex; height: 100vh;">
      <aside style="width: 200px; padding: 16px; border-right: 1px solid #ddd;">
        <p-menu [model]="menuItems" />
      </aside>

      <main style="flex: 1; padding: 24px; overflow: auto;">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  private router = inject(Router)

  menuItems: MenuItem[] = [
    {
      label: '仪表盘',
      icon: 'pi pi-home',
      command: () => this.router.navigateByUrl('/'),
    },
    {
      label: '用户管理',
      icon: 'pi pi-users',
      command: () => this.router.navigateByUrl('/users'),
    },
    {
      label: '设置',
      icon: 'pi pi-cog',
      // 也可以用 routerLink
      routerLink: '/settings',
    },
  ]
}
```

> **关键点**：
>
> 1. `<p-toast />` / `<p-confirmdialog />` 必须放在 App 根组件、才能让对应 Service 在子组件中工作
> 2. `MenuItem` 类型来自 `primeng/api`、有 `label` / `icon` / `command` / `routerLink` / `items`（子菜单）等字段
> 3. **`routerLink` 直接传字符串**（PrimeNG MenuItem 内部识别）；**`command` 是函数回调**

详细集成见 [指南 > 与 Angular Router 集成](./guide-line.md#与-angular-router-集成)。

## TypeScript 基础

PrimeNG v20 完整 TypeScript 支持 —— 所有组件 props / 事件 / 服务都有类型：

### 组件 props 类型

```ts
import { Component } from '@angular/core'
import { ButtonModule } from 'primeng/button'

@Component({
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button
      [label]="label"
      [severity]="severity"
      [size]="size"
      [rounded]="rounded"
      [disabled]="disabled"
    />
  `,
})
export class MyComponent {
  // 字符串字面量类型自动推断
  label = '登录'
  severity: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' = 'primary'
  size: 'small' | 'large' | undefined = 'small'
  rounded = true
  disabled = false
}
```

### MenuItem 类型

```ts
import type { MenuItem } from 'primeng/api'

const items: MenuItem[] = [
  {
    label: '文件',
    icon: 'pi pi-file',
    items: [
      { label: '新建', icon: 'pi pi-plus', command: () => {} },
      { label: '打开', icon: 'pi pi-folder-open' },
      { separator: true },
      { label: '退出', icon: 'pi pi-sign-out' },
    ],
  },
]
```

### Angular Signals（v17+ 推荐）

```ts
import { Component, signal, computed } from '@angular/core'
import { ButtonModule } from 'primeng/button'

@Component({
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button
      [label]="buttonLabel()"
      [disabled]="!canSubmit()"
      (onClick)="submit()"
    />
  `,
})
export class FormComponent {
  // Signals 状态
  username = signal('')
  password = signal('')

  // Computed signal
  canSubmit = computed(() =>
    this.username().length > 0 && this.password().length > 0
  )

  buttonLabel = computed(() =>
    this.canSubmit() ? '登录' : '请填写完整',
  )

  submit() {
    console.log('submit:', this.username(), this.password())
  }
}
```

> Angular 17+ Signals API 与 PrimeNG 配合非常顺畅 —— Angular 20 已经把 Signals 作为推荐的状态管理方式。

## 下一步

到这里你已经会用 PrimeNG 搭建基础 Angular 应用了 —— 下一步深入：

- [指南](./guide-line.md)：**80+ 组件按 10 大类速览** / **Form 组件深度**（InputText / Select / MultiSelect / DatePicker + Angular Reactive Forms 集成） / **DataTable 重磅深度**（基础 + 分页 + 排序 + 筛选 + 选择 + 行展开 + 行编辑 + lazy load + virtual scroll） / **Theming 4 大预设 + `definePreset` 深度** / **Styled vs Unstyled Mode** / **Tailwind 集成 + `tailwindcss-primeui`** / **PassThrough (`pt`) 深度** / **`ConfirmationService` / `MessageService` / `DialogService` 完整 API** / **常见踩坑**
- [参考](./reference.md)：**API 速查** / 80+ 组件分组列表 / 常用 props 表 / `providePrimeNG` 配置选项 / `@primeuix/themes` 4 大预设 / `definePreset` API / Service 签名 / TypeScript 类型 / `tailwindcss-primeui` 工具类
