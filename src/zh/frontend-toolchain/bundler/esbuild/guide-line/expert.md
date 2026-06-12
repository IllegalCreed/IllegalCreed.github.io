---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

## 一、插件机制：onResolve / onLoad 与模块边界

esbuild 插件**不暴露 AST**，作用在「模块的解析与加载」两个边界上：

```js
const envPlugin = {
  name: 'env',
  setup(build) {
    // ① 拦截路径解析：标记为虚拟模块（非 file namespace 不走文件系统）
    build.onResolve({ filter: /^env$/ }, () => ({
      path: 'env',
      namespace: 'env-ns',
    }))
    // ② 提供模块内容与解释方式
    build.onLoad({ filter: /.*/, namespace: 'env-ns' }, () => ({
      contents: JSON.stringify(process.env),
      loader: 'json',
    }))
  },
}

await esbuild.build({ entryPoints: ['app.js'], bundle: true, outfile: 'out.js', plugins: [envPlugin] })
```

- 插件 = `{ name, setup(build) }`；setup 每次 build 执行一次；
- **filter 是 Go 正则**：在 Go 侧先行筛选、不必每个路径回调 JS——官方强调 filter 尽量收窄，这是插件性能的关键；
- **namespace**：模块默认在 `file` namespace；自定义 namespace 表示「不在磁盘上」，虚拟模块内容里还有相对导入时要给 `resolveDir`；
- 生命周期钩子：`onStart`（每次构建开始）、`onEnd`（可读改 build result）、`onDispose`（清理）；`build.resolve()` 可手动调用内置解析。

**硬边界**：插件只配 **build API**（transform 不行）、**CLI 不能用插件**、**没有 AST 操作 API**——要做表达式级改写，在 onLoad 里自接 Babel/SWC 处理 contents。官方态度：「插件最适合做克制的、只定制构建一小方面的事；需求非常定制就该用别的工具。」

### 实战：onEnd 做构建通知 / 产物后处理

```js
const notifyPlugin = {
  name: 'rebuild-notify',
  setup(build) {
    build.onStart(() => console.time('build'))
    build.onEnd((result) => {
      console.timeEnd('build')
      if (result.errors.length) console.error('失败：', result.errors)
      // 配 metafile: true 时这里能拿到 result.metafile 做体积守门
    })
  },
}
```

onEnd 与 context API 是绝配：`ctx.watch()` 下每次重建都会触发，等于免费获得「构建完成回调」——上层工具（dev server、测试 runner）大多靠它编排。

## 二、为什么快：FAQ 的四点拆解

1. **Go + 原生代码**：JS 写的打包器每次启动都被 VM「第一次见到」，要边解释边收集优化提示；esbuild 是编译好的原生码，起跑线就不同；
2. **极致并行**：parse / link / codegen 三阶段都设计为吃满所有核；Go 线程共享内存，优于 JS worker 间序列化传数据；
3. **一切自研、零三方依赖**：自写 JS/TS 解析器，绕开官方 TS 编译器的性能陷阱（megamorphic 对象形状、不必要的动态属性访问）；
4. **内存效率**：AST 全程只过约**三遍**（lex/parse/scope 一遍，bind/minify/transform 一遍，minify/codegen 一遍），数据尽量留在 CPU 缓存里。

> 推论：esbuild 的速度来自**架构而非缓存**——这也是它敢承诺「无缓存极速」的原因。同理，它拒绝暴露 AST 给插件：一旦节点反复进出 JS 层，性能模型就塌了（Babel 慢的根因之一）。

## 三、能力边界：官方「不做」清单

FAQ 明确**有意不在核心实现**（不是「还没做」）：

| 不做 | 替代方案 |
|---|---|
| TypeScript 类型检查 | `tsc --noEmit` 并行跑 |
| ES6+ → ES5 降级 | Babel / SWC 接在 esbuild 后 |
| HMR | Vite / webpack（esbuild 只有整页 live reload） |
| 模块联邦 | webpack / Rspack |
| 其他语言（Vue/Svelte/Elm/Angular） | 社区插件或对应框架工具链 |
| 自定义 AST 操作 API | onLoad 里自接 Babel |
| `.d.ts` 生成 | `tsc --emitDeclarationOnly`（或 tsup 封装） |
| polyfill 注入 | core-js / preset-env |

HTML 内容类型「在考虑中」（#31）。这种**范围克制**是设计哲学：esbuild 要做的是稳定的基础设施层，而不是 all-in-one 框架。

## 四、版本语义与维护状态（2026-06）

- **0.28.x，仍是 0.x**：官方约定 **patch 向后兼容、minor 承载破坏性变更**（0.27 → 0.28 要读 changelog）——所以安装要 `--save-exact`，CI 锁版本；
- FAQ 自评「**late-stage beta**」：稳定且被大规模生产使用（Vite、Amazon CDK、Phoenix……），但拆分等能力仍「primitive」；
- **维护态**：作者 Evan Wallace（单一主维护者）原话「I'm not doing active feature development for esbuild at the moment」；收尾目标 = 拆分改进（#16）+ HTML（#31），之后「relatively complete」——esbuild 的终态是**完成**，不是无限演进。

## 五、生态位：被谁用、被谁追

- **Vite（7 及之前）**：dev 依赖预打包（optimizeDeps，CJS→ESM、合并细碎模块）+ TS/JSX 单文件 transform + 默认 JS/CSS minify 都是 esbuild；生产 bundle 用 Rollup——「双引擎」差异正是 Rolldown 要统一的问题；
- **tsup**：基于 esbuild 的库打包事实标准（配 tsc 出 `.d.ts`）；
- **Amazon CDK / Phoenix / Serverless 各框架**：函数代码打包引擎；
- **Rust 追赶者**：Rolldown（Rollup API 兼容、Vite 御用方向）、Rspack（webpack 兼容）、Oxc（解析/转换基建）——竞争逻辑都是「esbuild 证明了原生化的收益，我们再补上它刻意不做的部分」。

## 六、专家级易错点

- **minor 升级当 patch 升**：`^0.27.0` 这种 range 会把破坏性变更拉进来——锁精确版本；
- **以为 esbuild 检查了类型**：CI 里没跑 `tsc --noEmit`，类型错误带上生产；
- **`--define:K=production` 忘了 JSON 引号**：被替换成标识符，运行时 `ReferenceError`；
- **在 cjs/iife 里用顶层 await**：仅 esm 支持（`require()` 是同步的）；
- **指望 `--target=es5`**：转不动直接报错，esbuild 不做 ES5 降级；
- **拿 serve 当生产服务器**：产物在内存、按请求构建，是纯开发工具；
- **插件 filter 写 `/.*/` 全量回调**：Go→JS 往返吃掉性能红利，filter 必须收窄；
- **`.babelrc` 式直觉**：esbuild 没有配置文件（也是有意的），一切显式传参——封装统一构建脚本即「配置」。
