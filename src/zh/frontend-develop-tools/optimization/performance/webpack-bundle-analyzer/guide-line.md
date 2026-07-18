---
layout: doc
outline: [2, 3]
---

# 核心选项与视图

> 基于 webpack-contrib/webpack-bundle-analyzer 官方 README（master 分支）+ viewer.js 源码编写，对照稳定版 5.3.0

## 速查

- 图表**仅 Treemap 一种**——sunburst / network 是 bundle-stats / Statoscope 竞品特性
- 四种启动模式：`server`（默认，HTTP）/ `static`（HTML）/ `json`（JSON）/ `disabled`（仅 stats）
- 四档体积：`stat`（输入）/ `parsed`（输出，默认）/ `gzip` / `brotli`；生产评估看 gzip / brotli
- `defaultSizes`：图表**初始显示哪一档**；`compressionAlgorithm`：算压缩档时**用哪种压缩算法**——两件事别混
- CI 配置三件套：`analyzerMode: 'static'` + `analyzerPort: 'auto'` + `openAnalyzer: false`
- `excludeAssets` 三种 pattern：String（转 RegExp）/ RegExp / `(assetName) => boolean`；多 pattern 任一匹配即排除
- UI 交互：左侧 sidebar（点 `>` 展开）勾选 chunk；右键 / Ctrl+click chunk 弹 Context Menu（Hide chunk / Hide all other chunks / Show all chunks）
- 防源码泄漏：`generateStatsFile: true` + `statsOptions: { source: false }`（stats JSON 默认含模块源码）
- Vite / Rollup 项目不能用本工具——换 `rollup-plugin-visualizer` 或 `npx vite-bundle-visualizer`
- 反模式：CI 跑 server 模式、dev-server 下跑 CLI、把 parsed 当真实传输体积、对 Vite 项目硬塞

## 启动模式：server / static / json / disabled

四种模式由 `analyzerMode` 选项决定，对应「报告以什么形态产出」。

### server（默认）—— 本地分析

```js
new BundleAnalyzerPlugin({
  analyzerMode: 'server',     // 默认
  analyzerHost: '127.0.0.1',  // 默认
  analyzerPort: 8888,         // 默认；可设 'auto' 让 OS 分配
  openAnalyzer: true,         // 默认自动开浏览器
})
```

启动后控制台打印 `Webpack Bundle Analyzer is started at http://127.0.0.1:8888`，HTTP server **不退出**——适合本地一次性分析，**严禁在 CI 跑**。

> `analyzerPort: 'auto'` 让 OS 分配空闲端口，避免并行 build、容器化、多项目共享机器时 EADDRINUSE。

### static —— CI / 团队共享

```js
new BundleAnalyzerPlugin({
  analyzerMode: 'static',
  reportFilename: 'report.html',  // 默认；可为函数 () => string
  reportTitle: 'Bundle Report',   // 默认；可为函数
  openAnalyzer: false,            // CI 不开浏览器
})
```

生成**单 HTML 文件**（无外部依赖，离线可看），归档为 CI 产物或 commit 进仓库都方便。这是 CI 场景的标准选择。

### json —— 程序化处理

```js
new BundleAnalyzerPlugin({
  analyzerMode: 'json',
  reportFilename: 'report.json',
})
```

输出 JSON 报告，供下游脚本 / 工具消费（如自建体积看板、跨构建 diff）。

### disabled —— 只要 stats

```js
new BundleAnalyzerPlugin({
  analyzerMode: 'disabled',
  generateStatsFile: true,    // 配合此项才有意义
  statsFilename: 'stats.json',
})
```

不启动 server、不出报告，仅生成 webpack stats JSON，给 bundle-stats / Statoscope 等下游工具二次分析。

## 四档体积：stat / parsed / gzip / brotli

报告顶部有切换按钮（默认 `parsed`），切换后所有矩形重画。各档含义：

| 档位 | 含义 | 来源 | 典型用途 |
| --- | --- | --- | --- |
| `stat` | 输入大小，变换前 | Webpack stats 对象 | 看模块「自身体量」，判断 Tree-shaking 空间 |
| `parsed`（默认） | 输出大小，压缩后（Terser / Uglify 处理） | 读磁盘 bundle | 看「写进 bundle 多少」，CI 报告默认 |
| `gzip` | 对 parsed gzip 后 | 算出 | **看「用户实际下载多少」**——定性能预算必看 |
| `brotli` | 对 parsed brotli 后 | 算出（compressionAlgorithm: brotli） | 同上，brotli 比 gzip 多省 15–20% |

### 两个易混选项

| 选项 | 作用 | 取值 |
| --- | --- | --- |
| `defaultSizes` | 报告**初始显示**哪一档 | `stat` / `parsed` / `gzip` |
| `compressionAlgorithm` | 算压缩档时**用哪种压缩算法** | `gzip`（默认）/ `brotli` / `zstd`（需 Node 22.15.0+） |

> 别搞混：`defaultSizes: 'gzip'` 是「打开报告就显示 gzip 档」；`compressionAlgorithm: 'brotli'` 是「压缩档按 brotli 算」。两个维度独立。

### stat vs parsed 判断优化方向

| 对照 | 结论 |
| --- | --- |
| stat 远大于 parsed | 压缩器效果好（注释 / 空白多被吃掉），**无需** Tree-shaking |
| stat 与 parsed 接近 | 模块本身冗余（死代码、未使用的导出），**应做** Tree-shaking / 代码分割 |

## 仅 Treemap 一种视图（重点澄清）

Webpack Bundle Analyzer 的可视化图表**只有 Treemap 一种**——矩形树图，矩形面积 = 模块体积。

