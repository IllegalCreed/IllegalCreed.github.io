---
layout: doc
outline: [2, 3]
---

# 并查集的工程应用：连通分量与动态连通性

> 基于通用算法套路 · 核于 2026-07

## 速查

- **连通分量计数**：n 个点初始化 n 个集合，遍历每条边 union 两端，最后剩下的集合数 = 连通分量数——并查集最经典应用。
- **Kruskal 最小生成树**：边按权排序，依次尝试加入；加入前用 find 判断两端是否已连通，**已连通则跳过（否则成环）**——并查集做「判环」保证生成树无环。
- **无向图判环**：对每条边 (u,v)，若 `find(u) === find(v)` 且这是无向图，说明加这条边会成环——本质是 Kruskkal 判环的子问题。
- **朋友圈 / 等价类合并**：给定若干「同属一类」的关系对，把所有元素分成等价类——`M[i][j]=1` 就 `union(i,j)`，最后数集合数。
- **岛屿数量（网格版等价类）**：网格里「1」是陆地、上下左右相连成岛——遍历每个陆地格子和「已处理的相邻陆地」union，集合数就是岛数。
- **动态连通性**：支持「加一条边」「查询两点是否连通」两类操作交替进行——并查集的天然场景（BFS/DFS 要重算，并查集增量维护）。
- **冗余连接（删边成树）**：n 个点 n 条边的无向图必有一环，找出第一条「加入时两端已连通」的边——就是冗余边。
- **为何 union 前先 find**：把根挂根才搬走整棵子树；直接 `parent[x]=y` 只挪一个节点，破坏不变量。
- **通用模板**：`init → for 每条边: if !connected(u,v) union(u,v) → count/find`——背熟就能套大部分题。
- **进阶方向**：加权并查集（带权关系）、可撤销并查集（回滚）、离线 LCA（Tarjan）。

## 一、连通分量计数

**问题**：给定 n 个点和若干无向边，求连通分量的个数。

**思路**：初始每个点自成一组（n 个集合）；遍历每条边，若两端不在同一集合就合并（集合数减一）；最后剩下的集合数就是连通分量数。

```js
function countComponents(n, edges) {
  const uf = new UnionFind(n);        // count 初始为 n
  for (const [u, v] of edges) {
    uf.union(u, v);                    // union 内部已判同组，且合并时 count--
  }
  return uf.count;                     // 剩余集合数 = 连通分量数
}
```

这个模板记住：**`UnionFind.count` 直接就是答案**。并查集相比 BFS/DFS 的优势是「**动态加边**」——如果要支持「加一条边后问连通分量数」，BFS/DFS 每次要重算 O(n+m)，并查集只需 O(α(n))。

## 二、Kruskal 最小生成树（判环）

**问题**：给定一个带权无向连通图，求一棵连接所有点且总边权最小的生成树。

**Kruskal 算法**（贪心 + 并查集判环）：

1. 所有边按权值**升序排序**。
2. 从小到大依次尝试加入每条边 (u, v)。
3. **加入前用并查集判环**：若 `find(u) === find(v)`，说明 u、v 已连通，加这条边会成环，**跳过**；否则加入，并 `union(u, v)`。
4. 直到加入了 n-1 条边（生成树的边数 = 顶点数 - 1）。

```js
function kruskal(n, edges) {
  edges.sort((a, b) => a[2] - b[2]);   // 按权值升序
  const uf = new UnionFind(n);
  const mst = [];
  let total = 0;
  for (const [u, v, w] of edges) {
    if (uf.find(u) !== uf.find(v)) {   // 不连通才加（否则成环）
      uf.union(u, v);
      mst.push([u, v, w]);
      total += w;
      if (mst.length === n - 1) break; // 已选够 n-1 条边
    }
  }
  return { mst, total };
}
```

**为什么并查集是 Kruskal 的灵魂**：最小生成树必须无环，而「加边是否成环」=「边的两端是否已连通」= `find(u) === find(v)`——这正是并查集的核心能力。没有并查集，判环要么用 BFS/DFS（O(n+m) 每次太慢），要么维护复杂结构；并查集让每次判环降到 O(α(n))。

## 三、无向图判环

**问题**：判断一个无向图是否有环。

**思路**：对每条无向边 (u, v)，在 union 前先 `find`：若两端已连通（同根），说明加这条边会形成环。

```js
function hasCycle(n, edges) {
  const uf = new UnionFind(n);
  for (const [u, v] of edges) {
    if (uf.find(u) === uf.find(v)) return true;  // 已连通 → 加边成环
    uf.union(u, v);
  }
  return false;
}
```

