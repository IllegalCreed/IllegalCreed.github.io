---
layout: doc
outline: [2, 3]
---

# v4 CSS-first 配置：@theme 与指令全家桶

> 基于 Tailwind CSS 4.3 · 核于 2026-07

## 速查

- **CSS-first**：v4 配置从 `tailwind.config.js` 搬进 CSS，用指令完成；**默认无配置文件**。
- **`@import "tailwindcss";`**：一行引入，取代 v3 三条 `@tailwind base/components/utilities`。
- **`@theme`**：声明设计令牌（`--color-*`、`--font-*`、`--spacing`、`--breakpoint-*`、`--radius-*`、`--shadow-*`、`--ease-*`、`--animate-*`、`--container-*` …）；令牌**双重身份**——既生成工具类、又以 CSS 变量输出到 `:root`。
- **扩展/覆盖**：直接写新变量 = 扩展；同名变量 = 覆盖；`--color-*: initial` 清空某命名空间；`--*: initial` 清空全部做完全自定义。
- **`@theme inline`**：令牌引用别的变量时，用其「值」内联，避免 CSS 变量解析问题。
- **`@utility`**：定义自定义工具类 `@utility tab-4 { tab-size: 4; }`，自动支持全部变体（取代 v3 `@layer utilities`）。
- **`@custom-variant`**：定义自定义变体 `@custom-variant pointer-coarse (@media (pointer: coarse));`；dark 的 class/data 策略也靠它。
- **`@variant`**：在自定义 CSS 里套用某变体 `@variant dark { … }`。
- **`@apply`**：把已有工具类内联进自定义规则；**补充手段，勿滥用**。
- **`@reference`**：在 Vue/Svelte `<style>` 里引主题令牌，让 `@apply`/`@variant` 生效**且不重复输出 CSS**。
- **`@source`**：补充自动内容探测覆盖不到的扫描路径。
- **`@config` / `@plugin`**：加载遗留 JS 配置 / JS 插件（兼容用）。
- **函数**：`--alpha(color / 50%)` 调透明度、`--spacing(4)` 生成间距；`theme()` **已弃用**，改用 CSS 变量 `var(--spacing-12)`。

## 一、CSS-first：配置搬进 CSS

v3 的心智是「JS 配置文件 + 三条 `@tailwind` 指令」；v4 把这套统一进 CSS：

