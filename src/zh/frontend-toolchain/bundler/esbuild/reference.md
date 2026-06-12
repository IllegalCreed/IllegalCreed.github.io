---
layout: doc
outline: [2, 3]
---

# 参考

> 速查表性质，完整选项见[官方 API 文档](https://esbuild.github.io/api/)。版本基线 0.28.x。

## CLI 速查

```bash
esbuild app.ts --bundle --outfile=out.js              # 打包单文件输出
esbuild app.ts --bundle --outdir=dist --splitting --format=esm   # 拆分需 esm + outdir
esbuild app.ts --bundle --minify --sourcemap --target=es2020     # 生产三件套
esbuild app.ts --bundle --platform=node --packages=external      # Node 打包、依赖外置
esbuild app.tsx --bundle --watch --servedir=www       # 开发：watch + serve
esbuild app.ts --bundle --metafile=meta.json --analyze           # 体积分析
esbuild --loader:.png=dataurl --loader:.svg=text app.ts --bundle # 指定 loader
echo 'let x: number = 1' | esbuild --loader=ts        # stdin 转换
```

## 核心选项速查

| 选项 | 作用 | 备注 |
|---|---|---|
| `--bundle` | 递归内联依赖 | **默认关闭** |
| `--outfile` / `--outdir` | 单文件 / 目录输出 | 互斥；多入口、splitting 用 outdir |
| `--format` | `iife` / `cjs` / `esm` | 默认随 platform |
| `--platform` | `browser` / `node` / `neutral` | 默认 browser |
| `--target` | `es2020`、`chrome58,node18` 等 | 默认 esnext；转不动会**报错** |
| `--minify` | 空白 + 标识符 + 语法三合一 | 可 `--minify-whitespace` 等单开 |
| `--sourcemap` | `linked`（默认）/ `inline` / `external` / `both` | external 不留注释 |
| `--define:K=V` | 标识符 → 常量表达式 | 字符串值要 JSON 引号 |
| `--external:pkg` | 排除打包、保留导入 | 支持通配符 |
| `--packages=external` | 所有裸模块导入全部外置 | Node 打包常用 |
| `--alias:a=b` | 导入路径替换 | |
| `--splitting` | 代码拆分 | **仅 esm**；共享代码 + 动态 import |
| `--tree-shaking` | `true` 强制开 / `false` 强制关 | 默认 bundle 或 iife 才开 |
| `--metafile` | 构建元数据 JSON | 配 `--analyze` 或官网分析器 |
| `--drop:console` | 删除 console / debugger | 另有 `--drop-labels` |
| `--loader:.ext=类型` | 扩展名 → loader 映射 | |
| `--watch` / `--serve` | 监听重建 / 开发服务器 | 可同时开 |
| `--jsx=automatic` | React 17+ 自动运行时 | 默认 classic（createElement） |
| `--banner:js=...` / `--footer:js=...` | 产物首尾注入 | js/css 分别指定 |

## loader 速查

| loader | 默认扩展名 | 行为 |
|---|---|---|
| `js` / `jsx` / `ts` / `tsx` | `.js` `.jsx` `.ts` `.tsx` | 转译；`.js` 默认**不**解析 JSX |
| `json` | `.json` | 解析为对象，具名导出可摇树 |
| `css` / `local-css` | `.css` / `.module.css` | 一等公民；module 为 CSS Modules |
| `text` | `.txt` | UTF-8 字符串 |
| `binary` | — | 运行时解码为 Uint8Array |
| `base64` / `dataurl` | — | Base64 字符串 / 含 MIME 的 data URL（内联） |
| `file` | — | 拷贝到输出目录，导出文件名字符串 |
| `copy` | — | 原样拷贝并保留导入指向 |
| `empty` | — | 视为空模块（排除内容） |

## JS API 形态

```js
import * as esbuild from 'esbuild'

await esbuild.build({ entryPoints: ['a.ts'], bundle: true, outdir: 'dist' })
const { code } = await esbuild.transform('let x: number = 1', { loader: 'ts' })

// v0.17+ 增量/开发统一走 context
const ctx = await esbuild.context({ entryPoints: ['a.ts'], bundle: true, outdir: 'dist' })
await ctx.watch()                          // 自动重建
const { port } = await ctx.serve({ servedir: 'www' })  // 开发服务器
await ctx.rebuild()                        // 手动增量构建
await ctx.dispose()                        // 释放资源
```

- `write: false`：不落盘，产物在返回值 `outputFiles`（`path` / `contents` / `text`）。
- 同步版 `buildSync` / `transformSync`：仅 Node、阻塞线程、**不能用插件**。

## 与同类工具的分工速记

| 需求 | 工具 |
|---|---|
| 极速打包 / 转译 / 压缩 | **esbuild** |
| TS 类型检查、`.d.ts` | tsc（`--noEmit` / `emitDeclarationOnly`） |
| 降级到 ES5、注入 polyfill | Babel（preset-env + core-js）/ SWC |
| 精细产物控制、成熟拆分 | Rollup / webpack |
| 应用开发服务器 + HMR | Vite（底层 dev 用 esbuild） |
| 库打包（基于 esbuild） | tsup |
| Rust 系新一代 | Rolldown（Vite 方向）/ Rspack（webpack 兼容） |

## 版本现状（2026-06）

- npm `latest` = **0.28.1**，要求 **Node ≥ 18**；仍是 0.x，「late-stage beta」。
- 版本语义：**patch 兼容、minor 破坏**，官方安装命令带 `--save-exact`。
- 维护状态：作者（Evan Wallace，单一主维护者）明确**当前不做活跃特性开发**；剩余路线图：改进代码拆分（[#16](https://github.com/evanw/esbuild/issues/16)）、HTML 内容类型（[#31](https://github.com/evanw/esbuild/issues/31)），完成后即视为「relatively complete」。
- 生态位：Vite（dev 预打包 + transform + 默认 minify）、tsup、Amazon CDK、Phoenix 等底层依赖；Rust 系（Rolldown/Rspack/Oxc）崛起中，但 esbuild 仍极主流。
