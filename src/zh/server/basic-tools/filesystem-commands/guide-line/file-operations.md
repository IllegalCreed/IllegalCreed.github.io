---
layout: doc
outline: [2, 3]
---

# 文件操作详解：ls / cd / cp / mv / rm / find / ln / chmod

> 基于 Linux 核心命令 · 核于 2026-08

## 速查

- **`ls`**：列目录。`-l` 详情、`-a` 含隐藏、`-h` 人类可读大小、`-t` 按时间排序、`-r` 逆序、`-R` 递归。`ls -lah` 是最高频组合。
- **`cd`**：切换目录。`cd path`（绝对/相对）、`cd ~`（回家）、`cd -`（回上次目录）、`cd ..`（上级）。
- **`cp`**：复制。`cp a b` 复制文件；`cp -r dir1 dir2` **递归**复制目录（不加 `-r` 报「omitting directory」）；`-p` 保留权限/时间；`-i` 覆盖前确认。
- **`mv`**：移动/改名（同操作）。同目录下 `mv a b` 改名；跨目录 `mv f dir/` 移动。同分区瞬时（只改目录项），跨分区真实拷贝+删除。
- **`rm`**：删除（**无回收站**）。`rm f` 删文件；`rm -r dir` 递归删目录；`-f` 强制不问。`rm -rf` 极危险，脚本中变量为空时 `rm -rf $DIR/` 会变 `rm -rf /`。
- **`find`**：实时遍历目录树查找。`-name`（名，通配符）/`-type`（f/d/l）/`-size`/`-mtime`/`-perm`；`-exec ... {} \;` 对结果执行命令；`-delete` 找到即删。
- **`ln`**：链接。`ln a b` 建**硬链接**（同 inode，删原文件仍可读，不能跨分区/不能链接目录）；`ln -s a b` 建**软链接**（路径指针，删原文件失效，可跨分区/可链接目录）。
- **`chmod`**：改权限。数字法 `chmod 755 f`（属主 rwx + 属组 rx + 其他 rx）；符号法 `chmod u+x,g-w f`；`-R` 递归。
- **`chown`**：改属主/属组。`chown alice f`、`chown alice:dev f`、`chown -R alice dir`。
- **权限模型**：属主/属组/其他人三组 × r/w/x；数字 `r=4 w=2 x=1`；目录的 `x` 表示「能否 cd 进去」。

## 一、ls：列目录的细节

`ls` 是用得最多的命令，`-l` 的输出每行一个文件，字段含义：

```
$ ls -l deploy.sh
-rwxr-xr--  1  alice  dev  512  Aug 2 10:00  deploy.sh
└──┬───┘  └┬┘  └─┬─┘ └┬┘ └─┬─┘ └────┬────┘ └──┬──┘
   权限   硬链接数 属主  属组 大小   修改时间   文件名
```

- **第一个字符表示类型**：`-` 普通文件、`d` 目录、`l` 符号链接、`c`/`b` 字符/块设备（如 `/dev/tty`、`/dev/sda`）。
- **权限 9 位**：分三组 `rwx`，分别属主/属组/其他人。
- **硬链接数**：对普通文件是有多少个硬链接指向同一 inode；对目录是子目录数 + 2（`.` 和 `..`）。
- **大小**：默认字节，`-h` 转 KB/MB/GB 人类可读。
- **隐藏文件**：以 `.` 开头的文件/目录默认不显示，`-a` 才显示（如 `.bashrc`、`.git`）。

常用组合：`ls -lah`（详情+隐藏+人类可读）、`ls -lt`（按时间新→旧）、`ls -ltr`（旧→新，找最新日志用 `ls -ltr *.log | tail`）。

## 二、cp 与 mv：复制与移动

**`cp`** 复制文件，目录必须加 `-r`：

```
cp config.txt config.bak           # 复制文件
cp -r project/ project_backup/     # 递归复制整个目录
cp -i a.txt b.txt                  # b.txt 存在时询问确认
cp -p a.txt b.txt                  # 保留权限/时间戳/属主
cp -v *.log /backup/               # 显示每个复制过程
```

- 默认 `cp` 会**改变属主**为执行者、**丢失原时间戳**，要保留原属性用 `-p`。
- `cp -r dir1/ dir2`（带斜杠）与 `cp -r dir1 dir2` 行为可能不同（取决于 dir2 是否存在），路径尾部斜杠是常见混淆点。

**`mv`** 既是改名也是移动，本质都是「改路径名」：

