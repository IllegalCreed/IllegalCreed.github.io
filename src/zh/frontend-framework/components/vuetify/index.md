---
layout: doc
---

# Vuetify

**Vue 3 阵营 Material Design 组件库的事实标准**，由 **John Leider**（Vuetify 创始人）于 **2016 年** 创立、目前由 **Vuetify Team**（核心维护者 John Leider / Heather Leider / KaelWD 等）+ 数百位社区贡献者维护——是「**最早、最完整、最严格遵循 Material Design 规范**」的 Vue UI 库。**最新稳定版 v3.x**（截至 2026 年的 **v3.8+**，基于 **Vue 3.5+ + TypeScript 5+** 完全重写），完整迁移自 Vuetify 2（Vue 2 时代海外最流行的 Material UI 库）。**核心特性矩阵**：**100+ 组件**（覆盖 Application / Form / Data / Navigation / Layout / Feedback 等全场景）/ **严格 Material Design 3（Material You）规范**（颜色 / 字号 / 圆角 / 间距 / 动效全部对齐 Google Material Design）/ **完整 TypeScript 类型 + Volar 智能提示**（每个组件 props / slots / events 都有 TS 声明，**对 Vue 3 TS 项目零摩擦**）/ **`vite-plugin-vuetify` 默认 Tree Shaking + 自动导入**（无需手动 import 组件、只打包用到的部分）/ **强大的主题系统**（多主题 / 暗色 / SCSS 变量 / CSS 变量 / `defaultTheme` / `useTheme` 运行时切换）/ **完整国际化**（40+ 语言 / 与 vue-i18n 集成 / 自动 RTL 支持 / 日期适配器多框架支持）/ **响应式断点系统**（`useDisplay` composable 提供 `mobile` / `mdAndUp` / `xlAndDown` 等响应式 ref，配合 `v-app` + Grid 系统）/ **完美 SSR 支持**（`ssr: true` 选项 + 官方 `@vuetify/nuxt-module` Nuxt 模块）/ **`<v-app>` Application Layout 系统**（`<v-app-bar>` / `<v-navigation-drawer>` / `<v-main>` / `<v-footer>` 自动布局协调，无需手写 flex/grid）/ **Material Design Icons 默认集成**（`@mdi/font` 9000+ 图标）/ **`createVuetify({ defaults })` 全局默认值**（统一所有 `v-btn` / `v-text-field` 默认 variant / density）/ **Date Picker + Date Adapter**（支持 date-fns / luxon / dayjs / moment 多框架，可自由切换底层日期库）/ **Vuetify Labs**（实验组件，新组件在 labs 下孵化）。**典型用户群**：海外 Vue 3 项目主流选择 / 设计驱动应用 / 跨平台 App（PWA / Capacitor）/ Material Design 风格的 SaaS 与企业应用 / **国际化项目优先**。**截至 2026 年的 v3.8+** 处于「**稳定演进期**」，新增 `useRules` / `createDataTable` 等 composable、持续完善 Material Design 3 适配——这是 Vue 3 严格 Material 风格项目的**默认选择**。

## 评价

**优点**

