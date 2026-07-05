---
layout: doc
outline: [2, 3]
---

# 工具类优先、任意值与响应式

> 基于 Tailwind CSS 4.3 · 核于 2026-07

## 速查

- **utility-first 收益**：速度（不起名不切文件）、安全（改一个类只影响一个元素）、可维护（找到元素改类即可）、可搬运（结构+样式同处，整块复制）、CSS 不膨胀（类高度复用）。
- **任意值 `[...]`**：主题外确切值，`bg-[#316ff6]`、`grid-cols-[24rem_2.5rem_minmax(0,1fr)]`、`max-h-[calc(100dvh-2rem)]`；空格用下划线 `_` 代替。
- **任意属性**：`[mask-type:luminance]` 直接写「属性:值」，生成没有对应工具类的 CSS。
- **任意变体**：`[&>[data-active]+span]:text-blue-600`，用 `&` 指代当前元素，写任意选择器。
- **引用 CSS 变量**：v4 用圆括号 `bg-(--brand)`（= `bg-[var(--brand)]` 简写）；v3 的 `bg-[--brand]` 已改。
- **类可组合**：`blur-sm grayscale` 能叠加，因 `filter` 由 `--tw-blur`、`--tw-grayscale` 等变量拼成，各类只填自己那格，互不覆盖（transform/gradient/shadow 同理）。
- **移动优先**：无前缀 = 所有尺寸；带前缀 = **该断点及以上**。别把 `sm:` 当「仅手机」。
- **默认断点**：`sm` 640px / `md` 768px / `lg` 1024px / `xl` 1280px / `2xl` 1536px（即 40/48/64/80/96rem）。
- **区间/以下**：`max-*` 是「以下」（`max-md` = `<768px`）；`md:max-lg:` 锁定「仅 md 到 lg 之间」。
- **一次性断点**：`min-[600px]:`、`max-[960px]:`。
- **自定义断点**：`@theme { --breakpoint-3xl: 120rem; }` 加 `3xl:`；`--breakpoint-*: initial` 清空重定义。
- **容器查询（v4 内建）**：父 `@container`，子 `@sm:`/`@lg:`/`@max-md:`（按容器宽度而非视口）；具名 `@container/main` + `@sm/main:`；一次性 `@min-[475px]:`；单位 `cqw`。

## 一、utility-first 到底赢在哪

工具类优先的表面代价是「HTML 变长」，但换来五点实打实的收益：

- **速度**：不用为元素苦想语义化类名，也不用在 `.html` 和 `.css` 间来回切换，边写结构边定样式。
- **安全**：加一个类、删一个类，只影响当前这个元素，不会像改一段全局 CSS 那样「牵一发动全身」，也不用担心某个类名在别处还被复用。
- **可维护**：样式的「真相」就在标签上，改样式 = 找到元素改类，不需要在庞大样式表里查规则来源。
- **可搬运**：结构和样式绑在一起，复制一段 JSX/HTML 到另一个项目就能直接用，不用连带搬一堆 CSS。
- **CSS 不膨胀**：工具类高度复用，项目越大，新增的类越少能覆盖需求，生成的 CSS 体积趋于稳定，而非随组件数量线性增长。

## 二、任意值 `[...]`：主题的「逃生舱」

设计系统覆盖不到的确切值，用方括号语法临时插入，无需改配置：

```html
<!-- 任意颜色 / 任意栅格 / 任意计算 -->
<button class="bg-[#316ff6]">Sign in</button>
<div class="grid grid-cols-[24rem_2.5rem_minmax(0,1fr)]">…</div>
<div class="max-h-[calc(100dvh-2rem)]">…</div>
```

::: tip 值里的空格用下划线
任意值不能直接含空格，需用 `_` 代替，如 `grid-cols-[24rem_2.5rem_minmax(0,1fr)]`。若字面量本就需要下划线，转义为 `\_`。
:::

### 任意属性与任意变体

不止是「值」，连「属性」和「选择器」都能任意：

```html
<!-- 任意属性：写没有对应工具类的 CSS 属性 -->
<div class="[mask-type:luminance] hover:[mask-type:alpha]">…</div>

<!-- 任意变体：& 代表当前元素，写任意选择器 -->
<div class="[&>[data-active]+span]:text-blue-600">
  <span data-active></span>
  <span>这段文字会变蓝</span>
</div>
```

### v4 里引用 CSS 变量：圆括号

引用一个 CSS 变量作为值时，v4 用**圆括号简写**，而非 v3 的方括号：

