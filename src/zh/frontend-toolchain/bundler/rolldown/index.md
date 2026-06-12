---
layout: doc
---

# Rolldown

用 **Rust 编写**的 JavaScript/TypeScript 打包器（官方口号 **Blazing Fast Rust-based bundler for JavaScript**），核心设计是「**Rollup 兼容的 API 与插件接口 + esbuild 级的内置功能**」：TS/JSX 转换、语法降级、define/inject、CJS 互操作、模块解析、minify 全部内置，底座是同属 VoidZero 体系的 **Oxc**（parser/transformer/resolver/minifier）。它的首要使命是充当 **Vite 的统一底层打包器**——终结「dev 用 esbuild、build 用 Rollup」的双引擎不一致，同时也是可独立使用的通用打包器。性能与 esbuild 同量级、**比 Rollup 快 10~30 倍**。**2026 年是它的转折年**：1 月进入 1.0 RC（API 冻结），**3 月 12 日 Vite 8 stable 把它设为默认打包器**，**5 月 7 日 Rolldown 1.0 stable 发布**并承诺语义化版本（截至 2026-06 已迭代至 1.1.x）。库打包场景由官方上层工具 **tsdown**（tsup 接班人）承接。

## 评价

**优点**

- **一个引擎统一 Vite 双端**：dev 与 build 同一套解析/转换/互操作语义，「dev 正常、build 才炸」类问题从根上减少
- **Rollup 兼容 API**：配置形态、JS API、插件钩子几乎照搬 Rollup，存量 Rollup/Vite 插件大多直接复用，迁移成本极低
- **esbuild 级内置功能**：TS/JSX、target 降级、define/inject、minify（Oxc minifier）、CJS 互操作、oxc-resolver 解析全部开箱，少装一堆插件
- **快**：Rust + 多核并行 + Oxc 底座，与 esbuild 同量级、比 Rollup 快 10~30 倍；真实案例 Linear 构建 46s → 6s
- **手动分包**：`output.codeSplitting` 提供 webpack `splitChunks` 式的声明式分组——esbuild 与 Rollup 都没有的能力
- **插件性能有解法**：hook filter 让 Rust 侧直接跳过不匹配模块，内置 Rust 插件（builtin:replace 等）进一步消除跨语言开销
- **1.0 语义化承诺**：选项名/类型、插件钩子签名向后兼容，公共 API 无计划内破坏性变更，可放心锁版本跟版本

**缺点**

- **生态尚在迁移期**：少数依赖 Rollup 私有行为的插件（钩子时序、缓存钩子）需要适配；`shouldTransformCachedModule` 等钩子不支持
- **与 Rollup 有刻意差异**：outputOptions 时机、多 output 的 build 钩子执行模型、closeBundle 触发条件、watch 的 options 调用次数都不同，深度插件作者要逐条核对
- **语法降级下限 ES2015**：不支持 ES5/IE 目标；target 也只降语法、不注入 polyfill
- **JS 插件仍可能成瓶颈**：跨 Rust↔JS 边界有固有成本，未配 filter 的重型 JS 插件会吃掉引擎收益
- **新特性多带 experimental 标签**：lazyBarrel、moduleTypes、HMR/dev API 等仍在实验区，1.0 的稳定承诺不覆盖它们

## 文档地址

[Rolldown](https://rolldown.rs/)

## GitHub 地址

[rolldown/rolldown](https://github.com/rolldown/rolldown)

## 幻灯片地址

<a href="/SlideStack/rolldown-slide/" target="_blank">Rolldown</a>