- **Vue 3 + Material Design 的事实标准**：从 Vuetify 2 时代积累的海量用户 + 完整文档 + 第三方资源 + 模板/脚手架生态——**国际化、Material 风格项目几乎默认选择 Vuetify**
- **100+ 组件覆盖全场景**：Application（v-app / v-app-bar / v-navigation-drawer）+ Form（v-text-field / v-select / v-autocomplete / v-form 校验）+ Data（v-data-table / v-data-iterator / v-list / v-tree-view）+ Navigation（v-tabs / v-stepper / v-breadcrumbs / v-pagination）+ Layout（v-container / v-row / v-col 12 栅格）+ Feedback（v-dialog / v-snackbar / v-alert / v-tooltip）——**Material 场景全部覆盖**
- **严格 Material Design 3 规范**：颜色、字号、圆角、间距、阴影、动效、touch target、a11y 全部对齐 Google Material Design——**直接落地 Material 设计稿不需要额外调整**
- **完整 TypeScript 类型 + 强类型主题**：从 `createVuetify` 的 theme 配置到 `useTheme` 返回的 `theme.global.current.value.colors` 都是强类型——**改主题字段会有 TS 红线提示**
- **`vite-plugin-vuetify` 自动按需 + Tree Shaking**：**零样板自动导入**——模板写 v-btn / v-text-field 不需要任何 import，最终 bundle 只包含用到的组件 + 对应 SCSS
- **强大的主题系统**：`createVuetify({ theme: { themes: { light, dark, custom1, custom2 } } })` 支持任意数量主题，`useTheme().global.name.value = 'dark'` **运行时一键切换**——比 Element Plus 的 CSS 变量切换更强
- **`<v-app>` Application Layout 系统**：`v-app-bar` / `v-navigation-drawer` / `v-main` / `v-footer` 自动协调位置（drawer 收起后 main 自动扩展、app-bar 固定吸顶）——**写一个标准 Material 后台布局只需 5 个组件**
- **`useDisplay` 响应式断点**：`const { mobile, mdAndUp, smAndDown } = useDisplay()` —— **响应式 ref 自动监听窗口大小变化**，业务代码中条件渲染移动端/桌面端组件极简洁
- **`createVuetify({ defaults })` 全局默认**：`defaults: { VBtn: { variant: 'flat', rounded: true } }` —— **统一全 App 所有 button 默认风格**，比手动设计令牌简洁
- **完整国际化 40+ 语言**：内置 zh-Hans / zh-Hant / en / ja / ko / fr / de / es / ar 等 40+ 语言、自动 RTL、可以与 vue-i18n 双向同步——海外项目极友好
- **Date Adapter 抽象**：默认用 `@date-io/date-fns` 适配器、可切换 luxon / dayjs / moment——**用户可以选择项目已有的日期库**，不强制引入额外依赖
- **完美 SSR + Nuxt 模块**：`createVuetify({ ssr: true })` 启用 SSR；`@vuetify/nuxt-module` **零配置** SSR + 自动按需 + 主题与 i18n 集成
- **Material Design Icons 9000+ 图标默认集成**：`@mdi/font` 提供 9000+ MDI 图标，所有组件 `icon` 属性直接传 `'mdi-home'` 字符串即可（vs Element Plus 必须包裹 `<el-icon>`）
- **Vuetify Labs 实验组件机制**：新组件先在 `vuetify/labs/*` 下孵化（如 `useRules` / `createDataTable`），稳定后再升级到正式组件——**用户可以提前用上新特性**
- **GitHub 41k+ Star + 活跃社区**：全球 Vue UI 库 Star 第一，文档 / Discord / Stack Overflow / 中文社区资源都很丰富

**缺点**

