---
layout: doc
outline: [2, 3]
---

# 分区元素与页面骨架

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 七个骨架元素：`<header>`·`<nav>`·`<main>`·`<article>`·`<section>`·`<aside>`·`<footer>`
- 四类**分区内容**（sectioning content）：`<article>`·`<section>`·`<nav>`·`<aside>`——它们会开启新的「区段」
- `<header>` / `<footer>` **不是**分区内容，只是分组；`<main>` 也不是分区内容
- 地标对照：顶层 `<header>`→`banner`、`<main>`→`main`、`<nav>`→`navigation`、顶层 `<footer>`→`contentinfo`、`<aside>`→`complementary`
- `<header>`/`<footer>` 只有在**顶层**（直接挂 `<body>`）才是地标；嵌进 `article`/`aside`/`main`/`nav`/`section` 后退化为 `generic`
- `<main>` 每页**只能有一个**可见实例，且不能嵌在 `article`/`aside`/`footer`/`header`/`nav` 里
- `<nav>` 只给**主要**导航块；`<section>` 只有带了无障碍名（`aria-label` 等）才升级为 `region` 地标
- 多个同类地标（两个 `<nav>`、两个 `<aside>`）务必用 `aria-label` / `aria-labelledby` 区分

## 七个元素，一张骨架图

一个语义化页面的骨架，几乎都能用这七个元素拼出来：

```
┌─ <header>（banner 地标）────────────────┐
│   logo · <nav>（导航）· <search>（搜索） │
└─────────────────────────────────────────┘
┌─ <main>（main 地标，每页唯一）──────────┐
│  ┌─ <article>（自包含单元）──────────┐  │
│  │   <header> · <section>… · <footer> │  │
│  └────────────────────────────────────┘  │
│  ┌─ <aside>（complementary 地标）─────┐  │
│  │   相关链接 · 作者简介              │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
┌─ <footer>（contentinfo 地标）───────────┐
│   版权 · <address> 联系方式 · 链接       │
└─────────────────────────────────────────┘
```

下面逐个讲清它们的含义、地标身份和最容易踩的坑。

## `<header>`：页眉（地标看位置）

`<header>` 表示「引导性内容」——通常是 logo、站名、主导航、搜索框、口号。它最容易踩的坑是：**它是不是地标，取决于它在哪**。

- **顶层**（不嵌在分区内容、`<main>` 里）：等同站点级的 `banner` 地标；
- **嵌套**（在 `<article>` / `<aside>` / `<main>` / `<nav>` / `<section>` 内）：退化为 `generic`，只是「这一段的页眉」。

```html
<!-- 顶层 header = banner 地标 -->
<header>
  <a class="logo" href="/">站点名</a>
  <nav aria-label="主导航">…</nav>
</header>

<article>
  <!-- 嵌套 header：只是这篇文章的页眉，不是地标 -->
  <header>
    <h2>文章标题</h2>
    <p>发布于 <time datetime="2026-06-24">2026-06-24</time></p>
  </header>
  …
</article>
```

一个页面可以有**多个** `<header>`：一个顶层的，加上每个 `<article>` / `<section>` 各自的。注意 `<header>` 内**不能**再放 `<header>` 或 `<footer>`。

## `<nav>`：主要导航（别滥用）

`<nav>` 表示「指向其他页面或本页锚点的导航区」，隐式角色 `navigation`。**最常见的误用是把每一组链接都套上 `<nav>`**。MDN 说得很清楚：

> 「不必把所有链接都放进 `<nav>`，它**只给主要的导航块**。」

典型该用 `<nav>` 的：主菜单、面包屑、文章目录。典型**不必**用的：页脚里那串杂七杂八的链接——`<footer>` 里的链接列表通常不需要再包 `<nav>`。

一页有多个 `<nav>` 时（主导航 + 页内目录），用 `aria-label` 区分，否则读屏只会念出一串重复的「navigation」：

```html
<nav aria-label="主导航">…</nav>
<nav aria-label="本页目录">…</nav>
```

`<nav>` 里的链接也不一定非得是 `<ul>`，散文式的导航同样合法：

