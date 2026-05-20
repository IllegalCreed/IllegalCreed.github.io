---
layout: doc
outline: [2, 3]
---

# 入门

本章覆盖 NG-ZORRO v21.x 在 Angular 21 项目里**从零集成 + 第一个组件 + 主题定制 + 国际化 + 图标注册**的全部流程。NG-ZORRO 的 `ng add ng-zorro-antd` schematic 是 Angular 阵营最成熟的中后台一键集成方案——一条命令就能把包安装、主题 Less 引入、i18n locale 注入、Animations 配置、`<nz-icon>` 图标注册、`NzConfigService` 全局配置全部搞定。

## 前置准备

### Node.js 与 Angular CLI

NG-ZORRO v21 要求 Angular ^21.0.0、Node.js **>= 20.19.0 / >= 22.12.0 / >= 24.0.0**。Angular 21 自身在 2026 年 5 月已是当前稳定大版本。

```bash
# 安装 Node.js 22 LTS（推荐）
brew install node@22                   # macOS
nvm install 22 && nvm use 22           # 跨平台

# 验证版本
node -v                                # v22.12.0+
npm -v                                 # 10.x.x+

# 全局安装 Angular CLI 21（与 NG-ZORRO v21 配对）
pnpm add -g @angular/cli@21
ng version                             # 输出版本树
```

### 包管理器选择

Angular CLI v21 默认支持 **npm / pnpm / yarn / bun**。本指南推荐 **pnpm**（与本仓库 monorepo 体例一致）。

```bash
ng config cli.packageManager pnpm      # 全局切换 pnpm
ng new my-app --package-manager=pnpm   # 新项目直接指定
```

### Angular 与 NG-ZORRO 版本对应

NG-ZORRO 版本号**严格跟随 Angular major**：

| Angular | NG-ZORRO | 关键变更 |
| --- | --- | --- |
| 17 | 17.x | Standalone Component 默认 |
| 18 | 18.x | Zoneless 实验性、`<nz-icon>` 新标签 |
| 19 | 19.x | `provideNzIcons` 推荐写法 |
| 20 | 20.x | 完全 standalone-only |
| 21 | 21.x | 跟随 Angular 21、Zoneless 完善 |

**强烈建议跨 major 时同步升级 Angular 与 NG-ZORRO**——`ng update @angular/core @angular/cli ng-zorro-antd` 一条命令搞定。

### TypeScript 推荐

Angular 21 默认搭配 TypeScript **5.6+**。NG-ZORRO 的所有公开 API 都有严格类型——`NzSafeAny`、`NzSizeLDSType`、`NzStatus`、`NzTableQueryParams`、`NzModalRef` 等关键类型在 IDE 自动补全里直接可见。

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

## 快速开始 - 从 Angular 21 模板创建

```bash
# 创建 Angular 21 standalone 项目
ng new my-ng-zorro-app                 # CLI 交互式
# 选 CSS=Less / SSR=yes（可选）/ standalone=yes（默认）

# 一键加 NG-ZORRO（最关键的一步）
cd my-ng-zorro-app
ng add ng-zorro-antd

# 启动
ng serve --open                        # 自动开 http://localhost:4200
```

`ng add ng-zorro-antd` 是 NG-ZORRO 体验最好的部分——下文逐步拆解它做了什么。

## ng add ng-zorro-antd 详解

### 触发命令

```bash
ng add ng-zorro-antd
```

执行后，CLI 会**交互式询问 4 个问题**：

```text
? Enable icon dynamic loading [ Detail: https://ng.ant.design/components/icon/en ]? (Y/n)
? Set up custom theme file [ Detail: https://ng.ant.design/docs/customize-theme/en ]? (y/N)
? Choose your locale code: (Use arrow keys)
> zh_CN
  zh_HK
  zh_TW
  en_US
  ...
? Choose template to create project: (Use arrow keys)
> blank
  sidemenu
```

四个问题对应：

