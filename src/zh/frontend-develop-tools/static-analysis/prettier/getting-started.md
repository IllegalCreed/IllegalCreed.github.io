---
layout: doc
outline: [2, 3]
---

# 入门

## 速查

- 安装：`pnpm add -D -E prettier`
- 配置：`prettier.config.ts` / `.prettierrc`
- 集成：`eslint-config-prettier`
- Git Hooks：`husky` && `lint-staged`

## 安装

```bash
pnpm add -D -E prettier
```

::: tip 固定版本号 `--save-exact` / `-E`

确保 `package.json` 中记录的依赖版本是安装时的具体版本，而不是一个范围。不加 `--save-exact` 时，npm 会自动在版本号前加一个 `^`（caret），表示允许安装该主版本号内的更新版本。`-E` 是 `--save-exact` 的简写。

:::

> PS：如果你发现有开源项目没有固定 Prettier 版本号，果断去提PR

**创建配置文件**

```bash
node --eval "fs.writeFileSync('.prettierrc','{}\n')"
```

**创建忽略文件（可选）**

```bash
node --eval "fs.writeFileSync('.prettierignore','# Ignore artifacts:\nbuild\ncoverage\n')"
```

::: tip

如果 Prettier 运行目录中包含 `.gitignore`，则 `.gitignore` 中的规则会被默认包含，也就是说 Prettier 不会格式化 `.gitignore` 中包含的文件或目录

:::

**格式化所有文件**

```bash
pnpm exec prettier --write .
```

- --write 后跟特定文件或目录，也支持glob

**仅检查不会修改文件**

```bash
pnpm exec prettier --check .
```

## 配置

支持多种配置文件，下列为常见格式

- `.prettierrc.ts` / `prettier.config.ts` / `.prettierrc.js` / `prettier.config.js`
- `.prettierrc.json` / `.prettierrc.yaml`
- `.prettierrc.toml`
- `package.json` 中的 `"prettier"`

**示例：**

```json
// .prettierrc.json
{
  "printWidth": 80,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": false
}
```

```jsx
// prettier.config.js, .prettierrc.js, prettier.config.mjs, or .prettierrc.mjs
/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: "es5",
  tabWidth: 4,
  semi: false,
  singleQuote: true,
};

export default config;
```

```tsx
// prettier.config.ts, .prettierrc.ts, prettier.config.mts, or .prettierrc.mts
import { type Config } from "prettier";

const config: Config = {
  trailingComma: "none",
};

export default config;
```

## 集成

### 搭配编辑器

下载 Prettier 插件

- 可以通过快捷键手动执行格式化
- 可以再保存或者文件变化时自动触发格式化

::: warning

一定要在项目本地安装 prettier 的依赖，不推荐全局安装。因为插件会读取并使用你当前本地版本的 prettier 规则及配置。

:::

### 搭配ESLint

请安装  [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier#installation) 以避免不必要的冲突。

如果需要搭配 Stylelint 请使用 [stylelint-config-prettier](https://github.com/prettier/stylelint-config-prettier)

### 搭配Git Hooks

配合 `husky` 和 `lint-staged` 完成预提交格式化。

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
node --eval "fs.writeFileSync('.husky/pre-commit','pnpm exec lint-staged\n')"
```

在 `package.json` 中添加

```bash
{
  "lint-staged": {
    "**/*": "prettier --write --ignore-unknown"
  }
}
```

如果使用了 ESLint，请先执行 `eslint --fix` , 再执行 `prettier --write` 。