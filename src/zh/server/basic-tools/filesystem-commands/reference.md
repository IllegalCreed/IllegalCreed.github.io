---
layout: doc
outline: [2, 3]
---

# 参考：命令速查、权限与 Vim 键位

> 基于 Linux 文件系统与核心命令 · 核于 2026-08

## 速查

- **一切皆文件**：普通文件/目录/设备/管道/套接字都用 `open`/`read`/`write`/`close` 封装。
- **单根目录树**：只有一个根 `/`，分区挂载到目录树节点；核心目录 `/etc`（配置）、`/var`（日志）、`/home`（用户）、`/dev`（设备）。
- **七件套**：`ls`/`cd`/`cp`/`mv`/`rm`/`mkdir`/`touch`；查找 `find`（实时遍历）/`locate`（索引）。
- **权限**：属主/属组/其他 × r/w/x，数字 `r=4 w=2 x=1`；目录的 `x` 表示「能否进入」。
- **`chmod`** 改权限（数字 `755` 或符号 `u+x`），**`chown`** 改属主，**`umask`** 决定新建默认权限。
- **链接**：硬链接（`ln`，同 inode，删原文件仍可读）/ 软链接（`ln -s`，路径指针，删原文件失效）。
- **Vim**：`i` 插入、`Esc` 普通模式、`:wq` 保存退出、`:q!` 强退、`/word` 搜索。
- **Nano**：无模式，`^O` 保存、`^X` 退出。
- **环境**：`sudo`（root 执行单条）、`df -h`（磁盘整体）、`du -sh`（目录大小）、`export`（环境变量）、`source`（当前 shell 执行）、`alias`（别名）。

## 一、文件命令速查表

| 命令 | 作用 | 高频选项 | 示例 |
| --- | --- | --- | --- |
| `ls` | 列目录 | `-l` 详情 / `-a` 含隐藏 / `-h` 人类可读 / `-t` 按时间 / `-R` 递归 | `ls -lah` |
| `cd` | 切换目录 | `~` 家 / `-` 上次 | `cd /var/log` |
| `pwd` | 显示当前路径 | — | `pwd` |
| `cp` | 复制 | `-r` 递归 / `-i` 确认 / `-p` 保留属性 / `-v` 显示过程 | `cp -r dir1 dir2` |
| `mv` | 移动/改名 | `-i` 确认 / `-f` 强制 | `mv old.txt new.txt` |
| `rm` | 删除 | `-r` 递归 / `-f` 强制 / `-i` 确认 | `rm -rf tmp/` |
| `mkdir` | 建目录 | `-p` 连父目录 / `-m` 设权限 | `mkdir -p a/b/c` |
| `rmdir` | 删空目录 | — | `rmdir empty/` |
| `touch` | 建空文件/改时间 | `-t` 指定时间 | `touch f.txt` |
| `find` | 查找 | `-name`/`-type`/`-size`/`-mtime`/`-exec` | `find . -name "*.log"` |
| `ln` | 链接 | `-s` 软链接 | `ln -s target link` |
| `chmod` | 改权限 | `-R` 递归 / 数字或符号 | `chmod 755 f` |
| `chown` | 改属主 | `-R` 递归 / `user:group` | `chown alice:dev f` |
| `stat` | 看文件详情 | — | `stat f`（含 inode/时间） |

## 二、权限数字对照

| 数字 | 符号 | 含义 |
| --- | --- | --- |
| `7` | `rwx` | 读 + 写 + 执行 |
| `6` | `rw-` | 读 + 写 |
| `5` | `r-x` | 读 + 执行（目录典型） |
| `4` | `r--` | 只读 |
| `0` | `---` | 无权限 |

**常见组合**：

- `755`：目录/可执行脚本（属主全权，其他人能进能读不能改）。
- `644`：普通文件/配置（属主读写，其他人只读）。
- `600`：私密文件（只有属主能读写，如 `~/.ssh/id_rsa` 私钥）。
- `777`：所有人全权——**安全大忌**，生产环境基本不该出现。

## 三、find 高频用法

```
find /var/log -name "*.log"               # 按名（通配符）
find . -iname "*.JPG"                     # 忽略大小写
find . -type f                            # 只找普通文件（d=目录,l=链接）
find /tmp -mtime -1                       # 1 天内修改
find /tmp -mmin +30                       # 30 分钟前修改
find . -size +100M -size -1G              # 100MB~1GB 之间
find . -perm 644                          # 权限恰好 644
find . -empty                             # 空文件/空目录
find . -name "*.tmp" -delete              # 找到即删
find . -type f -exec wc -l {} \;          # 统计每个文件行数
find . -name "*.go" -exec grep "TODO" {} + # 批量搜（+ 比 \; 快）
```

- `-mtime -7`：7 天**内**（`-` 内）；`-mtime +7`：7 天**前**（`+` 前）。新手常搞反。
- `-exec ... \;` 每个结果执行一次命令；`-exec ... {} +` 批量传参（更快，类似 `xargs`）。

