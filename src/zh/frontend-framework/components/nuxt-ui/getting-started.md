---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Nuxt UI 4.x**（截至 2026 年 5 月 **v4.x**，**2026 年 2 月发布的 v3 → v4 大重写版本**；要求 **Vue 3.4+** + **Node 18+** + **Tailwind CSS 4** —— Nuxt 项目还要求 **Nuxt 4**）编写。

## 速查

- 系统要求：**Vue 3.4+** + **Node 18+** + **TypeScript 5+**（强烈推荐）+ **Tailwind CSS 4.x**（**必装**）
- Nuxt 项目额外要求：**Nuxt 4.x**（Nuxt 3 项目用 Nuxt UI v3.x，但 v3 已停止新特性开发）
- 浏览器：现代浏览器（Chrome / Edge / Firefox / Safari 最新两个版本），**不支持 IE**
- 安装：`pnpm add @nuxt/ui tailwindcss`（**必须同时装 tailwindcss**）
- 图标（自动随 `@nuxt/icon` 装入）：默认 [Lucide](https://lucide.dev/) 集合，`i-lucide-home` 命名，可装更多 `@iconify-json/*` 集合
- 字体（自动随 `@nuxt/fonts` 装入）：默认无、可配置 Google Fonts
- **Nuxt 项目集成**：`modules: ['@nuxt/ui']` + 创建 `app/assets/css/main.css` 含 `@import "tailwindcss"; @import "@nuxt/ui";`
- **Vue 项目集成（v4 新）**：`vite.config.ts` 加 `ui()` 插件 + `main.ts` 加 `app.use(ui)` + `index.html` 根 div 加 `class="isolate"`
- **必须**：`<UApp>` 包根组件（Toast / Tooltip / 程序化 Overlay 必需）
- 中文 i18n：`import { zhCn } from '@nuxt/ui/locale'` + `<UApp :locale="zhCn">`
- 暗色模式：自动通过 `@nuxtjs/color-mode`（Nuxt）或 `useColorMode` 切换 `<html class="dark">`
- 组件命名：所有组件以 `U` 开头（PascalCase），如 `<UButton>` / `<UInput>` / `<UForm>`（可通过 `prefix: 'Nuxt'` 改前缀）
- API 命名：`useToast` / `useOverlay` / `useColorMode` / `useLocale` 是 Composable，**必须在 setup 内调用**
- 国内镜像：`npm config set registry https://registry.npmmirror.com`

## Nuxt UI 是什么

Nuxt UI 是 **Nuxt 官方团队**（Pooya Parsa / Benjamin Canac / Sebastien Chopin 等）于 **2022 年** 开源的 **Vue 3 UI 组件库**——是 **Nuxt 生态唯一官方钦定的 UI 库**、自 **2025 年 NuxtLabs 被 Vercel 收购** 后获得 Vercel 长期资源加持。理解 Nuxt UI 必须先理解它的**设计哲学**：

- **Reka UI primitives 底层**：基于 [Reka UI](https://reka-ui.com/)（原 Radix Vue，是 React [Radix UI](https://www.radix-ui.com/) 的 Vue 版无样式 primitives 库）——**所有组件天然 WAI-ARIA 合规 + 键盘导航 + 焦点管理 + Screen Reader 优秀**
- **Tailwind 4 CSS-first 主题**：主题用 `@theme` CSS 指令（`--color-primary-500: ...`）+ `app.config.ts` 语义化别名——**不再用 SCSS / CSS-in-JS，是 2024-2025 Tailwind 4 大趋势**
- **Tailwind Variants 样式系统**：组件样式用 `tv()` 函数定义 slot + variant + compoundVariants——**类型安全、可覆盖、不重叠**
- **Standard Schema 表单校验**：统一接口适配 Zod / Valibot / Yup / Joi / Superstruct / Regle——**校验库随时切换、不绑死**
- **TypeScript 优先**：Vue Generics + 全组件类型推导 + `defineAppConfig` 主题类型安全 + `TableColumn<T>` 泛型表格

**v4 重磅变更（2026 年 2 月发布）**：

- **Pro 完全免费**：原 $249 Nuxt UI Pro 合并到 `@nuxt/ui` —— Dashboard / Page / AuthForm / PricingPlans / ChatPrompt 等 80+ 高级组件**全部开源免费**
- **支持纯 Vue 项目**：通过 `@nuxt/ui/vite` 插件 + `@nuxt/ui/vue-plugin`，**不再绑死 Nuxt**
- **Tailwind 4 强制**：v3 还支持 Tailwind 3、v4 必须 Tailwind 4

Nuxt UI 与 Element Plus / Naive UI / Vuetify 3 等 Vue 3 UI 库的本质差异：

| 维度 | Nuxt UI v4 | Element Plus | Naive UI | Vuetify 3 |
|---|---|---|---|---|
| 阵营 | **Nuxt 官方 + Vercel** | 饿了么 + 社区 | 图森未来 + 社区 | Vuetify Team |
| 设计语言 | Tailwind 风格 + Vercel 美学 | 企业管理后台 | Discord 现代极简 | Material Design |
| 国内市场份额 | **起步增长** | **断层第一** | 中 | 低 |
| TypeScript | **极致**（Vue Generics + Standard Schema） | 完整 | 100% TS 编写 | 完整 |
| 样式方案 | **Tailwind 4 + tv() Variants** | CSS Vars + SCSS | TS 对象 + CSS-in-JS | SCSS + theme prop |
| 底层 primitives | **Reka UI（Radix Vue）** | 自研 | 自研 | 自研 |
| 暗色模式 | `<html class="dark">` 类驱动 | CSS 切换 | TS 对象切换 | theme prop |
| 组件数 | **125+**（Pro 合并） | 80+ | 90+ | 80+ |
| Nuxt 集成 | **Nuxt 官方** | Nuxt 模块 | nuxtjs-naive-ui 模块 | Nuxt 模块 |
| Vue 独立使用 | **支持（v4 新）** | 支持 | 支持 | 支持 |
| 中文文档 | 弱（无） | **官方完整** | 完整 | 弱 |
| AI / Dashboard 组件 | **完整（v4 新）** | 无 | 无 | 无 |

**含义**：

- Nuxt UI **Nuxt 官方背书 + Tailwind 4 + Reka UI + AI / Dashboard 全套**——是 **追求现代 Tailwind 风 + AI 产品 + Nuxt 生态**的最佳选择
- **不适合**：必须用 Element Plus 招聘市场 / 接手已有 Element Plus 项目 / 严格 Material Design（用 Vuetify）/ 不接受 Tailwind（用 Naive UI / Element Plus）
- **适合**：Nuxt 全栈项目 / Vue 3 + Vite + Tailwind 派 / AI 产品 UI / 设计驱动的 SaaS / **想试试 Nuxt 官方 UI 库 + 免费 Dashboard 模板**

## 安装与首次启动

### Nuxt 项目集成

#### 创建 Nuxt 4 项目

如果**还没有 Nuxt 4 项目**，先创建一个：

```bash
# 推荐：直接选 nuxt-ui 模板
npm create nuxt@latest -t ui

# 或创建普通 Nuxt 4 项目再装 Nuxt UI
npm create nuxt@latest
```

`ui` 模板创建后直接含 Nuxt UI v4 + Tailwind 4 + 完整配置——**新手最推荐**。

#### 安装到已有 Nuxt 项目

```bash
pnpm add @nuxt/ui tailwindcss
```

> **必须同时装 `tailwindcss`**——Nuxt UI v4 必须 Tailwind 4，不再内置。

`nuxt.config.ts` 加模块：

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],
})
```

> Nuxt UI **自动注册** `@nuxt/icon`、`@nuxt/fonts`、`@nuxtjs/color-mode` 三个核心模块——**无需手动 install / 添加到 modules**。

创建 `app/assets/css/main.css`：

```css
@import "tailwindcss";
@import "@nuxt/ui";
```

> **两行不能少、顺序不能错**——`tailwindcss` 必须在前（提供基础 utilities），`@nuxt/ui` 在后（覆盖 UI 主题变量）。

#### 包根 UApp 组件

修改 `app.vue`：

```vue
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

