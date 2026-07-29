---
layout: doc
outline: [2, 3]
---

# 线段树：区间查询与懒标记

> 基于通用算法套路 · 核于 2026-07

## 速查

- **本质**：把数组 `a[0..n-1]` 映射成一棵**二叉树**，每个节点管一个区间 `[l, r]` 并存该区间的聚合信息（和/最值等）；叶子节点 `l==r` 对应单个元素。
- **存储**：用一维数组 `tree[4n]` 存树（4n 防越界），节点 `p` 的左右孩子是 `2p`（左）、`2p+1`（右）——完全二叉树式下标映射。
- **建树（build）**：递归二分，`O(n)`——每个节点访问一次。
- **单点修改**：递归到对应叶子改值，回溯时 `pushUp(p) = tree[p] = tree[2p] + tree[2p+1]`——`O(log n)`。
- **区间查询**：从根递归，能完全覆盖就返回该节点值，否则下分到孩子合并——`O(log n)`（最多 4 个边界节点 × 树高）。
- **区间修改 + 懒标记（lazy propagation）**：对 `[l,r]` 整体加 v，先在「完全覆盖」的节点上**记账**（`lazy[p] += v`，`tree[p] += v × 区间长度`），**不立刻下传**；等后续操作必须经过其孩子时，用 `pushDown` 把 lazy 下传——把区间修改从 O(n) 压到 **O(log n)**。
- **pushUp（上传）**：`tree[p] = tree[2p] + tree[2p+1]`——子节点改后重新算父节点。
- **pushDown（下传）**：把父节点的 `lazy` 转移给孩子（`lazy[child] += lazy[p]`，`tree[child] += lazy[p] × 区间长度`），清空父 lazy。
- **适用**：任意满足**结合律**的运算（和、积、min/max、GCD、异或）；区间改 + 区间查交替。
- **变体**：单点查/区间改、区间改/区间查、离线扫描线、动态开点（值域大）、可持久化（主席树）。
- **交互演示**：[线段树可视化](https://algo.illegalscreed.cn/docs/segment-tree)。

## 一、建树：把数组编成一棵二叉树

线段树把 `[0, n-1]` 递归二分，每个节点存它所管区间的聚合（这里以**区间和**为例）：

```
            [0,7] : sum=36
           /     \
       [0,3]:10  [4,7]:26
       /   \      /   \
    [0,1] [2,3] [4,5] [6,7]
     /\    /\    /\    /\
    0  1  2  3  4  5  6  7
```

用数组 `tree[4n]` 存（节点编号从 1 开始，`tree[1]` 是根）。`4n` 是因为：满二叉树需要 `2^(ceil(log2 n)+1)-1` 个节点，对非 2 的幂的 n 会多一点，开 `4n` 最稳。

```js
const N = 1e5;
const tree = new Array(4 * N).fill(0);  // 区间和
const lazy = new Array(4 * N).fill(0);  // 懒标记

// build(p, l, r): 建立节点 p，管区间 [l, r]
function build(p, l, r, a) {
  if (l === r) { tree[p] = a[l]; return; }       // 叶子
  const mid = (l + r) >> 1;
  build(2 * p, l, mid, a);                        // 左孩子管 [l, mid]
  build(2 * p + 1, mid + 1, r, a);                // 右孩子管 [mid+1, r]
  tree[p] = tree[2 * p] + tree[2 * p + 1];        // pushUp：合并
}
```

建树是**后序**：先递归建左右孩子，再用 `pushUp` 合并出当前节点。每个节点访问一次，总共 O(n)。

## 二、单点修改与区间查询（无懒标记）

### pushUp：子节点改后重算父节点

```js
function pushUp(p) {
  tree[p] = tree[2 * p] + tree[2 * p + 1];   // 父 = 左子 + 右子
}
```

### 单点修改：改 a[idx] = val

递归到叶子 `l==r==idx` 改值，回溯时 `pushUp` 更新所有祖先。

```js
function update(p, l, r, idx, val) {
  if (l === r) { tree[p] = val; return; }     // 命中叶子
  const mid = (l + r) >> 1;
  if (idx <= mid) update(2 * p, l, mid, idx, val);
  else update(2 * p + 1, mid + 1, r, idx, val);
  pushUp(p);                                   // 回溯重算
}
```

### 区间查询：查 [ql, qr] 的和

从根递归，能完全覆盖（`ql <= l && r <= qr`）就直接返回该节点；否则下分到孩子，合并结果。

```js
function query(p, l, r, ql, qr) {
  if (ql <= l && r <= qr) return tree[p];     // 完全覆盖，直接返回
  const mid = (l + r) >> 1;
  let sum = 0;
  if (ql <= mid)  sum += query(2 * p, l, mid, ql, qr);
  if (qr >  mid)  sum += query(2 * p + 1, mid + 1, r, ql, qr);
  return sum;
}
```

**为什么是 O(log n)**：`[ql, qr]` 在树上被拆成**至多 O(log n) 个完全覆盖的子区间**（每层至多 2 个边界），所以只碰 O(log n) 个节点。

## 三、区间修改与懒标记（高频考点）

### 朴素区间修改为何是 O(n)

对 `[ql, qr]` 整体加 v，朴素做法要递归到每个叶子改值——叶子有 n 个，O(n)。如果区间修改很频繁，这退化严重。

### 懒标记（lazy propagation）思想

核心：**延迟下传**。对一个「完全覆盖」的节点（`ql <= l && r <= qr`），不往下递归到叶子，而是：

1. 直接在该节点 `tree[p] += v × (r - l + 1)`（这整个区间的和增加 `v × 长度`）。
2. 在 `lazy[p] += v` **记账**，表示「这个节点的孩子还没被更新，欠它们每人 v」。

之后某次操作（查询或修改）**必须经过该节点的孩子**时，才用 `pushDown` 把欠的值下传给孩子。这样一次区间修改只碰 O(log n) 个「完全覆盖」节点，复杂度从 O(n) 降到 **O(log n)**。

```js
// 区间修改：对 [ql, qr] 整体加 v
function updateRange(p, l, r, ql, qr, v) {
  if (ql <= l && r <= qr) {                    // 完全覆盖：记账，不往下
    tree[p] += v * (r - l + 1);
    lazy[p] += v;
    return;
  }
  pushDown(p, l, r);                            // 下传旧标记后再分治
  const mid = (l + r) >> 1;
  if (ql <= mid) updateRange(2 * p, l, mid, ql, qr, v);
  if (qr >  mid) updateRange(2 * p + 1, mid + 1, r, ql, qr, v);
  pushUp(p);                                    // 回溯重算
}
```

### pushDown：下传懒标记

把父节点 `p` 的 lazy 转移给两个孩子，再清空父 lazy。注意要按**区间长度**放大（区间加 v，长度为 len 的子区间和增加 `v × len`）。

```js
function pushDown(p, l, r) {
  if (lazy[p] === 0) return;
  const mid = (l + r) >> 1;
  lazy[2 * p]     += lazy[p];                            // 孩子继承标记
  lazy[2 * p + 1] += lazy[p];
  tree[2 * p]     += lazy[p] * (mid - l + 1);            // 左孩子长 mid-l+1
  tree[2 * p + 1] += lazy[p] * (r - mid);                // 右孩子长 r-mid
  lazy[p] = 0;                                           // 父标记清零
}
```

### 带 lazy 的区间查询

查询时也要先 `pushDown`，确保经过的孩子拿到最新值：

```js
function queryRange(p, l, r, ql, qr) {
  if (ql <= l && r <= qr) return tree[p];
  pushDown(p, l, r);
  const mid = (l + r) >> 1;
  let sum = 0;
  if (ql <= mid) sum += queryRange(2 * p, l, mid, ql, qr);
  if (qr >  mid) sum += queryRange(2 * p + 1, mid + 1, r, ql, qr);
  return sum;
}
```

## 四、何时必须 pushDown / pushUp

这是初学者最易写错的地方，记住两条铁律：

- **下分孩子前必 `pushDown`**：任何要递归进孩子的操作（区间改/区间查），进孩子**之前**必须把当前节点的 lazy 下传，否则孩子用的是过期值。
- **回溯父节点前必 `pushUp`**：任何修改了孩子的操作，回溯到父节点**之前**必须重新合并（`pushUp`），否则父节点值过期。

单点修改不需要 `pushDown`（不涉及孩子记账），但需要 `pushUp`；区间改和区间查两者都需要。

## 五、维护的信息：必须满足结合律

线段树能维护的运算必须满足**结合律** `a·(b·c) = (a·b)·c`（这样子区间合并的顺序不影响结果）。常见可维护的：

- **求和**：`tree[p] = tree[2p] + tree[2p+1]`，区间改 `tree[p] += v × len`。
- **最值**：`tree[p] = min(tree[2p], tree[2p+1])`，但区间改只能是赋值或加常数，区间加最值的 lazy 推导略复杂。
- **异或**：`tree[p] = tree[2p] ^ tree[2p+1]`。
- **GCD**：`tree[p] = gcd(tree[2p], tree[2p+1])`。

**不满足结合律**的查询（如区间第 k 小、区间众数）线段树无能为力，需用**主席树（可持久化线段树）**或**莫队**等更重结构。

## 六、经典应用

- **RMQ（区间最值）**：`tree[p] = min(tree[2p], tree[2p+1])`，单点改 + 区间查最小值。
- **区间和 + 区间加**：上文模板，LeetCode 307 区域和检索（可变）。
- **扫描线求矩形面积并**：把矩形拆成「竖边事件」，线段树维护 y 轴覆盖长度。
- **动态开点线段树**：值域极大（如 10⁹）但操作少时，只开用到的节点，空间 O(q log V)。

## 七、易错点

- **数组只开 2n 越界**：n 非 2 的幂时节点数超过 2n，必须开 **4n**。
- **区间改忘 pushDown**：进孩子前不下传，孩子用旧值导致结果错误。
- **区间查忘 pushDown**：同上，查到的是过期值。
- **单点改多余地 pushDown**：单点改不涉及孩子记账，pushDown 是浪费（虽然不错）。
- **lazy 没清零**：pushDown 后必须 `lazy[p] = 0`，否则会重复下传。
- **区间加忘乘长度**：`tree[p] += v × (r-l+1)` 不是 `tree[p] += v`，否则区间和不对。
- **mid 用 `(l+r)/2`**：JS 大数精度问题，用 `(l + r) >> 1`（位运算，且 n≤10⁶ 不会溢出）。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/segment-tree" target="_blank" rel="noopener noreferrer">线段树可视化演示</a> —— 区间分治树的建树、区间查询与懒标记下推过程

## 下一步

线段树讲完了。它的「轻量级表亲」**树状数组**用 `lowbit` 把同样的 O(log n) 能力塞进一个普通数组，代码极短、常数极小，是求逆序对、动态前缀和的首选，见[树状数组（BIT）：轻量的前缀结构](./fenwick-tree)。
