---
layout: doc
outline: [2, 3]
---

# 核心原理与配置

> 基于 Terser / esbuild / SWC / lightningcss / cssnano / html-minifier-terser 官方文档编写，对照 Vite 7 / Webpack 5 稳定版

## 速查

- **JS 三大选项组**：Terser `compress / mangle / format`；esbuild `minifyWhitespace / minifyIdentifiers / minifySyntax`；SWC `jsc.minify.{compress,mangle,format}`
- **mangle 默认开**：Terser `mangle:true`、esbuild `minifyIdentifiers:true`、SWC `mangle:true`
- **keep names**：Terser `keep_classnames:true`+`keep_fnames:true` / esbuild `keepNames:true` / SWC `mangle.keepClassNames:true`+`keepFnNames:true`（依赖 `.name` 时必须开）
- **drop_console**：Terser 默认 `false` 但 `drop_debugger` 默认 `true`；esbuild `drop:['console','debugger']` 或 `pure:['console.log']`（后者保留 `console.error`）
- **esbuild 三合一可拆**：`minify=true` = `minifyWhitespace + minifyIdentifiers + minifySyntax`
- **esbuild 默认不混淆顶层声明名**：除非启用 bundling 或设 format
- **CSS**：lightningcss（Rust，Vite 7 默认）/ cssnano（PostCSS，慢）；选 lightningcss 必配 `targets`
- **CSS 压缩器对比**：lightningcss 一体化（压缩+降级+前缀），cssnano 只压不降级
- **HTML**：html-minifier-terser 默认全关，需显式 `collapseWhitespace`+`conservativeCollapse`+`removeComments`+`minifyJS`+`minifyCSS`
- **Vite 7**：`build.minify='oxc'`（'esbuild' 已 deprecated），`build.cssMinify='lightningcss'`
- **Webpack 5**：`optimization.minimize=true`（仅 production），内置 TerserPlugin（JS），CSS 必须手动加 CssMinimizerPlugin；**关键陷阱**：minimizer 加任何 plugin 会覆盖默认 TerserPlugin
- **legalComments**：esbuild 五种（none/inline/eof/linked/external），默认 bundling 时 `eof`、否则 `inline`
- **生产开 / 开发关**：开发期 mangle 干扰调试栈，必须关
- **边界**：HTTP gzip/brotli 归【网络优化】，本叶只讲构建期源码压缩

## Terser 详解

Terser 是 JS 压缩的**质量标杆**——Webpack 5 内置默认、Vite 可选项、几乎所有「追求极限压缩」的场景最终都回退到它。它是 fork 自 UglifyJS 的现代维护版本，支持 ES6+ 与最新的 ES 标准。

### 三大选项组

```js
import { minify } from 'terser';
const { code } = await minify(code, {
  compress: {},   // 压缩选项，传 false 跳过
  mangle: true,   // 重命名标识符，传 false 跳过
  format: {},     // 输出格式选项
});
```

### compress 关键子选项

| 子选项 | 默认值 | 作用 |
| --- | --- | --- |
| `drop_console` | `false`（可传数组如 `['log','info']`） | 删 `console.*`；传数组只删指定方法（保留 error/warn） |
| `drop_debugger` | `true` | 删 `debugger` 语句 |
| `pure_funcs` | `[]` | 标记无副作用函数，触发整条调用语句删除（如 `['lodash.identity']`） |
| `passes` | `1` | 多次扫描通常更小但耗时线性增长（建议 2~3） |
| `toplevel` | `false` | ES module 下建议 `true`，删除未引用顶层 |
| `dead_code` | `true` | 删不可达代码 |
| `unused` | `true` | 删未引用变量 |
| `unsafe_*` | `false` | `unsafe_math` / `unsafe_comps` / `unsafe_methods` 等，可能改语义 |
| `ecma` | `5` | 传 `2015+` 启用更小的 ES6+ 形态 |
| `conditionals` | `true` | 优化条件表达式 |
| `sequences` | `true` | 用逗号合并多个语句 |
| `booleans` | `true` | 优化布尔表达式（`true` → `!0`） |

### mangle 关键子选项

| 子选项 | 默认值 | 作用 |
| --- | --- | --- |
| `keep_classnames` | `false`（可传正则只保留匹配） | 保留类名以兼容依赖 `.name` 的框架 |
| `keep_fnames` | `false`（可传正则） | 保留函数名 |
| `reserved` | `[]` | 排除特定标识符不被 mangle |
| `safari10` | `false` | 处理 Safari 10/11 的 mangle bug |
| `toplevel` | `false` | 是否混淆顶层声明名 |

