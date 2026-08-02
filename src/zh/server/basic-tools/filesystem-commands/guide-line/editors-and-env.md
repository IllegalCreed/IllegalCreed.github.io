---
layout: doc
outline: [2, 3]
---

# 编辑器与环境：Vim/Nano 生存与 sudo/df/du/export

> 基于 Linux 终端编辑器与环境配置 · 核于 2026-08

## 速查

- **Vim 模式四件套**：`Esc`（普通模式，默认）/ `i`/`a`/`o`（插入模式）/ `v`（可视模式）/ `:`（命令模式）。**打字前先按 `i`**，**退出前先按 `Esc` 再 `:wq`**。
- **Vim 退出**：`:wq`（保存退出）/ `:q!`（不保存强退）/ `:x`（有改动才保存退出）/ `ZZ`（同 `:x`）/ `ZQ`（同 `:q!`）。
- **Vim 搜索替换**：`/word`（向下搜，`n` 下一个 `N` 上一个）/ `:%s/old/new/g`（全文替换）/ `:s/old/new/g`（当前行）。
- **Nano**：无模式，直接打字。`^O`（Ctrl-O 保存）/ `^X`（退出）/ `^K`（剪切行）/ `^W`（搜索）/ `^G`（帮助）。底部菜单栏 `^` 表示 Ctrl、`M-` 表示 Alt。
- **`sudo`**：以 root 身份执行**单条命令**（输**当前用户密码**，需在 sudoers）。`sudo -i`/`sudo su -` 切到 root 交互式 shell。
- **`df -h`**：磁盘整体使用情况（按挂载点，人类可读）；**`du -sh dir`**：某目录总大小，`du -h --max-depth=1` 看各子目录大小找占空间的。
- **`export VAR=v`**：设**环境变量**（当前 shell 及子进程可见）；`echo $VAR` 查看；`env` 列全部。持久化写入 `~/.bashrc`（普通）或 `/etc/profile`（全局）。
- **`source f`**（等价 `. f`）：在**当前 shell** 执行脚本（脚本里的 `export`、`cd`、`alias` 会影响当前 shell）。改完 `.bashrc` 用 `source ~/.bashrc` 重载。
- **`alias ll='ls -la'`**：命令别名。**只在当前 shell 有效**，持久化写入 `~/.bashrc`。
- **`PATH`**：命令搜索路径，冒号分隔。执行命令时按 `PATH` 顺序找可执行文件。加自定义路径：`export PATH=$PATH:/opt/bin`。

## 一、Vim：模式编辑器

Vim（Vi IMproved）是服务器上最常见的终端编辑器。它的核心特点是**模式编辑**——同一按键在不同模式下含义不同，初学者最大的困惑就来自这里。

**四个模式**：

```
┌─────────────────────────────────────────────┐
│  普通模式（NORMAL）← 默认，按 Esc 回到这里   │
│  用于：移动、删除、复制、粘贴、搜索           │
└────┬────────────────────────────────────────┘
     │ 按 i/a/o
     ▼
┌─────────────────────────────────────────────┐
│  插入模式（INSERT）← 正常打字               │
│  底部显示 -- INSERT --                       │
└────┬────────────────────────────────────────┘
     │ 按 Esc
     ▼ （回到普通模式）
     │ 按 :
     ▼
┌─────────────────────────────────────────────┐
│  命令模式（COMMAND）← 输入以 : 开头的命令     │
│  用于：保存 :w / 退出 :q / 替换 :s / 设置 :set │
└─────────────────────────────────────────────┘
     │ 按 v / V / Ctrl-v
     ▼
┌─────────────────────────────────────────────┐
│  可视模式（VISUAL）← 选中文字块操作          │
└─────────────────────────────────────────────┘
```

**生存级操作**（记住这些就能用）：

1. **打开文件**：`vim file.txt`（不存在则新建）。
2. **进入插入模式打字**：按 `i`（光标处插入）/ `a`（光标后插入）/ `o`（下方新开一行插入）。底部出现 `-- INSERT --`。
3. **回到普通模式**：按 `Esc`（多按几次也无妨，确保在普通模式）。
4. **移动光标**（普通模式下）：`h j k l`（左 下 上 右，或方向键），`gg` 跳文件首、`G` 跳文件尾、`:42` 跳第 42 行、`0` 行首、`$` 行尾。
5. **删除**：`x` 删一个字符、`dd` 删整行、`dw` 删一个词、`d$` 删到行尾。
6. **复制粘贴**：`yy` 复制整行、`p` 粘贴到下方、`P` 粘贴到上方。
7. **撤销重做**：`u` 撤销、`Ctrl-r` 重做。
8. **搜索**：`/word` 向下搜（`n` 下一个、`N` 上一个）、`?word` 向上搜。
9. **替换**：`:%s/旧/新/g`（全文替换）、`:%s/旧/新/gc`（逐个确认）、`:s/旧/新/g`（仅当前行）。
10. **保存退出**（命令模式）：`:w` 保存、`:q` 退出、`:wq` 保存退出、`:q!` 不保存强退、`:x` 有改动才保存退出。