社区博客常把它和竞品混说成「treemap / sunburst / network 三种视图」——**这是错的，也是高频考点**：

- **sunburst（旭日图）**：bundle-stats、Statoscope 等竞品支持，本工具不支持
- **network（网络图）**：同上，是竞品特性
- **treemap（矩形树图）**：本工具唯一支持的图表

> 找不到 sunburst / network 切换按钮是正常的——要换视图请换工具。

## Treemap 交互能力

| 操作 | 行为 |
| --- | --- |
| 鼠标悬停 | 显示模块名、stat/parsed/gzip 三档体积、路径 |
| 点击矩形 | 钻入子模块（zoom in） |
| 左侧 sidebar（点 `>` 展开） | 勾选 / 取消 chunk |
| 右键 / Ctrl+click chunk | Context Menu：**Hide chunk** / **Hide all other chunks** / **Show all chunks** |
| 顶部切档按钮 | 切 stat / parsed / gzip |

> Context Menu 的 Hide chunk 不是「不打包」，只影响报告展示——`excludeAssets` 同理，只过滤展示，体积优化仍要在 webpack config 里处理。

## excludeAssets：过滤噪声

`excludeAssets` 三种 pattern：

```js
new BundleAnalyzerPlugin({
  excludeAssets: [
    /\.map$/,           // RegExp：排除 sourcemap
    'LICENSE',          // String：转 RegExp，匹配资产名含 LICENSE
    (name) => name.endsWith('.woff2'),  // 函数：返回 true 即排除
  ],
})
```

> 多 pattern 是「**任一匹配即排除**」（OR 语义）。常用于过滤 sourcemap / 字体 / 第三方 LICENSE，让 treemap 聚焦在真正需要审查的 JS chunk 上。

## generateStatsFile：保留原始数据

```js
new BundleAnalyzerPlugin({
  generateStatsFile: true,
  statsFilename: 'stats.json',
  statsOptions: { source: false },  // 关键：不写源码
})
```

| 配置 | 作用 |
| --- | --- |
| `generateStatsFile: true` | 额外输出 webpack stats JSON |
| `statsFilename` | 文件名，默认 `stats.json` |
| `statsOptions` | 透传给 `stats.toJson()` |
| `statsOptions: { source: false }` | **不写模块源码**——CI 产物上传时防泄漏 |

> stats JSON 默认会写入模块源码；CI 共享 / 上传产物时务必加 `{ source: false }`，否则可能泄漏私有代码。

## 与 Vite / Rollup 的关系

| 项目 | 能用本工具吗？ | 推荐替代 |
| --- | --- | --- |
| Webpack 项目（任何版本） | 可以 | 本工具 |
| Vite 项目 | **不能**——Vite 用 Rollup，无 webpack stats JSON | `rollup-plugin-visualizer`（集成进 vite.config.ts plugins） |
| Vite 项目（零配置） | 不能 | `npx vite-bundle-visualizer` |
| 纯 Rollup 项目 | 不能 | `rollup-plugin-visualizer` |

> 替代品产物都是 treemap，UI 体验与本工具对齐。Vite 项目别尝试 `npm i webpack-bundle-analyzer`——会有 webpack 依赖、stats JSON 根本不存在。

## 反模式与陷阱

| 反模式 | 后果 | 正确做法 |
| --- | --- | --- |
| CI 跑 `server` 模式 | HTTP server 不退出，pipeline 卡死 | 改 `static` 模式 |
| 并行 build 用固定 8888 端口 | EADDRINUSE 报错 | `analyzerPort: 'auto'` |
| webpack-dev-server 下跑 CLI | `No such file` 报错，退化为只有 stat size | 用 Plugin 模式（拿内存产物） |
| 拿默认 `parsed` 当真实传输体积 | 业务结论偏差（实际是 gzip 1/3） | 切到 `gzip` / `brotli` 看 |
| 混淆 `defaultSizes` / `compressionAlgorithm` | 报告档位与压缩算法乱套 | 记住：defaultSizes 初始档 / compressionAlgorithm 算法 |
| 上传 stats JSON 不去源码 | 私有代码泄漏 | `statsOptions: { source: false }` |
| 当 `excludeAssets` 能减少 bundle 体积 | 只过滤展示，bundle 没变 | 体积优化在 webpack config 里处理 |
| 对 Vite 项目用本工具 | 装不上 / 拿不到 stats | 用 `rollup-plugin-visualizer` |
| 误以为有 sunburst / network 视图 | 找不到切换按钮 | 那是竞品特性；本工具仅 treemap |

## 最佳实践清单

```js
// webpack.analyze.js —— 单独的分析配置，按需启用
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const base = require('./webpack.config');

module.exports = {
  ...base,
  plugins: [
    ...base.plugins,
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',        // CI 友好
      reportFilename: 'report.html',
      openAnalyzer: false,           // CI / 服务器不开浏览器
      analyzerPort: 'auto',          // 防端口冲突（static 模式不监听，写习惯防切换）
      defaultSizes: 'gzip',          // 生产评估默认看 gzip
      excludeAssets: [/\.map$/, /LICENSE/],
      generateStatsFile: true,       // 给下游工具
      statsOptions: { source: false }, // 防源码泄漏
      logLevel: 'warn',
    }),
  ],
};
```

```bash
ANALYZE=1 webpack --config webpack.analyze.js
```

## 下一步

- [入门](./getting-started.md)：安装、最小用法、四种启动模式速览
- [参考](./reference.md)：完整选项表、CLI flag 表、版本与链接
