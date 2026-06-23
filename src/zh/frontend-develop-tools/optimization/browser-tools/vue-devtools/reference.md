---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vue 3.5 + Vue DevTools v7 / vite-plugin-vue-devtools 8.x 编写

## 速查

- 三形态：Vite 插件（推荐，Vite 6+）｜浏览器扩展｜Standalone
- Vite 插件：`npm i -D vite-plugin-vue-devtools` → `VueDevTools({ componentInspector, launchEditor })`
- 面板：Components｜Pinia｜Routing｜Timeline｜Graph｜Inspector｜Inspect
- Pinia：编辑 state + 按 action time-travel
- Inspector：点选页面元素跳编辑器源码行
- 仅 Vue 3
- 完整说明见 [入门](./getting-started.md) / [组件与状态](./guide-line/components-state.md) / [Pinia 与路由](./guide-line/pinia-router.md) / [Timeline](./guide-line/timeline.md) / [Inspector 与 Graph](./guide-line/inspector-graph.md) / [安装与三形态](./guide-line/setup-forms.md)

## 面板速查

| 面板 | 用途 |
| --- | --- |
| Components | 组件树、props/setup/data/computed 检查编辑 |
| Pinia | store state/getters/actions、编辑、time-travel |
| Routing | 当前路由、history、所有路由配置 |
| Timeline | 组件事件、Pinia actions、路由、性能 |
| Graph | 组件 / 模块关系图 |
| Inspector | 点选页面元素跳编辑器源码 |
| Inspect | Vite 转换步骤检查 |

## Vite 插件配置

| 选项 | 说明 |
| --- | --- |
| `componentInspector` | 启用 / 配置组件 Inspector（点选跳源码） |
| `launchEditor` | 跳转编辑器（`code` / `webstorm`…） |
| `appendTo` | 注入到指定模块 ID（特殊入口） |

```ts
VueDevTools({ componentInspector: true, launchEditor: "code" });
```

## 组件状态分类

props ｜ setup（`<script setup>` 的 ref/reactive/computed）｜ data（Options API）｜ computed ｜ injected

## 三形态对照

| 形态 | 安装 | 适用 |
| --- | --- | --- |
| Vite 插件 | `vite-plugin-vue-devtools` | Vite 项目，功能最全 |
| 浏览器扩展 | 应用商店「Vue.js devtools」 | 任意 Vue 3 站点 |
| Standalone | `@vue/devtools` → `npx vue-devtools` | 不支持扩展的环境 |

## 官方资源

- 文档：[https://devtools.vuejs.org/](https://devtools.vuejs.org/)
- Vite 插件：[https://devtools.vuejs.org/guide/vite-plugin](https://devtools.vuejs.org/guide/vite-plugin)
- Standalone：[https://devtools.vuejs.org/guide/standalone](https://devtools.vuejs.org/guide/standalone)
- GitHub：[https://github.com/vuejs/devtools](https://github.com/vuejs/devtools)
