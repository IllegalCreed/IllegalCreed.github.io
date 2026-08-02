---
layout: doc
outline: [2, 3]
---

# 参考：Bash 速查、特殊变量、内建命令与易错点

> 基于 GNU Bash · 核于 2026-08

## 速查

- **Bash 定义**：GNU Shell，POSIX 超集，Linux 服务器默认。
- **严苛三件套**：`set -euo pipefail`（errexit + nounset + pipefail），生产脚本必加。
- **特殊变量**：`$?` 退出码、`$#` 参数数、`$1`.. 位置参数、`$@` 全部（加引号独立）、`$$` PID、`$!` 后台 PID、`$0` 脚本名。
- **重定向 FD**：0 stdin、1 stdout、2 stderr；`>` 覆盖 `>>` 追加 `2>&1` 合并 `&>` 简写。
- **条件**：`[[ ]]`（Bash 增强，支持正则/模式）优于 `[ ]`（POSIX）。
- **引号**：永远加双引号 `"$var"`（防空格分词+glob）；单引号字面原样。
- **shebang**：`#!/usr/bin/env bash`（推荐，不假设路径）。
- **退出码**：0 成功，非 0 失败（127 命令未找到，128+N 被信号杀）。

## 一、变量与展开速查

### 赋值与取值

```bash
name=value              # 赋值（等号两边无空格！）
echo "${name}"          # 取值（推荐 ${} 防歧义）
export PATH="$PATH:/x"  # 升环境变量
local x                 # 函数内局部
readonly PI=3.14        # 只读
declare -i n=10         # 整数
declare -A m=([a]=1)    # 关联数组（Bash 4+）
```

### 参数展开

| 写法 | 含义 |
| --- | --- |
| `${var:-x}` | 未设/空 → 用 x（不改 var） |
| `${var:=x}` | 未设/空 → 用 x 并赋值 |
| `${var:+x}` | 已设非空 → 用 x |
| `${var:?err}` | 未设/空 → 报 err 并退出 |
| `${#var}` | 字符串长度 |
| `${var:0:3}` | 子串：偏移 0 取 3 |
| `${var#pat}` | 去最短前缀 |
| `${var##pat}` | 去最长前缀（取文件名 `##*/`） |
| `${var%pat}` | 去最短后缀（去后缀 `%.txt`） |
| `${var%%pat}` | 去最长后缀 |
| `${var/old/new}` | 替换首个 |
| `${var//old/new}` | 替换全部 |
| `${var^^}` / `${var,,}` | 转大写 / 小写 |

### 特殊变量

| 变量 | 含义 |
| --- | --- |
| `$?` | 上一条命令退出码（0=成功） |
| `$#` | 位置参数个数 |
| `$0` | 脚本名 / 当前 shell 名 |
| `$1` `$2` ... `$9` | 位置参数（超 9 用 `${10}`） |
| `$@` | 所有位置参数（`"$@"` 每个独立，**推荐**） |
| `$*` | 所有位置参数拼一串（IFS 分隔） |
| `$$` | 当前 shell PID |
| `$!` | 最近后台进程 PID |
| `$-` | 当前 shell 选项标志（如 `hBu`） |
| `$_` | 上一条命令最后一个参数 |

## 二、重定向速查

| 写法 | 含义 |
| --- | --- |
| `cmd > file` | stdout 覆盖写 file |
| `cmd >> file` | stdout 追加 |
| `cmd < file` | 从 file 读 stdin |
| `cmd 2> file` | stderr 写 file |
| `cmd > file 2>&1` | 合并 stdout+stderr 到 file（顺序重要） |
| `cmd &> file` | 合并简写（Bash 4+） |
| `cmd > /dev/null 2>&1` | 全丢弃 |
| `cmd <<EOF ... EOF` | here-doc 多行注入 stdin |
| `cmd <<< "text"` | here-string 单行注入 stdin |
| `cmd1 \| cmd2` | 管道：stdout → stdin |
| `cmd \|& cmd2` | 管道含 stderr（Bash 4+） |
| `diff <(a) <(b)` | 进程替换 |

## 三、条件测试速查

```bash
# [[ ]] 增强（推荐）
[[ -f file ]]            # 文件存在且普通文件
[[ -d dir ]]             # 目录存在
[[ -e path ]]            # 存在（任意类型）
[[ -r file ]]            # 可读 / -w 可写 / -x 可执行
[[ -s file ]]            # 文件非空
[[ -z "$s" ]]            # 字符串为空 / -n 非空
[[ "$a" == "$b" ]]       # 字符串相等 / != 不等
[[ "$a" == a* ]]         # 通配模式匹配（非正则）
[[ "$s" =~ ^[0-9]+$ ]]   # 正则匹配（=~）
[[ -n "$a" && -f "$a" ]] # 逻辑与 / \|\| 或 / ! 非

# 数值比较（用 (( )) 更直观）
(( a > b ))              # 数值大于（优于 [[ a -gt b ]]）
(( a == b ))             # 等于 / != 不等 / < / > / <= >=

# 文件时间比较
[[ file1 -nt file2 ]]    # file1 比 file2 新 / -ot 更旧
```

## 四、循环速查

