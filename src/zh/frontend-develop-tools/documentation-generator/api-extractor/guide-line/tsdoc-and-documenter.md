---
layout: doc
outline: [2, 3]
---

# 配合 TSDoc + api-documenter 出 Markdown

> 基于 @microsoft/api-extractor 7.58.9 / @microsoft/api-documenter 7.30.7 编写

## 速查

- API Extractor 读 **TSDoc** 注释，内置依赖 `@microsoft/tsdoc`（~0.16.0）解析；AE 还是 TSDoc 标准的主要推动者
- 文档链路：源码 TSDoc → AE 产 `.api.json` → `api-documenter` 渲染成 Markdown / DocFX
- 出 Markdown：`api-documenter markdown -i <放 .api.json 的目录> -o <输出目录>`
- 出 DocFX 用 YAML：`api-documenter yaml`（DocFX 是更重但功能完整的平台，曾驱动 docs.microsoft.com）
- 多包聚合优势：各包独立产 `.api.json`，管线汇总成带**跨包超链接 + 统一导航树**的单一站点
- AE **不直接出 HTML 站**——要一键出 HTML 选 TypeDoc；AE 走 `api-documenter`/DocFX 链路

## API Extractor 与 TSDoc 的关系

AE 解析的是 **TSDoc** 注释（不是私有方言），内置依赖 `@microsoft/tsdoc` 作为参考解析器。你写的 TSDoc 标签会体现在三类输出里：

- `@param` / `@returns` / `@remarks` 等文档文字 → 进 `.api.json` 文档模型、进 `api-documenter` 出的文档
- `@public` / `@beta` / `@alpha` / `@internal` 发布标签 → 驱动 rollup 裁剪与报告分级
- 缺文档的导出 → `.api.md` 里标 `// (undocumented)`

```ts
/**
 * 把两个数相加。
 *
 * @remarks
 * 用于演示 TSDoc 注释如何流入 API 文档模型。
 *
 * @param x - 第一个加数
 * @param y - 第二个加数
 * @returns x 与 y 的和
 * @public
 */
export function add(x: number, y: number): number {
  return x + y;
}
```

> 注意 TSDoc 的 `@param` 要求"名后带连字符"（`@param x - 描述`），类型来自 TS 签名、注释里不写 `{type}`。详见 TSDoc 章节。

## 文档管线：从 .api.json 到 Markdown

第一步，在 `api-extractor.json` 开 `docModel`，跑 `api-extractor run` 产出 `.api.json`：

```jsonc
"docModel": {
  "enabled": true,
  "apiJsonFilePath": "<projectFolder>/temp/<unscopedPackageName>.api.json"
}
```

第二步，装 `api-documenter` 并把 `.api.json` 转 Markdown：

```bash
pnpm add -D @microsoft/api-documenter
# -i / --input-folder：放 .api.json 的目录；-o / --output-folder：Markdown 输出目录
api-documenter markdown -i temp -o docs/api
```

要出 DocFX 用的 YAML（更专业的站点）：

```bash
api-documenter yaml -i temp -o docs/yaml
```

## 两种输出对比

| 命令 | 产物 | 适用 |
| --- | --- | --- |
| `api-documenter markdown` | Markdown | 简单、可塞进任意 SSG（VitePress / Docusaurus） |
| `api-documenter yaml` | DocFX YAML | 专业级站点（DocFX 曾驱动 docs.microsoft.com） |

官方把两者作比喻：若 Markdown 是基础方案，则 “DocFX is the 'space shuttle'”——功能完整但更重的文档平台。

## 多包（monorepo）聚合

官方原话：“This allows a collection of related projects to be built separately ... uses them to generate a single website, complete with cross-package hyperlinks and an integrated navigation tree.” 各包可在不同仓库 / 工具链下独立构建各自的 `.api.json`，文档管线再把它们**汇总成带跨包超链接和统一导航树的单一站点**——这是单包文档工具难做到的。

## 编程消费 `.api.json`

除了 `api-documenter`，任何想程序化遍历 API 模型的工具都可用 `@microsoft/api-extractor-model`（当前 7.33.8）把 `.api.json` 反序列化成 `ApiPackage` / `ApiClass` / `ApiMethod` 等对象模型，自行生成文档或做分析。

::: tip 选型提示
要"一键把 TS 项目变成可浏览 HTML 站"→ 用 **TypeDoc**。要"API 契约门禁 + 单一声明文件 + 可定制文档管线"→ 用 **API Extractor**（+ `api-documenter`/DocFX）。
:::

下一步：[三大功能详解](./three-outputs.md) · [速查参考](../reference.md)
