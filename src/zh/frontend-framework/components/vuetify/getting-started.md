---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Vuetify 3.x**（截至 2026 年 **v3.8+**；要求 **Vue 3.5+** + **Node 20+**，Vuetify 2 已停止活跃更新仅做 LTS 维护、Vue 2 项目继续使用 Vuetify 2.7.x）编写。

## 速查

- 系统要求：**Vue 3.5+**（推荐 3.5+） + **Node 20+** + 推荐 **TypeScript 5+** + Sass 1.79+
- 浏览器：Chrome ≥85 / Edge ≥85 / Firefox ≥79 / Safari ≥14（与 Vue 3 + ES2020 同步）
- 官方脚手架：`pnpm create vuetify` / `yarn create vuetify` / `npm create vuetify@latest` / `bun create vuetify`
- 手动安装：`pnpm add vuetify` + `pnpm add -D vite-plugin-vuetify` + `pnpm add @mdi/font`
- 必装依赖：`vuetify`（主包）+ `vite-plugin-vuetify`（自动导入）+ `@mdi/font`（图标字体）
- 创建实例：`createVuetify({ components, directives, theme })`
- 全量引入：`import * as components from 'vuetify/components'` + `import * as directives from 'vuetify/directives'`
- 按需自动：`vite-plugin-vuetify` 默认 `autoImport: true` —— 模板写 v-btn 自动导入
- 样式：`import 'vuetify/styles'`（main.ts 一次引入）
- 图标字体：`import '@mdi/font/css/materialdesignicons.css'`
- 中文 i18n：`createVuetify({ locale: { locale: 'zhHans', fallback: 'en', messages: { zhHans, en } } })`
- 暗色模式：`createVuetify({ theme: { defaultTheme: 'dark' } })` 或 `'system'` 跟随系统
- 全局默认：`createVuetify({ defaults: { VBtn: { variant: 'flat' } } })`
- 标签命名：`v-btn` / `v-text-field` 等（**所有组件以 `v-` 开头**）
- 必须根组件：`<v-app>` 包裹整个 App，Application Layout 才能工作
- Volar 智能提示：默认开启，无需额外配置
- SSR：`createVuetify({ ssr: true })` 启用、Nuxt 用 `@vuetify/nuxt-module` 零配置
- 国内镜像：`npm config set registry https://registry.npmmirror.com`

## Vuetify 是什么

Vuetify 是 **Vue 3 阵营 Material Design 组件库的事实标准**，由 **John Leider** 于 2016 年创立、目前由 **Vuetify Team** + 数百位社区贡献者维护——是「**最早、最完整、最严格遵循 Material Design 规范**」的 Vue UI 库。理解 Vuetify 必须先理解它**和 Vuetify 2 的关系**：

- **Vuetify 2**（2019-2023）：基于 **Vue 2 + Options API + Material Design 2**，国际化项目主流
- **Vuetify 3**（2023-至今）：基于 **Vue 3.x + Composition API + TypeScript + Material Design 3**，**完全重写**——API 大幅变化、Tree Shaking + 类型安全
- **核心团队**：John Leider / Heather Leider / KaelWD（核心维护者，Vue 核心团队成员）+ 数百位社区贡献者
- **截至 2026 年的 v3.8+**：处于「**稳定演进期**」——新增 `useRules` / `createDataTable` composable + 持续完善 Material Design 3 适配

Vuetify 与 Element Plus / Naive UI / Ant Design Vue 等 Vue 3 UI 库的本质差异：

