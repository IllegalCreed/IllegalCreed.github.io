---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 Biome v2.5.0 编写

## 速查

- 配置文件：`biome.json` / `biome.jsonc`（同目录优先 `biome.json`），放项目根，建议加 `$schema`
- 顶层字段：`root` / `extends` / `files` / `vcs` / `formatter` / `linter` / `assist` / `javascript`·`json`·`css`·`graphql`·`html` / `overrides` / `plugins`
- 格式化默认：`indentStyle: tab`、`indentWidth: 2`、`lineWidth: 80`、`lineEnding: lf`
- JS 格式化默认：`quoteStyle: double`、`semicolons: always`、`trailingCommas: all`、`arrowParentheses: always`
- 文件范围：`files.includes`，`!` 取反排除、`!!` 强制忽略
- linter 组：`accessibility` / `complexity` / `correctness` / `nursery` / `performance` / `security` / `style` / `suspicious`
- 严重级：`off` / `info` / `warn` / `error`（`on` = 默认级）
- monorepo：子包配置设 `root: false` + `extends` 继承；`vcs.useIgnoreFile` 复用 `.gitignore`

## 配置文件

放在项目根，推荐声明 schema 获得补全：

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json"
}
```

Biome 会向上自动发现最近的 `biome.json` / `biome.jsonc`；同目录两者并存时优先 `biome.json`。

## formatter：格式化

语言无关的格式化选项放顶层 `formatter`：

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 80,
    "lineEnding": "lf"
  }
}
```

| 选项          | 默认   | 说明                         |
| ------------- | ------ | ---------------------------- |
| `indentStyle` | `tab`  | `tab` 或 `space`             |
| `indentWidth` | `2`    | 每级缩进宽度                 |
| `lineWidth`   | `80`   | 换行列宽                     |
| `lineEnding`  | `lf`   | `lf` / `crlf` / `cr`         |

::: warning 缩进默认是 tab
这与 Prettier 默认用空格不同，是从 Prettier 迁移时最常见的差异。要用空格设 `"indentStyle": "space"`。
:::

## 语言专属：javascript / json / css …

语言专属选项放对应节点下（如 `javascript.formatter`）：

```json
{
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  },
  "json": {
    "parser": { "allowComments": true },
    "formatter": { "trailingCommas": "none" }
  },
  "css": {
    "formatter": { "enabled": true, "quoteStyle": "double" }
  }
}
```

- JS `quoteStyle` 默认 `double`、`semicolons` 默认 `always`、`trailingCommas` 默认 `all`
- `css` / `graphql` / `html` 的 formatter 默认**关闭**，需显式 `enabled: true`

## linter：代码检查

规则按 8 个组（group）划分，可按组设级别，也可在组内精确控制单条规则：

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": "warn",
      "suspicious": {
        "noDebugger": "error",
        "noConsole": "off"
      },
      "style": {
        "useNamingConvention": {
          "level": "error",
          "options": { "strictCase": false }
        }
      }
    }
  }
}
```

- 规则组：`accessibility`、`complexity`、`correctness`、`nursery`、`performance`、`security`、`style`、`suspicious`
- 严重级：`off` / `info` / `warn` / `error`，`on` 表示“按规则默认级开启”
- `recommended: false` 可一次性关掉全部推荐规则
- 规则命名：`use*` 强制/建议某写法，`no*` 禁止某写法

详见 [lint 与 format](./lint-and-format.md)。

## assist：代码助手

Assist 提供**无诊断的代码操作**（如整理 import、排序对象键）。v2 起“整理 import”归入 Assist 的 `source` 组：

```json
{
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

详见 [类型感知与 Assist](./type-aware-and-assist.md)。

## files 与 vcs

```json
{
  "files": {
    "includes": ["src/**", "test/**", "!**/*.generated.ts"],
    "ignoreUnknown": false,
    "maxSize": 1048576
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

- `files.includes`：glob 列表，`!` 前缀取反排除、`!!` 前缀强制忽略（v2 统一了 v1 的 include/ignore 写法）
- `vcs.useIgnoreFile: true`：读取 `.gitignore` 并跳过其中文件

## overrides：分文件覆盖

按 `includes` glob 对特定文件应用不同配置：

```json
{
  "overrides": [
    {
      "includes": ["generated/**"],
      "formatter": { "lineWidth": 160 },
      "linter": {
        "rules": { "suspicious": { "noDebugger": "off" } }
      }
    }
  ]
}
```

## plugins：GritQL 插件

用 GritQL 编写的自定义规则，在 `plugins` 中声明：

```json
{
  "plugins": [
    { "path": "./rules/no-foo.grit", "includes": ["src/**"] }
  ]
}
```

## extends 与 monorepo

- `extends`：继承其它配置（按从最不相关到最相关的顺序应用），可用 `"//"` 指向 monorepo 根
- 子包放各自的 `biome.json`，设 `root: false` 表明它不是顶层根，再 `extends` 继承共享配置——既复用又能局部覆盖

```json
{
  "root": false,
  "extends": "//",
  "linter": { "rules": { "style": { "noShoutyConstants": "off" } } }
}
```

字段与默认值的完整清单见 [参考](../reference.md)。
