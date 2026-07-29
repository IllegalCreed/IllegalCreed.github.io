---
layout: doc
---

# 最短路径算法

最短路径算法（**Shortest Path Algorithms**）是图论里最核心的一类问题——在带权图里，求从一个顶点到另一个（或所有）顶点的**权和最小**的路径。它既是 Dijkstra、Bellman-Ford、Floyd-Warshall 这些经典算法的集合，也是网络路由、地图导航、任务调度、依赖分析等工程场景的算法基石。根据问题形态的不同（单源 vs 全源、非负权 vs 可负权、是否要判负环），要选用不同的算法——选错就会要么算错（Dijkstra 遇负权），要么超时（Floyd 跑大图）。

最短路径的全部考点都源于一个**松弛（relax）操作**：`if (d[u]+w < d[v]) d[v] = d[u]+w`——即「发现一条更短的路径就更新」。所有算法本质都是在用不同策略、不同次数地执行松弛：**Dijkstra** 用贪心 + 堆，每轮取出最近的未确定顶点松弛其邻居，要求**非负权**，复杂度 O((V+E)logV)；**Bellman-Ford** 暴力松弛所有边 V−1 轮，**可处理负权**且第 V 轮能判负环，O(VE)；**SPFA** 是 Bellman-Ford 的队列优化（只松弛可能变化的点），平均更快但最坏仍 O(VE)；**Floyd-Warshall** 用三重循环 DP 求全源最短路，`dp[k][i][j]=min(dp[k-1][i][j], dp[k-1][i][k]+dp[k-1][k][j])`，O(V³)，适合稠密小图、求传递闭包。

## 评价

**优点**

- **套路清晰、可解性强**：核心只有一个松弛操作，四种算法是松弛策略的四种组合（贪心 / 暴力 / 队列 / DP），理解一个就通一片
- **覆盖面广**：单源（Dijkstra/BF/SPFA）与全源（Floyd）两大形态全覆盖，非负权与负权各有适用算法，几乎能解所有最短路变体
- **工程价值高**：Dijkstra 是 GPS 导航、网络 OSPF 路由的内核；Floyd 求传递闭包用于依赖分析、可达性查询
- **判负环能力**：Bellman-Ford/SPFA 能在求最短路的同时检测负权环（第 V 轮仍能松弛即有负环），这是 Dijkstra/Floyd 做不到的

**缺点**

- **选型门槛高**：Dijkstra 遇负权会算错、Floyd 跑大图会超时、SPFA 容易被卡成 O(VE)——选错算法是面试和竞赛最常见失分点
- **复杂度依赖图形态**：Dijkstra 在稠密图退化（E≈V² 时近 O(V²)）；Floyd 只适合 V 很小（≤几百）的图；SPFA 最坏 O(VE) 易被构造数据卡
- **空间开销**：Floyd 需 O(V²) 邻接矩阵；稀疏图用邻接表才能发挥 Dijkstra/BF 的优势，矩阵会多耗内存
- **负权环情形无最短路**：若图含可达的负权环，最短路无定义（可无限绕圈变负无穷），此时只能判环报错

## 本叶地图

- [入门](./getting-started) —— 单源 vs 全源、非负权 vs 可负权、松弛操作、四算法适用场景速览
- [Dijkstra 与 Bellman-Ford](./guide-line/dijkstra-bellman) —— 单源两大利器：Dijkstra 贪心 + 堆优化、为何不能负权、Bellman-Ford 松弛 V−1 轮判负环、SPFA 队列优化
- [Floyd-Warshall 与应用](./guide-line/floyd-and-applications) —— 全源 Floyd 三重循环 DP、传递闭包、四算法选型决策表
- [参考](./reference) —— 复杂度对比表、Dijkstra/BF/Floyd 代码模板、选型决策树、易错点清单

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/dijkstra" target="_blank" rel="noopener noreferrer">Dijkstra 可视化演示</a> —— 贪心取最近顶点 + 堆优化的逐步松弛过程
- <a href="https://algo.illegalscreed.cn/docs/bellman-ford" target="_blank" rel="noopener noreferrer">Bellman-Ford 可视化演示</a> —— 暴力松弛所有边 V−1 轮及第 V 轮判负环
- <a href="https://algo.illegalscreed.cn/docs/floyd-warshall" target="_blank" rel="noopener noreferrer">Floyd-Warshall 可视化演示</a> —— 三重循环 DP 求全源最短路

## 幻灯片地址

<a href="/SlideStack/shortest-path-slide/" target="_blank">最短路径算法</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E6%9C%80%E7%9F%AD%E8%B7%AF%E5%BE%84%E7%AE%97%E6%B3%95" target="_blank" rel="noopener noreferrer">最短路径算法测试题</a>
