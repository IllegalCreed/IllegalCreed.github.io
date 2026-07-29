---
layout: doc
outline: [2, 3]
---

# 参考：图的表示 API、复杂度与选型速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：图 `G=(V,E)`，n=|V| 顶点、m=|E| 边；有向/无向、带权/无权、稠密/稀疏是三大分类维度。
- **邻接矩阵**：`n×n` 数组 `a[i][j]`，查边 **O(1)**、空间 **O(n²)**、遍历邻居 O(n)——稠密图 + Floyd + O(1) 判边。
- **邻接表**：每顶点挂动态数组存邻居，空间 **O(V+E)**、查边 O(度)、遍历邻居 **O(度)**——稀疏图 + BFS/DFS/Dijkstra/Prim 默认选择。
- **边集数组**：存 `[{u,v,w}]`，空间 **O(E)**、查边 O(E)——Kruskal + Bellman-Ford 按边遍历。
- **有向图**：边 `(u,v)` 只存出边 `adj[u].push(v)`；出度=`adj[u].length`，入度另建 `inDeg` 数组。
- **无向图**：边 `{u,v}` **双向各存一次**（`adj[u].push(v); adj[v].push(u)`）——最高频易错点。
- **带权图**：邻接表存 `[邻居, 权重]`；邻接矩阵 `a[u][v]=w`、无边填 `Infinity`、对角线 `0`。
- **稀疏/稠密**：m ≈ n² 稠密选矩阵；m ≪ n²（如 O(n)）稀疏选表。**现实图几乎都稀疏**。
- **度**：无向图度数和 = 2m（握手定理）；有向图分入度出度，度=入度+出度。
- **树是特殊图**：连通 + 无环 + 无向 + n-1 条边 = 树。树能用图的表示法，图未必是树。
- **自环/重边**：`a[v][v]` 自环；两顶点多条边为重边；二者皆无的图叫**简单图**。
- **选型决策**：稀疏 → 表；稠密或要 O(1) 判边或 Floyd → 矩阵；按边处理 → 边集数组。

## 一、三种表示法对比大表

| 维度 | 邻接矩阵 | 邻接表 | 边集数组 |
| --- | --- | --- | --- |
| **空间复杂度** | **O(n²)** | **O(V+E)** | **O(E)** |
| 是否存表示整图 | 是（含无边） | 否（只存有边） | 否（只存边） |
| 查边 `(u,v)?` | **O(1)** ✅ | O(度) | O(E) ❌ |
| 遍历 u 的邻居 | O(n)（扫一整行） | **O(度)** ✅ | O(E) ❌ |
| 遍历所有边 | O(n²) | O(V+E) | **O(E)** ✅ |
| 建图 | O(n² + m) | O(V+E) | O(E) |
| 加边 | O(1) | O(1) | O(1) |
| 删边 | O(1) | O(度) | O(E) |
| 加顶点 | **O(n²)** ❌（扩矩阵） | O(1) | O(1) |
| 求度/出度 | O(n)（数行） | **O(1)**（链表长） | O(E) |
| 适合图类型 | 稠密图 | **稀疏图** | 任意/按边 |
| 典型算法 | **Floyd**、稠密 Prim | **BFS/DFS/Dijkstra/Prim** | **Kruskal/Bellman-Ford** |

## 二、代码模板

```js
// ===== 1. 邻接矩阵（无权无向图）=====
function buildMatrix(n, edges) {
  const a = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v] of edges) { a[u][v] = 1; a[v][u] = 1; } // 无向双向
  return a;
}
// 查边：a[u][v] === 1   O(1)

// ===== 2. 邻接表（无权无向图，默认首选）=====
function buildAdjList(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); } // 无向双向
  return adj;
}
// 查边：(u,v)? → adj[u].includes(v)  O(度)
// 遍历邻居：for (const w of adj[u]) ...  O(度)

// ===== 3. 邻接表（有向图 + 入度统计，拓扑排序常用）=====
function buildDigraph(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const inDeg = new Array(n).fill(0);
  for (const [u, v] of edges) { adj[u].push(v); inDeg[v]++; } // 只存出边
  return { adj, inDeg };
}

// ===== 4. 邻接表（带权有向图）=====
function buildWeighted(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]); // [邻居, 权重]
  return adj;
}
// 遍历带权邻居：for (const [v, w] of adj[u]) ...  O(度)

// ===== 5. 带权邻接矩阵（Floyd 用，无边 Infinity、对角线 0）=====
function buildWeightedMatrix(n, edges) {
  const a = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  for (let i = 0; i < n; i++) a[i][i] = 0;
  for (const [u, v, w] of edges) a[u][v] = w; // 有向；无向加 a[v][u]=w
  return a;
}

// ===== 6. 边集数组（Kruskal 用，按权重排序）=====
function buildEdgeList(edges) {
  return edges.map(([u, v, w]) => ({ u, v, w })).sort((a, b) => a.w - b.w);
}
```