> **`<UApp>` 必须包根**——否则 **Toast / Tooltip / 程序化 Overlay 全部不工作**（这是 Nuxt UI v4 最高频的踩坑）。

启动：

```bash
pnpm dev
```

访问 `http://localhost:3000` —— Nuxt UI 已经装好，可以直接用 `<UButton>` 等组件。

### 纯 Vue 项目集成（v4 新）

**v4 重大新特性**：Nuxt UI 现在可独立用在 Vue 3 + Vite + Inertia.js 项目中——不再绑死 Nuxt。

#### 创建 Vue 项目

```bash
# 推荐：直接用 Nuxt UI Vue 模板
npm create nuxt@latest -- --no-modules -t ui-vue

# 或创建普通 Vue 项目（create-vue）再装 Nuxt UI
pnpm create vue@latest
```

#### 安装包

```bash
pnpm add @nuxt/ui tailwindcss
```

#### 配置 Vite

`vite.config.ts`：

```ts
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      // 可选：改组件前缀，默认 'U'
      // prefix: 'Nuxt',

      // 可选：禁用 colorMode（默认 true）
      // colorMode: false,
    }),
  ],
})
```

#### 配置 main.ts

`src/main.ts`：

```ts
import ui from '@nuxt/ui/vue-plugin'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

// CSS 入口（必须在 createApp 之前 import）
import './assets/css/main.css'

import App from './App.vue'

const app = createApp(App)

const router = createRouter({
  routes: [],
  history: createWebHistory(),
})

app.use(router)
app.use(ui)
app.mount('#app')
```

