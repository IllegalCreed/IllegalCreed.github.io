---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Arco Design Vue 2.x**（截至 2026 年 **v2.58.x**，发布于 2026 年 4 月；要求 **Vue 3.x** + **Node 18+**，**不支持 Vue 2**——Vue 2 项目需选其他 UI 库）。

## 速查

- 系统要求：**Vue 3.x**（推荐 3.4+） + **Node 18+** + 推荐 **TypeScript 5+**
- 浏览器：现代浏览器（Chrome / Edge / Firefox / Safari 最新两个版本），**不支持 IE**
- 安装：`pnpm add @arco-design/web-vue` / `npm i @arco-design/web-vue` / `yarn add @arco-design/web-vue`
- 全量引入：`import ArcoVue from '@arco-design/web-vue'` + `app.use(ArcoVue)` + `import '@arco-design/web-vue/dist/arco.css'`
- 按需引入：`unplugin-vue-components` + `ArcoResolver`（推荐生产环境，**bundle 显著减小**）
- 图标按需：`AutoImport` + `ArcoResolver()` 自动 import icon（`<icon-plus />` 自动注入）
- icon 包：`@arco-design/web-vue/es/icon`（**内置 700+ Arco Icons，无需额外装**）
- 全局配置：`<a-config-provider :locale="zhCN" :size="size">` 包根
- 中文 i18n：`import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'` + `:locale="zhCN"`
- 暗色：`document.body.setAttribute('arco-theme', 'dark')` —— 一行启用
- 组件命名：`<a-button>` / `<AButton>`（kebab-case / PascalCase 等价）
- API 命名：`Modal.confirm` / `Modal.info` / `Message.success` / `Notification.info` —— **全局静态方法、无需 Provider**
- 国内镜像：`npm config set registry https://registry.npmmirror.com`
- Nuxt 3 兼容：v2.44.3+ 添加 `exports` 配置，Nuxt 3 即装即用

## Arco Design Vue 是什么

Arco Design Vue 是 **字节跳动（ByteDance）** GIP / ECom / Lark 等业务线前端团队 **联合维护** 的 **企业级 Vue 3 UI 组件库**，**2021 年 5 月** 在 GitHub 开源——是字节内部 **Arco Design 设计系统** 的官方 Vue 3 实现，与 **Arco Design React** 共享同一套设计语言。理解 Arco Design Vue 必须先理解它的**核心定位**：

