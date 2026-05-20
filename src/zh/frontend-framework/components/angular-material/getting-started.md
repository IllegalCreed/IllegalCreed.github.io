---
layout: doc
outline: [2, 3]
---

# 入门

本章覆盖 Angular Material v20.x 在 Angular 20 项目里**从零集成 + 第一个组件 + 主题配置 + 暗色模式启用**的全部流程。Angular Material 的 `ng add` schematic 是 Angular 生态最成熟的一键集成方案——一条命令就能把包安装、主题文件、字体引入、Animations 配置、全局样式重置全部搞定。

## 前置准备

### Node.js 与 Angular CLI

Angular 20 要求 Node.js **20.x LTS 或 22.x LTS**（推荐 22.x，2026 年 5 月发布的 v24 也已支持）。Angular Material v20 通过 `peerDependencies` 跟随 Angular 框架版本约束。

```bash
# 安装最新 Node 22 LTS（macOS / Linux）
brew install node@22                   # macOS
nvm install 22 && nvm use 22           # 跨平台

# 验证版本
node -v                                # v22.x.x
npm -v                                 # 10.x.x+

# 全局安装 Angular CLI（推荐 pnpm 管理）
pnpm add -g @angular/cli@20
ng version                             # 输出版本树
```

### 包管理器

Angular CLI v20 默认支持 **npm / pnpm / yarn / bun**。本指南推荐 **pnpm**（与本仓库 monorepo 体例一致），通过 `ng config cli.packageManager pnpm` 切换。

```bash
ng config cli.packageManager pnpm      # 全局切换 pnpm
ng new my-app --package-manager=pnpm   # 新项目直接指定
```

### Angular 17 vs Angular 20

| 维度 | Angular 17 | Angular 20 (当前) |
| --- | --- | --- |
| Standalone 默认 | 默认 NgModule | 默认 standalone（NgModule 实质 deprecated） |
| Signals API | input/output 实验 | 稳定（input() / output() / model()）|
| Material 主题 API | `mat.define-light-theme()` | `mat.theme()` 新 API |
| Material Design 版本 | M2 默认 | M3 默认 |
| Token 命名 | `--mdc-*` | `--mat-*`（v20 重命名） |
| Animations | `provideAnimations()` 默认 | `provideAnimationsAsync()` 推荐 |
| Zoneless | 实验性 | 实验性（v21 计划稳定） |
| Control Flow | `*ngIf` / `*ngFor` | `@if` / `@for` / `@switch` |

Angular 17 → 20 整体保持向下兼容，但 Material 2 主题 API 已进入维护状态——**新项目必选 Material 3 + `mat.theme()`**。

### TypeScript 推荐

Angular 20 默认搭配 TypeScript **5.5+**（v20 起锁定 TS 5.5+ 作为最低要求）。Angular Material 的所有公开 API 都有严格类型——`MatFormFieldAppearance`、`ThemePalette`、`MatPaginatorIntl` 等关键类型在 IDE 自动补全里直接可见。

```json
// tsconfig.json 推荐严格配置
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true
  }
}
```

## 快速开始 - 从 Angular 20 模板创建

```bash
# 创建 Angular 20 standalone 项目
ng new my-material-app                 # CLI 交互式选择
# 选 CSS=SCSS / SSR=yes（推荐）/ standalone=yes（默认）

# 一键加 Material（最关键的一步）
cd my-material-app
ng add @angular/material

# 启动
ng serve --open                        # 自动开 http://localhost:4200
```

`ng add @angular/material` 是 Angular Material 体验最好的部分——下文逐步拆解它做了什么。

## ng add @angular/material 详解

### 触发命令

```bash
ng add @angular/material
```

执行后，CLI 会**交互式询问 2 个问题**：