| 维度 | Vuetify 3 | Element Plus | Naive UI | Ant Design Vue |
|---|---|---|---|---|
| 阵营 | Vuetify Team + 社区 | 饿了么 + 社区 | TuSimple + 社区 | Ant Design 社区 |
| 设计语言 | **Material Design 3** | 企业管理后台 | 现代极简 | Ant Design |
| 国内市场份额 | 低（移动端 + 国际化） | **断层第一** | 中（增长快） | 中 |
| 海外市场份额 | **海外最主流** | 低 | 中 | 中 |
| TypeScript | 完整类型 | 完整类型 | TS-first | 完整类型 |
| Tree Shaking | **vite-plugin-vuetify 默认** | unplugin 按需 | 按需 | 按需 |
| 主题系统 | **多主题 + useTheme** | CSS Vars + SCSS | ConfigProvider | Less Variables |
| 暗色模式 | 内置（`defaultTheme: 'dark'`） | 内置 | 内置 | 内置 |
| 组件数 | **100+** | 80+ | 90+ | 60+ |
| Bundle | ~600KB+ | ~500KB | ~250KB | ~400KB |
| 命令式 API | **无** | ElMessage / ElLoading | useMessage / useDialog | message / Modal |
| Date 适配器 | **多框架**（date-fns / luxon / dayjs） | Day.js（强绑定） | date-fns（强绑定） | Day.js（强绑定） |
| SSR | 内置 + Nuxt 模块 | Nuxt 模块 | 内置 | Nuxt 模块 |
| 中文文档 | 弱（机器翻译） | **官方完整** | 完整 | 完整 |
| 招聘市场 | 海外多、国内少 | **国内绝对主流** | 国内起步 | 国际化项目 |

**含义**：

- Vuetify **海外 Vue 3 阵营 Material 风格的事实标准**——欧美 SaaS / 企业应用大量使用
- 国内 Vuetify 主要用于：**移动端 PWA / Material 风格设计应用 / 国际化产品**
- **不适合**：国内中后台（用 Element Plus）/ 极简扁平风格（用 Naive UI / Tailwind + Headless UI）
- **适合**：严格 Material Design 设计稿 / 海外 Web / 跨平台 PWA / 设计驱动产品

## 安装与首次启动

### 方式 1：官方脚手架（推荐）

Vuetify 提供官方脚手架 `create-vuetify`——**预配置好 vite-plugin-vuetify + 主题 + 路由 + ESLint + Pinia**：

```bash
pnpm create vuetify
```

交互式菜单：

```
✔ Project name: › my-vuetify-app
✔ Which preset would you like to install? › Essentials (Vuetify + Vue Router + Pinia)
✔ Use TypeScript? › Yes
✔ Use ESLint? › Yes
✔ Would you like to install dependencies? › Yes (pnpm)
```

**预设选项**：

| 预设 | 包含 |
|---|---|
| **Essentials** | Vuetify + Vue Router + Pinia（最常用） |
| Default | Vuetify 基础 + Vue Router |
| Custom | 完全自定义（每个选项单独问） |
| Recommended | 完整推荐配置（包括 Vitest + ESLint 等） |

完成后：

```bash
cd my-vuetify-app
pnpm install
pnpm dev
```

打开 `http://localhost:3000` 看到 Vuetify 欢迎页。

### 方式 2：添加到现有 Vue 3 项目

如果你**已经有 Vue 3 + Vite 项目**，手动安装 Vuetify：

```bash
# 主包 + 自动按需插件
pnpm add vuetify
pnpm add -D vite-plugin-vuetify

# Material Design Icons 字体（9000+ 图标）
pnpm add @mdi/font
```

**包说明**：

| 包 | 用途 | 必需 |
|---|---|---|
| `vuetify` | 主组件库 | **必需** |
| `vite-plugin-vuetify` | 自动按需 + Tree Shaking | **强烈推荐** |
| `@mdi/font` | Material Design Icons 字体 | 推荐（图标用得最多） |
| `sass` | SCSS 编译（自定义主题需要） | 仅主题定制 |
| `@date-io/date-fns` | Date Adapter（v-date-picker 必需） | 仅用到日期组件 |
| `@vuetify/nuxt-module` | Nuxt 模块 | 仅 Nuxt 项目 |

Vue 版本要求：

| Vue 版本 | Vuetify 版本 |
|---|---|
| **Vue 3.5+** | **Vuetify 3.x**（推荐） |
| Vue 2.x | Vuetify 2.7.x（仅 LTS 维护、不再新增特性） |

> Vuetify 3 **已正式停止支持 Vue 2**——如果维护 Vue 2 项目，继续使用 [Vuetify 2 文档](https://v2.vuetifyjs.com/)。

### 国内镜像加速

国内网络下载 npm 包慢时配置淘宝镜像：

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm** 默认使用 npm registry——pnpm 用户同样需要配置 npmmirror。

## vite-plugin-vuetify 配置（推荐）

`vite-plugin-vuetify` 是 Vuetify 官方 Vite 插件——**默认开启自动导入 + Tree Shaking + Material Design Icons 集成**：

### vite.config.ts 配置

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    vuetify({
      autoImport: true,   // 默认 true：自动导入组件 + 指令
      styles: true,       // 默认 true：自动处理 SCSS 样式
    }),
  ],
})
```

### main.ts 配置

```ts
import { createApp } from 'vue'
import App from './App.vue'

