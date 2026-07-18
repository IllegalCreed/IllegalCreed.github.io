---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Element Plus / Apache ECharts / lodash-es / unplugin 官方文档编写，对照 Element Plus 2.14.3、ECharts 6.1.0、unplugin-vue-components 32.1.0、unplugin-auto-import 21.0.0、lodash-es 4.18.1（截至 2026-07）

## 速查

- 三前提：**ESM 静态结构 + package.json `sideEffects` 字段 + bundler tree-shaking**（Vite/Rollup/Webpack 5+）
- **lodash**：用 `lodash-es` 命名导入 `import { debounce } from 'lodash-es'`；CJS 项目用子路径 `lodash/debounce`
- **Element Plus**：`AutoImport` + `Components` 双插件 + `ElementPlusResolver()`；`importStyle` 默认 `'css'` / 改主题用 `'sass'` / 不引用 `false`
- **ECharts**：core + charts + components + features + renderers 五件套 + `echarts.use([...])`；渲染器必须二选一
- TS 类型：`type ECOption = ComposeOption<BarSeriesOption | GridComponentOption>`
- 类型 d.ts（`auto-imports.d.ts` / `components.d.ts`）**提交 git**
- 完整说明见 [入门](./getting-started.md) / [按需引入实践](./guide-line.md)

## 各库按需用法表

### Element Plus（v2.14.3）

| 模式 | 写法 | 备注 |
| --- | --- | --- |
| 全量 | `app.use(ElementPlus)` + `import 'element-plus/dist/index.css'` | 体积大，不推荐 |
| 自动按需（推荐） | `AutoImport({ resolvers:[ElementPlusResolver()] })` + `Components({ resolvers:[ElementPlusResolver()] })` | 双插件并用 |
| 手动按需 | `import { ElButton } from 'element-plus'` + `unplugin-element-plus({ useSource:true })` 引样式 | 精细控制场景 |
| 主题定制 | `importStyle:'sass'` + `@forward 'element-plus/theme-chalk/src/common/var.scss'` + `additionalData` 注入 | 业务/变量 scss 分离 |

**ElementPlusResolver 选项**

```ts
ElementPlusResolver({
  importStyle: 'css' | 'sass' | false,  // 默认 'css'
  directives: true,                       // 自动注册指令
  // version: 2.x  // 自动检测；多版本共存时手动指定
})
```

### lodash-es（v4.18.1）

| 写法 | tree-shake | 备注 |
| --- | --- | --- |
| `import { debounce } from 'lodash-es'` | ✅ | 推荐 |
| `import debounce from 'lodash/debounce'` | ✅（CJS 子路径） | 备选 |
| `import _ from 'lodash-es'` | ❌ | 默认导入聚合全部方法 |
| `import _ from 'lodash'` | ❌ | CJS 整包 |

> 4.17.22 及之前有原型污染漏洞，应升级到 4.18.1（2026-04-01 发布）。`babel-plugin-lodash` 针对旧 CJS lodash，配 lodash-es 多余甚至冲突。

### ECharts（v6.1.0，与 v5 tree-shaking API 一致）

**完整五件套模板**

```ts
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent,
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'  // 或 SVGRenderer

echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent,
  LabelLayout, UniversalTransition,
  CanvasRenderer,
])
```

**常用 charts/components/features/renderers**

| 类型 | 入口 | 示例 |
| --- | --- | --- |
| 图表 | `echarts/charts` | `BarChart`、`LineChart`、`PieChart`、`ScatterChart`、`MapChart` |
| 组件 | `echarts/components` | `TitleComponent`、`TooltipComponent`、`GridComponent`、`LegendComponent`、`DataZoomComponent`、`VisualMapComponent` |
| 特性 | `echarts/features` | `LabelLayout`、`UniversalTransition` |
| 渲染器 | `echarts/renderers` | `CanvasRenderer`、`SVGRenderer`（二选一） |

> 渲染器是「必须二选一注册」的——core 不含 renderer，漏注册会运行时报错。

**v6 相对 v5 的破坏性变更**（tree-shaking API **不变**）：

- 默认主题调整（图例默认移到底部）
- 富文本继承（`richInheritPlainLabel`）
- 标签溢出规避策略升级
- `echarts/core` + `use([...])` 模板完全沿用 v5

