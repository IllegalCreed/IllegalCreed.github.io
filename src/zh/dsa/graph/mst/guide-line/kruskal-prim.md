---
layout: doc
outline: [2, 3]
---

# Kruskal 与 Prim：两种贪心策略

> 基于通用算法套路 · 核于 2026-07

## 速查

- **Kruskal 流程**：①把所有边按权**升序排序**；②逐条扫描，用**并查集**查两端点是否已属同一连通分量——**不同则加入并合并分量**、相同（会成环）则跳过；③直到选满 **n−1 条边**停。
- **Kruskal 判环**：两端点 `find` 到**同一个根** ⇒ 加入会成环 ⇒ 跳过；不同根 ⇒ 加入并 `union`——并查集是 Kruskal 的灵魂，使每次判环近似 O(1)。
- **Kruskal 复杂度**：**O(E log E)**（排序主导）+ O(E·α(n))（并查集，α 近似常数）= **O(E log E)**；空间 O(V+E)。
- **Prim 流程**：①从**任一顶点** s 出发，把它标记为已选；②维护一个**最小堆**装「连接已选集合与未选集合的边」；③每次弹出最小边，若对端未选则选中它（加入答案、标记、把它的出边加入堆），直到所有顶点都已选。
- **Prim 关键**：堆里存 `(边权, 目标顶点)`；弹出时若目标顶点**已被选**则跳过（防止旧边重复处理）；每次并入新顶点时把它的**出边**全部 push 进堆。
- **Prim 复杂度**：堆优化 **O(E log V)**（每条边至多入堆一次，堆操作 log V）；邻接矩阵朴素版每次扫全矩阵找最小 **O(V²)**。
- **稀疏选 Kruskal（O(E log E)）、稠密选 Prim（O(V²) 朴素）**：边少时排序快，边多时矩阵朴素避开 log 因子。
- **边权相等时 MST 可能不唯一**：但 Kruskal 和 Prim 得到的**总权值必然相同**；若所有边权互异则 MST 唯一，两者得到的边集合完全一致。
- **常见坑**：Kruskal 忘判 `find` 是否同根（结果含环）；Prim 堆里没跳过已选顶点（重复加边）；无向图边存成单向（漏边）；忘判图是否连通（不连通时 Kruskal 选不满 n−1 条）。

## 一、Kruskal：排序边 + 并查集判环

Kruskal 的思路直白得像教科书：**把所有边按权排好，从最便宜的挨个拿，拿得进不构成环就留下，凑够 n−1 条收工**。它对应「全局贪心」——每一次都在全图剩余边里挑最便宜的「安全边」。

### 算法步骤

1. 把所有边按**边权升序**排序（同权顺序无所谓）。
2. 初始化**并查集**：每个顶点自成一个集合。
3. 依次扫描每条边 `(u, v, w)`：
   - 若 `find(u) ≠ find(v)`（两端点不在同一连通分量，加入不会成环）→ **选中**这条边、`union(u, v)`、`ans += w`、`cnt++`。
   - 若 `find(u) == find(v)`（会成环）→ **跳过**。
4. 当 `cnt == n−1` 时停止；若扫完所有边仍 `cnt < n−1`，说明**图不连通**，无 MST（得到的是最小生成森林）。

### 判环为什么用并查集

每选一条边就把两个端点的集合合并，于是「**两个顶点是否在同一集合**」等价于「**它们当前是否已通过已选边连通**」——如果已连通，再加一条边必然成环。并查集的 `find`（带路径压缩）+ `union`（按秩合并）让每次判环和合并都是近似 O(1)（准确是 O(α(n))，α ≤ 5），这是 Kruskal 高效的关键。

### 代码实现

```js
// Kruskal：边按权排序 + 并查集判环
// edges: [{u, v, w}], n: 顶点数（顶点编号 0..n-1）
function kruskal(n, edges) {
  // 1. 并查集（带路径压缩 + 按秩合并）
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = Array(n).fill(0);
  const find = (x) =>
    parent[x] === x ? x : (parent[x] = find(parent[x])); // 路径压缩
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;          // 已在同一集合，合并失败（会成环）
    if (rank[ra] < rank[rb]) [ra, rb] = [rb, ra]; // 按秩合并
    parent[rb] = ra;
    if (rank[ra] === rank[rb]) rank[ra]++;
    return true;
  };

  // 2. 边按权升序排序
  edges.sort((a, b) => a.w - b.w);

  // 3. 逐条试加
  let ans = 0, cnt = 0;
  for (const { u, v, w } of edges) {
    if (union(u, v)) {                    // 合并成功 = 不成环 = 选中
      ans += w;
      if (++cnt === n - 1) break;         // 选满 n-1 条边
    }
  }
  return cnt === n - 1 ? ans : -1;        // -1 表示图不连通
}
```

### 复杂度分析

- **排序**：O(E log E)，是主导项。
- **并查集**：E 次 `find`/`union`，每次 O(α(n))，α(n) ≤ 5 视为常数，合计 O(E·α(n)) ≈ O(E)。
- **总计**：**O(E log E)**；空间 O(V + E)。
- 由于 `log E ≤ 2 log V`（连通图 E ≤ V²），所以 O(E log E) = O(E log V)，与 Prim 堆优化同级，但常数更小、代码更短。

## 二、Prim：从点出发，贪心选最小连边

Prim 的思路是「**从一颗种子长成一棵树**」：选一个起点，维护「已选顶点集合 S」，每次从**连接 S 与未选集合 V−S 的所有边**里挑权最小的，把对端顶点并入 S。它本质是 Dijkstra 的「变种」——只是把「累计路径长」换成了「单条边权」。