```html
<!-- v4 ✅ -->
<div class="bg-(--brand) text-(--fg)">…</div>
<!-- 等价于 -->
<div class="bg-[var(--brand)] text-[var(--fg)]">…</div>
```

方括号 `[...]` 保留给字面任意值（`bg-[#316ff6]`），圆括号 `(...)` 专门用于变量引用。

## 三、类为什么能「组合」而不「互相覆盖」

写 `blur-sm grayscale` 时，两个滤镜会**同时**生效，而不是后者盖掉前者。原理是 Tailwind 的**可组合变量设计**：

```css
/* 简化后的生成结果 */
.blur-sm    { --tw-blur: blur(4px);        filter: var(--tw-blur,) var(--tw-grayscale,); }
.grayscale  { --tw-grayscale: grayscale(1); filter: var(--tw-blur,) var(--tw-grayscale,); }
```

每个类只往自己那格变量（`--tw-blur` / `--tw-grayscale`）写值，而 `filter` 属性被写成所有变量的组合。于是两个类一起用时，`filter` 就把它们拼在一起。`transform`（`translate-*`/`rotate-*`/`scale-*`）、渐变、阴影都用同一套机制——这也是为什么你能自由堆叠这些类。

## 四、响应式：移动优先与断点前缀

Tailwind 是**移动优先**的：**无前缀的工具类对所有尺寸生效，带断点前缀的只在「该断点及以上」生效**。默认断点：

| 前缀 | 最小宽度 | 媒体查询 |
| --- | --- | --- |
| `sm` | 40rem（640px） | `@media (width >= 40rem)` |
| `md` | 48rem（768px） | `@media (width >= 48rem)` |
| `lg` | 64rem（1024px） | `@media (width >= 64rem)` |
| `xl` | 80rem（1280px） | `@media (width >= 80rem)` |
| `2xl` | 96rem（1536px） | `@media (width >= 96rem)` |

```html
<!-- 手机 1 列，≥sm 两列，≥lg 四列 -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">…</div>
```

::: warning `sm:` 不是「仅手机」——头号翻车点
`sm:text-center` 表示「≥640px 才居中」，**不是**「只在小屏居中」。想让默认（含手机）就居中、大屏再改，应把无前缀类当默认：`text-center sm:text-left`。把 `sm:` 理解成「针对手机」会全盘写反。
:::

### 区间与「以下」：`max-*`

`max-*` 是反方向的「以下」变体：

```html
<div class="max-sm:flex">…</div>   <!-- 仅 <640px -->
<div class="md:max-lg:flex">…</div> <!-- 仅 md 到 lg 之间（≥768 且 <1024） -->
```

一次性断点用方括号，免改配置：

```html
<div class="min-[600px]:text-center max-[960px]:flex-col">…</div>
```

### 自定义断点

在 `@theme` 里增删断点（详见 [CSS-first 配置](./css-first-config)）：

```css
@import "tailwindcss";
@theme {
  --breakpoint-xs: 30rem;   /* 新增更小断点 xs: */
  --breakpoint-3xl: 120rem; /* 新增更大断点 3xl: */
}
```

## 五、容器查询：按「容器宽度」而非视口

v4 把容器查询**内建进核心**（不再需要 v3 的 `@tailwindcss/container-queries` 插件）。它让子元素根据**父容器**的宽度响应，特别适合「同一个卡片组件放进不同宽度的槽位」这种场景：

```html
<div class="@container">
  <!-- 容器窄时纵向排，容器≥md(28rem)时横向排 -->
  <div class="flex flex-col @md:flex-row">…</div>
</div>
```

要点：

- **方向**：`@sm:`/`@lg:` 是「容器≥该尺寸」，`@max-md:` 是「容器<该尺寸」。
- **具名容器**：多层嵌套时 `@container/main` 命名，子级 `@sm/main:` 精确指向。
- **一次性**：`@min-[475px]:`、`@max-[960px]:`。
- **长度单位**：容器查询上下文里可用 `w-[50cqw]`（容器宽度的 50%）。

::: tip 视口断点 vs 容器查询
`md:` 看的是**浏览器视口**宽度；`@md:` 看的是**最近的 `@container` 父级**宽度。做「可复用、放哪都自适应」的组件时优先容器查询，做「整页布局」时用视口断点。
:::

---

响应式打通后，下一步进入 [状态与变体全家桶](./states-and-variants)：`hover`/`focus`/`group`/`peer`/`has`/`not`/`aria`/`data` 等变体的完整体系与堆叠技巧。
