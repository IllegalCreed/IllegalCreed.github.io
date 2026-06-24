---
layout: doc
outline: [2, 3]
---

# 列样式 `<col>` / `<colgroup>`

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<colgroup>` 把若干列归为一组、`<col>` 代表组内单独一列，**只为样式服务**，无语义、不进无障碍树
- 位置铁律：`<colgroup>` 必须在 `<caption>` 之后、`<thead>` / `<tbody>` / `<tfoot>` / `<tr>` 之前
- `span` 属性：表示跨多少列；取值「大于 0 且不超过 1000」，默认 `1`，可用在 `<colgroup>` 与 `<col>` 上
- **互斥规则**：`<colgroup>` 一旦内含 `<col>` 子元素，就**不能**再写 `span`（二选一）
- 能作用在列上的 CSS 很有限，实测只有 4 类：`background`、`border`、`width`、`visibility`
- `border` 仅当表格设了 `border-collapse: collapse` 才对列生效
- `width` 在列上等同于设了 `min-width`（最小宽度）；`visibility: collapse` 可整列隐藏
- 背景绘制有层级：列组在最底，依次被列、行组、行、单元格盖住——上层不透明就看不见下层

## `<col>` / `<colgroup>` 是干什么的

有时你想给「整列」统一加底色或定宽——比如把一周里「工作日五列」和「周末两列」染成不同颜色。靠给每个 `<td>` 单独加类太繁琐，这时用 `<colgroup>` / `<col>`：

- `<colgroup>`：把连续的若干列**归为一组**；
- `<col>`：代表组内的**某一列**（或借 `span` 代表连续几列）。

它们纯粹**为视觉分组与样式服务**，对无障碍树**没有任何语义影响**（隐式 ARIA 角色为「无对应角色」，也不允许加 `role`）。也就是说：列的颜色能帮视觉用户，但**不会**告诉读屏「这几列是一组」——列的语义关系仍要靠表头的 `scope` / `headers` 表达。

## 位置与 `span`

`<colgroup>` 在 `<table>` 里的位置是固定的：紧跟 `<caption>` 之后、在任何 `<thead>` / `<tbody>` / `<tfoot>` / `<tr>` 之前。

`span` 属性声明「这一组（或这一列）覆盖多少列」，取值是「大于 0 且不超过 1000」的整数，默认 `1`。下面把 7 列分成「工作日 5 列 + 周末 2 列」两组：

```html
<table>
  <caption>每周个人活动</caption>

  <colgroup span="5" class="weekdays"></colgroup>
  <colgroup span="2" class="weekend"></colgroup>

  <thead>
    <tr>
      <th>一</th><th>二</th><th>三</th><th>四</th><th>五</th>
      <th>六</th><th>日</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>打扫</td><td>足球</td><td>舞蹈</td><td>历史课</td><td>采购</td>
      <td>自习</td><td>自由活动</td>
    </tr>
  </tbody>
</table>
```

```css
.weekdays { background-color: #d7d9f2; }
.weekend  { background-color: #ffe8d4; }
```

::: warning `span` 与 `<col>` 子元素互斥
如果 `<colgroup>` 里写了一个或多个 `<col>` 子元素，那么 `<colgroup>` 上**不允许**再写 `span`——要么用 `span` 概括整组、要么用 `<col>` 逐列描述，二者不能同时存在。逐列写法适合给组内不同列分别定宽/上色：

```html
<colgroup>
  <col style="background: #eef;" />     <!-- 第 1 列 -->
  <col span="2" style="width: 6rem;" /> <!-- 第 2~3 列，col 自己也能用 span -->
  <col />                               <!-- 第 4 列 -->
</colgroup>
```
:::

## 哪些 CSS 真的能作用在列上

这是 `<col>` / `<colgroup>` 最反直觉的地方：**绝大多数 CSS 属性对列无效**，实测只有以下四类会生效：

| 属性 | 在列上的效果 |
| --- | --- |
| `background` | 给该列组/列内的单元格设背景（受绘制层级影响，见下） |
| `border` | 各 `border` 属性生效，但**仅当表格设了 `border-collapse: collapse`** |
| `width` | 给列定一个**最小宽度**（等同于 `min-width`） |
| `visibility` | 取值 `collapse` 时，**整列不渲染**，跨进该列的格子被裁切 |

像 `padding`、`color`、`font-size`、`text-align` 这些写在 `<col>` 上**统统不起作用**——它们得写到 `<td>` / `<th>` 上。换句话说：列元素只管「整列的底色、边框、宽度、显隐」这四件事。

## 背景的绘制层级

当列、行、单元格都设了背景色时，谁盖谁有固定顺序。背景从底到顶依次绘制：

1. 列组 `<colgroup>`（最底层）
2. 列 `<col>`
3. 行组 `<thead>` / `<tbody>` / `<tfoot>`
4. 行 `<tr>`
5. 单元格 `<th>` / `<td>`（最顶层）

也就是说，列组的背景画在最底下——只有当它**上面每一层都透明**时，列的颜色才看得见。这解释了一个常见困惑：「我给 `<col>` 设了背景色，怎么没效果？」——多半是某个 `<tr>` 或 `<td>` 设了不透明背景，把列的颜色盖住了。

::: tip 改 `display` 会让列样式失效
如果你为了做响应式而把表格元素的 CSS `display` 改掉（比如 `table { display: block }`），表格的内部布局模型就被打破，`<col>` / `<colgroup>` 这类依赖表格布局的样式也会随之失效。响应式表格的取舍见 [数据表 vs 布局表](./data-vs-layout)。
:::

## 小结

`<colgroup>` / `<col>` 是**纯样式**的列分组工具：用 `span` 概括或用 `<col>` 逐列描述（二者互斥），但**对无障碍树没有语义**，且只有 `background` / `border` / `width` / `visibility` 四类 CSS 对它有效，背景还受绘制层级限制。列能上色、能定宽，却给不了语义——而表格真正的无障碍是另一套系统工程：[表格可访问性](./table-a11y)。
