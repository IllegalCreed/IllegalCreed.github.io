---
layout: doc
outline: [2, 3]
---

# grep / sed / awk 详解：文本三剑客与正则

> 基于 Linux 文本处理三剑客 · 核于 2026-08

## 速查

- **三剑客定位**：`grep`（**按行过滤**——找匹配模式的行）、`sed`（**按行替换/编辑**——流编辑器）、`awk`（**按列处理**——分隔符切列、统计计算）。
- **grep**：`grep -in "error" log`（忽略大小写+行号）、`-v`（反向）、`-r`（递归）、`-c`（计数）、`-E`（扩展正则）、`-A/-B/-C N`（匹配行的后/前/前后文）。
- **sed**：`sed 's/old/new/g' f`（全文替换）、`-i`（改原文件，危险）、`/pattern/d`（删匹配行）、`-n '/p/p'`（只打印匹配）、`-E`（扩展正则）、`s|/a|/b|`（用其他分隔符）。
- **awk**：`awk '{print $1}'`（第1列）、`-F:`（分隔符）、`$NF`（末列）、`NR`（行号）、`NF`（列数）、`条件 {动作}`、`{sum+=$1} END{print sum}`（聚合）。
- **正则**：`.` 任意、`*` 0+次、`+` 1+次（ERE）、`?` 0/1次、`[]` 字符集、`^/$` 行首尾、`()` 分组、`\d \w \s` 简写。
- **BRE vs ERE**：BRE 的 `+?(){}|` 要转义；ERE（`grep -E`/`sed -E`/`awk`）直接用，日常推荐 ERE。
- **管道组合**：`cat log | grep 404 | awk '{print $1}' | sort | uniq -c | sort -rn | head`（统计 Top IP）。

## 一、grep：按行过滤之王

`grep`（Global Regular Expression Print）按正则模式过滤——匹配的行输出，不匹配的丢弃。它是日志排查、代码搜索的最高频工具。

**基础用法**：

```
grep "error" log.txt              # 含 error 的行
grep -i "ERROR" log.txt           # 忽略大小写（error/Error/ERROR 都匹配）
grep -v "debug" log.txt           # 反向：不含 debug 的行
grep -n "warn" log.txt            # 显示行号
grep -c "error" log.txt           # 只输出匹配行数
grep -l "error" *.log             # 只输出含匹配的文件名
grep -r "TODO" src/               # 递归搜索目录下所有文件
```

**上下文（排障利器）**：错误日志往往需要看上下文才能定位：

```
grep -A 3 "error" log             # 匹配行 + 后 3 行（After，看错误后续）
grep -B 2 "error" log             # 匹配行 + 前 2 行（Before，看错误之前的状态）
grep -C 5 "error" log             # 匹配行 + 前后各 5 行（Context）
```

**正则匹配**：

```
grep -E "error|warning|fatal" log   # 扩展正则：匹配三者之一（| 是或）
grep -E "^[0-9]{4}-" log            # 以 4 位数字+横线开头（如 2026-）
grep -E "\.log$" *                  # 以 .log 结尾（\. 转义点）
grep -E "[Ee]rror" log              # Error 或 error（字符集）
grep -E "[0-9]+" log                # 含数字
grep -w "error" log                 # 全词匹配（不匹配 errors/errorlog）
```

- **`-E`（扩展正则）**：让 `+`/`?`/`|`/`()` 直接用，不用转义。日常推荐 `grep -E`（或 `egrep`）。
- **`-w`（全词）**：只匹配完整单词（前后是非单词字符），`error` 不匹配 `errors`。
- **`-o`**：只输出匹配的部分（而非整行），如 `grep -oE "[0-9]+" log` 提取所有数字。

**性能**：`grep` 对大文件很快（流式处理）。`-F`（fixed string）禁用正则按字面匹配，更快；`--color=auto` 高亮匹配部分。

## 二、sed：流编辑器

`sed`（Stream Editor）按行读取，对每行执行编辑命令。最常用的是**替换（substitute，`s`）**：

**替换**：