```css
/* v3 */
/* tailwind.config.js 里配 theme、content、plugins */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```css
/* v4：一行引入 + CSS 里配置，默认无 config 文件 */
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.72 0.11 178);
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;
}
```

好处：配置和样式在同一处、令牌天然是 CSS 变量、少一个 JS 文件与一层构建耦合。

## 二、`@theme`：设计令牌的中枢

`@theme` 里声明的变量按**命名空间**决定生成什么工具类：

| 命名空间 | 生成 | 例 |
| --- | --- | --- |
| `--color-*` | 颜色工具类 | `bg-brand-500`、`text-brand-500` |
| `--font-*` | 字体族 | `font-display` |
| `--text-*` | 字号 | `text-xl` |
| `--font-weight-*` | 字重 | `font-semibold` |
| `--spacing` | 间距/尺寸基准 | `px-4`、`gap-8`、`w-17` |
| `--breakpoint-*` | 响应式断点 | `sm:`、`3xl:` |
| `--container-*` | 容器查询/容器宽度 | `@sm:`、`max-w-md` |
| `--radius-*` | 圆角 | `rounded-xl` |
| `--shadow-*` | 阴影 | `shadow-md` |
| `--ease-*` / `--animate-*` | 缓动 / 动画 | `ease-fluid`、`animate-spin` |

### 令牌的双重身份

一条声明，两种产物：

```css
@theme {
  --color-mint-500: oklch(0.72 0.11 178);
}
```

```html
<!-- ① 生成了工具类 -->
<div class="bg-mint-500"></div>
<!-- ② 同时 --color-mint-500 作为真实 CSS 变量输出到 :root，可直接引用 -->
<div class="[color:var(--color-mint-500)]"></div>
```

这就是 v4「设计令牌即 CSS 变量」的核心——令牌可被浏览器直接理解、被 DevTools 调试、参与 `calc()`：

```html
<!-- 同心圆角：内层比外层精确小 1px，且随主题联动 -->
<div class="rounded-[calc(var(--radius-xl)-1px)]">…</div>
```

### 扩展、覆盖与清空

```css
@theme {
  --font-poppins: Poppins, sans-serif; /* 扩展：新增 font-poppins */
  --breakpoint-sm: 30rem;              /* 覆盖：改默认 sm 断点 */

  --color-*: initial;                  /* 清空整套默认调色板 */
  --color-white: #fff;                 /* 之后只保留自定义颜色 */
  --color-brand: oklch(0.62 0.19 260);
}
```

要做完全自定义主题（连间距、字体一起清）用 `--*: initial;` 再逐一声明。

### `@theme inline`

当令牌值引用了别的变量，默认会保留嵌套 `var()` 引用，可能因解析顺序/作用域出问题。`inline` 让它用「值」内联：

```css
@theme inline {
  --font-sans: var(--font-inter); /* 用 --font-inter 的值内联，而非保留嵌套引用 */
}
```

## 三、`@utility`：自定义工具类

v4 定义自定义工具类用 `@utility`（取代 v3 往 `@layer utilities` 手写类）——它与引擎集成，自动支持所有变体：

```css
@utility tab-4 {
  tab-size: 4;
}
```

```html
<pre class="tab-4 hover:tab-4 lg:tab-4">…</pre> <!-- 变体开箱可用 -->
```

## 四、`@custom-variant` / `@variant`：自定义变体

`@custom-variant` 造新前缀：

```css
/* 按媒体特性 */
@custom-variant pointer-coarse (@media (pointer: coarse));
/* 按属性选择器 */
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
```

```html
<div class="p-2 pointer-coarse:p-4 theme-midnight:bg-black">…</div>
```

深色模式的 class/data 策略正是它的应用（详见 [深色模式与颜色系统](./dark-mode-and-colors)）。`@variant` 则是在自定义 CSS 里**套用**一个变体：

```css
.card {
  background: white;
  @variant dark {
    background: black;
  }
}
```

## 五、`@apply` 的适用与滥用

`@apply` 把已有工具类内联进自定义规则，常用于**覆盖不受控的第三方库样式**、或收敛极少量重复：

```css
/* 覆盖第三方下拉组件的样式，同时复用你的设计令牌 */
.select2-dropdown {
  @apply rounded-b-lg shadow-md;
}
```

::: danger 别把 `@apply` 当默认写法
把每个组件都写成 `.btn { @apply … }`，等于把工具类「样式即类名、可读可搬运」的优势重新抽象回传统 CSS——要复用一块 UI，优先抽**组件/模板片段**（结构+样式一起封装），而不是抽一个 `@apply` 类。官方明确把它定位为补充手段。
:::

## 六、`@reference`：组件 `<style>` 里用主题

Vue/Svelte 的 `<style>`、CSS Modules 都是**独立编译单元**，默认看不到主项目的主题令牌与工具类。直接在里面写 `@apply` 会失败或需要重复引入全量 CSS。`@reference` 解决这点——只引用、不重复输出：

```vue
<style>
@reference "../app.css"; /* 或 @reference "tailwindcss"; */
h1 {
  @apply text-2xl font-bold text-red-500;
}
</style>
```

## 七、`@source` / `@config` / `@plugin`

- **`@source`**：v4 自动探测模板（尊重 `.gitignore`、跳过二进制），但范围外的目录（如某个 `node_modules` 里的 UI 库）需显式补：

  ```css
  @import "tailwindcss";
  @source "../node_modules/@my-company/ui-lib";
  ```

- **`@config`**：需要复用历史 JS 配置时显式加载 `@config "../tailwind.config.js";`（兼容路径）。
- **`@plugin`**：加载 JS 插件 `@plugin "@tailwindcss/typography";`。

## 八、函数：`--alpha()` / `--spacing()` 与弃用的 `theme()`

```css
.badge {
  color: --alpha(var(--color-lime-300) / 50%); /* 调透明度 */
  margin: --spacing(4);                         /* = calc(var(--spacing) * 4) */
}
```

::: warning `theme()` 已弃用
v4 里 `theme(spacing.12)`、`theme(colors.blue.500)` 属遗留写法，应改用直接的 CSS 变量：`var(--spacing-12)`、`var(--color-blue-500)`。因为所有令牌都已是 CSS 变量，用 `var()` 更标准、可被浏览器与 DevTools 理解。
:::

---

配置体系打通后，下一步进入 [深色模式与颜色系统](./dark-mode-and-colors)：`dark:` 的三种策略、OKLCH 调色板、透明度修饰符与主题定制。
