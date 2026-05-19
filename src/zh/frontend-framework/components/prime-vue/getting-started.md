---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **PrimeVue 4.x**（截至 2026 年 5 月 **v4.5.x**；要求 **Vue 3.x** + **Node 18+**，**不支持 Vue 2**——Vue 2 项目请用 PrimeVue 3.x 末版或其他 UI 库）编写。

## 速查

- 系统要求：**Vue 3.x**（推荐 3.4+） + **Node 18+** + 推荐 **TypeScript 5+**
- 浏览器：现代浏览器（Chrome / Edge / Firefox / Safari 最新两个版本），**不支持 IE**
- 安装：`pnpm add primevue @primeuix/themes primeicons`（**三个包都要装**）
- 主题包：`@primeuix/themes` 提供 **Aura / Material / Lara / Nora** 4 大预设（**v4 新路径，与 v3 不同**）
- 图标：`primeicons`（PrimeVue 官方图标库，250+ 图标 + `pi pi-*` 类前缀）
- 按需引入插件：`pnpm add -D unplugin-vue-components @primevue/auto-import-resolver`
- Nuxt 模块：`pnpm add -D @primevue/nuxt-module`（**官方维护**，社区维护的不是）
- Tailwind 插件：`pnpm add -D tailwindcss-primeui`（语义化色板工具类）
- 表单库：`pnpm add @primevue/forms`（v4.3+，含 zod / yup / valibot resolvers）
- 必装：`app.use(PrimeVue, { theme: { preset: Aura } })` 注册 + 模板中直接用 `<Button />`
- 命令式 API：`useToast` / `useConfirm` / `useDialog` —— 各自需要 `app.use(ToastService)` + 模板放占位容器
- 国内镜像：`npm config set registry https://registry.npmmirror.com`
- 组件命名：所有组件 **PascalCase** 单词（`<Button />` / `<InputText />` / `<DataTable />` / `<Select />`）

## PrimeVue 是什么

PrimeVue 是 **土耳其公司 PrimeTek**（自 2008 年起做 PrimeFaces）旗下 Vue 3 组件库——**国外 Vue UI 生态组件最丰富、欧美企业级应用最主流**的选择。理解 PrimeVue 必须先理解它的 **设计哲学**：

