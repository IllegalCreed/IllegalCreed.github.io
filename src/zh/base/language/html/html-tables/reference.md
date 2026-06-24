---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 子元素法定顺序：`<caption>` → `<colgroup>` → `<thead>` → `<tbody>`(0~多) → `<tfoot>`
- 三条铁律：`<table>` 只装数据；`<caption>` 必为第一个子元素；表头用 `<th>` 并写 `scope`
- `scope` 四值：`col` / `row` / `colgroup` / `rowgroup`；复杂表改用 `headers`/`id` 显式绑定
- 合并：`colspan` ≤ 1000、`rowspan` ≤ 65534（`rowspan="0"` 跨满行组），默认都为 `1`
- `<col>` / `<colgroup>` 只为样式、无语义；`span` ≤ 1000；含 `<col>` 子元素时不能再写 `span`
- 列上只有 `background` / `border` / `width` / `visibility` 四类 CSS 生效（`border` 需 `border-collapse:collapse`）
- 表现属性全废：`border` / `cellpadding` / `cellspacing` / `width` / `align` / `bgcolor` / `frame` / `rules` / `summary` → 改 CSS
- 改 CSS `display` 做响应式 → 必补 `role`（`table` / `rowgroup` / `row` / `columnheader` / `rowheader` / `cell`）
- 布局别用表格 → CSS Grid / Flexbox；遗留布局表加 `role="presentation"`

## 完整数据表模板

```html
<table>
  <caption>
    2025 年俱乐部成员一览
  </caption>

  <colgroup>
    <col />
    <col span="2" class="dates" />
    <col />
  </colgroup>

  <thead>
    <tr>
      <th scope="col" rowspan="2">姓名</th>
      <th scope="col" colspan="2">会籍日期</th>
      <th scope="col" rowspan="2">余额（元）</th>
    </tr>
    <tr>
      <th scope="col">加入</th>
      <th scope="col">取消</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <th scope="row">阮明月</th>
      <td><time datetime="2010-06-03">2010-06-03</time></td>
      <td>—</td>
      <td>0.00</td>
    </tr>
  </tbody>

  <tfoot>
    <tr>
      <th scope="row" colspan="3">合计</th>
      <td>52.00</td>
    </tr>
  </tfoot>
</table>
```

## 元素速查

| 元素 | 作用 | 关键点 |
| --- | --- | --- |
| `<table>` | 表格容器 | 隐式角色 `table`；无专有属性，表现属性全废 |
| `<caption>` | 表标题 / 可访问名称 | **必须第一个子元素**；位置用 CSS `caption-side` |
| `<colgroup>` | 列分组（样式用） | 位于 `<caption>` 后、`<thead>` 前；`span` 与 `<col>` 子元素互斥 |
| `<col>` | 单列（样式用） | 无语义；可带 `span`；只 4 类 CSS 生效 |
| `<thead>` | 表头行组 | 至多一个；隐式角色 `rowgroup` |
| `<tbody>` | 主体行组 | **可多个**；隐式角色 `rowgroup` |
| `<tfoot>` | 表尾行组 | 至多一个；渲染恒在表尾（源码位置自由） |
| `<tr>` | 表格行 | 含零或多个 `<th>` / `<td>` |
| `<th>` | 表头格 | 默认加粗居中；隐式 `columnheader` / `rowheader`；带 `scope` / `abbr` / `headers` |
| `<td>` | 数据格 | 内容为流式内容；可带 `headers` |

## 单元格 / 表头属性速查

| 属性 | 用在 | 取值 / 说明 |
| --- | --- | --- |
| `scope` | `<th>` | `col` / `row` / `colgroup` / `rowgroup`；缺省时浏览器自动推断 |
| `headers` | `<th>` / `<td>` | 空格分隔的 id 集合，每个 id 须指向同表内某个 `<th>` |
| `id` | 任意（这里指 `<th>`） | 全文档唯一；与 `headers` 配对，用于复杂表关联 |
| `abbr` | `<th>` | 表头的简短别名，供读屏引用时代替全称 |
| `colspan` | `<th>` / `<td>` | 横跨列数；`>0` 且 `≤1000`，默认 `1` |
| `rowspan` | `<th>` / `<td>` | 纵跨行数；`≤65534`，默认 `1`；`0` = 跨满当前行组 |
| `span` | `<col>` / `<colgroup>` | 跨列数；`>0` 且 `≤1000`，默认 `1`；`<colgroup>` 含 `<col>` 时禁用 |

