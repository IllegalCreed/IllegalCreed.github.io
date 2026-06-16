---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 publint v0.3.21 编写

## 速查

- 命令：`publint [path] [options]`（path = 目录或 `.tgz`，默认当前目录）
- CLI 选项：`--level <suggestion|warning|error>`（默认 suggestion）、`--strict`、`--pack <auto|npm|yarn|pnpm|bun|false>`
- API：`publint(options)` → `{ messages, pkg }`；选项 `pkgDir`/`level`/`strict`/`pack`
- `Message`：`{ code, args, path: string[], type }`，`type ∈ suggestion|warning|error`
- 格式化：`formatMessage(message, pkg)`（来自 `publint/utils`）
- 环境：Node **>= 18**，ESM 包；npm v9+/yarn v3+/pnpm v8+/bun，不支持 yarn 1
- 搭档：`@arethetypeswrong/cli`（attw）

## 命令行参数

| 参数               | 取值 / 默认                                            | 作用                                       |
| ------------------ | ----------------------------------------------------- | ------------------------------------------ |
| `publint [path]`   | 目录或 `.tgz`，默认当前目录                            | 指定要检查的包目录或 tarball               |
| `--level <level>`  | `suggestion`(默认) / `warning` / `error`              | 只显示不低于该级别的消息                   |
| `--strict`         | 布尔，默认 `false`                                    | 把 `warning` 当作 `error`（影响退出码）    |
| `--pack <pm>`      | `auto`(默认) / `npm` / `yarn` / `pnpm` / `bun` / `false` | 用哪个包管理器打包、确定将发布的文件清单   |

完整 CLI 说明见官方 [CLI docs](https://publint.dev/docs/)。

## 编程式 API

```js
import { publint } from "publint";
import { formatMessage } from "publint/utils";

const { messages, pkg } = await publint({ pkgDir: "./my-lib" });
for (const m of messages) console.log(formatMessage(m, pkg));
```

### Options

| 字段     | 类型                                                                       |
| -------- | -------------------------------------------------------------------------- |
| `pkgDir` | `string`                                                                   |
| `level`  | `'suggestion' \| 'warning' \| 'error'`                                     |
| `strict` | `boolean`                                                                  |
| `pack`   | `'auto'\|'npm'\|'yarn'\|'pnpm'\|'bun'\| { tarball } \| { files } \| false` |

### Result 与 Message

```ts
interface Result {
  messages: Message[];
  pkg: Record<string, any>;
}

interface Message {
  code: string; // 规则码
  args: Record<string, any>; // 模板参数
  path: string[]; // package.json 内的键路径
  type: "suggestion" | "warning" | "error";
}
```

## 常见规则速查

### error 级

| 规则码                                  | 含义                                   |
| --------------------------------------- | -------------------------------------- |
| `EXPORTS_TYPES_SHOULD_BE_FIRST`         | `exports` 中 `types` 条件应最前        |
| `EXPORTS_DEFAULT_SHOULD_BE_LAST`        | `default` 条件应最后（兜底）           |
| `EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE` | `module` 应排在 `require` 之前         |
| `EXPORTS_VALUE_INVALID`                 | `exports` 值须以 `./` 开头             |
| `FILE_DOES_NOT_EXIST`                   | 字段指向的文件不存在                   |
| `BIN_FILE_NOT_EXECUTABLE`               | `bin` 脚本缺 shebang                   |
| `IMPORTS_KEY_INVALID`                   | `imports` 键须以 `#` 开头              |

### warning 级

| 规则码                          | 含义                                          |
| ------------------------------- | --------------------------------------------- |
| `FILE_INVALID_FORMAT`           | 文件内容与被解释的格式（ESM/CJS）不符         |
| `EXPORTS_TYPES_INVALID_FORMAT`  | ESM/CJS 类型应分别为 `.d.mts` / `.d.cts`      |
| `TYPES_NOT_EXPORTED`            | 类型未经 `exports` 正确导出                   |
| `FILE_NOT_PUBLISHED`            | 文件存在但不会被发布（漏在 `files` 外）       |
| `DEPRECATED_FIELD_JSNEXT`       | `jsnext:main` 已废弃，改用 `module`/`exports` |
| `EXPORTS_MISSING_ROOT_ENTRYPOINT` | 有 `exports` 时应导出根入口 `"."`           |

### suggestion 级

| 规则码                       | 建议                                |
| ---------------------------- | ----------------------------------- |
| `USE_TYPE`                   | 加 `"type"` 显式声明模块格式        |
| `USE_LICENSE`                | 设置 `license` 字段                 |
| `USE_FILES`                  | 用 `files` 限定发布内容             |
| `USE_ENGINES_NODE`           | 声明 `engines.node`                 |
| `HAS_MODULE_BUT_NO_EXPORTS`  | 有 `module` 时改用 `exports`        |
| `USE_EXPORTS_BROWSER`        | 用 `exports` 的 `browser` 条件替代  |

规则全表见官方 [lint rules](https://publint.dev/rules)。

## 环境要求

- Node.js **>= 18**；publint 自身是 ESM 包（`"type": "module"`）
- 包管理器：npm v9+ / yarn v3+ / pnpm v8+ / bun（**不支持 yarn 1**）

## 相关链接

- [publint 官网与网页版](https://publint.dev/) · [文档](https://publint.dev/docs/) · [规则](https://publint.dev/rules)
- [GitHub: publint/publint](https://github.com/publint/publint)
- 搭档工具 [@arethetypeswrong/cli](https://github.com/arethetypeswrong/arethetypeswrong.github.io)（attw，类型解析检查）
