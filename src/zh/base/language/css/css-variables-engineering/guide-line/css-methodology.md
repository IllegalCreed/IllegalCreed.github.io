---
layout: doc
outline: [2, 3]
---

# 组织方法论：BEM·层·@scope

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 三层武器：**命名约定**（BEM，靠纪律）→ **`@layer`**（排座次，靠语言）→ **`@scope`**（圈作用域，靠语言）
- BEM：`block__element--modifier`，如 `.card` / `.card__title` / `.card--featured`——扁平、低特异性、无嵌套打架
- BEM 的价值：选择器几乎全是**单个类**（特异性 `0-1-0`），可预测、好覆盖、自带组件命名空间
- `@layer reset, base, components, utilities;`：**先声明的层优先级最低**，层序压过特异性
- `@layer` 经典用法：把第三方框架塞进**低层**，自己样式不分层或放高层，零 `!important` 覆盖（Baseline 2022）
- `@scope (.card) { … }`：把规则**圈在 `.card` 子树**内，防止样式外泄
- `@scope (.root) to (.limit) { … }`：甜甜圈作用域——管 `.root` 内、但**排除** `.limit` 及其内部
- `:scope` 指代作用域根；`@scope` 里裸选择器/`&` 默认带 `:where(:scope)`，**零特异性**
- 作用域邻近（scope proximity）：两个作用域冲突时，**DOM 上更近的根**赢
- Baseline：BEM 是纯约定（永远可用）；`@layer` **2022** 广泛可用；`@scope` **2025** 较新，需渐进增强

## 三层武器，从「约定」到「语言」

样式一多，核心难题就变成两个：**类名别打架**、**样式别外泄**。解决它们有三件层层递进的工具：

1. **BEM**——一套**命名约定**，靠团队**纪律**维持，不依赖任何新特性；
2. **`@layer` 级联层**——用**语言机制**让样式按层排座次，把「谁覆盖谁」从特异性暗箱搬到明面；
3. **`@scope` 作用域**——用**语言机制**把样式圈进 DOM 子树，从根上杜绝外泄。

下面逐个讲。

## 一、BEM：靠命名纪律

BEM = **Block（块）· Element（元素）· Modifier（修饰符）**，是流传最广的 CSS 命名约定。它把类名写成固定结构：

```
.block            /* 独立组件，如 .card */
.block__element   /* 组件的组成部分，如 .card__title */
.block--modifier  /* 组件的变体/状态，如 .card--featured */
```

实例：

```html
<article class="card card--featured">
  <h2 class="card__title">标题</h2>
  <p class="card__body">正文</p>
  <button class="card__action card__action--primary">操作</button>
</article>
```

```css
.card {
  border: 1px solid #ddd;
}
.card--featured {
  border-color: gold;
}
.card__title {
  font-size: 1.25rem;
}
.card__action--primary {
  background: var(--accent);
}
```

BEM 的好处全在「**选择器几乎都是单个类**」上：

- **特异性恒为 `0-1-0`**，永远好覆盖，不会陷入 [选择器与层叠](../../css-selectors-cascade/index) 里讲的特异性内卷；
- **自带命名空间**：`card__title` 不会撞上别处的 `title`，组件天然隔离；
- **结构自解释**：看类名就知道它属于哪个组件、是部件还是变体。

代价是类名长、要靠人**自觉遵守**——它是「约定」，编译器 / 浏览器不会强制。配上原生嵌套可以少写前缀，但要注意**别用原生 `&` 拼 BEM 名**（`&__title` 在原生 CSS 里非法，详见 [原生 CSS 嵌套](./nesting)）。

## 二、`@layer`：靠层序排座次

BEM 管不了「第三方框架的高特异性选择器压着你」。`@layer` 用语言机制给样式**显式排座次**，让**层序直接决定优先级、与特异性脱钩**：

```css
/* 一行定序：先声明的层优先级最低，后声明的最高 */
@layer reset, base, components, utilities;

@layer reset {
  * {
    margin: 0;
    box-sizing: border-box;
  }
}
@layer components {
  .card {
    padding: 1rem;
  }
}
@layer utilities {
  .hidden {
    display: none;
  } /* utilities 在最后 → 最强 */
}
```

它最经典的用法是**驯服第三方 CSS**：把框架 `@import` 进一个低层，你自己的样式不分层（未分层样式在普通声明里**赢过一切分层样式**），于是总能用简单的 `.btn` 覆盖框架里 `0-3-1` 的选择器，全程零 `!important`：

```css
@layer framework, app;
@import url("bootstrap.css") layer(framework);

/* app 层或干脆不分层，轻松压过 framework */
.btn {
  background: var(--accent);
}
```