// Vuetify 样式
import 'vuetify/styles'
// Material Design Icons 字体
import '@mdi/font/css/materialdesignicons.css'

// Vuetify 实例
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

createApp(App).use(vuetify).mount('#app')
```

> **注意**：即使开启了 `vite-plugin-vuetify` 的 `autoImport: true`，**仍然需要 `createVuetify({ components, directives })`**——插件负责按需注入 import / SCSS，但 `createVuetify` 必须知道注册哪些组件。

### vite-plugin-vuetify 的工作原理

模板：

```vue
<template>
  <v-btn color="primary" @click="show">点击</v-btn>
  <v-text-field v-model="text" label="输入" />
</template>
```

**构建时插件自动注入**：

```ts
// 自动 import 组件 + 对应 SCSS
import { VBtn } from 'vuetify/components/VBtn'
import 'vuetify/components/VBtn/VBtn.css'

import { VTextField } from 'vuetify/components/VTextField'
import 'vuetify/components/VTextField/VTextField.css'
```

> **开发者只写模板、插件自动按需 import**——这是 Vuetify Tree Shaking 的核心机制。

### autoImport 关闭场景

某些项目希望**手动管理 import**（或调试 bundle size），可以关闭：

```ts
vuetify({ autoImport: false })
```

此时必须**手动 import 每个组件**到 `createVuetify`：

```ts
import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import { VTextField } from 'vuetify/components/VTextField'
import { Ripple } from 'vuetify/directives'

const vuetify = createVuetify({
  components: { VBtn, VTextField },
  directives: { Ripple },
})
```

> **推荐保留默认** `autoImport: true`——开发体验最佳。

## 全量引入（最简单）

**适合**：小项目 / 演示 / Storybook / 不关心 bundle 大小的内部工具。一次性引入所有组件 + 所有指令：

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

createApp(App).use(vuetify).mount('#app')
```

> **全量引入 bundle**：~600KB+（gzipped 后 ~150KB）——演示场景 OK、生产推荐用 `vite-plugin-vuetify` 自动按需。

## 第一个完整示例

新建 `src/App.vue`：

```vue
<template>
  <!-- 关键：必须用 v-app 包裹整个 App -->
  <v-app>
    <!-- 顶部 App Bar -->
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>第一个 Vuetify 示例</v-app-bar-title>
      <v-spacer />
      <v-btn icon="mdi-magnify" />
      <v-btn icon="mdi-bell" />
      <v-btn :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" @click="toggleTheme" />
    </v-app-bar>

    <!-- 侧边栏 -->
    <v-navigation-drawer v-model="drawer">
      <v-list nav>
        <v-list-item prepend-icon="mdi-home" title="首页" to="/" />
        <v-list-item prepend-icon="mdi-account" title="用户" to="/users" />
        <v-list-item prepend-icon="mdi-cog" title="设置" to="/settings" />
      </v-list>
    </v-navigation-drawer>

    <!-- 主内容区 -->
    <v-main>
      <v-container>
        <v-card class="pa-6 mb-4">
          <v-card-title>表单示例</v-card-title>
          <v-card-text>
            <v-form ref="formRef" @submit.prevent="submit">
              <v-text-field
                v-model="form.name"
                label="姓名"
                :rules="[v => !!v || '姓名不能为空']"
                variant="outlined"
              />
              <v-text-field
                v-model="form.email"
                label="邮箱"
                :rules="[
                  v => !!v || '邮箱不能为空',
                  v => /.+@.+\..+/.test(v) || '邮箱格式不正确',
                ]"
                variant="outlined"
              />
              <v-btn color="primary" type="submit">提交</v-btn>
              <v-btn class="ml-2" @click="reset">重置</v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>表格示例</v-card-title>
          <v-data-table :headers="headers" :items="users" />
        </v-card>

        <!-- Snackbar 反馈 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
          {{ snackbar.text }}
        </v-snackbar>
      </v-container>
    </v-main>

    <!-- 底部 -->
    <v-footer app color="grey-lighten-3">
      <span>&copy; {{ new Date().getFullYear() }} 我的应用</span>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useTheme } from 'vuetify'

// 主题切换
const theme = useTheme()
const isDark = ref(false)
const toggleTheme = () => {
  isDark.value = !isDark.value
  theme.global.name.value = isDark.value ? 'dark' : 'light'
}

// 侧边栏开关
const drawer = ref(true)

// 表单
const formRef = ref()
const form = reactive({ name: '', email: '' })

const snackbar = reactive({ show: false, text: '', color: 'success' })

const submit = async () => {
  const { valid } = await formRef.value.validate()
  if (valid) {
    snackbar.text = `提交成功：${form.name} - ${form.email}`
    snackbar.color = 'success'
    snackbar.show = true
  } else {
    snackbar.text = '请检查表单填写'
    snackbar.color = 'error'
    snackbar.show = true
  }
}

const reset = () => {
  formRef.value.reset()
}

// 表格
const headers = [
  { title: '姓名', key: 'name' },
  { title: '年龄', key: 'age' },
  { title: '邮箱', key: 'email' },
]

const users = ref([
  { name: '张三', age: 25, email: 'zhangsan@example.com' },
  { name: '李四', age: 30, email: 'lisi@example.com' },
  { name: '王五', age: 28, email: 'wangwu@example.com' },
])
</script>
```