| 问题 | 含义 | 推荐 |
| --- | --- | --- |
| 图标动态加载 | 注册 `assets/` 图标资源 | Y（开发期方便） |
| 自定义主题文件 | 生成 `src/theme.less` 主题入口 | y（如需改 primary color） |
| Locale 选择 | i18n 默认 locale | zh_CN（中文项目） |
| 模板选择 | blank 空模板 / sidemenu 侧边菜单模板 | sidemenu（中后台直接出布局） |

### 命令做了哪些事

`ng add ng-zorro-antd` schematic 实际执行**8 步操作**：

1. **安装依赖**：`ng-zorro-antd` + `@ant-design/icons-angular`（图标库）+ `date-fns`（日期 locale 适配）
2. **修改 `angular.json`**：注入 `node_modules/ng-zorro-antd/ng-zorro-antd.min.css`（或主题 Less 文件路径）到 `styles` 数组
3. **修改 `angular.json` `assets`**：注入图标动态加载的 `inline-svg/` 资源映射（当选 Y 时）
4. **修改 `app.config.ts`**：注入 `provideNzI18n(zh_CN)` + `provideAnimationsAsync()` + `provideNzIcons([...])` providers
5. **生成 `src/theme.less`**（当选 custom theme 时）：内含 `@import "~ng-zorro-antd/ng-zorro-antd.less"` 与可覆盖的变量注释
6. **生成模板代码**（当选 sidemenu 时）：完整侧边菜单 + 路由 + 顶栏布局，开箱可跑
7. **注册 Angular Localize**：注入 `LOCALE_ID` provider 与 `registerLocaleData(zh)`
8. **打印后续步骤**：提示开发者如何切换暗色主题、自定义 Less 变量

### 选 `blank` 模板的产物

```ts
// src/app/app.config.ts（schematic 注入后）
import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';

import { provideNzI18n, zh_CN } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';

import { routes } from './app.routes';

// 注册 Angular 中文 locale
registerLocaleData(zh);

// 收集需要预注册的图标（schematic 默认会全量注入、生产应按需）
const icons: IconDefinition[] = Object.keys(AllIcons).map(key => (AllIcons as Record<string, IconDefinition>)[key]);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideNzI18n(zh_CN),
    provideNzIcons(icons),
    { provide: LOCALE_ID, useValue: 'zh-Hans' }
  ]
};
```

### 选 `sidemenu` 模板的产物

`sidemenu` 模板会**直接生成完整 Layout 骨架**——包括 `NzLayoutComponent` + 顶栏 + 侧边菜单 + 路由出口，开箱可跑。

```html
<!-- src/app/app.component.html（schematic 生成） -->
<nz-layout class="app-layout">
  <nz-sider class="menu-sidebar"
            nzCollapsible
            nzWidth="256px"
            nzBreakpoint="md"
            [(nzCollapsed)]="isCollapsed">
    <div class="sidebar-logo">
      <a href="https://ng.ant.design/" target="_blank">
        <img src="https://ng.ant.design/assets/img/logo.svg" alt="logo">
        <h1>Ng-Zorro</h1>
      </a>
    </div>
    <ul nz-menu nzTheme="dark" nzMode="inline" [nzInlineCollapsed]="isCollapsed">
      @for (menu of menus; track menu.title) {
        <li nz-submenu [nzOpen]="menu.open" [nzTitle]="menu.title" [nzIcon]="menu.icon">
          <ul>
            @for (child of menu.children; track child.title) {
              <li nz-menu-item [nzMatchRouter]="true">
                <a [routerLink]="[child.routerLink]">{{ child.title }}</a>
              </li>
            }
          </ul>
        </li>
      }
    </ul>
  </nz-sider>
  <nz-layout>
    <nz-header>
      <div class="app-header">
        <span class="header-trigger" (click)="isCollapsed = !isCollapsed">
          <nz-icon class="trigger" [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'" />
        </span>
      </div>
    </nz-header>
    <nz-content>
      <div class="inner-content">
        <router-outlet />
      </div>
    </nz-content>
  </nz-layout>
</nz-layout>
```

`sidemenu` 模板**推荐用于纯净 ng-zorro 中后台快速起步**——如果需要更完整的脚手架（含 ACL 权限 / 主题切换器 / 多语言切换 UI），用 `ng-alain`。

## 第一个组件：NzButton

