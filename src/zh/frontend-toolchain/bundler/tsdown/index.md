---
layout: doc
---

# tsdown

**Rolldown 官方的库打包器**（**The Elegant Bundler for Libraries**），专为 TypeScript/JavaScript **库**（而非应用）设计，并将作为 Rolldown-Vite **Library Mode** 的基础。打包引擎是 Rust 实现的 **Rolldown**，声明文件生成依托 **Oxc**（oxc-transform）：tsconfig 开启 `isolatedDeclarations` 时逐文件极速产出 `.d.ts`，否则回退 TypeScript 编译器。官方 FAQ 直言它是「**the spiritual successor to tsup, powered by Rolldown instead of esbuild**」——tsup 的精神继任者，兼容 tsup 主要选项与特性，并提供 `npx tsdown-migrate` 一键迁移；hooks 体系则受 **unbuild** 启发。在 tsup 之外，它补上了库发布的整条工作流：**自动生成 package.json `exports`**、**publint/attw 发布校验**、内置 **workspace（monorepo）构建**、CSS 支持等。**2026-06 现状**：最新版本 **0.22.x**（未到 1.0，0.x 阶段 minor 也可能含破坏性变更，升级需看 release notes），由 VoidZero 背书、Rolldown 生态多包采用，事实上接棒 tsup 成为新一代库打包的默认选项。

## 评价

**优点**

- **快**：Rolldown（Rust）打包 + oxc-transform 产 dts，配合 `isolatedDeclarations` 时声明文件生成「extremely fast」
- **真·开箱即用**：默认 ESM、默认 `dist/`、默认外部化 dependencies、`src/index.ts` 约定入口、`types` 字段自动开 dts——库场景几乎零配置
- **tsup 迁移近零成本**：兼容主要选项，`npx tsdown-migrate` 自动改写配置并装依赖，`--dry-run` 可预览
- **发布工作流闭环**：`exports: true` 自动回写 package.json 导出映射；集成 publint + attw（含 `'ci-only'` 模式）；`--unused` 检查无用依赖
- **插件生态广**：支持 Rolldown / Rollup / unplugin 插件与部分 Vite 插件（unplugin 改 `/rolldown` 子路径即可）
- **monorepo 内置支持**：`--workspace` + `--filter` 一条命令构建全部/部分包，tsup 时代需外部编排
- **dts 双格式严谨**：ESM 的 js 与 d.ts 同构建产出；CJS 声明用独立构建过程保证 require 解析兼容

**缺点**

- **未到 1.0**：0.x 阶段 semver 不承诺 minor 兼容，需锁版本、升级前读 release notes
- **不支持 esbuild 插件**：tsup 的 `esbuildPlugins` 必须换成 Rolldown/unplugin 兼容实现
- **部分 tsup 选项无对应**：`splitting: false` 不可关（分割恒开）、`metafile` 改用 `devtools`、无 SWC 集成
- **有意不做 stub mode**：unbuild 用户需改用 watch 或 `exports.devExports`（后者依赖 publishConfig，npm 不支持）
- **minify 基于 Oxc minifier**：官方标注仍偏早期（alpha），生产使用需充分验证
- **运行环境要求新**：运行 tsdown 本身需 Node.js 22.18.0+（产物可面向更低版本）

## 文档地址

[tsdown](https://tsdown.dev/)

## GitHub 地址

[rolldown/tsdown](https://github.com/rolldown/tsdown)

## 幻灯片地址

<a href="/SlideStack/tsdown-slide/" target="_blank">tsdown</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=tsdown" target="_blank" rel="noopener noreferrer">tsdown 测试题</a>
