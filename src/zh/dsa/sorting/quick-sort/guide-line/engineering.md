---
layout: doc
outline: [2, 3]
---

# 工程实践：优化与真实排序实现

> 基于通用算法套路 · 核于 2026-07

## 速查

- **小数组切插入排序**：子段长度 < 阈值（通常 16~47）时改用**插入排序**——小数组上插入排序常数更小（无递归开销、对几乎有序段近线性），工程实现几乎必做。
- **尾递归优化**：对较短的子段递归、较长的子段用 `while` 循环迭代，把递归栈深从最坏 O(n) 压到 O(log n)，防栈溢出。
- **三数取中 + 随机化**：规避有序输入的最坏 O(n²)（见[分区策略](./partition)）。
- **Dual-pivot 快排（双轴）**：Java `Arrays.sort(int[])`、V8（大数组分支）实际用的——选两个 pivot 把数组分三段，比单 pivot 多做几次比较但分区更均衡，实测在随机数据上更快（Yaroslavskiy 2009）。
- **Introsort（内省排序）**：C++ `std::sort`、.NET `Array.Sort` 的实现——**快排 + 堆排 + 插入排序**混合：正常走快排，递归深度超过 `2log₂n` 时切堆排兜底，子段过小切插入排序。**保证最坏 O(n log n)** 同时保持快排的平均速度。
- **快排 vs 归并**：快排**原地、不稳定、缓存友好**；归并**非原地（O(n) 辅助）、稳定、最坏 O(n log n)**。通用排序选快排，要稳定选归并/Timsort。
- **为何 V8 用 Timsort/快排混合**：JS 规范要求 `Array.prototype.sort` **稳定**（ES2019 起），所以 V8 用 **Timsort**（归并+插入的稳定混合）；但小数据/数值数组上仍结合快排思想。Java 对象数组（需稳定）用 Timsort，基本类型（不需稳定）用 Dual-pivot 快排。
- **复杂度对照**：快排平均 O(n log n)/最坏 O(n²)；归并与堆排最坏 O(n log n)；Introsort 兼顾两者。

## 一、小数组切插入排序：优化常数

快排递归到子段很小时（如长度 ≤ 16），递归调用的**固定开销**（函数调用、栈帧、partition 的边界检查）反而超过排序本身的工作量。此时切到**插入排序**更快——插入排序对小数组、几乎有序数组接近 O(n)，且没有递归开销。

```js
function insertionSort(a, lo, hi) {
  for (let i = lo + 1; i <= hi; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= lo && a[j] > key) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
  }
}

const INSERTION_THRESHOLD = 16;            // 经验阈值，通常 12~47
function quickSort(a, lo, hi) {
  while (hi - lo > INSERTION_THRESHOLD) {  // 小段交给插入排序
    const p = partition(a, lo, hi);
    quickSort(a, lo, p - 1);
    lo = p + 1;                            // 右段用 while 迭代（尾递归优化）
  }
  insertionSort(a, lo, hi);                // 一次性把所有小段排好
}
```

- **阈值**：各实现取值不同（C++ libstdc++ 16、Java DualPivotQuicksort 47、Go 12）。过大失去快排优势，过小递归开销占比高。
- **效果**：实测对小数组能快 10%~30%，是几乎所有工业排序库的第一项优化。

## 二、尾递归优化：控制递归深度

快排递归最坏深度 O(n)（退化时），大数组上可能**栈溢出**。尾递归优化的思路：**对较短的子段递归、较长的子段用循环迭代**，这样递归深度被短段的长度限制在 O(log n)。

```js
function quickSort(a, lo, hi) {
  while (lo < hi) {
    const p = partition(a, lo, hi);
    if (p - lo < hi - p) {                 // 左段更短：递归左段，迭代右段
      quickSort(a, lo, p - 1);
      lo = p + 1;
    } else {                               // 右段更短：递归右段，迭代左段
      quickSort(a, p + 1, hi);
      hi = p - 1;
    }
  }
}
```

- **效果**：递归栈深从最坏 O(n) 降到 O(log n)，对百万级数组也安全。
- **配合**：通常与小数组切插入排序、Introsort 一起用，构成完整的工程快排。

