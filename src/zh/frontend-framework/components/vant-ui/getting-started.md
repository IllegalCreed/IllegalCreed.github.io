---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Vant 4.x**（截至 2026 年 **v4.9.24+**；要求 **Vue 3.x** + **Node 18+**，已正式停止支持 Vue 2、Vue 2 项目请继续使用 Vant 2.x；Vue 3 + Vant 3 也已停止维护，仅修复严重 Bug）编写。

## 速查

- 系统要求：**Vue 3.x**（推荐 3.4+） + **Node 18+** + 推荐 **TypeScript 5+**（可选）
- 浏览器：Chrome ≥51 / iOS ≥10.0 / Android ≥5.0（与 Vue 3 + ES2017 同步）
- 安装：`pnpm add vant` / `npm i vant` / `yarn add vant` / `bun add vant`
- 按需插件：`pnpm add -D @vant/auto-import-resolver unplugin-vue-components unplugin-auto-import`
- Nuxt 模块：`pnpm add -D @vant/nuxt`
- 桌面端调试：`pnpm add @vant/touch-emulator`（PC 端调试或部署）
- 全量引入：`app.use(Vant)` + `import 'vant/lib/index.css'`（main.ts 一次性引入）
- 全量注册时 Lazyload 指令需单独 `app.use(vant.Lazyload)`
- 按需引入：`unplugin-vue-components/vite` + `VantResolver` 自动 import 组件 + 自动注入 CSS
- 命令式 API 按需：`unplugin-auto-import/vite` + `VantResolver` 自动 import `showToast` / `showDialog` / `showNotify` 等
- 标签命名：`van-button` / `van-cell` 等（**所有组件以 `van-` 开头**）
- 中文 i18n：**默认即中文**，无需配置（与 Element Plus 不同）
- 切换其他语言：`import enUS from 'vant/es/locale/lang/en-US'` + `Locale.use('en-US', enUS)`
- 深色模式：`van-config-provider` 组件加 `theme="dark"` 属性包裹根组件
- 主题定制：`van-config-provider` 组件加 `:theme-vars="{ buttonPrimaryBackground: '#07c160' }"` 或 `:root { --van-primary-color: #07c160; }`
- 全局配置：`van-config-provider` 组件加 `:theme-vars="..." :theme="theme" tag="div"` 属性包裹整个 App
- Volar 智能提示：默认开启（Vue 3.x 项目用 Vue - Official 插件即可）
- 国内镜像：`npm config set registry https://registry.npmmirror.com`
- 移动端 Rem 适配：`postcss-pxtorem` + `lib-flexible`
- 移动端 vw 适配：`postcss-px-to-viewport`
- iPhone 安全区：`van-tabbar` 组件加 `safe-area-inset-bottom` 属性

## Vant 是什么

Vant 是 **有赞前端团队**主导、**社区维护**的 **Vue 3 移动端 H5 组件库**，是 Vue 2 时代国内最流行的 **Vant 2**（Mint UI 退役后的事实接班人）的 Vue 3 后继者。理解 Vant 必须先理解它**和 Vant 2 / Vant 3 的关系**：

- **Vant 1**（2018-2019）：基于 **Vue 2 + Options API**，初代版本，**已停止维护**
- **Vant 2**（2019-2022）：基于 **Vue 2 + Options API**，国内 Vue 2 移动端 H5 市场**断层第一**，**已停止接受 PR、仅做安全维护**
- **Vant 3**（2020-2022）：基于 **Vue 3 + Composition API**，Vue 3 初代版本，**已停止接受 PR**——直接升级到 Vant 4
- **Vant 4**（2022-至今）：基于 **Vue 3.x + TypeScript** 完全重写，**长期支持版本**——API 与 Vant 3 高度兼容、新增暗色模式 / 业务组件 / TS 类型完善
- **核心团队**：**chenjiahan**（Vant 创始人、Rsbuild 作者）、**nemo-shen**、**cookfront**、**pangxie1991** 等 + 数百位社区贡献者
- **截至 2026 年的 v4.9+**：处于「**稳定演进期**」——新增 Barrage（弹幕）/ Highlight（关键词高亮）/ RollingText（数字滚动）/ Signature（手写签名）/ FloatingBubble（悬浮气泡）/ FloatingPanel（悬浮面板）等组件 + 修复 SSR / 暗色模式 bug，核心组件 API **高度稳定**

