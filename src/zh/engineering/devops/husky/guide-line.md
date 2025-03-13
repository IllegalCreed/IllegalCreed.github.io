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

linux/max：`~/.config/husky/init.sh` 

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

## 再不提交的情况下测试 Hook

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