---
layout: doc
outline: [2, 3]
---

# 参考

> PptxGenJS（`pptxgenjs`）常用 API、元素选项、枚举与输出方式速查。版本基线 **4.0.1**。自定义十六进制颜色使用**不带 `#` 的 6 位值**；坐标尺寸默认**英寸**，也可用百分比字符串。

## 速查

- 对象模型：`new pptxgen()` → `pres.addSlide()` → `slide.addText/addImage/addChart/...`
- 位置尺寸：`x/y/w/h` 用英寸或百分比；`fontSize` 用 pt；十六进制颜色不带 `#`
- 布局：`pres.layout = 'LAYOUT_WIDE'`；母版：`defineSlideMaster` + `addSlide({ masterName })`
- 图表：数据为 `[{ name, labels, values }]`；竖柱是 `ChartType.bar + barDir:'col'`
- 输出文件：`await pres.writeFile({ fileName:'out.pptx' })`；`4.0.1` 不要无参调用
- 输出数据：`await pres.write({ outputType:'nodebuffer'|'blob'|... })`
- `stream()` 在 Node `4.0.1` 返回 `Promise<Buffer>`，**不是** Node `Readable`
- 边界：只能生成新 PPTX，不能加载、解析或修改既有 PPTX

## 一、演示文稿（Presentation）级 API

| 成员 | 作用 | 备注 |
|---|---|---|
| `new pptxgen()` | 创建演示文稿实例 | 默认导出是类；浏览器全局名 `PptxGenJS` |
| `pres.addSlide(opts?)` | 新增并返回一张幻灯片 | `opts`：`{ masterName }` / `{ sectionTitle }` |
| `pres.defineSlideMaster(opts)` | 定义可复用母版 | `opts.title` 为母版唯一名 |
| `pres.defineLayout(opts)` | 注册自定义尺寸 | `{ name, width, height }`（数字英寸） |
| `pres.layout = '...'` | 设置幻灯片尺寸 | 赋布局常量名或自定义名（字符串） |
| `pres.addSection(opts)` | 新建节 | `{ title }`；`addSlide({ sectionTitle })` 归入 |
| `pres.tableToSlides(eleId, opts?)` | HTML 表格 → 幻灯片 | 参数是元素 **id 字符串**；浏览器环境；返回 void |
| `pres.writeFile(opts)` | 写盘(Node)/下载(浏览器) | 返回 `Promise<string>`；4.0.1 显式传 `{ fileName, compression? }` |
| `pres.write(opts?)` | 拿数据 | 返回 Promise；`{ outputType, compression }` |
| `pres.stream(opts?)` | Node 二进制输出 | 4.0.1 返回 `Promise<Buffer>`，不是 `Readable` |

### 元数据（直接属性赋值）

| 属性 | 类型 | 含义 |
|---|---|---|
| `pres.author` | string | 作者 |
| `pres.company` | string | 公司 |
| `pres.subject` | string | 主题 |
| `pres.title` | string | 标题 |
| `pres.revision` | string | 修订号（字符串） |
| `pres.rtlMode` | boolean | 右到左排版 |
| `pres.theme` | object | 主题字体/语言 |

## 二、内置布局常量（赋给 `pres.layout`）

| 常量 | 尺寸（英寸） | 备注 |
|---|---|---|
| `LAYOUT_16x9` | **10 × 5.625** | 默认 |
| `LAYOUT_16x10` | **10 × 6.25** | |
| `LAYOUT_4x3` | **10 × 7.5** | |
| `LAYOUT_WIDE` | **13.333 × 7.5** | PowerPoint 经典宽屏 |

> 注意是小写 `x`（`16x9`）。自定义：`pres.defineLayout({ name:'CUSTOM', width:13, height:9 })` 后 `pres.layout='CUSTOM'`。

## 三、幻灯片（Slide）级 API