Vant 与 NutUI / Mint UI / Vuetify Mobile / Quasar Mobile 等 Vue 3 移动端 UI 库的本质差异：

| 维度 | Vant 4 | NutUI 4 | Mint UI | Vuetify Mobile | Quasar Mobile |
|---|---|---|---|---|---|
| 阵营 | 有赞 + 社区 | 京东 Style + 社区 | 饿了么（停维） | Vuetify Team | Quasar Team |
| 设计语言 | 移动电商风格 | **京东 NutDesign** | 与 Element UI 一致 | **Material Design 3** | Material 风格 |
| Vue 支持 | **Vue 3.x** | Vue 3.x（也支 React / Taro） | 仅 Vue 2 | Vue 3.x | Vue 3.x |
| 跨端能力 | 仅 Web H5 | Web + **Taro 小程序** + RN | 仅 Web | 仅 Web | Web + Mobile App + Electron |
| 国内移动端市场份额 | **断层第一** | 中（增长快） | 退役 | 低 | 低 |
| TypeScript | 完整类型 | 完整类型 | 不支持 | 完整类型 | 完整类型 |
| 组件数 | **80+** | 80+ | 30+ | 100+（含 PC） | 70+ |
| 单组件体积 | **~1KB（min+gzip）** | ~2KB | ~3KB | ~5KB | ~3KB |
| 第三方依赖 | **零** | 少 | 多 | 多 | 多 |
| 主题变量 | **700+ CSS Vars** | CSS Vars + SCSS | SCSS Vars | 强类型 Theme | SCSS + CSS Vars |
| 暗色模式 | 内置 | 内置 | 不支持 | 内置 | 内置 |
| 命令式 API | **showToast / showDialog** | 命令式 + 组件式 | $toast / $messagebox | 无（仅组件式） | $q.notify / $q.dialog |
| 业务组件 | **AddressEdit / Coupon / Sku** | AddressList / Sku | 较少 | 无 | 无 |
| SSR / Nuxt | `@vant/nuxt` | `@nutui/nutui` Nuxt | 不支持 | `@vuetify/nuxt-module` | Quasar SSR |
| 中文文档 | **官方完整** | 官方完整 | 官方完整 | 弱 | 弱 |
| 招聘市场 | **国内移动端绝对主流** | 国内增长中 | 仅 Vue 2 历史项目 | 海外多 | 海外多 |

**含义**：

- Vant **国内移动端 H5 市场占有率断层第一**——招聘、文档、问答、培训、面试题全部围绕 Vant，新人上手成本极低
- NutUI **京东风格 + Taro 跨端**，**国内移动端阵营增长第二**——适合**京东设计语言项目 + 跨小程序场景**
- Mint UI **已退役**——Vue 3 移动端项目不应再选 Mint UI，迁移目标就是 Vant
- Vuetify Mobile / Quasar Mobile **海外移动端 PWA 项目主流**——但国内移动端 H5 招聘几乎不要求
- **不适合**：PC 端中后台（用 Element Plus）/ 跨小程序（用 Vant Weapp 或 NutUI Taro）/ 设计驱动 C 端营销页（用 Tailwind + Headless UI）
- **适合**：99% 的国内 Vue 3 移动端 H5 / 微信公众号 H5 / PWA / 跨平台混合应用（Capacitor / WebView 容器）——这不是吹捧、是国内 Vue 3 移动端生态的**默认选择**

## 安装与首次启动

### 创建 Vue 3 项目

