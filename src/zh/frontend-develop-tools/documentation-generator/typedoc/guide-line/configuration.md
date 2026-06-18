---
layout: doc
outline: [2, 3]
---

# 配置详解

> 基于 TypeDoc 0.28.x 编写

## 速查

- 配置文件自动发现：`typedoc.json` / `typedoc.jsonc` / `typedoc.config.{js,cjs,mjs}` / package.json 的 `typedocOptions` / tsconfig.json 的 `typedocOptions`
- 加 `"$schema": "https://typedoc.org/schema.json"` 获得 JSON 智能提示
- TypeDoc **复用 tsconfig 的 `compilerOptions` / `include` / `exclude`** 决定编译范围；`compilerOptions` 选项**仅配置文件可用**
- `entryPointStrategy` 四值：`resolve`（默认）/ `expand` / `packages`（monorepo）/ `merge`
- **易混点**：typedoc 的 `exclude` 只决定"哪些不当入口"，**不改 TS 编译范围**——要彻底不编译改 tsconfig 的 `exclude`
- 可见性：`excludePrivate`（默认 **true**）/ `excludeProtected`（默认 false）/ `excludeInternal`（跟随 TS `stripInternal`）/ `excludeExternals`（默认 false）
- 校验：`validation.notExported`（默认 true）/ `invalidLink`（true）/ `notDocumented`（**默认 false**）；CI 门禁用 `treatValidationWarningsAsErrors`
- `intentionallyNotExported` 在 0.28 起用**包相对路径**（不再绝对路径）

## 配置文件与三处来源

支持的配置文件格式（自动发现）：`typedoc.json`、`typedoc.jsonc`、`typedoc.config.js`、`typedoc.config.cjs`、`typedoc.config.mjs`、`typedoc.cjs`、`typedoc.mjs`，以及 `.config/` 目录下同名变体、`package.json` 的 `"typedocOptions"` 键、`tsconfig.json` 的 `"typedocOptions"` 键。

三处来源的层级：

1. 专用配置文件（typedoc.json 等）
2. package.json 的 `"typedocOptions"`
3. tsconfig.json 的 `"typedocOptions"`

加 `$schema` 获得编辑器智能提示：

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["./src/index.ts", "./src/secondary-entry.ts"],
  "out": "doc"
}
```

JS 配置可写函数式逻辑：

```js
/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  entryPoints: ["./src/index.ts", "./src/secondary-entry.ts"],
  out: "doc",
};
export default config;
```

::: tip 加载 tsconfig 时还会找 tsdoc.json
TypeDoc 加载 tsconfig.json 时，会在同目录顺带找 `tsdoc.json`（TSDoc 配置）。
:::

## 与 tsconfig 的关系

TypeDoc 不重新发明编译，而是**复用 tsconfig 的 `compilerOptions`、`include` / `exclude`** 决定哪些文件被编译。四个相关选项：

| 选项              | 作用                                                       |
| ----------------- | ---------------------------------------------------------- |
| `tsconfig`        | 指定要读的 tsconfig.json（默认从当前目录向上自动找）       |
| `compilerOptions` | **仅配置文件可用**，选择性覆盖 TS 编译选项（只为生成文档生效） |
| `options`         | 指定要加载的配置文件路径                                   |
| `plugin`          | 加载插件名（配置里可重复）                                 |

```json
{ "compilerOptions": { "skipLibCheck": true, "strictNullChecks": false } }
```

::: warning typedoc 的 exclude ≠ tsconfig 的 exclude
typedoc 的 `exclude` 只影响"哪些文件被当作 entry point"，**不影响 TS 编译范围**；要把文件排除出编译，得改 **tsconfig.json 的 `exclude`**。这是最常见的困惑来源。
:::

## entryPoints 与 entryPointStrategy

`entryPoints` 是要文档化的入口 glob 数组，不配时自动发现（读 package.json 的 `exports` / `main`）。`entryPointStrategy`（默认 `resolve`）决定如何解释这些入口：

| 值          | 行为                                                | 用途             |
| ----------- | --------------------------------------------------- | ---------------- |
| `resolve`（默认） | 入口须在根 tsconfig 工程内；目录入口取 `<dir>/index` | 库有单一/少数入口 |
| `expand`    | 目录被**递归展开**，每个文件都成独立入口（0.22 前是默认） | 每个文件单独出页 |
| `packages`  | 入口是含自己 package.json + typedoc 配置的**目录**，每个包独立跑再合并 | **monorepo** 主力 |
| `merge`     | 入口是之前 `--json` 跑出的 `.json` 文件，合并成一个站点 | 分阶段构建后合并 |

monorepo（`packages` 策略）实战：

```jsonc
// 根 typedoc.json
{
  "entryPointStrategy": "packages",
  "entryPoints": ["packages/*"],         // 每个子目录是一个包
  "packageOptions": {                    // 应用到每个包内部（路径相对包目录）
    "entryPoints": ["src/index.ts"]
  }
}
```

::: warning packages 策略里子包插件不加载
`entryPointStrategy: packages` 下，**子包里配置的插件不会被加载**——插件只在顶层加载，子包只继承 `packageOptions`（其中路径相对各包目录）。`merge` 策略要求 JSON 来自 0.28.0+。
:::

## 高频 options 速查

按官方分类摘录最常用的：

| 分类         | option                                                   | 默认       | 作用                       |
| ------------ | -------------------------------------------------------- | ---------- | -------------------------- |
| Config       | `tsconfig` / `compilerOptions` / `plugin` / `options`    | 自动       | 见上                       |
| Input        | `entryPoints` / `entryPointStrategy` / `packageOptions`  | `resolve`  | 入口与策略                 |
| Input        | `exclude` / `externalPattern` / `excludeExternals`       | false      | 排除文件 / 外部模块        |
| Input        | `name` / `includeVersion` / `readme` / `projectDocuments`| —          | 元信息与附加文档           |
| Input        | `disableSources` / `gitRevision` / `sourceLinkTemplate`  | —          | 源码链接                   |
| Output       | `out` / `outputs` / `json` / `pretty` / `emit`           | —          | 输出位置 / 格式            |
| Output       | `theme` / `router` / `lightHighlightTheme` / `darkHighlightTheme` | `default`/`kind` | 主题与高亮       |
| Output       | `customCss` / `customJs` / `favicon` / `navigationLinks` | —          | 站点定制与导航             |
| Organization | `categorizeByGroup` / `defaultCategory` / `sort` / `kindSortOrder` | false/Other | 分组 / 分类 / 排序 |
| Validation   | `validation` / `treatWarningsAsErrors` / `treatValidationWarningsAsErrors` | —  | 校验                       |
| Other        | `watch` / `showConfig` / `logLevel` / `skipErrorChecking` | —         | 其它                       |

::: warning --json 会静默覆盖 outputs
0.28 的 `outputs` 数组能一次运行多种输出（HTML + JSON + 自定义）。但同时配 `outputs` 和 `--json` 时，`json` 选项会**盖掉** outputs 里的对应项。排查"输出没按预期生成"先看这个。
:::

## 可见性控制

| 机制                        | 默认                              | 效果                              |
| --------------------------- | --------------------------------- | --------------------------------- |
| `excludePrivate`            | **true**                          | 去掉 `private` 成员和 `#private` 字段 |
| `excludeProtected`          | false                             | 去掉 `protected` 成员             |
| `excludeInternal`           | **跟随 TS `stripInternal`**       | 去掉 `@internal` 标记的符号       |
| `excludeExternals`          | false                             | 去掉被判为 external 的模块（配 `externalPattern`） |
| `excludeNotDocumented`      | false                             | 去掉**无注释**的符号              |
| `excludeReferences`         | false                             | 去掉已收录符号的 re-export        |
| `@hidden` / `@ignore`（标签） | —                               | **直接**移除该反射（无需开关）    |
| `visibilityFilters`（输出） | —                                 | 页面上给读者**运行时勾选**过滤    |