#### 创建 CSS 入口

`src/assets/css/main.css`：

```css
@import "tailwindcss";
@import "@nuxt/ui";
```

#### App.vue 包根

```vue
<template>
  <UApp>
    <RouterView />
  </UApp>
</template>
```

#### index.html 根 div 加 isolate 类

`index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuxt UI Vue 项目</title>
</head>
<body>
  <div id="app" class="isolate"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

> **`class="isolate"` 不能省**——确保样式作用域隔离、防止 Overlay 与 z-index 冲突。

#### TypeScript 配置

`tsconfig.app.json` 含自动生成的 d.ts：

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "auto-imports.d.ts",
    "components.d.ts"
  ]
}
```

`.gitignore` 加入：

```
# Nuxt UI Vite plugin 自动生成
auto-imports.d.ts
components.d.ts
```

Vite 自身配置类型支持——创建 `tsconfig.node.json`：

```json
{
  "compilerOptions": {
    "paths": {
      "#build/ui": ["./node_modules/.nuxt-ui/ui"]
    }
  }
}
```

#### IDE 配置（VSCode）

安装 **Tailwind CSS IntelliSense** 扩展，`.vscode/settings.json`：

```json
{
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": "on"
  },
  "tailwindCSS.classAttributes": ["class", "ui"],
  "tailwindCSS.classFunctions": ["defineAppConfig"]
}
```

> **`tailwindCSS.classAttributes` 必须含 `"ui"`**——这样 `<UButton :ui="{ base: 'rounded-xl' }">` 中的 Tailwind 类才能 IntelliSense。

启动：

```bash
pnpm dev
```

### 快速启动模板

官方提供完整起步模板：

