---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Husky v9 编写。完整 API 见 [官方文档](https://typicode.github.io/husky/)。

## CLI 命令

### `husky` / `husky init`

```bash
pnpm exec husky init          # 在当前 git 仓库初始化 .husky 目录
pnpm exec husky                # 仅设置 git config core.hooksPath（已 init 时用）
```

`husky init` 做的事：

1. 创建 `.husky/` 目录
2. 创建 `.husky/_/.gitignore`（忽略 husky 生成的 shim 文件）
3. 设 `git config core.hooksPath .husky/_`
4. 在 `package.json` 加 `"scripts": { "prepare": "husky" }`

### `husky <path>`

```bash
pnpm exec husky my-hooks      # 用自定义目录替代 .husky
```

git config `core.hooksPath` 指向 `my-hooks/_`。

## Git Hook 完整列表

| Hook | 触发时机 | 接收参数 | 阻塞 |
| --- | --- | --- | --- |
| `applypatch-msg` | `git am` 检查 commit message | 临时 message 文件路径 | ✓ |
| `pre-applypatch` | `git am` 应用补丁前 | - | ✓ |
| `post-applypatch` | `git am` 应用补丁后 | - | ✗ |
| `pre-commit` | `git commit` 前 | - | ✓ |
| `prepare-commit-msg` | 生成默认 commit message 后 | message 文件 / 类型 / commit SHA | ✓ |
| `commit-msg` | 用户编辑完 commit message | 临时 message 文件路径 | ✓ |
| `post-commit` | 提交完成后 | - | ✗ |
| `pre-rebase` | `git rebase` 前 | upstream / branch | ✓ |
| `post-checkout` | `git checkout` 后 | 前一 HEAD / 当前 HEAD / 是否切分支 | ✗ |
| `post-merge` | `git merge` 后 | 是否 squash | ✗ |
| `pre-push` | `git push` 前 | remote 名 / URL | ✓ |
| `pre-receive` | 服务端：接收 push 前 | stdin 接 ref 列表 | ✓ |
| `update` | 服务端：每个 ref 更新前 | ref / old / new | ✓ |
| `post-receive` | 服务端：接收 push 后 | stdin 接 ref 列表 | ✗ |
| `post-update` | 服务端：所有 ref 更新后 | 更新的 ref 列表 | ✗ |
| `pre-auto-gc` | 自动 GC 前 | - | ✓ |
| `post-rewrite` | `git commit --amend` / `git rebase` 后 | 命令 / stdin 接 SHA 映射 | ✗ |
| `sendemail-validate` | `git send-email` 前 | message 文件 | ✓ |

**阻塞 ✓**：返回非 0 退出码会取消操作（如 `pre-commit` 失败则不提交）。

## 环境变量

| 变量                       | 作用                                                  |
| -------------------------- | ----------------------------------------------------- |
| `HUSKY`                    | `0` 禁用所有 Husky hook                              |
| `HUSKY_DEBUG`              | `1` 输出详细调试日志                                  |
| `HUSKY_GIT_PARAMS`         | （已废弃）v8 之前传递 git 参数                       |
| `XDG_CONFIG_HOME`          | init.sh 路径优先级（替代 `~/.config`）              |

## 文件结构（v9）

```
project/
├── .git/
│   └── hooks/             # 软链由 core.hooksPath 替代
├── .husky/
│   ├── _/                 # husky 内部生成（用户不应改）
│   │   ├── .gitignore     # 忽略本目录所有文件
│   │   ├── h              # 公共 shim 脚本
│   │   ├── pre-commit     # 指向 ../pre-commit
│   │   ├── commit-msg
│   │   └── ...
│   ├── pre-commit         # 用户脚本
│   └── commit-msg
└── package.json
```

`core.hooksPath = .husky/_` —— git 找到 `_/pre-commit` shim，shim 调用 `../pre-commit`。

## init.sh 启动顺序

Husky 在执行用户 hook 前，按以下顺序查找启动文件（找到第一个就用）：

1. `$XDG_CONFIG_HOME/husky/init.sh`
2. `~/.config/husky/init.sh`
3. `~/.huskyrc`（已废弃）

**典型用途**：

```sh
# ~/.config/husky/init.sh

# 1. 让 nvm 在 GUI 工具中可用
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# 2. 修补 PATH
export PATH="$HOME/.local/bin:$PATH"

# 3. 全局禁用（紧急时用）
# export HUSKY=0
```

## package.json 配置

```json
{
  "scripts": {
    "prepare": "husky"            // pnpm install 后自动运行
  },
  "devDependencies": {
    "husky": "^9.1.0"
  }
}
```

Yarn 用户改用 `postinstall`：

```json
{
  "scripts": {
    "postinstall": "husky"
  }
}
```

::: warning Yarn Classic 不支持 prepare

Yarn 2+ 已支持 `prepare`，仅 Yarn 1（Classic）需要 `postinstall`。

:::

## Hook 脚本退出码约定

| 退出码 | 含义                                                  |
| ------ | ----------------------------------------------------- |
| 0      | 通过（继续 git 操作）                                |
| 非 0   | 失败（阻塞 git 操作）                                |
| 130    | 用户 Ctrl+C 中断                                      |

```shell
# .husky/pre-commit
set -e                          # 任一命令失败即退出（v9 不内置）
pnpm lint-staged
pnpm test:unit
```

::: tip set -e

v9 之前 husky shim 内置 `set -e`，v9 简化后不再自动加。如果想让 hook 任一命令失败即停，需自己加 `set -e`。

:::

## 跳过 hook 的全部途径

### 命令级

```bash
git commit --no-verify -m "..."       # 等价 -n
git push --no-verify
git merge --no-verify
git rebase --no-verify
```

### 环境变量

```bash
HUSKY=0 git commit -m "..."           # 单次禁用
export HUSKY=0; git ...; unset HUSKY  # 当前 shell 禁用

# 全局禁用（init.sh 中）
export HUSKY=0
```

### 配置文件

`package.json` 中 `"prepare": "husky"` 改为：

```json
{
  "scripts": {
    "prepare": "husky || true"        // husky 不存在不报错
  }
}
```

### 完全卸载

```bash
pnpm remove husky
rm -rf .husky/
git config --unset core.hooksPath
```

## 与 lint-staged 整合速查

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,vue}": [
      "eslint --fix --cache --max-warnings=0",
      "prettier --write"
    ],
    "*.{json,md,css,scss,yml,yaml}": "prettier --write",
    "**/*.{ts,tsx}": () => "tsc --noEmit",
    "package.json": "sort-package-json"
  }
}
```

```shell
# .husky/pre-commit
pnpm lint-staged
```

详细 lint-staged 配置见 [lint-staged 指南](../lint-staged/guide-line)。

## 常见 hook 模板

### pre-commit：增量 lint + format

```shell
pnpm lint-staged
```

### pre-commit：完整 lint

```shell
pnpm lint
pnpm format:check
```

### commit-msg：commitlint

```shell
pnpm commitlint --edit $1
```

### prepare-commit-msg：自动加 issue 号

```shell
#!/usr/bin/env sh
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
ISSUE=$(echo "$BRANCH" | grep -oE "[A-Z]+-[0-9]+")

