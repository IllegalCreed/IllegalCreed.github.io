---
layout: doc
outline: [2, 3]
---

# 框架适配器

> 基于 single-spa v6 · 核于 2026-07

## 速查

- single-spa 只认「导出 bootstrap/mount/unmount」这一条契约，**适配器（adapter）**的活就是**把框架组件包成这三个生命周期函数**——你几乎不用手写生命周期
- 三大主力：**single-spa-vue**、**single-spa-react**、**single-spa-angular**，都返回 `{ bootstrap, mount, unmount }`，直接 `export` 出去即可被 `registerApplication` 消费
- **single-spa-vue**：Vue 3 传 **`createApp` + `appOptions`（+ 可选 `handleInstance`）**，Vue 2 传 **`Vue` + `appOptions`**；single-spa props 挂在组件 `this` 上（`name`/`mountParcel`/`singleSpa`）
- **single-spa-react**：传 **`React` + `rootComponent`**，React 18+ 传 **`ReactDOMClient`**（`renderType` 默认 `createRoot`）、React ≤17 传 **`ReactDOM`**（`render`）；可配 **`errorBoundary(err, info, props)`**
- **single-spa-angular**：`singleSpaAngular({ bootstrapFunction, template, Router, NgZone, NavigationStart })`；官方脚手架 **`ng add single-spa-angular`** 生成 `main.single-spa.ts` 等入口
- 适配器统一支持 **`loadRootComponent`**（异步给根组件）、**`domElementGetter`**（自定义挂载容器）等通用选项
- 生态还有 **single-spa-svelte / preact / ember / angularjs / alpinejs / riot / inferno / dojo / backbone / cycle** 等，以及 **single-spa-html**、**single-spa-web-components**——几乎每个主流框架都有
- 脚手架 **`create-single-spa`** 一键生成 root config / application / utility module 模板；**single-spa-layout**（Layout Engine）用声明式模板描述「哪个应用挂在哪个区域」
- 工具链：**import-map-overrides**（本地覆盖）、**import-map-deployer**（并发部署）、**systemjs-webpack-interop**（动态 publicPath）、**webpack-import-map-plugin**
- Angular 生态另有 **@angular-architects 的 Native Federation**——用原生 ESM + import maps 走 Module Federation 心智，与 single-spa-angular 是**两条独立路线**（前者偏依赖共享/模块联邦，后者偏生命周期编排）
- **本页只讲适配器参数**；具体项目里怎么把 Vue 接进微前端的**完整接入代码**见 [Vue 其他生态](/zh/frontend-framework/ui/vue/guide-line/other)（已产出，不在此复述）

## 一、适配器做什么：把组件包成生命周期

single-spa 与子应用的唯一契约是[生命周期协议](./lifecycle-protocol)——导出 `bootstrap`/`mount`/`unmount`。但没人愿意手写「用 Vue 渲染一个根组件、卸载时销毁实例、还要处理 props」这套样板。**适配器（framework helper）**就是把这套样板封装掉：你把「用什么框架、渲染哪个根组件、挂到哪」告诉适配器，它**吐出一组现成的生命周期函数**，你直接 `export`：

```text
框架组件 + 适配器  →  { bootstrap, mount, unmount }  →  export 给 single-spa
```

所以「用 single-spa 接入一个框架」的工作量，几乎就等于「调一次适配器、把返回值 export 出去」。下面三节是三大主力适配器的**关键参数**（完整项目接入实操见文末链接）。

## 二、single-spa-vue

`singleSpaVue(opts)` 返回 `{ bootstrap, mount, unmount }`。Vue 3 与 Vue 2 的参数不同——核心差异是 Vue 3 传 `createApp` 函数，Vue 2 传 `Vue` 构造器：

```js
// Vue 3：关键参数 createApp + appOptions（+ 可选 handleInstance）
import { createApp, h } from "vue";
import singleSpaVue from "single-spa-vue";
import App from "./App.vue";

const vueLifecycles = singleSpaVue({
  createApp, // 必填：Vue 3 的 createApp
  appOptions: {
    // 必填：传给 createApp 的配置
    render() {
      return h(App, { /* 可在此把 single-spa props 透传给根组件 */ });
    },
  },
  handleInstance: (app, props) => {
    // 可选：拿到 app 实例做额外装配（app.use(router) 等）
    app.use(router);
  },
});

// 直接把生命周期 export 出去，供 registerApplication 消费
export const { bootstrap, mount, unmount } = vueLifecycles;
```

```js
// Vue 2：关键参数 Vue + appOptions
import Vue from "vue";
import singleSpaVue from "single-spa-vue";

const vueLifecycles = singleSpaVue({
  Vue, // 必填：Vue 2 构造器
  appOptions: { render: (h) => h(App), router },
});
```

要点：**single-spa 传进来的 props（`name`/`mountParcel`/`singleSpa`）会挂在组件的 `this` 上**，组件内可直接取用；`appOptions` 还能写成**异步函数**接收 props 动态生成配置；`loadRootComponent` 可替代 `appOptions.render` 用异步方式给根组件。

## 三、single-spa-react

`singleSpaReact(opts)` 同样返回 `{ bootstrap, mount, unmount }`。React 18 起 ReactDOM 的挂载 API 变了（`createRoot` 取代 `render`），适配器参数也随之分叉：

