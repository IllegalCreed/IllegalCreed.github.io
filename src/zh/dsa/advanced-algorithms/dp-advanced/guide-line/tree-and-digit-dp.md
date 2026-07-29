---
layout: doc
outline: [2, 3]
---

# 树形 DP 与数位 DP

> 基于通用算法套路 · 核于 2026-07

## 速查

- **树形 DP 的计算顺序**：后序 DFS——先递归所有子节点算完，回溯时把子节点的 `f[v]` 合并成父的 `f[u]`。父永远在子之后算，这是「树上拓扑序」。
- **树形 DP 的状态**：常带第二维 `f[u][0/1]` 表示「u 节点不选 / 选」（独立集）或 `f[u]` 单值配合辅助数组（直径）。状态设计紧扣「父与子的约束关系」。
- **树的最大独立集**：`f[u][1] = w[u] + Σ f[v][0]`（选 u，子节点必不选）；`f[u][0] = Σ max(f[v][0], f[v][1])`（不选 u，子节点可选可不选）。
- **树的直径**：维护每个节点向下的最长链 `d[u]` 和次长链；直径候选 = 最长链 + 次长链；全局取最大。也可两次 BFS（任一点出发找最远点 a，再从 a 出发找最远点 b）。
- **树形 DP 复杂度**：每个节点访问一次，每条边遍历一次，`O(n)`（合并若需排序则另算）。
- **数位 DP 适用场景**：统计 `[1, R]`（或 `[L, R]`）内满足某**数位条件**的数个数——不含某数字、数位和等于 S、相邻位满足某关系、单调不降等。
- **数位 DP 核心标志 `limit`**：`limit=true` 表示前面各位都顶到上界，本位不能超过上界位；`limit=false` 表示本位 `0~9` 自由。`limit=true` 的分支少（沿上界唯一），常不记忆化。
- **数位 DP 的记忆化维度**：`(pos, limit, 其它状态)`。`limit=false` 的状态重复多，记忆化收益大；`limit=true` 的几乎不复用。
- **前缀和思想**：`count(L, R) = count(R) - count(L-1)`——把区间问题转成两个「从 1 到 N」的前缀计数。
- **数位 DP 复杂度**：`O(位数 × 状态数)`，位数 = `log R`，极快。
- **经典题映射**：树的最大独立集、树的直径、没有上司的舞会（最大独立集变体）；不含 62 的数、windy 数（相邻位差 ≥2）、数字计数。

## 一、树形 DP：后序 DFS 从叶到根

线性 DP 靠下标天然有顺序，树没有——树形 DP 用**后序遍历**制造顺序：先递归每个子节点，回溯时合并。状态挂在节点上，转移方程描述「父如何由子构成」。

### 经典 1：树的最大独立集（没有上司的舞会）

每个节点有权值 `w[u]`，选若干节点使任意两个相邻节点不同时被选，求最大权值和。状态 `f[u][0/1]` 表示「在 u 的子树里，u 不选 / 选」时的最大权值和：

- 选 u：子节点**都不能选** → `f[u][1] = w[u] + Σ f[v][0]`
- 不选 u：子节点**可选可不选** → `f[u][0] = Σ max(f[v][0], f[v][1])`

```js
// n 个节点，w[i] 为权值，children 为邻接表（0 为根）
// f[u][0]=子树最优且 u 不选；f[u][1]=子树最优且 u 选
const f = Array.from({ length: n }, () => [0, 0]);
function dfs(u, fa) {
  f[u][1] = w[u];                 // 选 u，至少有自己权值
  for (const v of children[u]) {
    if (v === fa) continue;
    dfs(v, u);                    // 后序：先算子节点
    f[u][0] += Math.max(f[v][0], f[v][1]); // 不选 u：子可选可不选
    f[u][1] += f[v][0];           // 选 u：子必不选
  }
}
dfs(0, -1);
const ans = Math.max(f[0][0], f[0][1]); // 根选或不选取最大
```

这是树形 DP 最经典的「`f[u][0/1]` + 后序合并」范式——打家劫舍的树上版本。

### 经典 2：树的直径

求树上最长的简单路径（节点序列中相邻两点在树中相邻）。DP 法：对每个节点 u 维护「从 u 向下走的最长链」`d[u]`。经过 u 的最长路径 = u 的**最长下行链 + 次长下行链**（两条链分属不同子树）。全局直径 = 所有「最长链 + 次长链」的最大值。

