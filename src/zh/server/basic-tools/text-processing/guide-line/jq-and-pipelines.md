---
layout: doc
outline: [2, 3]
---

# jq 与管道组合：JSON 处理与实战流水线

> 基于 jq 与 Unix 管道组合 · 核于 2026-08

## 速查

- **`jq`**：命令行 JSON 处理利器。`.字段` 取字段、`[N]` 取数组元素、`[]` 遍历数组、`|` jq 内部管道、`select(条件)` 过滤、`-r` 输出原始字符串。
- **jq 取值**：`jq '.name'`、`jq '.users[0]'`、`jq '.users[].name'`（遍历）、`jq '.users | length'`（长度）。
- **jq 过滤/计算**：`jq '.users[] | select(.age>18)'`、`jq '[.items[].price] | add'`（求和）、`jq 'sort_by(.age)'`（排序）、`jq 'group_by(.city)'`（分组）。
- **`-r` 原始输出**：`jq -r '.name'` 输出 `alice`（不带引号），便于在 shell 管道里继续用（如赋值给变量）。
- **管道 `|`**：连接命令的 stdout → 下一个的 stdin，把小工具串成数据流水线。
- **重定向**：`>` 覆盖写文件、`>>` 追加、`<` 从文件读输入、`2>` 重定向错误、`2>&1` 错误并入标准输出。
- **列工具组合**：`cut -d: -f1`（取列）、`sort`（排序）、`uniq -c`（去重计数，需先 sort）、`head -n 10`（前10）、`tail -f`（实时跟踪）、`wc -l`（计数）。
- **实战流水线**：`cat log | grep 404 | awk '{print $1}' | sort | uniq -c | sort -rn | head`（统计 404 Top IP）。

## 一、jq：JSON 处理利器

现代运维离不开 JSON——API 响应（`curl`）、配置文件（`package.json`/`tsconfig.json`）、容器 inspect（`docker inspect`）、Kubernetes 资源、云服务 API。`jq` 是命令行处理 JSON 的标准工具，语法类似 awk：

**取值**：

```
echo '{"name":"alice","age":30}' | jq '.'            # 格式化美化（pretty print）
echo '{"name":"alice","age":30}' | jq '.name'        # 取字段 → "alice"
echo '{"name":"alice","age":30}' | jq -r '.name'     # -r 原始字符串 → alice（无引号）
echo '{"name":"alice","age":30}' | jq '.age + 5'     # 算术 → 35
echo '{"a":{"b":{"c":1}}}' | jq '.a.b.c'              # 嵌套取值 → 1
```

**数组处理**：

```
echo '[1,2,3,4,5]' | jq '.'                           # 格式化
echo '[1,2,3,4,5]' | jq '.[0]'                        # 第 1 个元素 → 1
echo '[1,2,3,4,5]' | jq '.[-1]'                       # 最后一个 → 5
echo '[1,2,3,4,5]' | jq '.[1:3]'                      # 切片（第1-2个）→ [2,3]
echo '[1,2,3,4,5]' | jq 'length'                      # 长度 → 5
echo '[1,2,3,4,5]' | jq 'map(.*2)'                    # 每个乘 2 → [2,4,6,8,10]
echo '[1,2,3,4,5]' | jq 'add'                         # 求和 → 15
echo '[1,2,3,4,5]' | jq 'max'                         # 最大值 → 5
echo '[3,1,2]' | jq 'sort'                            # 排序 → [1,2,3]
```

**遍历对象数组**（最常见场景，如 API 返回的用户列表）：

```
curl -s api/users | jq '.users[0]'                    # 第一个用户对象
curl -s api/users | jq '.users[].name'                # 遍历，每个的 name
curl -s api/users | jq -r '.users[].name'             # 原始输出（无引号，可循环）
curl -s api/users | jq '.users | length'              # 用户总数
curl -s api/users | jq '.users | map(.name)'          # 提取所有 name 成数组
```

**过滤 select**（类似 SQL 的 WHERE）：

