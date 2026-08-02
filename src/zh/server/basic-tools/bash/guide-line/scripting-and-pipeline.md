---
layout: doc
outline: [2, 3]
---

# 脚本编程与管道：变量、条件、循环、重定向

> 基于 GNU Bash · 核于 2026-08

## 速查

- **变量无类型**：Bash 变量全是字符串，`a=1` 的 `1` 是字符。算术要用 `$(( ))`：`$((a + b))`，整数运算无需 `expr`。
- **赋值无空格**：`name=value`，等号两边**绝不能有空格**——否则 Bash 把 `name` 当命令。这是 Bash 第一坑。
- **引号三态**：**双引号** `"$var"` 展开变量且保护空格（**永远加双引号**）；**单引号** `'$var'` 字面原样；**无引号** `$var` 会**词分割 + glob 展开**（除非确实需要分词，否则是 bug 源）。
- **参数展开进阶**：`${var:-default}`（未设用默认）、`${var:=default}`（未设并赋值）、`${#var}`（长度）、`${var%.txt}`（去后缀）、`${var//old/new}`（全局替换）、`${var:0:3}`（子串）。
- **数组**：普通数组 `arr=(a b c)`，取值 `${arr[0]}`/`${arr[@]}`（全部），长度 `${#arr[@]}`；**关联数组**（Bash 4+）`declare -A m=([k1]=v1 [k2]=v2)`，取值 `${m[k1]}`。
- **命令替换**：`$(cmd)`（推荐，可嵌套）优于反引号 `` `cmd` ``（不可嵌套、难读）。
- **管道 `|`**：左侧 stdout → 右侧 stdin；每段跑在**独立子 shell**，管道内赋值外层不可见（用 `<<<` 或 `lastpipe` 选项绕过）。
- **重定向 FD**：0=stdin、1=stdout、2=stderr。`>` 覆盖、`>>` 追加、`2>` 错误、`2>&1` 合并错误到 stdout（**写在 stdout 重定向之后**）、`&>` 合并简写。
- **here-doc `<<EOF`**：多行字符串注入 stdin；**here-string `<<<"text"`**：单行注入 stdin（常配合 `read`）。
- **条件测试**：`[[ ]]`（Bash 增强，支持 `=~` 正则、模式匹配 `==`、`&&`/`||`）优于 `[ ]`（POSIX `test`，坑多）。文件测试 `-f`/`-d`/`-e`/`-r`/`-s`；字符串 `-z`/`-n`/`==`/`!=`；数值 `-eq`/`-ne`/`-lt`/`-gt`。
- **循环**：`for x in list`、`for ((i=0;i<n;i++))`、`while cond`、`until cond`；`break`/`continue` 控制；`case ... esac` 多分支。
- **算术**：`$(( ))` 展开取值；`(( ))` 命令（做判断，非0为真）：`((count++))`、`(( i < 10 ))`。

## 一、变量与展开：Bash 的语义基石

Bash 把"展开"做成了语言核心——一行命令在被执行前，会先经历多轮展开（顺序：花括号 → `~` → 参数/命令/算术/进程替换 → 词分割 → 路径展开 → 引号去除）。理解展开，就理解了 Bash 一半的怪异行为。

### 赋值与取值

```bash
# ✅ 正确：等号两边无空格
count=10
name="Alice"
files=(a.txt b.txt c.txt)   # 数组

# ❌ 错误：有空格 → 把 name 当命令
name = "Alice"   # bash: name: command not found

# 取值
echo "$count"          # 双引号：展开变量（推荐）
echo '$count'          # 单引号：字面输出 $count
echo $count            # 无引号：先展开，再词分割+glob（危险！）
```

**为什么永远要加双引号**：无引号的 `$var` 在展开后会被**按 IFS 词分割**（默认空格/Tab/换行），还会做 **glob 路径展开**——如果 `var="my file.txt"`，`rm $var` 会变成 `rm my file.txt`（删两个文件！）。加双引号 `rm "$var"` 才安全。