1. **Choose a prebuilt theme name, or "custom" for a custom theme**：选择 prebuilt 主题或自定义
   - **azure-blue**（M3 Light）：azure 主色 + blue 三级色
   - **rose-red**（M3 Light）：rose 主色 + red 三级色
   - **cyan-orange**（M3 Dark）：cyan 主色 + orange 三级色（默认 dark）
   - **magenta-violet**（M3 Dark）：magenta 主色 + violet 三级色（默认 dark）
   - **custom**：生成 `src/styles.scss` 包含 `mat.theme()` 模板，自定义入口
   - `deeppurple-amber.css / indigo-pink.css / pink-bluegrey.css / purple-green.css`（M2 兼容，**新项目不要选**）

2. **Set up global Angular Material typography styles**：是否注入全局 typography 样式（推荐 yes）

3. **Set up browser animations for Angular Material**：是否注入 `provideAnimationsAsync()`（必须 yes）

### 自动完成的 6 件事

```bash
# 1. 安装包
@angular/material@20.x
@angular/cdk@20.x

# 2. 注入主题 CSS 到 angular.json（选 prebuilt）
"styles": [
  "@angular/material/prebuilt-themes/azure-blue.css",
  "src/styles.scss"
]
# 或生成 src/styles.scss 包含 mat.theme()（选 custom）

# 3. 注入 Roboto 字体到 src/index.html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

# 4. 注入 Material Icons 字体
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

# 5. 全局样式重置 src/styles.scss
html, body { height: 100%; }
body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }

# 6. 注入 provideAnimationsAsync() 到 src/app/app.config.ts
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    // ... 其他 providers
  ]
};
```

### 验证：第一个 MatSlideToggle

按官方推荐流程，先用 `<mat-slide-toggle>` 验证集成。

```ts
// src/app/app.component.ts
import { Component } from '@angular/core';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatSlideToggle],
  template: `
    <mat-slide-toggle>开关一下</mat-slide-toggle>
  `,
})
export class AppComponent {}
```

```bash
ng serve --open
```

浏览器看到一个能拖动的 Material 风格开关 → 集成成功。

## 第一个 MatButton

`MatButton` 是 Material Design 最经典的组件，v20 起改为 **directive 形式**（`matButton` 属性而非 `<mat-button>` 元素），这是 v20 的一个 API 演进。

### Standalone Component import

```ts
// src/app/components/demo-buttons.component.ts
import { Component } from '@angular/core';
import { MatButton, MatIconButton, MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-demo-buttons',
  standalone: true,
  imports: [MatButton, MatIconButton, MatFabButton, MatIcon],
  template: `
    <!-- 基础变体 -->
    <button matButton>Text</button>
    <button matButton="filled">Filled</button>
    <button matButton="outlined">Outlined</button>
    <button matButton="elevated">Elevated</button>
    <button matButton="tonal">Tonal（v20 新增）</button>

    <!-- 配色 -->
    <button matButton="filled" color="primary">Primary</button>
    <button matButton="filled" color="accent">Accent</button>
    <button matButton="filled" color="warn">Warn</button>

    <!-- 禁用 -->
    <button matButton="filled" disabled>Disabled</button>

    <!-- 图标按钮 -->
    <button matIconButton aria-label="收藏">
      <mat-icon>favorite</mat-icon>
    </button>

    <!-- FAB（浮动操作按钮）-->
    <button matFab aria-label="新增">
      <mat-icon>add</mat-icon>
    </button>

    <button matMiniFab aria-label="编辑">
      <mat-icon>edit</mat-icon>
    </button>

    <!-- Extended FAB（v20）-->
    <button matExtendedFab>
      <mat-icon>navigation</mat-icon>
      导航
    </button>
  `,
})
export class DemoButtonsComponent {}
```

### v20 Tonal Button 新增

Tonal Button 是 Material 3 引入的「中等强调」按钮，介于 filled（高强调）和 outlined（低强调）之间。

```html
<!-- v20 新变体 -->
<button matButton="tonal" color="primary">添加项</button>
<button matButton="tonal" color="accent">取消</button>
```

