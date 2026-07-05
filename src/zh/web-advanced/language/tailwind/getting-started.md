---
layout: doc
outline: [2, 3]
---

# 入门：定位、v4 安装与工具类优先心智

> 基于 Tailwind CSS 4.3（npm 实测 `4.3.2`）· 核于 2026-07

## 速查

- **定位**：Tailwind 是**工具类优先（utility-first）的 CSS 框架**，提供单一职责原子类（`flex`、`px-4`、`text-center`），在标签 `class` 上组合样式，而非另写自定义 CSS。它不是组件库、也不是 Sass 那样的预处理器。
- **当前版本**：主线 **v4**（npm latest `4.3.2`，MIT）；v4.0 于 2025-01 发布，全新 **Oxide 引擎**（热点用 Rust + 内建 Lightning CSS）。
- **v4 三大心智变化**：① 一行 `@import "tailwindcss";` 取代 v3 三条 `@tailwind base/components/utilities`；② 配置走 **CSS-first**（`@theme` 代替 `tailwind.config.js`），**默认不再需要配置文件**；③ 设计令牌**既生成工具类、又以 CSS 变量暴露**在 `:root`。
- **安装（Vite，首选）**：`npm install tailwindcss @tailwindcss/vite` → `vite.config.ts` 里 `plugins: [tailwindcss()]` → CSS 入口写 `@import "tailwindcss";`。
- **其它安装法**：PostCSS 用 `@tailwindcss/postcss`；无构建工具用 `@tailwindcss/cli`；还有各框架专属指南与 Play CDN。
- **工具类拼装**：`class="mx-auto flex max-w-sm items-center gap-4 rounded-xl bg-white p-6 shadow-lg"` —— 每个类只做一件事，组合成完整样式。
- **变体前缀**：状态用 `hover:`/`focus:`/`active:`/`disabled:`；响应式用 `sm:`/`md:`/`lg:`（移动优先，「该断点及以上」）；深色用 `dark:`。可堆叠 `dark:md:hover:bg-fuchsia-600`（与关系）。
- **为什么不用行内 `style`**：行内样式无法写伪类状态、无法写媒体查询响应式、无法跟随深色模式，且是脱离设计系统的 magic number；工具类三者都能覆盖。
- **任意值**：主题外的确切值用方括号 `bg-[#316ff6]`、`grid-cols-[24rem_2.5rem_minmax(0,1fr)]`；引用 CSS 变量用圆括号 `bg-(--brand)`。
- **管理重复**：优先「循环渲染 + 组件/模板片段」复用，其次多光标编辑，最后才在自定义 CSS 里用 `@apply`（勿滥用）。
- **边界**：原生 CSS 基础归 Web 基础章；**UnoCSS** 是本组另一叶（同为原子化 CSS 的竞品，理念相近可替代，本页只对比不重讲）；**PostCSS** 是独立叶（Tailwind v4 有一等 PostCSS 插件 `@tailwindcss/postcss`，但 Vite 项目首选 `@tailwindcss/vite`）。
- **进阶顺序**：本页 → [工具类优先与响应式](./guide-line/utility-first-and-responsive) → [状态与变体全家桶](./guide-line/states-and-variants) → [v4 CSS-first 配置](./guide-line/css-first-config) → [深色模式与颜色系统](./guide-line/dark-mode-and-colors) → [v3→v4 迁移与生态](./guide-line/migration-and-ecosystem) → [参考](./reference)。

## 一、Tailwind 是什么：定位与选型

Tailwind CSS 是一个**工具类优先**的 CSS 框架。它和你可能熟悉的两类东西都不一样：

- **不是 Bootstrap 那样的组件框架**：Bootstrap 给你 `.btn`、`.card` 这类成品「组件类」，Tailwind 给的是 `flex`、`px-4` 这类「原子类」，成品组件要自己拼或引入上层方案。
- **不是 Sass 那样的预处理器**：Sass 是扩展了变量/嵌套/mixin 的 CSS 语言，最终仍要你写 CSS 规则；Tailwind 则是根据你用到的类**生成** CSS，你几乎不直接写规则。

把它放进整个「写样式的方式」光谱里对比，选型口径大致是：

| 方式 | 心智 | 何时选 |
| --- | --- | --- |
| 原生 CSS / BEM | 语义化类名 + 手写规则 | 小页面、强定制、团队偏好传统分层（归 Web 基础章详解） |
| CSS 预处理器（Sass/Less） | 变量/嵌套/mixin 增强的 CSS | 需要预处理能力但仍走「语义化类」路线（各自独立叶） |
| **Tailwind CSS** | **工具类优先 + 变体 + 设计令牌** | **要快、要一致的设计系统、要状态/响应式/深色开箱即用** |
| UnoCSS | 即时按需的原子化 CSS 引擎 | 同为原子化路线、要极致可定制/性能（本组独立叶，有兼容 Tailwind 类名的 preset） |

一句话选型：想要「有官方设计系统、生态成熟、开箱即用」的原子化 CSS → Tailwind；想要「引擎化、preset 高度可定制」→ UnoCSS；只是几屏静态页且团队偏好传统写法 → 原生 CSS 也够。

## 二、v4 安装：以 Vite 为例（首选）

