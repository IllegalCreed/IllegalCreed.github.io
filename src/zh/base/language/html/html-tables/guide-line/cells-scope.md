---
layout: doc
outline: [2, 3]
---

# 单元格与表头关联

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<th>` = 表头格（隐式角色 `columnheader` / `rowheader`，默认加粗居中）；`<td>` = 数据格（无表头语义）
- `scope` 是**只属于 `<th>`** 的枚举属性，告诉辅助技术「这个表头管哪片格子」
- `scope` 四个取值：`col`（管整列）/ `row`（管整行）/ `colgroup`（管整个列组）/ `rowgroup`（管整个行组）
- 不写 `scope` 时浏览器会**自动推断**，但部分读屏可能推错——简单表也建议显式写 `scope` 求稳
- `<th>` 的 `abbr` 属性：给表头一个简短别名，读屏在「念某数据格对应的表头」时用它代替冗长全称
- 复杂表（多级表头 / 大量 `colspan`/`rowspan`）`scope` 不够用，改用 `headers`/`id` 显式绑定
- `headers` 写在 `<td>` 或 `<th>` 上，值是**空格分隔的 id 列表**，每个 id 必须指向同表内某个 `<th>`
- `id` 必须全文档唯一；`headers` 与 `id` 配对，是无障碍领域对复杂表的「终极手段」
- 原则：**表越简单越好**——能少合并就少合并，简单表读屏体验天然更好也更易维护

## `<th>` 与 `<td>` 的本质区别

表格里只有两种格子，区别不在外观而在**语义**：

- `<th>`（table header cell）是**表头格**：它声明「我是一组单元格的标题」，隐式 ARIA 角色为 `columnheader` 或 `rowheader`（取决于 `scope`），浏览器默认渲染为**加粗 + 居中**。
- `<td>`（table data cell）是**数据格**：它只承载数据，没有表头语义。

把本该是表头的格写成 `<td>`，视觉上你可以用 CSS 补回加粗，但**语义丢了**——读屏不再知道它是表头，也无法把它和对应的数据格关联起来。所以：凡是「给行/列起名」的格，一律用 `<th>`。

## `scope`：声明这个表头管哪片格子

`scope` 是**只能用在 `<th>` 上**的枚举属性，用来明确表头与数据格的关系。它有四个取值：

| `scope` 值 | 含义 |
| --- | --- |
| `col` | 表头作用于**它所在列**的所有数据格 |
| `row` | 表头作用于**它所在行**的所有数据格 |
| `colgroup` | 表头作用于**整个列组**的剩余所有格 |
| `rowgroup` | 表头作用于**整个行组**的剩余所有格 |

最常见的是 `col` 和 `row` 的组合——顶部一排列表头、每行最左一格行表头：

```html
<table>
  <caption>北约音标字母（节选）</caption>
  <tr>
    <th scope="col">字母</th>
    <th scope="col">代码词</th>
    <th scope="col">读音</th>
  </tr>
  <tr>
    <th scope="row">A</th>
    <td>Alfa</td>
    <td>AL fah</td>
  </tr>
  <tr>
    <th scope="row">B</th>
    <td>Bravo</td>
    <td>BRAH voh</td>
  </tr>
</table>
```

有了 `scope`，读屏用户把焦点移到「AL fah」这一格时，会被告知它对应的表头是「字母 A」与「读音」——即使表格很长、表头早已滚出视口，这层关联依然成立。

::: tip 不写 `scope` 会怎样？
若省略 `scope`（或填了非法值），浏览器会**自动推断**该表头管哪些格。在结构简单的表里这套推断通常没问题，所以 `scope` 看起来「冗余」。但某些辅助技术可能推断失败，**显式写上 `scope` 能稳定改善体验**——这点投入很小，建议养成习惯。
:::

### `rowgroup` / `colgroup`：管整个分组

当一个表头要统领「整段行」或「整组列」时，用 `rowgroup` / `colgroup`。例如把数据按地区分成几个 `<tbody>`，每段开头用一个 `scope="rowgroup"` 的表头：

```html
<tbody>
  <tr>
    <th scope="rowgroup" colspan="2">华东地区</th>
  </tr>
  <tr>
    <th scope="row">上海</th>
    <td>2,400 万</td>
  </tr>
  <tr>
    <th scope="row">杭州</th>
    <td>1,200 万</td>
  </tr>
</tbody>
```

注意一条规范约束：`<th>` **只有锚定在某个行组里时**才能用 `rowgroup`，**只有锚定在某个列组里时**才能用 `colgroup`，否则该取值无效。

## `abbr`：给表头一个简短别名

`<th>` 上的 `abbr` 属性提供一个**简短替代标签**，供「在别处引用这个表头时」使用——典型场景就是读屏在念某个数据格时，会先播报它对应的表头。如果表头全称很长，`abbr` 能让播报更干练：

```html
<th scope="col" abbr="净收入">本季度净营业收入（人民币元）</th>
```

视觉上单元格仍显示完整文字，但读屏在「报这格属于哪个表头」时可以只念「净收入」。

## 复杂表：`headers` + `id` 显式绑定

`scope` 适合「规整的行列表头」。可一旦表头跨多行多列、或出现两级以上表头、或大量 `colspan`/`rowspan`，自动关联就会乱套。这时改用**最可靠的手段**：给每个表头一个 `id`，再在数据格（或下级表头）上用 `headers` 列出它隶属的所有表头 id。

- `id`：全文档唯一的标识；
- `headers`：写在 `<td>` 或 `<th>` 上，值是**空格分隔的 token 集合**，每个 token 必须是同一张表内某个 `<th>` 的 `id`。

```html
<table>
  <caption>各班期中 / 期末成绩</caption>
  <tr>
    <td></td>
    <th id="midterm" scope="col">期中</th>
    <th id="final" scope="col">期末</th>
  </tr>
  <tr>
    <th id="class-a" scope="row">一班</th>
    <td headers="class-a midterm">88</td>
    <td headers="class-a final">92</td>
  </tr>
  <tr>
    <th id="class-b" scope="row">二班</th>
    <td headers="class-b midterm">85</td>
    <td headers="class-b final">90</td>
  </tr>
</table>
```

读屏在「92」这格会播报「一班 / 期末 / 92」——因为 `headers="class-a final"` 把它和两个表头都绑死了。`headers` 也能用在 `<th>` 上，把下级表头关联到上级表头（多级表头场景，见 [单元格合并](./colspan-rowspan)）。

::: warning 先想「能不能把表简化」
`headers`/`id` 虽强，却要为每个表头编 id、为每个数据格手写关联，量大且易错（漏一个 id、拼错一个 token，关联就断）。规范与 web.dev 都给出同一条忠告：**结构越简单的表越好理解、也越好维护**——能拆成两张简单表、能少用合并，就别硬堆一张复杂表。`headers`/`id` 是「表实在拆不开时」的兜底，不是首选。
:::

## 小结

`<th>` 与 `<td>` 区分表头与数据；`scope` 用 `col` / `row` / `rowgroup` / `colgroup` 声明表头的管辖范围；`abbr` 给冗长表头一个简短播报名；复杂表则靠 `headers`/`id` 显式绑定。这些关联看不见，却是读屏用户在表里穿行的全部依据。下一步看让单元格横跨多行多列的两个属性：[单元格合并](./colspan-rowspan)。
