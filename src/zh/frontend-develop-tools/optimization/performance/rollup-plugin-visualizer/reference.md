---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 btd/rollup-plugin-visualizer 官方 README + plugin/index.ts + template-types.ts 源码（npm v7.x）编写

## 速查

- 安装：`pnpm add -D rollup-plugin-visualizer`（**Node >= 22**）
- 引入：`import { visualizer } from "rollup-plugin-visualizer"`（具名 / default 都可）
- 模板：`treemap`(默认) / `sunburst` / `treemap-3d` / `network` / `flamegraph` / `raw-data` / `list` / `markdown`
- 默认 filename：`stats.html` / `stats.json` / `stats.yml` / `stats.md`（按 template 自动推导）
- 必看选项：`filename` / `template` / `open` / `openOptions` / `gzipSize` / `brotliSize` / `sourcemap` / `emitFile` / `projectRoot` / `include` / `exclude` / `excludeChunks` / `title`
- 已废弃：`json` → 改 `template: 'raw-data'`
- 必放在 plugins 数组**最后**
- CLI：`npx rollup-plugin-visualizer [OPTIONS] stat1.json stat2.json ...`
- 完整说明见 [入门](./getting-started.md) / [模板与选项](./guide-line.md)

## 选项总表

| 选项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `filename` | `string` | 按 template 推导 | 输出路径；`emitFile:true` 时必须纯文件名 |
| `template` | `TemplateType` | `'treemap'` | 8 种模板（见下） |
| `title` | `string` | `'Rollup Visualizer'` | 生成的 HTML `<title>` |
| `open` | `boolean` | `false` | 构建后打开浏览器；`emitFile:true` 或 `template:'raw-data'` 时忽略 |
| `openOptions` | `OpenOptions` | — | 透传给 npm `open` 包 |
| `gzipSize` | `boolean` | `false` | 报告追加 gzip 体积；`sourcemap:true` 时强制关 |
| `brotliSize` | `boolean` | `false` | 报告追加 Brotli 体积；`sourcemap:true` 时强制关 |
| `sourcemap` | `boolean` | `false` | 用 sourcemap 计算模块体积；要求 Rollup `output.sourcemap:true` |
| `emitFile` | `boolean` | `false` | 用 Rollup `emitFile` API 输出（SvelteKit 必备） |
| `projectRoot` | `string \| RegExp` | `process.cwd()` | 裁剪绝对路径前缀 |
| `include` | `Filter \| Filter[]` | — | picomatch 过滤；紧凑写法 `'BUNDLE:FILE'` |
| `exclude` | `Filter \| Filter[]` | — | picomatch 过滤 |
| `excludeChunks` | `string[]` | — | 按 chunk 名排除某些 chunk |
| `json` | `boolean` | `false` | **已软废弃** → 改 `template: 'raw-data'` |

### Filter 类型

```ts
type Filter =
  | string                              // 紧凑写法 'BUNDLE_GLOB:FILE_GLOB'
  | { bundle?: string; file?: string }; // 对象写法
```

紧凑写法：冒号分隔，bundle 部分可空（`:node_modules/**` = 所有 bundle + node_modules）。

## 模板速查

| template | 默认 filename | 输出形式 | 适合场景 |
| --- | --- | --- | --- |
| `treemap` | `stats.html` | 矩形树图（面积=体积） | 日常分析（默认） |
| `sunburst` | `stats.html` | 旭日图（弧长=体积） | 层级体积占比 |
| `treemap-3d` | `stats.html` | 3D 矩形树图 | 演示 / 视觉冲击 |
| `network` | `stats.html` | 网络图（节点+边，灰圈=摇树掉） | 排查「为什么被打进包」 |
| `flamegraph` | `stats.html` | 火焰图 | 宽条定位体积热点 |
| `raw-data` | `stats.json` | JSON | CI 程序化分析、CLI 合并多份 |
| `list` | `stats.yml` | YAML | 提交仓库做 PR 体积 diff |
| `markdown` | `stats.md` | Markdown | 文档归档 |

> 模板视觉细节（network/treemap/sunburst/flamegraph）**不保证 SemVer**，可在小版本间变动；`raw-data` 有独立 `version` 字段，`list` 遵循 SemVer，`markdown` 暂不版本化。

## API：visualizer()

```ts
import { visualizer } from "rollup-plugin-visualizer";

// 1. 直接传 options
visualizer(options: PluginVisualizerOptions): Plugin

// 2. 传函数：接收 rollup outputOptions 动态返回 options
visualizer(
  (outputOptions) => PluginVisualizerOptions
): Plugin
```

也支持 default import：`import visualizer from "rollup-plugin-visualizer"`。

### 实现的 Rollup 钩子

```ts
// 只处理 bundle.type === 'chunk' 的产物
generateBundle(_outputOptions, outputBundle) {
  // tree = buildTree + mergeTrees + addLinks(chunk 间引用)
}
```

## CLI：合并多份 raw-data JSON

```bash
# 多 entry / 多配置分别产 raw-data JSON，再用 CLI 合并
rollup-plugin-visualizer [OPTIONS] stat1.json stat2.json ...

# 切换输出类型
npx rollup-plugin-visualizer --template treemap stats-server.json stats-client.json
```

## 版本与运行环境

| 版本 | Node 要求 | 备注 |
| --- | --- | --- |
| v7.x（当前） | **>= 22** | 主线维护；Node 门槛大幅提高 |
| v6.x | >= 18 | Node 18 项目停留 |
| v5.x | >= 14 | Node 14 项目停留 |

**版本化策略**（README 明确）：

- **插件 API**：遵循 SemVer（构建配置用，可放心升级）
- **前端模板视觉**（network/treemap/sunburst/flamegraph）：**不保证 SemVer**，视觉细节可在小版本间变动
- **`raw-data` JSON**：用独立的 `version` 字段，程序化消费时校验版本
- **`list` YAML**：遵循 SemVer
- **`markdown`**：暂不版本化（随 LLM 演进变化）

## 颜色编码

| 颜色 | 含义 | 判定 |
| --- | --- | --- |
| 蓝色 | 项目源码 | 路径**不以** `node_modules` 开头 |
| 绿色 | 依赖 | 路径**以** `node_modules` 开头 |

## 官方资源

- 仓库：[https://github.com/btd/rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)
- README（最权威）：[https://github.com/btd/rollup-plugin-visualizer/blob/master/README.md](https://github.com/btd/rollup-plugin-visualizer/blob/master/README.md)
- 源码：[plugin/index.ts](https://github.com/btd/rollup-plugin-visualizer/blob/master/plugin/index.ts)（`PluginVisualizerOptions` / `generateBundle`）
- 模板类型：[plugin/template-types.ts](https://github.com/btd/rollup-plugin-visualizer/blob/master/plugin/template-types.ts)
- CHANGELOG：[CHANGELOG.md](https://github.com/btd/rollup-plugin-visualizer/blob/master/CHANGELOG.md)
- npm：[https://www.npmjs.com/package/rollup-plugin-visualizer](https://www.npmjs.com/package/rollup-plugin-visualizer)
