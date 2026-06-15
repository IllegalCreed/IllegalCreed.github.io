---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 jsPDF 并完成第一份 PDF：写一行字、画几个图形、新增一页、导出下载。版本基线 **4.x**。核心认知：**命令式绘图**（坐标即绝对位置）+ **导出三形态**（`save` 下载 / `output` 拿数据 / `output('bloburl')` 预览），以及贯穿全篇的一条提醒——**内置字体只覆盖 ASCII，中文要嵌入字体**。

## 速查

- 安装：`npm install jspdf`（正常 npm 包，**无需** SheetJS 那种 CDN tarball）
- 导入：`import { jsPDF } from 'jspdf'`（类名大写 `jsPDF`，包名小写 `jspdf`）
- 新建（默认 A4 / 纵向 / mm）：`const doc = new jsPDF()`
- 自定义：`new jsPDF({ orientation: 'landscape', unit: 'in', format: [4, 2] })`
- 写字：`doc.text('Hello', 10, 20)`（x=左 10mm，y=上 20mm）
- 字号/色：`doc.setFontSize(18); doc.setTextColor(255, 0, 0)`
- 画线/矩形：`doc.line(10, 10, 100, 10)` / `doc.rect(10, 30, 50, 20, 'FD')`
- 新增一页：`doc.addPage()`；回到某页：`doc.setPage(1)`
- 下载：`doc.save('out.pdf')`；拿 Blob：`doc.output('blob')`
- ⚠️ 内置 14 标准字体仅 ASCII，中文须 `addFileToVFS` + `addFont` + `setFont`

## 一、jsPDF 是什么

官方定位：「**Client-side JavaScript PDF generation**」。三个关键点：

1. **纯客户端**：浏览器本地把数据画成 PDF 并下载，无需后端（也能在 Node 跑）。
2. **命令式绘图**：按坐标一步步 `text`/`line`/`rect`/`addImage` 把内容画上去，自己管布局与分页。
3. **矢量 vs 栅格**：原生 `text()` 出可选矢量文字；`.html()` 走 html2canvas 栅格化（文字不可选）。

> 边界提醒：jsPDF 只负责**生成**新 PDF，不解析/渲染已有 PDF（那是 PDF.js），也不编辑现有 PDF（那是 pdf-lib）。

## 二、安装

```bash
npm install jspdf
# 表格插件（可选）
npm install jspdf-autotable
```

> 不同于 SheetJS，jsPDF 是正常发布在 npm 的开源包，`npm install jspdf` 直接拿到最新版即可，**没有**必须走官方 CDN 的限制。

浏览器也可用 `<script>` 引入（挂全局）：

```html
<script src="https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js"></script>
```

## 三、创建文档

```ts
import { jsPDF } from 'jspdf';

// 默认：A4 纸、纵向 portrait、毫米 mm
const doc = new jsPDF();

// 自定义：横向、英寸、4×2 自定义尺寸
const doc2 = new jsPDF({
  orientation: 'landscape', // 'portrait' | 'landscape'（简写 'p' | 'l'）
  unit: 'in',               // 'pt' | 'mm' | 'cm' | 'm' | 'in' | 'px'
  format: [4, 2],           // 预设名（'a4'/'letter'…）或 [width, height]
});
```

> `unit` 决定后续所有**坐标/尺寸**数字的含义；但注意 **`setFontSize` 的字号始终以 pt（点）计**，与 unit 无关。

## 四、第一份 PDF：写字 + 下载

官方最小示例就三行：

```ts
const doc = new jsPDF();
doc.text('Hello world!', 10, 10); // x=左 10mm，y=上 10mm
doc.save('a4.pdf');               // 浏览器触发下载（Node 写盘）
```

`text(text, x, y)` 的 x/y 以左上角为原点；`save(filename)` 底层是 `output('save', filename)`，靠 FileSaver.js 触发下载。

## 五、画点图形

颜色/线宽是**状态型**：要在绘制**之前**设好，影响其后的绘制。

```ts
doc.setDrawColor(40, 40, 40);  // 描边色
doc.setFillColor(230, 230, 230); // 填充色
doc.setLineWidth(0.5);

doc.line(10, 20, 100, 20);       // 直线：(x1,y1)→(x2,y2)
doc.rect(10, 30, 50, 20, 'FD');  // 矩形：x,y,w,h,style（FD=填充+描边）
doc.circle(40, 70, 10, 'S');     // 圆：x,y,r,style（S=只描边）
```

> `style` 取值：`'S'` 只描边（用 drawColor）、`'F'` 只填充（用 fillColor）、`'FD'`/`'DF'` 既填充又描边，不传默认 `'S'`。

## 六、多页

```ts
doc.text('第 1 页', 10, 10);
doc.addPage();          // 新增一页，并把「当前页」切到新页
doc.text('第 2 页', 10, 10);

doc.setPage(1);         // 切回第 1 页补内容（如页脚页码）
doc.text('页脚', 10, 287);
```

> `addPage(format?, orientation?)` 新增页并自动切到新页；`setPage(n)` 在已存在页之间切换；`getNumberOfPages()` 查总页数。

## 七、导出的三种形态

```ts
doc.save('report.pdf');            // ① 直接下载

const blob = doc.output('blob');   // ② 拿 Blob（FormData 上传后端）

iframe.src = doc.output('bloburl');// ③ 拿对象 URL（iframe 预览，不下载）
```

> 其它常用：`output('arraybuffer')` 拿字节（Node 端作 HTTP 响应）、`output('datauristring')` 拿 data: 字符串、裸 `output()` 返回原始 PDF 字符串（调试用）。

## 八、一个绕不开的点：中文

内置 14 标准字体**只覆盖 ASCII**，直接写中文会乱码/丢字。要显示中文，必须嵌入自定义字体：

```ts
// base64 字体串可用官方 fontconverter 工具生成
doc.addFileToVFS('MyFont.ttf', base64Font); // ① 放进虚拟文件系统
doc.addFont('MyFont.ttf', 'MyFont', 'normal'); // ② 注册（文件名, 族名, 样式）
doc.setFont('MyFont');                       // ③ 切换后再 text
doc.text('你好，世界', 10, 10);
```

> 完整中文 TTF 常达数 MB，嵌入后 PDF 显著变大，生产环境常用**字体子集化**只保留用到的字。详见[专家篇](./guide-line/expert)。

---

跑通后进入 [指南 · 基础](./guide-line/base)：命令式绘图模型、坐标系与单位、状态型样式、长文本换行 `splitTextToSize`、页面尺寸读取。
