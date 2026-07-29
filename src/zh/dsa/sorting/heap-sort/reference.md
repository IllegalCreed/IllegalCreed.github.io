---
layout: doc
outline: [2, 3]
---

# 参考：堆排序 API、复杂度与对比速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **定义**：原地比较型排序 = 建堆 + 反复「取堆顶极值 + 下沉恢复堆序」。
- **核心套路**：**升序用大根堆**（顶最大换末尾）、**降序用小根堆**（顶最小换末尾）——方向与堆性质相反。
- **下标映射**（0 基）：父 `⌊(i-1)/2⌋`、左子 `2i+1`、右子 `2i+2`、最后非叶子 `⌊n/2⌋-1`。
- **下沉 sift down**：与较大子比较交换，O(log n)；建堆从 `⌊n/2⌋-1` 倒着下沉，**O(n)**（Floyd）。
- **复杂度**：最好/平均/最坏一致 **O(n log n)**；额外空间 **O(1)**；**不稳定**。
- **三大对比**：堆排 = 最坏保证 + 原地（但缓存差、不稳定）；快排 = 平均最快（最坏 O(n²)、不稳定）；归并 = 稳定（O(n) 空间）。
- **Top-K**：维护大小 k 的堆，O(n log k)；或建堆 + k 次取顶 O(n + k log n)——优于全排 O(n log n)。
- **易错**：升序大根堆 / 降序小根堆；下沉找「较大子」；建堆起点 `⌊n/2⌋-1`；n 次循环 `i` 从 `n-1` 到 `1`。
- **边界**：本叶只讲「用堆排序」；堆结构（sift up/down、优先队列）见[堆](../../data-structures/advanced/heap/)叶。
- **交互演示**：[堆排序可视化](https://algo.illegalscreed.cn/docs/heap-sort)。

## 一、核心复杂度表

| 维度 | 堆排序 |
| --- | --- |
| 最好时间 | O(n log n) |
| 平均时间 | O(n log n) |
| 最坏时间 | **O(n log n)** ✅ |
| 建堆阶段 | O(n)（Floyd 自底向下） |
| 排序阶段 | O(n log n)（n 次交换+下沉） |
| 额外空间 | **O(1)**（原地） |
| 稳定性 | **不稳定** |
| 缓存友好 | 差（`2i+1`/`2i+2` 跳跃） |

## 二、完整代码模板（升序）

```js
function heapSort(a) {
  const n = a.length;
  const siftDown = (idx, len) => {           // 大根堆下沉
    while (true) {
      let big = idx;
      const l = 2 * idx + 1, r = 2 * idx + 2;
      if (l < len && a[l] > a[big]) big = l;
      if (r < len && a[r] > a[big]) big = r;
      if (big === idx) break;
      [a[big], a[idx]] = [a[idx], a[big]];
      idx = big;
    }
  };
  for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(i, n); // 建堆 O(n)
  for (let i = n - 1; i > 0; i--) {                        // 排序 O(n log n)
    [a[0], a[i]] = [a[i], a[0]];
    siftDown(0, i);
  }
  return a;
}
```

**降序版**：把 `siftDown` 里两处 `a[l] > a[big]`、`a[r] > a[big]` 的 `>` 改成 `<`（建小根堆、找「较小子」），其余不变。

## 三、与快排、归并对比速查

| 维度 | 堆排序 | 快排 | 归并排序 |
| --- | --- | --- | --- |
| 最好/平均 | O(n log n) | **O(n log n)** | O(n log n) |
| 最坏 | **O(n log n)** ✅ | O(n²) ❌ | O(n log n) |
| 额外空间 | **O(1)** ✅ | O(log n)（栈） | O(n) ❌ |
| 稳定性 | 不稳定 | 不稳定 | **稳定** ✅ |
| 缓存友好 | 差（跳跃）❌ | **好（顺序）** ✅ | 好（顺序） |
| 实际速度 | 慢（常数大） | **最快** | 较快 |
| 通用库 | 内省排序的「兜底」 | 内省排序主体 | Timsort/稳定排序 |

**选型一句话**：要最坏保证+原地 → 堆排；要平均最快 → 快排；要稳定 → 归并；通用 → 内省排序（快排为主+过深切堆排+小段切插排）。

## 四、Top-K 应用速查

| 场景 | 方法 | 复杂度 |
| --- | --- | --- |
| 求前 k 大（全量在内存） | 建大根堆 + k 次取顶 | O(n + k log n) |
| 求前 k 大（流式/内存受限） | 维护大小 k 的**小根堆** | O(n log k)，空间 O(k) |
| 求第 k 大 | 同上，堆顶即第 k 大 | O(n log k) |
| 求前 k 小 | 维护大小 k 的**大根堆** | O(n log k) |

```js
// 流式 Top-K 大：维护大小 k 的小根堆，堆顶是当前第 k 大
function topK(arr, k) {
  const heap = arr.slice(0, k);
  for (let i = (k >> 1) - 1; i >= 0; i--) siftUpMin(heap, i, k); // 建小根堆
  for (let i = k; i < arr.length; i++) {
    if (arr[i] > heap[0]) { heap[0] = arr[i]; siftUpMin(heap, 0, k); }
  }
  return heap; // 大小 k 的数组，堆顶是第 k 大
}
```

## 五、建堆 O(n) 证明速记

```
高度 h 的节点数 ≤ ⌈n / 2^(h+1)⌉，每个下沉 ≤ h 步
总调整 ≤ Σ(h=0→log n) h × ⌈n/2^(h+1)⌉ = (n/2) × Σ h/2^h = (n/2) × 2 = O(n)
```

关键：靠近叶子的节点多但下沉浅，靠近根的节点少但下沉深，加权求和后是线性。

## 六、易错点清单

- **升序用大根堆、降序用小根堆**：方向与堆性质相反，最易记反。口诀「顶沉到底」——升序末尾最大，所以顶要最大，用大根堆。
- **下沉找「较大的子节点」**（大根堆）：找错子节点会破坏堆序（新父可能小于另一个子）。
- **建堆起点是 `⌊n/2⌋-1` 不是 `n-1`**：叶子节点（下标 `⌊n/2⌋` 及以后）无需调整，从最后一个非叶子节点开始。
- **排序循环 `i` 从 `n-1` 到 `1`**（不是到 `0`）：最后一轮 `i=1` 时堆规模 1，无需再交换。
- **下沉时堆的有效长度要传参**：`siftDown(a, 0, i)` 的 `i` 是当前堆规模，不是 `n`（已排好的部分不能参与）。
- **建堆是 O(n) 不是 O(n log n)**：高频考点，记线性证明。
- **堆排序不稳定**：要稳定排序别用堆排，用归并。
- **0 基 vs 1 基下标不同**：本文是 0 基（父 `⌊(i-1)/2⌋`、左子 `2i+1`）；1 基是（父 `⌊i/2⌋`、左子 `2i`），别混。
- **「堆排实际比快排慢」≠「堆排没用」**：堆排价值在最坏保证 + Top-K，不是通用排序速度。

## 七、进阶方向（链接其他叶）

- **堆数据结构**：完全二叉树定义、sift up/down、优先队列 —— 见[堆](../../data-structures/advanced/heap/) 叶
- **快速排序**：平均最快的比较型排序，内省排序主体 —— 见[快速排序](../quick-sort/) 叶
- **归并排序**：稳定的 O(n log n) 排序 —— 见[归并排序](../merge-sort/) 叶
- **Top-K / 优先队列**：堆的动态应用 —— 见[堆](../../data-structures/advanced/heap/) 叶
- **内省排序**：快排 + 堆排 + 插入排序的工业融合 —— 见[内省排序](../intro-sort/) 叶

## 权威链接

- [堆排序 - 维基百科](https://zh.wikipedia.org/wiki/%E5%A0%86%E6%8E%92%E5%BA%8F)
- [Heapsort - GeeksforGeeks](https://www.geeksforgeeks.org/heap-sort/)
- [Build Heap in O(n) - 证明](https://www.geeksforgeeks.org/time-complexity-of-building-a-heap/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/heap-sort" target="_blank" rel="noopener noreferrer">堆排序可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/heap-sort-slide/" target="_blank">堆排序</a>
