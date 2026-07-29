---
layout: doc
outline: [2, 3]
---

# 背包问题与零钱兑换

> 基于通用算法套路 · 核于 2026-07

## 速查

- **0-1 背包**：n 个物品各有重量 `w[i]`、价值 `v[i]`，背包容量 W，**每件最多放一次**（0 或 1），求最大价值。状态 `dp[i][j]` = 前 i 件物品、容量 j 时的最大价值。
- **0-1 背包转移**：`dp[i][j] = max(dp[i-1][j], dp[i-1][j-w[i]] + v[i])`——即「不放第 i 件」与「放第 i 件」取大；复杂度 O(n·W)。
- **0-1 背包空间优化**：`dp[i]` 只依赖 `dp[i-1]`，可压成一维 `dp[j]`，但**容量 j 必须「倒序」遍历**——正序会让一件物品被「放多次」（后写的读到本层刚写的前面值），退化成完全背包。
- **完全背包**：每件物品**无限件**可用，转移 `dp[i][j] = max(dp[i-1][j], dp[i][j-w[i]] + v[i])`（注意是 `dp[i]` 不是 `dp[i-1]`）；一维化后容量 j **正序遍历**。
- **0-1 vs 完全的唯一区别**：一维化时**容量倒序（0-1） vs 正序（完全）**——这是背包家族最核心的细节。
- **零钱兑换 II（组合数）**：用不限数量的硬币凑成金额 amount 的**组合数**——本质是完全背包求方案数，`dp[j] += dp[j - coin]`，**外层物品内层容量（正序）**求「组合」（不考虑顺序）。
- **零钱兑换 I（最少硬币）**：用最少硬币数凑成金额——完全背包求最小值，`dp[j] = min(dp[j], dp[j - coin] + 1)`。
- **求组合数 vs 求排列数**：外层物品内层容量 → 组合（不区分顺序）；外层容量内层物品 → 排列（区分顺序）。零钱兑换 II 问组合用前者，爬楼梯问排列用后者。
- **初始化**：求最大值 `dp` 初始化为 `-∞`（或 0，看题意），`dp[0]=0`；求组合数 `dp[0]=1`（凑 0 元有 1 种「什么都不选」方案）。
- **复杂度**：背包类统一 O(n·W) 时间；空间 O(n·W) 可优化到 O(W)。
- **进阶顺序**：本文 → [DP 设计方法与常见模型](./design-method) → [参考](../reference)。

## 一、0-1 背包：选或不选

n 个物品，第 i 件重量 `w[i]`、价值 `v[i]`，背包容量 W，**每件最多放一次**，求能装的最大价值。这是 DP 的「Hello World」。

### 状态定义与转移

定义 `dp[i][j]` = **只考虑前 i 件物品、背包容量为 j 时**的最大价值。对第 i 件物品，只有两种选择：

- **不放**：价值继承前 i-1 件在容量 j 下的结果，`dp[i-1][j]`。
- **放**（前提 `j >= w[i]`）：占掉 `w[i]` 容量、获得 `v[i]` 价值，剩余容量 `j-w[i]` 给前 i-1 件，`dp[i-1][j-w[i]] + v[i]`。

取两者最大：

```
dp[i][j] = max(dp[i-1][j],  dp[i-1][j - w[i]] + v[i])   当 j >= w[i]
dp[i][j] = dp[i-1][j]                                   当 j <  w[i]
```

边界：`dp[0][j] = 0`（0 件物品价值为 0）、`dp[i][0] = 0`（容量 0 装不下任何东西）。

### 二维实现

```js
function knapsack01(w, v, W) {
  const n = w.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= W; j++) {
      dp[i][j] = dp[i - 1][j];                       // 不放
      if (j >= w[i - 1]) {                           // 放（注意物品下标 i-1）
        dp[i][j] = Math.max(dp[i][j], dp[i - 1][j - w[i - 1]] + v[i - 1]);
      }
    }
  }
  return dp[n][W];
}
```

复杂度 O(n·W) 时间、O(n·W) 空间。

## 二、空间优化：一维化与倒序遍历

观察转移：`dp[i][j]` 只依赖**上一行** `dp[i-1][...]`，与再早的行无关。所以可以只保留一行，用一维 `dp[j]` 滚动——但**容量 j 必须倒序遍历**，否则一件物品会被「放多次」。

### 为什么倒序

一维化后，`dp[j] = max(dp[j], dp[j - w[i]] + v[i])`。如果 j **正序**（从小到大），算 `dp[j]` 时 `dp[j - w[i]]` 可能是**本层刚更新的值**（已经放了第 i 件），再放一次就成了「放两件」——退化成完全背包。**倒序**（从大到小）则保证算 `dp[j]` 时 `dp[j - w[i]]` 还是上一轮（i-1）的旧值，每件只放一次。