```
sed 's/old/new/' f                # 每行第一个 old 换 new
sed 's/old/new/g' f               # 每行所有 old 换 new（g = global）
sed 's/old/new/gi' f              # 忽略大小写（i）
sed 's/old/new/2' f               # 每行第 2 个 old 换 new
sed -i 's/old/new/g' f            # 直接改原文件（危险！先预览）
sed -i.bak 's/old/new/g' f        # 改原文件 + 备份 f.bak
```

- **不加 `g` 只换每行第一个**——这是新手最常踩的坑（以为全部替换了其实只换了第一个）。
- **`-i` 直接改原文件**：危险，没有撤销。养成习惯：先 `sed 's/.../' f`（不带 -i）预览输出确认无误，再 `-i` 真改。或用 `-i.bak` 自动备份。
- **分隔符可换**：路径含 `/` 时，`sed 's/\/usr\/local/\/opt/g'` 反斜杠泛滥，改用 `sed 's|/usr/local|/opt|g'`（用 `|` 当分隔符）清晰得多。

**其他编辑操作**：

```
sed -n '10,20p' f                 # 只打印第 10-20 行（-n 抑制默认输出，p 打印）
sed '/debug/d' f                  # 删除含 debug 的行（d = delete）
sed '5d' f                        # 删除第 5 行
sed '/^$/d' f                     # 删除空行（^$ 是空行）
sed '5a\new line' f               # 第 5 行后追加
sed '5i\new line' f               # 第 5 行前插入
sed -n '/error/p' f               # 只打印含 error 的行（等同 grep error）
```

**反向引用（分组替换）**：

```
sed -E 's/([0-9]+)-([0-9]+)/\2\/\1/' f   # 日期 08-02 → 02/08（\1 \2 引用分组）
sed -E 's/(error|warning)/[\1]/' f        # 给 error/warning 加方括号
```

**扩展正则 `-E`**（推荐）：`sed -E` 让 `+`/`?`/`()`/`{}` 直接用，否则要转义（如 `\(...\)`、`a\{2,4\}`）。

## 三、awk：列处理大师

`awk` 是最强的列处理工具，也是一门小语言。基本结构 `awk '条件 {动作}'`——对每行，条件满足则执行动作：

**取列**：

```
awk '{print $1}' f                # 打印每行第 1 列（默认空白分隔）
awk '{print $1, $3}' f            # 打印第 1、3 列（逗号用 OFS 分隔）
awk '{print $0}' f                # 打印整行（$0）
awk -F: '{print $1}' /etc/passwd  # 冒号分隔，取第 1 列（用户名）
awk -F, '{print $2}' data.csv     # CSV 文件，取第 2 列
awk '{print $NF}' f               # 打印最后一列（NF 是列数，$NF 末列）
awk '{print $(NF-1)}' f           # 倒数第 2 列
awk -F: 'BEGIN{OFS="|"}{print $1,$7}' /etc/passwd  # 输出用 | 分隔
```

**条件过滤**：

```
awk '$3 > 100' f                  # 第 3 列 > 100 的行
awk '$1 == "error"' f             # 第 1 列等于 error 的行
awk -F: '$3 >= 1000 {print $1}' /etc/passwd   # UID>=1000 的普通用户
awk 'NR==10' f                    # 第 10 行（NR 是行号）
awk 'NR>=10 && NR<=20' f          # 第 10-20 行
awk '/error/' f                   # 含 error 的行（正则匹配，等同 grep）
awk '/error/ && $3 > 100' f       # 含 error 且第3列>100
```

**统计聚合**（awk 的强项）：

```
awk '{sum+=$1} END{print sum}' f              # 第 1 列求和
awk '{sum+=$1; n++} END{print sum/n}' f       # 第 1 列平均值
awk 'END{print NR}' f                         # 总行数
awk '{max=($1>max?$1:max)} END{print max}' f  # 第 1 列最大值
awk '{count[$1]++} END{for(k in count) print k, count[k]}' f  # 按第1列分组计数
```

**BEGIN/END 块**：