`matButton` 接受字符串字面量：`'text' | 'filled' | 'outlined' | 'elevated' | 'tonal'`。

### 动态切换变体

```ts
@Component({
  selector: 'app-button-variants',
  standalone: true,
  imports: [MatButton],
  template: `
    <button [matButton]="variant" color="primary">切换形态</button>
    <select [(ngModel)]="variant">
      <option value="text">Text</option>
      <option value="filled">Filled</option>
      <option value="outlined">Outlined</option>
      <option value="tonal">Tonal</option>
    </select>
  `,
})
export class ButtonVariantsComponent {
  variant = signal<'text' | 'filled' | 'outlined' | 'tonal'>('filled');
}
```

## 第一个 MatFormField + MatInput

`MatFormField` 是 Material 表单的核心容器，必须搭配 `matInput` 指令使用——这是 Angular Material 与原生 `<input>` 集成最关键的部分。

### 基础用法

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-form-demo',
  standalone: true,
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatHint,
    MatError,
    MatPrefix,
    MatSuffix,
    MatInput,
    MatIcon,
  ],
  template: `
    <!-- Outline 外观（v20 默认推荐） -->
    <mat-form-field appearance="outline">
      <mat-label>用户名</mat-label>
      <input matInput placeholder="请输入用户名" [(ngModel)]="username">
      <mat-hint>3-20 个字符</mat-hint>
    </mat-form-field>

    <!-- 带前缀后缀 -->
    <mat-form-field appearance="outline">
      <mat-label>邮箱</mat-label>
      <input matInput type="email" [(ngModel)]="email">
      <mat-icon matPrefix>email</mat-icon>
      <mat-icon matSuffix>check_circle</mat-icon>
    </mat-form-field>

    <!-- Fill 外观 -->
    <mat-form-field appearance="fill">
      <mat-label>密码</mat-label>
      <input matInput type="password">
    </mat-form-field>

    <!-- Textarea -->
    <mat-form-field appearance="outline">
      <mat-label>简介</mat-label>
      <textarea matInput rows="4" placeholder="自我介绍..."></textarea>
    </mat-form-field>
  `,
})
export class FormDemoComponent {
  username = '';
  email = '';
}
```

### Reactive Forms 集成

Angular Material 与 **Reactive Forms** 才是标准搭配——`FormControl + Validators` 提供完整的校验 / 状态 / 错误链路。

```ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-reactive-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatError, MatInput, MatButton],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline">
        <mat-label>邮箱</mat-label>
        <input matInput type="email" formControlName="email">
        @if (form.controls.email.hasError('required')) {
          <mat-error>邮箱必填</mat-error>
        }
        @if (form.controls.email.hasError('email')) {
          <mat-error>邮箱格式不正确</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>密码</mat-label>
        <input matInput type="password" formControlName="password">
        @if (form.controls.password.hasError('required')) {
          <mat-error>密码必填</mat-error>
        }
        @if (form.controls.password.hasError('minlength')) {
          <mat-error>密码至少 8 位</mat-error>
        }
      </mat-form-field>

      <button matButton="filled" color="primary" type="submit" [disabled]="form.invalid">
        登录
      </button>
    </form>
  `,
})
export class ReactiveFormComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

### MatFormField appearance 选项

| appearance | 描述 | v20 状态 |
| --- | --- | --- |
| `outline` | 边框外观，标签悬浮在边框上 | 默认推荐 |
| `fill` | 填充背景外观，标签悬浮在背景上 | M3 推荐之二 |
| `standard` | 旧 M2 风格（已 deprecated） | 不要用 |
| `legacy` | 最老的 M1 风格（已 deprecated） | 不要用 |

新项目**只用 `outline` 或 `fill`**——`standard` 和 `legacy` 在 v15+ 已实质 deprecate。

## Material Icons

Angular Material 通过 `<mat-icon>` 渲染 Material Icons。`ng add` 已自动注入 Google Fonts CDN，**也可以替换为 SVG icon registry 或自部署 Material Symbols**。

### 字体图标用法（默认）

```ts
import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-icon-demo',
  standalone: true,
  imports: [MatIcon],
  template: `
    <mat-icon>home</mat-icon>
    <mat-icon>favorite</mat-icon>
    <mat-icon>delete</mat-icon>
    <mat-icon>settings</mat-icon>

    <!-- 主题颜色 -->
    <mat-icon color="primary">star</mat-icon>
    <mat-icon color="accent">favorite</mat-icon>
    <mat-icon color="warn">warning</mat-icon>
  `,
})
export class IconDemoComponent {}
```

### SVG 图标注册（推荐生产）

国内访问 Google Fonts 不稳定，**生产环境推荐用 SVG icon registry**——`MatIconRegistry.addSvgIcon()` 一次注册、模板里用图标名引用。

```ts
import { Component, inject } from '@angular/core';
import { MatIconRegistry, MatIcon } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-svg-icons',
  standalone: true,
  imports: [MatIcon],
  template: `
    <mat-icon svgIcon="custom-logo"></mat-icon>
    <mat-icon svgIcon="custom-arrow"></mat-icon>
  `,
})
export class SvgIconsComponent {
  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);

  constructor() {
    // 注册单个 SVG 图标
    this.iconRegistry.addSvgIcon(
      'custom-logo',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/logo.svg'),
    );

    // 注册 SVG icon set（多个图标合并为一个 SVG sprite）
    this.iconRegistry.addSvgIconSet(
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/icon-set.svg'),
    );
  }
}
```

### Material Symbols（新一代，推荐）

Material Symbols 是 Google 2022+ 推出的新一代图标字体，**支持 Variable Font + 4 种 style（outlined / rounded / sharp / two-tone）+ FILL / wght / GRAD / opsz 4 个轴控制**。

```html
<!-- src/index.html 替换默认 Material Icons -->
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" />
```

```scss
/* src/styles.scss 让 mat-icon 默认用 Material Symbols Outlined */
mat-icon {
  font-family: 'Material Symbols Outlined' !important;
}
```

```html
<mat-icon>home</mat-icon>             <!-- Material Symbols Outlined 风格 -->
<mat-icon>favorite</mat-icon>
```

## 主题配置 - mat.theme() 完整入门

v19 引入 `mat.theme()` 新主题 API、v20 默认——单 mixin 完成 color + typography + density 三大维度配置。

### 自定义 SCSS 主题（推荐生产）

如果在 `ng add` 时选 custom，CLI 会生成 `src/styles.scss` 包含完整 `mat.theme()` 模板：

```scss
/* src/styles.scss */
@use '@angular/material' as mat;