### 算法步骤（堆优化版）

1. 任选一个起点 s，标记已选，把它的**所有出边** push 进最小堆（堆元素 `(w, v)`，w 是边权、v 是对端顶点）。
2. 循环：从堆中弹出最小的 `(w, v)`：
   - 若 v **已被选** → 跳过（这是过时的边，丢弃）。
   - 若 v **未被选** → **选中**这条边（`ans += w`、`cnt++`、标记 v 已选），并把 v 的**所有出边** push 进堆。
3. 当选满 n−1 条边（或堆空）时停止。

### 为什么每次弹出的就是「跨切割的最小边」

任何时刻，「已选集合 S」和「未选集合 V−S」构成一个切割，堆里存的就是所有跨越这个切割的边（S 中顶点的出边指向 V−S 的部分）。最小堆保证弹出的总是当前最小跨边，正符合切割性质——这条边必属于 MST。

### 代码实现（堆优化）

```js
// Prim 堆优化：从点出发，最小堆选最小连边
// graph: 邻接表 graph[u] = [{v, w}], n: 顶点数
function prim(n, graph, start = 0) {
  const visited = Array(n).fill(false);
  visited[start] = true;
  // 最小堆：存 [w, v]（按 w 排序）
  const heap = new MinHeap();
  for (const { v, w } of graph[start]) heap.push([w, v]);

  let ans = 0, cnt = 0;
  while (heap.size() && cnt < n - 1) {
    const [w, u] = heap.pop();
    if (visited[u]) continue;             // 已选：过时边，丢弃
    visited[u] = true;                    // 选中 u
    ans += w;
    cnt++;
    for (const { v, w: w2 } of graph[u])  // 把 u 的出边入堆
      if (!visited[v]) heap.push([w2, v]);
  }
  return cnt === n - 1 ? ans : -1;        // -1 表示图不连通
}
```

> JS 没有内建最小堆，可用 `priority-queue` 库，或手写小顶堆，或干脆用数组 + `sort` 模拟（代价 O(E) 每次，仅适合小图）。Python 直接用 `heapq`，C++ 用 `priority_queue`。

### 邻接矩阵朴素版 O(V²)

当图用邻接矩阵存且较稠密时，朴素的 Prim 反而最优——不需要堆，每轮 O(V) 扫一遍找最小：

```js
function primMatrix(n, mat) {            // mat[i][j] = 边权或 Infinity
  const visited = Array(n).fill(false);
  const minEdge = Array(n).fill(Infinity); // 连已选集的最小边权
  minEdge[0] = 0;
  let ans = 0;
  for (let i = 0; i < n; i++) {
    let u = -1;
    for (let j = 0; j < n; j++)          // 找未选顶点里 minEdge 最小的
      if (!visited[j] && (u === -1 || minEdge[j] < minEdge[u])) u = j;
    if (minEdge[u] === Infinity) return -1; // 不连通
    visited[u] = true;
    ans += minEdge[u];
    for (let v = 0; v < n; v++)          // 用 u 的边松弛其余顶点的 minEdge
      if (!visited[v] && mat[u][v] < minEdge[v]) minEdge[v] = mat[u][v];
  }
  return ans;
}
```

### 复杂度分析

- **堆优化版**：每条边至多入堆一次（push O(log V)），共 O(E) 次入堆 → **O(E log V)**；适合**邻接表 + 稀疏图**。
- **邻接矩阵朴素版**：n 轮，每轮 O(V) 找最小 + O(V) 松弛 → **O(V²)**，与 E 无关；适合**稠密图**（E 接近 V² 时比堆版更快）。
- **空间**：堆版 O(V + E)；矩阵版 O(V²)。

## 三、两者对比与正确性

| 维度 | Kruskal | Prim |
| --- | --- | --- |
| 贪心对象 | 边（全局排序） | 顶点（局部扩展） |
| 数据结构 | 边集数组 + 并查集 | 邻接表 + 堆 / 邻接矩阵 |
| 复杂度 | **O(E log E)** | **O(E log V)** / O(V²) |
| 适合表示 | 边集数组 | 邻接表 / 邻接矩阵 |
| 适合图 | **稀疏** | **稠密**（朴素）/ 通用（堆） |
| 判连通 | 选不满 n−1 即不连通 | 堆空仍未满 n−1 即不连通 |
| 代码量 | 短（排序 + 并查集） | 中（堆 + 松弛） |

**正确性**：两者都基于**切割性质**——Kruskal 每并合两个分量等价于切了一刀选最小跨边，Prim 直接维护切割 S vs V−S 选最小跨边。所以每步选的边都是「安全边」，必然得到 MST。

**唯一性**：边权**全互异**时，MST 唯一，Kruskal 和 Prim 得到的**边集合完全相同**；存在相等权值时 MST 可能不唯一，但两者得到的**总权值必然相同**。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/kruskal" target="_blank" rel="noopener noreferrer">Kruskal 可视化演示</a> —— 边按权排序逐条加入，并查集判环
- <a href="https://algo.illegalscreed.cn/docs/prim" target="_blank" rel="noopener noreferrer">Prim 可视化演示</a> —— 从一点出发，堆选最小连边

## 下一步

会写 Kruskal 和 Prim 后，下一步是搞清**何时用哪个**——稀疏/稠密的取舍、MST 唯一性判定、以及 MST 在网络设计/聚类/近似 TSP 中的应用，见[选型与应用场景](./selection)。
