---
layout: doc
outline: [2, 3]
---

# 图的工程实现与选型

> 基于通用算法套路 · 核于 2026-07

## 速查

- **邻接表实现**：外层一个长度 n 的数组，每个元素是动态数组（JS `Array`、Python `list`、C++ `vector`），存该顶点的邻居——`adj[u].push(v)`。是稀疏图的默认实现。
- **有向图存法**：每条 `(u,v)` 只在 `adj[u]` 里 push v（只存「出边」）。出度 = `adj[u].length`，入度需另建数组统计。
- **无向图存法**：每条 `{u,v}` 在 `adj[u]`、`adj[v]` **各 push 一次**（双向存），空间翻倍但 O(V+E) 量级不变。**忘记存两次是无向图最高频 bug**。
- **带权图存法**：邻接表存 `[邻居, 权重]` 二元组或对象 `{to, w}`；邻接矩阵 `a[u][v]=w`、无边存 `Infinity`（或 `0`/`-1` 视约定）。
- **输入格式**：常见为「第一行 n 顶点 m 边，随后 m 行每行 u v（带权则再加 w）」——读入后调用建图函数填充 `adj`。
- **何时用矩阵**：①稠密图（m ≈ n²）；②需要 **O(1) 判边**是否存在；③**Floyd** 多源最短路（算法本身基于矩阵的「松弛」）。
- **何时用邻接表**：①稀疏图（绝大多数现实图）；②**BFS/DFS**（要 O(度) 枚举邻居）；③**Dijkstra/Prim**（要高效遍历某顶点的邻接边）。
- **高级表示（了解）**：**十字链表**（有向图，把出边入边链在一起）、**邻接多重表**（无向图，一条边只用一个节点避免存两次）——省空间但实现复杂，竞赛面试较少手写。
- **选型一句话**：**稠密/O(1) 判边/Floyd → 矩阵；稀疏/BFS/DFS/Dijkstra → 邻接表；按边遍历/Kruskal → 边集数组**。

## 一、邻接表的实现

邻接表最主流的实现是「**外层数组 + 内层动态数组**」。下面以无权无向图为例（JS 与 Python）。

```js
// JS：无权无向图邻接表
function buildGraph(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);   // 无向图：双向各存一次
    adj[v].push(u);
  }
  return adj;
}
// 使用
const adj = buildGraph(4, [[0,1],[1,2],[2,3],[0,3]]);
// adj[0] === [1, 3]，遍历邻居：for (const w of adj[0]) ...
```

```python
# Python：无权无向图邻接表
def build_graph(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)   # 无向图：双向各存一次
        adj[v].append(u)
    return adj
# adj = build_graph(4, [(0,1),(1,2),(2,3),(0,3)])
# adj[0] === [1, 3]
```

C++ 对应写法是 `vector<vector<int>> adj(n);`，`adj[u].push_back(v);`——结构与 JS/Python 完全一致。

## 二、有向图 vs 无向图：双向存

这是图存储的**头号易错点**：

- **有向图**：边 `(u, v)` 只在 `adj[u]` 里 push v（表示「u 指向 v」）。出度 = `adj[u].length`。若要快速查入度，需另开一个 `inDeg[n]` 数组，建图时 `inDeg[v]++`。
- **无向图**：边 `{u, v}` 要在 `adj[u]` 和 `adj[v]` **各 push 一次**（视为两条方向相反的有向边）。这样从 u 能到 v、从 v 也能到 u。**只存一次会导致边变成有向**，这是无向图最常见的 bug。

```js
// 有向图建图：只存出边
for (const [u, v] of edges) {
  adj[u].push(v);     // 注意：没有 adj[v].push(u)
  inDeg[v]++;         // 顺便统计入度（拓扑排序常用）
}
// 无向图建图：双向存
for (const [u, v] of edges) {
  adj[u].push(v);
  adj[v].push(u);     // 必须再存一次反向
}
```

## 三、带权图：存权重

带权图只需在邻接表/矩阵里**多存一个权重**。邻接表里每个邻居从「编号」升级为「`[编号, 权重]`」或对象 `{to, w}`；邻接矩阵 `a[u][v]` 直接存权重，无边处填 `Infinity`（带权最短路里 `∞` 表示不可达）。