`ng add` 完成后，最小可跑的「Hello NzButton」如下。

### 1. Standalone Component import NzButtonModule

```ts
// src/app/app.component.ts
import { Component } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NzButtonModule],
  template: `
    <button nz-button nzType="primary">Primary</button>
    <button nz-button nzType="default">Default</button>
    <button nz-button nzType="dashed">Dashed</button>
    <button nz-button nzType="text">Text</button>
    <button nz-button nzType="link">Link</button>
    <button nz-button nzType="primary" nzDanger>Danger</button>
    <button nz-button nzType="primary" [nzLoading]="loading" (click)="loading = !loading">
      点击 Loading
    </button>
  `
})
export class AppComponent {
  loading = false;
}
```

### 2. 按需 import 单个模块的好处

NG-ZORRO 的 `ng-zorro-antd/button` 是**独立 entry point**——只需要按钮就只 import 按钮模块，**Tree Shaking 后只有按钮代码进 bundle**。

```ts
// 推荐：按组件按需引入
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';

// 不推荐：整包 import（v17+ 已废弃）
// import { ... } from 'ng-zorro-antd';
```

### 3. `<button nz-button>` vs `<nz-button>` 标签

NG-ZORRO 的 Button 是**属性指令**而非独立组件——所以是 `<button nz-button>` 把 `nz-button` 作为属性加在原生 `<button>` 上。这种设计的好处是：

- 直接复用原生 `<button>` 的 a11y 行为（type / disabled / autofocus）
- 配合 `routerLink` 直接做导航按钮：`<a nz-button [routerLink]="['/foo']">`

但其他组件（如 `<nz-icon>` / `<nz-card>` / `<nz-modal>`）是独立组件标签——**这种「指令 + 独立组件」混合是 NG-ZORRO 的命名风格**。

## 第一个表单：NzForm + Reactive Forms

中后台 90% 场景都是表单。NG-ZORRO 的 `<nz-form>` 与 Angular Reactive Forms 深度集成。

```ts
// src/app/login.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzCheckboxModule],
  template: `
    <form nz-form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired nzFor="username">用户名</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="请输入用户名">
          <input nz-input id="username" formControlName="username" placeholder="用户名">
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired nzFor="password">密码</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="请输入密码">
          <input nz-input id="password" formControlName="password" type="password" placeholder="密码">
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="14">
          <label nz-checkbox formControlName="remember">记住我</label>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="14">
          <button nz-button nzType="primary" [disabled]="!loginForm.valid">登录</button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);

  loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.message.success(`登录成功：${this.loginForm.value.username}`);
    } else {
      Object.values(this.loginForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
```

### 表单要点速记

- `<form nz-form [formGroup]>`：宿主元素加 `nz-form` 指令以应用 NG-ZORRO 表单样式
- `<nz-form-item>`：每个字段一行（横向布局下自带 `display: flex`）
- `<nz-form-label [nzSpan]="6">`：标签栅格宽度（24 栅格制）
- `<nz-form-control [nzSpan]="14" nzErrorTip="错误提示">`：控件区域 + 校验失败提示
- `nzRequired`：标签前自动渲染红色星号
- `nzLayout="vertical | horizontal | inline"`：三种表单布局

## 国际化 i18n

### 默认 locale 设置

`ng add` 时选了 `zh_CN`，schematic 会自动注入 `provideNzI18n(zh_CN)`。也可以手动改：

```ts
// src/app/app.config.ts
import { provideNzI18n, zh_CN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';

registerLocaleData(zh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideNzI18n(zh_CN),
    // ... 其他 providers
  ]
};
```

`registerLocaleData(zh)` 是**必需步骤**——NG-ZORRO 的 DatePicker / Calendar / Pagination 等组件依赖 Angular 自身的 locale data（数字格式 / 周几缩写 / 月份名称），不注册会出现 `Missing locale data` 错误。

### 运行时切换 locale

```ts
import { Component, inject } from '@angular/core';
import { NzI18nService, en_US, zh_CN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import zh from '@angular/common/locales/zh';

registerLocaleData(en);
registerLocaleData(zh);

@Component({ /* ... */ })
export class LangSwitcherComponent {
  private i18n = inject(NzI18nService);

  switchToEn(): void {
    this.i18n.setLocale(en_US);
  }

  switchToZh(): void {
    this.i18n.setLocale(zh_CN);
  }
}
```

### 日期 locale（DatePicker 用）

NG-ZORRO 的 `<nz-date-picker>` 默认用 Angular 的 `DatePipe`——但**周数计算可能与 ISO 标准不一致**。生产环境推荐用 `date-fns` 适配器：

```ts
import { NZ_DATE_LOCALE } from 'ng-zorro-antd/i18n';
import { zhCN } from 'date-fns/locale';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NZ_DATE_LOCALE, useValue: zhCN }
  ]
};
```

`NZ_DATE_LOCALE` 与 `NZ_I18N` 是**两套 locale**——前者管日期格式、后者管 NG-ZORRO 内部文案（如 "确定" "取消" "请选择"）。

## 图标注册

### `<nz-icon>` 基础用法

NG-ZORRO v19+ 推荐用 `<nz-icon>` 新标签替代 `<i nz-icon>` 老写法：

```html
<!-- 推荐：v19+ 新标签 -->
<nz-icon nzType="star" />
<nz-icon nzType="loading" nzSpin />
<nz-icon nzType="setting" nzTheme="fill" />
<nz-icon nzType="smile" nzTheme="twotone" nzTwotoneColor="#52c41a" />

