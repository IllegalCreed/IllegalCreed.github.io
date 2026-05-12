---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 ESLint v10.3.0 编写

## 速查

- 检查：`eslint .`
- 修复：`eslint . --fix`
- CI 严格：`eslint . --max-warnings=0`
- 指定配置：`-c eslint.config.mjs`
- 忽略规则报告：`--report-unused-disable-directives`
- 缓存：`--cache`（默认位置 `.eslintcache`）
- stdin：`echo "code" | eslint --stdin --stdin-filename=foo.js`
- 退出码：`0` 通过 / `1` 有 error / `2` 配置或内部错误

## CLI 全参数

下表按官方分组列出。`<value>` 占位表示需要取值；不带 `<>` 的是 boolean 开关。

### 基础配置

| 参数                    | 说明                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `-c, --config <path>`   | 指定配置文件路径（默认 `eslint.config.js`）                       |
| `--no-config-lookup`    | 禁用配置文件自动查找                                              |
| `--inspect-config`      | 启动 ESLint Config Inspector（可视化检查配置）                    |
| `--ext <extensions>`    | 额外的文件扩展名（如 `--ext .vue,.svelte`）                       |
| `--global <vars>`       | 临时定义全局变量供 `no-undef` 使用                                |
| `--parser <parser>`     | 指定解析器（默认 `espree`）                                       |
| `--parser-options <kv>` | `key:value` 形式传 parser 选项                                    |

### 指定规则与插件