- **字节官方背书**：与 Element Plus（饿了么）/ Ant Design Vue（社区维护）相比——Arco Design Vue 是**字节跳动内部多业务线前端团队联合维护**（飞书 / 抖音电商 / TikTok 等都在用），**企业级稳定性最有保障**
- **双栈设计统一**：与 React 版（[arco-design/arco-design](https://github.com/arco-design/arco-design)）**共享同一套设计 token + 视觉规范 + 组件交互**——**唯一同时拥有 React + Vue 双官方实现**的国内设计系统
- **Design Lab 在线主题**：[arco.design/themes](https://arco.design/themes) 提供**拖拽生成主题包**——设计师在线调色、一键导出 npm package、**国内 Vue UI 库独家**
- **100% TypeScript 编写**：源码 66.1% TS + 18.4% Vue + 14.0% Less——所有组件、API、locale、theme 都有完整 .d.ts
- **截至 2026 年的 v2.58.x**：处于「**稳定迭代期**」——字节内部 daily updates + 社区 PR 持续合并

Arco Design Vue 与 Element Plus / Ant Design Vue / Naive UI 等 Vue 3 UI 库的本质差异：

| 维度 | Arco Design Vue | Element Plus | Ant Design Vue | Naive UI |
|---|---|---|---|---|
| 阵营 | **字节跳动官方** | 饿了么 + 社区 | Ant Design 社区维护 | 图森未来 + 社区 |
| 设计语言 | **Arco Design**（字节企业级） | 企业管理后台 | Ant Design | Discord 现代极简 |
| React 版本 | **官方双栈一致** | — | React Antd（更权威） | — |
| 国内市场份额 | 中（增长中） | **断层第一** | 中（国际化好） | 起步增长 |
| TypeScript | 100% TS 编写 | 完整类型 | 完整类型 | **100% TS 编写** |
| API 风格 | **Modal.confirm 全局静态** | ElMessage 全局静态 | Modal.confirm 全局静态 | useMessage Composable |
| 主题系统 | **Less + CSS Vars 双轨** | CSS Vars + SCSS | Less Variables | TS 对象 + CSS-in-JS |
| 主题工具 | **Design Lab 在线 GUI** | — | — | — |
| 组件数 | 60+ | 80+ | 60+ | 90+ |
| 暗色 | `arco-theme="dark"` body | `<html class="dark">` | `<a-config-provider>` | `darkTheme` 对象 |
| 中文文档 | 完整 | **官方完整** | 完整 | 完整 |
| Pro 模板 | **arco-design-pro-vue 官方** | element-plus-admin 社区 | — | naive-ui-admin 社区 |
| 招聘市场 | 字节系优势 | **国内绝对主流** | 国际化项目多 | 起步增长 |

**含义**：

- Arco Design Vue **字节大厂背书 + 双栈设计统一 + Design Lab + Pro 模板完整**——是**企业级中后台 + 跨 React/Vue 双栈团队 + 希望用字节同款**的最佳选择
- **不适合**：必须 Element Plus 招聘市场 / 设计驱动的 C 端轻量产品（用 Naive UI）/ 移动端 H5（用 Vant）/ 严格 Material Design（用 Vuetify）
- **适合**：字节内部 / 字节系子公司 / 国内企业级中后台 / 希望 Vue React 共用设计 / 需要 Design Lab 拖拽生成主题 / 想用官方 Pro 模板的中大型团队

## 安装与首次启动

### 创建 Vue 3 项目

如果**还没有 Vue 3 项目**，先创建一个：

```bash
pnpm create vue@latest
# 或：npm create vue@latest / yarn create vue / bun create vue@latest
```

交互式菜单建议都选 **Yes**（TypeScript / Router / Pinia / ESLint / Vitest）：

```
Add TypeScript? ... Yes
Add JSX Support? ... No
Add Vue Router for Single Page Application development? ... Yes
Add Pinia for state management? ... Yes
Add Vitest for Unit Testing? ... Yes
Add ESLint for code quality? ... Yes
```

> 完成后已有完整 Vue 3 + TS 项目骨架——下一步**单独装 Arco Design Vue**（create-vue 不带 Arco 选项）。

### 安装 Arco Design Vue

```bash
# 主包
pnpm add @arco-design/web-vue

# 按需引入插件（推荐生产）
pnpm add -D unplugin-vue-components unplugin-auto-import
```

| 包名 | 用途 | 必需 |
|---|---|---|
| `@arco-design/web-vue` | 主组件库（含 700+ Arco Icons） | **必需** |
| `unplugin-vue-components` | 按需引入组件（生产推荐） | 推荐 |
| `unplugin-auto-import` | 按需引入 API + 图标 | 推荐 |
| `less` / `less-loader` | Less 主题深度定制 | 仅深度主题定制需要 |
| `@arco-design/web-vue/dist/arco.css` | 全量 CSS | 全量引入时需要 |

Vue 版本要求：

| Vue 版本 | Arco Design Vue 版本 |
|---|---|
| **Vue 3.x** | **Arco Design Vue 2.x**（推荐） |
| Vue 2.x | **不支持** |

> Arco Design Vue **从未支持 Vue 2**——Vue 2 项目请选 Element UI / iView / Vuetify 2。

### 国内镜像加速

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm 用户同样需要**——pnpm 默认走 npm registry。

## 全量引入（最简单）

**适合**：原型验证 / Demo / 不在意 bundle 大小的内部工具：

### main.ts

```ts
import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import App from './App.vue'

// CSS 必须 import
import '@arco-design/web-vue/dist/arco.css'

const app = createApp(App)
app.use(ArcoVue)
app.use(ArcoVueIcon)   // 图标也注册（推荐）
app.mount('#app')
```

> **两个独立 plugin**：
>
> 1. `ArcoVue`：注册所有组件（60+ 组件）
> 2. `ArcoVueIcon`：注册所有图标（700+ 图标，**可选但推荐**）
>
> CSS **必须 import**——否则组件没有样式（白屏 / 无样式按钮）。

### App.vue（最小示例）

```vue
<template>
  <a-config-provider :locale="zhCN">
    <a-button type="primary" @click="handleClick">
      <template #icon><icon-plus /></template>
      点我
    </a-button>
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import { Message } from '@arco-design/web-vue'

const handleClick = () => {
  Message.success('成功')
}
</script>
```

> **关键点**：
>
> 1. `<a-config-provider>` 包根：**全局配置 locale / size**（i18n / 组件大小一处注入）
> 2. `<icon-plus />`：全量引入后所有图标都可用（`a-` 前缀的组件 + `icon-` 前缀的图标）
> 3. `Message.success('...')`：**全局静态 API**——**无需 Provider 嵌套**（vs Naive UI 必须包 `<n-message-provider>`）

启动 `pnpm dev` 访问页面——可以看到完整的 Arco Design Vue 按钮。

## 按需引入（推荐）

**适合**：所有生产项目——Tree Shaking + 自动 import，**生产 bundle 比全量引入小 60%+**：

### 安装插件

```bash
pnpm add -D unplugin-vue-components unplugin-auto-import
```

| 插件 | 作用 |
|---|---|
| `unplugin-vue-components` | 扫描模板中 `<a-button>` 自动 import `Button` |
| `unplugin-auto-import` | 扫描代码中 `Message` / `Modal` 等自动 import |

### vite.config.ts 配置

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [
        ArcoResolver(),
      ],
    }),
    Components({
      resolvers: [
        ArcoResolver({
          sideEffect: true,   // 必须 true——否则不会 import CSS
        }),
      ],
    }),
  ],
})
```

> **`sideEffect: true` 必须打开**——否则插件只 import 组件 JS、不 import 对应的 CSS（按钮无样式）。

### 图标按需引入（特殊设置）

Arco 图标也支持按需——`AutoImport` 配合 `ArcoResolver` 自动 import 图标：

```ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [
        ArcoResolver({
          resolveIcons: true,   // 图标也自动 import
        }),
      ],
    }),
    Components({
      resolvers: [
        ArcoResolver({
          sideEffect: true,
        }),
      ],
    }),
  ],
})
```

> 模板写 `<icon-plus />` —— 插件自动 import `IconPlus` from `@arco-design/web-vue/es/icon`。

### 按需引入的工作原理

```vue
<template>
  <a-button type="primary" @click="handleClick">
    <template #icon><icon-plus /></template>
    点我
  </a-button>