**这个示例覆盖了**：

- `v-app`：必须的根组件，启用 Application Layout
- `v-app-bar` / `v-navigation-drawer` / `v-main` / `v-footer`：Layout 四件套
- `v-list` / `v-list-item`：侧边栏菜单（自动配合 router-link）
- `v-card` / `v-card-title` / `v-card-text`：卡片容器
- `v-form` + `v-text-field` + `rules`：表单 + 校验
- `v-data-table`：表格（headers + items 模式）
- `v-snackbar`：消息提示
- `useTheme`：运行时主题切换
- `mdi-*` 图标字符串：所有 `icon` 属性直接传字符串

启动 `pnpm dev` 访问 `http://localhost:3000`——可以看到完整的 Vuetify Material 风格 UI。

## 中文国际化

Vuetify 默认是 **英文**——国内项目需要切换到中文。

### 内置 zh-Hans 语言包

Vuetify 内置了 **40+ 语言**，在 `createVuetify` 配置：

```ts
// main.ts
import { createVuetify } from 'vuetify'
import { zhHans, en } from 'vuetify/locale'

const vuetify = createVuetify({
  locale: {
    locale: 'zhHans',           // 当前语言
    fallback: 'en',             // 找不到 key 时回退到英文
    messages: { zhHans, en },   // 注册语言包
  },
})
```

> **生效组件**：DataTable、Pagination、DatePicker、各种内置按钮文案、ARIA 标签等。

### 运行时切换语言

用 `useLocale` composable 动态切换：

```vue
<template>
  <v-btn @click="changeLocale('zhHans')">中文</v-btn>
  <v-btn @click="changeLocale('en')">English</v-btn>
  <v-btn @click="changeLocale('ja')">日本語</v-btn>
</template>

<script setup lang="ts">
import { useLocale } from 'vuetify'

const { current } = useLocale()

const changeLocale = (locale: string) => {
  current.value = locale
}
</script>
```

> 切换后所有 Vuetify 组件文案立即更新——无需刷新。

### 支持的语言（部分）

| 语言 | 标识符 | import 路径 |
|---|---|---|
| 简体中文 | `zhHans` | `vuetify/locale` |
| 繁体中文 | `zhHant` | `vuetify/locale` |
| 英语 | `en` | `vuetify/locale` |
| 日语 | `ja` | `vuetify/locale` |
| 韩语 | `ko` | `vuetify/locale` |
| 法语 | `fr` | `vuetify/locale` |
| 德语 | `de` | `vuetify/locale` |
| 西班牙语 | `es` | `vuetify/locale` |
| 俄语 | `ru` | `vuetify/locale` |
| 阿拉伯语 | `ar` | `vuetify/locale` |