::: warning @internal 默认不一定被过滤
`excludeInternal` 默认**跟随 TS 的 `stripInternal`**——没在 tsconfig 设 `stripInternal` 时它是 `false`，`@internal` 符号照样出现在文档里。要么开 `stripInternal`，要么显式 `excludeInternal`。另外 `excludePrivate` 是构建期**从文档删掉**，而 `visibilityFilters` 是页面上给读者一个**勾选框**临时显隐（成员仍在 HTML 里），别混淆。
:::

## 校验（Validation）

`validation` 是对象，各子项默认：

| 子项                    | 默认      | 触发告警的情况                                |
| ----------------------- | --------- | --------------------------------------------- |
| `notExported`           | true      | 文档引用了某类型，但该类型**未被导出**（最常见） |
| `invalidLink`           | true      | `{@link}` **无法解析**                        |
| `invalidPath`           | true      | 指向相对路径的链接解析不到文件                |
| `rewrittenLink`         | true      | `{@link}` 能解析，但目标**没有唯一 URL**      |
| `notDocumented`         | **false** | 反射**没有文档注释**（默认关，开了强制写注释）|
| `unusedMergeModuleWith` | true      | `@mergeModuleWith` 未解析                     |

相关的"严格化"与"消音"选项：

```json
{
  "validation": { "notExported": true, "invalidLink": true, "notDocumented": true },
  "treatValidationWarningsAsErrors": true,
  "intentionallyNotExported": ["InternalClass", "typedoc/src/other.ts:OtherInternal"]
}
```

| 选项                              | 作用                                                |
| --------------------------------- | --------------------------------------------------- |
| `treatWarningsAsErrors`           | **任何**告警都视为致命错误，阻止生成（CI 最严门禁） |
| `treatValidationWarningsAsErrors` | 仅把**校验阶段**的告警当错误（更克制）              |
| `intentionallyNotExported`        | 白名单，消 `notExported` 告警（**0.28 起用包相对路径**） |
| `requiredToBeDocumented`          | 需要有文档的反射 kind 列表                          |
| `packagesRequiringDocumentation`（0.28 新增） | 限定哪些包要求文档，默认本包名          |
| `intentionallyNotDocumented`      | 用限定名（`Namespace.Class.prop`）选择性忽略未文档化告警 |

::: warning notExported 告警刷屏怎么办
内部辅助类型被公共 API 引用但没导出会刷 `notExported` 告警。三种对策：① 导出它；② 用 `typedoc-plugin-missing-exports` 自动收纳；③ 列进 `intentionallyNotExported`。注意 0.28 起用**包相对路径**，老写法的绝对路径会失效。
:::

## 标准库配置范本

一个可直接套用的库级 typedoc.json：

```jsonc
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["src/index.ts"],
  "out": "docs",
  "name": "My Library",
  "includeVersion": true,                 // 站点标题带 package.json 版本
  "readme": "README.md",
  "excludePrivate": true,
  "excludeInternal": true,                // 配合 @internal 过滤
  "categorizeByGroup": false,
  "sort": ["kind", "instance-first", "alphabetical-ignoring-documents"],
  "navigationLinks": { "GitHub": "https://github.com/me/lib" },
  "validation": { "notExported": true, "invalidLink": true, "notDocumented": true },
  "treatValidationWarningsAsErrors": true // CI 门禁
}
```

下一步：[注释与标签体系](./comments-tags.md) · [主题与插件](./themes-plugins.md) · [接入文档站](./docs-site.md) · [速查参考](../reference.md)
