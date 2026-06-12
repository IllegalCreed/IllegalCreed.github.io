---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 架构（并行/增量）、性能三件套与剖析工具、Rspack 2.0 迁移清单、库构建 modern-module。截至 2026-06：最新主版本 **2.0**（2026-04-22 发布），1.x 仅维护关键修复。

## 一、为什么快：架构视角

- **Rust 基座**：无 GC 停顿、可预测内存；解析/转译/codegen 在多核上**并行**调度（对比 webpack 受限于 JS 单线程，靠 worker 池的收益有限且有序列化成本）。
- **内置关键路径**：SWC 转译、CSS 处理、压缩（SWC/Lightning CSS）都在 Rust 进程内完成——webpack 生态里这些都是 JS 包，每一步都有跨包/跨语言开销。
- **增量编译**：HMR/rebuild 只重算受影响子图。
- 官方基准（同一示例项目）：生产构建 1.0 → 2.0 由 5.6s 降至 **3.1s**（无缓存）/**1.4s**（持久缓存命中）；HMR ~118ms。

JS loader 是这套架构里的「逃生舱」：兼容性极好但要回到 JS 侧执行。**性能调优的主旋律就是把热路径上的 JS loader 换成 builtin**。

## 二、性能三件套

| 特性 | 配置（2.0） | 状态与作用 |
|---|---|---|
| 增量构建 | 顶层 `incremental` | **1.4 起默认开启**；优化 rebuild/HMR；问题时可设 `'safe'` 回退 |
| 持久化缓存 | 顶层 `cache: { type: 'persistent' }` | 1.2 实验引入，2.0 转正；跨进程磁盘缓存，命中后 3.1s→1.4s |
| 懒编译 | 顶层 `lazyCompilation: true` | 1.5 起稳定；dev 下入口/动态 import **被访问才编译**，大应用冷启动利器 |

```js
export default defineConfig({
  cache: { type: 'persistent' },
  lazyCompilation: process.env.NODE_ENV === 'development',
});
```

三者分工：incremental 管「进程内二次构建」，persistent cache 管「跨进程冷启动」，lazyCompilation 管「先别编译用不到的」。

## 三、性能剖析

- **Rsdoctor**：构建分析器——loader/插件耗时、模块关系、重复依赖可视化；2.0 移除 `profile`/`stats.profile` 后官方指定的分析入口。
- **`RSPACK_PROFILE=ALL rspack build`**：产出构建计时日志；配合 `RSPACK_TRACE_LAYER=perfetto` 生成 `.pftrace`，在 ui.perfetto.dev 看 Rust 侧火焰图。
- **线程池**：`RSPACK_BLOCKING_THREADS`（默认 4，高速磁盘可调高）、`TOKIO_WORKER_THREADS`/`RAYON_NUM_THREADS`（默认自动）。⚠️ 避免设得过低——并行是性能根基。

## 四、Rspack 2.0 迁移清单

### 环境与发布形态

- **Node.js 20.19+ / 22.12+**（不再支持 18）。
- 核心包（core/cli/dev-server/plugin-react-refresh）**纯 ESM**：Node 20+ 的 `require(esm)` 让 CJS 工程通常零改动；**不影响产物输出 CJS** 的能力。红利：dev-server 依赖 192→1、安装体积约降 90%，cli 零依赖。
- `@rspack/cli` 不再捆绑 dev-server，需手装。

### experiments 大搬家

`cache`/`incremental`/`lazyCompilation` 顶层化；`outputModule`→`output.module`；`css`/`topLevelAwait`/`parallelLoader`/`rspackFuture` 移除（前三者已稳定默认）。完整对照见[参考](../reference)。

### builtin:swc-loader 变更

- **不再读取 `.swcrc`**——SWC 配置必须写进 loader options；
- `rspackExperiments.import` → `transformImport`；
- 降级目标默认从顶层 `target` 派生。

### 默认值变更（高频影响）

- `devtool`：开发 `eval`→`cheap-module-source-map`；生产（CLI）`source-map`→**`false`**；
- `output.chunkLoadingGlobal`：`webpackChunk*`→`rspackChunk*`（与 webpack 应用同页共存不再冲突；依赖旧名的场景需显式配置）；
- `exportsPresence`：`'warn'`→`'error'`——import 不存在的导出直接构建失败；
- `optimization.removeAvailableModules`、`module.unsafeCache`、`output.charset` 等移除。

## 五、库构建：modern-module

构建「给下游打包器二次消费」的 ESM 库：

```js
export default defineConfig({
  output: {
    module: true,                            // 产出 ESM（原 experiments.outputModule）
    library: { type: 'modern-module' },      // 2.0 优化；取代被移除的 EsmLibraryPlugin
  },
  externals: { react: 'module react' },      // 依赖外置
});
```

`modern-module` 保留静态结构、便于下游继续 tree-shaking；配合 `#__NO_SIDE_EFFECTS__` 注解与 `optimization.inlineExports` 可进一步压缩使用面。要全套库工程化（多格式、dts、bundleless）则上层用 **Rslib**。

## 六、2.0 的新边界：ESM 增强与 RSC

输出侧的 ESM 能力在 2.0 集中增强，值得关注但要分清成熟度：

- **`import.defer()`**：延迟模块求值提案的支持（`experiments.deferImport` 1.6 引入）；
- **`import.meta` 语义修正**：ESM 输出下未知属性**保留**而非替换为 undefined，并新增 `import.meta.main/filename/dirname`；
- **`#/` 子路径导入**：基于 package.json `imports` 字段的别名；
- **React Server Components**：**实验级**支持（RSC 指令、编译检查、CSS 收集、HMR），配套 `rsbuild-plugin-rsc` 开箱方案——生产采用需谨慎评估。

> 判断口径：进入顶层配置的（cache/incremental/lazyCompilation）是稳定能力；仍在 `experiments` 下或标注 experimental 的（RSC、deferImport）按实验特性对待。

## 七、专家级易错点

- **只配 JS minimizer**：默认压缩器整体失效，CSS 没人压——JS/CSS 压缩器要一起配。
- **原生 CSS type 与 CssExtractRspackPlugin 叠用**：两条管线互斥；插件管线 rule 必须 `type: 'javascript/auto'`。
- **以为 SWC 顺带查类型**：不查——`tsc --noEmit` 或 ts-checker-rspack-plugin 另跑。
- **`env.targets` 与 `jsc.target` 同时配**：互斥报错；2.0 都不配会从顶层 `target` 派生。
- **polyfill 没排除 core-js**：core-js 被 SWC 编译后失效——必须 exclude。
- **升 2.0 后生产没有 .map**：是 devtool 默认值变更不是 bug，显式配置即可。
- **微前端依赖 `webpackChunk` 全局名**：2.0 默认改 `rspackChunk*`，跨应用约定要核对。

---

回到 [参考](../reference) 查包替换、内置插件/loader 对照与 2.0 搬迁速查表。
