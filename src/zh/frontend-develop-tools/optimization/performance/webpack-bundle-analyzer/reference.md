---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 webpack-contrib/webpack-bundle-analyzer 官方 README（master 分支）编写，对照稳定版 5.3.0（2026-03-25）

## 速查

- 当前版本：**5.3.0**（2026-03-25，webpack-contrib 出品）；`zstd` 压缩档需 Node 22.15.0+
- TypeScript 类型：社区包 `@types/webpack-bundle-analyzer`（当前 4.7.0）
- 安装：`pnpm add -D webpack-bundle-analyzer`
- 最小用法：`new BundleAnalyzerPlugin()` → 默认 server 模式、8888 端口、自动开浏览器
- 启动模式：`server`（默认）/ `static` / `json` / `disabled`
- 体积档位：`stat` / `parsed`（默认）/ `gzip` / `brotli`
- CLI：`webpack-bundle-analyzer <bundleStatsFile> [bundleDir] [options]`
- 图表：**仅 Treemap**（无 sunburst / network）
- 完整说明见 [入门](./getting-started.md) / [核心选项与视图](./guide-line.md)

## BundleAnalyzerPlugin 选项

### 启动模式与端口

| 选项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `analyzerMode` | `server \| static \| json \| disabled` | `server` | 报告形态：HTTP 服务 / 单 HTML / JSON / 仅 stats |
| `analyzerHost` | `string` | `127.0.0.1` | server 模式监听主机 |
| `analyzerPort` | `number \| 'auto'` | `8888` | server 模式端口；`'auto'` 由 OS 分配 |
| `analyzerUrl` | `(ctx) => string` | — | 自定义打印到 console 的 URL，入参 `{ listenHost, boundAddress }` |
| `openAnalyzer` | `boolean` | `true` | 是否自动打开浏览器 |

### 报告文件

| 选项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `reportFilename` | `string` | `report.html` | static / json 模式输出文件名 |
| `reportTitle` | `string \| () => string` | `Bundle Report` | static 模式 HTML title |

### 体积档位

| 选项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `defaultSizes` | `stat \| parsed \| gzip` | `parsed` | 报告初始显示哪一档 |
| `compressionAlgorithm` | `gzip \| brotli \| zstd` | `gzip` | 算压缩档用哪种压缩算法 |

> `defaultSizes` 与 `compressionAlgorithm` 维度不同：前者是「初始显示哪档」，后者是「算压缩档时用什么算法」。

### Stats 文件

| 选项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `generateStatsFile` | `boolean` | `false` | 是否额外生成 stats JSON |
| `statsFilename` | `string` | `stats.json` | stats 文件名 |
| `statsOptions` | `object` | `null` | 透传给 `stats.toJson()`；建议 `{ source: false }` 防源码泄漏 |

### 过滤与日志

| 选项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `excludeAssets` | `null \| pattern \| pattern[]` | `null` | 排除资产展示；pattern 可为 String（转 RegExp）/ RegExp / `(name) => boolean`；多 pattern 任一匹配即排除 |
| `logLevel` | `info \| warn \| error \| silent` | `info` | 日志级别 |
| `startAnalyzer` | `boolean` | `true` | server 模式下是否自动启动 server |

## CLI 选项

```text
webpack-bundle-analyzer <bundleStatsFile> [bundleDir] [options]
```

| Flag | 等价 / 类型 | 说明 |
| --- | --- | --- |
| `-m, --mode <mode>` | analyzerMode | `server` / `static` / `json` / `disabled` |
| `-p, --port <port>` | analyzerPort | 端口号或 `auto` |
| `-s, --default-sizes <type>` | defaultSizes | `stat` / `parsed` / `gzip` |
| `--compression-algorithm <alg>` | compressionAlgorithm | `gzip` / `brotli` / `zstd` |
| `-O, --no-open` | openAnalyzer = false | 不自动开浏览器 |
| `-e, --exclude <pattern>` | excludeAssets | 可多次出现 |
| `-r, --report <file>` | reportFilename | static / json 模式输出文件 |
| `-l, --log-level <level>` | logLevel | 日志级别 |
| `-h, --help` | — | 帮助 |
| `-v, --version` | — | 版本 |

