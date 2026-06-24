---
layout: doc
outline: [2, 3]
---

# 模板区域 grid-template-areas

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- 容器声明区域：`grid-template-areas` 用**带引号的字符串行**画出版面，一行一个字符串
- 项认领区域：在网格项上写 `grid-area: 名字`，名字须与模板里的标识符一致
- 同名相邻拼成区域：模板里同一个名字横向 / 纵向连续出现，自动拼成一个**矩形**跨格
- 留空单元格：用 `.`（一个或多个连续的点，**中间不能有空格**）
- 形状必须矩形：同名格子只能围成矩形，画成 L 形 / T 形 = 非法、整条 `grid-template-areas` 失效
- 配尺寸：通常配 `grid-template-columns` / `grid-template-rows` 定每列每行大小
- 一步到位：`grid-template` 简写可同时写区域 + 行高 + 列宽（行尾跟行高，`/` 后跟列宽）
- 命名区域自动生成命名线：区域 `xxx` 会隐式产生 `xxx-start` / `xxx-end` 四条线
- 改版面只改这张「字符画」，子元素 CSS 不动 —— 响应式重排版的利器

## 用「字符画」描述版面

`grid-template-areas` 是 Grid 里可读性最高的特性：你不再用线编号摆元素，而是给每块区域起个名字，然后用一串字符串把版面「画」出来——字符串的排布**就是**版面的样子。

```css
.page {
  display: grid;
  grid-template-columns: 200px 1fr; /* 左侧栏定宽，右主区弹性 */
  grid-template-rows: auto 1fr auto; /* 头、主体、脚 */
  grid-template-areas:
    "sidebar header"
    "sidebar main"
    "sidebar footer";
  min-height: 100vh;
  gap: 16px;
}
```

读这段 `grid-template-areas` 几乎不需要解释：第一列三行都是 `sidebar`（侧栏纵跨整列），第二列从上到下是 `header` / `main` / `footer`。版面一目了然。

接着，每个网格项用 `grid-area` 认领自己的名字：

```html
<div class="page">
  <header>头部</header>
  <aside>侧栏</aside>
  <main>主内容</main>
  <footer>页脚</footer>
</div>
```

```css
.page > header {
  grid-area: header;
}
.page > aside {
  grid-area: sidebar;
}
.page > main {
  grid-area: main;
}
.page > footer {
  grid-area: footer;
}
```

::: tip 名字怎么对应
`grid-template-areas` 里写的是**区域名**（自定义标识符，不加引号包裹单个名字，而是整行用引号），`grid-area: header` 里写的是同一个名字。元素放哪里只由名字决定，和它在 HTML 里的**源顺序无关**——你可以在 HTML 里先写 `<main>`、视觉上却让它排在最后。
:::

## 跨多格：同名相邻自动合并

要让一块区域跨越多个单元格，只需在模板里让同一个名字在**相邻位置**重复出现，Grid 会把它们拼成一个矩形：

```css
.dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-areas:
    "hero hero stats"
    "hero hero feed";
}
```

这里 `hero` 在左上占了 2×2 的四个格，`stats` 与 `feed` 各占右侧一格。`hero` 横向占两列、纵向占两行，自动围成一个 2×2 的矩形区域。

## 留空：用 `.`

某个单元格不放任何区域时，用一个点 `.` 占位（也可以用连续多个点，但**中间不能有空格**，否则会被当成多个独立标记）：

```css
.layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-areas:
    "header header header"
    "main   main   ."
    "footer footer footer";
}
```

第二行最后一格是 `.`——主内容只占前两列，右上角留白。

::: warning 区域必须是矩形
同名格子只能围成**矩形**。下面这种 L 形是**非法**的，会让整条 `grid-template-areas` 声明失效（被当作 `none`，版面直接散架）：

```css
/* ❌ 非法：content 围成了 L 形，不是矩形 */
grid-template-areas:
  "content content"
  "content .";
```

排查「`grid-template-areas` 完全没生效」时，第一件事就是检查每个名字是否都构成矩形。另外每行的**单元格数必须相等**（列数一致），否则同样失效。
:::

## 命名区域会自动生成命名线

定义区域 `content` 时，Grid 会**隐式生成**四条命名线：`content-start`、`content-end`（列方向）和同名的行方向起止线。这意味着你既能用区域名整块放置，又能用这些自动生成的线做精细对齐：

```css
.page {
  display: grid;
  grid-template-areas:
    "header header"
    "main   aside";
}

/* 用区域 main 自动产生的列起始线来对齐另一个元素 */
.banner {
  grid-column-start: main-start;
}
```

反过来，如果你用 `grid-template-columns` 显式定义了名为 `xxx-start` / `xxx-end` 的命名线，也能**反向形成**一个可被 `grid-area: xxx` 引用的区域——命名线与命名区域是一体两面（命名线详见 [基于线与区域放置](./line-area-placement)）。

## `grid-template` 简写：区域 + 尺寸一步到位

`grid-template` 把 `grid-template-rows`、`grid-template-columns`、`grid-template-areas` 三者合并：每行字符串后面跟该**行的高度**，所有列宽写在末尾的 `/` 之后。

```css
.page {
  display: grid;
  grid-template:
    "header header" auto
    "sidebar main" 1fr
    "footer footer" auto
    / 200px 1fr;
}
```

逐行读：`header` 行高 `auto`、中间行 `1fr`、`footer` 行 `auto`；`/` 之后 `200px 1fr` 是两列的宽度。一段声明同时表达了「版面 + 行高 + 列宽」，非常紧凑。

::: tip `grid-template` vs `grid`
还有一个更全的简写 `grid`，除了 `grid-template` 的三件，还会重置 `grid-auto-rows` / `grid-auto-columns` / `grid-auto-flow`（隐式网格相关，见 [隐式网格与自动布局](./implicit-grid)）。日常画版面用 `grid-template` 足矣；只有要一并设置自动流方向时才需要 `grid`。
:::

## 响应式重排：只改这张图

模板区域最大的实战价值，是**换布局只改 `grid-template-areas`**，子元素 CSS 一行不动。配合媒体查询，移动端「上下堆叠」、桌面端「左右分栏」可以这样写：

```css
.page {
  display: grid;
  gap: 16px;
  /* 移动端：单列，全部纵向堆叠 */
  grid-template-columns: 1fr;
  grid-template-areas:
    "header"
    "main"
    "sidebar"
    "footer";
}

@media (min-width: 768px) {
  .page {
    /* 桌面端：侧栏 + 主区两列，只改这张图 */
    grid-template-columns: 200px 1fr;
    grid-template-areas:
      "header  header"
      "sidebar main"
      "footer  footer";
  }
}
```

`header` / `main` / `sidebar` / `footer` 四个元素的 `grid-area` 声明完全不用动——重排只发生在容器这张「字符画」里。这种「布局与内容彻底解耦」的写法，是 `grid-template-areas` 相比其他布局手段最舒服的地方。

## 下一步

模板区域适合「有清晰语义命名」的整页骨架。但很多场景（瀑布画廊、让某张卡片精确跨 3 列 2 行）更适合用**坐标**直接放置——下一页进入 [基于线与区域放置](./line-area-placement)，把 `grid-column` / `grid-row` / `span` / 负数线讲透。
