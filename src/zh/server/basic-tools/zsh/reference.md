---
layout: doc
outline: [2, 3]
---

# 参考：Zsh 速查、补全配置、与 Bash 差异、易错点

> 基于 Zsh 5.9 · 核于 2026-08

## 速查

- **Zsh 定义**：兼容 Bash 的交互最强 shell，macOS 默认。
- **macOS 默认**：自 Catalina（2019）起，因 GPLv3 改用 Zsh。
- **补全系统**：`autoload -Uz compinit && compinit` 启用，配 `zstyle` 调行为。
- **共享历史**：`setopt SHARE_HISTORY` + `HISTFILE`/`HISTSIZE`/`SAVEHIST`。
- **拼写纠正**：`setopt CORRECT`（命令名）；`CORRECT_ALL` 激进慎用。
- **Glob 限定符**：`**/*.py`、`*(.)` 文件、`*(/)` 目录、`*(m-3)` 时间。
- **提示符**：`PROMPT`（左）+ `RPROMPT`（右）；`%F{c}...%f` 颜色。
- **框架**：oh-my-zsh（流行）/ prezto（轻量）/ Zinit（速度）+ p10k/Starship。

## 一、必装选项速查

```zsh
# ~/.zshrc 最小可用配置
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt SHARE_HISTORY HIST_IGNORE_DUPS HIST_IGNORE_ALL_DUPS HIST_IGNORE_SPACE
setopt EXTENDED_HISTORY HIST_REDUCE_BLANKS
setopt AUTO_CD AUTO_PUSHD PUSHD_IGNORE_DUPS
setopt CORRECT INTERACTIVE_COMMENTS
setopt EXTENDED_GLOB GLOB_STAR_SHORT

autoload -Uz compinit && compinit
zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={a-zA-Z}' 'r:|=*'
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}

# 提示符（或用 p10k/Starship）
PROMPT='%F{cyan}%~%f %F{green}%#%f '
```

## 二、补全系统配置速查

```zsh
# 启用
autoload -Uz compinit && compinit
# 加速：仅每天重建一次缓存
# if [[ -n ~/.zcompdump(#qN.mh+24) ]]; then compinit; else compinit -C; fi

# 行为
zstyle ':completion:*' menu select                       # 方向键选候选
zstyle ':completion:*' menu select=interactive           # 交互式菜单
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'     # 大小写不敏感
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={a-zA-Z}' 'r:|=*' 'l:|=* r:|=*'  # 子串
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}    # 候选着色
zstyle ':completion:*:descriptions' format '%F{yellow}-- %d --%f'  # 分组标题
zstyle ':completion:*:warnings' format '%F{red}no matches%f'        # 无匹配提示
zstyle ':completion:*' group-name ''                     # 按类型分组

# 特定补全
zstyle ':completion:*:kill:*' command 'ps -u $USER -o pid,%cpu,tty,cmd'  # kill 命令补全
zstyle ':completion:*:ssh:*' hosts ${(${(u)${${${(@M)${(f)"$(cat ~/.ssh/config 2>/dev/null)"}:#Host *}#Host }:#*[*]*}})%% *}  # ssh 主机
```

## 三、Glob 限定符速查

| 限定符 | 含义 |
| --- | --- |
| `**/` | 递归子目录（需 `setopt GLOB_STAR_SHORT` 或 EXTENDED_GLOB） |
| `*(.)` | 只普通文件 |
| `*(/)` | 只目录 |
| `*(-@)` | 符号链接 |
| `*(.*)` | 隐藏文件 |
| `*(m-3)` / `*(m+3)` | 3 天内改 / 3 天前改 |
| `*(mh-1)` | 1 小时内改 |
| `*(Lk+100)` / `*(Lm+1)` | >100KB / >1MB |
| `*(Lk-10)` | <10KB |
| `*(om[1,5])` | 按修改时间倒序取前 5 |
| `*(ON)` | 按名称排序 |
| `*(^F)` | 非空目录 |
| `*(*.py)` | 扩展名 .py 的普通文件 |

组合：`ls **/*.py(.Lm+1m-3)`——最近 3 天修改的大于 1MB 的 py 文件。

## 四、历史扩展速查

| 写法 | 含义 |
| --- | --- |
| `!!` | 上一条（`sudo !!`） |
| `!cmd` | 最近以 cmd 开头的命令 |
| `!N` | 历史第 N 条 |
| `!-N` | 倒数第 N 条 |
| `!$` | 上一条最后参数 |
| `!^` | 上一条第一个参数 |
| `!*` | 上一条全部参数 |
| `!?str?` | 含 str 的最近命令 |
| `^old^new` | 上一条首个 old 换 new |
| `!!:gs/old/new` | 上一条全局替换 |
| `Ctrl-R` | 反向增量搜索 |
| `Alt-.` | 插入上一条最后参数 |

## 五、提示符转义速查