## 四、Vim 生存键位

**模式切换**：`Esc`（回普通模式）/ `i`（插入）/ `v`（可视）/ `:`（命令模式）。

**普通模式（移动与编辑）**：

| 键 | 作用 | 键 | 作用 |
| --- | --- | --- | --- |
| `h j k l` | 左 下 上 右 | `gg` | 跳到文件首 |
| `w` / `b` | 下一个/上一个词首 | `G` | 跳到文件尾 |
| `0` / `$` | 行首/行尾 | `:42` | 跳到第 42 行 |
| `dd` | 删整行 | `yy` | 复制整行 |
| `dw` | 删一个词 | `p` | 粘贴 |
| `u` | 撤销 | `Ctrl-r` | 重做 |
| `x` | 删一个字符 | `~` | 切换大小写 |

**命令模式**（`:` 开头）：

| 命令 | 作用 |
| --- | --- |
| `:w` | 保存 |
| `:q` | 退出 |
| `:wq` 或 `ZZ` | 保存退出 |
| `:q!` 或 `ZQ` | 强制不保存退出 |
| `/word` | 向下搜索 word（`n` 下一个，`N` 上一个） |
| `?word` | 向上搜索 |
| `:%s/old/new/g` | 全文替换 old 为 new |
| `:s/old/new/g` | 当前行替换 |
| `:%s/old/new/gc` | 替换前逐个确认 |

## 五、环境工具速查

| 命令 | 作用 | 示例 |
| --- | --- | --- |
| `sudo cmd` | 以 root 执行单条 | `sudo systemctl restart nginx` |
| `sudo -i` / `sudo su -` | 切到 root 交互式 shell | — |
| `df -h` | 磁盘整体用量（人类可读） | `df -h /var` |
| `du -sh dir` | 目录总大小 | `du -sh /var/log` |
| `du -h --max-depth=1` | 各子目录大小 | 找占空间的大目录 |
| `export VAR=v` | 设环境变量 | `export PATH=$PATH:/opt/bin` |
| `echo $VAR` | 查看变量值 | `echo $JAVA_HOME` |
| `source f` / `. f` | 在当前 shell 执行脚本 | `source ~/.bashrc`（重载配置） |
| `alias ll='ls -la'` | 设命令别名 | 写入 `~/.bashrc` 持久化 |
| `env` | 列出所有环境变量 | — |

## 六、易错点清单

- **「`cp` 能复制目录」**：默认不能，必须 `cp -r`，否则报「omitting directory」。
- **「`rm` 有回收站」**：错。Linux 终端 `rm` 直接删，无回收站。误删靠备份/快照恢复。`rm -rf` 更要小心路径参数（脚本里变量为空时 `rm -rf $DIR/` 变 `rm -rf /` 是经典事故）。
- **「目录权限 `644` 就够了」**：错。目录没有 `x` 就 `cd` 不进去（权限拒绝）。目录默认 `755`（能进能列），不是 `644`。
- **「`chmod 777` 最方便」**：方便但危险——所有人可写可执行，安全大忌。生产环境基本不该用，应按最小权限设。
- **「软链接和硬链接一样」**：错。硬链接同 inode（删原文件仍可读、不能跨分区、不能链接目录）；软链接是路径指针（删原文件失效、可跨分区、可链接目录）。
- **「`ln` 默认建软链接」**：错。`ln` 默认建**硬链接**，建软链接要 `ln -s`。
- **「Vim 里直接打字就能编辑」**：错。Vim 默认是**普通模式**，必须先按 `i`/`a`/`o` 进入插入模式才能输入文字。新手最常见的困惑是「为什么打了字没反应」。
- **「`source` 和执行脚本一样」**：`source f`（或 `. f`）在**当前 shell** 执行（脚本里 `export` 的变量会保留）；`./f` 或 `bash f` 开**子进程**执行（变量不污染当前 shell）。所以改完 `.bashrc` 要 `source` 而非执行。
- **「`sudo` 输的是当前用户密码」**：错。`sudo` 输的是**当前用户自己的密码**（前提是该用户在 sudoers 里），不是 root 密码。`su` 才是输 root 密码。

## 七、进阶方向（链接其他叶）

- [进程管理与服务](../process-services/) —— `ps`/`top`/`kill` 与 systemd 管理文件服务
- [文本处理](../text-processing/) —— `grep`/`sed`/`awk` 组合处理日志文件
- [Bash](../bash/)（如有）—— 把命令组合成脚本

## 权威链接

- [Linux Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html)
- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/)
- [find(1) man page](https://man7.org/linux/man-pages/man1/find.1.html)
- [Vim documentation](https://vimhelp.org/)
- 本站幻灯片：<a href="/SlideStack/filesystem-commands-slide/" target="_blank">文件系统与基础命令</a>
