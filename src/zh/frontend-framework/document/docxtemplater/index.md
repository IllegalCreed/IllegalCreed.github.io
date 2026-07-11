---
layout: doc
---

# docxtemplater

::: tip 本篇范围
本篇聚焦 **docxtemplater 3.69.0**：免费核心用模板填充 **docx / pptx**，xlsx 需要商业模块。重点在：**「模板 + 数据 → 文档」的填充模型**、必配的 **PizZip** 加载、`{tag}` 占位符 / `{#loop}{/loop}` 循环 / `{^cond}{/cond}` 条件、默认解析器的局限与 **expressions（angular）解析器**、异步数据 `renderAsync`、错误聚合 `error.properties.errors`、浏览器（`toBlob` + FileSaver）与 Node（`toBuffer`）差异，以及最关键的 **开放核心边界**——核心免费，图片/HTML/图表/XLSX 等是商业模块。
:::

docxtemplater 的官方定位是「**用模板生成 Office 文档**」——让**非程序员**在自己熟悉的 Office 软件里排好版、在动态处写上 `{标签}`，开发只负责调 `render(data)` 把后端 JSON 填进去。免费核心直接处理 docx 与 pptx；xlsx 属于商业模块。它做的是 **Office Open XML（OOXML）** 文档的「模板填充」，而不是从零用代码绘制文档（那是 `docx` 这类编程式库的路子）。

理解 docxtemplater 的关键有三点：**①** OOXML 文件本质是 **ZIP 压缩包**，docxtemplater 自己不解压，必须搭配 **PizZip** 把模板读进内存；**②** docx/pptx 免费核心与 xlsx 商业模块沿用同一套 `{tag}`/`{#loop}`/`{^cond}` 思路，但能力边界由文件类型与模块决定；**③** 它是 **open core（开放核心）**——核心库免费（MIT/GPLv3 双许可），图片、HTML、图表、XLSX 单元格、幻灯片高级操作、样式、脚注等是商业模块。一条高频认知坑：**默认解析器不支持点号嵌套属性**（`{user.name}` 会被当成字面键名）；expressions 适配器由 docxtemplater 导出，但还要单独安装 `angular-expressions`。

## 评价

**优点**

- **模板与代码解耦**：排版交给设计/业务人员用 Word 可视化完成，开发只填数据，分工清晰、改样式不动代码
- **标签语法直观**：`{name}` 替换、`{#list}{/list}` 循环、`{^empty}{/empty}` 条件，非程序员也易上手
- **跨 Office 模板复用思路**：免费核心支持 docx/pptx，xlsx 商业模块延续同类标签模型
- **浏览器 + Node 双端**：浏览器 `toBlob()` + FileSaver 下载、Node `toBuffer()` 写盘/作为响应返回
- **异步数据原生支持**：`renderAsync(data)` 可直接吃 Promise（HTTP/DB 取值），无需手动预解析
- **错误信息结构化**：多个模板错误聚合成 MultiError，`error.properties.errors` 逐条给出可读 `explanation`
- **核心免费可商用**：MIT/GPLv3 双许可，可按 MIT 闭源商用

**缺点**

- **关键能力需付费**：插图片、插 HTML、画图表、操作 xlsx 单元格、子模板等都在付费模块里，免费边界要算清
- **默认解析器很弱**：不支持 `{a.b}` 嵌套、比较、运算；expressions 适配器免费，但需另装并及时更新 `angular-expressions`
- **模板结构仍有边界**：同一段内跨多个 run 的普通标签可识别，但单个 `{tag}` 的字符不能跨段落/单元格等 OOXML 结构边界
- **依赖外部 zip 库**：必须配 PizZip 才能加载模板，少装就跑不起来
- **不是编辑器/排版器**：只填模板，复杂版式得先在 Office 里做好
- **raw XML 受限**：免费 `{@rawXml}` 仅段落级，插不了图片等复杂元素

## 文档地址

[docxtemplater Documentation](https://docxtemplater.com/docs/)

## GitHub 地址

[open-xml-templating/docxtemplater](https://github.com/open-xml-templating/docxtemplater)

## 幻灯片地址

<a href="/SlideStack/docxtemplater-slide/" target="_blank">docxtemplater</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=docxtemplater" target="_blank" rel="noopener noreferrer">docxtemplater 测试题</a>
