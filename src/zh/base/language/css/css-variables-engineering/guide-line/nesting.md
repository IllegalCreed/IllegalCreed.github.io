---
layout: doc
outline: [2, 3]
---

# 原生 CSS 嵌套

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 不装 Sass，CSS 自己就能嵌套：把子规则直接写进父规则的 `{ }` 里
- `&` 指代**父选择器**，会被替换成解析后的父选择器
- `& .child` / 直接 `.child`（默认补空格）= **后代**；`&.active` / `&:hover` = **复合**（同一元素）
- 复合选择器**必须用 `&`**：`&.active` 才是「同时有 active 类」，写成 ` .active` 会变后代
- 反向嵌套：`.parent & {}` = 把父选择器接到后面（`.parent .本选择器`）
- 类型选择器与 `&` 同写时**类型在前**：`p&` 合法（= `p.foo`），`&p` 非法
- 可嵌套 at 规则：`@media` / `@container` / `@supports` / `@layer`（**不含** `@import`）
- 特异性：`&` 像 `:is()`——取父选择器列表中**最高**的那个特异性，注意逗号分组的坑
- 与 Sass 区别：原生 `&` 引用的是**已解析的父选择器**，**不能做字符串拼接**（`&__elem` 非法）
- 别嵌套太深：超过 2~3 层就难维护，特异性也会失控
- Baseline：**2023**（自 2023-12 起广泛可用），可放心用

## CSS 终于能原生嵌套了

过去想把「某组件下的子元素样式」写在一起，要么重复敲一长串选择器前缀，要么上 Sass。现在 CSS 原生支持嵌套——把子规则直接写进父规则里：

```css
.feature {
  button {
    color: blue;
  }
  .link {
    color: red;
  }
  .text {
    font-size: 1.3em;
  }
}
```

它**等价于**展开后的扁平写法：

```css
.feature button {
  color: blue;
}
.feature .link {
  color: red;
}
.feature .text {
  font-size: 1.3em;
}
```

默认情况下，嵌套规则会在父子选择器之间**自动补一个空格**，也就是生成**后代组合器**。

## `&` 嵌套选择器

`&` 代表**父选择器**，会被替换成解析后的父选择器本身。它的用法决定了「后代」还是「复合」：

### `&` 可省（后代关系）

下面两种写法等价，都生成 `.feature button`：

```css
.feature {
  & button {
    color: blue;
  } /* = .feature button */
  button {
    color: blue;
  } /* 同样 = .feature button（自动补空格） */
}
```

### `&` 必写（复合选择器）

要表达「**同一个元素**同时满足某状态 / 附加类」，**必须用 `&` 贴着写**，否则会被当成后代：

```css
.notice {
  &.warning {
    /* = .notice.warning（同一元素既有 notice 又有 warning） */
  }
  &:hover {
    /* = .notice:hover */
  }
  &:last-child {
    /* = .notice:last-child */
  }
}
```

::: warning 复合选择器最常见的坑
`.notice { .warning {} }`（中间有空格）= `.notice .warning`（**后代**：notice 内部另一个 warning 元素）；
`.notice { &.warning {} }`（`&` 贴着）= `.notice.warning`（**复合**：同一元素两个类）。
一个空格之差，含义完全不同——想表达「这个元素自己的状态/变体」时，永远别忘了 `&`。
:::

### 反向嵌套：把 `&` 放后面

`&` 不一定在开头。放到后面，可以「反转上下文」——给父选择器接一个前缀场景：

```css
.foo {
  .bar & {
    /* = .bar .foo（当 .foo 处于 .bar 内时的样式） */
  }
}

img {
  .my-component & {
    /* = .my-component img（在组件内的图片） */
  }
}
```

### 类型选择器与 `&`：顺序有讲究

`&` 和类型选择器（如 `p`、`div`）写在一起时，**类型选择器必须在前、`&` 在后、中间不留空格**：

```css
.feature {
  p& {
    font-weight: bold;
  } /* ✅ 合法 = p.feature */
  /* &p {}  ❌ 非法：& 后面不能直接跟类型选择器 */
}
```

这个「类型在前」的限制是刻意为之，目的是和 Sass 的选择器拼接行为不冲突（见下文）。

## 用组合器建立关系

子组合器 `>`、相邻兄弟 `+`、后续兄弟 `~` 都能在嵌套里直接用，前面可带可不带 `&`：

```css
.feature {
  > p {
    /* = .feature > p（直接子 p） */
    font-size: 1.3em;
  }
  + .heading {
    /* = .feature + .heading（紧邻的兄弟） */
    color: blue;
  }
}
```

