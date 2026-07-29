---
layout: doc
outline: [2, 3]
---

# 参考：拓扑排序 API、复杂度与应用速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **定义**：对 DAG 所有顶点排成线性序列，使任意有向边 `u → v` 满足「u 在 v 前」。
- **核心判据**：能拓扑排序 ⇔ 图是 DAG（无环）；有环则无解。
- **Kahn**：算入度 → 入度 0 入队 → 出队摘边（邻居入度减 1，归 0 入队）→ **出队顺序即拓扑序**；出队数 < V 即有环。
- **DFS**：后序遍历（递归完邻居再记录自己）→ **序列翻转即拓扑序**；遇到 onStack 邻居（回边）即有环。
- **复杂度**：两者 **O(V+E)**（邻接表）；邻接矩阵退化 O(V²)，必须用邻接表。
- **序不唯一**：同时多个入度 0 点时选谁不同结果不同；字典序最小用**优先队列**替换队列。
- **环检测**：Kahn 出队数 < V / DFS 三色（白未访问·灰访问中·黑完成，遇灰即环）。
- **应用**：课程表（207/210）、编译/构建顺序、任务调度（串行/并行）、包管理、关键路径（AOE 最长路）。
- **建图方向**：「A 依赖 B」画 `B → A`（B 是前置）；`prerequisites[i]=[a,b]`（修 a 先修 b）画 `b → a`。
- **易错**：DAG 前提 / 序不唯一 / 入度更新方向 / `q.shift()` 性能 / 深图 DFS 栈溢出。
- **交互演示**：[拓扑排序可视化](https://algo.illegalscreed.cn/docs/topological-sort)。

## 一、核心复杂度表

| 操作 | Kahn | DFS | 说明 |
| --- | --- | --- | --- |
| 建图（邻接表） | O(E) | O(E) | 扫一遍边 |
| 拓扑排序 | **O(V+E)** | **O(V+E)** | 每点每边一次 |
| 环检测 | O(V+E)（出队数<V） | O(V+E)（遇回边） | 拓扑附带判环 |
| 空间复杂度 | O(V)（入度+队列） | O(V)（visited+onStack+栈） | — |
| 字典序最小拓扑序 | O(V+E+logV)（优先队列） | 难改造 | Kahn+堆 |
| 邻接矩阵实现 | O(V²) | O(V²) | 退化，不推荐 |

## 二、Kahn 代码模板（入度 BFS）

```js
function kahn(n, edges) {
  const g = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) { g[u].push(v); indeg[v]++; }
  const q = [], order = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  let head = 0;                       // 用首指针避免 shift() 的 O(n)
  while (head < q.length) {
    const u = q[head++]; order.push(u);
    for (const v of g[u]) if (--indeg[v] === 0) q.push(v);
  }
  return order; // order.length < n ⇒ 有环
}
```

```js
// 字典序最小拓扑序：队列换最小堆（LeetCode 内置）
const heap = new MinPriorityQueue();
for (let i = 0; i < n; i++) if (indeg[i] === 0) heap.enqueue(i);
while (heap.size()) {
  const u = heap.dequeue().element; order.push(u);
  for (const v of g[u]) if (--indeg[v] === 0) heap.enqueue(v);
}
```

## 三、DFS 代码模板（后序逆序 + 三色判环）

```js
function dfsTopo(n, edges) {
  const g = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) g[u].push(v);
  const color = new Array(n).fill(0); // 0 白 1 灰 2 黑
  const order = [];
  let cycle = false;
  function dfs(u) {
    color[u] = 1;                      // 灰：进入递归栈
    for (const v of g[u]) {
      if (color[v] === 1) { cycle = true; return; }      // 灰邻居=回边=环
      if (color[v] === 0) dfs(v);
    }
    color[u] = 2; order.push(u);       // 黑：完成，后序记录
  }
  for (let i = 0; i < n; i++) if (color[i] === 0) dfs(i);
  return cycle ? [] : order.reverse(); // 后序逆序 = 拓扑序
}
```

## 四、应用清单

| 应用 | 建模 | 关键操作 | 经典题 |
| --- | --- | --- | --- |
| 课程表 | 课程节点，先修→后修 | 判环/输出序 | LeetCode 207/210 |
| 编译顺序 | 文件节点，依赖→依赖者 | 输出序（make/build） | 循环依赖检测 |
| 任务调度 | 任务节点，前置→后置 | 串行序/并行轮次 | 工作流引擎 |
| 包管理 | 包节点，底层→上层 | 安装序 | npm/pip/maven 解析 |
| 环检测 | 任意 DAG | 出队数<V/遇回边 | 「是否存在循环依赖」 |
| 关键路径 | AOE 网带权 | 拓扑序 DP 求最长路 | 项目工期 PERT/CPM |

## 五、易错点清单

- **DAG 前提**：题目不给 DAG 就先想「能否建无环图」；有环图直接无解，不要硬跑。
- **序不唯一**：同一 DAG 多种合法拓扑序，不要假设唯一；要字典序最小换优先队列。
- **入度更新方向**：`u → v` 是 `indeg[v]++`（v 的入度增加），别写反成 `indeg[u]++`。
- **建图方向**：`prerequisites[i]=[a,b]` 是「修 a 先修 b」即 b 前置，画 `b → a`（`g[b].push(a)`）。
- **`q.shift()` 性能**：JS 中 `shift()` 是 O(n)，规模大时用首指针 `head` 或 `ArrayDeque` 思路。
- **深图 DFS 栈溢出**：链状 DAG 递归深度 O(V)，规模大（>1e5）改用 Kahn 迭代。
- **环检测用出队数**：Kahn 判环看 `order.length === n`，不是看队列是否为空（队空但出队数可能 < V）。
- **DFS 三色别用单 visited**：单 `visited` 布尔数组无法区分「访问中（灰）」和「已完成（黑）」，会漏判环。
- **后序要翻转**：DFS 后序是「叶子先记录」，翻转后才满足 `u → v` 中 u 在前。
- **邻接表而非矩阵**：邻接矩阵建图 O(V²) 且找邻居 O(V)，会退化复杂度。
- **并行调度轮数**：每轮处理所有入度 0 点，总轮数 = DAG 最长路径长度（不是顶点数）。
- **关键路径是最长路不是最短路**：AOE 网求「最早完成时间」取 `max` 不是 `min`。

## 六、进阶方向（链接其他叶）

- **图的遍历**：拓扑排序是 DAG 上的特殊遍历 —— 见图遍历（DFS/BFS）叶
- **最短路径**：DAG 上可按拓扑序做单次松弛求最短路（O(V+E)，比 Dijkstra 更快） —— 见最短路叶
- **关键路径/AOE 网**：带权 DAG 的最长路径 —— 见关键路径叶
- **并查集**：无向图的连通/环检测，与有向图的拓扑判环互补 —— 见并查集叶

## 权威链接

- [拓扑排序 - 维基百科](https://zh.wikipedia.org/wiki/%E6%8B%93%E6%89%91%E6%8E%92%E5%BA%8F)
- [Topological Sorting - GeeksforGeeks](https://www.geeksforgeeks.org/topological-sorting/)
- [Course Schedule - LeetCode 207](https://leetcode.com/problems/course-schedule/)
- [Course Schedule II - LeetCode 210](https://leetcode.com/problems/course-schedule-ii/)
- [Kahn's Algorithm - VisuAlgo](https://visualgo.net/en/sorting)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/topological-sort" target="_blank" rel="noopener noreferrer">拓扑排序可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/topological-sort-slide/" target="_blank">拓扑排序</a>
