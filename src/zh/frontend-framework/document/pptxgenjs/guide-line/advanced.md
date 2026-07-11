---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **4.0.1**。把 PptxGenJS 用进真实场景：图表全家桶与组合图、批量生成多页报告、浏览器导出下载、Node 服务端把 pptx 作为 HTTP 响应、媒体嵌入、超链接与节、HTML 表格转幻灯片。

## 速查

- 图表数据：`[{ name, labels, values }]`；组合图把 `{ type, data, options }[]` 作为首参
- 批量报告：循环内部每条数据都调用一次 `pres.addSlide()`
- 浏览器下载：`await pres.writeFile({ fileName, compression? })`
- Node 响应：`await pres.write({ outputType:'nodebuffer' })` 后直接 `res.send(buffer)`
- `pres.stream()` 在 4.0.1 也返回 Buffer，不是可 `pipe()` 的 `Readable`
- 媒体：`addMedia({ type:'video'|'audio'|'online', ... })`
- 链接：`hyperlink:{ url }` 或 `hyperlink:{ slide:N }`
- HTML 表格：浏览器中 `pres.tableToSlides(elementId)`；同步返回 `void` 并自动建页

## 一、图表：类型、数据与选项

```ts
const data = [
  { name: '产品 A', labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [150, 200, 180, 220] },
  { name: '产品 B', labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [120, 160, 190, 170] },
];

slide.addChart(pres.ChartType.bar, data, {
  x: 0.5, y: 0.5, w: 6, h: 4,
  barDir: 'col',            // 竖直柱；'bar' 为水平条
  barGrouping: 'clustered', // clustered / stacked / percentStacked
  chartColors: ['0088CC', 'FF6600'],
  showTitle: true, title: '季度对比',
  showLegend: true, legendPos: 'b', // b/t/l/r/tr
  showValue: true,
});
```

> 数据是**系列数组** `[{ name, labels, values }]`，不是 Chart.js 的 `{ labels, datasets }`。没有 `column` 类型——竖直柱用 `bar` + `barDir:'col'`。

## 二、饼图 / 环图

```ts
const pieData = [{ name: '占比', labels: ['A', 'B', '其他'], values: [45, 30, 25] }];

slide.addChart(pres.ChartType.pie, pieData, {
  x: 0.5, y: 0.5, w: 4, h: 3,
  showPercent: true,  // 扇区上显示百分比
  showLegend: true,
});

slide.addChart(pres.ChartType.doughnut, pieData, {
  x: 5, y: 0.5, w: 4, h: 3,
  holeSize: 50,       // 中孔大小
  showPercent: true,
});
```

## 三、组合图：柱 + 线

把 `addChart` 的**第一个参数传成数组**，每项一种子图：

```ts
slide.addChart(
  [
    { type: pres.ChartType.bar, data: barData, options: { barDir: 'col' } },
    { type: pres.ChartType.line, data: lineData, options: { secondaryValAxis: true } },
  ],
  { x: 0.5, y: 0.5, w: 9, h: 5 },
);
```

> 组合图靠 `IChartMulti[]` 首参实现，不是连续调用两次 addChart（那会变成两个独立图）。

## 四、批量生成多页报告

每页都要 `addSlide()`：遍历数据，每条建一页。

```ts
const records = [
  { title: '一月报告', value: 120 },
  { title: '二月报告', value: 150 },
];

records.forEach((r) => {
  const s = pres.addSlide({ masterName: 'BRAND' });
  s.addText(r.title, { x: 1, y: 0.8, w: 8, h: 1, fontSize: 28, bold: true });
  s.addText(`数值：${r.value}`, { x: 1, y: 2, w: 8, h: 1, fontSize: 18 });
});

await pres.writeFile({ fileName: 'report.pptx' });
```

> 常见错误：只建一张 slide、循环里反复 addText——内容会全堆在同一页。

## 五、浏览器：导出下载

