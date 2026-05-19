---
layout: doc
---

# Element Plus

**Vue 3 后台 UI 组件库的中文社区事实标准**，由 **饿了么前端团队**主导、**社区维护**——是 **Element UI**（Vue 2 时代国内最流行的桌面端组件库）的 Vue 3 后继者。Element Plus 由 **饿了么前端团队**于 **2020 年 9 月** 启动开发（与 Vue 3.0 正式发布同期），核心目标是「**把 Element UI 完整搬到 Vue 3 + Composition API + TypeScript**」——团队成员包括 **三咲智子**（Sxzz，Vue 核心团队成员、unplugin 作者）等社区开发者。Element UI 在 Vue 2 时代占据国内中后台市场 **70%+** 的份额，Element Plus 自然成为 **Vue 3 中后台 UI 库的默认选择**。**最新稳定版 v2.x**（截至 2026 年的 **v2.14+**，已发布数百个 minor / patch 版本），完全基于 **Vue 3.x + TypeScript 5+** 重写、API 与 Element UI 基本兼容但 **核心实现完全重写**（Options API → Composition API + setup script、CSS Variables 替代 SCSS-only 主题）。**核心特性矩阵**：**80+ 组件**（覆盖 Basic / Configuration / Form / Data / Navigation / Feedback / Others 七大类）/ **完整 TypeScript 类型**（每个组件、props、slot、emit 都有 TS 类型 + Volar 智能提示，无需额外 `@types/element-plus`）/ **按需引入零样板**（`unplugin-vue-components` + `ElementPlusResolver` 自动按需，无需手写 import）/ **CSS Variables + SCSS 双轨主题**（`--el-color-primary` 运行时动态切换 + `@forward` SCSS 编译期定制）/ **内置暗色模式**（`<html class="dark">` + `element-plus/theme-chalk/dark/css-vars.css` 一行启用，配合 VueUse `useDark` 自动跟随系统）/ **完整 i18n**（60+ 语言包，`ElConfigProvider :locale="zhCn"` 一键切换）/ **`ElConfigProvider` 全局配置**（locale / size / namespace / button defaults / message defaults 等）/ **`ElIcon` + `@element-plus/icons-vue`**（独立图标包、按需 import）/ **完美 SSR 支持**（`ID_INJECTION_KEY` / `ZINDEX_INJECTION_KEY` + `<ClientOnly>` 处理 Teleport）/ **Nuxt 模块**（`@element-plus/nuxt` 零配置 SSR）/ **`v-loading` 指令** + **`ElLoading.service`** 程序式 API / **`ElMessage` / `ElMessageBox` / `ElNotification`** 三大反馈 API（命令式 Promise 风格）/ **`ElTable` + `ElTableColumn`** 表格深度封装（支持排序 / 筛选 / 多选 / 树形 / 虚拟化 / 合并单元格）/ **`ElForm` + `ElFormItem` + async-validator** 完整表单 + 校验。**典型用户群**：99% 的国内 Vue 3 中后台项目 / Vue Router + Pinia + Element Plus 「Vue 3 后台御三家」/ `vue-element-admin` Vue 3 版本（Element UI 时代的国民模板）/ **几乎所有国内 Vue 3 SaaS / ERP / CRM / 管理后台** —— 国内中后台市场占有率 **断层第一**。**截至 2026 年的 v2.14+** 处于「**稳定演进期**」，新增组件（Mention / Splitter / Tour / Statistic 等）和 API 增强为主，**核心组件 API 已高度稳定**——这是 Vue 3 后台项目最稳定可靠的选择。

## 评价

**优点**

