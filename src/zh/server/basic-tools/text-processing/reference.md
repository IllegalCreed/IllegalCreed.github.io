---
layout: doc
outline: [2, 3]
---

# 参考：工具速查、正则与易错点

> 基于 Linux 文本处理工具链 · 核于 2026-08

## 速查

- **三剑客**：`grep`（按行过滤）、`sed`（按行替换）、`awk`（按列处理）。
- **grep**：`-i`（忽略大小写）、`-v`（反向）、`-n`（行号）、`-r`（递归）、`-c`（计数）、`-E`（扩展正则）、`-A/-B/-C N`（前后文）。
- **sed**：`s/旧/新/g`（替换）、`-i`（改原文件）、`d`（删行）、`-n '/p/p'`（只打印匹配）、`-E`（扩展正则）。
- **awk**：`{print $1}`（第1列）、`-F:`（分隔符）、`$NF`（末列）、`NR`（行号）、`NF`（列数）、`{sum+=$1} END{print sum}`（求和）。
- **列工具**：`cut -d: -f1`、`sort -n -r -k2`、`uniq -c`（需先 sort）、`head/tail -n N`、`tail -f`、`wc -l`。
- **jq**：`.字段`、`[N]`、`[]`（遍历）、`|`（管道）、`-r`（原始字符串）、`select(条件)`、`length`、`keys`。
- **正则**：`.` 任意、`*` 0+次、`+` 1+次（ERE）、`?` 0/1次、`[]` 字符集、`^/$` 行首尾、`\d \w \s`。
- **基本 vs 扩展正则**：BRE 的 `+?(){}|` 要转义；ERE（`grep -E`/`sed -E`/`awk`）直接用。
- **管道**：`|` 连接 stdout→stdin；`>` 覆盖、`>>` 追加、`<` 读入、`2>&1` 错误并入输出。

## 一、文本工具速查表

| 工具 | 作用 | 高频用法 |
| --- | --- | --- |
| `grep` | 按行过滤 | `grep -in "error" log` / `-v` 反向 / `-r` 递归 / `-E` 扩展正则 |
| `sed` | 按行替换 | `sed 's/old/new/g' f` / `-i` 改原文件 / `d` 删行 |
| `awk` | 按列处理 | `awk '{print $1}'` / `-F:` 分隔 / `{sum+=$1} END{print sum}` |
| `cut` | 取列 | `cut -d: -f1`（分隔取列）/ `-c1-10`（按字符） |
| `sort` | 排序 | `-n`（数字）/ `-r`（降序）/ `-k2`（按第2列）/ `-t:`（分隔） |
| `uniq` | 去重 | `-c`（计数）/ `-d`（只显重复）；**需先 sort** |
| `head` | 取头部 | `-n 10`（前10行） |
| `tail` | 取尾部 | `-n 20` / `-f`（实时跟踪） |
| `wc` | 计数 | `-l`（行）/ `-w`（词）/ `-c`（字节） |
| `less` | 分页查看 | `/` 搜索、`j/k` 翻行、`q` 退出 |
| `cat` | 输出/合并 | `cat a` / `cat a b > c` |
| `jq` | JSON 处理 | `.字段` / `[]` 遍历 / `-r` 原始 / `select()` 过滤 |
| `tr` | 字符转换 | `tr 'a-z' 'A-Z'`（小写转大写）/ `-d` 删除字符 |

## 二、grep 速查

```
grep "error" log              # 含 error 的行
grep -i "ERROR" log           # 忽略大小写
grep -v "debug" log           # 不含 debug 的行（反向）
grep -n "warn" log            # 显示行号
grep -c "error" log           # 匹配行数
grep -r "TODO" src/           # 递归搜索目录
grep -E "error|warning" log   # 扩展正则（error 或 warning）
grep -A 3 "error" log         # 匹配行 + 后 3 行
grep -B 2 "error" log         # 匹配行 + 前 2 行
grep -C 5 "error" log         # 匹配行 + 前后各 5 行
grep -E "^[0-9]+" log         # 以数字开头的行
grep -E "\.log$" *            # 文件名以 .log 结尾（在文件内容里搜）
```

## 三、sed 速查

```
sed 's/old/new/' f            # 每行第一个 old 换 new
sed 's/old/new/g' f           # 每行所有 old 换 new（g 全局）
sed 's/old/new/gi' f          # 忽略大小写（i）
sed -i 's/old/new/g' f        # 直接改原文件（危险！）
sed -i.bak 's/old/new/g' f    # 改原文件 + 备份 .bak
sed -n '10,20p' f             # 打印第 10-20 行
sed '/debug/d' f              # 删除含 debug 的行
sed '5d' f                    # 删除第 5 行
sed -E 's/([0-9]+)/[\1]/' f   # 扩展正则 + 反向引用（数字加方括号）
sed 's|/usr/local|/opt|g' f   # 用 | 作分隔符（路径含 / 时方便）
```

## 四、awk 速查

```
awk '{print $1}' f                # 第 1 列
awk '{print $1, $3}' f            # 第 1、3 列
awk -F: '{print $1}' /etc/passwd  # 冒号分隔，第 1 列（用户名）
awk -F, '{print $2}' data.csv     # CSV 第 2 列
awk '{print $NF}' f               # 最后一列
awk '{print $(NF-1)}' f           # 倒数第 2 列
awk 'NR==10' f                    # 第 10 行
awk 'NR>=10 && NR<=20' f          # 第 10-20 行
awk 'END{print NR}' f             # 总行数
awk '{sum+=$1} END{print sum}' f  # 第 1 列求和
awk '$3 > 100' f                  # 第 3 列 > 100 的行
awk -F: '$3 >= 1000 {print $1}' /etc/passwd  # UID>=1000 的用户
awk '{count[$1]++} END{for(k in count) print k, count[k]}' f  # 按第1列分组计数
```