如果你**还没有 Vue 3 项目**，可以选择三种方式快速创建：

#### 方式 1：Rsbuild（Vant 作者推荐）

```bash
npm create rsbuild@latest
# 或：pnpm create rsbuild
```

Rsbuild 是基于 **Rspack（字节）** 的构建工具、由 **Vant 作者 chenjiahan** 开发、对 Vant 提供**第一优先级**支持——速度比 Vite 更快、对 Vue 3 / TS 支持完善。

> Rsbuild 创建的项目预设已经包含 Vue 3 + TypeScript + ESLint，是 Vant 项目的**最快脚手架**。

#### 方式 2：create-vue 官方脚手架

```bash
pnpm create vue@latest
# 或：npm create vue@latest / yarn create vue / bun create vue@latest
```

交互式菜单建议都选 **Yes**（TypeScript / Router / Pinia / ESLint）：

```
✔ Add TypeScript? … Yes
✔ Add JSX Support? … No
✔ Add Vue Router for Single Page Application development? … Yes
✔ Add Pinia for state management? … Yes
✔ Add Vitest for Unit Testing? … Yes
✔ Add ESLint for code quality? … Yes
```

> create-vue 不带 Vant 选项——下一步**单独装 Vant**（与 React 的 antd / Material UI 不同）。

#### 方式 3：Vite 模板

```bash
pnpm create vite@latest my-vant-app -- --template vue-ts
```

Vite 比 create-vue 更轻量，适合**只要 Vue 3 + Vant 不要 Router / Pinia 的演示项目**。

### 安装 Vant

```bash
# 主包
pnpm add vant

# 或其他包管理器
npm i vant
yarn add vant
bun add vant
```

可选周边：

| 库 | 用途 | 必需 |
|---|---|---|
| `vant` | 主组件库 | **必需** |
| `@vant/auto-import-resolver` | 按需引入 resolver（unplugin 的 Vant 适配器） | 推荐（按需引入必需） |
| `unplugin-vue-components` | 按需引入组件 | 推荐（与 resolver 配合） |
| `unplugin-auto-import` | 按需引入命令式 API（`showToast` 等） | 推荐（命令式 API 自动 import） |
| `@vant/touch-emulator` | 桌面端 touch 事件模拟 | 仅桌面端调试 / 部署 |
| `@vant/nuxt` | Nuxt 3 模块 | 仅 Nuxt 项目 |
| `postcss-pxtorem` + `lib-flexible` | Rem 移动端适配方案 | 仅需 rem 适配 |
| `postcss-px-to-viewport` | vw 移动端适配方案 | 仅需 vw 适配（rem 和 vw 二选一） |

Vue 版本要求：

| Vue 版本 | Vant 版本 |
|---|---|
| **Vue 3.x** | **Vant 4.x**（推荐） |
| Vue 3.x（早期项目） | Vant 3.x（已停止接受 PR） |
| Vue 2.x | Vant 2.x（仅维护、不再新增特性） |