## 嵌套 at 规则

条件分组类的 at 规则可以嵌进普通规则里，这让「响应式 / 特性查询 / 分层」的样式能就地写在组件内部：

```css
.card {
  padding: 8px;

  @media (min-width: 40em) {
    padding: 16px;
  }

  @container (inline-size > 900px) {
    flex-direction: row;
  }

  @supports (display: grid) {
    display: grid;
  }

  @layer components {
    border: 1px solid #ddd;
  }
}
```

支持嵌套的有 `@media`、`@container`、`@supports`、`@layer`；**`@import` 不行**（它必须待在样式表最前）。

## 特异性：`&` 像 `:is()`，小心分组陷阱

嵌套规则的特异性遵循一条容易被忽视的规则：**`&` 的特异性等于父选择器列表中特异性最高的那个**——和 `:is()` 完全一样。当父选择器是逗号分组时，这会埋雷：

```css
#main-header,
.intro {
  & a {
    color: green; /* 特异性 = (1,0,1)，因为 #main-header 把整组拉高了 */
  }
}

.intro a {
  color: blue; /* 特异性 (0,1,1)，更低 → 被压住 */
}
/* 结果：即便在 .intro 里，链接也是绿色——因为分组里有个 ID */
```

也就是说，只要分组的父选择器里**混进一个高特异性选择器（如 ID）**，整组嵌套规则的特异性都会被抬到那个高度。想避免就把分组拆开，或用 `:where()` 把特异性压平。

## 几个会被忽略的非法写法

- **伪元素无法被 `&` 代表**：当父选择器列表里含伪元素（如 `::before`），裸 `&` 只会作用到非伪元素部分；
- **非法嵌套整段被丢弃**：某条嵌套规则非法（如 `& %invalid`），它内部的声明全部被忽略，但**不影响**同级其他合法规则。

## 和 Sass / SCSS 的异同

原生嵌套**形似** Sass，但有一条根本区别：

| | 原生 CSS 嵌套 | Sass / SCSS |
| --- | --- | --- |
| `&` 是什么 | 指向**已解析的父选择器** | 一个可参与**字符串拼接**的占位符 |
| `&__elem` / `&--mod` | **非法**（`&` 后不能跟标识符字符） | **合法**，拼成 `.block__elem` |
| 处理时机 | 浏览器运行时解析 | 编译期展开成扁平 CSS |
| `@media` 嵌套 | 原生支持 | 支持（编译期） |

最关键的差异：**Sass 能用 `&__element` 这种字符串拼接来生成 BEM 类名，原生嵌套不行**——因为原生 `&` 是「父选择器的引用」而不是「一段字符串」。所以从 Sass 迁移到原生嵌套时，所有 `&__xxx` / `&--xxx` 都得改写成完整类名：

```scss
/* Sass：合法，拼成 .card__title */
.card {
  &__title {
    font-weight: bold;
  }
}
```

```css
/* 原生 CSS：必须写完整类名 */
.card__title {
  font-weight: bold;
}
/* 或者，如果 .title 是 .card 的后代而非 BEM 拼接： */
.card {
  .title {
    font-weight: bold;
  }
}
```

## 别嵌套太深

嵌套虽好，但**层数越深越难维护**，特异性也越积越高、越难覆盖。社区共识是**控制在 2~3 层以内**：超过这个深度，扁平写法往往反而更清晰。嵌套是「就近组织相关样式」的工具，不是「复刻 DOM 结构」的借口。

## Baseline 与降级

原生 CSS 嵌套是 **Baseline 2023**——自 2023 年 12 月起在主流浏览器广泛可用，日常项目可放心使用。需要兼容更老环境时，可用构建期工具（PostCSS 的 `postcss-nesting`、或继续用 Sass）把嵌套**展开成扁平 CSS**，得到完全一致的产物。

## 小结

原生嵌套让 CSS 不靠预处理器就能就近组织样式：`&` 指代父选择器，贴着写是复合（`&:hover`）、留空格是后代（`& .child`），还能反向（`.parent &`）和嵌套 at 规则。务必记住两条与 Sass 的差异——原生 `&` **不能字符串拼接**（`&__elem` 非法），以及分组父选择器里有 ID 会把整组特异性抬高。它是 Baseline 2023 的稳定特性。下一页换个主题，看 CSS 怎么用数学函数实现「无媒体查询」的流式排版——[数学函数与流式排版](./math-functions)。
