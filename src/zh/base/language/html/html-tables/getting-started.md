---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 表格仅用于**数据**：被对比、排序、计算、交叉引用的二维信息才配得上 `<table>`，绝不拿来排版
- 子元素顺序铁律：`<caption>` → `<colgroup>` → `<thead>` → `<tbody>`(0~多) → `<tfoot>`
- `<caption>` 必须是 `<table>` 的**第一个**子元素，一句话讲清这张表是什么（读屏用户据此决定读不读）
- 表头用 `<th>`、数据用 `<td>`；`<th>` 默认**加粗居中**，且带 `columnheader` / `rowheader` 隐式 ARIA 角色
- `scope="col"` 标列表头、`scope="row"` 标行表头——让读屏在第 N 行也能播报「这是某列的值」
- `<thead>` / `<tfoot>` 各最多一个；浏览器渲染时 `<tfoot>` 总在表尾，源码里写在哪都行
- 表现属性 `border` / `cellpadding` / `cellspacing` / `width` / `align` / `bgcolor` **全部废弃**，改用 CSS
- 合并单元格：`colspan`（跨列）/ `rowspan`（跨行），默认值都是 `1`
- 复杂表（多级表头 / 大量合并）改用 `headers`/`id` 显式绑定，比 `scope` 更稳
- 改 `display`（如做响应式）会影响无障碍树，需手动补回 `role="table"` / `row` / `cell`

## 一张「正确且现代」的数据表

下面这份模板覆盖了一张严肃数据表真正需要的东西——标题、表头分区、行/列表头、表尾汇总，本叶其余各页就是逐块拆解它：

```html
<table>
  <!-- 1. 标题：必须第一个，读屏用户靠它决定要不要细读 -->
  <caption>
    2025 年俱乐部成员一览
  </caption>

  <!-- 2. 表头区：列表头用 scope="col" -->
  <thead>
    <tr>
      <th scope="col">姓名</th>
      <th scope="col">编号</th>
      <th scope="col">加入时间</th>
      <th scope="col">余额（元）</th>
    </tr>
  </thead>

  <!-- 3. 主体区：每行第一格作行表头，scope="row" -->
  <tbody>
    <tr>
      <th scope="row">阮明月</th>
      <td>427311</td>
      <td><time datetime="2010-06-03">2010-06-03</time></td>
      <td>0.00</td>
    </tr>
    <tr>
      <th scope="row">李文卿</th>
      <td>533294</td>
      <td><time datetime="2018-11-21">2018-11-21</time></td>
      <td>52.00</td>
    </tr>
  </tbody>

  <!-- 4. 表尾区：汇总行，跨列表头合并 -->
  <tfoot>
    <tr>
      <th scope="row" colspan="3">合计</th>
      <td>52.00</td>
    </tr>
  </tfoot>
</table>
```

::: tip 这份模板的取舍
真实项目里不写 `border` / `cellpadding` / `cellspacing` / `width` 这些表现属性——它们在现行标准里**全部废弃**，边框间距一律交给 CSS（`border-collapse`、`border-spacing`、`<th>` / `<td>` 上的 `padding`）。模板只保留「现在仍承载语义」的结构与属性。
:::

## 逐块拆解

### ① 标题 `<caption>`

```html
<caption>
  2025 年俱乐部成员一览
</caption>
```

它必须是 `<table>` 的**第一个子元素**，给整张表一个可见且与表程序化关联的标题。对用屏幕阅读器的人尤其关键：一句话先讲清「这是什么表」，他们就能决定是细读还是跳过，不必逐格听完才知道主题。详见 [表格结构](./guide-line/table-structure)。

### ② 表头分区 `<thead>` / `<tbody>` / `<tfoot>`

这三个分区把「表头行 / 数据行 / 汇总行」在语义上分开。它们各自的数量与位置有明确规则——`<thead>` 与 `<tfoot>` 各最多一个，而 `<tfoot>` 无论写在源码哪个位置，浏览器**渲染时都会把它放到表尾**。详见 [表格结构](./guide-line/table-structure)。

### ③ 表头格 `<th>` 与 `scope`

```html
<th scope="col">姓名</th>
…
<th scope="row">阮明月</th>
```

`<th>` 标记「表头格」，默认加粗居中，并带有 `columnheader` 或 `rowheader` 的隐式 ARIA 角色。`scope="col"` 说「我是这一列的表头」，`scope="row"` 说「我是这一行的表头」——有了它，读屏滚动到任意一格时都能播报出它对应的行/列表头是什么。详见 [单元格与表头关联](./guide-line/cells-scope)。

### ④ 数据格 `<td>`

`<td>` 装真正的数据，内容模型是「流式内容」，所以格子里可以放 `<time>`、`<a>`、`<img>`、列表乃至嵌套结构。表里凡不是表头的格都用 `<td>`。

### ⑤ 合并与列样式

当表头需要横跨多列（如「会籍日期」上压「加入 / 取消」两小列）时用 `colspan`；纵跨多行用 `rowspan`。若要给整列上底色或定宽，则用 `<col>` / `<colgroup>`。详见 [单元格合并](./guide-line/colspan-rowspan) 与 [列样式 `<col>` / `<colgroup>`](./guide-line/col-colgroup)。

## 浏览器很宽容，但别依赖

HTML 解析器对表格容错极强：你哪怕不写 `<tbody>`，浏览器也会在 DOM 里自动补一个 `<tbody>` 把游离的 `<tr>` 包进去。但**不建议**依赖这种补全——显式写出 `<thead>` / `<tbody>` / `<tfoot>` 既更可读，也让 CSS 选择器与无障碍语义都有据可依。

## 一张表到底该不该用 `<table>`

判定很简单：这份内容**是不是数据**？要被对比、排序、计算、交叉引用的二维信息（成绩单、价目表、对照表），就用 `<table>`；只是想把缩略图排成网格、或把页面分成几栏，那是**布局**，该交给 CSS Grid / Flexbox / 多列布局，绝不能用表格。详见 [数据表 vs 布局表](./guide-line/data-vs-layout)。

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[表格结构](./guide-line/table-structure)、[单元格与表头关联](./guide-line/cells-scope)、[单元格合并](./guide-line/colspan-rowspan)、[列样式](./guide-line/col-colgroup)、[表格可访问性](./guide-line/table-a11y)、[数据表 vs 布局表](./guide-line/data-vs-layout)。