- **欧美主流 + 商业全家桶**：PrimeTek 同时维护 **PrimeReact / PrimeNG / PrimeFaces / PrimeVue** 全家桶——跨 React / Angular / Vue 的统一设计语言、商业模板 PrimeBlocks / PrimeAdmin / Volt UI
- **90+ 组件 + 含稀有组件**：业内组件数最多——含 **OrgChart / Galleria / TreeTable / Editor / Chart / Knob / SpeedDial / MeterGroup** 等其他 UI 库少见组件
- **PrimeVue 4 全新主题系统**：基于 [@primeuix/themes](https://github.com/primefaces/primeuix) 设计令牌（Design Token）—— `Aura` / `Material` / `Lara` / `Nora` 4 大预设 + 运行时切换 + `definePreset` 自定义
- **Styled + Unstyled 两种模式**：默认 Styled、可切到 Unstyled 配合 Tailwind 完全自由
- **PassThrough (pt) 革命**：穿透到组件任意内部 DOM 元素 —— **业内最强的 UI 库定制 API**
- **截至 2026 年的 v4.5.x**：进入「**成熟稳定期**」——v4 重写于 2024 年中、月度小版本迭代

PrimeVue 与 Element Plus / Naive UI / Vuetify 的本质差异：

| 维度 | PrimeVue | Element Plus | Naive UI | Vuetify 3 |
|---|---|---|---|---|
| 阵营 | PrimeTek（商业 + 开源） | 饿了么 + 社区 | 图森未来 + 社区 | Vuetify Team |
| 国家 | **土耳其** | 中国 | 中国 | 海外 |
| 国外市场份额 | **最高（欧美主流）** | 低 | 起步 | 高（移动端） |
| 国内市场份额 | **极低** | **断层第一** | 中（增长） | 低 |
| 组件数 | **90+（最多）** | 80+ | 90+ | 80+ |
| 稀有组件 | **OrgChart / Editor / Chart / Knob** | 较少 | 较少 | 较少 |
| 主题系统 | **Design Token + 4 大预设** | CSS Vars + SCSS | TS 对象 + CSS-in-JS | SCSS + theme prop |
| Unstyled 模式 | **✅（业内独家）** | ❌ | ❌ | ❌ |
| Tailwind 集成 | **✅ 官方 tailwindcss-primeui** | 第三方 | 第三方 | 第三方 |
| 自定义 API | **`pt` PassThrough（最强）** | CSS deep | themeOverrides | SCSS variables |
| 表单库 | **`@primevue/forms` 内置** | async-validator | async-validator | 内置 |
| 中文文档 | **❌ 仅英文** | **官方完整** | 完整 | 弱 |
| 招聘市场 | 海外 | **国内绝对主流** | 国内起步 | 海外 |

**含义**：

- PrimeVue **海外最主流、组件最多、定制最强 + Tailwind 集成最好**——是 **海外 SaaS / 跨境项目 / 重型 Dashboard / Tailwind 项目** 的最佳选择
- **不适合**：国内项目（除非有 PrimeReact 经验） / 必须中文文档 / 偏好极简设计（用 Naive UI）
- **适合**：海外 / 跨境业务 / 与 PrimeReact / PrimeNG 共栈 / 需要 90+ 组件覆盖业务 / Tailwind 重度用户 / 设计师有自由度需求 / 商业级 SaaS Dashboard

## 安装与首次启动

### 创建 Vue 3 项目

如果**还没有 Vue 3 项目**，先创建一个：

```bash
pnpm create vue@latest
# 或：npm create vue@latest / yarn create vue / bun create vue@latest
```

交互式菜单建议都选 **Yes**：

```
Add TypeScript? ... Yes
Add JSX Support? ... No
Add Vue Router for Single Page Application development? ... Yes
Add Pinia for state management? ... Yes
Add Vitest for Unit Testing? ... Yes
Add ESLint for code quality? ... Yes
```

> 完成后已有完整 Vue 3 + TS 项目骨架——下一步**单独装 PrimeVue 三件套**（create-vue 不带 PrimeVue 选项）。

### 安装 PrimeVue 三件套

```bash
# 主包 + 主题 + 图标（三个都要）
pnpm add primevue @primeuix/themes primeicons
```

| 库 | 用途 | 必需 |
|---|---|---|
| `primevue` | 主组件库（90+ 组件） | **必需** |
| `@primeuix/themes` | 主题预设（Aura / Material / Lara / Nora） | **必需**（Styled mode） |
| `primeicons` | PrimeIcons 图标包（250+ 图标） | **强烈推荐** |
| `@primevue/auto-import-resolver` | 按需引入解析器 | 推荐 |
| `unplugin-vue-components` | 按需引入插件 | 推荐 |
| `@primevue/nuxt-module` | Nuxt 模块（官方维护） | 仅 Nuxt 项目 |
| `@primevue/forms` | 表单库 + schema resolver | 仅用表单时 |
| `tailwindcss-primeui` | Tailwind 集成插件 | 仅用 Tailwind 时 |

Vue 版本要求：

| Vue 版本 | PrimeVue 版本 |
|---|---|
| **Vue 3.x** | **PrimeVue 4.x**（推荐） |
| Vue 3.x（旧项目） | PrimeVue 3.x（仍维护） |
| Vue 2.x | **不支持** |

> **`@primeuix/themes` 是 PrimeVue 4 全新主题包**——v3 是 CSS 文件（`primevue/resources/themes/...`）、v4 是设计令牌 TS 对象（`@primeuix/themes/aura`）。**v3 → v4 主题路径完全变化、不兼容**。

### 国内镜像加速

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm 用户同样需要**——pnpm 默认走 npm registry。`@primeuix/themes` / `primeicons` 等都通过 npm registry 分发。

## 第一个 PrimeVue 应用

### main.ts（极简配置）

```ts
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

// PrimeIcons CSS（必须 import 才能显示图标）
import 'primeicons/primeicons.css'

import App from './App.vue'

const app = createApp(App)

// PrimeVue 4 注册（必须传 theme.preset）
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',                          // CSS 变量前缀（默认 p）
      darkModeSelector: 'system',           // 'system' / '.my-dark' / false
      cssLayer: false,                      // 是否启用 CSS @layer
    },
  },
})

app.mount('#app')
```

> **关键概念**：
>
> 1. **`PrimeVue` plugin 必须 `app.use`**——传入 `theme.preset` 才能让组件有样式
> 2. **`@primeuix/themes/aura` 是 v4 主题路径**——v3 的 `primevue/resources/themes/aura-light-blue/theme.css` **已废弃**
> 3. **PrimeIcons CSS 必须 import**——`import 'primeicons/primeicons.css'` 否则所有 `pi pi-*` 图标都不显示
> 4. **`darkModeSelector: 'system'`** 自动跟随 OS 偏好

### App.vue（第一个组件）

```vue
<template>
  <div style="padding: 24px; max-width: 600px;">
    <h1>第一个 PrimeVue 示例</h1>

    <div style="display: flex; gap: 8px; margin-bottom: 24px;">
      <Button label="Primary" />
      <Button label="Success" severity="success" />
      <Button label="Warning" severity="warn" />
      <Button label="Danger" severity="danger" />
      <Button icon="pi pi-check" rounded />
    </div>

    <InputText v-model="value" placeholder="请输入内容" fluid />

    <div style="margin-top: 16px;">
      <p>输入：{{ value }}</p>
    </div>

    <Card style="margin-top: 24px;">
      <template #title>欢迎使用 PrimeVue</template>
      <template #content>
        <p>这是一张 PrimeVue Card 卡片示例。</p>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'

const value = ref('')
</script>
```

**这个示例覆盖**：

- `Button`：按钮 + severity 主题 + icon + rounded
- `InputText`：输入框 + v-model + fluid（占满宽度）
- `Card`：卡片 + title slot + content slot
- 手动 import：每个组件单独 `import` 来自 `primevue/<component>`

启动 `pnpm dev` —— 已经可以看到默认 Aura 主题的 PrimeVue 组件。

## 按需引入（推荐）

**适合**：所有生产项目——避免每个组件手动 import 的样板、Tree Shaking 友好：

### 安装插件

```bash
pnpm add -D unplugin-vue-components @primevue/auto-import-resolver
```

| 插件 | 作用 |
|---|---|
| `unplugin-vue-components` | 扫描模板中 `<Button>` 自动 import |
| `@primevue/auto-import-resolver` | 告诉插件 `Button` 来自 `primevue/button` |

### vite.config.ts 配置

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        PrimeVueResolver(),
      ],
    }),
  ],
})
```

### 按需引入的工作原理

配置后，所有模板中的 PrimeVue 组件自动 import：

```vue
<template>
  <Button label="登录" @click="login" />
  <InputText v-model="username" />
  <DataTable :value="rows">
    <Column field="name" header="姓名" />
  </DataTable>
