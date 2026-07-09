---
layout: doc
---

# Iconify

**统一的开源图标框架（The unified open source icon framework）**——由 **Vjacheslav Trushkin（cyberalien，Iconify OÜ）** 维护，把 **200+ 个开源图标集、共 27 万+ 图标**（Material Symbols、Carbon、Tabler、Lucide、Phosphor、Bootstrap Icons、Simple Icons、各种 emoji 集……）用**一套统一语法 `prefix:name`**（如 `mdi:home`、`carbon:add`）访问。与 **react-icons / Font Awesome / SVG sprite「整套打包」不同**，Iconify 渲染**像素级精确的 SVG（不是字体）**、**按需从 Iconify API 只加载你实际用到的图标**——没用到的图标既不打包也不下载。**多种使用方式**：**① `iconify-icon` Web Component**（框架无关、用 Shadow DOM、**SSR 安全**，`<iconify-icon icon="mdi:home">`）；**② 各框架原生组件** `@iconify/react` / `@iconify/vue` / `@iconify/svelte` / Solid（`<Icon icon="mdi:home" />`）；**③ 构建时方案** `@iconify/tailwind`（Tailwind 3）/ `@iconify/tailwind4`（Tailwind 4）/ **UnoCSS `@unocss/preset-icons`**（class 如 `i-mdi-home`，**本 quiz-monorepo 项目正用此方案**）。**几个必须理解的行为**：图标默认 **`height: 1em`**（宽度按比例自动），**随字体大小缩放**；**只有单色图标（用 `currentColor`）能改色**（调文字 `color`、**不要设 `fill`**），彩色/emoji 图标改不了色；**翻转/旋转在 SVG 内部完成**（改 viewBox，不是 CSS transform），`rotate` 用 `1/2/3` 表示 `90/180/270` 度；**`flip` 属性名各端不同**——React/Svelte 用 `hFlip`/`vFlip`，Vue 用 `horizontalFlip`/`verticalFlip`，Web Component 用单个 `flip` 字符串。**API 与离线**：默认从公共 API `api.iconify.design`（带 `simplesvg.com` / `unisvg.com` 备份、0.75s 故障切换）按需加载；要完全离线用 `@iconify/json`（全量）或 `@iconify-json/<prefix>`（单集合）配 `addCollection` 预注册（**注意：旧的 localStorage 图标缓存已于 2025 年废弃**）。**周边**：`@iconify/utils`（`getIconData` / `iconToSVG` / `iconToHTML` / `replaceIDs` / `calculateSize`）、Iconify for Figma 插件、Icon Finder 选图器、`@iconify-json/*` 按集合分发的数据包。**典型用户群**：**几乎所有需要图标的现代前端项目**——尤其是想「**一套语法用遍所有图标集 + 按需加载零冗余**」的团队；React/Vue/Svelte/纯 HTML/Tailwind/UnoCSS 全覆盖。

## 评价

**优点**

- **一套语法访问 200+ 图标集、27 万+ 图标**：`prefix:name` 统一访问 Material Symbols / Carbon / Tabler / Lucide / Phosphor / Simple Icons / emoji…，**不用为每套图标装不同的库**
- **真正的按需加载、零冗余**：渲染 SVG、从 API 只取用到的图标——**不像 react-icons / Font Awesome 把整套塞进 bundle**
- **像素级精确 SVG**：非字体图标，无字体渲染模糊/基线问题；所有图标经清洗、优化、校验（拒绝脚本/位图/外部资源）
- **全框架覆盖 + SSR 方案**：`iconify-icon` Web Component（Shadow DOM、SSR 安全）+ React/Vue/Svelte/Solid 原生组件 + 构建时 Tailwind/UnoCSS 方案——总有一款适合你的技术栈
- **像字体一样用**：默认 `1em` 随字体大小缩放，单色图标 `currentColor` 跟随文字颜色——CSS 控制直观
- **构建时零运行时**：`@iconify/tailwind` / UnoCSS `presetIcons` 在构建期把图标内联成 CSS，**无运行时请求、无 JS**
- **强大的工具生态**：`@iconify/utils` 编程式生成 SVG、Figma 插件、Icon Finder、按集合分发的 `@iconify-json/*`
- **开源中立**：聚合各家开源图标集，统一维护更新；MIT/各集合自身许可