</template>

<script setup>
const handleClick = () => {
  Message.success('成功')
}
</script>
```

**构建时插件自动转换为**：

```vue
<script setup>
// unplugin-vue-components 自动注入：
import { Button as AButton } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'

// unplugin-auto-import 自动注入：
import { Message } from '@arco-design/web-vue'

const handleClick = () => {
  Message.success('成功')
}
</script>
```

> **开发者只写少量代码、插件自动生成 import + CSS** —— 这是按需引入的核心价值。`ArcoResolver` 要求 Arco Design Vue **>= v2.11.0**（早期版本不支持）。

### 不用按需插件时（手动按需）

也可以**完全不用插件**、手动按需引入：

```vue
<template>
  <a-button type="primary" @click="handleClick">
    <template #icon><IconPlus /></template>
    点我
  </a-button>
</template>

<script setup lang="ts">
import { Button, Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import '@arco-design/web-vue/es/button/style/css.js'   // 手动 import CSS

const handleClick = () => {
  Message.success('成功')
}
</script>
```

> **必须手动 import 每个组件的 CSS**——否则无样式。**用 `ArcoResolver` 自动处理更省事**。

### TypeScript 自动生成 d.ts

两个插件自动生成的 .d.ts 文件：

- `src/components.d.ts`：所有按需 import 的组件类型（让 Volar 知道 `<a-button>` 存在）
- `src/auto-imports.d.ts`：所有按需 import 的 API（Message / Modal / Notification）类型

> **建议提交到仓库** —— 避免 CI 构建时第一次启动报 TS 错误。

## 第一个 Arco Design Vue 应用

整合按需引入 + 全局配置 + 表单 + 反馈 API：

### main.ts

```ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```

> 按需引入后**不需要 `app.use(ArcoVue)`**——插件自动处理。

### App.vue（全局配置 + 第一个完整组件）

```vue
<template>
  <a-config-provider :locale="zhCN" :size="size">
    <div style="padding: 24px;">
      <h1>第一个 Arco Design Vue 示例</h1>

      <a-space>
        <a-button type="primary" @click="showMessage">显示消息</a-button>
        <a-button type="outline" @click="showModal">显示对话框</a-button>
        <a-button type="dashed" @click="showNotification">显示通知</a-button>
      </a-space>

      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :style="{ maxWidth: '400px', marginTop: '24px' }"
        @submit="handleSubmit"
      >
        <a-form-item field="name" label="姓名">
          <a-input v-model="form.name" placeholder="请输入姓名" allow-clear />
        </a-form-item>

        <a-form-item field="email" label="邮箱">
          <a-input v-model="form.email" placeholder="请输入邮箱" allow-clear />
        </a-form-item>

        <a-form-item field="age" label="年龄">
          <a-input-number v-model="form.age" placeholder="请输入年龄" :min="0" :max="120" />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit">提交</a-button>
            <a-button @click="resetForm">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message, Modal, Notification } from '@arco-design/web-vue'
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import type { FormInstance } from '@arco-design/web-vue/es/form'

