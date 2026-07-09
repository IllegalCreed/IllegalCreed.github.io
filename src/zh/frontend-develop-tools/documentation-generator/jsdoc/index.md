---
layout: doc
---

# JSDoc

通过源码中的 `/**` 注释生成 API 文档的元老级工具，也是 JavaScript 注释式类型标注的事实标准。它既能独立产出 HTML 文档站点，其类型注解又能被 TypeScript 编译器直接消费——是纯 JS 项目无需改写 `.ts` 就获得类型检查的关键路径。

## 评价

**优点**

- 零工具链依赖：纯 JavaScript 项目无需 TypeScript / 编译步骤，写注释即出文档
- 注释语法是 JS 生态事实标准，被 TypeScript、VS Code、TypeDoc、API Extractor 等广泛消费
- 类型注解可被 TS 编译器读取（`// @ts-check` / `checkJs`），不写 `.ts` 也能享受类型检查与补全
- 标签体系完备（参数、返回、类型、泛型、类、模块、命名空间），几乎覆盖所有代码结构
- 模板可替换（默认模板之外有 docdash / better-docs / minami 等社区主题）

**缺点**

- 默认模板样式偏陈旧，观感不如 TypeDoc 或现代文档站点
- 类型要手写进注释，冗长且重构时易与代码脱节
- 与 TypeScript 存在语法差异（`!` 非空、`?` 可空、`@memberof` / `@yields` 等 TS 不识别），混用易踩坑
- 自身只产 API 参考文档，不含指南 / 教程式编排，完整站点仍需配合 SSG（如 VitePress / Docusaurus）

## 文档地址

[JSDoc](https://jsdoc.app/)

## GitHub地址

[JSDoc](https://github.com/jsdoc/jsdoc)

## 幻灯片地址

<a href="/SlideStack/jsdoc-slide/" target="_blank">JSDoc</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=jsdoc" target="_blank" rel="noopener noreferrer">JSDoc 测试题</a>
