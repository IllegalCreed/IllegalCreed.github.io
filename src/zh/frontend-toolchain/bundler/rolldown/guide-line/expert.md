---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 与 Rollup 的行为差异全清单、Vite 8 集成内幕、Full Bundle Mode、实验区（lazyBarrel/moduleTypes）与 1.0 稳定性承诺。截至 2026-06：`rolldown` latest = **1.1.x**（1.0 stable = 2026-05-07），`vite` = **8.0.x**。

## 一、Notable Differences from Rollup（插件作者必读）

「几乎完全兼容」的另一面是这些**刻意的行为差异**，深度插件迁移要逐条核对：

| # | 差异 | Rolldown | Rollup | 迁移影响 |
|---|---|---|---|---|
| 1 | `outputOptions` 时机 | **build 钩子之前** | build 钩子之后 | 依赖「outputOptions 晚于 buildStart」的时序假设失效 |
| 2 | 多 output 的 build 钩子 | **每个 output 各执行一遍** | 全部输出共一次 build | buildStart/transform 里的副作用与计数要幂等 |
| 3 | `closeBundle` | **需 generate()/write() 至少调用一次** | 无条件触发 | 「只建不出」的分析流程里清理逻辑要兜底 |
| 4 | watch 的 `options` | **仅初始化时一次** | 每次重建都调 | 按次刷新逻辑移到 `buildStart` |
| 5 | `writeBundle` 并发 | **默认顺序执行** | 默认并行 | 上传/部署类插件天然有序；并行抢时间的组合耗时模型变化 |

不支持的钩子：`shouldTransformCachedModule`（Rollup 缓存模型专属）、`resolveImportMeta`、`resolveFileUrl`、`renderDynamicImport`。

虚拟模块约定与 Rollup 一致：resolved ID 加 **`\0` 前缀**（真实路径不可能含空字节），其他插件与内置解析见到即跳过；对外导入名习惯用 `virtual:xxx`，resolveId 时映射为 `\0virtual:xxx`。

## 二、Vite 8 集成内幕

落地三部曲：

1. **rolldown-vite（2025，过渡 fork）**：`"vite": "npm:rolldown-vite@latest"` npm alias（或元框架场景的 overrides/resolutions）提前体验；插件用 `this.meta.rolldownVersion` 探测环境；`transformWithEsbuild` 被 `transformWithOxc` 取代；CSS 压缩改走 Lightning CSS。
2. **Vite 8 stable（2026-03-12）**：Rolldown 转正为唯一打包器，dev 预构建与生产打包同引擎；绝大多数插件零改动；Node 要求 20.19+ / 22.12+（与 Vite 7 相同）。
3. **配套去 Babel 化**：`@vitejs/plugin-react` v6 用 **Oxc 跑 React Refresh**、移除 Babel 依赖——React 项目 dev 链路里最慢的一环被 Rust 化。

值得注意的工程细节：

- Vite 8 对**未知配置选项会发校验警告**——靠「拼错也不报错」蒙混的配置在升级时会现形；
- 第三方慢插件可用 `withFilter` 包装外挂 hook filter，不必等插件作者适配；
- 真实迁移收益参考：Linear 46s → 6s、Ramp -57%、Mercedes-Benz.io -38%、Beehiiv -64%。

## 三、Full Bundle Mode：下一步棋

当前 Vite dev 是 unbundled（按需原生 ESM），与生产 bundled 形态天然不同；大型应用 dev 首屏动辄数千模块请求形成网络瀑布。**Full Bundle Mode 让 dev 也提供打包产物**——靠 Rolldown 的速度，把「打包」从生产专属变成两端统一：

- 官方预期数字：**dev 启动快 ~3×、整页重载快 ~40%、网络请求少 ~10×**；
- 彻底消除 dev/prod 行为差异（连「是否打包」这个最大差异也抹平）；
- 状态：**实验性 / opt-in 未来方向**，不是 Vite 8 默认行为；HMR 保留。