> Vant 4 **已正式停止支持 Vue 2**——如果维护 Vue 2 项目，继续使用 [Vant 2 文档](https://vant-ui.github.io/vant/v2/#/zh-CN)。

### 国内镜像加速

国内网络下载 npm 包慢时配置淘宝镜像：

```bash
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

> **pnpm / yarn / bun** 默认使用 npm registry——同样需要配置 npmmirror。

## 全量引入（最简单）

**适合**：小项目 / 演示 / 不关心 bundle 大小的内部工具。一次性引入所有组件 + 所有 CSS：

### main.ts 配置

```ts
import { createApp } from 'vue'
import Vant from 'vant'
import 'vant/lib/index.css' // 全部组件 CSS（~150KB）
import App from './App.vue'

const app = createApp(App)

app.use(Vant)
// Lazyload 指令需单独注册（特殊处理）
app.use(Vant.Lazyload)

app.mount('#app')
```

**用法**：模板中直接用所有组件，**无需 import**：

```vue
<template>
  <van-nav-bar title="我的页面" left-arrow @click-left="onBack" />
  <van-cell-group inset>
    <van-cell title="单元格" value="内容" />
    <van-cell title="单元格" label="描述信息" />
  </van-cell-group>
  <van-button type="primary" block @click="onSubmit">提交</van-button>
</template>

<script setup lang="ts">
import { showToast } from 'vant'

function onBack() {
  showToast('返回')
}

function onSubmit() {
  showToast({ message: '已提交', position: 'bottom' })
}
</script>
```

### 全量引入的优缺点

**优点**

- **零配置**：一行 `app.use(Vant)` 完成所有注册
- **模板中无需 import**：直接用 `<van-button>` / `<van-cell>` / `<van-form>` 等
- **演示 / 学习场景最快**：跑通示例代码无需配 Vite 插件

**缺点**

- **bundle 大**：即使只用 Button，所有组件代码 + 全部 CSS 都打入 bundle（~300KB+）
- **首屏慢**：尤其移动端 + 弱网环境下首次加载明显
- **生产推荐用按需引入**：见下一节

## 按需引入（推荐）

**适合**：生产项目 / 在意 bundle 大小 / 任何中大型应用。**Tree Shaking + 自动 import + CSS 自动注入**：

### 安装插件

```bash
pnpm add -D @vant/auto-import-resolver unplugin-vue-components unplugin-auto-import
```

三个包的职责：

| 包 | 职责 |
|---|---|
| `@vant/auto-import-resolver` | **Vant 适配器**——告诉 unplugin 如何识别 `<van-button>` 标签 |
| `unplugin-vue-components` | **组件自动 import**——扫描模板中的 `<van-button>` 自动注入 `import { Button } from 'vant'` |
| `unplugin-auto-import` | **API 函数自动 import**——扫描 script 中的 `showToast()` 自动注入 `import { showToast } from 'vant'` |

### Vite 配置（推荐）

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [VantResolver()],
    }),
    Components({
      resolvers: [VantResolver()],
    }),
  ],
})
```

配置完成后，模板和 script 都**无需 import**：

```vue
<template>
  <van-button type="primary" @click="onClick">按钮</van-button>
</template>

<script setup lang="ts">
// 无需 import showToast / van-button
function onClick() {
  showToast('已点击')
}
</script>
```

> Vite 启动后会在终端打印 `Components: 1 detected`——表示 unplugin 已扫描到组件。
>
> 第一次 build 会在 `auto-import.d.ts` 和 `components.d.ts` 自动生成类型声明——**这两个文件应该提交到 git**，否则 IDE 没有类型提示。

### Rsbuild 配置

```js
// rsbuild.config.js
import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import AutoImport from 'unplugin-auto-import/rspack'
import Components from 'unplugin-vue-components/rspack'
import { VantResolver } from '@vant/auto-import-resolver'

export default defineConfig({
  plugins: [pluginVue()],
  tools: {
    rspack: {
      plugins: [
        AutoImport({ resolvers: [VantResolver()] }),
        Components({ resolvers: [VantResolver()] }),
      ],
    },
  },
})
```

### Webpack 配置（Vue CLI 4+ / 自定义 Webpack）

```js
// vue.config.js（Vue CLI 项目）
const { VantResolver } = require('@vant/auto-import-resolver')
const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')

module.exports = {
  configureWebpack: {
    plugins: [
      AutoImport({ resolvers: [VantResolver()] }),
      Components({ resolvers: [VantResolver()] }),
    ],
  },
}
```

```js
// webpack.config.js（纯 Webpack 项目）
const { VantResolver } = require('@vant/auto-import-resolver')
const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')

module.exports = {
  plugins: [
    AutoImport({ resolvers: [VantResolver()] }),
    Components({ resolvers: [VantResolver()] }),
  ],
}
```

### 手动按需引入（不推荐）

如果不想用 unplugin，也可以**手动 import 每个组件**——但需要**手动 import CSS**（按需引入插件的优势就是自动注入 CSS）：

```vue
<script setup lang="ts">
import { Button, Cell, showToast } from 'vant'

// 手动 import CSS（重要！不引入会失去样式）
import 'vant/es/button/style'
import 'vant/es/cell/style'
import 'vant/es/toast/style'
</script>

<template>
  <Button type="primary" @click="onClick">按钮</Button>
  <Cell title="单元格" />
</template>
```

> **缺点**：每加一个组件都要 import 一次 CSS——容易遗漏导致**组件没样式**。**强烈建议用 unplugin 自动按需**。

### 按需引入的优缺点

**优点**

- **bundle 小**：只打用到的组件代码 + CSS，**~30KB 起步**（vs 全量 ~300KB）
- **模板中仍无需 import**：和全量一样写 `<van-button>`
- **API 函数（showToast / showDialog）自动 import**：unplugin-auto-import 处理

**缺点**

- **首次配置稍复杂**：需要装 3 个 dev 包 + 配 Vite/Webpack plugin
- **`auto-import.d.ts` 必须 commit**：否则 IDE 没类型提示

## CDN 引入（仅演示）

仅用于**演示 / Codepen / 单 HTML 文件**——**生产项目不推荐**：

```html
<!-- 引入 Vant CSS -->
<link rel="stylesheet" href="https://fastly.jsdelivr.net/npm/vant@4/lib/index.css" />

<!-- 引入 Vue 3 -->
<script src="https://fastly.jsdelivr.net/npm/vue@3"></script>

<!-- 引入 Vant 4 -->
<script src="https://fastly.jsdelivr.net/npm/vant@4/lib/vant.min.js"></script>

<div id="app">
  <van-button type="primary" @click="onClick">按钮</van-button>
</div>

<script>
  const app = Vue.createApp({
    setup() {
      function onClick() {
        vant.showToast('已点击')
      }
      return { onClick }
    },
  })
  app.use(vant)
  app.use(vant.Lazyload)
  app.mount('#app')
</script>
```

可选 CDN：

- **jsdelivr**：`https://fastly.jsdelivr.net/npm/vant@4`（国内推荐）
- **unpkg**：`https://unpkg.com/vant@4`
- **cdnjs**：`https://cdnjs.cloudflare.com/ajax/libs/vant/4.x.x/vant.min.js`

> CDN 引入下命令式 API 必须通过 `vant.showToast(...)` 而非 `showToast(...)` 调用——**没有按需引入 + Tree Shaking**。

## Nuxt 3 集成

Vant 官方提供 **`@vant/nuxt`** 模块——**零配置**启用 SSR + 自动按需 + 自动处理 hydration：

```bash
pnpm add -D @vant/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vant/nuxt'],
})
```

完成后，Nuxt 项目中直接使用 Vant 组件 + 命令式 API：

```vue
<template>
  <van-button type="primary" @click="onClick">Nuxt 按钮</van-button>
</template>

<script setup lang="ts">
function onClick() {
  // 命令式 API 自动 import（与 unplugin-auto-import 等价）
  showToast('Nuxt 中也能用')
}
</script>
```

模块选项（可选）：

```ts
export default defineNuxtConfig({
  modules: ['@vant/nuxt'],
  vant: {
    // 是否懒加载组件 CSS（默认 true）
    lazyload: true,
    // 排除按需引入的组件
    excludeExports: undefined,
    // 自定义图标前缀
    importStyle: 'css',
  },
})
```

> **注意**：Vant 大量使用 `Teleport`（如 Dialog / Toast / Popup），Nuxt SSR 下需要 `<ClientOnly>` 包裹**才能避免 hydration mismatch**——`@vant/nuxt` 已自动处理常见场景，自定义场景仍可能踩坑。

## 第一个完整示例

下面是一个完整的「**移动端登录页**」示例，展示 Vant 最核心的几个组件配合 use：

```vue
<template>
  <!-- 顶部导航栏 -->
  <van-nav-bar title="登录" left-arrow @click-left="onBack" />

  <!-- 登录表单 -->
  <van-form @submit="onSubmit">
    <van-cell-group inset>
      <!-- 用户名输入框 -->
      <van-field
        v-model="form.username"
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        :rules="[{ required: true, message: '请填写用户名' }]"
      />
      <!-- 密码输入框 -->
      <van-field
        v-model="form.password"
        type="password"
        name="password"
        label="密码"
        placeholder="请输入密码"
        :rules="[{ required: true, message: '请填写密码' }]"
      />
    </van-cell-group>

    <!-- 提交按钮 -->
    <div style="margin: 16px">
      <van-button round block type="primary" native-type="submit">
        登录
      </van-button>
    </div>
  </van-form>

  <!-- 底部 Tab 栏 -->
  <van-tabbar v-model="active" safe-area-inset-bottom>
    <van-tabbar-item icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item icon="search">搜索</van-tabbar-item>
    <van-tabbar-item icon="setting-o">设置</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'

// 登录表单数据
const form = reactive({
  username: '',
  password: '',
})

// 底部 Tab 当前激活索引
const active = ref(0)

// 提交回调
function onSubmit(values: typeof form) {
  // 表单校验通过后才会执行
  if (values.username === 'admin') {
    showSuccessToast('登录成功')
  }
  else {
    showFailToast('用户名错误')
  }
}

function onBack() {
  // 返回上一页
  history.back()
}
</script>

<style scoped>
/* 避免 NavBar 与表单之间留白 */
.van-form {
  margin-top: 8px;
}
</style>
```

这个示例包含：

- **NavBar 导航栏**（左侧返回箭头 + 标题）
- **Form 表单**（声明式校验 + 提交事件）
- **Field 输入框**（v-model 双向绑定 + 校验规则）
- **CellGroup 内嵌单元格组**（圆角卡片样式）
- **Button 按钮**（圆形 + 块级 + Primary 类型）
- **Tabbar 底部 Tab**（图标 + 文字 + 安全区适配）
- **`showSuccessToast` / `showFailToast` 命令式 API**

按需引入下：**所有组件 + API 全部自动 import**，模板中直接使用。

## 移动端适配

Vant 默认 **px 单位 + 375 设计稿基准**——但移动设备屏幕宽度从 320（小屏 iPhone SE）到 480（大屏 Android）不等，需要适配方案。**Rem 和 vw 二选一**：

### 方案 1：Rem 适配（推荐）

**核心原理**：将 px 单位转换为 rem，配合 `lib-flexible` 动态设置根字体大小，实现等比缩放。

```bash
pnpm add lib-flexible
pnpm add -D postcss-pxtorem
```

main.ts 引入 `lib-flexible`：

```ts
import 'lib-flexible' // 必须在 createApp 之前引入
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

PostCSS 配置：

```js
// postcss.config.js
module.exports = {
  plugins: {
    // Vant 设计稿基准是 375——rootValue 设为 37.5（375 / 10）
    'postcss-pxtorem': {
      rootValue: 37.5,
      propList: ['*'],
    },
  },
}
```

#### 设计稿为 750 时

如果**项目设计稿是 750**（淘宝 / 京东等常用尺寸），但 **Vant 内部仍是 375**，需要差异化配置：

```js
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-pxtorem': {
      // postcss-pxtorem >= 5.0.0 才支持函数式 rootValue
      rootValue({ file }) {
        // Vant 组件按 37.5 转换、业务代码按 75 转换
        return file.indexOf('vant') !== -1 ? 37.5 : 75
      },
      propList: ['*'],
    },
  },
}
```

> Tips：**避免在 postcss-loader 中 ignore `node_modules`**——否则 Vant 内部样式不会被 PostCSS 编译。

### 方案 2：Viewport（vw）适配

**核心原理**：将 px 转换为 vw，无需 JS 介入、纯 CSS 适配。

```bash
pnpm add -D postcss-px-to-viewport
```

```js
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-px-to-viewport': {
      // Vant 设计稿基准 375——所以 viewportWidth 设为 375
      viewportWidth: 375,
    },
  },
}
```

**vw 适配的优点**：

- 无需 JS（不依赖 lib-flexible）
- SSR 友好（无 JS 执行阶段问题）
- 现代浏览器 vw 单位支持完善（iOS Safari 6.1+ / Chrome 26+）

**vw 适配的缺点**：

- 桌面端浏览器全屏后 vw 会等比放大、看起来组件很大（需要 `max-width` 容器约束）

> **rem 和 vw 二选一**：移动端 H5 项目 2026 年推荐 **vw 适配**（无 JS + SSR 友好），保守项目继续用 rem。

## 桌面端使用

Vant 是**专为移动端设计**——默认只监听 `touch` 事件（touchstart / touchmove / touchend），桌面端鼠标点击**无响应**：

### 方案 1：@vant/touch-emulator（开发调试用）

```bash
pnpm add @vant/touch-emulator
```

```ts
// main.ts 中引入即可，无需配置
import '@vant/touch-emulator'
```

引入后桌面端浏览器的 `mouse` 事件自动转换为 `touch` 事件——**所有 Vant 组件在桌面端可点击 / 拖拽**。

> **常见用法**：开发期间 PC 浏览器调试时引入、生产环境也可保留（体积 < 2KB）。

### 方案 2：max-width 容器约束（视觉适配）

桌面端浏览器全屏宽度可能 1920px+，Vant 组件全部铺满会**视觉错乱**——用 `max-width` 限制容器：

```vue
<template>
  <div class="mobile-container">
    <RouterView />
  </div>