```bash
# Nuxt + Nuxt UI v4
npm create nuxt@latest -t ui

# Vue + Nuxt UI v4
npm create nuxt@latest -- --no-modules -t ui-vue

# Dashboard 模板（含侧栏 + 全套 Dashboard 组件）
npm create nuxt@latest -- --no-modules -t ui-vue/dashboard

# AI Chat 模板（含 UChatPrompt + AI SDK v5）
npm create nuxt@latest -- --no-modules -t ui-vue/chat
```

> 这些模板是 v4 后**免费开源**的——v3 时代 Dashboard / Chat 模板是 Pro 付费内容。

### 国内镜像加速

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm 用户同样需要**——pnpm 默认走 npm registry。

## 第一个 Nuxt UI 应用

### app.vue / App.vue（必须 UApp 包根）

Nuxt 项目（`app.vue`）：

```vue
<template>
  <UApp :locale="zhCn">
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
import { zhCn } from '@nuxt/ui/locale'
</script>
```

Vue 项目（`src/App.vue`）：

```vue
<template>
  <UApp :locale="zhCn">
    <RouterView />
  </UApp>
</template>

<script setup lang="ts">
import { zhCn } from '@nuxt/ui/locale'
</script>
```

> **关键概念 UApp Provider**：
>
> 1. **`<UApp>` 必须包根**——所有 Nuxt UI 组件都必须是它的子孙，**OverlayProvider + ToastProvider + LocaleProvider + 主题注入** 全在 UApp 内
> 2. **不用 `<UApp>` 会怎样？**——`<UButton>` 等基础组件还能用，但 `useToast()` / `useOverlay()` / `<UModal>` / `<UTooltip>` **完全不工作**
> 3. **i18n 通过 `:locale` prop 注入**——默认英文，中文要 import `zhCn` 并传入

### HelloNuxt.vue（第一个组件示例）

```vue
<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">第一个 Nuxt UI 示例</h1>

    <div class="flex gap-2">
      <UButton color="primary" @click="showToast">
        显示 Toast
      </UButton>

      <UButton color="success" variant="outline" icon="i-lucide-check">
        成功按钮
      </UButton>

      <UButton color="error" variant="soft" :loading="loading" @click="handleAsync">
        异步按钮
      </UButton>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4 max-w-md"
      @submit="onSubmit"
    >
      <UFormField label="姓名" name="name">
        <UInput v-model="state.name" placeholder="请输入姓名" class="w-full" />
      </UFormField>

      <UFormField label="邮箱" name="email">
        <UInput v-model="state.email" placeholder="请输入邮箱" class="w-full" />
      </UFormField>

      <UFormField label="密码" name="password">
        <UInput
          v-model="state.password"
          type="password"
          placeholder="请输入密码"
          class="w-full"
        />
      </UFormField>

      <UButton type="submit" color="primary" block>
        提交
      </UButton>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { reactive, ref } from 'vue'
import * as z from 'zod'

// Composable API（必须在 setup 内调用）
const toast = useToast()

// 异步按钮 loading 状态
const loading = ref(false)

// 表单 Zod 校验 schema
const schema = z.object({
  name: z.string().min(2, '姓名至少 2 个字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 个字符'),
})

type Schema = z.output<typeof schema>

// 表单 state
const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
  password: undefined,
})

// 提交
async function onSubmit(event: FormSubmitEvent<Schema>) {
  // event.data 已通过 Zod 校验、类型为 Schema
  toast.add({
    title: '提交成功',
    description: `欢迎 ${event.data.name}`,
    color: 'success',
  })
}

// Toast 示例
const showToast = () => {
  toast.add({
    title: '消息',
    description: '这是一条 Toast 通知',
    icon: 'i-lucide-info',
    color: 'info',
    duration: 3000,
  })
}

// 异步按钮（loading 自动管理）
const handleAsync = async () => {
  loading.value = true
  await new Promise((r) => setTimeout(r, 1500))
  loading.value = false
  toast.add({ title: '异步操作完成', color: 'success' })
}
</script>
```

