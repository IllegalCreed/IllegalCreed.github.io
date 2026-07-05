---
layout: doc
outline: [2, 3]
---

# 参考：Tailwind CSS 速查与对照表

> 基于 Tailwind CSS 4.3（npm 实测 `4.3.2`）· 核于 2026-07

## 速查

- **定位**：工具类优先的 CSS 框架；不是组件库、不是预处理器。主线 **v4**（`4.3.2`，MIT），引擎 **Oxide**（Rust 热点 + 内建 Lightning CSS）。
- **引入**：`@import "tailwindcss";`（取代 v3 三条 `@tailwind`）。配置走 CSS-first，默认无 `tailwind.config.js`。
- **令牌**：`@theme` 声明，**既生成工具类、又暴露为 `:root` 上的 CSS 变量**（`--color-*`、`--spacing`、`--breakpoint-*` …）。
- **变体**：`hover`/`focus`/`active`/`disabled`、`group-*`/`peer-*`（含具名）、`has-*`、`not-*`、`aria-*`/`data-*`、结构性 `first/odd/nth-*`、伪元素 `before/placeholder`；可堆叠（与关系）。
- **响应式**：移动优先，`sm`640/`md`768/`lg`1024/`xl`1280/`2xl`1536；`max-*` 取「以下」；容器查询 `@container`/`@sm`（v4 内建）。
- **任意值**：`[...]` 字面值、`(...)` 变量引用（v4）、任意属性 `[prop:val]`、任意变体 `[&…]`。
- **深色**：`dark:` 默认跟随系统；手动切换用 `@custom-variant dark (&:where(.dark, .dark *));`。
- **颜色**：OKLCH，22 家族 + 黑白，11 档（50–950），透明度 `/50`（`color-mix()`）。
- **迁移**：`npx @tailwindcss/upgrade`；浏览器 Safari 16.4+/Chrome 111+/Firefox 128+。

## 一、核心工具类分类速查

| 类别 | 代表工具类 |
| --- | --- |
| 布局 | `flex` `grid` `block` `hidden` `container` `columns-*` |
| Flex/Grid | `items-center` `justify-between` `gap-4` `grid-cols-3` `col-span-2` |
| 间距 | `p-4` `px-6` `m-2` `mt-8` `space-x-2`（建议改 `gap`） |
| 尺寸 | `w-full` `h-screen` `size-12` `max-w-sm` `min-h-0` |
| 排版 | `text-xl` `font-bold` `leading-tight` `tracking-wide` `text-center` `truncate` |
| 颜色 | `bg-*` `text-*` `border-*` `ring-*` `fill-*` `from-*/via-*/to-*` |
| 边框 | `border` `border-2` `rounded-xl` `divide-y` `ring-2` |
| 效果 | `shadow-md` `opacity-50` `blur-sm` `grayscale` `mix-blend-*` |
| 变换 | `scale-95` `rotate-45` `translate-x-2` `rotate-x-*`（3D，v4） |
| 过渡/动画 | `transition` `duration-300` `ease-out` `animate-spin` `starting:`（v4） |

## 二、变体速查

| 分组 | 变体 | 说明 |
| --- | --- | --- |
| 交互 | `hover` `focus` `focus-visible` `focus-within` `active` `visited` | `hover` v4 默认受 `(hover: hover)` 约束 |
| 表单 | `disabled` `checked` `required` `valid`/`invalid` `placeholder-shown` `read-only` | 配合原生校验 |
| 结构 | `first` `last` `only` `odd` `even` `empty` `nth-3` `nth-[3n+1]` | 对应 `:nth-child()` 等 |
| 父联动 | `group` + `group-hover`/`group-has-[…]`；具名 `group/x`；`in-*` | `in-*` 免 group |
| 兄弟联动 | `peer` + `peer-checked`/`peer-invalid`；具名 `peer/x` | 仅作用于 `peer` **之后**的兄弟 |
| 关系 | `has-[:checked]` `has-[img]` `group-has-*` `peer-has-*` | 对应 CSS `:has()` |
| 取反 | `not-hover` `not-supports-[…]`（v4 新增） | 对伪类/媒体/`@supports` 取反 |
| 属性 | `aria-checked` `aria-[sort=asc]` `data-active` `data-[size=large]` | 配合 Headless UI/Radix |
| 响应式 | `sm` `md` `lg` `xl` `2xl` `max-*` `min-[600px]` | 移动优先 |
| 容器查询 | `@container` `@sm` `@lg` `@max-md` `@min-[475px]` `@sm/name` | v4 内建 |
| 深色 | `dark`（默认媒体，可改 class/data 策略） | `@custom-variant` 重定义 |
| 伪元素 | `before` `after` `placeholder` `selection` `file` `marker` `first-letter` | `before/after` 需 `content-*` |
| 子/后代 | `*`（直接子） `**`（所有后代） | 选择面大，谨慎用 |

