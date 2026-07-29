---
layout: doc
outline: [2, 3]
---

# 路径压缩与按秩合并：近乎 O(1) 的魔法

> 基于通用算法套路 · 核于 2026-07

## 速查

- **朴素的问题**：若每次都把长链挂到根下，树可能退化成**链**，find/union 最坏 **O(n)**。
- **路径压缩（Path Compression）**：`find` 时顺手把路径上所有节点**直接挂到根**——下次查询这些节点就是 O(1)。递归一行搞定。
- **按秩合并（Union by Rank）**：合并时把**矮树挂到高树下**（`rank` 是树高的上界），保证树高增长缓慢——单次操作 **O(log n)**。
- **按大小合并（Union by Size）**：把**小集合挂到大集合下**（`size` 是集合元素数），效果与按秩合并等价，实现更直观。
- **两者结合**：路径压缩 + 按秩/按大小合并 ⇒ 每次操作均摊 **O(α(n))**，其中 α 是**阿克曼反函数**。
- **α(n) 极小**：对任意「可想象的实际 n」（n ≤ 10⁸⁰），α(n) < 5，**实际就是常数 O(1)**。
- **路径压缩递归模板**：`if (parent[x]!==x) parent[x]=find(parent,parent[x]); return parent[x];`——一行把整条路径压平。
- **按秩合并要点**：维护 `rank[]`，根不同时比 rank，`rank` 小的挂大的，rank 相同时任挂一边且被挂方的 rank +1。
- **只用一种也行**：单用路径压缩或单用按秩合并都能到 O(log n)；**同时用才到 O(α(n))**。
- **进阶顺序**：掌握两大优化后，进入[工程应用](./applications)（连通分量、Kruskal、等价类）。

## 一、朴素实现的退化问题

朴素并查集（无任何优化）的 `union` 直接 `parent[rootX] = rootY`，如果输入「不幸」，树会退化成一条长链：

```
依次 union(0,1), union(1,2), union(2,3), ..., union(n-2, n-1)
→ 0 ← 1 ← 2 ← 3 ← ... ← n-1（一条链，根是 0）
```

此时 `find(n-1)` 要从 n-1 一路走到 0，**O(n)**。如果再做 n 次 find，总复杂度 **O(n²)**——比直接用数组还慢。这就是朴素并查集最怕的「退化成链」场景。

解决思路有两条，**同时使用**才能达到近乎 O(1)：

1. **路径压缩**：治「已经变长的路径」——查询时顺手压平。
2. **按秩/按大小合并**：治「还在变长的树」——合并时控制树高。

## 二、路径压缩：find 时挂到根

路径压缩的核心思想：**既然都要 find 到根，不如顺手把沿途的节点直接挂到根下**——这样这条路径上的所有节点下次查询都是 O(1)。

### 递归实现（推荐，一行压平整条路径）

```js
function find(parent, x) {
  if (parent[x] !== x) {
    parent[x] = find(parent, parent[x]); // 递归找根，回溯时把 x 直接挂到根
  }
  return parent[x];
}
```

执行 `find(x)` 时，从 `x` 到根的整条路径上**所有节点**都会被直接接到根下（因为递归回溯时每一层都执行了 `parent[x] = 根`）。下次再查这些节点，一步就到根。

### 迭代实现（两趟：先找根，再压平）

```js
function find(parent, x) {
  let root = x;
  while (parent[root] !== root) root = parent[root]; // 第一趟：找根
  while (parent[x] !== root) {                        // 第二趟：路径压缩
    const next = parent[x];
    parent[x] = root;                                  // 挂到根
    x = next;
  }
  return root;
}
```

迭代版适合「递归太深怕爆栈」的场景（n 极大时），但代码稍长。日常用递归版即可。

### 效果

路径压缩让**树越来越扁平**——查询越多，树越平，后续查询越快。单用路径压缩，每次操作均摊 **O(log n)**（实际比理论更接近常数）。

## 三、按秩合并：矮树挂高树

路径压缩是「事后补救」（查询时压平），按秩合并是「事前预防」（合并时控制树高）。

维护一个 `rank[]` 数组，`rank[i]` 是以 `i` 为根的树的**高度上界**（不是精确高度，因为路径压缩会改结构但 rank 不下调，所以只是上界）。合并时：

- 比较 `rank[rootX]` 和 `rank[rootY]`。
- **rank 小的树挂到 rank 大的树下**（保证合并后树高不增）。
- 若 rank 相等，任选一边挂，被挂方（新的根）的 **rank + 1**。

