---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Element Plus / Apache ECharts / lodash-es / unplugin-vue-components / unplugin-auto-import 官方文档编写，对照 Element Plus 2.14.3、ECharts 6.1.0（与 v5 tree-shaking API 完全一致）、lodash-es 4.18.1

## 速查

- **按需引入 = 编译期/构建期剪掉没用代码**，三前提：ESM 静态结构 + package.json `sideEffects` 字段 + bundler tree-shaking（Vite/Rollup/Webpack 5+）
- **lodash 用 lodash-es**：`import { debounce } from 'lodash-es'`（命名导入即 tree-shake）；CJS 的 `lodash` 无法静态分析，只能靠子路径 `import debounce from 'lodash/debounce'` 拼近似按需
- **Element Plus 自动按需**：`pnpm i -D unplugin-vue-components unplugin-auto-import`，vite.config 同时挂 `AutoImport({ resolvers:[ElementPlusResolver()] })`（命令式 API 如 `ElMessage`）+ `Components({ resolvers:[ElementPlusResolver()] })`（模板组件 + 样式），**双插件缺一不可**
- **ECharts 按需五件套**：`echarts/core`（核心）+ `echarts/charts`（图表）+ `echarts/components`（组件）+ `echarts/features`（特性）+ `echarts/renderers`（渲染器），再用 `echarts.use([...])` 显式注册
- **ECharts 渲染器必须二选一**：`CanvasRenderer` 或 `SVGRenderer`，core 不含任何 renderer，不注册会报错
- **ECharts v5+ 禁默认导入**：`import * as echarts from 'echarts/core'`，`import echarts from 'echarts'` 会抛错（仅 named export）
- **`sideEffects` 三取值**：`false`（整包无副作用可剪）/ 数组（如 `["*.css","./src/polyfills.js"]` 白名单）/ 不设（保守按有副作用处理，不剪）
- **类型文件提交 git**：`auto-imports.d.ts` / `components.d.ts` 别 .gitignore，否则 CI/同事类型缺失

## 什么是按需引入

「按需引入」是相对「全量引入」而言——全量引入会把整个库打进产物（无论是否用到），按需引入只把**真正被使用的部分**打包，剩余代码在构建阶段剪掉（tree-shaking）或在编译阶段按需 Resolver 注入（unplugin 自动导入）。两者最大的差别在最终产物体积：

```text
# 全量（无论用没用到都打包）
import _ from 'lodash-es'         # ≈ 70KB（gzip 25KB）
import ElementPlus from 'element-plus'
import * as echarts from 'echarts' # ≈ 1MB（gzip 330KB）

# 按需（只打包用到的）
import { debounce } from 'lodash-es'      # 几百字节
// unplugin 自动只引入 <el-button>、ElMessage  # 仅打包这些
import * as echarts from 'echarts/core'    # 仅打包折线 + Tooltip + Canvas
echarts.use([LineChart, TooltipComponent, CanvasRenderer])
```

> 「按需引入」不是某种新语法，而是 **ESM + tree-shaking + 配套工具链**综合形成的一种工程实践，每个库的实现细节略有不同。

## 为什么必须 ESM：tree-shaking 的前提

Tree-shaking（摇树优化）依赖**模块依赖关系在编译期可静态分析**。CommonJS 的 `require` / `module.exports` 是**运行时**值，可写在 `if`、循环里，bundler 无法在不执行代码的前提下判断哪些导出被用到——这就是 CJS 的 `lodash` 整包无法 tree-shake 的根本原因。ESM 的 `import` / `export` 是**声明**，必须在顶层、不能放函数体内，导入导出关系在编译期完全确定，bundler 可以从入口出发追踪每个导出是否被引用，未被引用的代码段就能安全剪掉。

```ts
// ESM ✅ 静态结构，编译期可分析
import { debounce } from 'lodash-es'   // bundler 知道只用了 debounce

// CJS ❌ 运行时值，无法静态分析
const _ = require('lodash')            // bundler 不知道你要哪个方法，整包打包
_.debounce(fn, 200)
```

> 「ESM 是 tree-shaking 的前提」是这一节的核心结论，也是 lodash/lodash-es 选型分歧的根因。

## sideEffects 字段：告诉 bundler 哪些能剪

光有 ESM 还不够——某些模块即使没导出被引用，也会在 import 时产生副作用（注入 CSS、修改全局变量、注册 polyfill）。`package.json` 的 `sideEffects` 字段让库作者声明哪些文件有副作用不能剪：

```json
{
  "name": "my-ui-lib",
  "sideEffects": false
}
```

```json
{
  "name": "my-ui-lib",
  "sideEffects": ["*.css", "*.scss", "./src/polyfills.js"]
}
```

| 取值 | 含义 | 影响 |
| --- | --- | --- |
| `false` | 整包无副作用 | 所有未引用导出都可安全剪 |
| 数组（glob 白名单） | 列出的文件有副作用 | 白名单文件保留，其余可剪 |
| 不设 / 默认 | 保守按「有副作用」处理 | bundler 不剪，整包打入 |

> 库作者误把整包 `sideEffects: false` 设错，会误删 CSS 注入、polyfill 等副作用代码——业务项目设错同理。**ESM + 正确 sideEffects + bundler 支持**三者齐备，tree-shaking 才会真正发生。

## 三大典型场景速览

| 场景 | 范式 | 入口 |
| --- | --- | --- |
| **Element Plus 等组件库** | unplugin-vue-components + unplugin-auto-import 自动导入，ElementPlusResolver 解析 | [Element Plus 手动 + unplugin 自动](./guide-line.md) |
| **lodash-es 等工具库** | ESM 命名导入（`import { debounce } from 'lodash-es'`），bundler 自动 tree-shake | [lodash-es 与子路径](./guide-line.md) |
| **ECharts 等图表库** | core + charts + components + features + renderers 五件套，`echarts.use([...])` 显式注册 | [ECharts 按需 registerables](./guide-line.md) |

## 体积收益对照（典型）

| 库 | 全量 gzip | 按需 gzip（典型场景） |
| --- | --- | --- |
| lodash | ≈ 25KB | `debounce` 单方法 ≈ 1KB |
| lodash-es | ≈ 25KB | 命名引入即按需 |
| Element Plus | CSS ≈ 300KB + JS | 仅用到的组件（通常 < 50KB） |
| ECharts | ≈ 330KB | 折线 + Tooltip + Canvas ≈ 200KB |

> 实际收益取决于用到的组件数与图表类型，但量级总是「百 KB → 几 KB / 几十 KB」级别。

## 下一步

- [按需引入实践（Element Plus 手动+unplugin 自动 / lodash-es ESM / ECharts 按需 registerables / sideEffects + 反模式）](./guide-line.md)
- [参考（各库按需用法表 + 版本 + 链接）](./reference.md)
