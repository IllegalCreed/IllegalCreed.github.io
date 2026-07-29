---
layout: doc
outline: [2, 3]
---

# Dijkstra 与 Bellman-Ford：单源最短路

> 基于通用算法套路 · 核于 2026-07

## 速查

- **Dijkstra 核心**：**贪心** + 小顶堆——维护 `d[]`（已知最短距离），每轮取出 `d[]` 最小的**未确定**顶点 `u`，标记为确定，松弛其所有出边 `relax(u,v,w)`；要求**边权非负**。
- **Dijkstra 复杂度**：堆优化 **O((V+E)log V)**（每条边松弛一次 O(E)，每次入堆出堆 O(log V)）；朴素数组版 O(V²)，适合稠密图。
- **Dijkstra 为何不能负权**：贪心假设「一旦某点 `d[]` 最小并被确定，它就不会再被更新」——这只在非负权下成立。负权时，后面可能经一条负边发现更短路径，而 `u` 已锁死，导致算错。
- **Bellman-Ford 核心**：暴力松弛**所有边**，重复 **V−1 轮**——因为任意简单最短路最多 V−1 条边，V−1 轮后必然收敛；**可处理负权**。
- **Bellman-Ford 判负环**：跑完 V−1 轮后，再对所有边松弛一次（**第 V 轮**），若仍能松弛则存在**可达的负权环**，最短路无定义。
- **Bellman-Ford 复杂度**：**O(VE)**——V−1 轮 × E 条边；空间 O(V)。朴素但稳妥，是处理负权/判负环的「保底」算法。
- **SPFA（队列优化 BF）**：只有「刚被松弛、`d[]` 变小的点」的出边才可能继续松弛别人——把这些点入队，每次出队松弛其出边，新更新的再入队。平均 O(E)，最坏仍 O(VE)。
- **SPFA 判负环**：记录每个点入队次数，若某点入队 **≥ V 次**说明它在环上被反复松弛，存在负环。
- **路径还原**：松弛时记录 `prev[v]=u`（前驱），确定后从终点沿 `prev[]` 回溯到源点即最短路径。
- **代码模板关键**：Dijkstra 用 `visited[]` 标记已确定 + 最小堆；BF 双重循环（V−1 轮 × 遍历所有边）；SPFA 用队列 + `inQueue[]` 标记。
- **易错**：Dijkstra 遇负权算错（必须换 BF）；BF 忘判第 V 轮漏检负环；SPFA 被构造数据卡成 O(VE)（竞赛慎用）；`d[u]` 出堆后要判 `visited`（同一点多版本入堆）。

## 一、Dijkstra：贪心 + 堆优化

### 算法思想

Dijkstra 的核心是**贪心**：每次从「未确定」的点里挑 `d[]` 最小的那个，**一次性确定它的最短路**，然后用它松弛邻居。这个贪心成立的**前提是边权非负**。

```
初始化：d[s]=0，其余 d[]=+∞，visited[] 全 false
建小顶堆，入 (0, s)
while 堆非空:
    (du, u) = 堆顶出堆
    if visited[u]: continue       // 旧版本跳过
    visited[u] = true             // 确定 u 的最短路
    for 每条出边 (u, v, w):
        if d[u] + w < d[v]:       // 松弛
            d[v] = d[u] + w
            prev[v] = u
            堆入 (d[v], v)
```

为什么「`d[]` 最小的未确定点可以一次性确定」？因为所有边权非负，任何「还没确定」的点要到达 `u`，都得经过某个 `d[]` ≥ `d[u]` 的点再加上非负的边，总距离一定 ≥ `d[u]`——所以 `d[u]` 已经是下界，不可能再被更新。这就是贪心的正确性证明。

### 代码实现（堆优化，邻接表）