```js
function union(parent, rank, x, y) {
  const rx = find(parent, x), ry = find(parent, y);
  if (rx === ry) return;
  if (rank[rx] < rank[ry]) {        // rx 矮，挂到 ry 下
    parent[rx] = ry;
  } else if (rank[rx] > rank[ry]) { // ry 矮，挂到 rx 下
    parent[ry] = rx;
  } else {                           // 等高，任挂一边，新根 rank+1
    parent[rx] = ry;
    rank[ry]++;
  }
}
```

**为什么有效**：只有「两棵等高的树」合并才会让树高 +1；按「矮挂高」合并，树高增长非常缓慢——n 个元素的树高最多 **log₂ n**，所以单用按秩合并，每次操作 **O(log n)**。

## 四、按大小合并：小挂大（更直观）

按大小合并（Union by Size）维护 `size[]`（集合元素数），合并时把**元素少的集合挂到元素多的集合下**：

```js
function union(parent, size, x, y) {
  const rx = find(parent, x), ry = find(parent, y);
  if (rx === ry) return;
  if (size[rx] < size[ry]) {         // rx 小，挂到 ry 下
    parent[rx] = ry;
    size[ry] += size[rx];
  } else {                            // ry 小或相等，挂到 rx 下
    parent[ry] = rx;
    size[rx] += size[ry];
  }
}
```

效果与按秩合并**等价**（都能保证树高 O(log n)），但 `size` 还有额外用途——可以直接读出某集合的元素个数（`size[find(x)]`），所以**工程上更常用按大小合并**。

**为什么小挂大能控制树高**：每次合并，被挂方（小集合）的元素至少翻倍（因为挂到的集合更大），所以任意元素到根的距离最多 **log₂ n**——树高 O(log n)。

## 五、两者结合：均摊 O(α(n)) ≈ O(1)

把**路径压缩 + 按秩合并（或按大小合并）**同时用上，每次操作的均摊复杂度是：

```
O(α(n))，α(n) = 阿克曼反函数（inverse Ackermann function）
```

其中 α(n) 是一个增长**极慢**的函数——慢到对任意「可想象的实际 n」（哪怕 n = 10⁸⁰，超过宇宙原子总数），α(n) < 5。所以在任何实际场景里，**α(n) 都是不超过 5 的常数**，并查集每次操作就是 **事实上的 O(1)**。

**阿克曼反函数是什么**：阿克曼函数 A(m,n) 增长极快（比任何原始递归函数都快）；α(n) 定义为「使 A(m,m) ≥ n 成立的最小 m」。它是「增长极快函数的反函数」，所以增长极慢。严格的均摊复杂度证明由 Tarjan（1975）给出，是数据结构里最美的结果之一。

| 实现方式 | 单次最坏 | 单次均摊 | 说明 |
| --- | --- | --- | --- |
| 朴素（无优化） | O(n) | O(n) | 退化成链 |
| 仅路径压缩 | O(log n) | **O(log n)** | 实际接近常数 |
| 仅按秩/按大小合并 | O(log n) | O(log n) | 树高有保证 |
| 路径压缩 + 按秩/按大小 | O(α(n)) | **O(α(n)) ≈ O(1)** | 最优 |

## 六、完整实现：路径压缩 + 按秩合并

把两大优化组合起来，就是面试和工程里的标准并查集模板（约 20 行）：

```js
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i); // 自己是自己的根
    this.rank = new Array(n).fill(0);                     // 初始 rank 全 0
    this.count = n;                                       // 集合数（连通分量数）
  }
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);         // 路径压缩：挂到根
    }
    return this.parent[x];
  }
  union(x, y) {
    const rx = this.find(x), ry = this.find(y);
    if (rx === ry) return false;                          // 已同组
    if (this.rank[rx] < this.rank[ry]) this.parent[rx] = ry;       // 矮挂高
    else if (this.rank[rx] > this.rank[ry]) this.parent[ry] = rx;
    else { this.parent[rx] = ry; this.rank[ry]++; }       // 等高，新根 rank+1
    this.count--;                                          // 集合数 -1
    return true;                                           // 真正发生了合并
  }
  connected(x, y) { return this.find(x) === this.find(y); }
}
```

这个模板记住：`find` 递归压平、`union` 按秩挂根并维护 `count`。几乎所有并查集题都是它的变体。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/union-find" target="_blank" rel="noopener noreferrer">并查集可视化演示</a> —— 路径压缩如何把长链压平、按秩合并如何控制树高

## 下一步

掌握了两大优化后，并查集就「快」了。下一步看它在工程中的真实用武之地——**连通分量计数、Kruskal 最小生成树判环、朋友圈/岛屿等价类、动态连通性**，见[工程应用](./applications)。