v4 为 Vite 提供了一等公民插件 `@tailwindcss/vite`，是最顺滑的接入方式：

```bash
# 1) 安装（单独装 tailwindcss + Vite 插件）
npm install tailwindcss @tailwindcss/vite
```

```ts
// 2) vite.config.ts —— 把插件加进 plugins
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

```css
/* 3) CSS 入口（如 src/style.css）—— 一行引入，取代 v3 三条 @tailwind 指令 */
@import "tailwindcss";
```

其它安装方式按场景选：

- **PostCSS**：`npm install tailwindcss @tailwindcss/postcss`，在 `postcss.config.mjs` 里加 `@tailwindcss/postcss` 插件（Next.js 等走 PostCSS 的项目）。
- **Tailwind CLI**：`@tailwindcss/cli`，无打包器时用命令行直接产出 CSS。
- **框架指南 / Play CDN**：官网有 Next/Nuxt/Laravel 等专属指南，以及浏览器里试玩用的 Play CDN。

::: tip v4 与 v3 安装的关键差异
v3 需要 `npx tailwindcss init` 生成 `tailwind.config.js` 并写 `content` 数组；**v4 默认不需要配置文件**，也不用手配 `content`——它会自动探测模板文件（尊重 `.gitignore`、跳过二进制文件）。需要补扫描路径时用 `@source`。
:::

## 三、第一段工具类：把样式「拼」出来

工具类优先的核心，就是用一串单一职责的类拼出所需样式。下面是官方风格的卡片：

```html
<div class="mx-auto flex max-w-sm items-center gap-4 rounded-xl bg-white p-6 shadow-lg">
  <img class="size-12 shrink-0" src="/logo.svg" alt="Logo" />
  <div>
    <div class="text-xl font-medium text-black">ChitChat</div>
    <p class="text-gray-500">You have a new message!</p>
  </div>
</div>
```

逐类拆开：`mx-auto` 水平居中、`flex` 弹性布局、`max-w-sm` 限制最大宽、`items-center` 交叉轴居中、`gap-4` 子项间距、`rounded-xl` 大圆角、`bg-white` 白底、`p-6` 内边距、`shadow-lg` 阴影。**每个类只做一件事**，读类名即能还原样式；改动只改这一处、不牵连其它元素。

## 四、状态、响应式、深色：变体前缀

工具类真正超越行内 `style` 的地方，是**变体前缀**——用 `前缀:工具类` 表达条件样式：

```html
<!-- 状态：悬停/聚焦/按下 -->
<button class="bg-sky-500 hover:bg-sky-700 focus:ring-2 active:bg-sky-800">
  Save
</button>

<!-- 响应式：移动优先，md 及以上变 3 列 -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">…</div>

<!-- 深色模式：dark: 默认跟随系统偏好 -->
<div class="bg-white text-black dark:bg-gray-800 dark:text-white">…</div>
```

变体可以**堆叠**，是「与」关系、逐层限定：`dark:md:hover:bg-fuchsia-600` = 「深色 + 视口≥md + 悬停」三者同时满足才生效。行内 `style` 无法表达这里任何一种条件，这正是工具类的价值所在。

## 五、为什么不直接写行内 `style`？

这是初学者最常问的。行内 `style` 有三道天花板，工具类都能跨过：

| 能力 | 行内 `style` | Tailwind 工具类 |
| --- | --- | --- |
| 伪类状态（hover/focus/active） | ❌ 做不到 | ✅ `hover:` / `focus:` / `active:` |
| 媒体查询 / 响应式 | ❌ 做不到 | ✅ `sm:` / `md:` / `lg:` |
| 深色模式 | ❌ 做不到 | ✅ `dark:` |
| 设计系统约束 | ❌ 随手 magic number | ✅ 令牌化（`bg-blue-500`） |

::: warning 行内 style 仍有它的位置
当值来自运行时数据（用户自选主题色、后端返回的进度百分比）时，行内 `style` 或 CSS 变量（`style="--bg: …"` 配 `bg-(--bg)`）仍是合适选择——工具类是**构建期**确定的类，表达不了纯运行时的动态值。
:::

## 六、管理重复：先复用，别急着 `@apply`

「同一串类出现很多遍」怎么办？官方推荐的优先级是：

1. **循环渲染**：列表项在 `v-for`/`map` 里渲染，本就只有一份模板，不存在真正的重复。
2. **抽组件 / 模板片段**：把重复的一块 UI 封成 Vue/React 组件或 Blade/ERB 片段，样式与结构一起复用。
3. **多光标编辑**：单文件内的局部重复，编辑器多光标一次改完。
4. **自定义 CSS + `@apply`**：仅当上面都不合适（如覆盖第三方库样式），才在 CSS 里用 `@apply` 内联工具类。

::: danger 别把 `@apply` 当成主力
把每个组件都写成 `.card { @apply … }` 会把工具类「样式即类名」的优势又抽象回传统 CSS，失去可读性与可搬运性。`@apply` 是补充手段，不是默认写法。详见 [CSS-first 配置](./guide-line/css-first-config) 一页。
:::

---

打好地基后，下一步进入 [工具类优先与响应式](./guide-line/utility-first-and-responsive)：深入 utility-first 范式、任意值 `[...]`、移动优先断点体系与 v4 内建的容器查询。
