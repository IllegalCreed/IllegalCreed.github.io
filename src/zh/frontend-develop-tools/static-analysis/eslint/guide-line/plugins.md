---
layout: doc
outline: [2, 3]
---

# 插件（Plugins）

> 基于 ESLint v10.3.0 编写

## 速查

- `plugins` 字段是**对象**：`{ 命名空间: 插件对象 }`
- 命名空间约定：去掉 `eslint-plugin-` 前缀
- 规则引用：`命名空间/规则名`
- 处理器：`命名空间/处理器名` 赋给配置对象的 `processor`
- 自定义语言：`命名空间/语言名` 赋给配置对象的 `language`

## 基本配置

`plugins` 是一个对象，**key 是命名空间，value 是插件对象**：

```js
import jsdoc from "eslint-plugin-jsdoc";

export default [
  {
    files: ["**/*.js"],
    plugins: {
      jsdoc,                                      // 命名空间 jsdoc → 插件对象
    },
    rules: {
      "jsdoc/require-description": "error",       // 用命名空间引用规则
      "jsdoc/check-values": "error",
    },
  },
];
```

::: tip 命名空间随你命名

`"jsdoc/"` 中的 `jsdoc` 是 key，不是包名。理论上 `plugins: { foo: jsdocPluginObject }` 然后 `"foo/require-description"` 也成立。但**社区约定**就用去掉前缀后的包名，便于复制粘贴文档。

:::

## 插件预设：用 `extends` 一次性套用

很多插件附带 `recommended` / `strict` 这种"预设配置"。在 flat config 里通常通过 spread 或 `extends` 引入：

```js
import tseslint from "typescript-eslint";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,              // typescript-eslint 用 spread
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
```

或借助 v9 引入的 `extends` 字段（把预设绑定到特定 files）：

```js
export default [
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended],
    rules: { /* 个性化覆盖 */ },
  },
];
```

## 常用插件

| 场景         | 插件                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| TypeScript   | `typescript-eslint`（统一入口，封装 parser + plugin）                                        |
| Vue 3        | `eslint-plugin-vue`                                                                          |
| React        | `eslint-plugin-react`、`eslint-plugin-react-hooks`、`eslint-plugin-jsx-a11y`                  |
| Solid        | `eslint-plugin-solid`                                                                        |
| Import 关系  | `eslint-plugin-import` 或更快的 `eslint-plugin-i`                                            |
| Unicorn 规则 | `eslint-plugin-unicorn`                                                                      |
| 测试         | `eslint-plugin-vitest` / `eslint-plugin-jest`                                                |
| 文档注释     | `eslint-plugin-jsdoc`                                                                        |
| 整套打包     | [`@antfu/eslint-config`](https://github.com/antfu/eslint-config) / `eslint-config-airbnb-flat` 等 |

## Processor：让 ESLint 处理非 JS 文件

Processor 把一份"混合"文件（如 Markdown、Vue SFC）拆成纯 JS 片段后 lint，再把结果还原到原行号。

```js
import markdown from "eslint-plugin-markdown";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.md"],
    plugins: { markdown },
    processor: "markdown/markdown",              // ← 命名空间/processor 名
  },
];
```

Vue 项目里 `eslint-plugin-vue` 内部会自动配置 processor 处理 SFC，无需用户手写。

## Language：自定义语言

v9 引入 `language` 字段（取代过去硬编码 `parser` 的方式）。Plugin 可声明非 JavaScript 的语言：

```js
import jsonc from "@eslint/json";

export default [
  {
    files: ["**/*.json"],
    plugins: { json: jsonc },
    language: "json/jsonc",                      // ← 命名空间/language 名
    rules: {
      "json/no-duplicate-keys": "error",
    },
  },
];
```

目前主要用例：`@eslint/json`、`@eslint/markdown`、`@eslint/css` 等官方语言插件。

## 编写本地插件

把插件直接写在 `eslint.config.js` 里也行，适合一次性内部规则：

```js
export default [
  {
    plugins: {
      local: {
        rules: {
          "no-foo": {
            meta: { type: "problem", messages: { noFoo: "不要叫 foo" } },
            create(context) {
              return {
                Identifier(node) {
                  if (node.name === "foo") {
                    context.report({ node, messageId: "noFoo" });
                  }
                },
              };
            },
          },
        },
      },
    },
    rules: { "local/no-foo": "error" },
  },
];
```

更复杂的插件建议拆到独立文件 / 包。

## 常见问题

### 插件没适配 flat config

某些老插件只导出 v8 风格的 `configs`，直接用会报错。解决：

1. 升级到该插件的最新版（多数已支持 v9 / flat）
2. 用 `@eslint/eslintrc` 的 `FlatCompat` 包一下旧配置：

```js
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
});

export default [
  ...compat.config({
    extends: ["plugin:legacy-plugin/recommended"],
  }),
];
```

### 插件规则用了旧 API

ESLint v10 移除了一批 v8 时代已 deprecated 的方法：`context.getCwd()` / `context.getFilename()` / `context.getSourceCode()` 等改用属性访问（`context.cwd` / `context.filename` / `context.sourceCode`）；`SourceCode` 上的 `getTokenOrCommentBefore()` / `getJSDocComment()` 等被移除。规则代码若仍依赖这些方法在 v10 上会直接报错，查看插件 GitHub issues 看是否有兼容补丁。