### 参数展开全家桶

```bash
path="/data/log/app.log"

${#path}              # 长度：18
${path:6:3}           # 子串：从偏移 6 取 3 字符 → "log"
${path%.log}          # 去最短后缀 → /data/log/app
${path%%.*}           # 去最长后缀（贪婪）→ /data/log/app
${path#/}             # 去最短前缀 → data/log/app.log
${path##*/}           # 去最长前缀 → app.log（取文件名！）
${path/log/LOG}       # 替换首个 → /data/LOG/app.log
${path//g/G}          # 替换全部 → /data/loG/app.loG
${path^^}             # 转大写 → /DATA/LOG/APP.LOG
${var:-default}       # var 未设或空 → 用 default（不修改 var）
${var:=default}       # var 未设或空 → 用 default 并赋值给 var
${var:+set}           # var 已设且非空 → 用 set（否则空）
```

这套字符串操作是 Bash 脚本的"瑞士军刀"——取文件名、改后缀、给默认值，无需调 `sed`/`awk`/外部命令，效率高且不 fork。

### 数组

```bash
# 普通数组（下标整数）
arr=(apple banana cherry)
arr[3]="date"
echo "${arr[1]}"        # banana
echo "${arr[@]}"        # apple banana cherry date（全部）
echo "${#arr[@]}"       # 4（元素个数）
for item in "${arr[@]}"; do echo "$item"; done   # 遍历（加引号防空格！）

# 关联数组（Bash 4+，macOS 自带 3.2 没有）
declare -A config=(
    [host]="localhost"
    [port]="8080"
)
echo "${config[host]}"   # localhost
echo "${!config[@]}"     # host port（所有键）
```

⚠️ **`$arr` 只取第一个元素** `${arr[0]}`——取全部必须 `${arr[@]}`。这是 Bash 数组最常见的坑。

## 二、命令替换与算术

```bash
# 命令替换：把命令的 stdout 嵌入字符串
now=$(date +%Y-%m-%d)            # ✅ 推荐：可嵌套、可读
files_count=$(ls | wc -l)
backticks=`date +%F`             # ❌ 反引号：不可嵌套、视觉混淆

# 算术展开
total=$((price * qty))           # $(( )) 取值
(( count++ ))                    # (( )) 命令：自增（修改变量）
(( i < 10 )) && echo "小"         # 用作条件（非0退出码为真）
```

- **算术里变量不加 `$`**：`$((a + b))` 而非 `$a + $b`（虽然加 `$` 也行，但裸名更清晰）。
- **浮点不支持**：`$((1/3))` 得 0（整除）。要浮点用 `bc`：`echo "scale=2; 1/3" | bc` → `.33`。

## 三、管道：Unix 哲学的化身

管道把多个小程序串成数据流水线——每个程序做一件小事，组合起来能力惊人：

```bash
# 经典：找出 nginx 日志里访问量前 10 的 URL
awk '{print $7}' access.log \    # 取第 7 列（URL）
  | sort \                        # 排序（为 uniq 计数做准备）
  | uniq -c \                     # 去重并计数
  | sort -rn \                    # 按计数降序
  | head -10                      # 取前 10
```

- **管道是内核缓冲区**：左进程 stdout → 内核 pipe buffer → 右进程 stdin，无需临时文件，进程间并发流式处理。
- **子 shell 陷阱**：管道每段跑在独立子 shell，**赋值不外泄**：

```bash
echo "hello" | read word
echo "$word"   # 空！read 在子 shell 里赋值，外层拿不到

# 解法 1：here-string（在当前 shell 的 read）
read word <<< "hello"
# 解法 2：shopt -s lastpipe + 脚本非交互模式
```

- **`pipefail`**：默认管道的退出码只看**最后一段**——前面段全挂了也不报错。`set -o pipefail` 让退出码取第一个非 0 的，是健壮脚本的必备。
- **`tee`**：T 型分流——既写到文件又继续往下传：`cmd | tee log.txt | grep error`。

