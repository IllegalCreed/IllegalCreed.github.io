---
layout: doc
outline: [2, 3]
---

# 参考：序列区间 DP API、模型与复杂度速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **序列 DP**：`dp[i]` 表「前 i 个」或「以 i 结尾」的最优——LIS、Kadane、打家劫舍。
- **区间 DP**：`dp[i][j]` 表区间 `[i,j]` 的最优——**按长度枚举 + 枚举断点 k**——最长回文子串、石子合并、戳气球。
- **LCS**：`dp[i][j]=s1[i-1]==s2[j-1]?dp[i-1][j-1]+1:max(dp[i-1][j],dp[i][j-1])`，O(nm)，可滚动压空间。
- **LIS 朴素**：`dp[i]=max(dp[j])+1 (a[j]<a[i])`，O(n²)；**二分优化**：`tails[k]`=长度 k+1 的最小尾，lowerBound 替换，O(n log n)。
- **编辑距离**：`dp[i][j]=s1[i-1]==s2[j-1]?dp[i-1][j-1]:1+min(改,删,增)`，边界 `dp[0][j]=j`，O(nm)。
- **最长回文子串**：`dp[i][j]=(s[i]==s[j])&&(len<=2||dp[i+1][j-1])`，按长度枚举，O(n²)。
- **最长回文子序列**：`dp[i][j]=s[i]==s[j]?dp[i+1][j-1]+2:max(dp[i+1][j],dp[i][j-1])`，O(n²)；或 LCS(s, reverse(s))。
- **石子合并**：`dp[i][j]=min(dp[i][k]+dp[k+1][j])+sum[i..j]`，前缀和取区间和，O(n³)，四边形优化 O(n²)。
- **区间和**：`sum[i..j]=prefix[j+1]-prefix[i]`，O(1)。
- **空间优化**：LCS/编辑距离滚动数组（暂存左上角）；LIS 二分版一维；区间 DP 难压（依赖 i+1 行）。
- **交互演示**：[LCS](https://algo.illegalscreed.cn/docs/lcs)、[LIS](https://algo.illegalscreed.cn/docs/lis)、[编辑距离](https://algo.illegalscreed.cn/docs/edit-distance)、[石子合并](https://algo.illegalscreed.cn/docs/stone-merge)。

## 一、模型复杂度速查表

| 模型 | 状态 | 转移核心 | 时间 | 空间 | 备注 |
| --- | --- | --- | --- | --- | --- |
| **LCS** | `dp[i][j]` 前 i 前 j | 相等 +1，否则 max(左,上) | O(nm) | O(nm)→O(min) | 可滚动 |
| **LIS 朴素** | `dp[i]` 以 i 结尾 | `max(dp[j])+1, a[j]<a[i]` | O(n²) | O(n) | 易回溯 |
| **LIS 二分** | `tails[k]` 长度 k+1 最小尾 | lowerBound 替换 | O(n log n) | O(n) | 只给长度 |
| **编辑距离** | `dp[i][j]` 前 i 前 j | 相等免操作，否则 1+min(改,删,增) | O(nm) | O(nm)→O(min) | 可滚动 |
| **最长回文子串** | `dp[i][j]` 是否回文 | 两端相等且内部回文 | O(n²) | O(n²) | 按长度枚举 |
| **最长回文子序列** | `dp[i][j]` 长度 | 相等 +2，否则 max | O(n²) | O(n²) | 或 LCS 法 |
| **石子合并** | `dp[i][j]` 最小代价 | `min(dp[i][k]+dp[k+1][j])+sum` | O(n³) | O(n²) | 前缀和 |
| **Kadane 最大子数组和** | `dp[i]` 以 i 结尾 | `max(a[i], dp[i-1]+a[i])` | O(n) | O(1) | 滚动 |

## 二、LCS 代码模板

```js
function lcs(s1, s2) {                       // O(nm)，可滚动压到 O(min(n,m))
  const n = s1.length, m = s2.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = s1[i - 1] === s2[j - 1]
        ? dp[i - 1][j - 1] + 1                       // 相等：斜上 +1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);      // 否则：左/上取大
  return dp[n][m];
}

// 滚动数组版（暂存左上角 prev，避免被覆盖）
function lcsRoll(s1, s2) {
  const n = s1.length, m = s2.length;
  let prev = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const cur = new Array(m + 1).fill(0);
    for (let j = 1; j <= m; j++)
      cur[j] = s1[i - 1] === s2[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    prev = cur;
  }
  return prev[m];
}
```

## 三、LIS 代码模板（朴素 + 二分）

```js
// 朴素 O(n²)：dp[i] = 以 a[i] 结尾的 LIS 长度
function lisN2(a) {
  const dp = new Array(a.length).fill(1);
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < i; j++)
      if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
  return Math.max(...dp);
}

// 二分 O(n log n)：tails[k] = 长度 k+1 的最小尾元素
function lisBinary(a) {
  const tails = [];
  for (const x of a) {
    let lo = 0, hi = tails.length;          // lowerBound：第一个 >= x
    while (lo < hi) { const mid = (lo + hi) >> 1; tails[mid] >= x ? (hi = mid) : (lo = mid + 1); }
    lo === tails.length ? tails.push(x) : (tails[lo] = x);
  }
  return tails.length;
}

// 求最长「不降」子序列（允许相等）：二分改 upperBound（第一个 > x）
function lisNonDecreasing(a) {
  const tails = [];
  for (const x of a) {
    let lo = 0, hi = tails.length;          // upperBound：第一个 > x
    while (lo < hi) { const mid = (lo + hi) >> 1; tails[mid] > x ? (hi = mid) : (lo = mid + 1); }
    lo === tails.length ? tails.push(x) : (tails[lo] = x);
  }
  return tails.length;
}
```

## 四、编辑距离代码模板

```js
function editDistance(s1, s2) {              // O(nm)
  const n = s1.length, m = s2.length;
  const dp = Array.from({ length: n + 1 }, (_, i) =>
    new Array(m + 1).fill(0).map((_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = s1[i - 1] === s2[j - 1]
        ? dp[i - 1][j - 1]                           // 相等：免操作
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]); // 改/删/增
  return dp[n][m];
}
```

**操作映射**：`dp[i-1][j-1]+1` = 改 `s1[i-1]` 为 `s2[j-1]`；`dp[i-1][j]+1` = 删 `s1[i-1]`；`dp[i][j-1]+1` = 增 `s2[j-1]`。

## 五、区间 DP 代码模板（最长回文子串 + 石子合并）

```js
// 最长回文子串：dp[i][j] = s[i..j] 是否回文，按长度枚举
function longestPalindrome(s) {
  const n = s.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(false));
  let start = 0, maxLen = 1;
  for (let i = 0; i < n; i++) dp[i][i] = true;
  for (let len = 2; len <= n; len++)
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      if (s[i] === s[j]) {
        dp[i][j] = len === 2 ? true : dp[i + 1][j - 1];
        if (dp[i][j] && len > maxLen) { start = i; maxLen = len; }
      }
    }
  return s.slice(start, start + maxLen);
}

// 石子合并：dp[i][j] = min(dp[i][k]+dp[k+1][j])+sum[i..j]，前缀和取区间和
function mergeStones(a) {
  const n = a.length;
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + a[i];
  const rangeSum = (i, j) => prefix[j + 1] - prefix[i];
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let len = 2; len <= n; len++)
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = Infinity;
      for (let k = i; k < j; k++) dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k + 1][j]);
      dp[i][j] += rangeSum(i, j);
    }
  return dp[0][n - 1];
}
```

## 六、LIS 二分优化的常见变体

| 变体 | 二分条件 | 含义 |
| --- | --- | --- |
| 最长**严格递增**子序列 | lowerBound（第一个 ≥x）替换 | 相等不延长 |
| 最长**不降**子序列 | upperBound（第一个 >x）替换 | 相等可延长 |
| 俄罗斯套娃信封 | 宽升序、宽相同高降序，再对高做严格 LIS | 二维偏序 |
| 最长递减子序列 | 对 `-a[i]` 求 LIS，或反向 lowerBound | 翻转比较 |

## 七、易错点清单

- **状态定义混淆**：LCS 是「前 i 前 j」（双序列），LIS 是「以 i 结尾」（单序列）——别混。
- **LIS 二分用错二分**：严格递增必须用 `lowerBound`（第一个 ≥），用 `upperBound` 会把相等的也算进来。
- **LIS 答案取错**：朴素版答案是 `max(dp[i])`，不是 `dp[n-1]`（LIS 不一定以末尾结尾）。
- **编辑距离边界**：`dp[0][j]=j`、`dp[i][0]=i`，不是 0——空串变 j 长度需 j 次操作。
- **编辑距离转移漏项**：不等时是 `1+min(改,删,增)` 三项，漏掉任一项会少算一种操作。
- **区间 DP 不按长度枚举**：按下标 i 递增枚举会用到未算的子区间——最高频 bug。
- **最长回文「子串」vs「子序列」**：子串要求连续（是否回文），子序列不连续（长度）；转移不同。
- **石子合并忘加区间和**：`dp[i][j]=min(...)+sum[i..j]`，漏掉 `+sum` 把合并代价算丢。
- **石子合并内层不枚举 k**：区间 DP 必须枚举断点 k 从 i 到 j-1，否则只考虑了一种切法。
- **滚动数组覆盖左上角**：LCS/编辑距离压一维时，`dp[i-1][j-1]` 要用临时变量暂存，否则被本行新值覆盖。
- **区间和不用前缀和**：石子合并内层再循环算 `sum[i..j]` 会把 O(n³) 退化到 O(n⁴)。
- **区间 DP 空间优化难**：`dp[i][j]` 依赖 `dp[i+1][j-1]`（下一行）和同行，难压一维，一般保留 O(n²)。

## 八、进阶方向（链接其他叶）

- **DP 基础与背包**：状态/转移心智模型的源头 —— 见[动态规划基础](../dp-basics/) 叶
- **进阶 DP（树/数位/换根）**：状态落在树结构或数位上 —— 见进阶 DP 叶
- **字符串算法**：编辑距离是字符串 DP 的代表，配合 KMP、后缀数组 —— 见字符串匹配叶
- **前缀和**：区间 DP 求区间和的基础 —— 见[前缀和与差分](../../data-structures/basic/array/guide-line/prefix-sum-and-difference) 叶

## 权威链接

- [最长公共子序列 - 维基百科](https://zh.wikipedia.org/wiki/%E6%9C%80%E9%95%BF%E5%85%AC%E5%85%B1%E5%AD%90%E5%BA%8F%E5%88%97)
- [Longest Increasing Subsequence - Wikipedia](https://en.wikipedia.org/wiki/Longest_increasing_subsequence)
- [Edit Distance (Levenshtein) - Wikipedia](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [区间 DP - OI Wiki](https://oi-wiki.org/dp/interval/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/lcs" target="_blank" rel="noopener noreferrer">LCS 可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/lis" target="_blank" rel="noopener noreferrer">LIS 可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/edit-distance" target="_blank" rel="noopener noreferrer">编辑距离可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/stone-merge" target="_blank" rel="noopener noreferrer">石子合并可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/dp-sequence-interval-slide/" target="_blank">序列与区间动态规划</a>
