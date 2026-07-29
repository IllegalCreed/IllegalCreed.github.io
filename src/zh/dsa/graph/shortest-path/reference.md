---
layout: doc
outline: [2, 3]
---

# 参考：最短路径 API、复杂度与选型速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **核心操作**：松弛 `if (d[u]+w < d[v]) d[v]=d[u]+w`——四种算法的共同内核。
- **问题形态**：单源最短路（SSSP）→ Dijkstra/BF/SPFA；全源最短路（APSP）→ Floyd。
- **权限制分野**：非负权 → Dijkstra；可负权 → Bellman-Ford/SPFA；负权环 → 最短路无定义，只能判环报错。
- **Dijkstra**：贪心 + 堆，非负权单源，**O((V+E)logV)**；朴素数组版 O(V²) 适合稠密图。
- **Bellman-Ford**：松弛所有边 V−1 轮，可负权，**O(VE)**，第 V 轮判负环。
- **SPFA**：BF 的队列优化，平均 O(E) 最坏 O(VE)，入队 ≥ V 判负环。
- **Floyd-Warshall**：三重循环 DP 全源，`dp[i][j]=min(dp[i][j],dp[i][k]+dp[k][j])`，**O(V³) O(V²)**，V 小（≤500）/稠密图。
- **判负环**：BF 第 V 轮仍能松弛；SPFA 某点入队 ≥ V；Floyd 跑完 `dp[i][i]<0`。
- **路径还原**：松弛时记 `prev[v]=u`（单源）/ `nxt[i][j]`（Floyd 第一跳），从终点回溯到源点。
- **选型口诀**：非负单源 → Dijkstra；负权/判环 → BF/SPFA；全源小图稠密 → Floyd；全源稀疏大图 → V 次 Dijkstra。
- **传递闭包**：Floyd 变种，`min/+` 换 `||/&&`，求任意两点可达性，位运算优化 O(V³/64)。
- **交互演示**：[Dijkstra](https://algo.illegalscreed.cn/docs/dijkstra) · [Bellman-Ford](https://algo.illegalscreed.cn/docs/bellman-ford) · [Floyd-Warshall](https://algo.illegalscreed.cn/docs/floyd-warshall)。

## 一、四算法复杂度对比表

| 算法 | 问题 | 权限制 | 时间复杂度 | 空间 | 判负环 | 典型场景 |
| --- | --- | --- | --- | --- | --- | --- |
| **Dijkstra**（堆） | 单源 | **非负权** | **O((V+E)logV)** | O(V+E) | ❌ | 导航、OSPF 路由 |
| **Dijkstra**（朴素） | 单源 | 非负权 | **O(V²)** | O(V²) | ❌ | 稠密图（E≈V²） |
| **Bellman-Ford** | 单源 | **可负权** | **O(VE)** | O(V+E) | ✅ 第 V 轮 | 负权图、判负环保底 |
| **SPFA** | 单源 | 可负权 | **平均 O(E)，最坏 O(VE)** | O(V+E) | ✅ 入队≥V | BF 工程优化（竞赛慎用） |
| **Floyd-Warshall** | **全源** | 可负权（无负环） | **O(V³)** | **O(V²)** | ✅ dp[i][i]<0 | 全源、稠密小图、传递闭包 |

### 按图规模选型

- **稀疏图**（E≈V）：Dijkstra 堆优化 O(VlogV) 是单源最优；全源用 V 次 Dijkstra。
- **稠密图**（E≈V²）：单源用朴素 Dijkstra O(V²)；全源用 Floyd O(V³)。
- **V 很大**（>10⁴）：Floyd 必超时；用 Dijkstra/SPFA。
- **要判负环**：Bellman-Ford（求稳）或 SPFA（求快）。

## 二、Dijkstra 代码模板（堆优化，邻接表）

```js
function dijkstra(graph, s, n) {
  const d = Array(n).fill(Infinity), prev = Array(n).fill(-1);
  const visited = Array(n).fill(false);
  d[s] = 0;
  const heap = [[0, s]];                 // [距离, 点]
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);    // 工程用真堆，此处示意
    const [, u] = heap.shift();
    if (visited[u]) continue;            // 旧版本跳过
    visited[u] = true;                   // 确定 u
    for (const [v, w] of graph[u])
      if (d[u] + w < d[v]) {             // 松弛
        d[v] = d[u] + w; prev[v] = u;
        heap.push([d[v], v]);
      }
  }
  return { d, prev };
}
```

**注意**：`visited[u]` 出堆后判断很关键——同一顶点可能因多次松弛被入堆多个版本，只处理第一次出堆（最小的）。工程实现务必用真正的二叉堆（C++ `priority_queue`、Java `PriorityQueue`、Python `heapq`），上面 `shift()` 是 O(n) 仅为示意。

## 三、Bellman-Ford 代码模板（边集 + 判负环）

```js
function bellmanFord(edges, s, n) {
  const d = Array(n).fill(Infinity), prev = Array(n).fill(-1);
  d[s] = 0;
  for (let i = 1; i < n; i++) {          // V-1 轮
    let updated = false;
    for (const [u, v, w] of edges)
      if (d[u] + w < d[v]) { d[v] = d[u] + w; prev[v] = u; updated = true; }
    if (!updated) break;                 // 提前收敛
  }
  for (const [u, v, w] of edges)         // 第 V 轮：判负环
    if (d[u] + w < d[v]) return { hasNegCycle: true };
  return { d, prev, hasNegCycle: false };
}
```

**优化**：每轮若无任何松弛（`updated=false`）可提前退出，best case O(E)。

## 四、SPFA 代码模板（队列优化）

```js
function spfa(graph, s, n) {
  const d = Array(n).fill(Infinity), prev = Array(n).fill(-1);
  const inQueue = Array(n).fill(false), cnt = Array(n).fill(0);
  d[s] = 0;
  const queue = [s]; inQueue[s] = true;
  while (queue.length) {
    const u = queue.shift(); inQueue[u] = false;
    for (const [v, w] of graph[u])
      if (d[u] + w < d[v]) {
        d[v] = d[u] + w; prev[v] = u;
        if (!inQueue[v]) {
          queue.push(v); inQueue[v] = true;
          if (++cnt[v] >= n) return { hasNegCycle: true };  // 入队≥V判负环
        }
      }
  }
  return { d, prev, hasNegCycle: false };
}
```

## 五、Floyd-Warshall 代码模板（邻接矩阵 + 路径还原）

```js
function floyd(graph, n) {
  const dp = graph.map(r => r.slice());
  const nxt = Array.from({length: n}, (_, i) =>
    Array.from({length: n}, (_, j) => j));   // 第一跳
  for (let k = 0; k < n; k++)                // k 在最外层！
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (dp[i][k] + dp[k][j] < dp[i][j]) {
          dp[i][j] = dp[i][k] + dp[k][j];
          nxt[i][j] = nxt[i][k];
        }
  for (let i = 0; i < n; i++)                // 判负环
    if (dp[i][i] < 0) return { hasNegCycle: true };
  return { dp, nxt, hasNegCycle: false };
}
```

**初始化要点**：`graph[i][i]=0`（自反距离 0），`graph[i][j]=w`（有边），`graph[i][j]=Infinity`（无边）。对角线**必须 0**，否则松弛会算错。

## 六、选型决策树

```
要判负环吗？
├─ 是 → Bellman-Ford（稳）/ SPFA（快但易被卡）
└─ 否
   └─ 单源还是全源？
      ├─ 单源
      │  └─ 有负权吗？
      │     ├─ 是 → Bellman-Ford / SPFA
      │     └─ 否 → Dijkstra（稀疏用堆优化，稠密用朴素）
      └─ 全源
         └─ 图稠密吗？V 小（≤500）吗？
            ├─ 是 → Floyd-Warshall
            └─ 否（稀疏大图）→ 跑 V 次 Dijkstra
```

## 七、易错点清单

- **Dijkstra 遇负权算错**：贪心假设在负权下失效，必须换 BF/SPFA——最高频考点。
- **Dijkstra 忘判 `visited`**：同点多版本入堆，不判会重复处理、甚至覆盖更优解。
- **Bellman-Ford 忘判第 V 轮**：漏判负环，结果实为 −∞ 却给出有限值。
- **SPFA 被构造数据卡成 O(VE)**：网格图、菊花图专门卡 SPFA，竞赛求稳用 Dijkstra。
- **Floyd 循环顺序写错**：中转点 `k` 必须在最外层（DP 阶段），写在内层用错阶段的值。
- **Floyd 对角线初始化非 0**：`dp[i][i]` 必须 0，否则松弛会把「自反」算成负，误判负环。
- **Floyd 跑大图超时**：V > 1000 别用 Floyd，改「V 次 Dijkstra」。
- **邻接表 vs 邻接矩阵混用**：Dijkstra/BF/SPFA 配邻接表（省空间、稀疏图快）；Floyd 必须配邻接矩阵。
- **负环时最短路无定义**：可达负环的点最短路是 −∞，只能判环报错，不能给有限值。
- **路径还原忘记 `prev`/`nxt`**：只存 `d[]` 无法回溯路径，松弛时务必同步记录前驱/第一跳。
- **多源最短路用「跑 V 次」漏判**：V 次 Dijkstra 只在非负权正确；有负权要 V 次 BF（代价高）。

## 权威链接

- [Dijkstra 算法 - 维基百科](https://zh.wikipedia.org/wiki/%E6%88%B4%E5%85%8B%E6%96%AF%E7%89%B9%E6%8B%89%E7%AE%97%E6%B3%95)
- [Bellman-Ford 算法 - 维基百科](https://zh.wikipedia.org/wiki/%E8%B4%9D%E5%B0%94%E6%9B%BC-%E7%A6%8F%E7%89%B9%E7%AE%97%E6%B3%95)
- [Floyd-Warshall 算法 - 维基百科](https://zh.wikipedia.org/wiki/Floyd-Warshall%E7%AE%97%E6%B3%95)
- [Shortest Path - CP-Algorithms](https://cp-algorithms.com/graph/bellman_ford.html)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/dijkstra" target="_blank" rel="noopener noreferrer">Dijkstra</a> · <a href="https://algo.illegalscreed.cn/docs/bellman-ford" target="_blank" rel="noopener noreferrer">Bellman-Ford</a> · <a href="https://algo.illegalscreed.cn/docs/floyd-warshall" target="_blank" rel="noopener noreferrer">Floyd-Warshall</a>
- 本站幻灯片：<a href="/SlideStack/shortest-path-slide/" target="_blank">最短路径算法</a>
