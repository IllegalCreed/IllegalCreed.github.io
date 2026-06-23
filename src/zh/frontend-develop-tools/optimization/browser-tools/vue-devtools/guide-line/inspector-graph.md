---
layout: doc
outline: [2, 3]
---

# Inspector 与 Graph

> 基于 Vue 3.5 + Vue DevTools v7 / vite-plugin-vue-devtools 8.x 编写

这些是 Vite 插件形态额外提供的能力，集成自 Vite 生态工具。

## 速查

- Inspector：点选页面元素 → 跳编辑器对应 `.vue` 源码行（vite-plugin-vue-inspector）
- Open in Editor：用 `launchEditor` 配置编辑器（code / webstorm…）
- Graph：组件关系图，可视化组件依赖
- Inspect：检查 Vite 转换步骤（vite-plugin-inspect）
- Pages / Assets：路由页面、静态资源（Vite 项目）

## Inspector：点选跳源码

Vite 插件集成 **vite-plugin-vue-inspector**：

- 启用 Inspector 后，鼠标悬停 / 点击页面元素
- DevTools 高亮渲染它的 **Vue 组件**
- 点击直接**跳到编辑器中该组件的对应源码行**

这是「从界面定位代码」最快的方式——看到页面某块不对，一点就到 `.vue` 文件对应位置。

## Open in Editor 配置

「跳编辑器」由 `launchEditor` 选项决定用哪个编辑器：

```ts
// vite.config.ts
VueDevTools({
  componentInspector: true, // 启用 Inspector
  launchEditor: "code", // VS Code；WebStorm 用 "webstorm"
});
```

> 确保编辑器的命令行工具已配置（如 VS Code 的 `code` 命令在 PATH 中）。

## Graph：组件关系图

**Graph** 面板以图形展示组件 / 模块之间的**依赖关系**：

- 可视化哪些组件相互引用
- 理解大型应用的组件结构与耦合
- 发现意外的依赖

## Inspect：Vite 转换检查

集成 **vite-plugin-inspect**，查看每个模块经过 Vite **各插件转换的步骤**：

- 看 `.vue` SFC 如何被编译、各插件如何改写代码
- 排查构建 / 转换相关问题（如某插件没生效、产物不对）

> 这是面向构建调试的高级功能，理解 Vite 处理流程时很有用。

## Pages 与 Assets

- **Pages**：基于文件的路由页面列表（约定式路由 / Nuxt）
- **Assets**：项目静态资源浏览

## 下一步

三种安装形态详解见 [安装与三形态](./setup-forms.md)。
