---
layout: doc
outline: [2, 3]
---

# LCS 与 LIS：序列 DP 双壁

> 基于通用算法套路 · 核于 2026-07

## 速查

- **LCS（最长公共子序列）**：求两序列 `s1`、`s2` 的最长公共子序列长度（子序列**可不连续**）。
- **LCS 状态**：`dp[i][j]` = `s1` 前 i 个字符与 `s2` 前 j 个字符的 LCS 长度。
- **LCS 转移**：`s1[i-1]==s2[j-1]` 时 `dp[i][j]=dp[i-1][j-1]+1`；否则 `dp[i][j]=max(dp[i-1][j], dp[i][j-1])`。边界 `dp[0][*]=dp[*][0]=0`。O(nm) 时间 O(nm) 空间，可滚动压到 O(min(n,m))。
- **LIS（最长递增子序列）**：求序列 `a` 的最长**严格递增**子序列长度（可不连续）。
- **LIS 朴素 O(n²)**：`dp[i]` = 以 `a[i]` 结尾的 LIS 长度；`dp[i]=max(dp[j])+1`（`j<i` 且 `a[j]<a[i]`）；答案 `max(dp[i])`。
- **LIS 二分优化 O(n log n)**：维护数组 `tails`，`tails[k]` = 长度为 `k+1` 的递增子序列的**最小尾元素**；对每个 `a[i]`，二分找 `tails` 中第一个 `≥a[i]` 的位置替换之（找不到就追加）；最终 `tails.length` 即 LIS 长度。
- **LIS 二分的直觉**：尾元素越小，后面越容易接更长——所以同等长度下只保留尾最小的那一条。
- **复杂度**：LCS O(nm)；LIS O(n²)→O(n log n)。
- **空间优化**：LCS 滚动数组（注意 `dp[i-1][j-1]` 要用临时变量暂存，否则被覆盖）；LIS 二分版只需一个一维 `tails`。
- **输出具体序列**：LCS 从 `dp[n][m]` 回溯（相等则取字符斜上走，否则往较大的方向走）；LIS 二分版**不能直接回溯**（`tails` 被覆盖），要还原得记录前驱或用朴素版。
- **变体**：最长公共子串（要求连续）→ 滑窗或 `dp[i][j]=s1[i]==s2[j]?dp[i-1][j-1]+1:0`；最长递减/不降子序列 → 改比较方向或二分条件；俄罗斯套娃信封 → 二维排序后一维 LIS；最长递增子序列个数 → 树状数组/DP 计数。
- **易错**：LCS 是「前 i 个」不是「以 i 结尾」（区别于 LIS）；LIS 二分用 `lowerBound`（第一个 ≥）替换，不是追加；求「个数」不能用二分长度版。

## 一、LCS：两序列的公共子序列

### 状态与转移

设 `dp[i][j]` 表示 `s1` 的前 i 个字符与 `s2` 的前 j 个字符的最长公共子序列长度。考虑最后一步：`s1[i-1]` 和 `s2[j-1]` 这两个字符是否「配对」？

- **若 `s1[i-1] == s2[j-1]`**：这两个字符可以同时作为公共子序列的末尾，答案 = `s1` 前 i-1 与 `s2` 前 j-1 的 LCS 再 +1，即 `dp[i][j] = dp[i-1][j-1] + 1`。
- **若 `s1[i-1] != s2[j-1]`**：这两个字符至少有一个不在公共子序列末尾，答案 = 「丢掉 `s1[i-1]`」和「丢掉 `s2[j-1]`」两者的较大值，即 `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`。

边界：`dp[0][*] = dp[*][0] = 0`（空串与任何串的 LCS 为 0）。答案在 `dp[n][m]`。

```js
function lcs(s1, s2) {
  const n = s1.length, m = s2.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;          // 字符相等：斜上 +1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // 否则：左/上取大
      }
    }
  }
  return dp[n][m];
}
```

### 手算示例

`s1 = "abcde"`、`s2 = "ace"`，LCS = `"ace"`，长度 3。填表时 `dp[i][j]` 在 `a/a`、`c/c`、`e/e` 处沿对角线 +1，其余取左/上较大。**关键直觉**：表格的「对角线 +1」对应匹配的字符，回溯这些对角线步骤即可还原出 LCS 本身。

### 回溯还原 LCS 序列

从 `dp[n][m]` 出发：若 `s1[i-1]==s2[j-1]` 且 `dp[i][j]==dp[i-1][j-1]+1`，则该字符属于 LCS，记录并走到 `(i-1,j-1)`；否则往 `dp[i-1][j]`、`dp[i][j-1]` 中较大者走。逆序输出即得 LCS。

### 空间优化（滚动数组）

