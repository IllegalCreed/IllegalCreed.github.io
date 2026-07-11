---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **1.17.1**。深入边界与权衡：`embedPage` 整页复用与 **N-up 拼版**、**加密 PDF** 的限制、`save`/`parse` 性能调优、**维护停滞与 `@cantoo/pdf-lib`**、图片/JPEG 边界、以及与 **jsPDF** 的选型。

## 速查

- 整页复用：`embedPage` / `embedPages` 把源页变为 `PDFEmbeddedPage`，再用 `drawPage` 缩放拼版
- 加密边界：原库 `1.17.1` 不解密；不要用 `ignoreEncryption` 代替密码处理
- 性能：浏览器调低 `objectsPerTick` 以保持响应，服务端可按压测调高；大文件解析可移入 Worker
- 图片：原库直接嵌入 PNG 和常见 baseline/progressive JPEG，不做图片转码；完整 SVG 不是原库能力
- fork：`@cantoo/pdf-lib@2.7.1` 增加密码、`saveIncremental(snapshot)` / `commit()` 和整段 SVG；迁移必须回归
- 选型：改既有 PDF / 表单用 pdf-lib；HTML 排版用浏览器打印方案；屏幕渲染与文本提取用 PDF.js

## 一、embedPage：把整页当「可重复绘制的对象」

`copyPages` 把页变成**独立新页**（成为目录里的正式页）；`embedPage`/`embedPdf` 则把页变成 **PDFEmbeddedPage**——像图片一样可用 `drawPage` **叠加**到任意页、任意次。这是图章、缩略图、拼版的基础。

```ts
// 把模板首页作为「图章」盖到每一页右下角
const stampDoc = await PDFDocument.load(stampBytes);
const [stamp] = await pdfDoc.embedPdf(stampDoc, [0]); // 或 embedPage(somePage)

for (const page of pdfDoc.getPages()) {
  const { width } = page.getSize();
  page.drawPage(stamp, {
    x: width - 120, y: 40,
    width: 100, height: 100,
  });
}
```

## 二、N-up 拼版：一页拼多页

用 `embedPages` 把源页变嵌入页，在一张新页上按网格 `drawPage` 多次缩放绘制。

```ts
const src = await PDFDocument.load(bytes);
const out = await PDFDocument.create();

const embedded = await out.embedPages(src.getPages());
const cols = 2, rows = 2;
const sheet = out.addPage(PageSizes.A4);
const { width, height } = sheet.getSize();
const cw = width / cols, ch = height / rows;

embedded.slice(0, cols * rows).forEach((ep, i) => {
  const col = i % cols, row = Math.floor(i / cols);
  sheet.drawPage(ep, {
    x: col * cw,
    y: height - (row + 1) * ch,   // 注意 y 向上
    width: cw,
    height: ch,
  });
});

const result = await out.save();
```

## 三、加密 PDF：pdf-lib 不解密

pdf-lib **不支持解密**。`load` 加密 PDF 默认抛 `EncryptedPDFError`。

```ts
import { EncryptedPDFError } from 'pdf-lib';

try {
  await PDFDocument.load(encryptedBytes);
} catch (e) {
  if (e instanceof EncryptedPDFError) {
    console.log('这是加密 PDF，pdf-lib 无法解密');
  }
}
```

`ignoreEncryption: true` 只是跳过这道保护检查，**不会使用密码解密内容**，不应进入业务示例。要处理加密 PDF，可先在受控服务端用 qpdf 等工具解密；若评估 `@cantoo/pdf-lib`，则使用其明确的 `password` 载入能力并补齐错误密码、权限位与输出加密回归。

## 四、性能：save 的 objectsPerTick 与 useObjectStreams

`save()` 是异步的，且内部**分批让出事件循环**，避免长时间卡死。

```ts
// 服务端批处理：调大 objectsPerTick 加速（更易短暂阻塞）
await pdfDoc.save({ objectsPerTick: 200 });

// 兼容老旧阅读器：关掉对象流（体积略大）
await pdfDoc.save({ useObjectStreams: false });
```

| 选项 | 默认 | 取舍 |
|---|---|---|
| `objectsPerTick` | 50 | 大=快但易阻塞；浏览器交互场景宜小 |
| `useObjectStreams` | true | true 体积小（PDF 1.5+）；个别老阅读器不支持时设 false |

## 五、性能：load 的 parseSpeed