</template>

<style>
.mobile-container {
  max-width: 540px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f7f8fa;
}
</style>
```

`max-width: 540px` 是移动端 H5 桌面端展示的**事实标准**——既能容纳大部分手机宽度（375 / 414 / 480），又不会在 4K 屏上铺满。

> **结合方案 1 + 2**：开发期 + 生产期都需要——用 `@vant/touch-emulator` 让事件可点 + 用 `max-width` 让视觉合理。

## 中文国际化（默认）

Vant **默认即中文**——与 Element Plus 必须 `app.use(ElementPlus, { locale: zhCn })` 不同，Vant **无需任何配置**：

```vue
<template>
  <van-pagination v-model="currentPage" :total-items="100" />
  <!-- 渲染："上一页 / 下一页" 直接是中文 -->
</template>
```

### 切换到其他语言

如果项目需要英文 / 日文等其他语言：

```ts
// main.ts
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'

// 切换为英文
Locale.use('en-US', enUS)
```

Vant 内置 **30+ 语言包**，从中文（简体 / 繁体）/ 英文 / 日韩 / 法德意西 / 阿拉伯（RTL）/ 罗马尼亚语 / 越南语 / 泰语全覆盖。完整列表见 [指南 - 国际化](./guide-line.md)。

### 自定义部分文案

如果只想**修改某个组件的某个文案**（如把 Picker 的「确认」改成「关闭」）：

```ts
import { Locale } from 'vant'