```ts
// writeFile 在浏览器中自动触发下载（无需手动拼 Blob）
await pres.writeFile({ fileName: 'export.pptx', compression: true });
```

若要自定义下载流程（少见），可先 `write` 拿 blob：

```ts
const blob = await pres.write({ outputType: 'blob' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'export.pptx';
a.click();
URL.revokeObjectURL(url);
```

## 六、Node：把 pptx 作为 HTTP 响应返回

服务端不落地磁盘，用 `write` 拿 `nodebuffer` 直接作为响应体：

```ts
// Express 示例
app.get('/report', async (req, res) => {
  const pres = new pptxgen();
  const slide = pres.addSlide();
  slide.addText('Server-generated', { x: 1, y: 1, w: 8, h: 1, fontSize: 24 });

  const buf = await pres.write({ outputType: 'nodebuffer' });
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  );
  res.setHeader('Content-Disposition', 'attachment; filename="report.pptx"');
  res.send(buf);
});
```

> 服务端取 `'nodebuffer'`（不是浏览器的 `'blob'`）。`pres.stream()` 在 `4.0.1` 的 Node 发布包中也会一次性生成并返回 `Buffer`，**不是** Node `Readable`，不要直接调用 `.pipe()`；需要流接口时可用 `Readable.from([buf])` 包装。

## 七、媒体：音视频与 YouTube

```ts
// 在线视频（YouTube）
slide.addMedia({
  type: 'online',
  link: 'https://www.youtube.com/embed/Dl8Tg_Ldae8',
  x: 1, y: 1, w: 6, h: 3.4,
});

// 本地视频/音频
slide.addMedia({ type: 'video', path: 'clip.mp4', x: 1, y: 1, w: 6, h: 3.4 });
slide.addMedia({ type: 'audio', path: 'bgm.mp3', x: 1, y: 5, w: 1, h: 1 });
```

> 统一用 `addMedia`，`type` 取 `'video'`/`'audio'`/`'online'`；没有 addVideo/addYouTube 这类专用方法。

## 八、超链接与跳页

```ts
slide.addText(
  [
    { text: '访问 ', options: {} },
    { text: '官网', options: { hyperlink: { url: 'https://example.com', tooltip: '打开官网' } } },
  ],
  { x: 1, y: 1, w: 6, h: 0.6 },
);

// 跳到本文稿第 3 张幻灯片
slide.addText('去第 3 页', { x: 1, y: 2, w: 3, h: 0.6, hyperlink: { slide: 3 } });
```

> 超链接是对象：外链 `{ url }`，跳页 `{ slide: N }`；不是裸字符串，也不是 `href`/`link`。

## 九、节（Section）：给长演示分段

```ts
pres.addSection({ title: '概览' });
pres.addSlide({ sectionTitle: '概览' }).addText('Overview', { x: 1, y: 1, w: 6, h: 1 });

pres.addSection({ title: '数据' });
pres.addSlide({ sectionTitle: '数据' }).addChart(pres.ChartType.bar, data, { x: 1, y: 1, w: 8, h: 4 });
```

## 十、HTML 表格 → 幻灯片（浏览器）

```ts
// 页面上有 <table id="report-table">...</table>
pres.tableToSlides('report-table');          // 参数是元素 id 字符串
await pres.writeFile({ fileName: 'fromHtml.pptx' });
```

> `tableToSlides` 挂在 **pres** 上（它会自建幻灯片），参数是元素 **id**，依赖 DOM 故**浏览器环境**，返回 void（非异步）。

## 十一、表格自动分页

```ts
slide.addTable(longRows, {
  x: 0.5, y: 0.5, w: 9,
  autoPage: true,             // 超长自动续到新幻灯片
  autoPageRepeatHeader: true, // 每页重复表头
  autoPageHeaderRows: 1,
});
```

---

进入 [指南 · 专家](./expert)：母版与占位符深入、输出形态与压缩、只生成不解析的边界与 pptx-automizer、性能与大文件、与 docx/SheetJS 等同类库的取舍。