```html
<nav>
  <h2>导航</h2>
  <p>你正在首页。往北是 <a href="/blog">我的博客</a>，往东是 <a href="/about">关于</a>。</p>
</nav>
```

## `<main>`：正文（每页唯一）

`<main>` 标出文档**主体**——与页面核心主题直接相关的内容。它有两条铁律：

1. **每页只能有一个可见的 `<main>`**（多余的必须带 `hidden`）；
2. 它**不能**是 `<article>` / `<aside>` / `<footer>` / `<header>` / `<nav>` 的后代——必须是「层级正确的 main」。

重复出现在多个页面的东西（侧栏、导航、版权、logo）**不该**放进 `<main>`。它的隐式角色是 `main` 地标，最经典的搭配是「跳转链接」：

```html
<body>
  <a href="#main-content">跳到主内容</a>
  <header>…</header>
  <main id="main-content">
    <h1>本页独有的核心内容</h1>
    …
  </main>
</body>
```

## `<article>` 与 `<section>`：内容分块

这两个是分区内容的主力，也是最难抉择的一对，本叶专门用一整页讲它们的判定：[`article` vs `section`](./article-vs-section)。这里先记住一句话——

- `<article>`：**自包含、可独立分发 / 复用**的单元（博客文章、评论、商品卡）；
- `<section>`：**主题分组**，没有更具体的语义元素时才用，且**应当带标题**。

两者都会在文档里开启一个新「区段」。

## `<aside>`：旁支内容（侧栏）

`<aside>` 表示与周围内容**间接相关**、可以单独拎出来的内容——侧栏、补充框、相关链接、广告、作者简介。隐式角色 `complementary`（地标）。

一个关键的**反例**：不要拿 `<aside>` 去包正文里的「插话 / 括号补充」，那种文字属于主内容流。

```html
<article>
  <p>迪士尼电影《小美人鱼》于 1989 年首映。</p>
  <aside>
    <p>这部电影首映期间票房 8700 万美元。</p>
  </aside>
  <p>关于影片的更多信息……</p>
</article>
```

`<aside>` 表达的是「间接相关」这层**含义**，至于它在视觉上是不是真的在侧边，是 CSS 的事。

## `<footer>`：页脚（地标也看位置）

`<footer>` 是「最近的分区祖先或文档」的页脚，常放作者信息、版权、相关文档链接。和 `<header>` 一样，**它是不是地标取决于位置**：

- **顶层**：`contentinfo` 地标；
- **嵌在** `article`/`aside`/`main`/`nav`/`section` 内：退化为 `generic`，只是「该区段的页脚」。

联系方式适合放进 `<footer>` 里的 `<address>`：

```html
<footer>
  <p>&copy; 2026 我的站点</p>
  <address>
    联系：<a href="mailto:hi@example.com">hi@example.com</a>
  </address>
</footer>
```

::: tip 兼容性小贴士
极老版本的 Safari（低于 13）不会把 `<footer>` 暴露为 `contentinfo` 地标。如确实要照顾这类古董浏览器，可显式补 `role="contentinfo"`；现代项目一般无需。
:::

## 地标速查与「重名」陷阱

| 元素 | 顶层隐式角色（地标） | 嵌套时 |
| --- | --- | --- |
| `<header>` | `banner` | `generic`（非地标） |
| `<nav>` | `navigation` | 始终 `navigation` |
| `<main>` | `main` | —（不应嵌套） |
| `<aside>` | `complementary` | 始终 `complementary` |
| `<footer>` | `contentinfo` | `generic`（非地标） |
| `<section>` | 有无障碍名→`region`，否则 `generic` | 同 |

最容易踩的坑是**同类地标重名**：页面里两个 `<nav>`、两个 `<aside>`，读屏会念出两个一模一样的地标名，用户分不清。**凡是同类型地标出现多个，就用 `aria-label` 或 `aria-labelledby` 给每个起个名**（如上面 `<nav aria-label="主导航">` 的写法）。

## 下一步

骨架搭好了，最纠结的问题随之而来：一块内容到底该用 `<article>` 还是 `<section>`？什么时候其实根本该用 `<div>`？下一页给一套可操作的判定流程：[`article` vs `section` 判定](./article-vs-section)。
