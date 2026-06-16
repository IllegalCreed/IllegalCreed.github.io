---
layout: doc
outline: [2, 3]
---

# 基础

> 基于 ESLint v10.3.0 编写

## 速查

- 严重级：`"off"`/`0`、`"warn"`/`1`、`"error"`/`2`；带选项用数组，如 `"semi": ["error", "always"]`
- 行内豁免：`// eslint-disable-next-line rule -- 理由`、`/* eslint-disable */` … `/* eslint-enable */`
- 行内注释**优先级最高**；团队建议 disable 必须用 `-- ` 写理由
- `languageOptions`：`ecmaVersion` / `sourceType` / `globals` / `parserOptions.ecmaFeatures`
- `globals` 取值 `"readonly"` / `"writable"` / `"off"`（旧 `true`/`false` 已废弃）；用 `globals` 包批量注入 browser/node 等
- `linterOptions.reportUnusedDisableDirectives`：揪出残留的无用 disable 注释
- `settings`：插件共享元信息（如 `react.version`、`import/resolver`）
- 优先级：行内注释 > 配置 rules（后定义覆盖前者）> 共享预设 > 内置默认；用 `eslint --print-config <file>` 查最终合并

## 规则严重级（Severity）

每条规则的取值有三档，可以用字符串或数字：

| 字符串    | 数字 | 行为                                         |
| --------- | ---- | -------------------------------------------- |
| `"off"`   | `0`  | 关闭该规则                                   |
| `"warn"`  | `1`  | 触发时输出 warning，不影响退出码（除非 `--max-warnings`） |
| `"error"` | `2`  | 触发时输出 error，退出码为 1                 |

带选项时用数组：

```js
"semi": ["error", "always"],
"quotes": ["warn", "double", { "avoidEscape": true }],
```

::: tip CI 建议 error，本地开发可以 warn

`"warn"` 适合"想知道但不阻塞 CI"的检查。CI 用 `--max-warnings=0` 让 warn 也变阻塞，比把所有规则都设 `"error"` 更灵活。

:::

## 用配置注释（行内 disable）局部豁免

行内注释**优先级高于配置文件**（"Rules configured via configuration comments have the highest priority"），用来对个别行或代码块做精细豁免。

| 写法                                                     | 作用域                  |
| -------------------------------------------------------- | ----------------------- |
| `/* eslint-disable */`                                   | 从此处到文件末尾或下一个 `eslint-enable` |
| `/* eslint-enable */`                                    | 恢复之前禁用的规则      |
| `/* eslint-disable rule-1, rule-2 */`                    | 仅禁用列出的规则        |
| `// eslint-disable-line`                                 | 仅当前行                |
| `// eslint-disable-line rule-1`                          | 当前行仅禁用某规则      |
| `// eslint-disable-next-line`                            | 下一行所有规则          |
| `// eslint-disable-next-line rule-1 -- 说明`             | 下一行某规则 + 写理由   |
| `/* eslint eqeqeq: "off", curly: "error" */`             | 文件级临时改严重级      |

::: warning 加上"理由"

`-- 后面的文字` 会被 ESLint 当作注释（不影响规则解析），团队推荐**必须**写理由，方便后续 review。

:::

## Language Options：JS 解析与全局变量

`languageOptions` 字段控制 ESLint **怎么解析**这份代码：

```js
export default [
  {
    languageOptions: {
      ecmaVersion: "latest",       // 默认 "latest"
      sourceType: "module",        // 默认 "module"；可选 "commonjs" / "script"
      globals: {
        window: "readonly",
        myFlag: "writable",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,               // 启用 JSX
          impliedStrict: true,     // 隐式严格模式（需 ecmaVersion >= 5）
          globalReturn: false,     // 顶层 return（特定 sourceType 才允许）
          allowReserved: false,    // ecmaVersion = 3 时允许保留字做标识符
        },
      },
    },
  },
];
```

### globals 取值

| 值           | 含义                                                  |
| ------------ | ----------------------------------------------------- |
| `"readonly"` | 该全局可读，赋值时会被 `no-global-assign` 抓出来      |
| `"writable"` | 允许赋值                                              |
| `"off"`      | 显式取消该名字的全局声明（即使父配置声明过）          |

::: warning 旧值已 deprecated

`true` / `false` 以及拼错的 `"readable"` / `"writeable"` 仍能用，但已 deprecated，新代码请用 `"readonly"` / `"writable"` / `"off"`。

:::

### 用 `globals` 包代替手写

`globals` 是一个独立 npm 包，预定义了 browser / node / jest / mocha / vitest 等环境的全局列表：

```bash
pnpm add -D globals
```

```js
import globals from "globals";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.test.{js,ts}"],
    languageOptions: {
      globals: { ...globals.vitest },
    },
  },
];
```

这取代了 v8 时代 `.eslintrc` 的 `env: { browser: true, node: true }`。

### 行内声明全局

如果某个文件需要临时声明全局：

```js
/* global var1, var2 */
/* global var1:writable, var2:writable */
```

## linterOptions：与 lint 行为相关的开关

```js
export default [
  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn",       // 报告无用的 disable 注释
      reportUnusedInlineConfigs: "off",            // 报告无效 inline config
      noInlineConfig: false,                       // true 时完全禁用行内 disable
    },
  },
];
```

`reportUnusedDisableDirectives` 在团队代码 review 里非常有用——常常有人 disable 了一条规则但代码改完后 disable 注释还残留。

## settings：插件共享配置

`settings` 字段不被 ESLint 直接使用，但**所有插件规则都能读到**。常用于让多个规则共享同一份"项目元信息"：

```js
export default [
  {
    settings: {
      react: { version: "detect" },                // eslint-plugin-react 读这里
      "import/resolver": {
        typescript: { project: "./tsconfig.json" }, // eslint-plugin-import 读这里
      },
    },
  },
];
```

## 严重级与 disable 注释的优先级

整体优先级（从高到低）：

1. **行内注释**：`// eslint-disable-next-line`、`/* eslint rule: "off" */`
2. **配置对象 rules**：后定义的对象覆盖前者（数组顺序生效）
3. **共享 / 预设配置**（如 `js.configs.recommended`）：被你的对象覆盖
4. **ESLint 内部默认**：每条规则的 `meta.defaultOptions`

调试时用 `eslint --print-config <file>` 看针对某文件的最终合并结果。
