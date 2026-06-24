---
layout: doc
outline: [2, 3]
---

# transform 与合成层

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- `transform` 改变元素的坐标空间（平移 / 缩放 / 旋转 / 倾斜），**不扰乱文档流**，别的元素不会重排
- 2D 函数：`translate(x,y)` / `translateX` / `translateY`、`scale(x,y)` / `scaleX` / `scaleY`、`rotate(deg)`、`skew(x,y)` / `skewX` / `skewY`
- 3D 函数：`translateZ` / `translate3d`、`scaleZ` / `scale3d`、`rotateX` / `rotateY` / `rotateZ` / `rotate3d`、底层 `matrix()` / `matrix3d()`
- 多函数**从右往左**应用：`transform: translateX(100px) rotate(45deg)` 先转再移
- 独立属性 `translate` / `rotate` / `scale`（**Baseline 2022**）：可单独声明、单独过渡，不互相覆盖
- `transform-origin`：变换基点，默认 `50% 50%`（中心）；可用关键字 `top left` 或长度 / 百分比，3D 加 Z
- 单位：位移用 `px` / `%`（Z 轴只能长度）；缩放用无单位数（`1` = 100%）；角度用 `deg` / `rad` / `grad` / `turn`
- 3D 三件套：父级 `perspective`（景深，越小越夸张）+ `transform-style: preserve-3d`（子元素保持 3D）+ `backface-visibility: hidden`（藏背面）
- `transform` / `opacity` 是**仅有的两个能跑在合成线程**的常用属性——动它们不触发重排 / 重绘，最顺
- `transform` 会创建**新层叠上下文**，并影响 `position: fixed` 子元素的包含块

## transform 是什么：不动布局的变换

`transform` 在元素**渲染时**对它做几何变换，但**不改变它在文档流里占的位置**——周围元素不会因此重排。这正是它适合做动画的根本原因：

```css
.box {
  transform: translateX(100px) scale(1.2); /* 右移并放大，但原位置仍被「占着」 */
}
```

对比之下，改 `left: 100px` / `width` 会触发重排（layout），`transform` 不会。

## 2D 变换函数

### 平移 `translate`

沿轴移动元素；接受 `<length>` 或 `<percentage>`（**百分比相对元素自身尺寸**，这点常用于居中）：

| 函数 | 作用 |
| --- | --- |
| `translateX(100px)` | 沿 X 移 |
| `translateY(-50%)` | 沿 Y 移（百分比相对自身高） |
| `translate(50px, 20px)` | 同时 X / Y |

经典居中技巧就靠「百分比相对自身」：

```css
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 把自身中心对齐到定位点 */
}
```

### 缩放 `scale`

无单位数，`1` = 原始尺寸、`2` = 两倍、`0.5` = 一半，负值会翻转：

```css
.box {
  transform: scale(1.5); /* 等比放大 1.5 倍 */
}
.flip {
  transform: scaleX(-1); /* X 翻转 = 水平镜像 */
}
```

`scale(x, y)` 可两轴不同比例；`scaleX` / `scaleY` 单轴。

### 旋转 `rotate`

绕基点旋转，单位 `deg`（度）/ `rad`（弧度）/ `grad`（百分度）/ `turn`（圈，`1turn = 360deg`）：

```css
.icon {
  transform: rotate(45deg);
}
.half {
  transform: rotate(0.5turn); /* = 180deg */
}
```

### 倾斜 `skew`

让元素沿轴「错切」成平行四边形，单位为角度：

```css
.box {
  transform: skewX(10deg); /* 沿 X 倾斜 10 度 */
}
```

注意：**没有 3D 的 skew、也没有独立 `skew` 属性**（只能写在 `transform` 里）。

## 多函数的顺序：从右往左

一个 `transform` 里写多个函数，它们**按从右到左**的顺序依次作用（等价于矩阵右乘）：

```css
/* 先 rotate(45deg)，再在旋转后的坐标系里 translateX */
.a {
  transform: translateX(100px) rotate(45deg);
}

/* 与上面结果不同：先平移，再绕原点旋转 */
.b {
  transform: rotate(45deg) translateX(100px);
}
```

顺序不同结果迥异——`.a` 是「原地转 45° 后沿新 X 轴右移」，`.b` 是「先右移 100px 再绕原点转」，后者会画出一段弧。记不住时：**靠近元素（最右）的先生效**。

## 独立变换属性：`translate` / `rotate` / `scale`（Baseline 2022）

现代 CSS 允许把三种最常用变换拆成**独立属性**，自 2022 年 8 月起 Baseline 广泛可用：

```css
.box {
  translate: 100px 20px;
  rotate: 45deg;
  scale: 1.2;
}
```

它们的好处：

