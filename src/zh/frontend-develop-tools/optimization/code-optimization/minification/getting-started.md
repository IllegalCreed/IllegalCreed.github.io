---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Terser / esbuild / SWC / lightningcss / cssnano / html-minifier-terser 官方文档编写，对照 Vite 7 / Webpack 5 稳定版行为

## 速查

- **代码压缩定义**：构建期对源码做**语法等价改写**减小体积（移除空白·缩短变量·重写更紧凑语法），不改运行时行为
- **三轴收益**：去注释空白（whitespace）/ 重命名局部标识符（mangle identifiers）/ 重写更紧凑语法（syntax：`true` → `!0`、合并条件、`a===undefined||a===null?1:a` → `a??1`）
- **三大 JS 压缩器**：**Terser**（压缩率标杆，Webpack 默认）/ **esbuild**（最快通用，Go）/ **SWC**（Rust，Next.js/Rspack 默认）/ **Oxc**（Vite 7 默认，Rust，比 terser 快 30~90x）
- **CSS 压缩**：**lightningcss**（Rust，Vite 7 默认，同时做降级+前缀）/ **cssnano**（PostCSS 生态，慢但稳）
- **HTML 压缩**：**html-minifier-terser**（默认全关需显式开启 `collapseWhitespace` / `removeComments` / `minifyJS`）
- **生产开 / 开发关**：esbuild 官方原话「minified code downloads faster but is harder to debug」
- **Vite 7 默认**：`build.minify='oxc'`、`build.cssMinify='lightningcss'`、SSR `build.minify=false`
- **Webpack 5 默认**：`optimization.minimize=true`（仅 production），JS 用 terser-webpack-plugin，CSS 需手动加 CssMinimizerPlugin
- **mangle 默认开**：Terser `mangle:true` / esbuild `minifyIdentifiers` 默认 true / SWC `mangle:true`
- **边界**：HTTP 传输压缩（gzip/brotli）归【网络优化】叶，本叶只讲构建期源码压缩

## 代码压缩是什么

代码压缩（Minification）是**构建期**对 JS / CSS / HTML 源码做**语法等价改写**以减小产物体积的过程——所有改写都不改变运行时语义，只是把源码换一种等价但更短的写法。它和以下概念易混淆但本质不同：

| 概念 | 阶段 | 干什么 |
| --- | --- | --- |
| **压缩（Minification）** | 构建期 | 源码等价改写减体积，输出仍是 JS/CSS/HTML |
| **传输压缩（gzip/brotli）** | 传输层 | 字节流编码再解码，浏览器自动解压 |
| **Tree shaking** | 打包期 | 删除未引用的导出，DCE |
| **格式化（Prettier）** | 开发期 | 美化代码可读性，**生产时反操作** |
| **转译降级（Babel/swc）** | 编译期 | 把新语法降为旧语法以兼容老浏览器 |
| **混淆（Obfuscation）** | 构建期 | 故意让人读不懂（控制流扁平化、字符串加密），与压缩目标不同 |

> 压缩 vs 传输压缩：两者正交且叠加。100KB JS 源码 → 压缩后 70KB → gzip 后 25KB。两层都开才是完整收益。

## 为何要压缩

- **下载更快**：体积小直接省下载时间，对移动网络 / 弱网尤其明显
- **解析与编译更快**：JS 引擎解析时间与代码字节数正相关，更短的源码 parse 更快
- **节省带宽成本**：CDN 流量、服务器带宽都是钱，压缩后乘以 QPS 收益可观
- **缓存友好**：更小的 bundle 利于浏览器 / CDN 缓存命中
- **SEO 间接加分**：性能优化间接影响搜索排名（Core Web Vitals 是排序信号）

> esbuild 官方原话：minified code downloads faster but is harder to debug. Usually you minify code in production but not in development.

## 三大压缩器速览

| 工具 | 语言 | 默认集成 | 压缩率 | 速度 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| **Terser** | JS | Webpack 5 默认 | 标杆（最高） | 慢（分钟级） | 追求极限压缩比、复杂 pure_funcs |
| **esbuild** | Go | 通用 | 略低于 Terser 0.5~2% | 极快（秒级） | Vite 旧版 / 通用最快构建 |
| **SWC** | Rust | Next.js / Rspack | 接近 Terser | 快（秒级） | Next.js、Rspack 项目 |
| **Oxc** | Rust | Vite 7 默认 | 接近 esbuild | 极快（30~90x terser） | Vite 7+ 项目，已替代 esbuild |
| **lightningcss** | Rust | Vite 7 CSS 默认 | 接近 cssnano | 快（10x cssnano） | CSS 压缩 + 降级 + 前缀一体化 |
| **cssnano** | JS（PostCSS） | 旧项目 CSS 默认 | 安全档接近 lightningcss | 慢 | PostCSS 生态、保守项目 |
| **html-minifier-terser** | JS | HTML 单独跑 | 取决于选项 | 中 | SSG / 静态 HTML 后处理 |

