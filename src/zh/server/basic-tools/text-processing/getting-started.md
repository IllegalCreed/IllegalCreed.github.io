---
layout: doc
outline: [2, 3]
---

# 入门：三剑客、正则与管道

> 基于 Linux 文本处理工具链 · 核于 2026-08

## 速查

- **Unix 哲学**：每个工具做一件事做好（`grep` 过滤、`sed` 替换、`awk` 列处理、`sort` 排序），通过**管道 `|`** 串成数据流水线——一个命令的输出是下一个的输入。
- **三剑客定位**：`grep`（**按行过滤**——找含某模式的行）、`sed`（**按行替换/编辑**——流编辑器，改文本）、`awk`（**按列处理**——擅长分隔符切列、统计计算）。
- **`grep`**：`grep "error" log`（找含 error 的行）、`-i`（忽略大小写）、`-v`（反向，不含的）、`-n`（显示行号）、`-r`（递归目录）、`-c`（计数）、`-E`（扩展正则）、`-A/-B/-C N`（匹配行的后/前/前后 N 行）。
- **`sed`**：`sed 's/old/new/g' f`（全文替换 old 为 new）、`-i`（直接改原文件）、`s`（替换）、`g`（全局，一行所有）、`d`（删行）、`-n '/pattern/p'`（只打印匹配行）。
- **`awk`**：按分隔符切列。`awk '{print $1}'`（打印第一列）、`-F:`（指定冒号分隔）、`$0`（整行）、`$NF`（最后一列）、`NR`（行号）、`NF`（列数）、`awk '{sum+=$1} END{print sum}'`（求和）。
- **列工具**：`cut -d: -f1`（按分隔符取列）、`sort`（排序）、`uniq`（去重，需先 sort）、`head -n 10`（前 10 行）、`tail -n 20`（后 20 行）、`tail -f log`（实时跟踪）、`less`（分页查看）、`cat`（输出全文/合并）。
- **`jq`**：JSON 处理利器。`jq '.' f.json`（格式化）、`jq '.name'`（取字段）、`jq '.items[]'`（遍历数组）、`jq '.[] | .price'`（管道）、`-r`（输出原始字符串不带引号）。
- **正则基础**：`.`（任意单字符）、`*`（前一个 0 次或多次）、`+`（1 次或多次，扩展正则）、`?`（0 或 1 次）、`[]`（字符集 `[aeiou]`/`[0-9]`）、`^`（行首）、`$`（行尾）、`\d`（数字，部分工具）、`\w`（字母数字下划线）。
- **基本 vs 扩展正则**：基本正则（BRE）的 `+`/`?`/`|`/`()` 要转义（`\+`）；扩展正则（ERE，`grep -E`/`sed -E`/`awk`）直接用。日常优先扩展正则。
- **进阶顺序**：[grep / sed / awk 详解](./guide-line/grep-sed-awk) → [jq 与管道组合](./guide-line/jq-and-pipelines) → [参考](./reference)。

## 一、Unix 哲学：小工具与管道

Linux 文本处理的精髓是 **Unix 哲学**：每个工具只做一件事，做到极致，然后通过**管道（pipe，`|`）**把它们组合起来。管道把一个命令的**标准输出**接到下一个命令的**标准输入**，形成数据流水线：

```
cat access.log           # 1. 读取日志
  | grep "404"           # 2. 过滤含 404 的行
  | awk '{print $1}'     # 3. 取第一列（IP）
  | sort                 # 4. 排序
  | uniq -c              # 5. 去重并计数
  | sort -rn             # 6. 按计数降序
  | head -n 10           # 7. 取前 10
```

这一行管道完成「统计 access.log 中 404 错误最多的前 10 个 IP」——如果用 Python 写要十几行。每个工具（`cat`/`grep`/`awk`/`sort`/`uniq`/`head`）都是独立的小程序，各司其职，组合起来却无比强大。

- **标准流**：每个进程有三个标准流——stdin（标准输入，fd 0）、stdout（标准输出，fd 1）、stderr（标准错误，fd 2）。管道连接的是 stdout → stdin。
- **重定向**：`>` 写入文件（覆盖）、`>>` 追加、`<` 从文件读输入、`2>` 重定向错误、`2>&1` 错误并入输出。
- **过滤而非读取**：管道里的工具通常是「过滤器」——读一行处理一行输出一行，不需要把整个文件读入内存，所以能处理几 GB 的大日志。

