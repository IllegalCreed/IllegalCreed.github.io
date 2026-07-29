---
layout: doc
outline: [2, 3]
---

# 参考：二分变体 API、模板与适用速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **二分的广义本质**：只要存在判定 `check(x)` 关于 `x` 单调，就能对 `x` 二分——**单调性 ⇒ 可二分**。
- **三变体定位**：旋转数组搜索（对下标，部分有序）、二分答案（对值域，可行性单调）、三分（对自变量，函数单峰/单谷）。
- **旋转数组搜索**：先判断 `mid` 在哪段、哪半有序（`nums[lo] <= nums[mid]` ⇒ 左半有序），再判断 `target` 在不在这有序半边——O(log n)（无重复）。
- **找旋转点（最小值）**：`nums[mid]` 与 `nums[hi]` 比较，`nums[mid] > nums[hi]` 则 `lo = mid+1`，否则 `hi = mid`——O(log n)（无重复）。
- **含重复退化**：`nums[mid] == nums[hi]` 时只能 `hi--`，最坏 O(n)。
- **二分答案**：对答案值域 `[L, R]` 二分，`check(mid)` 验证，可行性单调即可——O(log(值域) × check)。
- **三分法**：单峰/单谷函数，`m1 = lo + (hi-lo)/3`、`m2 = hi - (hi-lo)/3`，比较 `f(m1)` 与 `f(m2)` 排除一侧——O(log n)（底数 1.5）。
- **适用对比**：旋转数组（部分有序查值）、二分答案（最优化、最大化最小值类）、三分（凸函数求极值）。
- **交互演示**：[旋转数组搜索](https://algo.illegalscreed.cn/docs/rotated-search)、[二分答案](https://algo.illegalscreed.cn/docs/binary-answer)、[三分查找](https://algo.illegalscreed.cn/docs/ternary-search)。

## 一、三变体复杂度表

| 变体 | 搜索对象 | 单调性来源 | 时间复杂度 | 空间 |
| --- | --- | --- | --- | --- |
| 朴素二分 | 下标 | 整体有序 | O(log n) | O(1) |
| 旋转数组搜索（无重复） | 下标 | 两段各自有序 | O(log n) | O(1) |
| 旋转数组搜索（含重复） | 下标 | 部分有序 | 最坏 O(n) | O(1) |
| 找旋转点（最小值，无重复） | 下标 | 两段各自有序 | O(log n) | O(1) |
| 二分答案 | 答案值域 | 可行性单调 | O(log(值域) × check) | O(1) |
| 三分法 | 自变量 | 函数单峰/单谷 | O(log n)（底数 1.5） | O(1) |

## 二、旋转数组搜索模板

```js
// LeetCode 33：搜索旋转排序数组（无重复），O(log n)
function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {              // 左半 [lo,mid] 有序
      nums[lo] <= target && target < nums[mid]
        ? (hi = mid - 1) : (lo = mid + 1);    // target 在有序左半？去那 / 否则右半
    } else {                                  // 右半 [mid,hi] 有序
      nums[mid] < target && target <= nums[hi]
        ? (lo = mid + 1) : (hi = mid - 1);    // target 在有序右半？去那 / 否则左半
    }
  }
  return -1;
}

// LeetCode 153：找无重复旋转数组的最小值，O(log n)
function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    nums[mid] > nums[hi] ? (lo = mid + 1) : (hi = mid);
  }
  return nums[lo];
}

// LeetCode 154：含重复元素找最小值，最坏 O(n)
function findMinWithDup(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else if (nums[mid] < nums[hi]) hi = mid;
    else hi--;                                 // 相等：无法判断，去重端点
  }
  return nums[lo];
}
```

## 三、二分答案 check 模板

```js
// 模板 A：求最大的 x 使 check(x) 为真（「最大化最小值」类）
function binaryAnswerMax(lo, hi, check) {
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;            // 上取整 + lo=mid
    check(mid) ? (lo = mid) : (hi = mid - 1);
  }
  return lo;
}

// 模板 B：求最小的 x 使 check(x) 为真（「最小化最大值」类）
function binaryAnswerMin(lo, hi, check) {
  while (lo < hi) {
    const mid = (lo + hi) >> 1;                // 下取整 + hi=mid
    check(mid) ? (hi = mid) : (lo = mid + 1);
  }
  return lo;
}

// check 示例：分裂数组，每段和 ≤ limit 时需要多少段
function checkSplit(nums, limit) {
  let cnt = 1, sum = 0;
  for (const x of nums) {
    if (x > limit) return Infinity;            // 单元素超限，不可行
    if (sum + x > limit) { cnt++; sum = 0; }
    sum += x;
  }
  return cnt;
}
```

**`mid` 取整口诀**：`lo = mid` 配上取整（`+1`），`hi = mid` 配下取整——避免 `lo`、`hi` 相邻时死循环。

## 四、三分模板

```js
// 浮点三分：单峰函数 f 在 [lo, hi] 上求最大值点
function ternaryMax(f, lo, hi) {
  const eps = 1e-8;
  while (hi - lo > eps) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    f(m1) < f(m2) ? (lo = m1) : (hi = m2);     // 单峰：函数值小的一侧排除
  }
  return (lo + hi) / 2;
}

// 整数三分：离散单峰数组在 [lo, hi] 求极大值下标
function ternaryInt(f, lo, hi) {
  while (hi - lo > 2) {
    const m1 = lo + ((hi - lo) >> 2);
    const m2 = hi - ((hi - lo) >> 2);
    f(m1) < f(m2) ? (lo = m1) : (hi = m2);
  }
  let best = lo;
  for (let i = lo + 1; i <= hi; i++) if (f(i) > f(best)) best = i;
  return best;
}
```

## 五、适用场景对比

| 场景 | 首选 | 说明 |
| --- | --- | --- |
| 整体有序数组查值 | 朴素二分 | `nums[mid]` 与 `target` 比 |
| 旋转数组查目标值 | 旋转数组搜索 | 先判哪半有序 |
| 旋转数组找最小值 | 找旋转点 | `nums[mid]` 与 `nums[hi]` 比 |
| 含重复旋转数组 | 退化搜索 | `==` 时 `hi--`，最坏 O(n) |
| 最大化最小值 / 最小化最大值 | 二分答案 | 可行性单调 |
| 第 k 小 / 可行性判定 | 二分答案 | 值域二分 + check |
| 凸/凹函数求极值 | 三分法 | 函数单峰/单谷 |
| 多峰函数求极值 | 不适用三分 | 需爬山/模拟退火等 |

## 六、易错点清单

- **旋转数组判断「左半有序」漏等号**：`nums[lo] <= nums[mid]` 必须含等号（`lo == mid` 单元素情况）。
- **旋转数组端点比较不严格**：左侧 `nums[lo] <= target`、右侧 `target <= nums[hi]`，中间用 `<`（`=== target` 已先 return）。
- **找最小值用 `nums[hi]` 不用 `nums[lo]`**：用 `nums[lo]` 在某些旋转情况判断反。
- **找最小值 `hi = mid` 不是 `mid - 1`**：`mid` 可能是答案，不能跳过。
- **含重复数组忘处理 `==`**：`nums[mid] == nums[hi]` 必须 `hi--`，否则死循环或错答。
- **二分答案 `mid` 取整方向错**：`lo = mid` 配上取整，`hi = mid` 配下取整，配错死循环。
- **二分答案未验证单调性**：可行性不单调则整套失效。
- **三分用于多峰函数**：只收敛局部极值，非全局最优。
- **浮点三分精度不够**：`eps` 过大误差大，过小可能因浮点误差死循环，可改固定迭代次数。
- **整数三分终止条件**：`hi - lo > 2`，否则 `m1 == m2` 死循环。

## 七、进阶方向（链接其他叶）

- **朴素二分**：整体有序数组的折半查找 —— 见[二分查找](../../basic/binary-search/) 叶
- **双指针**：有序数组的对撞指针与二分同源 —— 见[双指针与滑动窗口](../../data-structures/basic/array/guide-line/two-pointers-and-sliding-window)
- **单调队列 / 单调栈**：另一类利用单调性的 O(n) 结构 —— 见[单调栈与单调队列](../monotonic-stack-queue/) 叶
- **三分求函数极值**：几何最短距离、凸优化 —— 见[计算几何](../computational-geometry/) 叶

## 权威链接

- [二分查找 - 维基百科](https://zh.wikipedia.org/wiki/%E4%BA%8C%E5%88%86%E6%9F%A5%E6%89%BE%E7%AE%97%E6%B3%95)
- [Search in Rotated Sorted Array - LeetCode 33](https://leetcode.com/problems/search-in-rotated-sorted-array/)
- [Find Minimum in Rotated Sorted Array - LeetCode 153](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)
- [Ternary Search - CP-Algorithms](https://cp-algorithms.com/num_methods/ternary_search.html)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/rotated-search" target="_blank" rel="noopener noreferrer">旋转数组搜索可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/binary-answer" target="_blank" rel="noopener noreferrer">二分答案可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/ternary-search" target="_blank" rel="noopener noreferrer">三分查找可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/binary-search-variants-slide/" target="_blank">二分查找变体</a>