```
curl -s api/users | jq '.users[] | select(.age > 18)'         # age>18 的用户
curl -s api/users | jq '.users[] | select(.city == "北京")'    # city=北京
curl -s api/users | jq '.users[] | select(.active == true)'   # active 为 true
curl -s api/users | jq '[.users[] | select(.age>18)] | length' # age>18 的数量
```

**重组/构造新对象**：

```
curl -s api/users | jq '.users[] | {name, email}'     # 只保留 name 和 email 字段
curl -s api/users | jq '.users | map({user: .name, age})'  # 重命名字段
```

**`-r` 与 shell 结合**（最实用的技巧）：

```
# 取出所有用户名，逐个处理
for user in $(curl -s api/users | jq -r '.users[].name'); do
    echo "处理用户: $user"
done

# 取值赋给 shell 变量
VERSION=$(curl -s api/release | jq -r '.version')
echo "最新版本: $VERSION"
```

## 二、管道与重定向

**管道 `|`** 把一个命令的标准输出接到下一个的标准输入，是 Unix 工具组合的核心：

```
命令A | 命令B | 命令C
# A 的 stdout → B 的 stdin → B 的 stdout → C 的 stdin
```

每个命令是独立的过滤器，流式处理（读一行处理一行），所以能处理大文件而不占内存。

**重定向**控制输入输出方向：

| 符号 | 含义 | 示例 |
| --- | --- | --- |
| `>` | 标准输出写入文件（**覆盖**） | `ls > files.txt` |
| `>>` | 标准输出追加到文件 | `date >> log.txt` |
| `<` | 从文件读标准输入 | `wc -l < file.txt` |
| `2>` | 标准错误重定向 | `cmd 2> err.log` |
| `2>&1` | 标准错误并入标准输出 | `cmd > all.log 2>&1` |
| `&>` | 全部（输出+错误）重定向（bash） | `cmd &> all.log` |
| `/dev/null` | 黑洞（丢弃输出） | `cmd > /dev/null 2>&1` |

**常见组合**：

- `cmd > /dev/null 2>&1`：丢弃所有输出（cron 任务常用，避免邮件）。
- `cmd 2>&1 | grep error`：把错误也并入管道，一起 grep。
- `cmd1 && cmd2`：cmd1 成功才执行 cmd2（逻辑与）。
- `cmd1 || cmd2`：cmd1 失败才执行 cmd2（逻辑或，常用于 fallback）。

## 三、列处理工具组合

除了三剑客，这些小工具在管道里频繁出现：

**`cut`**——按分隔符或字符位置取列：

```
cut -d: -f1 /etc/passwd         # 冒号分隔，取第 1 列（用户名）
cut -d: -f1,7 /etc/passwd       # 取第 1、7 列
cut -d, -f2 data.csv            # CSV 取第 2 列
cut -c1-10 file                 # 每行第 1-10 个字符
cut -c-5 file                   # 每行前 5 个字符
```

**`sort`**——排序：

```
sort file                       # 字典序（默认）
sort -n file                    # 数字序（10 排在 2 后面，而非字典序的 2 在 10 后）
sort -r file                    # 降序
sort -nr file                   # 数字降序（常配合 uniq -c 找 Top）
sort -k2 file                   # 按第 2 列排（默认空白分隔）
sort -t: -k3 -n /etc/passwd     # 冒号分隔，按第 3 列（UID）数字排
sort -u file                    # 排序并去重（等同 sort | uniq）
```

**`uniq`**——去重（**必须先 sort**，否则不相邻的重复去不掉）：

```
sort file | uniq                # 排序后去重
sort file | uniq -c             # 去重并显示每行重复次数（计数）
sort file | uniq -d             # 只显示重复的行
sort file | uniq -u             # 只显示唯一的（不重复的）行
```

`uniq -c` 配合 `sort -nr` 是统计 Top 的经典组合（见下文）。

**`head`/`tail`**——取头尾：

```
head -n 10 file                 # 前 10 行
head -c 100 file                # 前 100 字节
tail -n 20 file                 # 后 20 行
tail -f log.txt                 # 实时跟踪文件追加（看日志必用）
tail -F log.txt                 # 大写 F：文件 rotate 时重新打开（更稳健）
```

