---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Naive UI 2.x**（截至 2026 年 **v2.44.1**，发布于 2026 年 3 月；要求 **Vue 3.x** + **Node 18+**，**不支持 Vue 2**——Vue 2 项目需选其他 UI 库）编写。

## 速查

- 系统要求：**Vue 3.x**（推荐 3.4+） + **Node 18+** + 推荐 **TypeScript 5+**
- 浏览器：现代浏览器（Chrome / Edge / Firefox / Safari 最新两个版本），**不支持 IE**
- 安装：`pnpm add naive-ui` / `npm i naive-ui` / `yarn add naive-ui`
- 字体（可选）：`pnpm add vfonts`（推荐的字体包，包含 Inter / Fira Code）
- 图标（可选）：`pnpm add @vicons/ionicons5`（最常用，Discord 风格）/ `@vicons/antd` / `@vicons/carbon` / `@vicons/fa` 等
- 按需引入插件：`pnpm add -D unplugin-vue-components unplugin-auto-import`
- 全量引入：模板中直接用 `<n-button>` 等（自动按需引入更推荐）
- **必须**：`<n-config-provider>` 包根组件（locale / theme / themeOverrides 全部从这里注入）
- 中文 i18n：`import { zhCN, dateZhCN } from 'naive-ui'` + `:locale="zhCN" :date-locale="dateZhCN"`
- 暗色模式：`import { darkTheme } from 'naive-ui'` + `:theme="darkTheme"`
- 跟随系统：`useOsTheme()` 返回响应式 `'light' | 'dark'`
- 组件命名：所有组件以 `N` 开头（PascalCase）或 `n-` 开头（kebab-case）——`<NButton>` / `<n-button>`
- API 命名：`useMessage` / `useDialog` / `useNotification` / `useLoadingBar` 是 Composable，**必须在 setup 内调用**
- Provider 模式：用 Message / Dialog 等需要包裹对应 Provider（`<n-message-provider>` 等）
- 国内镜像：`npm config set registry https://registry.npmmirror.com`

## Naive UI 是什么

Naive UI 是 **图森未来（TuSimple，TUSEN AI）** 前端团队 07akioni 等人于 **2020 年 9 月** 开源的 **Vue 3 设计驱动 UI 组件库**——是 Vue 3 生态中**最现代、最 TS-first** 的主流选择，被 **Vue 作者尤雨溪公开推荐**。理解 Naive UI 必须先理解它的**设计哲学**：

- **TypeScript-first**：源码 68.7% TS + 30.9% Vue（无 JS）——**首个 100% TypeScript 编写的主流 Vue 3 UI 库**，无需 `@types/*` 包
- **主题即对象**：主题就是 TS 对象（`GlobalThemeOverrides`）——**不需要 CSS / SCSS 预处理器、不需要 CSS 变量、不需要重新编译**，运行时动态切换主题
- **Provider Pattern**：所有全局配置（locale / theme / Message API 等）通过 `<n-config-provider>` 等 Provider 注入——**类似 React Context、不污染全局**
- **Composable 命令式 API**：`useMessage` / `useDialog` / `useNotification` / `useLoadingBar`——**Vue 3 风格、与 Composition API 一致**（vs Element Plus 全局静态 `ElMessage.success(...)`）
- **截至 2026 年的 v2.44.x**：处于「**积极迭代期**」——v2.44 在 2026 年 3 月发布、相比 Element Plus 进入稳定平台仍非常活跃

Naive UI 与 Element Plus / Vuetify / Ant Design Vue 等 Vue 3 UI 库的本质差异：

