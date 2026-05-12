---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 ESLint v10.3.0 编写

## 速查

- 安装：`pnpm add -D eslint @eslint/js`
- 脚手架：`pnpm create @eslint/config@latest`
- 配置文件：`eslint.config.js`（或 `.mjs` / `.cjs` / `.ts`）
- 跑检查：`pnpm exec eslint .`
- 自动修复：`pnpm exec eslint . --fix`
- 严重级：`"off"` / `0` / `"warn"` / `1` / `"error"` / `2`
- Node.js 最低：`^20.19.0` / `^22.13.0` / `>=24`

## 安装

::: tip 不推荐全局安装

ESLint 期望使用项目本地版本，插件 / 共享 config 也必须装在项目里。全局安装会导致团队 / CI 行为不一致。

:::

最快路径：用官方脚手架交互式生成基础配置：

```bash
pnpm create @eslint/config@latest
```

它会询问语言、模块系统、框架等，然后安装 `eslint`、`@eslint/js`，并写出第一份 `eslint.config.js`。

手动安装：

```bash
pnpm add -D eslint @eslint/js
```

::: warning 必装 `@eslint/js`

v9 起 `"eslint:recommended"` 这类字符串预设已被移除，必须从 `@eslint/js` 显式导入 `js.configs.recommended`。这是从 v8 升级最容易踩的坑。

:::

## Flat Config 起步

ESLint v9 起，默认配置文件是 `eslint.config.js`（或 `.mjs` / `.cjs` / `.ts` / `.mts` / `.cts`），导出一个**配置对象数组**。

最小可用配置：

```js
// eslint.config.js
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },
];
```

每个对象代表一组配置；ESLint 按数组顺序对每个文件合并所有"命中"对象的设置（后者覆盖前者）。

### 配置对象的常用字段

```js
export default [
  {
    name: "my-app/source",                       // 可选，调试用
    files: ["src/**/*.{js,ts}"],                 // 命中模式
    ignores: ["src/legacy/**"],                  // 局部排除
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { window: "readonly" },
    },
    plugins: { /* { namespace: pluginObject } */ },
    rules: {
      "no-console": "warn",
    },
  },
];
```

字段语义详见 [配置](./guide-line/configurations.md)。

### 用 `defineConfig` 获得类型提示

ESLint 自 **v9.22.0** 起从 `eslint/config` 导出 `defineConfig` 辅助函数，让 TS / IDE 能给出字段补全：

```js
import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
  js.configs.recommended,
  { rules: { "no-unused-vars": "warn" } },
]);
```

### TS 配置文件

`eslint.config.ts` / `.mts` / `.cts` 当前**仍是实验性**：

- **Node ≥ 22.13.0**：官方支持的原生加载方式 — 需要**同时**给 Node 传 `--experimental-strip-types`、并给 ESLint 传 `--flag unstable_native_nodejs_ts_config`。例如：
  ```bash
  npx --node-options='--experimental-strip-types' eslint --flag unstable_native_nodejs_ts_config
  ```
- **其它 Node 版本**：项目里安装 `jiti`（`pnpm add -D jiti`），ESLint 会自动通过它加载 `.ts` 配置。`jiti < 2.2.0` 在 v10 中已不再支持。

## 跑检查

```bash
# 检查全部
pnpm exec eslint .

# 检查指定目录
pnpm exec eslint src

# 自动修复
pnpm exec eslint . --fix

# 用更严格的退出策略：1 个 warn 即失败（CI 常用）
pnpm exec eslint . --max-warnings=0
```

退出码：

| 码 | 含义                                        |
| -- | ------------------------------------------- |
| 0  | 全部通过                                    |
| 1  | 有 error（或超过 `--max-warnings`）         |
| 2  | ESLint 自身配置错误 / 内部异常              |

更多 CLI 参数见 [参考](./reference.md)。

## 集成 Prettier

ESLint 负责**代码质量**，Prettier 负责**代码风格**。两者只在格式相关规则上重叠，用 `eslint-config-prettier` 一键关闭冲突项即可：

```bash
pnpm add -D eslint-config-prettier
```

```js
// eslint.config.js
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
  js.configs.recommended,
  eslintConfigPrettier,   // 放最后，确保关闭所有冲突
];
```

::: warning `eslint-plugin-prettier` 已不推荐

把 Prettier 作为 ESLint 规则跑（`eslint-plugin-prettier`）会让两类问题混在一起、性能差、错误位置混乱。Prettier 官方现在推荐"分别跑"：编辑器保存触发 Prettier、commit hook 跑 Prettier，ESLint 只查质量问题。

:::

详细分工见 [Prettier 笔记 - 集成 ESLint](../prettier/getting-started.md#搭配eslint)。

## 集成编辑器

VS Code：安装 **ESLint** 扩展（dbaeumer.vscode-eslint）。flat config 已是默认支持，无需额外开关。

JetBrains（WebStorm 等）：**Preferences → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint**，勾选 "Automatic ESLint configuration" 即可。

Vim / Neovim：用 ALE / nvim-lint / coc-eslint 之一，均会自动识别项目内的 `eslint.config.js`。

## 集成 Git Hooks

配合 [Husky](../../engineering/devops/husky/) + [lint-staged](../../engineering/devops/lint-staged/)：

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
node --eval "fs.writeFileSync('.husky/pre-commit','pnpm exec lint-staged\n')"
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,ts,vue,jsx,tsx}": "eslint --fix --no-warn-ignored",
    "*.{json,md,css,scss}": "prettier --write --ignore-unknown"
  }
}
```

`--no-warn-ignored` 是 v9+ 新增标志，让 ESLint 对被 `ignores` 排除的文件直接静默，而非报警。
