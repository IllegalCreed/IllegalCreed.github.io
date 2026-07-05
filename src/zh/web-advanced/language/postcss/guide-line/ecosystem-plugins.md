---
layout: doc
outline: [2, 3]
---

# 主流插件生态：加前缀 / 降级 / 压缩 / 嵌套

> 基于 PostCSS 8.5.16 · Autoprefixer 10.5.x · cssnano 8.0.x · 核于 2026-07

## 速查

- **Autoprefixer**（当前 10.5.x）：按 **Can I Use 数据 + Browserslist 目标**自动加浏览器厂商前缀（`-webkit-`/`-moz-`/`-ms-`）；也**移除**过时前缀（`remove` 默认 `true`）；「Google 推荐，Twitter / Alibaba 在用」。
- **postcss-preset-env**：把**现代/未来 CSS 降级**成目标浏览器能懂的写法 + 按需 polyfill；**内置 autoprefixer**；`stage` 0–4（**默认 2**，越小越激进）；`features` 逐特性开关。
- **postcss-nesting**：遵循**官方 CSS 嵌套规范**（W3C，`&` 选择器）；edition `2024-02`（默认，用 `:is()`）/ `2021`。
- **postcss-nested**：遵循 **Sass 风格**的宽松嵌套（与 postcss-nesting 是两套约定，别混用）。
- **cssnano**（当前 8.0.x）：基于 PostCSS 的**模块化压缩器**；预设驱动——`default`（安全）/ `advanced`（激进、有前提）。
- **postcss-import**：构建期**内联 `@import`**，产出单文件、减少运行时请求（Vite 已内置）。
- **stylelint**：基于 PostCSS 的 CSS/SCSS **linter**（校验，不改产物形态）。
- **顺序建议**：`postcss-import` → `postcss-preset-env`/`postcss-nesting` → `autoprefixer`（若未被 preset-env 内置）→ `cssnano`（垫底）。

## 一、Autoprefixer——最流行的加前缀插件

它是 PostCSS 生态装机量最大的插件，一句话：**你只写标准无前缀 CSS，前缀交给它按目标浏览器自动补齐/清理**。

```css
/* 输入 */
.box { user-select: none; }

/* 输出（取决于 Browserslist 目标） */
.box {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
```

- **两大依据**：① Can I Use 兼容性数据（哪些属性在哪些浏览器需要前缀）；② **Browserslist** 指定的目标浏览器范围。目标越现代，加的前缀越少。
- **也会删前缀**：`remove` 选项默认 `true`——对当前目标已不需要的旧前缀会被**清理**，让输出既不缺也不冗余。
- **只加前缀，不改语义**：它不压缩、不降级新特性、不改样式组织形式。

::: tip 与 preset-env 的关系
`postcss-preset-env` **已内置 autoprefixer**。若用了 preset-env，通常**不再单独挂** autoprefixer，否则重复处理。只需要加前缀、不需要未来 CSS 降级时，才单独装 autoprefixer。
:::

## 二、postcss-preset-env——CSS 版 Babel preset-env

它让你**用未来（现代）CSS 写代码，据目标浏览器把这些语法降级成大多数浏览器能理解的等价写法，并按需引入 polyfill**。

```css
/* 输入：现代语法（自定义媒体查询 + 嵌套） */
@custom-media --md (min-width: 600px);
.card {
  & > .title { color: red; }
  @media (--md) { padding: 2rem; }
}

/* 输出：降级成广泛兼容的普通 CSS（示意） */
.card > .title { color: red; }
@media (min-width: 600px) { .card { padding: 2rem; } }
```

### `stage`：特性成熟度档位

`stage` 对应 CSS 特性在标准化流程中的成熟度：

| stage | 含义 | 激进度 |
| --- | --- | --- |
| `4` | W3C 候选推荐（最稳定） | 最保守 |
| `3` | —— | |
| `2` | **默认档** | 中 |
| `1` | —— | |
| `0` | 早期实验特性 | 最激进 |

- 数字越小、纳入的实验特性越多、风险越高。**默认 stage 2**（官方也提示「特性很少能推进到 stage 2 以上」）。
- `false` 可整体关闭 polyfill，只保留你用 `features` 显式开的。

