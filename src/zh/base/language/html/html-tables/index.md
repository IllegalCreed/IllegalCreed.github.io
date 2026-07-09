---
layout: doc
---

# HTML 表格

表格是把「二维数据」忠实搬上网页的唯一原生结构——一行一行、一列一列、行列交叉处是单元格。它远不止 `<table>` 套 `<tr>` 套 `<td>` 那么简单：`<caption>` 给它一个标题、`<thead>` / `<tbody>` / `<tfoot>` 给它语义分区、`<th scope>` 与 `headers`/`id` 把表头和数据格牢牢绑定，让读屏用户也能像看见网格的人一样在表里穿行。本叶讲透「结构怎么搭、表头怎么关联、单元格怎么合并、列怎么整列上色、怎么让表格无障碍、以及为什么绝不能拿 `<table>` 来排版」这六件事。

## 概述

- **它管什么**：把成行成列、需要对比/排序/计算/交叉引用的**数据**结构化呈现，并通过表头关联让这份二维关系对屏幕阅读器同样成立。
- **为什么值得认真学**：表格写「能显示」很容易，写「读屏能用」却常被忽略——少了 `<caption>` 用户不知这表讲什么、`<th>` 全写成 `<td>` 表头与数据失联、合并单元格不补 `headers`/`id` 复杂表彻底乱套。这些坑视觉上看不出来，却让依赖辅助技术的人寸步难行。
- **现代化关注点**：`scope` 的四个取值（`row` / `col` / `rowgroup` / `colgroup`）、复杂表的 `headers`/`id` 显式关联、`<col>` / `<colgroup>` 的列级样式与 `span`、`border` / `cellpadding` 等表现属性**全部废弃**改用 CSS、以及「数据表 vs 布局表」的反模式与响应式表格策略。

## 本叶地图

- [入门](./getting-started) —— 一张「正确且现代」的数据表，逐块讲清结构、`<caption>` 与 `scope` 为什么这么写
- [表格结构](./guide-line/table-structure) —— `<table>` / `<caption>` / `<thead>` / `<tbody>` / `<tfoot>` 的语义、合法子元素顺序与容错补全
- [单元格与表头关联](./guide-line/cells-scope) —— `<th>` vs `<td>`、`scope` 的四值、复杂表用 `headers`/`id` 显式绑定
- [单元格合并](./guide-line/colspan-rowspan) —— `colspan` / `rowspan` 的取值上限、合并后的网格槽位与坑
- [列样式 `<col>` / `<colgroup>`](./guide-line/col-colgroup) —— `span` 属性、能作用在列上的 CSS、背景绘制层级
- [表格可访问性](./guide-line/table-a11y) —— `<caption>`、`scope`、读屏导航、复杂表 `headers`/`id`、改 `display` 要补 `role`
- [数据表 vs 布局表](./guide-line/data-vs-layout) —— 为何别用 `<table>` 排版、`role="presentation"`、响应式表格策略
- [参考](./reference) —— 速查表 + 元素速查 + `scope`/`headers` 速查 + 标准 / Baseline / 工具链接

## 文档地址

- [web.dev: Learn HTML — Tables](https://web.dev/learn/html/tables)
- [MDN: `<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) · [`<th>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th) · [`<caption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption)
- [WHATWG HTML Standard — Tabular data](https://html.spec.whatwg.org/multipage/tables.html)

## 幻灯片地址

<a href="/SlideStack/html-tables-slide/" target="_blank">HTML 表格</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=html-%E8%A1%A8%E6%A0%BC" target="_blank" rel="noopener noreferrer">HTML 表格 测试题</a>