```js
function dijkstra(graph, s, n) {
  // graph: 邻接表，graph[u] = [[v, w], ...]
  const d = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);
  d[s] = 0;
  // 小顶堆（用数组+排序模拟，工程用现成堆）
  const heap = [[0, s]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [du, u] = heap.shift();       // 取 d 最小
    if (visited[u]) continue;           // 已确定，跳过旧版本
    visited[u] = true;
    for (const [v, w] of graph[u]) {
      if (d[u] + w < d[v]) {            // 松弛
        d[v] = d[u] + w;
        prev[v] = u;
        heap.push([d[v], v]);
      }
    }
  }
  return { d, prev };
}
```

> 工程实现用真正的二叉堆（C++ `priority_queue`、JS 手写或用库），上面 `shift()` 是 O(n) 仅为示意。真正堆优化是 O(log V) 出堆，总 O((V+E)log V)。

### 复杂度

| 版本 | 数据结构 | 时间复杂度 | 适用 |
| --- | --- | --- | --- |
| 堆优化（邻接表） | 小顶堆 | **O((V+E)log V)** | 稀疏图主力 |
| 朴素（邻接矩阵） | 线性找最小 | **O(V²)** | 稠密图（E≈V²） |

- 稀疏图（E≈V）：堆优化版 O(V·2logV) ≈ O(VlogV)，远好于朴素 O(V²)。
- 稠密图（E≈V²）：堆优化版 O(V²logV)，反而比朴素 O(V²) 慢——此时用朴素版。
- 空间：邻接表 O(V+E)，堆 O(V)。

## 二、Dijkstra 为何不能处理负权

Dijkstra 的贪心前提是「`d[]` 最小的未确定点 `u` 可以一次性确定」——它假设「后面不会再发现更短的到 `u` 的路径」。但**负权会破坏这个假设**：

```
反例：s --(1)--> a --(−2)--> b，s --(2)--> b
正确最短路：s→a→b = 1+(−2) = −1
Dijkstra 执行：
  初始 d[s]=0, d[a]=d[b]=+∞
  取 s，松弛：d[a]=1, d[b]=2
  取 a（d=1 最小），确定 a，松弛：d[b]=min(2, 1+(−2))=−1
  取 b（d=−1），确定 b —— 这次侥幸对了？
```

上面侥幸是因为结构简单。真正的反例是「`b` 比 `a` 先确定」的情形：

```
反例2：s --(2)--> a，s --(3)--> b，b --(−4)--> a
正确：s→b→a = 3+(−4) = −1（比 s→a=2 更短）
Dijkstra：取 s 松弛 d[a]=2, d[b]=3；取 a（d=2 最小）确定 a=2！
  —— 但真实最短路是 −1，Dijkstra 已锁死 a=2，算错。
```

**根因**：`a` 被确定时（`d[a]=2` 最小），后面经 `b` 的负边（`b→a` 权 −4）本可得到更短的 −1，但 `a` 已被 `visited` 锁死不再更新。**负权让「先确定的不一定最优」**，贪心失效。所以**遇负权必须换 Bellman-Ford/SPFA**。

## 三、Bellman-Ford：松弛 V−1 轮，可判负环

### 算法思想

Bellman-Ford 不贪心，而是**暴力**：把所有边松弛一遍算一轮，重复 **V−1 轮**。原理是「任意简单最短路（不含环）最多 V−1 条边」，所以 V−1 轮松弛后必然收敛到真实最短路。它能处理负权（不假设非负）。

```
初始化：d[s]=0，其余 d[]=+∞
for i = 1 to V-1:                  // V-1 轮
    for 每条边 (u, v, w):           // 松弛所有边
        if d[u] + w < d[v]:
            d[v] = d[u] + w
            prev[v] = u
// 判负环：第 V 轮
for 每条边 (u, v, w):
    if d[u] + w < d[v]: 存在负权环！
```

为什么是 V−1 轮？考虑从 `s` 到某点 `v` 的最短路 `s→v1→v2→...→v`，它是一条**简单路径**（不含重复点，否则有环，环若权非负可去掉、若权为负则无最短路）。简单路径最多 V−1 条边。第 `i` 轮松弛后，`d[]` 至少收敛到「所有边数 ≤ i 的最短路」——所以 V−1 轮后收敛到所有简单最短路。

### 判负环