**awk 内建变量**：

| 变量 | 含义 |
| --- | --- |
| `$0` | 当前整行 |
| `$1` `$2` ... `$N` | 第 N 个字段（列） |
| `NF` | 当前行的字段数（Number of Fields） |
| `$NF` | 最后一个字段 |
| `NR` | 当前行号（Number of Records，所有文件累计） |
| `FNR` | 当前文件内的行号 |
| `FS` | 字段分隔符（默认空白，可用 `-F` 设） |
| `OFS` | 输出字段分隔符（默认空格） |
| `RS` | 输入记录分隔符（默认换行） |
| `FILENAME` | 当前文件名 |

## 五、jq 速查

```
echo '{"name":"a","age":30}' | jq '.name'        # 取字段 → "a"
echo '...' | jq -r '.name'                         # 原始字符串（无引号）→ a
cat f.json | jq '.'                                # 格式化美化
cat f.json | jq '.users[0]'                        # 数组第 1 个
cat f.json | jq '.users[].name'                    # 遍历取 name
cat f.json | jq '.users | length'                  # 数组长度
cat f.json | jq '[.items[].price] | add'           # 求和
cat f.json | jq '.users[] | select(.age>18)'       # 过滤
cat f.json | jq 'keys'                             # 顶层键名
cat f.json | jq '.users | map(.name)'              # 映射提取
cat f.json | jq 'sort_by(.age)'                    # 按字段排序
cat f.json | jq 'group_by(.city)'                  # 分组
```

## 六、正则元字符速查

| 元字符 | 含义 | BRE | ERE |
| --- | --- | --- | --- |
| `.` | 任意单字符 | ✅ | ✅ |
| `*` | 前一字符 0+ 次 | ✅ | ✅ |
| `+` | 前一字符 1+ 次 | `\+` | `+` |
| `?` | 前一字符 0/1 次 | `\?` | `?` |
| `[]` | 字符集 | ✅ | ✅ |
| `^` | 行首 | ✅ | ✅ |
| `$` | 行尾 | ✅ | ✅ |
| `()` | 分组 | `\(\)` | `()` |
| `{m,n}` | 重复次数 | `\{m,n\}` | `{m,n}` |
| `\|` | 或 | `\|` | `\|`（grep -E 是 `|`） |
| `\d` | 数字（部分） | — | — |
| `\w` | 字母数字下划线 | — | — |
| `\b` | 单词边界 | `\b` | ✅ |

**字符集简写**：`[0-9]`（数字）、`[a-z]`（小写）、`[A-Za-z]`（字母）、`[^0-9]`（非数字，^ 在 [] 内表「非」）。

## 七、易错点清单

- **「`uniq` 能去重所有重复行」**：错。`uniq` 只去重**相邻**的重复行。要先 `sort` 排序让重复行相邻，再 `uniq`。正确：`sort | uniq`。
- **「`sed -i` 安全可随便用」**：危险。`-i` 直接改原文件，没备份。建议先不带 `-i` 预览，或用 `sed -i.bak`（自动备份 .bak 文件）。
- **「`grep "a.b"` 匹配 a + 任意 + b」**：对，但别忘 `.` 是元字符。要匹配字面 `.` 要转义 `\.`（如 `\.log$` 匹配以 .log 结尾）。
- **「`sed 's/a/b/'` 替换所有」**：错。不加 `g` 只替换每行**第一个**匹配。要全部替换加 `g`（`s/a/b/g`）。
- **「awk 的 `$1` 是第一个字符」**：错。`$1` 是第一个**字段（列）**，按分隔符切分后的第 1 列。第一个字符是 `substr($1,1,1)` 或 `cut -c1`。
- **「基本正则和扩展正则一样」**：错。BRE 的 `+?(){}|` 要转义（`\+`）；ERE（`grep -E`/`sed -E`）直接用。混用会出错。
- **「`cat` 大文件没问题」**：错。`cat` 一次性输出全部，大文件刷屏且占内存。大文件用 `less`（分页）或 `head`/`tail`。
- **「`tail -f` 跟踪所有变化」**：`tail -f` 跟踪文件追加，但文件被 rotate（重命名+新建）时会跟丢，要 `tail -F`（大写，跟踪文件名重新打开）。

## 八、进阶方向（链接其他叶）

- [文件系统与基础命令](../filesystem-commands/) —— `find` 找文件、管道喂给 `grep`/`sed`
- [进程管理与服务](../process-services/) —— `ps`/`journalctl` 输出用 `grep`/`awk` 处理
- [Bash](../bash/)（如有）—— 把文本处理组合成脚本

## 权威链接

- [grep(1) man page](https://man7.org/linux/man-pages/man1/grep.1.html)
- [sed(1) man page](https://man7.org/linux/man-pages/man1/sed.1.html)
- [awk(1) man page](https://man7.org/linux/man-pages/man1/awk.1p.html)
- [jq manual](https://stedolan.github.io/jq/manual/)
- [Regular Expression - Wikipedia](https://en.wikipedia.org/wiki/Regular_expression)
- 本站幻灯片：<a href="/SlideStack/text-processing-slide/" target="_blank">文本处理</a>
