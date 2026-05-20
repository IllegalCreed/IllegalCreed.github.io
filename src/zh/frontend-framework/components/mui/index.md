---
layout: doc
---

# MUI（Material UI）

**Google Material Design 在 React 生态最权威的实现、海外 React 中后台 UI 库无可争议的事实标准**——由 **MUI 公司**（MUI Org，原 Material-UI Org）于 **2014 年 8 月** 由 Olivier Tassinari 与 Hai Nguyen 在 GitHub 创建并开源（当时仍叫 `material-ui`），是 **JavaScript 生态最早、最完整的 Material Design 实现**之一，**至 2026 年已经走过 12 年**。MUI 在 **2021 年 9 月** 正式从 `material-ui` 更名为 `@mui/material`，从单包变成多包生态（`@mui/material` + `@mui/joy` + `@mui/x` + `@mui/icons-material` + `@mui/system` 等）。**最新稳定版 v9.x**（截至 2026 年 5 月已发布 **v9.0+** 配套 **MUI X v9.2.0**），完全基于 **React 18 / 19 + TypeScript 5+ + Emotion**（默认 CSS-in-JS 引擎）+ **CSS Layers**（v7+ 重大架构改进）+ 可选 **Pigment CSS Zero Runtime**（实验性）。**核心生态矩阵**：**`@mui/material`**（Material Design 实现，2500+ 组件覆盖 7 大类，主仓库 **GitHub 95k+ Star**）/ **`@mui/icons-material`**（**2100+ 官方 Material Icons**，按需 import Tree Shaking 友好）/ **`@mui/x`**（**Data Grid + Date Pickers + Charts + Tree View**，社区版 MIT 免费 + Pro / Premium 商业授权）/ **`@mui/system`**（底层样式工具：`sx` prop / `styled()` / `Box`） / **`@mui/joy`**（**Joy UI**——独立设计语言、目前 Beta + on hold 开发暂停状态）/ **Base UI**（`base-ui.com` 独立项目，原 `@mui/base` 已迁出，是 MUI / Radix / Floating UI 团队联合维护的 headless 组件库）。**核心特性**：**Design Token + CSS Variables**（`createTheme({ cssVariables: true })` 一行启用、自动生成 `--mui-palette-*` 系列变量、v7+ 内置 CSS Layers 解决与 Tailwind 优先级冲突）/ **`sx` prop 超能力**（接受响应式对象 / 主题回调 / 伪选择器 / 嵌套选择器，是 MUI 一次性自定义的「主入口」）/ **`styled()` API**（基于 Emotion，配合 `({ theme }) => ...` 完整访问主题）/ **完整 TypeScript 类型**（Module Augmentation 自定义 palette 颜色 + Typography 变体 + Component variants）/ **`ThemeProvider` + `createTheme`**（palette / typography / spacing / breakpoints / zIndex / shadows / transitions / components defaults 7 大配置） / **`colorSchemes: { light, dark }` 内置暗色模式**（`useColorScheme()` Hook + `InitColorSchemeScript` SSR 反闪烁）/ **`Grid` v2 重命名替换 `Grid` v1**（v7+ 默认 Grid 即 v2、原 v1 重命名为 `GridLegacy`、<span v-pre>`size={{ xs: 12, md: 6 }}`</span> 全新 API）/ **`Box` + `Stack` + `Container`** 布局三件套 / **`@mui/material-nextjs` 官方 Next.js 集成包**（`AppRouterCacheProvider` 一行处理 SSR Emotion 缓存）/ **MUI X Data Grid** 是 React 生态最强大的数据表格（社区版含分页 / 排序 / 筛选 / 选择 / 编辑，Pro 加列固定 / 树形 / 重排序，Premium 加 row grouping / Excel 导出）/ **`useMediaQuery` Hook** + 完整断点系统（xs/sm/md/lg/xl 默认 + 自定义）/ **`CssBaseline` + `ScopedCssBaseline`** 跨浏览器样式重置 / **样式引擎可替换**（默认 Emotion，可选 styled-components / Pigment CSS Zero Runtime）/ **完美 SSR 支持**（Next.js App Router / Pages Router / Remix / Vite SSR 全覆盖）。**典型用户群**：**Spotify / Netflix / Coinbase / Amazon Audible / Shutterstock / Scale AI / WordPress.com** 等海外大厂 / **`react-admin`、`material-react-table`、`refine.dev`** 等知名管理后台框架的底层 UI / **全球 80% 以上 React Material Design 风格项目** —— **如果一个 React 项目目标是 Material Design 视觉、那 MUI 几乎是唯一选项**。**截至 2026 年的 v9.0+** 处于「**稳定演进期**」，v7+ 引入 CSS Layers / Pigment CSS / Grid v2 重命名为重大架构里程碑，v8 / v9 进一步打磨 cssVariables / colorSchemes / Data Grid——这是 React 中后台项目里**最成熟、生态最完整、海外接受度最高**的 UI 库。

