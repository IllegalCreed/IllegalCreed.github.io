---
layout: doc
outline: [2, 3]
---

# v3→v4 迁移、Oxide 引擎与生态

> 基于 Tailwind CSS 4.3 · 核于 2026-07

## 速查

- **升级工具**：`npx @tailwindcss/upgrade`（需 Node 20+），自动处理大部分改名与语法迁移，跑完仍需人工复核。
- **浏览器要求**：v4 需 Safari 16.4+/Chrome 111+/Firefox 128+，**不支持 IE11**；要兼容更老环境留在 **v3.4**。
- **引入语法**：三条 `@tailwind …` → 一行 `@import "tailwindcss";`。
- **工具类改名**：`shadow-sm`→`shadow-xs`、`shadow`→`shadow-sm`；`blur`→`blur-sm`、`blur-sm`→`blur-xs`；`rounded`→`rounded-sm`、`rounded-sm`→`rounded-xs`；`outline-none`→`outline-hidden`；`ring` 默认宽 3px→1px（要 3px 用 `ring-3`）。
- **默认色变化**：`border`/`ring`/`divide` 默认色 `gray-200`/`blue-500` → **`currentColor`**；`placeholder` → currentColor 50%。
- **语法变化**：`!flex`（前置）→ `flex!`（后置）；`bg-[--var]` → `bg-(--var)`；前缀改变体式 `tw:flex`。
- **移除的废弃类**：`bg-opacity-*`→`bg-black/50`；`flex-shrink-*`→`shrink-*`、`flex-grow-*`→`grow-*`；`overflow-ellipsis`→`text-ellipsis`。
- **其它**：`@layer utilities` 自定义类 → `@utility`；JS 配置需 `@config` 显式加载；`space-*` 选择器变更（建议改 `gap`）；`hover` 受 `(hover: hover)` 约束；默认按钮 `cursor` 由 pointer 变 default。
- **Oxide 引擎**：代号 Oxide，热点用 **Rust**、核心留 **TypeScript**，唯一依赖 **Lightning CSS**（Rust 写）；全量构建约快 3.5×、增量最高百倍量级；内建 import/嵌套/前缀，免 postcss-import + autoprefixer。
- **安装矩阵**：Vite→`@tailwindcss/vite`；PostCSS→`@tailwindcss/postcss`；无构建→`@tailwindcss/cli`。
- **生态**：shadcn/ui、Headless UI、Radix、`@tailwindcss/typography` 等，均建立在工具类之上。
- **边界**：UnoCSS 是同赛道竞品（本组独立叶）；PostCSS 是独立叶（v4 有一等 PostCSS 插件，但 Vite 项目首选 Vite 插件，且不再需手配 postcss-import/autoprefixer）。

## 一、先跑升级工具

从 v3 迁移，第一步永远是官方升级工具：

```bash
npx @tailwindcss/upgrade   # 需 Node 20+
```

它会把 `@tailwind` 指令换成 `@import`、迁移大部分改名与任意值语法、并尽量把 `tailwind.config.js` 转成 `@theme`。但它不是万能的，跑完务必 diff 复核、在目标浏览器实测。

## 二、破坏性变更清单（按影响面）

| 类别 | v3 | v4 |
| --- | --- | --- |
| 引入 | `@tailwind base/components/utilities` | `@import "tailwindcss";` |
| 阴影 | `shadow-sm` / `shadow` | `shadow-xs` / `shadow-sm` |
| 模糊 | `blur-sm` / `blur` | `blur-xs` / `blur-sm` |
| 圆角 | `rounded-sm` / `rounded` | `rounded-xs` / `rounded-sm` |
| 轮廓 | `outline-none` | `outline-hidden` |
| 环 | `ring`（3px，蓝） | 默认 1px、currentColor；3px 用 `ring-3` |
| 边框默认色 | `gray-200` | `currentColor` |
| important | `!flex`（前置） | `flex!`（后置） |
| 变量任意值 | `bg-[--var]` | `bg-(--var)` |
| 自定义工具类 | `@layer utilities { .x {} }` | `@utility x {}` |
| JS 配置 | 自动加载 | 需 `@config` 显式加载 |
| 间距工具 | `space-x/y-*`（旧选择器） | 选择器变更，建议改 `gap` |
| 废弃类 | `bg-opacity-*`、`flex-shrink-*` | `bg-black/50`、`shrink-*` |

