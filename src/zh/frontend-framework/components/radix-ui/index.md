---
layout: doc
outline: [2, 3]
---

# Radix UI

**React 生态最具影响力的「Headless / Unstyled」底层组件库 + shadcn/ui 的底层引擎、a11y 体验业界天花板**——由 [WorkOS](https://workos.com)（开发者基础设施 SaaS 公司）孵化、社区开源，最早可追溯到 **2020 年** Modulz 团队的探索，**2022 年正式以 Radix Primitives 名义独立**。**Radix UI 不是一个传统的「全家桶」UI 库**——它把自己拆成 **两条独立产品线**：

1. **Radix Primitives**（**Unstyled / Headless**）—— **彻底无样式、纯行为 + a11y + 键盘导航 + 焦点管理的底层 React 组件**。**30+ 独立 npm 包**（如 `@radix-ui/react-dialog` / `@radix-ui/react-dropdown-menu`），每个组件独立版本号、独立安装、独立升级。**没有任何默认 CSS**——所有样式由开发者自己用 **CSS / Tailwind / CSS Modules / Stitches** 写。**截至 2026 年 5 月稳定版 v1.x（每个 Primitive 独立版本）**，统一聚合包 `radix-ui@latest`（**v1.x**，2024 年发布）允许 `npm install radix-ui` 一次拿到所有 Primitives。**GitHub 18.9k+ Star、月下载量 1.3 亿+**。**[shadcn/ui](https://ui.shadcn.com)（截至 2026 年 GitHub 90k+ Star 的现象级 React UI 项目）就是基于 Radix Primitives + Tailwind + 拷贝代码哲学** 构建的——**Radix Primitives 是 shadcn/ui 的事实底层**，所以「**学了 Radix Primitives = 半个 shadcn/ui 已经会了**」
2. **Radix Themes**（**Styled / 完整设计系统**）—— **带样式的完整组件库 + 设计 token + 暗色模式 + 全局 `<Theme>` 主题**。**单包安装** `@radix-ui/themes`，**70+ 组件** 覆盖 Layout / Form / Display / Feedback / Navigation / Typography 完整体系。**截至 2026 年 5 月稳定版 v3.x**（**v3.1.3 是当前最新**，**v3.0 在 2024 年 3 月发布**——是基于 Radix Primitives 的**重新设计**，引入 11 个新组件 + 新布局引擎 + Dot Notation API + ESM 全面支持）。**vs Mantine / MUI / Chakra**——Radix Themes 是它们的「**同位竞品**」，但**因为 Themes 上市晚 + 配置封闭 + 用户基数小，海外用户仍主要使用 Primitives**

**Radix Primitives 核心特性**：**Unstyled by Design**（无样式、零优先级冲突 / 任何 CSS 方案都能用）/ **a11y 业界顶级**（**WAI-ARIA 完整实现** / 键盘导航 / 焦点陷阱 / 焦点返回 / screen reader 测试）/ **Compound Component 模式**（`Dialog.Root` + `Dialog.Trigger` + `Dialog.Portal` + `Dialog.Overlay` + `Dialog.Content` + `Dialog.Title` + `Dialog.Description` + `Dialog.Close`——**每个组成部分独立暴露、细粒度控制**）/ **Controlled + Uncontrolled 双模式**（`open` + `onOpenChange` 受控、`defaultOpen` 非受控） / **`asChild` Slot 模式**（Radix 独门绝技：<span v-pre>`<Dialog.Trigger asChild><MyButton /></Dialog.Trigger>`</span>，**Slot 把功能注入子元素而非额外包一层 DOM**，与 React Router Link / Next.js Link 完美组合） / **Portal 默认**（Dialog / Popover / Tooltip 等 overlay 类组件默认 Portal 到 `<body>`，**彻底解决 `z-index` / `overflow: hidden` 问题**） / **data-state 状态属性**（`data-state="open"` / `data-state="closed"` / `data-orientation="horizontal"` / `data-disabled` 等——**CSS 选择器即可响应状态**：`.Trigger[data-state="open"]`） / **CSS 变量动画**（`--radix-dialog-content-transform-origin` / `--radix-accordion-content-height` 等——**JS 不需要测量 DOM 即可实现展开高度动画**） / **Collision Detection**（Popover / Dropdown / Tooltip 自动检测视窗边缘碰撞并翻转位置） / **30+ Primitives 独立包**（Tree Shake 完美、按需安装零冗余） / **TypeScript-first** / **React 18+ 自带 `useId` 完美 SSR**

**Radix Themes 核心特性**（区别于 Primitives）：**`<Theme>` 全局配置**（`accentColor` / `grayColor` / `radius` / `scaling` / `appearance` / `panelBackground` 六大配置 prop）/ **16 个 accent 色板 + 6 个 gray 色板**（每色板 **12 阶**：步骤 1-2 背景 / 3-5 交互 / 6-8 边框 / 9-10 实色 / 11-12 文字——这套**色板系统**就是著名的 [Radix Colors](https://www.radix-ui.com/colors)，已成为业界事实标准）/ **统一 Layout Props**（Box / Flex / Grid / Container / Section 共享 30+ 响应式 props：`width` / `height` / `m` / `p` / `position` 等）/ **6 个变体（variant）**（`classic` / `solid` / `soft` / `surface` / `outline` / `ghost`——大部分组件都支持这套）/ **4 个 size**（`"1"` / `"2"` / `"3"` / `"4"` 响应式数字 size）/ **Dot Notation API**（v3 全部改：`Dialog.Root` / `Dialog.Trigger` / `Card.Root` / `TextField.Root` / `TextField.Slot`）/ **vanilla CSS 实现**（**不用任何 CSS-in-JS、不用 PostCSS、不用构建插件**——**零运行时样式开销**） / **响应式 prop 对象**（<span v-pre>`size={{ initial: "1", md: "3" }}`</span>）

**典型用户群**：**全球 React 开发者 + 设计师 + 设计驱动型 SaaS / Dashboard / 文档站 / 工具站 + 海外创业团队 + 个人开发者**。**Radix Primitives** 在海外 React 社区的影响力**与 React Hook Form 并列**——**几乎所有现代 React UI 库底层都使用或借鉴 Radix**（如 shadcn/ui / Chakra UI v3 的 Ark UI / NextUI / Magic UI / Park UI 等）。**Radix Themes** 则是 Vercel 系 / Linear 早期等**追求设计感**的产品的选择。

> Radix UI 是 React UI 库**生态位最特殊**的一员——它**不是给你完整组件用**，它是**给你『盒子』和『行为』，让你自己装 UI**。如果你**会写 Tailwind + 想要完美 a11y + 不想被任何 UI 库的样式系统绑架**，那 **Radix Primitives + Tailwind**（或直接用 shadcn/ui）就是当代 React 最自由的搭配。**截至 2026 年的 Radix 生态** 处于「**Primitives 持续主导 + Themes 渐进演进 + shadcn 借势爆火**」三位一体期——是任何 React 开发者**都应该熟悉**的底层基建库。

## 评价

**优点**

- **Headless / Unstyled 设计哲学开创性**：Radix Primitives 是 React 生态把 **「样式 vs 行为」彻底解耦** 的代表作品。**没有任何默认 CSS、没有 `className` 默认值、没有 `color` / `size` props**——**只暴露 a11y + 行为 + 键盘 + 焦点管理**。**vs 传统 UI 库一定要 fight 样式优先级、Radix Primitives 完全没这个问题**——**任何 CSS / Tailwind / CSS Modules / styled-components 都能 100% 自由控制视觉**
- **a11y 业界天花板**：Radix 团队对 a11y 的执着**仅次于 Chakra UI、甚至在某些组件上超越**——**所有组件严格遵循 [WAI-ARIA 1.2 设计模式](https://www.w3.org/WAI/ARIA/apg/)**、**焦点管理精细到极致**（Dialog 打开 → 焦点锁定 → 关闭 → 返回 Trigger）、**键盘导航完整**（Arrow / Home / End / PageUp / PageDown / Esc / Enter / Space / Type to find 全支持）、**screen reader 实测通过**（NVDA / JAWS / VoiceOver / TalkBack）。**a11y 是 Radix 最大的非视觉卖点**
- **Compound Component 模式典范**：Radix 把每个组件拆成多个 sub-component（**Dialog.Root + Dialog.Trigger + Dialog.Portal + Dialog.Overlay + Dialog.Content + Dialog.Title + Dialog.Description + Dialog.Close**），**结构清晰、可拆分、可重组、可单独样式**。这套模式后来被 **Chakra UI v3 / Ark UI / Park UI / Magic UI** 全部借鉴
- **`asChild` Slot 模式独门绝技**：<span v-pre>`<Tooltip.Trigger asChild><MyCustomButton /></Tooltip.Trigger>`</span> ——**Slot 把所有 props 注入子元素而不额外渲染 DOM 节点**。**vs Mantine `component` prop / Chakra `as` prop**——Radix `asChild` 在 a11y 一致性 / TypeScript 推导 / 多层组合上**最彻底**。与 **Next.js Link / React Router Link** 组合时无缝
- **shadcn/ui 的事实底层**：截至 2026 年 GitHub 90k+ Star 的 **shadcn/ui** 把 Radix Primitives + Tailwind 4 + 拷贝代码到本地 三者组合成爆款。**会 Radix Primitives = 半个 shadcn/ui 已经会了**——shadcn 的 `<Dialog>` 本质就是 Radix `Dialog.Root` 用 Tailwind 样式封装
- **30+ Primitives 独立 npm 包 + 聚合包**：每个组件（`@radix-ui/react-dialog` / `@radix-ui/react-dropdown-menu` / `@radix-ui/react-popover` / `@radix-ui/react-select` 等）**独立版本、独立安装、独立升级**。**Tree Shake 完美**、**bundle 极致最小化**。v1.x 起统一聚合包 `radix-ui@latest` 允许 `npm install radix-ui` + `import { Dialog } from "radix-ui"` 一次拿全
- **Portal 默认 + Collision Detection 智能避让**：Dialog / Popover / Dropdown / Tooltip / Select 等 overlay 类组件**默认 Portal 到 `<body>` 末端**——**彻底解决 `z-index` 层叠 / `overflow: hidden` 裁剪 / 父级 `transform` 锚定丢失**等经典痛点。**自动检测视窗边缘并翻转方向**（`avoidCollisions={true}` 默认开启）
- **data-state + CSS 变量驱动动画**：**`data-state="open"` / `data-state="closed"`** 状态属性 + **`--radix-accordion-content-height` / `--radix-dialog-content-transform-origin`** CSS 变量——**纯 CSS / Tailwind 即可实现完整展开 / 折叠 / Slide 进入退出动画**，**不需要 JS 测量 DOM 高度**、**不需要 Framer Motion**
- **Controlled + Uncontrolled 双模式 + 受控 prop 一致**：所有 Primitive 都同时支持 `defaultOpen`（非受控）和 `open` + `onOpenChange`（受控）两种模式 —— **API 一致性极高**
- **完整 React 18 SSR 支持**：自带 `useId` —— Next.js App Router / Remix / Vite SSR / TanStack Router 全部一键集成、**无 hydration warning**
- **TypeScript-first**：所有组件、props、event 完整 TS 类型 —— **IDE 智能提示完美**
- **WorkOS 商业化背书**：[WorkOS](https://workos.com) 是估值 $10亿+ 的 SaaS 公司，**有专门团队维护 Radix**——**vs Mantine 单人维护 / shadcn/ui 个人项目**，Radix 的 bus factor 更稳定
- **Radix Colors 12 阶色板成为业界标准**：Radix 团队独立发布的 [Radix Colors](https://www.radix-ui.com/colors) 把每色板分成 **12 阶语义**（1-2 背景 / 3-5 交互 / 6-8 边框 / 9-10 实色 / 11-12 文字）—— **vs Tailwind 50-950 纯视觉灰度梯度、Radix 12 阶是「角色语义」**，已被 Tailwind 后续吸收
- **`<Theme>` 全局配置 Radix Themes 一行启用**：<span v-pre>`<Theme accentColor="indigo" grayColor="slate" radius="medium" scaling="100%" appearance="dark">`</span> —— **整站主题 / 圆角 / 缩放 / 暗色模式一行搞定**
- **vanilla CSS 实现 Radix Themes 零运行时**：**不依赖 Emotion / styled-components / Stitches / Panda CSS** —— **vs Chakra v2 Emotion 运行时、vs Mantine v7+ CSS Modules（仍需 PostCSS 配置）**，Radix Themes 是**最简单的 CSS 引入即用**
- **Layout 系统统一 Props 30+**：Radix Themes 的 Box / Flex / Grid / Container / Section 共享统一的 30+ Layout props（`width` / `height` / `m` / `p` / `position` / `flex` / `grid` 等）—— **响应式对象语法** <span v-pre>`p={{ initial: "2", md: "4" }}`</span>
- **6 个 variant + 4 个 size 一致性**：大部分 Themes 组件都支持 `classic` / `solid` / `soft` / `surface` / `outline` / `ghost` 六个变体 + `"1"` ~ `"4"` 四个尺寸 ——**整站视觉一致性极高**
- **官方文档英文质量极高 + 实时 Playground**：[radix-ui.com](https://www.radix-ui.com) —— 每个组件「Anatomy」「API Reference」「Examples」「Accessibility」「Styling」结构清晰、Sandpack 在线编辑、CSS variables 列表完整
- **Discord 社区活跃 + 5500+ 成员**：开源 React UI 库社区里**最活跃前列**之一

**缺点**

- **国内市场份额几乎为 0**：Radix Primitives 在国内 React 中后台市场**完全没有存在感**——招聘市场、培训、面试、第三方集成都围绕 **Ant Design**，**国内项目选 Radix 的人才储备稀缺**。但**会写 Tailwind + shadcn/ui** 的国内开发者越来越多，**间接使用 Radix 的比例正在快速上升**
- **「不是开箱即用」是双刃剑**：Radix Primitives **完全无样式 + 完全无图标 + 完全无主题** —— **新手入门陡峭**、**「装完包发现什么都没有」**。**vs Mantine / MUI / Ant Design 装完就能用** —— Radix 需要你**自己写 Tailwind 类、自己挑图标库、自己设计 token**。**适合有审美 + 会 Tailwind 的开发者**，不适合追求开箱即用的团队
- **vs shadcn/ui**：shadcn/ui **拷贝代码到本地 + Tailwind 默认样式 + CLI 安装 + 开箱即用美观**；Radix Primitives **纯无样式 + 任何 CSS 方案 + 完全自由**——**shadcn 是「带样式的 Radix」、Radix 是「裸的 shadcn 底层」**。**99% 的实际场景下应该直接用 shadcn/ui**、**只有需要完全自定义视觉时才直接用 Radix Primitives**
- **vs Headless UI**：[Headless UI](https://headlessui.com)（Tailwind 团队的 headless 库）—— **组件数量少（~10 个）但与 Tailwind / Next.js 集成更紧密**；Radix **30+ Primitives、a11y 更扎实、Compound Component 模式更完整** —— **简单场景选 Headless UI、复杂 a11y 必须场景选 Radix**
- **vs Ark UI（Chakra v3 底层）**：[Ark UI](https://ark-ui.com)（Chakra 团队的 headless 库）—— **基于 Zag 状态机 / 支持 React + Vue + Solid 三框架**；Radix **只支持 React 但生态深度更广** —— **多框架选 Ark UI、纯 React 生态选 Radix**
- **vs React Aria**（Adobe）—— **a11y 更彻底但 API 更繁琐**；Radix **API 更简洁、社区更活跃**
- **Radix Themes 用户基数远小于 Primitives**：截至 2026 年，**真正在用 Radix Themes（带样式）的项目稀少**——**生态主要围绕 Primitives + shadcn/ui**。**Radix Themes 在 Mantine / MUI / Chakra / Ant Design 面前**没有显著优势：组件数量更少、社区资源更少、Pro 商业组件不存在
- **Radix Themes 样式系统封闭**：Radix Themes 官方明确表态**「styles are intentionally closed」**——**深度自定义需要回退到用 Primitives + 自己写样式**。**vs Mantine Styles API（classNames / styles / vars 三重）/ Chakra Recipes**——Radix Themes 自定义能力是这几个库里**最弱的**
- **Tailwind 与 Radix Themes 不完全兼容**：Radix Themes 官方警告 **「Tailwind reaches into the component internals」** —— **Themes + Tailwind 混用容易出 specificity 冲突**。**所以现实是：Primitives + Tailwind（推荐） vs Themes 单用（不要混 Tailwind）**
- **没有 DataTable / Pro Components / 高级业务组件**：Radix Themes **没有数据表格 / 分页 / 树形控件 / 富文本 / 文件上传** —— 企业级 CRUD 场景**完全空白**。**需要这些必须用 TanStack Table + 自己组合**
- **没有官方 Mobile 版**：vs Ant Design `antd-mobile` —— Radix **专注 Desktop / Web、没有官方 Mobile 优化**
- **没有官方图标库**：Radix Primitives + Themes 都**不自带图标**——推荐 [Radix Icons](https://www.radix-ui.com/icons)（**仅 300+ 个**、远不如 [Lucide React](https://lucide.dev) 1500+）/ `lucide-react` / `react-icons`
- **30+ 独立包管理略繁琐**：每个 Primitive 一个 npm 包 —— **`package.json` dependencies 列表会变长**。**v1.x 起聚合包 `radix-ui` 缓解了这个问题**、但**社区习惯仍是独立装**
- **CSS 变量动画学习曲线**：用 `data-state` + `--radix-content-transform-origin` 写动画需要**理解 CSS 自定义属性 + transition 语法** —— **比 Framer Motion 入门陡峭**
- **官方文档侧重 API、缺少完整业务示例**：vs **shadcn/ui Blocks**（200+ 业务级 Block 免费）—— Radix 官方文档**只演示组件本身用法**、**缺少完整业务级组合示例**。**好在 shadcn Blocks 就是 Radix 的事实业务示例库**
- **Radix Themes v2 → v3 是 breaking**：2024.3 v3 引入 Dot Notation API + 11 个新组件 + Layout 系统重构 —— v2 项目迁移成本不小

## 文档地址

[Radix UI 官网](https://www.radix-ui.com/) | [Primitives 主页](https://www.radix-ui.com/primitives) | [Primitives 入门](https://www.radix-ui.com/primitives/docs/overview/getting-started) | [Primitives 介绍](https://www.radix-ui.com/primitives/docs/overview/introduction) | [Themes 主页](https://www.radix-ui.com/themes) | [Themes 入门](https://www.radix-ui.com/themes/docs/overview/getting-started) | [Theme 配置](https://www.radix-ui.com/themes/docs/theme/overview) | [Radix Colors（12 阶色板）](https://www.radix-ui.com/colors) | [Radix Icons](https://www.radix-ui.com/icons) | [组件总览](https://www.radix-ui.com/themes/docs/components) | [样式指南](https://www.radix-ui.com/primitives/docs/guides/styling) | [Composition / asChild 指南](https://www.radix-ui.com/primitives/docs/guides/composition) | [SSR 指南](https://www.radix-ui.com/primitives/docs/guides/server-side-rendering) | [Playground](https://www.radix-ui.com/themes/playground) | [Release Notes](https://www.radix-ui.com/themes/docs/overview/releases) | [shadcn/ui（Radix 上层）](https://ui.shadcn.com)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=radix-ui" target="_blank" rel="noopener noreferrer">Radix UI 测试题</a>


## GitHub 地址

[radix-ui/primitives](https://github.com/radix-ui/primitives)（主仓库，18.9k+ Star） | [radix-ui/themes](https://github.com/radix-ui/themes)（Themes 仓库） | [radix-ui/colors](https://github.com/radix-ui/colors)（12 阶色板） | [radix-ui/icons](https://github.com/radix-ui/icons)（图标库） | [radix-ui/website](https://github.com/radix-ui/website)（官网源码） | [shadcn-ui/ui](https://github.com/shadcn-ui/ui)（shadcn 主仓库，90k+ Star，Radix 上层）

## 学习路径

- [入门](./getting-started.md)：Radix Primitives 概念（**Unstyled / Compound Component / asChild / Portal**）/ 安装路径选择（**独立包 vs 聚合包 `radix-ui`**）/ 第一个 Dialog（`@radix-ui/react-dialog` + Tailwind 样式）/ 第一个 Dropdown Menu（含 Sub Menu）/ 第一个 Popover / `data-state` CSS 样式语法 / **CSS 变量驱动动画**（`--radix-accordion-content-height`）/ Radix Themes 安装路径（`@radix-ui/themes` + `styles.css` + `<Theme>`）/ Theme 配置 props（`accentColor` / `grayColor` / `radius` / `scaling` / `appearance`）/ 第一个 Themes Button + TextField + Card / **与 shadcn/ui 的关系**（shadcn 如何包装 Radix Primitives）/ Next.js App Router 集成 / Vite 集成
- [指南](./guide-line.md)：**核心**：Radix Primitives 全部 **30+ 组件分组**（**Form 类**：Checkbox / Radio Group / Switch / Slider / Toggle / Toggle Group / Form / Label；**Overlay 类**：Dialog / Alert Dialog / Popover / Hover Card / Tooltip；**Menu 类**：Dropdown Menu / Context Menu / Menubar / Navigation Menu；**Disclosure 类**：Accordion / Collapsible / Tabs；**Visualization**：Progress / Avatar / Aspect Ratio；**Utility**：Portal / Slot / Visually Hidden / Direction Provider / Accessible Icon / Scroll Area / Separator）/ **Compound Component 模式深度**（Dialog / Dropdown Menu / Popover / Select 完整 anatomy）/ **Controlled vs Uncontrolled**（`open` + `onOpenChange` vs `defaultOpen`）/ **`asChild` Slot 模式深度**（Next.js Link / React Router Link / 多层组合）/ **Portal 用法**（默认 Portal / 自定义 container / SSR 注意）/ **data-state + data-orientation + data-disabled CSS 选择器**/ **CSS 变量动画**（`--radix-accordion-content-height` / `--radix-dialog-content-transform-origin` / `--radix-popover-trigger-width` 等完整列表）/ **键盘导航全表**（Dialog / Menu / Select / Slider / Accordion / Tabs 每个组件键盘行为）/ **Tailwind 集成最佳实践**（`data-[state=open]:bg-blue-500` / `data-[side=top]:slide-in-from-bottom`）/ **Radix Themes 体系**（Layout 系统 30+ Props / Typography / Form / Display / Feedback / Navigation / **`<Theme>` 配置完整 prop 表**）/ **Radix Colors 12 阶色板深度**（角色语义 / `--accent-1` ~ `--accent-12` / 暗色模式自动反转）/ **`accentColor` 16 个选项 + `grayColor` 6 个选项** / **响应式 Prop 对象语法** / **Next.js App Router 完整集成**（layout.tsx 包根 / `appearance` 同步 next-themes / hydration 注意）/ **与 shadcn/ui 协作**（shadcn 如何用 Radix + Tailwind 包装）/ **常见踩坑**（Portal SSR / `asChild` 必须 `React.forwardRef` / Controlled 状态丢失 / Tailwind + Themes 冲突 / hydration warning）
- [参考](./reference.md)：**API 速查**：30+ Primitives 完整清单（含每个独立 npm 包名）/ 每个核心 Primitive 完整 props 速查（Dialog / Dropdown / Popover / Select / Tooltip / Accordion / Tabs / Slider / Toast 等）/ Radix Themes 70+ 组件清单 / `<Theme>` 完整 props 表 / **Layout Props 30+ 完整列表**（width / height / m / p / position / flex / grid / 全响应式） / **6 variant + 4 size 完整表** / **Radix Colors 16 accent + 6 gray 色板** / **CSS 变量完整清单**（`--radix-*` 全部命名空间）/ **data-state / data-orientation / data-disabled 属性表** / **键盘快捷键全表** / **`asChild` / `Portal` / `Slot` 工具组件** / **TypeScript 核心类型**
