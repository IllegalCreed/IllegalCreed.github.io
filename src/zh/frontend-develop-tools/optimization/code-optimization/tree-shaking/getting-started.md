---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Webpack / Rollup / Vite / Tailwind CSS 官方文档编写，对照 Webpack 5.108、Rollup 4、Vite 8（Rolldown）、Tailwind v4 行为

## 速查

- **本质**：构建期死代码消除（dead code elimination），打包器扫 ESM 静态依赖图，标记未引用导出 → 压缩阶段删除
- **前提**：必须是 **ESM**（顶层 `import` / `export` 静态可分析）；CJS 的 `require()` 不可 shake
- **三件套**：`package.json` `"sideEffects"` 字段 + `optimization.usedExports`（标记）+ `minimize: true`（删除）
- **sideEffects 三态**：`false`（整包可 shake）/ `Array<string>` 白名单（如 `["*.css", "./src/polyfills.js"]`）/ 缺省（保守保留整模块）
- **mode=production 一键开**：`usedExports` / `sideEffects` / `innerGraph` / `concatenateModules` / `mangleExports` / `minimize`
- **Webpack 5**：`usedExports` / `sideEffects` / `innerGraph` 在所有 mode 默认启用
- **Rollup 三预设**：`smallest` / `safest` / `recommended`（默认 `true` = recommended）
- **Vite 8**：Rolldown 成为唯一打包器；`build.rollupOptions` → `build.rolldownOptions`、`output.manualChunks` → `output.codeSplitting`
- **CSS 按需**：Tailwind v4 默认开启 + `@source` / v3 `content` 数组 / 独立 PurgeCSS
- **注解**：`/*#__PURE__*/` 标单次调用 / 构造（通用）；`/*@__NO_SIDE_EFFECTS__*/` 标整函数声明（Rollup 专属）
- **死代码真正删除**：必须 `minimize: true`（Terser / esbuild），只标 `usedExports` 不开 minify 则死代码仍在 bundle

## Tree Shaking 是什么

Tree Shaking 是**构建期死代码消除**：打包器（Webpack / Rollup / Rolldown / esbuild）在编译期对 ESM 静态依赖图做剪枝——扫一遍 `import` / `export` 关系，把「打包进来但没被引用」的导出标记为 unused，再在压缩阶段真正删除。

它的核心定位有三：

- **构建期、零运行期**：所有分析在打包阶段完成，不引入运行时检查、不影响首屏执行
- **ESM 前提**：依赖顶层 `import` / `export` 的静态可分析性；CJS 的动态 `require` 无法 shake
- **与代码分割正交**：shaking 治「下了没用」（消除未引用导出），代码分割治「下太多」（切 chunk）；两者配合是先 shaking 收口、再分割

> Tree Shaking ≠ 代码压缩。压缩（minify）删的是空白 / 长名 / 注释，shaking 删的是「整段没人用」的导出。但 shaking 标记的死代码真正消失，发生在 minify 阶段。

## 为什么需要 Tree Shaking

现代前端依赖大量第三方库，而应用通常只用其中一小部分：

- **UI 组件库**：`import { Button } from 'library'` 只用一个 Button，没有 shaking 则整库 100+ 组件全部进 bundle
- **工具库**：`import { get } from 'lodash'` 只用 get，没有 shaking 则 lodash 全部 200+ 函数进 bundle
- **业务代码**：跨模块 re-export、deprecated 但留着「以后可能用」的工具函数，都是潜在的死代码

**未用代码的代价**

- **bundle 体积膨胀**：直接影响首屏下载与解析时间（特别是移动端）
- **缓存命中率下降**：业务代码任何一处变更都使整包 hash 变化、CDN 缓存失效
- **解析与编译开销**：V8 仍要解析未被使用的代码（即使懒执行也占内存）
- **维护噪音**：dead code 让 bundle analyzer 看不清真实依赖关系

## ESM：tree shaking 的前提

| 模块系统 | 静态可分析 | 能否 shake | 原因 |
| --- | --- | --- | --- |
| **ESM（ES Modules）** | ✅ | ✅ | 顶层 `import` / `export` 在编译期确定，依赖图可静态推导 |
| **CommonJS（CJS）** | ❌ | ❌ | `require()` / `module.exports` 是运行期值，可在 `if` / 循环里动态调用 |
| **UMD** | ❌ | ❌ | 兼容 CJS 的部分等同 CJS |
| **AMD** | ❌ | ❌ | 异步运行期加载，非静态 |

> ESM 的 `import` 必须在顶层、字符串字面量、不能放在 `if` 里——这些「限制」正是 tree shaking 的根本基础。

**常见库的 ESM vs CJS 等价物**

| CJS（不能 shake） | ESM 等价（能 shake） | 备注 |
| --- | --- | --- |
| `lodash` | `lodash-es` | 全套工具 |
| `lodash/get` | `lodash-es/get` | 深路径 import |
| `moment` | `date-fns` / `dayjs` | moment 本身是 CJS 大单体 |
| `classnames` | `clsx`（ESM） | 条件类名 |
| `ramda` | `ramda-es` / 深路径 | 函数式工具 |

> 即使是 ESM 库，深路径 `import get from 'lodash-es/get'` 也比 `import { get } from 'lodash-es'` 更稳——后者依赖打包器对 barrel / re-export 的静态分析。

## 前提速览：怎么让 shaking 生效

```text
1. 用 ESM：源码 import/export + 库的 ESM 入口（package.json "module" / "exports"）
2. 生产模式：Webpack mode: 'production' 或 vite build
3. 库声明副作用：package.json "sideEffects": false（或精确白名单）
4. 开 minimize：Webpack optimization.minimize: true（默认 Terser）
5. 用注解：/*#__PURE__*/ 标 IIFE / 工厂调用 / class extends 装饰器
6. 验证：production build 后看 stats 的 usedExports / 比较 bundle 体积
```

> 任何一步缺失都可能让 shaking 失效：CJS 库进来 → 整段保留；`sideEffects` 缺省 → 整模块保留；只标 `usedExports` 不开 `minimize` → 死代码还在 bundle；dev 模式验证 → 看不出效果。

## Tree Shaking vs 代码分割（边界）

| 维度 | Tree Shaking | 代码分割（Code Splitting） |
| --- | --- | --- |
| **解决的问题** | 「下了没用」——消除未引用导出 | 「下太多」——切 chunk 延迟加载 |
| **发生时机** | 构建期（静态依赖图剪枝） | 运行期（动态 `import()` / 路由级切包） |
| **正交关系** | 决定哪些死代码不进 bundle | 决定哪些活代码延迟加载、何时进 bundle |
| **API** | `package.json sideEffects` / `usedExports` / `minimize` | `import()` / `defineAsyncComponent` / React `lazy` / 路由懒加载 |
| **失效场景** | CJS / barrel / try-catch polyfill | 没用动态 import / 静态 import 一切 |

> 两者配合是性能优化的标准两段式：先 shaking 消除死代码收口，再分割按路由 / 交互切 chunk。本叶只讲静态依赖图的死代码消除，运行期分割（Vue `defineAsyncComponent` / React `lazy` / `import()` 等 API）归异步组件叶。

## 下一步

- [核心机制与配置](./guide-line.md)：tree shaking 原理 + sideEffects false/数组 + usedExports + innerGraph + purgeCSS/Tailwind + `#__PURE__` + Rollup/Rolldown + CJS 转 ESM 坑 + 失效场景 + 反模式
- [参考](./reference.md)：配置项表（sideEffects / usedExports / innerGraph / purgeCSS / Rollup treeshake）+ 版本 + 链接
