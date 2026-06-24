---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 七件套骨架：`<header>`·`<nav>`·`<main>`·`<article>`·`<section>`·`<aside>`·`<footer>`
- 四类**分区内容**：`<article>`·`<section>`·`<nav>`·`<aside>`（`<header>`/`<footer>`/`<main>` 不是分区内容）
- 地标：顶层 `<header>`→`banner`、`<main>`→`main`、`<nav>`→`navigation`、顶层 `<footer>`→`contentinfo`、`<aside>`→`complementary`
- `<header>`/`<footer>` 只有**顶层**才是地标；`<main>` 每页**唯一**；`<section>` 有名才升 `region`
- `article` vs `section`：**自包含可复用**用 `article`，**主题分组**用 `section`，**纯样式盒子**用 `div`
- 标题：用真实级别 `h1`–`h6`、**别向下跳级**、一页一个 `<h1>`；「大纲算法」**从未实现**，别依赖
- `<search>`（2023-10 Baseline）代替 `role="search"`；`<address>` 只表联系方式；`<hgroup>` = 一标题 + 若干 `<p>`
- 红线：能用原生语义元素就别贴 `role`；`<div>` 是最后手段，不是默认

## 语义化页面骨架模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>页面标题 · 站点名</title>
  </head>
  <body>
    <a href="#main">跳到主内容</a>

    <header>
      <a class="logo" href="/">站点名</a>
      <nav aria-label="主导航">
        <ul>
          <li><a href="/">首页</a></li>
          <li><a href="/blog">博客</a></li>
        </ul>
      </nav>
      <search>
        <form action="/search">
          <label for="q">搜索</label>
          <input type="search" id="q" name="q" />
        </form>
      </search>
    </header>

    <main id="main">
      <article>
        <header>
          <hgroup>
            <h1>文章标题</h1>
            <p>一行副标题</p>
          </hgroup>
        </header>
        <section>
          <h2>第一节</h2>
          <p>……</p>
        </section>
        <footer>
          <p>作者：<a href="/me" rel="author">作者名</a></p>
        </footer>
      </article>

      <aside aria-label="相关阅读">
        <h2>相关阅读</h2>
        <ul>
          <li><a href="#">相关链接</a></li>
        </ul>
      </aside>
    </main>

    <footer>
      <p>&copy; 2026 站点名</p>
      <address>联系：<a href="mailto:hi@example.com">hi@example.com</a></address>
    </footer>
  </body>