## 二、grep：按行过滤

`grep`（Global Regular Expression Print）按**正则模式**过滤行——输入中匹配模式的行被输出，不匹配的被丢弃。它是最常用的文本工具。

```
grep "error" log.txt              # 找含 error 的行
grep -i "ERROR" log.txt           # 忽略大小写（含 error/Error/ERROR）
grep -v "debug" log.txt           # 反向：不含 debug 的行
grep -n "warning" log.txt         # 显示行号
grep -c "error" log.txt           # 只输出匹配行数
grep -r "TODO" src/               # 递归搜索目录下所有文件
grep -E "error|warning" log.txt   # 扩展正则（支持 | 或）
grep -A 3 "error" log.txt         # 匹配行 + 后 3 行（After）
grep -B 2 "error" log.txt         # 匹配行 + 前 2 行（Before）
grep -C 5 "error" log.txt         # 匹配行 + 前后各 5 行（Context）
```

`grep` 默认用**基本正则**（BRE），`+`/`?`/`|`/`()` 要转义；`grep -E`（或 `egrep`）用**扩展正则**（ERE），直接用，更方便。日常推荐 `grep -E`。

## 三、sed：按行替换

`sed`（Stream Editor）是**流编辑器**——按行读取输入，对每行执行编辑命令（替换、删除、插入），输出结果。最常用的是**替换（substitute，`s`）**：

```
sed 's/old/new/' f.txt            # 每行第一个 old 替换为 new
sed 's/old/new/g' f.txt           # 每行所有 old 替换为 new（g = global）
sed 's/old/new/gi' f.txt          # 忽略大小写（i）
sed -i 's/old/new/g' f.txt        # 直接修改原文件（-i，危险！先备份）
sed -i.bak 's/old/new/g' f.txt    # 修改并备份原文件为 f.txt.bak
sed -n '10,20p' f.txt             # 只打印第 10-20 行
sed '/pattern/d' f.txt            # 删除含 pattern 的行（d = delete）
sed '5d' f.txt                    # 删除第 5 行
sed -E 's/([0-9]+)/\1/' f.txt     # 扩展正则 + 反向引用（\1 引用第一个分组）
```

- `s/旧/新/` 是替换命令，三段用 `/` 分隔（也可用其他分隔符如 `s|旧|新|`，路径含 / 时方便）。
- `g` 标志表示「一行内全部替换」（不加 g 只换每行第一个匹配）。
- `-i` 直接改原文件——**危险**，建议先不带 `-i` 预览输出，确认无误再加 `-i`，或用 `-i.bak` 自动备份。

## 四、awk：按列处理

`awk` 是最强的列处理工具（也是一门小语言），擅长按分隔符把每行切成字段（列），然后对各列做处理、统计、计算：

```
awk '{print $1}' f.txt            # 打印每行第一列（默认空白分隔）
awk '{print $1, $3}' f.txt        # 打印第 1、3 列
awk -F: '{print $1}' /etc/passwd  # 以冒号分隔，打印第 1 列（用户名）
awk -F, '{print $2}' data.csv     # CSV 文件，取第 2 列
awk '{print $NF}' f.txt           # 打印最后一列（NF 是列数，$NF 是最后一列）
awk 'NR==10' f.txt                # 打印第 10 行（NR 是行号）
awk 'NR>=10 && NR<=20' f.txt      # 打印第 10-20 行
awk '{sum+=$1} END{print sum}' f  # 第一列求和
awk '{sum+=$1; count++} END{print sum/count}' f  # 第一列平均值
awk '$3 > 100' f.txt              # 第 3 列大于 100 的行（条件过滤）
awk -F: '$3 >= 1000 {print $1}' /etc/passwd  # UID>=1000 的普通用户
```

**awk 内建变量**：`$0`（整行）、`$1`/`$2`/...（第几列）、`NF`（当前行列数）、`NR`（当前行号）、`FS`（字段分隔符，可用 `-F` 设）、`OFS`（输出分隔符）。`awk '条件 {动作}'`——条件满足时执行动作，可省略条件（每行都执行）或动作（默认打印整行 `$0`）。

## 五、列处理工具组合

除了三剑客，还有一组小工具常在管道里组合：