### format 关键子选项

| 子选项 | 默认值 | 作用 |
| --- | --- | --- |
| `comments` | `'some'` | 保留 `@license` / `@preserve` / `!` 开头注释（合规） |
| ` beautify` | `false` | 美化输出（用于反格式化场景） |
| `ecma` | `5` | 输出目标版本 |

### keep_classnames / keep_fnames：何时必须开

依赖以下场景必须显式保留 `.name` 属性：

- **AngularJS（Angular 1）**：依赖 `function.toString()` 读参数名做 DI——已被官方警告会崩
- **MobX**：装饰器读类名做注册
- **styled-components**：组件 `.name` 用于 displayName
- **部分 DI 框架**（InversifyJS、tsyringe）：根据构造函数 `.name` 解析

```js
// Terser
compress: { keep_classnames: true, keep_fnames: true }
mangle: { keep_classnames: true, keep_fnames: true }
```

> React 组件若无反射依赖，默认不需要开。

### pure_funcs 与 DCE 联动

```js
// 源码
import _ from 'lodash.identity';
_(42);  // 调用结果未使用，但函数调用本身被认为有副作用
console.log('debug');

// Terser
compress: {
  pure_funcs: ['lodash.identity', 'console.log'],
  drop_console: true,
}
// 压缩后：整条语句被删除
```

### Fast Minify Mode（极致速度档）

只做 `mangle` + 去 whitespace，跳过 compress 的复杂分析——通常能拿到 95% 的压缩收益，耗时降到 1/10：

```js
const { code } = await minify(code, {
  compress: false,   // 跳过压缩分析
  mangle: true,      // 仍重命名
  format: { comments: false },
});
```

> esbuild 默认就是这种风格——以 Terser 1/10 的耗时换取 Terser 95% 的压缩率，性价比极高。

## esbuild 详解

esbuild 是 Go 写的极速通用 bundler/minifier——除 Rolldown-Vite 之外最快的通用 minifier。Vite 7 之前是默认 minifier，现已被 Oxc 替代但仍是社区主流。

### minify 三合一可拆分

```bash
esbuild input.js --minify               # 全开
esbuild input.js --minify-whitespace    # 只去空白
esbuild input.js --minify-identifiers   # 只重命名
esbuild input.js --minify-syntax        # 只重写语法
```

```js
import esbuild from 'esbuild';
const { code } = await esbuild.transform(code, { minify: true });
const { code: c2 } = await esbuild.transform(code, {
  minifyWhitespace: true,
  minifyIdentifiers: true,
  minifySyntax: false,  // 跳过语法重写（保持兼容性）
});
```

> `minify=true` ≡ 三个独立 flag 全开。

### 典型压缩示例

```js
// 源码
const fn = (obj) => { return obj.x; };

// minify 后
const fn=n=>n.x;
```

### keepNames：保留 .name

```js
const { code } = await esbuild.transform(code, {
  minify: true,
  keepNames: true,   // 等价于 Terser keep_classnames + keep_fnames
});
```

### drop / pure：删日志与副作用

```js
await esbuild.transform(code, {
  minify: true,
  drop: ['console', 'debugger'],  // 删所有 console.* 与 debugger
  pure: ['console.log'],           // 标记 console.log 无副作用（保留 console.error）
});
```

> `drop:['console']` 删所有 console 方法（含 error/warn）；`pure:['console.log']` 只删 console.log，保留 error/warn——更精细。

### mangleProps：属性名混淆（慎用）

```js
await esbuild.transform(code, {
  minify: true,
  mangleProps: /^_/,   // 修改所有以下划线结尾的属性
});
```

> esbuild 官方警告：除非明确知道影响，否则别用——会破坏依赖字符串属性名的代码（DOM API、JSON 序列化、第三方库内部约定）。

### 默认不混淆顶层声明名的原因

esbuild 默认只混淆函数内的局部标识符，不混淆顶层 `function foo` / `class Bar` 的名字——因为它不知道输出会被注入到其他代码的什么位置（如果是全局作用域可能撞名）。要让 esbuild 安全混淆顶层名，必须满足：

- 启用 bundling（`esbuild.build({...})`）——所有代码在自己的 scope 内
- 或显式设置 `format`（`'iife'` / `'esm'` / `'cjs'`）——告诉 esbuild 输出会被包在 scope 里

