---
layout: doc
outline: [2, 3]
---

# 交互特性：补全、历史、拼写纠正与 Glob

> 基于 Zsh 5.9 · 核于 2026-08

## 速查

- **补全系统（compsys）**：Zsh 的杀手锏。`autoload -Uz compinit && compinit` 启用后，Tab 能补命令、子命令、参数、文件、git 分支、docker 镜像、ssh 主机、`kill` 进程——开箱即用覆盖数百命令（Bash 要装 bash-completion 才勉强及格）。
- **菜单式补全**：`zstyle ':completion:*' menu select`——多次按 Tab 进入菜单，方向键选候选（而非 Bash 的循环）。`menu select=1` 单候选也进入菜单。
- **大小写/子串模糊匹配**：`matcher-list 'm:{a-z}={A-Z}'`（大小写不敏感）、`r:|=*`（子串匹配）——敲 `gco` 也能补到 `git checkout`。
- **共享历史**：`setopt SHARE_HISTORY`——多终端实时共享历史。配套：`HIST_IGNORE_DUPS`（去连续重复）、`HIST_IGNORE_ALL_DUPS`（去全部重复，留最新）、`HIST_REDUCE_BLANKS`（压缩空白）。
- **历史搜索**：`Ctrl-R` 反向增量搜索（同 Bash）；`!prefix` 调最近以 prefix 开头的命令；`!!` 上一条（`sudo !!`）；`!$` 上一条最后参数。
- **拼写纠正**：`setopt CORRECT`——命令名输错提示纠正（`gti` → `git`？）；`setopt CORRECT_ALL`——参数/文件名也纠正（更激进，可能误改，慎用）。
- **Glob 限定符**：`**/` 递归（需 `setopt GLOB_STAR_SHORT` 或 `setopt EXTENDED_GLOB`）、`*(.)` 普通文件、`*(/)` 目录、`*(-@)` 符号链接、`*(m-3)` 3 天内改、`*(Lk+100)` 大于 100KB、`*(om[1,5])` 最近修改的 5 个——比 Bash 强大数倍。
- **自动 cd**：`setopt AUTO_CD`——直接敲目录名即 cd（无需敲 cd）。
- **提示符**：`PROMPT`（左）+ `RPROMPT`（右）；`%F{color}...%f` 颜色、`%~` 路径缩写、`%n` 用户名、`%m` 主机名、`%#` 提示符（root `#`/普通 `%`）、Vi 模式指示器。
- **行编辑**：Zsh 用 `zle`（Zsh Line Editor），支持 Vi 模式（`bindkey -v`）和 Emacs 模式（`bindkey -e`，默认）。

## 一、补全系统：Zsh 的杀手锏

补全系统（completion system，简称 compsys）是 Zsh 最具杀伤力的特性——它是**可编程的、上下文感知的、开箱即用的**：

```zsh
# 启用补全（必加进 .zshrc）
autoload -Uz compinit && compinit

# 一次性配置（推荐）
zstyle ':completion:*' menu select                    # 方向键选候选
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'  # 大小写不敏感
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS} # 用 ls 的颜色着色候选
```

启用后，Tab 补全的能力让人惊叹：

- **命令补全**：`git che<Tab>` → `checkout`/`cherry`/`cherry-pick`。
- **参数补全**：`tar -<Tab>` 列出所有选项及说明；`ssh -<Tab>` 同。
- **上下文补全**：`git checkout <Tab>` 列出本地/远程分支让你选；`docker run <Tab>` 补全本地镜像；`npm <Tab>` 列出 npm 子命令。
- **主机补全**：`ssh pr<Tab>` 从 `~/.ssh/config` 与 `~/.ssh/known_hosts` 补全主机名。
- **kill 补全**：`kill <Tab>` 列出进程（PID + 命令名）让你选——告别 `ps aux | grep`。
- **参数值补全**：`--host=<Tab>` 补全已知主机；`make <Tab>` 列出 Makefile 目标。

### 模糊匹配（matcher-list）

```zsh
# 大小写不敏感：gco 也能补 GCO
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={a-zA-Z}'

# 子串匹配：补全时输入的串是候选的子串即可
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}' 'r:|=*' 'l:|=* r:|=*'
```

这让"我只记得命令的一半"也能补全——比如敲 `ckout` 也能匹配到 `checkout`。

### 菜单式导航

```zsh
zstyle ':completion:*' menu select=2   # 候选≥2 时进入菜单
```

进入菜单后用**方向键**（或 Ctrl-N/P）在候选列表里选——比 Bash 的"按 Tab 在候选间循环"快得多。

## 二、共享历史与历史搜索

```zsh
HISTFILE=~/.zsh_history
HISTSIZE=10000                   # 内存中保留的条数
SAVEHIST=10000                   # 写入文件的条数（要 > 0 才持久化）
setopt SHARE_HISTORY             # ★ 多终端实时共享历史
setopt APPEND_HISTORY            # 追加而非覆盖（配合 SHARE）
setopt INC_APPEND_HISTORY        # 每条命令立即写入（不等退出）
setopt HIST_IGNORE_DUPS          # 连续重复不记录
setopt HIST_IGNORE_ALL_DUPS      # 全部重复只留最新
setopt HIST_IGNORE_SPACE         # 空格开头的命令不记录（敏感命令前加空格）
setopt HIST_REDUCE_BLANKS        # 压缩多余空白
setopt EXTENDED_HISTORY          # 记录时间戳与耗时
```

