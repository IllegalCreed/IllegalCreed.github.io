---
layout: doc
outline: [2, 3]
---

# 应用：环检测与依赖调度

> 基于通用算法套路 · 核于 2026-07

## 速查

- **环检测（Kahn）**：拓扑排序跑完后，**出队顶点数 < V ⇒ 有环**；出队数 == V ⇒ 无环。这是最简洁的判环法，无需额外算法。
- **环检测（DFS）**：DFS 时若邻居已在**递归栈（onStack）**中，即**回边**，存在环；用三色标记（白未访问/灰访问中/黑已完成）更清晰。
- **课程表（LeetCode 207）**：「能否修完」= 拓扑排序能否完成 = **判环**（`order.length === n` 则能）。
- **课程表 II（LeetCode 210）**：「修课顺序」= 输出**拓扑序本身**（有环返回空数组）。
- **编译依赖**：源文件依赖关系建 DAG，拓扑序即**编译顺序**（make/webpack 的依赖图本质上就是拓扑排序）。
- **任务调度**：DAG 节点 = 任务，边 = 依赖，拓扑序给出**串行执行顺序**；并行调度时「每轮同时处理所有入度 0 的点」。
- **关键路径（AOE 网）**：带权 DAG 中，源点到汇点的**最长路径** = 关键路径；用拓扑序动态规划求 `ve[v]=max(ve[u]+w)`。
- **字典序最小序**：Kahn 队列换**优先队列**（每次取编号最小入度 0 点），常见于「求最小字典序拓扑序」题。
- **建图方向**：「A 依赖 B」画 `B → A`（B 是前置）；课程题 `prerequisites[i]=[a,b]` 表示「修 a 前先修 b」，画 `b → a`。
- **复杂度**：所有应用都基于 O(V+E) 的拓扑排序，环检测/课程表/编译/调度都是线性时间。

## 一、环检测：拓扑失败即有环

拓扑排序最优雅的应用是**环检测**——不需要专门的判环算法，拓扑排序跑完看「是否处理完所有点」即可。

```
Kahn 判环：                DFS 判环（三色标记）：
if (order.length < n)        白(0) 未访问
  → 有环                     灰(1) 访问中（在递归栈）
else                         黑(2) 已完成
  → 无环                     DFS 遇到「灰」邻居 → 回边 → 有环
```

```js
// Kahn 判环（最简洁）
const order = kahn(n, edges);
const hasCycle = order.length < n; // 出队数 < V 即有环
```

```js
// DFS 三色判环
function hasCycle(n, edges) {
  const g = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) g[u].push(v);
  const color = new Array(n).fill(0); // 0 白 1 灰 2 黑
  function dfs(u) {
    color[u] = 1; // 标灰（进入递归栈）
    for (const v of g[u]) {
      if (color[v] === 1) return true;       // 灰邻居 = 回边 = 环
      if (color[v] === 0 && dfs(v)) return true;
    }
    color[u] = 2; // 标黑（完成）
    return false;
  }
  return [...Array(n).keys()].some(i => color[i] === 0 && dfs(i));
}
```

## 二、课程表：LeetCode 207 / 210

**LeetCode 207 课程表**：`numCourses=n`，`prerequisites[i]=[a,b]` 表示「修 a 前先修 b」，问能否修完所有课。**解 = 拓扑排序判环**。

**LeetCode 210 课程表 II**：同上，但要求输出一个合法修课顺序（有环返回空数组）。**解 = 输出拓扑序**。

```js
// LeetCode 210：课程表 II（Kahn）
function findOrder(n, prerequisites) {
  const g = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [a, b] of prerequisites) { g[b].push(a); indeg[a]++; } // b → a
  const q = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  const order = [];
  while (q.length) {
    const u = q.shift();
    order.push(u);
    for (const v of g[u]) if (--indeg[v] === 0) q.push(v);
  }
  return order.length === n ? order : []; // 有环返回空数组
}
```

**建图方向陷阱**：`prerequisites[i]=[a,b]` 是「修 a 前先修 b」，即 b 是 a 的前置，画边 `b → a`（`g[b].push(a)`，`indeg[a]++`）。画反了会得到错误的拓扑序。

## 三、编译依赖与构建顺序

C/C++ 编译、webpack 打包、Maven 构建都依赖拓扑排序确定模块的处理顺序：

```
main.c → utils.h → stdio.h        源文件依赖 .h，.h 又依赖其他 .h
                                     拓扑序给出编译/打包顺序
```

- **make** 的依赖图本质是 DAG：目标依赖源文件，源文件依赖头文件，按拓扑序自底向上构建。
- **webpack/module bundler** 的模块图做拓扑排序后，按序打包避免「用到未定义」。
- **循环依赖检测**：构建工具报「Circular dependency detected」正是拓扑排序失败（出队数 < V）的结果。

## 四、任务调度：串行与并行

任务依赖图（DAG）的拓扑序直接给出**串行执行顺序**；并行调度时，每一「轮」同时处理所有入度 0 的任务：

```
轮次 1：执行所有入度 0 的任务（无前置依赖）
轮次 2：上一轮完成的任务释放依赖，新的入度 0 任务加入
...
总轮数 = DAG 的最长路径长度（关键路径长度）
```

这是**工作流引擎**（Airflow/Prefect/Temporal）调度 DAG 任务的基础算法。

## 五、关键路径引入：带权 DAG 的最长路

普通拓扑排序只解决「先后」，不解决「耗时」。当边或顶点带权（表示耗时）时，关心的是**完成所有任务的最短总时间**——等于 DAG 的**最长路径（关键路径）**：

```js
// AOE 网：顶点 = 事件，边 = 活动（带耗时 w）
// ve[v] = 最早发生时间 = max(ve[u] + w(u,v))，按拓扑序递推
for (const u of topoOrder)
  for (const [v, w] of g[u])
    ve[v] = Math.max(ve[v], ve[u] + w); // 松弛取最大
// 关键路径长度 = max(ve[i])
```

关键路径上的活动（松弛量为 0）就是**关键活动**——延迟任何一个都会拖延整个工程。这是项目管理（PERT/CPM）与编译流水线优化的核心。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/topological-sort" target="_blank" rel="noopener noreferrer">拓扑排序可视化演示</a> —— 环检测、课程表与依赖调度的可视化

## 下一步

应用篇结束后，建议回到[参考](../reference)查阅完整复杂度表、Kahn/DFS 代码模板与易错点清单，巩固全叶知识。
