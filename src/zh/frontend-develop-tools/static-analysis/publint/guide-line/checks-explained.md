---
layout: doc
outline: [2, 3]
---

# 检查项详解

> 基于 publint v0.3.21 编写

## 速查

- **error**：`EXPORTS_TYPES_SHOULD_BE_FIRST`（types 条件最前）、`EXPORTS_DEFAULT_SHOULD_BE_LAST`（default 最后）、`EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE`（module 在 require 前）、`EXPORTS_VALUE_INVALID`（值须以 `./` 开头）、`FILE_DOES_NOT_EXIST`（文件不存在）、`BIN_FILE_NOT_EXECUTABLE`（bin 缺 shebang）
- **warning**：`FILE_INVALID_FORMAT`（内容与解释格式不符）、`EXPORTS_TYPES_INVALID_FORMAT`（ESM/CJS 类型应分别 `.d.mts`/`.d.cts`）、`TYPES_NOT_EXPORTED`（类型未经 exports 导出）、`FILE_NOT_PUBLISHED`（文件未进 tarball）、`DEPRECATED_FIELD_JSNEXT`（`jsnext:main` 废弃）
- **suggestion**：`USE_TYPE`（加 `"type"`）、`USE_LICENSE`、`USE_FILES`、`USE_ENGINES_NODE`、`HAS_MODULE_BUT_NO_EXPORTS` / `HAS_ESM_MAIN_BUT_NO_EXPORTS`（改用 `exports`）
- 三档失败语义：默认仅 error 致失败，`--strict` 下 warning 也致失败
- 规则全表见官方 [lint rules](https://publint.dev/rules)

publint 把问题分成 `error` / `warning` / `suggestion` 三档。下面按级别挑出最常遇到的规则展开说明。完整规则表见官方 [lint rules](https://publint.dev/rules)。

## error 级：必须修

### exports 条件顺序

`exports` 的条件对象**按书写顺序匹配**，顺序错了会让某些条件永远命中不到：

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "module": "./dist/index.js",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  }
}
```

- `EXPORTS_TYPES_SHOULD_BE_FIRST`：`types` 必须最前。否则 TypeScript 可能先命中 `import`/`require` 等 JS 条件，拿不到类型声明。
- `EXPORTS_DEFAULT_SHOULD_BE_LAST`：`default` 必须最后，作为所有更具体条件未命中时的兜底；放前面会抢先命中。
- `EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE`：`module`（ESM）应排在 `require`（CJS）之前，让支持 `module` 的打包器优先拿 ESM（利于 tree-shaking）。

`imports` 字段（以 `#` 开头的内部导入）有一组镜像规则：`IMPORTS_TYPES_SHOULD_BE_FIRST`、`IMPORTS_DEFAULT_SHOULD_BE_LAST`、`IMPORTS_MODULE_SHOULD_PRECEDE_REQUIRE`。

### 路径与值合法性

- `EXPORTS_VALUE_INVALID`：`exports` 的值（文件路径）必须以 `./` 开头。
- `IMPORTS_KEY_INVALID` / `IMPORTS_VALUE_INVALID`：`imports` 的键须以 `#` 开头，非依赖的值须以 `./` 开头。
- `EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING`：废弃的「尾部斜杠」子路径映射（如 `"./foo/": "./foo/"`），应改用 `/*` 通配（如 `"./foo/*": "./foo/*"`）。

### 文件存在性

- `FILE_DOES_NOT_EXIST`：某字段指向的文件实际不存在。**最常见原因是没 build 就跑了 publint**，或产物路径与字段不一致。
- `BIN_FILE_NOT_EXECUTABLE`：`bin` 指向的脚本缺少 shebang（首行 `#!/usr/bin/env node`），命令行下无法直接执行。

## warning 级：潜在兼容问题

### 模块格式不匹配

文件该按 ESM 还是 CJS 解释，由其**扩展名**（`.mjs` → ESM、`.cjs` → CJS）或**最近的 `package.json` 的 `"type"`** 决定：

- `FILE_INVALID_FORMAT`：文件实际内容与被解释的格式不符。例如 `"type": "module"` 下，一个 `.js` 文件却写了 `require(...)`/`module.exports`（CJS 语法）。
- `FILE_INVALID_EXPLICIT_FORMAT`：当文件带显式扩展名（`.mjs`/`.cjs`）时的更严格校验。
- `FILE_INVALID_JSX_EXTENSION`：`.mjsx`/`.ctsx` 等扩展名缺乏工具支持，应改用 `.jsx`。

::: warning ESM/CJS 互操作是发布事故高发区
一个标了 `"type": "module"` 的包，若产物里混入 CJS 语法的 `.js`，在 Node 原生 ESM 下会直接报错。publint 能在发布前就把这类「格式声明与实际内容打架」的问题揪出来。
:::

### 类型导出与格式

- `TYPES_NOT_EXPORTED`：TypeScript 5.0+ 在 `node16`/`bundler` 等现代解析模式下，要求类型经 `exports` 的 `types` 条件（或紧邻 JS 的同名 `.d.ts`）导出。只靠顶层 `types` 字段在有 `exports` 时可能不够。
- `EXPORTS_TYPES_INVALID_FORMAT`：为 ESM 与 CJS 分别提供类型时，扩展名要与格式匹配——ESM 用 `.d.mts`、CJS 用 `.d.cts`。给 `import` 配 CJS 风格的类型（或反之）会导致「类型伪装（masquerading）」，在不同 `moduleResolution` 下张冠李戴。

### 发布形态与废弃字段

- `FILE_NOT_PUBLISHED`：文件本地存在，但因没被 `files` 白名单包含（或被 `.npmignore` 排除），`npm publish` 时不会进 tarball，用户装下来就缺它。
- `EXPORTS_MISSING_ROOT_ENTRYPOINT`：有 `exports` 时应导出根入口 `"."`。
- `DEPRECATED_FIELD_JSNEXT`：`jsnext:main`/`jsnext:module` 是早期 ESM 入口约定，已废弃，应改用 `module` 或 `exports` 的 `import` 条件。
- `INVALID_REPOSITORY_VALUE`：`repository` 字段须是合法、可被 npm 解析的 git URL。

## suggestion 级：最佳实践

这些不影响「能否被解析」，但能提升包的质量与体验：

| 规则码                       | 建议                                                  |
| ---------------------------- | ----------------------------------------------------- |
| `USE_TYPE`                   | 显式加 `"type"`，省去逐文件探测模块格式的开销         |
| `USE_LICENSE`                | 设置 `license` 字段，便于 npm 展示                    |
| `USE_FILES`                  | 用 `files` 限定发布内容，避免把无关文件打进包         |
| `USE_ENGINES_NODE`           | 声明 `engines.node`，标明支持的最低 Node 版本         |
| `HAS_MODULE_BUT_NO_EXPORTS`  | 有 `module` 字段时，建议改用更标准的 `exports`        |
| `HAS_ESM_MAIN_BUT_NO_EXPORTS`| `main` 指向 ESM 时，建议用 `exports` 声明以增强兼容   |
| `USE_EXPORTS_BROWSER`        | 用 `exports` 的 `browser` 条件替代老式 `browser` 字段 |

::: tip 老式 CJS 包通常只会得到建议
一个只发 CJS、没有 `exports` 也没有类型的老包，跑 publint 多半得到的是上面这类「现代化建议」，而非 error——publint 倾向于引导你采用 `exports` + 正确类型导出等现代实践，而不是直接判其不可用。
:::

下一步：用 [attw](./with-arethetypeswrong.md) 补足类型解析层面的检查。