| 维度 | Naive UI | Element Plus | Ant Design Vue | Vuetify 3 |
|---|---|---|---|---|
| 阵营 | 图森未来 + 社区 | 饿了么 + 社区 | Ant Design 社区 | Vuetify Team |
| 作者背书 | **尤雨溪推荐** | — | — | — |
| 设计语言 | **Discord 现代极简** | 企业管理后台 | Ant Design | Material Design |
| 国内市场份额 | 中（增长快） | **断层第一** | 中（国际化好） | 低 |
| TypeScript | **100% TS 编写** | 完整类型 | 完整类型 | 完整类型 |
| 主题系统 | **TS 对象 + CSS-in-JS** | CSS Vars + SCSS | Less Variables | SCSS + theme prop |
| 暗色模式 | 内置（`darkTheme`） | 内置 | 内置 | 内置 |
| 组件数 | 90+ | 80+ | 60+ | 80+ |
| Bundle | **~250KB**（Tree Shaking 好） | ~500KB+ | ~400KB | ~600KB |
| SSR | 内置 + Nuxt 模块 | Nuxt 模块 | Nuxt 模块 | 内置 |
| 中文文档 | 完整 | **官方完整** | 完整 | 弱 |
| 招聘市场 | 起步增长 | **国内绝对主流** | 国际化项目多 | 海外多 |

**含义**：

- Naive UI **设计品质 + TS 严格性 + 现代主题系统更先进**——是 **追求设计 / TS 严格性 / 新项目**的最佳选择
- **不适合**：必须用 Element Plus 招聘市场 / 接手已有 Element Plus 项目 / 需要严格 Material Design 风（用 Vuetify）/ 移动端 H5（用 Vant）
- **适合**：设计驱动的 C 端产品 / 希望摆脱「企业气」的 B 端 / 追求 TS 严格的新项目 / 与设计师密切协作的团队 / **想试试尤雨溪推荐的 Vue 3 UI 库**

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

> 完成后已有完整 Vue 3 + TS 项目骨架——下一步**单独装 Naive UI**（create-vue 不带 Naive UI 选项）。

### 安装 Naive UI

```bash
# 主包
pnpm add naive-ui

# 推荐字体（可选但官方推荐）
pnpm add vfonts

# 图标包（强烈推荐 ionicons5，Discord 风格）
pnpm add @vicons/ionicons5
```

| 库 | 用途 | 必需 |
|---|---|---|
| `naive-ui` | 主组件库 | **必需** |
| `vfonts` | 推荐字体（Inter / Fira Code） | 可选（但官方推荐） |
| `@vicons/ionicons5` | Discord 风格图标 | 可选（推荐） |
| `@vicons/antd` / `@vicons/fa` / `@vicons/carbon` | 其他图标集 | 可选 |
| `unplugin-vue-components` | 按需引入组件 | 推荐 |
| `unplugin-auto-import` | 按需引入 Composable | 推荐 |
| `nuxtjs-naive-ui` | Nuxt 模块 | 仅 Nuxt 项目 |

Vue 版本要求：

| Vue 版本 | Naive UI 版本 |
|---|---|
| **Vue 3.x** | **Naive UI 2.x**（推荐） |
| Vue 2.x | **不支持** |

> Naive UI **从未支持 Vue 2**——Vue 2 项目请选 Element UI / iView / Vuetify 2。

### 国内镜像加速

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm 用户同样需要**——pnpm 默认走 npm registry。

## 第一个 Naive UI 应用

### main.ts（极简）

```ts
import { createApp } from 'vue'

// 推荐字体（可选）
import 'vfonts/Lato.css'           // Lato 字体（推荐）
import 'vfonts/FiraCode.css'       // Fira Code（代码字体）

import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```

> **注意**：Naive UI **不用 `app.use(...)` 注册**——直接在模板中使用即可（按需引入推荐，见下一节）。

### App.vue（必须 NConfigProvider 包根）

```vue
<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <router-view />
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, NLoadingBarProvider, zhCN, dateZhCN } from 'naive-ui'
</script>
```

> **关键概念 Provider Pattern**：
>
> 1. **`<n-config-provider>` 必须包根**——所有 Naive UI 组件都必须是它的子孙，否则**主题 / locale 不生效**
> 2. **`<n-message-provider>` 提供 `useMessage()`**——不包就报错 `useMessage must be called inside a setup of a child of n-message-provider`
> 3. **同理 Dialog / Notification / LoadingBar Provider**——只在需要对应 API 时才包
> 4. **嵌套顺序无所谓**——但**习惯把 NConfigProvider 放最外层**

