---
layout: doc
outline: [2, 3]
---

# DFS 与 BFS 详解：框架与实现

> 基于通用算法套路 · 核于 2026-07

## 速查

- **DFS 递归框架**：`dfs(u){ visited[u]=true; for(v of adj[u]) if(!visited[v]) dfs(v); }`——进入即标记，遍历邻居递归深入，写法最简。
- **DFS 迭代（栈）框架**：`stack=[start]; while(stack){ u=stack.pop(); if(visited[u])continue; visited[u]=true; for(v)stack.push(v); }`——规避深链图栈溢出。
- **BFS 队列框架**：`queue=[start]; visited[start]=true; while(queue){ u=queue.shift(); for(v of adj[u]) if(!visited[v]){visited[v]=true;queue.push(v);} }`——**入队时标记**防重复入队。
- **visited 时机**：DFS 递归在「进入函数首行」标记；DFS 迭代在「出栈且未访问」时标记（出栈前 push 可能重复，要二次判断）；BFS 在「入队时」标记——**绝不能拖到出队/出栈才标记**。
- **邻接表 vs 邻接矩阵**：遍历框架对两者通用，区别只在「取邻居」——邻接表 `for(v of adj[u])` 直接拿邻居列表 O(度)；邻接矩阵 `for(v=0;v<V;v++) if(adj[u][v]) ...` 要扫整行 O(V)。
- **网格图遍历**：把**格子当节点、四邻接当边**，用**方向数组** `dirs=[[-1,0],[1,0],[0,-1],[0,1]]` 生成邻居，越界/障碍/已访问则跳过。
- **复杂度**：邻接表 O(V+E)，邻接矩阵 O(V²)；空间 O(V)。
- **典型题映射**：岛屿数量（网格 DFS 感染/BFS）/ 迷宫最短路（网格 BFS）/ 课程表（拓扑 DFS/BFS）/ 所有可能路径（DFS 回溯）。
- **易错**：BFS visited 拖到出队才标 → 重复入队；DFS 递归深图 → 栈溢出改迭代；网格忘判边界越界。

## 一、DFS 递归框架

深度优先搜索的递归写法是最直观的——「进入节点即标记，然后对每个未访问邻居递归」。递归调用栈天然记录了「当前的探索路径」，回溯就是函数返回。

```js
// 邻接表上的 DFS（递归），adj[u] 是 u 的邻居数组
const V = adj.length;
const visited = new Array(V).fill(false);

function dfs(u) {
  visited[u] = true;          // ① 进入即标记（防重复、防环死循环）
  console.log(u);             //    处理 u（如收集、判断）
  for (const v of adj[u]) {   // ② 遍历所有邻居
    if (!visited[v]) dfs(v);  //    未访问的邻居递归深入
  }
}                             // ③ 函数返回 = 回溯到上一层

dfs(0);                       // 从节点 0 出发遍历整个连通块
// 若要遍历「全图」（含不连通部分），外层套 for
for (let i = 0; i < V; i++) if (!visited[i]) dfs(i);
```

- **visited 在第一行标记**：保证每个节点只进入一次 `dfs`，是 O(V+E) 的关键。
- **遍历全图**：图可能不连通，要对每个未访问节点都启动一次 DFS（连通分量计数就是数启动次数）。
- **变体——带路径/带父节点**：判环时需区分「父节点回边」与「真环」，可传入 `parent` 参数；拓扑排序用「后序」（处理完所有邻居再收集 u，最后逆序）。

## 二、DFS 迭代（栈）框架

递归 DFS 在**深链状图**（如十万个节点串成一条链）上会**栈溢出**（JS 默认调用栈约一万层）。改用显式栈的迭代写法，行为等价但栈在堆上，不受调用栈限制。

```js
// 邻接表上的 DFS（迭代，显式栈）
function dfsIter(start) {
  const V = adj.length;
  const visited = new Array(V).fill(false);
  const stack = [start];
  while (stack.length) {
    const u = stack.pop();
    if (visited[u]) continue;     // ⚠️ 出栈时再判一次（防重复入栈的）
    visited[u] = true;            //    出栈且未访问才标记
    console.log(u);
    for (const v of adj[u]) {     //    未访问的邻居压栈
      if (!visited[v]) stack.push(v);
    }
  }
}
```

- **为什么要二次判断**：节点 A 的多个邻居可能在 A 被处理前都把同一节点 X 压入栈（压栈时 X 未访问，但之后会被处理）。出栈时 X 可能已被标记，故 `if (visited[u]) continue`。
- **访问顺序与递归略有不同**：递归是「先深入第一个邻居」；迭代用栈是「后进先出」，邻居压栈顺序决定了实际深入顺序——但两者都是合法的 DFS（只要保证「走到底再回溯」的纵深特性）。
- **若要严格复现递归顺序**：邻居逆序压栈（保证第一个邻居最后压、最先 pop）。

## 三、BFS 队列框架

广度优先搜索用**队列**保证「先发现的先处理」，从而**按距离（层）有序**。它是无权图最短路的唯一正解。

```js
// 邻接表上的 BFS（队列）
function bfs(start) {
  const V = adj.length;
  const visited = new Array(V).fill(false);
  const dist = new Array(V).fill(-1);  // 到起点的距离（可选，求最短路时用）
  const queue = [start];
  visited[start] = true;               // ⚠️ 入队时标记
  dist[start] = 0;
  while (queue.length) {
    const u = queue.shift();           // 队首出队（JS shift 是 O(n)，大图可用 head 指针优化）
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;             // ⚠️ 入队时标记（不是出队时！）
        dist[v] = dist[u] + 1;         //    距离 = 上一层 + 1
        queue.push(v);
      }
    }
  }
  return dist;                         // dist[target] 即起点到 target 的最短边数
}
```

