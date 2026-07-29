---
layout: doc
outline: [2, 3]
---

# 参考：希尔排序 API、复杂度与 gap 序列速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **定义**：希尔排序 = 多轮（gap 从大到小）**分组插入排序**；gap=g 时按下标对 g 取模分组，每组内部做步长为 g 的插入排序；gap 缩到 1 即普通插入排序。
- **核心复杂度**：平均约 **O(n^1.3)**（依赖 gap 序列）；最好 O(nlog²n) ~ O(nlogn)；最坏 Shell 原版 O(n²)、Knuth O(n^1.5)、Sedgewick O(n^(4/3))。
- **空间 O(1)**：原地、迭代、无递归栈。
- **不稳定**：分组机制破坏相等元素相对次序，无法修复。
- **gap 序列**：Shell 原版（n/2 减半，最坏 O(n²)）/ Knuth（`3h+1`，最坏 O(n^1.5)）/ Sedgewick（两式交错，最坏 O(n^(4/3))）。
- **为何突破 O(n²)**：跨距离交换让元素一次跨越多步接近终位，不像插入只能相邻挪动。
- **统一框架**：外层遍历 gap 序列，内层是「步长 gap 的插入排序」（把 `1` 换成 `gap`）。
- **何时用**：中等规模数据（几百~几千）、嵌入式/资源受限、库排序小数组兜底——常数小、无递归、原地、极简。
- **何时不该用**：需要稳定性、数据量极大（渐近不如 O(nlogn)）。
- **交互演示**：[希尔排序可视化](https://algo.illegalscreed.cn/docs/shell-sort)。

## 一、复杂度表（依赖 gap 序列）

| gap 序列 | 最好 | 平均（经验） | 最坏 | 空间 | 稳定 |
| --- | --- | --- | --- | --- | --- |
| Shell 原版（n/2 减半） | O(nlogn) | ~O(n^1.3) | **O(n²)** | O(1) | 否 |
| Hibbard（2^k − 1） | O(nlog²n) | ~O(n^1.25) | O(n^1.5) | O(1) | 否 |
| Knuth（3h+1） | O(nlogn) | ~O(n^1.25) | **O(n^1.5)** | O(1) | 否 |
| Sedgewick | O(nlogn) | ~O(n^(4/3)) | **O(n^(4/3))** | O(1) | 否 |
| Pratt（2^p·3^q） | O(nlog²n) | O(nlog²n) | O(nlog²n) | O(1) | 否 |

> 希尔排序**没有统一的复杂度**——表里每一行对应一个 gap 序列。选序列就是选复杂度保证。

## 二、各 gap 序列对比

| 序列 | 取值示例 | 递推/生成 | 最坏 | 适用 |
| --- | --- | --- | --- | --- |
| Shell 原版 | n/2, n/4, …, 1 | `gap >>= 1` | O(n²) | 教学、快速实现 |
| Hibbard | 1,3,7,15,… | `2^k − 1` | O(n^1.5) | 相邻互质，较稳 |
| Knuth | 1,4,13,40,… | `h = 3h+1` | O(n^1.5) | **教科书/工程默认** |
| Sedgewick | 1,5,19,41,109,… | 两式交错 | O(n^(4/3)) | **实际最快** |
| Pratt | 1,2,3,4,6,8,9,… | `2^p·3^q` | O(nlog²n) | 理论好，项多常数大 |

**选型建议**：够用就行选 Shell 原版；平衡选 Knuth；追性能选 Sedgewick。

## 三、代码模板

### 希尔排序通用框架（Shell 原版序列）

```js
function shellSort(a) {
  const n = a.length;
  for (let gap = n >> 1; gap >= 1; gap >>= 1) {   // gap: n/2 → 1
    for (let i = gap; i < n; i++) {                 // 每组插入排序
      const tmp = a[i];
      let j = i;
      while (j >= gap && a[j - gap] > tmp) {        // 跨 gap 比较
        a[j] = a[j - gap];
        j -= gap;
      }
      a[j] = tmp;
    }
  }
  return a;
}
```

### Knuth 序列版本

```js
function shellSortKnuth(a) {
  const n = a.length;
  let h = 1;
  while (h < n / 3) h = 3 * h + 1;   // 1, 4, 13, 40, … 取最大 < n/3
  for (; h >= 1; h = Math.floor(h / 3)) {
    for (let i = h; i < n; i++) {
      const tmp = a[i];
      let j = i;
      while (j >= h && a[j - h] > tmp) { a[j] = a[j - h]; j -= h; }
      a[j] = tmp;
    }
  }
  return a;
}
```

### Sedgewick 序列版本

```js
function shellSortSedgewick(a) {
  const n = a.length;
  const gaps = [];
  for (let k = 0; ; k++) {
    const x = 9 * (1 << (2 * k)) - 9 * (1 << k) + 1;        // 1,19,109,…
    const y = (1 << (2 * k + 4)) - 3 * (1 << (k + 2)) + 1;  // 5,41,209,…
    if (x > n && y > n) break;
    if (x <= n) gaps.push(x);
    if (y <= n) gaps.push(y);
  }
  gaps.sort((p, q) => q - p);          // 降序，从大到小用
  for (const gap of gaps) {
    for (let i = gap; i < n; i++) {
      const tmp = a[i];
      let j = i;
      while (j >= gap && a[j - gap] > tmp) { a[j] = a[j - gap]; j -= gap; }
      a[j] = tmp;
    }
  }
  return a;
}
```

## 四、与插入排序、快速排序对比

| 维度 | 希尔排序 | 插入排序 | 快速排序 |
| --- | --- | --- | --- |
| 平均时间 | ~O(n^1.3) | O(n²) | **O(nlogn)** |
| 最好时间 | O(nlogn) | **O(n)** | O(nlogn) |
| 最坏时间 | O(n²)~O(n^1.5)（序列） | O(n²) | O(n²) |
| 空间 | **O(1)** | **O(1)** | O(logn)（栈） |
| 稳定 | 否 | **是** | 否 |
| 关系 | 插入的推广 | 希尔 gap={1} 的特例 | 独立（分治+分区） |
| 中等规模 | **实用** ✅ | 慢 | 快但需递归 |

**关键**：希尔 = 「插入排序的工程增强版」，用 gap 分组突破 O(n²)；插入 = 希尔只跑 gap=1 一轮；快排 = 完全不同的分治思路，渐近更优但实现更复杂。

## 五、易错点清单

- **gap 序列忘缩到 1**：任何 gap 序列最后一项**必须是 1**，否则无法消除所有相邻逆序，结果不正确。Shell 原版用 `gap >>= 1`、Knuth 用 `h = floor(h/3)` 都要保证落到 1。
- **内层循环从 `i = gap` 而非 `i = 1`**：步长是 gap，第一个待插入元素下标是 gap（前面 `0~gap-1` 是各组的首元素，天然有序）。
- **`j >= gap` 边界**：跨 gap 比较时下标不能小于 gap（否则 `a[j-gap]` 越界），写 `while (j >= gap && …)`。
- **误以为希尔是稳定排序**：希尔**固有不稳定**，分组破坏相等元素次序——需要稳定排序时换归并/Timsort。
- **把平均 O(n^1.3) 当严格证明**：这是经验值和特定序列上界，希尔精确复杂度至今是开放问题，别写成「数学证明的最优」。
- **Shell 原版当万能序列**：Shell 原版最坏仍 O(n²)，存在退化输入；追求最坏保证用 Knuth（O(n^1.5)）或 Sedgewick（O(n^1.3)）。
- **Knuth 序列初始 h 算错**：应是「最大的 `< n/3` 的 h」，写 `while (h < n/3) h = 3*h+1`；若写成 `< n` 会多跑无用的大 gap 轮。
- **Sedgewick 序列生成错误**：两个公式交错合并，注意是 `9·4^k−9·2^k+1` 与 `4^(k+2)−3·2^(k+2)+1`，别混用 k 的范围。
- **gap 之间有公因子**：自造 gap 序列时要保证相邻 gap 互质（如 3 倍关系），否则退化。

## 权威链接

- [希尔排序 - 维基百科](https://zh.wikipedia.org/wiki/%E5%B8%8C%E5%B0%94%E6%8E%92%E5%BA%8F)
- [Shellsort - Wikipedia](https://en.wikipedia.org/wiki/Shellsort)
- [Shell Sort - GeeksforGeeks](https://www.geeksforgeeks.org/shellsort/)
- [Shellsort - Visualgo](https://visualgo.net/en/sorting)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/shell-sort" target="_blank" rel="noopener noreferrer">希尔排序可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/shell-sort-slide/" target="_blank">希尔排序</a>
