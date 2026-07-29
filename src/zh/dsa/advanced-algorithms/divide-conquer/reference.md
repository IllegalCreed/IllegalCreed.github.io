---
layout: doc
outline: [2, 3]
---

# 参考：分治 API、主定理与应用速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **分治三步**：分（切成 a 个 n/b 规模同构子问题）→ 治（递归求解，小则直接算）→ 合（拼装子问题解）。
- **递推关系**：`T(n) = a·T(n/b) + f(n)`；`a`=子问题数，`n/b`=子问题规模，`f(n)`=分合代价。
- **主定理**：令 `c = log_b a`，比较 `f(n)` 与 `n^c`：①`f(n) < n^c` → `T(n)=Θ(n^c)`（叶子主导）；②`f(n) ≈ n^c` → `T(n)=Θ(n^c · log n)`（平衡）；③`f(n) > n^c` 且正则 → `T(n)=Θ(f(n))`（根主导）。
- **归并排序**：`T(n)=2T(n/2)+O(n)=O(n log n)`，稳定，O(n) 空间。
- **快速排序**：平均 `2T(n/2)+O(n)=O(n log n)`，原地，最坏 O(n²)，不稳定。
- **二分查找**：减治（a=1），`T(n)=T(n/2)+O(1)=O(log n)`，前提有序+随机访问。
- **最近点对**：`2T(n/2)+O(n)=O(n log n)`，带状检查只比常数邻居。
- **Karatsuba**：`3T(n/2)+O(n)=O(n^1.585)`，3 次子乘法代替 4 次。
- **Strassen**：`7T(n/2)+O(n²)=O(n^2.807)`，7 次子乘法代替 8 次。
- **分治 vs DP**：子问题**独立 → 分治**；**重叠 → DP**（记忆化/递推）。
- **代码模板**：`solve(p)` → 小则直接算 → `divide(p).map(solve)` → `combine`。
- **交互演示**：分治无专门可视化，见[归并排序](https://algo.illegalscreed.cn/docs/merge-sort)、[快速排序](https://algo.illegalscreed.cn/docs/quick-sort)。

## 一、主定理三种情况速查

令 `c = log_b a`，`g(n) = n^c`：

| 情况 | 条件（f(n) 与 n^c 的关系） | 结论 | 谁主导 | 典型 |
| --- | --- | --- | --- | --- |
| 一 | `f(n) = O(n^(c-ε))`（多项式更小） | `T(n) = Θ(n^c)` | 叶子（递归终点） | Strassen、Karatsuba |
| 二 | `f(n) = Θ(n^c · log^k n)`（同阶） | `T(n) = Θ(n^c · log^(k+1) n)` | 平衡（各层相当） | 归并、二分 |
| 三 | `f(n) = Ω(n^(c+ε))` 且正则条件 | `T(n) = Θ(f(n))` | 根（分解合并） | `2T(n/2)+O(n³)` |

> 正则条件：`a·f(n/b) ≤ k·f(n)`，`k<1`（每层代价严格递减）。三种情况之外（如 `f(n)` 与 `n^c` 既非多项式大也非多项式小）主定理不适用，用递归树或 Akra-Bazzi。

## 二、经典应用复杂度速查

| 算法 | 递推关系 | a | b | f(n) | 主定理情况 | 复杂度 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 二分查找 | `T(n)=T(n/2)+O(1)` | 1 | 2 | O(1) | 二 | **O(log n)** | 减治 |
| 归并排序 | `T(n)=2T(n/2)+O(n)` | 2 | 2 | O(n) | 二 | **O(n log n)** | 稳定，O(n) 空间 |
| 快速排序（平均） | `T(n)=2T(n/2)+O(n)` | 2 | 2 | O(n) | 二 | **O(n log n)** | 原地，最坏 O(n²) |
| 最近点对 | `T(n)=2T(n/2)+O(n)` | 2 | 2 | O(n) | 二 | **O(n log n)** | 带状检查 |
| Karatsuba | `T(n)=3T(n/2)+O(n)` | 3 | 2 | O(n) | 一 | **O(n^1.585)** | 3 子乘代 4 |
| Strassen | `T(n)=7T(n/2)+O(n²)` | 7 | 2 | O(n²) | 一 | **O(n^2.807)** | 7 子乘代 8 |
| 朴素矩阵乘 | — | — | — | — | — | **O(n³)** | Strassen 对比基准 |
| 朴素大整数乘 | — | — | — | — | — | **O(n²)** | Karatsuba 对比基准 |

## 三、分治代码模板

### 通用模板

```js
function solve(problem) {
  if (isSmallEnough(problem)) return solveDirectly(problem); // 边界
  const subs = divide(problem);        // ① 分
  const results = subs.map(solve);     // ② 治（递归）
  return combine(results);             // ③ 合
}
```

### 归并排序（分治全体现）

```js
function mergeSort(a) {
  if (a.length <= 1) return a;
  const mid = a.length >> 1;                       // 分
  const L = mergeSort(a.slice(0, mid));            // 治
  const R = mergeSort(a.slice(mid));
  return merge(L, R);                              // 合
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

### 快速排序（合隐式）

```js
function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;
  const p = partition(a, lo, hi);     // 分（partition 已就位）
  quickSort(a, lo, p - 1);            // 治
  quickSort(a, p + 1, hi);            // 治（无显式合）
}
function partition(a, lo, hi) {
  const pivot = a[hi]; let i = lo;
  for (let j = lo; j < hi; j++)
    if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
  [a[i], a[hi]] = [a[hi], a[i]];
  return i;
}
```

### 二分查找（减治）

```js
function binarySearch(a, t) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === t) return mid;
    a[mid] < t ? (lo = mid + 1) : (hi = mid - 1);
  }
  return -1;
}
```

## 四、分治 vs DP vs 贪心 vs 减治

| 范式 | 子问题关系 | 是否记忆化 | 典型 | 复杂度特征 |
| --- | --- | --- | --- | --- |
| **分治** | 独立（不重叠） | 否 | 归并、快排、最近点对 | 多项式（n log n 等） |
| **减治** | 只留一个（a=1） | 否 | 二分、插入排序 | 常为 O(log n) 或 O(n²) |
| **DP** | 重叠 | 是（记忆化/填表） | 背包、LCS、斐波那契 | 指数压多项式 |
| **贪心** | 无子问题（每步取最优） | 否 | 哈夫曼、Dijkstra | 常为 O(n log n) |

**判据**：
- 子问题**不重叠 → 分治**（归并左右两半独立）。
- 子问题**重叠 → DP**（朴素递归斐波那契 O(2ⁿ)，加记忆化 O(n)）。
- 能**局部最优即全局最优 → 贪心**（需严格证明）。
- 每次只**缩小一半/一个 → 减治**（二分 a=1）。

## 五、易错点清单

- **子问题划分不均**：快排退化（有序+端点 pivot）导致 a=1、b≈1，递归深度 n、复杂度 O(n²)——**随机化 pivot** 规避。
- **合并代价被忽略**：分治总复杂度 = 分 + 子问题 + 合；若 `combine` 退化到 O(n²)，整体比暴力还差（如朴素矩阵分块不减乘法数仍是 O(n³)）。
- **递归深度过大**：每次只减 1（如 `T(n)=T(n-1)+O(1)`）深度 n，易栈溢出；每次除以 b 深度 log_b n 才安全——大 n 时考虑改迭代。
- **主定理用错情况**：必须先算 `c=log_b a` 再比较 `f(n)` 与 `n^c`；混淆「叶子主导」与「根主导」会得错误结论。
- **主定理不适用却硬套**：子问题规模不均（如 `T(n)=T(n/3)+T(2n/3)`）不满足 `n/b` 形式——用 Akra-Bazzi 或递归树。
- **情况三忘正则条件**：`f(n) > n^c` 还需 `a·f(n/b) ≤ k·f(n)`（k<1），否则结论不一定成立。
- **二分前提遗漏**：二分要求**有序 + 随机访问**；链表不能二分（无法 O(1) 取中点）。
- **最近点对带状忘按 y 排序**：带内若不按 y 排序，每点要比 O(n) 个邻居，退化到 O(n²)；按 y 排序后每点只比常数个（≤7）。
- **误把重叠当独立**：朴素递归斐波那契 `fib(n)=fib(n-1)+fib(n-2)` 子问题重叠，是 DP 问题却用分治 → O(2ⁿ)；必须记忆化。
- **Strassen/Karatsuba 的常数陷阱**：理论更优但常数大，小规模反而比朴素慢——实战设阈值，小于阈值切朴素。
- **减治 vs 分治混淆**：二分是减治（a=1）非典型分治，无「合」步骤；归并才是完整三步的分治。

## 六、进阶方向（链接其他叶）

- **动态规划**：子问题重叠时分治的升级版 —— 见[动态规划基础](../dp-basics/) 叶
- **二分查找专题**：减治的深入 —— 见二分查找叶
- **排序算法**：归并/快排的分治实现 —— 见排序叶
- **回溯与分支限界**：分治 + 剪枝 —— 见回溯叶

## 权威链接

- [分治算法 - 维基百科](https://zh.wikipedia.org/wiki/%E5%88%86%E6%B2%BB%E6%B3%95)
- [主定理 - 维基百科](https://zh.wikipedia.org/wiki/%E4%B8%BB%E5%AE%9A%E7%90%86)
- [Divide and Conquer - GeeksforGeeks](https://www.geeksforgeeks.org/divide-and-conquer-algorithm-introduction/)
- [Strassen 矩阵乘法 - 维基百科](https://zh.wikipedia.org/wiki/Strassen%E6%BC%94%E7%AE%97%E6%B3%95)
- [Karatsuba 算法 - 维基百科](https://zh.wikipedia.org/wiki/Karatsuba%E7%AE%97%E6%B3%95)
- 交互演示：[归并排序可视化](https://algo.illegalscreed.cn/docs/merge-sort)、[快速排序可视化](https://algo.illegalscreed.cn/docs/quick-sort)
- 本站幻灯片：<a href="/SlideStack/divide-conquer-slide/" target="_blank">分治算法</a>
