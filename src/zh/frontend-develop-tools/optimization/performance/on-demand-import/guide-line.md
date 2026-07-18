---
layout: doc
outline: [2, 3]
---

# 按需引入实践

> 基于 Element Plus / Apache ECharts / lodash-es / unplugin-vue-components / unplugin-auto-import 官方文档编写，对照 Element Plus 2.14.3、ECharts 6.1.0、lodash-es 4.18.1

## 速查

- **Element Plus 自动按需**：`AutoImport({ resolvers:[ElementPlusResolver()] })` + `Components({ resolvers:[ElementPlusResolver()] })` 双插件并用——前者管 `ElMessage/ElMessageBox` 命令式 API，后者管 `<el-button>` 模板组件 + 样式
- **ElementPlusResolver 选项**：`importStyle`（默认 `'css'` 引预编译样式 / `'sass'` 引源码改主题变量 / `false` 不引样式）
- **lodash-es ESM**：`import { debounce } from 'lodash-es'` 命名导入即 tree-shake；CJS 的 lodash 用子路径 `import debounce from 'lodash/debounce'` 做近似按需
- **ECharts 按需五件套**：`echarts/core` + `echarts/charts` + `echarts/components` + `echarts/features` + `echarts/renderers` → `echarts.use([...])` 显式注册
- **ECharts 渲染器必须二选一**：`CanvasRenderer` 或 `SVGRenderer`；core 不含 renderer，不注册报错
- **ECharts v5+ 仅 named export**：`import * as echarts from 'echarts/core'`，禁止 `import echarts from 'echarts'`
- **TS 类型按需拼接**：`type ECOption = ComposeOption<BarSeriesOption | GridComponentOption>`，能编译期查「用了未注册组件」
- **sideEffects 三取值**：`false` / 数组白名单（如 `["*.css"]`）/ 不设；库设错会误删副作用
- **类型 d.ts 提交 git**：`auto-imports.d.ts` / `components.d.ts` 别 gitignore
- **反模式**：默认导入 `lodash` / `lodash-es`、Element Plus 全量+按需混用、ECharts 只 import 不 `use`、漏注册 renderer、用 `importStyle:'css'` 改 SCSS 变量

## Element Plus 按需：自动导入（推荐）

Element Plus 官方推荐用 `unplugin-vue-components` + `unplugin-auto-import` 实现自动按需。两个插件分工不同，**必须同时挂载**：

```bash
pnpm i -D unplugin-vue-components unplugin-auto-import
```

```ts
// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default {
  plugins: [
    // ① 自动导入命令式 API：ElMessage / ElMessageBox / ElLoading 等
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: true,           // 生成 auto-imports.d.ts
    }),
    // ② 自动注册模板组件 + 样式：<el-button> / <el-input> 等
    Components({
      resolvers: [ElementPlusResolver()],
      dts: true,           // 生成 components.d.ts
    }),
  ],
}
```

**为什么必须双插件**

| 插件 | 负责 | 不装的后果 |
| --- | --- | --- |
| `AutoImport` | `ElMessage()`、`ElMessageBox()`、`ElLoading()` 等命令式 API + Vue/Vue Router/Pinia 等 | API 调用报「未定义」 |
| `Components` | `<el-button>` 模板组件 + 组件样式（按 `importStyle` 注入） | 模板组件不渲染、样式丢失 |

> 只装一个会导致「API 缺失」或「组件缺失」。两者用同一个 `ElementPlusResolver()` 协同——一个管 JS API、一个管组件 DOM 与 CSS。

写完即用——无需手写 import：

```vue
<script setup lang="ts">
// ElMessage 自动注入，无需 import
ElMessage.success('保存成功')
</script>

<template>
  <!-- el-button 组件与样式自动按需引入 -->
  <el-button type="primary">提交</el-button>
</template>
```

### ElementPlusResolver 关键选项

```ts
ElementPlusResolver({
  importStyle: 'css',    // 默认：引入预编译 CSS 样式（最常用）
  // importStyle: 'sass', // 引入 SCSS 源码，支持改主题变量
  // importStyle: false,  // 不引入样式（自行管理）
  directives: true,      // 自动注册 v-loading / v-infinite-scroll 等指令
})
```

| `importStyle` | 用途 | 限制 |
| --- | --- | --- |
| `'css'`（默认） | 引入预编译 CSS | **改不了** SCSS 变量（CSS 是产物） |
| `'sass'` | 引入 SCSS 源码 | 可改主题变量，但 `additionalData` 注入会拖慢热更新 |
| `false` | 不引入 | 自行管理全局样式 |

## Element Plus 按需：手动 Tree Shaking