**缺点**

- **彩色/多色图标不能改色**：只有单色（`currentColor`）图标可重新着色，emoji / 彩色 logo 类改不了——需注意区分
- **React/Vue 原生组件默认不 SSR**：`@iconify/react` / `@iconify/vue` **挂载后才渲染 SVG**（避免 hydration 错），首屏可能有微小延迟；**真要 SSR 首屏出图**得用 Web Component / 构建时 CSS 方案 / 传图标数据对象（Vue 有 `ssr` 属性）
- **在线 API 的隐私/可用性顾虑**：默认走公共 API（图标名会发到 iconify.design）——对隐私/内网敏感的项目需**自建 API 或完全离线**（`@iconify/json` + `addCollection`）
- **各端 API 细节不一致**：`flip` 在 React/Svelte 是 `hFlip`/`vFlip`、Vue 是 `horizontalFlip`/`verticalFlip`、Web Component 是 `flip` 字符串；Svelte 组件是 **default 导出**而 React/Vue 是 **named 导出**——跨框架迁移易踩
- **localStorage 缓存已废弃**：2025 年起旧的浏览器端图标缓存（`enableCache`）移除，不能再依赖
- **pnpm + UnoCSS 的已知坑**：`presetIcons` 自动发现 `@iconify-json/*` 在 pnpm 严格隔离下可能失效，**需显式 `collections` 导入**（本项目 CLAUDE.md 已记录此坑）
- **数据包体积**：`@iconify/json` 全量包很大（仅离线全量时才需要，通常按 `@iconify-json/<prefix>` 单集合装）

## 文档地址

[Iconify 官网](https://iconify.design/) | [文档](https://iconify.design/docs/) | [iconify-icon Web Component](https://iconify.design/docs/iconify-icon/) | [React 组件](https://iconify.design/docs/icon-components/react/) | [Vue 组件](https://iconify.design/docs/icon-components/vue/) | [图标搜索](https://icon-sets.iconify.design/)

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=iconify" target="_blank" rel="noopener noreferrer">Iconify 测试题</a>


## GitHub 地址

[iconify/iconify](https://github.com/iconify/iconify)（主仓库，MIT 许可）| [@iconify/utils](https://github.com/iconify/iconify/tree/main/packages/utils)（工具库）| [@iconify-json](https://github.com/iconify/icon-sets)（图标数据集）

## 学习路径

- [入门](./getting-started.md)：Iconify 是什么（统一图标框架，按需加载，对比 react-icons / Font Awesome） / 三种使用方式（Web Component / 框架组件 / 构建时 Tailwind·UnoCSS） / 图标命名 `prefix:name` 与图标搜索 / 基本用法（尺寸 `1em` / 颜色 `currentColor` / 翻转旋转） / 在 React / Vue / 纯 HTML 里用 / **本项目 UnoCSS `presetIcons` 用法（`i-mdi-home` + pnpm collections 坑）** / SSR 注意
- [指南](./guide-line.md)：**框架组件深度**（`@iconify/react` 的 `hFlip`/`vFlip` vs `@iconify/vue` 的 `horizontalFlip`/`verticalFlip` vs Web Component 的 `flip`、SSR 行为、`onLoad`） / **Web Component 四种渲染模式**（svg/style/bg/mask） / **API 与离线**（公共 API + 备份 + 故障切换 / 自建 API / `@iconify/json` + `addCollection` 离线 / IconifyJSON 数据格式 / localStorage 缓存已废弃） / **工具链集成**（`@iconify/tailwind` T3 vs `@iconify/tailwind4` T4 的 `addDynamicIconSelectors` / `addIconSelectors`、动态 class 双连字符 / UnoCSS `presetIcons` / `@iconify/utils` 五大函数） / **常见坑**（彩色图标不能改色、不要设 fill、各端 flip 命名、Svelte default 导出、SSR、pnpm collections）