- **设计风格强 Material**：默认主题非常 Material（强阴影 / 强对比色 / 圆形 ripple）——**不适合做企业级中后台**（视觉与国内主流后台风格不符）/ **不适合极简扁平风格**（如 Notion / Linear 风格）
- **bundle 偏大**：即使按需引入，Material Design 的复杂样式让单组件 CSS 较大——典型 Vuetify 项目 bundle **~600KB+**（vs Element Plus ~500KB / Naive UI ~250KB）
- **国内市场份额低**：国内中后台市场 99% 是 Element Plus 主导——**Vuetify 在国内招聘、技术支持、中文资源、面试题都明显少**
- **中文文档较弱**：[vuetifyjs.com](https://vuetifyjs.com) 主要是英文，**官方中文文档不完整**（部分页面是机器翻译质量差）——中文资源主要靠社区博客
- **vs Material UI（React）**：MUI 是 React 阵营的 Material 库，**生态更大、社区更活跃**；Vuetify 在 Vue 阵营对标 MUI，但 **MUI 已经迭代到 v6 / Joy UI / Pigment CSS 多产品线**，Vuetify 演进相对慢
- **`<v-app>` 包裹整个 App 才能用 Layout 系统**：忘记包裹 `<v-app>` → `v-app-bar` / `v-navigation-drawer` 等 Layout 组件**位置计算错乱**——常见踩坑
- **SSR Hydration 复杂**：内置很多 Teleport / Transition 的组件（Dialog / Menu / Tooltip），SSR 时 hydration 容易 mismatch——需要用 `<ClientOnly>` 或 `@vuetify/nuxt-module` 处理
- **主题切换涉及 SCSS 编译**：深度定制主题（自定义 SCSS 变量）需要 `vite-plugin-vuetify` + `styles: { configFile }` 配置——比 Element Plus 的 CSS 变量切换繁琐
- **没有原生命令式 API**：Vuetify **不提供 `$message.success()` / `$confirm()` 这种命令式 API**——所有反馈必须通过 `<v-snackbar v-model>` / `<v-dialog v-model>` 组件式声明，**比 Element Plus 的命令式 ElMessage 啰嗦**
- **vs Element Plus**：国内 Vue 3 中后台 99% 用 Element Plus；Vuetify 在国内主要用于**移动端 PWA / Material 风格设计应用 / 国际化项目** —— 选择主要看**设计风格 + 招聘市场**
- **vs Naive UI**：Naive UI **TS-first + 现代极简风格**、bundle 更小；Vuetify **严格 Material 风格 + 100+ 组件更全面**——风格冲突，按设计偏好选
- **vs Quasar**：Quasar **跨平台**（Web / Mobile App / Electron / SSR / PWA 一套代码）、设计风格与 Vuetify 类似但更灵活；Vuetify **专注 Web + Material**——Quasar 适合多平台、Vuetify 适合纯 Web Material 项目
- **vs PrimeVue**：PrimeVue **多主题预设**（Material / Aura / Lara 等）+ 中性设计风格；Vuetify **专一 Material 严格规范**——PrimeVue 风格更灵活、Vuetify 更纯粹

## 文档地址

[Vuetify 官网](https://vuetifyjs.com/zh-Hans/) | [安装](https://vuetifyjs.com/zh-Hans/getting-started/installation/) | [Vite 项目](https://vuetifyjs.com/zh-Hans/getting-started/installation/#using-vite) | [按需引入](https://vuetifyjs.com/zh-Hans/features/treeshaking/) | [主题](https://vuetifyjs.com/zh-Hans/features/theme/) | [全局默认值](https://vuetifyjs.com/zh-Hans/features/global-configuration/) | [国际化](https://vuetifyjs.com/zh-Hans/features/internationalization/) | [日期适配器](https://vuetifyjs.com/zh-Hans/features/dates/) | [SSR](https://vuetifyjs.com/zh-Hans/features/ssr/) | [Display & Platform](https://vuetifyjs.com/zh-Hans/features/display-and-platform/) | [Application Layout](https://vuetifyjs.com/zh-Hans/features/application-layout/) | [组件总览](https://vuetifyjs.com/zh-Hans/components/all/) | [Playground](https://play.vuetifyjs.com/)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vuetify" target="_blank" rel="noopener noreferrer">Vuetify 测试题</a>


## GitHub 地址

[vuetifyjs/vuetify](https://github.com/vuetifyjs/vuetify) | [vuetifyjs/nuxt-module](https://github.com/vuetifyjs/nuxt-module)（官方 Nuxt 模块）| [vuetifyjs/eslint-plugin-vuetify](https://github.com/vuetifyjs/eslint-plugin-vuetify)（v2 → v3 迁移辅助）| [vuetifyjs/create-vuetify](https://github.com/vuetifyjs/create-vuetify)（官方脚手架）| [vite-plugin-vuetify](https://github.com/vuetifyjs/vuetify-loader)（按需引入插件）| [@mdi/font](https://github.com/Templarian/MaterialDesign-Webfont)（Material Design Icons 9000+ 图标）| [@date-io](https://github.com/dmtrKovalenko/date-io)（Date Adapter 多框架抽象）

## 学习路径

- [入门](./getting-started.md)：`pnpm create vuetify` 官方脚手架快速创建 / 手动安装到现有 Vue 3 项目 / `vite-plugin-vuetify` 自动导入 + Tree Shaking / `createVuetify({ components, directives })` 配置 / `main.ts` 注册 / 第一个 v-app + v-btn 示例 / Material Design Icons 集成（@mdi/font）/ 中文 i18n（zh-Hans locale）/ 暗色模式 defaultTheme / 全局默认值 createVuetify defaults / Nuxt 集成（@vuetify/nuxt-module）
- [指南](./guide-line.md)：**核心**：100+ 组件按类别速览（Application / Form / Data / Navigation / Layout / Feedback / Surfaces）/ **Form 完整**（v-form + v-text-field + v-select + v-autocomplete + v-checkbox + v-radio + rules 校验 + 与 vee-validate / Zod 集成）/ **Data Table 深度**（v-data-table / Server-side / Headers / Sorting / Filtering / Pagination / 自定义 slot）/ **Layout System**（v-app + v-app-bar + v-navigation-drawer + v-main + v-footer + 12 栅格 v-container/v-row/v-col）/ **Theme System**（Light/Dark / 多主题切换 / `useTheme` / SCSS 变量重写 / `<v-themeProvider>` 局部主题）/ **国际化 + RTL**（locale + zh-Hans + 与 vue-i18n 集成 + 动态切换）/ **Composables**（useDisplay / useTheme / useLocale / useDate / useRtl / useGoTo）/ **SSR + Nuxt 集成**（ssr: true / @vuetify/nuxt-module / Hydration mismatch）/ **与 Pinia / Vue Router 配合** / **常见踩坑**（v-app 必须包裹 / SSR 样式 / 主题切换 SCSS / 命令式 API 缺失）
- [参考](./reference.md)：**API 速查**：100+ 组件分类列表 / 常用组件 props（VBtn / VTextField / VSelect / VAutocomplete / VDataTable / VForm / VDialog / VSnackbar / VNavigationDrawer / VAppBar）/ `createVuetify` 选项（components / directives / theme / defaults / locale / date / ssr / display / icons）/ Theme API 类型 / Composables（useDisplay / useTheme / useLocale / useDate / useRtl / useGoTo）/ Display Breakpoints / Date Adapter / Icon sets / Labs 组件
