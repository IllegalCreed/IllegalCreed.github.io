---
layout: doc
outline: [2, 3]
---

# 指南

## 速查

- 添加新 `hook`：`echo "npm test" > .husky/pre-commit`
- 临时禁用：`-n` / `HUSKY=0`
- 禁用真实提交：`exit 1`
- 预执行脚本：`~/.config/husky/init.sh` / `C:\Users\yourusername\.config\husky\init.sh`

## 添加新的Hook

```shell
echo "npm test" > .husky/pre-commit
```

### **`husky` 支持的 `hooks`**

- **pre-commit**：提交前运行。
- **prepare-commit-msg**：准备提交消息时运行。
- **commit-msg**：验证提交消息。
- **post-commit**：提交后运行。
- **pre-rebase**：变基前运行。
- **post-checkout**：检出后运行。
- **post-merge**：合并后运行。
- **pre-push**：推送前运行。
- **pre-auto-gc**：自动垃圾回收前运行。
- **post-rewrite**：重写历史后运行（如 git commit --amend）。
- **applypatch-msg**：应用补丁消息时运行（git am）。
- **pre-applypatch**：应用补丁前运行。
- **post-applypatch**：应用补丁后运行。

::: tip
**关于 git hooks**：https://git-scm.com/docs/githooks
:::

::: warning
在 `windows` 上，脚本文件编码必须是 `UTF-8` 才能被识别为脚本，否则会被认为二进制文件而无法执行
:::

## 启动文件

在执行hook脚本之前，Husky 会按顺序检查以下文件（如果存在的就执行）：

1. `$XDG_CONFIG_HOME/husky/init.sh`
2. `~/.config/husky/init.sh`
3. `~/.huskyrc` （已废弃）

> **Windows 路径**：在 Windows 上，路径是 `C:\Users\yourusername\.config\husky\init.sh`（`yourusername` 替换为你的用户名）。

### **举例说明**

创建 `C:\Users\yourusername\.config\husky\init.sh` 文件

```shell
#!/bin/bash
# 初始化 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # 加载 nvm

# 使用指定的 Node 版本
nvm use 20.11.0

# 可选：打印当前 Node 版本，确认加载成功
echo "Using Node $(node -v)"
```

触发任一 `hook`，比如 `.husky/pre-commit`

```shell
git add .
git commit -m "test with nvm"
```

**执行顺序**：

1. `Husky` 检测到钩子触发，先运行 `C:\Users\yourusername\.config\husky\init.sh`。
2. `init.sh` 加载 `nvm` 并切换到 `Node 20.11.0`。
3. 输出类似 `Using Node v20.11.0`。
4. 执行 `.husky/pre-commit`，运行 `pnpm lint-staged`。

## 跳过 Husky 的 Git 钩子

### 使用git参数 `-n/--no-verify`

```shell
git commit -m "quick fix" -n
```

或者

```shell
git push --no-verify
```

### **使用环境变量** `HUSKY=0`

```shell
HUSKY=0 git rebase main
```

### 对于多条命令

```shell
export HUSKY=0 # Disables all Git hooks
git ...
git ...
unset HUSKY # Re-enables hooks
```

### 通过配置文件

linux/mac：`~/.config/husky/init.sh` 

windows：`C:\Users\yourusername\.config\husky\init.sh`

```shell
export HUSKY=0
```

此方法针对 `GUI git` 工具。无法修改命令时使用。

## CI服务器 和 Docker

在 `CI服务器` 上安装并配置 `Husky` 是没有意义的，因为用不到，所以我们要想办法禁用掉它。

对于 `github actions` 你可以:

```yml
env:
  HUSKY: 0
```

对于 `gitlab ci/cd` 你可以：

```yml
variables:
  HUSKY: "0"
```

如果只安装 `dependencies` ，不安装 `devDependencies` ，则执行 `prepare` 脚本时有可能报错。

为了避免这个报错，你可以

```json
// package.json
"prepare": "husky || true"
```

但这样依然会在输出中看到 `command not found` 的错误信息。

为了一劳永逸解决这个问题，你可以创建文件 `.husky/install.mjs`

```javascript
// Skip Husky install in production and CI
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  process.exit(0)
}
const husky = (await import('husky')).default
console.log(husky())
```

然后修改 `prepare` 脚本

```json
"prepare": "node .husky/install.mjs"
```

## 在不提交的情况下测试 Hook

```shell
# .husky/pre-commit

# Your WIP script
# ...

exit 1
```

这样即使脚本通过也不会提交。

## **项目不在 Git 根目录中**

假设目录结构如下：

```shell
.
├── .git/
├── backend/  # No package.json
└── frontend/ # Package.json with husky
```

