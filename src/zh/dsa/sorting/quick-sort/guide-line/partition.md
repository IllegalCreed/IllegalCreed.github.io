---
layout: doc
outline: [2, 3]
---

# 分区策略：Lomuto、Hoare 与三路快排

> 基于通用算法套路 · 核于 2026-07

## 速查

- **分区是快排的灵魂**：选 pivot → 把小于它的挪左、大于它的挪右 → 返回 pivot 最终位置。三种主流实现各有取舍。
- **Lomuto 分区**：单指针 `i` 从左扫，遇 `< pivot` 就 `swap(a[++i], a[j])`，最后 `swap(a[i+1], pivot)`。**简单易写**（教科书首选），但交换次数多、pivot 总偏向一端、对重复元素差。
- **Hoare 分区**：双指针从两端相向（左找 ≥pivot、右找 ≤pivot），找到就交换，相遇即分区点。**交换少、更接近对称**，是最初版快排用的分区，工程更快。
- **三路分区（荷兰国旗）**：`lt`/`i`/`gt` 三指针，分成 `<pivot`、`=pivot`、`>pivot` 三段，中间段直接跳过。**专治大量重复元素**——把全相等输入从 O(n²) 降到 O(n)。
- **pivot 选择的坑**：取首/末元素在有序输入上必退化 O(n²)；正确做法是 **随机化** 或 **三数取中**（`a[lo]`、`a[mid]`、`a[hi]` 的中位数）。
- **随机化快排**：每轮随机选 pivot 再交换到端点，期望 O(n log n)，敌人无法构造确定性最坏输入。
- **三数取中**：取首/中/末的中位数当 pivot，对实际最常见的「几乎有序」输入几乎免疫退化，且零额外开销。
- **复杂度**：分区本身 O(n)；Lomuto/Hoare 平均 O(n log n)、最坏 O(n²)；三路快排在含重复元素时表现更稳。
- **进阶**：分区优化完后，进一步看[工程实践](./engineering)（小数组切插入、尾递归、Introsort）。

## 一、Lomuto 分区：单指针，简单易写

Lomuto 分区用单指针 `i` 维护「小于 pivot 的右边界」：扫描指针 `j` 从 `lo` 走到 `hi-1`，每遇到一个 `a[j] < pivot` 就把它和 `a[i+1]` 交换（即纳入「小于区」），最后把 pivot 换到 `i+1`。pivot 通常取末元素 `a[hi]`。

```js
function lomuto(a, lo, hi) {
  const pivot = a[hi];               // pivot 取末元素
  let i = lo - 1;                    // i = 「小于 pivot 区」的右边界
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) {              // 遇到小于 pivot 的，纳入左区
      i++;
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]]; // pivot 落位
  return i + 1;                      // 返回 pivot 最终下标
}
```

- **优点**：**代码极简**，边界清晰，是《算法导论》和多数教科书的示范实现。
- **缺点**：①**交换次数偏多**（每个小于 pivot 的元素都要交换一次，即使它本就在左侧）；②**pivot 固定偏向一端**（取末元素），对有序输入直接退化 O(n²)；③**对重复元素差**——全相等的输入里每次只能消去 1 个，退化 O(n²)。
- **适用**：教学、快速实现、输入随机且无大量重复的场景。

## 二、Hoare 分区：双指针，交换少

Hoare 分区（快排原作者 Tony Hoare 的最初实现）用双指针从两端相向逼近：`i` 从 `lo-1` 往右找第一个 `≥pivot` 的，`j` 从 `hi+1` 往左找第一个 `≤pivot` 的，找到一对就交换，直到 `i` 和 `j` 相遇，相遇点即为分区点。

```js
function hoare(a, lo, hi) {
  const pivot = a[lo + (hi - lo >> 1)];   // 取中点元素当 pivot
  let i = lo - 1, j = hi + 1;
  while (true) {
    do { i++; } while (a[i] < pivot);     // 左找 ≥ pivot 的
    do { j--; } while (a[j] > pivot);     // 右找 ≤ pivot 的
    if (i >= j) return j;                 // 相遇，返回分区点
    [a[i], a[j]] = [a[j], a[i]];          // 交换左右越界者
  }
}
```