### unplugin-auto-import（v21.0.0，2026-01-14 发布）

```ts
AutoImport({
  imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
  dirs: ['src/composables', 'src/stores'],
  resolvers: [ElementPlusResolver()],
  dts: true,                  // 生成 auto-imports.d.ts
  vueTemplate: true,
  include: [/\.[tj]sx?$/, /\.vue$/],
  exclude: [/node_modules/, /\.git/],
})
```

| 选项 | 含义 |
| --- | --- |
| `imports` | preset 数组：`'vue'`、`'vue-router'`、`'pinia'` 等 |
| `dirs` | 自动导入自定义目录（如 `composables`、`stores`） |
| `resolvers` | 库 API 解析器（如 `ElementPlusResolver`） |
| `dts` | 生成 `auto-imports.d.ts` 类型文件（建议 `true` 并提交 git） |
| `vueTemplate` | 在 `<script setup>` 模板内也注入 |
| `include` / `exclude` | 处理范围 glob |

### unplugin-vue-components（v32.1.0）

```ts
Components({
  resolvers: [ElementPlusResolver()],
  dirs: ['src/components'],
  extensions: ['vue'],
  dts: true,                  // 生成 components.d.ts
  deep: true,                 // 深度扫描 dirs
})
```

| 选项 | 含义 |
| --- | --- |
| `resolvers` | 组件解析器数组（如 `ElementPlusResolver`、`VantResolver`、`AntDesignVueResolver`） |
| `dirs` | 自定义组件目录 |
| `extensions` | 文件扩展名 |
| `dts` | 生成 `components.d.ts` |
| `deep` | 是否深度扫描目录 |

## sideEffects 字段速查

| 取值 | 含义 | bundler 行为 | 风险 |
| --- | --- | --- | --- |
| `false` | 整包无副作用 | 未引用导出可剪 | 设错会误删 polyfill / CSS / 全局修改 |
| `["*.css","*.scss"]` | 白名单有副作用 | 白名单保留 | 误把无副作用文件列入会保留无用代码 |
| 不设 | 保守有副作用 | 不剪 | 整包打入，tree-shaking 失效 |

## 版本与兼容

| 包 | 当前版本（2026-07） | 关键变化 |
| --- | --- | --- |
| element-plus | 2.14.3 | 2.8.5+ 要求 Sass ≥1.79.0 |
| echarts | 6.1.0（v5 末版 5.6.0） | v6 主要破坏性变更是默认主题与富文本继承，tree-shaking API 与 v5 完全一致 |
| lodash / lodash-es | 4.18.1（同步） | 修复 4.17.22 之前原型污染漏洞；官方已宣布 lodash-es 未来将并入 lodash 现代 ESM 版本 |
| unplugin-vue-components | 32.1.0 | 支持所有主流框架 |
| unplugin-auto-import | 21.0.0（2026-01-14） | 新 preset、新解析器 |
| Vite | 7.x（含 Rollup 4） | tree-shaking 默认开启，无需额外配置 |
| Webpack | 5+（含） | 需 `mode: 'production'` + `optimization.usedExports: true` |

## 官方资源

- Element Plus Quick Start：[https://element-plus.org/en-US/guide/quickstart](https://element-plus.org/en-US/guide/quickstart)
- Element Plus 主题定制：[https://element-plus.org/en-US/guide/theming](https://element-plus.org/en-US/guide/theming)
- ECharts Import Handbook：[https://apache.github.io/echarts-handbook/en/basics/import](https://apache.github.io/echarts-handbook/en/basics/import)
- ECharts 6 升级指南：[https://echarts.apache.org/handbook/en/basics/release-note/v6-upgrade-guide](https://echarts.apache.org/handbook/en/basics/release-note/v6-upgrade-guide)
- unplugin-vue-components：[https://github.com/unplugin/unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components)
- unplugin-auto-import：[https://github.com/unplugin/unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import)
- lodash 仓库（Module Formats）：[https://github.com/lodash/lodash](https://github.com/lodash/lodash)
- Rollup tree-shaking：[https://rollupjs.org/guide/en/#tree-shaking](https://rollupjs.org/guide/en/#tree-shaking)
- Webpack tree-shaking：[https://webpack.js.org/guides/tree-shaking](https://webpack.js.org/guides/tree-shaking)
