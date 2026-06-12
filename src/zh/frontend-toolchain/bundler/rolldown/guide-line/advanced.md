---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **rolldown 1.1.x**。transform 全家桶、minify、codeSplitting 手动分包、插件系统（Rollup 复用 / builtin / hook filter）、watch 与 tsdown——把 Rolldown 用进真实工程。

## 一、transform 全家桶

`transform` 聚合了所有内置代码转换（发生在插件 `transform` 钩子**之后**）：

### target：语法降级

```js
transform: {
  target: ["es2020", "chrome87", "safari14"], // 数组取交集语义
}
```

- 默认 **esnext**（不做任何转换）；最低降到 **es2015**，不支持 ES5；
- 支持 `'es2015'`~`'es2024'`/`'esnext'` 与 `chrome58`/`node12`/`safari11` 等环境目标；
- **只降语法、不注入 polyfill**——旧环境缺的运行时 API（如 `Array.prototype.at`）要自己补。

### define：构建期常量替换

```js
transform: {
  define: {
    IS_PROD: "true",
    "process.env.NODE_ENV": "'production'", // 属性访问器也支持
    __VERSION__: JSON.stringify(pkg.version),
  },
}
```

⚠️ 值是**表达式字符串**：字符串字面量必须双层引号（或 `JSON.stringify`），漏内层引号会被替换成裸标识符，运行时报 `production is not defined`。替换后的 `if ('production' === 'production')` 会被常量折叠进而消除死分支。

### inject：全局变量 shim

```js
transform: {
  inject: {
    Promise: ["es6-promise", "Promise"], // import { Promise } from 'es6-promise'
    $: "jquery",                          // import $ from 'jquery'
    fs: ["node:fs", "*"],                 // import * as fs from 'node:fs'
    "Object.assign": "./shims/object-assign.js", // 属性访问 shim
  },
}
```

模块里**用到了**这些全局名才注入对应 import，API 对齐 `@rollup/plugin-inject`。典型场景：浏览器环境补 Node 全局（`Buffer`/`process`）、老库的隐式 jQuery。

### dropLabels：剔除调试代码

```js
transform: { dropLabels: ["DEBUG", "DEV"] }
```

源码中 `DEBUG: console.log(...)`、`DEV: { ... }` 整段在构建期被移除——比 if 包裹更干净的「仅开发执行」标记法。

## 二、minify 与产物质量

```js
output: {
  minify: true,      // Oxc minifier：compress + mangle
  sourcemap: true,
  // banner/footer/intro/outro 可注入版权头等
}
```

无需 terser/esbuild 二次处理。`treeshake` 默认开启；`output.keepNames` 可在压缩时保留函数/类名（依赖名字的反射、错误上报场景）。

## 三、代码分割：codeSplitting

自动分包（多入口共享、动态 import 拆 chunk）默认就有；**手动分包**用 `output.codeSplitting`——这是 esbuild 与 Rollup 都没有的 splitChunks 式声明能力：

```js
output: {
  codeSplitting: {
    groups: [
      { test: /node_modules\/(react|react-dom)/, name: "react-vendor" },
      { test: /node_modules/, name: "libs" }, // 兜底：其余依赖进 libs
    ],
  },
}
```

- `groups` 按序匹配，`test` 是模块 ID 正则，`name` 可为字符串或 `(moduleId) => string | null` 函数；
- 经典用法：依赖单独成 chunk，业务代码频繁变更不再击穿依赖缓存；
- **`manualChunks` 已废弃**：迁移就是把回调逻辑改写成 groups 声明（rolldown-vite 预览期这套能力曾叫 `advancedChunks`）。

## 四、插件系统

### 复用 Rollup 插件

插件接口与 Rollup「几乎完全兼容」：钩子名、`this` 上下文、返回值约定一致，**大多数 Rollup/Vite/unplugin 插件直接放进 `plugins` 数组即可**。不支持的钩子只有少数：`shouldTransformCachedModule`、`resolveImportMeta`、`resolveFileUrl`、`renderDynamicImport`（撞上会收到警告而非静默）。

### builtin 插件：Rust 实现的高频件

```js
import { replacePlugin } from "rolldown/experimental";

plugins: [
  replacePlugin({ __BUILD_TIME__: JSON.stringify(Date.now()) }),
]
```

官方内置 `builtin:replace`、`builtin:bundle-analyzer`、`builtin:esm-external-require` 等 Rust 插件。迁移自 `@rollup/plugin-replace` 注意两点差异：**只接受静态字符串值**（函数值先求值）、**不支持 include/exclude**。

### hook filter：JS 插件的性能生命线

Rolldown 核心在 Rust 侧，**每次调用 JS 钩子都要跨语言边界 + 传输模块内容**。filter 把匹配条件下放给 Rust，原生侧直接跳过不相关模块：

```js
const myCssPlugin = {
  name: "my-css",
  transform: {
    filter: { id: /\.css$/ }, // Rust 侧预筛，不匹配根本不调 JS
    handler(code, id) {
      /* 只有 .css 才进来 */
    },
  },
};
```

- `resolveId`/`load`/`transform` 都支持 filter（id / code 等条件）；
- 经验法则：**写 Rolldown 插件，凡是钩子都先想 filter**；第三方插件没配的，Vite 侧还有 `withFilter` 包装器可以外挂补救。

## 五、watch 与 external

```js
import { watch } from "rolldown";

const watcher = watch({ input: "src/main.ts", output: { dir: "dist" } });
watcher.on("event", (e) => {
  if (e.code === "BUNDLE_END") console.log(`rebuilt in ${e.duration}ms`);
});
```

⚠️ 与 Rollup 的差异：watch 模式下 **`options` 钩子只在 watcher 初始化时调一次**（Rollup 每次重建都调）——按次初始化逻辑放 `buildStart`。

`external` 支持字符串/正则/函数，库场景常配 `output.globals`（iife/umd）或交给 tsdown 自动处理。

## 六、库打包：交给 tsdown

直接用 Rolldown 打库当然可行，但官方路径是上层工具 **tsdown**（rolldown 组织出品，「The elegant bundler for libraries powered by Rolldown」，tsup 接班人）：

```ts
// tsdown.config.ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true, // 类型声明生成
});
```

tsdown 在 Rolldown 之上补齐库场景四件套：**dts 生成、dependencies/peerDependencies 自动 external、exports 字段生成、unbundle 模式**。截至 2026-06 仍是 0.22.x（未 1.0），但已是 Vite 生态的官方推荐。

---

进入 [指南 · 专家](./expert)：与 Rollup 的钩子行为差异全清单、Vite 8 集成内幕、Full Bundle Mode、lazyBarrel/moduleTypes 实验区与 1.0 稳定性承诺。
