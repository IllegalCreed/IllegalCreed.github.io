---
layout: doc
outline: [2, 3]
---

# Ionic 框架集成与底座

> 基于 Ionic 8 · 核于 2026-07

## 速查

- **底座链路**：**Stencil（编译器）→ `@ionic/core`（Web Components 本体）→ 各框架 wrapper 包**；组件是标准 Custom Elements，故框架无关
- **四种接入**：`@ionic/angular` / `@ionic/react` / `@ionic/vue`（薄 wrapper）+ `@ionic/core`（vanilla / CDN 零框架）
- **版本矩阵（Ionic 8）**：Angular **16–20**（18+ 自 v8.2.0）/ React **17+**（19 自 **8.5**）/ Vue **3.0.6+**（**仅 Vue 3**，无 Vue 2）
- **Angular**：v8 **Standalone 与 NgModule 并存**；Standalone 用 `provideIonicAngular(cfg)` + 从 `@ionic/angular/standalone` 按需引组件；传统用 `IonicModule.forRoot(cfg)`
- **React**：`setupIonicReact(cfg)` 初始化；组件从 `@ionic/react` 引
- **Vue**：`app.use(IonicVue, cfg)`；SFC 从 `@ionic/vue` 引组件，事件 `@ionChange`
- **全局 Config**：`mode` / `rippleEffect` / `animated` / `swipeBackEnabled` / `backButtonText`；可配 `isPlatform()` 按平台动态给值

## 一、底座回顾：为什么一套组件能配三大框架

Ionic 的组件本体是 **`@ionic/core`**——一组用 **[Stencil](https://stenciljs.com/) 编译出的标准 Web Components**。因为是标准 Custom Elements，浏览器原生认识它们，任何框架都能当普通标签渲染。官方在此之上为各框架生成**薄 wrapper 包**，把 Web Components 封装成框架原生组件（`IonButton` 等），让属性/事件/类型贴合框架习惯：

```
Stencil（编译器/底座）
   └── @ionic/core（Web Components 组件本体）
         ├── @ionic/angular  （Angular wrapper）
         ├── @ionic/react    （React wrapper）
         └── @ionic/vue      （Vue wrapper）
```

## 二、版本矩阵（Ionic 8）

| 包 | 目标框架版本 | TypeScript |
| --- | --- | --- |
| `@ionic/angular` | **Angular 16–20**（18+ 自 v8.2.0 起支持） | 4.9.3+ |
| `@ionic/react` | **React 17+**（React 19 自 **8.5** 起完整支持） | 3.7+ |
| `@ionic/vue` | **Vue 3.0.6+**（**仅 Vue 3**，不支持 Vue 2） | 3.9+ |
| `@ionic/core` | 无框架 / vanilla（Web Components 本体） | — |

> 具体最小/最大版本随补丁号可能微调，以当下版本的官方 support 页为准。

## 三、Vanilla / CDN（零框架）

不用任何框架时，直接引 `@ionic/core` 即可写 `<ion-*>`：

```html
<head>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js"></script>
  <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css" />
</head>
<body>
  <ion-app>
    <ion-button>Hello</ion-button>
  </ion-app>
</body>
```

## 四、Angular（Standalone 与 NgModule 并存）

Ionic 8 在 Angular 下**同时支持 Standalone Components 与传统 NgModule** 两种构建方式。

**Standalone（推荐，v8 新起点）**——从 `@ionic/angular/standalone` 引入 `provideIonicAngular`，并按需 import 单个组件（可 tree-shake）：

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';

bootstrapApplication(AppComponent, {
  providers: [provideIonicAngular({ mode: 'ios' })],
});
```

```ts
// 组件内按需引入（standalone 下需显式 import）
import { IonButton, IonContent } from '@ionic/angular/standalone';
```

**NgModule（传统）**：

```ts
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [IonicModule.forRoot({ mode: 'md' })],
})
export class AppModule {}
```

> Standalone 化的核心动作，就是把 `IonicModule.forRoot(cfg)` 换成 `provideIonicAngular(cfg)`。路由用 Angular Router + `ion-router-outlet`（见[路由与导航](./routing)）；工具链配 Angular CLI + `@ionic/angular-toolkit`。

## 五、React

```tsx
// 初始化：setupIonicReact 传全局 config
import { setupIonicReact, IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

setupIonicReact({ mode: 'md' });

// 组件从 @ionic/react 引；路由用 @ionic/react-router 封装的 React Router
// <IonApp><IonReactRouter><IonRouterOutlet>...</IonRouterOutlet></IonReactRouter></IonApp>
```

- 组件从 `@ionic/react` 引入（`IonApp` / `IonButton`……）。
- 事件用 `onIonChange` 等；相关类型如 `ToggleCustomEvent`。
- 路由基于 **React Router**（经 `@ionic/react-router` 封装，见[路由与导航](./routing)）。

## 六、Vue（仅 Vue 3）

```ts
// main.ts
import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import router from './router';
import App from './App.vue';

createApp(App).use(IonicVue, { mode: 'md' }).use(router).mount('#app');
```

- SFC 里从 `@ionic/vue` 引组件：`import { IonButton, IonContent } from '@ionic/vue'`。
- 事件用 `@ionChange`。
- 路由基于 **Vue Router** + `ion-router-outlet`（见[路由与导航](./routing)）。
- **仅支持 Vue 3**（3.0.6+），不支持 Vue 2。

## 七、运行时配置（Config）

全局 config 的入口就是各框架的初始化函数：Angular `provideIonicAngular(cfg)` / `IonicModule.forRoot(cfg)`、React `setupIonicReact(cfg)`、Vue `.use(IonicVue, cfg)`。常用项：

| 选项 | 类型 | 作用 |
| --- | --- | --- |
| `mode` | `'ios' \| 'md'` | 全局平台样式 |
| `rippleEffect` | boolean | MD 波纹开关 |
| `animated` | boolean | 全局动画开关 |
| `swipeBackEnabled` | boolean | iOS 侧滑返回 |
| `backButtonText` | string | 返回按钮文案 |

**按平台动态配置**：用 `isPlatform()` 判断当前平台再给不同值：

```ts
import { isPlatform, setupIonicReact } from '@ionic/react';

// 网页端关掉动画、原生端保留
setupIonicReact({ animated: !isPlatform('mobileweb') });
```
