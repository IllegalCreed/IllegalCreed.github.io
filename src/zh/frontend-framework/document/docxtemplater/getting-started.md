---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你装上 docxtemplater 并完成第一次「模板 → 文档」。版本基线 **3.69.0**。核心认知：**文档是 zip，必须配 PizZip 加载**；模板里写 `{标签}`，代码里 `render(data)` 填数据；导出在 Node 用 `toBuffer()`、浏览器用 `toBlob()`。

## 速查

- 安装：`npm install docxtemplater pizzip`
- 读模板（Node，按二进制）：`const content = fs.readFileSync('tpl.docx', 'binary')`
- 加载 zip：`const zip = new PizZip(content)`
- 建实例：`const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })`
- 填数据：`doc.render({ first_name: 'John' })`
- 导出（Node）：`const buf = doc.toBuffer(); fs.writeFileSync('out.docx', buf)`
- 导出（浏览器）：`saveAs(doc.toBlob(), 'out.docx')`（配 FileSaver）
- expressions：另装 `angular-expressions@^1.5.2`，再把 `docxtemplater/expressions.js` 传给 `parser`
- ⚠️ 默认解析器**不支持** `{user.name}` 嵌套；截至本基线，`angular-expressions` 必须至少为 1.5.2
- ⚠️ 读模板用 `'binary'`/Buffer，**别用 `'utf8'`**（会破坏二进制 zip）

## 一、docxtemplater 是什么

官方定位：「**用模板填充生成 Office 文档**」。三个关键点：

1. **模板填充**：非程序员在 Word/PPT/Excel 里排版并写 `{标签}`，开发只填数据。
2. **格式边界**：免费核心支持 docx/pptx；xlsx 需要商业模块，不能因三者都是 zip + XML 就推断核心都能处理。
3. **开放核心**：核心免费（MIT/GPLv3），图片/HTML/图表/XLSX 等是付费模块。

> 边界提醒：它**不是**编辑器，也**不**从零画文档（那是 `docx` 库）；复杂版式先在 Office 里做好，docxtemplater 只负责把数据填进去。

## 二、安装

```bash
# 核心库 + 必配的 zip 加载库
npm install docxtemplater pizzip

# 浏览器端再按需装：拉模板的 pizzip-utils、下载用的 file-saver
npm install pizzip-utils file-saver
```

::: warning 为什么必须装 PizZip
docx/pptx（以及商业 xlsx 模块处理的文件）本质是 **ZIP 压缩包**，docxtemplater **自身不解压**。官方要求用 PizZip 把模板读成可操作的 zip 对象再交给它。少装 PizZip 就无法加载模板。
:::

## 三、准备模板

新建一个 `tpl.docx`，在 Word 里输入正文，需要动态内容处写标签：

```text
尊敬的 {first_name} {last_name}：
您于 {date} 下单的商品如下。
```

> 3.69.0 能识别同一段内被 Word 拆到多个 text run 的普通标签；真正需要避免的是让单个 `{tag}` 的字符跨越段落、表格单元格等结构边界，或混入全角花括号/不可见字符。区块的开闭标签仍可各占一个段落。排错见[专家篇](./guide-line/expert)。

## 四、第一次「填充」（Node）

```ts
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'node:fs';

// 1. 按二进制读模板（不能用 utf8，会破坏 zip）
const content = fs.readFileSync('tpl.docx', 'binary');

// 2. PizZip 加载成 zip 对象
const zip = new PizZip(content);

// 3. 建实例（两个常用选项见下）
const doc = new Docxtemplater(zip, {
  paragraphLoop: true, // 段落级循环去多余空行
  linebreaks: true,    // 数据里的 \n 渲染成真正换行
});

// 4. 填数据（同步替换）
doc.render({
  first_name: 'John',
  last_name: 'Doe',
  date: '2026-06-15',
});

// 5. 导出 Buffer 并写盘（docxtemplater@3.62.0+）
const buf = doc.toBuffer();
fs.writeFileSync('out.docx', buf);
```

> `render(data)` 是**同步**方法，把 `{first_name}` 替换成 `John`。导出用 `toBuffer()`（等价老写法 `doc.getZip().generate({ type: 'nodebuffer' })`）。

## 五、第一次「填充」（浏览器）

浏览器没有文件系统，先用 PizZipUtils 以**二进制**拉模板，渲染后用 `toBlob()` + FileSaver 触发下载：

```ts
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';

PizZipUtils.getBinaryContent('/tpl.docx', (err, content) => {
  if (err) throw err;
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render({ first_name: 'John', last_name: 'Doe' });
  // toBlob() 自 3.62.0；老写法 doc.getZip().generate({ type: 'blob' })
  saveAs(doc.toBlob(), 'out.docx');
});
```

> 拉模板必须**按二进制**（`getBinaryContent` 或 `fetch().then(r => r.arrayBuffer())`）；**不能** `r.text()`，UTF-8 解码会破坏二进制 zip。

## 六、循环与条件（免费核心）

```text
{#products}
- {name}：{price} 元
{/products}

{^products}
（暂无商品）
{/products}
```

```ts
doc.render({
  products: [
    { name: '键盘', price: 199 },
    { name: '鼠标', price: 99 },
  ],
});
```

> `{#products}...{/products}` 是区块标签：数组时**循环**、真值时**条件**；循环内作用域切到当前元素，故直接写 `{name}`。`{^products}` 是**反向区块**，仅当 products 为 falsy（空数组等）时渲染。

## 七、一个必知的坑：嵌套属性

```text
{user.name}   ← 默认解析器把它当成字面键名 "user.name"，取不到嵌套值！
```

要支持 `{user.name}`、`{price + tax}`、`{users.length > 1}`，必须启用免费的 **expressions 解析器**：

```bash
npm install angular-expressions@^1.5.2
```

```ts
import expressionParser from 'docxtemplater/expressions.js';

const doc = new Docxtemplater(zip, {
  parser: expressionParser, // 启用点号 / 运算 / 比较 / 过滤器
  paragraphLoop: true,
  linebreaks: true,
});
```

::: warning expressions 的安全版本线
适配器文件来自 docxtemplater，但底层 `angular-expressions` 是独立依赖。官方 2026-05 安全公告要求至少使用 **1.5.2**；安装时应取满足该下限的当前版本，并纳入依赖更新与审计。
:::

---

跑通第一次填充后，进入 [指南 · 基础](./guide-line/base)：标签类型全览、作用域模型、expressions 解析器与默认解析器的差异。
