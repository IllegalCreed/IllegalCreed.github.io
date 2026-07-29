---
layout: doc
outline: [2, 3]
---

# 参考：DFS/BFS API、复杂度与应用速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **定义**：DFS 一条路走到底再回溯（栈/递归）；BFS 逐层向外扩（队列）；两者都靠 `visited` 防重复访问。
- **核心复杂度**：邻接表 **O(V+E)**，邻接矩阵 O(V²)；空间 O(V)（visited + 栈/队列）。
- **visited 时机**：DFS 递归在「进入函数首行」；DFS 迭代在「出栈且未访问」；**BFS 在「入队时」**——拖到出队/出栈会重复入队。
- **DFS 递归框架**：`dfs(u){ visited[u]=true; for(v of adj[u]) if(!visited[v]) dfs(v); }`。
- **DFS 迭代（栈）框架**：`stack=[s]; while(stack){ u=pop; if(visited[u])continue; visited[u]=true; for(v) push(v); }`——规避栈溢出。
- **BFS 队列框架**：`queue=[s]; visited[s]=true; while(queue){ u=shift; for(v) if(!visited[v]){visited[v]=true;push(v);} }`——天然层序 = 无权最短路。
- **网格方向数组**：四邻接 `[[-1,0],[1,0],[0,-1],[0,1]]`；八邻接再加四个对角。
- **选型**：找路径/连通/探环/拓扑 → DFS；求最短步数/层序 → BFS。
- **应用清单**：连通分量计数、无权最短路（BFS）、拓扑排序（DFS 后序逆序 / 入度法 Kahn）、二分图判定（染色）、网格 flood fill、所有路径（回溯）。
- **易错点**：BFS visited 时机、DFS 深图栈溢出、网格忘判越界、连通分量忘遍历全图、拓扑用于有环图。
- **交互演示**：[迷宫 DFS/BFS 可视化](https://algo.illegalscreed.cn/docs/maze)。

## 一、核心复杂度表

| 操作 | 邻接表 | 邻接矩阵 | 说明 |
| --- | --- | --- | --- |
| DFS（单连通块） | **O(V+E)** | O(V²) | 每顶点/边各访问常数次 |
| BFS（单连通块） | **O(V+E)** | O(V²) | 同上 |
| 遍历全图（含不连通） | **O(V+E)** | O(V²) | 外层套 for 每个未访问点启动 |
| 取一个节点的所有邻居 | O(度) | O(V) | 邻接表直接拿列表，矩阵扫整行 |
| 无权最短路（BFS） | **O(V+E)** | O(V²) | 层序天然最短路 |
| 空间复杂度 | O(V) | O(V) | visited + 栈/队列，最坏存 V |

## 二、DFS 代码模板

### 递归（最常用）

```js
const V = adj.length;
const visited = new Array(V).fill(false);

function dfs(u) {
  visited[u] = true;            // 进入即标记
  process(u);                  // 处理 u（访问、收集、判断）
  for (const v of adj[u]) {    // 遍历邻居
    if (!visited[v]) dfs(v);
  }
}
// 单连通块
dfs(start);
// 全图（含不连通）：每个未访问点启动
for (let i = 0; i < V; i++) if (!visited[i]) dfs(i);
```

### 迭代（显式栈，规避栈溢出）

```js
function dfsIter(start) {
  const visited = new Array(V).fill(false);
  const stack = [start];
  while (stack.length) {
    const u = stack.pop();
    if (visited[u]) continue;     // 二次判断（防重复入栈）
    visited[u] = true;
    process(u);
    for (const v of adj[u]) {
      if (!visited[v]) stack.push(v);
    }
  }
}
```

## 三、BFS 代码模板

### 基础（含最短距离）

```js
function bfs(start) {
  const visited = new Array(V).fill(false);
  const dist = new Array(V).fill(-1);   // -1 = 未访问哨兵，兼作距离
  const queue = [start];
  visited[start] = true;                // ⚠️ 入队时标记
  dist[start] = 0;
  let head = 0;                         // 头指针优化 shift()（避免 O(n)）
  while (head < queue.length) {
    const u = queue[head++];
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;             // ⚠️ 入队时标记
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return dist;                          // dist[target] = 最短边数
}
```

### 按层处理（层序）

```js
let level = 0, head = 0;
const queue = [start];
visited[start] = true;
while (head < queue.length) {
  const size = queue.length - head;     // 当前层剩余节点数
  for (let k = 0; k < size; k++) {
    const u = queue[head++];
    for (const v of adj[u]) {
      if (!visited[v]) { visited[v] = true; queue.push(v); }
    }
  }
  level++;                              // 进入下一层
}
```

## 四、网格方向数组与遍历

```js
// 四邻接方向数组（上、下、左、右）
const dirs4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
// 八邻接（再加四个对角）
const dirs8 = [...dirs4, [-1, -1], [-1, 1], [1, -1], [1, 1]];

// 网格 DFS（递归）—— 以岛屿感染为例
function dfs(grid, i, j) {
  const m = grid.length, n = grid[0].length;
  if (i < 0 || i >= m || j < 0 || j >= n) return;  // 越界
  if (grid[i][j] !== '1') return;                  // 水或已访问
  grid[i][j] = '2';                                // 原地标记（省 visited）
  for (const [di, dj] of dirs4) dfs(grid, i + di, j + dj);
}

// 岛屿数量：数启动次数
function numIslands(grid) {
  let count = 0;
  for (let i = 0; i < grid.length; i++)
    for (let j = 0; j < grid[0].length; j++)
      if (grid[i][j] === '1') { dfs(grid, i, j); count++; }
  return count;
}
```

## 五、应用速查清单

| 应用 | 算法 | 核心要点 |
| --- | --- | --- |
| 连通分量计数 | DFS/BFS | 遍历全图，启动次数 = 分量数 |
| 无权图最短路 | BFS | 层序，`dist[v]=dist[u]+1`，首次即最短 |
| 拓扑排序（DAG） | DFS 后序逆序 / 入度法 Kahn | 有环则无解（节点数 ≠ V） |
| 探环 | DFS 三色标记 / 拓扑节点数 | 灰色相遇即环 |
| 二分图判定 | DFS/BFS 染色 | 邻居染反色，冲突则非二分图 |
| 岛屿数量/面积 | 网格 DFS/BFS | 方向数组 + 原地标记 |
| 迷宫最短步数 | 网格 BFS | 层序，到终点即返回步数 |
| 所有路径 | DFS 回溯 | 进入加 visited、退出删，枚举 |

## 六、易错点清单

- **BFS visited 拖到出队才标记**：同一节点被多个邻居重复入队，队列膨胀到 O(E)——**必须入队时标记**。
- **DFS 递归深图栈溢出**：十万个节点串成链会超调用栈上限（JS 约一万层）——改迭代（显式栈）或手动扩栈。
- **网格遍历忘判越界**：方向数组生成的新坐标必须先判 `0<=ni<m && 0<=nj<n`，否则数组越界。
- **连通分量只从一个起点遍历**：图可能不连通，必须外层 `for` 遍历所有节点，每个未访问点启动一次。
- **拓扑排序用于有环图**：拓扑只对 DAG 成立，有环无解——用「节点数 ≠ V」检测。
- **二分图染色忘处理非连通**：每个连通块要独立从颜色 0 开始染，外层遍历所有节点。
- **JS `Array.shift()` 性能**：BFS 用 `shift()` 出队是 O(n)，大图退化为 O(V²)——用头指针 `queue[head++]` 优化。
- **DFS 迭代忘二次判断**：出栈时节点可能已被标记（多邻居重复压栈），必须 `if(visited[u]) continue`。
- **网格原地标记改坏原数据**：把 `'1'` 改 `'2'` 会修改输入，若调用方需要原数据要先拷贝。
- **方向数组方向写错**：`[di,dj]` 中 `di` 是行（上下）、`dj` 是列（左右），别搞反；常用 `[[-1,0],[1,0],[0,-1],[0,1]]`。

## 七、进阶方向（链接其他叶）

- **图的表示**：邻接矩阵与邻接表的存储与转换 —— 见[图的表示](../graph-representation/) 叶
- **带权最短路**：Dijkstra（非负权）/ Bellman-Ford（可负权）/ Floyd（全源） —— 见最短路叶
- **最小生成树**：Prim / Kruskal —— 见最小生成树叶
- **强连通分量**：Tarjan / Kosaraju（有向图的「连通分量」） —— 见强连通分量叶
- **并查集**：另一种「连通性」利器，与 DFS 连通分量互补 —— 见并查集叶

## 权威链接

- [深度优先搜索 - 维基百科](https://zh.wikipedia.org/wiki/%E6%B7%B1%E5%BA%A6%E4%BC%98%E5%85%88%E6%90%9C%E7%B4%A2)
- [广度优先搜索 - 维基百科](https://zh.wikipedia.org/wiki/%E5%B9%BF%E5%BA%A6%E4%BC%98%E5%85%88%E6%90%9C%E7%B4%A2)
- [Graph Traversal - GeeksforGeeks](https://www.geeksforgeeks.org/graph-traversal/)
- [拓扑排序 - 维基百科](https://zh.wikipedia.org/wiki/%E6%8B%93%E6%89%91%E6%8E%92%E5%BA%8F)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/maze" target="_blank" rel="noopener noreferrer">迷宫 DFS/BFS 可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/dfs-bfs-slide/" target="_blank">图遍历（DFS / BFS）</a>
