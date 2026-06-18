---
layout: doc
---

# TSDoc

TypeScript 文档注释的**标准化语法规范**——官方原话是 “a proposal to standardize the doc comments used in TypeScript code”，由微软发起、社区共建。它本身**不生成任何文档**，只规定"同一份 `/** */` 注释怎么写，才能被多种工具无歧义地解析"。真正产出文档站 / API 报告的是 TypeDoc、API Extractor 等下游消费方；TSDoc 解决的是它们之间的**互操作**问题，相当于文档注释领域的"普通话"。

## 评价

**优点**

- 解决互操作：一份注释，TypeDoc / API Extractor / ESLint / VS Code 都能一致解析，不再各家方言
- 微软背书 + 参考实现：`@microsoft/tsdoc` 是官方称的"professional quality parser"，API Extractor 是该标准的主要推动者
- 严格、可机读：语法明确（如 `@param` 强制连字符），便于工具校验与自动化迁移
- 分级标准化（Core / Extended / Discretionary）：核心标签跨工具保证一致，又给扩展留出空间
- 生态配套完整：`tsdoc.json` 声明自定义标签、`eslint-plugin-tsdoc` 在 CI 做注释合规门禁

**缺点**

- 仍是 0.x、未发布 1.0，规范仍在演进（形式文法、RFC 流程都还在路线图上）
- 只是"规范 + 解析器"，对最终用户没有"开箱即出文档"的价值，必须配合消费方工具
- 偏库作者向：纯应用项目通常用不到这层严格规范
- 标签语义分级（尤其 Discretionary 档）需查"哪个工具支持哪个"，有一定认知成本

## 文档地址

[TSDoc](https://tsdoc.org/)

## GitHub地址

[TSDoc](https://github.com/microsoft/tsdoc)

## 幻灯片地址

<a href="/SlideStack/tsdoc-slide/" target="_blank">TSDoc</a>
