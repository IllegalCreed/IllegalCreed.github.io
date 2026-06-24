---
layout: doc
outline: [2, 3]
---

# 表格结构

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 一张表的骨架：`<table>` 容器 + `<caption>` 标题 + `<thead>` / `<tbody>` / `<tfoot>` 三分区 + `<tr>` 行 + `<th>` / `<td>` 单元格
- 子元素**法定顺序**：`<caption>` →（0~多个）`<colgroup>` →（可选）`<thead>` →（0~多个 `<tbody>` 或直接若干 `<tr>`）→（可选）`<tfoot>`
- `<caption>` 必须是**第一个**子元素；`<thead>` 与 `<tfoot>` 各**最多一个**；`<tbody>` 可有多个
- `<tfoot>` 在源码里写哪都行，但浏览器**渲染时永远把它放表尾**（旧规范曾要求写在 `<tbody>` 之前，现已放宽）
- `<thead>` / `<tbody>` / `<tfoot>` 隐式 ARIA 角色为 `rowgroup`——它们是「行的语义分组」
- 浏览器容错：游离的 `<tr>` 会被自动包进一个补全的 `<tbody>`，但**别依赖**，显式写更可控
- `<table>` 自身无任何专有属性，只接受全局属性；`border` / `cellpadding` / `cellspacing` / `width` / `frame` / `rules` / `summary` **全部废弃**
- 单元格内容模型：`<td>` 是流式内容（什么都能放）；`<th>` 也是流式内容但**不允许**再嵌 `<header>` / `<footer>` / 分区内容 / 标题元素

## `<table>` 是数据的二维容器

`<table>` 元素表示**表格数据**——按行与列组织、单元格内含数据的二维信息。它的开始与结束标签都不可省略，隐式 ARIA 角色是 `table`，辅助技术由此得知「这里是一个有行有列的表格结构」。

关键认知：`<table>` 自身**没有任何专有 HTML 属性**，只接受全局属性。所有历史上的表现属性都已废弃，对照如下——遇到老代码请逐一搬到 CSS：

| 废弃属性 | 旧用途 | 现代 CSS 替代 |
| --- | --- | --- |
| `border` | 边框宽度 | `border`（配 `border-collapse`） |
| `cellpadding` | 单元格内边距 | `<th>` / `<td>` 上的 `padding` |
| `cellspacing` | 单元格间距 | `border-spacing` |
| `width` | 表格宽度 | `width` |
| `align` | 水平对齐 | `margin-inline-start` / `-end` |
| `bgcolor` | 背景色 | `background-color` |
| `frame` / `rules` | 显示哪些边框 | `border-style` / `border-width` / `border` |
| `summary` | 表格摘要（无障碍） | `<caption>`（必要时配 `aria-describedby`） |

## 合法子元素与法定顺序

WHATWG 规范对 `<table>` 的内容模型规定得很死，顺序必须是：

1. 可选的一个 `<caption>`；
2. 零或多个 `<colgroup>`；
3. 可选的一个 `<thead>`；
4. **要么**零或多个 `<tbody>`，**要么**一个或多个直接的 `<tr>`（二选一）；
5. 可选的一个 `<tfoot>`。

```html
<table>
  <caption>……</caption>
  <colgroup>……</colgroup>
  <thead>……</thead>
  <tbody>……</tbody>
  <tbody>……</tbody>
  <tfoot>……</tfoot>
</table>
```

::: warning 顺序与数量的硬约束
- `<caption>` 若存在，**必须是 `<table>` 的第一个元素子节点**；
- `<thead>` 至多一个，位于 `<tbody>` / `<tfoot>` / `<tr>` 之前；
- `<tfoot>` 至多一个；
- `<tbody>` 可以有**多个**（用来把数据语义地分成几段，比如按季度分块）。
写错顺序通常不会「报错」，但会被解析器纠正成你没预期的 DOM，CSS 与脚本随之错位。
:::

## `<caption>`：先给表一个标题

```html
<table>
  <caption>
    用户登录邮箱一览
  </caption>
  <thead>
    …
  </thead>
</table>
```

`<caption>` 给整张表一个**可访问名称**。它的价值在快速浏览页面的人身上尤其突出——尤其是低视力用户和读屏用户：一句话先讲清表的主题，他们就能判断「要不要细读」，而不必让屏幕阅读器把一格格内容念完才搞懂这表是干嘛的。

它必须是第一个子元素；想调整标题在表上方还是下方，用 CSS 的 `caption-side`（取代废弃的 `align` 属性）：

```css
caption {
  caption-side: top; /* 或 bottom */
  text-align: left;
  font-weight: bold;
  padding-bottom: 10px;
}
```

## `<thead>` / `<tbody>` / `<tfoot>`：行的语义分区

这三者把行分成「表头 / 主体 / 表尾」三段，隐式 ARIA 角色都是 `rowgroup`。它们带来三重好处：

- **语义清晰**：阅读源码或辅助技术都能分清哪行是表头、哪行是数据、哪行是汇总；
- **样式抓手**：CSS 可整段命中（如给 `thead` 加底色、给 `tfoot` 加上边框）；
- **打印分页**：长表跨页打印时，浏览器可在每页重复 `<thead>` / `<tfoot>`。

```html
<table>
  <thead>
    <tr>
      <th scope="col">月份</th>
      <th scope="col">收入</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">一月</th>
      <td>12,300</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">合计</th>
      <td>12,300</td>
    </tr>
  </tfoot>
</table>
```

::: tip `<tfoot>` 的位置：源码 vs 渲染
现行标准允许把 `<tfoot>` 写在 `<table>` 末尾（紧跟 `<tbody>` 之后），但**渲染时它永远显示在表格底部**。早期 HTML 曾强制要求 `<tfoot>` 写在 `<tbody>` 之前（以便流式渲染时先拿到表尾），如今这条限制已放宽——按阅读直觉把它写在最后即可。
:::

## `<tr>` / `<th>` / `<td>`：行与单元格

- `<tr>`（table row）是一行，里面放零或多个 `<th>` / `<td>`。它可以直接挂在 `<table>` 下（当你没用 `<tbody>` 时），也可以在 `<thead>` / `<tbody>` / `<tfoot>` 里。
- `<td>`（table data）是数据格，内容模型为**流式内容**——格子里可以放段落、链接、图片、`<time>`、甚至嵌套表格。
- `<th>`（table header）是表头格，内容模型也是流式内容，但**不允许**再嵌 `<header>` / `<footer>`、分区内容或标题元素（`<h1>`~`<h6>`）。它的语义与 `scope` / `headers` 关联见 [下一页](./cells-scope)。

## 浏览器的容错补全

HTML 解析器对表格异常宽容。最典型的一条：如果你把 `<tr>` 直接写在 `<table>` 下而没写 `<tbody>`，浏览器会在 DOM 里**自动补一个 `<tbody>`** 把这些行包进去——所以 `table > tr` 这样的 CSS 选择器往往选不中，得写 `table > tbody > tr`。

容错虽好，但**不应当依赖**：显式写出 `<thead>` / `<tbody>` / `<tfoot>` 让结构一目了然，也让样式与无障碍语义都落到实处。

## 小结

`<table>` 是数据的二维容器，`<caption>` 给它标题，`<thead>` / `<tbody>` / `<tfoot>` 把行分区，`<tr>` 装行、`<th>` / `<td>` 装格——顺序与数量都有硬规则。结构搭好后，下一步是让表头与数据「程序化关联」起来：[单元格与表头关联](./cells-scope)。