- **`cut`**：按分隔符或位置切列。`cut -d: -f1 /etc/passwd`（冒号分隔取第 1 列）、`cut -c1-10`（每行第 1-10 字符）。
- **`sort`**：排序。`sort`（字典序）、`-n`（数字序）、`-r`（降序）、`-k2`（按第 2 列）、`-t:`（冒号分隔）。
- **`uniq`**：去重相邻的重复行（**必须先 sort**，否则不相邻的重复去不掉）。`uniq`（去重）、`-c`（计数）、`-d`（只显示重复的）。
- **`head`/`tail`**：取头部/尾部。`head -n 10`（前 10 行）、`tail -n 20`（后 20 行）、`tail -f log`（实时跟踪文件追加）。
- **`wc`**：计数。`wc -l`（行数）、`-w`（词数）、`-c`（字节数）。
- **`less`**：分页查看大文件（按 `j/k` 翻行、`/` 搜索、`q` 退出，比 `cat` 友好）。
- **`cat`**：输出全文（小文件）/合并文件（`cat a b > c`）。大文件别用 `cat`（刷屏），用 `less`。

## 六、jq：JSON 处理利器

现代运维离不开 JSON（API 响应、配置文件、容器 inspect 输出）。`jq` 是命令行 JSON 处理工具，用类 awk 的语法查询和变换 JSON：

```
echo '{"name":"alice","age":30}' | jq '.name'        # 取字段 → "alice"
echo '{"name":"alice","age":30}' | jq -r '.name'     # -r 原始字符串（不带引号）→ alice
curl -s api/users | jq '.'                             # 格式化美化 JSON
curl -s api/users | jq '.users[0]'                     # 取数组第一个
curl -s api/users | jq '.users[].name'                 # 遍历数组取每个的 name
curl -s api/users | jq '.users | length'               # 数组长度
curl -s api/items | jq '[.items[] | .price] | add'     # 所有 price 求和
curl -s api/users | jq '.users[] | select(.age>18)'    # 过滤（age>18 的）
curl -s api/users | jq 'keys'                          # 顶层键名
```

`jq` 的 `.` 是当前对象、`.字段` 取字段、`[N]` 取数组元素、`[]` 遍历数组、`|` 是 jq 内部管道（类似 awk）。`-r` 输出原始字符串（不带 JSON 引号，便于在 shell 管道里继续用）。

## 七、正则表达式基础

三剑客都依赖**正则表达式**（regular expression）描述匹配模式。基础元字符：

| 元字符 | 含义 | 示例 |
| --- | --- | --- |
| `.` | 任意单个字符 | `a.c` 匹配 abc/axc/a1c |
| `*` | 前一个字符 0 次或多次 | `ab*c` 匹配 ac/abc/abbc |
| `+` | 前一个字符 1 次或多次（ERE） | `ab+c` 匹配 abc/abbc（不含 ac） |
| `?` | 前一个字符 0 或 1 次（ERE） | `colou?r` 匹配 color/colour |
| `[]` | 字符集（任选其一） | `[aeiou]` 元音、`[0-9]` 数字、`[^0-9]` 非数字 |
| `^` | 行首 | `^error` 以 error 开头 |
| `$` | 行尾 | `\.log$` 以 .log 结尾 |
| `()` | 分组（ERE） | `(ab)+` 匹配 ab/abab |
| `\|` | 或（ERE 是 `\|`，grep -E 是 `\|`） | `cat\|dog` 匹配 cat 或 dog |
| `\d` | 数字（部分工具/Perl 正则） | `\d+` 等价 `[0-9]+` |
| `\w` | 字母数字下划线 | `\w+` 单词 |
| `\s` | 空白字符 | 空格/制表符 |

**基本正则（BRE）vs 扩展正则（ERE）**：BRE 里 `+`/`?`/`()`/`{}`/`|` 是普通字符，要用要转义（`\+`/`\?`/`\(\)`）；ERE（`grep -E`/`sed -E`/`awk`）直接用。日常推荐 ERE（`grep -E`、`sed -E`），少写反斜杠。

## 下一步

理解了三剑客、正则与管道的全貌后，下一步深入两块——[grep / sed / awk 详解](./guide-line/grep-sed-awk)（三剑客的高频用法与正则实战）与[jq 与管道组合](./guide-line/jq-and-pipelines)（`jq` 处理 JSON、列工具组合的实战流水线）。
