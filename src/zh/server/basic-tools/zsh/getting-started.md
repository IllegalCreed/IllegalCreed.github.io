---
layout: doc
outline: [2, 3]
---

# 入门：Zsh 定义、macOS 默认与核心交互优势

> 基于 Zsh 5.9 · 核于 2026-08

## 速查

- **Zsh 是什么**：**Z shell**，Paul Falstad 1990 年创建的 Unix shell。**兼容 Bash/POSIX**（默认多数 sh/bash 语法可跑），但在**补全、历史、Glob、拼写纠正**上远超 Bash。**交互体验最强的 shell**。
- **macOS 默认**：自 **2019 年 macOS Catalina（10.15）** 起，Zsh 取代 Bash 成为 macOS 登录 shell（因 Apple 拒绝 GPLv3，Bash 卡在 3.2，转而采用 MIT 类许可证的 Zsh）。
- **与 Bash 关系**：Zsh **兼容 Bash 大部分语法**（变量/管道/重定向/if/for/函数通用），但有差异（默认数组下标 1 起 vs Bash 0 起、`$arr` 行为不同、字符串分割默认行为不同）。`emulate bash` 可强制 Bash 兼容模式。
- **补全系统（compsys）**：开箱即用、可编程的 Tab 补全——命令、参数、文件、git 分支、ssh 主机、docker 镜像都能补全。需 `autoload -Uz compinit && compinit` 启用。
- **共享历史**：`setopt share_history` 让多个终端窗口/标签页共享同一条历史——A 窗口敲的命令 B 窗口能 ↑ 找到。
- **拼写纠正**：`setopt correct` 输错命令自动提示纠正（`cd /usr/locol` → 是否 `/usr/local`）。
- **Glob 限定符**：`**/*.py` 递归匹配、`*(.)` 只普通文件、`*(/)` 只目录、`*(m-3)` 三天内修改的——比 Bash 强大数倍。
- **提示符**：`PROMPT`（左）+ `RPROMPT`（右），支持 Vi 模式指示、上下文、git 状态、颜色（`%F{red}`）。
- **框架生态**：oh-my-zsh（最流行）/ prezto（轻量）/ Zinit（插件管理器）+ Powerlevel10k（最快主题）/ Starship（跨 shell）。
- **进阶顺序**：[交互特性](./guide-line/interactive-features) → [框架生态](./guide-line/frameworks) → [参考](./reference)。

## 一、Zsh 是什么：交互之王

Shell 是命令解释器，但"解释命令"这件事的**体验**可以天差地别。Bash 把命令执行做对了（POSIX 兼容、脚本生态），但**交互**这块做得粗糙——补全要装第三方、历史不共享、打错命令只能重来。Zsh 的核心贡献就是**把交互体验做到极致**：

- **Tab 一次到位**：敲 `git che<Tab>` 自动补 `checkout`；`docker run<Tab>` 补全镜像名；`ssh pr<Tab>` 补全 `~/.ssh/config` 里的 prod 主机；`kill <Tab>` 列出进程让你选。
- **菜单式选择**：多次按 Tab 进入菜单模式，方向键选候选（Bash 默认只在选项间循环）。
- **历史即用即有**：开两个终端，A 窗口敲的命令 B 窗口立刻能 ↑ 调出——无需重新敲。
- **打错也救你**：`git sutats` 自动提示「是否纠正为 git status」。

Zsh 由 Princeton 大学学生 **Paul Falstad** 于 1990 年创建，灵感来自 KornShell（ksh）与 tcsh（csh 后裔）。名字 **Z** 取字母表最后一个，寓意"终极 shell"。Zsh 采用 MIT 类许可证（比 Bash 的 GPLv3 更宽松），这也是 Apple 选择它替代 Bash 的法律动因。

一句话：**Zsh 是兼容 Bash 但交互强十倍的日常驱动 shell。**

## 二、macOS 为何默认 Zsh

2019 年 macOS Catalina（10.15）将默认登录 shell 从 Bash 改为 Zsh，原因有二：

1. **Bash 卡在 GPLv2**：macOS 系统 Bash 长期停留在 **3.2**（2007 年版本）。Bash 4.0（2009）起切换到 **GPLv3** 许可证——GPLv3 含专利授权条款，Apple 法务拒绝接受，故系统只能停留在 GPLv2 的 Bash 3.2（缺关联数组、`mapfile`、`&>` 等现代特性）。
2. **Zsh 许可证宽松**：Zsh 是 MIT 类许可证，无专利束缚，且版本最新（5.x）。同时 Zsh **兼容 Bash 大部分语法**，迁移成本低。