<!-- 兼容：老写法仍可用 -->
<i nz-icon nzType="star"></i>
<span nz-icon nzType="loading" nzSpin></span>
```

### 静态注册（推荐生产用）

`ng add` 时如选了「图标动态加载 = N」（关闭动态加载），就必须用 `provideNzIcons([...])` **显式注册**仅用到的图标——Tree Shaking 友好：

```ts
// src/app/app.config.ts
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  StarFill,
  StarOutline,
  EditOutline,
  DeleteOutline,
  PlusOutline,
  LoadingOutline
} from '@ant-design/icons-angular/icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNzIcons([
      StarFill,
      StarOutline,
      EditOutline,
      DeleteOutline,
      PlusOutline,
      LoadingOutline
    ])
  ]
};
```

### 动态加载（开发期方便）

如果 `ng add` 时选了「图标动态加载 = Y」，就**不需要 `provideNzIcons`**——NG-ZORRO 会从 `assets/` 目录按需 fetch SVG：

```json
// angular.json（schematic 自动注入）
{
  "assets": [
    {
      "glob": "**/*",
      "input": "./node_modules/@ant-design/icons-angular/src/inline-svg/",
      "output": "/assets/"
    }
  ]
}
```

**生产环境慎用动态加载**——会增加 HTTP 请求 + 资源体积。推荐开发期用动态加载方便、生产改静态 `provideNzIcons`。

### Lazy 路由的图标补丁

如果某个 lazy 路由用了独有的图标（如管理后台才用到的 `UploadOutline`），可以用 `provideNzIconsPatch` 局部注册：

```ts
// src/app/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { provideNzIconsPatch } from 'ng-zorro-antd/icon';
import { UploadOutline, DownloadOutline } from '@ant-design/icons-angular/icons';

export const adminRoutes: Routes = [
  {
    path: '',
    providers: [
      provideNzIconsPatch([UploadOutline, DownloadOutline])
    ],
    loadComponent: () => import('./admin.component').then(m => m.AdminComponent)
  }
];
```

这样主 bundle 不会带这两个图标——只有进 admin 路由时才加载。

## 主题与样式

### 三种主题集成方式

| 方式 | 适用场景 | 配置位置 |
| --- | --- | --- |
| **预编译 CSS** | 不需要改 primary color、不用 Less | `angular.json` 的 `styles` |
| **Less 编译** | 改 primary color / 圆角 / 字号 | `src/theme.less` + Less import |
| **CSS Variables（实验）** | 运行时切换主题 | `ng-zorro-antd.variable.min.css` |

### 方式一：预编译 CSS

最简单——直接引完整 min css：

```json
// angular.json
{
  "styles": [
    "node_modules/ng-zorro-antd/ng-zorro-antd.min.css",
    "src/styles.css"
  ]
}
```

NG-ZORRO 内置 4 套预编译主题：

| 文件 | 含义 |
| --- | --- |
| `ng-zorro-antd.min.css` | 默认主题（蓝） |
| `ng-zorro-antd.dark.min.css` | 暗色主题 |
| `ng-zorro-antd.compact.min.css` | 紧凑主题 |
| `ng-zorro-antd.aliyun.min.css` | 阿里云主题（橘） |
| `ng-zorro-antd.variable.min.css` | CSS Variables 版（实验） |

切换暗色：把 `styles` 数组里的 `ng-zorro-antd.min.css` 换成 `ng-zorro-antd.dark.min.css` 即可。

### 方式二：Less 编译定制

`ng add` 时选「自定义主题 = y」，schematic 会生成 `src/theme.less`：

```less
// src/theme.less
@import "~ng-zorro-antd/ng-zorro-antd.less";