```js
await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  minify: true,
  format: 'esm',   // 启用后顶层名也会被 mangle
  outfile: 'out.js',
});
```

### minify 与 target 联动

esbuild 会根据 `target` 决定是否使用现代语法压缩：

```js
// 源码
a === undefined || a === null ? 1 : a;

// target='es2020'（默认）
a ?? 1;

// target='es2015' 不会用 ??，因为 es6 不支持
a == null ? 1 : a;
```

> 要兼容老浏览器必须显式 `target=es6/es2015`，否则 esbuild 会用现代语法（`??`、`?.`）替代旧写法，老浏览器解析失败。

### legalComments：保留 license 合规

| 模式 | 行为 |
| --- | --- |
| `none` | 全删 |
| `inline` | 保留在原位（默认，非 bundling 时） |
| `eof` | 把 license 注释挪到文件尾（默认，bundling 时） |
| `linked` | 生成 `.LEGAL.txt` 链回原文件 |
| `external` | 输出到外部 `.LEGAL.txt` 文件（不写回 bundle） |

> 「legal comment」定义：含 `@license` / `@preserve` 或以 `//!` / `/*!` 开头的注释。npm 依赖的 OSS 许可证必须保留，否则合规风险——默认 `eof` 已足够。

## SWC 详解

SWC（Speedy Web Compiler）是 Rust 写的极速 JS/TS 工具链，是 Next.js / Rspack 的默认 minifier。它的 `jsc.minify` 配置项与 Terser 几乎一一对应，迁移成本低。

### .swcrc 配置

```json
{
  "minify": true,
  "jsc": {
    "minify": {
      "compress": {
        "drop_console": true,
        "drop_debugger": true,
        "ecma": 2020
      },
      "mangle": {
        "keepClassNames": true,
        "keepFnNames": true,
        "topLevel": true
      },
      "format": {
        "comments": "some"
      }
    }
  }
}
```

### 与 Terser 的关键差异

| 选项 | Terser 默认 | SWC 默认 |
| --- | --- | --- |
| `keep_fargs`（保留函数参数） | `true` | `false` |
| `toplevel`（混淆/分析顶层） | `false` | `true` |
| `reduce_funcs`（内联函数） | `true` | `false` |
| `passes` | `1` | `0`（无限循环直到收敛，需配合 compress 谨慎用） |

> SWC 选项命名是 camelCase（`keepClassNames`），Terser 是 snake_case（`keep_classnames`），双别名支持但风格不同。

### 编程式 API

```js
import swc from '@swc/core';

// 异步（推荐，在后台线程跑）
const { code, map } = await swc.minify(code, {
  compress: true,
  mangle: true,
});

// 同步
const { code: c2 } = swc.minifySync(code, { compress: true });
```

### 偷偷替换嵌套依赖的 Terser

如果某个工具（如 webpack 旧版 / vue-loader）写死了 Terser，可用 yarn resolutions 替换为 SWC：

```json
{
  "resolutions": {
    "terser": "npm:@swc/core@1.x"
  }
}
```

> 这是 SWC 官方提供的兼容路径，API 表面兼容 Terser，但部分高级选项（如 `unsafe_*`）可能不完全实现。

## CSS 压缩：lightningcss vs cssnano

CSS 压缩比 JS 简单——主要是去空白、合并选择器、缩短颜色（`#ffffff` → `#fff`）、缩短 `margin: 0px 0px 0px 0px` → `margin:0`。但**降级与前缀**这件事和压缩耦合在一起：lightningcss 一体化处理，cssnano 只压不降级。

### lightningcss（Rust，Vite 7 默认）

```js
import { transform, browserslistToTargets } from 'lightningcss';
import browserslist from 'browserslist';

const targets = browserslistToTargets(browserslist('>= 0.25%'));
const { code, map } = transform({
  code: Buffer.from(cssCode),
  minify: true,
  sourceMap: true,
  targets,             // 关键！按真实浏览器矩阵决定是否保留 vendor prefix
  errorRecovery: true, // 跳过第三方库的无效语法
});
```

CLI：

```bash
lightningcss --minify --bundle --targets ">= 0.25%" input.css -o output.css
```

**核心优势**：

