---
layout: doc
outline: [2, 3]
---

# 入门：uni-app 是什么与怎么起步

> 基于 uni-app 5.x（uni-app x）· 核于 2026-07

## 速查

- **一句话**：DCloud 出品、**用 Vue.js 语法**写、一套代码编译到「各家小程序 + H5/Web + App（iOS/Android）+ 鸿蒙」的跨端框架；国内 Vue 系跨端事实龙头
- **两种形态**：**传统版 uni-app**（JS + WebView 渲染，App 端 nvue 页走 Weex 原生）｜ **uni-app x**（UTS + uvue 原生渲染，编译 Kotlin/Swift/ArkTS，主打原生性能）；两者**并存、共用版本号 5.x**
- **不用 HTML 标签**：写 `view`/`text`/`image`/`scroll-view`/`swiper` 等小程序系组件（**不用 `div`/`span`**）；所有文字须放在 `<text>` 内的语义与小程序一致
- **统一 API**：把小程序 `wx.*` 统一成 `uni.*`（`uni.request`/`uni.navigateTo`/`uni.showToast`），一份代码跨端；不传 `success` 回调时（Vue3）返回 Promise
- **四大工程文件**：`pages.json`（路由+导航+TabBar+分包，**非 Vue Router**）｜ `manifest.json`（appid+各端差异+`vueVersion`）｜ `App.vue`（应用生命周期）｜ `main.js`（uni-app x 为 `main.uts`，程序入口）
- **easycom**：把组件放 `components/组件名/组件名.vue`，模板里**免 import/注册**直接用，打包按需摇树
- **两条上手路**：「HBuilderX」官方 IDE（免装 Node、图形化运行、产物 `unpackage/`）｜ CLI（Vue3 + Vite，源码在 `src/`、产物在 `dist/`，适合团队/CI）
- **版本坐标**：统一 `5.07.2026041006`（2026-04）；Vue2（webpack）/ Vue3（Vite）双支持，**新项目用 Vue3 + Vite**（Node 18+/20+）
- **易错先记**：页面生命周期（`onLoad`/`onShow`）从 `@dcloudio/uni-app` 引入，**不是 Vue 的**（详见[生命周期](./guide-line/lifecycle)）
- **进阶顺序**：先读[工程配置](./guide-line/project-config)与[API 与组件](./guide-line/api-components) → 再读[条件编译](./guide-line/conditional-compile)吃透跨端差异化 → 想要原生性能看 [uni-app x](./guide-line/uni-app-x)

## 一、uni-app 解决什么问题

国内跨端的现实是：要同时上**微信/支付宝/抖音/百度等一堆小程序**，还要有 **H5** 与 **iOS/Android App**，近两年再加**鸿蒙**。逐端各写一套成本高得离谱。uni-app 的答案是——**用前端团队最熟的 Vue.js 技能，写一套代码编译到所有这些端**。

它的设计不是凭空造一套组件模型，而是**对齐小程序规范**：组件用 `view`/`text`/`image`（不是 `div`/`span`/`img`），API 把各家小程序的 `wx.*`、`my.*` 统一成 `uni.*`。这样从微信小程序迁过来几乎零学习成本，同时这套「小程序系」标签又能被编译到 H5 与 App。

它区别于几类方案：

- **vs 各端各写**：一套 Vue 代码跨全端，用**条件编译**处理少量平台差异，而不是维护 N 份工程。
- **vs 纯 H5 套壳**：传统版 App 虽用 WebView 渲染 vue 页面，但提供 nvue（Weex 原生渲染）解决长列表/层级等重场景；uni-app x 更进一步用 uvue 原生渲染。
- **vs 原生**：迭代快、复用 Web 技能；极致性能或最新平台能力可写 UTS 原生插件补齐。

> 一个常被误读的信号：GitHub 上 `dcloudio/uni-app` 仓库主语言显示为 Objective-C/Swift/JavaScript——那是因为仓库里含 **App 端原生运行时 SDK**，**不代表**你要用 OC/Swift 开发。你写的是 Vue/JS（传统版）或 UTS（uni-app x）。

## 二、两种形态：传统版 uni-app 与 uni-app x

| 维度 | 传统版 uni-app | uni-app x |
| --- | --- | --- |
| 语言 | JavaScript / TypeScript | **UTS**（uni TypeScript，强类型） |
| 页面文件 | `.vue`（Vue2/Vue3 都支持） | `.uvue` |
| App 端渲染 | WebView（vue 页）/ Weex 原生（nvue 页） | **uvue 原生渲染**（VDOM→Vapor） |
| 编译目标 | JS bundle | Android→**Kotlin**、iOS→**Swift**、鸿蒙→**ArkTS**、Web/小程序→**JS** |
| 成熟度/生态 | 最成熟、生态最大、上手最低 | DCloud 主推的未来方向，能力持续补齐 |
| 何时选 | 绝大多数业务、要覆盖最多端 | 要极致原生性能、原生级能力 |