如果不想用 unplugin 自动导入，Element Plus 基于 ES Module 开箱即用 tree-shaking，但**样式**需要 `unplugin-element-plus` 插件配合：

```bash
pnpm i -D unplugin-element-plus
```

```ts
// vite.config.ts
import ElementPlus from 'unplugin-element-plus/vite'

export default {
  plugins: [
    ElementPlus({ useSource: true }),  // 引入 SCSS 源码样式
  ],
}
```

```ts
// 业务代码手动 import
import { ElMessage, ElButton } from 'element-plus'
```

> 手动方案现已较少用，自动导入（双插件）是主流。手动方案适合需要精细控制引入清单的场景。

## Element Plus + Sass 主题定制

切换 `importStyle: 'sass'` 后，可通过覆盖 SCSS 变量改主题：

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // additionalData 注入到每个组件 scss 顶部
        additionalData: `@use "@/styles/element-vars.scss" as *;`,
      },
    },
  },
})
```

```scss
// src/styles/element-vars.scss
/* 用 @forward 转发 Element Plus 变量文件，覆盖颜色 */
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': ('base': #18a058),
  )
);
```

> Sass 团队将废弃 `@import`，**改用 `@use` / `@forward`**：`@use` 解决变量重复输出问题。注意 `additionalData` 会注入每个组件 scss，业务 scss 与变量 scss 必须分离，否则热更新会反复编译大量 scss 致慢。

## lodash-es 按需

lodash 的 CJS 包（`lodash`）是 CommonJS UMD，**导出动态、bundler 无法静态分析**——整包打包，无法 tree-shake。三种写法的差异：

```ts
// ❌ 默认导入：lodash-es 的默认导出聚合了全部方法，破坏 tree-shaking
import _ from 'lodash-es'
_.debounce(fn, 200)

// ✅ ESM 命名导入：bundler 静态分析，只打包 debounce
import { debounce } from 'lodash-es'
debounce(fn, 200)

// ✅（备选）CJS lodash 子路径：手动指定方法路径，近似按需
import debounce from 'lodash/debounce'
debounce(fn, 200)
```

| 写法 | 包类型 | tree-shake | 备注 |
| --- | --- | --- | --- |
| `import _ from 'lodash-es'` | ESM | ❌ 默认导入聚合全部方法 | 反模式 |
| `import { debounce } from 'lodash-es'` | ESM | ✅ 命名导入即按需 | **推荐** |
| `import debounce from 'lodash/debounce'` | CJS | ✅ 手动子路径 | 备选方案 |
| `import _ from 'lodash'` | CJS | ❌ 整包动态导出 | 反模式 |

> `babel-plugin-lodash` 是针对 CJS lodash 做子路径重写的插件——**配 lodash-es 反而多余甚至冲突**，已在按需场景淘汰。

## ECharts 按需：registerables 五件套

ECharts 自 v5 起，源码用 TypeScript 重写，提供 `echarts/core` 等 tree-shaking 友好入口。完整按需引入需五件套并用 `echarts.use([...])` 注册：

```ts
// ① 核心：不含任何图表/组件/渲染器
import * as echarts from 'echarts/core'

// ② 图表（按用到的引入）
import { BarChart, LineChart } from 'echarts/charts'

// ③ 组件（坐标轴、Tooltip、图例等）
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'

// ④ 特性（标签布局、过渡动画等）
import { LabelLayout, UniversalTransition } from 'echarts/features'

// ⑤ 渲染器：Canvas 或 SVG（二选一）
import { CanvasRenderer } from 'echarts/renderers'

// 必须显式注册——只 import 不 use 会静默失效
echarts.use([
  BarChart, LineChart,
  TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  LabelLayout, UniversalTransition,
  CanvasRenderer,
])
```

### TS 类型按需拼接：ComposeOption

```ts
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
} from 'echarts/components'

// 拼接最小 Option 类型——精确反映已注册的 series + component
type ECOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
>

