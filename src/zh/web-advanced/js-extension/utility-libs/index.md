---
layout: doc
---

# 前端实用小库（7 合 1）

::: tip 本篇范围
本篇是一个**合并分类**，把 7 个「单点能力、上手即用」的轻量前端小库放在一节里横向讲：**mitt**（事件总线）、**qs**（查询字符串）、**JSZip**（ZIP 打包）、**FileSaver.js**（触发下载）、**qrcode**（二维码生成）、**chroma.js**（颜色处理）、**marked**（Markdown → HTML）。它们彼此独立、各管一摊，共同点是「**职责单一、API 极简、即插即用**」。本篇逐库给出定位、最小示例与进阶要点，并标注每库的版本基线。
:::

这 7 个库的共同气质是「**小而专**」：每个都只解决一类具体问题，没有庞大的抽象与配置负担，引入后几行代码就能用起来。它们常出现在「不值得自己造轮子、但原生 API 又差一口气」的缝隙处——比如 Vue 3 移除实例事件后需要的事件总线（mitt）、原生 `URLSearchParams` 不支持嵌套时的查询串处理（qs）、浏览器里临时打包/下载文件（JSZip + FileSaver）、生成二维码（qrcode）、数据可视化配色（chroma.js）、把 Markdown 渲染成富文本（marked）。

理解它们的关键，是分清**各自的边界与互补关系**：JSZip 只负责「打包/解包」、FileSaver 只负责「触发下载」，二者常串联使用；marked 只负责「Markdown → HTML」、**默认不做净化**，要防 XSS 必须配合 [DOMPurify](../dompurify/)；qs 的价值是 `URLSearchParams` 给不了的「嵌套对象 + 数组格式 + 防 DoS 限制」；mitt 故意不提供 `once`，保持约 200 字节的极简。

## 七库总览

| 库 | 一句话定位 | 核心 API | 版本基线 | 关键记忆点 |
|---|---|---|---|---|
| **mitt** | 约 200B 的微型事件总线 / pubsub | `mitt()` → `{ on, off, emit, all }` | 3.0.x | `'*'` 通配监听；**无 `once`**；`all` 是 `Map` |
| **qs** | 查询字符串解析 / 序列化 | `qs.parse` / `qs.stringify` | 6.x | 支持**嵌套对象/数组**；`depth`/`parameterLimit` 防 DoS |
| **JSZip** | 浏览器 / Node 创建读取 ZIP | `new JSZip()`、`generateAsync`、`loadAsync` | 3.10.x | I/O 全**异步 Promise**；常配 FileSaver |
| **FileSaver.js** | 客户端触发文件下载 | `saveAs(blob, filename)` | 2.0.x | **只管「存」不产内容**；`autoBom` 防乱码 |
| **qrcode** | 生成二维码 | `toCanvas` / `toDataURL` / `toString` / `toFile` | 1.5.x | 纠错级别 **L/M/Q/H**；回调 + Promise 双风格 |
| **chroma.js** | 颜色处理与配色 | `chroma()`、`mix` / `scale` / `contrast` | 3.x | `scale().domain()/.classes()`；WCAG `contrast` |
| **marked** | Markdown → HTML | `marked.parse(md)` / `marked(md)` | 18.x | **默认不净化**，防 XSS 须配 DOMPurify |

## 选型与边界

**优点（作为一类）**

- **极简上手**：每个库 API 面都很小，看一眼示例就能用，几乎零学习成本
- **职责单一**：各管一件事，组合灵活（如 JSZip 产内容 + FileSaver 下载）
- **体积可控**：mitt 约 200B、qrcode/chroma/marked 也都属于轻量级
- **跨端友好**：JSZip / qrcode / chroma / marked 在浏览器与 Node 大多通用

**注意事项**

- **marked 默认不净化 HTML**：直接渲染用户输入会有 XSS 风险，必须配 [DOMPurify](../dompurify/)（高频安全考点）
- **FileSaver 不产内容**：它只触发下载，文件内容要你自己（或 JSZip 等）准备
- **mitt 无 once**：一次性监听需在 handler 内手动 `off` 自己
- **qs 的安全限制是默认值**：`depth=5`、`parameterLimit=1000`、`arrayLimit=20` 都是为防 DoS，必要时才放宽
- **JSZip 是异步的**：`generateAsync` / `loadAsync` 返回 Promise，别当同步用
- **marked vs markdown-it**：marked 更快更简，markdown-it 插件生态更强；本站 [markdown-it 已单列](../../../frontend-framework/others/markdown-it/)，本篇只做对比、不展开

## 文档地址

- [mitt](https://github.com/developit/mitt) ｜ [qs](https://github.com/ljharb/qs) ｜ [JSZip](https://stuk.github.io/jszip/) ｜ [FileSaver.js](https://github.com/eligrey/FileSaver.js)
- [qrcode](https://github.com/soldair/node-qrcode) ｜ [chroma.js](https://gka.github.io/chroma.js/) ｜ [marked](https://marked.js.org/)

## 幻灯片地址

<a href="/SlideStack/utility-libs-slide/" target="_blank">前端实用小库（7 合 1）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E5%89%8D%E7%AB%AF%E5%AE%9E%E7%94%A8%E5%B0%8F%E5%BA%93-7-%E5%90%88-1" target="_blank" rel="noopener noreferrer">前端实用小库（7 合 1） 测试题</a>
