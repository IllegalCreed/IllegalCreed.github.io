---
layout: doc
---

# Vant UI

**Vue 3 移动端 H5 组件库的中文社区事实标准**，由 **有赞前端团队**（YouZan，国内 SaaS 电商服务商）于 **2017 年**开源、目前由 **有赞团队** + **Rsbuild / Rspack 团队**（同样属字节-有赞-社区交叉维护体系）+ 数百位社区开发者维护——核心维护者 **chenjiahan**（Vant 创始人、Rsbuild 作者）等。Vant 是「**最早、最完整、最贴近国内移动端电商场景**」的 Vue UI 库，**Vue 2 时代国内移动端 H5 占有率断层第一**，Vue 3 时代继续保持。**最新稳定版 v4.x**（截至 2026 年的 **v4.9.24+**，已发布 **280+** 个版本），基于 **Vue 3.x + TypeScript** 完全重写、整体迁移自 Vant 3。**核心特性矩阵**：**80+ 移动端组件**（覆盖基础 / 表单 / 反馈 / 展示 / 导航 / 业务六大类）/ **平均组件体积 1KB（min+gzip）**——业界最轻量级 / **零外部依赖**（不依赖任何三方 npm 包，完全自研）/ **完整 TypeScript 类型**（每个组件 props / slot / emit 都有 TS 类型，对 Volar 智能提示零摩擦）/ **单元测试覆盖率 90%+**（核心组件 95%+，比同类库更严格）/ **`@vant/auto-import-resolver` 按需引入零样板**（`unplugin-vue-components` + `unplugin-auto-import` 双 resolver 自动 import 组件 + 自动 import 命令式 API 如 `showToast`）/ **`@vant/nuxt` 模块**（Nuxt 3 零配置 SSR + 自动按需）/ **700+ 主题变量**（CSS 变量驱动，通过 `van-config-provider` 组件的 `theme-vars` 属性全局覆盖或 `:root` 直接覆盖）/ **内置深色模式**（`van-config-provider` 的 `theme="dark"` 一行启用，配合 `.van-theme-dark` 选择器）/ **30+ 国际化语言包**（`Locale.use(lang, messages)` 切换，从中文 / 英文 / 日韩 / 阿拉伯到罗马尼亚语全覆盖）/ **完美移动端适配**（默认 px 单位 + `postcss-px-to-viewport` vw 适配 + `postcss-pxtorem` rem 适配，配合 `lib-flexible` 设置 rem 基准值）/ **桌面端兼容**（`@vant/touch-emulator` 将 mouse 事件转换为 touch 事件、PC 端可通过 `max-width: 540px` 容器适配）/ **底部安全区**（`safe-area-inset-top` / `safe-area-inset-bottom` 适配 iPhone X 等异形屏）/ **Sketch + Axure 设计资源**（官方提供 UI 设计稿，设计师与开发协同友好）/ **`showToast` / `showDialog` / `showNotify` / `showImagePreview`** 等命令式 API（与 Element Plus 的 `ElMessage` 风格一致，Promise + 链式调用）/ **`ImagePreview` 图片预览** + **`Lazyload` 图片懒加载指令** + **`Calendar` 日历选择器** + **`Picker` 多列选择器** + **`Form` 表单 + `Field` 输入框 + 校验规则** + **`Tab` / `Tabbar` / `NavBar`** 移动端导航三件套 + **`List` + `PullRefresh`** 下拉刷新 / 上拉加载 + **`Sku` / `Coupon` / `AddressEdit` / `ContactEdit`** 电商业务组件。**典型用户群**：99% 的国内 Vue 3 移动端 H5 项目 / 微信公众号 H5 / 移动端 PWA / 跨平台混合应用（Capacitor / WebView）/ **有赞商城 / 美团 / 京东 / 滴滴等大量国内电商 / 出行 / SaaS 移动端**——国内移动端 H5 市场占有率**断层第一**。**截至 2026 年的 v4.9+** 处于「**稳定演进期**」，新增 `Barrage / Highlight / RollingText / Signature / FloatingBubble / FloatingPanel` 等组件 + 持续优化 SSR / 暗色模式 / 类型定义——**核心组件 API 已高度稳定**——这是国内 Vue 3 移动端项目最稳定可靠的选择。

## 评价

**优点**

