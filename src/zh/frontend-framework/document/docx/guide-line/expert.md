---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **9.7.1**。深入边界与权衡：Packer 输出与环境差异、Stream 的真实内存语义、内嵌字体、SVG 回退、`patchDocument` 模板补丁、`.docx` 内部结构（OOXML/OPC），以及与 docxtemplater / mammoth 的选型。

## 速查

- `toBuffer` / `toBlob` / `toArrayBuffer` / `toBase64String` / `toString` 都返回 Promise；`toStream` 同步返回 Stream
- 浏览器选 `toBlob` 或 `toArrayBuffer`，不要依赖 Node 专用的 `toBuffer`
- `toStream` 9.7.1 仍先在内存中生成完整 Buffer，再一次性发出；它解决接口衔接，不保证降低峰值内存
- 内嵌字体通过 `Document.fonts` 提供字体数据；SVG 图片必须附栅格 `fallback`
- `patchDetector({ data })` 可先扫描 <code v-pre>{{tag}}</code>，`patchDocument` 支持输出类型、自定义分隔符、保留样式与递归补丁
- 复杂既有模板优先 docxtemplater；读取/转换现有 docx 优先 mammoth

## 一、Packer 输出与环境差异

Packer 与 Document 完全解耦。便捷方法覆盖常见输出，底层还可用泛型 `pack(doc, type)` 选择 `uint8array`、`arraybuffer`、`blob`、`nodebuffer` 等类型：

| 方法 | 返回 | 场景 |
|---|---|---|
| `toBuffer(doc)` | `Promise<Buffer>` | Node 写盘 / HTTP 响应体 |
| `toBlob(doc)` | `Promise<Blob>` | 浏览器下载 |
| `toArrayBuffer(doc)` | `Promise<ArrayBuffer>` | Web API / Worker 传输 |
| `toBase64String(doc)` | `Promise<string>`（Base64） | 内嵌、传输、邮件附件 |
| `toString(doc)` | `Promise<string>`（ZIP 二进制字符串） | 兼容场景；不是 `document.xml` 文本 |
| `toStream(doc)` | `Stream`（立即返回） | 对接 `pipe()` 等 Node 流接口 |

```ts
// Node 写盘
Packer.toBuffer(doc).then((buf) => fs.writeFileSync('out.docx', buf));

// 浏览器下载
Packer.toBlob(doc).then((blob) => saveAs(blob, 'out.docx'));
```

::: warning 按环境选公开出口
`toBuffer` 的 TypeScript 签名是 `Promise<Buffer>`，用于 Node。浏览器下载用 `toBlob`，需要裸二进制用 `toArrayBuffer`；若确实要 Uint8Array，调用 `Packer.pack(doc, 'uint8array')`，不要依赖打包器对 Node Buffer 的垫片行为。
:::

可选参数：第二个 `prettify`（布尔/缩进字符）让输出 XML 缩进美化，便于调试（生产不开，增大体积）；第三个 `overrides` 可覆写包内某些子文件。

## 二、toStream：流接口不等于增量生成

`toStream` 可以直接接入 Node 流管道：

```ts
import * as fs from 'fs';

const stream = Packer.toStream(doc);
stream.pipe(fs.createWriteStream('big.docx'));
stream.on('end', () => console.log('done'));
```

::: warning 9.7.1 的实现边界
当前实现先异步生成完整 `nodebuffer`，完成后再通过 Stream 一次发出，因此它**不会边构建 OOXML 边写盘，也不保证降低内存峰值**。超大文档仍需压测并设置任务并发/内存上限；Base64 还会额外膨胀体积。
:::

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

`docx` 除了从零生成，还能**在已有 `.docx` 模板里替换占位符**。模板里用 mustache 写 <code v-pre>{{tag}}</code>：

```ts
import { patchDetector, patchDocument, PatchType, TextRun, Paragraph } from 'docx';
import * as fs from 'fs';

const data = fs.readFileSync('template.docx');
const keys = await patchDetector({ data }); // ['name', 'intro']

const patched = await patchDocument({
  outputType: 'nodebuffer',
  data,
  patches: {
    name: { type: PatchType.PARAGRAPH, children: [new TextRun('John Doe')] }, // 段内替换
    intro: { type: PatchType.DOCUMENT, children: [new Paragraph('整段/表格替换')] }, // 块级替换
  },
  keepOriginalStyles: true,
  recursive: false,
});
fs.writeFileSync('out.docx', patched);
```

> `patchDetector` 先列出默认 <code v-pre>{{tag}}</code> 占位符。`PatchType.PARAGRAPH` 在段落**内部**替换片段，`PatchType.DOCUMENT` 替换整个段落级元素并可放入 Paragraph/Table；还可用 `placeholderDelimiters` 改分隔符、用 `recursive` 继续处理补丁新生成的占位符。

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
| 典型用法 | 用代码从零搭结构 | 设计师在 Word 排模板，代码填 `{占位符}` | 把 `.docx` 转 HTML/纯文本 |
| 复杂既有版式 | 复刻成本高 | **强**（保留模板原貌） | — |
| 动态结构 | **强**（map/循环/条件） | 一般（受模板约束） | — |
| 环境 | Node + 浏览器 | Node + 浏览器 | Node + 浏览器 |

**经验法则**：

- 结构高度可变、**数据驱动从零生成** → **docx**。
- 设计师已排好精美模板、只想**填数据** → **docxtemplater**。
- 要把上传的 `.docx`**读出来展示** → **mammoth**。
- 三者并不互斥：可用 docxtemplater 填模板、再用 mammoth 把结果转 HTML 预览。

## 十、几条实战提醒

- **单位别混**：字号半磅、间距/宽度 twips、绘图 EMU（1in=914400）。
- **区分样式来源**：标题/列表常用内置样式可直接用；业务自定义样式要在 `Document.styles` 注册稳定 ID。
- **别共享引用**：用工厂/`map` 按数据**每次新建**元素实例，别把同一对象塞到树多处。
- **浏览器无 fs**：下载走 `toBlob` + `saveAs`，不要 `import fs`。

---

回到 [入门](../getting-started) 复习生成与导出，或查 [参考](../reference) 速览类、枚举与单位换算。
