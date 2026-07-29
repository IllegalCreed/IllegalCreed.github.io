---
layout: doc
outline: [2, 3]
---

# 前缀和与差分：区间求和与区间修改的 O(1) 利器

> 基于通用算法套路 · 核于 2026-07

## 速查

- **前缀和（Prefix Sum）**：构造 `prefix[i] = a[0] + a[1] + ... + a[i-1]`（`prefix[0]=0`），则**区间 `[l, r]` 的和 = `prefix[r+1] - prefix[l]`**——把每次 O(n) 的区间求和降到 **O(1)**，代价是 O(n) 预处理 + O(n) 额外空间。
- **一维前缀和构造**：`prefix[0]=0`，`prefix[i] = prefix[i-1] + a[i-1]`；查询 `sum(l,r) = prefix[r+1] - prefix[l]`。**务必让 `prefix[0]=0` 并整体右移一位**，否则 `l=0` 时减 1 越界。
- **二维前缀和（矩阵区域和）**：`S[i][j]` = 左上角 `(0,0)` 到 `(i-1,j-1)` 的元素和；构造用容斥 `S[i][j] = a[i-1][j-1] + S[i-1][j] + S[i][j-1] - S[i-1][j-1]`；查询 `(r1,c1)~(r2,c2)` 区域 = `S[r2+1][c2+1] - S[r1][c2+1] - S[r2+1][c1] + S[r1][c1]`（**容斥原理**，注意边界是 `r1`/`c1` 不是 `r1-1`，因为整体右下移了一格）。
- **差分数组（Difference Array）**：构造 `diff[i] = a[i] - a[i-1]`（`diff[0]=a[0]`），则**对区间 `[l,r]` 整体加 `v` 只需 `diff[l]+=v; diff[r+1]-=v`**——把每次 O(n) 的区间修改降到 **O(1)**，最后对 `diff` 求前缀和还原原数组。
- **前缀和 vs 差分**：互为逆运算——差分数组的前缀和 = 原数组，原数组的前缀和的差分 = 原数组。前缀和擅长**查询**（只读求和），差分擅长**修改**（批量区间改后一次还原）。
- **前缀和 + 哈希（高频）**：求「和为 k 的子数组个数」「和为 k 的最长子数组」——把 `prefix[j] - prefix[i] = k` 转成 `prefix[i] = prefix[j] - k`，边算边用哈希记录出现过的前缀和，O(n)。
- **适用边界**：前缀和要求**数组不变 + 多次查询**；差分要求**多次区间改 + 最后一次查询**；若查询与修改交替进行，两者都不够，要上**树状数组/线段树**。
- **复杂度**：构造 O(n)，单次查询/修改 O(1)，还原（差分）O(n)。

## 一、一维前缀和：区间求和 O(1)

朴素地求 `a[l..r]` 的和要 O(n)；如果数组不变但要查很多次，预处理一个前缀和数组即可 O(1) 查询。

### 构造与查询

```js
// 预处理：prefix[i] = a[0..i-1] 的和，prefix[0]=0（整体右移一位避免 l=0 越界）
function buildPrefix(a) {
  const prefix = new Array(a.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    prefix[i + 1] = prefix[i] + a[i];
  }
  return prefix;
}

// 查询 a[l..r] 的和（闭区间）
function rangeSum(prefix, l, r) {
  return prefix[r + 1] - prefix[l]; // 关键：r+1 而非 r，因为 prefix 整体右移了一位
}
```

**为什么 `prefix[0]=0` 且整体右移一位**：如果直接令 `prefix[i]=a[0..i]` 的和，那么 `sum(l,r)=prefix[r]-prefix[l-1]`，当 `l=0` 时 `l-1=-1` 越界。把 `prefix[0]=0` 空出来、所有定义右移一位，公式变成 `sum(l,r)=prefix[r+1]-prefix[l]`，永远不越界。这是新手最常踩的坑，**务必用这种「n+1 长度、prefix[0]=0」的写法**。

### 经典：和为 k 的子数组个数（LeetCode 560）

朴素是 O(n²) 枚举所有区间求和；用前缀和 + 哈希优化到 O(n)：`a[i..j]` 的和 = `prefix[j+1] - prefix[i]`，令它等于 `k`，得 `prefix[i] = prefix[j+1] - k`。边遍历边把出现过的前缀和存进哈希表（计数），查「之前有多少个前缀和等于 `当前前缀和 - k`」即可。

```js
function subarraySum(nums, k) {
  const count = new Map([[0, 1]]); // 前缀和 0 出现 1 次（空前缀）
  let pre = 0, ans = 0;
  for (const x of nums) {
    pre += x;                       // 当前前缀和
    ans += count.get(pre - k) ?? 0; // 之前有多少个前缀和 = pre-k，就有多少个区间和为 k
    count.set(pre, (count.get(pre) ?? 0) + 1);
  }
  return ans;
}
```

- **关键初始化 `count.set(0, 1)`**：表示「前缀和为 0 出现过 1 次」（空前缀），这样从头开始的合法区间（`prefix[j+1]` 本身就等于 k）才被统计到。
- 这个套路**对负数也成立**——这是它区别于滑动窗口的地方（滑窗遇到负数窗口状态不单调就失效）。

## 二、二维前缀和：矩阵区域和 O(1)

二维前缀和 `S[i][j]` 定义为「左上角 `(0,0)` 到 `(i-1,j-1)`」（同样整体右下移一格，`S[0][*]=S[*][0]=0`）的元素和。构造用**容斥原理**，查询也用容斥。

