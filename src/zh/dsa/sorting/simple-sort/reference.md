---
layout: doc
outline: [2, 3]
---

# 参考：简单排序 API、复杂度与对比速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **三种 O(n²) 排序**：冒泡（相邻交换，稳定，最好 O(n)）、选择（选最小交换，不稳，固定 O(n²) 比较）、插入（插有序区，稳定，最好 O(n)）——空间均 O(1)。
- **最好情况**：冒泡（加优化）/插入 **O(n)**（已有序）；选择 **O(n²)**（与有序无关）。
- **比较次数**：冒泡/插入 O(n²)（最好 O(n)）；选择固定 n(n-1)/2 ≈ O(n²)。
- **交换次数**：冒泡最坏 O(n²)、选择 **O(n)**（最少）、插入 O(n²)（搬移）。
- **稳定性**：冒泡稳 ✅、选择不稳 ❌、插入稳 ✅。判定口诀：相邻交换+相等不动→稳；跨距离交换→不稳。
- **冒泡优化**：①标志位 `swapped` 本轮无交换则 break（最好 O(n)）；②记录最后交换位置 `lastSwap`（减少无效比较）。
- **选择为何不稳**：跨距离交换越过相等元素，反例 `[5a,5b,2] → [2,5b,5a]`。
- **插入工程价值**：n 小（≤32~64）或近有序最快——Java `Arrays.sort`/Python `Timsort`/V8 `Array.sort` 小数组兜底。
- **Timsort run**：天然有序段不足 `minrun`（32~64）时用插入排序补齐，再归并。
- **交互演示**：[冒泡](https://algo.illegalscreed.cn/docs/bubble-sort) · [选择](https://algo.illegalscreed.cn/docs/selection-sort) · [插入](https://algo.illegalscreed.cn/docs/insertion-sort)。

## 一、复杂度对比表

| 排序 | 最好 | 平均 | 最坏 | 空间 | 稳定 |
| --- | --- | --- | --- | --- | --- |
| 冒泡（加优化） | **O(n)** | O(n²) | O(n²) | O(1) | ✅ 稳定 |
| 冒泡（朴素） | O(n²) | O(n²) | O(n²) | O(1) | ✅ 稳定 |
| 选择 | O(n²) | O(n²) | O(n²) | O(1) | ❌ 不稳定 |
| 插入 | **O(n)** | O(n²) | O(n²) | O(1) | ✅ 稳定 |

**备注**：冒泡「最好 O(n)」依赖「无交换即终止」优化；插入「最好 O(n)」源于近有序时每轮只比较一次；选择「最好 O(n²)」因为它无法利用初始有序性。

## 二、比较次数与交换次数对比

| 排序 | 比较次数（最坏） | 交换/搬移次数（最坏） | 比较次数（最好） |
| --- | --- | --- | --- |
| 冒泡 | O(n²) | O(n²)（最多） | O(n)（加优化） |
| 选择 | **n(n-1)/2**（固定） | **O(n)**（最少） | n(n-1)/2（固定） |
| 插入 | O(n²) | O(n²)（连续右移） | **O(n)** |

**要点**：选择交换最少（适合元素大、交换贵的场景），但比较固定 O(n²)（不沾有序的光）；冒泡/插入能沾有序的光，近有序时近 O(n)。

## 三、代码模板

### 冒泡排序（带两种优化）

```js
function bubbleSort(a) {
  const n = a.length;
  let end = n - 1;                       // 内层右边界
  while (end > 0) {
    let lastSwap = 0;                    // 最后交换位置
    for (let j = 0; j < end; j++) {
      if (a[j] > a[j + 1]) {             // 用 >（非 >=）保证稳定
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        lastSwap = j;
      }
    }
    end = lastSwap;                      // 其后已有序；lastSwap=0 即整体有序
  }
  return a;
}
```

### 选择排序

```js
function selectionSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++)
      if (a[j] < a[minIdx]) minIdx = j;  // 严格小于，选最靠前的最小
    if (minIdx !== i) [a[i], a[minIdx]] = [a[minIdx], a[i]];
  }
  return a;
}
```

### 插入排序

```js
function insertionSort(a) {
  const n = a.length;
  for (let i = 1; i < n; i++) {
    const cur = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > cur) {       // 用 >（非 >=）保证稳定
      a[j + 1] = a[j];                   // 连续右移让位
      j--;
    }
    a[j + 1] = cur;                      // 插入
  }
  return a;
}
```

## 四、对比矩阵

| 维度 | 冒泡 | 选择 | 插入 |
| --- | --- | --- | --- |
| 最好 | O(n) | O(n²) | **O(n)** |
| 平均/最坏 | O(n²) | O(n²) | O(n²) |
| 空间 | O(1) | O(1) | O(1) |
| 稳定 | ✅ | ❌ | ✅ |
| 交换次数 | 最多 | **最少** | 中 |
| 利用初始有序 | 能 | 不能 | 能 |
| 缓存友好 | 好 | 一般 | 好 |
| 工程价值 | 教学 | 交换昂贵 | **小数组兜底** |
| 典型场景 | 教学/稳定 | 元素大 | n 小/近有序/在线 |

## 五、易错点清单

- **冒泡忘加提前终止优化**：近乎有序输入退化 O(n²)；务必加 `swapped` 标志或 `lastSwap` 边界。
- **稳定性用错比较符**：冒泡/插入必须用 `>`（严格大于），用 `>=` 会让相等元素也交换/越过，破坏稳定。
- **选择稳定性误判**：以为「选最靠前最小」就稳定——错。不稳定源于**交换**（跨距离），与「选哪个」无关；反例 `[5a,5b,2]`。
- **插入暂存 `cur` 被覆盖**：内层右移会覆盖 `a[i]`，必须先 `const cur = a[i]` 暂存。
- **插入越界**：`while (j >= 0 && ...)` 必须先判 `j >= 0`，否则 `a[-1]` 访问出错。
- **冒泡内层边界**：`j < n - 1 - i`（朴素）或 `j < end`（优化）——末尾已有序，少扫一段。
- **选择 `minIdx !== i` 漏判**：避免自己与自己交换（虽无害但冗余）。
- **以为「交换最少 = 最快」**：选择交换最少但比较固定 O(n²)，平均仍不快；选型看综合。
- **小数据硬上快排**：n ≤ 几十时插入更快，工程上应设阈值切回插入排序。
- **稳定性定义混淆**：稳定指「相等元素相对顺序不变」，不是「结果正确」——所有正确排序结果都对，稳定是更强的性质。

## 六、权威链接与扩展

- [冒泡排序 - 维基百科](https://zh.wikipedia.org/wiki/%E5%86%92%E6%B3%A1%E6%8E%92%E5%BA%8F)
- [选择排序 - 维基百科](https://zh.wikipedia.org/wiki/%E9%80%89%E6%8B%A9%E6%8E%92%E5%BA%8F)
- [插入排序 - 维基百科](https://zh.wikipedia.org/wiki/%E6%8F%92%E5%85%A5%E6%8E%92%E5%BA%8F)
- [排序算法稳定性 - GeeksforGeeks](https://www.geeksforgeeks.org/stability-in-sorting-algorithms/)
- [Timsort - 维基百科](https://zh.wikipedia.org/wiki/Timsort)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/bubble-sort" target="_blank" rel="noopener noreferrer">冒泡</a> · <a href="https://algo.illegalscreed.cn/docs/selection-sort" target="_blank" rel="noopener noreferrer">选择</a> · <a href="https://algo.illegalscreed.cn/docs/insertion-sort" target="_blank" rel="noopener noreferrer">插入</a>
- 本站幻灯片：<a href="/SlideStack/simple-sort-slide/" target="_blank">简单排序</a>
