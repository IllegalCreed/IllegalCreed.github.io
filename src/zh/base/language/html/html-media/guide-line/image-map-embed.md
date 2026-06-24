---
layout: doc
outline: [2, 3]
---

# 图像映射与 object / embed

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 图像映射 = 一张图上划出多块可点击区域，`<img usemap="#名字">` 关联 `<map name="名字">`，内含多个 `<area>`
- `<area shape coords href alt>`：`shape` 取 `rect` / `circle` / `poly` / `default`，`coords` 按形状给坐标，有 `href` 时 `alt` **必写**
- `coords` 格式：`rect`=`x1,y1,x2,y2`；`circle`=`x,y,半径`；`poly`=`x1,y1,x2,y2,...`（多边形顶点）
- 图像映射键盘 / 读屏可用性弱，现代更推荐**绝对定位的 `<a>` 叠层**或 **SVG + 可聚焦链接**
- `<object data type>`：嵌外部资源（PDF / SVG / 视频 / 图片），标签间内容作**加载失败兜底**
- `<embed src type>`：**空元素、无兜底**，原为插件设计，现基本被 `<video>` / `<img>` / `<iframe>` 取代
- 三者取舍：嵌完整页面用 `<iframe>`，嵌带兜底的资源用 `<object>`，`<embed>` 仅历史遗留
- SVG 四种用法：`<img src=".svg">`、CSS `background`、`<object data=".svg">`、**内联 `<svg>`**（可被 CSS / JS 操作）
- 内联 SVG 适合图标 / 可交互图形；MathML 用 `<math>` 内联排版数学公式（现代浏览器原生支持）

## 图像映射：一张图、多个热区

「图像映射」（image map）让你在**同一张图**上划出多个形状各异的可点击区域，各自链向不同地址——经典用法是一张地图 / 信息图上的多个热点。它由两部分组成：`<img>` 用 `usemap` 引用一个 `<map>`，`<map>` 里放若干 `<area>` 定义热区。

```html
<map name="infographic">
  <area
    shape="poly"
    coords="130,147,200,107,254,219,130,228"
    href="https://developer.mozilla.org/docs/Web/HTML"
    alt="HTML 部分" />
  <area
    shape="circle"
    coords="75,75,40"
    href="https://developer.mozilla.org/docs/Web/CSS"
    alt="CSS 部分" />
  <area
    shape="rect"
    coords="10,10,90,50"
    href="https://developer.mozilla.org/docs/Web/JavaScript"
    alt="JavaScript 部分" />
</map>

<img usemap="#infographic" src="info.png" alt="三大语言信息图" width="260" height="240" />
```

### `<map>` 与 `usemap` 的关联

`<map name>` 给映射起名，`<img usemap="#名字">` 据此引用（`#` 前缀必带）。`name` 必须非空、无空格，且与同文档内其他 `<map>` 不重名；若同时写了 `id`，两者的值须一致。

### `<area>`：定义每块热区

| 属性 | 说明 |
| --- | --- |
| `shape` | 区域形状：`rect`（矩形）/ `circle`（圆）/ `poly`（多边形）/ `default`（整张图） |
| `coords` | 坐标（随 `shape` 而异，见下） |
| `href` | 点击跳转的地址 |
| `alt` | 替代文字——**有 `href` 时必写**（无障碍，读屏据此朗读热区用途） |
| `target` | 打开方式（`_blank` 等） |
| `download` / `rel` | 同 `<a>`：标记下载 / 声明关系 |

`coords` 的坐标格式（单位为图内像素，原点在左上角）：

| `shape` | `coords` 格式 | 含义 |
| --- | --- | --- |
| `rect` | `x1,y1,x2,y2` | 左上角、右下角两点 |
| `circle` | `x,y,r` | 圆心坐标 + 半径 |
| `poly` | `x1,y1,x2,y2,x3,y3,…` | 依次连接的各顶点 |
| `default` | 无 | 整张图（其余热区未命中时的兜底） |

::: warning 图像映射的可用性短板
图像映射的**键盘导航与读屏支持都较弱**，坐标也写死在像素上、图一缩放就错位。现代实践更推荐两种替代：① 用**绝对定位的 `<a>` 叠层**盖在图上（天然可聚焦、可缩放）；② 用 **SVG**——把热区做成 SVG 内的 `<a>` 链接，既矢量缩放又无障碍。`<area>` 仍可用，但新项目优先考虑这两条路。
:::

## `<object>`：带兜底的资源嵌入

`<object>` 把一份外部资源当作图像 / 嵌套浏览上下文 / 由插件处理的资源嵌进来——可放 PDF、SVG、视频、图片等。它最大的特点是**标签之间的内容会在资源加载失败时兜底**：

```html
<object type="image/svg+xml" data="diagram.svg" width="600" height="400">
  <!-- SVG 加载失败时，退而显示一张 PNG -->
  <img src="diagram.png" alt="架构图" />
</object>
```