- `BEGIN{...}`：处理所有行**之前**执行一次（用于初始化，如设分隔符 `BEGIN{FS=":"}`）。
- `END{...}`：处理所有行**之后**执行一次（用于输出汇总，如求和结果）。
- 中间的 `{...}`：对每行执行。

```
awk 'BEGIN{print "统计开始"; FS=":"} {print $1} END{print "共 " NR " 行"}' /etc/passwd
```

**实战示例**——统计 access.log 中各 HTTP 状态码的次数：

```
awk '{count[$9]++} END{for(code in count) print code, count[code]}' access.log | sort -rn
# $9 是状态码列，count[状态码] 计数，最后遍历输出
```

## 四、正则表达式实战

三剑客都依赖正则。掌握这些元字符的组合，能解决 90% 的匹配需求：

**字符匹配**：

- `.`：任意单字符。`a.c` 匹配 abc/axc/a1c（不匹配 ac）。
- `[abc]`：a/b/c 任一。`[aeiou]` 元音、`[0-9]` 数字（等同 `\d`）、`[A-Za-z]` 字母。
- `[^abc]`：**非** a/b/c（`^` 在 `[]` 内表「非」）。

**重复次数**：

- `*`：前一字符 **0 次或多次**。`ab*c` 匹配 ac/abc/abbc/abbbc。
- `+`：前一字符 **1 次或多次**（ERE）。`ab+c` 匹配 abc/abbc（不含 ac）。
- `?`：前一字符 **0 或 1 次**（ERE）。`colou?r` 匹配 color/colour。
- `{m,n}`：m 到 n 次（ERE）。`a{2,4}` 匹配 aa/aaa/aaaa。`{m}` 恰好 m 次，`{m,}` 至少 m 次。

**位置锚点**：

- `^`：行首。`^error` 以 error 开头的行。
- `$`：行尾。`\.log$` 以 .log 结尾。
- `^$`：空行（行首紧接行尾）。`sed '/^$/d'` 删空行。
- `\b`：单词边界。`\berror\b` 全词匹配（不匹配 errors）。

**分组与或**（ERE）：

- `()`：分组。`(ab)+` 匹配 ab/abab/ababab。
- `|`：或（grep -E/sed -E 用 `|`，BRE 用 `\|`）。`cat|dog` 匹配 cat 或 dog。

**转义**：

- 要匹配**字面**的元字符，前加 `\`：`\.` 匹配点、`\*` 匹配星号、`\^` 匹配 caret。
- 常见错误：`grep "1.1.1.1"` 以为匹配 IP，实际 `.` 是任意字符，会匹配 `1a1b1c1`。正确：`grep "1\.1\.1\.1"`。

**简写**（部分工具/Perl 正则支持）：

- `\d` 数字（等同 `[0-9]`）、`\D` 非数字。
- `\w` 字母数字下划线（`[A-Za-z0-9_]`）、`\W` 非。
- `\s` 空白（空格/制表符）、`\S` 非空白。
- 注意：`grep` 默认不支持 `\d`（用 `[0-9]` 或 `grep -P` 启用 PCRE）。

## 五、BRE vs ERE：别被反斜杠绕晕

| 元字符 | 基本正则 BRE | 扩展正则 ERE |
| --- | --- | --- |
| `.` `*` `[]` `^` `$` | 直接用 | 直接用 |
| `+` | `\+` | `+` |
| `?` | `\?` | `?` |
| `()` | `\(\)` | `()` |
| `{}` | `\{m,n\}` | `{m,n}` |
| `\|` | `\|` | `|` |

- **`grep`** 默认 BRE，`grep -E`（或 `egrep`）用 ERE。
- **`sed`** 默认 BRE，`sed -E`（或 `sed -r`）用 ERE。
- **`awk`** 默认就是 ERE（直接用 `+?()`）。

**日常推荐统一用 ERE**（`grep -E`、`sed -E`、`awk`），少写反斜杠，少出错。

## 下一步

三剑客熟练后，下一步学[jq 与管道组合](./jq-and-pipelines)——用 `jq` 处理 JSON、把列工具（`cut`/`sort`/`uniq`/`head`/`tail`）与三剑客组合成实战流水线。
