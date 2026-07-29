---
layout: doc
outline: [2, 3]
---

# 应用：连通分量、最短路与拓扑

> 基于通用算法套路 · 核于 2026-07

## 速查

- **连通分量计数**：对全图每个未访问节点启动一次 DFS/BFS，**启动次数 = 连通分量数**（无向图）；有向图分「弱连通/强连通」两种。
- **无权图最短路**：BFS 的层序天然给出「到起点的边数距离」，`dist[v]=dist[u]+1` 在入队时赋值，**首次访问即最短**——DFS 做不到（要遍历所有路径比较）。
- **拓扑排序（有向无环图 DAG）**：两种方式——① **DFS 后序逆序**（处理完所有邻居再收集 u，整体逆序）；② **入度法 / Kahn**（BFS 思路：反复取入度为 0 的节点入队，删其出边）。
- **二分图判定**：**DFS/BFS 染色**，相邻节点染相反颜色，若冲突（邻居同色）则非二分图（含奇环）；等价于「能二着色」。
- **网格 flood fill**：岛屿数量（DFS 感染计数）、最大岛屿面积（DFS 累加格子数）、被围绕的区域（从边界 DFS 标记不被围的）、图像填充（经典 flood fill）。
- **探环**：DFS 三色标记（白=未访问/灰=在当前路径/黑=已完成，遇到灰即有环）；或拓扑时「节点数 ≠ V 即有环」。
- **所有路径**：DFS 回溯（不预标记 visited，而是「进入加、退出删」），枚举起点到终点的所有简单路径。
- **复杂度**：上述应用均在 DFS/BFS 之上，故都是 **O(V+E)**（邻接表）。
- **易错**：连通分量要遍历「全图」不只一个起点；拓扑只能用于 DAG，有环则无解；二分图染色要处理「非连通」（每个连通块各自染色）。

## 一、连通分量计数

**连通分量**是图中「互相可达」的最大节点集合。无向图中，对任意未访问节点启动一次 DFS/BFS，就能标记整个连通块；**启动的次数就是连通分量数**。

```js
// 无向图连通分量计数
function countComponents(V, adj) {
  const visited = new Array(V).fill(false);
  let count = 0;
  function dfs(u) {
    visited[u] = true;
    for (const v of adj[u]) if (!visited[v]) dfs(v);
  }
  for (let i = 0; i < V; i++) {      // 遍历全图（含不连通部分）
    if (!visited[i]) {
      dfs(i);                        // 标记整个连通块
      count++;                       // 启动一次 = 一个连通分量
    }
  }
  return count;
}
```

- **关键**：外层循环遍历**所有节点**，不只是单个起点——图可能不连通，每个连通块要单独启动一次遍历。
- **岛屿数量**就是网格版的连通分量：每个 `'1'` 格子是一次启动，DFS/BFS 感染整块陆地。
- **有向图**：分「弱连通分量」（把有向边当无向边后数连通块）与「强连通分量」（互相可达，需 Tarjan 或 Kosaraju 算法，超出本叶范围）。

## 二、无权图最短路（BFS 层序）

在**无权图**（或每条边权重相等的图）中，BFS 的层序**就是**最短路——第 k 层的节点到起点的最短边数恰为 k。只要在入队时记录 `dist[v] = dist[u] + 1`，`dist[target]` 就是答案。

```js
// 无权图最短路：起点 start 到所有节点的最短边数
function bfsShortestPath(V, adj, start) {
  const dist = new Array(V).fill(-1);
  const queue = [start];
  dist[start] = 0;
  while (queue.length) {
    const u = queue.shift();
    for (const v of adj[u]) {
      if (dist[v] === -1) {          // 未访问（-1 即未访问哨兵，省 visited 数组）
        dist[v] = dist[u] + 1;       // 首次访问即最短距离
        queue.push(v);
      }
    }
  }
  return dist;                       // dist[target] 为最短边数，-1 表示不可达
}
```

- **为什么 BFS 是最短路**：队列按「距离单调递增」出队——距离为 d 的节点全部出完，才轮到距离 d+1 的。所以**第一次**到达某节点的距离就是最小的，后续再遇到（已被标记）直接跳过。
- **DFS 不行**：DFS 会一条路走到底，可能绕远路先到，得到的不一定是最短——要求最短必须遍历所有路径比较，复杂度爆炸。
- **带权图**：边权不等时 BFS 失效，要用 Dijkstra（非负权）或 Bellman-Ford（可负权）——它们是 BFS 的带权推广。
- **网格最短步数**：迷宫、单词接龙、最少转换次数都是无权最短路的变体，BFS 套层序框架即可。

## 三、拓扑排序（DAG）

**拓扑排序**把有向无环图（DAG）的节点排成线性序列，使每条有向边 `u→v` 中 u 排在 v 前。典型应用：任务调度、课程表、编译依赖。有两种主流实现。

