---
layout: doc
outline: [2, 3]
---

# 快速上手

> 基于 @microsoft/api-extractor 7.58.9 / @microsoft/api-documenter 7.30.7 编写

## 速查

- 安装：`pnpm add -D @microsoft/api-extractor`；初始化配置：`api-extractor init`（生成带注释的 `api-extractor.json`）
- 两步构建：先 `tsc` 生成 `.d.ts`，再 `api-extractor run --local --verbose` 分析（AE 分析的是编译产物 `.d.ts`）
- tsconfig 必开：`declaration`（产 AE 要分析的 `.d.ts`）+ `declarationMap`（报错能映射回源码行号）
- 入口必填字段：`mainEntryPointFilePath`，指向编译后的入口 `.d.ts`（如 `dist/index.d.ts`）
- 三大功能各自开关：`apiReport`（出 `.api.md` 报告）/ `dtsRollup`（合并 `.d.ts`）/ `docModel`（出 `.api.json`）
- `--local` = 本地构建：关闭部分发布校验 + **自动更新 `.api.md`**；**CI 千万别加 `--local`**，否则门禁失效
- 出 Markdown 文档：开 `docModel` 产 `.api.json`，再 `api-documenter markdown -i <输入> -o <输出>`
- CLI：bin 名 `api-extractor`，常用子命令 `run` 与 `init`
- 当前版本：`@microsoft/api-extractor` **7.58.9** / `@microsoft/api-documenter` **7.30.7**（内置 TypeScript **5.9.3**）

## API Extractor 不是什么

把它当"又一个文档站工具"是最常见的误解。三点澄清：

- **不是应用打包器**：它分析 `.d.ts` 出报告 / rollup / 模型，不打包运行时 JS（那是 Vite / Webpack 的事）
- **不直接出 HTML 文档站**：它产 `.api.json` 中间模型，HTML / Markdown 由 `api-documenter` 或 DocFX 渲染
- **不是 `tsc` 的子命令**：它是独立 npm 包，且**内置自带一份 TypeScript 编译器**

::: tip 一句话定位
API Extractor = 面向**库作者**的 API 分析工具，产「API 报告 + `.d.ts` rollup + 文档模型」三类输出；要一键出 HTML 站请用 TypeDoc。
:::

## 三大输出一览

| 输出 | 产物 | 用途 |
| --- | --- | --- |
| **API 报告** | `.api.md` | 公共 API 快照，进 Git、PR 出 diff，做破坏性变更评审门禁 |
| **`.d.ts` rollup** | 单个 `.d.ts` | 把多文件声明合并成单一发布声明，可按发布标签裁剪 |
| **API 文档模型** | `.api.json` | 结构化 API 模型，喂给 `api-documenter` 出 Markdown / DocFX |

## 接入项目的步骤

1. **装包 + 初始化**——`pnpm add -D @microsoft/api-extractor`，再 `api-extractor init` 生成 `api-extractor.json`
2. **配 tsconfig**——开 `declaration` 与 `declarationMap`，让 `tsc` 产出可分析的 `.d.ts` 与 `.d.ts.map`
3. **配入口与功能**——填 `mainEntryPointFilePath`，按需打开 [`apiReport` / `dtsRollup` / `docModel`](./guide-line/three-outputs.md)
4. **写进构建脚本**——先 `tsc` 后 `api-extractor run`，顺序不能颠倒
5. **（可选）出文档**——开 `docModel`，用 [`api-documenter`](./guide-line/tsdoc-and-documenter.md) 把 `.api.json` 转 Markdown

```jsonc
// api-extractor.json（最小可用示例）
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  "mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts",
  "apiReport": { "enabled": true },
  "docModel": { "enabled": true },
  "dtsRollup": {
    "enabled": true,
    "publicTrimmedFilePath": "<projectFolder>/dist/<unscopedPackageName>-public.d.ts"
  }
}
```

```bash
# 典型两步流水线
tsc
api-extractor run --local --verbose
```

## 本地 vs CI 的关键差异

- **本地**：带 `--local`。官方说明它「disables certain validation that would normally be performed for a ship/production build」，并会**自动把更新后的 `.api.md` 复制到 `etc/`**——开发者改了 API 只需本地构建一次，报告自动更新，再连同代码一起提交。
- **CI（生产）**：**不带** `--local`。此时报告若与代码不一致，构建会**失败**并提示把 `temp/*.api.md` 复制到 `etc/*.api.md`，强制开发者有意识地更新并提交报告——这正是破坏性变更门禁的强制点。

::: warning CI 不要加 --local
在 CI 里加 `--local` = 关掉发布校验 + 自动覆写报告，破坏性变更检测随之失效。CI 永远跑不带 `--local` 的 `api-extractor run`。
:::

下一步：[三大功能详解](./guide-line/three-outputs.md) · [api-extractor.json 配置](./guide-line/config-file.md) · [发布标签与评审工作流](./guide-line/release-tags-workflow.md) · [配合 TSDoc + api-documenter](./guide-line/tsdoc-and-documenter.md)