其中最容易「静默出错」的是**默认边框色变化**（页面边框颜色悄悄变了）和 **`space-*` 选择器变化**（含内联元素的布局间距变样）——这两处升级工具不一定帮你判断意图，要重点自查。

## 三、Oxide 引擎：v4 提速的来源

v4 的性能飞跃来自全新引擎（开发代号 **Oxide**），设计取舍很清晰：

- **Rust 提速**：把框架里「最昂贵、可并行」的部分迁移到 Rust。
- **TS 可扩展**：核心仍保留 TypeScript，方便社区写插件与扩展。
- **一个依赖**：新引擎唯一依赖是同样用 Rust 写的 **Lightning CSS**，它负责解析、嵌套展开、供应商前缀、现代语法转换——于是 v4 **内建**了这些能力，不再需要单独配 `postcss-import` 和 `autoprefixer`。

官方给出的基准：全量构建约快 3.5 倍（约 378ms→100ms 量级），增量构建在「没有新类」时可快到百倍量级（约 35ms→数百微秒）。对大型项目的开发体验提升明显。

## 四、安装矩阵：按环境选一等公民

| 环境 | 装什么 | 怎么接 |
| --- | --- | --- |
| **Vite**（首选） | `tailwindcss @tailwindcss/vite` | `plugins: [tailwindcss()]` |
| **PostCSS**（Next 等） | `tailwindcss @tailwindcss/postcss` | `postcss.config` 里加插件 |
| **无构建工具** | `@tailwindcss/cli` | 命令行产出 CSS |

三者 CSS 入口都是同一行 `@import "tailwindcss";`。

## 五、生态：组件方案建立在工具类之上

Tailwind 只给「样式底座」，成品交互组件靠上层生态补足——它们的共同点是**样式全用 Tailwind 工具类**：

- **shadcn/ui**：基于 Tailwind + Radix 原语的组件集合，**复制源码进项目**（而非 npm 黑盒），类名可直接改，定制自由度高。
- **Headless UI**：Tailwind 官方的「无样式可访问组件」（下拉、对话框、切换等），交互与无障碍由它管、样式你用工具类写。
- **Radix UI**：无样式的可访问原语，常与 Tailwind 搭配（shadcn 即基于它），会在元素上写 `data-state` 等属性，正好配 `data-[state=open]:` 变体。
- **官方插件**：`@tailwindcss/typography`（`prose` 排版）、`@tailwindcss/forms` 等，v4 用 `@plugin` 加载。

```html
<!-- 与 Radix/Headless UI 联动：据 data-state 设样式 -->
<div data-state="open" class="opacity-0 data-[state=open]:opacity-100 transition">…</div>
```

## 六、边界：与 UnoCSS、PostCSS、原生 CSS 的关系

- **UnoCSS**（本组独立叶）：同为**原子化 CSS** 路线的竞品，是「即时按需的原子化引擎」，主打 preset 高度可定制与性能，并提供**兼容 Tailwind 类名**的 preset（迁移友好）。二者理念相近、可相互替代——Tailwind 胜在官方设计系统与生态最成熟，UnoCSS 胜在引擎化与可定制。它们是**同赛道的不同选择**，不是依赖关系。本页只对比，细节见 UnoCSS 叶。
- **PostCSS**（本组独立叶）：Tailwind v4 提供一等 PostCSS 插件 `@tailwindcss/postcss`，但 Vite 项目首选 `@tailwindcss/vite`；且因内建 Lightning CSS，v4 **不再需要**你手配 `postcss-import`/`autoprefixer`。PostCSS 本身的机制见 PostCSS 叶。
- **原生 CSS**：变量、嵌套、`:has()`、`color-mix()`、容器查询等现代 CSS 是 Tailwind 的底座，其本身归 **Web 基础章**详解，本叶不重讲。

---

到此 Tailwind CSS 三件套主体完成。速查、对照表与外链见 [参考页](../reference)。