**这个示例覆盖**：

- `<UButton>`：基础按钮 + color / variant / icon / loading
- `<UForm>` / `<UFormField>` / `<UInput>`：表单 + Zod schema 校验
- `useToast()`：Toast Composable（必须在 setup 内）
- TypeScript 类型：`FormSubmitEvent<Schema>` + Zod `z.output<>`

> **Nuxt 项目自动 import**——`UButton` / `useToast` 等都不需要 `import` 语句、`@nuxt/ui` 自动注册。**Vue 项目通过 `@nuxt/ui/vite` 插件也是自动 import**——也不需要 import。

启动 `pnpm dev`——可以看到完整 Nuxt UI 表单 UI + Toast 通知。

## Tailwind CSS 4（必装）

Nuxt UI v4 **强制要求 Tailwind 4**——这是 v3 → v4 最大破坏性变更之一。

### Tailwind 4 vs Tailwind 3

| 维度 | Tailwind 3 | **Tailwind 4** |
|---|---|---|
| 入口 | `@tailwind base; @tailwind components; @tailwind utilities;` | **`@import "tailwindcss";`** |
| 配置 | `tailwind.config.js` | **CSS-first：`@theme` 指令** |
| PostCSS | 必需 | **可选**（内置编译） |
| 速度 | 中 | **极快**（Rust 引擎） |
| 主题变量 | JS 对象 | **CSS variables `--color-*`** |
| `theme()` 函数 | `theme('colors.blue.500')` | **CSS variables 直接用** |

> **Tailwind 4 的入口必须是 `@import "tailwindcss";`**——`@tailwind` 指令已被废弃。

### Nuxt UI 的 Tailwind 4 入口

`app/assets/css/main.css`（Nuxt）或 `src/assets/css/main.css`（Vue）：

```css
@import "tailwindcss";
@import "@nuxt/ui";

/* 自定义主题 colors（v4 用 @theme 指令） */
@theme static {
  --color-brand-50: #fef2f2;
  --color-brand-100: #fee2e2;
  --color-brand-200: #fecaca;
  --color-brand-300: #fca5a5;
  --color-brand-400: #f87171;
  --color-brand-500: #ef4444;
  --color-brand-600: #dc2626;
  --color-brand-700: #b91c1c;
  --color-brand-800: #991b1b;
  --color-brand-900: #7f1d1d;
  --color-brand-950: #450a0a;
}
```

> **`@theme static` 比 `@theme` 多一个 `static` 关键字**——表示这些变量在构建时静态生成、不参与运行时切换（性能更好）。运行时动态色用 `@theme inline`。

定义完后可以在 `app.config.ts` 中作为语义化别名引用：

```ts
// app.config.ts (Nuxt)
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',  // 引用上面定义的 --color-brand-*
    },
  },
})
```

或 Vue 项目 `vite.config.ts`：

```ts
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      ui: {
        colors: {
          primary: 'brand',
        },
      },
    }),
  ],
})
```

