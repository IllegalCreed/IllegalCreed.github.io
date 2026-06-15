---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **4.0.1**。深入边界与权衡：母版与占位符、输出形态与 outputType 大小写、压缩、**「只生成不解析」的根本边界与 pptx-automizer**、无渲染/预览、依赖与版本、命名大小写陷阱，以及与同类文档库的选型。

## 一、母版与占位符（深入）

母版让多页共享品牌外观；占位符让母版上预留「填内容的坑」。

```ts
pres.defineSlideMaster({
  title: 'CORP',                       // 唯一名（必填）
  background: { color: 'FFFFFF' },
  objects: [
    // 顶部色条 + 标题文字
    { rect: { x: 0, y: 0, w: '100%', h: 0.75, fill: { color: '0088CC' } } },
    { text: { text: '公司机密', options: { x: 0.4, y: 0.15, color: 'FFFFFF', fontSize: 14 } } },
    // 正文占位符：后续页面可往同名坑填内容
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 1.2, w: 12, h: 5.5 }, text: '(正文)' } },
  ],
  slideNumber: { x: 0.3, y: '95%', color: '999999', fontSize: 10 },
});

// 套用并向占位符填内容
const slide = pres.addSlide({ masterName: 'CORP' });
slide.addText('真正的正文', { placeholder: 'body' });
```

> 占位符 `type` 合法值：`title`/`body`/`image`/`chart`/`table`/`media`。套用母版的字段是 **`masterName`**（addSlide），别和 tableToSlides 的 `master` 选项混。

## 二、输出形态：outputType 的精确取值

`write({ outputType })` 决定返回的数据形态，**取值全小写**：

| outputType | 返回 | 典型场景 |
|---|---|---|
| `'blob'`（默认） | Blob | 浏览器自定义下载 |
| `'base64'` | string | 内嵌/上传/data URI |
| `'arraybuffer'` | ArrayBuffer | 二进制处理 |
| `'uint8array'` | Uint8Array | 二进制处理 |
| `'nodebuffer'` | Buffer | Node 服务端响应 |
| `'binarystring'` | string | 二进制字符串 |

```ts
const b64 = await pres.write({ outputType: 'base64' });
const buf = await pres.write({ outputType: 'nodebuffer' }); // 服务端
```

::: warning 大小写陷阱
- `'nodebuffer'`（全小写、一个词）—— 不是 `'buffer'`、不是 `'nodeBuffer'`。
- `'arraybuffer'` / `'uint8array'` 全小写 —— 不是 `'arrayBuffer'` / `'Uint8Array'`。
:::

## 三、压缩：减小体积

```ts
await pres.writeFile({ fileName: 'small.pptx', compression: true });
```

`compression: true` 启用 ZIP DEFLATE（默认 STORE 不压缩），文件更小、导出略慢。对图表/文本多的文稿收益明显。

## 四、根本边界：只生成，不解析

这是选型时**最重要**的一条：PptxGenJS 是 **write-only**——

- ✅ 从零**生成**新的 `.pptx`；
- ❌ **不能**读取、解析、打开或修改既有 `.pptx`，没有 `load()` 之类的 API，也没有读取插件。

要基于一个现成 `.pptx` 模板做「替换占位文字 / 填表 / 换图」，得换库：

| 需求 | 用什么 |
|---|---|
| 代码从零生成 pptx | **PptxGenJS** |
| 基于既有 pptx 模板替换/填充 | **pptx-automizer**（或 docxtemplater 的 pptx 模块） |

```ts
// 误区：PptxGenJS 做不到下面这件事
// const pres = pptxgen.load('template.pptx'); // ❌ 不存在
```

## 五、没有渲染 / 预览

PptxGenJS **不渲染、不预览**——它产出文件，要看效果得用 PowerPoint / WPS / Office Online 打开。纯 JS 渲染 `.pptx` 在生态里是公认弱项，无成熟可靠方案。若一定要网页预览，常见折中是：

- 服务端用 LibreOffice / Office 把 pptx 转成图片或 PDF 再展示；
- 接 Office Online / Google Slides 的在线查看；

但这些都**不属于 PptxGenJS 本身**，别期待 `pres.preview()` 这类方法。

## 六、依赖与版本