> CLI 模式需要 bundle 文件落盘。webpack-dev-server / 内存型构建下 CLI 会报 `No such file` 并退化为只显示 stat size（见 issue #147），这种场景必须用 Plugin 模式。

## Stats JSON 生成命令

```bash
# Unix / macOS / Linux
webpack --profile --json > stats.json

# Windows PowerShell（防 BOM）
webpack --profile --json | Out-file 'stats.json' -Encoding OEM
```

> Windows PowerShell 直接重定向 `>` 会带 BOM，下游解析易出错，必须用 `Out-file -Encoding OEM`。

## 四档体积对照

| 档位 | 含义 | 数据来源 | 用途 |
| --- | --- | --- | --- |
| `stat` | 输入大小，变换前（未压缩未混淆） | Webpack stats 对象 | 判断 Tree-shaking 空间 |
| `parsed`（默认） | 输出大小（压缩器处理后） | 读磁盘 bundle | 看「写进 bundle 多少」 |
| `gzip` | 对 parsed 再 gzip | 算出 | 看用户实际下载字节 |
| `brotli` | 对 parsed 再 brotli | 算出 | 比 gzip 多省 15–20% |

## Treemap UI 交互

| 操作 | 行为 |
| --- | --- |
| 鼠标悬停 | 显示模块名 / 三档体积 / 路径 |
| 点击矩形 | 钻入子模块 |
| 左侧 sidebar（点 `>` 展开） | 勾选 / 取消 chunk |
| 右键 / Ctrl+click chunk | Context Menu：Hide chunk / Hide all other chunks / Show all chunks |
| 顶部切档按钮 | 切 stat / parsed / gzip |

## 同类工具视图对比

| 工具 | 图表 | 说明 |
| --- | --- | --- |
| **webpack-bundle-analyzer** | 仅 treemap | Webpack 生态默认 |
| **bundle-stats** | treemap + 其他 | 跨构建 diff 强 |
| **Statoscope** | treemap + 其他 | 深度诊断 |
| **source-map-explorer** | treemap | 基于 sourcemap |
| **rollup-plugin-visualizer** | treemap | Vite / Rollup 替代品 |

> sunburst / network 是其他工具的特性，webpack-bundle-analyzer 不支持。

## CI 标准配置

```js
new BundleAnalyzerPlugin({
  analyzerMode: 'static',          // 不挂起，输出 HTML
  reportFilename: 'report.html',
  openAnalyzer: false,             // 无头环境不开浏览器
  analyzerPort: 'auto',            // 防并行 build 端口冲突
  defaultSizes: 'gzip',            // 生产评估看 gzip
  generateStatsFile: true,
  statsOptions: { source: false }, // 防源码泄漏
  excludeAssets: [/\.map$/, /LICENSE/],
  logLevel: 'warn',
})
```

## 版本与生态

| 维度 | 值 |
| --- | --- |
| 当前稳定版 | **5.3.0**（2026-03-25，3 个月内） |
| 维护组织 | webpack-contrib（GitHub: webpack-contrib/webpack-bundle-analyzer） |
| 旧仓库地址 | github.com/webpack/webpack-bundle-analyzer（仍可访问但非官方新址） |
| TypeScript 类型 | `@types/webpack-bundle-analyzer`（4.7.0） |
| Node 要求 | 见 README badge；`zstd` 压缩档需 Node 22.15.0+ |
| 与 Vite 关系 | 无官方关系；Vite 用 Rollup，对应 `rollup-plugin-visualizer` / `vite-bundle-visualizer` |
| 每周下载量 | 百万级 |

## 官方资源

- GitHub：[https://github.com/webpack-contrib/webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- npm：[https://www.npmjs.com/package/webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- viewer 源码：[https://github.com/webpack-contrib/webpack-bundle-analyzer/blob/master/src/viewer.js](https://github.com/webpack-contrib/webpack-bundle-analyzer/blob/master/src/viewer.js)
- issue #147（CLI 在 dev-server 下报 No such file）：[https://github.com/webpack-contrib/webpack-bundle-analyzer/issues/147](https://github.com/webpack-contrib/webpack-bundle-analyzer/issues/147)
- Vite 替代品：[https://github.com/btd/rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)
