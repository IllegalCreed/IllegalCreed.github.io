---
layout: doc
---

# 字符串匹配（KMP / Rabin-Karp / Boyer-Moore）

字符串匹配（**String Matching**）研究的是：给定一段**主串** `s`（长度 `n`）和一个**模式串** `p`（长度 `m`），在 `s` 中找出 `p` 出现的所有位置。它是文本编辑器查找、搜索引擎分词、生物信息基因比对、入侵检测的核心原语。朴素法（双循环逐字符比对）最坏 **O(n·m)**——当主串是 `aaaa...a`、模式是 `aaa...ab` 时每次都对到最后一位才失败。进阶算法通过「**利用已匹配信息，避免主串回溯**」把复杂度压到线性或亚线性：**KMP** 用 `next` 数组（最长公共前后缀）做到精确 **O(n+m)**；**Rabin-Karp** 用滚动哈希做平均 O(n+m)，且天然支持多模式同时匹配；**Boyer-Moore** 从后向前匹配，靠坏字符 + 好后缀两条规则实现**实际最快**的亚线性跳跃。

三者没有绝对优劣，关键看场景：**单模式精确匹配最稳**选 KMP（复杂度严格线性、无哈希冲突）；**多模式 / 需要滑动哈希**选 Rabin-Karp（多个模式串哈希值丢进一个集合一次扫过）；**字母表大、实际工程**选 Boyer-Moore（坏字符跳跃通常让比较次数远小于 `n`）。其中 KMP 是面试与教学的核心——它的难点全在 `next` 数组：理解「`next[i]` = 模式串 `p[0..i]` 的最长公共前后缀长度」这一句，就抓住了 KMP 的全部精髓。

## 评价

**朴素法（双循环）**

- **优点**：实现极简（两个 `for` + 一个字符比较），无额外空间，小模式串 / 随机文本实际够快
- **缺点**：最坏 **O(n·m)**，重复主串 + 后缀失配模式退化严重（主串指针反复回溯）

**KMP**

- **优点**：复杂度**严格 O(n+m)**（无最坏退化），仅需 O(m) 预处理 `next` 数组，主串指针**绝不回溯**——适合流式数据（一次扫描，不可回退）
- **缺点**：`next` 数组构造（自匹配过程）是全算法最难理解的部分；常数因子不一定是三者最小

**Rabin-Karp**

- **优点**：平均 **O(n+m)**；天然支持**多模式同时匹配**（所有模式哈希值入集合，主串哈希一次比对）；思想简单（哈希比相等）
- **缺点**：**哈希冲突**需二次字符校验，最坏仍 O(n·m)（精心构造的冲突）；需选大素数防冲突

**Boyer-Moore**

- **优点**：**实际最快**（亚线性，常优于 `n`），字母表越大跳跃越猛；坏字符规则实现简单
- **缺点**：好后缀规则复杂、`O(n+m)` 最坏证明繁琐；预处理空间 `O(字母表大小 + m)`

## 本叶地图

- [入门](./getting-started) —— 字符串匹配问题定义、朴素法 O(nm) 为何退化、三种进阶算法的定位（KMP 精确 / RK 多模式 / BM 实际最快）、KMP 为何难（避免主串回溯）
- [KMP 算法：next 数组与避免回溯](./guide-line/kmp) —— KMP 核心、next/partial match table（最长公共前后缀）、next 数组构造、匹配过程 O(n+m)
- [Rabin-Karp 与 Boyer-Moore](./guide-line/rk-and-bm) —— Rabin-Karp 滚动哈希、哈希冲突双重校验、多模式匹配；Boyer-Moore 坏字符 + 好后缀、从后向前、实际最快
- [参考](./reference) —— 四算法复杂度对比表、KMP next 代码、RK 哈希代码、BM 规则、易错点、权威链接

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/kmp" target="_blank" rel="noopener noreferrer">KMP 可视化演示</a> —— next 数组构造与避免主串回溯
- <a href="https://algo.illegalscreed.cn/docs/rabin-karp" target="_blank" rel="noopener noreferrer">Rabin-Karp 可视化演示</a> —— 滚动哈希与冲突校验
- <a href="https://algo.illegalscreed.cn/docs/boyer-moore" target="_blank" rel="noopener noreferrer">Boyer-Moore 可视化演示</a> —— 坏字符与好后缀跳跃

## 幻灯片地址

<a href="/SlideStack/string-matching-slide/" target="_blank">字符串匹配</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%8C%B9%E9%85%8D%EF%BC%88KMP%20%2F%20Rabin-Karp%20%2F%20Boyer-Moore%EF%BC%89" target="_blank" rel="noopener noreferrer">字符串匹配测试题</a>