按需引入会让这个 `App.vue` 自动 import 这些组件（见下文）。

### HelloNaive.vue（第一个组件示例）

```vue
<template>
  <div style="padding: 24px;">
    <h1>第一个 Naive UI 示例</h1>

    <n-space>
      <n-button type="primary" @click="showMessage">显示消息</n-button>
      <n-button type="success" @click="showDialog">显示对话框</n-button>
    </n-space>

    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      label-width="80"
      style="margin-top: 24px; max-width: 400px;"
    >
      <n-form-item label="姓名" path="name">
        <n-input v-model:value="form.name" placeholder="请输入姓名" />
      </n-form-item>

      <n-form-item label="邮箱" path="email">
        <n-input v-model:value="form.email" placeholder="请输入邮箱" clearable />
      </n-form-item>

      <n-form-item>
        <n-button type="primary" attr-type="button" @click="submit">
          提交
        </n-button>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  NSpace, NButton, NForm, NFormItem, NInput,
  useMessage, useDialog,
  type FormInst, type FormRules,
} from 'naive-ui'

// 命令式 API（必须在 setup 内调用）
const message = useMessage()
const dialog = useDialog()

// 表单
const formRef = ref<FormInst | null>(null)
const form = reactive({
  name: '',
  email: '',
})

// 校验规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'input'] },
  ],
}

// 提交
const submit = (e: MouseEvent) => {
  e.preventDefault()
  formRef.value?.validate((errors) => {
    if (!errors) {
      message.success(`提交成功：${form.name} - ${form.email}`)
    } else {
      message.error('请检查表单填写')
    }
  })
}

// 弹窗
const showMessage = () => {
  message.success('这是一条消息')
}

const showDialog = () => {
  dialog.warning({
    title: '提示',
    content: '确定要执行该操作吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      message.success('已确认')
    },
    onNegativeClick: () => {
      message.info('已取消')
    },
  })
}
</script>
```

**这个示例覆盖**：

- `<n-button>`：基础按钮 + type 主题
- `<n-form>` / `<n-form-item>` / `<n-input>`：表单 + 校验（async-validator）
- `useMessage()`：命令式消息 API（Composable）
- `useDialog()`：命令式对话框 API（Composable）
- TypeScript 类型：`FormInst` / `FormRules`

启动 `pnpm dev` 访问对应路由——可以看到完整的 Naive UI UI。

## 按需引入（推荐）

**适合**：所有生产项目——Tree Shaking + 自动 import，**bundle 比 Element Plus 同等场景小 ~50%**：

### 安装插件

```bash
pnpm add -D unplugin-vue-components unplugin-auto-import
```

| 插件 | 作用 |
|---|---|
| `unplugin-vue-components` | 扫描模板中 `<n-button>` 自动 import `NButton` |
| `unplugin-auto-import` | 扫描代码中 `useMessage` / `useDialog` 等自动 import |

### vite.config.ts 配置

```ts
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      // 自动 import Vue + Naive UI Composable
      imports: [
        'vue',
        {
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar',
            'useOsTheme',
          ],
        },
      ],
    }),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
  ],
})
```

### 按需引入的工作原理

```vue
<template>
  <n-button @click="handleClick">点击</n-button>
</template>

<script setup>
const message = useMessage()
const handleClick = () => {
  message.success('成功')
}
</script>
```

**构建时插件自动转换为**：

```vue
<script setup>
// unplugin-vue-components 自动注入：
import { NButton } from 'naive-ui'

// unplugin-auto-import 自动注入：
import { useMessage } from 'naive-ui'

const message = useMessage()
const handleClick = () => {
  message.success('成功')
}
</script>
```

> **开发者只写少量代码、插件自动生成 import**——这是按需引入的核心价值。

### TypeScript 自动生成 d.ts

两个插件自动生成的 `.d.ts` 文件：

- `src/components.d.ts`：所有按需 import 的组件类型（让 Volar 知道 `<NButton>` 存在）
- `src/auto-imports.d.ts`：所有按需 import 的 Composable 类型

