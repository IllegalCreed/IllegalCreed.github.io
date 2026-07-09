---
layout: doc
---

# Nuxt UI

**Nuxt 官方维护的现代 Vue UI 组件库**——由 **Nuxt 核心团队**（Pooya Parsa、Benjamin Canac、Sebastien Chopin 等）于 **2022 年** 开源、并由 NuxtLabs（现 Vercel）持续维护。Nuxt UI 是 **Nuxt 生态官方钦定 + 唯一的 Nuxt 团队 UI 库**，与 Nuxt Image、Nuxt Content、Nuxt Icon 一样**深度集成 Nuxt 全栈框架**。**最新稳定版 v4.x**（**2026 年 2 月** 发布、**v3 → v4 大重写**——**v3 仅一年寿命就被 v4 全面替代**）。**v4 史诗级重磅变更**：**Nuxt UI 与 Nuxt UI Pro 合并** —— 原本 **付费 $249 的 Nuxt UI Pro** 现在**完全免费 + 开源** + 全部 **125+ 组件合并到 `@nuxt/ui`**（含 Dashboard / Page / AuthForm / PricingPlans / ChatPrompt 等高级组件）+ **完整 Figma Kit** 也免费。**核心技术栈**：**Reka UI**（[Radix UI](https://www.radix-ui.com/) 的 Vue 版无样式 primitives 库，WAI-ARIA 合规 + 键盘导航 + 焦点管理 + Screen Reader 支持）+ **Tailwind CSS 4**（**v4 必需 Tailwind 4**，CSS-first `@theme` 配置 + 零 `tailwind.config.js`）+ **Tailwind Variants**（类型安全的样式变体系统）+ **TypeScript 优先**（Vue Generics + 全组件类型推导 + app.config.ts 类型安全主题）+ **Lucide Icons**（默认 Iconify 集合，200,000+ 图标可选）。**核心特性矩阵**：**`<UApp>` 必须包根组件**（Toast / Tooltip / 程序化 Overlay 必需）/ **v4 支持纯 Vue 项目（Vite + Inertia）**——通过 `@nuxt/ui/vite` 插件 + `@nuxt/ui/vue-plugin`，**不再绑死 Nuxt** / **125+ 组件分 12 类**（Elements / Forms / Data / Navigation / Overlays / Layout / Page / Dashboard / AI Chat / Editor / Content / Color Mode / i18n）/ **主题即配置对象**（`app.config.ts` 的 `ui` 字段 + 7 色语义化别名 `primary` / `secondary` / `success` / `info` / `warning` / `error` / `neutral`）/ **schema-based 表单校验**（**Standard Schema 规范**，支持 Zod / Valibot / Yup / Joi / Superstruct / Regle 五大主流库）/ **`UTable` 基于 [TanStack Table](https://tanstack.com/table)**（排序 / 筛选 / 分页 / 行选 / 列固定 / 虚拟化 / 列可见性 / 树形）/ **`useOverlay` 程序化打开 Modal / Slideover**（基于 Promise 返回结果）/ **`useToast` Composable**（替代 v3 全局 Toast API）/ **完美 SSR + 自动注册 `@nuxt/icon` / `@nuxt/fonts` / `@nuxtjs/color-mode`** / **50+ 语言 i18n + RTL**（`@nuxt/ui/locale` import） / **`UApp` 内置 OverlayProvider + ToastProvider + 主题注入** / **暗色模式自动切换**（`@nuxtjs/color-mode` 自动注册，`<html class="dark">` 类名驱动）/ **AI Chat 组件（v4 新）**（`<UChatPrompt>` / `<UChatMessage>` 配合 AI SDK v5 + Vercel `ai` 包）/ **Dashboard 模板（v4 新）**（`<UDashboardSidebar>` / `<UDashboardPanel>` / `<UDashboardSearch>` 全套布局）/ **`UAuthForm` 一行实现登录页**。**典型用户群**：**所有 Nuxt 项目的默认 UI 选择**（与 Nuxt 团队同体系、Nuxt 文档大量推荐）/ **新 Vue 3 + Vite 项目**（v4 后 Vue 支持成熟、可作为 Element Plus / Naive UI 的现代替代）/ **想要 Tailwind 风格 UI + 高质量组件**的设计驱动团队 / **AI 产品开发者**（v4 内置 AI Chat 组件 + 与 AI SDK 完美集成）/ **Vercel / Nuxt 生态偏好者**（NuxtLabs 收购 → Vercel）。**截至 2026 年的 v4.x** 是 **Nuxt 团队 + Vercel 资源加持下增长最快的 Vue UI 库**——配合 **2024-2025 Tailwind 4 重大重写 + Reka UI 成熟 + Pro 免费**三大红利，**Nuxt UI 正在快速追赶 Element Plus / Naive UI 的国内市占率**，是 **Vue 3 + Tailwind 风格** 项目最值得关注的选择。

## 评价

**优点**

- **Nuxt 官方背书**：Nuxt 团队亲自维护、Nuxt 官方文档处处推荐——是 **Nuxt 生态唯一官方钦定的 UI 库**，等价于 React 生态的 shadcn/ui 地位（虽然 shadcn 是社区项目）
- **v4 重磅：Pro 完全免费开源**：原本付费 **$249 的 Nuxt UI Pro 现在合并到 `@nuxt/ui` 完全免费 + 开源**——含 Dashboard（10 组件）/ Page（23 组件）/ AuthForm / PricingPlans / ChatPrompt（AI 8 组件）/ Editor（6 组件）等 80+ 高级组件，**等价于免费送你 $249 的中后台模板组件库**
- **基于 Reka UI（Radix 的 Vue 版）**：Reka UI 提供 **WAI-ARIA 合规 + 键盘导航 + 焦点管理 + Screen Reader** 等可访问性能力——**所有 Nuxt UI 组件天然 a11y 优秀**（vs Element Plus 历史遗留 a11y 弱项）
- **Tailwind 4 CSS-first 主题**：主题用 `@theme` CSS 指令（`--color-primary-500: ...`）+ `app.config.ts` 语义化别名（`primary` / `secondary` / `success` / `info` / `warning` / `error` / `neutral`）——**比 SCSS variables 更现代、Tailwind 4 是 2024-2025 大趋势**
- **125+ 组件覆盖完整业务场景**：Elements（16）+ Forms（20）+ Data（9）+ Navigation（8）+ Overlay（8）+ Layout（8）+ Page（23）+ Dashboard（10）+ AI Chat（8）+ Editor（6）+ Content（5）+ Color Mode（5）+ i18n（1）= **127 组件**——**单库覆盖中后台 / 营销页 / Dashboard / AI 产品 / 编辑器 / 多语言全部场景**
- **支持纯 Vue 项目（v4 新）**：通过 `@nuxt/ui/vite` 插件 + `@nuxt/ui/vue-plugin`，**Vite + Vue 3 + Inertia.js 项目可独立使用**——不再绑死 Nuxt（vs v3 只能 Nuxt 用，**v4 是真正的「Vue UI 库」**）
- **Standard Schema 表单校验**：`<UForm :schema="zodSchema">` 一行启用 Zod / Valibot / Yup / Joi / Superstruct / Regle 五大校验库——**统一接口、随时切换**（vs Element Plus 自带 async-validator 难配合 TS）
- **TanStack Table 集成**：`<UTable>` 基于业内最强的 [TanStack Table v8](https://tanstack.com/table)——排序 / 筛选 / 分页 / 行选 / 列固定 / 虚拟化 / 树形全部内置 + 列定义全类型推导
- **AI Chat 组件（v4 新）**：`<UChatPrompt>` / `<UChatMessage>` / `<UChatShimmer>` 配合 AI SDK v5 + Vercel `ai` 包——**直接搭出 ChatGPT 风格 AI 产品 UI**，比手写省 90% 工作
- **`useOverlay` 程序化 API**：`overlay.create(Modal).open(props)` 返回 Promise + `await result`——**比 Element Plus `ElMessageBox.confirm()` 更类型安全 + 任意自定义组件**
- **`useToast` Composable**：替代 v3 的全局 Toast、与 Vue 3 Composition API 一致——`const toast = useToast(); toast.add({ title, color })`
- **完美 SSR + Nuxt 全栈集成**：Nuxt 项目用 `modules: ['@nuxt/ui']` 一行集成，**自动注册 `@nuxt/icon` + `@nuxt/fonts` + `@nuxtjs/color-mode` 三个核心模块**——SSR / hydration / 自动暗色模式开箱即用
- **50+ 语言 i18n + RTL**：`import { en, zhCn } from '@nuxt/ui/locale'` + `<UApp :locale="zhCn">`——**支持阿拉伯文 / 希伯来文 RTL 双向**，比 Naive UI 30+ 语言更国际化
- **`<UAuthForm>` 一行实现登录页**：含 Email / Password / 社交登录按钮（Google / GitHub / Apple / Twitter）/ 第三方 OAuth Provider 切换——**SaaS 产品起步神器**
- **Lucide Icons + 200,000 Iconify**：默认 [Lucide](https://lucide.dev/)（Feather Icons 的现代分支），所有 `i-lucide-*` 类名直接用——也可装 `@iconify-json/{collection}` 接 [Iconify](https://iconify.design/) 200,000+ 图标
- **TypeScript 类型推导极致**：`app.config.ts` 配置类型推导、`v-model` / `slots` / `events` 全自动补全、Vue Generics 支持 `UTable<T>` 泛型——**Volar 体验是 Vue UI 库中最好的**
- **Vercel 资源加持**：[NuxtLabs 被 Vercel 收购](https://nuxtlabs.com/nuxtlabs-vercel)（2025 年）后，Nuxt UI 获得**专职团队 + Vercel 商业资源**——**长期维护更有保障**（vs Naive UI 主要依赖 07akioni 一人）
- **完整 Figma Kit**（**v4 免费**）：官方提供 Figma 组件库——**设计师可以直接拖组件出原型 + 开发者复用 Figma 设计**

**缺点**

- **v3 → v4 重大破坏性变更**：v3 仅一年寿命就被 v4 重写——`ButtonGroup` 改名 `FieldGroup` / `PageAccordion` 移除 / `useChat` 改成 `Chat` 类 / Form 校验器架构变化 / 多个组件 API 重新设计——**v3 项目升级 v4 工作量大**（详见[指南 > v3 → v4 迁移](./guide-line.md#v3-→-v4-迁移)）
- **Nuxt UI v4 必须 Nuxt 4**：Nuxt 项目升级 v4 必须先升级 Nuxt 框架到 v4——**Nuxt 3 项目不能直接用 Nuxt UI v4**（仍可用 Nuxt UI v3.x，但 v3 已停止新特性开发）
- **Tailwind 4 必装**：所有 Nuxt UI v4 项目必须装 `tailwindcss` 4.x、`@import "tailwindcss"` 入口——**已有 Tailwind 3 项目升级到 4 有破坏性变更**（@tailwind directives → CSS imports，PostCSS 配置等）
- **国内招聘市场起步**：相比 Element Plus 国内 70%+ 市占率 / Naive UI 已有一定基础——**Nuxt UI 国内招聘 / 中文教程 / 解决方案储备极少**（搜索量低 + 文章少）
- **Pro 组件依赖 Nuxt Content / AI SDK 等外部包**：Dashboard / Page / Content / AI Chat 组件需要配合 Nuxt Content / Nuxt Image / Vercel AI SDK 等其他包——**单装 `@nuxt/ui` 部分组件无法工作**
- **Reka UI 学习曲线**：底层是 [Reka UI](https://reka-ui.com/) primitives 而非自家 UI——遇到复杂自定义需要懂 Reka UI primitives API（vs Element Plus 单一组件库直接看官方文档）
- **样式覆盖只能通过 `ui` prop / `app.config.ts`**：组件样式调整必须用 `ui` prop（Tailwind Variants 的 slot 覆盖）—— **不能直接写 CSS 覆盖**（除非用 `:deep()` + class），思维方式不同于 Element Plus 的 SCSS 覆盖
- **组件 API 偏函数式 / TS 重**：`<UTable :columns="columns">` 中 `columns` 是 JS 对象数组（`cell: ({ row }) => h(UBadge, ...)`），不像 Element Plus `<el-table-column>` 模板写法——**对模板派开发者上手陡**
- **绑死 Tailwind 风格美学**：Nuxt UI 设计语言是 **Tailwind 默认风格 + Vercel 设计美学**——希望 Material Design / Ant Design 风格的团队需要深度主题化或选其他库
- **暗色模式策略与 Element Plus / Naive UI 不同**：Nuxt UI 用 `<html class="dark">` 类名驱动（Tailwind 4 darkMode: 'class'）——与 Naive UI `<n-config-provider :theme="darkTheme">` 不兼容
- **某些 Pro 组件需要付费 Vercel 集成**：例如 `<UPricingPlans>` 配合 Stripe / 支付集成、`<UAuthForm>` 配合 NextAuth.js / Lucia——**完整 SaaS 产品上线仍需付费第三方服务**
- **中文社区资源极少**：StackOverflow / 掘金 / 知乎 / B 站等中文社区 Nuxt UI 教程**几乎为零**——遇到问题完全依赖英文官方文档 + GitHub Discussion
- **vs Element Plus**：Element Plus **国内市场份额断层第一、组件 API 模板化、招聘市场绝对主流**；Nuxt UI **Tailwind 风格更现代、Nuxt 官方背书、a11y 优秀、AI / Dashboard 组件更完整**——**国内 Vue 中后台目前仍优先选 Element Plus、追求设计 + AI 时代选 Nuxt UI**
- **vs Naive UI**：Naive UI **设计品质 + TS 严格性 + 尤雨溪推荐 + CSS-in-JS 主题**；Nuxt UI **Tailwind 风格 + Nuxt 官方 + Reka UI 底层 + Pro 免费**——**纯 Vue 项目两者旗鼓相当**（设计风格 + 主题方案差异为主）
- **vs shadcn-vue**：[shadcn-vue](https://www.shadcn-vue.com/) 是 React shadcn/ui 的 Vue 移植（**复制源码到项目模式**）、同样基于 Reka UI + Tailwind 4——**Nuxt UI 是包 / shadcn-vue 是源码复制**，两者目标用户重叠（Tailwind 派开发者）但维护方式不同
- **vs Vuetify 3 / PrimeVue / Ant Design Vue**：Vuetify Material Design / PrimeVue Sakai 风格 / Antd Vue 海外项目优势——**Nuxt UI 是 Tailwind + Nuxt 派的最佳选择**

## 文档地址

[Nuxt UI 官网](https://ui.nuxt.com/) | [介绍](https://ui.nuxt.com/getting-started) | [Nuxt 安装](https://ui.nuxt.com/getting-started/installation/nuxt) | [Vue 安装](https://ui.nuxt.com/getting-started/installation/vue)（v4 新） | [主题](https://ui.nuxt.com/getting-started/theme) | [图标](https://ui.nuxt.com/getting-started/icons/nuxt) | [字体](https://ui.nuxt.com/getting-started/fonts/nuxt) | [暗色模式](https://ui.nuxt.com/getting-started/color-mode/nuxt) | [i18n](https://ui.nuxt.com/getting-started/i18n/nuxt) | [Content](https://ui.nuxt.com/getting-started/content/nuxt) | [v4 迁移](https://ui.nuxt.com/getting-started/migration/v4) | [组件总览](https://ui.nuxt.com/components) | [Composables](https://ui.nuxt.com/composables) | [模板](https://ui.nuxt.com/templates) | [Figma Kit](https://ui.nuxt.com/figma)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=nuxt-ui" target="_blank" rel="noopener noreferrer">Nuxt UI 测试题</a>


## GitHub 地址

[nuxt/ui](https://github.com/nuxt/ui)（主仓库，9k+ Star）| [unovue/reka-ui](https://github.com/unovue/reka-ui)（底层 Vue 无样式 primitives 库，原 Radix Vue）| [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)（Tailwind CSS 4）| [TanStack/table](https://github.com/TanStack/table)（UTable 底层）| [nuxt-themes/dashboard](https://github.com/nuxt-themes/dashboard)（Nuxt UI Dashboard 模板） | [nuxt/icon](https://github.com/nuxt/icon)（图标模块，自动注册） | [nuxt/fonts](https://github.com/nuxt/fonts)（字体模块，自动注册） | [nuxtjs/color-mode](https://github.com/nuxt-modules/color-mode)（暗色模式，自动注册）

## 学习路径

- [入门](./getting-started.md)：`pnpm add @nuxt/ui tailwindcss` 安装 / **Nuxt 项目集成**（`modules: ['@nuxt/ui']` + `app.config.ts` 一行）/ **纯 Vue 项目集成 v4 新**（`@nuxt/ui/vite` 插件 + `@nuxt/ui/vue-plugin` + `<UApp>` 包根）/ **Tailwind 4 必装**（`@import "tailwindcss"` + `@import "@nuxt/ui"`）/ 第一个 UButton / UInput / UForm + Zod 校验 / **必须懂的概念**：`<UApp>` 包根（Toast / Tooltip / Overlay 必需）/ 主题 7 色别名（primary / secondary / success / info / warning / error / neutral）/ Lucide 图标 + `i-lucide-*` 命名 / 暗色模式（`<html class="dark">` 自动切换）/ TypeScript 基础（`FormSubmitEvent`、`TableColumn<T>`、`DropdownMenuItem`）
- [指南](./guide-line.md)：**核心**：125+ 组件按 12 大类速览 / **`<UForm>` 深度**（Standard Schema 规范 + Zod / Valibot / Yup / Joi / Superstruct + 自定义校验 + 嵌套表单 + 程序化提交 + onError 事件）/ **`<UTable>` 深度**（TanStack Table v8 + columns 定义 + 排序 / 筛选 / 分页 / 行选 / 列固定 / 虚拟化 / 树形 + `cell: ({ row }) => h(...)` 自定义渲染）/ **Overlay 全套**（UModal + USlideover + UDrawer + UPopover + `useOverlay` 程序化 API + Promise 返回） / **useToast** Composable（替代 v3 全局 API） / **主题深度**（`app.config.ts` 完整结构 + Tailwind 4 `@theme` 自定义颜色 + 组件 `ui` prop slot 覆盖 + Tailwind Variants 完整 API）/ **i18n + RTL**（`@nuxt/ui/locale` 50+ 语言 + 自定义 locale + RTL 双向）/ **AI Chat 组件**（UChatPrompt + UChatMessage + AI SDK v5 集成）/ **Dashboard 模板**（UDashboardSidebar + UDashboardPanel + UDashboardSearch 全套）/ **UAuthForm 一行登录页** / **暗色模式深度**（`@nuxtjs/color-mode` 自动注册 + useColorMode + ColorModeButton）/ **与 Vue Router + Pinia 集成** / **Reka UI primitives 直接使用** / **v3 → v4 迁移** / **常见踩坑**（Tailwind 4 必装 + Nuxt 4 必须 + UApp 包根 + `class="isolate"` Vue index.html 必须）
- [参考](./reference.md)：**API 速查**：125+ 组件分类列表 / 常用组件 props 速查表（UButton / UInput / UForm / UFormField / UTable / UModal / USlideover / UDropdownMenu / USelect / USelectMenu / UCheckbox / URadioGroup / USwitch / UTabs / UTooltip / UPagination） / **`<UApp>` 完整 props** / **`useToast` / `useOverlay` / `useColorMode` / `useLocale` 签名** / **`defineAppConfig` 主题完整结构** / **TypeScript 类型**（FormSubmitEvent / FormError / TableColumn / DropdownMenuItem / NavigationMenuItem / SelectItem） / **Tailwind Variants slot 列表** / **Lucide / Iconify 图标包对照表** / **50+ 语言列表**
