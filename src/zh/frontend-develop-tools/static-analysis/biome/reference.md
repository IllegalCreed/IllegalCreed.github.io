---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Biome v2.5.0 编写

## 速查

- 用法：`npx @biomejs/biome <命令> [路径]... [选项]`
- 命令：`init` / `format` / `lint` / `check` / `ci` / `migrate` / `search` / `explain` / `rage` / `lsp-proxy` / `clean`
- 写回：`--write`（别名 `--fix`）；不安全修复：`--unsafe`
- 配置：`-c, --config-path <FILE>`
- CI 卡口：`--error-on-warnings`；报告：`--reporter <github|gitlab|junit|json|summary…>`
- 限量：`--max-diagnostics <N>`（默认 20）；级别：`--diagnostic-level <info|warn|error>`
- 增量：`--staged` / `--changed` / `--since <分支>`

## 常用命令

| 命令              | 作用                                          |
| ----------------- | --------------------------------------------- |
| `biome init`      | 生成 `biome.json`                             |
| `biome format`    | 仅格式化                                      |
| `biome lint`      | 仅代码检查                                    |
| `biome check`     | 格式化 + lint + 整理 import（一把梭）         |
| `biome ci`        | CI 专用：只读、不改文件，发现问题即失败       |
| `biome migrate`   | 迁移配置（`eslint` / `prettier` 子命令）      |
| `biome search`    | 实验：按 GritQL 模式搜索代码                  |
| `biome explain`   | 查看规则/CLI 的说明文档                       |
| `biome rage`      | 打印调试信息                                  |
| `biome lsp-proxy` | 作为 LSP 服务器（编辑器集成）                 |
| `biome clean`     | 清理守护进程日志                              |

## 常用 CLI 选项

| 选项                      | 作用                                                       |
| ------------------------- | ---------------------------------------------------------- |
| `--write`（`--fix`）      | 应用安全修复 + 格式化 + 整理 import                        |
| `--unsafe`                | 额外应用不安全修复（配合 `--write`，可能改变语义）         |
| `-c, --config-path <FILE>`| 指定配置文件                                               |
| `--reporter <FORMAT>`     | 报告格式：`github`/`gitlab`/`junit`/`json`/`summary`/`checkstyle`/`sarif` 等 |
| `--error-on-warnings`     | 有 warn 即以错误码退出（CI 卡口）                          |
| `--max-diagnostics <N>`   | 限制显示的诊断数量（默认 20）                              |
| `--diagnostic-level <LV>` | 显示的最低诊断级别（`info`/`warn`/`error`）                |
| `--staged`                | 只检查 git 暂存文件（需开 `vcs`）                          |
| `--changed` / `--since`   | 只检查相对默认/指定分支的改动文件                          |
| `--skip-parse-errors`     | 跳过有语法错误的文件而非报错                               |
| `--verbose`               | 打印更多诊断信息                                           |

完整列表见官方 [CLI reference](https://biomejs.dev/reference/cli/)。

## 配置字段速查

| 字段          | 作用                                              |
| ------------- | ------------------------------------------------- |
| `$schema`     | JSON schema 路径（编辑器补全）                    |
| `root`        | 是否为根配置（monorepo 子包设 `false`）           |
| `extends`     | 继承其它配置（可用 `"//"` 指向 monorepo 根）      |
| `files`       | 文件范围：`includes`（`!` 排除/`!!` 强制忽略）、`maxSize` 等 |
| `vcs`         | VCS 集成：`enabled` / `clientKind: git` / `useIgnoreFile` |
| `formatter`   | 语言无关格式化：`indentStyle`/`indentWidth`/`lineWidth`/`lineEnding` |
| `linter`      | 代码检查：`rules`（按组/按规则）、`domains`        |
| `assist`      | 代码助手：`actions`（如 `source.organizeImports`）|
| `javascript`  | JS/TS 专属：`formatter.quoteStyle` 等、`parser`、`globals` |
| `json`/`css`/`graphql`/`html` | 各语言专属 parser/formatter（CSS/GraphQL/HTML 默认不格式化） |
| `overrides`   | 按 `includes` glob 分文件覆盖配置                 |
| `plugins`     | GritQL 插件（`.grit` 文件）                       |

## 格式化默认值

| 选项                          | 默认     |
| ----------------------------- | -------- |
| `formatter.indentStyle`       | `tab`    |
| `formatter.indentWidth`       | `2`      |
| `formatter.lineWidth`         | `80`     |
| `formatter.lineEnding`        | `lf`     |
| `javascript.formatter.quoteStyle`   | `double` |
| `javascript.formatter.semicolons`   | `always` |
| `javascript.formatter.trailingCommas` | `all`  |
| `javascript.formatter.arrowParentheses` | `always` |

## 规则组与严重级

| 规则组          | 含义                       |
| --------------- | -------------------------- |
| `accessibility` | 无障碍问题                 |
| `complexity`    | 可简化的复杂代码           |
| `correctness`   | 几乎确定是 bug / 无用代码  |
| `nursery`       | 实验性规则                 |
| `performance`   | 运行时性能                 |
| `security`      | 潜在安全隐患               |
| `style`         | 一致、地道的写法           |
| `suspicious`    | 很可能有问题的代码         |

严重级：`off` / `info` / `warn` / `error`（`on` = 按规则默认级开启）。

## 相关链接

- [Biome 官网](https://biomejs.dev/) · [配置参考](https://biomejs.dev/reference/configuration/) · [规则列表](https://biomejs.dev/linter/rules/)
- [GitHub: biomejs/biome](https://github.com/biomejs/biome)
- 迁移命令 `biome migrate eslint/prettier`、GritQL 插件、Playground（在线试玩）
