---
layout: doc
---

# ES Module

**JavaScript 语言标准的官方模块系统**（ES2015 引入 `import`/`export`），浏览器与 Node.js 均原生支持。核心设计是**静态结构**：导入导出只能写在模块顶层、说明符必须是字符串字面量，依赖关系不执行代码即可静态求解——这带来 tree-shaking、循环依赖的确定性处理与 **live bindings**（导入是导出变量的实时只读视图，区别于 CommonJS 的值拷贝）。浏览器侧 `<script type="module">` 默认 defer、受 CORS 约束，配合 **import maps**（Chrome/Edge 89+、Firefox 108+、Safari 16.4+，全球约 94.5% 支持）可免打包直跑裸说明符。Node 侧 `"type": "module"`/`.mjs` 启用，相对导入必须带扩展名，`import.meta.dirname`（20.11+）替代 `__dirname`。**2026-06 现状**：`require(esm)` 已于 Node 25.4 转正稳定（22.12/20.19 起默认启用），ESM-only 包可直接服务 CJS 用户；npm top1000 约 42% 已 ESM-only、新发布包约 80% ESM-first——发库默认 ESM-only 成为主流决策。另一半故事（require 解析算法、缓存与循环依赖细节）见 [CommonJS](../commonjs/)。

## 评价

**优点**

- **语言标准**：唯一写进 ECMAScript 的模块系统，浏览器/Node/Deno/Bun 通吃，一次学习处处可用
- **静态可分析**：依赖图编译期确定，tree-shaking、循环依赖提前报错（TDZ）、IDE 精确跳转都源于此
- **live bindings**：导出方状态更新所有导入方实时可见，循环依赖下函数互调天然可行
- **异步友好**：Top-level await（ES2022）、动态 `import()` 按需加载，与现代异步生态无缝衔接
- **浏览器免打包可用**：type=module + import maps + CDN，原型与轻量项目可以零构建
- **发布侧封装力**：package.json `exports` 提供子路径封装、条件导出，包边界可静态信任

**缺点**

- **Node 侧规则严苛**：相对导入必须写全扩展名、无目录索引，与打包器宽松行为不一致易踩坑
- **互操作有暗角**：CJS 命名导入依赖 cjs-module-lexer 静态猜测，动态导出识别不了；default interop 各打包器历史行为不一
- **双格式发布是泥潭**：dual package hazard（双实例）、types 条件顺序、产物×2 维护成本——这也是 ESM-only 趋势的反向推力
- **历史包袱期长**：Node ESM 从 8.5 实验到 12/14 稳定再到 require(esm) 25.4 转正，跨度近十年，存量教程版本混杂

## 文档地址

[MDN JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) ｜ [Node.js ECMAScript modules](https://nodejs.org/api/esm.html) ｜ [Node.js Packages（exports）](https://nodejs.org/api/packages.html)

## 规范地址

[TC39 ECMA-262 Modules](https://tc39.es/ecma262/#sec-modules)

## 幻灯片地址

<a href="/SlideStack/es-module-slide/" target="_blank">ES Module</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=es-module" target="_blank" rel="noopener noreferrer">ES Module 测试题</a>