</template>

<script setup>
// 不需要手动 import Button / InputText / DataTable / Column
// 插件构建时自动注入：
// import Button from 'primevue/button'
// import InputText from 'primevue/inputtext'
// import DataTable from 'primevue/datatable'
// import Column from 'primevue/column'

const username = ref('')
const rows = ref([])
const login = () => { /* ... */ }
</script>
```

> **开发者只写模板、插件自动生成 import**——按需引入的核心价值。

### 简化版 main.ts

按需引入后，main.ts 不需要再手动注册组件：

```ts
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import App from './App.vue'

const app = createApp(App)
app.use(PrimeVue, { theme: { preset: Aura } })
app.mount('#app')
```

> **比手动注册简单太多**——大型项目尤其推荐。

### TypeScript 自动生成 components.d.ts

插件自动生成 `components.d.ts`——让 Volar 知道 `<Button>` / `<InputText>` 存在：

```ts
// components.d.ts（自动生成，不要手动改）
// generated by unplugin-vue-components
declare module 'vue' {
  export interface GlobalComponents {
    Button: typeof import('primevue/button')['default']
    InputText: typeof import('primevue/inputtext')['default']
    DataTable: typeof import('primevue/datatable')['default']
    Column: typeof import('primevue/column')['default']
    // ...
  }
}
```

> **建议提交到仓库**——避免 CI 构建时第一次启动报 TS 错误。

## 主题预设选择

PrimeVue 4 内置 **4 大主题预设**——通过 `@primeuix/themes` 引入：

### Aura（推荐，PrimeTek 官方设计愿景）

```ts
import Aura from '@primeuix/themes/aura'