详细主题深度见[指南 > 主题深度](./guide-line.md#主题深度自定义)。

## 主题语义化别名

Nuxt UI 主题用 **7 个语义化别名**——这些别名映射到具体 Tailwind 颜色：

| 别名 | 默认色 | 用途 |
|---|---|---|
| **primary** | green | 主 CTA / 激活状态 / 品牌色 / 重要链接 |
| **secondary** | blue | 次要按钮 / 备选 action / 辅助 UI |
| **success** | green | 成功消息 / 完成状态 / 正向确认 |
| **info** | blue | 信息提示 / Tooltip / 帮助文本 |
| **warning** | yellow | 警告消息 / 待处理状态 / 需注意 |
| **error** | red | 错误消息 / 校验错误 / 危险操作 |
| **neutral** | slate | 文本 / 边框 / 背景 / 禁用 |

### 修改语义化色

`app.config.ts`（Nuxt）：

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',       // 主色改蓝
      secondary: 'purple',   // 次色改紫
      neutral: 'zinc',       // 中性色改 zinc
    },
  },
})
```

> **只能用 Tailwind 默认 21 个色**（red / orange / amber / yellow / lime / green / emerald / teal / cyan / sky / blue / indigo / violet / purple / fuchsia / pink / rose / slate / gray / zinc / neutral / stone）**或 `@theme` 中自定义的色**。

### 在组件中用语义化色

```vue
<UButton color="primary">主按钮</UButton>
<UButton color="success">成功</UButton>
<UButton color="warning">警告</UButton>
<UButton color="error">危险</UButton>
<UButton color="neutral" variant="ghost">中性</UButton>
```

> **`color` prop 只接受 7 个语义化别名**——不接受具体颜色名（如 `red` / `blue`）。

## 图标（Lucide + Iconify）

Nuxt UI 默认用 [Lucide](https://lucide.dev/) 图标集——`i-lucide-*` 命名约定：

### 基本用法

```vue
<template>
  <!-- UIcon 组件 -->
  <UIcon name="i-lucide-home" class="size-5" />
  <UIcon name="i-lucide-settings" class="size-6 text-primary-500" />

  <!-- 大部分组件含 icon prop -->
  <UButton icon="i-lucide-plus" label="新增" />
  <UButton trailing-icon="i-lucide-arrow-right" label="下一步" />

  <UInput leading-icon="i-lucide-search" placeholder="搜索..." />
</template>
```

### 安装其他图标集

Nuxt UI 通过 [Iconify](https://iconify.design/) 提供 **200,000+ 图标**——任何 Iconify 集合都可以装：

```bash
# Material Design Icons
pnpm add @iconify-json/mdi

# Heroicons
pnpm add @iconify-json/heroicons

# Carbon
pnpm add @iconify-json/carbon

