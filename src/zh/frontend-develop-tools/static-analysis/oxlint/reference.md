---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 oxlint v1.70.0 编写

## 速查

- 用法：`oxlint [PATH]... [选项]`
- 配置：`-c, --config <FILE>`
- 修复：`--fix` / `--fix-suggestions` / `--fix-dangerously`
- 命令行覆盖：`-A/--allow`、`-W/--warn`、`-D/--deny <规则或类别>`
- 阈值：`--max-warnings <N>`
- 输出：`-f, --format <default|json|github|unix|checkstyle>`
- 初始化：`--init`；类型规则：`--type-aware`

## 常用 CLI 参数

| 参数                          | 作用                                               |
| ----------------------------- | -------------------------------------------------- |
| `oxlint [PATH]...`            | 指定要检查的文件/目录（默认当前目录）              |
| `-c, --config <FILE>`         | 指定配置文件（默认 `.oxlintrc.json`）              |
| `--fix`                       | 应用安全自动修复                                   |
| `--fix-suggestions`           | 额外应用"建议级"修复                               |
| `--fix-dangerously`           | 额外应用"危险级"修复（可能改变语义）               |
| `-A, --allow <NAME>`          | 命令行临时关闭某规则/类别（等价 `off`）            |
| `-W, --warn <NAME>`           | 命令行设为警告                                     |
| `-D, --deny <NAME>`           | 命令行设为错误（等价 `error`）                     |
| `--max-warnings <N>`          | 超过 N 个警告则以失败退出（CI 常用 `0`）           |
| `-f, --format <FORMAT>`       | 输出格式：`default` / `json` / `github` / `unix` / `checkstyle` |
| `--init`                      | 生成 `.oxlintrc.json`                              |
| `--type-aware`                | 启用类型感知规则（需 `oxlint-tsgolint`）           |
| `--threads <N>`               | 控制并发线程数                                     |

完整列表见官方 [CLI reference](https://oxc.rs/docs/guide/usage/linter/cli)。

## 配置字段速查

| 字段             | 作用                                       |
| ---------------- | ------------------------------------------ |
| `categories`     | 按类别批量开关规则组                       |
| `rules`          | 精确控制单条规则与严重级、选项             |
| `plugins`        | 启用内置插件（整体替换默认集）             |
| `jsPlugins`      | 加载 JS 自定义插件（alpha）                |
| `overrides`      | 按 `files` glob 分文件覆盖配置             |
| `extends`        | 继承其它配置文件                           |
| `env`            | 启用环境预设全局变量（browser/node…）      |
| `globals`        | 声明自定义全局变量（readonly/writable/off）|
| `settings`       | 插件共享的配置                             |
| `ignorePatterns` | 额外排除的文件                             |

## 规则类别

| 类别          | 含义                          | 默认   |
| ------------- | ----------------------------- | ------ |
| `correctness` | 几乎确定是 bug                | **on** |
| `suspicious`  | 可疑、值得怀疑                | off    |
| `pedantic`    | 严格，可能有误报              | off    |
| `perf`        | 运行时性能                    | off    |
| `style`       | 风格一致性                    | off    |
| `restriction` | 禁用特定写法                  | off    |
| `nursery`     | 实验性规则                    | off    |

## 相关链接

- [Oxc 官网](https://oxc.rs/) · [oxlint 文档](https://oxc.rs/docs/guide/usage/linter)
- [GitHub: oxc-project/oxc](https://github.com/oxc-project/oxc)
- 配套格式化器 oxfmt、迁移工具 `@oxlint/migrate`、共存插件 `eslint-plugin-oxlint`