```js
// React 18+：传 ReactDOMClient（renderType 默认 'createRoot'）
import React from "react";
import ReactDOMClient from "react-dom/client";
import singleSpaReact from "single-spa-react";
import RootComponent from "./root.component";

export const { bootstrap, mount, unmount } = singleSpaReact({
  React, // 必填：React 主对象
  ReactDOMClient, // 必填（React 18+）：提供 createRoot
  rootComponent: RootComponent, // 必填：要渲染的顶层组件
  errorBoundary(err, info, props) {
    // 可选：出错时的降级 UI
    return <div>该模块暂不可用</div>;
  },
});
```

参数速记：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `React` | ✅ | React 主对象 |
| `rootComponent` | ✅ | 要渲染的顶层组件（或用 `loadRootComponent` 异步给） |
| `ReactDOMClient` | React 18+ | 提供 `createRoot`；此时 `renderType` 默认 `'createRoot'` |
| `ReactDOM` | React ≤17 | 老版 `render`；`renderType` 默认 `'render'` |
| `errorBoundary` | 可选 | `(err, info, props) => UI`，故障降级 |
| `domElementGetter` | 可选 | 返回挂载容器的函数 |
| `renderType` | 可选 | `'render'`/`'hydrate'`/`'createRoot'` 或函数 |

**React 18 迁移点**：从传 `ReactDOM` 改为传 `ReactDOMClient`，适配器据此自动把 `renderType` 切到 `createRoot`——这是升级 React 18 时最容易漏改的一处。

## 四、single-spa-angular

Angular 因为有 NgModule/Zone/Router 一套重机制，适配器 `singleSpaAngular` 参数更多，且官方强烈建议用**脚手架生成**而非手搓：

```js
// main.single-spa.ts（由 ng add single-spa-angular 生成，此处示意关键参数）
import { singleSpaAngular } from "single-spa-angular";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { NgZone } from "@angular/core";
import { Router, NavigationStart } from "@angular/router";
import { AppModule } from "./app/app.module";

const lifecycles = singleSpaAngular({
  bootstrapFunction: (props) =>
    platformBrowserDynamic().bootstrapModule(AppModule), // 必填：引导 Angular 模块
  template: "<app-root />", // 必填：注入 DOM 的模板
  Router, // 用 @angular/router 时必填
  NavigationStart, // 路由事件类
  NgZone, // Angular Zone；无 Zone 应用传 "noop"
});

export const { bootstrap, mount, unmount } = lifecycles;
```

落地方式是一条命令：**`ng add single-spa-angular`**（schematic），它会生成 `main.single-spa.ts`（上面这个入口）、`single-spa-props.ts`（自定义 props 处理）、`asset-url.ts`（资源 URL 适配）等文件，把接入样板一次性铺好。

## 五、其余适配器与配套工具

single-spa 生态几乎覆盖所有主流框架——除三大主力外还有：**single-spa-svelte**、**single-spa-preact**、**single-spa-ember**、**single-spa-angularjs**（老 AngularJS）、**single-spa-alpinejs**、**single-spa-riot**、**single-spa-inferno**、**single-spa-dojo**、**single-spa-backbone**、**single-spa-cycle**；还有面向非框架内容的 **single-spa-html** 与 **single-spa-web-components**。

配套工具链：

| 工具 | 作用 |
| --- | --- |
| **create-single-spa** | 官方脚手架，一键生成 root config / application / utility module 模板 |
| **single-spa-layout**（Layout Engine） | 用声明式模板描述「哪个应用挂在哪个 DOM 区域」，替代手写一堆容器 div |
| **import-map-overrides** | 本地开发覆盖 import map（见 [import maps 工作流](./import-maps-workflow)） |
| **import-map-deployer** | 并发安全地更新线上 import map |
| **systemjs-webpack-interop** | SystemJS 路线下动态设置 `publicPath` |
| **webpack-import-map-plugin** | 构建时产出/更新 import map 片段 |

## 六、Angular Native Federation：一句带过

Angular 生态里除了 single-spa-angular，还常听到 **@angular-architects 的 Native Federation**——它把 **Module Federation 的心智**（远程模块、依赖共享）用**原生 ESM + import maps** 重新实现，与 single-spa 走的是**两条独立路线**：Native Federation 侧重**模块与依赖的联邦共享**，single-spa 侧重**生命周期编排与路由分发**。两者可以组合，但不是一回事——依赖共享路线的横向对比见[微前端核心机制·依赖共享](../../mfe-mechanisms/guide-line/dependency-sharing)。

## 小结

适配器把 single-spa「导出 bootstrap/mount/unmount」这条契约的样板封装掉：single-spa-vue（Vue 3 传 `createApp`、Vue 2 传 `Vue`）、single-spa-react（React 18 传 `ReactDOMClient`、可配 `errorBoundary`）、single-spa-angular（`singleSpaAngular` + `ng add` 脚手架），都返回现成生命周期直接 export。生态几乎覆盖所有框架，配套 create-single-spa、single-spa-layout 与 import maps 工具链。适配器参数讲清了，但 single-spa 到底该不该选、v6/v7 现状如何、什么时候直接用它什么时候用 qiankun——收束到最后一页：[现状与定位](./status-positioning)。具体项目的完整接入代码见 [Vue 其他生态](/zh/frontend-framework/ui/vue/guide-line/other)。