Locale.add({
  'zh-CN': {
    vanPicker: {
      confirm: '关闭', // 默认是「确认」
    },
  },
})
```

## 深色模式（一行启用）

Vant 内置深色模式——用 `ConfigProvider` 组件的 `theme="dark"` 属性一行启用：

```vue
<template>
  <van-config-provider theme="dark">
    <RouterView />
  </van-config-provider>
</template>
```

整个 App 内的 Vant 组件**全部变成深色**——但 **HTML body 背景色 / 文字色不会变**（Vant 只控制组件、不控制全局）。

补充全局样式：

```css
/* 在全局样式文件（如 main.css）中添加 */
.van-theme-dark body {
  color: #f5f5f5;
  background-color: #000;
}

.van-theme-light body {
  color: #323233;
  background-color: #fff;
}
```

### 动态切换浅色 / 深色

配合 **VueUse 的 `useDark`**（推荐）：

```vue
<template>
  <van-config-provider :theme="theme">
    <RouterView />
  </van-config-provider>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { computed } from 'vue'

// 自动同步 localStorage + prefers-color-scheme
const isDark = useDark()

// VueUse useDark 返回 boolean、Vant 需要 'light' / 'dark' 字符串
const theme = computed(() => (isDark.value ? 'dark' : 'light'))
</script>
```

## 主题色（一行覆盖）

Vant 4 暴露 **700+ CSS 变量**——通过 `ConfigProvider` 的 `theme-vars` 属性**全局覆盖**：

```vue
<template>
  <van-config-provider :theme-vars="themeVars" theme-vars-scope="global">
    <RouterView />
  </van-config-provider>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