if [ -n "$ISSUE" ]; then
  CURRENT_MSG=$(cat "$1")
  if ! echo "$CURRENT_MSG" | grep -q "$ISSUE"; then
    echo "[$ISSUE] $CURRENT_MSG" > "$1"
  fi
fi
```

### pre-push：分支保护 + 测试

```shell
PROTECTED='main develop'
BRANCH=$(git symbolic-ref --short HEAD)

for p in $PROTECTED; do
  if [ "$BRANCH" = "$p" ]; then
    echo "禁止直接 push 到 $p，请走 PR"
    exit 1
  fi
done

pnpm test
```

### pre-push：仅推送当前修改的包

```shell
# 仅 affected 的 turborepo 任务跑测试
pnpm turbo run test --affected
```

### post-checkout：自动 install 依赖

```shell
#!/usr/bin/env sh
PREV=$1; CURR=$2; FLAG=$3   # FLAG=1 是切分支
if [ "$FLAG" = "1" ]; then
  if ! git diff --quiet $PREV $CURR -- package.json pnpm-lock.yaml; then
    echo "依赖变更，自动 pnpm install..."
    pnpm install
  fi
fi
```

### post-merge：拉取后同步依赖

```shell
#!/usr/bin/env sh
if git diff HEAD@{1} HEAD --name-only | grep -E "pnpm-lock.yaml|package.json"; then
  echo "依赖变更，自动 pnpm install..."
  pnpm install
fi
```

## 故障排查清单

| 现象                                | 排查方向                                                |
| ----------------------------------- | ------------------------------------------------------- |
| hook 不触发                         | `git config --get core.hooksPath` 是否指向 `.husky/_`  |
| `command not found: husky`          | 漏装 husky / CI 只装 dependencies → 加 `\|\| true` 兜底 |
| `command not found: pnpm`           | GUI 工具 PATH 缺失，配 `~/.config/husky/init.sh`        |
| Windows 上 hook 不执行              | 文件编码非 UTF-8 / 无 LF（要 Unix line endings）        |
| `.git/hooks/` 还有旧脚本干扰        | `git config --unset core.hooksPath` 后重 `prepare`     |
| Husky 提示 v8 → v9 警告             | 升级到 v9 + 清理旧 hook shebang                         |
| commit-msg 拿不到正确 $1            | 用 `$1` 不是 `$0`；测试用 `echo "test" > /tmp/m && sh .husky/commit-msg /tmp/m` |
| `nvm` 在 hook 中失效                | init.sh 显式 source nvm.sh                              |
| pre-commit 太慢                     | 拆 lint-staged 命中文件减少 / 异步任务移 CI            |
| GUI 工具跳过 hook                   | 通常不会跳过；检查 GUI 工具是否走系统 git binary       |

## 版本里程碑

| 版本 | 时间 | 主要变化 |
| --- | --- | --- |
| v0.x | 2014-2016 | Husky 诞生（typicode） |
| v4   | 2019 | 配置在 `package.json.husky`，每次 hook 启动 Node 慢 |
| v5/6 | 2021 | `.husky/` 目录 + shell 文件，启动改快 |
| v7   | 2021 | shim 简化，无 `set -e` 默认 |
| v8   | 2022 | API 收窄到 `husky install` 单命令 |
| v9   | 2024 | 进一步简化，hook 文件无需 shebang；包减小至 ~10KB |
| v10  | 计划 | 移除 init.sh 链；lifecycle hook 机制 |

## 参考链接

- [Husky 官方文档](https://typicode.github.io/husky/)
- [GitHub](https://github.com/typicode/husky)
- [Git Hooks 官方说明](https://git-scm.com/docs/githooks)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [commitlint](https://commitlint.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [pre-commit](https://pre-commit.com/) — Python 版替代品
- [lefthook](https://github.com/evilmartians/lefthook) — Go 版替代品
- [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) — 极简替代品
