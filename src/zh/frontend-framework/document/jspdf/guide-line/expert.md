---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **4.2.1**。深入边界与权衡：中文字体嵌入与子集化、原生绘制 vs `.html()` context2d 转换、Node 服务端生成、体积优化（`compress`/`putOnlyUsedFonts`/图片 `alias`）、安全边界，以及与 pdfmake / @react-pdf / pdf-lib 的选型。

## 速查

- 自定义字体要转为 binary/base64 字符串后 `addFileToVFS()`，再 `addFont()` / `setFont()`
- 大字体转 binary string 要分块，不能对数 MB Uint8Array 直接展开调用 `fromCharCode`
- `putOnlyUsedFonts` 是字体级剔除，不是字符子集；真正瘦身应预先 subset TTF
- `.html()` 的文本通常走 jsPDF context2d，不能概括为整页位图；复杂效果仍会降级/栅格化
- Node 可直接 `save()` 写盘或 `output('arraybuffer')` 回响应；`.html()` 仍需要 DOM
- Node 读取本地字体/图片默认受限，优先传字节；路径读取用 Node permission flags
- 重复图片可用稳定 alias 复用，Blob URL 需在生命周期结束时释放
- 安全最低线 4.2.1，且所有用户输入都先 sanitize/校验

## 一、中文字体：嵌入三步与原理

内置 14 标准字体（helvetica/times/courier 系）**只覆盖 ASCII**，写中文必乱码。正确流程：

```ts
// base64 字体串可用官方 fontconverter（/fontconverter/fontconverter.html）生成
doc.addFileToVFS('SourceHan.ttf', base64Font);   // ① 放进虚拟文件系统 VFS
doc.addFont('SourceHan.ttf', 'SourceHan', 'normal'); // ② 注册（VFS 名, 族名, 样式）
doc.setFont('SourceHan');                          // ③ 切换后再 text
doc.text('你好，世界', 10, 10);
```

运行时动态加载字体（避免把巨大 base64 写进打包产物）：

```ts
const buf = await (await fetch('/fonts/SourceHan.ttf')).arrayBuffer();
const bytes = new Uint8Array(buf);
let binary = '';
for (let i = 0; i < bytes.length; i += 0x8000) {
  binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
}
doc.addFileToVFS('SourceHan.ttf', binary);
doc.addFont('SourceHan.ttf', 'SourceHan', 'normal');
doc.setFont('SourceHan');
```

> 不要写 `String.fromCharCode(...new Uint8Array(buf))`：几 MB 的 CJK 字体会超过函数参数上限并抛 `RangeError`。分块转换，或在 Node 直接从 Buffer 构造 binary string。

> 想要加粗：把**粗体 TTF** 用 `addFont('X-Bold.ttf', 'X', 'bold')` 再注册一次，之后 `setFont('X', 'bold')` 才有效；否则会回退。

## 二、体积：中文字库的代价与子集化

完整中文 TTF 覆盖数千~数万汉字，常达 **数 MB**（思源黑体单字重可达 5~15MB）。`addFileToVFS` 嵌入后，**生成的 PDF 会显著变大**，前端加载字体与首次生成耗时也增加。优化手段：

- **字体子集化（subset）**：用工具（如 `fonttools pyftsubset`）只保留实际用到的字符，把字库从数 MB 压到几十 KB——最有效。
- **`putOnlyUsedFonts: true`**：构造时开启，只把**用到的字体**写进 PDF（字体级裁剪，注册了多个字体只用一两个时有效）。
- **`compress: true`**：压缩 PDF 内容流（FlateDecode），整体减小体积。

```ts
const doc = new jsPDF({ compress: true, putOnlyUsedFonts: true });
```

> `putOnlyUsedFonts` 是「不嵌入没用到的整个字体」，**不是字符级子集**；要字符级瘦身仍需预先 subset。

## 三、原生绘制 vs html()：核心取舍

这是 jsPDF 最该想清楚的一道选择题。

| 维度 | 原生 `text()` | `.html()`（html2canvas + jsPDF context2d） |
|---|---|---|
| 文字本质 | PDF 文本指令 | 支持的文本也映射为 PDF 文本；部分效果会栅格化 |
| 可选中 / 搜索 | 可 | 通常可，需用目标阅读器实测字体与分段 |
| 布局确定性 | 高，坐标由你控制 | 较低，受 CSS 支持、字体与自动分页影响 |
| 体积 | 通常较小 | 取决于图片/效果与页面复杂度 |
| 还原复杂 CSS | 需手写布局 | 复用 DOM 较快，但不是完整浏览器打印引擎 |
| 中文 | 需嵌入字体 | 仍要正确提供/映射字体，不能只依赖屏幕显示正常 |
| 依赖 | 无 | html2canvas（+dompurify），依赖 DOM |

