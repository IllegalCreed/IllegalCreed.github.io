---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 oxlint v1.70.0 编写

## 速查

- 配置文件：`.oxlintrc.json`（`oxlint --init` 生成），建议加 `$schema` 获得补全
- 顶层字段：`categories` / `rules` / `plugins` / `jsPlugins` / `overrides` / `extends` / `env` / `globals` / `settings` / `ignorePatterns`
- 规则类别：`correctness` / `suspicious` / `pedantic` / `perf` / `style` / `restriction` / `nursery`
- 严重级：`off` / `warn` / `error`（等价 `allow` / `warn` / `deny`）
- 带选项：`"eslint/prefer-const": ["error", { "destructuring": "any" }]`
- `plugins` 字段会**整体替换**默认插件集，要开的必须列全
- `overrides` 按 `files` glob 分文件覆盖；子目录放 `.oxlintrc.json` 实现 monorepo 嵌套配置

## 配置文件

`.oxlintrc.json` 放在项目根，推荐声明 schema：

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json"
}
```

## categories：按类别批量开关

oxlint 把 800+ 规则按"意图"分到几个类别，可整组开关：

| 类别          | 含义                               | 默认   |
| ------------- | ---------------------------------- | ------ |
| `correctness` | 几乎可以肯定是 bug 的代码          | **on** |
| `suspicious`  | 很可能有问题、值得怀疑             | off    |
| `pedantic`    | 严格规则，可能有误报               | off    |
| `perf`        | 运行时性能改进                     | off    |
| `style`       | 风格一致性                         | off    |
| `restriction` | 禁用某些具体写法/特性              | off    |
| `nursery`     | 实验性、尚不稳定的规则             | off    |

```json
{
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "pedantic": "off"
  }
}
```

## rules：精确控制单条规则

规则名带插件前缀（核心规则前缀为 `eslint`）：

```json
{
  "rules": {
    "no-debugger": "error",
    "eslint/prefer-const": ["error", { "destructuring": "any" }],
    "typescript/no-explicit-any": "warn",
    "unicorn/no-array-for-each": "off"
  }
}
```

严重级两套写法等价：`off`/`warn`/`error` 与 `allow`/`warn`/`deny`。`rules` 的优先级高于 `categories`。

## plugins：开启插件

```json
{
  "plugins": ["typescript", "unicorn", "oxc", "import", "jsx-a11y"]
}
```

::: warning plugins 会整体替换默认
默认启用的是一组常用插件（如 `react`、`unicorn`、`typescript`、`oxc`）。一旦显式写 `plugins`，默认集就被覆盖——想保留的必须一并列出。
:::

## env 与 globals

```json
{
  "env": { "browser": true, "node": true, "es2024": true },
  "globals": { "MY_GLOBAL": "readonly", "Promise": "off" }
}
```

`globals` 取值：`"readonly"` / `"writable"` / `"off"`。

## overrides：分文件覆盖

```json
{
  "rules": { "no-console": "error" },
  "overrides": [
    {
      "files": ["scripts/*.js"],
      "rules": { "no-console": "off" }
    },
    {
      "files": ["**/*.test.ts"],
      "plugins": ["jest"],
      "env": { "jest": true }
    }
  ]
}
```

## extends 与嵌套配置

- `extends`：继承其它配置文件，便于抽出团队共享 config。
- **嵌套配置**：在子目录放各自的 `.oxlintrc.json`，oxlint 会对每个文件采用离它最近的配置——对 monorepo 很友好，无需把所有规则塞进根配置。

字段与默认值的完整清单见 [参考](../reference.md)。