html {
  /* 1. 启用 light-dark CSS 函数 - 用户系统偏好自动响应 */
  color-scheme: light dark;

  /* 2. mat.theme() 三参数 */
  @include mat.theme((
    color: mat.$violet-palette,     /* 单 palette 模式 */
    typography: Roboto,             /* 字体家族 */
    density: 0,                     /* 0 默认 / -1 紧凑 / -5 最密 */
  ));
}

/* 3. 应用主题表面色作为全局背景 */
body {
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  margin: 0;
  height: 100vh;
}
```

### 双 palette 模式（primary + tertiary）

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: (
      primary: mat.$violet-palette,    /* 主色 */
      tertiary: mat.$orange-palette,   /* 三级色（M3 替代 M2 的 accent）*/
      theme-type: light,               /* 'color-scheme' | 'light' | 'dark' */
    ),
    typography: Roboto,
    density: 0,
  ));
}
```

`theme-type` 三种值：

- `color-scheme`（默认）：用 `light-dark()` CSS 函数同时定义 light 和 dark 颜色，最终由 `color-scheme` CSS 属性决定
- `light`：只定义 light 颜色（旧浏览器兼容）
- `dark`：只定义 dark 颜色

### 12 个 prebuilt color palette

```scss
mat.$red-palette
mat.$green-palette
mat.$blue-palette
mat.$yellow-palette
mat.$cyan-palette
mat.$magenta-palette
mat.$orange-palette
mat.$chartreuse-palette
mat.$spring-green-palette
mat.$azure-palette
mat.$violet-palette
mat.$rose-palette
```