app.use(PrimeVue, {
  theme: { preset: Aura },
})
```

**特点**：现代企业 SaaS 风格、靛蓝主色、圆润边角、温和阴影——**PrimeVue 4 默认推荐**。

### Material（Google Material Design v2）

```ts
import Material from '@primeuix/themes/material'

app.use(PrimeVue, {
  theme: { preset: Material },
})
```

**特点**：严格遵循 Material Design 规范、紫色主色、Material 阴影曲线——适合追求 Material 严格性的项目。

### Lara（Bootstrap 风格）

```ts
import Lara from '@primeuix/themes/lara'

app.use(PrimeVue, {
  theme: { preset: Lara },
})
```

**特点**：基于 Bootstrap 设计语言、蓝色主色、扁平化——适合从 Bootstrap 迁移的项目。

### Nora（企业应用启发）

```ts
import Nora from '@primeuix/themes/nora'

app.use(PrimeVue, {
  theme: { preset: Nora },
})
```

**特点**：传统企业应用风格、紧凑布局、直角边框——适合传统 IT 企业应用。

### 4 大预设对比

| 预设 | 风格 | 主色 | 圆角 | 推荐场景 |
|---|---|---|---|---|
| **Aura**（默认） | 现代企业 SaaS | 靛蓝 | 中等圆角 | **新项目默认** |
| Material | Material Design | 紫色 | 圆润 | 严格 Material 风 |
| Lara | Bootstrap 风格 | 蓝色 | 扁平 | Bootstrap 迁移 |
| Nora | 传统企业应用 | 蓝色 | 直角 | 传统 IT 系统 |

## 中文国际化

PrimeVue 默认是 **英文** —— 国内项目必须切到中文。PrimeVue **没有内置中文 locale 数据**——需要手动定义或用社区 locale 包。

### 配置中文 locale

```ts
// main.ts
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import App from './App.vue'

const app = createApp(App)

