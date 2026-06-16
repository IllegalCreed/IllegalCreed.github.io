---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 commitlint v21.0.2 编写

## 速查

- 用法：`commitlint [选项]`（默认从 stdin 读消息）
- 读消息：`--edit/-e <file>`（钩子里常配 `$1`）
- 范围：`--from/-f`、`--to/-t`、`--last/-l`、`--from-last-tag`
- 配置：`--config/-g`、`--extends/-x`、`--parser-preset/-p`
- 排查：`--print-config`、`--verbose/-V`
- 门禁：`--strict/-s`（warning 退 2 / error 退 3）
- 兼容：`--default-config`、`--legacy-output`（恢复 v21 前输出）
- 版本节点：v8 起合法提交静默；v21 起输出改用换行分隔

## 常用 CLI 参数

| 参数                    | 短  | 作用                                               |
| ----------------------- | --- | -------------------------------------------------- |
| `--edit <file>`         | -e  | 读取消息文件（钩子里配 `$1`，默认 `.git/COMMIT_EDITMSG`） |
| `--from <ref>`          | -f  | 校验范围下界（起点提交）                           |
| `--to <ref>`            | -t  | 校验范围上界（终点提交）                           |
| `--last`                | -l  | 只校验最后一次提交                                 |
| `--from-last-tag`       | —   | 以最近一个 tag 为范围下界                          |
| `--config <path>`       | -g  | 指定配置文件（缺失则退出码 9）                     |
| `--extends <a> <b>`     | -x  | 命令行追加要继承的共享配置                         |
| `--parser-preset <p>`   | -p  | 指定 conventional-commits-parser 预设             |
| `--format <fmt>`        | -o  | 输出格式                                           |
| `--help-url <url>`      | -H  | 错误信息中附带的帮助链接                           |
| `--print-config`        | —   | 打印继承合并后的最终配置（text/json）              |
| `--default-config`      | —   | 无配置时用内置约定式默认规则                       |
| `--verbose`             | -V  | 通过时也打印反馈                                   |
| `--quiet`               | -q  | 关闭控制台输出                                     |
| `--strict`              | -s  | 严格模式：warning 退 2、error 退 3                 |
| `--legacy-output`       | —   | 使用 v21 之前的输出格式                            |
| `--color`               | -c  | 彩色输出（默认开）                                 |
| `--version`             | -v  | 版本号                                             |

完整列表见官方 [CLI reference](https://commitlint.js.org/reference/cli.html)。

## 配置字段速查

| 字段             | 作用                                            |
| ---------------- | ----------------------------------------------- |
| `extends`        | 继承共享配置（数组，递归合并）                  |
| `rules`          | 自定义规则，覆盖继承值                          |
| `parserPreset`   | 如何把消息解析成 type/scope/subject/body/footer |
| `formatter`      | 结果输出所用的格式化包（默认 `@commitlint/format`） |
| `ignores`        | 函数数组，返回 true 则跳过该消息                |
| `defaultIgnores` | 是否启用内置忽略（merge/revert/版本号等）       |
| `helpUrl`        | 校验失败时提示的帮助链接                        |
| `prompt`         | 交互式提交（cz-commitlint）的 settings/messages/questions |

## 配置文件名

`.commitlintrc` · `.commitlintrc.{json,yaml,yml,js,cjs,mjs,ts,cts,mts}` · `commitlint.config.{js,cjs,mjs,ts,cts,mts}` · `package.json` 的 `commitlint` 字段。

## 规则三元组

```js
"rule-name": [level, applicable, value]
```

- `level`：`0` 关闭 / `1` 警告 / `2` 错误
- `applicable`：`'always'`（必须满足）/ `'never'`（绝不允许）
- `value`：比较值（部分规则不需要）

规则分组与 config-conventional 默认值见 [规则](./guide-line/rules.md)。

## 生态包

| 包                                | 作用                             |
| --------------------------------- | -------------------------------- |
| `@commitlint/cli`                 | 命令行本体                       |
| `@commitlint/config-conventional` | 约定式规则集（最常用）           |
| `@commitlint/config-angular`      | Angular 风格规则集               |
| `@commitlint/config-lerna-scopes` | 按 monorepo 包名约束 scope       |
| `@commitlint/prompt-cli`          | 独立的交互式提交命令             |
| `@commitlint/cz-commitlint`       | commitizen 适配器                |
| `@commitlint/format`              | 默认输出格式化器                 |

## 版本要点

- **v8 起**：提交合法时默认无输出，正向反馈需 `--verbose`。
- **v21 起**：失败输出改用换行分隔（不再是早期冒号样式），旧格式用 `--legacy-output` 恢复。
- 配合 **husky v9** 用 `npx husky init`（v8 用 `husky install`）。
- 交互式提交需 commitlint 及其共享配置 **≥ 12.1.2**。

## 相关链接

- [commitlint 官网](https://commitlint.js.org/) · [配置](https://commitlint.js.org/reference/configuration.html) · [规则](https://commitlint.js.org/reference/rules.html)
- [GitHub: conventional-changelog/commitlint](https://github.com/conventional-changelog/commitlint)
- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- 配套：husky（钩子管理）、lint-staged（暂存文件调度）、commitizen（交互式提交）