由于 `dp[i][j]` 只依赖「上一行」和「本行左侧」，可用两行滚动。但注意 `dp[i-1][j-1]`（左上角）在内层循环开始前要先用一个临时变量 `prev` 暂存，否则算 `dp[i][j]` 时左上角已被本行的新值覆盖。

```js
function lcsOpt(s1, s2) {
  const n = s1.length, m = s2.length;
  let prev = new Array(m + 1).fill(0);     // 上一行
  for (let i = 1; i <= n; i++) {
    const cur = new Array(m + 1).fill(0);
    for (let j = 1; j <= m; j++) {
      if (s1[i - 1] === s2[j - 1]) cur[j] = prev[j - 1] + 1;
      else cur[j] = Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[m];
}
```

## 二、LIS：单序列的递增子序列

### 朴素 O(n²) DP

`dp[i]` 表示**以 `a[i]` 结尾**的最长递增子序列长度。要扩展 `a[i]`，必须找一个前驱 `j<i` 满足 `a[j]<a[i]`，接在它后面：

```js
function lisN2(a) {
  const n = a.length;
  const dp = new Array(n).fill(1);          // 至少包含 a[i] 自身，长度 1
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
  }
  return Math.max(...dp);                    // 答案是所有 dp[i] 的最大值
}
```

注意「以 i 结尾」的含义：LIS **不一定**以最后一个元素结尾，所以答案是 `max(dp[i])` 而非 `dp[n-1]`。

### 二分优化 O(n log n)

朴素法的瓶颈是「为每个 i 找 `a[j]<a[i]` 中 `dp[j]` 最大的 j」。换个角度：**长度相同时，尾元素越小越有利**（后面越容易接得更长）。维护数组 `tails`，其中 `tails[k]` = 所有长度为 `k+1` 的递增子序列中**最小的尾元素**。可以证明 `tails` 严格递增，于是对每个新元素 `a[i]`：

- 在 `tails` 中二分找**第一个 `≥ a[i]`** 的位置 `p`（`lowerBound`）；
- 若找到，用 `a[i]` 替换 `tails[p]`（出现了同等长度但尾更小的子序列）；
- 若 `a[i]` 比 `tails` 所有元素都大，则追加（得到了更长的子序列）。

最终 `tails.length` 就是 LIS 长度。

```js
function lisBinary(a) {
  const tails = [];                          // tails[k] = 长度 k+1 的最小尾元素
  for (const x of a) {
    let lo = 0, hi = tails.length;           // lowerBound：第一个 >= x 的位置
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      tails[mid] >= x ? (hi = mid) : (lo = mid + 1);
    }
    if (lo === tails.length) tails.push(x);  // x 比所有都大：延长
    else tails[lo] = x;                       // 否则：替换，让尾更小
  }
  return tails.length;
}
```

### 二分优化的直觉与陷阱

- **直觉**：`tails` 并不是某一个真实的 LIS，而是「各长度最优尾元素的快照」。替换操作不会改变 `tails` 长度，但让后续更长成为可能。
- **陷阱一**：必须用 `lowerBound`（第一个 `≥x`），不能用 `upperBound`（第一个 `>x`）——否则相等的元素会错误地延长序列，破坏「严格递增」。若题目要求「**不降**」（允许相等），才用 `upperBound`。
- **陷阱二**：`tails.length` 给的是**长度**，要还原具体序列得另维护 `predecessor` 指针或用朴素版回溯——二分版直接读 `tails` 是错的（它被替换过）。

## 三、LCS 与 LIS 对比

| 维度 | LCS | LIS |
| --- | --- | --- |
| 序列数 | 两个 `s1`、`s2` | 一个 `a` |
| 状态 | `dp[i][j]`（前 i、前 j） | `dp[i]`（以 i 结尾） |
| 复杂度 | O(nm) | O(n²) → O(n log n) |
| 优化 | 滚动数组压空间 | 二分压时间 |
| 还原序列 | 可从 `dp` 表回溯 | 朴素版可回溯；二分版需另存前驱 |

两者的共同点是「**子序列可不连续**」。若要求**连续**，LCS 退化成「最长公共子串」（转移改成相等时 +1、不等时归 0），LIS 退化成 Kadane 风格的最大递增子段。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/lcs" target="_blank" rel="noopener noreferrer">LCS 可视化演示</a> —— 状态转移表的逐格填充与对角线匹配
- <a href="https://algo.illegalscreed.cn/docs/lis" target="_blank" rel="noopener noreferrer">LIS 可视化演示</a> —— 朴素 O(n²) 与二分 O(n log n) 的 `tails` 数组演化

## 下一步

序列 DP 的两壁吃透后，下一步进入「**编辑距离**」与「**区间 DP**」——前者是双序列 DP 的又一经典（增删改 min），后者把状态从「前 i 个」推广到「区间 `[i, j]`」，见[编辑距离与区间 DP](./edit-distance-interval)。