- **一体化**：替代 autoprefixer + postcss-preset-env + cssnano 三件套
- **targets 驱动**：现代浏览器输出无冗余 `-webkit-` 前缀，老浏览器自动补降级
- **Rust 速度**：比 cssnano 快一个数量级
- **降级语法**：自动把 `color: lab(...)` 降级为 `rgb(...)`（如 targets 不支持）

### cssnano（PostCSS 生态）

`postcss.config.js`：

```js
module.exports = {
  plugins: [
    require('cssnano')({
      preset: ['default', {
        discardComments: { removeAll: true },
        svgo: false,   // 关掉某个 transform
      }],
    }),
  ],
};
```

### cssnano preset 系统

| preset | 风格 | 例子 |
| --- | --- | --- |
| `default` | 安全（默认） | 不改语义、不删有用的注释 |
| `advanced` | 激进 | 重写 `calc`、合并长选择器、删更多注释 |
| `lite` | 仅基础 | 只去空白、不优化 |

> advanced preset 可能把 `calc(100% - 10px)` 重写为 `calc(90% + 0px)`（如有解析为同值），需充分测试。

### 选项命名规则

cssnano 的所有选项都去 `postcss-` 前缀并转 camelCase：

| postcss 插件 | cssnano 选项 |
| --- | --- |
| `postcss-discard-comments` | `discardComments` |
| `postcss-normalize-url` | `normalizeUrl` |
| `postcss-reduce-transforms` | `reduceTransforms` |

### 排除单个 transform

```js
preset: ['default', {
  svgo: false,           // 关掉整个
  discardComments: { removeAll: true },  // 配置
}]
```

### lightningcss 与 cssnano 选型

| 维度 | lightningcss | cssnano |
| --- | --- | --- |
| 速度 | 快 10x+ | 慢 |
| 一体化 | 压缩+降级+前缀 | 仅压缩 |
| 生态 | 自带、不依赖 PostCSS | 依赖 PostCSS |
| 灵活性 | 选项少 | 通过 preset + plugin 灵活 |
| Vite 默认 | ✅（Vite 7+） | ✅（Vite 6 及之前） |
| 推荐 | 新项目优先 | 老项目、复杂 PostCSS pipeline 保留 |

> **Vite 7 切换到 lightningcss 后**，`autoprefixer` 不再必需（lightningcss 内置），但 `postcss-preset-env` 的部分现代语法降级功能 lightningcss 不能完全替代，需评估。

## HTML 压缩：html-minifier-terser

`html-minifier-terser` 是 `html-minifier` 的 Terser 维护分支（原 `html-minifier` 已停滞），v7.2.0 是当前稳定版。**最大坑：默认所有选项全部关闭**，必须显式开启。

### 编程式 API

```js
import { minify } from 'html-minifier-terser';
const result = await minify(html, {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,
  removeOptionalTags: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  sortAttributes: true,
  sortClassName: true,
  minifyCSS: true,   // 用 clean-css
  minifyJS: true,    // 用 Terser
  minifyURLs: true,  // 用 relateurl
  html5: true,
  decodeEntities: true,
});
```

### 核心选项

| 选项 | 作用 |
| --- | --- |
| `collapseWhitespace` | 折叠标签间空白（必开） |
| `conservativeCollapse` | 配合 `collapseWhitespace`，保留 inline 元素间单空格（避免 `<span>a</span> <span>b</span>` 变 `ab`） |
| `collapseInlineTagWhitespace` | inline 标签间也去空白（更激进，可能影响布局） |
| `removeComments` | 删 HTML 注释 |
| `removeEmptyAttributes` | 删 `style=""` 等空属性 |
| `removeRedundantAttributes` | 删冗余（如 `<input type="text">` 的 `type="text"`，text 是默认值） |
| `removeOptionalTags` | 删可省的标签（如 `</html>` `</head>` `</body>` `</li>` `</td>`） |
| `useShortDoctype` | `<!DOCTYPE html>` → `<!doctype html>` |
| `removeScriptTypeAttributes` | 删 `<script type="text/javascript">` 的 type |
| `removeStyleLinkTypeAttributes` | 删 `<style>` `<link>` 的 type |
| `sortAttributes` | 排序属性（gzip 友好） |
| `sortClassName` | 排序 class（gzip 友好） |
| `minifyCSS` | 用 clean-css 压内联 CSS |
| `minifyJS` | 用 Terser 压内联 JS |
| `minifyURLs` | 用 relateurl 缩 URL |
| `processConditionalComments` | 处理 IE 条件注释（如不需要别开） |

