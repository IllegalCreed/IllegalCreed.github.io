---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **rollup 4.61.x**。本篇深入两大主题：tree-shaking 的副作用模型（删得多还是删得稳），以及代码分割与库的输出策略。

## 一、tree-shaking 的副作用模型

tree-shaking 不是「删未调用的函数」这么简单，真正的难点是**副作用判定**——删掉一段「没人用其返回值」的代码安全吗？

### 1. moduleSideEffects：模块级假定

```js
export default {
  treeshake: {
    moduleSideEffects: true, // 默认：假定被导入的模块有副作用 → 保留其顶层代码
    // moduleSideEffects: false, // 激进：未用到导出的模块整个删除
  },
};
```

> ⚠️ 设为 `false` 后，`import './polyfill.js'`、`import 'foo.css'` 这类**纯副作用导入会被整体摇掉**——这是该选项最经典的事故现场。需要精确控制时用函数形式 `(id, external) => boolean`。

### 2. `/*@__PURE__*/`：调用级豁免

```js
// 没有注解：函数调用可能有副作用，结果没人用也不敢删
const heavy = createHeavyThing();

// 有注解：声明调用无副作用，heavy 未被使用时连调用一起删
const heavy2 = /*@__PURE__*/ createHeavyThing();
```

由 `treeshake.annotations`（默认 `true`）控制是否尊重注解。库作者给「构造但可能不被用」的导出加 PURE 注解，是帮下游打包器瘦身的标准手段。

### 3. package.json `sideEffects`：包级声明

```jsonc
// 依赖包的 package.json
{ "sideEffects": false }          // 整包无副作用
// { "sideEffects": ["*.css"] }   // 除 CSS 外无副作用
```

该字段由 **`@rollup/plugin-node-resolve` 读取**并转化为模块级副作用信息：未用到导出的无副作用模块文件可被整体删除（barrel file 全量再导出只保留实际用到的子模块）。注意它不是 Rollup 核心直接解析的。

### 4. treeshake 预设：一档拨到位

| 预设 | 取向 |
|---|---|
| `'smallest'` | 体积优先，最激进假设（含 `moduleSideEffects: false`），可能误删非常规副作用 |
| `'recommended'` | 默认取向，安全与体积平衡 |
| `'safest'` | 最贴近规范语义，删得最少 |

预设之上可单独覆盖 `propertyReadSideEffects`（属性读取是否视作副作用——getter 可能抛错/打日志）、`tryCatchDeoptimization` 等细项。

## 二、代码分割三板斧

### 1. 自动分割：动态 import 与多入口

```js
// ① 动态 import() → 自动拆出按需加载的 chunk
button.onclick = () => import("./editor.js").then((m) => m.open());
```

```js
// ② 多入口 → 共享依赖自动提取成共享 chunk，避免重复打包
export default {
  input: { main: "src/main.js", admin: "src/admin.js" },
  output: { dir: "dist", format: "esm" }, // 多 chunk 必须 dir
};
```

官网强调这一切「**无需自定义加载器代码**」。要把动态导入压回单文件，用 `output.inlineDynamicImports: true`（仅限单入口）。

> ⚠️ `iife`/`umd` 是自包含单文件格式，**不支持多 chunk**；代码分割请选 `es`/`system`/`cjs`/`amd`。

### 2. 手动干预：manualChunks

```js
output: {
  dir: "dist",
  manualChunks(id) {
    if (id.includes("node_modules")) return "vendor"; // 第三方统一进 vendor
    // 返回 undefined → 交回默认分配策略
  },
  // 对象形式：manualChunks: { lodash: ["lodash-es"] }
},
```

### 3. 文件命名与长缓存

```js
output: {
  entryFileNames: "[name].js",                      // 默认
  chunkFileNames: "chunks/[name]-[hash].js",        // 默认 [name]-[hash].js
  assetFileNames: "assets/[name]-[hash][extname]",  // 默认
},
```

`[hash]` 基于内容计算，是 immutable 长缓存的根基；**Rollup 4 起为 URL 安全的 base64（最长 21 字符）**，可用 `[hash:8]` 指定长度。模板里写 `/` 自动创建子目录。

## 三、库的输出策略

### preserveModules：不合并，保结构

```js
output: {
  dir: "dist",
  format: "esm",
  preserveModules: true,            // 逐模块输出文件而非合并
  preserveModulesRoot: "src",       // 去掉 src 前缀
},
```

适合组件库：使用方可按文件深度导入、下游打包器能做更细的二次 tree-shaking。**注意 tree-shaking 依然生效**——它改变的是输出粒度，不是「原样拷贝源码」。

### output.exports：CJS 互操作

打 `cjs` 时 `exports`（默认 `'auto'`）按入口导出形态猜测。**default 与具名导出混用**时会警告——CJS 下两者语义有歧义，要么显式 `exports: 'named'`（默认导出挂 `.default`），要么重构成纯具名导出。库作者首选后者。

### plugin-babel 的 babelHelpers

```js
babel({ babelHelpers: "bundled" }); // 应用：helpers 打进产物，自包含
babel({ babelHelpers: "runtime" }); // 库：引用 @babel/runtime 去重
// 库场景配套：external: [/@babel\/runtime/] + @babel/plugin-transform-runtime
```

## 四、多份输出与条件配置

```js
export default (commandLineArgs) => ({
  input: "src/index.js",
  output: [
    { file: "dist/index.mjs", format: "esm" },
    { file: "dist/index.cjs", format: "cjs" },
    {
      file: "dist/index.min.js",
      format: "iife",
      name: "MyLib",
      plugins: [terser()], // 输出级插件：只压缩这一份（只能用 output 阶段钩子）
    },
  ],
});
```

- 配置导出**函数**可接收命令行参数；`rollup -c --environment BUILD:production` 则通过 `process.env.BUILD` 传值；
- **build 钩子整次构建跑一轮，output 钩子每份输出各跑一轮**——这是 `output.plugins` 存在的原因（详见专家篇钩子体系）。

---

副作用模型与分割策略吃透后，进入[指南 · 专家](./expert)：插件钩子体系、JavaScript API、疑难排错与 2026 生态格局。