// 全局尺寸
const size = ref<'mini' | 'small' | 'medium' | 'large'>('medium')

// 表单 ref + model + 校验规则
const formRef = ref<FormInstance | null>(null)
const form = reactive({
  name: '',
  email: '',
  age: 18,
})

const rules = {
  name: [
    { required: true, message: '请输入姓名' },
    { minLength: 2, maxLength: 20, message: '长度在 2 到 20 个字符' },
  ],
  email: [
    { required: true, type: 'email', message: '请输入合法的邮箱' },
  ],
  age: [
    { required: true, type: 'number', min: 0, max: 120, message: '年龄需在 0-120 之间' },
  ],
}

// 提交表单
const handleSubmit = ({ values, errors }: { values: any; errors: any }) => {
  if (errors) {
    Message.error('请检查表单填写')
    return
  }
  Message.success(`提交成功：${JSON.stringify(values)}`)
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
}

// 静态 API 演示
const showMessage = () => {
  Message.success('这是一条成功消息')
}

const showModal = () => {
  Modal.confirm({
    title: '提示',
    content: '确定要执行该操作吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: () => Message.success('已确认'),
    onCancel: () => Message.info('已取消'),
  })
}

const showNotification = () => {
  Notification.info({
    title: '系统通知',
    content: '这是一条角落通知',
    duration: 3000,
  })
}
</script>
```

**这个示例覆盖**：

- `<a-button>`：基础按钮 + `type`（primary / outline / dashed） + `html-type="submit"`
- `<a-form>` / `<a-form-item>` / `<a-input>` / `<a-input-number>`：表单 + 校验（**13+ 类型 + minLength / type: 'email' / type: 'number' + min / max**）
- `<a-space>`：间距控制（替代 margin）
- `Message.success(...)`：**全局静态消息 API**（无需 Provider）
- `Modal.confirm({...})`：**全局静态对话框 API**（Promise 风格）
- `Notification.info({...})`：**全局静态通知 API**（角落卡片）
- `<a-config-provider>`：全局配置 locale + size
- TypeScript：`FormInstance` 类型

启动 `pnpm dev`——可以看到完整的 Arco Design Vue 表单 + 校验 + 反馈 API。

## 中文国际化

Arco Design Vue 默认**英文**——国内项目必须切到中文。**只需要一个 locale 包**：

### 配置中文

```vue
<template>
  <a-config-provider :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
</script>
```

> 与 Naive UI 不同——**Arco 只有一个 locale 包**（不分组件 locale 和 date locale），简单直接。

### 动态切换语言

```vue
<template>
  <a-config-provider :locale="locale">
    <a-radio-group v-model="localeType" type="button">
      <a-radio value="zh-CN">中文</a-radio>
      <a-radio value="en-US">English</a-radio>
      <a-radio value="ja-JP">日本語</a-radio>
    </a-radio-group>

    <a-divider />

    <a-pagination :total="50" show-total show-jumper show-page-size />
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'
import jaJP from '@arco-design/web-vue/es/locale/lang/ja-jp'

