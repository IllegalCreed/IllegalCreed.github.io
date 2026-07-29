---
layout: doc
outline: [2, 3]
---

# 经典分治应用

> 基于通用算法套路 · 核于 2026-07

## 速查

- **归并排序**：分（对半切）→ 治（递归排两半）→ 合（双指针归并 O(n)）；`T(n)=2T(n/2)+O(n)=O(n log n)`，稳定、外排序友好，但需 O(n) 额外空间。
- **快速排序**：分（partition 选 pivot 划成「小/大」两段）→ 治（递归排两段）→ 合（无显式合并，partition 已就位）；平均 `O(n log n)`、原地、不稳定；最坏 `O(n²)`（有序+端点 pivot），随机化/三数取中规避。
- **二分查找**：减治特例（a=1），每次比较后只保留一半；`T(n)=T(n/2)+O(1)=O(log n)`；前提是**有序**且**可随机访问**。
- **最近点对**：平面 n 个点找最近两点；按 x 排序后左右递归取 `d=min(左,右)`，再检查「跨分割线的带状区域」（宽 2d）——朴素 O(n²) 优化到 **O(n log n)**（带状内按 y 排序后每点只比常数个邻居）。
- **Karatsuba 大整数乘法**：把 n 位乘法拆成 3 个 n/2 位子乘法（而非朴素的 4 个），`T(n)=3T(n/2)+O(n)=O(n^1.585)`，首次突破朴素 O(n²)。
- **Strassen 矩阵乘法**：把 2n×2n 矩阵乘拆成 7 个 n×n 子乘法（而非朴素的 8 个），`T(n)=7T(n/2)+O(n²)=O(n^2.807)`，优于朴素 O(n³)。
- **求众数（分治版）**：对半切，左右分别递归求众数，再合并统计出现次数——`O(n log n)`，是分治处理「统计类」问题的范例。
- **应用场景**：排序（归并/快排）、查找（二分）、计算几何（最近点对）、大数运算（Karatsuba）、线性代数（Strassen）、并行计算（MapReduce）。

## 一、归并排序：分治的教科书范例

归并排序是分治三步最清晰的体现：

```
①分：[38,27,43,3,9,82,10] → 左 [38,27,43,3]  右 [9,82,10]
②治：递归排序两半          → 左 [3,27,38,43]  右 [9,10,82]
③合：双指针归并            → [3,9,10,27,38,43,82]
```

```js
function mergeSort(a) {
  if (a.length <= 1) return a;
  const mid = a.length >> 1;
  const L = mergeSort(a.slice(0, mid));
  const R = mergeSort(a.slice(mid));
  return merge(L, R);
}
function merge(L, R) {
  const res = []; let i = 0, j = 0;
  while (i < L.length && j < R.length)
    L[i] <= R[j] ? res.push(L[i++]) : res.push(R[j++]);
  while (i < L.length) res.push(L[i++]);
  while (j < R.length) res.push(R[j++]);
  return res;
}
```

- **复杂度**：`T(n)=2T(n/2)+O(n)=O(n log n)`（主定理情况二）——**最坏、平均、最好都是 O(n log n)**，且**稳定**（相等元素相对顺序不变，因 `L[i]<=R[j]` 时取左边）。
- **代价**：需要 O(n) 额外空间（merge 时新建数组）；适合**外排序**（数据大到内存装不下，用归并合并磁盘块）。
- **vs 快排**：归并稳定、最坏 O(n log n) 但费空间；快排原地、平均快但最坏 O(n²) 不稳定——实际库排序多用快排/改进版（如 TimSort = 归并+插入）。

## 二、快速排序：分治 + 原地

快排的分治略有不同——「合」是隐式的（partition 已把元素就位），无需显式合并：

```js
function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;
  const p = partition(a, lo, hi);            // ① 分：选 pivot，划成 <pivot | pivot | >pivot
  quickSort(a, lo, p - 1);                    // ② 治：递归排左段
  quickSort(a, p + 1, hi);                    // ② 治：递归排右段
  // ③ 合：无（partition 已就位）
}
function partition(a, lo, hi) {
  const pivot = a[hi];                        // 取末位为 pivot（可随机化）
  let i = lo;                                 // i = 「小于 pivot 区」的右边界
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
  }
  [a[i], a[hi]] = [a[hi], a[i]];              // pivot 归位到 i
  return i;
}
```

- **复杂度**：平均 `T(n)=2T(n/2)+O(n)=O(n log n)`；**最坏 O(n²)**——当数组已有序且 pivot 取端点时，每次 partition 退化成 1 和 n-1，递归深度 n。
- **规避最坏**：**随机化 pivot**（随机选一个与末位交换）或**三数取中**（首、中、末的中位数）——使最坏概率趋零。
- **原地**：除递归栈外 O(1) 额外空间（partition 原地交换），实际常数小，是库排序的主力。

## 三、二分查找：减治特例

二分查找是分治的退化形式——`a=1`（只保留一半），无「合」步骤，严格说是**减治（Decrease and Conquer）**：

```js
function binarySearch(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === target) return mid;
    a[mid] < target ? (lo = mid + 1) : (hi = mid - 1); // 每次砍一半
  }
  return -1;
}
```

- **复杂度**：`T(n)=T(n/2)+O(1)=O(log n)`（主定理情况二，c=log₂1=0）。
- **前提**：①**有序**；②**可随机访问**（数组，链表不行）。
- **变体**：找第一个 ≥target（`lower_bound`）、最后一个 ≤target（`upper_bound`）——二分答案是「在单调函数上找边界」的通用武器。
- **为何算分治**：广义分治包含减治；二分的递推关系 `T(n)=T(n/2)+O(1)` 完全符合主定理形式，只是 a=1。

