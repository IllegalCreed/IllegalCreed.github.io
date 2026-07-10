---
layout: doc
outline: [2, 3]
---

# 高级

> 基于 VitePress 1.6.4

## 速查

- **主题入口**：创建 `.vitepress/theme/index.ts`；检测到该文件后，VitePress 会加载自定义主题。
- **优先扩展默认主题**：`extends: DefaultTheme` 保留默认文档能力，再按需覆盖 `Layout` 或 `enhanceApp`。
- **主题契约**：`Theme` 的核心字段是 `Layout`、`extends`、`enhanceApp`；完全自定义主题至少提供 `Layout`。
- **CSS 定制**：在主题入口导入 `custom.css`，优先覆盖 `--vp-*` CSS 变量，避免复制默认主题源码。
- **全局组件**：在 `enhanceApp({ app })` 中调用 `app.component()`；这里也能访问 `router` 与 `siteData`。
- **布局插槽**：用包装组件渲染 `DefaultTheme.Layout`，再注入 `aside-outline-before` 等官方插槽。
- **完全自定义布局**：布局组件用 `<Content />` 渲染 Markdown；自行处理 404、导航、侧栏与样式。
- **SSR 边界**：主题会参与服务端渲染，`window`、DOM 和浏览器专属库应放在 `onMounted` 或客户端组件中。

## 自定义主题

配置无法覆盖布局结构、全局组件或 Vue 应用初始化时，再进入主题层。多数文档站应扩展默认主题，而不是从零重写。

### 扩展默认主题

```ts
// .vitepress/theme/index.ts
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 在这里注册站点级 Vue 组件
  },
} satisfies Theme;
```

默认主题暴露了稳定的 CSS 变量，品牌色通常只需覆盖变量：

```css
/* .vitepress/theme/custom.css */
:root {
  --vp-c-brand-1: #0f766e;
  --vp-c-brand-2: #0d9488;
}
```

不希望打包默认 Inter 字体时，可从 `vitepress/theme-without-fonts` 导入主题，并自行设置 `--vp-font-family-base` 与 `--vp-font-family-mono`。

### 包装默认布局并注入插槽

```vue
<!-- .vitepress/theme/MyLayout.vue -->
<script setup lang="ts">
import DefaultTheme from "vitepress/theme";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #aside-outline-before>
      <MyOutlineNotice />
    </template>
  </Layout>
</template>
```

随后在主题入口设置 `Layout: MyLayout`。包装默认布局能继续获得导航、侧栏、搜索和响应式行为，只替换需要的区域。

### 完全自定义布局

```vue
<!-- .vitepress/theme/Layout.vue -->
<script setup lang="ts">
import { Content } from "vitepress";
</script>

<template>
  <main class="site-layout">
    <Content />
  </main>
</template>
```

完全自定义主题的默认导出至少提供这个 `Layout`。此时默认主题不会替你处理站点外壳，404、导航、主题切换和可访问性都由主题作者负责。

## 官方资料

- [使用自定义主题](https://vitepress.dev/zh/guide/custom-theme)
- [扩展默认主题](https://vitepress.dev/guide/extending-default-theme)
- [默认主题 Layout 与自定义页面布局](https://vitepress.dev/reference/default-theme-layout)