```js
// 带权有向图邻接表：存 [邻居, 权重]
function buildWeighted(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  return adj;
}
const adj = buildWeighted(3, [[0,1,5],[1,2,3],[0,2,9]]);
// adj[0] === [[1,5],[2,9]]，遍历：for (const [v, w] of adj[u]) ...

// 带权邻接矩阵：a[u][v]=w，无边填 Infinity
function buildWeightedMatrix(n, edges) {
  const a = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  for (let i = 0; i < n; i++) a[i][i] = 0;     // 对角线 = 0（自身到自身）
  for (const [u, v, w] of edges) a[u][v] = w;  // 有向；无向则再加 a[v][u]=w
  return a;
}
```

带权图的 Dijkstra 从 `adj[u]` 取出 `[v, w]`，用权重 `w` 松弛距离——这是图算法叶的内容，本叶只确认「权重存在哪里」。

## 四、图的输入格式与建图

竞赛/面试里图的输入通常是固定格式，掌握「读入 → 建图」的模板能省大量时间。最常见格式：

```
4 4          ← 第一行 n 顶点 m 边
0 1          ← 随后 m 行，每行一条边（u v）
1 2          （带权图则 u v w）
2 3
0 3
```

```js
// 标准建图模板（无权无向图）
const input = `4 4
0 1
1 2
2 3
0 3`;
const lines = input.trim().split('\n');
const [n, m] = lines[0].split(' ').map(Number);  // n 顶点 m 边
const adj = Array.from({ length: n }, () => []);
for (let i = 1; i <= m; i++) {
  const [u, v] = lines[i].split(' ').map(Number);
  adj[u].push(v);
  adj[v].push(u);     // 无向图双向存
}
// 带 1-based 编号的题（顶点编号 1..n），读入后 u-1、v-1 转 0-based，或直接开 n+1 长度数组
```

**1-based 编号陷阱**：很多题给顶点编号 `1..n`（而非 `0..n-1`），要么读入后 `u-1; v-1` 转 0-based，要么直接开长度 `n+1` 的数组用 1-based 下标——两种都行，但要**前后一致**。

## 五、何时用矩阵 vs 邻接表

| 场景 | 选矩阵 | 选邻接表 | 理由 |
| --- | --- | --- | --- |
| 稠密图（m ≈ n²） | ✅ | — | 矩阵空间不浪费，查边 O(1) |
| 稀疏图（m ≪ n²） | — | ✅ | 表空间 O(V+E) 远胜 O(n²) |
| 需要 O(1) 判边存在 | ✅ | — | `a[u][v]` 直接读 |
| BFS / DFS | — | ✅ | 要 O(度) 枚举邻居 |
| **Floyd** 多源最短路 | ✅ | — | 算法基于矩阵松弛 |
| **Dijkstra** 单源最短路 | — | ✅ | 要高效遍历邻接边 |
| **Prim** 最小生成树 | ✅（稠密） | ✅（稀疏） | 稠密用矩阵版 O(n²)，稀疏用堆+表 |
| **Kruskal** 最小生成树 | — | （+边集数组） | 要按权重排序所有边 |
| 频繁加/删边（已知位置） | ✅ | 表 O(1) 加 / O(度) 删 | 矩阵加删都 O(1) |

一句话：**邻接表是默认选择**（绝大多数图稀疏），矩阵只在「稠密」「要 O(1) 判边」「Floyd」时才用。

## 六、十字链表与邻接多重表（了解）

邻接矩阵空间大、邻接表对有向图查入边不便、对无向图每条边存两次——高级表示法针对这些痛点，用更精巧的链式结构：

- **十字链表（Orthogonal List，有向图）**：每条边是一个节点，同时挂在「起点的出边链」和「终点的入边链」上，查某顶点的出边、入边都 O(度)。适合需要频繁处理入边出边的有向图。
- **邻接多重表（Adjacency Multilist，无向图）**：每条无向边只用一个节点表示（而非邻接表的两个方向各一份），通过两个指针分别挂到 u 和 v 的链上——**省掉无向图边存两次的冗余**，删边也更直接。

这两者在**教科书**里重要（体现「用指针换空间」的设计思想），但**竞赛/面试几乎不手写**——动态数组版邻接表已经够用，且更易调试。了解其设计动机即可。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/graph" target="_blank" rel="noopener noreferrer">图的表示可视化演示</a> —— 有向/无向、带权/无权不同存法的对比

## 下一步

理解了实现与选型后，完整的速查表、代码模板、选型决策树与易错点清单见[参考](../reference)。之后进入图算法叶——BFS、DFS、Dijkstra、拓扑排序等都建立在「图已按本叶方式存好」的前提上。