## 四、最近点对：分治在几何上的威力

平面 n 个点，找距离最近的两点。朴素两两比较 O(n²)；分治优化到 O(n log n)。

**算法**：

```
①按 x 排序，按 x 中位数切成左右两半
②递归求左半最近距 dL、右半最近距 dR，取 d = min(dL, dR)
③检查「跨分割线」的点对：只看以分割线为中心、宽 2d 的带状区域内
  → 把带内点按 y 排序，对每个点只检查其后常数个（理论 ≤7）邻居
```

```js
function closestPair(pts) {
  const xs = [...pts].sort((a, b) => a.x - b.x);
  return rec(xs);
  function rec(P) {
    if (P.length <= 3) return bruteForce(P);   // 小规模直接算
    const mid = P.length >> 1, midX = P[mid].x;
    const dL = rec(P.slice(0, mid));
    const dR = rec(P.slice(mid));
    let d = Math.min(dL, dR);
    // 带状区域：|x - midX| < d 的点，按 y 排序
    const strip = P.filter(p => Math.abs(p.x - midX) < d)
                   .sort((a, b) => a.y - b.y);
    for (let i = 0; i < strip.length; i++)
      for (let j = i + 1; j < strip.length && strip[j].y - strip[i].y < d; j++)
        d = Math.min(d, dist(strip[i], strip[j]));
    return d;
  }
}
```

- **复杂度**：递归 `T(n)=2T(n/2)+O(n)`（带内按 y 排序若每次重排是 O(n log n)，则总 O(n log²n)；若整体预排序维护则优化到 **O(n log n)**）。
- **关键洞见**：带状区域内按 y 排序后，每个点只需检查其后**常数个**邻居（几何上可证明 ≤7）——这是把 O(n²) 降到 O(n log n) 的核心。
- **朴素版 O(n log²n)**：每次递归内对带状重新按 y 排序；**优化版 O(n log n)**：预处理一个按 y 排序的副本递归维护。

## 五、Karatsuba 大整数乘法

两个 n 位大整数相乘，朴素做法是「4 个 n/2 位子乘法」O(n²)；Karatsuba 用代数技巧减到「3 个子乘法」O(n^1.585)。

设 x = x₁·B + x₀，y = y₁·B + y₀（B = 2^(n/2)），朴素：

```
x·y = x₁y₁·B² + (x₁y₀ + x₀y₁)·B + x₀y₀     （4 次子乘法）
```

Karatsuba 关键：用 1 次乘法代替中间的 2 次：

```
令 z0 = x₀·y₀,  z2 = x₁·y₁
z1 = (x₁+x₀)·(y₁+y₀) − z2 − z0             （只多 1 次子乘法！）
x·y = z2·B² + z1·B + z0                      （共 3 次子乘法）
```

- **复杂度**：`T(n)=3T(n/2)+O(n)=O(n^1.585)`（主定理情况一，c=log₂3≈1.585）——首次证明乘法可亚二次。
- **意义**：打破了「乘法至少 O(n²)」的直觉，开启了快速乘法研究（后续 Toom-Cook、FFT 乘法进一步降到 O(n log n)）。

## 六、Strassen 矩阵乘法

两个 n×n 矩阵相乘，朴素按定义 O(n³)；Strassen（1969）用 7 个（而非 8 个）子矩阵乘法降到 O(n^2.807)。

把 2n×2n 矩阵分块成 4 个 n×n 子块，朴素需要 8 次 n×n 乘法；Strassen 构造了 7 个中间矩阵 M₁..M₇（每个是一次子块乘法），再组合出结果——省掉一次乘法，代价是若干次矩阵加减（O(n²)，被吸收）。

- **复杂度**：`T(n)=7T(n/2)+O(n²)=O(n^2.807)`（主定理情况一，c=log₂7≈2.807）。
- **意义**：首次打破矩阵乘法 O(n³) 屏障；当前最优约 O(n^2.373）但常数极大，实战中小矩阵仍用朴素（Strassen 在 n 较大时才划算，且数值稳定性较差）。

## 七、求众数（分治版）

数组中出现次数超过一半的元素（多数元素），分治思路：

```
①对半切左右两半
②递归求左半众数 mL、右半众数 mR
③若 mL===mR，众数即它；否则统计两候选在整个区间出现次数取多者
```

- **复杂度**：`T(n)=2T(n/2)+O(n)=O(n log n)`——虽不及 Boyer-Moore 投票法的 O(n)，但是分治处理「统计类」问题的清晰范例。
- **更优解**：Boyer-Moore 摩尔投票法 O(n) 时间 O(1) 空间——分治版的价值在于练习分治思想。

## 八、应用场景与选型

| 问题 | 分治算法 | 复杂度 | 备注 |
| --- | --- | --- | --- |
| 排序 | 归并/快排 | O(n log n) | 归并稳定、快排原地 |
| 有序查找 | 二分查找 | O(log n) | 减治，前提有序+随机访问 |
| 最近点对 | 分治 | O(n log n) | 几何问题分治典范 |
| 大整数乘法 | Karatsuba | O(n^1.585) | 亚二次，n 大时优于朴素 |
| 矩阵乘法 | Strassen | O(n^2.807) | 亚三次，n 大时优于朴素 |
| 多数元素 | 分治 | O(n log n) | 练习用，实战用投票法 |

**何时选分治**：①问题能切成同构、独立的子问题；②合并不贵；③子问题不重叠（重叠则升级为 DP）。详见[入门：分治三步与适用条件](../getting-started)。

## 下一步

掌握了经典应用后，下一步是把这些算法的复杂度、模板、易错点整理成速查表——见[参考](../reference)。