> **建议提交到仓库** —— 避免 CI 构建时第一次启动报 TS 错误。

### Webpack 配置（Vue CLI 项目）

```js
// vue.config.js
const AutoImport = require('unplugin-auto-import/webpack').default
const Components = require('unplugin-vue-components/webpack').default
const { NaiveUiResolver } = require('unplugin-vue-components/resolvers')

module.exports = {
  configureWebpack: {
    plugins: [
      AutoImport({
        imports: [
          'vue',
          { 'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'] },
        ],
      }),
      Components({ resolvers: [NaiveUiResolver()] }),
    ],
  },
}
```

## 直接 import（手动按需）

不用按需插件时——每个组件 + Composable 手动 import：

```vue
<template>
  <n-config-provider :theme="darkTheme" :locale="zhCN" :date-locale="dateZhCN">
    <n-space vertical>
      <n-input />
      <n-date-picker />
    </n-space>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  NConfigProvider, NInput, NDatePicker, NSpace,
  darkTheme,
  zhCN, dateZhCN,
} from 'naive-ui'
</script>
```

> **Tree Shaking 友好**——只 import 用到的、bundle 不会包含其他组件。

## 中文国际化

Naive UI 默认是 **英文**——国内项目必须切到中文。**locale 分两个**：

- `zhCN`：组件文案（按钮 / 表格 / 分页器等）
- `dateZhCN`：日期组件本地化（date-fns 中文 locale）

### 配置中文

```vue
<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import { zhCN, dateZhCN } from 'naive-ui'
</script>
```

> **`:date-locale="dateZhCN"` 不能省**——否则 DatePicker 中的星期 / 月份名仍是英文。

### 动态切换语言

```vue
<template>
  <n-config-provider :locale="currentLocale" :date-locale="currentDateLocale">
    <n-button @click="toggleLang">切换语言：{{ currentLang }}</n-button>
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'

const currentLang = ref<'zh' | 'en'>('zh')

const currentLocale = computed(() => (currentLang.value === 'zh' ? zhCN : enUS))
const currentDateLocale = computed(() => (currentLang.value === 'zh' ? dateZhCN : dateEnUS))

const toggleLang = () => {
  currentLang.value = currentLang.value === 'zh' ? 'en' : 'zh'
}
</script>
```

### 支持的语言

Naive UI 内置 **30+ 语言包**：

| 语言 | locale | dateLocale |
|---|---|---|
| 简体中文 | `zhCN` | `dateZhCN` |
| 繁体中文（台湾） | `zhTW` | `dateZhTW` |
| 英文 | `enUS` | `dateEnUS`（默认） |
| 日文 | `jaJP` | `dateJaJP` |
| 韩文 | `koKR` | `dateKoKR` |
| 法文 | `frFR` | `dateFrFR` |
| 德文 | `deDE` | `dateDeDE` |
| 西班牙文 | `esAR` | `dateEsAR` |
| 俄文 | `ruRU` | `dateRuRU` |
| 阿拉伯文 | `arDZ` | `dateArDZ` |

完整列表见 [GitHub locales 目录](https://github.com/tusen-ai/naive-ui/tree/main/src/locales)。

## 暗色模式

### 一行启用

```vue
<template>
  <n-config-provider :theme="darkTheme">
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme } from 'naive-ui'
</script>
```

> **`:theme="null"` 是亮色（默认）**，`:theme="darkTheme"` 是暗色——**所有组件自动切换、无需额外 CSS 或类名**（vs Element Plus 需要 import 暗色 CSS + 加 `<html class="dark">`）。

### 用户切换 + 跟随系统

Naive UI 内置 `useOsTheme()` Composable——**直接返回响应式 OS 主题**：

```vue
<template>
  <n-config-provider :theme="currentTheme">
    <n-switch v-model:value="isDark">
      <template #checked>暗</template>
      <template #unchecked>亮</template>
    </n-switch>
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { darkTheme, useOsTheme } from 'naive-ui'

// 跟随系统：默认与 OS 一致
const osTheme = useOsTheme()                       // 响应式 'light' | 'dark'
const isDark = ref(osTheme.value === 'dark')

// 用户切换：覆盖 OS 设置
const currentTheme = computed(() => (isDark.value ? darkTheme : null))
</script>
```

> **`useOsTheme()` 监听 `prefers-color-scheme: dark`**——OS 主题变化时自动响应。

### 持久化（结合 VueUse）

如果想把用户选择保存到 `localStorage`：

```bash
pnpm add @vueuse/core
```

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useDark } from '@vueuse/core'
import { darkTheme } from 'naive-ui'