> **conservativeCollapse 与 collapseWhitespace 必须配合使用**——单独开 `collapseWhitespace: true` 会让 inline 元素间意外去空格，导致 `<span>hello</span> <span>world</span>` 变成 `helloworld`。

### 应用场景

- **SSG 静态站**（VitePress、Docusaurus、Astro 输出）
- **SSR 渲染**（Next.js `next export`、Nuxt `nuxi generate`）
- **邮件模板**（HTML 邮件体积敏感）
- **托管页面**（GitHub Pages、企业官网）

## Vite 7 配置详解

`vite.config.ts`：

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // JS 压缩器
    minify: 'oxc',              // 默认（Vite 7+）；可选 'terser' | 'esbuild'(deprecated) | false
    // CSS 压缩器
    cssMinify: 'lightningcss',  // 默认；可选 'esbuild' | false
    // 当 minify='terser' 时透传 Terser 选项
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        keep_classnames: /^MyComponent/,  // 保留以 MyComponent 开头的类名
      },
      format: {
        comments: false,  // 删所有注释（注意 OSS 合规）
      },
      maxWorkers: 4,  // Vite 额外选项，限制 worker 数
    },
    // CSS 目标（可独立于 JS target）
    cssTarget: 'chrome61',  // 如 Android 微信 webview 支持 JS 现代特性但不支持 #RGBA
    // source map
    sourcemap: 'hidden',    // 上报错误监控但不上 map 暴露源码
    // chunk 大小警告（默认 500KB，未压缩值）
    chunkSizeWarningLimit: 1000,
    // 报 gzip 大小（大项目可关掉提速）
    reportCompressedSize: true,
    // lib 模式警告
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
  },
  css: {
    transformer: 'lightningcss',  // 启用 lightningcss 替代 PostCSS（同时做压缩）
  },
});
```

### lib 模式不 minify whitespace 的原因

Vite 文档明确警告：lib 模式默认用 `'es'` format 不 minify whitespace——因为 minify 会破坏 tree-shaking 的 `pure` 注释（`/*#__PURE__*/`），导致消费者无法 tree shake 你的库。

```ts
// 错误：lib 模式强制 minify whitespace
build: {
  lib: { ... },
  minify: 'esbuild',  // 会破坏 pure 注释！
}

// 正确：lib 模式用默认（不 minify whitespace），仅 mangle identifiers
build: {
  lib: { ... },
  // minify 默认即可，不要强制开 whitespace minify
}
```

### SSR 关闭 minify 的原因

SSR 输出跑在 Node 服务器上，不需要下载——压缩只会拖慢构建速度、干扰调试。Vite 默认 `build.minify=false`（SSR）。

## Webpack 5 配置详解

`webpack.config.js`：

```js
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin');

module.exports = {
  mode: 'production',  // 自动开 minimize
  optimization: {
    minimize: true,    // 显式开关
    minimizer: [
      // JS（必须显式加，否则被覆盖）
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: true, passes: 2 },
          mangle: { keep_classnames: true, keep_fnames: true },
          format: { comments: /^!|@license|@preserve/i },
        },
        extractComments: 'extract-comments.txt',  // 把 license 抽出到外部文件
        parallel: true,  // 多进程
      }),
      // CSS（不内置，必须手动加）
      new CssMinimizerPlugin({
        minify: [CssMinimizerPlugin.lightningCssMinify],  // Vite 7+ 风格
        minimizerOptions: {
          targets: { chrome: 111, firefox: 114, safari: 16 },
        },
      }),
      // HTML（如打包 HTML 文件）
      new HtmlMinimizerPlugin({
        minimizerOptions: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          removeComments: true,
        },
      }),
    ],
  },
  // source map
  devtool: 'hidden-source-map',
  performance: {
    maxAssetSize: 250_000,    // 250KB
    maxEntrypointAssetSize: 250_000,
    hints: 'warning',
  },
};
```

### Webpack 大坑：minimizer 覆盖默认

```js
// 错误：只加 CssMinimizerPlugin 会丢掉 JS 压缩
optimization: {
  minimizer: [new CssMinimizerPlugin()],
}

