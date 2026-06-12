---
layout: doc
---

# CommonJS

**Node.js 的默认模块系统**。2009 年起源于服务端 JS 社区的模块规范（最初名 ServerJS），Node.js 实现了它的变体并沿用至今：`require()` 同步加载、`module.exports` 导出、模块包装函数注入 `__dirname` 等五个模块级变量、`require.cache` 缓存与 node_modules 逐级向上解析——这套机制支撑了 npm 生态的第一个十年。**2026-06 现状**：ES Module 是语言标准与增量方向（top 1000 npm 包中 CJS-only 已降至约 20%），但 CJS 的**默认地位仍在**——无 `type` 声明的 `.js` 依旧按 CJS 解析；更关键的转折是 **require(esm) 在 Node 22.12+ 默认开启、25.4 标记 Stable**，CJS 项目从此能零改造同步消费无顶层 await 的 ESM 依赖，「遗产 CJS 项目被 ESM-only 生态锁死」的时代结束了。

## 评价

**优点**

- **同步直观**：`require` 即取即用，运行时随处可调用，无异步仪式感
- **默认地位**：无声明的 `.js` 即 CJS，零配置起步，海量存量代码的事实标准
- **解析宽容**：自动扩展名补全（.js → .json → .node）、目录 `main`/`index` 回退、原生 require JSON
- **缓存可见可控**：`require.cache` 是普通对象，单例语义清晰，测试 mock 有抓手
- **互操作翻身**：require(esm) 转正后，CJS 项目可直接消费 ESM-only 依赖（无 TLA），不再被生态甩下
- **循环依赖不死锁**：「未完成副本」策略让循环图也能跑（虽有坑但可预测）

**缺点**

- **非语言标准**：`require` 是运行时函数调用，依赖图无法静态确定，tree-shaking 困难
- **历史 API 坑多**：`exports` 别名重赋值不生效、`module.exports` 必须同步赋值等
- **循环依赖隐蔽坑**：未完成副本拿到 `undefined`/旧值，错误往往延迟爆发
- **浏览器不原生支持**：进浏览器必须打包器翻译
- **增量退潮**：新库渐趋 ESM-only，长线方向是迁移（见 [ES Module](../es-module/) 篇）
- **多实例陷阱**：缓存键按解析路径字符串匹配，大小写/多份安装会悄悄打破单例

## 文档地址

[Node.js Modules: CommonJS modules](https://nodejs.org/api/modules.html)

## GitHub 地址

[nodejs/node](https://github.com/nodejs/node)

## 幻灯片地址

<a href="/SlideStack/commonjs-slide/" target="_blank">CommonJS</a>