> **选型一句话**：Vite 7+ 项目零配置即得最优（Oxc + lightningcss）；Webpack 项目锁 Terser（JS）+ CssMinimizer（CSS）；Next.js/Rspack 锁 SWC；追求极限压缩比再回退 Terser + `passes:2~3` + `unsafe_*`。

## 压缩做什么

### 去空白与注释（whitespace）

最小粒度的压缩——所有 minifier 都做：

```js
// 源码
function add(a, b) {
  // 这是一个加法
  return a + b;
}

// 压缩后
function add(a,b){return a+b}
```

### 重命名局部标识符（mangle）

把长变量名换成短名（`a`、`b`、`c`…），作用域越深收益越大：

```js
// 源码
function calculateTotalPrice(productList, discountRate) {
  return productList.reduce((sum, item) => sum + item.price, 0) * (1 - discountRate);
}

// 压缩后
function calculateTotalPrice(a,b){return a.reduce((c,d)=>c+d.price,0)*(1-b)}
```

> **注意**：顶层函数名 `calculateTotalPrice` 没被 mangle——esbuild 默认不混淆顶层声明名（不知道输出会被注入到何处）；要混淆顶层需启用 bundling 或显式 format 设置。

### 重写更紧凑语法（syntax）

把等价但更短的语法换上：

```js
// 源码                              // 压缩后
true                                  // !0
false                                 // !1
if (a) { return b; } return c;        // return a?b:c;
const arr = [1, 2, 3];                // const t=[1,2,3];
a === undefined || a === null ? 1 : a // a??1   (需 target 支持 ??)
obj.x === undefined ? 'default' : obj.x // obj.x??"default"
```

> esbuild 的 `minifySyntax` 与 `target` 联动——会用现代语法（`??`、`?.`）替代旧写法，要兼容老浏览器需配 `--target=es6`。

## Vite / Webpack 默认行为

### Vite 7 默认配置

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `build.minify` | `'oxc'`（client）/ `false`（SSR） | `'oxc'` 是新默认，`'esbuild'` 已 deprecated |
| `build.cssMinify` | `'lightningcss'` | 当 `build.minify` 关闭时 client 也变 `false` |
| `build.terserOptions` | `{}` | 仅当 `build.minify='terser'` 时生效 |
| `build.target` | `'baseline-widely-available'` | `['chrome111','edge111','firefox114','safari16.4','ios16.4']` |
| `build.sourcemap` | `false` | 用 `'hidden'` 上报错误监控但不上 map 暴露源码 |

### Webpack 5 默认配置

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `optimization.minimize` | `true`（production）/ `false`（development） | 显式开关 |
| `optimization.minimizer` | `[new TerserPlugin(...)]` | 内置仅 JS，CSS 不内置 |
| `mode: 'production'` | 自动开 minimize | `mode: 'development'` 自动关 |
| `devtool` | `'eval-cheap-module-source-map'`（dev）/ `'eval'` | 生产推荐 `'hidden-source-map'` |

> **Webpack 大坑**：往 `optimization.minimizer` 数组加任何 plugin 会**整体覆盖**默认 TerserPlugin，必须显式 `[new TerserPlugin(), new CssMinimizerPlugin()]` 双列，否则 JS 不压缩。

## 一句话上手

**Vite 项目**——默认即开压缩，无需配置：

```bash
pnpm build   # 自动 Oxc（JS）+ lightningcss（CSS）
```

**Webpack 项目**——确认 production 模式：

```bash
webpack --mode=production   # 自动 TerserPlugin（JS）
```

**手动跑压缩**（脚本场景）：

```js
// Terser
import { minify } from 'terser';
const { code } = await minify(jsCode, {
  compress: { drop_console: true, passes: 2 },
  mangle: true,
  format: { comments: false },
});

// esbuild
import esbuild from 'esbuild';
const { code } = await esbuild.transform(jsCode, { minify: true });

// lightningcss
import { transform } from 'lightningcss';
const { code } = transform({
  code: Buffer.from(cssCode),
  minify: true,
  sourceMap: true,
});
```

## 下一步

- [核心原理与配置](./guide-line.md)：Terser/esbuild/swc 深度对比、CSS lightningcss/cssnano、HTML 压缩、Vite/Webpack 配置、mangle、反模式
- [参考](./reference.md)：压缩器对比表、配置项清单、版本与链接
