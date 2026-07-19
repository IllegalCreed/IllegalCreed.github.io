---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Terser / esbuild / SWC / lightningcss / cssnano / html-minifier-terser 官方文档编写，对照 Vite 7 / Webpack 5 稳定版

## 速查

- **JS 三压缩器**：Terser（标杆）/ esbuild（Go，最快通用）/ SWC（Rust，Next.js/Rspack）/ Oxc（Vite 7 默认，比 terser 快 30~90x）
- **mangle 默认**：Terser `mangle:true` / esbuild `minifyIdentifiers:true` / SWC `mangle:true`
- **keep names**：Terser `keep_classnames:true`+`keep_fnames:true` / esbuild `keepNames:true` / SWC `mangle.keepClassNames:true`+`keepFnNames:true`
- **CSS**：lightningcss（Rust，Vite 7 默认，一体化）/ cssnano（PostCSS，preset 系统）
- **HTML**：html-minifier-terser（默认全关需显式开启）
- **Vite 7**：`build.minify='oxc'`、`build.cssMinify='lightningcss'`、SSR `build.minify=false`
- **Webpack 5**：`optimization.minimize=true`（仅 production），内置 TerserPlugin，CSS 必须手动加
- **legalComments**：esbuild 五种（none/inline/eof/linked/external）
- **生产开 / 开发关**：mangle 干扰调试
- **边界**：HTTP gzip/brotli 归【网络优化】叶
- 完整说明见 [入门](./getting-started.md) / [核心原理与配置](./guide-line.md)

## JS 压缩器对比表

| 维度 | Terser | esbuild | SWC | Oxc |
| --- | --- | --- | --- | --- |
| **语言** | JS | Go | Rust | Rust |
| **默认集成** | Webpack 5 | Vite 6 及之前 | Next.js / Rspack | Vite 7+ |
| **压缩率** | 标杆（最高） | 略低 0.5~2% | 接近 Terser | 接近 esbuild |
| **速度** | 慢（分钟级） | 极快（秒级） | 快（秒级） | 极快（30~90x terser） |
| **compress 选项** | 完整 | 子集 | 几乎一一对应 Terser | Terser 子集 |
| **mangle** | `mangle:true` | `minifyIdentifiers:true` | `mangle:true` | 内置 |
| **keep names** | `keep_classnames`+`keep_fnames` | `keepNames` | `mangle.keepClassNames`+`keepFnNames` | 内置 |
| **drop_console** | `compress.drop_console` | `drop:['console']` | `compress.drop_console` | 支持 |
| **pure_funcs** | `compress.pure_funcs` | `pure:['fn']` | `compress.pure_funcs` | 支持 |
| **passes** | `compress.passes` | 单次 | `compress.passes`（0=无限） | 单次 |
| **API** | `minify(code, opts)` | `esbuild.transform/build` | `swc.minify/minifySync` | 内置 |
| **legalComments** | `format.comments` | `legalComments` | `format.comments` | 支持 |

## Terser 完整选项清单

### compress 子选项

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `arrows` | `true` | 转换 `function() {}` 为 `() => {}`（需 ecma≥2015） |
| `booleans` | `true` | 优化布尔（`true` → `!0`） |
| `collapse_vars` | `true` | 内联单次使用变量 |
| `comparisons` | `true` | 优化比较（`a === b` vs `a == b`） |
| `computed_props` | `true` | `obj['foo']` → `obj.foo` |
| `conditionals` | `true` | 优化条件表达式 |
| `dead_code` | `true` | 删不可达 |
| `drop_console` | `false`（可传数组） | 删 `console.*` |
| `drop_debugger` | `true` | 删 `debugger` |
| `ecma` | `5` | 传 `2015+` 启用 ES6+ 形态 |
| `evaluate` | `true` | 常量折叠 |
| `hoist_funs` | `false` | 函数声明上提 |
| `hoist_props` | `true` | 把常量对象属性提到顶层 |
| `hoist_vars` | `false` | 变量声明上提 |
| `if_return` | `true` | `if (a) return b; return c;` → `return a?b:c;` |
| `inline` | `1` | 函数内联（0/1/2/3） |
| `join_vars` | `true` | 合并 var 声明 |
| `keep_classnames` | `false`（可正则） | 保留类名 |
| `keep_fargs` | `true` | 保留未用函数参数 |
| `keep_fnames` | `false`（可正则） | 保留函数名 |
| `keep_infinity` | `false` | 不把 `Infinity` 转 `1/0` |
| `loops` | `true` | 优化循环 |
| `negate_iife` | `true` | 否定 IIFE 让 compress 更激进 |
| `passes` | `1` | 多次扫描（建议 2~3） |
| `properties` | `true` | `obj['foo']` → `obj.foo` |
| `pure_funcs` | `[]` | 标记无副作用函数 |
| `pure_getters` | `false`（可传 `'strict'`） | 假设属性访问无副作用 |
| `reduce_funcs` | `true` | 内联单次用函数 |
| `reduce_vars` | `true` | 优化单次用变量 |
| `sequences` | `true`（可传数字限制） | 用 `,` 合并语句 |
| `side_effects` | `true` | 删无副作用表达式 |
| `switches` | `true` | 优化 switch |
| `toplevel` | `false` | 顶层变量也压缩 |
| `top_retain` | `null` | 排除特定顶层 |
| `typeofs` | `true` | 优化 typeof |
| `unsafe` | `false` | 启用所有 unsafe_* |
| `unsafe_arrows` | `false` | 函数转箭头 |
| `unsafe_comps` | `false` | 改比较语义 |
| `unsafe_Function` | `false` | 优化 `new Function` |
| `unsafe_math` | `false` | 优化数学（可能改浮点） |
| `unsafe_methods` | `false` | `Object.assign` → `{...a, ...b}` |
| `unsafe_proto` | `false` | 重写原型访问 |
| `unsafe_regexp` | `false` | 把 RegExp 转字符串 |
| `unsafe_symbols` | `false` | Symbol 转字符串 |
| `unsafe_undefined` | `false` | 用 void 0 替 undefined |
| `unused` | `true` | 删未引用 |

