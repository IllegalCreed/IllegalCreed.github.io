---
layout: doc
outline: [2, 3]
---

# 参考：并查集 API、操作与复杂度速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：管理一组不相交集合的树型结构，只支持 find（找根）和 union（合并）；`parent[i]` 存父，根 `parent[root]===root`。
- **初始化**：`parent[i]=i`，每元素自成一组，共 n 个集合。
- **find**：沿 parent 找根；路径压缩版把沿途节点挂到根。
- **union**：先 find 两根，根不同则 `parent[rx]=ry`，整棵子树一起迁移。
- **同组判断**：`find(x)===find(y)`——连通/等价的本质。
- **路径压缩**：`find` 时 `parent[x]=find(parent[x])`，递归一行压平整条路径。
- **按秩合并**：维护 `rank[]`，矮树挂高树；rank 相等则被挂方 rank+1。
- **按大小合并**：维护 `size[]`，小集合挂大集合；还能直接读集合元素数。
- **复杂度**：朴素 O(n)；单优化 O(log n)；**路径压缩+按秩合并 O(α(n))≈O(1)**。
- **阿克曼反函数 α(n)**：增长极慢，n≤10⁸⁰ 时 α(n)<5，实际就是常数。
- **应用**：连通分量、Kruskal 最小生成树（判环）、朋友圈/岛屿等价类、动态连通性、无向图判环、冗余连接。
- **易错**：union 前必须 find 两根；按秩合并的 rank 不下调（是上界）；有向图判环要用 DFS 三色标记不能用并查集。
- **交互演示**：[并查集可视化](https://algo.illegalscreed.cn/docs/union-find)。

## 一、核心复杂度表

| 操作 | 朴素 | 仅路径压缩 | 仅按秩/按大小 | 两者结合 |
| --- | --- | --- | --- | --- |
| `find(x)` | O(n) | O(log n) | O(log n) | **O(α(n)) ≈ O(1)** |
| `union(x,y)` | O(n) | O(log n) | O(log n) | **O(α(n)) ≈ O(1)** |
| `connected(x,y)` | O(n) | O(log n) | O(log n) | **O(α(n)) ≈ O(1)** |
| 初始化 | O(n) | O(n) | O(n) | O(n) |
| 空间 | O(n) | O(n) | O(n) | O(n) |

**结论**：永远用「路径压缩 + 按秩/按大小合并」，复杂度近乎 O(1)，常数极小。

## 二、find 代码模板

```js
// ① 朴素版（无优化，最坏 O(n)）
function find(parent, x) {
  while (parent[x] !== x) x = parent[x];
  return x;
}

// ② 路径压缩（递归，推荐）——一行压平整条路径
function find(parent, x) {
  if (parent[x] !== x) parent[x] = find(parent, parent[x]);
  return parent[x];
}

// ③ 路径压缩（迭代，防爆栈）——两趟：先找根再压平
function find(parent, x) {
  let root = x;
  while (parent[root] !== root) root = parent[root]; // 找根
  while (parent[x] !== root) {                        // 压平
    const next = parent[x];
    parent[x] = root;
    x = next;
  }
  return root;
}
```

## 三、union 代码模板

```js
// ① 朴素版（无优化，可能退化成链）
function union(parent, x, y) {
  const rx = find(parent, x), ry = find(parent, y);
  if (rx !== ry) parent[rx] = ry;
}

// ② 按秩合并（矮挂高）
function unionByRank(parent, rank, x, y) {
  const rx = find(parent, x), ry = find(parent, y);
  if (rx === ry) return;
  if (rank[rx] < rank[ry]) parent[rx] = ry;
  else if (rank[rx] > rank[ry]) parent[ry] = rx;
  else { parent[rx] = ry; rank[ry]++; }
}

// ③ 按大小合并（小挂大，还能读集合大小）
function unionBySize(parent, size, x, y) {
  const rx = find(parent, x), ry = find(parent, y);
  if (rx === ry) return;
  if (size[rx] < size[ry]) { parent[rx] = ry; size[ry] += size[rx]; }
  else { parent[ry] = rx; size[rx] += size[ry]; }
}
```

## 四、路径压缩 + 按秩合并完整实现

```js
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.count = n;                       // 集合数 = 连通分量数
  }
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // 路径压缩
    }
    return this.parent[x];
  }
  union(x, y) {
    const rx = this.find(x), ry = this.find(y);
    if (rx === ry) return false;          // 已同组
    if (this.rank[rx] < this.rank[ry]) this.parent[rx] = ry;
    else if (this.rank[rx] > this.rank[ry]) this.parent[ry] = rx;
    else { this.parent[rx] = ry; this.rank[ry]++; }
    this.count--;
    return true;
  }
  connected(x, y) { return this.find(x) === this.find(y); }
}
```

**使用**：`const uf = new UnionFind(n); uf.union(a,b); uf.connected(c,d); uf.count`。

## 五、应用清单

| 应用 | 核心思路 | 典型题 |
| --- | --- | --- |
| 连通分量计数 | 边 union 两端，剩余集合数 = 分量数 | LeetCode 323 |
| Kruskal 最小生成树 | 边排序，加边前判环（find 同根则跳过） | 带权连通图 |
| 无向图判环 | 加边时两端已连通 → 有环 | 图论基础 |
| 朋友圈/省份 | `M[i][j]=1` 就 union，数集合 | LeetCode 547 |
| 岛屿数量 | 相邻陆地 union，集合数 = 岛数 | LeetCode 200 |
| 冗余连接 | 第一条「加入时已连通」的边 | LeetCode 684 |
| 动态连通性 | 加边=union，查询=connected | 在线查询 |
| 等价类合并 | 同类关系翻译成 union | 分类问题 |

## 六、易错点清单

- **union 前没 find 两根**：直接 `parent[x]=y` 只挪一个节点，没搬走整棵子树，破坏「同集合根相同」不变量。
- **按秩合并的 rank 是上界**：路径压缩会改树结构但 rank **不下调**，所以 rank 不是精确树高——这没关系，它仍是有效的高度上界。
- **有向图判环不能用并查集**：并查集判环只对**无向图**（等价关系）成立；有向图环要用 DFS 三色标记或拓扑排序。
- **find 忘路径压缩**：递归版必须写 `parent[x] = find(parent[x])`（赋值回 parent），只 `return find(parent[x])` 不压缩。
- **初始化忘 `parent[i]=i`**：根的自指标志丢了，find 会死循环或越界。
- **count 维护错**：`union` 内部只在「真正合并」（根不同）时 `count--`；同组 union 不减。
- **坐标映射混淆**：网格题把 `(i,j)` 映射成 `i*cols+j`，注意是列数 `cols` 不是行数。
- **把 union 当可撤销**：标准并查集只合不分，要撤销得用「按秩合并 + 操作栈」的可撤销并查集（路径压缩不可撤销）。
- **加权并查集漏维护权值**：带权关系要维护节点到根的相对权值，union 时权值要按向量相加更新。
- **过度依赖路径压缩**：单用路径压缩是 O(log n) 均摊，**必须配合按秩/按大小**才到 O(α(n))——面试里两者都用。
- **Kruskal 忘排序**：最小生成树必须边按权升序排序后再贪心加边，否则不是最小。
- **冗余连接返回错**：要返回第一条「成环」的边，不是最后一条；从前往后第一个 hit 的就是。

## 七、进阶方向（链接其他叶）

- **加权并查集（带权关系）**：节点间维护相对权值，处理「A 比 B 重 5」「判断 A、B 关系」类问题 —— 种类并查集
- **可撤销并查集（回滚）**：按秩合并 + 栈记录操作，支持撤销最近合并 —— 配合分治/离线算法
- **Kruskal 最小生成树**：并查集判环的经典应用 —— 见图算法章
- **离线 LCA（Tarjan 算法）**：并查集求最近公共祖先 —— 见[二叉树](../binary-tree/) 叶
- **连通性问题**：并查集 vs BFS/DFS 的选型 —— 见图算法章

## 权威链接

- [并查集 - 维基百科](https://zh.wikipedia.org/wiki/%E5%B9%B6%E6%9F%A5%E9%9B%86)
- [Disjoint Set Union (Union-Find) - cp-algorithms](https://cp-algorithms.com/data_structures/disjoint_set_union.html)
- [Nearly O(1) - Union-Find - Princeton](https://www.cs.princeton.edu/~rs/AlgsDS07/01UnionFind.pdf)
- [Union-Find - LeetCode 探索](https://leetcode.com/explore/learn/card/graph/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/union-find" target="_blank" rel="noopener noreferrer">并查集可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/union-find-slide/" target="_blank">并查集</a>
