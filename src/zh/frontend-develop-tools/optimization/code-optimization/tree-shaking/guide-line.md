---
layout: doc
outline: [2, 3]
---

# 核心机制与配置

> 基于 Webpack / Rollup / Vite / Tailwind CSS 官方文档编写，对照 Webpack 5.108、Rollup 4、Vite 8（Rolldown）、Tailwind v4 行为

## 速查

- **原理**：ESM 静态分析 + 标记未引用导出 + 压缩期删除三步
- **sideEffects 三态**：`false`（整包可 shake）/ `Array<string>` 白名单（保留 CSS / polyfill）/ 缺省（保守保留整模块）
- **Webpack 五开关**：`usedExports`（标记）+ `sideEffects`（按字段跳模块）+ `innerGraph`（内部图，Webpack 5 默认开）+ `concatenateModules`（Scope Hoisting）+ `minimize`（真正删除）
- **mode=production** 一键启用上述全部 + `mangleExports`
- **Rollup treeshake**：`'smallest' | 'safest' | 'recommended'`（默认 `true`=recommended）；子选项 `moduleSideEffects` / `annotations` / `manualPureFunctions` / `tryCatchDeoptimization`
- **注解**：`/*#__PURE__*/` 标单次调用（通用）；`/*@__NO_SIDE_EFFECTS__*/` 标整函数声明（Rollup 专属，一次注解覆盖所有调用点）
- **CSS 按需**：Tailwind v4 默认开 + `@source` / v3 `content` 数组 / PurgeCSS 独立工具
- **Vite 8 Rolldown**：`build.rollupOptions` → `build.rolldownOptions`、`output.manualChunks` → `output.codeSplitting`
- **import.meta.env.DEV**：编译期常量，prod build 时静态替换后整块死代码消除
- **失效场景**：CJS / barrel 无 sideEffects / `sideEffects: false` 误伤 polyfill / try-catch polyfill 特性检测 / 运行时变量判断 DEV / Webpack 只标 usedExports 不开 minimize
- **反模式**：在 dev 验证 shaking、把 `sideEffects: false` 当默认、barrel 文件深路径绕过

## Tree Shaking 原理

死代码消除的完整链路分三步：

```text
[1] 静态分析  打包器扫一遍 ESM 的 import/export，构建依赖图
[2] 标记      沿图反向传播，标记「未被任何 import 命中」的导出为 unused
              package.json sideEffects 字段决定「整模块」是否可被跳过
[3] 删除      Terser / esbuild 在压缩阶段把 unused 的导出真正删除
              Webpack mode=production → minimize: true 才会执行
```

**为何 ESM 才能 shake**

```ts
// ESM ✅ 静态可分析
import { used } from './mod';        // 顶层、字面量、不能在 if/循环里
export const unused = 1;             // 编译期就能算出有谁 import 了它

// CJS ❌ 动态、运行期值
const path = condition ? './a' : './b';
const mod = require(path);           // 路径是变量、值在运行期才确定
module.exports = { foo: 1 };         // exports 是对象、可被任意改写
```

> 静态分析的根本是「**编译期就能确定依赖图**」。CJS 的 `require` 接受变量、可放在 `if` 里、可在循环里调，整张图必须运行起来才能确定，因此打包器只能保守地保留全部代码。

## sideEffects：模块粒度的副作用声明

`package.json` 的 `"sideEffects"` 字段（Webpack 4 引入，已成跨工具标准）告诉打包器**「这个包 / 这些文件没有副作用，未引用即可跳过整模块」**。

**三态语义**

| 取值 | 含义 | 何时用 |
| --- | --- | --- |
| `false` | 整包无副作用，整模块可 shake | 纯工具库（lodash-es）/ 组件库的组件 JS 部分 |
| `Array<string>` | 白名单：列出的文件保留副作用，其余可 shake | 含 CSS、polyfill、CSS-in-JS 运行时的包 |
| 缺省（不写） | 保守保留整模块，**不做任何 shake 决策** | 不推荐——等于显式放弃优化 |

**典型配置**

```json
// 1. 纯 ESM 工具库：整包无副作用
{ "sideEffects": false }

// 2. 含 CSS 的组件库：CSS 保留、JS 可 shake
{
  "sideEffects": [
    "*.css",
    "*.scss"
  ]
}

// 3. 含 polyfill 与全局补丁的库
{
  "sideEffects": [
    "*.css",
    "./src/polyfills.js",
    "./src/global-patch.js"
  ]
}

// 4. 错误示例：把含 polyfill 的包标 false → polyfill 被删、运行时崩
{ "sideEffects": false }              // ⚠ 包内有 core-js / regenerator 时危险
```

