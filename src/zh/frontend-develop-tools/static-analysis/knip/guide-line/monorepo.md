---
layout: doc
outline: [2, 3]
---

# Monorepo 与报告器

> 基于 Knip v6.17.1 编写

## 速查

- 自动识别 workspace：`package.json` 的 `workspaces` / `pnpm-workspace.yaml` 的 `packages` / Knip 配置的 `workspaces`
- 每个 workspace 在 `workspaces` 键下按目录配置，根目录用 `"."`（根级 `entry`/`project` 会被忽略）
- 选择 workspace：`--workspace <name>`（`-W`），默认含其祖先与依赖方
- 隔离单包：`--workspace X` 配 `--strict`，或直接在该包目录里运行
- 报告器（8 种）：`symbols`(默认) / `compact` / `json` / `markdown` / `disclosure` / `codeowners` / `codeclimate` / `github-actions`
- 多报告器：重复 `--reporter`；传选项：`--reporter-options '<json>'`
- 提速：`--cache`（连续运行快 10–40%）

## workspace 自动识别

Knip 按以下来源（含优先级）自动发现 workspace，**无需手动列出**：

1. `package.json` 的 `workspaces` 数组（npm / Bun / Yarn / Lerna）
2. `pnpm-workspace.yaml` 的 `packages` 数组（pnpm）
3. `package.json` 的旧式 `workspaces.packages`
4. Knip 配置 `workspaces` 对象中、上面尚未定义的项

## 按 workspace 配置

在 `workspaces` 键下，以**目录路径为 key** 分别配置；根目录用 `"."`：

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "workspaces": {
    ".": {
      "entry": "scripts/*.ts",
      "project": "scripts/**/*.ts"
    },
    "packages/*": {
      "entry": "{index,cli}.ts",
      "project": "**/*.ts"
    },
    "packages/cli": {
      "entry": "bin/cli.js"
    }
  }
}
```

每个 workspace 继承默认设置，可各自覆盖 `entry` / `project` / 插件等。

::: warning 根级 entry/project 会被忽略
在多 workspace 项目里，**根层的 `entry` 和 `project` 不生效**——要配置根目录请用 `"."` 这个 workspace。
:::

## --workspace 标志 vs workspaces 配置

- `workspaces` **配置**：定义有哪些 workspace、各自如何分析
- `--workspace`（`-W`）**标志**：选择本次只分析哪些 workspace

```bash
# 只分析某个包（默认会带上它的祖先与依赖方，保证一致性）
knip --workspace packages/my-lib

# 通配/排除
knip --workspace '@myorg/*' --workspace '!@myorg/legacy'
```

想**完全隔离**单个 workspace（不带祖先/依赖方），把 `--workspace` 与 `--strict`（严格生产模式）组合，或直接进该包目录运行 `knip`。

## 报告器（reporters）

Knip 内置 8 种报告器，用 `--reporter` 选择：

| 报告器           | 用途                                        |
| ---------------- | ------------------------------------------- |
| `symbols`（默认）| 终端友好的彩色输出                          |
| `compact`        | 更紧凑的终端输出                            |
| `json`           | 机器可读，供脚本/CI/工具消费                |
| `markdown`       | 按问题类型分表的 Markdown，便于落档         |
| `disclosure`     | 用 `<details>` 折叠分组的 HTML              |
| `codeowners`     | 结合 `.github/CODEOWNERS` 标注归属          |
| `codeclimate`    | Code Climate 报告 JSON                      |
| `github-actions` | 在 PR 上行内标注                            |

```bash
knip --reporter compact
knip --reporter github-actions

# 同时输出多种
knip --reporter json --reporter markdown

# 传选项
knip --reporter codeowners \
     --reporter-options '{"path":".github/CODEOWNERS"}'
```

还可写**自定义报告器**：`knip --reporter ./my-reporter.ts`（接口为 `(options: ReporterOptions) => void`），或指向某个 npm 包。

## 接入 CI 的实践

```bash
# 只看生产代码（排除测试/配置与 devDependencies）
knip --production

# 大仓库连续运行开缓存提速
knip --cache
```

Knip 有问题即非零退出，配合 `github-actions` 报告器可在 PR 行内提示。命令全貌见 [参考](../reference.md)。