### `features`：逐特性开关

```js
postcssPresetEnv({
  stage: 2,
  features: {
    'nesting-rules': true,               // 强制开启嵌套
    'custom-selectors': { preserve: true }, // 降级的同时保留原写法
  },
})
```

- 用 `true` / `false` 或对象配置**逐个**开关特性，覆盖 stage 的默认集合。
- 支持的特性含：CSS 嵌套、自定义媒体查询、自定义选择器、自定义属性、现代颜色函数、逻辑属性、`image-set()` 等。

## 三、CSS 嵌套：postcss-nesting vs postcss-nested

两个名字极像、却遵循**不同规范**，选错会得到不一样的展开结果：

| 维度 | **postcss-nesting** | **postcss-nested** |
| --- | --- | --- |
| 遵循 | 官方 **CSS 嵌套规范**（W3C） | **Sass** 风格的宽松语法 |
| `&` | 按标准用法，展开时可用 `:is()` 包裹 | Sass 式拼接（如 `&-active`） |
| edition | `2024-02`（默认，用 `:is()`，移除早期 `@nest`）/ `2021` | —— |
| 定位 | 面向**原生 CSS 标准**（可配合 preset-env） | 面向 **Sass 老习惯**迁移 |

```css
/* 输入 */
.foo {
  color: red;
  &:hover { color: green; }
}

/* postcss-nesting（标准）输出 */
.foo { color: red; }
.foo:hover { color: green; }
```

::: tip 怎么选
想**贴合原生 CSS 标准**（未来浏览器原生支持嵌套后可平滑去插件）→ `postcss-nesting`；只是想要 **Sass 那种拼接式**嵌套体验 → `postcss-nested`。别同时挂两个。
:::

## 四、cssnano——模块化压缩器

一句话：**基于 PostCSS 生态的模块化 CSS 压缩器（minifier）**，生产构建里常放插件链**最后一位**。

它做的优化远不止删空白：压缩颜色写法、删除注释、丢弃被覆盖的 at 规则、归一化取值、精简渐变参数、合并规则等。

### 预设驱动：default vs advanced

| 预设 | 变换 | 安全性 |
| --- | --- | --- |
| `cssnano-preset-default` | 只做**安全变换** | 任何站点都不改变视觉结果 |
| `cssnano-preset-advanced` | 更**激进**的变换 | 仅当站点满足特定前提才安全 |

- 核心权衡是「**压缩率 vs 安全性 / 副作用风险**」。生产**默认用 default 更稳**。
- 它也能读 Browserslist，做面向目标浏览器的安全优化。

## 五、postcss-import——内联 @import

让 CSS 里的 `@import` 在**构建期被内联**——把被导入文件内容直接合并进来，产出单一 CSS，避免浏览器运行时再发额外请求。

```css
/* 输入 */
@import 'base.css';
.btn { color: red; }

/* 输出：base.css 内容被合并进来，无运行时 @import */
```

- 因为它改变文件结构，通常放在插件链**最前**（先把所有片段拼齐，后续插件才能处理到完整内容）。
- **Vite 已内置** `@import` 内联（底层即 postcss-import），无需手动挂。

## 六、一条典型的生产插件链

把上面拼起来，一条常见的顺序：

```js
// postcss.config.js
export default {
  plugins: [
    require('postcss-import'),        // 1. 先内联 @import，拼齐内容
    require('postcss-preset-env')({   // 2. 降级未来 CSS（已内置 autoprefixer）
      stage: 2,
    }),
    require('cssnano')({              // 3. 最后压缩（建议仅生产环境启用）
      preset: 'default',
    }),
  ],
};
```

- **顺序即执行顺序**（自上而下）：内联 → 降级/加前缀 → 压缩。顺序错会让后面的插件处理不到应生成的内容。
- 压缩通常**只在生产**开启（用环境判断，见下一页）。

---

会挑插件后，下一步进入 [配置与构建集成](./config-and-integration)：`postcss.config.js` 的多种格式、plugins 数组/对象写法、Browserslist、Vite / webpack 集成与环境区分。