### 方法一：DFS 后序逆序

DFS 处理完一个节点的**所有邻居**后，把该节点「收集」（加入结果）；最后把结果**逆序**即得拓扑序。

```js
// DFS 后序逆序（拓扑排序）
function topoDFS(V, adj) {
  const visited = new Array(V).fill(false);
  const order = [];                  // 后序（处理完邻居才加入）
  function dfs(u) {
    visited[u] = true;
    for (const v of adj[u]) if (!visited[v]) dfs(v);
    order.push(u);                   // 邻居都处理完才收集 u（后序）
  }
  for (let i = 0; i < V; i++) if (!visited[i]) dfs(i);
  return order.reverse();            // 逆序 = 拓扑序
}
```

- **为什么逆序**：后序中，依赖（被指向的节点）先收集、被依赖（指向别人的节点）后收集；拓扑序要求「被依赖在前」，故逆序。
- **判环**：若图有环则无拓扑序——用「三色标记」（白/灰/黑）在 DFS 中遇到「灰」（当前递归路径上的节点）即检测到环。

### 方法二：入度法（Kahn 算法）

反复取「入度为 0」的节点加入结果，并删去它的所有出边（让后继入度减一），新的入度 0 节点继续——本质是 BFS。

```js
// 入度法 / Kahn（BFS 思路）
function topoKahn(V, adj) {
  const indeg = new Array(V).fill(0);
  for (let u = 0; u < V; u++) for (const v of adj[u]) indeg[v]++; // 算入度
  const queue = [];
  for (let i = 0; i < V; i++) if (indeg[i] === 0) queue.push(i);  // 入度 0 入队
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const v of adj[u]) {         // 删 u 的出边
      indeg[v]--;
      if (indeg[v] === 0) queue.push(v); // 入度归 0 入队
    }
  }
  return order.length === V ? order : []; // 节点数 ≠ V 说明有环，无拓扑序
}
```

- **判环**：若最终 `order.length < V`，说明有节点始终入度不为 0（在环里），**图有环，无拓扑序**（如课程表 II 检测能否完成所有课程）。
- **字典序最小拓扑序**：把队列换成**小顶堆/优先队列**，每次取编号最小的入度 0 节点。

## 四、二分图判定（染色）

**二分图**是能把节点分成两组、所有边都跨组的图（等价于「能二着色」「不含奇数环」）。用 DFS/BFS **染色**：起点染 0，邻居染 1，邻居的邻居染 0……若发现邻居与当前同色，则不是二分图。

```js
// 二分图判定（DFS 染色），color[u] ∈ {0,1}，-1 表示未染
function isBipartite(V, adj) {
  const color = new Array(V).fill(-1);
  function dfs(u, c) {
    color[u] = c;
    for (const v of adj[u]) {
      if (color[v] === -1) {                // 未染，染相反色
        if (!dfs(v, 1 - c)) return false;
      } else if (color[v] === c) {          // 已染且同色 → 冲突
        return false;
      }
    }
    return true;
  }
  for (let i = 0; i < V; i++) {             // 遍历全图（可能不连通）
    if (color[i] === -1 && !dfs(i, 0)) return false;
  }
  return true;
}
```

- **处理非连通**：外层遍历所有节点，每个未染色的连通块从颜色 0 开始独立染色。
- **等价表述**：二分图 ⟺ 不含奇数长度的环 ⟺ 能二着色。
- **BFS 版**同理：入队时染相反色，出队时检查邻居颜色是否冲突。

## 五、网格 flood fill 类

网格图上 DFS/BFS 的典型应用，本质都是「连通块」操作：

| 问题 | 技巧 |
| --- | --- |
| 岛屿数量（LC 200） | 遇 `'1'` 启动 DFS 感染，数启动次数 |
| 最大岛屿面积（LC 695） | DFS 累加格子数，取最大 |
| 被围绕的区域（LC 130） | 从**边界** DFS 标记不被围的 `'O'`，其余改 `'X'` |
| 图像 flood fill（LC 733） | 从起点 DFS 把连通同色区域改成新色 |
| 太平洋大西洋水流（LC 417） | 从两边界反向 BFS/DFS 求都能到达的点 |

这类问题的共同套路：**方向数组生成邻居 + 越界/障碍/已访问判断 + 原地染色或 visited 标记**。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/maze" target="_blank" rel="noopener noreferrer">迷宫 DFS/BFS 可视化演示</a> —— 网格连通与最短路的可视化

## 下一步

掌握了 DFS/BFS 的核心应用后，可回头查阅[参考](../reference)的代码模板与易错点速查，或进入图算法的进阶——带权最短路（Dijkstra）、最小生成树（Prim/Kruskal）、强连通分量（Tarjan）等独立叶。
