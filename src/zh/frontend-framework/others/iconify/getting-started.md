---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Iconify**（统一开源图标框架，官网 [iconify.design](https://iconify.design/)；框架无关 + React/Vue/Svelte/Solid + Tailwind/UnoCSS 全覆盖）。

## 速查

- 定位：**统一图标框架**——一套语法 `prefix:name` 访问 200+ 图标集、27 万+ 图标，按需加载
- 图标名：`prefix:name`，如 `mdi:home`、`carbon:add`、`lucide:check`（图标搜索 [icon-sets.iconify.design](https://icon-sets.iconify.design/)）
- Web Component：`npm i iconify-icon` → `import 'iconify-icon'` → `<iconify-icon icon="mdi:home" />`（**SSR 安全**）
- React：`npm i -D @iconify/react` → `import { Icon } from '@iconify/react'` → `<Icon icon="mdi:home" />`
- Vue：`npm i -D @iconify/vue` → `import { Icon } from '@iconify/vue'`
- 构建时：`@iconify/tailwind`(T3) / `@iconify/tailwind4`(T4) / **UnoCSS `presetIcons`（`i-mdi-home`，本项目用法）**
- 尺寸：默认 `height: 1em` 随字体大小；颜色：单色图标用 `currentColor`（调文字 `color`，**别设 fill**）
- 离线：`@iconify/json` 或 `@iconify-json/<prefix>` + `addCollection`

## Iconify 是什么

Iconify 是 **Vjacheslav Trushkin** 维护的**统一开源图标框架**，一句话定位：「**用一套语法访问几乎所有开源图标集，并且只按需加载用到的图标**」。

```html
<!-- Web Component，框架无关 -->
<iconify-icon icon="mdi:home"></iconify-icon>
```

理解 Iconify 的**核心定位**：

- **统一语法 `prefix:name`**：`mdi:home`（Material Design Icons 的 home）、`carbon:add`、`simple-icons:github`——200+ 套图标同一种写法
- **按需加载、零冗余**：渲染 SVG，从 Iconify API 只取用到的图标——**不像 react-icons / Font Awesome 整套打包**
- **像素级 SVG（非字体）**：所有图标经清洗优化校验
- **全栈覆盖**：Web Component + React/Vue/Svelte/Solid 组件 + Tailwind/UnoCSS 构建时方案

### 与 react-icons / Font Awesome 的区别

| 维度 | Iconify | react-icons | Font Awesome |
|---|---|---|---|
| 图标来源 | **200+ 套统一聚合** | 多套（各自打包） | 主要自家集 |
| 加载方式 | **按需（API/构建时），零冗余** | 按 import 打包 | 字体或 SVG，整套倾向 |
| 渲染 | 像素级 SVG | SVG 组件 | 字体 / SVG |
| 框架 | **全覆盖（含纯 HTML）** | React | 多框架 |
| 改色 | 单色 `currentColor` | currentColor | currentColor |

**含义**：要「一套语法用遍所有图标集 + 真正按需」选 Iconify；只在 React 里用、不介意各套分别 import 可用 react-icons。

## 三种使用方式

### 方式一：Web Component（框架无关，SSR 安全）

```bash
npm i iconify-icon
```

```js
import 'iconify-icon' // 副作用导入，注册自定义元素
```

```html
<iconify-icon icon="mdi:home"></iconify-icon>
<iconify-icon icon="mdi:home" width="32" flip="horizontal"></iconify-icon>
```

> 用 Shadow DOM，文档样式不泄漏进去；**服务端/客户端 HTML 一致，无 hydration 问题**——SSR 首选。

### 方式二：框架原生组件

```tsx
// React
import { Icon } from '@iconify/react'
<Icon icon="mdi:home" width={24} color="#1677ff" hFlip />
```

```vue
<!-- Vue -->
<script setup>
import { Icon } from '@iconify/vue'
</script>
<template>
  <Icon icon="mdi:home" :width="24" color="#1677ff" horizontal-flip />
</template>
```

> ⚠️ React 用 `hFlip`/`vFlip`，Vue 用 `horizontalFlip`/`verticalFlip`；React/Vue 是 **named 导出**，Svelte 是 **default 导出**。

### 方式三：构建时（Tailwind / UnoCSS，零运行时）

```ts
// UnoCSS（本 quiz-monorepo 项目用法）
import { presetIcons } from '@unocss/preset-icons'
presetIcons({ scale: 1.2, prefix: 'i-' })
```

```html
<div class="i-mdi-home" />          <!-- i-{prefix}-{name} -->
<div class="i-carbon-add text-2xl text-blue-500" />
```

> 构建时把图标内联成 CSS，**无运行时请求、无 JS**。Tailwind 用 `@iconify/tailwind`(T3) 或 `@iconify/tailwind4`(T4)。

## 基本用法

### 尺寸：默认 1em，随字体大小

```html
<!-- 默认 height:1em，宽度按图标比例自动 -->
<iconify-icon icon="mdi:home"></iconify-icon>
<!-- 像字体一样：改 font-size 即缩放 -->
<iconify-icon icon="mdi:home" style="font-size: 32px"></iconify-icon>
<!-- 或显式 width/height（只给一个，另一个按比例算） -->
<iconify-icon icon="mdi:home" width="48"></iconify-icon>
```

### 颜色：只有单色图标能改

```html
<!-- 单色图标用 currentColor，跟随文字 color -->
<iconify-icon icon="mdi:home" style="color: red"></iconify-icon>
```

> ⚠️ **别设 `fill`**（很多图标用 `stroke`，设 fill 无效甚至出错）——改文字 `color` 即可。**彩色/emoji 图标无法改色**。

### 翻转与旋转（在 SVG 内部完成）

```html
<iconify-icon icon="mdi:arrow-up" rotate="90deg"></iconify-icon>  <!-- 或 rotate="1" -->
<iconify-icon icon="mdi:account" flip="horizontal"></iconify-icon>
```

> `rotate` 用 `1/2/3` 表示 `90/180/270` 度（或写 `90deg`）；翻转旋转改的是 SVG viewBox，不是 CSS transform。

## 本项目 UnoCSS presetIcons 用法（含 pnpm 坑）

quiz-monorepo 用 UnoCSS `presetIcons`，class 形如 `i-carbon-add`。**pnpm 严格隔离下自动发现 `@iconify-json/*` 会失效**，必须**显式导入图标集合**：

```ts
import { presetIcons } from 'unocss'
import { icons as carbonIcons } from '@iconify-json/carbon'

presetIcons({
  scale: 1.2,
  warn: true,
  collections: { carbon: () => carbonIcons }, // 显式传入，不依赖自动发现
})
```

> 生产构建图标不显示（`[unocss] failed to load icon "carbon-*"`）多半就是这个坑——`.npmrc` 的 `public-hoist-pattern` **不足以解决**，必须显式 `collections`。

## SSR 注意

`@iconify/react` / `@iconify/vue` 默认**挂载后才渲染 SVG**（避免 hydration 错），服务端 HTML 里没有图标。要 **SSR 首屏出图**：用 `iconify-icon` Web Component、或构建时 Tailwind/UnoCSS 方案、或给组件传**图标数据对象**而非名字字符串（Vue 还有 `ssr` 布尔属性，v4.1.2+）。

## 下一步

- [指南](./guide-line.md)：**框架组件深度**（各端 `flip` 命名差异、SSR 行为、`onLoad`、`addIcon`/`addCollection` 离线注册） / **Web Component 四种渲染模式**（svg/style/bg/mask） / **API 与离线**（公共 API + 备份 + 故障切换 / 自建 API / `@iconify/json` + IconifyJSON 数据格式 / 缓存已废弃） / **工具链**（Tailwind T3/T4 的 `addDynamicIconSelectors`/`addIconSelectors`、动态 class 双连字符、UnoCSS、`@iconify/utils` 五函数） / **常见坑**
