---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **9.x**。深入边界与权衡：Packer 四种导出与环境差异、流式写大文件、内嵌字体、SVG 回退、`patchDocument` 模板补丁、`.docx` 内部结构（OOXML/OPC），以及与 docxtemplater / mammoth 的选型。

## 一、Packer 四法与环境差异

Packer 与 Document 完全解耦，提供四种导出（**全部异步，返回 Promise**）：

| 方法 | 返回 | 场景 |
|---|---|---|
| `toBuffer(doc)` | Node `Buffer`（**浏览器里是 `Uint8Array`**） | Node 写盘 / 作 HTTP 响应体 |
| `toBlob(doc)` | `Blob` | 浏览器下载 |
| `toBase64String(doc)` | Base64 字符串 | 内嵌、传输、邮件附件 |
| `toStream(doc)` | 可读流 | Node 流式写超大文档 |

```ts
// Node 写盘
Packer.toBuffer(doc).then((buf) => fs.writeFileSync('out.docx', buf));

// 浏览器下载
Packer.toBlob(doc).then((blob) => saveAs(blob, 'out.docx'));
```

::: warning toBuffer 的跨环境陷阱
`toBuffer` 在 Node 给 `Buffer`、**在浏览器给 `Uint8Array`**（浏览器没有 Node Buffer）。跨环境代码别假设拿到的一定是 Buffer；浏览器下载请直接用 `toBlob`。
:::

可选参数：第二个 `prettify`（布尔/缩进字符）让输出 XML 缩进美化，便于调试（生产不开，增大体积）；第三个 `overrides` 可覆写包内某些子文件。

## 二、Node：流式写大文件

超大文档用 `toStream` 边生成边写，降低内存峰值：

```ts
import * as fs from 'fs';

const stream = Packer.toStream(doc);
stream.pipe(fs.createWriteStream('big.docx'));
stream.on('end', () => console.log('done'));
```

> `toBuffer` 会把整个文件一次性载入内存；大文档优先 `toStream`。Base64 体积更大、最不省内存。

## 三、Node：作为 HTTP 响应返回

服务端通常不落盘，用 `toBuffer` 拿字节直接作响应体：

```ts
app.get('/report', async (req, res) => {
  const doc = buildDoc(req.query); // 按数据动态生成
  const buf = await Packer.toBuffer(doc);
  res.setHeader('Content-Disposition', 'attachment; filename="report.docx"');
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
  res.send(buf);
});
```

## 四、内嵌自定义字体

只在 TextRun 写 `font: 'XXX'` 不够——缺该字体的机器会回退。要可靠显示需**把字体数据嵌进文档**：

```ts
const doc = new Document({
  fonts: [{ name: 'Pacifico', data: fs.readFileSync('Pacifico.ttf') }],
  sections: [
    { children: [new Paragraph({ children: [new TextRun({ text: 'Hi', font: 'Pacifico' })] })] },
  ],
});
```

> 内嵌后字体随 `.docx` 一起分发，离线也能正确呈现（代价是体积增大）。docx **不会**自动扫描系统字体打包，需你显式提供数据。

## 五、SVG：需回退位图

```ts
new ImageRun({
  type: 'svg',
  data: svgBuffer,
  transformation: { width: 100, height: 100 },
  fallback: { type: 'png', data: pngBuffer }, // 不支持 SVG 的阅读器显示这张
});
```

> 因部分阅读器对 Word 内 SVG 支持不一，docx 要求 SVG **同时带一张回退位图**。PNG/JPG 等栅格图无此要求。

## 六、patchDocument：往模板打补丁

`docx` 除了从零生成，还能**在已有 `.docx` 模板里替换占位符**。模板里用 mustache 写 `{{tag}}`：

```ts
import { patchDocument, PatchType, TextRun, Paragraph } from 'docx';
import * as fs from 'fs';

const patched = await patchDocument({
  outputType: 'nodebuffer',
  data: fs.readFileSync('template.docx'),
  patches: {
    name: { type: PatchType.PARAGRAPH, children: [new TextRun('John Doe')] }, // 段内替换
    intro: { type: PatchType.DOCUMENT, children: [new Paragraph('整段/表格替换')] }, // 块级替换
  },
});
fs.writeFileSync('out.docx', patched);
```

> `PatchType.PARAGRAPH` 在段落**内部**替换片段，`PatchType.DOCUMENT` 替换整段或插入块级元素（如表格）。这与 docxtemplater 思路相近，但 API 贴近 docx。

## 七、`.docx` 的真面目：ZIP + OOXML

把生成的 `.docx` 用 zip 工具解压，会看到：

```text
[Content_Types].xml      # 内容类型声明
_rels/.rels              # 顶层关系
word/document.xml        # 正文（WordprocessingML）
word/styles.xml          # 样式
word/_rels/...           # 部件间关系
word/media/...           # 图片等媒体
```

> `.docx` 本质是 **ZIP（OPC 包）+ 一组 OOXML 部件**。docx 库做的就是把对象树序列化成这些部件再打包。理解这点便于排查问题，甚至用 Packer 的 `overrides` 覆写某个子文件。

## 八、能力边界

- **公式**：支持数学公式排版（`Math`/`MathRun` → OMML），但**无内置高层图表 API**；插图表通常先渲成图片再用 `ImageRun`。
- **字段类内容**：目录、页码总数等是「字段」，docx 只放占位，**真实值由 Word 打开更新域**才生成。
- **不解析**：把已有 `.docx` 读出来转 HTML/纯文本不是它的活（见下选型）。

## 九、docx vs docxtemplater vs mammoth：怎么选

| 维度 | **docx** | **docxtemplater** | **mammoth** |
|---|---|---|---|
| 方向 | **生成 / 修改** | 模板填充 | **解析 / 读取** |
| 典型用法 | 用代码从零搭结构 | 设计师在 Word 排模板，代码填 `{{占位符}}` | 把 `.docx` 转 HTML/纯文本 |
| 复杂既有版式 | 复刻成本高 | **强**（保留模板原貌） | — |
| 动态结构 | **强**（map/循环/条件） | 一般（受模板约束） | — |
| 环境 | Node + 浏览器 | Node + 浏览器 | 主要 Node |

**经验法则**：

- 结构高度可变、**数据驱动从零生成** → **docx**。
- 设计师已排好精美模板、只想**填数据** → **docxtemplater**。
- 要把上传的 `.docx`**读出来展示** → **mammoth**。
- 三者并不互斥：可用 docxtemplater 填模板、再用 mammoth 把结果转 HTML 预览。

## 十、几条实战提醒

- **单位别混**：字号半磅、间距/宽度 twips、绘图 EMU（1in=914400）。
- **样式要配套**：用 `heading`/列表就得在 `styles` 定义对应 `HeadingX`/`ListParagraph`。
- **别共享引用**：用工厂/`map` 按数据**每次新建**元素实例，别把同一对象塞到树多处。
- **浏览器无 fs**：下载走 `toBlob` + `saveAs`，不要 `import fs`。

---

回到 [入门](../getting-started) 复习生成与导出，或查 [参考](../reference) 速览类、枚举与单位换算。
