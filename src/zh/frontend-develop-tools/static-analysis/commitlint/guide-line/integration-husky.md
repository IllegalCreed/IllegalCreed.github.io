---
layout: doc
outline: [2, 3]
---

# 集成 husky 与 CI

> 基于 commitlint v21.0.2 / husky v9 编写

## 速查

- 职责边界：commitlint **校验消息** / husky **管 Git 钩子** / lint-staged **调度暂存文件**，三者分工不重叠
- 接钩子：`commit-msg`（不是 `pre-commit`）—— 它在消息生成后、提交前触发，正好拿到消息
- husky v9：`npm i -D husky` + `npx husky init`，`.husky/commit-msg` 写 `npx --no -- commitlint --edit $1`
- husky v8 及更早：用 `npx husky install`（v9 改为 `init`）
- `$1` = Git 传入的提交信息文件路径；`--edit` 让 commitlint 读它
- 本地钩子可被 `git commit --no-verify` 绕过 → **必须**辅以 CI 兜底
- CI：push → `npx commitlint --last --verbose`；PR → `npx commitlint --from <base> --to <head> --verbose`
- GitHub Actions 记得 `actions/checkout` 设 `fetch-depth: 0` 才能拿到完整历史

## 三者的边界（重要）

commitlint 常和 husky、lint-staged 一起出现，但三者职责截然不同，别混为一谈：

| 工具         | 角色             | 干什么                                       | 归类             |
| ------------ | ---------------- | -------------------------------------------- | ---------------- |
| **commitlint** | 校验本体         | 判断 commit message 是否合规                 | 静态分析         |
| **husky**      | Git 钩子管理器   | 决定在 `commit-msg` / `pre-commit` 等时机跑什么命令 | 工程化 / DevOps  |
| **lint-staged**| 暂存文件调度器   | 只对 `git add` 过的文件跑命令（如 eslint/prettier） | 工程化 / DevOps  |

一句话区分：

- commitlint **只看消息、不碰文件**；
- lint-staged **只处理文件、不看消息**；
- husky **既不看消息也不处理文件**，它只负责「在某个 Git 事件触发时去调用别人」。

::: tip 为什么 commitlint 算「静态分析」而 husky 不算
静态分析的本质是「不运行程序、对某种制品做规则校验并给出合规判定」。commitlint 正是对 commit message 这一文本制品做校验，故归静态分析；husky 自身不做任何校验，只是事件触发器，属工程化范畴。
:::

典型协作：husky 在 `pre-commit` 调 lint-staged 校验暂存代码、在 `commit-msg` 调 commitlint 校验提交信息——各司其职。

## 为什么挂 commit-msg 而不是 pre-commit

Git 钩子触发时机不同：

- `pre-commit`：在你**还没写**提交信息时触发，此刻拿不到 message，适合跑 lint-staged 检查代码。
- `commit-msg`：在提交信息**已写好、尚未落库**时触发，Git 会把消息文件路径作为参数传进来——这正是校验消息的时机。

所以 commitlint 必须挂在 `commit-msg`。

## 用 husky 接入（v9）

安装并初始化：

```bash
npm install -D husky
npx husky init
```

`husky init` 会创建 `.husky/` 目录、写入示例 `pre-commit`，并在 `package.json` 配好 `prepare` 脚本（`clone` 后 `npm install` 即自动启用钩子）。

接着让 `.husky/commit-msg` 包含这一行：

```bash
npx --no -- commitlint --edit $1
```

- `--edit $1`：读取 Git 传入的提交信息文件并校验。`$1` 是 Git 调用 `commit-msg` 钩子时的第一个参数——存放本次提交信息的临时文件路径（通常是 `.git/COMMIT_EDITMSG`）。
- `npx --no`：本地找不到 commitlint 时**不**去远程下载，避免意外联网。

::: warning husky 版本差异
上面是 `husky@v9` 的写法。v8 及更早用 `npx husky install` 而非 `npx husky init`，钩子文件也需要 `#!/bin/sh` + `. "$(dirname -- "$0")/_/husky.sh"` 头部。请按你的 husky 版本查对应文档。
:::

试一下：

```bash
git commit -m 'foo: bar'    # 失败，被 commit-msg 钩子拦下
git commit -m 'feat: add x' # 通过
```

## 本地校验会被绕过

本地钩子并非铁律——`git commit --no-verify`（`-n`）可以直接跳过所有钩子。这意味着仅靠 husky + commitlint 无法保证「所有进主干的提交都合规」。

结论：**本地求快、CI 兜底**。把 commitlint 同时接到 CI，用不可绕过的流水线做最终门禁。

## 接入 CI

核心命令：

```bash
# push 事件：只校验最后一次提交
npx commitlint --last --verbose

# Pull Request：校验从基底到 PR 头的一段提交
npx commitlint --from <base-sha> --to <head-sha> --verbose
```

`--verbose` 让通过时也打印反馈（commitlint 自 v8 起合法时默认静默）。

### GitHub Actions

```yaml
name: CI

on: [push, pull_request]

permissions:
  contents: read

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 必须，拿到完整历史才能算 range
      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm
      - name: Install commitlint
        run: npm install -D @commitlint/cli @commitlint/config-conventional
      - name: Validate current commit (push)
        if: github.event_name == 'push'
        run: npx commitlint --last --verbose
      - name: Validate PR commits
        if: github.event_name == 'pull_request'
        run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose
```

### GitLab CI

```bash
npx commitlint --from ${CI_MERGE_REQUEST_DIFF_BASE_SHA} --to ${CI_COMMIT_SHA} --verbose
```

CircleCI、Travis、Azure Pipelines、BitBucket 等的变量名不同，思路一致：拿到提交范围喂给 `--from/--to`。

::: tip 想对警告也零容忍
加 `--strict`：遇到警告（level 1）以退出码 `2` 结束、遇到错误（level 2）以退出码 `3` 结束，把警告也升级为会让 CI 失败的硬门禁。
:::