12 个 palette 基于 **HCT 色彩空间**（Material 3 引入的 hue / chroma / tone 三维色彩模型）生成，覆盖完整色谱。

### Typography 完整配置

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: mat.$violet-palette,
    typography: (
      plain-family: Roboto,           /* 正文字体 */
      brand-family: 'Open Sans',      /* 标题字体 */
      bold-weight: 900,
      medium-weight: 500,
      regular-weight: 400,
    ),
    density: 0,
  ));
}
```

### Density 紧凑度

```scss
@include mat.theme((
  color: mat.$violet-palette,
  typography: Roboto,
  density: -2,                        /* 紧凑模式，每级 -4px */
));
```

`density` 取值 **0 ~ -5**，每级减少 4px 间距。`-5` 最紧凑、`0` 默认舒适度。**密度低于 0 可能影响可访问性**——只在密集表格 / 仪表板等场景用。

## Animations 配置

Angular Material 大约 15 个组件依赖 `@angular/animations`（如 `MatTabs`、`MatDialog`、`MatSnackBar`、`MatTooltip`）——必须在 app 根 provider 中配置。

### provideAnimationsAsync() vs provideAnimations()

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// 或
// import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    // 推荐：lazy-load @angular/animations（用到时才加载）
    provideAnimationsAsync(),

    // 或：立即加载（适合 SSR + 需要立刻动画的场景）
    // provideAnimations(),
  ],
};
```

| 函数 | 加载时机 | 推荐场景 |
| --- | --- | --- |
| `provideAnimationsAsync()` | 第一个用动画的组件触发时 lazy load | SPA / Standalone 默认推荐 |
| `provideAnimations()` | 应用启动时立即加载 | SSR / 需要立即动画的应用 |
| `provideNoopAnimations()` | 禁用动画（测试 / 性能调优） | 单元测试 / 低端设备 |

### 禁用 prefers-reduced-motion

v20 自动响应 `prefers-reduced-motion: reduce` 媒体查询——用户在系统设置开启「减少动画」时，Material 组件会自动跳过动画。**新项目零配置**。

## 暗色模式

### 一行启用（推荐）

```scss
/* src/styles.scss */
@use '@angular/material' as mat;

html {
  /* 关键：color-scheme: light dark */
  color-scheme: light dark;
  @include mat.theme((
    color: mat.$violet-palette,
    typography: Roboto,
    density: 0,
  ));
}
```

`color-scheme: light dark` 让用户系统的「明暗外观」偏好决定颜色——macOS / Windows / iOS / Android 切换暗色模式时，Material 组件自动跟随。

### 用户手动切换

```ts
// theme.service.ts
import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  /** 当前主题模式 signal */
  private _mode = signal<ThemeMode>(
    (localStorage.getItem('theme-mode') as ThemeMode) ?? 'system',
  );

  mode = this._mode.asReadonly();

  constructor() {
    // effect 自动同步 html class
    effect(() => {
      const mode = this._mode();
      const html = this.document.documentElement;

      html.classList.remove('theme-light', 'theme-dark');
      if (mode === 'light') html.classList.add('theme-light');
      if (mode === 'dark') html.classList.add('theme-dark');

      localStorage.setItem('theme-mode', mode);
    });
  }

  setMode(mode: ThemeMode) {
    this._mode.set(mode);
  }
}
```