**副作用判定规则（缺省情况下打包器认为有副作用的情况）**

- 顶层 `console.log` / `debugger`
- 顶层 IIFE 立即执行
- `class A extends B`（B 是表达式、可能副作用）
- 修改全局对象（`Array.prototype.xxx = ...`、`window.xxx = ...`）
- 顶层 `new BabelPlugin()`（构造可能副作用，除非 `/*#__PURE__*/` 标注）
- CSS / SCSS / LESS import（默认副作用，因为要把样式注入）

> `sideEffects: false` 是「**整模块可被跳过**」的承诺，不是「模块内部代码无副作用」。库作者承诺「未引用的导出从该模块引入不会有任何可观察影响」。CSS、polyfill、全局补丁**有可观察影响**，必须放进白名单。

## Webpack 五开关详解

```ts
// webpack.config.ts
import type { Configuration } from 'webpack';

const config: Configuration = {
  mode: 'production',                  // 一键启用下列所有
  optimization: {
    usedExports: true,                 // 标记每个模块的导出哪些被使用
    sideEffects: true,                 // 按 package.json sideEffects 字段跳过整模块
    innerGraph: true,                  // Webpack 5：分析未使用导出的内部依赖图
    providedExports: true,             // 收集每个模块提供了哪些导出
    mangleExports: true,               // 短名压缩导出标识符
    concatenateModules: true,          // Scope Hoisting：合并模块作用域
    minimize: true,                    // 真正执行删除（Terser / esbuild）
    minimizer: [/* new TerserPlugin() */],
  },
};

export default config;
```

**usedExports vs sideEffects（核心区别）**

| 维度 | `usedExports` | `sideEffects` |
| --- | --- | --- |
| **粒度** | 单个导出 | 整模块 |
| **动作** | 标记 unused 的导出，让 Terser 删除 | **跳过整模块**的解析（更彻底） |
| **触发** | 任何模块、自动分析 | 需 package.json `sideEffects` 字段配合 |
| **顺序** | 先 `sideEffects` 跳过整模块 → 再 `usedExports` 标记剩余导出 | 二者配合：sideEffects 决定「模块级」、usedExports 决定「导出级」 |

**innerGraph（Webpack 5 新增）**

未使用导出的**内部依赖图分析**：Webpack 5 之前，如果一个导出未被使用但内部有 re-export，则内部全部保留；Webpack 5 起分析导出之间的依赖关系，能精确识别哪些 re-export 链也可被剪掉。

> `innerGraph` 自 Webpack 5 起在所有 mode 下默认启用，无需配置；`usedExports` / `sideEffects` 自 Webpack 5 起也默认启用，`mode: 'production'` 额外开启 `concatenateModules` / `mangleExports` / `minimize`。

**minimize：真正删除死代码的环节**

只标 `usedExports: true` 不开 `minimize`，死代码**仍在 bundle**——只是 Terser 不工作而已。验证 shaking 是否生效，必须看 production build 后的 bundle 体积或 stats 的 `usedExports` 字段。

## Rollup treeshake 配置

```ts
// rollup.config.ts
import type { RollupOptions } from 'rollup';

const options: RollupOptions = {
  treeshake: 'recommended',           // 三预设：smallest | safest | recommended
  // 或细粒度：
  // treeshake: {
  //   annotations: true,             // 默认：尊重 #__PURE__ / @__NO_SIDE_EFFECTS__
  //   moduleSideEffects: 'no-external', // 外部包无副作用
  //   manualPureFunctions: ['clsx', 'cx'], // 自定义纯函数清单
  //   propertyReadSideEffects: true, // 默认：属性读可能有副作用
  //   tryCatchDeoptimization: true,  // 默认：try 内代码不被 shake
  //   unknownGlobalSideEffects: true,
  //   correctVarValueBeforeDeclaration: false,
  // },
};

export default options;
```

**三预设**

| 预设 | 行为 |
| --- | --- |
| `'smallest'` | 最激进，体积最小；可能删有副作用的代码，慎用 |
| `'safest'` | 最保守，保留更多代码以保证正确 |
| `'recommended'`（默认 `true`） | 平衡选择，大多数项目应使用 |

**关键子选项**

| 选项 | 默认 | 含义 |
| --- | --- | --- |
| `annotations` | `true` | 尊重 `/*#__PURE__*/` / `/*@__NO_SIDE_EFFECTS__*/` 注解 |
| `moduleSideEffects` | `true` | 假设模块有副作用；设 `false` / `'no-external'` / 数组 / 函数自定义 |
| `manualPureFunctions` | `[]` | 列出始终视为无副作用的函数名，如 `['clsx', 'css']` |
| `propertyReadSideEffects` | `true` | 属性读 `obj.x` 可能副作用（getter） |
| `tryCatchDeoptimization` | `true` | try/catch 内代码不被 shake（**polyfill 检测易卡这里**） |
| `unknownGlobalSideEffects` | `true` | 未知全局变量访问视为副作用 |

