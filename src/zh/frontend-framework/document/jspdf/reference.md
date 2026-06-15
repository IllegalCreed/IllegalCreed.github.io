---
layout: doc
outline: [2, 3]
---

# 参考

> jsPDF 常用 API、构造选项、绘图/文字/字体/导出方法与 `jspdf-autotable` 速查。版本基线 **4.x**。

## 一、构造器选项（new jsPDF(options)）

| 选项 | 类型 | 默认 | 含义 |
|---|---|---|---|
| `orientation` | string | `'portrait'` | 首页方向：`'portrait'`/`'landscape'`（简写 `'p'`/`'l'`） |
| `unit` | string | `'mm'` | 坐标/尺寸单位：`'pt'`/`'mm'`/`'cm'`/`'m'`/`'in'`/`'px'` |
| `format` | string \| number[] | `'a4'` | 页面尺寸：预设名（a0-a10/b…/letter/legal/dl…）或 `[w, h]` |
| `compress` | boolean | `false` | 压缩内容流（FlateDecode），减小体积 |
| `putOnlyUsedFonts` | boolean | `false` | 只嵌入实际用到的字体（瘦身，尤其中文场景） |
| `precision` | number | `2` | 元素坐标精度 |
| `userUnit` | number | `1.0` | 自定义单位缩放因子 |

> ⚠️ `setFontSize` 的字号始终以 **pt** 计，不随 `unit` 改变。

## 二、文字

| 方法 | 签名 | 说明 |
|---|---|---|
| `text` | `text(text, x, y, options?)` | 绘制文字；`options.align` 取 `'left'`/`'center'`/`'right'`/`'justify'`（以 x 为基准） |
| `setFontSize` | `setFontSize(size)` | 设字号（pt） |
| `setFont` | `setFont(fontName, fontStyle?)` | 切换字体族与样式 |
| `setTextColor` | `setTextColor(r, g, b)` | 文字颜色（也接受灰度/十六进制） |
| `setCharSpace` | `setCharSpace(n)` | 字符间距 |
| `setLineHeightFactor` | `setLineHeightFactor(f)` | 行高因子 |
| `splitTextToSize` | `splitTextToSize(text, maxWidth)` | 按宽度把长文本切成行数组（用于换行） |
| `getTextWidth` | `getTextWidth(text)` | 测量文本宽度（当前单位） |
| `textWithLink` | `textWithLink(text, x, y, { url })` | 画带超链接的文字 |

> `text` **不自动换行**：长段落先 `splitTextToSize` 切成数组再传给 `text`。

## 三、绘图（图形）

| 方法 | 签名 | 说明 |
|---|---|---|
| `line` | `line(x1, y1, x2, y2)` | 直线 |
| `rect` | `rect(x, y, w, h, style?)` | 矩形 |
| `roundedRect` | `roundedRect(x, y, w, h, rx, ry, style?)` | 圆角矩形 |
| `circle` | `circle(x, y, r, style?)` | 正圆 |
| `ellipse` | `ellipse(x, y, rx, ry, style?)` | 椭圆 |
| `triangle` | `triangle(x1, y1, x2, y2, x3, y3, style?)` | 三角形 |
| `lines` | `lines(lines, x, y, scale?, style?, closed?)` | 折线/路径 |

**style 取值**：`'S'` 只描边 / `'F'` 只填充 / `'FD'`(`'DF'`) 填充+描边 / 不传默认 `'S'`。

| 状态方法 | 说明 |
|---|---|
| `setDrawColor(r,g,b)` | 描边/线条颜色 |
| `setFillColor(r,g,b)` | 图形填充颜色 |
| `setLineWidth(w)` | 线宽/描边粗细（当前单位） |
| `setLineDashPattern(arr, phase)` | 虚线样式 |

## 四、图片

```ts
addImage(imageData, format, x, y, w, h, alias?, compression?, rotation?)
```

| 参数 | 说明 |
|---|---|
| `imageData` | Base64 DataURL 字符串 / `HTMLImageElement` / `HTMLCanvasElement` / `Uint8Array` |
| `format` | 格式提示，如 `'PNG'`/`'JPEG'`/`'WEBP'`（自动识别失败时兜底） |
| `x,y,w,h` | 位置与尺寸 |
| `alias` | 图片别名：**多页重复同图时传相同 alias 可复用、避免重复嵌入** |
| `compression` | `'NONE'`/`'FAST'`/`'MEDIUM'`/`'SLOW'`（越往后压得越狠） |
| `rotation` | 旋转角度（0-359） |