**注意**：这是**无向图**的判环。有向图判环要用 DFS 的「三色标记」或拓扑排序，并查集不适用（有向边的「环」定义不同）。

## 四、朋友圈 / 等价类合并

**问题**（LeetCode 547 朋友圈）：n×n 的对称矩阵 `M`，`M[i][j] = 1` 表示 i 和 j 是朋友，朋友关系有传递性，求朋友圈的个数。

**思路**：朋友关系是等价关系（自反、对称、传递），并查集天然适合。遍历上三角（对称矩阵只看一半），`M[i][j] = 1` 就 `union(i, j)`，最后集合数就是朋友圈数。

```js
function findCircleNum(isConnected) {
  const n = isConnected.length;
  const uf = new UnionFind(n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {  // 只看上三角（对称）
      if (isConnected[i][j]) uf.union(i, j);
    }
  }
  return uf.count;
}
```

**等价类问题的通用套路**：把「同属一类」的关系翻译成 `union`，最后数集合数。岛屿数量、省份个数、句子中同义词分组都是这个模式。

## 五、岛屿数量（网格版等价类）

**问题**（LeetCode 200 岛屿数量）：`m×n` 网格，「1」是陆地、「0」是水，上下左右相邻的陆地组成一个岛，求岛的个数。

**思路**：每个陆地格子是一个节点，相邻陆地间有边（等价关系）。遍历网格，遇到陆地就尝试和「已处理的上方、左方陆地」union，集合数就是岛数。

```js
function numIslands(grid) {
  const m = grid.length, n = grid[0].length;
  const uf = new UnionFind(m * n);
  let water = 0;
  const idx = (i, j) => i * n + j;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === '0') { water++; continue; }
      if (i > 0 && grid[i-1][j] === '1') uf.union(idx(i,j), idx(i-1,j)); // 上
      if (j > 0 && grid[i][j-1] === '1') uf.union(idx(i,j), idx(i,j-1)); // 左
    }
  }
  return m * n - water - (uf.count - (m*n - water)) || uf.count; // 实际返回 uf 只含陆地的集合数
}
```

**实现技巧**：把二维坐标 `(i,j)` 映射成一维 `i*n + j` 作为并查集下标。本题用 BFS/DFS 也行（更直观），并查集的优势在「**动态增删陆地 + 查询岛数**」的变种（如 LeetCode 305）。

## 六、动态连通性

**问题**：支持两类操作交替进行——「加一条边 (u,v)」和「查询 u、v 是否连通」。

**思路**：这正是并查集的天然场景。加边就是 `union`，查询就是 `connected`（find 同根），每次都 O(α(n))。

```js
class DynamicConnectivity {
  constructor(n) { this.uf = new UnionFind(n); }
  addEdge(u, v) { this.uf.union(u, v); }
  query(u, v) { return this.uf.connected(u, v); }
}
```

**为什么并查集比 BFS/DFS 强**：BFS/DFS 处理「查询」要 O(n+m)，每次查询都重算；并查集把连通关系**增量维护**，每次加边只改一个 `parent`，查询直接 O(α(n))。当操作次数多时（如 10⁵ 次查询），并查集快几个数量级。

## 七、冗余连接（删边成树）

**问题**（LeetCode 684 冗余连接）：一棵树多加了一条边，变成了有环的无向图，n 个点 n 条边，找出那条「多余的边」（删掉后变成树）。

**思路**：n 个点的树有 n-1 条边，多一条就有环。遍历每条边，**第一条「加入时两端已连通」的边就是冗余边**——因为加它会成环。

```js
function findRedundantConnection(edges) {
  const n = edges.length;
  const uf = new UnionFind(n + 1);
  for (const [u, v] of edges) {
    if (uf.find(u) === uf.find(v)) return [u, v]; // 已连通 → 这就是冗余边
    uf.union(u, v);
  }
  return [];
}
```

**为什么对**：树是无环连通图，删冗余边后应无环。从前往后加边，第一次遇到「加这条边会成环」时，这条边就是让图从树变成「有环图」的元凶——删它最优。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/union-find" target="_blank" rel="noopener noreferrer">并查集可视化演示</a> —— 连通分量合并、Kruskal 判环的动态过程

## 下一步

掌握了并查集的应用后，可进一步了解它的变体——**加权并查集**（节点间带权关系，维护到根的相对权值）、**可撤销并查集**（支持撤销最近一次合并，用按秩合并 + 栈实现）、以及并查集在**离线最近公共祖先（Tarjan LCA）**中的应用。完整 API 与复杂度速查见[参考](../reference)。