### mangle 子选项

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `eval` | `false` | 在 eval 作用域也 mangle |
| `keep_classnames` | `false`（可正则） | 保留类名 |
| `keep_fnames` | `false`（可正则） | 保留函数名 |
| `module` | `false` | ES module 模式 |
| `nth_identifier` | 内置 | 提供标识符生成器 |
| `reserved` | `[]` | 排除特定标识符 |
| `safari10` | `false` | Safari 10/11 兼容 |
| `toplevel` | `false` | 顶层也 mangle |
| `properties` | `false` | mangle 属性名（慎用） |

### format 子选项

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `beautify` | `false` | 美化输出 |
| `comments` | `'some'` | 保留 @license/@preserve/`!` 注释 |
| `ecma` | `5` | 输出目标版本 |
| `indent_level` | `4` | 美化缩进 |
| `preamble` | `''` | 前置文本 |
| `preserve_annotations` | `false` | 保留 `/*#__PURE__*/` 等 |
| `quote_keys` | `false` | 总是引号包裹 key |
| `quote_style` | `0` | 引号风格（0最优/1单/2双/3强制） |
| `semicolons` | `true` | 用 `;` 分隔（false 用 `\n`） |
| `wrap_func_args` | `true` | 包裹函数参数 |
| `wrap_iife` | `false` | 包裹 IIFE |

## esbuild 完整选项

### 三合一 minify

```bash
--minify                  # 全开
--minify-whitespace       # 只去空白
--minify-identifiers      # 只重命名
--minify-syntax           # 只重写语法
```

### 关键选项

| 选项 | 作用 |
| --- | --- |
| `--target=` | 浏览器目标，决定语法降级（如 `es6`、`chrome111,firefox114,safari16`） |
| `--keep-names` | 保留函数/类的 `.name` |
| `--drop=` | 删指定标识符（如 `console`、`debugger`） |
| `--pure=` | 标记无副作用函数 |
| `--mangle-props=` | mangle 匹配的属性（正则） |
| `--legal-comments=` | `none`/`inline`/`eof`/`linked`/`external` |
| `--format=` | `iife`/`cjs`/`esm` |
| `--banner=` | 文件头插入 |
| `--footer=` | 文件尾插入 |
| `--sourcemap=` | `true`/`false`/`'external'` |

### 默认 legalComments 行为

- 非 bundling（`transform`）：默认 `inline`
- bundling（`build`）：默认 `eof`

## SWC 完整选项（jsc.minify）