修改 `prepare` 脚本

```json
"prepare": "cd .. && husky frontend/.husky"
```

修改 `hook` 脚本

```shell
# frontend/.husky/pre-commit
cd frontend
npm test
```

## 非 shell 钩子

如果你需要执行 `node` 脚本，而不仅仅是 `shell` 脚本，你可以按照如下步骤操作。

1. 创建 `hook` 入口
    
    ```shell
    .husky/pre-commit
    ```
    
2. 在文件中添加语句
    
    ```shell
    node .husky/pre-commit.js
    ```
    
3. 在 `js` 中编写代码
    
    ```shell
    // Your NodeJS code
    // ...
    ```
    

## Bash 脚本

`Hook` 脚本需要符合 `POSIX` 以确保最佳兼容性，所以这里其实不推荐写 `Bash` 脚本。

```shell
# .husky/pre-commit

bash << EOF
# Put your bash script inside
# ...
EOF
```

::: warning
`windows` 不支持 `bash`，所以除非你确定你的团队都不会用 `windows`，否则不要使用 `bash` 脚本
:::

::: tip **POSIX 是什么?**
**Portable Operating System Interface**（可移植操作系统接口）。由 IEEE（电气电子学会）制定的标准，旨在定义 `Unix-like` 操作系统的接口和行为，确保软件在不同系统间的可移植性
:::

## 使用NVM

如果出现 `command not found` 消息，请检查：

```shell
echo $PATH
```

确保你的 `node` 目录在输出中，`nvm` 一般使用 `shell` 启动文件（`.zshrc`、`.bashrc` 等）配置环境变量 `PATH`

但 GUI 经常不会执行导致无法初始化 `nvm` 导致找不到 `node` 命令

### 解决方案

在 `~/.config/husky/init.sh` 中将 `nvm` 初始化代码粘过来

```shell
# ~/.config/husky/init.sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

## 手动配置

如果你不想使用 `pnpm exec husky init` 执行自动配置，你也可以手动配置。

配置 `package.json`

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

::: warning Yarn 用户注意
Yarn 不支持 `prepare` 生命周期脚本，需要改用 `postinstall`：

```json
{
  "scripts": {
    "postinstall": "husky"
  }
}
```
:::

执行

```shell
pnpm run prepare
```

在生成的 `.husky/` 目录中创建文件

```shell
# .husky/pre-commit
pnpm test
```

## 故障排除

### **钩子未运行**

1. 确定 `git` 版本大于 `2.9`
2. 确定 `hook` 脚本文件命名正确
3. 确定 `git config core.hooksPath` 指向 `.husky/_`

::: tip **什么是 git config core.hooksPath**
用于指定 Git 钩子（hooks）的自定义存储路径，默认值为 `.git/hooks`
:::

### 卸载 husky 后 **.git/hooks/ 不工作**

如果卸载 `husky` 后 `.git/hooks/` 中的钩子不起作用，请执行 `git config --unset core.hooksPath`
## Hook 执行流程深入

Husky v9 极其精简，整个执行链是：

```
git commit
   ↓
git 启动 hooks（受 core.hooksPath 控制）
   ↓
.git/hooks/pre-commit （Husky 软链到 .husky/_）
   ↓
.husky/_/h（公共 shim 脚本）
   ↓
  ① 读 $XDG_CONFIG_HOME/husky/init.sh 或 ~/.config/husky/init.sh
  ② 读 .husky/_/.gitignore（确保新增 hook 文件被忽略）
  ③ 执行 .husky/<hook-name>（用户脚本）
```

**v9 的「无 shebang / 无 set -e」设计**：

- v8 之前每个 hook 文件需手写 `#!/usr/bin/env sh` 和 `. "$(dirname "$0")/_/husky.sh"`
- v9 直接执行——shim 处理所有公共逻辑，hook 文件极简

```shell
# v8 hook（旧）
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm test

# v9 hook（新）
pnpm test
```

::: warning v8 → v9 升级注意

旧 hook 文件保留 shebang / source 也能工作（v9 兼容）。不需要手动清理。

:::

## 与 lint-staged 配合

最常见的 `.husky/pre-commit`：

```shell
pnpm lint-staged
```

`lint-staged` 读 `package.json` 或 `lint-staged.config.{js,ts}`：

```json
{
  "lint-staged": {
    "*.{ts,vue}": "eslint --fix --cache --max-warnings=0",
    "*.{json,md,css}": "prettier --write"
  }
}
```

Husky 触发 → lint-staged 仅对暂存文件运行 → 自动修复 + 重新 stage。详见 [lint-staged 指南](../lint-staged/guide-line)。

