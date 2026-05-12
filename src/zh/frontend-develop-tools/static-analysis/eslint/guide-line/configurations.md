---
layout: doc
outline: [2, 3]
---

# 配置文件（Flat Config）

> 基于 ESLint v10.3.0 编写

## 速查

- 文件名：`eslint.config.{js,mjs,cjs,ts,mts,cts}`，放在项目根目录
- 导出：一个**配置对象数组**
- 合并：多对象命中同一文件时按数组顺序合并，**后者覆盖前者**
- 全局 ignores：单独的对象，**只含 `ignores`（和可选 `name`）**
- 调试：`eslint --print-config <file>` 查看实际合并结果
- 类型助手：`import { defineConfig, globalIgnores } from "eslint/config"`

## 文件名与查找规则

ESLint 自项目根向上查找下列文件之一：

```
eslint.config.js
eslint.config.mjs
eslint.config.cjs
eslint.config.ts
eslint.config.mts
eslint.config.cts
```

::: tip TS 配置的 Node 要求（实验性）

`.ts` / `.mts` / `.cts` 当前仍是 ESLint 的实验特性：

- **Node ≥ 22.13.0**：可走"原生 TS 加载"，但需要 Node 的 `--experimental-strip-types` **加上** ESLint 的 `--flag unstable_native_nodejs_ts_config` 同时启用
- **其它 Node 版本**：装 `jiti`（`pnpm add -D jiti`），ESLint 会通过它加载 `.ts` 配置。`jiti < 2.2.0` 在 v10 中已停止支持

详见 [getting-started.md - TS 配置文件](../getting-started.md#ts-配置文件)。

:::

## 配置对象字段

```js
export default [
  {
    name: "my-app/src",                          // ① 标识
    files: ["src/**/*.{js,ts}"],                 // ② 命中
    ignores: ["src/legacy/**"],                  // ③ 局部排除
    basePath: "packages/web",                    // ④ 子目录限定
    languageOptions: { /* ... */ },              // ⑤ 解析配置
    linterOptions:   { /* ... */ },              // ⑥ lint 行为
    plugins:         { /* { ns: plugin } */ },   // ⑦ 插件命名空间
    rules:           { /* { rule: severity } */ },// ⑧ 规则
    processor:       "ns/processor-name",        // ⑨ 处理器
    settings:        { /* 插件共享 */ },          // ⑩ 给所有规则用的元信息
    extends:         [/* 配置对象 / 配置数组 */], // ⑪ 继承（v9 流程中加入）
  },
];
```

| 字段              | 作用                                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| `name`            | 给当前对象起名，方便在 `--inspect-config` 和报错里识别                     |
| `files`           | 命中模式（minimatch glob）。**未设 `files` 的对象命中所有文件**            |
| `ignores`         | 局部排除；如对象只含 `ignores`（+ 可选 `name`），则是全局 ignores          |
| `basePath`        | 把整个对象的 `files` / `ignores` 限定在该子目录内（相对 config 文件位置）  |
| `languageOptions` | `ecmaVersion` / `sourceType` / `globals` / `parser` / `parserOptions`     |
| `linterOptions`   | `noInlineConfig` / `reportUnusedDisableDirectives` / `reportUnusedInlineConfigs` |
| `plugins`         | `{ 命名空间: 插件对象 }`，命名空间约定去掉 `eslint-plugin-` 前缀           |
| `rules`           | 规则配置；插件规则用 `命名空间/规则名`                                     |
| `processor`       | 预 / 后处理文件（如 Markdown 内代码块、Vue SFC）                           |
| `settings`        | 不被 ESLint 使用，但所有插件规则都能读到                                   |
| `extends`         | 继承其他配置对象 / 数组的设置（v9 流程中加入 引入，让 flat config 也能像 eslintrc 一样级联）|

## 合并行为

> "When more than one configuration object matches a given filename, the configuration objects are merged with later objects overriding previous objects when there is a conflict."

按数组顺序遍历，每个**命中当前文件**的对象都参与合并。冲突字段（rules、globals、语言选项）取后出现的版本。

```js
export default [
  js.configs.recommended,                    // 全局推荐基线
  {
    files: ["**/*.js"],
    rules: { "no-console": "warn" },         // 所有 .js 警告 console
  },
  {
    files: ["src/server/**/*.js"],
    rules: { "no-console": "off" },          // 服务端代码允许 console（覆盖上一条）
  },
];
```

调试合并结果：

```bash
eslint --print-config src/server/index.js
```

## 全局 ignores

如果一个对象**只包含 `ignores`**（加最多一个 `name`），它就是全局 ignores，**对所有文件生效**：

```js
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/**", "coverage/**", "**/*.generated.ts"]),
  // 其他配置对象...
]);
```

不用 `globalIgnores()` 也行（直接写 `{ ignores: [...] }`），但官方推荐用这个 helper 让"全局 ignores"的意图更清晰。

::: warning 局部 ignores vs 全局 ignores

- 局部：和 `files` / `rules` 等同处一个对象，**只在当前对象的范围内排除**
- 全局：单独对象，**对整个配置数组生效**，可以匹配目录（如 `dist/**`）；局部 ignores 仅匹配文件

:::

### 默认忽略

ESLint **自带**两条全局 ignores：`["**/node_modules/", ".git/"]`。可以用 `--no-ignore` 临时关闭，或写一条 `globalIgnores(["!some/path"])` 用否定模式重新打开。

### 与 `.gitignore` 集成

```bash
pnpm add -D @eslint/compat
```

```js
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";
import path from "node:path";

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".gitignore");

export default [
  includeIgnoreFile(gitignorePath),
  // 其他配置...
];
```

## `basePath`：把配置限定到子目录

monorepo 场景下，根 `eslint.config.js` 可以用 `basePath` 给各包写专属配置：

```js
export default [
  js.configs.recommended,
  {
    basePath: "packages/web",
    files: ["**/*.tsx"],
    rules: { "react/jsx-key": "error" },
  },
  {
    basePath: "packages/server",
    files: ["**/*.ts"],
    rules: { "no-console": "off" },
  },
];
```

`basePath` 是相对 `eslint.config.js` 所在目录解析的。子目录内的 `files` / `ignores` 自动以 basePath 为根。

## `extends`：在 flat config 里复用预设

v9 流程中加入 引入 `extends` 字段。它接受一个**配置对象数组**，把这些配置"合并进当前对象"：

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
];
```

这样可以在保留 flat config 数组扁平结构的同时，把"对某文件集生效的多个预设"绑在一起，比把它们摊到顶级数组里更紧凑。

## 多文件配置：拆分长 config

配置长起来后，拆到多个文件按用途组织：

```js
// eslint.config.js
import baseConfig from "./eslint/base.config.js";
import tsConfig from "./eslint/typescript.config.js";
import testConfig from "./eslint/test.config.js";

export default [
  ...baseConfig,
  ...tsConfig,
  ...testConfig,
];
```

每个分文件导出 `Array<ConfigObject>`，主文件 spread 合并即可。这是 ESLint 官方在 monorepo / 大型项目中推荐的组织方式。