`@layer` 是 **Baseline 2022**（广泛可用）。它的完整规则（`!important` 反转层序、嵌套层、`revert-layer` 等）已在选择器章节的 [`@layer` 级联层实战](../../css-selectors-cascade/guide-line/cascade-layers) 详述，这里只取「组织大型样式」的视角。

## 三、`@scope`：靠作用域圈范围

BEM 靠命名约定防外泄，`@scope` 则用语言机制**把样式真正圈进一棵 DOM 子树**——这是过去只有 Shadow DOM 或 CSS Modules 才能做到的隔离。

### 基本作用域

```css
/* 这些规则只在 .card 子树内生效，不会泄漏到外面 */
@scope (.card) {
  img {
    border-radius: 8px;
  }
  :scope {
    /* :scope 指代作用域根 .card 本身 */
    background: var(--bg);
  }
}
```

`.card` 是**作用域根**（scope root），里面的 `img` 只会命中 `.card` 内的图片。`:scope` 伪类指代根元素自身。

### 甜甜圈作用域（root … to … limit）

`@scope (根) to (界限)` 能划出一个「**甜甜圈**」——管根以内、但**排除界限元素及其内部**。这对「样式管文章正文，但别动里面嵌套的组件」特别有用：

```css
/* 管 .article-body 内的图片，但跳过 <figure> 里的 */
@scope (.article-body) to (figure) {
  img {
    border: 5px solid black;
    background-color: goldenrod;
  }
}
```

`.article-body` 是上界（含），`figure` 是下界（不含）——两者之间的「甜甜圈」区域才受样式影响，`figure` 内的图片被排除在外。

### 内联 `@scope`：连前奏都省了

把 `@scope`（不写前奏）直接放进某元素内部的 `<style>`，作用域自动锁定为那个父元素的子树：

```html
<section class="article-body">
  <style>
    @scope {
      img {
        border: 5px solid black;
      }
    }
  </style>
  <!-- 这里的 img 才受影响 -->
</section>
```

### 特异性与作用域邻近

`@scope` 在特异性上有两个要点：

1. **裸选择器零特异性**：`@scope` 块里直接写的 `img`（或 `& img`）相当于前面隐式加了 `:where(:scope)`，特异性是 `0-0-1`（不被作用域抬高）；但**显式写 `:scope img`** 会带上类级特异性，变成 `0-1-1`。
2. **作用域邻近（scope proximity）**：当两个作用域都命中同一元素且冲突时，**DOM 树上离作用域根更近的那个赢**——这是层叠里一条新增的裁决维度（介于书写顺序之上、特异性之下）：

```css
@scope (.light-theme) {
  p {
    color: black;
  }
}
@scope (.dark-theme) {
  p {
    color: white;
  }
}
```

```html
<div class="light-theme">
  <div class="dark-theme">
    <div class="light-theme">
      <p>这里的 p 是黑色</p>
      <!-- 离最近的 .light-theme 只隔 1 层，离 .dark-theme 隔 2 层 → light 赢 -->
    </div>
  </div>
</div>
```

::: warning @scope 较新，按渐进增强用
`@scope` 是 **Baseline 2025**（newly available，自 2025-12 起较新浏览器支持），**比本叶其他特性都新**。生产中用它要考虑降级：不支持的浏览器会**忽略整个 `@scope` 块**，里面的样式全部不生效——所以别把**关键布局**只放进 `@scope`，把它当作「锦上添花的隔离」，或对老环境保留 BEM 命名空间作为兜底。
:::

## 三者怎么配合

它们不是三选一，而是**互补**：

| 工具 | 解决什么 | 依赖 | Baseline |
| --- | --- | --- | --- |
| BEM | 类名不打架、低特异性、组件命名空间 | 团队纪律 | 永远可用（纯约定） |
| `@layer` | 谁覆盖谁、驯服第三方框架 | 语言机制 | 2022 广泛可用 |
| `@scope` | 样式不外泄、组件级隔离 | 语言机制 | 2025 较新 |

一套现代组织范式可以是：**用 BEM 命名保证低特异性和可读性 → 用 `@layer` 给 reset / 框架 / 组件 / 工具类排座次 → 对需要强隔离的组件再叠加 `@scope`**。从「靠人」到「靠语言」层层加固。

## 小结

组织大型样式有三层武器：BEM 用**命名纪律**做到低特异性、好覆盖、自带命名空间；`@layer` 用**层序**把「谁覆盖谁」从特异性暗箱搬到明面、轻松驯服第三方框架（Baseline 2022）；`@scope` 用**作用域**把样式真正圈进 DOM 子树、防止外泄，并引入「作用域邻近」这一新裁决维度（Baseline 2025，较新需降级）。三者互补，从靠人到靠语言层层加固。下一页面对现实——样式写错了怎么查——[CSS 调试与 DevTools 工作流](./css-debugging)。