## Vite 8 Rolldown 迁移

Vite 8（2026）起 Rolldown（Rust 实现，比 Rollup 快 10–30×）成为**唯一打包器**，替代 Rollup。

**关键迁移**

| Vite 7（Rollup） | Vite 8（Rolldown） | 备注 |
| --- | --- | --- |
| `build.rollupOptions` | `build.rolldownOptions` | 配置入口改名 |
| `output.manualChunks`（对象） | **已移除** | 静默不生效 |
| `output.manualChunks`（函数） | `output.codeSplitting`（弃用警告） | 函数形式已弃用 |

> Vite 7 用 `rolldown-vite` 包做过渡预览，Vite 8 正式替换。仍写 `manualChunks` 的项目：对象形式被静默忽略（分包策略失效）、函数形式会告警。

**Vite 内置的编译期常量**

```ts
// 下列常量在 prod build 时被静态替换为字面量
import.meta.env.DEV            // → false
import.meta.env.PROD           // → true
import.meta.env.MODE           // → 'production'
import.meta.env.SSR            // → false（或 true）
```

**`if (import.meta.env.DEV) { ... }` 死代码消除**

```ts
// 源码
if (import.meta.env.DEV) {
  console.log('debug info', heavyCompute());
}

// prod build 后
// （整段 if 被静态替换为 if (false) 后死代码消除，console.log 与 heavyCompute 都消失）
```

> 把 `import.meta.env.DEV` 改成运行期变量 `const isDev = process.env.NODE_ENV !== 'production'` 会**失去静态可分析性**，prod build 不会 tree-shake 这段代码——必须直接用编译期常量。

## 注解：精确声明副作用边界

打包器静态分析保守地把「调用 / 构造」视为副作用。注解让库作者**显式声明**「这次调用是纯的，未引用可删」。

**/*#__PURE__*/：标记单次调用 / 构造（通用）**

```ts
// 1. IIFE 立即执行：默认有副作用
const result = (function () {        // ⚠ 整段被保留
  return computeStuff();
})();

// 标注后：未引用 result 时整段可删
const result = /*#__PURE__*/ (function () {
  return computeStuff();
})();

// 2. class extends：默认父类表达式有副作用
class MyComp extends createHOC(BaseComp) {}   // ⚠ createHOC() 被保留

class MyComp extends /*#__PURE__*/ createHOC(BaseComp) {}  // ✅

// 3. 工厂函数调用
const styles = makeStyles({ ... });   // ⚠
const styles = /*#__PURE__*/ makeStyles({ ... });   // ✅
```

Vue / React 编译器会**自动**给 `h()` / `createElement()` / `defineComponent()` 等加 `#__PURE__` 注解，所以业务代码通常不需要手动加。

**/*@__NO_SIDE_EFFECTS__*/：标记整函数声明（Rollup 专属）**

```ts
// Rollup 专属：一次注解覆盖所有调用点
/*@__NO_SIDE_EFFECTS__*/
function createStyle(opts) {        // 函数体内本身可能有副作用
  return compute(opts);             // 但调用点未引用返回值时整段可删
}

/*@__NO_SIDE_EFFECTS__*/
const makeStyle = (opts) => compute(opts);

// vs 每次调用都加 #__PURE__：
const a = /*#__PURE__*/ createStyle(...);    // 繁琐
const b = /*#__PURE__*/ createStyle(...);
```

> 选用原则：单次调用用 `#__PURE__`（通用，所有打包器）；库作者对一整组工厂函数声明用 `@__NO_SIDE_EFFECTS__`（Rollup 专属，省去每个调用点都注解）。

## CSS 按需生成

CSS 体积常是 JS 的数倍，按需生成是 shaking 的姊妹优化。

**Tailwind v4（默认开启 tree-shaking + CSS-first）**

```css
/* 入口 CSS（main.css）—— CSS-first 配置 */
@import "tailwindcss";

/* 自定义源扫描路径（替代 v3 content 数组） */
@source "../src/**/*.{vue,js,ts,jsx,tsx}";
@source "../components/**/*.vue";
```

