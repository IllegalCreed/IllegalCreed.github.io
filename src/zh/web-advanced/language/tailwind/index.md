---
layout: doc
---

# Tailwind CSS

**工具类优先（utility-first）的 CSS 框架**——它不给你 Button、Card 这类成品组件，而是提供成百上千个「单一职责」的原子类（`flex`、`px-4`、`text-center`、`hover:bg-sky-700`），让你直接在 HTML 的 `class` 上把样式「拼」出来。当前主线是 **v4**（npm 实测 `tailwindcss@4.3.2`，MIT），相对 v3 是一次架构级升级：全新的 **Oxide 引擎**（热点路径用 Rust 重写、内建 Rust 编写的 Lightning CSS）带来数倍到百倍的构建提速；配置从 `tailwind.config.js` 转向 **CSS-first**——用一行 `@import "tailwindcss";` 取代 v3 的三条 `@tailwind` 指令，用 CSS 里的 `@theme` 块声明设计令牌，且这些令牌会**同时**生成工具类并以真实 **CSS 变量**（`--color-blue-500`）暴露在 `:root`。它的心智模型极简：**样式即一串工具类，状态/响应式/深色模式全靠变体前缀**（`hover:`、`md:`、`dark:`）表达，改动只影响当前元素、CSS 不再随项目线性膨胀。

## 评价

**优点**

- **开发速度快**：不用为每个元素起类名、不用在 HTML 与 CSS 文件间来回跳，样式与结构同处一地，复制一整块 UI 即可搬走
- **约束即设计系统**：工具类背后是一套令牌（间距、颜色、字号），天然避免 magic number；`bg-blue-500` 比 `#3b82f6` 更一致、更好维护
- **变体覆盖面广**：`hover`/`focus`/`group`/`peer`/`has`/`not`/`aria`/`data`/响应式/深色模式全部可组合堆叠，行内 `style` 做不到的它都能做
- **CSS 不膨胀**：工具类高度复用，样式表体积趋于稳定，不会像传统「每个组件一段 CSS」那样线性增长
- **v4 生态与性能双高**：Oxide 引擎全量构建约快 3.5 倍、增量最高百倍量级；容器查询、3D 变换、`@starting-style`、OKLCH 广色域调色板全部内建；生态里 shadcn/ui 等组件方案直接建立在其工具类之上

**缺点**

- **HTML 会「变长」**：一个元素堆十几个类是常态，初见者容易觉得「脏」；需要配合编辑器插件（智能提示、类名排序）与组件抽象来缓解
- **有学习成本**：要记住工具类命名约定与变体体系；「什么时候用 `@apply`、什么时候抽组件」需要经验，滥用 `@apply` 会把优势又抽象回传统 CSS
- **v4 是较大升级**：CSS-first 配置、工具类改名（`shadow-sm`→`shadow-xs`、`ring` 默认宽度变化）、默认边框色改 `currentColor` 等，从 v3 迁移有一批破坏性变更要处理
- **面向现代浏览器**：v4 依赖 `@property`、`color-mix()`、级联层等现代 CSS，要求 Safari 16.4+/Chrome 111+/Firefox 128+，需兼容老环境只能留在 v3.4
- **不是组件库**：它只给「样式底座」，成品交互组件（对话框、下拉菜单）要么自己写、要么引入 Headless UI / Radix / shadcn 等在其之上的方案

## 文档地址

[Tailwind CSS 官网](https://tailwindcss.com) ｜ [文档首页](https://tailwindcss.com/docs) ｜ [v4.0 发布说明](https://tailwindcss.com/blog/tailwindcss-v4) ｜ [v3→v4 升级指南](https://tailwindcss.com/docs/upgrade-guide)

## GitHub 地址

[tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)

## 幻灯片地址

<a href="/SlideStack/tailwind-slide/" target="_blank">Tailwind CSS</a>
