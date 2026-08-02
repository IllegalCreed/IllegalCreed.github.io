---
layout: doc
outline: [2, 3]
---

# 入门：Bash 定义、变量、管道与流程控制

> 基于 GNU Bash · 核于 2026-08

## 速查

- **Bash 是什么**：GNU 项目的**自由 Shell**（Bourne Again SHell），既是**命令解释器**又是**脚本语言**。是 **POSIX shell（sh）的超集**——兼容 `sh` 语法，又新增数组、`[[ ]]`、历史、进程替换。**Linux 服务器的事实默认 shell**。
- **两大职责**：①**交互式**（REPL：读取-解析-执行-打印）；②**脚本式**（执行 `.sh` 文件，把命令序列化、参数化、流程化）。
- **变量**：`name=value` 赋值（**等号两边不能有空格**），`$name` 或 `${name}` 取值。`export` 升为环境变量（子进程可见）。无类型——全是字符串（`a=1+1` 是字符串 `"1+1"`，算术要用 `$(( ))`）。
- **特殊变量**：`$?`（上一条退出码，0 成功）、`$#`（参数个数）、`$1`/`$2`...（位置参数）、`$@`（所有参数，加引号独立）、`$*`（所有参数拼成一个串）、`$$`（当前 PID）、`$!`（最近后台 PID）。
- **四种展开**：**参数展开** `${var}`、**命令替换** `$(cmd)` 或反引号、**算术展开** `$((1+2))`、**路径展开（glob）** `*.txt`（`*`/`?`/`[abc]`）。
- **管道 `|`**：把左侧命令的**标准输出**接到右侧命令的**标准输入**——`cmd1 | cmd2 | cmd3`。是 Unix 哲学的核心：小程序协作。
- **重定向**：`>` 覆盖输出、`>>` 追加、`<` 输入、`2>` 错误输出、`2>&1` 合并错误到标准输出、`/dev/null` 黑洞。文件描述符：0=stdin、1=stdout、2=stderr。
- **退出码**：每条命令返回 0-255 的退出码，**0=成功**，非 0=失败。`&&`（成功才执行下一条）、`||`（失败才执行）。`cmd1 && cmd2 || cmd3` 是常见三元。
- **条件**：`if cmd; then ...; elif cmd; then ...; else ...; fi`。测试用 `[[ ]]`（Bash 增强，支持 `&&`/`||`/模式匹配）或 `[ ]`（POSIX 兼容）。
- **循环**：`for x in a b c; do ...; done`（遍历列表）、`for ((i=0;i<n;i++)); do ...; done`（C 风格）、`while cmd; do ...; done`（条件为真循环）、`until`（为假循环）。
- **函数**：`f(){ ...; }` 或 `function f{ ...; }`。参数用 `$1`/`$@`（与脚本一致）。`local x` 声明局部变量（否则是全局）。`return N` 返回退出码（不是返回值）。
- **进阶顺序**：[脚本编程与管道](./guide-line/scripting-and-pipeline) → [服务器场景与对比](./guide-line/server-usage) → [参考](./reference)。

## 一、Bash 是什么：解释器 + 脚本语言

Shell 是用户与操作系统内核之间的**命令层**——读入用户键入的文本命令，解析后调用内核 syscall（fork/exec）执行程序。Bash 是 GNU 项目（1989 年 Brian Fox 创建）为替代受限的 Bourne shell（`sh`）而做的**自由实现**，名字 Bourne Again SHell 是双关：既是 "Bourne 之再临"，也谐音 "born-again"（重生）。

Bash 有两种工作模式：

1. **交互式（Interactive）**：登录服务器后看到的提示符 `$`（普通用户）或 `#`（root）就是 Bash 的 REPL。你敲一行、它执行一行、显示结果、等下一行——读历史（上下方向键）、行编辑（Ctrl-A/E/W/K）、补全（Tab）都开。
2. **脚本式（Script）**：把一系列命令写进 `.sh` 文件，用 `bash script.sh` 一次性执行。脚本支持变量、条件、循环、函数——是一门完整的（虽然简陋的）编程语言。

一句话：**Bash 既是 REPL 又是脚本语言，是 Linux 服务器的"通用语"。**

## 二、变量与展开

Bash **变量无类型**——一切都是字符串（除非用 `declare -i` 声明整数，或 `$(( ))` 做算术）。赋值和取值的语法是 Bash 最易踩坑的地方：

```bash
name="Alice"        # ✅ 赋值：等号两边绝不能有空格
name = "Alice"      # ❌ 会把 name 当命令执行，报 command not found

echo $name          # 取值：$ 前缀（推荐 ${name}，避免歧义）
echo "$greeting, $name!"   # 双引号会展开变量
echo '$name'        # 单引号：原样输出，不展开

export PATH="$PATH:/opt/bin"   # export：升为环境变量，子进程可见
```

- **赋值无空格**：`a=1` 对，`a = 1` 错——Bash 把 `a` 当命令名。
- **引号规则**：**双引号** `"$var"` 展开变量但保护空格（**总是加双引号**，防词分割与 glob）；**单引号** `'$var'` 完全原样（写正则/字面量用）。
- **四种展开**：

| 展开 | 语法 | 例子 |
| --- | --- | --- |
| 参数展开 | `$var` / `${var:-default}` | `${count:-0}`（count 未设则用 0） |
| 命令替换 | `$(cmd)` 或 `` `cmd` `` | `now=$(date +%F)`（推荐 `$()`，可嵌套） |
| 算术展开 | `$((expr))` | `total=$((a + b))` |
| 路径展开 | `*` `?` `[abc]` | `*.txt` 匹配所有 .txt 文件 |

