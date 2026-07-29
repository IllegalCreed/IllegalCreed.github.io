---
layout: doc
outline: [2, 3]
---

# 参考：线段树与树状数组 API、复杂度速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定位**：线段树与树状数组是前缀和/差分的「在线升级版」，支持**边改边查**，单次操作 **O(log n)**。
- **线段树**：分治二叉树，每节点存区间聚合；建树 O(n)，单点改/区间查/区间改+懒标记全 O(log n)；空间 **4n**。
- **树状数组（BIT）**：`tree[i]` 管 `[i-lowbit(i)+1, i]`，`lowbit(x)=x&(-x)`；单点改/前缀查 O(log n)，区间查=两前缀减；空间 **n+1**。
- **懒标记（lazy propagation）**：区间改时在「完全覆盖」节点记账（`lazy[p]+=v`），不立刻下传；下分孩子前 `pushDown`，回溯前 `pushUp`——把区间改从 O(n) 压到 O(log n)。
- **选型口诀**：**区间改+区间查 → 线段树；单点改+区间查、追常数 → 树状数组；只查不改 → 前缀和**。
- **共同前提**：维护的信息须满足**结合律**；树状数组额外要求**可逆**（能 a-b 还原）。
- **交互演示**：[线段树](https://algo.illegalscreed.cn/docs/segment-tree)、[树状数组](https://algo.illegalscreed.cn/docs/fenwick)。

## 一、复杂度对比表

| 操作 | 前缀和 | 差分数组 | 树状数组（BIT） | 线段树 |
| --- | --- | --- | --- | --- |
| 预处理 | O(n) | O(n) | O(n) | **O(n)** |
| 单点查询 | O(1) | 还原 O(n) | query O(log n) | O(log n) |
| 单点修改 | **重建 O(n)** ❌ | O(1) | **O(log n)** ✅ | **O(log n)** ✅ |
| 区间查询（和） | **O(1)** ✅ | 还原 O(n) | O(log n) | O(log n) |
| 区间修改 | 重建 O(n) ❌ | **O(1)** ✅ | 差分技巧 O(log n) | **O(log n)** ✅ |
| 在线（改查交替） | ❌ 离线 | ❌ 离线 | **✅** | **✅** |
| 空间 | n+1 | n+1 | n+1 | **4n** |

一句话：**前缀和/差分是离线 O(1) 极致；树状数组/线段树是在线 O(log n) 通用**。

## 二、线段树代码模板（区间加 + 区间和 + 懒标记）

```js
class SegTree {
  constructor(a) {
    this.n = a.length;
    this.tree = new Array(4 * this.n).fill(0);
    this.lazy = new Array(4 * this.n).fill(0);
    this._build(1, 0, this.n - 1, a);       // 根节点 1，管 [0, n-1]
  }
  _build(p, l, r, a) {
    if (l === r) { this.tree[p] = a[l]; return; }
    const m = (l + r) >> 1;
    this._build(2*p, l, m, a);
    this._build(2*p+1, m+1, r, a);
    this.tree[p] = this.tree[2*p] + this.tree[2*p+1];   // pushUp
  }
  _pushDown(p, l, r) {
    if (this.lazy[p] === 0) return;
    const m = (l + r) >> 1;
    this.lazy[2*p]   += this.lazy[p];
    this.lazy[2*p+1] += this.lazy[p];
    this.tree[2*p]   += this.lazy[p] * (m - l + 1);
    this.tree[2*p+1] += this.lazy[p] * (r - m);
    this.lazy[p] = 0;
  }
  // 区间 [ql, qr] 加 v
  add(ql, qr, v) { this._add(1, 0, this.n - 1, ql, qr, v); }
  _add(p, l, r, ql, qr, v) {
    if (ql <= l && r <= qr) {
      this.tree[p] += v * (r - l + 1);
      this.lazy[p] += v;
      return;
    }
    this._pushDown(p, l, r);
    const m = (l + r) >> 1;
    if (ql <= m) this._add(2*p, l, m, ql, qr, v);
    if (qr >  m) this._add(2*p+1, m+1, r, ql, qr, v);
    this.tree[p] = this.tree[2*p] + this.tree[2*p+1];   // pushUp
  }
  // 区间 [ql, qr] 求和
  sum(ql, qr) { return this._sum(1, 0, this.n - 1, ql, qr); }
  _sum(p, l, r, ql, qr) {
    if (ql <= l && r <= qr) return this.tree[p];
    this._pushDown(p, l, r);
    const m = (l + r) >> 1;
    let s = 0;
    if (ql <= m) s += this._sum(2*p, l, m, ql, qr);
    if (qr >  m) s += this._sum(2*p+1, m+1, r, ql, qr);
    return s;
  }
}
```

**变体要点**：单点改把 `_add` 退化为递归到叶子改值 + `pushUp`（不需 `pushDown`）；求最值把聚合换成 `min/max`（区间加最值的 lazy 推导更复杂，通常用赋值型修改）。

## 三、树状数组代码模板（单点改 + 前缀查）

```js
class BIT {
  constructor(n) {            // n 为元素个数，下标 1..n
    this.n = n;
    this.tree = new Array(n + 1).fill(0);
  }
  static lowbit(x) { return x & (-x); }
  // 单点修改：a[i] += v（i 从 1 开始）
  add(i, v) {
    for (; i <= this.n; i += BIT.lowbit(i)) this.tree[i] += v;
  }
  // 前缀查询：a[1] + ... + a[i]
  query(i) {
    let s = 0;
    for (; i > 0; i -= BIT.lowbit(i)) s += this.tree[i];
    return s;
  }
  // 区间查询 [l, r] 的和
  rangeSum(l, r) { return this.query(r) - this.query(l - 1); }
}
```

**差分技巧**（区间加 + 单点查）：维护差分数组 `d[i]=a[i]-a[i-1]`，区间 `[l,r]` 加 v → `add(l,v); add(r+1,-v)`；查 `a[i]` → `query(i)`。

## 四、选型决策

```
需要维护区间信息（和/最值/异或…）？
├─ 否 → 别用，前缀和/差分/普通数组够
└─ 是 → 查询与修改是否交替进行（在线）？
    ├─ 否（只读多查 / 只改后一次查）→ 前缀和 / 差分数组（O(1)）
    └─ 是 → 需要区间修改吗？
        ├─ 只需单点改 + 区间查 → 树状数组（BIT，常数小、代码短）
        └─ 需要区间改 + 区间查 → 线段树（带懒标记）
            └─ 维护的是「加/异或」等可逆运算？
                ├─ 是且追求常数 → 树状数组差分技巧（仅加法）
                └─ 否（最值、不可逆）→ 线段树（唯一选择）
```

| 场景 | 推荐 | 理由 |
| --- | --- | --- |
| 数组不变，多次区间求和 | 前缀和 | O(1) 查询，最简 |
| 多次区间加，最后一次查 | 差分数组 | O(1) 修改 |
| 单点改 + 区间求和交替 | **树状数组** | O(log n) 常数小 |
| 区间改 + 区间查交替（加法） | 线段树 / BIT 差分 | 都可，线段树更直观 |
| 区间改 + 区间查（最值） | **线段树** | BIT 难维护不可逆运算 |
| 求逆序对 / 动态排名 | **树状数组** | 扫描计数，常数小 |
| 区间第 k 小 | 主席树 / 莫队 | 线段树/BIT 无能为力 |

## 五、易错点清单

**线段树**

- **数组开 2n 越界**：n 非 2 的幂时节点超 2n，开 **4n**。
- **区间改/查忘 `pushDown`**：进孩子前不下传，孩子用旧值出错。
- **单点改多余 `pushDown`**：单点改不涉及记账，下传是浪费（虽不出错）。
- **`lazy` 没清零**：`pushDown` 后须 `lazy[p]=0`，否则重复下传。
- **区间加忘乘长度**：`tree[p] += v*(r-l+1)`，不是 `+=v`。
- **`mid = (l+r)/2` 精度**：JS 大数可能丢精度，用 `(l+r) >> 1`。

**树状数组**

- **下标从 0**：BIT **从 1 开始**（`lowbit(0)=0` 死循环），原数组 `a[0..n-1]` 映射到 `tree[1..n]`。
- **忘离散化**：值域大（10⁹）直接开数组爆内存，先离散化到 `[1,n]`。
- **区间加 `r+1` 越界**：`add(r+1,-v)` 时 `r+1` 可能 `=n+1`，要 `if (r+1<=n)`。
- **维护最值用 BIT**：最值不可逆，BIT 区间改无法正确更新，用线段树。
- **建树用 `add` 导致 O(n log n)**：n 大时可能 TLE，用 O(n) 版。

## 六、进阶方向

- **主席树（可持久化线段树）**：保存历史版本，做区间第 k 小、区间历史和——见后续高级叶。
- **扫描线**：线段树维护坐标轴覆盖长度，求矩形面积并、周长并。
- **动态开点线段树**：值域 10⁹ 但操作少时，只开用到的节点，空间 O(q log V)。
- **树套树**：线段树套 BIT 等处理二维区间问题。
- **莫队算法**：离线区间查询，O((n+q)√n)，适合不带修改的区间统计。

## 权威链接

- [线段树 - 维基百科](https://zh.wikipedia.org/wiki/%E7%BA%BF%E6%AE%B5%E6%A0%91)
- [树状数组 - 维基百科](https://zh.wikipedia.org/wiki/%E6%A0%91%E7%8A%B6%E6%95%B0%E7%BB%84)
- [Segment Tree - CP-Algorithms](https://cp-algorithms.com/data_structures/segment_tree.html)
- [Fenwick Tree - CP-Algorithms](https://cp-algorithms.com/data_structures/fenwick.html)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/segment-tree" target="_blank" rel="noopener noreferrer">线段树可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/fenwick" target="_blank" rel="noopener noreferrer">树状数组可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/segment-tree-slide/" target="_blank">线段树与树状数组</a>