**新手最常见的卡点——「怎么退出 Vim」**：先按 `Esc`（确保在普通模式），再输入 `:q!` 回车（不保存强退）。或者直接 `ZQ`（大写 Z 大写 Q）。

## 二、Nano：无模式新手友好

Nano 没有模式概念，打开就能直接打字，底部菜单栏显示快捷键，对新手友好：

```
  ^G Help     ^O Write Out   ^W Where Is    ^K Cut
  ^X Exit     ^R Read File   ^^\ Replace    ^U Paste
```

- `^` 表示 **Ctrl**：`^O`（Ctrl-O）保存、`^X` 退出、`^K` 剪切当前行、`^U` 粘贴、`^W` 搜索、`^G` 帮助。
- `M-` 表示 **Alt**（Meta）：`M-\` 跳文件首、`M-/` 跳文件尾。
- 保存时底部提示文件名，按回车确认；退出时若有未保存改动会问 `Save modified buffer?`，按 `Y` 保存。
- 启动选项：`nano -l file`（显示行号）、`nano -c file`（底部显示光标行列）。

服务器入门建议：**先 Nano 应急，再学 Vim**。Nano 胜在零学习成本；但 Vim 熟练后效率更高（宏、可视块列编辑 `Ctrl-v`、强大的替换与跳转），是进阶运维与编程的必备技能，多数服务器默认装 `vi`/`vim` 而非 `nano`。

## 三、sudo：以 root 执行

`sudo`（superuser do）让普通用户**以 root 身份执行单条命令**，是日常运维最常用的提权方式：

```
sudo systemctl restart nginx      # 以 root 重启服务
sudo apt install vim              # 以 root 装包
sudo cat /etc/shadow             # 读只有 root 能读的文件
sudo -i                          # 切到 root 交互式 shell（exit 退出）
sudo su -                        # 同上，完全切到 root 用户环境
sudo -u deploy whoami            # 以指定用户执行（不一定是 root）
sudo -k                          # 清除缓存的密码（下次 sudo 重新输密码）
```

- **输的是当前用户自己的密码**（不是 root 密码），前提是该用户在 `/etc/sudoers`（或 `/etc/sudoers.d/`）里被授权。
- `sudo` 默认缓存密码 5 分钟（期间再 `sudo` 不用重输），安全考虑避免长期提权。
- **`sudo -i` vs `sudo su -`**：两者都切到 root 的完整登录 shell（加载 root 的环境变量），区别在于内部实现（`sudo -i` 是 sudo 内置）。`sudo su`（不带 `-`）不加载 root 环境变量，可能 PATH 不对。
- **修改 sudoers**：永远用 `sudo visudo`（不是直接 `vim /etc/sudoers`），`visudo` 会在保存时校验语法，避免配置错误导致无法 `sudo` 的灾难。

## 四、df 与 du：磁盘空间

**`df`**（disk free）看**整个文件系统/挂载点**的用量：

```
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        40G   28G   10G  74% /              ← 根分区用了 74%，注意
tmpfs           2.0G     0  2.0G   0% /dev/shm
/dev/vdb1       100G   45G   55G  45% /data
```

- `-h`（human-readable）转 KB/MB/GB；`-T` 显示文件系统类型（ext4/xfs）。
- **`Use%` 接近 100%** 是磁盘满了，会导致服务写日志失败、数据库崩溃、无法登录（pam 写不了 lastlog）。监控必查项。

**`du`**（disk usage）看**某个目录**占了多少空间：

```
$ du -sh /var/log               # /var/log 总大小
128M  /var/log

$ du -h --max-depth=1 /var       # /var 下各一级子目录大小（找占空间的）
4.0K  /var/lock
128M  /var/log
2.0G  /var/lib
512M  /var/cache
...