- 当前版本基线 **4.0.1**（MIT）。
- **核心依赖 JSZip**——负责把 `.pptx`（本质是 ZIP 容器）打包，也是**唯一被打进浏览器 bundle** 的依赖。
- 严格看 v4 的 `package.json`，dependencies 还列了 `image-size`、`https`，所以「v4 只有 JSZip 一个依赖」的旧说法已略过时；但 JSZip 仍是最核心的那个。
- 自带 TypeScript 类型（`types/`），无需 `@types/pptxgenjs`；提供 CommonJS（`dist/pptxgen.cjs.js`）与 ESM（`dist/pptxgen.es.js`）构建，浏览器有 `pptxgen.bundle.js`（含 JSZip）与 `pptxgen.min.js`（需另引 JSZip）。

## 七、命名大小写陷阱合集（最易翻车）

| 项 | 正确 | 常见错误 |
|---|---|---|
| 颜色 | `'0088CC'` | `'#0088CC'` |
| 垂直居中 | `valign: 'middle'` | `valign: 'center'` |
| 水平居中 | `align: 'center'` | `align: 'middle'` |
| 字号/字体 | `fontSize` / `fontFace` | `fontsize` / `fontFamily` |
| 3D 柱图键 | `ChartType.bar3d`（值 `'bar3D'`） | `ChartType.bar3D`（取到 undefined） |
| 柱状方向 | `bar` + `barDir:'col'` | `ChartType.column` |
| 布局常量 | `LAYOUT_16x9`（小写 x） | `LAYOUT_16X9` |
| Node Buffer 输出 | `'nodebuffer'` | `'buffer'` |
| 套用母版 | `addSlide({ masterName })` | `addSlide({ master })` |
| 图例位置 | `legendPos: 'b'` | `legendPos: 'bottom'` |

> 另外：`ChartType`/`ShapeType` 枚举键是小写/小驼峰（`bar`、`rect`、`roundRect`），而 `pres.charts.BAR`/`pres.shapes.RECTANGLE` 是大写**便捷别名**，二者等效但写法不同。

## 八、异步是常态

`writeFile` / `write` / `stream` 都返回 **Promise**（生成 ZIP、处理图片耗时），没有同步版本。忘了 `await` 是最常见的「文件为空 / 没下载」原因：

```ts
// ❌ 没 await：可能拿不到结果或文件未写完
pres.writeFile({ fileName: 'a.pptx' });

// ✅
await pres.writeFile({ fileName: 'a.pptx' });
```

## 九、与同类文档库的选型

| 需求 | 推荐 |
|---|---|
| 生成 **PowerPoint(.pptx)** | **PptxGenJS** |
| 改既有 **pptx 模板** | pptx-automizer |
| 生成 **Word(.docx)** | docx |
| 改既有 **docx 模板**（占位替换） | docxtemplater |
| 读写 **Excel(.xlsx)** 数据 | SheetJS / ExcelJS |
| 生成 **PDF** | jsPDF / pdf-lib |

**经验法则**：

- 「我有数据，要**从零拼**一份 ppt」→ **PptxGenJS**（最强场景）。
- 「我有一份精心做好的 **ppt 模板**，只想替换里面的字/图」→ 这不是 PptxGenJS 的活，用 **pptx-automizer**。
- 「我要在网页里**预览** ppt」→ PptxGenJS 帮不上，得另找渲染/转换方案。

## 十、一个端到端的完整例子

```ts
import pptxgen from 'pptxgenjs';

const pres = new pptxgen();
pres.author = '数据团队';
pres.title = '季度报告';
pres.layout = 'LAYOUT_WIDE';

// 母版
pres.defineSlideMaster({
  title: 'BRAND',
  background: { color: 'FFFFFF' },
  objects: [{ rect: { x: 0, y: 0, w: '100%', h: 0.6, fill: { color: '0088CC' } } }],
  slideNumber: { x: 0.3, y: '95%', color: '999999' },
});

// 标题页
pres.addSlide({ masterName: 'BRAND' }).addText('2026 Q2 季度报告', {
  x: 1, y: '40%', w: '80%', h: 1.5, fontSize: 40, bold: true, align: 'center',
});

// 数据页
const slide = pres.addSlide({ masterName: 'BRAND' });
slide.addChart(
  pres.ChartType.bar,
  [{ name: '销量', labels: ['一', '二', '三'], values: [150, 460, 515] }],
  { x: 1, y: 1.2, w: 11, h: 5, barDir: 'col', showTitle: true, title: '月度销量', showValue: true },
);
slide.addNotes('讲解：三月环比增长显著。');

// 输出（异步！）
await pres.writeFile({ fileName: 'Q2.pptx', compression: true });
```

---

回到 [入门](../getting-started) 复习四步流程，或查 [参考](../reference) 速览 API、枚举与输出形态。