- **优点**：①**交换次数约是 Lomuto 的一半**（只有真正「越界」的对才交换）；②**分区更对称**（pivot 取中点而非端点，对有序输入鲁棒）；③**对重复元素表现更好**（双端都能吸收相等的）。
- **注意**：Hoare 分区**返回的边界 `j` 不一定是 pivot 的最终位置**（pivot 可能还在左段或右段里），所以递归时是 `quickSort(a, lo, j)` 和 `quickSort(a, j+1, hi)`，而**不是** Lomuto 那样跳过 `p`。这是 Hoare 与 Lomuto 在调用层最大的差异，写错会死循环或漏元素。
- **适用**：工程实现、追求性能的场景。C++ 标准库的早期快排、很多手写库都用 Hoare 变体。

## 三、三路快排：专治重复元素

当输入有**大量重复元素**时（极端如全相等），二路分区会退化——因为每个等于 pivot 的元素都堆到一侧，子问题每次只缩小 1。**三路分区（Dijkstra 的荷兰国旗问题）**把数组切成三段：`<pivot`、`=pivot`、`>pivot`，中间段所有元素一次性落位，递归只处理左右两段。

```js
function quickSort3Way(a, lo, hi) {
  if (lo >= hi) return;
  const pivot = a[lo + (hi - lo >> 1)];
  let lt = lo, i = lo, gt = hi;            // [lo,lt-1]<p  [lt,i-1]=p  [gt+1,hi]>p
  while (i <= gt) {
    if (a[i] < pivot)      { [a[lt], a[i]] = [a[i], a[lt]]; lt++; i++; }
    else if (a[i] > pivot) { [a[i], a[gt]] = [a[gt], a[i]]; gt--; }     // i 不动
    else                   { i++; }                                     // 等于区扩大
  }
  quickSort3Way(a, lo, lt - 1);            // 只递归 < 和 > 两段
  quickSort3Way(a, gt + 1, hi);            // = 段已全部落位
}
```

- **关键**：三指针 `lt`（小于区右界）、`i`（扫描）、`gt`（大于区左界）。当 `a[i] > pivot` 时交换到 `gt` 但 `i` **不自增**（因为换回来的 `a[gt]` 还没看过）。
- **复杂度**：全相等输入从 O(n²) **降到 O(n)**（一次分区就全部进入等号区，无递归）；含重复元素的实际数据普遍比二路快排快。
- **适用**：排序键取值范围小（如大量重复的枚举、布尔、小整数）、字符串排序（首字符大量重复）。

## 四、pivot 选择：随机化与三数取中

pivot 选不好是 O(n²) 的唯一根源。两种主流规避手段：

- **随机化快排**：每轮 `swap(a[lo], a[rand(lo, hi)])` 把随机元素换到端点再分区。任何确定性输入在期望意义下都是 O(n log n)，敌人无法构造稳定的「最坏输入」。代价是 `rand()` 本身的开销（可接受）。这是「快排平均 O(n log n)」这一论断的标准保证。
- **三数取中（median-of-three）**：从 `a[lo]`、`a[mid]`、`a[hi]` 中取中位数当 pivot。代价极小（3 次比较 + 几次交换），但对实际最常见的「几乎有序」输入几乎免疫退化——因为有序数组的三个值里中位数就是中间那个，分区恰好 5:5。工程实现几乎必用。

```js
// 三数取中：把 a[lo] a[mid] a[hi] 排序，中位数放到 a[lo] 当 pivot
function median3(a, lo, hi) {
  const mid = lo + (hi - lo >> 1);
  if (a[mid] < a[lo]) [a[lo], a[mid]] = [a[mid], a[lo]];
  if (a[hi]  < a[lo]) [a[lo], a[hi] ] = [a[hi],  a[lo]];
  if (a[hi]  < a[mid])[a[mid],a[hi]] = [a[hi], a[mid]];
  return mid;                              // 中位数位置
}
```

实际工程里两者常结合：先三数取中降低常见退化，再叠加 [Introsort](./engineering)（递归过深切堆排）做最终兜底，彻底消除最坏情况。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/quick-sort" target="_blank" rel="noopener noreferrer">快速排序可视化演示</a> —— Lomuto/Hoare 分区的全过程对比
- <a href="https://algo.illegalscreed.cn/docs/three-way-quick" target="_blank" rel="noopener noreferrer">三路快排可视化</a> —— 三分区如何一次性落位所有等于 pivot 的元素

## 下一步

分区与 pivot 选择搞定后，快排的核心就完整了。下一步看**工程优化**——小数组切插入排序优化常数、尾递归优化控栈深、Dual-pivot 与 Introsort 等真实排序库的实现细节，见[工程实践](./engineering)。