完整 40+ 语言列表见 [GitHub locale 目录](https://github.com/vuetifyjs/vuetify/tree/master/packages/vuetify/src/locale)。

### 与 vue-i18n 集成

如果项目已用 vue-i18n、希望让 Vuetify 用同一份 i18n：

```ts
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { createI18n, useI18n } from 'vue-i18n'
import { zhHans, en } from 'vuetify/locale'

// vue-i18n 实例（用户业务翻译）
const i18n = createI18n({
  legacy: false,
  locale: 'zhHans',
  fallbackLocale: 'en',
  messages: {
    zhHans: {
      $vuetify: { ...zhHans },      // 注意：Vuetify 内部翻译必须在 $vuetify 命名空间下
      hello: '你好',                 // 业务翻译
    },
    en: {
      $vuetify: { ...en },
      hello: 'Hello',
    },
  },
})

const vuetify = createVuetify({
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
})

const app = createApp(App)
app.use(i18n).use(vuetify).mount('#app')
```

> **关键**：Vuetify 内置翻译必须放在 `$vuetify` 命名空间下——这样 Vuetify 调用 `t('$vuetify.dataTable.itemsPerPageText')` 时能找到。

## 暗色模式

### 默认暗色

`createVuetify({ theme: { defaultTheme: 'dark' } })`：

```ts
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark',  // 'light' / 'dark' / 'system'
  },
})
```

> `'system'` 让 Vuetify 自动跟随 `prefers-color-scheme` 媒体查询——用户系统切换时自动同步。

### 运行时切换（useTheme）

```vue
<template>
  <v-btn @click="toggleTheme">
    <v-icon :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" />
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

const isDark = computed(() => theme.global.current.value.dark)

const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}
</script>
```

### 配合 VueUse `useDark`

实际项目中持久化用户偏好 + 跟随系统：

```bash
pnpm add @vueuse/core
```

```vue
<template>
  <v-switch v-model="isDark" hide-details inset />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useDark } from '@vueuse/core'
import { useTheme } from 'vuetify'

const isDark = useDark()
const theme = useTheme()

// 同步 useDark → Vuetify theme
watch(isDark, (value) => {
  theme.global.name.value = value ? 'dark' : 'light'
}, { immediate: true })
</script>
```

详细主题深度定制（自定义主题色 / SCSS 变量）见[指南 > Theme System](./guide-line.md#theme-system-主题系统)。

## 图标使用

Vuetify 默认使用 **Material Design Icons (MDI)**——`@mdi/font` 提供 **9000+ 图标**。

### 默认 MDI 字体图标

`main.ts` 引入字体：

```ts
import '@mdi/font/css/materialdesignicons.css'
```

模板中**所有 `icon` 属性直接传字符串**：

```vue
<template>
  <!-- 独立图标 -->
  <v-icon icon="mdi-home" />
  <v-icon icon="mdi-account" size="x-large" color="primary" />

  <!-- 按钮 icon -->
  <v-btn icon="mdi-pencil" />
  <v-btn icon="mdi-delete" color="error" />

  <!-- 输入框 icon -->
  <v-text-field prepend-inner-icon="mdi-magnify" label="搜索" />

  <!-- 列表 icon -->
  <v-list-item prepend-icon="mdi-cog" title="设置" />
</template>
```

> **比 Element Plus 简洁**：Element Plus 必须 `<el-icon><Edit /></el-icon>` 包裹、Vuetify 直接传字符串 `'mdi-pencil'`。

### 图标搜索

访问 [Material Design Icons](https://pictogrammers.com/library/mdi/) 搜索图标名——直接复制 `mdi-*` 名称使用。

### 替换图标集

如果想用其他图标库（如 Font Awesome / Material Symbols / Custom SVG）：

```ts
import { createVuetify } from 'vuetify'
import { aliases, fa } from 'vuetify/iconsets/fa-svg'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'fa',
    aliases,
    sets: { fa },
  },
})
```

支持的图标集：

| 图标集 | import 路径 | 安装 |
|---|---|---|
| MDI（默认） | `vuetify/iconsets/mdi` | `@mdi/font` |
| MDI SVG | `vuetify/iconsets/mdi-svg` | `@mdi/js` |
| Material Design | `vuetify/iconsets/md` | `material-icons` |
| Material Symbols | `vuetify/iconsets/mdi-svg`（手动） | `@mdi/svg` |
| Font Awesome | `vuetify/iconsets/fa-svg` | `@fortawesome/*` |
| FA4 | `vuetify/iconsets/fa4` | `font-awesome` |

详细自定义图标集见[指南 > Icon Sets](./guide-line.md#icon-sets-图标集自定义)。

## 全局默认值（defaults）

`createVuetify({ defaults })` 是 Vuetify 的**全局默认配置中心**——一次设置所有 `v-btn` / `v-text-field` 默认 prop：

```ts
const vuetify = createVuetify({
  defaults: {
    // 全局：所有组件
    global: {
      ripple: false,
    },

    // VBtn 默认 prop
    VBtn: {
      variant: 'flat',
      rounded: 'lg',
      color: 'primary',
    },

    // VTextField 默认 prop
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      hideDetails: 'auto',
    },

    // VCard 默认 prop
    VCard: {
      elevation: 2,
      rounded: 'lg',
    },
  },
})
```

> **效果**：之后写 `<v-btn>` 自动有 `variant="flat"` + `rounded="lg"` + `color="primary"`——**统一设计令牌**。

详细全局默认见[指南 > 全局默认值](./guide-line.md#全局默认值-defaults)。

## 与 Vue Router + Pinia 集成

Vuetify + Vue Router + Pinia 是 Vue 3 应用的「**常见三件套**」。`pnpm create vuetify` 选择 **Essentials** 预设已经预配置好：

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { zhHans, en } from 'vuetify/locale'

// 路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/HomeView.vue') },
    { path: '/users', component: () => import('./views/UsersView.vue') },
  ],
})

// Pinia
const pinia = createPinia()

// Vuetify
const vuetify = createVuetify({
  components,
  directives,
  locale: {
    locale: 'zhHans',
    fallback: 'en',
    messages: { zhHans, en },
  },
  theme: {
    defaultTheme: 'light',
  },
})

const app = createApp(App)
app.use(router)
app.use(pinia)
app.use(vuetify)
app.mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list nav>
        <!-- v-list-item 的 to 属性自动配合 router -->
        <v-list-item prepend-icon="mdi-home" title="首页" to="/" />
        <v-list-item prepend-icon="mdi-account" title="用户" to="/users" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>我的应用</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <router-view v-slot="{ Component }">
        <v-fade-transition hide-on-leave>
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const drawer = ref(true)
</script>
```

- `<v-list-item :to="/users">`：自动调用 `router.push('/users')` 实现路由跳转，**自动高亮当前路由对应菜单项**
- `<v-fade-transition>`：Vuetify 内置过渡组件，配合 `router-view` 实现页面切换动画

详细集成见[指南 > 与 Vue Router 集成](./guide-line.md#与-vue-router-集成)。

## Nuxt 集成（@vuetify/nuxt-module）

Nuxt 项目用官方 **`@vuetify/nuxt-module`** —— 零配置 SSR + 自动按需 + 主题集成：

### 安装

```bash
pnpm add vuetify
pnpm add -D @vuetify/nuxt-module
pnpm add @mdi/font
```

### nuxt.config.ts

```ts
export default defineNuxtConfig({
  modules: ['@vuetify/nuxt-module'],
  vuetify: {
    moduleOptions: {
      // 模块级配置
      styles: { configFile: 'assets/settings.scss' },
    },
    vuetifyOptions: {
      // createVuetify 选项
      theme: {
        defaultTheme: 'light',
      },
      locale: {
        locale: 'zhHans',
        fallback: 'en',
      },
    },
  },
  css: ['@mdi/font/css/materialdesignicons.css', 'vuetify/styles'],
})
```

### 自动处理

- ✅ SSR + Hydration（自动 `ssr: true`）
- ✅ Tree Shaking + 按需引入
- ✅ Vuetify SCSS 变量重写（`assets/settings.scss`）
- ✅ 主题 + i18n + Date Adapter 集成
- ✅ Vuetify Labs 自动注册

详细 Nuxt 集成见[指南 > SSR + Nuxt 集成](./guide-line.md#ssr--nuxt-集成)。

### 手动 SSR（不用 Nuxt 模块）

```ts
// plugins/vuetify.ts
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,    // 关键：启用 SSR 模式
  })

  nuxtApp.vueApp.use(vuetify)
})
```

```ts
// nuxt.config.ts
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    plugins: [vuetify({ autoImport: true })],
    vue: {
      template: { transformAssetUrls },
    },
  },
})
```

> **推荐用 `@vuetify/nuxt-module`** —— 配置更简洁、问题更少。

## 主题定制（SCSS 变量入门）

Vuetify 的颜色 / 间距 / 字号都由 SCSS 变量定义——**编译期定制**主题：

### 1. 创建 SCSS 入口

`src/styles/settings.scss`：

```scss
// 覆盖 Vuetify 的 SCSS 变量
@use 'vuetify/settings' with (
  $color-pack: false,                    // 关闭默认色板（减小 bundle）
  $body-font-family: ('Inter', sans-serif),
  $heading-font-family: ('Inter', sans-serif),
  $border-radius-root: 8px,
  $button-border-radius: 8px,
);
```

### 2. vite.config.ts 配置

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',   // 关键：指向自定义 SCSS 入口
      },
    }),
  ],
})
```

