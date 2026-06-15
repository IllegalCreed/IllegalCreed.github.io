---
layout: doc
outline: [2, 3]
---

# 参考

> pdf-lib 常用 API、绘制选项、表单方法、字体与颜色辅助函数速查。版本基线 **1.17.1**。坐标系：原点左下、y 向上、单位 **point**（72pt = 1 英寸）。

## 一、PDFDocument 静态方法

| 方法 | 作用 | 备注 |
|---|---|---|
| `PDFDocument.create(opts?)` | 新建空文档 | 返回 `Promise<PDFDocument>` |
| `PDFDocument.load(input, opts?)` | 载入既有 PDF | input：`Uint8Array`/`ArrayBuffer`/base64 字符串 |

### load 选项（LoadOptions）

| 选项 | 默认 | 含义 |
|---|---|---|
| `ignoreEncryption` | `false` | 加密 PDF 默认抛 `EncryptedPDFError`；设 true 强行解析（**不解密**，结果可能异常） |
| `updateMetadata` | `true` | 保存时是否刷新 ModDate/Producer；设 false 原样保留原元数据 |
| `parseSpeed` | `Slow` | `ParseSpeeds.{Slow,Medium,Fast,Fastest}`，越快越少让出事件循环 |

## 二、PDFDocument 实例方法

### 页面

| 方法 | 作用 |
|---|---|
| `addPage(page?)` | 末尾加页；传 `[w,h]` 指定尺寸，或传 PDFPage |
| `insertPage(i, page?)` | 在索引 i 处插页 |
| `removePage(i)` | 删除索引 i 的页 |
| `getPages()` | 返回 `PDFPage[]` |
| `getPage(i)` / `getPageCount()` | 取单页 / 取页数 |
| `getPageIndices()` | 返回 `[0,1,...,n-1]`，便于复制全部页 |
| `copyPages(srcDoc, indices)` | 跨文档复制页 → 返回属于本文档的 `PDFPage[]`（再 addPage 放入） |

### 嵌入资源

| 方法 | 作用 |
|---|---|
| `embedFont(input, opts?)` | 嵌字体：`StandardFonts` 枚举或 TTF/OTF 字节；opts `{ subset, customName, features }` |
| `embedStandardFont(font, name?)` | 嵌标准 14 字体（无需 fontkit） |
| `embedPng(input)` / `embedJpg(input)` | 嵌图片 → `PDFImage`（input：字节/base64） |
| `embedPdf(input, indices?)` | 嵌入另一 PDF 的若干页 → `PDFEmbeddedPage[]` |
| `embedPage(page)` / `embedPages(pages)` | 把 PDFPage 变为可 drawPage 的嵌入页 |
| `registerFontkit(fontkit)` | 嵌入**自定义**字体前必须先注册 `@pdf-lib/fontkit` |
| `attach(bytes, name, opts)` | 添加文档级附件（opts `{ mimeType, description, creationDate, ... }`） |

### 输出与元数据

| 方法 | 作用 |
|---|---|
| `save(opts?)` | 序列化 → `Promise<Uint8Array>` |
| `saveAsBase64(opts?)` | → base64 字符串；`{ dataUri: true }` 返回完整 data: URI |
| `getForm()` | 取 `PDFForm` |
| `setTitle/setAuthor/setSubject` | 设元数据（字符串） |
| `setKeywords(string[])` | 设关键词（**数组**） |
| `setProducer/setCreator` | 设生成者/创建者 |
| `setCreationDate(Date)` / `setModificationDate(Date)` | 设日期 |
| `getTitle()` / `getAuthor()` … | 读对应元数据 |

### save 选项（SaveOptions）

| 选项 | 默认 | 含义 |
|---|---|---|
| `useObjectStreams` | `true` | 对象流压缩（体积更小，PDF 1.5+）；老旧阅读器不兼容时设 false |
| `addDefaultPage` | `true` | create 的空文档保存时若无页是否补一张 |
| `objectsPerTick` | `50` | 每个事件循环 tick 处理的对象数（大=快但易阻塞） |
| `updateFieldAppearances` | `true` | 保存时是否重绘表单字段外观 |

## 三、PDFPage 绘制方法

| 方法 | 作用 |
|---|---|
| `drawText(text, opts)` | 画文字（支持多行 `\n`、自动换行 maxWidth） |
| `drawImage(image, opts)` | 画图片（先 embedPng/embedJpg） |
| `drawPage(embedded, opts)` | 画嵌入页（先 embedPage/embedPdf） |
| `drawRectangle(opts)` | 画矩形 |
| `drawLine(opts)` | 画线（`start`/`end` 为 `{x,y}`） |
| `drawCircle(opts)` | 画圆（x/y 圆心、`size` 半径） |
| `drawEllipse(opts)` | 画椭圆（`xScale`/`yScale`） |
| `drawSvgPath(d, opts)` | 画 SVG path（传 `d` 字符串） |
| `getSize()` / `getWidth()` / `getHeight()` | 取尺寸 |
| `setSize(w,h)` / `setWidth` / `setHeight` | 改尺寸 |
| `setRotation(degrees(n))` / `getRotation()` | 页面旋转（90 的倍数） |
| `setFont` / `setFontSize` / `setFontColor` | 设页级默认字体/字号/色 |
| `translateContent(x,y)` / `scale(x,y)` | 内容平移 / 页面缩放 |
| `moveTo` / `moveUp` / `moveDown` / `resetPosition` | 默认绘制位置 |