const isDark = useDark()  // 自动同步 localStorage + 系统主题

const currentTheme = computed(() => (isDark.value ? darkTheme : null))
</script>
```

## 图标使用

Naive UI **不内置图标**——必须从 [xicons](https://github.com/07akioni/xicons) 系列中选一个图标集：

| 包名 | 风格 | 推荐场景 |
|---|---|---|
| `@vicons/ionicons5` | **Discord 风格**（圆润现代） | **Naive UI 默认推荐** |
| `@vicons/antd` | Ant Design 风格 | 与 Antd 设计一致 |
| `@vicons/material` | Material Design | 严格 Material |
| `@vicons/fa` | Font Awesome 6 | 通用经典 |
| `@vicons/fluent` | Microsoft Fluent | 微软风 |
| `@vicons/carbon` | IBM Carbon | 企业稳重 |
| `@vicons/tabler` | Tabler | 简洁线条 |

### 安装

```bash
pnpm add @vicons/ionicons5
```

### 用法

`<n-icon>` 包裹具体图标组件：

```vue
<template>
  <n-icon size="20" color="#1890ff">
    <CloudUploadOutline />
  </n-icon>

  <n-button type="primary">
    <template #icon>
      <n-icon><AddOutline /></n-icon>
    </template>
    新增
  </n-button>
</template>

<script setup lang="ts">
import { NIcon, NButton } from 'naive-ui'
import { CloudUploadOutline, AddOutline } from '@vicons/ionicons5'
</script>
```

> **每个图标都是独立组件**——支持 Tree Shaking，按需 import。

### 多图标集混用

可以同时装多个图标包：

```vue
<script setup lang="ts">
import { CloudUploadOutline } from '@vicons/ionicons5'  // Ionicons 风格
import { Github } from '@vicons/fa'                     // Font Awesome 风格
import { Search24Filled } from '@vicons/fluent'         // Fluent 风格
</script>
```

## 主题定制（GlobalThemeOverrides）

Naive UI 主题就是 **纯 TS 对象** —— **不需要 SCSS / CSS 变量、不需要重新编译**：

### 基础用法

```vue
<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1890ff',           // 主色（Ant Design 蓝）
    primaryColorHover: '#40a9ff',
    primaryColorPressed: '#096dd9',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#f5222d',
    borderRadius: '8px',               // 全局圆角
  },
  Button: {
    textColor: '#1890ff',
    fontWeight: '500',
  },
  Input: {
    borderHover: '#1890ff',
  },
}
</script>
```

> **运行时切换主题**：把 `themeOverrides` 改成 ref / computed —— **整个 App 瞬间换主题、零 CSS 重排**。

### 嵌套组件主题（peers）

某些组件包含其他组件（例如 Select 内部用 InternalSelection）—— 用 `peers` 定制：

```ts
const themeOverrides: GlobalThemeOverrides = {
  Select: {
    peers: {
      InternalSelection: {
        textColor: '#FF0000',
      },
      InternalSelectMenu: {
        borderRadius: '6px',
      },
    },
  },
  DataTable: {
    paginationMargin: '40px 0 0 0',
    peers: {
      Empty: {
        textColor: '#ccc',
      },
      Pagination: {
        itemTextColor: '#ccc',
      },
    },
  },
}
```

详细主题深度（暗色定制 / 多主题切换 / 完整 themeOverrides 结构）见[指南 > 主题深度](./guide-line.md#主题深度自定义)。

## 与 Vue Router + Pinia 集成

Naive UI + Vue Router + Pinia 一起使用零冲突：

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// 字体（可选）
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'

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
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme="currentTheme">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <n-layout has-sider style="height: 100vh;">
              <n-layout-sider width="200" bordered>
                <n-menu :options="menuOptions" :value="activeMenu" />
              </n-layout-sider>
              <n-layout-content>
                <router-view />
              </n-layout-content>
            </n-layout>
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { NIcon, type MenuOption, zhCN, dateZhCN, darkTheme, useOsTheme } from 'naive-ui'
import { HomeOutline, PersonOutline } from '@vicons/ionicons5'

const route = useRoute()
const osTheme = useOsTheme()
const currentTheme = computed(() => (osTheme.value === 'dark' ? darkTheme : null))

const activeMenu = computed(() => route.name as string)

// Naive UI 菜单用 options 数组（不是 slot）
const menuOptions: MenuOption[] = [
  {
    label: () => h(RouterLink, { to: { name: 'dashboard' } }, () => '仪表盘'),
    key: 'dashboard',
    icon: () => h(NIcon, null, () => h(HomeOutline)),
  },
  {
    label: () => h(RouterLink, { to: { name: 'users' } }, () => '用户管理'),
    key: 'users',
    icon: () => h(NIcon, null, () => h(PersonOutline)),
  },
]
</script>
```