app.use(PrimeVue, {
  theme: { preset: Aura },
  locale: {
    accept: '确认',
    reject: '取消',
    choose: '选择',
    upload: '上传',
    cancel: '取消',
    completed: '已完成',
    pending: '待处理',
    fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    dayNamesShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    dayNamesMin: ['日', '一', '二', '三', '四', '五', '六'],
    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    chooseYear: '选择年份',
    chooseMonth: '选择月份',
    chooseDate: '选择日期',
    prevDecade: '上个十年',
    nextDecade: '下个十年',
    prevYear: '上一年',
    nextYear: '下一年',
    prevMonth: '上个月',
    nextMonth: '下个月',
    prevHour: '上一小时',
    nextHour: '下一小时',
    prevMinute: '上一分钟',
    nextMinute: '下一分钟',
    prevSecond: '上一秒',
    nextSecond: '下一秒',
    am: '上午',
    pm: '下午',
    dateFormat: 'yy-mm-dd',
    firstDayOfWeek: 1,                      // 周一作为一周开始
    today: '今天',
    weekHeader: '周',
    weak: '弱',
    medium: '中',
    strong: '强',
    passwordPrompt: '请输入密码',
    emptyMessage: '无结果',
    emptyFilterMessage: '无符合的结果',
    aria: {
      // ARIA 文案（无障碍）
      trueLabel: '是',
      falseLabel: '否',
      nullLabel: '未选择',
      star: '一星评分',
      stars: '{star} 星评分',
      selectAll: '全选',
      unselectAll: '取消全选',
      close: '关闭',
      previous: '上一个',
      next: '下一个',
    },
  },
})
```

> **以上是常用 locale 字段**——完整字段列表见 [PrimeVue Locale 文档](https://primevue.org/configuration/) 或源码 [`primevue/api/PrimeVue.d.ts`](https://github.com/primefaces/primevue/blob/master/packages/primevue/src/config/PrimeVue.d.ts)。

### 动态切换语言（`usePrimeVue`）

```vue
<template>
  <Button label="切换语言" @click="toggleLocale" />
</template>

<script setup lang="ts">
import { usePrimeVue } from 'primevue/config'

const $primevue = usePrimeVue()

const toggleLocale = () => {
  // 替换整个 locale 对象
  $primevue.config.locale = $primevue.config.locale.dayNames[0] === '星期日'
    ? englishLocale
    : chineseLocale
}
</script>
```

> **`$primevue.config.locale` 是 reactive 的**——直接赋值即可触发所有组件刷新。

### 抽出 locale 模块

```ts
// src/locales/zh-cn.ts
export default {
  accept: '确认',
  reject: '取消',
  // ... 完整字段
}

// main.ts
import zhCN from './locales/zh-cn'
app.use(PrimeVue, {
  theme: { preset: Aura },
  locale: zhCN,
})
```

## 暗色模式

PrimeVue 4 暗色模式基于 **`darkModeSelector` 选择器**——通过 CSS class 触发：

### 配置 darkModeSelector

```ts
// main.ts
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.my-app-dark',         // 自定义类名
      // 或：
      // darkModeSelector: 'system',            // 跟随 OS 偏好
      // darkModeSelector: false,               // 禁用暗色模式
    },
  },
})
```

| 取值 | 行为 |
|---|---|
| `'system'`（默认） | 自动跟随 OS `prefers-color-scheme: dark` |
| `'.my-app-dark'` | 在 `<html>` / `<body>` 加该 class 时启用暗色 |
| `false` | 禁用暗色模式（强制亮色） |

### 手动切换（按钮触发）

```vue
<template>
  <Button label="切换暗色" @click="toggleDarkMode" />
</template>

<script setup lang="ts">
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('my-app-dark')
}
</script>
```

### 持久化 + 跟随系统（结合 VueUse）

```bash
pnpm add @vueuse/core
```

```vue
<script setup lang="ts">
import { watchEffect } from 'vue'
import { useDark } from '@vueuse/core'

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'my-app-dark',                   // 与 PrimeVue darkModeSelector 一致
  valueLight: '',
})

// 用户切换 isDark.value 即可
</script>

<template>
  <Button
    :label="isDark ? '亮色' : '暗色'"
    @click="isDark = !isDark"
  />
</template>
```

> **`useDark` 自动同步 `localStorage` + 系统 `prefers-color-scheme`**——比手动 toggle class 更完善。

## 图标使用

PrimeVue 默认配套图标库是 **PrimeIcons**（250+ 图标）——必须装 + import CSS：

### 安装

```bash
pnpm add primeicons
```

### import CSS

```ts
// main.ts
import 'primeicons/primeicons.css'           // ← 必须，否则图标不显示
```

### 用法（`pi pi-*` 类名）

PrimeIcons 用 **CSS 类**（不是组件）——所有图标都是 `<i class="pi pi-{name}" />`：

```vue
<template>
  <!-- 直接用 <i> -->
  <i class="pi pi-check"></i>
  <i class="pi pi-times" style="font-size: 2rem; color: red;"></i>
  <i class="pi pi-spin pi-spinner"></i>           <!-- pi-spin 旋转动画 -->

  <!-- 在 PrimeVue 组件中用 icon 属性 -->
  <Button icon="pi pi-search" label="搜索" />
  <Button icon="pi pi-trash" severity="danger" rounded />
