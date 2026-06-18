---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 @microsoft/api-extractor 7.58.9 / @microsoft/api-documenter 7.30.7 编写

## 速查

- 三大输出：**API 报告**(`.api.md`) / **`.d.ts` rollup**(单声明) / **文档模型**(`.api.json`)，各自独立开关
- 两步流水线：`tsc` → `api-extractor run --local --verbose`；tsconfig 开 `declaration` + `declarationMap`
- 配置 `api-extractor.json`，必填 `mainEntryPointFilePath`；`extends` 复用、token `<projectFolder>`/`<packageName>`/`<unscopedPackageName>`
- 发布标签 `@public`/`@beta`/`@alpha`/`@internal`：裁剪三档累积 public ⊂ beta ⊂ alpha ⊂ untrimmed
- `--local`=本地（关校验+自动覆写报告）；**CI 不带 `--local`**，报告与代码不一致即失败
- 诊断三类：`TS*` / `ae-*` / `tsdoc-*`，`messages` 节配 `logLevel`(error/warning/none) + `addToApiReportFile`
- 文档：开 `docModel` → `api-documenter markdown -i -o`（或 `yaml` 给 DocFX）
- 版本：`api-extractor` **7.58.9** / `api-documenter` **7.30.7** / `api-extractor-model` **7.33.8** / 内置 TS **5.9.3**

## CLI 速查

```bash
api-extractor init                       # 生成带注释的 api-extractor.json 模板
api-extractor run --local --verbose      # 本地构建：自动更新 .api.md
api-extractor run                        # CI/生产：报告不一致即失败
api-documenter markdown -i temp -o docs  # 把 .api.json 转 Markdown
api-documenter yaml -i temp -o docs      # 转 DocFX 用的 YAML
```

| 标志 | 说明 |
| --- | --- |
| `-c FILE` / `--config` | 指定 `api-extractor.json` 路径，而非自动猜测 |
| `-l` / `--local` | 本地构建：关闭部分发布校验，自动复制 `.api.md` |
| `-v` / `--verbose` | 输出更多信息 |
| `--diagnostics` | 输出排障诊断信息（同时启用 `--verbose`） |
| `--typescript-compiler-folder PATH` | 指定项目自己的 TS 编译器目录（默认 AE 用自带版本） |

## api-extractor.json 字段速查

| 字段 | 作用 |
| --- | --- |
| `mainEntryPointFilePath` | **必填**，入口 `.d.ts`（编译产物） |
| `extends` | 继承共享配置（跨项目复用） |
| `projectFolder` | 项目根目录 |
| `bundledPackages` | 内联进 rollup 的依赖包名 |
| `newlineKind` | 输出换行符：`lf` / `crlf` / `os` |
| `apiReport.enabled` | 开 `.api.md` 报告 |
| `docModel.enabled` / `apiJsonFilePath` | 开 `.api.json`（默认 `temp/<unscopedPackageName>.api.json`） |
| `dtsRollup.enabled` | 开声明合并 |
| `dtsRollup.untrimmedFilePath` | 未裁剪基线（含全部） |
| `dtsRollup.publicTrimmedFilePath` | 仅 `@public` |
| `dtsRollup.betaTrimmedFilePath` | `@public` + `@beta` |
| `dtsRollup.alphaTrimmedFilePath` | `@public` + `@beta` + `@alpha` |
| `dtsRollup.omitTrimmingComments` | 删除被裁声明而非注释占位 |
| `messages` | 三类诊断消息处理 |

## 发布标签与裁剪档

| 标签 | 含义 | publicTrimmed | betaTrimmed | alphaTrimmed | untrimmed |
| --- | --- | :-: | :-: | :-: | :-: |
| `@public` | 正式公共 API | ✅ | ✅ | ✅ | ✅ |
| `@beta` | 公开但可能变 | ❌ | ✅ | ✅ | ✅ |
| `@alpha` | 早期预览 | ❌ | ❌ | ✅ | ✅ |
| `@internal` | 内部实现 | ❌ | ❌ | ❌ | ✅ |

## 常见诊断消息

| 消息 | 类别 | 含义 |
| --- | --- | --- |
| `ae-forgotten-export` | Extractor | 公共 API 引用了未从入口导出的符号（默认写进报告，不打断构建） |
| `ae-missing-release-tag` | Extractor | 导出成员缺发布标签 |
| `ae-extra-release-tag` | Extractor | 一个成员标了多个发布标签（冲突） |
| `tsdoc-link-tag-unescaped-text` | TSDoc | TSDoc 链接标签里有未转义文本 |
| `TS2551` 等 | 编译器 | TypeScript 编译器诊断 |

## 工具链坐标

| 工具 | 定位 |
| --- | --- |
| **TSDoc** | 注释语法标准（规定怎么写注释，不产出） |
| **API Extractor** | 库作者向 API 分析：报告 / rollup / 文档模型 |
| **api-documenter** | 消费 `.api.json` 出 Markdown / DocFX |
| **TypeDoc** | 端到端文档站生成器（一键出 HTML） |

## 版本与生态

| 包 | 版本 | 角色 |
| --- | --- | --- |
| `@microsoft/api-extractor` | 7.58.9 | 主分析工具（bin `api-extractor`） |
| `@microsoft/api-documenter` | 7.30.7 | 把 `.api.json` 转 Markdown / DocFX |
| `@microsoft/api-extractor-model` | 7.33.8 | 编程读取 `.api.json` 的对象模型 |
| `@microsoft/tsdoc` | ~0.16.0 | AE 内置的 TSDoc 参考解析器 |
| 内置 `typescript` | 5.9.3 | AE 自带的 TS 编译器（精确锁定） |

> 版本取数日期 2026-06-18（npm `latest`）。AE 属 Rush Stack（`microsoft/rushstack`）生态，与 Rush、Heft 同源。

## 文档与 GitHub 链接

- 官方文档：[https://api-extractor.com/](https://api-extractor.com/)
- GitHub 仓库：[https://github.com/microsoft/rushstack](https://github.com/microsoft/rushstack)

返回：[三大功能](./guide-line/three-outputs.md) · [配置文件](./guide-line/config-file.md) · [发布标签与工作流](./guide-line/release-tags-workflow.md) · [TSDoc + api-documenter](./guide-line/tsdoc-and-documenter.md)