| 转义 | 含义 |
| --- | --- |
| `%~` | 路径（home 缩写为 ~） |
| `%/` | 完整路径 |
| `%d` | 绝对路径（同 `%/`） |
| `%c` / `%1~` | 当前目录名 |
| `%n` | 用户名 |
| `%m` | 主机名（短，到第一个点） |
| `%M` | 主机名（全） |
| `%#` | root `#` / 普通 `%` |
| `%T` | 24h 时间 `HH:MM` |
| `%t` | 12h 时间 `HH:MM AM/PM` |
| `%D` | 日期 `YY-MM-DD` |
| `%j` | 后台作业数 |
| `%l` | tty 名 |
| `%F{color}...%f` | 前景色 |
| `%K{color}...%k` | 背景色 |
| `%B...%b` | 粗体 |
| `%U...%u` | 下划线 |

## 六、与 Bash 差异速查

| 维度 | Bash | Zsh |
| --- | --- | --- |
| 数组下标 | 0 起 `${arr[0]}` | 1 起 `${arr[1]}` |
| `$arr` | 取第一个元素 | 取全部元素（等价 `${arr[@]}`） |
| 未加引号 `$var` | 词分割 + glob | 默认不分割（`setopt shwordsplit` 强制） |
| 关联数组 | `declare -A` | `typeset -A`（同义） |
| 字符串长度 | `${#var}` | `${#var}`（一致） |
| 递归 glob | `**/*.py`（Bash 4+，需 `shopt -s globstar`） | `**/*.py`（原生支持） |
| 补全 | 需装 bash-completion | 原生 compsys |
| 共享历史 | 需配置 + tricks | `setopt SHARE_HISTORY` |
| 拼写纠正 | 无 | 原生 `setopt CORRECT` |
| shebang | `#!/usr/bin/env bash` | `#!/usr/bin/env zsh` |

`emulate bash` 让 Zsh 在脚本里模拟 Bash 行为（数组下标、词分割等）。

## 七、易错点清单

- **`cd ~/work` 不生效**：Zsh 默认未开 AUTO_CD，直接敲目录名不会 cd。加 `setopt AUTO_CD`。
- **`$arr` 行为与 Bash 不同**：Zsh 中 `$arr` 取全部元素，要取第一个用 `${arr[1]}`（不是 0）。脚本迁移需 `emulate bash`。
- **数组下标 1 起**：Zsh `${arr[0]}` 等价于 `${arr[1]}`（取第一个）。从 Bash 迁移循环要改下标范围。
- **`CORRECT_ALL` 过度纠正**：会把存在的文件名也建议改（`note.md` → `notes.md`）。日常用 `CORRECT`（只纠正命令名）即可。
- **补全不生效**：忘了 `compinit`——`.zshrc` 必须有 `autoload -Uz compinit && compinit`。
- **历史不共享**：忘了 `setopt SHARE_HISTORY` 或 `SAVEHIST=0`——必须 SAVEHIST > 0 且指定 HISTFILE。
- **`compinit` 慢**：每次启动都重建缓存。用按天缓存（见速查）或 `compinit -C`（跳过安全检查）。
- **Nerd Font 图标乱码**：p10k 主题依赖 Nerd Font（如 MesloLGS NF）。终端字体未设成 NF 会显示方框/问号。
- **Zsh 脚本不可移植到 sh**：运维脚本用 Zsh 专有语法（如限定符、`typeset -A`）在 dash/ash 不可跑。生产脚本仍写 `#!/usr/bin/env bash`。
- **OMZ 启动慢**：装大量插件 + 重主题导致冷启动几百 ms。用 p10k + 异步加载（Zinit）或精简插件。
- **`emulate bash` 副作用**：会影响 `compinit` 等 Zsh 特性，只在跑特定 Bash 脚本时局部 `emulate -L bash`。
- **`bindkey -v` 后快捷键变**：Vi 模式下 Ctrl-A/E 等可能失效，需 `bindkey -v` 后显式绑或在 Vi 模式用 hjkl。

## 八、进阶方向（链接其他叶）

- [Bash](../bash/) —— 服务器默认 shell、POSIX 脚本、与 Zsh 的对比
- [PowerShell](../powershell/) —— 跨平台、对象管道的另一种范式
- [文件系统与基础命令](../) —— `cd`/`ls`/`find` 等与 Zsh 配合的命令

## 权威链接

- [Zsh 官方手册](https://zsh.sourceforge.io/Doc/)
- [Zsh - Wikipedia](https://en.wikipedia.org/wiki/Z_shell)
- [A User's Guide to Zsh](https://zsh.sourceforge.io/Guide/)
- [oh-my-zsh 官网](https://ohmyz.sh/)
- [Powerlevel10k GitHub](https://github.com/romkatv/powerlevel10k)
- [Starship 官网](https://starship.rs/)
- 本站幻灯片：<a href="/SlideStack/zsh-slide/" target="_blank">Zsh</a>
