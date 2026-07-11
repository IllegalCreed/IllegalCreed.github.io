---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **4.2.1**。本篇把「会画」用到「懂模型」：命令式绘图范式、坐标系与单位、状态型样式（颜色/线宽/字体）、长文本换行 `splitTextToSize`、页面尺寸读取与居中、`text`/`rect`/图形的 style。

## 速查

- jsPDF 是命令式绘图：坐标、留白、换行与分页由调用方管理
- 坐标原点在左上，x 向右、y 向下；坐标单位由构造器 `unit` 决定
- `setFontSize()` 永远是 pt；`setLineWidth()` 跟随文档 unit
- 颜色/线宽/字体是状态，必须先设置再绘制
- 图形 style：`S` 描边、`F` 填充、`FD`/`DF` 两者兼有
- 文本对齐以传入 x 为锚点；整页居中要先取页宽的一半
- `text()` 不做内容流；长文本先 `splitTextToSize()`，再计算是否 `addPage()`
- TypeScript 取尺寸用 `doc.internal.pageSize.getWidth()/getHeight()`

## 一、命令式绘图：一块画布

jsPDF 不是声明式文档定义，而是**命令式绘图**：一份文档（每一页）就是一块从左上角 `(0,0)` 到 `(pageWidth, pageHeight)` 的画布，你逐条下达绘制指令：

```ts
const doc = new jsPDF();           // A4 / 纵向 / mm
doc.text('标题', 20, 20);          // 在 (20mm, 20mm) 写字
doc.line(20, 25, 190, 25);         // 画一条分隔线
doc.rect(20, 30, 60, 30);          // 画一个矩形
```

关键认知：**坐标即绝对位置**，原点在左上、x 向右、y 向下。jsPDF **没有**自动页边距、内容流、自动换行或自动分页——这些都要你自己计算（留白、断行、`addPage`）。这正是它与 pdfmake / @react-pdf 的根本区别。

## 二、单位：坐标随 unit，字号恒为 pt

```ts
const doc = new jsPDF({ unit: 'mm' });
doc.text('x', 10, 10);   // 10 = 10 毫米
doc.setFontSize(12);     // 12 = 12 磅（pt），与 unit 无关
```

| 概念 | 受 `unit` 影响？ |
|---|---|
| `text`/`line`/`rect`/`addImage` 的坐标与尺寸 | ✅ 是（mm/in/px…） |
| `setFontSize` 的字号 | ❌ 否，**始终 pt** |
| `setLineWidth` 的线宽 | ✅ 是 |

> 合法 `unit`：`'pt'`/`'mm'`/`'cm'`/`'m'`/`'in'`/`'px'`。没有 `'inch'`/`'rem'`/`'%'`。

## 三、状态型样式：先设后画

颜色、线宽、字体都是**状态**：调用设置方法后，影响**其后**的绘制，直到再次更改。所以**必须在绘制之前设好**。

```ts
doc.setFillColor(230, 230, 230); // 填充色
doc.setDrawColor(40, 40, 40);    // 描边色
doc.setLineWidth(0.5);
doc.rect(20, 30, 60, 30, 'FD');  // 此矩形：浅灰填充 + 深灰描边
```

三种颜色分工：

| 方法 | 控制 |
|---|---|
| `setDrawColor` | 描边/线条颜色（line、图形的 stroke 部分） |
| `setFillColor` | 图形填充颜色（fill 部分） |
| `setTextColor` | 文字颜色 |

> 顺序很重要：先 `rect` 再 `setFillColor`，颜色对这次绘制**不生效**。

## 四、图形与 style 参数

图形方法（`rect`/`circle`/`ellipse`/`triangle`/`roundedRect`）最后一个 `style` 控制绘制方式：

```ts
doc.rect(20, 30, 50, 20, 'S');   // 只描边（默认）
doc.rect(20, 60, 50, 20, 'F');   // 只填充
doc.rect(20, 90, 50, 20, 'FD');  // 填充 + 描边
doc.roundedRect(20, 120, 50, 20, 3, 3, 'FD'); // 圆角矩形（rx, ry）
```

| style | 含义 | 用色 |
|---|---|---|
| `'S'` | stroke 只描边 | drawColor |
| `'F'` | fill 只填充 | fillColor |
| `'FD'` / `'DF'` | 填充并描边 | 两者 |

## 五、文字与对齐

```ts
doc.setFontSize(20);
doc.setTextColor(33, 33, 33);
doc.text('左对齐', 20, 20);

// 居中：x 取页宽一半，再 align: 'center'
const centerX = doc.internal.pageSize.getWidth() / 2;
doc.text('整页居中标题', centerX, 35, { align: 'center' });

// 右对齐：以 x 为右端
doc.text('右对齐', 190, 50, { align: 'right' });
```

> `align` 以传入的 **x 为基准**：`'center'` 把 x 当水平中心、`'right'` 把 x 当右端。只写 `align` 不给正确的 x 不会整页居中。

## 六、长文本换行：splitTextToSize

`text()` **不自动换行**，长字符串会冲出右边界。用 `splitTextToSize` 按宽度切成行数组再画：

```ts
const margin = 20;
const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;

const long = '这是一段很长的文本……（略）';
const lines = doc.splitTextToSize(long, usableWidth); // 字符串数组，每项一行
doc.text(lines, margin, 30); // 传数组即按行排版
```

> 行高随字号与 `setLineHeightFactor` 变化。要知道文本占多高，可结合 `lines.length` 与字号估算，用于后续 y 定位或判断是否需要 `addPage`。

## 七、读取页面尺寸

居中、画满宽分隔线、定位页脚都需要页面尺寸：

```ts
const w = doc.internal.pageSize.getWidth();  // 当前单位下的页宽
const h = doc.internal.pageSize.getHeight(); // 页高

doc.line(20, h - 15, w - 20, h - 15); // 距底 15 单位画页脚线
```

> 不要写死 `210×297`——那只是 A4 + mm 的值，换 `format`/`unit` 就不对。运行时虽有 `getPageWidth()` / `getPageHeight()`，4.2.1 类型声明没有这两个方法，TS 项目用 `internal.pageSize` 更稳。

## 八、一个最小「卡片」示例

```ts
const doc = new jsPDF();
doc.setFillColor(245, 247, 250);
doc.setDrawColor(220);
doc.roundedRect(20, 20, 80, 40, 3, 3, 'FD'); // 卡片背景

doc.setTextColor(33);
doc.setFontSize(14);
doc.text('卡片标题', 28, 32);
doc.setFontSize(10);
doc.setTextColor(120);
doc.text('一段说明文字', 28, 42);

doc.save('card.pdf');
```

---

进入 [指南 · 进阶](./advanced)：图片与 `addImage`、`jspdf-autotable` 表格、`.html()` 转换、多页页眉页脚、导出形态与上传。