- **可分别过渡 / 动画**——比如只让 `scale` 在 hover 时变、`rotate` 由另一段动画驱动，互不干扰；
- **不互相覆盖**——用 `transform` 简写时，写两次后者会整个覆盖前者；拆成独立属性就没这问题；
- 可读性更好。

它们的**应用顺序固定**为 `translate → rotate → scale`，再叠加 `transform` 属性（若同时存在，`transform` 在它们之后应用）。需要 `skew` 或精确控制组合顺序时，仍用 `transform` 简写。

## `transform-origin`：变换基点

所有变换默认绕元素**中心**（`50% 50%`）进行。`transform-origin` 改这个基点：

```css
.fan {
  rotate: 90deg;
  transform-origin: bottom left; /* 绕左下角转，像扇子展开 */
}
```

取值：X 用 `left` / `center` / `right` / 长度 / 百分比，Y 用 `top` / `center` / `bottom` / 长度 / 百分比，3D 可再加一个 Z 长度。改基点对 `rotate` / `scale` 影响最直观（`translate` 不受其影响）。

## 3D 变换：透视、保持与背面

2D 函数加上 Z 轴就进入 3D。要让 3D 看起来「有立体感」，需要三件套配合。

### `perspective`：景深

定义观察者到屏幕（z=0 平面）的距离。**值越小，透视越夸张**（近大远小越明显）；写在**父容器**上：

```css
.scene {
  perspective: 600px; /* 给子元素一个观察距离 */
}
.card {
  transform: rotateY(45deg); /* 子元素绕 Y 轴转，因父级有 perspective 而显出纵深 */
}
```

也可作为函数写在元素自己的 `transform` 里：`transform: perspective(600px) rotateY(45deg)`。`perspective-origin` 则决定「灭点」位置（默认中心）。

### `transform-style: preserve-3d`：让子元素活在 3D 里

默认 `flat`，子元素会被**压平**到父级平面。要构建嵌套的 3D 结构（如立方体六面），父级须设 `preserve-3d`：

```css
.cube {
  transform-style: preserve-3d; /* 子面保留各自的 3D 位置，不被压平 */
}
```

### `backface-visibility: hidden`：藏起背面

元素转到背朝观察者时，默认仍可见（`visible`，看到的是镜像）。翻牌效果需要把背面藏起来：

```css
.face {
  backface-visibility: hidden; /* 背朝时不显示，翻牌才干净 */
}
```

### 3D 翻牌最小例

```css
.scene {
  perspective: 800px;
}
.card {
  transition: transform 600ms ease;
  transform-style: preserve-3d;
}
.card:hover {
  transform: rotateY(180deg); /* 悬停翻面 */
}
.card .front,
.card .back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden; /* 各自只在正对时可见 */
}
.card .back {
  transform: rotateY(180deg); /* 背面预先翻好，翻牌后正对观察者 */
}
```

## 为什么 transform 能上「合成层」

浏览器渲染分几个阶段：**布局（layout）→ 绘制（paint）→ 合成（composite）**。

- 改 `width` / `top` / `margin` → 从 **layout** 重来，整页可能重排，最慢；
- 改 `background` / `color` → 从 **paint** 重来，要重绘像素；
- 改 `transform` / `opacity` → 可只在 **合成** 阶段处理：元素被提升为独立的**合成层（compositor layer）**，由 GPU 直接平移 / 缩放 / 调透明度，**不重排也不重绘**。

这就是「动画只动 `transform` / `opacity`」这条铁律的由来——它们能跑在**合成线程**上，即便主线程繁忙也能维持 60fps。如何主动提示浏览器提层（`will-change`）、提层的代价，见 [动画性能与无障碍](./animation-performance)。

::: warning transform 的两个「副作用」
- **创建层叠上下文**：设了 `transform`（非 `none`）的元素会形成新的层叠上下文，其内部 `z-index` 自成一套；
- **改变 `fixed` 的包含块**：祖先一旦有 `transform`，后代的 `position: fixed` 会相对**该祖先**而非视口定位——这是「fixed 元素莫名其妙跟着滚」的常见原因。
:::

## 只有「可变换元素」能被变换

`transform` 只对受 CSS 盒模型支配的元素生效。**非替换的行内元素**（如未改 `display` 的 `<span>`）、`table-column` / `table-column-group` 盒**不能**被变换——需要时先给它 `display: inline-block` / `block`。

## 小结

`transform` 用 `translate` / `scale` / `rotate` / `skew`（及 3D 版本）做不扰乱布局的几何变换，多函数从右往左叠；独立属性 `translate` / `rotate` / `scale`（Baseline 2022）能分别过渡、互不覆盖；3D 靠 `perspective` + `preserve-3d` + `backface-visibility` 三件套；而它最大的价值是能与 `opacity` 一起跑在**合成层**上，是高性能动画的基石。接下来换一类「像素级」视觉效果——下一页讲 [滤镜·混合·裁剪](./filters-blend-clip)。