const option: ECOption = {
  title: { text: '示例' },
  tooltip: {},
  xAxis: { type: 'category' },
  yAxis: {},
  series: [{ type: 'bar', data: [10, 20] }],
}
```

> `ComposeOption` 能在编译期查出「用了未注册的组件」——如果你 series 写了 `type: 'pie'` 但没注册 `PieChart`，TS 编译就报错（运行时则静默失效）。

### 必须显式注册渲染器

ECharts tree-shaking 接口下，`core` **不含任何 renderer**：

- **必须二选一注册** `CanvasRenderer` 或 `SVGRenderer`
- 不注册会运行时报错（无法渲染）
- 只用 SVG 模式时只引 `SVGRenderer` 可省去 Canvas 代码（官方明确为此设计）

```ts
// 纯 SVG 模式（移动端轻量场景常用）
import { SVGRenderer } from 'echarts/renderers'
echarts.use([/* ...其它 */, SVGRenderer])
```

> 禁用 `import echarts from 'echarts'`：v5+ 仅 named export，默认导入会抛错。ECharts v6 与 v5 的 tree-shaking API **完全一致**，写法不变。

## sideEffects 字段详解

库作者的 `package.json` 设置：

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

```json
{
  "name": "my-ui-lib"
}
```

| 取值 | 含义 | bundler 行为 |
| --- | --- | --- |
| `false` | 整包无副作用 | 所有未引用导出都可剪 |
| `["*.css", "./src/polyfills.js"]` | 白名单文件有副作用 | 白名单保留，其余剪 |
| 不设 / 默认 | 保守按「有副作用」 | 不剪，整包打入 |

> 库设 `sideEffects: false` 但实际模块有副作用（CSS 注入、修改全局变量、polyfill）会被 bundler 误删——Webpack 在某些场景连 `console.log` 都会被剪。**业务项目设错同样会误删 polyfill/CSS 副作用**。

## unplugin-auto-import 与 unplugin-vue-components 配置项

### unplugin-auto-import

```ts
AutoImport({
  imports: ['vue', 'vue-router', 'pinia'],  // preset 数组
  dirs: ['src/composables'],                 // 自动导入自定义目录
  resolvers: [ElementPlusResolver()],        // 库 API 解析器
  dts: true,                                 // 生成 auto-imports.d.ts（建议提交 git）
  vueTemplate: true,                         // 模板内注入
  include: /\.[tj]sx?$/,                     // 处理哪些文件
  exclude: [/node_modules/, /\.git/],
})
```

### unplugin-vue-components

```ts
Components({
  resolvers: [ElementPlusResolver()],        // 组件解析器
  dirs: ['src/components'],                  // 自定义组件目录
  extensions: ['vue'],                       // 文件扩展名
  dts: true,                                 // 生成 components.d.ts
  deep: true,                                // 深度扫描 dirs
})
```

> **`dts: true` 生成的 `.d.ts` 必须提交 git**——CI 环境、新同事拉代码即有类型，避免 TS 报错与 IDE 红线。

## 反模式汇总

```ts
// ❌ 默认导入 lodash：聚合全部方法，破坏 tree-shaking
import _ from 'lodash-es'
_.debounce(fn, 200)

// ❌ 默认导入 ECharts：v5+ 仅 named export，会抛错
import echarts from 'echarts'

// ❌ 只 import 组件不 use：运行时不报错但图表静默失效
import { BarChart } from 'echarts/charts'
// 忘记 echarts.use([BarChart]) → 图表空白

// ❌ 漏注册 renderer：core 不含 renderer，无法渲染
import * as echarts from 'echarts/core'
// 忘记 echarts.use([CanvasRenderer]) → 报错

// ❌ 用旧 CJS 子路径：v5+ 不再支持从 echarts/src 或 echarts/lib/chart/xxx 导入
import 'echarts/lib/chart/bar'

// ❌ Element Plus 同时全量 + 按需：重复打包、样式冲突
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 又同时配了 ElementPlusResolver

// ❌ 用 importStyle:'css' 改 SCSS 变量：css 是预编译产物，改不了
ElementPlusResolver({ importStyle: 'css' })
// 然后试图 @forward var.scss → 不会生效

// ❌ 把 dts 加入 .gitignore：CI/同事类型缺失
// .gitignore: auto-imports.d.ts, components.d.ts
```

> ECharts 只 `import` 组件不调用 `echarts.use` 是新手最常踩坑——**运行时不报错但图表静默失效**（图表区域空白）。同样，忘注册 `CanvasRenderer`/`SVGRenderer` 会直接报错。

## 选型决策

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| Vue 3 项目 + Element Plus | unplugin-auto-import + unplugin-vue-components | 自动按需，体验最好 |
| 通用工具方法（debounce/throttle 等） | `lodash-es` 命名导入 | ESM 即 tree-shake，无需插件 |
| CJS 项目（无法切 ESM） | `lodash/method` 子路径 | 退而求其次的按需 |
| ECharts 项目 | 五件套 + `echarts.use([...])` | 精确控制打包范围 |
| React/Angular 项目 + UI 库 | 各自生态的 Resolver（如 React 用 `@mui/x` 等） | 同理按需 Resolver |
| 自家 UI 库 | 正确声明 `sideEffects` + ESM 导出 | 让用户能 tree-shake |
