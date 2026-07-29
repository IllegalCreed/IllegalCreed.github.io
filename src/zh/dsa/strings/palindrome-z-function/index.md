---
layout: doc
---

# 回文与 Z 函数（Manacher / Z）

回文（**Palindrome**）与 Z 函数（**Z-function / 扩展 KMP**）是字符串算法里两大**线性（O(n)）算法**的代表。回文是「正读反读都一样」的子串，**最长回文子串**是字符串题里的经典——朴素做法是「枚举每个中心向两侧扩展」的**中心扩展法 O(n²)**；而 **Manacher 算法**通过「预处理插入分隔符」把奇偶长度统一，并利用「已算部分的回文对称性」镜像加速，把求解压到 **O(n)**。Z 函数则是另一条线性算法线：对串 `s` 定义 `z[i]` 为「`s` 与 `s[i:]` 的最长公共前缀长度」，构造出 Z 数组后可以 **O(n)** 完成**字符串匹配**（主串对模式串做 Z 函数 / 或模式串 + 分隔符 + 主串拼成新串求 Z）、求**最小周期**、判**重复子串**等——它就是「扩展 KMP」（普通 KMP 只求 `next`，Z 函数求的是「整串与前缀」的匹配长度）。

两者共享同一个思想内核：**复用已计算的信息，把暴力 O(n²) 降到 O(n)**。Manacher 复用的是「回文的对称性」——对称中心两侧的回文半径可以镜像借用；Z 函数复用的是「已算的 Z-box 区间」——只要当前下标落在已知的 `[l, r]` 匹配段内，就能从镜像位置直接取初值再扩展。理解这两个「加速结构」就理解了为什么它们都是 O(n)：Manacher 里「最右回文右端点 `r` 单调右移，总推进 ≤ n」；Z 函数里「最右匹配段右端点 `r` 单调右移，总推进 ≤ n」——证明完全同构。本叶覆盖：回文定义、朴素中心扩展 O(n²)、Manacher 的预处理与 p 数组、对称加速与 O(n) 分析、Z 函数定义与 Z-box 加速、Z 函数在匹配/最小周期中的应用。

## 评价

**优点**

- **都是严格的 O(n) 线性算法**：Manacher 求最长回文子串、Z 函数求匹配与周期，都把朴素 O(n²) 优化到线性——常数因子小，实测极快
- **加速结构优美且对称**：Manacher 的「回文半径对称性」与 Z 函数的「Z-box 镜像」思想同源（都靠一个「单调右移的最右边界」摊还），是理解字符串线性算法的范本
- **预处理统一奇偶（Manacher）**：插入分隔符后，奇偶长度回文统一用「回文半径」表示，无需分类讨论，代码简洁
- **Z 函数比 KMP 更直观**：Z 数组直接给出「每个后缀与前缀的匹配长度」，求最小周期、匹配位置比 KMP 的 `next` 数组更易推导

**缺点**

- **实现细节多、易写错**：Manacher 的分隔符预处理、镜像边界判断（`r - i` 与 `p[2c-i]` 取 min）容易越界；Z 函数的 Z-box 边界判断（`i < r` 时取 `min(z[i-l], r-i)`）同样需要精确
- **不扩展到一般子结构**：Manacher 只解决回文，Z 函数只解决「前缀匹配」，遇到「任意模式在任意主串」的多模式匹配仍需 AC 自动机 / 后缀数组
- **下标与边界约定不统一**：`z[0]` 有约定为 `0` 也有约定为 `n` 的，`p` 数组的「半径」有含中心也有不含中心的，跨题库易踩坑

## 本叶地图

- [入门](./getting-started) —— 回文定义、最长回文子串的朴素 O(n²) 中心扩展、Manacher 与 Z 函数的引入、两者的线性算法共性
- [Manacher 算法](./guide-line/manacher) —— 预处理插入分隔符、p 数组（回文半径）、对称中心镜像加速、O(n) 摊还分析、完整代码
- [Z 函数（扩展 KMP）](./guide-line/z-function) —— Z 数组定义、Z-box 已算区间加速、O(n) 构造、字符串匹配 / 最小周期 / 重复子串应用
- [参考](./reference) —— 复杂度速查、Manacher 与 Z 函数代码、应用清单、易错点（分隔符 / Z-box 边界）

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/manacher" target="_blank" rel="noopener noreferrer">Manacher 可视化演示</a> —— 回文半径的镜像加速过程
- <a href="https://algo.illegalscreed.cn/docs/z-function" target="_blank" rel="noopener noreferrer">Z 函数可视化演示</a> —— Z-box 区间的复用与扩展

## 幻灯片地址

<a href="/SlideStack/palindrome-z-function-slide/" target="_blank">回文与 Z 函数</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E5%9B%9E%E6%96%87%E4%B8%8E%20Z%20%E5%87%BD%E6%95%B0%EF%BC%88Manacher%20%2F%20Z%EF%BC%89" target="_blank" rel="noopener noreferrer">回文与 Z 函数测试题</a>