- **国内 Vue 3 后台市场断层第一**：饿了么团队 + 社区维护，**Element UI 时代积累的 70%+ 市场份额无缝迁移到 Element Plus**——招聘、培训、面试、文档、问答全部围绕 Element Plus，新人上手成本极低
- **80+ 组件覆盖完整业务场景**：Basic（Button / Layout / Icon）+ Form（Input / Select / Date Picker / Form 校验）+ Data（Table / Tree / Pagination）+ Navigation（Menu / Breadcrumb / Tabs）+ Feedback（Dialog / Drawer / Message / Loading）+ Others（Divider / Watermark）——**几乎所有中后台 CRUD 场景开箱即用**
- **完整 TypeScript 类型 + Volar 智能提示**：每个组件 props / events / slots 都有 TS 声明，`<ElTable>` 列定义、`<ElForm>` rules 都能在模板中获得完整提示 + 红线报错，**无需额外 `@types/*` 包**
- **按需引入零样板**：`unplugin-vue-components` + `ElementPlusResolver` 一次配置后，**组件无需 import、CSS 自动注入按需**——Tree Shaking 优秀、最终 bundle 只含用到的组件
- **CSS Variables + SCSS 双轨主题**：`--el-color-primary` **运行时**动态切换（暗色模式 / 多主题）+ `@forward` `theme-chalk/src/common/var.scss` **编译期**深度定制——两种方案灵活组合
- **内置暗色模式**：导入 `theme-chalk/dark/css-vars.css` + `<html class="dark">` 一行启用，配合 VueUse `useDark()` 自动跟随系统 `prefers-color-scheme` —— **零额外 CSS**
- **国际化 60+ 语言包**：从中文（简体/繁体/香港/澳门）到拉丁语 / 法语 / 阿拉伯语全覆盖，`ElConfigProvider :locale="zhCn"` 一键切换——日期选择器、表格、分页器的本地化字符串全部到位
- **`ElConfigProvider` 全局配置中心**：locale / size / zIndex / namespace / button / message / dialog defaults 集中管理，**整个 App 的全局风格只在这一处声明**
- **命令式 API 设计优雅**：`ElMessage.success('已保存')` / `await ElMessageBox.confirm('确定删除？')` —— **Promise 风格让异步交互写起来像同步代码**，比 React 的 Modal 组件 + state 管理简洁
- **`ElTable` 是国内中后台表格的事实标准**：支持排序 / 筛选 / 多选 / 树形 / 合并单元格 / 固定列 / 虚拟化（`ElTableV2`）—— **CRUD 表格场景一统江湖**
- **`ElForm` + async-validator 完整表单方案**：`<ElForm :model="form" :rules="rules">` + `<ElFormItem prop="email">` + 提交时 `formRef.value.validate()` —— **声明式 + 命令式校验完美结合**
- **完美 SSR + Nuxt 集成**：`@element-plus/nuxt` 模块零配置启用 SSR、自动按需引入、自动处理 Teleport hydration
- **`@element-plus/icons-vue` 独立图标包**：~700 个图标、按需 import、与 `<ElIcon>` 配合 + 加 `class="is-loading"` 即可旋转——**比内置字体图标更现代**
- **持续迭代 + 活跃社区**：每月数次 patch 发布，2026 年仍是「**稳定演进期**」——新增 Splitter / Tour / Mention / Statistic 等组件、修复 SSR / 暗色模式 bug
- **完整中文文档**：[element-plus.org/zh-CN](https://element-plus.org/zh-CN/)——**中文官方文档质量极高**、示例完整、API 表格清晰，国内开发者无英文壁垒

**缺点**

- **设计风格偏「企业管理后台」**：默认主题是「饿了么蓝 `#409EFF`」+ 中规中矩的卡片式布局，**不适合做面向 C 端的现代营销页 / 设计驱动产品**（这类场景应该选 Naive UI / Vant / 纯 Tailwind）
- **bundle 偏大**：即使按需引入，单组件平均 ~20-50KB（已 gzip）—— 引入 `ElForm` + `ElTable` + `ElDatePicker` 等重量级组件后整体 bundle 容易达到 **500KB+**（vs Naive UI 同等场景 ~250KB）
- **`unplugin-vue-components` 按需引入有 SSR 坑**：Nuxt + 自定义按需配置时，**ElMessage / ElLoading 等命令式 API 不会自动 import**——必须手动 `import { ElMessage } from 'element-plus'` 否则报 `not defined`
- **CSS 优先级问题**：组件 CSS 用 BEM `el-button--primary` 命名空间，**覆盖默认样式时**经常需要 `!important` 或更高的选择器特异性
- **`ElTable` 性能瓶颈**：数据量超 **1000 行**时 DOM 节点爆炸 + 卡顿 —— 必须切换到 `ElTableV2`（虚拟化版本），但 `ElTableV2` 与 `ElTable` API 不兼容、需要重写
- **`ElForm` 嵌套校验麻烦**：嵌套对象 `form.address.city` 校验时 `prop="address.city"` + 自定义 validator —— 比 `vee-validate` / `react-hook-form` 的嵌套支持笨重
- **主题切换运行时性能**：`--el-color-primary` 大批量 CSS 变量切换时 **重排重绘成本**不可忽略——多主题场景建议预编译多套 CSS + 动态切 stylesheet
- **`ElIcon` 必须包裹 `<ElIcon>`**：每个图标需要 `<el-icon><Edit /></el-icon>` 包裹才能控制 size/color —— **比 unplugin-icons 的 `<i class="i-carbon-edit">` 写法繁琐**
- **暗色模式自定义繁琐**：默认暗色变量与品牌色搭配可能冲突 —— 必须 `@forward 'element-plus/theme-chalk/src/dark/var.scss' with (...)` 手动覆盖每个变量
- **vs Vuetify / Quasar / PrimeVue**：Element Plus 偏「**企业管理后台**」、视觉风格保守；Vuetify 偏「**Material Design**」严格遵循 Material 规范；Quasar 偏「**跨平台**」（Web + Mobile + Electron 统一组件）；PrimeVue 偏「**通用功能完整**」；**Element Plus 在国内 Vue 3 中后台领域无敌、但跨国项目可能不如 Vuetify / PrimeVue 国际化生态强**
- **vs Naive UI**：Naive UI 由 [TuSimple](https://github.com/tusen-ai)（图森未来）前端负责人 **07akioni** 维护，**TypeScript-first + 主题系统更现代**（基于 ConfigProvider 完全可定制）；Element Plus **生态更老、文档更全、社区更大**；**Naive UI 适合追求设计品质 + TS 严格的新项目；Element Plus 适合招聘、稳定性、生态优先的企业项目**
- **vs Ant Design Vue**：Ant Design Vue 是 Ant Design Team 的 Vue 实现（**官方非阿里维护**、社区为主），**设计语言一致 + 国际化好**；Element Plus **国内市场份额大幅领先**、Ant Design Vue **国际化项目更有优势**——选择主要看团队习惯 / 设计语言偏好
- **vs Tailwind CSS + Headless UI**：Tailwind + Headless UI 的「**utility-first + 无样式组件**」哲学与 Element Plus 完全相反—— Tailwind 适合**高度定制设计驱动产品**，Element Plus 适合**快速搭建 CRUD 后台**；**两者不可相互替代、应该按场景选**

## 文档地址

[Element Plus 官网](https://element-plus.org/zh-CN/) | [设计原则](https://element-plus.org/zh-CN/guide/design.html) | [安装](https://element-plus.org/zh-CN/guide/installation.html) | [快速开始](https://element-plus.org/zh-CN/guide/quickstart.html) | [主题](https://element-plus.org/zh-CN/guide/theming.html) | [暗黑模式](https://element-plus.org/zh-CN/guide/dark-mode.html) | [国际化](https://element-plus.org/zh-CN/guide/i18n.html) | [SSR](https://element-plus.org/zh-CN/guide/ssr.html) | [组件总览](https://element-plus.org/zh-CN/component/overview.html) | [Playground](https://element-plus.org/zh-CN/playground)

## GitHub 地址

[element-plus/element-plus](https://github.com/element-plus/element-plus) | [@element-plus/icons-vue](https://github.com/element-plus/element-plus-icons) | [@element-plus/nuxt](https://github.com/element-plus/element-plus-nuxt) | [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components)（按需引入插件）| [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import)（API 自动导入）| [element-plus-vite-starter](https://github.com/element-plus/element-plus-vite-starter)（官方 Vite 模板）

## 学习路径

- [入门](./getting-started.md)：`pnpm add element-plus` 安装 / `app.use(ElementPlus)` 全量引入 / `unplugin-vue-components` + `ElementPlusResolver` 按需引入零样板 / 第一个 ElButton / ElInput / ElForm 示例 / `tsconfig.json` 添加 `element-plus/global` 类型 / SCSS 主题变量入门 / 暗色模式一行启用 / 中文 i18n（`zhCn` locale）/ `@element-plus/icons-vue` 图标 / ElConfigProvider 全局配置
- [指南](./guide-line.md)：**核心**：80+ 组件按类别速览（Basic / Form / Data / Navigation / Feedback / Others）/ **ElForm 深度**（model + rules + async-validator + 嵌套校验 + 动态校验 + 提交模式 + scroll-to-error）/ **ElTable 深度**（columns / 排序 / 筛选 / 多选 / 树形 / 固定列 / 合并 / formatter / 自定义 slot / ElTableV2 虚拟化）/ **反馈三件套**（ElMessage / ElMessageBox / ElNotification 完整 API + Promise 模式）/ **ElDialog / ElDrawer** 容器组件 / **主题深度**（SCSS 变量 `@forward` + CSS 变量 `:root` + 命名空间 namespace）/ **暗色模式完整方案**（导入 dark css + VueUse `useDark` + 自定义暗色变量）/ **按需引入完整配置**（Vite + Webpack + Nuxt + Resolver）/ **国际化**（ElConfigProvider locale + Day.js 本地化）/ **SSR 深度**（ID_INJECTION_KEY + ZINDEX_INJECTION_KEY + Teleport ClientOnly）/ **`v-loading` 指令 + ElLoading.service** / **`ElIcon` + 图标管理** / **`ElConfigProvider` 全局配置完整选项** / **与 Vue Router + Pinia 集成** / **常见踩坑**（按需引入失败 / 主题不生效 / SSR hydration mismatch / ElTable 性能 / 嵌套校验）
- [参考](./reference.md)：**API 速查**：80+ 组件分类列表 / 常用组件 props 速查表（ElButton / ElInput / ElForm / ElFormItem / ElTable / ElTableColumn / ElDialog / ElDrawer / ElMenu / ElPagination / ElTabs / ElSelect / ElDatePicker）/ ElConfigProvider 完整选项 / 命令式 API（ElMessage / ElMessageBox / ElNotification / ElLoading）签名 / 指令（`v-loading` / `v-infinite-scroll`）/ CSS 变量 / SCSS 变量入口 / 主题命名空间 / TypeScript 类型（FormInstance / FormRules / TableInstance / ElMessageOptions）/ 工具函数（useId / useNamespace 等内部 composable）