## 三、断点速查

| 前缀 | 最小宽度 | | 前缀 | 最小宽度 |
| --- | --- | --- | --- | --- |
| `sm` | 40rem / 640px | | `xl` | 80rem / 1280px |
| `md` | 48rem / 768px | | `2xl` | 96rem / 1536px |
| `lg` | 64rem / 1024px | | 自定义 | `@theme { --breakpoint-3xl: 120rem; }` |

- `md:` = 「≥768px 及以上」；`max-md:` = 「<768px」；`md:max-lg:` = 「768–1024px 区间」。
- 一次性：`min-[600px]:` / `max-[960px]:`。

## 四、`@theme` 命名空间速查

| 命名空间 | 生成 | | 命名空间 | 生成 |
| --- | --- | --- | --- | --- |
| `--color-*` | `bg-*`/`text-*` 等 | | `--radius-*` | `rounded-*` |
| `--font-*` | `font-*`（族） | | `--shadow-*` | `shadow-*` |
| `--text-*` | `text-*`（字号） | | `--ease-*` | `ease-*` |
| `--font-weight-*` | `font-*`（重） | | `--animate-*` | `animate-*` |
| `--spacing` | 间距/尺寸基准 | | `--breakpoint-*` | `sm:`/`md:` … |
| `--tracking-*` | `tracking-*` | | `--container-*` | `@sm:`/`max-w-*` |

- 扩展 = 直接加；覆盖 = 同名；清空命名空间 = `--color-*: initial`；清空全部 = `--*: initial`。
- 令牌互相引用用 `@theme inline`。

## 五、指令速查

| 指令 | 用途 | 例 |
| --- | --- | --- |
| `@import` | 引入 Tailwind / 其它 CSS | `@import "tailwindcss";` |
| `@theme` | 声明设计令牌 | `@theme { --color-brand: …; }` |
| `@utility` | 自定义工具类（替代 v3 `@layer utilities`） | `@utility tab-4 { tab-size: 4; }` |
| `@custom-variant` | 自定义变体 | `@custom-variant dark (&:where(.dark, .dark *));` |
| `@variant` | 在 CSS 里套用某变体 | `@variant dark { … }` |
| `@apply` | 内联已有工具类（勿滥用） | `@apply rounded-lg shadow-md;` |
| `@reference` | 组件 `<style>` 里引主题、不重复输出 | `@reference "../app.css";` |
| `@source` | 补充内容扫描路径 | `@source "../node_modules/ui-lib";` |
| `@config` | 加载遗留 JS 配置 | `@config "../tailwind.config.js";` |
| `@plugin` | 加载 JS 插件 | `@plugin "@tailwindcss/typography";` |

## 六、函数速查

| 函数 | 用途 | 现状 |
| --- | --- | --- |
| `--alpha(color / 50%)` | 调颜色透明度 | v4 推荐 |
| `--spacing(4)` | 生成间距（`calc(var(--spacing) * 4)`） | v4 推荐 |
| `theme(spacing.12)` | 取主题值 | **已弃用**，改用 `var(--spacing-12)` |

## 七、v3 → v4 变化速查表

| 类别 | v3 | v4 |
| --- | --- | --- |
| 引入 | `@tailwind base/components/utilities` | `@import "tailwindcss";` |
| 配置 | `tailwind.config.js` | CSS-first `@theme`（默认无配置文件） |
| 引擎 | PostCSS 插件 + JIT | Oxide（Rust + Lightning CSS 内建） |
| 阴影/模糊/圆角 | `shadow-sm`/`shadow`、`blur`、`rounded` | 各下移一档：`shadow-xs`/`shadow-sm`、`blur-sm`、`rounded-sm` |
| 轮廓/环 | `outline-none`、`ring`(3px) | `outline-hidden`、`ring`(1px，3px 用 `ring-3`) |
| 默认色 | 边框/环 `gray-200`/`blue-500` | `currentColor` |
| important | 前置 `!flex` | 后置 `flex!` |
| 变量任意值 | `bg-[--var]` | `bg-(--var)` |
| 自定义工具类 | `@layer utilities` | `@utility` |
| 容器查询 | 需 `@tailwindcss/container-queries` 插件 | 内建 `@container`/`@sm` |
| 透明度 | `bg-opacity-50` | `bg-black/50`（`color-mix()`） |
| PostCSS 包 | `tailwindcss` | `@tailwindcss/postcss` |
| 浏览器 | 较宽 | Safari 16.4+/Chrome 111+/Firefox 128+ |