const localeType = ref<'zh-CN' | 'en-US' | 'ja-JP'>('zh-CN')

const locales: Record<string, any> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
}

const locale = computed(() => locales[localeType.value] || zhCN)
</script>
```

### 支持的语言（13 种）

Arco Design Vue 内置 **13+ 语言包**：

| 语言 | locale | 引入路径 |
|---|---|---|
| 简体中文 | zh-CN | `@arco-design/web-vue/es/locale/lang/zh-cn` |
| 英文 | en-US | `@arco-design/web-vue/es/locale/lang/en-us` |
| 日文 | ja-JP | `@arco-design/web-vue/es/locale/lang/ja-jp` |
| 韩文 | ko-KR | `@arco-design/web-vue/es/locale/lang/ko-kr` |
| 西班牙文 | es-ES | `@arco-design/web-vue/es/locale/lang/es-es` |
| 法文 | fr-FR | `@arco-design/web-vue/es/locale/lang/fr-fr` |
| 德文 | de-DE | `@arco-design/web-vue/es/locale/lang/de-de` |
| 意大利文 | it-IT | `@arco-design/web-vue/es/locale/lang/it-it` |
| 印尼文 | id-ID | `@arco-design/web-vue/es/locale/lang/id-id` |
| 葡萄牙文 | pt-PT | `@arco-design/web-vue/es/locale/lang/pt-pt` |
| 泰文 | th-TH | `@arco-design/web-vue/es/locale/lang/th-th` |
| 越南文 | vi-VN | `@arco-design/web-vue/es/locale/lang/vi-vn` |
| 荷兰文 | nl-NL | `@arco-design/web-vue/es/locale/lang/nl-nl` |

> **国际化覆盖比 Element Plus 内置更广泛**——字节出海项目（TikTok Shop / Lark 等）的实战沉淀。完整列表见 [GitHub locale 目录](https://github.com/arco-design/arco-design-vue/tree/main/packages/web-vue/components/locale/lang)。

## 暗色模式

Arco Design Vue 暗色模式**极简**——只需要给 `<body>` 加一个 `arco-theme="dark"` 属性：

### 一行启用

```js
// 切换到暗色
document.body.setAttribute('arco-theme', 'dark')

// 切换回亮色
document.body.removeAttribute('arco-theme')
```

> 与 Naive UI（import darkTheme） / Element Plus（`<html class="dark">` + 暗色 CSS）相比——**Arco 是最简单的**：一个 body 属性、所有组件自动切换，**无需额外 CSS**。

### 完整切换组件示例

```vue
<template>
  <div style="padding: 24px;">
    <a-space>
      <span>主题：</span>
      <a-switch v-model="isDark" @change="toggleTheme">
        <template #checked>暗</template>
        <template #unchecked>亮</template>
      </a-switch>
    </a-space>

    <a-divider />

    <a-button type="primary">按钮（颜色自动跟随主题）</a-button>
    <a-input placeholder="输入框" allow-clear style="width: 200px; margin-left: 12px;" />
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const isDark = ref(false)

// 切换主题
const toggleTheme = (val: boolean | string | number) => {
  if (val) {
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.body.removeAttribute('arco-theme')
  }
}
</script>
```

### 跟随系统主题

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isDark = ref(false)

const updateTheme = (matches: boolean) => {
  isDark.value = matches
  if (matches) {
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.body.removeAttribute('arco-theme')
  }
}

let mediaQuery: MediaQueryList | null = null

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  updateTheme(mediaQuery.matches)
  mediaQuery.addEventListener('change', (e) => updateTheme(e.matches))
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', (e) => updateTheme(e.matches))
})
</script>
```

### 持久化（结合 VueUse）

```bash
pnpm add @vueuse/core
```

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useDark } from '@vueuse/core'

const isDark = useDark({
  selector: 'body',
  attribute: 'arco-theme',
  valueDark: 'dark',
  valueLight: '',
})

// useDark 自动同步：localStorage + 系统主题 + body[arco-theme]
</script>
```

> **`useDark` 的 selector / attribute / valueDark` 配置正好对应 Arco 的 body 属性切换**——`@vueuse/core` 一行搞定持久化 + 跟随系统。