```js
function knapsack01(w, v, W) {
  const n = w.length;
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < n; i++) {            // 外层遍历物品
    for (let j = W; j >= w[i]; j--) {      // 内层容量「倒序」——0-1 背包的灵魂
      dp[j] = Math.max(dp[j], dp[j - w[i]] + v[i]);
    }
  }
  return dp[W];
}
```

空间降到 O(W)。这个「倒序」细节是 0-1 背包最常考、最易错的点。

## 三、完全背包：物品无限件

完全背包：每件物品**无限件**可用。状态定义同 0-1，但转移里的「放」选项变成「放了第 i 件后，**前 i 件（含第 i 件）**在剩余容量下的最大价值」——因为还能继续放第 i 件：

```
dp[i][j] = max(dp[i-1][j],  dp[i][j - w[i]] + v[i])   注意是 dp[i] 不是 dp[i-1]
```

### 一维化：正序遍历

一维化后，`dp[j] = max(dp[j], dp[j - w[i]] + v[i])`，容量 j **正序遍历**——正好利用「本层刚更新的值」表示「这件物品还能再放」。和 0-1 背包的倒序形成镜像对比：

```js
function knapsackComplete(w, v, W) {
  const n = w.length;
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = w[i]; j <= W; j++) {      // 内层容量「正序」——完全背包的灵魂
      dp[j] = Math.max(dp[j], dp[j - w[i]] + v[i]);
    }
  }
  return dp[W];
}
```

**一句话记住**：0-1 背包容量倒序（每件一次），完全背包容量正序（每件无限次）——这是背包家族的核心细节。

## 四、零钱兑换：完全背包的变体

零钱兑换是完全背包在「求方案数 / 求最小值」上的直接应用（硬币 = 物品，面额 = 重量，金额 = 容量，硬币无限用）。

### 零钱兑换 II：求组合数（LeetCode 518）

用不限数量的硬币凑成金额 amount 的**组合数**（不区分顺序）。`dp[j]` = 凑成金额 j 的组合数，转移：`dp[j] += dp[j - coin]`。**外层遍历硬币、内层正序遍历金额**——这样保证「同一组硬币只算一次」（组合而非排列）。

```js
function change(amount, coins) {
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 1;                               // 凑 0 元有 1 种方案（什么都不选）
  for (const coin of coins) {              // 外层物品
    for (let j = coin; j <= amount; j++) { // 内层容量正序
      dp[j] += dp[j - coin];
    }
  }
  return dp[amount];
}
```

### 零钱兑换 I：最少硬币数（LeetCode 322）

用最少的硬币数凑成金额（每种无限枚）。`dp[j]` = 凑成金额 j 的最少硬币数，转移：`dp[j] = min(dp[j], dp[j - coin] + 1)`。

```js
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const coin of coins) {
    for (let j = coin; j <= amount; j++) {
      dp[j] = Math.min(dp[j], dp[j - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

### 组合数 vs 排列数：遍历顺序决定

完全背包求方案数时，**两层循环的顺序决定是组合还是排列**：

- **外层物品、内层容量** → 组合（`{1,2}` 和 `{2,1}` 算同一种）——零钱兑换 II。
- **外层容量、内层物品** → 排列（`{1,2}` 和 `{2,1}` 算两种）——爬楼梯。

直觉：外层固定物品时，同一枚硬币在所有金额上「先出现」，不会出现「2 在 1 前面」的排列，所以是组合；外层固定金额时，每个金额都枚举所有硬币做最后一步，先后顺序被显式区分，所以是排列。

## 五、背包家族速查表

| 模型 | 物品件数 | 转移（一维化） | 容量遍历 | 典型题 |
| --- | --- | --- | --- | --- |
| **0-1 背包** | 每件 0/1 | `dp[j]=max(dp[j], dp[j-w]+v)` | **倒序** | 分割等和子集、目标和 |
| **完全背包** | 每件无限 | `dp[j]=max(dp[j], dp[j-w]+v)` | **正序** | 完全背包、零钱兑换 I |
| **零钱兑换 II**（组合数） | 无限 | `dp[j]+=dp[j-coin]` | 正序，外层物品 | 凑金额组合数 |
| **爬楼梯**（排列数） | 无限 | `dp[i]+=dp[i-step]` | 正序，外层容量 | 爬楼梯方案数 |

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/knapsack" target="_blank" rel="noopener noreferrer">0-1 背包可视化演示</a> —— 状态转移表的逐格填充
- <a href="https://algo.illegalscreed.cn/docs/complete-knapsack" target="_blank" rel="noopener noreferrer">完全背包可视化演示</a> —— 物品无限件的正序填充
- <a href="https://algo.illegalscreed.cn/docs/coin-change" target="_blank" rel="noopener noreferrer">零钱兑换可视化演示</a> —— 组合数与最少硬币数

## 下一步

背包与零钱是「二维状态 + 转移 + 空间优化」的集大成练习。下一步把视角拉高，系统化 DP 的**设计方法论**（五步法）与更多一维模型（爬楼梯、打家劫舍、Kadane），见[DP 设计方法与常见模型](./design-method)。
