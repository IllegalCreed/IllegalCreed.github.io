---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 Stylelint v17.13.0 编写

## 速查

- 配置文件（cosmiconfig 向上查找）：`stylelint.config.js`/`.mjs`/`.cjs`/`.ts`（推荐）、`.stylelintrc.json`/`.yml`/`.js`（旧式）、`package.json` 的 `stylelint` 字段
- 顶层字段：`extends` / `plugins` / `rules` / `customSyntax` / `overrides` / `defaultSeverity` / `ignoreFiles` / `cache` / `report*Disables` / `allowEmptyInput`
- 规则值：`null` 关闭 · `true` 默认开启 · `["主选项", { 次选项 }]` 带选项开启
- 次选项：`severity`（warning/error）· `message` · `url` · `disableFix` · `reportDisables`
- 严重级默认 `error`；用 `defaultSeverity` 改默认，用次选项 `severity` 改单条
- `extends` 数组**后者覆盖前者**；`overrides` 按 `files` glob 分文件覆盖
- 命令行 `--config <file>` 可指定配置；`--print-config <file>` 查看某文件最终生效配置

## 配置文件与查找顺序

Stylelint 用 cosmiconfig 从当前目录**向上查找**，支持多种文件名与格式：

```text
stylelint.config.js   (推荐)
stylelint.config.mjs / .cjs / .ts
.stylelintrc.js / .cjs / .mjs       (旧式)
.stylelintrc.json / .yml / .yaml    (旧式)
package.json 中的 "stylelint" 字段   (旧式)
```

用 `--config <file>` 或 Node API 的 `configFile` 可跳过查找、强制指定。

## rules：核心检查项

`rules` 决定 linter 检查什么。100+ 规则**默认全关**，值有三种形态：

```json
{
  "rules": {
    "block-no-empty": null,
    "color-no-invalid-hex": true,
    "unit-allowed-list": ["em", "rem", "%"],
    "selector-pseudo-class-no-unknown": [true, { "ignorePseudoClasses": ["global"] }]
  }
}
```

- `null`：关闭该规则（常用于覆盖 `extends` 来的规则）
- `true`：用默认设置开启
- `["主选项", { 次选项 }]`：主选项（如 `"never"` 或具体值）+ 次选项对象

### 次选项（secondary options）

数组第二项是次选项，用于细化行为或元信息：

| 次选项           | 作用                                       |
| ---------------- | ------------------------------------------ |
| `severity`       | `"warning"` / `"error"`（默认 error）      |
| `message`        | 自定义提示（字符串或函数）                 |
| `url`            | 关联外部文档链接                           |
| `disableFix`     | 对该规则单独关闭 `--fix` 自动修复          |
| `reportDisables` | 把针对该规则的 `stylelint-disable` 报为错误 |
| `ignore*` 等     | 各规则特有的忽略列表                       |

```json
{
  "rules": {
    "block-no-empty": [true, { "severity": "warning" }]
  }
}
```

## extends：继承共享配置

```json
{
  "extends": ["stylelint-config-standard", "./my-config"],
  "rules": { "alpha-value-notation": "number" }
}
```

`extends` 支持数组，**后面的覆盖前面的**，本地 `rules` 再覆盖继承来的。用于复用官方/团队共享配置。

## plugins：加载第三方规则

```json
{
  "plugins": ["stylelint-order"],
  "rules": { "order/properties-alphabetical-order": true }
}
```

插件提供核心之外的规则；装了插件还要在 `rules` 里显式开启其规则（通常带命名空间前缀，如 `order/...`、`scss/...`）。详见 [规则与插件](./rules-and-plugins.md)。

## customSyntax：自定义语法

指定 PostCSS 兼容的解析器，用于 SCSS / Less / CSS-in-JS 等非标准 CSS：

```json
{ "customSyntax": "postcss-scss" }
```

更常见是用 `overrides` 按文件类型分别指定，见下。

## overrides：分文件覆盖

```json
{
  "rules": { "alpha-value-notation": "number" },
  "overrides": [
    {
      "files": ["*.scss", "**/*.scss"],
      "customSyntax": "postcss-scss"
    },
    {
      "files": ["components/**/*.css"],
      "rules": { "alpha-value-notation": "percentage" }
    }
  ]
}
```

每个 override 必须含 `files`（glob）且至少一项配置。这是同一仓库里混用 `.css` 与 `.scss` 的标准做法。

## defaultSeverity 与 report\*Disables

```json
{
  "defaultSeverity": "warning",
  "reportNeedlessDisables": true,
  "reportInvalidScopeDisables": true,
  "reportDescriptionlessDisables": true
}
```

- `defaultSeverity`：未显式声明 severity 的规则的默认级别
- `reportNeedlessDisables`：报告**没有实际阻止违规**的多余 disable 注释
- `reportInvalidScopeDisables`：报告禁用了**配置里不存在**的规则
- `reportDescriptionlessDisables`：报告**缺少理由说明**的 disable 注释

## ignoreFiles / cache / allowEmptyInput

```json
{
  "ignoreFiles": ["**/*.js", "dist/**"],
  "cache": true,
  "allowEmptyInput": true
}
```

- `ignoreFiles`：glob 忽略文件（`node_modules` 默认已忽略）
- `cache`：缓存结果只查变更文件（默认缓存到 `./.stylelintcache`）
- `allowEmptyInput`：glob 没匹配到文件时不报错

字段与命令行参数的完整清单见 [参考](../reference.md)。
