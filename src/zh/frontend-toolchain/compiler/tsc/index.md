---
layout: doc
---

# tsc

TypeScript 官方编译器（**TypeScript Compiler**），对带类型标注的 `.ts` / `.tsx` 源码做两件事：**类型检查（type-checking）** 与 **产出 JavaScript（emit）**。它是 TypeScript 语言的参考实现，也是整个生态里**唯一做完整跨文件类型检查**的工具——Babel / SWC / esbuild / Oxc 都只能「剥掉类型」逐文件转译，发现不了类型错误。tsc 由 `tsconfig.json` 驱动，核心选项围绕 **target（降级目标）/ module（模块格式）/ strict（严格类型）/ outDir（产物目录）/ declaration（`.d.ts` 声明）** 展开；`tsc --noEmit` 只检查不产出、`tsc -b` 借 project references 做增量构建、`tsc -w` 监听。**2026 年它正处历史转折点**：**TypeScript 6.0** 是最后一个 JavaScript 实现版本（已默认 `strict: true`，弃用 `es5`、移除 `amd`/`umd`/`systemjs`），而 **TypeScript 7.0「tsgo」** 用 **Go 原生重写**（即 Project Corsa），官方实测 VS Code 1.5M 行代码检查从 77.8s 降到 7.5s（约 **10×**），目前以 `@typescript/native-preview` 预览，稳定版近在眼前。

## 评价

**优点**

- **唯一权威的类型检查**：tsc 是 TS 语言的参考实现，类型系统语义以它为准；只有它做完整的跨文件类型推断与检查，是类型安全的最终裁判
- **声明文件 `.d.ts` 生成**：`declaration` + `declarationMap` 自动产出类型声明，是库作者对外发布类型的标准方式
- **`strict` 系列严格检查**：`strictNullChecks` / `strictFunctionTypes` / `noImplicitAny` 等一组开关把空值、隐式 any、函数型变等隐患在编译期拦下（TS 6.0 起默认开启）
- **tsconfig 表达力强**：`target` / `module` / `moduleResolution` / `paths` / project references 覆盖从单文件脚本到大型 monorepo 的编译需求
- **Project References + 增量**：`tsc -b` 配合 `composite` + `incremental`（`.tsbuildinfo`）让大仓库分块、增量、并按依赖顺序构建
- **编辑器体验的根基**：VS Code 等 IDE 的类型提示、跳转、重命名、错误波浪线全靠与 tsc 同源的 `tsserver`
- **紧跟 ECMAScript**：新语法与新内置类型（如 ES2025 的 Temporal、`Map.getOrInsert`、`RegExp.escape`）第一时间提供类型支持
- **官方稳定**：微软维护，语义稳定，是整个 TypeScript 工具链的「上游真相源」

**缺点**

- **慢**：纯 JavaScript、单线程实现，大项目「类型检查 + emit」耗时长（VS Code 1.5M 行约 77s），这正是 TS 7.0 改用 Go 重写的直接动因
- **构建链里常被「拆开用」**：相比只剥类型的 SWC/esbuild，tsc 又检查又 emit 较重，工程上常退化为「SWC/esbuild 负责 emit + `tsc --noEmit` 只做类型检查」
- **类型与 emit 耦合的历史包袱**：默认产物受类型影响（如 `const enum`、`namespace`），为给单文件转译器让路才有了 `isolatedModules` / `isolatedDeclarations` 等选项
- **不打包、不注入 polyfill**：tsc 只做语法降级与模块格式转换，不会注入 core-js polyfill、也不打包，必须配合打包器
- **选项语义微妙易踩坑**：`moduleResolution` / `verbatimModuleSyntax` / `esModuleInterop` 配错，产物的模块行为会大变
- **升级有破坏性**：TS 6.0 默认 `strict`、移除 `es5`/`amd`/`umd`/`systemjs`、弃用一批选项，老项目升级需迁移
- **版本割裂过渡期**：TS 6.0（JS 版）与 TS 7.0（Go 版 tsgo）并存，需关注 `--stableTypeOrdering`、`ignoreDeprecations` 等迁移开关

## 文档地址

[TypeScript](https://www.typescriptlang.org/)

## GitHub 地址

[microsoft/TypeScript](https://github.com/microsoft/TypeScript) ｜ 原生版 [microsoft/typescript-go](https://github.com/microsoft/typescript-go)

## 幻灯片地址

<a href="/SlideStack/tsc-slide/" target="_blank">tsc</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=tsc" target="_blank" rel="noopener noreferrer">tsc 测试题</a>
