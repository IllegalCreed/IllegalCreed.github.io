---
layout: doc
outline: [2, 3]
---

# 参考

本章为 Angular Material v20.x 的 **API 速查手册**——按官方文档结构组织：60+ 组件清单 / @angular/cdk 15+ 子模块 / `mat.theme()` 完整选项 / `--mat-sys-*` CSS Variables 全表 / `mat.{component}-overrides()` mixin / schematics / Component Harnesses。

## 包速查

| 包 | 版本 | 用途 |
| --- | --- | --- |
| `@angular/material` | 20.x | Material Design 60+ 组件 |
| `@angular/cdk` | 20.x | Component Dev Kit 行为底座（必装） |
| `@angular/material-moment-adapter` | 20.x | Datepicker Moment.js 适配器 |
| `@angular/material-luxon-adapter` | 20.x | Datepicker Luxon 适配器 |
| `@angular/material-date-fns-adapter` | 20.x | Datepicker date-fns 适配器（推荐） |
| `@angular/animations` | 20.x | Material 动画依赖（peerDependency） |
| `@angular/cdk/testing` | 20.x | Component Test Harnesses |

```bash
ng add @angular/material              # 一键安装 + 配置
pnpm add @angular/material-date-fns-adapter date-fns
```

## Angular Material 60+ 组件清单

