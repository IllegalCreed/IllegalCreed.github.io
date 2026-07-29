---
layout: doc
outline: [2, 3]
---

# 编辑距离与区间 DP

> 基于通用算法套路 · 核于 2026-07

## 速查

- **编辑距离（Levenshtein）**：把 `s1` 变成 `s2` 最少需要多少次**单字符操作**（增、删、改）。
- **状态**：`dp[i][j]` = `s1` 前 i 个字符变成 `s2` 前 j 个字符的最少操作数。边界 `dp[0][j]=j`（全增）、`dp[i][0]=i`（全删）。
- **转移**：`s1[i-1]==s2[j-1]` 时 `dp[i][j]=dp[i-1][j-1]`（免操作）；否则 `dp[i][j]=1+min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])`，分别对应**改、删、增**。O(nm)。
- **最长回文子串（区间 DP）**：`dp[i][j]` 表子串 `s[i..j]` 是否回文。`len==1` 为真；`len==2` 看 `s[i]==s[j]`；`len>2` 看 `s[i]==s[j] && dp[i+1][j-1]`。按长度枚举，O(n²)。
- **最长回文子序列（序列 DP）**：`dp[i][j]` 表 `s[i..j]` 内最长回文子序列长度。`s[i]==s[j]` 时 `dp[i][j]=dp[i+1][j-1]+2`；否则 `max(dp[i+1][j], dp[i][j-1])`。也可用 LCS 求 `s` 与 `reverse(s)` 的 LCS。
- **石子合并（区间 DP）**：`n` 堆石子排成一行，每次合并**相邻**两堆代价为两堆之和，求最小总代价。`dp[i][j]=min(dp[i][k]+dp[k+1][j])+sum[i..j]`，`k` 枚举断点。O(n³)。
- **区间和用前缀和**：`sum[i..j]=prefix[j+1]-prefix[i]`，O(1) 取区间和，避免内层再累加。
- **区间 DP 枚举顺序**：外层区间长度 `len`（2→n），中层左端 `i`（0→n-len），算 `j=i+len-1`，内层断点 `k`（i→j-1）。
- **平行四边形优化（四边形不等式）**：石子合并满足决策单调性，断点 `k` 的最优范围可缩到 `s[i][j-1]..s[i+1][j]`，把 O(n³) 降到 O(n²)——进阶内容，面试一般不要求。
- **复杂度**：编辑距离 O(nm)；最长回文子串/子序列 O(n²)；石子合并 O(n³)（可优化 O(n²)）。
- **易错**：编辑距离边界 `dp[0][j]=j` 不是 0；区间 DP 不按长度枚举会用到未算的子区间；最长回文「子串」与「子序列」状态语义不同（是否要求连续）。

## 一、编辑距离：增删改的 min

### 状态与转移

设 `dp[i][j]` 表示把 `s1` 的前 i 个字符变成 `s2` 的前 j 个字符所需的最少操作数。考虑 `s1[i-1]` 与 `s2[j-1]`：

- **字符相等**：`s1[i-1]==s2[j-1]`，这对字符无需操作，`dp[i][j]=dp[i-1][j-1]`。
- **字符不等**，从三种操作中取最小 +1：
  - **改**：把 `s1[i-1]` 改成 `s2[j-1]`，消耗 `dp[i-1][j-1]+1`（之后两串各退一格）。
  - **删**：删掉 `s1[i-1]`，消耗 `dp[i-1][j]+1`（`s1` 退一格，`s2` 不动）。
  - **增**：在 `s1` 末尾补一个 `s2[j-1]`，消耗 `dp[i][j-1]+1`（`s2` 退一格，`s1` 不动）。

边界：`dp[0][j]=j`（空串变成长度 j 需 j 次增）、`dp[i][0]=i`（长度 i 变空串需 i 次删）。

```js
function editDistance(s1, s2) {
  const n = s1.length, m = s2.length;
  const dp = Array.from({ length: n + 1 }, (_, i) =>
    new Array(m + 1).fill(0).map((_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];                       // 相等：免操作
      } else {
        dp[i][j] = 1 + Math.min(                           // 否则：改/删/增取最小
          dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]
        );
      }
    }
  }
  return dp[n][m];
}
```

**与 LCS 的对比**：两者状态都是 `dp[i][j]`（双序列），结构几乎一致——LCS 是「相等 +1，否则 max」，编辑距离是「相等免操作，否则 1+min」。掌握其一即可平移。

### 操作变体

- **只允许增/删（不允许改）**：转移去掉 `dp[i-1][j-1]`（改）那一项，答案会更大。本质等价于 `n+m-2×LCS`。
- **允许交换相邻字符（Damerau-Levenshtein）**：额外加 `s1[i-2]==s2[j-1] && s1[i-1]==s2[j-2]` 时的交换转移。
- **各操作带不同代价**：把 `1+min(...)` 中的三个 `1` 换成对应代价即可。

## 二、最长回文子串：区间 DP 入门

求字符串 `s` 的最长**连续**回文子串。用区间 DP：`dp[i][j]` 表示子串 `s[i..j]` 是否为回文。