```json
{
  "minify": true,
  "jsc": {
    "minify": {
      "compress": {
        "arguments": false,
        "arrows": true,
        "booleans": true,
        "booleans_as_integers": false,
        "collapse_vars": true,
        "comparisons": true,
        "computed_props": true,
        "conditionals": true,
        "dead_code": true,
        "defaults": true,
        "directives": true,
        "drop_console": false,
        "drop_debugger": true,
        "ecma": 5,
        "evaluate": true,
        "expression": true,
        "hoist_funs": false,
        "hoist_props": true,
        "hoist_vars": false,
        "if_return": true,
        "inline": 1,
        "join_vars": true,
        "keep_classnames": false,
        "keep_fargs": false,
        "keep_fnames": false,
        "keep_infinity": false,
        "loops": true,
        "negate_iife": true,
        "passes": 0,
        "properties": true,
        "pure_funcs": [],
        "pure_getters": false,
        "reduce_funcs": false,
        "reduce_vars": true,
        "sequences": 0,
        "side_effects": true,
        "switches": true,
        "toplevel": true,
        "top_retain": [],
        "typeofs": true,
        "unsafe": false,
        "unsafe_arrows": false,
        "unsafe_comps": false,
        "unsafe_Function": false,
        "unsafe_math": false,
        "unsafe_methods": false,
        "unsafe_proto": false,
        "unsafe_regexp": false,
        "unsafe_symbols": false,
        "unsafe_undefined": false,
        "unused": true
      },
      "mangle": {
        "topLevel": true,
        "keepClassNames": false,
        "keepFnNames": false,
        "keepPrivateProps": false,
        "ie8": false,
        "safari10": false,
        "reserved": []
      },
      "format": {
        "comments": "some",
        "asciiOnly": false,
        "beautify": false,
        "ecma": 5,
        "indentLevel": 4,
        "preamble": "",
        "preserveAnnotations": false,
        "quoteKeys": false,
        "quoteStyle": 0,
        "semicolons": true,
        "shebang": true,
        "wrapFuncArgs": true,
        "wrapIIFE": false,
        "inlineScript": false
      }
    }
  }
}
```

### SWC 与 Terser 关键差异

| 选项 | Terser | SWC |
| --- | --- | --- |
| `keep_fargs` 默认 | `true` | `false` |
| `toplevel` 默认 | `false` | `true` |
| `reduce_funcs` 默认 | `true` | `false` |
| `passes` 默认 | `1` | `0`（无限，需配合谨慎用） |
| 命名风格 | snake_case | camelCase |
| format 大部分选项 | 全实现 | 多为 noop（为兼容 terser 配置） |

## lightningcss 配置速查

### 编程式 API

```js
import { transform, browserslistToTargets, composeVisitors } from 'lightningcss';
import browserslist from 'browserslist';

const { code, map } = transform({
  filename: 'input.css',
  code: Buffer.from(cssCode),
  minify: true,
  sourceMap: true,
  targets: browserslistToTargets(browserslist('>= 0.25%')),
  errorRecovery: true,
  nonStandard: { deepSelectorCombinator: true },
  visitor: { ... },  // 自定义 visitor
  drafts: { customMedia: true, nesting: true },
  unusedSymbols: ['unused-class'],  // 标记 DCE
});
```

### CLI

```bash
lightningcss \
  --minify \
  --bundle \
  --targets ">= 0.25%" \
  --sourcemap \
  input.css \
  -o output.css
```

### targets 写法

```js
// 用 browserslist 字符串
targets: browserslistToTargets(browserslist('>= 0.25%'))

// 显式版本
targets: {
  chrome: 111 << 16,   // 111.0.0
  edge: 111 << 16,
  firefox: 114 << 16,
  safari: 16 << 16 | 4 << 8,  // 16.4
  ios: 16 << 16 | 4 << 8,
}
```

## cssnano 配置速查

### Preset 选择

| preset | 风格 | 用法 |
| --- | --- | --- |
| `default` | 安全（默认） | `preset: 'default'` |
| `advanced` | 激进 | `preset: 'advanced'` |
| `lite` | 仅基础 | `preset: 'lite'` |

### 配置位置（按优先级）

1. `package.json` 的 `cssnano` 字段
2. `cssnano.config.js`
3. `postcss.config.js` 中的 cssnano plugin

### 选项清单

| 选项（去 postcss- 前缀） | 作用 |
| --- | --- |
| `discardComments` | 删注释 |
| `discardDuplicates` | 删重复规则 |
| `discardEmpty` | 删空规则 |
| `discardOverridden` | 删被覆盖的规则 |
| `discardUnused` | 删未使用的规则（需传入 whitelist） |
| `mergeRules` | 合并相同选择器 |
| `mergeMediaQueries` | 合并 media query |
| `minifyFontValues` | 缩写字体值 |
| `minifyGradients` | 缩写渐变 |
| `minifyParams` | 缩写参数 |
| `minifySelectors` | 缩写选择器 |
| `normalizeCharset` | 规范 charset |
| `normalizeDisplayValues` | 规范 display |
| `normalizePositions` | 规范 position |
| `normalizeRepeatStyle` | 规范 repeat |
| `normalizeString` | 规范字符串 |
| `normalizeTimingFunctions` | 规范 timing |
| `normalizeUnicode` | 规范 unicode-range |
| `normalizeUrl` | 规范 url |
| `normalizeWhitespace` | 规范空白 |
| `orderedValues` | 排序属性值 |
| `reduceCalc` | 简化 calc（advanced） |
| `reduceInitial` | 用 initial 替代 |
| `reduceTransforms` | 简化 transform |
| `svgo` | 用 SVGO 压 SVG |
| `uniqueSelectors` | 去重选择器 |