## 三、Dual-pivot 快排：Java/V8 的实际选择

2009 年 Vladimir Yaroslavskiy 提出 **Dual-pivot Quicksort**，选**两个 pivot**（`p1 ≤ p2`）把数组分成三段：`<p1`、`[p1, p2]`、`>p2`，然后对三段递归。Java 从 JDK 7 起用它排序基本类型（`Arrays.sort(int[])` 等）。

- **为何更快**：虽然分区多做几次比较，但分区更均衡、扫描更少元素，缓存利用率更高——实测在随机数值数组上比单 pivot 快约 10%。
- **代价**：代码复杂度高，且对某些特定分布（如等差数列）不一定有优势。
- **用在哪**：Java 基本类型排序、V8 的 `Array.prototype.sort`（大数组分支）、Android。

## 四、Introsort：C++ std::sort 的兜底哲学

Introsort（David Musser 1997）= **快排 + 堆排 + 插入排序**的混合，目标是**兼得快排的平均速度与堆排的最坏保证**：

1. 正常走**快排**（三数取中 + 分区）。
2. 递归深度超过阈值 `2·log₂n` 时（说明快排可能在退化），这一支切到**堆排**——堆排最坏 O(n log n)，强行兜底。
3. 子段长度小于阈值（如 16）时切到**插入排序**。

这样**最坏情况一定是 O(n log n)**（堆排保证），平均情况仍是快排的速度。C++ `std::sort`、.NET `Array.Sort`、Rust `slice::sort` 都是 Introsort 的变体。

- **为何不直接用堆排**：堆排最坏 O(n log n) 但常数大、缓存差，平均比快排慢 2~3 倍，所以只在「快排明显退化」时才切。
- **思想**：用「**检测退化 + 切换算法**」替代「赌 pivot 选得好」——这是工业排序库的通用哲学。

## 五、为何 V8 用 Timsort、Java 对象用 Timsort

`Array.prototype.sort`（ES2019 起）和 Java 对象数组（`Arrays.sort(Object[])`）都**要求稳定排序**——相等元素的相对顺序不能变。快排分区交换会打乱相等元素，**本质不稳定**，强行改稳定会拖慢。所以这些场景用：

- **Timsort**（Tim Peters 2002）：归并 + 插入的稳定混合，专 optimized 真实数据中的「天然有序段（run）」，在部分有序数据上接近 O(n)。Python `sorted`/`list.sort`、Java 对象数组、V8 `Array.prototype.sort`、Android 都用 Timsort。
- **规则**：需要稳定 → Timsort/归并；不需要稳定且追求速度 → 快排（Dual-pivot）/Introsort。

## 六、快排 vs 归并 vs 堆排

| 维度 | 快排 | 归并 | 堆排 |
| --- | --- | --- | --- |
| 平均 | **O(n log n)** | O(n log n) | O(n log n) |
| 最坏 | O(n²)（需优化规避） | **O(n log n)** | **O(n log n)** |
| 空间 | **O(log n)** 栈 | O(n) 辅助 | **O(1)** |
| 稳定 | ❌ 不稳定 | ✅ 稳定 | ❌ 不稳定 |
| 缓存 | ✅ 友好 | ✅ 友好 | ❌ 差（跨层跳） |
| 实际速度 | **最快**（常数小） | 次之 | 最慢（常数大） |

**选型**：通用、不限稳定 → 快排（Introsort 兜底）；要稳定 → 归并/Timsort；要 O(1) 空间 + 最坏保证 → 堆排（但慢）。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/quick-sort" target="_blank" rel="noopener noreferrer">快速排序可视化演示</a> —— 工程版快排的递归与切换过程
- <a href="https://algo.illegalscreed.cn/docs/dual-pivot-quick" target="_blank" rel="noopener noreferrer">Dual-pivot 快排可视化</a> —— 双 pivot 三段分区

## 下一步

工程优化讲完，快排的完整图景就有了。最后看一份**速查参考**——复杂度表、Lomuto/Hoare/三路代码模板、优化清单、与归并/堆排对比、易错点，见[参考](../reference)。