### 构造（容斥）

```
S[i][j] = a[i-1][j-1] + S[i-1][j] + S[i][j-1] - S[i-1][j-1]
```

直观：`S[i][j]` = 当前格 + 上方矩形 + 左侧矩形 − 重叠的左上角矩形（被加了两次）。

### 查询（容斥）

求 `(r1,c1)` 到 `(r2,c2)`（含端点）的矩形区域和：

```
area = S[r2+1][c2+1] - S[r1][c2+1] - S[r2+1][c1] + S[r1][c1]
```

注意减的是 `S[r1][...]` 和 `S[...][c1]`（因为整体右下移了一格，`(r1,c1)` 之前的矩形对应 `S[r1][c1]`）。

```js
function build2D(matrix) {
  const m = matrix.length, n = matrix[0].length;
  const S = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      S[i+1][j+1] = matrix[i][j] + S[i][j+1] + S[i+1][j] - S[i][j];
  return S;
}
function query2D(S, r1, c1, r2, c2) {
  return S[r2+1][c2+1] - S[r1][c2+1] - S[r2+1][c1] + S[r1][c1];
}
```

## 三、差分数组：区间修改 O(1)

差分数组是前缀和的**逆运算**——前缀和擅长「查询」，差分擅长「批量区间修改后一次性还原」。

### 构造与区间修改

```js
// 差分数组：diff[i] = a[i] - a[i-1]（diff[0] = a[0]）
// 对区间 [l, r] 整体加 v，只需改 diff 两端
function diffAdd(diff, l, r, v) {
  diff[l] += v;
  if (r + 1 < diff.length) diff[r + 1] -= v; // r+1 越界则忽略（到末尾了）
}

// 还原原数组：对 diff 求前缀和
function restore(diff) {
  const a = new Array(diff.length).fill(0);
  a[0] = diff[0];
  for (let i = 1; i < diff.length; i++) a[i] = a[i-1] + diff[i];
  return a;
}
```

**原理**：差分数组记录「相邻元素的差」。对 `[l,r]` 整体加 `v`，从 `l` 开始往后所有元素都该 +v，但 `r` 之后就不再加了——所以只需 `diff[l]+=v`（让 `l` 起的累加多 v）和 `diff[r+1]-=v`（让 `r+1` 起的累加抵消掉这 v）。这样 k 次区间修改只改 2k 个位置，最后求一次前缀和还原，总 O(n+k) 而非朴素 O(nk)。

### 经典：航班预订统计（LeetCode 1109）

`bookings[i] = [first, last, seats]` 表示航班 `[first..last]` 各加 `seats` 个座位，求最终每架航班的座位数——典型的「多次区间加，最后一次查询」。

```js
function corpFlightBookings(bookings, n) {
  const diff = new Array(n + 1).fill(0);
  for (const [f, l, s] of bookings) {
    diff[f] += s;
    diff[l + 1] -= s;          // 区间 [f, l] 加 s
  }
  const ans = [];
  let cur = 0;
  for (let i = 1; i <= n; i++) {
    cur += diff[i];             // 前缀和还原
    ans.push(cur);
  }
  return ans;
}
```

## 四、前缀和 vs 差分 vs 树状数组

| 场景 | 选择 | 单点改 | 区间改 | 区间查 | 复杂度 |
| --- | --- | --- | --- | --- | --- |
| 数组不变，多次区间求和 | 前缀和 | — | — | O(1) | 预处理 O(n) |
| 多次区间加，最后一次还原 | 差分数组 | — | O(1) | 还原 O(n) | 总 O(n+q) |
| 单点改 + 区间求和交替 | **树状数组** | O(log n) | 差分变体 O(log n) | O(log n) | 在线 |
| 区间改 + 区间查交替 | **线段树** | O(log n) | O(log n) | O(log n) | 在线 |

记住边界：**前缀和/差分是「离线」套路**（要么只读、要么只改最后查），一旦「查询与修改交替」就要升级到**树状数组（BIT）/线段树**（见[线段树与树状数组](../../segment-tree/guide-line/) 叶）。

## 五、易错点

- **`prefix[0]=0` 整体右移**：不这么写，`l=0` 的查询会 `prefix[-1]` 越界——这是最高频的坑。
- **二维查询的边界**：是 `S[r1][c2+1]` 不是 `S[r1-1][c2+1]`，因为整体右下移了一格；用具体例子手算一遍边界最稳。
- **差分还原忘了前缀和**：差分数组本身不是答案，必须求一次前缀和才是原数组。
- **差分 `r+1` 越界**：`r=n-1` 时 `r+1=n`，要么把 diff 数组开 `n+1` 长度，要么 `if (r+1 < n)` 判一下。
- **前缀和 + 哈希忘初始化 `0->1`**：漏了从下标 0 开始的合法区间会统计不全。
- **前缀和溢出**：大数组和大数值的前缀和可能超过 32 位整数范围——用 `BigInt`（JS）或 `long`（Java/C++）。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/segment-tree" target="_blank" rel="noopener noreferrer">线段树可视化演示</a> —— 前缀和/差分的「在线升级版」，支持边改边查

## 下一步

数组上的算法套路告一段落。下一节看数组在二维形态——**矩阵**——的存储布局与遍历技巧（螺旋、旋转、之字形），见[矩阵遍历](./matrix-traversal)。