| 参数                | 说明                                          |
| ------------------- | --------------------------------------------- |
| `--plugin <names>`  | 命令行加载插件（多次或逗号分隔）              |
| `--rule <rules>`    | 命令行覆盖规则，使用 [levn](https://github.com/gkz/levn) 语法 |

### 修复问题

| 参数                 | 说明                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `--fix`              | 自动修复并写回文件                                                    |
| `--fix-dry-run`      | 演练修复，结果只输出不写文件                                          |
| `--fix-type <types>` | 限制修复类型：`problem` / `suggestion` / `layout` / `directive`，可逗号分隔 |

### 忽略文件

| 参数                          | 说明                                          |
| ----------------------------- | --------------------------------------------- |
| `--no-ignore`                 | 临时禁用所有 ignore 规则（含默认）            |
| `--ignore-pattern <patterns>` | 追加忽略模式（minimatch 语法）                |

### 处理 stdin

| 参数                            | 说明                                          |
| ------------------------------- | --------------------------------------------- |
| `--stdin`                       | 从标准输入读代码                              |
| `--stdin-filename <filename>`   | 告诉 ESLint 这段 stdin 的"虚拟文件名"，用于确定 parser / 规则集 |

### 处理警告

| 参数                       | 说明                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `--quiet`                  | 仅报 error；v9 起还会**跳过执行**严重级为 `"warn"` 的规则（不是只过滤输出）           |
| `--max-warnings <number>`  | 警告数超过该阈值时退出码为 1；默认 `-1` 表示不限制                                    |

### 输出

| 参数                       | 说明                                          |
| -------------------------- | --------------------------------------------- |
| `-o, --output-file <path>` | 把报告写到指定文件                            |
| `-f, --format <name>`      | 选择 formatter（见 [Formatters](#formatters)） |
| `--color` / `--no-color`   | 强制开 / 关彩色输出                            |

### 内联配置

| 参数                                                | 说明                                                        |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `--no-inline-config`                                | 禁用 `// eslint-disable*` 这类行内注释                      |
| `--report-unused-disable-directives`                | 报告无用的 disable 注释                                     |
| `--report-unused-disable-directives-severity <lv>`  | 取值 `off` / `warn` / `error`                               |
| `--report-unused-inline-configs <lv>`               | 报告冗余 inline config（默认 `off`）                        |

### 缓存

| 参数                          | 默认           | 说明                                          |
| ----------------------------- | -------------- | --------------------------------------------- |
| `--cache`                     | `false`        | 仅 lint 上次失败或文件改动的文件              |
| `--cache-location <path>`     | `.eslintcache` | 缓存文件 / 目录位置                            |
| `--cache-strategy <strategy>` | `metadata`     | 取值 `metadata`（按文件时间戳）或 `content`（按文件内容） |

::: warning 与 Prettier 默认不同

Prettier 的 `--cache-strategy` 默认是 `content`，ESLint 默认是 `metadata`。如果项目里频繁出现 `git clone` 之类导致 mtime 变化的场景，建议显式设 `--cache-strategy content`。

:::

### 抑制违规（Suppress Violations）

| 参数                                        | 默认                       | 说明                                       |
| ------------------------------------------- | -------------------------- | ------------------------------------------ |
| `--suppress-all`                            | `false`                    | 将当前所有违规一次性写入 suppressions 文件 |
| `--suppress-rule <rules>`                   | -                          | 仅抑制指定规则                             |
| `--suppressions-location <path>`            | `eslint-suppressions.json` | suppressions 文件位置                      |
| `--prune-suppressions`                      | `false`                    | 移除 suppressions 文件中已不再适用的条目   |
| `--pass-on-unpruned-suppressions`           | `false`                    | 即使存在未清理的 suppressions 也通过       |

::: tip Bulk Suppressions 用途

存量代码量大、想引入新规则但不想一次性修完所有违规时，用 `--suppress-all` 把当前违规快照写入文件，后续 CI 只检查"新增违规"。日常清理用 `--prune-suppressions`。

:::

### 其他

| 参数                                | 说明                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| `--init`                            | 启动配置向导（等价于 `npm init @eslint/config`）                  |
| `--env-info`                        | 输出环境信息（Node / npm / ESLint 版本等）                        |
| `--no-error-on-unmatched-pattern`   | glob 没匹配到任何文件时不报错                                     |
| `--exit-on-fatal-error`             | 遇到致命错误时退出码 2                                            |
| `--no-warn-ignored`                 | 文件被 ignore 时不发出 "File ignored" 警告，适合 lint-staged 场景 |
| `--pass-on-no-patterns`             | 没给任何 pattern 时退出码 0（默认报错）                           |
| `--debug`                           | 打印调试信息                                                      |
| `-h, --help` / `-v, --version`      | 帮助 / 版本                                                       |
| `--print-config <file>`             | 打印对指定文件实际生效的合并配置                                  |
| `--stats`                           | 报告里附加性能统计                                                |
| `--flag <flags>`                    | 启用未稳定的 feature flag                                         |
| `--mcp`                             | 启动 ESLint MCP server                                            |
| `--concurrency <number\|auto\|off>` | 并行 worker 数（默认 `off`）                                       |

## Formatters

通过 `-f` / `--format` 选择，默认 `stylish`。

| 名称                 | 说明                                                |
| -------------------- | --------------------------------------------------- |
| `stylish`            | 默认人类可读输出                                    |
| `json`               | JSON 数组                                           |
| `json-with-metadata` | JSON 数组 + 配置 / 规则元信息                       |
| `html`               | HTML 报告                                           |

::: warning v9 起多个内置 formatter 已移除

`checkstyle` / `compact` / `jslint-xml` / `junit` / `tap` / `unix` / `visualstudio` 已从核心移除，需要时安装独立 npm 包（如 `eslint-formatter-checkstyle`）后通过 `-f checkstyle` 加载。

:::

## 退出码

| 码 | 含义                                                                   |
| -- | ---------------------------------------------------------------------- |
| 0  | 没有 error；如果设置了 `--max-warnings`，warning 数也在阈值内          |
| 1  | 检查到 error，或 warning 数超过 `--max-warnings`                       |
| 2  | ESLint 自身错误：配置不合法、内部异常、`--exit-on-fatal-error` 等      |

## 常用组合

CI 严格模式：

```bash
eslint . --max-warnings=0 --report-unused-disable-directives
```

只检查暂存文件（配合 lint-staged）：

```bash
# package.json 的 lint-staged 字段
"*.{js,ts}": "eslint --fix --no-warn-ignored"
```

引入新规则时用 Bulk Suppressions 冻结存量：

```bash
eslint . --suppress-all                      # 一次性快照
git add eslint-suppressions.json
# 后续 CI：
eslint .                                     # 只检查新增违规
# 清理：
eslint . --prune-suppressions
```