**`wc`**——计数：

```
wc -l file                      # 行数
wc -w file                      # 词数
wc -c file                      # 字节数
ls | wc -l                      # 当前目录文件数（ls 输出行数）
```

**`tr`**——字符转换：

```
echo "Hello" | tr 'A-Z' 'a-z'   # 大写转小写 → hello
echo "a,b,c" | tr ',' '\n'      # 逗号转换行 → 每个一行
echo "hello" | tr -d 'l'        # 删除字符 l → heo
echo "hello" | tr -s 'l'        # 压缩重复 l → helo
```

## 四、实战流水线

把工具组合起来解决实际问题——这是 Unix 哲学的精华：

**场景 1：统计 access.log 中 404 最多的前 10 个 IP**

```
cat access.log | grep " 404 " | awk '{print $1}' | sort | uniq -c | sort -rn | head -n 10
#  读日志 → 过滤404行 → 取IP(第1列) → 排序 → 去重计数 → 按计数降序 → 前10
```

逐环解释：
1. `cat access.log`：读取日志（也可直接 `awk ... access.log` 省略 cat）。
2. `grep " 404 "`：过滤含 404 状态码的行（前后加空格避免误匹配端口号）。
3. `awk '{print $1}'`：取每行第 1 列（IP 地址）。
4. `sort`：排序（让相同 IP 相邻，为 uniq 准备）。
5. `uniq -c`：去重并计数（输出「次数 IP」）。
6. `sort -rn`：按数字降序（次数多的在前）。
7. `head -n 10`：取前 10。

**场景 2：找出 /var/log 下最大的 10 个文件**

```
find /var/log -type f -exec du -h {} + | sort -rh | head -n 10
#  找普通文件 → 算大小 → 按大小降序 → 前10
```

**场景 3：批量替换配置文件中的旧域名**

```
sed -i.bak 's/old.example.com/new.example.com/g' *.conf
# 用 sed -i 直接改，-i.bak 自动备份，s///g 全局替换
```

**场景 4：统计代码行数（排除空行和注释）**

```
grep -vE '^\s*(//|$)' *.js | wc -l
# 排除空行和 // 注释 → 计数
```

**场景 5：从 docker inspect 提取容器 IP**

```
docker inspect mycontainer | jq -r '.[0].NetworkSettings.IPAddress'
# 格式化 JSON → 取第1个元素 → 网络设置 → IP 地址（-r 原始输出）
```

**场景 6：监控某服务的实时错误日志**

```
journalctl -u myapp -f | grep -i --color=auto "error"
# 实时跟踪日志 → 过滤含 error 的行 → 高亮
```

**场景 7：列出系统中 UID 大于等于 1000 的普通用户**

```
awk -F: '$3 >= 1000 && $3 != 65534 {print $1}' /etc/passwd
# 冒号分隔 → UID($3)>=1000 且非 nobody → 打印用户名($1)
```

## 五、调试管道的技巧

长管道出错时，定位是哪一环的问题：

- **逐环加 `head`**：先 `cat log | grep 404 | head`，确认 grep 输出对；再 `... | awk '{print $1}' | head`，确认 awk 对。逐环验证。
- **用 `tee` 分流**：`cmd | tee debug.txt | next_cmd`——`tee` 把中间结果存一份到 debug.txt，同时继续传给下游，便于检查。
- **检查退出码**：`echo $?` 看上一条命令是否成功（0 成功，非 0 失败）。`set -o pipefail`（bash）让管道返回最后一个非零退出码（默认只看最后一个）。
- **大文件性能**：管道是流式的（每环处理一行就传给下一环），不一次性读入内存，所以能处理 GB 级日志。但 `sort` 是例外——它要全部读入排序，超大数据可能慢。

## 下一步

文本处理工具链熟练后，你已经能从海量日志和命令输出中高效提取信息。这些工具是 Bash 脚本（如 [Bash](../../bash/) 叶）的基石——把它们组合进脚本，实现自动化运维与数据处理。结合[文件系统与基础命令](../../filesystem-commands/)和[进程管理与服务](../../process-services/)，构成服务器日常运维的完整工具集。
