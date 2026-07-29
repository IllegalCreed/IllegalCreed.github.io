---
layout: doc
outline: [2, 3]
---

# 参考：MST API、复杂度与选型速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **MST 定义**：连通无向带权图的生成树中，**边权和最小**的那棵——n 个顶点、n−1 条边、无环、连通。
- **Kruskal**：边按权排序 + 并查集判环 → **O(E log E)**，适合稀疏图。
- **Prim（堆优化）**：从点出发，最小堆选最小连边 → **O(E log V)**，邻接表通用。
- **Prim（矩阵朴素）**：每轮 O(V) 扫最小 + 松弛 → **O(V²)**，适合稠密图。
- **稀疏选 Kruskal，稠密选 Prim（矩阵）**；中等稠密用 Prim 堆。
- **判环**：Kruskal 用并查集 `find` 是否同根；Prim 用 `visited` 跳过已选。
- **唯一性**：边权全互异则 MST 唯一；相等权值可能多解但总权相同。
- **不连通**：求最小生成森林（每分量一棵），`cnt < n−1` 即判定。
- **应用**：网络设计、聚类、近似 TSP、图像分割。
- **交互演示**：[Kruskal 可视化](https://algo.illegalscreed.cn/docs/kruskal)、[Prim 可视化](https://algo.illegalscreed.cn/docs/prim)。

## 一、复杂度对比表

| 算法 | 数据结构 | 时间复杂度 | 空间 | 适合图 |
| --- | --- | --- | --- | --- |
| Kruskal | 边集数组 + 并查集 | **O(E log E)** | O(V+E) | **稀疏图** |
| Prim（堆优化） | 邻接表 + 最小堆 | **O(E log V)** | O(V+E) | 通用 / 中等稠密 |
| Prim（矩阵朴素） | 邻接矩阵 | **O(V²)** | O(V²) | **稠密图** |
| 稠密图 E ≈ V² 时 | — | O(V² log V) vs O(V²) | — | 矩阵朴素更优 |

> 注：连通图 E ≤ V(V−1)/2 ≤ V²，故 `log E ≤ 2 log V`，O(E log E) 与 O(E log V) 同级。

## 二、Kruskal 代码模板

```js
// Kruskal：排序边 + 并查集判环
// edges: [{u, v, w}], n: 顶点数
function kruskal(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) =>
    parent[x] === x ? x : (parent[x] = find(parent[x]));
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;       // 同根：会成环
    parent[rb] = ra;
    return true;
  };

  edges.sort((a, b) => a.w - b.w);
  let ans = 0, cnt = 0;
  for (const { u, v, w } of edges) {
    if (union(u, v)) {
      ans += w;
      if (++cnt === n - 1) break;      // 选满 n-1 条
    }
  }
  return cnt === n - 1 ? ans : -1;     // -1 = 不连通
}
```

## 三、Prim 代码模板（堆优化）

```js
// Prim 堆优化：邻接表 + 最小堆
// graph[u] = [{v, w}], n: 顶点数
function prim(n, graph, start = 0) {
  const visited = Array(n).fill(false);
  visited[start] = true;
  const heap = new MinHeap();          // [w, v]
  for (const { v, w } of graph[start]) heap.push([w, v]);

  let ans = 0, cnt = 0;
  while (heap.size() && cnt < n - 1) {
    const [w, u] = heap.pop();
    if (visited[u]) continue;          // 已选：丢弃
    visited[u] = true;
    ans += w;
    cnt++;
    for (const { v, w: w2 } of graph[u])
      if (!visited[v]) heap.push([w2, v]);
  }
  return cnt === n - 1 ? ans : -1;
}
```

## 四、Prim 矩阵朴素版 O(V²)

```js
// Prim 邻接矩阵朴素：适合稠密图
function primMatrix(n, mat) {          // mat[i][j]=权或 Infinity
  const visited = Array(n).fill(false);
  const minEdge = Array(n).fill(Infinity);
  minEdge[0] = 0;
  let ans = 0;
  for (let i = 0; i < n; i++) {
    let u = -1;
    for (let j = 0; j < n; j++)        // 找未选顶点里 minEdge 最小
      if (!visited[j] && (u === -1 || minEdge[j] < minEdge[u])) u = j;
    if (minEdge[u] === Infinity) return -1; // 不连通
    visited[u] = true;
    ans += minEdge[u];
    for (let v = 0; v < n; v++)        // 松弛
      if (!visited[v] && mat[u][v] < minEdge[v]) minEdge[v] = mat[u][v];
  }
  return ans;
}
```

## 五、并查集速查（Kruskal 配套）

```js
const parent = Array.from({ length: n }, (_, i) => i);
const rank = Array(n).fill(0);
// find：路径压缩
const find = (x) => parent[x] === x ? x : (parent[x] = find(parent[x]));
// union：按秩合并，返回是否成功（false=同根会成环）
const union = (a, b) => {
  const ra = find(a), rb = find(b);
  if (ra === rb) return false;
  if (rank[ra] < rank[rb]) [ra, rb] = [rb, ra];
  parent[rb] = ra;
  if (rank[ra] === rank[rb]) rank[ra]++;
  return true;
};
```

## 六、选型决策

| 情况 | 选 | 理由 |
| --- | --- | --- |
| 稀疏图（E ≪ V²） | **Kruskal** | O(E log E) 小，排序省 |
| 稠密图（E ≈ V²） | **Prim 矩阵朴素** | O(V²) 避开 log，常数小 |
| 中等稠密 / 通用 | **Prim 堆优化** | O(E log V) 兜底 |
| 输入是边列表 | **Kruskal** | 天然契合，免建图 |
| 代码量敏感 | **Kruskal** | 排序 + 并查集最短 |
| 图不连通 | 任选（求森林） | Kruskal 自然得森林 |

## 七、易错点清单

- **Kruskal 忘判同根**：不查 `find(u)==find(v)` 直接加边 → 结果含环。务必 `union` 返回 false 时跳过。
- **Prim 堆不跳已选**：弹出顶点已 `visited` 时不 `continue` → 重复加边。每次 pop 先判 `if (visited[u]) continue`。
- **无向图边存单向**：邻接表只 push 一遍 → 漏边。无向边必须**双向**存（u→v 和 v→u）。
- **忘判连通**：图不连通时 Kruskal 选不满 n−1 条、Prim 堆空仍未满 → 应返回 −1 或森林，别默认成功。
- **起点选错**：Prim 起点**任意**都行（MST 总权与起点无关），别误以为要从「最小权边端点」出发。
- **重边 / 自环**：Kruskal 自然处理（重边排进序列，自环 `find` 同根被跳过）；Prim 邻接表需保证松弛时取**最小权边**。
- **邻接矩阵未填 Infinity**：无边位置要填 `Infinity`（或大数），否则松弛会取 0 干扰。
- **唯一性误判**：边权相等不代表一定有多 MST——只有「相等权值的边能互相替代」时才多解；总权永远相同。
- **混淆 MST 与最短路**：MST 是「连通所有点的最小总权树」，最短路是「一点到其余点的最短路径」——两者目标不同，算法不同（Prim vs Dijkstra），别套错。
- **堆实现错误**：JS 无内建堆，手写时注意下沉/上浮方向；或用库（`priority-queue`）。

## 八、Kruskal vs Prim 对照

| 维度 | Kruskal | Prim |
| --- | --- | --- |
| 贪心对象 | 边（全局排序） | 顶点（局部扩展） |
| 判环 | 并查集 `find` | `visited` 标记 |
| 数据结构 | 边集数组 + 并查集 | 邻接表 + 堆 / 邻接矩阵 |
| 复杂度 | **O(E log E)** | **O(E log V)** / O(V²) |
| 适合图 | 稀疏 | 稠密（朴素）/ 通用（堆） |
| 不连通处理 | 自然得森林 | 每分量重启 |
| 代码量 | 短 | 中 |

## 权威链接

- [最小生成树 - 维基百科](https://zh.wikipedia.org/wiki/%E6%9C%80%E5%B0%8F%E7%94%9F%E6%88%90%E6%A0%91)
- [Kruskal's Algorithm - GeeksforGeeks](https://www.geeksforgeeks.org/kruskals-minimum-spanning-tree-algorithm-greedy-algo-2/)
- [Prim's Algorithm - GeeksforGeeks](https://www.geeksforgeeks.org/prims-minimum-spanning-tree-mst-greedy-algo-5/)
- [Minimum Spanning Tree - CP-Algorithms](https://cp-algorithms.com/graph/mst_prim.html)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/kruskal" target="_blank" rel="noopener noreferrer">Kruskal 可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/prim" target="_blank" rel="noopener noreferrer">Prim 可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/mst-slide/" target="_blank">最小生成树算法</a>