两者**并存**：传统版继续维护，uni-app x 面向「要原生性能」的场景，共享 UTS 插件生态与大量原生 API，现已**共用统一版本号 5.x**。本叶先讲通用心智，uni-app x 的细节见 [uni-app x](./guide-line/uni-app-x)。

## 三、工程结构

CLI 项目以 `src/` 为根，HBuilderX 项目以项目根目录为根。核心文件：

| 文件/目录 | 作用 |
| --- | --- |
| **`pages.json`** | 页面路由 + 导航栏/TabBar/分包/窗口样式的全局配置（**非 Vue Router**） |
| **`manifest.json`** | 应用级配置：appid、应用名、版本号、各端差异化配置、`vueVersion` |
| **`App.vue`** | 应用入口组件，写全局样式与**应用生命周期**（`onLaunch`/`onShow`/`onHide`） |
| **`main.js`**（uni-app x 为 `main.uts`） | 程序入口，创建 Vue 应用实例、挂载全局插件 |
| `uni.scss` | 全局 SCSS 变量（内置一套 `$uni-` 变量），各页面/组件自动可用 |
| `pages/` | 页面 `.vue`/`.uvue` 文件 |
| `components/` | 组件目录，配合 **easycom** 自动引入 |
| `static/` | 静态资源（**不参与编译**，可按平台建子目录做条件编译） |
| `uni_modules/` | 插件/组件标准化模块目录（插件市场安装物落此处，支持 UTS 插件） |
| `unpackage/`（HBuilderX）/ `dist/`（CLI） | 编译输出 |

`pages.json` 与 `manifest.json` 是最需要吃透的两个配置文件，详见[工程配置](./guide-line/project-config)。

## 四、开发心智：小程序标签 + uni.* API + easycom

```vue
<template>
  <!-- 用小程序系组件，不用 div/span -->
  <view class="page">
    <text class="title">{{ title }}</text>
    <button @click="load">请求数据</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app' // ← 页面生命周期来自这里，不是 vue

const title = ref('Hello uni-app')

onLoad(() => {
  console.log('页面加载')
})

// uni.* 统一 API：不传 success 回调（Vue3）返回 Promise
async function load() {
  const res = await uni.request({ url: 'https://example.com/api' })
  console.log(res.data)
}
</script>

<style>
.page { padding: 20rpx; }
.title { font-size: 32rpx; }
</style>
```

三个入门要点先记住：

- **组件走小程序系**：`view`/`text`/`image`/`scroll-view`/`swiper`/`button`/`input`，不用 HTML 的 `div`/`span`。完整清单见 [API 与组件](./guide-line/api-components)。
- **API 统一成 `uni.*`**：`uni.request` / `uni.navigateTo` / `uni.showToast` / `uni.setStorage`，跨端一份代码；Vue3 下不传 `success` 回调则返回 Promise。
- **easycom 自动引入**：把组件放到 `components/组件名/组件名.vue`，模板里直接 `<组件名>` 用，无需 import/注册，打包按需摇树。

## 五、两种上手方式

**A. HBuilderX（官方 IDE，很多用户首选）**

- 开箱即用，**无需配置 Node.js**（编译器内置于 IDE 插件目录，随 IDE 升级）。
- 新建：`文件 → 新建项目 → uni-app`，选模板（空项目 / Hello uni-app / uni-ui 项目模板，生产推荐 uni-ui 模板）、选 Vue2/Vue3。
- 运行：`运行` 菜单（Ctrl+R）→ 运行到浏览器 / 运行到手机或模拟器 / 运行到小程序模拟器（微信/支付宝/百度/抖音/QQ…）。
- 产物落在 `unpackage/`。

**B. CLI（Vue3 + Vite，工程化首选）**

```bash
# Vue3 + Vite（JS）
npx degit dcloudio/uni-preset-vue#vite my-vue3-project
# Vue3 + Vite + TS
npx degit dcloudio/uni-preset-vue#vite-ts my-vue3-project

# 运行 / 打包，%PLATFORM% 取 h5 / mp-weixin / mp-alipay / app 等
npm run dev:h5
npm run dev:mp-weixin
npm run build:app
```

- **Node 要求**：Vue3/Vite 版需 **Node 18+ / 20+**。
- 源码在 `src/`、产物在 `dist/`，编译器在项目内，适合团队与 CI。
- Vue2 版仍可用（`@vue/cli` + webpack 编译器），但工具链落后于 Vue3 + Vite，**新项目不建议 Vue2**。

## 六、心智地图：接下来读什么

- 想把配置改对（首页、导航栏、TabBar、分包）→ [工程配置：pages.json 与 manifest.json](./guide-line/project-config)。
- 想会用 API 与组件、少写模板样板 → [API 与组件](./guide-line/api-components)。
- 想搞懂「一套代码怎么处理平台差异」→ [条件编译](./guide-line/conditional-compile)（最核心的跨端机制）。
- 老是搞混生命周期从哪 import → [生命周期](./guide-line/lifecycle)。
- 想要原生性能、了解未来方向 → [uni-app x](./guide-line/uni-app-x)。
- 想上云、少写后端 → [uniCloud](./guide-line/unicloud)。
- 速记表在 [参考](./reference)。