$ du -sh * | sort -rh | head     # 当前目录下最大的 10 个（找元凶）
2.0G  node_modules
512M  dist
128M  logs
```

- `-s`（summary）只显示总计，不递归列出每个子文件；`-h` 人类可读；`--max-depth=N` 限制递归深度。
- 配合 `sort -rh`（按人类可读数字降序）找最大的目录，是排查「磁盘怎么满了」的标准流程。

## 五、export 与环境变量

**环境变量**是进程的运行环境配置（路径、语言、密钥等），子进程会继承父进程的环境变量。

```
export JAVA_HOME=/usr/lib/jvm/java-17     # 设置环境变量
export PATH=$PATH:/opt/bin                # 把 /opt/bin 加到 PATH 末尾
echo $JAVA_HOME                           # 查看单个变量
env                                       # 列出所有环境变量
printenv PATH                             # 只看 PATH（等价 echo $PATH）
```

- **`export` 才会让变量进环境**：`VAR=1`（不加 export）只是 shell 变量，子进程看不到；`export VAR=1` 才是环境变量。
- **`PATH`** 是命令搜索路径（冒号分隔），执行 `ls` 时 shell 按 `PATH` 顺序在目录里找 `ls` 可执行文件。`which ls` 显示找到的位置。
- **持久化**：`export` 只在当前 shell 生效。要永久生效：
  - 用户级：写入 `~/.bashrc`（交互式非登录 shell）或 `~/.bash_profile`（登录 shell）。
  - 全局：写入 `/etc/profile`（所有用户登录）或 `/etc/environment`。
  - 改完后 `source ~/.bashrc` 立即生效（不必重开终端）。

## 六、source 与执行脚本的区别

**`source`**（或等价的 `.`）在**当前 shell** 里执行脚本——脚本里所有的变量定义、`cd`、`alias`、`export` 都会影响当前 shell：

```
$ cat setup.sh
export APP_ENV=production
cd /app
alias run='./start.sh'

$ source setup.sh          # 当前 shell 执行
$ echo $APP_ENV            # 变量生效（source 后保留了）
production
$ pwd
/app                       # cd 生效（当前目录变了）
$ run                      # alias 生效
```

对比**执行脚本**（`./setup.sh` 或 `bash setup.sh`）——开一个**子 shell** 执行，脚本里的变量、`cd`、`alias` 执行完就消失，不影响当前 shell：

```
$ bash setup.sh
$ echo $APP_ENV            # 空！子 shell 的变量没带出来
$ pwd
/home/alice                # 没变，cd 只在子 shell 里生效
```

- **改 `.bashrc`/`.bash_profile` 后**：必须 `source ~/.bashrc`（在当前 shell 重载），否则要重开终端才生效。
- **激活虚拟环境**：`source venv/bin/activate` 就是用 source，让虚拟环境的变量和 `PATH` 修改在当前 shell 生效。
- **加载函数库**：把公共函数写进 `lib.sh`，脚本里 `source lib.sh` 后就能调用——但注意 source 进来的函数会污染当前 shell 的命名空间。

## 七、alias：命令别名

`alias` 给长命令起短名，简化日常操作：

```
alias ll='ls -lah'                   # ll 列详情含隐藏
alias gs='git status'                # git status 缩写
alias ..='cd ..'                     # 返回上级
alias grep='grep --color=auto'       # 默认高亮匹配
alias rm='rm -i'                     # 删除前确认（安全习惯）
alias dockerps='docker ps --format "table {{.Names}}\t{{.Status}}"'

alias                                # 列出所有已定义的别名
unalias ll                           # 取消某个别名
```

- **`alias` 只在当前 shell 有效**，新开终端就没了。持久化写入 `~/.bashrc`（末尾追加），然后 `source ~/.bashrc`。
- **别名优先级高于命令**：定义了 `alias ls='ls --color=auto'` 后，输入 `ls` 实际执行 `ls --color=auto`。要执行原始命令用 `\ls`（前导反斜杠跳过别名）或 `command ls`。
- **别名不能带位置参数**：`alias mkcd='mkdir $1 && cd $1'` 不行（`$1` 不展开）。要带参数得用**函数**：`mkcd() { mkdir "$1" && cd "$1"; }`。

## 下一步

编辑器与环境工具熟练后，你已经具备服务器日常操作的基础。下一步可以深入[进程管理与服务](../../process-services/)（`ps`/`top`/`kill` 与 systemd）与[文本处理](../../text-processing/)（`grep`/`sed`/`awk`）——它们都建立在文件操作之上。