```
mv old.txt new.txt                 # 改名
mv file.txt /tmp/                  # 移动到 /tmp
mv *.log /var/log/archive/         # 批量移动
mv -i a b                          # 覆盖前确认（生产推荐默认开 -i）
```

- 同分区内 `mv` 是**瞬时**的（只改目录项，数据不动）；跨分区（如 `/home` 到 `/mnt/usb`）会真实拷贝数据再删除源，大文件会慢。
- `mv` 覆盖同名文件**不询问**（除非 `-i`），是数据丢失的常见原因——建议 `~/.bashrc` 里 `alias mv='mv -i'`。

## 三、rm：删除与安全

`rm` 删除文件，**没有回收站**，删了就没了：

```
rm file.txt                        # 删文件
rm -i file.txt                     # 删前确认（推荐）
rm -r old_project/                 # 递归删目录
rm -f temp*                        # 强制删，不问不存在
rm -rf node_modules/               # 删整个目录树
```

**安全陷阱——`rm -rf` 的灾难场景**：

- 脚本里 `rm -rf $DIR/*`，若 `$DIR` 变量为空，命令变成 `rm -rf /*`，**删整个系统**。
- 防御：变量加引号 `rm -rf "$DIR"/*`；或先判空 `[ -n "$DIR" ] && rm -rf "$DIR"/*`；或用 `set -u` 让引用未定义变量直接报错。
- `rm` 没有撤销，恢复只能靠**备份/快照/LVM 快照/文件系统只读后用 extundelete**——但都不保证成功。

养成习惯：危险删除前先 `ls` 看一遍目标，确认无误再 `rm`；生产脚本用 `mv` 到临时目录（如 `/tmp/trash_$(date +%s)`）代替直接 `rm`，留后悔余地。

## 四、find：强大的查找

`find` 按**多种条件组合**遍历目录树，是最灵活的查找工具：

**按名/类型**：

```
find /var/log -name "*.log"          # 名字匹配（通配符 * ?）
find . -iname "*.JPG"                # 忽略大小写
find . -type f                       # 普通文件（d=目录,l=符号链接）
find /dev -type b                    # 块设备
```

**按时间**（`-` 内 / `+` 前，单位天 mtime / 分 mmin）：

```
find /tmp -mtime -1                  # 1 天内修改（新文件）
find /tmp -mtime +30                 # 30 天前修改（旧文件，清理用）
find . -mmin -10                     # 10 分钟内修改
find . -newer ref.txt                # 比 ref.txt 还新
```

**按大小/权限**：

```
find . -size +100M                   # 大于 100MB（找大文件清磁盘）
find . -size +100M -size -1G         # 100MB~1GB 之间
find . -perm 777                     # 权限恰好 777（安全审计）
find . -perm -u+r                    # 属主有读（用 - 表示「至少含」）
```

**对结果执行动作**：

```
find . -name "*.tmp" -delete                 # 找到即删
find . -type f -exec chmod 644 {} \;         # 每个文件单独执行（\;）
find . -name "*.log" -exec gzip {} \;        # 批量压缩日志
find . -name "*.go" -exec grep "TODO" {} +   # 批量传参（+ 比 \; 快）
find . -name "*.bak" | xargs rm              # 配合 xargs（更快）
```

- `{} ` 是结果占位符，`\;` 结束单条命令（每个文件执行一次）；`+` 把多个文件攒成一批传给命令（类似 `xargs`，更快）。
- 文件名含空格/特殊字符时，`-exec ... {} \;` 比 `xargs` 安全（`xargs` 默认按空格分词会出错，要 `xargs -0` + `find -print0` 配合）。

## 五、ln：硬链接与软链接

**硬链接（`ln`）**——同一个 inode 的多个文件名：

```
$ echo "hello" > a.txt
$ ln a.txt b.txt              # 创建硬链接 b.txt
$ ls -li a.txt b.txt
1234567 -rw-r--r-- 2 alice alice 6 ... a.txt   ← inode 1234567，硬链接数 2
1234567 -rw-r--r-- 2 alice alice 6 ... b.txt   ← 同一个 inode！
$ rm a.txt                   # 删 a.txt
$ cat b.txt                  # b.txt 仍可读（inode 引用计数从 2 减到 1）
hello
```

- 硬链接共享 inode（数据块），改任何一个，其他都变（因为就是同一份数据）。
- **不能跨文件系统/分区**（inode 是分区内的概念）。
- **不能链接目录**（除 root 用 `-d`，但会破坏文件系统一致性，不推荐）。

