---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **rolldown 1.1.x**（2026-06）。CLI、核心选项、transform 子选项、插件钩子差异与版本现状速查。

## CLI 速查

```bash
npx rolldown src/main.ts --file bundle.js     # 单文件输出
npx rolldown src/main.ts -d dist              # 目录输出
npx rolldown src/main.ts -d dist --format cjs # 指定输出格式
npx rolldown src/main.ts -d dist --minify     # 压缩（Oxc minifier）
npx rolldown -c                               # 读 rolldown.config.js
npx rolldown -c rolldown.prod.ts -w           # 指定配置 + watch
npx rolldown --version                        # 验证安装
```

## 核心输入选项（InputOptions）

| 选项 | 说明 |
|---|---|
| `input` | 入口：字符串 / 数组 / `{ name: path }` 对象 |
| `platform` | `'browser' \| 'node' \| 'neutral'`；cjs 输出默认 `node`，其余默认 `browser` |
| `resolve` | 解析配置（alias、conditionNames、extensions…），oxc-resolver 驱动 |
| `tsconfig` | 指定 `tsconfig.json`，启用 `compilerOptions.paths` 与相关编译选项 |
| `transform` | 内置转换配置：target/jsx/define/inject…（见下表） |
| `external` | 外部化依赖：字符串 / 正则 / 函数 |
| `treeshake` | 摇树开关与精细配置 |
| `plugins` | 插件数组（Rollup 兼容对象 + builtin 插件） |
| `moduleTypes` | ⚗️ 实验：扩展名 → 内置模块类型（esbuild loader 式） |
| `experimental` | ⚗️ 实验特性开关（如 `lazyBarrel`） |

## 核心输出选项（OutputOptions）

| 选项 | 说明 |
|---|---|
| `dir` / `file` | 输出目录 / 单文件（二选一） |
| `format` | `'esm' \| 'cjs' \| 'iife' \| 'umd'`，**默认恒为 esm** |
| `minify` | 内置 Oxc minifier，`true` 一键压缩 |
| `sourcemap` | `true \| 'inline' \| 'hidden'` |
| `codeSplitting` | 手动分包（splitChunks 式 groups）；`manualChunks` **已废弃** |
| `entryFileNames` / `chunkFileNames` / `assetFileNames` | 产物命名模板 |
| `banner` / `footer` / `intro` / `outro` | 产物头尾注入 |
| `name` / `globals` / `extend` | iife/umd 场景：全局变量名与外部依赖映射 |
| `preserveModules` | 不打包合并、按模块原样输出（库场景） |
| `keepNames` / `exports` / `esModule` | 标识符保留 / 导出模式 / 互操作标记 |

## transform 子选项速查

| 子选项 | 说明 |
|---|---|
| `target` | 语法降级目标：`'es2015'`~esnext 或 `['es2020','chrome58','node12']`；**默认 esnext 不转换，最低 ES2015，不注入 polyfill** |
| `jsx` | `false`（遇 JSX 报错）｜`'react'`（classic）｜`'react-jsx'`（automatic）｜`'preserve'`（原样）｜JsxOptions |
| `define` | 全局标识符/属性访问器 → 常量表达式，如 `'process.env.NODE_ENV': "'production'"`（注意内层引号） |
| `inject` | 按需注入 import shim 全局变量，API 对齐 `@rollup/plugin-inject` |
| `dropLabels` | 移除指定标签语句，如 `['DEBUG']` |
| `decorator` | 装饰器（含 legacy）支持 |
| `typescript` | TS 转换细节配置 |
| `assumptions` | 编译假设，换更小产物 |

## 插件钩子兼容性速查

支持的核心钩子（与 Rollup 一致）：`options`、`buildStart`、`resolveId`、`load`、`transform`、`moduleParsed`、`buildEnd`、`renderStart`、`renderChunk`、`augmentChunkHash`、`generateBundle`、`writeBundle`、`closeBundle`、`watchChange`、`closeWatcher`…均可配 **hook filter**。

| 差异点 | Rolldown | Rollup |
|---|---|---|
| `outputOptions` 时机 | **build 钩子之前** | build 钩子之后 |
| 多 output 的 build 钩子 | **每个 output 各跑一遍** | 全部输出共跑一次 |
| `closeBundle` 触发 | **需 generate()/write() 至少一次** | 无条件触发 |
| watch 的 `options` | **仅 watcher 初始化时一次** | 每次重建都调用 |
| `writeBundle` 并发 | **默认顺序执行** | 默认并行 |
| 不支持的钩子 | `shouldTransformCachedModule`、`resolveImportMeta`、`resolveFileUrl`、`renderDynamicImport` | — |

## 内置插件（Rust 实现）

| 插件 | 用途 |
|---|---|
| `builtin:replace` | 构建期文本替换；对比 `@rollup/plugin-replace`：**仅静态值、无 include/exclude** |
| `builtin:bundle-analyzer` | 产物体积与构成分析 |
| `builtin:esm-external-require` | ESM 输出中处理外部 require |

## 版本现状（2026-06）

| 包 | 版本 | 说明 |
|---|---|---|
| `rolldown` | **1.1.x**（latest） | 1.0.0-rc.1 = 2026-01-22；**1.0.0 stable = 2026-05-07**；语义化版本承诺生效 |
| `vite` | **8.0.x** | 2026-03-12 起 Rolldown 为默认/唯一打包器 |
| `rolldown-vite` | 7.x | 历史过渡 fork，Vite 8 后完成使命 |
| `tsdown` | 0.22.x | 官方库打包工具（tsup 接班人），尚未 1.0 |

> 1.0 承诺范围：**选项名/类型、插件钩子签名向后兼容**，公共 API 无计划内破坏性变更；`experimental.*` 不在承诺内。