按官方 [Components Categories](https://material.angular.dev/components/categories) 7 大分类。

### Form Controls（14）

| 组件 | 选择器 / 指令 | 用途 | Import |
| --- | --- | --- | --- |
| MatFormField | `<mat-form-field>` | 表单字段容器 | `@angular/material/form-field` |
| MatLabel | `<mat-label>` | 标签 | `@angular/material/form-field` |
| MatHint | `<mat-hint>` | 提示文本 | `@angular/material/form-field` |
| MatError | `<mat-error>` | 错误文本 | `@angular/material/form-field` |
| MatPrefix / MatTextPrefix | `matPrefix` / `matTextPrefix` | 前缀 | `@angular/material/form-field` |
| MatSuffix / MatTextSuffix | `matSuffix` / `matTextSuffix` | 后缀 | `@angular/material/form-field` |
| MatInput | `matInput` 指令 | 文本输入 | `@angular/material/input` |
| MatSelect | `<mat-select>` | 下拉选择 | `@angular/material/select` |
| MatOption | `<mat-option>` | 选项 | `@angular/material/core` |
| MatOptgroup | `<mat-optgroup>` | 选项分组 | `@angular/material/core` |
| MatAutocomplete | `<mat-autocomplete>` | 自动补全 | `@angular/material/autocomplete` |
| MatCheckbox | `<mat-checkbox>` | 复选框 | `@angular/material/checkbox` |
| MatRadioGroup / MatRadioButton | `<mat-radio-group>` / `<mat-radio-button>` | 单选 | `@angular/material/radio` |
| MatSlideToggle | `<mat-slide-toggle>` | 开关 | `@angular/material/slide-toggle` |
| MatSlider | `<mat-slider>` | 滑块 | `@angular/material/slider` |
| MatDatepicker | `<mat-datepicker>` + `matDatepicker` | 日期选择 | `@angular/material/datepicker` |
| MatDateRangePicker | `<mat-date-range-picker>` | 日期范围 | `@angular/material/datepicker` |
| MatTimepicker（v20） | `<mat-timepicker>` | 时间选择 | `@angular/material/timepicker` |
| MatChipGrid / MatChipRow | `<mat-chip-grid>` / `<mat-chip-row>` | 多值标签 | `@angular/material/chips` |
| MatButtonToggle | `<mat-button-toggle>` | 按钮组 | `@angular/material/button-toggle` |
| MatStepper | `<mat-stepper>` | 多步表单 | `@angular/material/stepper` |
| MatTree | `<mat-tree>` | 树形 | `@angular/material/tree` |

### Navigation（4）

| 组件 | 选择器 | 用途 | Import |
| --- | --- | --- | --- |
| MatToolbar | `<mat-toolbar>` | 顶部工具栏 | `@angular/material/toolbar` |
| MatSidenav | `<mat-sidenav>` + `<mat-sidenav-container>` | 侧边抽屉 | `@angular/material/sidenav` |
| MatMenu | `<mat-menu>` + `matMenuTriggerFor` | 下拉菜单 | `@angular/material/menu` |
| MatNavList | `<mat-nav-list>` | 导航列表 | `@angular/material/list` |

### Layout（6）

| 组件 | 选择器 | 用途 | Import |
| --- | --- | --- | --- |
| MatCard | `<mat-card>` | 卡片 | `@angular/material/card` |
| MatDivider | `<mat-divider>` | 分割线 | `@angular/material/divider` |
| MatExpansionPanel | `<mat-expansion-panel>` | 折叠面板 | `@angular/material/expansion` |
| MatAccordion | `<mat-accordion>` | 手风琴 | `@angular/material/expansion` |
| MatGridList | `<mat-grid-list>` | 栅格 | `@angular/material/grid-list` |
| MatList | `<mat-list>` | 列表 | `@angular/material/list` |

### Buttons & Indicators（8）

| 组件 | 选择器 / 指令 | 用途 | Import |
| --- | --- | --- | --- |
| MatButton | `matButton` 指令 | 普通按钮（text / filled / outlined / elevated / tonal） | `@angular/material/button` |
| MatIconButton | `matIconButton` | 图标按钮 | `@angular/material/button` |
| MatFabButton | `matFab` | 浮动操作按钮 | `@angular/material/button` |
| MatMiniFabButton | `matMiniFab` | 迷你 FAB | `@angular/material/button` |
| MatExtendedFabButton | `matExtendedFab` | 扩展 FAB（带文字） | `@angular/material/button` |
| MatBadge | `matBadge` 指令 | 角标 | `@angular/material/badge` |
| MatChip / MatChipSet | `<mat-chip>` / `<mat-chip-set>` | 标签 | `@angular/material/chips` |
| MatIcon | `<mat-icon>` | 图标 | `@angular/material/icon` |
| MatProgressBar | `<mat-progress-bar>` | 进度条 | `@angular/material/progress-bar` |
| MatProgressSpinner | `<mat-progress-spinner>` | 进度环 | `@angular/material/progress-spinner` |
| MatRipple | `matRipple` 指令 | 涟漪 | `@angular/material/core` |

### Popups & Modals（7）

| Service / 组件 | 触发方式 | 用途 | Import |
| --- | --- | --- | --- |
| MatDialog | `dialog.open(Component)` | 模态对话框 | `@angular/material/dialog` |
| MatBottomSheet | `bottomSheet.open(Component)` | 底部抽屉 | `@angular/material/bottom-sheet` |
| MatSnackBar | `snackBar.open(msg)` | 顶部通知 | `@angular/material/snack-bar` |
| MatTooltip | `matTooltip` 指令 | 工具提示 | `@angular/material/tooltip` |
| MatMenu | `matMenuTriggerFor` | 下拉菜单 | `@angular/material/menu` |
| MatAutocomplete | `[matAutocomplete]` 指令 | 自动补全 | `@angular/material/autocomplete` |

### Data Table（4）

| 组件 | 选择器 | 用途 | Import |
| --- | --- | --- | --- |
| MatTable | `<table mat-table>` | 数据表 | `@angular/material/table` |
| MatPaginator | `<mat-paginator>` | 分页 | `@angular/material/paginator` |
| MatSort / MatSortHeader | `matSort` / `mat-sort-header` | 排序 | `@angular/material/sort` |
| MatTableDataSource | DataSource class | 数据源（内置排序 + 分页支持） | `@angular/material/table` |

### Tabs（1）

| 组件 | 选择器 | 用途 | Import |
| --- | --- | --- | --- |
| MatTabGroup | `<mat-tab-group>` | 标签页组 | `@angular/material/tabs` |
| MatTab | `<mat-tab>` | 单个标签 | `@angular/material/tabs` |
| MatTabNav | `<nav mat-tab-nav-bar>` | 导航标签（带 router） | `@angular/material/tabs` |

## @angular/cdk 15+ 子模块速查

CDK 是 Angular Material 的底层行为库——独立可用。

| 模块 | 路径 | 关键 API |
| --- | --- | --- |
| A11y | `@angular/cdk/a11y` | FocusTrap / FocusMonitor / LiveAnnouncer / ListKeyManager / FocusKeyManager |
| Bidi | `@angular/cdk/bidi` | Directionality（'ltr' / 'rtl' 监听） |
| Clipboard | `@angular/cdk/clipboard` | `cdkCopyToClipboard` 指令 / Clipboard service |
| Collections | `@angular/cdk/collections` | SelectionModel / DataSource |
| Drag-Drop | `@angular/cdk/drag-drop` | `cdkDrag` / `cdkDropList` / `moveItemInArray` |
| Layout | `@angular/cdk/layout` | BreakpointObserver / MediaMatcher / Breakpoints |
| Observers | `@angular/cdk/observers` | `cdkObserveContent` 指令（DOM mutation 观察） |
| Overlay | `@angular/cdk/overlay` | Overlay / OverlayRef / PositionStrategy |
| Platform | `@angular/cdk/platform` | Platform service（运行环境检测） |
| Portal | `@angular/cdk/portal` | ComponentPortal / TemplatePortal / CdkPortalOutlet |
| Scrolling | `@angular/cdk/scrolling` | `cdk-virtual-scroll-viewport` / ScrollDispatcher |
| Stepper | `@angular/cdk/stepper` | CdkStepper（headless 步骤器） |
| Table | `@angular/cdk/table` | CdkTable（headless 表格） |
| Testing | `@angular/cdk/testing` | TestbedHarnessEnvironment / HarnessLoader |
| Text-field | `@angular/cdk/text-field` | `cdkTextareaAutosize` / `cdkAutofill` |
| Tree | `@angular/cdk/tree` | CdkTree（headless 树） |
| Coercion | `@angular/cdk/coercion` | `coerceBooleanProperty` / `coerceNumberProperty` |
| Keycodes | `@angular/cdk/keycodes` | ENTER / ESCAPE / ARROW_UP 等常量 |

### @angular/cdk/a11y

```ts
import {
  A11yModule,              // 整个 a11y module（可选用于 NgModule）
  FocusMonitor,            // 监听元素 focus 来源（mouse / keyboard / programmatic）
  FocusTrap,               // 焦点陷阱（dialog 内）
  FocusTrapFactory,        // FocusTrap 工厂
  LiveAnnouncer,           // ARIA Live Region 公告
  ListKeyManager,          // List 方向键管理
  FocusKeyManager,         // List + Focus 方向键管理
  CdkAriaLive,             // `cdkAriaLive` 指令
  ConfigurableFocusTrap,
  FocusOrigin,             // 'mouse' | 'keyboard' | 'touch' | 'program' | null
  HighContrastModeDetector,
} from '@angular/cdk/a11y';
```

### @angular/cdk/overlay

```ts
import {
  Overlay,                 // 主 service
  OverlayRef,              // 返回的浮层句柄
  OverlayConfig,           // 配置
  OverlayContainer,        // DOM 容器
  ConnectedPosition,       // 相对定位
  GlobalPositionStrategy,  // 全局定位
  FlexibleConnectedPositionStrategy,
  ScrollStrategy,          // close / reposition / block / noop
  RepositionScrollStrategy,
  CloseScrollStrategy,
  BlockScrollStrategy,
  NoopScrollStrategy,
  OverlayPositionBuilder,
  ScrollStrategyOptions,
} from '@angular/cdk/overlay';
```

### @angular/cdk/layout

```ts
import {
  BreakpointObserver,      // 主 service
  BreakpointState,         // { matches: boolean, breakpoints: {[key: string]: boolean} }
  Breakpoints,             // 预设断点常量
  MediaMatcher,            // 底层 mediaQuery 工具
  LayoutModule,
} from '@angular/cdk/layout';

// Breakpoints 全部预设
Breakpoints.XSmall          // (max-width: 599.98px)
Breakpoints.Small           // 600-959.98px
Breakpoints.Medium          // 960-1279.98px
Breakpoints.Large           // 1280-1919.98px
Breakpoints.XLarge          // 1920px+

Breakpoints.Handset
Breakpoints.HandsetPortrait
Breakpoints.HandsetLandscape

Breakpoints.Tablet
Breakpoints.TabletPortrait
Breakpoints.TabletLandscape

Breakpoints.Web
Breakpoints.WebPortrait
Breakpoints.WebLandscape
```

### @angular/cdk/drag-drop

```ts
import {
  CdkDrag,                 // `cdkDrag` 指令
  CdkDropList,             // `cdkDropList` 指令
  CdkDropListGroup,        // 多个 drop list 联动
  CdkDragHandle,           // 拖拽手柄
  CdkDragPlaceholder,      // 占位元素
  CdkDragPreview,          // 拖拽预览
  CdkDragDrop,             // 事件类型
  CdkDragStart,
  CdkDragEnd,
  CdkDragEnter,
  CdkDragExit,
  moveItemInArray,         // 工具函数
  transferArrayItem,       // 跨列表转移
  copyArrayItem,
  DragDrop,                // 编程式 service
  DragDropConfig,
  DragDropModule,
} from '@angular/cdk/drag-drop';
```

### @angular/cdk/scrolling

```ts
import {
  CdkVirtualScrollViewport,   // `<cdk-virtual-scroll-viewport>`
  CdkFixedSizeVirtualScroll,  // `itemSize` 固定高度
  CdkVirtualForOf,            // `*cdkVirtualFor`
  CdkVirtualScrollableElement,
  CdkScrollable,
  ScrollDispatcher,           // 滚动事件分发
  ScrollingModule,
} from '@angular/cdk/scrolling';
```

### @angular/cdk/portal

```ts
import {
  Portal,
  ComponentPortal,         // 包装 Component class
  TemplatePortal,          // 包装 TemplateRef
  DomPortal,               // 包装原生 DOM
  CdkPortal,
  CdkPortalOutlet,         // 渲染槽 `<ng-template [cdkPortalOutlet]>`
  PortalModule,
} from '@angular/cdk/portal';
```

## mat.theme() 完整选项树

```scss
@include mat.theme((
  /* ─── color ─────────────────────────────────────── */
  color: <Palette> | (
    primary: <Palette>,            /* 主色 */
    tertiary: <Palette>,           /* 三级色 */
    theme-type: color-scheme | light | dark,
    use-system-variables: true | false,
  ),

  /* ─── typography ────────────────────────────────── */
  typography: <Font> | (
    plain-family: <Font>,          /* 正文字体 */
    brand-family: <Font>,          /* 标题字体 */
    bold-weight: <Number>,         /* 默认 700 */
    medium-weight: <Number>,       /* 默认 500 */
    regular-weight: <Number>,      /* 默认 400 */
    use-system-variables: true | false,
  ),

  /* ─── density ──────────────────────────────────── */
  density: 0 | -1 | -2 | -3 | -4 | -5,   /* 0 = 默认，-5 = 最紧凑 */
));
```

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

### Prebuilt theme CSS（无需 Sass）

```json
"styles": [
  "@angular/material/prebuilt-themes/azure-blue.css",
  /* 或 */
  "@angular/material/prebuilt-themes/rose-red.css",
  "@angular/material/prebuilt-themes/cyan-orange.css",
  "@angular/material/prebuilt-themes/magenta-violet.css",
  /* M2（已过时，仅遗留）*/
  "@angular/material/prebuilt-themes/deeppurple-amber.css",
  "@angular/material/prebuilt-themes/indigo-pink.css",
  "@angular/material/prebuilt-themes/pink-bluegrey.css",
  "@angular/material/prebuilt-themes/purple-green.css"
]
```

| Prebuilt CSS | Design system | Light / Dark | Palette |
| --- | --- | --- | --- |
| `azure-blue.css` | **M3** | Light | azure + blue |
| `rose-red.css` | **M3** | Light | rose + red |
| `cyan-orange.css` | **M3** | Dark | cyan + orange |
| `magenta-violet.css` | **M3** | Dark | magenta + violet |
| `deeppurple-amber.css` | M2（旧） | Light | deep-purple + amber |
| `indigo-pink.css` | M2（旧） | Light | indigo + pink |
| `pink-bluegrey.css` | M2（旧） | Dark | pink + blue-grey |
| `purple-green.css` | M2（旧） | Dark | purple + green |

## --mat-sys-* CSS Variables 全表

### Color（45+）

```css
/* Primary（9）*/
--mat-sys-primary
--mat-sys-on-primary
--mat-sys-primary-container
--mat-sys-on-primary-container
--mat-sys-primary-fixed
--mat-sys-on-primary-fixed
--mat-sys-on-primary-fixed-variant
--mat-sys-primary-fixed-dim
--mat-sys-inverse-primary

/* Secondary（8）*/
--mat-sys-secondary
--mat-sys-on-secondary
--mat-sys-secondary-container
--mat-sys-on-secondary-container
--mat-sys-secondary-fixed
--mat-sys-on-secondary-fixed
--mat-sys-on-secondary-fixed-variant
--mat-sys-secondary-fixed-dim

/* Tertiary（8）*/
--mat-sys-tertiary
--mat-sys-on-tertiary
--mat-sys-tertiary-container
--mat-sys-on-tertiary-container
--mat-sys-tertiary-fixed
--mat-sys-on-tertiary-fixed
--mat-sys-on-tertiary-fixed-variant
--mat-sys-tertiary-fixed-dim

/* Error（4）*/
--mat-sys-error
--mat-sys-on-error
--mat-sys-error-container
--mat-sys-on-error-container

/* Surface（13）*/
--mat-sys-surface
--mat-sys-on-surface
--mat-sys-on-surface-variant
--mat-sys-surface-bright
--mat-sys-surface-container
--mat-sys-surface-container-high
--mat-sys-surface-container-highest
--mat-sys-surface-container-low
--mat-sys-surface-container-lowest
--mat-sys-surface-dim
--mat-sys-surface-tint
--mat-sys-surface-variant
--mat-sys-inverse-surface
--mat-sys-inverse-on-surface

/* Background & 杂项 */
--mat-sys-background
--mat-sys-on-background
--mat-sys-outline
--mat-sys-outline-variant
--mat-sys-scrim
--mat-sys-shadow

/* Neutral 变体 */
--mat-sys-neutral10
--mat-sys-neutral-variant20
```

### Typography（14 levels + 细粒度）

```css
/* 14 个 font 简写（font: weight size/line-height family）*/
--mat-sys-display-large
--mat-sys-display-medium
--mat-sys-display-small
--mat-sys-headline-large
--mat-sys-headline-medium
--mat-sys-headline-small
--mat-sys-title-large
--mat-sys-title-medium
--mat-sys-title-small
--mat-sys-body-large
--mat-sys-body-medium
--mat-sys-body-small
--mat-sys-label-large
--mat-sys-label-medium
--mat-sys-label-small

/* 每个 level 都有细粒度变量（举 body-large 为例）*/
--mat-sys-body-large-font
--mat-sys-body-large-size
--mat-sys-body-large-weight
--mat-sys-body-large-line-height
--mat-sys-body-large-tracking
```

### Shape（5）

```css
--mat-sys-corner-extra-small      /* 4px */
--mat-sys-corner-small            /* 8px */
--mat-sys-corner-medium           /* 12px */
--mat-sys-corner-large            /* 16px */
--mat-sys-corner-extra-large      /* 28px */
```

### Elevation（6）

```css
--mat-sys-level0
--mat-sys-level1
--mat-sys-level2
--mat-sys-level3
--mat-sys-level4
--mat-sys-level5
```

### State Layer Opacity

```css
--mat-sys-hover-state-layer-opacity
--mat-sys-focus-state-layer-opacity
--mat-sys-pressed-state-layer-opacity
--mat-sys-dragged-state-layer-opacity
```

## Utility Classes（mat.system-classes()）

```scss
@include mat.system-classes();  /* 启用后所有 class 可用 */
```

### Background

```html
<div class="mat-bg-primary">              <!-- background: var(--mat-sys-primary) -->
<div class="mat-bg-secondary">
<div class="mat-bg-tertiary">
<div class="mat-bg-error">
<div class="mat-bg-surface">
<div class="mat-bg-surface-container">
<div class="mat-bg-primary-container">
<div class="mat-bg-secondary-container">
<div class="mat-bg-tertiary-container">
<div class="mat-bg-error-container">
```

### Text

```html
<div class="mat-text-on-primary">         <!-- color: var(--mat-sys-on-primary) -->
<div class="mat-text-on-secondary">
<div class="mat-text-on-tertiary">
<div class="mat-text-on-error">
<div class="mat-text-on-surface">
<div class="mat-text-on-surface-variant">
<div class="mat-text-on-primary-container">
<div class="mat-text-on-secondary-container">
<div class="mat-text-on-tertiary-container">
<div class="mat-text-on-error-container">
```

### Typography

```html
<h1 class="mat-font-display-lg">
<h2 class="mat-font-display-md">
<h3 class="mat-font-display-sm">
<h4 class="mat-font-headline-lg">
<h5 class="mat-font-headline-md">
<h6 class="mat-font-headline-sm">

<p class="mat-font-title-lg">
<p class="mat-font-title-md">
<p class="mat-font-title-sm">

<span class="mat-font-body-lg">
<span class="mat-font-body-md">
<span class="mat-font-body-sm">

<small class="mat-font-label-lg">
<small class="mat-font-label-md">
<small class="mat-font-label-sm">
```

## Component Override Mixins

每个组件都有 `mat.{component}-overrides()` mixin 用于细粒度 token 自定义。

### 列表

| Component | Mixin |
| --- | --- |
| Button | `mat.button-overrides()` |
| Icon Button | `mat.icon-button-overrides()` |
| Fab Button | `mat.fab-overrides()` |
| Card | `mat.card-overrides()` |
| Checkbox | `mat.checkbox-overrides()` |
| Radio | `mat.radio-overrides()` |
| Slide Toggle | `mat.slide-toggle-overrides()` |
| Slider | `mat.slider-overrides()` |
| Input | `mat.input-overrides()` |
| Form Field | `mat.form-field-overrides()` |
| Select | `mat.select-overrides()` |
| Autocomplete | `mat.autocomplete-overrides()` |
| Datepicker | `mat.datepicker-overrides()` |
| Timepicker | `mat.timepicker-overrides()` |
| Chips | `mat.chips-overrides()` |
| Button Toggle | `mat.button-toggle-overrides()` |
| Stepper | `mat.stepper-overrides()` |
| Table | `mat.table-overrides()` |
| Paginator | `mat.paginator-overrides()` |
| Sort | `mat.sort-overrides()` |
| Tabs | `mat.tabs-overrides()` |
| Expansion | `mat.expansion-overrides()` |
| Dialog | `mat.dialog-overrides()` |
| Bottom Sheet | `mat.bottom-sheet-overrides()` |
| Snack Bar | `mat.snack-bar-overrides()` |
| Tooltip | `mat.tooltip-overrides()` |
| Menu | `mat.menu-overrides()` |
| List | `mat.list-overrides()` |
| Nav List | `mat.nav-list-overrides()` |
| Sidenav | `mat.sidenav-overrides()` |
| Toolbar | `mat.toolbar-overrides()` |
| Progress Bar | `mat.progress-bar-overrides()` |
| Progress Spinner | `mat.progress-spinner-overrides()` |
| Badge | `mat.badge-overrides()` |
| Icon | `mat.icon-overrides()` |
| Divider | `mat.divider-overrides()` |
| Grid List | `mat.grid-list-overrides()` |
| Tree | `mat.tree-overrides()` |

### 示例：Card overrides

```scss
@include mat.card-overrides((
  elevated-container-color: var(--mat-sys-surface-container-low),
  elevated-container-shape: 16px,
  elevated-container-elevation: var(--mat-sys-level2),
  filled-container-color: var(--mat-sys-surface-container),
  filled-container-shape: 16px,
  outlined-container-shape: 16px,
  outlined-outline-color: var(--mat-sys-outline-variant),
  title-text-color: var(--mat-sys-on-surface),
  title-text-font: var(--mat-sys-title-large-font),
  title-text-size: 1.5rem,
  title-text-weight: 700,
  subtitle-text-color: var(--mat-sys-on-surface-variant),
  subtitle-text-size: 0.875rem,
));
```

### 示例：Button overrides

```scss
@include mat.button-overrides((
  filled-container-color: #4a154b,
  filled-label-text-color: white,
  filled-container-shape: 24px,
  filled-horizontal-padding: 24px,
  outlined-outline-color: #4a154b,
  outlined-label-text-color: #4a154b,
  text-label-text-color: #4a154b,
  tonal-container-color: var(--mat-sys-secondary-container),
  tonal-label-text-color: var(--mat-sys-on-secondary-container),
  elevated-container-color: var(--mat-sys-surface-container-low),
));
```

## System Token Overrides

```scss
@include mat.theme-overrides((
  /* Primary */
  primary: #4a154b,
  on-primary: #ffffff,
  primary-container: #f5e6f7,
  on-primary-container: #1a052d,

  /* Surface */
  surface: #fffbff,
  surface-container: #f7eff7,
  surface-container-high: #ece4ec,
  surface-container-highest: #e4dde4,

  /* Shape */
  corner-large: 24px,
  corner-medium: 16px,
  corner-small: 8px,

  /* Elevation */
  level3: 0 8px 12px 6px rgba(0,0,0,0.15),
));
```

## ng add / ng generate Schematics

### ng add

```bash
ng add @angular/material           # 安装 + 配置
ng add @angular/cdk                # 仅 CDK
```

`ng add @angular/material` 交互式询问：

1. Choose prebuilt theme（azure-blue / rose-red / cyan-orange / magenta-violet / custom）
2. Set up global typography（yes / no）
3. Set up browser animations（yes / no）

### ng generate（5 大模板）

```bash
ng generate @angular/material:navigation <name>     # 响应式 sidenav 导航
ng generate @angular/material:table <name>          # 数据表 + 排序 + 分页
ng generate @angular/material:dashboard <name>      # 卡片 grid 仪表板
ng generate @angular/material:address-form <name>   # 地址表单
ng generate @angular/material:tree <name>           # 树形目录

ng generate @angular/material:theme-color           # 自定义 M3 palette
```

### ng generate @angular/cdk

```bash
ng generate @angular/cdk:drag-drop <name>           # to-do list 拖拽示例
```

### ng update

```bash
ng update @angular/material        # 升级 + 自动迁移 schematic
                                   # 自动处理 M2→M3、--mdc-* → --mat-*
```

## TypeScript 核心类型

```ts
// 主题
type ThemePalette = 'primary' | 'accent' | 'warn' | undefined;

// FormField
type MatFormFieldAppearance = 'fill' | 'outline';
type FloatLabelType = 'always' | 'auto';
type SubscriptSizing = 'fixed' | 'dynamic';

// Tabs
type ScrollDirection = 'after' | 'before';

// Sort
interface MatSortable {
  id: string;
  start: 'asc' | 'desc';
  disableClear: boolean;
}
type SortDirection = 'asc' | 'desc' | '';

// Snack Bar
interface MatSnackBarConfig<D = any> {
  data?: D;
  duration?: number;
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
  panelClass?: string | string[];
  politeness?: 'off' | 'polite' | 'assertive';
}

// Dialog
interface MatDialogConfig<D = any> {
  data?: D;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  disableClose?: boolean;
  panelClass?: string | string[];
  hasBackdrop?: boolean;
  backdropClass?: string | string[];
  closePredicate?: (result?: any) => boolean;  // v20 新增
  enterAnimationDuration?: string | number;
  exitAnimationDuration?: string | number;
  autoFocus?: 'dialog' | 'first-tabbable' | 'first-heading' | string | boolean;
  restoreFocus?: boolean | string | HTMLElement;
}

// Paginator
interface PageEvent {
  pageIndex: number;
  previousPageIndex?: number;
  pageSize: number;
  length: number;
}

// Drag-Drop
interface CdkDragDrop<T, O = T, I = any> {
  previousIndex: number;
  currentIndex: number;
  item: CdkDrag<I>;
  container: CdkDropList<T>;
  previousContainer: CdkDropList<O>;
  isPointerOverContainer: boolean;
  distance: { x: number; y: number };
  dropPoint: { x: number; y: number };
}

// Breakpoint
interface BreakpointState {
  matches: boolean;
  breakpoints: { [key: string]: boolean };
}

// MatPaginatorIntl - 分页器国际化（中文示例）
class CustomPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = '每页项数';
  override nextPageLabel = '下一页';
  override previousPageLabel = '上一页';
  override firstPageLabel = '第一页';
  override lastPageLabel = '最后一页';
  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0) return `第 1 页 共 1 页`;
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return `${start} - ${end} / ${length}`;
  };
}
```

## Component Harnesses 速查

```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';

// 60+ 组件的 Harness
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatIconButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatSelectHarness, MatOptionHarness } from '@angular/material/select/testing';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatRadioGroupHarness, MatRadioButtonHarness } from '@angular/material/radio/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { MatSliderHarness } from '@angular/material/slider/testing';
import { MatDatepickerInputHarness } from '@angular/material/datepicker/testing';
import { MatChipGridHarness, MatChipRowHarness } from '@angular/material/chips/testing';
import { MatButtonToggleHarness } from '@angular/material/button-toggle/testing';
import { MatTabGroupHarness, MatTabHarness } from '@angular/material/tabs/testing';
import { MatStepperHarness } from '@angular/material/stepper/testing';
import { MatTableHarness, MatRowHarness } from '@angular/material/table/testing';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';
import { MatSortHarness } from '@angular/material/sort/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatBottomSheetHarness } from '@angular/material/bottom-sheet/testing';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { MatMenuHarness, MatMenuItemHarness } from '@angular/material/menu/testing';
import { MatListHarness, MatNavListHarness } from '@angular/material/list/testing';
import { MatSidenavHarness, MatDrawerHarness } from '@angular/material/sidenav/testing';
import { MatToolbarHarness } from '@angular/material/toolbar/testing';
import { MatCardHarness } from '@angular/material/card/testing';
import { MatExpansionPanelHarness, MatAccordionHarness } from '@angular/material/expansion/testing';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
import { MatBadgeHarness } from '@angular/material/badge/testing';
import { MatIconHarness } from '@angular/material/icon/testing';
import { MatDividerHarness } from '@angular/material/divider/testing';
import { MatGridListHarness } from '@angular/material/grid-list/testing';
import { MatTreeHarness } from '@angular/material/tree/testing';
```

### 常用方法速查

| Harness | 关键方法 |
| --- | --- |
| `MatButtonHarness` | `click()` / `isDisabled()` / `getText()` / `focus()` / `blur()` |
| `MatInputHarness` | `setValue(v)` / `getValue()` / `getType()` / `isDisabled()` / `isRequired()` |
| `MatFormFieldHarness` | `getLabel()` / `getHint()` / `getError()` / `hasErrors()` / `getControl()` |
| `MatSelectHarness` | `open()` / `close()` / `getOptions()` / `clickOptions()` / `getValueText()` |
| `MatCheckboxHarness` | `check()` / `uncheck()` / `toggle()` / `isChecked()` / `isIndeterminate()` |
| `MatRadioButtonHarness` | `check()` / `isChecked()` / `getLabelText()` |
| `MatSlideToggleHarness` | `check()` / `uncheck()` / `isChecked()` |
| `MatDialogHarness` | `close()` / `getText()` / `getId()` / `getRole()` |
| `MatSnackBarHarness` | `dismiss()` / `getMessage()` / `hasAction()` / `dismissWithAction()` |
| `MatTableHarness` | `getRows()` / `getHeaderRows()` / `getFooterRows()` / `getCellTextByIndex()` |
| `MatPaginatorHarness` | `goToNextPage()` / `goToPreviousPage()` / `setPageSize(n)` / `getRangeLabel()` |
| `MatSortHarness` | `getSortHeaders()` |
| `MatTabGroupHarness` | `getTabs()` / `selectTab(predicate)` |
| `MatMenuHarness` | `open()` / `close()` / `clickItem(predicate)` / `getItems()` |
| `MatAutocompleteHarness` | `enterText(v)` / `getOptions()` / `selectOption(predicate)` |
| `MatDatepickerInputHarness` | `openCalendar()` / `getValue()` / `setValue(v)` |

### .with() 筛选器

```ts
// 文本匹配
const submitBtn = await loader.getHarness(MatButtonHarness.with({ text: '提交' }));

// selector 匹配
const navBtn = await loader.getHarness(MatButtonHarness.with({ selector: '.nav-btn' }));

// 嵌套匹配
const requiredInputs = await loader.getAllHarnesses(MatInputHarness.with({ required: true }));

// ancestor 匹配（祖先选择器）
const dialogBtn = await loader.getHarness(
  MatButtonHarness.with({ ancestor: '.confirm-dialog', text: '确认' }),
);
```

## angular.json 关键配置

```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "styles": [
              "@angular/material/prebuilt-themes/azure-blue.css",
              "src/styles.scss"
            ],
            "stylePreprocessorOptions": {
              "includePaths": [
                "node_modules"
              ]
            },
            "scripts": []
          }
        }
      }
    }
  }
}
```

## app.config.ts 关键 providers

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

import { routes } from './app.routes';
import { CustomPaginatorIntl } from './custom-paginator-intl';

export const appConfig: ApplicationConfig = {
  providers: [
    /* 1. 路由 */
    provideRouter(routes),

    /* 2. 动画（必加）*/
    provideAnimationsAsync(),

    /* 3. HTTP 客户端 */
    provideHttpClient(withFetch()),

    /* 4. Datepicker 适配器 */
    provideNativeDateAdapter(),

    /* 5. 中文 locale */
    { provide: MAT_DATE_LOCALE, useValue: 'zh-CN' },

    /* 6. 自定义 Paginator 中文 */
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl },

    /* 7. MatFormField 默认 outline */
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
    },
  ],
};
```

## 关键 Injection Tokens

```ts
// Datepicker
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';