- **SHARE_HISTORY**：A 终端敲 `npm test`，B 终端按 ↑ 立刻能看到——告别"刚在哪个窗口敲过"的困扰。
- **HIST_IGNORE_SPACE**：命令前加空格（` sudo rm -rf x`）不进历史——保护敏感命令。

### 历史快速调用

```zsh
!!              # 上一条命令（sudo !! 极常用）
!git            # 最近一条以 git 开头的命令
!$              # 上一条的最后参数（cd !$ 很方便）
!*              # 上一条的全部参数
!!:gs/old/new   # 上一条全局替换 old 为 new
^old^new        # 上一条第一个 old 替换为 new（快速改 typo）

Ctrl-R str      # 反向增量搜索（输入即匹配，再 Ctrl-R 找上一个匹配）
Alt-.           # 插入上一条最后参数（可连按往上翻）
```

## 三、拼写纠正

```zsh
setopt CORRECT          # 命令名输错提示纠正
setopt CORRECT_ALL      # 命令+参数+文件名都纠正（激进，慎用）
```

```zsh
$ cd /usr/locol/bin
zsh: correct 'locol' to 'local' [nyae]? y    # 自动改对
$ gti status
zsh: correct 'gti' to 'git' [nyae]? y
```

- **`[nyae]?`** 选项：`n` 不改、`y` 改、`a` 总是改（本次会话）、`e` 自己编辑。
- **CORRECT_ALL 慎用**：会把 `cat note.md` 里的 `note.md`（即使存在）也问要不要改成 `notes.md`，干扰大。日常用 `CORRECT`（只纠正命令名）即可。

## 四、Glob 限定符：超越 Bash 的文件匹配

Zsh 的 Glob 系统是其另一杀手锏——支持**限定符（glob qualifiers）**，按文件类型、大小、时间、权限等过滤：

```zsh
ls **/*.py            # 递归列出所有 .py（Bash 4+ 也支持）
ls **/*(.)            # 只列普通文件（不含目录/链接）
ls **/*(/)            # 只列目录
ls *(-@)              # 符号链接
ls *(m-3)             # 3 天内修改的
ls *(Lk+100)          # 大于 100KB 的
ls *(Lk-10)           # 小于 10KB 的
ls *(om[1,5])         # 按修改时间排序，取前 5 个
ls *(*.py)            # 扩展名 .py 的（普通文件）
ls *(^F)              # 非空目录
rm **/*.pyc           # 清理所有 .pyc（递归）

# 组合：最近 3 天修改的大于 1MB 的 py 文件
ls **/*.py(.Lm+1m-3)
```

对比 Bash：Bash 4+ 虽有 `**/*.py` 递归，但没有 `*(.)`、`*(m-3)` 这类限定符——要过滤得配合 `find`+`xargs`，啰嗦且易错。Zsh 的限定符让许多 `find` 命令变得多余。

## 五、自动 cd 与目录跳转

```zsh
setopt AUTO_CD         # 直接敲目录名即 cd
setopt AUTO_PUSHD      # cd 自动压栈（可用 cd - 回上一个）
setopt PUSHD_IGNORE_DUPS

# 用法
~/work        # 等价 cd ~/work
-             # 回上一个目录（配合 AUTO_PUSHD）
dirs -v       # 看目录栈
```

## 六、提示符与颜色

```zsh
# 基本提示符
PROMPT='%F{cyan}%~%f %F{green}%#%f '
# %~   路径（~ 缩写 home）
# %#   root 显示 #，普通显示 %
# %F{color}...%f  颜色
# %n   用户名  %m  主机名（短）  %M  主机名（全）
# %T   24h 时间  %t  12h  %D  日期

# 右侧提示符（Zsh 独有）
RPROMPT='%F{yellow}$(git_branch)%f'   # 右侧显示 git 分支

git_branch() {
    local b=$(git symbolic-ref --short HEAD 2>/dev/null)
    [[ -n "$b" ]] && echo " $b"
}

# Vi 模式指示
function zle-line-init zle-keymap-select {
    PROMPT='${${KEYMAP/vicmd/[N]}/(main|viins)/[I]} %~ %# '
    zle reset-prompt
}
zle -N zle-line-init
zle -N zle-keymap-select
bindkey -v
```

实际开发中，多数人不手写提示符——装 **Powerlevel10k** 或 **Starship** 一键获得美观且功能强的提示符（含 git 状态、k8s 上下文、Python venv、耗时提示）。

## 七、行编辑与键绑定

Zsh 的行编辑器 `zle`（Zsh Line Editor）支持两种模式：

- **Emacs 模式**（默认）：`Ctrl-A` 行首、`Ctrl-E` 行尾、`Ctrl-W` 删前一词、`Ctrl-U` 删到行首、`Ctrl-K` 删到行尾、`Alt-B/F` 词间跳。
- **Vi 模式**：`bindkey -v` 启用，Normal/Insert 切换，全套 Vim 按键。

```zsh
bindkey -e                              # Emacs 模式（默认）
bindkey -v                              # Vi 模式
bindkey '^R' history-incremental-search-backward   # 显式绑 Ctrl-R
bindkey '^[.' insert-last-word          # Alt-. 插入上一条最后参数
```

## 下一步

掌握了补全/历史/拼写/Glob 后，下一步进入[框架生态](./frameworks)——oh-my-zsh/prezto/Zinit 哪个适合你？Powerlevel10k 还是 Starship？如何选型与安装。
