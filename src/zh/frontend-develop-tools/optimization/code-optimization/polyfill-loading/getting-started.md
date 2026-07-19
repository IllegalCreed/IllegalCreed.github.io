---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Babel 官方文档（babeljs.io/docs/babel-preset-env）+ core-js 官方说明（zloirock/core-js）+ Vite 官方浏览器兼容指南编写，对照 @babel/preset-env 7.x 与 core-js 3.x 稳定版

## 速查

- **按需加载三要素**：`useBuiltIns`（注入位置）+ `corejs`（注入什么版本）+ `targets`（为谁注入）
- **应用项目默认配方**：`useBuiltIns: 'usage'` + `corejs: '3.33'`（写实际装的 minor 版本，别写 `'3'`）
- **库项目默认配方**：`useBuiltIns: false` + `@babel/plugin-transform-runtime` 的 `corejs: 3`（走 `core-js-pure`，不污染消费者全局）
- **`useBuiltIns` 三模式**：`'usage'`（每文件按使用注入，最精细）/ `'entry'`（替换入口 import）/ `false`（不注入）
- **`@babel/polyfill` 已弃用**（Babel 7.4 起）：替代为 `import "core-js/stable"` + `import "regenerator-runtime/runtime"` 两行
- **`core-js-pure` vs `core-js`**：前者不污染全局（ponyfill），后者修改全局与原生原型（polyfill）；库用 pure，应用用 core-js
- **`browserslist` 是 targets 单一事实源**：`.browserslistrc` 同时被 preset-env / autoprefixer / eslint-plugin-compat 共享
- **`@vitejs/plugin-legacy`**：产出 modern（`type="module"`）+ legacy（`nomodule`）双 bundle，浏览器自选
- **`polyfill.io` 不再用**：2024-02 被 Funnull 收购后供应链攻击，改自托管 core-js 或 cdn.cloudflare.com/polyfill、polyfill-fastly.io 镜像
- **`debug: true`** 核对实际注入清单与触发它的 target

## Polyfill 是什么

Polyfill 是一段**补齐老浏览器缺失原生 API 的代码**——把现代浏览器才有的 `Promise`、`Array.prototype.includes`、`Object.fromEntries`、`queueMicrotask` 等「运行时 API」用等价 ES5 代码补回来。它与「语法降级」（class / 箭头函数 / 可选链等**语法**层面的转译）是两件事：

- **语法降级**：`class Foo {}` → `function Foo() {}` + 原型链（Babel 的 syntax transform）
- **Polyfill**：缺失的 `Promise` 全局 → 注入 `core-js/modules/es.promise`

`@babel/preset-env` **同时做这两件事**，但本章只取 polyfill 维度，语法降级不在此章。

> 注意：纯 polyfill 不能补「需要底层引擎支持」的特性（如 `Proxy` 无法 polyfill、`WeakRef` 无法完整 polyfill）。

## 为什么必须按需

最暴力的做法是在入口 `import "core-js"`——把整个 core-js 全量加载，**任何浏览器都吃下完整 polyfill**。这有几个明显问题：

- **体积爆炸**：core-js@3 全量压缩后仍数百 KB，绝大多数现代浏览器根本不需要其中大部分
- **现代浏览器白付代价**：Chrome 120 已经原生支持 `Object.fromEntries`，不需要补
- **重复 polyfill 风险**：用户应用 + 第三方依赖各自 `import "core-js"` 会全局碰撞
- **维护性差**：要支持的目标浏览器升级后，多余 polyfill 不会被自动剔除

按需加载解决的是「**给老浏览器补齐**」与「**不让现代浏览器白付**」的平衡，核心思路两条：

1. **按 targets 裁剪**：只补「目标浏览器真正缺的」
2. **按实际使用注入**：只补「你的代码真正用到的」

> 一个常见误区是「全量 polyfill 一次加载更省事」——体积差出去几十倍，且现代浏览器永远白付。

## `useBuiltIns` 速览

`@babel/preset-env` 的 `useBuiltIns` 选项有三个取值，决定了 polyfill 注入的位置与粒度：

| 取值 | 注入位置 | 粒度 | 适用 |
| --- | --- | --- | --- |
| `'usage'` | 每个文件顶部，按文件实际使用的 API | **最精细** | 应用项目默认 |
| `'entry'` | 替换入口 `import "core-js/stable"` 为按 targets 拆解的具体模块 | 入口级 | 整项目一次性补 |
| `false` | 不自动注入，不转换 `core-js` 入口 | 无 | 库 / 自己手动控制 |

**最小可用配置（应用项目）**：

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage",
        "corejs": "3.33"
      }
    ]
  ]
}
```

```text
// .browserslistrc（targets 单一事实源，preset-env / autoprefixer 共享）
> 0.5%
last 2 versions
not dead
Firefox ESR
```

> `corejs` 选项**必须显式写明且与应用实际装的 core-js minor 一致**——写 `'3'` 或漏写会按默认 core-js@2 处理并告警，且无法用到 3.x 后续 minor 新增的 polyfill。

## 入口 vs 按需：实际体积差异

对同一应用：

- 全量 `import "core-js"`：约 **120 KB** gzipped（core-js@3 全集）
- `useBuiltIns: 'entry'` + targets `> 1%, last 2 versions, Firefox ESR, not dead`：约 **30–50 KB** gzipped
- `useBuiltIns: 'usage'` + 同 targets：约 **15–30 KB** gzipped（视实际用到的 API 数量）
- `useBuiltIns: 'usage'` + targets 收紧到 `defaults, not ie 11`：再降 30%–50%

> 配合 `@vitejs/plugin-legacy` 双产物，现代浏览器只下载最少的现代 polyfill，老浏览器才下载完整 legacy polyfill。

## 下一步

- [核心配置与方案](./guide-line.md)：`useBuiltIns` 三模式深度、`core-js` 2 vs 3、`browserslist` 集成、`@vitejs/plugin-legacy`、避免全量污染、`core-js-pure`、动态 polyfill、反模式
- [参考](./reference.md)：`useBuiltIns` 三模式对比表、`core-js` 配置清单、`browserslist` 速查、版本状态、官方资源