### drawText 选项

| 选项 | 含义 |
|---|---|
| `x` / `y` | 起点坐标（左下原点、y 向上） |
| `size` | 字号 |
| `font` | **PDFFont 对象**（须先 embed，不能传字符串名） |
| `color` | `rgb()`/`cmyk()`/`grayscale()`（默认黑） |
| `lineHeight` | 多行行距 |
| `maxWidth` | 超宽时自动按词换行 |
| `rotate` | `degrees(n)` / `radians(n)` |
| `opacity` | 不透明度 0~1（做水印） |
| `blendMode` | 混合模式 |

### drawRectangle / drawLine / drawCircle 关键选项

| 形状 | 关键选项 |
|---|---|
| `drawRectangle` | `x,y,width,height`、`color`（填充）、`borderColor`、`borderWidth`、`opacity`、`borderOpacity`、`rotate` |
| `drawLine` | `start:{x,y}`、`end:{x,y}`、`thickness`、`color`、`opacity`、`dashArray` |
| `drawCircle` | `x,y`（圆心）、`size`（半径）、`color`、`borderColor`、`borderWidth` |
| `drawImage` / `drawPage` | `x,y,width,height`（或 `xScale/yScale`）、`opacity`、`rotate` |

## 四、PDFFont（字体测量）

| 方法 | 作用 |
|---|---|
| `widthOfTextAtSize(text, size)` | 文本在该字号下的宽度（做居中/换行） |
| `heightAtSize(size)` | 行高 |
| `sizeAtHeight(height)` | 由目标高度反算字号 |

## 五、PDFImage（图片）

| 方法 | 作用 |
|---|---|
| `scale(factor)` | 返回等比缩放后的 `{ width, height }` |
| `scaleToFit(w, h)` | 返回适配框内的 `{ width, height }` |
| `size()` | 原始 `{ width, height }` |

## 六、PDFForm（表单）

| 方法 | 作用 |
|---|---|
| `getTextField(name)` | 取文本框 |
| `getCheckBox(name)` | 取复选框 |
| `getRadioGroup(name)` | 取单选组 |
| `getDropdown(name)` / `getOptionList(name)` | 取下拉 / 列表 |
| `getButton(name)` | 取按钮（可 `setImage`） |
| `getFields()` | 列出全部字段 |
| `getField(name)` / `getFieldMaybe(name)` | 取字段（后者不存在返回 undefined，不抛错） |
| `createTextField(name)` 等 | 工厂创建字段，再 `addToPage(page, {x,y,w,h})` |
| `removeField(field)` | 删字段 |
| `flatten()` | 扁平化：字段外观固化为页面内容、不再可编辑 |
| `updateFieldAppearances(font)` | 用指定字体重绘字段外观（**中文字段必须**） |

### 字段值操作

| 字段类型 | 操作 |
|---|---|
| 文本框 | `setText(s)` / `getText()` / `enableMultiline()` / `setMaxLength(n)` |
| 复选框 | `check()` / `uncheck()` / `isChecked()` |
| 单选组 | `select(value)` / `getSelected()` |
| 下拉/列表 | `select(value)`（可数组）/ `addOptions([...])` |
| 按钮 | `setImage(pdfImage)` |

## 七、颜色与角度辅助函数

| 函数 | 说明 |
|---|---|
| `rgb(r, g, b)` | 分量 **0~1**（红 = `rgb(1,0,0)`） |
| `cmyk(c, m, y, k)` | 分量 0~1 |
| `grayscale(v)` | 灰度 0~1 |
| `degrees(n)` / `radians(n)` | 角度，用于 `rotate` / `setRotation` |

## 八、常用导出常量

| 导出 | 内容 |
|---|---|
| `StandardFonts` | 标准 14 字体枚举：`Helvetica`(+Bold/Oblique/BoldOblique)、`TimesRoman`(+变体)、`Courier`(+变体)、`Symbol`、`ZapfDingbats` |
| `PageSizes` | 页面尺寸表：`A4=[595.28,841.89]`、`Letter=[612,792]`、`Legal`、`A3`…（单位 point） |
| `ParseSpeeds` | `Slow / Medium / Fast / Fastest` |
| `rgb` / `cmyk` / `grayscale` / `degrees` / `radians` | 见上 |

---

速查完毕，进 [指南 · 基础](./guide-line/base) 理解坐标系与字体，或 [指南 · 进阶](./guide-line/advanced) 看修改既有 PDF / 合并 / 表单实战。