// 正确：必须显式 [TerserPlugin, CssMinimizerPlugin] 双列
optimization: {
  minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
}
```

> **原因**：Webpack 5 的 `optimization.minimizer` 一旦写入任何 plugin 就**整体覆盖**内置默认 `[TerserPlugin]`，没有「merge」机制。这是社区最常见的「以为加了压缩结果没生效」的坑。

### 其他 minimizer 插件

- `HtmlMinimizerWebpackPlugin`：HTML
- `JsonMinimizerWebpackPlugin`：JSON（如 i18n 文件）
- `ImageMinimizerWebpackPlugin`：图片（imagemin）
- `CompressionWebpackPlugin`：生成 gzip/brotli 静态文件（归网络优化）

## source map 与 mangle 协作

生产 source map 用 `'hidden'`（Vite `build.sourcemap:'hidden'`、Webpack `devtool:'hidden-source-map'`）——上传到错误监控服务（Sentry / Rollbar）但不在浏览器 Network 暴露 map 链接，避免源码泄露。

mangle 后错误栈是 `a/b/c` 形态，必须靠 source map 还原：

```
原始栈：    at a (chunk-abc.js:1:2345)
map 还原：  at handleClick (src/components/Button.tsx:42:5)
```

> 所有主流 minifier（Terser / esbuild / SWC / Oxc）都支持 sourcemap 输出，但开启会略微增加构建时间（约 5~15%）。

## 压缩 vs 格式化（生产反操作）

| 阶段 | 操作 | 工具 |
| --- | --- | --- |
| 开发 | 格式化（美化） | Prettier、ESLint --fix |
| 开发 | readable source map | eval-source-map |
| 生产 | 压缩（反格式化） | Terser / esbuild / SWC |
| 生产 | hidden source map | 上报到监控，不暴露 |

> **关键认知**：格式化和压缩是**互为反操作**——开发期格式化让代码可读、生产期压缩让产物变小，两者目标相反但都必要。**不要在生产保留 Prettier 风格的代码**——那是浪费体积。

## 量化压缩效果

别凭感觉，用工具量化：

- **esbuild metafile**：`esbuild --metafile=meta.json`，可视化 bundle 构成
- **webpack-bundle-analyzer**：`webpack --profile --json > stats.json`，配合 analyzer UI
- **Vite build.reportCompressedSize**（默认 true）：报 gzip 大小，大项目可关掉提速
- **size-limit**：CI 防体积回归
- **bundlephobia / Bundlephobia**：评估 npm 包加入后的体积影响

> 注意 chunk 大小默认值（Webpack `performance.maxAssetSize=250000`、Vite `chunkSizeWarningLimit=500`）都是**未压缩**值，不是用户实际下载的 gzip 大小。

## 反模式（避坑）

- **开发期开压缩**：mangle 干扰调试栈，开发必须关。Vite 默认 SSR `minify=false`、Webpack `mode='development'` 默认 minimize=false
- **依赖 `.name` 不开 keep**：AngularJS（用 `toString()` 读参数名）、MobX、styled-components 等场景不开 `keep_classnames/keep_fnames` 会运行时崩
- **`unsafe_*` 不测**：`unsafe_math` 可能改浮点结果、`unsafe_comps` 改比较语义，开极限档必须充分回归
- **Webpack 加 minimizer 不显式 TerserPlugin**：会被整体覆盖，JS 不压缩
- **lib 模式强制 minify whitespace**：破坏 `/*#__PURE__*/` 注释，消费者无法 tree shake
- **esbuild mangleProps 乱用**：会破坏 DOM API、JSON 序列化、第三方库内部约定
- **esbuild 不设 target**：会用现代语法（`??`、`?.`）替代旧写法，老浏览器解析失败
- **lightningcss 不配 targets**：会输出冗余 `-webkit-` 前缀（如目标是现代浏览器）或漏降级（如目标是老浏览器）
- **html-minifier-terser 只开 collapseWhitespace**：会丢 inline 元素间空格，必须配 `conservativeCollapse:true`
- **删 license 注释**：OSS 合规风险，必须 `legalComments:'eof'`（esbuild）或 `format.comments:'some'`（Terser）
- **混淆 gzip 与压缩**：压缩是源码改写、gzip 是字节流编码，两层正交且叠加；不要「已开 gzip 就不压缩」
- **混淆压缩与 tree shaking**：tree shaking 是打包期 DCE，与 `compress.dead_code`/`unused` 概念相邻但是打包器职责
- **凭感觉估压缩率**：用 esbuild metafile / webpack-bundle-analyzer / size-limit 量化
- **生产保留 Prettier 风格**：浪费体积，生产必须压缩

## 下一步

- [参考](./reference.md)：压缩器对比表、配置项清单、版本与链接
