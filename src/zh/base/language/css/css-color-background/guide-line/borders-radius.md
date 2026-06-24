---
layout: doc
outline: [2, 3]
---

# 边框与圆角

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `border` 简写：`border: 2px solid #ccc`（宽 / 样式 / 色），样式默认 `none`——**不写 style 则边框不显示**
- `border-style`：`solid` / `dashed` / `dotted` / `double` / `groove` / `ridge` / `inset` / `outset` / `none`
- 单边 / 单值：`border-top`、`border-left-color`、`border-width: 1px 2px`（上下 / 左右）等可拆
- `border-radius`：1–4 值对应四角，`border-radius: 10px 5%`（左上右下 / 右上左下）
- 椭圆角：`/` 分隔水平半径 / 垂直半径，`border-radius: 10px / 20px`
- 圆形 `border-radius: 50%`；药丸 `border-radius: 9999px`；百分比按盒宽 / 高算
- `border-image` 简写：`source / slice / width / outset repeat`，**需 `border-style` 非 none 才显示**
- `border-image-repeat`：`stretch`(默认) / `repeat` / `round`(缩放整铺) / `space`(留缝)；`fill` 关键字保留中心区
- 渐变可当边框：`border-image: linear-gradient(red, blue) 1`（注意 `border-radius` 对其无效）

## `border`：宽、样式、颜色

```css
border: 2px solid #ccc; /* 简写：宽度 + 样式 + 颜色 */
```

`border` 是三个属性的简写——`border-width`、`border-style`、`border-color`。其中 **`border-style` 默认是 `none`**，所以只写宽度和颜色、漏了样式，边框根本不显示：

```css
border: 2px #ccc; /* ❌ 没有 style，看不见 */
border: 2px solid #ccc; /* ✅ */
```

### `border-style` 取值

| 值 | 效果 |
| --- | --- |
| `solid` | 实线（最常用） |
| `dashed` | 虚线 |
| `dotted` | 点线 |
| `double` | 双实线 |
| `groove` / `ridge` | 3D 凹槽 / 凸脊 |
| `inset` / `outset` | 3D 内凹 / 外凸 |
| `none` / `hidden` | 无边框 |

### 拆分到单边 / 单属性

```css
border-top: 1px solid #eee; /* 只设上边 */
border-bottom-color: tomato; /* 只设下边颜色 */
border-width: 1px 2px 3px 4px; /* 上 右 下 左 */
border-color: red blue; /* 上下红、左右蓝 */
```

每条边、每个维度都能单独控制：方向 `border-{top|right|bottom|left}`，维度 `border-{width|style|color}`，可自由组合。

## `border-radius`：圆角

```css
border-radius: 10px; /* 四角统一 */
border-radius: 10px 5%; /* 左上&右下 | 右上&左下 */
border-radius: 2px 4px 2px; /* 左上 | 右上&左下 | 右下 */
border-radius: 1px 0 3px 4px; /* 左上 | 右上 | 右下 | 左下（顺时针） */
```

1–4 个值按「顺时针从左上角」展开，缺省值对角复用。负值非法。

### 椭圆角：`/` 分隔两半径

斜杠前是**水平半径**、斜杠后是**垂直半径**，各自又可 1–4 值：

```css
border-radius: 10px / 20px; /* 所有角：水平 10、垂直 20（椭圆） */
border-radius: 10px 5% / 20px 30px;
```

`border-radius: 1em / 5em` 等价于给四角都设 `border-top-left-radius: 1em 5em` 这样的「两值」。

### 圆形与药丸

```css
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%; /* 正方形 → 圆形 */
}
.pill {
  border-radius: 9999px; /* 任意宽高 → 两端半圆的药丸 */
}
```

- `50%`：百分比按盒子宽 / 高算，正方形得正圆；
- `9999px`：足够大的固定值让短边方向直接成半圆，是「药丸按钮 / 标签」的惯用法。

::: tip 圆角会裁背景，但默认不裁内容
`border-radius` 会把背景（含背景图）按圆角裁切（裁切边界由 `background-clip` 决定）。但**溢出的子内容**默认不被圆角裁——需要时配 `overflow: hidden`（或 `clip`）让子元素也跟着圆角裁切。
:::

四个长写属性：`border-top-left-radius`、`border-top-right-radius`、`border-bottom-right-radius`、`border-bottom-left-radius`。

## `border-image`：用图片 / 渐变做边框

`border-image` 把一张图按**九宫格**切开铺到边框上，是一个简写：

```css
/* source | slice */
border-image: linear-gradient(red, blue) 27;
/* source | slice | repeat */
border-image: url("/border.png") 27 space;
/* source | slice | width */
border-image: linear-gradient(red, blue) 27 / 35px;
/* source | slice | width | outset | repeat */
border-image: url("/border.png") 27 23 / 50px 30px / 1rem round space;
```

::: warning 必须有 border-style 与 border-width
即便用 `border-image`，也要先给元素设非 `none` 的 `border-style` 和非 `0` 的 `border-width`——否则不少浏览器不渲染边框图。
:::

### 五个长写属性

| 属性 | 作用 |
| --- | --- |
| `border-image-source` | 图源：`url()` / 渐变 / `none` |
| `border-image-slice` | 把图切成 9 块的偏移（1–4 值，`number` / `%`），可加 `fill` 保留中心 |
| `border-image-width` | 边框图宽度（可 `auto`） |
| `border-image-outset` | 向外溢出的距离 |
| `border-image-repeat` | 边缘段铺法：`stretch` / `repeat` / `round` / `space` |

### 九宫格怎么切

`slice` 值把图切成 3×3：**四角**原样不缩放放到四角，**四边**按 `border-image-repeat` 拉伸 / 平铺 / 缩放整铺 / 留缝，**中心**默认丢弃（加 `fill` 才保留并铺到内容区）。

```css
border-image-slice: 30; /* 丢弃中心 */
border-image-slice: 30 fill; /* 保留中心区 */
```

### 渐变边框

渐变是「按需生成的图」，可直接喂给 `border-image`，做出纯色边框做不到的多色 / 渐变描边：

```css
.fancy {
  border: 4px solid; /* 必须有 style 与宽度 */
  border-image: linear-gradient(45deg, #f6b73c, #4d9f0c) 1; /* slice 1 即可铺满 */
}
.striped {
  border: 30px solid;
  border-image: repeating-linear-gradient(45deg, #ff3333, #33bbff, #ff3333 30px) 60;
}
```

::: warning border-image 不吃 border-radius
`border-image` 与 `border-radius` **不兼容**——用了边框图，圆角对边框无效。需要「圆角 + 渐变边框」时，改用「双层背景 + `background-clip`」或 `mask` 等替代方案。
:::

## 小结

`border` 三件套里最容易栽的是「漏写 `border-style` 导致边框消失」；`border-radius` 用 `50%` 出圆、`9999px` 出药丸，斜杠语法做椭圆角；`border-image` 适合把图 / 渐变切成九宫格做花式边框，但要记得它需要 `border-style` 撑场、且不认 `border-radius`。下一页讲让盒子「浮起来」的阴影：[box-shadow 与阴影设计](./box-shadow)。
