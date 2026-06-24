---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 语义化一句话：**按内容的「含义」选元素，而不是按「外观」**——外观交给 CSS
- 页面骨架七件套：`<header>`（页眉）·`<nav>`（导航）·`<main>`（正文，每页**唯一**）·`<article>`（自包含单元）·`<section>`（主题分组）·`<aside>`（侧栏）·`<footer>`（页脚）
- 地标（landmark）：顶层 `<header>`=`banner`、`<main>`=`main`、`<nav>`=`navigation`、顶层 `<footer>`=`contentinfo`、`<aside>`=`complementary`——屏幕阅读器据此一键跳转
- `<main>` 每页**只能有一个**可见实例，且不能嵌在 `article`/`aside`/`footer`/`header`/`nav` 里
- `<header>`/`<footer>` 只有在**顶层**才是地标；嵌进分区元素后退化为普通分组（`generic`）
- 标题用 `<h1>`–`<h6>` 表达**真实层级**，别跳级，别拿标题当「变大变粗」的样式开关
- 搜索框用新的 `<search>` 元素（2023-10 Baseline）代替 `<div role="search">`
- 「只为套样式」的容器才用 `<div>`，它是**最后手段**，不是默认选择
- 选元素口诀：「**哪个元素最能表达这块内容的功能？**」答得上来就选它

## 一份「语义化」的页面骨架

下面这份骨架覆盖了一个典型内容页真正需要的结构，本叶其余各页就是逐块拆解它。注意：除了 CSS 钩子，几乎不需要 class，标签本身已经讲清了一切。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>一篇博客文章 · 我的站点</title>
  </head>
  <body>
    <!-- 跳转链接：让键盘 / 读屏用户跳过导航直达正文 -->
    <a href="#main">跳到主内容</a>

    <!-- 顶层 header = banner 地标：站点级页眉 -->
    <header>
      <a href="/" class="logo">我的站点</a>

      <!-- 主导航：major 导航块才配 nav -->
      <nav aria-label="主导航">
        <ul>
          <li><a href="/">首页</a></li>
          <li><a href="/blog">博客</a></li>
          <li><a href="/about">关于</a></li>
        </ul>
      </nav>

      <!-- 搜索：用语义化的 search 元素，自带 search 地标 -->
      <search>
        <form action="/search">
          <label for="q">站内搜索</label>
          <input type="search" id="q" name="q" />
          <button type="submit">搜索</button>
        </form>
      </search>
    </header>

    <!-- main = 本页独有的核心内容，每页唯一 -->
    <main id="main">
      <!-- article = 自包含、可独立分发的内容单元 -->
      <article>
        <header>
          <!-- hgroup：一个标题 + 一行副标题（p） -->
          <hgroup>
            <h1>语义化 HTML 入门</h1>
            <p>把含义写进标签，而不是写进 class</p>
          </hgroup>
          <p>
            发表于
            <time datetime="2026-06-24">2026 年 6 月 24 日</time>
          </p>
        </header>

        <!-- section = 文章内的主题分组，应带标题 -->
        <section>
          <h2>为什么要语义化</h2>
          <p>可访问性、SEO、可维护性三笔账……</p>
        </section>

        <section>
          <h2>常用分区元素</h2>
          <p>header、nav、main、article、section、aside、footer……</p>
        </section>

        <!-- 文章页脚：嵌套 footer，不是地标 -->
        <footer>
          <p>
            作者：<a href="/author/illegal" rel="author">Illegal</a>
          </p>
        </footer>
      </article>

      <!-- aside = 与正文间接相关的旁支内容（侧栏） -->
      <aside aria-label="相关文章">
        <h2>相关阅读</h2>
        <ul>
          <li><a href="#">HTML 文档结构与元数据</a></li>
          <li><a href="#">CSS 基础选择器</a></li>
        </ul>
      </aside>
    </main>

    <!-- 顶层 footer = contentinfo 地标：站点级页脚 -->
    <footer>
      <p>&copy; 2026 我的站点</p>
      <address>
        联系：<a href="mailto:hi@example.com">hi@example.com</a>
      </address>
    </footer>
  </body>
</html>
```

::: tip 这份骨架的取舍
真实页面里，导航也可以不是 `<ul>`，散文式的 `<nav><p>…</p></nav>` 同样合法；`<aside>` 不一定在视觉上是侧栏，它表达的是「间接相关」这层**含义**，怎么摆是 CSS 的事。骨架只示范「该用语义元素的地方就用」，而非强制每个角落都套一个。
:::

## 逐块拆解

### ① 跳转链接 + 顶层 header

页面第一个可聚焦元素常是一条「跳到主内容」的链接，配合 `<main id="main">` 使用，让键盘和读屏用户一键跳过重复的导航。紧接着是顶层 `<header>`——只要它不嵌在分区元素里，就自动成为站点级的 `banner` 地标。详见 [分区元素与页面骨架](./guide-line/sectioning-elements)。

### ② nav 与 search

`<nav>` 只留给**主要**导航块（主菜单、面包屑、目录），不是「凡是一堆链接就套 nav」。页脚里那串杂链通常不必用 `<nav>`。搜索区用 2023 年才广泛可用的 `<search>` 元素，它自带 `search` 地标，省去手写 `role="search"`。详见 [易错语义](./guide-line/niche-semantics)。

### ③ main 与 article

`<main>` 标出本页**独有**的核心内容，每页**只能有一个**可见实例。一篇博客文章这种「拿出去也成立、能被订阅 / 转载」的内容单元，用 `<article>`；它内部还能再嵌自己的 `<header>` / `<footer>`。详见 [`article` vs `section` 判定](./guide-line/article-vs-section)。

### ④ section 与标题

文章内部按主题切块用 `<section>`，**每个 `section` 都应带一个标题**（`<h2>` 等），否则它对读屏几乎没有意义。标题用 `<h1>`–`<h6>` 表达真实层级，别跳级。详见 [标题层级与文档大纲](./guide-line/headings-outline)。

### ⑤ aside 与 footer

`<aside>` 放与正文**间接相关**的旁支（相关文章、作者简介、广告），它有 `complementary` 地标。顶层 `<footer>` 是 `contentinfo` 地标，常放版权与 `<address>` 联系方式；但嵌在 `<article>` 里的 `<footer>` 只是该文的页脚，不是地标。详见 [分区元素与页面骨架](./guide-line/sectioning-elements)。

## 选元素的唯一心法

web.dev 给出的判断标准只有一句话：

> 「**哪个元素最能表达这块内容的功能？**」（Which element best represents the function of this section of markup?）

答得上来——是导航就 `<nav>`、是自包含文章就 `<article>`、是联系方式就 `<address>`——你大概率就选对了。答不上来、纯粹只是想套个样式容器，**才**轮到 `<div>`。把这句问句变成肌肉记忆，语义化就成功了一大半。

## 下一步

先搞清楚「为什么值得为语义化多花这点心思」——下一页用可访问性、SEO、可维护性三笔账，对比「div 汤」的真实代价：[为什么语义化](./guide-line/why-semantic)。
