---
layout: doc
outline: [2, 3]
---

# 背景全谱

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `background-color`：纯色背景层，初始值 `transparent`（透出父级）
- `background-image`：`url()` / 渐变 / `image-set()`；可逗号叠多层，**先写的在上层**
- `background-repeat`：`repeat`(默认) / `no-repeat` / `repeat-x` / `repeat-y` / `space`(不裁切匀分间隙) / `round`(缩放整铺)
- `background-position`：关键字 `center` / `top right`，或长度 / `%`；可带边偏移 `bottom 20% right 30%`
- `background-size`：`auto`(默认) / `cover`(铺满可裁) / `contain`(完整不裁) / 具体值 `200px auto`
- `background-attachment`：`scroll`(默认随元素) / `fixed`(固定于视口) / `local`(随内容滚)
- `background-origin`：定位起点 `padding-box`(默认) / `border-box` / `content-box`
- `background-clip`：绘制范围 `border-box`(默认) / `padding-box` / `content-box` / **`text`(裁到文字)**
- 简写 `background`：一条写完色 / 图 / 位 / 尺寸 / 重复等，多层用逗号；`/` 分隔 position 与 size
- `background-blend-mode`：多层背景之间的混合模式（`multiply` / `screen` / `overlay`…）

## `background-color`：最底层的纯色

```css
background-color: #0d1117;
background-color: oklch(97% 0.02 264);
background-color: transparent; /* 初始值，透出父级内容 */
```

纯色层永远在所有背景图之下。初始值 `transparent` 意味着不设背景时元素是透明的、能看到父级。

## `background-image`：图片与渐变

```css
background-image: url("/hero.jpg");
background-image: linear-gradient(to right, #6a11cb, #2575fc);
background-image: image-set("hero.avif" type("image/avif"), "hero.jpg" type("image/jpeg"));
```

`background-image` 接 `url()`、各类渐变函数、`image-set()`（按格式 / 分辨率选源）。渐变本质上也是「按需生成的图片」，会被拉伸到铺满可用空间。

### 多层背景：逗号叠加

逗号分隔可叠任意多层，**写在前面的层在上面**（离用户更近）：

```css
.hero {
  background:
    linear-gradient(rgb(0 0 0 / 45%), rgb(0 0 0 / 45%)), /* 上层：压暗蒙版 */
    url("/hero.jpg") center / cover no-repeat; /* 下层：照片 */
}
```

每个背景属性都能给逗号分隔的一组值，逐层对应。这是「图片上压一层渐变蒙版让文字可读」的标准做法。

## `background-repeat`：平铺方式

```css
background-repeat: no-repeat; /* 只画一次 */
background-repeat: repeat-x; /* 只横向铺 */
background-repeat: space; /* 整数次铺、不裁切、均分缝隙 */
background-repeat: round; /* 缩放图片以整数次正好铺满 */
background-repeat: repeat-x no-repeat; /* 两值：分别控 x / y */
```

- `repeat`（默认）：平铺并按需裁切；
- `space`：只放整数张、不裁切，多余空间均分到各张之间；
- `round`：拉伸 / 压缩每张，使其整数次正好铺满。

## `background-position`：放在哪

```css
background-position: center; /* 居中 */
background-position: top right; /* 右上 */
background-position: 20px 40px; /* 左 20、上 40 */
background-position: 50% 25%;
background-position: bottom 20% right 30%; /* 距底 20%、距右 30%（带边偏移） */
```

接关键字（`top`/`bottom`/`left`/`right`/`center`）、长度或百分比。三 / 四值形式可指定「从哪条边偏移多少」，比如 `bottom 20% right 30%` 精确表达「距底 20%、距右 30%」——这是普通两值语法做不到的。

## `background-size`：多大

```css
background-size: cover; /* 铺满容器，超出部分裁掉 */
background-size: contain; /* 完整显示，可能留白 */
background-size: 200px auto; /* 宽 200、高按比例 */
background-size: 100% 100%; /* 拉满（会变形） */
```

- `cover`：缩放到**铺满**整个背景区，多余裁掉（最常用于大图 Banner）；
- `contain`：缩放到**完整放下**，不裁切，可能在某方向留白；
- `auto`：用图片固有尺寸、保持比例。

## `background-attachment`：滚动行为

```css
background-attachment: scroll; /* 默认：随元素一起滚 */
background-attachment: fixed; /* 固定于视口（视差观感） */
background-attachment: local; /* 随元素内容滚动 */
```

`fixed` 让背景相对视口固定，常用来做「视差 / 内容在背景上滑过」的效果（注意移动端支持与性能）。`local` 让背景跟随**可滚动内容**而非元素框。

## `background-origin` 与 `background-clip`

两者都用 `border-box` / `padding-box` / `content-box` 取值，但管的事不同：

- **`background-origin`**：背景**定位的起点坐标系**（`background-position: 0 0` 从哪算）；
- **`background-clip`**：背景**最终绘制 / 裁剪到哪个盒子**。

```css
.card {
  border: 8px dashed rgb(0 0 0 / 30%);
  padding: 16px;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  background-origin: padding-box; /* 从内边距盒开始铺 */
  background-clip: padding-box; /* 不画到边框下面（虚线边能透出底色） */
}
```

### `background-clip: text`：文字渐变

```css
.gradient-text {
  background: linear-gradient(90deg, #6a11cb, #2575fc);
  background-clip: text;
  color: transparent; /* 让背景透过文字显示 */
}
```

`background-clip: text` 把背景裁切到**文字形状**，配合 `color: transparent` 就是经典的「渐变文字」。早期需 `-webkit-background-clip: text` 前缀，现代浏览器已普遍支持标准写法（保留前缀更稳）。

## `background` 简写

一条简写可包含颜色、图片、位置、尺寸、重复、附着、origin、clip，顺序较自由，但 **position 与 size 之间必须用 `/` 分隔**：

```css
background: #fff url("/bg.png") center / cover no-repeat;
/*          ↑色   ↑图          ↑位置  / ↑尺寸  ↑重复 */
```

多层背景在简写里也用逗号分隔，**颜色只能写在最后一层**：

```css
background:
  url("/top.png") top / 40px no-repeat,
  linear-gradient(#eee, #ccc) /* 这一层兼当底色 */;
```

::: warning 简写会重置未列出的属性
`background` 简写会把没写到的子属性全部**重置为初始值**。如果你之前单独设过 `background-attachment: fixed`，后面又写了不含它的 `background` 简写，`fixed` 会被悄悄重置回 `scroll`。
:::

## `background-blend-mode`：层间混合

```css
.duotone {
  background:
    url("/portrait.jpg") center / cover,
    #2575fc;
  background-blend-mode: luminosity; /* 图片与底色按明度混合 → 单色调效果 */
}
```

`background-blend-mode` 定义**多层背景之间**如何混合（`multiply` / `screen` / `overlay` / `luminosity`…），可做双色调、纹理叠色等效果。它只混背景层之间，不影响元素与下方元素（那是 `mix-blend-mode` 的活）。

## 小结

背景是一组各管一摊的属性：`color` 铺底、`image` 放图 / 渐变、`repeat` / `position` / `size` 管平铺与摆放、`origin` / `clip` 管坐标系与裁剪范围，`background-clip: text` 还能玩渐变文字。多层逗号叠加 + 简写 `/` 分隔是两个最易错的点。下一页讲盒子的「边」：[边框与圆角](./borders-radius)。
