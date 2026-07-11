---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 PptxGenJS 并生成第一份 `.pptx`。版本基线 **4.0.1**。核心认知：**Presentation → Slide → 元素** 三层模型，外加两条贯穿全篇的提醒——**颜色用不带 `#` 的十六进制**、**输出方法都是异步的（要 await）**。

## 速查

- 安装：`npm install pptxgenjs`（自带 TS 类型，无需 `@types`）
- 导入（Node/ESM）：`import pptxgen from 'pptxgenjs'`（CJS：`const pptxgen = require('pptxgenjs')`）
- 浏览器全局：`<script src=".../pptxgen.bundle.js">` 后用 `new PptxGenJS()`
- 建实例：`const pres = new pptxgen()`
- 设尺寸：`pres.layout = 'LAYOUT_WIDE'`（或 `'LAYOUT_16x9'` 默认）
- 加页：`const slide = pres.addSlide()`
- 加字：`slide.addText('Hello', { x: 1, y: 1, w: 8, h: 1, fontSize: 24, color: '0088CC' })`
- 落地（Node 写盘 / 浏览器下载）：`await pres.writeFile({ fileName: 'out.pptx' })`
- 拿数据：`const b64 = await pres.write({ outputType: 'base64' })`
- `4.0.1` 调用 `writeFile` 时应显式传 `{ fileName }`；无参调用存在运行时缺陷
- ⚠️ 颜色无 `#`（`'0088CC'`，不是 `'#0088CC'`）；输出全是 Promise，记得 `await`

## 一、PptxGenJS 是什么

官方定位：「**Create PowerPoint presentations with a powerful, concise JavaScript API**」。三个关键点：

1. **生成 .pptx**：用代码声明幻灯片，产出符合 OOXML 的 `.pptx` 文件。
2. **跨环境**：Node、浏览器、React/Vite、Electron 通用，只是「落地」方式不同。
3. **对象模型统一**：Presentation（`new pptxgen()`）→ Slide（`addSlide()`）→ 元素（`addText`/`addImage`/...）。

> 边界提醒：PptxGenJS **只生成、不解析**——它不能读取或修改既有 `.pptx`。要基于现成模板做替换，请用 pptx-automizer（见[专家篇](./guide-line/expert)）。它也**不渲染/预览**，看效果要用 PowerPoint/WPS 打开。

## 二、安装

```bash
npm install pptxgenjs
# pnpm / yarn 同理
pnpm add pptxgenjs
yarn add pptxgenjs
```

> 包内自带 TypeScript 类型声明（`types/`），无需再装 `@types/pptxgenjs`；同时提供 CommonJS 与 ES Module 两种构建。

浏览器可直接用 CDN 的单文件 bundle（已内联唯一核心依赖 JSZip）：

```html
<!-- 含 JSZip 的单文件 bundle，挂全局 PptxGenJS -->
<script src="https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs/dist/pptxgen.bundle.js"></script>
```

## 三、导入与建实例

默认导出是一个**类**。Node/ESM 习惯把它别名为 `pptxgen`：

```ts
import pptxgen from 'pptxgenjs';

const pres = new pptxgen(); // 必须 new；它是类不是工厂函数
```

浏览器用 `<script>` bundle 时，类挂在全局 `PptxGenJS`：

```js
const pres = new PptxGenJS(); // 浏览器全局名是大驼峰 PptxGenJS
```

> `pptxgen`（小写）只是 Node 里 import 时自取的别名；`PptxGenJS`（大驼峰）是浏览器全局名。两者是**同一个类**。

## 四、第一份演示文稿

标准四步：建实例 → 加页 → 往页上加元素 → 落地。

```ts
import pptxgen from 'pptxgenjs';

// 1. 建实例并设尺寸（可选；默认 LAYOUT_16x9）
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 英寸

// 2. 新增一张幻灯片
const slide = pres.addSlide();

// 3. 加一个文本框（坐标单位是英寸；颜色无 #）
slide.addText('Hello, PptxGenJS!', {
  x: 1, y: 1, w: 8, h: 1.5,
  fontSize: 36,
  color: '0088CC',
  align: 'center',
  bold: true,
});

// 4. 落地：Node 写盘 / 浏览器触发下载（异步，要 await）
await pres.writeFile({ fileName: 'hello.pptx' });
```

> `writeFile` 是**环境自适应**的：Node 里写入磁盘，浏览器里自动触发下载——你不必手动拼 Blob。

::: warning 4.0.1 的无参 writeFile
类型声明和部分官方示例把参数标成可选，但发布包 `4.0.1` 的运行时代码会直接读取 `props.fileName`；`pres.writeFile()` 无参调用会抛错。请始终传入对象，例如 `await pres.writeFile({ fileName: 'Presentation.pptx' })`。
:::

## 五、坐标与颜色：两条必记规则

```ts
slide.addText('定位演示', {
  x: 1,        // 距左 1 英寸（数字 = 英寸）
  y: '50%',    // 距顶 = 幻灯片高度的一半（百分比相对幻灯片尺寸）
  w: 4, h: 1,
  color: 'FF0000',          // ✅ 无 # 的 6 位十六进制
  // color: '#FF0000',      // ❌ 带 # 会让颜色失效
  fill: { color: 'F1F1F1' },// 背景填充，同样无 #
});
```

::: warning 两个最常见的新手坑
1. **颜色必须不带 `#`**：用 `'0088CC'` 而非 `'#0088CC'`，全库（文本/填充/边框/图表/背景）都如此。
2. **输出方法是异步的**：`writeFile`/`write`/`stream` 都返回 Promise，忘了 `await` 会拿不到结果或文件未写完。
:::

## 六、加一张图表试试

```ts
const slide2 = pres.addSlide();

const data = [
  { name: '销量', labels: ['一月', '二月', '三月'], values: [150, 460, 515] },
];

// addChart(type, data, options)；类型用 pres.ChartType 枚举
slide2.addChart(pres.ChartType.bar, data, {
  x: 1, y: 1, w: 8, h: 4,
  barDir: 'col',          // 竖直柱（'bar' 为水平条）
  showTitle: true,
  title: '季度销量',
  showValue: true,
});
```

> 图表数据是**系列数组** `[{ name, labels, values }]`，不是 Chart.js 的 `{ labels, datasets }`。

## 七、把它作为服务端响应返回（Node）

服务端通常不落地磁盘，而是用 `write` 拿 `nodebuffer` 直接作为响应体：

```ts
const buf = await pres.write({ outputType: 'nodebuffer' });
res.setHeader(
  'Content-Type',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
);
res.setHeader('Content-Disposition', 'attachment; filename="report.pptx"');
res.send(buf);
```

---

跑通后进入 [指南 · 基础](./guide-line/base)：对象模型、坐标单位、addText 的混排/项目符号、addImage/addTable/addShape、母版与布局。