## 八、选型对比

| 维度 | Tailwind CSS | 原生 CSS / BEM | UnoCSS | Bootstrap |
| --- | --- | --- | --- | --- |
| 路线 | 工具类优先 + 设计令牌 | 语义化类 + 手写规则 | 即时按需的原子化引擎 | 成品组件类 |
| 生成方式 | 按用到的类生成 CSS | 全部手写 | 按用到的类即时生成 | 预置 CSS + JS 组件 |
| 定制 | `@theme` 令牌 + 任意值 | 完全自由但需自建体系 | preset 高度可定制 | 变量覆盖，粒度较粗 |
| 成品组件 | 无（靠 shadcn/Headless 等） | 无 | 无 | 有（含 JS 交互） |
| 何时选 | 要一致设计系统 + 状态/响应式/深色开箱即用 | 小页面/强定制/传统分层 | 要极致可定制/性能，或从 Tailwind 迁移 | 想快速拿到成品组件、可接受统一观感 |

**选型速记**：要「原子化 + 官方设计系统 + 生态成熟」→ Tailwind；要「原子化 + 引擎化 + 高度可定制」→ UnoCSS；只是几屏静态页且团队偏传统 → 原生 CSS；想直接用成品组件、不在意「Bootstrap 味」→ Bootstrap。

## 九、常见坑对照

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| `sm:` 样式在手机上不生效 | 误把 `sm:` 当「仅手机」，其实是「≥640px」 | 无前缀当默认，大屏再用前缀覆盖 |
| 升级后边框颜色变了 | v4 默认边框色改 `currentColor` | 显式写 `border-gray-200` |
| `peer-*` 不生效 | 目标元素排在 `peer` 前面 | 把目标放到 `peer` 之后 |
| 组件 `<style>` 里 `@apply` 报错 | scoped style 看不到主题 | 顶部加 `@reference "…"` |
| `bg-[--var]` 不生效 | v4 变量引用改圆括号 | 改 `bg-(--var)` |
| 触屏上悬停态卡住 | v4 `hover` 受 `(hover: hover)` 约束（预期行为） | 用 `active:`/`focus:` 或自定义变体 |
| 图标类未生成 | 源文件在自动探测范围外 | 加 `@source "…"` |
| `theme()` 提示遗留 | v4 弃用 `theme()` | 改用 `var(--…)` |

## 十、权威链接

- [Tailwind CSS 官网](https://tailwindcss.com) —— 首页与生态入口
- [文档首页](https://tailwindcss.com/docs) —— 全量指南导航
- [安装 · Vite](https://tailwindcss.com/docs/installation/using-vite) ｜ [PostCSS](https://tailwindcss.com/docs/installation/using-postcss)
- [Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes) —— utility-first 核心
- [Hover, focus & other states](https://tailwindcss.com/docs/hover-focus-and-other-states) ｜ [Responsive design](https://tailwindcss.com/docs/responsive-design)
- [Dark mode](https://tailwindcss.com/docs/dark-mode) ｜ [Theme](https://tailwindcss.com/docs/theme) ｜ [Colors](https://tailwindcss.com/docs/colors)
- [Functions & directives](https://tailwindcss.com/docs/functions-and-directives) —— `@theme`/`@utility`/`@apply` 等
- [v4.0 发布说明](https://tailwindcss.com/blog/tailwindcss-v4) ｜ [Oxide 引擎（v4 alpha）](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
- [v3→v4 升级指南](https://tailwindcss.com/docs/upgrade-guide) —— 权威破坏性变更清单
- [GitHub · tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) ｜ [npm · tailwindcss](https://registry.npmjs.org/tailwindcss/latest)（实测 `4.3.2`）
- [Tailwind Play](https://play.tailwindcss.com/) —— 在线试玩 ｜ [shadcn/ui](https://ui.shadcn.com/) —— 基于 Tailwind 的组件方案
