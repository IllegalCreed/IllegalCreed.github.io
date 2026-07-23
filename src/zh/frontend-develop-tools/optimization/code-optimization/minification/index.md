---
layout: doc
---

# 代码压缩

代码压缩（Minification）是**构建期对源码做语法等价改写以减小产物体积**的过程：移除注释与空白、缩短局部变量名、把语法重写为更紧凑的等价形态（`true` → `!0`、长串布尔表达式合并、`if (a) return b; return c;` → `return a ? b : c;`）。它与传输压缩（gzip / brotli）正交——压缩后的 JS 在传输层再 gzip 还能再小 70% 以上，两层独立且叠加生效。压缩主要发生在 JS / CSS / HTML 三类资源上，分别由 Terser、esbuild minify、SWC minify、lightningcss、cssnano、html-minifier-terser 等工具负责，Vite / Webpack / Rspack 在生产构建时通过 `build.minify` / `optimization.minimizer` 调用它们。当前（2026-07）工具链正在向 Rust 实现迁移：Vite 7 客户端默认 Oxc Minifier（比 Terser 快 30~90x，压缩率仅差 0.5~2%），CSS 默认 lightningcss（同时做压缩 + vendor prefix + 语法降级，替代 autoprefixer + postcss-preset-env + cssnano 三件套）；Terser 5.x 仍是压缩率标杆，是 Webpack 5 默认 minimizer 与 Vite 可选项；esbuild 0.25+ 与 swc 1.x 持续稳定维护。压缩与 tree shaking、source map、格式化（Prettier）概念相邻但相互独立——压缩改产物体积、tree shaking 改死代码、source map 还原调试栈、Prettier 是开发期美化（生产时反操作）。

## 评价

**优点**

- **零运行时成本**：构建期一次改写，运行时行为不变，纯静态收益
- **与传输压缩叠加**：先源码压缩再 gzip/brotli，两层乘性收益（典型 JS 能从原始 100KB → 压缩 70KB → gzip 25KB）
- **工具链成熟**：Terser/esbuild/swc/lightningcss 都经千万项目验证，配置项稳定
- **Rust 化后基本无瓶颈**：Oxc/lightningcss 把压缩从分钟级降到秒级，不再是构建热点
- **与 tree shaking / format 联动**：`pure_funcs` / `sideEffects:false` / `legalComments` 等机制把 DCE、合规、压缩三者合一
- **可分阶段调质量**：`compress.passes` 1~3 档、`unsafe_*` 极限档、Fast Minify Mode（只 mangle+去空白）三档可按场景选

**缺点**

- **mangle 干扰调试**：压缩后错误栈是 `a/b/c`，离开 source map 几乎不可读；开发期必须关
- **`.name` 反射依赖会崩**：AngularJS 用 `toString()` 读参数名、MobX/styled-components 用 `.name` 注册——必须显式 `keep_classnames` / `keepNames`，否则运行时错乱
- **`unsafe_*` 有语义风险**：`unsafe_math` 可能改浮点结果、`unsafe_comps` 改比较语义，需要充分回归测试
- **Webpack minimizer 覆盖坑**：往 `optimization.minimizer` 加任何 plugin 都会覆盖默认 TerserPlugin，必须显式 `new TerserPlugin()` 加回
- **`build.minify:'esbuild'` 已 deprecated**：Vite 7 默认改 Oxc，旧项目迁移需注意
- **lib 模式不 minify whitespace**：会破坏 tree-shaking 的 `pure` 注释（Vite 文档明确警告）
- **CSS lightningcss 配 targets 才省前缀**：不配 `browserslistToTargets` 会输出冗余 `-webkit-` 前缀

## 文档地址

- [Terser 官方选项](https://terser.org/docs/options/) · [Terser API 参考](https://terser.org/docs/api-reference/)
- [esbuild API - Minify](https://esbuild.github.io/api/#minify)
- [SWC Minifier 配置](https://swc.rs/docs/configuration/minification)
- [Lightning CSS 文档](https://lightningcss.dev/docs.html) · [Vite 7 Build Options](https://vite.dev/config/build-options)
- [cssnano Presets](https://cssnano.github.io/cssnano/docs/presets/) · [html-minifier-terser](https://terser.org/html-minifier-terser/)

## GitHub地址

[terser/terser](https://github.com/terser/terser) · [evanw/esbuild](https://github.com/evanw/esbuild) · [swc-project/swc](https://github.com/swc-project/swc) · [parcel-bundler/lightningcss](https://github.com/parcel-bundler/lightningcss) · [cssnano/cssnano](https://github.com/cssnano/cssnano) · [terser/html-minifier-terser](https://github.com/terser/html-minifier-terser)

## 幻灯片地址

<a href="/SlideStack/minification-slide/" target="_blank">代码压缩</a>

## 测试题


<a href="https://quiz.illegalscreed.cn/?category=679" target="_blank" rel="noopener noreferrer">代码压缩 测试题</a>

## 相关概念

- **网络优化（HTTP 传输压缩）**：gzip / brotli / zstd，传输层字节流再编码，归网络优化叶；与本叶正交叠加
- **Tree shaking / 打包优化**：打包期死代码消除，与 `compress.dead_code` / `unused` 概念相邻但是打包器职责
- **Source Map**：mangle 后错误栈还原的唯一手段，归 Source Map 叶
- **资源优化**：图片 / 字体压缩，与本叶 JS/CSS/HTML 源码压缩不同范畴
- **CSS 降级与 Autoprefixer**：lightningcss 同时做 minify + 降级，本叶只讲 minify 部分

## 工具链选型一句话

- **Vite 7+**：默认 Oxc（JS）+ lightningcss（CSS），无需配置即得 90% 收益
- **Webpack 5**：默认 terser-webpack-plugin（JS），CSS 需手动加 CssMinimizerPlugin
- **Next.js / Rspack**：默认 SWC（JS），CSS 走 lightningcss 或 cssnano
- **追求极限压缩比**：Terser + `passes:2~3` + `unsafe_*`（需充分回归测试）
- **追求最快构建**：esbuild minify 或 Oxc（Fast Minify Mode 只去空白+mangle）

## 学习路径

- [入门](./getting-started.md)：定位、为何压缩、三大压缩器速览
- [核心原理与配置](./guide-line.md)：Terser/esbuild/swc 对比、CSS lightningcss/cssnano、HTML 压缩、Vite/Webpack 配置、mangle、反模式
- [参考](./reference.md)：压缩器对比表、配置项清单、版本与链接
