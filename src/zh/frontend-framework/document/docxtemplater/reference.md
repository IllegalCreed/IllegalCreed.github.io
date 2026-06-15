---
layout: doc
outline: [2, 3]
---

# 参考

> docxtemplater 常用标签语法、构造选项、核心方法、错误结构与免费/付费模块速查。版本基线 **3.x**。

## 一、标签类型（语法）

| 标签 | 作用 | 备注 |
|---|---|---|
| `{name}` | 占位符替换 | 默认分隔符 `{` `}` |
| `{#section}…{/section}` | 区块：数组→循环，真值→条件 | 循环内作用域切到当前元素 |
| `{^section}…{/section}` | 反向区块：falsy 时渲染 | 空数组/false/null 时显示 |
| `{/}` | 闭合**最近**打开的区块 | 等价 `{/name}`，省名字 |
| `{.}` | 当前元素本身 | 适合原始值数组（字符串/数字） |
| `{@rawXml}` | 插入原始 OOXML（不转义） | **仅段落级**；插不了图片等 |
| `{=[[ ]]=}` | 行内切换分隔符 | 之后标签写成 `[[tag]]` |

> 启用 expressions 解析器后，标签内还可写：点号 `{a.b}`、运算 `{x+y}`、比较 `{n>1}`、三元 `{c?a:b}`、过滤器 `{name | upper}`、下标 `{$index}`、赋值 `{full = a + b}`。

## 二、构造函数选项（new Docxtemplater(zip, options)）

| 选项 | 类型 | 默认 | 含义 |
|---|---|---|---|
| `paragraphLoop` | boolean | `false` | 开闭标签各占一段时，去掉循环产生的多余空段 |
| `linebreaks` | boolean | `false` | 把数据值里的 `\n` 渲染成文档换行 |
| `delimiters` | object | `{ start:'{', end:'}' }` | 自定义分隔符，如 `{ start:'[[', end:']]' }` |
| `parser` | function | 简单属性查找 | 传 `expressionParser` 启用表达式能力 |
| `nullGetter` | function | 普通标签返回 `'undefined'` | 自定义缺值（undefined）时的输出 |
| `modules` | array | `[]` | 传入（多为付费）模块实例 |
| `errorLogging` | string\|false | `'json'` | 错误日志格式；错误仍会照常抛出 |
| `syntax` | object | — | 如 `allowUnclosedTag` / `allowUnopenedTag` |

## 三、核心方法

| 方法 | 作用 | 备注 |
|---|---|---|
| `new Docxtemplater(zip, opts)` | 构造并编译模板 | 模板结构非法会在此抛 TemplateError |
| `doc.render(data)` | **同步**填充替换 | 数据含 Promise 时不可用 |
| `doc.renderAsync(data)` | **异步**填充，返回 Promise | 内部先 resolve 数据里的 Promise |
| `doc.toBuffer()` | 导出 Node Buffer | 3.62.0+；等价 `getZip().generate({type:'nodebuffer'})` |
| `doc.toBlob()` | 导出浏览器 Blob | 3.62.0+；等价 `getZip().generate({type:'blob'})` |
| `doc.getZip()` | 取底层 PizZip 对象 | 老写法 `.generate(opts)` 仍可用 |

> 旧链式 API（已不推荐）：`new Docxtemplater().attachModule().loadZip().setOptions().compile()` + `resolveData()` + `getZip().generate()`。新版统一在构造函数一次性传 `zip + options`（含 `modules`）。

## 四、expressions 解析器（免费）

| 项 | 说明 |
|---|---|
| 导入 | `const expressionParser = require('docxtemplater/expressions.js')` |
| 启用 | `new Docxtemplater(zip, { parser: expressionParser })` |
| 加过滤器 | `expressionParser.configure({ filters: { upper: x => x.toUpperCase() } })` |
| 依赖 | 基于开源 `angular-expressions`，随包提供、**免费** |
| 默认解析器对比 | 默认**不支持**点号/运算/比较/过滤器 |

## 五、错误结构

```js
{
  name: 'TemplateError' | 'MultiError' | 'ScopeParserError' | ...,
  message: string,
  properties: {
    id: string,          // 错误类型标识，可用于程序化判断
    explanation: string, // 人类可读说明
    errors: Array,       // 仅 MultiError：聚合的全部子错误
  }
}
```

标准捕获写法：

```ts
try {
  doc.render(data);
} catch (error) {
  if (error.properties && Array.isArray(error.properties.errors)) {
    const msg = error.properties.errors
      .map((e) => e.properties.explanation)
      .join('\n');
    console.log(msg); // 如 'The tag beginning with "foobar" is unopened'
  }
  throw error;
}
```

## 六、免费核心 vs 付费模块

| 能力 | 归属 |
|---|---|
| 占位符替换 `{name}` | **免费核心** |
| 循环 `{#}{/}` / 反向 `{^}{/}` | **免费核心** |
| raw XML `{@}`（段落级） | **免费核心** |
| 自定义分隔符 / `nullGetter` | **免费核心** |
| expressions 解析器（点号/运算/过滤器） | **免费**（随包） |
| 表格行循环（标签放进表格行） | **免费核心** |
| 插入图片 | **付费** image 模块 |
| 插入 HTML 富文本 | **付费** html 模块 |
| 图表数据绑定 | **付费** chart 模块 |
| 操作 xlsx 单元格 | **付费** xlsx 模块 |
| 幻灯片复制/拆分 | **付费** slides 模块 |
| 子模板嵌入 | **付费** subtemplate 模块 |
| 样式 / 脚注 / 错误定位 等 | **付费**（styling / footnotes / error-location …） |

> 核心库本身 **MIT / GPLv3 双许可**（可按 MIT 闭源商用）。付费模块按套餐授权（One Module / PRO / ENTERPRISE / PREMIUM）。

## 七、常用 MIME 类型（服务端返回/Blob）

| 格式 | MIME |
|---|---|
| docx | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| pptx | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| xlsx | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

---

速查完毕，进 [指南 · 基础](./guide-line/base) 理解标签与作用域，或 [指南 · 进阶](./guide-line/advanced) 看循环/条件/异步/浏览器实战。
