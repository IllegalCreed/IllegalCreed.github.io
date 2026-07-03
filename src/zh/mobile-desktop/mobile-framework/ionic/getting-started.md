---
layout: doc
outline: [2, 3]
---

# 入门：Ionic 是什么与怎么起步

> 基于 Ionic 8 · 核于 2026-07

## 速查

- **一句话**：Ionic 是**基于 Web Components、框架无关、移动优先的开源 UI 组件库**——用 HTML/CSS/JS 写 `ion-*` 组件，一套代码上 iOS/Android/PWA/桌面（MIT 许可）
- **最大误区**：Ionic 是「**UI 层**」**不是运行时**；把 Web 应用装进原生壳、调用相机/GPS 的是 **Capacitor / Cordova**（同队出品、职责分离）——详见 [Ionic vs Capacitor](./guide-line/vs-capacitor)
- **底座**：组件是 **Stencil 编译出的标准 Web Components（Custom Elements）**，天然框架无关；`@ionic/core`（本体）+ `@ionic/angular|react|vue`（薄 wrapper）+ 纯 vanilla/CDN 皆可
- **双 mode**：同一组件按平台自动切 **iOS / MD** 外观，可全局或 `mode='ios'` 单组件覆盖（详见[组件与双 mode](./guide-line/components-modes)）
- **主题**：全靠 **CSS 变量**换肤（无需 Sass）；Shadow DOM 内部用 **CSS Shadow Parts（`::part()`）**；暗色 3 palette（详见[主题与暗色](./guide-line/theming)）
- **路由**：用**各框架自己的 router** + `ion-router-outlet` 承载转场，非 Ionic 私有路由（详见[路由与导航](./guide-line/routing)）
- **起步（CLI）**：`npm i -g @ionic/cli` → `ionic start myApp tabs --type angular|react|vue` → `cd myApp` → `ionic serve`
- **版本坐标**：**Ionic 8**（最新 **8.8.12**）；框架门槛 Angular **16+** / React **17+**（19 自 8.5）/ Vue **3.0.6+**（无 Vue 2）
- **进阶顺序**：先读[组件与双 mode](./guide-line/components-modes) → [主题与暗色](./guide-line/theming) → [框架集成](./guide-line/framework-integration) → [路由与导航](./guide-line/routing)

## 一、Ionic 解决什么问题

Ionic 要回答的问题是：**能不能用前端团队已有的 Web 技能（HTML/CSS/JS），产出一套在 iOS、Android、PWA、桌面上都「看起来像原生、用起来顺手」的界面，而不必为每端各写一套 UI？** 它的答案是——提供一整套**移动优先的 UI 组件**（`ion-button`、`ion-list`、`ion-modal`……）、主题系统、导航与手势动画，让你用写网页的方式搭出高质量的跨平台界面。核心特征：

- **框架无关**：组件是标准 Web Components，可配 Angular / React / Vue，也可零框架纯 JS 用。
- **移动优先、双端观感**：同一组件按平台自动切 iOS 或 Material Design 外观（后文双 mode）。
- **一套代码多端**：同一份代码构建出 iOS App、Android App、PWA 与桌面应用。
- **开源免费**：框架本身以 MIT 许可发布。

## 二、最容易搞错的：Ionic 是 UI 库，不是运行时

这是入门第一课，也是出题高频靶点：**Ionic 只负责「界面」，不负责「把网页变成能上架的原生 App」**。

| 你想做的事 | 归谁管 |
| --- | --- |
| 按钮、列表、弹窗、导航、主题、手势动画 | **Ionic Framework** |
| 打包成 iOS/Android 原生工程、上架 | **Capacitor**（或旧的 Cordova） |
| 调用相机 / GPS / 蓝牙 / 文件系统等原生 API | **Capacitor** 插件 |

- Ionic 与 Capacitor 是**同一个团队**出品，但**职责分离**：Ionic 可脱离 Capacitor 只做网页/PWA；Capacitor 也可脱离 Ionic 给任意 Web 应用套原生壳。
- 二者常一起用（Ionic 画界面 + Capacitor 上原生），但**不是绑定关系**。完整分工见 [Ionic vs Capacitor](./guide-line/vs-capacitor)。

## 三、底座：Web Components + Stencil，所以框架无关

Ionic 的「框架无关」不是口号，而是架构决定的：

- **Ionic 4+ 起，所有组件都是用 [Stencil](https://stenciljs.com/) 编译出的 Web Components**（标准 Custom Elements）。Stencil 是 Ionic 团队自研的 Web Components 编译器（TypeScript + JSX + CSS，产出标准元素 + 极小 runtime）。
- 因为是标准自定义元素，`<ion-button>` 能在任何框架里当普通标签用。官方再为各框架生成**薄 wrapper**（`@ionic/angular` / `@ionic/react` / `@ionic/vue`），让你获得 `IonButton` 这样的原生式组件体验。
- 心智图：**Stencil（编译器/底座）→ `@ionic/core`（Web Components 本体）→ 各框架 wrapper 包**。
- 多数组件用 **Shadow DOM** 封装样式，所以外部普通 CSS 选择器穿不进内部——改内部样式要靠 CSS 变量或 CSS Shadow Parts（见[主题与暗色](./guide-line/theming)）。

## 四、怎么起步：Ionic CLI

日常开发主力是官方命令行工具 **`@ionic/cli`**：

```bash
# 1. 全局安装 CLI
npm install -g @ionic/cli

# 2. 新建项目：模板 blank/list/tabs/sidemenu；--type 选框架
ionic start myApp tabs --type angular   # 也可 --type react / --type vue

# 3. 本地开发（热更新）
cd myApp
ionic serve
```

其他关键命令（详见[参考](./reference)）：`ionic build`（生产构建）、`ionic generate`（生成 page/component/service，主要用于 Angular）、`ionic info`（环境信息）、`ionic capacitor add/sync/run`（对接 Capacitor 原生平台）。

各框架也可**不经 CLI**、直接在自己脚手架里装 `@ionic/angular|react|vue` 后按框架方式初始化（见[框架集成与底座](./guide-line/framework-integration)）。

## 五、第一个页面：`ion-*` 组件长什么样

一个最小的 Ionic 页面骨架——`ion-app` 是根，`ion-header`/`ion-content` 组成典型的「头 + 内容」布局：

```html
<ion-app>
  <ion-header>
    <ion-toolbar>
      <ion-title>我的应用</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-button expand="block">主要按钮</ion-button>
    <ion-list>
      <ion-item>
        <ion-label>一条列表项</ion-label>
      </ion-item>
    </ion-list>
  </ion-content>
</ion-app>
```

- 纯 HTML/vanilla 用法：CDN 引入 `@ionic/core` 即可直接写 `<ion-*>` 标签。
- 框架里对应 PascalCase 组件（`IonApp` / `IonButton`……），事件按各框架惯例：React `onIonChange`、Vue `@ionChange`、Angular `(ionChange)`。

## 六、心智地图：接下来读什么

- 想认全组件、搞懂 iOS/MD 双 mode → [组件体系与双 mode](./guide-line/components-modes)。
- 想换肤、做暗色、改 Shadow DOM 内部样式 → [主题与暗色](./guide-line/theming)。
- 想在 Angular/React/Vue 里接入、或零框架用 → [框架集成与底座](./guide-line/framework-integration)。
- 想搞清页面跳转、转场动画、tabs/侧边栏 → [路由与导航](./guide-line/routing)。
- 想彻底分清 Ionic 与 Capacitor → [Ionic vs Capacitor](./guide-line/vs-capacitor)。
- 速记表在 [参考](./reference)。