| 方法 | 作用 | 返回 |
|---|---|---|
| `slide.addText(text, opts)` | 文本框 | Slide（链式） |
| `slide.addImage(opts)` | 图片 | Slide |
| `slide.addChart(type, data, opts)` | 图表 | Slide |
| `slide.addTable(rows, opts)` | 表格 | Slide |
| `slide.addShape(shapeType, opts)` | 形状 | Slide |
| `slide.addMedia(opts)` | 音频/视频/YouTube | Slide |
| `slide.addNotes(text)` | 演讲者备注（纯文本） | Slide |
| `slide.background = {...}` | 背景（`{color}`/`{path}`/`{data}`） | — |
| `slide.color = '...'` | 该页默认文本色（hex） | — |

> 所有 `addX()` 都返回 **slide 本身**，可链式 `slide.addText(...).addImage(...)`。

## 四、addText 常用选项

| 选项 | 取值/类型 | 含义 |
|---|---|---|
| `x` / `y` / `w` / `h` | number(英寸) / `'NN%'` | 位置与尺寸 |
| `color` | hex(无 #) | 字色 |
| `fontSize` | number(pt) | 字号 |
| `fontFace` | string | 字体名 |
| `bold` / `italic` / `underline` | boolean | 粗/斜/下划线 |
| `align` | `'left'`/`'center'`/`'right'` | 水平对齐 |
| `valign` | `'top'`/`'middle'`/`'bottom'` | 垂直对齐 |
| `fill` | `{ color }` | 文本框填充 |
| `line` | `{ color, width, dashType }` | 边框线 |
| `bullet` | `true` / `{ type, code, style, indent }` | 项目符号 |
| `indentLevel` | number | 列表缩进层级 |
| `breakLine` | boolean | 数组项后强制换行 |
| `hyperlink` | `{ url }` / `{ slide }` | 超链接（外链/跳页） |
| `shadow` / `glow` / `outline` | object | 文本特效 |
| `fit` | `'none'`/`'shrink'`/`'resize'` | 文本适配框 |
| `shape` | `pres.ShapeType.*` | 带形状底的文本 |

> **text 参数**可为字符串，或文本对象数组 `[{ text, options }]` 做词级混排。垂直居中是 `valign:'middle'`（不是 `'center'`）。

## 五、addImage 常用选项

| 选项 | 类型 | 含义 |
|---|---|---|
| `path` | string | URL/本地路径（与 data 二选一） |
| `data` | string | base64 data URI（`<mime>;base64,...`） |
| `x`/`y`/`w`/`h` | number/`'NN%'` | 位置尺寸 |
| `sizing` | `{ type, w, h, x, y }` | `type`: `'contain'`/`'cover'`/`'crop'` |
| `rounding` | boolean | 裁成圆形 |
| `hyperlink` | `{ url }`/`{ slide }` | 超链接 |
| `rotate` | 0–359 | 旋转 |
| `transparency` | 0–100 | 透明度 |
| `altText` | string | 替代文本 |

## 六、addChart：类型与数据

**图表类型（`pres.ChartType` 枚举键 → 字符串值）**

| 枚举键 | 字符串值 |
|---|---|
| `area` | `'area'` |
| `bar` | `'bar'` |
| `bar3d` | **`'bar3D'`** |
| `bubble` | `'bubble'` |
| `bubble3d` | **`'bubble3D'`** |
| `doughnut` | `'doughnut'` |
| `line` | `'line'` |
| `pie` | `'pie'` |
| `radar` | `'radar'` |
| `scatter` | `'scatter'` |

> 也可用大写便捷别名 `pres.charts.BAR`/`LINE`/`PIE` 等。**没有 `column` 类型**：竖直柱是 `bar` + `barDir:'col'`。注意 `bar3d`（键，小写 d）的值是 `'bar3D'`（大写 D）。

**数据格式**：系列数组 `[{ name, labels, values }]`。

**组合图**：首参传数组 `addChart([{type,data,options}, ...], options)`。

**常用选项**

| 选项 | 取值 | 含义 |
|---|---|---|
| `barDir` | `'col'`/`'bar'` | 竖直柱/水平条 |
| `barGrouping` | `'clustered'`/`'stacked'`/`'percentStacked'` | 分组方式 |
| `chartColors` | hex 数组(无 #) | 系列配色 |
| `showTitle` / `title` | boolean / string | 标题 |
| `showLegend` / `legendPos` | boolean / `'b'/'t'/'l'/'r'/'tr'` | 图例 |
| `showValue` | boolean | 显示数值 |
| `showPercent` | boolean | 显示百分比（饼/环） |
| `holeSize` | number | 环图中孔大小 |
| `catAxisTitle` / `valAxisTitle` | string | 坐标轴标题 |

## 七、addTable：行与单元格

- `rows`：行数组，每行是单元格数组；单元格为字符串或 `{ text, options }`。
- 单元格 `options`：`colspan` / `rowspan` / `fill` / `color` / `border` / `align` / `valign` / `margin`。
- `border`：单对象 `{ type, pt, color }`（四边一致），或 4 元素数组（顺序 **上右下左 TRBL**）。

**表格级选项**

| 选项 | 默认 | 含义 |
|---|---|---|
| `autoPage` | `false` | 超长时自动续到新幻灯片 |
| `autoPageRepeatHeader` | `false` | 每页重复表头 |
| `autoPageHeaderRows` | `1` | 表头行数 |
| `colW` | — | 列宽（数字或数组） |

## 八、addShape / 形状

- `slide.addShape(pres.ShapeType.rect, opts)`；枚举键为**小驼峰**：`rect`/`roundRect`/`ellipse`/`line`/`triangle`/`chevron`/`diamond`/`cloud`/`star5`…（圆/椭圆是 `ellipse`，无 `circle`）。
- 也可用大写别名 `pres.shapes.RECTANGLE`/`OVAL`/`ROUNDED_RECTANGLE`。
- `fill`：`{ color }` 或 `{ type:'solid', color, transparency }`。
- `line`：`{ color, width, dashType, beginArrowType, endArrowType }`。
- 形状内写字：用 `addText` 的 `shape` 选项。

## 九、输出（全部异步，返回 Promise）

| 方法 | 作用 | 关键参数 |
|---|---|---|
| `writeFile({ fileName, compression })` | Node 写盘 / 浏览器下载 | resolve 为文件名 |
| `write({ outputType, compression })` | 拿数据 | 见下方 outputType |
| `stream({ compression })` | Node Buffer | 名称虽为 stream，但 4.0.1 不返回 `Readable` |

**`outputType` 合法值（全小写）**：`'arraybuffer'`、`'base64'`、`'binarystring'`、`'blob'`（默认）、`'nodebuffer'`、`'uint8array'`。

> 注意大小写：是 `'nodebuffer'`（非 `'buffer'`/`'nodeBuffer'`）、`'arraybuffer'`（非 `'arrayBuffer'`）。`compression: true` 启用 ZIP DEFLATE 压缩减小体积。

> 服务端通常直接用 `write({ outputType:'nodebuffer' })`。`stream()` 在 4.0.1 发布包中同样解析为 Buffer；若框架必须接收可管道流，可用 `Readable.from([buffer])` 包装。

## 十、母版（defineSlideMaster）

```ts
pres.defineSlideMaster({
  title: 'MASTER_SLIDE',                 // 母版唯一名（必填）
  background: { color: 'FFFFFF' },       // 背景：{color}/{path}/{data}
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.75, fill: { color: 'F1F1F1' } } },
    { text: { text: 'Title', options: { x: 0.5, y: 0.2, fontSize: 18 } } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 1.5, w: 12, h: 5 }, text: '(placeholder)' } },
  ],
  slideNumber: { x: 0.3, y: '95%', color: '999999' },
});

// 套用：addSlide 的字段名是 masterName
const slide = pres.addSlide({ masterName: 'MASTER_SLIDE' });
```

> 占位符 `type` 合法值：`title` / `body` / `image` / `chart` / `table` / `media`。

## 十一、颜色：SchemeColor（主题色）

除 hex 外，可用 `pres.SchemeColor`：`text1`('tx1')、`background1`('bg1')、`accent1`..`accent6`，随主题变化。

```ts
slide.addText('随主题变色', { color: pres.SchemeColor.accent1, x: 1, y: 1, w: 4, h: 1 });
```

---

速查完毕，进 [指南 · 基础](./guide-line/base) 理解对象模型，或 [指南 · 专家](./guide-line/expert) 看母版/服务端/只生成不解析的边界。
