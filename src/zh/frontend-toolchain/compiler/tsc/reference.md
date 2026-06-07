---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 **TypeScript 6.0.x**。tsconfig 选项、CLI、默认值速查。

## CLI 速查

```bash
tsc                      # 读 tsconfig.json，类型检查 + emit
tsc --noEmit             # 只类型检查，不产出
tsc --init               # 生成带注释的 tsconfig.json
tsc -w / --watch         # 监听增量编译
tsc -p path/tsconfig.json   # 指定配置文件（--project）
tsc -b / --build         # 工程引用构建（需 composite）
tsc -b --clean / --watch / --force   # 清理 / 监听 / 强制重建
tsc a.ts b.ts            # 直接编译指定文件（⚠️ 忽略 tsconfig）
tsc --showConfig         # 打印最终合并后的配置
tsc --extendedDiagnostics    # 各阶段耗时诊断
tsc --generateTrace dir  # 产出 chrome://tracing 火焰图
```

## tsconfig 顶层字段

| 字段 | 作用 |
|---|---|
| `compilerOptions` | 编译选项（主体，见下） |
| `files` | 精确列举要编译的文件 |
| `include` / `exclude` | glob 选取 / 排除（不指定输入文件时才生效） |
| `extends` | 继承基础配置（字符串或数组） |
| `references` | 工程引用（配 `composite` + `tsc -b`） |
| `compileOnSave` | 编辑器保存即编译（需 IDE 支持） |

## compilerOptions 速查

### 产物 / 降级

| 选项 | 默认 | 说明 |
|---|---|---|
| `target` | `es5`→**6.0 起最低 `es2015`** | 降级目标；`es5` 已弃用 |
| `module` | 随 `target` | `nodenext`/`esnext`/`commonjs`；`amd`/`umd`/`systemjs` **已移除** |
| `lib` | 随 `target` | 内置类型环境（如 `["es2022","dom"]`） |
| `outDir` / `rootDir` | — | 产物目录 / 源码根 |
| `noEmit` | `false` | 只检查不产出 |
| `noEmitOnError` | `false` | 有错就不产出 |
| `declaration` / `declarationMap` | `false` | 产出 `.d.ts` / 其 sourcemap |
| `emitDeclarationOnly` | `false` | 只出 `.d.ts`，不出 `.js` |
| `sourceMap` / `inlineSourceMap` | `false` | 调试 source map |
| `jsx` | — | `react-jsx`/`preserve`/`react` |
| `removeComments` | `false` | 删注释 |

### 模块解析

| 选项 | 默认 | 说明 |
|---|---|---|
| `moduleResolution` | 随 `module` | `bundler`/`nodenext`；`node`/`node10` **已弃用** |
| `baseUrl` | — | 非相对导入的基准目录 |
| `paths` | — | 路径别名（**仅类型层，不重写产物**） |
| `esModuleInterop` | `false` | CJS 默认导入互操作（建议 `true`） |
| `resolveJsonModule` | `false` | 允许 `import x from "./x.json"` |
| `verbatimModuleSyntax` | `false` | 照字面保留 import/export |
| `isolatedModules` | `false` | 强制每文件可独立转译 |
| `isolatedDeclarations` | `false` | 可并行产出 `.d.ts`（需显式返回类型） |

### 类型检查（strict 全家桶）

`strict: true`（**6.0 默认**）= 一次开启：

| 子项 | 拦截 |
|---|---|
| `strictNullChecks` | `null`/`undefined` 误用 |
| `noImplicitAny` | 隐式 any |
| `strictFunctionTypes` | 函数参数型变 |
| `strictBindCallApply` | `bind/call/apply` 参数 |
| `strictPropertyInitialization` | 类字段未初始化 |
| `noImplicitThis` | 隐式 this |
| `useUnknownInCatchVariables` | `catch (e)` 视为 `unknown` |
| `alwaysStrict` | 产物加 `"use strict"` |

常单独叠加：`noUnusedLocals` / `noUnusedParameters` / `noFallthroughCasesInSwitch` / `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` / `noImplicitReturns`。

### 工程 / 性能

| 选项 | 说明 |
|---|---|
| `composite` | 工程引用（隐式开 `declaration` + `incremental`） |
| `incremental` / `tsBuildInfoFile` | 增量编译及其缓存文件 |
| `skipLibCheck` | 跳过 `.d.ts` 互检（提速利器） |
| `assumeChangesOnlyAffectDirectDependencies` | watch 下激进失效策略 |

### 6.0 迁移相关

| 选项 | 说明 |
|---|---|
| `ignoreDeprecations: "6.0"` | 临时压制弃用项报错（**7.0 移除**） |
| `stableTypeOrdering` | 稳定类型排序，辅助 6.0→7.0 比对 |

## 与各工具的分工速记

| 任务 | 谁来做 |
|---|---|
| 类型检查 | **只有 tsc**（`tsc --noEmit`） |
| 快速 emit `.js` | SWC / esbuild / Babel（剥类型，不检查） |
| 产出 `.d.ts` | tsc `--emitDeclarationOnly`；或开 `isolatedDeclarations` 后由 SWC/oxc/tsgo 并行产出 |
| 打包 / polyfill | 打包器 + core-js（tsc 不管） |
| 原生加速 | TS 7.0 `tsgo`（Go 重写，约 10×，预览中） |

## 版本现状（2026-06）

| 包 | dist-tag | 版本 |
|---|---|---|
| `typescript` | `latest` | **6.0.x**（最后的 JS 实现版） |
| `@typescript/native-preview` | `latest` | **7.0.0-dev.\***（Go 原生，预览） |