// === 覆盖主题变量 ===
@primary-color: #1da57a;           // 主色（默认 #1677ff）
@link-color: #1da57a;              // 链接色
@success-color: #52c41a;           // 成功色
@warning-color: #faad14;           // 警告色
@error-color: #f5222d;             // 错误色
@font-size-base: 14px;             // 基础字号
@heading-color: rgba(0, 0, 0, 0.85); // 标题色
@text-color: rgba(0, 0, 0, 0.65);  // 主文本色
@border-radius-base: 4px;          // 基础圆角
@border-color-base: #d9d9d9;       // 边框色
@box-shadow-base:                  // 阴影
  0 3px 6px -4px rgba(0, 0, 0, 0.12),
  0 6px 16px 0 rgba(0, 0, 0, 0.08),
  0 9px 28px 8px rgba(0, 0, 0, 0.05);
```

然后修改 `angular.json` 把预编译 CSS 替换成自定义 Less：

```json
// angular.json
{
  "styles": [
    "src/theme.less",
    "src/styles.css"
  ]
}
```

### 方式三：CSS Variables 实验主题（运行时切换）

引入 `ng-zorro-antd.variable.min.css` + 用 `NzConfigService` 改主题：

```json
// angular.json
{
  "styles": ["node_modules/ng-zorro-antd/ng-zorro-antd.variable.min.css"]
}
```

```ts
// 运行时切换主题色
import { Component, inject } from '@angular/core';
import { NzConfigService } from 'ng-zorro-antd/core/config';

@Component({ /* ... */ })
export class ThemeSwitcherComponent {
  private nzConfigService = inject(NzConfigService);

  switchToPrimaryGreen(): void {
    this.nzConfigService.set('theme', { primaryColor: '#1da57a' });
  }
}
```

> **CSS Variables 主题目前仍是 Experimental**——生产推荐 Less 编译时定制。详见 [指南 → 主题](./guide-line.md#less-主题定制)。

## 全局配置 NzConfigService

NG-ZORRO 70+ 组件几乎都支持「**全局默认值**」配置——在 `app.config.ts` 用 `provideNzConfig` 注入：

```ts
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';

const ngZorroConfig: NzConfig = {
  message: {
    nzTop: 120,           // Message 距顶部距离
    nzDuration: 3000      // 默认显示 3 秒
  },
  notification: {
    nzTop: 240,
    nzPlacement: 'topRight'
  },
  button: {
    nzSize: 'large'       // 全局按钮大尺寸
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideNzConfig(ngZorroConfig)
  ]
};
```

运行时动态调整：

```ts
import { NzConfigService } from 'ng-zorro-antd/core/config';

export class SettingsComponent {
  private nzConfigService = inject(NzConfigService);

