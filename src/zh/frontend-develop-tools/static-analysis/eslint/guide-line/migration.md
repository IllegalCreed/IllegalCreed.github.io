---
layout: doc
outline: [2, 3]
---

# 升级（v8 → v9 → v10）

> 基于 ESLint v10.3.0 整理。当前 `latest` 已指向 v10.x，v9 与 v8 仍可独立切换。

## 快速判断

| 你现在用的版本 | 推荐路径                                                     |
| -------------- | ------------------------------------------------------------ |
| v7 / v8        | 直接迁到 v9（先把 `.eslintrc` 改成 flat config），再升 v10   |
| v9             | v10 主要是收紧 + 移除 deprecated；升级步骤短                 |
| v10            | 跟着 changelog 维护即可                                       |

迁移工具：

```bash
# 一键把 .eslintrc 转 flat config（v8 → v9 适用）
pnpm dlx @eslint/migrate-config .eslintrc.json
```

::: tip 升级前先冻结违规

升级 ESLint 通常意味着新增内置规则、行为收紧，旧代码会突然冒出几百个新违规。先用 `eslint . --suppress-all` 把当前违规写到 `eslint-suppressions.json`，CI 只检查"新增违规"。后续清完后再 `--prune-suppressions`。

:::

## v9 关键破坏性变更（从 v8 升级）

### Flat Config 成为默认

- 配置文件改为 `eslint.config.{js,mjs,cjs,ts,mts,cts}`
- `.eslintrc.*` 仍可用，但需手动开启 `ESLINT_USE_FLAT_CONFIG=false`（v10 起完全移除）
- **字符串预设废弃**：`"eslint:recommended"` / `"eslint:all"` 这类字符串在 flat config 里无效，必须 `import js from "@eslint/js"` 后用 `js.configs.recommended` / `js.configs.all`

过渡方案 — `FlatCompat`：

```js
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
});

export default [
  ...compat.config({
    extends: ["eslint:recommended", "plugin:react/recommended"],
  }),
];
```

### Node.js 最低版本抬高

v9 支持 **Node.js v18.18.0+ / v20.9.0+ / v21+**（v21 仍受支持），移除对 v16 / v17 / v19 的支持。

### 内置规则增减

`eslint:recommended` 新增 4 条：

- `no-constant-binary-expression`
- `no-empty-static-block`
- `no-new-native-nonconstructor`
- `no-unused-private-class-members`

`eslint:recommended` 移除 4 条：

- `no-extra-semi`
- `no-inner-declarations`
- `no-mixed-spaces-and-tabs`
- `no-new-symbol`

完全移除 `require-jsdoc` 和 `valid-jsdoc`，改用 `eslint-plugin-jsdoc`。

### CLI 行为变化

- `--quiet` 不再"只过滤输出"，而是**不执行**严重级为 `"warn"` 的规则。CI 用 `--quiet` 时如果想保留某些 warn 的检查，把它们改成 `"error"` + 配 `--max-warnings`
- `no-unused-vars` 的 `caughtErrors` 默认改为 `"all"`，`try/catch (err)` 里没用到的 `err` 会被报

### 内置 Formatter 移除

`checkstyle` / `compact` / `jslint-xml` / `junit` / `tap` / `unix` / `visualstudio` 从核心移除，需要时单独安装 `eslint-formatter-checkstyle` 等独立包。

### 插件作者面

- 规则改为对象形式（必须有 `meta` + `create`）
- `meta.schema` 必填
- 部分 `SourceCode` API 调整

## v10 关键破坏性变更（从 v9 升级）

### Node.js 进一步抬高

最低支持：`^20.19.0` / `^22.13.0` / `>=24`。中间版本（v20.0–v20.18 / 整个 v21 / v23 / v22.0–v22.12）均不再支持。

### `.eslintrc` 彻底移除

- `ESLINT_USE_FLAT_CONFIG=false` 走不通
- `FlatESLint` 和 `LegacyESLint` 两个 Node.js API 类删除，统一用 `ESLint`
- `v10_config_lookup_from_file` 标志位移除，配置查找改为"从每个文件目录向上"（之前是从 cwd 向上）

### `eslint:recommended` 又加了 3 条

新增 `no-unassigned-vars`、`no-useless-assignment`、`preserve-caught-error`。升级时要么修代码、要么显式 `"off"`。

### JSX 引用现在被识别

`<Card />` 中 `Card` 现在被视为 `Card` 标识符的引用，会消解 `no-unused-vars` 的误报。社区规则 `@eslint-react/jsx-uses-vars` 不再必要。

### `/* eslint-env */` 注释变 error

v8 时代的 `/* eslint-env browser */` 这类注释在 v10 中报错。必须改成在 `eslint.config.js` 的 `languageOptions.globals` 里通过 `globals` 包注入：

```js
import globals from "globals";
languageOptions: { globals: { ...globals.browser } }
```

### 部分规则收紧

- `radix`：选项 `"always"` / `"as-needed"` deprecated，去掉显式选项即可
- `no-shadow-restricted-names`：默认 `reportGlobalThis: true`，shadow `globalThis` 也会报
- `func-names`：schema 更严，多余的数组元素会报配置错误
- `no-invalid-regexp`：`allowConstructorFlags` 中**重复**的 flag 字符会被拒绝

### Formatter 与依赖变化

- `stylish` formatter 不再依赖 `chalk`，改用 Node 原生 `styleText`，遵循 `NO_COLOR` / `NODE_DISABLE_COLORS` 环境变量
- TS 配置回退依赖：`jiti < v2.2.0` 不再支持
- minimatch 升级后 POSIX 字符类（如 `[[:alnum:]]`）现在生效，旧 glob 行为可能微妙变化

### 插件作者面

- `context.getCwd()` / `getFilename()` 等 deprecated 方法删除，改用 `context.cwd` / `context.filename` 属性
- `SourceCode` 的 `getTokenOrCommentBefore()` / `getJSDocComment()` 等删除
- `LintMessage` 的 `nodeType` 属性移除
- `fixer.replaceText()` 等接受非 string 参数时直接 `TypeError`
- RuleTester：`valid` 用例不允许有 `errors` / `output`；错误对象不再支持 `type` 属性

## 升级 checklist

1. **跑一遍 `pnpm dlx eslint --version`** 看实际版本
2. **配置文件**：从 `.eslintrc.*` 切到 `eslint.config.js`（v9） / 删除遗留 `.eslintrc.*`（v10）
3. **导入预设**：`"eslint:recommended"` → `js.configs.recommended`
4. **行内注释**：删掉所有 `/* eslint-env */`，改在 config 里用 `globals` 包
5. **Node 版本**：v10 升 Node 到 ≥20.19 / ≥22.13 / ≥24
6. **插件**：检查所有 `eslint-plugin-*` 是否声明 ESLint peer 兼容到 v10
7. **冻结违规**：`eslint . --suppress-all` 然后跑 CI，确认新规则不立即阻塞
8. **逐步清理**：定期 `eslint . --prune-suppressions` 收敛 suppressions 文件
