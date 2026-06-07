---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 **@swc/core 1.15.x**。`.swcrc` 字段、CLI、API 与默认值速查。

## .swcrc 字段速查

### 顶层

| 字段 | 默认 | 说明 |
|---|---|---|
| `$schema` | — | `"https://swc.rs/schema.json"`，获得编辑器补全 |
| `jsc` | — | 编译器核心（见下） |
| `module` | — | 模块输出（见下） |
| `env` | — | 按目标环境降级（与 `jsc.target` **互斥**） |
| `minify` | `false` | 顶层布尔，开总压缩 |
| `sourceMaps` | `false` | `true` / `"inline"` |
| `isModule` | — | 强制按模块/脚本解析 |
| `exclude` / `test` | — | 按文件名正则筛选 |

### jsc

| 字段 | 默认 | 说明 |
|---|---|---|
| `jsc.parser.syntax` | `"ecmascript"` | `"ecmascript"` / `"typescript"` |
| `jsc.parser.jsx` | `false` | （ecmascript）解析 JSX |
| `jsc.parser.tsx` | `false` | （typescript）解析 TSX |
| `jsc.parser.decorators` | `false` | 解析装饰器语法 |
| `jsc.parser.dynamicImport` | `false` | 解析 `import()` |
| `jsc.target` | **`es5`** | 语法降级目标 `es3`…`esnext` |
| `jsc.loose` | `false` | 宽松转换（Babel loose 假设） |
| `jsc.externalHelpers` | `false` | 助手外置到 `@swc/helpers` |
| `jsc.keepClassNames` | `false` | 保留类名（需 target ≥ es2016） |
| `jsc.transform.react.runtime` | `"classic"` | `"automatic"`（React 17+）/ `"classic"` |
| `jsc.transform.react.importSource` | `"react"` | automatic 运行时来源 |
| `jsc.transform.react.pragma` | `"React.createElement"` | classic 工厂函数 |
| `jsc.transform.react.development` | — | 注入 `__self` / `__source` 调试信息 |
| `jsc.transform.react.refresh` | `false` | react-refresh（实验） |
| `jsc.transform.legacyDecorator` | — | 旧版装饰器（TS experimentalDecorators） |
| `jsc.transform.decoratorMetadata` | — | 对应 TS emitDecoratorMetadata |
| `jsc.transform.useDefineForClassFields` | — | 类字段用 define 还是赋值语义 |
| `jsc.transform.optimizer` | — | `globals` / `simplify` 等优化 |
| `jsc.baseUrl` | — | 路径别名基准（**须绝对路径**） |
| `jsc.paths` | — | 路径映射（依赖 baseUrl，同 tsconfig） |
| `jsc.experimental.plugins` | — | Wasm 插件，`[name, configJSON]` 元组 |
| `jsc.minify.compress` / `mangle` / `format` | — | Terser 兼容压缩选项 |

### module

| 字段 | 默认 | 说明 |
|---|---|---|
| `module.type` | `es6` | `es6` / `commonjs` / `amd` / `umd` / `systemjs` |
| `module.strict` | `false` | CJS 下模拟 `__esModule` |
| `module.strictMode` | `true` | 输出 `"use strict"` |
| `module.lazy` | `false` | 惰性加载依赖 |
| `module.importInterop` | `"swc"` | `"swc"` / `"node"` / `"none"` |
| `module.noInterop` | `false` | 关闭互操作 helper |

### env（与 jsc.target 互斥）

| 字段 | 说明 |
|---|---|
| `env.targets` | browserslist 查询或 `{ chrome: "100" }` |
| `env.mode` | polyfill 注入：`"usage"` / `"entry"`（不写不注入） |
| `env.coreJs` | core-js 版本（如 `"3"`） |
| `env.shippedProposals` | 包含已落地提案 |
| `env.bugfixes` | 针对引擎 bug 的修正转换 |

## CLI 速查

```bash
npx swc src -d dist        # 编译目录到 dist/
npx swc src -d dist -w     # 监听增量
npx swc file.ts -o out.js  # 单文件输出
npx swc src -d dist --source-maps        # 产出 source map
npx swc src -d dist --config-file .swcrc # 指定配置文件
npx swc src -d dist -C jsc.target=es2022 # 命令行覆盖配置项(-C)
```

## API 速查（@swc/core）

| API | 说明 |
|---|---|
| `transform(code, opts)` / `transformSync` | 转译源码字符串（最常用） |
| `transformFile(path, opts)` / `transformFileSync` | 按路径转译文件 |
| `minify(code, opts)` / `minifySync` | 压缩（Terser 兼容） |
| `parse(code, opts)` / `parseSync` / `parseFile*` | 解析为 AST（`@deprecated` 倾向 Wasm 插件） |
| `print(ast, opts)` / `printSync` | AST 打印回代码（**须与 parse 同一 Compiler 实例**） |
| `bundle(opts)` | 打包（spack，实验、成熟度不足） |
| `new Compiler()` | 复用实例做 parse → print |

> 旧 JS 端 `plugins()` 与裸 `parse`/`print` 组合已 `@deprecated`，扩展走 Wasm 插件。

## 与各工具的分工速记

| 任务 | 谁来做 |
|---|---|
| 类型检查 | **只有 tsc**（`tsc --noEmit`）——SWC 不做 |
| 快速 emit `.js`（剥类型 + 降级） | **SWC** / esbuild / Babel |
| 压缩 minify | SWC（Terser 兼容）/ Terser / esbuild |
| 打包 | Webpack(swc-loader) / Rspack / Rollup / Vite（SWC 当转译内核） |
| polyfill 注入 | SWC `env`(coreJs) 或打包器 + core-js |
| 扩展编译行为 | SWC **Wasm 插件**（`swc_core` 须匹配宿主 ABI） |

## 谁在用 SWC

Next.js 内置编译器 · Parcel · Deno · `@swc/jest` · NestJS（可选）· Rspack / Rsbuild 的 `swc-loader`。

## 版本现状（2026-06）

| 包 | dist-tag | 版本 |
|---|---|---|
| `@swc/core` | `latest` | **1.15.x**（长期 1.x） |
| `@swc/cli` | `latest` | **0.8.x** |
| `@swc/helpers` | `latest` | 配 `externalHelpers` 的运行时 |
| `swc-loader` / `@swc/jest` | `latest` | Webpack / Jest 集成 |

> Wasm 插件版本请用 [plugins.swc.rs](https://plugins.swc.rs) 按宿主 `@swc/core` 选择，**无向后兼容保证**。