## html-minifier-terser 配置速查

### 完整选项

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `caseSensitive` | `false` | 大小写敏感（XML 模式） |
| `collapseWhitespace` | `false` | 折叠空白（必开） |
| `conservativeCollapse` | `false` | 配合 `collapseWhitespace`，保留单空格 |
| `collapseInlineTagWhitespace` | `false` | inline 标签间也去空白 |
| `decodeEntities` | `false` | 转义字符解码 |
| `html5` | `true` | HTML5 解析 |
| `ignoreCustomComments` | `[]` | 保留指定注释（正则） |
| `ignoreCustomFragments` | `[]` | 保留指定片段（如 PHP） |
| `keepClosingSlash` | `false` | 保留自闭合标签的斜杠（XHTML） |
| `maxLineLength` | `false` | 强制换行（gzip 友好） |
| `minifyCSS` | `false` | 用 clean-css 压内联 CSS |
| `minifyJS` | `false` | 用 Terser 压内联 JS |
| `minifyURLs` | `false` | 用 relateurl 缩 URL |
| `preserveLineBreaks` | `false` | 保留换行 |
| `preventAttributesEscaping` | `false` | 阻止属性转义 |
| `processConditionalComments` | `false` | 处理 IE 条件注释 |
| `processScripts` | `[]` | 压指定 type 的 script 内容（如 `text/ng-template`） |
| `quoteCharacter` | `"` | 引号字符 |
| `removeComments` | `false` | 删注释 |
| `removeEmptyAttributes` | `false` | 删空属性 |
| `removeEmptyElements` | `false` | 删空元素（慎用） |
| `removeOptionalTags` | `false` | 删可省标签 |
| `removeRedundantAttributes` | `false` | 删冗余属性 |
| `removeScriptTypeAttributes` | `false` | 删 script 的 type |
| `removeStyleLinkTypeAttributes` | `false` | 删 style/link 的 type |
| `sortAttributes` | `false` | 排序属性（gzip 友好） |
| `sortClassName` | `false` | 排序 class |
| `trimCustomFragments` | `false` | 修剪自定义片段 |
| `useShortDoctype` | `false` | 短 doctype |

### 推荐生产档

```js
{
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,
  removeOptionalTags: false,  // 谨慎，可能破坏 Vue/React 注释节点
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  sortAttributes: true,
  sortClassName: true,
  minifyCSS: true,
  minifyJS: true,
  html5: true,
  decodeEntities: true,
}
```

## Vite build 选项清单

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `build.minify` | `'oxc'`（client）/ `false`（SSR） | `'oxc'`/`'terser'`/`'esbuild'`(deprecated)/`false` |
| `build.cssMinify` | `'lightningcss'` | `'lightningcss'`/`'esbuild'`/`false` |
| `build.terserOptions` | `{}` | 仅当 `minify='terser'` 生效；额外支持 `maxWorkers` |
| `build.target` | `'baseline-widely-available'` | 或 `string` / `string[]` |
| `build.cssTarget` | 同 `build.target` | 可独立 |
| `build.sourcemap` | `false` | `true`/`'inline'`/`'hidden'` |
| `build.chunkSizeWarningLimit` | `500`（KB，未压缩） | 警告阈值 |
| `build.reportCompressedSize` | `true` | 报 gzip 大小（大项目可关） |
| `build.cssCodeSplit` | `true` | CSS 代码分割 |
| `build.assetsInlineLimit` | `4096`（B） | 内联为 base64 阈值 |
| `build.lib` | `undefined` | 库模式 |
| `build.rollupOptions` | `{}` | 透传 Rollup 选项 |

