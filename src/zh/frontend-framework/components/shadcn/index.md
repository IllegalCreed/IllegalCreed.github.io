---
layout: doc
outline: [2, 3]
---

# shadcn/ui

**React 生态当代最具影响力的「Copy-Paste 组件分发平台」+ Tailwind CSS 黄金搭档、AI 协作友好基建**——由 [@shadcn](https://twitter.com/shadcn)（Hassan El Mghari，[Vercel](https://vercel.com) 开发者关系成员）独立创建于 **2023 年 1 月**，**2024 年 3 月发布 v1**，**2025 年 2 月加入 Tailwind v4 + React 19 支持**，**2025 年 8 月引入 MCP Server + Registry 体系**，**2026 年 5 月稳定到 v4.7.x**。**GitHub 115k+ Star、月增速超 React Hook Form + Radix UI 加起来**——是 **2023-2026 三年间 React 生态最快速崛起的项目**，没有之一。

**shadcn/ui 不是传统意义上的 npm UI 库**——它**不发布 `@shadcn/ui` npm 包给你 `import { Button } from "@shadcn/ui"`**，它的核心机制是 **CLI 工具拷贝源码到你的项目目录**：

```bash
pnpm dlx shadcn@latest add button
# 拷贝 src/components/ui/button.tsx 到你的代码库
# 你可以直接修改这个文件——它是你的代码，不是 node_modules 里的依赖
```

**「Open Code」+「Distribution Platform」是它最核心的两个理念**：

1. **Open Code**——所有组件源码**直接拷贝到你的项目里**、**你可以任意修改**、**没有任何「黑盒抽象层」**。**vs Mantine / MUI / Ant Design**——它们的组件源码在 `node_modules` 里、需要通过 `theme` / `sx` / `styles` API 间接定制，深度自定义随时撞墙。**vs Radix Primitives**——Radix 给你「无样式行为」、shadcn 给你「带样式的 Radix 封装 + 你可以改样式」
2. **Distribution Platform**——shadcn 通过 **`registry.json`** 让任何人都能搭建自己的私有 Registry、发布自己的组件、用同样的 CLI 安装。**「不是一个 UI 库、而是一套 UI 库的协议」**——这是它能孵化出 **Magic UI / Aceternity UI / Park UI / Origin UI** 等数十个衍生生态的根本原因

**技术栈构成**（**截至 2026 年 5 月 v4.7.x**）：

| 层级 | 选择 | 说明 |
|------|------|------|
| **底层行为** | [Radix Primitives](https://www.radix-ui.com/primitives) **或** [Base UI](https://base-ui.com) | v2026 起官方双路线支持。**默认 Radix Primitives**（`--base radix`），新项目可选 Base UI（`--base base`） |
| **样式** | [Tailwind CSS v4](https://tailwindcss.com) | v2025.2 起强制 Tailwind v4 + `@theme inline` + CSS 变量。**v3 项目仍可工作但推荐升级** |
| **样式合并** | [`clsx`](https://github.com/lukeed/clsx) + [`tailwind-merge`](https://github.com/dcastil/tailwind-merge) | `cn()` utility 把 `clsx` 与 Tailwind 冲突解决合并 |
| **Variant 系统** | [class-variance-authority (cva)](https://cva.style) | Button / Badge 等多变体组件用 `cva` 声明 `variant` + `size` |
| **图标库** | [lucide-react](https://lucide.dev) | 默认；v4 起支持 `--icon-library` 切换 Radix Icons / Tabler |
| **动画** | [`tw-animate-css`](https://github.com/Wombosvideo/tw-animate-css) | Tailwind v4 时代的 `tailwindcss-animate` 替代品 |
| **表单** | [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev) | Form 组件官方推荐组合 |
| **数据表格** | [@tanstack/react-table](https://tanstack.com/table) | Data Table 组件官方组合 |
| **Toast** | [sonner](https://sonner.emilkowal.ski) | v2024.10 起官方推荐替代旧 `Toast` |
| **Charts** | [Recharts](https://recharts.org) | Chart 组件官方包装 |
| **Date Picker** | [react-day-picker](https://daypicker.dev) | Calendar 底层 |

**组件数量**：截至 2026 年 5 月 **70+ 个组件** 可拷贝（**Forms 11 个**：Button / Checkbox / Input / Input Group / Input OTP / Label / Native Select / Radio Group / Select / Textarea / Toggle / Toggle Group；**Overlay 8 个**：Alert Dialog / Context Menu / Dialog / Drawer / Hover Card / Popover / Sheet / Tooltip；**Navigation 6 个**：Breadcrumb / Dropdown Menu / Menubar / Navigation Menu / Pagination / Sidebar；**Display 12 个**：Accordion / Alert / Avatar / Badge / Card / Empty / Kbd / Separator / Skeleton / Table / Typography / Spinner；**Selection 6 个**：Button Group / Collapsible / Combobox / Command / Item / Switch；**Layout 5 个**：Aspect Ratio / Direction / Field / Resizable / Scroll Area；**Specialized 12+ 个**：Calendar / Carousel / Chart / Data Table / Date Picker / Form / Progress / Slider / Sonner / Toast / 等）。

**Blocks 与 Themes**：**Blocks** 是**复合 UI 模板**（Sidebar / Login / Dashboard / Authentication / Charts），**整段拷贝**而非单个组件——`npx shadcn add sidebar-07` 一次拷贝包含 5-10 个文件的完整布局。**Themes** 是**色板预设**（**8 个 baseColor**：Neutral / Stone / Zinc / Mauve / Olive / Mist / Taupe / Slate）。

**典型用户群**：**全球 React / Next.js 开发者 + AI 协作型项目 + 海外创业团队 + 个人开发者 + Vercel 生态产品 + Linear / Cal.com / Magic UI / Aceternity UI 等衍生项目**。**国内市场**：**与 Ant Design 平级的 React UI 选择**——一线大厂 Next.js 项目、独立开发者 / 跨境 SaaS / AI 应用**几乎默认 shadcn**。

> shadcn/ui 是当代 React 生态**最特殊的现象级项目**——它**不是 UI 库、不是 npm 包、不是设计系统**，**它是「让 Radix + Tailwind 组合普及到 99% 项目」的分发协议**。如果你**会写 Tailwind + 想要美观默认 + 完全自由的代码所有权 + AI 友好工作流**，那 **shadcn/ui = React 项目的事实标准 UI 解决方案**。**截至 2026 年的 shadcn 生态** 处于「**70+ 核心组件成熟 + Registry 平台繁荣 + MCP Server AI 原生 + Base UI 双底层支持**」四维成长期——是任何 React 开发者**都应该掌握**的当代主流方案。

## 评价

**优点**

- **「拷贝代码到本地」的哲学革命性**：shadcn/ui **把 UI 库的源码所有权完全交给开发者**——`npx shadcn add button` 后 `src/components/ui/button.tsx` 就是**你的代码**、**你可以任意修改 + 重构 + 删 + 合并**、**没有任何 npm 依赖追踪**。**vs MUI / Mantine / Ant Design 的 `theme.palette.primary.main` 间接定制**——shadcn 是**直接打开文件改源码**，**深度自定义没有任何天花板**
- **Radix Primitives 底层 + Tailwind v4 默认**：底层用 [Radix Primitives](https://www.radix-ui.com/primitives) 处理 a11y / 键盘 / 焦点管理（**业界最扎实**），样式用 Tailwind v4 + CSS 变量。**会写 Tailwind = 会改 shadcn**，**会用 Radix Primitives = 半个 shadcn 已经会了**
- **`cn()` utility 解决 Tailwind 类合并痛点**：`cn(...inputs)` 把 `clsx` 的条件类合并与 `tailwind-merge` 的 Tailwind 冲突解决合二为一——**`cn("px-2", "px-4")` 智能取后者**、**`cn("text-red-500", isPrimary && "text-blue-500")` 条件覆盖正确**。**这套 utility 已成为 Tailwind 项目事实标准**
- **`cva` (class-variance-authority) variant 系统**：Button / Badge 等多变体组件用 `cva` 声明 `variant: { default / outline / ghost / destructive / secondary / link }` + `size: { default / sm / lg / icon }`，**类型安全 + 默认值 + 复合 variant** 全部支持，**API 简洁度业界第一**
- **CLI 工具完整 + AI 友好**：`shadcn` CLI 提供 `init` / `add` / `build` / `apply` / `view` / `search` / `list` / `docs` / `info` / `migrate` / `preset` 等命令，**覆盖整个组件分发生命周期**。**`shadcn docs button` 直接拉取最新文档**——AI 协作神器
- **MCP Server 原生 AI 集成**：v2025.8 起官方 MCP Server 让 Claude / Cursor / VS Code 等 AI IDE 可以**用自然语言安装组件**——「帮我加一个登录表单」AI 自动 `shadcn add login-03`。**vs 任何传统 UI 库都没有 AI 原生工作流** —— shadcn 是**第一个把 AI 协作当一等公民**的 UI 库
- **Registry 体系 + 私有分发**：`registry.json` 协议允许任何团队 / 公司搭建**私有组件 Registry**——`pnpm dlx shadcn@latest add @acme/special-button` 从 `acme.com` 自动拉取。**这是 shadcn 区别于所有 UI 库的根本性差异**——**它不是一个库、而是一套协议**，让 [Magic UI](https://magicui.design) / [Aceternity UI](https://ui.aceternity.com) / [Origin UI](https://originui.com) / [Park UI](https://park-ui.com) 等数十个衍生项目能用同一套 CLI 分发自己的组件
- **Blocks 模板系统**：**Dashboard / Sidebar / Login / Signup / Calendar / Authentication / Charts** 等**复合模板**——`shadcn add sidebar-07` 一次拷贝完整登录页 / 仪表板 / 侧边栏布局（含 5-10 个文件 + 完整路由 + 完整状态管理）。**vs 一般 UI 库只给你单个组件**——shadcn 给你**整段业务场景**
- **Themes 8 个 baseColor 色板**：**Neutral / Stone / Zinc / Mauve / Olive / Mist / Taupe / Slate**——**OKLCH 色空间** + **CSS 变量** + **暗色模式自动反转**。**vs Tailwind 默认色板的纯视觉灰度**——shadcn 色板是**语义化角色**（background / foreground / primary / secondary / muted / accent / destructive / border / input / ring）
- **完美 Next.js / Vite / Remix / Astro / TanStack Start / Laravel / React Router 集成**：CLI 自动识别框架、自动配置 path alias、自动注入 globals.css —— **任何主流 React 框架开箱即用**
- **monorepo 原生支持**：`shadcn init --monorepo` 创建 Turborepo 工作区，**`apps/web` 应用 + `packages/ui` 共享组件库**——**`add` 命令自动识别工作区并放对位置**。**vs 传统 UI 库 monorepo 共享需要自己写 build 配置**
- **OKLCH 色空间 + CSS 变量主题**：v2025.2 起所有色板用 OKLCH（**比 HSL 感知更均匀**），**`@theme inline { --color-primary: var(--primary); }`** 让 Tailwind 与 CSS 变量双向同步，**主题切换不抖动**
- **dark mode 一行启用**：与 [`next-themes`](https://github.com/pacanukeey/next-themes) 完美集成——`<ThemeProvider attribute="class">`，所有 shadcn 组件**自动响应** `.dark` 类，**零额外配置**
- **Form 组件官方 react-hook-form + zod 完美集成**：`<Form>` + `<FormField>` + `<FormItem>` + `<FormLabel>` + `<FormControl>` + `<FormDescription>` + `<FormMessage>` 复合 API——**自动 wiring `id` / `aria-describedby` / `aria-invalid` / 错误信息显示**，**vs 任何 UI 库都没这么优雅的表单方案**
- **Data Table = @tanstack/react-table 的最佳实践模板**：**不是一个组件、而是一份代码模板**——shadcn 教你**如何用 Table + @tanstack/react-table 自己组装数据表格**，**排序 / 过滤 / 分页 / 列可见性 / 行选择**全部覆盖。**vs MUI X DataGrid / Ant Design Table 黑盒组件**——shadcn Data Table 是**完全可改的代码**
- **Chart 组件 = Recharts + ChartContainer / ChartTooltip / ChartLegend**：**不抽象 Recharts、只增强**——`ChartContainer` 注入 CSS 变量主题、`ChartTooltipContent` 提供漂亮默认 tooltip、`ChartLegendContent` 自动颜色映射，**Recharts API 100% 可用**
- **Sidebar 完整方案**：`<SidebarProvider>` + `<Sidebar>` + `<SidebarContent>` + `<SidebarGroup>` + `<SidebarMenu>` + `<SidebarMenuButton>` + `useSidebar` hook ——**桌面端 / 移动端 / collapsed icon 模式自动切换**，**完整 keyboard shortcut 支持**
- **Sheet (slide-in panel) 4 方向**：`side="top|right|bottom|left"` 一键切换 —— **从对话框升级到「侧边面板」开箱即用**
- **Drawer = vaul 库的包装**：[vaul](https://vaul.emilkowal.ski) 是 Sonner 作者的 mobile-first drawer 库 ——shadcn 包装后**桌面 + 移动通用**
- **Sonner 替代旧 Toast**：[Sonner](https://sonner.emilkowal.ski) 是 [Emil Kowalski](https://emilkowal.ski) 的新一代 toast 库 —— `toast.success()` / `toast.error()` / `toast.promise()` / 自动堆叠 / 自动暗色 / 移动手势消除 —— **比所有传统 UI 库的 Notification 都好用**
- **lucide-react 默认图标 + 可切换**：[lucide-react](https://lucide.dev) **1500+ 图标** + **风格统一** + **完美 Tree Shake**。`shadcn init --icon-library radix` 可切换 Radix Icons / Tabler Icons / Phosphor
- **components.json 配置统一**：所有 shadcn 行为通过**单一配置文件**控制——`style` / `rsc` / `tsx` / `tailwind` / `aliases` / `iconLibrary` / `registries`，**vs 多个分散的 config 文件**
- **migrate 命令一键升级**：`shadcn migrate icons` / `shadcn migrate radix` / `shadcn migrate rtl` ——**大版本迁移自动化**
- **RTL 支持**：v2026.4 起完整 RTL 支持 —— `shadcn init --rtl` 启用，所有组件自动反转 padding / margin / icon
- **`--pointer` 选项**：v2026.4 引入 `--pointer` flag，让按钮自动带 `cursor: pointer`（**Web 默认 button 不带 pointer 一直被诟病、shadcn 修复**）
- **「不锁定」的最大反差**：你可以**用 shadcn 拷贝代码到项目里 + 一个月后删掉 shadcn CLI + 不影响任何使用**——**因为代码已经是你的**。**vs 所有 npm UI 库一旦集成就持续依赖**
- **GitHub 115k+ Star、月增速第一**：截至 2026 年 5 月 v4.7.0 —— **React UI 库历史增速最快项目**
- **官方文档质量极高 + 实时 Preview**：[ui.shadcn.com](https://ui.shadcn.com) —— 每个组件「Preview / Code / Installation / Usage / Examples / API Reference」结构清晰、嵌入实时 React Playground、暗色模式切换演示
- **完美 Server Component / Client Component 边界**：`rsc: true` 时 CLI 自动加 `"use client"` 到需要交互的组件——**Next.js App Router 完美适配**
- **`tw-animate-css` 替代旧 `tailwindcss-animate`**：Tailwind v4 时代专用动画包 —— `data-[state=open]:animate-in` / `data-[state=closed]:animate-out` 系列 utility 完整
- **Hassan @shadcn + Vercel 背书**：作者 Hassan 现就职 Vercel 开发者关系 —— **bus factor 显著高于个人项目**

**缺点**

- **「不是 npm 包」是认知门槛**：新手第一次接触 shadcn 会困惑「**为什么我要拷贝代码而不是 `npm install`？**」**这个理念转变需要适应**。**vs MUI / Ant Design / Mantine 「装包即用」的直觉，shadcn 颠覆这个直觉**
- **只支持 React 系**：**没有 Vue / Svelte / Solid 官方版本**。**社区有 [shadcn-svelte](https://shadcn-svelte.com) / [shadcn-vue](https://www.shadcn-vue.com)（v2024 起 fork 维护）**——**但官方只维护 React 版**。**Vue / Svelte 用户得知道这是「社区 fork」，更新滞后于 React 版**
- **依赖 Tailwind CSS**：**shadcn 强绑定 Tailwind**——**不能用 CSS Modules / styled-components / Emotion 等其他样式方案**。**vs Radix Primitives 完全无样式**——Radix 任何样式方案都能用，shadcn **必须 Tailwind**
- **拷贝来的代码维护责任在你**：因为代码已经是你的，**shadcn 升级时不会自动改你拷贝的文件**。**`shadcn diff` / `shadcn migrate` 命令辅助手动迁移**——**vs npm 库 `npm update` 自动**——shadcn 升级**心智负担更高**
- **vs Mantine / MUI / Ant Design 业务组件缺失**：shadcn **没有官方 Pro Components**（DataGrid 高级版 / DatePicker 范围选择 / Tree / Transfer / Cascader / 富文本 / 文件上传）—— 大量企业级业务组件**需要自己组装**。**Magic UI / Origin UI / Aceternity UI 等第三方 Registry 补充了一部分、但不官方**
- **Form + react-hook-form 学习曲线**：shadcn Form 强依赖 [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev) 组合——**初学者要同时学 RHF 心智模型 + zod schema + shadcn Form API**，**vs Ant Design Form / MUI TextField 简单使用更易上手**
- **Data Table 不是组件、是模板**：shadcn **不提供** `<DataTable data={...} columns={...} />` 单一组件 ——你需要**自己复制 @tanstack/react-table 代码模板**。**vs MUI X DataGrid / Ant Design Table 一行用法**——shadcn 上手成本更高（**好处是后续完全可改**）
- **v3 → v4 Tailwind 升级是 breaking**：v2025.2 起强制 Tailwind v4 + `@theme inline` + CSS 变量重构——**v3 项目升级涉及 `tailwind.config.js` 删除 / `globals.css` 重写 / 部分动画类名更换**。`shadcn migrate` 辅助但仍需人工
- **OKLCH 颜色在旧浏览器不支持**：Safari 15.4+ / Chrome 111+ / Firefox 113+ 才支持 OKLCH —— **旧浏览器降级到 RGB 后色彩偏差**。**vs HSL 兼容性更广**——但 OKLCH 是大势所趋
- **`useTheme` SSR Hydration**：`next-themes` 用 localStorage 持久化主题——**SSR 期间无法知道用户偏好**，**第一次渲染可能闪烁**。需要在 `<html suppressHydrationWarning>` 配合 `<script>` 提前注入 `class="dark"`（**next-themes 已封装、但仍是隐藏陷阱**）
- **Registry 私有发布需要自己搭基建**：发布私有 Registry 需要**自己部署一个 `https://acme.com/registry/{name}.json`** 静态站点 ——**vs npm 私有包可直接 npm publish**——Registry 部署门槛略高
- **MCP Server 体验取决于 IDE**：MCP 在 Claude Code / Cursor / VS Code 体验有差异 ——某些场景 MCP Server **响应慢于直接 `shadcn add`** —— 用户需自己权衡
- **Base UI vs Radix 双底层增加选择负担**：v2026 起官方双底层（`--base radix` / `--base base`）——**新手要选哪个**？目前默认 Radix 但 Base UI 是 MUI 团队下一代方案，**生态分裂风险**
- **lucide-react 包尺寸**：lucide 全量 1500+ 图标 ~50KB —— 虽然 Tree Shake 后实际使用极小、但**初学者容易误装全量**
- **Sera / Default / New York 多 style 混淆**：`style: "new-york"` / `style: "default"` / `style: "sera"` 三种风格 —— **新手不知道选哪个**。**`style` 初始化后不可改**——选错只能删 components.json 重来
- **Discord 社区较弱**：shadcn 没有独立 Discord ——通过 [GitHub Discussions](https://github.com/shadcn-ui/ui/discussions) + Twitter / X 沟通，**vs Mantine / Chakra Discord 上千成员**社区活跃度差距明显
- **不是真正的「组件库」会让团队管理混乱**：在大型团队里，**每个开发者都能改 `components/ui/button.tsx`**——**容易导致版本漂移**、**unified design system 维护困难**。**最佳实践：把 `components/ui` 锁到一个 owner、其他改动走 PR**
- **Charts = Recharts 包装，性能取决于 Recharts**：Recharts 数据量上千点开始卡 ——shadcn Chart 不能解决 Recharts 自身性能问题
- **v1 → v4 频繁重命名**：早期 Toast 被 Sonner 替代、`@radix-ui/react-icons` 被 `lucide-react` 替代、`tailwindcss-animate` 被 `tw-animate-css` 替代——**老教程很多已过时**

## 文档地址

[shadcn/ui 官网](https://ui.shadcn.com) | [文档主页](https://ui.shadcn.com/docs) | [安装入口](https://ui.shadcn.com/docs/installation) | [Next.js 安装](https://ui.shadcn.com/docs/installation/next) | [Vite 安装](https://ui.shadcn.com/docs/installation/vite) | [TanStack Start 安装](https://ui.shadcn.com/docs/installation/tanstack) | [Astro 安装](https://ui.shadcn.com/docs/installation/astro) | [React Router 安装](https://ui.shadcn.com/docs/installation/react-router) | [Laravel 安装](https://ui.shadcn.com/docs/installation/laravel) | [手动安装](https://ui.shadcn.com/docs/installation/manual) | [components.json 字段](https://ui.shadcn.com/docs/components-json) | [Theming](https://ui.shadcn.com/docs/theming) | [Dark Mode](https://ui.shadcn.com/docs/dark-mode) | [CLI 命令](https://ui.shadcn.com/docs/cli) | [Monorepo](https://ui.shadcn.com/docs/monorepo) | [Registry 系统](https://ui.shadcn.com/docs/registry) | [MCP Server](https://ui.shadcn.com/docs/mcp) | [组件总览](https://ui.shadcn.com/docs/components) | [Blocks 模板](https://ui.shadcn.com/blocks) | [Themes 主题](https://ui.shadcn.com/themes) | [Charts 图表](https://ui.shadcn.com/charts) | [Changelog](https://ui.shadcn.com/docs/changelog)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=shadcn-ui" target="_blank" rel="noopener noreferrer">shadcn/ui 测试题</a>


## GitHub 地址

[shadcn-ui/ui](https://github.com/shadcn-ui/ui)（主仓库，115k+ Star） | [Releases](https://github.com/shadcn-ui/ui/releases) | [Discussions](https://github.com/shadcn-ui/ui/discussions) | [Issues](https://github.com/shadcn-ui/ui/issues) | [shadcn-vue（社区 fork）](https://github.com/unovue/shadcn-vue) | [shadcn-svelte（社区 fork）](https://github.com/huntabyte/shadcn-svelte) | [Magic UI](https://github.com/magicuidesign/magicui)（衍生 Registry） | [Aceternity UI](https://ui.aceternity.com)（衍生 Registry）

## 学习路径

- [入门](./getting-started.md)：**概念**（**Copy-Paste 哲学 / Open Code / Distribution Platform / Radix Primitives 底层 / Tailwind v4 强绑定**）/ **CLI 安装**（`pnpm dlx shadcn@latest init` 三连问 / Next.js + Vite + TanStack Start + Astro 多框架适配）/ **components.json 完整字段**（`style` / `rsc` / `tsx` / `tailwind.cssVariables` / `aliases` / `iconLibrary` / `registries`）/ **第一个组件**（`shadcn add button` 拷贝源码 + Button variant + size + asChild 用法）/ **`cn()` utility**（`clsx` + `tailwind-merge`）/ **lucide-react 图标**（`<Sun className="size-4" />`）/ **Tailwind v4 配套**（`@import "tailwindcss"` + `@theme inline` + CSS 变量主题）/ **暗色模式**（`next-themes` 集成 + ThemeProvider + ModeToggle 完整代码）/ **第一个 Dialog**（`shadcn add dialog` 拷贝 + DialogTrigger + DialogContent + DialogHeader + DialogTitle + DialogDescription + DialogFooter 完整 anatomy）/ **第一个 Sheet**（`side="right"` 4 方向）
- [指南](./guide-line.md)：**核心**：**70+ 组件完整清单**（Forms 11 + Overlay 8 + Navigation 6 + Display 12 + Selection 6 + Layout 5 + Specialized 12+）/ **CLI add 完整工作流**（`-y` / `-o` / `-a` / `-p` / `--dry-run` / 自定义路径）/ **`cva` (class-variance-authority) variant 系统深度**（Button / Badge 多变体声明 + 复合 variant + 默认值 + TypeScript）/ **Form 完整**（`useForm` + `zodResolver(schema)` + `<FormField>` + `<FormItem>` + `<FormLabel>` + `<FormControl>` + `<FormDescription>` + `<FormMessage>` 完整 React Hook Form + zod 集成）/ **Data Table 完整**（@tanstack/react-table 集成 + 排序 + 过滤 + 分页 + 列可见性 + 行选择 + DropdownMenu 配套）/ **Sidebar 完整方案**（`<SidebarProvider>` + `<Sidebar>` + `<SidebarHeader>` + `<SidebarContent>` + `<SidebarGroup>` + `<SidebarMenu>` + `<SidebarMenuButton>` + `useSidebar` hook + 桌面 / 移动 / collapsed icon 三态）/ **Sonner Toast**（`<Toaster />` + `toast()` + `toast.success` / `toast.error` / `toast.promise`）/ **Chart Recharts 包装**（`<ChartContainer config={...}>` + `<ChartTooltipContent>` + `<ChartLegendContent>` + CSS 变量主题）/ **Sheet (slide-in panel)**（`side="top|right|bottom|left"` + 移动端导航场景）/ **Combobox**（Command + Popover 组合 + search filter）/ **Calendar / Date Picker**（react-day-picker 包装）/ **Blocks 模板系统**（Dashboard / Sidebar-XX / Login-XX / Authentication / Charts 整段拷贝）/ **Themes 色板**（8 baseColor / OKLCH / CSS 变量主题 / `@theme inline` / 暗色模式自动反转）/ **Tailwind v4 集成细节**（`@theme inline` 桥接 CSS 变量 / `tw-animate-css` 替代 `tailwindcss-animate`）/ **自定义组件改造**（修改拷贝来的源码 + 添加新 variant + 调整默认样式）/ **Registry 体系**（搭建私有 Registry + 发布组件 + `registry.json` 完整 schema）/ **MCP Server**（Claude Code / Cursor / VS Code 配置 + AI 自然语言安装）/ **Next.js App Router 完整集成**（RSC vs Client Component 边界 + ThemeProvider 位置 + Sonner 全局 Toaster）/ **monorepo 配置**（Turborepo + `apps/web` + `packages/ui` + 跨 workspace alias）/ **常见踩坑**（components.json 配置错 / Tailwind v4 升级踩坑 / `cn()` 顺序问题 / next-themes hydration 闪烁 / asChild 多元素错误 / OKLCH 浏览器兼容 / cva variant 类型推导）
- [参考](./reference.md)：**API 速查**：**70+ 组件清单 + 一句话功能描述** / **CLI 完整命令表**（`init` / `add` / `build` / `apply` / `view` / `search` / `list` / `docs` / `info` / `migrate` / `preset` 全部 options）/ **components.json 全字段表**（含类型 + 默认值 + 是否可改）/ **`tailwind.cssVariables` 完整 token 清单**（background / foreground / primary / secondary / muted / accent / destructive / border / input / ring / chart-1~5 / sidebar 全部）/ **8 个 baseColor 列表** / **`cn()` 完整签名 + clsx + tailwind-merge 行为** / **`cva` 完整 API**（`variants` / `compoundVariants` / `defaultVariants`）/ **react-hook-form + zod 关键 API**（`useForm` / `zodResolver` / `<Form>` / `<FormField>` / Controller render prop）/ **@tanstack/react-table 关键 API**（`useReactTable` / `getCoreRowModel` / `getSortedRowModel` / `getFilteredRowModel` / `getPaginationRowModel`）/ **Blocks 完整列表**（Sidebar-01~16 / Dashboard-01~07 / Login-01~05 / Signup-01~03 / Authentication-XX）/ **Themes 完整 baseColor 表 + OKLCH 值** / **Registry registry.json + registry-item schema** / **MCP Server 配置示例**（Claude Code / Cursor / VS Code）/ **TypeScript 核心类型**（`ChartConfig` / `VariantProps` / `ButtonProps`）/ **Keyboard shortcuts**（每个交互组件键盘行为）/ **`useSidebar` / `useTheme` / `useFormField` Hook 完整签名**