</html>
```

## 分区与骨架元素速查

| 元素 | 含义 | 顶层隐式角色 | 嵌套时 | 备注 |
| --- | --- | --- | --- | --- |
| `<header>` | 页眉 / 引导内容 | `banner` | `generic` | 内部不能再放 `header`/`footer` |
| `<nav>` | **主要**导航块 | `navigation` | `navigation` | 别滥用；页脚杂链不必包 |
| `<main>` | 文档主体 | `main` | —（不应嵌套） | 每页**唯一**可见实例 |
| `<article>` | 自包含可复用单元 | `article` | `article` | 可嵌套（评论嵌文章） |
| `<section>` | 主题分组 | 有名→`region`，否则 `generic` | 同 | **应带标题** |
| `<aside>` | 间接相关旁支 | `complementary` | `complementary` | 别包正文括号补充 |
| `<footer>` | 页脚 | `contentinfo` | `generic` | 可放 `<address>` |

## 分组与内容元素速查

| 元素 | 含义 | 易错点 |
| --- | --- | --- |
| `<h1>`–`<h6>` | 六级标题 | 别跳级、别当字号用、一页一个 `<h1>` |
| `<hgroup>` | 一个标题 + 若干 `<p>` 副标题 | **别**再用旧法包多个标题 |
| `<p>` | 段落 | 别用空 `<p>` 撑间距 |
| `<blockquote>` | 块级长引用（`cite` 属性） | 署名放**外面**；缩进是 CSS |
| `<q>` / `<cite>` | 行内引用 / 作品标题 | `<cite>` 标作品名，不标人名 |
| `<figure>`/`<figcaption>` | 自包含图表 + 说明 | caption 必须首/末子元素；可挪动 |
| `<hr>` | 主题转换（语义分隔） | 不是「画横线」工具 |
| `<pre>` | 预格式化文本 | 保留空白；配 `<code>` |
| `<address>` | 最近 `article`/`body` 的联系方式 | 不是「地址标签」；别塞日期 |
| `<div>` / `<span>` | 无语义容器（块 / 行内） | **最后手段**，只为样式 |

## 地标导航速查

读屏用户靠这些地标快速跳转，一页里**同类地标出现多个**时务必用 `aria-label` / `aria-labelledby` 起名区分：

| 地标角色 | 由谁产生 | 一页可有几个 |
| --- | --- | --- |
| `banner` | 顶层 `<header>` | 通常 1 |
| `navigation` | 每个 `<nav>` | 多个（需命名区分） |
| `main` | `<main>` | **1** |
| `complementary` | 每个 `<aside>` | 多个（需命名区分） |
| `contentinfo` | 顶层 `<footer>` | 通常 1 |
| `region` | 有无障碍名的 `<section>` | 多个（需命名区分） |
| `search` | `<search>` | 多个（需命名区分） |

## 标题与文档大纲规则

- **用真实级别**：`<h1>` 最高逐级向下，表达结构层级而非字号（字号用 CSS）。
- **别向下跳级**：`<h1>`→`<h3>` 缺 `<h2>`，不符合规范；但**收束子区段时可向上回跳**（`<h4>`→`<h3>`/`<h2>` 合法）。
- **一页一个 `<h1>`**：描述整页主题；多 `<h1>` 标准允许但非最佳实践。
- **大纲算法从未实现**：⚠️ 别写「每个 `section` 里放 `<h1>`、靠嵌套自动降级」——浏览器不会降级，结果是一串平级标题。分区元素**不改变**标题级别，想要几级就**显式写**几级。
- **规范现状**：有标题则大纲应**至少含一个 `<h1>`**；相邻标题级别向下**最多差 1 级**。

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `<article>`/`<section>`/`<nav>`/`<aside>`/`<header>`/`<footer>`/`<main>` | ✅ Baseline 广泛可用（2015-07 起） | 放心用 |
| `<figure>`/`<figcaption>` | ✅ 广泛可用 | 放心用 |
| `<hgroup>`（**新语义**：标题 + `<p>`） | ✅ 广泛可用 | 放心用；注意旧语义已废 |
| `<search>` 元素 | ✅ Baseline 广泛可用（**2023-10** 起） | 现代项目可用；极老浏览器降级为 `<div role="search">` |

## 红线清单

- ❌ 能用原生语义元素却用 `<div role="…">` 模拟（如 `<p role="button">`）——丢失原生功能；
- ❌ 给本就有该角色的元素重复贴 `role`（如给 `<button>` 加 `role="button"`）；
- ❌ 用标题级别当字号 / 加粗的样式开关；
- ❌ 向下跳级（`<h1>`→`<h3>`）；
- ❌ 依赖「文档大纲算法」自动降级标题（从未实现）；
- ❌ 把 `<search>` 当结果容器、把 `<address>` 当任意地址标签、用旧法让 `<hgroup>` 包多个标题；
- ❌ 把 `<section>` 当通用容器、或用 `<div>` 顶替本该有语义的内容。

## 权威链接

**标准 / 规范**

- [WHATWG HTML Standard — Sections](https://html.spec.whatwg.org/multipage/sections.html) · [Grouping content](https://html.spec.whatwg.org/multipage/grouping-content.html)
- [MDN: `<article>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article) · [`<section>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section) · [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) · [`<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside)
- [MDN: `<header>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header) · [`<footer>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer) · [`<main>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main) · [`<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search)
- [MDN: `<hgroup>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup) · [`<address>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address) · [`<figure>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure) · [`<h1>`–`<h6>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements)

**课程 / 指南**

- [web.dev: Learn HTML — Semantic HTML](https://web.dev/learn/html/semantic-html) · [Headings and sections](https://web.dev/learn/html/headings-and-sections)
- [Adrian Roselli: There Is No Document Outline Algorithm](https://adrianroselli.com/2016/08/there-is-no-document-outline-algorithm.html)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [WAI-ARIA Landmarks 示例（W3C）](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/)

## 相关页

- [入门](./getting-started) · [为什么语义化](./guide-line/why-semantic) · [分区元素与页面骨架](./guide-line/sectioning-elements)
- [`article` vs `section` 判定](./guide-line/article-vs-section) · [标题层级与文档大纲](./guide-line/headings-outline)
- [易错语义](./guide-line/niche-semantics) · [分组内容](./guide-line/grouping-content)
