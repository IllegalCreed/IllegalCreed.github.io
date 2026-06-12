---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **tsdown 0.22.x**（`latest`，2026-06）。CLI、默认值、tsup 迁移映射、hooks 与版本现状速查。

## CLI 速查

```bash
npx tsdown                        # 零配置构建（src/index.ts → dist/，ESM）
npx tsdown src/a.ts src/b.ts      # 直接传入口
npx tsdown --format esm --format cjs   # 双格式
npx tsdown --dts                  # 生成声明文件
npx tsdown -w                     # watch 模式（--watch [path]）
npx tsdown --ignore-watch tests   # watch 时忽略路径
npx tsdown --minify               # 压缩（Oxc minifier）
npx tsdown --no-treeshake         # 关闭 tree-shaking
npx tsdown --unbundle             # 逐文件输出（镜像源码结构）
npx tsdown --publint --attw       # 发布校验（需自装 publint / @arethetypeswrong/core）
npx tsdown --unused               # 未使用依赖检查
npx tsdown --workspace --filter pkg-a  # monorepo：构建工作区/筛选包
npx tsdown --config ./tsdown.config.ts # 指定配置；--no-config 禁用
npx tsdown-migrate --dry-run      # tsup 迁移（预览）
```

## 核心默认值速查

| 项          | 默认值                                            |
| ----------- | ------------------------------------------------- |
| `entry`     | `src/index.ts`（存在时）；支持 string/array/object/glob |
| `format`    | `esm`（可选 `cjs`/`iife`/`umd`）                  |
| `outDir`    | `dist/`                                           |
| 扩展名      | Node 平台固定：ESM `.mjs`、CJS `.cjs`；IIFE/UMD 文件名带格式 |
| `platform`  | `node`（可选 `browser`/`neutral`；**CJS 恒为 node**） |
| `target`    | 自动读 `engines.node`；**只转语法不注入 polyfill**；`false` 全关 |
| `clean`     | `true`（构建前清空 outDir）                       |
| `treeshake` | `true`                                            |
| `dts`       | package.json 含 `types`/`typings` 时自动开        |
| 依赖        | deps/peerDeps/optionalDeps 外部化；devDeps 被引用才打入 |
| `cjsDefault`| `true`：单一 default 导出的 CJS 转 `module.exports =`（dts 转 `export =`） |

## tsup → tsdown 迁移映射

| tsup                       | tsdown                          | 说明               |
| -------------------------- | ------------------------------- | ------------------ |
| `format: 'cjs'`（默认）    | `format: 'esm'`（默认）         | 默认值差异         |
| `clean: false`（默认）     | `clean: true`（默认）           | 默认值差异         |
| `cjsInterop`               | `cjsDefault`                    | **重命名**         |
| `esbuildPlugins`           | `plugins`（Rolldown/unplugin）  | **重命名 + 换插件**|
| `outExtension`             | `outExtensions`（复数）         | **重命名**         |
| `entryPoints`              | `entry`                         | 废弃映射，暂可用   |
| `publicDir`                | `copy`                          | 废弃映射           |
| `bundle: false`            | `unbundle: true`                | 废弃映射           |
| `injectStyle: true`        | `css: { inject: true }`         | 废弃映射           |
| `removeNodeProtocol: true` | `nodeProtocol: 'strip'`         | 废弃映射           |
| `external` / `noExternal`  | `deps.neverBundle` / `deps.alwaysBundle` | 废弃映射  |
| `skipNodeModulesBundle`    | `deps.skipNodeModulesBundle`    | 废弃映射           |
| `splitting: false`         | ——**不支持**（分割恒开）        | 无对应             |
| `metafile`                 | `devtools: true`                | 无对应，换方案     |
| `swc` / `experimentalDts`  | ——（内部用 oxc / 标准 `dts`）   | 无对应             |
| `[name].global.js`（IIFE） | `[name].iife.js`                | 产物命名差异       |

> unplugin 系插件改导入子路径即可：`unplugin-x/esbuild` → `unplugin-x/rolldown`。

## hooks 速查

| 钩子            | 时机                                         |
| --------------- | -------------------------------------------- |
| `build:prepare` | 每次 tsdown 构建开始前                       |
| `build:before`  | 每个 Rolldown 构建前（多格式时按格式各触发） |
| `build:done`    | 每次构建完成后                               |

注册：配置里 `hooks: { 'build:done': fn }`，或函数式 `hooks(h) { h.hook('build:prepare', fn) }`（受 unbuild 启发、基于 hookable）。

## 发布质检三件套

| 能力       | 开启                          | 依赖                                   |
| ---------- | ----------------------------- | -------------------------------------- |
| publint    | `publint: true` / `--publint` | 需自装 `publint`（可选依赖）           |
| attw       | `attw: true` / `--attw`       | 需自装 `@arethetypeswrong/core`        |
| 未用依赖   | `--unused`                    | 内置                                   |

> publint/attw 均支持 `'ci-only'`：本地跳过、CI 强制。

## 版本现状（2026-06）

| 包       | dist-tag | 版本                          |
| -------- | -------- | ----------------------------- |
| `tsdown` | `latest` | **0.22.x**（0.22.2，未到 1.0） |

> 0.x 阶段 semver 不承诺 minor 兼容：锁版本、升级前读 [Releases](https://github.com/rolldown/tsdown/releases)。运行环境要求 Node.js 22.18.0+。
