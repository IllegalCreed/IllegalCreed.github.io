---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **4.0.1**。本篇把「会跑」用到「懂模型」：Presentation → Slide → 元素三层结构、坐标与尺寸单位（英寸/百分比）、颜色规则、addText 的混排与项目符号、addImage/addTable/addShape、布局与母版入门。

## 速查

- 三层模型：`Presentation` → `Slide` → 文本/图片/图表/表格/形状/媒体
- `addSlide()` 返回 Slide；`addText/addImage/...` 也返回当前 Slide，可链式调用
- `x/y/w/h` 默认单位是英寸，也可写 `'50%'`；`fontSize` 单位是 pt
- 十六进制颜色写 6 位且不带 `#`；水平居中 `align:'center'`，垂直居中 `valign:'middle'`
- 混排：`addText([{ text, options }, ...], boxOptions)`；列表用 `bullet` / `indentLevel`
- 图片：`path` 或 base64 `data`；缩放裁切用 `sizing.type`
- 表格：二维行数组；单元格可写 `{ text, options }`，合并用 `colspan/rowspan`
- 布局与母版：`pres.layout` / `defineSlideMaster` / `addSlide({ masterName })`

## 一、对象模型：三层结构

PptxGenJS 的一切围绕三层展开：

```text
Presentation（演示文稿，new pptxgen()）
├── 元数据：author / title / company / subject ...
├── layout：幻灯片尺寸（LAYOUT_16x9 / WIDE / 自定义）
├── defineSlideMaster()：母版（可被多页复用）
└── addSlide() → Slide（幻灯片）
                  ├── addText()   文本框
                  ├── addImage()  图片
                  ├── addChart()  图表
                  ├── addTable()  表格
                  ├── addShape()  形状
                  ├── addMedia()  音视频
                  ├── addNotes()  演讲者备注
                  └── background / color  背景与默认字色
```

标准姿势：

```ts
const pres = new pptxgen();       // 顶层演示文稿
const slide = pres.addSlide();    // 一张幻灯片
slide.addText('Hi', { x: 1, y: 1, w: 4, h: 1 }); // 往页上加元素
await pres.writeFile({ fileName: 'a.pptx' });     // 异步输出
```

> `addSlide()` 返回 slide；`addText/addImage/...` 返回 **slide 本身**（可链式）。输出方法返回 **Promise**。

## 二、坐标与尺寸：英寸思维

- **默认单位是英寸**：`{ x: 1, y: 1, w: 8, h: 4 }` = 距左 1″、距顶 1″、宽 8″、高 4″。
- **百分比字符串**：`x: '50%'` 相对幻灯片宽度，`y: '50%'` 相对高度——便于按比例排版。
- **不用 EMU/px**：OOXML 内部是 EMU（914400/英寸），但那不对外，你只写英寸或百分比。

```ts
slide.addText('居中标题', {
  x: '10%', y: '40%', w: '80%', h: '20%', // 全用百分比 → 自适应不同 layout
  align: 'center', fontSize: 32,
});
```

> 字号 `fontSize` 的单位是**磅(pt)**，与坐标的英寸是两码事，别混。

## 三、十六进制颜色：不带 `#`

显式 HEX 颜色（文本 `color`、填充 `fill.color`、边框 `line.color`、图表、背景）使用**6 位十六进制、无 `#`**：

```ts
slide.addText('红字蓝底', {
  x: 1, y: 1, w: 4, h: 1,
  color: 'FF0000',           // ✅
  fill: { color: '0000FF' }, // ✅
  // color: '#FF0000',       // ❌ 带 # 失效
});
```

> 也可用主题色 `pres.SchemeColor.accent1` 等，随 PowerPoint 主题变化。

## 四、addText：字符串 vs 文本数组

```ts
// 形式一：纯字符串（整段统一样式）
slide.addText('单一样式', { x: 1, y: 1, w: 6, h: 1, fontSize: 18, color: '363636' });

// 形式二：文本对象数组（词级混排）
slide.addText(
  [
    { text: '红色加粗 ', options: { color: 'FF0000', bold: true } },
    { text: '蓝色斜体', options: { color: '0000FF', italic: true } },
  ],
  { x: 1, y: 2, w: 8, h: 1, fontSize: 18 },
);
```

