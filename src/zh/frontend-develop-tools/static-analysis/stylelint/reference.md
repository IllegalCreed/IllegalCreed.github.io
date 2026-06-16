---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Stylelint v17.13.0 编写

## 速查

- 用法：`stylelint [输入 glob]... [选项]`（glob 必须用引号）
- 配置：`-c, --config <file>`；查看生效配置：`--print-config <file>`
- 修复：`--fix`（次选项 `disableFix` 可对单条规则关闭修复）
- 输出：`-f, --formatter <string|json|github|compact|unix|tap|verbose>`
- 阈值：`--max-warnings <n>`（CI 常用 `0`）
- 忽略：`--ignore-path <file>`、`--ignore-pattern <p>`、`--allow-empty-input`
- 缓存：`--cache`、`--cache-location <path>`、`--cache-strategy <metadata|content>`
- 退出码：`1` 致命 · `2` 有问题 · `64` 用法错误 · `78` 配置无效

## 常用 CLI 参数

| 参数                              | 作用                                                |
| --------------------------------- | --------------------------------------------------- |
| `stylelint "<glob>"`              | 指定要检查的文件（glob 用引号包裹）                 |
| `-c, --config <file>`             | 指定配置文件                                        |
| `--print-config <file>`           | 打印某文件最终生效的配置                            |
| `--fix`                           | 自动修复可修复的违规                                |
| `-f, --formatter <name>`          | 输出格式：`string`/`json`/`github`/`compact`/`unix`/`tap`/`verbose` |
| `-q, --quiet`                     | 只报错误，忽略警告                                  |
| `--quiet-deprecation-warnings`    | 抑制弃用告警                                        |
| `--max-warnings <n>` (`--mw`)     | 超过 n 个警告则失败（CI 常用 `0`）                  |
| `--custom-syntax <path>`          | 指定自定义语法（如 `postcss-scss`）                 |
| `-i, --ignore-path <file>`        | 指定忽略文件（可重复）                              |
| `--ignore-pattern <p>` (`--ip`)   | 追加忽略模式                                        |
| `--allow-empty-input` (`--aei`)   | glob 无匹配时不报错                                 |
| `--cache`                         | 缓存结果，仅查变更文件                              |
| `--cache-location <path>`         | 缓存文件路径（默认 `./.stylelintcache`）            |
| `--cache-strategy <type>`         | 缓存策略：`metadata` / `content`                    |
| `--report-needless-disables` (`--rd`) | 报告多余的 disable 注释                         |
| `--stdin`                         | 从标准输入读取（即使为空）                          |
| `-o, --output-file <path>`        | 将报告写入文件                                      |
| `--color` / `--no-color`          | 强制开/关彩色输出                                   |
| `-v, --version`                   | 显示版本                                            |

完整列表见官方 [CLI reference](https://stylelint.io/user-guide/cli)。

## 配置字段速查

| 字段                            | 作用                                       |
| ------------------------------- | ------------------------------------------ |
| `extends`                       | 继承共享配置（数组，后者覆盖前者）         |
| `plugins`                       | 加载第三方插件规则                         |
| `rules`                         | 精确控制单条规则与严重级、选项             |
| `customSyntax`                  | 指定 PostCSS 自定义语法                    |
| `overrides`                     | 按 `files` glob 分文件覆盖配置             |
| `defaultSeverity`               | 未声明 severity 时的默认级别               |
| `ignoreFiles`                   | glob 忽略文件                              |
| `cache`                         | 缓存结果只查变更文件                       |
| `allowEmptyInput`              | glob 无匹配时不报错                        |
| `reportNeedlessDisables`        | 报告多余的 disable                         |
| `reportInvalidScopeDisables`    | 报告禁用了不存在规则的 disable             |
| `reportDescriptionlessDisables` | 报告缺理由的 disable                       |

## 规则值与次选项

| 形态                        | 含义                       |
| --------------------------- | -------------------------- |
| `null`                      | 关闭规则                   |
| `true`                      | 用默认设置开启             |
| `["主选项", { 次选项 }]`    | 带选项开启                 |

次选项：`severity`（`warning`/`error`，默认 error）、`message`、`url`、`disableFix`、`reportDisables`、各规则特有的 `ignore*`。

## 内置 formatter

| formatter | 默认场景        |
| --------- | --------------- |
| `string`  | **CLI 默认**    |
| `json`    | **Node API 默认** |
| `github`  | GitHub Actions  |
| `compact` | 紧凑            |
| `unix`    | Unix 风格       |
| `tap`     | TAP             |
| `verbose` | 详细统计        |

## 退出码

| 退出码 | 含义           |
| ------ | -------------- |
| `1`    | 致命错误       |
| `2`    | 发现 lint 问题 |
| `64`   | CLI 用法错误   |
| `78`   | 配置文件无效   |

## 相关链接

- [Stylelint 官网](https://stylelint.io/) · [配置文档](https://stylelint.io/user-guide/configure) · [规则列表](https://stylelint.io/user-guide/rules)
- [GitHub: stylelint/stylelint](https://github.com/stylelint/stylelint)
- 生态：共享配置 `stylelint-config-standard` / `-scss`、插件 `stylelint-scss` / `stylelint-order`、自定义语法 `postcss-scss` / `postcss-html`、官方 VS Code 扩展