## 四、重定向：掌控输入输出

文件描述符（FD）是进程打开文件的句柄。每个进程默认有 3 个：0（stdin）、1（stdout）、2（stderr）。

```bash
# 基本重定向
cmd > out.txt              # stdout 覆盖写 out.txt
cmd >> out.txt             # stdout 追加
cmd < in.txt               # 从 in.txt 读 stdin
cmd 2> err.txt             # stderr 写 err.txt
cmd > all.txt 2>&1         # 先重定向 stdout 到 all.txt，再让 stderr 跟随 → 合并
cmd &> all.txt             # Bash 4+ 简写：合并 stdout+stderr
cmd 2>/dev/null            # 丢弃错误（只看正常输出）
cmd > /dev/null 2>&1       # 全丢弃（只看退出码）

# 追加与覆盖的细节
set -o noclobber           # 开启后 > 不允许覆盖已存在文件（防误删），需用 >| 强制
```

⚠️ **`2>&1` 的顺序**：重定向是**从左到右**解析的。`cmd 2>&1 > file` 是错的——它先把 stderr 指向当前 stdout（屏幕），再把 stdout 指向 file，结果 stderr 还是去屏幕。正确写法是 `cmd > file 2>&1`（先 stdout 去 file，再 stderr 跟随它）。

### here-doc 与 here-string

```bash
# here-doc：多行文本注入 stdin（EOF 可换任意标记，加引号则不展开变量）
cat << 'EOF' > config.txt
host=localhost
port=${PORT}        # 引号 EOF → 原样输出 ${PORT}
EOF

cat << EOF > config.txt
port=${PORT}        # 无引号 EOF → 展开变量
EOF

# here-string：单行注入 stdin（常配合 read）
grep error <<< "$log_line"
```

### 进程替换

```bash
# <(cmd) 把命令输出当成一个临时文件路径
diff <(ls dir1) <(ls dir2)        # 比较两个目录的文件列表
wc -l <(curl -s http://api/x)      # 直接统计远程响应行数
```

进程替换在需要一个**文件路径**而非 stdin 的场景（如 `diff`、`comm`）特别有用——比先存临时文件再删优雅得多。

## 五、条件、循环、函数的工程写法

```bash
#!/usr/bin/env bash
set -euo pipefail    # 严苛三件套（详见服务器场景叶）

# 健壮的参数解析
usage() { echo "Usage: $0 [-f file] [-n count] args..." >&2; exit 1; }

while getopts ":f:n:h" opt; do
    case "$opt" in
        f) file="$OPTARG" ;;
        n) count="$OPTARG" ;;
        h) usage; exit 0 ;;
        \?) echo "未知选项: -$OPTARG" >&2; usage ;;
        :)  echo "选项 -$OPTARG 需要参数" >&2; usage ;;
    esac
done
shift $((OPTIND - 1))    # 移除已解析的选项，剩余是位置参数

# 函数：封装 + 复用
backup_file() {
    local src="$1"
    local dest="${src}.$(date +%s).bak"
    cp -v "$src" "$dest" || { echo "备份失败" >&2; return 1; }
    echo "已备份到 $dest"
}

backup_file /etc/hosts
```

- **`getopts`**：Bash 内建的选项解析器（只支持短选项 `-f`，不支持 GNU 风格 `--file`）。复杂 CLI 用 `getopt`（外部命令）或干脆上 Python。
- **`local`**：函数内变量必加 `local`，否则污染全局。
- **`return` vs `exit`**：函数里 `return N` 只退出函数（返回退出码），`exit N` 会终止整个脚本。

## 下一步

掌握了脚本语法与管道重定向后，下一步进入[服务器场景与对比](./server-usage)——为什么 Bash 是服务器默认 shell、如何写健壮的生产级脚本、与 Zsh/Fish 有何差异。