> **`styles.configFile`** 让 `vite-plugin-vuetify` 在编译 Vuetify SCSS 时优先用你的 `settings.scss`——SCSS 变量覆盖才能生效。

### 3. 主题颜色定制（运行时）

颜色主题用 `createVuetify({ theme })` 配置（不需要 SCSS）：

```ts
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'myCustomLight',
    themes: {
      myCustomLight: {
        dark: false,
        colors: {
          primary: '#1890FF',
          secondary: '#52C41A',
          error: '#F5222D',
          warning: '#FAAD14',
          info: '#1890FF',
          success: '#52C41A',
        },
      },
    },
  },
})
```

详细主题深度（多主题切换 / SCSS 变量 / CSS 变量 / `<v-theme-provider>` 局部主题）见[指南 > Theme System](./guide-line.md#theme-system-主题系统)。

## CDN 引入（无构建场景）

不用 Vite / Webpack 时（如 HTML demo / 旧项目）用 CDN：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <!-- Vuetify CSS -->
  <link href="https://cdn.jsdelivr.net/npm/vuetify@3/dist/vuetify.min.css" rel="stylesheet" />
  <!-- Material Design Icons -->
  <link href="https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css" rel="stylesheet" />
  <!-- Vue 3 -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
  <!-- Vuetify -->
  <script src="https://cdn.jsdelivr.net/npm/vuetify@3/dist/vuetify.min.js"></script>
</head>
<body>
  <div id="app">
    <v-app>
      <v-main>
        <v-container>
          <v-btn color="primary" @click="msg = '已点击'">{{ msg || '点击' }}</v-btn>
        </v-container>
      </v-main>
    </v-app>
  </div>

  <script>
    const { createApp } = Vue
    const { createVuetify } = Vuetify

    const vuetify = createVuetify()

    createApp({
      data: () => ({ msg: '' }),
    })
      .use(vuetify)
      .mount('#app')
  </script>
</body>
</html>
```

> **生产环境锁版本**：`vuetify@3` → `vuetify@3.8.0` 避免 latest 升级破坏页面。

## 下一步

到这里你已经会用 Vuetify 搭建基础 Vue 3 Material 风格应用了——下一步深入：

- [指南](./guide-line.md)：**100+ 组件分类速览** / **Form 完整方案**（v-form + 各种输入组件 + rules 校验 + 与 vee-validate / Zod 集成）/ **Data Table 深度**（client/server 模式 + Headers + Sorting + Filtering + Pagination）/ **Application Layout** 完整（v-app + v-app-bar + v-navigation-drawer + v-main + v-footer）/ **Theme System 深度**（多主题切换 + SCSS 变量 + CSS 变量 + `<v-theme-provider>`）/ **国际化 + RTL** / **Composables**（useDisplay / useTheme / useLocale / useDate / useRtl / useGoTo）/ **SSR + Nuxt 集成** / **常见踩坑**
- [参考](./reference.md)：**API 速查** / 100+ 组件列表 / 常用 props 表 / `createVuetify` 完整选项 / Theme API 类型 / Composables / Display Breakpoints / Date Adapter