// Dialog
import { MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';

// Bottom Sheet
import { MAT_BOTTOM_SHEET_DATA, MAT_BOTTOM_SHEET_DEFAULT_OPTIONS } from '@angular/material/bottom-sheet';

// Snack Bar
import { MAT_SNACK_BAR_DATA, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

// Form Field
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

// Select
import { MAT_SELECT_CONFIG } from '@angular/material/select';

// Autocomplete
import { MAT_AUTOCOMPLETE_DEFAULT_OPTIONS } from '@angular/material/autocomplete';

// Tooltip
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';

// Stepper
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

// Ripple
import { MAT_RIPPLE_GLOBAL_OPTIONS, RippleGlobalOptions } from '@angular/material/core';

// Hammer（v20+ 已不依赖，仅旧版需要）
```

## 关键事件类型

```ts
// Tab
interface MatTabChangeEvent {
  index: number;
  tab: MatTab;
}

// Stepper
interface StepperSelectionEvent {
  selectedIndex: number;
  previouslySelectedIndex: number;
  selectedStep: MatStep;
  previouslySelectedStep: MatStep;
}

// Paginator
interface PageEvent {
  pageIndex: number;
  previousPageIndex?: number;
  pageSize: number;
  length: number;
}

// Sort
interface Sort {
  active: string;
  direction: SortDirection;
}

// Datepicker
interface MatDatepickerInputEvent<D, S = unknown> {
  target: MatDatepickerInputBase<S, D>;
  targetElement: HTMLElement;
  value: D | null;
}

// Autocomplete
interface MatAutocompleteSelectedEvent {
  source: MatAutocomplete;
  option: MatOption;
}

// Drag-Drop
interface CdkDragDrop<T, O = T, I = any> {
  previousIndex: number;
  currentIndex: number;
  item: CdkDrag<I>;
  container: CdkDropList<T>;
  previousContainer: CdkDropList<O>;
  isPointerOverContainer: boolean;
  distance: { x: number; y: number };
  dropPoint: { x: number; y: number };
}
```

## v20 新特性速查

| 特性 | 说明 |
| --- | --- |
| Tonal Button | `matButton="tonal"` 新变体（M3 中等强调） |
| Filled Card | `<mat-card appearance="filled">` 新变体 |
| `closePredicate` | Dialog 关闭谓词（v20 新增 config 项） |
| `resetToBoundary()` | CdkDrag 新方法（动态边界约束） |
| `hasBackdrop` autocomplete | `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` 新选项 |
| `--mdc-*` → `--mat-*` | Token 命名重构（破坏性变更，自动迁移） |
| `prefers-reduced-motion` | 自动响应系统减少动画偏好 |
| `aria-describedby` 保留 | Form Field 更好保留外部 aria 属性 |
| `MatTimepicker` | 时间选择器（新组件） |
| Zero-duration tab animation | 改进 |
| Better null slider | 改进 |
| Tree-shakeable overlay | bundle 优化 |

## 升级 / 迁移命令

```bash
# 检查可升级版本
ng update

# 自动升级到下一个 major
ng update @angular/core @angular/cli @angular/material

# 升级到指定版本
ng update @angular/material@20

# 仅运行迁移 schematic（不变包版本）
ng update @angular/material --migrate-only
```

迁移自动处理：

- M2 API → M3 API（`mat.define-light-theme` → `mat.m2-define-light-theme` 或 `mat.theme()`）
- `--mdc-*` → `--mat-*` token 重命名
- 旧 `<button mat-button>` → `<button matButton>` 指令形式
- NgModule → standalone（部分自动）

## 重要外链

| 资源 | URL |
| --- | --- |
| 官方文档 | <https://material.angular.dev/> |
| 入门 | <https://material.angular.dev/guide/getting-started> |
| 主题 | <https://material.angular.dev/guide/theming> |
| Theming Your Components | <https://material.angular.dev/guide/theming-your-components> |
| Material 2 兼容 | <https://material.angular.dev/guide/material-2> |
| Schematics | <https://material.angular.dev/guide/schematics> |
| 组件总览 | <https://material.angular.dev/components/categories> |
| CDK 总览 | <https://material.angular.dev/cdk/categories> |
| Component Harnesses | <https://material.angular.dev/guide/using-component-harnesses> |
| GitHub angular/components | <https://github.com/angular/components> |
| Material Design 3 规范 | <https://m3.material.io/> |
| Angular 主站 | <https://angular.dev/> |