```scss
/* src/styles.scss */
@use '@angular/material' as mat;

html {
  color-scheme: light dark;         /* 默认跟随系统 */
  @include mat.theme((
    color: mat.$violet-palette,
    typography: Roboto,
    density: 0,
  ));

  &.theme-light {
    color-scheme: light;            /* 强制浅色 */
  }

  &.theme-dark {
    color-scheme: dark;             /* 强制深色 */
  }
}
```

```ts
// theme-toggle.component.ts
import { Component, inject } from '@angular/core';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { ThemeService, ThemeMode } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatButtonToggleGroup, MatButtonToggle, MatIcon],
  template: `
    <mat-button-toggle-group
      [value]="themeService.mode()"
      (change)="themeService.setMode($event.value)"
      aria-label="主题模式">
      <mat-button-toggle value="light">
        <mat-icon>light_mode</mat-icon>
      </mat-button-toggle>
      <mat-button-toggle value="system">
        <mat-icon>contrast</mat-icon>
      </mat-button-toggle>
      <mat-button-toggle value="dark">
        <mat-icon>dark_mode</mat-icon>
      </mat-button-toggle>
    </mat-button-toggle-group>
  `,
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
}
```

### 防 SSR 闪烁（FOUC）

Angular Universal SSR 场景下，**Material 主题的 `color-scheme: light dark` 已经能自动处理**——浏览器在首屏渲染时就读取系统偏好。

但如果用「手动切换主题」方案（`html.theme-dark` class），建议用 `provideAppInitializer()` 在首屏前注入 class：

```ts
// src/app/app.config.ts
import { provideAppInitializer, inject } from '@angular/core';
import { ThemeService } from './theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideAppInitializer(() => {
      const themeService = inject(ThemeService);
      // 首屏前读 localStorage 应用主题
      const saved = localStorage.getItem('theme-mode') ?? 'system';
      themeService.setMode(saved as ThemeMode);
    }),
  ],
};
```

## 第一个完整示例 - 登录页

```ts
// src/app/login.component.ts
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCard, MatCardContent, MatCardActions, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatCardActions,
    MatCardTitle,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatButton,
    MatIconButton,
    MatIcon,
    MatCheckbox,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-title>登录</mat-card-title>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>邮箱</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-icon matPrefix>email</mat-icon>
              @if (form.controls.email.hasError('required')) {
                <mat-error>邮箱必填</mat-error>
              }
              @if (form.controls.email.hasError('email')) {
                <mat-error>格式不正确</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>密码</mat-label>
              <input matInput [type]="hidePwd() ? 'password' : 'text'" formControlName="password">
              <mat-icon matPrefix>lock</mat-icon>
              <button
                matIconButton
                matSuffix
                type="button"
                [attr.aria-label]="'切换密码可见'"
                (click)="hidePwd.set(!hidePwd())">
                <mat-icon>{{ hidePwd() ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
              @if (form.controls.password.hasError('required')) {
                <mat-error>密码必填</mat-error>
              }
              @if (form.controls.password.hasError('minlength')) {
                <mat-error>至少 8 位</mat-error>
              }
            </mat-form-field>

            <mat-checkbox formControlName="remember">记住我</mat-checkbox>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <button matButton="tonal">忘记密码</button>
          <button
            matButton="filled"
            color="primary"
            type="submit"
            [disabled]="form.invalid"
            (click)="onSubmit()">
            登录
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--mat-sys-surface-container-low);
    }
    .login-card {
      width: 360px;
      padding: 24px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    mat-card-actions {
      display: flex;
      justify-content: space-between;
    }
  `],
})
export class LoginComponent {
  hidePwd = signal(true);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    remember: new FormControl(false),
  });

  onSubmit() {
    if (this.form.valid) {
      console.log('提交：', this.form.value);
    }
  }
}
```

注意 4 个关键点：

1. **每个 Material 组件单独 import**：standalone 模式不再有 NgModule 包揽
2. **新的 control flow `@if`**：v17+ 推荐替代 `*ngIf`
3. **Signals 状态**：`hidePwd = signal(true)` 替代旧 `hidePwd = true; @Input()`
4. **CSS Variables 直接用**：`var(--mat-sys-surface-container-low)` 让组件自动适配明暗

## ng generate 5 大模板

Angular Material 提供 5 个 schematic 一行命令生成完整组件——**新人最大效率工具**。

```bash
# 1. 响应式 sidenav 导航（带 toolbar）
ng generate @angular/material:navigation main-nav