## 图标使用

Arco Design Vue **内置 700+ 自研 Arco Icons** —— **无需额外装** `@vicons/*` 或 `@element-plus/icons-vue`：

### 全量注册

```ts
// main.ts
import ArcoVueIcon from '@arco-design/web-vue/es/icon'

app.use(ArcoVueIcon)
```

模板中直接用：

```vue
<template>
  <a-button type="primary">
    <template #icon><icon-plus /></template>
    新增
  </a-button>

  <icon-star :size="24" />
</template>
```

### 按需引入（推荐）

按 `ArcoResolver` 配置后（见上文 `vite.config.ts`），模板写 `<icon-plus />` 插件自动 import：

```vue
<template>
  <icon-plus />
  <icon-delete />
  <icon-search />
</template>
```

构建时自动转换为：

```ts
import { IconPlus, IconDelete, IconSearch } from '@arco-design/web-vue/es/icon'
```

### 手动 import

```vue
<template>
  <a-button>
    <template #icon><IconPlus /></template>
    新增
  </a-button>
</template>

<script setup lang="ts">
import { IconPlus } from '@arco-design/web-vue/es/icon'
</script>
```

### 常用图标速查

| 类别 | 常用图标 |
|---|---|
| 基础 | `IconPlus` / `IconMinus` / `IconClose` / `IconCheck` / `IconLeft` / `IconRight` / `IconUp` / `IconDown` |
| 操作 | `IconEdit` / `IconDelete` / `IconSave` / `IconCopy` / `IconExport` / `IconImport` / `IconRefresh` |
| 文件 | `IconFile` / `IconFolder` / `IconAttachment` / `IconImage` / `IconVideoCamera` |
| 用户 | `IconUser` / `IconUserGroup` / `IconLock` / `IconUnlock` / `IconRobot` |
| 导航 | `IconHome` / `IconMenu` / `IconMenuFold` / `IconMenuUnfold` / `IconList` / `IconApps` |
| 反馈 | `IconCheckCircleFill` / `IconCloseCircleFill` / `IconExclamationCircleFill` / `IconInfoCircleFill` |
| 装饰 | `IconStar` / `IconHeart` / `IconLike` / `IconShareAlt` / `IconBookmark` |

