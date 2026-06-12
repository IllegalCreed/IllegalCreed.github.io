---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **tsup 8.5.1**（`latest`，2025-11 发布，2026-06 仍是最新）。CLI、默认值、扩展名规则、dts 标志、引擎分工与版本现状速查。

## CLI 速查

```bash
npx tsup src/index.ts                  # 显式入口（无入口推断！）→ dist/index.js（cjs）
npx tsup src/a.ts src/b.ts             # 多入口，产物名跟随源文件名
npx tsup --entry.foo src/a.ts          # 命名入口：键名即产物名 → dist/foo.js
npx tsup src/index.ts --format esm,cjs,iife  # 多格式（默认仅 cjs；无 umd）
npx tsup src/index.ts --dts            # 生成声明文件（多格式各一份）
npx tsup src/index.ts --watch          # 监听（默认忽略 dist/node_modules/.git）
npx tsup src/index.ts --watch --onSuccess "node dist/index.js"  # 构建成功后执行
npx tsup src/index.ts --minify         # esbuild 压缩；--minify terser 需自装 terser
npx tsup src/index.ts --sourcemap      # 产 .js.map；inline 仅限开发场景
npx tsup src/index.ts --treeshake      # 改用 Rollup 做更彻底的摇树
npx tsup src/index.ts --env.NODE_ENV production  # 编译期 define 替换
npx tsup src/index.ts --no-splitting   # 关闭 esm 默认代码分割
tsup-node src/index.ts                 # Node 应用：跳过打包所有 node_modules 包
npx tsup --config ./other.ts           # 指定配置文件；--no-config 禁用
```

## 核心默认值速查

| 项          | 默认值                                                                  |
| ----------- | ----------------------------------------------------------------------- |
| `entry`     | **无推断**，不传报 `No input files`；数组支持 glob，对象键名即产物名    |
| `format`    | `cjs`（可选 `esm`/`iife`；**不支持 umd**）                              |
| `outDir`    | `dist/`                                                                  |
| `platform`  | `node`（可选 `browser`/`neutral`）                                       |
| `target`    | tsconfig `compilerOptions.target`，未设则 **`node14`**；`es5` 需 SWC 二段转译 |
| `clean`     | `false`（不清空旧产物）                                                  |
| `splitting` | esm 默认开（仅 esm）；`--splitting` 给 cjs 开实验性分割；`--no-splitting` 关 |
| 依赖        | `dependencies`/`peerDependencies` 始终外部化；devDeps 被 import 会打入   |
| 类型检查    | 不做；`--dts` 跑真 TS 编译器附带检查，严格把关另跑 `tsc --noEmit`        |

## 扩展名规则（背下来）

| format | 默认（无 `type` 字段） | `"type": "module"` |
| ------ | ---------------------- | ------------------ |
| cjs    | **`.js`**              | `.cjs`             |
| esm    | `.mjs`                 | **`.js`**          |
| iife   | `.global.js`           | `.global.js`       |

> 谁占裸 `.js` 由 package.json `type` 决定。逃生门：`--legacy-output`（按格式分目录、全 `.js`）或 `outExtension` 回调（上下文含 `format`/`options`/`pkgType`）。

## dts 标志速查

| 标志                 | 作用                                                               |
| -------------------- | ------------------------------------------------------------------ |
| `--dts`              | 生成声明：真 TS 编译器 + rollup-plugin-dts 打包，多入口/多格式各一份 |
| `--dts-only`         | 只产声明不产 JS（等价 tsc 的 emitDeclarationOnly）                 |
| `--dts-resolve`      | 实验性：把 node_modules 外部类型解析并内联进声明                   |
| `--experimental-dts` | 8.0+：基于 @microsoft/api-extractor 的另一套实现（peer 依赖自装）  |
| declaration map      | **生成不了**（#564）：另跑 `tsc --emitDeclarationOnly --declaration`，可挂 onSuccess |

> `--dts` 构建不支持 source map；声明产物发布前建议用 tsc 或 `@arethetypeswrong/cli` 校验。

## 引擎分工

| 引擎           | 职责                                           | 启用时机                          |
| -------------- | ---------------------------------------------- | --------------------------------- |
| **esbuild**    | TS/JS 转译与打包、默认压缩、默认摇树           | 始终                              |
| **TypeScript** | 为 dts 提供类型信息（peer 依赖 >=4.5）         | `--dts`                           |
| **Rollup**     | `--treeshake` 摇树；rollup-plugin-dts 打包声明 | `--treeshake` / `--dts`           |
| **SWC**        | legacy 装饰器元数据、`es5` 降级                | `emitDecoratorMetadata` / `--target es5` |

## 依赖关系速查

| 包                         | 关系                | 说明                              |
| -------------------------- | ------------------- | --------------------------------- |
| `esbuild` / `rollup`       | 直接依赖            | 主引擎 + 摇树/dts 管线            |
| `typescript`               | peer（可选，>=4.5） | `--dts` 需要                      |
| `@swc/core`                | peer（可选）        | 装饰器元数据场景自装              |
| `@microsoft/api-extractor` | peer（可选）        | `--experimental-dts` 自装         |
| `postcss` / `terser`       | 需自装              | 实验性 CSS / `--minify terser`    |

## 版本现状（2026-06）

| 包     | dist-tag | 版本                 | 状态                                  |
| ------ | -------- | -------------------- | ------------------------------------- |
| `tsup` | `latest` | **8.5.1**（2025-11） | README 官宣不再积极维护，点名 tsdown 接班 |

> 周下载仍约 **600 万+**，存量为王。迁移 tsdown：`npx tsdown-migrate`（支持 `--dry-run` 与 monorepo glob）；默认值差异（format `esm`、`clean: true`）与完整选项映射见 [tsdown 笔记](../tsdown/reference)。
