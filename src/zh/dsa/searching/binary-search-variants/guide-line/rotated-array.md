---
layout: doc
outline: [2, 3]
---

# 旋转数组搜索：部分有序的二分

> 基于通用算法套路 · 核于 2026-07

## 速查

- **旋转排序数组的性质**：把升序数组在某个点「断开旋转」（如 `[1,2,3,4,5,6,7]` 旋转成 `[4,5,6,7,0,1,2]`），结果**拆成两段，各自仍升序**，且左段任一元素 ≥ 右段任一元素。
- **搜索目标值（无重复，O(log n)）**：取 `mid`，**先判断 `mid` 落在哪段（哪半边有序）**：`nums[lo] <= nums[mid]` ⇒ 左半有序，否则右半有序。再判断 `target` 在不在那半有序区间里，决定收 `lo` 还是 `hi`。
- **核心判定**：每轮**至少有一半是严格有序的**，只要判断 `target` 在不在这有序的一半——在则去那半找，不在则去另一半。
- **找旋转点 = 找最小值**：旋转后最小值位置即「断点」。用 `nums[mid]` 与 `nums[hi]` 比较：`nums[mid] > nums[hi]` ⇒ 最小在右半（`lo = mid+1`），否则最小在左半含 `mid`（`hi = mid`）。
- **找旋转点模板**：`while (lo < hi) { mid = (lo+hi)>>1; nums[mid] > nums[hi] ? (lo=mid+1) : (hi=mid); }`，结束时 `lo` 即最小值下标。
- **含重复元素的退化**：当 `nums[mid] == nums[hi]`（或 `== nums[lo]`）时无法判断哪段有序（如 `[1,1,1,2,1]` 的 `mid=2` 处值为 1 等于 `nums[hi]=1`），只能 `hi--`（或 `lo++`）逐个排除，**最坏 O(n)**。
- **复杂度**：搜索目标 / 找最小值，无重复 O(log n)；有重复最坏 O(n)。
- **易错点**：判断「左半有序」用 `nums[lo] <= nums[mid]`（含等号，处理 `lo==mid` 的单元素情况）；判断「目标在有序半边」用**闭区间端点比较**；找最小值时「大于」才右移、其余左移（含 `mid` 本身）。
- **经典题**：LeetCode 33（搜索旋转数组）、153（找最小值）、81（含重复搜索）、154（含重复找最小值）。

## 一、旋转数组的结构

把升序数组 `[0,1,2,4,5,6,7]` 在下标 3 旋转（把前 4 个搬到后面），得到：

```
原序： [0, 1, 2, 4, 5, 6, 7]
旋转： [4, 5, 6, 7, 0, 1, 2]
         左段      右段
```

关键观察：**左段 `[4,5,6,7]` 升序、右段 `[0,1,2]` 升序**，且左段所有元素 > 右段所有元素（无重复时严格大于）。旋转点（断点）在左段与右段交界处——也就是最小值 `0` 所在位置。

## 二、搜索目标值：先判断哪半有序

朴素二分失效的原因：`nums[lo]` 不一定 ≤ `nums[mid]`，无法直接判断 `target` 在左半还是右半。但有个关键性质：**对任意 `mid`，`[lo, mid]` 和 `[mid, hi]` 中至少有一半是严格有序的**。

### 判定流程

```js
// LeetCode 33：搜索旋转排序数组（无重复），O(log n)
function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {          // 左半 [lo, mid] 有序
      if (nums[lo] <= target && target < nums[mid])
        hi = mid - 1;                      // target 在有序的左半
      else
        lo = mid + 1;                      // 不在左半，去右半
    } else {                               // 右半 [mid, hi] 有序
      if (nums[mid] < target && target <= nums[hi])
        lo = mid + 1;                      // target 在有序的右半
      else
        hi = mid - 1;                      // 不在右半，去左半
    }
  }
  return -1;
}
```

### 为什么对

每轮先确认哪半有序，再判断 `target` 在不在这有序的一半：

- **在有序半边**：因为那半严格有序，闭区间端点比较就能确定 `target` 是否在范围里，直接折半。
- **不在有序半边**：那 `target` 必在另一半，把区间收过去。

无论哪种情况，区间都砍半——所以是 O(log n)。

## 三、找旋转点（最小值）

最小值位置即断点。判定用 `nums[mid]` 与 `nums[hi]` 比较：

```js
// LeetCode 153：找无重复旋转数组的最小值，O(log n)
function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {                        // 注意是 lo < hi，结束时 lo==hi
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1; // mid 比 hi 大，最小在右半（不含 mid）
    else hi = mid;                          // mid ≤ hi，最小在左半（含 mid）
  }
  return nums[lo];
}
```

**关键**：用 `nums[hi]` 做参照（不是 `nums[lo]`）。因为最小值在右段右端方向，`nums[mid] > nums[hi]` 说明 `mid` 还在左段（较大值段），最小值必在 `mid` 右侧。

## 四、含重复元素的退化 O(n)

当数组含重复元素时，可能出现 `nums[mid] == nums[hi]`，此时无法判断哪段有序：

```
[1, 1, 1, 2, 1]  →  mid=2，nums[mid]=1 == nums[hi]=1
无法确定最小在左半还是右半
```

只能保守地 `hi--`（或 `lo++`）去掉一个端点，逐个排查：

```js
// LeetCode 154：含重复元素的旋转数组找最小值，最坏 O(n)
function findMinWithDup(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1; // 严格大于，最小在右
    else if (nums[mid] < nums[hi]) hi = mid;// 严格小于，最小在左（含 mid）
    else hi--;                              // 相等：无法判断，去重一个端点
  }
  return nums[lo];
}
```

构造 `[1,1,1,...,1,2,1,...,1]` 这类输入时，每次只能缩一个，最坏 O(n)。**这是「部分有序」二分的天花板**——含重复且无法分辨时只能线性。

## 五、易错点

- **判断「左半有序」用 `nums[lo] <= nums[mid]`（含等号）**：`lo == mid` 时（区间只剩两个元素）左半就是 `lo` 一个点，视为有序，必须含等号。
- **「目标在有序半边」的端点比较要严格**：左侧用 `nums[lo] <= target`、右侧用 `target <= nums[hi]`，中间用 `<`（因为 `nums[mid] === target` 已先 return）。
- **找最小值用 `nums[hi]` 不用 `nums[lo]`**：用 `nums[lo]` 在某些旋转情况会判断反。
- **`hi = mid` 而非 `hi = mid - 1`**：找最小值时 `mid` 可能本身就是答案，不能跳过。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/rotated-search" target="_blank" rel="noopener noreferrer">旋转数组搜索可视化演示</a> —— 两段有序与分支判断的二分过程

## 下一步

掌握了「部分有序」的二分后，下一步看二分如何跳出「下标」转向「答案值域」——二分答案是解决最优化问题的通用武器，并与三分法一起见[二分答案与三分法](./binary-answer)。
