---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Knip v6.17.1 编写

## 速查

- 用法：`knip [选项]`（默认分析当前目录，按 `package.json` / workspaces 自动识别）
- 配置文件：`knip.json` / `knip.jsonc` / `knip.ts` / `knip.config.ts` / `package.json#knip`
- `$schema`：`https://unpkg.com/knip@6/schema.json`
- 核心字段：`entry` / `project` / `ignore` / `ignoreDependencies` / `ignoreBinaries` / `workspaces`
- 修复：`--fix` / `--fix-type <files,dependencies,exports,types,catalog>` / `--allow-remove-files` / `--format`
- 模式：`--production`(`-p`) / `--strict`(`-s`) / `--watch`(`-w`) / `--cache`
- 聚焦：`--include` / `--exclude` / `--dependencies` / `--exports` / `--files` / `--tags`
- 选择：`--workspace`(`-W`) / `--directory`(`-D`)
- 输出：`--reporter <symbols|compact|json|markdown|disclosure|codeowners|codeclimate|github-actions>`

## 常用 CLI 参数

| 参数                              | 作用                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `--fix` / `-f`                    | 应用可自动修复的问题                                      |
| `--fix-type <types>`              | 限定修复范围：`files,dependencies,exports,types,catalog`  |
| `--allow-remove-files`            | 允许 `--fix` 删除未使用的文件                             |
| `--format` / `-F`                 | 修复后用本地格式化器整理改动的文件                        |
| `--production` / `-p`             | 只 lint 生产代码（排除测试/配置与 devDependencies）       |
| `--strict` / `-s`                 | 隔离 workspace，只算直接依赖（隐含 production）            |
| `--include <types>`               | 只报告指定问题类型（逗号分隔或重复）                      |
| `--exclude <types>`               | 从报告中排除指定问题类型                                  |
| `--dependencies` / `--exports` / `--files` | 常用问题类型的快捷开关                          |
| `--tags <+a,-b>`                  | 按 JSDoc/TSDoc 标记包含/排除导出                          |
| `--workspace <name>` / `-W`       | 只分析指定 workspace（默认含其祖先与依赖方）              |
| `--directory <dir>` / `-D`        | 从指定目录运行                                            |
| `--reporter <name>`               | 选择报告器（可重复传以同时输出多种）                      |
| `--reporter-options <json>`       | 给报告器传 JSON 选项                                      |
| `--cache`                         | 启用缓存（连续运行快 10–40%）                             |
| `--watch` / `-w`                  | 监听文件变化并更新结果                                    |
| `--no-exit-code`                  | 始终以退出码 0 结束                                       |
| `--max-issues <N>`                | 超过 N 个问题才非零退出（默认 0）                        |
| `--debug` / `-d`、`--trace`       | 调试输出 / 追踪某导出被谁引用                            |

完整列表见官方 [CLI reference](https://knip.dev/reference/cli)。

## 配置字段速查

| 字段                      | 作用                                                |
| ------------------------- | --------------------------------------------------- |
| `entry`                   | 分析起点的 glob（`!` 前缀为排除）                   |
| `project`                 | 纳入分析的全部文件 glob                            |
| `ignore`                  | 从分析中排除文件（慎用）                            |
| `ignoreFiles`             | 仅从"未使用文件"检测中排除                          |
| `ignoreDependencies`      | 排除某些依赖（支持正则）                            |
| `ignoreBinaries`          | 排除某些可执行命令（支持正则）                      |
| `ignoreExportsUsedInFile` | 不报告仅在本文件内被用到的导出                      |
| `includeEntryExports`     | 是否报告入口文件里的未用导出（默认 false）          |
| `workspaces`              | 按 workspace 配置 `entry`/`project`/插件等          |
| `ignoreWorkspaces`        | 排除某些 workspace（支持 glob）                    |
| `paths`                   | 路径别名（TypeScript 语义）                        |
| `tags`                    | 按 JSDoc/TSDoc 标记包含/排除导出                    |
| `compilers`               | 自定义编译器（处理 `.vue`/`.svelte`/`.mdx` 等，仅 TS 配置） |
| `rules`                   | 各问题类型的过滤/严重级配置                         |

## 问题类型（issue types）

| 类型              | 含义                                   | 自动修复 |
| ----------------- | -------------------------------------- | -------- |
| `files`           | 找不到对该文件的引用                   | 🔧       |
| `dependencies`    | 装了却没被引用的依赖                   | 🔧       |
| `devDependencies` | 装了却没被引用的 devDependency         | 🔧       |
| `unlisted`        | 用了但未写进 `package.json` 的依赖     | —        |
| `binaries`        | 用了但未声明的可执行命令               | —        |
| `unresolved`      | 无法解析的 import 路径                 | —        |
| `exports`         | 找不到对该导出的引用                   | 🔧       |
| `types`           | 找不到对该导出类型的引用               | 🔧       |
| `nsExports`/`nsTypes` | 命名空间被引用，但具体成员未被引用 | 🔧（默认不报） |
| `enumMembers`     | 找不到对该枚举成员的引用               | 🔧       |
| `duplicates`      | 同一处被导出多次                       | —        |
| `catalog`         | 找不到对该 catalog 条目的引用          | 🔧       |

> 🔧 = 可被 `--fix` 自动修复。

## 相关链接

- [Knip 官网](https://knip.dev/) · [Getting Started](https://knip.dev/overview/getting-started)
- [GitHub: webpro-nl/knip](https://github.com/webpro-nl/knip)
- 配套：`@knip/config`（初始化）、`eslint-plugin-knip`、`remove-unused-vars`（清未用变量）