::: tip pre-commit 是默认选择

`pre-push` 跑测试也常见，但 pre-commit 用户感知更明显（提交时即得到反馈）。Long-running 测试（>5s）放 pre-push，短测试放 pre-commit。

:::

## commit-msg：约束提交消息

```shell
# .husky/commit-msg
pnpm commitlint --edit $1
```

```js
// commitlint.config.js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [2, "never", ["pascal-case", "upper-case"]],
    "subject-max-length": [2, "always", 100],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "refactor", "test", "chore", "style", "perf"],
    ],
  },
};
```

`$1` 是 git 传给 hook 的「临时 commit message 文件路径」（通常是 `.git/COMMIT_EDITMSG`）。`commitlint --edit $1` 读文件内容校验。

**Conventional Commits 收益**：

- `pnpm dlx changeset` / `standard-version` 自动生成 CHANGELOG
- 同时强制约束「subject 不超过 100 字符」「type 在固定枚举」等

## pre-push：分支保护 + 测试

```shell
# .husky/pre-push
#!/usr/bin/env sh

# 禁止直接 push main
protected_branch='main'
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

if [ "$current_branch" = "$protected_branch" ]; then
  echo "禁止直接 push 到 main 分支，请走 PR"
  exit 1
fi

# 跑测试
pnpm test
```

适合：

- 长耗时测试（pre-commit 太慢用 pre-push）
- 类型检查（`tsc --noEmit`）
- E2E 跑一遍
- 分支保护规则

## 同仓多项目（Monorepo）

```
my-monorepo/
├── .git/
├── .husky/                  # 根级配置
│   ├── pre-commit
│   └── commit-msg
├── package.json              # 根级（含 husky）
├── apps/
│   ├── web/
│   └── api/
└── packages/
    └── shared/
```

```shell
# .husky/pre-commit
pnpm -w lint-staged          # 根级跑 lint-staged，自动对所有 workspace 生效
```

`lint-staged.config.js`（根级）：

```js
export default {
  "apps/web/**/*.{ts,vue}": (files) => [
    `pnpm -F web lint --files ${files.join(" ")}`,
  ],
  "apps/api/**/*.ts": (files) => [
    `pnpm -F api lint --files ${files.join(" ")}`,
  ],
};
```

::: tip 单点维护 vs 散落

monorepo 强烈推荐根级单点维护。把 husky / lint-staged 散到每个 workspace 反而易遗漏。

:::

## 性能考量

### Hook 启动慢

Husky 本身 < 50ms，但用户脚本可能慢：

| 现象 | 排查 |
| --- | --- |
| pre-commit > 5s | lint-staged 命中文件多 / ESLint 慢 / Prettier 大文件 |
| pre-push > 30s | 测试套件大 → 拆「最小集合在 pre-push 跑，完整集在 CI」 |
| `nvm` init 慢 | 改用 `n` / `fnm`（启动更快） / 软链 node 二进制 |
| commit-msg 卡 | commitlint 启动开销，可加 `--strict false` |

### 跳过 hook 的合法场景

```bash
# 紧急 hotfix
git commit -m "fix: prod down" --no-verify

# revert 大批量
git revert <sha> --no-verify

# rebase
HUSKY=0 git rebase main
```

::: warning 跳过策略

`--no-verify` 应是例外不是常规。频繁跳过说明 hook 太慢或太严，应优化而非跳过。Code review 中看到 commit 缺少 conventional prefix，通常是用了 `-n`。

:::

## DevOps：CI 环境处理

CI 中装依赖触发 `prepare: husky`：

| 现象 | 解决 |
| --- | --- |
| `husky: command not found` | 仅装 dependencies 不装 devDependencies → 改 `"prepare": "husky || true"` |
| CI minutes 浪费在装 husky | CI 设 `HUSKY=0` 跳过 |
| Docker build 阶段 | 多阶段：dev 镜像装 husky，prod 镜像 `HUSKY=0` |

```dockerfile
# Dockerfile（多阶段）
FROM node:22 AS deps
ENV HUSKY=0
RUN pnpm install --frozen-lockfile

FROM node:22 AS builder
ENV HUSKY=0
COPY --from=deps node_modules ./node_modules
RUN pnpm build
```