// 主题变量名以 camelCase 写、最终转为 --van-* 的 kebab-case
const themeVars = reactive({
  // 主色（影响所有 Primary 组件）
  primaryColor: '#07c160', // 微信绿
  // Button Primary 背景色
  buttonPrimaryBackground: '#07c160',
  buttonPrimaryBorderColor: '#07c160',
  // 自定义 Tab 激活色
  tabActiveTextColor: '#07c160',
})
</script>
```

`theme-vars-scope="global"`：**生效范围为整个页面**（设置到 `:root`）。

不带 scope 时（默认 `local`）：**只影响 ConfigProvider 内部的子组件**。

更深度的主题定制见 [指南 - 主题定制](./guide-line.md)。

## tsconfig.json 配置（可选）

Vant 4 完整 TypeScript 类型——**默认无需额外 tsconfig 配置**（与 Element Plus 不同）。

但如果使用 **`unplugin-vue-components` 按需引入**，生成的 `components.d.ts` 需要在 tsconfig 中被识别：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*",
    "src/**/*.vue",
    "auto-imports.d.ts",   // unplugin-auto-import 生成
    "components.d.ts"      // unplugin-vue-components 生成
  ]
}
```

> 这两个 `.d.ts` **应该 commit 到 git**——CI 环境第一次 build 时还没生成、会找不到 `<van-button>` 类型。