## 三、选型决策树

```
图的表示选型
│
├─ 图稠密吗？（m ≈ n²）
│    ├─ 是 → 邻接矩阵（空间不浪费，查边 O(1)）
│    └─ 否（稀疏）→ 继续
│
├─ 算法要 O(1) 判边是否存在？或用 Floyd 多源最短路？
│    ├─ 是 → 邻接矩阵
│    └─ 否 → 继续
│
├─ 算法是「按边遍历」型？（Kruskal 排序所有边 / Bellman-Ford 每轮松弛所有边）
│    ├─ 是 → 边集数组（常与邻接表并用）
│    └─ 否 → 邻接表（默认首选）
│
默认结论：现实图几乎都稀疏 → 邻接表是 90% 场景的选择
```

**口诀**：**稠密选矩阵、稀疏选表、按边遍历选边集数组；要 O(1) 判边或 Floyd → 矩阵**。

## 四、易错点清单

- **无向图边只存一次**：最高频 bug。无向图 `{u,v}` 必须在 `adj[u]`、`adj[v]` 各 push 一次，否则图变成有向、边数对不上。
- **有向图误存双向**：有向图 `(u,v)` 只存出边 `adj[u].push(v)`，若误加 `adj[v].push(u)` 就变成无向图。
- **自环 `a[v][v]`**：建图时顶点连自己（`u===v`）会形成自环。无向图矩阵对角线会变 1、邻接表 v 会在自己链表里出现两次——是否允许自环要按题意处理。
- **重边（平行边）**：两顶点间存了多条相同边。邻接矩阵天然去重（`a[u][v]` 只有一个值）；邻接表会存多份，查边或计数时要小心，需要的话建图时用 Set 去重。
- **带权图「无边」用什么填充**：邻接矩阵约定用 `Infinity`（表示不可达）、对角线用 `0`（自身到自身）；用 `0` 或 `-1` 表示「无边」时要确认权重本身不会取这些值（如非负权图用 -1 安全）。
- **1-based 编号混淆**：很多题顶点编号 `1..n`，要么读入后统一 `-1` 转 0-based，要么数组开 `n+1` 用 1-based 下标——**全程序前后必须一致**，混用会越界或漏顶点。
- **邻接矩阵忘了清零/初始化 `Infinity`**：建图前必须先把矩阵全置 0（无权）或 `Infinity`（带权），否则残留脏数据。
- **邻接表查边是 O(度) 不是 O(1)**：误以为 `adj[u].includes(v)` 是 O(1)，实际要扫链表。需要频繁 O(1) 判边就改用矩阵或额外维护 `Set`。
- **增删顶点用矩阵的代价**：邻接矩阵加一个顶点要扩成 `(n+1)×(n+1)` 并拷贝 O(n²)——频繁增顶点应改用邻接表。
- **混淆「度」与「边数」**：无向图所有顶点度数之和 = **2m**（不是 m）；有向图所有入度和 = 所有出度和 = m。
- **遍历邻居遍历整行（矩阵）**：稀疏图用矩阵做 BFS/DFS，遍历某顶点邻居要扫 n 个元素（大部分是 0），效率差——这正是稀疏图该用邻接表的原因。
- **十字链表/邻接多重表当必备**：它们是教科书的高级结构，竞赛面试几乎不手写，了解设计动机即可，别陷进去。

## 五、进阶方向（链接其他叶）

- **图算法**：本叶只解决「图怎么存」，BFS/DFS/Dijkstra/Prim/Kruskal/拓扑排序等算法实现见独立叶「图算法」组——这是本叶的直接下游。
- **树**：树是连通无环无向图，树的邻接表表示（存父子关系）见[树](../../basic/tree/) 叶。
- **并查集**：Kruskal 算法配合并查集判环，见[并查集](../union-find/) 叶（若存在）。
- **堆 / 优先队列**：Dijkstra、Prim 用最小堆取当前最短边，见[堆](../heap/) 叶。

## 权威链接

- [图（数据结构） - 维基百科](https://zh.wikipedia.org/wiki/%E5%9B%BE_(%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84))
- [Graph Representation - GeeksforGeeks](https://www.geeksforgeeks.org/graph-and-its-representations/)
- [Adjacency List vs Matrix - VisuAlgo](https://visualgo.net/en/graphds)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/graph" target="_blank" rel="noopener noreferrer">图的表示可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/graph-representation-slide/" target="_blank">图的表示</a>