# 2. 带排序 + 分页的数据表
ng generate @angular/material:table products-table

# 3. 仪表板 grid（多卡片 + 菜单）
ng generate @angular/material:dashboard dashboard

# 4. 收货地址表单
ng generate @angular/material:address-form shipping-form

# 5. 树形目录（CdkTree）
ng generate @angular/material:tree file-tree

# 额外：Material 3 自定义 palette schematic
ng generate @angular/material:theme-color
```

### navigation schematic 生成效果

```bash
ng g @angular/material:navigation main-nav
```

会生成：

- **`main-nav.component.ts`**：包含 `BreakpointObserver` 判断移动端 / 桌面端
- **`main-nav.component.html`**：`<mat-sidenav-container>` + `<mat-toolbar>` + 响应式抽屉
- **`main-nav.component.scss`**：基础样式

直接 `<app-main-nav />` 即可用——**省去手写 sidenav 响应式逻辑的 200 行代码**。

## CDK 集成

Angular Material 安装时**自动安装了 `@angular/cdk`**——不需要单独 install。但如果要在不用 Material 的 Angular 项目里只用 CDK 行为，也可以独立装：

```bash
ng add @angular/cdk
```

CDK 用法详见[指南](./guide-line.md)的 CDK 章节。

## Vite vs Webpack

Angular CLI v17+ 默认使用 **esbuild + Vite** 作为开发服务器（`@angular-devkit/build-angular:application`），**不再使用 Webpack**——构建速度比 Angular 16 快 4-7 倍。

```json
// angular.json 已经默认配置好
{
  "architect": {
    "build": {
      "builder": "@angular-devkit/build-angular:application",
      ...
    },
    "serve": {
      "builder": "@angular-devkit/build-angular:dev-server"
    }
  }
}
```

Angular Material 与新 esbuild builder 100% 兼容、无需特殊配置。

## SSR 集成

`ng new --ssr` 创建带 SSR 的项目时，Angular Material 已经天然兼容——`color-scheme: light dark` 自动处理首屏明暗，`provideAnimationsAsync()` 自动处理 SSR 动画。

### Critical CSS Inline

Angular 18+ 默认 inline critical CSS——**主题 CSS 进入 `<head>` style 标签、消除 FOUC**。Material 主题文件几十 KB、首屏后才异步加载剩余样式。

```ts
// src/app/app.config.server.ts
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

## 常见踩坑

### 1. Material Icons 不显示

**症状**：`<mat-icon>home</mat-icon>` 显示为文字 "home" 而非图标。

**原因**：`ng add` 没有正确注入 Material Icons 字体 CSS。

**解决**：检查 `src/index.html` 是否有：

```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

或国内访问稳定性差，**改用 SVG 图标注册**（见上文 SVG 图标章节）。

### 2. mat-form-field 必须有 matInput

**症状**：编译报错 `mat-form-field must contain a MatFormFieldControl`。

**原因**：`<mat-form-field>` 内部必须有 `matInput` 指令或其他 MatFormFieldControl 实现（如 `mat-select`）——**纯 `<input>` 不行**。

```html
<!-- 错误 -->
<mat-form-field>
  <input placeholder="名字">     <!-- 缺 matInput -->
</mat-form-field>

<!-- 正确 -->
<mat-form-field>
  <input matInput placeholder="名字">
