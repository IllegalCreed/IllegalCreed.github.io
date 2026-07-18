---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 webpack-contrib/webpack-bundle-analyzer 官方 README（master 分支）编写，对照稳定版 5.3.0（2026-03-25）

## 速查

- 安装：`pnpm add -D webpack-bundle-analyzer`（或 npm / yarn 等效）
- 引入：`const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')`
- 最小用法：`plugins: [new BundleAnalyzerPlugin()]` → 默认 `analyzerMode: 'server'`、端口 8888、自动开浏览器
- 四种启动模式：`server`（默认，启动 HTTP）/ `static`（生成 report.html）/ `json`（生成 JSON）/ `disabled`（仅生成 stats）
- 三种展示：**仅 Treemap 一种**——sunburst / network 是 bundle-stats / Statoscope 等竞品特性，常被误传
- 四档体积：`stat`（输入未压缩）/ `parsed`（输出，默认）/ `gzip` / `brotli`（按 compressionAlgorithm）
- 切档位：`defaultSizes: 'parsed' | 'stat' | 'gzip'`；压缩算法：`compressionAlgorithm: 'gzip' | 'brotli' | 'zstd'`
- 生产评估看 `gzip` / `brotli`，不看默认 `parsed`（用户实际下载压缩后体积）
- CI 场景：`analyzerMode: 'static'` + `analyzerPort: 'auto'` + `openAnalyzer: false`
- Vite 项目用 `rollup-plugin-visualizer` 或 `npx vite-bundle-visualizer`，不是它

## 它解决什么问题

打包后的 bundle 是压缩混淆过的一坨 JS，**肉眼根本看不出哪段代码占多少体积**。Webpack Bundle Analyzer 把 stats 数据可视化成 treemap——每个矩形面积代表模块体积，鼠标悬停看具体数字、点击钻入子模块、右键 Hide 排除干扰项。它解决三类典型问题：

- **「我的 bundle 怎么这么大？」**：一眼看出是不是某个 npm 包占了 60%
- **「这个 lodash 是真的全量引入吗？」**：treemap 上看到 `lodash` 而非 `lodash-es` 的全量包块就知道
- **「gzip 之后到底多大？」**：切到 `gzip` 档位看用户实际下载字节数

> 它是「事后分析」工具——先打包、再分析；不会改变 bundle 本身。要做体积优化（Tree-shaking、Code Splitting、动态 import）还需在 webpack config 里动手。

## 安装与最小用法

```bash
pnpm add -D webpack-bundle-analyzer
```

```js
// webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  // ...其余配置
  plugins: [
    new BundleAnalyzerPlugin(), // 全部默认：server 模式 + 8888 端口 + 自动开浏览器
  ],
};
```

跑 `webpack build` 后，控制台会打印 `Webpack Bundle Analyzer is started at http://127.0.0.1:8888`，浏览器自动打开报告页面。

> 默认行为适合本地一次性分析；CI / 多构建并行场景务必改 `analyzerMode` 和 `analyzerPort`，否则 server 模式会阻塞流水线、固定 8888 端口会冲突。

## 四种启动模式速览

| `analyzerMode` | 行为 | 适用场景 |
| --- | --- | --- |
| **`server`**（默认） | 启动 HTTP server，浏览器查看 | 本地一次性分析 |
| **`static`** | 生成单 HTML 文件 `report.html` | CI 产物归档、团队共享 |
| **`json`** | 生成 JSON 报告 | 程序化分析、接入其他工具 |
| **`disabled`** | 不启动 server、不出 HTML，仅配合 `generateStatsFile: true` 出 stats JSON | 只想要 stats 给下游工具 |

> CI 千万别用 `server`：HTTP server 启动后不退出，pipeline 会卡死。

## 四档体积维度速览

| 档位 | 含义 | 数据来源 |
| --- | --- | --- |
| **`stat`** | 输入大小，**变换前**（未压缩、未混淆） | Webpack stats 对象 |
| **`parsed`**（默认） | 输出大小，**压缩后**（如 Terser / Uglify 处理后） | 读磁盘上的 bundle 文件 |
| **`gzip`** | 对 parsed 再 gzip 压缩 | 算出来 |
| **`brotli`** | 对 parsed 再 brotli 压缩（compressionAlgorithm 选 brotli） | 算出来 |

> 用户实际下载的是 **gzip / brotli 后**的字节，向业务汇报或定性能预算时**应看这两档**，不看默认 `parsed`。

## 仅 Treemap 一种图表

**重点澄清**：Webpack Bundle Analyzer 的可视化**只有 Treemap（矩形树图）一种**。社区博客常把它和竞品混在一起说「支持 treemap / sunburst / network 三种视图切换」——**这是错的**。

| 工具 | 支持的图表 |
| --- | --- |
| **webpack-bundle-analyzer** | 仅 treemap |
| **bundle-stats** | treemap + others |
| **Statoscope** | treemap + others |
| **source-map-explorer** | treemap |

> sunburst / network 是其他工具的特性。要换视图就换工具，不要在 webpack-bundle-analyzer 里找切换按钮。

## CLI 与 Plugin 两种用法

**Plugin 模式**（推荐）：直接拿到编译产物内存数据，支持 webpack-dev-server / 内存型构建。

```js
// 仅分析时启用，常规 build 不开
plugins: [
  process.env.ANALYZE && new BundleAnalyzerPlugin(),
].filter(Boolean),
```

**CLI 模式**：先产 stats JSON 再分析，需要 bundle 落盘。

```bash
# 1. 生成 stats JSON
webpack --profile --json > stats.json
# Windows PowerShell 防 BOM：
# webpack --profile --json | Out-file 'stats.json' -Encoding OEM

# 2. CLI 分析
webpack-bundle-analyzer stats.json
# 常用 flag：
#   -m/--mode server|static|json|disabled
#   -p/--port 8888 | auto
#   -s/--default-sizes stat|parsed|gzip
#   --compression-algorithm gzip|brotli|zstd
#   -O/--no-open              # 不自动开浏览器
#   -e/--exclude <pattern>    # 可多次
#   -r/--report report.html   # static 模式输出
#   -l/--log-level info|warn|error|silent
```

> webpack-dev-server / 内存型构建下 CLI 会报 `Error parsing bundle asset ...: No such file` 并退化为只显示 stat size（丢失 parsed/gzip），这种场景必须用 Plugin 模式（见 [参考](./reference.md) issue #147）。

## 下一步

- [核心选项与视图](./guide-line.md)：四种启动模式、四档体积、Treemap 交互、与 Vite 关系、反模式
- [参考](./reference.md)：完整选项表、CLI flag 表、版本与链接