## `scope` / `headers` 选型速查

| 表的复杂度 | 推荐做法 |
| --- | --- |
| 单层行/列表头（规整表） | `<th scope="col">` + `<th scope="row">` 足够 |
| 表头统领整段行 / 整组列 | `scope="rowgroup"` / `scope="colgroup"` |
| 多级表头 / 大量 `colspan`/`rowspan` | 每个 `<th>` 编 `id` + 数据格写 `headers`（`scope` 会推错） |
| 表头全称很长 | 配 `<th abbr="简称">` 改善读屏播报 |
| 表「在说明观点」需解读 | 加简短摘要：`aria-describedby` 或 `<figure>`+`<figcaption>` |
| 实在太复杂 | **优先拆成多张简单表**——简单表天然更无障碍、更好维护 |

## 废弃表现属性 → CSS 对照

| 废弃属性（在 `<table>`/单元格） | 现代 CSS 替代 |
| --- | --- |
| `border` | `border` + `border-collapse` |
| `cellpadding` | `<th>` / `<td>` 的 `padding` |
| `cellspacing` | `border-spacing` |
| `width` | `width` |
| `align` | `margin-inline-start` / `-end`、`text-align` |
| `bgcolor` | `background-color` |
| `frame` / `rules` | `border-style` / `border-width` / `border` |
| `summary` | `<caption>`（必要时配 `aria-describedby`） |
| `<caption align>` | `caption-side` / `text-align` |

## 常用表格 CSS 速查

| 属性 | 作用 |
| --- | --- |
| `border-collapse: collapse` | 合并相邻单元格边框为单线（也是 `<col>` 边框生效前提） |
| `border-spacing` | 分离边框模式下单元格间距 |
| `caption-side` | 标题在表上方 / 下方 |
| `empty-cells: hide` | 分离边框模式下隐藏空格子 |
| `:nth-child()` | 斑马纹等结构化条纹 |
| `position: sticky` | 钉住表头 / 首列，长表滚动时不跑 |

## 无障碍红线

- 别拿 `<table>` 排版；遗留布局表必须 `role="presentation"`（`/none`），且其上**不要**加 `aria-label`
- 改了 CSS `display` 做响应式，**必须**补回 `role="table"` / `rowgroup` / `row` / `columnheader` / `rowheader` / `cell`
- 表头必用 `<th>`（别用 `<td>` + CSS 加粗冒充），并写 `scope`
- 复杂表别只靠 `scope`，用 `headers`/`id`；但**首选是把表拆简单**
- 交互表（可选中 / 二维键盘导航 / 可拖拽）才用 `role="grid"`，行可展开折叠才用 `role="treegrid"`

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `<table>` 全套语义元素 | ✅ Baseline 广泛可用 | 放心用 |
| `scope` / `headers` / `id` 关联 | ✅ 广泛可用 | 放心用 |
| `colspan` / `rowspan` | ✅ 广泛可用 | 放心用（注意取值上限） |
| `<col>` / `<colgroup>` + `span` | ✅ 广泛可用 | 仅样式用途，无语义 |
| `position: sticky`（粘性表头） | ✅ Baseline 广泛可用 | 放心用 |
| `role="grid"` / `treegrid` | 🟡 需配套键盘交互 | 仅交互表用，须实现完整交互契约 |

## 权威链接

**标准 / 规范**

- [WHATWG HTML Standard — Tabular data](https://html.spec.whatwg.org/multipage/tables.html)
- [MDN: `<table>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) · [`<th>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th) · [`<td>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td) · [`<caption>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption) · [`<colgroup>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup)
- [MDN: ARIA presentation role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/presentation_role)

**课程 / 指南**

- [web.dev: Learn HTML — Tables](https://web.dev/learn/html/tables)
- [MDN: HTML table basics（学习）](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/HTML_table_basics)
- [MDN: Tables for visually impaired users（无障碍）](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Table_accessibility)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)

## 相关页

- [入门](./getting-started) · [表格结构](./guide-line/table-structure) · [单元格与表头关联](./guide-line/cells-scope)
- [单元格合并](./guide-line/colspan-rowspan) · [列样式 `<col>` / `<colgroup>`](./guide-line/col-colgroup)
- [表格可访问性](./guide-line/table-a11y) · [数据表 vs 布局表](./guide-line/data-vs-layout)
