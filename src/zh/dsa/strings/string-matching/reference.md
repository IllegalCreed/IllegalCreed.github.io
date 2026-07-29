---
layout: doc
outline: [2, 3]
---

# 参考：字符串匹配 API、复杂度与对比速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **问题定义**：主串 `s`（长 `n`）找模式串 `p`（长 `m`）所有出现起点下标。
- **朴素**：逐起点逐字符，最坏 **O(n·m)**；症结是失配后丢弃已匹配信息、主串回退。
- **KMP**：`next[j]` = `p[0..j-1]` 最长公共前后缀长度；失配 `j = next[j]`，**主串不回退**；**O(n+m)**。
- **Rabin-Karp**：滚动哈希比窗口哈希值，平均 **O(n+m)**；哈希相等须**二次逐字符校验**；**多模式**把哈希入集合一次扫描。
- **Boyer-Moore**：**从后向前**，坏字符 + 好后缀双规则取大右移；最坏 O(n+m)，实际常**亚线性**、工程最快。
- **next 构造**：`i` 扩右端、`len` 跟踪 LPS；`p[i]===p[len]` → `next[i+1]=++len`；不等且 `len>0` → `len=next[len]`；不等且 `len=0` → `next[i+1]=0,i++`。
- **滚动哈希**：`hash_new = ((hash_old - c_左·base^(m-1))·base + c_右) mod mod`；减法后 `+mod` 消负。
- **坏字符位移**：`shift = j - badChar[bad]`，`badChar[ch] = ch 在 p 最右位置`，不存在记 -1。
- **BM-Horspool**：只保留坏字符、统一用窗口最右字符位移，实现简、常数小，工业常用。
- **易错**：next 下标差 1（`next[j]` 对应 `p[0..j-1]`）；真前缀/真后缀（`next[0]=0`）；RK 漏二次校验 → 假阳性；BM 坏字符位移为负时要取至少 1。
- **应用**：编辑器查找（BMH）、grep、正则引擎、入侵检测特征串、DNA motif、`indexOf` 底层。
- **交互演示**：[KMP](https://algo.illegalscreed.cn/docs/kmp) · [RK](https://algo.illegalscreed.cn/docs/rabin-karp) · [BM](https://algo.illegalscreed.cn/docs/boyer-moore)。

## 一、四算法复杂度对比

| 算法 | 预处理 | 匹配（平均） | 匹配（最坏） | 空间 | 主串指针 |
| --- | --- | --- | --- | --- | --- |
| 朴素 | 无 | O(n+m) | **O(n·m)** | O(1) | 回退 |
| **KMP** | O(m) | O(n) | **O(n)** | O(m)（next） | **不回退** |
| **Rabin-Karp** | O(m) | O(n) | O(n·m)（冲突） | O(模式数) | 单调右移 |
| **Boyer-Moore** | O(m+字母表) | 常亚线性（< n） | O(n+m) | O(m+字母表) | 跳跃前进 |

一句话选型：**严格线性、主串不可退 → KMP**；**多模式 / 哈希视角 → RK**；**工程实测最快 → BM / BM-Horspool**。

## 二、KMP next 构造代码

```js
// next[j] = p[0..j-1] 的最长公共前后缀长度，next[0]=0
function buildNext(p) {
  const m = p.length;
  const next = new Array(m + 1).fill(0);
  let i = 1, len = 0;
  while (i < m) {
    if (p[i] === p[len]) { next[++i] = ++len; }   // 续上：LPS+1
    else if (len > 0) { len = next[len]; }         // 续不上且能退：回退 LPS
    else { next[++i] = 0; }                        // 续不上且 len=0：置 0
  }
  return next;
}
```

next 构造示例（`p = "abcabd"`）：`next = [0,0,0,0,1,2,0]`。

## 三、KMP 匹配代码

```js
function kmpSearch(s, p) {
  const n = s.length, m = p.length;
  const next = buildNext(p);
  const res = [];
  let i = 0, j = 0;
  while (i < n) {
    if (s[i] === p[j]) { i++; j++; }
    else if (j > 0) { j = next[j]; }               // 失配：j 回跳，i 不动
    else { i++; }                                   // j=0 还失配：i 前进
    if (j === m) { res.push(i - m); j = next[j]; }  // 命中：记录 + 续找
  }
  return res;
}
```

## 四、Rabin-Karp 滚动哈希代码

```js
function rabinKarp(s, p) {
  const n = s.length, m = p.length;
  if (m === 0 || m > n) return [];
  const base = 256n, mod = 1000000007n;
  let hp = 0n, hs = 0n, pow = 1n;
  for (let k = 0; k < m - 1; k++) pow = pow * base % mod;       // base^(m-1)
  for (let k = 0; k < m; k++) {
    hp = (hp * base + BigInt(p.charCodeAt(k))) % mod;
    hs = (hs * base + BigInt(s.charCodeAt(k))) % mod;
  }
  const res = [];
  for (let i = 0; i <= n - m; i++) {
    if (hs === hp && s.slice(i, i + m) === p) res.push(i);       // 哈希等 → 二次校验
    if (i < n - m) {                                              // 滚动
      hs = ((hs - BigInt(s.charCodeAt(i)) * pow % mod + mod)
            * base + BigInt(s.charCodeAt(i + m))) % mod;
    }
  }
  return res;
}
```

关键：`+ mod` 消除减法的负数；二次校验 `s.slice(i,i+m) === p` 防假阳性。

## 五、Boyer-Moore（Horspool 简化版）代码

```js
function boyerMoore(s, p) {
  const n = s.length, m = p.length;
  if (m === 0 || m > n) return [];
  const skip = {};
  for (let k = 0; k < m - 1; k++) skip[p[k]] = m - 1 - k;        // 最右字符位移
  const res = [];
  let i = 0;
  while (i <= n - m) {
    let j = m - 1;
    while (j >= 0 && s[i + j] === p[j]) j--;                      // 从后向前
    if (j < 0) { res.push(i); i++; }                              // 命中
    else { i += skip[s[i + m - 1]] ?? m; }                        // 按窗口最右字符跳
  }
  return res;
}
```

完整 BM 额外维护好后缀位移表 `goodSuffix[]`，与坏字符位移取较大者，保证最坏 O(n+m)。

## 六、坏字符 vs 好后缀规则

| 规则 | 依据 | 位移 | 弱点 |
| --- | --- | --- | --- |
| 坏字符 | 失配字符 `s[i+j]` 在 `p` 中最右位置 | `j - badChar[bad]`（不存在则 `j+1`） | 重复字母表下位移小 |
| 好后缀 | 已匹配后缀 `p[j+1..m-1]` 在 `p` 中再现 | 由 `goodSuffix[j]` 表决定 | 预处理略复杂 |
| 取大者 | 两者都合法时取较大跳跃 | `max(坏字符位移, 好后缀位移)` | 保证最坏 O(n+m) |

## 七、易错点清单

- **next 下标差 1**：`next[j]` 描述的是前缀 `p[0..j-1]`（不含 `p[j]`），数组常开 `m+1` 长度避免越界。
- **真前缀/真后缀**：「真」表示不能是整个串，故 `next[0]=0`、`next[1]` 至多为 0（单字符无真前后缀）。
- **`len = next[len]` 别写成 `len--`**：回退必须沿 next 链跳，线性递减会丢解。
- **RK 漏二次校验**：哈希相等不等同字符串相等，漏 `s.slice(i,i+m)===p` 会产生假阳性命中。
- **RK 减法负数**：`(hs - c·pow) % mod` 可能为负，需 `+ mod` 再取模。
- **RK mod 选太小**：冲突频繁、二次校验拖到 O(n·m)；选大素数或双哈希。
- **BM 坏字符位移为负**：坏字符在 `p` 右侧出现时 `j - k < 0`，须取至少 1（或与好后缀取大者）。
- **BM-Horspool 用错字符**：位移由**窗口最右字符** `s[i+m-1]` 决定，不是失配字符。
- **主串指针回退**：除朴素法外，KMP/RK/BM 的主串扫描都应单调前进，若发现回退即实现错误。
- **空模式 / 模式长于主串**：边界先判 `m===0` 或 `m>n` 返回空，避免越界。

## 权威链接

- [Knuth–Morris–Pratt algorithm - Wikipedia](https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm)
- [Rabin–Karp algorithm - Wikipedia](https://en.wikipedia.org/wiki/Rabin%E2%80%93Karp_algorithm)
- [Boyer–Moore string-search algorithm - Wikipedia](https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_string-search_algorithm)
- [字符串匹配 - OI Wiki](https://oi-wiki.org/string/match/)
- [KMP Algorithm - GeeksforGeeks](https://www.geeksforgeeks.org/kmp-algorithm-for-pattern-searching/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/kmp" target="_blank" rel="noopener noreferrer">KMP 可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/rabin-karp" target="_blank" rel="noopener noreferrer">RK 可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/boyer-moore" target="_blank" rel="noopener noreferrer">BM 可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/string-matching-slide/" target="_blank">字符串匹配</a>