跑完 V−1 轮后，如果还能松弛（**第 V 轮**仍能更新某 `d[v]`），说明存在「边数 ≥ V 的最短路」——而简单路径最多 V−1 条边，多出来的边意味着有环，且能继续变小意味着**环权为负**。这就是判负环的依据。

### 代码实现

```js
function bellmanFord(edges, s, n) {
  // edges: 边集 [[u, v, w], ...]
  const d = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  d[s] = 0;
  for (let i = 1; i < n; i++) {        // V-1 轮
    for (const [u, v, w] of edges) {
      if (d[u] + w < d[v]) {           // 松弛
        d[v] = d[u] + w;
        prev[v] = u;
      }
    }
  }
  // 第 V 轮：判负环
  for (const [u, v, w] of edges) {
    if (d[u] + w < d[v]) return { hasNegCycle: true };
  }
  return { d, prev, hasNegCycle: false };
}
```

### 复杂度

- **时间**：O(VE)——V−1 轮 × E 条边。比 Dijkstra 慢，但能处理负权、判负环。
- **空间**：O(V)（只需 `d[]`、`prev[]`）+ O(E) 存边集。
- **优化空间**：若某一轮没有发生任何松弛，说明已提前收敛，可提前退出（best case 1 轮 O(E)）。

## 四、SPFA：Bellman-Ford 的队列优化

Bellman-Ford 每轮松弛**所有边**，但很多边的起点 `u` 的 `d[u]` 本轮没变，松弛它毫无意义。**SPFA（Shortest Path Faster Algorithm）**观察到：只有 `d[]` 刚变小（被松弛成功）的点的出边才可能松弛别人——于是用一个**队列**只处理这些「活跃」点。

```
初始化：d[s]=0，其余 +∞；s 入队，inQueue[s]=true
while 队列非空:
    u = 队首出队；inQueue[u] = false
    for 每条出边 (u, v, w):
        if d[u] + w < d[v]:            // 松弛成功
            d[v] = d[u] + w
            prev[v] = u
            if !inQueue[v]:
                v 入队；inQueue[v] = true
                count[v]++            // 记录入队次数
                if count[v] >= n: 存在负环！
```

- **平均复杂度**：O(E) 左右（每条边平均松弛常数次），实测常比 BF 快很多。
- **最坏复杂度**：仍 **O(VE)**——存在专门卡 SPFA 的构造数据（如网格图、菊花图），所以**竞赛里 SPFA 慎用**，求稳用 Dijkstra，必须判负环才用 SPFA/BF。
- **判负环**：记录每个点入队次数，某点入队 **≥ V 次**说明它在负环上被反复松弛。

### Dijkstra vs Bellman-Ford vs SPFA

| 维度 | Dijkstra | Bellman-Ford | SPFA |
| --- | --- | --- | --- |
| 权限制 | **非负权** | 可负权 | 可负权 |
| 复杂度 | O((V+E)logV) | O(VE) | 平均 O(E)，最坏 O(VE) |
| 判负环 | ❌ | ✅（第 V 轮） | ✅（入队 ≥ V） |
| 稳定性 | 稳 | 稳（朴素） | **易被卡** |
| 首选场景 | 非负权单源 | 负权/判负环保底 | 负权求快（竞赛慎用） |

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/dijkstra" target="_blank" rel="noopener noreferrer">Dijkstra 可视化演示</a> —— 贪心取最近顶点 + 堆优化的逐步松弛过程
- <a href="https://algo.illegalscreed.cn/docs/bellman-ford" target="_blank" rel="noopener noreferrer">Bellman-Ford 可视化演示</a> —— 暴力松弛所有边 V−1 轮及第 V 轮判负环

## 下一步

单源两大利器讲完了——Dijkstra 攻非负权、Bellman-Ford/SPFA 攻负权判负环。接下来看**全源最短路**的 Floyd-Warshall：三重循环 DP 一次求出所有点对的最短路，以及如何用四算法选型决策表搞定任意场景，见[Floyd-Warshall 与应用](./floyd-and-applications)。
