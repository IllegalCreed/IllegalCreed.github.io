---
layout: doc
outline: [2, 3]
---

# 集成 pre-commit 与 CI

> 基于 Secretlint v13.0.2 编写

## 速查

- 核心价值在「提交前拦截」，落地靠 **pre-commit 钩子 + CI** 双保险
- Husky + lint-staged：`package.json` 配 `"lint-staged": { "*": ["secretlint --no-glob"] }`
- **`--no-glob` 必加**：lint-staged 已传入文件名，无需 Secretlint 再做 glob
- pre-commit 框架（Python）：`.pre-commit-config.yaml` 用 `language: docker_image` 跑官方镜像
- 纯 Bash 钩子：`git diff --cached --name-only` 取暂存文件喂给 `secretlint`
- 全局钩子：`git config --global core.hooksPath`，对所有仓库生效（官方 `secretlint/git-hooks`）
- GitHub Actions：`npm ci` + `npx secretlint "**/*"`，失败即阻断
- 只查改动文件：配合 `tj-actions/changed-files` 把变更文件名传给 secretlint
- 安全平台：`--format @secretlint/secretlint-formatter-sarif` 产出 SARIF
- Mega-Linter 默认集成 secretlint，可一键纳入聚合检查

## 为什么要双保险

Secretlint 的定位是 shift-left——在密钥进入 Git 历史**之前**拦下。但本地钩子可能被 `--no-verify` 绕过，所以稳妥做法是：

1. **本地 pre-commit**：第一道关，提交瞬间拦截，反馈最快
2. **CI**：第二道关，兜底拦下本地漏掉或绕过的情况

## Husky + lint-staged（Node.js 项目首选）

安装 Husky 与 lint-staged，在 `.husky/pre-commit` 调用 `lint-staged`，并在 `package.json` 配置：

```json
{
  "lint-staged": {
    "*": ["secretlint --no-glob"]
  }
}
```

这表示提交前用 Secretlint 检查每个暂存文件。

::: warning 一定要加 --no-glob
lint-staged 会把匹配到的文件名直接作为参数传给命令。此时 Secretlint 不应再对这些名字做 glob 匹配，否则可能匹配不到——所以必须加 `--no-glob`，让它按文件名逐个处理。
:::

## pre-commit 框架（适合 Docker 项目）

如果团队用 Python 的 [pre-commit](https://pre-commit.com/) 框架，可直接跑官方 Docker 镜像，免装 Node：

```yaml
# .pre-commit-config.yaml
- repo: local
  hooks:
    - id: secretlint
      name: secretlint
      language: docker_image
      entry: secretlint/secretlint:latest secretlint
```

## 纯 Bash 钩子

不想引入额外工具时，把下面脚本存为 `.git/hooks/pre-commit` 并 `chmod +x`：

```bash
#!/bin/sh
FILES=$(git diff --cached --name-only --diff-filter=ACMR | sed 's| |\\ |g')
[ -z "$FILES" ] && exit 0

echo "$FILES" | xargs ./node_modules/.bin/secretlint
RET=$?
[ $RET -eq 0 ] && exit 0 || exit 1
```

## 全局钩子（保护所有仓库）

想让任意项目提交时都过一遍 Secretlint，用 Git 2.9+ 的 `core.hooksPath`：

```bash
git clone https://github.com/secretlint/git-hooks git-hooks
cd git-hooks
git config --global core.hooksPath "$(pwd)/hooks"
```

之后在任何仓库提交，都会先被 Secretlint（基于 Docker）检查。

## GitHub Actions

全量扫描，发现密钥让流水线失败、阻断 PR：

```yaml
name: Secretlint
on: [push, pull_request]
permissions:
  contents: read
jobs:
  secretlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx secretlint "**/*"
```

### 只检查改动文件

大仓库全量扫描慢，可只查本次变更的文件：

```yaml
- uses: tj-actions/changed-files@v44
  id: changed-files
- run: npx secretlint ${{ steps.changed-files.outputs.all_changed_files }}
  if: steps.changed-files.outputs.any_changed == 'true'
```

## 对接安全平台（SARIF）

输出 SARIF 格式，上报到 GitHub Code Scanning 等平台：

```bash
npm install -D @secretlint/secretlint-formatter-sarif
secretlint --format @secretlint/secretlint-formatter-sarif "**/*"
```

## Mega-Linter

[Mega-Linter](https://megalinter.io/) 是聚合 80+ linter 的工具，**默认集成 secretlint**。已用 Mega-Linter 的项目无需额外配置即可纳入密钥检查：

```bash
npx mega-linter-runner --install
```

CLI 参数与退出码细节见 [参考](../reference.md)。