- **visited 必须入队时标记**：若拖到出队时才标记，同一节点会被多个已入队邻居重复 push 进队列，队列膨胀且重复处理——这是 BFS 最常见 bug。入队即标记则每个节点最多入队一次。
- **dist 数组**：`dist[v] = dist[u] + 1` 在入队时赋值，天然得到「到起点的最短边数」（无权最短路）。若只求连通不需要 dist。
- **JS `shift()` 的性能**：`Array.shift()` 是 O(n)，大图上建议用「头指针 + 数组」模拟队列（`queue[head++]`）或用 `Deque`，避免退化为 O(V²)。

### 按层处理（层序遍历）

需要知道「当前是第几层」或「逐层处理」时，用「队列大小快照」分隔每一层：

```js
let level = 0;
while (queue.length) {
  const size = queue.length;          // 当前层的节点数
  for (let i = 0; i < size; i++) {    // 只处理这一层
    const u = queue.shift();
    for (const v of adj[u]) if (!visited[v]) { visited[v] = true; queue.push(v); }
  }
  level++;                            // 进入下一层
}
```

## 四、邻接矩阵上的遍历

邻接表用 `adj[u]` 直接拿到邻居列表；邻接矩阵 `adj[u]` 是长度 V 的布尔/权重数组，取邻居要扫一整行。遍历框架不变，只换「取邻居」方式：

```js
// 邻接矩阵（V×V）上的 BFS
function bfsMatrix(start) {
  const visited = new Array(V).fill(false);
  const queue = [start];
  visited[start] = true;
  while (queue.length) {
    const u = queue.shift();
    for (let v = 0; v < V; v++) {     // ⚠️ 扫整行找邻居
      if (adjMatrix[u][v] && !visited[v]) {  // adjMatrix[u][v] 非 0 表示有边
        visited[v] = true;
        queue.push(v);
      }
    }
  }
}
```

邻接矩阵遍历复杂度 **O(V²)**（每个顶点扫一整行 V），与边数无关——稠密图（E≈V²）尚可，稀疏图浪费严重。故实际多用邻接表。

## 五、网格图遍历：方向数组

**网格图（岛屿、迷宫）**是把二维矩阵当成图：每个格子是节点，上下左右（四邻接）或再加对角（八邻接）是边，障碍物（如水、墙）不可走。遍历时用**方向数组**统一生成「邻居坐标」：

```js
// 四方向数组：上、下、左、右
const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// 网格 DFS（递归）—— 岛屿感染（把陆地 '1' 标记为已访问）
function dfs(grid, i, j) {
  const m = grid.length, n = grid[0].length;
  if (i < 0 || i >= m || j < 0 || j >= n) return; // 越界
  if (grid[i][j] !== '1') return;                 // 非陆地（水或已访问）跳过
  grid[i][j] = '2';                               // 原地标记（染色法，省 visited 数组）
  for (const [di, dj] of dirs) {                  // 四个方向递归
    dfs(grid, i + di, j + dj);
  }
}

// 岛屿数量（LeetCode 200）：数有多少个连通的陆地块
function numIslands(grid) {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j] === '1') {   // 遇到新陆地
        dfs(grid, i, j);          // DFS 感染整个岛屿（全标成 '2'）
        count++;                  // 岛屿数 +1
      }
    }
  }
  return count;
}
```

- **方向数组**：`dirs=[[-1,0],[1,0],[0,-1],[0,1]]`（四邻接）或再加 `[[-1,-1],[-1,1],[1,-1],[1,1]]`（八邻接）；遍历邻居用 `for(const [di,dj] of dirs) dfs(i+di,j+dj)`。
- **原地标记省 visited**：网格题常把已访问的格子改写成障碍值（如 `'1'→'2'`），省掉额外 visited 矩阵——但会修改原数据，注意题目是否允许。
- **迷宫最短路用 BFS**：求起点到终点的最少步数，BFS 层序天然给出答案（DFS 要遍历所有路径比较，慢且易错）。

```js
// 网格 BFS —— 迷宫最短步数（求 (0,0) 到 (m-1,n-1) 的最少步数）
function shortestPath(grid) {
  const m = grid.length, n = grid[0].length;
  if (grid[0][0] === 1) return -1;          // 起点不通
  const visited = Array.from({length: m}, () => new Array(n).fill(false));
  const queue = [[0, 0]];
  visited[0][0] = true;
  let steps = 0;
  while (queue.length) {
    const size = queue.length;
    for (let k = 0; k < size; k++) {        // 逐层处理
      const [i, j] = queue.shift();
      if (i === m - 1 && j === n - 1) return steps; // 到达终点
      for (const [di, dj] of dirs) {
        const ni = i + di, nj = j + dj;
        if (ni >= 0 && ni < m && nj >= 0 && nj < n && !visited[ni][nj] && grid[ni][nj] === 0) {
          visited[ni][nj] = true;           // 入队即标记
          queue.push([ni, nj]);
        }
      }
    }
    steps++;                                // 走完一层步数 +1
  }
  return -1;                                // 不可达
}
```

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/maze" target="_blank" rel="noopener noreferrer">迷宫 DFS/BFS 可视化演示</a> —— 网格图上 DFS 深入与 BFS 层序扩展的对比

## 下一步

掌握了 DFS/BFS 框架后，下一步看它们的**经典应用**——连通分量计数、无权图最短路（BFS 层序）、拓扑排序（DFS 后序 / 入度法）、二分图判定（染色），见[应用](./applications)。