# Font Awesome
pnpm add @iconify-json/fa6-solid
```

装好后直接用：

```vue
<UIcon name="i-mdi-home" />
<UIcon name="i-heroicons-cog-6-tooth" />
<UIcon name="i-carbon-cloud-upload" />
```

> **生产构建必须本地安装 `@iconify-json/*` 包**——否则会请求 Iconify CDN（性能差 + 离线不可用）。

### 自定义本地 SVG 图标

`nuxt.config.ts`（Nuxt 项目）：

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  icon: {
    customCollections: [
      {
        prefix: 'custom',
        dir: './app/assets/icons',
      },
    ],
  },
})
```

把 SVG 文件放到 `./app/assets/icons/` 下（如 `logo.svg`）—— 在组件中用：

```vue
<UIcon name="i-custom-logo" />
```

## 暗色模式

Nuxt UI 用 **`<html class="dark">` 类名驱动**（Tailwind 4 `darkMode: 'class'` 模式）—— 与 Naive UI `<n-config-provider :theme="darkTheme">` 完全不同。

### Nuxt 项目（自动）

Nuxt UI **自动注册 `@nuxtjs/color-mode`** —— 无需任何配置，**`prefers-color-scheme: dark` 自动切换 + localStorage 持久化**。

直接用现成切换组件：

```vue
<template>
  <!-- 简单按钮（一键切换） -->
  <UColorModeButton />

  <!-- 开关 -->
  <UColorModeSwitch />

  <!-- 下拉选择（light / dark / system） -->
  <UColorModeSelect />
</template>
```

### 自定义切换 UI

用 `useColorMode()` Composable：

```vue
<template>
  <ClientOnly>
    <UButton
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      variant="ghost"
      aria-label="切换主题"
      @click="toggleColorMode"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggleColorMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
```

> **`<ClientOnly>` 包裹避免 SSR hydration mismatch**——服务端不知道客户端的主题偏好。

### Vue 项目（v4 新）

Vue 项目用 `@nuxt/ui/vue-plugin` 内置的 `useColorMode`——**自动支持暗色切换**，**默认开启**。

如果不需要暗色模式，`vite.config.ts` 中关闭：

```ts
ui({
  colorMode: false,
})
```

## 中文国际化

Nuxt UI 默认是 **英文**——国内项目必须切到中文。

### 设置中文

```vue
<template>
  <UApp :locale="zhCn">
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
import { zhCn } from '@nuxt/ui/locale'
</script>
```

### 动态切换语言

```vue
<template>
  <UApp :locale="currentLocale">
    <UButton @click="toggleLang">
      切换语言：{{ currentLang }}
    </UButton>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { en, zhCn } from '@nuxt/ui/locale'

const currentLang = ref<'zh' | 'en'>('zh')

const currentLocale = computed(() => (currentLang.value === 'zh' ? zhCn : en))

const toggleLang = () => {
  currentLang.value = currentLang.value === 'zh' ? 'en' : 'zh'
}
</script>
```

### 支持的语言（50+）

Nuxt UI 内置 **50+ 语言包** + **RTL 双向**：

| 语言 | locale | 方向 |
|---|---|---|
| 简体中文 | `zhCn` | ltr |
| 繁体中文 | `zhTw` | ltr |
| 英文 | `en` | ltr（默认） |
| 日文 | `ja` | ltr |
| 韩文 | `ko` | ltr |
| 法文 | `fr` | ltr |
| 德文 | `de` | ltr |
| 西班牙文 | `es` | ltr |
| 俄文 | `ru` | ltr |
| 阿拉伯文 | `ar` | **rtl** |
| 希伯来文 | `he` | **rtl** |

完整列表见[参考 > 50+ 语言列表](./reference.md#i18n-50-语言列表)。

### 与 Nuxt i18n 模块集成

如果用 [@nuxtjs/i18n](https://i18n.nuxtjs.org/) 模块：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'zh-CN',
  },
})
```

```vue
<template>
  <UApp :locale="currentLocale">
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { en, zhCn } from '@nuxt/ui/locale'

const { locale } = useI18n()

const currentLocale = computed(() => {
  return locale.value === 'zh-CN' ? zhCn : en
})
</script>
```

## 字体

Nuxt UI 通过 `@nuxt/fonts` 自动管理字体——**Nuxt 项目自动注册**。

### Nuxt 项目（自动）

无需任何配置——`@nuxt/fonts` 已经在 `<UApp>` 内自动启用，**默认用浏览器字体（system-ui）**。

要用 Google Fonts：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  // 自动 import + 优化 Google Fonts
  fonts: {
    families: [
      { name: 'Inter', provider: 'google' },
      { name: 'Fira Code', provider: 'google' },
    ],
  },
})
```

`tailwind.config` 已经废弃——直接在 `main.css` 中通过 `@theme` 配置字体：

```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Fira Code", monospace;
}
```

### Vue 项目

Vue 项目**不自动注册 `@nuxt/fonts`**——可以传统方式 import：

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
  rel="stylesheet"
/>
```

`main.css` 中配置：

```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
}
```

## 与 Vue Router + Pinia 集成

Nuxt UI + Vue Router + Pinia 一起使用零冲突。

### Vue 项目典型 main.ts

```ts
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import './assets/css/main.css'

import App from './App.vue'
import HomeView from './views/HomeView.vue'
import AboutView from './views/AboutView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/about', name: 'about', component: AboutView },
  ],
})

const pinia = createPinia()

const app = createApp(App)
app.use(router)
app.use(pinia)
app.use(ui)
app.mount('#app')
```

### Layout 示例

```vue
<!-- src/App.vue -->
<template>
  <UApp :locale="zhCn">
    <div class="min-h-screen flex flex-col">
      <header class="border-b border-default px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">我的应用</h1>

          <div class="flex items-center gap-3">
            <UNavigationMenu :items="navItems" />
            <UColorModeButton />
          </div>
        </div>
      </header>

      <main class="flex-1">
        <RouterView />
      </main>
    </div>
  </UApp>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { zhCn } from '@nuxt/ui/locale'

// Nuxt UI 导航菜单
const navItems: NavigationMenuItem[] = [
  { label: '首页', icon: 'i-lucide-home', to: '/' },
  { label: '关于', icon: 'i-lucide-info', to: '/about' },
]
</script>
```

> **关键点**：
>
> 1. `<UNavigationMenu>` 用 `items` 数组（不是 slot）
> 2. 菜单项的 `to` 自动通过 [`<ULink>`](https://ui.nuxt.com/components/link) 包装、支持 Vue Router
> 3. `<UColorModeButton>` 自动同步 `<html class="dark">`

详细集成见[指南 > 与 Vue Router + Pinia 集成](./guide-line.md#与-vue-router--pinia-集成)。

## v3 → v4 主要变化

如果你之前用过 Nuxt UI v3，要注意 v4 的破坏性变更：

### 包结构变化

```bash
# v3：两个包
pnpm remove @nuxt/ui @nuxt/ui-pro

# v4：合并为一个
pnpm add @nuxt/ui
```

`nuxt.config.ts`：

```diff
- modules: ['@nuxt/ui', '@nuxt/ui-pro']
+ modules: ['@nuxt/ui']
```

`main.css`：

```diff
  @import "tailwindcss";
- @import "@nuxt/ui-pro";
  @import "@nuxt/ui";
```

### Tailwind 4 强制

v3 兼容 Tailwind 3，v4 必须 Tailwind 4：

```diff
- @tailwind base;
- @tailwind components;
- @tailwind utilities;
+ @import "tailwindcss";
+ @import "@nuxt/ui";
```

`tailwind.config.js` 废弃——主题通过 `@theme` 指令在 CSS 中配置。

### 组件改名

- `<UButtonGroup>` → `<UFieldGroup>`
- `<UPageMarquee>` → `<UMarquee>`
- `<UPageAccordion>` → 移除（用 `<UAccordion>`）

### Form / Input 行为变化

- `nullify` 修饰符 → `nullable`
- 新增 `optional` 修饰符（转换空值为 `undefined`）
- Schema transforms 只作用于 submit data、不再 mutate state
- 嵌套 Form 必须加 `nested` prop

### useChat → Chat 类（AI 集成）

- `useChat()` 替换为 `new Chat()` 类
- Messages 用 `parts` 而非 `content`
- `<MDC>` 组件改名为 `<Comark>`
- AI SDK 升级到 v5.0.x、Vercel `ai` 包 v5.0.x

详细迁移见[指南 > v3 → v4 迁移](./guide-line.md#v3-→-v4-迁移)。

## 下一步

到这里你已经会用 Nuxt UI 搭建基础 Nuxt / Vue 应用了——下一步深入：

- [指南](./guide-line.md)：**125+ 组件按 12 大类速览** / **UForm 深度**（Standard Schema + Zod / Valibot / Yup / Joi / Superstruct + 嵌套表单 + 程序化校验） / **UTable 深度**（TanStack Table v8 columns + 排序 / 筛选 / 分页 / 行选 / 列固定 / 虚拟化） / **Overlay 全套**（Modal + Slideover + Drawer + Popover + `useOverlay` 程序化 API） / **useToast / useOverlay / useColorMode** 完整 API / **主题深度自定义** / **AI Chat 组件** / **Dashboard 模板** / **UAuthForm 一行登录页** / **i18n + RTL** / **v3 → v4 迁移** / **常见踩坑**
- [参考](./reference.md)：**API 速查** / 125+ 组件列表 / 常用 props 表 / Composable 签名 / TypeScript 类型 / `defineAppConfig` 主题结构 / 50+ 语言列表