```bash
for x in a b c; do ...; done              # 遍历列表
for x in *.txt; do ...; done              # 遍历 glob
for ((i=0;i<10;i++)); do ...; done         # C 风格
while cmd; do ...; done                    # 条件真循环
until cmd; do ...; done                    # 条件假循环
while read line; do ...; done < file       # 逐行读文件

case "$x" in
    start)  echo "启动" ;;
    stop)   echo "停止" ;;
    *)      echo "未知" >&2; exit 1 ;;
esac
```

## 五、内建命令清单（高频）

| 命令 | 用途 |
| --- | --- |
| `echo` / `printf` | 输出（printf 更可控，推荐） |
| `read` | 读输入到变量 |
| `source` / `.` | 当前 shell 加载脚本 |
| `export` | 设环境变量 |
| `local` | 函数内局部变量 |
| `readonly` | 只读变量 |
| `declare` | 声明变量属性（-i 整数 -a 数组 -A 关联 -r 只读） |
| `set` / `unset` | 设/取消 shell 选项与变量 |
| `shift` | 位置参数左移（`shift 2` 移两个） |
| `exit N` | 退出脚本（返回码 N） |
| `return N` | 退出函数（返回码 N） |
| `trap` | 注册信号/退出清理 |
| `test` / `[ ]` / `[[ ]]` | 条件测试 |
| `getopts` | 解析短选项 |
| `type` / `command -v` | 查命令类型/路径 |
| `alias` / `unalias` | 别名 |
| `cd` / `pwd` / `pushd` / `popd` | 目录操作 |
| `eval` | 二次展开执行（危险，慎用） |
| `exec` | 替换当前进程（不 fork） |
| `mapfile` / `readarray` | 文件读入数组（Bash 4+） |

## 六、严苛模式与健壮脚本模板

```bash
#!/usr/bin/env bash
# 生产级脚本模板
set -Eeuo pipefail
# -E：ERR trap 继承到函数/子shell
# -e：遇错退出
# -u：未定义变量报错
# -o pipefail：管道失败传播

IFS=$'\n\t'                  # 收紧词分割（防空格意外分词）

tmpfile=""
cleanup() {
    [[ -n "$tmpfile" ]] && rm -f "$tmpfile"
}
trap cleanup EXIT ERR        # 正常退出与出错都清理

log()  { printf '[%s] %s\n' "$(date +%FT%T)" "$*" >&2; }
die()  { printf '[ERROR] %s\n' "$*" >&2; exit 1; }

# 锁文件防并发
lockfile="/tmp/$(basename "$0").lock"
exec 9>"$lockfile" || die "无法创建锁"
flock -n 9 || die "另一实例正在运行"

log "开始"
# ... 业务逻辑 ...
log "完成"
```

## 七、易错点清单

- **`a = 1`（赋值带空格）**：错。Bash 把 `a` 当命令。正确 `a=1`。
- **`rm $file`（不加引号）**：危险。`file="my doc.txt"` 会被词分割成 `my` 和 `doc.txt`。正确 `rm "$file"`。
- **`[ $x = "" ]`（`[ ]` 空变量）**：错。`x` 为空时变成 `[ = "" ]` 语法错。正确 `[[ -z "$x" ]]`。
- **`$(cmd)` 与反引号混用**：反引号不可嵌套、视觉差。统一用 `$()`。
- **管道里赋值**：`echo hi | read x; echo $x` 空——管道段在子 shell。用 `read x <<< "hi"`。
- **`set -e` 不触发条件位置**：`cmd` 在 `if cmd`、`cmd && ...`、`cmd || true` 里失败不会退出。
- **`2>&1 > file` 顺序错**：先 `2>&1` 把 stderr 指向当前 stdout（屏幕），再 `> file` 改 stdout，stderr 仍在屏幕。正确 `> file 2>&1`。
- **macOS Bash 是 3.2**：`mapfile`、关联数组 `declare -A`、`&>` 都不可用。需 `brew install bash` 装 Bash 5。
- **`/bin/sh` 不一定是 Bash**：Debian/Ubuntu 的 `/bin/sh` 是 `dash`（更快的 POSIX shell），不支持 Bash 扩展。脚本用 Bash 扩展要 `#!/usr/bin/env bash`。
- **`return` vs `exit`**：函数内 `exit` 会终止整个脚本，不是只退函数。
- **`source` vs 执行**：`bash script.sh` 跑子 shell（变量不外泄）；`source script.sh` 在当前 shell 跑（变量/函数留下来）。
- **cron PATH 极简**：crontab 脚本不读 `.bashrc`，PATH 可能只有 `/usr/bin:/bin`——脚本里要显式补 PATH。

## 八、进阶方向（链接其他叶）

- [Zsh](../zsh/) —— 交互日常驱动、补全系统、与 Bash 的差异
- [PowerShell](../powershell/) —— 跨平台、对象管道的另一种范式
- [文件系统与基础命令](../) —— `ls`/`cd`/`cp`/`find` 等与 Bash 配合的基础命令
- [进程管理与服务（systemd）](../) —— Bash 脚本如何被 systemd 调度

## 权威链接

- [Bash - GNU Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [Bash - Wikipedia](https://en.wikipedia.org/wiki/Bash_(Unix_shell))
- [Bash Hackers Wiki](https://wiki.bash-hackers.org/)
- [ShellCheck - shell 脚本静态检查](https://www.shellcheck.net/)
- [Pure Bash Bible（纯 Bash 实现常见任务）](https://github.com/dylanaraps/pure-bash-bible)
- 本站幻灯片：<a href="/SlideStack/bash-slide/" target="_blank">Bash</a>
