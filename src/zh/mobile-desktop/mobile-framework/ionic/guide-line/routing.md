---
layout: doc
outline: [2, 3]
---

# Ionic 路由与导航

> 基于 Ionic 8 · 核于 2026-07

## 速查

- **核心原则**：Ionic **不做私有路由**——用**各框架自己的 router**（Angular Router / React Router / Vue Router），Ionic 只提供 `ion-router-outlet` 承载页面
- **`ion-router-outlet` vs 普通 outlet**：它负责**页面转场动画**、按 mode 的原生式过渡、以及**页面栈生命周期**（进入/离开事件），普通 `router-outlet` 没有这些
- **Angular**：Angular Router + `ion-router-outlet`（替代 `router-outlet`）
- **React**：`@ionic/react-router` 封装 React Router，用 `IonReactRouter` + `IonRouterOutlet`
- **Vue**：Vue Router + `ion-router-outlet`
- **导航组件**：`ion-tabs` / `ion-tab-bar` / `ion-tab-button`（标签页）、`ion-menu` / `ion-menu-button`（侧边抽屉）、`ion-back-button`（返回）、`ion-nav`、`ion-breadcrumb(s)`
- **生命周期**：Ionic 页面有 `ionViewWillEnter` / `ionViewDidEnter` / `ionViewWillLeave` / `ionViewDidLeave` 等进出事件（由 `ion-router-outlet` 的页面栈驱动）

## 一、核心原则：用各框架的 router

Ionic **没有自己的一套路由系统**。它的策略是：**复用各框架成熟的官方路由**，自己只提供一个特殊的「出口」组件 `ion-router-outlet` 来承载页面并接管转场。因此：

- Angular 项目照常用 **Angular Router**；
- React 项目照常用 **React Router**（经官方 `@ionic/react-router` 薄封装）；
- Vue 项目照常用 **Vue Router**。

你写路由配置的方式和纯 Web 项目基本一致，区别只在于**页面出口换成 `ion-router-outlet`**。

## 二、`ion-router-outlet` vs 普通 outlet

为什么不直接用框架的 `router-outlet` / `<router-view>`？因为移动端需要**原生式的页面转场与页面栈**，`ion-router-outlet` 在普通出口之上多做了三件事：

- **转场动画**：页面切换时按当前 mode 播放 iOS/MD 风格过渡（如 iOS 的左右滑推入）。
- **页面栈管理**：维护前进/后退的页面栈，支持 iOS 侧滑返回、`ion-back-button` 智能返回。
- **页面生命周期**：驱动 `ionViewWillEnter` / `ionViewDidEnter` / `ionViewWillLeave` / `ionViewDidLeave` 等事件，让你在页面进出时做数据刷新、埋点、暂停等。

> 记忆点：**普通 outlet 只换 DOM，`ion-router-outlet` 换的是「带转场和栈的页面」**。

## 三、Angular 路由

用 Angular Router 定义路由，模板里的出口用 `ion-router-outlet`：

```ts
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home.page').then((m) => m.HomePage) },
  { path: 'detail/:id', loadComponent: () => import('./detail.page').then((m) => m.DetailPage) },
];
```

```html
<!-- 根模板：用 ion-router-outlet 而非 router-outlet -->
<ion-app>
  <ion-router-outlet></ion-router-outlet>
</ion-app>
```

## 四、React 路由

React 侧路由由 `@ionic/react-router` 提供，把 React Router 包成 `IonReactRouter` + `IonRouterOutlet`：

```tsx
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home" component={HomePage} />
          <Route exact path="/detail/:id" component={DetailPage} />
          <Redirect exact from="/" to="/home" />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
```

## 五、Vue 路由

Vue 侧照常用 Vue Router，根出口换成 `ion-router-outlet`：

```ts
// router/index.ts
import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/views/HomePage.vue') },
  { path: '/detail/:id', component: () => import('@/views/DetailPage.vue') },
];

export default createRouter({ history: createWebHistory(), routes });
```

```html
<!-- App.vue -->
<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>
```

## 六、导航组件

除路由出口外，Ionic 还提供一批导航 UI 组件（外观也随 mode 自适应）：

| 组件 | 用途 |
| --- | --- |
| `ion-tabs` / `ion-tab-bar` / `ion-tab-button` | 底部/顶部标签页，每个 tab 有独立页面栈 |
| `ion-menu` / `ion-menu-button` | 侧边抽屉菜单及其触发按钮 |
| `ion-back-button` | 智能返回按钮（自动按页面栈回退，可配 `backButtonText`） |
| `ion-nav` | 命令式导航容器（不依赖 URL 路由的栈式导航） |
| `ion-breadcrumb(s)` | 面包屑（多用于宽屏/桌面） |

`ion-tabs` 骨架示例：

```html
<ion-tabs>
  <ion-router-outlet></ion-router-outlet>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="home">
      <ion-icon name="home"></ion-icon>
      <ion-label>首页</ion-label>
    </ion-tab-button>
    <ion-tab-button tab="settings">
      <ion-icon name="settings"></ion-icon>
      <ion-label>设置</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</ion-tabs>
```

> `ion-tabs` 内部也用 `ion-router-outlet` 承载各 tab 的页面，且**每个 tab 维护自己的页面栈**——这正是移动端「切回某个 tab 仍停在原来那一层」的原生体验来源。
