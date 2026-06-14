---
layout: doc
---

# Lodash-es

::: tip 本篇范围
本篇聚焦 **Lodash 的 ESM 形态 `lodash-es`**——经典 JavaScript 工具函数库的「可摇树（tree-shakable）按需引入」版本。重点在：ESM 模块格式与 tree-shaking、常用方法族（集合 / 数组 / 对象 / 函数 / lang）、链式 `_.chain` 在 ESM 下的取舍、不可变思想，以及与原生 ES2023+ 及 es-toolkit 的取舍。`lodash` 与 `lodash-es` 同源同版本（当前均 **4.18.1**），差别只在模块格式。
:::

Lodash 是被广泛使用的 JavaScript 工具库，把数组、集合、对象、函数、字符串等常见操作封装成一组经过千锤百炼、边界容错强的工具函数。`lodash-es` 是官方用 `lodash-cli` 以 `modularize exports="es"` 构建出的 **ES modules 版本**：它的 `package.json` 里 `"type": "module"`、`"module": "lodash.js"`、且关键的 `"sideEffects": false`，每个方法都是一个独立的 `.js` 模块文件（本地 `node_modules/lodash-es` 下实测有 **600+ 个文件**），用 `export default` 导出后再在入口 `lodash.js` 统一具名再导出。正因如此，现代打包器（Rollup / Vite / webpack）能对它做 **tree-shaking**——你 `import { debounce } from 'lodash-es'`，最终产物里就只有 `debounce` 及其内部依赖，其余几百个方法都被摇掉。

**2026 年的现状**：Lodash 仍是 4.x（当前 4.18.1），v5 长期处于规划中尚未正式发布；社区涌现了 **es-toolkit**（更小、更快、原生 TypeScript 类型）等现代替代。与此同时，原生 `Array.prototype`（`map`/`filter`/`find`/`flat`/`flatMap`）、`structuredClone`、`Object` 方法、可选链 `?.` 已能覆盖很多「简单」场景。因此当下的主流取舍是：**复杂且容错要求高的工具**（深合并 `merge`、深拷贝 `cloneDeep`、动态路径 `get/set`、防抖节流 `debounce/throttle`、深比较 `isEqual`）交给 lodash-es / es-toolkit；**原生已能轻松平替的简单操作**优先用原生，避免无谓依赖。

## 评价

**优点**

- **可摇树的 ESM**：`sideEffects:false` + 每方法独立模块，配合具名导入，做到「用多少打多少」，体积可控
- **复杂工具开箱即用**：`cloneDeep`（含循环引用）、`merge`（深合并）、`get/set`（动态路径 + 默认值）、`isEqual`（SameValueZero 深比较）、`debounce/throttle`（带 `cancel`/`flush`）等，自己实现极易出 bug
- **API 稳定、心智成熟**：4.x 多年未有破坏性变更，文档详尽，社区资料海量
- **iteratee 简写**：`_.find(arr, {active:true})`（matches）、`_.map(arr, 'name')`（property）等让代码简洁
- **与 lodash 完全同源**：同版本、同 API，必要时可与 CJS 版互相平替（用打包器 `alias`）
- **可组合**：`flow`/`flowRight` + 具名导入，构建摇树友好的纯函数管道

**缺点**

- **`_.chain` 不利 tree-shaking**：链式会拖入大量 wrapper 原型方法，体积敏感时应改用 `flow`/具名导入（chain 本身仍可用，并非废弃）
- **不内置 TypeScript 类型**：需额外装 `@types/lodash-es`；现代库（es-toolkit）则自带原生类型
- **变异语义易踩坑**：`merge`/`set`/`defaults` 等会**直接修改入参**，做不可变更新（Redux/React state）时不能直接用
- **部分方法被原生取代**：`map`/`filter`/`uniq`/`flatten` 等原生已能平替，仅为它们整包依赖不划算
- **per-method 包是反模式**：`lodash.debounce` 这类独立小包会重复内联依赖、增大体积，官方已 discouraged 且 v5 将移除
- **纯 ESM 的互操作成本**：被 CJS `require` 或 SSR/库模式配置不当（`optimizeDeps`/`ssr.noExternal`）时易报「Named export not found」

## 文档地址

[Lodash Documentation](https://lodash.com/docs)

## GitHub 地址

[lodash/lodash](https://github.com/lodash/lodash)

## 幻灯片地址

<a href="/SlideStack/lodash-es-slide/" target="_blank">Lodash-es</a>
