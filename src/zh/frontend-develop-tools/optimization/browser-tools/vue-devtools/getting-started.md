---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vue 3.5 + Vue DevTools v7 / vite-plugin-vue-devtools 8.x 编写

## 速查

- 三形态：Vite 插件（推荐，需 Vite 6+）｜浏览器扩展｜Standalone 独立应用
- Vite 插件：`npm i -D vite-plugin-vue-devtools` → vite.config 加 `VueDevTools()`
- 仅 Vue 3；旧 Vue 2 项目用旧版扩展
- 核心面板：Components｜Pinia｜Routing｜Timeline｜Graph｜Inspector
- Inspector：点选页面元素 → 跳编辑器对应源码行（`launchEditor` 配置）
- Pinia：查看 / 编辑 store state，按 action 时间旅行
- 浮层入口：Vite 插件在页面角落注入悬浮按钮，点开即 DevTools

## 三种形态

| 形态 | 安装 | 适用 |
| --- | --- | --- |
| **Vite 插件**（推荐） | `vite-plugin-vue-devtools` | Vite 项目，功能最全 |
| 浏览器扩展 | Chrome / Firefox / Edge 商店 | 任意 Vue 3 站点 |
| Standalone | `@vue/devtools` → `npx vue-devtools` | 不支持的浏览器 / Electron |

## Vite 插件安装（推荐）

本项目（Vue 3 + Vite）首选 Vite 插件，功能最全：

```bash
npm i -D vite-plugin-vue-devtools
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import VueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  plugins: [
    vue(),
    VueDevTools({
      componentInspector: true, // 启用组件 Inspector
      launchEditor: "code", // 点选跳转的编辑器（code / webstorm…）
    }),
  ],
});
```

启动 dev 后，页面角落出现 Vue DevTools 悬浮按钮，点开即进入独立的 DevTools 界面（也可在浏览器 DevTools 里用扩展版）。

## 面板总览

| 面板 | 用途 | 深入 |
| --- | --- | --- |
| **Components** | 组件树、props/data/computed/setup state | [组件与状态](./guide-line/components-state.md) |
| **Pinia / Routing** | store 状态、路由 | [Pinia 与路由](./guide-line/pinia-router.md) |
| **Timeline** | 组件事件、Pinia actions、性能 | [Timeline 时间线](./guide-line/timeline.md) |
| **Inspector / Graph** | 点选跳源码、组件关系图 | [Inspector 与 Graph](./guide-line/inspector-graph.md) |
| **三形态配置** | Vite 插件 / 扩展 / Standalone | [安装与三形态](./guide-line/setup-forms.md) |

## 与浏览器内置 DevTools 的关系

浏览器 DevTools 看编译后的 DOM 与运行时；Vue DevTools 看 **Vue 的组件 + 响应式状态 + Pinia + 路由**抽象层。两者配合：DOM/网络问题用浏览器 DevTools，组件/状态/路由问题用 Vue DevTools。

## 下一步

- [组件与状态](./guide-line/components-state.md)：组件树、props/data/computed/setup、编辑状态
- [Pinia 与路由](./guide-line/pinia-router.md)：store 检查、time-travel、路由调试
- [Timeline 时间线](./guide-line/timeline.md)：事件、mutations/actions、性能时间线
- [Inspector 与 Graph](./guide-line/inspector-graph.md)：点选跳源码、组件关系图、Vite 转换检查
- [安装与三形态](./guide-line/setup-forms.md)：Vite 插件配置、扩展、Standalone