| 形式 | 适用 | 换行 |
|---|---|---|
| 字符串 | 整段同样式 | 用 `\n` 换行 |
| 文本数组 | 逐段不同色/粗斜 | 段后加 `options.breakLine: true` |

## 五、对齐：align 与 valign 别搞反

```ts
slide.addText('居中', {
  x: 1, y: 1, w: 8, h: 2,
  align: 'center',   // 水平：left / center / right
  valign: 'middle',  // 垂直：top / middle / bottom
});
```

::: warning 高频坑
- 垂直居中是 `valign: 'middle'`（**不是** `'center'`）。
- 水平居中是 `align: 'center'`（**不是** `'middle'`）。
- 属性名是全小写 `align`/`valign`，不是 CSS 的 `textAlign`/`verticalAlign`，也不是驼峰 `vAlign`。
:::

## 六、项目符号与列表

```ts
slide.addText(
  [
    { text: '第一项', options: { bullet: true } },
    { text: '第二项', options: { bullet: true } },
    { text: '子项', options: { bullet: true, indentLevel: 1 } }, // 缩进一级
    { text: '有序项', options: { bullet: { type: 'number' } } }, // 编号
    { text: '星号项', options: { bullet: { code: '2605' } } },   // ★ 自定义符号(Unicode)
  ],
  { x: 1, y: 1, w: 6, h: 3 },
);
```

> `bullet: true` 默认圆点；对象形式可定制 `type`('number')、`code`(Unicode 码点)、`style`、`indent`；缩进层级用 `indentLevel`。

## 七、addImage：path 或 data，二选一

```ts
// 来源一：path（浏览器是 URL，Node 是本地路径）
slide.addImage({ path: 'https://cdn.example.com/logo.png', x: 1, y: 1, w: 2, h: 2 });

// 来源二：data（base64 data URI）
slide.addImage({ data: 'image/png;base64,iVBORw0KGgo...', x: 4, y: 1, w: 2, h: 2 });

// 等比放入框不裁切
slide.addImage({ path: 'pic.jpg', x: 1, y: 4, w: 3, h: 2, sizing: { type: 'contain', w: 3, h: 2 } });
```

> `sizing.type`：`'contain'`(完整放入,可留白) / `'cover'`(铺满,裁溢出) / `'crop'`(定区裁切)。`rounding: true` 裁成圆形。

## 八、addTable：二维结构

```ts
slide.addTable(
  [
    ['姓名', '部门', '绩效'],                         // 表头行
    ['张三', '研发', { text: 'A', options: { color: '009900', bold: true } }],
    [{ text: '合计', options: { colspan: 2 } }, '—'], // 跨列合并
  ],
  { x: 0.5, y: 0.5, w: 9, border: { type: 'solid', pt: 1, color: 'CCCCCC' } },
);
```

> 每行是单元格数组，单元格可为字符串或 `{ text, options }`。合并用 `colspan`/`rowspan`。

## 九、addShape 与「形状里写字」

```ts
// 纯形状
slide.addShape(pres.ShapeType.roundRect, {
  x: 1, y: 1, w: 3, h: 1.2,
  fill: { color: '0088CC' },
  line: { color: '004466', width: 2 },
});

// 形状里写字：用 addText 的 shape 选项（一步到位）
slide.addText('点击我', {
  shape: pres.ShapeType.roundRect,
  x: 1, y: 3, w: 3, h: 1,
  fill: { color: '0088CC' }, color: 'FFFFFF', align: 'center',
});
```

> ShapeType 枚举键是**小驼峰**：`rect`/`roundRect`/`ellipse`/`line`/`triangle`…（圆/椭圆是 `ellipse`，没有 `circle`）。

## 十、布局与母版（入门）

```ts
// 设尺寸
pres.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 英寸

// 定义母版并套用
pres.defineSlideMaster({
  title: 'BRAND',
  background: { color: 'FFFFFF' },
  objects: [{ rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: '0088CC' } } }],
});
const slide = pres.addSlide({ masterName: 'BRAND' }); // 字段名是 masterName
```

---

进入 [指南 · 进阶](./advanced)：图表全家桶、多页报告、浏览器下载与 Node 服务端响应、媒体嵌入、超链接与节。