> **关键点**：
>
> 1. `<n-menu>` 用 `options` JS 数组（不是 `<n-menu-item>` 模板写法）—— 文本 / 图标都用 render 函数
> 2. `RouterLink` 用 `h()` 渲染——`label: () => h(RouterLink, ...)`
> 3. **必须包 4 个 Provider**——message / dialog / notification / loadingBar

详细集成见[指南 > 与 Vue Router 集成](./guide-line.md#与-vue-router--pinia-集成)。

## SSR / Nuxt（一句话先知道）

- **Nuxt 项目**：用 [nuxtjs-naive-ui](https://github.com/07akioni/nuxtjs-naive-ui) 模块，**一行集成 + 自动处理 hydration**：

  ```bash
  npx nuxi module add nuxtjs-naive-ui
  ```

- **Vite SSR / SSG**：需要手动配 `@css-render/vue3-ssr` 收集 critical CSS——详细见[指南 > SSR 完整方案](./guide-line.md#ssr--nuxt-完整方案)

## CDN 引入（无构建场景）

不用 Vite / Webpack 时（如 HTML demo / 旧项目）用 CDN：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <script src="//unpkg.com/vue@3"></script>
  <script src="//unpkg.com/naive-ui"></script>
</head>
<body>
  <div id="app">
    <n-config-provider>
      <n-button type="primary" @click="handleClick">点击</n-button>
    </n-config-provider>
  </div>

  <script>
    const { createApp } = Vue
    const { NConfigProvider, NButton } = naive

    createApp({
      components: { NConfigProvider, NButton },
      methods: {
        handleClick() {
          alert('clicked')
        },
      },
    }).mount('#app')
  </script>
</body>
</html>
```

> **生产环境锁版本**：将 `//unpkg.com/naive-ui` 换成 `//unpkg.com/naive-ui@2.44.1/` —— 否则 unpkg 默认 latest、未来升级可能破坏页面。

## 下一步

到这里你已经会用 Naive UI 搭建基础 Vue 3 应用了——下一步深入：

- [指南](./guide-line.md)：**90+ 组件分类速览** / **NForm 深度**（path 嵌套 + 动态校验 + Promise 风格） / **NDataTable 深度**（columns 数组 + 排序 / 筛选 / 树形 / 虚拟滚动） / **反馈四件套**完整 API（useMessage / useDialog / useNotification / useLoadingBar） / **主题深度自定义** / **createDiscreteApi 脱离 Provider** / **SSR + Nuxt 完整方案** / **常见踩坑**
- [参考](./reference.md)：**API 速查** / 90+ 组件列表 / 常用 props 表 / Composable 签名 / TypeScript 类型 / 主题对象结构
