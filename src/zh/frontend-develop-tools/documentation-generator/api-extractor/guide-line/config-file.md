---
layout: doc
outline: [2, 3]
---

# api-extractor.json 配置详解

> 基于 @microsoft/api-extractor 7.58.9 编写

## 速查

- 配置文件 `api-extractor.json`，可用 `api-extractor init` 生成带注释模板
- **必填**：`mainEntryPointFilePath`，指向入口 `.d.ts`（编译产物，非源码 `.ts`）
- **跨项目复用**：`extends` 继承另一份配置（`./`/`../` 按相对路径，否则首段当 npm 包名）
- **路径 token**：`<projectFolder>` / `<packageName>` / `<unscopedPackageName>`
- 三大功能节：`apiReport` / `docModel` / `dtsRollup`，各有 `enabled` 开关
- 其它顶层字段：`projectFolder`、`bundledPackages`、`newlineKind`(lf/crlf/os)、`enumMemberOrder`、`compiler`、`tsdocMetadata`
- 诊断分三类：编译器(`TS*`) / Extractor(`ae-*`) / TSDoc(`tsdoc-*`)，在 `messages` 节配 `logLevel` 与 `addToApiReportFile`

## 顶层结构

```jsonc
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  "extends": "./shared/base-extractor.json",      // 可选：继承共享配置
  "projectFolder": "..",                            // 可选：项目根
  "mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts", // 必填：入口 .d.ts
  "bundledPackages": [],                            // 内联进 rollup 的依赖包名
  "newlineKind": "lf",                              // 输出换行符：lf/crlf/os
  "compiler": { /* TS 编译相关 */ },
  "apiReport":  { "enabled": true },
  "docModel":   { "enabled": true },
  "dtsRollup":  { "enabled": true },
  "tsdocMetadata": { /* tsdoc-metadata.json 生成 */ },
  "messages": { /* 诊断消息处理 */ }
}
```

## 关键字段

### `mainEntryPointFilePath`（必填）

分析的起点：AE 从这个**入口 `.d.ts`** 追踪所有导出、构建 API 模型。注意它指向编译产物（如 `dist/index.d.ts`），不是 `src/index.ts`——因为 AE 分析的是声明文件。

### `extends`（跨项目共享）

官方：“Optionally specifies another JSON config file that this file extends from. This provides a way for standard settings to be shared across multiple projects.” monorepo 里把通用配置抽到一个共享包 / 文件，各项目 `extends` 它，避免每个包重复配置。

### 路径 token

写路径时用 token 比硬编码包名更通用、可被 `extends` 的基线复用：

| token | 含义 |
| --- | --- |
| `<projectFolder>` | 项目根目录 |
| `<packageName>` | 完整含 scope 的包名（如 `@scope/pkg`） |
| `<unscopedPackageName>` | 去掉 scope 的包名（如 `pkg`） |

### `newlineKind`

控制输出文件（`.api.md`、rollup `.d.ts`）的行尾，取值 `lf` / `crlf` / `os`。跨平台团队**固定为 `lf`** 可避免因 CRLF/LF 差异让 `.api.md` 出现整文件无意义 diff。

### `bundledPackages`

列出"应被当作本包一部分"的 npm 包名——入口 `.d.ts` 引用到这些依赖的类型时，AE 在 rollup 时把它们的声明**内联**进来，而不是留 `import`。

## 诊断消息（`messages` 节）

AE 把消息按来源分**三类**：

| 类别 | 标识前缀 | 来源 | 配置子节 |
| --- | --- | --- | --- |
| 编译器消息 | `TS`（如 `TS2551`） | TypeScript 编译器 | `compilerMessageReporting` |
| Extractor 消息 | `ae-`（如 `ae-forgotten-export`） | AE 分析自身 | `extractorMessageReporting` |
| TSDoc 消息 | `tsdoc-`（如 `tsdoc-link-tag-unescaped-text`） | TSDoc 解析器 | `tsdocMessageReporting` |

每条消息规则两个控制项：

- `logLevel`：`error`（构建失败）/ `warning`（**生产构建**失败、本地仅告警）/ `none`（静默）
- `addToApiReportFile`：开启后把该消息写进 `.api.md` 报告（而非只打日志）。许多 `ae-` 消息默认就用它

```jsonc
"messages": {
  "compilerMessageReporting": {
    "default": { "logLevel": "warning" }
  },
  "extractorMessageReporting": {
    "default": { "logLevel": "warning" },
    // 缺发布标签时直接报错卡 CI
    "ae-missing-release-tag": { "logLevel": "error" },
    // 未导出符号写进报告而不打断构建
    "ae-forgotten-export": { "logLevel": "none", "addToApiReportFile": true }
  },
  "tsdocMessageReporting": {
    "default": { "logLevel": "warning" }
  }
}
```

::: tip warning 的"两面性"
`warning` 在**生产构建**（CI 不带 `--local`）会导致失败，在**本地构建**只告警。把"想在 CI 卡住、本地放行"的规则设为 `warning`，能兼顾严格与开发体验。
:::

下一步：[发布标签与评审工作流](./release-tags-workflow.md) · [配合 TSDoc + api-documenter](./tsdoc-and-documenter.md)