- **特殊变量**（脚本编程高频）：

| 变量 | 含义 |
| --- | --- |
| `$?` | 上一条命令的退出码（0=成功） |
| `$#` | 位置参数个数 |
| `$1` `$2` ... | 第 1、2... 个位置参数；`$0` 是脚本名 |
| `$@` | 所有位置参数（**加引号 `" "$@"` 每个独立**） |
| `$*` | 所有位置参数拼成一个字符串（用 IFS 分隔） |
| `$$` | 当前 shell 的 PID |
| `$!` | 最近一个后台进程的 PID |

## 三、管道与重定向

**管道 `|`** 是 Unix 哲学的化身——把左侧命令的**标准输出**作为右侧命令的**标准输入**，让多个单一职责的小工具协作完成复杂任务：

```bash
# 找出访问量前 10 的 IP（经典日志分析）
cat access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# 统计 .py 文件总行数
find . -name '*.py' | xargs wc -l | tail -1
```

- **本质**：内核为管道分配一块缓冲区，左侧进程的 stdout 写入、右侧进程的 stdin 读出——无需中间临时文件。
- **子shell 陷阱**：管道的每一段都跑在**独立子 shell**里，所以在管道里给变量赋值，外层拿不到：`echo hi | read x; echo $x`（x 为空）。要用 `<<<` 或进程替换。

**重定向**改变命令的输入/输出走向。文件描述符（FD）：0=stdin、1=stdout、2=stderr。

```bash
cmd > out.log          # stdout 覆盖写入 out.log
cmd >> out.log         # stdout 追加
cmd < input.txt        # 以 input.txt 作为 stdin
cmd 2> err.log         # stderr 写入 err.log
cmd > all.log 2>&1     # 合并 stdout 与 stderr 到 all.log（顺序重要：先重定向 stdout，再让 stderr 跟它走）
cmd &> all.log         # Bash 4+ 简写：合并 stdout+stderr
cmd > /dev/null 2>&1   # 丢弃所有输出（黑洞）
```

- **`/dev/null`** 是特殊设备文件，写入即丢弃——常用于"只关心退出码不关心输出"的场景。
- **进程替换** `<(cmd)`：把命令输出当成临时文件路径传给另一命令——`diff <(ls dir1) <(ls dir2)` 比较两个目录。

## 四、退出码与条件判断

每条命令执行后返回 **0-255 的退出码**：**0 表示成功**，非 0 表示失败（具体含义因程序而异，常见 1=一般错误、2=用法错误、126=不可执行、127=命令未找到、128+N=被信号 N 杀死）。

```bash
mkdir /opt/app && echo "创建成功"      # && ：左侧成功才执行右侧
mkdir /opt/app || exit 1              # || ：左侧失败才执行右侧（出错即退出）
test -f /etc/hosts && echo "存在"      # test / [ ] 测试文件/字符串/数值
```

条件语句：

```bash
# if 基于命令的退出码（0=真，非0=假）
if [[ -f config.yml ]]; then
    echo "配置存在"
elif [[ -d config ]]; then
    echo "是目录"
else
    echo "不存在" >&2
    exit 1
fi

# [[ ]]（Bash 增强）vs [ ]（POSIX test）
[[ -z "$var" ]]           # 字符串为空
[[ "$var" == a* ]]        # 模式匹配（通配符，非正则）
[[ "$var" =~ ^[0-9]+$ ]]  # 正则匹配（=~ 只有 [[ 支持）
[[ -f file && -r file ]]  # 逻辑与（[ ] 里 && 要写成 -a，且会出 bug）
```

- **`[[ ]]` 推荐**：是 Bash 内建关键字（不是命令），支持模式匹配、正则、`&&`/`||`、不会因空变量词分割出错。
- **`[ ]` 兼容**：是 `test` 的别名，POSIX 可移植脚本用；但坑多（空变量 `[ $x = "" ]` 报语法错）。

## 五、循环与函数

```bash
# for 遍历列表
for f in *.txt; do
    echo "处理 $f"
done

# C 风格 for
for ((i=0; i<10; i++)); do
    echo $i
done

# while 条件循环
while [[ $# -gt 0 ]]; do
    case "$1" in
        -f) file="$2"; shift 2;;
        -h) echo "usage"; exit 0;;
        *) echo "未知参数 $1" >&2; exit 1;;
    esac
done

# 函数
greet() {
    local name="$1"     # local：否则污染全局
    echo "Hello, $name"
    return 0            # return 的是退出码（0-255），不是返回值
}

result=$(greet "World")  # 用命令替换捕获 stdout
```

- **函数返回值靠 stdout**：`return N` 只能返回退出码（0-255），要"返回字符串/数据"就 `echo` 出来再用 `$()` 捕获。
- **`local` 必加**：函数内不加 `local` 的变量都是全局的——会污染调用方作用域，是脚本 bug 重灾区。

## 下一步

理解了 Bash 的变量、管道、流程控制后，下一步深入[脚本编程与管道](./guide-line/scripting-and-pipeline)（变量展开细节、重定向文件描述符、数组、严苛模式）与[服务器场景与对比](./guide-line/server-usage)（默认 shell、shebang、与 Zsh/Fish 的差异）。