```js
// children 为邻接表，(v, weight) 为带权边
let diameter = 0;
const d = new Array(n).fill(0);   // d[u]=u 向下的最长链
function dfs(u, fa) {
  let max1 = 0, max2 = 0;         // 最长链、次长链
  for (const [v, w] of children[u]) {
    if (v === fa) continue;
    dfs(v, u);
    const len = d[v] + w;         // 经过 v 的下行链长度
    if (len > max1) { max2 = max1; max1 = len; }       // 更新最长
    else if (len > max2) { max2 = len; }               // 更新次长
  }
  d[u] = max1;                    // u 向下最长链
  diameter = Math.max(diameter, max1 + max2); // 经过 u 的最长路径
}
dfs(0, -1);
```

另一种做法是**两次 BFS**：任选起点 s 找最远点 a，再从 a 找最远点 b，`a-b` 即直径（仅适用无权树；带权树要用 DP 法）。

## 二、数位 DP：逐位 DP + 记忆化 + limit 标志

统计 `[1, R]` 内满足某数位条件的数个数。关键思路：把数按位拆开，从高位到低位逐位填，用 `limit` 标志记录「前面是否顶到上界」，配合记忆化。

### 经典：统计 `[1, R]` 内不含「62」的数个数

不含「62」即相邻两位不能是 6 和 2。从高位到低位 DP，记忆化 `(pos, prev, limit)`：

- `pos`：当前填第几位。
- `prev`：上一位填的数字（用于判断本位是否与上一位组成 62）。
- `limit`：前面是否都顶到上界（决定本位上界）。

```js
// s 是 R 的字符串形式；count(R) - count(L-1) 即区间答案
function count(R) {
  const s = String(R).split('').map(Number);
  const memo = new Map();
  // pos=当前位，prev=上一位数字(-1 表示无)，limit=是否受上界约束
  function dfs(pos, prev, limit) {
    if (pos === s.length) return 1;        // 填完，这是一个合法数
    const key = `${pos},${prev},${limit}`;
    if (memo.has(key)) return memo.get(key);
    const up = limit ? s[pos] : 9;         // 本位上界
    let ans = 0;
    for (let d = 0; d <= up; d++) {
      if (prev === 6 && d === 2) continue; // 排除 62
      ans += dfs(pos + 1, d, limit && d === up);
    }
    memo.set(key, ans);
    return ans;
  }
  return dfs(0, -1, true);
}
// 区间 [L, R] 答案 = count(R) - count(L - 1)
```

**关键细节**：

- **`limit` 的传递**：`limit && d === up`——只有当前面都顶到上界、且本位也顶到上界位时，下一位才继续受约束。
- **前导零**：若题意关心数的实际位数（如「不含前导零」），需额外加 `lead` 标志记录「前面是否全是 0」。本题不关心位数，可省。
- **记忆化**：`(pos, prev, limit)` 作为 key；`limit=true` 的分支因沿上界走、几乎不复用，也可只在 `limit=false` 时记忆化。

## 三、树形 DP vs 数位 DP 对比

| 维度 | 树形 DP | 数位 DP |
| --- | --- | --- |
| 状态载体 | 树的节点 `f[u]` | 数的数位 `f(pos, ...)` |
| 计算顺序 | 后序 DFS（叶到根） | 高位到低位（递归 + 记忆化） |
| 核心标志 | `fa`（避免回父） | `limit`（上界约束） |
| 典型应用 | 独立集、直径、树的最长链 | 区间内满足数位条件的计数 |
| 复杂度 | O(n) | O(log R × 状态数) |

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/tree-dp" target="_blank" rel="noopener noreferrer">树形 DP 可视化演示</a> —— 后序遍历从叶到根的状态合并
- <a href="https://algo.illegalscreed.cn/docs/digit-dp" target="_blank" rel="noopener noreferrer">数位 DP 可视化演示</a> —— 逐位 DP 与 limit 标志的传递

## 下一步

树形 DP 与数位 DP 解决了「树上结构」和「数位计数」两类问题，下一步看**换根 DP**（求每个根的答案）与** DP 优化的思想引入**，见[换根 DP 与 DP 优化](./reroot-and-optimization)。