## 常用模板与场景速查

| 场景 | 关键组件 | 示例代码 |
|---|---|---|
| 移动端登录页 | NavBar + Form + Field + Button | 见上方「第一个完整示例」 |
| 商品列表（下拉刷新 + 上拉加载） | List + PullRefresh + Card | 见 [指南 - List + PullRefresh](./guide-line.md) |
| 商品详情（图片预览 + 立即购买） | ImagePreview + Sku + SubmitBar | 见 [指南 - 业务组件](./guide-line.md) |
| 个人中心 | Cell + Grid + Tab + Tabbar | 见 [指南 - 导航三件套](./guide-line.md) |
| 表单填写 + 校验 | Form + Field + Picker + Calendar | 见 [指南 - Form 深度](./guide-line.md) |
| 提示 / 确认弹窗 | showToast / showDialog / showConfirmDialog | 见 [指南 - 反馈组件](./guide-line.md) |
| 地址选择 | Area + AddressEdit + AddressList | 见 [指南 - 业务组件](./guide-line.md) |

## 下一步

入门完成后，建议深入阅读：

- [指南](./guide-line.md)：80+ 组件按类别深度速览 / Form / Picker / List / 反馈三件套 / 主题深度 / 暗色模式深度 / 适配方案 / 常见踩坑
- [参考](./reference.md)：所有组件 props / events / slots / 命令式 API 签名 / Composables / 类型定义 / CSS 变量入口

> **建议**：先在本地用 `pnpm create rsbuild` 或 `pnpm create vue` 创建空项目、配好按需引入、跑通「移动端登录页」示例——再深入读「指南」按需查表。