```yml
# GitHub Actions
jobs:
  ci:
    env:
      HUSKY: 0
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

## 编辑器 / GUI 工具集成

### VS Code / JetBrains

VS Code 的 Source Control 面板、JetBrains 的 Git 工具调用的还是底层 `git commit`，会触发 husky。

**但**：GUI 工具的 PATH 可能与 shell 不同：

```sh
# ~/.config/husky/init.sh
# 让 nvm 在 GUI 中也能正常初始化
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# 或：硬编码 node 路径
export PATH="/Users/me/.nvm/versions/node/v22.22.1/bin:$PATH"
```

### Sourcetree / GitKraken / GitHub Desktop

同上，都走底层 `git`，husky 触发。Windows GUI 工具尤其要注意 init.sh 配置（PATH 可能完全空）。

## 调试 hook

### 实时查看 hook 是否触发

```shell
# .husky/pre-commit
echo "[husky] pre-commit triggered at $(date)" >> /tmp/husky-debug.log
pnpm lint-staged
```

```bash
tail -f /tmp/husky-debug.log  # 另开终端实时看
```

### 单独跑 hook（不走 git）

```bash
sh .husky/pre-commit
```

### 检查 git 配置

```bash
git config --get core.hooksPath
# 应输出 .husky/_

# 重置
git config --unset core.hooksPath
pnpm run prepare   # 重新装 husky
```

## 与 simple-git-hooks / pre-commit / lefthook 对比

| 工具                 | 语言    | 包大小  | 配置位置                | 多语言支持 |
| -------------------- | ------- | ------- | ----------------------- | ---------- |
| **husky**            | Node    | ~10KB   | `.husky/<hook>` 文件   | 任意 shell |
| `simple-git-hooks`   | Node    | ~7KB    | `package.json` 配置项  | 任意 shell |
| `pre-commit`         | Python  | 独立工具 | `.pre-commit-config.yaml` | Python / Ruby / Node / Go 等 |
| `lefthook`           | Go      | 独立二进制 | `lefthook.yml`         | 任意 shell（并行强） |

**选哪个**：

- Node 项目 + 团队都用 git hook → husky
- 多语言混合 / Python 项目 → pre-commit
- 极致性能 / 并行 hook → lefthook

## 安全考量

### Git hook 是攻击面

恶意 `.husky/pre-commit` 在 `pnpm install` 后被默默激活——克隆陌生仓库时务必先看 `.husky/` 目录。

```bash
# 克隆后立刻检查
cat .husky/pre-commit
cat .husky/post-checkout
# 看到陌生命令立即终止 install
```

### `HUSKY=0` 不能阻止 git 原生 hook

`HUSKY=0` 仅禁用 Husky 接管的 hook。如果有人直接改 `.git/hooks/`（Husky 不管），仍会触发。`.git/` 不进 git 索引，所以恶意 hook 通常只能本地植入，不会跨用户传播。

## v8 → v9 迁移要点

```bash
# 1. 升级 husky
pnpm add -D husky@latest

# 2. 重新初始化（v9 文件结构不同）
rm -rf .husky/_
pnpm run prepare

# 3. 更新 package.json prepare 脚本
{
  "scripts": {
    "prepare": "husky"
  }
}
```

| 变化 | v8 | v9 |
| --- | --- | --- |
| hook 文件 | 需 shebang + source | 直接命令 |
| 安装 | `npx husky install` | `husky` （`prepare` 自动） |
| 包体积 | ~1KB | ~10KB |
| 性能 | 基线 | 略快 |
| 自定义 hook 路径 | `husky install custom-dir` | `husky custom-dir` |

## 真实世界配置示例

### 单体应用（前端 Vue）

```shell
# .husky/pre-commit
pnpm lint-staged

# .husky/commit-msg
pnpm commitlint --edit $1
```

```json
{
  "lint-staged": {
    "*.{ts,vue}": "eslint --fix --cache --max-warnings=0",
    "*.{json,md,css,scss}": "prettier --write"
  }
}
```

### Monorepo（前后端 + 共享包）

```shell
# .husky/pre-commit
pnpm -w lint-staged

# .husky/pre-push
pnpm -w type-check
pnpm -w test:unit
```

```js
// lint-staged.config.js
export default {
  "apps/web/**/*.{ts,vue}": "pnpm -F web lint --files",
  "apps/api/**/*.ts": "pnpm -F api lint --files",
  "packages/shared/**/*.ts": "pnpm -F shared lint --files",
  "*.{json,md}": "prettier --write",
};
```

### 大型企业（含 commitlint + 分支保护）

```shell
# .husky/pre-commit
pnpm lint-staged
pnpm test:unit:changed

# .husky/commit-msg
pnpm commitlint --edit $1

# .husky/pre-push
sh ./scripts/branch-policy.sh
pnpm test:integration

# .husky/pre-rebase
# 禁止 rebase main / develop
if [ "$1" = "main" ] || [ "$1" = "develop" ]; then
  echo "禁止 rebase $1"
  exit 1
fi
```