**Tailwind v3（content 数组）**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.vue',
    './index.html',
  ],
  // purge: [...]   // ⚠ v2 字段，v3 已废弃
};
```

**PurgeCSS（独立工具，跨方案）**

```js
// purgecss.config.js
export default {
  content: ['./src/**/*.html', './src/**/*.vue', './src/**/*.js'],
  defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
};
```

> Tailwind v4 默认开启、PurgeCSS 须显式接入——但**两者都依赖「扫描源码、保留用到的类名」**机制，源码里动态拼接类名（如 `class="bg-${color}-500"`）扫不到，类名会被误删。

## CJS 转 ESM：迁移坑与失效场景

**为什么不能简单 shim**

```ts
// ❌ transpile-only：把 import 编译成 require 后再打包
// 依赖图仍是 CJS 动态结构，shaking 失效
import _ from 'lodash';            // 编译后 const _ = require('lodash')
                                  // require 是运行期值、不可静态分析

// ❌ re-export 桥接
export const get = require('lodash/get');
                                  // module.exports 的赋值、CJS 不可 shake
```

**正确迁移姿势**

| 现状 | 推荐 |
| --- | --- |
| `import _ from 'lodash'` | 改用 `lodash-es` |
| `import _ from 'lodash'` 但只用 `get` | 改用 `import get from 'lodash-es/get'` |
| `import moment from 'moment'` | 改用 `date-fns` 或 `dayjs`（ESM） |
| 自家旧 CJS 库 | 双入口：`main`（CJS）+ `module`（ESM），打包器自动选 ESM |

**失效场景速查**

| 场景 | 为何失效 | 解法 |
| --- | --- | --- |
| CJS 库（lodash / moment） | 动态 require | 改 ESM 等价物 |
| barrel 文件 + 缺 sideEffects | 打包器保守保留整张图 | `sideEffects: false` 或深路径 import |
| `sideEffects: false` + polyfill | polyfill 被误删、运行时崩 | 改白名单 `["*.css", "./src/polyfills.js"]` |
| try-catch polyfill 特性检测 | Rollup `tryCatchDeoptimization: true` 默认保留 | 重写为显式 if 或手动 `manualPureFunctions` |
| 运行期变量判断 DEV | 失去静态可分析性 | 直接用 `import.meta.env.DEV` |
| 只标 usedExports 不开 minimize | 标了不删，bundle 体积无变化 | 开 `minimize: true` |
| dev 模式验证 | dev 不删代码以便调试 | `production` build 后看 stats |
| 动态拼接类名（Tailwind） | 扫不到类名被误删 | 用完整类名 + safelist |

## 反模式（避坑）

- **在 CJS 上期待 tree shaking**：`require()` / `module.exports` 动态结构不可静态分析，全部代码被保留；lodash(CJS) / moment(CJS) 是经典受害者
- **`"sideEffects": false` 设过头**：包内 polyfill（core-js / regenerator / whatwg-fetch）、CSS-in-JS 运行时、`Array.prototype` 扩展被误删，dev 正常 prod 崩；应改白名单 `["*.css", "./src/polyfills.js"]`
- **用 barrel 文件且不设 sideEffects**：bundler 为安全保留整张依赖图，组件库典型症状是只引一个 Button 却打入全部组件
- **只在 dev 模式验证 tree shaking**：dev 不删代码；必须 production build 后看 webpack stats 的 `providedExports` / `usedExports` 字段或比较 bundle 体积
- **Webpack 设了 `usedExports: true` 却不开 `minimize`**：只标记不删除，死代码仍在 bundle、体积无变化
- **IIFE / 构造调用 / `new Class()` 未加 `/*#__PURE__*/`**：纯构造（如 `new BabelPlugin()`）因被认为可能有副作用被整体保留
- **函数实际有副作用却标 `@__PURE__`**：破坏运行时行为，dev 正常 prod 崩
- **polyfill 特性检测写在 `try{}` 内**：Rollup 默认 `tryCatchDeoptimization: true` 保留 try 内全部代码不被 shake
- **把 `import.meta.env.DEV` 改成运行时变量判断**（`const isDev = ...`）：失去静态可分析性，无法被 prod build tree-shake
- **Vite 升 8 后仍写 `build.rollupOptions.output.manualChunks`**：对象形式被移除（静默不生效）、函数形式弃用（警告），分包策略失效；应改 `output.codeSplitting`
- **以为 `mode: 'development'` 也做 tree shaking**：开发模式默认禁用 `minimize` 与 `concatenateModules`，shaking 标记存在但不删除，验证无效
- **库 `package.json` 不写 `sideEffects` 字段**：等价于「保守保留整模块」，仅 `usedExports` 单导出级别剪枝，模块顶层副作用代码全部保留

## 下一步

- [参考](./reference.md)：完整配置项表（sideEffects / usedExports / innerGraph / purgeCSS / Rollup treeshake）+ 版本状态 + 官方资源
