---
layout: doc
outline: [2, 3]
---

# 配置与生态

> 基于 @microsoft/tsdoc 0.16.0 / @microsoft/tsdoc-config 0.18.1 / eslint-plugin-tsdoc 0.5.2 编写

## 速查

- 自定义标签写在根目录 **`tsdoc.json`**，由 **`@microsoft/tsdoc-config`** 加载（解析器本体不读配置文件）
- 四个核心字段：`$schema`（指向 JSON Schema，给编辑器校验/补全）、`extends`（继承另一份 tsdoc.json）、`tagDefinitions`（定义自定义标签）、`supportForTags`（启用/禁用已定义标签）
- `tagDefinitions` 每项要给 `tagName`（如 `@myTag`）和 `syntaxKind`（`block` / `modifier` / `inline`）
- 生态三包：`@microsoft/tsdoc`（解析器）、`@microsoft/tsdoc-config`（读 tsdoc.json）、`eslint-plugin-tsdoc`（CI 合规）
- CI 强制注释合规：装 `eslint-plugin-tsdoc`，开 `tsdoc/syntax` 规则
- monorepo 共用一套标签：各子包 `tsdoc.json` 用 `extends` 继承一份基准配置

## `tsdoc.json` 配置文件

TSDoc 解析器本体不读配置——是 `@microsoft/tsdoc-config` 负责发现并加载项目根的 `tsdoc.json`，把里面声明的自定义标签喂给解析器。典型样例：

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "extends": ["./base/tsdoc.json"],
  "tagDefinitions": [
    { "tagName": "@myBlockTag", "syntaxKind": "block" },
    { "tagName": "@myModifier", "syntaxKind": "modifier" }
  ],
  "supportForTags": {
    "@myBlockTag": true,
    "@myModifier": true
  }
}
```

### 字段详解

| 字段 | 作用 |
| --- | --- |
| `$schema` | 指向 TSDoc 官方 JSON Schema；编辑器据此做校验与补全 |
| `extends` | 继承一个或多个其它 `tsdoc.json`（路径或包引用），实现配置复用 |
| `tagDefinitions` | 声明自定义标签数组；每项含 `tagName`（`@` 起首）与 `syntaxKind`（`block`/`modifier`/`inline`） |
| `supportForTags` | 一个"标签名 → 布尔"映射，**启用 / 禁用**已定义的标签 |

::: tip syntaxKind 就是三种标签类型
`tagDefinitions` 里的 `syntaxKind` 取值正是[标签三类](./tag-kinds.md)：`block` / `modifier` / `inline`——定义自定义标签时要先想清它属哪类。
:::

## 生态三件套

| 包 | 版本 | 角色 |
| --- | --- | --- |
| `@microsoft/tsdoc` | **0.16.0** | 参考解析器，把注释解析成 AST / `DocNode`，供工具消费 |
| `@microsoft/tsdoc-config` | **0.18.1** | 发现并加载 `tsdoc.json`，把自定义标签定义应用到解析器 |
| `eslint-plugin-tsdoc` | **0.5.2** | ESLint 插件，提供 `tsdoc/syntax` 规则，在 lint 阶段校验注释是否合规 |

## 用 `eslint-plugin-tsdoc` 做门禁

想在 CI 里强制"所有注释都符合 TSDoc 语法、否则报错"，装插件并开 `tsdoc/syntax`：

```bash
pnpm add -D eslint-plugin-tsdoc
```

```js
// eslint.config.js（Flat Config）
import tsdoc from "eslint-plugin-tsdoc";

export default [
  {
    plugins: { tsdoc },
    rules: {
      "tsdoc/syntax": "warn", // 注释不合规则告警（可设 "error" 卡 CI）
    },
  },
];
```

它会挑出诸如"`@param` 缺连字符""未知标签未在 `tsdoc.json` 登记"之类的问题。

::: warning 未登记的未知标签会被报错
解析器遇到未在标准集、也未在 `tsdoc.json` 的 `tagDefinitions` 里登记的标签，会判为语法问题。要用自定义标签，先在 `tsdoc.json` 声明。
:::

## monorepo 共用配置

多包仓库想让所有子包共用同一套自定义标签与开关：在仓库根（或一个共享包）放一份基准 `tsdoc.json`，各子包的 `tsdoc.json` 用 `extends` 继承它即可，避免每个包重复声明。

```json
{
  "extends": ["../../tsdoc-base.json"],
  "tagDefinitions": [{ "tagName": "@pkgOnlyTag", "syntaxKind": "modifier" }]
}
```

下一步：[速查参考](../reference.md)