**软链接（`ln -s`）**——存了目标路径的特殊文件（类似 Windows 快捷方式）：

```
$ ln -s /usr/bin/node-v20 /usr/bin/node   # node 指向 node-v20
$ ls -l /usr/bin/node
lrwxrwxrwx 1 root root 20 ... /usr/bin/node -> /usr/bin/node-v20
$ readlink /usr/bin/node                   # 看软链接目标
/usr/bin/node-v20
$ rm /usr/bin/node-v20                     # 删原文件
$ /usr/bin/node                            # 软链接失效（悬空 dangling）
bash: /usr/bin/node: No such file or directory
```

- 软链接**可跨分区**（只是路径字符串）；**可链接目录**。
- 删/移动原文件，软链接**悬空失效**（指向不存在的路径）。
- 版本切换利器：`/usr/bin/node` → `/opt/node-v20/bin/node`，升级只改软链接指向，所有引用 `node` 的脚本自动用新版本。

| 对比 | 硬链接 `ln` | 软链接 `ln -s` |
| --- | --- | --- |
| inode | 与原文件**相同** | 独立 inode（存路径） |
| 删原文件 | **不失效**（计数减 1） | **失效**（悬空） |
| 跨分区 | ❌ | ✅ |
| 链接目录 | ❌ | ✅ |
| 占用空间 | 几乎不（只增目录项） | 极小（存路径字符串） |

## 六、chmod 与 chown：权限管理

**权限三组九位**——属主/属组/其他人 × r/w/x：

```
-rwxr-xr--
 ┊┊┊┊┊┊┊┊┊
 U:rwx (7)    属主：读+写+执行
 G:r-x (5)    属组：读+执行
 O:r-- (4)    其他：只读
```

**`chmod` 改权限**——两种写法：

数字法（`r=4 w=2 x=1`，相加）：
```
chmod 755 deploy.sh     # rwxr-xr-x（脚本/目录典型）
chmod 644 config.txt    # rw-r--r--（配置文件典型）
chmod 600 ~/.ssh/id_rsa # rw-------（私钥，只属主可读写）
chmod -R 755 public/    # 递归改整个目录树
```

符号法（更直观）：
```
chmod u+x script.sh     # 属主加执行（u=属主 g=属组 o=其他 a=所有）
chmod g-w file          # 属组去掉写
chmod o=r file          # 其他人设为只读（= 覆盖式）
chmod a+r file          # 所有人加读
chmod ug+x,o-w file     # 组合：属主属组加执行、其他去写
```

**目录权限的特殊性**：
- `r`：能 `ls` 列出目录内容。
- `w`：能在目录里增删文件（改目录的内容）。
- `x`：能 `cd` 进入目录、访问其中的文件（按文件名）。
- 没有 `x`，即使有 `r`，能 `ls` 看到文件名但 `cd` 进不去、`cat` 文件会报「Permission denied」。所以目录默认 `755` 而非 `644`。

**`chown` 改属主/属组**：
```
chown alice file              # 改属主为 alice
chown alice:dev file          # 同时改属主 alice、属组 dev
chown :dev file               # 只改属组（chgrp file dev 等价）
chown -R alice:dev project/   # 递归改整个项目
```

只有 root（或 `sudo`）能 `chown`，普通用户不能把自己的文件送给别人（防止逃避磁盘配额）。

## 七、umask：新建文件的默认权限

`umask` 决定新建文件/目录的默认权限，是**反码掩码**：

- 新文件基础权限 `666`（rw-rw-rw-，不给执行位，安全考虑）。
- 新目录基础权限 `777`（rwxrwxrwx）。
- 实际权限 = 基础权限 **减去** umask。

```
$ umask            # 查看当前掩码
022
$ touch new.txt; mkdir newdir
$ ls -l
-rw-r--r-- ... new.txt      # 666 - 022 = 644
drwxr-xr-x ... newdir       # 777 - 022 = 755
```

- `umask 022` 是最常见默认值（属主全权，其他人只读）。
- `umask 077`：新文件 `600`、新目录 `700`，只有属主能访问（更安全，用于 `~/.ssh/`）。
- 持久化：写入 `~/.bashrc` 或 `/etc/profile`，否则重开 shell 失效。

## 下一步

文件操作命令熟练后，下一步学[编辑器与环境](./editors-and-env)——Vim/Nano 的生存操作与 `sudo`/`df`/`du`/`export`/`source`/`alias` 等环境辅助工具。