</template>
```

### 常用图标速查

```
pi-check / pi-times / pi-plus / pi-minus
pi-search / pi-filter / pi-sort / pi-refresh
pi-user / pi-users / pi-cog / pi-home
pi-pencil / pi-trash / pi-save / pi-undo
pi-file / pi-folder / pi-download / pi-upload
pi-eye / pi-eye-slash / pi-lock / pi-unlock
pi-arrow-up / pi-arrow-down / pi-arrow-left / pi-arrow-right
pi-chevron-up / pi-chevron-down / pi-chevron-left / pi-chevron-right
pi-info-circle / pi-exclamation-triangle / pi-question-circle
pi-spin pi-spinner / pi-cloud / pi-bell / pi-envelope
```

完整列表见 [PrimeIcons 官网](https://primevue.org/icons/)。

### 自定义图标（用其他图标库）

PrimeVue 组件的 icon 部分都支持 `#icon` 模板插槽 —— 可以放 Material Icons / Font Awesome / SVG / 图片：

```vue
<template>
  <!-- 用 Font Awesome -->
  <Button>
    <template #icon>
      <i class="fa fa-github" />
    </template>
    GitHub
  </Button>

  <!-- 用 Material Icons -->
  <Button>
    <template #icon>
      <span class="material-icons">favorite</span>
    </template>
    收藏
  </Button>

  <!-- 用 SVG -->
  <Button>
    <template #icon>
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="..." />
      </svg>
    </template>
    自定义
  </Button>
</template>
```

> **大多数组件 icon 类（Select / DatePicker / Menu）支持 `#dropdownicon` / `#clearicon` / `#filtericon` 等模板**——见各组件文档 Custom Icons 章节。

## 主题定制（definePreset）

PrimeVue 4 主题系统的精髓——`definePreset` 基于预设修改、生成自定义主题：

### 基础用法

```ts
// main.ts
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',                      // 使用 primitive token 引用
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
  },
})

app.use(PrimeVue, {
  theme: { preset: MyPreset },
})
```

### 改主色到品牌色

```ts
const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',                         // 主色
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
})
```

