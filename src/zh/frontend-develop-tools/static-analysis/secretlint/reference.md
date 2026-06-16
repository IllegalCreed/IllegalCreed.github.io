---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Secretlint v13.0.2 编写

## 速查

- 用法：`secretlint [file|glob...]`（glob 用双引号包裹，基于 micromatch）
- 初始化：`--init`（从 package.json 生成 `.secretlintrc.json`）
- 配置：`--secretlintrc <path>` / `--secretlintrcJSON '<json>'`
- 忽略：`--secretlintignore <path>`（默认 `.secretlintignore`）
- 输出：`--format <name>` / `--output <path>`
- 脱敏：默认开启，`--no-maskSecrets` 关闭；`--no-color` / `--no-terminalLink`
- STDIN：`echo "..." | secretlint --stdinFileName=secret.txt`
- 退出码：`0` 成功（或指定了 `--output`）/ `1` 发现密钥 / `2` 致命错误

## 常用 CLI 参数

| 参数                       | 作用                                                            |
| -------------------------- | --------------------------------------------------------------- |
| `secretlint [file\|glob]`  | 指定要扫描的文件或 glob（glob 须用双引号）                      |
| `--init`                   | 从 `package.json` 生成 `.secretlintrc.json`                     |
| `--format <name>`          | 输出格式，默认 `stylish`                                        |
| `--output <path>`          | 把结果写入文件（指定后即使发现密钥退出码也为 `0`）             |
| `--no-color`               | 关闭 ANSI 颜色                                                  |
| `--no-terminalLink`        | 关闭终端超链接                                                  |
| `--no-maskSecrets`         | 关闭脱敏，显示密钥原值（默认脱敏）                              |
| `--secretlintrc <path>`    | 指定配置文件（默认 `.secretlintrc.*`）                         |
| `--secretlintignore <path>`| 指定忽略文件（默认 `.secretlintignore`）                       |
| `--secretlintrcJSON <json>`| 用 JSON 字符串代替配置文件                                     |
| `--stdinFileName <name>`   | 处理 STDIN 内容时使用的文件名（部分规则依赖文件名）            |
| `--no-glob`                | 不做 glob 匹配，直接按传入的文件名处理（lint-staged 场景必加） |
| `--profile`                | 开启性能分析（开发用）                                          |
| `--locale <tag>`           | 消息语言（实验性，默认 `en`）                                   |

## 输出格式（--format）

可选：`stylish`（默认）、`checkstyle`、`compact`、`jslint-xml`、`junit`、`pretty-error`、`tap`、`unix`、`json`、`mask-result`、`table`。

另可用外部 SARIF formatter：`--format @secretlint/secretlint-formatter-sarif`。

::: tip mask-result 的妙用
`secretlint <file> --format=mask-result --output=<file>` 会把文件里的密钥就地打码并覆写——常用于清洗 `.zsh_history` 这类历史文件。注意 Secretlint **不能自动修复**密钥，这只是打码不是删除。
:::

## 退出码

| 退出码 | 含义                                            |
| ------ | ----------------------------------------------- |
| `0`    | 检查通过无错误；或发现错误但指定了 `--output`    |
| `1`    | 检查失败，发现密钥                              |
| `2`    | 发生意外的致命错误                              |

## 配置字段速查

| 字段              | 作用                                          |
| ----------------- | --------------------------------------------- |
| `rules`           | 规则数组，每项 `id` 为规则包名                 |
| `rules[].id`      | 规则（或预设）包的 npm 名称                    |
| `rules[].options` | 规则选项对象（如 `allows`）                    |
| `rules[].disabled`| `true` 关闭该规则                             |
| `rules[].allowMessageIds` | 抑制指定 messageId 的告警             |
| `rules[].rules`   | 预设内部嵌套，用于覆盖预设中的单条规则         |

## 忽略机制速查

| 机制                         | 说明                                              |
| ---------------------------- | ------------------------------------------------- |
| `.secretlintignore`          | 同 `.gitignore` 语法，`#` 注释、`!` 取反          |
| 默认忽略                     | `.git` / `node_modules` / `.secretlintrc.*` 等    |
| `secretlint-disable` 注释    | 块级忽略（需 `filter-comments` 规则）             |
| `secretlint-disable-line`    | 忽略当前行                                        |
| `secretlint-disable-next-line` | 忽略下一行                                      |
| `allowMessageIds`            | 按规则 messageId 放行                             |

## 相关链接

- [Secretlint 官网（在线 Demo）](https://secretlint.github.io/) · [GitHub: secretlint/secretlint](https://github.com/secretlint/secretlint)
- [配置文档](https://github.com/secretlint/secretlint/blob/master/docs/configuration.md) · [自定义规则文档](https://github.com/secretlint/secretlint/blob/master/docs/secretlint-rule.md)
- recommend 预设、`pattern` 自定义规则、SARIF formatter、官方 Docker 镜像、`secretlint/git-hooks` 全局钩子
