---
layout: doc
outline: [2, 3]
---

# Ionic 参考

> 基于 Ionic 8 · 核于 2026-07

## 速查

- 版本：**Ionic 8**（最新补丁 **8.8.12**）；**8.8 是 Ionic 8 最后一个功能 minor**，下一步 **Ionic 9**（模块化重构，细节待定）
- 分工：Ionic = **UI 层**（`ion-*` 组件 + 主题）；**Capacitor / Cordova** = 原生运行时（打包 + 原生 API）
- 底座：组件是 **Stencil 编译的标准 Web Components**；`@ionic/core` + Angular/React/Vue 三 wrapper + vanilla
- 双 mode：iOS 设备→`ios`、其他→`md`；主题用 **CSS 变量**（无需 Sass），暗色 3 palette；Shadow DOM 内部用 **`::part()`**
- 路由：**各框架自己的 router** + `ion-router-outlet`（负责转场 + 页面栈 + 生命周期）

## 一、版本坐标

| 项 | 值 |
| --- | --- |
| 当前大版本 | **Ionic 8** |
| v8.0.0 首发 | **2024-04-17** |
| 最新补丁 | **8.8.12** |
| v8 最后一个功能 minor | **8.8** |
| 下一大版本 | **Ionic 9**（开发中，方向：更模块化、更易扩展；细节待定） |
| 许可 | 框架 **MIT** |
| 支持策略 | 仅最新大版本积极开发；上一版本进入维护期（只修关键 bug/安全，约 6 个月） |

## 二、组件速查（按功能分组）

| 分组 | 高频组件 |
| --- | --- |
| App 骨架/布局 | `ion-app`、`ion-content`、`ion-header`、`ion-footer`、`ion-toolbar`、`ion-title`、`ion-grid/row/col`、`ion-split-pane` |
| 导航 | `ion-router-outlet`、`ion-tabs/tab-bar/tab-button`、`ion-menu/menu-button`、`ion-back-button`、`ion-nav`、`ion-breadcrumb(s)` |
| 按钮/动作 | `ion-button`、`ion-fab/fab-button/fab-list`、`ion-icon`、`ion-ripple-effect` |
| 表单/输入 | `ion-input`、`ion-textarea`、`ion-checkbox`、`ion-radio`、`ion-toggle`、`ion-select`、`ion-range`、`ion-searchbar`、`ion-datetime`、`ion-segment` |
| 列表/条目 | `ion-list`、`ion-item`、`ion-item-sliding`、`ion-label`、`ion-note`、`ion-reorder`、`ion-avatar`、`ion-thumbnail` |
| 数据展示 | `ion-card(+header/title/subtitle/content)`、`ion-badge`、`ion-chip`、`ion-text`、`ion-img`、`ion-accordion(-group)` |
| 浮层/反馈 | `ion-modal`、`ion-popover`、`ion-alert`、`ion-action-sheet`、`ion-toast`、`ion-loading`、`ion-picker` |
| 进度/占位 | `ion-spinner`、`ion-progress-bar`、`ion-skeleton-text` |
| 滚动交互 | `ion-refresher(-content)`、`ion-infinite-scroll(-content)` |

## 三、iOS / MD 双 mode

| 平台 | 默认 mode | 覆盖方式 |
| --- | --- | --- |
| iOS 设备（iPhone/iPad） | `ios` | 全局 config 的 `mode`；或单组件 `mode='ios'` |
| Android 及其他（含桌面/网页） | `md` | 同上，`mode='md'` |

- 事件写法：React `onIonChange` / Vue `@ionChange` / Angular `(ionChange)`。
- MD 波纹由 mode 驱动，可用 config 的 `rippleEffect` 开关。

## 四、主题变量速查

- **9 个应用色**：`primary` / `secondary` / `tertiary` / `success` / `warning` / `danger` / `light` / `medium` / `dark`。
- **每色成套 6 变量**：`base` / `-rgb` / `-contrast` / `-contrast-rgb` / `-shade` / `-tint`（前缀 `--ion-color-*`）。
- **全局**：`--ion-background-color`、`--ion-text-color`、`--ion-color-step-*`。
- **改 Shadow DOM 内部**：优先组件暴露的 CSS 变量（如 `--background`）；不够用 CSS Shadow Parts `ion-xxx::part(name)`。

## 五、暗色 palette（三选一导入）