  enlargeButtons(): void {
    this.nzConfigService.set('button', { nzSize: 'large' });
  }
}
```

优先级（高到低）：

1. 组件 instance prop（`<button nz-button nzSize="small">`）
2. `NzConfigService.set()` 设置
3. `provideNzConfig` 初始注入
4. NG-ZORRO 内置默认值

## Angular SSR 集成

NG-ZORRO 全组件天然支持 Angular SSR。

```bash
# 启用 SSR（创建项目时选 SSR=yes，或后期 ng add）
ng add @angular/ssr
```

`app.config.ts` 加 `provideClientHydration`：

```ts
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideNzI18n(zh_CN),
    provideAnimationsAsync(),
    // ...
  ]
};
```

### SSR 注意事项

- **避免 `window` / `document` 直接调用**：所有 NG-ZORRO 弹层组件（`NzModalService` / `NzNotificationService`）都在 `appendTo: document.body` —— SSR 渲染时浏览器对象不存在，但 NG-ZORRO 内部已用 `PlatformId` 做 isBrowser 守卫
- **CSS Variables 主题在 SSR**：需要保证 HTML head 里有变量定义、否则首屏闪烁
- **图标 Lazy 加载**：SSR 时无法 fetch `assets/`，建议**所有 SSR 路由用 `provideNzIcons` 静态注册**

## 第一个完整页面

把按钮 + 表单 + 表格 + 图标拼一个最小可跑的中后台首页：

```ts
// src/app/home.component.ts
import { Component, inject, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpaceModule } from 'ng-zorro-antd/space';

interface User {
  id: number;
  name: string;
  age: number;
  address: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NzButtonModule,
    NzTableModule,
    NzIconModule,
    NzPopconfirmModule,
    NzSpaceModule
  ],
  template: `
    <nz-space>
      <button *nzSpaceItem nz-button nzType="primary" (click)="addUser()">
        <nz-icon nzType="plus" />
        新增用户
      </button>
      <button *nzSpaceItem nz-button (click)="refresh()">
        <nz-icon nzType="reload" />
        刷新
      </button>
    </nz-space>

    <nz-table
      #userTable
      [nzData]="users()"
      [nzPageSize]="5"
      style="margin-top: 16px"
    >
      <thead>
        <tr>
          <th>ID</th>
          <th>姓名</th>
          <th>年龄</th>
          <th>地址</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        @for (user of userTable.data; track user.id) {
          <tr>
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.age }}</td>
            <td>{{ user.address }}</td>
            <td>
              <a (click)="edit(user)">
                <nz-icon nzType="edit" />
                编辑
              </a>
              <nz-divider nzType="vertical" />
              <a
                nz-popconfirm
                nzPopconfirmTitle="确认删除？"
                (nzOnConfirm)="remove(user)"
              >
                <nz-icon nzType="delete" />
                删除
              </a>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `
})
export class HomeComponent {
  private message = inject(NzMessageService);

  users = signal<User[]>([
    { id: 1, name: 'Alice', age: 28, address: '北京朝阳' },
    { id: 2, name: 'Bob', age: 32, address: '上海浦东' },
    { id: 3, name: 'Charlie', age: 25, address: '深圳南山' }
  ]);

  addUser(): void {
    // 注意：必须 immutable 更新（OnPush 模式）
    const newUser: User = {
      id: this.users().length + 1,
      name: `User${this.users().length + 1}`,
      age: 20 + this.users().length,
      address: '未知'
    };
    this.users.update(list => [...list, newUser]);
    this.message.success('新增成功');
  }

  edit(user: User): void {
    this.message.info(`编辑 ${user.name}`);
  }

  remove(user: User): void {
    this.users.update(list => list.filter(u => u.id !== user.id));
    this.message.success(`已删除 ${user.name}`);
  }

  refresh(): void {
    this.message.info('已刷新');
  }
}
```

### 模板要点

- **Signal API 完美适配**：`signal<User[]>([])` + `signal.update(list => [...list, item])` 完全 immutable
- **`@for (track user.id)`**：Angular 17+ 新控制流，**track 必填**
- **`*nzSpaceItem`**：`<nz-space>` 的子元素必须加这个结构指令以应用间距
- **`nz-popconfirm` 是属性指令**：加在任意可点击元素上做二次确认

## 暗色主题一行启用

最简单的方式——`angular.json` 把默认 CSS 换成 `ng-zorro-antd.dark.min.css`：

```json
{
  "styles": ["node_modules/ng-zorro-antd/ng-zorro-antd.dark.min.css"]
}
```

需要**同时支持 暗/亮 切换**？两种方案：

1. **Less 编译 2 个 bundle**：详见 [指南 → 动态主题](./guide-line.md#less-主题定制) 章节的 `loadCss` 函数方案
2. **CSS Variables**：用 `ng-zorro-antd.variable.min.css` + `NzConfigService.set('theme', {...})`

## ng generate 模板速记

NG-ZORRO 自带 5 大 schematic 模板，一行命令生成可用模块：

```bash
# 1. Dashboard 仪表板
ng generate ng-zorro-antd:dashboard