> **完整主题深度（多 token 修改 / 暗色单独配置 / 组件级 token）见 [指南 > Theming 深度](./guide-line.md#theming-深度)**。

## 命令式 API：Toast / Confirm / Dialog

PrimeVue 的弹窗 / 提示 API 是 **Plugin + Composable + 占位容器** 三件套——比 Element Plus 全局静态方法多步、但与 Vue 3 风格一致。

### Toast 顶部消息

**main.ts 注册 ToastService**：

```ts
import ToastService from 'primevue/toastservice'
app.use(ToastService)
```

**App.vue 放占位容器**：

```vue
<template>
  <Toast />                                    <!-- 必须放、所有 Toast 显示在这里 -->
  <router-view />
</template>

<script setup>
import Toast from 'primevue/toast'
</script>
```

**子组件中使用**：

```vue
<template>
  <Button label="显示消息" @click="showSuccess" />
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const showSuccess = () => {
  toast.add({
    severity: 'success',                       // success / info / warn / error / secondary / contrast
    summary: '保存成功',
    detail: '数据已保存到服务器',
    life: 3000,                                // ms，省略 = 不自动消失
  })
}
</script>
```

### ConfirmDialog 确认对话框

**main.ts 注册 ConfirmationService**：

```ts
import ConfirmationService from 'primevue/confirmationservice'
app.use(ConfirmationService)
```

**App.vue 放占位容器**：

```vue
<template>
  <ConfirmDialog />
  <router-view />
</template>

<script setup>
import ConfirmDialog from 'primevue/confirmdialog'
</script>
```

**子组件**：

```vue
<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'

const confirm = useConfirm()

const onDelete = () => {
  confirm.require({
    message: '确定要删除？',
    header: '提示',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      // 用户点了确定
      console.log('已删除')
    },
    reject: () => {
      // 用户点了取消
      console.log('已取消')
    },
  })
}
</script>
```

### DynamicDialog 动态对话框（命令式打开 Vue 组件）

**main.ts 注册 DialogService**：

```ts
import DialogService from 'primevue/dialogservice'
app.use(DialogService)
```

**App.vue 放占位容器**：

```vue
<template>
  <DynamicDialog />
  <router-view />
</template>
```

**子组件**：

```vue
<script setup lang="ts">
import { useDialog } from 'primevue/usedialog'
import MyContent from './MyContent.vue'

const dialog = useDialog()

const open = () => {
  dialog.open(MyContent, {
    props: {
      header: '动态对话框',
      style: { width: '50vw' },
      modal: true,
    },
    data: { id: 1 },                           // 传给子组件 dialogRef.data
    onClose: (options) => {
      console.log('返回数据：', options?.data)
    },
  })
}
</script>
```

**MyContent.vue（被打开的组件）**：

```vue
<template>
  <div>
    <p>id = {{ dialogRef.data.id }}</p>
    <Button label="关闭" @click="dialogRef.close({ result: 'ok' })" />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'

const dialogRef = inject('dialogRef') as any
</script>
```

## 与 Vue Router + Pinia 集成

PrimeVue + Vue Router + Pinia 集成零冲突：

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'

import 'primeicons/primeicons.css'
import App from './App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [/* ... */],
})

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.use(PrimeVue, { theme: { preset: Aura } })
app.use(ToastService)
app.use(ConfirmationService)
app.use(DialogService)
app.mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <Toast />
  <ConfirmDialog />
  <DynamicDialog />

  <div style="display: flex; height: 100vh;">
    <aside style="width: 200px; padding: 16px; border-right: 1px solid #ddd;">
      <Menu :model="menuItems" />
    </aside>

    <main style="flex: 1; padding: 24px; overflow: auto;">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Menu from 'primevue/menu'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import DynamicDialog from 'primevue/dynamicdialog'

const router = useRouter()

const menuItems = [
  {
    label: '仪表盘',
    icon: 'pi pi-home',
    command: () => router.push('/'),
  },
  {
    label: '用户管理',
    icon: 'pi pi-users',
    command: () => router.push('/users'),
  },
]
</script>
```

> **关键点**：
>
> 1. `<Toast />` / `<ConfirmDialog />` / `<DynamicDialog />` 必须放在 App.vue 才能用对应 `useToast` / `useConfirm` / `useDialog`
> 2. `Menu` 用 `model` JS 数组 + `command` 回调（不是 RouterLink）
> 3. **图标用 PrimeIcons 类**（`icon: 'pi pi-home'`）

详细集成见 [指南 > 与 Vue Router + Pinia 集成](./guide-line.md#与-vue-router--pinia-集成)。

## Nuxt 集成（推荐用官方模块）

Nuxt 项目用 **官方维护的 `@primevue/nuxt-module`**：

```bash
pnpm add primevue @primeuix/themes primeicons
pnpm add -D @primevue/nuxt-module
```

`nuxt.config.ts`：

```ts
import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  modules: ['@primevue/nuxt-module'],
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.my-app-dark',
        },
      },
    },
  },
  css: [
    'primeicons/primeicons.css',                  // PrimeIcons CSS
  ],
})
```

**Nuxt 模块自动**：

- 注册 PrimeVue Plugin（不用自己 `app.use`）
- 自动按需引入组件（不用自己装 unplugin）
- 自动按需引入 directives（如 `v-tooltip` / `v-ripple`）
- 自动 SSR 处理

**Nuxt 项目中直接用**：

```vue
<!-- pages/index.vue -->
<template>
  <Button label="点击" />
  <DataTable :value="rows">
    <Column field="name" header="姓名" />
  </DataTable>