## 评价

**优点**

- **海外 React Material Design 的事实垄断**：MUI 在 React + Material Design 这个领域**没有第二个对手**——Google 官方虽然有 Material Web Components 但完全没有 React 等价物，MUI **填补了 12 年生态空白**。GitHub 95k+ Star、超过 2500 名贡献者、npm 周下载量 **4M+** 稳居 React UI 库榜首
- **12 年长跑、稳定可靠**：从 2014 年 `material-ui` 单包 → 2021 年 `@mui/material` 多包生态 → 2025/2026 年 v9 多年的版本路径**架构连续、可预测、企业可放心选用**。蚂蚁 Ant Design 在国内同一地位、MUI 在海外同一地位
- **完整生态矩阵**：核心 `@mui/material`（2500+ Material 组件）+ `@mui/icons-material`（2100+ 图标）+ `@mui/x`（数据网格 / 日期选择器 / 图表 / 树视图）+ `@mui/system`（`sx` / `styled` / `Box` 底层）+ `@mui/material-nextjs`（Next.js 一键集成）+ Base UI（headless 独立分支）—— **从基础组件 → 数据可视化 → SSR 一站式解决**
- **7+ 重大架构改进（CSS Layers）**：v7 默认启用 CSS Layers（`@layer mui`）—— **彻底解决与 Tailwind、CSS Modules、用户样式的优先级冲突**，再不需要 `!important` 或 `StyledEngineProvider injectFirst` 的 hack
- **`createTheme({ cssVariables: true })` 革命**：一行启用 CSS Variables 模式，**所有 token 变成 `--mui-palette-primary-main` 等 CSS 变量**——主题切换无需重新渲染组件树、SSR 一致性显著提升、支持原生 CSS `color-mix()`
- **`colorSchemes` 内置暗色模式**：`createTheme` + 双花括号包 `colorSchemes: { dark: true }` 一行启用 + `useColorScheme()` Hook 用户控制 + `InitColorSchemeScript` 解决 SSR 闪烁 —— **完整端到端方案、零额外配置**
- **`sx` prop 超能力**：MUI 独创的「样式即 props」API——接受**对象 / 响应式数组 / 主题回调 / 伪选择器 / 嵌套选择器**，是 MUI 用户日常 80% 自定义场景的「主入口」。配合 spacing 缩写（`m: 2` / `px: 3` / `gap: 1`）让 JSX 内联样式工程效率显著提升
- **`styled()` 完美 TypeScript 集成**：基于 Emotion `styled.div` API、`({ theme }) => ({ color: theme.palette.primary.main })` 完整访问主题、`styled(Button)<{ active: boolean }>` 支持泛型自定义 props —— **比 styled-components 类型推导更完整**
- **Material Design 严格遵循**：Material Design 3（Material You）规范的 React 实现**没有更权威的选项**——颜色规范、字体规范、间距规范、动效规范全部对齐 Google 官方设计
- **Module Augmentation 完整 TypeScript 类型扩展**：自定义 palette 颜色（`palette.brand`）/ 自定义 Typography 变体（`variant="hero"`）/ 自定义 component variants（`variant="dashed"`）—— 通过声明合并扩展 MUI 类型、IDE 自动补全完美
- **MUI X 商业模式可持续**：核心 `@mui/material` 永远 MIT 免费，`@mui/x` Data Grid Pro / Premium 商业授权资助核心团队 —— **比纯爱用 OSS 项目（Mantine、shadcn/ui）的可持续性更强**
- **Next.js App Router 一行集成**：`@mui/material-nextjs/v15-appRouter` 的 `<AppRouterCacheProvider>` 包裹 `layout.tsx` —— **自动处理 Streaming SSR + Emotion 缓存、零 hydration mismatch**
- **`Grid` v2 现代 API**：v7+ 用 <span v-pre>`size={{ xs: 12, md: 6 }}`</span> 替换 v1 的 `<Grid item xs={12} md={6}>`，**12 列网格 + offset + 嵌套 + 自定义断点全面 CSS Flexbox 实现** —— v1 重命名为 `GridLegacy` 留作迁移过渡
- **Form 表单与 React Hook Form 完美组合**：MUI TextField / Select / Autocomplete 配合 `Controller` 组件 + RHF `register` —— **类型推导贯穿全表单生命周期、validate / errors / disabled 状态联动**
- **完整 SSR 方案**：Next.js App Router（`AppRouterCacheProvider`）+ Pages Router（`_document.tsx` createEmotionCache）+ Remix + Vite SSR + Astro 全覆盖 —— **比 Chakra / Mantine 的 SSR 方案更成熟**
- **海外文档英文质量极高**：[mui.com](https://mui.com) —— **示例完整、API 表格清晰、CodeSandbox / Stackblitz 在线编辑、Migration Guide 详尽**
- **持续迭代**：v7（2024）/ v8 / v9（2025-2026）—— 每个 major 都有明确路线图（CSS Layers / Pigment CSS / Grid v2 / Joy UI / colorSchemes）、不像某些 OSS 项目「无声死亡」

**缺点**

- **国内市场份额远不如 Ant Design**：MUI 在海外是 React 默认选择、但国内 React 中后台市场 **90% 以上仍是 Ant Design** —— 招聘市场、培训、面试、第三方组件库都围绕 Ant Design，**国内项目选 MUI 的人才储备更难找**
- **Bundle 体积偏大**：完整 `@mui/material` 引入后 bundle ~300-500KB（已 gzip + Tree Shaking）—— 配上 `@mui/icons-material` 全量引入容易过 **1MB**，必须按需 `import Add from '@mui/icons-material/Add'` 避免全量
- **Emotion 运行时性能开销**：默认 Emotion CSS-in-JS 引擎、每个组件首次渲染时计算 + 注入 style 标签 —— **极致首屏优化需用 `cssVariables: true` 或迁移 Pigment CSS Zero Runtime**
- **Pigment CSS Zero Runtime 仍实验性**：v7+ 引入但**生产可用度有限**——很多 MUI 高级 API（动态 theme 切换、styled HOC 的复杂回调）尚未完全支持，建议**先观察、不要急于迁移**
- **设计风格强绑定 Material Design**：MUI 严格遵循 Material 3 规范、**视觉风格不灵活**——如果需要 Apple 风格 / 极简风格 / 营销页风格、应该选 Chakra / Mantine / shadcn/ui 或纯 Tailwind
- **Joy UI 开发暂停**：`@mui/joy` 在 2023 年提出作为 Material 之外的现代设计语言、但 **2025 年 5 月后开发实质 on hold**、MUI 团队明确建议「**新项目选 Material UI 而非 Joy UI**」—— Joy UI **不要选**
- **`@mui/base` 重命名 + 迁出**：原 `@mui/base`（headless 组件）在 v6 后实质迁出 MUI 主仓库、合并入 [base-ui.com](https://base-ui.com)（与 Radix / Floating UI 团队联合维护）—— **遗留代码引用 `@mui/base` 需要迁移**
- **`<Grid>` v1 → v2 破坏性变更**：v7 把 `Grid` 默认指向 v2、v1 重命名为 `GridLegacy`、**`item` prop 取消 + `xs={12}` 改为 <span v-pre>`size={{ xs: 12 }}`</span>** —— 存量项目升级 v7 时 Grid 是最大改造点
- **MUI X 高级特性需付费**：`DataGridPro`（列固定 / 树形 / 重排序）+ `DataGridPremium`（row grouping / Excel 导出 / aggregation）—— **企业级数据可视化场景需要购买商业授权**，开源项目可能用 AG Grid Community / TanStack Table 代替
- **vs Ant Design**：MUI **海外 Material Design 主流**；Ant Design **国内中后台市场断层第一、企业级 CRUD 组件更完整**；MUI 偏「设计系统通用」、Ant Design 偏「企业 CRUD 业务场景」
- **vs Mantine**：Mantine **120+ 组件 + 50+ Hooks + Tabler Icons + TypeScript-first**，**设计现代、bundle 更小（~250KB）**；MUI **生态更完整、Material Design 唯一选项**——**新项目设计驱动选 Mantine、企业 Material 风格选 MUI**
- **vs Chakra UI**：Chakra **可访问性 (a11y) 优秀 + 灵活 style prop API + 受 Tailwind 启发**；MUI **生态更老、组件更全（含 MUI X）**——选 MUI 如果是 Material 风格、选 Chakra 如果做 SaaS / 现代设计
- **vs shadcn/ui**：shadcn/ui **拷贝代码到项目而非安装包**（最大设计自由度）+ Tailwind + Radix UI 底层；MUI **传统组件库模式 + 主题对象 API** —— shadcn 给设计自由度、MUI 给开箱即用 + Material 设计语言
- **vs Element Plus / Naive UI**：Element Plus / Naive UI 是 **Vue 3 阵营**；MUI 是 **React 阵营** —— **跨阵营对比、是各自生态的「企业级 UI 主力」**
- **CSS-in-JS 性能问题（vs Pigment CSS）**：Emotion 运行时性能瓶颈在 React 19 + Server Components 时代愈发突出 —— Pigment CSS Zero Runtime 是 MUI 团队的长期答案，但生产成熟度还需观察
- **学习曲线**：`sx` prop 简单、`styled()` 中等、`createTheme + Module Augmentation` 较陡 —— 新人 1-2 天上手基础、1-2 周熟练自定义主题
- **静态方法不消费 Context 问题**：MUI 没有像 Ant Design 那样的 `App.useApp()` 模式，但确实有「在 ThemeProvider 外用 `useTheme`」的同类问题 —— 解决方案是确保**所有用 `useTheme()` 的组件**都在 `<ThemeProvider>` 内
- **Roboto 字体集成需手动**：MUI 默认使用 Roboto 字体但**不内置加载**，需 `pnpm add @fontsource/roboto` 或 Google Fonts CDN —— 新人最高频踩坑（默认看到 Times New Roman 风格）

## 文档地址

[MUI 官网](https://mui.com/) | [Material UI 入门](https://mui.com/material-ui/getting-started/) | [安装](https://mui.com/material-ui/getting-started/installation/) | [基础用法](https://mui.com/material-ui/getting-started/usage/) | [主题定制](https://mui.com/material-ui/customization/theming/) | [CSS Variables](https://mui.com/material-ui/customization/css-theme-variables/usage/) | [暗色模式](https://mui.com/material-ui/customization/dark-mode/) | [组件总览](https://mui.com/material-ui/all-components/) | [Next.js 集成](https://mui.com/material-ui/integrations/nextjs/) | [样式互操作](https://mui.com/material-ui/integrations/interoperability/) | [MUI X](https://mui.com/x/introduction/) | [MUI X Data Grid](https://mui.com/x/react-data-grid/) | [MUI X Date Pickers](https://mui.com/x/react-date-pickers/) | [Base UI 独立站](https://base-ui.com/) | [Joy UI（暂停状态）](https://v7.mui.com/joy-ui/getting-started/)

## GitHub 地址

[mui/material-ui](https://github.com/mui/material-ui)（主仓库，95k+ Star） | [mui/mui-x](https://github.com/mui/mui-x)（X Data Grid / Date Pickers / Charts / Tree View） | [mui/pigment-css](https://github.com/mui/pigment-css)（Zero Runtime 样式引擎实验） | [mui/base-ui](https://github.com/mui/base-ui)（已迁出主仓库的 Base UI） | [mui/material-ui-popup-state](https://github.com/jcoreio/material-ui-popup-state)（社区流行的 Popper 状态管理） | [mui-org/material-ui-pickers](https://github.com/mui-org/material-ui-pickers)（旧版 Pickers、已合并入 MUI X）

## 学习路径

- [入门](./getting-started.md)：`pnpm add @mui/material @emotion/react @emotion/styled` 安装 / `@fontsource/roboto` Roboto 字体接入 / `@mui/icons-material` 图标 / 第一个 `Button` + `TextField` + `CssBaseline` / `ThemeProvider` + `createTheme` 包根 / `sx` prop 入门（<span v-pre>`sx={{ m: 2, color: 'primary.main' }}`</span>）/ `styled()` 基础用法 / Vite 集成（无需特殊配置）/ Next.js App Router 集成（`AppRouterCacheProvider`）/ CRA 集成（已不推荐）/ TypeScript 基础（自动类型推导）/ 暗色模式一行启用（`colorSchemes: { dark: true }`）
- [指南](./guide-line.md)：**核心**：MUI 7 大组件分类（Inputs / Data Display / Feedback / Surfaces / Navigation / Layout / Utils）/ **`sx` prop 完整 API**（spacing 缩写 / 响应式 / 主题回调 / 伪选择器 / 嵌套选择器）/ **`styled()` API 深度**（基础 / theme 访问 / 泛型 props / shouldForwardProp / 链式 .attrs）/ **`ThemeProvider` + `createTheme` 完整选项**（palette / typography / spacing / breakpoints / zIndex / shadows / transitions / components defaults）/ **`colorSchemes` 暗色模式**（`InitColorSchemeScript` + `useColorScheme()` + 跨标签同步）/ **`createTheme({ cssVariables: true })` CSS Variables 模式** / **`Box` + `Container` + `Grid` v2 + `Stack`** 布局四件套 / **`Form` 表单方案**（TextField / Select / Autocomplete / Checkbox / Radio + React Hook Form 集成）/ **MUI X Data Grid 完整方案**（columns / rows / pagination / sorting / filtering / selection / editing / 社区版 vs Pro vs Premium）/ **MUI X Date Pickers**（AdapterDayjs / LocalizationProvider / DatePicker / DateTimePicker / DateRangePicker）/ **MUI X Charts** / **Pigment CSS Zero Runtime**（实验性、生产可用度评估）/ **Next.js App Router 完整集成**（`@mui/material-nextjs` + `theme.ts` use client + Roboto 字体）/ **Vite 集成最佳实践** / **样式互操作**（Tailwind 优先级 / CSS Modules / styled-components）/ **Base UI 独立站**（headless 替代）/ **Joy UI 状态说明**（不要选）/ **TypeScript Module Augmentation**（自定义 palette / typography / component variants）/ **常见踩坑**（Roboto 字体不加载 / Grid v1 → v2 迁移 / Tailwind 优先级 / Emotion SSR / 静态 useTheme）
- [参考](./reference.md)：**API 速查**：MUI 7 大组件分类清单（**80+ 组件**：Inputs / Data Display / Feedback / Surfaces / Navigation / Layout / Utils）/ **`sx` prop 全部缩写表**（spacing / palette / typography / sizing / borders）/ **`createTheme` 完整选项树**（palette / typography / spacing / breakpoints / zIndex / shadows / transitions / components）/ **`styled()` 完整签名** / **TypeScript 核心类型**（`Theme` / `PaletteOptions` / `TypographyOptions` / `Components<Theme>`）/ **MUI X 模块速查**（Data Grid / Date Pickers / Charts / Tree View 各自版本与许可）/ **`@mui/material-nextjs` API** / **`useTheme` / `useMediaQuery` / `useColorScheme` Hook 速查** / **`Box` / `Container` / `Grid` / `Stack` props 速查**