> **完整 700+ 图标列表见** [arco.design/vue/component/icon](https://arco.design/vue/component/icon)。

## 主题定制（简介）

Arco Design Vue **主题系统双轨制**——CSS Variables（运行期）+ Less 变量（编译期）：

### 方案一：CSS Variables 运行期切换（简单）

```css
:root {
  --color-primary-6: #4080ff;        /* 主色 */
  --color-text-1: #1d2129;
  --color-bg-1: #ffffff;
  /* ... */
}

/* 暗色主题 */
body[arco-theme='dark'] {
  --color-primary-6: #5489ff;
  --color-text-1: #f7f8fa;
  --color-bg-1: #17171a;
}
```

> **CSS Variables 灵活**——可以在浏览器 DevTools 实时改、与暗色 / 多主题切换天然兼容。

### 方案二：Less 变量编译期修改（深度）

```ts
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          'arcoblue-6': '#f85959',   // 主色改成红色
        },
        javascriptEnabled: true,
      },
    },
  },
})
```

> **Less 变量编译期修改**——所有用了 `@arcoblue-6` 的组件全部变色，比 CSS Variables 覆盖更彻底。**完整 Less 变量列表见**[官方主题文档](https://arco.design/vue/docs/theme)。

详细主题深度（Design Lab 在线生成 / 完整 Less 变量结构 / 多主题切换）见[指南 > 主题深度](./guide-line.md#主题深度自定义)。

## 与 Vue Router + Pinia 集成

Arco Design Vue + Vue Router + Pinia 一起使用零冲突：

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [/* ... */],
})

const pinia = createPinia()

const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <a-config-provider :locale="zhCN" :size="size">
    <a-layout style="height: 100vh;">
      <a-layout-sider :width="220" theme="dark" breakpoint="lg" collapsible>
        <a-menu
          theme="dark"
          :default-selected-keys="[activeMenu]"
          :default-open-keys="['/system']"
        >
          <a-menu-item key="/">
            <template #icon><icon-home /></template>
            <router-link to="/">仪表盘</router-link>
          </a-menu-item>

          <a-sub-menu key="/system">
            <template #icon><icon-settings /></template>
            <template #title>系统管理</template>
            <a-menu-item key="/system/users">
              <router-link to="/system/users">用户管理</router-link>
            </a-menu-item>
            <a-menu-item key="/system/roles">
              <router-link to="/system/roles">角色管理</router-link>
            </a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>

      <a-layout>
        <a-layout-header style="background: var(--color-bg-2); padding: 0 24px;">
          顶部栏
        </a-layout-header>
        <a-layout-content style="padding: 24px;">
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'

const route = useRoute()
const size = ref<'mini' | 'small' | 'medium' | 'large'>('medium')

const activeMenu = computed(() => route.path)
</script>
```

> **关键点**：
>
> 1. `<a-menu>` 用 `<a-menu-item>` / `<a-sub-menu>` **模板写法**（vs Naive UI 用 JS 数组 + render 函数）—— 更接近 Element Plus 体验
> 2. `<router-link>` 直接放 `<a-menu-item>` 内—— **无需 v-slot 包装**
> 3. **无需任何 Provider 嵌套**——直接 `<a-config-provider>` 包根即可

详细集成见[指南 > 与 Vue Router 集成](./guide-line.md#与-vue-router--pinia-集成)。

## SSR / Nuxt 3（一句话先知道）

- **Nuxt 3 项目**：v2.44.3+ 添加 `exports` 配置后**即装即用**：

  ```bash
  pnpm add @arco-design/web-vue
  ```

  在 `nuxt.config.ts` 中：

  ```ts
  export default defineNuxtConfig({
    css: ['@arco-design/web-vue/dist/arco.css'],
    build: {
      transpile: ['@arco-design/web-vue'],
    },
  })
  ```

- **Vite SSR**：标准 Vite SSR 配置 + 注意 `Modal.confirm` 等命令式 API 必须在 client 端调用（SSR 环境无 DOM）

详细 SSR + Nuxt 完整方案见[指南 > SSR + Nuxt 完整方案](./guide-line.md#ssr--nuxt-完整方案)。

## CDN 引入（无构建场景）

不用 Vite / Webpack 时（如 HTML demo / 旧项目）用 CDN：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="//unpkg.com/@arco-design/web-vue/dist/arco.css" />
  <script src="//unpkg.com/vue@3"></script>
  <script src="//unpkg.com/@arco-design/web-vue/dist/arco-vue.min.js"></script>
  <script src="//unpkg.com/@arco-design/web-vue/dist/arco-vue-icon.min.js"></script>
</head>
<body>
  <div id="app">
    <a-button type="primary" @click="handleClick">点击</a-button>
  </div>

  <script>
    const { createApp } = Vue

    const app = createApp({
      methods: {
        handleClick() {
          ArcoVue.Message.success('点击成功')
        },
      },
    })
    app.use(ArcoVue)
    app.use(ArcoVueIcon)
    app.mount('#app')
  </script>
</body>
</html>
```

> **生产环境锁版本**：将 `//unpkg.com/@arco-design/web-vue` 换成 `//unpkg.com/@arco-design/web-vue@2.58.0` —— 否则 unpkg 默认 latest、未来升级可能破坏页面。

## 下一步

到这里你已经会用 Arco Design Vue 搭建基础 Vue 3 应用了——下一步深入：

- [指南](./guide-line.md)：**60+ 组件分类速览** / **AForm 深度**（model + rules + 13+ 校验类型 + async-validator + 嵌套 path + 动态校验 + Promise 风格） / **ATable 深度**（columns 数组 + 排序 / 筛选 / 树形 / 虚拟列表 / 列固定 / 行选择 / 服务端排序） / **反馈三件套**（Modal / Message / Notification 静态 API + 声明式 v-model） / **主题深度自定义**（Less 变量 + CSS Variables + Design Lab） / **SSR + Nuxt 3 完整方案** / **TypeScript 推导** / **常见踩坑**
- [参考](./reference.md)：**API 速查** / 60+ 组件列表 / 常用 props 表 / Modal / Message / Notification 静态 API 签名 / TypeScript 类型 / 主题对象结构
