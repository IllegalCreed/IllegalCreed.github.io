---
layout: doc
outline: [2, 3]
---

# 模板与选项

> 基于 btd/rollup-plugin-visualizer 官方 README + plugin/index.ts + template-types.ts 源码（npm v7.x）编写

## 速查

- 模板 8 种：`treemap`(默认) / `sunburst` / `treemap-3d` / `network` / `flamegraph` / `raw-data`(JSON) / `list`(YAML) / `markdown`
- 默认 `template: 'treemap'`、默认 `filename: 'stats.html'`（HTML 类）/ `stats.json`(raw-data) / `stats.yml`(list) / `stats.md`(markdown)
- 必看选项：`filename` / `template` / `open` / `gzipSize` / `brotliSize` / `excludeChunks` / `emitFile` / `sourcemap` / `projectRoot` / `include` / `exclude`
- `open:true` 在 `emitFile:true` 或 `template:'raw-data'` 时被忽略；CI 必须关
- `gzipSize`/`brotliSize` 与 `sourcemap:true` **互斥**（开 sourcemap 自动关 gzip/brotli）
- `emitFile:true` 时 `filename` 必须是纯文件名，否则抛 `ERR_FILENAME_EMIT`
- `json` 选项已软废弃 → 改 `template: 'raw-data'`
- 与 Webpack Bundle Analyzer 比：多模板 + Rollup/Vite 原生；WBA 仅 Treemap + 仅 Webpack
- 反模式：插件不放在最后 / CI 开 `open` / `sourcemap:true` 但 Rollup output.sourcemap 未开

## 五种可视化模板

### treemap（默认）

矩形树图，**面积 = 模块体积**，最常用：

```ts
visualizer({ template: "treemap" }) // 默认，可省略
```

适合：日常「哪个最大」「依赖占比」一图看懂。蓝色 = 项目源码、绿色 = 依赖（node_modules）。

### sunburst

旭日图，同心圆环嵌套，**弧长 = 模块体积**：

```ts
visualizer({ template: "sunburst" })
```

适合：查看路径层级（chunk → 包 → 子模块）的体积占比，对深层依赖树更直观。

### circle

> 注：源码 `TemplateType` 联合类型实际取值为 `treemap-3d` / `network` / `flamegraph` 等。任务摘要中的「circle」一般指 `treemap` 或 `sunburst` 的圆环视图；以下以源码实际取值为准（treemap-3d / network / flamegraph）。

**treemap-3d**：3D 矩形树图，立体高度 = 体积，视觉冲击强：

```ts
visualizer({ template: "treemap-3d" })
```

### network

网络图，**节点 = 模块 / 边 = chunk 间引用**，**灰圈 = 被 tree-shake 掉的文件**（验证摇树效果）：

```ts
visualizer({ template: "network" })
```

适合：排查「为什么被打进包」——先移除高度连通的稳定节点（commonjsHelpers / tslib / react）再看簇。可看到 chunk 间引用链。

### flamegraph

火焰图，与性能剖析火焰图类似的展示方式，宽条 = 体积大：

```ts
visualizer({ template: "flamegraph" })
```

### 非可视化模板（CI 友好）

| template | 输出 | 默认 filename | 适合 |
| --- | --- | --- | --- |
| `raw-data` | JSON | `stats.json` | 程序化分析、CLI 合并多份 |
| `list` | YAML | `stats.yml` | 提交仓库做 PR 体积 diff |
| `markdown` | Markdown | `stats.md` | 文档化体积报告 |

```ts
visualizer({ template: "raw-data" }) // 替代已废弃的 json:true
visualizer({ template: "list" })     // PR 体积回归首选
visualizer({ template: "markdown" }) // 文档归档
```

> `raw-data` 有独立的 `version` 字段，`list` 遵循 SemVer，`markdown` 暂不版本化（随 LLM 演进变化）。

## 核心选项

### filename

输出文件路径，默认按 template 自动推导（见上表）：

```ts
visualizer({ filename: "reports/bundle.html" }) // 含相对路径
```

**约束**：`emitFile:true` 时必须是**纯文件名**，不能含 `./` / `../` / 绝对路径，否则抛 `ERR_FILENAME_EMIT`。

### template

见上，默认 `'treemap'`。可接收函数动态返回：

```ts
visualizer((outputOptions) => ({
  template: outputOptions.format === "es" ? "treemap" : "network",
}))
```

### open 与 openOptions

`open: true` 构建后用 npm `open` 包打开默认浏览器；`openOptions` 透传给 `open` 包（如指定浏览器）：

```ts
visualizer({
  open: true,
  openOptions: { app: { name: "google chrome" } },
})
```

**忽略条件**：`emitFile:true` 或 `template:'raw-data'` 时 `open` 不生效。

> 反模式：CI / 无头环境开 `open:true` 会尝试调起浏览器导致构建卡住。CI 请改用 `raw-data` + CLI 合并。

### gzipSize 与 brotliSize

默认 `false`。为 `true` 时在报告里追加 gzip / Brotli 压缩体积（贴近线上传输）：