- **长度 1**：`dp[i][i]=true`（单字符必回文）。
- **长度 2**：`dp[i][i+1] = (s[i]==s[i+1])`。
- **长度 >2**：`dp[i][j] = (s[i]==s[j]) && dp[i+1][j-1]`——两端相等且内部回文。

由于 `dp[i][j]` 依赖更短的 `dp[i+1][j-1]`，必须**按长度从小到大枚举**。记录过程中最长的 `j-i+1` 即答案。

```js
function longestPalindrome(s) {
  const n = s.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(false));
  let start = 0, maxLen = 1;
  for (let i = 0; i < n; i++) dp[i][i] = true;             // 长度 1
  for (let len = 2; len <= n; len++) {                      // 按长度枚举
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      if (s[i] === s[j]) {
        dp[i][j] = len === 2 ? true : dp[i + 1][j - 1];     // 两端相等 + 内部回文
        if (dp[i][j] && len > maxLen) { start = i; maxLen = len; }
      }
    }
  }
  return s.slice(start, start + maxLen);
}
```

**与「最长回文子序列」的区别**：子序列**不要求连续**，状态 `dp[i][j]` 是「`s[i..j]` 内最长回文子序列**长度**」，转移为 `s[i]==s[j]` 时 `dp[i][j]=dp[i+1][j-1]+2`，否则 `max(dp[i+1][j], dp[i][j-1])`。两者都按长度枚举，但语义（是否 vs 长度）和转移（+内部回文 vs +2/取大）不同。

## 三、石子合并：区间 DP 的标杆

### 题意

`n` 堆石子排成一行，第 `i` 堆重量 `a[i]`。每次只能合并**相邻**两堆，代价为合并后这堆的总重量。求把所有石子合并成一堆的最小总代价。

### 状态与转移

`dp[i][j]` 表示把区间 `[i, j]` 的石子合并成一堆的最小代价。最后一次合并必然是「把 `[i,k]` 合好的一堆与 `[k+1,j]` 合好的一堆」拼起来，代价为这两段的最小代价之和，再加上这次合并的代价（即整段 `[i,j]` 的石子总重）：

```
dp[i][j] = min over k in [i, j-1] of ( dp[i][k] + dp[k+1][j] ) + sum[i..j]
```

边界：`dp[i][i]=0`（单堆无需合并）。区间和 `sum[i..j]` 用前缀和 `prefix[j+1]-prefix[i]` 在 O(1) 取得。

```js
function mergeStones(a) {
  const n = a.length;
  const prefix = new Array(n + 1).fill(0);                 // 前缀和
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + a[i];
  const rangeSum = (i, j) => prefix[j + 1] - prefix[i];
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let len = 2; len <= n; len++) {                      // 区间长度从小到大
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = Infinity;
      for (let k = i; k < j; k++) {                         // 枚举断点
        dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k + 1][j]);
      }
      dp[i][j] += rangeSum(i, j);                           // 加上本次合并代价
    }
  }
  return dp[0][n - 1];
}
```

### 为什么是 O(n³)

三层循环：长度 O(n)、左端 O(n)、断点 O(n)，共 O(n³)。`n=100` 时约 1e6，可过；`n=500` 时约 1e8，需注意常数或上四边形不等式优化到 O(n²)。

### 为什么必须按长度枚举

算 `dp[i][j]` 要用到 `dp[i][k]`（区间 `[i,k]`，长度 ≤ 当前）和 `dp[k+1][j]`（区间 `[k+1,j]`，长度 ≤ 当前）。**只有按长度递增枚举，才能保证子区间先算出来**。若按下标 i 递增枚举，`dp[i+1][j-1]` 这类子区间可能尚未计算，得到 Infinity 或错误值。

## 四、区间 DP 的通用骨架

把石子合并抽象，区间 DP 的万能模板：

```js
// dp[i][j]：区间 [i,j] 上的最优解；先按长度枚举，再枚举断点
for (let i = 0; i < n; i++) dp[i][i] = /* 单点边界 */;
for (let len = 2; len <= n; len++) {
  for (let i = 0; i + len - 1 < n; i++) {
    const j = i + len - 1;
    dp[i][j] = /* 初始值（求 min 用 Infinity，求 max 用 -Infinity） */;
    for (let k = i; k < j; k++) {
      dp[i][j] = optimize(dp[i][j], combine(dp[i][k], dp[k + 1][j], i, j, k));
    }
  }
}
```

**能套这个模板的题**：石子合并、合并石头（k 堆版本）、戳气球（合并方向反过来）、矩阵连乘（代价=两矩阵行列相乘）、最长回文子串/子序列、 Burst Balloons、Remove Boxes。识别信号：**「对一个序列反复做相邻合并/消除，求最优」**。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/edit-distance" target="_blank" rel="noopener noreferrer">编辑距离可视化演示</a> —— 增删改三操作的 min 转移表
- <a href="https://algo.illegalscreed.cn/docs/stone-merge" target="_blank" rel="noopener noreferrer">石子合并可视化演示</a> —— 区间 DP 枚举断点 k 的合并过程

## 下一步

编辑距离与区间 DP 吃透后，序列区间 DP 的主力模型就齐了。下一步把所有模型、代码模板与复杂度汇总成一份速查手册，见[参考](./reference)。
