---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **3.69.0**。把 docxtemplater 用进真实项目：表格行循环、异步数据 `renderAsync`、浏览器下载、Node 服务端把文档作为响应返回、错误聚合处理、自定义分隔符。

## 速查

- 表格行循环：开闭区块标签放在**同一模板行**的首尾单元格，避免把表头一起复制
- Promise 数据：`await doc.renderAsync(data)`；它异步解析数据，最终 XML 渲染仍同步占用 CPU
- 浏览器模板必须按 ArrayBuffer/二进制读取，导出 `doc.toBlob()`；Node 导出 `doc.toBuffer()`
- 构造函数会立即编译，结构错误可能在 `new Docxtemplater(...)` 时抛出；MultiError 子错误在 `error.properties.errors`
- 保留大量字面花括号时用 `delimiters` 或 `{=[[ ]]=}`，不要自行发明反斜杠转义
- 每份输出新建 Docxtemplater 实例；商业模块实例也不要跨多个文档实例复用

## 一、表格里按数据增删行（免费）

最常用的需求之一：表格行数随数据变化。做法是把**循环区块标签放进表格行的单元格**——docxtemplater 会按数组长度复制整行。

在 Word 表格里这样写（开/闭标签放在行首尾单元格）：

```text
| 姓名 | 金额 |
| {#rows}{name} | {amount}{/rows} |
```

```ts
doc.render({
  rows: [
    { name: '张三', amount: 100 },
    { name: '李四', amount: 200 },
  ],
});
```

> 这是**免费核心**能力，不需要付费的 table 模块（table 模块面向更复杂的跨行合并、嵌套表格等）。配合 `paragraphLoop: true` 可避免多余空行。

## 二、异步数据：renderAsync

数据字段是 Promise（要先发 HTTP 请求、查数据库）时，**不能用同步 `render`**（它不会等 Promise）。改用 `renderAsync`：

```ts
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

await doc.renderAsync({
  user: new Promise((resolve) => {
    // 可以是 HTTP 请求 / 数据库查询 / 外部 API
    setTimeout(() => resolve('John'), 1000);
  }),
});

const buf = doc.toBuffer();
fs.writeFileSync('out.docx', buf);
```

> `renderAsync(data)` 返回 Promise，内部先 resolve 数据里的 Promise，再同步执行最终渲染；它不会把 CPU 密集的 XML 编译/渲染自动移出主线程。旧链式 `resolveData()` 写法已弃用；浏览器批量生成或大模板应放到 Worker，并限制并发。

## 三、浏览器：拉模板 + 触发下载

```ts
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';

function loadFile(url, cb) {
  PizZipUtils.getBinaryContent(url, cb); // 必须二进制
}

loadFile('/tpl.docx', (err, content) => {
  if (err) throw err;
  const doc = new Docxtemplater(new PizZip(content), {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render({ first_name: 'John' });
  saveAs(doc.toBlob(), 'out.docx'); // toBlob 自 3.62.0
});
```

也可用 `fetch` 拉模板，但务必取 `arrayBuffer()`（**不能** `text()`）：

```ts
const content = await (await fetch('/tpl.docx')).arrayBuffer();
const doc = new Docxtemplater(new PizZip(content), { paragraphLoop: true });
```

## 四、Node 服务端：把文档作为响应返回

服务端通常**不落地磁盘**，用 `toBuffer()` 拿字节直接作为响应体：

```ts
// Express 示例
app.get('/contract', (req, res) => {
  const content = fs.readFileSync('tpl.docx', 'binary');
  const doc = new Docxtemplater(new PizZip(content), {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render({ name: req.query.name });

  const buf = doc.toBuffer();
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
  res.setHeader('Content-Disposition', 'attachment; filename="contract.docx"');
  res.send(buf);
});
```

> docx 的 MIME 是 `...wordprocessingml.document`。**不要** `res.json(buf)`——JSON 序列化会破坏二进制。

## 五、错误处理：聚合的可读信息

模板有多处问题时，docxtemplater 抛出 **MultiError**，把全部子错误放在 `error.properties.errors`：

```ts
try {
  doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
} catch (error) {
  if (error.properties && Array.isArray(error.properties.errors)) {
    const messages = error.properties.errors
      .map((e) => e.properties.explanation)
      .join('\n');
    console.log(messages);
    // 如：The tag beginning with "foobar" is unopened
  }
  throw error;
}
```

> 注意两个抛错时机：**构造/编译时**抛模板结构错误（标签未闭合等，TemplateError）；**render 时**抛数据/解析错误。`error.properties.id` 可用于程序化区分错误类型。

## 六、自定义分隔符

文档里本就有花括号、或与默认 `{}` 冲突时，换分隔符：

```ts
const doc = new Docxtemplater(zip, {
  delimiters: { start: '[[', end: ']]' },
});
// 模板里标签写成 [[name]]
```

> docxtemplater **没有**「反斜杠转义单个花括号」的机制；要在文档里大量保留字面花括号，**换分隔符**是最干净的办法。也可用行内指令 `{=[[ ]]=}` 临时切换。

## 七、把多个模块一起挂（付费模块）

新版用构造选项的 `modules` 数组传入模块实例（多为付费）：

```ts
import expressionParser from 'docxtemplater/expressions.js';
// import ImageModule from 'docxtemplater-image-module'; // 付费

const doc = new Docxtemplater(zip, {
  parser: expressionParser,
  modules: [/* new ImageModule(opts) */],
  paragraphLoop: true,
  linebreaks: true,
});
```

> 旧链式 `.attachModule(mod)` 已不推荐；统一在构造函数一次传入。

::: warning 模块实例不要共享
Docxtemplater 实例只能渲染一次；模块对象也会持有文档状态。批量生成时可以缓存模板的原始二进制，但每份输出都要重新创建 PizZip、模块实例与 Docxtemplater。
:::

---

进入 [指南 · 专家](./expert)：免费/付费边界、模板结构边界、授权、性能与 docx/SheetJS 的选型。