| 文件 | 行为 |
| --- | --- |
| `dark.always.css` | 永远暗色 |
| `dark.system.css` | **默认推荐**：跟随系统 `prefers-color-scheme` |
| `dark.class.css` | 手动：`<html>` 加 `.ion-palette-dark` 类才暗 |

- 路径：`@ionic/{framework}/css/palettes/`（或 `@ionic/core/css/palettes/`）。
- 覆盖暗色变量需匹配 mode 特异性（`:root.ios` / `:root.md`）；建议加 `<meta name="color-scheme" content="light dark" />`。

## 六、框架矩阵与初始化

| 包 | 目标框架 | 初始化 | 路由 |
| --- | --- | --- | --- |
| `@ionic/angular` | Angular **16–20** | `provideIonicAngular(cfg)`（standalone）/ `IonicModule.forRoot(cfg)` | Angular Router |
| `@ionic/react` | React **17+**（19 自 8.5） | `setupIonicReact(cfg)` | `@ionic/react-router` |
| `@ionic/vue` | Vue **3.0.6+**（无 Vue 2） | `app.use(IonicVue, cfg)` | Vue Router |
| `@ionic/core` | vanilla / CDN | 引 `@ionic/core` | — |

**全局 Config 常用项**：`mode` / `rippleEffect` / `animated` / `swipeBackEnabled` / `backButtonText`；可配 `isPlatform()` 按平台动态给值。

## 七、Ionic CLI 命令

```bash
npm install -g @ionic/cli               # 安装
ionic start myApp tabs --type angular   # 建项目（模板 blank/list/tabs/sidemenu；--type angular|react|vue）
ionic serve                             # 本地开发 + 热更新
ionic build                             # 生产构建
ionic generate page Home                # 生成 page/component/service（主要 Angular）
ionic info                              # 环境信息
ionic capacitor add ios                 # 对接 Capacitor 原生平台（add/sync/run）
```

## 八、常见易错点

| # | 易错点 |
| --- | --- |
| 1 | Ionic 是 **UI 库** ≠ 运行时；访问原生用 **Capacitor/Cordova** |
| 2 | 组件是**标准 Web Components（Custom Elements）**，底层 **Stencil** 编译，框架无关 |
| 3 | `@ionic/core`（vanilla）/ angular / react / vue 是**同一套组件**的不同封装 |
| 4 | 双 mode：iOS 设备→`ios`、其他→`md`；可全局或单组件 `mode='...'` 覆盖 |
| 5 | 主题用 **CSS 变量**（无需 Sass）；改 Shadow DOM 内部用 **`::part()`** |
| 6 | 应用色要**成套 6 变量**一起改，否则状态色不一致 |
| 7 | 暗色 3 palette：always / system（默认推荐）/ class（`.ion-palette-dark`） |
| 8 | 覆盖暗色变量需匹配 mode 特异性（`:root.ios` / `:root.md`） |
| 9 | 路由用**各框架自己的 router** + `ion-router-outlet`，非 Ionic 私有路由 |
| 10 | `ion-router-outlet` 比普通 outlet 多了转场/页面栈/生命周期 |
| 11 | Vue 仅支持 **Vue 3**（3.0.6+），无 Vue 2 |
| 12 | Angular v8 **Standalone 与 NgModule 并存**；Standalone 用 `provideIonicAngular` |
| 13 | 版本：Ionic **8**，最新 **8.8.x**，**8.8 是最后一个功能 minor**，下一步 Ionic 9 |
| 14 | 应用运行在原生 WebView 里（iOS WKWebView / Android WebView），经本地 `http://` 托管 |

## 九、权威链接

- [Ionic 官方文档](https://ionicframework.com/docs) · [组件总览](https://ionicframework.com/docs/components) · [API 参考](https://ionicframework.com/docs/api)
- [Theming 主题](https://ionicframework.com/docs/theming/basics) · [CSS 变量](https://ionicframework.com/docs/theming/css-variables) · [暗色模式](https://ionicframework.com/docs/theming/dark-mode)
- [Config 配置](https://ionicframework.com/docs/developing/config) · [Ionic CLI](https://ionicframework.com/docs/cli)
- [Angular 导航](https://ionicframework.com/docs/angular/navigation) · [React 导航](https://ionicframework.com/docs/react/navigation) · [Vue 导航](https://ionicframework.com/docs/vue/navigation)
- [Capacitor 官方文档](https://capacitorjs.com/docs) · [Stencil](https://stenciljs.com/) · [Ionicons](https://ionic.io/ionicons)