</mat-form-field>
```

### 3. provideAnimationsAsync() 忘配

**症状**：Material 组件能渲染但**没有动画**——dialog 直接出现、tab 切换不滑动。

**原因**：`app.config.ts` 没有调 `provideAnimationsAsync()`。

**解决**：

```ts
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),    // ← 必加
    // ... 其他
  ],
};
```

### 4. M2 主题 API 调 mat.theme()

**症状**：从 v18 升 v20 后，`mat.define-light-theme()` 不能用了。

**原因**：v19 引入 `mat.theme()`、v20 默认。`mat.define-light-theme()` / `mat.define-palette()` 是 M2 旧 API、**v20 改为 `mat.m2-define-light-theme()`** 命名（加 `m2-` 前缀）。

**解决**：

- **推荐**：重写为 `mat.theme()` 新 API
- **过渡**：把 `mat.define-light-theme` 全替换为 `mat.m2-define-light-theme`（仅作迁移过渡）

### 5. Tailwind 与 Material 优先级冲突

**症状**：在 Material 组件上加 `class="bg-red-500"`，但 Material 内部样式覆盖了。

**原因**：Material 内部样式优先级偶尔高于 Tailwind utility class。

**解决**（推荐）：用 **CSS @layer** 把 Material 放到 utility 之前：

```scss
/* src/styles.scss */
@layer base, mat-theme, utilities;

@use '@angular/material' as mat;

@layer mat-theme {
  html {
    color-scheme: light dark;
    @include mat.theme((...));
  }
}

/* Tailwind 进入 utilities layer，自动比 mat-theme 优先级高 */
@import 'tailwindcss';
```

### 6. Standalone 时忘 import 子指令

**症状**：`<mat-form-field>` 里写了 `<mat-label>`、但编译报错 `'mat-label' is not a known element`。

**原因**：`MatLabel` 是单独的 directive、必须单独 import 到 standalone component 的 imports 数组。

**解决**：

```ts
import { MatFormField, MatLabel, MatError, MatHint } from '@angular/material/form-field';

@Component({
  standalone: true,
  imports: [MatFormField, MatLabel, MatError, MatHint],   // ← 全部 import
  // ...
})
```

### 7. Datepicker 没日期库适配器

**症状**：`<mat-datepicker>` 渲染了，但点击日历不出来 / 报错 `MatDateAdapter is required`。

**原因**：`MatDatepicker` 不内置日期库，必须 provide 一个 `DateAdapter`。

**解决**：

```ts
// app.config.ts
import { provideNativeDateAdapter } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideNativeDateAdapter(),       // ← 原生 Date 适配器（最简单）
    // 或：provideMomentDateAdapter()
    // 或：provideLuxonDateAdapter()
    // 或：provideDateFnsAdapter()
  ],
};
```

详细见[指南 - MatDatepicker 章节](./guide-line.md#matdatepicker-完整方案)。

### 8. v20 token 重命名 `--mdc-*` → `--mat-*`

**症状**：从 v19 升 v20 后，自定义 SCSS 里的 `--mdc-outlined-card-container-shape` 不生效了。

**原因**：v20 把所有 MDC（Material Design Components for Web）开头的 token 重命名为 `--mat-*`——例如 `--mdc-outlined-card-container-shape` → `--mat-card-outlined-container-shape`。

**解决**：

- **自动迁移**：`ng update @angular/material` 自带 schematic 自动重写
- **手动**：搜索项目里所有 `--mdc-*` 字符串、按映射表替换

```scss
/* 旧 v19 */
.my-card {
  --mdc-outlined-card-container-shape: 16px;
}

/* 新 v20 */
.my-card {
  --mat-card-outlined-container-shape: 16px;
}
```

---

完成 `ng add @angular/material` → 第一个 `MatButton` + `MatFormField` 即可继续阅读[指南](./guide-line.md)了解 Angular Material 60+ 组件全景、CDK 行为底座、`mat.theme()` 深度定制、Component Harnesses 测试。
