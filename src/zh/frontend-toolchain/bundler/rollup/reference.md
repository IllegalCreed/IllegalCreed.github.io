---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **rollup 4.61.x**（`latest`，Node ≥ 18）。CLI、核心配置、输出格式、官方插件、钩子与版本现状速查。

## CLI 速查

| 命令/标志 | 作用 |
|---|---|
| `rollup -c [file]` | 加载配置文件（**不传不读**），默认找 `rollup.config.js/.mjs/.cjs` |
| `-i` / `-o` / `-d` | 入口 / 单文件输出 / 目录输出 |
| `-f <format>` | 输出格式：`es`/`cjs`/`iife`/`umd`/`amd`/`system` |
| `-w` | watch 模式（环境变量 `ROLLUP_WATCH='true'`） |
| `-p <plugin>` | 按名加载插件（自动补 `@rollup/plugin-` 前缀，可重复） |
| `-m [inline]` | sourcemap（独立文件 / 内联） |
| `--environment K:V` | 注入 `process.env.K = 'V'` 供配置文件读取 |
| `--configPlugin typescript` | 先用插件转译配置文件本身（跑 `.ts` 配置） |
| `--bundleConfigAsCjs` | 配置转 CJS 执行（可用 `__dirname`/`require`） |
| `--watch.onEnd "cmd"` | watch 事件点执行 shell 命令 |
| `--failAfterWarnings` | 有警告即以错误码退出（CI 把关） |

## 核心配置速查

| 配置 | 要点 |
|---|---|
| `input` | 字符串 / 数组 / 对象（key = chunk 名，含 `/` 进子目录） |
| `external` | 字符串 / 正则 / 函数；不打包、保留导入，运行时由宿主提供 |
| `plugins` | 工厂函数调用结果数组；**falsy 项被忽略**（条件插件惯用法） |
| `output.format` | 默认 `es`；多 chunk 不支持 `iife`/`umd` |
| `output.file` / `dir` | 单 chunk 用 file，多 chunk 必须 dir |
| `output.name` | iife/umd 有导出时必填，全局变量名 |
| `output.globals` | iife/umd 下 external → 全局变量映射 |
| `output.exports` | `auto`(默认)/`named`/`default`/`none`；混合导出需 `named` |
| `output.sourcemap` | `true` / `'inline'` / `'hidden'` |
| `output.manualChunks` | 对象或函数；函数返回 chunk 名，`undefined` 走默认 |
| `output.preserveModules` | 逐模块输出不合并；tree-shaking 仍生效 |
| `output.inlineDynamicImports` | 动态导入内联回单文件（仅单入口） |
| `output.entryFileNames` 等 | `[name]`/`[hash]`/`[format]`/`[extname]`；4.x hash 为 url-safe base64 ≤21 字符 |
| `treeshake` | `true`(默认)/`false`/预设 `smallest`·`recommended`·`safest`/细项对象 |
| `watch` | `include`/`exclude`/`buildDelay`/`clearScreen` |

## 常用官方插件速查

| 插件 | 职责 |
|---|---|
| `@rollup/plugin-node-resolve` | 按 Node 算法定位 node_modules 模块；读取 `sideEffects` 字段 |
| `@rollup/plugin-commonjs` | CommonJS → ESM（输入侧转换） |
| `@rollup/plugin-json` | `.json` 可 import，未用字段可被摇掉 |
| `@rollup/plugin-babel` | 接入 Babel；`babelHelpers`: 应用 `bundled` / 库 `runtime` |
| `@rollup/plugin-typescript` | 接入 TS 编译 |
| `@rollup/plugin-terser` | 压缩；常放 `output.plugins` 按输出启用 |
| `@rollup/plugin-replace` | 构建期常量替换（如 `process.env.NODE_ENV`） |
| `@rollup/plugin-alias` | 路径别名 |

## 插件钩子速查

| 阶段 | 钩子（按序） | 类型要点 |
|---|---|---|
| Build（一轮/构建） | `options → buildStart → resolveId → load → transform → moduleParsed → buildEnd` | `resolveId`/`load` 为 **first**（先答先得）；`transform` 为 **sequential** |
| Output（一轮/输出） | `outputOptions → renderStart → renderChunk → generateBundle → writeBundle → closeBundle` | `output.plugins` 只能用本阶段钩子 |
| Watch 专属 | `watchChange` / `closeWatcher` | parallel |

虚拟模块约定：resolveId 返回 **`\0` 前缀** id，阻止其他插件误处理。

## JavaScript API 速记

```js
const bundle = await rollup(inputOptions); // 建图 + tree-shake，不产出
await bundle.generate(outputOptions);      // 内存产出（可多次）
await bundle.write(outputOptions);         // 写盘
await bundle.close();                      // 必须调用

// watch：带 result 的事件必须 event.result.close()；停止用 watcher.close()
```

## 版本现状（2026-06）

| 项 | 状态 |
|---|---|
| rollup `latest` | **4.61.x**（Node ≥ 18） |
| 解析器 | 基于 **SWC 的 Rust 原生实现**（4.0 起，acorn 移除；`@rollup/wasm-node` 回退） |
| Rolldown | **1.x**（Rust、Rollup 兼容 API，VoidZero 主导） |
| Vite 8 | 默认/统一打包内核为 **Rolldown**（此前为「开发 esbuild + 生产 Rollup」） |
| 定位 | Rollup 本体维护/传承期，库打包存量生态依旧庞大 |