</template>

<script setup>
const rows = ref([])
</script>
```

> **`@primevue/nuxt-module` 是 PrimeVue 团队官方维护**——与 `nuxtjs-naive-ui`（社区维护）不同。**Nuxt 项目首选 PrimeVue 的理由之一**。

## CDN 引入（无构建场景）

不用 Vite / Webpack 时（HTML demo / 旧项目）用 CDN：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <!-- Vue 3 -->
  <script src="//unpkg.com/vue@3"></script>
  <!-- PrimeVue -->
  <script src="//unpkg.com/primevue/umd/primevue.min.js"></script>
  <script src="//unpkg.com/@primeuix/themes/umd/aura.min.js"></script>
  <!-- PrimeIcons CSS -->
  <link rel="stylesheet" href="//unpkg.com/primeicons/primeicons.css" />
</head>
<body>
  <div id="app">
    <p-button label="点击" @click="handleClick"></p-button>
  </div>

  <script>
    const { createApp } = Vue

    createApp({
      methods: {
        handleClick() {
          alert('clicked')
        },
      },
    })
      .use(primevue.config.default, {
        theme: { preset: PrimeUIX.Themes.Aura },
      })
      .component('p-button', primevue.button)
      .mount('#app')
  </script>
</body>
</html>
```

> **生产环境锁版本**：将 `//unpkg.com/primevue` 换成 `//unpkg.com/primevue@4.5.0/`——否则 unpkg 默认 latest、未来升级可能破坏页面。

## TypeScript 基础

PrimeVue 4 完整 TypeScript 支持——所有组件 props / 事件 / slot 都有类型：

### 组件 props 类型

```vue
<script setup lang="ts">
import Button from 'primevue/button'
import type { ButtonProps } from 'primevue/button'

const buttonProps: ButtonProps = {
  label: '登录',
  severity: 'primary',
  size: 'small',
  rounded: true,
  disabled: false,
}
</script>

<template>
  <Button v-bind="buttonProps" />
</template>
```

### Form 实例类型

```ts
import type { FormSubmitEvent } from '@primevue/forms'

const onSubmit = (event: FormSubmitEvent) => {
  if (event.valid) {
    console.log('表单值：', event.values)
  } else {
    console.log('错误：', event.errors)
  }
}
```

### DataTable 行类型

```ts
import type { DataTableProps, DataTablePageEvent } from 'primevue/datatable'

interface User {
  id: number
  name: string
  age: number
}

const users = ref<User[]>([])

const onPage = (event: DataTablePageEvent) => {
  console.log('页码：', event.page)
}
```

## 下一步

到这里你已经会用 PrimeVue 搭建基础 Vue 3 应用了——下一步深入：

- [指南](./guide-line.md)：**90+ 组件按 10 大类速览** / **Form 组件深度**（InputText / Select / MultiSelect / DatePicker + `@primevue/forms` Zod / Yup 集成） / **DataTable 重磅深度**（基础 + 分页 + 排序 + 筛选 + 选择 + 行展开 + 行编辑 + lazy load + virtual scroll） / **Theming 4 大预设 + `definePreset` 深度** / **Styled vs Unstyled Mode** / **Tailwind 集成 + `tailwindcss-primeui`** / **PassThrough (`pt`) 深度** / **`useToast` / `useConfirm` / `useDialog` 完整 API** / **常见踩坑**
- [参考](./reference.md)：**API 速查** / 90+ 组件分组列表 / 常用 props 表 / Plugin 配置选项 / `@primeuix/themes` 4 大预设 / `definePreset` API / `useToast` 等签名 / TypeScript 类型 / `tailwindcss-primeui` 工具类
