---
layout: doc
outline: [2, 3]
---

# Rabin-Karp 与 Boyer-Moore

> 基于通用算法套路 · 核于 2026-07

## 速查

- **Rabin-Karp（RK）核心**：不直接比字符串相等，而比**长度为 m 的窗口的哈希值**是否相等；用**滚动哈希**让窗口滑动一步是 `O(1)`——平均 **O(n+m)**。
- **滚动哈希公式**：取基数 `base`、大素数 `mod`，`hash = (c0·base^(m-1) + c1·base^(m-2) + ... + c_(m-1)) mod mod`；右滑一格：`hash_new = ((hash_old - c_出去 · base^(m-1)) · base + c_进来) mod mod`。
- **哈希冲突双重校验**：哈希相等不代表字符串相等（冲突），需**逐字符二次比对**确认；为防恶意冲突选大素数（或双哈希 / 随机基数）。
- **RK 适合多模式**：把所有模式串的哈希值放进一个**哈希集合**，主串每个窗口算一次哈希查集合——一次扫描同时匹配多个模式。
- **RK 复杂度**：预处理 O(m)（算首窗哈希 + `base^(m-1) mod mod`）；匹配平均 O(n)，**最坏 O(n·m)**（精心构造的冲突让每个窗口都要二次校验）。
- **Boyer-Moore（BM）核心**：**从后向前**逐字符比对（先比 `p[m-1]` 与对应主串字符），失配时靠**坏字符规则**或**好后缀规则**把模式串**大幅右移**——实际比较次数常 **亚线性（< n）**，工程实测最快。
- **坏字符规则**：失配字符 `s[i+j]` 若在 `p` 中出现在更左侧位置 `k < j`，则右移 `j - k` 让两者对齐；若不在 `p` 中则右移 `j + 1`（整段跳过）。
- **好后缀规则**：失配时已匹配上的后缀 `p[j+1..m-1]`，若 `p` 的另一个前缀也以这段结尾，或 `p` 的某个前缀等于该后缀的子串，则据此右移；二者取大者。
- **BM 复杂度**：最坏 **O(n+m)**（需好后缀规则保证）；只看坏字符规则最坏会退化，但实际（尤其大字母表）极快；预处理 O(m + 字母表大小)。
- **BM-Horspool 变体**：只保留坏字符规则（且统一用窗口最右字符），实现更简、常数更小，是工业最常用变体（grep 等曾采用）。
- **选型**：单模式精确最稳 → KMP；多模式 / 哈希视角 → RK；工程实测最快 → BM / BM-Horspool。
- **交互演示**：[RK 演示](https://algo.illegalscreed.cn/docs/rabin-karp) · [BM 演示](https://algo.illegalscreed.cn/docs/boyer-moore)。

## 一、Rabin-Karp：滚动哈希比相等

RK 换了一个视角：字符串相等太难比（要逐字符 `O(m)`），那就先比一个「指纹」——把每个长度为 `m` 的子串映射成一个整数哈希，**哈希不等则字符串必不等**，哈希相等再逐字符确认。关键在于这个哈希要能 `O(1)` 「滑动」。

### 滚动哈希

取基数 `base`（常取字母表大小，如 256 或 26）、大素数 `mod`（防溢出 + 防冲突，如 `1e9+7`、`1e9+9`）。把字符串看成 `base` 进制数：

```
hash(s[l..l+m-1]) = (s[l]·base^(m-1) + s[l+1]·base^(m-2) + ... + s[l+m-1]) mod mod
```

窗口从 `[l, l+m-1]` 滑到 `[l+1, l+m]` 时，不必重算，可在旧哈希基础上 `O(1)` 增量：

```
hash_new = ( (hash_old - s[l]·base^(m-1)) · base + s[l+m] ) mod mod
```

即「减去最左字符的贡献、整体乘 `base`、加上新进来的最右字符」。预先算好 `base^(m-1) mod mod` 即可滑动。

### 代码

```js
// Rabin-Karp：返回 p 在 s 中所有出现起点下标
function rabinKarp(s, p) {
  const n = s.length, m = p.length;
  if (m === 0 || m > n) return [];
  const base = 256n, mod = 1000000007n;       // 用 BigInt 防溢出
  let hp = 0n, hs = 0n, pow = 1n;              // hp=模式哈希, hs=窗口哈希, pow=base^(m-1)
  for (let k = 0; k < m - 1; k++) pow = (pow * base) % mod;
  for (let k = 0; k < m; k++) {
    hp = (hp * base + BigInt(p.charCodeAt(k))) % mod;
    hs = (hs * base + BigInt(s.charCodeAt(k))) % mod;
  }
  const res = [];
  for (let i = 0; i <= n - m; i++) {
    if (hs === hp && s.slice(i, i + m) === p) { // 哈希相等 → 二次逐字符校验
      res.push(i);
    }
    if (i < n - m) {                             // 滚动到下一窗口
      hs = ( (hs - BigInt(s.charCodeAt(i)) * pow % mod + mod) * base
             + BigInt(s.charCodeAt(i + m)) ) % mod;
    }
  }
  return res;
}
```

注意 `+ mod` 是为消除减法可能产生的负数（取模运算的标准技巧）。

### 哈希冲突双重校验

哈希函数从大空间（长 `m` 字符串）映射到小空间（`[0, mod)` 整数），**必然存在冲突**——两个不同字符串哈希相等。因此 RK 的正确性要求：**哈希相等时必须逐字符比对 `s[i..i+m-1] === p` 再确认命中**。否则会误报匹配（命中假阳性）。这也带来 RK 的最坏复杂度：若恶意构造让每个窗口哈希都相等（如精心选冲突输入），二次校验让总代价回到 **O(n·m)**。缓解手段：选很大的 `mod`、用双哈希（两个独立 `base/mod`，同时相等才算命中）、随机化 `base`。

### 多模式匹配

RK 的杀手锏：把多个模式串 `p1, p2, ...` 的哈希值都放进一个**集合** `H`，主串滑动窗口算一次哈希，查 `H` 是否包含——**一次扫描同时匹配所有模式**，匹配阶段仍是 `O(n)`（加上每个命中模式的二次校验）。这是 KMP/BM 做不到的（它们本质是单模式）。

## 二、Boyer-Moore：从后向前 + 双规则跳跃

BM 的洞察：从模式串**右端**（`p[m-1]`）开始往左比对。一旦右侧字符失配，就获得了「主串里那个不匹配字符」的信息，可以直接把模式串**大幅右移**，跳过大量注定失败的对齐位置——这就是它常能做到**亚线性**（实际比较次数 < `n`）的原因。

### 坏字符规则

当比对 `p[j]` 与 `s[i+j]` 失配时，记坏字符 `bad = s[i+j]`：

- 若 `bad` 在 `p[0..j-1]`（模式串失配位置左侧）中出现，记最右出现位置为 `k`，则右移 `j - k`，让 `p[k]` 对齐到原 `s[i+j]`。
- 若 `bad` 不在 `p` 中，则 `s[i+j]` 这个字符根本不可能参与任何匹配，右移 `j + 1`（整段跳过坏字符）。

预处理一个 `badChar[字符] = 该字符在 p 中最右出现位置`（不存在记 -1），失配时 `shift = j - badChar[bad]`（负数时至少移 1，与好后缀规则取大者）。

### 好后缀规则

失配时已经匹配上的后缀 `p[j+1..m-1]`（记为好后缀 `U`），也可指导右移：

- 若 `p` 的另一个子串 `p[k..k+|U|-1] === U` 且 `p[k-1] ≠ p[j]`（前一个字符不同，避免立刻再失配），右移使两者对齐。
- 否则，找 `p` 的最长的、同时也是 `U` 的后缀的「`p` 的前缀」，据此右移。
- 预处理成 `goodSuffix[j]` 数组。

### 双规则取大者

每次失配取「坏字符右移量」与「好后缀右移量」的**较大者**——取大才能保证最坏 `O(n+m)`（只靠坏字符规则在某些重复串下会退化）。实际工程里，坏字符规则收益往往已足够大，故 **Boyer-Moore-Horspool** 简化版（只用坏字符、且统一取窗口最右字符的坏字符位移）成为工业最常用变体。

### 代码（坏字符规则版，BM-Horspool 风格）

```js
// Boyer-Moore-Horspool：用最右字符的坏字符规则
function boyerMoore(s, p) {
  const n = s.length, m = p.length;
  if (m === 0 || m > n) return [];
  const skip = {};                             // skip[ch] = ch 在 p[0..m-2] 最右位置决定的位移
  for (let k = 0; k < m - 1; k++) skip[p[k]] = m - 1 - k;
  const res = [];
  let i = 0;
  while (i <= n - m) {
    let j = m - 1;                             // 从后向前比对
    while (j >= 0 && s[i + j] === p[j]) j--;
    if (j < 0) { res.push(i); i++; }           // 完整匹配
    else i += skip[s[i + m - 1]] ?? m;          // 按窗口最右字符的位移右移
  }
  return res;
}
```

Horspool 变体只维护「窗口最右字符」的位移表（实现极简），字母表大时实测接近完整 BM，是 `grep`、各种编辑器查找的常用内核。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/rabin-karp" target="_blank" rel="noopener noreferrer">Rabin-Karp 可视化演示</a> —— 滚动哈希与冲突二次校验
- <a href="https://algo.illegalscreed.cn/docs/boyer-moore" target="_blank" rel="noopener noreferrer">Boyer-Moore 可视化演示</a> —— 坏字符与好后缀跳跃

## 下一步

掌握三种主流匹配算法后，可对照四算法复杂度速查、KMP next 代码、RK 哈希代码、BM 规则与易错点一览，见 [参考](../reference)。
