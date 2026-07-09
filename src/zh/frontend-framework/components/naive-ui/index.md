---
layout: doc
---

# Naive UI

**Vue 3 设计驱动的现代 UI 组件库，被 Vue 作者尤雨溪公开推荐**——由中国自动驾驶卡车公司 **图森未来（TuSimple，TUSEN AI）** 前端团队 **07akioni**（双越）等人于 **2020 年 9 月** 开源、并由活跃社区共同维护。Naive UI 是「**首个 100% TypeScript 编写**」的主流 Vue 3 UI 库——从源码、主题系统、Props 类型到组件实例方法**全栈类型安全**，配合 Volar / vue-tsc **零 `@types/*` 包** 即可获得完整 IDE 智能提示。**最新稳定版 v2.44.1**（2026 年 3 月发布），**90+ 组件** 覆盖 Basic / Form / Data Display / Navigation / Feedback / Layout 全部业务场景，**Tree Shaking 极佳**（不引入任何用不到的代码）+ **无需 CSS 预处理器**（主题系统纯 TS / JS 对象，运行时动态变更）+ **内置暗色模式 + 200+ Discord 风格图标 + 完整国际化（30+ 语言）**。**核心特性矩阵**：**`<n-config-provider>` 必须包根组件**（locale / theme / themeOverrides 全部从这里注入，类似 React Context）/ **CSS-in-JS 运行时主题**（基于 [css-render](https://css-render.org/)，主题对象就是 TS 对象、直接传给 `theme-overrides`，**无需重新编译 CSS**） / **`useMessage` / `useDialog` / `useNotification` / `useLoadingBar` 命令式 Composable**（必须在对应 Provider 内调用，类似 React Hooks）/ **`darkTheme` + `lightTheme` 主题对象** 直接 import 切换/ **`zhCN` + `dateZhCN` 中文 locale + date-fns 时间本地化** / **完美 SSR + Nuxt 模块**（`nuxtjs-naive-ui` 一行集成 / 内置 [@css-render/vue3-ssr](https://github.com/07akioni/css-render) 处理 hydration mismatch）/ **`unplugin-vue-components` + `NaiveUiResolver` 自动按需引入** / **DataTable 支持虚拟滚动（`virtual-scroll`）+ 树形表格 + CSV 导出 + 列拖拽** / **Form `path`（点路径）+ async-validator 校验** / **`useOsTheme` 自动跟随 OS 主题切换**。**典型用户群**：追求**设计品质 + TypeScript 严格性 + 现代极简风格**的新项目 / **Vue Mastery、VueConf、Anthony Fu 等社区演示首选** / **B 端管理后台希望摆脱 Element Plus「企业气」**的团队 / **[naive-ui-admin](https://github.com/jekip/naive-ui-admin) 国内最流行的 Naive UI 中后台模板**（GitHub 8k+ Star，免费商用）/ **[Pro Naive UI](https://github.com/zheng-changfu/pro-naive-ui) 中后台二次封装**——国内中后台市场正在从 Element Plus 向 Naive UI **缓慢迁移**。**截至 2026 年的 v2.44.x** 处于「**积极迭代期**」（v2.44 仍在 2026 年 3 月发布新功能 / 修复，与 Element Plus 进入稳定平台不同）——这是「**最现代、最 TS-first**」的 Vue 3 UI 库选择。

## 评价

**优点**

- **尤雨溪公开推荐**：Vue 作者尤雨溪在 [推特](https://twitter.com/youyuxi/status/1379846518316212229) 和 Vue Mastery 课程中公开推荐 Naive UI——这种**框架作者背书**是 Vue 3 UI 库生态中**最有分量的认可**，Element Plus / Ant Design Vue 都没有得到这种级别的推荐
- **100% TypeScript 编写**：源码 68.7% TS + 30.9% Vue（基本无 JS）——**第一个完全 TS-first 的主流 Vue 3 UI 库**，组件 props / events / 实例方法、主题对象、locale 全部强类型，**无需额外 `@types/naive-ui`**
- **主题系统革命**：主题就是**纯 TS 对象**（`GlobalThemeOverrides`）—— `<n-config-provider :theme-overrides="{...}">` 一行运行时切换主题，**不需要 CSS / SCSS 预处理器、不需要重新编译、不需要 CSS 变量**——是 Vue UI 库中**最现代的主题方案**（vs Element Plus 的 SCSS-only / CSS Variables 双轨）
- **90+ 组件覆盖完整业务场景**：Basic（Button / Layout / Icon）+ Form（Input / Select / DatePicker / Form 校验）+ Data Display（DataTable 含虚拟滚动 / Tree / Pagination / Statistic）+ Navigation（Menu / Breadcrumb / Tabs）+ Feedback（Modal / Drawer / Message / Notification / LoadingBar）—— **几乎所有中后台 CRUD 场景开箱即用**
- **`<n-config-provider>` 中央化全局配置**：locale / theme / themeOverrides / hljs / icon / 组件 defaults 全部从这里注入——**类似 React Context 但是 Vue 友好**，整个 App 的全局风格只在这一处声明
- **`useMessage` / `useDialog` / `useNotification` / `useLoadingBar`** **命令式 Composable**：调用 `const message = useMessage()` 后用 `message.success('...')`——比 Element Plus 全局静态 `ElMessage.success(...)` 更 Vue 3 风格、与 Composition API 一致
- **CSS-in-JS 运行时主题**：基于自研 [css-render](https://css-render.org/)，主题切换**零 CSS 重排**——动态多主题、品牌色配置面板、暗色 / 亮色切换全部丝滑（vs Element Plus CSS Variables 批量切换的重绘成本）
- **Tree Shaking 极佳**：相比 Element Plus 同等场景 bundle ~500KB+，Naive UI 通常 **~250KB**——按需引入 + CSS-in-JS 没有冗余 CSS、生产 bundle 小
- **完美 SSR + Nuxt 模块**：`nuxtjs-naive-ui` 模块一行集成、自动处理 hydration mismatch（基于 `@css-render/vue3-ssr` 收集 critical CSS 注入到 HTML head）—— **SSR 体验在 Vue UI 库中数一数二**
- **内置暗色模式**：`import { darkTheme } from 'naive-ui'` + `<n-config-provider :theme="darkTheme">` 一行启用——所有组件自动切换，**无需 import 暗色 CSS / 加 `<html class="dark">`**
- **`useOsTheme` Composable**：`const osTheme = useOsTheme()` 返回响应式 OS 主题（`'light' | 'dark'`）——**配合 computed 一行实现「跟随系统切换主题」**
- **完整国际化（30+ 语言）**：`zhCN` / `enUS` / `jaJP` / `koKR` / `frFR` / `arAR` 等 30+ 语言包 + **date-fns 时间本地化**（`dateZhCN` 等）—— `<n-config-provider :locale="zhCN" :date-locale="dateZhCN">` 一键切换
- **设计美学 Discord 风格**：默认配色、圆角、间距、阴影、动画都很**克制现代**——**不是「企业管理后台」风**，适合 C 端产品 / 设计驱动的 B 端 / 极简后台
- **DataTable 强大且现代**：内置**虚拟滚动**（`virtual-scroll`，10 万行不卡）、树形表格、列拖拽排序、列固定、合并单元格、CSV 导出——**单组件覆盖 ElTable + ElTableV2 两个组件的能力**
- **持续活跃迭代**：截至 2026 年 v2.44.x 仍在频繁迭代（最近一次 release 在 2026 年 3 月）—— 比 Element Plus 进入「稳定演进期」更活跃
- **完整中英文文档 + Playground**：[www.naiveui.com](https://www.naiveui.com/) 提供中文 + 英文双语 + 在线编辑器、API 表格清晰、示例可改可跑——**文档质量与 Element Plus 持平**

**缺点**

- **国内招聘市场仍是少数派**：Element Plus 在国内 Vue 3 中后台市场份额 **70%+**、Naive UI 起步增长中——**新人招聘、培训、面试题、解决方案储备远不如 Element Plus**（大厂面试官可能没用过）
- **生态相对小**：与 Element Plus 周边的 `element-plus-admin`、`vue-element-admin`、`element-pro-components` 等丰富生态相比，**Naive UI 的 admin 模板 / 二次封装方案数量明显少**（主要是 `naive-ui-admin` 和 `pro-naive-ui`）
- **`<n-config-provider>` 必须包根组件**：所有 Naive UI 组件**必须在 `<n-config-provider>` 内**才能正常工作（否则主题 / locale / Message 等不生效）—— **新人容易漏掉**，是初学者最高频的坑
- **Provider Pattern 嵌套层数多**：使用 Message / Dialog / Notification / LoadingBar 需要分别嵌套 `<n-message-provider>` / `<n-dialog-provider>` / `<n-notification-provider>` / `<n-loading-bar-provider>` —— 比 Element Plus 全局静态 `ElMessage` 写法**多 4 层标签**（社区有 `naive-ui-discrete-api` 解决方案，见指南）
- **`useMessage` 在 setup 外不能调用**：`useMessage()` 是 Composable、**必须在 setup 函数内调用**——在 Vue Router 守卫、Pinia store、原生 JS 函数中**不能直接用**（解决方案：用 `createDiscreteApi` 或 Provider 暴露 ref 给外部）
- **CSS-in-JS 运行时性能**：动态主题切换零 CSS 重排是优势，但**首屏渲染时 css-render 计算 + 注入 style 标签**的开销略大于纯静态 CSS（vs Element Plus 预编译 CSS）—— 极致首屏优化场景需要权衡
- **DataTable column 配置只能 JS 对象**：列定义只能用 `columns` 数组 + JS 对象（而非 ElTable 的 `<el-table-column>` 模板写法）—— **slot 写法仍可用 `render` 函数**、但相比 ElTable 模板插槽稍麻烦
- **图标包独立**：内置图标极少（仅 Discord 风格小图标），实际使用必须 `pnpm add @vicons/ionicons5`（或其他 [xicons](https://github.com/07akioni/xicons) 系列）——**比 `@element-plus/icons-vue` 一个包到位的方案多一步选型**
- **中文社区资源少**：StackOverflow / 掘金 / 知乎 / B 站等中文社区 Naive UI 教程 / 踩坑文章数量**远少于 Element Plus**——遇到问题更依赖 GitHub Issue + 英文官方文档
- **vs Element Plus**：Element Plus **国内市场份额断层第一、生态完整、招聘市场主流**；Naive UI **设计品质 + TS 严格性 + 现代主题系统更先进、活跃度更高、尤雨溪推荐**——**选 Element Plus 还是 Naive UI 是 Vue 3 UI 库选型的核心问题**：稳定 / 招聘优先选 Element Plus，新项目 / 设计驱动 / TS 严格选 Naive UI
- **vs Vuetify 3**：Vuetify 严格遵循 Material Design、海外项目多；Naive UI **Discord 风格更现代、中文友好**——**Vuetify 移动端友好、Naive UI 桌面端中后台更合适**
- **vs Ant Design Vue**：Ant Design Vue 是 Ant Design Team 的 Vue 实现（**社区维护**）、设计语言与 React Antd 一致、**国际化项目优势**；Naive UI **国内血统 + TS 更严格 + 主题系统更现代**——海外 / 与 React Antd 共存项目选 Antd Vue，纯 Vue 项目选 Naive UI
- **vs Headless UI / shadcn-vue + Tailwind**：Headless 方案给你**最大设计自由度**但需自己写样式；Naive UI 给你**开箱即用 90+ 组件 + 主题对象覆盖**——**选 Naive UI 的前提是接受默认设计语言**（虽然主题可深度定制、但仍是 Naive UI 的设计骨架）

## 文档地址

[Naive UI 官网](https://www.naiveui.com/zh-CN/) | [介绍](https://www.naiveui.com/zh-CN/os-theme) | [安装](https://www.naiveui.com/zh-CN/os-theme/docs/installation) | [开始使用](https://www.naiveui.com/zh-CN/os-theme/docs/usage) | [按需引入](https://www.naiveui.com/zh-CN/os-theme/docs/import-on-demand) | [定制主题](https://www.naiveui.com/zh-CN/os-theme/docs/customize-theme) | [国际化](https://www.naiveui.com/zh-CN/os-theme/docs/i18n) | [服务端渲染](https://www.naiveui.com/zh-CN/os-theme/docs/ssr) | [Nuxt.js](https://www.naiveui.com/zh-CN/os-theme/docs/nuxtjs) | [组件总览](https://www.naiveui.com/zh-CN/os-theme/components) | [Playground](https://www.naiveui.com/zh-CN/os-theme/playground)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=naive-ui" target="_blank" rel="noopener noreferrer">Naive UI 测试题</a>


## GitHub 地址

[tusen-ai/naive-ui](https://github.com/tusen-ai/naive-ui)（主仓库，18.3k Star）| [07akioni/xicons](https://github.com/07akioni/xicons)（图标系列：ionicons5 / antd / carbon / fa 等）| [07akioni/css-render](https://github.com/07akioni/css-render)（Naive UI 主题系统底层 CSS-in-JS 引擎）| [07akioni/vfonts](https://github.com/07akioni/vfonts)（推荐字体包，Inter / Fira Code）| [nuxtjs-naive-ui](https://github.com/07akioni/nuxtjs-naive-ui)（Nuxt 模块）| [jekip/naive-ui-admin](https://github.com/jekip/naive-ui-admin)（国内最流行 Naive UI 中后台模板，8k+ Star）| [zheng-changfu/pro-naive-ui](https://github.com/zheng-changfu/pro-naive-ui)（中后台二次封装）

## 学习路径

- [入门](./getting-started.md)：`pnpm add naive-ui vfonts` 安装 / 第一个 `<n-config-provider>` 包根 + 第一个 `<n-button>` / `unplugin-vue-components` + `NaiveUiResolver` 自动按需引入零样板 / **必须懂的概念**：Provider Pattern（n-config-provider / n-message-provider / n-dialog-provider 嵌套） / 中文 i18n（`zhCN` + `dateZhCN`）/ 暗色模式（`darkTheme` 一行启用 + `useOsTheme` 跟随系统）/ TypeScript 基础（`GlobalTheme` / `GlobalThemeOverrides` 类型）/ 图标方案（`@vicons/ionicons5` + `<n-icon>` 包裹）/ 与 Vue Router + Pinia 集成
- [指南](./guide-line.md)：**核心**：90+ 组件按类别速览（Basic / Common / Layout / Navigation / Data / Input / Feedback）/ **`<n-form>` 深度**（model + rules + async-validator + 嵌套 path + 动态校验 + 校验模式 + Promise 风格） / **`<n-data-table>` 深度**（columns 数组 + 排序 / 筛选 / 树形 / 虚拟滚动 / 固定列 / 行选择 / CSV 导出 / 列拖拽 / `render` 函数自定义渲染） / **反馈四件套**（`useMessage` / `useDialog` / `useNotification` / `useLoadingBar` 完整 API + 必须包 Provider） / **`<n-modal>` / `<n-drawer>`** 容器组件 / **主题深度**（`GlobalThemeOverrides` 完整结构 + 暗色定制 + 多主题切换 + `peers` 嵌套组件主题）/ **`createDiscreteApi` 脱离 Provider**（在 Vue Router 守卫 / Pinia store / 工具函数中调用 Message） / **国际化深度**（`zhCN` + `dateZhCN` 同步 + vue-i18n 集成）/ **SSR 完整方案**（Nuxt 模块 + Vite SSG + 手动 `@css-render/vue3-ssr` 收集 critical CSS）/ **TypeScript 推导**（GlobalThemeOverrides 自动补全 / DataTable column 类型推导）/ **与 Vue Router + Pinia 集成** / **常见踩坑**（必须 NConfigProvider 包根 / useMessage 在 setup 外报错 / SSR hydration mismatch / DataTable 列写法陷阱）
- [参考](./reference.md)：**API 速查**：90+ 组件分类列表 / 常用组件 props 速查表（NButton / NInput / NForm / NFormItem / NDataTable / NModal / NDrawer / NMenu / NPagination / NTabs / NSelect / NDatePicker） / **`<n-config-provider>` 完整选项** / **`useMessage` / `useDialog` / `useNotification` / `useLoadingBar` 签名** / **`createDiscreteApi` 签名** / **TypeScript 类型**（GlobalTheme / GlobalThemeOverrides / FormInst / DataTableInst / MessageReactive） / **主题对象结构**（每组件的 `themeOverrides` key 列表） / **30+ 语言包列表** / **xicons 图标包对照表**