- **国内 Vue 3 移动端 H5 市场断层第一**：有赞团队 + 社区维护，**Vant 2 时代积累的移动端市场份额无缝迁移到 Vant 4**——招聘、培训、面试、文档、问答全部围绕 Vant，新人上手成本极低
- **平均组件体积 1KB（min+gzip）**：业界最轻量级，**单个 Button + Cell + Field + Toast 加起来不到 10KB**——移动端首屏极快
- **80+ 移动端组件覆盖完整业务场景**：基础（Button / Cell / Icon / Image）+ 表单（Form / Field / Calendar / Picker / DatePicker / Stepper / Switch）+ 反馈（Toast / Dialog / Notify / Loading / ActionSheet）+ 展示（Card / Tag / NoticeBar / Skeleton）+ 导航（NavBar / Tab / Tabbar / Sidebar）+ 业务（AddressEdit / Coupon / Sku / ContactList）——**几乎所有移动端 H5 业务场景开箱即用**
- **零外部依赖**：完全自研、**不依赖任何 npm 第三方包**（vs Element Plus 依赖 lodash、async-validator 等），bundle 极纯净、版本稳定性极高
- **完整 TypeScript 类型 + Volar 智能提示**：每个组件 props / events / slots 都有 TS 声明，`van-form` 的 rules 都能在模板中获得完整提示 + 红线报错，**无需额外 `@types/*` 包**
- **按需引入零样板**：`@vant/auto-import-resolver` + `unplugin-vue-components` + `unplugin-auto-import` 一次配置后，**组件无需 import、API 函数（showToast / showDialog）也无需 import、CSS 自动注入按需**——Tree Shaking 优秀
- **700+ 主题变量**：CSS 变量驱动，`van-config-provider` 的 `:theme-vars="{ buttonPrimaryBackground: '#07c160' }"` 属性**运行时**动态切换（暗色模式 / 多主题）+ `:root` 直接覆盖——两种方式灵活组合
- **内置深色模式**：`van-config-provider` 的 `theme="dark"` 一行启用，配合 `theme-vars-dark` / `theme-vars-light` 分别配置暗色 / 浅色变量、`.van-theme-dark` 选择器定制全局样式——**零额外 CSS**
- **国际化 30+ 语言包**：从中文（简体/繁体/港台）到英文 / 日韩 / 阿拉伯（RTL）/ 罗马尼亚语全覆盖，`Locale.use('en-US', enUS)` 一键切换——比海外库国际化更全
- **`ConfigProvider` 全局配置中心**：theme / theme-vars / theme-vars-scope / icon-prefix / tag 等集中管理，**整个 App 的全局风格只在这一处声明**
- **命令式 API 设计优雅**：`showToast('已保存')` / `await showDialog({ message: '确定？' })` / `await showConfirmDialog(...)` —— **Promise 风格让异步交互写起来像同步代码**，比组件式 `van-dialog` 加 `v-model:show` 简洁
- **业务组件丰富**：`AddressEdit` / `AddressList` / `ContactEdit` / `Coupon` / `Sku`（商品规格选择）/ `CouponList` —— **国内电商场景开箱即用**，比海外库针对性强
- **`Form` + `Field` 完整表单方案**：`van-form` + `van-field` 的 `:rules="rules"` 属性 + 提交时 `validate()` —— **声明式 + 命令式校验完美结合**，校验规则 API 简洁
- **完美 SSR + Nuxt 集成**：`@vant/nuxt` 模块**零配置**启用 SSR + 自动按需 + 自动处理 Teleport hydration
- **移动端适配方案完整**：`postcss-pxtorem` + `lib-flexible` rem 适配 / `postcss-px-to-viewport` vw 适配 / `@vant/touch-emulator` 桌面端调试 / `safe-area-inset-bottom` 安全区——**移动端工程化的最佳实践集合**
- **持续迭代 + 活跃社区**：每月数次 patch 发布，2026 年仍是「**稳定演进期**」——新增 Barrage / Highlight / RollingText / Signature 等组件、修复 SSR / 暗色模式 bug
- **完整中文文档**：[vant-ui.github.io/vant](https://vant-ui.github.io/vant/#/zh-CN)——**中文官方文档质量极高**、示例完整、API 表格清晰，国内开发者无英文壁垒
- **`@vant/nuxt`、`@vant/touch-emulator`、`@vant/auto-import-resolver` 完整周边**：从 SSR 到桌面端调试到按需引入插件全部官方维护，生态闭环

**缺点**

- **专为移动端 H5 设计**：默认尺寸 / 间距 / 字体 / 触控目标全部按 **375 / 750 移动端设计稿**优化——**不适合做 PC 端中后台**（这类场景应该选 Element Plus / Naive UI / Ant Design Vue）
- **桌面端使用需要额外适配**：必须引入 `@vant/touch-emulator` 才能在桌面端响应 mouse 事件、视觉上需要 `max-width: 540px` 容器约束才能避免组件横向铺满
- **设计风格偏「移动电商」**：默认主题是 `#1989fa` 蓝 / `#07c160` 微信绿 + 圆角卡片式布局，**不适合做现代设计驱动的 C 端产品**（这类场景应该选 NutUI / Naive UI Mobile / 纯 Tailwind）
- **`Picker` 系列嵌套复杂**：`Picker` + `PickerGroup` + `DatePicker` + `TimePicker` + `Area` + `Cascader` 各自独立但 API 接近——**新手容易混淆该用哪个**
- **`Calendar` 日历组件较重**：单 Calendar 组件 ~30KB（含 CSS），**移动端 H5 中如果只用一次值得考虑动态 import**
- **业务组件耦合电商场景**：`Sku` / `Coupon` / `AddressEdit` / `ContactEdit` 等业务组件深度耦合**有赞商城业务**——非电商场景几乎用不到、且不容易拆出来定制
- **暗色模式自定义繁琐**：默认暗色变量与品牌色搭配可能冲突 —— 必须 `theme-vars-dark` + `.van-theme-dark { --van-* : ... }` 手动覆盖每个变量
- **vs NutUI**：NutUI 是 **京东 Style** 团队的移动端组件库（**Vue 3 / React / Taro 全栈**、设计语言 **京东 NutDesign**），**JD 风格 + 跨框架支持更广**；Vant 在国内移动端 H5 阵营**市场份额大幅领先**、社区更成熟；**NutUI 适合 JD 风格 + 跨 Taro 小程序项目；Vant 适合 Web H5 + 招聘市场优先的项目**
- **vs Mint UI**：Mint UI 是饿了么团队的 Vue 2 移动端组件库（**已停止维护，仅 Vue 2 支持**）——**Vue 3 项目不应再选 Mint UI**，Vant 是事实上的迁移目标
- **vs Vuetify Mobile / Quasar Mobile**：Vuetify 严格 Material Design / Quasar 跨平台（Web + Mobile + Electron），**国际化项目可能更合适**；Vant **国内业务场景** / **电商业务组件** / **中文文档** 优势明显
- **vs Tailwind CSS + Headless UI**：Tailwind + Headless UI 的「**utility-first + 无样式组件**」哲学与 Vant 完全相反—— Tailwind 适合**高度定制设计驱动产品**，Vant 适合**快速搭建电商 H5**；**两者不可相互替代、应该按场景选**
- **vs uni-app / Taro**：uni-app / Taro 是「**一次编写、多端运行**」的跨端框架（Web / 小程序 / App），Vant 仅做 Web H5 ——如需小程序请用 [Vant Weapp](https://github.com/vant-ui/vant-weapp)（官方小程序版）或 NutUI Taro

## 文档地址

[Vant 官网](https://vant-ui.github.io/vant/#/zh-CN) | [介绍](https://vant-ui.github.io/vant/#/zh-CN/home) | [快速上手](https://vant-ui.github.io/vant/#/zh-CN/quickstart) | [进阶用法](https://vant-ui.github.io/vant/#/zh-CN/advanced-usage) | [ConfigProvider 全局配置](https://vant-ui.github.io/vant/#/zh-CN/config-provider) | [Locale 国际化](https://vant-ui.github.io/vant/#/zh-CN/locale) | [更新日志](https://vant-ui.github.io/vant/#/zh-CN/changelog) | [Vant 2 文档](https://vant-ui.github.io/vant/v2/#/zh-CN) | [Vant Weapp（小程序）](https://vant-ui.github.io/vant-weapp/#/intro)

## GitHub 地址

[vant-ui/vant](https://github.com/vant-ui/vant) | [vant-ui/vant-weapp](https://github.com/vant-ui/vant-weapp)（微信小程序版）| [vant-ui/vant-demo](https://github.com/vant-ui/vant-demo)（官方示例合集）| [vant-ui/vant-nuxt](https://github.com/vant-ui/vant-nuxt)（Nuxt 模块）| [@vant/auto-import-resolver](https://github.com/vant-ui/vant/tree/main/packages/vant-auto-import-resolver)（按需引入 resolver）| [@vant/touch-emulator](https://github.com/vant-ui/vant/tree/main/packages/vant-touch-emulator)（桌面端 touch 事件模拟）| [3lang3/react-vant](https://github.com/3lang3/react-vant)（社区 React 版）| [Aisen60/vant-theme](https://github.com/Aisen60/vant-theme)（在线主题预览）

## 学习路径

- [入门](./getting-started.md)：`pnpm add vant` 安装 / `app.use(Vant)` 全量引入 / `@vant/auto-import-resolver` + `unplugin-vue-components` + `unplugin-auto-import` 按需引入零样板（Vite / Rsbuild / Webpack 三种配置）/ 第一个 `van-button` / `van-cell` / `van-icon` 示例 / `van-tab` / `van-tabbar` / `van-nav-bar` 移动端导航三件套 / Rem / Viewport 适配方案 / 桌面端调试（`@vant/touch-emulator`）/ 中文 i18n（默认即中文）/ 深色模式一行启用 / 主题色覆盖 / Nuxt 3 集成（`@vant/nuxt`）
- [指南](./guide-line.md)：**核心**：80+ 组件按类别速览（基础 / 表单 / 反馈 / 展示 / 导航 / 业务）/ **Form 表单深度**（`v-model` + `validator` + `pattern` + 异步校验 + 提交模式 + 动态校验）/ **Field 输入框深度**（type / clearable / formatter / show-word-limit / disabled / 自定义插槽）/ **Picker 系列**（Picker / PickerGroup / DatePicker / TimePicker / Area 地区 / Cascader 级联）/ **List + PullRefresh**（下拉刷新 + 上拉加载完整方案）/ **Toast / Dialog / Notify / Loading** 命令式 API 完整方案（Promise 模式 + 自定义图标 + 全局默认配置）/ **Tab / Tabbar / NavBar** 移动端导航三件套 / **Lazyload 指令** 图片懒加载 / **ImagePreview** 图片预览（命令式 + 组件式）/ **Calendar 日历选择器** / **Stepper / Switch / Checkbox / Radio** 基础表单 / **主题深度**（700+ CSS 变量 + ConfigProvider theme-vars + theme-vars-scope = global / local + theme-vars-dark / theme-vars-light）/ **深色模式完整方案**（ConfigProvider theme="dark" + `.van-theme-dark` 选择器 + 与 VueUse `useDark` 联动）/ **按需引入完整配置**（Vite / Rsbuild / Webpack / Vue CLI / Nuxt）/ **国际化**（Locale.use + Locale.add + 自定义语言包 + 异步加载）/ **移动端适配深度**（postcss-pxtorem + lib-flexible / postcss-px-to-viewport / 750 设计稿 / safe-area-inset）/ **桌面端 PC 适配**（`@vant/touch-emulator` + `max-width: 540px` 容器 + 鼠标 hover 状态）/ **SSR + Nuxt 集成深度**（`@vant/nuxt` + ClientOnly / Teleport hydration）/ **常见踩坑**（按需引入失败 / 主题不生效 / SSR hydration mismatch / Picker 系列混淆 / 桌面端 touch 事件无响应）
- [参考](./reference.md)：**API 速查**：80+ 组件分类列表（基础 / 表单 / 反馈 / 展示 / 导航 / 业务六大类完整速查）/ 常用组件 props 速查表（Button / Field / Form / Cell / Picker / DatePicker / Toast / Dialog / Notify / Tab / Tabbar / NavBar / List / PullRefresh / Calendar）/ ConfigProvider 完整选项 / 命令式 API（showToast / showDialog / showConfirmDialog / showNotify / showLoadingToast / showImagePreview）签名 / 指令（v-lazyload）/ Locale API（Locale.use / Locale.add / useCurrentLang）/ 700+ CSS 变量入口 / 主题变量类型（ConfigProviderThemeVars）/ TypeScript 类型（FormInstance / FieldRule / PickerOption / ToastOptions / DialogOptions）/ 工具 composables（useClickAway / useCountDown / useWindowSize / useRect / useEventListener / usePageVisibility / useScrollParent / useRaf / useToggle）