# 2. 表单（多种变种）
ng generate ng-zorro-antd:form
ng generate ng-zorro-antd:form-normal-login login    # 登录表单
ng generate ng-zorro-antd:form-step-register register # 注册步骤表单

# 3. List 列表（带搜索筛选）
ng generate ng-zorro-antd:list

# 4. TreeView 树视图
ng generate ng-zorro-antd:tree-view

# 5. Sidemenu 侧边菜单（如 ng add 时漏选可补）
ng generate ng-zorro-antd:sidemenu
```

每个模板都生成**完整 Component + Module + Template + Style + Mock 数据**——开箱即用，新人 10 分钟拼出可演示的中后台。

## 与 Tailwind CSS 集成

NG-ZORRO 与 Tailwind 4 可共存，但要注意优先级：

```bash
ng add @nguniversal/tailwind         # 第三方 schematic（社区维护）
# 或手动安装
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

NG-ZORRO 组件样式优先级通常高于 Tailwind utility——需要时用 `!` 强制：

```html
<button nz-button class="!px-8 !py-3">大按钮</button>
```

或在 `tailwind.config.js` 启用 `important: true` 全局提升优先级。

## 验证安装

```bash
ng serve --open
```

打开浏览器看到 `http://localhost:4200`、按钮 / 表单 / 表格 / 图标都正常显示——NG-ZORRO 集成完成。

```bash
# 终端版本检查
ng version

# 输出节选：
# Angular CLI: 21.x.x
# Angular: 21.x.x
# ng-zorro-antd: 21.x.x
```

## 进阶：ng-alain 完整脚手架

如果项目是**复杂中后台**（含 ACL 权限 / 主题切换器 / 多语言切换 UI / 内置 Layout 模式 / Mock 数据服务），直接用 `ng-alain` 脚手架：

```bash
# 全局安装 ng-alain CLI
pnpm add -g ng-alain

# 创建项目
ng new my-admin --collection=ng-alain
```

`ng-alain` 是**国内 Angular 中后台事实标准模板**——基于 NG-ZORRO + Angular CLI + ACL 权限 + 国际化 + 主题切换 + Mock 服务 + STForm 强化表单 + STTable 强化表格。**对标 React 阵营 ant-design-pro**。详见 [ng-alain.com](https://ng-alain.com/)。

## 常见问题速记

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| `<nz-icon>` 显示空白 | 图标未注册 | `provideNzIcons([XxxOutline])` 加上 |
| `Cannot find module 'ng-zorro-antd/xxx'` | 模块路径写错 | 看官方组件页 import 示例 |
| 表格数据不刷新 | OnPush 数据 mutate | 用 `[...arr, item]` immutable 更新 |
| DatePicker 周数不对 | Angular DatePipe 周计算非 ISO | 改用 `NZ_DATE_LOCALE` + `date-fns` |
| Less 编译报错 | `@angular-builders/custom-webpack` 未装 | `pnpm add -D @angular-builders/custom-webpack` |
| `Missing locale data` | 未 `registerLocaleData(zh)` | app.config.ts 顶部加上 |
| 第一次渲染样式闪烁 | SSR critical CSS 未注入 | `provideClientHydration` 加上 |
| Tailwind 与 NG-ZORRO 冲突 | NG-ZORRO 选择器优先级高 | 用 `!important` 或 Tailwind `important: true` |

## 下一步

入门完成。继续往下：

- [指南](./guide-line.md)：70+ 组件全景 + Form / Table / Modal / 主题完整方案 + Locale / SSR / 踩坑
- [参考](./reference.md)：组件清单 + Less 变量 + NzConfig + TypeScript types 速查
