---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **unbuild 3.6.1**（`latest`，2026-06）。CLI、build.config 顶层选项、`rollup` 字段、declaration 取值与 hooks 速查。

## CLI 速查

```bash
npx unbuild                       # 构建（无配置则从 package.json 自动推断 entries）
npx unbuild ./packages/core       # 指定根目录（位置参数 dir）
npx unbuild --config ./my.config.ts   # 指定配置文件
npx unbuild --stub                # stub mode：桩化 dist（开发期主推）
npx unbuild --watch               # 监听重建（experimental；mkdist 不支持）
npx unbuild --minify              # 压缩（映射为 rollup.esbuild.minify）
npx unbuild --sourcemap           # 生成 sourcemap（experimental）
npx unbuild --parallel            # untyped/mkdist/rollup/copy 四类 builder 并行
```

> `--stub` 与 `--watch` 同传时 **watch 优先**、stub 被忽略。

## 顶层选项速查

| 选项                 | 默认值       | 说明                                                                                  |
| -------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `entries`            | 自动推断     | string（rollup 入口）或对象（指定 builder/input/outDir）；input 以 `/` 结尾自动用 mkdist |
| `outDir`             | `dist`       | 输出目录                                                                              |
| `clean`              | `true`       | 构建前清空输出目录                                                                    |
| `declaration`        | `undefined`  | `'compatible'`/`'node16'`/`true`/`false`；不写则按 package.json `types` 自动探测       |
| `sourcemap`          | `false`      | 产物 sourcemap                                                                        |
| `stub` / `stubOptions` | `false`    | 桩化构建（同 `--stub`）；`stubOptions.jiti` 透传 jiti 选项                             |
| `watch`              | `false`      | experimental 监听模式                                                                 |
| `externals`          | 内置推断     | 追加 external（string/RegExp）；默认已含 Node 内置模块 + deps + peerDeps               |
| `alias` / `replace`  | —            | 路径别名 / 构建期常量替换                                                             |
| `failOnWarn`         | `true`       | 有警告即 `process.exit(1)`（依赖校验的牙齿）                                          |
| `parallel`           | `false`      | 四类 builder 任务并行执行                                                             |
| `hooks` / `preset`   | —            | 生命周期钩子 / 可复用配置预设（内置 entries 推断就是 autoPreset）                      |
| `name` / `rootDir`   | 包名 / cwd   | 构建名（多配置日志区分）/ 项目根目录                                                  |

## `rollup` 字段（Rollup 细节都收在这里）

| 选项                  | 说明                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| `emitCJS`             | `true` 时在 `.mjs` 外追加 `.cjs` 输出（默认 `false`，可被自动推断打开）        |
| `inlineDependencies`  | `true` 内联全部未声明依赖并消除隐式依赖警告；数组按 string/RegExp 名单内联     |
| `esbuild`             | 转译/压缩选项：`minify`、`target`、`tsconfigRaw` 等                           |
| `dts`                 | rollup-plugin-dts 选项（声明打包）                                            |
| `output`              | Rollup OutputOptions 覆盖（如自定义 `entryFileNames`）                        |
| `resolve` / `commonjs` / `json` / `alias` / `replace` | 对应 @rollup/plugin-* 的细化选项              |

> unbuild **不读取 `rollup.config.js`**，所有 Rollup 细节通过本字段调整。

## entries 两种形态

```ts
export default defineBuildConfig({
  entries: [
    "./src/index", // string：rollup 打包入口（可省略 .ts 后缀）
    { builder: "mkdist", input: "./src/components/", outDir: "./dist/components" },
  ],
});
```

## declaration 取值

| 取值                     | 产物（src/index.ts 为例）                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `'compatible'` ≡ `true`  | `index.d.ts` + `index.d.mts` + `index.d.cts` 三份                 |
| `'node16'`               | 仅 `index.d.mts` + `index.d.cts` 两份                             |
| `false`                  | 不生成                                                           |
| 不写（`undefined`）      | 自动探测：package.json 有 `types` → `'compatible'`，否则 `false`  |

## hooks 速查

| 层级           | 钩子（按触发顺序）                                                            |
| -------------- | ------------------------------------------------------------------------------ |
| 顶层生命周期   | `build:prepare` → `build:before` → `build:done`                                |
| rollup         | `rollup:options`、`rollup:build`、`rollup:dts:options`、`rollup:dts:build`、`rollup:done` |
| mkdist         | `mkdist:entries`、`mkdist:entry:options`、`mkdist:entry:build`、`mkdist:done`  |
| copy / untyped | `copy:entries`/`copy:done`、`untyped:entries`/…/`untyped:done`                 |

注册方式：配置里 `hooks: { 'build:done'(ctx) {} }`（基于 unjs/hookable；tsdown 的 hooks 即受此启发）。

## 两个官方配方

```ts
// 装饰器：透传 esbuild 的 tsconfigRaw
export default defineBuildConfig({
  rollup: { esbuild: { tsconfigRaw: { compilerOptions: { experimentalDecorators: true } } } },
});
// sourcemap
export default defineBuildConfig({ sourcemap: true });
```

## 版本现状（2026-06）

| 包                      | dist-tag | 版本                                              |
| ----------------------- | -------- | -------------------------------------------------- |
| `unbuild`               | `latest` | **3.6.1**（rollup ^4.50 / jiti ^2.5 / mkdist ^2.3） |
| `obuild`（实验后继者）  | `latest` | 0.4.x（Rolldown 底座，beta）                        |

> 官方注记：正实验 obuild 作为下一代；unbuild 仍是 UnJS 生态现役标准——「实验后继者存在」≠「unbuild 已废弃」。
