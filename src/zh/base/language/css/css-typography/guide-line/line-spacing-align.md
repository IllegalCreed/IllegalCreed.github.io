---
layout: doc
outline: [2, 3]
---

# 行距·字距·对齐与装饰

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `line-height`：**永远用无单位数**（如 `1.5`）——表示「字号的倍数」，子元素按比例继承；带单位的固定值会被原样继承导致大字号行距被压扁
- 正文舒适行高约 `1.4`～`1.7`；标题可更紧（`1.1`～`1.3`）
- `letter-spacing`：字符间距，正值放宽负值收紧；大字号标题常 `-0.02em`，全大写文字常 `+0.05em`
- `word-spacing`：词间距（加在空格上），中文几乎用不到（无词间空格）
- `text-align`：`start` / `end`（随书写方向，优于 `left`/`right`）/ `center` / `justify`（两端对齐）
- `text-indent`：首行缩进，中文常 `2em`（首行空两字）
- `text-decoration`：简写 = 线型 `underline`/`line-through` + 线样式 `wavy`/`dotted` + 颜色 + `text-decoration-thickness`
- `text-underline-offset`：下划线与文字的距离，配合调出更精致的下划线
- `text-transform`：`uppercase` / `lowercase` / `capitalize`（仅改显示，不改源文本）
- `text-align: justify` 配 `hyphens: auto` 才不会撑出大空隙；中文两端对齐天然平整

## `line-height`：务必用无单位数

`line-height` 设定行与行的垂直间距，可取 `normal`、无单位数、长度或百分比。**强烈建议用无单位数**：

```css
body {
  line-height: 1.5; /* ✅ 推荐：当前字号的 1.5 倍 */
}
```

为什么无单位数这么重要？因为 `line-height` 会被子元素继承，而**继承的内容因写法不同而不同**：

- **无单位数**继承的是「这个比例」——每个后代按**自己的**字号去乘，行距永远合理；
- **带单位的值**（`24px`、`150%`、`1.5em`）继承的是**算出来的固定长度**——后代不管自己字号多大，都被钉死在那个像素值上。

::: warning 经典坑：带单位 `line-height` 让大字号子元素行距被压扁

```css
/* ❌ 反例 */
body {
  font-size: 16px;
  line-height: 24px; /* 固定 24px，会被原样继承 */
}
h1 {
  font-size: 40px; /* 字号 40px，但行高仍是继承来的 24px！ */
  /* 结果：行高 < 字号，多行标题会上下挤压、字叠在一起 */
}
```

改成 `line-height: 1.5` 后，`h1` 的行高自动变成 `40 × 1.5 = 60px`，问题消失。**记住：`line-height` 不写单位。**
:::

行高经验值：正文 `1.4`～`1.7` 最舒适；大标题可收到 `1.1`～`1.3`；纯数字/代码块视情况。

## `letter-spacing` 与 `word-spacing`

```css
h1 {
  letter-spacing: -0.02em; /* 大字号收紧一点更精神 */
}
.badge {
  letter-spacing: 0.08em; /* 全大写小标签放宽更易读 */
  text-transform: uppercase;
}
```

- `letter-spacing`——字符间距，正值放宽、负值收紧。用 `em` 单位（随字号缩放）比 `px` 更稳健。大字号标题略收紧、全大写短文字略放宽，是常见的精修手法。
- `word-spacing`——词与词之间（即空格）的额外间距。对中文几乎无用（中文词间没有空格），主要用于西文。

## `text-align`：水平对齐

```css
p {
  text-align: start; /* 随书写方向：LTR 下靠左，RTL 下靠右 */
}
.cta {
  text-align: center;
}
.article {
  text-align: justify; /* 两端对齐 */
}
```

| 值 | 含义 |
| --- | --- |
| `start` / `end` | 随书写方向的「行首/行尾」对齐——**优于** `left`/`right`，天然支持 RTL |
| `left` / `right` | 物理左/右对齐 |
| `center` | 居中 |
| `justify` | 两端对齐：拉伸词间距让每行（末行除外）顶满两边 |

::: tip `justify` 在西文里要配连字符
西文 `text-align: justify` 靠拉伸**空格**来对齐，长单词会撑出难看的「空隙河流」。配 `hyphens: auto`（自动连字符，见[折行页](./text-overflow-wrap)）允许单词断开，空隙才均匀。中文每字等宽、无词间空格，两端对齐天然平整，不需要连字符。
:::

## `text-indent`：首行缩进

```css
p {
  text-indent: 2em; /* 中文段落首行空两字 */
}
```

`text-indent` 只缩进**首行**，常用于中文「段首空两格」（`2em` 恰好是两个汉字宽）。取负值可做「悬挂缩进」（首行突出、其余缩进）。

## `text-decoration`：下划线与删除线

`text-decoration` 是简写，可一次设线的**位置、样式、颜色、粗细**：

```css
a {
  /* 线型 + 样式 + 颜色 */
  text-decoration: underline dotted #0969da;
}
del {
  text-decoration: line-through;
}

/* 精修：让链接下划线更好看 */
a.fancy {
  text-decoration-line: underline;
  text-decoration-thickness: 2px; /* 线更粗 */
  text-underline-offset: 3px; /* 下划线离文字远一点，不压住字母下沿 */
  text-decoration-color: currentColor;
}
```

| 长属性 | 作用 | 常用值 |
| --- | --- | --- |
| `text-decoration-line` | 线的位置 | `none` / `underline` / `overline` / `line-through` |
| `text-decoration-style` | 线的样式 | `solid` / `double` / `dotted` / `dashed` / `wavy` |
| `text-decoration-color` | 线的颜色 | 任意颜色 / `currentColor` |
| `text-decoration-thickness` | 线的粗细 | `auto` / `2px` / `from-font` |
| `text-underline-offset` | 下划线与文字的距离 | `auto` / `3px` / `0.1em` |

> `wavy` + `text-decoration-color: red` 是很多编辑器「拼写错误红波浪线」的实现方式。

## `text-transform`：大小写转换

```css
.title {
  text-transform: uppercase;
} /* 全大写 */
.name {
  text-transform: capitalize;
} /* 每个单词首字母大写 */
```

| 值 | 效果 |
| --- | --- |
| `uppercase` | 全部大写 |
| `lowercase` | 全部小写 |
| `capitalize` | 每个单词首字母大写 |
| `none` | 不转换（默认） |

::: tip 只改显示，不改源文本
`text-transform` 只影响**渲染**，不改变 DOM 里的实际文本——复制出来、被屏幕阅读器读到的仍是原始大小写。所以「全大写」用它来做（而非把源码写成大写），既保留语义又便于改样式。
:::

## 小结

`line-height` 务必用无单位数（这是本页最该记住的一条）；`letter-spacing` / `word-spacing` 微调疏密；`text-align` 用 `start`/`end` 而非物理方向、两端对齐西文要配连字符；`text-indent` 做中文首行缩进；`text-decoration` 的几个长属性能调出精致下划线；`text-transform` 只改显示不改源文本。这些调的是「正常排开」的文字——下一页处理「排不下」时怎么折行与截断：[截断·折行·断词](./text-overflow-wrap)。