| 属性 | 说明 |
| --- | --- |
| `data` | 资源地址（URL）；`data` 与 `type` **至少有一个** |
| `type` | 资源的 MIME 类型 |
| `width` / `height` | 显示尺寸（CSS 像素） |
| `name` | 浏览上下文名 |
| `form` | 关联某个 `<form>`（按其 `id`） |

常见场景是内嵌 PDF 预览：

```html
<object type="application/pdf" data="report.pdf" width="100%" height="600">
  <p>无法显示 PDF，请 <a href="report.pdf">下载查看</a>。</p>
</object>
```

## `<embed>`：空元素、无兜底

`<embed>` 在指定位置嵌入外部内容，最初为浏览器**插件**设计：

```html
<embed type="image/jpeg" src="photo.jpg" width="250" height="200" />
```

| 属性 | 说明 |
| --- | --- |
| `src` | 资源地址 |
| `type` | 选用哪个处理器 / 插件的 MIME 类型 |
| `width` / `height` | 显示尺寸（CSS 像素，绝对值，不接受百分比） |

它是**空元素**（无闭合标签），因此**不能写兜底内容**（这点与 `<object>` 相反）。由于现代浏览器普遍移除了插件支持，`<embed>` 基本属于历史遗留，新项目应改用 `<video>` / `<audio>` / `<img>` / `<iframe>`。

## `<iframe>` / `<object>` / `<embed>` 怎么选

| 元素 | 用途 | 兜底 | 何时用 |
| --- | --- | --- | --- |
| `<iframe>` | 嵌入完整的另一个 HTML 文档 | 标签间文字 | 嵌网页 / 跨域内容（见 [上一页](./iframe-embedding)） |
| `<object>` | 嵌外部资源（PDF / SVG / 视频…） | **支持**（标签间内容） | 要兜底回退的资源嵌入 |
| `<embed>` | 嵌插件 / 外部内容 | **不支持** | 基本不用，历史遗留 |

一句话：**嵌页面用 `<iframe>`，嵌带兜底的资源用 `<object>`，`<embed>` 几乎不再需要**。

## 内联 SVG：图标与可交互图形

SVG 是矢量图，无限缩放都清晰，最适合图标 / Logo / 图表。把 `<svg>` **直接内联进 HTML**，它就成了文档的一部分，可被 CSS 改色、被 JS 操作（绑事件、改形状）：

```html
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e0f2fe" />
  <circle cx="60" cy="60" r="40" fill="#0284c7" />
  <text x="60" y="68" font-size="28" text-anchor="middle" fill="#fff">SVG</text>
</svg>
```

`viewBox` 定义内部坐标系（让图形按比例缩放），里面用 `rect` / `circle` / `path` / `text` 等绘制。SVG 在 HTML 里共有**四种用法**，按需选：

| 用法 | 写法 | 特点 |
| --- | --- | --- |
| 当图片 | `<img src="icon.svg" alt="…">` | 简单、可缓存；但**不能**用外部 CSS / JS 改其内部 |
| CSS 背景 | `background-image: url("icon.svg")` | 纯装饰用 |
| `<object>` | `<object data="icon.svg" type="image/svg+xml">` | 可独立交互、带兜底 |
| **内联 `<svg>`** | 直接写 `<svg>…</svg>` | **可被 CSS 改色、被 JS 操作**，适合图标系统 / 可交互图形 |

## 内联 MathML：排版数学公式

数学公式用 **MathML**（`<math>` 元素）内联排版，现代浏览器原生支持，无需图片或第三方库：

```html
<p>
  二次方程求根公式：
  <math>
    <mi>x</mi>
    <mo>=</mo>
    <mfrac>
      <mrow>
        <mo>-</mo><mi>b</mi><mo>±</mo>
        <msqrt><mrow><msup><mi>b</mi><mn>2</mn></msup><mo>-</mo><mn>4</mn><mi>a</mi><mi>c</mi></mrow></msqrt>
      </mrow>
      <mrow><mn>2</mn><mi>a</mi></mrow>
    </mfrac>
  </math>
</p>
```

`<math>` 里用 `<mi>`（标识符）、`<mo>`（运算符）、`<mn>`（数字）、`<mfrac>`（分式）、`<msqrt>`（根号）、`<msup>`（上标）等元素描述公式结构，浏览器据此排出规范的数学版式——比贴图更可访问、可选中、可缩放。

## 小结

图像映射（`<map>` / `<area>`）能在一张图上划多个热区，但可用性弱、现代多用 `<a>` 叠层或 SVG 替代；`<object>` 嵌带兜底的资源、`<embed>` 已是历史遗留；SVG 优先内联以便 CSS / JS 操作，公式用 MathML 内联。至此本叶的元素全部讲完——把这些速查与对照表汇总到一处，见 [参考](../reference)。
