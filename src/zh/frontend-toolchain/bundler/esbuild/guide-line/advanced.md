---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

## 一、tree shaking：何时生效、如何标注

esbuild 的 tree shaking 是**声明级死代码消除**，默认规则容易被想当然：

- **默认仅在「开启 bundle」或「format=iife」时启用**，其余情况关闭（输出可能被外部引用，删了不安全）；
- `--tree-shaking=true` 强制开启（即使不 bundle）、`=false` 强制关闭。

参考的两类**副作用标注**：

```json
// package.json（被引用的库）
{ "sideEffects": false }
```

```js
// 调用级标注：返回值未被使用时整个调用可删
const fib = /* @__PURE__ */ createFib()
```

- `sideEffects: false` 声明「未被使用的文件可整体移除」（webpack 发起的社区约定，esbuild 跟随）；
- 三方包标注错误导致产物缺代码时，用 `--ignore-annotations` 兜底；
- **ESM 静态结构最利于摇树**；CommonJS 动态语义常被整体保留——库发 ESM 是体积友好的前提。

## 二、splitting：仅 esm 的代码拆分

```bash
esbuild home.ts about.ts --bundle --splitting --format=esm --outdir=dist
```

- **前提：`format=esm` + `--outdir`**（cjs/iife 目前不支持；FAQ 自评现状「primitive」，改进在 issue #16）；
- 两类拆分：**多入口共享代码**拆为公共 chunk（避免重复）、**`import()` 动态导入**拆为按需 chunk；
- chunk 命名可用 `--chunk-names=chunks/[name]-[hash]` 控制。

## 三、define / external / alias：构建期改写依赖关系

```bash
# 常量替换：字符串值必须是 JSON 字符串（外层引号给 shell）
esbuild app.ts --bundle --define:process.env.NODE_ENV='"production"' --define:DEBUG=false

# 排除打包，保留运行时导入；支持通配符
esbuild app.ts --bundle --external:fsevents --external:/assets/*

# Node 场景：所有裸模块导入一键外置
esbuild server.ts --bundle --platform=node --packages=external --outfile=dist/server.js

# 导入路径替换
esbuild app.ts --bundle --alias:oldpkg=newpkg
```

- **define** 把标识符替换为常量表达式；配合 minify 做死代码消除（`if (DEBUG) {...}` 整段删除）。`platform=browser` 时 `process.env.NODE_ENV` 有自动 define（全 minify → `"production"`，否则 `"development"`），手动 define 可覆盖。
- **inject** 更进一步：用文件里的导出替换全局标识符（如自动注入 React、为 `process` 提供 shim）。
- **drop** 系列：`--drop:console --drop:debugger` 移除调试代码（minify 不会删 console，因为调用有副作用）。

## 四、metafile：体积分析的数据底座

```bash
esbuild app.ts --bundle --metafile=meta.json --outfile=out.js --analyze
```

```js
const result = await esbuild.build({ entryPoints: ['app.ts'], bundle: true, outdir: 'dist', metafile: true })
console.log(await esbuild.analyzeMetafile(result.metafile, { verbose: true }))
```

- metafile 记录**每个输入文件的字节数与 import 关系、每个输出文件的组成与体积归因**；
- 三种消费方式：CLI `--analyze` 终端报告、JS `analyzeMetafile()`、官网 **Bundle Size Analyzer**（esbuild.github.io/analyze/）上传可视化；
- 这是回答「bundle 为什么大、哪个依赖占大头」的原生路径，无需 webpack-bundle-analyzer。

## 五、context API：watch / serve / rebuild 的统一入口（v0.17+）

```js
import * as esbuild from 'esbuild'

const ctx = await esbuild.context({
  entryPoints: ['src/app.tsx'],
  bundle: true,
  outdir: 'www/js',
  sourcemap: true,
})

await ctx.watch()                              // 文件变更自动重建
const { port } = await ctx.serve({ servedir: 'www' })  // 开发服务器
// await ctx.rebuild()                         // 或手动增量重建（CI/自定义 watcher）
// await ctx.dispose()                         // 结束：停 watch/serve、释放资源
```

- v0.17 把旧的 `incremental` / `build({ watch })` / 独立 `serve()` **统一收敛**为 context：同一份选项、三种增量姿势（rebuild/watch/serve）可叠加；
- **watch 的实现是可移植轮询**：每轮扫描随机子集省 CPU、大项目约 2 秒全量覆盖、近期变更路径每轮必查；不喜欢可自带 chokidar + `ctx.rebuild()`；
- **serve 按请求构建**：请求到来时若无构建进行先重建再响应——浏览器永远拿到最新产物；产物在内存不落盘；HTTPS 用 `keyfile`/`certfile`。

### live reload（不是 HMR）

```js
// 开发版入口里加一行：订阅 SSE，变更即整页刷新
new EventSource('/esbuild').addEventListener('change', () => location.reload())
```

`change` 事件携带 `added` / `removed` / `updated` 文件数组——官方文档演示了据此实现 **CSS 免刷新热替换**（只换 `<link>`）。但 **JS 的 HMR 在官方「不做」清单里**：状态保留的模块热替换请用 Vite/webpack。

## 六、JSX 细节

```bash
esbuild app.jsx --bundle --jsx=automatic --outfile=out.js     # React 17+ 自动运行时
esbuild app.jsx --bundle --jsx-factory=h --jsx-fragment=Fragment  # Preact
```

- 默认是 **classic transform**（编译为 `React.createElement`，文件里要能拿到 React）；`--jsx=automatic` 自动从 `react/jsx-runtime` 引入（也可由 tsconfig `"jsx": "react-jsx"` 推断），`--jsx-import-source` 换源；
- `--jsx=preserve` 保留 JSX 不转换（交给下游工具）；
- `.tsx` 的泛型箭头歧义：`<T>(x: T) => x` 解析失败，写 `<T,>` 或 `<T extends unknown>`。

## 七、write:false 与 stdin：把 esbuild 当库用

```js
const result = await esbuild.build({
  entryPoints: ['app.ts'],
  bundle: true,
  write: false,            // 不落盘
  outdir: 'out',
})
for (const f of result.outputFiles) console.log(f.path, f.text.length)
```

- `write: false` 时产物在 `outputFiles`（`path`/`contents`/`text`），适合二次加工（再压缩、注入、上传、测试断言）；
- `stdin: { contents, loader, resolveDir }` 支持以字符串为入口打包（resolveDir 决定其中相对导入的解析基准）；
- 这两个能力 + transform API，就是无数上层工具（tsup、Vite、各类 CLI）把 esbuild 当**库引擎**的用法。

---

下一步：[指南 · 专家](./expert)——插件机制与虚拟模块、为什么快、能力边界与生态位。