**经验法则**：

- **布局固定、要可选/可搜、打印锐利**（发票/证书/标签/报表）→ **原生绘制**（+ autotable 表格）。
- **要快速复用现成 DOM，能接受 CSS/分页差异** → **`.html()`**，并对真实文件做阅读器抽检。
- 两者可混用：主体用 text/autotable 保证稳定版式，个别 DOM 区块交给 `.html()`。

## 四、Node 服务端生成

jsPDF 在 Node 也能跑（dist 含 `jspdf.node.*.js`）。与浏览器的差异只在「落地方式」与「对 DOM 的依赖」：

```ts
// Express：把 PDF 字节作为响应返回（不落地磁盘）
import { jsPDF } from 'jspdf';

app.get('/invoice', (req, res) => {
  const doc = new jsPDF();
  doc.text('Invoice #123', 10, 10);
  const buf = Buffer.from(doc.output('arraybuffer')); // 拿字节
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
  res.send(buf);
});
```

> 核心绘制 API（text/rect/addImage/autotable）两端一致；但 **`.html()` 依赖 DOM 与 html2canvas，纯 Node 不可用**（要 html→PDF 的服务端方案，通常改用 Puppeteer 无头浏览器）。

jsPDF 4.x 默认禁止 Node 构建直接读取任意本地路径。优先自己用 `fs.readFile()` 取得字节再传入；确需让 jsPDF 从路径读字体/图片时，使用 Node `--permission --allow-fs-read=...`，`doc.allowFsRead` 仅作为较弱的兼容兜底。

## 五、图片体积：alias 复用

多页页眉/水印重复同一张图时，给 `addImage` 传**相同 alias**，jsPDF 会复用已嵌入的同一份数据，而非重复嵌入：

```ts
for (let i = 1; i <= doc.getNumberOfPages(); i++) {
  doc.setPage(i);
  doc.addImage(logo, 'PNG', 10, 8, 30, 10, 'logoAlias'); // 同 alias → 只嵌一次
}
```

## 六、安全：sanitize 用户输入

官方明确建议：把内容传给 jsPDF 前**先净化**。4.2.1 又修复了 output HTML injection 与 free-text annotation color 的 PDF object injection；4.2.0/4.1.0 也包含 AcroForm、`addJS` 与恶意图片的安全修复。因此不要把“用了 DOMPurify”当成全部安全边界：锁定 4.2.1+，并校验文本、HTML、URL、颜色和图片尺寸/格式。

## 七、链接、压缩与高级模式

```ts
// 可点击超链接
doc.textWithLink('访问官网', 10, 10, { url: 'https://example.com' });
doc.link(10, 20, 40, 8, { url: 'https://example.com' }); // 矩形热区

// 高级模式：矩阵变换 / Pattern / FormObject（svg2pdf 依赖）
doc.advancedAPI((doc) => {
  // …底层绘制…
});
```

## 八、jsPDF vs pdfmake vs @react-pdf vs pdf-lib：怎么选

| 库 | 范式 | 适合 |
|---|---|---|
| **jsPDF** | 命令式绘图 | 像素级控制、票据/证书/标签、DOM 截图（html()）、轻量零框架 |
| **pdfmake** | 声明式 `docDefinition` JSON | 复杂自动流式排版（段落/表格/列/列表），布局引擎自动分页 |
| **@react-pdf/renderer** | 声明式 React 组件 + Flexbox | React 技术栈、组件化复用、复杂自动布局 |
| **pdf-lib** | 操作**已有** PDF | 读取/编辑/合并拆分/填表单域现有 PDF |
| **PDF.js** | 渲染/解析 | 在浏览器**查看**已有 PDF（非生成） |

**经验法则**：

- 要**生成**新 PDF、要精确控制或截图现成 DOM → **jsPDF**。
- 要**大量自动排版**、不想手算坐标 → **pdfmake** 或 **@react-pdf**（看技术栈）。
- 要**改已有** PDF（合并/填表）→ **pdf-lib**；只**看** PDF → **PDF.js**。

## 九、范式再强调

最后回到贯穿全篇的两条主线：

1. **jsPDF 是命令式绘图**——没有通用内容流，坐标、留白、换行和分页最终都由你负责。
2. **原生绘制 vs HTML 解释**——`.html()` 不是整页截图，受支持文本仍能成为 PDF 文本；真正的取舍是布局确定性、CSS 覆盖、字体和分页可控度。

---

回到 [入门](../getting-started) 复习创建与导出，或查 [参考](../reference) 速览构造选项、绘图/字体/导出 API 与 autotable。