```ts
visualizer({ gzipSize: true, brotliSize: true })
```

**互斥关系**：源码 `gzipSize = gzipSizeRequested && !opts.sourcemap`，**开 `sourcemap:true` 会强制关闭 gzip/brotli 且无额外提示**，体积数据会缺压缩列。

### excludeChunks

过滤某些 chunk 不进入分析（按 chunk 名）：

```ts
visualizer({ excludeChunks: ["polyfills", "runtime"] })
```

### include 与 exclude（picomatch glob）

`Filter = { bundle?: picomatchPattern, file?: picomatchPattern }`，支持**紧凑写法** `'BUNDLE_GLOB:FILE_GLOB'`（冒号分隔、bundle 部分可空）：

```ts
// 只看某个 bundle 的 node_modules
visualizer({ exclude: { file: "node_modules/**" } })
// 紧凑串：bundle 名匹配 translation-*.js，文件排除 node_modules
visualizer({ exclude: ["translation-*.js:node_modules/**"] })
```

> 紧凑写法必须有冒号；纯文件 glob 不要带冒号。写成 `'bundle.js file.js'`（缺冒号 / 空格分隔）不会按预期匹配。

### emitFile

默认 `false`。为 `true` 时改用 Rollup `emitFile` API 输出，SvelteKit / 多次 Vite 构建场景必备：

```ts
visualizer({ emitFile: true, filename: "stats.html" }) // filename 必须是纯文件名
```

### sourcemap

默认 `false`。为 `true` 时用 sourcemap 计算模块体积（压缩后更准），**要求 Rollup `output.sourcemap:true`**：

```ts
// rollup.config.js
export default {
  output: { sourcemap: true }, // 必须先开
  plugins: [visualizer({ sourcemap: true })], // 再开插件
}
```

不开 Rollup `output.sourcemap` → 触发 `WARN_SOURCEMAP_DISABLED` 警告 + 每个缺 sourcemap 的 chunk 还会单独 warn（`WARN_SOURCEMAP_MISSING`）。

### projectRoot

默认 `process.cwd()`。用于裁剪绝对路径前缀，让 node_modules / src 层级更紧凑：

```ts
visualizer({ projectRoot: process.cwd() })
```

也支持正则：`projectRoot: /^(.*\/my-app)\//`。

## 已废弃：json 选项

```ts
// ❌ 已软废弃，每次构建打印警告
visualizer({ json: true })

// ✅ 改用
visualizer({ template: "raw-data" })
```

源码 warn：`Option 'json' deprecated, please use template: "raw-data"`。

> 任务摘要中提到的 `openDeprecated` 在源码中**并不存在**，是误传；当前唯一的 `@deprecated` 选项是 `json`。`open` 与 `openOptions` 都是有效且非废弃的。

## 与 Webpack Bundle Analyzer 对比

| 维度 | rollup-plugin-visualizer | Webpack Bundle Analyzer |
| --- | --- | --- |
| 服务于 | Rollup / Vite | Webpack |
| 维护方 | btd（个人） | webpack-contrib（官方） |
| 模板 | 8 种（treemap/sunburst/network/flamegraph/raw-data/list/markdown/treemap-3d） | **仅 treemap** |
| 体积维度 | rendered / gzip / brotli（+ sourcemap 还原） | stat / parsed / gzip / brotli |
| 启动模式 | 插件 + CLI（合并多份 JSON） | server / static / json / disabled |
| CI 友好 | raw-data JSON、list YAML 可 diff | static HTML 归档、stats JSON |
| Node 要求 | v7 ≥ Node 22 | 5.x ≥ Node 18 |
| 配置侵入 | 一行 `visualizer()` | `BundleAnalyzerPlugin` |

> Vite / Rollup 项目用 rollup-plugin-visualizer；Webpack 项目用 WBA；想多模板 + Webpack 可换 bundle-stats、Statoscope。

## 反模式速查

- **插件不放在最后**：看到的是压缩前体积，与线上不符；要测压缩后必须 `sourcemap:true` + 最后
- **`emitFile:true` 时 filename 带路径**：直接抛 `ERR_FILENAME_EMIT`
- **`sourcemap:true` 但 Rollup output.sourcemap 未开**：warn + 数据不准
- **`sourcemap:true` 时还指望 gzipSize/brotliSize 生效**：自动关闭无提示
- **继续用 `json:true`**：每次构建打印 deprecation 警告
- **CI 中 `open:true`**：尝试调起浏览器致构建卡住
- **期望模板视觉跨版本稳定**：network/treemap/sunburst/flamegraph 不保证 SemVer
- **Node < 22 装 v7**：装不上 / 运行崩
- **以为 HTML 报告包含源码**：只含图表 UI + 元数据，不含源码本身
- **include 紧凑写法缺冒号**：`'bundle.js file.js'` 不会按预期匹配

## 下一步

- [入门](./getting-started.md)：安装 / Vite 集成 / 第一次构建 / SvelteKit 多次构建
- [参考](./reference.md)：选项/API 完整表、模板速查、版本约束、官方资源
