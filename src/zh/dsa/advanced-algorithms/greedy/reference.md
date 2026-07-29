---
layout: doc
outline: [2, 3]
---

# 参考：贪心 API、模型与证明速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **定义**：每步做当前最优选择，不回退不枚举，期望局部最优叠加成全局最优。
- **成立两条件**：①**贪心选择性质**（每步贪心选择安全，存在于某最优解）；②**最优子结构**（贪心选择后子问题最优解 + 该选择 = 原问题最优解）。缺一不可。
- **与 DP 区别**：贪心一条路走到底（快 O(n log n)，不一定对）；DP 枚举所有择优（慢 O(n²)，保底最优）。
- **两步套路**：排序键（灵魂）+ 一个 for（选或不选）= 典型贪心。
- **证明方法**：交换论证（最常用，替换最优解成贪心解且不劣化）/ 数学归纳 / 反证。
- **经典问题**：活动选择（按结束时间）、跳跃游戏（最远可达）、分发糖果（双向扫描）、Huffman（优先队列）、分数背包（单位价值）、Dijkstra/Prim/Kruskal（图贪心）。
- **失效反例**：非标准币制找零（1/3/4 凑 6）、0-1 背包（单位价值贪心）→ 改用 DP。
- **易错**：未证明就用、排序键选错、把贪心当万能、混淆分数背包与 0-1 背包。
- **交互演示**：[快速排序可视化](https://algo.illegalscreed.cn/docs/quick-sort)（贪心依赖排序）。

## 一、贪心成立条件对照

| 条件 | 含义 | 作用 |
| --- | --- | --- |
| 贪心选择性质 | 全局最优解可由局部最优（贪心）选择组成 | 保证「第一步贪心安全」 |
| 最优子结构 | 贪心选择后，子问题最优解 + 该选择 = 原问题最优解 | 保证「之后每步递归安全」 |

> 两者都成立 → 贪心正确。DP 只需最优子结构（不要求贪心选择性质，因 DP 枚举所有选择）。

## 二、贪心 vs DP 对比

| 维度 | 贪心 | DP |
| --- | --- | --- |
| 决策方式 | 每步只选当前最优，**不回退** | 枚举每个子问题**所有选择**择优 |
| 前提条件 | 贪心选择性质 + 最优子结构 | 最优子结构 + 重叠子问题 |
| 正确性 | **不一定对**（需证明） | 一定给最优解 |
| 时间复杂度 | O(n log n)（排序 + 扫描） | O(n²) ~ O(n³) |
| 空间 | O(1) ~ O(n) | O(n²)（状态表） |
| 典型问题 | 活动选择、Huffman、Dijkstra | 背包、LCS、编辑距离 |

**取舍口诀**：能证明局部最优 ⇒ 全局最优用贪心（快）；证明不了或有反例用 DP（保底）。

## 三、经典问题清单与代码

### 活动选择 / 区间调度（按结束时间）

```js
function activitySelection(acts) {
  acts.sort((a, b) => a.end - b.end);     // 按结束时间升序
  const res = [acts[0]];
  let lastEnd = acts[0].end;
  for (let i = 1; i < acts.length; i++)
    if (acts[i].start >= lastEnd) { res.push(acts[i]); lastEnd = acts[i].end; }
  return res;                             // O(n log n)
}
```

### 跳跃游戏 II（最少跳跃，不排序）

```js
function jump(nums) {
  let steps = 0, end = 0, maxReach = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    maxReach = Math.max(maxReach, i + nums[i]);
    if (i === end) { steps++; end = maxReach; }
  }
  return steps;                           // O(n)
}
```

### 分发糖果（双向扫描）

```js
function candy(ratings) {
  const c = new Array(ratings.length).fill(1);
  for (let i = 1; i < ratings.length; i++)           // 左→右
    if (ratings[i] > ratings[i-1]) c[i] = c[i-1] + 1;
  for (let i = ratings.length - 2; i >= 0; i--)      // 右→左取 max
    if (ratings[i] > ratings[i+1]) c[i] = Math.max(c[i], c[i+1] + 1);
  return c.reduce((s, x) => s + x, 0);               // O(n)
}
```

### Huffman 编码（贪心 + 优先队列）

```js
function huffman(freqs) {                 // [{char, freq}]
  const heap = new MinHeap((a,b) => a.freq - b.freq);
  for (const f of freqs) heap.push({ freq: f.freq, char: f.char });
  while (heap.size > 1) {
    const a = heap.pop(), b = heap.pop();
    heap.push({ freq: a.freq + b.freq, left: a, right: b });
  }
  return heap.pop();                      // Huffman 树根，O(n log n)
}
```

### 分数背包（单位价值贪心）

```js
function fractionalKnapsack(items, W) {
  items.sort((a, b) => (b.v/b.w) - (a.v/a.w));  // 单位价值降序
  let total = 0;
  for (const it of items) {
    if (W >= it.w) { total += it.v; W -= it.w; }
    else { total += it.v * (W / it.w); break; }
  }
  return total;                           // O(n log n)
}
```

### 标准币制找零（成立）

```js
function coinChangeStandard(coins, amount) {  // 如 [1,5,10,25]
  coins.sort((a, b) => b - a);           // 面值降序
  let count = 0;
  for (const c of coins) { count += Math.floor(amount / c); amount %= c; }
  return amount === 0 ? count : -1;      // O(n)，仅标准币制成立
}
```

## 四、图算法的贪心内核

| 算法 | 贪心选择 | 前提 | 复杂度 |
| --- | --- | --- | --- |
| Dijkstra | 未确定点中距离最小的 | 边权非负 | O((V+E) log V) |
| Prim | 横切边中最短的 | 连通图 | O(E log V) |
| Kruskal | 边权升序逐条加 | 并查集判环 | O(E log E) |

## 五、正确性证明方法速查

| 方法 | 核心思路 | 适用 |
| --- | --- | --- |
| **交换论证** | 把最优解逐步替换成贪心解，每步不劣化 | 最常用，活动选择、Huffman |
| **数学归纳** | 对步数归纳「前 k 步与某最优解一致」 | 标准币制找零 |
| **反证法** | 假设贪心解非最优，导出矛盾 | 辅助验证 |

### 交换论证五步模板

1. 设 OPT 为最优解，GREEDY 为贪心解。
2. 找 OPT 与 GREEDY 第一个不同选择。
3. 用 GREEDY 选择替换 OPT 对应选择，证替换后仍**合法**。
4. 证替换后目标函数**不劣化**。
5. 反复替换至 OPT = GREEDY，故 GREEDY 最优。

## 六、贪心失效反例速查

| 问题 | 失效贪心策略 | 反例 | 正确解法 |
| --- | --- | --- | --- |
| 找零（币制 1/3/4，凑 6） | 每次最大面值 | 贪心 4+1+1=3 枚，最优 3+3=2 枚 | DP（零钱兑换） |
| 0-1 背包（容量 50） | 单位价值降序全装 | 贪心 160，最优 B+C=220 | DP（0-1 背包） |
| 活动选择 | 按开始时间 / 时长排序 | 长活动挤掉多个短活动 | 按结束时间 |

## 七、易错点清单

- **未证明就用贪心**：「看起来对」不等于「证明对」，没交换论证就贸然写贪心，极可能挂——最高频坑。
- **排序键选错**：活动选择按开始时间 / 时长排序都错，必须按结束时间；Huffman 必须按频率升序。
- **混淆分数背包与 0-1 背包**：分数背包（可分割）单位价值贪心成立；0-1 背包（不可分割）贪心失效，需 DP。
- **非标准币制误用贪心**：标准币制（1/5/10/25）找零贪心成立，非标准（如 1/3/4）失效，需 DP。
- **Dijkstra 用于负权图**：贪心选择性质依赖非负权，负权图必须用 Bellman-Ford / SPFA。
- **分发糖果只单向扫描**：约束是双向的（左邻、右邻都要满足），必须双向扫描取 max，单方向必漏。
- **跳跃游戏 II 用排序**：跳跃游戏无需排序，是「扫最远可达」的贪心，排序反而错。
- **Kruskal 忘判环**：按边权排序逐条加，必须用并查集判是否构成环，否则不成树。
- **把贪心当万能**：贪心对的问题极快，错的问题彻底错；最优化问题先想 DP 求稳，贪心作为优化尝试。
- **证明时只看「合法」不看「不劣化」**：交换论证不仅要保证替换后合法，还要保证目标函数不变差，缺一不可。

## 八、进阶方向（链接其他叶）

- **动态规划**：贪心失效时的保底解（背包、零钱、编辑距离）—— 见[动态规划基础](../../dp-basics/) 叶
- **图算法**：Dijkstra / Prim / Kruskal 是贪心在图上的应用 —— 见[最短路径](../../graph/) 叶
- **排序**：贪心常依赖排序预处理，理解排序是理解贪心的前置 —— 见[排序](../../sorting/) 叶

## 权威链接

- [贪心算法 - 维基百科](https://zh.wikipedia.org/wiki/%E8%B4%AA%E5%BF%83%E7%AE%97%E6%B3%95)
- [Greedy Algorithms - GeeksforGeeks](https://www.geeksforgeeks.org/greedy-algorithms/)
- [Activity Selection - 经典贪心](https://en.wikipedia.org/wiki/Activity_selection_problem)
- [Huffman Coding](https://en.wikipedia.org/wiki/Huffman_coding)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/quick-sort" target="_blank" rel="noopener noreferrer">快速排序可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/greedy-slide/" target="_blank">贪心算法</a>