```ts
import { ParseSpeeds } from 'pdf-lib';

// 服务端不在意短暂阻塞 → 最快解析
const doc = await PDFDocument.load(bytes, { parseSpeed: ParseSpeeds.Fastest });
```

> 浏览器交互场景相反：宁可慢些（默认 `Slow`）也不卡 UI。大文档解析建议放进 Web Worker。

## 六、保留原元数据

`load` 既有 PDF 再 save，默认会刷新 ModDate/Producer。审计等场景要原样保留：

```ts
const doc = await PDFDocument.load(bytes, { updateMetadata: false });
```

## 七、图片与 JPEG 的边界

- 原库直接嵌入 **PNG / JPEG**（`embedPng` / `embedJpg`），不负责 GIF/WebP 转码，也不解析完整 SVG 文档。
- `embedJpg` 读取 JPEG 的 SOF 标记并保留 DCT 数据，源码包含常见 baseline 与 progressive JPEG 标记；上线前仍应拿真实图片集做兼容测试。
- SVG **矢量** path 可用 `drawSvgPath(d, ...)`（传 `d` 字符串），但它不解析整段 `<svg>` 标签，复杂 SVG 需自行拆 path。

## 八、维护现状：原库停滞，活跃 fork 是 @cantoo/pdf-lib

这是选型时**最该知道的现状**：

| 维度 | `Hopding/pdf-lib`（原库） | `@cantoo/pdf-lib`（社区 fork） |
|---|---|---|
| 本次核验版本 | **1.17.1（2021 年底）** | **2.7.1** |
| 维护定位 | 原始项目，长期未发新版 | Cantoo 为自身产品路线维护的社区 fork |
| API 关系 | 原始 API 基线 | 延续大量原 API，同时加入 2.x 行为与新 API |
| 额外能力 | 不支持密码、增量保存、完整 SVG | `password`、`saveIncremental(snapshot)` / `commit()`、`embedSvg` / `drawSvg` |

```bash
# 先在迁移分支安装，再跑类型、PDF 快照与阅读器回归
npm uninstall pdf-lib
npm install @cantoo/pdf-lib@2.7.1
```

```ts
// 导入路径相近，但不能据此推断行为完全兼容
import { PDFDocument, StandardFonts, rgb } from '@cantoo/pdf-lib';
```

> `@cantoo/pdf-lib` 是社区维护的 **fork**，不是官方改名。其 README 明确说明维护优先服务 Cantoo 路线，无法承诺处理无关需求；迁移至少要覆盖载入、表单、字体、保存、目标阅读器与二进制体积回归。

## 九、pdf-lib vs jsPDF：怎么选

| 维度 | **pdf-lib** | **jsPDF** |
|---|---|---|
| 修改既有 PDF | **能**（load 后加页/盖章/填表单） | **不能**（只能新建） |
| 新建 PDF | 能 | 能（API 更偏「文档生成」） |
| 表单 AcroForm | **读写 + 填写 + 扁平化** | 较弱 |
| 整页复用 / 拼版 | **embedPage / drawPage** | 无 |
| 中文 | fontkit + embedFont（subset 需按字体验证） | addFont + VFS（也需自备字体） |
| HTML → PDF | 不支持（可用浏览器打印方案） | 有 `html()` 插件（由 html2canvas + jsPDF Context2D 协作，CSS 支持有限） |
| 维护 | **原库停滞**（用 @cantoo fork） | 活跃 |

**经验法则**：

- 要**修改 / 合并 / 拆分既有 PDF**、**填表单** → **pdf-lib**（独占能力）。
- 纯**从零生成**报表、且想要 `html()` 这类便利 → 可考虑 **jsPDF**。
- 要**读出 PDF 文字 / 渲染到屏幕** → 两者都不行，用 **PDF.js**。
- 需要密码、增量保存或完整 SVG → 评估 **`@cantoo/pdf-lib`** fork，并把它当一次正式升级。

## 十、能力边界回顾

pdf-lib **不做**：抽取既有文字、渲染到屏幕、就地改写原有文字、解密加密 PDF、把 HTML/CSS 转 PDF。它**专注**：用绘制式 API 创建与修改 PDF 内容。把边界划清，就不会用错工具。

---

回到 [入门](../getting-started) 复习 create/load 双入口，或查 [参考](../reference) 速览 API、绘制选项与表单方法。
