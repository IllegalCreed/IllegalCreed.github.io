---
layout: doc
outline: [2, 3]
---

# Kahn 与 DFS：两种拓扑方法

> 基于通用算法套路 · 核于 2026-07

## 速查

- **Kahn 算法（入度 BFS）**：①算所有点入度；②入度为 0 的点入队；③出队一个点、加入结果、把它的所有邻居入度减 1（模拟删边），邻居入度变 0 就入队；④重复直到队空——**出队顺序即拓扑序**。
- **环检测（Kahn）**：若最终**出队顶点数 < V**，说明有环（剩下的点入度永远不为 0，成环）。
- **DFS 后序逆序**：对每个未访问的点 DFS，**递归完所有邻居后再记录该点**（后序），最后把记录序列**整体翻转**即为拓扑序。
- **环检测（DFS）**：维护「递归栈中」标记，DFS 时若邻居已在递归栈中（**回边**）则存在环。
- **复杂度**：两者都是 **O(V+E)**（邻接表）；Kahn 空间 O(V)（入度数组 + 队列），DFS 空间 O(V)（visited + 栈标记 + 递归栈）。
- **建图约定**：`edges[u].push(v)` 表示 `u → v`；入度 `indeg[v]++`。「A 依赖 B」画成 `B → A`（B 是前置）。
- **唯一性**：普通队列得到的拓扑序不唯一；要字典序最小，把队列换成**优先队列**（每次取编号最小的入度 0 点）。
- **两者等价**：Kahn 与 DFS 后序逆序对同一张 DAG 得到的拓扑序都合法（不一定相同，但都满足所有边约束）。
- **选型**：Kahn 直观、迭代无栈溢出风险、天然带环检测（比出队数）；DFS 简洁、适合递归风格的题，但要注意深图爆栈。
- **经典题**：LeetCode 207（课程表，判环/能否完成）、210（课程表 II，输出拓扑序）。

## 一、Kahn 算法：入度 BFS

核心思想：**入度为 0 的点没有任何前置依赖，可以安全地放到当前拓扑序的下一个位置**。把它「拿掉」后，它指向的邻居入度减 1，若邻居入度变 0 就也成了无依赖点，继续拿——像剥洋葱一样逐层摘除。

```js
function kahn(n, edges) {
  const g = Array.from({ length: n }, () => []); // 邻接表
  const indeg = new Array(n).fill(0);            // 入度
  for (const [u, v] of edges) { g[u].push(v); indeg[v]++; }
  const q = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i); // 入度 0 入队
  const order = [];
  while (q.length) {
    const u = q.shift();        // 出队 = 拓扑序下一项
    order.push(u);
    for (const v of g[u]) if (--indeg[v] === 0) q.push(v); // 删边，邻居入度 0 入队
  }
  return order; // order.length < n 表示有环
}
```

- **为什么对**：入度 0 意味着所有前置都已被处理（已加入结果），此时该点可以安全输出；`--indeg[v]` 模拟「删掉 u→v 这条边」，保证 v 只在所有前置都处理完后才入度归 0。
- **环检测**：若 `order.length < n`，说明有顶点始终入度不为 0（它们互相依赖成环），即图有环。
- **复杂度**：每条边在 `--indeg` 时被访问一次（O(E)），每个顶点入队出队一次（O(V)），总 **O(V+E)**。注意 `q.shift()` 在 JS 中是 O(n)，规模大时用首指针 `let head = 0` 替代。

### 字典序最小拓扑序

把 Kahn 的普通队列换成**优先队列（最小堆）**，每次取编号最小的入度 0 点，即得字典序最小的拓扑序：

```js
// 用最小堆替换 q.shift()：每次出队编号最小的入度 0 点
const heap = new MinPriorityQueue(); // LeetCode 内置
// 其余逻辑不变，q.push → heap.enqueue，q.shift → heap.dequeue().element
```

## 二、DFS 后序逆序

核心思想：**DFS 的后序遍历（先递归所有邻居，再处理自己）天然满足「被依赖的点先记录」**，把后序序列翻转过来就是拓扑序——因为先记录的点（叶子、无依赖点）翻到最后，后记录的点（根、被依赖点）翻到最前。

```js
function dfsTopo(n, edges) {
  const g = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) g[u].push(v);
  const visited = new Array(n).fill(false);
  const onStack = new Array(n).fill(false); // 递归栈标记，判环用
  const order = [];
  let hasCycle = false;
  function dfs(u) {
    visited[u] = true; onStack[u] = true;
    for (const v of g[u]) {
      if (!visited[v]) dfs(v);
      else if (onStack[v]) { hasCycle = true; return; } // 回边 → 有环
    }
    onStack[u] = false;
    order.push(u); // 后序：递归完所有邻居再记录自己
  }
  for (let i = 0; i < n; i++) if (!visited[i]) dfs(i);
  order.reverse(); // 后序逆序 = 拓扑序
  return hasCycle ? [] : order;
}
```

- **为什么对**：后序保证「u 的所有后继 v 先被记录」（因为 `dfs(v)` 在 `order.push(u)` 之前完成），翻转后 u 就排在所有 v 前面，满足 `u → v` 的约束。
- **环检测**：`onStack[v]` 标记「v 在当前递归路径上」，若 DFS 邻居时遇到 onStack 的点，说明绕回了正在访问的祖先——**回边 = 环**。
- **复杂度**：每条边、每个顶点访问一次，**O(V+E)**。注意深图（如链状 DAG）递归深度 O(V)，可能栈溢出，规模大时改用 Kahn。

## 三、Kahn 与 DFS 对比

| 维度 | Kahn（入度 BFS） | DFS（后序逆序） |
| --- | --- | --- |
| 数据结构 | 入度数组 + 队列 | visited + onStack + 递归栈 |
| 环检测 | 出队数 < V | 遇到回边（onStack） |
| 空间 | O(V) | O(V)（+ 递归栈） |
| 深图风险 | 无（迭代） | **可能栈溢出** |
| 字典序最小 | 易改造（换优先队列） | 难（需额外处理） |
| 风格 | 直观、工程友好 | 简洁、递归风 |

选型口诀：**「判环 + 求序 → Kahn；递归风 + 无深图 → DFS；要字典序最小 → Kahn + 优先队列」**。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/topological-sort" target="_blank" rel="noopener noreferrer">拓扑排序可视化演示</a> —— Kahn 逐层摘除与 DFS 后序逆序的对照

## 下一步

掌握了 Kahn 与 DFS 两套实现后，下一步是拓扑排序的实战应用——**环检测、课程表、编译依赖、任务调度、关键路径**，见[应用：环检测与依赖调度](./applications)。