> SVG **不被 addImage 直接支持**：矢量用 `svg2pdf.js`（`doc.svg()`），栅格化可用 canvg 先画到 canvas。

## 五、字体（中文/UTF-8）

| 方法 | 签名 | 说明 |
|---|---|---|
| `addFileToVFS` | `addFileToVFS(fileName, base64)` | 把字体文件放进虚拟文件系统（VFS） |
| `addFont` | `addFont(postScriptName, id, fontStyle)` | 注册字体（VFS 名, 族名, 样式） |
| `setFont` | `setFont(id, fontStyle?)` | 切换为该字体 |
| `getFontList` | `getFontList()` | 列出已注册字体 |

- **标准 14 字体**（helvetica/times/courier 的常规/bold/italic/bolditalic）开箱即用，但**仅 ASCII**。
- `fontStyle` 典型取值：`'normal'`/`'bold'`/`'italic'`/`'bolditalic'`；要加粗需把粗体 TTF 用对应 fontStyle 单独 `addFont`。

## 六、多页与页面

| 方法 | 说明 |
|---|---|
| `addPage(format?, orientation?)` | 新增一页并切到新页 |
| `setPage(n)` | 切换当前页（1 基） |
| `getNumberOfPages()` | 总页数 |
| `deletePage(n)` | 删除某页 |
| `insertPage(n)` | 在第 n 页前插入页 |
| `internal.pageSize.getWidth()/getHeight()` | 当前页宽/高（当前单位）；便捷别名 `getPageWidth()`/`getPageHeight()` |

## 七、导出（save / output）

| 调用 | 返回/行为 |
|---|---|
| `save(filename, options?)` | 下载（浏览器）/写盘（Node）；= `output('save', filename)`；`{ returnPromise: true }` 返回 Promise |
| `output()` | 原始 PDF body 字符串（type 未定义时） |
| `output('arraybuffer')` | `ArrayBuffer` |
| `output('blob')` | `Blob` |
| `output('bloburl')`（别名 `'bloburi'`） | `blob:` 对象 URL（iframe 预览） |
| `output('datauristring')`（别名 `'dataurlstring'`） | `data:` 开头字符串 |
| `output('datauri')` / `output('dataurlnewwindow')` | 导航/新窗口打开 |

## 八、元数据与模式

| 方法 | 说明 |
|---|---|
| `setDocumentProperties({ title, subject, author, keywords, creator })` | 设文档属性（旧别名 `setProperties`） |
| `advancedAPI(cb?)` | 切高级模式：变换矩阵、Pattern、FormObject（svg2pdf 依赖） |
| `compatAPI(cb?)` | 切回兼容模式（默认） |

## 九、jspdf-autotable（表格插件）

```ts
import { autoTable } from 'jspdf-autotable';
autoTable(doc, { head: [['ID', 'Name']], body: [[1, '张三']] });
```

| 选项 | 说明 |
|---|---|
| `head` / `body` / `foot` | 表头/数据/表尾，二维数组 |
| `columns` | 列定义 `[{ header, dataKey }]`（配合对象数组数据） |
| `html` | CSS 选择器或 `<table>` 元素，直接读 DOM 表生成（仍是矢量文字） |
| `startY` | 表格起始 Y；衔接用 `doc.lastAutoTable.finalY` |
| `theme` | `'striped'`（默认）/`'grid'`/`'plain'` |
| `styles` / `headStyles` / `bodyStyles` / `columnStyles` | 全局/表头/表体/分列样式 |
| `margin` | 表格外边距 |
| `didParseCell(data)` | 单元格绘制**前**改 `cell.text`/`cell.styles` |
| `didDrawCell(data)` | 单元格画**完**后叠加内容（图片/链接） |
| `didDrawPage(data)` | 每页绘制后（页眉/页脚） |

> 函数式 `autoTable(doc, opts)` 利于 tree-shaking；旧风格 `applyPlugin(jsPDF)` 后用 `doc.autoTable(opts)`。

---

速查完毕，进 [指南 · 基础](./guide-line/base) 理解绘图模型，或 [指南 · 进阶](./guide-line/advanced) 看表格/图片/html() 实战。
