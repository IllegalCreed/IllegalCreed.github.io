---
layout: doc
---

# SWC

SWC（**Speedy Web Compiler**）是用 **Rust** 编写的可扩展编译平台，官方自我定义为「an extensible Rust-based platform for the next generation of fast developer tools」。它对 JavaScript / TypeScript / JSX 源码做**转译（transpile）+ 压缩（minify）**，并附带实验性的打包能力（spack），核心卖点是**快**——官方称「20x faster than Babel on a single thread and 70x faster on four cores」。和 esbuild 一样，它是 Babel 在「剥类型 + 降级语法」这件事上的「drop-in replacement」，但**不做类型检查**：官方明确「SWC only transpiles the code and doesn't perform type checking」「SWC works on file-by-file, so any code transforms that depend on understanding the full type system will not work」，因此推荐继续用 `tsc --noEmit` 把关类型。它由 `.swcrc` 驱动，核心配置围绕 **jsc.parser（语法）/ jsc.target（降级目标）/ module.type（模块格式）/ minify（压缩）** 展开，并通过 **Wasm 插件**机制开放扩展。SWC 已被生态深度内置：**Next.js 编译器、Parcel、Deno、@swc/jest、Rspack / Rsbuild 的 swc-loader** 都建立其上；`@swc/core` 长期停留在 1.x（2026-06 为 **1.15.x**）。

## 评价

**优点**

- **极快**：Rust 实现、原生并行，官方称单线程比 Babel 快约 20×、四核约 70×，是它取代 Babel 做 emit 的根本动因
- **Babel 的 drop-in 替代**：CLI「designed to be a drop-in replacement for Babel」，迁移成本低，能直接接管「剥类型 + 降级语法」
- **生态深度内置**：Next.js 内置编译器、Parcel、Deno、`@swc/jest`、Rspack / Rsbuild 的 `swc-loader` 都基于 SWC，落地面广
- **配置精简**：一份 `.swcrc` 即可覆盖语法、目标、模块格式、压缩，且「works out of the box」，无需像 Babel 那样堆插件
- **Wasm 插件可扩展**：用 Rust 写 `VisitMut` 访问器即可扩展编译行为，性能远胜 JS 插件
- **转译 + 压缩一体**：内置 Terser 兼容的 minify（compress / mangle / format），一个工具完成降级与压缩
- **官方与社区活跃**：由 Vercel 支持、字节等大厂深度使用，紧跟 ECMAScript 与 TypeScript 语法

**缺点**

- **不做类型检查**：file-by-file 逐文件转译，看不到完整类型系统，类型错误它照样放行，必须另配 `tsc --noEmit`
- **Wasm 插件无向后兼容**：官方明示「Currently, the Wasm plugins are not backwards compatible」，插件的 `swc_core` 必须严格匹配宿主 `@swc/core` 的 ABI，升级即可能断裂
- **打包（spack/bundle）不成熟**：bundle 能力长期实验状态，生产打包仍需交给 Webpack(swc-loader) / Rspack / Rollup / Vite
- **file-by-file 的语义坑**：`const enum`、`namespace` 等依赖跨文件信息的 TS 特性在逐文件模型下行为受限
- **配置项语义微妙**：`jsc.target` 与 `env` 互斥、装饰器需多个开关联动、`importInterop` 等配错产物行为会变
- **插件生态弱于 Babel**：成熟插件数量、文档完备度与 Babel 仍有差距，复杂转换有时缺现成方案

## 文档地址

[SWC](https://swc.rs/)

## GitHub 地址

[swc-project/swc](https://github.com/swc-project/swc)

## 幻灯片地址

<a href="/SlideStack/swc-slide/" target="_blank">SWC</a>