## Webpack optimization 选项清单

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `optimization.minimize` | `mode==='production'` | 总开关 |
| `optimization.minimizer` | `[TerserPlugin]` | 数组，**写入任何会覆盖默认** |
| `optimization.usedExports` | `true`（prod） | tree shaking 标记 |
| `optimization.sideEffects` | `true`（prod） | 读 package.json sideEffects |
| `optimization.splitChunks` | `{ chunks: 'async' }`（prod） | 代码分割 |
| `optimization.runtimeChunk` | `false` | runtime 分包 |
| `optimization.moduleIds` | `'deterministic'` | 模块 ID 算法 |
| `optimization.chunkIds` | `'deterministic'` | chunk ID 算法 |
| `optimization.nodeEnv` | `mode` | `process.env.NODE_ENV` |
| `optimization.mangleWasmImports` | `false` | WASM import 混淆 |
| `optimization.removeAvailableModules` | `true`（prod） | 删已可用模块 |
| `optimization.removeEmptyChunks` | `true` | 删空 chunk |

## terser-webpack-plugin 选项

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `test` | 所有 `.js`/`.cjs`/`.mjs` | 匹配文件 |
| `include` | 全部 | 包含文件 |
| `exclude` | 无 | 排除文件 |
| `parallel` | `true` | 多进程 |
| `minify` | `TerserPlugin.terserMinify` | 可换 SWC/esbuild：`TerserPlugin.swcMinify`/`TerserPlugin.esbuildMinify` |
| `terserOptions` | 见上 | 透传 Terser |
| `extractComments` | `true`（提取到 LICENSE.txt） | license 注释抽离 |

### 用 SWC 替换 Terser

```js
const TerserPlugin = require('terser-webpack-plugin');

new TerserPlugin({
  minify: TerserPlugin.swcMinify,
  terserOptions: {
    compress: { drop_console: true },
    mangle: true,
  },
})
```

## 版本与运行环境

| 工具 | 当前稳定版 | 状态 |
| --- | --- | --- |
| **Terser** | 5.x | 维护中，仍是 Webpack 5 默认、压缩率标杆 |
| **esbuild** | 0.25+ | 稳定迭代，社区主流 |
| **swc** | 1.x | 持续维护，Next.js/Rspack 默认 |
| **Oxc** | 1.x+ | Vite 7 默认，Rust 工具链 |
| **lightningcss** | 1.x | 逐步取代 cssnano 成主流 |
| **cssnano** | 7.x | 仍维护，基于 PostCSS |
| **html-minifier-terser** | 7.2.0 | html-minifier 的 Terser 维护分支 |
| **Vite** | 7+ | `minify:'oxc'`、`cssMinify:'lightningcss'` |
| **Webpack** | 5.x | terser-webpack-plugin 默认 |
| **Next.js** | 15+ | SWC 默认 |
| **Rspack** | 1.x | SWC 默认 |

### 重大版本变化

- **Vite 7**（2026）：`build.minify` 默认从 `'esbuild'` 改 `'oxc'`，`'esbuild'` 选项 deprecated；`build.cssMinify` 默认从 `'esbuild'` 改 `'lightningcss'`；`build.target` 默认变 `'baseline-widely-available'`
- **Vite 5+**：`build.target` 默认 `'modules'`（原生 ES module）
- **Webpack 5**：内置 terser-webpack-plugin，移除 webpack 4 的 UglifyJS
- **Next.js 12**：从 Babel 切换到 SWC

## 官方资源

- Terser：[文档](https://terser.org/docs/options/) · [API](https://terser.org/docs/api-reference/) · [GitHub](https://github.com/terser/terser)
- esbuild：[文档](https://esbuild.github.io/api/) · [GitHub](https://github.com/evanw/esbuild)
- SWC：[Minifier 文档](https://swc.rs/docs/configuration/minification) · [GitHub](https://github.com/swc-project/swc)
- Oxc：[GitHub](https://github.com/oxc-project/oxc) · [minifier 文档](https://oxc.rs/docs/learn/minifier/introduction)
- lightningcss：[文档](https://lightningcss.dev/docs.html) · [GitHub](https://github.com/parcel-bundler/lightningcss)
- cssnano：[Presets 文档](https://cssnano.github.io/cssnano/docs/presets/) · [GitHub](https://github.com/cssnano/cssnano)
- html-minifier-terser：[文档](https://terser.org/html-minifier-terser/) · [GitHub](https://github.com/terser/html-minifier-terser)
- Vite Build Options：[文档](https://vite.dev/config/build-options)
- Webpack optimization：[文档](https://webpack.js.org/configuration/optimization/)
- terser-webpack-plugin：[文档](https://webpack.js.org/plugins/terser-webpack-plugin/)
- CssMinimizerPlugin：[文档](https://webpack.js.org/plugins/css-minimizer-webpack-plugin/)
- browserslist：[文档](https://browsersl.ist/)
