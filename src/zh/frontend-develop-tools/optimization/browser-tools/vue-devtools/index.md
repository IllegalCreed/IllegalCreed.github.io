---
layout: doc
---

# Vue DevTools

Vue DevTools 是 Vue 官方维护的 **Vue 应用调试工具**，专为 Vue 3 设计（旧版 Vue 2 已停止主线维护）。它有三种形态：**Vite 插件**（`vite-plugin-vue-devtools`，官方力荐）、**浏览器扩展**（Chrome / Firefox / Edge）、**独立应用**（Standalone，用于不支持的浏览器或 Electron）。相比浏览器内置 DevTools 只能看 DOM，Vue DevTools 提供 Vue 抽象层的完整视图：**Components**（组件树 + props/data/computed/setup state 检查编辑）、**Pinia**（store 状态 + time-travel）、**Routing**（路由）、**Timeline**（组件事件、Pinia mutations/actions、性能时间线）、**Graph**（组件关系图）、**Inspector**（点选页面元素直接跳编辑器对应源码行）。对本项目（Vue 3 + Vite + Pinia）而言，它是开箱即用的原生调试工具——装上 Vite 插件即可获得组件、Pinia、路由的一体化调试体验。

## 评价

**优点**

- **Vue 官方**：与 Vue 3 同步，深度集成 Pinia / Vue Router
- **Vite 插件形态**：项目内集成，含组件 Inspector「点选跳源码」、性能分析
- **Pinia time-travel**：store 状态变更可时间旅行回溯（本项目状态调试利器）
- **Timeline 强大**：组件事件、Pinia actions、路由导航统一时间线，按 action 分组
- **Inspector + Open in Editor**：页面点元素直达编辑器源码行
- **三形态灵活**：Vite 插件 / 浏览器扩展 / Standalone 按需选

**缺点**

- **仅 Vue 3**：Vue 2 项目需用旧版（已不再主线维护）
- **Vite 插件需 Vite 6+**：旧构建栈只能用浏览器扩展
- **大型应用开销**：超大组件树 / 频繁状态变更有性能成本
- **生态绑定**：只服务 Vue 生态

## 文档地址

[Vue DevTools 文档](https://devtools.vuejs.org/)

## GitHub地址

[vuejs/devtools](https://github.com/vuejs/devtools)

## 幻灯片地址

<a href="/SlideStack/vue-devtools-slide/" target="_blank">Vue DevTools</a>
