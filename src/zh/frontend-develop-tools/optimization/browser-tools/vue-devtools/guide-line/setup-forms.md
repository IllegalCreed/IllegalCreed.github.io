---
layout: doc
outline: [2, 3]
---

# 安装与三形态

> 基于 Vue 3.5 + Vue DevTools v7 / vite-plugin-vue-devtools 8.x 编写

## 速查

- Vite 插件（推荐）：功能最全，含 Inspector / Inspect / Graph；需 Vite 6+
- 浏览器扩展：任意 Vue 3 站点，无需改项目
- Standalone：不支持的浏览器 / Electron，`npx vue-devtools`
- 仅 Vue 3；Vue 2 用旧版扩展（已停止主线维护）
- 三者可共存，按场景选

## Vite 插件（推荐）

功能最全，集成 Inspector、Inspect、Graph 等 Vite 专属能力：

```bash
npm i -D vite-plugin-vue-devtools
```

```ts
// vite.config.ts
import VueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  plugins: [
    vue(),
    VueDevTools({
      appendTo: "", // 可选：注入到哪个模块（特殊入口时用）
      componentInspector: true, // 组件 Inspector 点选跳源码
      launchEditor: "code", // 跳转用的编辑器
    }),
  ],
});
```

- **要求 Vite 6+**
- dev 启动后页面角落出现悬浮按钮，点开即 DevTools

## 浏览器扩展

```text
Chrome / Firefox / Edge 应用商店搜「Vue.js devtools」
```

- 适用任意 Vue 3 站点，**无需改动项目**
- 在浏览器 DevTools 里多出 Vue 标签页
- 注意：装新版（Vue 3）；调试线上 Vue 站点也用它

## Standalone（独立应用）

用于**不支持浏览器扩展的环境**（某些浏览器、Electron、移动端真机）：

```bash
npm i -D @vue/devtools
npx vue-devtools
```

页面中引入 devtools 连接脚本后，连到 Standalone 窗口调试。

## 三形态对比

| 形态 | 功能 | 适用 |
| --- | --- | --- |
| Vite 插件 | 最全（含 Inspector/Inspect/Graph） | Vite 项目开发 |
| 浏览器扩展 | 核心面板齐全 | 任意 Vue 3 站点 / 线上调试 |
| Standalone | 核心面板 | 不支持扩展的环境 |

> 本项目（Vue 3 + Vite）：开发用 **Vite 插件**最顺手；调试线上部署用**浏览器扩展**。

## 版本要求

- **仅 Vue 3**：Vue DevTools v7+ 只支持 Vue 3；Vue 2 项目需用旧版（已停止主线维护）
- **Vite 插件需 Vite 6+**：旧构建栈只能用浏览器扩展

## 小结

Vue DevTools 一套工具三种形态覆盖所有场景。对 Vue 3 + Vite + Pinia 的项目，Vite 插件提供从组件、Pinia time-travel、路由到点选跳源码的一体化调试体验，是 Vue 开发的原生标配。

## 资源

- [Vue DevTools 文档](https://devtools.vuejs.org/)
- [Vite 插件指南](https://devtools.vuejs.org/guide/vite-plugin)
