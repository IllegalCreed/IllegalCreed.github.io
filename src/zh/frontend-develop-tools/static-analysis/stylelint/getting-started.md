---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Stylelint v17.13.0 编写

## 速查

- 脚手架安装：`npm create stylelint@latest`（也支持 `pnpm create stylelint` / `bun create stylelint`）
- 手动安装：`npm add -D stylelint stylelint-config-standard`
- 配置文件：`stylelint.config.mjs` / `.stylelintrc.json` 等，最小内容 `{ "extends": ["stylelint-config-standard"] }`
- 运行：`npx stylelint "**/*.css"`（glob **必须用引号**包裹）
- 自动修复：`stylelint "**/*.css" --fix`
- 默认规则：**一条都不开**，靠 `extends` 共享配置起步（standard 约开一半规则）
- 检查 SCSS：`extends: ["stylelint-config-standard-scss"]`（内置 `postcss-scss`）
- 忽略文件：`.stylelintignore`（gitignore 风格），`node_modules` 默认已忽略
- 编辑器：VS Code 装官方 **stylelint** 扩展（`stylelint.vscode-stylelint`）
- 分工：格式化交给 **Prettier**，Stylelint 只管避错与非格式约定

## 安装

最快的方式是用官方脚手架，它会安装依赖并生成配置：

```bash
npm create stylelint@latest
```

也兼容 Bun / pnpm / Yarn，例如 `pnpm create stylelint`、`bun create stylelint`。

手动安装则是：

```bash
npm add -D stylelint stylelint-config-standard
```

::: tip 默认没有规则
Stylelint 内置 100+ 规则，但**默认一条都不启用**——它不像某些 linter 有“零配置默认规则集”。务必 `extends` 一份共享配置（或显式开启规则）才能真正检查到东西。
:::

## 配置文件起步

创建一份配置（推荐 `stylelint.config.mjs`）：

```javascript
/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard"],
};
```

`stylelint-config-standard` 是官方共享配置，会打开约**一半**的内置规则——一组合理的现代 CSS 约定与避错规则，作为大多数项目的起点。也支持 JSON 形式 `.stylelintrc.json`：

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "alpha-value-notation": "number"
  }
}
```

字段全貌见 [配置](./guide-line/configuration.md)。

## 运行

对 CSS 文件跑检查：

```bash
npx stylelint "**/*.css"
```

::: warning glob 一定要加引号
`"**/*.css"` 必须用引号包裹，否则会被 shell 提前展开，而不是交给 Stylelint 自己处理。写进 `package.json` 脚本时还需转义：`"lint": "stylelint \"**/*.css\""`。
:::

## 自动修复

```bash
# 自动修复可安全修复的违规（标记法、大小写、可补全写法等）
stylelint "**/*.css" --fix
```

注意 `--fix` 只能修复**部分**规则，且 Stylelint **不做格式化**——空白/缩进类排版交给 Prettier。

## 检查 SCSS / Less / CSS-in-JS

Stylelint 14 起移除了对 CSS 类语言的内置解析，需显式指定**自定义语法**。最省心的方式是 extends 对应的共享配置：

```javascript
// SCSS：内置 postcss-scss 解析器与 SCSS 专属规则
export default {
  extends: ["stylelint-config-standard-scss"],
};
```

```bash
stylelint "**/*.scss"
```

Less、Vue、CSS-in-JS 同理（`customSyntax` 或对应共享配置），详见 [规则与插件](./guide-line/rules-and-plugins.md)。

## 忽略代码

- 行内：`/* stylelint-disable-line 规则名 */`、`/* stylelint-disable-next-line 规则名 */`，或成对的 `/* stylelint-disable */ … /* stylelint-enable */`
- 文件：在项目根放 `.stylelintignore`（gitignore 风格 glob），`node_modules` 默认已忽略

详见 [忽略与禁用](./guide-line/ignore-and-disable.md)。

## 集成编辑器与 CI

- **编辑器**：VS Code 安装官方 **stylelint** 扩展，保存即时报告、支持自动 `--fix`；通常同时关闭 VS Code 内置 CSS 校验避免重复报错。
- **CI**：直接 `stylelint "**/*.css"`，发现问题以非零退出码失败；用 `--max-warnings 0` 让任何警告都失败。

详见 [集成与生态](./guide-line/integration.md)。

## 和 Prettier 的关系

二者互补、不冲突：**Prettier 管格式**（空白、缩进、换行），**Stylelint 管质量**（避错 + 非格式约定）。Stylelint 自 15 起废弃、16 起移除了所有风格类规则，因此 `stylelint-config-prettier` **不再需要**。
