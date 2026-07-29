---
layout: doc
outline: [2, 3]
---

# 参考：快速排序 API、复杂度与优化速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **定义**：快排 = 分治。选 pivot → 分区（小左大右）→ 递归两边；pivot 分区后即落最终位。
- **复杂度**：平均 **O(n log n)**、最坏 **O(n²)**（有序+取首元素）；空间 **O(log n)** 递归栈（尾递归优化后）。
- **稳定性**：**不稳定**（分区交换打乱相等元素相对序）；需稳定用归并/Timsort。
- **Lomuto 分区**：单指针 `i`，`j` 扫到 `< pivot` 就 `swap(a[++i], a[j])`，末元素当 pivot，返回 `i+1`。
- **Hoare 分区**：双指针相向，左找 `≥pivot`、右找 `≤pivot` 交换，相遇返回 `j`；交换少、更对称，递归用 `(lo,j)` 与 `(j+1,hi)`。
- **三路分区**：`lt`/`i`/`gt` 三指针切成 `<p`/`=p`/`>p`，重复元素一次性落位，全相等输入 O(n)。
- **pivot 选择**：随机化（期望 O(n log n)）/ 三数取中（首中末的中位数，零开销规避有序退化）。
- **优化清单**：小数组切插入（阈值 16~47）/ 尾递归优化（栈深 O(log n)）/ Introsort（深度过 2log₂n 切堆排）/ Dual-pivot（Java 基本类型）。
- **vs 归并**：快排原地不稳定缓存友好；归并稳定但 O(n) 辅助。
- **vs 堆排**：堆排最坏 O(n log n) 且 O(1) 空间，但常数大、缓存差，平均比快排慢 2~3 倍。
- **交互演示**：[快速排序可视化](https://algo.illegalscreed.cn/docs/quick-sort)。

## 一、复杂度表

| 情况 | 时间复杂度 | 触发条件 | 递归深度 |
| --- | --- | --- | --- |
| 最好 | O(n log n) | pivot 恰好是中位数，5:5 分 | O(log n) |
| 平均 | **O(n log n)** | 随机/三数取中 pivot | O(log n) |
| 最坏 | **O(n²)** | 有序输入+取首元素，0:n-1 分 | O(n)（栈溢出风险） |
| 空间 | O(log n) ~ O(n) | 递归栈；尾递归优化后恒 O(log n) | — |
| 稳定性 | **不稳定** | 分区交换打乱相等元素相对序 | — |

**关键数字**：随机化快排期望比较次数 `2n ln n ≈ 1.39 n log₂ n`，仅比信息论下界 `n log₂ n` 多 39%。

## 二、Lomuto 分区模板

```js
// pivot 取末元素，返回 pivot 最终下标
function lomuto(a, lo, hi) {
  const pivot = a[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++)
    if (a[j] < pivot) { i++; [a[i], a[j]] = [a[j], a[i]]; }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
  return i + 1;
}
function quickSortLomuto(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;
  const p = lomuto(a, lo, hi);
  quickSortLomuto(a, lo, p - 1);
  quickSortLomuto(a, p + 1, hi);
}
```

## 三、Hoare 分区模板

```js
// pivot 取中点元素，返回分区点 j（不一定是 pivot 位）
function hoare(a, lo, hi) {
  const pivot = a[lo + (hi - lo >> 1)];
  let i = lo - 1, j = hi + 1;
  while (true) {
    do { i++; } while (a[i] < pivot);
    do { j--; } while (a[j] > pivot);
    if (i >= j) return j;
    [a[i], a[j]] = [a[j], a[i]];
  }
}
function quickSortHoare(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;
  const p = hoare(a, lo, hi);
  quickSortHoare(a, lo, p);          // 注意：包含 p，不是 p-1
  quickSortHoare(a, p + 1, hi);
}
```

## 四、三路分区模板（重复元素最优）

```js
function quickSort3Way(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;
  const pivot = a[lo + (hi - lo >> 1)];
  let lt = lo, i = lo, gt = hi;
  while (i <= gt) {
    if (a[i] < pivot)      { [a[lt], a[i]] = [a[i], a[lt]]; lt++; i++; }
    else if (a[i] > pivot) { [a[i], a[gt]] = [a[gt], a[i]]; gt--; }
    else                   { i++; }
  }
  quickSort3Way(a, lo, lt - 1);
  quickSort3Way(a, gt + 1, hi);
}
```

## 五、工程优化模板（小数组 + 尾递归 + 三数取中）

```js
const INSERT = 16;
function insertionSort(a, lo, hi) {
  for (let i = lo + 1; i <= hi; i++) {
    const key = a[i]; let j = i - 1;
    while (j >= lo && a[j] > key) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
  }
}
function median3(a, lo, hi) {                 // 三数取中，中位数放 a[lo]
  const mid = lo + (hi - lo >> 1);
  if (a[mid] < a[lo]) [a[lo], a[mid]] = [a[mid], a[lo]];
  if (a[hi]  < a[lo]) [a[lo], a[hi] ] = [a[hi],  a[lo]];
  if (a[hi]  < a[mid])[a[mid],a[hi]] = [a[hi], a[mid]];
  return mid;
}
function quickSortEng(a, lo = 0, hi = a.length - 1) {
  while (hi - lo > INSERT) {
    median3(a, lo, hi);
    const p = lomuto(a, lo, hi);              // 配合三数取中后用
    if (p - lo < hi - p) { quickSortEng(a, lo, p - 1); lo = p + 1; }
    else                 { quickSortEng(a, p + 1, hi); hi = p - 1; }
  }
  insertionSort(a, lo, hi);
}
```

## 六、优化清单

| 优化 | 作用 | 代价 | 谁在用 |
| --- | --- | --- | --- |
| 小数组切插入 | 减少递归开销，提速 10~30% | 阈值调参 | 几乎所有工业排序 |
| 尾递归优化 | 栈深 O(n)→O(log n)，防溢出 | 代码稍复杂 | libstdc++/Go |
| 三数取中 | 规避有序退化，零额外开销 | 3 次比较 | libstdc++/Java |
| 随机化 pivot | 期望意义规避最坏 | rand() 开销 | 教学标准实现 |
| 三路分区 | 重复元素 O(n²)→O(n) | 多维护指针 | Java 基本类型排序 |
| Dual-pivot | 随机数据再快 ~10% | 代码复杂 | Java `Arrays.sort(int[])` |
| Introsort（切堆排） | **保证最坏 O(n log n)** | 检测递归深度 | C++ `std::sort`、Rust |

## 七、与归并/堆排对比

| 维度 | 快排 | 归并排序 | 堆排序 |
| --- | --- | --- | --- |
| 平均时间 | **O(n log n)** | O(n log n) | O(n log n) |
| 最坏时间 | O(n²)（需优化规避） | **O(n log n)** | **O(n log n)** |
| 额外空间 | **O(log n)** 栈 | O(n) 辅助数组 | **O(1)** |
| 稳定性 | ❌ 不稳定 | ✅ 稳定 | ❌ 不稳定 |
| 缓存友好 | ✅ 顺序扫描 | ✅ 顺序扫描 | ❌ 跨层跳跃 |
| 实际速度 | **最快**（常数小） | 次之 | 最慢（常数大） |
| 典型实现 | Introsort/C++ std::sort | Timsort/JS sort | 优先队列场景 |

**选型口诀**：通用求快 → 快排（Introsort 兜底）；要稳定 → 归并/Timsort；要 O(1) 空间+最坏保证 → 堆排。

## 八、易错点清单

- **取首/末元素当 pivot + 有序输入**：必退化 O(n²)，新手最常踩；改用随机或三数取中。
- **Hoare 分区递归边界写错**：返回的 `j` 不一定是 pivot 位，递归要用 `(lo, j)` 与 `(j+1, hi)`，写成 `(lo, p-1)` 与 `(p+1, hi)` 会漏元素或死循环。
- **三路分区 `a[i] > pivot` 时 `i` 不自增**：换回来的 `a[gt]` 还没看过，必须再判断一次。
- **退化时栈溢出**：百万级有序数组递归深度 O(n) 会爆栈；必须做尾递归优化。
- **全相等输入用二路快排**：退化 O(n²)；必须用三路分区。
- **阈值取太小**：递归开销占比高，失去切插入排序的意义；通常 12~47。
- **以为快排稳定**：不稳定；需要稳定（如多关键字排序）要换归并/Timsort。
- **以为 O(n²) 无法消除**：Introsort 在工程上保证最坏 O(n log n)。
- **随机化 pivot 忘记换到端点**：直接用随机下标当 pivot 会让分区代码复杂，标准做法是先 swap 到端点再复用模板。

## 九、进阶方向（链接其他叶）

- **归并排序**：稳定的 O(n log n) 对比项 —— 见[归并排序](../merge-sort/) 叶
- **堆排序**：最坏 O(n log n) 的兜底，理解 Introsort 的前提 —— 见[堆排序](../heap-sort/) 叶
- **插入排序**：小数组切插入的依据 —— 见[插入排序](../insertion-sort/) 叶
- **桶排序/计数排序**：非比较型 O(n) 排序 —— 见[线性排序](../linear-sort/) 叶
- **Top K 问题**：快排分区的典型应用（快速选择 quickselect）—— 见[选择算法](../quickselect/) 叶

## 权威链接

- [快速排序 - 维基百科](https://zh.wikipedia.org/wiki/%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F)
- [Quicksort - GeeksforGeeks](https://www.geeksforgeeks.org/quick-sort/)
- [Engineering a Sort Function（Bentley & McIlroy 1993）](https://cs.fit.edu/~pkc/classes/writing/samples/bentley93engineering.pdf)
- [Dual-Pivot Quicksort（Yaroslavskiy 2009）](https://ucs.ru/en/content/matematicheskoe-modelirovanie-i-informatika/item/3443-dual-pivot-quicksort)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/quick-sort" target="_blank" rel="noopener noreferrer">快速排序可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/quick-sort-slide/" target="_blank">快速排序</a>
