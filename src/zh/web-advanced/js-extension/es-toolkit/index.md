---
layout: doc
---

# es-toolkit

::: tip 本篇范围
本篇聚焦 **es-toolkit**——2024 年崛起的现代 JavaScript 工具函数库，定位为 **Lodash 的高性能、更小体积替代**。重点在：相比 lodash 的体积 / 性能优势（用官方数字）、主包 `es-toolkit` 与兼容层 `es-toolkit/compat` 的分工、tree-shaking 与 ESM/CJS 双格式、TS-first 的现代 API 设计，以及从 lodash / lodash-es 的迁移路径与取舍。版本基线 **es-toolkit 1.47+**（当前最新 1.47.1）。
:::

es-toolkit 是由韩国金融科技公司 **Toss** 开源的现代 JavaScript 工具库，官方一句话定位是「**a modern JavaScript utility library that offers a collection of powerful functions for everyday use**」。它覆盖数组、函数、数学、对象、断言（predicate）、Promise、字符串等日常领域，主打三个数字：相比 lodash **体积最多小约 97%**、运行时**快约 2~3 倍**、**内置 TypeScript 类型**且 **100% 测试覆盖**。它已被 **Storybook、MUI、Recharts** 等成熟项目用于生产。

它的优势源自**现代实现**：直接用当代 JavaScript 原生 API（`Array.prototype`、`structuredClone`、可选链等）重写，抛弃 lodash 为兼容老旧环境而背负的大量内部工具与防御代码——所以单个函数极小（官方实测 `sample` 约 94 字节、`difference` 约 90 字节、`pick` 约 132 字节）。配合 `package.json` 里的 `"sideEffects": false`，打包器能把没用到的函数彻底摇掉。

**主包 vs 兼容层**是理解 es-toolkit 的关键：主包 `es-toolkit` 只暴露**类型安全的现代形态**（简洁签名、无 lodash 怪癖）；而 `es-toolkit/compat` 是 **Lodash 兼容层**，与 lodash 的 API、行为 1:1 对齐（含隐式类型转换、可变参数、深路径 `get`、链式等），**自 v1.39.3 起做到 100% 兼容、能通过 lodash 自己的测试套件**，专供现有 lodash 项目「改 import 路径即可迁移」。代价是 compat 比主包略大、略慢，但仍比 lodash 本身更小更快。**新项目应直接用主包**；compat 只为迁移而生。

## 评价

**优点**

- **体积最多小约 97%**：现代原生实现 + `sideEffects:false`，单函数可小至不足 100 字节，对被广泛依赖的库尤其能替下游省 bundle
- **运行时快约 2~3 倍**：用更直接的逻辑替代 lodash 的通用路径（官方基准 `omit` 约 11.8×、`pick` 约 3.43×）
- **TS-first**：用 TypeScript 编写、内置完整现代类型，**无需 `@types`**；许多 predicate（`isString`/`isNil`…）还是真正的类型守卫
- **零运行时依赖**：dependencies 为空，降低供应链风险、避免依赖膨胀
- **ESM + CommonJS 双格式**：`exports` 同时提供 `import`（`.mjs`）与 `require`（`.js`），跨 Node 18+ / Deno / Bun / 浏览器
- **现代异步/并发工具**：lodash 没有的 `Mutex`/`Semaphore`/`withTimeout`/`attempt`，以及 debounce/throttle 的 `AbortSignal` 集成
- **平滑迁移**：`es-toolkit/compat` 100% 对齐 lodash，先换路径零风险，再逐步切主包

**缺点**

- **主包不是 lodash 全集**：有意只提供现代核心函数，舍弃了链式、`runInContext`、深路径 `get/set`、隐式类型转换等历史包袱；需要这些得用 compat
- **compat 有开销**：为对齐 lodash 行为背负额外逻辑，比主包略大、略慢（但仍优于 lodash）
- **主包 / compat 签名有别**：如 `pick`/`omit` 主包只收键数组、compat 才支持点号深路径与可变参数；从 compat 切主包要逐点核对
- **可变性需分辨**：`merge`/`pull`/`remove`/`fill` 会**原地修改入参**，不可变场景（Redux/React）要改用 `toMerged`/`cloneDeep`
- **仍在快速迭代**：版本已到 1.4x 且持续新增函数，升级应锁版本、关注 changelog
- **极少数 lodash 函数不支持**：即便 compat 也明确不支持 `sortedUniq`、`sortedUniqBy`、`mixin`、`noConflict`、`runInContext`

## 文档地址

[es-toolkit Documentation](https://es-toolkit.dev)

## GitHub 地址

[toss/es-toolkit](https://github.com/toss/es-toolkit)

## 幻灯片地址

<a href="/SlideStack/es-toolkit-slide/" target="_blank">es-toolkit</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=es-toolkit" target="_blank" rel="noopener noreferrer">es-toolkit 测试题</a>