查看与切换：

```bash
echo $SHELL                  # 当前 shell
dscl . -read ~/ UserShell    # macOS 查登录 shell（getent 在 macOS 没有）
chsh -s /bin/zsh             # 改登录 shell 为 zsh
chsh -s /bin/bash            # 改回 bash

# 确认 Zsh 版本
zsh --version                # zsh 5.9 (x86_64-apple-darwin23.0)
```

⚠️ **改 shell ≠ 改脚本**：交互用 Zsh，但运维脚本第一行仍写 `#!/usr/bin/env bash` 保证服务器/CI 可移植。

## 三、与 Bash 的兼容与差异

Zsh 设计上**兼容 Bash 大部分语法**——变量赋值、管道、重定向、`if`/`for`/`while`、函数、命令替换 `$()`、`[[ ]]` 测试都通用。把一个 Bash 脚本的 shebang 改成 `#!/usr/bin/env zsh`，多数能直接跑。但有几个**经典差异**：

| 维度 | Bash | Zsh |
| --- | --- | --- |
| **数组下标** | `${arr[0]}`（0 起） | `${arr[1]}`（**1 起**，`${arr[0]}` 等于 `${arr[1]}`） |
| **`$arr` 行为** | 只取第一个元素 `${arr[0]}` | **取全部元素**（等价 `${arr[@]}`） |
| **未加引号不分割** | `$var` 词分割 + glob | `$var` **默认不分割**（除非 `setopt shwordsplit`） |
| **关联数组** | `declare -A` | `typeset -A`（同义） |
| **字符串键** | `arr[key]` | `arr[key]`（一致） |

```zsh
# Zsh 特性示例
arr=(a b c)
echo $arr           # Zsh：a b c（全部）  Bash：a（第一个）
echo ${arr[1]}      # Zsh：a（第一个）    Bash：b（第二个）！

# 强制 Bash 兼容模式（脚本里若要 Bash 行为）
emulate bash
```

- **`emulate bash`**：让 Zsh 模拟 Bash 行为（数组下标、词分割等），用于跑 Bash 脚本。
- **`emulate -L sh`**：函数局部模拟 POSIX sh。

## 四、为何"交互用 Zsh，脚本用 Bash"

这是业界事实共识，原因是**两者的强项不同**：

- **Zsh 强在交互**：补全/历史/拼写/Glob 让日常敲命令流畅，但**脚本生态绑定 Bash**——CI（GitHub Actions `run:`）、Dockerfile `RUN`、cron、systemd 默认 Bash 语法，写 Zsh 专有语法不可移植。
- **Bash 强在脚本**：POSIX 兼容、无处不在，但**交互朴素**。

```bash
# 配置开发机：交互默认 Zsh（macOS 已默认，Linux 用 chsh 切）
chsh -s $(which zsh)

# 但脚本第一行永远写 Bash
#!/usr/bin/env bash
```

**例外**：个人开发脚本（不部署到服务器）可以用 Zsh，享受其更强语法。但团队/生产脚本统一 Bash。

## 五、最小可用 .zshrc

```zsh
# ~/.zshrc —— Zsh 启动配置（非登录交互 shell 读取）

# 历史记录
HISTFILE=~/.zsh_history
HISTSIZE=10000          # 内存中保留的条数
SAVEHIST=10000          # 写入文件的条数
setopt SHARE_HISTORY    # 多终端共享历史
setopt HIST_IGNORE_DUPS # 连续重复不记录
setopt EXTENDED_HISTORY # 记录时间戳

# 交互贴心选项
setopt AUTO_CD          # 直接敲目录名即 cd
setopt CORRECT          # 命令拼写纠正
setopt INTERACTIVE_COMMENTS  # 交互式允许 # 注释

# 补全系统（核心！）
autoload -Uz compinit && compinit
zstyle ':completion:*' menu select                    # 菜单式选择（方向键）
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'  # 大小写不敏感

# 别名
alias ll='ls -lah'
alias gs='git status'

# 提示符（或装 Powerlevel10k/Starship 取代）
PROMPT='%F{cyan}%~%f %F{green}%#%f '
```

## 下一步

理解了 Zsh 的定位与 macOS 默认背景后，下一步深入[交互特性](./guide-line/interactive-features)（补全系统、共享历史、Glob 限定符、提示符的完整配置）与[框架生态](./guide-line/frameworks)（oh-my-zsh/prezto/Zinit/Powerlevel10k/Starship 的选型）。