## 四、实验区：lazyBarrel 与 moduleTypes

```js
export default defineConfig({
  experimental: { lazyBarrel: true },
  moduleTypes: { ".svg": "dataurl", ".txt": "text" },
});
```

- **lazyBarrel**：针对桶文件（大量 re-export 的 `index.ts`，典型如组件库/图标库入口）——未被使用的导出分支**延迟/跳过解析与转换**，从源头砍掉大型依赖图的处理量。1.0 公告把「稳定化 lazy barrel optimization」列入后续计划。
- **moduleTypes**：扩展名 → 内置模块类型（json/text/base64/dataurl/binary/empty…），对标 esbuild 的 loader 概念；插件 `load`/`transform` 返回值也可带 `moduleType` 按模块指定（rolldown-vite 时期要求非 JS 内容显式标 `moduleType: 'js'` 即源于此机制）。

⚗️ 实验特性不在 1.0 语义化承诺范围内，可能调整或更名。

## 五、JS 插件的成本模型与优化清单

Rolldown 的性能死角不在 Rust 核心，而在 **Rust↔JS 边界**。一次 JS 钩子调用的真实成本 = 跨语言调度 + 模块内容（code/id/meta）在两侧间的序列化传输 + JS 侧执行与 GC。万级模块 × 多插件 × 多钩子，乘起来足以吃掉引擎红利。排查与优化按序走：

1. **先量化**：用 `builtin:bundle-analyzer` 与构建日志确认热点插件，而不是猜；
2. **凡 JS 钩子必配 filter**：`resolveId`/`load`/`transform` 的 `filter.id`/`filter.code` 让 Rust 侧预筛，不匹配的模块**根本不发起 JS 调用**——这是收益最大的单点优化；
3. **高频通用逻辑换 builtin**：替换、分析这类高频件用 Rust 内置插件（`builtin:replace` 等），全程不出 Rust；
4. **第三方插件外挂 `withFilter`**（Vite 侧）：不等上游适配也能补上过滤；
5. **避免在 transform 里做全量字符串操作**：Rolldown 在底层提供原生 magic-string 能力（in-depth 文档 native magic string），插件返回精确的局部修改比整段重写更利于增量与 sourcemap。

> 心智模型：**Rust 核心是免费的，JS 插件按「调用次数 × 传输体积」计费**——把账单打下来的手段就是 filter 与 builtin。

## 六、1.0 稳定性承诺与版本策略

2026-05-07 的 1.0 公告给出明确契约：

- **承诺**：配置**选项名与类型**、**插件钩子签名**保持向后兼容；「no planned breaking changes to Rolldown's public API」；
- **不承诺**：产物字节级一致（优化持续演进）、Rust crate 内部 API、`experimental.*` 命名空间；
- 时间线全景：2024-04 首个公开版 0.10.1 → 2024-12 1.0.0-beta.1 → **2026-01-22 1.0.0-rc.1** → 2026-03-12 Vite 8 stable（RC 期转正上车）→ **2026-05-07 1.0.0** → 2026-06 已 1.1.x；
- 版本策略建议：应用跟随 Vite 8 间接消费即可；直接依赖 Rolldown 的工具链锁 `^1.x`，关注 minor 中 experimental 区的变动。

## 七、技术选型速记（2026-06）

| 场景 | 推荐 |
|---|---|
| Vite 应用 | 升级 Vite 8 即获得 Rolldown，无需单独引入 |
| 独立打包应用/脚本 | 直接用 `rolldown`（CLI/JS API） |
| 打包库（含 dts） | **tsdown**（Rolldown 官方上层，tsup 接班人） |
| 仍重度依赖 Rollup 专属钩子的插件体系 | 暂留 Rollup，按差异清单逐步适配 |
| 需要 ES5/IE 产物 | Rolldown 不适用（下限 ES2015），需另寻降级管线 |
